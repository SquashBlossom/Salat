/* Salat NY — offline service worker
   Strategy:
     navigation  -> network first, fall back to cache (so updates land when online)
     same-origin -> cache first
     fonts (CDN) -> cache first, refresh in background
   Bump VERSION whenever index.html changes. */

const VERSION   = 'salat-ny-v1';
const SHELL     = VERSION + '-shell';
const FONTS     = VERSION + '-fonts';
const SHELL_URLS = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(SHELL)
      .then(c => c.addAll(SHELL_URLS))
      .catch(() => {})            // a missing './' on some hosts must not block install
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== FONTS).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

const isFont = url =>
  url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (!url.protocol.startsWith('http')) return;   // leave blob: ICS downloads alone

  // ---- the page itself ----
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match('./index.html', { ignoreSearch: true })
            .then(hit => hit || caches.match('./', { ignoreSearch: true }))
            .then(hit => hit || new Response(
              '<meta name="viewport" content="width=device-width,initial-scale=1">' +
              '<body style="background:#04101F;color:#E8F2FF;font-family:-apple-system,sans-serif;' +
              'display:grid;place-items:center;height:100vh;margin:0;text-align:center;padding:24px">' +
              '<p>Open this once while online, then it works offline.</p></body>',
              { headers: { 'Content-Type': 'text/html' } }
            ))
        )
    );
    return;
  }

  // ---- webfonts ----
  if (isFont(url)) {
    event.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req)
          .then(res => {
            const copy = res.clone();
            caches.open(FONTS).then(c => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // ---- everything else same-origin ----
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(hit =>
        hit || fetch(req).then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
      )
    );
  }
});
