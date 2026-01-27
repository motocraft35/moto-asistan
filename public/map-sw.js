const CACHE_NAME = 'map-tiles-cache-v1';
const MAP_SOURCES = [
  'api.maplibre.com',
  'basemaps.cartocdn.com',
  'tiles.stadiamaps.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Sadece harita tile'larını ve stillerini önbelleğe al
  const isMapSource = MAP_SOURCES.some(source => url.hostname.includes(source));
  const isTileRequest = url.pathname.includes('/tiles/') ||
    url.pathname.includes('.pbf') ||
    url.pathname.includes('.png') ||
    url.pathname.includes('.json');

  if (isMapSource && isTileRequest) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          return response || fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});