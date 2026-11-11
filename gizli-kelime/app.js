/* Gizli Kelime · oyun akışı, tahta, klavye, sonuç panelleri  (by uozdil)
   Oyun "ev sahibi" cihazda yürür; herkes yalnızca kendine gönderilen görünümü (V) çizer. */
(function (root) {
'use strict';
var GK = root.GK, $ = GK.$, S = GK.S, LS = GK.LS, esc = GK.esc, rnd = GK.rnd, UI = GK.UI, Net = GK.Net, SND = GK.SND, vib = GK.vib, cls = GK.cls,
  toast = GK.toast, saveS = GK.saveS, openSheet = GK.openSheet, closeSheet = GK.closeSheet, H = GK.hooks, up = GK.up;

var G = GK.G = { M: null, V: null, mode: null, buf: '', pend: false, key: '', painted: 0, rows: [], histG: false, skipPop: false, busy: 0, tick: null, dl: 0, dlT: 0, st2: '', lastSec: -1, lastTurn: -1, endKey: '', statKey: '' };
var TEMPO = { race: [0, 90, 180, 300], turn: [0, 25, 45, 75] };
GK.TEMPO = TEMPO;
var KROWS = ['ertyuıopğü', 'asdfghjklşi', 'zcvbnmöç'];

function gameOn() { return $('#game').className.indexOf('on') >= 0; }
function show(id) {
  ['home', 'game'].forEach(function (s) { cls($('#' + s), 'on', s === id); });
  if (id === 'game') { if (!G.histG) { try { history.pushState({ g: 1 }, ''); G.histG = true; } catch (e) {} } }
  else { if (G.histG) { G.histG = false; G.skipPop = true; try { history.back(); } catch (e) { G.skipPop = false; } } GK.homeRefresh(); }
}
GK.show = show;
GK.rePush = function () { if (gameOn() && !G.histG) { try { history.pushState({ g: 1 }, ''); G.histG = true; } catch (e) {} } };

/* ====================== EV SAHİBİ / TEK CİHAZ MANTIĞI ====================== */
function kindOf(s) { var M = G.M; if (M.mode === 'host') { var k = Net.seatKind(s); return k === 'host' ? 'me' : k; } return M.kinds[s]; }
function mySeat() { var M = G.M; return M.mode === 'local' ? M.turn : 0; }
function pickSecret(len) {
  var A = GK.answers(len), w, i = 0;
  do { w = A[rnd(A.length)]; i++; } while (S.recent.indexOf(w) >= 0 && i < 40);
  S.recent.push(w); if (S.recent.length > 400) S.recent = S.recent.slice(-300); saveS();
  return w;
}
GK.startMatch = function (o) {
  var M = { mode: o.mode, cfg: o.cfg, names: o.names, kinds: o.kinds, diff: o.diff || 2, round: 0, scores: [], starter: -1, id: Date.now(), next: o.secret || '', no: o.no || 0 }, i;
  for (i = 0; i < o.cfg.n; i++) M.scores.push(0);
  G.M = M; G.mode = o.mode; G.endKey = ''; G.statKey = '';
  newRound(); show('game'); startTick(); GK.wake();
};
function newRound() {
  var M = G.M, c = M.cfg, i, nb = c.kind === 'turn' ? 1 : c.n;
  M.round++; M.secret = M.next || pickSecret(c.len); M.next = '';
  M.first = c.first ? M.secret.charAt(0) : '';
  M.boards = []; M.gains = [];
  for (i = 0; i < nb; i++) M.boards.push({ rows: [], done: false, win: false });
  for (i = 0; i < c.n; i++) M.gains.push(0);
  M.phase = 'play'; M.firstSolve = -1; M.res = null; M.hints = { rev: [], mean: false }; M.botAt = {}; M.to = 0; M.autoNext = 0;
  M.starter = (M.starter + 1) % c.n; M.turn = M.starter;
  M.deadline = c.time ? Date.now() + c.time * 1000 : 0;
  sync();
}
function view(seat) {
  var M = G.M, c = M.cfg, play = M.phase === 'play', kd = [], i;
  for (i = 0; i < c.n; i++) kd.push(kindOf(i));
  return { id: M.id, mode: (M.mode === 'host' && seat !== 0) ? 'guest' : M.mode, cfg: c, names: M.names, kd: kd, round: M.round, scores: M.scores, phase: M.phase, me: seat, turn: M.turn,
    left: M.deadline ? Math.max(0, M.deadline - Date.now()) : -1, first: M.first, fs: M.firstSolve, no: M.no,
    rev: seat === 0 ? M.hints.rev : [], hm: seat === 0 && M.hints.mean, res: M.res,
    boards: M.boards.map(function (b, bi) {
      var own = c.kind === 'turn' || bi === seat || !play;
      return { done: b.done, win: b.win, rows: b.rows.map(function (r) { return own ? { w: r.w, m: r.m, s: r.s } : { m: r.m }; }) };
    }) };
}
function sync() {
  var M = G.M; if (!M) return;
  if (M.mode === 'host') Net.guestSeats().forEach(function (s) { Net.sendSeat(s, { t: 'st', v: view(s) }); });
  persist();
  setView(view(mySeat()));
}
function persist() {
  var M = G.M;
  if (M.mode === 'solo') { if (M.phase === 'play') LS.set('gizli.save', M); else LS.del('gizli.save'); }
  else if (M.mode === 'daily') LS.set('gizli.gun', { no: M.no, M: M });
}
function applyGuess(seat, w) {
  var M = G.M; if (!M || M.phase !== 'play') return false;
  var c = M.cfg, b = M.boards[c.kind === 'turn' ? 0 : seat], m, k, g;
  if (!b || b.done) return false;
  if (c.kind === 'turn' && M.turn !== seat) return false;
  if (w.length !== c.len || !GK.isWord(w) || (M.first && w.charAt(0) !== M.first)) return false;
  for (k = 0; k < b.rows.length; k++) if (b.rows[k].w === w) return false;
  m = GK.evalGuess(w, M.secret); b.rows.push({ w: w, m: m, s: seat }); k = b.rows.length; M.to = 0;
  if (w === M.secret) {
    b.done = b.win = true; g = GK.points(c.tries, k);
    if (c.kind === 'race' && c.n > 1 && M.firstSolve < 0) g += 5;
    if (M.firstSolve < 0) M.firstSolve = seat;
    M.gains[seat] = g; M.scores[seat] += g;
    if (c.kind === 'race' && c.n > 1) { var dl = Date.now() + 60000; if (!M.deadline || M.deadline > dl) M.deadline = dl; }
  } else if (k >= c.tries) b.done = true;
  if (c.kind === 'turn') { if (b.done) endRound(); else nextTurn(); }
  else if (M.boards.every(function (x) { return x.done; })) endRound();
  else sync();
  return true;
}
function nextTurn() {
  var M = G.M, c = M.cfg;
  M.turn = (M.turn + 1) % c.n; M.botAt = {};
  M.deadline = c.time ? Date.now() + c.time * 1000 : 0;
  sync();
}
function bump(st, win, k, no) {
  st.p++;
  if (win) { st.w++; st.cur = (no && st.lastWin !== no - 1 && st.lastWin !== no) ? 1 : st.cur + 1; if (no) st.lastWin = no; if (st.cur > st.max) st.max = st.cur; st.dist[Math.min(k, 6) - 1]++; }
  else st.cur = 0;
}
function endRound() {
  var M = G.M, c = M.cfg;
  M.phase = (c.rounds > 0 && M.round >= c.rounds) ? 'mend' : 'rend';
  M.deadline = 0;
  M.boards.forEach(function (b) { b.done = true; });
  M.res = { secret: M.secret, gains: M.gains.slice(), hints: M.hints.rev.length + (M.hints.mean ? 1 : 0) };
  if (M.mode === 'solo' || M.mode === 'daily') { bump(S.st[M.mode], M.boards[0].win, M.boards[0].rows.length, M.mode === 'daily' ? M.no : 0); saveS(); }
  if (M.mode === 'host' && M.phase === 'rend') M.autoNext = Date.now() + 45000;
  sync();
}
GK.giveUp = function () { var M = G.M; if (M && M.phase === 'play' && M.cfg.n === 1) endRound(); };
GK.nextRound = function () { var M = G.M; if (!M || M.phase !== 'rend' || M.mode === 'guest') return; if (UI.endOpen) closeSheet(); newRound(); };
GK.rematch = function () {
  var M = G.M; if (!M) return;
  if (M.mode === 'host') { GK.hostStart(true); return; }
  if (UI.endOpen) closeSheet();
  GK.startMatch({ mode: M.mode, cfg: M.cfg, names: M.names, kinds: M.kinds, diff: M.diff });
};
/* ipucu: harf aç / anlam (yalnız tek kişilik oyunlarda) */
GK.hintReveal = function () {
  var M = G.M; if (!M || M.phase !== 'play' || (M.mode !== 'solo' && M.mode !== 'daily')) return;
  var c = M.cfg, kn = knownOf(view(0)), un = [], i;
  for (i = 0; i < c.len; i++) if (!kn[i]) un.push(i);
  if (M.hints.rev.length >= 2 || un.length < 2) return;
  i = un[rnd(un.length)]; M.hints.rev.push({ i: i, c: M.secret.charAt(i) });
  closeSheet(); sync(); SND.ping(); note(up(M.secret.charAt(i)) + ' harfi ' + (i + 1) + '. sırada');
};
GK.hintMean = function () {
  var M = G.M; if (!M || M.phase !== 'play' || (M.mode !== 'solo' && M.mode !== 'daily')) return;
  M.hints.mean = true; sync(); GK.sheetHint();
};

/* saat: süre dolması, bilgisayar oyuncuları, sayaç */
function botDelay(turn) {
  var M = G.M, d = M.diff;
  if (turn) return 2200 + rnd(2600);
  return ([0, 13, 8, 5][d] + rnd([0, 9, 7, 5][d])) * 1000 * (M.cfg.len / 5);
}
function tick() {
  var M = G.M, now = Date.now(), c, s, b, turn;
  if (M && M.mode !== 'guest') {
    c = M.cfg; turn = c.kind === 'turn';
    if (M.phase === 'play') {
      if (M.deadline && now >= M.deadline) {
        if (turn && c.n > 1) { M.to++; if (M.to >= c.n) endRound(); else { if (M.turn === mySeat() && M.mode !== 'local') toast('Süre doldu, sıra geçti'); nextTurn(); } }
        else endRound();
        return;
      }
      for (s = 0; s < c.n; s++) {
        if (kindOf(s) !== 'bot') continue;
        b = M.boards[turn ? 0 : s];
        if (b.done || (turn && M.turn !== s)) continue;
        if (!M.botAt[s]) { M.botAt[s] = now + botDelay(turn); continue; }
        if (now >= M.botAt[s]) { delete M.botAt[s]; applyGuess(s, GK.botPick(c.len, b.rows, M.first, M.diff)); return; }
      }
    } else if (M.phase === 'rend' && M.autoNext && now >= M.autoNext) { GK.nextRound(); return; }
  }
  timerUI();
}
function startTick() { if (!G.tick) G.tick = setInterval(tick, 250); }
function stopTick() { if (G.tick) { clearInterval(G.tick); G.tick = null; } }

/* ====================== GÖRÜNÜM ====================== */
function setView(V) {
  G.V = V;
  if (V.left >= 0) { G.dl = Date.now() + V.left; var tot = (V.cfg.time || 60) * 1000; G.dlT = Math.max(tot, V.left); if (V.fs >= 0 && V.cfg.kind === 'race') G.dlT = Math.min(G.dlT, 60000); }
  else G.dl = 0;
  render();
}
function myBoard(V) { return V.boards[V.cfg.kind === 'turn' ? 0 : V.me]; }
function knownOf(V) {
  var kn = GK.known(myBoard(V).rows, V.cfg.len, V.first), i;
  for (i = 0; i < V.rev.length; i++) kn[V.rev[i].i] = V.rev[i].c;
  return kn;
}
function canType() {
  var V = G.V; if (!V || V.phase !== 'play') return false;
  if (myBoard(V).done) return false;
  return V.cfg.kind !== 'turn' || V.turn === V.me;
}
function buildBoard(c) {
  var h = '', r, i;
  for (r = 0; r < c.tries; r++) { h += '<div class="rw">'; for (i = 0; i < c.len; i++) h += '<div class="cl"><b></b></div>'; h += '</div>'; }
  $('#board').innerHTML = h;
  G.rows = [].slice.call($('#board').children);
}
function buildKb() {
  var h = '', r, i, k;
  for (r = 0; r < 3; r++) {
    h += '<div class="kr">';
    if (r === 2) h += '<button class="k w ent" data-k="ent">GİR</button>';
    for (i = 0; i < KROWS[r].length; i++) { k = KROWS[r].charAt(i); h += '<button class="k" data-k="' + k + '">' + up(k) + '</button>'; }
    if (r === 2) h += '<button class="k w" data-k="del" aria-label="Sil"><svg class="i"><path d="M9 6h11v12H9l-5-6z"/><path d="M12 10l4 4M16 10l-4 4"/></svg></button>';
    h += '</div>';
  }
  $('#kb').innerHTML = h;
}
function layout() {
  var V = G.V; if (!V || !gameOn()) return;
  var c = V.cfg, g = $('#game'), ih = root.innerHeight, land = root.innerWidth > ih && ih <= 540;
  var f = { kucuk: .058, orta: .066, buyuk: .075 }[S.kb] || .066;
  var kh = land ? Math.max(30, Math.min(48, (ih - 110) / 3.5)) : Math.max(38, Math.min(62, ih * f));
  g.style.setProperty('--kh', Math.round(kh) + 'px');
  var st = $('#stage'), w = st.clientWidth, h = st.clientHeight;
  var u = Math.floor(Math.min((w - 16) / (c.len * 1.11 + .32), (h - 20) / (c.tries * 1.11 + .34), 70));
  if (u < 20) u = 20;
  g.style.setProperty('--u', u + 'px');
}
GK.onResize = function () { layout(); };

function setCell(el, ch, cl) { el.className = 'cl' + (cl ? ' ' + cl : ''); el.firstChild.textContent = ch ? up(ch) : ''; }
function paintRow(r, row, anim) {
  var cells = G.rows[r].children, n = cells.length, i, fast = S.anim === 'fast', step = fast ? 110 : 220, half = fast ? 120 : 220;
  var who = G.rows[r].querySelector('.who'); if (who) who.parentNode.removeChild(who);
  if (G.V.cfg.kind === 'turn' && G.V.cfg.n > 1 && row.s != null) { who = document.createElement('i'); who.className = 'who'; who.style.background = GK.COLS[row.s % 4]; G.rows[r].appendChild(who); }
  if (!anim || S.anim === 'off' || S.perf) { for (i = 0; i < n; i++) setCell(cells[i], row.w.charAt(i), 's' + row.m.charAt(i)); return 0; }
  for (i = 0; i < n; i++) (function (i) {
    var el = cells[i];
    setCell(el, row.w.charAt(i), 'ty');
    if (fast) { el.style.webkitAnimationDuration = '.24s'; el.style.animationDuration = '.24s'; } else { el.style.webkitAnimationDuration = ''; el.style.animationDuration = ''; }
    setTimeout(function () { cls(el, 'fl', true); SND.flip(+row.m.charAt(i)); }, i * step);
    setTimeout(function () { el.className = 'cl fl s' + row.m.charAt(i); }, i * step + half);
  })(i);
  var total = (n - 1) * step + half * 2 + 60;
  if (row.m.indexOf('0') < 0 && row.m.indexOf('1') < 0) {
    for (i = 0; i < n; i++) (function (i) { setTimeout(function () { cells[i].style.webkitAnimationDuration = ''; cells[i].style.animationDuration = ''; cells[i].className = 'cl s2 win'; }, total + i * 80); })(i);
    total += n * 80 + 420;
  }
  return total;
}
function paintActive(pop) {
  var V = G.V; if (!V) return;
  var mb = myBoard(V), r = mb.rows.length, c = V.cfg;
  if (mb.done || r >= c.tries || V.phase !== 'play') return;
  var cells = G.rows[r].children, kn = S.ghost ? knownOf(V) : [], i, ch, act = canType();
  if (V.first && G.buf.charAt(0) !== V.first) G.buf = V.first;
  if (!V.first && !act) G.buf = '';
  for (i = 0; i < c.len; i++) {
    ch = G.buf.charAt(i);
    if (ch) setCell(cells[i], ch, (i === 0 && V.first ? 'lk' : 'ty') + (pop && i === G.buf.length - 1 ? ' pop' : ''));
    else setCell(cells[i], kn[i] || '', (kn[i] ? 'gh' : '') + (act && i === G.buf.length ? ' cur' : ''));
  }
}
function paintKeys() {
  var V = G.V; if (!V) return;
  var st = GK.keyStates(myBoard(V).rows), ks = $('#kb').querySelectorAll('.k'), i, k;
  for (i = 0; i < ks.length; i++) { k = ks[i].getAttribute('data-k'); if (k.length === 1) ks[i].className = 'k' + (st[k] !== undefined ? ' s' + st[k] : ''); }
}
function miniHtml(b, c) {
  var h = '<div class="mb">', r, i;
  for (r = 0; r < c.tries; r++) { h += '<div>'; for (i = 0; i < c.len; i++) h += '<i' + (b.rows[r] ? ' class="s' + b.rows[r].m.charAt(i) + '"' : '') + '></i>'; h += '</div>'; }
  return h + '</div>';
}
function kdLabel(V, s) { return V.kd[s] === 'bot' ? 'Bilgisayar' : ''; }
function renderOpps() {
  var V = G.V, c = V.cfg, h = '', s, b, turn = c.kind === 'turn';
  if (c.n > 1) for (s = 0; s < c.n; s++) {
    if (!turn && s === V.me) continue;
    b = turn ? null : V.boards[s];
    h += '<div class="op' + (turn && V.turn === s && V.phase === 'play' ? ' act' : '') + (turn && s === V.me && V.mode !== 'local' ? ' me' : '') + '">' + (!turn && c.n > 2 ? '' : '<i class="av" style="background:' + GK.COLS[s % 4] + '">' + GK.initial(V.names[s]) + '</i>') +
      '<div class="nm"><b' + (!turn && c.n > 2 ? ' style="color:' + GK.COLS[s % 4] + '"' : '') + '>' + esc(V.names[s]) + '</b><small>' + V.scores[s] + ' puan</small></div>' +
      (b ? (b.win ? '<span class="ok">✓</span>' : '') + miniHtml(b, c) : '') + '</div>';
  }
  $('#opps').innerHTML = h;
}
function hud() {
  var V = G.V; if (!V) return;
  var c = V.cfg, t1, t2, mb = myBoard(V), turn = c.kind === 'turn', online = V.mode === 'host' || V.mode === 'guest';
  if (V.mode === 'daily') { t1 = 'Günün kelimesi #' + V.no; t2 = mb.done ? (mb.win ? 'Bildin' : 'Olmadı') : (mb.rows.length + 1) + '. tahmin'; }
  else if (V.mode === 'solo') { t1 = 'Serbest · ' + c.len + ' harf' + (V.first ? ' · ilk harf açık' : ''); t2 = (S.st.solo.cur ? 'Seri ' + S.st.solo.cur + ' · ' : '') + (mb.done ? 'Bitti' : (mb.rows.length + 1) + '. tahmin'); }
  else if (turn) {
    t1 = V.phase !== 'play' ? 'Tur bitti' : (V.mode === 'local' ? 'Sıra: ' + V.names[V.turn] : (V.turn === V.me ? 'Sıra sende' : 'Sıra: ' + V.names[V.turn]));
    t2 = 'Tur ' + V.round + '/' + c.rounds;
  } else {
    t1 = V.phase !== 'play' ? 'Tur bitti' : (mb.done ? (mb.win ? 'Bildin! Diğerleri bekleniyor' : 'Hakkın bitti') : 'Yarış · ' + V.scores[V.me] + ' puan');
    t2 = 'Tur ' + V.round + '/' + c.rounds;
  }
  $('#st1').textContent = t1; G.st2 = t2;
  $('#aChat').style.display = online ? '' : 'none';
  $('#chBadge').textContent = Net.unread ? String(Net.unread) : '';
  $('#aRules').style.display = online ? 'none' : '';
  $('#aScore').lastChild.nodeValue = (V.mode === 'solo' || V.mode === 'daily') ? 'İstatistik' : 'Puan';
  cls($('#kb'), 'off', !canType() && V.phase === 'play');
  var ent = $('#kb').querySelector('.ent'); if (ent) { ent.textContent = V.phase === 'play' ? 'GİR' : 'SONUÇ'; ent.style.fontSize = V.phase === 'play' ? '' : '10.5px'; }
  timerUI();
}
function timerUI() {
  var V = G.V, tb = $('#tbar'), s2 = $('#st2'); if (!V || !gameOn()) return;
  if (V.phase !== 'play' || !G.dl) { cls(tb, 'on', false); s2.textContent = G.st2; cls(s2, 'hot', false); return; }
  var left = Math.max(0, G.dl - Date.now()), sec = Math.ceil(left / 1000), hot = sec <= 10;
  cls(tb, 'on', true); cls(tb, 'hot', hot); tb.firstChild.style.width = Math.min(100, left / G.dlT * 100).toFixed(1) + '%';
  s2.textContent = G.st2 + ' · ' + Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2); cls(s2, 'hot', hot);
  if (hot && sec !== G.lastSec && sec > 0 && canType()) SND.tick();
  G.lastSec = sec;
}
var noteT = null;
function note(msg, ms) { var n = $('#note'); n.firstChild.textContent = msg; n.className = 'on'; if (noteT) clearTimeout(noteT); noteT = setTimeout(function () { n.className = ''; }, ms || 2200); }
GK.note = note;

function render() {
  var V = G.V; if (!V) return;
  var c = V.cfg, turn = c.kind === 'turn', mb = myBoard(V), fresh = false, r, d = 0;
  var key = V.id + '|' + V.round + '|' + c.len + '|' + (turn ? 't' : V.me);
  if (key !== G.key) {
    G.key = key; G.painted = 0; G.buf = ''; G.pend = false; G.busy = 0; G.lastTurn = -1; fresh = true;
    buildBoard(c); hideCoach();
    if (UI.endOpen) closeSheet();
  }
  layout();
  if (mb.rows.length > G.painted) { G.buf = ''; G.pend = false; }
  for (r = G.painted; r < mb.rows.length; r++) d = Math.max(d, paintRow(r, mb.rows[r], !fresh && r === mb.rows.length - 1));
  G.painted = mb.rows.length;
  if (d) { G.busy = Date.now() + d; setTimeout(function () { if (G.V) { paintKeys(); paintActive(); } }, d); }
  else { paintKeys(); paintActive(); }
  renderOpps(); hud();
  if (turn && c.n > 1 && V.phase === 'play' && V.turn !== G.lastTurn) {
    G.lastTurn = V.turn;
    if (V.mode === 'local') { if (mb.rows.length) setTimeout(function () { note('Sıra ' + V.names[V.turn] + ' oyuncusunda'); }, d); }
    else if (V.turn === V.me) { setTimeout(function () { SND.turn(); vib(30); note('Sıra sende'); }, d); }
  }
  if (V.phase === 'play') coachAuto(d);
  else { var ek = key + V.phase; if (ek !== G.endKey) { G.endKey = ek; setTimeout(function () { if (G.V && G.endKey === ek) roundEndFx(); }, d + 250); } }
}
GK.render = render;

/* ---------- klavye ---------- */
function shake(msg) {
  var V = G.V, r = G.rows[myBoard(V).rows.length]; if (!r) return;
  cls(r, 'shake', false); void r.offsetWidth; cls(r, 'shake', true);
  SND.err(); vib([30, 40, 30]); if (msg) note(msg);
}
function submit() {
  var V = G.V, c = V.cfg, w = G.buf, mb = myBoard(V), i, e;
  if (w.length < c.len) { shake('Kelime ' + c.len + ' harfli olmalı'); return; }
  if (!GK.isWord(w)) { shake('Bu kelime sözlükte yok'); return; }
  for (i = 0; i < mb.rows.length; i++) if (mb.rows[i].w === w) { shake('Bu kelimeyi zaten denedin'); return; }
  if (S.hard) { e = GK.hardCheck(mb.rows, w); if (e) { shake('Zor mod: ' + e); return; } }
  if (G.mode === 'guest') { Net.sendHost({ t: 'act', a: 'g', w: w, r: V.round }); G.pend = true; setTimeout(function () { G.pend = false; }, 4000); }
  else applyGuess(mySeat(), w);
}
GK.key = function (k) {
  var V = G.V; if (!V || !gameOn()) return;
  GK.resetIdle();
  if (V.phase !== 'play') { if (k === 'ent') showEnd(); return; }
  if (Date.now() < G.busy || G.pend) return;
  if (!canType()) {
    if (k === 'ent' || k.length === 1) note(myBoard(V).done ? 'Bu turu bitirdin; diğer oyuncular bekleniyor' : 'Sıra ' + V.names[V.turn] + ' oyuncusunda');
    return;
  }
  hideCoach();
  if (k === 'del') { if (G.buf.length > (V.first ? 1 : 0)) { G.buf = G.buf.slice(0, -1); SND.del(); paintActive(); } return; }
  if (k === 'ent') { submit(); return; }
  if (G.buf.length < V.cfg.len && GK.LETTERS.indexOf(k) >= 0) { G.buf += k; SND.key(); vib(8); paintActive(true); }
};

/* ---------- öğretici ipuçları ---------- */
function coach(id, title, text) {
  if (!S.coach || S.seen[id] || $('#coach').className === 'on' || $('#ov').className === 'on') return false;
  G.coachId = id; $('#cTitle').textContent = title; $('#cText').innerHTML = text; $('#coach').className = 'on'; return true;
}
function hideCoach() { if ($('#coach').className === 'on') { $('#coach').className = ''; if (G.coachId) { S.seen[G.coachId] = 1; saveS(); } } }
GK.hideCoach = hideCoach;
function coachAuto(delay) {
  var V = G.V, c = V.cfg, n = myBoard(V).rows.length;
  setTimeout(function () {
    if (!G.V || G.V.phase !== 'play') return;
    if (n === 0 && coach('start', 'Nasıl oynanır?', 'Klavyeden <b>' + c.len + ' harfli</b> bir kelime yaz ve <b>GİR</b>’e bas. Harflerin rengi seni gizli kelimeye götürür. ' + c.tries + ' hakkın var.')) return;
    if (n === 0 && V.first && coach('first', 'İlk harf açık', 'Gizli kelimenin ilk harfi verildi. Bütün tahminlerin bu harfle başlamalı.')) return;
    if (n === 0 && c.n > 1 && c.kind === 'race' && coach('race', 'Yarış', 'Herkes aynı kelimeyi kendi tahtasında arar. Üstte rakiplerinin renklerini görürsün, harflerini göremezsin. Az tahminde bulan çok puan alır; ilk bulan +5.')) return;
    if (n === 0 && c.n > 1 && c.kind === 'turn' && coach('turn', 'Sırayla', 'Tahta ortak: herkes sırayla bir tahmin yapar ve bütün ipuçlarını birlikte görür. Kelimeyi bulan puanı alır.')) return;
    if (n === 1 && coach('colors', 'Renkler ne diyor?', '<b style="color:var(--g1)">Yeşil</b>: harf doğru yerde. <b style="color:var(--y1)">Sarı</b>: harf kelimede var, yeri yanlış. <b style="color:#aaa">Gri</b>: harf kelimede yok. Klavye de aynı renkleri alır.')) return;
    if (n === 3 && (V.mode === 'solo' || V.mode === 'daily')) coach('hint', 'Takıldın mı?', 'Alttaki <b>İpucu</b> düğmesi kaç olası kelime kaldığını söyler; istersen bir harf açar ya da kelimenin anlamını gösterir.');
  }, (delay || 0) + 350);
}

/* ---------- tur / oyun sonu ---------- */
function confetti() {
  if (S.perf || S.anim === 'off') return;
  var cs = ['#f0d48a', '#46c483', '#f3cf66', '#8fc3ff', '#ff9a8a'], i, d;
  for (i = 0; i < 36; i++) { d = document.createElement('i'); d.className = 'conf'; d.style.left = rnd(100) + '%'; d.style.background = cs[i % 5]; d.style.webkitAnimationDelay = d.style.animationDelay = (rnd(70) / 100) + 's'; document.body.appendChild(d); (function (d) { setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 3400); })(d); }
}
function ranking(V) { var o = V.names.map(function (n, i) { return i; }); o.sort(function (a, b) { return V.scores[b] - V.scores[a]; }); return o; }
function roundEndFx() {
  var V = G.V, c = V.cfg, mb = myBoard(V), single = c.n === 1, good;
  if (G.quiet) { G.quiet = false; showEnd(); return; }
  if (V.phase === 'mend' && !single) {
    var rk = ranking(V), top = V.scores[rk[0]], tie = V.scores[rk[1]] === top, meS = V.mode === 'local' ? -1 : V.me;
    good = V.mode === 'local' || (V.scores[meS] === top);
    var sk = V.id + 'm';
    if (meS >= 0 && G.statKey !== sk) { G.statKey = sk; if (tie && good) S.st.vs.d++; else if (good) S.st.vs.w++; else S.st.vs.l++; saveS(); }
  } else good = single ? mb.win : (c.kind === 'turn' ? (V.mode === 'local' ? mb.win : (mb.win && mb.rows[mb.rows.length - 1].s === V.me)) : mb.win);
  if (good) { SND.win(); confetti(); vib([40, 60, 40]); } else SND.lose();
  showEnd();
}
function distHtml(st, hi) {
  var mx = 1, i, h = '<div class="dist">';
  for (i = 0; i < 6; i++) if (st.dist[i] > mx) mx = st.dist[i];
  for (i = 0; i < 6; i++) h += '<div><em>' + (i + 1) + '</em><i' + (hi === i + 1 ? ' class="h"' : '') + ' style="width:' + Math.max(8, Math.round(st.dist[i] / mx * 88)) + '%">' + st.dist[i] + '</i></div>';
  return h + '</div>';
}
function statBlock(st, hi) {
  return '<div class="stg"><div><b>' + st.p + '</b><small>Oyun</small></div><div><b>' + (st.p ? Math.round(st.w / st.p * 100) : 0) + '</b><small>Başarı %</small></div><div><b>' + st.cur + '</b><small>Seri</small></div><div><b>' + st.max + '</b><small>En iyi seri</small></div></div>' +
    '<h3>Kaçıncı tahminde bildin</h3>' + distHtml(st, hi);
}
GK.statBlock = statBlock;
function meanHtml(w) { var m = GK.meaning(w); return m ? '<div class="mean"><small>' + esc(up(w)) + ' · anlamı</small><span>' + esc(m) + '</span></div>' : ''; }
function showEnd() {
  var V = G.V; if (!V || V.phase === 'play' || !V.res) return;
  var c = V.cfg, mb = myBoard(V), single = c.n === 1, sec = V.res.secret, h = '', turn = c.kind === 'turn', online = V.mode === 'host' || V.mode === 'guest', s, t;
  var final = V.phase === 'mend' && !single, rk = ranking(V);
  if (single) t = mb.win ? ['Harika!', 'Şahane!', 'Çok iyi!', 'Güzel!', 'İyi iş!', 'Kıl payı!'][Math.min(mb.rows.length, 6) - 1] : 'Bu sefer olmadı';
  else if (final) { var top = V.scores[rk[0]]; t = V.scores[rk[1]] === top ? 'Berabere!' : (rk[0] === V.me && V.mode !== 'local' ? 'Kazandın!' : 'Kazanan: ' + esc(V.names[rk[0]])); }
  else if (turn) t = mb.win ? esc(V.names[mb.rows[mb.rows.length - 1].s]) + ' bildi!' : 'Kimse bilemedi';
  else t = mb.win ? 'Bildin!' : 'Bu tur olmadı';
  h += '<div class="win-t">' + t + '</div><p class="note" style="margin:0">' + (single ? (mb.win ? mb.rows.length + '. tahminde buldun' : 'Gizli kelime şuydu') : (final ? 'Oyun bitti · son kelime' : 'Tur ' + V.round + '/' + c.rounds + ' · gizli kelime')) + '</p>';
  h += GK.figRow(sec, new Array(sec.length + 1).join('2'), sec.length > 5) + meanHtml(sec);
  if (single) {
    if (V.res.hints) h += '<p class="note">' + V.res.hints + ' ipucu kullandın.</p>';
    h += statBlock(S.st[V.mode], mb.win ? mb.rows.length : 0);
    if (V.mode === 'daily') h += '<p class="note">Yeni kelime gece yarısı gelir.</p><button class="btn pri sm" data-act="shareDay">Sonucu paylaş</button><div class="gap"></div><button class="btn sm" data-act="soloGo">Serbest oyun oyna</button>';
    else h += '<div class="gap"></div><button class="btn pri sm" data-act="nextRound">Yeni kelime</button>';
  } else {
    h += '<h3>' + (final ? 'Son durum' : 'Puan durumu') + '</h3>';
    for (var q = 0; q < rk.length; q++) {
      s = rk[q]; var b = turn ? null : V.boards[s], g = V.res.gains[s];
      h += '<div class="sc' + (final && q === 0 ? ' win' : '') + '"><i class="av" style="background:' + GK.COLS[s % 4] + '">' + GK.initial(V.names[s]) + '</i><div class="nm"><b>' + esc(V.names[s]) + (s === V.me && V.mode !== 'local' ? ' (sen)' : '') + '</b><small>' +
        (b ? (b.win ? b.rows.length + '. tahminde bildi' : 'Bilemedi') : (g ? 'Kelimeyi buldu' : kdLabel(V, s) || '&nbsp;')) + '</small></div><div class="pp">' + (g ? '+' + g : '') + '</div><div class="tt">' + V.scores[s] + '</div></div>';
    }
    h += '<div class="gap"></div>';
    if (V.mode === 'guest') h += '<p class="note">' + (final ? 'Ev sahibi yeni oyun başlatabilir' : 'Ev sahibi sonraki kelimeyi başlatacak') + '<span class="dots"></span></p>';
    else h += '<button class="btn pri sm" data-act="' + (final ? 'rematch' : 'nextRound') + '">' + (final ? 'Tekrar oyna' : 'Sonraki kelime') + '</button>';
    if (online) h += '<div class="gap"></div><button class="btn sm" data-act="chat2">Sohbet' + (Net.unread ? ' (' + Net.unread + ')' : '') + '</button>';
  }
  h += '<div class="gap"></div><button class="btn sm" data-act="close">Tahtayı gör</button><div class="gap"></div><button class="btn sm" data-act="home2">Ana menü</button>';
  openSheet(h, { end: true });
}
GK.showEnd = showEnd;
GK.shareDay = function () {
  var V = G.V; if (!V) return;
  var mb = myBoard(V), em = S.renk === 'kontrast' ? ['⬛', '🟦', '🟧'] : ['⬛', '🟨', '🟩'];
  var txt = 'Gizli Kelime #' + V.no + ' · ' + (mb.win ? mb.rows.length : 'X') + '/' + V.cfg.tries + (V.res && V.res.hints ? ' 💡' : '') + '\n' +
    mb.rows.map(function (r) { return r.m.split('').map(function (x) { return em[+x]; }).join(''); }).join('\n') + '\n' + location.href.split('#')[0].split('?')[0];
  if (navigator.share) { try { navigator.share({ text: txt }); return; } catch (e) {} }
  try { navigator.clipboard.writeText(txt); toast('Sonuç kopyalandı; istediğin yere yapıştır'); } catch (e) { toast('Paylaşılamadı'); }
};

/* ---------- ipucu paneli ---------- */
GK.sheetHint = function () {
  var V = G.V; if (!V) return;
  if (V.phase !== 'play') { showEnd(); return; }
  var c = V.cfg, mb = myBoard(V), st = GK.keyStates(mb.rows), fr = 'aeiklrnıtmusdoyübşzgçhpcvöfğj', un = '', i, h = '<h2>İpucu</h2>', single = c.n === 1 && (V.mode === 'solo' || V.mode === 'daily');
  for (i = 0; i < fr.length && un.length < 8; i++) if (st[fr.charAt(i)] === undefined) un += fr.charAt(i);
  if (single) {
    var cand = GK.candidates(c.len, mb.rows, V.first).filter(function (w) { for (var j = 0; j < V.rev.length; j++) if (w.charAt(V.rev[j].i) !== V.rev[j].c) return false; return true; });
    h += '<p style="text-align:center">' + (mb.rows.length || V.first || V.rev.length ? 'Şu ana kadarki ipuçlarına uyan <b>' + cand.length + '</b> olası kelime kaldı.' : 'Henüz tahmin yapmadın. İlk tahminde çok kullanılan harfleri dene.') + '</p>';
  }
  h += '<h3>Henüz denemediğin sık harfler</h3><div class="lets">' + un.split('').map(function (x) { return '<i>' + up(x) + '</i>'; }).join('') + '</div>';
  if (single) {
    var kn = knownOf(V), unk = kn.filter(function (x) { return !x; }).length, can = V.rev.length < 2 && unk >= 2;
    h += '<div class="hopt"><div class="at"><b>Bir harf aç</b><p>Bulunmamış bir harfi yerinde gösterir. Kalan hak: ' + (2 - V.rev.length) + '</p></div><button class="btn pri" data-act="hintRev"' + (can ? '' : ' disabled') + '>Aç</button></div>';
    var mean = GK.meaning(G.M.secret);
    if (V.hm) h += '<div class="mean"><small>Gizli kelimenin anlamı</small><span>' + esc(mean || 'Anlam bulunamadı.') + '</span></div>';
    else h += '<div class="hopt"><div class="at"><b>Anlamını göster</b><p>Gizli kelimenin sözlük anlamını okursun.</p></div><button class="btn pri" data-act="hintMean"' + (mean ? '' : ' disabled') + '>Göster</button></div>';
    h += '<p class="note">Kullandığın ipuçları sonuç ekranında belirtilir.</p>';
  } else h += '<p class="note">Çok oyunculu oyunda harf açma ve anlam ipucu kapalıdır; herkes eşit şartta oynar.</p>';
  h += '<h3>Taktik</h3><ul class="tip"><li>Sarı harfi bir sonraki tahminde <b>başka bir yere</b> koy.</li><li>Gri harfleri tekrar kullanma; klavyede sönük görünürler.</li><li>Aynı harf kelimede iki kez olabilir.</li></ul>' +
    '<div class="gap"></div><button class="btn sm" data-act="close">Kapat</button>';
  openSheet(h);
};

/* ---------- oyundan çıkış ---------- */
GK.leaveGame = function () {
  var M = G.M;
  if (G.mode === 'host' || G.mode === 'guest') Net.stopAll();
  stopTick(); closeSheet(); hideCoach();
  G.M = null; G.V = null; G.mode = null; G.key = '';
  show('home');
};
GK.hasSave = function () { var s = LS.get('gizli.save', null); return s && s.mode === 'solo' && s.phase === 'play' && s.boards ? s : null; };
function resume(M) { G.quiet = M.phase !== 'play'; G.M = M; G.mode = M.mode; M.deadline = 0; M.botAt = {}; G.key = ''; G.endKey = ''; show('game'); startTick(); setView(view(0)); GK.wake(); }
GK.loadGame = function () { var s = GK.hasSave(); if (!s) return false; resume(s); return true; };
GK.startSolo = function () {
  var c = S.solo;
  GK.startMatch({ mode: 'solo', cfg: { n: 1, kind: 'race', len: c.len, tries: 6, first: !!c.first, rounds: 0, time: 0 }, names: [S.name || 'Sen'], kinds: ['me'] });
};
GK.startDaily = function () {
  var no = GK.dayNo(), sv = LS.get('gizli.gun', null);
  if (sv && sv.no === no && sv.M && sv.M.boards) { resume(sv.M); return; }
  GK.startMatch({ mode: 'daily', cfg: { n: 1, kind: 'race', len: 5, tries: 6, first: false, rounds: 1, time: 0 }, names: [S.name || 'Sen'], kinds: ['me'], secret: GK.dailyWord(no), no: no });
};
GK.dailyState = function () { var no = GK.dayNo(), sv = LS.get('gizli.gun', null); return sv && sv.no === no && sv.M ? sv.M : null; };

/* ====================== ÇEVRİMİÇİ KANCALAR ====================== */
H.names = function () { return G.V ? G.V.names : []; };
H.inGame = function () { return !!(G.V && gameOn() && G.V.phase === 'play' && G.V.cfg.n > 1); };
H.hud = function () { if (G.V && gameOn()) hud(); };
H.onGuestAct = function (seat, d) { var M = G.M; if (M && d.a === 'g' && d.r === M.round && typeof d.w === 'string') applyGuess(seat, GK.low(d.w).slice(0, 8)); };
H.onSeatLost = function (seat, name, left) { toast(name + (left ? ' oyundan ayrıldı' : ' bağlantısı koptu') + '; yerine bilgisayar oynuyor', 3000); if (G.M) sync(); };
H.onSeatBack = function (seat) { if (G.M) { toast(Net.seatName(seat) + ' geri döndü'); sync(); } };
GK.hostStart = function (again) {
  var r = Net.room; if (!r) return;
  var c = r.cfg, names = [], pool = GK.BOTN.slice(), i;
  for (i = 0; i < c.n; i++) { var s = r.seats[i]; if (s.kind === 'emp') { s.name = s.name || pool.splice(rnd(pool.length), 1)[0]; } names.push(s.name); }
  r.started = true; if (!again) Net.resetChat();
  closeSheet();
  GK.startMatch({ mode: 'host', cfg: { n: c.n, kind: c.kind, len: c.len, tries: 6, first: !!c.first, rounds: c.rounds, time: TEMPO[c.kind][c.tempo] }, names: names, kinds: [], diff: 2 });
};
H.onGuestState = function (v) {
  G.M = null; G.mode = 'guest';
  if (!gameOn()) { closeSheet(); show('game'); GK.wake(); }
  startTick(); setView(v);
};
H.onHostDown = function () { toast('Bağlantı koptu, yeniden bağlanılıyor…', 4000); };
H.onReconnected = function () { toast('Yeniden bağlandın', 2000); };
H.onHostGone = function (msg) { stopTick(); closeSheet(); hideCoach(); G.M = null; G.V = null; G.mode = null; G.key = ''; show('home'); toast(msg, 3200); };

/* fiziksel klavye */
document.addEventListener('keydown', function (e) {
  if (!gameOn() || $('#ov').className === 'on' || e.ctrlKey || e.metaKey || e.altKey) return;
  var k = e.key;
  if (k === 'Enter') { GK.audio(); GK.key('ent'); e.preventDefault(); }
  else if (k === 'Backspace') { GK.key('del'); e.preventDefault(); }
  else if (k && k.length === 1) { k = GK.low(k); if (GK.LETTERS.indexOf(k) >= 0) { GK.audio(); GK.key(k); } }
});
buildKb();
})(window);
