import { Router } from "express";
import db from "../db/connection.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { updateMastery, isMastered } from "../bkt/bktEngine.js";
import { selectNextTopic } from "../services/topicSelector.js";
import { getDifficultyForLevel, getLevelConfig, MAX_LEVEL, LEVEL_STREAK_THRESHOLD } from "../services/levels.js";
import { generateQuestion } from "../agent/generateQuestion.js";

const router = Router();

/**
 * Maps the stored preferred_language to what the LLM prompt receives.
 * DSA users get Python with an algorithmic-focus instruction; all other
 * languages map to their proper display name (e.g. 'cpp' → 'C++').
 */
const LANGUAGE_FOR_PROMPT = {
  javascript: "JavaScript",
  python:     "Python",
  java:       "Java",
  cpp:        "C++",
  c:          "C",
  typescript: "TypeScript",
  go:         "Go",
  rust:       "Rust",
  ruby:       "Ruby",
  swift:      "Swift",
  kotlin:     "Kotlin",
  php:        "PHP",
  dsa:        "Python — this is a DSA (Data Structures & Algorithms) question. Focus on algorithmic correctness, time/space complexity, and problem-solving patterns. Use Python for all code examples.",
};

/**
 * GET /api/session/next
 *
 * BKT picks the weakest unmastered topic.
 * The student's current level determines how hard the question is.
 * Idempotent: returns the same question if one is already pending.
 */
router.get("/next", requireAuth, asyncHandler(async (req, res) => {
  const existing = db.prepare(`
    SELECT aq.topic_id, aq.difficulty, aq.question, aq.options, aq.hint,
           t.slug, t.name, m.p_mastery as mastery
    FROM active_questions aq
    JOIN topics t ON t.id = aq.topic_id
    JOIN student_topic_mastery m ON m.topic_id = aq.topic_id AND m.user_id = aq.user_id
    WHERE aq.user_id = ?
  `).get(req.user.id);

  if (existing) {
    return res.json({
      topicId: existing.topic_id,
      topicSlug: existing.slug,
      topicName: existing.name,
      difficulty: existing.difficulty,
      language: existing.language ?? 'javascript',
      mastery: existing.mastery,
      question: existing.question,
      options: JSON.parse(existing.options),
      hint: existing.hint,
    });
  }

  const rows = db.prepare(`
    SELECT t.id, t.slug, t.name, t.description, t.topic_set, m.p_mastery as mastery
    FROM topics t
    JOIN student_topic_mastery m ON m.topic_id = t.id
    WHERE m.user_id = ?
  `).all(req.user.id);

  if (rows.length === 0) {
    return res.status(404).json({ error: "No topics found for this student" });
  }

  const user = db.prepare(
    "SELECT preferred_language, languages, dsa_language, current_level FROM users WHERE id = ?"
  ).get(req.user.id);

  // Parse user's language list with fallback to preferred_language
  let userLanguages;
  try {
    userLanguages = JSON.parse(user.languages || "[]");
  } catch { userLanguages = []; }
  if (!userLanguages.length) userLanguages = [user.preferred_language || "javascript"];

  // Avoid giving the same topic back-to-back
  const lastAttempt = db.prepare(
    "SELECT topic_id FROM attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
  ).get(req.user.id);

  const topic      = selectNextTopic(rows, lastAttempt?.topic_id ?? null);
  const difficulty = getDifficultyForLevel(user.current_level);

  // For DSA topics use the dedicated dsa_language; for programming topics
  // rotate randomly through the user's selected language list.
  let rawLanguage;
  if (topic.topic_set === "dsa" && user.dsa_language) {
    rawLanguage = user.dsa_language;
  } else {
    rawLanguage = userLanguages[Math.floor(Math.random() * userLanguages.length)];
  }
  const language = LANGUAGE_FOR_PROMPT[rawLanguage] ?? rawLanguage;

  const generated = await generateQuestion({
    topicName:        topic.name,
    topicDescription: topic.description,
    difficulty,
    language,
  });

  db.prepare("DELETE FROM active_questions WHERE user_id = ?").run(req.user.id);
  db.prepare(`
    INSERT INTO active_questions
      (user_id, topic_id, difficulty, language, question, options, correct_option_index, hint, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, topic.id, difficulty, rawLanguage,
    generated.question, JSON.stringify(generated.options),
    generated.correctOptionIndex, generated.hint, generated.explanation
  );

  res.json({
    topicId:   topic.id,
    topicSlug: topic.slug,
    topicName: topic.name,
    difficulty,
    language:  rawLanguage,
    mastery: topic.mastery,
    question: generated.question,
    options:  generated.options,
    hint:     generated.hint,
  });
}));

/**
 * POST /api/session/answer
 * body: { topicId: number, selectedOptionIndex: number }
 *
 * Grades the answer server-side, runs the BKT update, and tracks the
 * level streak. Returns `levelUpAvailable: true` once the student has
 * answered correctly three times in a row at their current level.
 */
router.post("/answer", requireAuth, (req, res) => {
  const { topicId, selectedOptionIndex } = req.body ?? {};
  if (typeof topicId !== "number" || !Number.isInteger(selectedOptionIndex)) {
    return res.status(400).json({
      error: "topicId (number) and selectedOptionIndex (integer) are required",
    });
  }

  const active = db.prepare(
    "SELECT * FROM active_questions WHERE user_id = ?"
  ).get(req.user.id);

  if (!active || active.topic_id !== topicId) {
    return res.status(409).json({
      error: "No active question for this topic. Call GET /api/session/next first.",
    });
  }

  const topic      = db.prepare("SELECT * FROM topics WHERE id = ?").get(topicId);
  const masteryRow = db.prepare(
    "SELECT p_mastery FROM student_topic_mastery WHERE user_id = ? AND topic_id = ?"
  ).get(req.user.id, topicId);

  const correct        = selectedOptionIndex === active.correct_option_index;
  const pMasteryBefore = masteryRow.p_mastery;
  const pMasteryAfter  = updateMastery(pMasteryBefore, correct, {
    pTransit: topic.p_transit,
    pGuess:   topic.p_guess,
    pSlip:    topic.p_slip,
  });

  // Update mastery
  db.prepare(`
    UPDATE student_topic_mastery
    SET p_mastery = ?, updated_at = datetime('now')
    WHERE user_id = ? AND topic_id = ?
  `).run(pMasteryAfter, req.user.id, topicId);

  // Log attempt
  db.prepare(`
    INSERT INTO attempts (user_id, topic_id, correct, p_mastery_before, p_mastery_after)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, topicId, correct ? 1 : 0, pMasteryBefore, pMasteryAfter);

  // Level streak: increment on correct, reset on incorrect
  const user      = db.prepare(
    "SELECT current_level, level_correct_streak FROM users WHERE id = ?"
  ).get(req.user.id);
  const newStreak = correct ? user.level_correct_streak + 1 : 0;
  const levelUpAvailable =
    newStreak >= LEVEL_STREAK_THRESHOLD && user.current_level < MAX_LEVEL;

  db.prepare("UPDATE users SET level_correct_streak = ? WHERE id = ?")
    .run(newStreak, req.user.id);

  // Clear the active question
  db.prepare("DELETE FROM active_questions WHERE user_id = ?").run(req.user.id);

  const currentLevelCfg = getLevelConfig(user.current_level);
  const nextLevelCfg    = user.current_level < MAX_LEVEL
    ? getLevelConfig(user.current_level + 1)
    : null;

  res.json({
    topicId,
    correct,
    selectedOptionIndex,
    correctOptionIndex: active.correct_option_index,
    masteryBefore:  pMasteryBefore,
    masteryAfter:   pMasteryAfter,
    mastered:       isMastered(pMasteryAfter),
    explanation:    active.explanation,
    // Level info
    currentLevel:      user.current_level,
    currentLevelLabel: currentLevelCfg.label,
    currentLevelEmoji: currentLevelCfg.emoji,
    levelCorrectStreak: newStreak,
    levelUpAvailable,
    nextLevel: nextLevelCfg
      ? { level: nextLevelCfg.level, label: nextLevelCfg.label, emoji: nextLevelCfg.emoji }
      : null,
  });
});

/**
 * POST /api/session/advance-level
 * body: { confirm: boolean }
 *
 * confirm=true  → advance to the next level, reset streak
 * confirm=false → stay at current level, reset streak (avoids the
 *                 prompt showing again immediately)
 */
router.post("/advance-level", requireAuth, (req, res) => {
  const { confirm } = req.body ?? {};
  const user = db.prepare(
    "SELECT current_level FROM users WHERE id = ?"
  ).get(req.user.id);

  let newLevel = user.current_level;
  if (confirm === true && user.current_level < MAX_LEVEL) {
    newLevel = user.current_level + 1;
    db.prepare(
      "UPDATE users SET current_level = ?, level_correct_streak = 0 WHERE id = ?"
    ).run(newLevel, req.user.id);
  } else {
    db.prepare("UPDATE users SET level_correct_streak = 0 WHERE id = ?")
      .run(req.user.id);
  }

  const cfg = getLevelConfig(newLevel);
  res.json({
    currentLevel: newLevel,
    levelName:    cfg.name,
    levelLabel:   cfg.label,
    levelEmoji:   cfg.emoji,
  });
});

export default router;
