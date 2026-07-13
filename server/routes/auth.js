import { Router } from "express";
import db from "../db/connection.js";
import { hashPassword, verifyPassword } from "../auth/passwords.js";
import { signToken } from "../auth/tokens.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { config } from "../config.js";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: config.nodeEnv === "production" ? "none" : "lax",
  secure:   config.nodeEnv === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// All valid programming languages (DSA is handled separately)
const VALID_LANGUAGES = ["javascript","python","java","cpp","c","typescript","go","rust","ruby","swift","kotlin","php"];

function initMasteryForUser(userId, includeProgramming, includeDSA) {
  const insertMastery = db.prepare(
    "INSERT INTO student_topic_mastery (user_id, topic_id, p_mastery) VALUES (?, ?, ?)"
  );
  const topics = [];
  if (includeProgramming) {
    topics.push(...db.prepare("SELECT id FROM topics WHERE topic_set = 'programming'").all());
  }
  if (includeDSA) {
    topics.push(...db.prepare("SELECT id FROM topics WHERE topic_set = 'dsa'").all());
  }

  db.exec("BEGIN");
  try {
    for (const t of topics) insertMastery.run(userId, t.id, 0);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

/**
 * POST /api/auth/register
 * body: {
 *   email, password,
 *   languages: string[],   // one or more programming languages
 *   dsaLanguage: string|null  // language for DSA examples, null = no DSA
 * }
 */
router.post("/register", asyncHandler(async (req, res) => {
  const { email, password, languages, dsaLanguage } = req.body ?? {};

  if (!email || !password || password.length < 8) {
    return res.status(400).json({
      error: "Email and a password of at least 8 characters are required",
    });
  }

  // Validate programming languages
  if (!Array.isArray(languages) || languages.length === 0) {
    return res.status(400).json({ error: "Please select at least one programming language" });
  }
  const invalidLang = languages.find(l => !VALID_LANGUAGES.includes(l));
  if (invalidLang) {
    return res.status(400).json({ error: `Invalid language: ${invalidLang}` });
  }

  // Validate DSA language (optional)
  if (dsaLanguage && !VALID_LANGUAGES.includes(dsaLanguage)) {
    return res.status(400).json({ error: `Invalid DSA language: ${dsaLanguage}` });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash    = await hashPassword(password);
  const preferredLang   = languages[0];
  const topicSet        = dsaLanguage ? "both" : "programming";

  const { lastInsertRowid: userId } = db.prepare(`
    INSERT INTO users
      (email, password_hash, preferred_language, languages, dsa_language, topic_set)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    email, passwordHash, preferredLang,
    JSON.stringify(languages),
    dsaLanguage || null,
    topicSet
  );

  initMasteryForUser(userId, true, !!dsaLanguage);

  const token = signToken({ userId, email });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(201).json({
    id: userId, email,
    preferredLanguage: preferredLang,
    languages,
    dsaLanguage: dsaLanguage || null,
    currentLevel: 1,
    levelCorrectStreak: 0,
  });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken({ userId: user.id, email: user.email });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.json({
    id: user.id,
    email: user.email,
    currentLevel: user.current_level ?? 1,
    levelCorrectStreak: user.level_correct_streak ?? 0,
  });
}));

router.post("/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(204).end();
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare(
    "SELECT id, email, current_level, level_correct_streak FROM users WHERE id = ?"
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    id: user.id,
    email: user.email,
    currentLevel: user.current_level ?? 1,
    levelCorrectStreak: user.level_correct_streak ?? 0,
  });
});

export default router;


