/* Kafes Dövüşü · çevrimdışı açılış: önce ağ, yavaş ya da yoksa son kopya. */
const C = 'kafes-20261110-1332';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== C && k.indexOf('kafes-') === 0; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(function (hit) {
    var n = fetch(r).then(function (res) { if (res && res.ok) { var cp = res.clone(); caches.open(C).then(function (c) { c.put(r, cp); }); } return res; });
    if (!hit) return n;
    return Promise.race([n.catch(function () { return hit; }), new Promise(function (ok) { setTimeout(function () { ok(hit); }, 3500); })]);
  }));
});
