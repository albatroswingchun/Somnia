// SOMNIA v2.7 — STATIC CACHE (AUDIO LIB ONLY)
const CACHE_STATIC = 'somnia-static-v2.7';
const CACHE_AUDIO  = 'somnia-audio-v2.7';

self.addEventListener('install', e=>{
 e.waitUntil(caches.open(CACHE_STATIC).then(c=>c.addAll(['./','./index.html','./manifest.json','./assets/audio/library.json'])));
 self.skipWaiting();
});

self.addEventListener('activate', e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>{if(![CACHE_STATIC,CACHE_AUDIO].includes(k))return caches.delete(k);}))))
 self.clients.claim();
});

self.addEventListener('fetch', e=>{
 e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
