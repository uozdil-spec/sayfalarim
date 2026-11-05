/* 101 Okey motoru — dağıtım, el açma, işleme, okey değiştirme, bitiş ve puanlama.
   Taş kimlikleri okey motoruyla (engine.js) aynıdır. */
(function (root) {
'use strict';
var E = root.OkeyEngine || (typeof require !== 'undefined' ? require('./engine.js') : null);

var OPEN_MIN = 101, PAIRS_MIN = 5, HAND_N = 21, LOSE_UNOPENED = 202, WIN_BONUS = 101;

function numVal(n) { return n === 14 ? 1 : n; }            // As (1) her yerde 1 puan
function ident(id, ok) {                                    // sahte okey = okey taşının kendisi
  if (E.isFake(id)) return { c: ok.color, n: ok.num };
  return { c: E.colorOf(id), n: E.numOf(id) };
}
function tileValue(id, ok) { return E.isJoker(id, ok) ? 0 : numVal(ident(id, ok).n); }
function has(arr, id) { return arr.indexOf(id) >= 0; }
function remove(arr, id) { var i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); return i >= 0; }

/* ---------- Per / seri tanıma ----------
   ids sırasız verilir. Dönen: { kind:'run'|'group', order:[ids], cells:[{c,n}], value } veya null */
function classify(ids, ok) {
  var nat = [], jok = [], i;
  for (i = 0; i < ids.length; i++) {
    if (E.isJoker(ids[i], ok)) jok.push(ids[i]);
    else { var q = ident(ids[i], ok); nat.push({ id: ids[i], c: q.c, n: q.n }); }
  }
  var len = ids.length;
  if (len < 3 || len > 13 || !nat.length) return null;
  var best = null;
  // --- per: aynı sayı, farklı renk
  if (len <= 4) {
    var okG = true, seenC = {};
    for (i = 0; i < nat.length; i++) {
      if (nat[i].n !== nat[0].n || seenC[nat[i].c]) { okG = false; break; }
      seenC[nat[i].c] = 1;
    }
    if (okG) {
      var sn = nat.slice().sort(function (a, b) { return a.c - b.c; });
      best = { kind: 'group', order: sn.map(function (x) { return x.id; }).concat(jok),
               cells: sn.map(function (x) { return { c: x.c, n: x.n }; }).concat(jok.map(function () { return { c: -1, n: nat[0].n }; })),
               value: numVal(nat[0].n) * len };
      return best;
    }
  }
  // --- seri: aynı renk, ardışık (As alçak 1 ya da yüksek 14)
  var col = nat[0].c;
  for (i = 0; i < nat.length; i++) if (nat[i].c !== col) return null;
  var hasAce = false;
  for (i = 0; i < nat.length; i++) if (nat[i].n === 1) hasAce = true;
  var aces = hasAce ? [false, true] : [false];
  for (var ai = 0; ai < aces.length; ai++) {
    var high = aces[ai], nums = {}, lo = 99, hi = -1, dup = false;
    for (i = 0; i < nat.length; i++) {
      var nn = (nat[i].n === 1 && high) ? 14 : nat[i].n;
      if (nums[nn]) { dup = true; break; }
      nums[nn] = nat[i].id; if (nn < lo) lo = nn; if (nn > hi) hi = nn;
    }
    if (dup) continue;
    var span = hi - lo + 1, J = jok.length, gaps = span - nat.length;
    if (gaps > J || span > len) continue;
    var extra = J - gaps, up;
    for (up = extra; up >= 0; up--) {
      var L = lo - (extra - up), H = hi + up;
      if (L < 1 || H > 14 || H - L + 1 !== len) continue;
      if (L === 1 && H === 14) continue;
      if (high && L === 1) continue;                      // yüksek As varken 1 olamaz
      if (!high && hasAce && H === 14) continue;          // alçak As varken 14 olamaz
      var v = 0, order = [], cells = [], jj = jok.slice(), pos;
      for (pos = L; pos <= H; pos++) {
        v += numVal(pos);
        order.push(nums[pos] !== undefined ? nums[pos] : jj.pop());
        cells.push({ c: col, n: pos });
      }
      if (!best || v > best.value) best = { kind: 'run', order: order, cells: cells, value: v };
    }
  }
  return best;
}

function classifyPair(ids, ok) {
  if (ids.length !== 2) return null;
  var j0 = E.isJoker(ids[0], ok), j1 = E.isJoker(ids[1], ok);
  if (j0 && j1) return { kind: 'pair', order: ids.slice(), cells: [{ c: -1, n: 0 }, { c: -1, n: 0 }], value: 0 };
  if (j0 || j1) {
    var nid = j0 ? ids[1] : ids[0], q = ident(nid, ok);
    return { kind: 'pair', order: j0 ? [ids[1], ids[0]] : ids.slice(), cells: [{ c: q.c, n: q.n }, { c: q.c, n: q.n }], value: 0 };
  }
  var a = ident(ids[0], ok), b = ident(ids[1], ok);
  if (a.c !== b.c || a.n !== b.n) return null;
  return { kind: 'pair', order: ids.slice(), cells: [{ c: a.c, n: a.n }, { c: a.c, n: a.n }], value: 0 };
}

/* ---------- En çok puanı veren dizilim (otomatik aç / yapay zekâ) ---------- */
function optValue(o) {
  var v = 0, p;
  if (o.kind === 'run') { for (p = o.s; p <= o.e; p++) v += numVal(p); return v; }
  return numVal(o.n) * (o.cols.length + o.jn);
}
function maxValue(cnt, j, memo, budget) {
  var t = E.firstTile(cnt);
  if (!t) return { v: 0, opt: null };
  var key = E.keyOf(cnt, j);
  if (memo[key]) return memo[key];
  if (budget && budget.n-- < 0) return { v: 0, opt: null, cut: true };
  var best = { v: -1, opt: null, skip: false }, opts = E.genOptions(cnt, j, t[0], t[1]), i;
  for (i = 0; i < opts.length; i++) {
    var o = opts[i];
    E.applyOpt(cnt, o, 1);
    var r = maxValue(cnt, j - o.jn, memo, budget);
    E.applyOpt(cnt, o, -1);
    var v = optValue(o) + r.v;
    if (v > best.v) best = { v: v, opt: o, skip: false };
  }
  cnt[t[0]][t[1]]--;
  var r2 = maxValue(cnt, j, memo, budget);
  cnt[t[0]][t[1]]++;
  if (r2.v > best.v) best = { v: r2.v, opt: null, skip: true, tile: t };
  memo[key] = best;
  return best;
}
/* ids -> { sets:[{kind,ids,value}], rest:[ids], total } (toplam puanı en yüksek dizilim) */
function arrange(ids, ok, budgetN) {
  var a = E.analyze(ids, ok), cnt = a.cnt, j = a.jok.length, memo = {}, budget = { n: budgetN || 80000 };
  var bag = a.bag, jok = a.jok.slice(), sets = [], rest = [], guard = 0, total = 0;
  while (guard++ < 60) {
    var t = E.firstTile(cnt);
    if (!t) break;
    var r = maxValue(cnt, j, memo, budget);
    if (r.skip || !r.opt) { cnt[t[0]][t[1]]--; rest.push(bag[t[0]][t[1]].pop()); continue; }
    var o = r.opt, setIds = [], i, id;
    if (o.kind === 'run') {
      for (i = 0; i < o.cells.length; i++) setIds.push(o.cells[i] ? bag[o.c][o.cells[i]].pop() : jok.pop());
    } else {
      for (i = 0; i < o.cols.length; i++) setIds.push(bag[o.cols[i]][o.n].pop());
      for (i = 0; i < o.jn; i++) setIds.push(jok.pop());
    }
    E.applyOpt(cnt, o, 1);
    j -= o.jn;
    var val = optValue(o);
    total += val;
    sets.push({ kind: o.kind, ids: setIds, value: val });
  }
  for (var c = 0; c < 4; c++) for (var p = 1; p <= 13; p++) while (bag[c][p].length) rest.push(bag[c][p].pop());
  while (jok.length) rest.push(jok.pop());
  return { sets: sets, rest: rest, total: total };
}
/* Çiftler: en çok çift */
function pairsOf(ids, ok) { return E.pairArrange(ids, ok); }

/* ---------- Eşleşen taşlar (işleme) ---------- */
/* meld: {kind, tiles, cells}. Dönen: [{mode:'lo'|'hi'|'add'|'swap', ...}] */
function addOptions(meld, tile, ok) {
  var out = [], i, q, isJ = E.isJoker(tile, ok);
  if (meld.kind === 'pair') return out;
  if (meld.kind === 'run') {
    var lo = meld.cells[0].n, hi = meld.cells[meld.cells.length - 1].n, col = meld.cells[0].c;
    var len = meld.cells.length;
    q = isJ ? null : ident(tile, ok);
    if (isJ) {
      if (hi < 14 && !(lo === 1 && hi + 1 === 14) && len < 13) out.push({ mode: 'hi' });
      if (lo > 1 && len < 13) out.push({ mode: 'lo' });
      return out;
    }
    if (q.c !== col) return out;
    var tn = q.n;
    if (len < 13) {
      if (tn === hi + 1 && hi < 14 && !(lo === 1 && hi + 1 === 14)) out.push({ mode: 'hi' });
      if (tn === 1 && hi === 13 && lo > 1 && len < 13) out.push({ mode: 'hi' });           // ...12-13-1
      if (tn === lo - 1 && lo > 1) out.push({ mode: 'lo' });
    }
    for (i = 0; i < meld.tiles.length; i++) {
      if (E.isJoker(meld.tiles[i], ok) && (meld.cells[i].n === tn || (tn === 1 && meld.cells[i].n === 14))) out.push({ mode: 'swap', index: i });
    }
    return out;
  }
  // group
  var n = meld.cells[0].n, present = {}, jIdx = [];
  for (i = 0; i < meld.tiles.length; i++) {
    if (E.isJoker(meld.tiles[i], ok)) jIdx.push(i);
    else present[ident(meld.tiles[i], ok).c] = 1;
  }
  if (isJ) { if (meld.tiles.length < 4) out.push({ mode: 'add' }); return out; }
  q = ident(tile, ok);
  if (q.n !== n || present[q.c]) return out;
  if (meld.tiles.length < 4) out.push({ mode: 'add' });
  if (jIdx.length) out.push({ mode: 'swap', index: jIdx[0] });
  return out;
}
function applyAdd(meld, tile, opt, ok) {
  // meld'i yerinde değiştirir; swap ise çıkan jokerin kimliğini döndürür
  var isJ = E.isJoker(tile, ok), q = isJ ? null : ident(tile, ok), got = -1;
  if (opt.mode === 'swap') {
    got = meld.tiles[opt.index];
    meld.tiles[opt.index] = tile;
    meld.cells[opt.index] = meld.kind === 'run' ? { c: meld.cells[opt.index].c, n: meld.cells[opt.index].n } : { c: q.c, n: q.n };
    if (meld.kind === 'group') {                    // renkleri sırala
      var z = meld.tiles.map(function (id, k) { return { id: id, cell: meld.cells[k] }; });
      z.sort(function (a, b) { return (a.cell.c < 0 ? 9 : a.cell.c) - (b.cell.c < 0 ? 9 : b.cell.c); });
      meld.tiles = z.map(function (x) { return x.id; }); meld.cells = z.map(function (x) { return x.cell; });
    }
    return got;
  }
  if (meld.kind === 'run') {
    if (opt.mode === 'hi') { meld.tiles.push(tile); meld.cells.push({ c: meld.cells[0].c, n: meld.cells[meld.cells.length - 1].n + 1 }); }
    else { meld.tiles.unshift(tile); meld.cells.unshift({ c: meld.cells[0].c, n: meld.cells[0].n - 1 }); }
    return -1;
  }
  // group add
  var cell = isJ ? { c: -1, n: meld.cells[0].n } : { c: q.c, n: q.n };
  meld.tiles.push(tile); meld.cells.push(cell);
  var z2 = meld.tiles.map(function (id, k) { return { id: id, cell: meld.cells[k] }; });
  z2.sort(function (a, b) { return (a.cell.c < 0 ? 9 : a.cell.c) - (b.cell.c < 0 ? 9 : b.cell.c); });
  meld.tiles = z2.map(function (x) { return x.id; }); meld.cells = z2.map(function (x) { return x.cell; });
  return -1;
}

/* ---------- Maç / el ---------- */
function newMatch(cfg, rng) {
  rng = rng || Math.random;
  var m = {
    cfg: { game: '101', partner: false, type: cfg.type || 'single', value: cfg.value || 0 },
    handNo: 0, starter: Math.floor(rng() * 4), scores: [0, 0, 0, 0], status: 'playing',
    h: null, result: null, matchWinner: null, seq: 0
  };
  dealHand(m, rng, true);
  return m;
}

function dealHand(m, rng, first) {
  rng = rng || Math.random;
  if (!first) m.starter = (m.starter + 1) % 4;
  m.handNo++;
  var deck = [], i;
  for (i = 0; i < 106; i++) deck.push(i);
  E.shuffle(deck, rng);
  var ind = -1;
  for (i = 0; i < deck.length; i++) if (!E.isFake(deck[i])) { ind = deck[i]; deck.splice(i, 1); break; }
  var hands = [[], [], [], []];
  for (var s = 0; s < 4; s++) {
    var n = s === m.starter ? HAND_N + 1 : HAND_N;
    for (i = 0; i < n; i++) hands[s].push(deck.pop());
  }
  m.h = {
    indicator: ind, ok: E.okeyOf(ind), hands: hands, pile: deck, discards: [[], [], [], []],
    turn: m.starter, phase: 'discard', moves: 0, picks: [], drawn: -1,
    melds: [], meldSeq: 0, opened: [null, null, null, null],
    openedNow: false, mustOpen: false, swapPending: [], turns: [0, 0, 0, 0]
  };
  m.status = 'playing'; m.result = null; m.seq++;
  return m;
}

function leftOf(seat) { return (seat + 3) % 4; }
function nextOf(seat) { return (seat + 1) % 4; }

/* eldeki taşlarla el açılabilir mi? (toplam puan) */
function canOpenValue(hand, ok) {
  var a = arrange(hand, ok, 60000);
  return a.total;
}
function canOpen(hand, ok) {
  if (canOpenValue(hand, ok) >= OPEN_MIN) return 'sets';
  var pa = E.pairArrange(hand, ok);
  if (pa.pairs.length >= PAIRS_MIN) return 'pairs';
  return null;
}

function turnStart(h, seat) { h.openedNow = false; h.mustOpen = false; h.swapPending = []; h.turns[seat]++; }

function actDraw(m, seat, from) {
  var h = m.h;
  if (m.status !== 'playing') return { ok: false, err: 'status' };
  if (h.turn !== seat || h.phase !== 'draw') return { ok: false, err: 'turn' };
  var tile;
  if (from === 'discard') {
    var d = h.discards[leftOf(seat)];
    if (!d.length) return { ok: false, err: 'empty' };
    tile = d[d.length - 1];
    if (!h.opened[seat] && !canOpen(h.hands[seat].concat([tile]), h.ok)) return { ok: false, err: 'cannotopen' };
    d.pop();
    h.picks.push({ seat: seat, tile: tile });
    h.mustOpen = !h.opened[seat];
  } else {
    if (!h.pile.length) return { ok: false, err: 'pile' };
    tile = h.pile.pop(); from = 'pile';
    h.mustOpen = false;
  }
  h.hands[seat].push(tile);
  h.phase = 'discard'; h.drawn = tile; h.openedNow = false; h.swapPending = [];
  h.turns[seat]++;
  m.seq++;
  return { ok: true, ev: { t: 'draw', seat: seat, from: from, tile: from === 'discard' ? tile : -1, real: tile } };
}

function newMeld(h, seat, c) {
  h.meldSeq++;
  return { id: h.meldSeq, owner: seat, kind: c.kind, tiles: c.order.slice(), cells: c.cells.map(function (x) { return { c: x.c, n: x.n }; }) };
}
function sameTiles(list, hand) {
  var tmp = hand.slice();
  for (var i = 0; i < list.length; i++) if (!remove(tmp, list[i])) return false;
  return true;
}

/* {t:'open', sets:[[ids],...]} — el açma ya da (açıksa) yeni per koyma */
function actOpen(m, seat, groups) {
  var h = m.h, ok = h.ok;
  if (m.status !== 'playing') return { ok: false, err: 'status' };
  if (h.turn !== seat || h.phase !== 'discard') return { ok: false, err: 'turn' };
  if (h.opened[seat] === 'pairs') return { ok: false, err: 'pairsonly' };
  if (!groups || !groups.length) return { ok: false, err: 'bad' };
  var all = [], cl = [], total = 0, i;
  for (i = 0; i < groups.length; i++) {
    var c = classify(groups[i], ok);
    if (!c) return { ok: false, err: 'invalid', group: i };
    cl.push(c); total += c.value;
    all = all.concat(groups[i]);
  }
  if (!sameTiles(all, h.hands[seat])) return { ok: false, err: 'tile' };
  var first = !h.opened[seat];
  if (first && total < OPEN_MIN) return { ok: false, err: 'low', total: total };
  // tamamını koyup elde tek taş bırakma zorunluluğu yok; el boşalırsa bitirmiş sayılır
  all.forEach(function (id) { remove(h.hands[seat], id); remove(h.swapPending, id); });
  var made = cl.map(function (c) { var md = newMeld(h, seat, c); h.melds.push(md); return md; });
  if (first) { h.opened[seat] = 'sets'; h.openedNow = true; h.mustOpen = false; }
  m.seq++;
  var ev = { t: 'open', seat: seat, melds: made.map(clone), total: total, first: first, kind: 'sets' };
  if (!h.hands[seat].length) return finishByMelds(m, seat, ev);
  return { ok: true, ev: ev };
}
/* {t:'pairs', pairs:[[a,b],...]} */
function actPairs(m, seat, pairs) {
  var h = m.h, ok = h.ok;
  if (m.status !== 'playing') return { ok: false, err: 'status' };
  if (h.turn !== seat || h.phase !== 'discard') return { ok: false, err: 'turn' };
  if (h.opened[seat] === 'sets') return { ok: false, err: 'setsonly' };
  if (!pairs || !pairs.length) return { ok: false, err: 'bad' };
  var all = [], cl = [], i;
  for (i = 0; i < pairs.length; i++) {
    var c = classifyPair(pairs[i], ok);
    if (!c) return { ok: false, err: 'invalid', group: i };
    cl.push(c); all = all.concat(pairs[i]);
  }
  if (!sameTiles(all, h.hands[seat])) return { ok: false, err: 'tile' };
  var first = !h.opened[seat];
  var have = h.melds.filter(function (x) { return x.owner === seat && x.kind === 'pair'; }).length;
  if (first && pairs.length < PAIRS_MIN) return { ok: false, err: 'fewpairs', n: pairs.length };
  all.forEach(function (id) { remove(h.hands[seat], id); remove(h.swapPending, id); });
  var made = cl.map(function (c) { var md = newMeld(h, seat, c); h.melds.push(md); return md; });
  if (first) { h.opened[seat] = 'pairs'; h.openedNow = true; h.mustOpen = false; }
  m.seq++;
  var ev = { t: 'open', seat: seat, melds: made.map(clone), total: have + pairs.length, first: first, kind: 'pairs' };
  if (!h.hands[seat].length) return finishByMelds(m, seat, ev);
  return { ok: true, ev: ev };
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* {t:'add', tile, meld:id, mode:'lo'|'hi'|'add'|'swap'} */
function actAdd(m, seat, tile, meldId, mode) {
  var h = m.h, ok = h.ok;
  if (m.status !== 'playing') return { ok: false, err: 'status' };
  if (h.turn !== seat || h.phase !== 'discard') return { ok: false, err: 'turn' };
  if (h.opened[seat] !== 'sets') return { ok: false, err: h.opened[seat] ? 'pairsonly' : 'notopen' };
  if (!has(h.hands[seat], tile)) return { ok: false, err: 'tile' };
  var md = null, i;
  for (i = 0; i < h.melds.length; i++) if (h.melds[i].id === meldId) md = h.melds[i];
  if (!md) return { ok: false, err: 'meld' };
  var opts = addOptions(md, tile, ok), pick = null;
  for (i = 0; i < opts.length; i++) if (!mode || opts[i].mode === mode) { pick = opts[i]; break; }
  if (!pick) return { ok: false, err: 'nofit' };
  remove(h.hands[seat], tile); remove(h.swapPending, tile);
  var got = applyAdd(md, tile, pick, ok);
  if (got >= 0) { h.hands[seat].push(got); h.swapPending.push(got); }
  m.seq++;
  var ev = { t: 'add', seat: seat, tile: tile, meld: md.id, mode: pick.mode, got: got, after: clone(md) };
  if (!h.hands[seat].length) return finishByMelds(m, seat, ev);
  return { ok: true, ev: ev };
}

function actDiscard(m, seat, tile) {
  var h = m.h;
  if (m.status !== 'playing') return { ok: false, err: 'status' };
  if (h.turn !== seat || h.phase !== 'discard') return { ok: false, err: 'turn' };
  if (!has(h.hands[seat], tile)) return { ok: false, err: 'tile' };
  if (h.mustOpen && !h.opened[seat]) return { ok: false, err: 'mustopen' };
  if (h.swapPending.length) {
    for (var i = 0; i < h.swapPending.length; i++) if (has(h.hands[seat], h.swapPending[i])) return { ok: false, err: 'swapjoker' };
  }
  var isJ = E.isJoker(tile, h.ok), last = h.hands[seat].length === 1;
  if (isJ && !last) return { ok: false, err: 'okey' };           // okey yalnızca bitirirken atılır
  remove(h.hands[seat], tile);
  h.discards[seat].push(tile);
  h.moves++;
  m.seq++;
  if (last) {
    var info = winInfo(m, seat, isJ);
    var ev0 = { t: 'finish', seat: seat, tile: tile, info: info };
    endHand(m, seat, info);
    return { ok: true, ev: ev0 };
  }
  h.turn = nextOf(seat); h.phase = 'draw'; h.drawn = -1;
  var ev = { t: 'discard', seat: seat, tile: tile };
  if (!h.pile.length) { endHand(m, null, null); ev.drawGame = true; }
  return { ok: true, ev: ev };
}
function winInfo(m, seat, okey) {
  var h = m.h;
  var pairs = h.opened[seat] === 'pairs', elden = h.openedNow && h.turns[seat] === 1 + (seat === m.starter ? 0 : 0) && h.melds.every(function (x) { return x.owner === seat; }) ;
  // "elden": ilk turunda açıp hepsini bitirmek
  elden = h.openedNow && h.turns[seat] <= 1 + 0 || (seat === m.starter && h.openedNow && h.turns[seat] === 0);
  elden = !!(h.openedNow && h.turns[seat] <= 1);
  var mult = (okey ? 2 : 1) * (pairs ? 2 : 1) * (elden ? 2 : 1);
  return { seat: seat, okey: !!okey, pairs: pairs, elden: elden, mult: mult, value: WIN_BONUS * mult };
}
function finishByMelds(m, seat, ev) {
  var info = winInfo(m, seat, false);
  ev.finish = { seat: seat, info: info };
  endHand(m, seat, info);
  return { ok: true, ev: ev };
}

function handPenalty(m, seat) {
  var h = m.h, ok = h.ok;
  if (!h.opened[seat]) return LOSE_UNOPENED;
  var sum = 0, extra = 0;
  h.hands[seat].forEach(function (id) { if (E.isJoker(id, ok)) extra += WIN_BONUS; else sum += tileValue(id, ok); });
  return sum + extra;
}

function endHand(m, winner, info) {
  var h = m.h, mult = info ? info.mult : 1, deltas = [0, 0, 0, 0], s;
  for (s = 0; s < 4; s++) {
    if (s === winner) deltas[s] = -WIN_BONUS * mult;
    else deltas[s] = handPenalty(m, s) * mult;
    m.scores[s] += deltas[s];
  }
  var res = { winner: winner, info: info, draw: winner === null, deltas: deltas, hands: h.hands.map(function (x) { return x.slice(); }),
              opened: h.opened.slice(), scores: m.scores.slice() };
  var cfg = m.cfg, done = false, mw = null;
  if (cfg.type === 'single') { done = true; }
  else if (cfg.type === 'hands' && m.handNo >= cfg.value) done = true;
  if (done) {
    var mn = Math.min.apply(null, m.scores);
    var cnt = m.scores.filter(function (x) { return x === mn; }).length;
    if (cnt === 1) mw = m.scores.indexOf(mn);
    else if (cfg.type === 'hands') done = false;       // eşitlik: bir el daha
    else mw = winner !== null ? winner : m.scores.indexOf(mn);
  }
  m.result = res;
  m.status = done ? 'matchEnd' : 'handEnd';
  m.matchWinner = done ? mw : null;
  m.seq++;
}

function apply(m, seat, a) {
  if (!a) return { ok: false, err: 'bad' };
  if (a.t === 'draw') return actDraw(m, seat, a.from);
  if (a.t === 'discard') return actDiscard(m, seat, a.tile);
  if (a.t === 'finish') return actDiscard(m, seat, a.tile);
  if (a.t === 'open') return actOpen(m, seat, a.sets);
  if (a.t === 'pairs') return actPairs(m, seat, a.pairs);
  if (a.t === 'add') return actAdd(m, seat, a.tile, a.meld, a.mode);
  return { ok: false, err: 'bad' };
}

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
    melds: clone(h.melds), opened: h.opened.slice(),
    mustOpen: h.turn === seat ? !!(h.mustOpen && !h.opened[seat]) : false,
    swapPending: h.turn === seat ? h.swapPending.slice() : [],
    result: m.status === 'playing' ? null : m.result
  };
}

root.OkeyEngine101 = {
  OPEN_MIN: OPEN_MIN, PAIRS_MIN: PAIRS_MIN, HAND_N: HAND_N, LOSE_UNOPENED: LOSE_UNOPENED, WIN_BONUS: WIN_BONUS,
  numVal: numVal, tileValue: tileValue, classify: classify, classifyPair: classifyPair,
  arrange: arrange, pairsOf: pairsOf, canOpen: canOpen, canOpenValue: canOpenValue,
  addOptions: addOptions, newMatch: newMatch, dealHand: dealHand, apply: apply, viewFor: viewFor,
  leftOf: leftOf, nextOf: nextOf, handPenalty: handPenalty
};
if (typeof module !== 'undefined' && module.exports) module.exports = root.OkeyEngine101;
})(typeof window !== 'undefined' ? window : globalThis);
