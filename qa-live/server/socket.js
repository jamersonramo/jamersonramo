const repo = require('./db/repo');

// Cada sessao tem duas salas: uma para o painel (ve tudo, inclusive pendentes)
// e outra publica, compartilhada por telao e participantes (so ve o que foi moderado).
function painelRoom(code) {
  return `session:${code}:painel`;
}
function publicRoom(code) {
  return `session:${code}:public`;
}

const PUBLIC_STATUSES = ['approved', 'highlighted', 'answered'];

function buildSnapshot(session, role) {
  const questions =
    role === 'painel'
      ? repo.listQuestions(session.id)
      : repo.listQuestions(session.id, PUBLIC_STATUSES);
  return { session, questions };
}

function initSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join', ({ code, role } = {}) => {
      const normalizedCode = String(code || '').trim();
      const session = repo.getSessionByCode(normalizedCode);
      if (!session) {
        socket.emit('error:join', { message: 'Sessao nao encontrada' });
        return;
      }

      const safeRole = role === 'painel' ? 'painel' : 'public';
      socket.data.code = session.code;
      socket.data.role = safeRole;
      socket.join(safeRole === 'painel' ? painelRoom(session.code) : publicRoom(session.code));

      socket.emit('session:state', buildSnapshot(session, safeRole));
    });
  });
}

// --- Helpers usados pelas rotas HTTP apos escrever no banco ---

function emitSessionState(io, session) {
  io.to(painelRoom(session.code)).emit('session:state', buildSnapshot(session, 'painel'));
  io.to(publicRoom(session.code)).emit('session:state', buildSnapshot(session, 'public'));
}

// Nova pergunta entra pendente: so o painel precisa saber (fila de moderacao).
function emitQuestionNew(io, code, question) {
  io.to(painelRoom(code)).emit('question:new', { question });
}

// Mudanca de status pode afetar visibilidade publica (aprovar, destacar, responder, rejeitar).
function emitQuestionStatusChanged(io, code, question) {
  const payload = { question_id: question.id, status: question.status, question };
  io.to(painelRoom(code)).emit('question:status_changed', payload);
  io.to(publicRoom(code)).emit('question:status_changed', payload);
}

function emitQuestionUpvoted(io, code, question) {
  const payload = { question_id: question.id, upvotes: question.upvotes };
  io.to(painelRoom(code)).emit('question:upvoted', payload);
  io.to(publicRoom(code)).emit('question:upvoted', payload);
}

module.exports = {
  initSocket,
  emitSessionState,
  emitQuestionNew,
  emitQuestionStatusChanged,
  emitQuestionUpvoted,
};
