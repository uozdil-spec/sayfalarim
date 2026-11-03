/* Kart Salonu · her oyunun masa görünümü: durumdan kart konumları üretir */
(function (root) {
'use strict';
var KS = root.KS;
var rank = KS.rank, suit = KS.suit;
var SC = KS.scenes = {};

function hh(i) { return ((i + 7) * 2654435761 >>> 0) % 1000 / 1000; }
function lastEv(ev, t) { var i; for (i = (ev || []).length - 1; i >= 0; i--) if (ev[i].t === t) return ev[i]; return null; }
function hasEv(ev, t) { return !!lastEv(ev, t); }

/* Ortak parçalar */
function common(v, X) {
  var G = X.G, n = v.n, me = X.me;
  var L = KS.seatLayout(n, me, G);
  var c = {
    G: G, L: L, items: [], badges: [], cw: G.cw, ch: G.cw * 1.4,
    cx: G.w / 2, cy: G.h * (G.land ? 0.45 : 0.41), ev: X.ev || [],
    dealing: hasEv(X.ev, 'deal') || hasEv(X.ev, 'newHand') || X.fresh
  };
  c.deckPos = { x: c.cx - c.cw * (G.land ? 2.05 : 1.85), y: c.cy };
  return c;
}
function deckStack(c, count, per) {
  var k = Math.min(5, Math.max(count > 0 ? 1 : 0, Math.ceil(count / (per || 10)))), j;
  for (j = 0; j < k; j++) c.items.push({ k: 'dk' + j, c: -1, x: c.deckPos.x - j * 0.9, y: c.deckPos.y - j * 1.1, rot: 0, sc: 0.86, z: 3 + j });
  if (count > 0) c.badges.push({ x: c.deckPos.x, y: c.deckPos.y + c.ch * 0.52 + 6, text: String(count) });
}
function myHand(c, v, X, playable, glowFn) {
  var cards = KS.sortHand(v.hand, KS.S.sort);
  var pos = KS.handLayout(cards.length, c.G, { bottom: 6, maxW: c.G.land ? Math.max(c.G.w * 0.5, c.G.w - 340) : 0 });
  var i, k, delayBase = 0;
  for (i = 0; i < cards.length; i++) {
    k = 'c' + cards[i];
    var it = {
      k: k, c: cards[i], x: pos[i].x, y: pos[i].y, rot: pos[i].rot, z: pos[i].z, sc: 1,
      spawn: { x: c.deckPos.x, y: c.deckPos.y, rot: 0, sc: 0.86, down: true },
      delay: c.dealing ? i * 85 : 0, act: playable ? playable(cards[i]) : false, cls: '', handIndex: i
    };
    if (X.sel === k) { it.lift = c.cw * 0.42; it.cls += ' sel'; it.z += 100; }
    if (glowFn && glowFn(cards[i])) it.cls += ' glow';
    if (X.dimUnplayable && !it.act) it.cls += ' dim';
    c.items.push(it);
  }
  return cards;
}
function oppHands(c, v, X) {
  var s, n = v.n, ev = c.ev;
  var played = {};
  // oynanan kartların çıkış noktası için rakip koltuğu
  for (s = 0; s < n; s++) {
    if (s === X.me) continue;
    var seat = c.L[s], cnt = v.counts[s];
    var arr = KS.oppHand(cnt, seat, c.G), i;
    for (i = 0; i < arr.length; i++) {
      var a = arr[i];
      c.items.push({ k: 'o' + s + '_' + i, c: -1, x: a.x, y: a.y, rot: a.rot, sc: a.sc, z: a.z,
        spawn: { x: c.deckPos.x, y: c.deckPos.y, rot: 0, sc: 0.86 }, delay: c.dealing ? (i * n + s) * 55 : 0 });
    }
  }
}
function fromSeat(c, s, X) {
  var L = c.L[s];
  if (s === X.me) return { x: c.G.w / 2, y: c.G.h - c.cw * 0.7, rot: 0, sc: 1, down: false };
  var rot = L.side === 'top' ? 180 : (L.side === 'left' ? 90 : -90);
  return { x: L.x, y: L.y, rot: rot, sc: L.sc, down: true };
}
function slot(c, s) { var L = c.L[s]; return { x: L.px, y: L.py }; }

/* ======================= PİŞTİ ======================= */
SC.pisti = function (v, X) {
  var c = common(v, X), G = c.G, cw = c.cw, ch = c.ch, i, s;
  var turnMe = v.phase === 'play' && v.turn === X.me;
  deckStack(c, v.deckN, 10);
  oppHands(c, v, X);
  var capEv = lastEv(c.ev, 'capture'), swEv = lastEv(c.ev, 'sweep'), playEv = lastEv(c.ev, 'play');
  // masadaki kartlar
  var N = v.tcards.length, start = Math.max(0, N - 8);
  for (i = start; i < N; i++) {
    var id = v.tcards[i], r1 = hh(i * 3 + (id < 0 ? 5 : id)), r2 = hh(i * 7 + 2), r3 = hh(i * 11 + 4);
    var isTop = i === N - 1;
    var it = {
      k: id >= 0 ? 'c' + id : 'tp' + i, c: id, down: id < 0, x: c.cx + (r1 - 0.5) * cw * 0.22 + (isTop ? cw * 0.04 : 0), y: c.cy + (r2 - 0.5) * cw * 0.2,
      rot: (r3 - 0.5) * 16, sc: 0.94, z: 30 + i
    };
    if (id >= 0 && playEv && playEv.c === id && playEv.seat !== X.me) { var fs = fromSeat(c, playEv.seat, X); it.spawn = fs; }
    else if (id >= 0 && c.dealing) it.spawn = { x: c.deckPos.x, y: c.deckPos.y, rot: 0, sc: 0.86, down: true };
    if (c.dealing && !it.spawn) it.spawn = { x: c.deckPos.x, y: c.deckPos.y, rot: 0, sc: 0.86, down: true };
    c.items.push(it);
  }
  // toplanan desteler
  for (s = 0; s < v.n; s++) {
    var pn = v.piles[s], k2 = Math.min(4, Math.ceil(pn / 8)), sl = slot(c, s), j, sc2 = s === X.me ? 0.62 : 0.5;
    for (j = 0; j < k2; j++) c.items.push({ k: 'pl' + s + '_' + j, c: -1, x: sl.x + j * 1.1, y: sl.y - j * 1.4, rot: s === X.me ? 0 : 0, sc: sc2, z: 4 + j });
    if (pn > 0) c.badges.push({ x: sl.x, y: sl.y + ch * sc2 * 0.5 + 8, text: String(pn) });
  }
  if (capEv) { var ps = slot(c, capEv.seat); c.exit = { x: ps.x, y: ps.y, rot: 0, sc: 0.5, delay: 120 }; }
  else if (swEv) { var ps2 = slot(c, swEv.seat); c.exit = { x: ps2.x, y: ps2.y, rot: 0, sc: 0.5, delay: 200 }; }
  var topv = v.top;
  myHand(c, v, X, turnMe ? function () { return true; } : null, KS.S.glow && turnMe ? function (cd) {
    return topv >= 0 && (rank(cd) === 11 || rank(cd) === rank(topv));
  } : null);
  c.say = v.phase === 'play' ? (turnMe ? 'Sıra sende' : (X.names[v.turn] || '') + ' oynuyor') : '';
  c.sub = function (s) {
    var u = v.opts.teams ? s % 2 : s;
    return (v.opts.teams ? 'Takım ' + (u + 1) + ': ' : '') + v.scores[u];
  };
  return c;
};

/* ======================= DOST KAZIĞI ======================= */
SC.dost = function (v, X) {
  var c = common(v, X), G = c.G, cw = c.cw, ch = c.ch, i, s;
  var turnMe = v.phase === 'play' && v.turn === X.me;
  deckStack(c, v.deckN, 10);
  oppHands(c, v, X);
  var give = lastEv(c.ev, 'give'), playEv = lastEv(c.ev, 'play');
  // yere açılan 4 kart
  var fl = v.floor, fx = c.cx + cw * 0.1, fw = Math.min(cw * 0.86, (G.w * 0.5) / Math.max(1, fl.length));
  var fy = c.cy - ch * (G.land ? 0.56 : 0.6);
  for (i = 0; i < fl.length; i++) {
    var it = { k: 'c' + fl[i], c: fl[i], x: fx + (i - (fl.length - 1) / 2) * fw, y: fy, rot: 0, sc: 0.82, z: 20 + i,
      spawn: { x: c.deckPos.x, y: c.deckPos.y, rot: 0, sc: 0.8, down: true }, delay: c.dealing ? i * 90 : 0 };
    c.items.push(it);
  }
  // yere atılanlar (üst üste)
  var pl = v.pile, ps = Math.max(0, pl.length - 4), py = c.cy + ch * (G.land ? 0.42 : 0.4);
  for (i = ps; i < pl.length; i++) {
    var r1 = hh(pl[i]), r2 = hh(pl[i] + 9);
    var it2 = { k: 'c' + pl[i], c: pl[i], x: fx + (r1 - 0.5) * cw * 0.3, y: py + (r2 - 0.5) * cw * 0.22, rot: (r1 - 0.5) * 22, sc: 0.84, z: 30 + i };
    if (playEv && playEv.c === pl[i] && playEv.seat !== X.me) it2.spawn = fromSeat(c, playEv.seat, X);
    c.items.push(it2);
  }
  if (pl.length) c.badges.push({ x: fx + cw * 0.62, y: py + ch * 0.3, text: String(pl.length) });
  // ceza alanları
  for (s = 0; s < v.n; s++) {
    var pen = v.pen[s], sl = slot(c, s), sc2 = s === X.me ? 0.66 : 0.52, st0 = Math.max(0, pen.length - 3);
    for (i = st0; i < pen.length; i++) {
      var j = i - st0, id = pen[i];
      var itp = { k: 'c' + id, c: id, x: sl.x + (s === X.me ? -1 : 1) * j * 0 , y: sl.y + j * ch * sc2 * 0.24, rot: 0, sc: sc2, z: 10 + j };
      var pe = playEv;
      if (pe && pe.c === id && pe.seat !== X.me) itp.spawn = fromSeat(c, pe.seat, X);
      c.items.push(itp);
    }
    if (pen.length) {
      var tops = 0, z = pen.length - 1;
      while (z >= 0 && rank(pen[z]) === rank(pen[pen.length - 1])) { tops++; z--; }
      c.badges.push({ x: sl.x, y: sl.y + (Math.min(3, pen.length) - 1) * ch * sc2 * 0.24 + ch * sc2 * 0.5 + 9, text: v.pens[s] + (tops > 1 ? ' · ' + tops + '×' : ''), gold: true });
    }
  }
  var self = X;
  var optFn = function (cd) { return KS.engines.dost.optionsFor(v, X.me, cd); };
  myHand(c, v, X, turnMe ? function () { return true; } : null, KS.S.glow && turnMe ? function (cd) {
    var o = optFn(cd); return o.length && o[0].k !== 'drop';
  } : null);
  c.say = v.phase === 'play' ? (turnMe ? 'Sıra sende' : (X.names[v.turn] || '') + ' oynuyor') : '';
  c.sub = function (s) { return 'Ceza ' + v.pens[s] + ' · Puan ' + (Math.round(v.scores[s] * 10) / 10); };
  if (give) {
    var tt = slot(c, give.to);
    c.exit = { x: tt.x, y: tt.y, rot: 0, sc: 0.5, delay: 100 };
  }
  return c;
};

/* ======================= PİS YEDİLİ ======================= */
SC.pis7 = function (v, X) {
  var c = common(v, X), G = c.G, cw = c.cw, ch = c.ch, i, s;
  var turnMe = v.phase === 'play' && v.turn === X.me;
  deckStack(c, v.deckN, 8);
  oppHands(c, v, X);
  var X7 = KS.engines.pis7;
  var playEv = lastEv(c.ev, 'play');
  var dt = v.discTop, dx = c.cx + cw * 0.55;
  for (i = 0; i < dt.length; i++) {
    var id = dt[i], r1 = hh(id), r2 = hh(id + 5), top = i === dt.length - 1;
    var it = { k: 'c' + id, c: id, x: dx + (r1 - 0.5) * cw * 0.28, y: c.cy + (r2 - 0.5) * cw * 0.2, rot: (r1 - 0.5) * 24, sc: 0.96, z: 30 + i };
    if (playEv && playEv.c === id && playEv.seat !== X.me) it.spawn = fromSeat(c, playEv.seat, X);
    c.items.push(it);
  }
  if (v.discN > 0) c.badges.push({ x: dx, y: c.cy + ch * 0.55 + 8, text: String(v.discN) });
  var playable = function (cd) { return turnMe && X7.playable(v, cd); };
  myHand(c, v, X, turnMe ? playable : null, KS.S.glow && turnMe ? playable : null);
  // gelen çekme cezası ve yön
  c.dir = v.dir; c.pend = v.pend; c.suit = v.suit; c.wild = v.wild; c.dx = dx; c.first = v.first;
  c.dimUnplayable = false;
  if (turnMe) { for (i = 0; i < c.items.length; i++) if (c.items[i].handIndex !== undefined && !c.items[i].act) c.items[i].cls += ' dim'; }
  if (v.phase === 'play') {
    if (turnMe) c.say = v.first ? 'Bir SİNEK at' : (v.pend ? 'Yedi at ya da çek' : 'Sıra sende');
    else c.say = (X.names[v.turn] || '') + ' oynuyor';
  } else c.say = '';
  c.sub = function (s) { return 'Elde ' + v.counts[s] + ' · Ceza ' + v.scores[s]; };
  return c;
};

if (typeof module !== 'undefined' && module.exports) module.exports = SC;
})(typeof window !== 'undefined' ? window : globalThis);
