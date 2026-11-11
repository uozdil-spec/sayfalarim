/* Gizli Kelime · çevrimiçi katman (PeerJS / WebRTC): arkadaşlar, davet, lobi, sohbet, kopma koruması  (by uozdil)
   Oyun "ev sahibi" cihazda çalışır (2-4 kişi). Konuklar yalnızca kendilerine gönderilen görünümü çizer; gizli kelime tur bitene kadar ev sahibinde kalır.
   Kopma koruması: kalp atışı, otomatik yeniden bağlanma, kopan koltuğa bot, geri gelince koltuğu geri alma. */
(function (root) {
'use strict';
var GK = root.GK, $ = GK.$, S = GK.S, esc = GK.esc, UI = GK.UI, saveS = GK.saveS, toast = GK.toast;
var openSheet = GK.openSheet, closeSheet = GK.closeSheet, seg = GK.seg;
var PFX = 'uozdil-gizli-';
var ICE = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }, {urls:['turn:eu-0.turn.peerjs.com:3478','turn:us-0.turn.peerjs.com:3478'],username:'peerjs',credential:'peerjsp'}, { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }];
var ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
var QUICK = ['Merhaba 👋', 'İyi oyunlar!', 'Güzel tahmin 👏', 'Bir oyun daha?', 'Çok zormuş 😅', 'Teşekkürler'];
GK.QUICK = QUICK;
var BOTN = ['Tekin', 'Pınar', 'Deniz', 'Kaan', 'Elif', 'Mert', 'Selin', 'Arda'];
GK.BOTN = BOTN;

var Net = GK.Net = { peer: null, starting: false, ready: false, pstat: '', retry: 0, pres: {}, poll: null,
  role: null, room: null, hc: null, hostUid: '', hostName: '', lastRx: 0, hb: null, chat: [], unread: 0, inv: null, q: [], lobbyNames: null, lobbyCfg: null, mySeat: -1, rtry: null };
GK.hooks = GK.hooks || {};
var H = GK.hooks;

function newUid() { var c = '', i; for (i = 0; i < 6; i++) c += ALPH.charAt(GK.rnd(ALPH.length)); return c; }
function ensureUid() { if (!S.uid || !/^[A-Z0-9]{6}$/.test(S.uid)) { S.uid = newUid(); saveS(); } }
function cleanCode(v) { return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); }
function pid(id) { return PFX + 'u-' + id; }
function findFr(id) { for (var i = 0; i < S.friends.length; i++) if (S.friends[i].id === id) return S.friends[i]; return null; }
function addFr(id, name) {
  id = cleanCode(id); if (id.length !== 6 || id === S.uid) return null;
  var f = findFr(id);
  if (f) { if (name && f.name !== name) { f.name = name; saveS(); } return f; }
  if (S.friends.length >= 24) { toast('Arkadaş listesi dolu'); return null; }
  f = { id: id, name: name || 'Arkadaş' }; S.friends.push(f); saveS(); return f;
}
GK.cleanCode = cleanCode; GK.ensureUid = ensureUid; GK.findFr = findFr; GK.addFr = addFr;

function netLoad(cb, fail) {
  if (root.Peer) return cb();
  var urls = ['../kafes-dovusu/vendor/peerjs.min.js', 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'], i = 0;
  (function next() {
    if (i >= urls.length) return fail();
    var s = document.createElement('script'); s.src = urls[i++];
    s.onload = function () { root.Peer ? cb() : next(); }; s.onerror = next; document.head.appendChild(s);
  })();
}
function setOnl(html) { var el = $('#onlMsg'); if (el) el.innerHTML = html; }
GK.setOnl = setOnl;

/* ---------- kendi kimliğimiz: uygulama açıkken davet alabilmek için ---------- */
function presStart() {
  ensureUid();
  if (Net.peer || Net.starting) return;
  Net.starting = true; Net.pstat = 'conn'; refreshOnl();
  if (!S.onl) { S.onl = true; saveS(); }
  netLoad(function () {
    var pr;
    try { pr = new root.Peer(pid(S.uid), { debug: 0, config: { iceServers: ICE } }); } catch (e) { Net.starting = false; Net.pstat = 'bad'; refreshOnl(); return; }
    Net.peer = pr; Net.starting = false;
    pr.on('open', function () { Net.ready = true; Net.pstat = 'ok'; Net.retry = 0; refreshOnl(); if (UI.onl || UI.lobby) pollNow(); });
    pr.on('connection', onIncoming);
    pr.on('disconnected', function () {
      Net.ready = false; if (Net.peer !== pr) return; Net.pstat = 'conn'; refreshOnl();
      setTimeout(function () { try { if (Net.peer === pr && !pr.destroyed) pr.reconnect(); } catch (e) {} }, 2500);
    });
    pr.on('close', function () { if (Net.peer === pr) { Net.peer = null; Net.ready = false; Net.pstat = 'bad'; refreshOnl(); } });
    pr.on('error', function (e) {
      var ty = e && e.type, msg = String((e && e.message) || '');
      if (ty === 'peer-unavailable') { peerGone(msg); return; }
      if (ty === 'unavailable-id') {
        if (Net.peer === pr) { Net.peer = null; Net.ready = false; }
        try { pr.destroy(); } catch (x) {}
        if (Net.retry < 6) { Net.retry++; Net.pstat = 'conn'; refreshOnl(); setTimeout(presStart, 3000); }
        else { Net.pstat = 'dup'; refreshOnl(); }
        return;
      }
      if (ty === 'network' || ty === 'server-error' || ty === 'socket-error' || ty === 'socket-closed') { Net.ready = false; Net.pstat = 'bad'; refreshOnl(); }
    });
  }, function () { Net.starting = false; Net.pstat = 'bad'; refreshOnl(); });
}
GK.presStart = presStart;
GK.netRetry = function () {
  Net.retry = 0;
  if (Net.peer) { var p = Net.peer; Net.peer = null; try { p.destroy(); } catch (e) {} }
  Net.starting = false; Net.ready = false; presStart();
};
function peerGone(msg) {
  var m = /u-([A-Z0-9]{6})/.exec(msg), id = m && m[1];
  if (!id) return;
  delete Net.pres[id];
  if (Net.pendInv && Net.pendInv[id]) { delete Net.pendInv[id]; setLobbyNote((findFr(id) ? findFr(id).name : 'Arkadaşın') + ' şu an çevrimdışı görünüyor.'); }
  if (Net.rtry && Net.hostUid === id) { /* yeniden bağlanma denemesi sürüyor */ }
  refreshFr();
}

/* ---------- arkadaş durumu (ping / pong) ---------- */
var pingT = {};
function pingFr(id) {
  if (!Net.peer || !Net.ready || pingT[id]) return;
  var c, done = false;
  try { c = Net.peer.connect(pid(id), { reliable: true }); } catch (e) { return; }
  function fin() { if (done) return; done = true; if (pingT[id]) { clearTimeout(pingT[id]); delete pingT[id]; } try { c.close(); } catch (e) {} }
  pingT[id] = setTimeout(function () { if (done) return; delete Net.pres[id]; fin(); refreshFr(); }, 7000);
  c.on('open', function () { try { c.send({ t: 'ping', name: S.name || '', uid: S.uid }); } catch (e) {} });
  c.on('data', function (d) {
    if (d && d.t === 'pong') {
      Net.pres[id] = { t: Date.now(), busy: !!d.busy };
      var f = findFr(id), nm = String(d.name || '').slice(0, 14);
      if (f && nm && f.name !== nm) { f.name = nm; saveS(); }
      fin(); refreshFr();
    }
  });
  c.on('error', function () { fin(); });
}
GK.pingFr = pingFr;
function pollNow() { S.friends.forEach(function (f) { pingFr(f.id); }); }
function startPoll() { stopPoll(); Net.poll = setInterval(pollNow, 15000); pollNow(); }
function stopPoll() { if (Net.poll) { clearInterval(Net.poll); Net.poll = null; } }
GK.stopPoll = stopPoll;
function isOn(id) { var p = Net.pres[id]; return !!(p && Date.now() - p.t < 45000); }

function stHtml() {
  var p = Net.pstat;
  if (p === 'ok') return '<span class="st-ok">● Bağlı</span> · davet alabilirsin';
  if (p === 'bad') return '<span class="st-bad">● Sunucuya ulaşılamıyor</span> <button class="lnk" data-act="retry">Tekrar dene</button>';
  if (p === 'dup') return '<span class="st-bad">● Bu kod başka bir pencerede açık</span> <button class="lnk" data-act="retry">Tekrar dene</button>';
  return '<span class="st-conn">● Bağlanılıyor<span class="dots"></span></span>';
}
function frHtml(forLobby) {
  if (!S.friends.length) return '<p class="note" style="margin:6px 0">Henüz arkadaşın yok. Aşağıdan arkadaşının kodunu ekle ya da kendi kodunu paylaş.</p>';
  var l = S.friends.slice();
  l.sort(function (a, b) { return (isOn(b.id) ? 1 : 0) - (isOn(a.id) ? 1 : 0) || (a.name < b.name ? -1 : 1); });
  if (forLobby) l = l.filter(function (f) { return isOn(f.id); });
  if (forLobby && !l.length) return '<p class="note" style="margin:6px 0">Şu an çevrimiçi arkadaşın görünmüyor.</p>';
  return l.map(function (f) {
    var on = isOn(f.id), bz = on && Net.pres[f.id].busy, inv = Net.pendInv && Net.pendInv[f.id];
    return '<div class="fr' + (on ? ' on' : '') + '"><i class="dot"></i><div class="fn"><b>' + esc(f.name) + '</b><small>' + f.id + ' · ' + (on ? (bz ? 'OYUNDA' : 'ÇEVRİMİÇİ') : 'ÇEVRİMDIŞI') + '</small></div>' +
      (on && !bz ? '<button class="btn pri" data-act="inv" data-id="' + f.id + '">' + (inv ? 'Çağrıldı' : 'Davet et') + '</button>' : '') +
      (forLobby ? '' : '<button class="xb" data-act="rmFr" data-id="' + f.id + '" aria-label="Sil"><svg class="i"><path d="M6 6l12 12M18 6L6 18"/></svg></button>') + '</div>';
  }).join('');
}
function refreshFr() {
  var el = $('#frList'); if (el && (UI.onl || UI.lobby)) el.innerHTML = frHtml(!!UI.lobby);
}
function refreshOnl() { if (!UI.onl) return; var el = $('#onlSt'); if (el) el.innerHTML = stHtml(); refreshFr(); }
GK.refreshFr = refreshFr; GK.refreshOnl = refreshOnl;

GK.sheetOnline = function () {
  ensureUid();
  openSheet('<h2>Çevrimiçi</h2><p class="note" id="onlSt" style="text-align:center;margin:0 0 4px"></p>' +
    '<div class="row"><div class="lb">Adın<small>Arkadaşların seni bu adla görür</small></div><button class="chip" data-act="name"><b>' + esc(S.name || 'Adını yaz') + '</b>&nbsp;·&nbsp;Değiştir</button></div>' +
    '<button class="btn pri sm" data-act="newRoom" style="margin-top:12px">Oda kur · arkadaşlarını çağır</button>' +
    '<h3>Arkadaş kodun</h3><div class="code" style="font-size:34px">' + S.uid + '</div>' +
    '<div class="chrow"><button class="btn sm" style="flex:1;margin:0 4px 0 0" data-act="share">Paylaş</button><button class="btn sm" style="flex:1;margin:0 0 0 4px" data-act="copyCode">Kopyala</button></div>' +
    '<h3>Arkadaşlar</h3><div id="frList"></div>' +
    '<h3>Arkadaş ekle</h3><div class="chrow"><input class="inp" id="fcIn" maxlength="6" placeholder="KOD" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" style="font-size:20px;letter-spacing:.3em;text-align:center;text-transform:uppercase"><button class="btn pri sm" data-act="addFr">Ekle</button></div>' +
    '<p class="note" id="onlMsg"></p><button class="btn sm" data-act="close">Kapat</button>');
  UI.onl = true;
  $('#onlSt').innerHTML = stHtml(); refreshFr();
  presStart(); startPoll();
};

/* ====================== ODA (ev sahibi) ====================== */
function defCfg() { return { n: 2, kind: 'race', len: 5, rounds: 3, first: false, tempo: 2 }; }
function mkRoom() {
  var c = S.lcfg2 || defCfg(), d = defCfg(), k;
  for (k in d) if (c[k] === undefined) c[k] = d[k];
  return { cfg: { n: c.n, kind: c.kind, len: c.len, rounds: c.rounds, first: !!c.first, tempo: c.tempo }, seats: [], started: false };
}
function cfgText(c) { return (c.n || '') + ' kişilik · ' + (c.kind === 'turn' ? 'Sırayla' : 'Yarış') + ' · ' + (c.len || 5) + ' harf · ' + (c.rounds || 3) + ' tur' + (c.first ? ' · ilk harf açık' : ''); }
function resetSeats(r) {
  var s = r.seats, n = r.cfg.n, i;
  while (s.length < n) s.push({ kind: 'emp', name: '', uid: '' });
  while (s.length > n) s.pop();
  if (!s[0] || s[0].kind !== 'host') s[0] = { kind: 'host', name: S.name || 'Ev sahibi', uid: S.uid };
  s[0].name = S.name || 'Ev sahibi';
  for (i = 1; i < n; i++) if (!s[i]) s[i] = { kind: 'emp', name: '', uid: '' };
}
Net.newRoom = function () {
  if (!S.name) { GK.sheetName(function () { Net.newRoom(); }); return; }
  if (Net.role === 'guest') return;
  if (!Net.room) { Net.room = mkRoom(); Net.role = 'host'; resetSeats(Net.room); Net.pendInv = {}; startHb(); }
  presStart();
  GK.sheetLobby();
};
function seatsNames() { return Net.room.seats.map(function (s) { return s.kind === 'emp' ? '' : s.name; }); }
function humanCount() { return Net.room.seats.filter(function (s) { return s.kind === 'host' || s.kind === 'guest'; }).length; }
var lobbyNote = '';
function setLobbyNote(t) { lobbyNote = t; var e = $('#lbNote'); if (e) e.textContent = t; }
GK.sheetLobby = function () {
  var r = Net.room; if (!r) return;
  resetSeats(r); var cfg = r.cfg;
  var rows = r.seats.map(function (s, i) {
    var lab = s.kind === 'host' ? 'Ev sahibi' : s.kind === 'guest' ? (s.lost ? 'Bağlantı koptu' : 'Çevrimiçi') : 'Boş · bilgisayar oynar';
    return '<div class="seat' + (s.kind === 'emp' ? ' emp' : '') + '"><i class="av" style="background:' + GK.COLS[i % 4] + '">' + (s.kind === 'emp' ? '?' : GK.initial(s.name)) + '</i><div class="nm"><b>' + esc(s.kind === 'emp' ? 'Koltuk ' + (i + 1) : s.name) + '</b><small>' + lab + '</small></div>' +
      (s.kind === 'guest' ? '<button class="xb" data-act="kick" data-i="' + i + '" aria-label="Çıkar"><svg class="i"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' : '') + '</div>';
  }).join('');
  openSheet('<h2>Oda</h2><p class="note" id="onlSt" style="text-align:center;margin:0 0 6px"></p>' +
    '<h3>Oyuncular</h3>' + rows +
    '<h3>Arkadaş çağır</h3><div id="frList"></div>' +
    '<h3>Oyun</h3>' +
    '<div class="row"><div class="lb">Oyuncu</div>' + seg('lc_n', [[2, '2'], [3, '3'], [4, '4']], cfg.n) + '</div>' +
    '<div class="row"><div class="lb">Tür<small>' + (cfg.kind === 'turn' ? 'Ortak tahta, sırayla tahmin' : 'Herkes kendi tahtasında, aynı kelime') + '</small></div>' + seg('lc_kind', [['race', 'Yarış'], ['turn', 'Sırayla']], cfg.kind) + '</div>' +
    '<div class="row"><div class="lb">Harf sayısı</div>' + seg('lc_len', [[4, '4'], [5, '5'], [6, '6'], [7, '7']], cfg.len) + '</div>' +
    '<div class="row"><div class="lb">Tur</div>' + seg('lc_rounds', [[3, '3'], [5, '5'], [7, '7'], [10, '10']], cfg.rounds) + '</div>' +
    '<div class="row"><div class="lb">İlk harf açık</div>' + seg('lc_first', [[1, 'Evet'], [0, 'Hayır']], cfg.first ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Süre<small>' + (cfg.kind === 'turn' ? 'Her tahmin için' : 'Her kelime için') + '</small></div>' + seg('lc_tempo', [[1, 'Hızlı'], [2, 'Normal'], [3, 'Rahat']], cfg.tempo) + '</div>' +
    '<p class="note" id="lbNote">' + esc(lobbyNote) + '</p>' +
    '<button class="btn pri sm" data-act="lbStart"' + (humanCount() < 2 ? ' disabled' : '') + '>Oyunu başlat' + (humanCount() < 2 ? ' (en az 1 arkadaş gerekli)' : '') + '</button>' +
    '<div class="gap"></div><button class="btn sm" data-act="lbShare">Davet bağlantısı paylaş</button>' +
    '<div class="gap"></div><button class="btn sm" data-act="lbClose">Odayı kapat</button>', { noClose: true });
  UI.lobby = true;
  $('#onlSt').innerHTML = stHtml(); refreshFr();
  presStart(); startPoll();
};
Net.lobbyCfg = function (k, v) {
  var r = Net.room; if (!r || r.started) return;
  var c = r.cfg;
  if (k === 'lc_n') { v = parseInt(v, 10); var occ = 0; r.seats.forEach(function (s, i) { if (i > 0 && s.kind === 'guest') occ = Math.max(occ, i + 1); }); if (v < occ) { setLobbyNote('Önce fazla oyuncuları çıkar.'); GK.sheetLobby(); return; } c.n = v; }
  else if (k === 'lc_kind') c.kind = v === 'turn' ? 'turn' : 'race';
  else if (k === 'lc_first') c.first = v === '1';
  else c[k.slice(3)] = parseInt(v, 10);
  S.lcfg2 = { n: c.n, kind: c.kind, len: c.len, rounds: c.rounds, first: c.first, tempo: c.tempo }; saveS();
  resetSeats(r); lobbyBroadcast(); GK.sheetLobby();
};
function lobbyBroadcast() {
  var r = Net.room; if (!r) return;
  var pk = { t: 'lobby', names: seatsNames(), cfg: r.cfg, host: S.name };
  r.seats.forEach(function (s, i) { if (s.kind === 'guest' && s.c) sendConn(s.c, { t: 'lobby', names: pk.names, cfg: pk.cfg, host: pk.host, seat: i }); });
}
Net.kick = function (i) {
  var r = Net.room; if (!r) return; var s = r.seats[i];
  if (s && s.kind === 'guest') { try { sendConn(s.c, { t: 'bye', why: 'kick' }); setTimeout(function () { try { s.c.close(); } catch (e) {} }, 400); } catch (e) {} r.seats[i] = { kind: 'emp', name: '', uid: '' }; lobbyBroadcast(); GK.sheetLobby(); }
};
Net.closeRoom = function () {
  var r = Net.room;
  if (r) r.seats.forEach(function (s) { if (s.kind === 'guest' && s.c) { sendConn(s.c, { t: 'bye', why: 'closed' }); (function (c) { setTimeout(function () { try { c.close(); } catch (e) {} }, 400); })(s.c); } });
  Net.room = null; if (Net.role === 'host') Net.role = null; stopHb(); lobbyNote = ''; Net.pendInv = {};
};
Net.share = function () {
  var link = location.href.split('#')[0].split('?')[0] + '?f=' + S.uid;
  var txt = 'Gizli Kelime oynayalım! Arkadaş kodum: ' + S.uid + '\n' + link;
  if (navigator.share) { try { navigator.share({ text: txt }); return; } catch (e) {} }
  var ok = false;
  try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt); ok = true; } } catch (e) {}
  setOnl(ok ? 'Davet metni kopyalandı.' : 'Kodunu elle paylaş: <b>' + S.uid + '</b>'); if (UI.lobby) setLobbyNote(ok ? 'Davet metni kopyalandı.' : 'Kodun: ' + S.uid);
};

/* ---------- davet gönder / al ---------- */
function sendConn(c, o) { try { if (c && c.open) c.send(o); } catch (e) {} }
Net.invite = function (id) {
  if (!S.name) { GK.sheetName(function () { Net.invite(id); }); return; }
  if (!Net.room) { Net.newRoom(); if (!Net.room) return; }
  if (!Net.peer || !Net.ready) { setLobbyNote('Bağlantı kuruluyor, birazdan tekrar dene.'); return; }
  var r = Net.room;
  if (!r.seats.some(function (s) { return s.kind === 'emp'; })) { setLobbyNote('Koltuk kalmadı. Oyuncu sayısını artır.'); return; }
  var f = findFr(id), c;
  try { c = Net.peer.connect(pid(id), { reliable: true }); } catch (e) { setLobbyNote('Bağlantı kurulamadı.'); return; }
  Net.pendInv = Net.pendInv || {}; Net.pendInv[id] = 1;
  c.on('open', function () { try { c.send({ t: 'invite', name: S.name, uid: S.uid, cfg: r.cfg }); } catch (e) {} setLobbyNote((f ? f.name : 'Arkadaşın') + ' çağrıldı. Cevap bekleniyor…'); });
  c.on('data', function (d) {
    if (d && d.t === 'busy') { delete Net.pendInv[id]; setLobbyNote((f ? f.name : 'Arkadaşın') + ' şu an başka bir oyunda.'); try { c.close(); } catch (e) {} refreshFr(); }
    else if (d && d.t === 'no') { delete Net.pendInv[id]; setLobbyNote((f ? f.name : 'Arkadaşın') + ' daveti reddetti.'); try { c.close(); } catch (e) {} refreshFr(); }
    else if (d && d.t === 'hi') hostJoin(c, d);
    else route(c, d);
  });
  c.on('close', function () { connGone(c); }); c.on('error', function () { connGone(c); });
  setTimeout(function () { if (Net.pendInv && Net.pendInv[id]) { delete Net.pendInv[id]; refreshFr(); } }, 40000);
  refreshFr();
};
function onIncoming(c) {
  c.on('data', function (d) { route(c, d); });
  c.on('close', function () {
    if (Net.inv && Net.inv.c === c) { Net.inv = null; if (UI.invOpen) { closeSheet(); toast('Davet iptal edildi'); } }
    connGone(c);
  });
  c.on('error', function () {});
}
function seatOf(c) { var r = Net.room; if (!r) return -1; for (var i = 1; i < r.seats.length; i++) if (r.seats[i].c === c) return i; return -1; }
function route(c, d) {
  if (!d || !d.t) return;
  if (Net.hc && c === Net.hc) { Net.lastRx = Date.now(); onHost(d); return; }
  var si = seatOf(c);
  if (si > 0) { Net.room.seats[si].rx = Date.now(); onGuest(si, d); return; }
  if (d.t === 'ping') {
    try { c.send({ t: 'pong', name: S.name || '', uid: S.uid, busy: !!((Net.room && Net.room.started) || (Net.hc && Net.hcStarted) || (H.inGame && H.inGame())) }); } catch (e) {}
    setTimeout(function () { try { c.close(); } catch (e) {} }, 1500);
  } else if (d.t === 'invite') {
    if (Net.role || Net.inv || (H.inGame && H.inGame())) { try { c.send({ t: 'busy' }); } catch (e) {} setTimeout(function () { try { c.close(); } catch (e) {} }, 800); return; }
    Net.inv = { c: c, name: String(d.name || 'Arkadaş').slice(0, 14), uid: cleanCode(d.uid), cfg: d.cfg };
    showInvite();
  } else if (d.t === 'hi' && Net.room) hostJoin(c, d);
}
function showInvite() {
  var iv = Net.inv; if (!iv) return;
  var c = iv.cfg || {};
  var info = 'Gizli Kelime (' + cfgText(c) + ')';
  openSheet('<h2>Oyun daveti</h2><div class="code" style="font-size:26px;letter-spacing:.06em">' + esc(iv.name) + '</div><p class="note" style="text-align:center">seni ' + esc(info) + ' oynamaya çağırıyor.</p><div class="gap"></div><button class="btn pri sm" data-act="invAcc">Kabul et</button><div class="gap"></div><button class="btn sm" data-act="invNo">Reddet</button>', { noClose: true });
  UI.invOpen = true; GK.vib([60, 40, 60]); try { GK.SND.ping(); } catch (e) {}
}
Net.invAccept = function () {
  var iv = Net.inv; if (!iv) return;
  Net.inv = null; UI.invOpen = false;
  Net.hc = iv.c; Net.role = 'guest'; Net.hostUid = iv.uid; Net.hostName = iv.name; Net.lastRx = Date.now(); Net.hcStarted = false; Net.mySeat = -1;
  if (iv.uid) addFr(iv.uid, iv.name);
  wireHost(iv.c); startHb();
  sendConn(iv.c, { t: 'hi', name: S.name || 'Oyuncu', uid: S.uid });
  openSheet('<h2>Bağlanılıyor</h2><p class="note" style="text-align:center">Odaya giriliyor<span class="dots"></span></p><div class="gap"></div><button class="btn sm" data-act="leaveRoom">Vazgeç</button>', { noClose: true });
  Net.joinT = setTimeout(function () { if (Net.role === 'guest' && Net.mySeat < 0) { Net.leave(); toast('Bağlantı kurulamadı'); } }, 15000);
};
Net.invDecline = function () {
  var iv = Net.inv; Net.inv = null; UI.invOpen = false;
  if (iv) { try { iv.c.send({ t: 'no' }); } catch (e) {} setTimeout(function () { try { iv.c.close(); } catch (e) {} }, 600); }
  closeSheet();
};
function wireHost(c) {
  c.on('data', function (d) { route(c, d); });
  c.on('close', function () { connGone(c); });
  c.on('error', function () { connGone(c); });
}

/* ev sahibi: konuk katıldı */
function hostJoin(c, d) {
  var r = Net.room;
  if (!r) { sendConn(c, { t: 'bye', why: 'closed' }); setTimeout(function () { try { c.close(); } catch (e) {} }, 300); return; }
  var uid = cleanCode(d.uid), nm = String(d.name || 'Oyuncu').slice(0, 14), seat = -1, i;
  for (i = 1; i < r.seats.length; i++) if (r.seats[i].uid && r.seats[i].uid === uid && (r.seats[i].kind === 'guest')) { seat = i; break; }
  if (seat < 0 && !r.started) for (i = 1; i < r.seats.length; i++) if (r.seats[i].kind === 'emp') { seat = i; break; }
  if (seat < 0 && r.started) for (i = 1; i < r.seats.length; i++) if (r.seats[i].lostUid && r.seats[i].lostUid === uid) { seat = i; break; }
  if (seat < 0) { sendConn(c, { t: 'full' }); setTimeout(function () { try { c.close(); } catch (e) {} }, 400); return; }
  var old = r.seats[seat];
  if (old && old.c && old.c !== c) { try { old.c.close(); } catch (e) {} }
  r.seats[seat] = { kind: 'guest', name: nm, uid: uid, c: c, rx: Date.now(), lost: false };
  if (uid) addFr(uid, nm);
  if (Net.pendInv) delete Net.pendInv[uid];
  /* bağlantı zaten dinleniyor (davet ya da gelen bağlantı); ikinci kez dinleyici eklenmez */
  sendConn(c, { t: 'welcome', seat: seat, cfg: r.cfg, names: seatsNames(), host: S.name, hostUid: S.uid, started: r.started });
  if (r.started) { if (H.onSeatBack) H.onSeatBack(seat); }
  else { lobbyBroadcast(); if (UI.lobby) { setLobbyNote(nm + ' odaya katıldı.'); GK.sheetLobby(); } }
}
function onGuest(seat, d) {
  var r = Net.room; if (!r) return;
  if (d.t === 'act') { if (H.onGuestAct) H.onGuestAct(seat, d); }
  else if (d.t === 'chat' && typeof d.x === 'string') relayChat(seat, d.x.slice(0, 140));
  else if (d.t === 'leave') { Net.seatLost(seat, true); }
  else if (d.t === 'sync') { if (H.onSeatBack) H.onSeatBack(seat); }
}
Net.seatLost = function (seat, leave) {
  var r = Net.room; if (!r) return; var s = r.seats[seat];
  if (!s || s.kind !== 'guest') return;
  var uid = s.uid, nm = s.name; try { if (s.c) s.c.close(); } catch (e) {}
  if (r.started) {
    r.seats[seat] = { kind: 'guest', name: nm, uid: uid, c: null, lost: true, lostUid: uid, rx: 0 };
    if (leave) r.seats[seat].left = true;
    if (H.onSeatLost) H.onSeatLost(seat, nm, !!leave);
  } else { r.seats[seat] = { kind: 'emp', name: '', uid: '' }; lobbyBroadcast(); if (UI.lobby) { setLobbyNote(nm + ' odadan ayrıldı.'); GK.sheetLobby(); } }
};
function connGone(c) {
  var r = Net.room;
  if (r) { var si = seatOf(c); if (si > 0) { /* kalp atışı zaman aşımı beklenmeden hemen */ Net.seatLost(si, false); return; } }
  if (Net.hc && c === Net.hc) hostConnLost();
}

/* ---------- kalp atışı ---------- */
function startHb() {
  if (Net.hb) return;
  Net.hb = setInterval(function () {
    var now = Date.now();
    if (Net.role === 'host' && Net.room) {
      Net.room.seats.forEach(function (s, i) {
        if (s.kind === 'guest' && s.c) { sendConn(s.c, { t: 'p' }); if (now - s.rx > 30000) Net.seatLost(i, false); }
      });
    } else if (Net.role === 'guest' && Net.hc) {
      sendConn(Net.hc, { t: 'p' });
      if (now - Net.lastRx > 30000) hostConnLost();
    }
  }, 4000);
}
function stopHb() { if (Net.hb) { clearInterval(Net.hb); Net.hb = null; } }

/* ---------- konuk: ev sahibinden gelen iletiler ---------- */
function onHost(d) {
  var t = d.t;
  if (t === 'welcome') {
    if (Net.joinT) { clearTimeout(Net.joinT); Net.joinT = null; }
    Net.mySeat = d.seat; Net.lobbyNames = d.names; Net.lobbyCfg = d.cfg; Net.hostName = d.host || Net.hostName; Net.hostUid = d.hostUid || Net.hostUid;
    if (Net.rtry) { clearInterval(Net.rtry); Net.rtry = null; }
    if (d.started) { sendConn(Net.hc, { t: 'sync' }); if (H.onReconnected) H.onReconnected(); }
    else sheetGuestLobby();
  } else if (t === 'lobby') {
    Net.lobbyNames = d.names; Net.lobbyCfg = d.cfg; if (d.seat != null) Net.mySeat = d.seat;
    if (!Net.hcStarted && $('#ov').className === 'on' && UI.guestLobby) sheetGuestLobby();
  } else if (t === 'st') {
    Net.hcStarted = true; closeLobbyIfAny();
    if (H.onGuestState) H.onGuestState(d.v);
  } else if (t === 'chat') { gotChat(d.s, d.x); }
  else if (t === 'bye') {
    var why = d.why;
    Net.cleanupGuest();
    if (H.onHostGone) H.onHostGone(why === 'kick' ? 'Odadan çıkarıldın.' : 'Oda kapandı.');
    else { closeSheet(); toast(why === 'kick' ? 'Odadan çıkarıldın.' : 'Oda kapandı.'); }
  } else if (t === 'full') {
    Net.cleanupGuest(); closeSheet(); toast('Oda dolu ya da başlamış.', 2600);
  }
};
function closeLobbyIfAny() { if (UI.guestLobby) { UI.guestLobby = false; closeSheet(); } }
function sheetGuestLobby() {
  var names = Net.lobbyNames || [], cfg = Net.lobbyCfg || {};
  var rows = names.map(function (n, i) {
    return '<div class="seat' + (n ? '' : ' emp') + '"><i class="av" style="background:' + GK.COLS[i % 4] + '">' + (n ? GK.initial(n) : '?') + '</i><div class="nm"><b>' + esc(n || 'Boş koltuk') + '</b><small>' + (i === 0 ? 'Ev sahibi' : (i === Net.mySeat ? 'Sen' : (n ? 'Oyuncu' : 'Bilgisayar oynar'))) + '</small></div></div>';
  }).join('');
  openSheet('<h2>Oda</h2><p class="note" style="text-align:center">' + esc(Net.hostName || 'Ev sahibi') + ' oyunu başlatınca oyun açılacak<span class="dots"></span></p>' +
    '<p class="note" style="margin:0 0 8px">' + cfgText(cfg) + '</p>' + rows +
    '<div class="gap"></div><button class="btn sm" data-act="leaveRoom">Odadan ayrıl</button>', { noClose: true });
  UI.guestLobby = true;
}
function hostConnLost() {
  if (Net.role !== 'guest' || !Net.hc) return;
  var c = Net.hc; Net.hc = null; try { c.close(); } catch (e) {}
  if (!Net.hcStarted && Net.mySeat < 0) { Net.cleanupGuest(); closeSheet(); toast('Bağlantı kesildi'); return; }
  if (H.onHostDown) H.onHostDown();
  /* yeniden bağlanmayı dene */
  var tries = 0;
  if (Net.rtry) clearInterval(Net.rtry);
  Net.rtry = setInterval(function () {
    tries++;
    if (tries > 18 || Net.role !== 'guest') { clearInterval(Net.rtry); Net.rtry = null; if (Net.role === 'guest') { Net.cleanupGuest(); if (H.onHostGone) H.onHostGone('Ev sahibiyle bağlantı kurulamadı.'); } return; }
    if (!Net.peer || !Net.ready || Net.hc) return;
    var nc;
    try { nc = Net.peer.connect(pid(Net.hostUid), { reliable: true }); } catch (e) { return; }
    nc.on('open', function () {
      if (Net.hc) { try { nc.close(); } catch (e) {} return; }
      Net.hc = nc; Net.lastRx = Date.now(); wireHost(nc); sendConn(nc, { t: 'hi', name: S.name || 'Oyuncu', uid: S.uid, re: 1 });
    });
    nc.on('error', function () {});
  }, 3500);
}
Net.cleanupGuest = function () {
  var c = Net.hc; Net.hc = null; Net.role = (Net.room ? 'host' : null); Net.mySeat = -1; Net.hcStarted = false; Net.hostUid = '';
  if (Net.rtry) { clearInterval(Net.rtry); Net.rtry = null; }
  if (Net.joinT) { clearTimeout(Net.joinT); Net.joinT = null; }
  try { if (c) c.close(); } catch (e) {}
  UI.guestLobby = false; Net.chat = []; Net.unread = 0;
  if (!Net.room) stopHb();
};
Net.leave = function () {
  if (Net.role === 'guest') { if (Net.hc) { sendConn(Net.hc, { t: 'leave' }); var c = Net.hc; setTimeout(function () { try { c.close(); } catch (e) {} }, 400); Net.hc = null; } Net.cleanupGuest(); }
  closeSheet();
};

/* ---------- gönderim ---------- */
Net.sendHost = function (o) { if (Net.role === 'guest') sendConn(Net.hc, o); };
Net.sendSeat = function (seat, o) { var r = Net.room; if (!r) return; var s = r.seats[seat]; if (s && s.kind === 'guest' && s.c) sendConn(s.c, o); };
Net.guestSeats = function () { var r = Net.room, o = []; if (!r) return o; r.seats.forEach(function (s, i) { if (s.kind === 'guest' && s.c && !s.lost) o.push(i); }); return o; };
Net.seatKind = function (i) { var r = Net.room; if (!r) return 'bot'; var s = r.seats[i]; return s ? (s.kind === 'guest' && !s.lost ? 'guest' : (s.kind === 'host' ? 'host' : 'bot')) : 'bot'; };
Net.seatName = function (i) { var r = Net.room; if (!r || !r.seats[i]) return ''; return r.seats[i].name || ''; };

/* ---------- sohbet ---------- */
function msgHtml(m) { var nm = m.me ? (S.name || 'Sen') : (m.n || 'Oyuncu'); return '<div class="msg ' + (m.me ? 'me' : 'th') + '"><small>' + esc(nm) + '</small>' + esc(m.x) + '</div>'; }
function appendChat(m) {
  var el = $('#chLog'); if (!el) return;
  var e0 = $('#chEmpty'); if (e0 && e0.parentNode) e0.parentNode.removeChild(e0);
  var d = document.createElement('div'); d.innerHTML = msgHtml(m); el.appendChild(d.firstChild); el.scrollTop = el.scrollHeight;
}
function seatLabel(s) { var n = H.names ? H.names() : []; return n[s] || 'Oyuncu'; }
function gotChat(s, x) {
  var me = (s === (Net.role === 'host' ? 0 : Net.mySeat));
  var m = { me: me, n: seatLabel(s), x: String(x).slice(0, 140) };
  Net.chat.push(m);
  if (UI.chatOpen) appendChat(m);
  else if (!me) { Net.unread++; if (H.hud) H.hud(); toast(m.n + ': ' + m.x.slice(0, 40), 2400); GK.vib(25); }
}
function relayChat(from, x) {
  gotChat(from, x);
  var r = Net.room; if (!r) return;
  r.seats.forEach(function (s, i) { if (s.kind === 'guest' && s.c && i !== from) sendConn(s.c, { t: 'chat', s: from, x: x }); });
}
GK.sendChat = function (x) {
  x = String(x || '').replace(/\s+/g, ' ').trim().slice(0, 140); if (!x) return;
  if (Net.role === 'host') relayChat(0, x);
  else if (Net.role === 'guest') { sendConn(Net.hc, { t: 'chat', x: x }); gotChat(Net.mySeat, x); }
};
GK.sheetChat = function (back) {
  Net.unread = 0; if (H.hud) H.hud();
  var h = '<h2>Sohbet</h2><div class="chlog" id="chLog">' +
    (Net.chat.length ? Net.chat.map(msgHtml).join('') : '<p class="note" id="chEmpty" style="text-align:center">Henüz mesaj yok. Hızlı bir mesaj seç ya da yaz.</p>') + '</div>' +
    '<div class="chips">' + QUICK.map(function (q, i) { return '<button class="chip" data-act="chQ" data-i="' + i + '">' + esc(q) + '</button>'; }).join('') + '</div>' +
    '<div class="chrow"><input class="inp" id="chIn" maxlength="140" placeholder="Mesaj yaz…" autocomplete="off"><button class="btn pri sm" data-act="chSend">Gönder</button></div>';
  if (!back) h += '<div class="gap"></div><button class="btn sm" data-act="close">Kapat</button>';
  openSheet(h, { back: back || null, noClose: !!back });
  UI.chatOpen = true;
  var el = $('#chLog'); if (el) el.scrollTop = el.scrollHeight;
};
Net.resetChat = function () { Net.chat = []; Net.unread = 0; };
Net.isOnline = function () { return Net.role === 'host' ? !!(Net.room && Net.room.started) : (Net.role === 'guest' && Net.hcStarted); };
Net.stopAll = function () {
  if (Net.role === 'host') Net.closeRoom();
  else if (Net.role === 'guest') Net.leave();
  Net.chat = []; Net.unread = 0; Net.pendInv = {};
};
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) { try { if (Net.peer && Net.peer.disconnected) Net.peer.reconnect(); } catch (e) {} }
});
})(window);
