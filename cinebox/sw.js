// Streams Drive files to <video>: adds the Google token, and builds Range/size headers itself
// (Drive's CORS hides some of them), so seeking works for any file the browser can decode.
let token = '', got = 0;
const CAP = 16 * 1024 * 1024;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
async function ask() {
  for (const c of await clients.matchAll({ type: 'window' })) {
    const t = await new Promise(res => {
      const ch = new MessageChannel(); ch.port1.onmessage = e => res(e.data);
      c.postMessage({ type: 'need-token' }, [ch.port2]); setTimeout(() => res(null), 10000);
    });
    if (t) { got = Date.now(); return t; }
  }
  return '';
}
async function stream(req, u) {
  const id = u.pathname.split('/')[2], size = +u.searchParams.get('size') || 0;
  const rg = /bytes=(\d*)-(\d*)/.exec(req.headers.get('Range') || '');
  for (let a = 0; a < 2; a++) {
    if (!token || Date.now() - got > 40 * 60000) token = await ask();
    if (!token) break;
    const h = { Authorization: 'Bearer ' + token }, o = new Headers();
    let status = 200, s = 0, e = size - 1;
    if (rg && size) {
      s = rg[1] === '' ? Math.max(0, size - +rg[2]) : +rg[1];
      e = Math.min(size - 1, rg[1] !== '' && rg[2] !== '' ? +rg[2] : size - 1, s + CAP - 1);
      if (s >= size) return new Response('', { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
      h.Range = 'bytes=' + s + '-' + e; status = 206;
      o.set('Content-Range', 'bytes ' + s + '-' + e + '/' + size); o.set('Content-Length', String(e - s + 1));
    } else if (size) o.set('Content-Length', String(size));
    const r = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?alt=media', { headers: h });
    if (r.status === 401) { token = ''; continue; }
    if (!r.ok && r.status !== 206) return new Response('Drive error ' + r.status, { status: r.status });
    o.set('Accept-Ranges', 'bytes');
    o.set('Content-Type', u.searchParams.get('type') || 'video/mp4');
    if (u.searchParams.get('dl')) o.set('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(u.searchParams.get('name') || 'video'));
    o.set('Cross-Origin-Resource-Policy', 'same-origin');
    return new Response(r.body, { status, headers: o });
  }
  return new Response('Please sign in again', { status: 401 });
}
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin === location.origin && u.pathname.startsWith('/drive/')) e.respondWith(stream(e.request, u));
});
