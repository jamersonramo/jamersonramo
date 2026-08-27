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
const remoteTableBody = document.querySelector('#remote-table tbody');
const resetBindingsBtn = document.getElementById('reset-bindings-btn');

const ACTION_LABELS = {
  playPause: 'Play / Pause',
  speedUp: 'Aumentar velocidade',
  speedDown: 'Diminuir velocidade',
  nudgeBack: 'Voltar trecho',
  nudgeForward: 'Avançar trecho',
  reset: 'Reiniciar do topo',
  mirror: 'Espelhar',
};

let syncingFromMain = false;
let currentSettings = { keybindings: {}, gamepadBindings: {} };
let pendingPadCaptureAction = null;

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

// --- Controle remoto: aciona as mesmas ações do painel, reaproveitando os
// elementos e eventos já existentes acima. ---

function triggerAction(action) {
  switch (action) {
    case 'playPause':
      playBtn.click();
      break;
    case 'reset':
      resetBtn.click();
      break;
    case 'mirror':
      mirroredInput.checked = !mirroredInput.checked;
      mirroredInput.dispatchEvent(new Event('change'));
      break;
    case 'speedUp':
      speedInput.value = Math.min(400, Number(speedInput.value) + 10);
      speedInput.dispatchEvent(new Event('input'));
      break;
    case 'speedDown':
      speedInput.value = Math.max(0, Number(speedInput.value) - 10);
      speedInput.dispatchEvent(new Event('input'));
      break;
    case 'nudgeBack':
      window.teleprompter.sendCommand({ type: 'nudge', delta: -200 });
      break;
    case 'nudgeForward':
      window.teleprompter.sendCommand({ type: 'nudge', delta: 200 });
      break;
    default:
      break;
  }
}

// --- Vinculação de teclas ---

function captureKey(button, action) {
  const original = button.textContent;
  button.textContent = 'Pressione uma tecla (Esc cancela)';
  button.classList.add('capturing');

  function handler(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Escape') {
      cleanup();
      return;
    }
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return;

    const accelerator = RemoteControl.eventToAccelerator(event);
    cleanup();
    if (!accelerator) {
      button.textContent = 'Tecla não suportada';
      setTimeout(() => (button.textContent = original), 1200);
      return;
    }
    applyKeyBinding(action, accelerator);
  }

  function cleanup() {
    window.removeEventListener('keydown', handler, true);
    button.classList.remove('capturing');
  }

  window.addEventListener('keydown', handler, true);
}

async function applyKeyBinding(action, accelerator) {
  const patch = { [action]: accelerator };
  const conflict = Object.entries(currentSettings.keybindings).find(
    ([other, value]) => other !== action && value === accelerator,
  );
  if (conflict) patch[conflict[0]] = null;

  currentSettings = await window.teleprompter.setSettings({ keybindings: patch });
  renderRemoteTable();
}

// --- Vinculação de botões de controle de videogame ---

function capturePad(button, action) {
  pendingPadCaptureAction = action;
  button.textContent = 'Pressione um botão do controle';
  button.classList.add('capturing');

  function cancelOnEscape(event) {
    if (event.key !== 'Escape') return;
    pendingPadCaptureAction = null;
    window.removeEventListener('keydown', cancelOnEscape, true);
    renderRemoteTable();
  }
  window.addEventListener('keydown', cancelOnEscape, true);
}

async function applyPadBinding(action, buttonIndex) {
  const patch = { [action]: buttonIndex };
  const conflict = Object.entries(currentSettings.gamepadBindings).find(
    ([other, value]) => other !== action && value === buttonIndex,
  );
  if (conflict) patch[conflict[0]] = null;

  currentSettings = await window.teleprompter.setSettings({ gamepadBindings: patch });
  renderRemoteTable();
}

RemoteControl.watchGamepads((buttonIndex) => {
  if (pendingPadCaptureAction) {
    const action = pendingPadCaptureAction;
    pendingPadCaptureAction = null;
    applyPadBinding(action, buttonIndex);
    return;
  }
  const entry = Object.entries(currentSettings.gamepadBindings).find(([, idx]) => idx === buttonIndex);
  if (entry) triggerAction(entry[0]);
});

// --- Renderização da tabela de vínculos ---

function renderRemoteTable() {
  remoteTableBody.innerHTML = '';
  for (const [action, label] of Object.entries(ACTION_LABELS)) {
    const tr = document.createElement('tr');

    const labelTd = document.createElement('td');
    labelTd.textContent = label;

    const keyTd = document.createElement('td');
    const keyBtn = document.createElement('button');
    keyBtn.textContent = currentSettings.keybindings[action] || '—';
    keyBtn.addEventListener('click', () => captureKey(keyBtn, action));
    keyTd.appendChild(keyBtn);

    const padTd = document.createElement('td');
    const padBtn = document.createElement('button');
    const padValue = currentSettings.gamepadBindings[action];
    padBtn.textContent = padValue != null ? `Botão ${padValue}` : '—';
    padBtn.addEventListener('click', () => capturePad(padBtn, action));
    padTd.appendChild(padBtn);

    tr.append(labelTd, keyTd, padTd);
    remoteTableBody.appendChild(tr);
  }
}

resetBindingsBtn.addEventListener('click', async () => {
  currentSettings = await window.teleprompter.resetSettings();
  renderRemoteTable();
});

window.teleprompter.onSettingsSync((s) => {
  currentSettings = s;
  renderRemoteTable();
});

window.teleprompter.getSettings().then((s) => {
  currentSettings = s;
  renderRemoteTable();
});
