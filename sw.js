// ═══════════════════════════════════════════════════════════════
// SOMNIA v2 — Service Worker (fixed audio paths)
// ═══════════════════════════════════════════════════════════════

const CACHE_STATIC = 'somnia-static-v2.5';
const CACHE_AUDIO  = 'somnia-audio-v2.5';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/audio/library.json',
];

const AUDIO_EXTS = ['.m4a', '.mp3', '.wav', '.ogg', '.aac', '.flac'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const validCaches = [CACHE_STATIC, CACHE_AUDIO];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !validCaches.includes(k))
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const ext = url.pathname.substring(url.pathname.lastIndexOf('.')).toLowerCase();

  if (AUDIO_EXTS.includes(ext)) {
    event.respondWith(audioStrategy(event.request));
    return;
  }

  if (event.request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(networkFirstStatic(event.request));
    return;
  }

  if (url.pathname.endsWith('/assets/audio/library.json')) {
    event.respondWith(networkFirstStatic(event.request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staticStrategy(event.request));
    return;
  }
});

async function networkFirstStatic(request) {
  const cache = await caches.open(CACHE_STATIC);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('{}', { status: 503 });
  }
}

async function audioStrategy(request) {
  const cache = await caches.open(CACHE_AUDIO);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 404 });
  }
}

async function staticStrategy(request) {
  const cache  = await caches.open(CACHE_STATIC);
  const cached = await cache.match(request);

  if (cached) {
    fetch(request)
      .then(response => {
        if (response && response.status === 200) cache.put(request, response);
      })
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.destination === 'document') {
      return cache.match('./index.html');
    }
    return new Response('Offline', { status: 503 });
  }
}
