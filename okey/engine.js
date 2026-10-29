/* Okey motoru — kurallar, el doğrulama, puanlama. Tarayıcıda ve Node'da çalışır. */
(function (root) {
'use strict';

/* ---------- Taşlar ----------
   0..103 : renk*26 + (sayı-1)*2 + kopya   (renk: 0 sarı, 1 mavi, 2 siyah, 3 kırmızı)
   104,105: sahte okey                                                          */
var ORDER = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1];

function isFake(id) { return id >= 104; }
function colorOf(id) { return id >= 104 ? -1 : (id / 26) | 0; }
function numOf(id) { return id >= 104 ? 0 : (((id % 26) / 2) | 0) + 1; }
function tileId(c, n, copy) { return c * 26 + (n - 1) * 2 + (copy || 0); }
function okeyOf(indicator) { return { color: colorOf(indicator), num: numOf(indicator) % 13 + 1 }; }
function isJoker(id, ok) { return id < 104 && colorOf(id) === ok.color && numOf(id) === ok.num; }

/* Sağlam rastgele sayı üretici (testler için tohumlanabilir) */
function makeRng(seed) {
  if (seed === undefined || seed === null) return Math.random;
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rng) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(rng() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

/* ---------- Analiz: taş listesi -> sayaçlar ---------- */
function analyze(ids, ok) {
  var cnt = [], bag = [], c, p;
  for (c = 0; c < 4; c++) {
    cnt.push([]); bag.push([]);
    for (p = 0; p <= 13; p++) { cnt[c].push(0); bag[c].push([]); }
  }
  var jok = [];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    if (isFake(id)) { cnt[ok.color][ok.num]++; bag[ok.color][ok.num].push(id); }
    else if (isJoker(id, ok)) jok.push(id);
    else { var cc = colorOf(id), nn = numOf(id); cnt[cc][nn]++; bag[cc][nn].push(id); }
  }
  return { cnt: cnt, bag: bag, jok: jok };
}

function keyOf(cnt, j) {
  var s = '';
  for (var c = 0; c < 4; c++) for (var p = 1; p <= 13; p++) s += cnt[c][p];
  return s + '|' + j;
}
function firstTile(cnt) {
  for (var c = 0; c < 4; c++)
    for (var oi = 0; oi < 13; oi++) { var p = ORDER[oi]; if (cnt[c][p] > 0) return [c, p]; }
  return null;
}
function realLeft(cnt) {
  var n = 0;
  for (var c = 0; c < 4; c++) for (var p = 1; p <= 13; p++) n += cnt[c][p];
  return n;
}

/* (c,p) taşını içeren olası seri/per seçenekleri */
function genOptions(cnt, j, c, p) {
  var out = [], qs = p === 1 ? [1, 14] : [p], qi, s, e, pos, idx;
  for (qi = 0; qi < qs.length; qi++) {
    var q = qs[qi];
    for (s = 1; s <= q; s++) {
      for (e = Math.max(q, s + 2); e <= 14; e++) {
        if (e - s + 1 > 13) continue;
        var need = 0, real = [], okk = true, cells = [];
        for (pos = s; pos <= e; pos++) {
          idx = pos === 14 ? 1 : pos;
          if (pos === q || cnt[c][idx] > 0) { real.push(idx); cells.push(idx); }
          else { need++; cells.push(0); if (need > j) { okk = false; break; } }
        }
        if (okk) out.push({ kind: 'run', c: c, s: s, e: e, real: real, cells: cells, jn: need });
      }
    }
  }
  var others = [];
  for (var c2 = 0; c2 < 4; c2++) if (c2 !== c && cnt[c2][p] > 0) others.push(c2);
  for (var mask = 0; mask < (1 << others.length); mask++) {
    var cols = [c];
    for (var b = 0; b < others.length; b++) if (mask & (1 << b)) cols.push(others[b]);
    var k = cols.length;
    for (var jn = Math.max(0, 3 - k); jn <= Math.min(j, 4 - k); jn++)
      out.push({ kind: 'group', n: p, cols: cols, jn: jn });
  }
  return out;
}
function applyOpt(cnt, o, dir) {
  var i;
  if (o.kind === 'run') { for (i = 0; i < o.real.length; i++) cnt[o.c][o.real[i]] -= dir; }
  else { for (i = 0; i < o.cols.length; i++) cnt[o.cols[i]][o.n] -= dir; }
}
function optReal(o) { return o.kind === 'run' ? o.real.length : o.cols.length; }

/* ---------- Tüm taşlar seri/per olabiliyor mu? ---------- */
function canWinSets(cnt, j, memo) {
  memo = memo || {};
  var t = firstTile(cnt);
  if (!t) return j === 0 || j >= 3;
  var key = keyOf(cnt, j);
  if (memo[key] !== undefined) return memo[key];
  var opts = genOptions(cnt, j, t[0], t[1]), res = false;
  for (var i = 0; i < opts.length && !res; i++) {
    var o = opts[i];
    applyOpt(cnt, o, 1);
    res = canWinSets(cnt, j - o.jn, memo);
    applyOpt(cnt, o, -1);
  }
  memo[key] = res;
  return res;
}

/* Çift: tek kalan taş sayısı okey sayısını geçmemeli */
function canWinPairs(cnt, j) {
  var odd = 0;
  for (var c = 0; c < 4; c++) for (var p = 1; p <= 13; p++) if (cnt[c][p] & 1) odd++;
  return odd <= j;
}

/* ---------- En çok taşı kapsayan dizilim (otomatik dizme / yapay zekâ) ---------- */
function maxCover(cnt, j, memo, budget) {
  var t = firstTile(cnt);
  if (!t) return { v: 0, opt: null };
  var key = keyOf(cnt, j);
  if (memo[key]) return memo[key];
  if (budget && budget.n-- < 0) return { v: 0, opt: null, cut: true };
  var best = { v: -1, opt: null, skip: false }, opts = genOptions(cnt, j, t[0], t[1]), i;
  for (i = 0; i < opts.length; i++) {
    var o = opts[i];
    applyOpt(cnt, o, 1);
    var r = maxCover(cnt, j - o.jn, memo, budget);
    applyOpt(cnt, o, -1);
    var v = optReal(o) + o.jn + r.v;
    if (v > best.v) best = { v: v, opt: o, skip: false };
  }
  cnt[t[0]][t[1]]--;
  var r2 = maxCover(cnt, j, memo, budget);
  cnt[t[0]][t[1]]++;
  if (r2.v > best.v) best = { v: r2.v, opt: null, skip: true, tile: t };
  memo[key] = best;
  return best;
}

/* Ids ile dizilimi yeniden kur: { sets:[{kind,ids}], rest:[ids] } */
function smartArrange(ids, ok, sharedMemo) {
  var a = analyze(ids, ok), cnt = a.cnt, j = a.jok.length, memo = sharedMemo || {}, budget = { n: 60000 };
  var sets = [], guard = 0;
  var bag = a.bag, jok = a.jok.slice();
  while (guard++ < 40) {
    var t = firstTile(cnt);
    if (!t) break;
    var r = maxCover(cnt, j, memo, budget);
    if (r.skip || !r.opt) {
      // t tamamen dışarıda kalır
      cnt[t[0]][t[1]]--;
      var id0 = bag[t[0]][t[1]].pop();
      (sets.rest || (sets.rest = [])).push(id0);
      continue;
    }
    var o = r.opt, setIds = [], i, id;
    if (o.kind === 'run') {
      for (i = 0; i < o.cells.length; i++) {
        if (o.cells[i]) { id = bag[o.c][o.cells[i]].pop(); }
        else { id = jok.pop(); }
        setIds.push(id);
      }
      applyOpt(cnt, o, 1);
    } else {
      for (i = 0; i < o.cols.length; i++) setIds.push(bag[o.cols[i]][o.n].pop());
      for (i = 0; i < o.jn; i++) setIds.push(jok.pop());
      applyOpt(cnt, o, 1);
    }
    j -= o.jn;
    sets.push({ kind: o.kind, ids: setIds });
  }
  var rest = sets.rest || [];
  delete sets.rest;
  for (var c = 0; c < 4; c++) for (var p = 1; p <= 13; p++) while (bag[c][p].length) rest.push(bag[c][p].pop());
  while (jok.length) rest.push(jok.pop());
  return { sets: sets, rest: rest };
}

/* Çift dizilimi */
function pairArrange(ids, ok) {
  var a = analyze(ids, ok), pairs = [], singles = [], c, p;
  for (c = 0; c < 4; c++) for (p = 1; p <= 13; p++) {
    var b = a.bag[c][p];
    while (b.length >= 2) pairs.push([b.pop(), b.pop()]);
    if (b.length) singles.push(b.pop());
  }
  var jok = a.jok.slice();
  while (jok.length && singles.length) pairs.push([singles.shift(), jok.pop()]);
  while (jok.length >= 2) pairs.push([jok.pop(), jok.pop()]);
  return { pairs: pairs, rest: singles.concat(jok) };
}

/* ---------- Bitiş denetimi ---------- */
function tileKey(id, ok) { return isFake(id) ? 'f' : (isJoker(id, ok) ? 'j' : colorOf(id) * 14 + numOf(id)); }

/* 15 taşlık elde, hangi taşı atınca el biter? [{tile, kind:'sets'|'pairs'}] */
function winningDiscards(ids, ok) {
  var res = [], seen = {};
  if (ids.length !== 15) return res;
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i], k = tileKey(id, ok);
    if (seen[k]) continue;
    seen[k] = 1;
    var rest = ids.slice(0, i).concat(ids.slice(i + 1));
    var a = analyze(rest, ok);
    if (canWinPairs(a.cnt, a.jok.length)) res.push({ tile: id, kind: 'pairs' });
    if (canWinSets(a.cnt, a.jok.length, {})) res.push({ tile: id, kind: 'sets' });
  }
  return res;
}
function finishValue(kind, tile, ok, elden) {
  var v = 2;
  if (isJoker(tile, ok)) v *= 2;
  if (kind === 'pairs') v *= 2;
  if (elden) v *= 2;
  return v;
}

/* ---------- Maç / el durumu ---------- */
function sidesOf(m) { return m.cfg.partner ? [[0, 2], [1, 3]] : [[0], [1], [2], [3]]; }
function sideOf(m, seat) { return m.cfg.partner ? seat % 2 : seat; }

function newMatch(cfg, rng) {
  rng = rng || Math.random;
  var m = {
    cfg: {
      partner: !!cfg.partner,
      type: cfg.type || 'single',       // single | countdown | hands | target
      value: cfg.value || 0
    },
    handNo: 0,
    starter: Math.floor(rng() * 4),
    scores: [],
    status: 'playing',
    h: null,
    result: null,
    matchWinner: null,
    seq: 0
  };
  var n = m.cfg.partner ? 2 : 4;
  for (var i = 0; i < n; i++) m.scores.push(m.cfg.type === 'countdown' ? m.cfg.value : 0);
  dealHand(m, rng, true);
  return m;
}

function dealHand(m, rng, first) {
  rng = rng || Math.random;
  if (!first) m.starter = (m.starter + 1) % 4;
  m.handNo++;
  var deck = [], i;
  for (i = 0; i < 106; i++) deck.push(i);
  shuffle(deck, rng);
  var ind = -1;
  for (i = 0; i < deck.length; i++) if (!isFake(deck[i])) { ind = deck[i]; deck.splice(i, 1); break; }
  var hands = [[], [], [], []];
  for (var s = 0; s < 4; s++) {
    var n = s === m.starter ? 15 : 14;
    for (i = 0; i < n; i++) hands[s].push(deck.pop());
  }
  m.h = {
    indicator: ind,
    ok: okeyOf(ind),
    hands: hands,
    pile: deck,
    discards: [[], [], [], []],
    turn: m.starter,
    phase: 'discard',
    moves: 0,
    picks: [],      // [{seat, tile}] — açık taştan çekenler
    drawn: -1       // son çekilen taş (görsel)
  };
  m.status = 'playing';
  m.result = null;
  m.seq++;
  return m;
}

function has(arr, id) { return arr.indexOf(id) >= 0; }
function remove(arr, id) { var i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); return i >= 0; }

function leftOf(seat) { return (seat + 3) % 4; }   // taşını çektiğim oyuncu
function nextOf(seat) { return (seat + 1) % 4; }

/* Eylemler: {ok:true, ev:{...}} veya {ok:false, err:'...'} */
function actDraw(m, seat, from) {
  var h = m.h;
  if (m.status !== 'playing') return { ok: false, err: 'status' };
  if (h.turn !== seat || h.phase !== 'draw') return { ok: false, err: 'turn' };
  var tile;
  if (from === 'discard') {
    var d = h.discards[leftOf(seat)];
    if (!d.length) return { ok: false, err: 'empty' };
    tile = d.pop();
    h.picks.push({ seat: seat, tile: tile });
  } else {
    if (!h.pile.length) return { ok: false, err: 'pile' };
    tile = h.pile.pop();
    from = 'pile';
  }
  h.hands[seat].push(tile);
  h.phase = 'discard';
  h.drawn = tile;
  m.seq++;
  return { ok: true, ev: { t: 'draw', seat: seat, from: from, tile: from === 'discard' ? tile : -1, real: tile } };
}

function actDiscard(m, seat, tile) {
  var h = m.h;
  if (m.status !== 'playing') return { ok: false, err: 'status' };
  if (h.turn !== seat || h.phase !== 'discard') return { ok: false, err: 'turn' };
  if (!remove(h.hands[seat], tile)) return { ok: false, err: 'tile' };
  h.discards[seat].push(tile);
  h.moves++;
  h.turn = nextOf(seat);
  h.phase = 'draw';
  h.drawn = -1;
  m.seq++;
  var ev = { t: 'discard', seat: seat, tile: tile };
  // Deste bitti mi? (sıradaki oyuncu çekemeyecek ve açık taş da yok)
  if (!h.pile.length) {
    endHand(m, null, null);
    ev.drawGame = true;
  }
  return { ok: true, ev: ev };
}

function actFinish(m, seat, tile) {
  var h = m.h;
  if (m.status !== 'playing') return { ok: false, err: 'status' };
  if (h.turn !== seat || h.phase !== 'discard') return { ok: false, err: 'turn' };
  if (!has(h.hands[seat], tile)) return { ok: false, err: 'tile' };
  var wins = winningDiscards(h.hands[seat], h.ok), best = null;
  var elden = seat === m.starter && h.moves === 0 && h.drawn === -1;
  for (var i = 0; i < wins.length; i++) {
    if (wins[i].tile !== tile && tileKey(wins[i].tile, h.ok) !== tileKey(tile, h.ok)) continue;
    var v = finishValue(wins[i].kind, tile, h.ok, elden);
    if (!best || v > best.value) best = { kind: wins[i].kind, value: v };
  }
  if (!best) return { ok: false, err: 'notwin' };
  remove(h.hands[seat], tile);
  h.discards[seat].push(tile);
  h.moves++;
  m.seq++;
  var info = { seat: seat, tile: tile, kind: best.kind, value: best.value,
               okey: isJoker(tile, h.ok), elden: elden };
  endHand(m, seat, info);
  return { ok: true, ev: { t: 'finish', seat: seat, tile: tile, info: info } };
}

function endHand(m, winner, info) {
  var h = m.h, cfg = m.cfg, res = { winner: winner, info: info, draw: winner === null, hands: h.hands.map(function (x) { return x.slice(); }) };
  var side = winner === null ? -1 : sideOf(m, winner);
  if (side >= 0) {
    if (cfg.type === 'countdown') m.scores[side] = Math.max(0, m.scores[side] - info.value);
    else m.scores[side] += info.value;
  }
  res.scores = m.scores.slice();
  var done = false, mw = null, i;
  if (cfg.type === 'single') {
    if (side >= 0) { done = true; mw = side; }
  } else if (cfg.type === 'countdown') {
    for (i = 0; i < m.scores.length; i++) if (m.scores[i] <= 0) { done = true; mw = i; }
  } else if (cfg.type === 'target') {
    var top = -1;
    for (i = 0; i < m.scores.length; i++) if (m.scores[i] >= cfg.value && (top < 0 || m.scores[i] > m.scores[top])) top = i;
    if (top >= 0) { done = true; mw = top; }
  } else if (cfg.type === 'hands') {
    if (m.handNo >= cfg.value) {
      var mx = Math.max.apply(null, m.scores), cnt = m.scores.filter(function (x) { return x === mx; }).length;
      if (cnt === 1) { done = true; mw = m.scores.indexOf(mx); }
    }
  }
  m.result = res;
  m.status = done ? 'matchEnd' : 'handEnd';
  m.matchWinner = done ? mw : null;
  m.seq++;
}

/* Hamle uygulayıcı (sunucu/yerel ortak giriş noktası) */
function apply(m, seat, a) {
  if (!a) return { ok: false, err: 'bad' };
  if (a.t === 'draw') return actDraw(m, seat, a.from);
  if (a.t === 'discard') return actDiscard(m, seat, a.tile);
  if (a.t === 'finish') return actFinish(m, seat, a.tile);
  return { ok: false, err: 'bad' };
}

/* Bir oyuncunun görmesi gerekenler */
function viewFor(m, seat) {
  var h = m.h;
  return {
    cfg: m.cfg, handNo: m.handNo, starter: m.starter, scores: m.scores, status: m.status,
    matchWinner: m.matchWinner, seq: m.seq,
    indicator: h.indicator, ok: h.ok,
    hand: h.hands[seat].slice(),
    counts: h.hands.map(function (x) { return x.length; }),
    pile: h.pile.length,
    discards: h.discards.map(function (x) { return x.slice(); }),
    turn: h.turn, phase: h.phase, moves: h.moves, drawn: h.turn === seat ? h.drawn : -1,
    result: m.status === 'playing' ? null : m.result
  };
}

root.OkeyEngine = {
  ORDER: ORDER,
  isFake: isFake, colorOf: colorOf, numOf: numOf, tileId: tileId, okeyOf: okeyOf, isJoker: isJoker,
  makeRng: makeRng, shuffle: shuffle,
  analyze: analyze, genOptions: genOptions, applyOpt: applyOpt, firstTile: firstTile, keyOf: keyOf,
  canWinSets: canWinSets, canWinPairs: canWinPairs, maxCover: maxCover,
  smartArrange: smartArrange, pairArrange: pairArrange,
  winningDiscards: winningDiscards, finishValue: finishValue, tileKey: tileKey,
  sidesOf: sidesOf, sideOf: sideOf,
  newMatch: newMatch, dealHand: dealHand, apply: apply, viewFor: viewFor,
  actDraw: actDraw, actDiscard: actDiscard, actFinish: actFinish,
  leftOf: leftOf, nextOf: nextOf
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.OkeyEngine;
})(typeof window !== 'undefined' ? window : globalThis);
