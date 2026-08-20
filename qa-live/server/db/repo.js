const crypto = require('node:crypto');
const db = require('./index');

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function codeInUse(code) {
  const row = db
    .prepare(`SELECT id FROM sessions WHERE code = ? AND status != 'ended'`)
    .get(code);
  return Boolean(row);
}

function createSession(title) {
  let code = generateCode();
  while (codeInUse(code)) code = generateCode();

  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  db.prepare(
    `INSERT INTO sessions (id, code, title, status, created_at) VALUES (?, ?, ?, 'draft', ?)`
  ).run(id, code, title, created_at);

  return getSessionByCode(code);
}

function getSessionByCode(code) {
  return db.prepare(`SELECT * FROM sessions WHERE code = ?`).get(code) || null;
}

function getSessionById(id) {
  return db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) || null;
}

function updateSessionStatus(code, status) {
  const session = getSessionByCode(code);
  if (!session) return null;
  db.prepare(`UPDATE sessions SET status = ? WHERE id = ?`).run(status, session.id);
  return getSessionById(session.id);
}

function createQuestion(sessionId, text, authorLabel = null) {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  db.prepare(
    `INSERT INTO questions (id, session_id, text, author_label, status, upvotes, created_at)
     VALUES (?, ?, ?, ?, 'pending', 0, ?)`
  ).run(id, sessionId, text, authorLabel, created_at);
  return getQuestionById(id);
}

function getQuestionById(id) {
  return db.prepare(`SELECT * FROM questions WHERE id = ?`).get(id) || null;
}

function listQuestions(sessionId, { status } = {}) {
  if (status) {
    if (Array.isArray(status)) {
      const placeholders = status.map(() => '?').join(',');
      return db
        .prepare(
          `SELECT * FROM questions WHERE session_id = ? AND status IN (${placeholders}) ORDER BY upvotes DESC, created_at ASC`
        )
        .all(sessionId, ...status);
    }
    return db
      .prepare(
        `SELECT * FROM questions WHERE session_id = ? AND status = ? ORDER BY upvotes DESC, created_at ASC`
      )
      .all(sessionId, status);
  }
  return db
    .prepare(`SELECT * FROM questions WHERE session_id = ? ORDER BY created_at ASC`)
    .all(sessionId);
}

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'highlighted', 'answered'];

function updateQuestionStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) return null;
  const question = getQuestionById(id);
  if (!question) return null;

  // Only one question highlighted at a time per session.
  if (status === 'highlighted') {
    db.prepare(
      `UPDATE questions SET status = 'approved' WHERE session_id = ? AND status = 'highlighted'`
    ).run(question.session_id);
  }

  db.prepare(`UPDATE questions SET status = ? WHERE id = ?`).run(status, id);
  return getQuestionById(id);
}

function addUpvote(questionId, fingerprint) {
  const question = getQuestionById(questionId);
  if (!question) return { error: 'not_found' };
  if (!['approved', 'highlighted', 'answered'].includes(question.status)) {
    return { error: 'not_votable' };
  }

  const id = crypto.randomUUID();
  try {
    db.prepare(
      `INSERT INTO upvotes (id, question_id, participant_fingerprint) VALUES (?, ?, ?)`
    ).run(id, questionId, fingerprint);
  } catch (err) {
    return { error: 'already_voted' };
  }

  db.prepare(`UPDATE questions SET upvotes = upvotes + 1 WHERE id = ?`).run(questionId);
  return { question: getQuestionById(questionId) };
}

module.exports = {
  createSession,
  getSessionByCode,
  getSessionById,
  updateSessionStatus,
  createQuestion,
  getQuestionById,
  listQuestions,
  updateQuestionStatus,
  addUpvote,
  VALID_STATUSES,
};
