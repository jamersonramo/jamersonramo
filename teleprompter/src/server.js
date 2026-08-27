const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const { WebSocketServer } = require('ws');

function localIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

// Referência ao servidor de rede ativo, usada para fazer broadcast a
// partir do main.js sem precisar repassar o objeto a cada chamada.
let activeNetwork = null;

// Sobe um servidor local (Express + WebSocket) que serve a mesma tela de
// exibição para qualquer tablet/celular na mesma rede Wi-Fi abrir no
// navegador — útil para montar um rig de teleprompter com câmera móvel
// sem precisar de um app nativo separado.
function startServer(initialState) {
  return new Promise((resolve, reject) => {
    const app = express();
    app.get('/', (_req, res) => res.redirect('/network/index.html'));
    app.use(express.static(path.join(__dirname, 'renderer')));

    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      ws.send(JSON.stringify({ kind: 'state', payload: initialState }));
    });

    server.listen(0, '0.0.0.0', () => {
      const port = server.address().port;
      const url = `http://${localIPAddress()}:${port}`;
      activeNetwork = { server, wss, port, url };
      resolve(activeNetwork);
    });

    server.on('error', reject);
  });
}

function stopServer(network) {
  if (!network) return;
  try {
    network.wss.clients.forEach((client) => client.close());
    network.wss.close();
    network.server.close();
  } catch (err) {
    console.error('Erro ao encerrar o servidor de rede:', err);
  }
  if (network === activeNetwork) activeNetwork = null;
}

function broadcast(message) {
  if (!activeNetwork) return;
  const data = JSON.stringify(message);
  activeNetwork.wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
}

function broadcastState(state) {
  broadcast({ kind: 'state', payload: state });
}

function broadcastCommand(cmd) {
  broadcast({ kind: 'command', payload: cmd });
}

module.exports = {
  startServer,
  stopServer,
  broadcastState,
  broadcastCommand,
};
