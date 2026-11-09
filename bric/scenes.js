/* Briç · masa görünümü: durumdan kart konumları üretir (4 kişilik tek masa) */
(function (root) {
'use strict';
var BR = root.BR;
var B = BR.Bridge, suit = BR.suit, SC = BR.scenes = {};

function hh(i) { return ((i + 7) * 2654435761 >>> 0) % 1000 / 1000; }
function lastEv(ev, t) { var i; for (i = (ev || []).length - 1; i >= 0; i--) if (ev[i].t === t) return ev[i]; return null; }

/* Yatay dizilim: aynı renkler birbirine yakın, renkler arasında küçük boşluk */
function rowPos(cards, cxm, y, cwc, maxW, maxStep, gapF) {
  var n = cards.length, groups = 0, i, out = [];
  for (i = 0; i < n; i++) if (i === 0 || suit(cards[i]) !== suit(cards[i - 1])) groups++;
  var gap = cwc * gapF, avail = maxW - cwc - gap * Math.max(0, groups - 1);
  var step = n > 1 ? Math.min(maxStep, avail / (n - 1)) : 0;
  var total = cwc + step * (n - 1) + gap * Math.max(0, groups - 1);
  var x = cxm - total / 2 + cwc / 2;
  for (i = 0; i < n; i++) {
    if (i > 0 && suit(cards[i]) !== suit(cards[i - 1])) x += gap;
    out.push({ x: x, y: y }); x += step;
  }
  return out;
}
/* Dikey dizilim (yan koltuktaki açık el) */
function colPos(cards, cxm, cym, chc, maxH, maxStep, gap) {
  var n = cards.length, groups = 0, i, out = [];
  for (i = 0; i < n; i++) if (i === 0 || suit(cards[i]) !== suit(cards[i - 1])) groups++;
  var avail = maxH - chc - gap * Math.max(0, groups - 1);
  var step = n > 1 ? Math.min(maxStep, avail / (n - 1)) : 0;
  var total = chc + step * (n - 1) + gap * Math.max(0, groups - 1);
  var y = cym - total / 2 + chc / 2;
  for (i = 0; i < n; i++) {
    if (i > 0 && suit(cards[i]) !== suit(cards[i - 1])) y += gap;
    out.push({ x: cxm, y: y }); y += step;
  }
  return { pos: out, len: total };
}

SC.bric = function (v, X) {
  var G = X.G, me = X.me, w = G.w, h = G.h, cw = G.cw, ch = cw * 1.4, land = G.land;
  var ev = X.ev || [], items = [], badges = [], i, s, rel;
  var dealing = !!(lastEv(ev, 'deal') || lastEv(ev, 'newHand') || X.fresh);
  var soc = 0.5, cwo = cw * soc, cho = ch * soc;            // rakip (kapalı) el ölçeği
  var sd = land ? 0.5 : 0.6, cwd = cw * sd, chd = ch * sd;  // açık el ölçeği
  var ts = land ? 0.7 : 0.8;                                // masa ortası kart ölçeği
  var cx = w / 2;
  var bidding = v.stage === 'bid' && v.phase === 'play';
  var dummyShown = !!v.dummyHand && v.dummy !== me;
  var seatOf = function (r) { return (me + r) % 4; };
  var relOf = function (sx) { return (sx - me + 4) % 4; };

  /* --- yerleşim hesabı --- */
  var topBy = 20;
  var topHandY = (land ? topBy + 17 : 60) + (dummyShown && relOf(v.dummy) === 2 ? chd : cho) / 2;
  var topEnd = topHandY + (dummyShown && relOf(v.dummy) === 2 ? chd : cho) / 2;
  var handY = h - ch / 2 - 6, handTop = handY - ch / 2;
  var cy = (topEnd + (handTop - (land ? 0 : 40))) / 2;
  if (land) cy = Math.max(topEnd + ch * ts * 1.12 + 4, Math.min(cy, handTop - ch * ts * 1.12 - 4));
  var half = ch * ts * 1.12;
  var dx = cw * ts * 1.05, dy = ch * ts * 0.62;
  var TP = [{ x: cx, y: cy + dy }, { x: cx - dx, y: cy }, { x: cx, y: cy - dy }, { x: cx + dx, y: cy }];

  var L = [], meL = { side: 'bottom', x: cx, y: handY, bx: land ? 8 + 74 : 8 + 74, by: land ? h - 24 : handTop - 24, sc: 1 };
  L[me] = meL;
  function sideSeat(rel, dummy) {
    var left = rel === 1, n = v.counts[seatOf(rel)];
    var xs = left ? 6 + (dummy ? cwd : cho) / 2 : w - 6 - (dummy ? cwd : cho) / 2;
    var len = dummy ? 0 : Math.min(h * (land ? 0.5 : 0.34), cwo * 4.4);
    return { side: left ? 'left' : 'right', x: xs, y: cy, sc: soc, maxLen: len, rel: rel };
  }
  var topSeat = { side: 'top', x: cx, y: topHandY, sc: soc, maxLen: Math.min(w * 0.46, cwo * 7), rel: 2 };
  L[seatOf(2)] = topSeat;
  L[seatOf(1)] = sideSeat(1, false);
  L[seatOf(3)] = sideSeat(3, false);

  /* --- açık el (dummy) --- */
  var dummyCards = null;
  if (dummyShown) {
    var ds = v.dummy, drel = relOf(ds), dcards = B.sort(v.dummyHand);
    var meDecl = v.declarer === me;
    var turnMe = v.phase === 'play' && v.turn === me && v.stage === 'card';
    var canPlayD = meDecl && turnMe && v.to === v.dummy;
    if (drel === 2) {
      var rp = rowPos(dcards, cx, topHandY, cwd, land ? w - 380 : w - 16, cwd * 0.85, 0.16);
      dummyCards = dcards.map(function (c, k) { return { c: c, x: rp[k].x, y: rp[k].y, sc: sd, z: 10 + k }; });
      topSeat.dummy = true;
    } else {
      var sl = L[ds], cp = colPos(dcards, sl.x, cy, chd, h * (land ? 0.72 : 0.62), chd * 0.36, 5);
      dummyCards = dcards.map(function (c, k) { return { c: c, x: cp.pos[k].x, y: cp.pos[k].y, sc: sd, z: 10 + k }; });
      sl.dummy = true; sl.len = cp.len; sl.maxLen = cp.len;
    }
    dummyCards.forEach(function (d, k) {
      var act = canPlayD && v.playable.indexOf(d.c) >= 0;
      var it = { k: 'c' + d.c, c: d.c, x: d.x, y: d.y, rot: 0, sc: d.sc, z: d.z, act: act,
        spawn: { x: cx, y: cy, rot: 0, sc: 0.5, down: true }, delay: dealing ? k * 40 : 0, cls: '' };
      if (meDecl) it.handIndex = k;
      if (canPlayD && !act) it.cls += ' dim';
      if (canPlayD && act && BR.S.glow) it.cls += ' glow';
      if (X.sel === it.k) { it.lift = cw * 0.3; it.cls += ' sel'; it.z += 100; }
      items.push(it);
    });
  }

  /* --- kendi elim --- */
  var myCards = BR.S.sort === 'none' ? v.hand.slice() : B.sort(v.hand);
  var turnMe2 = v.phase === 'play' && v.turn === me && v.stage === 'card';
  var myPlays = turnMe2 && v.to === me;                      // kendi elimden oynama sırası
  var maxW = land ? Math.min(w - 16, w * 0.58) : w - 12;
  var rpm = rowPos(myCards, cx, handY, cw, maxW, cw * 0.9, 0.12);
  myCards.forEach(function (c, k) {
    var act = myPlays && v.playable.indexOf(c) >= 0;
    var it = { k: 'c' + c, c: c, x: rpm[k].x, y: rpm[k].y, rot: 0, sc: 1, z: 20 + k, act: act, handIndex: k, cls: '',
      spawn: { x: cx, y: cy, rot: 0, sc: 0.5, down: true }, delay: dealing ? k * 70 : 0 };
    if (myPlays && !act) it.cls += ' dim';
    if (act && BR.S.glow && v.stage === 'card') it.cls += ' glow';
    if (X.sel === it.k) { it.lift = cw * 0.42; it.cls += ' sel'; it.z += 100; }
    items.push(it);
  });

  /* --- diğer eller (kapalı) --- */
  for (s = 0; s < 4; s++) {
    if (s === me) continue;
    if (dummyShown && s === v.dummy) continue;
    var seat = L[s], cnt = v.counts[s];
    var arr = BR.oppHand(cnt, seat, G);
    for (i = 0; i < arr.length; i++) {
      var a = arr[i];
      items.push({ k: 'o' + s + '_' + i, c: -1, x: a.x, y: a.y, rot: a.rot, sc: a.sc, z: a.z,
        spawn: { x: cx, y: cy, rot: 0, sc: 0.5 }, delay: dealing ? (i * 4 + s) * 40 : 0 });
    }
    // koltuk rozet konumu: elin dışında
    if (seat.side === 'top') { seat.bx = cx; seat.by = topBy; }
    else if (seat.side === 'left') { seat.bx = 82; seat.by = land ? Math.min(h - 64, cy + (seat.maxLen || 100) / 2 + 24) : topEnd + 24; }
    else { seat.bx = w - 82; seat.by = land ? Math.min(h - 64, cy + (seat.maxLen || 100) / 2 + 24) : topEnd + 24; }
  }
  if (dummyShown) {
    var dl = L[v.dummy];
    if (dl.side === 'top') { dl.bx = cx; dl.by = topBy; }
    else if (dl.side === 'left') { dl.bx = 82; dl.by = land ? Math.min(h - 64, cy + dl.len / 2 + 24) : topEnd + 24; }
    else { dl.bx = w - 82; dl.by = land ? Math.min(h - 64, cy + dl.len / 2 + 24) : topEnd + 24; }
  }
  if (!land) { topSeat.bx = cx; topSeat.by = topBy; }

  /* --- masa ortası: el --- */
  var tcards = X.hold ? X.hold.cards : v.trick;
  if (!bidding) {
    for (i = 0; i < tcards.length; i++) {
      var tc = tcards[i], r1 = hh(tc.c * 3 + 1);
      var P = TP[relOf(tc.s)];
      var sl2 = L[tc.s], fromRot = sl2.side === 'top' ? 180 : (sl2.side === 'left' ? 90 : (sl2.side === 'right' ? -90 : 0));
      var it2 = { k: 'c' + tc.c, c: tc.c, x: P.x + (r1 - 0.5) * 3, y: P.y + (hh(tc.c) - 0.5) * 3, rot: (r1 - 0.5) * 8, sc: ts, z: 60 + i, cls: '' };
      if (tc.s !== me && !(dummyShown && tc.s === v.dummy)) it2.spawn = { x: sl2.x, y: sl2.y, rot: fromRot, sc: soc, down: true };
      if (X.hold && X.hold.winner === tc.s && i === tcards.length - 1) it2.cls += ' glow';
      items.push(it2);
    }
  }

  var c = { G: G, L: L, items: items, badges: badges, cw: cw, ch: ch, cx: cx, cy: cy, half: half, ts: ts, TP: TP, bidding: bidding, ev: ev,
    handTop: handTop, topEnd: topEnd, dealing: dealing, dummyShown: dummyShown };

  /* --- süpürme: alınan el kazanan tarafa gider --- */
  if (X.sweep != null && L[X.sweep]) {
    var wl = L[X.sweep];
    c.exit = { x: wl.side === 'bottom' ? cx : wl.x, y: wl.side === 'bottom' ? h + 20 : wl.y, rot: 0, sc: 0.4, delay: 0 };
  }

  /* --- durum yazısı --- */
  c.say = '';
  if (v.phase === 'play') {
    var nm = X.names;
    if (v.stage === 'bid') {
      if (v.turn === me) c.say = 'İhale sırası sende';
      else c.say = (nm[v.turn] || '') + ' ihale yapıyor';
    } else {
      if (v.turn === me) c.say = v.to === me ? 'Sıra sende' : 'Açık eli sen oynuyorsun';
      else if (v.to === v.dummy && v.dummy !== me) c.say = (nm[v.declarer] || '') + ' açık eli oynuyor';
      else c.say = (nm[v.turn] || '') + ' oynuyor';
      if (v.declarer === me && v.auto && v.auto[me]) c.say = 'Bilgisayar senin yerine oynuyor';
    }
  }
  c.sub = function (sx) {
    var t = B.SEATN[sx];
    if (v.dealer === sx) t += ' · D';
    if (v.stage !== 'bid' && v.contract) {
      if (sx === v.declarer) t += ' · oyun sahibi';
      else if (sx === v.dummy) t += ' · açık el';
    }
    return t;
  };
  return c;
};

if (typeof module !== 'undefined' && module.exports) module.exports = SC;
})(typeof window !== 'undefined' ? window : globalThis);
