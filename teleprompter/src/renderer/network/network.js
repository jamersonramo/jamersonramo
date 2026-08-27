const transport = WsTransport.create();

MobileApp.init({
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

// Toque duplo na tela de espelho alterna tela cheia — útil em
// tablets/celulares presos no rig.
document.querySelector('.stage').addEventListener('dblclick', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});
