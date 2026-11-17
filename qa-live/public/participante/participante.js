(function () {
  const code = codeFromPath();
  const fingerprint = getFingerprint();
  const votedKey = `palcoqa:voted:${code}`;
  const voted = new Set(JSON.parse(localStorage.getItem(votedKey) || '[]'));

  let state = { session: null, questions: [] };

  const form = document.getElementById('ask-form');
  const input = document.getElementById('question-input');
  const charCount = document.getElementById('char-count');
  const banner = document.getElementById('not-live-banner');

  function saveVoted() {
    localStorage.setItem(votedKey, JSON.stringify([...voted]));
  }

  async function boot() {
    if (!code) return;
    try {
      const data = await api(`/sessions/${code}`);
      document.getElementById('session-title').textContent = data.session.title;
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

  function render() {
    const isLive = state.session?.status === 'live';
    input.disabled = !isLive;
    document.getElementById('ask-submit').disabled = !isLive;
    if (!isLive) {
      banner.hidden = false;
      banner.textContent =
        state.session?.status === 'ended'
          ? 'Esta sessão foi encerrada.'
          : 'A sessão ainda não começou. Aguarde para enviar sua pergunta.';
    } else {
      banner.hidden = true;
    }

    const list = state.questions
      .filter((q) => ['approved', 'highlighted', 'answered'].includes(q.status))
      .sort((a, b) => b.upvotes - a.upvotes);

    const container = document.getElementById('question-list');
    container.innerHTML = list.length
      ? list.map(itemHtml).join('')
      : '<div class="empty-state">Nenhuma pergunta aprovada ainda.</div>';
  }

  function itemHtml(q) {
    const isVoted = voted.has(q.id);
    return `
      <div class="card q-item">
        <button class="btn upvote-btn ${isVoted ? 'voted' : ''}" onclick="upvote('${q.id}')" ${isVoted ? 'disabled' : ''}>
          <span>▲</span><span>${q.upvotes}</span>
        </button>
        <div class="q-body">
          <p class="q-text">${escapeHtml(q.text)}</p>
          ${q.status === 'highlighted' ? '<span class="badge badge-highlighted">No telão agora</span>' : ''}
          ${q.status === 'answered' ? '<span class="badge badge-answered">Respondida</span>' : ''}
        </div>
      </div>`;
  }

  window.upvote = async function upvote(id) {
    if (voted.has(id)) return;
    voted.add(id);
    saveVoted();
    render();
    try {
      await api(`/sessions/${code}/questions/${id}/upvote`, {
        method: 'POST',
        body: { fingerprint },
      });
    } catch (err) {
      // already_voted (409) mantém o estado local como votado; outros erros revertem.
      if (err.data?.error !== 'already_voted') {
        voted.delete(id);
        saveVoted();
        render();
        showToast('Não foi possível registrar seu voto');
      }
    }
  };

  input.addEventListener('input', () => {
    charCount.textContent = `${input.value.length}/280`;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    try {
      await api(`/sessions/${code}/questions`, { method: 'POST', body: { text } });
      input.value = '';
      charCount.textContent = '0/280';
      showToast('Pergunta enviada! Aguarde a moderação.');
    } catch (err) {
      showToast('Não foi possível enviar sua pergunta');
    }
  });

  boot();
})();
