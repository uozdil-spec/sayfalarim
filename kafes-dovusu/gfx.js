/* Kafes Dövüşü · çizim katmanı: gradyanlı, ışık-gölgeli yarı gerçekçi sahne ve eklemli dövüşçüler (canvas 400x300). */
(function (root) {
'use strict';
var W = 400, H = 300, FY = 262, PI = Math.PI;
function rng(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
function mk(fn) { var o = document.createElement('canvas'); o.width = W; o.height = H; fn(o.getContext('2d')); return o; }
function lg(c, x0, y0, x1, y1, st) { var g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
function rg(c, x, y, r, st) { var g = c.createRadialGradient(x, y, 0, x, y, r); st.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
function parse(s) {
  if (s.charAt(0) === '#') { var n = parseInt(s.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  var m = s.match(/\d+/g); return [+m[0], +m[1], +m[2]];
}
function mix(h, t, to) { var a = parse(h), T = to === 'w' ? 255 : 0; return 'rgb(' + a.map(function (v) { return Math.round(v + (T - v) * t); }).join(',') + ')'; }
function rgba(h, a) { var p = parse(h); return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')'; }
function glow(c, x, y, r, col, a) { c.fillStyle = rg(c, x, y, r, [[0, rgba(col, a)], [1, rgba(col, 0)]]); c.fillRect(x - r, y - r, r * 2, r * 2); }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function noise(c, r, x0, y0, x1, y1, n) {
  for (var i = 0; i < n; i++) { c.fillStyle = r() > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; c.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 1 + r() * 2, 1); }
}
function ring(c, col) { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.ellipse(200, 264, 172, 30, 0, 0, PI * 2); c.stroke(); }

/* ---------- Mekanlar ---------- */
function car(c, x, by, w, col) {
  var h = w * .3, y = by - h;
  c.fillStyle = rg(c, x + w / 2, by, w * .6, [[0, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(x - 10, by - 6, w + 20, 14);
  c.fillStyle = lg(c, 0, y, 0, by, [[0, mix(col, .3, 'w')], [.55, col], [1, mix(col, .55, 'k')]]);
  rrect(c, x, y + h * .36, w, h * .62, 5); c.fill();
  c.beginPath(); c.moveTo(x + w * .19, y + h * .4); c.lineTo(x + w * .3, y); c.lineTo(x + w * .7, y); c.lineTo(x + w * .84, y + h * .4); c.closePath(); c.fill();
  c.fillStyle = lg(c, 0, y, 0, y + h * .4, [[0, '#8fb0c8'], [1, '#18222c']]);
  c.beginPath(); c.moveTo(x + w * .24, y + h * .38); c.lineTo(x + w * .32, y + h * .08); c.lineTo(x + w * .68, y + h * .08); c.lineTo(x + w * .78, y + h * .38); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + w * .49, y + h * .08, 2, h * .3);
  [.2, .79].forEach(function (k) {
    var wx = x + w * k, wy = by - h * .12;
    c.fillStyle = '#0b0b0d'; c.beginPath(); c.arc(wx, wy, h * .3, 0, PI * 2); c.fill();
    c.fillStyle = lg(c, wx - 4, wy - 4, wx + 4, wy + 4, [[0, '#b7bcc4'], [1, '#4a4f58']]); c.beginPath(); c.arc(wx, wy, h * .15, 0, PI * 2); c.fill();
  });
  c.fillStyle = '#ffe9a8'; c.fillRect(x + w - 3, y + h * .52, 3, 3); glow(c, x + w, y + h * .55, 14, '#ffe9a8', .25);
  c.fillStyle = '#d32f2f'; c.fillRect(x, y + h * .52, 3, 3);
}
function pillar(c, x, y0, w, y1, base, stripes) {
  c.fillStyle = lg(c, x, 0, x + w, 0, [[0, mix(base, .45, 'k')], [.3, mix(base, .25, 'w')], [.7, base], [1, mix(base, .55, 'k')]]); c.fillRect(x, y0, w, y1 - y0);
  c.fillStyle = 'rgba(0,0,0,.18)'; for (var i = 0; i < 6; i++) c.fillRect(x + 4 + i * (w / 6), y0, 1, y1 - y0);
  if (stripes) for (var j = 0; j < 5; j++) { c.fillStyle = j % 2 ? '#15161a' : '#e5b81d'; c.fillRect(x, y1 - 38 + j * 8, w, 8); }
}
var BG = [
mk(function (c) { /* OTOPARK */
  var r = rng(11);
  c.fillStyle = lg(c, 0, 0, 0, 230, [[0, '#0e1013'], [.35, '#2a2d33'], [1, '#575b63']]); c.fillRect(0, 0, W, 230);
  c.fillStyle = '#0a0b0d'; c.fillRect(0, 0, W, 34);
  car(c, 6, 214, 96, '#8e2a26'); car(c, 112, 216, 90, '#c6c9cf'); car(c, 232, 214, 100, '#2c4f86'); car(c, 338, 216, 70, '#d2b548');
  pillar(c, 60, 34, 28, 230, '#6f747d', true); pillar(c, 190, 34, 28, 230, '#6f747d', true); pillar(c, 316, 34, 28, 230, '#6f747d', true);
  [30, 150, 270, 350].forEach(function (x) { c.fillStyle = '#f6ffe0'; c.fillRect(x, 20, 52, 4); glow(c, x + 26, 22, 80, '#d6ffb0', .32); });
  c.fillStyle = '#1b56b3'; rrect(c, 104, 56, 26, 26, 3); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 20px Arial'; c.textAlign = 'center'; c.fillText('P', 117, 77);
  c.fillStyle = lg(c, 0, 230, 0, 300, [[0, '#2b2d32'], [1, '#101114']]); c.fillRect(0, 230, W, 70);
  noise(c, r, 0, 230, W, 300, 700);
  c.save(); c.beginPath(); c.rect(0, 230, W, 70); c.clip(); c.strokeStyle = 'rgba(235,235,225,.26)'; c.lineWidth = 2;
  for (var k = -7; k <= 7; k++) { c.beginPath(); c.moveTo(200 + k * 14, 150); c.lineTo(200 + k * 95, 300); c.stroke(); }
  c.restore();
  glow(c, 100, 250, 110, '#d6ffb0', .10); glow(c, 300, 252, 110, '#d6ffb0', .10);
  ring(c, 'rgba(217,171,76,.5)');
}),
mk(function (c) { /* KÖPRÜ ALTI */
  var r = rng(5), i, x;
  c.fillStyle = lg(c, 0, 0, 0, 160, [[0, '#04061a'], [.6, '#14214a'], [1, '#42426e']]); c.fillRect(0, 0, W, 160);
  for (i = 0; i < 50; i++) { c.fillStyle = 'rgba(255,255,255,' + (r() * .7) + ')'; c.fillRect(r() * W, r() * 90, 1, 1); }
  for (x = 0; x < W; x += 14) { var h = 10 + r() * 34; c.fillStyle = '#080d24'; c.fillRect(x, 156 - h, 13, h); for (i = 0; i < 4; i++) if (r() > .45) { c.fillStyle = 'rgba(243,201,106,.85)'; c.fillRect(x + 2 + (i % 2) * 5, 156 - h + 4 + Math.floor(i / 2) * 7, 2, 2); } }
  c.fillStyle = '#0a1030'; c.beginPath(); c.ellipse(262, 134, 30, 24, 0, PI, 0); c.fill(); c.fillRect(232, 134, 60, 22);
  [224, 300].forEach(function (mx) { c.fillStyle = '#0a1030'; c.fillRect(mx, 84, 5, 72); c.fillRect(mx - 2, 98, 9, 3); c.beginPath(); c.moveTo(mx - 1, 84); c.lineTo(mx + 2.5, 70); c.lineTo(mx + 6, 84); c.fill(); glow(c, mx + 2.5, 100, 10, '#f3c96a', .5); });
  glow(c, 262, 138, 60, '#f3c96a', .14);
  c.fillStyle = lg(c, 0, 156, 0, 230, [[0, '#121f48'], [1, '#050a1c']]); c.fillRect(0, 156, W, 74);
  for (i = 0; i < 90; i++) { c.fillStyle = 'rgba(' + (r() > .5 ? '243,201,106' : '255,138,80') + ',' + (.1 + r() * .2) + ')'; c.fillRect(r() * W, 158 + r() * 68, 1 + r() * 2, 2 + r() * 4); }
  for (i = 0; i < 40; i++) { var bx = i * 10, by = 130 + Math.sin(i * .45) * 8; c.fillStyle = '#ffe9b0'; c.fillRect(bx, by, 2, 2); glow(c, bx + 1, by + 1, 8, '#ffe9b0', .3); }
  c.fillStyle = '#080910'; c.fillRect(0, 0, W, 38);
  c.strokeStyle = '#1b1e29'; c.lineWidth = 3; for (x = -20; x < W + 20; x += 36) { c.beginPath(); c.moveTo(x, 6); c.lineTo(x + 18, 38); c.lineTo(x + 36, 6); c.stroke(); }
  c.fillStyle = lg(c, 0, 36, 0, 42, [[0, '#3a3f52'], [1, 'rgba(0,0,0,0)']]); c.fillRect(0, 36, W, 6);
  [90, 200, 310].forEach(function (lx) {
    c.fillStyle = '#ffd9a0'; c.fillRect(lx - 6, 38, 12, 4);
    c.fillStyle = lg(c, 0, 42, 0, 230, [[0, 'rgba(255,170,80,.26)'], [1, 'rgba(255,170,80,0)']]);
    c.beginPath(); c.moveTo(lx - 5, 42); c.lineTo(lx + 5, 42); c.lineTo(lx + 60, 230); c.lineTo(lx - 60, 230); c.fill();
    glow(c, lx, 42, 40, '#ffb347', .4);
  });
  pillar(c, -6, 36, 56, 230, '#454956'); pillar(c, 350, 36, 56, 230, '#454956');
  c.lineCap = 'round'; c.lineWidth = 5;
  [['#e4457b', 8, 100, 40, 94], ['#35c4d9', 10, 114, 44, 120], ['#f2c618', 12, 134, 38, 130]].forEach(function (g) { c.strokeStyle = g[0]; c.globalAlpha = .85; c.beginPath(); c.moveTo(g[1], g[2]); c.quadraticCurveTo((g[1] + g[3]) / 2, g[2] - 10, g[3], g[4]); c.stroke(); });
  c.globalAlpha = 1; c.fillStyle = 'rgba(255,255,255,.7)'; c.font = 'bold 12px Arial'; c.fillText('34', 364, 150);
  c.fillStyle = lg(c, 0, 230, 0, 300, [[0, '#1c1e27'], [1, '#07080b']]); c.fillRect(0, 230, W, 70);
  noise(c, r, 0, 230, W, 300, 600);
  [90, 200, 310].forEach(function (lx) { c.fillStyle = lg(c, lx - 18, 0, lx + 18, 0, [[0, 'rgba(255,170,80,0)'], [.5, 'rgba(255,170,80,.22)'], [1, 'rgba(255,170,80,0)']]); c.fillRect(lx - 18, 232, 36, 66); });
  ring(c, 'rgba(120,150,210,.5)');
}),
mk(function (c) { /* ORMAN */
  var r = rng(21), i, x;
  c.fillStyle = lg(c, 0, 0, 0, 230, [[0, '#06130a'], [.5, '#17391e'], [1, '#2d5a35']]); c.fillRect(0, 0, W, 230);
  for (i = 0; i < 18; i++) { x = i * 23 + r() * 10; c.fillStyle = 'rgba(14,38,22,.7)'; c.fillRect(x, 20, 5 + r() * 4, 210); }
  c.fillStyle = lg(c, 0, 120, 0, 230, [[0, 'rgba(180,220,190,0)'], [1, 'rgba(180,220,190,.18)']]); c.fillRect(0, 120, W, 110);
  [26, 118, 214, 312, 384].forEach(function (tx, k) {
    var w = 24 + (k % 3) * 6;
    c.fillStyle = lg(c, tx, 0, tx + w, 0, [[0, '#1a1209'], [.4, '#4c3724'], [1, '#150e07']]); c.fillRect(tx, 0, w, 232);
    c.fillStyle = 'rgba(0,0,0,.25)'; for (i = 0; i < 9; i++) c.fillRect(tx + 3 + r() * (w - 6), r() * 220, 1, 12 + r() * 30);
    c.fillStyle = '#4c3724'; c.beginPath(); c.moveTo(tx - 10, 232); c.quadraticCurveTo(tx + 2, 205, tx + 4, 190); c.lineTo(tx + w - 4, 190); c.quadraticCurveTo(tx + w - 2, 205, tx + w + 10, 232); c.fill();
  });
  for (i = 0; i < 9; i++) { var bx = i * 50 - 10, bg = rg(c, bx, 12, 60, [[0, 'rgba(46,112,64,.95)'], [1, 'rgba(10,36,18,0)']]); c.fillStyle = bg; c.fillRect(bx - 60, -50, 120, 130); }
  [[40, 30], [150, 18], [250, 36], [330, 20]].forEach(function (rx) {
    c.fillStyle = lg(c, 0, 0, 0, 240, [[0, 'rgba(255,238,170,.28)'], [1, 'rgba(255,238,170,0)']]);
    c.beginPath(); c.moveTo(rx[0], 0); c.lineTo(rx[0] + rx[1], 0); c.lineTo(rx[0] + rx[1] + 70, 240); c.lineTo(rx[0] + 40, 240); c.fill();
  });
  c.fillStyle = lg(c, 0, 230, 0, 300, [[0, '#33421c'], [1, '#101808']]); c.fillRect(0, 230, W, 70);
  for (i = 0; i < 380; i++) { c.strokeStyle = 'rgba(' + (r() > .5 ? '90,130,50' : '40,70,25') + ',.55)'; c.beginPath(); x = r() * W; var y = 230 + r() * 70; c.moveTo(x, y); c.lineTo(x + (r() - .5) * 4, y - 3 - r() * 5); c.stroke(); }
  for (i = 0; i < 90; i++) { c.fillStyle = r() > .5 ? '#b5651d' : '#d9a441'; c.fillRect(r() * W, 232 + r() * 66, 2, 1); }
  [[18, 284], [372, 288]].forEach(function (m) { c.fillStyle = '#e8e0cf'; c.fillRect(m[0] + 3, m[1], 4, 8); c.fillStyle = '#c93a30'; c.beginPath(); c.ellipse(m[0] + 5, m[1], 9, 6, 0, PI, 0); c.fill(); c.fillStyle = '#fff'; c.fillRect(m[0] + 2, m[1] - 4, 2, 2); c.fillRect(m[0] + 7, m[1] - 3, 2, 2); });
  ring(c, 'rgba(210,190,130,.45)');
})
];
var FENCE = mk(function (c) {
  c.strokeStyle = 'rgba(205,214,226,.24)'; c.lineWidth = 1;
  for (var x = -232; x < W; x += 11) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 232, 232); c.stroke(); c.beginPath(); c.moveTo(x + 232, 0); c.lineTo(x, 232); c.stroke(); }
  [74, 200, 326].forEach(function (bx) { c.fillStyle = lg(c, bx - 3, 0, bx + 3, 0, [[0, '#2b3038'], [.5, '#aab2be'], [1, '#2b3038']]); c.fillRect(bx - 3, 0, 6, 228); });
  c.fillStyle = lg(c, 0, 0, 0, 13, [[0, '#8c939e'], [.45, '#dde3ea'], [1, '#444a53']]); c.fillRect(0, 0, W, 13);
  c.fillStyle = lg(c, 0, 220, 0, 236, [[0, '#2f343d'], [1, '#0b0c0f']]); c.fillRect(0, 220, W, 16);
  c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, 221, W, 1);
});
var POSTS = mk(function (c) {
  c.fillStyle = lg(c, 0, 0, 18, 0, [[0, '#4b0f0c'], [.4, '#c83a30'], [1, '#6a1511']]); c.fillRect(0, 0, 18, H);
  c.fillStyle = lg(c, 382, 0, 400, 0, [[0, '#0f2a52'], [.6, '#2f68c0'], [1, '#0a1c38']]); c.fillRect(382, 0, 18, H);
  c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(4, 0, 3, H); c.fillRect(386, 0, 3, H);
  c.fillStyle = 'rgba(0,0,0,.35)'; [60, 130, 200].forEach(function (y) { c.fillRect(0, y, 18, 2); c.fillRect(382, y, 18, 2); });
});
var VIG = mk(function (c) { c.fillStyle = rg(c, 200, 150, 260, [[.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.6)']]); c.fillRect(0, 0, W, H); });

root.GFX = { W: W, H: H, FY: FY, BG: BG, FENCE: FENCE, POSTS: POSTS, VIG: VIG,
  T: { mk: mk, lg: lg, rg: rg, mix: mix, rgba: rgba, glow: glow, rrect: rrect, rng: rng, noise: noise, ring: ring, car: car, pillar: pillar, parse: parse } };
})(window);
