(function () {
  const code = codeFromPath();
  let state = { session: null, questions: [] };

  const screens = {
    waiting: document.getElementById('waiting-screen'),
    highlight: document.getElementById('highlight-screen'),
    ranking: document.getElementById('ranking-screen'),
    ended: document.getElementById('ended-screen'),
  };

  async function boot() {
    if (!code) return;
    try {
      const data = await api(`/sessions/${code}`);
      document.getElementById('session-code').textContent = data.session.code;
      document.getElementById('session-code-small').textContent = data.session.code;
      document.getElementById('qr-code').src = data.qr_code;
      document.getElementById('waiting-title').textContent = data.session.title;
    } catch (err) {
      document.body.innerHTML = '<div class="center-screen"><p class="muted">Sessão não encontrada.</p></div>';
      return;
    }

    const socket = io();
    socket.on('connect', () => socket.emit('join', { code, role: 'public' }));
    socket.on('session:state', (snapshot) => {
      state = snapshot;
      render();
    });
    socket.on('question:status_changed', ({ question }) => {
      upsert(question);
      render();
    });
    socket.on('question:upvoted', ({ question_id, upvotes }) => {
      const q = state.questions.find((x) => x.id === question_id);
      if (q) q.upvotes = upvotes;
      render();
    });
  }

  function upsert(question) {
    const visible = ['approved', 'highlighted', 'answered'].includes(question.status);
    const idx = state.questions.findIndex((q) => q.id === question.id);
    if (!visible) {
      if (idx >= 0) state.questions.splice(idx, 1);
      return;
    }
    if (idx >= 0) state.questions[idx] = question;
    else state.questions.push(question);
  }

  function showOnly(name) {
    Object.entries(screens).forEach(([key, el]) => { el.hidden = key !== name; });
  }

  function render() {
    if (!state.session) return;

    if (state.session.status === 'ended') {
      showOnly('ended');
      return;
    }

    const highlighted = state.questions.find((q) => q.status === 'highlighted');
    if (highlighted) {
      document.getElementById('highlight-text').textContent = highlighted.text;
      showOnly('highlight');
      return;
    }

    const ranked = state.questions
      .filter((q) => q.status === 'approved' || q.status === 'answered')
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 6);

    if (ranked.length) {
      document.getElementById('ranking-list').innerHTML = ranked
        .map(
          (q, i) => `
        <div class="ranking-item">
          <span class="rank">#${i + 1}</span>
          <span class="text">${escapeHtml(q.text)}</span>
          <span class="votes">▲ ${q.upvotes}</span>
        </div>`
        )
        .join('');
      showOnly('ranking');
      return;
    }

    showOnly('waiting');
  }

  boot();
})();
