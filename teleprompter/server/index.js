// Servidor standalone do Teleprompter: mesmo protocolo bidirecional do
// mirror de rede embutido no app desktop (src/server.js), mas rodando
// como processo Node.js independente — pensado pra ficar sempre ligado
// numa máquina da rede interna (VPS, Raspberry Pi, NAS, PC dedicado),
// sem depender do app Electron estar aberto em lugar nenhum.
//
// Qualquer dispositivo (celular, tablet, notebook) abre este servidor no
// navegador e vira, à escolha, tela de controle ou tela de espelho — sem
// instalar nada. Não há um "dono" da sessão: qualquer cliente conectado
// pode atualizar o estado, que é retransmitido para todos os outros.
const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 4000;

function localIPAddresses() {
  const addresses = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) addresses.push(iface.address);
    }
  }
  return addresses.length > 0 ? addresses : ['127.0.0.1'];
}

let state = {
  text: 'Cole ou importe seu roteiro aqui...',
  speed: 60,
  fontSize: 48,
  mirrored: false,
  playing: false,
};

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ kind: 'state', payload: state }));

  ws.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data);
    } catch (err) {
      console.error('Mensagem inválida recebida:', err.message);
      return;
    }

    if (message.kind === 'state') {
      state = { ...state, ...message.payload };
      broadcast({ kind: 'state', payload: state });
    } else if (message.kind === 'command') {
      broadcast({ kind: 'command', payload: message.payload });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Teleprompter server rodando na porta ${PORT}.`);
  for (const ip of localIPAddresses()) {
    console.log(`  Acesse em: http://${ip}:${PORT}`);
  }
});
