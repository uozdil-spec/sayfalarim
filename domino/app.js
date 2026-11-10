/* Domino · oyun akışı: dağıtım, sıra, bot, el sonu, kayıt, çevrimiçi senkron  (by uozdil) */
(function (root) {
'use strict';
var DM = root.DM, $ = DM.$, S = DM.S, LS = DM.LS, esc = DM.esc, rnd = DM.rnd, UI = DM.UI, Net = DM.Net, SND = DM.SND, vib = DM.vib,
  toast = DM.toast, saveS = DM.saveS, openSheet = DM.openSheet, closeSheet = DM.closeSheet, H = DM.hooks;

var G = DM.G = { mode: null, st: null, cfg: null, names: [], kinds: [], diff: 2, me: 0, scores: [], round: 1, sel: null, hints: null, sort: 'id',
  timer: null, matchOver: false, res: null, endHands: null, cover: false, histG: false, skipPop: false, hintOn: false, prevLen: -1, lastShown: '' };

function unit(seat) { return G.cfg.team && G.cfg.n === 4 ? seat % 2 : seat; }
function yardN(st) { return st.yardN != null ? st.yardN : (st.yard ? st.yard.length : 0); }
function kindOf(seat) {
  if (G.mode === 'ai') return seat === 0 ? 'me' : 'bot';
  if (G.mode === 'local') return 'human';
  if (G.mode === 'host') return seat === 0 ? 'me' : Net.seatKind(seat);
  return seat === G.me ? 'me' : 'other';
}
DM.kindOf = kindOf;
/* El bittiyse (son taş kondu, sonuç ekranı gelmek üzere) artık hamle yok: o kısa arada
   "Pas/Çek"e basılırsa el sonu sayacı sıfırlanıp oyun takılıyordu. Misafirde eller gizli olduğu için bakılmaz. */
function roundDone() { return !!(G.st && G.mode !== 'guest' && DM.checkEnd(G.st)); }
function myTurn() { return !!(G.st && !G.st.over && G.st.turn === G.me && !G.cover && G.mode !== null && !roundDone()); }
DM.myTurn = myTurn;
H.names = function () { return G.names; };
H.inGame = function () { return !!(G.mode && G.st && !G.st.over && $('#game').className.indexOf('on') >= 0); };
H.hud = function () { hud(); };

/* ---------------- ekranlar ---------------- */
function showScreen(id) {
  ['home', 'game'].forEach(function (n) { $('#' + n).className = 'screen' + (n === id ? ' on' : ''); });
  closeHintPanel(); hideCoach();
  if (id === 'game') { if (!G.histG) { try { history.pushState({ g: 1 }, ''); G.histG = true; } catch (e) {} } }
  else { if (G.histG) { G.histG = false; G.skipPop = true; try { history.back(); } catch (e) { G.skipPop = false; } } DM.homeRefresh(); }
}
DM.showScreen = showScreen;
function rePush() { if ($('#game').className.indexOf('on') >= 0 && !G.histG) { try { history.pushState({ g: 1 }, ''); G.histG = true; } catch (e) {} } }
DM.rePush = rePush;

/* ---------------- başlatma ---------------- */
function resetBoardView() { DM.clearBoard(); G.sel = null; G.hints = null; G.hintOn = false; closeHintPanel(); }
DM.startMatch = function (o) {
  clearTimeout(G.timer);
  G.mode = o.mode; G.cfg = o.cfg; G.names = o.names.slice(0, o.cfg.n); G.diff = o.diff || 2; G.me = o.me || 0;
  G.scores = []; for (var i = 0; i < o.cfg.n; i++) G.scores.push(0);
  G.round = 1; G.matchOver = false; G.res = null; G.sort = 'id';
  Net.resetChat();
  newRound(-1);
};
function newRound(starter) {
  clearTimeout(G.timer); closeSheet();
  resetBoardView();
  G.st = DM.deal(G.cfg, starter, G.round);
  G.res = null; G.matchOver = false; G.cover = false; G.prevLen = 0; G.lastShown = '';
  if (G.mode === 'ai' || G.mode === 'host') G.me = 0;
  G.needCover = G.mode === 'local';
  showScreen('game');
  SND.deal();
  saveGame();
  if (G.mode === 'host') pushViews();
  step();
}
DM.nextRound = function () {
  if (G.mode === 'guest') return;
  G.round++;
  var w = G.res && G.res.winner >= 0 ? G.res.winner : -1;
  newRound(w);
};
DM.rematch = function () {
  if (G.mode === 'guest') return;
  G.scores = G.scores.map(function () { return 0; }); G.round = 1;
  newRound(-1);
};

/* ---------------- oyun döngüsü ---------------- */
function botDelay() { return S.anim === 'off' ? 220 : (S.anim === 'fast' ? 520 : 760 + rnd(520)); }
function step() {
  clearTimeout(G.timer);
  var st = G.st; if (!st) return;
  if (G.mode === 'guest') { render(); return; }
  if (st.over) { render(); return; }
  var seat = st.turn, kind = kindOf(seat);
  if (kind === 'human' && (G.me !== seat || G.needCover)) { G.me = seat; G.cover = true; render(); showCover(seat); return; }
  if (kind === 'human') G.me = seat;
  render();
  if (kind === 'me' || kind === 'human') { humanTurn(); return; }
  if (kind === 'bot') { G.timer = setTimeout(function () { botTurn(seat); }, botDelay()); return; }
  /* uzaktaki konuk: bekle */
}
function showCover(seat) {
  G.cover = true; $('#cvT').textContent = 'Sıra ' + (G.names[seat] || ('Oyuncu ' + (seat + 1)));
  $('#cvP').textContent = 'Telefonu ona ver. Hazır olunca düğmeye bas; elini yalnızca o görsün.';
  $('#cover').className = 'on';
}
DM.coverGo = function () {
  if (!G.st) return; G.cover = false; $('#cover').className = ''; G.me = G.st.turn; render(); humanTurn();
};
function humanTurn() {
  var st = G.st, seat = G.me;
  if (G.mode === 'host' && st.turn !== 0) return;
  var ms = DM.moves(st, seat);
  if (!ms.length) {
    if (st.cfg.variant === 'cek' && st.yard.length) {
      coach('draw', 'Çekme zamanı', 'Elindeki taşlardan hiçbiri uçlara uymuyor. Havuzdan taş çekmelisin; oynayabilecek bir taş gelene kadar çekersin.');
      if (S.autodraw) G.timer = setTimeout(function () { if (G.st === st && st.turn === seat && !st.over) doDraw(seat); }, 800);
    } else {
      coach('pass', 'Pas', st.cfg.variant === 'cek' ? 'Havuz bitti ve oynayacak taşın yok. Sıra pas geçer.' : 'Blok oyununda çekme yoktur; oynayacak taşın yoksa pas geçersin.');
      if (S.autopass) G.timer = setTimeout(function () { if (G.st === st && st.turn === seat && !st.over) doPass(seat); }, 1100);
    }
  } else {
    if (!st.chain.length) { if (st.openTile >= 0) coach('open', 'İlk taş', 'Oyuna elindeki en büyük çift taşla başlanır. Parlayan taşa dokun.'); else coach('open2', 'Sen açıyorsun', 'Bu el sana başlama hakkı verdi. İstediğin taşı oynayabilirsin; çift taşlar ve yüksek taşlar genelde iyi başlangıçtır.'); }
    else coach('match', 'Taşları uçlara ekle', 'Bir taşın yarısı, masadaki uçlardan birinin sayısıyla aynı olmalı. Parlayan taşlar oynanabilir; birine dokununca ya doğrudan oynar ya da uç seçmeni ister.');
  }
}
function botTurn(seat) {
  var st = G.st; if (!st || st.over || st.turn !== seat) return;
  var ms = DM.moves(st, seat);
  if (!ms.length) {
    if (st.cfg.variant === 'cek' && st.yard.length) { doDraw(seat); return; }
    doPass(seat); return;
  }
  var lv = G.mode === 'host' && Net.seatKind(seat) === 'bot' && Net.room && Net.room.seats[seat].lost ? 2 : G.diff;
  var m = DM.bestMove(st, seat, lv);
  doPlay(seat, m.id, m.end);
}

/* ---------------- hamleler ---------------- */
function doPlay(seat, id, end) {
  var st = G.st, r = DM.play(st, seat, id, end);
  if (!r.ok) return false;
  G.sel = null; G.hints = null; closeHintPanel(); hideCoach();
  SND.tock(); if (seat === G.me) vib(18);
  render(true);
  afterMove(seat, 'play');
  return true;
}
function doDraw(seat) {
  var st = G.st, r = DM.draw(st, seat);
  if (!r.ok) return false;
  SND.draw(); G.sel = null; G.hints = null;
  if (seat !== G.me || G.mode === 'local') note((G.names[seat] || 'Oyuncu') + ' havuzdan çekti');
  render(); afterMove(seat, 'draw');
  return true;
}
function doPass(seat) {
  var st = G.st, r = DM.pass(st, seat);
  if (!r.ok) return false;
  SND.pass(); G.sel = null; G.hints = null;
  note(seat === G.me && G.mode !== 'local' ? 'Pas geçtin' : (G.names[seat] || 'Oyuncu') + ' pas geçti');
  if (seat !== G.me) coach('oppass', 'Rakip pas geçti', 'Pas geçen oyuncunun elinde uçlardaki sayılar yok demektir. O sayıları uçlarda tutmak onu zorlar.');
  render(); afterMove(seat, 'pass');
  return true;
}
function afterMove(seat, kind) {
  var st = G.st; saveGame();
  var e = DM.checkEnd(st);
  if (e) { pushViews(); G.timer = setTimeout(function () { endRound(e); }, S.anim === 'off' ? 300 : 950); return; }
  if (kind !== 'draw') DM.nextSeat(st);
  pushViews();
  G.timer = setTimeout(step, kind === 'draw' ? 450 : 80);
}
DM.humanPlay = function (id, end) {
  if (!myTurn()) return;
  if (G.mode === 'guest') { Net.sendHost({ t: 'act', k: 'play', id: id, end: end }); G.sel = null; render(); return; }
  doPlay(G.me, id, end);
};
DM.humanDraw = function () {
  if (!myTurn()) return;
  var st = G.st;
  if (G.mode === 'guest') { if (!DM.canPlay(st, G.me) && yardN(st) > 0) Net.sendHost({ t: 'act', k: 'draw' }); return; }
  if (DM.canPlay(st, G.me)) { toast('Oynayacak taşın var'); return; }
  if (!st.yard.length) { toast('Havuz bitti'); return; }
  clearTimeout(G.timer); doDraw(G.me);
};
DM.humanPass = function () {
  if (!myTurn()) return;
  var st = G.st;
  if (G.mode === 'guest') { Net.sendHost({ t: 'act', k: 'pass' }); return; }
  clearTimeout(G.timer); doPass(G.me);
};

/* hamle seçimi */
DM.tapTile = function (id) {
  if (!G.st || G.st.over) return;
  if (!myTurn()) { toast('Sıra sende değil'); return; }
  var st = G.st, ms = DM.moves(st, G.me).filter(function (m) { return m.id === id; });
  if (!ms.length) {
    var el = $('#hand .hw[data-id="' + id + '"]'); if (el) { el.className += ' shake'; setTimeout(function () { el.className = el.className.replace(' shake', ''); }, 320); }
    SND.err(); vib(30);
    if (!st.chain.length && st.openTile >= 0) toast('Önce ' + DM.tileName(st.openTile) + ' taşıyla açılmalı');
    else if (!DM.canPlay(st, G.me)) toast(st.cfg.variant === 'cek' && yardN(st) > 0 ? 'Oynayacak taşın yok, havuzdan çek' : 'Oynayacak taşın yok');
    else toast('Bu taş uçlardaki sayılara uymuyor');
    return;
  }
  if (G.sel === id) { G.sel = null; render(); return; }
  if (ms.length === 1 && (S.one || ms[0].end === 'C')) { DM.humanPlay(id, ms[0].end); return; }
  G.sel = id; SND.sel(); G.hints = null; closeHintPanel(); render();
  if (ms.length > 1) coach('two', 'İki uca da uyuyor', 'Bu taş hem sol hem sağ uca gidebilir. Parlayan işaretli uçlardan birine dokun.');
};
DM.tapEnd = function (end) {
  if (G.sel == null || !myTurn()) return;
  var ms = DM.moves(G.st, G.me).filter(function (m) { return m.id === G.sel && m.end === end; });
  if (!ms.length) return;
  DM.humanPlay(G.sel, end);
};

/* ---------------- çizim ---------------- */
function info() {
  return {
    names: G.names,
    sub: function (s) {
      var k = G.mode === 'guest' ? (G.kinds[s] || 'guest') : kindOf(s), role;
      if (G.mode === 'guest') role = s === 0 ? 'Ev sahibi' : (k === 'bot' ? 'Bilgisayar' : 'Oyuncu');
      else role = (k === 'bot' ? 'Bilgisayar' : (k === 'guest' ? 'Çevrimiçi' : (k === 'me' ? 'Sen' : '')));
      var sc = G.cfg && G.cfg.target ? ((G.scores[unit(s)] || 0) + ' puan') : '';
      var pt = (G.cfg && G.cfg.team && G.cfg.n === 4 && s !== G.me && (s % 2) === (G.me % 2)) ? 'ortağın' : '';
      return [role, pt, sc].filter(function (x) { return x; }).join(' · ');
    }
  };
}
function render(animNew) {
  var st = G.st; if (!st) return;
  var mt = myTurn(), ms = mt ? DM.moves(st, G.me) : [], show = {}, inf = info();
  if (mt && G.sel != null) ms.forEach(function (m) { if (m.id === G.sel && (m.end === 'L' || m.end === 'R')) show[m.end] = true; });
  DM.renderOpps(st, G.me, inf);
  DM.renderMe(st, G.me, inf);
  DM.renderHand(st, G.me, { sel: G.sel, moves: ms, myTurn: mt, hints: G.hints, sort: G.sort });
  DM.renderBoard(st, show, animNew);
  hud();
}
DM.render = render;
var noteT = null;
function note(txt) {
  var n = $('#note'); n.firstChild.textContent = txt; n.className = 'on';
  if (noteT) clearTimeout(noteT); noteT = setTimeout(function () { n.className = ''; }, 1700);
}
function hud() {
  var st = G.st; if (!st) return;
  var cfg = st.cfg || G.cfg, mt = myTurn(), yn = yardN(st);
  var t1;
  if (st.over) t1 = 'El bitti';
  else if (G.cover) t1 = 'Telefon el değiştiriyor';
  else if (mt) t1 = DM.canPlay(st, G.me) ? 'Sıra sende' : (cfg.variant === 'cek' && yn > 0 ? 'Havuzdan çekmelisin' : 'Oynayacak taşın yok');
  else t1 = (G.names[st.turn] || 'Oyuncu') + ' oynuyor…';
  $('#st1').textContent = t1;
  $('#st2').textContent = (cfg.variant === 'blok' ? 'Blok' : 'Çekmeli') + ' · ' + (cfg.target ? 'Hedef ' + cfg.target : 'Tek el') + ' · El ' + G.round + (cfg.team && cfg.n === 4 ? ' · Ortaklı' : '');
  var yb = $('#yardBox');
  if (cfg.variant === 'cek' && !st.over) {
    yb.className = (mt && !DM.canPlay(st, G.me) && yn > 0 && !S.autodraw ? 'on go' : 'on');
    $('#yardTxt').textContent = 'Havuz ' + yn + (yb.className.indexOf('go') >= 0 ? ' · çek' : '');
  } else yb.className = '';
  var bp = $('#bPass');
  bp.style.display = (mt && !DM.canPlay(st, G.me) && !(cfg.variant === 'cek' && yn > 0) && !S.autopass) ? 'flex' : 'none';
  var online = G.mode === 'host' || G.mode === 'guest';
  $('#aChat').style.display = online ? 'flex' : 'none';
  $('#chBadge').textContent = Net.unread ? Net.unread : '';
  $('#aSort').style.display = '';
}

/* ---------------- öğretici ipuçları ---------------- */
function coach(key, title, text) {
  if (!S.coach || S.seen[key]) return;
  S.seen[key] = 1; saveS();
  $('#cTitle').textContent = title; $('#cText').textContent = text; $('#coach').className = 'on';
}
function hideCoach() { $('#coach').className = ''; }
function closeHintPanel() { G.hintOn = false; $('#hintP').className = ''; if (G.hints) { G.hints = null; if (G.st) render(); } }
DM.hideCoach = hideCoach; DM.closeHintPanel = closeHintPanel;
DM.hint = function () {
  if (!G.st || G.st.over) return;
  if (G.hintOn) { closeHintPanel(); return; }
  if (!myTurn()) { toast('İpucu için sıranın sende olması gerekir'); return; }
  hideCoach();
  var l = DM.hintList(G.st, G.me);
  if (!l.length) { toast(G.st.cfg.variant === 'cek' && yardN(G.st) > 0 ? 'Oynayacak taşın yok, havuzdan çek' : 'Oynayacak taşın yok'); return; }
  G.hints = l; G.hintOn = true; G.sel = null; render();
  var h = '<h4>İpucu · en iyi hamleler</h4>' + l.map(function (a, i) {
    var side = a.end === 'L' ? 'sol uca' : (a.end === 'R' ? 'sağ uca' : 'masaya');
    return '<div class="alt"><i class="lt">' + 'ABC'.charAt(i) + '</i><div class="at"><b>' + DM.tileName(a.id) + ' · ' + side + (i === 0 ? '<span class="best">EN İYİ</span>' : '') + '</b><p>' + esc(a.why.charAt(0).toUpperCase() + a.why.slice(1)) + '.</p></div><button class="btn sm" data-act="hintPlay" data-k="' + i + '">Oyna</button></div>';
  }).join('') + '<div class="cb"><button class="lnk" data-act="hintOff">Kapat</button></div>';
  $('#hintBody').innerHTML = h; $('#hintP').className = 'on';
};
DM.hintPlay = function (k) {
  var a = G.hints && G.hints[k]; if (!a) return;
  closeHintPanel(); DM.humanPlay(a.id, a.end);
};
DM.sortHand = function () { G.sort = G.sort === 'id' ? 'pip' : 'id'; G.sel = null; render(); toast(G.sort === 'pip' ? 'Büyükten küçüğe dizildi' : 'Sayıya göre dizildi', 1300); };

/* ---------------- el sonu ---------------- */
function winnerNames(e) {
  if (e.winner < 0) return '';
  if (G.cfg.team && G.cfg.n === 4) return (G.names[e.winner] || '') + ' ve ' + (G.names[(e.winner + 2) % 4] || '');
  return G.names[e.winner] || '';
}
function endRound(e) {
  var st = G.st; st.over = true; G.res = e; G.sel = null;
  if (e.winner >= 0) G.scores[unit(e.winner)] += e.points;
  var target = G.cfg.target, over = false;
  if (target === 0) over = true;
  else {
    var mx = Math.max.apply(null, G.scores), cnt = G.scores.filter(function (x) { return x === mx; }).length;
    if (mx >= target && cnt === 1) over = true;
  }
  G.matchOver = over;
  var extra = { res: e, matchOver: over, hands: st.hands.slice(), scores: G.scores.slice() };
  G.endHands = st.hands.slice();
  pushViews(extra);
  render();
  celebrate(e, over);
  showEnd();
  if (over) { LS.del('domino.save'); } else saveGame();
}
function celebrate(e, over) {
  var mineWin = e.winner >= 0 && unit(e.winner) === unit(G.me) && G.mode !== 'local';
  if (G.mode === 'local') { if (e.winner >= 0) { SND.win(); confetti(); } else SND.draw(); }
  else if (mineWin) { SND.win(); vib([60, 40, 90]); confetti(); }
  else if (e.winner < 0) SND.draw();
  else SND.lose();
  if (over && G.mode !== 'local') {
    var best = G.scores.indexOf(Math.max.apply(null, G.scores));
    if (G.cfg.target === 0) { if (mineWin) S.stats.w++; else if (e.winner < 0) S.stats.d++; else S.stats.l++; }
    else { if (best >= 0 && best === unit(G.me)) S.stats.w++; else S.stats.l++; }
    saveS();
  }
}
function confetti() {
  if (S.anim === 'off' || S.perf) return;
  var cols = ['#f0d48a', '#d4aa5a', '#8fe0b0', '#8fc3ff', '#ff9a8a', '#fff'], i;
  for (i = 0; i < 36; i++) {
    var d = document.createElement('i'); d.className = 'conf';
    d.style.left = rnd(100) + 'vw'; d.style.background = cols[rnd(cols.length)];
    d.style.webkitAnimationDelay = d.style.animationDelay = (rnd(700) / 1000) + 's';
    d.style.webkitAnimationDuration = d.style.animationDuration = (1.8 + rnd(1200) / 1000) + 's';
    document.body.appendChild(d); (function (x) { setTimeout(function () { if (x.parentNode) x.parentNode.removeChild(x); }, 3800); })(d);
  }
}
function showEnd() {
  var e = G.res, hands = G.endHands || (G.st ? G.st.hands : []), cfg = G.cfg, over = G.matchOver, team = cfg.team && cfg.n === 4, rows = '', s;
  var head;
  if (e.winner < 0) head = 'Oyun kapandı: eller eşit, puan yok';
  else if (e.blocked) head = (team ? winnerNames(e) + ' kazandı' : esc(G.names[e.winner]) + ' kazandı') + ' · oyun kapandı, en az puanlı el';
  else head = winnerNames(e) + (team ? ' elini bitirdi' : ' elini bitirdi');
  for (s = 0; s < cfg.n; s++) {
    var h = hands[s] || [], tot = 0; h.forEach(function (id) { tot += DM.pips(id); });
    var win = e.winner >= 0 && unit(s) === unit(e.winner);
    rows += '<div class="sc' + (win ? ' win' : '') + '"><i class="av" style="background:' + DM.COLS[s % 4] + '">' + DM.initial(G.names[s]) + '</i><div class="nm"><b>' + esc(G.names[s] || ('Oyuncu ' + (s + 1))) + '</b>' +
      (h.length ? DM.miniRow(h) : '<small>Elini bitirdi</small>') + '</div>' +
      '<div class="pp">' + (h.length ? tot + ' nokta' : '') + (win && e.points ? '<br><b>+' + e.points + '</b>' : '') + '</div>' +
      (cfg.target ? '<div class="tt">' + (G.scores[unit(s)] || 0) + '</div>' : '') + '</div>';
  }
  var t = over ? 'Oyun bitti' : 'El bitti', btn;
  var sub = '';
  if (over && cfg.target) { var bi = G.scores.indexOf(Math.max.apply(null, G.scores)); sub = '<div class="win-t">' + (team ? 'Takım ' + (bi + 1) : esc(G.names[bi])) + ' kazandı</div>'; }
  else if (over) sub = '';
  if (G.mode === 'guest') btn = '<p class="note">' + (over ? 'Ev sahibinin yeni oyun başlatması bekleniyor' : 'Ev sahibinin sonraki eli başlatması bekleniyor') + '<span class="dots"></span></p><button class="btn sm" data-act="leaveYes">Masadan ayrıl</button>';
  else if (over) btn = '<button class="btn pri sm" data-act="rematch">Yeni oyun</button><div class="gap"></div><button class="btn sm" data-act="home2">Ana menü</button>';
  else btn = '<button class="btn pri sm" data-act="nextRound">Sonraki el</button>';
  if (G.mode === 'host' && !over) btn += '<div class="gap"></div><button class="btn sm" data-act="chat2">Sohbet</button>';
  if (G.mode === 'guest') btn = btn.replace('<button class="btn sm" data-act="leaveYes">', '<button class="btn sm" data-act="chat2">Sohbet</button><div class="gap"></div><button class="btn sm" data-act="leaveYes">');
  G.endHtml = '<h2>' + t + '</h2>' + sub + '<p class="note" style="margin:0 0 6px">' + head + '</p>' + rows + (cfg.target ? '<p class="note">Hedef ' + cfg.target + ' puan</p>' : '') + '<div class="gap"></div>' + btn;
  openSheet(G.endHtml, { noClose: true });
}
DM.reopenEnd = function () { if (G.endHtml && G.res) openSheet(G.endHtml, { noClose: true }); else closeSheet(); };

/* ---------------- kayıt ---------------- */
function saveGame() {
  if (G.mode !== 'ai' && G.mode !== 'local') return;
  if (!G.st || G.st.over) return;
  LS.set('domino.save', { mode: G.mode, cfg: G.cfg, names: G.names, diff: G.diff, scores: G.scores, round: G.round, st: G.st });
}
DM.loadGame = function () {
  var sv = LS.get('domino.save', null);
  if (!sv || !sv.st) return false;
  clearTimeout(G.timer);
  G.mode = sv.mode; G.cfg = sv.cfg; G.names = sv.names; G.diff = sv.diff || 2; G.scores = sv.scores; G.round = sv.round || 1; G.st = sv.st;
  G.me = G.mode === 'ai' ? 0 : G.st.turn; G.matchOver = false; G.res = null; G.cover = false; G.needCover = G.mode === 'local'; G.sort = 'id';
  Net.resetChat(); resetBoardView(); showScreen('game'); step();
  return true;
};
DM.hasSave = function () { var sv = LS.get('domino.save', null); return sv && sv.st ? sv : null; };

/* ---------------- çevrimiçi: ev sahibi ---------------- */
function makeView(seat, extra) {
  var v = DM.viewFor(G.st, seat, extra);
  v.me = seat; v.names = G.names; v.scores = G.scores; v.round = G.round;
  v.kinds = G.names.map(function (n, i) { var k = i === 0 ? 'host' : Net.seatKind(i); return k; });
  return v;
}
function pushViews(extra) {
  if (G.mode !== 'host') return;
  Net.guestSeats().forEach(function (s) { Net.sendSeat(s, { t: 'st', v: makeView(s, extra) }); });
}
DM.pushViews = pushViews;
H.onGuestAct = function (seat, a) {
  var st = G.st;
  if (!st || st.over || G.mode !== 'host' || st.turn !== seat || DM.checkEnd(st)) { sendCurrent(seat); return; }
  var ok = false;
  if (a.k === 'play') ok = doPlay(seat, a.id | 0, String(a.end));
  else if (a.k === 'draw') ok = doDraw(seat);
  else if (a.k === 'pass') ok = doPass(seat);
  if (!ok) sendCurrent(seat);
};
function sendCurrent(seat) {
  if (!G.st) return;
  var extra = G.st.over && G.res ? { res: G.res, matchOver: G.matchOver, hands: G.endHands, scores: G.scores.slice() } : null;
  Net.sendSeat(seat, { t: 'st', v: makeView(seat, extra) });
}
H.onSeatLost = function (seat, name, left) {
  note(name + (left ? ' masadan ayrıldı' : ' bağlantısı koptu') + ' · bot devralıyor');
  toast(name + (left ? ' ayrıldı.' : ' bağlantısı koptu.') + ' Yerine bot oynayacak.', 2800);
  if (G.st && !G.st.over) { pushViews(); if (G.st.turn === seat) { clearTimeout(G.timer); step(); } }
};
H.onSeatBack = function (seat) {
  var nm = Net.seatName(seat);
  toast(nm + ' geri döndü', 2200);
  if (G.st) { sendCurrent(seat); if (G.st.turn === seat && !G.st.over) { clearTimeout(G.timer); step(); } }
};
DM.hostStart = function () {
  var r = Net.room; if (!r || r.started) return;
  var names = [], i, bi = 0;
  for (i = 0; i < r.cfg.n; i++) {
    var s = r.seats[i];
    if (s.kind === 'emp') { names.push(DM.BOTN[(bi++) % DM.BOTN.length]); }
    else names.push(s.name || ('Oyuncu ' + (i + 1)));
  }
  r.started = true;
  closeSheet();
  DM.startMatch({ mode: 'host', cfg: { n: r.cfg.n, variant: r.cfg.variant, target: r.cfg.target, team: !!r.cfg.team }, names: names, diff: 2, me: 0 });
};

/* ---------------- çevrimiçi: konuk ---------------- */
H.onGuestState = function (v) {
  var first = G.mode !== 'guest';
  var prevLen = G.st ? G.st.chain.length : -1, prevLast = G.lastShown;
  G.mode = 'guest'; G.cfg = v.cfg; G.names = v.names || G.names; G.scores = v.scores || G.scores; G.round = v.round || 1; G.me = v.me; G.kinds = v.kinds || [];
  var wasOver = G.st ? G.st.over : false;
  G.st = DM.fromView(v);
  if (first) { resetBoardView(); showScreen('game'); Net.resetChat(); SND.deal(); closeSheet(); prevLen = -1; }
  var newRound = (v.chain.length === 0 && !v.over) && (wasOver || first || prevLen > 0);
  if (newRound && !first) { resetBoardView(); closeSheet(); SND.deal(); G.res = null; }
  var lm = v.last, key = lm ? (lm.type + ':' + (lm.seat) + ':' + (lm.id) + ':' + v.chain.length + ':' + v.passes) : '';
  var fresh = key && key !== prevLast; G.lastShown = key;
  G.sel = null; G.hints = null; closeHintPanel();
  var animNew = false;
  if (fresh && lm) {
    if (lm.type === 'play' && v.chain.length > prevLen) { SND.tock(); animNew = true; }
    else if (lm.type === 'draw') { SND.draw(); if (lm.seat !== G.me) note((G.names[lm.seat] || 'Oyuncu') + ' havuzdan çekti'); }
    else if (lm.type === 'pass') { SND.pass(); note(lm.seat === G.me ? 'Pas geçtin' : (G.names[lm.seat] || 'Oyuncu') + ' pas geçti'); }
  }
  render(animNew);
  if (v.over && v.res) {
    G.res = v.res; G.matchOver = !!v.matchOver; G.endHands = v.hands;
    if (v.scores) G.scores = v.scores;
    if (!wasOver) { celebrate(v.res, v.matchOver); setTimeout(function () { if (G.st && G.st.over) showEnd(); }, S.anim === 'off' ? 250 : 900); }
  } else if (!v.over) {
    if (myTurn()) {
      var ms = DM.moves(G.st, G.me);
      if (!ms.length) {
        if (G.st.cfg.variant === 'cek' && v.yard > 0) { coach('draw', 'Çekme zamanı', 'Elindeki taşlardan hiçbiri uçlara uymuyor. Havuzdan taş çekmelisin.'); if (S.autodraw) { clearTimeout(G.timer); G.timer = setTimeout(function () { if (G.st && myTurn() && !DM.canPlay(G.st, G.me)) Net.sendHost({ t: 'act', k: 'draw' }); }, 800); } }
        else { coach('pass', 'Pas', 'Oynayacak taşın yok; sıra pas geçer.'); if (S.autopass) { clearTimeout(G.timer); G.timer = setTimeout(function () { if (G.st && myTurn() && !DM.canPlay(G.st, G.me)) Net.sendHost({ t: 'act', k: 'pass' }); }, 1100); } }
      } else if (G.st.chain.length) coach('match', 'Taşları uçlara ekle', 'Bir taşın yarısı, masadaki uçlardan birinin sayısıyla aynı olmalı. Parlayan taşlar oynanabilir.');
    }
  }
};
H.onHostDown = function () {
  openSheet('<h2>Bağlantı koptu</h2><p class="note" style="font-size:14px">Ev sahibiyle yeniden bağlanılıyor<span class="dots"></span></p><div class="gap"></div><button class="btn sm" data-act="leaveYes">Masadan ayrıl</button>', { noClose: true });
};
H.onReconnected = function () { closeSheet(); toast('Yeniden bağlandın', 2000); };
H.onHostGone = function (msg) {
  clearTimeout(G.timer); G.mode = null; closeSheet();
  openSheet('<h2>Oyun sona erdi</h2><p class="note" style="font-size:14px">' + esc(msg || 'Bağlantı kesildi.') + '</p><div class="gap"></div><button class="btn pri sm" data-act="home2">Ana menü</button>', { noClose: true });
};

/* ---------------- ayrılma ---------------- */
DM.leaveGame = function () {
  clearTimeout(G.timer);
  if (G.mode === 'host' || G.mode === 'guest') Net.stopAll();
  var keep = (G.mode === 'ai' || G.mode === 'local') && G.st && !G.st.over;
  if (!keep && G.mode !== 'ai' && G.mode !== 'local') LS.del('domino.save');
  G.mode = null; G.cover = false; $('#cover').className = '';
  closeSheet(); showScreen('home');
};
DM.onResize = function () { if (G.st && $('#game').className.indexOf('on') >= 0) render(); };
})(window);
