const scriptEl = document.getElementById('script');
const importBtn = document.getElementById('import-btn');
const openDisplayBtn = document.getElementById('open-display-btn');
const playBtn = document.getElementById('play-btn');
const resetBtn = document.getElementById('reset-btn');
const speedInput = document.getElementById('speed');
const speedValue = document.getElementById('speed-value');
const fontSizeInput = document.getElementById('font-size');
const fontSizeValue = document.getElementById('font-size-value');
const mirroredInput = document.getElementById('mirrored');
const networkToggle = document.getElementById('network-toggle');
const networkUrl = document.getElementById('network-url');

let syncingFromMain = false;

function update(partial) {
  window.teleprompter.updateState(partial);
}

// Evita re-emitir eventos de input enquanto aplicamos um estado recebido
// do processo principal (ex: mudança de velocidade via atalho do pedal).
function applyState(state) {
  syncingFromMain = true;

  if (document.activeElement !== scriptEl) scriptEl.value = state.text;
  speedInput.value = state.speed;
  speedValue.textContent = state.speed;
  fontSizeInput.value = state.fontSize;
  fontSizeValue.textContent = state.fontSize;
  mirroredInput.checked = state.mirrored;
  playBtn.textContent = state.playing ? '⏸ Pausar' : '▶ Reproduzir';

  syncingFromMain = false;
}

window.teleprompter.onStateSync(applyState);

scriptEl.addEventListener('input', () => {
  if (syncingFromMain) return;
  update({ text: scriptEl.value });
});

speedInput.addEventListener('input', () => {
  speedValue.textContent = speedInput.value;
  if (syncingFromMain) return;
  update({ speed: Number(speedInput.value) });
});

fontSizeInput.addEventListener('input', () => {
  fontSizeValue.textContent = fontSizeInput.value;
  if (syncingFromMain) return;
  update({ fontSize: Number(fontSizeInput.value) });
});

mirroredInput.addEventListener('change', () => {
  if (syncingFromMain) return;
  update({ mirrored: mirroredInput.checked });
});

playBtn.addEventListener('click', () => {
  update({ playing: playBtn.textContent.includes('Reproduzir') });
});

resetBtn.addEventListener('click', () => {
  window.teleprompter.sendCommand({ type: 'reset' });
});

openDisplayBtn.addEventListener('click', () => {
  window.teleprompter.openDisplay();
});

importBtn.addEventListener('click', async () => {
  const result = await window.teleprompter.importFile();
  if (!result) return;
  scriptEl.value = result.text;
  update({ text: result.text });
});

networkToggle.addEventListener('change', async () => {
  const result = await window.teleprompter.toggleNetwork(networkToggle.checked);
  networkUrl.textContent = result.enabled
    ? `Abra no navegador do tablet/celular: ${result.url}`
    : 'desativado';
});

window.teleprompter.networkStatus().then((status) => {
  networkToggle.checked = status.enabled;
  networkUrl.textContent = status.enabled
    ? `Abra no navegador do tablet/celular: ${status.url}`
    : 'desativado';
});
