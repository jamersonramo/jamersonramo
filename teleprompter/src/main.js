const { app, BrowserWindow, screen, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer, stopServer, broadcastState, broadcastCommand } = require('./server');

let controlWindow = null;
let displayWindow = null;
let network = null; // { server, wss, port, url }

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
function registerPresentationShortcuts() {
  const bindings = {
    Space: () => broadcastAll({ playing: !state.playing }),
    Up: () => broadcastAll({ speed: Math.min(400, state.speed + 10) }),
    PageUp: () => broadcastAll({ speed: Math.min(400, state.speed + 10) }),
    Down: () => broadcastAll({ speed: Math.max(0, state.speed - 10) }),
    PageDown: () => broadcastAll({ speed: Math.max(0, state.speed - 10) }),
    Left: () => sendCommand({ type: 'nudge', delta: -200 }),
    Right: () => sendCommand({ type: 'nudge', delta: 200 }),
    'Shift+R': () => sendCommand({ type: 'reset' }),
    'Shift+M': () => broadcastAll({ mirrored: !state.mirrored }),
  };
  for (const [accelerator, handler] of Object.entries(bindings)) {
    try {
      globalShortcut.register(accelerator, handler);
    } catch (err) {
      console.error(`Falha ao registrar atalho ${accelerator}:`, err);
    }
  }
}

function unregisterPresentationShortcuts() {
  globalShortcut.unregisterAll();
}

app.whenReady().then(() => {
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
    filters: [{ name: 'Texto', extensions: ['txt', 'md'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const text = fs.readFileSync(filePath, 'utf8');
  return { text, name: path.basename(filePath) };
});

ipcMain.handle('network:toggle', async (_event, enable) => {
  if (enable) {
    if (network) return { enabled: true, url: network.url };
    network = await startServer(state);
    return { enabled: true, url: network.url };
  }
  stopServer(network);
  network = null;
  return { enabled: false, url: null };
});

ipcMain.handle('network:status', () => {
  return network ? { enabled: true, url: network.url } : { enabled: false, url: null };
});
