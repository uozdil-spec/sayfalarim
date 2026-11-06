/* Kafes Dövüşü · arayüz çekirdeği: yardımcılar, panel, HUD ve rehber, düğmeler, OLED koruması, ayarlar ve yardım.
   Menüler, turnuva, antrenman ve çevrimiçi akışlar ui2.js içinde. */
(function (root) {
'use strict';
var KF = root.KF, G = KF.G, GFX = root.GFX, U = KF.U = {};
var $ = U.$ = function (id) { return document.getElementById(id); };
KF.loadProfile();

var IC = {
  j: '<path d="M4 12h12M12 7l5 5-5 5"/>', h: '<path d="M5 18c-1-8 4-12 12-10M13 4l5 4-4 5"/>', u: '<path d="M12 20V5M6 11l6-6 6 6"/>', k: '<path d="M9 3v9l-5 5v3h14v-4l-6-2V3z"/>', l: '<path d="M3 19h18M6 19c1-6 6-9 13-8"/>', dg: '<path d="M19 5c-7 0-12 4-12 11M3 12l4 4 4-4"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', scroll: '<path d="M6 4h10a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2z"/><path d="M9 9h6M9 13h6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', fs: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', fsx: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>', mb: '<path d="M19 12H6M11 7l-5 5 5 5"/>', mf: '<path d="M5 12h13M13 7l5 5-5 5"/>', jp: '<path d="M12 19V6M7 11l5-5 5 5"/>', dn: '<path d="M12 5v13M7 13l5 5 5-5"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>'
};
var ico = U.ico = function (n) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + '</svg>'; };
var h = U.h = function (tag, a, kids) {
  var e = document.createElement(tag), k; a = a || {};
  for (k in a) { if (k === 'text') e.textContent = a[k]; else if (k === 'html') e.innerHTML = a[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), a[k]); else if (k === 'cls') e.className = a[k]; else e.setAttribute(k, a[k]); }
  (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
};
U.btn = function (text, cls, fn) { return h('button', { cls: 'btn ' + (cls || ''), type: 'button', text: text, onclick: function () { KF.sfx('ui'); fn(); } }); };
U.T = function (tag, cls, text) { return h(tag, { cls: cls || '', text: text }); };
var toastT = null;
U.toast = function (t, bad) { var e = $('toast'); e.textContent = t; e.className = 'on' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(function () { e.className = ''; }, 3200); };
U.copyText = function (t) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { U.toast('Kopyalandı'); }, function () { U.toast('Kopyalanamadı', true); });
  else { var ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); U.toast('Kopyalandı'); } catch (e) { U.toast('Kopyalanamadı', true); } ta.remove(); }
};
U.share = function (title, text, url) { if (navigator.share) navigator.share({ title: title, text: text, url: url }).catch(function () {}); else U.copyText(text + ' ' + url); };
U.base = function () { return location.href.split('#')[0].split('?')[0]; };

/* ---------- ekran katmanı ---------- */
var ov = U.ov = $('ov');
U.showOv = function (nodes) { ov.innerHTML = ''; (Array.isArray(nodes) ? nodes : [nodes]).forEach(function (n) { if (n) ov.appendChild(typeof n === 'string' ? h('div', { html: n }) : n); }); ov.style.display = 'flex'; };
U.hideOv = function () { ov.style.display = 'none'; ov.innerHTML = ''; };
U.callout = function (txt, col) {
  var el = $('callout'); el.textContent = txt; el.style.color = col || '#fff'; el.style.fontSize = txt.length > 12 ? '22px' : ''; el.style.top = txt.length > 12 ? '4%' : '';
  if (el.animate) el.animate([{ opacity: 1, transform: 'scale(1.3)' }, { opacity: 1, transform: 'scale(1)', offset: .18 }, { opacity: 0, transform: 'scale(1)' }], { duration: 950, fill: 'forwards' }); else el.style.opacity = 1;
};

/* ---------- panel (sheet) ---------- */
var sh = null;
U.sheet = function () { return sh; };
U.closeSheet = function () { $('sheet').hidden = true; var o = sh; sh = null; G.paused = false; if (o && o.onclose) o.onclose(); };
U.openSheet = function (o) {
  if (sh) U.closeSheet();
  sh = o; $('shT').textContent = o.title; $('sheet').hidden = false;
  var tabs = $('shTabs'), body = $('shB');
  function build() {
    tabs.innerHTML = '';
    (o.tabs || []).forEach(function (t, i) { tabs.appendChild(h('button', { type: 'button', cls: i === o.tab ? 'on' : '', text: t.n, onclick: function () { o.tab = i; KF.sfx('ui'); build(); } })); });
    body.innerHTML = '';
    (o.tabs ? o.tabs[o.tab].f : o.f)(body, build);
  }
  o.refresh = build; build();
};
$('shX').innerHTML = ico('x'); $('shX').onclick = U.closeSheet; document.querySelector('.shbg').onclick = U.closeSheet;
$('menuBtn').innerHTML = ico('menu');
[['bJ', 'j'], ['bH', 'h'], ['bU', 'u'], ['bK', 'k'], ['bL', 'l'], ['bDodge', 'dg'], ['bBlock', 'shield'], ['bSpecial', 'scroll'], ].forEach(function (p) { $(p[0]).querySelector('.ic').innerHTML = ico(p[1]); });

/* ---------- ticker ---------- */
var LINES = {
  hit: ['Yumruk imzalı ve mühürlü geldi.', 'Bu darbe evrak kaydına girdi.', 'Matbu form yoktu, doğaçlama vurdu.'],
  hurt: ['Randevusuz yumruk yedin.', 'Hakem sayıyor ama sıra numarası yok.', 'e-Devlet çöktü, savunma da çöktü.'],
  block: ['Dosya iade edildi: eksik evrak.', 'Darbe görev alanı dışı olduğu için reddedildi.'],
  perfect: ['Kusursuz! Rakip kendi evrakına dolandı.', 'Tam zamanında mühür bastın.'],
  spec: ['Üç nüsha, iki mühür, tek yumruk.', 'Dilekçe imzalandı, rakip evraka boğuldu.'],
  dodge: ['Evrak ıskalandı, kaçan kurtuldu.', 'Darbe boşluğa gitti, hakem gülüyor.', 'Sıyrıldı! Rakip havayı yumrukladı.'],
  kick: ['Tekme müdürlüğü devreye girdi.', 'Bu tekme için ruhsat alınmamıştı.'],
  idle: ['Çay ocağından taze demlendi sesi geliyor.', 'Seyirciler simit paylaşıyor.', 'Hakem mesai kartını basıyor.', 'Bir kedi kafesin üstünden geçti, kimse şaşırmadı.']
};
var lastSay = 0;
var say = U.say = function (k, force) { var n = Date.now(); if (!force && n - lastSay < 2200) return; lastSay = n; var a = LINES[k]; $('ticker').textContent = a[Math.floor(Math.random() * a.length)]; };

/* ---------- HUD, rehber ve ipuçları ---------- */
var cache = {}, ALLB = ['joy', 'bJ', 'bH', 'bU', 'bK', 'bL', 'bDodge', 'bBlock', 'bSpecial'];
function setTxt(id, v) { if (cache[id] !== v) { cache[id] = v; $(id).textContent = v; } }
function setW(id, v) { v = Math.max(0, Math.min(100, v)).toFixed(1) + '%'; if (cache[id] !== v) { cache[id] = v; $(id).style.width = v; } }
function setCls(el, c, on) { if (el.classList.contains(c) !== on) el.classList.toggle(c, on); }
function setHint(id, warn) {
  var key = (id || '') + (warn ? 'w' : '');
  if (key === cache.hint) return; cache.hint = key;
  ALLB.forEach(function (b) { var e = $(b); e.classList.toggle('hint', b === id); e.classList.toggle('warnh', b === id && !!warn); });
}
U.lesson = null;
function advice(M) {
  var me = G.me, op = 1 - me, ms = M.st[me], os = M.st[op];
  if (U.lesson) return U.lesson;
  if (M.ph === 'count') return { t: 'Hazır ol', c: 'info' };
  if (M.ph !== 'fight') return { t: '', c: '' };
  if (GFX.isWind(os)) {
    if (os === 'wu') return { t: 'APARKAT geliyor! SIYRIL (savunmayı deler)', c: 'warn', b: 'bDodge', w: 1 };
    if (os === 'sp') return { t: 'DİLEKÇE geliyor! SIYRIL, savunma işe yaramaz', c: 'warn', b: 'bDodge', w: 1 };
    if (os === 'wl') return { t: 'Süpürme! SAVUN\'a bas (kaçarsan yakalanırsın)', c: 'warn', b: 'bBlock', w: 1 };
    return { t: 'Rakip vuracak! SAVUN ya da SIYRIL', c: 'warn', b: 'bBlock', w: 1 };
  }
  if (ms === 'stun' || ms === 'hit') return { t: 'Sersemledin', c: 'warn' };
  if (M.sp[me] >= 100 && ms === 'idle') return { t: 'DİLEKÇE hazır, fırlat!', c: 'good', b: 'bSpecial' };
  if (os === 'dg') return { t: 'Rakip kaçıyor: SÜPÜR ile yakala', c: 'good', b: 'bL' };
  if (os === 'stun') return { t: 'Rakip sersemledi, APARKAT!', c: 'good', b: 'bU' };
  if (os === 'hit' || os === 'rec') return { t: 'Şimdi vur!', c: 'good', b: 'bJ' };
  if (os === 'block') return { t: 'Rakip korumada: APARKAT savunmayı deler', c: 'info', b: 'bU' };
  if (ms === 'block') return { t: 'Savunmadasın. Vurmak için bir vuruşa bas', c: 'info' };
  return { t: 'DÜZ ile başla, rakibi kolla', c: '', b: 'bJ' };
}
function hud(M) {
  var me = G.me, op = 1 - me, S = KF.S, idle = G.mode === 'menu' || !M;
  var nm = idle ? [S.name || 'SEN', 'RAKİP'] : [G.names[me], G.names[op]], av = idle ? [S.av, '🥊'] : [G.avs[me], G.avs[op]];
  setTxt('mNm', nm[0]); setTxt('oNm', nm[1]); setTxt('mAv', av[0]); setTxt('oAv', av[1]);
  if (idle) { setW('mHp', 100); setW('oHp', 100); setW('mHpG', 100); setW('oHpG', 100); setW('mSp', 0); setW('oSp', 0); setW('stb', 100); setHint(null); setTxt('cmb', ''); return; }
  setW('mHp', M.hp[me] / M.max[me] * 100); setW('mHpG', M.hp[me] / M.max[me] * 100); setW('oHp', M.hp[op] / M.max[op] * 100); setW('oHpG', M.hp[op] / M.max[op] * 100);
  setW('mSp', M.sp[me]); setW('oSp', M.sp[op]); setW('stb', M.stam[me]);
  var pvp = G.mode === 'host' || G.mode === 'guest';
  setTxt('rnd', pvp ? 'RAUND ' + M.rn : (G.train ? 'ANTRENMAN' : (G.lv >= 0 ? 'MAÇ ' + (G.lv + 1) + '/' + KF.LADDER.length : 'SERBEST MAÇ')));
  setTxt('tmr', G.train ? '∞' : String(M.tm));
  var pips = '', i;
  if (pvp) { for (i = 0; i < 2; i++) pips += '<i class="' + (i < M.sc[me] ? 'w' : '') + '"></i>'; for (i = 0; i < 2; i++) pips += '<i class="' + (i < M.sc[op] ? 'l' : '') + '"></i>'; }
  if (cache.pips !== pips) { cache.pips = pips; $('pips').innerHTML = pips; }
  var fight = M.ph === 'fight';
  setCls($('bSpecial'), 'rdy', fight && M.sp[me] >= 100); setCls($('bBlock'), 'on', M.st[me] === 'block');
  setTxt('cmb', M.combo[me] >= 2 ? M.combo[me] + 'x KOMBO' : '');
  var a = advice(M);
  if (cache.coach !== a.t + a.c) { cache.coach = a.t + a.c; var el = $('coach'); el.textContent = a.t; el.className = a.c; }
  setHint(S.guide && fight || U.lesson ? (a.b || null) : null, a.w);
}

/* ---------- düğmeler ---------- */
var blockDown = false;
var playing = U.playing = function () { return G.mode === 'solo' || G.mode === 'host' || G.mode === 'guest'; };
var dnHeld = false;
function press(k) { if (!playing()) return; if (dnHeld && (k === 'j' || k === 'u' || k === 'k')) k = 'x' + k; G.input(k); if (U.onPress) U.onPress(k); }
/* yön tuşu: Brawl Stars gibi sanal joystick. Sağa ileri, sola geri, yukarı zıpla, aşağı eğil (basılı) */
function moveOn(k) { if (playing()) { G.input(k); if (U.onPress) U.onPress(k); } }
var joy = $('joy'), knob = $('joyK'), jid = null, js = { f: 0, b: 0, u: 0, d: 0 };
function buzz(n) { if (KF.S.vib) try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} }
function joyApply(dx, dy) {
  var f = dx > .28 ? 1 : 0, b = dx < -.28 ? 1 : 0, u = dy < -.5 ? 1 : 0, d = dy > .5 ? 1 : 0;
  if (f !== js.f) { js.f = f; if (f) { moveOn('mf'); buzz(6); } else G.input('mfu'); }
  if (b !== js.b) { js.b = b; if (b) { moveOn('mb'); buzz(6); } else G.input('mbu'); }
  if (u && !js.u) { moveOn('jp'); buzz(10); } js.u = u;
  if (d !== js.d) { js.d = d; dnHeld = !!d; if (d) { moveOn('dn'); buzz(6); } }
  joy.classList.toggle('af', !!f); joy.classList.toggle('ab', !!b); joy.classList.toggle('au', !!u); joy.classList.toggle('ad', !!d);
}
function joyPos(e) {
  var r = joy.getBoundingClientRect(), R = r.width / 2, dx = (e.clientX - r.left - R) / R, dy = (e.clientY - r.top - R) / R, m = Math.hypot(dx, dy);
  if (m > 1) { dx /= m; dy /= m; }
  knob.style.transform = 'translate(' + (dx * R * .5).toFixed(1) + 'px,' + (dy * R * .5).toFixed(1) + 'px)';
  joyApply(dx, dy);
}
function joyEnd(e) { if (jid === null || (e && e.pointerId !== jid)) return; jid = null; knob.style.transform = ''; joyApply(0, 0); joy.classList.remove('on'); }
joy.addEventListener('pointerdown', function (e) { e.preventDefault(); if (jid !== null) return; jid = e.pointerId; try { joy.setPointerCapture(jid); } catch (x) {} joy.classList.add('on'); joyPos(e); });
joy.addEventListener('pointermove', function (e) { if (e.pointerId === jid) { e.preventDefault(); joyPos(e); } });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (n) { joy.addEventListener(n, joyEnd); });
window.addEventListener('blur', function () { joyEnd(); });
U.resetMove = function () { jid = null; knob.style.transform = ''; js = { f: 0, b: 0, u: 0, d: 0 }; dnHeld = false; joy.className = ''; };
function blockOn() { if (!blockDown && playing()) { blockDown = true; press('bd'); } }
function blockOff() { if (blockDown) { blockDown = false; G.input('bu'); } }
U.resetBlock = function () { blockDown = false; };
Array.prototype.forEach.call(document.querySelectorAll('.mv'), function (el) { el.addEventListener('pointerdown', function (e) { e.preventDefault(); press(el.dataset.k); }); });
$('bSpecial').addEventListener('pointerdown', function (e) { e.preventDefault(); press('s'); });
$('bDodge').addEventListener('pointerdown', function (e) { e.preventDefault(); press('dg'); });
$('bBlock').addEventListener('pointerdown', function (e) { e.preventDefault(); blockOn(); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { $('bBlock').addEventListener(n, blockOff); });
window.addEventListener('pointerup', blockOff); window.addEventListener('blur', blockOff);
var KM = { a: 'j', s: 'h', d: 'u', f: 'k', x: 'l', z: 'dg', enter: 's', g: 's' }, kHeld = {};
window.addEventListener('keydown', function (e) {
  if (e.repeat || !playing()) return; var k = e.key.toLowerCase();
  if (KM[k]) { e.preventDefault(); press(KM[k]); } else if (k === ' ' || k === 'shift') { e.preventDefault(); blockOn(); }
  else if (k === 'arrowright') { e.preventDefault(); kHeld[k] = 1; moveOn('mf'); } else if (k === 'arrowleft') { e.preventDefault(); kHeld[k] = 1; moveOn('mb'); }
  else if (k === 'arrowup') { e.preventDefault(); moveOn('jp'); } else if (k === 'arrowdown') { e.preventDefault(); dnHeld = true; moveOn('dn'); }
});
window.addEventListener('keyup', function (e) {
  var k = e.key.toLowerCase(); if (k === ' ' || k === 'shift') blockOff();
  else if (k === 'arrowright' && kHeld[k]) { kHeld[k] = 0; G.input('mfu'); } else if (k === 'arrowleft' && kHeld[k]) { kHeld[k] = 0; G.input('mbu'); } else if (k === 'arrowdown') dnHeld = false;
});
document.addEventListener('contextmenu', function (e) { e.preventDefault(); });

/* ---------- OLED koruması ---------- */
var lastAct = Date.now(), shiftN = 0, shiftT = 0, wl = null;
function wake() { lastAct = Date.now(); $('dim').classList.remove('on'); }
['pointerdown', 'keydown', 'touchstart'].forEach(function (e) { document.addEventListener(e, wake, { capture: true, passive: true }); });
setInterval(function () {
  var S = KF.S, app = $('app'), now = Date.now(), idle = (now - lastAct) / 1000;
  if (!S.oled) { app.style.transform = ''; $('dim').classList.remove('on'); document.body.classList.remove('idle'); return; }
  if (now - shiftT > Math.max(15, S.shiftEvery) * 1000) {
    shiftT = now; shiftN++;
    var R = [[0, 0], [3, -2], [-3, 3], [2, 3], [-2, -3], [4, 1], [-4, -1], [1, -4]], p = R[shiftN % R.length];
    app.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
  }
  document.body.classList.toggle('idle', idle > 12);
  $('dim').style.setProperty('--dimop', '.78'); $('dim').classList.toggle('on', S.idleDim > 0 && idle > S.idleDim && !playing());
}, 1000);
U.keepAwake = function (on) {
  try { if (on && navigator.wakeLock && !wl) navigator.wakeLock.request('screen').then(function (l) { wl = l; l.addEventListener('release', function () { wl = null; }); }).catch(function () {}); else if (!on && wl) { wl.release(); wl = null; } } catch (e) {}
};
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && playing()) U.keepAwake(true); });

/* ---------- ayarlar ve yardım ---------- */
function sw(label, sub, key, after) {
  var t = h('button', { cls: 'tg' + (KF.S[key] ? ' on' : ''), type: 'button', role: 'switch', 'aria-checked': String(!!KF.S[key]), onclick: function () { KF.S[key] = !KF.S[key]; t.classList.toggle('on', KF.S[key]); t.setAttribute('aria-checked', String(!!KF.S[key])); KF.saveProfile(); if (after) after(); } });
  return h('div', { cls: 'sw' }, [h('span', { html: label + (sub ? '<small>' + sub + '</small>' : '') }), t]);
}
function chips(items, cur, onPick) {
  var box = h('div', { cls: 'chips' });
  items.forEach(function (it) { var b = h('button', { type: 'button', cls: 'chip' + (it[0] === cur ? ' on' : ''), text: it[1], onclick: function () { KF.sfx('ui'); Array.prototype.forEach.call(box.children, function (x) { x.classList.toggle('on', x === b); }); onPick(it[0]); } }); box.appendChild(b); });
  return box;
}
U.chips = chips;
U.settingsSheet = function () {
  if (G.mode === 'solo') G.paused = true;
  U.openSheet({ title: 'Ayarlar', f: function (d) {
    var S = KF.S;
    d.appendChild(U.T('div', 'grp', 'Oyuncu'));
    var inp = h('input', { cls: 'input', maxlength: '14', placeholder: 'Adın', value: S.name, autocomplete: 'off' });
    inp.addEventListener('change', function () { S.name = KF.clean(inp.value, 14); KF.saveProfile(); });
    d.appendChild(inp);
    var avs = h('div', { cls: 'avs' });
    KF.AVATARS.forEach(function (a) { var b = h('button', { type: 'button', cls: S.av === a ? 'on' : '', text: a, 'aria-label': 'Simge ' + a, onclick: function () { S.av = a; KF.saveProfile(); Array.prototype.forEach.call(avs.children, function (x) { x.classList.toggle('on', x.textContent === a); }); } }); avs.appendChild(b); });
    d.appendChild(avs);
    d.appendChild(U.T('div', 'grp', 'Dövüşçün'));
    d.appendChild(chips(GFX.LOOK_KEYS.map(function (k) { return [k, GFX.LOOKS[k].name]; }), S.look, function (k) { S.look = k; KF.saveProfile(); }));
    d.appendChild(U.T('div', 'grp', 'Zorluk (bilgisayara karşı)'));
    d.appendChild(chips([['easy', 'Kolay'], ['normal', 'Normal'], ['hard', 'Zor']], S.dif, function (k) { S.dif = k; KF.saveProfile(); }));
    d.appendChild(sw('Rehber ipuçları', 'Basman gereken düğmeyi parlatır', 'guide'));
    d.appendChild(sw('Otomatik tam ekran', 'Maça başlarken ekranı kaplar', 'autofs'));
    d.appendChild(sw('Boks eldiveni', 'Kapalıyken herkes kendi iş aletiyle dövüşür', 'gloves', function () { GFX.GLOVES = !!KF.S.gloves; }));
    d.appendChild(U.T('div', 'grp', 'Ekran ve ses'));
    d.appendChild(sw('OLED koruması', 'Görüntüyü zaman zaman birkaç piksel kaydırır, menüde boşta karartır', 'oled'));
    var dimBtn = U.btn(S.idleDim ? 'Boşta karart: ' + S.idleDim + ' sn' : 'Boşta karart: kapalı', 'sm', function () { var o = [0, 30, 60, 90, 180], i = o.indexOf(S.idleDim); S.idleDim = o[(i + 1) % o.length]; KF.saveProfile(); dimBtn.textContent = S.idleDim ? 'Boşta karart: ' + S.idleDim + ' sn' : 'Boşta karart: kapalı'; });
    d.appendChild(dimBtn);
    d.appendChild(sw('Ses', '', 'sfx')); d.appendChild(sw('Titreşim', 'Telefonlarda vuruş hissi', 'vib'));
    d.appendChild(U.T('p', 'note', 'Ad, simge ve arkadaş listen Kart Salonu ile ortaktır.'));
  } });
};
U.helpSheet = function () {
  if (G.mode === 'solo') G.paused = true;
  U.openSheet({ title: 'Nasıl oynanır', f: function (d) {
    [['Amaç', 'Rakibin canını bitir ya da süre dolunca daha çok canı olan kazanır. Telefonu yan çevirirsen düğmeler iki yana açılır: solda savunma, sağda vuruşlar.'],
     ['Taş-kâğıt-makas', 'SAVUN, düz-kroşe-tekmeyi durdurur ama aparkatı tam durduramaz. SIYRIL her vuruşu boşa çıkarır ama süpürmeye yakalanırsın. SÜPÜR, kaçanı yakalar ama savunmaya takılır. Rakibin ne yaptığına göre seç.'],
     ['DÜZ', 'En hızlı vuruş, hasarı az. Rakip kroşe ya da süpürme hazırlarken düz atarsan vuruşu keser. Aparkat ve tekmeyi kesemez.'],
     ['KROŞE', 'Biraz yavaş, daha sert.'], ['APARKAT', 'Yavaş ama çok sert. Savunmanın çoğunu deler. Karşısında SIYRIL iyi gelir.'], ['TEKME', 'Ağır ve sert. Rakibi daha uzun sersemletir.'],
     ['SÜPÜR', 'Alçak tekme. Orta hızda, hasarı az. Kaçan (SIYRIL) rakibi yakalar ve ekstra hasar verir.'],
     ['SAVUN', 'Basılı tut. Rakip kırmızı ünlem gösterince savunmada ol. Vuruş inmeden hemen önce savunmaya basarsan KUSURSUZ savunma olur, rakip sersemler. Savunma dayanıklılığı bitirir, uzun tutma.'],
     ['SIYRIL', 'Kısa dokun. Bir an eğilip kaçarsın. Ünlem çıkınca dokunursan rakibin vuruşu boşa gider, rakip uzun süre açık kalır ve sen can bulursun. Biraz dayanıklılık harcar. Süpürmeye karşı işe yaramaz.'],
     ['DİLEKÇE', 'Mavi bar vuruş yedikçe ve savundukça dolar. Dolunca savunma tanımaz, çok sert vurur. Karşısında tek çare SIYRIL.'],
     ['HAREKET', 'Sol alttaki yön topunu kaydır: sağa ileri, sola geri yürürsün, yukarı kaydırınca zıplarsın, aşağı kaydırıp tutunca eğilirsin (özel hareket için).'],
     ['MENZİL', ' Vuruşların menzili var: rakip uzaktaysa vuruş boşa gider (ISKA) ve açık kalırsın. Yaklaşmak ya da uzaklaşmak oyunun yarısı. ZIPLA ile havaya çıkarsın: yerdeki vuruşlar (düz, kroşe, tekme, süpürme) altından geçer, aparkat yakalar. Havadayken bir vuruş tuşuna basarsan HAVA TEKMESİ atarsın.'],
     ['ÖZEL HAREKETLER', 'Topu aşağı tutup bir vuruşa basarsan özel hareket çıkar (dayanıklılık harcar): AŞAĞI+DÜZ = EVRAK TOPU, yerde uçar, zıplayan geçer, savunan tutar. AŞAĞI+APARKAT = YÜKSELEN APARKAT, başlarken dokunulmazdır, havadakini ve saldıranı yakalar. AŞAĞI+TEKME = DÖNEN TEKME, ileri kayarak vurur. Street Fighter sevenler için klasik yön girişleri de geçerli: aşağı, ileri, DÜZ (topu); ileri, aşağı, ileri, APARKAT; aşağı, geri, TEKME.'],
     ['İpucu', 'Bir vuruşun ardından toparlanırken rakip vurabilir. Ağır vuruşu rakip sersemken ya da korumada değilken at. Bir vuruşa basıp hemen bir sonrakine basarsan sıraya girer. Takılırsan ayarlardan Kolay modu ve Rehberi aç.']
    ].forEach(function (x) { d.appendChild(h('div', { cls: 'li' }, [h('div', { cls: 'tx' }, [h('b', { text: x[0] }), h('span', { text: x[1] })])])); });
    d.appendChild(U.T('p', 'note', 'Bilgisayarda: A düz, S kroşe, D aparkat, F tekme, X süpür, Z sıyrıl, Boşluk savun, Enter dilekçe. Oklar: sağ ileri, sol geri, yukarı zıpla, aşağı eğil (basılı tut).'));
  } });
};
U.menuSheet = function () {
  if (G.mode === 'solo') G.paused = true;
  U.openSheet({ title: 'Menü', f: function (d) {
    d.appendChild(U.btn('Devam', 'pri', U.closeSheet)); d.appendChild(U.btn(isFs() ? 'Tam ekrandan çık' : 'Tam ekran yap', '', function () { U.closeSheet(); U.toggleFs(); })); d.appendChild(U.btn('Nasıl oynanır', '', U.helpSheet)); d.appendChild(U.btn('Ayarlar', '', U.settingsSheet));
    d.appendChild(U.btn(G.mode === 'menu' ? 'Ana menü' : 'Maçı bırak, ana menü', 'red', function () { U.home(); }));
  } });
};
$('menuBtn').onclick = U.menuSheet;

/* ---------- yatay oyun: dikeyde uyarı, tam ekran, otomatik duraklatma ---------- */
function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function goFs() { try { var el = document.documentElement, p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : (el.webkitRequestFullscreen && el.webkitRequestFullscreen()); Promise.resolve(p).then(function () { return screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); }).catch(function () {}); } catch (e) {} }
function outFs() { try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); var p = document.exitFullscreen ? document.exitFullscreen() : (document.webkitExitFullscreen && document.webkitExitFullscreen()); Promise.resolve(p).catch(function () {}); } catch (e) {} }
var canFs = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen), standalone = (window.matchMedia && window.matchMedia('(display-mode:fullscreen),(display-mode:standalone)').matches) || window.navigator.standalone;
function fsIcon() { var b = $('fsBtn'); b.innerHTML = ico(isFs() ? 'fsx' : 'fs'); b.setAttribute('aria-label', isFs() ? 'Tam ekrandan çık' : 'Tam ekran'); }
U.toggleFs = function () { if (isFs()) outFs(); else if (canFs) goFs(); else U.toast('Bu tarayıcı tam ekranı desteklemiyor. Safari: Paylaş > Ana Ekrana Ekle ile tam ekran açılır.'); };
U.autoFs = function () { if (KF.S.autofs !== false && canFs && !isFs() && !standalone) goFs(); };
$('fsBtn').onclick = U.toggleFs; if (standalone) $('fsBtn').style.display = 'none';
['fullscreenchange', 'webkitfullscreenchange'].forEach(function (n) { document.addEventListener(n, fsIcon); }); fsIcon();
$('rotFs').onclick = function () {
  try { var el = document.documentElement, p = el.requestFullscreen ? el.requestFullscreen() : (el.webkitRequestFullscreen && el.webkitRequestFullscreen()); Promise.resolve(p).then(function () { return screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); }).catch(function () {}); } catch (e) {}
};
var mq = window.matchMedia ? window.matchMedia('(orientation:portrait) and (max-width:760px)') : null, rotPaused = false;
function onRot() {
  if (!mq) return;
  if (mq.matches) { if (G.mode === 'solo' && !G.paused) { G.paused = true; rotPaused = true; } }
  else if (rotPaused) { rotPaused = false; if (!U.sheet()) G.paused = false; }
}
if (mq) { if (mq.addEventListener) mq.addEventListener('change', onRot); else if (mq.addListener) mq.addListener(onRot); }

/* ---------- ortak olay ve kare kancaları ---------- */
G.hook.callout = U.callout;
G.hook.ev = function (e) {
  if (e.k === 'hit') say(e.s === G.me ? 'hurt' : (e.m === 'k' ? 'kick' : 'hit')); else if (e.k === 'block') say('block'); else if (e.k === 'dodge') say('dodge', true); else if (e.k === 'perfect') say('perfect', true); else if (e.k === 'spec') say('spec', true);
  if (U.onEv) U.onEv(e);
};
var idleSay = 0;
G.hook.frame = function (M, dt) { hud(M); idleSay += dt; if (idleSay > 9 && playing() && M && M.ph === 'fight') { idleSay = 0; say('idle'); } };
})(window);
