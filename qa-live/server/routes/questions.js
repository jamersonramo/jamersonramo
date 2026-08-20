const express = require('express');
const repo = require('../db/repo');
const {
  emitQuestionNew,
  emitQuestionStatusChanged,
  emitQuestionUpvoted,
} = require('../socket');

const MAX_LENGTH = 280;

module.exports = function questionsRouter(io) {
  const router = express.Router();

  // Lista perguntas de uma sessao. ?status=approved,highlighted,answered filtra.
  router.get('/sessions/:code/questions', (req, res) => {
    const session = repo.getSessionByCode(req.params.code);
    if (!session) return res.status(404).json({ error: 'not_found' });

    const status = req.query.status ? String(req.query.status).split(',') : undefined;
    const questions = repo.listQuestions(session.id, status ? { status } : {});
    return res.json({ questions });
  });

  // Participante envia uma pergunta -> entra pendente, aparece na fila do Painel.
  router.post('/sessions/:code/questions', (req, res) => {
    const session = repo.getSessionByCode(req.params.code);
    if (!session) return res.status(404).json({ error: 'not_found' });
    if (session.status !== 'live') {
      return res.status(409).json({ error: 'session_not_live' });
    }

    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'text_required' });
    if (text.length > MAX_LENGTH) return res.status(400).json({ error: 'text_too_long' });

    const question = repo.createQuestion(session.id, text);
    emitQuestionNew(io, session.code, question);
    return res.status(201).json({ question });
  });

  // Painel modera: approved | rejected | highlighted | answered.
  router.post('/sessions/:code/questions/:id/status', (req, res) => {
    const session = repo.getSessionByCode(req.params.code);
    if (!session) return res.status(404).json({ error: 'not_found' });

    const question = repo.getQuestionById(req.params.id);
    if (!question || question.session_id !== session.id) {
      return res.status(404).json({ error: 'question_not_found' });
    }

    const previouslyHighlighted =
      req.body?.status === 'highlighted'
        ? repo.listQuestions(session.id, ['highlighted']).filter((q) => q.id !== question.id)
        : [];

    const updated = repo.updateQuestionStatus(req.params.id, req.body?.status);
    if (!updated) return res.status(400).json({ error: 'invalid_status' });

    emitQuestionStatusChanged(io, session.code, updated);
    // A pergunta que estava destacada antes voltou para "approved": avisa os clientes.
    previouslyHighlighted.forEach((q) =>
      emitQuestionStatusChanged(io, session.code, repo.getQuestionById(q.id))
    );
    return res.json({ question: updated });
  });

  // Participante da upvote em pergunta ja aprovada/destacada/respondida.
  router.post('/sessions/:code/questions/:id/upvote', (req, res) => {
    const session = repo.getSessionByCode(req.params.code);
    if (!session) return res.status(404).json({ error: 'not_found' });

    const fingerprint = String(req.body?.fingerprint || '').trim();
    if (!fingerprint) return res.status(400).json({ error: 'fingerprint_required' });

    const result = repo.addUpvote(req.params.id, fingerprint);
    if (result.error === 'not_found') return res.status(404).json({ error: 'question_not_found' });
    if (result.error === 'not_votable') return res.status(409).json({ error: 'not_votable' });
    if (result.error === 'already_voted') return res.status(409).json({ error: 'already_voted' });

    emitQuestionUpvoted(io, session.code, result.question);
    return res.json({ question: result.question });
  });

  return router;
};
