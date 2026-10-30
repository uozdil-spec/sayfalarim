/* Online katman: ücretsiz genel MQTT (WebSocket) aracıları üzerinden lobi, davet, oda ve sohbet.
   Oyun mantığı "ev sahibi" cihazda çalışır; diğer oyuncular hamlelerini ona gönderir. */
(function (root) {
'use strict';
var E = root.OkeyEngine, Table = root.OkeyTable;

var R = 'uozdil-okey/v1';
var BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://mqtt.eclipseprojects.io:443/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081'
];
var BOT_NAMES = ['Tekin', 'Pınar', 'Deniz', 'Kaan', 'Elif', 'Ece', 'Mert', 'Selin', 'Burak', 'Derya', 'Cem', 'Aylin'];

function clean(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); }
function rid(n) {
  var a = 'abcdefghijklmnopqrstuvwxyz0123456789', s = '';
  for (var i = 0; i < n; i++) s += a.charAt(Math.floor(Math.random() * a.length));
  return s;
}
function roomCode() {
  var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < 5; i++) s += a.charAt(Math.floor(Math.random() * a.length));
  return s;
}
function topicMatch(filter, topic) {
  var f = filter.split('/'), t = topic.split('/');
  for (var i = 0; i < f.length; i++) {
    if (f[i] === '#') return true;
    if (i >= t.length) return false;
    if (f[i] !== '+' && f[i] !== t[i]) return false;
  }
  return f.length === t.length;
}
function toStr(p) { return typeof p === 'string' ? p : (p && p.toString ? p.toString() : ''); }
function parse(p) { try { var o = JSON.parse(toStr(p)); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }

/* ====================== Net ====================== */
function Net(o) {
  this.lib = o.lib;
  this.id = o.id;
  this.name = clean(o.name, 14) || 'Oyuncu';
  this.av = clean(o.av, 4) || '🙂';
  this.brokers = o.brokers || BROKERS;
  this.cli = null;
  this.subs = [];
  this.status = 'idle';          // idle | connecting | online | offline
  this.state = 'idle';           // idle | table | playing (lobi durumu)
  this.presence = {};
  this.tables = {};
  this.cb = { status: function () {}, players: function () {}, tables: function () {}, chat: function () {}, invite: function () {} };
  this.lastChat = 0;
  this.timers = [];
  this.broker = '';
}

Net.prototype.setStatus = function (s, info) { this.status = s; this.cb.status(s, info); };

Net.prototype.connect = function () {
  var self = this, n = this.brokers.length, results = [], clients = [], decided = false, i;
  this.errors = {};
  this.setStatus('connecting');
  return new Promise(function (resolve, reject) {
    function fail(idx, why) {
      if (results[idx] !== undefined) return;
      results[idx] = false; self.errors[self.brokers[idx]] = why || 'error';
      try { clients[idx].end(true); } catch (e) {}
      check();
    }
    function check() {
      if (decided) return;
      for (var k = 0; k < n; k++) {
        if (results[k] === undefined) return;          // önce öncelikli sunucunun sonucunu bekle
        if (results[k] === true) { decided = true; choose(k); return; }
      }
      decided = true; self.setStatus('offline'); reject(new Error('no-broker'));
    }
    function choose(k) {
      for (var m = 0; m < n; m++) if (m !== k && clients[m]) { try { clients[m].end(true); } catch (e) {} }
      var c = clients[k];
      self.cli = c; self.broker = self.brokers[k];
      c.options.reconnectPeriod = 2500;
      self.attach();
      self.setStatus('online');
      resolve(self.broker);
    }
    function start(idx) {
      var url = self.brokers[idx], c;
      try {
        c = self.lib.connect(url, {
          clientId: 'ok_' + self.id + '_' + rid(4),
          clean: true, keepalive: 25, connectTimeout: 7000, reconnectPeriod: 0, protocolVersion: 4,
          will: { topic: R + '/p/' + self.id, payload: '', retain: true, qos: 0 }
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
};

Net.prototype.attach = function () {
  var self = this, c = this.cli;
  c.on('message', function (topic, payload) { self.route(topic, payload); });
  c.on('close', function () { if (self.status === 'online') self.setStatus('offline'); });
  c.on('reconnect', function () { self.setStatus('offline'); });
  c.on('connect', function () {
    if (self.status !== 'online') {
      self.setStatus('online');
      self.baseSubs();
      self.publishPresence();
      for (var i = 0; i < self.subs.length; i++) self.subs[i].on && self.subs[i].on();
    }
  });
  this.baseSubs();
  this.publishPresence();
  this.timers.push(setInterval(function () { self.publishPresence(); self.prune(); }, 30000));
  this.timers.push(setInterval(function () { self.prune(); }, 15000));
};

Net.prototype.baseSubs = function () {
  var c = this.cli;
  c.subscribe(R + '/p/+', { qos: 0 });
  c.subscribe(R + '/t/+', { qos: 0 });
  c.subscribe(R + '/lc', { qos: 0 });
  c.subscribe(R + '/i/' + this.id, { qos: 0 });
};

Net.prototype.route = function (topic, payload) {
  var i, o;
  if (topic.indexOf(R + '/p/') === 0) {
    var pid = topic.slice((R + '/p/').length);
    var s = toStr(payload);
    if (!s) { delete this.presence[pid]; this.cb.players(this.players()); return; }
    o = parse(s); if (!o || pid === this.id) return;
    this.presence[pid] = { id: pid, n: clean(o.n, 14) || '?', a: clean(o.a, 4) || '🙂', s: o.s === 'table' || o.s === 'playing' ? o.s : 'idle', t: +o.t || 0, rt: Date.now() };
    this.cb.players(this.players());
    return;
  }
  if (topic.indexOf(R + '/t/') === 0) {
    var code = topic.slice((R + '/t/').length);
    if (!toStr(payload)) { delete this.tables[code]; this.cb.tables(this.tableList()); return; }
    o = parse(payload); if (!o) return;
    this.tables[code] = { code: clean(code, 6), h: clean(o.h, 14), a: clean(o.a, 4), c: o.c || {}, f: +o.f || 1, t: +o.t || 0, hid: clean(o.hid, 20), rt: Date.now() };
    this.cb.tables(this.tableList());
    return;
  }
  if (topic === R + '/lc') {
    o = parse(payload); if (!o) return;
    this.cb.chat({ id: clean(o.id, 20), n: clean(o.n, 14) || '?', a: clean(o.a, 4), m: clean(o.m, 160), t: Date.now() });
    return;
  }
  if (topic === R + '/i/' + this.id) {
    o = parse(payload); if (!o || !o.from || !o.code) return;
    this.cb.invite({ id: clean(o.from.id, 20), n: clean(o.from.n, 14) || '?', a: clean(o.from.a, 4), code: clean(o.code, 6).toUpperCase() });
    return;
  }
  for (i = 0; i < this.subs.length; i++) {
    var sb = this.subs[i];
    if (topicMatch(sb.filter, topic)) { o = parse(payload); if (o) sb.fn(o, topic); }
  }
};

Net.prototype.sub = function (filter, fn) {
  var self = this, rec = { filter: filter, fn: fn, on: function () { if (self.cli) self.cli.subscribe(filter, { qos: 1 }); } };
  this.subs.push(rec);
  if (this.cli) rec.on();
  return function () {
    var k = self.subs.indexOf(rec);
    if (k >= 0) self.subs.splice(k, 1);
    if (self.cli) try { self.cli.unsubscribe(filter); } catch (e) {}
  };
};

Net.prototype.pub = function (topic, obj, opt) {
  if (!this.cli) return;
  var payload = obj === '' ? '' : JSON.stringify(obj);
  try { this.cli.publish(topic, payload, { qos: (opt && opt.qos) || 0, retain: !!(opt && opt.retain) }); } catch (e) {}
};

Net.prototype.setProfile = function (name, av) {
  this.name = clean(name, 14) || this.name;
  this.av = clean(av, 4) || this.av;
  this.publishPresence();
};
Net.prototype.setState = function (s) { this.state = s; this.publishPresence(); };
Net.prototype.publishPresence = function () {
  this.pub(R + '/p/' + this.id, { n: this.name, a: this.av, s: this.state, t: Date.now() }, { retain: true });
};
Net.prototype.prune = function () {
  var now = Date.now(), ch = false, k;
  for (k in this.presence) {
    var p = this.presence[k];
    if (now - p.rt > 100000) { delete this.presence[k]; ch = true; }
  }
  var ch2 = false;
  for (k in this.tables) {
    var tb = this.tables[k];
    if (now - tb.rt > 100000) { delete this.tables[k]; ch2 = true; }
  }
  if (ch) this.cb.players(this.players());
  if (ch2) this.cb.tables(this.tableList());
};
Net.prototype.players = function () {
  var a = [], k;
  for (k in this.presence) a.push(this.presence[k]);
  a.sort(function (x, y) { return (x.s === 'idle' ? 0 : 1) - (y.s === 'idle' ? 0 : 1) || x.n.localeCompare(y.n); });
  return a;
};
Net.prototype.tableList = function () {
  var a = [], k;
  for (k in this.tables) a.push(this.tables[k]);
  a.sort(function (x, y) { return y.t - x.t; });
  return a;
};
Net.prototype.sendLobbyChat = function (text) {
  var now = Date.now(), m = clean(text, 160);
  if (!m || now - this.lastChat < 1200) return false;
  this.lastChat = now;
  this.pub(R + '/lc', { id: this.id, n: this.name, a: this.av, m: m });
  return true;
};
Net.prototype.invite = function (targetId, code) {
  this.pub(R + '/i/' + targetId, { from: { id: this.id, n: this.name, a: this.av }, code: code });
};
Net.prototype.close = function () {
  for (var i = 0; i < this.timers.length; i++) clearInterval(this.timers[i]);
  this.timers = [];
  if (this.cli) {
    try { this.cli.publish(R + '/p/' + this.id, '', { retain: true }); } catch (e) {}
    try { this.cli.end(false); } catch (e) {}
  }
  this.cli = null;
  this.setStatus('idle');
};

/* ====================== Oda sahibi ====================== */
function RoomHost(net, o) {
  var self = this;
  this.net = net;
  this.code = roomCode();
  this.cfg = o.cfg;
  this.pubList = o.pub !== false;
  this.turnTime = o.turnTime === undefined ? 45 : o.turnTime;
  this.level = o.level || 'medium';
  this.speed = o.speed === undefined ? 1 : o.speed;
  this.state = 'lobby';
  this.seats = [
    { kind: 'me', name: net.name, av: net.av, id: net.id },
    { kind: 'open' }, { kind: 'open' }, { kind: 'open' }
  ];
  this.lastSeen = {};
  this.table = null;
  this.ready = {};
  this.cb = { lobby: function () {}, game: function () {}, chat: function () {}, closed: function () {}, notice: function () {} };
  this.unsubs = [];
  this.timers = [];
  this.closed = false;
  this.unsubs.push(net.sub(R + '/r/' + this.code + '/h', function (m) { self.onMsg(m); }));
  this.unsubs.push(net.sub(R + '/r/' + this.code + '/p', function (m) { if (m.t === 'chat') self.onChat(m); }));
  this.timers.push(setInterval(function () { self.watch(); }, 5000));
  net.setState('table');
  this.listing();
}

RoomHost.prototype.base = function () { return R + '/r/' + this.code; };
RoomHost.prototype.info = function () {
  return {
    code: this.code, state: this.state, cfg: this.cfg, pub: this.pubList, turnTime: this.turnTime, level: this.level,
    seats: this.seats.map(function (s) { return { kind: s.kind, name: s.name || '', av: s.av || '', level: s.level || '' }; })
  };
};
RoomHost.prototype.filled = function () {
  var n = 0; for (var i = 0; i < 4; i++) if (this.seats[i].kind === 'me' || this.seats[i].kind === 'remote') n++;
  return n;
};
RoomHost.prototype.listing = function () {
  var topic = R + '/t/' + this.code;
  if (this.closed || this.state !== 'lobby' || !this.pubList) { this.net.pub(topic, '', { retain: true }); return; }
  this.net.pub(topic, { h: this.net.name, a: this.net.av, hid: this.net.id, c: { p: !!this.cfg.partner, ty: this.cfg.type, v: this.cfg.value }, f: this.filled(), t: Date.now() }, { retain: true });
};
RoomHost.prototype.pushLobby = function () {
  var inf = this.info();
  this.cb.lobby(inf);
  this.net.pub(this.base() + '/p', { t: 'lobby', info: inf });
  this.listing();
};
RoomHost.prototype.setOpts = function (o) {
  if (this.state !== 'lobby') return;
  if (o.cfg) this.cfg = o.cfg;
  if (o.pub !== undefined) this.pubList = !!o.pub;
  if (o.turnTime !== undefined) this.turnTime = o.turnTime;
  if (o.level) this.level = o.level;
  this.pushLobby();
};
RoomHost.prototype.invite = function (targetId) { this.net.invite(targetId, this.code); };
RoomHost.prototype.kick = function (i) {
  var s = this.seats[i];
  if (!s || s.kind !== 'remote') return;
  this.net.pub(this.base() + '/c/' + s.id, { t: 'closed', why: 'kick' });
  this.seats[i] = { kind: 'open' };
  this.pushLobby();
};
RoomHost.prototype.setBot = function (i, on) {
  if (this.state !== 'lobby' || i < 1) return;
  var s = this.seats[i];
  if (s.kind === 'remote') return;
  this.seats[i] = on ? { kind: 'bot', name: this.pickName(), av: '🤖', level: this.level } : { kind: 'open' };
  this.pushLobby();
};
RoomHost.prototype.pickName = function () {
  var used = this.seats.map(function (s) { return s.name; }), n, k = 0;
  do { n = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]; } while (used.indexOf(n) >= 0 && k++ < 30);
  return n;
};
RoomHost.prototype.onMsg = function (m) {
  if (this.closed || !m || !m.t) return;
  var id = clean(m.id, 24), i;
  if (id) this.lastSeen[id] = Date.now();
  if (m.t === 'join') return this.onJoin(id, clean(m.n, 14) || 'Oyuncu', clean(m.a, 4) || '🙂');
  var seat = -1;
  for (i = 0; i < 4; i++) if (this.seats[i].kind === 'remote' && this.seats[i].id === id) seat = i;
  if (seat < 0) return;
  if (m.t === 'hb') return;
  if (m.t === 'leave') return this.dropSeat(seat, 'left');
  if (m.t === 'sync') return this.sendState(seat, { t: 'sync' });
  if (m.t === 'ready') return this.markReady(seat);
  if (m.t === 'act' && this.table) {
    var a = m.a;
    if (!a || (a.t !== 'draw' && a.t !== 'discard' && a.t !== 'finish')) return;
    var r = this.table.act(seat, { t: a.t, from: a.from === 'discard' ? 'discard' : 'pile', tile: +a.tile });
    if (!r.ok) this.sendState(seat, { t: 'sync' });
  }
};
RoomHost.prototype.onJoin = function (id, name, av) {
  var i, seat = -1;
  if (!id) return;
  for (i = 1; i < 4; i++) if (this.seats[i].id === id) seat = i;            // yeniden bağlanma
  if (seat < 0 && this.state === 'lobby') {
    for (i = 1; i < 4; i++) if (this.seats[i].kind === 'open' || this.seats[i].kind === 'bot' && this.seats[i].level !== undefined && false) { seat = i; break; }
    if (seat < 0) for (i = 1; i < 4; i++) if (this.seats[i].kind === 'bot') { seat = i; break; }   // bot yerine insan
  }
  if (seat < 0) { this.net.pub(this.base() + '/c/' + id, { t: 'full' }); return; }
  var prev = this.seats[seat];
  if (this.state === 'playing' && prev.kind === 'bot' && prev.id === id) {
    // oyun sırasında geri dönen oyuncu yerini alır
    prev.kind = 'remote'; prev.name = name; prev.av = av; delete prev.level;
    this.table.seats[seat] = { kind: 'remote', name: name, av: av, cid: id };
    this.lastSeen[id] = Date.now();
    this.net.pub(this.base() + '/c/' + id, { t: 'seat', seat: seat, info: this.info() });
    this.sendState(seat, { t: 'sync' });
    this.table.emit({ t: 'meta' });
    return;
  }
  this.seats[seat] = { kind: 'remote', name: name, av: av, id: id };
  this.lastSeen[id] = Date.now();
  this.net.pub(this.base() + '/c/' + id, { t: 'seat', seat: seat, info: this.info() });
  if (this.state === 'lobby') this.pushLobby();
  else this.sendState(seat, { t: 'sync' });
};
RoomHost.prototype.watch = function () {
  if (this.closed) return;
  var now = Date.now();
  this.lt = (this.lt || 0) + 1;
  if (this.lt % 6 === 0) this.listing();
  for (var i = 1; i < 4; i++) {
    var s = this.seats[i];
    if (s.kind === 'remote' && now - (this.lastSeen[s.id] || 0) > 25000) this.dropSeat(i, 'timeout');
  }
};
RoomHost.prototype.dropSeat = function (i, why) {
  var s = this.seats[i];
  if (!s || s.kind !== 'remote') return;
  this.cb.notice({ t: 'left', name: s.name, why: why });
  if (this.state === 'lobby') { this.seats[i] = { kind: 'open' }; this.pushLobby(); return; }
  // oyun sürüyor: yerine bilgisayar oturur; geri dönerse yerini alabilir
  var id = s.id;
  this.seats[i] = { kind: 'bot', name: s.name, av: '🤖', level: this.level, id: id };
  this.table.seats[i] = { kind: 'bot', name: s.name, av: '🤖', level: this.level };
  this.table.emit({ t: 'meta' });
  this.table.schedule(true);
};
RoomHost.prototype.canStart = function () { return this.state === 'lobby'; };
RoomHost.prototype.start = function () {
  if (this.state !== 'lobby') return false;
  var i, seats = [];
  for (i = 0; i < 4; i++) {
    var s = this.seats[i];
    if (s.kind === 'open') { s = this.seats[i] = { kind: 'bot', name: this.pickName(), av: '🤖', level: this.level }; }
    if (s.kind === 'me') seats.push({ kind: 'human', name: s.name, av: s.av });
    else if (s.kind === 'remote') seats.push({ kind: 'remote', name: s.name, av: s.av, cid: s.id });
    else seats.push({ kind: 'bot', name: s.name, av: s.av, level: s.level || this.level });
  }
  this.state = 'playing';
  this.listing();
  this.net.setState('playing');
  this.startTable(seats);
  return true;
};
RoomHost.prototype.startTable = function (seats) {
  var self = this;
  if (this.table) this.table.destroy();
  this.table = new Table({ cfg: this.cfg, seats: seats, speed: this.speed, turnTime: this.turnTime });
  this.table.on(function (ev) { self.onTable(ev); });
  this.table.start();
};
RoomHost.prototype.rematch = function () {
  if (this.state !== 'playing' || !this.table || this.table.m.status !== 'matchEnd') return;
  var seats = this.table.seats.map(function (s) { return { kind: s.kind, name: s.name, av: s.av, level: s.level, cid: s.cid }; });
  this.ready = {};
  this.startTable(seats);
};
RoomHost.prototype.sanitize = function (ev, seat) {
  var o = {}, k;
  for (k in ev) o[k] = ev[k];
  if (ev.t === 'draw' && ev.seat !== seat) delete o.real;
  if (ev.t === 'finish' || ev.t === 'discard' || ev.t === 'draw') o.seat = ev.seat;
  return o;
};
RoomHost.prototype.onTable = function (ev) {
  var i, t = this.table;
  for (i = 0; i < 4; i++) {
    var s = t.seats[i];
    if (s.kind === 'human') this.cb.game(t.view(i), ev, t.meta(), i);
    else if (s.kind === 'remote') this.sendState(i, ev);
  }
  if (t.m.status === 'handEnd') this.startReadyTimer();
};
RoomHost.prototype.sendState = function (seat, ev) {
  var t = this.table, s = t && t.seats[seat];
  if (!t || !s || s.kind !== 'remote') return;
  this.net.pub(this.base() + '/c/' + s.cid, { t: 'st', v: t.view(seat), ev: this.sanitize(ev || { t: 'sync' }, seat), meta: t.meta(), seat: seat }, { qos: 1 });
};
RoomHost.prototype.startReadyTimer = function () {
  var self = this;
  this.ready = {};
  if (this.readyTimer) clearTimeout(this.readyTimer);
  this.readyTimer = setTimeout(function () { self.advance(); }, 20000);
};
RoomHost.prototype.markReady = function (seat) {
  if (!this.table || this.table.m.status !== 'handEnd') return;
  this.ready[seat] = true;
  var all = true;
  for (var i = 0; i < 4; i++) {
    var k = this.table.seats[i].kind;
    if ((k === 'human' || k === 'remote') && !this.ready[i]) all = false;
  }
  if (all) this.advance();
};
RoomHost.prototype.advance = function () {
  if (this.readyTimer) { clearTimeout(this.readyTimer); this.readyTimer = null; }
  if (this.table && this.table.m.status === 'handEnd') this.table.nextHand();
};
/* Yerel oyuncu (koltuk 0) eylemleri */
RoomHost.prototype.act = function (a) { return this.table ? this.table.act(0, a) : { ok: false }; };
RoomHost.prototype.localReady = function () { this.markReady(0); };
RoomHost.prototype.onChat = function (m) {
  this.cb.chat({ id: clean(m.id, 24), n: clean(m.n, 14), m: clean(m.m, 160), s: +m.s, e: !!m.e, t: Date.now() });
};
RoomHost.prototype.sendChat = function (text, emo) {
  var m = clean(text, 160);
  if (!m) return false;
  var now = Date.now();
  if (now - (this.lastChat || 0) < 900) return false;
  this.lastChat = now;
  this.net.pub(this.base() + '/p', { t: 'chat', id: this.net.id, n: this.net.name, m: m, s: 0, e: !!emo });
  return true;
};
RoomHost.prototype.leave = function () {
  if (this.closed) return;
  this.closed = true;
  this.net.pub(this.base() + '/p', { t: 'closed' });
  for (var i = 1; i < 4; i++) if (this.seats[i].kind === 'remote') this.net.pub(this.base() + '/c/' + this.seats[i].id, { t: 'closed', why: 'host' });
  this.net.pub(R + '/t/' + this.code, '', { retain: true });
  for (i = 0; i < this.unsubs.length; i++) this.unsubs[i]();
  for (i = 0; i < this.timers.length; i++) clearInterval(this.timers[i]);
  if (this.readyTimer) clearTimeout(this.readyTimer);
  if (this.table) this.table.destroy();
  this.net.setState('idle');
};

/* ====================== Oda istemcisi ====================== */
function RoomClient(net, code) {
  var self = this;
  this.net = net;
  this.code = clean(code, 6).toUpperCase();
  this.seat = -1;
  this.cb = { lobby: function () {}, game: function () {}, chat: function () {}, closed: function () {} };
  this.unsubs = [];
  this.timers = [];
  this.joined = false;
  this.closed = false;
  this.lastMsg = Date.now();
  this.last = null;
  var b = R + '/r/' + this.code;
  this.unsubs.push(net.sub(b + '/c/' + net.id, function (m) { self.onMsg(m); }));
  this.unsubs.push(net.sub(b + '/p', function (m) { self.onPub(m); }));
}
RoomClient.prototype.base = function () { return R + '/r/' + this.code; };
RoomClient.prototype.join = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    var tries = 0, done = false;
    function send() {
      self.net.pub(self.base() + '/h', { t: 'join', id: self.net.id, n: self.net.name, a: self.net.av }, { qos: 1 });
    }
    self.joinRes = function (ok, why) { if (done) return; done = true; clearInterval(iv); ok ? resolve() : reject(new Error(why)); };
    var iv = setInterval(function () {
      if (done) return;
      if (++tries >= 5) { done = true; clearInterval(iv); reject(new Error('notfound')); return; }
      send();
    }, 1800);
    send();
    self.timers.push(setInterval(function () {
      if (self.closed) return;
      self.net.pub(self.base() + '/h', { t: 'hb', id: self.net.id });
      if (self.joined && Date.now() - self.lastMsg > 45000) self.end('timeout');
    }, 6000));
    self.net.setState('table');
  });
};
RoomClient.prototype.rejoin = function () {
  if (this.joined && !this.closed) this.net.pub(this.base() + '/h', { t: 'join', id: this.net.id, n: this.net.name, a: this.net.av }, { qos: 1 });
};
RoomClient.prototype.onMsg = function (m) {
  this.lastMsg = Date.now();
  if (m.t === 'full') { if (this.joinRes) this.joinRes(false, 'full'); return; }
  if (m.t === 'seat') {
    this.seat = +m.seat; this.joined = true;
    this.cb.lobby(m.info);
    if (this.joinRes) this.joinRes(true);
    return;
  }
  if (m.t === 'st') {
    this.seat = +m.seat;
    this.last = m;
    this.cb.game(m.v, m.ev, m.meta, this.seat);
    return;
  }
  if (m.t === 'closed') return this.end(m.why || 'host');
};
RoomClient.prototype.onPub = function (m) {
  this.lastMsg = Date.now();
  if (m.t === 'lobby') { this.cb.lobby(m.info); return; }
  if (m.t === 'chat') { this.cb.chat({ id: clean(m.id, 24), n: clean(m.n, 14), m: clean(m.m, 160), s: +m.s, e: !!m.e, t: Date.now() }); return; }
  if (m.t === 'closed') return this.end('host');
};
RoomClient.prototype.end = function (why) {
  if (this.closed) return;
  this.closed = true;
  this.cleanup();
  this.cb.closed(why);
};
RoomClient.prototype.cleanup = function () {
  for (var i = 0; i < this.unsubs.length; i++) this.unsubs[i]();
  for (i = 0; i < this.timers.length; i++) clearInterval(this.timers[i]);
  this.unsubs = []; this.timers = [];
  this.net.setState('idle');
};
RoomClient.prototype.act = function (a) { this.net.pub(this.base() + '/h', { t: 'act', id: this.net.id, a: a }, { qos: 1 }); };
RoomClient.prototype.ready = function () { this.net.pub(this.base() + '/h', { t: 'ready', id: this.net.id }, { qos: 1 }); };
RoomClient.prototype.sync = function () { this.net.pub(this.base() + '/h', { t: 'sync', id: this.net.id }); };
RoomClient.prototype.sendChat = function (text, emo) {
  var m = clean(text, 160), now = Date.now();
  if (!m || now - (this.lastChat || 0) < 900) return false;
  this.lastChat = now;
  this.net.pub(this.base() + '/p', { t: 'chat', id: this.net.id, n: this.net.name, m: m, s: this.seat, e: !!emo });
  return true;
};
RoomClient.prototype.leave = function () {
  if (this.closed) return;
  this.net.pub(this.base() + '/h', { t: 'leave', id: this.net.id });
  this.closed = true;
  this.cleanup();
};

root.OkeyNet = { Net: Net, RoomHost: RoomHost, RoomClient: RoomClient, BROKERS: BROKERS, clean: clean, rid: rid, topicMatch: topicMatch };
if (typeof module !== 'undefined' && module.exports) module.exports = root.OkeyNet;
})(typeof window !== 'undefined' ? window : globalThis);
