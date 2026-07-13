import { Router } from "express";
import db from "../db/connection.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

function calcCurrentStreak(sortedDaysDesc) {
  if (!sortedDaysDesc.length) return 0;
  const fmt = (d) => d.toISOString().split("T")[0];
  const today     = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));
  if (sortedDaysDesc[0] !== today && sortedDaysDesc[0] !== yesterday) return 0;
  const set   = new Set(sortedDaysDesc);
  let streak  = 0;
  const start = new Date(sortedDaysDesc[0] === today ? today : yesterday);
  while (set.has(fmt(start))) {
    streak++;
    start.setDate(start.getDate() - 1);
  }
  return streak;
}

function calcLongestStreak(sortedDaysDesc) {
  if (!sortedDaysDesc.length) return 0;
  const asc = [...sortedDaysDesc].reverse();
  let longest = 1, current = 1;
  for (let i = 1; i < asc.length; i++) {
    const diff = (new Date(asc[i]) - new Date(asc[i - 1])) / 86400000;
    if (Math.round(diff) === 1) { current++; longest = Math.max(longest, current); }
    else current = 1;
  }
  return longest;
}

// GET /api/stats/activity — daily attempt counts for heatmap + streak data
router.get("/activity", requireAuth, (req, res) => {
  const uid = req.user.id;

  const activity = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM attempts
    WHERE user_id = ? AND date(created_at) >= date('now', '-84 days')
    GROUP BY day ORDER BY day ASC
  `).all(uid);

  const allDays = db.prepare(`
    SELECT DISTINCT date(created_at) as day
    FROM attempts WHERE user_id = ? ORDER BY day DESC
  `).all(uid).map(r => r.day);

  const { c: totalAttempts } = db.prepare(
    "SELECT COUNT(*) as c FROM attempts WHERE user_id = ?"
  ).get(uid);

  res.json({
    activity,
    currentStreak: calcCurrentStreak(allDays),
    longestStreak: calcLongestStreak(allDays),
    totalAttempts,
  });
});

// GET /api/stats/recent — last 15 answers with topic names
router.get("/recent", requireAuth, (req, res) => {
  const attempts = db.prepare(`
    SELECT a.id, a.correct, a.p_mastery_before, a.p_mastery_after, a.created_at,
           t.name as topic_name, t.id as topic_id
    FROM attempts a JOIN topics t ON t.id = a.topic_id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC LIMIT 15
  `).all(req.user.id);
  res.json({ attempts });
});

export default router;

// Temporary admin view — remove before sharing publicly
router.get("/admin", requireAuth, (req, res) => {
  const users = db.prepare(
    "SELECT id, email, preferred_language, languages, dsa_language, current_level, created_at FROM users"
  ).all();

  const mastery = db.prepare(`
    SELECT u.email, t.name as topic, ROUND(m.p_mastery*100) || '%' as mastery
    FROM student_topic_mastery m
    JOIN users u ON u.id = m.user_id
    JOIN topics t ON t.id = m.topic_id
    ORDER BY u.id, t.id
  `).all();

  const attempts = db.prepare(`
    SELECT u.email, t.name as topic,
           CASE a.correct WHEN 1 THEN 'correct' ELSE 'wrong' END as result,
           ROUND(a.p_mastery_after*100) || '%' as mastery_after,
           a.created_at
    FROM attempts a
    JOIN users u ON u.id = a.user_id
    JOIN topics t ON t.id = a.topic_id
    ORDER BY a.created_at DESC LIMIT 20
  `).all();

  res.json({ users, mastery, recentAttempts: attempts });
});