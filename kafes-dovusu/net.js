/* Kafes Dövüşü · çevrimiçi katman.
   Kart Salonu ile aynı mantık: genel MQTT (WebSocket) aracıları, 8 harfli arkadaş kodu, arkadaş listesi (aynı tarayıcı deposu üzerinden
   Kart Salonu ile ortak), davet ve açık odalar. Düello "ev sahibi" cihazda yürür, konuk girdi yollar ve durum alır. */
(function (root) {
'use strict';
var KF = root.KF = root.KF || {};
var RF = 'ksl1', RK = 'kfd1';
var BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://mqtt.eclipseprojects.io:443/mqtt', 'wss://test.mosquitto.org:8081'];
KF.CODEA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
KF.clean = function (s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); };
KF.rid = function (n, a) { a = a || 'abcdefghijklmnopqrstuvwxyz0123456789'; var s = '', i; for (i = 0; i < n; i++) s += a.charAt(Math.floor(Math.random() * a.length)); return s; };
var clean = KF.clean;
function lsg(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function lss(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
KF.ks = { get: function (k, d) { return lsg('kartsalonu.' + k, d); }, set: function (k, v) { lss('kartsalonu.' + k, v); } };
KF.AVATARS = ['🙂', '😎', '🤠', '🦊', '🐻', '🦁', '🐯', '🐼', '🦉', '🐺', '🎩', '👑', '🌙', '⭐', '🔥', '🍀'];

/* ---- profil: ad, simge ve kod Kart Salonu ile ortak ---- */
/* sonradan eklenen ayarlar: performans, kontrol düzeni, erişilebilirlik, başarımlar */
KF.XK = { perf: 'auto', fps30: false, swap: false, bsz: 1, bop: 1, bh: 14, spb: true, fz: 0, cb: false, ab: true, rng: true, ach: {}, daily: {}, skin: '', best3: 0, wonWith: {}, tot: { hit: 0, blk: 0, dg: 0, cmb: 0, kd: 0 } };
KF.loadProfile = function () {
  var s = KF.ks.get('settings', {}), o = lsg('kafes.s', {});
  KF.S = { id: s.id || '', name: s.name || '', av: s.av || '🙂', look: o.look || 'muhendis', oled: o.oled !== false, shiftEvery: o.shiftEvery || 60,
    idleDim: o.idleDim == null ? 90 : o.idleDim, sfx: o.sfx !== false, vib: o.vib !== false, seen: !!o.seen, best: o.best || 0, wins: o.wins || 0, losses: o.losses || 0,
    dif: o.dif || 'easy', guide: o.guide !== false, trained: !!o.trained, assist: Math.max(0, Math.min(3, +o.assist || 0)), gloves: !!o.gloves, picked: !!o.picked, autofs: o.autofs !== false };
  var k; for (k in KF.XK) KF.S[k] = o[k] !== undefined ? o[k] : (typeof KF.XK[k] === 'object' ? JSON.parse(JSON.stringify(KF.XK[k])) : KF.XK[k]);
  if (root.GFX) { root.GFX.GLOVES = KF.S.gloves; root.GFX.CB = !!KF.S.cb; }
  if (!KF.S.id) { KF.S.id = KF.rid(8, KF.CODEA); KF.saveProfile(); }
};
KF.saveProfile = function () {
  var s = KF.ks.get('settings', {}), S = KF.S;
  s.id = S.id; s.name = S.name; s.av = S.av; KF.ks.set('settings', s);
  lss('kafes.s', { name: S.name, look: S.look, oled: S.oled, shiftEvery: S.shiftEvery, idleDim: S.idleDim, sfx: S.sfx, vib: S.vib, seen: S.seen, best: S.best, wins: S.wins, losses: S.losses, dif: S.dif, guide: S.guide, trained: S.trained, assist: S.assist || 0, gloves: !!S.gloves, picked: !!S.picked, autofs: S.autofs !== false });
  var o = lsg('kafes.s', {}), k; for (k in KF.XK) o[k] = S[k]; lss('kafes.s', o);
};
function toStr(p) { return typeof p === 'string' ? p : (p && p.toString ? p.toString() : ''); }
function parse(p) { try { var o = JSON.parse(toStr(p)); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }
function match(filter, topic) {
  var f = filter.split('/'), t = topic.split('/'), i;
  for (i = 0; i < f.length; i++) { if (f[i] === '#') return true; if (i >= t.length) return false; if (f[i] !== '+' && f[i] !== t[i]) return false; }
  return f.length === t.length;
}

function mkPeer(id) {
  if (!root.Peer) return null;
  try { var o = { debug: 0 }, k, ov = root.KF_PEER || {}; for (k in ov) o[k] = ov[k]; return id ? new root.Peer(id, o) : new root.Peer(o); } catch (e) { return null; }
}
KF.hasP2P = function () { return !!root.Peer; };

function Net() {
  this.cli = null; this.errs = {}; this.status = 'idle'; this.subs = []; this.presence = {}; this.tables = {};
  this.reqs = KF.ks.get('reqs', {}); this.sent = KF.ks.get('sent', {}); this.invites = [];
  this.state = 'on'; this.connecting = null; this.timers = []; this.wanted = false;
  var self = this;
  function wake() { if (self.wanted) self.ensure(); }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') wake(); });
  root.addEventListener('online', wake); root.addEventListener('pageshow', wake);
  root.addEventListener('offline', function () { self.setStatus('offline'); });
}
KF.Net = Net;
Net.prototype.setStatus = function (s) { if (this.status === s) return; this.status = s; if (this.onStatus) this.onStatus(s); };
Net.prototype.profile = function () { return { n: clean(KF.S.name, 14) || 'Oyuncu', a: KF.S.av || '🙂', l: KF.S.look }; };
Net.prototype.start = function () {
  var self = this;
  this.wanted = true;
  if (this.connecting) return this.connecting;
  if (this.cli && this.cli.connected) return Promise.resolve();
  if (!root.mqtt) return Promise.reject(new Error('no-lib'));
  if (this.cli && !this.cli.connected) { try { this.cli.end(true); } catch (e) {} this.cli = null; }
  this.setStatus('connecting');
  this.errs = {};
  this.connecting = new Promise(function (resolve, reject) {
    var n = BROKERS.length, res = [], cl = [], done = false;
    function check() {
      if (done) return;
      for (var k = 0; k < n; k++) { if (res[k] === undefined) return; if (res[k] === true) { done = true; choose(k); return; } }
      done = true; self.connecting = null; self.setStatus('offline'); reject(new Error('no-broker'));
    }
    function fail(i, why) { if (res[i] !== undefined) return; res[i] = false; self.errs[BROKERS[i].replace(/^wss?:\/\//, '').split('/')[0]] = why || 'kapalı'; try { cl[i].end(true); } catch (e) {} check(); }
    function choose(k) {
      for (var m = 0; m < n; m++) if (m !== k && cl[m]) { try { cl[m].end(true); } catch (e) {} }
      self.cli = cl[k]; self.cli.options.reconnectPeriod = 2000; self.attach(); self.connecting = null; resolve();
    }
    BROKERS.forEach(function (url, i) {
      var c;
      try {
        c = root.mqtt.connect(url, { clientId: 'kfd_' + KF.S.id + '_' + KF.rid(4), clean: true, keepalive: 20, connectTimeout: 7000, reconnectPeriod: 0, protocolVersion: 4,
          will: { topic: RK + '/p/' + KF.S.id, payload: JSON.stringify({ st: 'off' }), retain: true, qos: 0 } });
      } catch (e) { res[i] = false; return; }
      cl[i] = c;
      var to = setTimeout(function () { fail(i, 'zaman aşımı'); }, 8500);
      c.on('connect', function () { clearTimeout(to); if (res[i] === undefined) { res[i] = true; check(); } });
      c.on('error', function (e) { clearTimeout(to); fail(i, String(e && e.message || 'hata').slice(0, 30)); });
      c.on('close', function () { clearTimeout(to); fail(i, 'kapandı'); });
    });
    check();
  });
  return this.connecting;
};
Net.prototype.attach = function () {
  var self = this, c = this.cli;
  c.on('message', function (t, p) { self.route(t, p); });
  c.on('close', function () { if (self.status === 'online') self.setStatus('offline'); });
  c.on('offline', function () { self.setStatus('offline'); });
  c.on('connect', function () { self.onUp(); });
  this.onUp();
  this.timers.forEach(clearInterval);
  this.timers = [setInterval(function () { if (self.status === 'online') self.publishPresence(); }, 25000)];
};
Net.prototype.ensure = function () {
  if (this.connecting) return;
  if (!this.cli) { this.start().catch(function () {}); return; }
  if (!this.cli.connected) { try { this.cli.reconnect(); } catch (e) {} }
  else if (this.status !== 'online') this.onUp();   /* hat aslında açık: durumu düzelt */
};
Net.prototype.onUp = function () {
  var c = this.cli, id = KF.S.id, k, i;
  this.setStatus('online');
  c.subscribe(RF + '/in/' + id + '/+/+', { qos: 1 });
  c.subscribe(RK + '/in/' + id + '/+/+', { qos: 1 });
  for (k in this.friends()) c.subscribe(RK + '/p/' + k, { qos: 0 });
  for (k in this.sent) c.subscribe(RK + '/p/' + k, { qos: 0 });
  for (i = 0; i < this.subs.length; i++) this.subs[i].on();
  this.publishPresence();
};
Net.prototype.sub = function (filter, fn) {
  var self = this, rec = { filter: filter, fn: fn, on: function () { if (self.cli && self.cli.connected) self.cli.subscribe(filter, { qos: 1 }); } };
  this.subs.push(rec); rec.on();
  return function () { var k = self.subs.indexOf(rec); if (k >= 0) self.subs.splice(k, 1); if (self.cli) try { self.cli.unsubscribe(filter); } catch (e) {} };
};
Net.prototype.pub = function (topic, obj, opt) {
  if (!this.cli) return false;
  var payload = obj === '' ? '' : JSON.stringify(obj);
  try { this.cli.publish(topic, payload, { qos: (opt && opt.qos) || 0, retain: !!(opt && opt.retain) }); return true; } catch (e) { return false; }
};
Net.prototype.route = function (topic, payload) {
  var s = toStr(payload), o, i, id = KF.S.id;
  if (topic.indexOf(RK + '/p/') === 0) {
    var pid = topic.slice((RK + '/p/').length); o = s ? parse(s) : null;
    if (!o || o.st === 'off') delete this.presence[pid]; else this.presence[pid] = { n: clean(o.n, 14), a: clean(o.a, 4), st: o.st === 'busy' ? 'busy' : 'on', t: Date.now() };
    if (this.onFriends) this.onFriends();
  } else if (topic.indexOf(RF + '/in/' + id + '/') === 0 || topic.indexOf(RK + '/in/' + id + '/') === 0) {
    var parts = topic.split('/'), from = parts[3], kind = parts[4];
    if (s && from !== id && (o = parse(s))) this.onInbox(from, kind, o, topic, parts[0]);
  } else if (topic.indexOf(RK + '/t/') === 0) {
    var code = topic.slice((RK + '/t/').length); o = s ? parse(s) : null;
    if (!o) delete this.tables[code]; else this.tables[code] = { code: clean(code, 6), h: clean(o.h, 14), a: clean(o.a, 4), t: +o.t || 0, host: clean(o.host, 8), rt: Date.now() };
    if (this.onTables) this.onTables();
  }
  for (i = 0; i < this.subs.length; i++) if (match(this.subs[i].filter, topic)) { o = parse(payload); if (o) this.subs[i].fn(o, topic); }
};
Net.prototype.publishPresence = function () { var p = this.profile(); this.pub(RK + '/p/' + KF.S.id, { n: p.n, a: p.a, st: this.state }, { retain: true }); };
Net.prototype.setBusy = function (b) { this.state = b ? 'busy' : 'on'; this.publishPresence(); };

/* ---- arkadaşlar (Kart Salonu ile ortak depo) ---- */
Net.prototype.friends = function () { return KF.ks.get('friends', {}); };
Net.prototype.addFriendLocal = function (id, n, a) {
  var f = this.friends();
  f[id] = { n: clean(n, 14) || (f[id] && f[id].n) || '?', a: clean(a, 4) || (f[id] && f[id].a) || '🙂' };
  KF.ks.set('friends', f);
  if (this.cli && this.cli.connected) this.cli.subscribe(RK + '/p/' + id, { qos: 0 });
};
Net.prototype.removeFriend = function (id) {
  var f = this.friends(); delete f[id]; KF.ks.set('friends', f); delete this.presence[id];
  if (this.cli) try { this.cli.unsubscribe(RK + '/p/' + id); } catch (e) {}
  this.pub(RF + '/in/' + id + '/' + KF.S.id + '/rm', { t: 'rm', ts: Date.now() }, { qos: 1 });
};
Net.prototype.request = function (id) {
  id = String(id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (id.length !== 8) return 'bad';
  if (id === KF.S.id) return 'self';
  if (this.friends()[id]) return 'have';
  var p = this.profile();
  this.sent[id] = { ts: Date.now() }; KF.ks.set('sent', this.sent);
  this.pub(RF + '/in/' + id + '/' + KF.S.id + '/req', { t: 'req', n: p.n, a: p.a, ts: Date.now() }, { qos: 1, retain: true });
  if (this.cli && this.cli.connected) this.cli.subscribe(RK + '/p/' + id, { qos: 0 });
  return 'ok';
};
Net.prototype.accept = function (id) {
  var r = this.reqs[id]; if (!r) return;
  this.addFriendLocal(id, r.n, r.a);
  var p = this.profile();
  this.pub(RF + '/in/' + id + '/' + KF.S.id + '/acc', { t: 'acc', n: p.n, a: p.a, ts: Date.now() }, { qos: 1, retain: true });
  this.dropReq(id);
};
Net.prototype.dropReq = function (id) {
  delete this.reqs[id]; KF.ks.set('reqs', this.reqs);
  this.pub(RF + '/in/' + KF.S.id + '/' + id + '/req', '', { qos: 1, retain: true });
  if (this.onFriends) this.onFriends();
};
Net.prototype.onInbox = function (from, kind, o, topic, root0) {
  var clear = function (self) { if (self.cli) self.cli.publish(topic, '', { qos: 1, retain: true }); };
  if (root0 === RF) {
    if (kind === 'req') {
      if (this.friends()[from]) { this.accept2(from); return; }
      this.reqs[from] = { n: clean(o.n, 14) || '?', a: clean(o.a, 4) || '🙂', ts: +o.ts || 0 }; KF.ks.set('reqs', this.reqs);
      if (this.onRequest) this.onRequest(from, this.reqs[from]);
    } else if (kind === 'acc') {
      this.addFriendLocal(from, o.n, o.a); delete this.sent[from]; KF.ks.set('sent', this.sent); clear(this);
      if (this.onFriends) this.onFriends();
      if (this.onToast) this.onToast((clean(o.n, 14) || 'Oyuncu') + ' arkadaşlık isteğini kabul etti');
    } else if (kind === 'rm') {
      var f = this.friends(); if (f[from]) { delete f[from]; KF.ks.set('friends', f); if (this.onFriends) this.onFriends(); } clear(this);
    }
  } else if (kind === 'inv') {
    if (Date.now() - (+o.ts || 0) > 15 * 60000) { clear(this); return; }
    var fr = this.friends()[from];
    var inv = { from: from, n: fr ? fr.n : clean(o.n, 14), a: fr ? fr.a : clean(o.a, 4), code: clean(o.code, 6).toUpperCase(), ts: +o.ts };
    this.invites = this.invites.filter(function (x) { return x.from !== from; }); this.invites.push(inv); clear(this);
    if (this.onInvite) this.onInvite(inv);
  }
};
Net.prototype.accept2 = function (id) {
  var p = this.profile();
  this.pub(RF + '/in/' + id + '/' + KF.S.id + '/acc', { t: 'acc', n: p.n, a: p.a, ts: Date.now() }, { qos: 1, retain: true });
  this.pub(RF + '/in/' + KF.S.id + '/' + id + '/req', '', { qos: 1, retain: true });
};
Net.prototype.invite = function (fid, code) {
  var p = this.profile();
  this.pub(RK + '/in/' + fid + '/' + KF.S.id + '/inv', { t: 'inv', code: code, n: p.n, a: p.a, ts: Date.now() }, { qos: 1, retain: true });
};
/* ---- açık odalar (hızlı eşleşme) ---- */
Net.prototype.watchTables = function (on) {
  var self = this;
  if (on) {
    if (this.tUnsub) return;
    this.tUnsub = this.sub(RK + '/t/+', function () {});
    this.tTimer = setInterval(function () {
      var now = Date.now(), ch = false, k;
      for (k in self.tables) if (now - self.tables[k].rt > 75000) { delete self.tables[k]; ch = true; }
      if (ch && self.onTables) self.onTables();
    }, 10000);
  } else { if (this.tUnsub) { this.tUnsub(); this.tUnsub = null; } clearInterval(this.tTimer); this.tables = {}; }
};
Net.prototype.openTables = function () {
  var a = [], k, now = Date.now();
  for (k in this.tables) if (this.tables[k].host !== KF.S.id && now - this.tables[k].rt < 75000) a.push(this.tables[k]);
  a.sort(function (x, y) { return y.t - x.t; }); return a;
};

/* ====================== Oda sahibi ====================== */
function Host(net, pub) {
  var self = this;
  this.net = net; this.pubRoom = !!pub; this.code = KF.rid(5, KF.CODEA); this.base = RK + '/r/' + this.code;
  this.guest = null; this.status = 'lobby'; this.closed = false; this.rtt = 0; this.n = 0;
  this.conn = null; this.peer = null;
  this.unsub = net.sub(this.base + '/g', function (m) { self.onMsg(m); });
  this.tm = setInterval(function () { self.tick(); }, 2000);
  var P = mkPeer('kfd1-' + this.code);
  if (P) {
    this.peer = P;
    P.on('connection', function (c) {
      c.on('open', function () { if (self.conn && self.conn.open && self.conn !== c) { try { c.send({ t: 'full' }); c.close(); } catch (e) {} return; } self.conn = c; });
      c.on('data', function (m) { if (m && typeof m === 'object') self.onMsg(m); });
      c.on('close', function () { if (self.conn === c) self.conn = null; });
      c.on('error', function () {});
    });
    P.on('error', function () {});
  }
  net.setBusy(true); this.publishInfo();
}
KF.Host = Host;
Host.prototype.publishInfo = function () {
  var p = this.net.profile(), g = this.guest;
  this.net.pub(this.base + '/i', { st: this.status, h: { n: p.n, a: p.a, l: p.l }, g: g ? { n: g.n, a: g.a, l: g.l } : null, ts: Date.now() }, { retain: true, qos: 1 });
  if (this.pubRoom && this.status === 'lobby' && !this.guest) this.net.pub(RK + '/t/' + this.code, { h: p.n, a: p.a, t: Date.now(), host: KF.S.id }, { retain: true });
  else if (this.pubRoom) this.net.pub(RK + '/t/' + this.code, '', { retain: true });
};
Host.prototype.send = function (o) {
  if (this.conn && this.conn.open) { try { this.conn.send(o); return; } catch (e) {} }
  this.net.pub(this.base + '/h', o, { qos: 0 });
};
Host.prototype.direct = function () { return !!(this.conn && this.conn.open); };
Host.prototype.onMsg = function (m) {
  if (this.closed || typeof m.t !== 'string') return;
  var pid = clean(m.id, 12);
  if (m.t === 'join') {
    if (this.guest && this.guest.id !== pid) { this.net.pub(this.base + '/h', { t: 'full', to: pid }, { qos: 1 }); return; }
    if (this.status !== 'lobby' && !this.guest) return;
    var isNew = !this.guest;
    this.guest = { id: pid, n: clean(m.n, 14) || 'Oyuncu', a: clean(m.a, 4) || '🙂', l: clean(m.l, 10) || 'zabita', seen: Date.now() };
    this.publishInfo();
    if (isNew && this.onGuest) this.onGuest(this.guest);
    this.send({ t: 'welcome', to: pid, st: this.status, h: { n: this.net.profile().n, a: this.net.profile().a, l: this.net.profile().l } });
    return;
  }
  if (!this.guest || this.guest.id !== pid) return;
  this.guest.seen = Date.now();
  if (m.t === 'in' && this.onInput) this.onInput(clean(m.k, 3));
  else if (m.t === 'pong') { var r = Date.now() - (+m.ts || 0); if (r >= 0 && r < 5000) this.rtt = this.rtt ? this.rtt * .7 + r * .3 : r; }
  else if (m.t === 'rdy' && this.onReady) this.onReady();
  else if (m.t === 'msg' && this.onChat) this.onChat(Math.max(0, Math.min(9, +m.i || 0)));
  else if (m.t === 'leave') { this.dropGuest('left'); }
};
Host.prototype.dropGuest = function (why) { this.guest = null; if (this.status !== 'lobby') this.status = 'lobby'; this.publishInfo(); if (this.onDrop) this.onDrop(why); };
Host.prototype.tick = function () {
  if (this.closed) return;
  var now = Date.now();
  if (this.guest) { this.send({ t: 'ping', ts: now }); if (now - this.guest.seen > 12000) this.dropGuest('lost'); }
  if (++this.n % 3 === 0) this.publishInfo();
};
Host.prototype.setStatus = function (s) { this.status = s; this.publishInfo(); };
Host.prototype.link = function () { return location.href.split('#')[0].split('?')[0] + '#o=' + this.code; };
Host.prototype.close = function () {
  if (this.closed) return; this.closed = true; clearInterval(this.tm); this.unsub();
  this.send({ t: 'bye' }); if (this.conn && this.conn.open) this.net.pub(this.base + '/h', { t: 'bye' }, { qos: 0 });
  if (this.peer) { var pp = this.peer; setTimeout(function () { try { pp.destroy(); } catch (e) {} }, 300); }
  this.net.pub(this.base + '/i', '', { retain: true }); if (this.pubRoom) this.net.pub(RK + '/t/' + this.code, '', { retain: true });
  this.net.setBusy(false);
};

/* ====================== Konuk ====================== */
function Guest(net, code) {
  var self = this;
  this.net = net; this.code = code.toUpperCase(); this.base = RK + '/r/' + this.code;
  this.info = null; this.state = 'joining'; this.lastHost = 0; this.t0 = Date.now(); this.closed = false;
  this.u1 = net.sub(this.base + '/i', function (o) { self.lastHost = Date.now(); self.info = o; if (self.onInfo) self.onInfo(o); });
  this.u2 = net.sub(this.base + '/h', function (m) { self.handle(m); });
  this.conn = null; this.peer = null;
  var P = mkPeer();
  if (P) {
    this.peer = P;
    P.on('open', function () {
      if (self.closed) return;
      var c = P.connect('kfd1-' + self.code, { reliable: true, serialization: 'json' });
      c.on('open', function () { self.conn = c; self.sendJoin(); });
      c.on('data', function (m) { if (m && typeof m === 'object') self.handle(m); });
      c.on('close', function () { if (self.conn === c) self.conn = null; });
      c.on('error', function () {});
    });
    P.on('error', function () {});
  }
  net.setBusy(true); this.sendJoin();
  this.tm = setInterval(function () { self.tick(); }, 1500); this.k = 0;
}
KF.Guest = Guest;
Guest.prototype.handle = function (m) {
  if (this.closed || !m || typeof m.t !== 'string') return;
  if (m.to && m.to !== KF.S.id) return;
  this.lastHost = Date.now();
  if (m.t === 'full') { this.state = 'full'; if (this.onState) this.onState(); }
  else if (m.t === 'bye') { this.state = 'bye'; if (this.onState) this.onState(); }
  else if (m.t === 'welcome') { if (!this.info && m.h) { this.info = { st: m.st, h: m.h }; if (this.onInfo) this.onInfo(this.info); } if (this.state === 'joining') this.state = 'lobby'; if (this.onState) this.onState(); }
  else if (m.t === 'ping') this.send({ t: 'pong', ts: m.ts });
  else if (this.onMsg) this.onMsg(m);
};
Guest.prototype.direct = function () { return !!(this.conn && this.conn.open); };
Guest.prototype.send = function (o, q) {
  o.id = KF.S.id;
  if (this.conn && this.conn.open) { try { this.conn.send(o); return true; } catch (e) {} }
  return this.net.pub(this.base + '/g', o, { qos: q || 0 });
};
Guest.prototype.sendJoin = function () { var p = this.net.profile(); this.send({ t: 'join', n: p.n, a: p.a, l: p.l }, 1); };
Guest.prototype.tick = function () {
  if (this.closed) return;
  this.k++;
  if (this.state === 'joining') { this.sendJoin(); if (Date.now() - this.t0 > 12000) { this.state = 'gone'; if (this.onState) this.onState(); } }
  else if (this.state === 'lobby' || this.state === 'play') {
    this.send({ t: 'hb' });
    if (this.lastHost && Date.now() - this.lastHost > 11000) { this.state = 'gone'; if (this.onState) this.onState(); }
  }
};
Guest.prototype.input = function (k) { this.send({ t: 'in', k: k }, 1); };
Guest.prototype.leave = function () { try { this.send({ t: 'leave' }, 1); } catch (e) {} };
Guest.prototype.close = function () { if (this.closed) return; this.closed = true; clearInterval(this.tm); this.u1(); this.u2(); if (this.peer) { var pp = this.peer; setTimeout(function () { try { pp.destroy(); } catch (e) {} }, 300); } this.net.setBusy(false); };

})(window);
