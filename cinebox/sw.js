// Cinebox service worker: streams Google Drive files into <video>/<audio>.
// - Adds the Google token and builds Range/size headers itself (Drive's CORS hides some of them).
// - Reads ahead: fetches several 8 MB parts in parallel and hands them to the player in order,
//   so playback does not wait on one slow request. Failed parts are retried.
// - Keeps the worker alive while a stream is running and honours the token's real expiry time.
let tok = { t: '', e: 0 };
const PART = 8 * 1024 * 1024, AHEAD = 4;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

async function ask(force) {
  if (!force && tok.t && tok.e - Date.now() > 60000) return tok.t;
  for (const c of await clients.matchAll({ type: 'window' })) {
    const r = await new Promise(res => {
      const ch = new MessageChannel(); ch.port1.onmessage = e => res(e.data);
      c.postMessage({ type: 'need-token' }, [ch.port2]); setTimeout(() => res(null), 8000);
    });
    if (r && r.t && r.e - Date.now() > 20000) { tok = r; return r.t; }
  }
  return '';
}
self.addEventListener('message', e => { if (e.data && e.data.type === 'token' && e.data.t) tok = { t: e.data.t, e: e.data.e }; });

async function part(id, a, b, sig) {
  let err;
  for (let n = 0; n < 4; n++) {
    try {
      const t = await ask(n > 0 && err === 401); if (!t) throw 401;
      const r = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?alt=media', { headers: { Authorization: 'Bearer ' + t, Range: 'bytes=' + a + '-' + b }, signal: sig });
      if (r.status === 401) { tok = { t: '', e: 0 }; err = 401; continue; }
      if (r.status === 404) throw new Error('File not found in Drive');
      if (!r.ok && r.status !== 206) { err = r.status; await new Promise(k => setTimeout(k, 500 * (n + 1))); continue; }
      const buf = new Uint8Array(await r.arrayBuffer());
      return r.status === 200 ? buf.subarray(a, b + 1) : buf;
    } catch (e) { if (e && e.name === 'AbortError') throw e; err = e; await new Promise(k => setTimeout(k, 400 * (n + 1))); }
  }
  throw new Error('Drive read failed (' + (err && err.message || err) + ')');
}

function stream(s, e, id, done) {
  const ctl = new AbortController(), q = []; let next = s;
  const fill = () => { while (q.length < AHEAD && next <= e) { const a = next, b = Math.min(e, a + PART - 1); next = b + 1; const p = part(id, a, b, ctl.signal); p.catch(() => { }); q.push(p); } };
  return new ReadableStream({
    async pull(c) {
      fill();
      if (!q.length) { c.close(); done(); return; }
      try { c.enqueue(await q.shift()); fill(); } catch (x) { ctl.abort(); c.error(x); done(); }
    },
    cancel() { ctl.abort(); done(); }
  }, { highWaterMark: 1 });
}

async function serve(e, u, fin) {
  const req = e.request, id = u.pathname.split('/')[2], size = +u.searchParams.get('size') || 0;
  if (!(await ask())) { fin(); return new Response('Please sign in again', { status: 401 }); }
  const rg = /bytes=(\d*)-(\d*)/.exec(req.headers.get('Range') || ''), h = new Headers();
  let status = 200, s = 0, en = size - 1;
  if (rg && size) {
    s = rg[1] === '' ? Math.max(0, size - +rg[2]) : +rg[1];
    en = rg[1] !== '' && rg[2] !== '' ? Math.min(size - 1, +rg[2]) : size - 1;
    if (s >= size) { fin(); return new Response('', { status: 416, headers: { 'Content-Range': 'bytes */' + size } }); }
    status = 206; h.set('Content-Range', 'bytes ' + s + '-' + en + '/' + size);
  }
  if (!size) { // size unknown: single plain request
    const r = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?alt=media', { headers: { Authorization: 'Bearer ' + tok.t } }); fin();
    return new Response(r.body, { status: r.status, headers: { 'Content-Type': u.searchParams.get('type') || 'video/mp4', 'Cross-Origin-Resource-Policy': 'same-origin' } });
  }
  h.set('Content-Length', String(en - s + 1)); h.set('Accept-Ranges', 'bytes');
  h.set('Content-Type', u.searchParams.get('type') || 'video/mp4'); h.set('Cross-Origin-Resource-Policy', 'same-origin');
  h.set('Cache-Control', 'no-store');
  if (u.searchParams.get('dl')) h.set('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(u.searchParams.get('name') || 'video'));
  return new Response(req.method === 'HEAD' ? null : stream(s, en, id, fin), { status, headers: h });
}
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin === location.origin && u.pathname.startsWith('/drive/')) { let fin; e.waitUntil(new Promise(r => fin = r)); e.respondWith(serve(e, u, fin)); }
});
