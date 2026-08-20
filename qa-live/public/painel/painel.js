(function () {
  const STORAGE_KEY = 'palcoqa:lastCode';
  let state = { session: null, questions: [] };
  let socket = null;

  const createScreen = document.getElementById('create-screen');
  const panelScreen = document.getElementById('panel-screen');

  function currentCode() {
    return codeFromPath() || localStorage.getItem(STORAGE_KEY) || '';
  }

  async function boot() {
    const code = currentCode();
    if (!code) {
      createScreen.hidden = false;
      return;
    }
    try {
      const data = await api(`/sessions/${code}`);
      localStorage.setItem(STORAGE_KEY, code);
      if (window.location.pathname !== `/painel/${code}`) {
        window.history.replaceState({}, '', `/painel/${code}`);
      }
      renderAccess(data);
      panelScreen.hidden = false;
      connectSocket(code);
    } catch (err) {
      localStorage.removeItem(STORAGE_KEY);
      createScreen.hidden = false;
    }
  }

  function renderAccess(data) {
    document.getElementById('session-code').textContent = data.session.code;
    document.getElementById('qr-code').src = data.qr_code;
    document.getElementById('link-telao').href = data.telao_url;
    document.getElementById('link-participante').href = data.participante_url;
    document.getElementById('session-title').textContent = data.session.title;
  }

  function connectSocket(code) {
    socket = io();
    socket.on('connect', () => socket.emit('join', { code, role: 'painel' }));

    socket.on('session:state', (snapshot) => {
      state.session = snapshot.session;
      state.questions = snapshot.questions;
      renderSession();
      renderQuestions();
    });

    socket.on('question:new', ({ question }) => {
      state.questions.push(question);
      renderQuestions();
      showToast('Nova pergunta recebida');
    });

    socket.on('question:status_changed', ({ question }) => {
      upsertQuestion(question);
      renderQuestions();
    });

    socket.on('question:upvoted', ({ question_id, upvotes }) => {
      const q = state.questions.find((x) => x.id === question_id);
      if (q) q.upvotes = upvotes;
      renderQuestions();
    });
  }

  function upsertQuestion(question) {
    const idx = state.questions.findIndex((q) => q.id === question.id);
    if (idx >= 0) state.questions[idx] = question;
    else state.questions.push(question);
  }

  function renderSession() {
    const s = state.session;
    document.getElementById('session-title').textContent = s.title;
    const statusEl = document.getElementById('session-status');
    statusEl.textContent = { draft: 'Rascunho', live: 'Ao vivo', ended: 'Encerrada' }[s.status];
    statusEl.className = `badge ${s.status === 'live' ? 'badge-approved' : s.status === 'ended' ? 'badge-rejected' : 'badge-pending'}`;

    document.getElementById('btn-start').hidden = s.status !== 'draft';
    document.getElementById('btn-end').hidden = s.status === 'ended';
  }

  function renderQuestions() {
    const pending = state.questions.filter((q) => q.status === 'pending');
    const others = state.questions
      .filter((q) => ['approved', 'highlighted', 'answered'].includes(q.status))
      .sort((a, b) => b.upvotes - a.upvotes);

    document.getElementById('count-pending').textContent = pending.length ? `(${pending.length})` : '';
    document.getElementById('count-approved').textContent = others.length ? `(${others.length})` : '';

    const pendingList = document.getElementById('pending-list');
    pendingList.innerHTML = pending.length
      ? pending.map(pendingCard).join('')
      : '<div class="empty-state">Nenhuma pergunta aguardando moderação.</div>';

    const approvedList = document.getElementById('approved-list');
    approvedList.innerHTML = others.length
      ? others.map(approvedCard).join('')
      : '<div class="empty-state">Nenhuma pergunta aprovada ainda.</div>';
  }

  function pendingCard(q) {
    return `
      <div class="card question-card">
        <div class="q-text">${escapeHtml(q.text)}</div>
        <div class="q-actions">
          <button class="btn btn-success" onclick="setStatus('${q.id}', 'approved')">Aprovar</button>
          <button class="btn btn-danger" onclick="setStatus('${q.id}', 'rejected')">Rejeitar</button>
        </div>
      </div>`;
  }

  function approvedCard(q) {
    const badgeClass = `badge-${q.status}`;
    const label = { approved: 'Aprovada', highlighted: 'No telão', answered: 'Respondida' }[q.status];
    const actions = [];
    if (q.status !== 'highlighted') actions.push(`<button class="btn btn-primary" onclick="setStatus('${q.id}', 'highlighted')">Destacar no telão</button>`);
    if (q.status !== 'answered') actions.push(`<button class="btn" onclick="setStatus('${q.id}', 'answered')">Marcar respondida</button>`);
    return `
      <div class="card question-card">
        <div class="q-meta">
          <span class="badge ${badgeClass}">${label}</span>
          <span class="votes">▲ ${q.upvotes}</span>
        </div>
        <div class="q-text">${escapeHtml(q.text)}</div>
        <div class="q-actions">${actions.join('')}</div>
      </div>`;
  }

  window.setStatus = async function setStatus(id, status) {
    try {
      await api(`/sessions/${state.session.code}/questions/${id}/status`, {
        method: 'POST',
        body: { status },
      });
    } catch (err) {
      showToast('Não foi possível atualizar a pergunta');
    }
  };

  document.getElementById('create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title-input').value.trim();
    if (!title) return;
    try {
      const data = await api('/sessions', { method: 'POST', body: { title } });
      localStorage.setItem(STORAGE_KEY, data.session.code);
      window.location.href = `/painel/${data.session.code}`;
    } catch (err) {
      showToast('Não foi possível criar a sessão');
    }
  });

  document.getElementById('btn-start').addEventListener('click', async () => {
    await api(`/sessions/${state.session.code}/status`, { method: 'POST', body: { status: 'live' } });
  });

  document.getElementById('btn-end').addEventListener('click', async () => {
    if (!confirm('Encerrar a sessão? O código deixará de aceitar novas perguntas.')) return;
    await api(`/sessions/${state.session.code}/status`, { method: 'POST', body: { status: 'ended' } });
  });

  boot();
})();
