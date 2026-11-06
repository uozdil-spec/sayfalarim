/* Kafes Dövüşü · dövüşçü çizimi: eklemli iskelet (IK), düz / kroşe / aparkat / tekme pozları, vuruş izi, yüz ve kıyafet ayrıntıları. */
(function (root) {
'use strict';
var G = root.GFX, T = G.T, W = G.W, H = G.H, FY = G.FY, PI = Math.PI;
var lg = T.lg, rg = T.rg, mix = T.mix, glow = T.glow;
var RW = /^w[jhukl]$|^sp$/, RX = /^x[jhukl]$|^spstrike$/;
G.isWind = function (s) { return RW.test(s); };
G.isStrike = function (s) { return RX.test(s); };

var BASE = { lean: 0, bob: 0, crouch: 0, step: 0, hd: 0, fx: 27, fy: -6, rx: 15, ry: 6, rot: 0, dx: 0, kx: 0, ky: 0 };
var POSE = {
  wj: { lean: -3, crouch: 1, step: -2, hd: -1, fx: 14, fy: -2, rx: 18, ry: -4, dx: -3, k: 34 },
  xj: { lean: 9, crouch: 2, step: 14, hd: 3, fx: 56, fy: -5, rx: 13, ry: -2, dx: 13, k: 70 },
  wh: { lean: -9, crouch: 3, step: -5, hd: -2, fx: -10, fy: -12, rx: 20, ry: -6, dx: -5, k: 24 },
  xh: { lean: 12, crouch: 3, step: 12, hd: 5, fx: 36, fy: -15, rx: 12, ry: -4, dx: 11, k: 55 },
  wu: { lean: -5, crouch: 9, step: -3, hd: -2, fx: 16, fy: 28, rx: 17, ry: -6, dx: -3, k: 24 },
  xu: { lean: 5, crouch: -2, step: 10, hd: 6, fx: 32, fy: -32, rx: 14, ry: -4, dx: 9, k: 60 },
  wk: { lean: -8, crouch: 2, step: -4, hd: -2, fx: 20, fy: -10, rx: 12, ry: -2, dx: -3, kx: -8, ky: -30, k: 22 },
  xk: { lean: -13, crouch: 0, step: 4, hd: -3, fx: 18, fy: -14, rx: 8, ry: -6, dx: 7, kx: 38, ky: -58, k: 55 },
  wl: { lean: 3, crouch: 10, step: -3, hd: 1, fx: 22, fy: -12, rx: 20, ry: -4, dx: -4, kx: -14, ky: -12, k: 26 },
  xl: { lean: -9, crouch: 14, step: 6, hd: -2, fx: 18, fy: -10, rx: 12, ry: -2, dx: 9, kx: 50, ky: -5, k: 62 },
  dg: { lean: -13, crouch: 15, step: -8, hd: -10, fx: 20, fy: -18, rx: 24, ry: -10, dx: -15, k: 40 },
  sp: { lean: -7, crouch: 2, step: -5, hd: -2, fx: -2, fy: -30, rx: 24, ry: -10, k: 16 },
  spstrike: { lean: 9, crouch: 3, step: 18, hd: 3, fx: 52, fy: -2, rx: 12, ry: -8, dx: 10, k: 46 },
  block: { lean: 3, crouch: 4, step: 2, hd: -1, fx: 19, fy: -15, rx: 25, ry: -9, k: 22 },
  rec: { lean: 1, fx: 22, fy: 2, rx: 12, ry: 10, dx: 2, k: 14 },
  hit: { lean: -11, step: -8, hd: -9, fx: 6, fy: 16, rx: 0, ry: 18, dx: -9, k: 34 },
  stun: { lean: -4, crouch: 3, step: -2, hd: -3, fx: 8, fy: 18, rx: 2, ry: 20, dx: -3, k: 10 },
  ko: { lean: -6, step: -3, hd: -3, fx: 6, fy: 16, rx: 0, ry: 18, rot: 1.48, k: 6 },
  jp: { lean: 3, crouch: 5, step: 6, hd: 0, fx: 24, fy: -16, rx: 14, ry: -10, kx: 8, ky: -26, k: 15 }
};
var SOFT = { fx: 1, fy: 1, rx: 1, ry: 1, kx: 1, ky: 1 };
G.mkF = function (x, look) { var p = {}, v = {}, k; for (k in BASE) { p[k] = BASE[k]; v[k] = 0; } return { x: x, look: look, st: 'idle', pst: 'idle', ph: Math.random() * 6, flash: 0, hurt: 0, tr: [], p: p, v: v }; };
/* Yay-sönüm modeli: durum değişince hız darbesi verilir, uzuvlar hedefe hafif aşıp geri oturur. Boştayken ayak ritmi, nefes ve el çemberi var. */
G.pose = function (f, dt, tm) {
  var st = f.st, sk = (f.jy > 3 && st === 'idle') ? 'jp' : st, B = f.look.build || 1, fr = 5.6 - (B - 1) * 2.4, s = Math.sin(tm * fr + f.ph), s2 = Math.sin(tm * fr * .5 + f.ph), c1 = Math.cos(tm * fr * .5 + f.ph * 1.3), t = {}, key, P = f.p, V = f.v, k = 14, o = POSE[sk];
  for (key in BASE) t[key] = BASE[key];
  if (o) { for (key in o) if (key !== 'k') t[key] = o[key]; k = o.k || 14; }
  else { t.bob = s * 1.7; t.crouch = 2 + s * 1.5; t.step = s2 * 3.2; t.dx = s2 * 4; t.lean = 1 + c1 * 1.6; t.hd = c1 * 1.3; t.fx = 27 + c1 * 2.6; t.fy = -6 + s * 2.4; t.rx = 15 + s * 1.6; t.ry = 6 - s * 1.6; k = 11;
    var wk = Math.min(1, Math.abs(f.mvx || 0) / 50), wp = tm * 11 + f.ph, dr = (f.mvx || 0) > 0 ? 1 : -1;
    if (wk > .05) { t.step += Math.sin(wp) * 9 * wk; t.ky -= Math.max(0, Math.cos(wp)) * 10 * wk; t.kx += Math.sin(wp) * 5 * wk; t.bob += Math.abs(Math.sin(wp)) * -2.4 * wk; t.lean += dr * 3 * wk; t.rx += Math.sin(wp) * -4 * wk; t.fx += Math.sin(wp) * 3 * wk; k = 13; } }
  if (st === 'block') { t.bob = s * .8; t.crouch += s * .8; }
  if (st === 'stun') { t.lean += s2 * 5; t.hd += s2 * 4; }
  if (st === 'ko') { t.bob = 0; }
  if (st !== f.pst) {
    if (st === 'hit') { V.dx -= 150; V.lean -= 110; V.hd -= 90; V.bob += 30; }
    else if (st === 'stun') { V.dx -= 70; V.lean -= 60; V.hd -= 50; }
    else if (RX.test(st)) { V.dx += 130; V.lean += 70; V.step += 60; }
    else if (st === 'dg') { V.dx -= 190; V.crouch += 80; V.lean -= 60; }
    else if (st === 'ko') { V.dx -= 110; V.lean -= 80; }
    else if (st === 'idle' && (f.pst === 'xk' || f.pst === 'xl' || f.pst === 'xu')) { V.dx -= 30; }
    f.pst = st;
  }
  var n = 3, h = Math.min(dt, .05) / n, i, w, z, a;
  for (i = 0; i < n; i++) for (key in t) {
    if (key === 'rot') continue;
    w = k * .8; z = SOFT[key] ? .95 : .62;
    a = w * w * (t[key] - P[key]) - 2 * z * w * V[key];
    V[key] += a * h; P[key] += V[key] * h;
  }
  P.rot += (t.rot - P.rot) * Math.min(1, dt * 5);
};

function ik(a, b, l1, l2, kind) {
  var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = l1 + l2 - .5;
  if (d > m) { dx *= m / d; dy *= m / d; d = m; b = { x: a.x + dx, y: a.y + dy }; }
  if (d < 1) d = 1;
  var aa = Math.atan2(dy, dx), th = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  var e1 = { x: a.x + Math.cos(aa + th) * l1, y: a.y + Math.sin(aa + th) * l1 }, e2 = { x: a.x + Math.cos(aa - th) * l1, y: a.y + Math.sin(aa - th) * l1 };
  var pick = kind === 'leg' ? (e1.x > e2.x ? e1 : e2) : (kind === 'up' ? (e1.y < e2.y ? e1 : e2) : (e1.y > e2.y ? e1 : e2));
  return { e: pick, h: b };
}
function tl(c, a, b, w1, w2, col, hi, sh) {
  var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
  if (ny > 0) { nx = -nx; ny = -ny; }
  c.fillStyle = col; c.beginPath();
  c.moveTo(a.x + nx * w1 / 2, a.y + ny * w1 / 2); c.lineTo(b.x + nx * w2 / 2, b.y + ny * w2 / 2);
  c.lineTo(b.x - nx * w2 / 2, b.y - ny * w2 / 2); c.lineTo(a.x - nx * w1 / 2, a.y - ny * w1 / 2); c.closePath(); c.fill();
  c.beginPath(); c.arc(a.x, a.y, w1 / 2, 0, PI * 2); c.fill(); c.beginPath(); c.arc(b.x, b.y, w2 / 2, 0, PI * 2); c.fill();
  c.lineCap = 'round';
  if (hi) { c.strokeStyle = hi; c.lineWidth = Math.max(1.5, Math.min(w1, w2) * .26); c.beginPath(); c.moveTo(a.x + nx * w1 * .24, a.y + ny * w1 * .24); c.lineTo(b.x + nx * w2 * .24, b.y + ny * w2 * .24); c.stroke(); }
  if (sh) { c.strokeStyle = sh; c.lineWidth = Math.max(1.5, Math.min(w1, w2) * .3); c.beginPath(); c.moveTo(a.x - nx * w1 * .28, a.y - ny * w1 * .28); c.lineTo(b.x - nx * w2 * .28, b.y - ny * w2 * .28); c.stroke(); }
}
function star(c, x, y, r) { c.strokeStyle = '#ffd23f'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke(); }
function glove(c, h, e, col, Q, dark) {
  var dx = h.x - e.x, dy = h.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, g = dark ? Q(col, .3, 'k') : Q(col);
  c.strokeStyle = Q('#e9e5da'); c.lineWidth = 6.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(h.x - ux * 5, h.y - uy * 5); c.lineTo(h.x - ux * 1, h.y - uy * 1); c.stroke();
  c.fillStyle = rg(c, h.x + ux * 2 - 3, h.y + uy * 2 - 4, 15, [[0, Q(col, dark ? .1 : .45, 'w')], [.55, g], [1, Q(col, .55, 'k')]]);
  c.beginPath(); c.ellipse(h.x + ux * 3, h.y + uy * 3, 10, 8.6, Math.atan2(uy, ux), 0, PI * 2); c.fill();
  c.fillStyle = Q(col, .2, 'k'); c.beginPath(); c.ellipse(h.x + ux * 1 - uy * 5, h.y + uy * 1 + ux * 5, 4.4, 3.2, Math.atan2(uy, ux), 0, PI * 2); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.beginPath(); c.arc(h.x + ux * 5, h.y + uy * 5, 5.5, Math.atan2(uy, ux) - 1.2, Math.atan2(uy, ux) + 1.2); c.stroke();
}
/* iş aletleri: yerel eksende +x kolun gittiği yön, yumruğun ucunda tutulur */
var TOOLS = {
  level: function (c, Q) { c.fillStyle = Q('#e8c01c'); c.fillRect(-4, -3.6, 40, 7.2); c.fillStyle = Q('#a8860c'); c.fillRect(-4, -3.6, 3, 7.2); c.fillRect(33, -3.6, 3, 7.2); c.fillStyle = Q('#d6f0c0'); c.fillRect(13, -2, 10, 4); c.fillStyle = Q('#3a8a2a'); c.fillRect(17, -1.4, 3, 2.8); },
  notebook: function (c, Q) { c.fillStyle = Q('#22262e'); c.fillRect(4, -10, 22, 20); c.fillStyle = Q('#f4f1e6'); c.fillRect(25, -9, 2.5, 18); c.fillStyle = Q('#c33'); c.fillRect(8, -10, 4, 7); c.fillStyle = Q('#c9a64a'); c.fillRect(13, -4, 9, 1.6); c.fillRect(13, 0, 9, 1.6); },
  tray: function (c, Q) { c.fillStyle = Q('#8f949c'); c.beginPath(); c.ellipse(14, 0, 5, 16, 0, 0, PI * 2); c.fill(); c.fillStyle = Q('#d7dbe0'); c.beginPath(); c.ellipse(13, -1, 3.2, 14, 0, 0, PI * 2); c.fill(); c.fillStyle = Q('#a5301c'); c.fillRect(12, -8, 8, 5); c.fillStyle = Q('#e8d2a0'); c.fillRect(12, 2, 8, 5); },
  weight: function (c, Q) { c.fillStyle = Q('#b8892a'); c.beginPath(); c.moveTo(6, -6); c.lineTo(28, -10); c.lineTo(28, 10); c.lineTo(6, 6); c.closePath(); c.fill(); c.fillStyle = Q('#e6c25a'); c.fillRect(8, -5, 18, 2.4); c.fillStyle = Q('#8a6418'); c.beginPath(); c.arc(30, 0, 4, 0, PI * 2); c.fill(); },
  case: function (c, Q) { c.fillStyle = Q('#6a4426'); c.fillRect(6, -11, 24, 22); c.fillStyle = Q('#8a5e38'); c.fillRect(7, -10, 22, 3); c.strokeStyle = Q('#2a1a0c'); c.lineWidth = 2; c.strokeRect(14, -15, 8, 5); c.fillStyle = Q('#d9b04a'); c.fillRect(27, -2, 3, 4); },
  anchor: function (c, Q) { c.strokeStyle = Q('#2b2f38'); c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-2, 0); c.lineTo(32, 0); c.moveTo(24, -8); c.lineTo(24, 8); c.moveTo(34, -9); c.quadraticCurveTo(36, 0, 34, 9); c.stroke(); c.beginPath(); c.arc(-4, 0, 3, 0, PI * 2); c.stroke(); },
  shears: function (c, Q) { c.strokeStyle = Q('#b3261e'); c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-4, -3); c.lineTo(8, -1); c.moveTo(-4, 3); c.lineTo(8, 1); c.stroke(); c.fillStyle = Q('#cfd5db'); c.beginPath(); c.moveTo(8, -1.5); c.lineTo(38, -5); c.lineTo(8, 1); c.fill(); c.beginPath(); c.moveTo(8, 1.5); c.lineTo(38, 4); c.lineTo(8, -1); c.fill(); },
  wrench: function (c, Q) { c.fillStyle = Q('#8e969f'); c.fillRect(-4, -2.8, 30, 5.6); c.beginPath(); c.arc(30, 0, 8, 0, PI * 2); c.fill(); c.fillStyle = Q('#2b2f38'); c.fillRect(30, -3.4, 10, 6.8); c.fillStyle = Q('#c9d0d6'); c.fillRect(-4, -2.8, 30, 1.6); },
  book: function (c, Q) { c.fillStyle = Q('#9a1f2a'); c.fillRect(4, -12, 24, 24); c.fillStyle = Q('#f1ead6'); c.fillRect(26, -11, 3, 22); c.fillStyle = Q('#d9b04a'); c.fillRect(6, -10, 3, 20); c.fillRect(13, -5, 9, 1.8); c.fillRect(13, 0, 9, 1.8); },
  axe: function (c, Q) { c.fillStyle = Q('#7a5230'); c.fillRect(-6, -2.2, 38, 4.4); c.fillStyle = Q('#c8281f'); c.beginPath(); c.moveTo(24, -3); c.lineTo(30, -6); c.lineTo(36, -15); c.lineTo(40, -12); c.lineTo(38, 8); c.lineTo(30, 6); c.lineTo(24, 3); c.closePath(); c.fill(); c.fillStyle = Q('#d7dce2'); c.beginPath(); c.moveTo(36, -15); c.lineTo(40, -12); c.lineTo(38, 8); c.lineTo(36, 4); c.closePath(); c.fill(); },
  pan: function (c, Q) { c.fillStyle = Q('#2a2a2e'); c.fillRect(-4, -2.4, 20, 4.8); c.beginPath(); c.ellipse(26, 0, 11, 13, 0, 0, PI * 2); c.fill(); c.fillStyle = Q('#4a4a52'); c.beginPath(); c.ellipse(27, 0, 8, 10, 0, 0, PI * 2); c.fill(); c.fillStyle = Q('#e6b04a'); c.beginPath(); c.arc(28, -2, 3, 0, PI * 2); c.fill(); },
  nozzle: function (c, Q) { c.fillStyle = Q('#c8a23a'); c.fillRect(-4, -4.4, 22, 8.8); c.beginPath(); c.moveTo(18, -4.4); c.lineTo(32, -2); c.lineTo(32, 2); c.lineTo(18, 4.4); c.fill(); c.fillStyle = Q('#3fae52'); c.fillRect(-8, -3, 5, 6); c.fillStyle = Q('#8a6e1c'); c.fillRect(4, -8, 3, 4); },
  stamp: function (c, Q) { c.fillStyle = Q('#6a4426'); c.fillRect(-4, -3, 14, 6); c.fillRect(8, -5, 3, 10); c.fillStyle = Q('#b3261e'); c.fillRect(11, -11, 11, 22); c.fillStyle = Q('#7a1810'); c.fillRect(21, -11, 3, 22); },
  phone: function (c, Q) { c.fillStyle = Q('#0e0e12'); c.fillRect(4, -8.5, 24, 17); c.fillStyle = Q('#5ec8ff'); c.fillRect(6, -7, 20, 14); c.fillStyle = Q('#22d06a'); c.fillRect(9, -4, 8, 3); c.fillStyle = Q('#fff'); c.fillRect(9, 1, 13, 2); },
  compass: function (c, Q) { c.strokeStyle = Q('#aeb5bd'); c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(30, -9); c.lineTo(5, 0); c.lineTo(30, 9); c.stroke(); c.fillStyle = Q('#2f6fb5'); c.beginPath(); c.arc(4, 0, 3.6, 0, PI * 2); c.fill(); c.strokeStyle = Q('#2a2f38'); c.lineWidth = 1.4; c.beginPath(); c.moveTo(30, -9); c.lineTo(36, -12); c.stroke(); },
  rod: function (c, Q) { c.lineCap = 'butt'; c.lineWidth = 4.6; for (var i = 0; i < 52; i += 9) { c.strokeStyle = (i / 9) % 2 ? Q('#f4f1e8') : Q('#d0302a'); c.beginPath(); c.moveTo(-6 + i, 0); c.lineTo(Math.min(46, 3 + i), 0); c.stroke(); } c.fillStyle = Q('#333'); c.beginPath(); c.moveTo(46, -2.2); c.lineTo(52, 0); c.lineTo(46, 2.2); c.fill(); },
  cleaver: function (c, Q) { c.fillStyle = Q('#6a4426'); c.fillRect(-6, -2.8, 18, 5.6); c.fillStyle = Q('#c4cbd2'); c.fillRect(12, -10, 24, 17); c.fillStyle = Q('#e8edf0'); c.fillRect(12, 4, 24, 3); c.fillStyle = Q('#5a5f66'); c.beginPath(); c.arc(18, -5, 2, 0, PI * 2); c.fill(); }
};
function tool(c, h, e, L, Q, dark, st, f) {
  var dx = h.x - e.x, dy = h.y - e.y, a = Math.atan2(dy, dx), strike = RX.test(st), skin = dark ? Q(L.skin, .3, 'k') : Q(L.skin), fn = TOOLS[L.tool];
  if (!fn || st === 'sp' || st === 'spstrike') { c.fillStyle = skin; c.beginPath(); c.arc(h.x, h.y, 5.6, 0, PI * 2); c.fill(); return; }
  var tgt = strike ? -.12 : (RW.test(st) ? -1.15 : -.7), key = dark ? 'tqb' : 'tqf';
  f[key] = f[key] == null ? tgt : f[key] + (tgt - f[key]) * .35;
  c.save(); c.translate(h.x, h.y); c.rotate(a + f[key]);
  if (dark) { c.globalAlpha = 1; }
  fn(c, dark ? function (x) { return Q(x, .3, 'k'); } : Q);
  c.restore();
  c.fillStyle = skin; c.beginPath(); c.arc(h.x, h.y, 5.4, 0, PI * 2); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; c.beginPath(); c.arc(h.x, h.y, 5.4, 0, PI * 2); c.stroke();
}
function hand(c, h, e, L, Q, dark, st, f) { if (G.GLOVES || !L.tool) glove(c, h, e, L.glove, Q, dark); else tool(c, h, e, L, Q, dark, st, f); }
function paper(c, h, big) {
  c.save(); c.translate(h.x + 6, h.y - 4); c.rotate(big ? .15 : -.25);
  c.fillStyle = '#f7f4ea'; c.fillRect(-9, -12, 18, 24); c.strokeStyle = '#9a958a'; c.lineWidth = 1;
  for (var i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-6, -8 + i * 4); c.lineTo(6, -8 + i * 4); c.stroke(); }
  c.fillStyle = '#c33'; c.fillRect(2, 5, 5, 5); c.restore();
}

function hat(c, L, hd, Q, st) {
  var k = L.hat, x = hd.x, y = hd.y;
  if (k === 'hard') {
    c.fillStyle = lg(c, x - 12, y - 20, x + 12, y - 6, [[0, Q(L.hatc, .35, 'w')], [1, Q(L.hatc, .25, 'k')]]); c.beginPath(); c.ellipse(x + 1, y - 8, 13.5, 11, 0, PI, 0); c.fill();
    c.fillStyle = Q(L.hatc, .3, 'k'); c.fillRect(x - 13, y - 8.5, 31, 3.2); c.fillStyle = Q(L.hatc, .15, 'k'); c.fillRect(x - 1, y - 19, 4, 11);
  } else if (k === 'cap') {
    c.fillStyle = lg(c, x - 12, y - 20, x + 12, y - 6, [[0, Q(L.hatc, .35, 'w')], [1, Q(L.hatc, .3, 'k')]]); c.beginPath(); c.ellipse(x, y - 8, 12.5, 10, 0, PI, 0); c.fill(); c.fillRect(x - 12.5, y - 9, 25, 3);
    c.fillStyle = Q('#0c0c0e'); c.beginPath(); c.moveTo(x + 6, y - 8); c.lineTo(x + 20, y - 6); c.lineTo(x + 6, y - 5); c.fill();
    c.fillStyle = Q('#d8b13a'); c.beginPath(); c.arc(x + 4, y - 13, 2.2, 0, PI * 2); c.fill();
  } else if (k === 'straw') {
    c.fillStyle = lg(c, x - 22, 0, x + 22, 0, [[0, Q(L.hatc, .3, 'k')], [.5, Q(L.hatc, .2, 'w')], [1, Q(L.hatc, .25, 'k')]]); c.beginPath(); c.ellipse(x + 1, y - 8, 23, 5, 0, 0, PI * 2); c.fill();
    c.fillStyle = Q(L.hatc); c.beginPath(); c.ellipse(x + 1, y - 9, 11.5, 11, 0, PI, 0); c.fill(); c.fillStyle = Q('#7a4a22'); c.fillRect(x - 10.5, y - 11, 23, 3);
  } else if (k === 'fire') {
    c.fillStyle = lg(c, x - 12, y - 22, x + 12, y - 6, [[0, Q(L.hatc, .4, 'w')], [1, Q(L.hatc, .35, 'k')]]); c.beginPath(); c.ellipse(x, y - 8, 13, 12, 0, PI, 0); c.fill();
    c.fillStyle = Q(L.hatc, .25, 'k'); c.beginPath(); c.moveTo(x - 12, y - 8); c.lineTo(x - 21, y - 2); c.lineTo(x - 9, y - 4); c.fill(); c.fillRect(x - 13, y - 9, 27, 3);
    c.fillStyle = Q('#e8d24a'); c.beginPath(); c.moveTo(x + 2, y - 18); c.lineTo(x + 8, y - 14); c.lineTo(x + 5, y - 9); c.lineTo(x - 1, y - 12); c.fill();
  } else if (k === 'chef') {
    c.fillStyle = lg(c, x - 14, y - 34, x + 14, y - 6, [[0, Q(L.hatc)], [1, Q(L.hatc, .18, 'k')]]);
    [[-8, -22], [0, -27], [8, -22], [-4, -18], [5, -18]].forEach(function (p) { c.beginPath(); c.arc(x + p[0], y + p[1], 8, 0, PI * 2); c.fill(); });
    c.fillRect(x - 10, y - 17, 21, 10); c.fillStyle = Q(L.hatc, .22, 'k'); c.fillRect(x - 10, y - 9, 21, 2.4);
  } else if (k === 'hood') {
    c.fillStyle = lg(c, x - 14, y - 20, x + 8, y + 10, [[0, Q(L.hatc, .22, 'w')], [1, Q(L.hatc, .3, 'k')]]);
    c.beginPath(); c.ellipse(x - 1, y - 5, 13.5, 11.5, 0, PI, 0); c.fill();
    c.beginPath(); c.ellipse(x - 7, y + 2, 7.5, 14, 0, PI * .5, PI * 1.5); c.fill();
    c.beginPath(); c.moveTo(x - 12, y + 8); c.lineTo(x - 16, y + 19); c.lineTo(x - 1, y + 13); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 8.5, y - 8); c.quadraticCurveTo(x + 9, y - 8.5, x + 11.5, y - 1); c.stroke();
  } else if (k === 'scarf') {
    c.fillStyle = lg(c, x - 12, y - 18, x + 12, y, [[0, Q(L.hatc, .25, 'w')], [1, Q(L.hatc, .3, 'k')]]); c.beginPath(); c.ellipse(x - 1, y - 4, 12.5, 13, 0, PI * .85, PI * 2.1); c.fill();
    c.beginPath(); c.moveTo(x - 11, y - 3); c.lineTo(x - 19, y + 9); c.lineTo(x - 7, y + 5); c.fill(); c.beginPath(); c.arc(x - 12, y + 1, 4, 0, PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)'; for (var i = 0; i < 7; i++) { c.beginPath(); c.arc(x - 8 + i * 3, y - 11 + (i % 2) * 3, 1, 0, PI * 2); c.fill(); }
  }
}

function drawFighter(c, f, dir, tm) {
  var L = f.look, P = f.p, st = f.st, B = L.build || 1, fl = f.flash > 0;
  function Q(h, a, to) { var s = a ? mix(h, a, to) : h; return fl ? mix(s, .72, 'w') : s; }
  c.save(); c.translate(f.x, FY); c.scale(dir, 1);
  if (P.rot > .02) { c.translate(0, -3); c.rotate(-P.rot); }
  c.save(); c.translate(P.dx, 0);
  c.save(); c.scale(1, .2); c.fillStyle = rg(c, 0, 0, 38, [[0, 'rgba(0,0,0,.65)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(-38, -38, 76, 76); c.restore();
  c.translate(0, -(f.jy || 0));
  var hip = { x: -2 + P.step * .4 + P.lean * .15, y: -54 + P.bob * .5 + P.crouch };
  var sh = { x: hip.x + 3 + P.lean * .7, y: -91 + P.bob + P.crouch * 1.3 };
  var hd = { x: sh.x + 3 + P.hd + P.lean * .2, y: sh.y - 17 };
  var kf = ik(hip, { x: 15 + P.step + P.kx, y: P.ky }, 27, 27, 'leg'), kr = ik(hip, { x: -15 + P.step * .3, y: 0 }, 27, 27, 'leg');
  var hookArm = st === 'wh' || st === 'xh';
  var af = ik(sh, { x: sh.x + P.fx, y: sh.y + P.fy }, 23, 21, hookArm ? 'up' : 'arm'), ar = ik(sh, { x: sh.x + P.rx, y: sh.y + P.ry }, 23, 21, 'arm');
  var upC = L.sleeve ? L.shirt : (L.vest || L.shirt), foC = L.sleeve ? L.shirt : L.skin, body = L.vest || L.shirt;
  if (L.pole && (G.GLOVES || !L.tool)) { var px0 = sh.x - 15, py0 = sh.y + 52, px1 = sh.x - 3, py1 = sh.y - 50, pl = Math.hypot(px1 - px0, py1 - py0), pux = (px1 - px0) / pl, puy = (py1 - py0) / pl; c.lineCap = 'butt'; c.lineWidth = 3.6; for (var ps = 0; ps < pl; ps += 8) { c.strokeStyle = (ps / 8) % 2 ? Q('#f4f1e8') : Q('#d0302a'); c.beginPath(); c.moveTo(px0 + pux * ps, py0 + puy * ps); c.lineTo(px0 + pux * Math.min(pl, ps + 8), py0 + puy * Math.min(pl, ps + 8)); c.stroke(); } c.fillStyle = Q('#333'); c.beginPath(); c.arc(px1, py1, 2.4, 0, PI * 2); c.fill(); }
  if (L.hose) { c.lineCap = 'round'; c.strokeStyle = Q('#1d5a2a'); c.lineWidth = 6.5; c.beginPath(); c.ellipse(sh.x - 12, sh.y + 22, 8, 20, -.15, 0, PI * 2); c.stroke(); c.strokeStyle = Q(L.hose); c.lineWidth = 4; c.beginPath(); c.ellipse(sh.x - 12, sh.y + 22, 8, 20, -.15, 0, PI * 2); c.stroke(); }
  if (L.tube) { c.lineCap = 'round'; c.strokeStyle = Q('#3a2c1a'); c.lineWidth = 9; c.beginPath(); c.moveTo(sh.x - 14, sh.y + 34); c.lineTo(sh.x - 6, sh.y - 26); c.stroke(); c.strokeStyle = Q(L.tube); c.lineWidth = 6.4; c.beginPath(); c.moveTo(sh.x - 14, sh.y + 34); c.lineTo(sh.x - 6, sh.y - 26); c.stroke(); c.strokeStyle = Q('#8a3a2a'); c.lineWidth = 7; c.beginPath(); c.moveTo(sh.x - 6.4, sh.y - 22); c.lineTo(sh.x - 6, sh.y - 26); c.stroke(); }
  /* arka kol */
  tl(c, sh, ar.e, 11 * B, 9 * B, Q(upC, .3, 'k')); tl(c, ar.e, ar.h, 9 * B, 7.5, Q(foC, .3, 'k'));
  hand(c, ar.h, ar.e, L, Q, true, st, f);
  /* arka bacak */
  tl(c, hip, kr.e, 16 * B, 12 * B, Q(L.pants, .3, 'k')); tl(c, kr.e, kr.h, 12 * B, 9.5 * B, Q(L.pants, .3, 'k'));
  c.fillStyle = Q(L.shoe, .1, 'k'); c.beginPath(); c.ellipse(kr.h.x + 4, kr.h.y - 3, 11.5, 5.5, 0, 0, PI * 2); c.fill();
  /* gövde */
  var tw = 10 * B, hw = 8.5 * B;
  c.fillStyle = Q(L.pants); c.beginPath(); c.ellipse(hip.x, hip.y + 4, hw + 1, 7, 0, 0, PI * 2); c.fill();
  c.beginPath(); c.moveTo(sh.x - tw, sh.y + 1); c.quadraticCurveTo(sh.x - 1, sh.y - 6, sh.x + tw - 1, sh.y + 1); c.lineTo(hip.x + hw, hip.y + 3); c.lineTo(hip.x - hw, hip.y + 3); c.closePath();
  c.fillStyle = lg(c, sh.x - tw, 0, sh.x + tw, 0, [[0, Q(body, .45, 'k')], [.45, Q(body)], [1, Q(body, .3, 'w')]]); c.fill();
  c.save(); c.clip();
  c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.ellipse(sh.x + 4, sh.y + 9, 6 * B, 7, 0, 0, PI * 2); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sh.x - 6, sh.y + 8); c.quadraticCurveTo(sh.x - 1, sh.y + 15, hip.x - 6, hip.y - 4); c.moveTo(sh.x + 5, sh.y + 20); c.quadraticCurveTo(sh.x + 1, sh.y + 26, sh.x + 7, hip.y - 2); c.stroke();
  if (L.stripes) { c.fillStyle = Q(L.stripes); c.fillRect(sh.x - 14, sh.y + 11, 30, 4); c.fillRect(sh.x - 14, sh.y + 24, 30, 4); }
  if (L.vest && L.shirt) { c.fillStyle = Q(L.shirt); c.fillRect(sh.x + 3, sh.y - 2, 3, 16); }
  if (L.plaid) { c.strokeStyle = Q(L.plaid); c.globalAlpha = .45; c.lineWidth = 2; for (var q = -12; q < 14; q += 6) { c.beginPath(); c.moveTo(sh.x + q, sh.y); c.lineTo(sh.x + q + 2, hip.y); c.stroke(); } for (q = 4; q < 40; q += 8) { c.beginPath(); c.moveTo(sh.x - 12, sh.y + q); c.lineTo(sh.x + 14, sh.y + q); c.stroke(); } c.globalAlpha = 1; }
  if (L.apron) { c.fillStyle = Q(L.apron); c.fillRect(sh.x - 7, sh.y + 8, 17, 40); c.fillStyle = Q(L.apron, .2, 'k'); c.fillRect(sh.x - 7, sh.y + 8, 17, 2); c.fillRect(sh.x - 3, sh.y + 28, 9, 6); }
  if (L.blood) { c.fillStyle = 'rgba(150,20,20,.82)'; [[-3, 16, 3.4], [5, 24, 2.4], [-1, 33, 4.2], [7, 40, 2.8], [2, 12, 1.8]].forEach(function (d) { c.beginPath(); c.arc(sh.x + d[0], sh.y + d[1], d[2], 0, PI * 2); c.fill(); }); c.fillStyle = 'rgba(120,10,10,.7)'; c.fillRect(sh.x - 6, sh.y + 44, 15, 3); }
  if (L.tie) { c.fillStyle = Q(L.tie); c.beginPath(); c.moveTo(sh.x + 1, sh.y + 1); c.lineTo(sh.x + 5, sh.y + 1); c.lineTo(sh.x + 4, sh.y + 5); c.lineTo(sh.x + 6, sh.y + 26); c.lineTo(sh.x + 3, sh.y + 30); c.lineTo(sh.x, sh.y + 26); c.lineTo(sh.x + 2, sh.y + 5); c.fill(); }
  if (L.pen) { c.strokeStyle = Q(L.pen); c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(sh.x + 8, sh.y + 10); c.lineTo(sh.x + 9, sh.y + 20); c.stroke(); c.fillStyle = Q('#d8b13a'); c.fillRect(sh.x + 7.2, sh.y + 8, 2.4, 2); }
  if (L.blazer) { c.strokeStyle = Q(L.shirt, .5, 'k'); c.lineWidth = 2; c.beginPath(); c.moveTo(sh.x + 3, sh.y); c.lineTo(sh.x + 1, sh.y + 24); c.stroke(); c.fillStyle = Q('#f1eee6'); c.beginPath(); c.moveTo(sh.x + 1, sh.y); c.lineTo(sh.x + 7, sh.y); c.lineTo(sh.x + 2, sh.y + 15); c.fill(); }
  if (L.buttons) { c.fillStyle = Q(L.buttons); [8, 15, 22, 29].forEach(function (o) { c.beginPath(); c.arc(sh.x + 2, sh.y + o, 1.4, 0, PI * 2); c.fill(); }); }
  if (L.strap) { c.fillStyle = Q('#5a3a1e'); c.fillRect(sh.x + 1, sh.y, 4, 36); c.fillRect(sh.x - 8, sh.y, 4, 36); }
  if (L.whistle) { c.strokeStyle = Q('#e8e8e8'); c.lineWidth = 1; c.beginPath(); c.moveTo(sh.x + 4, sh.y + 1); c.lineTo(sh.x + 6, sh.y + 14); c.stroke(); c.fillStyle = Q('#e8e8e8'); c.fillRect(sh.x + 4, sh.y + 13, 5, 3); c.fillStyle = Q('#d8b13a'); c.beginPath(); c.arc(sh.x + 5, sh.y + 20, 2, 0, PI * 2); c.fill(); }
  c.restore();
  c.fillStyle = Q('#1a1a1c'); c.fillRect(hip.x - hw, hip.y + 1, hw * 2, 4); c.fillStyle = Q('#c9a64a'); c.fillRect(hip.x + 1, hip.y + 1.5, 4, 3);
  tl(c, { x: sh.x - 1, y: sh.y - 5 }, { x: hd.x - 1, y: hd.y + 8 }, 9, 8, Q(L.skin, .2, 'k'));
  c.fillStyle = Q(upC); c.beginPath(); c.arc(sh.x - 1, sh.y + 1, 6.5 * B, 0, PI * 2); c.fill();
  /* ön bacak */
  var kk = st === 'xk' || st === 'wk' || st === 'xl' || st === 'wl';
  tl(c, hip, kf.e, 16 * B, 12 * B, Q(L.pants), Q(L.pants, .22, 'w'), Q(L.pants, .25, 'k')); tl(c, kf.e, kf.h, 12 * B, 9.5 * B, Q(L.pants), Q(L.pants, .2, 'w'), Q(L.pants, .25, 'k'));
  c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; c.beginPath(); c.arc(kf.e.x, kf.e.y, 5, 1, 2.6); c.stroke();
  c.save(); c.translate(kf.h.x + 4, kf.h.y - 3); if (kk) c.rotate(st === 'xk' ? -.45 : (st === 'xl' ? -.12 : .5));
  c.fillStyle = Q(L.shoe); c.beginPath(); c.ellipse(0, 0, 12.5, 6.2, 0, 0, PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(-4, -4.6, 9, 1.6); c.fillStyle = Q('#e8e5dc'); c.fillRect(-11, 3.6, 22, 1.6); c.restore();
  /* kafa */
  var bw = 1 + (B - 1) * .2, ang = RW.test(st) || RX.test(st), hurtF = st === 'hit' || st === 'stun', ko = st === 'ko';
  c.fillStyle = Q(L.skin2); c.beginPath(); c.ellipse(hd.x - 4, hd.y + 1.5, 2.4, 3.6, 0, 0, PI * 2); c.fill();
  c.fillStyle = rg(c, hd.x + 3, hd.y - 4, 17, [[0, Q(L.skin, .25, 'w')], [.55, Q(L.skin)], [1, Q(L.skin2)]]); c.beginPath(); c.ellipse(hd.x, hd.y, 10.5 * bw, 12, 0, 0, PI * 2); c.fill();
  c.fillStyle = 'rgba(0,0,0,.1)'; c.beginPath(); c.ellipse(hd.x + 1, hd.y + 8, 8.5 * bw, 5, 0, 0, PI); c.fill();
  if (L.hat === 'bun') { c.fillStyle = Q(L.hair); c.beginPath(); c.ellipse(hd.x - 1, hd.y - 5, 11, 8, 0, PI, 0); c.fill(); c.beginPath(); c.arc(hd.x - 10, hd.y - 11, 6, 0, PI * 2); c.fill(); c.fillRect(hd.x - 11, hd.y - 6, 5, 10); }
  else { c.fillStyle = Q(L.hair); c.beginPath(); c.ellipse(hd.x - 2, hd.y - 6, 10.5, 7, 0, PI, 0); c.fill(); c.fillRect(hd.x - 11, hd.y - 6, 4, 9); }
  c.fillStyle = Q(L.skin, .1, 'w'); c.beginPath(); c.moveTo(hd.x + 9, hd.y - 2); c.quadraticCurveTo(hd.x + 14.5, hd.y + 3, hd.x + 10, hd.y + 4.5); c.closePath(); c.fill();
  c.strokeStyle = Q(L.skin2); c.lineWidth = .9; c.beginPath(); c.moveTo(hd.x + 10, hd.y + 4.4); c.lineTo(hd.x + 12.2, hd.y + 3.8); c.stroke();
  if (ko) { c.strokeStyle = '#111'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hd.x + 2, hd.y - 4); c.lineTo(hd.x + 7, hd.y); c.moveTo(hd.x + 7, hd.y - 4); c.lineTo(hd.x + 2, hd.y); c.stroke(); }
  else {
    c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(hd.x + 5.5, hd.y - 2.2, 3.3, hurtF ? 1.2 : 2.3, 0, 0, PI * 2); c.fill();
    c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(hd.x + 6.6, hd.y - 2.2, 1.5, 0, PI * 2); c.fill(); c.fillStyle = '#fff'; c.fillRect(hd.x + 6.9, hd.y - 3, .9, .9);
  }
  c.strokeStyle = Q(L.hair); c.lineWidth = 2.1; c.beginPath(); c.moveTo(hd.x + 1.5, hd.y - 6 - (ang ? 0 : 1)); c.lineTo(hd.x + 8.8, hd.y - 6 + (ang ? 2.8 : (hurtF ? -1.6 : 0))); c.stroke();
  if (L.must) { c.fillStyle = Q('#16110e'); c.beginPath(); c.ellipse(hd.x + 7.5, hd.y + 5.4, 5, 1.7, .06, 0, PI * 2); c.fill(); }
  if (hurtF) { c.fillStyle = '#4d1410'; c.beginPath(); c.ellipse(hd.x + 7, hd.y + 8.4, 2.8, 2.3, 0, 0, PI * 2); c.fill(); c.fillStyle = '#f2f2ee'; c.fillRect(hd.x + 5, hd.y + 7.2, 4, 1.2); }
  else { c.strokeStyle = '#6d2a20'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hd.x + 4, hd.y + 8.2); c.lineTo(hd.x + 9, hd.y + 8.2 + (ang ? 1.2 : 0)); c.stroke(); }
  if (L.beard) { c.fillStyle = Q(L.hair === '#9a9a9a' || L.hair === '#e8e8e8' ? '#c8c8c8' : L.hair); c.beginPath(); c.moveTo(hd.x - 6, hd.y + 2); c.quadraticCurveTo(hd.x - 4, hd.y + 17, hd.x + 5, hd.y + 16); c.quadraticCurveTo(hd.x + 12, hd.y + 12, hd.x + 11, hd.y + 4); c.lineTo(hd.x + 5, hd.y + 6); c.quadraticCurveTo(hd.x, hd.y + 4, hd.x - 6, hd.y + 2); c.fill(); }
  if (L.glasses) { c.strokeStyle = '#1b1b1f'; c.lineWidth = 1.2; c.fillStyle = 'rgba(190,225,255,.28)'; c.beginPath(); c.ellipse(hd.x + 5.5, hd.y - 2, 4.4, 3.5, 0, 0, PI * 2); c.fill(); c.stroke(); c.beginPath(); c.moveTo(hd.x + 1.1, hd.y - 2); c.lineTo(hd.x - 8, hd.y - 3); c.stroke(); }
  if (f.hurt > .35 && !ko) { c.fillStyle = 'rgba(110,40,120,' + Math.min(.5, f.hurt * .55) + ')'; c.beginPath(); c.ellipse(hd.x + 6, hd.y + .8, 4.2, 2.4, 0, 0, PI * 2); c.fill(); }
  if (f.hurt > .65 && !ko) { c.strokeStyle = 'rgba(160,20,20,.85)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hd.x + 10.4, hd.y + 4.8); c.quadraticCurveTo(hd.x + 11, hd.y + 8, hd.x + 10.2, hd.y + 10); c.stroke(); }
  hat(c, L, hd, Q, st);
  if (L.headset) { c.strokeStyle = Q('#1a1a1e'); c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.arc(hd.x - 1, hd.y - 3, 12.8, PI * 1.05, PI * 1.95); c.stroke(); c.fillStyle = Q('#e0402a'); c.beginPath(); c.ellipse(hd.x - 3, hd.y + 1.5, 3.6, 5, 0, 0, PI * 2); c.fill(); c.lineWidth = 1.4; c.strokeStyle = Q('#1a1a1e'); c.beginPath(); c.moveTo(hd.x - 3, hd.y + 6); c.quadraticCurveTo(hd.x + 2, hd.y + 14, hd.x + 7.5, hd.y + 9.5); c.stroke(); c.fillStyle = Q('#1a1a1e'); c.beginPath(); c.arc(hd.x + 7.8, hd.y + 9.4, 1.8, 0, PI * 2); c.fill(); }
  /* ön kol + eldiven */
  tl(c, sh, af.e, 11.5 * B, 9.5 * B, Q(upC), Q(upC, .22, 'w'), Q(upC, .28, 'k')); tl(c, af.e, af.h, 9.5 * B, 7.5, Q(foC), Q(foC, .22, 'w'), Q(foC, .25, 'k'));
  if (RW.test(st) && st !== 'sp' || RX.test(st)) { var pulse = .3 + .25 * Math.sin(tm * 30), tip = kk ? kf.h : af.h; glow(c, tip.x, tip.y, 26, RX.test(st) ? '#ffd23f' : '#ff4a3a', pulse); }
  hand(c, af.h, af.e, L, Q, false, st, f);
  if (st === 'sp' || st === 'spstrike') paper(c, af.h, st === 'spstrike');
  if (st === 'block') { c.fillStyle = 'rgba(90,169,230,.22)'; c.strokeStyle = 'rgba(140,200,255,.75)'; c.lineWidth = 2; c.beginPath(); c.arc(sh.x + 8, sh.y - 6, 34, -1.1, 1.1); c.stroke(); c.lineTo(sh.x + 8, sh.y - 6); c.fill(); }
  if (st === 'dg') { c.strokeStyle = 'rgba(190,225,255,.55)'; c.lineWidth = 2; c.lineCap = 'round'; for (var wl2 = 0; wl2 < 4; wl2++) { c.beginPath(); c.moveTo(sh.x + 26 + wl2 * 5, sh.y - 20 + wl2 * 17); c.lineTo(sh.x + 44 + wl2 * 5, sh.y - 20 + wl2 * 17); c.stroke(); } }
  if (st === 'stun') for (var i = 0; i < 3; i++) { var a = tm * 5 + i * 2.1; star(c, hd.x + Math.cos(a) * 15, hd.y - 17 + Math.sin(a) * 4, 3); }
  c.restore();
  /* vuruş izi */
  var tipP = (st === 'xk' || st === 'xl') ? kf.h : (/^x[hju]$|^spstrike$/.test(st) ? af.h : null);
  if (tipP) { f.tr.push({ x: tipP.x + P.dx, y: tipP.y - (f.jy || 0) }); if (f.tr.length > 7) f.tr.shift(); } else if (f.tr.length) f.tr.shift();
  c.lineCap = 'round';
  for (var j = 1; j < f.tr.length; j++) { c.strokeStyle = 'rgba(255,255,255,' + (j / f.tr.length * .5).toFixed(2) + ')'; c.lineWidth = 3 + j * (st === 'xk' || st === 'xl' ? 2.4 : 1.6); c.beginPath(); c.moveTo(f.tr[j - 1].x, f.tr[j - 1].y); c.lineTo(f.tr[j].x, f.tr[j].y); c.stroke(); }
  c.restore();
}
/* karakter seçimi için küçük önizleme: tek dövüşçü, verilen tuvale */
G.preview = function (cv, key, tm) {
  var L = G.LOOKS[key]; if (!L) return; var c = cv.getContext('2d');
  if (!cv._f) cv._f = G.mkF(150, L);
  var f = cv._f; f.look = L; for (var i = 0; i < 70; i++) G.pose(f, 1 / 60, (tm || 0) + i / 60);
  c.clearRect(0, 0, cv.width, cv.height); c.save(); c.scale(cv.width / 110, cv.height / 150); c.translate(-95, -122);
  drawFighter(c, f, 1, tm || 0); c.restore();
};
function ball(c, x, o, tm) {
  var y = FY - 40, d = o ? 1 : -1;
  c.save(); glow(c, x, y, 24, '#ffd23f', .55);
  c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; c.lineCap = 'round';
  for (var i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x + d * i * 9, y - 5 + i * 3); c.lineTo(x + d * (i * 9 + 8), y - 5 + i * 3); c.stroke(); }
  c.translate(x, y); c.rotate(tm * 14 * -d); c.fillStyle = '#f7f4ea'; c.strokeStyle = '#9a958a'; c.lineWidth = 1;
  c.beginPath(); for (var j = 0; j < 8; j++) { var a = j / 8 * PI * 2, r = j % 2 ? 6 : 9.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#c33'; c.fillRect(-2, -1, 4, 3); c.restore();
}
function bang(c, x, y, tm) {
  var s = 1 + .14 * Math.sin(tm * 24);
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#000'; c.beginPath(); c.moveTo(0, -19); c.lineTo(18, 11); c.lineTo(-18, 11); c.closePath(); c.fill();
  c.fillStyle = '#ff3b30'; c.beginPath(); c.moveTo(0, -14); c.lineTo(13, 8); c.lineTo(-13, 8); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.fillRect(-1.8, -7, 3.6, 9); c.fillRect(-1.8, 4, 3.6, 2.8);
  c.restore();
}
function drawPart(c, p) {
  var a = Math.max(0, p.life / p.max);
  c.save(); c.globalAlpha = a;
  if (p.k === 'spark') { c.strokeStyle = p.c; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .04, p.y - p.vy * .04); c.stroke(); }
  else if (p.k === 'paper') { c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = '#f7f4ea'; c.fillRect(-5, -4, 10, 8); c.fillStyle = '#9a958a'; c.fillRect(-3, -1, 6, 1); c.fillRect(-3, 2, 6, 1); }
  else if (p.k === 'ring') { c.strokeStyle = p.c; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x, p.y, (1 - a) * 30 + 4, 0, PI * 2); c.stroke(); }
  else if (p.k === 'burst') { c.fillStyle = p.c; c.translate(p.x, p.y); for (var i = 0; i < 8; i++) { c.rotate(PI / 4); c.fillRect(6 + (1 - a) * 12, -1.5, 8 * a + 2, 3); } }
  else { c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.r || 2, 0, PI * 2); c.fill(); }
  c.restore();
}
/* V: {bg,a,b,flip,parts,pops,shake,tm,warn} — a sol, b sağ */
G.render = function (c, V) {
  c.save();
  if (V.shake > 0) c.translate(((Math.random() - .5) * V.shake * 2) | 0, ((Math.random() - .5) * V.shake * 2) | 0);
  if (V.flip) { c.translate(W, 0); c.scale(-1, 1); }
  c.drawImage(G.BG[V.bg] || G.BG[0], 0, 0); c.drawImage(G.FENCE, 0, 0);
  var order = [[V.a, 1], [V.b, -1]];
  order.sort(function (p, q) { return (RX.test(p[0].st) ? 1 : 0) - (RX.test(q[0].st) ? 1 : 0); });
  order.forEach(function (o) { drawFighter(c, o[0], o[1], V.tm); });
  (V.pj || []).forEach(function (p) { ball(c, p[1], p[2], V.tm); });
  V.parts.forEach(function (p) { drawPart(c, p); });
  c.drawImage(G.POSTS, 0, 0);
  c.restore();
  c.drawImage(G.VIG, 0, 0);
  var opp = V.flip ? V.a : V.b;
  if (V.warn && RW.test(opp.st)) bang(c, V.flip ? W - opp.x : opp.x, FY - 152, V.tm);
  c.font = '700 17px Oswald, Arial Narrow, sans-serif'; c.textAlign = 'center'; c.lineJoin = 'round';
  V.pops.forEach(function (p) {
    var x = Math.max(40, Math.min(360, V.flip ? W - p.x : p.x)); c.globalAlpha = Math.min(1, p.t * 2.2);
    c.strokeStyle = '#000'; c.lineWidth = 4; c.strokeText(p.txt, x, p.y); c.fillStyle = p.col; c.fillText(p.txt, x, p.y);
  });
  c.globalAlpha = 1;
};
})(window);
