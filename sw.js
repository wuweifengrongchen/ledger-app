const CACHE = 'ledger-v3';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

// Clear ALL old caches on install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => caches.open(CACHE))
     .then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// Use new cache, delete old ones
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Always try network first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Update cache with fresh copy
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
