const { app, BrowserWindow, screen, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { startServer, stopServer, broadcastState, broadcastCommand } = require('./server');
const { loadSettings, saveSettings, defaultSettings } = require('./settings-store');

let controlWindow = null;
let displayWindow = null;
let network = null; // { server, wss, port, url }
let settings = null; // carregado em app.whenReady()

const state = {
  text: 'Cole ou importe seu roteiro aqui...',
  speed: 60, // pixels por segundo
  fontSize: 48,
  mirrored: false,
  playing: false,
};

function broadcastAll(partial) {
  Object.assign(state, partial);
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('state:sync', state);
  }
  broadcastState(state);
}

function sendCommand(cmd) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('scroll:command', cmd);
  }
  broadcastCommand(cmd);
}

function broadcastSettings() {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('settings:sync', settings);
  }
}

// Handlers das ações de controle remoto, compartilhados entre os atalhos
// globais de teclado e os botões de controle de videogame configurados.
const remoteActions = {
  playPause: () => broadcastAll({ playing: !state.playing }),
  speedUp: () => broadcastAll({ speed: Math.min(400, state.speed + 10) }),
  speedDown: () => broadcastAll({ speed: Math.max(0, state.speed - 10) }),
  nudgeBack: () => sendCommand({ type: 'nudge', delta: -200 }),
  nudgeForward: () => sendCommand({ type: 'nudge', delta: 200 }),
  reset: () => sendCommand({ type: 'reset' }),
  mirror: () => broadcastAll({ mirrored: !state.mirrored }),
};

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 960,
    height: 720,
    title: 'Teleprompter — Controle',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  controlWindow.loadFile(path.join(__dirname, 'renderer/control/index.html'));
  controlWindow.webContents.on('did-finish-load', () => {
    controlWindow.webContents.send('state:sync', state);
  });
  controlWindow.on('closed', () => {
    controlWindow = null;
    app.quit();
  });
}

function openDisplayWindow() {
  if (displayWindow) {
    displayWindow.focus();
    return;
  }
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const secondary = displays.find((d) => d.id !== primary.id);
  const target = secondary || primary;

  displayWindow = new BrowserWindow({
    x: target.bounds.x,
    y: target.bounds.y,
    width: target.bounds.width,
    height: target.bounds.height,
    fullscreen: Boolean(secondary),
    frame: !secondary,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  displayWindow.loadFile(path.join(__dirname, 'renderer/display/index.html'));
  displayWindow.webContents.on('did-finish-load', () => {
    displayWindow.webContents.send('state:sync', state);
  });
  displayWindow.on('closed', () => {
    displayWindow = null;
    unregisterPresentationShortcuts();
  });

  registerPresentationShortcuts();
}

function closeDisplayWindow() {
  if (displayWindow) displayWindow.close();
}

// Atalhos globais funcionam mesmo com outra janela/app em foco (ex: app da
// câmera no celular/tablet), o que é essencial para pedais e controles
// remotos Bluetooth que emulam um teclado. Só ficam ativos durante a
// apresentação para não atrapalhar a digitação do roteiro no controle.
// Os atalhos em si são configuráveis pelo usuário (ver settings-store.js).
function registerPresentationShortcuts() {
  for (const [action, accelerator] of Object.entries(settings.keybindings)) {
    if (!accelerator || !remoteActions[action]) continue;
    try {
      globalShortcut.register(accelerator, remoteActions[action]);
    } catch (err) {
      console.error(`Falha ao registrar atalho ${accelerator}:`, err);
    }
  }
}

function unregisterPresentationShortcuts() {
  globalShortcut.unregisterAll();
}

app.whenReady().then(() => {
  settings = loadSettings();
  createControlWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlWindow();
  });
});

app.on('window-all-closed', () => {
  unregisterPresentationShortcuts();
  stopServer(network);
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  unregisterPresentationShortcuts();
});

// --- IPC: estado e comandos vindos das janelas de renderer ---

ipcMain.on('state:update', (_event, partial) => {
  broadcastAll(partial);
});

ipcMain.on('scroll:command', (_event, cmd) => {
  sendCommand(cmd);
});

ipcMain.on('display:open', () => openDisplayWindow());
ipcMain.on('display:close', () => closeDisplayWindow());

ipcMain.handle('file:import', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    title: 'Importar roteiro',
    filters: [{ name: 'Roteiro', extensions: ['txt', 'md', 'pdf', 'docx'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const ext = path.extname(filePath).toLowerCase();

  try {
    let text;
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      text = (await pdfParse(buffer)).text;
    } else if (ext === '.docx') {
      text = (await mammoth.extractRawText({ path: filePath })).value;
    } else {
      text = fs.readFileSync(filePath, 'utf8');
    }
    return { text, name: path.basename(filePath) };
  } catch (err) {
    dialog.showErrorBox('Erro ao importar roteiro', `Não foi possível ler o arquivo:\n${err.message}`);
    return null;
  }
});

ipcMain.handle('settings:get', () => settings);

ipcMain.handle('settings:set', (_event, partial) => {
  settings = {
    keybindings: { ...settings.keybindings, ...(partial.keybindings || {}) },
    gamepadBindings: { ...settings.gamepadBindings, ...(partial.gamepadBindings || {}) },
  };
  saveSettings(settings);
  broadcastSettings();
  if (displayWindow) {
    unregisterPresentationShortcuts();
    registerPresentationShortcuts();
  }
  return settings;
});

ipcMain.handle('settings:reset', () => {
  settings = defaultSettings();
  saveSettings(settings);
  broadcastSettings();
  if (displayWindow) {
    unregisterPresentationShortcuts();
    registerPresentationShortcuts();
  }
  return settings;
});

ipcMain.handle('network:toggle', async (_event, enable) => {
  if (enable) {
    if (network) return { enabled: true, url: network.url };
    network = await startServer(state, {
      // Qualquer cliente de rede (tablet/celular) pode enviar atualizações
      // de estado ou comandos, passando pelo mesmo caminho usado pelo
      // controle desktop e pelos atalhos globais — controle bidirecional.
      onMessage: (message) => {
        if (message.kind === 'state') broadcastAll(message.payload);
        if (message.kind === 'command') sendCommand(message.payload);
      },
    });
    return { enabled: true, url: network.url };
  }
  stopServer(network);
  network = null;
  return { enabled: false, url: null };
});

ipcMain.handle('network:status', () => {
  return network ? { enabled: true, url: network.url } : { enabled: false, url: null };
});
