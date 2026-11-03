/* Kart Salonu · çekirdek: yardımcılar, ayarlar, ses, OLED koruma, tam ekran, bildirimler */
(function (root) {
'use strict';
var KS = root.KS;

/* ---------- DOM yardımcıları ---------- */
KS.h = function (tag, attrs) {
  var e = document.createElement(tag), i, k;
  if (attrs) for (k in attrs) {
    if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) continue;
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
    else if (k === 'style' && typeof attrs[k] === 'object') { for (var s in attrs[k]) e.style[s] = attrs[k][s]; }
    else e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
  }
  for (i = 2; i < arguments.length; i++) KS.add(e, arguments[i]);
  return e;
};
KS.add = function (e, c) {
  if (c === null || c === undefined || c === false) return e;
  if (Array.isArray(c)) { for (var i = 0; i < c.length; i++) KS.add(e, c[i]); return e; }
  e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  return e;
};
KS.$ = function (s, r) { return (r || document).querySelector(s); };
KS.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
KS.clear = function (e) { while (e.firstChild) e.removeChild(e.firstChild); return e; };
KS.ic = function (n) { var s = document.createElement('span'); s.className = 'ico'; s.innerHTML = KS.cards.icon(n); return s; };
KS.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
KS.clean = function (s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); };
KS.rid = function (n, alpha) {
  var a = alpha || 'abcdefghijklmnopqrstuvwxyz0123456789', s = '', i;
  for (i = 0; i < n; i++) s += a.charAt(Math.floor(Math.random() * a.length));
  return s;
};
KS.CODEA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/* ---------- Depolama ---------- */
KS.lsGet = function (k, d) { try { var v = localStorage.getItem('kartsalonu.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
KS.lsSet = function (k, v) { try { localStorage.setItem('kartsalonu.' + k, JSON.stringify(v)); } catch (e) {} };
KS.lsDel = function (k) { try { localStorage.removeItem('kartsalonu.' + k); } catch (e) {} };

/* ---------- Ayarlar ---------- */
KS.DEF = {
  name: '', av: '🙂', id: '',
  table: 'zumrut', back: 'safir', face: 'krem', fourc: false, bigidx: true, cardsize: 'm', shadows: 'full',
  anim: 'full', speed: 'normal', railpos: 'left',
  tap1: false, sort: 'suit', hint: false, glow: true, botspeed: 'normal', level: 'medium', turntime: 0, confirmExit: true,
  sfx: true, vol: 70, vibrate: true, ping: true,
  oled: true, shiftEvery: 60, idleDim: 60, dimLevel: 75, wake: true, autofs: false,
  safeL: 0, safeR: 0, safeT: 0, safeB: 0, uiscale: 100,
  broker: 'auto', customBroker: '',
  lastGame: 'pisti', tab: 'view'
};
KS.S = {};
KS.loadSettings = function () {
  var saved = KS.lsGet('settings', {}), k;
  for (k in KS.DEF) KS.S[k] = saved[k] !== undefined ? saved[k] : KS.DEF[k];
  if (!KS.S.id) { KS.S.id = KS.rid(8, KS.CODEA); KS.saveSettings(); }
};
KS.saveSettings = function () { KS.lsSet('settings', KS.S); };
KS.resetSettings = function () {
  var keep = { name: KS.S.name, av: KS.S.av, id: KS.S.id }, k;
  for (k in KS.DEF) KS.S[k] = KS.DEF[k];
  for (k in keep) KS.S[k] = keep[k];
  KS.saveSettings(); KS.applySettings();
};

KS.TABLES = [
  { id: 'zumrut', n: 'Zümrüt', a: '#1f7a4a', b: '#0a3a22', rim: '#caa24a' },
  { id: 'gece', n: 'Gece Mavisi', a: '#24508f', b: '#0a1a38', rim: '#aac8f0' },
  { id: 'bordo', n: 'Bordo', a: '#8c2536', b: '#3a0a16', rim: '#e6b877' },
  { id: 'ceviz', n: 'Ceviz', a: '#7a4a28', b: '#33190a', rim: '#d9b27c' },
  { id: 'kadife', n: 'Mor Kadife', a: '#5b2f8a', b: '#1d0d38', rim: '#d1b2f2' },
  { id: 'turkuaz', n: 'Turkuaz', a: '#1b7f8c', b: '#06323a', rim: '#c8f0f2' },
  { id: 'antrasit', n: 'Antrasit', a: '#3b414d', b: '#111419', rim: '#b9c0cc' },
  { id: 'siyah', n: 'Saf Siyah', a: '#0b0b0d', b: '#000000', rim: '#5b5030' }
];
KS.BACKS = [
  { id: 'safir', n: 'Safir' }, { id: 'altin', n: 'Altın' }, { id: 'zumrut', n: 'Zümrüt' },
  { id: 'bordo', n: 'Bordo' }, { id: 'selcuklu', n: 'Selçuklu' }, { id: 'siyah', n: 'Gece' }
];
KS.AVATARS = ['🙂', '😎', '🤠', '🦊', '🐻', '🦁', '🐯', '🐼', '🦉', '🐺', '🎩', '👑', '🌙', '⭐', '🔥', '🍀'];

KS.applySettings = function () {
  var S = KS.S, b = document.body, r = document.documentElement, t = null, i;
  for (i = 0; i < KS.TABLES.length; i++) if (KS.TABLES[i].id === S.table) t = KS.TABLES[i];
  t = t || KS.TABLES[0];
  r.style.setProperty('--ta', t.a); r.style.setProperty('--tb', t.b); r.style.setProperty('--trim', t.rim);
  b.setAttribute('data-back', S.back);
  b.setAttribute('data-face', S.face);
  b.classList.toggle('fourc', !!S.fourc);
  b.classList.toggle('bigidx', !!S.bigidx);
  b.classList.toggle('lite', S.anim !== 'full');
  b.classList.toggle('noanim', S.anim === 'off');
  b.classList.toggle('lshadow', S.shadows !== 'full');
  b.classList.toggle('railr', S.railpos === 'right');
  b.classList.toggle('oled', !!S.oled);
  KS.applySafe();
  r.style.setProperty('--ui', String(S.uiscale / 100));
  var sp = { fast: 0.65, normal: 1, slow: 1.5 }[S.speed] || 1;
  r.style.setProperty('--spd', String(sp));
  KS.speedMul = sp;
  KS.botMul = { fast: 0.55, normal: 1, slow: 1.6 }[S.botspeed] || 1;
  KS.oledStart();
  if (KS.onLayout) KS.onLayout();
};

/* ---------- Ses (Web Audio ile üretilir, dosya yok) ---------- */
var ac = null, master = null, verb = null, noiseBuf = null;
function ctx() {
  if (ac) { if (ac.state === 'suspended') try { ac.resume(); } catch (e) {} return ac; }
  var AC = root.AudioContext || root.webkitAudioContext;
  if (!AC) return null;
  try {
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.7; master.connect(ac.destination);
    // hafif oda yankısı
    verb = ac.createConvolver();
    var len = Math.floor(ac.sampleRate * 0.9), buf = ac.createBuffer(2, len, ac.sampleRate), ch, i;
    for (ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch); for (i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    verb.buffer = buf;
    var vg = ac.createGain(); vg.gain.value = 0.22; verb.connect(vg); vg.connect(master);
    noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.5), ac.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  } catch (e) { ac = null; }
  return ac;
}
function vol() { return KS.S.sfx ? KS.S.vol / 100 : 0; }
function out(node, wet) {
  node.connect(master);
  if (wet && verb) { var g = ac.createGain(); g.gain.value = wet; node.connect(g); g.connect(verb); }
}
function tone(f, d, type, v, delay, wet, f2) {
  var a = ctx(); if (!a || !vol()) return;
  var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * vol()), t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g); out(g, wet || 0);
  o.start(t0); o.stop(t0 + d + 0.05);
}
function noise(d, f1, f2, v, delay, q, type, wet) {
  var a = ctx(); if (!a || !vol() || !noiseBuf) return;
  var t0 = a.currentTime + (delay || 0), s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  s.buffer = noiseBuf; fl.type = type || 'bandpass'; fl.Q.value = q || 0.9;
  fl.frequency.setValueAtTime(f1, t0); fl.frequency.exponentialRampToValueAtTime(Math.max(60, f2), t0 + d);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * vol()), t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(fl); fl.connect(g); out(g, wet || 0);
  s.start(t0, Math.random() * 0.2); s.stop(t0 + d + 0.05);
}
var SFX = {
  click: function () { tone(1250, 0.05, 'triangle', 0.1); },
  deal: function (d) { noise(0.07, 4200, 1800, 0.34, d || 0, 1.1); },
  place: function (d) { noise(0.09, 2400, 700, 0.42, d || 0, 0.8, 'bandpass', 0.15); tone(150, 0.08, 'sine', 0.22, d || 0, 0, 90); },
  flip: function (d) { noise(0.06, 5200, 2600, 0.26, d || 0, 1.3); },
  take: function (d) { noise(0.18, 1800, 600, 0.3, d || 0, 0.7); tone(392, 0.28, 'triangle', 0.1, (d || 0) + 0.05, 0.3); tone(523, 0.34, 'triangle', 0.09, (d || 0) + 0.12, 0.3); },
  pisti: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.5, 'triangle', 0.17, i * 0.075, 0.45); tone(f * 2, 0.4, 'sine', 0.05, i * 0.075, 0.5); }); },
  turn: function () { tone(880, 0.16, 'sine', 0.12, 0, 0.2); tone(1318, 0.2, 'sine', 0.08, 0.08, 0.25); },
  bad: function () { tone(190, 0.16, 'sawtooth', 0.09); tone(150, 0.2, 'sawtooth', 0.08, 0.1); },
  win: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.7, 'triangle', 0.16, i * 0.11, 0.5); }); },
  lose: function () { [392, 349, 311, 262].forEach(function (f, i) { tone(f, 0.6, 'triangle', 0.13, i * 0.16, 0.4); }); },
  pop: function () { tone(660, 0.09, 'sine', 0.12, 0, 0.15, 990); },
  suit: function () { tone(700, 0.18, 'sine', 0.1, 0, 0.3, 1100); },
  draw: function (d) { noise(0.09, 3400, 1500, 0.3, d || 0, 1); noise(0.07, 3000, 1300, 0.2, (d || 0) + 0.06, 1); }
};
KS.sfx = function (n, d) { if (!KS.S.sfx) return; try { if (SFX[n]) SFX[n](d); } catch (e) {} };
KS.vib = function (p) { if (KS.S.vibrate && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} };
KS.unlockAudio = function () { ctx(); };
['pointerdown', 'touchstart', 'keydown'].forEach(function (e) { document.addEventListener(e, KS.unlockAudio, { once: false, passive: true }); });

/* ---------- Bildirim (toast) ---------- */
KS.toast = function (msg, kind, ms) {
  var box = KS.$('#toasts'); if (!box) return;
  var t = KS.h('div', { class: 'toast ' + (kind || '') }, msg);
  box.appendChild(t);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(function () { t.classList.add('out'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300); }, ms || 2400);
};

/* ---------- Pano ve paylaşım ---------- */
KS.copy = function (text) {
  function fallback() {
    var ta = KS.h('textarea', { style: { position: 'fixed', left: '-999px', top: '0' } });
    ta.value = text; document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(fallback); else fallback(); } catch (e) { fallback(); }
};
KS.share = function (title, text, url) {
  if (navigator.share) { try { navigator.share({ title: title, text: text, url: url }).catch(function () {}); return true; } catch (e) {} }
  KS.copy(url || text); KS.toast('Bağlantı kopyalandı'); return false;
};

/* ---------- Tam ekran ---------- */
KS.isFs = function () { return !!(document.fullscreenElement || document.webkitFullscreenElement); };
KS.canFs = function () { var d = document.documentElement; return !!(d.requestFullscreen || d.webkitRequestFullscreen); };
KS.toggleFs = function () {
  try {
    if (KS.isFs()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else { var d = document.documentElement; (d.requestFullscreen || d.webkitRequestFullscreen).call(d); }
  } catch (e) {}
};
/* Güvenli alan: elle verilen boşluk, cihazın çentik/kamera adası bilgisi (env) ve tam ekranda en az bir üst boşluk. Hangisi büyükse o kullanılır. */
KS.safe = function () {
  var S = KS.S, e = { t: 0, r: 0, b: 0, l: 0 };
  try {
    var p = document.createElement('div');
    p.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.appendChild(p);
    var cs = getComputedStyle(p);
    e = { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
    document.body.removeChild(p);
  } catch (x) {}
  var portrait = root.innerWidth <= root.innerHeight * 1.05;
  var gap = (portrait && (KS.isFs() || KS.isStandalone())) ? 38 : 0; // ön kamera adası (ör. Honor Magic) düğmelerin üstüne gelmesin
  return { t: Math.max(S.safeT, e.t, gap), r: Math.max(S.safeR, e.r), b: Math.max(S.safeB, e.b), l: Math.max(S.safeL, e.l) };
};
KS.applySafe = function () {
  var f = KS.safe(), r = document.documentElement;
  r.style.setProperty('--sl', f.l + 'px'); r.style.setProperty('--sr', f.r + 'px');
  r.style.setProperty('--st', f.t + 'px'); r.style.setProperty('--sb', f.b + 'px');
  return f;
};
function fsChange() {
  KS.$$('[data-fs]').forEach(function (b) { b.innerHTML = KS.cards.icon(KS.isFs() ? 'shrink' : 'expand'); });
  setTimeout(function () { KS.applySafe(); if (KS.onLayout) KS.onLayout(); }, 120);
}
document.addEventListener('fullscreenchange', fsChange);
document.addEventListener('webkitfullscreenchange', fsChange);
KS.isStandalone = function () { return (root.matchMedia && root.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) || navigator.standalone; };

/* ---------- Ekran açık kalsın ---------- */
var wl = null;
KS.keepAwake = function (on) {
  try {
    if (on && KS.S.wake && navigator.wakeLock && !wl) {
      navigator.wakeLock.request('screen').then(function (l) { wl = l; l.addEventListener('release', function () { wl = null; }); }).catch(function () {});
    } else if (!on && wl) { wl.release(); wl = null; }
  } catch (e) {}
};
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && KS.awakeWanted) KS.keepAwake(true); });

/* ---------- OLED koruma: yavaş piksel kaydırma + boşta karartma ---------- */
var oledT = null, lastAct = Date.now(), dimEl = null, shiftN = 0;
function wakeUp() { lastAct = Date.now(); if (dimEl) dimEl.classList.remove('on'); }
['pointerdown', 'keydown', 'touchstart', 'wheel', 'mousemove'].forEach(function (e) { document.addEventListener(e, wakeUp, { capture: true, passive: true }); });
KS.oledStart = function () {
  if (!dimEl) { dimEl = KS.$('#dim'); if (dimEl) dimEl.addEventListener('pointerdown', wakeUp); }
  if (oledT) clearInterval(oledT);
  oledT = setInterval(oledTick, 1000);
  oledTick();
};
function oledTick() {
  var S = KS.S, app = KS.$('#app'), now = Date.now();
  if (!app) return;
  if (!S.oled) { app.style.transform = ''; if (dimEl) dimEl.classList.remove('on'); document.body.classList.remove('idle'); return; }
  var every = Math.max(15, S.shiftEvery) * 1000;
  if (!app._ns || now - app._ns > every) {
    app._ns = now; shiftN++;
    var R = [[0, 0], [3, -2], [-3, 3], [2, 3], [-2, -3], [4, 1], [-4, -1], [1, -4]];
    var p = R[shiftN % R.length];
    app.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
  }
  var idle = (now - lastAct) / 1000;
  document.body.classList.toggle('idle', idle > 12);
  if (dimEl) {
    var on = S.idleDim > 0 && idle > S.idleDim;
    dimEl.style.setProperty('--dimop', String(S.dimLevel / 100));
    dimEl.classList.toggle('on', on);
  }
}
KS.touchActivity = wakeUp;

if (typeof module !== 'undefined' && module.exports) module.exports = KS;
})(typeof window !== 'undefined' ? window : globalThis);
