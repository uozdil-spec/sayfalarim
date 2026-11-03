/* Pişti kural motoru (2-4 kişi, 4 kişide isteğe bağlı eşli) */
(function (root) {
'use strict';
var KS = root.KS || require('./kscore.js');
var rank = KS.rank, suit = KS.suit;
var P = { id: 'pisti', name: 'Pişti', min: 2, max: 4 };

function unitOf(st, seat) { return st.opts.teams ? seat % 2 : seat; }
function nUnits(st) { return st.opts.teams ? 2 : st.n; }
function cardPts(c) {
  var r = rank(c), s = suit(c);
  if (r === 1 || r === 11) return 1;
  if (r === 2 && s === 3) return 2;
  if (r === 10 && s === 2) return 3;
  return 0;
}
P.cardPts = cardPts;

P.init = function (o) {
  var n = Math.max(2, Math.min(4, o.n | 0 || 2));
  var st = {
    g: 'pisti', n: n,
    opts: { target: o.target || 101, teams: !!(o.teams && n === 4) },
    scores: [], round: 0, dealer: n - 1, phase: 'play', over: false, last: null, winner: -1
  };
  st.scores = KS.zeros(nUnits(st));
  return { st: st, ev: P.startHand(st) };
};

P.startHand = function (st) {
  var n = st.n, i, ev = [];
  var d = KS.deck(false);
  st.deck = d;
  st.table = d.splice(0, 4);
  st.seen = [st.table[st.table.length - 1]];
  st.tk = [false, false, false, true];
  st.hands = [];
  st.piles = [];
  for (i = 0; i < n; i++) { st.hands.push([]); st.piles.push([]); }
  st.pisti = KS.zeros(nUnits(st));
  st.dpisti = KS.zeros(nUnits(st));
  st.lastCap = -1;
  st.round++;
  if (st.round > 1) st.dealer = (st.dealer + 1) % n;
  st.turn = (st.dealer + 1) % n;
  st.phase = 'play';
  ev.push({ t: 'newHand', round: st.round });
  ev.push({ t: 'tableDeal' });
  ev = ev.concat(dealRound(st));
  return ev;
};

function dealRound(st) {
  var n = st.n, i, k, first = (st.dealer + 1) % n;
  for (k = 0; k < 4; k++) for (i = 0; i < n; i++) {
    var s = (first + i) % n;
    st.hands[s].push(st.deck.pop());
  }
  return [{ t: 'deal' }];
}

P.turnOf = function (st) { return st.phase === 'play' ? st.turn : -1; };

function wouldCapture(st, c) {
  if (!st.table.length) return false;
  if (rank(c) === 11) return true;
  return rank(c) === rank(st.table[st.table.length - 1]);
}

P.legal = function (st, seat) {
  if (st.phase !== 'play' || st.turn !== seat) return [];
  return st.hands[seat].map(function (c) { return { t: 'play', c: c, cap: wouldCapture(st, c) }; });
};

P.apply = function (st, seat, act) {
  if (st.phase !== 'play' || st.turn !== seat || !act || act.t !== 'play') return { ok: false };
  var h = st.hands[seat], idx = h.indexOf(act.c);
  if (idx < 0) return { ok: false };
  var ev = [], c = act.c, u = unitOf(st, seat);
  h.splice(idx, 1);
  st.seen.push(c);
  var cap = wouldCapture(st, c), pis = 0;
  if (cap) {
    var top = st.table[st.table.length - 1];
    if (st.table.length === 1 && rank(c) === rank(top)) pis = rank(c) === 11 ? 2 : 1;
    var taken = st.table.concat([c]);
    ev.push({ t: 'play', seat: seat, c: c, cap: true });
    ev.push({ t: 'capture', seat: seat, n: taken.length, pisti: pis, cards: taken });
    st.piles[seat] = st.piles[seat].concat(taken);
    st.table = [];
    st.tk = [];
    st.lastCap = seat;
    if (pis === 1) st.pisti[u]++;
    if (pis === 2) st.dpisti[u]++;
  } else {
    st.table.push(c);
    st.tk.push(true);
    ev.push({ t: 'play', seat: seat, c: c, cap: false });
  }
  st.turn = (seat + 1) % st.n;
  var empty = true, i;
  for (i = 0; i < st.n; i++) if (st.hands[i].length) empty = false;
  if (empty) {
    if (st.deck.length) { st.turn = (st.dealer + 1) % st.n; ev = ev.concat(dealRound(st)); }
    else ev = ev.concat(endHand(st));
  }
  return { ok: true, ev: ev };
};

function endHand(st) {
  var ev = [], i, u, nu = nUnits(st);
  if (st.table.length && st.lastCap >= 0) {
    ev.push({ t: 'sweep', seat: st.lastCap, n: st.table.length });
    st.piles[st.lastCap] = st.piles[st.lastCap].concat(st.table);
    st.table = [];
    st.tk = [];
  }
  var cards = KS.zeros(nUnits(st)), pts = KS.zeros(nu);
  for (i = 0; i < st.n; i++) {
    u = unitOf(st, i);
    cards[u] += st.piles[i].length;
    for (var k = 0; k < st.piles[i].length; k++) pts[u] += cardPts(st.piles[i][k]);
  }
  var max = -1, who = -1, tie = false;
  for (u = 0; u < nu; u++) {
    if (cards[u] > max) { max = cards[u]; who = u; tie = false; } else if (cards[u] === max) tie = true;
  }
  var res = [];
  for (u = 0; u < nu; u++) {
    var maj = (!tie && who === u) ? 3 : 0;
    var tot = pts[u] + maj + st.pisti[u] * 10 + st.dpisti[u] * 20;
    st.scores[u] += tot;
    res.push({ cards: cards[u], pts: pts[u], maj: maj, pisti: st.pisti[u], dpisti: st.dpisti[u], total: tot });
  }
  st.last = res;
  st.phase = 'handEnd';
  var best = -1, bi = -1, uniq = true;
  for (u = 0; u < nu; u++) {
    if (st.scores[u] > best) { best = st.scores[u]; bi = u; uniq = true; } else if (st.scores[u] === best) uniq = false;
  }
  st.over = best >= st.opts.target && uniq;
  st.winner = st.over ? bi : -1;
  ev.push({ t: 'handEnd', over: st.over });
  return ev;
}

P.nextHand = function (st) {
  if (st.phase !== 'handEnd') return { ok: false, ev: [] };
  if (st.over) { st.phase = 'gameEnd'; return { ok: true, ev: [{ t: 'gameEnd' }] }; }
  return { ok: true, ev: P.startHand(st) };
};

/* Oyuncuya özel görünüm: rakip elleri ve masanın altındaki kartlar gizli */
P.view = function (st, seat) {
  var v = {
    g: 'pisti', n: st.n, turn: st.turn, phase: st.phase, round: st.round, dealer: st.dealer, over: st.over, winner: st.winner,
    opts: st.opts, scores: st.scores.slice(), pisti: st.pisti.slice(), dpisti: st.dpisti.slice(),
    hand: seat >= 0 ? st.hands[seat].slice() : [],
    counts: st.hands.map(function (h) { return h.length; }),
    tableN: st.table.length, top: st.table.length ? st.table[st.table.length - 1] : -1,
    tcards: st.table.map(function (c, i) { return st.tk[i] ? c : -1; }),
    deckN: st.deck.length, piles: st.piles.map(function (p) { return p.length; }), last: st.last, lastCap: st.lastCap
  };
  return v;
};

/* ---------------- Bilgisayar oyuncusu ---------------- */
P.bot = function (st, seat, level) {
  var h = st.hands[seat], i, acts = [];
  if (!h.length) return null;
  level = level || 'medium';
  var unseenN = 0, unseenR = [], unseenJ = 0;
  for (i = 0; i <= 13; i++) unseenR[i] = 4;
  var known = st.seen.concat(h);
  for (i = 0; i < known.length; i++) unseenR[rank(known[i])]--;
  for (i = 1; i <= 13; i++) unseenN += Math.max(0, unseenR[i]);
  unseenJ = Math.max(0, unseenR[11]);
  var oppK = 0;
  for (i = 0; i < st.n; i++) if (i !== seat && unitOf(st, i) !== unitOf(st, seat)) oppK = Math.max(oppK, st.hands[i].length);
  if (!oppK) oppK = 4;
  function risk(r) { return unseenN ? Math.min(1, oppK * Math.max(0, unseenR[r]) / unseenN) : 0; }
  var tableV = 0, k;
  for (k = 0; k < st.table.length; k++) tableV += cardPts(st.table[k]);
  var topc = st.table.length ? st.table[st.table.length - 1] : -1;
  var scored = [];
  for (i = 0; i < h.length; i++) {
    var c = h[i], r = rank(c), cap = wouldCapture(st, c), u;
    if (cap) {
      var pisB = 0;
      if (st.table.length === 1 && r === rank(topc)) pisB = r === 11 ? 20 : 10;
      u = tableV + cardPts(c) + 0.45 * (st.table.length + 1) + pisB;
      if (r === 11 && pisB === 0) {
        // vale'yi küçük yığın için harcama
        var jackKeep = level === 'hard' ? 3.5 : 2;
        if (st.table.length <= 2 && tableV === 0) u -= jackKeep;
        else if (tableV === 0) u -= jackKeep * 0.4;
      }
    } else {
      var pile = tableV + cardPts(c);
      var rj = Math.min(1, oppK * (Math.max(0, unseenR[r]) + unseenJ) / Math.max(1, unseenN));
      if (!st.table.length) u = -10 * risk(r) - cardPts(c) * 0.3;
      else u = -(pile + 0.45 * (st.table.length + 1)) * rj * 0.9 - cardPts(c) * 0.5;
      if (r === 11) u -= 1.2;
    }
    scored.push({ c: c, u: u, cap: cap });
  }
  var noise = level === 'easy' ? 6 : level === 'hard' ? 0.15 : 0.9;
  var best = null;
  for (i = 0; i < scored.length; i++) {
    var s = scored[i].u + (KS.rnd() - 0.5) * noise;
    if (level === 'easy' && !scored[i].cap) s += 0;
    if (!best || s > best.s) best = { s: s, c: scored[i].c };
  }
  if (level === 'easy' && KS.rnd() < 0.25) best = { c: KS.pick(h) };
  return { t: 'play', c: best.c };
};

KS.engines.pisti = P;
if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
