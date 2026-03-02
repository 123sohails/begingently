const CACHE_NAME = 'begingently-v5';
const OFFLINE_URL = '/offline.html';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/library.html',
  '/offline.html',
  '/css/main.css',
  '/js/main.js?v=20260304',
  '/js/readmore.js?v=20260304',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/images/logo-ba-green.svg',
  '/library/beliefs.html',
  '/library/books.html',
  '/library/common-questions.html',
  '/library/hadith.html',
  '/library/practicing.html',
  '/library/proofs.html',
  '/library/prophet.html',
  '/library/quran.html',
  '/library/resources.html',
  '/library/salah.html',
  '/library/scholars-websites.html',
  '/library/starter-plan.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          return cachedPage || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  if (isSameOrigin) {
    const isDynamicContent =
      request.destination === 'document' ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css');

    if (isDynamicContent) {
      // Network-first for pages/scripts/styles to avoid stale deploys.
      event.respondWith(
        fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(async () => {
            const cached = await caches.match(request);
            return cached || caches.match(OFFLINE_URL);
          })
      );
      return;
    }

    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => caches.match(OFFLINE_URL));
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => {
      if (isNavigation) {
        return caches.match(OFFLINE_URL);
      }
      return new Response('', { status: 503, statusText: 'Offline' });
    })
  );
});
