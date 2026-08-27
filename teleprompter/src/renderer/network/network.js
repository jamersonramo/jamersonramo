const engine = ScrollEngine.create({ textEl: document.getElementById('text') });
const statusEl = document.getElementById('status');

function connect() {
  const ws = new WebSocket(`ws://${location.host}`);

  ws.addEventListener('open', () => {
    statusEl.textContent = 'conectado';
  });

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.kind === 'state') engine.setState(message.payload);
    if (message.kind === 'command') engine.applyCommand(message.payload);
  });

  ws.addEventListener('close', () => {
    statusEl.textContent = 'desconectado — tentando reconectar...';
    setTimeout(connect, 1500);
  });

  ws.addEventListener('error', () => ws.close());
}

connect();

// Toque duplo alterna tela cheia — útil em tablets/celulares presos no rig.
document.addEventListener('dblclick', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});
