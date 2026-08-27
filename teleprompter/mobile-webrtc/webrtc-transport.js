// Transporte via WebRTC (DataConnection do PeerJS) para o modo "sem
// notebook": iPad e iPhone conectam diretamente um no outro. O PeerJS já
// serializa objetos automaticamente, então enviamos/recebemos os mesmos
// objetos { kind: 'state' | 'command', payload } usados no modo Wi-Fi
// (src/renderer/network/ws-transport.js), o que permite reaproveitar o
// mobile-app.js sem alterações entre os dois modos.
(function (global) {
  function createWebRtcTransport(conn) {
    const messageHandlers = [];
    const openHandlers = [];
    const closeHandlers = [];
    let ready = Boolean(conn.open);

    conn.on('open', () => {
      ready = true;
      openHandlers.forEach((cb) => cb());
    });
    conn.on('data', (data) => messageHandlers.forEach((cb) => cb(data)));
    conn.on('close', () => closeHandlers.forEach((cb) => cb()));

    return {
      send(message) {
        if (ready) conn.send(message);
      },
      onMessage(cb) {
        messageHandlers.push(cb);
      },
      onOpen(cb) {
        openHandlers.push(cb);
        if (ready) cb();
      },
      onClose(cb) {
        closeHandlers.push(cb);
      },
    };
  }

  global.WebRtcTransport = { create: createWebRtcTransport };
})(window);
