/* Kafes Dövüşü · oyun çekirdeği: dört vuruş (düz, kroşe, aparkat, tekme), savunma, dilekçe, zorluk, bilgisayar rakipler, antrenman,
   ses, sahne döngüsü ve çevrimiçi eşitleme. Tek kural seti hem bilgisayara hem gerçek rakibe karşı çalışır. Çevrimiçide ev sahibi oyunu yürütür. */
(function (root) {
'use strict';
var KF = root.KF, GFX = root.GFX;
var cv = document.getElementById('cv'), cx = cv.getContext('2d');
var RW = /^w[jhukl]$|^sp$/, RX = /^x[jhukl]$|^spstrike$/;
function rr(a, b) { return a + Math.random() * (b - a); }

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
  else if (k === 'kick') tone(260, .18, 'sawtooth', .03, -170);
  else if (k === 'hit') { thud(.16, .55, 1100); tone(110, .14, 'sine', .12, -60); }
  else if (k === 'heavy') { thud(.26, .8, 700); tone(80, .22, 'sine', .2, -40); }
  else if (k === 'block') { tone(210, .09, 'square', .05, -80); thud(.07, .25, 2400); }
  else if (k === 'perfect') { tone(880, .2, 'triangle', .08, 500); tone(1320, .25, 'triangle', .05, 300, .06); }
  else if (k === 'spec') { tone(300, .35, 'sawtooth', .05, 500); thud(.25, .5, 1600); }
  else if (k === 'ko') { thud(.5, .7, 600); tone(150, .6, 'sawtooth', .07, -110); }
  else if (k === 'cd') tone(440, .12, 'square', .04);
  else if (k === 'go') tone(740, .25, 'square', .05);
  else if (k === 'ui') tone(520, .05, 'square', .03);
  else if (k === 'jump') tone(300, .14, 'sine', .035, 260);
  else if (k === 'slip') { tone(620, .14, 'sine', .03, -380); thud(.1, .12, 3200); }
  else if (k === 'ok') { tone(660, .1, 'triangle', .06); tone(990, .15, 'triangle', .05, 0, .08); }
  else if (k === 'win') { tone(523, .15, 'triangle', .07); tone(659, .15, 'triangle', .07, 0, .15); tone(784, .3, 'triangle', .07, 0, .3); }
  else if (k === 'lose') { tone(300, .3, 'triangle', .07, -120); tone(200, .4, 'triangle', .07, -90, .25); }
};
KF.buzz = function (n) { if (KF.S.vib) try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} };

/* ---------- vuruşlar ve zorluk ---------- */
/* w: hazırlık süresi, rec: toparlanma, d: hasar, sd: savunmada yedirdiği dayanıklılık, hs: vurulana sersemlik, pierce: savunmadan geçen pay */
var MV = KF.MV = {
  j: { n: 'DÜZ', w: .15, rec: .14, d: 5, sd: 6, hs: .26 },
  h: { n: 'KROŞE', w: .30, rec: .26, d: 9, sd: 12, hs: .32 },
  u: { n: 'APARKAT', w: .42, rec: .38, d: 13, sd: 18, hs: .40, pierce: .5 },
  k: { n: 'TEKME', w: .48, rec: .42, d: 12, sd: 16, hs: .50 },
  l: { n: 'SÜPÜRME', w: .30, rec: .28, d: 7, sd: 10, hs: .38 }
};
/* özel hareketler (Street Fighter tarzı yön + vuruş): c: dayanıklılık bedeli, st: kullandığı poz */
var SM = KF.SM = {
  pf: { n: 'EVRAK TOPU', w: .3, rec: .36, d: 8, sd: 10, hs: .35, c: 25, st: 'sp' },
  dp: { n: 'YÜKSELEN APARKAT', w: .12, rec: .52, d: 16, sd: 22, hs: .62, pierce: .6, c: 32, st: 'u' },
  tk: { n: 'DÖNEN TEKME', w: .2, rec: .46, d: 14, sd: 18, hs: .5, c: 30, st: 'k' },
  a: { n: 'HAVA TEKMESİ', w: .12, rec: .2, d: 10, sd: 13, hs: .4, c: 0, st: 'k' }
};
var REACH = { j: 112, h: 108, u: 104, k: 128, l: 128, a: 112, dp: 106, tk: 150, s: 170 };
var WALL = [30, 370], MINGAP = 66;
function MA(k) { return MV[k] || SM[k]; }
var DIF = KF.DIF = {
  easy: { rd: .9, tell: 1.2, gap: 1.1, perf: .28, drain: 30, react: .8, pw: .9, dg: .5, dgw: .6, rt: [.16, .38] },
  normal: { rd: 1, tell: 1.1, gap: 1, perf: .22, drain: 36, react: 1, pw: 1, dg: 1, dgw: .44, rt: [.1, .3] },
  hard: { rd: 1.3, tell: .85, gap: .8, perf: .16, drain: 42, react: 1.25, pw: 1, dg: 1.2, dgw: .36, rt: [.07, .2] },
  pvp: { rd: 1, tell: 1, gap: 1, perf: .22, drain: 36, react: 1, pw: 1, dg: 1, dgw: .4, rt: [.1, .3] }
};
KF.VENUES = ['OTOPARK', 'KÖPRÜ ALTI', 'ORMAN', 'ÇAY BAHÇESİ', 'PAZAR YERİ', 'İSKELE', 'ÇATI', 'ŞANTİYE', 'METRO PERONU', 'HAYVANAT BAHÇESİ'];

/* ---------- dövüş kuralları ---------- */
function FS(hp) { return { hp: hp, max: hp, sp: 0, st: 'idle', t: 0, stam: 100, block: false, hold: false, blockT: 0, cd: 0, combo: 0, comboT: 0, mv: '', rt: .3, buf: null, x: 0, y: 0, vy: 0, air: false, aa: false, jv: 0, md: 0, dh: [], inv: false }; }
function Sim(o) {
  this.o = o; this.dif = DIF[o.dif || (o.cpu ? 'normal' : 'pvp')]; this.as = o.cpu ? Math.max(0, Math.min(3, o.assist || 0)) : 0;
  this.f = [FS(100), FS(o.hp || 100)]; this.f[0].x = 148; this.f[1].x = 252; this.pj = []; this.pid = 0;
  this.ev = []; this.eid = 0; this.time = o.time || 60; this.lock = o.train ? 1 : 2.4; this.lc = 4; this.ph = 'count'; this.endT = 0;
  this.cpu = o.cpu ? { t: 1.8, reacting: false, bt: 999, hold: 0, pm: null, walk: false, pr: false } : null;
  this.sc = [0, 0]; this.round = 1; this.bg = o.bg || 0; this.mw = -1; this.rw = -1;
}
Sim.prototype.motion = function (f, k) {
  var now = this.clock || 0, seq = f.dh.filter(function (e) { return now - e.t < .75; }).map(function (e) { return e.d; }).join('');
  if (k === 'j' && /d.*f$/.test(seq) && /d/.test(seq)) return 'pf';
  if (k === 'u' && /f.*d.*f$/.test(seq)) return 'dp';
  if (k === 'k' && /d.*b$/.test(seq)) return 'tk';
  return null;
};
Sim.prototype.mult = function (a) { return (this.cpu && a === 1) ? (this.o.dm || 1) * this.dif.rd * (1 - .1 * this.as) * (this.mercy() ? .8 : 1) : 1; };
Sim.prototype.emit = function (k, s, v, m) { this.eid++; this.ev.push({ id: this.eid, k: k, s: s, v: v || 0, m: m || '', ts: Date.now() }); };
Sim.prototype.input = function (i, k) {
  if (this.ph !== 'fight') return;
  var f = this.f[i]; if (f.st === 'ko') return;
  var mv = MV[k], sgn = i === 0 ? 1 : -1, now0 = this.clock || 0, sk = null;
  if (k === 'mf' || k === 'mb') { f.md = k === 'mf' ? 1 : -1; f.dh.push({ d: k === 'mf' ? 'f' : 'b', t: now0 }); if (f.dh.length > 8) f.dh.shift(); return; }
  if (k === 'mfu') { if (f.md > 0) f.md = 0; return; }
  if (k === 'mbu') { if (f.md < 0) f.md = 0; return; }
  if (k === 'dn') { f.dh.push({ d: 'd', t: now0 }); if (f.dh.length > 8) f.dh.shift(); return; }
  if (k === 'jp') {
    if (f.air || f.st !== 'idle' || f.cd > 0 || f.stam < 14) return;
    f.stam -= 12; f.air = true; f.aa = false; f.vy = 380; f.jv = f.md * sgn * 80; this.emit('jump', i, 0, ''); return;
  }
  var forced = k === 'xj' || k === 'xu' || k === 'xk', k0 = k;
  if (forced) { sk = { xj: 'pf', xu: 'dp', xk: 'tk' }[k]; k = k.charAt(1); mv = MV[k]; }
  else if ((k === 'j' || k === 'u' || k === 'k') && !f.air) sk = this.motion(f, k);
  if (sk && f.air) sk = null;
  if (sk) {
    if (f.st === 'rec' || RX.test(f.st)) { f.buf = { k: k0, t: .3 }; return; }
    if (f.st === 'block' || (f.block && f.st === 'idle')) { f.block = false; f.st = 'idle'; }
    var S0 = SM[sk];
    if (f.stam >= S0.c) {
      if (f.st !== 'idle' || f.cd > 0) return;
      f.dh.length = 0; f.stam -= S0.c; f.mv = sk; f.st = S0.st === 'sp' ? 'sp' : 'w' + S0.st; f.t = S0.w * ((this.cpu && i === 1) ? this.dif.tell * (1 + .1 * this.as) : this.dif.pw); f.rt = S0.rec; f.cd = .06; if (sk === 'dp') f.inv = true; this.emit('swing', i, 0, sk); return;
    }
  }
  if (f.air && mv && f.st === 'idle' && !f.aa) { var Sa = SM.a; f.aa = true; f.mv = 'a'; f.st = 'wk'; f.t = Sa.w; f.rt = Sa.rec; f.cd = .02; this.emit('swing', i, 0, 'a'); return; }
  if (f.air && k !== 'bd' && k !== 'bu') return;
  if (k === 'dg') {
    if (f.st === 'block' || (f.block && f.st === 'idle')) { f.block = false; f.st = 'idle'; }
    var now = this.clock || 0, chain = (f.dgAt != null && now - f.dgAt < 2.2) ? Math.min(3, (f.dgN || 0) + 1) : 1, cost = 20 + 9 * (chain - 1);
    if (f.st !== 'idle' || f.cd > 0 || f.stam < cost) return;
    f.dgN = chain; f.dgAt = now; f.stam -= cost; f.st = 'dg'; f.t = this.dif.dgw || .4; f.rt = .24; this.emit('slip', i, 0, ''); return;
  }
  if (mv || k === 's') {
    if (f.st === 'rec' || RX.test(f.st)) { f.buf = { k: k, t: .3 }; return; }
    if (f.block && f.st === 'block') { f.block = false; f.st = 'idle'; }
    if (f.st !== 'idle' || f.cd > 0) return;
    if (k === 's') { if (f.sp < 100) return; f.sp = 0; f.mv = 's'; f.st = 'sp'; f.t = .4; f.rt = .5; this.emit('swing', i, 0, 's'); }
    else { f.mv = k; f.st = 'w' + k; f.t = mv.w * ((this.cpu && i === 1) ? this.dif.tell * (1 + .1 * this.as) : this.dif.pw); f.rt = mv.rec; f.cd = .06; this.emit('swing', i, 0, k); }
  } else if (k === 'bd') { f.hold = true; if (f.st === 'idle' && f.stam > 6 && !f.block) { f.block = true; f.blockT = 0; f.st = 'block'; } }
  else if (k === 'bu') { f.hold = false; if (f.block) { f.block = false; if (f.st === 'block') f.st = 'idle'; } }
};
function pick(mix, vuln, opBlock, opDodge) {
  var ks = ['j', 'h', 'u', 'k', 'l'], tot = 0, w = ks.map(function (k) { var v = (mix[k] || 0) * (vuln && (k === 'j' || k === 'h') ? 1.6 : 1) * (opBlock && k === 'u' ? 2.4 : 1) * (opDodge && k === 'l' ? 4 : 1); tot += v; return v; }), x = Math.random() * tot, i;
  for (i = 0; i < 5; i++) { x -= w[i]; if (x <= 0) return ks[i]; }
  return 'j';
}
/* yardım: kaybettikçe artar (0-3), bilgisayar yavaşlar ve zayıflar. Merhamet: oyuncu ölmek üzereyken bilgisayar nefes aldırır. */
Sim.prototype.mercy = function () { var op = this.f[0], me = this.f[1]; return this.cpu && op.hp < 35 && me.hp > op.hp + 20 ? 1 : 0; };
Sim.prototype.runCpu = function (dt) {
  var c = this.cpu, L = this.o.cpu, d = this.dif, me = this.f[1], op = this.f[0];
  c.t -= dt; c.hold -= dt;
  var opAtk = RW.test(op.st);
  if (opAtk) { if (!c.reacting) { c.reacting = true; c.bt = Math.random() < Math.min(.95, L.react * d.react * (1 - .18 * this.as)) ? rr(d.rt[0], d.rt[1]) * (1 + .12 * this.as) : 999; } } else c.reacting = false;
  if (c.reacting && c.bt < 999) {
    c.bt -= dt;
    if (c.bt <= 0) { c.bt = 999; if (op.mv !== 'l' && me.stam >= 30 && Math.random() < (L.dodge || 0) * d.dg * (1 - .25 * this.as)) { this.input(1, 'dg'); c.hold = 0; } else { this.input(1, 'bd'); c.hold = .5; } }
  }
  if ((me.block || me.hold) && !opAtk && c.hold <= 0) this.input(1, 'bu');
  if (opAtk && c.walk) { this.input(1, 'mfu'); c.walk = false; }
  var self = this, inc = this.pj.some(function (p) { return p.o === 0 && Math.abs(p.x - me.x) < 95; });
  if (inc && !c.pr) {
    c.pr = true;
    if (Math.random() < Math.min(.95, L.react * d.react * (1 - .18 * this.as)) + .25) { if (Math.random() < .6) { this.input(1, 'bd'); c.hold = .55; } else this.input(1, 'jp'); }
  }
  if (!inc) c.pr = false;
  if (!me.block && !me.hold && c.t <= 0 && me.st === 'idle' && me.cd <= 0 && !opAtk && !me.air) {
    var dist = Math.abs(me.x - op.x), as = 1 - .3 * this.as;
    if (!c.pm) {
      if (op.air && dist < 122 && me.stam >= 32 && Math.random() < .5 * as) { this.input(1, 'xu'); c.t = rr(.5, .9); return; }
      if (dist > 165 && me.stam >= 25 && Math.random() < (.12 + (L.dodge || 0) * .7) * as) { this.input(1, 'xj'); c.t = rr(1, 1.7); return; }
      if (dist > 114 && dist < 150 && me.stam >= 30 && (L.mix.k || 0) >= .1 && Math.random() < .3 * as) { this.input(1, 'xk'); c.t = rr(.8, 1.4); return; }
      c.pm = me.sp >= 100 && Math.random() < .7 ? 's' : null;
    }
    var vuln = op.st === 'rec' || op.st === 'hit' || op.st === 'stun' || RX.test(op.st);
    if (!c.pm) c.pm = pick(L.mix, vuln, op.block, op.st === 'dg' || c.dodged > 0);
    if (dist > (c.pm === 's' ? 170 : { j: 112, h: 108, u: 104, k: 128, l: 128 }[c.pm]) - 5) { if (!c.walk) { this.input(1, 'mf'); c.walk = true; } c.t = .05; return; }
    if (c.walk) { this.input(1, 'mfu'); c.walk = false; }
    this.input(1, c.pm); c.pm = null;
    c.dodged = Math.max(0, (c.dodged || 0) - 1); c.t = (Math.random() < L.dbl * (1 - .3 * this.as) ? .15 : rr(L.gap[0], L.gap[1])) * d.gap * (1 + .16 * this.as) * (1 + .45 * this.mercy());
  }
};
Sim.prototype.resolve = function (land) {
  var F = this.f, self = this, snap = F.map(function (f) { return { block: f.block, bt: f.blockT, dg: f.st === 'dg', air: f.y > 22, inv: f.inv }; }), out = [], dist = Math.abs(F[1].x - F[0].x);
  land = land.filter(function (a) {
    var A = F[a];
    if (A.mv === 'pf') { self.pj.push({ id: ++self.pid, o: a, x: A.x + (a ? -30 : 30), v: (a ? -1 : 1) * 215 }); A.st = 'spstrike'; A.t = .16; A.cd = .08; self.emit('fire', a, 0, 'pf'); return false; }
    if (A.mv === 'tk') { var room = Math.max(0, dist - MINGAP - 4); A.x += (a ? -1 : 1) * Math.min(46, room); dist = Math.abs(F[1].x - F[0].x); }
    return true;
  });
  land.forEach(function (a) {
    var A = F[a], d = 1 - a, S = snap[d], sp = A.st === 'sp', m = MA(A.mv) || MV.j;
    var mult = self.mult(a);
    var dmg = Math.max(1, Math.round((sp ? 22 : m.d + Math.min(A.combo, 4)) * mult));
    var mk = sp ? 's' : A.mv; if (S.dg && mk === 'l') dmg = Math.round(dmg * 1.4);
    var far = dist > (REACH[mk] || 120), airMiss = S.air && !(mk === 'u' || mk === 'dp' || mk === 'a' || mk === 's');
    out.push({ a: a, d: d, dmg: dmg, mv: mk, air: S.air, res: far ? 'whiff' : (S.inv && mk !== 's' ? 'dodge' : ((S.dg && mk !== 'l') || airMiss ? 'dodge' : (sp ? 'spec' : (S.block ? (S.bt <= self.dif.perf ? 'perfect' : 'block') : 'hit')))) });
  });
  out.forEach(function (o) {
    var A = F[o.a], D = F[o.d], m = MA(o.mv) || { sd: 0, hs: .9 }, wasWind = RW.test(D.st), simult = out.some(function (q) { return q.a === o.d && q.res !== 'whiff'; });
    A.st = o.mv === 's' ? 'spstrike' : 'x' + (SM[o.mv] ? SM[o.mv].st : o.mv); A.t = .14; A.cd = .08;
    if (o.res === 'whiff') { A.rt = (m.rec || .4) + .16; A.combo = 0; self.emit('whiff', o.a, 0, o.mv); }
    else if (o.res === 'dodge') { if (self.cpu && o.a === 1) self.cpu.dodged = 3; A.rt = (m.rec || .5) + .32; A.combo = 0; D.sp = Math.min(100, D.sp + 12); D.stam = Math.min(100, D.stam + 8); self.emit('dodge', o.d, o.air ? 1 : 0, o.mv); }
    else if (o.res === 'perfect') { A.st = 'stun'; A.t = 1.0; A.combo = 0; D.sp = Math.min(100, D.sp + 18); self.emit('perfect', o.d, 0, o.mv); }
    else if (o.res === 'block') {
      var dm = Math.max(1, Math.round(o.dmg * (m.pierce || .2))); D.hp -= dm; D.sp = Math.min(100, D.sp + 8); D.stam -= m.sd; A.combo = 0;
      if (!m.pierce) { A.st = 'stun'; A.t = .3; }
      self.emit('block', o.d, dm, o.mv);
    } else {
      D.hp -= o.dmg; D.block = false; D.combo = 0; D.comboT = 0; D.sp = Math.min(100, D.sp + 5); D.buf = null;
      var armor = (D.st === 'sp' || D.st === 'wu' || D.st === 'wk') && o.mv === 'j' && !D.inv;
      if (o.res === 'spec') { D.st = 'stun'; D.t = .9; } else if (!simult && !armor) { D.st = 'hit'; D.t = m.hs; }
      A.combo++; A.comboT = 1.3; if (o.res === 'hit') A.sp = Math.min(100, A.sp + 9);
      self.emit(o.res, o.d, o.dmg, o.mv); if (wasWind && !simult && !armor && o.res === 'hit') self.emit('cut', o.d, 0, o.mv);
    }
  });
};
Sim.prototype.finish = function () {
  var F = this.f, d0 = F[0].hp <= 0, d1 = F[1].hp <= 0, w;
  if (d0 && d1) w = -1; else if (d0) w = 1; else if (d1) w = 0;
  else w = F[0].hp > F[1].hp ? 0 : (F[1].hp > F[0].hp ? 1 : -1);
  this.pj = []; F.forEach(function (f, i) { f.md = 0; f.block = false; f.hold = false; f.buf = null; if (w >= 0 && i !== w) f.st = f.hp <= 0 ? 'ko' : 'stun'; else if (w < 0 && f.hp <= 0) f.st = 'ko'; else if (w >= 0) f.st = 'idle'; });
  if (w >= 0) this.sc[w]++;
  this.mw = this.o.solo ? w : (this.sc[0] >= 2 ? 0 : (this.sc[1] >= 2 ? 1 : -1));
  this.ph = 'end'; this.endT = 2; this.rw = w; this.emit('end', w, F[0].hp <= 0 || F[1].hp <= 0 ? 1 : 0);
};
Sim.prototype.nextRound = function () {
  this.round++; this.bg = this.o.solo ? this.bg : ((this.round - 1) * 3) % KF.VENUES.length; this.time = this.o.time || 60; this.lock = 2.4; this.lc = 4; this.ph = 'count';
  var hp1 = this.f[1].max; this.f = [FS(100), FS(hp1)]; this.f[0].x = 148; this.f[1].x = 252; this.pj = []; if (this.cpu) this.cpu = { t: 1.8, reacting: false, bt: 999, hold: 0, pm: null, walk: false, pr: false };
};
Sim.prototype.step = function (dt) {
  var F = this.f, i, land = [];
  if (this.ph === 'count') { this.lock -= dt; var n = Math.ceil(this.lock / .6); if (n !== this.lc && n >= 1) { this.lc = n; this.emit('cd', -1, n); } if (this.lock <= 0) { this.ph = 'fight'; this.emit('cd', -1, 0); } return; }
  if (this.ph === 'end') { this.endT -= dt; if (this.endT <= 0) this.ph = 'after'; return; }
  if (this.ph !== 'fight') return;
  this.clock = (this.clock || 0) + dt;
  if (!this.o.train) this.time -= dt;
  if (this.cpu) this.runCpu(dt);
  for (i = 0; i < 2; i++) {
    var f = F[i]; f.cd = Math.max(0, f.cd - dt);
    if (f.comboT > 0) { f.comboT -= dt; if (f.comboT <= 0) f.combo = 0; }
    if (f.block) { f.blockT += dt; f.stam -= this.dif.drain * dt; }
    if (f.block && f.stam <= 0) { f.stam = 0; f.block = false; f.hold = false; f.st = 'stun'; f.t = .6; this.emit('break', i); }
    else if (!f.block) f.stam = Math.min(100, f.stam + 25 * dt);
    if (RW.test(f.st)) { f.t -= dt; if (f.t <= 0) land.push(i); }
    else if (RX.test(f.st)) { f.t -= dt; if (f.t <= 0) { f.st = 'rec'; f.t = f.rt || .26; } }
    else if (f.st === 'dg') { f.t -= dt; if (f.t <= 0) { f.st = 'rec'; f.t = f.rt || .24; } }
    else if (f.st === 'rec' || f.st === 'hit' || f.st === 'stun') { f.t -= dt; if (f.t <= 0) f.st = 'idle'; }
    if (f.buf) { f.buf.t -= dt; if (f.buf.t <= 0) f.buf = null; else if (f.st === 'idle' && f.cd <= 0) { var b = f.buf.k; f.buf = null; this.input(i, b); } }
    if (f.hold && !f.block && f.st === 'idle' && f.stam > 12) { f.block = true; f.blockT = 0; f.st = 'block'; }
    /* hareket: yürüme, zıplama, sınırlar */
    var sg = i ? -1 : 1;
    if (f.inv && !(f.mv === 'dp' && (f.st === 'wu' || f.st === 'xu'))) f.inv = false;
    if (f.air) {
      f.y += f.vy * dt; f.vy -= 1150 * dt; f.x += f.jv * dt;
      if (f.y <= 0) { f.y = 0; f.vy = 0; f.air = false; f.aa = false; f.jv = 0; f.cd = Math.max(f.cd, .09); }
    } else if (f.md && f.st === 'idle' && !f.block && !f.hold && f.cd <= 0) f.x += sg * f.md * (f.md > 0 ? 74 : 60) * dt;
    f.x = Math.max(WALL[0], Math.min(WALL[1], f.x));
  }
  var gap = F[1].x - F[0].x;
  if (gap < MINGAP) {
    var sh = (MINGAP - gap) / 2; F[0].x -= sh; F[1].x += sh;
    if (F[0].x < WALL[0]) { F[1].x += WALL[0] - F[0].x; F[0].x = WALL[0]; } if (F[1].x > WALL[1]) { F[0].x -= F[1].x - WALL[1]; F[1].x = WALL[1]; }
  }
  this.resolve(land);
  this.stepPj(dt);
  if (this.o.train) { F[1].hp = F[1].max; if (F[0].hp < 40) F[0].hp = 40; this.time = 99; return; }
  if (F[0].hp <= 0 || F[1].hp <= 0 || this.time <= 0) this.finish();
};
/* evrak topu: yere yakın uçar; zıplayan geçer, savunan yer, sıyrılan ıskalar */
Sim.prototype.stepPj = function (dt) {
  var F = this.f, self = this;
  this.pj = this.pj.filter(function (p) {
    p.x += p.v * dt; var D = F[1 - p.o], A = F[p.o];
    if (p.x < -20 || p.x > 420) return false;
    if (Math.abs(p.x - D.x) > 20) return true;
    if (D.y > 30 || D.inv || D.st === 'dg' || D.st === 'ko') return true;
    if (D.block) { var bd = Math.max(1, Math.round(2 * self.mult(p.o))); D.hp -= bd; D.stam -= 10; D.sp = Math.min(100, D.sp + 5); self.emit('block', 1 - p.o, bd, 'pf'); return false; }
    var dm = Math.max(1, Math.round(SM.pf.d * self.mult(p.o)));
    D.hp -= dm; D.st = 'hit'; D.t = SM.pf.hs; D.block = false; D.buf = null; D.combo = 0; D.sp = Math.min(100, D.sp + 5); A.sp = Math.min(100, A.sp + 6);
    self.emit('hit', 1 - p.o, dm, 'pf'); return false;
  });
};
Sim.prototype.snap = function () {
  var now = Date.now(), F = this.f;
  return { t: 's', ph: this.ph, tm: Math.max(0, Math.ceil(this.time)), sc: this.sc, rn: this.round, bg: this.bg, mw: this.mw, rw: this.rw,
    f: F.map(function (f) { return [Math.max(0, Math.round(f.hp)), Math.round(f.sp), f.st, Math.round(f.stam), f.combo, f.block ? 1 : 0, Math.round(f.max), Math.round(f.x), Math.round(f.y)]; }),
    pj: this.pj.map(function (p) { return [p.id, Math.round(p.x), p.o]; }),
    ev: this.ev.filter(function (e) { return now - e.ts < 1500; }).map(function (e) { return [e.id, e.k, e.s, e.v, e.m]; }) };
};
KF.Sim = Sim;

/* ---------- rakipler: turnuva sırası ve serbest maç listesi ---------- */
function opp(k, name, av, bg, hp, dm, mix, gap, react, dbl, dodge, desc) { return { k: k, look: k, name: name, av: av, bg: bg, hp: hp, dm: dm, mix: mix, gap: gap, react: react, dbl: dbl, dodge: dodge, desc: desc }; }
KF.OPPS = {
  zabita: opp('zabita', 'ZABITA ZEKİ', '👮', 0, 60, .8, { j: .6, h: .3, u: .05, k: .05 }, [1.4, 2.4], .15, 0, 0, 'Kaçak park cezası kesmeden uyuyamaz. Düdüğü ölümcül.'),
  cayci: opp('cayci', 'ÇAYCI CEMAL', '🍵', 3, 70, .85, { j: .4, h: .35, u: .1, k: .1, l: .05 }, [1.2, 2.1], .25, 0, .1, 'Demli yumruk atar. Tavşan kanı hakeme kadar gider.'),
  pazarci: opp('pazarci', 'PAZARCI PEMBE', '🍅', 4, 80, .9, { j: .35, h: .3, u: .1, k: .15, l: .1 }, [1.1, 1.9], .3, .1, .15, 'Hesabı hızlı yapar, yumruğu daha hızlı atar. Pazarlığa gelmez.'),
  sprinkci: opp('sprinkci', 'SPRİNKCİ SERKAN', '💦', 3, 78, .9, { j: .35, h: .25, u: .1, k: .1, l: .2 }, [1.1, 1.9], .3, .1, .45, 'Hortumunu bırakıp yumruğa sarılır. Sırılsıklam, kaygan, tutması zor.'),
  imzaci: opp('imzaci', 'İMZACI İSMET', '🖋️', 1, 100, 1.02, { j: .25, h: .25, u: .25, k: .1, l: .15 }, [1, 1.65], .42, .2, .3, 'Her yumruğa paraf atar, ıslak imza ister. Dilekçesiz dövmez.'),
  trol: opp('trol', 'TROL TOLGA', '😏', 6, 88, .95, { j: .3, h: .2, u: .1, k: .15, l: .25 }, [.95, 1.7], .4, .25, .5, 'Yorum bölümünün korkulu rüyası. Yumruğu atar, sonra şaka yaptım der. Sürekli kaçar.'),
  haritaci: opp('haritaci', 'HARİTACI HAKKI', '🗺️', 7, 85, .95, { j: .3, h: .25, u: .15, k: .15, l: .15 }, [1.05, 1.8], .35, .1, .3, 'Her yumruğu önce ölçer, sonra atar. Kot farkı kafayı yer.'),
  jaloncu: opp('jaloncu', 'JALONCU CELAL', '📏', 2, 90, .95, { j: .3, h: .2, u: .1, k: .15, l: .25 }, [1, 1.7], .4, .15, .3, 'Kırmızı beyaz jalonuyla ölçü verir, ardından süpürür. Hep bir adım ötede durur.'),
  mudure: opp('mudure', 'MÜDİRE MUALLA', '💼', 1, 95, 1, { j: .3, h: .3, u: .2, k: .1, l: .1 }, [1, 1.7], .4, .2, .25, 'Gece mesaisi faturası keser. Bazen arka arkaya iki kez vurur.'),
  kaptan: opp('kaptan', 'KAPTAN KEMAL', '⚓', 5, 100, 1.05, { j: .25, h: .25, u: .25, k: .15, l: .1 }, [.95, 1.6], .45, .2, .3, 'Fırtınada bile dümen tutar. Aparkatı gemi batırır.'),
  bahcivan: opp('bahcivan', 'BAHÇIVAN BEKİR', '🌿', 9, 115, 1.1, { j: .2, h: .3, u: .25, k: .15, l: .1 }, [.9, 1.5], .5, .25, .35, 'Hasır şapkalı, çelik yumruklu. Hayvanat bahçesinin tek hâkimi.'),
  mezarci: opp('mezarci', 'MEZARCI MEMDUH', '⚰️', 2, 118, 1.14, { j: .15, h: .3, u: .3, k: .1, l: .15 }, [1, 1.6], .45, .2, .3, 'Kimseyi aceleye getirmez, hep son sözü o söyler. Küreği her zaman hazır.'),
  kavurmaci: opp('kavurmaci', 'KAVURMACI KERİM', '🥩', 8, 125, 1.12, { j: .15, h: .3, u: .3, k: .15, l: .1 }, [.9, 1.45], .45, .25, .15, 'Sabah kavurduğu eti akşam yumruğa çevirir. Tavayı bırakınca çok daha tehlikeli.'),
  sofor: opp('sofor', 'TIR ŞOFÖRÜ TAHSİN', '🚛', 6, 135, 1.2, { j: .2, h: .25, u: .25, k: .2, l: .1 }, [.8, 1.3], .55, .3, .4, 'Kırk yıllık direksiyon, kırk ton yumruk. Final patronu.'),
  avukat: opp('avukat', 'AVUKAT ASLI', '⚖️', 6, 90, 1, { j: .35, h: .25, u: .1, k: .15, l: .15 }, [1, 1.7], .4, .15, .4, 'Her yumruğa itiraz eder, her itirazı kazanır.'),
  itfaiyeci: opp('itfaiyeci', 'İTFAİYECİ İLHAN', '🚒', 8, 110, 1.1, { j: .2, h: .3, u: .25, k: .15, l: .1 }, [.9, 1.5], .5, .2, .3, 'Ateşi söndürür, rakibi de söndürür.'),
  asci: opp('asci', 'AŞÇI ARİF', '🍳', 4, 105, 1.05, { j: .25, h: .25, u: .25, k: .15, l: .1 }, [1, 1.6], .45, .2, .3, 'Hamur gibi yoğurur, tava gibi çalar.')
};
KF.LADDER = ['zabita', 'cayci', 'sprinkci', 'pazarci', 'haritaci', 'trol', 'jaloncu', 'mudure', 'imzaci', 'kaptan', 'bahcivan', 'kavurmaci', 'mezarci', 'sofor'];
KF.DUMMY = { k: 'zabita', look: 'zabita', name: 'ÇIRAK CEMİL', av: '🥋', bg: 0, hp: 999, dm: .25, mix: { h: 1 }, gap: [2.6, 3.4], react: 0, dbl: 0, dodge: 0, desc: 'Antrenman partneri. Vurmaz, sadece öğretir.' };

/* ---------- denetleyici ---------- */
var G = KF.G = { mode: 'menu', sim: null, room: null, net: null, me: 0, M: null, parts: [], pops: [], shake: 0, freeze: 0, tm: 0, seen: 0, hook: {}, names: ['', ''], avs: ['', ''], lastPh: '', over: false, paused: false };
var V = G.V = { a: GFX.mkF(148, GFX.LOOKS.muhendis), b: GFX.mkF(252, GFX.LOOKS.zabita), bg: 0, flip: false, parts: G.parts, pops: G.pops, shake: 0, tm: 0, warn: true };
function setLooks(l0, l1) {
  var A = GFX.LOOKS[l0] || GFX.LOOKS.muhendis, B = GFX.LOOKS[l1] || GFX.LOOKS.zabita;
  if (A === B) { var c = {}, k; for (k in B) c[k] = B[k]; c.shirt = B.pants; c.pants = B.shirt; if (B.vest) c.vest = B.pants; c.hatc = B.glove; c.glove = B.shirt; B = c; }
  V.a = GFX.mkF(148, A); V.b = GFX.mkF(252, B); V.pj = [];
}
G.setLooks = setLooks;
function reset() { G.seen = 0; G.parts.length = 0; G.pops.length = 0; G.over = false; G.lastPh = ''; G.M = null; G.freeze = 0; }
G.stop = function () {
  if (G.room) { try { G.room.close(); } catch (e) {} G.room = null; }
  if (G.guest) { try { G.guest.leave(); G.guest.close(); } catch (e) {} G.guest = null; }
  G.sim = null; G.mode = 'menu'; V.flip = false; V.bg = 0; G.paused = false; reset();
};
function ensureNet() { if (!G.net) G.net = new KF.Net(); return G.net; }
G.getNet = ensureNet;

/* cfg: {hp, sp, dif, train, lv} */
G.solo = function (o, bg, cfg) {
  G.stop(); cfg = cfg || {};
  G.mode = 'solo'; G.opp = o; G.lv = cfg.lv == null ? -1 : cfg.lv; G.me = 0; G.train = !!cfg.train; reset();
  var sim = G.sim = new Sim({ cpu: o, hp: o.hp, dm: o.dm, time: 75, bg: bg, solo: true, dif: cfg.dif || KF.S.dif || 'easy', train: !!cfg.train, assist: cfg.train ? 0 : (cfg.assist != null ? cfg.assist : (KF.S.assist || 0)) });
  if (cfg.hp != null) sim.f[0].hp = cfg.hp; if (cfg.sp) sim.f[0].sp = cfg.sp;
  setLooks(KF.S.look, o.look); V.bg = bg; G.names = [KF.S.name || (GFX.LOOKS[KF.S.look] || {}).name || 'Mühendis', o.name]; G.avs = [KF.S.av, o.av || '🥊'];
};
G.host = function (pub) {
  G.stop(); var net = ensureNet();
  return net.start().catch(function (e) { if (!KF.hasP2P()) throw e; }).then(function () {
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
  return net.start().catch(function (e) { if (!KF.hasP2P()) throw e; }).then(function () {
    var g = new KF.Guest(net, code); G.guest = g; G.mode = 'lobbyG';
    g.onMsg = function (m) { if (m.t === 's') applySnap(m); };
    return g;
  });
};
G.input = function (k) {
  if (G.paused) return;
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
  G.M = { ph: m.ph, tm: m.tm, sc: m.sc, rn: m.rn, bg: m.bg, mw: m.mw, rw: m.rw, hp: [m.f[0][0], m.f[1][0]], sp: [m.f[0][1], m.f[1][1]], st: [m.f[0][2], m.f[1][2]], stam: [m.f[0][3], m.f[1][3]], combo: [m.f[0][4], m.f[1][4]], max: [m.f[0][6], m.f[1][6]], x: [m.f[0][7], m.f[1][7]], y: [m.f[0][8], m.f[1][8]], pj: m.pj || [] };
  m.ev.forEach(function (a) { if (a[0] > G.seen) { G.seen = a[0]; handleEv({ k: a[1], s: a[2], v: a[3], m: a[4] || '' }); } });
  g.lastHost = Date.now();
}
function modelFromSim(s) {
  var F = s.f; return { ph: s.ph, tm: Math.max(0, Math.ceil(s.time)), sc: s.sc, rn: s.round, bg: s.bg, mw: s.mw, rw: s.rw, hp: [F[0].hp, F[1].hp], sp: [F[0].sp, F[1].sp], st: [F[0].st, F[1].st], stam: [F[0].stam, F[1].stam], combo: [F[0].combo, F[1].combo], max: [F[0].max, F[1].max], x: [F[0].x, F[1].x], y: [F[0].y, F[1].y], pj: s.pj.map(function (p) { return [p.id, p.x, p.o]; }) };
}

/* ---------- olaylar -> görsel ve ses ---------- */
function fx(seat) { return seat === 0 ? V.a : V.b; }
function spark(x, y, col, n) { for (var i = 0; i < n; i++) G.parts.push({ k: 'spark', x: x, y: y, vx: rr(-190, 190), vy: rr(-190, 40), g: 380, c: col, life: .4, max: .4 }); }
function pop(x, y, txt, col) { G.pops.push({ x: x, y: y, txt: txt, col: col, t: .9 }); }
var SHK = { j: 2, h: 4, u: 6, k: 6, l: 3, s: 8, dp: 7, tk: 6, a: 3, pf: 3 }, FRZ = { j: .03, h: .05, u: .08, k: .08, l: .05, s: .1, dp: .09, tk: .08, a: .04, pf: .03 };
function handleEv(e) {
  var me = G.me, mine = e.s === me, f = e.s >= 0 ? fx(e.s) : null, mv = e.m, side = e.s === 0 ? 1 : -1, hy = mv === 'k' ? 190 : (mv === 'l' ? 218 : 152), hs = G.hook;
  if (e.k === 'swing') { KF.sfx(e.m === 'k' || e.m === 'l' || e.m === 'tk' || e.m === 'a' ? 'kick' : 'swing'); if (SM[e.m] && SM[e.m].c && hs.callout) hs.callout(SM[e.m].n, mine ? '#ffd23f' : '#ff9a5e'); }
  else if (e.k === 'fire') KF.sfx('spec');
  else if (e.k === 'jump') KF.sfx('jump');
  else if (e.k === 'whiff') pop(f.x, 112, 'ISKA', '#9a9aa4');
  else if (e.k === 'hit' || e.k === 'spec') {
    var strong = mv === 'u' || mv === 'k' || mv === 's' || mv === 'dp' || mv === 'tk';
    f.flash = .13; spark(f.x + side * 10, hy, '#ffd23f', strong ? 16 : 9); G.parts.push({ k: 'ring', x: f.x + side * 14, y: hy, c: '#fff', life: .3, max: .3 });
    if (strong) G.parts.push({ k: 'burst', x: f.x + side * 12, y: hy, c: '#ffe27a', life: .22, max: .22 });
    pop(f.x, 118, '-' + e.v, mine ? '#ff6b5e' : '#ffd23f'); G.shake = SHK[mv] || 4; G.freeze = FRZ[mv] || .04; KF.sfx(e.k === 'spec' ? 'spec' : (strong ? 'heavy' : 'hit')); if (mine) KF.buzz(strong ? 60 : 35);
    if (e.k === 'spec') { for (var i = 0; i < 10; i++) G.parts.push({ k: 'paper', x: f.x + side * 50, y: rr(130, 190), vx: side * rr(120, 220), vy: rr(-60, 20), g: 90, rot: rr(0, 6), life: .6, max: .6 }); if (hs.callout) hs.callout('DİLEKÇE İMZALANDI!', '#d9ab4c'); }
    else if (mv === 'u' && hs.callout && !mine) hs.callout('APARKAT!', '#ffd23f');
  } else if (e.k === 'block') { spark(f.x + side * 14, 150, '#8cc8ff', 7); pop(f.x, 118, 'SAVUNDU', '#8cc8ff'); KF.sfx('block'); G.shake = 2; }
  else if (e.k === 'perfect') { spark(f.x + side * 14, 150, '#6fe3ff', 16); G.parts.push({ k: 'burst', x: f.x + side * 14, y: 150, c: '#6fe3ff', life: .25, max: .25 }); G.shake = 4; G.freeze = .08; KF.sfx('perfect'); if (hs.callout) hs.callout('KUSURSUZ SAVUNMA!', '#6fe3ff'); KF.buzz(25); }
  else if (e.k === 'slip') { KF.sfx('slip'); }
  else if (e.k === 'dodge') { spark(f.x - side * 6, 140, '#bfe4ff', 12); G.parts.push({ k: 'ring', x: f.x, y: 140, c: '#8cc8ff', life: .3, max: .3 }); pop(f.x, 112, e.v ? 'HAVADA!' : 'SIYRILDI!', '#8cc8ff'); KF.sfx('perfect'); G.shake = 2; if (mine && hs.callout) hs.callout('SIYRILDIN!', '#8cc8ff'); }
  else if (e.k === 'cut') pop(f.x, 100, mine ? 'KESİLDİ' : 'KESTİN!', mine ? '#ff9a5e' : '#9aff9a');
  else if (e.k === 'break') { pop(f.x, 118, 'SAVUNMA KIRILDI', '#ff9a5e'); KF.sfx('block'); }
  else if (e.k === 'cd') { if (hs.callout) hs.callout(e.v === 0 ? 'DÖVÜŞ!' : String(e.v), e.v === 0 ? '#d9ab4c' : '#fff'); KF.sfx(e.v === 0 ? 'go' : 'cd'); }
  else if (e.k === 'end') { if (hs.callout) hs.callout(e.v ? 'K.O.!' : 'SÜRE DOLDU', '#d9ab4c'); KF.sfx('ko'); G.shake = 6; }
  if (hs.ev) hs.ev(e, G);
}

/* ---------- döngü ---------- */
var last = 0, acc = 0, sendT = 0;
function frame(ts) {
  var dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts; G.tm += dt;
  var s = G.sim, fz = G.freeze > 0;
  if (fz) G.freeze -= dt;
  if (s && G.mode !== 'guest' && !G.paused && !fz) {
    acc += dt;
    while (acc >= 1 / 60) { s.step(1 / 60); acc -= 1 / 60; }
    G.M = modelFromSim(s);
    s.ev.forEach(function (e) { if (e.id > G.seen) { G.seen = e.id; handleEv(e); } });
    var now = Date.now(); s.ev = s.ev.filter(function (e) { return now - e.ts < 3000; });
    if (G.mode === 'host' && G.room) { sendT += dt; if (sendT >= (G.room.direct() ? .05 : .08)) { sendT = 0; G.room.send(s.snap()); } }
    if (s.ph === 'after') { if (s.mw >= 0) s.ph = 'over'; else s.nextRound(); }
  } else if (s && G.mode === 'host' && G.room && !G.paused) { sendT += dt; if (sendT >= .05) { sendT = 0; G.room.send(s.snap()); } }
  var M = G.M;
  if (M) {
    V.a.st = M.st[0]; V.b.st = M.st[1]; V.bg = M.bg || 0; V.a.hurt = 1 - M.hp[0] / M.max[0]; V.b.hurt = 1 - M.hp[1] / M.max[1];
    if (M.ph !== 'over') G.over = false;
    if (M.ph !== G.lastPh) { G.lastPh = M.ph; if (M.ph === 'over' && !G.over) { G.over = true; if (G.hook.over) G.hook.over(M.mw); } if (G.hook.phase) G.hook.phase(M.ph, M); }
  }
  if (M && M.x) {
    var kk = Math.min(1, dt * 24), oa = V.a.x, ob = V.b.x;
    V.a.x += (M.x[0] - V.a.x) * kk; V.b.x += (M.x[1] - V.b.x) * kk;
    if (dt > 0) { V.a.mvx = (V.a.mvx || 0) * .6 + ((V.a.x - oa) / dt) * .4; V.b.mvx = (V.b.mvx || 0) * .6 + (-(V.b.x - ob) / dt) * .4; }
    V.a.jy = M.y[0]; V.b.jy = M.y[1]; V.pj = M.pj || [];
  }
  V.a.flash = Math.max(0, V.a.flash - dt); V.b.flash = Math.max(0, V.b.flash - dt);
  if (!fz) { GFX.pose(V.a, dt, G.tm); GFX.pose(V.b, dt, G.tm); }
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
