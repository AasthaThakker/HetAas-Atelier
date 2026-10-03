/* HetAas Atelier - Service Worker
 * Strategy:
 *   - App shell (html/css/js/icons/manifest): precached.
 *   - Data (products.json, content.json) + app.js/styles.css: stale-while-revalidate
 *     (instant from cache, refreshed in the background for the next load).
 *   - Images: cache-first, runtime-cached (offline browsing after first view).
 *   - Navigations: network-first, fall back to cached page, then offline.html.
 * Bump CACHE_VERSION on a release when you want to force-purge all old caches.
 */
const CACHE_VERSION = 'hetaas-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const IMG_CACHE = `${CACHE_VERSION}-img`;

// Paths are relative to the SW scope (deploy root).
const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './styles.css',
  './offline.html',
  './manifest.webmanifest',
  './icons/favicon.svg',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] Precache failed', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isDataRequest(url) {
  return url.pathname.endsWith('products.json') || url.pathname.endsWith('content.json');
}

function isImageRequest(request, url) {
  return request.destination === 'image' || /\.(?:png|jpe?g|gif|webp|svg|ico)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin requests; let the network handle the rest (e.g. fonts, analytics).
  if (url.origin !== self.location.origin) return;

  // Data: stale-while-revalidate
  if (isDataRequest(url)) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((resp) => {
            if (resp && resp.ok) cache.put(request, resp.clone());
            return resp;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Images: cache-first with runtime caching
  if (isImageRequest(request, url)) {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const resp = await fetch(request);
          if (resp && resp.ok) cache.put(request, resp.clone());
          return resp;
        } catch (e) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Navigations: network-first, fall back to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return resp;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('./index.html') || caches.match('./offline.html');
        })
    );
    return;
  }

  // Everything else same-origin (app.js, styles.css, etc.): stale-while-revalidate
  // so a returning visitor gets an instant cached response AND the newest version
  // is fetched in the background for the next load — no manual cache bump needed.
  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request).then((resp) => {
        if (resp && resp.ok && resp.type === 'basic') cache.put(request, resp.clone());
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
