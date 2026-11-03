/* Pis Yedili kural motoru (2-4 kişi).
   Klasik kurallar: elini ilk bitiren kazanır. Aynı renk ya da aynı rakam atılır.
   7: sıradaki 3 kart çeker (yedi yedinin üstüne atılır, katlanır). Vale: renk seçer, valenin üstüne vale atılmaz.
   As: diğer herkes 1 kart çeker, sıra yine sende (ya da seçeneğe göre sırayı atlatır). 10: yön değişir.
   Başlangıçta ilk kart sinek atılır; ilk atılan kartın özel etkisi olmaz. */
(function (root) {
'use strict';
var KS = root.KS || require('./kscore.js');
var rank = KS.rank, suit = KS.suit, isJoker = KS.isJoker;
var X = { id: 'pis7', name: 'Pis Yedili', min: 2, max: 4 };

function val(c) {
  if (isJoker(c)) return 100;
  var r = rank(c);
  if (r === 1) return 11;
  if (r === 11) return 25;
  if (r === 12 || r === 13) return 10;
  return r;
}
X.val = val;

X.init = function (o) {
  var n = Math.max(2, Math.min(4, o.n | 0 || 4));
  var st = {
    g: 'pis7', n: n,
    opts: { jokers: !!o.jokers, ace: o.ace === 'skip' ? 'skip' : 'draw', mode: o.mode === 'limit' ? 'limit' : 'hands', v: o.v || 5 },
    scores: KS.zeros(n), handNo: 0, dealer: n - 1, phase: 'play', over: false, last: null, winner: []
  };
  return { st: st, ev: X.startHand(st) };
};

function drawCards(st, seat, k, ev) {
  var got = [], i;
  for (i = 0; i < k; i++) {
    if (!st.deck.length) {
      if (st.disc.length > 2 && (st.rec || 0) < 3) {
        st.rec = (st.rec || 0) + 1;
        var topc = st.disc.pop();
        st.deck = KS.shuffle(st.disc.slice());
        st.disc = [topc];
        ev.push({ t: 'reshuffle' });
      } else break;
    }
    var c = st.deck.pop();
    st.hands[seat].push(c);
    got.push(c);
  }
  return got;
}

X.startHand = function (st) {
  var n = st.n, i, k, ev = [];
  st.deck = KS.deck(st.opts.jokers);
  st.disc = [];
  st.hands = [];
  for (i = 0; i < n; i++) st.hands.push([]);
  st.handNo++;
  if (st.handNo > 1) st.dealer = (st.dealer + 1) % n;
  st.turn = (st.dealer + 1) % n;
  var first = st.turn;
  for (k = 0; k < 7; k++) for (i = 0; i < n; i++) st.hands[(first + i) % n].push(st.deck.pop());
  st.dir = 1; st.stall = 0; st.rec = 0; st.pend = 0; st.pendK = ''; st.first = true; st.wild = false; st.suit = 3; st.phase = 'play';
  ev.push({ t: 'newHand', no: st.handNo });
  ev.push({ t: 'deal' });
  // başlayan oyuncu sinek bulana kadar çeker
  var h = st.hands[first], has = false;
  for (i = 0; i < h.length; i++) if (h[i] < 52 && suit(h[i]) === 3) has = true;
  var guard = 0;
  while (!has && st.deck.length && guard++ < 60) {
    var c = st.deck.pop();
    h.push(c);
    ev.push({ t: 'draw', seat: first, n: 1, forced: true, cards: [c] });
    if (c < 52 && suit(c) === 3) has = true;
  }
  return ev;
};

X.turnOf = function (st) { return st.phase === 'play' ? st.turn : -1; };

function topOf(st) { return st.disc ? (st.disc.length ? st.disc[st.disc.length - 1] : -1) : st.top; }

function playable(st, c) {
  if (st.first) return c < 52 && suit(c) === 3;
  if (st.pend > 0) return st.pendK === '7' ? rank(c) === 7 : isJoker(c);
  if (isJoker(c)) return true;
  if (rank(c) === 11 && st.wild) return false;
  var top = topOf(st);
  if (st.wild) return suit(c) === st.suit;
  return suit(c) === st.suit || rank(c) === rank(top);
}
X.playable = playable;

X.legal = function (st, seat) {
  if (st.phase !== 'play' || st.turn !== seat) return [];
  var out = [], i, h = st.hands[seat];
  for (i = 0; i < h.length; i++) {
    if (playable(st, h[i])) {
      var wildc = !st.first && (isJoker(h[i]) || rank(h[i]) === 11);
      out.push({ t: 'play', c: h[i], needSuit: wildc });
    }
  }
  if (!st.first) out.push({ t: 'draw' });
  return out;
};

function nextSeat(st, from, steps) { var s = from, i; for (i = 0; i < steps; i++) s = (s + st.dir + st.n) % st.n; return s; }

X.apply = function (st, seat, act) {
  if (st.phase !== 'play' || st.turn !== seat || !act) return { ok: false };
  var ev = [], h = st.hands[seat], i;
  if (act.t === 'draw') {
    if (st.first) return { ok: false };
    var k = st.pend > 0 ? st.pend : 1, forced = st.pend > 0;
    var got = drawCards(st, seat, k, ev);
    ev.push({ t: 'draw', seat: seat, n: got.length, forced: forced, cards: got });
    st.pend = 0; st.pendK = '';
    st.turn = nextSeat(st, seat, 1);
    st.stall = got.length ? 0 : (st.stall || 0) + 1;
    if (st.stall >= st.n) {
      // deste bitti, kimse oynayamıyor: eli en hafif olan kazanır
      var bw = 0, bv = 1e9, q;
      for (q = 0; q < st.n; q++) {
        var sv = 0, z;
        for (z = 0; z < st.hands[q].length; z++) sv += val(st.hands[q][z]);
        if (sv < bv) { bv = sv; bw = q; }
      }
      ev.push({ t: 'stall' });
      return { ok: true, ev: ev.concat(endHand(st, bw, -1)) };
    }
    return { ok: true, ev: ev };
  }
  if (act.t !== 'play') return { ok: false };
  var idx = h.indexOf(act.c);
  if (idx < 0 || !playable(st, act.c)) return { ok: false };
  var c = act.c, wildc = !st.first && (isJoker(c) || rank(c) === 11);
  if (wildc && !(act.s >= 0 && act.s <= 3)) return { ok: false };
  h.splice(idx, 1);
  st.disc.push(c);
  st.stall = 0;
  ev.push({ t: 'play', seat: seat, c: c });
  var wasFirst = st.first;
  st.first = false;
  if (wasFirst) { st.suit = 3; st.wild = false; st.turn = nextSeat(st, seat, 1); }
  else {
    st.wild = wildc;
    st.suit = wildc ? act.s : suit(c);
    if (wildc) ev.push({ t: 'suit', seat: seat, s: st.suit });
  }
  if (!h.length) return { ok: true, ev: ev.concat(endHand(st, seat, c)) };
  if (wasFirst) return { ok: true, ev: ev };
  var r = rank(c);
  if (isJoker(c)) { st.pend += 10; st.pendK = 'J'; st.turn = nextSeat(st, seat, 1); }
  else if (r === 7) { st.pend += 3; st.pendK = '7'; st.turn = nextSeat(st, seat, 1); }
  else if (r === 1) {
    if (st.opts.ace === 'skip') { st.turn = nextSeat(st, seat, 2); ev.push({ t: 'skip', seat: nextSeat(st, seat, 1) }); }
    else {
      for (i = 1; i < st.n; i++) {
        var o = (seat + i) % st.n, g = drawCards(st, o, 1, ev);
        ev.push({ t: 'draw', seat: o, n: g.length, forced: true, cards: g, ace: true });
      }
      st.turn = seat;
    }
  } else if (r === 10) {
    st.dir = -st.dir;
    ev.push({ t: 'reverse', dir: st.dir });
    st.turn = st.n === 2 ? seat : nextSeat(st, seat, 1);
  } else st.turn = nextSeat(st, seat, 1);
  return { ok: true, ev: ev };
};

function endHand(st, winner, lastCard) {
  var rows = [], i, mult = 1, ev = [];
  if (isJoker(lastCard)) mult = 10; else if (rank(lastCard) === 7) mult = 3; else if (rank(lastCard) === 11) mult = 2;
  for (i = 0; i < st.n; i++) {
    if (i === winner) { rows.push({ seat: i, cards: [], drawn: [], base: 0, total: 0 }); continue; }
    var h = st.hands[i], base = 0, drawn = [], need = 0, j;
    for (j = 0; j < h.length; j++) {
      base += val(h[j]);
      if (isJoker(h[j])) need += 10; else if (rank(h[j]) === 7) need += 3;
    }
    var guard = 0;
    while (need > 0 && st.deck.length && guard++ < 200) {
      var c = st.deck.pop(); need--; drawn.push(c); base += val(c);
      if (isJoker(c)) need += 10; else if (rank(c) === 7) need += 3;
    }
    var tot = base * mult;
    rows.push({ seat: i, cards: h.slice(), drawn: drawn, base: base, total: tot });
    st.scores[i] += tot;
  }
  st.last = { winner: winner, lastCard: lastCard, mult: mult, rows: rows };
  st.phase = 'handEnd';
  var over = false;
  if (st.opts.mode === 'hands') over = st.handNo >= st.opts.v;
  else for (i = 0; i < st.n; i++) if (st.scores[i] >= st.opts.v) over = true;
  st.over = over;
  if (over) {
    var best = 1e9; st.winner = [];
    for (i = 0; i < st.n; i++) if (st.scores[i] < best) best = st.scores[i];
    for (i = 0; i < st.n; i++) if (st.scores[i] === best) st.winner.push(i);
  }
  ev.push({ t: 'handEnd', over: over, winner: winner });
  return ev;
}

X.nextHand = function (st) {
  if (st.phase !== 'handEnd') return { ok: false, ev: [] };
  if (st.over) { st.phase = 'gameEnd'; return { ok: true, ev: [{ t: 'gameEnd' }] }; }
  return { ok: true, ev: X.startHand(st) };
};

X.view = function (st, seat) {
  return {
    g: 'pis7', n: st.n, turn: st.turn, phase: st.phase, handNo: st.handNo, dealer: st.dealer, over: st.over, winner: st.winner,
    opts: st.opts, scores: st.scores.slice(),
    hand: seat >= 0 ? st.hands[seat].slice() : [],
    counts: st.hands.map(function (h) { return h.length; }),
    top: topOf(st), discN: st.disc.length, discTop: st.disc.slice(-3), deckN: st.deck.length,
    suit: st.suit, wild: st.wild, pend: st.pend, pendK: st.pendK, dir: st.dir, first: st.first, last: st.last
  };
};

/* ---------------- Bilgisayar oyuncusu ---------------- */
X.bot = function (st, seat, level) {
  level = level || 'medium';
  var acts = X.legal(st, seat), plays = [], i;
  for (i = 0; i < acts.length; i++) if (acts[i].t === 'play') plays.push(acts[i]);
  if (!plays.length) return { t: 'draw' };
  var h = st.hands[seat], next = nextSeat(st, seat, 1);
  var nextCnt = st.hands[next].length;
  var minOpp = 99, o;
  for (o = 0; o < st.n; o++) if (o !== seat) minOpp = Math.min(minOpp, st.hands[o].length);
  var noise = level === 'easy' ? 12 : level === 'hard' ? 0.2 : 1.5;
  var best = null;
  for (i = 0; i < plays.length; i++) {
    var c = plays[i].c, r = rank(c), u = 0, rest = h.filter(function (x) { return x !== c; });
    var jk = isJoker(c);
    if (rest.length === 0) u += 200;
    u += val(c) * (jk ? 0 : 0.5);
    if (r === 7) u += st.pend > 0 ? 12 : (nextCnt <= 3 ? 14 : 6);
    if (r === 1) u += 4 + 2.5 * (st.n - 1);
    if (r === 10) u += 2 + (nextCnt <= 2 ? 5 : 0);
    if (r === 11 || jk) u -= (rest.length <= 2 ? 0 : 14);
    if (st.pend > 0 && r === 7) u += 20;
    // oynadıktan sonra elde devam ettirebileceğim kart sayısı
    var ns = (r === 11 || jk) ? 0 : suit(c), follow = 0, z;
    for (z = 0; z < rest.length; z++) {
      if (rest[z] < 52 && (suit(rest[z]) === ns || rank(rest[z]) === r)) follow++;
    }
    u += follow * 0.8;
    var act = { t: 'play', c: c };
    if (plays[i].needSuit) {
      var cnt = [0, 0, 0, 0], bs = 0;
      for (z = 0; z < rest.length; z++) if (rest[z] < 52) cnt[suit(rest[z])]++;
      for (z = 1; z < 4; z++) if (cnt[z] > cnt[bs] || (cnt[z] === cnt[bs] && KS.rnd() < 0.5)) bs = z;
      act.s = bs;
    }
    u += (KS.rnd() - 0.5) * noise;
    if (!best || u > best.u) best = { u: u, a: act };
  }
  if (level === 'easy' && KS.rnd() < 0.2 && st.pend === 0) {
    var rp = KS.pick(plays), ra = { t: 'play', c: rp.c };
    if (rp.needSuit) ra.s = Math.floor(KS.rnd() * 4);
    return ra;
  }
  return best.a;
};

KS.engines.pis7 = X;
if (typeof module !== 'undefined' && module.exports) module.exports = X;
})(typeof window !== 'undefined' ? window : globalThis);
