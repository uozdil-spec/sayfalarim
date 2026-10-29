/* Masa denetleyicisi: bir maçı yönetir, bot hamlelerini sıralar, süre sınırını uygular.
   Yerel oyunda da, online ev sahibinde de aynı kod çalışır. */
(function (root) {
'use strict';
var E = root.OkeyEngine, AI = root.OkeyAI;

function Table(o) {
  this.cfg = o.cfg;
  this.rng = o.rng || Math.random;
  this.seats = o.seats;                 // [{kind:'human'|'bot'|'remote', name, av, level, cid}]
  this.speed = o.speed === undefined ? 1 : o.speed;   // gecikme çarpanı (0 = anında)
  this.turnTime = o.turnTime || 0;      // saniye (insan oyuncular için), 0 = sınırsız
  this.m = o.m || E.newMatch(this.cfg, this.rng);
  this.paused = false;
  this.timer = null;
  this.listeners = [];
  this.afk = [0, 0, 0, 0];
  this.deadline = 0;
  this.turnKey = '';
  this.dead = false;
}

Table.prototype.on = function (fn) { this.listeners.push(fn); };
Table.prototype.emit = function (ev) {
  for (var i = 0; i < this.listeners.length; i++) {
    try { this.listeners[i](ev, this); } catch (e) { if (root.console) console.error(e); }
  }
};

Table.prototype.meta = function () {
  var self = this;
  return {
    names: this.seats.map(function (s) { return s.name; }),
    avs: this.seats.map(function (s) { return s.av; }),
    kinds: this.seats.map(function (s) { return s.kind; }),
    levels: this.seats.map(function (s) { return s.level || ''; }),
    turnTime: this.turnTime,
    partner: this.cfg.partner
  };
};

Table.prototype.view = function (seat) {
  var v = E.viewFor(this.m, seat);
  v.left = this.deadline ? Math.max(0, this.deadline - Date.now()) : 0;
  return v;
};

Table.prototype.start = function () {
  this.emit({ t: 'deal' });
  this.schedule();
};

Table.prototype.act = function (seat, a) {
  if (this.dead || this.paused) return { ok: false, err: 'paused' };
  var snap = null;
  if (this.allowUndo && a && a.t === 'draw' && this.seats[seat].kind === 'human') snap = JSON.stringify(this.m);
  var r = E.apply(this.m, seat, a);
  if (!r.ok) return r;
  if (snap) this.undoSnap = snap; else if (a.t !== 'draw') this.undoSnap = null;
  this.afk[seat] = 0;
  this.emit(r.ev);
  this.schedule();
  return r;
};

/* Çekilen taşı geri al (yalnızca yerel oyun, atmadan önce) */
Table.prototype.canUndo = function (seat) {
  return !!(this.allowUndo && this.undoSnap && this.m.status === 'playing' && this.m.h.turn === seat && this.m.h.phase === 'discard');
};
Table.prototype.undo = function (seat) {
  if (!this.canUndo(seat)) return false;
  this.m = JSON.parse(this.undoSnap);
  this.undoSnap = null;
  this.emit({ t: 'sync' });
  this.schedule();
  return true;
};

Table.prototype.nextHand = function () {
  if (this.dead || this.m.status !== 'handEnd') return false;
  E.dealHand(this.m, this.rng, false);
  this.turnKey = '';
  this.emit({ t: 'deal' });
  this.schedule();
  return true;
};

Table.prototype.clearTimer = function () {
  if (this.timer) { clearTimeout(this.timer); this.timer = null; }
};

Table.prototype.setPaused = function (p) {
  this.paused = !!p;
  if (this.paused) { this.clearTimer(); this.pausedAt = Date.now(); }
  else {
    if (this.deadline && this.pausedAt) this.deadline += Date.now() - this.pausedAt;
    this.schedule(true);
  }
};

Table.prototype.destroy = function () { this.dead = true; this.clearTimer(); this.listeners = []; };

Table.prototype.botDelay = function (phase) {
  if (this.speed === 0) return 80;
  var base = phase === 'draw' ? 700 : 950;
  return base * this.speed * (0.75 + Math.random() * 0.5);
};

Table.prototype.schedule = function (keepDeadline) {
  var self = this, m = this.m, h = m.h;
  this.clearTimer();
  if (this.dead || this.paused || m.status !== 'playing') { this.deadline = 0; return; }
  var seat = h.turn, s = this.seats[seat];
  if (s.kind === 'bot') {
    this.deadline = 0;
    this.timer = setTimeout(function () { self.botMove(seat); }, this.botDelay(h.phase));
    return;
  }
  // insan / uzak oyuncu: süre sınırı
  if (this.turnTime > 0) {
    var key = h.moves + ':' + h.turn;
    if (key !== this.turnKey || !keepDeadline && !this.deadline) {
      this.turnKey = key;
      this.deadline = Date.now() + this.turnTime * 1000;
    }
    var wait = Math.max(50, this.deadline - Date.now());
    this.timer = setTimeout(function () { self.timeout(seat); }, wait);
  } else this.deadline = 0;
};

Table.prototype.botMove = function (seat) {
  if (this.dead || this.paused || this.m.status !== 'playing' || this.m.h.turn !== seat) return;
  var s = this.seats[seat];
  var view = E.viewFor(this.m, seat);
  var a = AI.chooseAction(view, seat, s.level || 'medium', this.rng, this.m.h.picks);
  var r = E.apply(this.m, seat, a);
  if (!r.ok) {
    // güvenli geri dönüş
    a = this.m.h.phase === 'draw' ? { t: 'draw', from: 'pile' } : { t: 'discard', tile: this.m.h.hands[seat][0] };
    r = E.apply(this.m, seat, a);
    if (!r.ok) return;
  }
  this.emit(r.ev);
  this.schedule();
};

Table.prototype.timeout = function (seat) {
  if (this.dead || this.paused || this.m.status !== 'playing' || this.m.h.turn !== seat) return;
  var h = this.m.h, s = this.seats[seat];
  this.afk[seat]++;
  var a;
  if (h.phase === 'draw') a = { t: 'draw', from: h.pile.length ? 'pile' : 'discard' };
  else {
    var view = E.viewFor(this.m, seat);
    a = AI.chooseAction(view, seat, 'medium', this.rng, h.picks);
  }
  var r = E.apply(this.m, seat, a);
  if (r.ok) this.emit(r.ev);
  if (this.afk[seat] >= 3 && s.kind !== 'bot') {
    // üç kez süre aşımı: yerine bilgisayar oturur
    s.kind = 'bot'; s.level = s.level || 'medium'; s.name = s.name + ' 🤖';
    this.emit({ t: 'meta' });
  }
  // aynı turda atma aşaması kaldıysa kısa gecikmeyle devam
  var self = this;
  if (this.m.status === 'playing' && this.m.h.turn === seat && this.m.h.phase === 'discard') {
    this.clearTimer();
    this.timer = setTimeout(function () { self.timeout(seat); }, 500);
  } else this.schedule();
};

Table.prototype.replaceWithBot = function (seat, level) {
  var s = this.seats[seat];
  s.kind = 'bot'; s.level = level || s.level || 'medium'; delete s.cid;
  this.emit({ t: 'meta' });
  this.schedule(true);
};

Table.prototype.snapshot = function () {
  return { cfg: this.cfg, m: this.m, seats: this.seats, speed: this.speed };
};

root.OkeyTable = Table;
if (typeof module !== 'undefined' && module.exports) module.exports = Table;
})(typeof window !== 'undefined' ? window : globalThis);
