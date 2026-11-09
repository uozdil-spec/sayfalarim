/* Domino · çizim: taş, masa (yılan düzeni), el, rakip panelleri  (by uozdil) */
(function (root) {
'use strict';
var DM = root.DM, $ = DM.$, S = DM.S, tr = DM.tr, esc = DM.esc;

/* ---------- taş ---------- */
var P = {
  0: [], 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]]
};
function half(v) {
  var s = '<div class="hf n' + v + '">', ps = P[v] || [], k;
  for (k = 0; k < ps.length; k++) s += '<i style="left:' + ps[k][0] + '%;top:' + ps[k][1] + '%"></i>';
  return s + '</div>';
}
function tileHTML(a, b, vert, cls) {
  return '<div class="tl' + (vert ? ' v' : '') + (cls ? ' ' + cls : '') + '">' + half(a) + half(b) + '<b class="dv"></b><b class="pin"></b></div>';
}
DM.tileHTML = tileHTML;
DM.tileById = function (id, vert, cls) { var t = DM.TILES[id]; return tileHTML(t[0], t[1], vert, cls); };

/* ---------- masa: yılan düzeni ----------
   1 hücre = 40px. Yatay taş 2x1, dikey 1x2. Satır aralığı 2 hücre; satır sonunda dik "dönüş" taşı. */
var U = 40;
/* taş döndükçe kalınlık gölgesi ekranda hep aşağı baksın: dönüş açısı -> taşın kendi eksenindeki yön */
var SDIR = { 0: [0, 1], 90: [1, 0], 180: [0, -1], 270: [-1, 0] };
function walk(items, dir, vdir, edge, y, C, peek) {
  var xmax = C / 2, xmin = -C / 2, out = [], k, it, dbl, need, wrap, cx;
  var list = peek ? [peek] : items;
  for (k = 0; k < list.length; k++) {
    it = list[k]; dbl = it.a === it.b; need = dbl ? 1 : 2;
    wrap = dir === 1 ? (edge + need > xmax) : (edge - need < xmin);
    if (wrap) {
      cx = dir === 1 ? edge + 0.5 : edge - 0.5;
      out.push({ it: it, cx: cx, cy: y + vdir * 0.5, rot: dbl ? 90 : (vdir > 0 ? 90 : -90) });
      edge = dir === 1 ? edge + 1 : edge - 1;
      y += vdir * 2; dir = -dir;
    } else {
      cx = dir === 1 ? edge + need / 2 : edge - need / 2;
      out.push({ it: it, cx: cx, cy: y, rot: dbl ? 90 : (dir === 1 ? 0 : 180) });
      edge += dir * need;
    }
  }
  return out;
}
function layoutChain(chain, C) {
  var res = { items: [], mk: {}, bb: [0, 0, 0, 0] };
  if (!chain.length) return res;
  var ci = 0, k;
  for (k = 0; k < chain.length; k++) if (chain[k].side === 'C') { ci = k; break; }
  var c = chain[ci], cdbl = c.a === c.b, half0 = cdbl ? 0.5 : 1;
  res.items.push({ e: c, cx: 0, cy: 0, rot: cdbl ? 90 : 0, fa: c.a, fb: c.b });
  var right = chain.slice(ci + 1), left = chain.slice(0, ci).reverse();
  var ro = walk(right, 1, 1, half0, 0, C), lo = walk(left, -1, -1, -half0, 0, C), r;
  for (k = 0; k < ro.length; k++) { r = ro[k]; res.items.push({ e: r.it, cx: r.cx, cy: r.cy, rot: r.rot, fa: r.it.a, fb: r.it.b }); }
  for (k = 0; k < lo.length; k++) { r = lo[k]; res.items.push({ e: r.it, cx: r.cx, cy: r.cy, rot: r.rot, fa: r.it.b, fb: r.it.a }); }
  /* sonraki yuva (hayalet) konumları: son durumdan hesapla */
  function lastState(o, dir0, vdir, edge0) {
    var dir = dir0, edge = edge0, y = 0, xmax = C / 2, xmin = -C / 2, i, d, n, w;
    for (i = 0; i < o.length; i++) {
      d = o[i].it.a === o[i].it.b; n = d ? 1 : 2;
      w = dir === 1 ? (edge + n > xmax) : (edge - n < xmin);
      if (w) { edge = dir === 1 ? edge + 1 : edge - 1; y += vdir * 2; dir = -dir; } else edge += dir * n;
    }
    return { dir: dir, edge: edge, y: y };
  }
  var rs = lastState(ro, 1, 1, half0), ls = lastState(lo, -1, -1, -half0);
  var dummy = { a: 1, b: 2 };
  var rp = walk(null, rs.dir, 1, rs.edge, rs.y, C, dummy)[0], lp = walk(null, ls.dir, -1, ls.edge, ls.y, C, dummy)[0];
  res.mk.R = { cx: rp.cx, cy: rp.cy, rot: rp.rot }; res.mk.L = { cx: lp.cx, cy: lp.cy, rot: lp.rot };
  /* sınırlar */
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  function ext(cx, cy, rot) {
    var v = (rot === 90 || rot === -90), w = v ? 1 : 2, h = v ? 2 : 1;
    if (cx - w / 2 < x0) x0 = cx - w / 2; if (cx + w / 2 > x1) x1 = cx + w / 2;
    if (cy - h / 2 < y0) y0 = cy - h / 2; if (cy + h / 2 > y1) y1 = cy + h / 2;
  }
  for (k = 0; k < res.items.length; k++) ext(res.items[k].cx, res.items[k].cy, res.items[k].rot);
  res.bb = [x0, y0, x1, y1];
  res.ext = ext; res.boxOf = function () { return [x0, y0, x1, y1]; };
  res.withMarkers = function (show) {
    var b = [x0, y0, x1, y1];
    ['L', 'R'].forEach(function (s) {
      if (!show[s]) return; var m = res.mk[s], v = (m.rot === 90 || m.rot === -90), w = v ? 1 : 2, h = v ? 2 : 1;
      if (m.cx - w / 2 < b[0]) b[0] = m.cx - w / 2; if (m.cx + w / 2 > b[2]) b[2] = m.cx + w / 2;
      if (m.cy - h / 2 < b[1]) b[1] = m.cy - h / 2; if (m.cy + h / 2 > b[3]) b[3] = m.cy + h / 2;
    });
    return b;
  };
  return res;
}
DM.layoutChain = layoutChain;

var board = DM.board = { els: {}, mks: [], C: 12, last: -1, lastLen: 0, sig: '' };

function feltSize() { var f = $('#felt'); return [f.offsetWidth, f.offsetHeight]; }
function pickC() {
  var s = feltSize(); if (!s[0] || !s[1]) return board.C;
  return Math.max(8, Math.min(20, Math.round(Math.sqrt(108 * s[0] / s[1]))));
}

/* ana çizim: zincir + uç işaretleri. show={L:bool,R:bool} */
DM.renderBoard = function (st, show, animNew) {
  var chain = st.chain, ch = $('#chain'), k, id;
  show = show || {};
  var C = pickC(); board.C = C;
  var lay = layoutChain(chain, C), seen = {};
  for (k = 0; k < lay.items.length; k++) {
    var it = lay.items[k], e = it.e; id = e.id; seen[id] = 1;
    var el = board.els[id];
    var tf = 'translate(' + (it.cx * U) + 'px,' + (it.cy * U) + 'px) rotate(' + it.rot + 'deg)';
    var sd = SDIR[((it.rot % 360) + 360) % 360] || SDIR[0];
    if (!el) {
      el = document.createElement('div'); el.className = 'bt' + (animNew && S.anim !== 'off' && k >= 0 ? ' new' : '');
      el.innerHTML = tileHTML(it.fa, it.fb, false);
      el.style.setProperty('--sx', sd[0]); el.style.setProperty('--sy', sd[1]);
      el.style.webkitTransition = el.style.transition = 'none'; tr(el, tf);
      ch.appendChild(el); board.els[id] = el;
      (function (x) { setTimeout(function () { x.style.webkitTransition = x.style.transition = ''; x.className = x.className.replace(' new', ''); }, 480); })(el);
    } else tr(el, tf);
  }
  for (id in board.els) if (board.els.hasOwnProperty(id) && !seen[id]) { if (board.els[id].parentNode) board.els[id].parentNode.removeChild(board.els[id]); delete board.els[id]; }
  /* son oynanan taş vurgusu */
  var lm = st.lastMove && st.lastMove.type === 'play' ? st.lastMove.id : -1;
  for (id in board.els) if (board.els.hasOwnProperty(id)) {
    var on = (String(lm) === id);
    board.els[id].className = board.els[id].className.replace(/\blast\b/g, '').replace(/\s+/g, ' ').trim() + (on ? ' last' : '');
  }
  /* işaretler */
  board.mks.forEach(function (m) { if (m.parentNode) m.parentNode.removeChild(m); }); board.mks = [];
  if (chain.length) ['L', 'R'].forEach(function (sd) {
    if (!show[sd]) return;
    var m = lay.mk[sd], d = document.createElement('div');
    d.className = 'mk'; d.setAttribute('data-end', sd); d.textContent = sd === 'L' ? '◀' : '▶';
    tr(d, 'translate(' + (m.cx * U) + 'px,' + (m.cy * U) + 'px) rotate(' + m.rot + 'deg)');
    if (m.rot === 180 || m.rot === -90) d.style.fontSize = '15px';
    ch.appendChild(d); board.mks.push(d);
  });
  /* ölçek ve ortalama */
  var b = chain.length ? lay.withMarkers(show) : [-1, -0.5, 1, 0.5];
  var fs = feltSize(), W = (b[2] - b[0]) * U, H = (b[3] - b[1]) * U, pad = 26;
  var maxS = (S.size === 'buyuk') ? 1.7 : (S.size === 'kucuk' ? 1.0 : 1.35);
  var sc = Math.min((fs[0] - pad) / Math.max(W, 1), (fs[1] - pad) / Math.max(H, 1), maxS);
  if (!isFinite(sc) || sc < .2) sc = .2;
  var cx = (b[0] + b[2]) / 2 * U, cy = (b[1] + b[3]) / 2 * U;
  tr(ch, 'translate(' + (fs[0] / 2 - cx * sc) + 'px,' + (fs[1] / 2 - cy * sc) + 'px) scale(' + sc + ')');
  board.lay = lay;
};
DM.clearBoard = function () {
  var ch = $('#chain'); ch.innerHTML = ''; board.els = {}; board.mks = []; tr(ch, 'none');
};

/* ---------- el ---------- */
DM.renderHand = function (st, seat, ctx) {
  var h = st.hands[seat].slice(), box = $('#hand'), n = h.length, k, avail = box.clientWidth - 8;
  if (ctx.sort === 'pip') h.sort(function (a, b) { return DM.pips(b) - DM.pips(a) || b - a; });
  else if (ctx.sort === 'free') { /* oturum sırası korunur */ }
  var umax = root.innerHeight <= 540 ? 26 : 34;
  var u = Math.max(20, Math.min(umax, Math.floor(avail / Math.max(n, 1)) - 6));
  var wide = n * (u + 6) > avail;
  box.className = wide ? 'many' : '';
  var html = '';
  var playable = {}; (ctx.moves || []).forEach(function (m) { playable[m.id] = 1; });
  for (k = 0; k < n; k++) {
    var id = h[k], t = DM.TILES[id], cls = 'hw';
    if (ctx.sel === id) cls += ' sel';
    if (ctx.myTurn) { if (playable[id]) { if (S.glow) cls += ' can'; } else cls += ' no'; }
    var hl = '';
    if (ctx.hints) for (var q = 0; q < ctx.hints.length; q++) if (ctx.hints[q].id === id) { cls += ' hn'; hl = '<span class="hl">' + 'ABC'.charAt(q) + '</span>'; break; }
    html += '<div class="' + cls + '" data-id="' + id + '" style="--u:' + u + 'px">' + hl + tileHTML(t[0], t[1], true) + '</div>';
  }
  box.innerHTML = html;
  box.style.minHeight = (u * 2 + 24) + 'px';
};

/* ---------- rakip panelleri ---------- */
DM.renderOpps = function (st, seat, info) {
  var box = $('#opps'), out = '', n = st.n, k, s, cnt, bks, i;
  for (k = 1; k < n; k++) {
    s = (seat + k) % n;
    cnt = st.counts ? st.counts[s] : st.hands[s].length;
    bks = ''; var show = Math.min(cnt, 7);
    for (i = 0; i < show; i++) bks += '<i class="bk"></i>';
    var sub = info.sub ? info.sub(s) : '';
    out += '<div class="op' + (st.turn === s && !st.over ? ' act' : '') + (info.out && info.out[s] ? ' out' : '') + '" data-seat="' + s + '">' +
      '<i class="av" style="background:' + DM.COLS[s % 4] + '">' + DM.initial(info.names[s]) + '</i>' +
      '<div class="nm"><b>' + esc(info.names[s] || ('Oyuncu ' + (s + 1))) + '</b><small>' + esc(sub) + '</small></div>' +
      '<div class="bks">' + bks + '<em>' + cnt + '</em></div></div>';
  }
  box.innerHTML = out; box.className = n === 4 ? 'c3' : '';
};

DM.renderMe = function (st, seat, info) {
  var m = $('#mePan'); m.className = 'me' + (st.turn === seat && !st.over ? ' act' : '');
  $('#meAv').style.background = DM.COLS[seat % 4]; $('#meAv').textContent = DM.initial(info.names[seat]);
  $('#meNm').textContent = info.names[seat] || 'Sen';
  $('#meSm').textContent = info.sub ? info.sub(seat) : '';
};

/* küçük resim: kılavuz / sonuç ekranları için */
DM.miniRow = function (ids) { return '<div class="mini">' + ids.map(function (id) { return DM.tileById(id, false); }).join('') + '</div>'; };
DM.figRow = function (pairs, vertical) {
  return '<div class="fig">' + pairs.map(function (p) { return tileHTML(p[0], p[1], !!vertical); }).join('') + '</div>';
};
})(window);
