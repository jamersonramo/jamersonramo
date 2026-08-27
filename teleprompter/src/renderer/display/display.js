const engine = ScrollEngine.create({ textEl: document.getElementById('text') });

let lastState = { playing: false, mirrored: false, speed: 60 };
let settings = { keybindings: {}, gamepadBindings: {} };

window.teleprompter.getSettings().then((s) => { settings = s; });
window.teleprompter.onSettingsSync((s) => { settings = s; });

window.teleprompter.onStateSync((state) => {
  lastState = state;
  engine.setState(state);
});
window.teleprompter.onCommand((cmd) => engine.applyCommand(cmd));

function triggerAction(action) {
  switch (action) {
    case 'playPause':
      window.teleprompter.updateState({ playing: !lastState.playing });
      break;
    case 'speedUp':
      window.teleprompter.updateState({ speed: Math.min(400, lastState.speed + 10) });
      break;
    case 'speedDown':
      window.teleprompter.updateState({ speed: Math.max(0, lastState.speed - 10) });
      break;
    case 'nudgeBack':
      window.teleprompter.sendCommand({ type: 'nudge', delta: -200 });
      break;
    case 'nudgeForward':
      window.teleprompter.sendCommand({ type: 'nudge', delta: 200 });
      break;
    case 'reset':
      window.teleprompter.sendCommand({ type: 'reset' });
      break;
    case 'mirror':
      window.teleprompter.updateState({ mirrored: !lastState.mirrored });
      break;
    default:
      break;
  }
}

// Fallback local: se o pedal/controle Bluetooth estiver pareado como
// teclado e esta janela estiver em foco, os mesmos atalhos funcionam mesmo
// sem depender do atalho global do sistema operacional.
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    window.close();
    return;
  }
  for (const [action, accelerator] of Object.entries(settings.keybindings)) {
    if (RemoteControl.matchesAccelerator(event, accelerator)) {
      event.preventDefault();
      triggerAction(action);
      return;
    }
  }
});

// Controle de videogame (PlayStation/Xbox) pareado no sistema.
RemoteControl.watchGamepads((buttonIndex) => {
  const entry = Object.entries(settings.gamepadBindings).find(([, idx]) => idx === buttonIndex);
  if (entry) triggerAction(entry[0]);
});
