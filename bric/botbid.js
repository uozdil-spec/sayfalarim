/* Briç bilgisayar oyuncusu: ihale. Doğal sistem, puan sayımı, Stayman, Blackwood, kontra, rekabet.
   Yalnızca "görünüm" (view) kullanır: kendi eli + ihale. Böylece ipucu da aynı kodla çalışır. */
(function (root) {
'use strict';
var BR = root.BR || require('./kscore.js');
var B = BR.Bridge || require('./rules.js');
var rank = BR.rank, suit = BR.suit, rv = B.rv;
var D = BR.bid = {};
var C = 0, Di = 1, H = 2, S = 3, NT = 4;

function lvl(v) { return Math.floor(v / 5); }
function den(v) { return v % 5; }
function val(l, d) { return l * 5 + d; }

/* ---------- El özellikleri ---------- */
function feat(h) {
  var L = [0, 0, 0, 0], hc = 0, i, c, r;
  for (i = 0; i < h.length; i++) { c = h[i]; L[B.SUIT2DEN[suit(c)]]++; r = rv(c); if (r >= 11) hc += r - 10; }
  var dp = 0; for (i = 0; i < 4; i++) dp += L[i] === 0 ? 3 : L[i] === 1 ? 2 : L[i] === 2 ? 1 : 0;
  var s = L.slice().sort(function (a, b) { return b - a; }).join('');
  return { hcp: hc, L: L, dp: dp, bal: s === '4333' || s === '4432' || s === '5332', hand: h };
}
function sc(h, d) {                                   // bir takımın kâğıtları, büyükten küçüğe (rv)
  var out = [], i;
  for (i = 0; i < h.length; i++) if (suit(h[i]) === B.DEN2SUIT[d]) out.push(rv(h[i]));
  return out.sort(function (a, b) { return b - a; });
}
function honors(F, d) { var c = sc(F.hand, d), n = 0, i; for (i = 0; i < c.length; i++) if (c[i] >= 12) n++; return n; }
function goodSuit(F, d) { var n = F.L[d]; return n >= 6 || (n >= 5 && honors(F, d) >= 2) || (n >= 4 && honors(F, d) >= 2 && sc(F.hand, d)[0] === 14); }
function stopper(F, d) {
  var c = sc(F.hand, d), n = c.length;
  if (!n) return false;
  return c[0] === 14 || (c[0] === 13 && n >= 2) || (c[0] === 12 && n >= 3) || (c[0] === 11 && n >= 4) || n >= 6;
}
function bestSuit(F, minLen, only) {                  // en uzun (eşitse daha güçlü, sonra daha yüksek) takım
  var best = -1, d, i;
  for (i = 3; i >= 0; i--) {
    d = i;
    if (only && only.indexOf(d) < 0) continue;
    if (F.L[d] < minLen) continue;
    if (best < 0 || F.L[d] > F.L[best] || (F.L[d] === F.L[best] && honors(F, d) > honors(F, best))) best = d;
  }
  return best;
}

/* ---------- İhale çözümleme ---------- */
function parse(v) {
  var au = v.auction, me = v.turn, A = { me: me, pa: (me + 2) % 4, au: au, bids: [[], [], [], []], opener: -1, nb: 0, last: 0, lastBy: -1, dbl: 0, pos: au.length };
  var i, e;
  for (i = 0; i < au.length; i++) {
    e = au[i];
    if (typeof e.b === 'number') { A.bids[e.s].push(e.b); A.nb++; A.last = e.b; A.lastBy = e.s; if (A.opener < 0) A.opener = e.s; A.dbl = 0; }
    else if (e.b === 'X') A.dbl = 1; else if (e.b === 'R') A.dbl = 2;
  }
  A.my = A.bids[me]; A.pb = A.bids[A.pa]; A.lho = A.bids[(me + 1) % 4]; A.rho = A.bids[(me + 3) % 4];
  A.opp = A.lho.concat(A.rho);
  A.oppSuits = []; A.opp.forEach(function (b) { if (den(b) < 4 && A.oppSuits.indexOf(den(b)) < 0) A.oppSuits.push(den(b)); });
  A.mySuits = []; A.my.forEach(function (b) { if (den(b) < 4 && A.mySuits.indexOf(den(b)) < 0) A.mySuits.push(den(b)); });
  A.lastOpp = A.lastBy >= 0 && A.lastBy % 2 !== me % 2;
  A.dblBy = -1; if (A.dbl) for (i = au.length - 1; i >= 0; i--) if (au[i].b === 'X' || au[i].b === 'R') { A.dblBy = au[i].s; break; }
  A.pDoubled = false;                                // ortağım ilk çağrısında kontra mı yaptı?
  for (i = 0; i < au.length; i++) if (au[i].s === A.pa) { A.pDoubled = au[i].b === 'X' && A.opener >= 0 && A.opener % 2 !== me % 2 && !A.pb.length; break; }
  return A;
}
function minBid(A, d) {                                // bir takımda en düşük geçerli ihale
  var l = A.last ? lvl(A.last) + (den(A.last) < d ? 0 : 1) : 1;
  if (l > 7) return null;
  return val(l, d);
}
function bidAt(A, d, level) { var v = val(level, d); return (v > A.last && level <= 7) ? v : null; }

/* ---------- Ortağın gücü / dağılımı tahmini ---------- */
function pEst(A) {
  var r = { lo: 0, hi: 11, mid: 5.5, lens: [0, 0, 0, 0], nt: false, bal: false, forcing: false, stayman: false };
  var pb = A.pb, mb = A.my;
  if (!pb.length) { if (A.pDoubled) { r.lo = 12; r.hi = 20; r.mid = 14; r.lens = [3, 3, 3, 3]; } return r; }
  var f = pb[0], fl = lvl(f), fd = den(f), l = pb[pb.length - 1], ll = lvl(l), ld = den(l);
  function set(lo, hi, mid) { r.lo = lo; r.hi = hi; r.mid = mid === undefined ? (lo + hi) / 2 : mid; }
  if (A.opener === A.pa) {                              // ortak açtı
    if (fd === 4) { r.nt = true; r.bal = true; if (fl === 1) set(15, 17); else if (fl === 2) set(20, 21); else set(22, 24); }
    else if (fl === 1) { set(11, 21, 14); r.lens[fd] = fd >= 2 ? 5 : (fd === 1 ? 4 : 3); }
    else if (fl === 2 && fd >= 1) { set(5, 10); r.lens[fd] = 6; }
    else if (fl === 2) { set(20, 30, 23); r.lens[0] = 5; }
    else { set(4, 10); r.lens[fd] = Math.min(8, fl + 4); }
    if (pb.length > 1) {                                // açanın sonraki ihaleleri
      if (ld === 4) { r.nt = true; r.bal = true; if (ll === 1) set(12, 14); else if (ll === 2) set(18, 19); else set(19, 21); }
      else if (ld === fd) { r.lens[fd] = Math.max(r.lens[fd], 6); if (ll === fl + 1) set(12, 15); else set(16, 18); }
      else if (A.mySuits.indexOf(ld) >= 0) { r.lens[ld] = Math.max(r.lens[ld], 3); if (ll <= 2) set(12, 15); else if (ll === 3) set(16, 18); else set(19, 21); }
      else { r.lens[ld] = Math.max(r.lens[ld], 4); set(12, 21, 15); }
    }
  } else if (A.opener === A.me) {                       // ben açtım, ortak yanıtladı
    var mo = mb[0], ml = lvl(mo), md = den(mo);
    if (md === 4) {
      if (fd === 0 && fl === 2) { set(8, 20, 10); r.stayman = true; }
      else if (fd === 4) { r.nt = true; r.bal = true; if (fl === 2) set(8, 9); else if (fl === 3) set(10, 14); else set(15, 20); }
      else if (fl === 2) { set(0, 7); r.lens[fd] = 5; }
      else if (fl === 3) { set(10, 15); r.lens[fd] = 6; }
      else { set(10, 15); r.lens[fd] = 6; }
    } else {
      if (fd === 4) { r.nt = true; if (fl === 1) set(6, 9); else if (fl === 2) set(11, 12); else if (fl === 3) set(13, 15); else set(16, 22); }
      else if (fd === md) { r.lens[md] = Math.max(3, md >= 2 ? 3 : 5); if (fl === ml + 1) set(6, 9); else if (fl === ml + 2) { set(10, 12); r.lens[md] = 4; } else { set(13, 16); r.lens[md] = 4; } }
      else { r.lens[fd] = 4; r.forcing = true; if (fl === 1) set(6, 17, 10); else if (fl === ml + 1 || (fl === 2 && md > fd && ml === 1)) set(10, 18, 12); else set(16, 22, 18); }
    }
    if (pb.length > 1 && l !== f) {                     // ortağın ikinci ihalesi
      if (ld === 4) { r.nt = true; if (ll === 2) set(Math.max(r.lo, 11), 12); else if (ll === 3) set(Math.max(r.lo, 13), 16); }
      else if (ld === md) { r.lens[md] = Math.max(r.lens[md], 3); if (ll >= 3) set(Math.max(r.lo, 10), 15); }
      else if (ld === fd) { r.lens[fd] = Math.max(r.lens[fd], 6); set(Math.max(r.lo, 6), 11); }
      else { r.lens[ld] = Math.max(r.lens[ld], 4); r.lo = Math.max(r.lo, 10); r.mid = Math.max(r.mid, 12); }
    }
  } else {                                              // rakip açtı; ortak ihale / kontra yaptı
    if (fd === 4) { set(15, 18); r.nt = true; r.bal = true; }
    else if (fl === 1) { set(8, 16, 11); r.lens[fd] = 5; }
    else if (fl === 2) { set(10, 16, 12); r.lens[fd] = 5; }
    else { set(5, 10, 7); r.lens[fd] = fl + 3; }
    if (pb.length > 1 && l !== f) { if (ld === fd) { r.lens[fd] = Math.max(r.lens[fd], 6); } else r.lens[ld] = Math.max(r.lens[ld], 4); }
  }
  return r;
}

/* ---------- Açılış ---------- */
function open(A, F, lvlName) {
  var hc = F.hcp, L = F.L, pos = A.pos, sorted = L.slice().sort(function (a, b) { return b - a; });
  var r20 = hc + sorted[0] + sorted[1];
  var strong = lvlName === 'easy' ? 13 : 12;
  var ok = hc >= strong || (lvlName !== 'easy' && hc >= 10 && ((pos < 3 && r20 >= 20) || (pos === 3 && hc + L[S] >= 15) || (pos === 2 && r20 >= 19)));
  var d, i;
  // engelleyici açılışlar
  for (d = 3; d >= 0; d--) if (L[d] >= 7 && hc >= 5 && hc <= 10 && lvlName !== 'easy' && honors(F, d) >= 1) {
    var lv = L[d] >= 8 ? (d >= 2 ? 4 : 5) : 3;
    if (L[d] === 7 && d >= 2 && hc <= 9 && pos < 3) return val(3, d);
    if (L[d] >= 8 && d >= 2) return val(4, d);
    if (L[d] === 7 && d < 2 && pos < 3) return val(3, d);
  }
  if (!ok || hc > 40) {
    for (d = 3; d >= 1; d--) if (L[d] === 6 && hc >= 6 && hc <= 10 && honors(F, d) >= 2 && pos < 3 && lvlName !== 'easy') return val(2, d);
    return 'P';
  }
  if (F.bal) {
    if (hc >= 15 && hc <= 17) return val(1, NT);
    if (hc >= 20 && hc <= 21) return val(2, NT);
    if (hc >= 22 && hc <= 26) return val(3, NT);
    if (hc >= 27) return val(6, NT);
  }
  if (hc >= 22 && lvlName !== 'easy') { d = bestSuit(F, 5); if (d >= 2) return val(4, d); }
  // takım seçimi
  var m = -1;
  if (L[S] >= 5 && L[H] >= 5) m = S; else if (L[S] >= 5 && L[S] >= L[H]) m = S; else if (L[H] >= 5) m = H;
  if (m >= 0) return val(1, m);
  if (L[Di] > L[C]) return val(1, Di);
  if (L[C] > L[Di]) return val(1, C);
  return L[Di] >= 4 ? val(1, Di) : val(1, C);
}

/* ---------- Yanıt (ortak açtı) ---------- */
function respond(A, F, lvlName) {
  var o = A.pb[0], ol = lvl(o), od = den(o), hc = F.hcp, L = F.L, d, v, pe = pEst(A);
  if (od === 4) return respondNT(A, F);
  // engelleyici açılışa yanıt
  if (ol >= 3 || (ol === 2 && od >= 1)) {
    var n = L[od];
    if (hc >= 15 && n >= 3 && od >= 2) return bidAt(A, od, 4) || 'P';
    if (hc >= 16 && F.bal && lvlName !== 'easy') return bidAt(A, NT, 3) || 'P';
    return 'P';
  }
  var fit = od >= 2 ? L[od] >= 3 : L[od] >= 5;
  var pts = hc + (fit ? shortPts(F, od) : 0) + (L[bestSuit(F, 5) < 0 ? 0 : bestSuit(F, 5)] >= 6 ? 1 : 0);
  if (pts < 6) return 'P';
  var cand;
  if (od >= 2 && L[od] >= 3) {                           // majör uyumu
    if (pts >= 13 && L[od] >= 4) { cand = bidAt(A, od, pts >= 17 ? 4 : 4); if (cand) return cand; }
    if (pts >= 10 && L[od] >= 4) { cand = bidAt(A, od, 3); if (cand) return cand; }
    if (pts <= 9 || L[od] === 3) {
      if (pts >= 10 && L[od] === 3) { /* üç kâğıt, güçlü: yeni takım ya da sans arar */ }
      else { cand = bidAt(A, od, 2); if (cand) return cand; if (pts >= 8) { cand = bidAt(A, od, 3); if (cand && pts >= 9) return cand; } }
    }
  }
  if (od < 2 && L[od] >= 5 && !(L[H] >= 4 || L[S] >= 4)) {            // minör uyumu
    if (pts >= 10) { cand = bidAt(A, od, 3); if (cand) return cand; }
    if (pts <= 9) { cand = bidAt(A, od, 2); if (cand) return cand; }
  }
  // yeni takım: ucuz olanı
  var order = L[H] >= 4 && L[S] >= 4 && L[H] === L[S] ? [H, S, Di, C] : [S, H, Di, C];
  var best = -1, bestL = 0, i;
  for (i = 0; i < 4; i++) {
    d = order[i]; if (d === od || L[d] < 4) continue;
    v = minBid(A, d); if (!v) continue;
    if (L[d] > bestL || (L[d] === bestL && lvl(v) < lvl(minBid(A, best)))) { best = d; bestL = L[d]; }
  }
  var ownLong = bestSuit(F, 5);
  if (pts >= 13) {                                       // oyun zorlama
    if (best >= 0) { v = minBid(A, best); if (v && lvl(v) <= 3) return v; }
    if (F.bal) { cand = bidAt(A, NT, 3); if (cand) return cand; }
    if (ownLong >= 0) { v = minBid(A, ownLong); if (v) return v; }
    return bidAt(A, NT, 3) || 'P';
  }
  if (pts >= 10) {
    if (best >= 0) { v = minBid(A, best); if (v && lvl(v) <= 2 && (L[best] >= 5 || lvl(v) === 1 || L[best] >= 4)) return v; }
    if (F.bal && (hc >= 11 || pts >= 11)) { cand = bidAt(A, NT, 2); if (cand) return cand; }
    if (od < 2 && L[od] >= 4) { cand = bidAt(A, od, 3); if (cand) return cand; }
    if (best >= 0) { v = minBid(A, best); if (v && lvl(v) <= 2) return v; }
    return bidAt(A, NT, 2) || 'P';
  }
  // 6-9
  if (best >= 0) { v = minBid(A, best); if (v && lvl(v) === 1) return v; }
  cand = bidAt(A, NT, 1); if (cand) return cand;
  if (best >= 0 && L[best] >= 5 && hc >= 8) { v = minBid(A, best); if (v && lvl(v) <= 2) return v; }
  return 'P';
}
function shortPts(F, trump) { var p = 0, i; for (i = 0; i < 4; i++) if (i !== trump) p += F.L[i] === 0 ? 3 : F.L[i] === 1 ? 2 : F.L[i] === 2 ? 1 : 0; return F.L[trump] >= 4 ? p : Math.min(p, 2); }

function respondNT(A, F) {
  var hc = F.hcp, L = F.L, ol = lvl(A.pb[0]), cand, d;
  if (ol === 2) { if (hc >= 5) return bidAt(A, NT, 3) || 'P'; return 'P'; }
  if (ol >= 3) return 'P';
  if (A.last > A.pb[0] && A.lastOpp) return 'P';
  var m4 = L[H] >= 4 || L[S] >= 4;
  if (hc >= 17) return bidAt(A, NT, 6) || bidAt(A, NT, 3) || 'P';
  for (d = 3; d >= 2; d--) if (L[d] >= 6 && hc >= 8) { cand = bidAt(A, d, hc >= 10 ? 4 : 3); if (cand) return cand; }
  if (hc >= 8 && m4) { cand = bidAt(A, C, 2); if (cand) return cand; }          // Stayman
  if (hc >= 10) return bidAt(A, NT, 3) || 'P';
  if (hc >= 8) return bidAt(A, NT, 2) || 'P';
  return 'P';
}

/* ---------- Açanın ikinci hamlesi ve genel hedef mantığı ---------- */
function stayAnswer(A, F) {
  var L = F.L;
  if (L[H] >= 4) return bidAt(A, H, 2); if (L[S] >= 4) return bidAt(A, S, 2);
  return bidAt(A, Di, 2);
}
function cheapBid(A, F) {                               // zorlayıcı ihaleyi geçmemek için en doğal ucuz ihale
  var pe = pEst(A), d, v, i, rs = -1;
  for (i = 0; i < 4; i++) if (pe.lens[i] >= 4 && A.pb.length && den(A.pb[A.pb.length - 1]) === i) rs = i;
  if (rs >= 0 && F.L[rs] >= 4) { v = minBid(A, rs); if (v && lvl(v) <= 3) return v; }
  var order = [S, H, Di, C];
  for (i = 0; i < 4; i++) { d = order[i]; if (A.my.length && den(A.my[0]) === d) continue; if (A.pb.length && den(A.pb[0]) === d) continue; if (F.L[d] >= 4) { v = minBid(A, d); if (v && lvl(v) <= 2) return v; } }
  if (A.my.length) { d = den(A.my[0]); if (d < 4 && F.L[d] >= 6) { v = minBid(A, d); if (v && lvl(v) <= 3) return v; } }
  v = minBid(A, NT); if (v && lvl(v) <= 2 && F.bal) return v;
  d = bestSuit(F, 1); v = minBid(A, d < 0 ? C : d); if (v && lvl(v) <= 3) return v;
  return 'P';
}

function later(A, F, lvlName) {
  var pe = pEst(A), hc = F.hcp, L = F.L, i, d, tot;
  // Stayman yanıtı ve Blackwood
  if (A.my.length && den(A.my[0]) === NT && lvl(A.my[0]) === 1 && pe.stayman && A.my.length === 1 && A.opener === A.me) return stayAnswer(A, F) || 'P';
  var pLast = A.pb.length ? A.pb[A.pb.length - 1] : 0;
  if (pLast === 24 && A.last >= 24 && A.lastBy === A.pa && lvlName !== 'easy' && (A.my.length && A.mySuits.length || A.pb.length > 1 || A.mySuits.length)) return aceAnswer(A, F);
  // ortak 2NT (davet) 1NT'ye
  var fitD = -1, fitN = 0;
  for (d = 3; d >= 0; d--) {
    var n = pe.lens[d] + F.L[d];
    var okFit = pe.lens[d] >= 4 ? F.L[d] >= 3 : (pe.lens[d] >= 3 && F.L[d] >= 5);
    if (okFit && n >= 8 && (n > fitN || (n === fitN && d > fitD && (d >= 2 || fitD < 2)))) { fitD = d; fitN = n; }
  }
  if (A.my.length && !pe.stayman) {                    // kendi uzun takımıma ortağın desteği
    for (i = 0; i < A.mySuits.length; i++) { d = A.mySuits[i]; if (F.L[d] >= 5 && pe.lens[d] >= 2 && F.L[d] + Math.max(3, pe.lens[d]) >= 8 && pe.lens[d] >= 3 && F.L[d] + pe.lens[d] > fitN) { fitD = d; fitN = F.L[d] + pe.lens[d]; } }
  }
  var dpPts = fitD >= 0 ? shortPts(F, fitD) : 0;
  tot = hc + dpPts + pe.mid;
  if (fitD >= 0 && pe.stayman === false && false) tot += 0;
  var needMaj = 25, needMin = 28, needNT = 25;
  var ntOK = (F.bal || pe.nt || pe.bal) && A.oppSuits.every(function (s) { return stopper(F, s) || pe.nt; });
  var target = null, tlevel = 0;
  var gameDen = -1;
  if (fitD >= 2 && tot >= needMaj) { gameDen = fitD; target = { d: fitD, l: tot >= 33 ? 6 : 4 }; }
  else if (ntOK && tot >= needNT && (fitD < 2 || tot >= needNT + 1) && (fitD < 0 || fitD < 2)) target = { d: NT, l: tot >= 34 ? 6 : 3 };
  else if (fitD >= 0 && fitD < 2 && tot >= needMin) target = { d: fitD, l: 5 };
  else if (fitD < 0 && tot >= needNT && A.my.length && !ntOK) { var ls = bestSuit(F, 6); if (ls >= 2 && tot >= 26) target = { d: ls, l: 4 }; }
  // slam araştırması (Blackwood)
  if (target && target.l === 6 && target.d < 4 && lvlName !== 'easy' && A.last < 24 && !hasBid(A.my, 24) && fitD >= 0) {
    var bw = bidAt(A, NT, 4); if (bw) return bw;
  }
  if (target && target.l === 6 && target.d === 4) target.l = tot >= 34 ? 6 : 3;
  if (target && target.l === 6 && target.d < 4) target.l = 4;           // Blackwood yapılamadıysa oyun ihalesi
  // davet / kısmi
  if (!target) {
    var base = fitD >= 0 ? fitD : (pe.nt || F.bal ? NT : bestSuit(F, 5));
    var lv;
    if (fitD >= 0) {
      lv = Math.max(1, fitN - 6);
      if (tot < 22) lv = Math.min(lv, 2); if (tot < 20) lv = Math.min(lv, 1);
      if (tot >= 23 && tot < 25 && fitN >= 8 && fitD >= 2) { lv = Math.max(lv, 3); }
      if (tot >= 23 && tot < 28 && fitD < 2) lv = Math.max(lv, 3);
      target = { d: fitD, l: Math.min(lv, 3) };
    } else if (base === NT) {
      lv = tot >= 23 ? 2 : (tot >= 20 ? 1 : 0);
      if (lv && ntOK) target = { d: NT, l: lv };
    } else if (base >= 0) {
      lv = tot >= 24 ? 3 : (tot >= 21 ? 2 : 1);
      if (F.L[base] >= 6) target = { d: base, l: Math.min(lv, 3) };
    }
  }
  var cur = A.last ? A.last : 0, curBy = A.lastBy;
  // hedefe göre karar
  var call = 'P';
  if (target) {
    var tv = val(target.l, target.d);
    if (cur >= tv && curBy % 2 === A.me % 2 && A.lastBy >= 0) call = 'P';                      // taraf zaten hedefte
    else if (cur >= tv) call = 'P';
    else if (curBy >= 0 && curBy % 2 === A.me % 2 && cur >= val(target.l, target.d) - 4 && target.l <= 3 && !(target.l >= 4)) call = (cur >= val(target.l, NT) - 0 ? 'P' : 'P');
    else {
      var step;
      if (target.l >= 4) step = tv;                                                                     // oyun: doğrudan
      else step = minBid(A, target.d);
      if (step && step <= tv) call = step; else call = 'P';
      // ortağın son ihalesi zaten kabul edilebilir kısmi ise geç
      if (call !== 'P' && curBy === A.pa && target.l <= 3 && cur >= minBid(A, target.d) - 5 && den(cur) === target.d && lvl(cur) >= target.l - 0 && false) call = 'P';
    }
  }
  // zorlayıcı ihaleyi geçme
  if (call === 'P' && pe.forcing && A.opener === A.me && A.lastBy === A.pa && A.my.length === 1) { var cb = cheapBid(A, F); if (cb !== 'P') call = cb; }
  if (call === 'P' && A.opener === A.pa && A.my.length === 0 && A.pb.length === 1 && false) call = 'P';
  // rakip yarışıyorsa: kontra ya da yarış
  if (A.lastOpp && call === 'P') { var xx = maybeDouble(A, F, pe, tot); if (xx) call = xx; }
  if (A.lastOpp && call === 'P' && fitD >= 0 && lvlName !== 'easy') {                // Toplam Kozlar Kanunu: uyum varsa yarış
    var lv2 = Math.min(fitN - 6, tot >= 22 ? 4 : 3); var cb2 = minBid(A, fitD);
    if (cb2 && lvl(cb2) <= lv2 && (A.my.length < 4)) call = cb2;
  }
  return call;
}
function hasBid(arr, v) { return arr.indexOf(v) >= 0; }
function aceAnswer(A, F) {                                // Blackwood yanıtı
  var a = 0, i, c = F.hand;
  for (i = 0; i < c.length; i++) if (rank(c[i]) === 1) a++;
  var v = a === 0 || a === 4 ? 25 : (a === 1 ? 26 : (a === 2 ? 27 : 28));
  return v > A.last ? v : 'P';
}
function maybeDouble(A, F, pe, tot) {
  if (A.dbl) return null;
  var l = lvl(A.last), d = den(A.last);
  if (A.lastBy % 2 === A.me % 2) return null;
  var fitTrump = d < 4 ? F.L[d] : 0;
  if (l >= 3 && d < 4 && fitTrump >= 3 && tot >= 23 && F.hcp >= 6 && honors(F, d) >= 1 && (fitTrump >= 4 || F.hcp >= 10)) return 'X';
  if (l >= 4 && tot >= 24 && d < 4 && fitTrump >= 3) return 'X';
  if (l >= 5 && tot >= 22 && fitTrump >= 2) return 'X';
  if (d === 4 && l >= 3 && F.hcp >= 14 && tot >= 27) return 'X';
  if (A.last >= 35 && tot >= 20) return 'X';
  return null;
}

/* ---------- Rakip açtı: araya girme / kontra / yanıt ---------- */
function overcall(A, F, lvlName) {
  var hc = F.hcp, L = F.L, d, v, o = A.last, ol = lvl(o), od = den(o);
  if (lvlName === 'easy' && hc < 11) return 'P';
  if (A.dbl === 0 && A.pb.length === 0 && false) return 'P';
  if (ol >= 4) return 'P';
  if (od === 4) {                                       // sans açılışına karşı
    if (hc >= 16 && ol === 1 && F.bal) { v = bidAt(A, NT, 2); if (v) return v; }
    return 'P';
  }
  var shortOpp = L[od] <= 2, support = true, i;
  for (i = 0; i < 4; i++) if (i !== od && L[i] < 3) support = false;
  if (hc >= 12 && shortOpp && support && ol <= 2 && A.lastBy !== A.pa) { if (L[od] <= 1 || hc >= 13) return 'X'; }
  if (hc >= 15 && hc <= 18 && F.bal && stopper(F, od) && ol === 1) { v = bidAt(A, NT, 1); if (v) return v; }
  var best = -1, bl = 0;
  for (i = 3; i >= 0; i--) {
    if (i === od || L[i] < 5) continue;
    v = minBid(A, i); if (!v) continue;
    var need = lvl(v) === 1 ? 8 : (lvl(v) === 2 ? 11 : 15);
    if (hc < need) continue;
    if (!(goodSuit(F, i) || L[i] >= 6)) continue;
    if (L[i] > bl) { best = i; bl = L[i]; }
  }
  if (best >= 0 && hc <= 17) return minBid(A, best);
  if (hc >= 18 && best >= 0) return minBid(A, best);
  return 'P';
}
function advance(A, F, pe, lvlName) {
  var hc = F.hcp, L = F.L, i, d, v, oppD = A.oppSuits.length ? A.oppSuits[A.oppSuits.length - 1] : -1;
  var pl = A.pb[A.pb.length - 1];
  if (A.pDoubled && !A.pb.length) {                      // ortağım takeout kontra yaptı
    var o = A.last; // rakibin son ihalesi (ya da araya giren)
    var od = A.opp.length ? den(A.opp[A.opp.length - 1]) : -1;
    if (od >= 0 && od < 4 && L[od] >= 5 && sc(F.hand, od)[0] >= 12 && hc >= 6 && lvl(A.last) <= 3) return 'P';
    var best = -1, bl = 0;
    for (i = 3; i >= 0; i--) { if (A.oppSuits.indexOf(i) >= 0) continue; if (L[i] > bl || (L[i] === bl && i >= 2 && best < 2)) { best = i; bl = L[i]; } }
    if (hc >= 6 && F.bal && A.oppSuits.every(function (s) { return stopper(F, s); }) && !(L[H] >= 4 || L[S] >= 4)) { v = hc >= 11 ? minBid(A, NT) : null; if (v && lvl(v) <= 3 && hc >= 10) return v; if (hc >= 8 && (v = minBid(A, NT)) && lvl(v) <= 2) return v; }
    if (best >= 0) {
      v = minBid(A, best);
      if (v) {
        if (hc >= 13 && bl >= 5 && best >= 2) { var g = bidAt(A, best, 4); if (g) return g; }
        if (hc >= 10) { var j = v + 5; if (j <= 39 && lvl(j) <= 3 && bl >= 4) return j; }
        if (lvl(v) <= 3) return v;
      }
    }
    return 'P';
  }
  // ortak araya girdi
  var pd = den(pl), pe2 = pe, mine = L[pd] >= 3 && pd < 4;
  if (pd === 4) { return later(A, F, lvlName); }
  var pts = hc + (mine ? shortPts(F, pd) : 0);
  if (mine) {
    if (pts >= 13 && L[pd] >= 3 && pd >= 2) { v = bidAt(A, pd, 4); if (v) return v; }
    if (pts >= 10) { v = bidAt(A, pd, 3); if (v && L[pd] >= 3) return v; }
    if (pts >= 6) { v = minBid(A, pd); if (v && lvl(v) <= 2) return v; if (v && lvl(v) === 3 && L[pd] >= 4) return v; }
  }
  if (hc >= 10 && F.bal && A.oppSuits.every(function (s) { return stopper(F, s); })) { v = minBid(A, NT); if (v && lvl(v) <= 3) return v; }
  var ls = bestSuit(F, 5);
  if (ls >= 0 && ls !== pd && hc >= 9) { v = minBid(A, ls); if (v && lvl(v) <= 2) return v; }
  if (A.lastOpp && mine && pts >= 5) { var lv = Math.min(L[pd] + pe2.lens[pd] - 6, 3); v = minBid(A, pd); if (v && lvl(v) <= lv) return v; }
  return 'P';
}

/* ---------- Ana giriş ---------- */
D.choose = function (v, level) {
  level = level || 'medium';
  var A = parse(v), F = feat(v.hand), me = v.turn, call = 'P';
  try {
    if (A.my.length >= 6) call = 'P';
    else if (A.nb === 0) call = open(A, F, level);
    else if (A.opener === A.me) call = rebidOrLater(A, F, level);
    else if (A.opener === A.pa && A.my.length === 0) call = respond(A, F, level);
    else if (A.opener === A.pa) call = later(A, F, level);
    else {                                                 // rakip açtı
      var pe = pEst(A);
      if (A.my.length === 0 && (A.pb.length === 0 && !A.pDoubled)) call = overcall(A, F, level);
      else if (A.my.length === 0) call = advance(A, F, pe, level);
      else call = later(A, F, level);
      if (call === 'P' && A.opener % 2 !== me % 2 && A.my.length === 0 && A.pb.length === 0 && !A.pDoubled && A.pos >= 2) call = call;
    }
  } catch (e) { call = 'P'; }
  if (call === 'X' || call === 'R' || typeof call === 'number') { if (!B.callLegal(v.auction, call, me)) call = 'P'; }
  else call = 'P';
  if (level === 'easy' && call !== 'P' && BR.rnd() < 0.12) call = 'P';
  return call;
};
function rebidOrLater(A, F, lvlName) {
  if (A.pb.length === 0) {                               // ortak pas geçti ya da kontra yaptı: oyun bitmiş olabilir
    if (A.lastOpp && A.last > A.my[A.my.length - 1]) { var pe0 = pEst(A); return later(A, F, lvlName); }
    return 'P';
  }
  return later(A, F, lvlName);
}

D.explain = function (b) { return B.bidText(b); };
if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
