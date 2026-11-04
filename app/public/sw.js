/* Salat service worker.
   Owns: the offline cache, lock-screen notifications (push), and taps on a notification.
   Refuses: prayer math (the server sends the words; the page does the rest).

   Cache strategy:
     navigation  -> network first, fall back to cache (updates land when online)
     same-origin -> cache first, filled as files are used
   Bump VERSION when this file's behaviour changes. Built files have hashed
   names, so a new build never collides with an old cache. */

const VERSION = 'salat-v4';
const SHELL = VERSION + '-shell';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL)
      .then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icon-180.png']))
      .catch(() => {}) // a missing file on some hosts must not block install
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!url.protocol.startsWith('http')) return; // leave blob: ICS downloads alone
  if (url.origin !== self.location.origin) return; // the API server is never cached

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match('./index.html', { ignoreSearch: true })
            .then((hit) => hit || caches.match('./', { ignoreSearch: true }))
            .then((hit) => hit || new Response(
              '<meta name="viewport" content="width=device-width,initial-scale=1">' +
              '<body style="background:#04101F;color:#E8F2FF;font-family:-apple-system,sans-serif;' +
              'display:grid;place-items:center;height:100vh;margin:0;text-align:center;padding:24px">' +
              '<p>Open this once while online, then it works offline.</p></body>',
              { headers: { 'Content-Type': 'text/html' } },
            )),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) =>
      hit || fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }),
    ),
  );
});

/* ---- lock-screen alerts ----
   The server sends {title, body, k, at}. iOS shows it on the lock screen,
   in Notification Center and on Apple Watch. */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'Salat', body: event.data && event.data.text() }; }
  const title = data.title || 'Salat';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: './icon-180.png',
      badge: './icon-180.png',
      tag: data.k ? 'prayer-' + data.k : 'salat', // a new alert for the same prayer replaces the old one
      renotify: true,
      timestamp: data.at || Date.now(),
      data: { url: './', k: data.k },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) if ('focus' in w) return w.focus();
      return self.clients.openWindow ? self.clients.openWindow('./') : undefined;
    }),
  );
});
