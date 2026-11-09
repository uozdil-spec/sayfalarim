/* Domino · ana menü, kurulum panelleri, kılavuz, ayarlar, olaylar, başlatma  (by uozdil) */
(function (root) {
'use strict';
var DM = root.DM, $ = DM.$, S = DM.S, LS = DM.LS, esc = DM.esc, rnd = DM.rnd, UI = DM.UI, Net = DM.Net, G = DM.G, SND = DM.SND, vib = DM.vib,
  toast = DM.toast, saveS = DM.saveS, openSheet = DM.openSheet, closeSheet = DM.closeSheet, seg = DM.seg, SIG = DM.SIG;

/* ---------------- ana menü ---------------- */
DM.homeRefresh = function () {
  var sv = DM.hasSave(), b = $('#bCont');
  if (sv) {
    b.style.display = 'flex';
    var c = sv.cfg;
    $('#bContS').textContent = (sv.mode === 'ai' ? 'Bilgisayar · ' + (c.n - 1) + ' rakip' : 'Aynı telefonda · ' + c.n + ' kişi') + ' · ' + (c.variant === 'blok' ? 'Blok' : 'Çekmeli') + ' · El ' + sv.round;
  } else b.style.display = 'none';
  setNameChip();
  var st = S.stats;
  $('#homeFoot').textContent = (st.w + st.l + st.d > 0 ? 'Galibiyet ' + st.w + '  ·  Mağlubiyet ' + st.l + (st.d ? '  ·  Beraberlik ' + st.d : '') : '');
};
function setNameChip() { var e = $('#homeName'); if (e) e.textContent = S.name || 'Adını yaz'; }

/* ---------------- kullanıcı adı ---------------- */
DM.sheetName = function (next) {
  UI.afterName = next || null;
  openSheet('<h2>Kullanıcı adın</h2><p class="note" style="text-align:center;margin-top:0">Arkadaşların ve rakiplerin seni bu adla görür.</p>' +
    '<input class="inp nm2" id="nameIn2" maxlength="14" placeholder="Adın" value="' + esc(S.name) + '" autocomplete="off" autocapitalize="words">' +
    '<div class="gap"></div><button class="btn pri sm" data-act="saveName">Kaydet</button><div class="gap"></div><button class="btn sm" data-act="' + (next ? 'sheetBack' : 'close') + '">Vazgeç</button>',
    { back: next ? function () { UI.afterName = null; closeSheet(); } : null });
  setTimeout(function () { var e = $('#nameIn2'); if (e && e.focus) { try { e.focus(); } catch (x) {} } }, 150);
};

/* ---------------- bilgisayara karşı ---------------- */
function sheetNewAI() {
  var c = S.cfg;
  openSheet('<h2>Bilgisayara karşı</h2>' +
    '<h3>Rakip sayısı</h3>' + seg('ai_opp', [[1, '1 rakip'], [2, '2 rakip'], [3, '3 rakip']], c.opp) +
    '<h3>Oyun türü</h3>' + seg('ai_variant', [['cek', 'Çekmeli'], ['blok', 'Blok']], c.variant) +
    '<p class="note" style="margin:4px 0 0">' + (c.variant === 'cek' ? 'Oynayamazsan havuzdan taş çekersin.' : 'Çekme yok; oynayamazsan pas geçersin.') + '</p>' +
    '<h3>Zorluk</h3>' + seg('ai_diff', [[1, 'Kolay'], [2, 'Orta'], [3, 'Usta']], c.diff) +
    '<h3>Hedef puan</h3>' + seg('ai_target', [[0, 'Tek el'], [50, '50'], [100, '100'], [150, '150'], [200, '200']], c.target) +
    (c.opp === 3 ? '<h3>Ortaklı oyun · karşındaki ortağın</h3>' + seg('ai_team', [[1, 'Evet'], [0, 'Hayır']], c.team ? 1 : 0) : '') +
    '<div class="gap"></div><div class="gap"></div><button class="btn pri sm" data-act="startai">Başla</button><div class="gap"></div><button class="btn sm" data-act="close">Vazgeç</button>');
}
function startAI() {
  var c = S.cfg, n = c.opp + 1, names = [S.name || 'Sen'], pool = DM.BOTN.slice(), i;
  for (i = 1; i < n; i++) names.push(pool.splice(rnd(pool.length), 1)[0]);
  closeSheet();
  DM.startMatch({ mode: 'ai', cfg: { n: n, variant: c.variant, target: c.target, team: !!c.team && n === 4 }, names: names, diff: c.diff, me: 0 });
}

/* ---------------- aynı telefonda ---------------- */
function sheetLocal() {
  var c = S.lcfg, i, nm = '';
  for (i = 0; i < c.n; i++) nm += '<input class="inp nm2" id="ln' + i + '" maxlength="14" placeholder="Oyuncu ' + (i + 1) + '" value="' + esc((S.names && S.names[i]) || (i === 0 ? S.name : '')) + '" autocomplete="off" style="margin-bottom:6px">';
  openSheet('<h2>Aynı telefonda</h2>' +
    '<h3>Oyuncu sayısı</h3>' + seg('lo_n', [[2, '2'], [3, '3'], [4, '4']], c.n) +
    '<h3>Oyun türü</h3>' + seg('lo_variant', [['cek', 'Çekmeli'], ['blok', 'Blok']], c.variant) +
    '<h3>Hedef puan</h3>' + seg('lo_target', [[0, 'Tek el'], [50, '50'], [100, '100'], [200, '200']], c.target) +
    (c.n === 4 ? '<h3>Ortaklı oyun · 1-3 ve 2-4</h3>' + seg('lo_team', [[1, 'Evet'], [0, 'Hayır']], c.team ? 1 : 0) : '') +
    '<h3>Oyuncu adları</h3>' + nm +
    '<p class="note">Her turda telefon el değiştirir; sıra gelen oyuncu “Hazırım”a basana kadar eller gizli kalır.</p>' +
    '<button class="btn pri sm" data-act="startlocal">Başla</button><div class="gap"></div><button class="btn sm" data-act="close">Vazgeç</button>');
}
function startLocal() {
  var c = S.lcfg, names = [], i;
  for (i = 0; i < c.n; i++) { var e = $('#ln' + i), v = e ? e.value.replace(/\s+/g, ' ').trim().slice(0, 14) : ''; names.push(v || ('Oyuncu ' + (i + 1))); }
  S.names = names; saveS();
  closeSheet();
  DM.startMatch({ mode: 'local', cfg: { n: c.n, variant: c.variant, target: c.target, team: !!c.team && c.n === 4 }, names: names, diff: 2, me: 0 });
}

/* ---------------- puan tablosu ---------------- */
function sheetScore() {
  var st = G.st; if (!st) return;
  var cfg = G.cfg, rows = '', s, team = cfg.team && cfg.n === 4;
  for (s = 0; s < cfg.n; s++) {
    var cnt = st.counts ? st.counts[s] : st.hands[s].length;
    rows += '<div class="sc"><i class="av" style="background:' + DM.COLS[s % 4] + '">' + DM.initial(G.names[s]) + '</i><div class="nm"><b>' + esc(G.names[s] || ('Oyuncu ' + (s + 1))) + '</b><small>' + cnt + ' taş' + (team ? ' · takım ' + (s % 2 + 1) : '') + '</small></div>' +
      '<div class="tt">' + (G.scores[team ? s % 2 : s] || 0) + '</div></div>';
  }
  openSheet('<h2>Puan durumu</h2><p class="note" style="margin:0 0 6px">' + (cfg.target ? 'Hedef ' + cfg.target + ' puan · ' : 'Tek el · ') + 'El ' + G.round + '</p>' + rows +
    '<div class="gap"></div><button class="btn pri sm" data-act="close">Tamam</button>');
}

/* ---------------- kılavuz ---------------- */
function chainFig(list) { return '<div class="fig">' + list.map(function (p) { return DM.tileHTML(p[0], p[1], false); }).join('') + '</div>'; }
function sheetRules(back) {
  openSheet('<h2>Kılavuz</h2>' +
    '<p><b>Amaç:</b> Elindeki taşları herkesten önce bitirmek; oyun kapanırsa elinde en az nokta kalmak.</p>' +
    '<h3>Taşlar</h3>' + DM.figRow([[6, 6], [6, 3], [5, 5], [2, 0]], true) +
    '<p class="cap">28 taş var; her taşın iki yarısında 0–6 nokta bulunur. İki yarısı aynı olan taşa <b>çift</b> denir.</p>' +
    '<h3>Başlangıç</h3><p>Taşlar dağıtılır: 2 kişide 7’şer; 3-4 kişide çekmelide 5’er, blokta 7’şer. <b>En büyük çift</b> taşı olan oyuncu oyuna onu koyarak başlar; çift yoksa en büyük taşla. Sonraki ellerde eli kazanan başlar. Kalan taşlar <b>havuzda</b> bekler (yalnız çekmelide).</p>' +
    '<h3>Sıra sende</h3>' + chainFig([[6, 6], [6, 3], [3, 3], [3, 1]]) +
    '<p class="cap">Uçlardaki sayılar 6 ve 1. Bu uçlara 6 ya da 1 taşıyan bir taş eklenebilir.</p>' +
    '<p>Bir taşın yarısı, zincirin <b>uçlarından birindeki sayıyla</b> aynıysa o uca eklenir. İstersen soldan istersen sağdan oynarsın.</p>' +
    '<h3>Oynayamazsan</h3><ul><li><b>Çekmeli:</b> uygun taş gelene kadar havuzdan çekersin. Havuz biterse pas geçersin.</li><li><b>Blok:</b> çekme yoktur; doğrudan pas geçersin.</li></ul>' +
    '<h3>Oyun nasıl biter</h3><ul><li>Elini ilk bitiren eli kazanır ve diğerlerinin elinde kalan <b>tüm noktaları</b> puan alır.</li><li>Herkes art arda pas geçerse oyun <b>kapanır</b>: elinde en az nokta olan kazanır ve rakiplerin toplamı ile kendi toplamı arasındaki farkı alır. Eşitse puan yazılmaz.</li><li>Hedef puana (ör. 100) ilk ulaşan oyunu kazanır. “Tek el”de tek elin galibi kazanır.</li></ul>' +
    '<h3>Ortaklı oyun (4 kişi)</h3><p>1 ile 3, 2 ile 4 numaralı oyuncular takım olur; puanlar takım olarak toplanır. Karşındaki ortağındır.</p>' +
    '<h3>Bu oyunda nasıl oynanır</h3><ul><li><b>Parlayan taşlar</b> oynanabilir. Birine dokun: tek uca uyuyorsa kendiliğinden oynanır; iki uca da uyuyorsa uçlardaki parlayan okları gösterir, birine dokun.</li><li>Seçtiğin taşa yeniden dokunursan seçim kalkar.</li><li>Oynayamıyorsan <b>Havuz</b> düğmesine dokun (ya da otomatik çekilir). Havuz bitmişse <b>Pas</b>.</li><li><b>İpucu:</b> en iyi 3 hamleyi A-B-C harfleriyle gösterir ve nedenini yazar.</li><li><b>Diz:</b> elini büyükten küçüğe ya da sayıya göre dizer. <b>Puan:</b> puan durumunu açar.</li><li>Ayarlardan taş rengini, masayı, noktaların rengini ve masanın eğimini değiştirebilirsin.</li></ul>' +
    '<h3>Strateji ipuçları</h3><ul class="tip"><li>Büyük çiftleri ve yüksek taşları erken elden çıkar; oyun kapanırsa elinde az nokta kalır.</li><li>Elinde çok taşı olan sayıyı uçlarda tutmaya çalış; hep oynayabilirsin.</li><li>Bir rakip pas geçtiyse o sayı onda yoktur. Uçlara o sayıyı koyarak onu zorla.</li><li>Ortaklı oyunda ortağının pas geçtiği sayıları açma.</li><li>Elin 1-2 taşa düşünce uçları kapatmaya çalış.</li></ul>' +
    '<h3>Çevrimiçi</h3><ul><li><b>Çevrimiçi → Oda kur</b> ile 2-4 kişilik masa aç, çevrimiçi arkadaşlarını tek dokunuşla çağır. Boş koltuklara bilgisayar oturur.</li><li>Arkadaş eklemek için kodunu paylaş ya da onun kodunu yaz. Davet bağlantısı da çalışır.</li><li>Oyun sırasında <b>Sohbet</b> düğmesiyle hızlı mesaj gönderebilirsin.</li><li>Bağlantın koparsa yerine bot oynar; döndüğünde koltuğunu geri alırsın.</li></ul>' +
    SIG + '<div class="gap"></div><button class="btn pri sm" data-act="close">Anladım</button>', { back: back || null });
}

/* ---------------- ayarlar ---------------- */
function sheetSettings() {
  openSheet('<h2>Ayarlar</h2>' +
    '<h3>Görünüm</h3>' +
    '<div class="row"><div class="lb">Taşlar</div>' + seg('tile', [['fildisi', 'Fildişi'], ['oniks', 'Oniks'], ['yakut', 'Yakut'], ['safir', 'Safir'], ['zumrut', 'Zümrüt']], S.tile) + '</div>' +
    '<div class="row"><div class="lb">Masa</div>' + seg('table', [['zumrut', 'Yeşil'], ['gece', 'Lacivert'], ['bordo', 'Bordo'], ['kursun', 'Kurşun'], ['siyah', 'Siyah']], S.table) + '</div>' +
    '<div class="row"><div class="lb">Noktalar<small>Renkli: her sayı ayrı renk</small></div>' + seg('pipc', [['klasik', 'Klasik'], ['renkli', 'Renkli']], S.pipc) + '</div>' +
    '<div class="row"><div class="lb">Bakış açısı</div>' + seg('tilt', [[0, 'Düz'], [20, 'Hafif'], [34, 'Eğik'], [48, 'Yüksek']], S.tilt) + '</div>' +
    '<div class="row"><div class="lb">Taş boyutu</div>' + seg('size', [['kucuk', 'Küçük'], ['orta', 'Orta'], ['buyuk', 'Büyük']], S.size) + '</div>' +
    '<h3>Oynanış</h3>' +
    '<div class="row"><div class="lb">Oynanabilirleri parlat</div>' + seg('glow', [[1, 'Evet'], [0, 'Hayır']], S.glow ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Tek dokunuşla oyna<small>Tek uca uyan taş hemen oynanır</small></div>' + seg('one', [[1, 'Evet'], [0, 'Hayır']], S.one ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Otomatik çek</div>' + seg('autodraw', [[1, 'Evet'], [0, 'Hayır']], S.autodraw ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Otomatik pas</div>' + seg('autopass', [[1, 'Evet'], [0, 'Hayır']], S.autopass ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Öğretici ipuçları<small>Oyun sırasında açıklamalar</small></div>' + seg('coach', [[1, 'Açık'], [0, 'Kapalı']], S.coach ? 1 : 0) + '</div>' +
    '<h3>Ses ve ekran</h3>' +
    '<div class="row"><div class="lb">Ses</div>' + seg('sound', [[1, 'Açık'], [0, 'Kapalı']], S.sound ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Titreşim</div>' + seg('haptic', [[1, 'Açık'], [0, 'Kapalı']], S.haptic ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Animasyon</div>' + seg('anim', [['full', 'Tam'], ['fast', 'Hızlı'], ['off', 'Kapalı']], S.anim) + '</div>' +
    '<div class="row"><div class="lb">OLED koruma<small>Ekran kayması, kısılan arayüz</small></div>' + seg('oled', [[1, 'Açık'], [0, 'Kapalı']], S.oled ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Üst boşluk<small>Kamera deliği ya da çentik için</small></div>' + seg('top', [[0, 'Yok'], [14, 'Az'], [28, 'Orta'], [44, 'Çok']], S.top) + '</div>' +
    '<div class="row"><div class="lb">Ekran açık kalsın</div>' + seg('wake', [[1, 'Evet'], [0, 'Hayır']], S.wake ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Eski telefon modu<small>Daha az gölge ve katman</small></div>' + seg('perf', [[1, 'Açık'], [0, 'Kapalı']], S.perf ? 1 : 0) + '</div>' +
    '<h3>Çevrimiçi adın</h3><input class="inp nm2" id="nameIn" maxlength="14" placeholder="Oyuncu" value="' + esc(S.name) + '" autocomplete="off">' +
    '<div class="gap"></div><button class="btn sm" data-act="rules2">Kılavuz</button><div class="gap"></div><button class="btn pri sm" data-act="close">Tamam</button>' + SIG);
}
function applySetting(k, v) {
  var bools = { sound: 1, haptic: 1, oled: 1, wake: 1, perf: 1, coach: 1, glow: 1, one: 1, autodraw: 1, autopass: 1 };
  if (bools[k]) S[k] = v === '1';
  else if (k === 'tilt' || k === 'top') S[k] = parseInt(v, 10);
  else S[k] = v;
  if (k === 'coach') { if (S.coach) S.seen = {}; else { DM.hideCoach(); DM.closeHintPanel(); } }
  saveS();
  if (k === 'top') DM.probeInsets();
  if (k === 'tile' || k === 'table' || k === 'pipc' || k === 'tilt' || k === 'perf') DM.applyLook();
  if (k === 'oled') DM.applyOled();
  if (k === 'wake') DM.wake();
  if (k === 'sound') SND.tock();
  if (G.st && $('#game').className.indexOf('on') >= 0 && (k === 'size' || k === 'tilt' || k === 'glow' || k === 'top' || k === 'perf')) { DM.render(); setTimeout(DM.render, 80); }
  if (k === 'coach') { var h = DM.render; if (G.st) h(); }
}

/* ---------------- eylemler ---------------- */
function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement; }
var ACT = {
  cont: function () { DM.audio(); if (!DM.loadGame()) DM.homeRefresh(); },
  newai: function () { DM.audio(); sheetNewAI(); },
  startai: function () { startAI(); },
  local: function () { DM.audio(); sheetLocal(); },
  startlocal: function () { startLocal(); },
  online: function () { if (!S.name) DM.sheetName(DM.sheetOnline); else DM.sheetOnline(); },
  name: function () { DM.sheetName(UI.onl ? DM.sheetOnline : (UI.lobby ? DM.sheetLobby : null)); },
  saveName: function () {
    var e = $('#nameIn2'), v = e ? e.value.replace(/\s+/g, ' ').trim().slice(0, 14) : '';
    if (!v) { toast('Bir ad yaz'); return; }
    S.name = v; saveS(); setNameChip();
    var nx = UI.afterName; UI.afterName = null;
    if (nx) nx(); else closeSheet();
  },
  share: function () { Net.share(); },
  copyCode: function () {
    var ok = false;
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(S.uid); ok = true; } } catch (e) {}
    DM.setOnl(ok ? 'Kod kopyalandı.' : 'Kodun: <b>' + S.uid + '</b>');
  },
  addFr: function () {
    var el = $('#fcIn'), c = DM.cleanCode(el ? el.value : '');
    if (c.length !== 6) { DM.setOnl('Kod 6 karakter olmalı.'); return; }
    if (c === S.uid) { DM.setOnl('Bu senin kendi kodun.'); return; }
    if (DM.findFr(c)) { DM.setOnl('Bu kişi zaten listende.'); return; }
    if (!DM.addFr(c, '')) return;
    if (el) el.value = '';
    DM.setOnl('Eklendi. Çevrimiçiyse adı görünecek.'); DM.refreshFr(); DM.pingFr(c);
  },
  rmFr: function (b) { var id = b.getAttribute('data-id'); S.friends = S.friends.filter(function (f) { return f.id !== id; }); saveS(); DM.refreshFr(); },
  inv: function (b) { Net.invite(b.getAttribute('data-id')); },
  invAcc: function () { Net.invAccept(); },
  invNo: function () { Net.invDecline(); },
  retry: function () { DM.netRetry(); },
  newRoom: function () { Net.newRoom(); },
  kick: function (b) { Net.kick(parseInt(b.getAttribute('data-i'), 10)); },
  lbStart: function () { DM.hostStart(); },
  lbShare: function () { Net.share(); },
  lbClose: function () { Net.closeRoom(); closeSheet(); },
  leaveRoom: function () { Net.leave(); },
  chat: function () { DM.sheetChat(); },
  chat2: function () { DM.sheetChat(DM.reopenEnd); },
  chSend: function () { var e = $('#chIn'); if (!e) return; DM.sendChat(e.value); e.value = ''; },
  chQ: function (b) { DM.sendChat(DM.QUICK[parseInt(b.getAttribute('data-i'), 10)]); },
  sheetBack: function () { if (UI.back) { var f = UI.back; f(); } },
  back: function () { handleBack(false); },
  fs: function () {
    var d = document.documentElement, rq = d.requestFullscreen || d.webkitRequestFullscreen || d.mozRequestFullScreen || d.msRequestFullscreen;
    if (fsEl()) { var ex = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen; try { ex.call(document); } catch (e) {} return; }
    if (!rq) { toast('Bu tarayıcı tam ekranı desteklemiyor. Ana ekrana ekleyerek tam ekran kullanabilirsin.', 3600); return; }
    try { var r = rq.call(d); if (r && r.catch) r.catch(function () { toast('Tam ekran açılamadı'); }); } catch (e) { toast('Tam ekran açılamadı'); }
  },
  coachOk: function () { DM.hideCoach(); },
  coachOff: function () { S.coach = false; saveS(); DM.hideCoach(); DM.closeHintPanel(); toast('İpuçları kapandı. Ayarlardan açabilirsin.', 2800); },
  hint: function () { DM.hint(); },
  hintPlay: function (b) { DM.hintPlay(parseInt(b.getAttribute('data-k'), 10) || 0); },
  hintOff: function () { DM.closeHintPanel(); },
  sort: function () { DM.sortHand(); },
  score: function () { sheetScore(); },
  draw: function () { DM.humanDraw(); },
  pass: function () { DM.humanPass(); },
  coverGo: function () { DM.coverGo(); },
  rules: function () { sheetRules(); },
  rules2: function () { sheetRules(sheetSettings); },
  settings: function () { sheetSettings(); },
  close: function () { closeSheet(); },
  nextRound: function () { closeSheet(); DM.nextRound(); },
  rematch: function () { closeSheet(); DM.rematch(); },
  home: function () {
    var inGame = $('#game').className.indexOf('on') >= 0;
    if (inGame && G.mode === 'host') { openSheet('<h2>Masayı kapat?</h2><p class="note" style="font-size:14px">Ev sahibi çıkarsa oda kapanır ve herkesin oyunu biter.</p><div class="gap"></div><button class="btn pri sm" data-act="leaveYes">Kapat ve çık</button><div class="gap"></div><button class="btn sm" data-act="close">Vazgeç</button>'); return; }
    if (inGame && G.mode === 'guest' && G.st && !G.st.over) { openSheet('<h2>Masadan ayrıl?</h2><p class="note" style="font-size:14px">Ayrılırsan koltuğuna bilgisayar oturur.</p><div class="gap"></div><button class="btn pri sm" data-act="leaveYes">Ayrıl</button><div class="gap"></div><button class="btn sm" data-act="close">Vazgeç</button>'); return; }
    ACT.leaveYes();
  },
  home2: function () { ACT.leaveYes(); },
  leaveYes: function () { DM.leaveGame(); },
  resign: function () {
    if (!G.st) return;
    var on = G.mode === 'host' || G.mode === 'guest';
    openSheet('<h2>Oyundan ayrıl?</h2><p class="note" style="font-size:14px">' + (on ? (G.mode === 'host' ? 'Masayı kapatırsan herkesin oyunu biter.' : 'Ayrılırsan koltuğuna bilgisayar oturur.') : 'Oyun kaydedilir; ana menüden “Devam et” ile sürdürebilirsin.') + '</p><div class="gap"></div><button class="btn pri sm" data-act="leaveYes">Ayrıl</button><div class="gap"></div><button class="btn sm" data-act="close">Vazgeç</button>');
  }
};
DM.ACT = ACT;

/* geri düğmesi / tarayıcı geri */
function handleBack(fromPop) {
  function rep() { if (fromPop) DM.rePush(); }
  if (G.hintOn) { DM.closeHintPanel(); rep(); return; }
  if ($('#coach').className.indexOf('on') >= 0) { DM.hideCoach(); rep(); return; }
  if ($('#cover').className === 'on') { rep(); return; }
  if ($('#ov').className === 'on') {
    if (UI.back) { var f = UI.back; f(); rep(); return; }
    if ($('#ov').getAttribute('data-nc')) { rep(); return; }
    closeSheet(); rep(); return;
  }
  if ($('#game').className.indexOf('on') >= 0) { ACT.home(); if (fromPop) setTimeout(DM.rePush, 0); }
}

/* ---------------- olaylar ---------------- */
function up(el, attr) { while (el && el !== document) { if (el.getAttribute && el.getAttribute(attr) !== null) return el; el = el.parentNode; } return null; }
document.addEventListener('click', function (e) {
  DM.resetIdle();
  var t = e.target, b;
  if (t.id === 'ov' && !t.getAttribute('data-nc')) { closeSheet(); return; }
  var sg = up(t, 'data-seg');
  if (sg && t.getAttribute('data-v') !== null && t.tagName === 'BUTTON') {
    var k = sg.getAttribute('data-seg'), v = t.getAttribute('data-v');
    [].forEach.call(sg.children, function (c) { c.className = c === t ? 'on' : ''; });
    if (k.indexOf('ai_') === 0) {
      var kk = k.slice(3); S.cfg[kk] = (kk === 'variant') ? v : (kk === 'team' ? v === '1' : parseInt(v, 10)); saveS();
      if (kk === 'opp' || kk === 'variant') sheetNewAI();
    } else if (k.indexOf('lo_') === 0) {
      var k2 = k.slice(3), c2 = S.lcfg;
      // oyuncu adlarını koru
      var keep = []; for (var q = 0; q < 4; q++) { var inp = $('#ln' + q); keep.push(inp ? inp.value : ''); }
      S.names = keep.map(function (x, i) { return x || (S.names && S.names[i]) || ''; });
      c2[k2] = (k2 === 'variant') ? v : (k2 === 'team' ? v === '1' : parseInt(v, 10));
      if (k2 === 'n' && c2.n !== 4) c2.team = false;
      saveS(); sheetLocal();
    } else if (k.indexOf('lc_') === 0) Net.lobbyCfg(k, v);
    else applySetting(k, v);
    return;
  }
  b = up(t, 'data-act');
  if (b) { var f = ACT[b.getAttribute('data-act')]; if (f && !b.disabled) { DM.audio(); f(b); } return; }
  var mk = up(t, 'data-end');
  if (mk && mk.className.indexOf('mk') >= 0) { DM.tapEnd(mk.getAttribute('data-end')); return; }
  var hw = up(t, 'data-id');
  if (hw && hw.className.indexOf('hw') >= 0) { DM.audio(); DM.tapTile(parseInt(hw.getAttribute('data-id'), 10)); return; }
}, false);
document.addEventListener('input', function (e) {
  var id = e.target.id;
  if (id === 'nameIn') { S.name = e.target.value.slice(0, 14); saveS(); }
  else if (id === 'fcIn') { var c = DM.cleanCode(e.target.value); if (c !== e.target.value) e.target.value = c; }
});
document.addEventListener('keydown', function (e) {
  if (e.keyCode !== 13) return;
  var id = e.target.id;
  if (id === 'chIn') ACT.chSend(); else if (id === 'fcIn') ACT.addFr(); else if (id === 'nameIn2') ACT.saveName();
});
window.addEventListener('popstate', function () {
  if (G.skipPop) { G.skipPop = false; return; }
  G.histG = false; handleBack(true);
});
function fsChange() {
  var on = !!fsEl(), ps = document.querySelectorAll('.fsi path'), i;
  document.body.className = document.body.className.replace(/\bisfs\b/g, '').replace(/\s+$/, '') + (on ? ' isfs' : '');
  for (i = 0; i < ps.length; i++) ps[i].setAttribute('d', on ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5');
  onResize();
}
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(function (n) { document.addEventListener(n, fsChange, false); });
document.addEventListener('touchstart', DM.resetIdle, { passive: true });
document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
var rs = null;
function onResize() { clearTimeout(rs); rs = setTimeout(function () { DM.probeInsets(); DM.onResize(); }, 120); }
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', function () { setTimeout(onResize, 250); });
document.addEventListener('visibilitychange', function () { if (!document.hidden) DM.wake(); });

/* ---------------- başlat ---------------- */
DM.probeInsets(); DM.applyLook(); DM.applyOled(); DM.homeRefresh();
DM.ensureUid();
(function () {
  var m = /[?&]f=([A-Za-z0-9]{6})/.exec(location.search), code = m && m[1].toUpperCase();
  if (m) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
  if (code && code !== S.uid) {
    DM.addFr(code, '');
    setTimeout(function () { if (!S.name) DM.sheetName(DM.sheetOnline); else { DM.sheetOnline(); DM.setOnl('Davet bağlantısından eklendi.'); } }, 500);
  } else if (S.onl) DM.presStart();
})();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { DM.onResize(); });
})(window);
