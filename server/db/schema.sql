-- Adaptive Tutor schema
-- Five tables, deliberately simple and fully relational.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  preferred_language TEXT NOT NULL CHECK (preferred_language IN ('javascript', 'python')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per topic. The four BKT parameters live here so each topic
-- can have its own guess/slip/transit/init rates (e.g. a topic prone
-- to lucky guesses should have a higher p_guess).
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  p_init REAL NOT NULL,
  p_transit REAL NOT NULL,
  p_guess REAL NOT NULL,
  p_slip REAL NOT NULL
);

-- The live, current mastery probability per (student, topic) pair.
-- This is the value the BKT engine reads and overwrites on every
-- answer. One row is created per topic the moment a student registers,
-- initialized to that topic's p_init.
CREATE TABLE IF NOT EXISTS student_topic_mastery (
  user_id INTEGER NOT NULL REFERENCES users(id),
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  p_mastery REAL NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, topic_id)
);

-- Full history of every answer, including the before/after mastery
-- values from that specific BKT update. This is what eventually
-- powers a "mastery over time" chart on the frontend.
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  correct INTEGER NOT NULL CHECK (correct IN (0, 1)),
  p_mastery_before REAL NOT NULL,
  p_mastery_after REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per student: the question they were just shown by
-- GET /api/session/next, held here so the correct answer and
-- explanation are NOT sent to the client until they actually submit
-- an answer. POST /api/session/answer reads this row to grade the
-- answer, then deletes it.
CREATE TABLE IF NOT EXISTS active_questions (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  difficulty TEXT NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL,
  correct_option_index INTEGER NOT NULL,
  hint TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
