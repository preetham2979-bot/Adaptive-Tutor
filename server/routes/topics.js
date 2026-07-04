import { Router } from "express";
import db from "../db/connection.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { isMastered } from "../bkt/bktEngine.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT t.id, t.slug, t.name, t.description, m.p_mastery
       FROM topics t
       JOIN student_topic_mastery m ON m.topic_id = t.id
       WHERE m.user_id = ?
       ORDER BY t.id`
    )
    .all(req.user.id);

  const topics = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    mastery: row.p_mastery,
    mastered: isMastered(row.p_mastery),
  }));

  res.json({ topics });
});

// GET /api/topics/:id/stats — topic details + BKT params + per-topic attempt history
router.get("/:id/stats", requireAuth, (req, res) => {
  const topicId = parseInt(req.params.id, 10);
  if (isNaN(topicId)) return res.status(400).json({ error: "Invalid topic id" });

  const topic = db.prepare("SELECT * FROM topics WHERE id = ?").get(topicId);
  if (!topic) return res.status(404).json({ error: "Topic not found" });

  const masteryRow = db
    .prepare("SELECT p_mastery FROM student_topic_mastery WHERE user_id = ? AND topic_id = ?")
    .get(req.user.id, topicId);

  const attempts = db.prepare(`
    SELECT correct, p_mastery_before, p_mastery_after, created_at
    FROM attempts WHERE user_id = ? AND topic_id = ?
    ORDER BY created_at ASC
  `).all(req.user.id, topicId);

  const totalAttempts  = attempts.length;
  const correctCount   = attempts.filter(a => a.correct === 1).length;
  const accuracy       = totalAttempts > 0 ? correctCount / totalAttempts : 0;

  res.json({
    topic: {
      id:          topic.id,
      name:        topic.name,
      description: topic.description,
      pInit:       topic.p_init,
      pTransit:    topic.p_transit,
      pGuess:      topic.p_guess,
      pSlip:       topic.p_slip,
    },
    mastery:       masteryRow?.p_mastery ?? topic.p_init,
    attempts,
    totalAttempts,
    accuracy,
  });
});

export default router;
