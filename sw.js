// Feste Version – bei jedem Deploy hochzählen. NICHT Date.now() verwenden:
// Der SW-Code läuft bei jedem Kaltstart neu, ein Zeitstempel würde bei jedem
// Neustart einen neuen Cache anlegen (Cache-Wildwuchs). Beim Aktivieren dieser
// Version werden alle alten (auch die Date.now-Caches) automatisch gelöscht.
const CACHE_NAME = 'fitplan-v3';
const PRECACHE = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE))
  );
  // Sofort aktivieren – nicht auf Tab-Schließen warten
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      // Alle offenen Tabs erst nach dem Aufräumen übernehmen
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Nur GET behandeln – POST/PUT o. Ä. würden cache.put werfen.
  if (req.method !== 'GET') return;

  // Navigationen (Adresszeile, Bookmark, Root-URL) → Network-first,
  // offline aber immer die App-Shell ausliefern.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put('./index.html', clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Übrige GET-Requests: Network-first, Cache als Fallback.
  e.respondWith(
    fetch(req)
      .then(res => {
        // Nur erfolgreiche, lesbare Antworten cachen (keine 404/500/opaque).
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
