/* Kafes Dövüşü · üç yeni mekân: 7 şantiye (gündüz, vinç), 8 metro peronu, 9 hayvanat bahçesi. */
(function (root) {
'use strict';
var G = root.GFX, T = G.T, W = G.W, H = G.H, PI = Math.PI;
var mk = T.mk, lg = T.lg, rg = T.rg, glow = T.glow, rrect = T.rrect, rng = T.rng, noise = T.noise, ring = T.ring;
function floorTex(c, r, top, bot, n) { c.fillStyle = lg(c, 0, 230, 0, 300, [[0, top], [1, bot]]); c.fillRect(0, 230, W, 70); noise(c, r, 0, 230, W, 300, n || 600); }
function cloud(c, x, y, s) { c.fillStyle = 'rgba(255,255,255,.75)'; for (var i = 0; i < 4; i++) { c.beginPath(); c.ellipse(x + i * s * .45, y + (i % 2) * s * .12, s * .5, s * .26, 0, 0, PI * 2); c.fill(); } }

G.BG[7] = mk(function (c) { /* ŞANTİYE */
  var r = rng(71), i, x, y;
  c.fillStyle = lg(c, 0, 0, 0, 200, [[0, '#6aa9e0'], [.7, '#cfe4f1'], [1, '#efe7d4']]); c.fillRect(0, 0, W, 200);
  cloud(c, 40, 36, 60); cloud(c, 250, 56, 70);
  [[0, 90, 70], [64, 60, 90], [310, 80, 70], [356, 56, 80]].forEach(function (b) {
    c.fillStyle = lg(c, b[0], 0, b[0] + b[1], 0, [[0, '#a8a79f'], [1, '#85847c']]); c.fillRect(b[0], 210 - b[2] - 30, b[1], b[2] + 30);
    c.fillStyle = 'rgba(30,40,55,.55)'; for (y = 0; y < b[2] - 6; y += 14) for (x = 6; x < b[1] - 10; x += 14) c.fillRect(b[0] + x, 184 - b[2] + y, 8, 8);
    c.strokeStyle = '#6a3a22'; c.lineWidth = 1; for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(b[0] + 6 + i * 12, 180 - b[2]); c.lineTo(b[0] + 6 + i * 12, 170 - b[2]); c.stroke(); }
  });
  c.strokeStyle = '#d99a1c'; c.lineWidth = 4; c.beginPath(); c.moveTo(150, 214); c.lineTo(150, 24); c.moveTo(166, 214); c.lineTo(166, 24); c.stroke();
  c.lineWidth = 1.4; for (y = 214; y > 26; y -= 14) { c.beginPath(); c.moveTo(150, y); c.lineTo(166, y - 14); c.moveTo(166, y); c.lineTo(150, y - 14); c.stroke(); }
  c.fillStyle = '#d99a1c'; c.fillRect(20, 24, 290, 8); c.strokeStyle = '#d99a1c'; c.lineWidth = 1.2; for (x = 24; x < 306; x += 14) { c.beginPath(); c.moveTo(x, 32); c.lineTo(x + 7, 24); c.lineTo(x + 14, 32); c.stroke(); }
  c.fillStyle = '#4a4a50'; c.fillRect(150, 10, 18, 14); c.fillRect(300, 28, 22, 16);
  c.strokeStyle = '#222'; c.lineWidth = 1; c.beginPath(); c.moveTo(250, 32); c.lineTo(250, 92); c.stroke(); c.fillStyle = '#c93a2a'; c.fillRect(236, 92, 28, 8); c.fillStyle = '#e7e2d6'; c.fillRect(238, 100, 24, 18);
  c.strokeStyle = '#7d838c'; c.lineWidth = 1.6; for (x = 300; x <= 390; x += 30) { c.beginPath(); c.moveTo(x, 90); c.lineTo(x, 216); c.stroke(); } for (y = 90; y <= 216; y += 42) { c.beginPath(); c.moveTo(300, y); c.lineTo(390, y); c.stroke(); }
  c.fillStyle = 'rgba(235,130,20,.55)'; c.fillRect(302, 134, 86, 40);
  c.fillStyle = lg(c, 0, 208, 0, 236, [[0, '#9a9a94'], [1, '#5a5a56']]); c.fillRect(0, 208, W, 28);
  for (x = 0; x < W; x += 36) { c.fillStyle = (x / 36) % 2 ? '#f2eee4' : '#d23a2a'; c.fillRect(x, 212, 36, 10); }
  for (i = 0; i < 3; i++) { c.fillStyle = '#e8801c'; c.beginPath(); c.moveTo(20 + i * 120, 206); c.lineTo(28 + i * 120, 206); c.lineTo(24 + i * 120, 190); c.fill(); }
  floorTex(c, r, '#9a8c74', '#4a4132', 1100);
  c.fillStyle = 'rgba(40,50,70,.35)'; for (i = 0; i < 3; i++) { c.beginPath(); c.ellipse(60 + r() * 280, 262 + r() * 22, 20 + r() * 20, 3.5, 0, 0, PI * 2); c.fill(); }
  c.fillStyle = 'rgba(60,40,20,.5)'; for (i = 0; i < 40; i++) c.fillRect(r() * W, 238 + r() * 58, 2 + r() * 3, 1.5);
  ring(c, 'rgba(255,190,70,.6)');
});

G.BG[8] = mk(function (c) { /* METRO PERONU */
  var r = rng(81), i, x, y;
  c.fillStyle = lg(c, 0, 0, 0, 220, [[0, '#cfd6da'], [1, '#aeb6bb']]); c.fillRect(0, 0, W, 222);
  c.strokeStyle = 'rgba(70,80,90,.35)'; c.lineWidth = 1; for (x = 0; x < W; x += 20) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 222); c.stroke(); } for (y = 0; y < 222; y += 14) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.fillStyle = '#0a0c10'; c.beginPath(); c.moveTo(110, 208); c.lineTo(110, 112); c.quadraticCurveTo(110, 70, 200, 70); c.quadraticCurveTo(290, 70, 290, 112); c.lineTo(290, 208); c.fill();
  c.fillStyle = lg(c, 0, 100, 0, 208, [[0, '#06070a'], [1, '#1a1c22']]); c.fillRect(120, 100, 160, 108);
  glow(c, 200, 150, 36, '#fff4c8', .5); c.fillStyle = '#fff7da'; c.beginPath(); c.arc(190, 150, 3, 0, PI * 2); c.arc(210, 150, 3, 0, PI * 2); c.fill();
  c.strokeStyle = '#4a4e58'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(150, 208); c.lineTo(192, 152); c.moveTo(250, 208); c.lineTo(208, 152); c.stroke();
  c.fillStyle = '#d5dbe0'; c.fillRect(100, 62, 12, 150); c.fillRect(288, 62, 12, 150);
  c.fillStyle = '#1b4fa8'; rrect(c, 18, 30, 80, 28, 4); c.fill(); c.fillStyle = '#fff'; c.font = '700 13px Oswald, Arial'; c.textAlign = 'center'; c.fillText('KAFES', 58, 49);
  c.fillStyle = '#c4221a'; c.beginPath(); c.arc(330, 44, 13, 0, PI * 2); c.fill(); c.fillStyle = '#fff'; c.font = '700 14px Arial'; c.fillText('M', 330, 49);
  for (x = 20; x < W; x += 80) { glow(c, x + 30, 8, 60, '#e8f6ff', .45); c.fillStyle = '#f4fbff'; c.fillRect(x, 4, 60, 5); }
  c.fillStyle = '#6a7078'; c.fillRect(0, 208, W, 18);
  c.fillStyle = '#e8c21c'; c.fillRect(0, 224, W, 5); c.fillStyle = '#1a1a1a'; for (x = 0; x < W; x += 16) c.fillRect(x, 224, 8, 5);
  floorTex(c, r, '#a8adb4', '#40444c', 500);
  c.strokeStyle = 'rgba(20,24,30,.35)'; c.lineWidth = 1; for (i = 0; i < 8; i++) { c.beginPath(); c.moveTo(0, 234 + i * 9); c.lineTo(W, 234 + i * 9); c.stroke(); } for (x = -240; x < 640; x += 46) { c.beginPath(); c.moveTo(200 + (x - 200) * .4, 232); c.lineTo(x, 300); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,.12)'; for (i = 0; i < 5; i++) c.fillRect(r() * 330, 240 + r() * 50, 50, 5);
  c.fillStyle = '#2a2d36'; rrect(c, 330, 196, 58, 12, 3); c.fill(); c.fillRect(334, 208, 4, 12); c.fillRect(380, 208, 4, 12);
  ring(c, 'rgba(120,200,255,.55)');
});

G.BG[9] = mk(function (c) { /* HAYVANAT BAHÇESİ */
  var r = rng(91), i, x;
  c.fillStyle = lg(c, 0, 0, 0, 170, [[0, '#4f9ee0'], [.75, '#bfe3f5'], [1, '#f4efd6']]); c.fillRect(0, 0, W, 170); cloud(c, 50, 34, 56); cloud(c, 280, 50, 64);
  c.fillStyle = '#6fa66a'; c.beginPath(); c.moveTo(0, 150); for (x = 0; x <= W; x += 20) c.lineTo(x, 136 - Math.sin(x * .025) * 10); c.lineTo(W, 150); c.fill();
  c.fillStyle = '#4a8a48'; c.fillRect(0, 148, W, 70);
  /* zürafa */
  c.fillStyle = '#e0a53e'; c.beginPath(); c.ellipse(246, 150, 26, 14, 0, 0, PI * 2); c.fill(); c.fillRect(262, 82, 9, 70); c.beginPath(); c.ellipse(272, 80, 12, 7, -.3, 0, PI * 2); c.fill();
  [[232, 170], [242, 172], [256, 170], [266, 172]].forEach(function (l) { c.fillRect(l[0] - 2, 156, 4, l[1] - 156); });
  c.fillStyle = '#7a4a1c'; for (i = 0; i < 9; i++) { c.beginPath(); c.arc(236 + r() * 30, 144 + r() * 12, 2.4, 0, PI * 2); c.fill(); } for (i = 0; i < 4; i++) { c.beginPath(); c.arc(264 + r() * 4, 90 + i * 14, 2.2, 0, PI * 2); c.fill(); }
  c.fillStyle = '#3a2410'; c.fillRect(266, 70, 2, 6); c.fillRect(272, 70, 2, 6);
  [[40, 90], [352, 84]].forEach(function (t) { c.fillStyle = lg(c, t[0] - 10, 0, t[0] + 10, 0, [[0, '#3a2a18'], [.5, '#7a5a38'], [1, '#33241a']]); c.fillRect(t[0] - 7, t[1], 14, 130); for (i = 0; i < 6; i++) { c.fillStyle = rg(c, t[0] + (r() - .5) * 90, t[1] - 8 + r() * 30, 44, [[0, 'rgba(50,140,60,.95)'], [1, 'rgba(20,80,30,0)']]); c.fillRect(t[0] - 110, 0, 220, t[1] + 50); } });
  c.strokeStyle = '#2a2a2e'; c.lineWidth = 2; for (x = 0; x < W; x += 14) { c.beginPath(); c.moveTo(x, 150); c.lineTo(x, 214); c.stroke(); } c.lineWidth = 3; c.beginPath(); c.moveTo(0, 156); c.lineTo(W, 156); c.moveTo(0, 208); c.lineTo(W, 208); c.stroke();
  c.fillStyle = '#6a4a2a'; c.fillRect(120, 40, 160, 34); c.fillRect(126, 74, 6, 36); c.fillRect(268, 74, 6, 36); c.fillStyle = '#f0dfae'; c.font = '700 14px Oswald, Arial'; c.textAlign = 'center'; c.fillText('HAYVANAT BAHÇESİ', 200, 63);
  c.fillStyle = '#e8c21c'; c.fillRect(0, 214, W, 4);
  floorTex(c, r, '#b8a37a', '#6a5a3c', 900);
  for (i = 0; i < 40; i++) { c.fillStyle = ['#e8c21c', '#e85a8a', '#ffffff', '#c04ad8'][i % 4]; c.beginPath(); c.arc(r() * W, 222 + r() * 12, 1.6, 0, PI * 2); c.fill(); }
  c.fillStyle = 'rgba(80,60,30,.35)'; for (i = 0; i < 40; i++) c.fillRect(r() * W, 240 + r() * 55, 3 + r() * 5, 1.5);
  ring(c, 'rgba(255,230,140,.55)');
});
})(window);
