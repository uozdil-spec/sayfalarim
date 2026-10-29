/* Okey — masa ekranı: taşlar, istaka, sürükle-bırak, animasyonlar, el sonucu. */
(function () {
'use strict';
var OK = window.OK, E = window.OkeyEngine, AI = window.OkeyAI, Table = window.OkeyTable;
var h = OK.h, $ = OK.$, clear = OK.clear, t = OK.t;
var G = OK.game = {};
var SLOTS = 30;

var st = {
  ctrl: null, kind: 'off', view: null, meta: null, me: 0, built: false,
  slots: [], tiles: {}, sel: -1, busy: false, handKey: '', lastTap: null,
  hint: -1, hintTimer: 0, resultTimer: 0, resultModal: null, resultKey: '', statKey: '',
  msgs: [], unread: 0, tick: 0, lastTurn: -1, pendingSlots: null, cols: 0, sortMode: '', level: 'medium', cfg: null, table: null
};
G.st = st;
for (var i0 = 0; i0 < SLOTS; i0++) st.slots.push(-1);

/* ================= Taş çizimi ================= */
function mkTile(id, ok, cls) {
  var d = h('div', { class: 'tile' + (cls ? ' ' + cls : '') });
  d.dataset.id = id;
  if (id >= 104) {
    d.classList.add('fake');
    d.appendChild(h('i', { class: 'star' }));
    d.appendChild(h('span', { class: 'tiny' }, 'OKEY'));
    return d;
  }
  var c = E.colorOf(id), n = E.numOf(id);
  d.classList.add('c' + c);
  if (ok && E.isJoker(id, ok)) d.classList.add('joker');
  d.appendChild(h('span', { class: 'n' + (n > 9 ? ' two' : '') }, n));
  d.appendChild(h('i', { class: 'd' }));
  return d;
}
function mkBack() { return h('div', { class: 'tile back' }); }
OK.mkTile = mkTile;

function vpOf(seat) { return (seat - st.me + 4) % 4; }       // ekrandaki konum: 0 alt, 1 sağ, 2 üst, 3 sol
function seatOf(vp) { return (st.me + vp) % 4; }
function nameOf(seat) {
  var m = st.meta, n = m && m.names ? m.names[seat] : '';
  if (seat === st.me && !n) return OK.S.name || t('you');
  return n || '?';
}
function sideNames(side) {
  var v = st.view, out = [];
  if (!v) return '';
  if (v.cfg.partner) { out = [side, side + 2]; } else out = [side];
  return out.map(function (s) { return s === st.me ? t('you') : nameOf(s); }).join(' + ');
}

/* ================= Kurulum ================= */
function build() {
  var g = clear($('#game'));
  st.built = true;
  var hud = h('div', { id: 'hud' },
    h('div', { class: 'grp' },
      h('button', { class: 'btn iconbtn', id: 'bMenu', 'aria-label': t('menu'), onclick: G.openMenu }, OK.icon('menu')),
      h('div', { id: 'info', onclick: G.openScores })),
    h('div', { class: 'grp' },
      OK.fsOK() ? h('button', { class: 'btn iconbtn', id: 'bFs', 'aria-label': t('fullscreen'), onclick: OK.fsToggle }, OK.icon(OK.isFs() ? 'shrink' : 'expand')) : null,
      h('button', { class: 'btn iconbtn', id: 'bSnd', onclick: function () { OK.S.sound = !OK.S.sound; OK.save(); renderSnd(); } }),
      h('button', { class: 'btn iconbtn', id: 'bChat', style: 'display:none', onclick: function () { OK.openChat(); } }, OK.icon('chat'), h('i', { class: 'dot', id: 'chatDot' }))));
  var felt = h('div', { id: 'felt' }, hud);
  [2, 3, 1].forEach(function (vp) {
    felt.appendChild(h('div', { class: 'seat s' + vp, id: 'seat' + vp },
      h('div', { class: 'plate' }, h('div', { class: 'av' }), h('div', null, h('div', { class: 'nm' }), h('div', { class: 'ct' })), h('div', { class: 'tm' }, h('i'))),
      h('div', { class: 'fan' })));
  });
  for (var vp = 0; vp < 4; vp++) {
    (function (vp) {
      felt.appendChild(h('div', { class: 'dp d' + vp, id: 'dp' + vp, onclick: function () { onPileTap(vp); } }));
    })(vp);
  }
  felt.appendChild(h('div', { id: 'center' },
    h('div', { id: 'pile', onclick: function () { onPileTap(-1); } }),
    h('div', { id: 'indic' }, h('div', { class: 'ind' }), h('div', { class: 'lb' }, t('indicator')), h('div', { class: 'okeychip' }))));
  felt.appendChild(h('div', { id: 'status' }));
  felt.appendChild(h('div', { id: 'mine' }, h('div', { class: 'plate' }, h('div', { class: 'av' }), h('div', null, h('div', { class: 'nm' }), h('div', { class: 'ct' })), h('div', { class: 'tm' }, h('i')))));
  g.appendChild(felt);

  var rack = h('div', { id: 'rack' });
  for (var i = 0; i < SLOTS; i++) rack.appendChild(h('div', { class: 'slot', 'data-i': i }));
  var left = h('div', { class: 'tools', id: 'toolsL' },
    h('button', { class: 'btn', id: 'bSort', onclick: toggleSortPop }, OK.icon('sort'), h('span', null, t('sort'))),
    h('button', { class: 'btn', id: 'bHint', onclick: showHint }, OK.icon('bulb'), h('span', null, t('hint'))));
  var right = h('div', { class: 'tools', id: 'toolsR' },
    h('button', { class: 'btn', id: 'bUndo', onclick: doUndo }, OK.icon('undo'), h('span', null, t('undo'))),
    h('button', { class: 'btn gold fin', id: 'bFin', onclick: onFinishBtn }, OK.icon('flag'), h('span', null, t('finish'))));
  g.appendChild(h('div', { id: 'rackbar' }, left, rack, right));
  g.appendChild(h('div', { id: 'sortpop', style: 'display:none;position:absolute;z-index:40' }));
  initRackEvents(rack);
  initSourceDrag();
  OK.layout();
  renderSnd();
}
function renderSnd() {
  var b = $('#bSnd'); if (!b) return;
  clear(b); b.appendChild(OK.icon(OK.S.sound ? 'sound' : 'mute'));
}

/* ================= Istaka mantığı ================= */
function rackEl() { return $('#rack'); }
function slotEl(i) { return rackEl().children[i]; }
function cols() { return OK.dim ? OK.dim.cols : 15; }
function rowsN() { return OK.dim ? OK.dim.rows : 2; }

function tileEl(id) {
  var e = st.tiles[id];
  if (!e) { e = mkTile(id, st.view && st.view.ok); st.tiles[id] = e; }
  return e;
}
function sortKey(id, ok, mode) {
  var c, n;
  if (id >= 104) { c = ok.color; n = ok.num; } else { c = E.colorOf(id); n = E.numOf(id); }
  return mode === 'group' ? n * 10 + c : c * 100 + n;
}
function orderTiles(ids, mode) {
  var ok = st.view.ok;
  return ids.slice().sort(function (a, b) { return sortKey(a, ok, mode) - sortKey(b, ok, mode) || a - b; });
}
/* gruplar (diziler) halinde istakaya yerleştir; gruplar arasında bir boşluk */
function layoutGroups(groups) {
  var C = cols(), R = rowsN(), slots = [], i;
  for (i = 0; i < SLOTS; i++) slots.push(-1);
  var total = 0; groups.forEach(function (g) { total += g.length; });
  // iki satıra dengeli dağıt: ilk satır yaklaşık yarısı
  var half = Math.ceil(total / Math.min(R, 2)), row = 0, pos = 0, used = 0;
  groups.forEach(function (g) {
    if (!g.length) return;
    if (pos > 0 && pos + g.length > C) { row++; pos = 0; }
    else if (row === 0 && used >= half && R > 1 && pos > 0) { row++; pos = 0; }
    if (row >= R) { row = R - 1; }
    g.forEach(function (id) {
      if (pos >= C) { row = Math.min(R - 1, row + 1); pos = 0; }
      slots[row * C + pos] = id; pos++; used++;
    });
    pos++;   // boşluk
  });
  return slots;
}
function applySort(mode) {
  var v = st.view; if (!v) return;
  var hand = v.hand.slice(), groups;
  if (mode === 'run') {
    var ord = orderTiles(hand, 'run'), byc = [[], [], [], []];
    ord.forEach(function (id) { var c = id >= 104 ? v.ok.color : E.colorOf(id); byc[c].push(id); });
    groups = byc;
  } else if (mode === 'group') {
    var o2 = orderTiles(hand, 'group'), bn = {}, keys = [];
    o2.forEach(function (id) { var n = id >= 104 ? v.ok.num : E.numOf(id); if (!bn[n]) { bn[n] = []; keys.push(n); } bn[n].push(id); });
    groups = keys.map(function (k) { return bn[k]; });
  } else if (mode === 'smart') {
    var arr = E.smartArrange(hand, v.ok);
    groups = arr.sets.map(function (s) { return s.ids; });
    groups.push(orderTiles(arr.rest, 'run'));
  } else if (mode === 'pairs') {
    var pa = E.pairArrange(hand, v.ok);
    groups = pa.pairs.slice();
    groups.push(orderTiles(pa.rest, 'run'));
  } else {
    groups = [E.shuffle(hand.slice(), Math.random)];
  }
  flipRack(function () { st.slots = layoutGroups(groups); renderRack(true); });
  st.sortMode = mode;
  savePersist();
}
function initialLayout(hand) {
  var v = st.view;
  if (OK.S.startSort === 'sorted') {
    var ord = orderTiles(hand, 'run'), byc = [[], [], [], []];
    ord.forEach(function (id) { var c = id >= 104 ? v.ok.color : E.colorOf(id); byc[c].push(id); });
    st.slots = layoutGroups(byc);
  } else {
    st.slots = layoutGroups([E.shuffle(hand.slice(), Math.random)]);
  }
}
function lastIndex() { for (var i = SLOTS - 1; i >= 0; i--) if (st.slots[i] >= 0) return i; return -1; }
function nextFree() {
  var L = lastIndex(), i;
  for (i = L + 1; i < SLOTS; i++) if (st.slots[i] < 0) return i;
  for (i = 0; i < SLOTS; i++) if (st.slots[i] < 0) return i;
  return -1;
}
function syncRack(hand, fresh) {
  var present = {}, i, newly = [];
  for (i = 0; i < SLOTS; i++) {
    var id = st.slots[i];
    if (id >= 0) { if (hand.indexOf(id) < 0) { st.slots[i] = -1; } else present[id] = 1; }
  }
  hand.forEach(function (id) { if (!present[id]) { var k = (st.wantSlot !== undefined && st.wantSlot >= 0 && st.slots[st.wantSlot] < 0) ? st.wantSlot : nextFree(); st.wantSlot = undefined; if (k >= 0) { st.slots[k] = id; newly.push(id); } } });
  return newly;
}
function reflowCols() {
  // sütun sayısı değişti (ekran döndü / tam ekran): grupları koruyarak yeniden yerleştir;
  // kullanıcı bu arada dokunmadıysa eski diziliş aynen geri gelir
  var C = cols(), cur = JSON.stringify(st.slots);
  if (st.back && st.back.C === C && st.back.sig === cur) { st.slots = st.back.slots.slice(); st.back = null; return; }
  var oldC = st.cols || 15, groups = [], g0 = [], i;
  for (i = 0; i < SLOTS; i++) {
    var id = st.slots[i];
    if (id >= 0 && !(i % oldC === 0 && g0.length)) g0.push(id);
    else { if (g0.length) { groups.push(g0); g0 = []; } if (id >= 0) g0.push(id); }
  }
  if (g0.length) groups.push(g0);
  if (!groups.length) return;
  var before = st.slots.slice();
  st.slots = layoutGroups(groups);
  st.back = { C: oldC, slots: before, sig: JSON.stringify(st.slots) };
}
function renderRack(animate) {
  var rack = rackEl(); if (!rack || !st.view) return;
  var used = {};
  for (var i = 0; i < SLOTS; i++) {
    var id = st.slots[i], s = rack.children[i];
    if (id >= 0) {
      used[id] = 1;
      var te = tileEl(id);
      if (te.parentNode !== s) s.appendChild(te);
      te.classList.toggle('sel', st.sel === id);
      te.style.transform = '';
    } else while (s.firstChild) s.removeChild(s.firstChild);
  }
  for (var k in st.tiles) if (!used[k]) { var d = st.tiles[k]; if (d.parentNode) d.parentNode.removeChild(d); delete st.tiles[k]; }
}
/* FLIP: istaka yeniden düzenlenirken taşlar yumuşakça kayar */
function flipRack(change) {
  var before = {};
  if (OK.S.anim !== 'off' && !OK.S.lite) for (var id in st.tiles) { var el = st.tiles[id]; if (el.parentNode) before[id] = el.getBoundingClientRect(); }
  change();
  if (OK.S.anim === 'off' || OK.S.lite) return;
  for (var id2 in before) {
    var el2 = st.tiles[id2]; if (!el2 || !el2.animate) continue;
    var r = el2.getBoundingClientRect(), dx = before[id2].left - r.left, dy = before[id2].top - r.top;
    if (Math.abs(dx) + Math.abs(dy) < 2) continue;
    el2.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 220, easing: 'ease-out' });
  }
}
function moveTile(id, to) {
  var from = st.slots.indexOf(id), C = cols();
  if (from < 0 || from === to) return;
  flipRack(function () {
    if (st.slots[to] < 0) { st.slots[to] = id; st.slots[from] = -1; }
    else {
      var row = Math.floor(to / C), a = row * C, b = a + C - 1, k;
      if (Math.floor(from / C) === row) {
        st.slots[from] = -1;
        if (from < to) { for (k = from; k < to; k++) st.slots[k] = st.slots[k + 1]; }
        else { for (k = from; k > to; k--) st.slots[k] = st.slots[k - 1]; }
        st.slots[to] = id;
      } else {
        st.slots[from] = -1;
        var e = -1;
        for (k = to + 1; k <= b; k++) if (st.slots[k] < 0) { e = k; break; }
        if (e >= 0) { for (k = e; k > to; k--) st.slots[k] = st.slots[k - 1]; st.slots[to] = id; }
        else {
          for (k = to - 1; k >= a; k--) if (st.slots[k] < 0) { e = k; break; }
          if (e >= 0) { for (k = e; k < to; k++) st.slots[k] = st.slots[k + 1]; st.slots[to] = id; }
          else { var occ = st.slots[to]; st.slots[to] = id; st.slots[from] = occ; }
        }
      }
    }
    renderRack();
  });
  savePersist();
}

/* ================= Sürükle / dokun ================= */
var drag = null, sdrag = null;
function canDraw() { var v = st.view; return !!v && v.status === 'playing' && v.turn === st.me && v.phase === 'draw'; }
function canDiscard() { var v = st.view; return !!v && v.status === 'playing' && v.turn === st.me && v.phase === 'discard'; }

function initRackEvents(rack) {
  rack.addEventListener('pointerdown', function (e) {
    var te = e.target.closest ? e.target.closest('.tile') : null;
    if (!te || !rack.contains(te) || (e.button && e.button > 0)) return;
    if (drag) return;
    drag = { id: +te.dataset.id, el: te, x0: e.clientX, y0: e.clientY, moved: false, pid: e.pointerId, target: null };
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    e.preventDefault();
  });
}
function targetAt(x, y) {
  var el = document.elementFromPoint(x, y);
  if (!el) return null;
  var s = el.closest ? el.closest('.slot') : null;
  if (s && rackEl().contains(s)) return { type: 'slot', i: +s.dataset.i, el: s };
  var d0 = el.closest ? el.closest('#dp0') : null;
  if (d0) return { type: 'discard', el: d0 };
  var ind = el.closest ? el.closest('#indic') : null;
  if (ind) return { type: 'finish', el: ind };
  return null;
}
function clearHover() {
  var hs = document.querySelectorAll('.slot.hover, .over');
  for (var i = 0; i < hs.length; i++) hs[i].classList.remove('hover', 'over');
}
/* Desteden ya da soldaki atılan taştan sürükleyerek çekme */
function initSourceDrag() {
  var felt = $('#felt');
  felt.addEventListener('pointerdown', function (e) {
    if (drag || sdrag || !canDraw() || (e.button && e.button > 0)) return;
    var from = null, el = e.target.closest ? e.target.closest('#pile, #dp3') : null;
    if (!el) return;
    if (el.id === 'pile') { if (!st.view.pile) return; from = 'pile'; }
    else { if (!el.lastChild || !el.lastChild.classList || !el.lastChild.classList.contains('tile')) return; from = 'discard'; }
    sdrag = { from: from, el: el, x0: e.clientX, y0: e.clientY, pid: e.pointerId, moved: false, ghost: null, target: null };
    document.addEventListener('pointermove', onSMove, { passive: false });
    document.addEventListener('pointerup', onSUp);
    document.addEventListener('pointercancel', onSUp);
  });
}
function onSMove(e) {
  if (!sdrag || e.pointerId !== sdrag.pid) return;
  var dx = e.clientX - sdrag.x0, dy = e.clientY - sdrag.y0;
  if (!sdrag.moved && Math.hypot(dx, dy) > 9) {
    sdrag.moved = true;
    var src = sdrag.from === 'pile' ? sdrag.el : sdrag.el.lastChild, r = src.getBoundingClientRect();
    var gh = sdrag.from === 'pile' ? mkBack() : src.cloneNode(true);
    gh.style.cssText = 'position:fixed;z-index:200;pointer-events:none;margin:0;left:' + (r.left) + 'px;top:' + (r.top) + 'px;--tw:' + r.width + 'px;transform:scale(1.12);';
    gh.classList.remove('can');
    document.body.appendChild(gh); sdrag.ghost = gh; sdrag.gx = r.left; sdrag.gy = r.top; OK.vib(5);
  }
  if (!sdrag.moved) return;
  e.preventDefault();
  sdrag.ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.12)';
  clearHover();
  var tg = targetAt(e.clientX, e.clientY); sdrag.target = tg;
  if (tg && tg.type === 'slot') tg.el.classList.add('hover');
}
function onSUp(e) {
  if (!sdrag || (e.pointerId !== undefined && e.pointerId !== sdrag.pid)) return;
  document.removeEventListener('pointermove', onSMove);
  document.removeEventListener('pointerup', onSUp);
  document.removeEventListener('pointercancel', onSUp);
  var d = sdrag; sdrag = null; clearHover();
  if (!d.moved) return;
  if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
  st.noClickUntil = Date.now() + 400;
  var tg = d.target;
  if (tg && tg.type === 'slot' && canDraw()) { st.wantSlot = tg.i; doDraw(d.from); }
}
function onMove(e) {
  if (!drag || e.pointerId !== drag.pid) return;
  var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.moved && Math.hypot(dx, dy) > 7) { drag.moved = true; drag.el.classList.add('drag'); st.sel = -1; OK.vib(5); }
  if (!drag.moved) return;
  e.preventDefault();
  drag.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.1)';
  clearHover();
  var tg = targetAt(e.clientX, e.clientY);
  drag.target = tg;
  if (tg) {
    if (tg.type === 'slot') tg.el.classList.add('hover');
    else if ((tg.type === 'discard' && canDiscard()) || (tg.type === 'finish' && canDiscard())) tg.el.classList.add('over');
  }
}
function onUp(e) {
  if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.pid)) return;
  document.removeEventListener('pointermove', onMove);
  document.removeEventListener('pointerup', onUp);
  document.removeEventListener('pointercancel', onUp);
  var d = drag; drag = null;
  clearHover();
  d.el.classList.remove('drag');
  if (!d.moved) { onTileTap(d.id, d.el); return; }
  var tg = d.target;
  d.el.style.transform = '';
  if (tg && tg.type === 'slot') { moveTile(d.id, tg.i); OK.sfx('tile'); }
  else if (tg && tg.type === 'discard') { if (canDiscard()) doDiscard(d.id); else { OK.sfx('err'); nudge(); } }
  else if (tg && tg.type === 'finish') { if (canDiscard()) doFinish(d.id); else { OK.sfx('err'); nudge(); } }
  else if (d.el.animate) d.el.animate([{ transform: 'scale(1.1)' }, { transform: 'none' }], { duration: 140 });
}
function nudge() { var s = $('#status'); if (s) { s.animate && s.animate([{ transform: 'translateX(-50%) scale(1.08)' }, { transform: 'translateX(-50%) scale(1)' }], { duration: 220 }); } }
function onTileTap(id, el) {
  var now = Date.now();
  OK.sfx('tile'); OK.vib(6);
  if (st.lastTap && st.lastTap.id === id && now - st.lastTap.t < 330 && canDiscard()) {
    st.lastTap = null; doDiscard(id); return;
  }
  st.lastTap = { id: id, t: now };
  st.sel = st.sel === id ? -1 : id;
  var ts = rackEl().querySelectorAll('.tile');
  for (var i = 0; i < ts.length; i++) ts[i].classList.toggle('sel', +ts[i].dataset.id === st.sel);
  renderStatus();
}
function onPileTap(vp) {
  var v = st.view; if (!v) return;
  if (st.noClickUntil && Date.now() < st.noClickUntil) return;
  if (vp === -1) {
    if (canDraw()) { if (v.pile > 0) doDraw('pile'); else OK.toast(t('pileEmpty')); }
    else if (v.status === 'playing') { OK.sfx('err'); nudge(); }
    return;
  }
  if (vp === 3) {
    if (canDraw()) {
      var s = seatOf(3), d = v.discards[s];
      if (d.length) doDraw('discard'); else OK.toast(t('noDiscard'));
    }
    return;
  }
  if (vp === 0 && canDiscard()) {
    if (st.sel >= 0) doDiscard(st.sel);
    else OK.toast(t('pickTile'));
  }
}

/* ================= Eylemler ================= */
function send(a) {
  if (!st.ctrl || st.busy) return false;
  st.busy = true;
  clearTimeout(st.busyTimer);
  st.busyTimer = setTimeout(function () { st.busy = false; if (st.ctrl && st.ctrl.sync) st.ctrl.sync(); }, 3500);
  var r = st.ctrl.act(a);
  if (r && r.ok === false) { st.busy = false; OK.sfx('err'); return false; }
  return true;
}
function doDraw(from) {
  var v = st.view;
  OK.sfx('tile'); OK.vib(10);
  st.pre = captureDrawSource(from, v);
  if (!send({ t: 'draw', from: from })) st.pre = null;
}
function doDiscard(id) {
  var el = st.tiles[id];
  st.flyFrom = el ? { id: id, rect: el.getBoundingClientRect() } : null;
  st.sel = -1; clearHint();
  OK.sfx('put'); OK.vib(12);
  if (!send({ t: 'discard', tile: id })) st.flyFrom = null;
}
function doFinish(id) {
  var el = st.tiles[id];
  st.flyFrom = el ? { id: id, rect: el.getBoundingClientRect() } : null;
  var v = st.view;
  var fin = AI.bestFinish(v.hand, v.ok, false);
  if (!fin) { OK.toast(t('notYet')); OK.sfx('err'); st.flyFrom = null; renderRack(); return; }
  var wins = E.winningDiscards(v.hand, v.ok), okk = false;
  for (var i = 0; i < wins.length; i++) if (E.tileKey(wins[i].tile, v.ok) === E.tileKey(id, v.ok)) okk = true;
  if (!okk) { OK.toast(t('wrongTile')); OK.sfx('err'); st.flyFrom = null; renderRack(); return; }
  clearHint();
  send({ t: 'finish', tile: id });
}
function onFinishBtn() {
  if (!canDiscard()) { OK.toast(t('notYourTurn')); OK.sfx('err'); return; }
  var v = st.view, fin = AI.bestFinish(v.hand, v.ok, v.moves === 0 && v.starter === st.me);
  if (!fin) { OK.toast(t('notYet')); OK.sfx('err'); return; }
  var pick = fin.tile;
  if (st.sel >= 0) {
    var wins = E.winningDiscards(v.hand, v.ok);
    for (var i = 0; i < wins.length; i++) if (E.tileKey(wins[i].tile, v.ok) === E.tileKey(st.sel, v.ok)) { pick = st.sel; break; }
  }
  // aynı türden hangi kimlik varsa elde olanı kullan
  var ids = v.hand.filter(function (x) { return E.tileKey(x, v.ok) === E.tileKey(pick, v.ok); });
  doFinish(ids[0]);
}
function doUndo() {
  if (st.kind !== 'off' || !st.table || !st.table.canUndo(st.me)) { OK.toast(t('noUndo')); return; }
  st.table.undo(st.me); OK.sfx('tile');
}
function clearHint() {
  st.hint = -1; clearTimeout(st.hintTimer);
  var ps = document.querySelectorAll('.pulse');
  for (var i = 0; i < ps.length; i++) ps[i].classList.remove('pulse');
}
function showHint() {
  var v = st.view; if (!v || v.status !== 'playing') return;
  if (v.turn !== st.me) { OK.toast(t('notYourTurn')); return; }
  clearHint();
  var a = AI.chooseAction(v, st.me, 'hard', Math.random, []);
  if (a.t === 'draw') {
    if (a.from === 'discard') { var dp = $('#dp3'); if (dp && dp.lastChild) dp.lastChild.classList.add('pulse'); OK.toast(t('hintTake')); }
    else { var pl = $('#pile'); if (pl) pl.classList.add('can'); OK.toast(t('hintPile')); }
  } else if (a.t === 'finish') {
    st.hint = a.tile; var e1 = st.tiles[a.tile]; if (e1) e1.classList.add('pulse'); OK.toast(t('hintFinish'));
  } else {
    st.hint = a.tile; var e2 = st.tiles[a.tile]; if (e2) e2.classList.add('pulse'); OK.toast(t('hintDiscard'));
  }
  st.hintTimer = setTimeout(function () { clearHint(); renderTools(); }, 4000);
}
function toggleSortPop() {
  var pop = $('#sortpop');
  if (pop.style.display !== 'none') { pop.style.display = 'none'; return; }
  clear(pop);
  pop.className = 'card';
  pop.style.cssText = 'display:block;position:absolute;z-index:40;padding:8px;gap:6px;width:auto;left:' + Math.max(8, $('#toolsL').getBoundingClientRect().left) + 'px;bottom:calc(var(--rackh) + 6px)';
  [['run', t('sortRun')], ['group', t('sortGroup')], ['smart', t('sortSmart')], ['pairs', t('sortPairs')]].forEach(function (o) {
    pop.appendChild(h('button', { class: 'btn sm', style: 'display:flex;width:100%;margin:4px 0;justify-content:flex-start', onclick: function () { pop.style.display = 'none'; OK.sfx('deal'); applySort(o[0]); } }, o[1]));
  });
  setTimeout(function () {
    var closer = function (e) { if (!pop.contains(e.target)) { pop.style.display = 'none'; document.removeEventListener('pointerdown', closer, true); } };
    document.addEventListener('pointerdown', closer, true);
  }, 0);
}

/* ================= Çizim ================= */
function renderAll() {
  renderHud(); renderSeats(); renderPiles(); renderCenter(); renderRack(); renderTools(); renderStatus();
}
function infoText() {
  var v = st.view; if (!v) return '';
  var c = v.cfg, base;
  if (c.type === 'single') base = t('mSingle');
  else if (c.type === 'countdown') base = t('mCountdown') + ' ' + c.value + ' · ' + t('handN', v.handNo);
  else if (c.type === 'hands') base = t('handOf', v.handNo, c.value);
  else base = t('mTarget') + ' ' + c.value + ' · ' + t('handN', v.handNo);
  return (c.partner ? '♥ ' : '') + base;
}
function renderHud() { var i = $('#info'); if (i) i.textContent = infoText(); }
function plateFill(plate, seat) {
  var v = st.view, m = st.meta || {};
  var av = plate.querySelector('.av'), nm = plate.querySelector('.nm'), ct = plate.querySelector('.ct');
  var isBot = m.kinds && m.kinds[seat] === 'bot';
  av.textContent = (m.avs && m.avs[seat]) || (seat === st.me ? OK.S.av : '🙂');
  nm.textContent = nameOf(seat);
  var side = E.sideOf({ cfg: v.cfg }, seat);
  var sc = v.scores[side];
  ct.textContent = [seat === st.me ? '' : v.counts[seat] + ' ' + t('tilesShort'), v.cfg.type === 'single' ? '' : sc + ' ' + t('ptsShort')].filter(Boolean).join(' · ');
  if (seat === st.me && v.cfg.type === 'single') ct.textContent = v.cfg.partner ? '♥ ' + nameOf((seat + 2) % 4) : '';
  var turn = v.status === 'playing' && v.turn === seat;
  plate.classList.toggle('turn', turn);
  plate.classList.toggle('partner', !!(v.cfg.partner && seat !== st.me && seat % 2 === st.me % 2));
  var tm = plate.querySelector('.tm'); tm.classList.toggle('on', turn && !!(m.turnTime && v.left));
  return turn;
}
function renderSeats() {
  var v = st.view; if (!v) return;
  for (var vp = 1; vp <= 3; vp++) {
    var seat = seatOf(vp), box = $('#seat' + vp);
    plateFill(box.querySelector('.plate'), seat);
    var fan = box.querySelector('.fan'); clear(fan);
    var n = Math.min(7, Math.ceil(v.counts[seat] / 2));
    for (var k = 0; k < n; k++) fan.appendChild(mkBack());
  }
  plateFill($('#mine .plate'), st.me);
  startTimerLoop();
}
function renderPiles() {
  var v = st.view; if (!v) return;
  for (var vp = 0; vp < 4; vp++) {
    var seat = seatOf(vp), d = $('#dp' + vp), list = v.discards[seat], ok = v.ok;
    clear(d);
    var from = Math.max(0, list.length - 3);
    for (var i = from; i < list.length; i++) {
      var te = mkTile(list[i], ok);
      te.style.transform = 'translate(' + ((i - list.length + 1) * -2) + 'px,' + ((i - list.length + 1) * -2) + 'px)';
      te.style.cursor = 'default';
      d.appendChild(te);
    }
    d.classList.toggle('can', vp === 3 && canDraw() && list.length > 0);
    d.classList.toggle('drop', vp === 0 && canDiscard());
  }
  var pile = $('#pile');
  pile.classList.toggle('can', canDraw() && v.pile > 0);
}
function renderCenter() {
  var v = st.view; if (!v) return;
  var pile = clear($('#pile'));
  if (v.pile > 0) { pile.appendChild(mkBack()); pile.appendChild(mkBack()); pile.appendChild(mkBack()); pile.appendChild(h('div', { class: 'cnt' }, v.pile)); }
  var ind = $('#indic .ind'); clear(ind);
  var tile = mkTile(v.indicator, v.ok); tile.style.cursor = 'default';
  if (st.flipNext) { tile.style.animation = 'flip .6s .45s both'; st.flipNext = false; }
  ind.appendChild(tile);
  $('#indic .lb').textContent = t('indicator');
  var chip = clear($('#indic .okeychip'));
  chip.appendChild(mkTile(E.tileId(v.ok.color, v.ok.num, 0), null, 'mini'));
  chip.appendChild(h('span', null, t('okeyIs')));
  chip.style.display = OK.S.hints ? 'flex' : 'none';
  $('#indic').classList.toggle('zone', canDiscard());
  $('#indic').classList.toggle('can', canDiscard() && !!st.fin);
}
function renderTools() {
  var v = st.view; if (!v) return;
  st.fin = null;
  if (canDiscard() && v.hand.length === 15) st.fin = AI.bestFinish(v.hand, v.ok, v.moves === 0 && v.starter === st.me);
  var fb = $('#bFin');
  fb.classList.toggle('ready', !!st.fin && OK.S.hints);
  fb.classList.toggle('dis', !canDiscard());
  $('#bHint').style.display = OK.S.hints ? '' : 'none';
  var u = $('#bUndo');
  u.style.display = st.kind === 'off' ? '' : 'none';
  u.classList.toggle('dis', !(st.table && st.table.canUndo(st.me)));
  $('#bChat').style.display = st.kind === 'off' ? 'none' : '';
  $('#indic').classList.toggle('can', canDiscard() && !!st.fin && OK.S.hints);
}
function renderStatus() {
  var v = st.view, s = $('#status'); if (!s || !v) return;
  var txt = '', me = false;
  if (v.status === 'playing') {
    if (v.turn === st.me) {
      me = true;
      if (v.phase === 'draw') txt = t('stDraw');
      else txt = v.moves === 0 && v.starter === st.me ? t('stFirst') : (st.sel >= 0 ? t('stDiscardSel') : t('stDiscard'));
    } else txt = t('stWait', nameOf(v.turn));
  }
  s.textContent = txt; s.className = me ? 'me' : '';
  s.style.display = txt ? '' : 'none';
}
function startTimerLoop() {
  clearInterval(st.tick);
  var v = st.view, m = st.meta;
  if (!v || !m || !m.turnTime || !v.left || v.status !== 'playing') return;
  var end = Date.now() + v.left, total = m.turnTime * 1000;
  function step() {
    var vv = st.view;
    if (!vv || vv.status !== 'playing') { clearInterval(st.tick); return; }
    var seat = vv.turn, vp = vpOf(seat);
    var plate = vp === 0 ? $('#mine .plate') : $('#seat' + vp + ' .plate');
    var bar = plate && plate.querySelector('.tm i');
    var left = Math.max(0, end - Date.now());
    if (bar) bar.style.transform = 'scaleX(' + (left / total).toFixed(3) + ')';
  }
  step(); st.tick = setInterval(step, 250);
}

/* ================= Animasyonlar ================= */
function animDur() { return OK.S.anim === 'off' || OK.S.lite ? 0 : (OK.S.anim === 'fast' ? 150 : 300); }
function ghost(fromRect, toRect, node, opts) {
  var dur = animDur(); opts = opts || {};
  if (!dur || !node || !node.animate) { if (opts.done) opts.done(); return; }
  var w = toRect.width || fromRect.width;
  node.classList.add('fly');
  node.style.setProperty('--tw', (w / 1) + 'px');
  node.style.width = w + 'px'; node.style.height = (w * 1.32) + 'px';
  node.style.left = fromRect.left + (fromRect.width - w) / 2 + 'px'; node.style.top = fromRect.top + (fromRect.height - w * 1.32) / 2 + 'px';
  document.body.appendChild(node);
  var dx = toRect.left + (toRect.width - w) / 2 - (fromRect.left + (fromRect.width - w) / 2);
  var dy = toRect.top + (toRect.height - w * 1.32) / 2 - (fromRect.top + (fromRect.height - w * 1.32) / 2);
  var a = node.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(1)', opacity: opts.fade ? 0.1 : 1 }], { duration: dur * (opts.slow ? 1.4 : 1), easing: 'cubic-bezier(.3,.7,.3,1)' });
  var fin = function () { if (node.parentNode) node.parentNode.removeChild(node); if (opts.done) opts.done(); };
  a.onfinish = fin; a.oncancel = fin;
}
function plateRect(vp) {
  var el = vp === 0 ? $('#mine .plate') : $('#seat' + vp + ' .plate');
  return el ? el.getBoundingClientRect() : { left: 0, top: 0, width: 30, height: 40 };
}
function captureDrawSource(from, v) {
  if (from === 'pile') { var p = $('#pile'); return { rect: p.getBoundingClientRect(), tile: -1 }; }
  var d = $('#dp3'), last = d && d.lastChild;
  var left = v.discards[seatOf(3)];
  return { rect: (last || d).getBoundingClientRect(), tile: left.length ? left[left.length - 1] : -1 };
}
/* olay -> animasyon işleri (render'dan önce kaynakları yakala, sonra çalıştır) */
function prepAnim(ev, prev, view) {
  var jobs = [];
  if (!ev || !animDur()) return jobs;
  if (ev.t === 'draw') {
    if (ev.seat === st.me) {
      var src = st.pre || captureDrawSource(ev.from, prev || view);
      st.pre = null;
      jobs.push(function (newly) {
        var id = newly && newly.length ? newly[newly.length - 1] : -1, el = id >= 0 ? st.tiles[id] : null;
        if (!el) return;
        el.style.visibility = 'hidden';
        var node = ev.from === 'discard' || ev.real >= 0 ? mkTile(src.tile >= 0 ? src.tile : ev.real, view.ok) : mkBack();
        if (ev.from === 'pile') node = mkBack();
        ghost(src.rect, el.getBoundingClientRect(), node, { done: function () { el.style.visibility = ''; el.classList.add('fresh'); } });
      });
    } else {
      var vp = vpOf(ev.seat);
      var s2 = ev.from === 'pile' ? $('#pile').getBoundingClientRect() : ($('#dp' + vpOf(E.leftOf(ev.seat))).lastChild || $('#dp' + vpOf(E.leftOf(ev.seat)))).getBoundingClientRect();
      var tile = ev.from === 'discard' && ev.tile >= 0 ? mkTile(ev.tile, view.ok) : mkBack();
      jobs.push(function () { ghost(s2, plateRect(vp), tile, { fade: true }); });
    }
  } else if (ev.t === 'discard' || ev.t === 'finish') {
    var vpd = vpOf(ev.seat);
    if (ev.seat === st.me) {
      var ff = st.flyFrom; st.flyFrom = null;
      var fr = ff ? ff.rect : plateRect(0);
      jobs.push(function () {
        var pile = $('#dp' + vpd), top = pile.lastChild;
        if (top && ev.t === 'discard') top.style.visibility = 'hidden';
        var tr = (ev.t === 'finish' ? $('#indic .ind') : (top || pile)).getBoundingClientRect();
        ghost(fr, tr, mkTile(ev.tile, view.ok), { done: function () { if (top) top.style.visibility = ''; } });
      });
    } else {
      var fr2 = plateRect(vpd);
      jobs.push(function () {
        var pile = $('#dp' + vpd), top = pile.lastChild;
        if (top && ev.t === 'discard') top.style.visibility = 'hidden';
        var tr = (ev.t === 'finish' ? $('#indic .ind') : (top || pile)).getBoundingClientRect();
        ghost(fr2, tr, mkTile(ev.tile, view.ok), { done: function () { if (top) top.style.visibility = ''; } });
      });
    }
  }
  return jobs;
}

/* ================= Güncelleme (denetleyiciden) ================= */
G.onUpdate = function (view, ev, meta, seat) {
  if (OK.cur !== 'game' && !st.built) return;
  st.busy = false; clearTimeout(st.busyTimer);
  if (seat !== undefined && seat !== null) st.me = seat;
  var prev = st.view;
  st.view = view; if (meta) st.meta = meta;
  var key = view.handNo + ':' + view.indicator + ':' + view.ok.color + ':' + view.starter;
  var isNew = !prev || key !== st.handKey || (ev && ev.t === 'deal');
  var jobs = [];
  if (isNew) { initHand(view, ev); }
  else {
    jobs = prepAnim(ev, prev, view);
    if (ev && ev.t === 'sync') clearHint();
    var newly = syncRack(view.hand);
    st.newly = newly;
  }
  if (!isNew) renderAll();
  else renderAll();
  if (!isNew) { var nl = st.newly || []; jobs.forEach(function (j) { try { j(nl); } catch (e) {} }); }
  if (ev && ev.t === 'draw' && ev.seat === st.me && !jobs.length) {
    var nn = st.newly && st.newly[st.newly.length - 1]; if (nn >= 0 && st.tiles[nn]) st.tiles[nn].classList.add('fresh');
  }
  // ses
  if (ev && !isNew) {
    if (ev.t === 'draw' && ev.seat !== st.me) OK.sfx('tile');
    if ((ev.t === 'discard') && ev.seat !== st.me) OK.sfx('put');
  }
  if (view.status === 'playing' && view.turn === st.me && st.lastTurn !== view.turn + ':' + view.moves + ':' + view.phase && view.phase === 'draw') {
    OK.sfx('turn'); OK.vib([30]);
  }
  st.lastTurn = view.turn + ':' + view.moves + ':' + view.phase;
  // sonuç
  if (view.status !== 'playing') {
    var rk = view.handNo + ':' + view.status + ':' + (view.result ? view.result.winner : '');
    if (st.resultKey !== rk) {
      st.resultKey = rk;
      clearTimeout(st.resultTimer);
      var delay = ev && (ev.t === 'finish' || ev.drawGame) ? (animDur() ? 1300 : 300) : 0;
      st.resultTimer = setTimeout(function () { showResult(st.view); }, delay);
    }
  }
  if (st.kind === 'off') savePersist();
};
function initHand(view, ev) {
  st.handKey = view.handNo + ':' + view.indicator + ':' + view.ok.color + ':' + view.starter;
  st.tiles = {}; st.sel = -1; clearHint(); st.resultKey = ''; st.flyFrom = null; st.pre = null;
  clearTimeout(st.resultTimer);
  if (st.resultModal) { st.resultModal.close(); st.resultModal = null; }
  var ps = st.pendingSlots; st.pendingSlots = null;
  var useSaved = false;
  if (ps && ps.length === SLOTS) {
    var ids = ps.filter(function (x) { return x >= 0; }).sort(), hs = view.hand.slice().sort();
    useSaved = ids.length === hs.length && ids.every(function (x, i) { return x === hs[i]; });
  }
  if (useSaved) st.slots = ps.slice();
  else {
    initialLayout(view.hand);
  }
  st.cols = cols();
  st.flipNext = true;
  var fresh = ev && ev.t === 'deal' && animDur() > 0;
  renderRackInit(view, fresh);
  if (fresh) OK.sfx('deal');
}
function renderRackInit(view, fresh) {
  renderRack();
  if (!fresh) return;
  var i = 0;
  for (var id in st.tiles) {
    var el = st.tiles[id];
    if (el.animate) el.animate([{ transform: 'translateY(-90px) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, delay: i * 28, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' });
    i++;
  }
}
G.onLayout = function () {
  if (!st.built || !st.view) return;
  if (st.cols && st.cols !== cols()) { reflowCols(); st.cols = cols(); }
  renderRack();
};
G.refresh = function () {
  if (!st.built || !st.view) return;
  st.tiles = {}; renderAll(); renderSnd();
  var c = $('#indic .lb'); if (c) c.textContent = t('indicator');
};

/* ================= Sonuç ve maç sonu ================= */
function updateStats(view) {
  var r = view.result; if (!r) return;
  var key = view.handNo + ':' + view.status + ':' + view.seq;
  if (st.statKey === key) return; st.statKey = key;
  var S = OK.stats;
  S.hands++;
  if (r.winner !== null && E.sideOf({ cfg: view.cfg }, r.winner) === E.sideOf({ cfg: view.cfg }, st.me)) {
    S.handsWon++;
    if (r.winner === st.me) { if (r.info.okey) S.okey++; if (r.info.kind === 'pairs') S.pairs++; if (r.info.elden) S.elden++; }
  }
  if (view.status === 'matchEnd') {
    S.played++;
    if (view.matchWinner === E.sideOf({ cfg: view.cfg }, st.me)) { S.won++; S.streak++; if (S.streak > S.best) S.best = S.streak; }
    else S.streak = 0;
    try {
      var hs = OK.lsGet('hist', []);
      hs.unshift({ d: Date.now(), c: view.cfg, w: view.matchWinner === E.sideOf({ cfg: view.cfg }, st.me), s: view.scores.slice(), me: E.sideOf({ cfg: view.cfg }, st.me), on: st.kind !== 'off' });
      OK.lsSet('hist', hs.slice(0, 30));
    } catch (e) {}
  }
  OK.saveStats();
}
function scoreTable(view, hl) {
  var tb = h('table', { class: 'sc' }, h('tr', null, h('th', null, ''), h('th', { style: 'text-align:right' }, view.cfg.type === 'countdown' ? t('remaining') : t('points'))));
  var n = view.cfg.partner ? 2 : 4;
  for (var s = 0; s < n; s++) {
    var tr = h('tr', { class: hl === s ? 'win' : '' }, h('td', null, sideNames(s)), h('td', { class: 'n' }, view.scores[s]));
    tb.appendChild(tr);
  }
  return tb;
}
function showResult(view) {
  if (!view || view.status === 'playing') return;
  if (st.resultModal) { st.resultModal.close(); st.resultModal = null; }
  updateStats(view);
  var r = view.result, info = r.info, body = h('div', { class: 'result' });
  var mineWin = r.winner !== null && E.sideOf({ cfg: view.cfg }, r.winner) === E.sideOf({ cfg: view.cfg }, st.me);
  var title;
  if (r.draw) title = t('drawGame');
  else if (r.winner === st.me) title = t('youWon');
  else title = t('playerWon', nameOf(r.winner));
  body.appendChild(h('div', { class: 'title' }, title));
  var badges = h('div', { class: 'badges' });
  if (info) {
    badges.appendChild(h('span', { class: 'chip gold' }, '+' + info.value));
    if (info.okey) badges.appendChild(h('span', { class: 'chip' }, '★ ' + t('bOkey')));
    if (info.kind === 'pairs') badges.appendChild(h('span', { class: 'chip' }, t('bPairs')));
    if (info.elden) badges.appendChild(h('span', { class: 'chip' }, t('bElden')));
  }
  body.appendChild(badges);
  if (info) {
    var hand = r.hands[r.winner].slice(), sets = h('div', { class: 'sets' });
    var groups;
    if (info.kind === 'pairs') { var pa = E.pairArrange(hand, view.ok); groups = pa.pairs.concat(pa.rest.length ? [pa.rest] : []); }
    else { var arr = E.smartArrange(hand, view.ok); groups = arr.sets.map(function (s) { return s.ids; }); if (arr.rest.length) groups.push(arr.rest); }
    groups.forEach(function (g) { var gd = h('div', { class: 'g' }); g.forEach(function (id) { gd.appendChild(mkTile(id, view.ok, 'mini')); }); sets.appendChild(gd); });
    var last = h('div', { class: 'g', style: 'margin-left:6px;opacity:.9' }, mkTile(info.tile, view.ok, 'mini'));
    sets.appendChild(last);
    body.appendChild(sets);
  }
  var wside = r.winner !== null ? E.sideOf({ cfg: view.cfg }, r.winner) : -1;
  if (view.cfg.type !== 'single') body.appendChild(scoreTable(view, wside));
  var buttons = [];
  if (view.status === 'matchEnd') {
    var won = view.matchWinner === E.sideOf({ cfg: view.cfg }, st.me);
    body.insertBefore(h('div', { class: 'title', style: 'color:var(--gold1);font-size:26px' }, won ? t('matchWon') : t('matchLost', sideNames(view.matchWinner))), body.firstChild);
    if (view.cfg.type !== 'single') { /* tablo zaten var */ }
    if (won) { OK.sfx('win'); confetti(); } else OK.sfx('lose');
    if (st.kind === 'off') OK.lsDel('save');
    buttons.push({ label: t('toMenu'), onclick: function () { G.exit(true); } });
    if (st.kind === 'off' || st.kind === 'host') buttons.push({ label: t('rematch'), cls: 'gold', onclick: function () { rematch(); } });
    else buttons.push({ label: t('waitHost'), cls: 'dis', keep: true });
  } else {
    if (mineWin && info) { OK.sfx('win'); if (r.winner === st.me && !OK.S.lite) confetti(); } else if (!r.draw) OK.sfx('lose');
    buttons.push({ label: t('toMenu'), onclick: function () { G.confirmExit(); }, keep: false });
    var nb = { label: st.kind === 'off' ? t('nextHand') : t('ready'), cls: 'gold', keep: true, onclick: function (api) {
      if (st.kind === 'off') { api.close(); st.table.nextHand(); }
      else { st.ctrl.ready(); var btn = api.card.querySelector('.ft .btn.gold'); if (btn) { btn.textContent = t('waiting'); btn.classList.add('dis'); } return false; }
    } };
    buttons.push(nb);
  }
  var m = OK.modal({ title: undefined, body: body, buttons: buttons, dismiss: false, noclose: true });
  st.resultModal = m;
  // kapanınca sıfırla
  var oc = m.close; m.close = function () { st.resultModal = null; oc(); };
}
function rematch() {
  if (st.kind === 'off') {
    var cfg = st.cfg;
    G.startOffline(cfg, st.level, true);
  } else if (st.kind === 'host') st.ctrl.rematch();
}
function confetti() {
  if (OK.S.lite || OK.S.anim === 'off') return;
  var cv = $('#confetti'); if (!cv) { cv = h('canvas', { id: 'confetti' }); document.body.appendChild(cv); }
  var W = cv.width = window.innerWidth, H = cv.height = window.innerHeight, ctx = cv.getContext('2d');
  var cols = ['#f7d56a', '#ff6b6b', '#5ea6ff', '#7be08a', '#fff'], ps = [];
  for (var i = 0; i < 90; i++) ps.push({ x: Math.random() * W, y: -20 - Math.random() * H * .4, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, r: 3 + Math.random() * 4, c: cols[i % cols.length], a: Math.random() * 6 });
  var t0 = Date.now();
  (function step() {
    var dt = Date.now() - t0; ctx.clearRect(0, 0, W, H);
    ps.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.a += .12; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
    if (dt < 2600) requestAnimationFrame(step); else ctx.clearRect(0, 0, W, H);
  })();
}

/* ================= Menüler ================= */
G.openScores = function () {
  var v = st.view; if (!v) return;
  var body = h('div', null, h('div', { class: 'hint', style: 'margin-bottom:8px' }, infoText()), scoreTable(v, -1),
    h('div', { class: 'hint', style: 'margin-top:10px' }, t('mode_' + v.cfg.type)));
  OK.modal({ title: t('scoreboard'), body: body, buttons: [{ label: t('ok'), cls: 'gold' }] });
};
G.openMenu = function () {
  if (st.table) st.table.setPaused(true);
  var body = h('div', { class: 'menubtns', style: 'width:100%' },
    h('button', { class: 'btn gold', onclick: function () { m.close(); } }, t('continue')),
    OK.fsOK() ? h('button', { class: 'btn', onclick: function () { m.close(); OK.fsToggle(); } }, OK.icon('expand'), t('fullscreen')) : null,
    h('button', { class: 'btn', onclick: function () { OK.openSettings(); } }, OK.icon('gear'), t('settings')),
    h('button', { class: 'btn', onclick: OK.openRules }, OK.icon('book'), t('rules')),
    h('button', { class: 'btn', onclick: function () { m.close(); G.confirmExit(); } }, OK.icon('back'), st.kind === 'off' ? t('toMenu') : t('leaveTable')));
  var m = OK.modal({ title: t('menu'), body: body, onclose: function () { if (st.table) st.table.setPaused(false); } });
};
G.confirmExit = function () {
  var go = function () { G.exit(true); };
  if (!OK.S.confirm) return go();
  OK.confirm(st.kind === 'off' ? t('exitSave') : t('exitOnline'), t('yes'), t('no'), go);
};
G.exit = function (leave) {
  clearTimeout(st.resultTimer); clearInterval(st.tick);
  if (st.resultModal) { st.resultModal.close(); st.resultModal = null; }
  OK.closeModals();
  if (st.table) { st.table.destroy(); st.table = null; }
  if (st.ctrl && st.ctrl.leave && st.kind !== 'off') st.ctrl.leave();
  st.ctrl = null; st.view = null; st.handKey = ''; st.kind = 'off';
  OK.renderMenu(); OK.screen('menu');
};

/* ================= Başlatma ================= */
var BOT_NAMES = ['Tekin', 'Pınar', 'Deniz', 'Kaan', 'Elif', 'Ece', 'Mert', 'Selin', 'Burak', 'Derya', 'Cem', 'Aylin', 'Orhan', 'Zeynep'];
var BOT_AV = ['🦊', '🐻', '🐼', '🦁', '🐯', '🐸', '🦉', '🐙'];
function pick(arr, n) { var a = arr.slice(), out = []; while (out.length < n) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]); return out; }

G.startOffline = function (cfg, level, keepNames) {
  if (st.table) { st.table.destroy(); st.table = null; }
  OK.closeModals();
  var names, avs;
  if (keepNames && st.meta) { names = st.meta.names.slice(1); avs = st.meta.avs.slice(1); }
  else { names = pick(BOT_NAMES, 3); avs = pick(BOT_AV, 3); }
  var seats = [{ kind: 'human', name: OK.S.name || t('you'), av: OK.S.av }];
  for (var i = 0; i < 3; i++) seats.push({ kind: 'bot', name: names[i], av: avs[i], level: level });
  var speed = { fast: 0.55, normal: 1, slow: 1.7 }[OK.S.speed] || 1;
  var table = new Table({ cfg: cfg, seats: seats, speed: speed });
  table.allowUndo = true;
  attachTable(table, cfg, level);
  OK.lsDel('save');
  table.start();
};
function attachTable(table, cfg, level) {
  st.table = table; st.kind = 'off'; st.me = 0; st.cfg = cfg; st.level = level; st.view = null; st.handKey = ''; st.statKey = '';
  st.ctrl = {
    act: function (a) { return table.act(0, a); },
    next: function () { table.nextHand(); },
    leave: function () {}
  };
  table.on(function (ev) { if (st.table === table) G.onUpdate(table.view(0), ev, table.meta(), 0); });
  build();
  OK.rotHide = false;
  OK.screen('game');
}
G.resume = function () {
  var sv = OK.lsGet('save', null);
  if (!sv || !sv.m) { OK.renderMenu(); return; }
  try {
    var table = new Table({ cfg: sv.cfg, seats: sv.seats, speed: { fast: 0.55, normal: 1, slow: 1.7 }[OK.S.speed] || 1, m: sv.m });
    table.allowUndo = true;
    st.pendingSlots = sv.slots || null;
    attachTable(table, sv.cfg, sv.level || 'medium');
    table.start();
  } catch (e) { OK.lsDel('save'); OK.renderMenu(); OK.toast(t('resumeFail')); }
};
G.saveInfo = function (sv) {
  try {
    var c = sv.cfg;
    return OK.modeName(c.type, c.value) + ' · ' + t('handN', sv.m.handNo);
  } catch (e) { return ''; }
};
var saveT = 0;
function savePersist() {
  if (st.kind !== 'off' || !st.table) return;
  clearTimeout(saveT);
  saveT = setTimeout(function () {
    if (!st.table || st.kind !== 'off' || st.table.m.status === 'matchEnd') return;
    OK.lsSet('save', { cfg: st.cfg, level: st.level, m: st.table.m, seats: st.table.seats, slots: st.slots, t: Date.now() });
  }, 250);
}
/* online denetleyici bağlama */
G.attachOnline = function (ctrl, kind, seat, cfg) {
  if (st.table) { st.table.destroy(); st.table = null; }
  st.ctrl = ctrl; st.kind = kind; st.me = seat; st.cfg = cfg; st.view = null; st.handKey = ''; st.statKey = ''; st.table = null; st.msgs = []; st.unread = 0;
  build(); OK.rotHide = false;
  OK.closeModals();
  OK.screen('game');
};
function flushSave() { if (st.kind === 'off' && st.table) { clearTimeout(saveT); if (st.table.m.status !== 'matchEnd') OK.lsSet('save', { cfg: st.cfg, level: st.level, m: st.table.m, seats: st.table.seats, slots: st.slots, t: Date.now() }); } }
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushSave(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && OK.cur === 'game') G.openMenu(); });
})();
