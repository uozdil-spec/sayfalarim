/* Domino · ortak yardımcılar: ayarlar, ses, ekran kenarları, paneller, OLED koruma  (by uozdil) */
(function (root) {
'use strict';
var DM = root.DM;
var $ = function (s, r) { return (r || document).querySelector(s); };
var LS = {
  get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
};
function rnd(n) { return Math.floor(Math.random() * n); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function tr(el, v) { el.style.webkitTransform = v; el.style.transform = v; }
DM.$ = $; DM.LS = LS; DM.rnd = rnd; DM.esc = esc; DM.tr = tr;

/* ---------- ayarlar ---------- */
var S = (function () {
  var d = { sound: true, haptic: true, anim: 'full', table: 'zumrut', tile: 'fildisi', pipc: 'klasik', tilt: 34, size: 'orta',
    oled: true, top: 0, wake: false, perf: false, name: '', coach: true, seen: {}, uid: '', friends: [], onl: false,
    glow: true, one: true, autodraw: true, autopass: true, stats: { w: 0, l: 0, d: 0 },
    cfg: { opp: 1, variant: 'cek', diff: 2, target: 100, team: false }, lcfg: { n: 2, variant: 'cek', target: 100, team: false }, names: [] };
  var s = LS.get('domino.v1', {}), k;
  for (k in d) if (s[k] === undefined) s[k] = d[k];
  if (!LS.get('domino.perfset', false)) {
    var weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
    if (weak) s.perf = true;
    LS.set('domino.perfset', true);
  }
  return s;
})();
function saveS() { LS.set('domino.v1', S); }
DM.S = S; DM.saveS = saveS;

/* ---------- ses ve titreşim ---------- */
var AC = null, NB = null;
function audio() {
  if (!AC) { var C = root.AudioContext || root.webkitAudioContext; if (!C) return null; try { AC = new C(); } catch (e) { return null; } }
  if (AC.state === 'suspended' && AC.resume) { try { AC.resume(); } catch (e) {} }
  return AC;
}
function tone(f1, f2, dur, type, vol, delay) {
  var a = audio(); if (!a || !S.sound) return;
  try {
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol || .2, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .03);
  } catch (e) {}
}
function noise(dur, vol, hp, delay, lp) {
  var a = audio(); if (!a || !S.sound) return;
  try {
    if (!NB) { NB = a.createBuffer(1, a.sampleRate * 0.4, a.sampleRate); var d = NB.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var t = a.currentTime + (delay || 0), src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = NB; f.type = 'highpass'; f.frequency.value = hp || 1000;
    g.gain.setValueAtTime(vol || .2, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    src.connect(f);
    if (lp) { var l = a.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = lp; f.connect(l); l.connect(g); } else f.connect(g);
    g.connect(a.destination); src.start(t); src.stop(t + dur + .03);
  } catch (e) {}
}
var SND = {
  /* taşın masaya vurması: kısa tok bir tık + hafif gövde sesi */
  tock: function () { tone(190, 70, .08, 'triangle', .42); noise(.035, .3, 1800, 0, 6000); tone(900, 500, .03, 'square', .04); },
  sel: function () { tone(520, 0, .04, 'sine', .08); },
  deal: function () { for (var k = 0; k < 7; k++) { noise(.05, .12, 1500, k * .07, 7000); tone(160, 90, .05, 'triangle', .1, k * .07); } },
  draw: function () { noise(.14, .14, 900, 0, 5000); tone(300, 160, .08, 'triangle', .14, .05); },
  pass: function () { tone(150, 100, .09, 'triangle', .3); tone(150, 100, .09, 'triangle', .3, .16); },
  win: function () { tone(523, 0, .3, 'sine', .18); tone(659, 0, .3, 'sine', .18, .14); tone(784, 0, .3, 'sine', .18, .28); tone(1047, 0, .7, 'sine', .18, .42); },
  lose: function () { tone(330, 0, .35, 'sine', .15); tone(262, 0, .4, 'sine', .15, .2); tone(196, 0, .7, 'sine', .15, .4); },
  err: function () { tone(160, 110, .14, 'square', .06); },
  ping: function () { tone(660, 0, .35, 'sine', .15); tone(880, 0, .4, 'sine', .13, .1); }
};
function vib(p) { if (S.haptic && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }
DM.audio = audio; DM.SND = SND; DM.vib = vib;

/* ---------- ekran kenarları: kamera adası, köşe, jest çubuğu ---------- */
function probeInsets() {
  var p = document.createElement('div'), cs, names = ['--sat', '--sar', '--sab', '--sal'], res = [0, 0, 0, 0], j, tries = ['env', 'constant'];
  p.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;visibility:hidden;pointer-events:none';
  document.body.appendChild(p);
  for (var t = 0; t < tries.length; t++) {
    p.style.padding = tries[t] + '(safe-area-inset-top) ' + tries[t] + '(safe-area-inset-right) ' + tries[t] + '(safe-area-inset-bottom) ' + tries[t] + '(safe-area-inset-left)';
    cs = getComputedStyle(p);
    res = [parseFloat(cs.paddingTop) || 0, parseFloat(cs.paddingRight) || 0, parseFloat(cs.paddingBottom) || 0, parseFloat(cs.paddingLeft) || 0];
    if (res[0] || res[1] || res[2] || res[3]) break;
  }
  document.body.removeChild(p);
  for (j = 0; j < 4; j++) document.documentElement.style.setProperty(names[j], res[j] + 'px');
  document.documentElement.style.setProperty('--top', (S.top || 0) + 'px');
}
DM.probeInsets = probeInsets;

/* ---------- görünüm sınıfları ---------- */
function applyLook() {
  var b = document.body, c = ['tb-' + S.table, 'ts-' + S.tile, 'pc-' + S.pipc];
  b.className = b.className.replace(/\b(tb|ts|pc)-[a-z]+\b/g, '').replace(/\bperf\b/g, '').replace(/\s+/g, ' ').trim();
  b.className += ' ' + c.join(' ') + (S.perf ? ' perf' : '');
  var fe = $('#felt'); if (fe) { var a = S.tilt || 0; tr(fe, a ? 'rotateX(' + a + 'deg) scaleY(' + (1 / Math.cos(a * Math.PI / 180) * 1.04).toFixed(3) + ')' : 'none'); }
  var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', '#000000');
}
DM.applyLook = applyLook;

/* ---------- OLED koruma ---------- */
var idleT = null, shiftT = null, wl = null;
function resetIdle() {
  document.body.className = document.body.className.replace(/\bidle\b/g, '').replace(/\s+/g, ' ').trim();
  if (idleT) clearTimeout(idleT);
  if (S.oled) idleT = setTimeout(function () { document.body.className += ' idle'; }, 20000);
}
function applyOled() {
  resetIdle();
  var app = $('#app');
  if (shiftT) { clearInterval(shiftT); shiftT = null; }
  if (S.oled) { shiftT = setInterval(function () { tr(app, 'translate(' + (rnd(7) - 3) + 'px,' + (rnd(7) - 3) + 'px)'); }, 60000); }
  else tr(app, 'none');
}
function wake() {
  if (!S.wake) { if (wl) { try { wl.release(); } catch (e) {} wl = null; } return; }
  if (navigator.wakeLock && navigator.wakeLock.request) { try { navigator.wakeLock.request('screen').then(function (l) { wl = l; }).catch(function () {}); } catch (e) {} }
}
DM.resetIdle = resetIdle; DM.applyOled = applyOled; DM.wake = wake;

/* ---------- bildirim ---------- */
var toastT = null;
function toast(msg, ms) {
  var t = $('#toast'); t.textContent = msg; t.className = 'on';
  if (toastT) clearTimeout(toastT); toastT = setTimeout(function () { t.className = ''; }, ms || 1900);
}
DM.toast = toast;

/* ---------- alttan açılan paneller ---------- */
var UI = DM.UI = { sel: {} };
function stopPollHook() { if (DM.stopPoll) DM.stopPoll(); }
function openSheet(html, o) {
  UI.back = (o && o.back) || null; UI.chatOpen = false; UI.onl = false; UI.invOpen = false; UI.lobby = false; stopPollHook();
  var sh = $('#sheet');
  sh.className = UI.back ? 'hasb' : '';
  sh.innerHTML = (UI.back ? '<button class="ib sb" data-act="sheetBack" aria-label="Geri"><svg class="i"><path d="M15 5l-7 7 7 7"/></svg></button>' : '') + html;
  $('#ov').className = 'on'; $('#ov').setAttribute('data-nc', o && o.noClose ? '1' : ''); sh.scrollTop = 0;
}
function closeSheet() {
  $('#ov').className = ''; $('#sheet').innerHTML = ''; $('#sheet').className = '';
  UI.back = null; UI.chatOpen = false; UI.onl = false; UI.invOpen = false; UI.lobby = false; stopPollHook();
  var e = $('#homeName'); if (e) e.textContent = S.name || 'Adını yaz';
}
function seg(key, opts, val) {
  return '<div class="seg" data-seg="' + key + '">' + opts.map(function (o) { return '<button data-v="' + o[0] + '"' + (String(o[0]) === String(val) ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('') + '</div>';
}
DM.openSheet = openSheet; DM.closeSheet = closeSheet; DM.seg = seg;
DM.SIG = '<div class="sig2"></div><div class="sig"><i></i><span>by <b>uozdil</b></span><i></i></div>';

/* renkli oyuncu simgesi */
var COLS = ['#f0d48a', '#8fc3ff', '#ff9a8a', '#8fe0b0'];
DM.COLS = COLS;
DM.initial = function (nm) { nm = String(nm || '?').trim(); return esc(nm.charAt(0).toUpperCase() || '?'); };
})(window);
