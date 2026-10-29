/* Okey yapay zekâsı: kolay / orta / zor. Gerçek taş kimliklerini kullanır, hile yapmaz
   (yalnızca kendi eli, açık taşlar ve kimin hangi açık taşı aldığı bilgisini kullanır). */
(function (root) {
'use strict';
var E = root.OkeyEngine || (typeof require !== 'undefined' ? require('./engine.js') : null);

function remove(arr, id) { var c = arr.slice(), i = c.indexOf(id); if (i >= 0) c.splice(i, 1); return c; }

/* iki taşın birbirine "yakınlık" değeri ve tamamlayan taş kimlikleri */
function ident(t, ok) {
  if (E.isFake(t)) return { c: ok.color, n: ok.num };
  return { c: E.colorOf(t), n: E.numOf(t) };
}
function linkInfo(a, b, ok) {
  var x = ident(a, ok), y = ident(b, ok), out = { v: 0, comp: [] }, c, lo, hi;
  if (x.n === y.n && x.c !== y.c) {
    out.v = 2;
    for (c = 0; c < 4; c++) if (c !== x.c && c !== y.c) out.comp.push({ c: c, n: x.n });
    return out;
  }
  if (x.c === y.c) {
    lo = Math.min(x.n, y.n); hi = Math.max(x.n, y.n);
    var d = hi - lo;
    if (d === 0) { out.v = 0.6; return out; }
    if (d === 1) {
      out.v = 2;
      if (lo > 1) out.comp.push({ c: x.c, n: lo - 1 });
      if (hi < 13) out.comp.push({ c: x.c, n: hi + 1 });
      if (hi === 13) out.comp.push({ c: x.c, n: 1 });
      return out;
    }
    if (d === 2) { out.v = 1.2; out.comp.push({ c: x.c, n: lo + 1 }); return out; }
    if (d === 12) { out.v = 1.4; out.comp.push({ c: x.c, n: 12 }); return out; }
    if (d === 11) { out.v = 1.0; out.comp.push({ c: x.c, n: 13 }); return out; }
  }
  return out;
}
function link(a, b, ok) { return linkInfo(a, b, ok).v; }
function unseen(ctx, c, n, ok) {
  if (c === ok.color && n === ok.num) return 0;   // gerçek okeyler joker; normal taş gibi kullanılamaz
  var seen = ctx && ctx.seen ? (ctx.seen[c * 14 + n] || 0) : 0;
  return Math.max(0, 2 - seen);
}
function potential(rest, ok, ctx) {
  var tiles = rest.filter(function (t) { return !E.isJoker(t, ok); }), used = {}, total = 0, pairs = [], i, j, k;
  for (i = 0; i < tiles.length; i++) for (j = i + 1; j < tiles.length; j++) {
    var li = linkInfo(tiles[i], tiles[j], ok);
    if (li.v <= 0) continue;
    var v = li.v;
    if (ctx && ctx.seen) {
      var outs = 0;
      for (k = 0; k < li.comp.length; k++) outs += unseen(ctx, li.comp[k].c, li.comp[k].n, ok);
      var maxOuts = li.comp.length * 2 || 1;
      v *= 0.15 + 0.85 * Math.min(1, outs / Math.min(maxOuts, 4));
    }
    pairs.push([v, i, j]);
  }
  pairs.sort(function (a, b) { return b[0] - a[0]; });
  for (i = 0; i < pairs.length; i++) {
    var p = pairs[i];
    if (used[p[1]] || used[p[2]]) continue;
    used[p[1]] = used[p[2]] = 1; total += p[0];
  }
  return total;
}

var P = { pot: 2, thr: 3, thrMed: 6, outs: true, pairMin: 4, noiseMed: 0.4, noiseEasy: 0.55, look: 0, lookW: 0 };
/* El puanı (14 taşlık el için). Yüksek = iyi. */
function evalHand(ids, ok, memo, level, ctx) {
  var arr = E.smartArrange(ids, ok, memo);
  var covered = ids.length - arr.rest.length;
  var set = covered * 10;
  if (level !== 'easy') set += potential(arr.rest, ok, level === 'hard' && P.outs ? ctx : null) * (level === 'hard' ? P.pot : 3);
  var jokersLeft = arr.rest.filter(function (t) { return E.isJoker(t, ok); }).length;
  set += jokersLeft * 8;
  if (level === 'hard') {
    var pa = E.pairArrange(ids, ok);
    var pairScore = pa.pairs.length * 20;
    if (pa.pairs.length >= P.pairMin && pairScore > set) return pairScore;
  }
  return set;
}

function tileIdentity(t, ok) {
  if (E.isFake(t)) return { c: ok.color, n: ok.num };
  return { c: E.colorOf(t), n: E.numOf(t) };
}
/* Sıradaki rakibin açık taşlardan aldıklarına göre atılacak taşın tehlikesi */
function danger(tile, ctx, seat, ok) {
  if (!ctx || !ctx.picks) return 0;
  var nxt = E.nextOf(seat), d = 0, id = tileIdentity(tile, ok);
  for (var i = 0; i < ctx.picks.length; i++) {
    var p = ctx.picks[i];
    if (p.seat !== nxt) continue;
    var q = tileIdentity(p.tile, ok);
    if (q.c === id.c && (Math.abs(q.n - id.n) === 1 || Math.abs(q.n - id.n) === 12 || q.n === id.n)) d++;
    else if (q.n === id.n) d++;
  }
  return Math.min(d, 3);
}

/* Bir sonraki çekişte elin ne kadar iyileşeceğinin beklentisi (açık taşlara bakarak) */
function lookahead(hand14, ok, ctx, memo) {
  if (!ctx || !ctx.seen) return 0;
  var base = hand14.length - E.smartArrange(hand14, ok, memo).rest.length;
  var total = 0, gain = 0, c, n, copy, id, inHand;
  var jSeen = ctx.jokersSeen || 0;
  // gerçek okey (joker)
  var jLeft = Math.max(0, 2 - jSeen);
  if (jLeft > 0) {
    id = E.tileId(ok.color, ok.num, 0);
    var covJ = hand14.length + 1 - E.smartArrange(hand14.concat([id]), ok, memo).rest.length;
    gain += jLeft * Math.max(0, covJ - base); total += jLeft;
  }
  for (c = 0; c < 4; c++) for (n = 1; n <= 13; n++) {
    var left = unseen(ctx, c, n, ok);
    if (left <= 0) continue;
    id = -1;
    for (copy = 0; copy < 2; copy++) { var cand = E.tileId(c, n, copy); if (hand14.indexOf(cand) < 0) { id = cand; break; } }
    if (id < 0) continue;
    var cov = hand14.length + 1 - E.smartArrange(hand14.concat([id]), ok, memo).rest.length;
    gain += left * Math.max(0, cov - base);
    total += left;
  }
  return total ? gain / total : 0;
}

/* Atılacak en iyi taşı seç: {tile, score}. Okey (joker) atılmaz. */
function bestDiscard(hand15, ok, level, ctx, seat, rng, memo) {
  memo = memo || {};
  var seen = {}, cands = [], i;
  for (i = 0; i < hand15.length; i++) {
    var t = hand15[i];
    if (E.isJoker(t, ok)) continue;
    var k = E.tileKey(t, ok);
    if (seen[k]) continue;
    seen[k] = 1;
    var rest = remove(hand15, t);
    var sc = evalHand(rest, ok, memo, level, ctx);
    if (level === 'hard') sc -= danger(t, ctx, seat, ok) * 2.5;
    // eşitlikte uçtaki ve yalnız taşları tercih et
    var iso = 0;
    for (var j = 0; j < rest.length; j++) iso += link(t, rest[j], ok);
    sc -= iso * 0.01;
    sc += (rng ? rng() : 0.5) * 0.001;
    cands.push({ tile: t, score: sc });
  }
  if (!cands.length) return { tile: hand15[0], score: 0 };
  cands.sort(function (a, b) { return b.score - a.score; });
  if (level === 'hard' && cands.length > 1 && ctx && ctx.seen) {
    var topN = Math.min(P.look, cands.length), q;
    for (q = 0; q < topN; q++) {
      cands[q].score += P.lookW * lookahead(remove(hand15, cands[q].tile), ok, ctx, memo);
    }
    cands.sort(function (a, b) { return b.score - a.score; });
  }
  var noise = level === 'easy' ? P.noiseEasy : (level === 'medium' ? P.noiseMed : 0);
  if (noise && cands.length > 2 && rng && rng() < noise) {
    // acemi hatası: ilk üç iyi seçenekten rastgele biri
    return cands[Math.floor(rng() * Math.min(3, cands.length))];
  }
  return cands[0];
}

/* Bitirme seçeneği var mı? En değerli olanı döndürür. */
function bestFinish(hand15, ok, elden) {
  var w = E.winningDiscards(hand15, ok), best = null;
  for (var i = 0; i < w.length; i++) {
    var v = E.finishValue(w[i].kind, w[i].tile, ok, elden);
    if (!best || v > best.value) best = { tile: w[i].tile, kind: w[i].kind, value: v };
  }
  return best;
}

/* Çekme kararı: 'pile' | 'discard' */
function decideDraw(hand14, ok, leftTop, level, ctx, seat, rng) {
  if (leftTop === undefined || leftTop < 0) return 'pile';
  var memo = {};
  var hand15 = hand14.concat([leftTop]);
  if (E.winningDiscards(hand15, ok).length) return 'discard';
  if (E.isJoker(leftTop, ok)) return 'discard';
  if (level === 'easy') return 'pile';
  var base = evalHand(hand14, ok, memo, level === 'hard' ? 'hard' : 'medium', ctx);
  var d = bestDiscard(hand15, ok, level === 'hard' ? 'hard' : 'medium', ctx, seat, rng, memo);
  var thr = level === 'hard' ? P.thr : P.thrMed;
  return d.score > base + thr && d.tile !== leftTop ? 'discard' : 'pile';
}

/* Tam hamle: (view) -> eylem. view: viewFor çıktısı + seat */
function seenMap(view) {
  var m = {}, i, j, jk = 0;
  function add(t) {
    if (E.isFake(t)) return;
    if (E.isJoker(t, view.ok)) { jk++; return; }
    var k = E.colorOf(t) * 14 + E.numOf(t);
    m[k] = (m[k] || 0) + 1;
  }
  add(view.indicator);
  for (i = 0; i < view.discards.length; i++) for (j = 0; j < view.discards[i].length; j++) add(view.discards[i][j]);
  for (i = 0; i < view.hand.length; i++) add(view.hand[i]);
  m.jokers = jk;
  return m;
}
function chooseAction(view, seat, level, rng, picks) {
  var ok = view.ok, hand = view.hand, ctx = { picks: picks || [], seen: level === 'hard' ? seenMap(view) : null };
  if (ctx.seen) ctx.jokersSeen = ctx.seen.jokers || 0;
  if (view.phase === 'draw') {
    var left = view.discards[E.leftOf(seat)];
    var top = left.length ? left[left.length - 1] : -1;
    var from = decideDraw(hand, ok, top, level, ctx, seat, rng);
    if (from === 'discard' && top < 0) from = 'pile';
    if (from === 'pile' && view.pile <= 0 && top >= 0) from = 'discard';
    return { t: 'draw', from: from };
  }
  var elden = seat === view.starter && view.moves === 0;
  var fin = bestFinish(hand, ok, elden);
  if (fin) return { t: 'finish', tile: fin.tile };
  var d = bestDiscard(hand, ok, level, ctx, seat, rng, {});
  return { t: 'discard', tile: d.tile };
}

/* İpucu: atılması önerilen taş (veya bitiş) */
function hint(view, seat, picks) {
  var ok = view.ok, hand = view.hand;
  if (view.phase !== 'discard' || hand.length !== 15) return null;
  var fin = bestFinish(hand, ok, false);
  if (fin) return { finish: true, tile: fin.tile };
  var sm = seenMap(view);
  var d = bestDiscard(hand, ok, 'hard', { picks: picks || [], seen: sm, jokersSeen: sm.jokers || 0 }, seat, null, {});
  return { finish: false, tile: d.tile };
}

root.OkeyAI = { params: P, evalHand: evalHand, bestDiscard: bestDiscard, bestFinish: bestFinish, decideDraw: decideDraw, chooseAction: chooseAction, hint: hint };
if (typeof module !== 'undefined' && module.exports) module.exports = root.OkeyAI;
})(typeof window !== 'undefined' ? window : globalThis);
