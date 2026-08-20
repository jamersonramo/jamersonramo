const path = require('node:path');
const express = require('express');
const http = require('node:http');
const { Server } = require('socket.io');

const { initSocket } = require('./socket');
const sessionsRouter = require('./routes/sessions');
const questionsRouter = require('./routes/questions');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

app.use('/api', sessionsRouter(io));
app.use('/api', questionsRouter(io));

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));

// Rotas com :codigo servem sempre o mesmo HTML da tela; o codigo e lido no client via URL.
app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get('/entrar', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'entrar', 'index.html')));
app.get('/painel', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'painel', 'index.html')));
app.get('/painel/:code', (req, res) =>
  res.sendFile(path.join(PUBLIC_DIR, 'painel', 'index.html'))
);
app.get('/telao/:code', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'telao', 'index.html')));
app.get('/participante/:code', (req, res) =>
  res.sendFile(path.join(PUBLIC_DIR, 'participante', 'index.html'))
);

initSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`qa-live rodando em http://localhost:${PORT}`);
});
