/* Kafes Dövüşü · oyun çekirdeği: dövüş kuralları, bilgisayar rakip, ses, sahne döngüsü ve çevrimiçi eşitleme.
   Tek kural seti hem bilgisayara karşı hem gerçek rakibe karşı çalışır. Çevrimiçide ev sahibi cihaz oyunu yürütür. */
(function (root) {
'use strict';
var KF = root.KF, GFX = root.GFX;
var cv = document.getElementById('cv'), cx = cv.getContext('2d');
function rr(a, b) { return a + Math.random() * (b - a); }
var PERF = .2;

/* ---------- ses ---------- */
var AC = null;
function ac() { try { AC = AC || new (root.AudioContext || root.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} return AC; }
function tone(f, d, type, v, sl, delay) {
  if (!KF.S.sfx || !ac()) return;
  try {
    var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (delay || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (sl) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + sl), t + d);
    g.gain.setValueAtTime(v || .06, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02);
  } catch (e) {}
}
function thud(d, v, lp) {
  if (!KF.S.sfx || !ac()) return;
  try {
    var n = Math.floor(AC.sampleRate * d), b = AC.createBuffer(1, n, AC.sampleRate), a = b.getChannelData(0), i;
    for (i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    var s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = b; f.type = 'lowpass'; f.frequency.value = lp || 900; g.gain.value = v || .3; s.connect(f); f.connect(g); g.connect(AC.destination); s.start();
  } catch (e) {}
}
KF.sfx = function (k) {
  if (k === 'swing') tone(380, .13, 'sawtooth', .025, -220);
  else if (k === 'hit') { thud(.16, .55, 1100); tone(110, .14, 'sine', .12, -60); }
  else if (k === 'block') { tone(210, .09, 'square', .05, -80); thud(.07, .25, 2400); }
  else if (k === 'perfect') { tone(880, .2, 'triangle', .08, 500); tone(1320, .25, 'triangle', .05, 300, .06); }
  else if (k === 'spec') { tone(300, .35, 'sawtooth', .05, 500); thud(.25, .5, 1600); }
  else if (k === 'ko') { thud(.5, .7, 600); tone(150, .6, 'sawtooth', .07, -110); }
  else if (k === 'cd') tone(440, .12, 'square', .04);
  else if (k === 'go') tone(740, .25, 'square', .05);
  else if (k === 'ui') tone(520, .05, 'square', .03);
  else if (k === 'win') { tone(523, .15, 'triangle', .07); tone(659, .15, 'triangle', .07, 0, .15); tone(784, .3, 'triangle', .07, 0, .3); }
  else if (k === 'lose') { tone(300, .3, 'triangle', .07, -120); tone(200, .4, 'triangle', .07, -90, .25); }
};
KF.buzz = function (n) { if (KF.S.vib) try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} };

/* ---------- dövüş kuralları ---------- */
function FS(hp, W, dmg) { return { hp: hp, max: hp, sp: 0, st: 'idle', t: 0, stam: 100, block: false, hold: false, blockT: 0, cd: 0, combo: 0, comboT: 0, W: W || .42, dmg: dmg || 0 }; }
function Sim(o) {
  this.o = o; this.f = [FS(100, .42, 0), FS(o.hp || 100, o.W || .42, o.dmg || 0)];
  this.ev = []; this.eid = 0; this.time = o.time || 60; this.lock = 2.4; this.lc = 4; this.ph = 'count'; this.endT = 0;
  this.cpu = o.cpu ? { t: 1.4, reacting: false, bt: 999, hold: 0 } : null; this.sc = [0, 0]; this.round = 1; this.bg = o.bg || 0; this.mw = -1;
}
Sim.prototype.emit = function (k, s, v) { this.eid++; this.ev.push({ id: this.eid, k: k, s: s, v: v || 0, ts: Date.now() }); };
Sim.prototype.input = function (i, k) {
  if (this.ph !== 'fight') return;
  var f = this.f[i]; if (f.st === 'ko') return;
  var free = f.st === 'idle' || f.st === 'rec';
  if (k === 'p') { if (free && !f.block && f.cd <= 0) { f.st = 'wind'; f.t = f.W; f.cd = .1; this.emit('swing', i); } }
  else if (k === 'bd') { f.hold = true; if (free && f.stam > 6 && !f.block) { f.block = true; f.blockT = 0; f.st = 'block'; } }
  else if (k === 'bu') { f.hold = false; if (f.block) { f.block = false; if (f.st === 'block') f.st = 'idle'; } }
  else if (k === 's') { if (free && !f.block && f.sp >= 100) { f.sp = 0; f.st = 'sp'; f.t = .4; this.emit('swing', i, 1); } }
};
Sim.prototype.runCpu = function (dt) {
  var c = this.cpu, L = this.o.cpu, me = this.f[1], op = this.f[0];
  c.t -= dt; c.hold -= dt;
  var opAtk = op.st === 'wind' || op.st === 'sp';
  if (opAtk) { if (!c.reacting) { c.reacting = true; c.bt = Math.random() < L.react ? rr(.12, .34) : 999; } } else c.reacting = false;
  if (c.reacting && c.bt < 999) { c.bt -= dt; if (c.bt <= 0) { c.bt = 999; this.input(1, 'bd'); c.hold = .55; } }
  if ((me.block || me.hold) && !opAtk && c.hold <= 0) this.input(1, 'bu');
  if (!me.block && c.t <= 0 && (me.st === 'idle' || me.st === 'rec') && me.cd <= 0 && !opAtk) {
    this.input(1, me.sp >= 100 && Math.random() < .7 ? 's' : 'p');
    c.t = Math.random() < L.dbl ? .12 : rr(L.gap[0], L.gap[1]);
  }
};
Sim.prototype.resolve = function (land) {
  var F = this.f, self = this, snap = F.map(function (f) { return { block: f.block, bt: f.blockT }; }), out = [];
  land.forEach(function (a) {
    var A = F[a], d = 1 - a, sp = A.st === 'sp', S = snap[d];
    var dmg = sp ? 22 : (A.dmg ? A.dmg + Math.floor(Math.random() * 3) : 6 + Math.min(A.combo, 5) + Math.floor(Math.random() * 3));
    out.push({ a: a, d: d, dmg: dmg, res: sp ? 'spec' : (S.block ? (S.bt <= PERF ? 'perfect' : 'block') : 'hit') });
  });
  out.forEach(function (o) {
    var A = F[o.a], D = F[o.d];
    A.st = 'strike'; A.t = .14; A.cd = .2;
    if (o.res === 'perfect') { A.st = 'stun'; A.t = 1.0; A.combo = 0; D.sp = Math.min(100, D.sp + 18); self.emit('perfect', o.d); }
    else if (o.res === 'block') { var dm = Math.max(1, Math.round(o.dmg * .2)); D.hp -= dm; D.sp = Math.min(100, D.sp + 8); A.st = 'stun'; A.t = .4; A.combo = 0; self.emit('block', o.d, dm); }
    else {
      D.hp -= o.dmg; D.block = false; D.combo = 0; D.comboT = 0; D.sp = Math.min(100, D.sp + 5);
      var simult = out.some(function (q) { return q.a === o.d; });
      if (o.res === 'spec') { D.st = 'stun'; D.t = .9; } else if (!simult) { D.st = 'hit'; D.t = .3; }
      A.combo++; A.comboT = 1.3; if (o.res === 'hit') A.sp = Math.min(100, A.sp + 9);
      self.emit(o.res, o.d, o.dmg);
    }
  });
};
Sim.prototype.finish = function () {
  var F = this.f, d0 = F[0].hp <= 0, d1 = F[1].hp <= 0, w;
  if (d0 && d1) w = -1; else if (d0) w = 1; else if (d1) w = 0;
  else w = F[0].hp > F[1].hp ? 0 : (F[1].hp > F[0].hp ? 1 : -1);
  F.forEach(function (f, i) { f.block = false; f.hold = false; if (w >= 0 && i !== w) f.st = f.hp <= 0 ? 'ko' : 'stun'; else if (w < 0 && f.hp <= 0) f.st = 'ko'; else if (w >= 0) f.st = 'idle'; });
  if (w >= 0) this.sc[w]++;
  this.mw = this.o.solo ? w : (this.sc[0] >= 2 ? 0 : (this.sc[1] >= 2 ? 1 : -1));
  this.ph = 'end'; this.endT = 2; this.rw = w; this.emit('end', w, F[0].hp <= 0 || F[1].hp <= 0 ? 1 : 0);
};
Sim.prototype.nextRound = function () {
  this.round++; this.bg = this.o.solo ? this.bg : (this.round - 1) % 3; this.time = this.o.time || 60; this.lock = 2.4; this.lc = 4; this.ph = 'count';
  var hp1 = this.f[1].max; this.f = [FS(100, .42, 0), FS(hp1, this.o.W || .42, this.o.dmg || 0)]; if (this.cpu) this.cpu = { t: 1.4, reacting: false, bt: 999, hold: 0 };
};
Sim.prototype.step = function (dt) {
  var F = this.f, i, land = [];
  if (this.ph === 'count') { this.lock -= dt; var n = Math.ceil(this.lock / .6); if (n !== this.lc && n >= 1) { this.lc = n; this.emit('cd', -1, n); } if (this.lock <= 0) { this.ph = 'fight'; this.emit('cd', -1, 0); } return; }
  if (this.ph === 'end') { this.endT -= dt; if (this.endT <= 0) this.ph = 'after'; return; }
  if (this.ph !== 'fight') return;
  this.time -= dt;
  if (this.cpu) this.runCpu(dt);
  for (i = 0; i < 2; i++) {
    var f = F[i]; f.cd = Math.max(0, f.cd - dt);
    if (f.comboT > 0) { f.comboT -= dt; if (f.comboT <= 0) f.combo = 0; }
    if (f.block) { f.blockT += dt; f.stam -= 40 * dt; if (f.stam <= 0) { f.stam = 0; f.block = false; f.hold = false; f.st = 'stun'; f.t = .6; this.emit('break', i); } }
    else f.stam = Math.min(100, f.stam + 25 * dt);
    if (f.st === 'wind' || f.st === 'sp') { f.t -= dt; if (f.t <= 0) land.push(i); }
    else if (f.st === 'strike') { f.t -= dt; if (f.t <= 0) { f.st = 'rec'; f.t = .26; } }
    else if (f.st === 'rec' || f.st === 'hit' || f.st === 'stun') { f.t -= dt; if (f.t <= 0) f.st = 'idle'; }
    if (f.hold && !f.block && f.st === 'idle' && f.stam > 12) { f.block = true; f.blockT = 0; f.st = 'block'; }
  }
  this.resolve(land);
  if (F[0].hp <= 0 || F[1].hp <= 0 || this.time <= 0) this.finish();
};
Sim.prototype.snap = function () {
  var now = Date.now(), F = this.f;
  return { t: 's', ph: this.ph, tm: Math.max(0, Math.ceil(this.time)), sc: this.sc, rn: this.round, bg: this.bg, mw: this.mw, rw: this.rw,
    f: F.map(function (f) { return [Math.max(0, Math.round(f.hp)), Math.round(f.sp), f.st, Math.round(f.stam), f.combo, f.block ? 1 : 0, Math.round(f.max)]; }),
    ev: this.ev.filter(function (e) { return now - e.ts < 1500; }).map(function (e) { return [e.id, e.k, e.s, e.v]; }) };
};
KF.Sim = Sim;

/* ---------- bilgisayar rakipler ---------- */
KF.LV = [
  { name: 'ZABITA ZEKİ', venue: 'OTOPARK', bg: 0, look: 'zabita', hp: 70, W: .56, dmg: 8, gap: [1.2, 2.1], react: .3, dbl: 0, desc: 'Kaçak park cezası kesmeden uyuyamaz. Düdüğü ölümcül.' },
  { name: 'MÜDÜRE MUALLA', venue: 'KÖPRÜ ALTI', bg: 1, look: 'mudure', hp: 90, W: .48, dmg: 10, gap: [1.0, 1.8], react: .45, dbl: .25, desc: 'Gece mesaisi faturası keser. Bazen arka arkaya iki kez vurur.' },
  { name: 'BAHÇIVAN BEKİR', venue: 'ORMAN', bg: 2, look: 'bahcivan', hp: 110, W: .44, dmg: 12, gap: [.9, 1.5], react: .55, dbl: .3, desc: 'Hasır şapkalı, çelik yumruklu. Ormanın tek hâkimi.' }
];

/* ---------- denetleyici ---------- */
var G = KF.G = { mode: 'menu', sim: null, room: null, net: null, me: 0, M: null, parts: [], pops: [], shake: 0, tm: 0, seen: 0, hook: {}, names: ['', ''], lastPh: '', over: false };
var V = G.V = { a: GFX.mkF(148, GFX.LOOKS.muhendis), b: GFX.mkF(252, GFX.LOOKS.zabita), bg: 0, flip: false, parts: G.parts, pops: G.pops, shake: 0, tm: 0, warn: true };
function setLooks(l0, l1) { V.a = GFX.mkF(148, GFX.LOOKS[l0] || GFX.LOOKS.muhendis); V.b = GFX.mkF(252, GFX.LOOKS[l1] || GFX.LOOKS.zabita); }
function reset() { G.seen = 0; G.parts.length = 0; G.pops.length = 0; G.over = false; G.lastPh = ''; G.M = null; }
G.stop = function () {
  if (G.room) { try { G.room.close(); } catch (e) {} G.room = null; }
  if (G.guest) { try { G.guest.leave(); G.guest.close(); } catch (e) {} G.guest = null; }
  G.sim = null; G.mode = 'menu'; V.flip = false; V.bg = 0; reset();
};
function ensureNet() { if (!G.net) { G.net = new KF.Net(); } return G.net; }
G.getNet = ensureNet;

G.solo = function (lv, carryHp, carrySp) {
  G.stop(); var L = KF.LV[lv];
  G.mode = 'solo'; G.lv = lv; G.me = 0; reset();
  var sim = G.sim = new Sim({ cpu: L, hp: L.hp, W: L.W, dmg: L.dmg, time: 75, bg: L.bg, solo: true });
  if (carryHp != null) sim.f[0].hp = carryHp; if (carrySp) sim.f[0].sp = carrySp;
  setLooks(KF.S.look, L.look); V.bg = L.bg; G.names = [KF.S.name || 'Mühendis', L.name]; G.avs = [KF.S.av, '🥊'];
};
G.host = function (pub) {
  G.stop(); var net = ensureNet();
  return net.start().then(function () {
    var h = new KF.Host(net, pub); G.room = h; G.mode = 'lobbyH';
    h.onInput = function (k) { if (G.sim) G.sim.input(1, k); };
    h.onReady = function () { if (G.hook.ready) G.hook.ready(); };
    return h;
  });
};
G.hostBegin = function () {
  var h = G.room; if (!h || !h.guest) return false;
  reset(); G.mode = 'host'; G.me = 0; G.sim = new Sim({ time: 60, bg: 0 }); h.setStatus('play');
  setLooks(KF.S.look, h.guest.l); V.bg = 0; G.names = [KF.S.name || 'Oyuncu', h.guest.n]; G.avs = [KF.S.av, h.guest.a];
  return true;
};
G.rematch = function () { if (G.mode === 'host' && G.room && G.room.guest) { reset(); G.sim = new Sim({ time: 60, bg: 0 }); V.bg = 0; return true; } return false; };
G.join = function (code) {
  G.stop(); var net = ensureNet();
  return net.start().then(function () {
    var g = new KF.Guest(net, code); G.guest = g; G.mode = 'lobbyG'; g.starter = false;
    g.onMsg = function (m) { if (m.t === 's') applySnap(m); };
    return g;
  });
};
G.input = function (k) {
  if (G.mode === 'solo' && G.sim) G.sim.input(0, k);
  else if (G.mode === 'host' && G.sim) { var d = Math.min(220, (G.room ? G.room.rtt : 0) / 2); if (d > 15) setTimeout(function () { if (G.sim) G.sim.input(0, k); }, d); else G.sim.input(0, k); }
  else if (G.mode === 'guest' && G.guest) G.guest.input(k);
};
function applySnap(m) {
  var g = G.guest; if (!g) return;
  if (G.mode !== 'guest') {
    G.mode = 'guest'; G.me = 1; V.flip = true; reset(); g.state = 'play';
    var h = g.info && g.info.h || {}; setLooks(h.l || 'muhendis', KF.S.look); G.names = [h.n || 'Rakip', KF.S.name || 'Oyuncu']; G.avs = [h.a || '🥊', KF.S.av];
    if (G.hook.guestStart) G.hook.guestStart();
  }
  G.M = { ph: m.ph, tm: m.tm, sc: m.sc, rn: m.rn, bg: m.bg, mw: m.mw, rw: m.rw, hp: [m.f[0][0], m.f[1][0]], sp: [m.f[0][1], m.f[1][1]], st: [m.f[0][2], m.f[1][2]], stam: [m.f[0][3], m.f[1][3]], combo: [m.f[0][4], m.f[1][4]], max: [m.f[0][6], m.f[1][6]] };
  m.ev.forEach(function (a) { if (a[0] > G.seen) { G.seen = a[0]; handleEv({ k: a[1], s: a[2], v: a[3] }); } });
  g.lastHost = Date.now();
}
function modelFromSim(s) {
  var F = s.f; return { ph: s.ph, tm: Math.max(0, Math.ceil(s.time)), sc: s.sc, rn: s.round, bg: s.bg, mw: s.mw, rw: s.rw, hp: [F[0].hp, F[1].hp], sp: [F[0].sp, F[1].sp], st: [F[0].st, F[1].st], stam: [F[0].stam, F[1].stam], combo: [F[0].combo, F[1].combo], max: [F[0].max, F[1].max] };
}

/* ---------- olaylar -> görsel ve ses ---------- */
function fx(seat) { return seat === 0 ? V.a : V.b; }
function spark(x, y, col, n) { for (var i = 0; i < n; i++) G.parts.push({ k: 'spark', x: x, y: y, vx: rr(-170, 170), vy: rr(-170, 30), g: 380, c: col, life: .4, max: .4 }); }
function pop(x, y, txt, col) { G.pops.push({ x: x, y: y, txt: txt, col: col, t: .9 }); }
function handleEv(e) {
  var me = G.me, mine = e.s === me, f = e.s >= 0 ? fx(e.s) : null, hs = KF.hook = G.hook;
  if (e.k === 'swing') KF.sfx('swing');
  else if (e.k === 'hit' || e.k === 'spec') {
    f.flash = .13; spark(f.x + (e.s === 0 ? 8 : -8), 150, '#ffd23f', 10); G.parts.push({ k: 'ring', x: f.x + (e.s === 0 ? 14 : -14), y: 150, c: '#fff', life: .3, max: .3 });
    pop(f.x, 118, '-' + e.v, mine ? '#ff6b5e' : '#ffd23f'); G.shake = e.k === 'spec' ? 7 : 4; KF.sfx(e.k === 'spec' ? 'spec' : 'hit'); if (mine) KF.buzz(40);
    if (e.k === 'spec') { for (var i = 0; i < 10; i++) G.parts.push({ k: 'paper', x: f.x + (e.s === 0 ? -50 : 50), y: rr(130, 190), vx: (e.s === 0 ? 1 : -1) * rr(120, 220), vy: rr(-60, 20), g: 90, rot: rr(0, 6), life: .6, max: .6 }); if (G.hook.callout) G.hook.callout('DİLEKÇE İMZALANDI!', '#d9ab4c'); }
  } else if (e.k === 'block') { spark(f.x + (e.s === 0 ? 14 : -14), 140, '#8cc8ff', 7); pop(f.x, 118, 'SAVUNDU', '#8cc8ff'); KF.sfx('block'); G.shake = 2; }
  else if (e.k === 'perfect') { spark(f.x + (e.s === 0 ? 14 : -14), 140, '#6fe3ff', 14); G.shake = 4; KF.sfx('perfect'); if (G.hook.callout) G.hook.callout('KUSURSUZ SAVUNMA!', '#6fe3ff'); KF.buzz(25); }
  else if (e.k === 'break') { pop(f.x, 118, 'SAVUNMA KIRILDI', '#ff9a5e'); KF.sfx('block'); }
  else if (e.k === 'cd') { if (G.hook.callout) G.hook.callout(e.v === 0 ? 'DÖVÜŞ!' : String(e.v), e.v === 0 ? '#d9ab4c' : '#fff'); KF.sfx(e.v === 0 ? 'go' : 'cd'); }
  else if (e.k === 'end') { if (G.hook.callout) G.hook.callout(e.v ? 'K.O.!' : 'SÜRE DOLDU', '#d9ab4c'); KF.sfx('ko'); G.shake = 6; }
  if (hs.ev) hs.ev(e, G);
}

/* ---------- döngü ---------- */
var last = 0, acc = 0, sendT = 0;
function frame(ts) {
  var dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts; G.tm += dt;
  var s = G.sim;
  if (s && G.mode !== 'guest' && !G.paused) {
    acc += dt;
    while (acc >= 1 / 60) { s.step(1 / 60); acc -= 1 / 60; }
    G.M = modelFromSim(s);
    s.ev.forEach(function (e) { if (e.id > G.seen) { G.seen = e.id; handleEv(e); } });
    var now = Date.now(); s.ev = s.ev.filter(function (e) { return now - e.ts < 3000; });
    if (G.mode === 'host' && G.room) { sendT += dt; if (sendT >= .05) { sendT = 0; G.room.send(s.snap()); } }
    if (s.ph === 'after') { if (s.mw >= 0) { s.ph = 'over'; } else s.nextRound(); }
  }
  var M = G.M;
  if (M) {
    V.a.st = M.st[0]; V.b.st = M.st[1]; V.bg = M.bg || 0;
    if (M.ph !== 'over') G.over = false;
    if (M.ph !== G.lastPh) { G.lastPh = M.ph; if (M.ph === 'over' && !G.over) { G.over = true; if (G.hook.over) G.hook.over(M.mw); } if (G.hook.phase) G.hook.phase(M.ph, M); }
  }
  V.a.flash = Math.max(0, V.a.flash - dt); V.b.flash = Math.max(0, V.b.flash - dt);
  GFX.pose(V.a, dt, G.tm); GFX.pose(V.b, dt, G.tm);
  G.parts.forEach(function (p) { p.life -= dt; if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; } });
  for (var i = G.parts.length - 1; i >= 0; i--) if (G.parts[i].life <= 0) G.parts.splice(i, 1);
  for (var j = G.pops.length - 1; j >= 0; j--) { var p = G.pops[j]; p.y -= 22 * dt; p.t -= dt; if (p.t <= 0) G.pops.splice(j, 1); }
  V.tm = G.tm; V.shake = G.shake; G.shake = Math.max(0, G.shake - 14 * dt);
  V.warn = G.mode !== 'menu';
  GFX.render(cx, V);
  if (G.hook.frame) G.hook.frame(M, dt);
  requestAnimationFrame(frame);
}
G.start = function () { requestAnimationFrame(frame); };
})(window);
