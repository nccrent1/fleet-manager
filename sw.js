// Fleet Manager Pro — Service Worker v3
const CACHE = 'fleet-v3';
const ASSETS = ['/fleet-manager/', '/fleet-manager/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // API calls: sempre rete
  if (e.request.url.includes('supabase.co') || e.request.url.includes('resend.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // HTML: network-first → sempre versione aggiornata, fallback cache se offline
  if (e.request.mode === 'navigate' ||
      e.request.url.endsWith('.html') ||
      e.request.url.endsWith('/fleet-manager/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Tutto il resto: cache-first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
