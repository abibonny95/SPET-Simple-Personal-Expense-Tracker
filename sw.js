/* SPET Service Worker
 * Cache versionata. Ad ogni rilascio incrementa CACHE_VERSION,
 * cosi gli utenti ricevono i file nuovi e la cache vecchia viene cancellata. */

var CACHE_VERSION = 6;
var CACHE_NAME = 'spet-v' + CACHE_VERSION;

var ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

// Installazione: scarica tutto saltando la cache HTTP del browser.
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(ASSETS.map(function (url) {
        return fetch(new Request(url, { cache: 'reload' })).then(function (res) {
          if (!res.ok) { throw new Error('Download fallito: ' + url); }
          return cache.put(url, res);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

// Attivazione: elimina le cache di versioni precedenti.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return (k.indexOf('spet-') === 0 || k.indexOf('wealthtrack-') === 0) && k !== CACHE_NAME;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Richieste: prima la cache, poi la rete. In background aggiorna la cache.
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') { return; }
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) { return; }

  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (cached) {
        var network = fetch(req).then(function (res) {
          if (res && res.ok) { cache.put(req, res.clone()); }
          return res;
        }).catch(function () { return null; });

        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        return network.then(function (res) {
          if (res) { return res; }
          // Offline e file non in cache: per le pagine torna alla home.
          if (req.mode === 'navigate') { return cache.match('index.html'); }
          return new Response('', { status: 504, statusText: 'Offline' });
        });
      });
    })
  );
});
