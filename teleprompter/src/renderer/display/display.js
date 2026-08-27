const engine = ScrollEngine.create({ textEl: document.getElementById('text') });

let lastState = { playing: false, mirrored: false };

window.teleprompter.onStateSync((state) => {
  lastState = state;
  engine.setState(state);
});
window.teleprompter.onCommand((cmd) => engine.applyCommand(cmd));

// Fallback local: se o controle remoto Bluetooth estiver pareado como
// teclado e esta janela estiver em foco, os mesmos atalhos funcionam mesmo
// sem depender do atalho global do sistema operacional.
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case ' ':
      event.preventDefault();
      window.teleprompter.updateState({ playing: !lastState.playing });
      break;
    case 'ArrowUp':
    case 'PageUp':
      window.teleprompter.updateState({ speed: Math.min(400, lastState.speed + 10) });
      break;
    case 'ArrowDown':
    case 'PageDown':
      window.teleprompter.updateState({ speed: Math.max(0, lastState.speed - 10) });
      break;
    case 'ArrowLeft':
      window.teleprompter.sendCommand({ type: 'nudge', delta: -200 });
      break;
    case 'ArrowRight':
      window.teleprompter.sendCommand({ type: 'nudge', delta: 200 });
      break;
    case 'Escape':
      window.close();
      break;
    default:
      break;
  }
});
