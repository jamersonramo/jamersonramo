const repo = require('../db/repo');
const { COOKIE_NAME } = require('./cookies');

// Protege rotas de produtor (criar sessão, moderar perguntas).
function requireEditor(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  const editor = repo.getEditorBySessionToken(token);
  if (!editor) return res.status(401).json({ error: 'not_authenticated' });

  req.editor = { id: editor.id, email: editor.email };
  next();
}

module.exports = requireEditor;
