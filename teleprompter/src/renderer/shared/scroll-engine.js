// Motor de rolagem compartilhado. Roda de forma independente em cada tela
// (janela de exibição do Electron e clientes de rede no navegador),
// sincronizado por eventos de estado/comando vindos do processo principal.
// Isso evita travões de rede: cada tela rola localmente e apenas recebe
// correções (play/pause, velocidade, reset, nudge) quando o operador age.
(function (global) {
  function createScrollEngine({ textEl }) {
    let state = {
      text: '',
      speed: 60,
      fontSize: 48,
      mirrored: false,
      playing: false,
    };
    let position = 0;
    let lastTimestamp = null;

    function applyStyles() {
      textEl.style.fontSize = `${state.fontSize}px`;
      textEl.parentElement.style.transform = state.mirrored ? 'scaleX(-1)' : 'none';
    }

    function applyText() {
      textEl.textContent = state.text;
    }

    function applyPosition() {
      textEl.style.transform = `translateY(${-position}px)`;
    }

    function setState(partial) {
      const textChanged = 'text' in partial && partial.text !== state.text;
      state = { ...state, ...partial };
      applyStyles();
      if (textChanged) applyText();
    }

    function reset() {
      position = 0;
      applyPosition();
    }

    function nudge(delta) {
      position = Math.max(0, position + delta);
      applyPosition();
    }

    function applyCommand(cmd) {
      if (!cmd) return;
      if (cmd.type === 'reset') reset();
      if (cmd.type === 'nudge') nudge(cmd.delta);
    }

    function tick(timestamp) {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      if (state.playing && state.speed > 0) {
        position += state.speed * dt;
        applyPosition();
      }
      requestAnimationFrame(tick);
    }

    applyText();
    applyStyles();
    applyPosition();
    requestAnimationFrame(tick);

    return { setState, applyCommand, reset };
  }

  global.ScrollEngine = { create: createScrollEngine };
})(window);
