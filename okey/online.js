/* Okey — online: lobi, açık masalar, davet, oda, herkese açık sohbet. */
(function () {
'use strict';
var OK = window.OK, NetLib = window.OkeyNet, h = OK.h, $ = OK.$, clear = OK.clear, t = OK.t;
var O = OK.online = {};
var net = null, room = null, kind = '', roomInfo = null, tab = 'tables', lobbyMsgs = [], roomMsgs = [], unread = 0, chatApi = null;
var muted = OK.lsGet('muted', {});
var invSeen = {};

/* ---------- küfür süzgeci (yalnızca gelen mesajlar, ayardan kapatılabilir) ---------- */
var BAD = /(^|[^a-zçğıöşü0-9])(amk|aq|a\.q|mk|orospu|orosbu|piç|pic|siktir|sikeyim|sikerim|yarrak|yarak|amcık|amcik|göt\s?veren|gotveren|fuck|fucking|shit|bitch|asshole|dick|cunt)([^a-zçğıöşü0-9]|$)/gi;
function filterMsg(s) {
  if (!OK.S.filter) return s;
  return s.replace(BAD, function (m, a, w, b) { return a + new Array(w.length + 1).join('*') + b; });
}

/* ---------- kitaplık yükleme ---------- */
function loadLib() {
  return new Promise(function (resolve, reject) {
    if (window.mqtt) return resolve();
    var s = document.createElement('script');
    s.src = 'vendor/mqtt.min.js';
    s.onload = function () { window.mqtt ? resolve() : reject(new Error('lib')); };
    s.onerror = function () { reject(new Error('lib')); };
    document.head.appendChild(s);
  });
}
function myId() {
  var id = OK.lsGet('cid', null);
  if (!id) { id = NetLib.rid(10); OK.lsSet('cid', id); }
  return id;
}
function ensureName() {
  if (!OK.S.name) { OK.S.name = t('player') + ' ' + (100 + Math.floor(Math.random() * 900)); OK.save(); }
  return OK.S.name;
}

/* ---------- açılış / kapanış ---------- */
O.open = function (joinCode) {
  ensureName();
  OK.screen('online');
  renderShell();
  setBody(h('div', { class: 'empty' }, t('connecting')));
  setStatus('connecting');
  loadLib().then(function () {
    if (net && net.status === 'online') return;
    net = new NetLib.Net({ lib: window.mqtt, id: myId(), name: OK.S.name, av: OK.S.av });
    net.cb.status = function (s) { setStatus(s); };
    net.cb.players = function () { if (!room && tab === 'players') renderLobby(); else if (roomInfo && kind === 'host') renderRoom(); };
    net.cb.tables = function () { if (!room && tab === 'tables') renderLobby(); };
    net.cb.chat = function (m) { pushLobbyMsg(m); };
    net.cb.invite = onInvite;
    return net.connect();
  }).then(function () {
    renderLobby();
    if (joinCode) joinRoom(joinCode);
  }).catch(function (e) {
    setStatus('offline');
    setBody(h('div', { class: 'empty' }, h('div', { style: 'font-size:15px;margin-bottom:10px' }, e && e.message === 'lib' ? t('libFail') : t('connFail')),
      h('button', { class: 'btn gold', onclick: function () { net = null; O.open(joinCode); } }, t('retry'))));
  });
};
O.shutdown = function () {
  if (room) { try { room.leave(); } catch (e) {} room = null; }
  roomInfo = null; kind = '';
  if (net) { try { net.close(); } catch (e) {} net = null; }
  roomMsgs = []; unread = 0;
};
function leaveToMenu() { O.shutdown(); OK.renderMenu(); OK.screen('menu'); }

/* ---------- iskelet ---------- */
function setStatus(s) {
  var el = $('#onStatus'); if (!el) return;
  el.className = 'status ' + s;
  el.textContent = s === 'online' ? t('stOnline') : s === 'connecting' ? t('stConnecting') : t('stOffline');
}
function renderShell() {
  var on = clear($('#online'));
  on.className = 'screen on bgfelt';
  on.appendChild(h('div', { class: 'topbar' },
    h('button', { class: 'btn iconbtn', 'aria-label': t('back'), onclick: function () { if (room) leaveRoomAsk(); else leaveToMenu(); } }, OK.icon('back')),
    h('h2', null, t('playOnline')),
    h('span', { class: 'status connecting', id: 'onStatus' }),
    h('button', { class: 'btn sm', id: 'onProf', onclick: editProfile }, OK.S.av + ' ' + OK.S.name)));
  on.appendChild(h('div', { class: 'pane', id: 'onPane' }));
}
function setBody(node) {
  var pane = clear($('#onPane'));
  pane.appendChild(node);
}
function editProfile() {
  var name = OK.S.name, av = OK.S.av;
  var inp = h('input', { class: 'txt', maxlength: 14, value: name, oninput: function (e) { name = e.target.value; } });
  var avs = h('div', { class: 'avs' });
  function drawAv() { clear(avs); OK.AVATARS.forEach(function (a) { avs.appendChild(h('button', { class: a === av ? 'on' : '', onclick: function () { av = a; drawAv(); } }, a)); }); }
  drawAv();
  OK.modal({ title: t('profile'), body: h('div', null, h('div', { class: 'sec' }, h('div', { class: 'lbl' }, t('s_name')), inp), h('div', { class: 'sec' }, h('div', { class: 'lbl' }, t('s_avatar')), avs)),
    buttons: [{ label: t('cancel') }, { label: t('ok'), cls: 'gold', onclick: function () {
      OK.S.name = NetLib.clean(name, 14) || OK.S.name; OK.S.av = av; OK.save();
      if (net) net.setProfile(OK.S.name, OK.S.av);
      var b = $('#onProf'); if (b) b.textContent = OK.S.av + ' ' + OK.S.name;
    } }] });
}

/* ---------- lobi ---------- */
function modeText(c) {
  if (!c) return '';
  return (c.p ? t('partnerShort') + ' · ' : '') + OK.modeName(c.ty, c.v);
}
function renderLobby() {
  if (room) return renderRoom();
  var pane = $('#onPane'); if (!pane) return;
  var tabs = h('div', { class: 'tabs' });
  [['tables', t('tTables')], ['players', t('tPlayers') + ' (' + (net ? net.players().length : 0) + ')'], ['chat', t('tChat')]].forEach(function (o) {
    tabs.appendChild(h('button', { class: tab === o[0] ? 'on' : '', onclick: function () { tab = o[0]; renderLobby(); } }, o[1]));
  });
  var body = h('div', { class: 'panebody' + (tab === 'chat' ? ' fix' : '') });
  if (tab === 'tables') {
    var codeIn = h('input', { class: 'txt', maxlength: 6, placeholder: t('roomCode'), style: 'text-transform:uppercase;letter-spacing:.2em;text-align:center;max-width:150px' });
    body.appendChild(h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;justify-content:flex-start;border:0' },
      h('button', { class: 'btn gold', onclick: createRoomDialog }, OK.icon('plus'), t('createTable')),
      codeIn,
      h('button', { class: 'btn', onclick: function () { var c = codeIn.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length >= 4) joinRoom(c); else OK.toast(t('codeShort')); } }, t('joinByCode'))));
    var list = h('div', { class: 'list' }), tl = net ? net.tableList().filter(function (x) { return x.hid !== net.id; }) : [];
    if (!tl.length) list.appendChild(h('div', { class: 'empty' }, t('noTables')));
    tl.forEach(function (tb) {
      list.appendChild(h('div', { class: 'item' }, h('div', { class: 'av' }, tb.a || '🙂'),
        h('div', { class: 'tx' }, h('b', null, t('tableOf', tb.h)), h('span', null, modeText(tb.c) + ' · ' + tb.f + '/4')),
        h('button', { class: 'btn gold', onclick: function () { joinRoom(tb.code); } }, t('join'))));
    });
    body.appendChild(list);
  } else if (tab === 'players') {
    var pl = net ? net.players() : [], list2 = h('div', { class: 'list' });
    if (!pl.length) list2.appendChild(h('div', { class: 'empty' }, t('noPlayers')));
    pl.forEach(function (p) {
      list2.appendChild(h('div', { class: 'item' }, h('div', { class: 'av' }, p.a || '🙂'),
        h('div', { class: 'tx' }, h('b', null, p.n), h('span', null, p.s === 'idle' ? t('psIdle') : p.s === 'table' ? t('psTable') : t('psPlaying')))));
    });
    body.appendChild(h('div', { class: 'hint', style: 'margin-bottom:8px' }, t('playersHint')));
    body.appendChild(list2);
  } else {
    var cp = chatPanel({ msgs: lobbyMsgs, onSend: function (txt) { return net && net.sendLobbyChat(txt); }, quick: false, onApi: function (a) { chatApi = a; } });
    body.appendChild(cp);
  }
  var wrap = h('div', { style: 'display:flex;flex-direction:column;flex:1;min-height:0' }, tabs, body);
  setBody(wrap);
}

/* ---------- sohbet bileşeni ---------- */
function chatPanel(o) {
  var box = h('div', { class: 'chat' });
  var msgs = h('div', { class: 'msgs' });
  var api = {};
  function line(m) {
    if (m.sys) return h('div', { class: 'msg sys' }, m.m);
    var isMe = net && m.id === net.id, mu = muted[m.id];
    var nm = h('b', { onclick: function () {
      if (isMe || !m.id) return;
      if (muted[m.id]) delete muted[m.id]; else muted[m.id] = 1;
      OK.lsSet('muted', muted); OK.toast(muted[m.id] ? t('mutedUser', m.n) : t('unmutedUser', m.n)); api.render();
    } }, m.n + ': ');
    var txt = h('span', { class: m.e ? 'emo' : '' }, mu ? t('mutedMsg') : filterMsg(m.m));
    return h('div', { class: 'msg' + (isMe ? ' me' : '') + (mu ? ' muted' : '') }, nm, txt);
  }
  api.render = function () {
    var atEnd = msgs.scrollTop + msgs.clientHeight >= msgs.scrollHeight - 30;
    clear(msgs);
    var arr = o.msgs;
    if (!arr.length) msgs.appendChild(h('div', { class: 'msg sys' }, t('chatEmpty')));
    arr.slice(-80).forEach(function (m) { msgs.appendChild(line(m)); });
    if (atEnd) msgs.scrollTop = msgs.scrollHeight;
  };
  box.appendChild(msgs);
  if (o.quick) {
    var q = h('div', { class: 'quick' });
    ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].forEach(function (k) { q.appendChild(h('button', { onclick: function () { o.onSend(t(k)); } }, t(k))); });
    ['😀', '😮', '😂', '😡', '👍', '🎉'].forEach(function (e) { q.appendChild(h('button', { style: 'font-size:18px', onclick: function () { o.onSend(e, true); } }, e)); });
    box.appendChild(q);
  }
  var inp = h('input', { class: 'txt', maxlength: 160, placeholder: t('chatPh'), onkeydown: function (e) { if (e.key === 'Enter') send(); } });
  function send() { var v = inp.value.trim(); if (!v) return; var r = o.onSend(v); if (r === false) { OK.toast(t('slowDown')); return; } inp.value = ''; }
  box.appendChild(h('div', { class: 'chatin' }, inp, h('button', { class: 'btn iconbtn', onclick: send, 'aria-label': t('send') }, OK.icon('send'))));
  box.appendChild(h('div', { class: 'hint', style: 'margin-top:6px' }, t('chatRules')));
  api.render();
  if (o.onApi) o.onApi(api);
  return box;
}
function pushLobbyMsg(m) {
  lobbyMsgs.push(m); if (lobbyMsgs.length > 120) lobbyMsgs.shift();
  if (!room && tab === 'chat' && chatApi) chatApi.render();
}
O.onRoomChat = function (m) {
  if (muted[m.id]) return;
  roomMsgs.push(m); if (roomMsgs.length > 120) roomMsgs.shift();
  var open = O.chatOpen && O.chatOpen.render;
  if (open) O.chatOpen.render(); else if (net && m.id !== net.id) { unread++; var d = $('#chatDot'); if (d) d.classList.add('on'); OK.sfx('msg'); }
  if (roomInfo && roomInfo.state === 'lobby' && O.roomChatApi) O.roomChatApi.render();
  bubble(m);
};
function bubble(m) {
  var felt = $('#felt'), G = OK.game.st;
  if (!felt || OK.cur !== 'game' || m.s === undefined || m.s < 0 || isNaN(m.s)) return;
  var vp = (m.s - G.me + 4) % 4, plate = vp === 0 ? $('#mine .plate') : $('#seat' + vp + ' .plate');
  if (!plate) return;
  var r = plate.getBoundingClientRect(), fr = felt.getBoundingClientRect();
  var b = h('div', { class: 'bubble' }, m.e ? h('span', { style: 'font-size:26px' }, filterMsg(m.m)) : filterMsg(m.m));
  felt.appendChild(b);
  var left = Math.min(fr.width - 170, Math.max(4, r.left - fr.left + r.width / 2 - 60));
  b.style.left = left + 'px';
  b.style.top = Math.max(4, vp === 0 ? r.top - fr.top - 40 : r.bottom - fr.top + 6) + 'px';
  setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 3400);
}
OK.openChat = function () {
  unread = 0; var d = $('#chatDot'); if (d) d.classList.remove('on');
  var panel = chatPanel({ msgs: roomMsgs, quick: true, onSend: function (txt, emo) { return room ? room.sendChat(txt, emo) : false; }, onApi: function (a) { O.chatOpen = a; } });
  panel.style.height = 'min(70vh, 420px)';
  OK.modal({ title: t('tChat'), body: panel, onclose: function () { O.chatOpen = null; } });
};

/* ---------- davet ---------- */
function onInvite(inv) {
  var k = inv.id + inv.code;
  if (invSeen[k] && Date.now() - invSeen[k] < 20000) return;
  invSeen[k] = Date.now();
  if (room || OK.cur === 'game' || muted[inv.id]) return;
  OK.sfx('turn');
  var el = h('div', { class: 'toast inv' }, h('span', null, inv.a + ' ' + t('invited', inv.n)),
    h('button', { class: 'btn gold', onclick: function () { rm(); joinRoom(inv.code); } }, t('join')),
    h('button', { class: 'btn', onclick: function () { rm(); } }, t('decline')));
  function rm() { if (el.parentNode) el.parentNode.removeChild(el); }
  $('#toasts').appendChild(el);
  setTimeout(rm, 20000);
}

/* ---------- oda kurma ---------- */
function createRoomDialog() {
  var last = OK.lsGet('lastonline', { cfg: { type: 'single', value: 0, partner: false }, pub: true, turn: 45, level: 'medium' });
  var cfg = last.cfg, pub = last.pub !== false, turn = last.turn, level = last.level;
  var extra = h('div');
  function drawExtra() {
    clear(extra);
    function seg(opts, cur, cb) { var s = h('div', { class: 'seg full' }); opts.forEach(function (o) { s.appendChild(h('button', { class: cur === o[0] ? 'on' : '', onclick: function () { cb(o[0]); drawExtra(); } }, o[1])); }); return s; }
    extra.appendChild(h('div', { class: 'sec' }, h('div', { class: 'lbl' }, t('turnTime')), seg([[0, t('unlimited')], [30, '30 ' + t('sec')], [45, '45 ' + t('sec')], [60, '60 ' + t('sec')]], turn, function (v) { turn = v; })));
    extra.appendChild(h('div', { class: 'sec' }, h('div', { class: 'lbl' }, t('botLevel')), seg([['easy', t('easy')], ['medium', t('medium')], ['hard', t('hard')]], level, function (v) { level = v; })));
    extra.appendChild(h('div', { class: 'row' }, h('div', null, h('div', { class: 't' }, t('publicTable')), h('div', { class: 's' }, t('publicHint'))),
      h('button', { class: 'sw' + (pub ? ' on' : ''), onclick: function () { pub = !pub; drawExtra(); } })));
  }
  drawExtra();
  OK.modal({ title: t('createTable'), body: h('div', null, OK.cfgControls(cfg), extra), buttons: [
    { label: t('cancel') },
    { label: t('create'), cls: 'gold', onclick: function () {
      OK.lsSet('lastonline', { cfg: cfg, pub: pub, turn: turn, level: level });
      makeRoom({ type: cfg.type, value: cfg.type === 'single' ? 0 : cfg.value, partner: !!cfg.partner }, pub, turn, level);
    } }] });
}
function makeRoom(cfg, pub, turn, level) {
  if (!net || net.status !== 'online') { OK.toast(t('connFail')); return; }
  var speed = { fast: 0.55, normal: 1, slow: 1.7 }[OK.S.speed] || 1;
  var host = new NetLib.RoomHost(net, { cfg: cfg, pub: pub, turnTime: turn, level: level, speed: speed });
  room = host; kind = 'host'; roomMsgs = []; unread = 0;
  roomInfo = host.info();
  host.cb.lobby = function (inf) { roomInfo = inf; if (OK.cur === 'online') renderRoom(); };
  host.cb.chat = function (m) { O.onRoomChat(m); };
  host.cb.notice = function (n) { if (n.t === 'left') { OK.toast(t('playerLeft', n.name)); roomMsgs.push({ sys: true, m: t('playerLeft', n.name) }); if (O.chatOpen) O.chatOpen.render(); } };
  host.cb.game = function (view, ev, meta, seat) { enterGame(view, ev, meta, seat); };
  host.cb.closed = function () {};
  OK.sfx('tile');
  renderRoom();
}
/* ---------- odaya katılma ---------- */
function joinRoom(code) {
  if (!net || net.status !== 'online') { OK.toast(t('connFail')); return; }
  if (room) return;
  code = code.toUpperCase();
  var rc = new NetLib.RoomClient(net, code);
  room = rc; kind = 'client'; roomMsgs = []; unread = 0; roomInfo = null;
  OK.toast(t('joining'));
  rc.cb.lobby = function (inf) { roomInfo = inf; if (OK.cur === 'online') renderRoom(); };
  rc.cb.chat = function (m) { O.onRoomChat(m); };
  rc.cb.game = function (view, ev, meta, seat) { enterGame(view, ev, meta, seat); };
  rc.cb.closed = function (why) {
    var wasGame = OK.cur === 'game';
    room = null; roomInfo = null; kind = '';
    OK.toast(why === 'kick' ? t('kicked') : why === 'timeout' ? t('connLost') : t('hostLeft'), 3500);
    if (wasGame) { OK.game.st.ctrl = null; OK.game.exit(false); OK.screen('online'); renderShell(); setStatus(net ? net.status : 'offline'); renderLobby(); }
    else { OK.screen('online'); renderShell(); setStatus(net ? net.status : 'offline'); renderLobby(); }
  };
  rc.join().then(function () {
    OK.sfx('tile'); renderRoom();
  }).catch(function (e) {
    room = null; roomInfo = null; kind = '';
    try { rc.cleanup(); } catch (x) {}
    OK.toast(e && e.message === 'full' ? t('tableFull') : t('tableNotFound'), 3200);
    if (net) net.setState('idle');
    renderLobby();
  });
}
if (typeof window !== 'undefined') window.addEventListener('online', function () { if (room && room.rejoin) room.rejoin(); });

/* ---------- oda görünümü ---------- */
function leaveRoomAsk() {
  OK.confirm(kind === 'host' ? t('closeTableAsk') : t('leaveTableAsk'), t('yes'), t('no'), function () {
    if (room) { try { room.leave(); } catch (e) {} }
    room = null; roomInfo = null; kind = '';
    if (net) net.setState('idle');
    renderLobby();
  });
}
function seatCard(i, s) {
  var open = s.kind === 'open', lab = '';
  if (i === 0) lab = t('host');
  else if (s.kind === 'remote') lab = (room && room.seat === i) ? t('you') : t('human');
  else if (s.kind === 'bot') lab = t('computer');
  var card = h('div', { class: 'item seatcard' + (open ? ' open' : '') },
    h('div', { class: 'av' }, open ? '＋' : (s.av || '🙂')),
    h('div', { class: 'tx' }, h('b', null, open ? t('emptySeat') : s.name), h('span', null, lab + (roomInfo && roomInfo.cfg && roomInfo.cfg.partner ? ' · ' + (i % 2 === 0 ? t('teamA') : t('teamB')) : ''))));
  if (kind === 'host') {
    if (open) {
      card.appendChild(h('button', { class: 'btn sm', onclick: function () { invitePicker(); } }, t('invite')));
      card.appendChild(h('button', { class: 'btn sm', onclick: function () { room.setBot(i, true); } }, '🤖'));
    } else if (s.kind === 'bot') card.appendChild(h('button', { class: 'btn sm', onclick: function () { room.setBot(i, false); } }, t('remove')));
    else if (s.kind === 'remote') card.appendChild(h('button', { class: 'btn sm', onclick: function () { room.kick(i); } }, t('kick')));
  }
  return card;
}
function renderRoom() {
  var pane = $('#onPane'); if (!pane || !room || !roomInfo) return;
  var inf = roomInfo, c = inf.cfg;
  var left = h('div', { style: 'display:flex;flex-direction:column;gap:10px;min-width:0' });
  left.appendChild(h('div', { class: 'codebox' }, inf.code));
  left.appendChild(h('div', { class: 'chips', style: 'justify-content:center' },
    h('span', { class: 'chip' }, (c.partner ? '♥ ' + t('partnerShort') + ' · ' : '') + OK.modeName(c.type, c.value)),
    h('span', { class: 'chip' }, inf.turnTime ? inf.turnTime + ' ' + t('sec') : t('unlimited')),
    h('span', { class: 'chip' }, inf.pub ? t('publicShort') : t('privateShort'))));
  var seats = h('div', { class: 'list' });
  inf.seats.forEach(function (s, i) { seats.appendChild(seatCard(i, s)); });
  left.appendChild(seats);
  var acts = h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' });
  acts.appendChild(h('button', { class: 'btn', style: 'flex:1', onclick: shareCode }, OK.icon('link'), t('share')));
  if (kind === 'host') {
    acts.appendChild(h('button', { class: 'btn', style: 'flex:1', onclick: invitePicker }, OK.icon('user'), t('invite')));
    left.appendChild(acts);
    left.appendChild(h('button', { class: 'btn gold', onclick: function () { room.start(); } }, OK.icon('play'), t('startGame')));
    left.appendChild(h('div', { class: 'hint' }, t('startHint')));
  } else {
    left.appendChild(acts);
    left.appendChild(h('div', { class: 'empty', style: 'padding:10px' }, t('waitingHost')));
  }
  left.appendChild(h('button', { class: 'btn sm', onclick: leaveRoomAsk }, t(kind === 'host' ? 'closeTable' : 'leaveTable')));
  var right = chatPanel({ msgs: roomMsgs, quick: false, onSend: function (txt) { return room.sendChat(txt); }, onApi: function (a) { O.roomChatApi = a; } });
  right.style.minHeight = '220px';
  var body = h('div', { class: 'panebody' }, h('div', { class: 'cols2' }, left, right));
  setBody(body);
}
function shareCode() {
  var url = location.origin + location.pathname + '?oda=' + roomInfo.code;
  var text = t('shareText', roomInfo.code);
  if (navigator.share) { navigator.share({ title: 'Okey', text: text, url: url }).catch(function () {}); return; }
  try { navigator.clipboard.writeText(text + ' ' + url).then(function () { OK.toast(t('copied')); }, function () { OK.toast(url, 5000); }); }
  catch (e) { OK.toast(url, 5000); }
}
function invitePicker() {
  if (kind !== 'host' || !net) return;
  var sent = {};
  var body = h('div');
  function draw() {
    clear(body);
    var pl = net.players().filter(function (p) { return p.s === 'idle'; });
    body.appendChild(h('div', { class: 'hint', style: 'margin-bottom:8px' }, t('inviteHint')));
    var list = h('div', { class: 'list' });
    if (!pl.length) list.appendChild(h('div', { class: 'empty' }, t('noPlayers')));
    pl.forEach(function (p) {
      list.appendChild(h('div', { class: 'item' }, h('div', { class: 'av' }, p.a), h('div', { class: 'tx' }, h('b', null, p.n)),
        h('button', { class: 'btn sm' + (sent[p.id] ? ' dis' : ' gold'), onclick: function () { room.invite(p.id); sent[p.id] = 1; OK.toast(t('inviteSent', p.n)); draw(); } }, sent[p.id] ? t('sent') : t('invite'))));
    });
    body.appendChild(list);
  }
  draw();
  var tick = setInterval(draw, 4000);
  OK.modal({ title: t('invitePlayers'), body: body, onclose: function () { clearInterval(tick); }, buttons: [{ label: t('ok'), cls: 'gold' }] });
}

/* ---------- oyuna geçiş ---------- */
function enterGame(view, ev, meta, seat) {
  if (OK.cur !== 'game') {
    var ctrl;
    if (kind === 'host') ctrl = { act: function (a) { return room.act(a); }, ready: function () { room.localReady(); }, rematch: function () { room.rematch(); }, leave: function () { var r = room; room = null; roomInfo = null; kind = ''; try { r.leave(); } catch (e) {} O.shutdown(); }, sync: function () {} };
    else ctrl = { act: function (a) { room.act(a); return true; }, ready: function () { room.ready(); }, leave: function () { var r = room; room = null; roomInfo = null; kind = ''; try { r.leave(); } catch (e) {} O.shutdown(); }, sync: function () { room.sync(); } };
    OK.game.attachOnline(ctrl, kind, seat, view.cfg);
  }
  OK.game.onUpdate(view, ev, meta, seat);
}
})();
