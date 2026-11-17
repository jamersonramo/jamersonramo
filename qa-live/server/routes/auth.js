const express = require('express');
const repo = require('../db/repo');
const { verifyPassword } = require('../auth');
const { setSessionCookie, clearSessionCookie, COOKIE_NAME } = require('../middleware/cookies');

module.exports = function authRouter() {
  const router = express.Router();

  router.post('/auth/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'credentials_required' });

    const editor = repo.getEditorByEmail(email);
    if (!editor || !verifyPassword(password, editor.password_hash)) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    const token = repo.createEditorSession(editor.id);
    setSessionCookie(res, token);
    return res.json({ editor: { id: editor.id, email: editor.email } });
  });

  router.post('/auth/logout', (req, res) => {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) repo.deleteEditorSession(token);
    clearSessionCookie(res);
    return res.status(204).end();
  });

  router.get('/auth/me', (req, res) => {
    const token = req.cookies?.[COOKIE_NAME];
    const editor = repo.getEditorBySessionToken(token);
    if (!editor) return res.status(401).json({ error: 'not_authenticated' });
    return res.json({ editor: { id: editor.id, email: editor.email } });
  });

  return router;
};
