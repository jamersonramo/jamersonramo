const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Ações controláveis por teclado global ou botão de controle de videogame.
const DEFAULT_KEYBINDINGS = {
  playPause: 'Space',
  speedUp: 'Up',
  speedDown: 'Down',
  nudgeBack: 'Left',
  nudgeForward: 'Right',
  reset: 'Shift+R',
  mirror: 'Shift+M',
};

// Índices de botão no "standard gamepad mapping" do W3C (compatível com a
// maioria dos controles PlayStation e Xbox): 0/1/2/3 = botões de face,
// 12-15 = D-pad.
const DEFAULT_GAMEPAD_BINDINGS = {
  playPause: 0,
  mirror: 1,
  reset: 3,
  speedUp: 12,
  speedDown: 13,
  nudgeBack: 14,
  nudgeForward: 15,
};

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  try {
    const raw = fs.readFileSync(settingsPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      keybindings: { ...DEFAULT_KEYBINDINGS, ...(parsed.keybindings || {}) },
      gamepadBindings: { ...DEFAULT_GAMEPAD_BINDINGS, ...(parsed.gamepadBindings || {}) },
    };
  } catch (err) {
    return defaultSettings();
  }
}

function defaultSettings() {
  return {
    keybindings: { ...DEFAULT_KEYBINDINGS },
    gamepadBindings: { ...DEFAULT_GAMEPAD_BINDINGS },
  };
}

function saveSettings(settings) {
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf8');
}

module.exports = { loadSettings, saveSettings, defaultSettings };
