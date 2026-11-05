/* Kafes Dövüşü · yeni mekânlar: 3 çay bahçesi, 4 pazar yeri, 5 iskele (gün batımı), 6 çatı (gece). */
(function (root) {
'use strict';
var G = root.GFX, T = G.T, W = G.W, H = G.H, PI = Math.PI;
var mk = T.mk, lg = T.lg, rg = T.rg, glow = T.glow, rrect = T.rrect, rng = T.rng, noise = T.noise, ring = T.ring, mix = T.mix;
function floorTex(c, r, top, bot, n) { c.fillStyle = lg(c, 0, 230, 0, 300, [[0, top], [1, bot]]); c.fillRect(0, 230, W, 70); noise(c, r, 0, 230, W, 300, n || 600); }
function seagull(c, x, y, s) { c.strokeStyle = 'rgba(20,20,30,.75)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s / 2, y - s / 1.6, x, y); c.quadraticCurveTo(x + s / 2, y - s / 1.6, x + s, y); c.stroke(); }

G.BG[3] = mk(function (c) { /* ÇAY BAHÇESİ */
  var r = rng(31), i, x;
  c.fillStyle = lg(c, 0, 0, 0, 160, [[0, '#5aa4dc'], [.7, '#bfe0f2'], [1, '#f4e9d0']]); c.fillRect(0, 0, W, 160);
  c.fillStyle = 'rgba(255,255,255,.7)'; [[60, 40, 36], [150, 28, 28], [300, 48, 40]].forEach(function (p) { for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(p[0] + i * 14, p[1] + (i % 2) * 5, p[2] * .6, 8, 0, 0, PI * 2); c.fill(); } });
  c.fillStyle = '#6f93a6'; c.beginPath(); c.moveTo(0, 150); for (x = 0; x <= W; x += 20) c.lineTo(x, 132 - Math.sin(x * .02) * 12 - r() * 5); c.lineTo(W, 150); c.fill();
  for (x = 20; x < W; x += 12) { c.fillStyle = r() > .5 ? '#d9d2c4' : '#c9b79a'; c.fillRect(x, 128 - r() * 10, 9, 14); }
  c.fillStyle = lg(c, 0, 142, 0, 232, [[0, '#2e79ad'], [1, '#14486e']]); c.fillRect(0, 142, W, 90);
  for (i = 0; i < 60; i++) { c.fillStyle = 'rgba(255,255,255,' + (.1 + r() * .25) + ')'; c.fillRect(r() * W, 146 + r() * 80, 6 + r() * 14, 1); }
  c.strokeStyle = '#3a4350'; c.lineWidth = 3; c.beginPath(); c.moveTo(60, 140); c.lineTo(340, 140); c.stroke(); c.lineWidth = 1.2;
  for (x = 80; x < 330; x += 18) { c.beginPath(); c.moveTo(x, 140); c.lineTo(x, 148); c.stroke(); }
  c.fillStyle = '#3a4350'; c.fillRect(100, 104, 4, 36); c.fillRect(300, 104, 4, 36); c.beginPath(); c.moveTo(102, 106); c.quadraticCurveTo(200, 142, 302, 106); c.strokeStyle = '#3a4350'; c.lineWidth = 1.6; c.stroke();
  c.fillStyle = lg(c, 0, 224, 0, 236, [[0, '#8a8f98'], [1, '#52565e']]); c.fillRect(0, 224, W, 12);
  [[26, 100], [376, 96]].forEach(function (t) { c.fillStyle = lg(c, t[0] - 12, 0, t[0] + 12, 0, [[0, '#2c2218'], [.5, '#6a4e34'], [1, '#2a1f14']]); c.fillRect(t[0] - 8, 70, 16, 170); for (i = 0; i < 7; i++) { var g = rg(c, t[0] + (r() - .5) * 90, 40 + r() * 36, 52, [[0, 'rgba(60,140,60,.95)'], [1, 'rgba(20,70,30,0)']]); c.fillStyle = g; c.fillRect(t[0] - 100, 0, 200, 130); } });
  for (i = 0; i < 16; i++) { c.fillStyle = 'rgba(255,230,160,.9)'; c.fillRect(40 + i * 22, 66 + Math.sin(i * .6) * 6, 3, 3); glow(c, 41 + i * 22, 67 + Math.sin(i * .6) * 6, 8, '#ffe7a0', .35); }
  [[110, 216], [200, 220], [290, 216]].forEach(function (p) { c.fillStyle = '#f0ede4'; c.beginPath(); c.ellipse(p[0], p[1] - 14, 22, 5, 0, 0, PI * 2); c.fill(); c.fillStyle = '#3a3a40'; c.fillRect(p[0] - 1.5, p[1] - 14, 3, 14); c.fillStyle = '#b3261e'; c.fillRect(p[0] - 5, p[1] - 22, 4, 8); c.fillStyle = 'rgba(255,200,120,.7)'; c.fillRect(p[0] - 4.5, p[1] - 21, 3, 6); c.fillStyle = '#e8e4d8'; c.fillRect(p[0] + 8, p[1] - 21, 5, 7); });
  seagull(c, 140, 50, 8); seagull(c, 270, 36, 6);
  floorTex(c, r, '#8a8578', '#4a463e', 800);
  c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1; for (i = 0; i < 9; i++) { c.beginPath(); c.moveTo(0, 236 + i * 8); c.lineTo(W, 236 + i * 8); c.stroke(); } for (x = -200; x < 600; x += 40) { c.beginPath(); c.moveTo(200 + (x - 200) * .45, 236); c.lineTo(x, 300); c.stroke(); }
  ring(c, 'rgba(235,205,120,.55)');
});

G.BG[4] = mk(function (c) { /* PAZAR YERİ */
  var r = rng(41), i, x;
  c.fillStyle = lg(c, 0, 0, 0, 230, [[0, '#9fb6c6'], [.5, '#c9bfb0'], [1, '#8b7f70']]); c.fillRect(0, 0, W, 230);
  for (x = 0; x < W; x += 40) { var h = 70 + r() * 40; c.fillStyle = ['#b9a58a', '#a9b5b0', '#c4b497', '#9fa8b8'][i = Math.floor(r() * 4)]; c.fillRect(x, 120 - h, 40, h + 60); c.fillStyle = 'rgba(40,50,70,.55)'; for (var j = 0; j < 3; j++) for (var k = 0; k < 2; k++) c.fillRect(x + 6 + k * 18, 120 - h + 8 + j * 22, 11, 14); }
  var cols = [['#c93232', '#f5f0e6'], ['#2e8a46', '#f5f0e6'], ['#d99a24', '#f5f0e6'], ['#2f62b8', '#f5f0e6'], ['#c93232', '#f5f0e6']];
  [[10, 86], [82, 80], [162, 88], [242, 82], [318, 84]].forEach(function (s, n) {
    var cc = cols[n], x0 = s[0], w = s[1] - 2, y0 = 104;
    c.fillStyle = '#3d3226'; c.fillRect(x0 + 2, y0, 3, 128); c.fillRect(x0 + w - 5, y0, 3, 128);
    for (var q = 0; q < 8; q++) { c.fillStyle = q % 2 ? cc[1] : cc[0]; c.beginPath(); c.moveTo(x0 + q * w / 8, y0); c.lineTo(x0 + (q + 1) * w / 8, y0); c.lineTo(x0 + (q + 1) * w / 8, y0 + 18); c.arc(x0 + (q + .5) * w / 8, y0 + 18, w / 16, 0, PI); c.lineTo(x0 + q * w / 8, y0 + 18); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x0, y0 + 24, w, 8);
    c.fillStyle = lg(c, 0, 184, 0, 232, [[0, '#6a4a2a'], [1, '#3a2814']]); c.fillRect(x0 + 2, 190, w - 4, 40);
    var pal = [['#d8321e', '#e8c21c', '#6cb23a'], ['#e8801c', '#d8321e', '#9bc53a'], ['#7a2a82', '#6cb23a', '#e8c21c'], ['#e8c21c', '#e8801c', '#d8321e'], ['#6cb23a', '#d8321e', '#e8801c']][n];
    for (q = 0; q < 30; q++) { c.fillStyle = pal[q % 3]; c.beginPath(); c.arc(x0 + 8 + (q * 7.3) % (w - 16), 186 + Math.floor(q / 11) * 5 + r() * 3, 4.2, 0, PI * 2); c.fill(); }
    c.fillStyle = '#f3efe2'; c.fillRect(x0 + 14, 150 + (n % 2) * 4, 20, 14); c.fillStyle = '#222'; c.font = 'bold 9px Arial'; c.textAlign = 'center'; c.fillText(['25', '40', '18', '60', '32'][n] + '₺', x0 + 24, 160 + (n % 2) * 4);
  });
  c.strokeStyle = '#2a2018'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 96); c.lineTo(W, 96); c.stroke();
  for (i = 0; i < 20; i++) { c.fillStyle = ['#e8c21c', '#d8321e', '#2e8a46', '#2f62b8'][i % 4]; c.beginPath(); c.moveTo(i * 21, 96); c.lineTo(i * 21 + 7, 96); c.lineTo(i * 21 + 3.5, 106); c.fill(); }
  glow(c, 200, 70, 150, '#fff2c8', .12);
  floorTex(c, r, '#575045', '#26231e', 900);
  for (i = 0; i < 26; i++) { c.fillStyle = 'rgba(' + (r() > .5 ? '150,110,70' : '90,130,60') + ',.6)'; c.fillRect(r() * W, 238 + r() * 56, 3 + r() * 5, 2); }
  c.fillStyle = 'rgba(255,255,255,.05)'; for (i = 0; i < 5; i++) c.fillRect(r() * 300, 244 + r() * 40, 90, 6);
  ring(c, 'rgba(235,150,70,.55)');
});

G.BG[5] = mk(function (c) { /* İSKELE (gün batımı) */
  var r = rng(51), i, x;
  c.fillStyle = lg(c, 0, 0, 0, 150, [[0, '#2c2a5c'], [.35, '#9a4a72'], [.7, '#f08a4a'], [1, '#ffd08a']]); c.fillRect(0, 0, W, 150);
  glow(c, 250, 128, 120, '#ffe0a0', .55); c.fillStyle = '#fff1c4'; c.beginPath(); c.arc(250, 130, 20, 0, PI * 2); c.fill();
  c.fillStyle = 'rgba(255,200,170,.45)'; for (i = 0; i < 3; i++) { c.beginPath(); c.ellipse(90 + i * 120, 60 + i * 12, 70, 6, 0, 0, PI * 2); c.fill(); }
  c.fillStyle = '#3a2a4a'; c.beginPath(); c.moveTo(0, 150); for (x = 0; x <= W; x += 16) c.lineTo(x, 136 - Math.sin(x * .03) * 9 - r() * 3); c.lineTo(W, 150); c.fill();
  [[30, 118], [66, 124], [330, 120]].forEach(function (m) { c.fillStyle = '#2f2140'; c.beginPath(); c.ellipse(m[0], m[1] + 10, 13, 10, 0, PI, 0); c.fill(); c.fillRect(m[0] - 12, m[1] + 10, 24, 12); c.fillRect(m[0] + 16, m[1] - 18, 3, 40); c.beginPath(); c.moveTo(m[0] + 15, m[1] - 18); c.lineTo(m[0] + 17.5, m[1] - 30); c.lineTo(m[0] + 20, m[1] - 18); c.fill(); });
  c.fillStyle = lg(c, 0, 148, 0, 232, [[0, '#e88a56'], [.4, '#8a4a68'], [1, '#2a2650']]); c.fillRect(0, 148, W, 84);
  for (i = 0; i < 70; i++) { c.fillStyle = 'rgba(255,' + (190 + Math.floor(r() * 40)) + ',120,' + (.15 + r() * .3) + ')'; c.fillRect(250 + (r() - .5) * 120 * (1 - r() * .4), 152 + r() * 70, 6 + r() * 14, 1.4); }
  c.fillStyle = '#231a34'; c.fillRect(40, 140, 120, 14); c.fillStyle = '#efe9e0'; c.fillRect(54, 126, 92, 14); c.fillRect(70, 114, 58, 12); c.fillStyle = '#c93a2a'; c.fillRect(96, 100, 10, 14); c.fillStyle = '#111'; c.fillRect(96, 100, 10, 4);
  c.fillStyle = '#34314a'; for (x = 58; x < 140; x += 12) c.fillRect(x, 130, 6, 5);
  seagull(c, 90, 44, 9); seagull(c, 140, 62, 6); seagull(c, 320, 40, 8);
  c.fillStyle = '#2b2122'; c.fillRect(0, 222, W, 14); [8, 92, 176, 260, 344].forEach(function (px) { c.fillStyle = '#3a2c24'; c.fillRect(px, 205, 8, 30); c.fillStyle = '#1c1514'; c.fillRect(px - 2, 205, 12, 4); });
  c.strokeStyle = '#d7cdb8'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(12, 208); for (x = 12; x < W; x += 84) c.quadraticCurveTo(x + 42, 220, x + 84, 208); c.stroke();
  floorTex(c, r, '#6a4e36', '#2a1d14', 300);
  for (i = 0; i < 10; i++) { c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 238 + i * 7); c.lineTo(W, 238 + i * 7); c.stroke(); }
  [60, 150, 250, 340].forEach(function (bx) { c.fillStyle = '#2a1d14'; c.fillRect(bx, 238, 1.4, 62); });
  c.fillStyle = 'rgba(255,170,100,.1)'; c.fillRect(0, 232, W, 20);
  [[34, 276], [362, 282]].forEach(function (b) { c.fillStyle = '#1e1e24'; c.fillRect(b[0], b[1] - 12, 9, 12); c.beginPath(); c.ellipse(b[0] + 4.5, b[1] - 12, 6, 3, 0, 0, PI * 2); c.fill(); });
  ring(c, 'rgba(255,200,130,.5)');
});

G.BG[6] = mk(function (c) { /* ÇATI (gece, İstanbul silueti) */
  var r = rng(61), i, x;
  c.fillStyle = lg(c, 0, 0, 0, 200, [[0, '#050818'], [.5, '#15204a'], [1, '#3a3560']]); c.fillRect(0, 0, W, 200);
  for (i = 0; i < 70; i++) { c.fillStyle = 'rgba(255,255,255,' + (r() * .8) + ')'; c.fillRect(r() * W, r() * 110, 1, 1); }
  glow(c, 330, 48, 70, '#cfd8ff', .35); c.fillStyle = '#eef1ff'; c.beginPath(); c.arc(330, 48, 14, 0, PI * 2); c.fill(); c.fillStyle = '#c9cfe8'; c.beginPath(); c.arc(334, 46, 12, 0, PI * 2); c.fill();
  c.fillStyle = '#0b1030'; c.fillRect(0, 150, W, 80);
  for (x = 0; x < W; x += 12) { var h = 8 + r() * 40; c.fillStyle = '#0b1030'; c.fillRect(x, 160 - h, 11, h + 70); for (i = 0; i < 3; i++) if (r() > .45) { c.fillStyle = 'rgba(255,214,120,.85)'; c.fillRect(x + 2 + (i % 2) * 5, 164 - h + Math.floor(i / 2) * 8, 2, 3); } }
  c.fillStyle = '#080c26'; c.beginPath(); c.moveTo(230, 160); c.lineTo(230, 96); c.lineTo(226, 96); c.lineTo(236, 70); c.lineTo(246, 96); c.lineTo(242, 96); c.lineTo(242, 160); c.fill(); c.fillRect(226, 96, 20, 6); glow(c, 236, 100, 14, '#ffd27a', .5);
  [[120, 150], [170, 146]].forEach(function (m) { c.fillStyle = '#080c26'; c.beginPath(); c.ellipse(m[0], m[1] - 12, 26, 20, 0, PI, 0); c.fill(); c.fillRect(m[0] - 26, m[1] - 12, 52, 30); [-34, 34].forEach(function (o) { c.fillRect(m[0] + o - 2, m[1] - 62, 4, 80); c.beginPath(); c.moveTo(m[0] + o - 3, m[1] - 62); c.lineTo(m[0] + o, m[1] - 76); c.lineTo(m[0] + o + 3, m[1] - 62); c.fill(); glow(c, m[0] + o, m[1] - 60, 7, '#ffd27a', .6); }); });
  c.fillStyle = 'rgba(60,70,130,.3)'; c.fillRect(0, 178, W, 60);
  c.fillStyle = '#1e222c'; c.fillRect(0, 196, W, 40); c.fillStyle = '#2a2f3c'; c.fillRect(0, 196, W, 4);
  c.fillStyle = '#2b303d'; rrect(c, 300, 142, 50, 56, 4); c.fill(); c.fillStyle = '#20242f'; for (i = 0; i < 4; i++) c.fillRect(300, 152 + i * 12, 50, 3);
  c.strokeStyle = '#3a4050'; c.lineWidth = 2; for (x = 40; x < 100; x += 20) { c.beginPath(); c.moveTo(x, 196); c.lineTo(x + 6, 120); c.stroke(); } c.beginPath(); c.moveTo(40, 130); c.lineTo(100, 124); c.moveTo(42, 148); c.lineTo(96, 142); c.stroke();
  c.fillStyle = '#ff2f6a'; c.font = '700 20px Oswald, Arial'; c.textAlign = 'center'; c.fillText('KAFES', 200, 214); glow(c, 200, 208, 60, '#ff2f6a', .35);
  c.fillStyle = '#1a1d26'; c.fillRect(0, 218, W, 18); c.fillStyle = '#3a4050'; c.fillRect(0, 216, W, 3);
  floorTex(c, r, '#3a3e48', '#14161c', 1000);
  c.fillStyle = 'rgba(120,150,255,.07)'; for (i = 0; i < 6; i++) c.fillRect(r() * W, 240 + r() * 50, 60, 10);
  [[22, 262, 26], [374, 270, 20]].forEach(function (p) { c.fillStyle = '#2a2e38'; c.fillRect(p[0] - p[2] / 2, p[1] - p[2], p[2], p[2]); c.fillStyle = '#4a5060'; c.fillRect(p[0] - p[2] / 2, p[1] - p[2], p[2], 3); });
  ring(c, 'rgba(100,220,255,.5)');
});
})(window);
