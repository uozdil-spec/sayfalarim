/* Domino · kurallar motoru ve yapay zekâ  (by uozdil)
   Çift-6 takımı: 28 taş. Çekmeli ve Blok (çekmesiz) oyun; 2-4 oyuncu; 4 kişide isteğe bağlı ortaklı. */
(function (root) {
'use strict';
var DM = root.DM = root.DM || {};

/* ---- taşlar: id 0..27, [a,b] a<=b ---- */
var TILES = [], i, j;
for (i = 0; i <= 6; i++) for (j = i; j <= 6; j++) TILES.push([i, j]);
DM.TILES = TILES;
DM.pips = function (id) { return TILES[id][0] + TILES[id][1]; };
DM.isDouble = function (id) { return TILES[id][0] === TILES[id][1]; };
DM.tileName = function (id) { return TILES[id][0] + '-' + TILES[id][1]; };

function shuffle(a) { for (var k = a.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)), t = a[k]; a[k] = a[r]; a[r] = t; } return a; }
DM.shuffle = shuffle;

/* ---- oyun ayarı ----
   cfg: {n:2-4, variant:'cek'|'blok', team:bool, target:0|50|100|150|200|300, free:bool}
   state: {n, cfg, hands:[[ids]], yard:[ids], chain:[{id,a,b,side}] (soldan sağa), ends:[l,r]|null,
           turn, passes, over, winner, log, scores:[...], lack:[set per seat], first}
*/
DM.handSize = function (n, variant) { return n === 2 ? 7 : (variant === 'blok' ? 7 : 5); };
DM.teamOf = function (seat, cfg) { return cfg.team && cfg.n === 4 ? seat % 2 : seat; };

DM.deal = function (cfg, starter, round, prev) {
  var ids = []; for (var k = 0; k < 28; k++) ids.push(k);
  var hs = DM.handSize(cfg.n, cfg.variant), hands = [], d;
  var tries = 0;
  do {
    shuffle(ids); hands = []; d = 0;
    for (var s = 0; s < cfg.n; s++) { hands.push(ids.slice(d, d + hs).sort(function (x, y) { return x - y; })); d += hs; }
    tries++;
    /* 5'ten fazla çift taşı olan el yeniden dağıtılır */
  } while (tries < 30 && hands.some(function (h) { return h.filter(DM.isDouble).length >= 5; }));
  var yard = cfg.variant === 'cek' ? ids.slice(d) : [];
  var st = { n: cfg.n, cfg: cfg, hands: hands, yard: yard, chain: [], ends: null, turn: 0, passes: 0, over: false, result: null,
    log: [], lack: [], round: round || 1, openTile: -1, lastMove: null, moves: 0 };
  for (var q = 0; q < cfg.n; q++) st.lack.push({});
  /* kim başlar: en büyük çift; çift yoksa en büyük taş */
  if (starter == null || starter < 0) {
    var bid = -1, bseat = 0, bsc = -1, s2, h, id, sc;
    for (s2 = 0; s2 < cfg.n; s2++) for (h = 0; h < hands[s2].length; h++) {
      id = hands[s2][h];
      sc = DM.isDouble(id) ? 100 + TILES[id][0] : DM.pips(id) * 2 + Math.max(TILES[id][0], TILES[id][1]) / 10;
      if (sc > bsc) { bsc = sc; bid = id; bseat = s2; }
    }
    st.turn = bseat; st.openTile = bid;
  } else { st.turn = starter; st.openTile = -1; }
  return st;
};

/* oynanabilir hamleler: [{id, end:'L'|'R'|'C'}] ; boş zincirde end='C' */
DM.moves = function (st, seat) {
  var h = st.hands[seat], out = [], k, id, t;
  if (!st.chain.length) {
    if (st.openTile >= 0 && h.indexOf(st.openTile) >= 0) return [{ id: st.openTile, end: 'C' }];
    for (k = 0; k < h.length; k++) out.push({ id: h[k], end: 'C' });
    return out;
  }
  var L = st.ends[0], R = st.ends[1];
  for (k = 0; k < h.length; k++) {
    id = h[k]; t = TILES[id];
    var l = (t[0] === L || t[1] === L), r = (t[0] === R || t[1] === R);
    if (l) out.push({ id: id, end: 'L' });
    if (r && !(l && L === R && false)) out.push({ id: id, end: 'R' });
  }
  return out;
};
DM.canPlay = function (st, seat) { return DM.moves(st, seat).length > 0; };

/* hamleyi uygula (doğruluk denetimi yapılır). Döner: {ok, ...} */
DM.play = function (st, seat, id, end) {
  if (st.over || st.turn !== seat) return { ok: false };
  var h = st.hands[seat], idx = h.indexOf(id);
  if (idx < 0) return { ok: false };
  var legal = DM.moves(st, seat).filter(function (m) { return m.id === id && m.end === end; });
  if (!legal.length) return { ok: false };
  var t = TILES[id], entry;
  h.splice(idx, 1);
  if (!st.chain.length) {
    entry = { id: id, a: t[0], b: t[1], side: 'C', seat: seat };
    st.chain.push(entry); st.ends = [t[0], t[1]];
  } else if (end === 'L') {
    var v = st.ends[0], o = t[0] === v ? t[1] : t[0];
    entry = { id: id, a: o, b: v, side: 'L', seat: seat };   // a: dış uç, b: zincire bakan
    st.chain.unshift(entry); st.ends[0] = o;
  } else {
    var v2 = st.ends[1], o2 = t[0] === v2 ? t[1] : t[0];
    entry = { id: id, a: v2, b: o2, side: 'R', seat: seat };  // a: zincire bakan, b: dış uç
    st.chain.push(entry); st.ends[1] = o2;
  }
  st.passes = 0; st.moves++;
  st.lastMove = { seat: seat, id: id, end: end, type: 'play' };
  return { ok: true, entry: entry, out: h.length === 0 };
};

/* çek (yalnızca çekmeli oyun) */
DM.draw = function (st, seat) {
  if (st.over || st.turn !== seat || st.cfg.variant !== 'cek' || !st.yard.length) return { ok: false };
  if (DM.canPlay(st, seat)) return { ok: false };
  var id = st.yard.pop();
  st.hands[seat].push(id); st.hands[seat].sort(function (x, y) { return x - y; });
  if (st.ends) { st.lack[seat][st.ends[0]] = 1; st.lack[seat][st.ends[1]] = 1; }
  st.lastMove = { seat: seat, id: id, type: 'draw' };
  return { ok: true, id: id };
};
/* pas (oynayamıyor ve çekecek taş yok) */
DM.pass = function (st, seat) {
  if (st.over || st.turn !== seat) return { ok: false };
  if (DM.canPlay(st, seat)) return { ok: false };
  if (st.cfg.variant === 'cek' && st.yard.length) return { ok: false };
  st.passes++;
  if (st.ends) { st.lack[seat][st.ends[0]] = 1; st.lack[seat][st.ends[1]] = 1; }
  st.lastMove = { seat: seat, type: 'pass' };
  return { ok: true };
};
DM.nextSeat = function (st) { st.turn = (st.turn + 1) % st.n; return st.turn; };

DM.handPips = function (st, seat) { return st.hands[seat].reduce(function (a, id) { return a + DM.pips(id); }, 0); };

/* el sonu denetimi: {over:true, winner:seat|-1, points, blocked, team} */
DM.checkEnd = function (st) {
  var s, win = -1;
  for (s = 0; s < st.n; s++) if (!st.hands[s].length) { win = s; break; }
  var blocked = false;
  if (win < 0) {
    if (st.passes >= st.n) blocked = true;
    else return null;
  }
  var cfg = st.cfg, pts = 0, tot = [], tt;
  for (s = 0; s < st.n; s++) tot.push(DM.handPips(st, s));
  if (blocked) {
    /* en düşük toplam kazanır; ortaklıda takım toplamı */
    var score = [];
    for (s = 0; s < st.n; s++) {
      if (cfg.team && st.n === 4) score.push(tot[s] + tot[(s + 2) % 4]); else score.push(tot[s]);
    }
    var mn = Math.min.apply(null, score), cnt = score.filter(function (x) { return x === mn; }).length;
    if (cfg.team && st.n === 4) {
      var c0 = score[0] === mn ? 1 : 0, c1 = score[1] === mn ? 1 : 0;
      if (c0 && c1) return { over: true, winner: -1, points: 0, blocked: true, tot: tot };
      win = c0 ? 0 : 1; /* takım temsilcisi koltuk */
      var oth = tot.reduce(function (a, v) { return a + v; }, 0) - (tot[win] + tot[win + 2]);
      pts = oth - (tot[win] + tot[win + 2]); if (pts < 0) pts = 0;
      return { over: true, winner: win, points: pts, blocked: true, tot: tot, team: true };
    }
    if (cnt > 1) return { over: true, winner: -1, points: 0, blocked: true, tot: tot };
    win = score.indexOf(mn);
    var all = tot.reduce(function (a, v) { return a + v; }, 0);
    pts = all - tot[win] - tot[win];   /* kalanların toplamı − kendi toplamı */
    if (pts < 0) pts = 0;
    return { over: true, winner: win, points: pts, blocked: true, tot: tot };
  }
  /* elini bitiren */
  if (cfg.team && st.n === 4) {
    pts = tot[(win + 1) % 4] + tot[(win + 3) % 4];
    return { over: true, winner: win, points: pts, blocked: false, tot: tot, team: true };
  }
  for (tt = 0; tt < st.n; tt++) if (tt !== win) pts += tot[tt];
  return { over: true, winner: win, points: pts, blocked: false, tot: tot };
};

/* ---------------- yapay zekâ ---------------- */
function endsAfter(st, m) {
  var t = TILES[m.id];
  if (m.end === 'C') return [t[0], t[1]];
  if (m.end === 'L') { var v = st.ends[0]; return [t[0] === v ? t[1] : t[0], st.ends[1]]; }
  var v2 = st.ends[1]; return [st.ends[0], t[0] === v2 ? t[1] : t[0]];
}
DM.endsAfter = endsAfter;

/* hamleye puan + gerekçe */
DM.scoreMove = function (st, seat, m, level) {
  var t = TILES[m.id], p = t[0] + t[1], h = st.hands[seat], rest = h.filter(function (x) { return x !== m.id; });
  var ne = endsAfter(st, m), score = 0, why = [], k, cnt;
  if (level <= 1) return { s: Math.random(), why: [] };
  score += p * 1.6;
  if (DM.isDouble(m.id)) { score += 4; why.push('çift taşı erken elden çıkar'); }
  if (p >= 9) why.push('ağır taşı elden çıkarır');
  /* kalan elde uç değerlerini destekleyen taş sayısı */
  var sup = 0; for (k = 0; k < 2; k++) { cnt = rest.filter(function (x) { return TILES[x][0] === ne[k] || TILES[x][1] === ne[k]; }).length; sup += cnt; if (cnt === 0) score -= 3; }
  score += sup * 1.7;
  if (sup >= 3) why.push('elinde yeni uçlara uyan taşlar kalır');
  /* rakibin pas geçtiği değerleri aç/kapat */
  var opp = 0, anyBlock = 0;
  for (var s = 0; s < st.n; s++) {
    if (s === seat) continue;
    if (st.cfg.team && st.n === 4 && (s % 2) === (seat % 2)) continue;
    for (k = 0; k < 2; k++) if (st.lack[s][ne[k]]) { opp++; }
  }
  if (opp) { score += opp * 4.5; why.push('rakibin pas geçtiği sayıyı uçlara koyar'); anyBlock = 1; }
  /* ortağın paslarını açmaktan kaçın */
  if (st.cfg.team && st.n === 4) { var pt = (seat + 2) % 4; for (k = 0; k < 2; k++) if (st.lack[pt][ne[k]]) score -= 4; }
  /* aynı sayıyı iki uçta tutmak */
  if (ne[0] === ne[1] && ne[0] !== undefined) { score += 2.5; why.push('iki ucu aynı sayı yapar'); }
  /* kapanma riski: son taşlar */
  if (rest.length === 0) { score += 1000; why = ['elini bitirir']; }
  if (rest.length === 1) { score += 6; why.push('tek taşa düşersin'); }
  /* bu sayının tümünün dışarıda olup olmadığı: tüm 7 taş zincirde ise ucu ölü */
  if (level >= 3) {
    var seen = {}; st.chain.forEach(function (e) { seen[e.a] = (seen[e.a] || 0) + 1; seen[e.b] = (seen[e.b] || 0) + 1; });
    /* elinde ve zincirde sayılan taşlar: bir sayıdan 7 taş (çiftler 2 sayılır) */
    for (k = 0; k < 2; k++) {
      var v = ne[k], used = 0;
      st.chain.forEach(function (e) { if (e.a === v) used++; if (e.b === v) used++; });
      var mine = rest.filter(function (x) { return TILES[x][0] === v || TILES[x][1] === v; }).length;
      var left = 7 - Math.ceil(used / 1) / 1; /* kaba tahmin */
      if (mine >= 3 && used >= 4) { score += 3; why.push(v + ' sayısı sende yoğun; uçta tut'); }
    }
    var oppHand = 0; for (var q = 0; q < st.n; q++) if (q !== seat) oppHand += st.hands[q].length;
    if (st.cfg.variant === 'blok' && st.moves > 8 && sup > 1) score += 2;
  }
  return { s: score, why: why };
};

/* en iyi hamle (level 1 kolay, 2 orta, 3 usta) */
DM.bestMove = function (st, seat, level) {
  var ms = DM.moves(st, seat);
  if (!ms.length) return null;
  if (ms.length === 1) return ms[0];
  var best = null, bs = -1e9, k, r;
  for (k = 0; k < ms.length; k++) {
    r = DM.scoreMove(st, seat, ms[k], level);
    var s = r.s + (level === 2 ? Math.random() * 3 : 0);
    if (s > bs) { bs = s; best = ms[k]; }
  }
  return best;
};

/* ipucu: sıralı alternatifler + açıklamalar */
DM.hintList = function (st, seat) {
  var ms = DM.moves(st, seat), out = [], k, r;
  for (k = 0; k < ms.length; k++) {
    r = DM.scoreMove(st, seat, ms[k], 3);
    var why = r.why.slice(0, 2);
    if (!why.length) why = [DM.pips(ms[k].id) >= 8 ? 'yüksek puanlı taşı elden çıkarır' : 'güvenli bir hamle'];
    out.push({ id: ms[k].id, end: ms[k].end, s: r.s, why: why.join(' · ') });
  }
  out.sort(function (a, b) { return b.s - a.s; });
  return out.slice(0, 3);
};

/* görsel sıralama için özet: kaç puan, kim önde */
DM.scoreText = function (st, sc) { return sc.join(' · '); };

/* ---- durum özeti (online için) ---- */
DM.viewFor = function (st, seat, extra) {
  var v = {
    n: st.n, cfg: st.cfg, hand: st.hands[seat].slice(), counts: st.hands.map(function (h) { return h.length; }),
    yard: st.yard.length, chain: st.chain.map(function (e) { return [e.id, e.a, e.b, e.side, e.seat]; }), ends: st.ends,
    turn: st.turn, over: st.over, round: st.round, openTile: st.openTile, passes: st.passes, last: st.lastMove, lack: st.lack
  };
  if (extra) for (var k in extra) v[k] = extra[k];
  return v;
};
DM.fromView = function (v) {
  var st = { n: v.n, cfg: v.cfg, hands: [], yard: [], chain: [], ends: v.ends, turn: v.turn, passes: v.passes, over: v.over, result: null,
    log: [], lack: v.lack || [], round: v.round, openTile: v.openTile, lastMove: v.last, moves: 0, me: v.me };
  for (var s = 0; s < v.n; s++) st.hands.push([]);
  st.hands[v.me] = v.hand.slice();
  st.counts = v.counts; st.yardN = v.yard;
  st.chain = v.chain.map(function (e) { return { id: e[0], a: e[1], b: e[2], side: e[3], seat: e[4] }; });
  return st;
};
})(window);
