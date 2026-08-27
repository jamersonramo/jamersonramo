const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('teleprompter', {
  updateState: (partial) => ipcRenderer.send('state:update', partial),
  sendCommand: (cmd) => ipcRenderer.send('scroll:command', cmd),
  openDisplay: () => ipcRenderer.send('display:open'),
  closeDisplay: () => ipcRenderer.send('display:close'),
  importFile: () => ipcRenderer.invoke('file:import'),
  toggleNetwork: (enable) => ipcRenderer.invoke('network:toggle', enable),
  networkStatus: () => ipcRenderer.invoke('network:status'),
  onStateSync: (callback) => {
    ipcRenderer.on('state:sync', (_event, state) => callback(state));
  },
  onCommand: (callback) => {
    ipcRenderer.on('scroll:command', (_event, cmd) => callback(cmd));
  },
});
