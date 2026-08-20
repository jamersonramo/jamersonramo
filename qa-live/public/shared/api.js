// Helpers compartilhados entre as telas: fingerprint anônimo, chamadas de API e toast.

function getFingerprint() {
  let fp = localStorage.getItem('palcoqa:fingerprint');
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem('palcoqa:fingerprint', fp);
  }
  return fp;
}

async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'request_failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function showToast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2400);
}

function codeFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[1] || '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
