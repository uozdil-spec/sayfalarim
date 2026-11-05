/* 101 Okey bilgisayar oyuncusu — her çağrıda tek hamle döndürür (draw/open/pairs/add/discard). */
(function (root) {
'use strict';
var E = root.OkeyEngine || (typeof require !== 'undefined' ? require('./engine.js') : null);
var G = root.OkeyEngine101 || (typeof require !== 'undefined' ? require('./engine101.js') : null);
var BUDGET = 30000;

function ident(id, ok) {
  if (E.isFake(id)) return { c: ok.color, n: ok.num };
  return { c: E.colorOf(id), n: E.numOf(id) };
}
function rnd(rng) { return (rng || Math.random)(); }

/* Elde kalacak (kullanılmayan) bir taşın "tutma" puanı: yüksek = tut */
function keepScore(id, hand, ok) {
  if (E.isJoker(id, ok)) return 999;
  var a = ident(id, ok), s = 0, i;
  for (i = 0; i < hand.length; i++) {
    var b = hand[i];
    if (b === id || E.isJoker(b, ok)) continue;
    var q = ident(b, ok);
    if (q.c === a.c) {
      var d = Math.abs(q.n - a.n);
      if (d === 0) s += 4;
      else if (d === 1 || d === 12) s += 3;
      else if (d === 2 || d === 11) s += 1.5;
    } else if (q.n === a.n) s += 2;
  }
  return s - G.numVal(a.n) * 0.12;
}

/* Masadaki dizilere işlenebilir mi? */
function fitsTable(id, view) {
  for (var i = 0; i < view.melds.length; i++)
    if (view.melds[i].kind !== 'pair' && G.addOptions(view.melds[i], id, view.ok).length) return true;
  return false;
}

function decideDraw(view, seat, level, rng) {
  var hand = view.hand, ok = view.ok;
  var left = view.discards[G.leftOf(seat)], top = left.length ? left[left.length - 1] : -1;
  if (top < 0) return 'pile';
  if (!view.pile) return 'discard';
  var opened = view.opened[seat], base, gain;
  if (!opened) {
    // yalnızca hemen açabiliyorsak al (motor da başka türlü izin vermez)
    if (!G.canOpen(hand.concat([top]), ok)) return 'pile';
    if (G.canOpen(hand, ok)) return 'pile';        // zaten açabiliyorsak çekmeden de olur
    return level === 'easy' && rnd(rng) < 0.4 ? 'pile' : 'discard';
  }
  if (opened === 'pairs') return 'pile';
  if (level === 'easy') return rnd(rng) < 0.15 && fitsTable(top, view) ? 'discard' : 'pile';
  if (fitsTable(top, view)) return 'discard';
  base = G.arrange(hand, ok, BUDGET).total;
  gain = G.arrange(hand.concat([top]), ok, BUDGET).total - base;
  return gain > 0 ? 'discard' : 'pile';
}

function pickDiscard(view, seat, level, rng, hand) {
  var ok = view.ok, opened = view.opened[seat], pool = hand.slice(), i;
  var rest;
  if (opened === 'pairs') {
    var pa = G.pairsOf(hand, ok);
    rest = pa.rest;
  } else {
    rest = G.arrange(hand, ok, BUDGET).rest;
  }
  rest = rest.filter(function (id) { return !E.isJoker(id, ok); });
  if (!rest.length) rest = hand.filter(function (id) { return !E.isJoker(id, ok); });
  if (!rest.length) return hand[0];
  if (level === 'easy' && rnd(rng) < 0.35) return rest[Math.floor(rnd(rng) * rest.length)];
  // masadaki dizilere uyanları (rakip işleyebilir) mümkünse atma
  var safe = level === 'easy' ? rest : rest.filter(function (id) { return !fitsTable(id, view); });
  var cand = safe.length ? safe : rest;
  var best = cand[0], bs = 1e9;
  for (i = 0; i < cand.length; i++) {
    var s = keepScore(cand[i], pool, ok) + (level === 'hard' ? 0 : (rnd(rng) - 0.5) * 0.6);
    if (s < bs) { bs = s; best = cand[i]; }
  }
  return best;
}

function chooseAction(view, seat, level, rng) {
  level = level || 'medium';
  var ok = view.ok, hand = view.hand, opened = view.opened[seat], i, j;
  if (view.phase === 'draw') {
    var from = decideDraw(view, seat, level, rng);
    return { t: 'draw', from: from };
  }
  // --- elde bekleyen okey değişimi: önce yerleştir
  var pend = view.swapPending || [];
  for (i = 0; i < pend.length; i++) {
    if (hand.indexOf(pend[i]) < 0) continue;
    for (j = 0; j < view.melds.length; j++) {
      var mm = view.melds[j];
      if (mm.kind === 'pair') continue;
      var o = G.addOptions(mm, pend[i], ok).filter(function (x) { return x.mode !== 'swap'; });
      if (o.length && opened === 'sets') return { t: 'add', tile: pend[i], meld: mm.id, mode: o[0].mode };
    }
    var ar0 = G.arrange(hand, ok, BUDGET);
    if (ar0.sets.length) return { t: 'open', sets: ar0.sets.map(function (x) { return x.ids; }) };
  }
  if (!opened) {
    var ar = G.arrange(hand, ok, BUDGET);
    if (ar.total >= G.OPEN_MIN && ar.sets.length) return { t: 'open', sets: ar.sets.map(function (x) { return x.ids; }) };
    var pa = G.pairsOf(hand, ok);
    if (pa.pairs.length >= G.PAIRS_MIN) return { t: 'pairs', pairs: pa.pairs };
  } else if (opened === 'pairs') {
    var pb = G.pairsOf(hand, ok);
    if (pb.pairs.length) return { t: 'pairs', pairs: pb.pairs };
  } else {
    // açığız: elde işlenebilen taş var mı? (okey değişimi dahil)
    if (level !== 'easy' || rnd(rng) < 0.5) {
      var jokerFits = false, t, mi;
      for (i = 0; i < hand.length; i++) {
        t = hand[i];
        var isJ = E.isJoker(t, ok);
        for (mi = 0; mi < view.melds.length; mi++) {
          var md = view.melds[mi];
          if (md.kind === 'pair') continue;
          var opts = G.addOptions(md, t, ok);
          for (j = 0; j < opts.length; j++) {
            if (opts[j].mode === 'swap') {
              // değiştirip çıkan okeyi başka yere koyabiliyorsak
              var okFit = view.melds.some(function (o2) { return o2 !== md && o2.kind !== 'pair' && G.addOptions(o2, md.tiles[opts[j].index], ok).length; });
              if (okFit) return { t: 'add', tile: t, meld: md.id, mode: 'swap' };
            } else if (!isJ || hand.length === 1) {
              return { t: 'add', tile: t, meld: md.id, mode: opts[j].mode };
            }
          }
        }
      }
      // yeni per koyma
      var ar2 = G.arrange(hand, ok, BUDGET);
      if (ar2.sets.length && (ar2.rest.length >= 1 || ar2.sets.length)) {
        // en az bir taş elde kalıp atılacaksa ya da hepsi bitiyorsa koy
        return { t: 'open', sets: ar2.sets.map(function (x) { return x.ids; }) };
      }
    }
  }
  if (hand.length === 1) return { t: 'discard', tile: hand[0] };
  return { t: 'discard', tile: pickDiscard(view, seat, level, rng, hand) };
}

root.OkeyAI101 = { chooseAction: chooseAction, keepScore: keepScore };
if (typeof module !== 'undefined' && module.exports) module.exports = root.OkeyAI101;
})(typeof window !== 'undefined' ? window : globalThis);
