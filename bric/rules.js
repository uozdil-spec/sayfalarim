/* Briç kural motoru: ihale (açık artırma) + kâğıt oyunu + puanlama.
   Koltuklar saat yönünde: 0 Güney, 1 Batı, 2 Kuzey, 3 Doğu. Ortaklar: 0-2 ve 1-3.
   Kart numarası: 0-51 (maça, kupa, karo, sinek x A..K). Briçte As en yüksektir.
   İhale değeri: seviye*5 + takım (0 sinek, 1 karo, 2 kupa, 3 maça, 4 sans). Pas 'P', kontra 'X', rekontra 'R'. */
(function (root) {
'use strict';
var BR = root.BR || require('./kscore.js');
var rank = BR.rank, suit = BR.suit;
var B = { id: 'bric', name: 'Briç', min: 4, max: 4 };

B.SEATN = ['Güney', 'Batı', 'Kuzey', 'Doğu'];
B.SEATC = ['G', 'B', 'K', 'D'];
B.DEN = ['♣', '♦', '♥', '♠', 'SA'];            // ihale takımları (düşükten yükseğe)
B.DENN = ['Sinek', 'Karo', 'Kupa', 'Maça', 'Sans'];
B.DEN2SUIT = [3, 2, 1, 0, -1];                  // ihale takımı -> kart takımı (-1 = koz yok)
B.SUIT2DEN = [3, 2, 1, 0];
B.side = function (s) { return s % 2; };
B.rv = function (c) { return rank(c) === 1 ? 14 : rank(c); };   // briç gücü (As = 14)
B.bidLevel = function (v) { return Math.floor(v / 5); };
B.bidDen = function (v) { return v % 5; };
B.bidText = function (b) {
  if (b === 'P') return 'Pas';
  if (b === 'X') return 'Kontra';
  if (b === 'R') return 'Rekontra';
  return B.bidLevel(b) + B.DEN[B.bidDen(b)];
};

/* Dağıtım numarasına göre dağıtıcı ve riskli taraflar (Chicago: yok, dağıtıcı tarafı, dağıtıcı tarafı, herkes) */
B.dealerOf = function (deal) { return (deal - 1) % 4; };
B.vulOf = function (deal) {
  var m = (deal - 1) % 4, d = B.dealerOf(deal);
  if (m === 0) return [false, false];
  if (m === 3) return [true, true];
  var v = [false, false]; v[d % 2] = true; return v;
};

B.init = function (o) {
  var deals = [4, 8, 12, 16].indexOf(o.deals | 0) >= 0 ? (o.deals | 0) : 4;
  var st = {
    g: 'bric', n: 4, opts: { deals: deals },
    deal: 0, phase: 'play', stage: 'bid', over: false, winner: -1,
    scores: [0, 0], hist: [], last: null
  };
  return { st: st, ev: B.startHand(st) };
};

B.startHand = function (st) {
  var d = BR.deck(false), i, k;
  st.deal++;
  st.dealer = B.dealerOf(st.deal);
  st.vul = B.vulOf(st.deal);
  st.hands = [[], [], [], []];
  for (i = 0; i < 52; i++) st.hands[(st.dealer + 1 + (i % 4)) % 4].push(d[i]);
  for (k = 0; k < 4; k++) st.hands[k] = B.sort(st.hands[k]);
  st.orig = st.hands.map(function (h) { return h.slice(); });
  st.auction = [];
  st.stage = 'bid'; st.phase = 'play';
  st.turn = st.dealer;
  st.contract = null; st.declarer = -1; st.dummy = -1; st.leader = -1;
  st.cur = []; st.to = -1; st.tricks = [0, 0]; st.tlog = [];
  st.dummyShown = false;
  st.auto = [false, false, false, false];
  st.over = false; st.winner = -1;
  return [{ t: 'newHand', deal: st.deal }, { t: 'deal' }];
};

/* Düzgün sıralama: maça, kupa, sinek, karo (renkler dönüşümlü), kâğıtlar büyükten küçüğe */
var SORTORD = [0, 1, 3, 2];
B.sort = function (h) {
  return h.slice().sort(function (a, b) {
    var sa = SORTORD.indexOf(suit(a)), sb = SORTORD.indexOf(suit(b));
    return sa - sb || B.rv(b) - B.rv(a);
  });
};

/* ---------------- İhale ---------------- */
function lastCall(au) {
  var i;
  for (i = au.length - 1; i >= 0; i--) if (au[i].b !== 'P') return au[i];
  return null;
}
B.lastBid = function (au) {                       // son geçerli ihale (sayı)
  var i;
  for (i = au.length - 1; i >= 0; i--) if (typeof au[i].b === 'number') return au[i];
  return null;
};
B.callLegal = function (au, b, seat) {
  if (b === 'P') return true;
  var lc = lastCall(au);
  if (typeof b === 'number') {
    if (b < 5 || b > 39 || b !== Math.floor(b)) return false;
    var lb = B.lastBid(au);
    return !lb || b > lb.b;
  }
  if (b === 'X') return !!lc && typeof lc.b === 'number' && lc.s % 2 !== seat % 2;
  if (b === 'R') return !!lc && lc.b === 'X' && lc.s % 2 !== seat % 2;
  return false;
};
B.legalCalls = function (au, seat) {
  var out = ['P'], v;
  for (v = 5; v <= 39; v++) if (B.callLegal(au, v, seat)) out.push(v);
  if (B.callLegal(au, 'X', seat)) out.push('X');
  if (B.callLegal(au, 'R', seat)) out.push('R');
  return out;
};

function resolveAuction(st) {
  var au = st.auction, n = au.length, i, anyBid = false;
  for (i = 0; i < n; i++) if (typeof au[i].b === 'number') anyBid = true;
  if (!anyBid) return n >= 4 ? 'pass' : null;
  if (n >= 4 && au[n - 1].b === 'P' && au[n - 2].b === 'P' && au[n - 3].b === 'P') return 'end';
  return null;
}

function setContract(st) {
  var au = st.auction, lb = B.lastBid(au), i, dbl = 0, decl = -1, den = B.bidDen(lb.b);
  for (i = au.length - 1; i >= 0; i--) {
    if (au[i] === lb) break;
    if (au[i].b === 'X') dbl = 1; else if (au[i].b === 'R') dbl = 2;
  }
  for (i = 0; i < au.length; i++) {
    if (typeof au[i].b === 'number' && B.bidDen(au[i].b) === den && au[i].s % 2 === lb.s % 2) { decl = au[i].s; break; }
  }
  st.contract = { v: lb.b, level: B.bidLevel(lb.b), den: den, dbl: dbl, declarer: decl, side: decl % 2 };
  st.declarer = decl; st.dummy = (decl + 2) % 4; st.leader = (decl + 1) % 4;
  st.to = st.leader; st.cur = []; st.stage = 'card';
}

function applyBid(st, seat, a) {
  if (!a || a.t !== 'bid' || st.turn !== seat || !B.callLegal(st.auction, a.b, seat)) return { ok: false };
  st.auction.push({ s: seat, b: a.b });
  var ev = [{ t: 'bid', seat: seat, b: a.b }], r = resolveAuction(st);
  if (r === 'pass') { ev = ev.concat(finishPassOut(st)); }
  else if (r === 'end') {
    setContract(st);
    ev.push({ t: 'contract', contract: st.contract, declarer: st.declarer, dummy: st.dummy });
  } else st.turn = (seat + 1) % 4;
  return { ok: true, ev: ev };
}

/* ---------------- Kâğıt oyunu ---------------- */
B.acting = function (st) {
  if (st.stage !== 'card' || st.to < 0) return -1;
  return st.to === st.dummy ? st.declarer : st.to;
};
B.turnOf = function (st) {
  if (st.phase !== 'play') return -1;
  return st.stage === 'bid' ? st.turn : B.acting(st);
};
function legalCards(st) {
  var h = st.hands[st.to];
  if (!st.cur.length) return h.slice();
  var ls = suit(st.cur[0].c), f = h.filter(function (c) { return suit(c) === ls; });
  return f.length ? f : h.slice();
}
B.trickWinner = function (cards, trump) {    // cards: [{s,c}], trump: kart takımı ya da -1
  var best = 0, i, ls = suit(cards[0].c);
  for (i = 1; i < cards.length; i++) {
    var a = cards[i].c, b = cards[best].c, sa = suit(a), sb = suit(b);
    if (sa === sb) { if (B.rv(a) > B.rv(b)) best = i; }
    else if (trump >= 0 && sa === trump) best = i;
    else if (trump >= 0 && sb === trump) { /* en iyi kart koz */ }
    else if (sa === ls && sb !== ls) best = i;
  }
  return cards[best].s;
};

function applyPlay(st, seat, a) {
  if (!a || a.t !== 'play' || B.acting(st) !== seat) return { ok: false };
  var h = st.hands[st.to], c = a.c, k = h.indexOf(c);
  if (k < 0 || legalCards(st).indexOf(c) < 0) return { ok: false };
  var ev = [], who = st.to;
  h.splice(k, 1);
  st.cur.push({ s: who, c: c });
  ev.push({ t: 'play', seat: who, by: seat, c: c });
  if (!st.dummyShown && st.tlog.length === 0 && st.cur.length === 1) {
    st.dummyShown = true;
    ev.push({ t: 'dummy', seat: st.dummy });
  }
  if (st.cur.length < 4) { st.to = (who + 1) % 4; return { ok: true, ev: ev }; }
  var trump = B.DEN2SUIT[st.contract.den];
  var w = B.trickWinner(st.cur, trump);
  st.tricks[w % 2]++;
  var rec = { lead: st.cur[0].s, cards: st.cur.map(function (x) { return [x.s, x.c]; }), w: w };
  st.tlog.push(rec);
  ev.push({ t: 'trick', winner: w, cards: st.cur.map(function (x) { return { s: x.s, c: x.c }; }), n: st.tlog.length, tricks: st.tricks.slice() });
  st.cur = [];
  st.to = w;
  if (st.tlog.length === 13) ev = ev.concat(endHand(st));
  return { ok: true, ev: ev };
}

/* ---------------- Puanlama ---------------- */
B.score = function (ct, taken, vul) {
  var need = 6 + ct.level, parts = { contract: 0, bonus: 0, slam: 0, insult: 0, over: 0, under: 0 };
  var mult = ct.dbl === 2 ? 4 : ct.dbl === 1 ? 2 : 1, total, i;
  var perTrick = ct.den >= 2 ? 30 : 20;
  if (taken >= need) {
    var base = ct.den === 4 ? 40 + 30 * (ct.level - 1) : perTrick * ct.level;
    parts.contract = base * mult;
    parts.bonus = parts.contract >= 100 ? (vul ? 500 : 300) : 50;
    if (ct.level === 6) parts.slam = vul ? 750 : 500;
    else if (ct.level === 7) parts.slam = vul ? 1500 : 1000;
    parts.insult = ct.dbl === 2 ? 100 : ct.dbl === 1 ? 50 : 0;
    var over = taken - need;
    if (ct.dbl === 0) parts.over = over * (ct.den === 4 ? 30 : perTrick);
    else parts.over = over * (vul ? 200 : 100) * (ct.dbl === 2 ? 2 : 1);
    total = parts.contract + parts.bonus + parts.slam + parts.insult + parts.over;
    return { need: need, taken: taken, made: true, over: over, under: 0, parts: parts, total: total };
  }
  var under = need - taken, pen = 0;
  if (ct.dbl === 0) pen = under * (vul ? 100 : 50);
  else {
    for (i = 1; i <= under; i++) {
      if (vul) pen += i === 1 ? 200 : 300;
      else pen += i === 1 ? 100 : (i <= 3 ? 200 : 300);
    }
    if (ct.dbl === 2) pen *= 2;
  }
  parts.under = pen;
  return { need: need, taken: taken, made: false, over: 0, under: under, parts: parts, total: -pen };
};

function finishPassOut(st) {
  var res = { deal: st.deal, dealer: st.dealer, vul: st.vul.slice(), pass: true, ns: 0, ew: 0, hands: st.orig.map(function (h) { return h.slice(); }), auction: st.auction.slice() };
  st.last = res;
  st.hist.push({ d: st.deal, pass: 1, ns: 0, ew: 0 });
  return closeHand(st);
}
function endHand(st) {
  var ct = st.contract, taken = st.tricks[ct.side], sc = B.score(ct, taken, st.vul[ct.side]);
  var ns = 0, ew = 0, delta = sc.total;
  if (delta >= 0) { if (ct.side === 0) ns = delta; else ew = delta; }
  else { if (ct.side === 0) ew = -delta; else ns = -delta; }
  st.scores[0] += ns; st.scores[1] += ew;
  var res = {
    deal: st.deal, dealer: st.dealer, vul: st.vul.slice(), pass: false,
    contract: { v: ct.v, level: ct.level, den: ct.den, dbl: ct.dbl, declarer: ct.declarer, side: ct.side },
    taken: taken, need: sc.need, made: sc.made, over: sc.over, under: sc.under, parts: sc.parts, ns: ns, ew: ew,
    declVul: !!st.vul[ct.side],
    hands: st.orig.map(function (h) { return h.slice(); }), auction: st.auction.slice(), tlog: st.tlog.slice()
  };
  st.last = res;
  st.hist.push({ d: st.deal, v: ct.v, x: ct.dbl, by: ct.declarer, t: taken, ns: ns, ew: ew });
  return closeHand(st);
}
function closeHand(st) {
  st.phase = 'handEnd';
  st.stage = 'done';
  st.over = st.deal >= st.opts.deals;
  st.winner = -1;
  if (st.over) {
    if (st.scores[0] > st.scores[1]) st.winner = 0;
    else if (st.scores[1] > st.scores[0]) st.winner = 1;
  }
  st.dummyShown = !!st.contract;
  return [{ t: 'handEnd', over: st.over }];
}

B.nextHand = function (st) {
  if (st.phase !== 'handEnd') return { ok: false, ev: [] };
  if (st.over) { st.phase = 'gameEnd'; return { ok: true, ev: [{ t: 'gameEnd' }] }; }
  return { ok: true, ev: B.startHand(st) };
};

B.apply = function (st, seat, a) {
  if (st.phase !== 'play' || !a) return { ok: false };
  if (a.t === 'auto') {                    // oyunu bilgisayara bırak / geri al (yalnız oyun sahibi)
    if (st.stage !== 'card' || seat !== st.declarer) return { ok: false };
    st.auto[seat] = !!a.on;
    return { ok: true, ev: [{ t: 'auto', seat: seat, on: !!a.on }] };
  }
  return st.stage === 'bid' ? applyBid(st, seat, a) : applyPlay(st, seat, a);
};

B.legal = function (st, seat) {
  if (st.phase !== 'play' || B.turnOf(st) !== seat) return [];
  if (st.stage === 'bid') return B.legalCalls(st.auction, seat).map(function (b) { return { t: 'bid', b: b }; });
  return legalCards(st).map(function (c) { return { t: 'play', c: c }; });
};

/* ---------------- Oyuncuya özel görünüm ---------------- */
B.view = function (st, seat) {
  var me = seat >= 0 ? seat : 0, acting = B.turnOf(st);
  var v = {
    g: 'bric', n: 4, phase: st.phase, stage: st.stage, turn: acting, to: st.stage === 'card' ? st.to : -1,
    deal: st.deal, deals: st.opts.deals, dealer: st.dealer, vul: st.vul.slice(), opts: st.opts,
    auction: st.auction.slice(), contract: st.contract, declarer: st.declarer, dummy: st.dummy,
    hand: seat >= 0 ? st.hands[seat].slice() : [],
    counts: st.hands.map(function (h) { return h.length; }),
    dummyHand: (st.dummyShown && st.dummy >= 0 && st.phase === 'play') ? st.hands[st.dummy].slice() : null,
    trick: st.cur.map(function (x) { return { s: x.s, c: x.c }; }),
    tricks: st.tricks.slice(), tlog: st.tlog, nTricks: st.tlog.length,
    scores: st.scores.slice(), hist: st.hist, last: st.last, over: st.over, winner: st.winner,
    auto: st.auto.slice(), playable: [], bidInfo: null
  };
  if (st.phase === 'handEnd' || st.phase === 'gameEnd') v.dummyHand = null;
  if (st.phase === 'play' && acting === seat) {
    if (st.stage === 'bid') {
      var lb = B.lastBid(st.auction);
      v.bidInfo = { min: lb ? lb.b + 1 : 5, canX: B.callLegal(st.auction, 'X', seat), canR: B.callLegal(st.auction, 'R', seat) };
    } else v.playable = legalCards(st);
  }
  return v;
};

if (typeof module !== 'undefined' && module.exports) module.exports = B;
BR.engines.bric = B;
BR.Bridge = B;
})(typeof window !== 'undefined' ? window : globalThis);
