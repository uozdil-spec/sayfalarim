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

/* ---------- Dövüşçüler ---------- */
var LOOKS = {
  muhendis: { name: 'Mühendis', skin: '#d9a37a', skin2: '#b27a52', hair: '#2a1c12', shirt: '#e9e6df', vest: '#ef8420', pants: '#2e4163', glove: '#c8312a', shoe: '#18181a', hat: 'hard', hatc: '#f2c11c', build: 1, sleeve: 0 },
  zabita: { name: 'Zabıta', skin: '#c8946b', skin2: '#9d6c46', hair: '#141110', shirt: '#1d3560', pants: '#131c32', glove: '#2a2a2e', shoe: '#0c0c0d', hat: 'cap', hatc: '#16264a', must: 1, whistle: 1, build: 1.08, sleeve: 1 },
  mudure: { name: 'Müdire', skin: '#efc3a0', skin2: '#c9976f', hair: '#3b2416', shirt: '#7c2c58', pants: '#25252d', glove: '#d9a93a', shoe: '#1c1c20', hat: 'bun', glasses: 1, build: .92, sleeve: 1, blazer: 1 },
  bahcivan: { name: 'Bahçıvan', skin: '#b57d54', skin2: '#8a5836', hair: '#9a9a9a', shirt: '#3f6a3b', pants: '#5a4a2e', glove: '#7a4c26', shoe: '#2a1c10', hat: 'straw', hatc: '#e3c26c', beard: 1, build: 1.2, sleeve: 0, strap: 1 }
};
function mkF(x, look) { return { x: x, look: look, st: 'idle', ph: Math.random() * 6, flash: 0, p: { lean: 0, bob: 0, crouch: 0, step: 0, hd: 0, fx: 27, fy: -6, rx: 15, ry: 6, rot: 0 } }; }
function pose(f, dt, tm) {
  var st = f.st, s = Math.sin(tm * 5 + f.ph), s2 = Math.sin(tm * 2.5 + f.ph);
  var T = { lean: 0, bob: s * 1.6, crouch: 0, step: 0, hd: 0, fx: 27, fy: -6 + s * 1.5, rx: 15, ry: 6, rot: 0 }, k = 14;
  if (st === 'wind' || st === 'sp') { T = { lean: -7, bob: 0, crouch: 2, step: -5, hd: -2, fx: -8, fy: -4, rx: 24, ry: -10, rot: 0 }; if (st === 'sp') { T.fx = -2; T.fy = -30; } k = 16; }
  else if (st === 'strike' || st === 'spstrike') { T = { lean: 9, bob: 0, crouch: 3, step: 18, hd: 3, fx: 52, fy: -2, rx: 12, ry: -8, rot: 0 }; k = 46; }
  else if (st === 'block') { T = { lean: 3, bob: s * .8, crouch: 4, step: 2, hd: -1, fx: 19, fy: -15, rx: 25, ry: -9, rot: 0 }; k = 22; }
  else if (st === 'hit') { T = { lean: -11, bob: 0, crouch: 0, step: -8, hd: -8, fx: 6, fy: 16, rx: 0, ry: 18, rot: 0 }; k = 30; }
  else if (st === 'stun') { T = { lean: -4 + s2 * 5, bob: 0, crouch: 3, step: -2, hd: -3 + s2 * 4, fx: 8, fy: 18, rx: 2, ry: 20, rot: 0 }; k = 10; }
  else if (st === 'ko') { T = { lean: -6, bob: 0, crouch: 0, step: -3, hd: -3, fx: 6, fy: 16, rx: 0, ry: 18, rot: 1.48 }; k = 6; }
  var q = Math.min(1, dt * k), p = f.p, key;
  for (key in T) p[key] += (T[key] - p[key]) * (key === 'rot' ? Math.min(1, dt * 5) : q);
}
function ik(a, b, l1, l2, kind) {
  var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = l1 + l2 - .5;
  if (d > m) { dx *= m / d; dy *= m / d; d = m; b = { x: a.x + dx, y: a.y + dy }; }
  if (d < 1) d = 1;
  var aa = Math.atan2(dy, dx), cb = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))), th = Math.acos(cb);
  var e1 = { x: a.x + Math.cos(aa + th) * l1, y: a.y + Math.sin(aa + th) * l1 }, e2 = { x: a.x + Math.cos(aa - th) * l1, y: a.y + Math.sin(aa - th) * l1 };
  var pick = kind === 'leg' ? (e1.x > e2.x ? e1 : e2) : (e1.y > e2.y ? e1 : e2);
  return { e: pick, h: b };
}
function limb(c, a, b, w, col, hi) {
  c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  if (hi) { c.strokeStyle = hi; c.lineWidth = w * .32; c.beginPath(); c.moveTo(a.x - w * .15, a.y - w * .15); c.lineTo(b.x - w * .15, b.y - w * .15); c.stroke(); }
}
function star(c, x, y, r) { c.strokeStyle = '#ffd23f'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke(); }
function glove(c, h, e, col, Q) {
  var dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
  c.strokeStyle = Q('#e9e5da'); c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(h.x + dx / d * 6, h.y + dy / d * 6); c.lineTo(h.x + dx / d * 10, h.y + dy / d * 10); c.stroke();
  c.fillStyle = rg(c, h.x - 3, h.y - 3, 14, [[0, Q(col, .45, 'w')], [.6, Q(col)], [1, Q(col, .5, 'k')]]); c.beginPath(); c.arc(h.x, h.y, 8.5, 0, PI * 2); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.arc(h.x + 2, h.y - 1, 5, -.6, 1.4); c.stroke();
}
function paper(c, h, big) {
  c.save(); c.translate(h.x + 6, h.y - 4); c.rotate(big ? .15 : -.25);
  c.fillStyle = '#f7f4ea'; c.fillRect(-9, -12, 18, 24); c.strokeStyle = '#9a958a'; c.lineWidth = 1;
  for (var i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-6, -8 + i * 4); c.lineTo(6, -8 + i * 4); c.stroke(); }
  c.fillStyle = '#c33'; c.fillRect(2, 5, 5, 5); c.restore();
}

function drawFighter(c, f, dir, tm) {
  var L = f.look, P = f.p, st = f.st, B = L.build || 1, fl = f.flash > 0;
  function Q(h, a, to) { var s = a ? mix(h, a, to) : h; return fl ? mix(s, .72, 'w') : s; }
  c.save();
  c.translate(f.x, FY);
  c.save(); c.scale(1, .2); c.fillStyle = rg(c, 0, 0, 38, [[0, 'rgba(0,0,0,.65)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(-38, -38, 76, 76); c.restore();
  c.scale(dir, 1);
  if (P.rot > .02) { c.translate(0, -3); c.rotate(-P.rot); }
  var hip = { x: -2 + P.step * .4 + P.lean * .15, y: -54 + P.bob * .5 + P.crouch };
  var sh = { x: hip.x + 3 + P.lean * .7, y: -91 + P.bob + P.crouch * 1.3 };
  var hd = { x: sh.x + 3 + P.hd + P.lean * .2, y: sh.y - 17 };
  var kf = ik(hip, { x: 15 + P.step, y: 0 }, 27, 27, 'leg'), kr = ik(hip, { x: -15 + P.step * .3, y: 0 }, 27, 27, 'leg');
  var af = ik(sh, { x: sh.x + P.fx, y: sh.y + P.fy }, 23, 21, 'arm'), ar = ik(sh, { x: sh.x + P.rx, y: sh.y + P.ry }, 23, 21, 'arm');
  var sleeveC = L.sleeve ? L.shirt : L.skin, skinC = Q(L.skin), skinHi = Q(L.skin, .25, 'w');
  /* arka kol */
  limb(c, sh, ar.e, 11 * B, Q(L.sleeve ? L.shirt : (L.vest || L.shirt), .35, 'k'), null);
  limb(c, ar.e, ar.h, 8.5, L.sleeve ? Q(L.shirt, .35, 'k') : Q(L.skin, .3, 'k'), null);
  glove(c, ar.h, ar.e, L.glove, function (h, a, t) { return Q(h, a ? a + .15 : .2, t || 'k'); });
  /* arka bacak */
  limb(c, hip, kr.e, 15 * B, Q(L.pants, .3, 'k'), null); limb(c, kr.e, kr.h, 12 * B, Q(L.pants, .3, 'k'), null);
  c.fillStyle = Q(L.shoe, .1, 'k'); c.beginPath(); c.ellipse(kr.h.x + 3, kr.h.y - 3, 11, 5.5, 0, 0, PI * 2); c.fill();
  /* gövde */
  var tw = 10 * B, hw = 8.5 * B;
  c.beginPath(); c.moveTo(sh.x - tw, sh.y + 1); c.quadraticCurveTo(sh.x - 1, sh.y - 6, sh.x + tw - 1, sh.y + 1);
  c.lineTo(hip.x + hw, hip.y + 3); c.lineTo(hip.x - hw, hip.y + 3); c.closePath();
  var body = L.vest || L.shirt;
  c.fillStyle = lg(c, sh.x - tw, 0, sh.x + tw, 0, [[0, Q(body, .45, 'k')], [.5, Q(body)], [1, Q(body, .3, 'w')]]); c.fill();
  c.save(); c.clip();
  if (L.vest) { c.fillStyle = Q('#ecebe2'); c.fillRect(sh.x - 14, sh.y + 11, 30, 4); c.fillRect(sh.x - 14, sh.y + 24, 30, 4); c.fillStyle = Q(L.shirt); c.fillRect(sh.x + 3, sh.y - 2, 3, 16); }
  if (L.blazer) { c.strokeStyle = Q(L.shirt, .5, 'k'); c.lineWidth = 2; c.beginPath(); c.moveTo(sh.x + 3, sh.y); c.lineTo(sh.x + 1, sh.y + 22); c.stroke(); c.fillStyle = Q('#f1eee6'); c.beginPath(); c.moveTo(sh.x + 1, sh.y); c.lineTo(sh.x + 7, sh.y); c.lineTo(sh.x + 2, sh.y + 15); c.fill(); }
  if (L.strap) { c.fillStyle = Q('#5a3a1e'); c.fillRect(sh.x + 1, sh.y, 4, 36); c.fillRect(sh.x - 8, sh.y, 4, 36); }
  if (L.whistle) { c.strokeStyle = Q('#e8e8e8'); c.lineWidth = 1; c.beginPath(); c.moveTo(sh.x + 4, sh.y + 1); c.lineTo(sh.x + 6, sh.y + 14); c.stroke(); c.fillStyle = Q('#e8e8e8'); c.fillRect(sh.x + 4, sh.y + 13, 5, 3); c.fillStyle = Q('#d8b13a'); c.beginPath(); c.arc(sh.x + 5, sh.y + 20, 2, 0, PI * 2); c.fill(); }
  c.restore();
  c.fillStyle = Q('#1a1a1c'); c.fillRect(hip.x - hw, hip.y + 1, hw * 2, 4);
  /* ön bacak */
  limb(c, hip, kf.e, 15 * B, Q(L.pants), Q(L.pants, .22, 'w')); limb(c, kf.e, kf.h, 12 * B, Q(L.pants), Q(L.pants, .22, 'w'));
  c.fillStyle = Q(L.shoe); c.beginPath(); c.ellipse(kf.h.x + 4, kf.h.y - 3, 12, 6, 0, 0, PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(kf.h.x - 3, kf.h.y - 7, 9, 1.5);
  /* boyun + kafa */
  limb(c, { x: sh.x + 1, y: sh.y - 2 }, { x: hd.x - 1, y: hd.y + 8 }, 8, Q(L.skin, .2, 'k'), null);
  c.fillStyle = Q(L.skin, .25, 'k'); c.beginPath(); c.ellipse(hd.x - 6, hd.y + 1, 2.6, 4, 0, 0, PI * 2); c.fill();
  c.fillStyle = rg(c, hd.x + 3, hd.y - 4, 17, [[0, skinHi], [.55, skinC], [1, Q(L.skin2)]]); c.beginPath(); c.ellipse(hd.x, hd.y, 10.5 * (B > 1.1 ? 1.05 : 1), 12, 0, 0, PI * 2); c.fill();
  var angry = st === 'wind' || st === 'strike' || st === 'sp' || st === 'spstrike', hurtF = st === 'hit' || st === 'stun';
  if (L.hat === 'bun') { c.fillStyle = Q(L.hair); c.beginPath(); c.ellipse(hd.x - 1, hd.y - 5, 11, 8, 0, PI, 0); c.fill(); c.beginPath(); c.arc(hd.x - 10, hd.y - 11, 6, 0, PI * 2); c.fill(); c.fillRect(hd.x - 11, hd.y - 6, 5, 10); }
  else { c.fillStyle = Q(L.hair); c.beginPath(); c.ellipse(hd.x - 2, hd.y - 6, 10.5, 7, 0, PI, 0); c.fill(); c.fillRect(hd.x - 11, hd.y - 6, 4, 9); }
  /* yüz */
  if (st === 'ko') { c.strokeStyle = '#111'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hd.x + 2, hd.y - 4); c.lineTo(hd.x + 7, hd.y); c.moveTo(hd.x + 7, hd.y - 4); c.lineTo(hd.x + 2, hd.y); c.stroke(); }
  else {
    c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(hd.x + 5, hd.y - 2, 3.2, hurtF ? 1.2 : 2.3, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#1a1210'; c.beginPath(); c.arc(hd.x + 6, hd.y - 2, 1.4, 0, PI * 2); c.fill();
  }
  c.strokeStyle = Q(L.hair); c.lineWidth = 2; c.beginPath(); c.moveTo(hd.x + 1.5, hd.y - 6 - (angry ? 0 : 1)); c.lineTo(hd.x + 8.5, hd.y - 6 + (angry ? 2.6 : (hurtF ? -1.5 : 0))); c.stroke();
  c.fillStyle = Q(L.skin2); c.globalAlpha = .55; c.beginPath(); c.moveTo(hd.x + 9, hd.y - 1); c.lineTo(hd.x + 13, hd.y + 4); c.lineTo(hd.x + 8, hd.y + 4); c.fill(); c.globalAlpha = 1;
  if (L.must) { c.fillStyle = Q('#16110e'); c.fillRect(hd.x + 3, hd.y + 5, 9, 2.6); }
  if (st === 'hit' || st === 'stun') { c.fillStyle = '#5a1511'; c.beginPath(); c.ellipse(hd.x + 7, hd.y + 8, 2.6, 2.2, 0, 0, PI * 2); c.fill(); }
  else { c.strokeStyle = '#7a2b22'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hd.x + 4, hd.y + 8); c.lineTo(hd.x + 9, hd.y + 8 + (angry ? 1 : 0)); c.stroke(); }
  if (L.beard) { c.fillStyle = Q('#bdbdbd'); c.beginPath(); c.moveTo(hd.x - 6, hd.y + 2); c.quadraticCurveTo(hd.x - 4, hd.y + 17, hd.x + 5, hd.y + 16); c.quadraticCurveTo(hd.x + 12, hd.y + 12, hd.x + 11, hd.y + 4); c.lineTo(hd.x + 5, hd.y + 6); c.quadraticCurveTo(hd.x, hd.y + 4, hd.x - 6, hd.y + 2); c.fill(); }
  if (L.glasses) { c.strokeStyle = '#1b1b1f'; c.lineWidth = 1.2; c.fillStyle = 'rgba(190,225,255,.28)'; c.beginPath(); c.ellipse(hd.x + 5.5, hd.y - 2, 4.2, 3.4, 0, 0, PI * 2); c.fill(); c.stroke(); c.beginPath(); c.moveTo(hd.x + 1.2, hd.y - 2); c.lineTo(hd.x - 8, hd.y - 3); c.stroke(); }
  /* şapka */
  if (L.hat === 'hard' && st !== 'ko') {
    c.fillStyle = lg(c, hd.x - 12, hd.y - 20, hd.x + 12, hd.y - 6, [[0, Q(L.hatc, .35, 'w')], [1, Q(L.hatc, .25, 'k')]]); c.beginPath(); c.ellipse(hd.x + 1, hd.y - 8, 13.5, 11, 0, PI, 0); c.fill();
    c.fillStyle = Q(L.hatc, .3, 'k'); c.fillRect(hd.x - 13, hd.y - 8.5, 31, 3.2); c.fillStyle = Q(L.hatc, .15, 'k'); c.fillRect(hd.x - 1, hd.y - 19, 4, 11);
  } else if (L.hat === 'cap') {
    c.fillStyle = lg(c, hd.x - 12, hd.y - 20, hd.x + 12, hd.y - 6, [[0, Q(L.hatc, .35, 'w')], [1, Q(L.hatc, .3, 'k')]]); c.beginPath(); c.ellipse(hd.x, hd.y - 8, 12.5, 10, 0, PI, 0); c.fill(); c.fillRect(hd.x - 12.5, hd.y - 9, 25, 3);
    c.fillStyle = Q('#0c0c0e'); c.beginPath(); c.moveTo(hd.x + 6, hd.y - 8); c.lineTo(hd.x + 20, hd.y - 6); c.lineTo(hd.x + 6, hd.y - 5); c.fill();
    c.fillStyle = Q('#d8b13a'); c.beginPath(); c.arc(hd.x + 4, hd.y - 13, 2.2, 0, PI * 2); c.fill();
  } else if (L.hat === 'straw') {
    c.fillStyle = lg(c, hd.x - 22, 0, hd.x + 22, 0, [[0, Q(L.hatc, .3, 'k')], [.5, Q(L.hatc, .2, 'w')], [1, Q(L.hatc, .25, 'k')]]); c.beginPath(); c.ellipse(hd.x + 1, hd.y - 8, 23, 5, 0, 0, PI * 2); c.fill();
    c.fillStyle = Q(L.hatc); c.beginPath(); c.ellipse(hd.x + 1, hd.y - 9, 11.5, 11, 0, PI, 0); c.fill(); c.fillStyle = Q('#7a4a22'); c.fillRect(hd.x - 10.5, hd.y - 11, 23, 3);
  }
  /* ön kol + eldiven */
  limb(c, sh, af.e, 11.5 * B, Q(L.sleeve ? L.shirt : (L.vest || L.shirt)), Q(L.sleeve ? L.shirt : (L.vest || L.shirt), .25, 'w'));
  limb(c, af.e, af.h, 9, L.sleeve ? Q(L.shirt) : skinC, L.sleeve ? Q(L.shirt, .25, 'w') : skinHi);
  if (st === 'wind' || st === 'strike') { var pulse = .35 + .25 * Math.sin(tm * 30); glow(c, af.h.x, af.h.y, 26, st === 'wind' ? '#ff4a3a' : '#ffd23f', pulse); }
  glove(c, af.h, af.e, L.glove, Q);
  if (st === 'sp' || st === 'spstrike') paper(c, af.h, st === 'spstrike');
  /* efektler */
  if (st === 'block') { c.fillStyle = 'rgba(90,169,230,.22)'; c.strokeStyle = 'rgba(140,200,255,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(sh.x + 8, sh.y - 6, 34, -1.1, 1.1); c.stroke(); c.lineTo(sh.x + 8, sh.y - 6); c.fill(); }
  if (st === 'stun') for (var i = 0; i < 3; i++) { var a = tm * 5 + i * 2.1; star(c, hd.x + Math.cos(a) * 15, hd.y - 17 + Math.sin(a) * 4, 3); }
  c.restore();
}
function bang(c, x, y, tm) {
  var s = 1 + .12 * Math.sin(tm * 24);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#000'; c.beginPath(); c.moveTo(0, -17); c.lineTo(16, 10); c.lineTo(-16, 10); c.closePath(); c.fill();
  c.fillStyle = '#ff3b30'; c.beginPath(); c.moveTo(0, -12); c.lineTo(11.5, 7); c.lineTo(-11.5, 7); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.fillRect(-1.6, -6, 3.2, 8); c.fillRect(-1.6, 3.5, 3.2, 2.6);
  c.restore();
}
function drawPart(c, p) {
  var a = Math.max(0, p.life / p.max);
  c.save(); c.globalAlpha = a;
  if (p.k === 'spark') { c.strokeStyle = p.c; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .04, p.y - p.vy * .04); c.stroke(); }
  else if (p.k === 'paper') { c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = '#f7f4ea'; c.fillRect(-5, -4, 10, 8); c.fillStyle = '#9a958a'; c.fillRect(-3, -1, 6, 1); c.fillRect(-3, 2, 6, 1); }
  else if (p.k === 'ring') { c.strokeStyle = p.c; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, (1 - a) * 28 + 4, 0, PI * 2); c.stroke(); }
  else { c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.r || 2, 0, PI * 2); c.fill(); }
  c.restore();
}
/* V: {bg,a,b,flip,parts,pops,shake,tm,warn} — a sol, b sağ (dünya konumu) */
function render(c, V) {
  c.save();
  if (V.shake > 0) c.translate(((Math.random() - .5) * V.shake * 2) | 0, ((Math.random() - .5) * V.shake * 2) | 0);
  if (V.flip) { c.translate(W, 0); c.scale(-1, 1); }
  c.drawImage(BG[V.bg], 0, 0); c.drawImage(FENCE, 0, 0);
  var order = [[V.a, 1], [V.b, -1]];
  order.sort(function (p, q) { return (/strike/.test(p[0].st) ? 1 : 0) - (/strike/.test(q[0].st) ? 1 : 0); });
  order.forEach(function (o) { drawFighter(c, o[0], o[1], V.tm); });
  V.parts.forEach(function (p) { drawPart(c, p); });
  c.drawImage(POSTS, 0, 0);
  c.restore();
  c.drawImage(VIG, 0, 0);
  var opp = V.flip ? V.a : V.b;
  if (V.warn && (opp.st === 'wind' || opp.st === 'sp')) bang(c, V.flip ? W - opp.x : opp.x, FY - 140, V.tm);
  c.font = '700 17px Oswald, Arial Narrow, sans-serif'; c.textAlign = 'center'; c.lineJoin = 'round';
  V.pops.forEach(function (p) {
    var x = Math.max(40, Math.min(360, V.flip ? W - p.x : p.x)); c.globalAlpha = Math.min(1, p.t * 2.2);
    c.strokeStyle = '#000'; c.lineWidth = 4; c.strokeText(p.txt, x, p.y); c.fillStyle = p.col; c.fillText(p.txt, x, p.y);
  });
  c.globalAlpha = 1;
}
root.GFX = { W: W, H: H, FY: FY, LOOKS: LOOKS, mkF: mkF, pose: pose, render: render };
})(window);
