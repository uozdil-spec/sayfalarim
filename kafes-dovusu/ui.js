/* Kafes Dövüşü · arayüz: menüler, HUD, arkadaşlar, çevrimiçi akışlar, ayarlar ve OLED koruması. */
(function (root) {
'use strict';
var KF = root.KF, G = KF.G, GFX = root.GFX;
var $ = function (id) { return document.getElementById(id); };
KF.loadProfile();

/* ---------- küçük yardımcılar ---------- */
var IC = {
  fist: '<rect x="5" y="8" width="14" height="11" rx="4"/><path d="M9 8v4M13 8v4M17 8v4M5 13l-1-3"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  scroll: '<path d="M6 4h10a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2z"/><path d="M9 9h6M9 13h6"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c3 .2 5 2.3 5 5.8"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>'
};
function ico(n) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + '</svg>'; }
function h(tag, a, kids) {
  var e = document.createElement(tag), k;
  a = a || {};
  for (k in a) { if (k === 'text') e.textContent = a[k]; else if (k === 'html') e.innerHTML = a[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), a[k]); else if (k === 'cls') e.className = a[k]; else e.setAttribute(k, a[k]); }
  (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
}
function btn(text, cls, fn) { return h('button', { cls: 'btn ' + (cls || ''), type: 'button', text: text, onclick: function () { KF.sfx('ui'); fn(); } }); }
var toastT = null;
function toast(t, bad) { var e = $('toast'); e.textContent = t; e.className = 'on' + (bad ? ' bad' : ''); clearTimeout(toastT); toastT = setTimeout(function () { e.className = ''; }, 3200); }
function copyText(t) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast('Kopyalandı'); }, function () { toast('Kopyalanamadı', true); });
  else { var ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Kopyalandı'); } catch (e) { toast('Kopyalanamadı', true); } ta.remove(); }
}
function share(title, text, url) { if (navigator.share) navigator.share({ title: title, text: text, url: url }).catch(function () {}); else copyText(text + ' ' + url); }
function base() { return location.href.split('#')[0].split('?')[0]; }

/* ---------- ekran katmanı ---------- */
var ov = $('ov');
function showOv(nodes) { ov.innerHTML = ''; (Array.isArray(nodes) ? nodes : [nodes]).forEach(function (n) { if (n) ov.appendChild(typeof n === 'string' ? h('div', { html: n }) : n); }); ov.style.display = 'flex'; }
function hideOv() { ov.style.display = 'none'; ov.innerHTML = ''; }
function T(tag, cls, text) { return h(tag, { cls: cls || '', text: text }); }
function callout(txt, col) {
  var el = $('callout'); el.textContent = txt; el.style.color = col || '#fff';
  if (el.animate) el.animate([{ opacity: 1, transform: 'scale(1.3)' }, { opacity: 1, transform: 'scale(1)', offset: .18 }, { opacity: 0, transform: 'scale(1)' }], { duration: 950, fill: 'forwards' }); else el.style.opacity = 1;
}

/* ---------- sayfa (sheet) ---------- */
var sh = null;
function closeSheet() { $('sheet').hidden = true; if (sh && sh.onclose) sh.onclose(); sh = null; G.paused = false; }
function openSheet(o) {
  if (sh) closeSheet();
  sh = o; $('shT').textContent = o.title; $('sheet').hidden = false;
  var tabs = $('shTabs'), body = $('shB');
  function build() {
    tabs.innerHTML = '';
    (o.tabs || []).forEach(function (t, i) { tabs.appendChild(h('button', { type: 'button', cls: i === o.tab ? 'on' : '', text: t.n, onclick: function () { o.tab = i; KF.sfx('ui'); build(); } })); });
    body.innerHTML = '';
    (o.tabs ? o.tabs[o.tab].f : o.f)(body, build);
  }
  o.refresh = build; build();
}
$('shX').innerHTML = ico('x'); $('shX').onclick = closeSheet; document.querySelector('.shbg').onclick = closeSheet;
$('menuBtn').innerHTML = ico('menu');
$('bPunch').querySelector('.ic').innerHTML = ico('fist'); $('bBlock').querySelector('.ic').innerHTML = ico('shield'); $('bSpecial').querySelector('.ic').innerHTML = ico('scroll');

/* ---------- ticker ---------- */
var LINES = {
  hit: ['Yumruk imzalı ve mühürlü geldi.', 'Bu darbe evrak kaydına girdi.', 'Matbu form yoktu, doğaçlama vurdu.'],
  hurt: ['Randevusuz yumruk yedin.', 'Hakem sayıyor ama sıra numarası yok.', 'e-Devlet çöktü, savunma da çöktü.'],
  block: ['Dosya iade edildi: eksik evrak.', 'Darbe görev alanı dışı olduğu için reddedildi.'],
  perfect: ['Kusursuz! Rakip kendi evrakına dolandı.', 'Tam zamanında mühür bastın.'],
  spec: ['Üç nüsha, iki mühür, tek yumruk.', 'Dilekçe imzalandı, rakip evraka boğuldu.'],
  idle: ['Çay ocağından taze demlendi sesi geliyor.', 'Seyirciler simit paylaşıyor.', 'Hakem mesai kartını basıyor.', 'Bir kedi kafesin üstünden geçti, kimse şaşırmadı.']
};
var lastSay = 0;
function say(k, force) { var n = Date.now(); if (!force && n - lastSay < 2200) return; lastSay = n; var a = LINES[k]; $('ticker').textContent = a[Math.floor(Math.random() * a.length)]; }

/* ---------- HUD ---------- */
var cache = {};
function setTxt(id, v) { if (cache[id] !== v) { cache[id] = v; $(id).textContent = v; } }
function setW(id, v) { v = Math.max(0, Math.min(100, v)).toFixed(1) + '%'; if (cache[id] !== v) { cache[id] = v; $(id).style.width = v; } }
function setCls(el, c, on) { if (el.classList.contains(c) !== on) el.classList.toggle(c, on); }
function hud(M) {
  var me = G.me, op = 1 - me, S = KF.S;
  var nm = G.mode === 'menu' || !M ? [S.name || 'SEN', 'RAKİP'] : [G.names[me], G.names[op]], av = G.mode === 'menu' || !M ? [S.av, '🥊'] : [G.avs[me], G.avs[op]];
  setTxt('mNm', nm[0]); setTxt('oNm', nm[1]); setTxt('mAv', av[0]); setTxt('oAv', av[1]);
  if (!M) { setW('mHp', 100); setW('oHp', 100); setW('mHpG', 100); setW('oHpG', 100); setW('mSp', 0); setW('oSp', 0); setW('stb', 100); return; }
  setW('mHp', M.hp[me] / M.max[me] * 100); setW('mHpG', M.hp[me] / M.max[me] * 100); setW('oHp', M.hp[op] / M.max[op] * 100); setW('oHpG', M.hp[op] / M.max[op] * 100);
  setW('mSp', M.sp[me]); setW('oSp', M.sp[op]); setW('stb', M.stam[me]);
  var pvp = G.mode === 'host' || G.mode === 'guest';
  setTxt('rnd', pvp ? 'RAUND ' + M.rn : 'MAÇ ' + (G.lv + 1) + '/3');
  setTxt('tmr', M.ph === 'wait' ? '--' : String(M.tm));
  var pips = '';
  if (pvp) { for (var i = 0; i < 2; i++) pips += '<i class="' + (i < M.sc[me] ? 'w' : '') + '"></i>'; for (i = 0; i < 2; i++) pips += '<i class="' + (i < M.sc[op] ? 'l' : '') + '"></i>'; }
  if (cache.pips !== pips) { cache.pips = pips; $('pips').innerHTML = pips; }
  var fight = M.ph === 'fight';
  setCls($('bSpecial'), 'rdy', fight && M.sp[me] >= 100); setCls($('bBlock'), 'on', M.st[me] === 'block');
  var c = '', k = '';
  if (M.ph === 'count') { c = 'Hazır ol'; k = 'info'; }
  else if (fight) {
    var ms = M.st[me], os = M.st[op];
    if (os === 'wind' || os === 'sp') { c = 'SAVUN! Son anda bas'; k = 'warn'; }
    else if (ms === 'stun') { c = 'Sersemledin'; k = 'warn'; }
    else if (M.sp[me] >= 100 && ms === 'idle') { c = 'Dilekçe hazır!'; k = 'good'; }
    else if (os === 'block') { c = 'Rakip korumada, bekle'; k = 'info'; }
    else if (os === 'stun' || os === 'hit') { c = 'Şimdi vur!'; k = 'good'; }
    else if (ms === 'idle' && os === 'idle') { c = 'Önce vuran kazanır'; k = ''; }
  }
  if (cache.coach !== c + k) { cache.coach = c + k; var el = $('coach'); el.textContent = c; el.className = k; }
}

/* ---------- girdi ---------- */
var blockDown = false;
function playing() { return G.mode === 'solo' || G.mode === 'host' || G.mode === 'guest'; }
function bind(id, down, up) {
  var el = $(id);
  el.addEventListener('pointerdown', function (e) { e.preventDefault(); if (playing()) down(); });
  if (up) ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { el.addEventListener(n, function () { up(); }); });
}
bind('bPunch', function () { G.input('p'); });
bind('bSpecial', function () { G.input('s'); });
bind('bBlock', function () { if (!blockDown) { blockDown = true; G.input('bd'); } }, function () { if (blockDown) { blockDown = false; G.input('bu'); } });
window.addEventListener('keydown', function (e) { if (e.repeat || !playing()) return; var k = e.key.toLowerCase(); if (k === 'j' || k === ' ') { e.preventDefault(); G.input('p'); } else if (k === 'k' || k === 'shift') { if (!blockDown) { blockDown = true; G.input('bd'); } } else if (k === 'l') G.input('s'); });
window.addEventListener('keyup', function (e) { var k = e.key.toLowerCase(); if ((k === 'k' || k === 'shift') && blockDown) { blockDown = false; G.input('bu'); } });
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
  $('dim').style.setProperty('--dimop', '.78'); $('dim').classList.toggle('on', S.idleDim > 0 && idle > S.idleDim);
}, 1000);
function keepAwake(on) {
  try { if (on && navigator.wakeLock && !wl) navigator.wakeLock.request('screen').then(function (l) { wl = l; l.addEventListener('release', function () { wl = null; }); }).catch(function () {}); else if (!on && wl) { wl.release(); wl = null; } } catch (e) {}
}
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && playing()) keepAwake(true); });

/* ---------- ana menü ---------- */
function stats() { var S = KF.S; return S.wins + S.losses ? 'Skor: ' + S.wins + ' galibiyet · ' + S.losses + ' mağlubiyet' : 'İlk maçına hazır mısın?'; }
function home() {
  qTok++; stopQ(); G.stop(); closeSheet(); keepAwake(false); blockDown = false;
  var t = h('h1', { html: 'KAFES<br>DÖVÜŞÜ<small>BELEDİYE PERSONELİ TURNUVASI</small>' });
  showOv([t, T('p', '', stats()), h('div', { cls: 'menu' }, [
    btn('Turnuva · Bilgisayara karşı', 'pri wide', function () { startSolo(0); }),
    btn('Çevrimiçi düello', 'red wide', function () { onlineSheet(0); }),
    h('div', { cls: 'row' }, [btn('Nasıl oynanır', 'sm', helpSheet), btn('Ayarlar', 'sm', settingsSheet)])
  ])]);
  $('ticker').textContent = 'Hakem mesai kartını basıyor. Turnuva başlamak üzere.';
}
function startSolo(lv, hp, sp) {
  var L = KF.LV[lv]; G.solo(lv, hp, sp); G.sim.ph = 'wait'; blockDown = false;
  var tips = h('p', { html: '<b>VUR</b> ile yumruk at. Rakip <b>!</b> yapınca <b>SAVUN</b>a son anda bas: kusursuz savunma rakibi sersemletir.' });
  showOv([T('span', 'tag', 'MAÇ ' + (lv + 1) + '/3' + (lv === 2 ? ' · FİNAL' : '')), T('h2', '', L.venue),
    h('div', { cls: 'vs', html: (KF.S.name || 'Mühendis').toUpperCase() + '<em>VS</em><br>' + L.name }), T('p', '', L.desc), tips,
    h('div', { cls: 'row' }, [btn('Menü', 'sm', home), btn('Hazırım', 'pri', function () { hideOv(); G.sim.ph = 'count'; keepAwake(true); })])]);
}
G.hook.over = function (mw) {
  var S = KF.S;
  if (G.mode === 'solo') {
    if (mw === 0) {
      S.wins++; S.best = Math.max(S.best, G.lv + 1); KF.saveProfile(); KF.sfx('win');
      var M = G.M, hp = Math.min(100, Math.round(M.hp[0]) + 35), sp = M.sp[0];
      if (G.lv >= 2) showOv([T('h1', '', 'Şampiyon!'), T('p', '', 'Terfi geldi: Daire Başkanı Yardımcısı Vekili (Geçici). Maaş farkı bir sonraki dönemde.'), h('div', { cls: 'row' }, [btn('Yeniden oyna', 'pri', function () { startSolo(0); }), btn('Menü', '', home)])]);
      else showOv([T('h2', '', 'Kazandın!'), T('p', '', 'Çay molası: +35 can. Seyirciler simit atıyor.'), h('div', { cls: 'row' }, [btn('Sıradaki maç', 'pri', function () { startSolo(G.lv + 1, hp, sp); }), btn('Menü', 'sm', home)])]);
    } else {
      S.losses++; KF.saveProfile(); KF.sfx('lose');
      showOv([T('h2', '', 'Mesai bitti'), T('p', '', 'Hakem seni çay ocağına taşıdı. Bir bardak çay iyi gelir.'), h('div', { cls: 'row' }, [btn('Tekrar dene', 'pri', function () { startSolo(G.lv); }), btn('Menü', 'sm', home)])]);
    }
    return;
  }
  var won = mw === G.me; if (won) S.wins++; else S.losses++; KF.saveProfile(); KF.sfx(won ? 'win' : 'lose');
  var M2 = G.M, sc = M2.sc[G.me] + ' - ' + M2.sc[1 - G.me], opn = G.names[1 - G.me];
  var acts = [];
  if (G.mode === 'host') acts.push(btn('Revanş', 'pri', function () { if (G.rematch()) hideOv(); else toast('Rakip yok', true); }));
  else acts.push(btn('Revanş iste', 'pri', function () { if (G.guest) { G.guest.send({ t: 'rdy' }, 1); toast('Revanş isteği gitti'); } }));
  acts.push(btn('Çık', 'sm', home));
  showOv([T('h2', '', won ? 'Kazandın!' : 'Kaybettin'), T('p', '', sc + ' · ' + opn), h('div', { cls: 'row' }, acts)]);
};
G.hook.phase = function (ph) { if (ph === 'count' && (G.mode === 'host' || G.mode === 'guest')) hideOv(); };
G.hook.guestStart = function () { hideOv(); keepAwake(true); };
G.hook.callout = callout;
G.hook.ready = function () { toast('Rakip revanş istiyor'); };
G.hook.ev = function (e) {
  if (e.k === 'hit') say(e.s === G.me ? 'hurt' : 'hit'); else if (e.k === 'block') say('block'); else if (e.k === 'perfect') say('perfect', true); else if (e.k === 'spec') say('spec', true);
};
var idleSay = 0;
G.hook.frame = function (M, dt) { hud(M); idleSay += dt; if (idleSay > 9 && playing() && M && M.ph === 'fight') { idleSay = 0; say('idle'); } };

/* ---------- ayarlar / yardım ---------- */
function sw(label, sub, key, after) {
  var t = h('button', { cls: 'tg' + (KF.S[key] ? ' on' : ''), type: 'button', role: 'switch', 'aria-checked': String(!!KF.S[key]), onclick: function () { KF.S[key] = !KF.S[key]; t.classList.toggle('on', KF.S[key]); t.setAttribute('aria-checked', String(!!KF.S[key])); KF.saveProfile(); if (after) after(); } });
  return h('div', { cls: 'sw' }, [h('span', { html: label + (sub ? '<small>' + sub + '</small>' : '') }), t]);
}
function settingsSheet() {
  if (G.mode === 'solo') G.paused = true;
  openSheet({ title: 'Ayarlar', f: function (d) {
    var S = KF.S;
    d.appendChild(T('div', 'grp', 'Oyuncu'));
    var inp = h('input', { cls: 'input', maxlength: '14', placeholder: 'Adın', value: S.name, autocomplete: 'off' });
    inp.addEventListener('change', function () { S.name = KF.clean(inp.value, 14); KF.saveProfile(); });
    d.appendChild(inp);
    var avs = h('div', { cls: 'avs' });
    KF.AVATARS.forEach(function (a) { var b = h('button', { type: 'button', cls: S.av === a ? 'on' : '', text: a, 'aria-label': 'Simge ' + a, onclick: function () { S.av = a; KF.saveProfile(); Array.prototype.forEach.call(avs.children, function (x) { x.classList.toggle('on', x.textContent === a); }); } }); avs.appendChild(b); });
    d.appendChild(avs);
    d.appendChild(T('div', 'grp', 'Dövüşçün'));
    var lk = h('div', { cls: 'row' });
    Object.keys(GFX.LOOKS).forEach(function (k) { var b = h('button', { type: 'button', cls: 'btn sm' + (S.look === k ? ' pri' : ''), text: GFX.LOOKS[k].name, onclick: function () { S.look = k; KF.saveProfile(); Array.prototype.forEach.call(lk.children, function (x) { x.classList.toggle('pri', x.textContent === GFX.LOOKS[k].name); }); } }); lk.appendChild(b); });
    d.appendChild(lk);
    d.appendChild(T('div', 'grp', 'Ekran ve ses'));
    d.appendChild(sw('OLED koruması', 'Görüntüyü zaman zaman birkaç piksel kaydırır, boşta karartır', 'oled'));
    var dimBtn = btn(S.idleDim ? 'Boşta karart: ' + S.idleDim + ' sn' : 'Boşta karart: kapalı', 'sm', function () { var o = [0, 30, 60, 90, 180], i = o.indexOf(S.idleDim); S.idleDim = o[(i + 1) % o.length]; KF.saveProfile(); dimBtn.textContent = S.idleDim ? 'Boşta karart: ' + S.idleDim + ' sn' : 'Boşta karart: kapalı'; });
    d.appendChild(dimBtn);
    d.appendChild(sw('Ses', '', 'sfx')); d.appendChild(sw('Titreşim', 'Telefonlarda vuruş hissi', 'vib'));
    d.appendChild(T('p', 'note', 'Ad, simge ve arkadaş listen Kart Salonu ile ortaktır. Birinde değiştirdiğin diğerinde de görünür.'));
  } });
}
function helpSheet() {
  if (G.mode === 'solo') G.paused = true;
  openSheet({ title: 'Nasıl oynanır', f: function (d) {
    [['VUR', 'Dokun, yumruk hazırlanır ve kısa süre sonra iner. Rakip o sırada vurursa senin yumruğun iptal olur, önce vuran kazanır.'],
     ['SAVUN', 'Basılı tut. Darbenin %80\'ini keser ama dayanıklılığı bitirir. Rakip "!" gösterince savunmaya son anda bas: kusursuz savunma rakibi sersemletir.'],
     ['DİLEKÇE', 'Mavi bar vuruş ve savunmayla dolar. Dolunca dilekçeyi fırlat: savunmayı deler, rakibi sersemletir.'],
     ['Çevrimiçi', 'Hızlı maçta gerçek rakip bulunur, arkadaşlarını kodla ekleyip davet edebilirsin. Üç raundun ikisini kazanan düelloyu alır.'],
     ['Bilgisayar', 'Tuşlar: J veya Boşluk vur, K savun, L dilekçe.']].forEach(function (x) { d.appendChild(h('div', { cls: 'li' }, [h('div', { cls: 'tx' }, [h('b', { text: x[0] }), h('span', { text: x[1] })])])); });
  } });
}
function menuSheet() {
  if (G.mode === 'solo') G.paused = true;
  openSheet({ title: 'Menü', f: function (d) {
    d.appendChild(btn('Devam', 'pri', closeSheet)); d.appendChild(btn('Nasıl oynanır', '', helpSheet)); d.appendChild(btn('Ayarlar', '', settingsSheet));
    d.appendChild(btn(G.mode === 'menu' ? 'Ana menü' : 'Maçı bırak, ana menü', 'red', home));
  } });
}
$('menuBtn').onclick = menuSheet;

/* ---------- çevrimiçi ---------- */
function net() { return G.getNet(); }
function netLine(d) {
  var N = net(), s = N.status, t = root.mqtt ? (s === 'online' ? 'Bağlı' : s === 'connecting' ? 'Bağlanıyor…' : s === 'offline' ? 'Bağlanılamadı, yeniden deneniyor' : 'Bağlantı bekleniyor') : 'Çevrimiçi mod için sayfayı GitHub adresinden aç.';
  d.appendChild(h('div', { cls: 'li' }, [h('span', { cls: 'dot' + (s === 'online' ? ' on' : '') }), h('div', { cls: 'tx' }, [h('b', { text: t })])]));
}
function onlineSheet(tab) {
  if (!root.mqtt) { toast('Çevrimiçi mod yalnızca yayınlanmış sayfada çalışır', true); }
  var N = net();
  N.onStatus = function () { if (sh && sh.title === 'Çevrimiçi') sh.refresh(); };
  N.onFriends = function () { if (sh && sh.title === 'Çevrimiçi') sh.refresh(); };
  N.start().then(function () { if (sh && sh.title === 'Çevrimiçi') sh.refresh(); }).catch(function () { if (sh && sh.title === 'Çevrimiçi') sh.refresh(); });
  openSheet({ title: 'Çevrimiçi', tab: tab || 0, onclose: function () { N.onStatus = null; if (G.mode === 'menu') N.watchTables(false); },
    tabs: [{ n: 'Hızlı maç', f: quickTab }, { n: 'Arkadaşlar', f: friendsTab }, { n: 'Odaya gir', f: joinTab }] });
}
function nameGuard(d) {
  if (KF.S.name) return;
  d.appendChild(T('div', 'grp', 'Önce adını yaz'));
  var inp = h('input', { cls: 'input', maxlength: '14', placeholder: 'Takma adın', autocomplete: 'off' });
  inp.addEventListener('change', function () { KF.S.name = KF.clean(inp.value, 14); KF.saveProfile(); });
  d.appendChild(inp);
}
function quickTab(d) {
  netLine(d); nameGuard(d);
  d.appendChild(T('p', 'note', 'Gerçek bir rakip bulunur, üç raundun ikisini kazanan düelloyu alır. Her raund farklı bir mekânda oynanır.'));
  d.appendChild(btn('Rakip bul', 'red wide', function () { if (!KF.S.name) { toast('Önce bir ad yaz', true); return; } closeSheet(); quick(); }));
  d.appendChild(btn('Özel oda kur', 'wide', function () { if (!KF.S.name) { toast('Önce bir ad yaz', true); return; } closeSheet(); hostRoom(false); }));
}
function joinTab(d) {
  netLine(d); nameGuard(d);
  d.appendChild(T('div', 'grp', 'Oda kodu'));
  var inp = h('input', { cls: 'input', maxlength: '5', placeholder: '5 harfli kod', autocapitalize: 'characters', autocomplete: 'off', style: 'text-transform:uppercase;letter-spacing:.2em;text-align:center' });
  d.appendChild(inp);
  d.appendChild(btn('Odaya katıl', 'red wide', function () { var c = KF.clean(inp.value, 5).toUpperCase(); if (c.length !== 5) { toast('Kod 5 harf olmalı', true); return; } if (!KF.S.name) { toast('Önce bir ad yaz', true); return; } closeSheet(); joinRoom(c); }));
}
function friendsTab(d, rebuild) {
  var N = net(), id, rq = Object.keys(N.reqs);
  netLine(d); nameGuard(d);
  if (rq.length) {
    d.appendChild(T('div', 'grp', 'İstekler'));
    rq.forEach(function (id) { var r = N.reqs[id]; d.appendChild(h('div', { cls: 'li' }, [h('div', { cls: 'av', text: r.a }), h('div', { cls: 'tx' }, [h('b', { text: r.n }), h('span', { text: 'Arkadaş olmak istiyor' })]), btn('Kabul', 'sm pri', function () { N.accept(id); rebuild(); }), btn('Sil', 'sm', function () { N.dropReq(id); rebuild(); })])); });
  }
  var fr = N.friends(), ids = Object.keys(fr).sort(function (a, b) { return (N.presence[b] ? 1 : 0) - (N.presence[a] ? 1 : 0); });
  var onl = ids.filter(function (i) { return N.presence[i]; }).length;
  d.appendChild(T('div', 'grp', 'Arkadaşlarım' + (ids.length ? ' · ' + onl + ' çevrimiçi' : '')));
  if (!ids.length) d.appendChild(T('div', 'empty', 'Henüz kimse yok. Aşağıdan arkadaşının kodunu yazarak ekleyebilirsin. Kart Salonu\'ndaki arkadaşların burada da görünür.'));
  ids.forEach(function (id) {
    var f = fr[id], p = N.presence[id], st = p ? (p.st === 'busy' ? 'Dövüşte' : 'Çevrimiçi') : 'Kafes Dövüşü kapalı', del = false;
    var rm = btn('Sil', 'sm', function () { if (!del) { del = true; rm.textContent = 'Emin misin?'; setTimeout(function () { del = false; rm.textContent = 'Sil'; }, 3000); return; } N.removeFriend(id); rebuild(); });
    d.appendChild(h('div', { cls: 'li' }, [h('div', { cls: 'av', text: (p && p.a) || f.a }), h('div', { cls: 'tx' }, [h('b', { text: (p && p.n) || f.n }), h('span', { text: st })]), h('span', { cls: 'dot' + (p ? (p.st === 'busy' ? ' busy' : ' on') : '') }),
      btn('Davet', 'sm red', function () { inviteFriend(id); }), rm]));
  });
  d.appendChild(T('div', 'grp', 'Arkadaş ekle'));
  var inp = h('input', { cls: 'input', maxlength: '8', placeholder: 'Arkadaşının 8 harfli kodu', autocapitalize: 'characters', autocomplete: 'off', style: 'text-transform:uppercase' });
  d.appendChild(inp);
  d.appendChild(btn('İstek gönder', 'wide', function () {
    N.start().then(function () { var r = N.request(inp.value); toast(r === 'ok' ? 'İstek gönderildi' : r === 'self' ? 'Bu senin kodun' : r === 'have' ? 'Zaten arkadaşsınız' : 'Kod 8 karakter olmalı', r !== 'ok'); if (r === 'ok') inp.value = ''; }).catch(function () { toast('Bağlanılamadı', true); });
  }));
  d.appendChild(T('div', 'grp', 'Benim arkadaş kodum'));
  d.appendChild(T('div', 'code', KF.S.id));
  d.appendChild(h('div', { cls: 'row' }, [btn('Paylaş', 'sm', function () { share('Kafes Dövüşü', 'Beni Kafes Dövüşü\'nde arkadaş ekle: ' + KF.S.id, base() + '#f=' + KF.S.id); }), btn('Kopyala', 'sm', function () { copyText(KF.S.id); })]));
  d.appendChild(T('p', 'note', 'Bu kod Kart Salonu ile ortaktır. Arkadaşının çevrimiçi görünmesi için Kafes Dövüşü\'nü açık tutması gerekir.'));
}
function inviteFriend(fid) {
  var N = net();
  if (!KF.S.name) { toast('Önce bir ad yaz', true); return; }
  if (G.room && G.mode === 'lobbyH') { N.invite(fid, G.room.code); toast('Davet gönderildi'); return; }
  closeSheet();
  hostRoom(false, function (hst) { N.invite(fid, hst.code); toast('Davet gönderildi'); });
}

/* ---------- oda akışları ---------- */
var qTimer = null, qTok = 0;
function stopQ() { clearInterval(qTimer); qTimer = null; }
function lobbyOv(title, lines, acts) { showOv([T('span', 'tag', 'ÇEVRİMİÇİ'), T('h2', '', title)].concat(lines, [h('div', { cls: 'row' }, acts)])); }
function hostRoom(pub, cb) {
  lobbyOv('Oda kuruluyor…', [], [btn('İptal', 'sm', home)]);
  G.host(pub).then(function (hst) {
    var start = null;
    function paint() {
      if (G.room !== hst) return;
      if (hst.guest) { lobbyOv('Rakip geldi!', [T('p', '', hst.guest.a + ' ' + hst.guest.n + ' karşında. Dövüş birazdan başlıyor.')], []); return; }
      var lines = [T('div', 'code', hst.code), T('p', '', pub ? 'Rakip aranıyor…' : 'Bu kodu arkadaşına gönder ya da arkadaşlarından davet et.')];
      var acts = [];
      if (!pub) { acts.push(btn('Paylaş', 'sm', function () { share('Kafes Dövüşü', 'Kafes Dövüşü düellosuna gel! Oda: ' + hst.code, hst.link()); })); acts.push(btn('Davet et', 'sm', function () { onlineSheet(1); })); }
      acts.push(btn('İptal', 'sm', home));
      lobbyOv(pub ? 'Rakip aranıyor' : 'Özel oda', lines, acts);
    }
    hst.onGuest = function () { paint(); clearTimeout(start); start = setTimeout(function () { if (G.room === hst && hst.guest && G.hostBegin()) { stopQ(); hideOv(); keepAwake(true); } }, 1600); };
    hst.onDrop = function (why) {
      if (G.room !== hst) return;
      if (G.mode === 'host') { KF.sfx('lose'); showOv([T('h2', '', 'Rakip ayrıldı'), T('p', '', 'Bağlantı koptu ya da rakip çıktı.'), h('div', { cls: 'row' }, [btn('Ana menü', 'pri', home)])]); }
      else { toast('Rakip ayrıldı'); paint(); }
    };
    paint(); if (cb) cb(hst);
    if (pub) {
      net().watchTables(true); var t0 = Date.now();
      var tick = function () {
        if (G.room !== hst || G.mode !== 'lobbyH') { stopQ(); return; }
        var other = net().openTables().filter(function (t) { return t.code < hst.code; })[0];
        if (other && !hst.guest) { stopQ(); joinRoom(other.code); return; }
        if (Date.now() - t0 > 40000 && !hst.guest) {
          stopQ();
          lobbyOv('Rakip bulunamadı', [T('p', '', 'Şu an açık oda yok. Beklemeye devam edebilir ya da bilgisayara karşı oynayabilirsin.')], [btn('Bekle', 'sm', function () { t0 = Date.now(); paint(); stopQ(); qTimer = setInterval(tick, 4000); }), btn('Turnuva', 'sm pri', function () { startSolo(0); }), btn('Menü', 'sm', home)]);
        }
      };
      stopQ(); qTimer = setInterval(tick, 4000);
    }
  }).catch(function () { showOv([T('h2', '', 'Bağlanılamadı'), T('p', '', root.mqtt ? 'Çevrimiçi sunuculara ulaşılamadı. İnternetini kontrol edip tekrar dene.' : 'Çevrimiçi mod için sayfayı yayınlanmış GitHub adresinden aç.'), h('div', { cls: 'row' }, [btn('Ana menü', 'pri', home)])]); });
}
function quick() {
  lobbyOv('Rakip aranıyor', [T('p', '', 'Açık odalar taranıyor…')], [btn('İptal', 'sm', home)]);
  var N = net(), tok = ++qTok;
  N.start().then(function () {
    N.watchTables(true);
    setTimeout(function () {
      if (tok !== qTok || G.mode !== 'menu') return;
      var t = N.openTables(); if (t.length) joinRoom(t[0].code); else hostRoom(true);
    }, 2400);
  }).catch(function () { showOv([T('h2', '', 'Bağlanılamadı'), T('p', '', root.mqtt ? 'Çevrimiçi sunuculara ulaşılamadı.' : 'Çevrimiçi mod için sayfayı yayınlanmış GitHub adresinden aç.'), h('div', { cls: 'row' }, [btn('Ana menü', 'pri', home)])]); });
}
function joinRoom(code) {
  stopQ(); G.stop();
  lobbyOv('Bağlanılıyor', [T('div', 'code', code)], [btn('İptal', 'sm', home)]);
  G.join(code).then(function (g) {
    function paint() {
      if (G.guest !== g || G.mode === 'guest') return;
      var m = { joining: ['Bağlanılıyor', 'Oda aranıyor…'], lobby: ['Bağlandın', 'Ev sahibi dövüşü başlatıyor…'], full: ['Oda dolu', 'Bu odada zaten iki oyuncu var.'], gone: ['Oda bulunamadı', 'Kod yanlış ya da oda kapanmış olabilir.'], bye: ['Oda kapandı', 'Ev sahibi odadan ayrıldı.'] }[g.state] || ['Bağlanılıyor', ''];
      lobbyOv(m[0], [T('div', 'code', code), T('p', '', m[1])], [btn(g.state === 'lobby' || g.state === 'joining' ? 'İptal' : 'Ana menü', 'sm', home)]);
    }
    g.onState = function () { if (G.mode === 'guest' && (g.state === 'gone' || g.state === 'bye')) { KF.sfx('lose'); showOv([T('h2', '', 'Bağlantı koptu'), T('p', '', 'Rakip ayrıldı ya da bağlantı kesildi.'), h('div', { cls: 'row' }, [btn('Ana menü', 'pri', home)])]); } else paint(); };
    g.onInfo = paint; paint();
  }).catch(function () { showOv([T('h2', '', 'Bağlanılamadı'), T('p', '', 'Çevrimiçi sunuculara ulaşılamadı.'), h('div', { cls: 'row' }, [btn('Ana menü', 'pri', home)])]); });
}

/* ---------- davet, bağlantı ve arka plan bağlantısı ---------- */
function wireNet() {
  var N = net();
  N.onRequest = function (id, r) { toast(r.n + ' arkadaşlık isteği gönderdi'); if (sh && sh.title === 'Çevrimiçi') sh.refresh(); };
  N.onToast = function (t) { toast(t); };
  N.onInvite = function (inv) {
    if (G.mode !== 'menu' && G.mode !== 'lobbyH') { toast(inv.n + ' seni düelloya çağırıyor, maçtan sonra katılabilirsin'); return; }
    KF.sfx('perfect');
    showOv([T('span', 'tag', 'DÜELLO DAVETİ'), T('h2', '', inv.a + ' ' + inv.n), T('p', '', 'Seni kafese çağırıyor.'), h('div', { cls: 'row' }, [btn('Katıl', 'red', function () { joinRoom(inv.code); }), btn('Vazgeç', 'sm', home)])]);
  };
}
function boot() {
  G.start(); wireNet(); hud(null);
  if (KF.ks.get('friends', null) || Object.keys(KF.ks.get('reqs', {})).length || KF.ks.get('sent', null)) setTimeout(function () { net().start().catch(function () {}); }, 1500);
  var m, hs = location.hash;
  if ((m = hs.match(/#o=([A-Za-z0-9]{5})/))) { history.replaceState(null, '', base()); home(); setTimeout(function () { var c = m[1].toUpperCase(); showOv([T('span', 'tag', 'DÜELLO DAVETİ'), T('h2', '', 'Odaya katıl'), T('div', 'code', c), h('div', { cls: 'row' }, [btn('Katıl', 'red', function () { if (!KF.S.name) { toast('Önce Ayarlar\'dan bir ad yaz', true); settingsSheet(); return; } joinRoom(c); }), btn('Vazgeç', 'sm', home)])]); }, 50); }
  else if ((m = hs.match(/#f=([A-Za-z0-9]{8})/))) { history.replaceState(null, '', base()); home(); setTimeout(function () { var f = m[1].toUpperCase(); showOv([T('span', 'tag', 'ARKADAŞ KODU'), T('h2', '', 'Arkadaş ekle'), T('div', 'code', f), h('div', { cls: 'row' }, [btn('Ekle', 'pri', function () { net().start().then(function () { var r = net().request(f); toast(r === 'ok' ? 'İstek gönderildi' : r === 'self' ? 'Bu senin kodun' : 'Zaten arkadaşsınız', r !== 'ok'); home(); }).catch(function () { toast('Bağlanılamadı', true); home(); }); }), btn('Vazgeç', 'sm', home)])]); }, 50); }
  else home();
}
boot();
})(window);
