// Node's built-in SQLite module (stable as of Node 22.5+, still marked
// "experimental" by Node itself). Deliberately chosen over the
// better-sqlite3 npm package: it ships with Node, so there's no native
// addon to compile, which removes an entire class of "doesn't build on
// the free-tier host" failures. Same synchronous, prepared-statement
// API shape as better-sqlite3.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new DatabaseSync(config.dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

const schemaPath = path.join(__dirname, "schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");
db.exec(schema);

// OTP table is not in schema.sql (added later) — create it here.
db.exec(`
  CREATE TABLE IF NOT EXISTS otp_verifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT    NOT NULL,
    otp        TEXT    NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

// Lightweight migration: schema.sql's CREATE TABLE IF NOT EXISTS won't
// add a column to a users table that already existed before Phase 3.
// A real migration tool would do this properly; for one column on a
// single-developer SQLite file, a guarded ALTER TABLE is enough.
function ensurePreferredLanguageColumn() {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const hasColumn = columns.some((col) => col.name === "preferred_language");
  if (!hasColumn) {
    db.exec(
      "ALTER TABLE users ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'javascript'"
    );
    console.log("Migrated: added users.preferred_language column.");
  }
}
ensurePreferredLanguageColumn();

function ensureLevelColumns() {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const names = columns.map(c => c.name);
  if (!names.includes("current_level")) {
    db.exec("ALTER TABLE users ADD COLUMN current_level INTEGER NOT NULL DEFAULT 1");
    console.log("Migrated: added users.current_level column.");
  }
  if (!names.includes("level_correct_streak")) {
    db.exec("ALTER TABLE users ADD COLUMN level_correct_streak INTEGER NOT NULL DEFAULT 0");
    console.log("Migrated: added users.level_correct_streak column.");
  }
}
ensureLevelColumns();

function ensureTopicSetColumns() {
  const userCols  = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  const topicCols = db.prepare("PRAGMA table_info(topics)").all().map(c => c.name);

  if (!userCols.includes("topic_set")) {
    db.exec("ALTER TABLE users ADD COLUMN topic_set TEXT NOT NULL DEFAULT 'programming'");
    console.log("Migrated: added users.topic_set column.");
  }
  if (!topicCols.includes("topic_set")) {
    db.exec("ALTER TABLE topics ADD COLUMN topic_set TEXT NOT NULL DEFAULT 'programming'");
    console.log("Migrated: added topics.topic_set column.");
  }
}
ensureTopicSetColumns();

/**
 * The original schema had CHECK (preferred_language IN ('javascript','python')).
 * With 13 languages now supported, we need to drop that constraint.
 * SQLite can't ALTER a constraint, so we rebuild the table if needed.
 */
function removeLanguageCheckConstraint() {
  // Probe for the constraint without permanently inserting data
  try {
    db.exec("SAVEPOINT probe_lang");
    db.exec("INSERT INTO users (email,password_hash,preferred_language) VALUES ('__probe__','__probe__','go')");
    db.exec("DELETE FROM users WHERE email='__probe__'");
    db.exec("RELEASE SAVEPOINT probe_lang");
    // Reached here — no constraint, nothing to do
  } catch (err) {
    db.exec("ROLLBACK TO SAVEPOINT probe_lang");
    db.exec("RELEASE SAVEPOINT probe_lang");
    if (!err.message.includes("CHECK constraint")) return;

    console.log("Migrating: rebuilding users table to remove language CHECK constraint...");
    db.exec("PRAGMA foreign_keys = OFF");
    db.exec(`
      BEGIN;
      CREATE TABLE users_rebuilt (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        email                TEXT    NOT NULL UNIQUE,
        password_hash        TEXT    NOT NULL,
        preferred_language   TEXT    NOT NULL DEFAULT 'javascript',
        topic_set            TEXT    NOT NULL DEFAULT 'programming',
        current_level        INTEGER NOT NULL DEFAULT 1,
        level_correct_streak INTEGER NOT NULL DEFAULT 0,
        created_at           TEXT    NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO users_rebuilt
        SELECT id, email, password_hash, preferred_language,
               COALESCE(topic_set,'programming'),
               COALESCE(current_level,1),
               COALESCE(level_correct_streak,0),
               created_at
        FROM users;
      DROP TABLE users;
      ALTER TABLE users_rebuilt RENAME TO users;
      COMMIT;
    `);
    db.exec("PRAGMA foreign_keys = ON");
    console.log("Migrated: CHECK constraint removed. All languages now accepted.");
  }
}
removeLanguageCheckConstraint();

export default db;
