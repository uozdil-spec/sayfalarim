/* Gizli Kelime · ortak yardımcılar: ayarlar, ses, ekran kenarları, paneller, OLED koruma  (by uozdil) */
(function (root) {
'use strict';
var GK = root.GK;
var $ = function (s, r) { return (r || document).querySelector(s); };
var LS = {
  get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
};
function rnd(n) { return Math.floor(Math.random() * n); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function tr(el, v) { el.style.webkitTransform = v; el.style.transform = v; }
function cls(el, c, on) { var s = (' ' + el.className + ' ').replace(' ' + c + ' ', ' ').replace(/\s+/g, ' ').trim(); el.className = on ? (s ? s + ' ' + c : c) : s; }
GK.$ = $; GK.LS = LS; GK.rnd = rnd; GK.esc = esc; GK.tr = tr; GK.cls = cls;

/* ---------- ayarlar ---------- */
function stat0() { return { p: 0, w: 0, cur: 0, max: 0, dist: [0, 0, 0, 0, 0, 0] }; }
var S = (function () {
  var d = { sound: true, haptic: true, anim: 'full', table: 'zumrut', renk: 'klasik', tilt: 8, oled: true, top: 0, wake: false, perf: false,
    name: '', coach: true, seen: {}, uid: '', friends: [], onl: false, q: 2, hard: false, ghost: true, kb: 'orta',
    solo: { len: 5, first: false }, ai: { opp: 1, kind: 'race', len: 5, diff: 2, rounds: 3, first: false, tempo: 2 },
    lo: { n: 2, len: 5, rounds: 3, first: false, tempo: 2 }, names: [], recent: [],
    st: { solo: stat0(), daily: stat0(), vs: { w: 0, l: 0, d: 0 } } };
  var s = LS.get('gizli.v1', null), k, fresh = !s;
  s = s || {};
  for (k in d) if (s[k] === undefined) s[k] = d[k];
  if (fresh) {
    /* Domino'daki ad, arkadaş kodu ve arkadaş listesi buraya da taşınır */
    var dm = LS.get('domino.v1', null);
    if (dm) {
      if (dm.name) s.name = String(dm.name).slice(0, 14);
      if (/^[A-Z0-9]{6}$/.test(dm.uid || '')) s.uid = dm.uid;
      if (dm.friends && dm.friends.length) s.friends = dm.friends.filter(function (f) { return f && /^[A-Z0-9]{6}$/.test(f.id || ''); }).slice(0, 24).map(function (f) { return { id: f.id, name: String(f.name || 'Arkadaş').slice(0, 14) }; });
      if (dm.top) s.top = dm.top;
    }
    var weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
    if (weak) { s.perf = true; s.q = 0; }
  }
  return s;
})();
function saveS() { LS.set('gizli.v1', S); }
GK.S = S; GK.saveS = saveS; GK.stat0 = stat0;
saveS();

/* ---------- ses ve titreşim ---------- */
var AC = null;
function audio() {
  if (!AC) { var C = root.AudioContext || root.webkitAudioContext; if (!C) return null; try { AC = new C(); } catch (e) { return null; } }
  if (AC.state === 'suspended' && AC.resume) { try { AC.resume(); } catch (e) {} }
  return AC;
}
function tone(f1, f2, dur, type, vol, delay) {
  var a = AC; if (!a || !S.sound) return;
  try {
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol || .2, t); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .03);
  } catch (e) {}
}
var SND = {
  key: function () { tone(420, 300, .035, 'triangle', .12); },
  del: function () { tone(260, 180, .04, 'triangle', .1); },
  flip: function (v, delay) { tone(v === 2 ? 660 : v === 1 ? 520 : 240, v ? 0 : 170, .09, 'triangle', v ? .14 : .1, delay); },
  win: function () { tone(523, 0, .3, 'sine', .18); tone(659, 0, .3, 'sine', .18, .14); tone(784, 0, .3, 'sine', .18, .28); tone(1047, 0, .7, 'sine', .18, .42); },
  lose: function () { tone(330, 0, .35, 'sine', .15); tone(262, 0, .4, 'sine', .15, .2); tone(196, 0, .7, 'sine', .15, .4); },
  err: function () { tone(160, 110, .14, 'square', .06); },
  ping: function () { tone(660, 0, .35, 'sine', .15); tone(880, 0, .4, 'sine', .13, .1); },
  turn: function () { tone(587, 0, .16, 'sine', .12); tone(784, 0, .22, 'sine', .12, .09); },
  tick: function () { tone(900, 0, .04, 'square', .04); }
};
function vib(p) { if (S.haptic && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }
GK.audio = audio; GK.SND = SND; GK.vib = vib;

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
GK.probeInsets = probeInsets;

/* ---------- görünüm sınıfları ---------- */
function applyLook() {
  var b = document.body;
  b.className = b.className.replace(/\b(tb|rk)-[a-z]+\b/g, '').replace(/\b(perf|q[0-9])\b/g, '').replace(/\s+/g, ' ').trim();
  b.className += ' tb-' + S.table + ' rk-' + S.renk + ' q' + (S.perf ? 0 : (S.q === 1 ? 1 : 2)) + (S.perf ? ' perf' : '');
  var t = $('#tray'); if (t) { var a = S.perf ? 0 : (S.tilt || 0); tr(t, a ? 'rotateX(' + a + 'deg)' : 'none'); }
}
GK.applyLook = applyLook;

/* ---------- OLED koruma ---------- */
var idleT = null, shiftT = null, wl = null;
function resetIdle() {
  if (document.body.className.indexOf('idle') >= 0) cls(document.body, 'idle', false);
  if (idleT) clearTimeout(idleT);
  if (S.oled) idleT = setTimeout(function () { cls(document.body, 'idle', true); }, 25000);
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
GK.resetIdle = resetIdle; GK.applyOled = applyOled; GK.wake = wake;

/* ---------- bildirim ---------- */
var toastT = null;
function toast(msg, ms) {
  var t = $('#toast'); t.textContent = msg; t.className = 'on';
  if (toastT) clearTimeout(toastT); toastT = setTimeout(function () { t.className = ''; }, ms || 1900);
}
GK.toast = toast;

/* ---------- alttan açılan paneller ---------- */
var UI = GK.UI = { sel: {} };
function stopPollHook() { if (GK.stopPoll) GK.stopPoll(); }
function openSheet(html, o) {
  UI.back = (o && o.back) || null; UI.chatOpen = false; UI.onl = false; UI.invOpen = false; UI.lobby = false; UI.endOpen = !!(o && o.end); stopPollHook();
  var sh = $('#sheet');
  sh.className = UI.back ? 'hasb' : '';
  sh.innerHTML = (UI.back ? '<button class="ib sb" data-act="sheetBack" aria-label="Geri"><svg class="i"><path d="M15 5l-7 7 7 7"/></svg></button>' : '') + html;
  $('#ov').className = 'on'; $('#ov').setAttribute('data-nc', o && o.noClose ? '1' : ''); sh.scrollTop = 0;
}
function closeSheet() {
  $('#ov').className = ''; $('#sheet').innerHTML = ''; $('#sheet').className = '';
  UI.back = null; UI.chatOpen = false; UI.onl = false; UI.invOpen = false; UI.lobby = false; UI.endOpen = false; stopPollHook();
  var e = $('#homeName'); if (e) e.textContent = S.name || 'Adını yaz';
}
function seg(key, opts, val) {
  return '<div class="seg" data-seg="' + key + '">' + opts.map(function (o) { return '<button data-v="' + o[0] + '"' + (String(o[0]) === String(val) ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('') + '</div>';
}
GK.openSheet = openSheet; GK.closeSheet = closeSheet; GK.seg = seg;
GK.SIG = '<div class="sig2"></div><div class="sig"><i></i><span>by <b>uozdil</b></span><i></i></div>';

/* renkli oyuncu simgesi */
GK.COLS = ['#f0d48a', '#8fc3ff', '#ff9a8a', '#8fe0b0'];
GK.initial = function (nm) { nm = String(nm || '?').trim(); return esc(GK.up(nm.charAt(0)) || '?'); };
/* örnek satır (kılavuz ve sonuç panelleri) */
GK.figRow = function (w, m, sm) {
  var h = '<div class="fig' + (sm ? ' sm' : '') + '">', i;
  for (i = 0; i < w.length; i++) h += '<div class="cl ' + (m ? 's' + m.charAt(i) : 'ty') + '"><b>' + GK.up(w.charAt(i)) + '</b></div>';
  return h + '</div>';
};
})(window);
