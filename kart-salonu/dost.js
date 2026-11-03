/* Dost Kazığı kural motoru (2-4 kişi). Amaç: en az ceza almak.
   Aynı rakam = aynı kart (Vale yalnız Vale ile). Sırası gelen, istediği kartı oynar; kart
   aşağıdaki durumlardan biriyle eşleşirse "kazık" yandakine işlenir, hiçbiri yoksa yere atılır. */
(function (root) {
'use strict';
var KS = root.KS || require('./kscore.js');
var rank = KS.rank;
var D = { id: 'dost', name: 'Dost Kazığı', min: 2, max: 4 };

function pen(c) {
  var r = rank(c);
  if (r === 3) return 30;
  if (r === 11) return 20;
  if (r === 1 || r === 12 || r === 13) return 10;
  return r;
}
D.pen = pen;
function sum(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += pen(a[i]); return s; }
D.sum = sum;
var POINTS = { 2: [7, -7], 3: [7, 0, -7], 4: [7, 3, -2, -7] };

D.init = function (o) {
  var n = Math.max(2, Math.min(4, o.n | 0 || 4));
  var st = {
    g: 'dost', n: n, opts: { hands: o.hands || 5 },
    scores: KS.zeros(n), handNo: 0, dealer: n - 1, phase: 'play', over: false, last: null, winner: [], tot: KS.zeros(n)
  };
  return { st: st, ev: D.startHand(st) };
};

D.startHand = function (st) {
  var n = st.n, i;
  st.deck = KS.deck(false);
  st.floor = st.deck.splice(0, 4);
  st.pile = [];
  st.pen = [];
  st.hands = [];
  for (i = 0; i < n; i++) { st.hands.push([]); st.pen.push([]); }
  st.handNo++;
  if (st.handNo > 1) st.dealer = (st.dealer + 1) % n;
  st.turn = (st.dealer + 1) % n;
  st.phase = 'play';
  var ev = [{ t: 'newHand', no: st.handNo }, { t: 'floorDeal' }];
  return ev.concat(dealRound(st));
};
function dealRound(st) {
  var n = st.n, i, k, first = (st.dealer + 1) % n;
  for (k = 0; k < 4; k++) for (i = 0; i < n; i++) st.hands[(first + i) % n].push(st.deck.pop());
  return [{ t: 'deal' }];
}

D.turnOf = function (st) { return st.phase === 'play' ? st.turn : -1; };

/* Bir kart için olası işlemler */
function optionsFor(st, seat, c) {
  var r = rank(c), o = [], i, p, f = [];
  var next = (seat + 1) % st.n;
  for (i = 0; i < st.floor.length; i++) if (rank(st.floor[i]) === r) f.push(st.floor[i]);
  if (f.length) o.push({ k: 'floor', to: next, take: f.length });
  if (st.pile.length && rank(st.pile[st.pile.length - 1]) === r) o.push({ k: 'pile', to: next, take: 1 });
  for (p = 0; p < st.n; p++) {
    if (p === seat) continue;
    var pp = st.pen[p];
    if (pp.length && rank(pp[pp.length - 1]) === r) o.push({ k: 'pen', to: p });
  }
  var mine = st.pen[seat], m = 0;
  while (m < mine.length && rank(mine[mine.length - 1 - m]) === r) m++;
  if (m) o.push({ k: 'own', to: next, take: m });
  if (!o.length) o.push({ k: 'drop' });
  return o;
}

D.optionsFor = optionsFor;

D.legal = function (st, seat) {
  if (st.phase !== 'play' || st.turn !== seat) return [];
  var out = [], i, j;
  var seen = {};
  for (i = 0; i < st.hands[seat].length; i++) {
    var c = st.hands[seat][i], os = optionsFor(st, seat, c);
    for (j = 0; j < os.length; j++) out.push({ t: 'play', c: c, opt: os[j] });
  }
  return out;
};

D.apply = function (st, seat, act) {
  if (st.phase !== 'play' || st.turn !== seat || !act || act.t !== 'play') return { ok: false };
  var h = st.hands[seat], idx = h.indexOf(act.c);
  if (idx < 0 || !act.opt) return { ok: false };
  var os = optionsFor(st, seat, act.c), o = null, i;
  for (i = 0; i < os.length; i++) {
    if (os[i].k === act.opt.k && (os[i].k !== 'pen' || os[i].to === act.opt.to)) o = os[i];
  }
  if (!o) return { ok: false };
  var c = act.c, r = rank(c), ev = [];
  h.splice(idx, 1);
  var moved = [], next = (seat + 1) % st.n;
  if (o.k === 'floor') {
    var keep = [];
    for (i = 0; i < st.floor.length; i++) { if (rank(st.floor[i]) === r) moved.push(st.floor[i]); else keep.push(st.floor[i]); }
    st.floor = keep; moved.push(c);
    st.pen[next] = st.pen[next].concat(moved);
    ev.push({ t: 'play', seat: seat, c: c });
    ev.push({ t: 'give', seat: seat, from: 'floor', to: next, cards: moved, pts: sum(moved) });
  } else if (o.k === 'pile') {
    moved.push(st.pile.pop()); moved.push(c);
    st.pen[next] = st.pen[next].concat(moved);
    ev.push({ t: 'play', seat: seat, c: c });
    ev.push({ t: 'give', seat: seat, from: 'pile', to: next, cards: moved, pts: sum(moved) });
  } else if (o.k === 'pen') {
    st.pen[o.to].push(c);
    ev.push({ t: 'play', seat: seat, c: c });
    ev.push({ t: 'give', seat: seat, from: 'hand', to: o.to, cards: [c], pts: pen(c) });
  } else if (o.k === 'own') {
    var mine = st.pen[seat];
    for (i = 0; i < o.take; i++) moved.unshift(mine.pop());
    moved.push(c);
    st.pen[next] = st.pen[next].concat(moved);
    ev.push({ t: 'play', seat: seat, c: c });
    ev.push({ t: 'give', seat: seat, from: 'own', to: next, cards: moved, pts: sum(moved) });
  } else {
    st.pile.push(c);
    ev.push({ t: 'play', seat: seat, c: c });
    ev.push({ t: 'drop', seat: seat, c: c });
  }
  st.turn = next;
  var empty = true;
  for (i = 0; i < st.n; i++) if (st.hands[i].length) empty = false;
  if (empty) {
    if (st.deck.length) { st.turn = (st.dealer + 1) % st.n; ev = ev.concat(dealRound(st)); }
    else ev = ev.concat(endHand(st));
  }
  return { ok: true, ev: ev };
};

function endHand(st) {
  var n = st.n, i, pens = [], pts;
  for (i = 0; i < n; i++) pens.push(sum(st.pen[i]));
  pts = KS.rankPoints(pens, POINTS[n], true);
  for (i = 0; i < n; i++) st.scores[i] += pts[i];
  st.last = { pens: pens, pts: pts };
  st.phase = 'handEnd';
  st.over = st.handNo >= st.opts.hands;
  if (st.over) {
    var best = -1e9; st.winner = [];
    for (i = 0; i < n; i++) if (st.scores[i] > best) best = st.scores[i];
    for (i = 0; i < n; i++) if (st.scores[i] === best) st.winner.push(i);
  }
  return [{ t: 'handEnd', over: st.over }];
}

D.nextHand = function (st) {
  if (st.phase !== 'handEnd') return { ok: false, ev: [] };
  if (st.over) { st.phase = 'gameEnd'; return { ok: true, ev: [{ t: 'gameEnd' }] }; }
  return { ok: true, ev: D.startHand(st) };
};

D.view = function (st, seat) {
  return {
    g: 'dost', n: st.n, turn: st.turn, phase: st.phase, handNo: st.handNo, dealer: st.dealer, over: st.over, winner: st.winner,
    opts: st.opts, scores: st.scores.slice(),
    hand: seat >= 0 ? st.hands[seat].slice() : [],
    counts: st.hands.map(function (h) { return h.length; }),
    floor: st.floor.slice(), pile: st.pile.slice(), pen: st.pen.map(function (p) { return p.slice(); }),
    pens: st.pen.map(sum), deckN: st.deck.length, last: st.last
  };
};

/* ---------------- Bilgisayar oyuncusu ---------------- */
D.bot = function (st, seat, level) {
  var acts = D.legal(st, seat), i;
  if (!acts.length) return null;
  level = level || 'medium';
  var next = (seat + 1) % st.n;
  var noise = level === 'easy' ? 14 : level === 'hard' ? 0.3 : 2;
  var handVals = 0;
  for (i = 0; i < st.hands[seat].length; i++) handVals += pen(st.hands[seat][i]);
  var best = null;
  for (i = 0; i < acts.length; i++) {
    var a = acts[i], c = a.c, o = a.opt, u = 0;
    if (o.k === 'floor') {
      var tk = 0, j;
      for (j = 0; j < st.floor.length; j++) if (rank(st.floor[j]) === rank(c)) tk += pen(st.floor[j]);
      u = tk + pen(c);
    } else if (o.k === 'pile') u = pen(st.pile[st.pile.length - 1]) + pen(c);
    else if (o.k === 'pen') u = pen(c) * (o.to === next && st.n > 2 ? 1.0 : 0.9);
    else if (o.k === 'own') {
      var m = st.pen[seat], s2 = 0, q;
      for (q = 0; q < o.take; q++) s2 += pen(m[m.length - 1 - q]);
      u = (s2 + pen(c)) + s2 * 1.2;
    } else {
      // yere atış: küçük kartı at, büyük kartı elde tutup başkasına işle
      u = -pen(c) * 0.22;
      var top = st.pile.length ? pen(st.pile[st.pile.length - 1]) : 0;
      if (level !== 'easy') {
        // yere koyduğum kartı sonraki oyuncu eşleştirebilir: yığın değeri ve kalan olasılık
        var seenSame = 0, all = st.floor.concat(st.pile), z;
        for (z = 0; z < all.length; z++) if (rank(all[z]) === rank(c)) seenSame++;
        for (z = 0; z < st.n; z++) for (q = 0; q < st.pen[z].length; q++) if (rank(st.pen[z][q]) === rank(c)) seenSame++;
        var left = Math.max(0, 4 - seenSame - 1);
        u -= left * 0.5;
      }
    }
    u += (KS.rnd() - 0.5) * noise;
    if (!best || u > best.u) best = { u: u, a: a };
  }
  return best.a;
};

KS.engines.dost = D;
if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
