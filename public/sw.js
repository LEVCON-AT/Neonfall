// NEONFALL Service Worker
// Provides offline support (caches app shell + music) and the installability signal.

const CACHE_VERSION = 'neonfall-v1';
const PRECACHE_URLS = [
  '/',
  '/neonfall-music.mp3',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
];

// --- INSTALL: precache the app shell + music so the game runs offline ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            // use no-cors so opaque cross-origin-style responses still cache,
            // though all our precache targets are same-origin.
            const res = await fetch(url, { cache: 'reload' });
            if (res.ok || res.type === 'opaque') {
              await cache.put(url, res.clone());
            }
          } catch (e) {
            // ignore individual failures; the music might be large but fine
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

// --- ACTIVATE: drop old caches and take control ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// --- FETCH: serve app shell from cache (offline-first), runtime-cache static assets ---
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Navigation requests (the HTML page): network-first, fall back to cached "/".
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_VERSION);
          cache.put('/', fresh.clone()).catch(() => {});
          return fresh;
        } catch (e) {
          const cache = await caches.open(CACHE_VERSION);
          return (await cache.match('/')) || (await cache.match(req)) || Response.error();
        }
      })()
    );
    return;
  }

  // Same-origin static assets (music, icons, manifest, Next.js static): cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_VERSION);
        const cached = await cache.match(req);
        if (cached) {
          // refresh in background
          fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone()).catch(() => {});
            })
            .catch(() => {});
          return cached;
        }
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone()).catch(() => {});
          return res;
        } catch (e) {
          return Response.error();
        }
      })()
    );
    return;
  }

  // Cross-origin (e.g. Google Fonts): stale-while-revalidate with caching.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok || res.type === 'opaque') {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => cached || Response.error());
      return cached || network;
    })()
  );
});
