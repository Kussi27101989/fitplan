const CACHE_VERSION = 'fitplan-v' + Date.now();
const CACHE_NAME = CACHE_VERSION;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(['./index.html', './manifest.json']))
  );
  // Sofort aktivieren – nicht auf Tab-Schließen warten
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  // Alle offenen Tabs sofort übernehmen
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network first – immer frische Version von GitHub holen
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
