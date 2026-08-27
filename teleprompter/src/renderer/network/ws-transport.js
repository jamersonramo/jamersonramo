// Transporte via WebSocket para o mirror de rede local (Wi-Fi), falando
// com o servidor embutido no app desktop (src/server.js). Reconecta
// automaticamente se a conexão cair (ex: app desktop reiniciado).
(function (global) {
  function createWsTransport() {
    let ws = null;
    const messageHandlers = [];
    const openHandlers = [];
    const closeHandlers = [];

    function connect() {
      ws = new WebSocket(`ws://${location.host}`);
      ws.addEventListener('open', () => openHandlers.forEach((cb) => cb()));
      ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        messageHandlers.forEach((cb) => cb(message));
      });
      ws.addEventListener('close', () => {
        closeHandlers.forEach((cb) => cb());
        setTimeout(connect, 1500);
      });
      ws.addEventListener('error', () => ws.close());
    }
    connect();

    return {
      send(message) {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
      },
      onMessage(cb) {
        messageHandlers.push(cb);
      },
      onOpen(cb) {
        openHandlers.push(cb);
      },
      onClose(cb) {
        closeHandlers.push(cb);
      },
    };
  }

  global.WsTransport = { create: createWsTransport };
})(window);
