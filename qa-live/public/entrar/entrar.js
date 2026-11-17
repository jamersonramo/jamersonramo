(function () {
  const form = document.getElementById('join-form');
  const input = document.getElementById('code-input');
  const errorMsg = document.getElementById('error-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = input.value.trim();
    if (!/^\d{6}$/.test(code)) {
      errorMsg.textContent = 'Digite os 6 dígitos do código.';
      return;
    }
    try {
      await api(`/sessions/${code}`);
      window.location.href = `/participante/${code}`;
    } catch (err) {
      errorMsg.textContent = 'Código não encontrado.';
    }
  });
})();
