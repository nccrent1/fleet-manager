// Fleet Manager Pro — Service Worker
const CACHE = 'fleet-v1';
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
  // Per le chiamate API (Supabase/Resend) vai sempre in rete
  if (e.request.url.includes('supabase.co') || e.request.url.includes('resend.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Per tutto il resto: cache first, poi rete
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
