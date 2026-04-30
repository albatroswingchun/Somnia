// ── SOMNIA Service Worker ──────────────────────────────────────
// Stratégie : Cache First pour les assets statiques
// Les sons générés par Web Audio API ne nécessitent pas de mise en cache audio.

const CACHE_NAME = 'somnia-v1.0.0';

// Assets à mettre en cache au premier chargement
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // Fonts Google (mises en cache automatiquement par le browser)
];

// ── INSTALL ────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Prend le contrôle immédiatement
  self.skipWaiting();
});

// ── ACTIVATE ───────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    // Supprime les anciens caches
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Ignore les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // Ignore les requêtes cross-origin (Google Fonts, etc.) — laisser le navigateur gérer
  const url = new URL(event.request.url);
  if (url.origin !== location.origin && !url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Ne met en cache que les réponses valides
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return response;
      }).catch(() => {
        // Fallback offline : retourner la page principale
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ── MESSAGE ────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
