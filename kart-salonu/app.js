/* Kart Salonu · uygulama: ana sayfa, kurulum, çevrimiçi akış */
(function (root) {
'use strict';
var KS = root.KS;
var h = KS.h;
var App = KS.App = {};

var GAMES = {
  pisti: { n: 'Pişti', min: 2, max: 4, d: 'Masadaki kartı aynı sayıyla ya da Vale ile topla. Pişti yap, puanı katla.', fan: [KS.make(1, 11), KS.make(3, 1), KS.make(0, 10)], chips: ['2–4 kişi', 'Eşli oyun'] },
  dost: { n: 'Dost Kazığı', min: 2, max: 4, d: 'Aynı sayıdaki kartı yandakine yaz. Ceza yememek için kurnaz oyna.', fan: [KS.make(0, 3), KS.make(1, 11), KS.make(2, 13)], chips: ['2–4 kişi', 'Hesaplı'] },
  pis7: { n: 'Pis Yedili', min: 2, max: 4, d: 'Yedilerle ceza yığ, Vale ile rengi değiştir, elini ilk bitir.', fan: [KS.make(1, 7), KS.make(0, 11), KS.make(3, 10)], chips: ['2–4 kişi', 'Joker seçenekli'] }
};
var DEFCFG = {
  pisti: { n: 2, target: 101, teams: false },
  dost: { n: 3, hands: 5 },
  pis7: { n: 3, jokers: false, ace: 'draw', mode: 'hands', v: 5 }
};
App.GAMES = GAMES;

var net = null, ui = null, ctrl = null, cur = null, host = null, client = null;
var inGame = false;
function getNet() { if (!net) { net = new KS.Net(); wireNet(); } return net; }

function wireNet() {
  net.onToast = function (m, k) { KS.toast(m, k); };
  net.onInvite = function (inv) {
    KS.sfx('turn');
    var g = GAMES[inv.g] ? GAMES[inv.g].n : 'oyuna';
    var sh = KS.sheet('Davet', h('div', null, h('div', { class: 'big', text: inv.a + ' ' + inv.n }), h('p', { class: 'note', style: { textAlign: 'center' }, text: g + ' masasına seni çağırıyor.' })), {
      buttons: [{ text: 'Sonra' }, { text: 'Katıl', cls: 'gold', fn: function () { App.join(inv.code); } }]
    });
  };
  net.onRequest = function (id, r) {
    KS.sfx('pop');
    KS.toast(r.n + ' arkadaşlık isteği gönderdi', 'gold', 3500);
    if (App.refreshFriends) App.refreshFriends();
    App.badge();
  };
  net.onFriends = function () { if (App.refreshFriends) App.refreshFriends(); App.badge(); };
  net.onTables = function () { if (App.refreshTables) App.refreshTables(); };
}
App.badge = function () {
  var n = net ? Object.keys(net.reqs).length : Object.keys(KS.lsGet('reqs', {})).length;
  KS.$$('.fr-dot').forEach(function (d) { d.classList.toggle('on', n > 0); });
};

/* ---------- Ekran yönetimi ---------- */
function show(id) {
  KS.$$('.screen').forEach(function (s) { s.classList.toggle('on', s.id === id); });
}
App.size = function () {
  var app = KS.$('#app'), vh = root.innerHeight;
  document.documentElement.style.setProperty('--vh', vh + 'px');
  document.body.classList.toggle('land', root.innerWidth > vh * 1.05);
  KS.applySafe();
  if (KS.onLayout) KS.onLayout();
};

/* ---------- Ana sayfa ---------- */
App.home = function () {
  inGame = false;
  show('menu');
  KS.keepAwake(false); KS.awakeWanted = false;
  var m = KS.$('#menu'); KS.clear(m);
  var S = KS.S;
  var wrap = h('div', { class: 'home' });
  var top = h('div', { class: 'top' });
  top.appendChild(h('a', { class: 'btn ibtn', href: '../index.html', 'aria-label': 'Tüm oyunlar', title: 'Tüm oyunlar', style: { marginRight: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }, html: '<svg class="ic" viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4"/></svg>' }));
  if (KS.canFs()) top.appendChild(h('button', { class: 'btn ibtn', 'aria-label': 'Tam ekran', 'data-fs': '1', onclick: function () { KS.sfx('click'); KS.toggleFs(); } }, KS.ic(KS.isFs() ? 'shrink' : 'expand')));
  top.appendChild(h('button', { class: 'btn ibtn', 'aria-label': 'Kılavuz', onclick: function () { KS.sfx('click'); KS.helpSheet('basics'); } }, KS.ic('help')));
  top.appendChild(h('button', { class: 'btn ibtn', 'aria-label': 'Ayarlar', onclick: function () { KS.sfx('click'); KS.settingsSheet(); } }, KS.ic('gear')));
  wrap.appendChild(top);
  wrap.appendChild(h('div', { class: 'logo' },
    h('div', { class: 'suits', html: '♠ <span class="r">♥</span> <span class="r">♦</span> ♣' }),
    h('h1', { text: 'KART SALONU' }),
    h('div', { class: 'tag', text: 'PİŞTİ · DOST KAZIĞI · PİS YEDİLİ' })));

  // devam et
  var save = KS.lsGet('save', null), hr = KS.lsGet('hostroom', null);
  if (hr && Date.now() - hr.ts > 6 * 3600000) { KS.lsDel('hostroom'); hr = null; }
  if (save && save.snap && save.snap.st && save.snap.st.phase === 'gameEnd') { KS.lsDel('save'); save = null; }
  if (save && save.snap) {
    wrap.appendChild(h('div', { class: 'resume' }, h('div', { class: 't' }, h('b', { text: 'Oyun yarım kaldı' }), (GAMES[save.snap.game] || {}).n + ' · ' + save.snap.seats.length + ' kişi'),
      h('button', { class: 'btn sm', text: 'Sil', onclick: function () { KS.lsDel('save'); App.home(); } }),
      h('button', { class: 'btn gold sm', text: 'Devam et', onclick: function () { KS.sfx('click'); App.resume(save); } })));
  } else if (hr && hr.snap) {
    wrap.appendChild(h('div', { class: 'resume' }, h('div', { class: 't' }, h('b', { text: 'Çevrimiçi oda sürüyor · ' + hr.code }), (GAMES[hr.game] || {}).n),
      h('button', { class: 'btn sm', text: 'Kapat', onclick: function () { KS.lsDel('hostroom'); App.home(); } }),
      h('button', { class: 'btn gold sm', text: 'Sürdür', onclick: function () { KS.sfx('click'); App.resumeHost(hr); } })));
  }

  var nm = h('input', { class: 'input', maxlength: 14, placeholder: 'Kullanıcı adın', value: S.name, 'aria-label': 'Kullanıcı adı', autocomplete: 'off' });
  nm.addEventListener('input', function () { S.name = KS.clean(nm.value, 14); KS.saveSettings(); });
  var avb = h('button', { class: 'avb', 'aria-label': 'Simge seç', text: S.av, onclick: function () {
    KS.sfx('click');
    var g = h('div', { class: 'avs' });
    var sh;
    KS.AVATARS.forEach(function (a) { g.appendChild(h('button', { class: S.av === a ? 'on' : '', text: a, onclick: function () { S.av = a; KS.saveSettings(); avb.textContent = a; sh.close(); if (net) net.publishPresence(); } })); });
    sh = KS.sheet('Simgeni seç', g);
  } });
  App.nameInput = nm;
  wrap.appendChild(h('div', { class: 'namebox' }, avb, h('div', { style: { flex: 1, minWidth: 0 } }, h('small', { text: 'Oyuncu adı' }), nm)));

  var games = h('div', { class: 'games' });
  Object.keys(GAMES).forEach(function (id) {
    var g = GAMES[id], fan = h('div', { class: 'fan' });
    g.fan.forEach(function (c, i) {
      var e = KS.cards.el(c); e.classList.add('static');
      e.style.cssText = 'position:absolute;left:' + (i * 1.7) + 'rem;top:' + (Math.abs(i - 1) * 0.35) + 'rem;transform:rotate(' + ((i - 1) * 11) + 'deg);transform-origin:50% 120%;--cw:3.1rem';
      fan.appendChild(e);
    });
    var meta = h('div', { class: 'meta' }); g.chips.forEach(function (c) { meta.appendChild(h('span', { class: 'chip', text: c })); });
    meta.appendChild(h('span', { class: 'chip ok', text: 'Çevrimiçi' }));
    games.appendChild(h('button', { class: 'gt', onclick: function () { KS.sfx('click'); App.setup(id); } }, fan, h('div', { style: { flex: 1, minWidth: 0 } }, h('h3', { text: g.n }), h('p', { text: g.d }), meta)));
  });
  wrap.appendChild(games);

  var m2 = h('div', { class: 'menu2' });
  var frb = h('button', { class: 'btn', onclick: function () { KS.sfx('click'); App.hub('friends'); } }, KS.ic('users'), 'Arkadaşlar', h('span', { class: 'fr-dot dot' }));
  frb.firstChild.nextSibling; frb.style.position = 'relative';
  m2.appendChild(frb);
  m2.appendChild(h('button', { class: 'btn', onclick: function () { KS.sfx('click'); App.hub('join'); } }, KS.ic('link'), 'Odaya gir'));
  m2.appendChild(h('button', { class: 'btn', onclick: function () { KS.sfx('click'); KS.helpSheet('basics'); } }, KS.ic('info'), 'Kılavuz'));
  m2.appendChild(h('button', { class: 'btn', onclick: function () { KS.sfx('click'); KS.settingsSheet(); } }, KS.ic('gear'), 'Ayarlar'));
  wrap.appendChild(m2);
  wrap.appendChild(h('div', { class: 'foot' }, h('div', { class: 'sign', text: 'by uozdil' }), h('small', { text: 'Kurulumsuz · cihazda çalışır' })));
  m.appendChild(wrap);
  var st = KS.$$('.fr-dot'); st.forEach(function (d) { d.style.cssText = 'position:absolute;top:.4rem;right:.5rem'; });
  App.badge();
  m.scrollTop = 0;
};

App.needName = function () {
  if (KS.clean(KS.S.name, 14)) return false;
  KS.toast('Önce bir kullanıcı adı yaz', 'gold', 2200);
  KS.closeAll();
  if (App.nameInput) { App.nameInput.focus(); try { App.nameInput.scrollIntoView({ block: 'center' }); } catch (e) {} }
  return true;
};
KS.closeAll = function () { while (KS.sheets.length) KS.sheets[KS.sheets.length - 1].close(true); };

/* ---------- Kurulum penceresi ---------- */
App.setup = function (id) {
  var G = GAMES[id], cfg = Object.assign({}, DEFCFG[id], KS.lsGet('cfg.' + id, {}));
  cfg.n = KS.clamp(cfg.n, G.min, G.max);
  var turnTime = KS.lsGet('turntime', 0);
  var body = h('div'), sh;
  function save() { KS.lsSet('cfg.' + id, cfg); }
  function segk(k, opts, after) {
    var box = h('div', { class: 'seg' });
    opts.forEach(function (o) {
      var b = h('button', { text: o[1], class: cfg[k] === o[0] ? 'on' : '', onclick: function () { KS.sfx('click'); cfg[k] = o[0]; save(); KS.$$('button', box).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); if (after) after(); } });
      box.appendChild(b);
    });
    return box;
  }
  function row(l, s, c) { return h('div', { class: 'row' }, h('div', { class: 'lb' }, h('b', { text: l }), s ? h('span', { text: s }) : null), c); }
  function build() {
    KS.clear(body);
    body.appendChild(h('p', { class: 'note', text: G.d }));
    body.appendChild(h('div', { class: 'grp', text: 'Oyuncu sayısı' }));
    var ns = []; for (var i = G.min; i <= G.max; i++) ns.push([i, i + ' kişi']);
    var sg = segk('n', ns, build); sg.classList.add('full'); body.appendChild(sg);
    body.appendChild(h('div', { class: 'grp', text: 'Kurallar' }));
    if (id === 'pisti') {
      body.appendChild(row('Hedef puan', 'İlk ulaşan kazanır', segk('target', [[51, '51'], [101, '101'], [151, '151']])));
      if (cfg.n === 4) body.appendChild(row('Eşli oyun', '1-3 ve 2-4. oyuncular takım olur', segk('teams', [[false, 'Hayır'], [true, 'Evet']])));
    } else if (id === 'dost') {
      body.appendChild(row('El sayısı', 'Her elin sonunda puan yazılır', segk('hands', [[3, '3'], [5, '5'], [7, '7'], [10, '10']])));
    } else {
      body.appendChild(row('Joker', 'Renk seçtirir, 10 kart çektirir', segk('jokers', [[false, 'Yok'], [true, 'Var']])));
      body.appendChild(row('As', 'Sıradakine ne olsun?', segk('ace', [['draw', 'Kart çeker'], ['skip', 'Atlar']])));
      body.appendChild(row('Oyun sonu', null, segk('mode', [['hands', 'El sayısı'], ['limit', 'Puan sınırı']], function () { cfg.v = cfg.mode === 'hands' ? 5 : 100; save(); build(); })));
      body.appendChild(row(cfg.mode === 'hands' ? 'El sayısı' : 'Puan sınırı', null, segk('v', cfg.mode === 'hands' ? [[3, '3'], [5, '5'], [7, '7']] : [[50, '50'], [100, '100'], [200, '200']])));
    }
    body.appendChild(h('div', { class: 'grp', text: 'Bilgisayar' }));
    body.appendChild(row('Zorluk', null, (function () {
      var box = h('div', { class: 'seg' });
      [['easy', 'Kolay'], ['medium', 'Orta'], ['hard', 'Zor']].forEach(function (o) {
        var b = h('button', { text: o[1], class: KS.S.level === o[0] ? 'on' : '', onclick: function () { KS.sfx('click'); KS.S.level = o[0]; KS.saveSettings(); KS.$$('button', box).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); } });
        box.appendChild(b);
      });
      return box;
    })()));
    body.appendChild(h('div', { class: 'grp', text: 'Çevrimiçi' }));
    var tt = h('div', { class: 'seg' });
    [[0, 'Yok'], [20, '20 sn'], [40, '40 sn'], [60, '60 sn']].forEach(function (o) {
      var b = h('button', { text: o[1], class: turnTime === o[0] ? 'on' : '', onclick: function () { KS.sfx('click'); turnTime = o[0]; KS.lsSet('turntime', o[0]); KS.$$('button', tt).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); } });
      tt.appendChild(b);
    });
    body.appendChild(row('Hamle süresi', 'Süre dolunca bilgisayar oynar', tt));
  }
  build();
  sh = KS.sheet(G.n, body, { wide: false, buttons: [
    { text: 'Çevrimiçi oda kur', fn: function () { if (App.needName()) return false; var c = Object.assign({}, cfg); sh.close(); App.createRoom(id, c, turnTime); return false; }, keep: true },
    { text: 'Başla', cls: 'gold', fn: function () { if (App.needName()) return false; var c = Object.assign({}, cfg); sh.close(true); App.startLocal(id, c); return false; }, keep: true }
  ] });
};

function engineOpts(id, cfg) {
  if (id === 'pisti') return { target: cfg.target, teams: !!cfg.teams };
  if (id === 'dost') return { hands: cfg.hands };
  return { jokers: !!cfg.jokers, ace: cfg.ace, mode: cfg.mode, v: cfg.v };
}

/* ---------- Yerel oyun ---------- */
App.startLocal = function (id, cfg) {
  var n = cfg.n, seats = [], used = {}, i, nm;
  seats.push({ name: KS.clean(KS.S.name, 14) || 'Ben', av: KS.S.av, human: true, pid: KS.S.id });
  for (i = 1; i < n; i++) {
    do { nm = KS.pick(KS.BOT_NAMES || ['Bot']); } while (used[nm]);
    used[nm] = 1;
    seats.push({ name: nm, av: KS.pick(KS.AVATARS), human: false, level: KS.S.level });
  }
  var sess = new KS.Session({ game: id, seats: seats, opts: engineOpts(id, cfg) });
  sess.saver = function (s) {
    if (s.st.phase === 'gameEnd' || (s.st.over && s.st.phase === 'handEnd')) KS.lsDel('save');
    else KS.lsSet('save', { snap: s.snapshot(), cfg: cfg, ts: Date.now() });
  };
  cur = { mode: 'local', id: id, cfg: cfg };
  var c = new KS.LocalCtrl(sess, 0);
  App.showGame(c, function () { sess.start(); });
};
App.resume = function (save) {
  var s = save.snap;
  var sess = new KS.Session({ game: s.game, seats: s.seats, opts: s.opts, st: s.st, seq: s.seq, ready: s.ready });
  sess.seats[0].name = KS.clean(KS.S.name, 14) || sess.seats[0].name; sess.seats[0].av = KS.S.av;
  sess.saver = function (x) {
    if (x.st.phase === 'gameEnd' || (x.st.over && x.st.phase === 'handEnd')) KS.lsDel('save');
    else KS.lsSet('save', { snap: x.snapshot(), cfg: save.cfg, ts: Date.now() });
  };
  cur = { mode: 'local', id: s.game, cfg: save.cfg || DEFCFG[s.game] };
  var c = new KS.LocalCtrl(sess, 0);
  App.showGame(c, function () { sess.kick(); }, { noDeal: true });
};

/* ---------- Oyun ekranı ---------- */
App.showGame = function (c, afterShow, o) {
  o = o || {};
  if (ui) { try { ui.destroy(); } catch (e) {} ui = null; }
  ctrl = c; inGame = true;
  KS.closeAll();
  show('game');
  KS.awakeWanted = true; KS.keepAwake(true);
  if (KS.S.autofs && KS.canFs() && !KS.isFs()) KS.toggleFs();
  try { history.pushState({ g: 1 }, ''); } catch (e) {}
  App.size();
  ui = new KS.GameUI({
    ctrl: c, noDeal: o.noDeal,
    onExit: function (where) { App.exitGame(where); },
    onHelp: function (g) { KS.helpSheet(g); },
    onSettings: function () { KS.settingsSheet(1); }
  });
  if (afterShow) setTimeout(afterShow, 350);
};
App.exitGame = function (where) {
  var c = ctrl, was = cur;
  if (ui) { try { ui.destroy(); } catch (e) {} ui = null; }
  if (c) {
    try {
      if (c.isOnline && c.leave) c.leave();
      c.destroy();
    } catch (e) {}
  }
  ctrl = null; host = null; client = null;
  inGame = false;
  if (where === 'again' && was && was.mode === 'local') { App.startLocal(was.id, was.cfg); return; }
  KS.lsDel('hostroom');
  App.home();
  if (where === 'back' && was && was.id && was.mode === 'local') App.setup(was.id);
  else if (where === 'back' && was && was.mode === 'online') App.hub('friends');
};

/* ---------- Çevrimiçi ---------- */
function netBusy(text) {
  var sh = KS.sheet('Çevrimiçi', h('div', { style: { textAlign: 'center', padding: '1rem 0' } }, h('span', { class: 'spin' }), h('p', { class: 'note', text: text || 'Bağlanılıyor…' })), { noclose: true, sticky: true });
  return sh;
}
App.connect = function (okFn) {
  var n = getNet(), busy = null;
  if (n.status === 'online' && n.cli && n.cli.connected) { okFn(n); return; }
  busy = netBusy('Bağlanılıyor…');
  n.start().then(function () { busy.close(true); okFn(n); }).catch(function () {
    busy.close(true);
    var errs = Object.keys(n.errors || {}).length;
    KS.sheet('Bağlanamadı', h('div', null, h('p', { class: 'note', text: 'İnternet bağlantını kontrol et ve tekrar dene. Ağın çevrimiçi oyun sunucularını engelliyor olabilir (iş/okul ağı).' })), {
      buttons: [{ text: 'Vazgeç' }, { text: 'Tekrar dene', cls: 'gold', fn: function () { App.connect(okFn); } }]
    });
  });
};

App.createRoom = function (id, cfg, turnTime) {
  App.connect(function (n) {
    host = new KS.RoomHost(n, { game: id, n: cfg.n, opts: engineOpts(id, cfg), turnTime: turnTime, level: KS.S.level, pub: false });
    cur = { mode: 'online', id: id, cfg: cfg };
    App.lobbyHost(host, cfg);
  });
};
App.lobbyHost = function (hst, cfg) {
  var body = h('div'), sh, code = hst.code;
  function build() {
    KS.clear(body);
    body.appendChild(h('div', { class: 'note', style: { textAlign: 'center' }, text: 'Oda kodu' }));
    body.appendChild(h('div', { class: 'code', text: code }));
    body.appendChild(h('div', { style: { display: 'flex', gap: '.5rem' } },
      h('button', { class: 'btn sm block', onclick: function () { KS.copy(code); KS.toast('Kod kopyalandı'); } }, KS.ic('copy'), 'Kodu kopyala'),
      h('button', { class: 'btn sm block', onclick: function () { KS.share('Kart Salonu', GAMES[hst.game].n + ' masama gel! Oda kodu: ' + code, hst.link()); } }, KS.ic('share'), 'Bağlantı paylaş')));
    body.appendChild(h('div', { class: 'grp', text: 'Masa' }));
    var list = h('div', { class: 'list' });
    hst.seats.forEach(function (s, i) {
      if (s.open) list.appendChild(h('div', { class: 'li open' }, h('div', { class: 'av', text: '＋' }), h('div', { class: 'tx' }, h('b', { text: 'Bekleniyor…' }), h('span', { text: 'Boş kalırsa bilgisayar oynar' }))));
      else list.appendChild(h('div', { class: 'li' }, h('div', { class: 'av', text: s.av }), h('div', { class: 'tx' }, h('b', { text: s.name + (i === 0 ? ' (sen)' : '') }), h('span', { text: i === 0 ? 'Oda sahibi' : 'Hazır' }))));
    });
    body.appendChild(list);
    body.appendChild(h('div', { class: 'row' }, h('div', { class: 'lb' }, h('b', { text: 'Açık masa' }), h('span', { text: 'Odan herkesin görebileceği listede yayınlanır' })),
      (function () { var b = h('button', { class: 'sw' + (hst.pub ? ' on' : ''), onclick: function () { hst.pub = !hst.pub; b.classList.toggle('on', hst.pub); hst.publishInfo(); if (!hst.pub) net.pub('ksl1/t/' + code, '', { retain: true }); } }); return b; })()));
    // arkadaş daveti
    var fr = net.friends(), ids = Object.keys(fr);
    body.appendChild(h('div', { class: 'grp', text: 'Arkadaşları çağır' }));
    if (!ids.length) body.appendChild(h('div', { class: 'empty', text: 'Henüz arkadaşın yok. Arkadaşlar bölümünden kod ile ekleyebilirsin.' }));
    else {
      var fl = h('div', { class: 'list' });
      ids.forEach(function (fid) {
        var p = net.presence[fid], f = fr[fid];
        fl.appendChild(h('div', { class: 'li' }, h('div', { class: 'av' }, f.a, h('i', { class: 'st ' + (p ? (p.st === 'busy' ? 'busy' : 'on') : '') })), h('div', { class: 'tx' }, h('b', { text: f.n }), h('span', { text: p ? (p.st === 'busy' ? 'Oyunda' : 'Çevrimiçi') : 'Çevrimdışı' })),
          h('div', { class: 'acts' }, h('button', { class: 'btn sm', text: p ? 'Davet et' : 'Davet gönder', onclick: function (e) { net.invite(fid, code, hst.game); e.target.textContent = 'Gönderildi'; KS.sfx('pop'); } }))));
      });
      body.appendChild(fl);
    }
  }
  hst.lobbyCb = function () { build(); };
  App.refreshFriends = function () { build(); };
  build();
  sh = KS.sheet(GAMES[hst.game].n + ' · ' + cfg.n + ' kişi', body, { noclose: true, sticky: true, buttons: [
    { text: 'İptal', fn: function () { hst.close(); host = null; App.refreshFriends = null; } },
    { text: 'Başlat', cls: 'gold', fn: function () {
      App.refreshFriends = null;
      var sess = hst.start();
      var c = new KS.LocalCtrl(sess, 0, {
        chat: function (seat, m) { hst.broadcastChat(seat, m); },
        conn: function () { return net.status === 'online' ? 'ok' : 'bad'; },
        destroy: function () { hst.close(); }
      });
      hst.chatCb = function (s, t) { if (c.chatCb) c.chatCb(s, t); };
      sh.close(true);
      App.showGame(c, function () { hst.go(); });
      return false;
    }, keep: true }
  ] });
};
App.resumeHost = function (hr) {
  if (App.needName()) return;
  App.connect(function (n) {
    host = new KS.RoomHost(n, { code: hr.code, game: hr.game, n: hr.n, opts: hr.opts, turnTime: hr.turnTime }, hr);
    var sess = host.sess;
    cur = { mode: 'online', id: hr.game, cfg: {} };
    var c = new KS.LocalCtrl(sess, 0, {
      chat: function (seat, m) { host.broadcastChat(seat, m); },
      conn: function () { return net.status === 'online' ? 'ok' : 'bad'; },
      destroy: function () { host.close(); }
    });
    host.chatCb = function (s, t) { if (c.chatCb) c.chatCb(s, t); };
    App.showGame(c, function () { sess.kick(); host.pushAll([], 'sync'); }, { noDeal: true });
  });
};

App.join = function (code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  if (code.length !== 5) { KS.toast('Oda kodu 5 karakter olmalı', 'bad'); return; }
  if (App.needName()) return;
  KS.closeAll();
  App.connect(function (n) {
    var cl = new KS.RoomClient(n, code), sh = null, started = false;
    client = cl;
    cur = { mode: 'online', id: '', cfg: {} };
    function build() {
      if (started) return;
      if (cl.state === 'play' && cl.msg && cl.msg.view) {
        started = true; if (sh) sh.close(true);
        cur.id = cl.game;
        cl.chat2 = null;
        App.showGame(cl);
        return;
      }
      if (!sh) {
        sh = KS.sheet('Oda ' + code, h('div'), { noclose: true, sticky: true, buttons: [{ text: 'Ayrıl', fn: function () { cl.leave(); cl.destroy(); client = null; started = true; sh = null; App.home(); } }] });
      }
      var b = sh.body; KS.clear(b);
      if (cl.state === 'full') { b.appendChild(h('div', { class: 'empty', text: 'Bu oda dolu ya da oyun başlamış.' })); return; }
      if (cl.state === 'gone') { b.appendChild(h('div', { class: 'empty', text: 'Oda bulunamadı. Kodu kontrol et; oda sahibi uygulamayı açık tutmalı.' })); return; }
      if (cl.state === 'bye') { b.appendChild(h('div', { class: 'empty', text: 'Oda kapatıldı.' })); return; }
      if (!cl.info) { b.appendChild(h('div', { style: { textAlign: 'center', padding: '1rem' } }, h('span', { class: 'spin' }), h('p', { class: 'note', text: 'Odaya bağlanılıyor…' }))); return; }
      var info = cl.info;
      b.appendChild(h('div', { class: 'note', style: { textAlign: 'center' }, text: (GAMES[info.g] ? GAMES[info.g].n : '') + ' · ' + info.n + ' kişi' }));
      var list = h('div', { class: 'list' });
      info.s.forEach(function (s, i) {
        if (s.o) list.appendChild(h('div', { class: 'li open' }, h('div', { class: 'av', text: '＋' }), h('div', { class: 'tx' }, h('b', { text: 'Boş yer' }))));
        else list.appendChild(h('div', { class: 'li' }, h('div', { class: 'av', text: s.a }), h('div', { class: 'tx' }, h('b', { text: s.n + (cl.seat === i ? ' (sen)' : '') }), h('span', { text: i === 0 ? 'Oda sahibi' : (s.h ? 'Oyuncu' : 'Bilgisayar') }))));
      });
      b.appendChild(list);
      b.appendChild(h('p', { class: 'note', style: { textAlign: 'center' }, text: 'Oda sahibi başlatınca oyun kendiliğinden açılır.' }));
    }
    cl.stateCb = build;
    // sohbet
    cl.chatCb = function (s, t) { /* ui bağlanınca ezilir */ };
    build();
  });
};

/* ---------- Arkadaşlar / çevrimiçi merkezi ---------- */
App.hub = function (tab) {
  if (App.needName()) return;
  var sh;
  function friendsTab() {
    var d = h('div');
    function build() {
      KS.clear(d);
      var n = getNet();
      // gelen istekler
      var rq = Object.keys(n.reqs);
      if (rq.length) {
        d.appendChild(h('div', { class: 'grp', text: 'Gelen istekler (' + rq.length + ')' }));
        var rl = h('div', { class: 'list' });
        rq.forEach(function (id) {
          var r = n.reqs[id];
          rl.appendChild(h('div', { class: 'li' }, h('div', { class: 'av', text: r.a }), h('div', { class: 'tx' }, h('b', { text: r.n }), h('span', { text: 'Arkadaş olmak istiyor' })),
            h('div', { class: 'acts' }, h('button', { class: 'btn sm gold', text: 'Kabul', onclick: function () { n.accept(id); build(); } }),
              h('button', { class: 'btn sm', 'aria-label': 'Reddet', onclick: function () { n.decline(id); build(); } }, KS.ic('close')))));
        });
        d.appendChild(rl);
      }
      // arkadaşlar: çevrimiçi olanlar üstte
      var fr = n.friends(), ids = Object.keys(fr);
      ids.sort(function (x, y) {
        var px = n.presence[x] ? 1 : 0, py = n.presence[y] ? 1 : 0;
        if (px !== py) return py - px;
        return String(fr[x].n).localeCompare(String(fr[y].n), 'tr');
      });
      var onl = ids.filter(function (i) { return n.presence[i]; }).length;
      d.appendChild(h('div', { class: 'grp', text: 'Arkadaşlarım' + (ids.length ? ' · ' + onl + ' çevrimiçi' : '') }));
      if (!ids.length) d.appendChild(h('div', { class: 'empty', text: 'Henüz kimse yok. Aşağıdan arkadaşının kodunu yazarak ekleyebilirsin.' }));
      else {
        var fl = h('div', { class: 'list' });
        ids.forEach(function (id) {
          var p = n.presence[id], f = fr[id];
          var status = p ? (p.st === 'busy' ? 'Oyunda' : (p.room ? 'Odasında seni bekliyor' : 'Çevrimiçi')) : 'Çevrimdışı';
          var item = h('div', { class: 'li' + (p ? '' : ' off') },
            h('div', { class: 'av' }, (p && p.a) || f.a, h('i', { class: 'st ' + (p ? (p.st === 'busy' ? 'busy' : 'on') : '') })),
            h('div', { class: 'tx' }, h('b', { text: (p && p.n) || f.n || 'Oyuncu' }), h('span', { class: p ? (p.st === 'busy' ? 'busy' : 'on') : '', text: status })));
          var acts = h('div', { class: 'acts' });
          if (p && p.room && p.st !== 'busy') acts.appendChild(h('button', { class: 'btn sm gold', text: 'Katıl', onclick: function () { App.join(p.room); } }));
          acts.appendChild(h('button', { class: 'btn sm', 'aria-label': 'Arkadaşı sil', onclick: function () { KS.sheet('Arkadaşı sil?', h('p', { class: 'note', text: ((p && p.n) || f.n) + ' listenden çıkarılsın mı?' }), { buttons: [{ text: 'Vazgeç' }, { text: 'Sil', cls: 'red', fn: function () { n.removeFriend(id); build(); } }] }); } }, KS.ic('trash')));
          item.appendChild(acts);
          fl.appendChild(item);
        });
        d.appendChild(fl);
      }
      // bekleyen istekler
      var sent = Object.keys(n.sent || {}).filter(function (i) { return !n.friends()[i]; });
      if (sent.length) {
        d.appendChild(h('div', { class: 'grp', text: 'Yanıt bekleyenler' }));
        var sl = h('div', { class: 'list' });
        sent.forEach(function (id) {
          var p = n.presence[id];
          sl.appendChild(h('div', { class: 'li off' }, h('div', { class: 'av', text: p ? p.a : '⏳' }), h('div', { class: 'tx' }, h('b', { text: p ? p.n : 'Kod: ' + id }), h('span', { text: 'İstek gönderildi, kabul etmesi bekleniyor' })),
            h('div', { class: 'acts' }, h('button', { class: 'btn sm', 'aria-label': 'İsteği geri çek', onclick: function () { delete n.sent[id]; KS.lsSet('sent', n.sent); n.pub('ksl1/in/' + id + '/' + KS.S.id + '/req', '', { qos: 1, retain: true }); build(); } }, KS.ic('close')))));
        });
        d.appendChild(sl);
      }
      d.appendChild(h('div', { class: 'grp', text: 'Arkadaş ekle' }));
      var inp = h('input', { class: 'input', placeholder: 'Arkadaşının 8 harflik kodu', maxlength: 8, style: { textTransform: 'uppercase' }, autocapitalize: 'characters', autocomplete: 'off' });
      d.appendChild(h('div', { style: { display: 'flex', gap: '.5rem' } }, inp, h('button', { class: 'btn gold', text: 'Gönder', onclick: function () {
        App.connect(function (nn) {
          var r = nn.request(inp.value);
          if (r === 'ok') { KS.toast('İstek gönderildi', 'good'); inp.value = ''; build(); }
          else KS.toast(r === 'self' ? 'Bu senin kodun' : r === 'have' ? 'Zaten arkadaşsınız' : 'Kod 8 karakter olmalı', 'bad');
        });
      } })));
      d.appendChild(h('div', { class: 'grp', text: 'Benim arkadaş kodum' }));
      d.appendChild(h('div', { class: 'code', style: { fontSize: '1.5rem' }, text: KS.S.id }));
      d.appendChild(h('div', { style: { display: 'flex', gap: '.5rem' } },
        h('button', { class: 'btn sm block', onclick: function () { KS.copy(KS.S.id); KS.toast('Kod kopyalandı'); } }, KS.ic('copy'), 'Kopyala'),
        h('button', { class: 'btn sm block', onclick: function () { KS.share('Kart Salonu', 'Beni Kart Salonu\'nda arkadaş ekle: ' + KS.S.id, location.href.split('#')[0].split('?')[0] + '#f=' + KS.S.id); } }, KS.ic('share'), 'Paylaş')));
      d.appendChild(h('p', { class: 'note', text: 'Arkadaşlarının çevrimiçi görünmesi için bağlantı gerekir; bu sayfa açılınca otomatik bağlanır.' }));
    }
    App.refreshFriends = build;
    build();
    getNet().start().then(function () { if (App.refreshFriends === build) build(); }).catch(function () {});
    return d;
  }
  function joinTab() {
    var d = h('div');
    d.appendChild(h('div', { class: 'grp', text: 'Oda koduyla katıl' }));
    var inp = h('input', { class: 'input', placeholder: '5 harfli oda kodu', maxlength: 5, style: { textTransform: 'uppercase', textAlign: 'center', letterSpacing: '.3em', fontSize: '1.3rem' }, autocapitalize: 'characters', autocomplete: 'off' });
    d.appendChild(inp);
    d.appendChild(h('button', { class: 'btn gold block', style: { marginTop: '.6rem' }, text: 'Odaya gir', onclick: function () { App.join(inp.value); } }));
    d.appendChild(h('div', { class: 'grp', text: 'Açık masalar' }));
    var box = h('div', { class: 'list' });
    d.appendChild(box);
    function build() {
      KS.clear(box);
      var n = getNet(), t = n.tableList();
      if (!t.length) { box.appendChild(h('div', { class: 'empty', text: n.status === 'online' ? 'Şu an açık masa yok. Kendi masanı kurup "Açık masa"yı açabilirsin.' : 'Bağlanılıyor…' })); return; }
      t.forEach(function (x) {
        box.appendChild(h('div', { class: 'li' }, h('div', { class: 'av', text: x.a }), h('div', { class: 'tx' }, h('b', { text: (GAMES[x.g] ? GAMES[x.g].n : x.g) }), h('span', { text: x.h + ' · ' + x.f + '/' + x.n })),
          h('button', { class: 'btn sm gold', text: 'Katıl', onclick: function () { App.join(x.code); } })));
      });
    }
    App.refreshTables = build;
    build();
    getNet().start().then(function () { getNet().watchTables(true); build(); }).catch(function () { build(); });
    return d;
  }
  var tabs = [{ n: 'Arkadaşlar', f: friendsTab }, { n: 'Odaya gir', f: joinTab }];
  sh = KS.sheet('Çevrimiçi', null, { tabs: tabs, tab: tab === 'join' ? 1 : 0, wide: false, onclose: function () { App.refreshFriends = null; App.refreshTables = null; if (net) net.watchTables(false); }, ontab: function () { App.refreshTables = null; } });
};

/* ---------- Başlangıç ---------- */
App.init = function () {
  KS.loadSettings();
  KS.cards.init();
  KS.applySettings();
  App.size();
  root.addEventListener('resize', App.size);
  root.addEventListener('orientationchange', function () { setTimeout(App.size, 200); });
  if (root.visualViewport) root.visualViewport.addEventListener('resize', App.size);
  root.addEventListener('popstate', function () {
    if (KS.sheets.length) { KS.closeTop(); try { history.pushState({ g: 1 }, ''); } catch (e) {} return; }
    if (inGame && ui) { ui.leave('back'); try { history.pushState({ g: 1 }, ''); } catch (e) {} }
  });
  // sayfa kapanırken çevrimiçi odadan düzgün ayrıl
  root.addEventListener('pagehide', function () { if (client) try { client.leave(); } catch (e) {} });
  App.home();
  // bağlantı ile gelen istekler
  var hs = location.hash || '';
  var mo = hs.match(/o=([A-Za-z0-9]{5})/), mf = hs.match(/f=([A-Za-z0-9]{8})/);
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  if (mo) {
    var code = mo[1].toUpperCase();
    setTimeout(function () {
      KS.sheet('Odaya davet', h('div', null, h('div', { class: 'code', text: code }), h('p', { class: 'note', style: { textAlign: 'center' }, text: 'Bir arkadaşın seni masasına çağırıyor.' })), { buttons: [{ text: 'Vazgeç' }, { text: 'Katıl', cls: 'gold', fn: function () { App.join(code); } }] });
    }, 400);
  } else if (mf) {
    var fid = mf[1].toUpperCase();
    setTimeout(function () {
      if (fid === KS.S.id) return;
      KS.sheet('Arkadaş ekle', h('div', null, h('div', { class: 'code', text: fid }), h('p', { class: 'note', style: { textAlign: 'center' }, text: 'Bu kodu arkadaş olarak eklemek ister misin?' })), { buttons: [{ text: 'Vazgeç' }, { text: 'Ekle', cls: 'gold', fn: function () { App.connect(function (n) { var r = n.request(fid); KS.toast(r === 'ok' ? 'İstek gönderildi' : 'Eklenemedi', r === 'ok' ? 'good' : 'bad'); }); } }] });
    }, 400);
  }
  // arka planda arkadaş isteklerini yakalamak için sessizce bağlan
  if (KS.lsGet('friends', null) || Object.keys(KS.lsGet('reqs', {})).length || KS.lsGet('sent', null)) setTimeout(function () { getNet().start().catch(function () {}); }, 1500);
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(function () {});
};

if (typeof module !== 'undefined' && module.exports) module.exports = App;
})(typeof window !== 'undefined' ? window : globalThis);
