var V = 'ks-20261112-1742';
var FILES = ['./', 'index.html', 'style.css', 'vendor/mqtt.min.js', 'kscore.js', 'pisti.js', 'dost.js', 'pis7.js', 'cards.js', 'core.js', 'stage.js', 'scenes.js', 'session.js', 'net.js', 'ui.js', 'panels.js', 'app.js', 'manifest.webmanifest', 'fonts/great-vibes-latin-400-normal.woff2', 'icons/ikon.svg', 'icons/ikon-180.png', 'icons/ikon-192.png', 'icons/ikon-512.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return Promise.all(FILES.map(function (f) { return c.add(f).catch(function () {}); })); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V && k.indexOf('ks-') === 0; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // önce ağ (güncel kalsın), olmazsa önbellek
  e.respondWith(fetch(e.request).then(function (r) {
    var cp = r.clone(); caches.open(V).then(function (c) { c.put(e.request, cp); }).catch(function () {});
    return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); }); }));
});
