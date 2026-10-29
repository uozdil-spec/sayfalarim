/* Okey — çekirdek: ayarlar, dil, ses, pencereler, menü, düzen. */
(function () {
'use strict';
var OK = window.OK = {};
var E = window.OkeyEngine;
var root = document.documentElement;

/* ---------- küçük yardımcılar ---------- */
function h(tag, attrs) {
  var e = document.createElement(tag), k, v;
  if (attrs) for (k in attrs) {
    v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (var i = 2; i < arguments.length; i++) add(e, arguments[i]);
  return e;
}
function add(e, c) {
  if (c == null || c === false) return;
  if (Array.isArray(c)) { for (var i = 0; i < c.length; i++) add(e, c[i]); return; }
  e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
}
function $(s, r) { return (r || document).querySelector(s); }
function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; }
OK.h = h; OK.$ = $; OK.clear = clear;

function lsGet(k, d) { try { var v = localStorage.getItem('okey.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem('okey.' + k, JSON.stringify(v)); } catch (e) {} }
function lsDel(k) { try { localStorage.removeItem('okey.' + k); } catch (e) {} }
OK.lsGet = lsGet; OK.lsSet = lsSet; OK.lsDel = lsDel;

/* ---------- ayarlar ---------- */
var DEF = { lang: 'tr', theme: 'classic', tiles: 'ivory', size: 'l', sound: true, vol: 0.6, vib: true, anim: 'normal',
  lite: false, hints: true, mark: true, cb: false, startSort: 'sorted', wake: true, confirm: true, filter: true,
  oled: true, autofs: true, name: '', av: '😀', level: 'medium', speed: 'normal' };
var saved = lsGet('settings', null);
OK.S = Object.assign({}, DEF, saved || {});
if (!saved) {
  var weak = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  if (weak) OK.S.lite = true;
  var nl = (navigator.language || 'tr').toLowerCase();
  OK.S.lang = nl.indexOf('tr') === 0 ? 'tr' : 'en';
}
OK.save = function () { lsSet('settings', OK.S); };
OK.t = function (k) {
  var e = window.I18N && window.I18N[k];
  var s = e ? (e[OK.S.lang === 'en' ? 1 : 0] || e[0]) : k;
  for (var i = 1; i < arguments.length; i++) s = s.replace('{' + (i - 1) + '}', arguments[i]);
  return s;
};
var t = OK.t;

OK.apply = function () {
  var S = OK.S, b = document.body;
  b.setAttribute('data-theme', S.theme);
  b.setAttribute('data-tiles', S.tiles);
  b.classList.toggle('lite', !!S.lite);
  b.classList.toggle('mark', !!S.mark);
  b.classList.toggle('cb', !!S.cb);
  b.classList.toggle('oled', !!S.oled);
  root.lang = S.lang;
  var tc = { classic: '#0e3a21', night: '#09182f', burgundy: '#3a0b16' }[S.theme] || '#0e3a21';
  var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', tc);
  document.title = 'Okey · by uozdil';
  OK.layout();
};

/* ---------- ses ---------- */
var Snd = { ctx: null, master: null, noise: null };
Snd.init = function () {
  if (Snd.ctx) { if (Snd.ctx.state === 'suspended') Snd.ctx.resume(); return; }
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    Snd.ctx = new AC(); Snd.master = Snd.ctx.createGain(); Snd.master.connect(Snd.ctx.destination);
    var len = Snd.ctx.sampleRate * 0.12, buf = Snd.ctx.createBuffer(1, len, Snd.ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    Snd.noise = buf;
  } catch (e) { Snd.ctx = null; }
};
function tone(freq, dur, type, vol, delay) {
  var c = Snd.ctx; if (!c) return;
  var o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + (delay || 0);
  o.type = type || 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(Snd.master); o.start(t0); o.stop(t0 + dur + 0.02);
}
function click(freq, vol, delay) {
  var c = Snd.ctx; if (!c || !Snd.noise) return;
  var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t0 = c.currentTime + (delay || 0);
  s.buffer = Snd.noise; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2; g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(Snd.master); s.start(t0);
}
OK.sfx = function (name) {
  if (!OK.S.sound) return;
  Snd.init(); if (!Snd.ctx) return;
  Snd.master.gain.value = OK.S.vol;
  if (name === 'tile') { click(1800, 0.9); tone(180, 0.07, 'triangle', 0.25); }
  else if (name === 'put') { click(1200, 1); tone(120, 0.09, 'triangle', 0.35); }
  else if (name === 'deal') { for (var i = 0; i < 6; i++) click(1500 + i * 60, 0.5, i * 0.07); }
  else if (name === 'turn') { tone(660, 0.16, 'sine', 0.18); tone(880, 0.22, 'sine', 0.14, 0.09); }
  else if (name === 'win') { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.35, 'triangle', 0.3, i * 0.12); }); }
  else if (name === 'lose') { [392, 330, 262].forEach(function (f, i) { tone(f, 0.3, 'sine', 0.25, i * 0.14); }); }
  else if (name === 'err') { tone(150, 0.14, 'square', 0.12); }
  else if (name === 'msg') { tone(900, 0.08, 'sine', 0.12); }
};
OK.vib = function (ms) { if (OK.S.vib && navigator.vibrate) try { navigator.vibrate(ms || 10); } catch (e) {} };
['pointerdown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { if (OK.S.sound) Snd.init(); }, { once: false, passive: true }); });

/* ---------- ikonlar ---------- */
var P = {
  cpu: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M9 20h6M12 16v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 7h6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  shrink: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  sort: '<path d="M4 6h10M4 12h7M4 18h4M17 5v14M17 19l-3-3M17 19l3-3"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  check: '<path d="M5 13l4 4 10-10"/>'
};
OK.icon = function (n) { return h('span', { class: 'ico', html: '<svg viewBox="0 0 24 24">' + (P[n] || '') + '</svg>' }); };

/* ---------- bildirim ---------- */
OK.toast = function (msg, ms) {
  var box = $('#toasts'), el = h('div', { class: 'toast' }, msg);
  box.appendChild(el);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ms || 2400);
  return el;
};

/* ---------- pencere (modal) ---------- */
var modalStack = [];
OK.modal = function (o) {
  var card = h('div', { class: 'card' + (o.wide ? ' wide' : '') });
  var m = h('div', { class: 'modal on' }, card);
  var api = { el: m, card: card };
  api.close = function () {
    if (!m.parentNode) return;
    m.parentNode.removeChild(m);
    var i = modalStack.indexOf(api); if (i >= 0) modalStack.splice(i, 1);
    if (o.onclose) o.onclose();
  };
  if (o.title !== undefined) {
    card.appendChild(h('div', { class: 'hd' }, h('h2', null, o.title),
      o.noclose ? null : h('button', { class: 'btn iconbtn', 'aria-label': t('close'), onclick: api.close }, OK.icon('close'))));
  }
  var bd = h('div', { class: 'bd' }, o.body);
  api.body = bd;
  card.appendChild(bd);
  if (o.buttons && o.buttons.length) {
    var ft = h('div', { class: 'ft' });
    o.buttons.forEach(function (b) {
      ft.appendChild(h('button', { class: 'btn ' + (b.cls || ''), onclick: function () { if (b.onclick) { var r = b.onclick(api); if (r === false) return; } if (!b.keep) api.close(); } }, b.label));
    });
    card.appendChild(ft);
  }
  if (o.dismiss !== false) m.addEventListener('pointerdown', function (e) { if (e.target === m) api.close(); });
  $('#modals').appendChild(m);
  modalStack.push(api);
  return api;
};
OK.closeModals = function () { while (modalStack.length) modalStack[modalStack.length - 1].close(); };
OK.confirm = function (msg, yes, no, onYes) {
  OK.modal({ title: '', noclose: true, dismiss: true, body: h('p', { style: 'font-size:16px;margin:6px 0' }, msg),
    buttons: [{ label: no || t('cancel') }, { label: yes || t('ok'), cls: 'gold', onclick: onYes }] });
};

/* ---------- ekranlar ---------- */
/* ---------- Tam ekran (adres çubuğunu gizler) ---------- */
var de = document.documentElement;
OK.fsOK = function () { return !!(de.requestFullscreen || de.webkitRequestFullscreen); };
OK.isFs = function () { return !!(document.fullscreenElement || document.webkitFullscreenElement); };
OK.fs = function (on) {
  try {
    if (on && !OK.isFs()) { var r = (de.requestFullscreen || de.webkitRequestFullscreen).call(de, { navigationUI: 'hide' }); if (r && r.catch) r.catch(function () {}); }
    else if (!on && OK.isFs()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } catch (e) {}
};
OK.fsToggle = function () { OK.fsDeclined = OK.isFs(); OK.fs(!OK.isFs()); };
function onFsChange() { OK.layout(); var b = $('#bFs'); if (b) { clear(b); b.appendChild(OK.icon(OK.isFs() ? 'shrink' : 'expand')); } }
document.addEventListener('fullscreenchange', onFsChange); document.addEventListener('webkitfullscreenchange', onFsChange);
document.addEventListener('pointerdown', function () {
  if (OK.cur === 'game' && OK.S.autofs && !OK.fsDeclined && OK.fsOK() && !OK.isFs() && matchMedia('(pointer:coarse)').matches) OK.fs(true);
}, true);
OK.screen = function (name) {
  if (name === 'game' && OK.cur !== 'game') { OK.fsDeclined = false; if (OK.S.autofs && OK.fsOK() && matchMedia('(pointer:coarse)').matches) OK.fs(true); }
  if (name !== 'game' && OK.cur === 'game') OK.fs(false);
  ['menu', 'online', 'game'].forEach(function (n) { $('#' + n).classList.toggle('on', n === name); });
  OK.cur = name;
  OK.wake(name === 'game');
  OK.layout();
};
var wakeLock = null;
OK.wake = function (on) {
  try {
    if (on && OK.S.wake && navigator.wakeLock && !wakeLock) {
      navigator.wakeLock.request('screen').then(function (l) { wakeLock = l; l.addEventListener('release', function () { wakeLock = null; }); }).catch(function () {});
    } else if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
  } catch (e) {}
};
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && OK.cur === 'game') OK.wake(true); });

/* ---------- düzen: taş boyutu, istaka ---------- */
OK.layout = function () {
  var vv = window.visualViewport;
  var W = Math.round(vv ? vv.width : window.innerWidth), H = Math.round(vv ? vv.height : window.innerHeight);
  root.style.setProperty('--vh', H + 'px');
  root.style.setProperty('--vw', W + 'px');
  var land = W > H, toolsW = 54;
  function twFor(avail, c) { return avail / (c + 0.6 + 0.09 * (c - 1)); }
  var sideAvail = W - 2 * toolsW - 16 - 16, cols = 15, rows = 2, tb = false, tw;
  tw = twFor(sideAvail, 15);
  if (tw < (land ? 25 : 30)) {
    // dar ekran: araçlar istakanın üstüne, gerekirse 3 satır
    tb = true;
    var full = W - 16;
    tw = twFor(full, 15);
    if (tw < 27) { cols = 10; rows = 3; tw = twFor(full, 10); }
  }
  var maxRackH = H * (land ? 0.44 : 0.36);
  var hFor = function (r) { return maxRackH / (r * 1.32 + (r - 1) * 0.08 + 0.6); };
  tw = Math.min(tw, hFor(rows), 68);
  var f = { l: 1, m: 0.9, s: 0.8 }[OK.S.size] || 1;
  var fk = OK.fitKey === W + 'x' + H + (tb ? 't' : 's') ? OK.fitK : 1;
  tw = Math.max(18, Math.floor(tw * f * fk));
  var rackh = Math.ceil(rows * tw * 1.32 + (rows - 1) * tw * 0.08 + tw * 0.54 + 16 + (tb ? 46 : 0));
  root.style.setProperty('--tw', tw + 'px');
  root.style.setProperty('--rtw', tw + 'px');
  root.style.setProperty('--cols', cols);
  root.style.setProperty('--rackh', rackh + 'px');
  OK.dim = { W: W, H: H, tw: tw, cols: cols, rows: rows, tb: tb, land: land };
  document.body.classList.toggle('tb', tb);
  var rb = $('#rackbar');
  if (rb) { rb.style.flexDirection = tb ? 'column' : 'row'; rb.style.alignItems = tb ? 'center' : 'flex-end'; rb.style.gap = tb ? '6px' : '8px'; }
  var tools = document.querySelectorAll('.tools');
  for (var i = 0; i < tools.length; i++) {
    tools[i].style.flexDirection = tb ? 'row' : 'column';
    tools[i].style.width = tb ? 'auto' : toolsW + 'px';
    tools[i].style.order = tb ? '0' : '';
  }
  var rt = $('#rotate');
  if (rt) rt.textContent = t('rotateHint');
  var showRot = OK.cur === 'game' && !land && W < 560 && !OK.rotHide;
  if (rt) rt.classList.toggle('on', showRot);
  if (showRot && !OK.rotTimer) OK.rotTimer = setTimeout(function () { OK.rotTimer = null; OK.rotHide = true; if (rt) rt.classList.remove('on'); }, 5000);
  if (OK.game && OK.game.onLayout) OK.game.onLayout();
  if (OK.cur === 'game') requestAnimationFrame(function () { OK.fitCheck(W, H, tb); });
};
/* ekran dışına taşma kontrolü: gerekirse taşları biraz küçült */
OK.fitCheck = function (W, H, tb) {
  var rb = $('#rackbar'); if (!rb || OK.cur !== 'game') return;
  var key = W + 'x' + H + (tb ? 't' : 's');
  if (OK.fitKey !== key) { OK.fitKey = key; OK.fitK = 1; OK.fitN = 0; }
  var cs = getComputedStyle(rb), avail = rb.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  var need = 0, kids = rb.children, n = 0, i;
  for (i = 0; i < kids.length; i++) { if (kids[i].id === 'sortpop') continue; need += kids[i].getBoundingClientRect().width; n++; }
  if (!tb) need += (n - 1) * 8; else need = Math.max(need, 0);
  var rk = $('#rack').getBoundingClientRect().width;
  if (tb) need = rk;
  if (need > avail + 1 && OK.fitN < 4) { OK.fitN++; OK.fitK = OK.fitK * Math.max(.6, (avail / need) * .985); OK.layout(); }
};
window.addEventListener('resize', function () { OK.layout(); });
window.addEventListener('orientationchange', function () { setTimeout(OK.layout, 120); });
if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { OK.layout(); });

/* ---------- istatistik ---------- */
OK.stats = Object.assign({ played: 0, won: 0, streak: 0, best: 0, hands: 0, handsWon: 0, okey: 0, pairs: 0, elden: 0 }, lsGet('stats', {}));
OK.saveStats = function () { lsSet('stats', OK.stats); };

/* ---------- Menü ---------- */
function makeTile(n, c, extra) {
  return h('div', { class: 'tile c' + c + (extra ? ' ' + extra : '') }, h('span', { class: 'n' }, n), h('i', { class: 'd' }));
}
function letterTile(l, c) {
  return h('div', { class: 'tile c' + c }, h('span', { class: 'n', style: 'font-size:' + 36 + 'px' }, l), h('i', { class: 'd' }));
}
OK.renderMenu = function () {
  var menu = clear($('#menu'));
  var fl = h('div', { class: 'floaters' });
  if (!OK.S.lite) {
    for (var i = 0; i < 9; i++) {
      var tl = makeTile(1 + (i * 5) % 13, i % 4);
      tl.style.left = (6 + i * 11) % 96 + '%';
      tl.style.animationDelay = (-i * 2.4) + 's';
      tl.style.animationDuration = (20 + (i % 4) * 5) + 's';
      fl.appendChild(tl);
    }
  }
  var saved = lsGet('save', null);
  var btns = h('div', { class: 'menubtns' },
    saved ? h('button', { class: 'btn gold', onclick: function () { OK.game.resume(); } }, OK.icon('play'), h('span', null, t('resume'), h('span', { class: 'sub' }, OK.game.saveInfo(saved)))) : null,
    h('button', { class: 'btn ' + (saved ? '' : 'gold'), onclick: OK.openSetup }, OK.icon('cpu'), t('vsComputer')),
    h('button', { class: 'btn', onclick: function () { OK.online.open(); } }, OK.icon('globe'), t('playOnline')),
    h('div', { class: 'row2' },
      h('button', { class: 'btn sm', onclick: function () { OK.openHelp(); } }, OK.icon('bulb'), t('helpShort')),
      h('button', { class: 'btn sm', onclick: OK.openRules }, OK.icon('book'), t('rules')),
      h('button', { class: 'btn sm', onclick: OK.openStats }, OK.icon('chart'), t('stats')))
  );
  var brand = h('div', { class: 'brand' },
    h('div', { class: 'logo' }, letterTile('O', 3), letterTile('K', 1), letterTile('E', 2), letterTile('Y', 0)),
    h('div', { class: 'orn' }, h('i'), h('b'), h('i')),
    h('div', { class: 'tagline' }, t('tagline')));
  menu.appendChild(fl);
  menu.appendChild(h('div', { class: 'menutop l' },
    h('button', { class: 'btn iconbtn lang', 'aria-label': t('language'), onclick: function () { OK.S.lang = OK.S.lang === 'tr' ? 'en' : 'tr'; OK.save(); OK.apply(); OK.renderMenu(); } }, OK.S.lang === 'tr' ? 'TR' : 'EN')));
  menu.appendChild(h('div', { class: 'menutop' },
    h('button', { class: 'btn iconbtn', 'aria-label': t('settings'), onclick: OK.openSettings }, OK.icon('gear'))));
  menu.appendChild(h('div', { class: 'menuwrap' }, brand, btns));
  menu.appendChild(h('div', { class: 'sig' }, h('i', { class: 'ln' }), h('span', { class: 'by' }, 'by'), h('span', { class: 'nm', 'data-t': 'uozdil' }, 'uozdil'), h('i', { class: 'ln r' })));
};

/* ---------- Oyun kurma ---------- */
OK.MODES = {
  single: { vals: [], def: 0 },
  countdown: { vals: [10, 20, 40], def: 20 },
  hands: { vals: [3, 5, 11], def: 5 },
  target: { vals: [20, 50, 100], def: 50 }
};
OK.modeName = function (type, value) {
  if (type === 'single') return t('mSingle');
  if (type === 'countdown') return t('mCountdown') + ' ' + value;
  if (type === 'hands') return value + ' ' + t('mHands');
  return t('mTarget') + ' ' + value;
};
/* ayar denetimleri (çevrimdışı kurulum ve online masa için ortak) */
OK.cfgControls = function (cfg, onchange) {
  var box = h('div');
  function seg(opts, cur, cb, full) {
    var s = h('div', { class: 'seg' + (full ? ' full' : '') });
    opts.forEach(function (o) { s.appendChild(h('button', { class: cur === o.v ? 'on' : '', onclick: function () { cb(o.v); } }, o.l)); });
    return s;
  }
  function draw() {
    clear(box);
    box.appendChild(h('div', { class: 'sec' }, h('div', { class: 'lbl' }, t('gameMode')),
      seg([{ v: 'single', l: t('mSingle') }, { v: 'countdown', l: t('mCountdown') }, { v: 'hands', l: t('mHandsN') }, { v: 'target', l: t('mTarget') }], cfg.type, function (v) {
        cfg.type = v; cfg.value = OK.MODES[v].def; draw(); onchange && onchange();
      }, true)));
    var md = OK.MODES[cfg.type];
    if (md.vals.length) {
      box.appendChild(h('div', { class: 'sec' }, h('div', { class: 'lbl' }, cfg.type === 'countdown' ? t('startPoints') : cfg.type === 'hands' ? t('handCount') : t('targetPoints')),
        seg(md.vals.map(function (v) { return { v: v, l: String(v) }; }), cfg.value, function (v) { cfg.value = v; draw(); onchange && onchange(); }, true),
        h('div', { class: 'hint', style: 'margin-top:6px' }, t('mode_' + cfg.type))));
    } else box.appendChild(h('div', { class: 'hint', style: 'margin:-6px 0 14px' }, t('mode_single')));
    box.appendChild(h('div', { class: 'row' }, h('div', null, h('div', { class: 't' }, t('partnerMode')), h('div', { class: 's' }, t('partnerHint'))),
      h('button', { class: 'sw' + (cfg.partner ? ' on' : ''), onclick: function () { cfg.partner = !cfg.partner; draw(); onchange && onchange(); } })));
  }
  draw();
  return box;
};
OK.openSetup = function () {
  var last = lsGet('lastcfg', { type: 'single', value: 0, partner: false });
  var cfg = { type: last.type, value: last.value, partner: !!last.partner };
  var level = OK.S.level;
  var lvBox = h('div', { class: 'sec' });
  function drawLv() {
    clear(lvBox);
    lvBox.appendChild(h('div', { class: 'lbl' }, t('difficulty')));
    var s = h('div', { class: 'seg full' });
    [['easy', t('easy')], ['medium', t('medium')], ['hard', t('hard')]].forEach(function (o) {
      s.appendChild(h('button', { class: level === o[0] ? 'on' : '', onclick: function () { level = o[0]; drawLv(); } }, o[1]));
    });
    lvBox.appendChild(s);
  }
  drawLv();
  var body = h('div', null, OK.cfgControls(cfg), lvBox);
  OK.modal({ title: t('newGame'), body: body, buttons: [
    { label: t('cancel') },
    { label: t('start'), cls: 'gold', onclick: function () {
      OK.S.level = level; OK.save(); lsSet('lastcfg', cfg);
      OK.game.startOffline({ type: cfg.type, value: cfg.type === 'single' ? 0 : cfg.value, partner: cfg.partner }, level);
    } }] });
};


/* ---------- Yardım kılavuzu ---------- */
OK.HELP = [
  ['hg_start', ['hg_start1', 'hg_start2']],
  ['hg_turn', ['hg_turn1', 'hg_turn2', 'hg_turn3']],
  ['hg_tiles', ['hg_tiles1', 'hg_tiles2', 'hg_tiles3']],
  ['hg_btns', ['hg_btn_sort', 'hg_btn_hint', 'hg_btn_undo', 'hg_btn_fin']],
  ['hg_win', ['hg_win1', 'hg_win2']],
  ['hg_online', ['hp1', 'hp2', 'hp4']],
  ['hg_friends', ['hg_fr1', 'hg_fr2', 'hg_fr3']],
  ['hg_chat', ['hg_chat1', 'hg_chat2']],
  ['hg_settings', ['hg_set1', 'hg_set2', 'hg_set3', 'hg_set4', 'hg_set5']],
  ['hg_resume', ['hg_res1', 'hg_res2']]
];
OK.openHelp = function (open) {
  var body = h('div', { class: 'guide' }, h('p', { class: 'gintro' }, t('hg_intro')));
  OK.HELP.forEach(function (sec, n) {
    var d = h('details', open ? (open === sec[0] ? { open: 'open' } : null) : (n === 0 ? { open: 'open' } : null));
    d.appendChild(h('summary', null, t(sec[0])));
    var ul = h('ol');
    sec[1].forEach(function (k) { ul.appendChild(h('li', null, t(k))); });
    d.appendChild(ul);
    body.appendChild(d);
  });
  OK.modal({ title: t('helpBtn'), body: body, wide: true, buttons: [{ label: t('rules'), onclick: function () { setTimeout(OK.openRules, 30); } }, { label: t('ok'), cls: 'gold' }] });
};

/* ---------- Kurallar ---------- */
OK.openRules = function () {
  var s = function (k) { return h('p', null, t(k)); };
  var body = h('div', { class: 'rules' },
    h('h3', null, t('r_goal_h')), s('r_goal'),
    h('h3', null, t('r_set_h')), h('ul', null, h('li', null, t('r_run')), h('li', null, t('r_group')), h('li', null, t('r_wrap'))),
    h('h3', null, t('r_okey_h')), s('r_okey'), s('r_fake'),
    h('h3', null, t('r_turn_h')), s('r_turn'),
    h('h3', null, t('r_finish_h')), s('r_finish'), s('r_pairs'),
    h('h3', null, t('r_score_h')), h('ul', null, h('li', null, t('r_s1')), h('li', null, t('r_s2')), h('li', null, t('r_s3')), h('li', null, t('r_s4')), h('li', null, t('r_s5'))),
    h('h3', null, t('r_modes_h')), h('ul', null, h('li', null, t('r_m1')), h('li', null, t('r_m2')), h('li', null, t('r_m3')), h('li', null, t('r_m4'))),
    h('h3', null, t('r_partner_h')), s('r_partner'),
    h('h3', null, t('r_ctrl_h')), h('ul', null, h('li', null, t('r_c1')), h('li', null, t('r_c2')), h('li', null, t('r_c3')), h('li', null, t('r_c4'))));
  OK.modal({ title: t('rules'), body: body, wide: true, buttons: [{ label: t('helpBtn'), onclick: function () { setTimeout(OK.openHelp, 30); } }, { label: t('ok'), cls: 'gold' }] });
};

/* ---------- İstatistikler ---------- */
OK.openStats = function () {
  var S = OK.stats;
  function st(v, l) { return h('div', { class: 'stat' }, h('b', null, v), h('span', null, l)); }
  var rate = S.played ? Math.round(100 * S.won / S.played) + '%' : '–';
  var body = h('div', null, h('div', { class: 'stats' },
    st(S.played, t('st_played')), st(S.won, t('st_won')), st(rate, t('st_rate')), st(S.streak, t('st_streak')), st(S.best, t('st_best')),
    st(S.handsWon + '/' + S.hands, t('st_hands')), st(S.okey, t('st_okey')), st(S.pairs, t('st_pairs')), st(S.elden, t('st_elden'))));
  var hs = lsGet('hist', []);
  if (hs.length) {
    var hl = h('div', { class: 'hist' }, h('div', { class: 'lbl' }, t('histTitle')));
    hs.slice(0, 10).forEach(function (x) {
      var d = new Date(x.d), dd = ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      var sc = x.c.partner ? x.s[x.me] + ' - ' + x.s[1 - x.me] : x.s.join(' · ');
      hl.appendChild(h('div', { class: 'hrow ' + (x.w ? 'w' : 'l') }, h('span', null, dd), h('span', null, (x.on ? '🌐 ' : '') + OK.modeName(x.c.type, x.c.value)), h('b', null, sc), h('i', null, x.w ? t('hWin') : t('hLoss'))));
    });
    body.appendChild(hl);
  }
  OK.modal({ title: t('stats'), body: body, buttons: [
    { label: t('reset'), onclick: function () {
      OK.confirm(t('resetAsk'), t('reset'), t('cancel'), function () { OK.stats = { played: 0, won: 0, streak: 0, best: 0, hands: 0, handsWon: 0, okey: 0, pairs: 0, elden: 0 }; OK.saveStats(); lsSet('hist', []); });
    } }, { label: t('ok'), cls: 'gold' }] });
};

/* ---------- Ayarlar ---------- */
OK.openSettings = function () {
  var S = OK.S, body = h('div');
  function sw(key, label, sub, after) {
    return h('div', { class: 'row' }, h('div', null, h('div', { class: 't' }, label), sub ? h('div', { class: 's' }, sub) : null),
      h('button', { class: 'sw' + (S[key] ? ' on' : ''), onclick: function () { S[key] = !S[key]; OK.save(); OK.apply(); after && after(); draw(); } }));
  }
  function seg(key, opts, label) {
    var s = h('div', { class: 'seg' });
    opts.forEach(function (o) { s.appendChild(h('button', { class: S[key] === o[0] ? 'on' : '', onclick: function () { S[key] = o[0]; OK.save(); OK.apply(); OK.afterSettings(); draw(); } }, o[1])); });
    return h('div', { class: 'row' }, h('div', { class: 't' }, label), s);
  }
  function draw() {
    var top = body.parentNode ? body.parentNode.scrollTop : 0;
    clear(body);
    body.appendChild(h('div', { class: 'sec' }, h('div', { class: 'lbl' }, t('s_general')),
      seg('lang', [['tr', 'Türkçe'], ['en', 'English']], t('language')),
      h('div', { class: 'row' }, h('div', { class: 't' }, t('s_name')),
        h('input', { class: 'txt', style: 'max-width:180px', maxlength: 14, value: S.name, placeholder: t('you'), oninput: function (e) { S.name = e.target.value.slice(0, 14); OK.save(); } })),
      h('div', { class: 'row', style: 'display:block' }, h('div', { class: 't', style: 'margin-bottom:8px' }, t('s_avatar')),
        h('div', { class: 'avs' }, OK.AVATARS.map(function (a) { return h('button', { class: S.av === a ? 'on' : '', onclick: function () { S.av = a; OK.save(); draw(); } }, a); })))));
    var sw1 = h('div', { class: 'swatches' });
    [['classic', t('th_classic'), 'linear-gradient(135deg,#23743f,#0e3a21)'], ['night', t('th_night'), 'linear-gradient(135deg,#1f4a86,#09182f)'], ['burgundy', t('th_burgundy'), 'linear-gradient(135deg,#8a2434,#3a0b16)']].forEach(function (o) {
      sw1.appendChild(h('div', { class: 'swatch' + (S.theme === o[0] ? ' on' : ''), style: 'background:' + o[2], onclick: function () { S.theme = o[0]; OK.save(); OK.apply(); draw(); } }, h('span', null, o[1])));
    });
    var sw2 = h('div', { class: 'swatches' });
    [['ivory', t('ti_ivory'), 'linear-gradient(135deg,#fffaf0,#e4d7b6)'], ['dark', t('ti_dark'), 'linear-gradient(135deg,#3a3e47,#1c1e23)'], ['contrast', t('ti_contrast'), 'linear-gradient(135deg,#fff,#ddd)']].forEach(function (o) {
      sw2.appendChild(h('div', { class: 'swatch' + (S.tiles === o[0] ? ' on' : ''), style: 'background:' + o[2], onclick: function () { S.tiles = o[0]; OK.save(); OK.apply(); draw(); } }, h('span', null, o[1])));
    });
    body.appendChild(h('div', { class: 'sec' }, h('div', { class: 'lbl' }, t('s_look')),
      h('div', { style: 'margin:4px 0 10px' }, h('div', { class: 't', style: 'font-size:14px;font-weight:600;margin-bottom:6px' }, t('s_theme')), sw1),
      h('div', { style: 'margin:0 0 6px' }, h('div', { class: 't', style: 'font-size:14px;font-weight:600;margin-bottom:6px' }, t('s_tiles')), sw2),
      seg('size', [['s', t('small')], ['m', t('mid')], ['l', t('large')]], t('s_size')),
      sw('mark', t('s_mark'), t('s_mark_h')),
      sw('cb', t('s_cb'), t('s_cb_h'))));
    body.appendChild(h('div', { class: 'sec' }, h('div', { class: 'lbl' }, t('s_play')),
      seg('startSort', [['sorted', t('sorted')], ['random', t('random')]], t('s_startsort')),
      sw('hints', t('s_hints'), t('s_hints_h')),
      seg('speed', [['fast', t('fast')], ['normal', t('normal')], ['slow', t('slow')]], t('s_botspeed')),
      sw('confirm', t('s_confirm'))));
    body.appendChild(h('div', { class: 'sec' }, h('div', { class: 'lbl' }, t('s_fx')),
      sw('sound', t('s_sound'), null),
      h('div', { class: 'row' }, h('div', { class: 't' }, t('s_volume')), h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: S.vol, oninput: function (e) { S.vol = +e.target.value; OK.save(); }, onchange: function () { OK.sfx('tile'); } })),
      sw('vib', t('s_vib')),
      seg('anim', [['off', t('off')], ['fast', t('fast')], ['normal', t('normal')]], t('s_anim')),
      sw('lite', t('s_lite'), t('s_lite_h'), function () { OK.renderMenu(); }),
      sw('wake', t('s_wake')),
      sw('oled', t('s_oled'), t('s_oled_h')),
      OK.fsOK() ? sw('autofs', t('s_autofs'), t('s_autofs_h')) : null));
    body.appendChild(h('div', { class: 'sec' }, h('div', { class: 'lbl' }, t('s_chat')), sw('filter', t('s_filter'), t('s_filter_h'))));
    if (body.parentNode) body.parentNode.scrollTop = top;
  }
  draw();
  OK.modal({ title: t('settings'), body: body, buttons: [
    { label: t('defaults'), keep: false, onclick: function () {
      var keep = { name: S.name, av: S.av }; OK.S = Object.assign({}, DEF, keep); OK.save(); OK.apply(); OK.afterSettings();
    } },
    { label: t('ok'), cls: 'gold' }], onclose: OK.afterSettings, wide: true });
};
OK.afterSettings = function () {
  OK.renderMenu();
  if (OK.game && OK.game.refresh) OK.game.refresh();
};
OK.AVATARS = ['😀', '😎', '🦊', '🐻', '🐼', '🦁', '🐯', '🐸', '🦉', '🐙', '🌵', '🎩'];

/* ---------- başlangıç ---------- */
OK.init = function () {
  OK.apply();
  OK.renderMenu();
  OK.screen('menu');
  var q = new URLSearchParams(location.search), code = (q.get('oda') || q.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (code) { history.replaceState(null, '', location.pathname); setTimeout(function () { OK.online.open(code); }, 300); }
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(function () {});
};
window.addEventListener('DOMContentLoaded', function () { if (OK.game && OK.online) OK.init(); });
})();

/* ---------- OLED koruma: yavaş piksel kaydırma + boşta karartma ---------- */
(function () {
  var pos = [[0, 0], [3, 1], [0, 3], [-3, 1], [-3, -2], [0, -3], [3, -2], [1, 0]], pi = 0, last = Date.now(), dim = null;
  setInterval(function () {
    pi = (pi + 1) % pos.length;
    document.body.style.setProperty('--ox', pos[pi][0] + 'px');
    document.body.style.setProperty('--oy', pos[pi][1] + 'px');
  }, 40000);
  function wake() { last = Date.now(); if (dim) dim.classList.remove('on'); }
  ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (e) { document.addEventListener(e, wake, true); });
  setInterval(function () {
    if (!OK.S.oled) { if (dim) dim.classList.remove('on'); return; }
    if (!dim) { dim = document.createElement('div'); dim.id = 'dimmer'; document.body.appendChild(dim); }
    var limit = OK.cur === 'game' ? 150000 : 45000;
    if (Date.now() - last > limit) dim.classList.add('on');
  }, 5000);
})();
