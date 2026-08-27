// Utilitários compartilhados para capturar e reconhecer entradas de
// controle remoto (teclado global no formato "accelerator" do Electron, e
// botões de controle de videogame via Gamepad API do navegador).
(function (global) {
  const KEY_NAME_MAP = {
    ' ': 'Space',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Enter: 'Return',
  };

  const PLAIN_KEYS = new Set([
    'PageUp', 'PageDown', 'Home', 'End', 'Insert', 'Delete', 'Tab', 'Backspace',
  ]);

  // Converte um KeyboardEvent em uma string no formato accelerator do
  // Electron (ex: "Shift+R"), ou null se a tecla não puder virar atalho
  // global (ex: pressionar só um modificador).
  function eventToAccelerator(event) {
    const parts = [];
    if (event.ctrlKey) parts.push('Control');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) {
      parts.push(navigator.platform.toLowerCase().includes('mac') ? 'Command' : 'Super');
    }

    let key = event.key;
    if (key in KEY_NAME_MAP) {
      key = KEY_NAME_MAP[key];
    } else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(key)) {
      // F1-F24, já no formato aceito pelo Electron.
    } else if (/^[a-zA-Z]$/.test(key)) {
      key = key.toUpperCase();
    } else if (/^[0-9]$/.test(key)) {
      // dígitos, já no formato aceito.
    } else if (PLAIN_KEYS.has(key)) {
      // já no formato aceito.
    } else {
      return null;
    }

    parts.push(key);
    return parts.join('+');
  }

  function matchesAccelerator(event, accelerator) {
    if (!accelerator) return false;
    return eventToAccelerator(event) === accelerator;
  }

  // Chama onButtonDown(buttonIndex, gamepadIndex) a cada borda de subida de
  // um botão em qualquer controle conectado. Faz polling via
  // requestAnimationFrame, que é a forma recomendada de ler a Gamepad API.
  function watchGamepads(onButtonDown) {
    if (!navigator.getGamepads) return () => {};
    const previous = {};
    let stopped = false;

    function poll() {
      if (stopped) return;
      const pads = navigator.getGamepads();
      for (const pad of pads) {
        if (!pad) continue;
        const prev = previous[pad.index] || [];
        pad.buttons.forEach((button, i) => {
          const pressed = button.pressed || button.value > 0.5;
          if (pressed && !prev[i]) onButtonDown(i, pad.index);
        });
        previous[pad.index] = pad.buttons.map((b) => b.pressed || b.value > 0.5);
      }
      requestAnimationFrame(poll);
    }
    requestAnimationFrame(poll);

    return () => {
      stopped = true;
    };
  }

  global.RemoteControl = { eventToAccelerator, matchesAccelerator, watchGamepads };
})(window);
