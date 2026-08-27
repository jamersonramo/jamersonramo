// Lógica compartilhada da página móvel (espelho + controle) usada tanto
// pelo mirror de rede via Wi-Fi (transporte WebSocket) quanto pela versão
// P2P via WebRTC — ambas só diferem no objeto `transport` passado aqui.
// Um `transport` deve expor: send(message), onMessage(cb), onOpen(cb),
// onClose(cb). Mensagens têm o formato { kind: 'state' | 'command', payload }.
(function (global) {
  function init({ transport, elements }) {
    const {
      stageTextEl,
      scriptEl,
      speedInput,
      speedValue,
      fontSizeInput,
      fontSizeValue,
      mirroredInput,
      playBtn,
      resetBtn,
      importInput,
      statusEl,
      modeMirrorBtn,
      modeControlBtn,
    } = elements;

    const engine = ScrollEngine.create({ textEl: stageTextEl });
    let state = { text: '', speed: 60, fontSize: 48, mirrored: false, playing: false };
    let syncing = false;

    function applyState(partial) {
      state = { ...state, ...partial };
      engine.setState(state);

      syncing = true;
      if (document.activeElement !== scriptEl) scriptEl.value = state.text;
      speedInput.value = state.speed;
      speedValue.textContent = state.speed;
      fontSizeInput.value = state.fontSize;
      fontSizeValue.textContent = state.fontSize;
      mirroredInput.checked = state.mirrored;
      playBtn.textContent = state.playing ? '⏸ Pausar' : '▶ Reproduzir';
      syncing = false;
    }

    function send(kind, payload) {
      transport.send({ kind, payload });
    }

    transport.onMessage((message) => {
      if (message.kind === 'state') applyState(message.payload);
      if (message.kind === 'command') engine.applyCommand(message.payload);
    });
    transport.onOpen(() => {
      if (statusEl) statusEl.textContent = 'conectado';
    });
    transport.onClose(() => {
      if (statusEl) statusEl.textContent = 'desconectado';
    });

    scriptEl.addEventListener('input', () => {
      if (!syncing) send('state', { text: scriptEl.value });
    });
    speedInput.addEventListener('input', () => {
      speedValue.textContent = speedInput.value;
      if (!syncing) send('state', { speed: Number(speedInput.value) });
    });
    fontSizeInput.addEventListener('input', () => {
      fontSizeValue.textContent = fontSizeInput.value;
      if (!syncing) send('state', { fontSize: Number(fontSizeInput.value) });
    });
    mirroredInput.addEventListener('change', () => {
      if (!syncing) send('state', { mirrored: mirroredInput.checked });
    });
    playBtn.addEventListener('click', () => {
      send('state', { playing: playBtn.textContent.includes('Reproduzir') });
    });
    resetBtn.addEventListener('click', () => send('command', { type: 'reset' }));

    if (importInput) {
      importInput.addEventListener('change', () => {
        const file = importInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          scriptEl.value = reader.result;
          send('state', { text: String(reader.result) });
        };
        reader.readAsText(file);
        importInput.value = '';
      });
    }

    function setMode(mode) {
      document.body.classList.remove('mode-mirror', 'mode-control');
      document.body.classList.add(`mode-${mode}`);
    }
    if (modeMirrorBtn) modeMirrorBtn.addEventListener('click', () => setMode('mirror'));
    if (modeControlBtn) modeControlBtn.addEventListener('click', () => setMode('control'));

    return { setMode };
  }

  global.MobileApp = { init };
})(window);
