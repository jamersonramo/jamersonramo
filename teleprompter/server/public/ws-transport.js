// Transporte via WebSocket, conectando neste próprio servidor (mesma
// origem que serviu a página). Reconecta automaticamente se cair.
(function (global) {
  function createWsTransport() {
    let ws = null;
    const messageHandlers = [];
    const openHandlers = [];
    const closeHandlers = [];

    function connect() {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${location.host}`);
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
