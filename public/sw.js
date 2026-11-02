/* eslint-disable no-undef */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');

if (workbox) {
  workbox.core.setCacheNameDetails({ prefix: 'nationtrack-auto' });
  workbox.core.clientsClaim();
  workbox.core.skipWaiting();

  workbox.precaching.precacheAndRoute([
    { url: '/NationTrack.png', revision: '1' },
    { url: '/automobiles', revision: '1' },
  ]);

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/automobiles/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'automobiles-api',
      networkTimeoutSeconds: 4,
      plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 3600 })],
    })
  );

  workbox.routing.registerRoute(
    ({ url }) => url.origin.includes('tile.openstreetmap.org'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'osm-tiles',
      plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 250, maxAgeSeconds: 86400 })],
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 4,
    })
  );
}
