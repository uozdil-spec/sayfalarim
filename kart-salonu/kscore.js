/* Kart Salonu · ortak yardımcılar. Kart numarası: 0-51 (maça, kupa, karo, sinek x A..K), 52-53 joker. */
(function (root) {
'use strict';
var KS = root.KS = root.KS || {};
KS.engines = KS.engines || {};
KS.SUITN = ['Maça', 'Kupa', 'Karo', 'Sinek'];
KS.RN = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
KS.RNAME = ['', 'As', 'İkili', 'Üçlü', 'Dörtlü', 'Beşli', 'Altılı', 'Yedili', 'Sekizli', 'Dokuzlu', 'Onlu', 'Vale', 'Kız', 'Papaz'];
KS.rank = function (c) { return c >= 52 ? 0 : c % 13 + 1; };
KS.suit = function (c) { return c >= 52 ? -1 : Math.floor(c / 13); };
KS.isJoker = function (c) { return c >= 52; };
KS.make = function (s, r) { return s * 13 + r - 1; };
KS.red = function (c) { var s = KS.suit(c); return s === 1 || s === 2; };

/* Tohumlanabilir rastgelelik (testler için); varsayılan Math.random */
KS.rng = function (seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
KS.rnd = Math.random;
KS.setRnd = function (f) { KS.rnd = f || Math.random; };
KS.shuffle = function (a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(KS.rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
};
KS.deck = function (jokers) {
  var d = [], i;
  for (i = 0; i < 52; i++) d.push(i);
  if (jokers) { d.push(52); d.push(53); }
  return KS.shuffle(d);
};
KS.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
KS.zeros = function (n) { var a = [], i; for (i = 0; i < n; i++) a.push(0); return a; };
KS.sortHand = function (h, mode) {
  var a = h.slice();
  if (mode === 'none') return a;
  var order = [0, 1, 3, 2];                      // maça, kupa, sinek, karo: renkler dönüşümlü
  a.sort(function (x, y) {
    var sx = KS.suit(x), sy = KS.suit(y);
    if (sx < 0 || sy < 0) return sx < 0 ? (sy < 0 ? x - y : 1) : -1;
    if (mode === 'rank') { var rx = KS.rank(x), ry = KS.rank(y); return rx - ry || order.indexOf(sx) - order.indexOf(sy); }
    return order.indexOf(sx) - order.indexOf(sy) || KS.rank(x) - KS.rank(y);
  });
  return a;
};
KS.pick = function (arr) { return arr[Math.floor(KS.rnd() * arr.length)]; };
KS.cardName = function (c) { return c >= 52 ? 'Joker' : KS.SUITN[KS.suit(c)] + ' ' + KS.RN[KS.rank(c)]; };

/* Sıralı puan dağıtımı (eşitlikte ortalama) */
KS.rankPoints = function (vals, table, lowBest) {
  var n = vals.length, idx = [], i, out = [];
  for (i = 0; i < n; i++) idx.push(i);
  idx.sort(function (a, b) { return lowBest ? vals[a] - vals[b] : vals[b] - vals[a]; });
  i = 0;
  while (i < n) {
    var j = i;
    while (j + 1 < n && vals[idx[j + 1]] === vals[idx[i]]) j++;
    var s = 0, k;
    for (k = i; k <= j; k++) s += table[k];
    for (k = i; k <= j; k++) out[idx[k]] = s / (j - i + 1);
    i = j + 1;
  }
  return out;
};

if (typeof module !== 'undefined' && module.exports) module.exports = KS;
})(typeof window !== 'undefined' ? window : globalThis);
