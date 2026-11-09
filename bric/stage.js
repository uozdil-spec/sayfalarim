/* Kart Salonu · sahne: kart öğelerini yönetir, konumlar arası akıcı hareket ettirir */
(function (root) {
'use strict';
var BR = root.BR;

function Stage(layer) {
  this.layer = layer;
  this.els = {};
  this.cw = 64;
  this.w = 0; this.h = 0;
  this.timers = [];
}
BR.Stage = Stage;

Stage.prototype.setSize = function (w, h, cw) {
  this.w = w; this.h = h; this.cw = cw;
  this.layer.style.setProperty('--cw', cw + 'px');
};

Stage.prototype.place = function (el, p) {
  var cw = this.cw, ch = cw * 1.4;
  var x = p.x - cw / 2, y = p.y - ch / 2 - (p.lift || 0);
  el.style.transform = 'translate3d(' + Math.round(x * 10) / 10 + 'px,' + Math.round(y * 10) / 10 + 'px,0) rotate(' + (p.rot || 0) + 'deg) scale(' + (p.sc === undefined ? 1 : p.sc) + ')';
  el.style.zIndex = p.z === undefined ? 1 : Math.round(p.z);
};

/* items: [{k, c, x, y, rot, sc, z, down, lift, cls, spawn, delay, act}] */
Stage.prototype.render = function (items, opts) {
  opts = opts || {};
  var seen = {}, i, self = this, k;
  for (i = 0; i < items.length; i++) {
    var it = items[i], rec = this.els[it.k];
    seen[it.k] = 1;
    var down = it.down || it.c < 0;
    if (!rec) {
      var el = BR.cards.el(it.c);
      el.setAttribute('data-k', it.k);
      rec = this.els[it.k] = { el: el, k: it.k };
      var sp = it.spawn || it;
      el.classList.add('mv');
      if (sp.down !== undefined ? sp.down : down) el.classList.add('down'); else if (it.c < 0) el.classList.add('down');
      this.place(el, sp);
      if (!it.spawn) el.style.opacity = '0';
      this.layer.appendChild(el);
      void el.offsetWidth;
      el.classList.remove('mv');
      if (!it.spawn) el.style.opacity = '1';
    }
    var e2 = rec.el;
    if (it.c >= 0) e2.classList.toggle('down', !!down); else e2.classList.add('down');
    var d = it.delay ? (it.delay * (BR.speedMul || 1)) + 'ms' : '0ms';
    e2.style.transitionDelay = d;
    e2.firstChild.style.transitionDelay = d;
    this.place(e2, it);
    var cls = it.cls || '';
    e2.classList.toggle('sel', cls.indexOf('sel') >= 0);
    e2.classList.toggle('glow', cls.indexOf('glow') >= 0);
    e2.classList.toggle('dim', cls.indexOf('dim') >= 0);
    e2.setAttribute('data-act', it.act ? '1' : '0');
    rec.item = it;
  }
  for (k in this.els) {
    if (seen[k]) continue;
    this.drop(k, opts);
  }
};

Stage.prototype.drop = function (k, opts) {
  var rec = this.els[k], self = this;
  if (!rec) return;
  delete this.els[k];
  var el = rec.el, ex = opts && opts.exit;
  var hidden = k.charAt(0) === 'o' || k.charAt(0) === 'p' && k.charAt(1) === 'l';
  if (ex && !hidden) {
    var dl = (ex.delay || 0) * (BR.speedMul || 1);
    el.style.transitionDelay = dl + 'ms';
    this.place(el, { x: ex.x, y: ex.y, rot: ex.rot || 0, sc: ex.sc === undefined ? 0.55 : ex.sc, z: 2 });
    var tmo = setTimeout(function () { el.style.opacity = '0'; }, 420 * (BR.speedMul || 1) + dl);
    var tm2 = setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 760 * (BR.speedMul || 1) + dl);
    this.timers.push(tmo, tm2);
  } else {
    el.style.transitionDelay = '0ms';
    el.style.opacity = '0';
    var t3 = setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    this.timers.push(t3);
  }
};

Stage.prototype.clear = function () {
  var k;
  for (k in this.els) { var e = this.els[k].el; if (e.parentNode) e.parentNode.removeChild(e); }
  this.els = {};
  while (this.timers.length) clearTimeout(this.timers.pop());
  BR.clear(this.layer);
};

Stage.prototype.elOf = function (k) { return this.els[k] ? this.els[k].el : null; };

/* ---------- Yerleşim yardımcıları ---------- */
/* Oyuncunun eli: tek ya da iki sıra, hafif yelpaze */
BR.handLayout = function (n, G, o) {
  o = o || {};
  var out = [], i;
  if (!n) return out;
  var cw = G.cw, ch = cw * 1.4;
  var pad = 8, availW = o.maxW || (G.w - pad * 2);
  var baseY = G.h - ch / 2 - (o.bottom === undefined ? 6 : o.bottom);
  var minStep = cw * 0.34, maxStep = cw * (o.maxStep || 0.9);
  var rows = 1, per = n;
  if (n > 1 && (availW - cw) / (n - 1) < minStep * (o.twoRows === false ? 0 : 1.15) && o.twoRows !== false) { rows = 2; per = Math.ceil(n / 2); }
  var idx = 0, r;
  for (r = 0; r < rows; r++) {
    var m = r === 0 ? per : n - per;
    if (rows === 2 && r === 0) m = n - Math.floor(n / 2); // üst sıra kalan
    if (rows === 2) m = r === 0 ? Math.ceil(n / 2) : Math.floor(n / 2);
    var step = m > 1 ? Math.min(maxStep, (availW - cw) / (m - 1)) : 0;
    var total = cw + step * (m - 1);
    var x0 = (G.w - total) / 2 + cw / 2;
    var y = baseY - (rows === 2 ? (r === 0 ? ch * 0.36 : 0) : 0);
    var mid = (m - 1) / 2;
    for (i = 0; i < m; i++) {
      var t = mid ? (i - mid) / mid : 0;
      var fan = (!o.flat && rows === 1 && m <= 8) ? 1 : 0;
      out.push({ x: x0 + step * i, y: y + fan * t * t * cw * 0.05, rot: fan * t * 3.2, z: 20 + r * 40 + i, row: r });
    }
  }
  return out;
};

/* Rakip eli: küçük arka yüzler, yan koltuklarda dik dizilim */
BR.oppHand = function (n, seat, G) {
  var out = [], i, cwo = G.cw * seat.sc, step;
  if (!n) return out;
  var maxLen = seat.side === 'top' ? seat.maxLen : seat.maxLen;
  step = Math.min(cwo * 0.55, n > 1 ? (maxLen - cwo) / (n - 1) : 0);
  var total = cwo + step * (n - 1), mid = (n - 1) / 2;
  for (i = 0; i < n; i++) {
    var off = (i - mid) * step;
    var t = mid ? (i - mid) / mid : 0, fan = n <= 8 ? t * 3 : 0;
    if (seat.side === 'top') out.push({ x: seat.x + off, y: seat.y + Math.abs(t) * 1.5, rot: 180 + fan * -1, sc: seat.sc, z: 10 + i });
    else if (seat.side === 'left') out.push({ x: seat.x, y: seat.y + off, rot: 90, sc: seat.sc, z: 10 + i });
    else out.push({ x: seat.x, y: seat.y + off, rot: -90, sc: seat.sc, z: 10 + i });
  }
  return out;
};

/* Koltuk yerleşimi. Dönen dizi: koltuk numarasına göre (rel değil) */
BR.seatLayout = function (n, me, G) {
  var w = G.w, h = G.h, cw = G.cw, land = G.land, res = [], rel, s;
  var sc = land ? 0.5 : 0.5;
  var cwo = cw * sc, cho = cwo * 1.4;
  var topY = 8 + cho / 2;
  function top(xc, maxLen) { return { side: 'top', x: xc, y: topY, sc: sc, maxLen: maxLen, bx: xc, by: topY + cho / 2 + 22, px: xc + Math.min(maxLen, cwo * 3) / 2 + cwo * 0.65, py: topY + 8 } }
  var sideY = h * (land ? 0.46 : (n === 4 ? 0.40 : 0.42));
  function left() { var yc = sideY; var len = Math.min(h * 0.34, cwo * 4.4); return { side: 'left', x: 6 + cho / 2, y: yc, sc: sc, maxLen: len, bx: 6 + cho + 52, by: yc - len / 2 - 14 + 0, px: 6 + cho / 2, py: yc + len / 2 + cwo * 0.8 }; }
  function right() { var yc = sideY; var len = Math.min(h * 0.34, cwo * 4.4); return { side: 'right', x: w - 6 - cho / 2, y: yc, sc: sc, maxLen: len, bx: w - 6 - cho - 52, by: yc - len / 2 - 14, px: w - 6 - cho / 2, py: yc + len / 2 + cwo * 0.8 }; }
  var order;
  if (n === 2) order = [null, top(w / 2, Math.min(w * 0.5, cwo * 6))];
  else if (n === 3) order = land ? [null, left(), right()] : [null, top(w * 0.27, w * 0.34), top(w * 0.73, w * 0.34)];
  else order = [null, left(), top(w / 2, Math.min(w * 0.4, cwo * 6)), right()];
  var meS = { side: 'bottom', x: w / 2, y: h - cw * 0.7 - 6, sc: 1, bx: 0, by: 0, px: 0, py: 0 };
  for (s = 0; s < n; s++) {
    rel = (s - me + n) % n;
    var o = rel === 0 ? meS : order[rel];
    res[s] = o;
    o.rel = rel;
  }
  // kendi rozetim: elin solu üstünde
  meS.bx = Math.min(w * 0.5, 7.2 * 16) ; meS.by = h - cw * 1.4 - 24;
  meS.bx = 8 + 70; meS.by = h - cw * 1.4 - 30;
  if (land) { meS.bx = 8 + 72; meS.by = h - 24; }
  meS.px = w - 8 - cw * 0.5; meS.py = h - cw * 1.4 - 10 - cw * 0.3;
  return res;
};

if (typeof module !== 'undefined' && module.exports) module.exports = Stage;
})(typeof window !== 'undefined' ? window : globalThis);
