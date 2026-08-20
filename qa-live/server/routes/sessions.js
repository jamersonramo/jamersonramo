const express = require('express');
const QRCode = require('qrcode');
const repo = require('../db/repo');
const { emitSessionState } = require('../socket');

function buildUrls(req, code) {
  const base = `${req.protocol}://${req.get('host')}`;
  return {
    painel_url: `${base}/painel/${code}`,
    telao_url: `${base}/telao/${code}`,
    participante_url: `${base}/participante/${code}`,
  };
}

module.exports = function sessionsRouter(io) {
  const router = express.Router();

  // Cria uma nova sessao (Painel).
  router.post('/sessions', (req, res) => {
    const title = String(req.body?.title || '').trim();
    if (!title) return res.status(400).json({ error: 'title_required' });
    if (title.length > 120) return res.status(400).json({ error: 'title_too_long' });

    const session = repo.createSession(title);
    return res.status(201).json({ session, ...buildUrls(req, session.code) });
  });

  // Busca sessao pelo codigo (usado por Entrar/Telao/Participante para validar).
  router.get('/sessions/:code', async (req, res) => {
    const session = repo.getSessionByCode(req.params.code);
    if (!session) return res.status(404).json({ error: 'not_found' });

    const urls = buildUrls(req, session.code);
    const qr_code = await QRCode.toDataURL(urls.participante_url, {
      margin: 1,
      width: 320,
    });

    return res.json({ session, ...urls, qr_code });
  });

  // Muda status da sessao: draft -> live -> ended (Painel).
  router.post('/sessions/:code/status', (req, res) => {
    const status = req.body?.status;
    if (!['draft', 'live', 'ended'].includes(status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }

    const session = repo.updateSessionStatus(req.params.code, status);
    if (!session) return res.status(404).json({ error: 'not_found' });

    emitSessionState(io, session);
    return res.json({ session });
  });

  return router;
};
