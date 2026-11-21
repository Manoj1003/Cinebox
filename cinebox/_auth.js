// Persistent Google sign-in. Keeps an encrypted refresh token in an httpOnly cookie (1 year),
// so the browser can get fresh Drive access tokens silently. Shared by api/start, callback, token and logout (files starting with _ are not routes).
const crypto = require('crypto');
const { GOOGLE_CLIENT_ID: ID, GOOGLE_CLIENT_SECRET: SEC, SESSION_SECRET: SS } = process.env;
const key = () => crypto.createHash('sha256').update(SS || '').digest();
const enc = t => { const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key(), iv); const b = Buffer.concat([c.update(t, 'utf8'), c.final()]); return Buffer.concat([iv, c.getAuthTag(), b]).toString('base64url'); };
const dec = s => { const b = Buffer.from(s, 'base64url'), d = crypto.createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28)); return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'); };
const jar = req => Object.fromEntries((req.headers.cookie || '').split(/;\s*/).filter(Boolean).map(c => { const i = c.indexOf('='); return [c.slice(0, i), c.slice(i + 1)]; }));
const origin = req => (req.headers['x-forwarded-proto'] || 'https') + '://' + req.headers.host;
const ck = (req, n, v, age) => `${n}=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${origin(req).startsWith('https') ? '; Secure' : ''}`;
const form = o => new URLSearchParams(o).toString();
const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form(body) });

module.exports = a => async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!ID || !SEC || !SS) return res.status(500).json({ error: 'Server not configured' });
  const redirect = origin(req) + '/api/callback';
  try {
    if (a === 'start') {
      const st = crypto.randomBytes(16).toString('hex');
      res.setHeader('Set-Cookie', ck(req, 'cb_st', st, 600));
      return res.redirect(302, 'https://accounts.google.com/o/oauth2/v2/auth?' + form({
        client_id: ID, redirect_uri: redirect, response_type: 'code', access_type: 'offline', prompt: 'consent',
        scope: 'https://www.googleapis.com/auth/drive.file', state: st }));
    }
    if (a === 'callback') {
      const c = jar(req);
      if (!req.query.code || !c.cb_st || req.query.state !== c.cb_st) return res.redirect(302, '/library?err=1');
      const j = await (await post('https://oauth2.googleapis.com/token', { code: req.query.code, client_id: ID, client_secret: SEC, redirect_uri: redirect, grant_type: 'authorization_code' })).json();
      if (!j.refresh_token) return res.redirect(302, '/library?err=1');
      res.setHeader('Set-Cookie', [ck(req, 'cb_rt', enc(j.refresh_token), 31536000), ck(req, 'cb_st', '', 0)]);
      return res.redirect(302, '/library');
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    if (a === 'logout') { res.setHeader('Set-Cookie', ck(req, 'cb_rt', '', 0)); return res.json({ ok: true }); }
    if (a === 'token') {
      const c = jar(req); if (!c.cb_rt) return res.status(401).json({ error: 'signin' });
      let rt; try { rt = dec(c.cb_rt); } catch (e) { return res.status(401).json({ error: 'signin' }); }
      const j = await (await post('https://oauth2.googleapis.com/token', { refresh_token: rt, client_id: ID, client_secret: SEC, grant_type: 'refresh_token' })).json();
      if (!j.access_token) { res.setHeader('Set-Cookie', ck(req, 'cb_rt', '', 0)); return res.status(401).json({ error: 'signin' }); }
      return res.json({ token: j.access_token, expires_in: j.expires_in });
    }
    return res.status(400).json({ error: 'Unknown' });
  } catch (e) { console.error(e); return res.status(500).json({ error: 'Server error' }); }
};
