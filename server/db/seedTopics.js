import db from "./connection.js";
import { PROGRAMMING_TOPICS, DSA_TOPICS } from "../bkt/topics.js";

function seedSet(topics, topicSet) {
  const insert = db.prepare(`
    INSERT INTO topics (slug, name, description, p_init, p_transit, p_guess, p_slip, topic_set)
    VALUES (@slug, @name, @description, @pInit, @pTransit, @pGuess, @pSlip, @topicSet)
  `);

  db.exec("BEGIN");
  try {
    for (const t of topics) insert.run({ ...t, topicSet });
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function seedTopics() {
  const { progCount } = db.prepare(
    "SELECT COUNT(*) as progCount FROM topics WHERE topic_set = 'programming'"
  ).get();
  if (progCount === 0) {
    seedSet(PROGRAMMING_TOPICS, "programming");
    console.log(`Seeded ${PROGRAMMING_TOPICS.length} programming topics.`);
  }

  const { dsaCount } = db.prepare(
    "SELECT COUNT(*) as dsaCount FROM topics WHERE topic_set = 'dsa'"
  ).get();
  if (dsaCount === 0) {
    seedSet(DSA_TOPICS, "dsa");
    console.log(`Seeded ${DSA_TOPICS.length} DSA topics.`);
  }
}
