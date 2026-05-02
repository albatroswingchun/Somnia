// ═══════════════════════════════════════════════════════════════
// SOMNIA v2 — Service Worker
// Stratégie : Cache-First pour assets statiques et fichiers audio
// ═══════════════════════════════════════════════════════════════

const CACHE_STATIC = 'somnia-static-v2.3';
const CACHE_AUDIO  = 'somnia-audio-v2.3';

// Assets statiques mis en cache à l'installation
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/audio/library.json',
];

// Extensions audio reconnues
const AUDIO_EXTS = ['.m4a', '.mp3', '.wav', '.ogg', '.aac', '.flac'];

// ─── INSTALL ────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ───────────────────────────────────────────────────
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

// ─── FETCH ──────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const ext = url.pathname.substring(url.pathname.lastIndexOf('.')).toLowerCase();

  // ── Fichiers audio : Cache-First, mise en cache au premier chargement
  if (AUDIO_EXTS.includes(ext)) {
    event.respondWith(audioStrategy(event.request));
    return;
  }

  // ── library.json : toujours réseau d'abord pour voir les nouvelles pistes
  if (url.pathname.endsWith('/assets/audio/library.json')) {
    event.respondWith(networkFirstStatic(event.request));
    return;
  }

  // ── Assets statiques (HTML, CSS, JS, manifests) : Cache-First
  if (url.origin === self.location.origin) {
    event.respondWith(staticStrategy(event.request));
    return;
  }

  // ── Fonts Google : Stale-While-Revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(fontStrategy(event.request));
    return;
  }

  // Tout le reste : réseau direct
});


// ─── STRATÉGIE STATIC RÉSEAU-D'ABORD (pour library.json) ─────────
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
    return new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

// ─── STRATÉGIE AUDIO : Cache-First avec fallback réseau ─────────
async function audioStrategy(request) {
  const cache = await caches.open(CACHE_AUDIO);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      // Cloner avant de mettre en cache (le body ne peut être lu qu'une fois)
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Fichier audio absent : retourner une réponse vide (le JS gérera le fallback générateur)
    return new Response('', {
      status: 404,
      statusText: 'Audio file not found — using generator fallback',
    });
  }
}

// ─── STRATÉGIE STATIQUE : Cache-First, revalidation en arrière-plan
async function staticStrategy(request) {
  const cache  = await caches.open(CACHE_STATIC);
  const cached = await cache.match(request);

  if (cached) {
    // Revalidation silencieuse
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
    // Offline : retourner index.html pour les navigations document
    if (request.destination === 'document') {
      return cache.match('./index.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

// ─── STRATÉGIE FONTS : Stale-While-Revalidate ───────────────────
async function fontStrategy(request) {
  const cache  = await caches.open(CACHE_STATIC);
  const cached = await cache.match(request);

  if (cached) {
    fetch(request)
      .then(r => { if (r && r.status === 200) cache.put(request, r); })
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ─── MESSAGE : Forcer mise à jour ───────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();

  // Précache des fichiers audio à la demande
  if (event.data && event.data.type === 'PRECACHE_AUDIO') {
    const files = event.data.files || [];
    caches.open(CACHE_AUDIO).then(cache => {
      files.forEach(f => {
        fetch(f).then(r => {
          if (r && r.status === 200) cache.put(f, r);
        }).catch(() => {});
      });
    });
  }
});
