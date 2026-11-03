/* Kart Salonu · oyun ekranı: yerleşim, çizim, dokunma, pencereler */
(function (root) {
'use strict';
var KS = root.KS;
var h = KS.h, rank = KS.rank, suit = KS.suit;

/* ---------- Pencere (sheet) ---------- */
KS.sheets = [];
KS.sheet = function (title, body, o) {
  o = o || {};
  var box = KS.$('#modals');
  var closed = false;
  var modal = h('div', { class: 'modal' });
  var sheet = h('div', { class: 'sheet' + (o.wide ? ' wide' : '') });
  var api = { el: modal, sheet: sheet };
  function close(silent) {
    if (closed) return; closed = true;
    var k = KS.sheets.indexOf(api); if (k >= 0) KS.sheets.splice(k, 1);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
    if (!silent && o.onclose) o.onclose();
  }
  api.close = close;
  var head = h('div', { class: 'sh-h' }, h('h2', { text: title }));
  if (!o.noclose) head.appendChild(h('button', { class: 'btn ibtn', 'aria-label': 'Kapat', onclick: function () { KS.sfx('click'); close(); } }, KS.ic('close')));
  sheet.appendChild(head);
  if (o.tabs) {
    var tabs = h('div', { class: 'tabs' });
    o.tabs.forEach(function (t, i) {
      var b = h('button', { text: t.n, onclick: function () { KS.sfx('click'); sel(i); } });
      t.btn = b; tabs.appendChild(b);
    });
    sheet.appendChild(tabs);
  }
  var bd = h('div', { class: 'sh-b' });
  api.body = bd;
  sheet.appendChild(bd);
  function sel(i) {
    o.tabs.forEach(function (t, j) { t.btn.classList.toggle('on', i === j); });
    KS.clear(bd); KS.add(bd, o.tabs[i].f(api)); bd.scrollTop = 0;
    if (o.ontab) o.ontab(i);
  }
  api.tab = sel;
  if (o.tabs) sel(o.tab || 0); else KS.add(bd, typeof body === 'function' ? body(api) : body);
  if (o.buttons) {
    var f = h('div', { class: 'sh-f' });
    o.buttons.forEach(function (b) {
      var bt = h('button', { class: 'btn ' + (b.cls || ''), text: b.text, onclick: function () { KS.sfx('click'); if (b.fn && b.fn(api) === false) return; if (!b.keep) close(); } });
      if (b.id) api[b.id] = bt;
      f.appendChild(bt);
    });
    sheet.appendChild(f); api.foot = f;
  }
  modal.appendChild(sheet);
  modal.addEventListener('pointerdown', function (e) { if (e.target === modal && !o.sticky) { close(); } });
  box.appendChild(modal);
  KS.sheets.push(api);
  return api;
};
KS.closeTop = function () {
  var s = KS.sheets[KS.sheets.length - 1];
  if (!s) return false;
  s.close(); return true;
};

/* ---------- Oyun ekranı ---------- */
function GameUI(o) {
  this.ctrl = o.ctrl; this.o = o;
  this.game = o.ctrl.game;
  this.scene = null; this.sel = null; this.dead = false;
  this.seatEls = {}; this.badgeEls = []; this.timers = [];
  this.shownEnd = false; this.lastTurn = -1; this.lastHand = -1;
  this.busy = false;
  this.build();
  var self = this;
  o.ctrl.on(function (ev, kind) { self.onChange(ev, kind); });
  KS.onLayout = function () { self.layout(); self.render([], 'layout'); };
  o.ctrl.chatCb = function (seat, text) { self.showChat(seat, text); };
  this.tick = setInterval(function () { self.pulse(); }, 500);
  this.layout();
  this.render(o.ctrl.view() ? (o.firstEv || []) : [], 'start');
}
KS.GameUI = GameUI;

GameUI.prototype.build = function () {
  var self = this, g = KS.$('#game');
  KS.clear(g);
  this.root = g;
  this.felt = h('div', { class: 'felt' });
  this.rim = h('div', { class: 'rim' });
  this.ring = h('div', { class: 'ringdeco' });
  this.layer = h('div', { class: 'cardlayer' });
  this.ov = h('div', { class: 'ov', style: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' } });
  this.stageEl = h('div', { class: 'stage' }, this.ring, this.layer, this.ov);
  this.stage = new KS.Stage(this.layer);
  this.wm = h('div', { class: 'wm', text: 'by uozdil' });
  this.say = h('div', { class: 'say' });
  this.ov.appendChild(this.say);
  this.fab = h('button', { class: 'btn gold sm fab', style: { display: 'none', pointerEvents: 'auto' }, onclick: function () { self.drawCard(); } });
  this.ov.appendChild(this.fab);
  this.dot = h('div', { class: 'suitdot', style: { display: 'none' } });
  this.ov.appendChild(this.dot);
  this.dirl = h('div', { class: 'lbl', style: { display: 'none' } });
  this.ov.appendChild(this.dirl);
  this.banner = h('div', { class: 'banner', style: { display: 'none' } });
  this.mkRail();
  g.appendChild(this.felt); g.appendChild(this.rim); g.appendChild(this.stageEl); g.appendChild(this.rail); g.appendChild(this.banner);
  this.stageEl.addEventListener('pointerdown', function (e) { self.down(e); });
};

GameUI.prototype.mkRail = function () {
  var self = this, c = this.ctrl;
  function btn(ic, label, fn, extra) {
    var b = h('button', Object.assign({ class: 'btn ibtn', 'aria-label': label, title: label, onclick: function (e) { KS.sfx('click'); fn(e); } }, extra || {}), KS.ic(ic));
    return b;
  }
  this.rail = h('div', { class: 'rail' });
  var r = this.rail;
  r.appendChild(btn('home', 'Ana menü', function () { self.leave('home'); }));
  r.appendChild(btn('back', 'Geri', function () { self.leave('back'); }));
  r.appendChild(h('div', { class: 'grow' }));
  this.connEl = h('span', { class: 'conn-ind', style: { display: c.isOnline ? '' : 'none' } });
  r.appendChild(this.connEl);
  r.appendChild(btn('trophy', 'Puan tablosu', function () { self.scoreSheet(false); }));
  if (c.isOnline) {
    this.chatBtn = btn('chat', 'Mesaj', function () { self.chatSheet(); });
    r.appendChild(this.chatBtn);
  }
  r.appendChild(btn('help', 'Kılavuz', function () { if (self.o.onHelp) self.o.onHelp(self.game); }));
  this.sndBtn = btn(KS.S.sfx ? 'sound' : 'mute', 'Ses', function () {
    KS.S.sfx = !KS.S.sfx; KS.saveSettings(); self.sndBtn.innerHTML = ''; self.sndBtn.appendChild(KS.ic(KS.S.sfx ? 'sound' : 'mute'));
  });
  r.appendChild(this.sndBtn);
  r.appendChild(btn('gear', 'Ayarlar', function () { if (self.o.onSettings) self.o.onSettings(); }));
  if (KS.canFs()) {
    var fs = btn(KS.isFs() ? 'shrink' : 'expand', 'Tam ekran', function () { KS.toggleFs(); }, { 'data-fs': '1' });
    r.appendChild(fs);
  }
};

GameUI.prototype.leave = function (where) {
  var self = this, c = this.ctrl;
  var go = function () { if (self.o.onExit) self.o.onExit(where); };
  if (!KS.S.confirmExit || this.ctrl.gameOver()) { go(); return; }
  var msg = c.isOnline ? 'Çıkarsan yerine bilgisayar oynar. Aynı odaya tekrar girersen koltuğuna dönersin.' : 'Oyun kaydedilir. Ana sayfadan kaldığın yerden devam edebilirsin.';
  KS.sheet(where === 'home' ? 'Ana menüye dön?' : 'Geri dön?', h('div', null, h('p', { class: 'note', text: msg })), {
    buttons: [{ text: 'Oyuna devam' }, { text: where === 'home' ? 'Ana menü' : 'Geri', cls: 'gold', fn: go }]
  });
};

/* ---------- Yerleşim ---------- */
GameUI.prototype.layout = function () {
  var app = KS.$('#app'), W = app.clientWidth, H = app.clientHeight, S = KS.S;
  var land = W > H * 1.05;
  document.body.classList.toggle('land', land);
  var fs = 16 * (S.uiscale / 100);
  var rw = Math.round(2.6 * fs + 0.55 * fs * 2), rh = Math.round(2.6 * fs + 0.9 * fs);
  var x = S.safeL, y = S.safeT, w = W - S.safeL - S.safeR, hh = H - S.safeT - S.safeB;
  if (land) { w -= rw; if (S.railpos !== 'right') x += rw; }
  else { y += rh; hh -= rh; }
  var st = this.stageEl.style;
  st.left = x + 'px'; st.top = y + 'px'; st.width = w + 'px'; st.height = hh + 'px';
  this.felt.style.cssText = '';
  var rm = this.rim.style;
  rm.left = (x + 6) + 'px'; rm.top = (y + 6) + 'px'; rm.width = (w - 12) + 'px'; rm.height = (hh - 12) + 'px';
  var rs = Math.min(w, hh) * 0.78;
  this.ring.style.width = rs + 'px'; this.ring.style.height = rs + 'px';
  var size = { s: 0.88, m: 1, l: 1.14 }[S.cardsize] || 1;
  var cw = land ? Math.min(hh * 0.215, w / 9.5) : Math.min(w / 4.8, hh * 0.14);
  cw = KS.clamp(cw * size, 40, 100);
  this.G = { w: w, h: hh, cw: cw, land: land, x: x, y: y };
  this.stage.setSize(w, hh, cw);
  this.wm.style.cssText = '';
};

/* ---------- Çizim ---------- */
GameUI.prototype.names = function () {
  var a = [], i;
  for (i = 0; i < this.ctrl.n; i++) a.push(this.ctrl.seatInfo(i).name);
  return a;
};
GameUI.prototype.onChange = function (ev, kind) {
  if (this.dead) return;
  this.render(ev, kind);
};
GameUI.prototype.render = function (ev, kind) {
  var c = this.ctrl, v = c.view();
  if (!v || !this.G) return;
  var me = c.seat, self = this;
  if (me === undefined || me === null) return;
  var X = { G: this.G, me: me, ev: ev, names: this.names(), sel: this.sel, fresh: kind === 'start' && !this.o.noDeal };
  this.v = v;
  if (v.phase === 'handEnd' || v.phase === 'gameEnd') X.sel = null;
  var sc = KS.scenes[this.game](v, X);
  this.scene = sc;
  this.stage.render(sc.items, { exit: sc.exit });
  this.renderOverlay(sc, v);
  this.sounds(ev, v, kind);
  if (kind !== 'layout') this.floats(ev, v);
  if (v.turn === me && v.phase === 'play' && this.lastTurn !== me && kind !== 'start' && kind !== 'resync' && kind !== 'layout') { KS.sfx('turn', 0.25); KS.vib(25); }
  if (kind !== 'layout' && kind !== 'sync') this.lastTurn = v.phase === 'play' ? v.turn : -1;
  this.checkEnd(v, ev, kind);
};

GameUI.prototype.renderOverlay = function (sc, v) {
  var G = this.G, me = this.ctrl.seat, n = v.n, s, i;
  var sp = this.stageEl;
  // koltuk rozetleri
  for (s = 0; s < n; s++) {
    var L = sc.L[s], info = this.ctrl.seatInfo(s), el = this.seatEls[s];
    if (!el) {
      el = this.seatEls[s] = { root: h('div', { class: 'seat' + (s === me ? ' me' : '') }), av: h('div', { class: 'av' }), nm: h('div', { class: 'nm' }), sc: h('div', { class: 'sc' }), tm: h('div', { class: 'timer' }) };
      el.tmi = h('i'); el.tm.appendChild(el.tmi);
      el.root.appendChild(el.av); el.root.appendChild(h('div', null, el.nm, el.sc));
      el.root.appendChild(el.tm);
      this.ov.appendChild(el.root);
    }
    el.av.textContent = info.av;
    var bot = info.bot || info.away;
    el.root.classList.toggle('away', !!info.away);
    el.nm.textContent = info.name + (s === me ? ' (sen)' : '');
    el.sc.textContent = sc.sub ? sc.sub(s) : '';
    el.root.classList.toggle('turn', v.phase === 'play' && v.turn === s);
    el.root.style.left = L.bx + 'px'; el.root.style.top = L.by + 'px';
    el.root.style.display = '';
    el.tm.style.display = 'none';
    el.bot = bot;
  }
  for (s in this.seatEls) if (+s >= n) this.seatEls[s].root.style.display = 'none';
  // rozetler (deste adedi vb.)
  for (i = 0; i < sc.badges.length; i++) {
    var b = sc.badges[i], be = this.badgeEls[i];
    if (!be) { be = this.badgeEls[i] = h('div', { class: 'badge' }); this.ov.appendChild(be); }
    be.style.display = ''; be.textContent = b.text; be.style.left = b.x + 'px'; be.style.top = b.y + 'px';
    be.style.color = b.gold ? '#ffb4a8' : '';
  }
  for (i = sc.badges.length; i < this.badgeEls.length; i++) this.badgeEls[i].style.display = 'none';
  // söz satırı
  var turnMe = v.phase === 'play' && v.turn === me;
  var meL = sc.L[me];
  this.say.textContent = sc.say || '';
  this.say.style.display = sc.say ? '' : 'none';
  this.say.classList.toggle('me', turnMe);
  if (G.land) { this.say.style.left = (G.w - 92) + 'px'; this.say.style.top = (G.h - 24) + 'px'; this.say.style.transform = 'translate(-50%,-50%)'; this.say.style.maxWidth = '170px'; this.say.style.fontSize = '.8rem'; }
  else { this.say.style.transform = ''; this.say.style.left = '50%'; this.say.style.maxWidth = '92%'; this.say.style.fontSize = ''; this.say.style.top = (G.h - sc.ch * 1.0 - 16 - (this.handRows(v) > 1 ? sc.ch * 0.36 : 0) - 42) + 'px'; }
  // Pis 7: renk işareti, çekme düğmesi, yön
  this.fab.style.display = 'none'; this.dot.style.display = 'none'; this.dirl.style.display = 'none';
  if (this.game === 'pis7') {
    if (v.wild && v.suit >= 0 && v.phase === 'play') {
      this.dot.className = 'suitdot s' + v.suit; this.dot.innerHTML = KS.cards.su(v.suit);
      this.dot.style.left = (sc.dx + sc.cw * 0.5) + 'px'; this.dot.style.top = (sc.cy - sc.ch * 0.62) + 'px'; this.dot.style.display = '';
    }
    if (v.pend > 0 && v.phase === 'play') {
      var pb = this.badgeEls[sc.badges.length];
      if (!pb) { pb = this.badgeEls[sc.badges.length] = h('div', { class: 'badge' }); this.ov.appendChild(pb); }
      pb.style.display = ''; pb.textContent = '+' + v.pend + ' çek'; pb.style.left = (sc.dx - sc.cw * 0.5) + 'px'; pb.style.top = (sc.cy - sc.ch * 0.62) + 'px'; pb.style.color = '#ff9a8a';
    }
    if (turnMe && !v.first) {
      this.fab.textContent = v.pend > 0 ? v.pend + ' kart çek' : 'Kart çek';
      this.fab.style.left = Math.max(52, sc.deckPos.x) + 'px'; this.fab.style.top = (sc.deckPos.y + sc.ch * 0.95) + 'px'; this.fab.style.display = '';
    }
    if (v.phase === 'play') {
      this.dirl.textContent = v.dir > 0 ? '↻ saat yönü' : '↺ ters yön';
      this.dirl.style.left = sc.cx + 'px'; this.dirl.style.top = (sc.cy + sc.ch * 1.1) + 'px'; this.dirl.style.display = '';
    }
  }
};
GameUI.prototype.handRows = function (v) {
  var n = v.hand.length, G = this.G;
  var aw = G.land ? Math.max(G.w * 0.5, G.w - 340) : G.w - 16;
  return n > 1 && (aw - G.cw) / (n - 1) < G.cw * 0.34 * 1.15 ? 2 : 1;
};

GameUI.prototype.pulse = function () {
  if (this.dead) return;
  var c = this.ctrl, v = this.v;
  if (!v) return;
  // zaman göstergesi
  var dl = c.deadline ? c.deadline() : 0, tt = c.turnTime ? c.turnTime() : 0, s, k;
  for (k in this.seatEls) this.seatEls[k].tm.style.display = 'none';
  if (dl && tt && v.phase === 'play' && this.seatEls[v.turn]) {
    var el = this.seatEls[v.turn], rem = Math.max(0, dl - Date.now());
    el.tm.style.display = ''; el.tmi.style.transform = 'scaleX(' + Math.min(1, rem / (tt * 1000)) + ')';
    if (rem < 5000 && v.turn === c.seat && !this.warned) { this.warned = true; KS.sfx('bad'); } else if (rem > 6000) this.warned = false;
  }
  // bağlantı
  if (c.isOnline) {
    var st = c.connState();
    this.connEl.className = 'conn-ind' + (st === 'ok' ? '' : (st === 'host' ? ' off' : ' bad'));
    if (st === 'ok') this.banner.style.display = 'none';
    else {
      this.banner.style.display = '';
      this.banner.textContent = st === 'host' ? 'Oda sahibine ulaşılamıyor… bekleniyor, oyun kaybolmaz.' : 'Bağlantı koptu. Yeniden bağlanılıyor…';
    }
  }
};

/* ---------- Ses ve yüzen yazılar ---------- */
GameUI.prototype.sounds = function (ev, v, kind) {
  if (kind === 'layout' || kind === 'sync' || kind === 'resync' || kind === 'presence') return;
  var i, me = this.ctrl.seat;
  for (i = 0; i < ev.length; i++) {
    var e = ev[i];
    if (e.t === 'newHand' || e.t === 'deal') { var k; for (k = 0; k < 4; k++) KS.sfx('deal', k * 0.11); }
    else if (e.t === 'play') KS.sfx(e.seat === me ? 'place' : 'flip');
    else if (e.t === 'capture') { KS.sfx('take', 0.12); if (e.pisti) KS.sfx('pisti', 0.2); }
    else if (e.t === 'sweep') KS.sfx('take', 0.1);
    else if (e.t === 'give') { if (e.to === me) { KS.sfx('bad', 0.1); KS.vib(60); } else KS.sfx('take', 0.1); }
    else if (e.t === 'draw') { for (var d = 0; d < Math.min(4, e.n || 1); d++) KS.sfx('draw', d * 0.09); if (e.seat === me && e.n > 2) KS.sfx('bad', 0.2); }
    else if (e.t === 'suit') KS.sfx('suit');
  }
};
GameUI.prototype.slotXY = function (s) {
  var L = this.scene && this.scene.L[s];
  return L ? { x: L.px, y: L.py } : { x: this.G.w / 2, y: this.G.h / 2 };
};
GameUI.prototype.floatAt = function (text, x, y) {
  var f = h('div', { class: 'float', text: text, style: { left: x + 'px', top: y + 'px' } });
  this.ov.appendChild(f);
  setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1700);
};
GameUI.prototype.floats = function (ev, v) {
  var i, G = this.G, me = this.ctrl.seat;
  for (i = 0; i < ev.length; i++) {
    var e = ev[i];
    if (e.t === 'capture' && e.pisti) {
      this.floatAt(e.pisti === 2 ? 'ÇİFT PİŞTİ! +20' : 'PİŞTİ! +10', G.w / 2, G.h * 0.4);
    } else if (e.t === 'give' && e.pts) {
      var p = this.slotXY(e.to);
      this.floatAt('+' + e.pts + ' ceza', p.x, p.y - 30);
    } else if (e.t === 'draw' && e.n > 1 && this.game === 'pis7') {
      var L = this.scene.L[e.seat];
      this.floatAt('+' + e.n + ' kart', L.bx, L.by + 30);
    } else if (e.t === 'skip' && this.game === 'pis7') {
      var L2 = this.scene.L[e.seat];
      this.floatAt('Pas!', L2.bx, L2.by + 30);
    } else if (e.t === 'reverse') {
      this.floatAt('Yön değişti', G.w / 2, G.h * 0.34);
    } else if (e.t === 'suit') {
      /* renk işareti zaten gösteriliyor */
    }
  }
};

/* ---------- Dokunma ---------- */
GameUI.prototype.itemOf = function (k) {
  var it = this.scene && this.scene.items, i;
  if (!it) return null;
  for (i = 0; i < it.length; i++) if (it[i].k === k) return it[i];
  return null;
};
GameUI.prototype.down = function (e) {
  if (this.dead || this.drag) return;
  var el = e.target.closest ? e.target.closest('.card') : null;
  if (!el || !this.stageEl.contains(el)) return;
  var k = el.getAttribute('data-k'), it = this.itemOf(k);
  if (!it || it.handIndex === undefined) return;
  var self = this;
  this.drag = { k: k, el: el, it: it, x0: e.clientX, y0: e.clientY, dy: 0, moved: false, id: e.pointerId };
  function mv(ev) {
    var d = self.drag; if (!d) return;
    var dy = d.y0 - ev.clientY, dx = ev.clientX - d.x0;
    if (!d.moved && (Math.abs(dy) > 8 || Math.abs(dx) > 8)) d.moved = true;
    if (d.moved && it.act) {
      d.dy = dy;
      el.style.transition = 'none'; el.firstChild.style.transition = 'none';
      self.stage.place(el, { x: it.x + dx * 0.3, y: it.y, rot: 0, sc: 1.05, z: 300, lift: Math.max(0, dy) });
    }
  }
  function up(ev) {
    document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
    var d = self.drag; self.drag = null;
    if (!d) return;
    el.style.transition = ''; el.firstChild.style.transition = '';
    if (ev.type === 'pointercancel') { self.render([], 'layout'); return; }
    if (d.moved && d.dy > self.G.cw * 0.55) { self.tryPlay(k); return; }
    if (d.moved && Math.abs(d.dy) > 8) { self.render([], 'layout'); return; }
    self.tap(k);
  }
  document.addEventListener('pointermove', mv);
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
};
GameUI.prototype.tap = function (k) {
  var it = this.itemOf(k), v = this.v, me = this.ctrl.seat;
  if (!it) return;
  if (v.phase !== 'play') return;
  if (v.turn !== me) {
    // sıra başkasında: seçmek serbest, oynamak değil
    this.sel = this.sel === k ? null : k; KS.sfx('click'); this.render([], 'layout');
    if (!this.warnT || Date.now() - this.warnT > 2500) { this.warnT = Date.now(); KS.toast('Sıra sende değil', '', 1200); }
    return;
  }
  if (!it.act) { this.cantPlay(); return; }
  if (KS.S.tap1 || this.sel === k) this.tryPlay(k);
  else { this.sel = k; KS.sfx('click'); this.render([], 'layout'); }
};
GameUI.prototype.cantPlay = function () {
  KS.sfx('bad'); KS.vib(30);
  var v = this.v;
  if (this.game === 'pis7') {
    if (v.first) KS.toast('İlk kart Sinek olmalı', 'bad', 1600);
    else if (v.pend > 0) KS.toast('Yedi at ya da ' + v.pend + ' kart çek', 'bad', 1800);
    else KS.toast('Aynı renk ya da aynı sayı olmalı', 'bad', 1600);
  }
};
GameUI.prototype.tryPlay = function (k) {
  var it = this.itemOf(k), v = this.v, me = this.ctrl.seat;
  if (!it || v.phase !== 'play' || v.turn !== me || !it.act) { this.sel = null; this.render([], 'layout'); return; }
  var id = it.c, self = this;
  if (this.game === 'pisti') this.send({ t: 'play', c: id });
  else if (this.game === 'dost') {
    var os = KS.engines.dost.optionsFor(v, me, id);
    if (os.length === 1) this.send({ t: 'play', c: id, opt: os[0] });
    else this.dostChoose(id, os);
  } else {
    if (!v.first && (KS.isJoker(id) || rank(id) === 11)) this.suitPick(id);
    else this.send({ t: 'play', c: id });
  }
};
GameUI.prototype.send = function (a) {
  this.sel = null;
  var ok = this.ctrl.act(a);
  if (ok === false) { KS.sfx('bad'); this.render([], 'layout'); }
};
GameUI.prototype.drawCard = function () {
  var v = this.v;
  if (!v || v.phase !== 'play' || v.turn !== this.ctrl.seat) return;
  KS.sfx('click');
  this.send({ t: 'draw' });
};
GameUI.prototype.suitPick = function (id) {
  var self = this, box = h('div', { class: 'suitpick', style: { pointerEvents: 'auto' } }, h('div', { class: 'ttl', text: 'Hangi renk istiyorsun?' }));
  var order = [0, 1, 2, 3];
  order.forEach(function (s) {
    box.appendChild(h('button', { class: 's' + s, 'aria-label': KS.SUITN[s], onclick: function () {
      KS.sfx('suit'); if (box.parentNode) box.parentNode.removeChild(box); self.pick = null; self.send({ t: 'play', c: id, s: s });
    } }, h('span', { html: KS.cards.su(s) })));
  });
  this.pick = box;
  this.ov.appendChild(box);
  this.sel = null;
  var cancel = function (e) {
    if (box.contains(e.target)) return;
    document.removeEventListener('pointerdown', cancel, true);
    if (box.parentNode) box.parentNode.removeChild(box); self.pick = null;
  };
  setTimeout(function () { document.addEventListener('pointerdown', cancel, true); }, 50);
};
GameUI.prototype.dostChoose = function (id, os) {
  var self = this, v = this.v, names = this.names(), me = this.ctrl.seat;
  function who(s) { return s === me ? 'sana' : names[s] + ' oyuncusuna'; }
  var list = h('div', { class: 'optlist' });
  var sh;
  os.forEach(function (o) {
    var t, sub = '';
    if (o.k === 'floor') { t = 'Yerdeki ' + o.take + ' kartla birlikte ver'; sub = who(o.to) + ' gider'; }
    else if (o.k === 'pile') { t = 'Atılan son kartla birlikte ver'; sub = who(o.to) + ' gider'; }
    else if (o.k === 'pen') { t = names[o.to] + ' oyuncusunun cezasına ekle'; sub = 'Üstteki kartla eşleşiyor'; }
    else if (o.k === 'own') { t = 'Kendi ceza destemdeki ' + o.take + ' kartla birlikte ver'; sub = who(o.to) + ' gider'; }
    else { t = 'Yere at'; sub = 'Kimseye ceza yazılmaz'; }
    list.appendChild(h('button', { class: 'opt', onclick: function () { sh.close(true); self.send({ t: 'play', c: id, opt: o }); } },
      h('div', null, h('b', { text: t }), h('small', { text: sub }))));
  });
  sh = KS.sheet(KS.cardName(id), list, { onclose: function () { self.sel = null; self.render([], 'layout'); } });
};

/* ---------- Mesajlaşma ---------- */
var QUICK = ['Merhaba 👋', 'Güzel oyun!', 'Tüh be 😅', 'Bir dakika…', 'Hadi hadi', 'Teşekkürler', '👍', '😂', '😮', '🔥', '👏', '❤️'];
GameUI.prototype.chatSheet = function () {
  var self = this, sh;
  var bar = h('div', { class: 'chatbar' });
  QUICK.forEach(function (q) { bar.appendChild(h('button', { text: q, onclick: function () { sh.close(); self.ctrl.chat(q); self.showChat(self.ctrl.seat, q); KS.sfx('pop'); } })); });
  sh = KS.sheet('Mesaj gönder', bar);
};
GameUI.prototype.showChat = function (seat, text) {
  if (this.dead || !this.scene) return;
  var L = this.scene.L[seat]; if (!L) return;
  var e = h('div', { class: 'emo', text: text, style: { left: Math.max(60, Math.min(this.G.w - 60, L.bx)) + 'px', top: (L.by + (seat === this.ctrl.seat ? -30 : 34)) + 'px' } });
  this.ov.appendChild(e);
  KS.sfx('pop');
  setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 3300);
};

/* ---------- Puan tablosu ---------- */
GameUI.prototype.unitNames = function (v) {
  var names = this.names(), me = this.ctrl.seat, out = [], i;
  if (this.game === 'pisti' && v.opts.teams) {
    out = ['Takım 1 (' + names[0] + ' & ' + names[2] + ')', 'Takım 2 (' + names[1] + ' & ' + names[3] + ')'];
    return out;
  }
  for (i = 0; i < v.n; i++) out.push(names[i] + (i === me ? ' (sen)' : ''));
  return out;
};
GameUI.prototype.myUnit = function (v) { return this.game === 'pisti' && v.opts.teams ? this.ctrl.seat % 2 : this.ctrl.seat; };
GameUI.prototype.scoreRows = function (v) {
  var un = this.unitNames(v), rows = [], i, L = v.last, g = this.game, head, me = this.myUnit(v);
  var tot = v.scores;
  if (g === 'pisti') {
    head = ['Oyuncu', 'Kâğıt', 'Puan', 'Bu el', 'Toplam'];
    for (i = 0; i < un.length; i++) {
      var r = L && L[i];
      rows.push({ me: i === me, c: [un[i], r ? r.cards : '–', r ? (r.pts + (r.maj ? '+' + r.maj : '') + (r.pisti ? '+' + r.pisti * 10 + 'p' : '') + (r.dpisti ? '+' + r.dpisti * 20 + 'p' : '')) : '–', r ? r.total : '–', tot[i]] });
    }
  } else if (g === 'dost') {
    head = ['Oyuncu', 'Ceza', 'El puanı', 'Toplam'];
    for (i = 0; i < un.length; i++) rows.push({ me: i === me, c: [un[i], L ? L.pens[i] : '–', L ? (L.pts[i] > 0 ? '+' : '') + L.pts[i] : '–', Math.round(tot[i] * 10) / 10] });
  } else {
    head = ['Oyuncu', 'Elde kalan', 'Bu el', 'Toplam'];
    for (i = 0; i < un.length; i++) {
      var rr = L && L.rows ? L.rows[i] : null;
      rows.push({ me: i === me, win: L && L.winner === i, c: [un[i] + (L && L.winner === i ? ' 🏁' : ''), rr ? rr.base : '–', rr ? '+' + rr.total : '–', tot[i]] });
    }
  }
  return { head: head, rows: rows };
};
GameUI.prototype.scoreTable = function (v) {
  var d = this.scoreRows(v), t = h('table', { class: 'tbl' }), tr = h('tr'), i, j;
  d.head.forEach(function (x) { tr.appendChild(h('th', { text: x })); });
  t.appendChild(tr);
  d.rows.forEach(function (r) {
    var q = h('tr', { class: (r.me ? 'me ' : '') + (r.win ? 'win' : '') });
    r.c.forEach(function (x) { q.appendChild(h('td', { text: String(x) })); });
    t.appendChild(q);
  });
  return t;
};
GameUI.prototype.scoreSheet = function (fin) {
  var v = this.v; if (!v) return null;
  var g = this.game, info = '';
  if (g === 'pisti') info = 'Hedef ' + v.opts.target + ' puan';
  else if (g === 'dost') info = 'El ' + v.handNo + ' / ' + v.opts.hands;
  else info = v.opts.mode === 'hands' ? 'El ' + v.handNo + ' / ' + v.opts.v : 'Sınır ' + v.opts.v + ' puan (en az puan kazanır)';
  return KS.sheet(fin ? 'Oyun bitti' : 'Puan tablosu', h('div', null, h('div', { class: 'note', style: { textAlign: 'center' }, text: info }), this.scoreTable(v)), {});
};

GameUI.prototype.checkEnd = function (v, ev, kind) {
  var self = this;
  if (v.phase === 'play') { this.shownEnd = false; if (this.endSheet) { this.endSheet.close(true); this.endSheet = null; } return; }
  if (this.shownEnd || kind === 'layout') return;
  if (v.phase !== 'handEnd' && v.phase !== 'gameEnd') return;
  this.shownEnd = true;
  var delay = (ev && ev.length ? 1500 : 200) * (KS.speedMul || 1);
  setTimeout(function () { if (!self.dead) self.endView(); }, delay);
};
GameUI.prototype.endView = function () {
  var v = this.v, self = this, me = this.ctrl.seat, g = this.game;
  if (!v || (v.phase !== 'handEnd' && v.phase !== 'gameEnd')) return;
  var fin = v.over || v.phase === 'gameEnd';
  var body = h('div', null), mu = this.myUnit(v), won = false, i;
  if (fin) {
    var w = v.winner;
    if (g === 'pisti') won = w === mu; else won = w.indexOf(me) >= 0;
    var un = this.unitNames(v);
    var title = g === 'pisti' ? un[w] : w.map(function (x) { return un[x]; }).join(' & ');
    body.appendChild(h('div', { class: 'big', text: won ? 'Tebrikler!' : 'Oyun bitti' }));
    body.appendChild(h('div', { class: 'note', style: { textAlign: 'center', fontSize: '.95rem' }, text: 'Kazanan: ' + title }));
    if (!this.endPlayed) { this.endPlayed = true; KS.sfx(won ? 'win' : 'lose'); }
  } else {
    var msg = '';
    if (g === 'pisti') msg = 'El bitti';
    else if (g === 'dost') msg = 'El ' + v.handNo + ' bitti';
    else msg = v.last && v.last.winner >= 0 ? this.names()[v.last.winner] + ' elini bitirdi' : 'El bitti';
    body.appendChild(h('div', { class: 'big', text: msg }));
  }
  body.appendChild(this.scoreTable(v));
  if (g === 'pis7' && v.last && v.last.mult > 1) body.appendChild(h('p', { class: 'note', style: { textAlign: 'center' }, text: 'Son kartla bitirme çarpanı ×' + v.last.mult }));
  var buttons;
  var wait = false;
  if (fin) buttons = [{ text: 'Ana menü', fn: function () { self.o.onExit('home'); } }, { text: 'Yeni oyun', cls: 'gold', fn: function () { self.o.onExit('again'); } }];
  else buttons = [{ text: 'Sonraki el', cls: 'gold', id: 'nx', keep: true, fn: function (api) { self.ctrl.ready(); api.nx.textContent = 'Diğerleri bekleniyor…'; api.nx.classList.add('dis'); return false; } }];
  if (this.endSheet) this.endSheet.close(true);
  this.endSheet = KS.sheet(fin ? 'Sonuç' : 'El sonucu', body, { noclose: true, sticky: true, buttons: buttons, wide: false });
  if (!fin && !this.ctrl.isOnline && this.o.autoNext) { /* yerelde kullanıcı basar */ }
};

GameUI.prototype.destroy = function () {
  this.dead = true;
  clearInterval(this.tick);
  this.stage.clear();
  if (this.endSheet) this.endSheet.close(true);
  KS.onLayout = null;
  KS.clear(this.root);
};

if (typeof module !== 'undefined' && module.exports) module.exports = GameUI;
})(typeof window !== 'undefined' ? window : globalThis);
