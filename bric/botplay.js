/* Briç bilgisayar oyuncusu: kâğıt oyunu.
   Temel: sezgisel oyun politikası. Orta/zor düzeyde: görünmeyen elleri (iptal edilen renkler dikkate alınarak)
   rastgele dağıtıp politikayla sonuna kadar oynatır, en iyi sonucu veren kâğıdı seçer (Monte Carlo). */
(function (root) {
'use strict';
var BR = root.BR || require('./kscore.js');
var B = BR.Bridge || require('./rules.js');
var rank = BR.rank, suit = BR.suit, rv = B.rv;
var P = BR.play = {};

function ofSuit(h, s) { var r = [], i; for (i = 0; i < h.length; i++) if (suit(h[i]) === s) r.push(h[i]); return r; }
function asc(a, b) { return rv(a) - rv(b); }
function lowest(a) { var b = a[0], i; for (i = 1; i < a.length; i++) if (rv(a[i]) < rv(b)) b = a[i]; return b; }
function highest(a) { var b = a[0], i; for (i = 1; i < a.length; i++) if (rv(a[i]) > rv(b)) b = a[i]; return b; }
function cardOf(s, r14) { return s * 13 + (r14 === 14 ? 0 : r14 - 1); }

/* ---- Rollout durumu ---- */
function winnerIdx(tr, trump) { var w = B.trickWinner(tr, trump), i; for (i = 0; i < tr.length; i++) if (tr[i].s === w) return i; return 0; }
/* c kâğıdı, eldeki (own) kâğıtlar dışında oynanmamış daha yüksek kâğıt bırakmıyorsa kesin alır */
function isTop(S, own, c) {
  var s = suit(c), r = rv(c), x;
  for (x = r + 1; x <= 14; x++) { var k = cardOf(s, x); if (!S.played[k] && own.indexOf(k) < 0) return false; }
  return true;
}

function pickLead(S, seat, h) {
  var trump = S.trump, side = seat & 1, decl = side === S.declSide, i, s;
  var partner = (seat + 2) & 3;
  var ownAll = h;
  if (decl) ownAll = h.concat(S.hands[partner]);
  if (trump >= 0 && decl) {                              // koz çek
    var tr = ofSuit(h, trump);
    if (tr.length) {
      var unp = 0, k;
      for (k = 0; k < 13; k++) { var kc = trump * 13 + k; if (!S.played[kc] && ownAll.indexOf(kc) < 0) unp++; }
      if (unp > 0) {
        var sorted = tr.slice().sort(asc);
        if (isTop(S, ownAll, highest(tr)) || tr.length >= 2) return highest(tr);
        if (S.hands[partner].length && ofSuit(S.hands[partner], trump).length) { /* dummy'de koz var, oradan çekilecek */ }
        else return lowest(tr);
      }
    }
  }
  var best = null, bs = -1e9;
  for (s = 0; s < 4; s++) {
    var cs = ofSuit(h, s).sort(function (a, b) { return rv(b) - rv(a); });
    if (!cs.length) continue;
    if (s === trump && decl) { continue; }
    var score = 0, top = cs[0], tv = rv(top), n = cs.length, cand = lowest(cs);
    var winners = 0;
    for (i = 0; i < n; i++) { if (isTop(S, ownAll, cs[i]) ) winners++; else break; }
    if (winners > 0) { score = 100 + winners * 6 + n; cand = cs[0]; }
    else {
      var seq = n >= 2 && tv >= 11 && rv(cs[1]) === tv - 1;
      if (seq) { score = 50 + tv; cand = cs[0]; }
      else if (n >= 4) { score = 18 + n; cand = cs[Math.min(3, n - 1)]; if (tv >= 13) score -= 14; }
      else if (n === 1) { score = (trump >= 0 && s !== trump && !decl && ofSuit(h, trump).length >= 2) ? 30 : 4; cand = cs[0]; }
      else if (n === 2) { score = tv >= 13 ? -12 : 10; cand = cs[0]; }
      else { score = tv >= 12 ? -10 : 8; cand = tv >= 12 ? cs[n - 1] : cs[0]; }
    }
    if (trump >= 0 && s === trump) { score -= 25; cand = cs[0]; if (decl) score = -1e8; }
    if (S.pSuit && S.pSuit[seat] === s && !decl) score += 20;
    if (!decl && S.dummySuits && S.dummySuits.indexOf(s) >= 0) score -= 6;
    if (score > bs) { bs = score; best = cand; }
  }
  if (best === null) best = h[0];
  return best;
}

function discard(S, h, trump) {
  var cs = [], s, best = null, bs = -1e9, i;
  for (s = 0; s < 4; s++) {
    if (s === trump) continue;
    var c = ofSuit(h, s); if (!c.length) continue;
    var hon = 0; for (i = 0; i < c.length; i++) if (rv(c[i]) >= 12) hon++;
    var sc = c.length - 3 * hon - (rv(highest(c)) === 14 ? 3 : 0);
    if (sc > bs) { bs = sc; best = lowest(c); }
  }
  if (best === null) best = lowest(h);
  return best;
}

function pickFollow(S, seat, h, legal) {
  var tr = S.trick, ls = suit(tr[0].c), trump = S.trump, last = tr.length === 3;
  var bi = winnerIdx(tr, trump), bc = tr[bi].c, bs = tr[bi].s, partnerWin = ((bs ^ seat) & 1) === 0;
  var sup = legal.filter(function (c) { return suit(c) === ls; });
  var partner = (seat + 2) & 3, ownAll = h.concat(S.hands[partner]);
  if (sup.length) {
    if (suit(bc) !== ls) return lowest(sup);                 // koz atılmış
    if (partnerWin && (last || isTop(S, h, bc))) return lowest(sup);
    var winners = sup.filter(function (c) { return rv(c) > rv(bc); });
    if (!winners.length) return lowest(sup);
    if (last) return lowest(winners);
    var lw = lowest(winners);
    if (tr.length === 1) {                                  // ikinci el: düşük oyna, ama kesin alıyorsan al
      if (isTop(S, h, lw) && (rv(bc) >= 10 || isTop(S, h, highest(winners)))) return lw;
      if (partnerWin) return lowest(sup);
      if (rv(bc) >= 12 && S.declSide === (seat & 1) ? false : false) return lw;
      return lowest(sup);
    }
    if (partnerWin) return lowest(sup);
    return lw;                                              // üçüncü el: en ucuz yeterli kâğıt
  }
  if (trump >= 0) {
    var tc = ofSuit(legal, trump);
    if (tc.length && !(partnerWin && (last || isTop(S, h, bc)))) {
      if (suit(bc) === trump) {
        var over = tc.filter(function (c) { return rv(c) > rv(bc); });
        if (over.length && !partnerWin) return lowest(over);
      } else if (!partnerWin) return lowest(tc);
    }
  }
  return discard(S, legal, trump);
}

function policy(S, seat) {
  var h = S.hands[seat], legal = h;
  if (S.trick.length) {
    var ls = suit(S.trick[0].c), f = ofSuit(h, ls);
    if (f.length) legal = f;
    if (legal.length === 1) return legal[0];
    return pickFollow(S, seat, h, legal);
  }
  if (h.length === 1) return h[0];
  return pickLead(S, seat, h);
}

function rollout(S) {
  var guard = 0;
  while (guard++ < 60) {
    var seat = S.to, h = S.hands[seat];
    if (!h.length && !S.trick.length) break;
    if (!h.length) break;
    var c = policy(S, seat), k = h.indexOf(c);
    if (k < 0) { c = h[0]; k = 0; }
    h.splice(k, 1);
    S.trick.push({ s: seat, c: c }); S.played[c] = 1;
    if (S.trick.length === 4) {
      var w = B.trickWinner(S.trick, S.trump);
      S.won[w & 1]++; S.trick = []; S.to = w;
    } else S.to = (seat + 1) & 3;
  }
}

/* ---- Görünümden bilgi çıkar ---- */
function gather(v) {
  var played = new Array(52), i, j, voids = [{}, {}, {}, {}], pSuit = [-1, -1, -1, -1];
  for (i = 0; i < 52; i++) played[i] = 0;
  var seenLead = [];
  function note(tr, ledFirst) {
    var ls = suit(tr[0][1]);
    for (j = 0; j < tr.length; j++) {
      played[tr[j][1]] = 1;
      if (j > 0 && suit(tr[j][1]) !== ls) voids[tr[j][0]][ls] = true;
    }
  }
  for (i = 0; i < v.tlog.length; i++) note(v.tlog[i].cards);
  if (v.trick.length) note(v.trick.map(function (x) { return [x.s, x.c]; }));
  return { played: played, voids: voids };
}

function sampleDeal(unknown, hidden, counts, voids) {
  // hidden: koltuk listesi; counts: kalan kâğıt sayısı
  var cards = unknown.slice(), i, tries, res;
  for (tries = 0; tries < 12; tries++) {
    // karıştır
    for (i = cards.length - 1; i > 0; i--) { var j = Math.floor(BR.rnd() * (i + 1)), t = cards[i]; cards[i] = cards[j]; cards[j] = t; }
    res = {}; var cap = {}, ok = true; hidden.forEach(function (s) { res[s] = []; cap[s] = counts[s]; });
    // en kısıtlı kâğıtlardan başla
    var order = cards.slice().sort(function (a, b) {
      var sa = suit(a), sb = suit(b), na = 0, nb = 0;
      hidden.forEach(function (s) { if (!voids[s][sa]) na++; if (!voids[s][sb]) nb++; });
      return na - nb;
    });
    for (i = 0; i < order.length && ok; i++) {
      var c = order[i], su = suit(c), allowed = [], tot = 0;
      hidden.forEach(function (s) { if (!voids[s][su] && cap[s] > 0) { allowed.push(s); tot += cap[s]; } });
      if (!allowed.length) { ok = false; break; }
      var x = BR.rnd() * tot, pick = allowed[0], q;
      for (q = 0; q < allowed.length; q++) { x -= cap[allowed[q]]; if (x <= 0) { pick = allowed[q]; break; } }
      res[pick].push(c); cap[pick]--;
    }
    if (ok) return res;
  }
  return null;
}

/* Kâğıt oyunu için ana giriş. v: görünüm */
P.choose = function (v, level) {
  level = level || 'medium';
  var legal = v.playable, me = v.turn;
  if (!legal || !legal.length) return null;
  if (legal.length === 1) return legal[0];
  var to = v.to, tr = v.trick, ct = v.contract, trump = B.DEN2SUIT[ct.den];
  var myHand = (to === v.dummy && me === v.declarer) ? v.dummyHand : v.hand;
  var info = gather(v), played = info.played;
  var S0 = { trump: trump, declSide: ct.side, played: played };
  // açılış atışı ve kolay düzey: sezgisel
  if (!tr.length && v.nTricks === 0 && me !== v.declarer && !v.dummyHand) return openingLead(v, myHand, trump);
  var noise = level === 'easy' ? 0.2 : 0;
  if (level === 'easy') {
    var Seasy = makeState(v, myHand, null, info, trump);
    if (BR.rnd() < noise) return legal[Math.floor(BR.rnd() * legal.length)];
    return policy(Seasy, to);
  }
  // Monte Carlo
  var K = level === 'hard' ? 28 : 12;
  var known = {};
  var vis = [v.hand]; if (v.dummyHand && v.dummy !== me) vis.push(v.dummyHand);
  vis.forEach(function (hh) { hh.forEach(function (c) { known[c] = 1; }); });
  var unknown = [], c;
  for (c = 0; c < 52; c++) if (!played[c] && !known[c]) unknown.push(c);
  var hidden = [], s;
  for (s = 0; s < 4; s++) {
    var seen = (s === me) || (v.dummyHand && s === v.dummy);
    if (!seen && v.counts[s] > 0) hidden.push(s);
  }
  // eşdeğer kâğıtları ele
  var cands = [], sorted = legal.slice().sort(function (a, b) { return suit(a) - suit(b) || rv(a) - rv(b); });
  sorted.forEach(function (cd, i) {
    var nxt = sorted[i + 1];
    if (nxt !== undefined && suit(nxt) === suit(cd)) {
      var between = false, x;
      for (x = rv(cd) + 1; x < rv(nxt); x++) { var kk = cardOf(suit(cd), x); if (!played[kk]) between = true; }
      if (!between) return;                                       // nxt ile eşdeğer
    }
    cands.push(cd);
  });
  if (cands.length === 1) return cands[0];
  var sum = cands.map(function () { return 0; }), n = 0, side = me & 1, need = 6 + ct.level, k;
  var cnt = v.counts.slice();
  for (k = 0; k < K; k++) {
    var dl = hidden.length ? sampleDeal(unknown, hidden, cnt, info.voids) : {};
    if (!dl) continue;
    n++;
    var i;
    for (i = 0; i < cands.length; i++) {
      var S = makeState(v, myHand, dl, info, trump);
      var pc = cands[i], h = S.hands[to], ix = h.indexOf(pc);
      if (ix < 0) continue;
      h.splice(ix, 1); S.trick.push({ s: to, c: pc }); S.played[pc] = 1;
      if (S.trick.length === 4) { var w = B.trickWinner(S.trick, trump); S.won[w & 1]++; S.trick = []; S.to = w; } else S.to = (to + 1) & 3;
      rollout(S);
      var dt = v.tricks[ct.side] + S.won[ct.side];
      var made = dt >= need;
      var sc;
      if (side === ct.side) sc = (made ? 10 : 0) + dt * 0.12; else sc = (made ? 0 : 10) + (13 - dt) * 0.12;
      sum[i] += sc;
    }
  }
  if (!n) return policy(makeState(v, myHand, null, info, trump), to);
  var bi = 0;
  for (k = 1; k < cands.length; k++) if (sum[k] > sum[bi]) bi = k;
  return cands[bi];
};

function makeState(v, myHand, dl, info, trump) {
  var hands = [[], [], [], []], s;
  for (s = 0; s < 4; s++) {
    if (s === v.turn && !(v.to === v.dummy && v.turn === v.declarer)) hands[s] = v.hand.slice();
  }
  hands[v.to] = myHand.slice();
  if (v.turn === v.declarer) hands[v.declarer] = v.hand.slice();
  if (v.dummyHand) hands[v.dummy] = v.dummyHand.slice();
  if (dl) for (s in dl) hands[s] = dl[s].slice();
  else for (s = 0; s < 4; s++) if (!hands[s].length && v.counts[s]) { /* bilinmiyor */ }
  return {
    hands: hands, trick: v.trick.map(function (x) { return { s: x.s, c: x.c }; }), to: v.to, trump: trump,
    declSide: v.contract.side, played: info.played.slice(), won: [0, 0], pSuit: null, dummySuits: null
  };
}

function openingLead(v, h, trump) {
  var L = [[], [], [], []], s, i;
  h.forEach(function (c) { L[suit(c)].push(c); });
  var nt = trump < 0, best = null, bs = -1e9;
  for (s = 0; s < 4; s++) {
    var cs = L[s].slice().sort(function (a, b) { return rv(b) - rv(a); }), n = cs.length;
    if (!n) continue;
    var top = rv(cs[0]), score = 0, cand = cs[n - 1];
    var seq = n >= 3 && top >= 11 && rv(cs[1]) === top - 1 && rv(cs[2]) >= top - 2;
    var ak = n >= 2 && top === 14 && rv(cs[1]) === 13;
    if (s === trump) { score = -30; cand = n >= 4 ? cs[3] : cs[n - 1]; }
    else if (seq) { score = 60 + top; cand = cs[0]; }
    else if (ak) { score = nt ? 50 : 70; cand = cs[0]; }
    else if (nt) {
      score = n * 6 + (top >= 11 ? 3 : 0);
      cand = n >= 4 ? cs[3] : (n === 3 ? (top >= 12 ? cs[2] : cs[0]) : cs[0]);
      if (n <= 2) score -= 12;
    } else {
      if (n === 1) { score = 40; cand = cs[0]; }
      else if (n === 2 && top < 11) { score = 25; cand = cs[0]; }
      else if (top === 14 && n >= 3) { score = 10; cand = cs[2]; }
      else if (top >= 12 && n >= 3) { score = -5 - 0; cand = cs[n - 1]; }
      else { score = 14 + n; cand = n >= 4 ? cs[3] : (n === 3 ? cs[0] : cs[0]); }
    }
    if (score > bs) { bs = score; best = cand; }
  }
  return best === null ? h[0] : best;
}

/* Yürütücü: görünümden eylem üret */
P.act = function (v, level) {
  var c = P.choose(v, level);
  if (c === null || c === undefined) return null;
  return { t: 'play', c: c };
};

if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
