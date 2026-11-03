/* Kart Salonu · ayarlar penceresi ve kullanım kılavuzu */
(function (root) {
'use strict';
var KS = root.KS;
var h = KS.h;

/* ---------- Ayar denetimleri ---------- */
function commit(k, v) { KS.S[k] = v; KS.saveSettings(); KS.applySettings(); }
function row(label, sub, ctl) {
  return h('div', { class: 'row' }, h('div', { class: 'lb' }, h('b', { text: label }), sub ? h('span', { text: sub }) : null), ctl);
}
function seg(k, opts, after) {
  var box = h('div', { class: 'seg' });
  opts.forEach(function (o) {
    var b = h('button', { text: o[1], class: KS.S[k] === o[0] ? 'on' : '', onclick: function () {
      KS.sfx('click'); commit(k, o[0]); KS.$$('button', box).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); if (after) after();
    } });
    box.appendChild(b);
  });
  return box;
}
function sw(k, after) {
  var b = h('button', { class: 'sw' + (KS.S[k] ? ' on' : ''), role: 'switch', 'aria-checked': KS.S[k] ? 'true' : 'false', onclick: function () {
    KS.sfx('click'); commit(k, !KS.S[k]); b.classList.toggle('on', !!KS.S[k]); b.setAttribute('aria-checked', KS.S[k] ? 'true' : 'false'); if (after) after();
  } });
  return b;
}
function step(k, min, max, st, fmt, after) {
  var out = h('output', { text: fmt(KS.S[k]) });
  function ch(d) { var v = KS.clamp(Math.round((KS.S[k] + d) / st) * st, min, max); KS.sfx('click'); commit(k, v); out.textContent = fmt(v); if (after) after(); }
  return h('div', { class: 'step' }, h('button', { text: '−', 'aria-label': 'Azalt', onclick: function () { ch(-st); } }), out, h('button', { text: '+', 'aria-label': 'Artır', onclick: function () { ch(st); } }));
}
function range(k, min, max, st, fmt) {
  var out = h('output', { text: fmt(KS.S[k]), style: { minWidth: '3rem', textAlign: 'right', color: 'var(--gold2)', fontWeight: 700, fontSize: '.85rem' } });
  var inp = h('input', { type: 'range', min: min, max: max, step: st, value: KS.S[k] });
  inp.addEventListener('input', function () { commit(k, +inp.value); out.textContent = fmt(+inp.value); });
  return h('div', { style: { display: 'flex', alignItems: 'center', gap: '.4rem' } }, inp, out);
}
function pct(v) { return v + '%'; }
function sec(v) { return v + ' sn'; }
function px(v) { return v + ' px'; }

function previewCards() {
  var box = h('div', { style: { display: 'flex', gap: '.4rem', justifyContent: 'center', margin: '.5rem 0 .2rem', '--cw': '3.6rem' } });
  [KS.make(1, 1), KS.make(0, 11), KS.make(2, 10), KS.make(3, 6)].forEach(function (c) { var e = KS.cards.el(c); e.classList.add('static'); box.appendChild(e); });
  var b = KS.cards.el(-1); b.classList.add('static', 'down'); box.appendChild(b);
  return box;
}

KS.settingsSheet = function () {
  var S = KS.S;
  var tabs = [
    { n: 'Görünüm', f: function () {
      var d = h('div');
      d.appendChild(previewCards());
      d.appendChild(h('div', { class: 'grp', text: 'Masa' }));
      var sw1 = h('div', { class: 'swatches' });
      KS.TABLES.forEach(function (t) {
        var b = h('button', { class: 'swatch' + (S.table === t.id ? ' on' : ''), onclick: function () { KS.sfx('click'); commit('table', t.id); KS.$$('.swatch', sw1).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); } },
          h('i', { style: { background: 'radial-gradient(ellipse at 50% 40%, ' + t.a + ', ' + t.b + ')', boxShadow: 'inset 0 0 0 2px ' + t.rim } }), t.n);
        sw1.appendChild(b);
      });
      d.appendChild(sw1);
      d.appendChild(h('div', { class: 'grp', text: 'Kart arkası' }));
      var sw2 = h('div', { class: 'backs' });
      KS.BACKS.forEach(function (bk) {
        var hold = h('div', { class: 'holder', style: { '--cw': '2.5rem' } });
        var prev = KS.cards.el(-1); prev.classList.add('static', 'down'); prev.setAttribute('data-backid', bk.id);
        hold.appendChild(prev);
        var b = h('button', { class: 'swatch' + (S.back === bk.id ? ' on' : ''), onclick: function () { KS.sfx('click'); commit('back', bk.id); KS.$$('.swatch', sw2).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); } }, hold, bk.n);
        sw2.appendChild(b);
      });
      d.appendChild(sw2);
      d.appendChild(h('div', { class: 'note', text: 'Seçtiğin desen masadaki tüm kartlara uygulanır.' }));
      d.appendChild(h('div', { class: 'grp', text: 'Kart yüzü' }));
      d.appendChild(seg('face', [['krem', 'Krem'], ['beyaz', 'Beyaz'], ['koyu', 'Koyu']]));
      d.appendChild(row('Dört renkli takımlar', 'Karo mavi, sinek yeşil; karışmaz', sw('fourc')));
      d.appendChild(row('Büyük kart yazısı', 'Köşe sayıları daha okunaklı', sw('bigidx')));
      d.appendChild(row('Kart boyutu', null, seg('cardsize', [['s', 'Küçük'], ['m', 'Orta'], ['l', 'Büyük']], function () { if (KS.onLayout) KS.onLayout(); })));
      d.appendChild(row('Elimi diz', 'Kartlarını otomatik sıralar', seg('sort', [['suit', 'Renge göre'], ['rank', 'Sayıya göre'], ['none', 'Elle']])));
      d.appendChild(row('Oynanabilir kartları parlat', null, sw('glow')));
      d.appendChild(row('Düğme sütunu yeri', 'Yatay ekranda', seg('railpos', [['left', 'Sol'], ['right', 'Sağ']], function () { if (KS.onLayout) KS.onLayout(); })));
      return d;
    } },
    { n: 'Oyun', f: function () {
      var d = h('div');
      d.appendChild(h('div', { class: 'grp', text: 'Oynayış' }));
      d.appendChild(row('Tek dokunuşla oyna', 'Kapalıyken: önce seç, sonra tekrar dokun ya da yukarı sürükle', sw('tap1')));
      d.appendChild(row('Çıkarken sor', 'Yanlışlıkla çıkmayı önler', sw('confirmExit')));
      d.appendChild(h('div', { class: 'grp', text: 'Bilgisayar oyuncuları' }));
      d.appendChild(row('Zorluk', null, seg('level', [['easy', 'Kolay'], ['medium', 'Orta'], ['hard', 'Zor']])));
      d.appendChild(row('Düşünme hızı', null, seg('botspeed', [['fast', 'Hızlı'], ['normal', 'Normal'], ['slow', 'Yavaş']])));
      d.appendChild(h('div', { class: 'grp', text: 'Animasyon' }));
      d.appendChild(row('Hareketler', 'Eski telefonda "Sade" daha akıcıdır', seg('anim', [['full', 'Tam'], ['lite', 'Sade'], ['off', 'Kapalı']])));
      d.appendChild(row('Hareket hızı', null, seg('speed', [['fast', 'Hızlı'], ['normal', 'Normal'], ['slow', 'Yavaş']])));
      d.appendChild(row('Gölgeler', null, seg('shadows', [['full', 'Tam'], ['lite', 'Hafif']])));
      return d;
    } },
    { n: 'Ses', f: function () {
      var d = h('div');
      d.appendChild(row('Ses efektleri', 'Kart sesleri ve melodiler', sw('sfx')));
      d.appendChild(row('Ses düzeyi', null, range('vol', 0, 100, 5, pct)));
      d.appendChild(row('Titreşim', 'Sıran gelince ve ceza yiyince', sw('vibrate')));
      d.appendChild(h('div', { class: 'grp', text: 'Dene' }));
      var t = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '.4rem' } });
      [['Kart dağıt', 'deal'], ['Kart koy', 'place'], ['Topla', 'take'], ['Pişti', 'pisti'], ['Sıra', 'turn'], ['Kazan', 'win']].forEach(function (x) {
        t.appendChild(h('button', { class: 'btn sm', text: x[0], onclick: function () { KS.sfx(x[1]); } }));
      });
      d.appendChild(t);
      return d;
    } },
    { n: 'Ekran koruma', f: function () {
      var d = h('div');
      d.appendChild(h('p', { class: 'note', text: 'OLED ekranlarda aynı görüntü uzun süre durursa iz bırakabilir. Bu bölüm görüntüyü hafifçe kaydırır, boşta kısar ve arayüzü soluklaştırır.' }));
      d.appendChild(row('OLED koruması', 'Tüm koruma özelliklerinin ana anahtarı', sw('oled')));
      d.appendChild(row('Kaydırma sıklığı', 'Görüntü birkaç piksel yer değiştirir', range('shiftEvery', 15, 180, 15, sec)));
      d.appendChild(row('Boşta karart', 'Dokunmadan bu kadar sonra ekran kararır (0 = kapalı)', range('idleDim', 0, 300, 15, function (v) { return v ? v + ' sn' : 'Kapalı'; })));
      d.appendChild(row('Karartma yoğunluğu', null, range('dimLevel', 30, 95, 5, pct)));
      d.appendChild(row('Ekran açık kalsın', 'Oyun sırasında ekran kendiliğinden kapanmaz', sw('wake', function () { KS.keepAwake(!!KS.S.wake); })));
      d.appendChild(row('Oyuna girince tam ekran', null, sw('autofs')));
      return d;
    } },
    { n: 'Ekran', f: function () {
      var d = h('div');
      d.appendChild(h('p', { class: 'note', text: 'Çentik, yuvarlak köşe ya da sistem çubuğu yüzünden kenarlarda bir şey kesiliyorsa boşluğu buradan artır.' }));
      d.appendChild(row('Sol boşluk', null, step('safeL', 0, 60, 2, px)));
      d.appendChild(row('Sağ boşluk', null, step('safeR', 0, 60, 2, px)));
      d.appendChild(row('Üst boşluk', null, step('safeT', 0, 60, 2, px)));
      d.appendChild(row('Alt boşluk', null, step('safeB', 0, 60, 2, px)));
      d.appendChild(row('Arayüz boyutu', 'Düğme ve yazılar', range('uiscale', 85, 130, 5, pct)));
      return d;
    } },
    { n: 'Çevrimiçi', f: function () {
      var d = h('div');
      d.appendChild(row('Sunucu', 'Otomatik: en hızlı yanıt veren seçilir', seg('broker', [['auto', 'Otomatik'], ['custom', 'Özel']])));
      var inp = h('input', { class: 'input', placeholder: 'wss://sunucu:port/mqtt', value: S.customBroker || '' });
      inp.addEventListener('change', function () { commit('customBroker', KS.clean(inp.value, 120)); });
      d.appendChild(inp);
      d.appendChild(h('p', { class: 'note', text: 'Bağlantı ayarını değiştirdikten sonra çevrimiçi ekrandan yeniden bağlan.' }));
      d.appendChild(h('div', { class: 'grp', text: 'Arkadaş kodum' }));
      d.appendChild(h('div', { class: 'code', text: S.id }));
      d.appendChild(h('div', { style: { display: 'flex', gap: '.5rem' } },
        h('button', { class: 'btn sm block', onclick: function () { KS.copy(S.id); KS.toast('Kod kopyalandı'); } }, KS.ic('copy'), 'Kopyala'),
        h('button', { class: 'btn sm block', onclick: function () { KS.share('Kart Salonu', 'Beni Kart Salonu\'nda arkadaş ekle: ' + S.id, location.href.split('#')[0] + '#f=' + S.id); } }, KS.ic('share'), 'Paylaş')));
      return d;
    } },
    { n: 'Hakkında', f: function () {
      var d = h('div');
      d.appendChild(h('div', { class: 'sign', style: { fontSize: '2.2rem', margin: '.6rem 0' }, text: 'by uozdil' }));
      d.appendChild(h('p', { class: 'note', style: { textAlign: 'center' }, text: 'Kart Salonu · Pişti, Dost Kazığı ve Pis Yedili. Kurulum gerekmez; görseller ve sesler cihazda üretilir.' }));
      d.appendChild(h('div', { class: 'grp', text: 'Veri' }));
      d.appendChild(row('Ayarları sıfırla', 'Ad ve arkadaşların kalır', h('button', { class: 'btn sm', text: 'Sıfırla', onclick: function () { KS.resetSettings(); KS.toast('Ayarlar sıfırlandı'); KS.closeTop(); } })));
      d.appendChild(row('Kayıtlı oyunu sil', 'Devam et kartını kaldırır', h('button', { class: 'btn sm red', text: 'Sil', onclick: function () { KS.lsDel('save'); KS.lsDel('hostroom'); KS.toast('Silindi'); if (KS.App) KS.App.home(); } })));
      return d;
    } }
  ];
  return KS.sheet('Ayarlar', null, { tabs: tabs, wide: true, tab: 0 });
};

/* ---------- Kullanım kılavuzu ---------- */
function crow(cards, cap) {
  var r = h('div', { class: 'cr' });
  cards.forEach(function (c) {
    if (c === '→') { r.appendChild(h('span', { class: 'arrow', text: '→' })); return; }
    var e = KS.cards.el(c < 0 ? -1 : c); e.classList.add('static'); if (c < 0) e.classList.add('down'); r.appendChild(e);
  });
  var w = h('div'); w.appendChild(r); if (cap) w.appendChild(h('div', { class: 'cap', text: cap }));
  return w;
}
function html(s) { var d = h('div', { class: 'help' }); d.innerHTML = s; return d; }
var M = KS.make;

var HELP = {
  basics: function () {
    var d = html(
      '<h3>Hızlı başlangıç</h3><ol><li>Ana sayfada adını yaz, simgeni seç.</li><li>Bir oyuna dokun, kişi sayısını ve seçenekleri seç.</li><li><b>Başla</b> ile bilgisayara karşı, <b>Çevrimiçi oda kur</b> ile arkadaşlarınla oyna.</li></ol>' +
      '<h3>Kart oynamak</h3><p>Kartına <span class="k">dokun</span> (yükselir), tekrar dokun ya da <span class="k">yukarı sürükle</span>. Ayarlardan "Tek dokunuşla oyna"yı açarsan ilk dokunuş yeter. Parlayan kartlar oynanabilir olanlardır.</p>' +
      '<h3>Düğmeler</h3><ul><li><b>Ev</b>: ana menüye döner. <b>Geri</b>: önceki ekrana döner.</li><li><b>Kupa</b>: puan tablosu. <b>?</b>: bu kılavuz. <b>Dişli</b>: ayarlar.</li><li><b>Hoparlör</b>: sesi kapatır. <b>Köşe okları</b>: tam ekran.</li><li>Çevrimiçi oyunda <b>mesaj</b> balonu ve bağlantı ışığı (yeşil = iyi) görünür.</li></ul>' +
      '<h3>Kesilme ve devam</h3><p>Bilgisayara karşı oyun her hamlede kaydedilir; ana sayfadaki <b>Devam et</b> kartıyla kaldığın yerden sürer. Çevrimiçi oyunda bağlantın koparsa yerine bilgisayar oynar, döndüğünde koltuğunu otomatik geri alırsın.</p>' +
      '<h3>Telefona kur</h3><p>Tarayıcı menüsünden <b>Ana ekrana ekle</b> de; uygulama gibi tam ekran açılır.</p>');
    return d;
  },
  pisti: function () {
    var d = html('<h3>Amaç</h3><p>Masadaki kartları toplayıp en çok puanı yapmak. 2, 3 ya da 4 kişi oynanır (4 kişide eşli oynamak da mümkün).</p>' +
      '<h3>Oyun</h3><p>Masaya 4 kart açılır, herkese 4 kart dağıtılır. Sırası gelen bir kart atar. Attığın kart <b>masadaki en üst kartla aynı sayıdaysa</b> ya da bir <b>Vale</b>ysa masadaki tüm kartları alırsın. Aksi halde kart masada kalır. Eller bitince 4’er kart daha dağıtılır.</p>');
    d.appendChild(crow([M(2, 4), '→', M(0, 4)], 'Masadaki Karo 4’ü Maça 4 ile aldın.'));
    d.appendChild(html('<h3>Pişti</h3><p>Masada tek kart varken aynı sayıyla alırsan <b>Pişti</b> (10 puan). Tek kartı Vale ile alırsan sayılmaz; masada tek Vale varken Vale ile alırsan <b>Çift Pişti</b> (20 puan).</p>' +
      '<h3>Puanlar</h3><table><tr><th>Kart</th><th>Puan</th></tr><tr><td>Her As ve her Vale</td><td>1</td></tr><tr><td>Sinek 2</td><td>2</td></tr><tr><td>Karo 10</td><td>3</td></tr><tr><td>En çok kâğıdı toplayan</td><td>3</td></tr></table>' +
      '<p>Son elde masada kalanlar, en son kart toplayana gider. Hedef puana ilk ulaşan kazanır.</p>'));
    return d;
  },
  dost: function () {
    var d = html('<h3>Amaç</h3><p>Ceza puanı almamak ya da en az almak. Her elin sonunda en az ceza alan en çok puanı kazanır.</p>' +
      '<h3>Oyun</h3><p>Yere 4 kart açılır, herkese 4 kart dağıtılır. Sırası gelen bir kart oynar. Oynadığın kart aşağıdakilerden biriyle <b>aynı sayıdaysa</b> kazık sende değil, <b>yanındaki oyuncuda</b> (ya da seçtiğin oyuncuda) kalır:</p>' +
      '<ul><li><b>Yerdeki</b> açık kartlar: hepsi kartınla birlikte yandakinin ceza destesine gider.</li><li><b>Atılmış</b> son kart: ikisi birlikte yandakine gider.</li><li><b>Birinin ceza destesinin üstü</b>: kartını doğrudan onun cezasına ekleyebilirsin.</li><li>Kendi ceza desteni de yandakine devredebilirsin.</li></ul>' +
      '<p>Hiçbiriyle eşleşmiyorsa kart yere atılır. Birden fazla seçenek varsa seçim penceresi açılır.</p>');
    d.appendChild(crow([M(1, 8), M(0, 8), '→', M(3, 8)], 'Aynı sayılar “dost”tur: biri diğerine kazık olur.'));
    d.appendChild(html('<h3>Ceza değerleri</h3><table><tr><th>Kart</th><th>Ceza</th></tr><tr><td>Üçlü (3)</td><td>30</td></tr><tr><td>Vale</td><td>20</td></tr><tr><td>As, Kız, Papaz</td><td>10</td></tr><tr><td>Diğerleri</td><td>kendi sayısı kadar</td></tr></table>' +
      '<h3>El puanı</h3><p>2 kişi: +7 / −7. 3 kişi: +7 / 0 / −7. 4 kişi: +7 / +3 / −2 / −7. Eşitlikte puanlar paylaşılır.</p>'));
    return d;
  },
  pis7: function () {
    var d = html('<h3>Amaç</h3><p>Elindeki kartları ilk bitiren eli kazanır; diğerleri elinde kalan kartların puanını ceza olarak yazar. En az ceza alan oyunu kazanır.</p>' +
      '<h3>Oyun</h3><p>İlk kart <b>Sinek</b> olmalıdır. Sonra üstteki kartla <b>aynı renk</b> ya da <b>aynı sayıda</b> kart atılır. Atamıyorsan desteden bir kart çekersin.</p>' +
      '<h3>Özel kartlar</h3>');
    d.appendChild(crow([M(0, 7), '→', M(1, 7)], 'Yedi: sonraki oyuncu 3 kart çeker. O da yedi atarsa ceza birikir (3+3…).'));
    d.appendChild(crow([M(2, 11)], 'Vale: her zaman atılır, istediğin rengi seçersin.'));
    d.appendChild(html('<ul><li><b>As</b>: sıradaki oyuncu kart çeker ya da atlar (kurulumda seçilir).</li><li><b>On</b>: oyun yönü tersine döner.</li><li><b>Joker</b> (isteğe bağlı): vale gibi renk seçtirir ve 10 kart çektirir.</li></ul>' +
      '<h3>Puan</h3><p>Elde kalan kartların değerleri toplanır. Son kartla özel kart (7, Vale, As, 10) atarak bitirirsen diğerlerinin cezası katlanır. Elde kalan 7 ve Joker’ler için ek kart çekilip puana eklenir.</p>' +
      '<p class="cap">Kurulumda el sayısı ya da puan sınırı seçebilirsin.</p>'));
    return d;
  },
  online: function () {
    return html('<h3>Arkadaşla oyna</h3><ol><li>Oyun kurulumunda <b>Çevrimiçi oda kur</b>’a bas.</li><li>Çıkan <b>5 harfli oda kodunu</b> ya da bağlantıyı arkadaşına gönder; ya da <b>Arkadaşlar</b>’dan davet et.</li><li>Herkes gelince <b>Başlat</b>. Boş kalan yerleri bilgisayar doldurur.</li></ol>' +
      '<h3>Arkadaş eklemek</h3><p>Her oyuncunun 8 harflik bir arkadaş kodu vardır (Ayarlar → Çevrimiçi). Kodu yazıp istek gönder; karşı taraf kabul edince listende görünür. Çevrimiçi olanlar yeşil ışıkla gösterilir.</p>' +
      '<h3>Bağlantı kopsa</h3><p>Telefon uykuya geçse, uygulama arka plana düşse ya da internet gitse bile oyun senin için durmaz: yerine bilgisayar oynar. Geri dönünce kısa sürede yeniden bağlanır ve koltuğunu geri alırsın. Oda sahibinin cihazı kapanırsa oyun onun cihazı dönene kadar bekler.</p>' +
      '<h3>İpuçları</h3><ul><li>Oda sahibi telefonunu oyun boyunca açık tutmalı (ekran kapanmasın ayarı açıktır).</li><li>Açık masa seçeneğiyle odan herkese görünür.</li></ul>');
  }
};

KS.helpSheet = function (game) {
  var tabs = [
    { id: 'basics', n: 'Başlangıç' }, { id: 'pisti', n: 'Pişti' }, { id: 'dost', n: 'Dost Kazığı' }, { id: 'pis7', n: 'Pis Yedili' }, { id: 'online', n: 'Çevrimiçi' }
  ];
  tabs.forEach(function (t) { t.f = function () { return HELP[t.id](); }; });
  var start = 0, i;
  for (i = 0; i < tabs.length; i++) if (tabs[i].id === game) start = i;
  return KS.sheet('Kılavuz', null, { tabs: tabs, wide: true, tab: start });
};

if (typeof module !== 'undefined' && module.exports) module.exports = KS;
})(typeof window !== 'undefined' ? window : globalThis);
