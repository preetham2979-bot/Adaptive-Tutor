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
  // SameSite=None + Secure required for cross-domain cookies (Vercel → Render).
  // SameSite=Lax silently blocks cookies in cross-domain fetch requests.
  sameSite: config.nodeEnv === "production" ? "none" : "lax",
  secure:   config.nodeEnv === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const VALID_LANGUAGES = [
  "javascript", "python", "java", "cpp", "c",
  "typescript", "go", "rust", "ruby", "swift",
  "kotlin", "php", "dsa",
];

function initMasteryForUser(userId, topicSet) {
  const topics = db.prepare("SELECT id FROM topics WHERE topic_set = ?").all(topicSet);
  const insertMastery = db.prepare(
    "INSERT INTO student_topic_mastery (user_id, topic_id, p_mastery) VALUES (?, ?, ?)"
  );
  db.exec("BEGIN");
  try {
    for (const topic of topics) insertMastery.run(userId, topic.id, 0);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

router.post("/register", asyncHandler(async (req, res) => {
  const { email, password, preferredLanguage } = req.body ?? {};

  if (!email || !password || password.length < 8) {
    return res.status(400).json({
      error: "Email and a password of at least 8 characters are required",
    });
  }
  if (!VALID_LANGUAGES.includes(preferredLanguage)) {
    return res.status(400).json({
      error: `preferredLanguage must be one of: ${VALID_LANGUAGES.join(", ")}`,
    });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await hashPassword(password);
  const topicSet     = preferredLanguage === "dsa" ? "dsa" : "programming";

  const { lastInsertRowid: userId } = db
    .prepare("INSERT INTO users (email, password_hash, preferred_language, topic_set) VALUES (?, ?, ?, ?)")
    .run(email, passwordHash, preferredLanguage, topicSet);

  initMasteryForUser(userId, topicSet);

  const token = signToken({ userId, email });
  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(201).json({ id: userId, email, preferredLanguage, currentLevel: 1, levelCorrectStreak: 0 });
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
