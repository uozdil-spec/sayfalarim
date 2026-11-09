/* Briç · uygulama: ana sayfa, kurulum, çevrimiçi akış */
(function (root) {
'use strict';
var BR = root.BR;
var h = BR.h;
var App = BR.App = {};

var GAMES = {
  bric: { n: 'Briç', min: 4, max: 4, d: 'Ortağınla birlikte ihale yap, sözleşmeni yap. Chicago usulü, 4 kişilik klasik briç.', fan: [BR.make(0, 1), BR.make(1, 13), BR.make(2, 12)], chips: ['4 kişi', 'Ortaklı'] }
};
var DEFCFG = {
  bric: { n: 4, deals: 4 }
};
App.GAMES = GAMES;

var net = null, ui = null, ctrl = null, cur = null, host = null, client = null;
var inGame = false;
function getNet() { if (!net) { net = new BR.Net(); wireNet(); } return net; }

function wireNet() {
  net.onToast = function (m, k) { BR.toast(m, k); };
  net.onInvite = function (inv) {
    BR.sfx('turn');
    var g = GAMES[inv.g] ? GAMES[inv.g].n : 'oyuna';
    var sh = BR.sheet('Davet', h('div', null, h('div', { class: 'big', text: inv.a + ' ' + inv.n }), h('p', { class: 'note', style: { textAlign: 'center' }, text: g + ' masasına seni çağırıyor.' })), {
      buttons: [{ text: 'Sonra' }, { text: 'Katıl', cls: 'gold', fn: function () { App.join(inv.code); } }]
    });
  };
  net.onRequest = function (id, r) {
    BR.sfx('pop');
    BR.toast(r.n + ' arkadaşlık isteği gönderdi', 'gold', 3500);
    if (App.refreshFriends) App.refreshFriends();
    App.badge();
  };
  net.onFriends = function () { if (App.refreshFriends) App.refreshFriends(); App.badge(); };
  net.onTables = function () { if (App.refreshTables) App.refreshTables(); };
}
App.badge = function () {
  var n = net ? Object.keys(net.reqs).length : Object.keys(BR.lsGet('reqs', {})).length;
  BR.$$('.fr-dot').forEach(function (d) { d.classList.toggle('on', n > 0); });
};

/* ---------- Ekran yönetimi ---------- */
function show(id) {
  BR.$$('.screen').forEach(function (s) { s.classList.toggle('on', s.id === id); });
}
App.size = function () {
  var app = BR.$('#app'), vh = root.innerHeight;
  document.documentElement.style.setProperty('--vh', vh + 'px');
  document.body.classList.toggle('land', root.innerWidth > vh * 1.05);
  BR.applySafe();
  if (BR.onLayout) BR.onLayout();
};

/* ---------- Ana sayfa ---------- */
App.home = function () {
  inGame = false;
  show('menu');
  BR.keepAwake(false); BR.awakeWanted = false;
  var m = BR.$('#menu'); BR.clear(m);
  var S = BR.S;
  var wrap = h('div', { class: 'home' });
  var top = h('div', { class: 'top' });
  if (BR.canFs()) top.appendChild(h('button', { class: 'btn ibtn', 'aria-label': 'Tam ekran', 'data-fs': '1', onclick: function () { BR.sfx('click'); BR.toggleFs(); } }, BR.ic(BR.isFs() ? 'shrink' : 'expand')));
  top.appendChild(h('button', { class: 'btn ibtn', 'aria-label': 'Kılavuz', onclick: function () { BR.sfx('click'); BR.helpSheet('basics'); } }, BR.ic('help')));
  top.appendChild(h('button', { class: 'btn ibtn', 'aria-label': 'Ayarlar', onclick: function () { BR.sfx('click'); BR.settingsSheet(); } }, BR.ic('gear')));
  wrap.appendChild(top);
  wrap.appendChild(h('div', { class: 'logo' },
    h('div', { class: 'suits', html: '♠ <span class="r">♥</span> <span class="r">♦</span> ♣' }),
    h('h1', { text: 'BRİÇ' }),
    h('div', { class: 'tag', text: 'İHALE · ORTAK · SÖZLEŞME' })));

  // devam et
  var save = BR.lsGet('save', null), hr = BR.lsGet('hostroom', null);
  if (hr && Date.now() - hr.ts > 6 * 3600000) { BR.lsDel('hostroom'); hr = null; }
  if (save && save.snap && save.snap.st && save.snap.st.phase === 'gameEnd') { BR.lsDel('save'); save = null; }
  if (save && save.snap) {
    wrap.appendChild(h('div', { class: 'resume' }, h('div', { class: 't' }, h('b', { text: 'Oyun yarım kaldı' }), (GAMES[save.snap.game] || {}).n + ' · ' + save.snap.seats.length + ' kişi'),
      h('button', { class: 'btn sm', text: 'Sil', onclick: function () { BR.lsDel('save'); App.home(); } }),
      h('button', { class: 'btn gold sm', text: 'Devam et', onclick: function () { BR.sfx('click'); App.resume(save); } })));
  } else if (hr && hr.snap) {
    wrap.appendChild(h('div', { class: 'resume' }, h('div', { class: 't' }, h('b', { text: 'Çevrimiçi oda sürüyor · ' + hr.code }), (GAMES[hr.game] || {}).n),
      h('button', { class: 'btn sm', text: 'Kapat', onclick: function () { BR.lsDel('hostroom'); App.home(); } }),
      h('button', { class: 'btn gold sm', text: 'Sürdür', onclick: function () { BR.sfx('click'); App.resumeHost(hr); } })));
  }

  var nm = h('input', { class: 'input', maxlength: 14, placeholder: 'Kullanıcı adın', value: S.name, 'aria-label': 'Kullanıcı adı', autocomplete: 'off' });
  nm.addEventListener('input', function () { S.name = BR.clean(nm.value, 14); BR.saveSettings(); });
  var avb = h('button', { class: 'avb', 'aria-label': 'Simge seç', text: S.av, onclick: function () {
    BR.sfx('click');
    var g = h('div', { class: 'avs' });
    var sh;
    BR.AVATARS.forEach(function (a) { g.appendChild(h('button', { class: S.av === a ? 'on' : '', text: a, onclick: function () { S.av = a; BR.saveSettings(); avb.textContent = a; sh.close(); if (net) net.publishPresence(); } })); });
    sh = BR.sheet('Simgeni seç', g);
  } });
  App.nameInput = nm;
  wrap.appendChild(h('div', { class: 'namebox' }, avb, h('div', { style: { flex: 1, minWidth: 0 } }, h('small', { text: 'Oyuncu adı' }), nm)));

  var games = h('div', { class: 'games' });
  Object.keys(GAMES).forEach(function (id) {
    var g = GAMES[id], fan = h('div', { class: 'fan' });
    g.fan.forEach(function (c, i) {
      var e = BR.cards.el(c); e.classList.add('static');
      e.style.cssText = 'position:absolute;left:' + (i * 1.7) + 'rem;top:' + (Math.abs(i - 1) * 0.35) + 'rem;transform:rotate(' + ((i - 1) * 11) + 'deg);transform-origin:50% 120%;--cw:3.1rem';
      fan.appendChild(e);
    });
    var meta = h('div', { class: 'meta' }); g.chips.forEach(function (c) { meta.appendChild(h('span', { class: 'chip', text: c })); });
    meta.appendChild(h('span', { class: 'chip ok', text: 'Çevrimiçi' }));
    games.appendChild(h('button', { class: 'gt', onclick: function () { BR.sfx('click'); App.setup(id); } }, fan, h('div', { style: { flex: 1, minWidth: 0 } }, h('h3', { text: g.n }), h('p', { text: g.d }), meta)));
  });
  wrap.appendChild(games);

  var m2 = h('div', { class: 'menu2' });
  var frb = h('button', { class: 'btn', onclick: function () { BR.sfx('click'); App.hub('friends'); } }, BR.ic('users'), 'Arkadaşlar', h('span', { class: 'fr-dot dot' }));
  frb.firstChild.nextSibling; frb.style.position = 'relative';
  m2.appendChild(frb);
  m2.appendChild(h('button', { class: 'btn', onclick: function () { BR.sfx('click'); App.hub('join'); } }, BR.ic('link'), 'Odaya gir'));
  m2.appendChild(h('button', { class: 'btn', onclick: function () { BR.sfx('click'); BR.helpSheet('basics'); } }, BR.ic('info'), 'Kılavuz'));
  m2.appendChild(h('button', { class: 'btn', onclick: function () { BR.sfx('click'); BR.settingsSheet(); } }, BR.ic('gear'), 'Ayarlar'));
  wrap.appendChild(m2);
  wrap.appendChild(h('div', { class: 'foot' }, h('div', { class: 'sign', text: 'by uozdil' }), h('small', { text: 'Kurulumsuz · cihazda çalışır' })));
  m.appendChild(wrap);
  var st = BR.$$('.fr-dot'); st.forEach(function (d) { d.style.cssText = 'position:absolute;top:.4rem;right:.5rem'; });
  App.badge();
  m.scrollTop = 0;
};

App.needName = function () {
  if (BR.clean(BR.S.name, 14)) return false;
  BR.toast('Önce bir kullanıcı adı yaz', 'gold', 2200);
  BR.closeAll();
  if (App.nameInput) { App.nameInput.focus(); try { App.nameInput.scrollIntoView({ block: 'center' }); } catch (e) {} }
  return true;
};
BR.closeAll = function () { while (BR.sheets.length) BR.sheets[BR.sheets.length - 1].close(true); };

/* ---------- Kurulum penceresi ---------- */
App.setup = function (id) {
  var G = GAMES[id], cfg = Object.assign({}, DEFCFG[id], BR.lsGet('cfg.' + id, {}));
  cfg.n = 4;
  var turnTime = BR.lsGet('turntime', 0);
  var body = h('div'), sh;
  function save() { BR.lsSet('cfg.' + id, cfg); }
  function segk(k, opts, after) {
    var box = h('div', { class: 'seg' });
    opts.forEach(function (o) {
      var b = h('button', { text: o[1], class: cfg[k] === o[0] ? 'on' : '', onclick: function () { BR.sfx('click'); cfg[k] = o[0]; save(); BR.$$('button', box).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); if (after) after(); } });
      box.appendChild(b);
    });
    return box;
  }
  function row(l, s, c) { return h('div', { class: 'row' }, h('div', { class: 'lb' }, h('b', { text: l }), s ? h('span', { text: s }) : null), c); }
  function build() {
    BR.clear(body);
    body.appendChild(h('p', { class: 'note', text: G.d }));
    body.appendChild(h('div', { class: 'grp', text: 'Masa' }));
    body.appendChild(h('p', { class: 'note', text: 'Sen Güney’sin; ortağın Kuzey. Batı ve Doğu rakip. Çevrimiçi kurarsan boş yerleri bilgisayar doldurur.' }));
    body.appendChild(h('div', { class: 'grp', text: 'Oyun uzunluğu' }));
    body.appendChild(row('El sayısı', '4 el kısa, 16 el uzun bir maç', segk('deals', [[4, '4'], [8, '8'], [12, '12'], [16, '16']])));
    body.appendChild(h('div', { class: 'grp', text: 'Bilgisayar' }));
    body.appendChild(row('Zorluk', null, (function () {
      var box = h('div', { class: 'seg' });
      [['easy', 'Kolay'], ['medium', 'Orta'], ['hard', 'Zor']].forEach(function (o) {
        var b = h('button', { text: o[1], class: BR.S.level === o[0] ? 'on' : '', onclick: function () { BR.sfx('click'); BR.S.level = o[0]; BR.saveSettings(); BR.$$('button', box).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); } });
        box.appendChild(b);
      });
      return box;
    })()));
    body.appendChild(h('div', { class: 'grp', text: 'Çevrimiçi' }));
    var tt = h('div', { class: 'seg' });
    [[0, 'Yok'], [20, '20 sn'], [40, '40 sn'], [60, '60 sn']].forEach(function (o) {
      var b = h('button', { text: o[1], class: turnTime === o[0] ? 'on' : '', onclick: function () { BR.sfx('click'); turnTime = o[0]; BR.lsSet('turntime', o[0]); BR.$$('button', tt).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); } });
      tt.appendChild(b);
    });
    body.appendChild(row('Hamle süresi', 'Süre dolunca bilgisayar oynar', tt));
    body.appendChild(h('div', { class: 'foot', style: { marginTop: '.6rem' } }, h('div', { class: 'sign', text: 'by uozdil' })));
  }
  build();
  sh = BR.sheet(G.n, body, { wide: false, buttons: [
    { text: 'Çevrimiçi oda kur', fn: function () { if (App.needName()) return false; var c = Object.assign({}, cfg); sh.close(); App.createRoom(id, c, turnTime); return false; }, keep: true },
    { text: 'Başla', cls: 'gold', fn: function () { if (App.needName()) return false; var c = Object.assign({}, cfg); sh.close(true); App.startLocal(id, c); return false; }, keep: true }
  ] });
};

function engineOpts(id, cfg) { return { deals: cfg.deals || 4 }; }

/* ---------- Yerel oyun ---------- */
App.startLocal = function (id, cfg) {
  var n = cfg.n, seats = [], used = {}, i, nm;
  seats.push({ name: BR.clean(BR.S.name, 14) || 'Ben', av: BR.S.av, human: true, pid: BR.S.id });
  for (i = 1; i < 4; i++) {
    do { nm = BR.pick(BR.BOT_NAMES || ['Bot']); } while (used[nm]);
    used[nm] = 1;
    seats.push({ name: nm, av: BR.pick(BR.AVATARS), human: false, level: BR.S.level });
  }
  var sess = new BR.Session({ game: id, seats: seats, opts: engineOpts(id, cfg) });
  sess.saver = function (s) {
    if (s.st.phase === 'gameEnd' || (s.st.over && s.st.phase === 'handEnd')) BR.lsDel('save');
    else BR.lsSet('save', { snap: s.snapshot(), cfg: cfg, ts: Date.now() });
  };
  cur = { mode: 'local', id: id, cfg: cfg };
  var c = new BR.LocalCtrl(sess, 0);
  App.showGame(c, function () { sess.start(); });
};
App.resume = function (save) {
  var s = save.snap;
  var sess = new BR.Session({ game: s.game, seats: s.seats, opts: s.opts, st: s.st, seq: s.seq, ready: s.ready });
  sess.seats[0].name = BR.clean(BR.S.name, 14) || sess.seats[0].name; sess.seats[0].av = BR.S.av;
  sess.saver = function (x) {
    if (x.st.phase === 'gameEnd' || (x.st.over && x.st.phase === 'handEnd')) BR.lsDel('save');
    else BR.lsSet('save', { snap: x.snapshot(), cfg: save.cfg, ts: Date.now() });
  };
  cur = { mode: 'local', id: s.game, cfg: save.cfg || DEFCFG[s.game] };
  var c = new BR.LocalCtrl(sess, 0);
  App.showGame(c, function () { sess.kick(); }, { noDeal: true });
};

/* ---------- Oyun ekranı ---------- */
App.showGame = function (c, afterShow, o) {
  o = o || {};
  if (ui) { try { ui.destroy(); } catch (e) {} ui = null; }
  ctrl = c; inGame = true;
  BR.closeAll();
  show('game');
  BR.awakeWanted = true; BR.keepAwake(true);
  if (BR.S.autofs && BR.canFs() && !BR.isFs()) BR.toggleFs();
  try { history.pushState({ g: 1 }, ''); } catch (e) {}
  App.size();
  ui = new BR.GameUI({
    ctrl: c, noDeal: o.noDeal,
    onExit: function (where) { App.exitGame(where); },
    onHelp: function (g) { BR.helpSheet(g); },
    onSettings: function () { BR.settingsSheet(1); }
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
  BR.lsDel('hostroom');
  App.home();
  if (where === 'back' && was && was.id && was.mode === 'local') App.setup(was.id);
  else if (where === 'back' && was && was.mode === 'online') App.hub('friends');
};

/* ---------- Çevrimiçi ---------- */
function netBusy(text) {
  var sh = BR.sheet('Çevrimiçi', h('div', { style: { textAlign: 'center', padding: '1rem 0' } }, h('span', { class: 'spin' }), h('p', { class: 'note', text: text || 'Bağlanılıyor…' })), { noclose: true, sticky: true });
  return sh;
}
App.connect = function (okFn) {
  var n = getNet(), busy = null;
  if (n.status === 'online' && n.cli && n.cli.connected) { okFn(n); return; }
  busy = netBusy('Bağlanılıyor…');
  n.start().then(function () { busy.close(true); okFn(n); }).catch(function () {
    busy.close(true);
    var errs = Object.keys(n.errors || {}).length;
    BR.sheet('Bağlanamadı', h('div', null, h('p', { class: 'note', text: 'İnternet bağlantını kontrol et ve tekrar dene. Ağın çevrimiçi oyun sunucularını engelliyor olabilir (iş/okul ağı).' })), {
      buttons: [{ text: 'Vazgeç' }, { text: 'Tekrar dene', cls: 'gold', fn: function () { App.connect(okFn); } }]
    });
  });
};

App.createRoom = function (id, cfg, turnTime) {
  App.connect(function (n) {
    host = new BR.RoomHost(n, { game: id, n: cfg.n, opts: engineOpts(id, cfg), turnTime: turnTime, level: BR.S.level, pub: false });
    cur = { mode: 'online', id: id, cfg: cfg };
    App.lobbyHost(host, cfg);
  });
};
App.lobbyHost = function (hst, cfg) {
  var body = h('div'), sh, code = hst.code;
  function build() {
    BR.clear(body);
    body.appendChild(h('div', { class: 'note', style: { textAlign: 'center' }, text: 'Oda kodu' }));
    body.appendChild(h('div', { class: 'code', text: code }));
    body.appendChild(h('div', { style: { display: 'flex', gap: '.5rem' } },
      h('button', { class: 'btn sm block', onclick: function () { BR.copy(code); BR.toast('Kod kopyalandı'); } }, BR.ic('copy'), 'Kodu kopyala'),
      h('button', { class: 'btn sm block', onclick: function () { BR.share('Briç', GAMES[hst.game].n + ' masama gel! Oda kodu: ' + code, hst.link()); } }, BR.ic('share'), 'Bağlantı paylaş')));
    body.appendChild(h('div', { class: 'grp', text: 'Masa' }));
    var list = h('div', { class: 'list' });
    hst.seats.forEach(function (s, i) {
      if (s.open) list.appendChild(h('div', { class: 'li open' }, h('div', { class: 'av', text: '＋' }), h('div', { class: 'tx' }, h('b', { text: 'Bekleniyor…' }), h('span', { text: 'Boş kalırsa bilgisayar oynar' }))));
      else list.appendChild(h('div', { class: 'li' }, h('div', { class: 'av', text: s.av }), h('div', { class: 'tx' }, h('b', { text: s.name + (i === 0 ? ' (sen)' : '') }), h('span', { text: i === 0 ? 'Oda sahibi' : 'Hazır' }))));
    });
    body.appendChild(list);
    body.appendChild(h('div', { class: 'row' }, h('div', { class: 'lb' }, h('b', { text: 'Açık masa' }), h('span', { text: 'Odan herkesin görebileceği listede yayınlanır' })),
      (function () { var b = h('button', { class: 'sw' + (hst.pub ? ' on' : ''), onclick: function () { hst.pub = !hst.pub; b.classList.toggle('on', hst.pub); hst.publishInfo(); if (!hst.pub) net.pub('brc1/t/' + code, '', { retain: true }); } }); return b; })()));
    // arkadaş daveti
    var fr = net.friends(), ids = Object.keys(fr);
    body.appendChild(h('div', { class: 'grp', text: 'Arkadaşları çağır' }));
    if (!ids.length) body.appendChild(h('div', { class: 'empty', text: 'Henüz arkadaşın yok. Arkadaşlar bölümünden kod ile ekleyebilirsin.' }));
    else {
      var fl = h('div', { class: 'list' });
      ids.forEach(function (fid) {
        var p = net.presence[fid], f = fr[fid];
        fl.appendChild(h('div', { class: 'li' }, h('div', { class: 'av' }, f.a, h('i', { class: 'st ' + (p ? (p.st === 'busy' ? 'busy' : 'on') : '') })), h('div', { class: 'tx' }, h('b', { text: f.n }), h('span', { text: p ? (p.st === 'busy' ? 'Oyunda' : 'Çevrimiçi') : 'Çevrimdışı' })),
          h('div', { class: 'acts' }, h('button', { class: 'btn sm', text: p ? 'Davet et' : 'Davet gönder', onclick: function (e) { net.invite(fid, code, hst.game); e.target.textContent = 'Gönderildi'; BR.sfx('pop'); } }))));
      });
      body.appendChild(fl);
    }
  }
  hst.lobbyCb = function () { build(); };
  App.refreshFriends = function () { build(); };
  build();
  sh = BR.sheet(GAMES[hst.game].n + ' · ' + cfg.n + ' kişi', body, { noclose: true, sticky: true, buttons: [
    { text: 'İptal', fn: function () { hst.close(); host = null; App.refreshFriends = null; } },
    { text: 'Başlat', cls: 'gold', fn: function () {
      App.refreshFriends = null;
      var sess = hst.start();
      var c = new BR.LocalCtrl(sess, 0, {
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
    host = new BR.RoomHost(n, { code: hr.code, game: hr.game, n: hr.n, opts: hr.opts, turnTime: hr.turnTime }, hr);
    var sess = host.sess;
    cur = { mode: 'online', id: hr.game, cfg: {} };
    var c = new BR.LocalCtrl(sess, 0, {
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
  if (code.length !== 5) { BR.toast('Oda kodu 5 karakter olmalı', 'bad'); return; }
  if (App.needName()) return;
  BR.closeAll();
  App.connect(function (n) {
    var cl = new BR.RoomClient(n, code), sh = null, started = false;
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
        sh = BR.sheet('Oda ' + code, h('div'), { noclose: true, sticky: true, buttons: [{ text: 'Ayrıl', fn: function () { cl.leave(); cl.destroy(); client = null; started = true; sh = null; App.home(); } }] });
      }
      var b = sh.body; BR.clear(b);
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
      BR.clear(d);
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
              h('button', { class: 'btn sm', 'aria-label': 'Reddet', onclick: function () { n.decline(id); build(); } }, BR.ic('close')))));
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
          acts.appendChild(h('button', { class: 'btn sm', 'aria-label': 'Arkadaşı sil', onclick: function () { BR.sheet('Arkadaşı sil?', h('p', { class: 'note', text: ((p && p.n) || f.n) + ' listenden çıkarılsın mı?' }), { buttons: [{ text: 'Vazgeç' }, { text: 'Sil', cls: 'red', fn: function () { n.removeFriend(id); build(); } }] }); } }, BR.ic('trash')));
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
            h('div', { class: 'acts' }, h('button', { class: 'btn sm', 'aria-label': 'İsteği geri çek', onclick: function () { delete n.sent[id]; BR.lsSet('sent', n.sent); n.pub('brc1/in/' + id + '/' + BR.S.id + '/req', '', { qos: 1, retain: true }); build(); } }, BR.ic('close')))));
        });
        d.appendChild(sl);
      }
      d.appendChild(h('div', { class: 'grp', text: 'Arkadaş ekle' }));
      var inp = h('input', { class: 'input', placeholder: 'Arkadaşının 8 harflik kodu', maxlength: 8, style: { textTransform: 'uppercase' }, autocapitalize: 'characters', autocomplete: 'off' });
      d.appendChild(h('div', { style: { display: 'flex', gap: '.5rem' } }, inp, h('button', { class: 'btn gold', text: 'Gönder', onclick: function () {
        App.connect(function (nn) {
          var r = nn.request(inp.value);
          if (r === 'ok') { BR.toast('İstek gönderildi', 'good'); inp.value = ''; build(); }
          else BR.toast(r === 'self' ? 'Bu senin kodun' : r === 'have' ? 'Zaten arkadaşsınız' : 'Kod 8 karakter olmalı', 'bad');
        });
      } })));
      d.appendChild(h('div', { class: 'grp', text: 'Benim arkadaş kodum' }));
      d.appendChild(h('div', { class: 'code', style: { fontSize: '1.5rem' }, text: BR.S.id }));
      d.appendChild(h('div', { style: { display: 'flex', gap: '.5rem' } },
        h('button', { class: 'btn sm block', onclick: function () { BR.copy(BR.S.id); BR.toast('Kod kopyalandı'); } }, BR.ic('copy'), 'Kopyala'),
        h('button', { class: 'btn sm block', onclick: function () { BR.share('Briç', 'Beni Briç\'nda arkadaş ekle: ' + BR.S.id, location.href.split('#')[0].split('?')[0] + '#f=' + BR.S.id); } }, BR.ic('share'), 'Paylaş')));
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
      BR.clear(box);
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
  sh = BR.sheet('Çevrimiçi', null, { tabs: tabs, tab: tab === 'join' ? 1 : 0, wide: false, onclose: function () { App.refreshFriends = null; App.refreshTables = null; if (net) net.watchTables(false); }, ontab: function () { App.refreshTables = null; } });
};

/* ---------- Başlangıç ---------- */
App.init = function () {
  BR.loadSettings();
  BR.cards.init();
  BR.applySettings();
  App.size();
  root.addEventListener('resize', App.size);
  root.addEventListener('orientationchange', function () { setTimeout(App.size, 200); });
  if (root.visualViewport) root.visualViewport.addEventListener('resize', App.size);
  root.addEventListener('popstate', function () {
    if (BR.sheets.length) { BR.closeTop(); try { history.pushState({ g: 1 }, ''); } catch (e) {} return; }
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
      BR.sheet('Odaya davet', h('div', null, h('div', { class: 'code', text: code }), h('p', { class: 'note', style: { textAlign: 'center' }, text: 'Bir arkadaşın seni masasına çağırıyor.' })), { buttons: [{ text: 'Vazgeç' }, { text: 'Katıl', cls: 'gold', fn: function () { App.join(code); } }] });
    }, 400);
  } else if (mf) {
    var fid = mf[1].toUpperCase();
    setTimeout(function () {
      if (fid === BR.S.id) return;
      BR.sheet('Arkadaş ekle', h('div', null, h('div', { class: 'code', text: fid }), h('p', { class: 'note', style: { textAlign: 'center' }, text: 'Bu kodu arkadaş olarak eklemek ister misin?' })), { buttons: [{ text: 'Vazgeç' }, { text: 'Ekle', cls: 'gold', fn: function () { App.connect(function (n) { var r = n.request(fid); BR.toast(r === 'ok' ? 'İstek gönderildi' : 'Eklenemedi', r === 'ok' ? 'good' : 'bad'); }); } }] });
    }, 400);
  }
  // arka planda arkadaş isteklerini yakalamak için sessizce bağlan
  if (BR.lsGet('friends', null) || Object.keys(BR.lsGet('reqs', {})).length || BR.lsGet('sent', null)) setTimeout(function () { getNet().start().catch(function () {}); }, 1500);
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(function () {});
};

if (typeof module !== 'undefined' && module.exports) module.exports = App;
})(typeof window !== 'undefined' ? window : globalThis);
