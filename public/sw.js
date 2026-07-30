// NEONFALL Service Worker
// Provides offline support (caches app shell + music) and the installability signal.

const CACHE_VERSION = 'neonfall-v12-s8-22-new-tracks';
const PRECACHE_URLS = [
  '/',
  '/neonfall-music.mp3',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.png',
  '/music/track-1-neon-pulse.mp3',
  '/music/track-2-neon-pulse-alt.mp3',
  '/music/track-3-neon-pixel-run.mp3',
  '/music/track-4-neon-pixel-run-alt.mp3',
  '/music/track-5-neon-pixel-rush.mp3',
  '/music/track-6-neon-pixel-rush-alt.mp3',
  '/music/track-7-block-rush.mp3',
  '/music/track-8-block-rush-alt.mp3',
  '/music/track-9-block-rush-ii.mp3',
  '/music/track-10-block-rush-iii.mp3',
  '/music/track-11-block-rush-iv.mp3',
  '/music/track-12-block-rush-v.mp3',
  '/music/track-13-block-rush-vi.mp3',
  '/music/track-14-neon-block-rush.mp3',
  '/music/track-15-neon-block-rush-alt.mp3',
  '/music/track-16-neon-pulse-ii.mp3',
  '/music/track-17-neon-pulse-iii.mp3',
  '/music/track-18-neon-pixel-run.mp3',
  '/music/track-19-neon-pixel-run-alt.mp3',
  '/music/track-20-neon-pixel-rush.mp3',
  '/music/track-21-neon-pixel-rush-alt.mp3',
  '/music/track-22-block-rush-vii.mp3',
  '/music/track-23-block-rush-viii.mp3',
  '/music/track-24-block-rush-ix.mp3',
  '/music/track-25-block-rush-x.mp3',
  '/music/track-26-block-rush-xi.mp3',
  '/music/track-27-block-rush-xii.mp3',
  '/music/track-28-block-rush-xiii.mp3',
  '/music/track-29-block-rush-xiv.mp3',
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

  // API requests (e.g. /api/leaderboard, /api/scores): NEVER cache — always
  // network-first, no store. This was a bug in S4 where the SW served stale
  // leaderboard data from cache. API responses are inherently dynamic.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch (e) {
          return Response.error();
        }
      })()
    );
    return;
  }

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
