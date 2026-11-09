/* Kart Salonu · kart yüzleri (SVG), kart arkaları, simgeler */
(function (root) {
'use strict';
var BR = root.BR;
var C = BR.cards = {};

/* ---- Takım simgeleri (sprite) ---- */
var SPRITE =
'<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
'<symbol id="su0" viewBox="0 0 100 100"><path d="M50 3C60 26 93 40 93 63C93 77 82 86 70 86C62 86 56 82 53 77C54 86 58 93 67 97L33 97C42 93 46 86 47 77C44 82 38 86 30 86C18 86 7 77 7 63C7 40 40 26 50 3Z"/></symbol>' +
'<symbol id="su1" viewBox="0 0 100 100"><path d="M50 94C20 70 5 52 5 33C5 18 16 8 29 8C39 8 46 14 50 22C54 14 61 8 71 8C84 8 95 18 95 33C95 52 80 70 50 94Z"/></symbol>' +
'<symbol id="su2" viewBox="0 0 100 100"><path d="M50 3C58 24 74 40 93 50C74 60 58 76 50 97C42 76 26 60 7 50C26 40 42 24 50 3Z"/></symbol>' +
'<symbol id="su3" viewBox="0 0 100 100"><circle cx="50" cy="27" r="20"/><circle cx="26" cy="62" r="20"/><circle cx="74" cy="62" r="20"/><path d="M50 40C50 70 47 84 38 97L62 97C53 84 50 70 50 40Z"/><rect x="38" y="44" width="24" height="24"/></symbol>' +
'</defs></svg>';

C.init = function () {
  if (document.getElementById('brSprite')) return;
  var d = document.createElement('div');
  d.id = 'brSprite'; d.innerHTML = SPRITE; d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  document.body.insertBefore(d, document.body.firstChild);
};
function su(s, cls) { return '<svg class="' + (cls || 'su') + '" viewBox="0 0 100 100"><use href="#su' + s + '" xlink:href="#su' + s + '"/></svg>'; }
C.su = su;

/* ---- Sayı kartları: yer imi koordinatları (x: %, y: %) ---- */
var L = 35, M = 50, R = 65;
var PIPS = {
  2: [[M, 22], [M, 78]],
  3: [[M, 22], [M, 50], [M, 78]],
  4: [[L, 22], [R, 22], [L, 78], [R, 78]],
  5: [[L, 22], [R, 22], [M, 50], [L, 78], [R, 78]],
  6: [[L, 22], [R, 22], [L, 50], [R, 50], [L, 78], [R, 78]],
  7: [[L, 22], [R, 22], [M, 36], [L, 50], [R, 50], [L, 78], [R, 78]],
  8: [[L, 22], [R, 22], [M, 36], [L, 50], [R, 50], [M, 64], [L, 78], [R, 78]],
  9: [[L, 20], [R, 20], [L, 40], [R, 40], [M, 50], [L, 60], [R, 60], [L, 80], [R, 80]],
  10: [[L, 20], [R, 20], [M, 30], [L, 40], [R, 40], [L, 60], [R, 60], [M, 70], [L, 80], [R, 80]]
};

/* ---- Resimli kartlar (Vale, Kız, Papaz): simetrik madalyon ---- */
function figure(rk, s) {
  var red = s === 1 || s === 2;
  var robe = red ? '#a8232c' : '#1d2a4d', robe2 = red ? '#7d1820' : '#12193a', trim = '#d7ad4b';
  var skin = '#f2d6b6', line = '#6e4f33';
  var g = '';
  // omuz / cüppe
  g += '<path d="M6 50C7 37 18 32 30 32C42 32 53 37 54 50Z" fill="' + robe + '"/>';
  g += '<path d="M6 50C7 37 18 32 30 32L30 50Z" fill="' + robe2 + '" opacity=".35"/>';
  g += '<path d="M21 33.5L30 44L39 33.5" fill="none" stroke="' + trim + '" stroke-width="1.6" stroke-linejoin="round"/>';
  g += '<path d="M6 50C7 37 18 32 30 32C42 32 53 37 54 50" fill="none" stroke="' + trim + '" stroke-width="1"/>';
  // boyun, yüz
  g += '<rect x="26.5" y="28" width="7" height="6" rx="2" fill="#e3c19d"/>';
  g += '<ellipse cx="30" cy="21.5" rx="7.4" ry="8.8" fill="' + skin + '" stroke="' + line + '" stroke-width=".5"/>';
  // saç / sakal / başlık
  if (rk === 11) { // Vale: kısa saç, tüylü kep
    g += '<path d="M22.2 21C21 12 26 9.2 30 9.2C35 9.2 39.4 12.4 37.8 21C36 16.5 33 14.8 30 14.8C27 14.8 23.6 16.5 22.2 21Z" fill="#6b4524"/>';
    g += '<path d="M21 14.5C22 7.5 28 5 33 5.6C38 6.2 40.5 10 39 14.5C35 11 26 11 21 14.5Z" fill="' + robe + '" stroke="' + trim + '" stroke-width=".8"/>';
    g += '<path d="M36 7C42 2 48 6 49 11C44 8 41 9 38 11Z" fill="#f4efe4" stroke="#b7ab92" stroke-width=".4"/>';
  } else if (rk === 12) { // Kız: uzun saç, tiara
    g += '<path d="M22.4 21.5C20 10 26 6.8 30 6.8C34 6.8 40 10 37.6 21.5C38.8 28 40.8 32 41.6 38C37 36 36.2 30 35 24C34 19 32 15.5 30 15.5C28 15.5 26 19 25 24C23.8 30 23 36 18.4 38C19.2 32 21.2 28 22.4 21.5Z" fill="#8a5a2c"/>';
    g += '<path d="M23 12.4L25.6 7.6L28 11L30 5.8L32 11L34.4 7.6L37 12.4C34 10.6 26 10.6 23 12.4Z" fill="' + trim + '" stroke="#8a6420" stroke-width=".5"/>';
    g += '<circle cx="30" cy="8" r="1.1" fill="#d6303a"/>';
  } else { // Papaz: taç, sakal
    g += '<path d="M22.4 20C21 11 26 8.6 30 8.6C34 8.6 39 11 37.6 20C36.6 15.6 33.5 14.6 30 14.6C26.5 14.6 23.4 15.6 22.4 20Z" fill="#5f4a35"/>';
    g += '<path d="M22.6 23.5C22.8 32 26 34 30 34C34 34 37.2 32 37.4 23.5C36 28 33.5 29.4 30 29.4C26.5 29.4 24 28 22.6 23.5Z" fill="#5f4a35"/>';
    g += '<path d="M21.5 12.5L22.5 5L26 9L30 3.8L34 9L37.5 5L38.5 12.5Z" fill="' + trim + '" stroke="#8a6420" stroke-width=".6"/>';
    g += '<circle cx="30" cy="4.6" r="1.1" fill="#d6303a"/>';
  }
  // yüz çizgileri
  g += '<circle cx="27" cy="21" r=".8" fill="#3a2a1c"/><circle cx="33" cy="21" r=".8" fill="#3a2a1c"/>';
  g += '<path d="M27.6 26C29.2 27 30.8 27 32.4 26" fill="none" stroke="#a5513f" stroke-width=".7" stroke-linecap="round"/>';
  // eşya
  if (rk === 13) { // kılıç
    g += '<rect x="47" y="17" width="2.6" height="31" rx="1" fill="#cfd5db" stroke="#7b8590" stroke-width=".4"/><rect x="43.5" y="34" width="9.6" height="2.4" rx="1.2" fill="' + trim + '"/><circle cx="48.3" cy="49" r="1.8" fill="' + trim + '"/>';
  } else if (rk === 12) { // gül
    g += '<path d="M12 49C12 43 13 40 14.5 36" fill="none" stroke="#2f7a3d" stroke-width="1.4" stroke-linecap="round"/><circle cx="14.4" cy="34.5" r="3.6" fill="#d6303a" stroke="#8d1420" stroke-width=".5"/><path d="M12.4 34.4C13.6 32.8 15.6 33 16.4 34.6" fill="none" stroke="#f08a8a" stroke-width=".6"/><path d="M12 45C9.5 44 9 41.5 10 40.5C12 41 12.6 43 12 45Z" fill="#3e9650"/>';
  } else { // alebard
    g += '<rect x="47.6" y="14" width="1.9" height="35" rx=".8" fill="#8b6a42"/><path d="M49 15C55 15 56 22 49 25Z" fill="#cfd5db" stroke="#7b8590" stroke-width=".5"/><path d="M47.6 16L48.5 10.5L49.5 16Z" fill="#cfd5db" stroke="#7b8590" stroke-width=".4"/>';
  }
  g += '<g fill="' + trim + '" opacity=".9"><circle cx="30" cy="40" r="1.1"/><circle cx="30" cy="45" r="1.1"/></g>';
  return g;
}
function faceArt(rk, s) {
  var red = s === 1 || s === 2, c = red ? '#c2323a' : '#1b2240';
  var bg = red ? '#fbe9e3' : '#e9edf6';
  var f = figure(rk, s);
  return '<svg class="art" viewBox="0 0 60 100" preserveAspectRatio="xMidYMid meet">' +
    '<rect x="1" y="1" width="58" height="98" rx="2" fill="#fffaf0" stroke="' + c + '" stroke-width=".8"/>' +
    '<path d="M1 99L1 1L59 1Z" fill="' + bg + '"/>' +
    '<g>' + f + '<g fill="' + c + '" transform="translate(7 43) scale(.11)">' + '<use href="#su' + s + '" xlink:href="#su' + s + '" width="100" height="100"/></g></g>' +
    '<g transform="rotate(180 30 50)">' + f + '<g fill="' + c + '" transform="translate(7 43) scale(.11)"><use href="#su' + s + '" xlink:href="#su' + s + '" width="100" height="100"/></g></g>' +
    '<path d="M1 50L59 50" stroke="' + c + '" stroke-width=".4" opacity=".35"/>' +
    '</svg>';
}

var JOKER_ART = '<svg class="art" viewBox="0 0 60 100"><rect x="1" y="1" width="58" height="98" rx="2" fill="#fffaf0" stroke="#7a3fa0" stroke-width=".8"/>' +
  '<path d="M30 12L36 30L56 30L40 42L46 62L30 50L14 62L20 42L4 30L24 30Z" fill="#d9a93f" stroke="#8a6420" stroke-width=".8"/>' +
  '<circle cx="30" cy="80" r="9" fill="#7a3fa0"/><circle cx="26" cy="78" r="1.4" fill="#fff"/><circle cx="34" cy="78" r="1.4" fill="#fff"/><path d="M25 83C28 86 32 86 35 83" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/></svg>';

C.faceHTML = function (c) {
  if (c >= 52) {
    return '<div class="face joker"><div class="cn tl"><b>★</b></div><div class="cn br"><b>★</b></div>' + JOKER_ART + '</div>';
  }
  var s = BR.suit(c), r = BR.rank(c), t = BR.RN[r];
  var cls = 'face s' + s + ' r' + r;
  var h = '<div class="' + cls + '">';
  h += '<div class="cn tl"><b' + (t.length > 1 ? ' class="two"' : '') + '>' + t + '</b>' + su(s) + '</div>';
  h += '<div class="cn br"><b' + (t.length > 1 ? ' class="two"' : '') + '>' + t + '</b>' + su(s) + '</div>';
  if (r === 1) {
    h += '<div class="pips"><span class="pp big" style="left:50%;top:50%">' + su(s) + '</span></div>';
  } else if (r >= 11) {
    h += faceArt(r, s);
  } else {
    var P = PIPS[r], i;
    h += '<div class="pips">';
    for (i = 0; i < P.length; i++) {
      h += '<span class="pp' + (P[i][1] > 50 ? ' fl' : '') + '" style="left:' + P[i][0] + '%;top:' + P[i][1] + '%">' + su(s) + '</span>';
    }
    h += '</div>';
  }
  return h + '</div>';
};

/* Bir kart öğesi: ön yüz + arka yüz. face=null ise yalnızca arka. */
C.el = function (c) {
  var e = document.createElement('div');
  e.className = 'card';
  var inner = document.createElement('div');
  inner.className = 'in';
  inner.innerHTML = (c >= 0 ? C.faceHTML(c) : '') + '<div class="back"><i></i></div>';
  e.appendChild(inner);
  return e;
};

/* ---- Simgeler (24x24, çizgi) ---- */
var ICONS = {
  home: '<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  shrink: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M18.5 5.5l-1.9 1.9M7.4 16.6l-1.9 1.9"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.4C9.5 7.9 10.6 7 12 7c1.5 0 2.7 1 2.7 2.4 0 1.9-2.7 2.1-2.7 4.2"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  sound: '<path d="M4 9.5v5h3.6L12.5 19V5L7.6 9.5z"/><path d="M16 9c1.3 1.6 1.3 4.4 0 6M18.6 6.6c2.6 3 2.6 7.8 0 10.8"/>',
  mute: '<path d="M4 9.5v5h3.6L12.5 19V5L7.6 9.5z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19c0-3.4 2.7-5.5 6-5.5s6 2.1 6 5.5"/><path d="M16 5.6a3 3 0 0 1 0 5.8M18 14c2 .7 3.2 2.4 3.2 5"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
  userplus: '<circle cx="9.5" cy="8.5" r="3.2"/><path d="M3.5 19c0-3.4 2.7-5.5 6-5.5s6 2.1 6 5.5"/><path d="M19 8v6M16 11h6"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/><path d="M15.5 8.5V6.2a2 2 0 0 0-2-2H6.2a2 2 0 0 0-2 2v7.3a2 2 0 0 0 2 2h2.3"/>',
  share: '<circle cx="6.5" cy="12" r="2.3"/><circle cx="17.5" cy="6.5" r="2.3"/><circle cx="17.5" cy="17.5" r="2.3"/><path d="M8.5 11l7-3.3M8.5 13l7 3.3"/>',
  check: '<path d="M5 12.5l4.6 4.6L19 7.6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chat: '<path d="M4 5.5h16v11H12l-4.5 3.5v-3.5H4z"/>',
  send: '<path d="M4 12l16-7-6 15-2.6-6.4z"/>',
  bot: '<rect x="5" y="8" width="14" height="10.5" rx="3"/><path d="M12 8V4.5"/><circle cx="12" cy="4" r="1"/><circle cx="9.3" cy="13" r="1.1" fill="currentColor"/><circle cx="14.7" cy="13" r="1.1" fill="currentColor"/>',
  crown: '<path d="M4 18.5L3.2 8l5 4.2L12 5.5l3.8 6.7 5-4.2L20 18.5z"/>',
  cards: '<rect x="3.6" y="6" width="10.2" height="14" rx="2" transform="rotate(-12 8.7 13)"/><rect x="9.6" y="4.6" width="10.2" height="14" rx="2" transform="rotate(10 14.7 11.6)"/>',
  eye: '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  undo: '<path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h8.5a5.5 5.5 0 0 1 0 11"/>',
  bolt: '<path d="M13 3L5.5 13.5H11L10 21l8-11h-5.6z"/>',
  wifi: '<path d="M3 9.2C8 4.6 16 4.6 21 9.2M6 12.7c3.4-2.9 8.6-2.9 12 0M9 16.2c1.7-1.3 4.3-1.3 6 0"/><circle cx="12" cy="19" r=".8" fill="currentColor"/>',
  trash: '<path d="M5 7h14M9.5 7V4.8h5V7M7 7l.8 12.2h8.4L17 7"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.700l1-1"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.8" r=".7" fill="currentColor"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 1.6 2.2 2.4 3.5 2.4s2.5-.8 3.5-2.4"/><circle cx="9" cy="9.6" r=".9" fill="currentColor"/><circle cx="15" cy="9.6" r=".9" fill="currentColor"/>',
  trophy: '<path d="M7.5 4.5h9v4.5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.8c0 3 1.3 4.4 3 4.6M16.5 6h2.7c0 3-1.3 4.4-3 4.6M12 13.5v3.2M8.5 19.5h7M9.5 16.7h5"/>',
  refresh: '<path d="M19.5 8A8 8 0 0 0 5 9.5M4.5 16A8 8 0 0 0 19 14.5"/><path d="M19.5 3.8V8h-4.2M4.5 20.2V16h4.2"/>'
};
C.icon = function (n, cls) {
  return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';
};
C.hasIcon = function (n) { return !!ICONS[n]; };

if (typeof module !== 'undefined' && module.exports) module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis);
