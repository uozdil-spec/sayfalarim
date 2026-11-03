/* Kart Salonu · çevrimiçi katman.
   Genel MQTT (WebSocket) aracıları üzerinden: arkadaşlar, davet, açık masalar, oda.
   Oyun "ev sahibi" cihazda çalışır. Kopma korumaları:
   - Her oyuncunun son durumu aracıda saklı (retained) durur; geri gelen kendini anında günceller.
   - Hamleler numaralı gönderilir, onay gelene kadar tekrar denenir; ev sahibi tekrarı yok sayar.
   - Düzenli kalp atışı: sessiz kalan oyuncunun yerine bot oynar; döndüğünde koltuğunu geri alır.
   - Ekran açılınca / internet gelince / sessiz ölü bağlantıda otomatik yeniden bağlanır. */
(function (root) {
'use strict';
var KS = root.KS;
var R = 'ksl1';
var BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://mqtt.eclipseprojects.io:443/mqtt',
  'wss://test.mosquitto.org:8081'
];
var BOT_NAMES = ['Tekin', 'Pınar', 'Deniz', 'Kaan', 'Elif', 'Ece', 'Mert', 'Selin', 'Burak', 'Derya', 'Cem', 'Aylin', 'Arda', 'Mina', 'Ozan', 'Lale'];
KS.BOT_NAMES = BOT_NAMES;
var clean = KS.clean;

function toStr(p) { return typeof p === 'string' ? p : (p && p.toString ? p.toString() : ''); }
function parse(p) { try { var o = JSON.parse(toStr(p)); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }
function topicMatch(filter, topic) {
  var f = filter.split('/'), t = topic.split('/'), i;
  for (i = 0; i < f.length; i++) {
    if (f[i] === '#') return true;
    if (i >= t.length) return false;
    if (f[i] !== '+' && f[i] !== t[i]) return false;
  }
  return f.length === t.length;
}
function roomCode() { return KS.rid(5, KS.CODEA); }

/* ====================== Net ====================== */
function Net() {
  this.cli = null; this.subs = []; this.status = 'idle'; // idle | connecting | online | offline
  this.listeners = [];
  this.lastRx = 0; this.broker = ''; this.errors = {};
  this.presence = {};      // arkadaş durumları
  this.reqs = KS.lsGet('reqs', {});     // gelen arkadaş istekleri
  this.sent = KS.lsGet('sent', {});     // gönderdiğim istekler
  this.invites = [];
  this.tables = {};
  this.room = null;        // oda kodu (varsa)
  this.state = 'on';
  this.timers = [];
  this.connecting = null;
  var self = this;
  function wake() { self.ensure(); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') wake(); });
  root.addEventListener('online', wake);
  root.addEventListener('pageshow', wake);
  root.addEventListener('focus', wake);
  root.addEventListener('offline', function () { self.setStatus('offline'); });
}
KS.Net = Net;
Net.prototype.onStatus = function (fn) { this.listeners.push(fn); };
Net.prototype.setStatus = function (s) {
  if (this.status === s) return;
  this.status = s;
  for (var i = 0; i < this.listeners.length; i++) { try { this.listeners[i](s); } catch (e) {} }
};
Net.prototype.brokerList = function () {
  var S = KS.S;
  if (S.broker === 'custom' && S.customBroker) return [S.customBroker];
  return BROKERS;
};
Net.prototype.profile = function () { return { n: clean(KS.S.name, 14) || 'Oyuncu', a: KS.S.av || '🙂' }; };

Net.prototype.connect = function () {
  var self = this;
  if (this.connecting) return this.connecting;
  if (this.status === 'online' && this.cli && this.cli.connected) return Promise.resolve(this.broker);
  var lib = root.mqtt;
  if (!lib) return Promise.reject(new Error('no-lib'));
  var list = this.brokerList(), n = list.length;
  this.setStatus('connecting');
  this.errors = {};
  this.connecting = new Promise(function (resolve, reject) {
    var results = [], clients = [], decided = false, i;
    function fail(idx, why) {
      if (results[idx] !== undefined) return;
      results[idx] = false; self.errors[list[idx]] = why || 'error';
      try { clients[idx].end(true); } catch (e) {}
      check();
    }
    function check() {
      if (decided) return;
      for (var k = 0; k < n; k++) {
        if (results[k] === undefined) return;
        if (results[k] === true) { decided = true; choose(k); return; }
      }
      decided = true; self.connecting = null; self.setStatus('offline'); reject(new Error('no-broker'));
    }
    function choose(k) {
      for (var m = 0; m < n; m++) if (m !== k && clients[m]) { try { clients[m].end(true); } catch (e) {} }
      var c = clients[k];
      self.cli = c; self.broker = list[k];
      c.options.reconnectPeriod = 2000;
      self.attach();
      self.connecting = null;
      resolve(self.broker);
    }
    function start(idx) {
      var url = list[idx], c;
      try {
        c = lib.connect(url, {
          clientId: 'ks_' + KS.S.id + '_' + KS.rid(4), clean: true, keepalive: 20, connectTimeout: 7000,
          reconnectPeriod: 0, protocolVersion: 4, resubscribe: false,
          will: { topic: R + '/p/' + KS.S.id, payload: JSON.stringify({ st: 'off' }), retain: true, qos: 0 }
        });
      } catch (e) { clients[idx] = null; results[idx] = false; self.errors[url] = String(e && e.message || e); return; }
      clients[idx] = c;
      var to = setTimeout(function () { fail(idx, 'timeout'); }, 8500);
      c.on('connect', function () { clearTimeout(to); if (results[idx] === undefined) { results[idx] = true; check(); } });
      c.on('error', function (e) { clearTimeout(to); fail(idx, String(e && e.message || 'error')); });
      c.on('close', function () { clearTimeout(to); fail(idx, 'closed'); });
    }
    for (i = 0; i < n; i++) start(i);
    check();
  });
  return this.connecting;
};

Net.prototype.attach = function () {
  var self = this, c = this.cli;
  this.lastRx = Date.now();
  c.on('message', function (topic, payload) { self.lastRx = Date.now(); self.route(topic, payload); });
  c.on('close', function () { if (self.status === 'online') self.setStatus('offline'); });
  c.on('offline', function () { self.setStatus('offline'); });
  c.on('connect', function () { self.onUp(); });
  this.onUp();
  this.timers.forEach(clearInterval); this.timers = [];
  this.timers.push(setInterval(function () { self.watch(); }, 4000));
  this.timers.push(setInterval(function () { if (self.status === 'online') self.publishPresence(); }, 25000));
};

Net.prototype.onUp = function () {
  this.setStatus('online');
  this.lastRx = Date.now();
  var i;
  for (i = 0; i < this.subs.length; i++) this.subs[i].on();
  this.baseSubs();
  this.publishPresence();
};
Net.prototype.baseSubs = function () {
  var c = this.cli, id = KS.S.id, k;
  if (!c) return;
  c.subscribe(R + '/in/' + id + '/+/+', { qos: 1 });
  for (k in this.friends()) c.subscribe(R + '/p/' + k, { qos: 0 });
};
/* Sessiz ölü bağlantıyı yakala */
Net.prototype.watch = function () {
  if (!this.cli) return;
  var idle = Date.now() - this.lastRx;
  if (this.status === 'online' && this.room && idle > 28000) this.force();
  else if (this.status === 'offline' && !this.connecting) this.ensure();
};
Net.prototype.force = function () {
  var old = this.cli;
  this.cli = null;
  try { if (old) old.end(true); } catch (e) {}
  this.status = 'offline';
  this.connect().catch(function () {});
};
Net.prototype.ensure = function () {
  if (!this.wanted) return;
  if (this.connecting) return;
  if (!this.cli) { this.connect().catch(function () {}); return; }
  if (!this.cli.connected) {
    try { this.cli.reconnect(); } catch (e) {}
    var self = this, c = this.cli;
    setTimeout(function () { if (self.cli === c && !c.connected && !self.connecting) self.force(); }, 4000);
  } else if (this.room && Date.now() - this.lastRx > 20000) this.force();
};
Net.prototype.start = function () { this.wanted = true; return this.connect(); };

Net.prototype.sub = function (filter, fn) {
  var self = this, rec = { filter: filter, fn: fn, on: function () { if (self.cli && self.cli.connected) self.cli.subscribe(filter, { qos: 1 }); } };
  this.subs.push(rec);
  rec.on();
  return function () {
    var k = self.subs.indexOf(rec);
    if (k >= 0) self.subs.splice(k, 1);
    if (self.cli) try { self.cli.unsubscribe(filter); } catch (e) {}
  };
};
Net.prototype.pub = function (topic, obj, opt) {
  if (!this.cli) return false;
  var payload = obj === '' ? '' : JSON.stringify(obj);
  try { this.cli.publish(topic, payload, { qos: (opt && opt.qos) || 0, retain: !!(opt && opt.retain) }); return true; } catch (e) { return false; }
};

Net.prototype.route = function (topic, payload) {
  var i, o, id = KS.S.id, s = toStr(payload);
  if (topic.indexOf(R + '/p/') === 0) {
    var pid = topic.slice((R + '/p/').length);
    o = s ? parse(s) : null;
    if (!o || o.st === 'off') delete this.presence[pid];
    else this.presence[pid] = { n: clean(o.n, 14), a: clean(o.a, 4), st: o.st === 'busy' ? 'busy' : 'on', room: clean(o.room, 6), g: clean(o.g, 8), t: Date.now() };
    if (this.onFriends) this.onFriends();
  } else if (topic.indexOf(R + '/in/' + id + '/') === 0) {
    var parts = topic.split('/'), from = parts[3], kind = parts[4];
    if (!s) return;
    o = parse(s); if (!o) return;
    this.onInbox(from, kind, o, topic);
  } else if (topic.indexOf(R + '/t/') === 0) {
    var code = topic.slice((R + '/t/').length);
    o = s ? parse(s) : null;
    if (!o) delete this.tables[code];
    else this.tables[code] = { code: clean(code, 6), g: clean(o.g, 8), n: +o.n || 2, f: +o.f || 1, h: clean(o.h, 14), a: clean(o.a, 4), t: +o.t || 0, rt: Date.now() };
    if (this.onTables) this.onTables();
  }
  for (i = 0; i < this.subs.length; i++) {
    var sb = this.subs[i];
    if (topicMatch(sb.filter, topic)) { o = parse(payload); if (o) sb.fn(o, topic); }
  }
};

/* ---- Varlık ---- */
Net.prototype.publishPresence = function () {
  var p = this.profile();
  this.pub(R + '/p/' + KS.S.id, { n: p.n, a: p.a, st: this.state, room: this.room || '', g: this.roomGame || '', t: Date.now() }, { retain: true });
};
Net.prototype.setRoom = function (code, game, busy) {
  this.room = code || null; this.roomGame = game || '';
  this.state = busy ? 'busy' : 'on';
  this.publishPresence();
};

/* ---- Arkadaşlar ---- */
Net.prototype.friends = function () { return KS.lsGet('friends', {}); };
Net.prototype.saveFriends = function (f) { KS.lsSet('friends', f); };
Net.prototype.addFriendLocal = function (id, n, a) {
  var f = this.friends();
  f[id] = { n: clean(n, 14) || (f[id] && f[id].n) || '?', a: clean(a, 4) || (f[id] && f[id].a) || '🙂' };
  this.saveFriends(f);
  if (this.cli && this.cli.connected) this.cli.subscribe(R + '/p/' + id, { qos: 0 });
};
Net.prototype.removeFriend = function (id) {
  var f = this.friends(); delete f[id]; this.saveFriends(f);
  delete this.presence[id];
  if (this.cli) try { this.cli.unsubscribe(R + '/p/' + id); } catch (e) {}
  this.pub(R + '/in/' + id + '/' + KS.S.id + '/rm', { t: 'rm', ts: Date.now() }, { qos: 1 });
};
Net.prototype.request = function (id) {
  id = String(id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (id.length !== 8) return 'bad';
  if (id === KS.S.id) return 'self';
  if (this.friends()[id]) return 'have';
  var p = this.profile();
  this.sent[id] = { ts: Date.now() }; KS.lsSet('sent', this.sent);
  this.pub(R + '/in/' + id + '/' + KS.S.id + '/req', { t: 'req', n: p.n, a: p.a, ts: Date.now() }, { qos: 1, retain: true });
  if (this.cli && this.cli.connected) this.cli.subscribe(R + '/p/' + id, { qos: 0 });
  return 'ok';
};
Net.prototype.accept = function (id) {
  var r = this.reqs[id]; if (!r) return;
  this.addFriendLocal(id, r.n, r.a);
  var p = this.profile();
  this.pub(R + '/in/' + id + '/' + KS.S.id + '/acc', { t: 'acc', n: p.n, a: p.a, ts: Date.now() }, { qos: 1, retain: true });
  this.dropReq(id);
};
Net.prototype.decline = function (id) { this.dropReq(id); };
Net.prototype.dropReq = function (id) {
  delete this.reqs[id]; KS.lsSet('reqs', this.reqs);
  this.pub(R + '/in/' + KS.S.id + '/' + id + '/req', '', { qos: 1, retain: true });
  if (this.onFriends) this.onFriends();
};
Net.prototype.onInbox = function (from, kind, o, topic) {
  if (from === KS.S.id) return;
  if (kind === 'req') {
    if (this.friends()[from]) { this.accept2(from, o); return; }
    this.reqs[from] = { n: clean(o.n, 14) || '?', a: clean(o.a, 4) || '🙂', ts: +o.ts || 0 };
    KS.lsSet('reqs', this.reqs);
    if (this.onRequest) this.onRequest(from, this.reqs[from]);
  } else if (kind === 'acc') {
    this.addFriendLocal(from, o.n, o.a);
    delete this.sent[from]; KS.lsSet('sent', this.sent);
    this.cli && this.cli.publish(topic, '', { qos: 1, retain: true });
    if (this.onFriends) this.onFriends();
    if (this.onToast) this.onToast((clean(o.n, 14) || 'Oyuncu') + ' arkadaşlık isteğini kabul etti', 'good');
  } else if (kind === 'inv') {
    if (Date.now() - (+o.ts || 0) > 15 * 60000) { this.cli && this.cli.publish(topic, '', { qos: 1, retain: true }); return; }
    var f = this.friends()[from];
    var inv = { from: from, n: f ? f.n : clean(o.n, 14), a: f ? f.a : clean(o.a, 4), code: clean(o.code, 6).toUpperCase(), g: clean(o.g, 8), ts: +o.ts };
    this.invites = this.invites.filter(function (x) { return x.from !== from; });
    this.invites.push(inv);
    this.cli && this.cli.publish(topic, '', { qos: 1, retain: true });
    if (this.onInvite) this.onInvite(inv);
  } else if (kind === 'rm') {
    var ff = this.friends();
    if (ff[from]) { delete ff[from]; this.saveFriends(ff); if (this.onFriends) this.onFriends(); }
    this.cli && this.cli.publish(topic, '', { qos: 1, retain: true });
  }
};
Net.prototype.accept2 = function (id, o) {
  // zaten arkadaşım; karşı taraf yeniden istek yolladıysa sessizce onayla
  var p = this.profile();
  this.pub(R + '/in/' + id + '/' + KS.S.id + '/acc', { t: 'acc', n: p.n, a: p.a, ts: Date.now() }, { qos: 1, retain: true });
  this.cli && this.cli.publish(R + '/in/' + KS.S.id + '/' + id + '/req', '', { qos: 1, retain: true });
};
Net.prototype.invite = function (fid, code, game) {
  var p = this.profile();
  this.pub(R + '/in/' + fid + '/' + KS.S.id + '/inv', { t: 'inv', code: code, g: game, n: p.n, a: p.a, ts: Date.now() }, { qos: 1, retain: true });
};

/* ---- Açık masalar ---- */
Net.prototype.watchTables = function (on) {
  var self = this;
  if (on) {
    if (this.tUnsub) return;
    this.tUnsub = this.sub(R + '/t/+', function () {});
    this.tTimer = setInterval(function () {
      var now = Date.now(), ch = false, k;
      for (k in self.tables) if (now - self.tables[k].rt > 70000) { delete self.tables[k]; ch = true; }
      if (ch && self.onTables) self.onTables();
    }, 15000);
  } else {
    if (this.tUnsub) { this.tUnsub(); this.tUnsub = null; }
    clearInterval(this.tTimer); this.tables = {};
  }
};
Net.prototype.tableList = function () {
  var a = [], k;
  for (k in this.tables) a.push(this.tables[k]);
  a.sort(function (x, y) { return y.t - x.t; });
  return a;
};

/* ====================== Oda sahibi ====================== */
function RoomHost(net, cfg, resume) {
  var self = this;
  this.net = net;
  this.code = cfg.code || roomCode();
  this.game = cfg.game; this.n = cfg.n; this.opts = cfg.opts || {};
  this.turnTime = cfg.turnTime || 0;
  this.pub = !!cfg.pub;
  this.level = cfg.level || 'medium';
  this.sess = null; this.status = 'lobby';
  this.acks = {}; this.lastId = {}; this.seen = {};
  this.seats = [];
  this.closed = false;
  this.lobbyCb = null;
  var me = net.profile(), i;
  for (i = 0; i < this.n; i++) this.seats.push({ human: false, open: true, name: '', av: '', pid: '' });
  this.seats[0] = { human: true, open: false, name: me.n, av: me.a, pid: KS.S.id, level: 'medium' };
  this.chatLog = [];
  this.unsubs = [];
  this.base = R + '/r/' + this.code;
  if (resume) {
    this.seats = resume.seats; this.status = 'play';
    this.sess = new KS.Session({ game: this.game, seats: this.seats, opts: this.opts, online: true, turnTime: this.turnTime, st: resume.snap.st, seq: resume.snap.seq, ready: resume.snap.ready });
    for (i = 0; i < this.seats.length; i++) if (this.seats[i].human && this.seats[i].pid !== KS.S.id) this.seats[i].away = true;
    this.hook();
  }
  this.unsubs.push(net.sub(this.base + '/c', function (m) { self.onMsg(m); }));
  this.unsubs.push(net.sub(this.base + '/i', function () {}));  // kendi bilgi yayınımız: bağlantı canlılığı için
  net.setRoom(this.code, this.game, this.status === 'play');
  net.roomHost = true;
  this.publishInfo();
  this.timer = setInterval(function () { self.tick(); }, 3000);
  this.tickN = 0;
}
KS.RoomHost = RoomHost;

RoomHost.prototype.info = function () {
  var a = [], i;
  for (i = 0; i < this.seats.length; i++) {
    var s = this.seats[i];
    a.push({ h: s.human ? 1 : 0, o: s.open ? 1 : 0, n: s.name, a: s.av, w: s.away ? 1 : 0 });
  }
  return a;
};
RoomHost.prototype.publishInfo = function () {
  this.net.pub(this.base + '/i', { g: this.game, n: this.n, opts: this.opts, tt: this.turnTime, s: this.info(), st: this.status, host: KS.S.id, ts: Date.now() }, { retain: true, qos: 1 });
  if (this.pub && this.status === 'lobby') {
    var f = 0, i;
    for (i = 0; i < this.seats.length; i++) if (!this.seats[i].open) f++;
    var p = this.net.profile();
    this.net.pub(R + '/t/' + this.code, { g: this.game, n: this.n, f: f, h: p.n, a: p.a, t: Date.now() }, { retain: true });
  } else if (this.pub) this.net.pub(R + '/t/' + this.code, '', { retain: true });
};
RoomHost.prototype.openCount = function () { var c = 0, i; for (i = 0; i < this.seats.length; i++) if (this.seats[i].open) c++; return c; };

RoomHost.prototype.onMsg = function (m) {
  if (this.closed || !m.pid || typeof m.t !== 'string') return;
  var pid = clean(m.pid, 12), i, seat = -1;
  if (pid === KS.S.id) return;
  this.seen[pid] = Date.now();
  for (i = 0; i < this.seats.length; i++) if (this.seats[i].human && this.seats[i].pid === pid) seat = i;
  if (m.t === 'join') {
    if (seat < 0) {
      if (this.status !== 'lobby') { this.net.pub(this.base + '/v/' + pid, { full: 1, ts: Date.now() }, { retain: true, qos: 1 }); return; }
      for (i = 0; i < this.seats.length; i++) if (this.seats[i].open) { seat = i; break; }
      if (seat < 0) { this.net.pub(this.base + '/v/' + pid, { full: 1, ts: Date.now() }, { retain: true, qos: 1 }); return; }
      this.seats[seat] = { human: true, open: false, name: clean(m.n, 14) || 'Oyuncu', av: clean(m.a, 4) || '🙂', pid: pid };
      if (this.lobbyCb) this.lobbyCb();
    } else {
      this.seats[seat].name = clean(m.n, 14) || this.seats[seat].name; this.seats[seat].av = clean(m.a, 4) || this.seats[seat].av;
    }
    this.seats[seat].left = false; this.seats[seat].timedOut = false;
    if (this.sess) { if (this.sess.miss) this.sess.miss[seat] = 0; this.sess.setAway(seat, false); } else this.seats[seat].away = false;
    this.publishInfo();
    this.pushView(seat, [], 'join');
    return;
  }
  if (seat < 0) return;
  if (this.seats[seat].away && this.sess) { this.seats[seat].timedOut = false; this.sess.miss[seat] = 0; this.sess.setAway(seat, false); }
  else this.seats[seat].away = false;
  if (m.t === 'hb') {
    if (this.sess && (+m.seq || 0) !== this.sess.seq) this.pushView(seat, [], 'sync');
    return;
  }
  if (m.t === 'leave') {
    if (this.status === 'lobby') {
      this.seats[seat] = { human: false, open: true, name: '', av: '', pid: '' };
      this.net.pub(this.base + '/v/' + pid, '', { retain: true });
      if (this.lobbyCb) this.lobbyCb();
      this.publishInfo();
    } else if (this.sess) { this.seats[seat].left = true; this.sess.setAway(seat, true); this.publishInfo(); }
    return;
  }
  if (!this.sess) return;
  if (m.t === 'act') {
    var id = +m.id || 0;
    if (id && id <= (this.lastId[pid] || 0)) { this.pushView(seat, [], 'ack'); return; }
    this.lastId[pid] = id; this.acks[pid] = id;
    var ok = this.sess.act(seat, m.a);
    if (!ok) this.pushView(seat, [], 'ack');
  } else if (m.t === 'ready') {
    this.sess.readyUp(seat);
  } else if (m.t === 'chat') {
    this.broadcastChat(seat, clean(m.m, 40));
  }
};

RoomHost.prototype.broadcastChat = function (seat, text) {
  if (!text) return;
  this.net.pub(this.base + '/x', { k: 'chat', s: seat, m: text, ts: Date.now() }, { qos: 0 });
  if (this.chatCb) this.chatCb(seat, text);
};

RoomHost.prototype.pushView = function (seat, ev, kind) {
  var s = this.seats[seat];
  if (!s || !s.human || s.pid === KS.S.id || !this.sess) return;
  var se = this.sess, i, ins = [];
  for (i = 0; i < se.n; i++) { var q = se.seats[i]; ins.push({ n: q.name, a: q.av, h: q.human ? 1 : 0, w: q.away ? 1 : 0 }); }
  this.net.pub(this.base + '/v/' + s.pid, {
    seq: se.seq, ack: this.acks[s.pid] || 0, seat: seat, g: this.game, n: se.n, view: se.view(seat), ev: ev, kind: kind,
    s: ins, dl: se.deadline, tt: se.turnTime, st: this.status, ts: Date.now()
  }, { retain: true, qos: 1 });
};
RoomHost.prototype.pushAll = function (ev, kind) {
  for (var i = 0; i < this.seats.length; i++) this.pushView(i, ev, kind);
};

RoomHost.prototype.hook = function () {
  var self = this;
  this.sess.saver = function (se) {
    KS.lsSet('hostroom', { code: self.code, game: self.game, n: self.n, opts: self.opts, turnTime: self.turnTime, seats: self.seats, snap: se.snapshot(), ts: Date.now() });
  };
  this.sess.on(function (ev, kind) { if (kind !== 'presence') self.pushAll(ev, kind); else { self.pushAll([], 'presence'); self.publishInfo(); } });
};

RoomHost.prototype.start = function () {
  if (this.sess) return this.sess;
  var i, used = {}, nm;
  for (i = 0; i < this.seats.length; i++) if (!this.seats[i].open) used[this.seats[i].name] = 1;
  for (i = 0; i < this.seats.length; i++) {
    if (this.seats[i].open) {
      do { nm = KS.pick(BOT_NAMES); } while (used[nm]);
      used[nm] = 1;
      this.seats[i] = { human: false, open: false, name: nm, av: KS.pick(KS.AVATARS), pid: '', level: this.level };
    }
  }
  this.status = 'play';
  this.sess = new KS.Session({ game: this.game, seats: this.seats, opts: this.opts, online: true, turnTime: this.turnTime });
  this.hook();
  this.net.setRoom(this.code, this.game, true);
  this.publishInfo();
  return this.sess;
};
RoomHost.prototype.go = function () { this.sess.start(); };

RoomHost.prototype.tick = function () {
  if (this.closed) return;
  var now = Date.now(), i;
  this.tickN++;
  if (this.sess) {
    for (i = 0; i < this.seats.length; i++) {
      var s = this.seats[i];
      if (!s.human || s.pid === KS.S.id) continue;
      var last = this.seen[s.pid] || 0;
      if (!s.away && now - last > 16000) { s.away = true; this.sess.setAway(i, true); }
    }
  } else {
    for (i = 1; i < this.seats.length; i++) {
      var q = this.seats[i];
      if (q.human && now - (this.seen[q.pid] || 0) > 30000) {
        this.seats[i] = { human: false, open: true, name: '', av: '', pid: '' };
        if (this.lobbyCb) this.lobbyCb();
      }
    }
  }
  if (this.tickN % 2 === 0) this.publishInfo();
  if (this.tickN % 7 === 0) this.net.publishPresence();
};

RoomHost.prototype.close = function (keepSave) {
  this.closed = true;
  clearInterval(this.timer);
  var i;
  this.net.pub(this.base + '/i', '', { retain: true });
  if (this.pub) this.net.pub(R + '/t/' + this.code, '', { retain: true });
  for (i = 0; i < this.seats.length; i++) if (this.seats[i].human && this.seats[i].pid !== KS.S.id) {
    this.net.pub(this.base + '/v/' + this.seats[i].pid, { bye: 1, ts: Date.now() }, { retain: true, qos: 1 });
  }
  for (i = 0; i < this.unsubs.length; i++) this.unsubs[i]();
  this.unsubs = [];
  if (!keepSave) KS.lsDel('hostroom');
  this.net.setRoom(null, '', false);
  this.net.roomHost = false;
};
RoomHost.prototype.link = function () { return location.href.split('#')[0].split('?')[0] + '#o=' + this.code; };

/* ====================== Oda konuğu ====================== */
function RoomClient(net, code) {
  var self = this;
  this.net = net; this.code = code.toUpperCase();
  this.base = R + '/r/' + this.code;
  this.info = null; this.msg = null; this.seq = -1;
  this.listeners = []; this.stateCb = null;
  this.actId = 0; this.pending = null;
  this.hostSeen = 0; this.joined = false; this.state = 'joining'; // joining | lobby | play | full | gone | bye
  this.unsubs = [];
  this.unsubs.push(net.sub(this.base + '/i', function (o) { self.onInfo(o); }));
  this.unsubs.push(net.sub(this.base + '/v/' + KS.S.id, function (o) { self.onView(o); }));
  this.unsubs.push(net.sub(this.base + '/x', function (o) { if (o.k === 'chat' && self.chatCb) self.chatCb(+o.s, clean(o.m, 40)); }));
  net.setRoom(this.code, '', false);
  this.sendJoin();
  this.timer = setInterval(function () { self.tick(); }, 2000);
  this.hbN = 0;
  this.t0 = Date.now();
  this.isOnline = true;
  this.game = '';
}
KS.RoomClient = RoomClient;
RoomClient.prototype.send = function (o) {
  o.pid = KS.S.id;
  return this.net.pub(this.base + '/c', o, { qos: 1 });
};
RoomClient.prototype.sendJoin = function () {
  var p = this.net.profile();
  this.send({ t: 'join', n: p.n, a: p.a });
};
RoomClient.prototype.onInfo = function (o) {
  this.hostSeen = Date.now();
  this.info = o; this.game = o.g; this.n = o.n;
  if (!this.joined) { if (this.state === 'joining') this.state = o.st === 'play' ? 'joining' : 'lobby'; }
  if (this.stateCb) this.stateCb();
};
RoomClient.prototype.onView = function (o) {
  if (o.full) { this.state = 'full'; if (this.stateCb) this.stateCb(); return; }
  if (o.bye) { this.state = 'bye'; if (this.stateCb) this.stateCb(); return; }
  this.hostSeen = Date.now();
  if (!this.joined) { this.joined = true; this.state = o.st === 'play' ? 'play' : 'lobby'; }
  if (o.st === 'play' && this.state !== 'play') this.state = 'play';
  this.seat = o.seat;
  if (o.view) {
    var first = !this.msg;
    var gap = this.seq >= 0 && o.seq > this.seq + 1;
    var isNew = o.seq !== this.seq;
    this.msg = o; this.game = o.g; this.n = o.n;
    if (this.pending && o.ack >= this.pending.id) this.pending = null;
    if (isNew) {
      this.seq = o.seq;
      var kind = first ? 'start' : (gap ? 'resync' : o.kind);
      var ev = (first || gap) ? [] : (o.ev || []);
      for (var i = 0; i < this.listeners.length; i++) this.listeners[i](ev, kind);
    } else {
      for (var j = 0; j < this.listeners.length; j++) this.listeners[j]([], 'sync');
    }
  }
  if (this.stateCb) this.stateCb();
};
RoomClient.prototype.tick = function () {
  this.hbN++;
  if (!this.joined) { if (this.hbN % 2 === 0 || this.hostSeen) this.sendJoin(); }
  else this.send({ t: 'hb', seq: this.seq });
  if (this.pending) {
    var m = this.msg;
    var stillMine = m && m.view && m.view.turn === this.seat && m.view.phase === 'play';
    if (!stillMine) this.pending = null; else this.send({ t: 'act', id: this.pending.id, a: this.pending.a });
  }
  if (this.msg && this.msg.view && this.msg.view.phase === 'handEnd' && this.wantReady) this.send({ t: 'ready' });
  if (!this.joined && Date.now() - this.t0 > 14000 && !this.hostSeen) { this.state = 'gone'; if (this.stateCb) this.stateCb(); }
  if (this.stateCb) this.stateCb();
};
RoomClient.prototype.on = function (fn) { this.listeners.push(fn); };
RoomClient.prototype.view = function () { return this.msg ? this.msg.view : null; };
RoomClient.prototype.info2 = function (s) {
  var q = this.msg && this.msg.s ? this.msg.s[s] : null;
  if (!q) return { name: '…', av: '🙂', bot: false, away: false, human: true };
  return { name: q.n, av: q.a, bot: !q.h, away: !!q.w && !!q.h, human: !!q.h };
};
RoomClient.prototype.act = function (a) {
  this.actId++;
  this.pending = { id: this.actId, a: a };
  this.send({ t: 'act', id: this.actId, a: a });
  return true;
};
RoomClient.prototype.ready = function () { this.wantReady = true; this.send({ t: 'ready' }); };
RoomClient.prototype.chat = function (m) { this.send({ t: 'chat', m: m }); };
RoomClient.prototype.deadline = function () { return this.msg ? this.msg.dl || 0 : 0; };
RoomClient.prototype.turnTime = function () { return this.msg ? this.msg.tt || 0 : 0; };
RoomClient.prototype.connState = function () {
  if (this.net.status !== 'online') return 'bad';
  if (this.hostSeen && Date.now() - this.hostSeen > 20000) return 'host';
  return 'ok';
};
RoomClient.prototype.gameOver = function () { return !!(this.msg && this.msg.view && this.msg.view.phase === 'gameEnd'); };
RoomClient.prototype.leave = function () { try { this.send({ t: 'leave' }); } catch (e) {} };
RoomClient.prototype.destroy = function () {
  clearInterval(this.timer);
  for (var i = 0; i < this.unsubs.length; i++) this.unsubs[i]();
  this.unsubs = []; this.listeners = [];
  this.net.setRoom(null, '', false);
};
Object.defineProperty(RoomClient.prototype, 'meSeat', { get: function () { return this.seat; } });

/* Arayüz için ortak ad: info(s) */
RoomClient.prototype.seatInfo = RoomClient.prototype.info2;

if (typeof module !== 'undefined' && module.exports) module.exports = Net;
})(typeof window !== 'undefined' ? window : globalThis);
