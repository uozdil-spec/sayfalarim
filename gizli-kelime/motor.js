/* Gizli Kelime · oyun mantığı: sözlük, renk hesabı, zor mod, günün kelimesi, bilgisayar oyuncusu  (by uozdil) */
(function (root) {
'use strict';
var GK = root.GK = root.GK || {};
var sets = {}, arrs = {};

GK.up = function (s) { return String(s).replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase(); };
GK.low = function (s) { return String(s).replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase(); };
GK.LETTERS = 'abcçdefgğhıijklmnoöprsştuüvyz';

function cut(str, n) { var o = [], i; for (i = 0; i + n <= str.length; i += n) o.push(str.substr(i, n)); return o; }
GK.answers = function (len) { if (!arrs[len]) arrs[len] = cut(GK.A[len] || '', len); return arrs[len]; };
GK.isWord = function (w) {
  var n = w.length, s = sets[n], i, a;
  if (!s) { if (!GK.W[n]) return false; s = sets[n] = {}; a = cut(GK.W[n], n); for (i = 0; i < a.length; i++) s['_' + a[i]] = 1; }
  return s['_' + w] === 1;
};

/* anlamlar (anlam.js sonradan yüklenir) */
var MM = null;
GK.meaning = function (w) {
  if (!MM) {
    if (!GK.MT) return '';
    MM = {}; var L = GK.MT.split('\n'), i, k;
    for (i = 0; i < L.length; i++) { k = L[i].indexOf('\t'); if (k > 0) MM['_' + L[i].slice(0, k)] = L[i].slice(k + 1); }
  }
  return MM['_' + w] || '';
};

/* renkler: '2' doğru yerde, '1' kelimede var ama yeri yanlış, '0' yok */
GK.evalGuess = function (g, s) {
  var n = s.length, r = [], left = {}, i, c;
  for (i = 0; i < n; i++) { if (g.charAt(i) === s.charAt(i)) r[i] = '2'; else { r[i] = '0'; c = s.charAt(i); left[c] = (left[c] || 0) + 1; } }
  for (i = 0; i < n; i++) if (r[i] === '0') { c = g.charAt(i); if (left[c] > 0) { r[i] = '1'; left[c]--; } }
  return r.join('');
};
/* bulunan (yeşil) harfler */
GK.known = function (rows, len, first) {
  var k = [], i, r, j;
  for (i = 0; i < len; i++) k.push('');
  if (first) k[0] = first;
  for (r = 0; r < rows.length; r++) if (rows[r].w) for (j = 0; j < len; j++) if (rows[r].m.charAt(j) === '2') k[j] = rows[r].w.charAt(j);
  return k;
};
/* klavye renkleri */
GK.keyStates = function (rows) {
  var st = {}, r, j, c, v;
  for (r = 0; r < rows.length; r++) if (rows[r].w) for (j = 0; j < rows[r].w.length; j++) { c = rows[r].w.charAt(j); v = +rows[r].m.charAt(j); if (st[c] === undefined || v > st[c]) st[c] = v; }
  return st;
};
/* zor mod: bulunan ipuçları sonraki tahminde kullanılmalı. Sorun yoksa '' döner. */
GK.hardCheck = function (rows, w) {
  var r, j, need, c, cnt, k;
  for (r = 0; r < rows.length; r++) {
    if (!rows[r].w) continue;
    need = {};
    for (j = 0; j < w.length; j++) {
      c = rows[r].w.charAt(j);
      if (rows[r].m.charAt(j) === '2') { if (w.charAt(j) !== c) return (j + 1) + '. harf ' + GK.up(c) + ' olmalı'; need[c] = (need[c] || 0) + 1; }
      else if (rows[r].m.charAt(j) === '1') need[c] = (need[c] || 0) + 1;
    }
    for (c in need) { cnt = 0; for (k = 0; k < w.length; k++) if (w.charAt(k) === c) cnt++; if (cnt < need[c]) return 'Tahminde ' + GK.up(c) + ' harfi olmalı'; }
  }
  return '';
};
GK.consistent = function (rows, c) { for (var i = 0; i < rows.length; i++) if (rows[i].w && GK.evalGuess(rows[i].w, c) !== rows[i].m) return false; return true; };
/* ipuçlarına uyan olası gizli kelimeler */
GK.candidates = function (len, rows, first) {
  return GK.answers(len).filter(function (c) { return (!first || c.charAt(0) === first) && GK.consistent(rows, c); });
};

/* bilgisayar oyuncusu: diff 1 kolay, 2 orta, 3 usta */
GK.botPick = function (len, rows, first, diff) {
  var A = GK.answers(len), used = {}, kn = GK.known(rows, len, first), slop = [0, .55, .25, .04][diff] || .25, i;
  for (i = 0; i < rows.length; i++) used[rows[i].w] = 1;
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var strict = A.filter(function (c) { return !used[c] && (!first || c.charAt(0) === first) && GK.consistent(rows, c); });
  if (Math.random() < slop || !strict.length) {
    var loose = A.filter(function (c) { if (used[c]) return false; for (var j = 0; j < len; j++) if (kn[j] && c.charAt(j) !== kn[j]) return false; return true; });
    if (loose.length) return pick(loose);
  }
  return strict.length ? pick(strict) : pick(A);
};

/* günün kelimesi: tarihe göre herkese aynı 5 harfli kelime */
function prng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul ? Math.imul(a ^ a >>> 15, 1 | a) : ((a ^ a >>> 15) * (1 | a)) | 0; t = t + (Math.imul ? Math.imul(t ^ t >>> 7, 61 | t) : ((t ^ t >>> 7) * (61 | t)) | 0) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
GK.dayNo = function (d) { d = d || new Date(); return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 10, 11)) / 864e5) + 1; };
var dailyOrder = null;
GK.dailyWord = function (no) {
  if (!dailyOrder) {
    var a = GK.answers(5).slice(), r = prng(20261111), i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    dailyOrder = a;
  }
  return dailyOrder[((no - 1) % dailyOrder.length + dailyOrder.length) % dailyOrder.length];
};
GK.points = function (tries, k) { return 10 * (tries - k + 1); };
})(window);
