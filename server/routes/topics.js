import { Router } from "express";
import db from "../db/connection.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { isMastered } from "../bkt/bktEngine.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT t.id, t.slug, t.name, t.description, t.topic_set, m.p_mastery
    FROM topics t
    JOIN student_topic_mastery m ON m.topic_id = t.id
    WHERE m.user_id = ?
    ORDER BY t.topic_set, t.id
  `).all(req.user.id);

  res.json({
    topics: rows.map(r => ({
      id:          r.id,
      slug:        r.slug,
      name:        r.name,
      description: r.description,
      mastery:     r.p_mastery,
      mastered:    isMastered(r.p_mastery),
      topicSet:    r.topic_set,
    })),
  });
});

router.get("/:id/stats", requireAuth, (req, res) => {
  const topicId = parseInt(req.params.id, 10);
  if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic id" });

  const topic = db.prepare("SELECT * FROM topics WHERE id = ?").get(topicId);
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const masteryRow = db.prepare(
    "SELECT p_mastery FROM student_topic_mastery WHERE user_id = ? AND topic_id = ?"
  ).get(req.user.id, topicId);

  const attempts = db.prepare(`
    SELECT correct, p_mastery_before, p_mastery_after, created_at
    FROM attempts WHERE user_id = ? AND topic_id = ?
    ORDER BY created_at ASC
  `).all(req.user.id, topicId);

  const correctCount = attempts.filter(a => a.correct === 1).length;

  res.json({
    topic: {
      id: topic.id, name: topic.name, description: topic.description,
      pInit: topic.p_init, pTransit: topic.p_transit,
      pGuess: topic.p_guess, pSlip: topic.p_slip,
    },
    mastery:       masteryRow?.p_mastery ?? topic.p_init,
    attempts,
    totalAttempts: attempts.length,
    accuracy:      attempts.length > 0 ? correctCount / attempts.length : 0,
  });
});

export default router;
