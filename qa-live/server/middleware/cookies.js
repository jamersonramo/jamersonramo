const COOKIE_NAME = 'editor_session';

// Parser minimalista: evita depender de cookie-parser so por causa de 1 cookie.
function parseCookies(header) {
  const out = {};
  String(header || '')
    .split(';')
    .forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return;
      const key = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (key) out[key] = decodeURIComponent(value);
    });
  return out;
}

function attachCookies(req, res, next) {
  req.cookies = parseCookies(req.headers.cookie);
  next();
}

function setSessionCookie(res, token) {
  const maxAge = 30 * 24 * 60 * 60; // 30 dias, em segundos
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

module.exports = { COOKIE_NAME, parseCookies, attachCookies, setSessionCookie, clearSessionCookie };
