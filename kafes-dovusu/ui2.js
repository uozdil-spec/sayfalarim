/* Kafes Dövüşü · menüler ve oyun akışları: ana menü, antrenman, turnuva (7 maç), serbest maç ve çevrimiçi düello. */
(function (root) {
'use strict';
var KF = root.KF, G = KF.G, U = KF.U, GFX = root.GFX, h = U.h, T = U.T, btn = U.btn, toast = U.toast, showOv = U.showOv, hideOv = U.hideOv, $ = U.$;
function row(k) { return h('div', { cls: 'row' }, k); }
function cols(l, r, c) { return h('div', { cls: 'cols ' + (c || '') }, [h('div', { cls: 'cl' }, l), h('div', { cls: 'cr' }, r)]); }
var qTimer = null, qTok = 0, streak = 0, deadT = {};
function liveTables() { var now = Date.now(); return net().openTables().filter(function (t) { return !(deadT[t.code] && now - deadT[t.code] < 120000); }); }
function stopQ() { clearInterval(qTimer); qTimer = null; }

/* ---------- ana menü ---------- */
function stats() { var S = KF.S; return S.wins + S.losses ? 'Skor: ' + S.wins + ' galibiyet · ' + S.losses + ' mağlubiyet' : 'Yeni misin? Önce antrenmanı dene.'; }
U.home = function () {
  qTok++; stopQ(); G.stop(); U.closeSheet(); U.keepAwake(false); U.resetBlock(); U.lesson = null; G.train = false; G.lv = -1;
  var S = KF.S, first = !S.trained, cont = S.best > 0 && S.best < KF.LADDER.length, rows = [];
  U.resetMove();
  if (first) rows.push(btn('Antrenman · başla', 'pri wide', function () { pick(startTrain); }));
  rows.push(btn(cont ? 'Turnuva · devam ' + (S.best + 1) + '/' + KF.LADDER.length : 'Turnuva · ' + KF.LADDER.length + ' maç', first ? 'wide' : 'pri wide', function () { pick(function () { if (cont) tourChoice(); else startTour(0); }); }));
  rows.push(btn('Serbest maç', 'wide', function () { pick(freeSheet); }));
  rows.push(btn('Çevrimiçi düello', 'red wide', function () { pick(function () { onlineSheet(0); }); }));
  rows.push(row([first ? null : btn('Antrenman', 'sm', function () { pick(startTrain); }), btn('Nasıl oynanır', 'sm', U.helpSheet), btn('Ayarlar', 'sm', U.settingsSheet)]));
  showOv([cols([h('h1', { html: 'KAFES <br>DÖVÜŞÜ<small>BELEDİYE PERSONELİ TURNUVASI</small>' }), T('p', '', stats()), charCard()], [h('div', { cls: 'menu' }, rows)])]);
  $('ticker').textContent = 'Hakem mesai kartını basıyor. Turnuva başlamak üzere.';
};
/* ---------- karakter seçimi ---------- */
var TOOLN = { level: 'Su terazisi', notebook: 'Ceza defteri', tray: 'Çay tepsisi', weight: 'Kantar ağırlığı', case: 'Evrak çantası', anchor: 'Demir', shears: 'Budama makası', wrench: 'İngiliz anahtarı', book: 'Kanun kitabı', axe: 'İtfaiye baltası', nozzle: 'Hortum başlığı', stamp: 'Kaşe', phone: 'Telefon', compass: 'Pergel', rod: 'Jalon', cleaver: 'Satır', shovel: 'Kürek', pan: 'Tava' };
function mini(key, w, hgt, live) {
  var cv = h('canvas', { width: String(w * 2), height: String(hgt * 2), style: 'width:' + w + 'px;height:' + hgt + 'px' });
  GFX.preview(cv, key, 0);
  if (live) { var t0 = 0; (function lp() { if (!document.body.contains(cv)) return; t0 += .05; GFX.preview(cv, cv._key || key, t0); setTimeout(lp, 70); })(); }
  return cv;
}
function charCard() {
  var S = KF.S, L = GFX.LOOKS[S.look] || GFX.LOOKS.muhendis;
  return h('button', { cls: 'charbtn', type: 'button', onclick: function () { KF.sfx('ui'); charSelect(U.home); } }, [mini(S.look, 38, 52), h('span', { cls: 'cb', html: '<small>KARAKTERİN</small><b>' + L.name + '</b><em>' + (TOOLN[L.tool] || '') + ' · değiştir</em>' })]);
}
function pick(fn) { if (KF.S.picked) fn(); else charSelect(fn); }
function charSelect(done) {
  var S = KF.S, sel = S.look, big = mini(sel, 96, 130, true), nm = h('b', { cls: 'cn' }), tl = h('span', { cls: 'ct' }), cards = [];
  function show() { var L = GFX.LOOKS[sel]; nm.textContent = L.name; tl.textContent = 'Alet: ' + (TOOLN[L.tool] || '—'); big._key = sel; cards.forEach(function (c) { c.el.classList.toggle('on', c.k === sel); }); }
  var grid = h('div', { cls: 'cgrid' });
  GFX.LOOK_KEYS.forEach(function (k) {
    var el = h('button', { type: 'button', cls: 'ccard', 'aria-label': GFX.LOOKS[k].name, onclick: function () { sel = k; KF.sfx('ui'); show(); } }, [mini(k, 48, 66), h('span', { text: GFX.LOOKS[k].name })]);
    cards.push({ k: k, el: el }); grid.appendChild(el);
  });
  show();
  showOv([cols([T('h2', '', 'Karakterini seç'), h('div', { cls: 'cbig' }, [big, h('div', { cls: 'ci' }, [nm, tl])]), row([btn('Geri', 'sm', U.home), btn('Bu benim', 'pri', function () { S.look = sel; S.picked = true; KF.saveProfile(); if (done === U.home) U.home(); else done(); })])], [grid], 'csel')]);
}
function tourChoice() {
  var S = KF.S;
  showOv([T('h2', '', 'Turnuva'), T('p', '', 'Maç ' + (S.best + 1) + '/' + KF.LADDER.length + '\'den devam edebilir ya da baştan başlayabilirsin.'), h('div', { cls: 'menu' }, [btn('Maç ' + (S.best + 1) + '\'den devam', 'pri wide', function () { startTour(S.best); }), btn('Baştan başla', 'wide', function () { startTour(0); }), btn('Geri', 'sm', U.home)])]);
}

/* ---------- ortak: maç tanıtımı ---------- */
var TIPS = ['İpucu: Rakip kırmızı ünlem gösterince SAVUN\'a bas.', 'İpucu: Aparkat savunmayı deler, korumadaki rakibe işe yarar.', 'İpucu: Rakip sersemken ağır vuruş at.', 'İpucu: Dilekçe dolunca fırlat, savunma tanımaz.', 'İpucu: Düz ile rakibin yavaş vuruşunu hazırlanırken kesebilirsin.', 'İpucu: Savunmayı uzun tutma, dayanıklılık biter.', 'İpucu: Tekme uzak ve ağırdır, bol vakit olunca kullan.', 'İpucu: Aparkat gelince SAVUN yerine SIYRIL dene.', 'İpucu: Rakip sürekli kaçıyorsa SÜPÜR ile yakala.', 'İpucu: SIYRIL başarılı olursa rakip açık kalır, hemen vur.', 'İpucu: Telefonu yan çevirirsen düğmeler iki yana açılır.'];
function intro(o, bg, tag, prog, onGo, onBack) {
  var tip = KF.S.guide ? h('div', { cls: 'tipl' }, [h('div', { html: '<b>' + TIPS[Math.floor(Math.random() * TIPS.length)].replace('İpucu: ', 'İpucu · ') + '</b>' })]) : null;
  showOv([cols([T('span', 'tag', tag), prog, T('h2', '', KF.VENUES[bg]), h('div', { cls: 'vs', html: (KF.S.name || (GFX.LOOKS[KF.S.look] || {}).name || 'Mühendis').toUpperCase() + '<em>VS</em><br>' + o.name })], [T('p', '', o.desc), tip, row([btn('Menü', 'sm', onBack || U.home), btn('Hazırım', 'pri', onGo)])])]);
}
function go() { U.autoFs(); hideOv(); G.sim.ph = 'count'; U.keepAwake(true); }

/* ---------- turnuva ---------- */
function startTour(lv, hp, sp) {
  var o = KF.OPPS[KF.LADDER[lv]]; U.again = function () { startTour(lv); }; G.solo(o, o.bg, { lv: lv, hp: hp, sp: sp }); G.sim.ph = 'wait'; U.resetBlock(); U.lesson = null;
  var prog = h('div', { cls: 'prog' }); KF.LADDER.forEach(function (k, i) { prog.appendChild(h('i', { cls: i < lv ? 'd' : (i === lv ? 'c' : '') })); });
  intro(o, o.bg, 'MAÇ ' + (lv + 1) + '/' + KF.LADDER.length + (lv === KF.LADDER.length - 1 ? ' · FİNAL' : ''), prog, go);
}

/* ---------- serbest maç ---------- */
var FS = { o: 'zabita', bg: 0, dif: null };
function freeSheet() {
  FS.dif = FS.dif || KF.S.dif;
  U.openSheet({ title: 'Serbest maç', f: function (d) {
    d.appendChild(T('div', 'grp', 'Rakip'));
    d.appendChild(U.chips(Object.keys(KF.OPPS).map(function (k) { return [k, k === 'sofor' ? 'ŞOFÖR' : KF.OPPS[k].name.split(' ')[0]]; }), FS.o, function (k) { FS.o = k; FS.bg = KF.OPPS[k].bg; mekan.replaceWith(mekan = mk()); }));
    d.appendChild(T('div', 'grp', 'Mekân'));
    var mekan = mk(); function mk() { return U.chips(KF.VENUES.map(function (v, i) { return [i, v]; }), FS.bg, function (i) { FS.bg = i; }); }
    d.appendChild(mekan);
    d.appendChild(T('div', 'grp', 'Zorluk'));
    d.appendChild(U.chips([['easy', 'Kolay · yeni başlayan'], ['normal', 'Normal'], ['hard', 'Zor · usta']], FS.dif, function (k) { FS.dif = k; }));
    d.appendChild(btn('Başla', 'pri wide', function () { U.closeSheet(); startFree(); }));
  } });
}
function startFree() {
  var o = KF.OPPS[FS.o]; U.again = startFree; G.solo(o, FS.bg, { lv: -1, dif: FS.dif }); G.sim.ph = 'wait'; U.resetBlock(); U.lesson = null;
  intro(o, FS.bg, 'SERBEST MAÇ · ' + ({ easy: 'KOLAY', normal: 'NORMAL', hard: 'ZOR' })[FS.dif], null, go, freeSheetBack);
}
function freeSheetBack() { U.home(); freeSheet(); }

/* ---------- antrenman ---------- */
var LESS = [
  { t: 'DÜZ: hızlı vuruş. Parlayan düğmeye 2 kez dokun', b: 'bJ', k: 'j', n: 2 },
  { t: 'KROŞE: biraz yavaş, daha sert. 2 kez dokun', b: 'bH', k: 'h', n: 2 },
  { t: 'APARKAT: yavaş ama çok sert. 2 kez dokun', b: 'bU', k: 'u', n: 2 },
  { t: 'TEKME: ağır vuruş. 2 kez dokun', b: 'bK', k: 'k', n: 2 },
  { t: 'SÜPÜR: alçak tekme. 2 kez dokun', b: 'bL', k: 'l', n: 2 },
  { t: 'Ünlem çıkınca SAVUN\'a bas ve basılı tut', b: 'bBlock', ev: 'block', n: 1, w: 1 },
  { t: 'Kusursuz savunma: ünlemden hemen sonra SAVUN (ya da 3 savunma)', b: 'bBlock', ev: 'perfect', n: 1, w: 1, alt: 3 },
  { t: 'SIYRIL: ünlem çıkınca SIYRIL\'a bas, yumruk boşa gider', b: 'bDodge', ev: 'dodge', n: 1, w: 1 },
  { t: 'YÜRÜ: yön topunu sağa ve sola kaydır', b: 'joy', pk: ['mf', 'mb'] },
  { t: 'ZIPLA: topu yukarı kaydır, havadayken yerdeki vuruşlar sana değmez', b: 'joy', pk: ['jp'] },
  { t: 'EVRAK TOPU: yön topunu aşağı tut, DÜZ\'e bas', b: 'joy', k: 'pf', n: 1 },
  { t: 'YÜKSELEN APARKAT: topu aşağı tut + APARKAT', b: 'joy', k: 'dp', n: 1 },
  { t: 'DÖNEN TEKME: topu aşağı tut + TEKME', b: 'joy', k: 'tk', n: 1 },
  { t: 'DİLEKÇE doldu! Fırlat', b: 'bSpecial', k: 's', n: 1 }
];
var step = 0, cnt = 0, alt = 0;
function setLesson() { var L = LESS[step]; cnt = 0; alt = 0; U.lesson = { t: L.t, c: L.w ? 'warn' : 'info', b: L.b, w: L.w }; if (L.k === 's' && G.sim) G.sim.f[0].sp = 100; }
function startTrain() {
  U.again = startTrain; G.solo(KF.DUMMY, 0, { train: true, dif: 'easy', lv: -1 }); G.sim.ph = 'wait'; U.resetBlock(); U.resetMove(); step = 0; U.lesson = null;
  showOv([T('span', 'tag', 'ANTRENMAN'), T('h2', '', 'Kafes Okulu'), T('p', '', 'Çırak Cemil sana vurmaz, sadece öğretir. Parlayan düğmeye bas.'), row([btn('Menü', 'sm', U.home), btn('Başla', 'pri', function () { hideOv(); setLesson(); G.sim.ph = 'count'; U.keepAwake(true); })])]);
}
function lessonDone() {
  step++; KF.sfx('ok'); U.callout('GÜZEL!', '#d9ab4c');
  if (step >= LESS.length) {
    U.lesson = null; KF.S.trained = true; KF.saveProfile(); G.sim.ph = 'wait'; U.resetBlock();
    showOv([T('h2', '', 'Antrenman tamam!'), T('p', '', 'Artık hazırsın. Turnuvada rakipler sırayla zorlaşır.'), h('div', { cls: 'menu' }, [btn('Turnuvaya başla', 'pri wide', function () { startTour(0); }), btn('Serbest maç', 'wide', freeSheet), btn('Ana menü', 'sm', U.home)])]);
  } else setLesson();
}
U.onPress = function (k) {
  if (!G.train || !U.lesson || G.mode !== 'solo' || step >= LESS.length) return; var L = LESS[step];
  if (L.pk && L.pk.indexOf(k) >= 0) { L.seen = L.seen || {}; L.seen[k] = 1; if (Object.keys(L.seen).length >= L.pk.length) { L.seen = null; lessonDone(); } }
};
U.onEv = function (e) {
  if (!G.train || !U.lesson || G.mode !== 'solo' || step >= LESS.length) return;
  var L = LESS[step];
  if (L.k && e.k === 'swing' && e.s === 0 && e.m === L.k) { if (++cnt >= L.n) lessonDone(); }
  else if (L.ev === 'dodge') { if (e.k === 'dodge' && e.s === 0 && ++cnt >= L.n) lessonDone(); }
  else if (L.ev && e.s === 0 && (e.k === 'block' || e.k === 'perfect')) {
    if (L.ev === 'block' || e.k === 'perfect') { if (++cnt >= L.n) lessonDone(); }
    else if (L.alt && ++alt >= L.alt) lessonDone();
  }
};

/* ---------- maç sonu ---------- */
G.hook.over = function (mw) {
  var S = KF.S, o = G.opp;
  if (G.mode === 'solo') {
    if (mw === 0) {
      streak = 0; S.wins++; S.assist = Math.max(0, (S.assist || 0) - 1); KF.sfx('win');
      if (G.lv >= 0) S.best = Math.max(S.best, G.lv + 1);
      KF.saveProfile();
      var M = G.M, hp = Math.min(100, Math.round(M.hp[0]) + 35), sp = M.sp[0];
      if (G.lv === KF.LADDER.length - 1) showOv([T('h1', '', 'Şampiyon!'), T('p', '', 'Terfi geldi: Daire Başkanı Yardımcısı Vekili (Geçici). Maaş farkı bir sonraki dönemde.'), row([btn('Yeniden oyna', 'pri', function () { startTour(0); }), btn('Menü', '', U.home)])]);
      else if (G.lv >= 0) showOv([T('h2', '', 'Kazandın!'), T('p', '', 'Çay molası: +35 can. Seyirciler simit atıyor.'), row([btn('Sıradaki maç', 'pri', function () { startTour(G.lv + 1, hp, sp); }), btn('Menü', 'sm', U.home)])]);
      else showOv([T('h2', '', 'Kazandın!'), T('p', '', o.name + ' yere serildi.'), row([btn('Tekrar', 'pri', startFree), btn('Menü', 'sm', U.home)])]);
    } else {
      streak++; S.losses++; S.assist = Math.min(3, (S.assist || 0) + 1); KF.sfx('lose'); KF.saveProfile();
      var again = G.lv >= 0 ? function () { startTour(G.lv); } : startFree, nodes = [T('h2', '', 'Mesai bitti'), T('p', '', 'Hakem seni çay ocağına taşıdı. Bir bardak çay iyi gelir. Sıradaki maçta rakip biraz daha yavaş ve zayıf olacak.')];
      var acts = [btn('Tekrar dene', 'pri', again)];
      if (S.dif !== 'easy' && G.lv >= 0) acts.push(btn('Kolay modda dene', '', function () { S.dif = 'easy'; KF.saveProfile(); again(); }));
      if (streak >= 2) { nodes.push(T('p', '', 'Takıldın mı? Antrenmanı dene, rehber ipuçları ve kolay mod seni parlayan düğmeye yönlendirir.')); acts.push(btn('Antrenman', '', startTrain)); }
      acts.push(btn('Menü', 'sm', U.home));
      showOv(nodes.concat([row(acts)]));
    }
    return;
  }
  var won = mw === G.me; if (won) S.wins++; else S.losses++; KF.saveProfile(); KF.sfx(won ? 'win' : 'lose');
  var M2 = G.M, sc = M2.sc[G.me] + ' - ' + M2.sc[1 - G.me], opn = G.names[1 - G.me], acts2 = [];
  if (G.mode === 'host') acts2.push(btn('Revanş', 'pri', function () { if (G.rematch()) hideOv(); else toast('Rakip yok', true); }));
  else acts2.push(btn('Revanş iste', 'pri', function () { if (G.guest) { G.guest.send({ t: 'rdy' }, 1); toast('Revanş isteği gitti'); } }));
  acts2.push(btn('Çık', 'sm', U.home));
  showOv([T('h2', '', won ? 'Kazandın!' : 'Kaybettin'), T('p', '', sc + ' · ' + opn), row(acts2)]);
};
G.hook.phase = function (ph) { if (ph === 'count' && (G.mode === 'host' || G.mode === 'guest')) hideOv(); };
G.hook.guestStart = function () { hideOv(); U.keepAwake(true); };
G.hook.ready = function () { toast('Rakip revanş istiyor'); };

/* ---------- çevrimiçi ---------- */
function net() { return G.getNet(); }
function netLine(d) {
  var N = net(), s = N.status, t = root.mqtt ? (s === 'online' ? 'Bağlı' : s === 'connecting' ? 'Bağlanıyor…' : s === 'offline' ? 'Bağlanılamadı, yeniden deneniyor' : 'Bağlantı bekleniyor') : 'Çevrimiçi mod için sayfayı GitHub adresinden aç.';
  d.appendChild(h('div', { cls: 'li' }, [h('span', { cls: 'dot' + (s === 'online' ? ' on' : '') }), h('div', { cls: 'tx' }, [h('b', { text: t })])]));
}
function onlineSheet(tab) {
  if (!root.mqtt) toast('Çevrimiçi mod yalnızca yayınlanmış sayfada çalışır', true);
  var N = net();
  function again() { var s = U.sheet(); if (s && s.title === 'Çevrimiçi') s.refresh(); }
  N.onStatus = again; N.onFriends = again;
  N.start().then(again).catch(again);
  U.openSheet({ title: 'Çevrimiçi', tab: tab || 0, onclose: function () { N.onStatus = null; if (G.mode === 'menu') N.watchTables(false); },
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
  d.appendChild(T('p', 'note', 'Gerçek bir rakip bulunur, üç raundun ikisini kazanan düelloyu alır. Her raund farklı bir mekânda oynanır. Beş vuruşun ve sıyrılmanın hepsi çevrimiçinde de var.'));
  d.appendChild(btn('Rakip bul', 'red wide', function () { if (!KF.S.name) { toast('Önce bir ad yaz', true); return; } U.closeSheet(); quick(); }));
  d.appendChild(btn('Özel oda kur', 'wide', function () { if (!KF.S.name) { toast('Önce bir ad yaz', true); return; } U.closeSheet(); hostRoom(false); }));
}
function joinTab(d) {
  netLine(d); nameGuard(d);
  d.appendChild(T('div', 'grp', 'Oda kodu'));
  var inp = h('input', { cls: 'input', maxlength: '5', placeholder: '5 harfli kod', autocapitalize: 'characters', autocomplete: 'off', style: 'text-transform:uppercase;letter-spacing:.2em;text-align:center' });
  d.appendChild(inp);
  d.appendChild(btn('Odaya katıl', 'red wide', function () { var c = KF.clean(inp.value, 5).toUpperCase(); if (c.length !== 5) { toast('Kod 5 harf olmalı', true); return; } if (!KF.S.name) { toast('Önce bir ad yaz', true); return; } U.closeSheet(); joinRoom(c); }));
}
function friendsTab(d, rebuild) {
  var N = net(), rq = Object.keys(N.reqs);
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
    d.appendChild(h('div', { cls: 'li' }, [h('div', { cls: 'av', text: (p && p.a) || f.a }), h('div', { cls: 'tx' }, [h('b', { text: (p && p.n) || f.n }), h('span', { text: st })]), h('span', { cls: 'dot' + (p ? (p.st === 'busy' ? ' busy' : ' on') : '') }), btn('Davet', 'sm red', function () { inviteFriend(id); }), rm]));
  });
  d.appendChild(T('div', 'grp', 'Arkadaş ekle'));
  var inp = h('input', { cls: 'input', maxlength: '8', placeholder: 'Arkadaşının 8 harfli kodu', autocapitalize: 'characters', autocomplete: 'off', style: 'text-transform:uppercase' });
  d.appendChild(inp);
  d.appendChild(btn('İstek gönder', 'wide', function () {
    N.start().then(function () { var r = N.request(inp.value); toast(r === 'ok' ? 'İstek gönderildi' : r === 'self' ? 'Bu senin kodun' : r === 'have' ? 'Zaten arkadaşsınız' : 'Kod 8 karakter olmalı', r !== 'ok'); if (r === 'ok') inp.value = ''; }).catch(function () { toast('Bağlanılamadı', true); });
  }));
  d.appendChild(T('div', 'grp', 'Benim arkadaş kodum'));
  d.appendChild(T('div', 'code', KF.S.id));
  d.appendChild(row([btn('Paylaş', 'sm', function () { U.share('Kafes Dövüşü', 'Beni Kafes Dövüşü\'nde arkadaş ekle: ' + KF.S.id, U.base() + '#f=' + KF.S.id); }), btn('Kopyala', 'sm', function () { U.copyText(KF.S.id); })]));
  d.appendChild(T('p', 'note', 'Bu kod Kart Salonu ile ortaktır. Arkadaşının çevrimiçi görünmesi için Kafes Dövüşü\'nü açık tutması gerekir.'));
}
function inviteFriend(fid) {
  var N = net();
  if (!KF.S.name) { toast('Önce bir ad yaz', true); return; }
  if (G.room && G.mode === 'lobbyH') { N.invite(fid, G.room.code); toast('Davet gönderildi'); return; }
  U.closeSheet();
  hostRoom(false, function (hst) { N.invite(fid, hst.code); toast('Davet gönderildi'); });
}

/* ---------- oda akışları ---------- */
function lobbyOv(title, lines, acts) { showOv([T('span', 'tag', 'ÇEVRİMİÇİ'), T('h2', '', title)].concat(lines, [row(acts)])); }
function fail(msg) {
  var N = net(), det = Object.keys(N.errs || {}).map(function (k) { return k + ': ' + N.errs[k]; }).join(' · '), acts = [];
  if (KF.hasP2P()) acts.push(btn('Özel oda kur', 'pri', function () { hostRoom(false); }));
  acts.push(btn('Tekrar dene', KF.hasP2P() ? '' : 'pri', function () { onlineSheet(0); }), btn('Ana menü', 'sm', U.home));
  showOv([T('h2', '', 'Sunuculara ulaşılamadı'), T('p', '', msg || (root.mqtt ? 'Eşleştirme sunucularına bağlanılamadı. Hızlı maç ve arkadaş listesi çalışmaz, ama özel oda kurup kodu arkadaşına gönderirsen telefonlar doğrudan bağlanarak oynayabilir.' : 'Çevrimiçi mod için sayfayı yayınlanmış GitHub adresinden aç.')), det ? T('p', 'note', det) : null, row(acts)]);
}
function vsCpu() {
  var ks = Object.keys(KF.OPPS), k = ks[Math.floor(Math.random() * ks.length)];
  FS.o = k; FS.bg = KF.OPPS[k].bg; FS.dif = FS.dif || KF.S.dif; startFree();
}
function hostRoom(pub, cb) {
  lobbyOv('Oda kuruluyor…', [], [btn('İptal', 'sm', U.home)]);
  G.host(pub).then(function (hst) {
    var start = null;
    function paint() {
      if (G.room !== hst) return;
      if (hst.guest) { lobbyOv('Rakip geldi!', [T('p', '', hst.guest.a + ' ' + hst.guest.n + ' karşında. Dövüş birazdan başlıyor.')], []); return; }
      var lines = [T('div', 'code', hst.code), T('p', '', pub ? 'Rakip aranıyor…' : 'Bu kodu arkadaşına gönder ya da arkadaşlarından davet et.')], acts = [];
      if (!pub) { acts.push(btn('Paylaş', 'sm', function () { U.share('Kafes Dövüşü', 'Kafes Dövüşü düellosuna gel! Oda: ' + hst.code, hst.link()); })); acts.push(btn('Davet et', 'sm', function () { onlineSheet(1); })); }
      acts.push(btn('İptal', 'sm', U.home));
      lobbyOv(pub ? 'Rakip aranıyor' : 'Özel oda', lines, acts);
    }
    hst.onGuest = function () { paint(); clearTimeout(start); start = setTimeout(function () { if (G.room === hst && hst.guest && G.hostBegin()) { stopQ(); hideOv(); U.keepAwake(true); } }, 1600); };
    hst.onDrop = function () {
      if (G.room !== hst) return;
      if (G.mode === 'host') { KF.sfx('lose'); showOv([T('h2', '', 'Rakip ayrıldı'), T('p', '', 'Bağlantı koptu ya da rakip çıktı.'), row([btn('Ana menü', 'pri', U.home)])]); }
      else { toast('Rakip ayrıldı'); paint(); }
    };
    paint(); if (cb) cb(hst);
    if (pub) {
      net().watchTables(true); var t0 = Date.now();
      var tick = function () {
        if (G.room !== hst || G.mode !== 'lobbyH') { stopQ(); return; }
        var other = liveTables().filter(function (t) { return t.code < hst.code; })[0];
        if (other && !hst.guest) { stopQ(); joinRoom(other.code, true); return; }
        if (Date.now() - t0 > 25000 && !hst.guest) {
          stopQ();
          lobbyOv('Rakip bulunamadı', [T('p', '', 'Şu an aynı anda arayan başka oyuncu yok. Bekleyebilir, arkadaşını davet edebilir ya da bilgisayara karşı oynayabilirsin.')], [btn('Bekle', 'sm', function () { t0 = Date.now(); paint(); stopQ(); qTimer = setInterval(tick, 4000); }), btn('Arkadaş çağır', 'sm', function () { G.stop(); hostRoom(false, function () { onlineSheet(1); }); }), btn('Bilgisayara karşı', 'sm pri', function () { stopQ(); G.stop(); vsCpu(); }), btn('Menü', 'sm', U.home)]);
        }
      };
      stopQ(); qTimer = setInterval(tick, 4000);
    }
  }).catch(function () { fail(); });
}
function quick() {
  lobbyOv('Rakip aranıyor', [T('p', '', 'Açık odalar taranıyor…')], [btn('İptal', 'sm', U.home)]);
  var N = net(), tok = ++qTok;
  N.start().then(function () {
    N.watchTables(true);
    setTimeout(function () {
      if (tok !== qTok || G.mode !== 'menu') return;
      var t = liveTables(); if (t.length) joinRoom(t[0].code, true); else hostRoom(true);
    }, 2400);
  }).catch(function () { fail(); });
}
function joinRoom(code, auto) {
  stopQ(); G.stop();
  lobbyOv('Bağlanılıyor', [T('div', 'code', code)], [btn('İptal', 'sm', U.home)]);
  G.join(code).then(function (g) {
    function paint() {
      if (G.guest !== g || G.mode === 'guest') return;
      var m = { joining: ['Bağlanılıyor', 'Oda aranıyor…'], lobby: ['Bağlandın', 'Ev sahibi dövüşü başlatıyor…'], full: ['Oda dolu', 'Bu odada zaten iki oyuncu var.'], gone: ['Oda bulunamadı', 'Kod yanlış ya da oda kapanmış olabilir.'], bye: ['Oda kapandı', 'Ev sahibi odadan ayrıldı.'] }[g.state] || ['Bağlanılıyor', ''];
      lobbyOv(m[0], [T('div', 'code', code), T('p', '', m[1])], [btn(g.state === 'lobby' || g.state === 'joining' ? 'İptal' : 'Ana menü', 'sm', U.home)]);
    }
    g.onState = function () { if (auto && g.state === 'gone' && G.guest === g && G.mode === 'lobbyG') { deadT[code] = Date.now(); hostRoom(true); return; } if (G.mode === 'guest' && (g.state === 'gone' || g.state === 'bye')) { KF.sfx('lose'); showOv([T('h2', '', 'Bağlantı koptu'), T('p', '', 'Rakip ayrıldı ya da bağlantı kesildi.'), row([btn('Ana menü', 'pri', U.home)])]); } else paint(); };
    g.onInfo = paint; paint();
  }).catch(function () { fail('Çevrimiçi sunuculara ulaşılamadı.'); });
}

/* ---------- davet, bağlantı ve açılış ---------- */
function wireNet() {
  var N = net();
  N.onRequest = function (id, r) { toast(r.n + ' arkadaşlık isteği gönderdi'); var s = U.sheet(); if (s && s.title === 'Çevrimiçi') s.refresh(); };
  N.onToast = function (t) { toast(t); };
  N.onInvite = function (inv) {
    if (G.mode !== 'menu' && G.mode !== 'lobbyH') { toast(inv.n + ' seni düelloya çağırıyor, maçtan sonra katılabilirsin'); return; }
    KF.sfx('perfect');
    showOv([T('span', 'tag', 'DÜELLO DAVETİ'), T('h2', '', inv.a + ' ' + inv.n), T('p', '', 'Seni kafese çağırıyor.'), row([btn('Katıl', 'red', function () { joinRoom(inv.code); }), btn('Vazgeç', 'sm', U.home)])]);
  };
}
function boot() {
  G.start(); wireNet();
  try { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {}); } catch (e) {}
  if (KF.ks.get('friends', null) || Object.keys(KF.ks.get('reqs', {})).length || KF.ks.get('sent', null)) setTimeout(function () { net().start().catch(function () {}); }, 1500);
  var m, hs = location.hash;
  if ((m = hs.match(/#o=([A-Za-z0-9]{5})/))) { history.replaceState(null, '', U.base()); U.home(); setTimeout(function () { var c = m[1].toUpperCase(); showOv([T('span', 'tag', 'DÜELLO DAVETİ'), T('h2', '', 'Odaya katıl'), T('div', 'code', c), row([btn('Katıl', 'red', function () { if (!KF.S.name) { toast('Önce Ayarlar\'dan bir ad yaz', true); U.settingsSheet(); return; } joinRoom(c); }), btn('Vazgeç', 'sm', U.home)])]); }, 50); }
  else if ((m = hs.match(/#f=([A-Za-z0-9]{8})/))) { history.replaceState(null, '', U.base()); U.home(); setTimeout(function () { var f = m[1].toUpperCase(); showOv([T('span', 'tag', 'ARKADAŞ KODU'), T('h2', '', 'Arkadaş ekle'), T('div', 'code', f), row([btn('Ekle', 'pri', function () { net().start().then(function () { var r = net().request(f); toast(r === 'ok' ? 'İstek gönderildi' : r === 'self' ? 'Bu senin kodun' : 'Zaten arkadaşsınız', r !== 'ok'); U.home(); }).catch(function () { toast('Bağlanılamadı', true); U.home(); }); }), btn('Vazgeç', 'sm', U.home)])]); }, 50); }
  else U.home();
}
boot();
})(window);
