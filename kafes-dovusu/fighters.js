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
  xj: { lean: 9, crouch: 2, step: 14, hd: 3, fx: 56, fy: -5, rx: 13, ry: -2, dx: 14, k: 70 },
  wh: { lean: -9, crouch: 3, step: -5, hd: -2, fx: -10, fy: -12, rx: 20, ry: -6, dx: -5, k: 24 },
  xh: { lean: 13, crouch: 3, step: 13, hd: 5, fx: 38, fy: -14, rx: 12, ry: -4, dx: 12, k: 55 },
  wu: { lean: -5, crouch: 9, step: -3, hd: -2, fx: 16, fy: 28, rx: 17, ry: -6, dx: -3, k: 24 },
  xu: { lean: 8, crouch: -3, step: 16, hd: 6, fx: 32, fy: -34, rx: 14, ry: -4, dx: 18, k: 60 },
  wk: { lean: -8, crouch: 2, step: -4, hd: -2, fx: 20, fy: -10, rx: 12, ry: -2, dx: -3, kx: -8, ky: -30, k: 22 },
  xk: { lean: -14, crouch: 0, step: 10, hd: -3, fx: 18, fy: -14, rx: 8, ry: -6, dx: 21, kx: 40, ky: -60, k: 55 },
  wl: { lean: 3, crouch: 10, step: -3, hd: 1, fx: 22, fy: -12, rx: 20, ry: -4, dx: -4, kx: -14, ky: -12, k: 26 },
  xl: { lean: -9, crouch: 15, step: 8, hd: -2, fx: 18, fy: -10, rx: 12, ry: -2, dx: 16, kx: 52, ky: -4, k: 62 },
  dg: { lean: -13, crouch: 15, step: -8, hd: -10, fx: 20, fy: -18, rx: 24, ry: -10, dx: -15, k: 40 },
  sp: { lean: -7, crouch: 2, step: -5, hd: -2, fx: -2, fy: -30, rx: 24, ry: -10, k: 16 },
  spstrike: { lean: 9, crouch: 3, step: 18, hd: 3, fx: 52, fy: -2, rx: 12, ry: -8, dx: 10, k: 46 },
  block: { lean: 3, crouch: 4, step: 2, hd: -1, fx: 19, fy: -15, rx: 25, ry: -9, k: 22 },
  rec: { lean: 1, fx: 22, fy: 2, rx: 12, ry: 10, dx: 2, k: 14 },
  hit: { lean: -11, step: -8, hd: -9, fx: 6, fy: 16, rx: 0, ry: 18, dx: -9, k: 34 },
  /* darbenin geldiği yere göre tepki: gövdeye gelince iki büklüm, bacağa gelince diz çöker; eğilme duruşu */
  hitB: { lean: 15, crouch: 9, step: -6, hd: 7, fx: 10, fy: 26, rx: 4, ry: 28, dx: -9, k: 34 },
  hitL: { lean: 7, crouch: 13, step: -13, hd: 3, fx: 22, fy: 4, rx: 10, ry: 14, dx: -7, kx: -4, ky: -12, k: 34 },
  win: { lean: -3, crouch: -2, step: 1, hd: -2, fx: 8, fy: -44, rx: -4, ry: -42, k: 12 },
  cr: { lean: 5, crouch: 22, step: 2, hd: 1, fx: 22, fy: -14, rx: 20, ry: -9, k: 30 },
  stun: { lean: -4, crouch: 3, step: -2, hd: -3, fx: 8, fy: 18, rx: 2, ry: 20, dx: -3, k: 10 },
  ko: { lean: -6, step: -3, hd: -3, fx: 6, fy: 16, rx: 0, ry: 18, rot: 1.48, k: 6 },
  kd: { lean: -6, step: -3, hd: -3, fx: 6, fy: 16, rx: 0, ry: 18, rot: 1.48, k: 12 },
  gu: { lean: -4, crouch: 14, step: -4, hd: -2, fx: 18, fy: 4, rx: 12, ry: 12, dx: -2, k: 16 },
  jp: { lean: 3, crouch: 5, step: 6, hd: 0, fx: 24, fy: -16, rx: 14, ry: -10, kx: 8, ky: -26, k: 15 }
};
var TLEN = { level: 36, notebook: 27, tray: 19, weight: 34, 'case': 30, anchor: 36, shears: 38, wrench: 40, book: 29, axe: 40, pan: 37, nozzle: 32, stamp: 24, phone: 28, compass: 36, rod: 52, shovel: 54, stylus: 32, cleaver: 36 };
var SOFT = { fx: 1, fy: 1, rx: 1, ry: 1, kx: 1, ky: 1 };
G.mkF = function (x, look) { var p = {}, v = {}, k; for (k in BASE) { p[k] = BASE[k]; v[k] = 0; } return { x: x, look: look, st: 'idle', pst: 'idle', ph: Math.random() * 6, flash: 0, hurt: 0, tr: [], p: p, v: v }; };
/* Yay-sönüm modeli: durum değişince hız darbesi verilir, uzuvlar hedefe hafif aşıp geri oturur. Boştayken ayak ritmi, nefes ve el çemberi var. */
G.pose = function (f, dt, tm) {
  var st = f.st, sk = (f.jy > 3 && st === 'idle') ? 'jp' : (st === 'idle' && f.win ? 'win' : st === 'idle' && f.cr ? 'cr' : (st === 'hit' && f.hz === 'b' ? 'hitB' : (st === 'hit' && f.hz === 'l' ? 'hitL' : st))), B = f.look.build || 1, fr = 5.6 - (B - 1) * 2.4, s = Math.sin(tm * fr + f.ph), s2 = Math.sin(tm * fr * .5 + f.ph), c1 = Math.cos(tm * fr * .5 + f.ph * 1.3), t = {}, key, P = f.p, V = f.v, k = 14, o = POSE[sk];
  for (key in BASE) t[key] = BASE[key];
  if (o) { for (key in o) if (key !== 'k') t[key] = o[key]; k = o.k || 14; }
  else { t.bob = s * 1.7; t.crouch = 2 + s * 1.5; t.step = s2 * 3.2; t.dx = s2 * 4; t.lean = 1 + c1 * 1.6; t.hd = c1 * 1.3; t.fx = 27 + c1 * 2.6; t.fy = -6 + s * 2.4; t.rx = 15 + s * 1.6; t.ry = 6 - s * 1.6; k = 11;
    var wk = Math.min(1, Math.abs(f.mvx || 0) / 50), wp = tm * 11 + f.ph, dr = (f.mvx || 0) > 0 ? 1 : -1;
    if (wk > .05) { t.step += Math.sin(wp) * 9 * wk; t.ky -= Math.max(0, Math.cos(wp)) * 10 * wk; t.kx += Math.sin(wp) * 5 * wk; t.bob += Math.abs(Math.sin(wp)) * -2.4 * wk; t.lean += dr * 3 * wk; t.rx += Math.sin(wp) * -4 * wk; t.fx += Math.sin(wp) * 3 * wk; k = 13; } }
  if (st === 'block') { t.bob = s * .8; t.crouch += s * .8; }
  if (sk === 'cr') { t.bob = s * .6; t.fy += s * 1.2; }
  if (sk === 'win') { t.bob = s * 2.6; t.fy += s * 4; t.ry -= s * 4; t.crouch += s2 * 1.5; }
  /* alet tutan dövüşçü kolunu o kadar uzatmaz: temas eden aletin ucudur, yumruk değil */
  if ((st === 'xj' || st === 'xh' || st === 'xu') && f.look.tool && !G.GLOVES) { var tlc = Math.min(24, Math.max(0, (TLEN[f.look.tool] || 30) - 13) * .8); t.fx -= tlc * (st === 'xu' ? .35 : 1); if (st === 'xu') t.fy += tlc * .6; }
  if (st === 'stun') { t.lean += s2 * 5; t.hd += s2 * 4; }
  if (st === 'ko' || st === 'kd') { t.bob = 0; }
  if (st !== f.pst) {
    if (st === 'hit' && f.hz === 'b') { V.dx -= 120; V.lean += 150; V.hd += 60; V.crouch += 70; }
    else if (st === 'hit' && f.hz === 'l') { V.dx -= 90; V.step -= 140; V.crouch += 90; V.ky -= 60; }
    else if (st === 'hit') { V.dx -= 150; V.lean -= 110; V.hd -= 90; V.bob += 30; }
    else if (st === 'stun') { V.dx -= 70; V.lean -= 60; V.hd -= 50; }
    else if (RX.test(st)) { V.dx += 130; V.lean += 70; V.step += 60; }
    else if (st === 'dg') { V.dx -= 190; V.crouch += 80; V.lean -= 60; }
    else if (st === 'ko' || st === 'kd') { V.dx -= 110; V.lean -= 80; }
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
/* kaslı uzuv: iki eklem arası; bf ön/üst yüzün, br arka/alt yüzün şişkinliği, bp şişkinliğin uzuv boyunca yeri (0-1).
   ax, ay: 'ön' yüzün baktığı yön (bacakta ileri-yukarı, kolda yukarı). Eklem yerleri değişmez: menzil ve vuruş algılama aynı kalır. */
function ml(c, a, b, w1, w2, col, hi, sh, bf, br, bp, ax, ay) {
  var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
  if (nx * ax + ny * ay < 0) { nx = -nx; ny = -ny; }
  var mx = a.x + dx * bp, my = a.y + dy * bp, wm = (w1 + (w2 - w1) * bp) / 2, f1 = wm + bf * 2, r1 = wm + br * 2;
  c.fillStyle = col; c.beginPath();
  c.moveTo(a.x + nx * w1 / 2, a.y + ny * w1 / 2); c.quadraticCurveTo(mx + nx * f1, my + ny * f1, b.x + nx * w2 / 2, b.y + ny * w2 / 2);
  c.lineTo(b.x - nx * w2 / 2, b.y - ny * w2 / 2); c.quadraticCurveTo(mx - nx * r1, my - ny * r1, a.x - nx * w1 / 2, a.y - ny * w1 / 2); c.closePath(); c.fill();
  c.beginPath(); c.arc(a.x, a.y, w1 / 2, 0, PI * 2); c.fill(); c.beginPath(); c.arc(b.x, b.y, w2 / 2, 0, PI * 2); c.fill();
  c.lineCap = 'round';
  if (hi) { c.strokeStyle = hi; c.lineWidth = Math.max(1.4, Math.min(w1, w2) * .24); c.beginPath(); c.moveTo(a.x + nx * w1 * .22, a.y + ny * w1 * .22); c.quadraticCurveTo(mx + nx * f1 * .5, my + ny * f1 * .5, b.x + nx * w2 * .22, b.y + ny * w2 * .22); c.stroke(); }
  if (sh) { c.strokeStyle = sh; c.lineWidth = Math.max(1.4, Math.min(w1, w2) * .28); c.beginPath(); c.moveTo(a.x - nx * w1 * .27, a.y - ny * w1 * .27); c.quadraticCurveTo(mx - nx * r1 * .62, my - ny * r1 * .62, b.x - nx * w2 * .27, b.y - ny * w2 * .27); c.stroke(); }
}
/* yumruk: avuç, dört parmak boğumu, parmak araları, üstte başparmak */
function fist(c, h, a, L, Q, dark) {
  var sk = dark ? Q(L.skin, .3, 'k') : Q(L.skin), s2 = dark ? Q(L.skin2, .35, 'k') : Q(L.skin2);
  c.save(); c.translate(h.x, h.y); c.rotate(a);
  c.fillStyle = sk; rr4(c, -4.6, -5.2, 10.4, 10.4, 3.4); c.fill();
  if (!G.LOW) {
    c.fillStyle = dark ? sk : Q(L.skin, .16, 'w'); for (var i = 0; i < 4; i++) { c.beginPath(); c.arc(5.4, -3.7 + i * 2.45, 1.55, -1.5, 1.5); c.fill(); }
    c.strokeStyle = 'rgba(0,0,0,.26)'; c.lineWidth = .8; c.beginPath(); for (i = 1; i < 4; i++) { c.moveTo(1.8, -5 + i * 2.55); c.lineTo(6.2, -5 + i * 2.55); } c.stroke();
    c.fillStyle = s2; c.beginPath(); c.ellipse(1.2, 4.4, 3.8, 2.1, -.25, 0, PI * 2); c.fill();
  }
  c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; rr4(c, -4.6, -5.2, 10.4, 10.4, 3.4); c.stroke();
  c.restore();
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
  shovel: function (c, Q) { c.fillStyle = Q('#8a6238'); c.fillRect(-8, -2.4, 38, 4.8); c.fillStyle = Q('#6a4826'); c.fillRect(-8, -3.6, 7, 7.2); c.fillStyle = Q('#aab2ba'); c.beginPath(); c.moveTo(28, -3.4); c.lineTo(34, -9); c.lineTo(48, -8); c.quadraticCurveTo(54, 0, 48, 8); c.lineTo(34, 9); c.lineTo(28, 3.4); c.closePath(); c.fill(); c.fillStyle = Q('#d3d9de'); c.fillRect(34, -7, 13, 2.2); c.fillStyle = Q('#5a4026'); c.beginPath(); c.arc(44, 3, 4, 0, PI * 2); c.arc(39, 5, 3, 0, PI * 2); c.fill(); },
  stylus: function (c, Q) { c.fillStyle = Q('#2b2b36'); c.fillRect(-6, -2, 30, 4); c.fillStyle = Q('#55556a'); c.fillRect(-6, -2, 30, 1.2); c.fillStyle = Q('#e6c15a'); c.fillRect(13, -2.2, 2.6, 4.4); c.fillRect(-6, -2.2, 2, 4.4); c.fillStyle = Q('#d5dae0'); c.beginPath(); c.moveTo(24, -2); c.lineTo(31.5, 0); c.lineTo(24, 2); c.fill(); c.fillStyle = 'rgba(94,242,255,.35)'; c.beginPath(); c.arc(32, 0, 5, 0, PI * 2); c.fill(); c.fillStyle = Q('#5ef2ff'); c.beginPath(); c.arc(32, 0, 2.1, 0, PI * 2); c.fill(); },
  tablet: function (c, Q) { c.fillStyle = Q('#22222c'); c.fillRect(2, -13, 23, 26); c.fillStyle = Q('#0c2836'); c.fillRect(4, -11, 19, 22); c.strokeStyle = Q('#5ef2ff'); c.lineWidth = 1; c.beginPath(); c.moveTo(8, -3); c.lineTo(14, -7); c.lineTo(20, -3); c.lineTo(20, 5); c.lineTo(14, 9); c.lineTo(8, 5); c.closePath(); c.moveTo(8, -3); c.lineTo(14, 1); c.lineTo(20, -3); c.moveTo(14, 1); c.lineTo(14, 9); c.stroke(); c.fillStyle = Q('#ff5fb0'); c.fillRect(5.5, -10, 3, 1.6); },
  cleaver: function (c, Q) { c.fillStyle = Q('#6a4426'); c.fillRect(-6, -2.8, 18, 5.6); c.fillStyle = Q('#c4cbd2'); c.fillRect(12, -10, 24, 17); c.fillStyle = Q('#e8edf0'); c.fillRect(12, 4, 24, 3); c.fillStyle = Q('#5a5f66'); c.beginPath(); c.arc(18, -5, 2, 0, PI * 2); c.fill(); }
};
function tool(c, h, e, L, Q, dark, st, f) {
  var dx = h.x - e.x, dy = h.y - e.y, a = Math.atan2(dy, dx), strike = RX.test(st), skin = dark ? Q(L.skin, .3, 'k') : Q(L.skin), fn = TOOLS[(dark && L.tool2) || L.tool];
  if (!fn || st === 'sp' || st === 'spstrike') { fist(c, h, a, L, Q, dark); return; }
  var tgt = strike ? -.12 : (RW.test(st) ? -1.15 : -.7), key = dark ? 'tqb' : 'tqf';
  f[key] = f[key] == null ? tgt : f[key] + (tgt - f[key]) * .35;
  c.save(); c.translate(h.x, h.y); c.rotate(a + f[key]);
  if (dark) { c.globalAlpha = 1; }
  fn(c, dark ? function (x) { return Q(x, .3, 'k'); } : Q);
  c.restore();
  fist(c, h, a, L, Q, dark);
}
function hand(c, h, e, L, Q, dark, st, f) { if (G.GLOVES || !L.tool) glove(c, h, e, L.glove, Q, dark); else tool(c, h, e, L, Q, dark, st, f); }
function wire(c, x, y, s, tm, col) {
  var a = tm * 2.4, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(.6), sb = Math.sin(.6), P = [], i, v, X, Y, Z, y2;
  for (i = 0; i < 8; i++) { X = (i & 1 ? 1 : -1); Y = (i & 2 ? 1 : -1); Z = (i & 4 ? 1 : -1); v = X * ca + Z * sa; Z = -X * sa + Z * ca; y2 = Y * cb - Z * sb; P.push([x + v * s, y + y2 * s]); }
  if (!G.LOW) glow(c, x, y, s * 2.4, col, .4);
  c.lineCap = 'round'; c.lineJoin = 'round';
  [['rgba(255,95,176,.55)', 3.2], [col, 1.5]].forEach(function (w) { c.strokeStyle = w[0]; c.lineWidth = w[1]; c.beginPath(); [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { c.moveTo(P[e[0]][0], P[e[0]][1]); c.lineTo(P[e[1]][0], P[e[1]][1]); }); c.stroke(); });
  c.fillStyle = '#fff'; P.forEach(function (p) { c.fillRect(p[0] - .9, p[1] - .9, 1.8, 1.8); });
}
function paper(c, h, big) {
  c.save(); c.translate(h.x + 6, h.y - 4); c.rotate(big ? .15 : -.25);
  c.fillStyle = '#f7f4ea'; c.fillRect(-9, -12, 18, 24); c.strokeStyle = '#9a958a'; c.lineWidth = 1;
  for (var i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-6, -8 + i * 4); c.lineTo(6, -8 + i * 4); c.stroke(); }
  c.fillStyle = '#c33'; c.fillRect(2, 5, 5, 5); c.restore();
}

function rr4(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
/* profil kafa: kafatası kubbesi, alın, yanak, çene ucu, çene kemiği */
function headPath(c, x, y, bw) {
  c.beginPath(); c.moveTo(x - 9.8 * bw, y - 2.5);
  c.bezierCurveTo(x - 10.4 * bw, y - 15.5, x + 9.4 * bw, y - 16, x + 10.3 * bw, y - 3);
  c.bezierCurveTo(x + 10.8 * bw, y + 2.5, x + 10.2 * bw, y + 6.5, x + 8.8 * bw, y + 9.8);
  c.quadraticCurveTo(x + 6.4, y + 13.6, x + 1.6, y + 12.6);
  c.quadraticCurveTo(x - 5.2, y + 11.2, x - 8.2 * bw, y + 5);
  c.quadraticCurveTo(x - 10 * bw, y + 1.2, x - 9.8 * bw, y - 2.5); c.closePath();
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
  } else if (k === 'pony' && L.visor) {
    c.save(); c.translate(x + 3, y - 12.5); c.rotate(-.2);
    c.strokeStyle = Q('#22222c'); c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-1, 0); c.lineTo(-12, 2.5); c.stroke();
    c.fillStyle = lg(c, 0, -3, 0, 3, [[0, Q(L.visor, .45, 'w')], [1, Q(L.visor, .25, 'k')]]); rr4(c, -1, -2.6, 11.5, 5.2, 2.2); c.fill();
    c.strokeStyle = Q('#22222c'); c.lineWidth = 1; rr4(c, -1, -2.6, 11.5, 5.2, 2.2); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(1, -1.6, 3.4, 1); c.restore();
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
  if (P.rot > .02) { c.translate(68 * Math.min(1, P.rot / 1.48), -3); c.rotate(-P.rot); } /* yerdeki dövüşçü ekrandan taşmasın: gövde rakibe doğru kaydırılır */
  c.save(); c.translate(P.dx, 0);
  c.save(); c.scale(1, .2); if (G.LOW) { c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(0, 0, 30, 0, PI * 2); c.fill(); } else { c.fillStyle = rg(c, 0, 0, 38, [[0, 'rgba(0,0,0,.65)'], [1, 'rgba(0,0,0,0)']]); c.fillRect(-38, -38, 76, 76); } c.restore();
  c.translate(0, -(f.jy || 0));
  var hip = { x: -2 + P.step * .4 + P.lean * .15, y: -54 + P.bob * .5 + P.crouch };
  var sh = { x: hip.x + 3 + P.lean * .7, y: -91 + P.bob + P.crouch * 1.3 };
  var hd = { x: sh.x + 3 + P.hd + P.lean * .2, y: sh.y - 17 };
  var kf = ik(hip, { x: 15 + P.step + P.kx, y: P.ky }, 27, 27, 'leg'), kr = ik(hip, { x: -15 + P.step * .3, y: 0 }, 27, 27, 'leg');
  var hookArm = st === 'wh' || st === 'xh';
  var af = ik(sh, { x: sh.x + P.fx, y: sh.y + P.fy }, 23, 21, hookArm ? 'up' : 'arm'), ar = ik(sh, { x: sh.x + P.rx, y: sh.y + P.ry }, 23, 21, 'arm');
  var LB = B * (L.fem ? .82 : 1), AB = B * (L.fem ? .86 : 1);
  var upC = L.sleeve ? L.shirt : (L.vest || L.shirt), foC = L.sleeve ? L.shirt : L.skin, body = L.vest || L.shirt;
  if (L.pole && (G.GLOVES || !L.tool)) { var px0 = sh.x - 15, py0 = sh.y + 52, px1 = sh.x - 3, py1 = sh.y - 50, pl = Math.hypot(px1 - px0, py1 - py0), pux = (px1 - px0) / pl, puy = (py1 - py0) / pl; c.lineCap = 'butt'; c.lineWidth = 3.6; for (var ps = 0; ps < pl; ps += 8) { c.strokeStyle = (ps / 8) % 2 ? Q('#f4f1e8') : Q('#d0302a'); c.beginPath(); c.moveTo(px0 + pux * ps, py0 + puy * ps); c.lineTo(px0 + pux * Math.min(pl, ps + 8), py0 + puy * Math.min(pl, ps + 8)); c.stroke(); } c.fillStyle = Q('#333'); c.beginPath(); c.arc(px1, py1, 2.4, 0, PI * 2); c.fill(); }
  if (L.hose) { c.lineCap = 'round'; c.strokeStyle = Q('#1d5a2a'); c.lineWidth = 6.5; c.beginPath(); c.ellipse(sh.x - 12, sh.y + 22, 8, 20, -.15, 0, PI * 2); c.stroke(); c.strokeStyle = Q(L.hose); c.lineWidth = 4; c.beginPath(); c.ellipse(sh.x - 12, sh.y + 22, 8, 20, -.15, 0, PI * 2); c.stroke(); }
  if (L.tube) { c.lineCap = 'round'; c.strokeStyle = Q('#3a2c1a'); c.lineWidth = 9; c.beginPath(); c.moveTo(sh.x - 14, sh.y + 34); c.lineTo(sh.x - 6, sh.y - 26); c.stroke(); c.strokeStyle = Q(L.tube); c.lineWidth = 6.4; c.beginPath(); c.moveTo(sh.x - 14, sh.y + 34); c.lineTo(sh.x - 6, sh.y - 26); c.stroke(); c.strokeStyle = Q('#8a3a2a'); c.lineWidth = 7; c.beginPath(); c.moveTo(sh.x - 6.4, sh.y - 22); c.lineTo(sh.x - 6, sh.y - 26); c.stroke(); }
  /* arka kol */
  var MB = L.fem ? .55 : 1;
  ml(c, sh, ar.e, 11 * AB, 8.8 * AB, Q(upC, .3, 'k'), 0, 0, 1.1 * MB, 1.3 * MB, .42, .3, -1); ml(c, ar.e, ar.h, 8.8 * AB, L.fem ? 6 : 6.6, Q(foC, .3, 'k'), 0, 0, 1.3 * MB, .8 * MB, .3, .3, -1);
  hand(c, ar.h, ar.e, L, Q, true, st, f);
  /* arka bacak */
  ml(c, hip, kr.e, 16.5 * LB, 11.6 * LB, Q(L.pants, .3, 'k'), 0, 0, 2 * MB, 1.2 * MB, .4, 1, -1); ml(c, kr.e, kr.h, 11.6 * LB, (L.fem ? 7 : 8.4) * LB, Q(L.pants, .3, 'k'), 0, 0, .3, 2.4 * MB, .3, 1, -1);
  if (L.heels) { c.fillStyle = Q(L.shoe, .1, 'k'); c.beginPath(); c.moveTo(kr.h.x - 6, kr.h.y - 7); c.quadraticCurveTo(kr.h.x + 6, kr.h.y - 8, kr.h.x + 18, kr.h.y); c.lineTo(kr.h.x + 2, kr.h.y); c.lineTo(kr.h.x - 3, kr.h.y - 3); c.lineTo(kr.h.x - 3.5, kr.h.y); c.lineTo(kr.h.x - 6, kr.h.y); c.closePath(); c.fill(); }
  else { c.fillStyle = Q(L.shoe, .1, 'k'); c.beginPath(); c.ellipse(kr.h.x + 4, kr.h.y - 3, 11.5, 5.5, 0, 0, PI * 2); c.fill(); }
  /* gövde */
  var tw = 10 * B * (1 + ((st === 'idle' || st === 'block' || st === 'stun') ? Math.sin(tm * 2.4 + f.ph) * .03 : 0)) * (/^x[jhu]$/.test(st) ? 1.1 : (/^w[jhu]$/.test(st) ? .93 : 1)), hw = (L.fem ? 7.4 : 8.5) * B;
  c.fillStyle = Q(L.pants); c.beginPath(); c.ellipse(hip.x, hip.y + 4, hw + 1, 7, 0, 0, PI * 2); c.fill();
  var chest = (L.fem ? 1.6 : 2.8) * B;
  c.beginPath(); c.moveTo(sh.x - tw, sh.y + 2); c.quadraticCurveTo(sh.x - 2, sh.y - 7, sh.x + tw - 1, sh.y + 1);
  c.bezierCurveTo(sh.x + tw + chest, sh.y + 10, sh.x + tw + chest * .5, sh.y + 21, hip.x + hw + .4, hip.y - 9);
  c.lineTo(hip.x + hw, hip.y + 3); c.lineTo(hip.x - hw, hip.y + 3);
  c.bezierCurveTo(hip.x - hw - 1.2, hip.y - 12, sh.x - tw - 1.8, sh.y + 22, sh.x - tw, sh.y + 2); c.closePath();
  c.fillStyle = lg(c, sh.x - tw, 0, sh.x + tw, 0, [[0, Q(body, .45, 'k')], [.45, Q(body)], [1, Q(body, .3, 'w')]]); c.fill();
  c.save(); c.clip();
  c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.ellipse(sh.x + 4, sh.y + 9, 6 * B, 7, 0, 0, PI * 2); c.fill();
  if (!G.LOW) { c.strokeStyle = 'rgba(0,0,0,.13)'; c.lineWidth = .9; c.beginPath(); c.moveTo(hip.x - hw + 1, hip.y - 7); c.quadraticCurveTo(hip.x - 1, hip.y - 4, hip.x + hw - 2, hip.y - 8); c.moveTo(hip.x - hw + 2, hip.y - 2); c.quadraticCurveTo(hip.x, hip.y, hip.x + hw - 1, hip.y - 3); c.moveTo(sh.x - tw + 2, sh.y + 6); c.quadraticCurveTo(sh.x - tw + 5, sh.y + 12, sh.x - tw + 3, sh.y + 19); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.09)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(sh.x + tw - 2, sh.y + 5); c.quadraticCurveTo(sh.x + tw + chest - 1.5, sh.y + 11, sh.x + tw - 1, sh.y + 19); c.stroke(); }
  c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sh.x - 6, sh.y + 8); c.quadraticCurveTo(sh.x - 1, sh.y + 15, hip.x - 6, hip.y - 4); c.moveTo(sh.x + 5, sh.y + 20); c.quadraticCurveTo(sh.x + 1, sh.y + 26, sh.x + 7, hip.y - 2); c.stroke();
  if (L.top) {
    c.fillStyle = Q(L.top); c.beginPath(); c.moveTo(sh.x + 1, sh.y - 6); c.lineTo(sh.x + 12, sh.y - 6); c.lineTo(hip.x + 12, hip.y + 4); c.lineTo(hip.x + 2.5, hip.y + 4); c.quadraticCurveTo(sh.x + 5, sh.y + 20, sh.x + 1, sh.y - 6); c.fill();
    c.fillStyle = Q(L.shirt, .16, 'w'); c.beginPath(); c.moveTo(sh.x - 1, sh.y - 5); c.lineTo(sh.x + 3, sh.y - 5); c.lineTo(sh.x + 5.5, sh.y + 13); c.lineTo(sh.x + 1.2, sh.y + 17); c.closePath(); c.fill();
    c.strokeStyle = Q(L.shirt, .32, 'k'); c.lineWidth = 1; c.beginPath(); c.moveTo(sh.x + 1.2, sh.y + 17); c.quadraticCurveTo(sh.x + 4.5, sh.y + 26, hip.x + 2.5, hip.y + 3); c.stroke();
    c.fillStyle = Q('#e6c15a'); c.beginPath(); c.arc(sh.x + 1.8, sh.y + 21, 1.3, 0, PI * 2); c.fill();
    c.fillStyle = Q(L.visor || '#5ef2ff'); c.fillRect(sh.x - 5.5, sh.y + 9, 3.6, 1.5);
    c.strokeStyle = Q(L.shirt, .22, 'k'); c.lineWidth = .9; c.beginPath(); c.moveTo(sh.x - 7, sh.y + 27); c.lineTo(sh.x - 1.5, sh.y + 27.6); c.stroke();
  }
  if (!L.top && !L.apron && !G.LOW) { c.fillStyle = Q(body, .28, 'w'); c.beginPath(); c.moveTo(sh.x - 4, sh.y - 5); c.lineTo(sh.x + 1.5, sh.y + 3.5); c.lineTo(sh.x + 3, sh.y - 5.5); c.fill(); c.beginPath(); c.moveTo(sh.x + 3, sh.y - 5.5); c.lineTo(sh.x + 4.5, sh.y + 3); c.lineTo(sh.x + 8.5, sh.y - 4); c.fill(); }
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
  c.fillStyle = Q(body, .12, 'k'); c.beginPath(); c.moveTo(sh.x - 7.5 * B, sh.y); c.quadraticCurveTo(sh.x - 4, sh.y - 6.5, hd.x - 4.5, hd.y + 10); c.lineTo(hd.x + 2.5, hd.y + 10.5); c.quadraticCurveTo(sh.x + 3.5, sh.y - 5, sh.x + 6.5 * B, sh.y - .5); c.closePath(); c.fill();
  tl(c, { x: sh.x - 1, y: sh.y - 5 }, { x: hd.x - 1, y: hd.y + 8 }, L.fem ? 6.6 : 8.4, L.fem ? 6 : 7.4, Q(L.skin, .2, 'k'));
  if (L.top) { c.fillStyle = Q(L.top); c.beginPath(); c.ellipse(sh.x + .4, sh.y - 6.5, 5, 3.4, .25, 0, PI * 2); c.fill(); c.fillStyle = Q(L.top, .18, 'w'); c.fillRect(sh.x - 3.4, sh.y - 8.6, 7, 1.1); }
  c.fillStyle = Q(upC); c.beginPath(); c.arc(sh.x - 1, sh.y + 1, 6.5 * B, 0, PI * 2); c.fill();
  /* ön bacak */
  var kk = st === 'xk' || st === 'wk' || st === 'xl' || st === 'wl';
  ml(c, hip, kf.e, 16.5 * LB, 11.6 * LB, Q(L.pants), Q(L.pants, .22, 'w'), Q(L.pants, .25, 'k'), 2.2 * MB, 1.2 * MB, .4, 1, -1); ml(c, kf.e, kf.h, 11.6 * LB, (L.fem ? 7 : 8.4) * LB, Q(L.pants), Q(L.pants, .2, 'w'), Q(L.pants, .25, 'k'), .3, 2.6 * MB, .3, 1, -1);
  if (!G.LOW) { c.strokeStyle = 'rgba(0,0,0,.17)'; c.lineWidth = .9; c.beginPath(); c.moveTo(kf.e.x - 4.5 * LB, kf.e.y + 1); c.quadraticCurveTo(kf.e.x - 1, kf.e.y + 3.4, kf.e.x + 3 * LB, kf.e.y + 2.2); c.moveTo(kf.e.x - 4 * LB, kf.e.y - 3); c.quadraticCurveTo(kf.e.x - 1, kf.e.y - 1.2, kf.e.x + 2 * LB, kf.e.y - 3); c.moveTo(hip.x + 3, hip.y + 7); c.quadraticCurveTo(hip.x + 6, hip.y + 11, hip.x + 4, hip.y + 15); c.stroke(); }
  c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; c.beginPath(); c.arc(kf.e.x, kf.e.y, 5, 1, 2.6); c.stroke();
  if (!G.LOW) { c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.ellipse(kf.e.x + 1.5, kf.e.y - 1, 3.4 * LB, 2.6 * LB, 0, 0, PI * 2); c.fill(); c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = .9; c.beginPath(); c.moveTo(kf.e.x + 1, kf.e.y + 4); c.lineTo(kf.h.x + 1, kf.h.y - 8); c.stroke(); c.strokeStyle = Q(L.pants, .3, 'k'); c.lineWidth = 1.6; c.beginPath(); c.moveTo(kf.h.x - 4, kf.h.y - 7); c.lineTo(kf.h.x + 5, kf.h.y - 7.6); c.stroke(); }
  c.save(); c.translate(kf.h.x + 4, kf.h.y - 3); if (kk) c.rotate(st === 'xk' ? -.45 : (st === 'xl' ? -.12 : .5));
  if (L.heels) {
    c.fillStyle = Q(L.shoe); c.beginPath(); c.moveTo(-10.5, -4.5); c.quadraticCurveTo(2, -6.5, 15.5, 3); c.lineTo(-2, 3); c.lineTo(-7, -.4); c.lineTo(-7.6, 3); c.lineTo(-10.5, 3); c.closePath(); c.fill();
    c.fillStyle = Q(L.heels); c.fillRect(-10.5, 1.6, 2.9, 1.6); c.beginPath(); c.moveTo(11, 1.2); c.lineTo(15.8, 3.1); c.lineTo(10, 3.1); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-5, -4.6, 8, 1.1);
  } else {
    c.fillStyle = Q(L.shoe); c.beginPath(); c.ellipse(0, 0, 12.5, 6.2, 0, 0, PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(-4, -4.6, 9, 1.6); c.fillStyle = Q('#e8e5dc'); c.fillRect(-11, 3.6, 22, 1.6);
    if (!G.LOW) { c.fillStyle = Q(L.shoe, .22, 'k'); c.beginPath(); c.ellipse(7.5, .6, 4.8, 4.6, 0, -1.5, 1.5); c.fill(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = .9; c.beginPath(); c.moveTo(-3, -4.8); c.lineTo(0, -3); c.moveTo(0, -5.2); c.lineTo(3, -3.4); c.stroke(); }
  }
  c.restore();
  if (L.hat === 'pony') {
    var sw = Math.sin(tm * 3.2 + f.ph) * 2.2 + P.lean * .25 + (st === 'hit' || st === 'stun' ? 5 : 0) - (f.jy ? Math.min(8, f.jy * .08) : 0), tx = hd.x - 20 - sw, ty = hd.y + 31 - (f.jy ? Math.min(10, f.jy * .1) : 0);
    c.lineCap = 'round'; c.strokeStyle = Q(L.hair, .25, 'k'); c.lineWidth = 8.5; c.beginPath(); c.moveTo(hd.x - 9, hd.y - 6); c.quadraticCurveTo(hd.x - 24 - sw * .5, hd.y + 4, tx, ty); c.stroke();
    c.strokeStyle = Q(L.hair); c.lineWidth = 6; c.beginPath(); c.moveTo(hd.x - 9, hd.y - 6); c.quadraticCurveTo(hd.x - 23 - sw * .5, hd.y + 5, tx + .5, ty - 2); c.stroke();
    c.strokeStyle = Q(L.hair2 || L.hair, .1, 'w'); c.lineWidth = 1.6; c.beginPath(); c.moveTo(hd.x - 11, hd.y - 4); c.quadraticCurveTo(hd.x - 22 - sw * .5, hd.y + 6, tx + 1.5, ty - 6); c.stroke();
    c.fillStyle = Q(L.hair); c.beginPath(); c.moveTo(tx - 3.6, ty - 3); c.quadraticCurveTo(tx - 1, ty + 7, tx + 2.6, ty + 9); c.quadraticCurveTo(tx + 3, ty + 2, tx + 3.4, ty - 4); c.fill();
  }
  /* kafa: gerçekçi oran için biraz küçük, çene ucundan boyna sabit */
  c.save(); c.translate(hd.x, hd.y + 12); c.scale(.9, .9); c.translate(-hd.x, -hd.y - 12);
  var bw = 1 + (B - 1) * .2, ang = RW.test(st) || RX.test(st), hurtF = st === 'hit' || st === 'stun' || st === 'kd', ko = st === 'ko';
  var blink = !ang && ((tm * .9 + f.ph * 3) % 3.7) < .13;
  c.fillStyle = 'rgba(0,0,0,.24)'; c.beginPath(); c.ellipse(hd.x + 1, hd.y + 11.6, 6.4, 2.6, 0, 0, PI * 2); c.fill();
  c.fillStyle = rg(c, hd.x + 3, hd.y - 4, 17, [[0, Q(L.skin, .25, 'w')], [.55, Q(L.skin)], [1, Q(L.skin2)]]); headPath(c, hd.x, hd.y, bw); c.fill();
  c.fillStyle = 'rgba(0,0,0,.11)'; c.beginPath(); c.moveTo(hd.x - 7.6 * bw, hd.y + 4.5); c.quadraticCurveTo(hd.x - 3, hd.y + 13.6, hd.x + 6.4, hd.y + 11.8); c.quadraticCurveTo(hd.x - .5, hd.y + 9.2, hd.x - 7.6 * bw, hd.y + 4.5); c.fill();
  if (!G.LOW) { c.fillStyle = 'rgba(255,255,255,.09)'; c.beginPath(); c.ellipse(hd.x + 5.2, hd.y + 2.8, 3.1, 2.2, 0, 0, PI * 2); c.fill(); }
  if (L.hat === 'bun') { c.fillStyle = Q(L.hair); c.beginPath(); c.ellipse(hd.x - 1, hd.y - 5, 11, 8, 0, PI, 0); c.fill(); c.beginPath(); c.arc(hd.x - 10, hd.y - 11, 6, 0, PI * 2); c.fill(); c.fillRect(hd.x - 11, hd.y - 6, 5, 10); }
  else if (L.hat === 'pony') {
    c.fillStyle = Q(L.hair); c.beginPath(); c.ellipse(hd.x - 1.5, hd.y - 5.5, 11.6, 8.8, 0, PI, 0); c.fill();
    c.beginPath(); c.ellipse(hd.x - 6.5, hd.y - 1.5, 6, 8.6, .15, 0, PI * 2); c.fill();
    c.beginPath(); c.moveTo(hd.x - 3, hd.y - 12.5); c.quadraticCurveTo(hd.x + 9, hd.y - 14.5, hd.x + 11, hd.y - 5.5); c.quadraticCurveTo(hd.x + 7.5, hd.y - 9.5, hd.x + 1, hd.y - 8); c.quadraticCurveTo(hd.x - 2, hd.y - 4, hd.x - 2.6, hd.y + 6); c.lineTo(hd.x - 5, hd.y + 5); c.closePath(); c.fill();
    c.strokeStyle = Q(L.hair2 || L.hair, .1, 'w'); c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(hd.x - 6, hd.y - 12.6); c.quadraticCurveTo(hd.x + 4, hd.y - 14.2, hd.x + 9.4, hd.y - 8.5); c.stroke();
    c.fillStyle = Q(L.hatc || '#5ef2ff'); c.beginPath(); c.ellipse(hd.x - 10.5, hd.y - 6.5, 2.3, 3.2, .5, 0, PI * 2); c.fill();
    if (L.earring) { c.strokeStyle = Q(L.earring); c.lineWidth = 1.3; c.beginPath(); c.arc(hd.x - 2.4, hd.y + 8, 1.9, 0, PI * 2); c.stroke(); c.fillStyle = Q(L.earring, .4, 'w'); c.beginPath(); c.arc(hd.x - 2.2, hd.y + 5.6, 1, 0, PI * 2); c.fill(); }
  }
  else { c.fillStyle = Q(L.hair); c.beginPath(); c.ellipse(hd.x - 2, hd.y - 6, 10.5, 7, 0, PI, 0); c.fill(); c.fillRect(hd.x - 11, hd.y - 6, 4, 9); }
  if (!/pony|scarf|bun/.test(L.hat || '')) { c.fillStyle = Q(L.skin, .14, 'k'); c.beginPath(); c.ellipse(hd.x - 4.3, hd.y + 1.7, 2.7, 4, -.15, 0, PI * 2); c.fill(); c.strokeStyle = Q(L.skin2, .3, 'k'); c.lineWidth = .8; c.beginPath(); c.arc(hd.x - 4.1, hd.y + 1.9, 1.6, -1.3, 1.7); c.stroke(); }
  c.fillStyle = Q(L.skin, .1, 'w'); c.beginPath(); c.moveTo(hd.x + 9, hd.y - 2); c.quadraticCurveTo(hd.x + 14.5, hd.y + 3, hd.x + 10, hd.y + 4.5); c.closePath(); c.fill();
  c.strokeStyle = Q(L.skin2); c.lineWidth = .9; c.beginPath(); c.moveTo(hd.x + 10, hd.y + 4.4); c.lineTo(hd.x + 12.2, hd.y + 3.8); c.stroke();
  if (ko) { c.strokeStyle = '#111'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hd.x + 2, hd.y - 4); c.lineTo(hd.x + 7, hd.y); c.moveTo(hd.x + 7, hd.y - 4); c.lineTo(hd.x + 2, hd.y); c.stroke(); }
  else {
    c.fillStyle = '#f4f1ea'; c.beginPath(); c.ellipse(hd.x + 5.5, hd.y - 2.2, 3.3, hurtF ? 1.2 : (blink ? .4 : 2.3), 0, 0, PI * 2); c.fill();
    if (!blink) { c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(hd.x + 6.6, hd.y - 2.2, 1.5, 0, PI * 2); c.fill(); c.fillStyle = '#fff'; c.fillRect(hd.x + 6.9, hd.y - 3, .9, .9); }
    if (!L.lash) { c.strokeStyle = Q(L.skin2, .35, 'k'); c.lineWidth = .9; c.beginPath(); c.moveTo(hd.x + 2.2, hd.y - 2.6); c.quadraticCurveTo(hd.x + 5.5, hd.y - (blink || hurtF ? 3.4 : 5.2), hd.x + 8.9, hd.y - 2.8); c.stroke(); }
    if (L.lash) { c.strokeStyle = '#1a1016'; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(hd.x + 2.3, hd.y - 3); c.quadraticCurveTo(hd.x + 5.6, hd.y - (hurtF ? 4.2 : 5.6), hd.x + 9.2, hd.y - 3.9); c.lineTo(hd.x + 10.8, hd.y - 5.6); c.stroke(); c.fillStyle = 'rgba(232,110,140,.26)'; c.beginPath(); c.ellipse(hd.x + 4.6, hd.y + 3.4, 3.2, 1.9, 0, 0, PI * 2); c.fill(); }
  }
  c.strokeStyle = Q(L.hair); c.lineWidth = L.fem ? 1.25 : 2.1; c.beginPath(); c.moveTo(hd.x + 1.5, hd.y - (L.fem ? 7 : 6) - (ang ? 0 : 1)); c.lineTo(hd.x + 8.8, hd.y - 6 + (ang ? 2.8 : (hurtF ? -1.6 : 0))); c.stroke();
  if (L.must) { c.fillStyle = Q('#16110e'); c.beginPath(); c.ellipse(hd.x + 7.5, hd.y + 5.4, 5, 1.7, .06, 0, PI * 2); c.fill(); }
  if (hurtF) { c.fillStyle = '#4d1410'; c.beginPath(); c.ellipse(hd.x + 7, hd.y + 8.4, 2.8, 2.3, 0, 0, PI * 2); c.fill(); c.fillStyle = '#f2f2ee'; c.fillRect(hd.x + 5, hd.y + 7.2, 4, 1.2); }
  else if (L.lips) { c.fillStyle = Q(L.lips); c.beginPath(); c.ellipse(hd.x + 7.2, hd.y + 8.1, 2.7, ang ? 1.1 : 1.5, ang ? .12 : -.08, 0, PI * 2); c.fill(); c.strokeStyle = Q(L.lips, .4, 'k'); c.lineWidth = .7; c.beginPath(); c.moveTo(hd.x + 4.7, hd.y + 8.1); c.lineTo(hd.x + 9.7, hd.y + 8 - (ang ? 0 : .5)); c.stroke(); }
  else if (RX.test(st) && !L.beard) { c.fillStyle = '#f4f2ec'; c.fillRect(hd.x + 4.4, hd.y + 7.1, 4.8, 2.3); c.strokeStyle = '#5a2018'; c.lineWidth = .9; c.strokeRect(hd.x + 4.4, hd.y + 7.1, 4.8, 2.3); c.beginPath(); c.moveTo(hd.x + 6, hd.y + 7.1); c.lineTo(hd.x + 6, hd.y + 9.4); c.moveTo(hd.x + 7.6, hd.y + 7.1); c.lineTo(hd.x + 7.6, hd.y + 9.4); c.stroke(); }
  else { c.strokeStyle = '#6d2a20'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(hd.x + 4, hd.y + 8.2); c.lineTo(hd.x + 9, hd.y + 8.2 + (ang ? 1.2 : 0)); c.stroke(); }
  if (L.beard) { c.fillStyle = Q(L.hair === '#9a9a9a' || L.hair === '#e8e8e8' ? '#c8c8c8' : L.hair); c.beginPath(); c.moveTo(hd.x - 6, hd.y + 2); c.quadraticCurveTo(hd.x - 4, hd.y + 17, hd.x + 5, hd.y + 16); c.quadraticCurveTo(hd.x + 12, hd.y + 12, hd.x + 11, hd.y + 4); c.lineTo(hd.x + 5, hd.y + 6); c.quadraticCurveTo(hd.x, hd.y + 4, hd.x - 6, hd.y + 2); c.fill(); }
  if (L.glasses) { c.strokeStyle = '#1b1b1f'; c.lineWidth = 1.2; c.fillStyle = 'rgba(190,225,255,.28)'; c.beginPath(); c.ellipse(hd.x + 5.5, hd.y - 2, 4.4, 3.5, 0, 0, PI * 2); c.fill(); c.stroke(); c.beginPath(); c.moveTo(hd.x + 1.1, hd.y - 2); c.lineTo(hd.x - 8, hd.y - 3); c.stroke(); }
  if (f.hurt > .35 && !ko) { c.fillStyle = 'rgba(110,40,120,' + Math.min(.5, f.hurt * .55) + ')'; c.beginPath(); c.ellipse(hd.x + 6, hd.y + .8, 4.2, 2.4, 0, 0, PI * 2); c.fill(); }
  if (f.hurt > .65 && !ko) { c.strokeStyle = 'rgba(160,20,20,.85)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hd.x + 10.4, hd.y + 4.8); c.quadraticCurveTo(hd.x + 11, hd.y + 8, hd.x + 10.2, hd.y + 10); c.stroke(); }
  hat(c, L, hd, Q, st);
  if (L.headset) { c.strokeStyle = Q('#1a1a1e'); c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.arc(hd.x - 1, hd.y - 3, 12.8, PI * 1.05, PI * 1.95); c.stroke(); c.fillStyle = Q('#e0402a'); c.beginPath(); c.ellipse(hd.x - 3, hd.y + 1.5, 3.6, 5, 0, 0, PI * 2); c.fill(); c.lineWidth = 1.4; c.strokeStyle = Q('#1a1a1e'); c.beginPath(); c.moveTo(hd.x - 3, hd.y + 6); c.quadraticCurveTo(hd.x + 2, hd.y + 14, hd.x + 7.5, hd.y + 9.5); c.stroke(); c.fillStyle = Q('#1a1a1e'); c.beginPath(); c.arc(hd.x + 7.8, hd.y + 9.4, 1.8, 0, PI * 2); c.fill(); }
  c.restore();
  /* ön kol + eldiven */
  ml(c, sh, af.e, 11.5 * AB, 9.2 * AB, Q(upC), Q(upC, .22, 'w'), Q(upC, .28, 'k'), 1.2 * MB, 1.5 * MB, .42, .3, -1); ml(c, af.e, af.h, 9.2 * AB, L.fem ? 6 : 6.8, Q(foC), Q(foC, .22, 'w'), Q(foC, .25, 'k'), 1.5 * MB, .8 * MB, .3, .3, -1);
  if (!G.LOW) { var cux = af.h.x - af.e.x, cuy = af.h.y - af.e.y, cul = Math.hypot(cux, cuy) || 1, cp = L.sleeve ? { x: af.h.x - cux / cul * 5.5, y: af.h.y - cuy / cul * 5.5 } : { x: af.e.x + (sh.x - af.e.x) * .2, y: af.e.y + (sh.y - af.e.y) * .2 }, cdx = L.sleeve ? cux / cul : (af.e.x - sh.x) / (Math.hypot(af.e.x - sh.x, af.e.y - sh.y) || 1), cdy = L.sleeve ? cuy / cul : (af.e.y - sh.y) / (Math.hypot(af.e.x - sh.x, af.e.y - sh.y) || 1), cw = L.sleeve ? 3.6 : 4.8 * AB;
    c.strokeStyle = Q(upC, .32, 'k'); c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(cp.x - cdy * cw, cp.y + cdx * cw); c.lineTo(cp.x + cdy * cw, cp.y - cdx * cw); c.stroke(); }
  if (!G.LOW) { c.fillStyle = Q(upC, .2, 'w'); c.beginPath(); c.ellipse(sh.x + .5, sh.y - 1.6, 4.2 * AB, 2.6 * AB, -.5, 0, PI * 2); c.fill(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = .9; c.beginPath(); c.arc(af.e.x, af.e.y, 3.6 * AB, .6, 2.4); c.stroke(); }
  if (RW.test(st) && st !== 'sp' || RX.test(st)) { var pulse = .3 + .25 * Math.sin(tm * 30), tip = kk ? kf.h : af.h; if (!G.LOW) glow(c, tip.x, tip.y, 26, RX.test(st) ? '#ffd23f' : '#ff4a3a', pulse); }
  if (L.watch) { var wdx = af.h.x - af.e.x, wdy = af.h.y - af.e.y, wl = Math.hypot(wdx, wdy) || 1; c.strokeStyle = Q(L.watch); c.lineWidth = 2.4; c.lineCap = 'butt'; c.beginPath(); c.moveTo(af.h.x - wdx / wl * 7 - wdy / wl * 4, af.h.y - wdy / wl * 7 + wdx / wl * 4); c.lineTo(af.h.x - wdx / wl * 7 + wdy / wl * 4, af.h.y - wdy / wl * 7 - wdx / wl * 4); c.stroke(); }
  hand(c, af.h, af.e, L, Q, false, st, f);
  if (st === 'sp' || st === 'spstrike') { if (L.holo) wire(c, af.h.x + (st === 'spstrike' ? 16 : 10), af.h.y - 8, st === 'spstrike' ? 15 : 9 + Math.sin(tm * 14) * 1.5, tm, '#5ef2ff'); else paper(c, af.h, st === 'spstrike'); }
  if (st === 'block') { c.fillStyle = 'rgba(90,169,230,.22)'; c.strokeStyle = 'rgba(140,200,255,.75)'; c.lineWidth = 2; c.beginPath(); c.arc(sh.x + 8, sh.y - 6, 34, -1.1, 1.1); c.stroke(); c.lineTo(sh.x + 8, sh.y - 6); c.fill(); }
  if (st === 'dg') { c.strokeStyle = 'rgba(190,225,255,.55)'; c.lineWidth = 2; c.lineCap = 'round'; for (var wl2 = 0; wl2 < 4; wl2++) { c.beginPath(); c.moveTo(sh.x + 26 + wl2 * 5, sh.y - 20 + wl2 * 17); c.lineTo(sh.x + 44 + wl2 * 5, sh.y - 20 + wl2 * 17); c.stroke(); } }
  if (st === 'stun') for (var i = 0; i < 3; i++) { var a = tm * 5 + i * 2.1; star(c, hd.x + Math.cos(a) * 15, hd.y - 17 + Math.sin(a) * 4, 3); }
  c.restore();
  /* vuruş izi */
  var tipP = (st === 'xk' || st === 'xl') ? kf.h : (/^x[hju]$|^spstrike$/.test(st) ? af.h : null);
  if (tipP && !G.LOW) { f.tr.push({ x: tipP.x + P.dx, y: tipP.y - (f.jy || 0) }); if (f.tr.length > 7) f.tr.shift(); } else if (f.tr.length) f.tr.shift();
  c.lineCap = 'round';
  for (var j = 1; j < f.tr.length; j++) { c.strokeStyle = 'rgba(255,255,255,' + (j / f.tr.length * .5).toFixed(2) + ')'; c.lineWidth = 3 + j * (st === 'xk' || st === 'xl' ? 2.4 : 1.6); c.beginPath(); c.moveTo(f.tr[j - 1].x, f.tr[j - 1].y); c.lineTo(f.tr[j].x, f.tr[j].y); c.stroke(); }
  c.restore();
}
/* karakter seçimi için küçük önizleme: tek dövüşçü, verilen tuvale */
G.preview = function (cv, key, tm) {
  var L = typeof key === 'object' ? key : G.LOOKS[key]; if (!L) return; var c = cv.getContext('2d');
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
  else if (p.k === 'paper') { c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.c || '#f7f4ea'; c.fillRect(-5, -4, 10, 8); c.fillStyle = '#9a958a'; c.fillRect(-3, -1, 6, 1); c.fillRect(-3, 2, 6, 1); }
  else if (p.k === 'ring') { c.strokeStyle = p.c; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x, p.y, (1 - a) * 30 + 4, 0, PI * 2); c.stroke(); }
  else if (p.k === 'burst') { c.fillStyle = p.c; c.translate(p.x, p.y); for (var i = 0; i < 8; i++) { c.rotate(PI / 4); c.fillRect(6 + (1 - a) * 12, -1.5, 8 * a + 2, 3); } }
  else { c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.r || 2, 0, PI * 2); c.fill(); }
  c.restore();
}
/* ön sıradaki seyirci siluetleri (bir kez çizilir, her dilim ayrı sallanır) */
var CROWD = (function () {
  var o = document.createElement('canvas'); o.width = 400; o.height = 44; var c = o.getContext('2d'), r = G.T.rng(7), x, hats = ['#b3322b', '#2c5aa8', '#d4a72c', '#3a8f5a'];
  for (x = -4; x < 408; x += 12 + r() * 6) {
    var hy = 14 + r() * 8, up = r() < .2;
    c.fillStyle = '#07080b'; c.beginPath(); c.ellipse(x, 46, 14, 22, 0, PI, 0); c.fill();
    if (up) { c.strokeStyle = '#07080b'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 9, 30); c.lineTo(x + 14, hy - 6); c.stroke(); }
    c.beginPath(); c.arc(x, hy, 7.5, 0, PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, hy, 7.5, PI * 1.05, PI * 1.55); c.stroke();
    if (r() < .22) { c.fillStyle = hats[Math.floor(r() * 4)]; c.globalAlpha = .75; c.beginPath(); c.arc(x, hy - 1, 7.7, PI, 0); c.fill(); c.globalAlpha = 1; }
  }
  return o;
})();
/* ortamda süzülen zerrelerin rengi (mekâna göre) */
var AMB = { d: '255,244,220', 10: '94,242,255', 8: '200,225,255' };
/* V: {bg,a,b,flip,parts,pops,shake,tm,warn} — a sol, b sağ */
G.render = function (c, V) {
  c.save();
  if (V.shake > 0) c.translate(((Math.random() - .5) * V.shake * 2) | 0, ((Math.random() - .5) * V.shake * 2) | 0);
  if (V.flip) { c.translate(W, 0); c.scale(-1, 1); }
  var cam = Math.max(-1, Math.min(1, ((V.a.x + V.b.x) / 2 - 200) / 150));
  c.drawImage(G.BG[V.bg] || G.BG[0], -12 - cam * 10, 0, 424, 300); c.drawImage(G.FENCE, -20 - cam * 18, 0, 440, 300);
  if (!G.LOW) { var am = AMB[V.bg] || AMB.d, ai, ax, ay; c.fillStyle = 'rgb(' + am + ')';
    for (ai = 0; ai < 14; ai++) { ax = ((ai * 71.3 + V.tm * (5 + (ai % 4) * 3)) % 440) - 20; ay = 30 + ((ai * 47.7) % 185) + Math.sin(V.tm * .8 + ai * 1.7) * 7; c.globalAlpha = .1 + .12 * (.5 + .5 * Math.sin(V.tm * 1.3 + ai)); c.beginPath(); c.arc(ax, ay, .7 + (ai % 3) * .5, 0, PI * 2); c.fill(); }
    c.globalAlpha = 1; }
  var order = [[V.a, 1], [V.b, -1]];
  order.sort(function (p, q) { return (RX.test(p[0].st) ? 1 : 0) - (RX.test(q[0].st) ? 1 : 0); });
  order.forEach(function (o) { drawFighter(c, o[0], o[1], V.tm); });
  (V.pj || []).forEach(function (p) { if (((p[2] ? V.b : V.a).look || {}).holo) wire(c, p[1], FY - 40, 11, V.tm, '#5ef2ff'); else ball(c, p[1], p[2], V.tm); });
  if (V.rng) {
    var R = V.rng, inJ = R.dist <= R.rj, inK = R.dist <= R.rk, y0 = FY + 4;
    c.save(); c.lineCap = 'round'; c.strokeStyle = inJ ? 'rgba(255,210,63,.8)' : (inK ? 'rgba(255,150,60,.65)' : 'rgba(215,215,230,.5)');
    c.lineWidth = 2; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(R.x0, y0); c.lineTo(R.x0 + R.dir * R.rk, y0); c.stroke(); c.setLineDash([]);
    c.lineWidth = 3; c.beginPath(); c.moveTo(R.x0, y0); c.lineTo(R.x0 + R.dir * R.rj, y0); c.stroke();
    c.restore();
  }
  if (!G.LOW) for (var cs = 0; cs < 8; cs++) c.drawImage(CROWD, cs * 50, 0, 50, 44, cs * 50, 266 + Math.sin(V.tm * 2.6 + cs * 1.9) * 1.8, 50, 44);
  if (V.fl && V.fl.length) { V.fl = V.fl.filter(function (q) { return V.tm - q.t0 < .3; }); if (!G.LOW) V.fl.forEach(function (q) { var k = 1 - (V.tm - q.t0) / .3; c.globalAlpha = k; c.fillStyle = '#fff'; c.beginPath(); c.arc(q.x, q.y, 2 + k * 3, 0, PI * 2); c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(q.x - 9 * k, q.y); c.lineTo(q.x + 9 * k, q.y); c.moveTo(q.x, q.y - 7 * k); c.lineTo(q.x, q.y + 7 * k); c.stroke(); }); c.globalAlpha = 1; }
  V.parts.forEach(function (p) { drawPart(c, p); });
  c.drawImage(G.POSTS, 0, 0, W, H);
  c.restore();
  if (!G.LOW) c.drawImage(G.VIG, 0, 0, W, H);
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
