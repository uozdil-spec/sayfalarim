/* Kart Salonu · oturum: oyunun tek "sahibi". Bot hamleleri, süre, el sonu bekleme, kayıt.
   Yerelde de çevrimiçinde de aynı kod çalışır; çevrimiçinde ev sahibi cihazda durur. */
(function (root) {
'use strict';
var BR = root.BR;

function Session(cfg) {
  this.g = cfg.game;
  this.E = BR.engines[cfg.game];
  this.seats = cfg.seats;            // [{name, av, human:bool, pid, level, away}]
  this.n = this.seats.length;
  this.opts = cfg.opts || {};
  this.online = !!cfg.online;
  this.turnTime = cfg.turnTime || 0; // saniye, 0 = kapalı
  this.listeners = [];
  this.ready = [];
  this.seq = 0;
  this.timer = null; this.rtimer = null;
  this.deadline = 0;
  this.miss = [];
  this.dead = false;
  this.lastEv = [];
  var i;
  for (i = 0; i < this.n; i++) { this.ready.push(false); this.miss.push(0); }
  if (cfg.st) { this.st = cfg.st; this.seq = cfg.seq || 0; this.ready = cfg.ready || this.ready; }
  else {
    var o = BR.clone(this.opts); o.n = this.n;
    var r = this.E.init(o);
    this.st = r.st; this.lastEv = r.ev; this.fresh = true;
  }
}
BR.Session = Session;

Session.prototype.on = function (fn) { this.listeners.push(fn); };
Session.prototype.emit = function (ev, kind) {
  this.seq++;
  this.lastEv = ev || [];
  for (var i = 0; i < this.listeners.length; i++) { try { this.listeners[i](ev || [], kind || 'move'); } catch (e) { if (root.console) console.error(e); } }
  if (this.saver) this.saver(this);
};
Session.prototype.view = function (seat) { return this.E.view(this.st, seat); };
Session.prototype.phase = function () { return this.st.phase; };
Session.prototype.isBotSeat = function (s) { var p = this.seats[s]; return !p.human || p.away; };

Session.prototype.start = function () {
  this.emit(this.lastEv, 'start');
  this.kick();
};

Session.prototype.act = function (seat, a) {
  if (this.dead || this.st.phase !== 'play') return false;
  var r = this.E.apply(this.st, seat, a);
  if (!r || !r.ok) return false;
  this.miss[seat] = 0;
  this.emit(r.ev, 'move');
  this.kick();
  return true;
};

Session.prototype.setAway = function (seat, away) {
  var p = this.seats[seat];
  if (!p || !p.human || !!p.away === !!away) return;
  p.away = !!away;
  this.emit([], 'presence');
  this.kick();
};

Session.prototype.readyUp = function (seat) {
  if (this.st.phase !== 'handEnd') return;
  this.ready[seat] = true;
  this.checkReady();
};
Session.prototype.checkReady = function () {
  if (this.st.phase !== 'handEnd') return;
  var i, all = true;
  for (i = 0; i < this.n; i++) if (this.seats[i].human && !this.seats[i].away && !this.ready[i]) all = false;
  if (all) this.advance();
};
Session.prototype.advance = function () {
  var r = this.E.nextHand(this.st), i;
  if (!r || !r.ok) return;
  for (i = 0; i < this.n; i++) this.ready[i] = false;
  clearTimeout(this.rtimer);
  this.emit(r.ev, r.ev.length && r.ev[0].t === 'gameEnd' ? 'gameEnd' : 'hand');
  this.kick();
};

Session.prototype.botDelay = function (seat) {
  var base = 750 + BR.rnd() * 650;
  var ev = this.lastEv, dealt = false, i;
  for (i = 0; i < ev.length; i++) if (ev[i].t === 'deal' || ev[i].t === 'newHand') dealt = true;
  if (dealt) base += 1100;
  for (i = 0; i < ev.length; i++) { if (ev[i].t === 'capture') { base += ev[i].n === 5 ? 2300 : 1000; break; /* ilk eli alan kapalı kartlara bakabilsin */ } if (ev[i].t === 'give') { base += 450; break; } } // Pişti'de alınan kart görünsün diye biraz daha bekler
  return base * (BR.botMul || 1);
};

Session.prototype.kick = function () {
  var self = this;
  clearTimeout(this.timer);
  this.deadline = 0;
  if (this.dead) return;
  var st = this.st;
  if (st.phase === 'handEnd') {
    // botlar ve kopuk oyuncular beklemez; çevrimiçinde yavaş oyuncuyu da sonsuza dek bekleme
    this.checkReady();
    if (this.online && st.phase === 'handEnd') {
      clearTimeout(this.rtimer);
      this.rtimer = setTimeout(function () { if (self.st.phase === 'handEnd') self.advance(); }, 30000);
    }
    return;
  }
  if (st.phase !== 'play') return;
  var t = this.E.turnOf(st);
  if (t < 0) return;
  if (this.isBotSeat(t)) {
    this.timer = setTimeout(function () { self.botMove(t); }, this.botDelay(t));
  } else if (this.turnTime > 0) {
    var ms = this.turnTime * 1000;
    this.deadline = Date.now() + ms;
    this.timer = setTimeout(function () {
      if (self.E.turnOf(self.st) !== t) return;
      self.miss[t]++;
      if (self.online && self.miss[t] >= 2) { self.seats[t].away = true; self.seats[t].timedOut = true; }
      self.botMove(t, true);
    }, ms + 250);
  }
};

Session.prototype.botMove = function (seat, auto) {
  if (this.dead || this.st.phase !== 'play' || this.E.turnOf(this.st) !== seat) return;
  var lvl = this.seats[seat].level || BR.S.level || 'medium';
  if (auto) lvl = 'medium';
  var a = this.E.bot(this.st, seat, lvl);
  if (!a) {
    var l = this.E.legal(this.st, seat);
    if (!l.length) return;
    a = l[0];
  }
  var r = this.E.apply(this.st, seat, a);
  if (!r || !r.ok) {
    var legal = this.E.legal(this.st, seat);
    if (!legal.length) return;
    r = this.E.apply(this.st, seat, legal[0]);
    if (!r || !r.ok) return;
  }
  this.emit(r.ev, 'move');
  this.kick();
};

Session.prototype.destroy = function () { this.dead = true; clearTimeout(this.timer); clearTimeout(this.rtimer); this.listeners = []; };

Session.prototype.snapshot = function () {
  return { game: this.g, st: this.st, seats: this.seats, opts: this.opts, ready: this.ready, seq: this.seq, turnTime: this.turnTime, online: this.online };
};

/* ================= Denetleyici (arayüzün konuştuğu yüz) ================= */
/* Yerel oyun ya da ev sahibinin kendi koltuğu */
function LocalCtrl(sess, seat, extra) {
  this.sess = sess; this.seat = seat; this.game = sess.g; this.n = sess.n;
  this.listeners = [];
  this.isOnline = !!sess.online;
  this.extra = extra || {};
  var self = this;
  sess.on(function (ev, kind) { self.fire(ev, kind); });
}
BR.LocalCtrl = LocalCtrl;
LocalCtrl.prototype.on = function (fn) { this.listeners.push(fn); };
LocalCtrl.prototype.fire = function (ev, kind) { for (var i = 0; i < this.listeners.length; i++) this.listeners[i](ev, kind); };
LocalCtrl.prototype.view = function () { return this.sess.view(this.seat); };
LocalCtrl.prototype.info = function (s) {
  var p = this.sess.seats[s] || {};
  return { name: p.name || 'Oyuncu', av: p.av || '🙂', bot: !p.human, away: !!p.away && !!p.human, human: !!p.human, conn: p.conn !== false };
};
LocalCtrl.prototype.seatInfo = LocalCtrl.prototype.info;
LocalCtrl.prototype.act = function (a) { return this.sess.act(this.seat, a); };
LocalCtrl.prototype.ready = function () { this.sess.readyUp(this.seat); };
LocalCtrl.prototype.deadline = function () { return this.sess.deadline; };
LocalCtrl.prototype.turnTime = function () { return this.sess.turnTime; };
LocalCtrl.prototype.chat = function (m) { if (this.extra.chat) this.extra.chat(this.seat, m); };
LocalCtrl.prototype.leave = function () { if (this.extra.leave) this.extra.leave(); };
LocalCtrl.prototype.destroy = function () { this.listeners = []; if (this.extra.destroy) this.extra.destroy(); this.sess.destroy(); };
LocalCtrl.prototype.connState = function () { return this.extra.conn ? this.extra.conn() : 'ok'; };
LocalCtrl.prototype.names = function () { var a = [], i; for (i = 0; i < this.n; i++) a.push(this.info(i).name); return a; };
LocalCtrl.prototype.gameOver = function () { return this.sess.st.phase === 'gameEnd'; };

if (typeof module !== 'undefined' && module.exports) module.exports = Session;
})(typeof window !== 'undefined' ? window : globalThis);
