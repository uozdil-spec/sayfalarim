/* Briç · oyun ekranı: yerleşim, çizim, dokunma, pencereler */
(function (root) {
'use strict';
var BR = root.BR;
var h = BR.h, rank = BR.rank, suit = BR.suit;

/* ---------- Pencere (sheet) ---------- */
BR.sheets = [];
BR.sheet = function (title, body, o) {
  o = o || {};
  var box = BR.$('#modals');
  var closed = false;
  var modal = h('div', { class: 'modal' });
  var sheet = h('div', { class: 'sheet' + (o.wide ? ' wide' : '') });
  var api = { el: modal, sheet: sheet };
  function close(silent) {
    if (closed) return; closed = true;
    var k = BR.sheets.indexOf(api); if (k >= 0) BR.sheets.splice(k, 1);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
    if (!silent && o.onclose) o.onclose();
  }
  api.close = close;
  var head = h('div', { class: 'sh-h' }, h('h2', { text: title }));
  if (!o.noclose) head.appendChild(h('button', { class: 'btn ibtn', 'aria-label': 'Kapat', onclick: function () { BR.sfx('click'); close(); } }, BR.ic('close')));
  sheet.appendChild(head);
  if (o.tabs) {
    var tabs = h('div', { class: 'tabs' });
    o.tabs.forEach(function (t, i) {
      var b = h('button', { text: t.n, onclick: function () { BR.sfx('click'); sel(i); } });
      t.btn = b; tabs.appendChild(b);
    });
    sheet.appendChild(tabs);
  }
  var bd = h('div', { class: 'sh-b' });
  api.body = bd;
  sheet.appendChild(bd);
  function sel(i) {
    o.tabs.forEach(function (t, j) { t.btn.classList.toggle('on', i === j); });
    BR.clear(bd); BR.add(bd, o.tabs[i].f(api)); bd.scrollTop = 0;
    if (o.ontab) o.ontab(i);
  }
  api.tab = sel;
  if (o.tabs) sel(o.tab || 0); else BR.add(bd, typeof body === 'function' ? body(api) : body);
  if (o.buttons) {
    var f = h('div', { class: 'sh-f' });
    o.buttons.forEach(function (b) {
      var bt = h('button', { class: 'btn ' + (b.cls || ''), text: b.text, onclick: function () { BR.sfx('click'); if (b.fn && b.fn(api) === false) return; if (!b.keep) close(); } });
      if (b.id) api[b.id] = bt;
      f.appendChild(bt);
    });
    sheet.appendChild(f); api.foot = f;
  }
  modal.appendChild(sheet);
  modal.addEventListener('pointerdown', function (e) { if (e.target === modal && !o.sticky) { close(); } });
  box.appendChild(modal);
  BR.sheets.push(api);
  return api;
};
BR.closeTop = function () {
  var s = BR.sheets[BR.sheets.length - 1];
  if (!s) return false;
  s.close(); return true;
};

/* ---------- Yardımcılar ---------- */
var B = BR.Bridge;
var SUITCH = ['♠', '♥', '♦', '♣'];
function suitHTML(s) { return '<span class="sy ' + (s === 1 || s === 2 ? 'r' : 'k') + '">' + SUITCH[s] + '</span>'; }
/* ihale metni: renkli takım simgesi */
function bidHTML(b) {
  if (b === 'P') return '<span class="cl pas">Pas</span>';
  if (b === 'X') return '<span class="cl dbl">Kontra</span>';
  if (b === 'R') return '<span class="cl rdbl">Rekontra</span>';
  var d = B.bidDen(b), t = B.bidLevel(b);
  if (d === 4) return '<span class="cl">' + t + '<span class="sy k">SA</span></span>';
  var s = B.DEN2SUIT[d];
  return '<span class="cl">' + t + suitHTML(s) + '</span>';
}
function ctText(ct) {
  if (!ct) return '';
  var d = B.bidDen(ct.v), s = d === 4 ? '<span class="sy k">SA</span>' : suitHTML(B.DEN2SUIT[d]);
  return ct.level + s + (ct.dbl === 2 ? ' ✕✕' : ct.dbl === 1 ? ' ✕' : '');
}
function hcp(hand) { var t = 0, i; for (i = 0; i < hand.length; i++) { var r = B.rv(hand[i]); if (r > 10) t += r - 10; } return t; }
function shape(hand) {
  var n = [0, 0, 0, 0], i; for (i = 0; i < hand.length; i++) n[suit(hand[i])]++;
  return n;
}
function cardTxt(c) { return '<span class="ct ' + (BR.red(c) ? 'r' : 'k') + '">' + SUITCH[suit(c)] + BR.RN[rank(c)] + '</span>'; }
GameUIHelpers();
function GameUIHelpers() { BR.bidHTML = bidHTML; BR.ctText = ctText; BR.hcp = hcp; BR.shape = shape; BR.cardTxt = cardTxt; }

/* ---------- Oyun ekranı ---------- */
function GameUI(o) {
  this.ctrl = o.ctrl; this.o = o;
  this.game = 'bric';
  this.scene = null; this.sel = null; this.dead = false;
  this.seatEls = {}; this.timers = [];
  this.hold = null; this.holdT = null; this.sweep = null;
  this.shownEnd = false; this.lastTurn = -1; this.lvl = null; this.autoKey = '';
  this.build();
  var self = this;
  o.ctrl.on(function (ev, kind) { self.onChange(ev, kind); });
  BR.onLayout = function () { self.layout(); self.render([], 'layout'); };
  o.ctrl.chatCb = function (seat, text) { self.showChat(seat, text); };
  this.tick = setInterval(function () { self.pulse(); }, 500);
  this.layout();
  this.render(o.ctrl.view() ? (o.firstEv || []) : [], 'start');
}
BR.GameUI = GameUI;

GameUI.prototype.build = function () {
  var self = this, g = BR.$('#game');
  BR.clear(g);
  this.root = g;
  this.felt = h('div', { class: 'felt' });
  this.rim = h('div', { class: 'rim' });
  this.ring = h('div', { class: 'ringdeco' });
  this.layer = h('div', { class: 'cardlayer' });
  this.ov = h('div', { class: 'ov', style: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' } });
  this.stageEl = h('div', { class: 'stage' }, this.ring, this.layer, this.ov);
  this.stage = new BR.Stage(this.layer);
  this.say = h('div', { class: 'say' });
  this.ov.appendChild(this.say);
  this.plateL = h('div', { class: 'plate pl' });
  this.plateR = h('div', { class: 'plate pr' });
  this.ov.appendChild(this.plateL); this.ov.appendChild(this.plateR);
  this.bidEl = h('div', { class: 'bidwrap', style: { display: 'none' } });
  this.ov.appendChild(this.bidEl);
  this.banner = h('div', { class: 'banner', style: { display: 'none' } });
  this.mkRail();
  g.appendChild(this.felt); g.appendChild(this.rim); g.appendChild(this.stageEl); g.appendChild(this.rail); g.appendChild(this.banner);
  this.stageEl.addEventListener('pointerdown', function (e) { self.down(e); });
};

GameUI.prototype.mkRail = function () {
  var self = this, c = this.ctrl;
  function btn(ic, label, fn, extra) {
    return h('button', Object.assign({ class: 'btn ibtn', 'aria-label': label, title: label, onclick: function (e) { BR.sfx('click'); fn(e); } }, extra || {}), BR.ic(ic));
  }
  this.rail = h('div', { class: 'rail' });
  var r = this.rail;
  r.appendChild(btn('home', 'Ana menü', function () { self.leave('home'); }));
  r.appendChild(btn('back', 'Geri', function () { self.leave('back'); }));
  r.appendChild(h('div', { class: 'grow' }));
  this.connEl = h('span', { class: 'conn-ind', style: { display: c.isOnline ? '' : 'none' } });
  r.appendChild(this.connEl);
  this.hintBtn = btn('bulb', 'İpucu', function () { self.hint(); });
  r.appendChild(this.hintBtn);
  this.autoBtn = btn('bot', 'Oyunu bilgisayara bırak', function () { self.toggleAuto(); });
  this.autoBtn.style.display = 'none';
  r.appendChild(this.autoBtn);
  r.appendChild(btn('trophy', 'Puan tablosu', function () { self.scoreSheet(false); }));
  if (c.isOnline) {
    this.chatBtn = btn('chat', 'Mesaj', function () { self.chatSheet(); });
    r.appendChild(this.chatBtn);
  }
  r.appendChild(btn('help', 'Kılavuz', function () { if (self.o.onHelp) self.o.onHelp('bid'); }));
  this.sndBtn = btn(BR.S.sfx ? 'sound' : 'mute', 'Ses', function () {
    BR.S.sfx = !BR.S.sfx; BR.saveSettings(); self.sndBtn.innerHTML = ''; self.sndBtn.appendChild(BR.ic(BR.S.sfx ? 'sound' : 'mute'));
  });
  r.appendChild(this.sndBtn);
  r.appendChild(btn('gear', 'Ayarlar', function () { if (self.o.onSettings) self.o.onSettings(); }));
  if (BR.canFs()) r.appendChild(btn(BR.isFs() ? 'shrink' : 'expand', 'Tam ekran', function () { BR.toggleFs(); }, { 'data-fs': '1' }));
};

GameUI.prototype.leave = function (where) {
  var self = this, c = this.ctrl;
  var go = function () { if (self.o.onExit) self.o.onExit(where); };
  if (!BR.S.confirmExit || this.ctrl.gameOver()) { go(); return; }
  var msg = c.isOnline ? 'Çıkarsan yerine bilgisayar oynar. Aynı odaya tekrar girersen koltuğuna dönersin.' : 'Oyun kaydedilir. Ana sayfadan kaldığın yerden devam edebilirsin.';
  BR.sheet(where === 'home' ? 'Ana menüye dön?' : 'Geri dön?', h('div', null, h('p', { class: 'note', text: msg })), {
    buttons: [{ text: 'Oyuna devam' }, { text: where === 'home' ? 'Ana menü' : 'Geri', cls: 'gold', fn: go }]
  });
};

/* ---------- Yerleşim ---------- */
GameUI.prototype.layout = function () {
  var app = BR.$('#app'), W = app.clientWidth, H = app.clientHeight, S = BR.S;
  var land = W > H * 1.05;
  document.body.classList.toggle('land', land);
  var fs = 16 * (S.uiscale / 100);
  var rw = Math.round(2.6 * fs + 0.55 * fs * 2), rh = Math.round(2.6 * fs + 0.9 * fs);
  var sf = BR.applySafe();
  var x = sf.l, y = sf.t, w = W - sf.l - sf.r, hh = H - sf.t - sf.b;
  if (land) { w -= rw; if (S.railpos !== 'right') x += rw; }
  else { y += rh; hh -= rh; }
  var st = this.stageEl.style;
  st.left = x + 'px'; st.top = y + 'px'; st.width = w + 'px'; st.height = hh + 'px';
  var rm = this.rim.style;
  rm.left = (x + 6) + 'px'; rm.top = (y + 6) + 'px'; rm.width = (w - 12) + 'px'; rm.height = (hh - 12) + 'px';
  var rs = Math.min(w, hh) * 0.78;
  this.ring.style.width = rs + 'px'; this.ring.style.height = rs + 'px';
  var size = { s: 0.88, m: 1, l: 1.12 }[S.cardsize] || 1;
  var cw = land ? Math.min(hh * 0.18, w / 13) : Math.min(w / 6.1, hh * 0.115);
  cw = BR.clamp(cw * size, 38, 92);
  this.G = { w: w, h: hh, cw: cw, land: land, x: x, y: y };
  this.stage.setSize(w, hh, cw);
};

/* ---------- Çizim ---------- */
GameUI.prototype.names = function () {
  var a = [], i;
  for (i = 0; i < this.ctrl.n; i++) a.push(this.ctrl.seatInfo(i).name);
  return a;
};
GameUI.prototype.onChange = function (ev, kind) {
  if (this.dead) return;
  var i, tr = null;
  if (this.holdT) this.releaseHold(true);       // yeni olay geldiyse bekleyen eli hemen bırak
  for (i = 0; i < ev.length; i++) if (ev[i].t === 'trick') tr = ev[i];
  if (tr && kind !== 'sync' && kind !== 'resync' && kind !== 'layout') {
    this.hold = { cards: tr.cards, winner: tr.winner };
    var self = this;
    this.holdT = setTimeout(function () { self.releaseHold(false); }, (BR.S.fastTrick ? 600 : 1100) * (BR.speedMul || 1));
  }
  this.render(ev, kind);
};
GameUI.prototype.releaseHold = function (silent) {
  var w = this.hold ? this.hold.winner : null;
  clearTimeout(this.holdT); this.holdT = null;
  this.hold = null;
  if (this.dead) return;
  this.sweepSeat = w;
  if (!silent) this.render([], 'layout');
  this.sweepSeat = null;
};
GameUI.prototype.render = function (ev, kind) {
  var c = this.ctrl, v = c.view();
  if (!v || !this.G) return;
  var me = c.seat;
  if (me === undefined || me === null) return;
  var X = { G: this.G, me: me, ev: ev, names: this.names(), sel: this.sel, fresh: kind === 'start' && !this.o.noDeal, hold: this.hold, sweep: this.sweepSeat };
  this.v = v;
  if (v.phase !== 'play' || v.turn !== me) X.sel = null;
  if (v.phase === 'handEnd' || v.phase === 'gameEnd') X.sel = null;
  var sc = BR.scenes.bric(v, X);
  this.scene = sc;
  this.stage.render(sc.items, { exit: sc.exit });
  this.renderOverlay(sc, v);
  this.sounds(ev, v, kind);
  if (kind !== 'layout') this.floats(ev, v);
  if (v.turn === me && v.phase === 'play' && this.lastTurn !== me && kind !== 'start' && kind !== 'resync' && kind !== 'layout' && kind !== 'presence') { BR.sfx('turn', 0.25); BR.vib(25); }
  if (kind !== 'layout' && kind !== 'sync' && kind !== 'presence') this.lastTurn = v.phase === 'play' ? v.turn : -1;
  this.autoSingle(v, kind);
  this.checkEnd(v, ev, kind);
};

/* Tek geçerli kart varsa kendiliğinden oyna */
GameUI.prototype.autoSingle = function (v, kind) {
  var self = this, me = this.ctrl.seat;
  if (!BR.S.autoSingle || v.phase !== 'play' || v.stage !== 'card' || v.turn !== me || !v.playable || v.playable.length !== 1) return;
  if (this.hold) return;
  var key = v.deal + ':' + v.nTricks + ':' + v.trick.length + ':' + v.to;
  if (this.autoKey === key) return;
  this.autoKey = key;
  var card = v.playable[0];
  setTimeout(function () {
    if (self.dead || self.hold) { self.autoKey = ''; return; }
    var nv = self.ctrl.view();
    if (!nv || nv.phase !== 'play' || nv.turn !== me || nv.stage !== 'card' || nv.playable.length !== 1 || nv.playable[0] !== card) return;
    self.send({ t: 'play', c: card });
  }, 750 * (BR.speedMul || 1));
};

GameUI.prototype.renderOverlay = function (sc, v) {
  var G = this.G, me = this.ctrl.seat, s, i;
  var focus = v.stage === 'bid' ? v.turn : v.to;
  // koltuk rozetleri
  for (s = 0; s < 4; s++) {
    var L = sc.L[s], info = this.ctrl.seatInfo(s), el = this.seatEls[s];
    if (!el) {
      el = this.seatEls[s] = { root: h('div', { class: 'seat' + (s === me ? ' me' : '') }), av: h('div', { class: 'av' }), nm: h('div', { class: 'nm' }), sc: h('div', { class: 'sc' }), tm: h('div', { class: 'timer' }) };
      el.tmi = h('i'); el.tm.appendChild(el.tmi);
      el.root.appendChild(el.av); el.root.appendChild(h('div', null, el.nm, el.sc));
      el.root.appendChild(el.tm);
      this.ov.appendChild(el.root);
    }
    el.av.textContent = info.av;
    el.root.classList.toggle('away', !!info.away);
    el.root.classList.toggle('vul', !!v.vul[s % 2]);
    el.nm.textContent = info.name + (s === me ? ' (sen)' : (s === (me + 2) % 4 ? ' · ortağın' : ''));
    var sub = sc.sub(s);
    if (s === me && v.stage === 'bid' && BR.S.showBidHelp && v.hand.length) sub = hcp(v.hand) + ' puan · ' + B.SEATN[s];
    el.sc.textContent = sub;
    el.root.classList.toggle('turn', v.phase === 'play' && focus === s && !this.hold);
    el.root.style.left = L.bx + 'px'; el.root.style.top = L.by + 'px';
    el.root.style.display = '';
    el.tm.style.display = 'none';
  }
  // durum satırı
  var turnMe = v.phase === 'play' && v.turn === me;
  this.say.textContent = this.hold ? '' : (sc.say || '');
  this.say.style.display = (sc.say && !this.hold) ? '' : 'none';
  this.say.classList.toggle('me', turnMe);
  if (G.land) { this.say.style.left = (G.w - 80) + 'px'; this.say.style.top = (G.h - 24) + 'px'; this.say.style.transform = 'translate(-50%,-50%)'; this.say.style.maxWidth = '140px'; this.say.style.fontSize = '.8rem'; }
  else { this.say.style.transform = ''; this.say.style.left = '50%'; this.say.style.maxWidth = '70%'; this.say.style.fontSize = ''; this.say.style.top = (sc.handTop - 26 - 6) + 'px'; this.say.style.marginLeft = '5.2rem'; this.say.style.marginLeft = '0'; if (true) { this.say.style.left = (G.w - 8 - Math.min(150, G.w * 0.36) / 2) + 'px'; this.say.style.maxWidth = Math.min(150, G.w * 0.36) + 'px'; this.say.style.fontSize = '.78rem'; } }
  // bilgi tabelaları
  this.renderPlates(sc, v);
  // ihale kutusu
  this.renderBid(sc, v);
  // oyunu bota bırak düğmesi
  var isDecl = v.stage === 'card' && v.declarer === me && v.phase === 'play';
  this.autoBtn.style.display = isDecl ? '' : 'none';
  this.autoBtn.classList.toggle('on', !!(v.auto && v.auto[me]));
  this.hintBtn.style.display = BR.S.hints ? '' : 'none';
};

GameUI.prototype.mySideName = function (side) { return side === this.ctrl.seat % 2 ? 'Biz' : 'Onlar'; };
GameUI.prototype.renderPlates = function (sc, v) {
  var me = this.ctrl.seat, mine = me % 2, G = this.G, names = this.names();
  var pl = this.plateL, pr = this.plateR;
  var vulTxt = v.vul[mine] && v.vul[1 - mine] ? 'İkimiz de riskte' : v.vul[mine] ? 'Biz riskteyiz' : v.vul[1 - mine] ? 'Onlar riskte' : 'Risk yok';
  var html = '';
  if (v.stage === 'card' && v.contract) {
    var ct = v.contract, tk = v.tricks;
    html = '<div class="pt">Sözleşme</div><div class="pb">' + ctText(ct) + '</div>' +
      '<div class="ps">' + names[ct.declarer].slice(0, 8) + ' · ' + (6 + ct.level) + ' löve</div>';
  } else if (v.stage === 'bid') {
    html = '<div class="pt">Dağıtıcı</div><div class="pb sm">' + B.SEATN[v.dealer] + '</div><div class="ps">' + vulTxt + '</div>';
  }
  pl.innerHTML = html; pl.style.display = html && v.phase === 'play' ? '' : 'none';
  var rt = '<div class="pt">El ' + Math.min(v.deal, v.deals) + ' / ' + v.deals + '</div><div class="ps">Biz <b>' + v.scores[mine] + '</b> · Onlar <b>' + v.scores[1 - mine] + '</b></div>';
  if (v.stage === 'card' && v.contract) rt += '<div class="ps">Löve <b>' + v.tricks[mine] + '</b> – <b>' + v.tricks[1 - mine] + '</b></div>';
  pr.innerHTML = rt; pr.style.display = v.phase === 'play' ? '' : 'none';
};

/* ---------- İhale: tablo + kutu ---------- */
GameUI.prototype.renderBid = function (sc, v) {
  var self = this, me = this.ctrl.seat, G = this.G, el = this.bidEl;
  var on = v.stage === 'bid' && v.phase === 'play';
  if (!on) { el.style.display = 'none'; el.innerHTML = ''; this.bidKey = ''; return; }
  var turnMe = v.turn === me;
  var mn = turnMe && v.bidInfo ? v.bidInfo.min : 40;
  var key = v.auction.length + ':' + turnMe + ':' + mn + ':' + (this.lvl || 0) + ':' + (this.hintBid == null ? '' : this.hintBid) + ':' + G.w + 'x' + G.h;
  el.style.display = '';
  var land = G.land;
  var top = sc.topEnd + (land ? 26 : 48), bottom = sc.handTop - (land ? 6 : 62);
  el.style.left = (land ? 58 : 56) + 'px'; el.style.right = (land ? 58 : 56) + 'px';
  el.style.top = top + 'px'; el.style.height = Math.max(120, bottom - top) + 'px';
  el.classList.toggle('land', !!land);
  if (this.bidKey === key) return;
  this.bidKey = key;
  BR.clear(el);
  // --- ihale tablosu ---
  var tbl = h('div', { class: 'auc' });
  var head = h('div', { class: 'ah' });
  var order = [0, 1, 2, 3], k;
  order.forEach(function (sx) {
    var nm = B.SEATN[sx];
    head.appendChild(h('div', { class: 'c' + (v.vul[sx % 2] ? ' vul' : '') + (sx === me ? ' me' : '') + (sx === (me + 2) % 4 ? ' pt2' : '') }, nm.charAt(0) + nm.slice(1, 3)));
  });
  tbl.appendChild(head);
  var body = h('div', { class: 'ab' });
  var cells = [], pad = v.dealer;
  for (k = 0; k < pad; k++) cells.push(h('div', { class: 'c emp' }, ''));
  v.auction.forEach(function (a) { var c = h('div', { class: 'c' + (a.s === me ? ' me' : '') }); c.innerHTML = bidHTML(a.b); cells.push(c); });
  if (v.turn >= 0) { var cur = h('div', { class: 'c now' + (turnMe ? ' me' : '') }, turnMe ? '?' : '…'); cells.push(cur); }
  cells.forEach(function (c) { body.appendChild(c); });
  tbl.appendChild(body);
  tbl.appendChild(h('div', { class: 'al', text: 'Sıra: ' + B.SEATN[v.turn] + (v.dealer === v.turn && !v.auction.length ? ' (dağıtıcı)' : '') }));
  el.appendChild(tbl);
  setTimeout(function () { body.scrollTop = body.scrollHeight; }, 0);
  // --- ihale kutusu ---
  var box = h('div', { class: 'bbox' + (turnMe ? '' : ' off') });
  var lb = B.lastBid(v.auction);
  var minLevel = turnMe ? Math.max(1, Math.ceil(mn / 5)) : 1;
  if (turnMe && (!this.lvl || this.lvl < minLevel || this.lvl > 7)) this.lvl = minLevel;
  var lvl = this.lvl || minLevel;
  var hintB = this.hintBid;
  var lrow = h('div', { class: 'lv' });
  for (k = 1; k <= 7; k++) (function (L) {
    var dis = !turnMe || L * 5 + 4 < mn;
    var b = h('button', { class: 'b' + (L === lvl ? ' on' : '') + (dis ? ' dis' : '') + (hintB != null && hintB >= 5 && B.bidLevel(hintB) === L ? ' hint' : ''), text: String(L), onclick: function () { if (dis) return; BR.sfx('click'); self.lvl = L; self.bidKey = ''; self.renderBid(self.scene, self.v); } });
    lrow.appendChild(b);
  })(k);
  box.appendChild(lrow);
  var drow = h('div', { class: 'dn' });
  [3, 2, 1, 0, 4].forEach(function (d) {
    var val = lvl * 5 + d, dis = !turnMe || val < mn;
    var b = h('button', { class: 'b d' + d + (dis ? ' dis' : '') + (hintB === val ? ' hint' : '') });
    b.innerHTML = d === 4 ? 'SA' : suitHTML(B.DEN2SUIT[d]);
    b.addEventListener('click', function () { if (dis) return; self.placeBid(val); });
    drow.appendChild(b);
  });
  box.appendChild(drow);
  var arow = h('div', { class: 'ac' });
  var canX = turnMe && v.bidInfo && v.bidInfo.canX, canR = turnMe && v.bidInfo && v.bidInfo.canR;
  arow.appendChild(h('button', { class: 'b pas' + (!turnMe ? ' dis' : '') + (hintB === 'P' ? ' hint' : ''), text: 'Pas', onclick: function () { if (turnMe) self.placeBid('P'); } }));
  arow.appendChild(h('button', { class: 'b x' + (canX ? '' : ' dis') + (hintB === 'X' ? ' hint' : ''), text: 'Kontra', onclick: function () { if (canX) self.placeBid('X'); } }));
  arow.appendChild(h('button', { class: 'b x' + (canR ? '' : ' dis') + (hintB === 'R' ? ' hint' : ''), text: 'Rekontra', onclick: function () { if (canR) self.placeBid('R'); } }));
  box.appendChild(arow);
  el.appendChild(box);
};
GameUI.prototype.placeBid = function (b) {
  var v = this.v; if (!v || v.stage !== 'bid' || v.turn !== this.ctrl.seat) return;
  this.hintBid = null; this.bidKey = '';
  BR.sfx('bid');
  var ok = this.ctrl.act({ t: 'bid', b: b });
  if (ok === false) { BR.sfx('bad'); this.render([], 'layout'); }
};

/* ---------- İpucu ---------- */
GameUI.prototype.hint = function () {
  var v = this.v, me = this.ctrl.seat;
  if (!v || v.phase !== 'play' || v.turn !== me) { BR.toast('İpucu için sıranın sende olması gerekir', '', 1600); return; }
  try {
    if (v.stage === 'bid') {
      var b = BR.bid.choose(v, 'hard');
      this.hintBid = b; this.bidKey = '';
      if (typeof b === 'number') this.lvl = B.bidLevel(b);
      var why = b === 'P' ? 'Pas demen önerilir' : b === 'X' ? 'Kontra önerilir' : b === 'R' ? 'Rekontra önerilir' : 'Öneri: ' + B.bidText(b);
      BR.toast(why, 'gold', 2600);
      this.render([], 'layout');
    } else {
      var c = BR.play.choose(v, 'hard');
      if (c === null || c === undefined) return;
      this.sel = 'c' + c;
      BR.toast('Öneri: ' + BR.cardName(c), 'gold', 2600);
      this.render([], 'layout');
    }
  } catch (e) { BR.toast('Şu an öneri yok', '', 1400); }
};
GameUI.prototype.toggleAuto = function () {
  var v = this.v, me = this.ctrl.seat;
  if (!v || v.stage !== 'card' || v.declarer !== me) return;
  var on = !(v.auto && v.auto[me]);
  this.ctrl.act({ t: 'auto', on: on });
  BR.toast(on ? 'Bilgisayar senin yerine oynuyor' : 'Oyun sende', 'gold', 1800);
};

/* ---------- Ses ve yüzen yazılar ---------- */
GameUI.prototype.sounds = function (ev, v, kind) {
  if (kind === 'layout' || kind === 'sync' || kind === 'resync' || kind === 'presence') return;
  var i, me = this.ctrl.seat;
  for (i = 0; i < ev.length; i++) {
    var e = ev[i];
    if (e.t === 'newHand' || e.t === 'deal') { var k; for (k = 0; k < 5; k++) BR.sfx('deal', k * 0.09); }
    else if (e.t === 'bid') { if (e.seat !== me) BR.sfx('bid'); }
    else if (e.t === 'play') BR.sfx(e.by === me || e.seat === me ? 'place' : 'flip');
    else if (e.t === 'trick') BR.sfx('trick', 0.35);
    else if (e.t === 'contract') BR.sfx('contract');
    else if (e.t === 'dummy') BR.sfx('flip', 0.1);
  }
};
GameUI.prototype.floatAt = function (text, x, y) {
  var f = h('div', { class: 'float', text: text, style: { left: x + 'px', top: y + 'px' } });
  this.ov.appendChild(f);
  setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1900);
};
GameUI.prototype.floats = function (ev, v) {
  var i, G = this.G, names = this.names();
  for (i = 0; i < ev.length; i++) {
    var e = ev[i];
    if (e.t === 'contract' && e.contract) {
      var d = B.bidDen(e.contract.v), t = e.contract.level + (d === 4 ? ' SA' : ' ' + SUITCH[B.DEN2SUIT[d]]) + (e.contract.dbl === 2 ? ' ✕✕' : e.contract.dbl === 1 ? ' ✕' : '');
      this.floatAt(t + ' · ' + names[e.declarer], G.w / 2, this.scene ? this.scene.cy : G.h * 0.4);
    } else if (e.t === 'handEnd' && v.last && v.last.pass) {
      this.floatAt('Herkes pas', G.w / 2, G.h * 0.4);
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
      self.stage.place(el, { x: it.x + dx * 0.3, y: it.y, rot: 0, sc: (it.sc || 1) * 1.05, z: 300, lift: Math.max(0, dy) });
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
  if (!it || this.hold) return;
  if (v.phase !== 'play' || v.stage !== 'card') return;
  if (v.turn !== me) {
    this.sel = this.sel === k ? null : k; BR.sfx('click'); this.render([], 'layout');
    if (!this.warnT || Date.now() - this.warnT > 2500) { this.warnT = Date.now(); BR.toast('Sıra sende değil', '', 1200); }
    return;
  }
  if (!it.act) { this.cantPlay(it); return; }
  if (BR.S.tap1 || this.sel === k) this.tryPlay(k);
  else { this.sel = k; BR.sfx('click'); this.render([], 'layout'); }
};
GameUI.prototype.cantPlay = function (it) {
  BR.sfx('bad'); BR.vib(30);
  var v = this.v, me = this.ctrl.seat;
  var ownerHand = v.to === me ? v.hand : v.dummyHand;
  if (it && v.to === me && it.c !== undefined && v.trick.length) BR.toast('Açılan renge uymalısın: ' + BR.SUITN[suit(v.trick[0].c)], 'bad', 1800);
  else if (v.to !== me && v.declarer === me && it && v.hand.indexOf(it.c) >= 0) BR.toast('Şimdi açık eli oynuyorsun', 'bad', 1600);
  else if (v.to === v.dummy && v.dummy === me) BR.toast('Açık elsin; oyunu ortağın oynar', 'bad', 1600);
  else if (v.trick.length) BR.toast('Açılan renge uymalısın: ' + BR.SUITN[suit(v.trick[0].c)], 'bad', 1800);
  else BR.toast('Bu kart oynanamaz', 'bad', 1400);
};
GameUI.prototype.tryPlay = function (k) {
  var it = this.itemOf(k), v = this.v, me = this.ctrl.seat;
  if (!it || v.phase !== 'play' || v.turn !== me || !it.act || this.hold) { this.sel = null; this.render([], 'layout'); return; }
  this.send({ t: 'play', c: it.c });
};
GameUI.prototype.send = function (a) {
  this.sel = null; this.hintBid = null;
  var ok = this.ctrl.act(a);
  if (ok === false) { BR.sfx('bad'); this.render([], 'layout'); }
};

/* ---------- Mesajlaşma ---------- */
var QUICK = ['Merhaba 👋', 'Güzel oyun!', 'Tüh be 😅', 'Bir dakika…', 'Hadi hadi', 'Teşekkürler', 'Güzel ihale 👏', 'Ne yaptın ya 😂', '😮', '🔥', '👍', '❤️'];
GameUI.prototype.chatSheet = function () {
  var self = this, sh;
  var bar = h('div', { class: 'chatbar' });
  QUICK.forEach(function (q) { bar.appendChild(h('button', { text: q, onclick: function () { sh.close(); self.ctrl.chat(q); self.showChat(self.ctrl.seat, q); BR.sfx('pop'); } })); });
  sh = BR.sheet('Mesaj gönder', bar);
};
GameUI.prototype.showChat = function (seat, text) {
  if (this.dead || !this.scene) return;
  var L = this.scene.L[seat]; if (!L) return;
  var e = h('div', { class: 'emo', text: text, style: { left: Math.max(60, Math.min(this.G.w - 60, L.bx)) + 'px', top: (L.by + (seat === this.ctrl.seat ? -34 : 36)) + 'px' } });
  this.ov.appendChild(e);
  BR.sfx('pop');
  setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 3300);
};

/* ---------- Puan tablosu (Chicago) ---------- */
GameUI.prototype.sideNames = function () {
  var n = this.names(), me = this.ctrl.seat;
  return { mine: n[me] + ' & ' + n[(me + 2) % 4], theirs: n[(me + 1) % 4] + ' & ' + n[(me + 3) % 4] };
};
GameUI.prototype.resultText = function (r) {
  if (r.pass) return 'Herkes pas';
  var d = B.bidDen(r.contract ? r.contract.v : r.v);
  return '';
};
GameUI.prototype.histRows = function (v) {
  var me = this.ctrl.seat, mine = me % 2, rows = [], names = this.names();
  var i, run = [0, 0];
  for (i = 0; i < v.hist.length; i++) {
    var x = v.hist[i], res, ct = '';
    if (x.pass) { res = '–'; ct = 'Pas'; }
    else {
      var d = B.bidDen(x.v), lv = B.bidLevel(x.v);
      ct = lv + (d === 4 ? 'SA' : SUITCH[B.DEN2SUIT[d]]) + (x.x === 2 ? '✕✕' : x.x === 1 ? '✕' : '') + ' ' + names[x.by].slice(0, 6);
      var need = 6 + lv, diff = x.t - need;
      res = diff >= 0 ? (diff ? '+' + diff : '=') : String(diff);
    }
    run[0] += x.ns; run[1] += x.ew;
    rows.push({ n: x.d, ct: ct, res: res, a: mine === 0 ? x.ns : x.ew, b: mine === 0 ? x.ew : x.ns });
  }
  return rows;
};
GameUI.prototype.scoreTable = function (v) {
  var me = this.ctrl.seat, mine = me % 2, rows = this.histRows(v);
  var t = h('table', { class: 'tbl sc' }), tr = h('tr');
  ['El', 'Sözleşme', 'Sonuç', 'Biz', 'Onlar'].forEach(function (x) { tr.appendChild(h('th', { text: x })); });
  t.appendChild(tr);
  rows.forEach(function (r) {
    var q = h('tr');
    q.appendChild(h('td', { text: String(r.n) }));
    q.appendChild(h('td', { text: r.ct }));
    q.appendChild(h('td', { text: r.res }));
    q.appendChild(h('td', { text: r.a ? String(r.a) : '' }));
    q.appendChild(h('td', { text: r.b ? String(r.b) : '' }));
    t.appendChild(q);
  });
  var tot = h('tr', { class: 'me' });
  tot.appendChild(h('td', { text: 'Toplam' })); tot.appendChild(h('td', { text: '' })); tot.appendChild(h('td', { text: '' }));
  tot.appendChild(h('td', { text: String(v.scores[mine]) })); tot.appendChild(h('td', { text: String(v.scores[1 - mine]) }));
  t.appendChild(tot);
  return t;
};
GameUI.prototype.scoreSheet = function (fin) {
  var v = this.v; if (!v) return null;
  var sn = this.sideNames();
  var info = h('div', { class: 'note', style: { textAlign: 'center' } }, 'Biz: ' + sn.mine, h('br'), 'Onlar: ' + sn.theirs, h('br'), 'El ' + Math.min(v.deal, v.deals) + ' / ' + v.deals);
  return BR.sheet(fin ? 'Oyun bitti' : 'Puan tablosu', h('div', null, info, this.scoreTable(v)), {});
};

/* ---------- El sonu ---------- */
GameUI.prototype.handsDiagram = function (L) {
  var names = this.names(), me = this.ctrl.seat;
  function box(s) {
    var d = h('div', { class: 'hd' + (s === L.contract && false ? '' : '') });
    d.appendChild(h('div', { class: 'hn', text: names[s] + ' · ' + B.SEATN[s] + (L.contract && L.contract.declarer === s ? ' (oyun sahibi)' : '') }));
    var hand = B.sort(L.hands[s]), su;
    for (su = 0; su < 4; su++) {
      var cs = hand.filter(function (c) { return suit(c) === su; });
      var row = h('div', { class: 'hr' }); row.innerHTML = suitHTML(su) + ' <span>' + (cs.map(function (c) { return BR.RN[rank(c)]; }).join(' ') || '–') + '</span>';
      d.appendChild(row);
    }
    return d;
  }
  // gözün altı: ben altta olacak biçimde diz
  var rel = function (r) { return (me + r) % 4; };
  var g = h('div', { class: 'diag' });
  g.appendChild(h('div', { class: 'dt' }, box(rel(2))));
  g.appendChild(h('div', { class: 'dl' }, box(rel(1))));
  g.appendChild(h('div', { class: 'dr' }, box(rel(3))));
  g.appendChild(h('div', { class: 'db' }, box(rel(0))));
  return g;
};
GameUI.prototype.handSummary = function (v) {
  var L = v.last, me = this.ctrl.seat, mine = me % 2, names = this.names();
  var box = h('div');
  if (!L) return box;
  if (L.pass) { box.appendChild(h('div', { class: 'note', style: { textAlign: 'center', fontSize: '1rem' }, text: 'Herkes pas dedi, bu el oynanmadı.' })); return box; }
  var ct = L.contract, us = ct.side === mine;
  var d = h('div', { class: 'res' });
  d.innerHTML = '<div class="rc">' + ctText(ct) + ' <small>' + names[ct.declarer] + (L.declVul ? ' · riskte' : '') + '</small></div>' +
    '<div class="rr ' + (L.made ? 'ok' : 'no') + '">' + (L.made ? (L.over ? 'Yaptı +' + L.over : 'Tam yaptı') : L.under + ' löve düştü') + '</div>' +
    '<div class="rs">' + (6 + ct.level) + ' löve gerekiyordu, ' + L.taken + ' löve alındı</div>';
  box.appendChild(d);
  var p = L.parts, items = [];
  if (L.made) {
    if (p.contract) items.push(['Sözleşme', p.contract]);
    if (p.over) items.push(['Fazla löveler', p.over]);
    if (p.bonus) items.push([p.bonus >= 300 ? 'Manche primi' : 'Parça prim', p.bonus]);
    if (p.slam) items.push([ct.level === 7 ? 'Büyük slam' : 'Küçük slam', p.slam]);
    if (p.insult) items.push(['Kontra primi', p.insult]);
  } else if (p.under) items.push(['Düşen löveler', -p.under]);
  var tb = h('table', { class: 'tbl' });
  items.forEach(function (x) { tb.appendChild(h('tr', null, h('td', { text: x[0] }), h('td', { text: (x[1] > 0 ? '+' : '') + x[1], style: { textAlign: 'right' } }))); });
  box.appendChild(tb);
  var gain = L.ns + L.ew, wonByUs = (mine === 0 ? L.ns : L.ew) > 0;
  box.appendChild(h('div', { class: 'big', style: { fontSize: '1.2rem', margin: '.5rem 0' }, text: (wonByUs ? 'Biz +' : 'Onlar +') + gain }));
  return box;
};
GameUI.prototype.checkEnd = function (v, ev, kind) {
  var self = this;
  if (v.phase === 'play') { this.shownEnd = false; this.endPlayed = false; if (this.endSheet) { this.endSheet.close(true); this.endSheet = null; } return; }
  if (this.shownEnd || kind === 'layout') return;
  if (v.phase !== 'handEnd' && v.phase !== 'gameEnd') return;
  this.shownEnd = true;
  var delay = (ev && ev.length ? 2000 : 200) * (BR.speedMul || 1);
  setTimeout(function () { if (!self.dead) self.endView(); }, delay);
};
GameUI.prototype.endView = function () {
  var v = this.v, self = this, me = this.ctrl.seat, mine = me % 2;
  if (!v || (v.phase !== 'handEnd' && v.phase !== 'gameEnd')) return;
  var fin = v.over || v.phase === 'gameEnd';
  var body = h('div', null), won = false;
  if (fin) {
    var w = v.winner;
    won = w === mine;
    var title = w < 0 ? 'Berabere' : (won ? 'Tebrikler, kazandınız!' : 'Rakipler kazandı');
    body.appendChild(h('div', { class: 'big', text: title }));
    var sn = this.sideNames();
    body.appendChild(h('div', { class: 'note', style: { textAlign: 'center', fontSize: '.95rem' }, text: 'Biz ' + v.scores[mine] + ' · Onlar ' + v.scores[1 - mine] }));
    if (!this.endPlayed) { this.endPlayed = true; BR.sfx(won ? 'win' : 'lose'); }
  } else {
    body.appendChild(h('div', { class: 'big', text: 'El ' + v.deal + ' bitti' }));
  }
  body.appendChild(this.handSummary(v));
  if (v.last && v.last.hands) {
    body.appendChild(h('div', { class: 'grp', text: 'Eller' }));
    body.appendChild(this.handsDiagram(v.last));
    if (v.last.auction && v.last.auction.length) {
      body.appendChild(h('div', { class: 'grp', text: 'İhale' }));
      var au = h('div', { class: 'auline' }), ph = '';
      v.last.auction.forEach(function (a) { ph += '<span class="ai"><i>' + B.SEATN[a.s].slice(0, 2) + '</i>' + bidHTML(a.b) + '</span>'; });
      au.innerHTML = ph; body.appendChild(au);
    }
  }
  body.appendChild(h('div', { class: 'grp', text: 'Puan tablosu' }));
  body.appendChild(this.scoreTable(v));
  var buttons;
  if (fin) buttons = [{ text: 'Ana menü', fn: function () { self.o.onExit('home'); } }, { text: 'Yeni oyun', cls: 'gold', fn: function () { self.o.onExit('again'); } }];
  else buttons = [{ text: 'Sonraki el', cls: 'gold', id: 'nx', keep: true, fn: function (api) { self.ctrl.ready(); api.nx.textContent = 'Diğerleri bekleniyor…'; api.nx.classList.add('dis'); return false; } }];
  if (this.endSheet) this.endSheet.close(true);
  this.endSheet = BR.sheet(fin ? 'Sonuç' : 'El sonucu', body, { noclose: true, sticky: true, buttons: buttons, wide: true });
};

GameUI.prototype.pulse = function () {
  if (this.dead) return;
  var c = this.ctrl, v = this.v;
  if (!v) return;
  var dl = c.deadline ? c.deadline() : 0, tt = c.turnTime ? c.turnTime() : 0, k;
  for (k in this.seatEls) this.seatEls[k].tm.style.display = 'none';
  var tseat = v.stage === 'bid' ? v.turn : v.turn;
  if (dl && tt && v.phase === 'play' && this.seatEls[tseat]) {
    var el = this.seatEls[tseat], rem = Math.max(0, dl - Date.now());
    el.tm.style.display = ''; el.tmi.style.transform = 'scaleX(' + Math.min(1, rem / (tt * 1000)) + ')';
    if (rem < 5000 && v.turn === c.seat && !this.warned) { this.warned = true; BR.sfx('bad'); } else if (rem > 6000) this.warned = false;
  }
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

GameUI.prototype.destroy = function () {
  this.dead = true;
  clearInterval(this.tick); clearTimeout(this.holdT);
  this.stage.clear();
  if (this.endSheet) this.endSheet.close(true);
  BR.onLayout = null;
  BR.clear(this.root);
};

if (typeof module !== 'undefined' && module.exports) module.exports = GameUI;
})(typeof window !== 'undefined' ? window : globalThis);
