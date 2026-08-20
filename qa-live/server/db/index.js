const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'qa-live.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- draft | live | ended
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    text TEXT NOT NULL,
    author_label TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | highlighted | answered
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_questions_session ON questions(session_id);

  CREATE TABLE IF NOT EXISTS upvotes (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id),
    participant_fingerprint TEXT NOT NULL,
    UNIQUE(question_id, participant_fingerprint)
  );

  CREATE TABLE IF NOT EXISTS editors (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS editor_sessions (
    token TEXT PRIMARY KEY,
    editor_id TEXT NOT NULL REFERENCES editors(id),
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
`);

module.exports = db;
