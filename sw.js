// SOMNIA v2.6 — FORCE AUDIO FIX
const CACHE_STATIC = 'somnia-static-v2.6';
const CACHE_AUDIO  = 'somnia-audio-v2.6';

self.addEventListener('install', e=>{
 e.waitUntil(caches.open(CACHE_STATIC).then(c=>c.addAll(['./','./index.html','./manifest.json','./assets/audio/library.json','./assets/audio/runtime-audio-fix.js'])));
 self.skipWaiting();
});

self.addEventListener('activate', e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>{if(![CACHE_STATIC,CACHE_AUDIO].includes(k))return caches.delete(k);}))))
 self.clients.claim();
});

self.addEventListener('fetch', e=>{
 if(e.request.destination==='document'){
   e.respondWith(fetch(e.request).then(async res=>{
     const text=await res.text();
     const injected=text.replace('</body>','<script src="assets/audio/runtime-audio-fix.js"></script></body>');
     return new Response(injected,{headers:{'Content-Type':'text/html'}});
   }).catch(()=>caches.match('./index.html')));
   return;
 }
 e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
