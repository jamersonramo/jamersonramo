// Namespace nos IDs do broker público do PeerJS, pra reduzir colisão com
// sessões de outras pessoas usando o mesmo serviço gratuito.
const PEER_PREFIX = 'jrtp-';
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // sem 0/O/1/I, difíceis de distinguir

function randomCode(length = 5) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

const screens = {
  pairing: document.getElementById('pairing-screen'),
  app: document.getElementById('app-screen'),
};

const hostBtn = document.getElementById('host-btn');
const joinBtn = document.getElementById('join-btn');
const joinForm = document.getElementById('join-form');
const joinInput = document.getElementById('join-code-input');
const joinConnectBtn = document.getElementById('join-connect-btn');
const codeDisplay = document.getElementById('code-display');
const pairingStatus = document.getElementById('pairing-status');
const disconnectBtn = document.getElementById('disconnect-btn');

let peer = null;
let mobileApp = null;

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('hidden', key !== name));
}

function setStatus(text) {
  pairingStatus.textContent = text;
}

function startApp(conn, defaultMode) {
  const transport = WebRtcTransport.create(conn);
  mobileApp = MobileApp.init({
    transport,
    elements: {
      stageTextEl: document.getElementById('text'),
      scriptEl: document.getElementById('m-script'),
      speedInput: document.getElementById('m-speed'),
      speedValue: document.getElementById('m-speed-value'),
      fontSizeInput: document.getElementById('m-font-size'),
      fontSizeValue: document.getElementById('m-font-size-value'),
      mirroredInput: document.getElementById('m-mirrored'),
      playBtn: document.getElementById('m-play'),
      resetBtn: document.getElementById('m-reset'),
      importInput: document.getElementById('m-import'),
      statusEl: document.getElementById('status'),
      modeMirrorBtn: document.getElementById('mode-mirror-btn'),
      modeControlBtn: document.getElementById('mode-control-btn'),
    },
  });
  mobileApp.setMode(defaultMode);
  showScreen('app');

  conn.on('close', () => {
    alert('Conexão encerrada.');
    resetToPairing();
  });
}

function resetToPairing() {
  if (peer) {
    peer.destroy();
    peer = null;
  }
  mobileApp = null;
  codeDisplay.classList.add('hidden');
  joinForm.classList.add('hidden');
  setStatus('');
  showScreen('pairing');
}

hostBtn.addEventListener('click', () => {
  joinForm.classList.add('hidden');
  attemptHost();
});

function attemptHost(attempt = 0) {
  const code = randomCode();
  setStatus('Criando sessão...');
  peer = new Peer(PEER_PREFIX + code);

  peer.on('open', () => {
    codeDisplay.textContent = code;
    codeDisplay.classList.remove('hidden');
    setStatus('Aguardando o outro aparelho conectar...');
  });

  peer.on('connection', (conn) => {
    setStatus('Conectado!');
    startApp(conn, 'control');
  });

  peer.on('error', (err) => {
    if (err.type === 'unavailable-id' && attempt < 5) {
      peer.destroy();
      attemptHost(attempt + 1);
      return;
    }
    setStatus(`Erro: ${err.type || err.message}`);
  });
}

joinBtn.addEventListener('click', () => {
  codeDisplay.classList.add('hidden');
  joinForm.classList.remove('hidden');
  joinInput.focus();
});

joinConnectBtn.addEventListener('click', () => {
  const code = joinInput.value.trim().toUpperCase();
  if (!code) return;

  setStatus('Conectando...');
  peer = new Peer();

  peer.on('open', () => {
    const conn = peer.connect(PEER_PREFIX + code, { reliable: true });

    conn.on('open', () => {
      setStatus('Conectado!');
      startApp(conn, 'mirror');
    });

    conn.on('error', (err) => setStatus(`Erro: ${err.message || err}`));
  });

  peer.on('error', (err) => {
    setStatus(`Erro: ${err.type || err.message}`);
  });
});

disconnectBtn.addEventListener('click', resetToPairing);
