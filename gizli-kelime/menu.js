/* Gizli Kelime · ana menü, kurulum panelleri, kılavuz, ayarlar, olaylar, başlatma  (by uozdil) */
(function (root) {
'use strict';
var GK = root.GK, $ = GK.$, S = GK.S, LS = GK.LS, esc = GK.esc, rnd = GK.rnd, UI = GK.UI, Net = GK.Net, G = GK.G, SND = GK.SND,
  toast = GK.toast, saveS = GK.saveS, openSheet = GK.openSheet, closeSheet = GK.closeSheet, seg = GK.seg, SIG = GK.SIG, fig = GK.figRow;
var YN = [[1, 'Evet'], [0, 'Hayır']], LENS = [[4, '4'], [5, '5'], [6, '6'], [7, '7']];
function gameOn() { return $('#game').className.indexOf('on') >= 0; }

/* ---------------- ana menü ---------------- */
GK.homeRefresh = function () {
  var sv = GK.hasSave(), b = $('#bCont'), d = GK.dailyState(), st = S.st.daily, no = GK.dayNo();
  if (sv) { b.style.display = 'flex'; $('#bContS').textContent = 'Serbest oyun · ' + sv.cfg.len + ' harf · ' + (sv.boards[0].rows.length + 1) + '. tahmin'; }
  else b.style.display = 'none';
  $('#bDayS').textContent = d ? (d.phase === 'play' ? '#' + no + ' · devam ediyor · ' + (d.boards[0].rows.length + 1) + '. tahmin' : '#' + no + ' · ' + (d.boards[0].win ? d.boards[0].rows.length + '/6 bildin ✓' : 'bugün olmadı') + ' · yarın yenisi') : '#' + no + ' · herkese aynı kelime · günde bir kez';
  $('#bStS').textContent = st.p || S.st.solo.p ? 'Günlük seri ' + st.cur + ' · serbest seri ' + S.st.solo.cur : 'Seri, başarı oranı, dağılım';
  setNameChip();
};
function setNameChip() { var e = $('#homeName'); if (e) e.textContent = S.name || 'Adını yaz'; }

/* ---------------- kullanıcı adı ---------------- */
GK.sheetName = function (next) {
  UI.afterName = next || null;
  openSheet('<h2>Kullanıcı adın</h2><p class="note" style="text-align:center;margin-top:0">Arkadaşların ve rakiplerin seni bu adla görür.</p>' +
    '<input class="inp nm2" id="nameIn2" maxlength="14" placeholder="Adın" value="' + esc(S.name) + '" autocomplete="off" autocapitalize="words">' +
    '<div class="gap"></div><button class="btn pri sm" data-act="saveName">Kaydet</button><div class="gap"></div><button class="btn sm" data-act="' + (next ? 'sheetBack' : 'close') + '">Vazgeç</button>',
    { back: next ? function () { UI.afterName = null; closeSheet(); } : null });
  setTimeout(function () { var e = $('#nameIn2'); if (e && e.focus) { try { e.focus(); } catch (x) {} } }, 150);
};

/* ---------------- serbest oyun ---------------- */
function sheetSolo() {
  var c = S.solo;
  openSheet('<h2>Serbest oyun</h2><p class="note" style="margin-top:0">İstediğin kadar kelime; her kelime için 6 hak.</p>' +
    '<h3>Harf sayısı</h3>' + seg('so_len', LENS, c.len) +
    '<h3>İlk harf açık</h3>' + seg('so_first', YN, c.first ? 1 : 0) +
    '<p class="note" style="margin:6px 0 0">' + (c.first ? 'Kelimenin ilk harfi verilir; tahminlerin o harfle başlar.' : 'Hiçbir harf verilmez; klasik oyun.') + '</p>' +
    '<div class="gap"></div><div class="gap"></div><button class="btn pri sm" data-act="startsolo">Başla</button><div class="gap"></div><button class="btn sm" data-act="close">Vazgeç</button>');
}

/* ---------------- bilgisayara karşı ---------------- */
function kindNote(k) { return k === 'turn' ? 'Sırayla: tahta ortak, herkes sırayla bir tahmin yapar; kelimeyi bulan puanı alır.' : 'Yarış: herkes aynı kelimeyi kendi tahtasında arar; az tahminde bulan çok puan alır.'; }
function sheetNewAI() {
  var c = S.ai;
  openSheet('<h2>Bilgisayara karşı</h2>' +
    '<h3>Rakip sayısı</h3>' + seg('ai_opp', [[1, '1 rakip'], [2, '2 rakip'], [3, '3 rakip']], c.opp) +
    '<h3>Oyun türü</h3>' + seg('ai_kind', [['race', 'Yarış'], ['turn', 'Sırayla']], c.kind) +
    '<p class="note" style="margin:4px 0 0">' + kindNote(c.kind) + '</p>' +
    '<h3>Zorluk</h3>' + seg('ai_diff', [[1, 'Kolay'], [2, 'Orta'], [3, 'Usta']], c.diff) +
    '<h3>Harf sayısı</h3>' + seg('ai_len', LENS, c.len) +
    '<h3>Tur sayısı</h3>' + seg('ai_rounds', [[3, '3'], [5, '5'], [7, '7'], [10, '10']], c.rounds) +
    '<h3>İlk harf açık</h3>' + seg('ai_first', YN, c.first ? 1 : 0) +
    '<h3>Süre</h3>' + seg('ai_tempo', [[0, 'Yok'], [1, 'Hızlı'], [2, 'Normal'], [3, 'Rahat']], c.tempo) +
    '<div class="gap"></div><div class="gap"></div><button class="btn pri sm" data-act="startai">Başla</button><div class="gap"></div><button class="btn sm" data-act="close">Vazgeç</button>');
}
function startAI() {
  var c = S.ai, n = c.opp + 1, names = [S.name || 'Sen'], kinds = ['me'], pool = GK.BOTN.slice(), i;
  for (i = 1; i < n; i++) { names.push(pool.splice(rnd(pool.length), 1)[0]); kinds.push('bot'); }
  closeSheet();
  GK.startMatch({ mode: 'ai', cfg: { n: n, kind: c.kind, len: c.len, tries: 6, first: !!c.first, rounds: c.rounds, time: GK.TEMPO[c.kind][c.tempo] }, names: names, kinds: kinds, diff: c.diff });
}

/* ---------------- aynı telefonda ---------------- */
function sheetLocal() {
  var c = S.lo, i, nm = '';
  for (i = 0; i < c.n; i++) nm += '<input class="inp nm2" id="ln' + i + '" maxlength="14" placeholder="Oyuncu ' + (i + 1) + '" value="' + esc((S.names && S.names[i]) || (i === 0 ? S.name : '')) + '" autocomplete="off" style="margin-bottom:6px">';
  openSheet('<h2>Aynı telefonda</h2><p class="note" style="margin-top:0">Tahta ortak; telefon elden ele dolaşır, herkes sırayla bir tahmin yapar. Kelimeyi bulan puanı alır.</p>' +
    '<h3>Oyuncu sayısı</h3>' + seg('lo_n', [[2, '2'], [3, '3'], [4, '4']], c.n) +
    '<h3>Harf sayısı</h3>' + seg('lo_len', LENS, c.len) +
    '<h3>Tur sayısı</h3>' + seg('lo_rounds', [[3, '3'], [5, '5'], [7, '7'], [10, '10']], c.rounds) +
    '<h3>İlk harf açık</h3>' + seg('lo_first', YN, c.first ? 1 : 0) +
    '<h3>Tahmin süresi</h3>' + seg('lo_tempo', [[0, 'Yok'], [1, '25 sn'], [2, '45 sn'], [3, '75 sn']], c.tempo) +
    '<h3>Oyuncu adları</h3>' + nm +
    '<button class="btn pri sm" data-act="startlocal">Başla</button><div class="gap"></div><button class="btn sm" data-act="close">Vazgeç</button>');
}
function startLocal() {
  var c = S.lo, names = [], kinds = [], i;
  for (i = 0; i < c.n; i++) { var e = $('#ln' + i), v = e ? e.value.replace(/\s+/g, ' ').trim().slice(0, 14) : ''; names.push(v || ('Oyuncu ' + (i + 1))); kinds.push('local'); }
  S.names = names; saveS();
  closeSheet();
  GK.startMatch({ mode: 'local', cfg: { n: c.n, kind: 'turn', len: c.len, tries: 6, first: !!c.first, rounds: c.rounds, time: GK.TEMPO.turn[c.tempo] }, names: names, kinds: kinds });
}

/* ---------------- puan / istatistik ---------------- */
function sheetStats(back) {
  var v = S.st.vs;
  openSheet('<h2>İstatistikler</h2><h3>Günün kelimesi</h3>' + GK.statBlock(S.st.daily, 0) + '<h3>Serbest oyun</h3>' + GK.statBlock(S.st.solo, 0) +
    '<h3>Rakipli oyunlar</h3><div class="stg"><div><b>' + v.w + '</b><small>Galibiyet</small></div><div><b>' + v.l + '</b><small>Mağlubiyet</small></div><div><b>' + v.d + '</b><small>Beraberlik</small></div></div>' +
    '<div class="gap"></div><button class="btn pri sm" data-act="close">Tamam</button><div class="gap"></div><button class="btn sm" data-act="resetStats">İstatistikleri sıfırla</button>', { back: back || null });
}
function sheetScore() {
  var V = G.V; if (!V) return;
  if (V.cfg.n === 1) { sheetStats(); return; }
  var rows = '', s, c = V.cfg;
  for (s = 0; s < c.n; s++) rows += '<div class="sc"><i class="av" style="background:' + GK.COLS[s % 4] + '">' + GK.initial(V.names[s]) + '</i><div class="nm"><b>' + esc(V.names[s]) + '</b><small>' + (V.kd[s] === 'bot' ? 'Bilgisayar' : (s === V.me && V.mode !== 'local' ? 'Sen' : 'Oyuncu')) + '</small></div><div class="tt">' + V.scores[s] + '</div></div>';
  openSheet('<h2>Puan durumu</h2><p class="note" style="margin:0 0 6px">Tur ' + V.round + '/' + c.rounds + ' · ' + (c.kind === 'turn' ? 'Sırayla' : 'Yarış') + ' · ' + c.len + ' harf</p>' + rows +
    '<p class="note">Kelimeyi 1. tahminde bulan 60, 2.’de 50 … 6.’da 10 puan alır.' + (c.kind === 'race' ? ' Yarışta ilk bulan +5 alır.' : '') + '</p><button class="btn pri sm" data-act="close">Tamam</button>');
}

/* ---------------- kılavuz ---------------- */
function sheetRules(back) {
  openSheet('<h2>Kılavuz</h2>' +
    '<p><b>Amaç:</b> Gizli kelimeyi <b>6 tahminde</b> bulmak. Her tahmin sözlükte bulunan gerçek bir kelime olmalı. Her tahminden sonra harfler renklenir ve sana yol gösterir.</p>' +
    '<h3>Renkler</h3>' + fig('kitap', '20010') +
    '<p class="cap">Gizli kelime KALEM olsun. KİTAP yazdın:</p>' +
    '<ul><li><b style="color:var(--g1)">Yeşil K</b>: harf kelimede var ve <b>doğru yerde</b>.</li><li><b style="color:var(--y1)">Sarı A</b>: harf kelimede var ama <b>yeri yanlış</b>.</li><li><b style="color:#aaa">Gri İ, T, P</b>: bu harfler kelimede <b>yok</b>.</li></ul>' +
    fig('melek', '10221') +
    '<p class="cap">Aynı harf iki kez: MELEK’te ilk E gri, çünkü KALEM’de tek E var ve o zaten yeşil olan.</p>' +
    fig('kalem', '22222') + '<p class="cap">Hepsi yeşil: kelimeyi buldun!</p>' +
    '<h3>Nasıl oynanır</h3><ul><li>Ekrandaki klavyeden harflere dokun, <b>GİR</b> ile tahmini gönder, <b>⌫</b> ile sil.</li><li><b>Harfe dokun:</b> yalnız o harf silinir; yerine yenisini yazarsın. Boş bir kutuya dokunursan oradan yazmaya devam edersin.</li><li><b>Sürükle-bırak:</b> yazdığın bir harfi parmağınla tutup başka kutuya bırak; iki kutu yer değiştirir.</li><li>Klavyedeki tuşlar da renklenir: yeşil, sarı ya da sönük (kelimede yok).</li><li>Daha önce bulduğun yeşil harfler yeni satırda <b>soluk</b> olarak görünür; o kutuyu boş bırakıp GİR’e basarsan soluk harf kendiliğinden yazılır.</li><li>Türkçe harfler ayrıdır: <b>I</b> ile <b>İ</b>, <b>O</b> ile <b>Ö</b>, <b>S</b> ile <b>Ş</b> farklı harflerdir.</li><li>Sözlük, Harf Harmanı’ndaki sözlüktür. Gizli kelimeler günlük hayatta sık kullanılanlardan seçilir.</li></ul>' +
    '<h3>Oyun seçenekleri</h3><ul><li><b>Günün kelimesi:</b> her gün herkese aynı 5 harfli kelime. Günde bir kez oynanır; sonucunu renkli karelerle paylaşabilirsin (kelime görünmez).</li><li><b>Serbest oyun:</b> istediğin kadar kelime; 4, 5, 6 ya da 7 harf.</li><li><b>İlk harf açık:</b> kelimenin ilk harfi verilir; bütün tahminler o harfle başlar.</li><li><b>Zor mod</b> (Ayarlar): bulduğun yeşil ve sarı harfleri sonraki tahminlerde kullanmak zorundasın.</li></ul>' +
    '<h3>İpucu düğmesi</h3><ul><li>İpuçlarına uyan <b>kaç olası kelime</b> kaldığını ve henüz denemediğin sık harfleri gösterir.</li><li><b>Bir harf aç:</b> bulunmamış bir harfi yerinde gösterir (kelime başına 2 hak).</li><li><b>Anlamını göster:</b> gizli kelimenin sözlük anlamını okursun.</li><li>Harf açma ve anlam yalnızca tek kişilik oyunlarda vardır.</li></ul>' +
    '<h3>Rakipli oyunlar</h3><ul><li><b>Yarış:</b> herkes aynı kelimeyi kendi tahtasında arar. Rakiplerinin yalnızca renklerini görürsün. Biri kelimeyi bulunca diğerlerine <b>30 saniye</b> kalır; isteyen <b>Turu geç</b> diyerek beklemeden sonraki kelimeye geçilmesini sağlar. Bilgisayar rakipler bekletmez.</li><li><b>Sırayla:</b> tahta ortaktır; herkes sırayla bir tahmin yapar. Süren dolarsa sıra geçer. Kelimeyi bulan puanı alır.</li><li><b>Puan:</b> 1. tahminde 60, 2.’de 50, 3.’de 40, 4.’de 30, 5.’de 20, 6.’da 10. Yarışta ilk bulan +5. Turların sonunda en çok puanı olan kazanır.</li></ul>' +
    '<h3>Taktikler</h3><ul class="tip"><li>İlk tahminde çok kullanılan harfleri dene: <b>A, E, İ, K, L, R, N</b>. Örnek: KALEM, SERİN, TAKIM.</li><li>İkinci tahminde ilkinde olmayan yeni harfler kullan; harf elemek de bilgi verir.</li><li>Sarı harfi aynı yere bir daha koyma.</li><li>Türkçede ünlü uyumunu hatırla: kalın (A, I, O, U) ve ince (E, İ, Ö, Ü) ünlüler çoğu kelimede karışmaz.</li><li>Sonu -MA/-ME, -LI/-Lİ, -LIK/-LİK ile biten kelimeler çoktur.</li></ul>' +
    '<h3>Çevrimiçi</h3><ul><li><b>Çevrimiçi → Oda kur</b> ile 2–4 kişilik oda aç, çevrimiçi arkadaşlarını tek dokunuşla çağır. Boş koltuklara bilgisayar oturur.</li><li>Arkadaş eklemek için kodunu paylaş ya da onun kodunu yaz. Davet bağlantısı da çalışır. Domino’daki arkadaş kodun ve listen burada da geçerlidir.</li><li>Oyun sırasında <b>Sohbet</b> düğmesiyle mesaj gönderebilirsin.</li><li>Bağlantın koparsa yerine bilgisayar oynar; döndüğünde koltuğunu geri alırsın.</li></ul>' +
    SIG + '<div class="gap"></div><button class="btn pri sm" data-act="' + (back ? 'sheetBack' : 'close') + '">Anladım</button>', { back: back || null });
}

/* ---------------- ayarlar ---------------- */
function sheetSettings() {
  openSheet('<h2>Ayarlar</h2>' +
    '<h3>Oynanış</h3>' +
    '<div class="row"><div class="lb">Zor mod<small>Bulunan harfler kullanılmak zorunda</small></div>' + seg('hard', [[1, 'Açık'], [0, 'Kapalı']], S.hard ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Bulunanları göster<small>Yeşil harfler yeni satırda soluk görünür</small></div>' + seg('ghost', YN, S.ghost ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Öğretici ipuçları<small>Oyun sırasında açıklamalar</small></div>' + seg('coach', [[1, 'Açık'], [0, 'Kapalı']], S.coach ? 1 : 0) + '</div>' +
    '<h3>Görünüm</h3>' +
    '<div class="row"><div class="lb">Renkler<small>Kontrast: renk körlüğü için turuncu / mavi</small></div>' + seg('renk', [['klasik', 'Klasik'], ['kontrast', 'Kontrast']], S.renk) + '</div>' +
    '<div class="row"><div class="lb">Masa</div>' + seg('table', [['zumrut', 'Yeşil'], ['gece', 'Lacivert'], ['bordo', 'Bordo'], ['kursun', 'Kurşun'], ['siyah', 'Siyah']], S.table) + '</div>' +
    '<div class="row"><div class="lb">3D kalitesi<small>Sade: eski telefonlar için en akıcı</small></div>' + seg('q', [[0, 'Sade'], [1, 'Dengeli'], [2, 'Zengin']], S.perf ? 0 : (S.q === 1 ? 1 : 2)) + '</div>' +
    '<div class="row"><div class="lb">Bakış açısı</div>' + seg('tilt', [[0, 'Düz'], [8, 'Hafif'], [15, 'Eğik']], S.tilt) + '</div>' +
    '<div class="row"><div class="lb">Klavye boyu</div>' + seg('kb', [['kucuk', 'Küçük'], ['orta', 'Orta'], ['buyuk', 'Büyük']], S.kb) + '</div>' +
    '<h3>Ses ve ekran</h3>' +
    '<div class="row"><div class="lb">Ses</div>' + seg('sound', [[1, 'Açık'], [0, 'Kapalı']], S.sound ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Titreşim</div>' + seg('haptic', [[1, 'Açık'], [0, 'Kapalı']], S.haptic ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Animasyon</div>' + seg('anim', [['full', 'Tam'], ['fast', 'Hızlı'], ['off', 'Kapalı']], S.anim) + '</div>' +
    '<div class="row"><div class="lb">OLED koruma<small>Ekran kayması, kısılan arayüz</small></div>' + seg('oled', [[1, 'Açık'], [0, 'Kapalı']], S.oled ? 1 : 0) + '</div>' +
    '<div class="row"><div class="lb">Üst boşluk<small>Kamera deliği ya da çentik için</small></div>' + seg('top', [[0, 'Yok'], [14, 'Az'], [28, 'Orta'], [44, 'Çok']], S.top) + '</div>' +
    '<div class="row"><div class="lb">Ekran açık kalsın</div>' + seg('wake', YN, S.wake ? 1 : 0) + '</div>' +
    '<h3>Çevrimiçi adın</h3><input class="inp nm2" id="nameIn" maxlength="14" placeholder="Oyuncu" value="' + esc(S.name) + '" autocomplete="off">' +
    '<div class="gap"></div><button class="btn sm" data-act="rules2">Kılavuz</button><div class="gap"></div><button class="btn pri sm" data-act="close">Tamam</button>' + SIG);
}
function applySetting(k, v) {
  var bools = { sound: 1, haptic: 1, oled: 1, wake: 1, coach: 1, hard: 1, ghost: 1 };
  if (bools[k]) S[k] = v === '1';
  else if (k === 'tilt' || k === 'top' || k === 'q') S[k] = parseInt(v, 10);
  else S[k] = v;
  if (k === 'q') S.perf = (S.q === 0);
  if (k === 'coach') { if (S.coach) S.seen = {}; else GK.hideCoach(); }
  saveS();
  if (k === 'top') GK.probeInsets();
  if (k === 'table' || k === 'renk' || k === 'tilt' || k === 'q') GK.applyLook();
  if (k === 'oled') GK.applyOled();
  if (k === 'wake') GK.wake();
  if (k === 'sound') SND.key();
  if (k === 'hard' && S.hard) toast('Zor mod açık: yeşil ve sarı harfleri kullanmak zorundasın', 2800);
  if (G.V && gameOn()) { GK.render(); setTimeout(GK.render, 80); }
}

/* ---------------- eylemler ---------------- */
function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement; }
function confirmSheet(title, text, yes, act) {
  openSheet('<h2>' + title + '</h2><p class="note" style="font-size:14px">' + text + '</p><div class="gap"></div><button class="btn pri sm" data-act="' + act + '">' + yes + '</button><div class="gap"></div><button class="btn sm" data-act="close">Vazgeç</button>');
}
var ACT = {
  daily: function () { GK.startDaily(); },
  cont: function () { if (!GK.loadGame()) GK.homeRefresh(); },
  solo: function () { sheetSolo(); },
  soloGo: function () { GK.leaveGame(); sheetSolo(); },
  startsolo: function () { closeSheet(); LS.del('gizli.save'); GK.startSolo(); },
  newai: function () { sheetNewAI(); },
  startai: function () { startAI(); },
  local: function () { sheetLocal(); },
  startlocal: function () { startLocal(); },
  online: function () { if (!S.name) GK.sheetName(GK.sheetOnline); else GK.sheetOnline(); },
  name: function () { GK.sheetName(UI.onl ? GK.sheetOnline : (UI.lobby ? GK.sheetLobby : null)); },
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
    GK.setOnl(ok ? 'Kod kopyalandı.' : 'Kodun: <b>' + S.uid + '</b>');
  },
  addFr: function () {
    var el = $('#fcIn'), c = GK.cleanCode(el ? el.value : '');
    if (c.length !== 6) { GK.setOnl('Kod 6 karakter olmalı.'); return; }
    if (c === S.uid) { GK.setOnl('Bu senin kendi kodun.'); return; }
    if (GK.findFr(c)) { GK.setOnl('Bu kişi zaten listende.'); return; }
    if (!GK.addFr(c, '')) return;
    if (el) el.value = '';
    GK.setOnl('Eklendi. Çevrimiçiyse adı görünecek.'); GK.refreshFr(); GK.pingFr(c);
  },
  rmFr: function (b) { var id = b.getAttribute('data-id'); S.friends = S.friends.filter(function (f) { return f.id !== id; }); saveS(); GK.refreshFr(); },
  inv: function (b) { Net.invite(b.getAttribute('data-id')); },
  invAcc: function () { Net.invAccept(); },
  invNo: function () { Net.invDecline(); },
  retry: function () { GK.netRetry(); },
  newRoom: function () { Net.newRoom(); },
  kick: function (b) { Net.kick(parseInt(b.getAttribute('data-i'), 10)); },
  lbStart: function () { GK.hostStart(); },
  lbShare: function () { Net.share(); },
  lbClose: function () { Net.closeRoom(); closeSheet(); },
  leaveRoom: function () { Net.leave(); },
  chat: function () { GK.sheetChat(); },
  chat2: function () { GK.sheetChat(function () { if (G.V && G.V.phase !== 'play') GK.showEnd(); else closeSheet(); }); },
  skipRound: function () { confirmSheet('Bu turu geç?', 'Kelime bulundu. Geçersen bu turdan puan alamazsın; herkes bitirince hemen sonraki kelimeye geçilir.', 'Turu geç', 'skipYes'); },
  skipYes: function () { closeSheet(); GK.skipRound(); },
  chSend: function () { var e = $('#chIn'); if (!e) return; GK.sendChat(e.value); e.value = ''; },
  chQ: function (b) { GK.sendChat(GK.QUICK[parseInt(b.getAttribute('data-i'), 10)]); },
  sheetBack: function () { if (UI.back) { var f = UI.back; f(); } },
  back: function () { handleBack(false); },
  fs: function () {
    var d = document.documentElement, rq = d.requestFullscreen || d.webkitRequestFullscreen || d.mozRequestFullScreen || d.msRequestFullscreen;
    if (fsEl()) { var ex = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen; try { ex.call(document); } catch (e) {} return; }
    if (!rq) { toast('Bu tarayıcı tam ekranı desteklemiyor. Ana ekrana ekleyerek tam ekran kullanabilirsin.', 3600); return; }
    try { var r = rq.call(d); if (r && r.catch) r.catch(function () { toast('Tam ekran açılamadı'); }); } catch (e) { toast('Tam ekran açılamadı'); }
  },
  coachOk: function () { GK.hideCoach(); },
  coachOff: function () { GK.hideCoach(); S.coach = false; saveS(); toast('İpuçları kapandı. Ayarlardan açabilirsin.', 2800); },
  hint: function () { GK.sheetHint(); },
  hintRev: function () { GK.hintReveal(); },
  hintMean: function () { GK.hintMean(); },
  score: function () { sheetScore(); },
  stats: function () { sheetStats(); },
  resetStats: function () { confirmSheet('İstatistikleri sıfırla?', 'Seri, başarı oranı ve dağılım silinir. Geri alınamaz.', 'Sıfırla', 'resetYes'); },
  resetYes: function () { S.st = { solo: GK.stat0(), daily: GK.stat0(), vs: { w: 0, l: 0, d: 0 } }; saveS(); closeSheet(); GK.homeRefresh(); toast('İstatistikler sıfırlandı'); },
  shareDay: function () { GK.shareDay(); },
  rules: function () { sheetRules(); },
  rules2: function () { sheetRules(sheetSettings); },
  settings: function () { sheetSettings(); },
  close: function () { closeSheet(); if (G.V && gameOn() && G.V.phase !== 'play') GK.note('Sonucu yeniden görmek için SONUÇ tuşuna bas', 2600); },
  nextRound: function () { GK.nextRound(); },
  rematch: function () { GK.rematch(); },
  home: function () {
    var V = G.V;
    if (gameOn() && V) {
      if (G.mode === 'host') { confirmSheet('Odayı kapat?', 'Ev sahibi çıkarsa oda kapanır ve herkesin oyunu biter.', 'Kapat ve çık', 'leaveYes'); return; }
      if (G.mode === 'guest' && V.phase !== 'mend') { confirmSheet('Oyundan ayrıl?', 'Ayrılırsan yerine bilgisayar oynar.', 'Ayrıl', 'leaveYes'); return; }
      if ((G.mode === 'ai' || G.mode === 'local') && V.phase !== 'mend') { confirmSheet('Oyundan çık?', 'Bu oyun kaydedilmez; puanlar silinir.', 'Çık', 'leaveYes'); return; }
    }
    ACT.leaveYes();
  },
  home2: function () { if (G.mode === 'host' || (G.V && G.V.phase === 'rend' && G.V.cfg.n > 1)) ACT.home(); else ACT.leaveYes(); },
  leaveYes: function () { GK.leaveGame(); },
  giveYes: function () { closeSheet(); GK.giveUp(); },
  resign: function () {
    var V = G.V; if (!V) return;
    if (V.phase !== 'play') { ACT.home(); return; }
    if (V.cfg.n === 1) confirmSheet('Kelimeyi bırak?', 'Gizli kelime gösterilir, bu oyun kaybedilmiş sayılır ve serin sıfırlanır. (Yalnızca ara vermek istiyorsan ana menüye dön; oyunun kaydedilir.)', 'Bırak ve kelimeyi göster', 'giveYes');
    else ACT.home();
  }
};
GK.ACT = ACT;

/* geri düğmesi / tarayıcı geri */
function handleBack(fromPop) {
  function rep() { if (fromPop) GK.rePush(); }
  if ($('#coach').className === 'on') { GK.hideCoach(); rep(); return; }
  if ($('#ov').className === 'on') {
    if (UI.back) { var f = UI.back; f(); rep(); return; }
    if ($('#ov').getAttribute('data-nc')) { rep(); return; }
    closeSheet(); rep(); return;
  }
  if (gameOn()) { ACT.home(); if (fromPop) setTimeout(GK.rePush, 0); }
}

/* ---------------- olaylar ---------------- */
function upTo(el, attr) { while (el && el !== document) { if (el.getAttribute && el.getAttribute(attr) !== null) return el; el = el.parentNode; } return null; }
document.addEventListener('click', function (e) {
  GK.resetIdle();
  var t = e.target, b;
  var kk = upTo(t, 'data-k');
  if (kk) { GK.audio(); GK.key(kk.getAttribute('data-k')); return; }
  if (t.id === 'ov' && !t.getAttribute('data-nc')) { ACT.close(); return; }
  var sg = upTo(t, 'data-seg');
  if (sg && t.getAttribute('data-v') !== null && t.tagName === 'BUTTON') {
    var k = sg.getAttribute('data-seg'), v = t.getAttribute('data-v'), p = k.slice(0, 3), kk2 = k.slice(3);
    [].forEach.call(sg.children, function (c) { c.className = c === t ? 'on' : ''; });
    if (p === 'so_') { if (kk2 === 'first') S.solo.first = v === '1'; else S.solo.len = parseInt(v, 10); saveS(); if (kk2 === 'first') sheetSolo(); }
    else if (p === 'ai_') { S.ai[kk2] = kk2 === 'kind' ? v : (kk2 === 'first' ? v === '1' : parseInt(v, 10)); saveS(); if (kk2 === 'kind') sheetNewAI(); }
    else if (p === 'lo_') {
      var keep = []; for (var q = 0; q < 4; q++) { var inp = $('#ln' + q); keep.push(inp ? inp.value : ''); }
      S.names = keep.map(function (x, i) { return x || (S.names && S.names[i]) || ''; });
      S.lo[kk2] = kk2 === 'first' ? v === '1' : parseInt(v, 10); saveS();
      if (kk2 === 'n') sheetLocal();
    } else if (p === 'lc_') Net.lobbyCfg(k, v);
    else applySetting(k, v);
    return;
  }
  b = upTo(t, 'data-act');
  if (b) { var f = ACT[b.getAttribute('data-act')]; if (f && !b.disabled) { GK.audio(); f(b); } return; }
}, false);
document.addEventListener('input', function (e) {
  var id = e.target.id;
  if (id === 'nameIn') { S.name = e.target.value.slice(0, 14); saveS(); }
  else if (id === 'fcIn') { var c = GK.cleanCode(e.target.value); if (c !== e.target.value) e.target.value = c; }
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
  for (i = 0; i < ps.length; i++) ps[i].setAttribute('d', on ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5');
  onResize();
}
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(function (n) { document.addEventListener(n, fsChange, false); });
document.addEventListener('touchstart', GK.resetIdle, { passive: true });
document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
var rs = null;
function onResize() { clearTimeout(rs); rs = setTimeout(function () { GK.probeInsets(); GK.onResize(); }, 120); }
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', function () { setTimeout(onResize, 250); });
document.addEventListener('visibilitychange', function () { if (!document.hidden) { GK.wake(); if (!gameOn()) GK.homeRefresh(); } });

/* ---------------- başlat ---------------- */
GK.probeInsets(); GK.applyLook(); GK.applyOled(); GK.homeRefresh();
GK.ensureUid();
(function () {
  var m = /[?&]f=([A-Za-z0-9]{6})/.exec(location.search), code = m && m[1].toUpperCase();
  if (m) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
  if (code && code !== S.uid) {
    GK.addFr(code, '');
    setTimeout(function () { if (!S.name) GK.sheetName(GK.sheetOnline); else { GK.sheetOnline(); GK.setOnl('Davet bağlantısından eklendi.'); } }, 500);
  } else if (S.onl) GK.presStart();
})();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { GK.onResize(); });
})(window);
