// Streams Drive files to the <video> tag: adds the Google token and passes Range requests through.
let token = '', got = 0;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
async function ask() {
  for (const c of await clients.matchAll({ type: 'window' })) {
    const t = await new Promise(res => {
      const ch = new MessageChannel(); ch.port1.onmessage = e => res(e.data);
      c.postMessage({ type: 'need-token' }, [ch.port2]); setTimeout(() => res(null), 8000);
    });
    if (t) { got = Date.now(); return t; }
  }
  return '';
}
async function stream(req, u) {
  const id = u.pathname.split('/')[2];
  for (let a = 0; a < 2; a++) {
    if (!token || Date.now() - got > 45 * 60000) token = await ask();
    if (!token) break;
    const h = { Authorization: 'Bearer ' + token }, rg = req.headers.get('Range');
    if (rg) h.Range = rg;
    const r = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?alt=media', { headers: h });
    if (r.status === 401) { token = ''; continue; }
    const o = new Headers();
    ['Content-Length', 'Content-Range', 'Accept-Ranges'].forEach(k => r.headers.get(k) && o.set(k, r.headers.get(k)));
    if (!o.has('Accept-Ranges')) o.set('Accept-Ranges', 'bytes');
    o.set('Content-Type', u.searchParams.get('type') || r.headers.get('Content-Type') || 'video/mp4');
    if (u.searchParams.get('dl')) o.set('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(u.searchParams.get('name') || 'video'));
    o.set('Cross-Origin-Resource-Policy', 'same-origin');
    return new Response(r.body, { status: r.status, headers: o });
  }
  return new Response('Please sign in again', { status: 401 });
}
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin === location.origin && u.pathname.startsWith('/drive/')) e.respondWith(stream(e.request, u));
});
