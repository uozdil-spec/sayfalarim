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
  if (!KF.S.sfx || !ac() || (!delay && busy())) return;
  try {
    var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (delay || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (sl) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + sl), t + d);
    g.gain.setValueAtTime(v || .06, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02);
  } catch (e) {}
}
var NB = {}, sndN = [];
function busy() { var t = Date.now(); sndN = sndN.filter(function (x) { return t - x < 70; }); if (sndN.length >= 5) return true; sndN.push(t); return false; }
function thud(d, v, lp) {
  if (!KF.S.sfx || !ac() || busy()) return;
  try {
    var key = d.toFixed(2), b = NB[key], i;
    if (!b) { var n = Math.floor(AC.sampleRate * d), a; b = NB[key] = AC.createBuffer(1, n, AC.sampleRate); a = b.getChannelData(0); for (i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
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
/* karakter istatistikleri (yalnızca insan oyuncular için): spd yürüme, pow hasar, rng menzil, hp can; sig imza kombo */
var STATS = KF.STATS = {
  muhendis: { spd: 1, pow: 1, rng: 1, hp: 1, sig: 'jhu' }, zabita: { spd: 1.03, pow: .98, rng: 1.04, hp: 1, sig: 'jjk' }, cayci: { spd: 1.1, pow: .9, rng: .94, hp: .96, sig: 'jjh' },
  pazarci: { spd: 1.06, pow: .96, rng: 1, hp: 1, sig: 'jhk' }, mudure: { spd: 1.04, pow: .98, rng: 1.03, hp: 1, sig: 'jju' }, kaptan: { spd: .96, pow: 1.06, rng: 1, hp: 1.05, sig: 'hhu' },
  bahcivan: { spd: .94, pow: 1.06, rng: 1.06, hp: 1.06, sig: 'hhk' }, sofor: { spd: .9, pow: 1.12, rng: 1, hp: 1.12, sig: 'huk' }, avukat: { spd: 1.02, pow: .96, rng: 1.04, hp: .98, sig: 'jjj' },
  itfaiyeci: { spd: .97, pow: 1.08, rng: 1.04, hp: 1.06, sig: 'juk' }, asci: { spd: .95, pow: 1.06, rng: .98, hp: 1.06, sig: 'hhh' }, haritaci: { spd: 1.02, pow: .98, rng: 1.06, hp: .98, sig: 'jhh' },
  jaloncu: { spd: 1, pow: .94, rng: 1.12, hp: 1, sig: 'jhl' }, kavurmaci: { spd: .92, pow: 1.12, rng: .96, hp: 1.1, sig: 'huu' }, sprinkci: { spd: 1.04, pow: .98, rng: 1.05, hp: 1, sig: 'jjl' },
  imzaci: { spd: 1.03, pow: 1, rng: 1, hp: 1, sig: 'jku' }, trol: { spd: 1.1, pow: .92, rng: 1.02, hp: .96, sig: 'jlk' }, mezarci: { spd: .9, pow: 1.14, rng: 1.02, hp: 1.12, sig: 'hku' },
  /* sc: özel vuruşların dayanıklılık bedeli çarpanı, sn: özel vuruşların bu karaktere özel adları */
  tasarimci: { spd: 1.08, pow: .94, rng: 1.06, hp: .95, sig: 'jlu', sc: .65, sn: { pf: 'POLİGON KÜPÜ', dp: 'YÜKSELEN EKSEN', tk: 'DÖNEN MODEL' } }
};
/* süper hareketler: her karakterin kendi finali. kind: dmg ağır, reach uzun menzil, stun uzun sersemletme, drain can çalar, break dayanıklılığı sıfırlar */
var SUPERS = KF.SUPERS = {
  muhendis: { n: 'PROJE ONAYI', s: 'PROJE', kind: 'dmg', dmg: 26, d: 'Mühür basıldı: çok sert vurur.' }, zabita: { n: 'PARA CEZASI', s: 'CEZA', kind: 'break', dmg: 18, d: 'Hasar verir, rakibin dayanıklılığını bitirir.' },
  cayci: { n: 'DEMLİ TEPSİ', s: 'TEPSİ', kind: 'stun', dmg: 16, stun: 1.35, d: 'Rakibi uzun süre sersemletir.' }, pazarci: { n: 'KİLO HİLESİ', s: 'KİLO', kind: 'dmg', dmg: 26, d: 'Kantar ağırlığıyla çok sert vurur.' },
  mudure: { n: 'MESAİ FATURASI', s: 'FATURA', kind: 'drain', dmg: 18, d: 'Vurur ve rakibin canından can çalar.' }, kaptan: { n: 'DEMİR ATMA', s: 'DEMİR', kind: 'dmg', dmg: 28, reach: 150, d: 'Çok ağır, ama kısa menzilli.' },
  bahcivan: { n: 'BUDAMA', s: 'BUDA', kind: 'reach', dmg: 20, reach: 215, d: 'Çok uzaktan yakalar.' }, sofor: { n: 'FREN BALATA', s: 'FREN', kind: 'dmg', dmg: 30, reach: 140, d: 'Kırk ton yumruk: en sert süper.' },
  avukat: { n: 'İTİRAZ', s: 'İTİRAZ', kind: 'stun', dmg: 16, stun: 1.4, d: 'Rakibi itirazla sersemletir.' }, itfaiyeci: { n: 'BALTA DARBESİ', s: 'BALTA', kind: 'dmg', dmg: 28, d: 'Kapıyı kırar, savunmayı da.' },
  asci: { n: 'TAVA ÇARPMASI', s: 'TAVA', kind: 'dmg', dmg: 26, d: 'Tavayla çok sert vurur.' }, haritaci: { n: 'LAZER ÖLÇÜM', s: 'LAZER', kind: 'reach', dmg: 20, reach: 215, d: 'Çok uzaktan ölçer, vurur.' },
  jaloncu: { n: 'JALON ÇİZGİSİ', s: 'JALON', kind: 'reach', dmg: 20, reach: 220, d: 'En uzun menzilli süper.' }, kavurmaci: { n: 'SATIR İNİŞİ', s: 'SATIR', kind: 'dmg', dmg: 30, reach: 150, d: 'Çok sert ama kısa menzil.' },
  sprinkci: { n: 'HORTUM SELİ', s: 'SU', kind: 'stun', dmg: 16, stun: 1.35, d: 'Rakibi sırılsıklam, uzun sersem bırakır.' }, imzaci: { n: 'DİLEKÇE', s: 'DİLEKÇE', kind: 'base', dmg: 22, d: 'Savunma tanımayan klasik dilekçe.' },
  trol: { n: 'KANDIRMA', s: 'TROL', kind: 'drain', dmg: 18, d: 'Vurur ve canından can çalar. Şaka yaptım!' }, mezarci: { n: 'KÜREK İNİŞİ', s: 'KÜREK', kind: 'dmg', dmg: 30, reach: 150, d: 'Hep son sözü o söyler: çok ağır vurur.' },
  tasarimci: { n: 'RENDER PATLAMASI', s: 'RENDER', kind: 'stun', dmg: 18, reach: 215, stun: 1.25, d: 'Hologramı uzaktan patlatır: hem uzun menzilli hem de rakibi uzun sersemletir.' }
};
var KB = { j: 6, h: 10, u: 16, k: 18, l: 8, a: 10, dp: 30, tk: 20, s: 34, pf: 8 }, RANK = { j: 1, h: 2, l: 2, u: 3, k: 3 };
/* ANATOMİ: menzil artık çizimdeki uzuv ölçüsünden gelir.
   TIP: vuruş anında yumruğun/ayağın ucu, dövüşçünün merkezinden ne kadar öne uzanır (fighters.js pozlarıyla ölçüldü).
   ZONE: vuruşun geldiği yükseklik (h kafa, b gövde, l bacak). SURF: rakibin o yükseklikte öne bakan yüzeyi merkezinden ne kadar önde.
   İsabet = uç, rakibin yüzeyine değiyorsa. HIGH: kafa hizasından gelen, eğilenin üstünden geçen vuruşlar. */
var TIP = { j: 84, h: 79, u: 71, k: 90, l: 80, a: 86, dp: 74, tk: 92 }, ZONE = KF.ZONE = { j: 'h', h: 'h', u: 'h', k: 'b', l: 'l', a: 'h', dp: 'h', tk: 'b', s: 'b', pf: 'b' }, SURF = KF.SURF = { h: 15, b: 11, l: 24 }, HIGH = { j: 1, h: 1 };
var REACH = KF.REACH = { s: 170 };
Object.keys(TIP).forEach(function (k) { REACH[k] = TIP[k] + SURF[ZONE[k]]; });
var WALL = [64, 336], MINGAP = 66;
function MA(k) { return MV[k] || SM[k]; }
var DIF = KF.DIF = {
  easy: { rd: .9, tell: 1.2, gap: 1.1, perf: .28, drain: 30, react: .8, pw: .9, dg: .5, dgw: .6, rt: [.16, .38] },
  normal: { rd: 1, tell: 1.1, gap: 1, perf: .22, drain: 36, react: 1, pw: 1, dg: 1, dgw: .44, rt: [.1, .3] },
  hard: { rd: 1.3, tell: .85, gap: .8, perf: .16, drain: 42, react: 1.25, pw: 1, dg: 1.2, dgw: .36, rt: [.07, .2] },
  pvp: { rd: 1, tell: 1, gap: 1, perf: .22, drain: 36, react: 1, pw: 1, dg: 1, dgw: .4, rt: [.1, .3] }
};
KF.VENUES = ['OTOPARK', 'KÖPRÜ ALTI', 'ORMAN', 'ÇAY BAHÇESİ', 'PAZAR YERİ', 'İSKELE', 'ÇATI', 'ŞANTİYE', 'METRO PERONU', 'HAYVANAT BAHÇESİ', 'TASARIM STÜDYOSU'];

/* ---------- dövüş kuralları ---------- */
function FS(hp) { return { hp: hp, max: hp, sp: 0, st: 'idle', t: 0, stam: 100, block: false, hold: false, blockT: 0, cd: 0, combo: 0, comboT: 0, mv: '', rt: .3, buf: null, x: 0, y: 0, vy: 0, air: false, aa: false, jv: 0, md: 0, dh: [], inv: false, vx: 0, dsh: 0, bi: 0, lastF: -9, lastB: -9, relF: true, relB: true, chainT: 0, lr: 0, seq: '', cr: 0 }; }
function isInv(f) { return f.inv || f.bi > 0 || f.st === 'kd' || f.st === 'gu'; }
function Sim(o) {
  this.o = o; this.dif = DIF[o.dif || (o.cpu ? 'normal' : 'pvp')]; this.as = o.cpu ? Math.max(0, Math.min(3, o.assist || 0)) : 0;
  this.lk = o.looks || ['', '']; this.ab = o.rule === 'noblock' ? false : (o.cpu ? !!o.ab : true);
  this.mkF(o.hp); this.pj = []; this.pid = 0;
  this.ev = []; this.eid = 0; this.time = o.time || 60; this.lock = o.train ? 1 : 2.4; this.lc = 4; this.ph = 'count'; this.endT = 0;
  this.cpu = o.cpu ? { t: 1.8, reacting: false, bt: 999, hold: 0, pm: null, walk: false, pr: false } : null;
  this.sc = [0, 0]; this.round = 1; this.bg = o.bg || 0; this.mw = -1; this.rw = -1;
}
/* insan oyuncular karakter istatistiklerini alır; bilgisayar rakipler kendi ayarlarını kullanır */
Sim.prototype.st = function (i) { return (this.o.cpu && i === 1) ? null : STATS[this.lk[i]] || null; };
Sim.prototype.mkF = function (hp1) {
  var s0 = this.st(0), s1 = this.st(1);
  this.f = [FS(Math.round(100 * (s0 ? s0.hp : 1))), FS(Math.round((hp1 || 100) * (s1 ? s1.hp : 1)))]; this.f[0].x = 148; this.f[1].x = 252;
};
Sim.prototype.sup = function (i) { return SUPERS[this.lk[i]] || SUPERS.imzaci; };
Sim.prototype.autoB = function (f) { return this.ab && f.md < 0 && !f.air && f.st === 'idle' && !f.block && f.stam > 5 && f.dsh <= 0; };
Sim.prototype.dash = function (i, dir) {
  var f = this.f[i], s = this.st(i), sg = i ? -1 : 1; if (f.stam < 14 || f.air) return false;
  f.stam -= 14; f.dsh = dir > 0 ? .2 : .22; f.vx = sg * dir * (dir > 0 ? 330 : 290) * (s ? s.spd : 1); if (dir < 0) f.bi = .14; this.emit('dash', i, dir, ''); return true;
};
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
  var ru = this.o.rule;
  if (ru && i === 0) {
    if (ru === 'kick' && (k === 'j' || k === 'h' || k === 'u' || k === 'xj' || k === 'xu')) return;
    if (ru === 'nojump' && k === 'jp') return;
    if (ru === 'noblock' && (k === 'bd' || k === 'bu')) return;
  }
  var mv = MV[k], sgn = i === 0 ? 1 : -1, now0 = this.clock || 0, sk = null;
  if (k === 'mf' || k === 'mb') {
    var dr = k === 'mf' ? 1 : -1, lt = dr > 0 ? f.lastF : f.lastB, rl = dr > 0 ? f.relF : f.relB;
    if (rl && now0 - lt < .26 && !f.air && f.st === 'idle' && f.cd <= 0 && !f.block && !f.hold) this.dash(i, dr);
    if (dr > 0) { f.lastF = now0; f.relF = false; } else { f.lastB = now0; f.relB = false; }
    f.md = dr; f.dh.push({ d: dr > 0 ? 'f' : 'b', t: now0 }); if (f.dh.length > 8) f.dh.shift(); return;
  }
  if (k === 'mfu') { f.relF = true; if (f.md > 0) f.md = 0; return; }
  if (k === 'mbu') { f.relB = true; if (f.md < 0) f.md = 0; return; }
  if (k === 'dn') { f.cr = 1; f.dh.push({ d: 'd', t: now0 }); if (f.dh.length > 8) f.dh.shift(); return; }
  if (k === 'dnu') { f.cr = 0; return; }
  if (k === 'jp') {
    if (f.air || f.st !== 'idle' || f.cd > 0 || f.stam < 14) return;
    f.stam -= 12; f.air = true; f.aa = false; f.vy = 380; f.vx = 0; f.dsh = 0; f.jv = f.md * sgn * 92 * (this.st(i) ? this.st(i).spd : 1); this.emit('jump', i, 0, ''); return;
  }
  var forced = k === 'xj' || k === 'xu' || k === 'xk', k0 = k;
  if (forced) { sk = { xj: 'pf', xu: 'dp', xk: 'tk' }[k]; k = k.charAt(1); mv = MV[k]; }
  else if ((k === 'j' || k === 'u' || k === 'k') && !f.air) sk = this.motion(f, k);
  if (sk && f.air) sk = null;
  if (sk) {
    if (f.st === 'rec' || RX.test(f.st)) { f.buf = { k: k0, t: .3 }; return; }
    if (f.st === 'block' || (f.block && f.st === 'idle')) { f.block = false; f.st = 'idle'; }
    var S0 = SM[sk], sc0 = S0.c * ((this.st(i) && this.st(i).sc) || 1);
    if (f.stam >= sc0) {
      if (f.st !== 'idle' || f.cd > 0) return;
      f.dh.length = 0; f.stam -= sc0; f.mv = sk; f.st = S0.st === 'sp' ? 'sp' : 'w' + S0.st; f.t = S0.w * ((this.cpu && i === 1) ? this.dif.tell * (1 + .1 * this.as) : this.dif.pw * .76); f.rt = S0.rec; f.cd = .06; if (sk === 'dp') f.inv = true; this.emit('swing', i, 0, sk); return;
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
    if (f.st === 'idle' && f.cd > 0) { f.buf = { k: k, t: .3 }; return; }
    if (f.st !== 'idle') return;
    var cw = (f.chainT > 0 && !(this.cpu && i === 1) && (RANK[k] || 0) >= f.lr) ? .55 : 1;
    if (k === 's') { if (f.sp < 100) return; f.sp = 0; f.mv = 's'; f.st = 'sp'; f.t = .4; f.rt = .5; this.emit('swing', i, 0, 's'); }
    else { f.mv = k; f.st = 'w' + k; f.t = mv.w * cw * ((this.cpu && i === 1) ? this.dif.tell * (1 + .1 * this.as) : this.dif.pw * .76); f.rt = mv.rec; f.cd = .06; this.emit('swing', i, 0, k); }
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
  if (c.crT > 0) { c.crT -= dt; if (c.crT <= 0) this.input(1, 'dnu'); }
  var opAtk = RW.test(op.st);
  if (opAtk) { if (!c.reacting) { c.reacting = true; c.bt = Math.random() < Math.min(.95, L.react * d.react * (1 - .18 * this.as)) ? rr(d.rt[0], d.rt[1]) * (1 + .12 * this.as) : 999; } } else c.reacting = false;
  if (c.reacting && c.bt < 999) {
    c.bt -= dt;
    if (c.bt <= 0) { c.bt = 999; if (HIGH[op.mv] && !me.air && Math.random() < .2 * d.dg * (1 - .25 * this.as)) { this.input(1, 'dn'); c.crT = .42; } else if (op.mv !== 'l' && me.stam >= 30 && Math.random() < (L.dodge || 0) * d.dg * (1 - .25 * this.as)) { this.input(1, 'dg'); c.hold = 0; } else { this.input(1, 'bd'); c.hold = .5; } }
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
    if (op.st === 'kd' || op.st === 'gu') { c.t = .12; return; }
    if (!c.pm && dist > 215 && me.stam > 45 && Math.random() < .03) { this.dash(1, 1); c.t = .4; return; }
    if (!c.pm) {
      if (op.air && dist < REACH.dp + 14 && me.stam >= 32 && Math.random() < .5 * as) { this.input(1, 'xu'); c.t = rr(.5, .9); return; }
      if (dist > 165 && me.stam >= 25 && Math.random() < (.12 + (L.dodge || 0) * .7) * as) { this.input(1, 'xj'); c.t = rr(1, 1.7); return; }
      if (dist > REACH.k + 3 && dist < REACH.tk + 42 && me.stam >= 30 && (L.mix.k || 0) >= .1 && Math.random() < .3 * as) { this.input(1, 'xk'); c.t = rr(.8, 1.4); return; }
      c.pm = me.sp >= 100 && Math.random() < .7 ? 's' : null;
    }
    var vuln = op.st === 'rec' || op.st === 'hit' || op.st === 'stun' || RX.test(op.st);
    if (!c.pm) c.pm = pick(L.mix, vuln, op.block, op.st === 'dg' || c.dodged > 0);
    if (op.cr && HIGH[c.pm]) c.pm = Math.random() < .5 ? 'k' : (Math.random() < .5 ? 'l' : 'u');
    if (dist > (c.pm === 's' ? this.sup(1).reach || 170 : REACH[c.pm]) - 4) { if (!c.walk) { this.input(1, 'mf'); c.walk = true; } c.t = .05; return; }
    if (c.walk) { this.input(1, 'mfu'); c.walk = false; }
    this.input(1, c.pm); c.pm = null;
    c.dodged = Math.max(0, (c.dodged || 0) - 1); c.t = (Math.random() < L.dbl * (1 - .3 * this.as) ? .15 : rr(L.gap[0], L.gap[1])) * d.gap * (1 + .16 * this.as) * (1 + .45 * this.mercy());
  }
};
Sim.prototype.resolve = function (land) {
  var F = this.f, self = this, snap = F.map(function (f) { return { block: f.block || self.autoB(f), bt: f.block ? f.blockT : 99, dg: f.st === 'dg', air: f.y > 22, inv: isInv(f), kd: f.st === 'kd' || f.st === 'gu', cr: !!f.cr && f.st === 'idle' && f.y <= 0 }; }), out = [], dist = Math.abs(F[1].x - F[0].x);
  land = land.filter(function (a) {
    var A = F[a];
    if (A.mv === 'pf') { self.pj.push({ id: ++self.pid, o: a, x: A.x + (a ? -30 : 30), v: (a ? -1 : 1) * 215 }); A.st = 'spstrike'; A.t = .16; A.cd = .08; self.emit('fire', a, 0, 'pf'); return false; }
    if (A.mv === 'tk') { var room = Math.max(0, dist - MINGAP - 4); A.x += (a ? -1 : 1) * Math.min(46, room); dist = Math.abs(F[1].x - F[0].x); }
    return true;
  });
  land.forEach(function (a) {
    var A = F[a], d = 1 - a, S = snap[d], sp = A.st === 'sp', m = MA(A.mv) || MV.j, sa = self.st(a), su = sp ? self.sup(a) : null;
    var mult = self.mult(a) * (sa ? sa.pow : 1);
    var dmg = Math.max(1, Math.round((sp ? su.dmg : m.d + Math.min(A.combo, 4)) * mult));
    var mk = sp ? 's' : A.mv; if (S.dg && mk === 'l') dmg = Math.round(dmg * 1.4);
    var rg = ((sp && su.reach) || REACH[mk] || 120) * (sa ? sa.rng : 1);
    var far = dist > rg, airMiss = S.air && !(mk === 'u' || mk === 'dp' || mk === 'a' || mk === 's');
    var duck = S.cr && HIGH[mk] && !far;
    out.push({ a: a, d: d, dmg: dmg, mv: mk, air: S.air, duck: duck, res: far || S.kd || duck ? 'whiff' : (S.inv && mk !== 's' ? 'dodge' : ((S.dg && mk !== 'l') || airMiss ? 'dodge' : (sp ? 'spec' : (S.block ? (S.bt <= self.dif.perf ? 'perfect' : 'block') : 'hit')))) });
  });
  out.forEach(function (o) {
    var A = F[o.a], D = F[o.d], m = MA(o.mv) || { sd: 0, hs: .9 }, wasWind = RW.test(D.st), simult = out.some(function (q) { return q.a === o.d && q.res !== 'whiff'; });
    A.st = o.mv === 's' ? 'spstrike' : 'x' + (SM[o.mv] ? SM[o.mv].st : o.mv); A.t = .14; A.cd = .08;
    var dir = o.d === 1 ? 1 : -1;
    if (o.res !== 'hit' && o.res !== 'spec') { A.chainT = 0; A.seq = ''; }
    if (o.res === 'whiff') { A.rt = (m.rec || .4) + .16; A.combo = 0; self.emit('whiff', o.a, o.duck ? 1 : 0, o.mv); }
    else if (o.res === 'dodge') { if (self.cpu && o.a === 1) self.cpu.dodged = 3; A.rt = (m.rec || .5) + .32; A.combo = 0; D.sp = Math.min(100, D.sp + 12); D.stam = Math.min(100, D.stam + 8); self.emit('dodge', o.d, o.air ? 1 : 0, o.mv); }
    else if (o.res === 'perfect') { A.st = 'stun'; A.t = 1.0; A.combo = 0; D.sp = Math.min(100, D.sp + 18); self.emit('perfect', o.d, 0, o.mv); }
    else if (o.res === 'block') {
      var dm = Math.max(1, Math.round(o.dmg * (m.pierce || .2))); D.hp -= dm; D.sp = Math.min(100, D.sp + 8); D.stam = Math.max(0, D.stam - m.sd); A.combo = 0; D.vx = dir * Math.sqrt(1800 * (KB[o.mv] || 8) * .4);
      if (!m.pierce) { A.st = 'stun'; A.t = .3; }
      self.emit('block', o.d, dm, o.mv);
    } else {
      D.hp -= o.dmg; D.block = false; D.combo = 0; D.comboT = 0; D.sp = Math.min(100, D.sp + 5); D.buf = null;
      var armor = (D.st === 'sp' || D.st === 'wu' || D.st === 'wk') && o.mv === 'j' && !D.inv, su = o.mv === 's' ? self.sup(o.a) : null, sa = self.st(o.a);
      A.combo++; A.comboT = 1.3; A.chainT = .45; if (RANK[o.mv]) { A.lr = RANK[o.mv]; A.seq = (A.seq + o.mv).slice(-3); }
      var sig = !!(sa && A.seq === sa.sig); if (sig) { D.hp -= 6; A.seq = ''; self.emit('sig', o.a, 6, ''); }
      if (su && su.kind === 'drain') A.hp = Math.min(A.max, A.hp + 9); if (su && su.kind === 'break') D.stam = 0;
      var kdHit = D.hp > 0 && (o.mv === 'dp' || o.mv === 'tk' || A.combo >= 4 || sig || (su && su.kind !== 'stun'));
      if (kdHit) { D.st = 'kd'; D.t = .6; D.vx = dir * Math.sqrt(1800 * 40); self.emit('kd', o.d, 0, o.mv); }
      else {
        if (o.res === 'spec') { D.st = 'stun'; D.t = (su && su.stun) || .9; } else if (!simult && !armor) { D.st = 'hit'; D.t = m.hs + (A.combo >= 2 ? .1 : 0); }
        if (!armor) D.vx = dir * Math.sqrt(1800 * (KB[o.mv] || 8));
      }
      if (o.res === 'hit') A.sp = Math.min(100, A.sp + 9);
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
  this.mkF(this.o.hp); this.pj = []; if (this.cpu) this.cpu = { t: 1.8, reacting: false, bt: 999, hold: 0, pm: null, walk: false, pr: false };
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
    if (f.comboT > 0) { f.comboT -= dt; if (f.comboT <= 0) { f.combo = 0; f.seq = ''; } }
    if (f.chainT > 0) f.chainT -= dt;
    if (f.block) { f.blockT += dt; f.stam -= this.dif.drain * dt; }
    if (f.block && f.stam <= 0) { f.stam = 0; f.block = false; f.hold = false; f.st = 'stun'; f.t = .6; this.emit('break', i); }
    else if (!f.block) f.stam = Math.min(100, f.stam + 25 * dt);
    if (RW.test(f.st)) { f.t -= dt; if (f.t <= 0) land.push(i); }
    else if (RX.test(f.st)) { f.t -= dt; if (f.t <= 0) { f.st = 'rec'; f.t = f.rt || .26; } }
    else if (f.st === 'dg') { f.t -= dt; if (f.t <= 0) { f.st = 'rec'; f.t = f.rt || .24; } }
    else if (f.st === 'kd') { f.t -= dt; if (f.t <= 0) { f.st = 'gu'; f.t = .28; } }
    else if (f.st === 'gu') { f.t -= dt; if (f.t <= 0) f.st = 'idle'; }
    else if (f.st === 'rec' || f.st === 'hit' || f.st === 'stun') { f.t -= dt; if (f.t <= 0) f.st = 'idle'; }
    if (f.buf && f.st === 'rec' && f.chainT > 0 && !(this.cpu && i === 1) && (RANK[f.buf.k] || 0) >= f.lr) { f.st = 'idle'; f.cd = 0; }
    if (f.buf) { f.buf.t -= dt; if (f.buf.t <= 0) f.buf = null; else if (f.st === 'idle' && f.cd <= 0) { var b = f.buf.k; f.buf = null; this.input(i, b); } }
    if (f.hold && !f.block && f.st === 'idle' && f.stam > 12) { f.block = true; f.blockT = 0; f.st = 'block'; }
    /* hareket: yürüme, zıplama, sınırlar */
    var sg = i ? -1 : 1, sps = (this.st(i) || { spd: 1 }).spd, can = f.st === 'idle' && !f.block && !f.hold && f.cd <= 0;
    if (f.inv && !(f.mv === 'dp' && (f.st === 'wu' || f.st === 'xu'))) f.inv = false;
    if (f.bi > 0) f.bi -= dt;
    if (f.st !== 'idle' && f.dsh > 0) f.dsh = 0;
    if (f.air) {
      f.y += f.vy * dt; f.vy -= 1150 * dt;
      if (f.md) { var lim = 100 * sps; f.jv = Math.max(-lim, Math.min(lim, f.jv + f.md * sg * 260 * dt)); }
      f.x += f.jv * dt;
      if (f.y <= 0) { var hard = f.vy < -330; f.y = 0; f.vy = 0; f.air = false; f.aa = false; f.jv = 0; f.vx = 0; f.cd = Math.max(f.cd, .09); if (hard) this.emit('land', i, 0, ''); }
    } else {
      if (f.dsh > 0) { f.dsh -= dt; if (f.dsh <= 0) f.vx *= .25; }
      else { var kk, tv = (can && f.md && !f.cr) ? sg * f.md * (f.md > 0 ? 90 : 74) * sps : 0, kk = (tv && Math.abs(f.vx) < 40) ? (f.vx = tv * .55) : 0, dv = tv - f.vx, stp = (tv ? 2100 : 1700) * dt; f.vx += Math.abs(dv) <= stp ? dv : (dv > 0 ? stp : -stp); }
      f.x += f.vx * dt;
    }
    if (f.x < WALL[0] || f.x > WALL[1]) {
      var lw = f.x < WALL[0]; f.x = lw ? WALL[0] : WALL[1];
      if (f.st !== 'idle' && Math.abs(f.vx) > 60 && (lw ? f.vx < 0 : f.vx > 0)) { var o2 = F[1 - i]; o2.vx = lw ? Math.max(o2.vx, -f.vx * .5) : Math.min(o2.vx, -f.vx * .5); this.emit('wall', i, 0, ''); }
      if (lw ? f.vx < 0 : f.vx > 0) f.vx = 0;
    }
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
    if (D.y > 30 || isInv(D) || D.st === 'dg' || D.st === 'ko') return true;
    if (D.block || self.autoB(D)) { var bd = Math.max(1, Math.round(2 * self.mult(p.o))); D.hp -= bd; D.stam = Math.max(0, D.stam - 10); D.sp = Math.min(100, D.sp + 5); self.emit('block', 1 - p.o, bd, 'pf'); return false; }
    var dm = Math.max(1, Math.round(SM.pf.d * self.mult(p.o)));
    D.hp -= dm; D.st = 'hit'; D.t = SM.pf.hs; D.block = false; D.buf = null; D.combo = 0; D.sp = Math.min(100, D.sp + 5); A.sp = Math.min(100, A.sp + 6);
    self.emit('hit', 1 - p.o, dm, 'pf'); return false;
  });
};
Sim.prototype.snap = function () {
  var now = Date.now(), F = this.f;
  return { t: 's', ph: this.ph, tm: Math.max(0, Math.ceil(this.time)), sc: this.sc, rn: this.round, bg: this.bg, mw: this.mw, rw: this.rw,
    f: F.map(function (f) { return [Math.max(0, Math.round(f.hp)), Math.round(f.sp), f.st, Math.round(f.stam), f.combo, f.block ? 1 : 0, Math.round(f.max), Math.round(f.x), Math.round(f.y), f.cr && f.st === 'idle' ? 1 : 0]; }),
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
  tasarimci: opp('tasarimci', 'TASARIMCI TUĞÇE', '🧊', 10, 92, 1, { j: .3, h: .2, u: .15, k: .2, l: .15 }, [.95, 1.65], .42, .2, .45, 'Rakibini önce modeller, sonra render alır. Topuklu ayakkabıyla tekmesi poligon gibi keskin.'),
  asci: opp('asci', 'AŞÇI ARİF', '🍳', 4, 105, 1.05, { j: .25, h: .25, u: .25, k: .15, l: .1 }, [1, 1.6], .45, .2, .3, 'Hamur gibi yoğurur, tava gibi çalar.')
};
KF.LADDER = ['zabita', 'cayci', 'sprinkci', 'pazarci', 'haritaci', 'trol', 'jaloncu', 'mudure', 'tasarimci', 'imzaci', 'kaptan', 'bahcivan', 'kavurmaci', 'mezarci', 'sofor'];
KF.DUMMY = { k: 'zabita', look: 'zabita', name: 'ÇIRAK CEMİL', av: '🥋', bg: 0, hp: 999, dm: .25, mix: { h: 1 }, gap: [2.6, 3.4], react: 0, dbl: 0, dodge: 0, desc: 'Antrenman partneri. Vurmaz, sadece öğretir.' };

/* ---------- denetleyici ---------- */
var G = KF.G = { mode: 'menu', sim: null, room: null, net: null, me: 0, M: null, parts: [], pops: [], shake: 0, freeze: 0, tm: 0, seen: 0, hook: {}, names: ['', ''], avs: ['', ''], lastPh: '', over: false, paused: false };
var V = G.V = { a: GFX.mkF(148, GFX.LOOKS.muhendis), b: GFX.mkF(252, GFX.LOOKS.zabita), bg: 0, flip: false, parts: G.parts, pops: G.pops, shake: 0, tm: 0, warn: true };
function setLooks(l0, l1, my) {
  G.sl = [l0, l1];
  var A = GFX.LOOKS[l0] || GFX.LOOKS.muhendis, B = GFX.LOOKS[l1] || GFX.LOOKS.zabita;
  if (KF.S.skin && my === 0) A = GFX.skinned(A, KF.S.skin); else if (KF.S.skin && my === 1) B = GFX.skinned(B, KF.S.skin);
  if (A === B) { var c = {}, k; for (k in B) c[k] = B[k]; c.shirt = B.pants; c.pants = B.shirt; if (B.vest) c.vest = B.pants; c.hatc = B.glove; c.glove = B.shirt; B = c; }
  V.a = GFX.mkF(148, A); V.b = GFX.mkF(252, B); V.pj = [];
}
G.setLooks = setLooks;
function reset() { G.st = { hit: 0, blk: 0, prf: 0, dg: 0, cmb: 0, dd: 0, dt: 0, sup: 0, kd: 0, sig: 0, dsh: 0 }; G.seen = 0; G.parts.length = 0; G.pops.length = 0; G.over = false; G.lastPh = ''; G.M = null; G.freeze = 0; }
G.stop = function () {
  if (G.room) { try { G.room.close(); } catch (e) {} G.room = null; }
  if (G.guest) { try { G.guest.leave(); G.guest.close(); } catch (e) {} G.guest = null; }
  G.sim = null; G.mode = 'menu'; V.flip = false; V.bg = 0; G.paused = false; reset();
};
var CHAT = KF.CHAT = ['İyi maçtı!', 'Tekrar?', 'Harika vuruş!', 'Hazır mısın?', 'Bir dakika, çay geldi', 'Şans dilerim'];
G.chatIn = function (i, seat) { var s = Math.max(0, Math.min(CHAT.length - 1, +i || 0)); pop(fx(seat).x, 78, CHAT[s], seat === G.me ? '#ffd23f' : '#9ad0ff'); };
G.chatOut = function (i) {
  if (G.mode === 'host' && G.room) { G.room.send({ t: 'msg', i: i }); G.chatIn(i, 0); }
  else if (G.mode === 'guest' && G.guest) { G.guest.send({ t: 'msg', i: i }, 1); G.chatIn(i, 1); }
};
function ensureNet() { if (!G.net) G.net = new KF.Net(); return G.net; }
G.getNet = ensureNet;

/* cfg: {hp, sp, dif, train, lv} */
G.solo = function (o, bg, cfg) {
  G.stop(); cfg = cfg || {};
  G.mode = 'solo'; G.opp = o; G.lv = cfg.lv == null ? -1 : cfg.lv; G.me = 0; G.train = !!cfg.train; reset();
  var sim = G.sim = new Sim({ cpu: o, looks: [cfg.look || KF.S.look, o.look], rule: cfg.rule, speed: cfg.rule === 'fast' ? 1.35 : 1, ab: KF.S.ab !== false, hp: o.hp, dm: o.dm, time: cfg.rule === 'short' ? 30 : 75, bg: bg, solo: true, dif: cfg.dif || KF.S.dif || 'easy', train: !!cfg.train, assist: cfg.train ? 0 : (cfg.assist != null ? cfg.assist : (KF.S.assist || 0)) });
  if (cfg.hp != null) sim.f[0].hp = Math.min(sim.f[0].max, cfg.hp); if (cfg.sp) sim.f[0].sp = cfg.sp;
  var ml = cfg.look || KF.S.look; setLooks(ml, o.look, 0); V.bg = bg; G.names = [cfg.look ? (GFX.LOOKS[ml] || {}).name : (KF.S.name || (GFX.LOOKS[ml] || {}).name || 'Mühendis'), o.name]; G.avs = [KF.S.av, o.av || '🥊'];
  if (cfg.ohp != null) sim.f[1].hp = cfg.ohp;
  if (cfg.rule === 'lowhp') { sim.f[0].hp = sim.f[0].max = 50; }
};
G.host = function (pub) {
  G.stop(); var net = ensureNet();
  return net.start().catch(function (e) { if (!KF.hasP2P()) throw e; }).then(function () {
    var h = new KF.Host(net, pub); G.room = h; G.mode = 'lobbyH';
    h.onInput = function (k) { if (G.sim) G.sim.input(1, k); };
    h.onChat = function (i) { G.chatIn(i, 1); };
    h.onReady = function () { if (G.hook.ready) G.hook.ready(); };
    return h;
  });
};
G.hostBegin = function () {
  var h = G.room; if (!h || !h.guest) return false;
  reset(); G.mode = 'host'; G.me = 0; G.sim = new Sim({ time: 60, bg: 0, looks: [KF.S.look, h.guest.l] }); h.setStatus('play');
  setLooks(KF.S.look, h.guest.l, 0); V.bg = 0; G.names = [KF.S.name || 'Oyuncu', h.guest.n]; G.avs = [KF.S.av, h.guest.a];
  return true;
};
G.rematch = function () { if (G.mode === 'host' && G.room && G.room.guest) { reset(); G.sim = new Sim({ time: 60, bg: 0, looks: [KF.S.look, G.room.guest.l] }); V.bg = 0; return true; } return false; };
G.join = function (code) {
  G.stop(); var net = ensureNet();
  return net.start().catch(function (e) { if (!KF.hasP2P()) throw e; }).then(function () {
    var g = new KF.Guest(net, code); G.guest = g; G.mode = 'lobbyG';
    g.onMsg = function (m) { if (m.t === 's') applySnap(m); else if (m.t === 'msg') G.chatIn(m.i, 0); };
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
    var h = g.info && g.info.h || {}; setLooks(h.l || 'muhendis', KF.S.look, 1); G.names = [h.n || 'Rakip', KF.S.name || 'Oyuncu']; G.avs = [h.a || '🥊', KF.S.av];
    if (G.hook.guestStart) G.hook.guestStart();
  }
  G.rt = m.rt || 0;
  G.M = { cr: [m.f[0][9] || 0, m.f[1][9] || 0], ph: m.ph, tm: m.tm, sc: m.sc, rn: m.rn, bg: m.bg, mw: m.mw, rw: m.rw, hp: [m.f[0][0], m.f[1][0]], sp: [m.f[0][1], m.f[1][1]], st: [m.f[0][2], m.f[1][2]], stam: [m.f[0][3], m.f[1][3]], combo: [m.f[0][4], m.f[1][4]], max: [m.f[0][6], m.f[1][6]], x: [m.f[0][7], m.f[1][7]], y: [m.f[0][8], m.f[1][8]], pj: m.pj || [] };
  m.ev.forEach(function (a) { if (a[0] > G.seen) { G.seen = a[0]; handleEv({ k: a[1], s: a[2], v: a[3], m: a[4] || '' }); } });
  g.lastHost = Date.now();
}
function modelFromSim(s) {
  var F = s.f; return { cr: [F[0].cr && F[0].st === 'idle' ? 1 : 0, F[1].cr && F[1].st === 'idle' ? 1 : 0], ph: s.ph, tm: Math.max(0, Math.ceil(s.time)), sc: s.sc, rn: s.round, bg: s.bg, mw: s.mw, rw: s.rw, hp: [F[0].hp, F[1].hp], sp: [F[0].sp, F[1].sp], st: [F[0].st, F[1].st], stam: [F[0].stam, F[1].stam], combo: [F[0].combo, F[1].combo], max: [F[0].max, F[1].max], x: [F[0].x, F[1].x], y: [F[0].y, F[1].y], pj: s.pj.map(function (p) { return [p.id, p.x, p.o]; }) };
}

/* ---------- olaylar -> görsel ve ses ---------- */
function fx(seat) { return seat === 0 ? V.a : V.b; }
function spark(x, y, col, n) { if (G.low) n = Math.ceil(n / 2); for (var i = 0; i < n; i++) G.parts.push({ k: 'spark', x: x, y: y, vx: rr(-190, 190), vy: rr(-190, 40), g: 380, c: col, life: .4, max: .4 }); }
function dust(x, dir, n, sz) { if (G.low) n = Math.ceil(n / 2); for (var i = 0; i < n; i++) G.parts.push({ k: 'dot', x: x + rr(-8, 8), y: 259 + rr(-2, 3), vx: rr(-45, 45) + dir * rr(20, 90), vy: rr(-50, -8), g: 70, c: 'rgba(214,204,182,.55)', r: (sz || 3) * rr(.7, 1.3), life: .38, max: .38 }); }
function pop(x, y, txt, col) { G.pops.push({ x: x, y: y, txt: txt, col: col, t: .9 }); }
var SHK = { j: 2, h: 4, u: 6, k: 6, l: 3, s: 8, dp: 7, tk: 6, a: 3, pf: 3 }, FRZ = { j: .03, h: .05, u: .08, k: .08, l: .05, s: .1, dp: .09, tk: .08, a: .04, pf: .03 };
var FXC = { zabita: '#c9d6ff', cayci: '#c98a3a', pazarci: '#e0455f', bahcivan: '#79c45f', sofor: '#bfc3cc', itfaiyeci: '#6ec6ff', sprinkci: '#6ec6ff', asci: '#ffb347', kavurmaci: '#d0392b', mezarci: '#8a6034', imzaci: '#f7f4ea', jaloncu: '#ff6a4a', trol: '#3ee07a', kaptan: '#cdd6e8', haritaci: '#8fd0ff', tasarimci: '#5ef2ff' };
var FXG = { cayci: 1, pazarci: 1, bahcivan: 1, itfaiyeci: 1, sprinkci: 1, asci: 1, kavurmaci: 1, mezarci: 1, sofor: 1, tasarimci: 1 };
function chunks(x, y, col, n, dir) { if (G.low) n = Math.ceil(n / 2); for (var i = 0; i < n; i++) G.parts.push({ k: 'dot', x: x, y: y, vx: dir * rr(40, 210) + rr(-40, 40), vy: rr(-230, -40), g: 620, c: col, r: rr(1.6, 3.6), life: .55, max: .55 }); }
function count(e) {
  var me = G.me, st = G.st; if (!st) return;
  if (e.k === 'hit' || e.k === 'spec') { if (e.s !== me) { st.hit++; st.dd += e.v; if (e.k === 'spec') st.sup++; } else st.dt += e.v; }
  else if (e.k === 'block') { if (e.s === me) st.blk++; else st.dd += e.v; }
  else if (e.k === 'perfect') { if (e.s === me) st.prf++; }
  else if (e.k === 'dodge') { if (e.s === me) st.dg++; }
  else if (e.k === 'kd') { if (e.s !== me) st.kd++; }
  else if (e.k === 'sig') { if (e.s === me) st.sig++; }
  else if (e.k === 'dash') { if (e.s === me) st.dsh++; }
}
/* temas yüksekliği (tuval y): yumruk kafa hizası, tekme gövde, süpürme bilek */
var HY = { j: 168, h: 160, u: 150, k: 200, l: 247, a: 166, dp: 146, tk: 198, s: 180, pf: 196 };
function handleEv(e) {
  count(e);
  var me = G.me, atk = e.s >= 0 ? G.sl && G.sl[1 - e.s] : '', fxc = FXC[atk] || '#ffd23f', sup = (KF.SUPERS[G.sl && G.sl[e.k === 'swing' ? e.s : 1 - e.s]] || KF.SUPERS.imzaci), mine = e.s === me, f = e.s >= 0 ? fx(e.s) : null, mv = e.m, side = e.s === 0 ? 1 : -1, zn = KF.ZONE[mv] || 'b', sf = KF.SURF[zn], hy = HY[mv] || 170, hs = G.hook;
  if (e.k === 'swing') { KF.sfx(e.m === 'k' || e.m === 'l' || e.m === 'tk' || e.m === 'a' ? 'kick' : 'swing'); if (SM[e.m] && SM[e.m].c && hs.callout) hs.callout(((STATS[G.sl && G.sl[e.s]] || {}).sn || {})[e.m] || SM[e.m].n, mine ? '#ffd23f' : '#ff9a5e'); else if (e.m === 's' && hs.callout) hs.callout(sup.n, mine ? '#ffd23f' : '#ff9a5e'); }
  else if (e.k === 'fire') KF.sfx('spec');
  else if (e.k === 'jump') KF.sfx('jump');
  else if (e.k === 'whiff') pop((e.v ? fx(1 - e.s) : f).x, e.v ? 150 : 112, e.v ? 'EĞİLDİ!' : 'ISKA', e.v ? '#8cc8ff' : '#9a9aa4');
  else if (e.k === 'hit' || e.k === 'spec') {
    var strong = mv === 'u' || mv === 'k' || mv === 's' || mv === 'dp' || mv === 'tk';
    f.flash = .13; f.hz = zn; spark(f.x + side * sf, hy, fxc, strong ? 16 : 9); if (FXG[atk] && strong) chunks(f.x + side * sf, hy, fxc, 7, side); G.parts.push({ k: 'ring', x: f.x + side * sf, y: hy, c: '#fff', life: .3, max: .3 });
    if (zn === 'h' && !G.low) for (var sw = 0; sw < (strong ? 7 : 4); sw++) G.parts.push({ k: 'dot', x: f.x + side * 4, y: hy - 6, vx: -side * rr(40, 190), vy: rr(-170, -30), g: 520, c: 'rgba(200,232,255,.8)', r: rr(1, 2), life: .45, max: .45 });
    if (strong) G.parts.push({ k: 'burst', x: f.x + side * sf, y: hy, c: '#ffe27a', life: .22, max: .22 });
    pop(f.x, 118, '-' + e.v, mine ? '#ff6b5e' : '#ffd23f'); G.shake = SHK[mv] || 4; G.freeze = (FRZ[mv] || .04) * (1 + Math.min(.6, e.v / 40)); KF.sfx(e.k === 'spec' ? 'spec' : (strong ? 'heavy' : 'hit')); if (mine) KF.buzz(strong ? 60 : 35);
    if (e.k === 'spec') { if (atk === 'imzaci' || !FXC[atk]) { for (var i = 0; i < 10; i++) G.parts.push({ k: 'paper', x: f.x + side * 50, y: rr(130, 190), vx: side * rr(120, 220), vy: rr(-60, 20), g: 90, rot: rr(0, 6), life: .6, max: .6 }); } else chunks(f.x + side * 24, 150, fxc, 16, side); if (hs.callout) hs.callout(sup.n + '!', '#d9ab4c'); }
    else if (mv === 'u' && hs.callout && !mine) hs.callout('APARKAT!', '#ffd23f');
  } else if (e.k === 'block') { spark(f.x + side * 30, zn === 'l' ? 236 : 164, '#8cc8ff', 7); pop(f.x, 118, 'SAVUNDU', '#8cc8ff'); KF.sfx('block'); G.shake = 2; }
  else if (e.k === 'perfect') { spark(f.x + side * 14, 150, '#6fe3ff', 16); G.parts.push({ k: 'burst', x: f.x + side * 14, y: 150, c: '#6fe3ff', life: .25, max: .25 }); G.shake = 4; G.freeze = .08; KF.sfx('perfect'); if (hs.callout) hs.callout('KUSURSUZ SAVUNMA!', '#6fe3ff'); KF.buzz(25); }
  else if (e.k === 'slip') { KF.sfx('slip'); }
  else if (e.k === 'dodge') { spark(f.x - side * 6, 140, '#bfe4ff', 12); G.parts.push({ k: 'ring', x: f.x, y: 140, c: '#8cc8ff', life: .3, max: .3 }); pop(f.x, 112, e.v ? 'HAVADA!' : 'SIYRILDI!', '#8cc8ff'); KF.sfx('perfect'); G.shake = 2; if (mine && hs.callout) hs.callout('SIYRILDIN!', '#8cc8ff'); }
  else if (e.k === 'cut') pop(f.x, 100, mine ? 'KESİLDİ' : 'KESTİN!', mine ? '#ff9a5e' : '#9aff9a');
  else if (e.k === 'break') { pop(f.x, 118, 'SAVUNMA KIRILDI', '#ff9a5e'); KF.sfx('block'); }
  else if (e.k === 'dash') { dust(f.x, -e.v * (e.s === 0 ? 1 : -1), 6, 3); KF.sfx('slip'); }
  else if (e.k === 'land') dust(f.x, 0, 7, 3.4);
  else if (e.k === 'wall') { spark(f.x, 150, '#fff', 8); G.shake = 5; pop(f.x, 112, 'KÖŞE!', '#ffd23f'); KF.sfx('block'); }
  else if (e.k === 'kd') { dust(f.x, side, 12, 4.4); G.parts.push({ k: 'ring', x: f.x, y: 258, c: '#d6ccb6', life: .35, max: .35 }); G.shake = 6; G.freeze = Math.max(G.freeze, .09); KF.sfx('heavy'); pop(f.x, 104, 'YERE SERİLDİ', '#ff9a5e'); KF.buzz(70); }
  else if (e.k === 'sig') { spark(fx(e.s).x, 150, '#ffd23f', 18); G.shake = 5; KF.sfx('perfect'); pop(fx(e.s).x, 96, 'İMZA KOMBO! +' + e.v, '#ffd23f'); if (hs.callout) hs.callout('İMZA KOMBO!', '#ffd23f'); }
  else if (e.k === 'cd') { if (hs.callout) hs.callout(e.v === 0 ? 'DÖVÜŞ!' : String(e.v), e.v === 0 ? '#d9ab4c' : '#fff'); KF.sfx(e.v === 0 ? 'go' : 'cd'); }
  else if (e.k === 'end') { if (hs.callout) hs.callout(e.v ? 'K.O.!' : 'SÜRE DOLDU', '#d9ab4c'); KF.sfx('ko'); G.shake = 6; }
  if (hs.ev) hs.ev(e, G);
}

/* ---------- kalite: Otomatik / Yüksek / Düşük. Düşükte parıltı, iz ve vinyet yok, parçacık yarı yarıya, 30 kare ---------- */
G.low = false;
function applyQuality() {
  var S = KF.S, low = S.perf === 'low' || (S.perf === 'auto' && (G.autoLow || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 1)));
  G.low = !!low; GFX.LOW = G.low;
}
KF.applyPerf = function () { G.autoLow = false; slowT = 0; applyQuality(); };
var slowT = 0, lastRaw = 0;

/* ---------- döngü ---------- */
var last = 0, acc = 0, sendT = 0;
function frame(ts) {
  var raw = ts - lastRaw; lastRaw = ts;
  if ((G.low || KF.S.fps30) && ts - last < 29) { requestAnimationFrame(frame); return; }
  var dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts; G.tm += dt;
  if (KF.S.perf === 'auto' && !G.low && G.mode !== 'menu' && !G.paused && G.M && G.M.ph === 'fight' && raw > 0 && raw < 250) {
    slowT = Math.max(0, slowT + (raw > 36 ? raw / 1000 : -.02)); if (slowT > 3) { G.autoLow = true; slowT = 0; applyQuality(); if (G.hook.perf) G.hook.perf(); }
  }
  var s = G.sim, fz = G.freeze > 0;
  if (fz) G.freeze -= dt;
  if (s && G.mode !== 'guest' && !G.paused && !fz) {
    acc += dt * (s.o.speed || 1);
    while (acc >= 1 / 60) { s.step(1 / 60); acc -= 1 / 60; }
    G.M = modelFromSim(s);
    s.ev.forEach(function (e) { if (e.id > G.seen) { G.seen = e.id; handleEv(e); } });
    var now = Date.now(); s.ev = s.ev.filter(function (e) { return now - e.ts < 3000; });
    if (G.mode === 'host' && G.room) { sendT += dt; if (sendT >= (G.room.direct() ? .05 : .08)) { sendT = 0; var sn = s.snap(); sn.rt = Math.round(G.room.rtt || 0); G.room.send(sn); } }
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
    V.a.jy = M.y[0]; V.b.jy = M.y[1]; if (M.cr) { V.a.cr = M.cr[0]; V.b.cr = M.cr[1]; } V.pj = M.pj || [];
    var mi = G.me, rs = (KF.STATS[G.sl && G.sl[mi]] || { rng: 1 }).rng;
    V.rng = (KF.S.rng && M.ph === 'fight' && G.mode !== 'menu') ? { x0: (mi ? V.b : V.a).x, dir: mi ? -1 : 1, rj: REACH.j * rs, rk: REACH.k * rs, dist: Math.abs(V.a.x - V.b.x) } : null;
  }
  V.a.flash = Math.max(0, V.a.flash - dt); V.b.flash = Math.max(0, V.b.flash - dt);
  if (!fz) { GFX.pose(V.a, dt, G.tm); GFX.pose(V.b, dt, G.tm); }
  G.parts.forEach(function (p) { p.life -= dt; if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; } });
  for (var i = G.parts.length - 1; i >= 0; i--) if (G.parts[i].life <= 0) G.parts.splice(i, 1);
  for (var j = G.pops.length - 1; j >= 0; j--) { var p = G.pops[j]; p.y -= 22 * dt; p.t -= dt; if (p.t <= 0) G.pops.splice(j, 1); }
  if (G.st && M && M.combo) G.st.cmb = Math.max(G.st.cmb, M.combo[G.me]);
  V.tm = G.tm; V.shake = G.shake; G.shake = Math.max(0, G.shake - 14 * dt);
  V.warn = G.mode !== 'menu';
  if (((G.fc = (G.fc || 0) + 1) % 45) === 1) fitCanvas();
  cx.setTransform(RS, 0, 0, RS, 0, 0); GFX.render(cx, V);
  if (G.hook.frame) G.hook.frame(M, dt);
  requestAnimationFrame(frame);
}
/* sahne çözünürlüğü: ekrandaki gerçek boyuta göre (en çok 2.25x, düşük modda 1.25x) */
var RS = 1;
function fitCanvas() {
  var r = cv.getBoundingClientRect ? cv.getBoundingClientRect() : null; if (!r || !r.width) return;
  var w = r.width * Math.min(root.devicePixelRatio || 1, 3) / 400; w = Math.max(1, Math.min(w, G.low ? 1.25 : 2.25)); w = Math.round(w * 4) / 4;
  if (w !== RS) { RS = w; cv.width = Math.round(400 * RS); cv.height = Math.round(300 * RS); try { cx.imageSmoothingQuality = 'high'; } catch (e) {} }
}
root.addEventListener('resize', fitCanvas); root.addEventListener('orientationchange', function () { setTimeout(fitCanvas, 300); });
G.start = function () { applyQuality(); requestAnimationFrame(frame); };
})(window);
