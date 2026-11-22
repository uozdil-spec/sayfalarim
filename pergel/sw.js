var V = 'pg-20261122-1449';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'ikon.svg', 'ikon-32.png', 'ikon-180.png', 'ikon-192.png', 'ikon-512.png', 'ikon-maskable-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/lines/LineSegmentsGeometry.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/lines/LineMaterial.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/lines/LineSegments2.js'];
// Pergel internetsiz de açılsın: sayfa ve kütüphaneler bilgisayarda saklanır
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return Promise.all(FILES.map(function (f) { return c.add(f).catch(function () {}); })); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V && k !== 'pg-lib' && k.indexOf('pg-') === 0; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url), same = u.origin === location.origin, lib = /cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net/.test(u.host);
  if (!same && !lib) return;
  if (lib) { // kütüphaneler değişmez: önce önbellek
    e.respondWith(caches.match(e.request).then(function (m) { return m || fetch(e.request).then(function (r) { if (r.ok) { var cp = r.clone(); caches.open('pg-lib').then(function (c) { c.put(e.request, cp); }); } return r; }); }));
    return;
  }
  // kendi dosyalarımız: önce ağ (güncel kalsın), olmazsa önbellek
  e.respondWith(fetch(e.request).then(function (r) {
    if (r.ok) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(e.request, cp); }).catch(function () {}); }
    return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html', { ignoreSearch: true }); }); }));
});
