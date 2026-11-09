/* Briç · ayarlar penceresi ve kullanım kılavuzu */
(function (root) {
'use strict';
var BR = root.BR;
var h = BR.h;

/* ---------- Ayar denetimleri ---------- */
function commit(k, v) { BR.S[k] = v; BR.saveSettings(); BR.applySettings(); }
function row(label, sub, ctl) {
  return h('div', { class: 'row' }, h('div', { class: 'lb' }, h('b', { text: label }), sub ? h('span', { text: sub }) : null), ctl);
}
function seg(k, opts, after) {
  var box = h('div', { class: 'seg' });
  opts.forEach(function (o) {
    var b = h('button', { text: o[1], class: BR.S[k] === o[0] ? 'on' : '', onclick: function () {
      BR.sfx('click'); commit(k, o[0]); BR.$$('button', box).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); if (after) after();
    } });
    box.appendChild(b);
  });
  return box;
}
function sw(k, after) {
  var b = h('button', { class: 'sw' + (BR.S[k] ? ' on' : ''), role: 'switch', 'aria-checked': BR.S[k] ? 'true' : 'false', onclick: function () {
    BR.sfx('click'); commit(k, !BR.S[k]); b.classList.toggle('on', !!BR.S[k]); b.setAttribute('aria-checked', BR.S[k] ? 'true' : 'false'); if (after) after();
  } });
  return b;
}
function step(k, min, max, st, fmt, after) {
  var out = h('output', { text: fmt(BR.S[k]) });
  function ch(d) { var v = BR.clamp(Math.round((BR.S[k] + d) / st) * st, min, max); BR.sfx('click'); commit(k, v); out.textContent = fmt(v); if (after) after(); }
  return h('div', { class: 'step' }, h('button', { text: '−', 'aria-label': 'Azalt', onclick: function () { ch(-st); } }), out, h('button', { text: '+', 'aria-label': 'Artır', onclick: function () { ch(st); } }));
}
function range(k, min, max, st, fmt) {
  var out = h('output', { text: fmt(BR.S[k]), style: { minWidth: '3rem', textAlign: 'right', color: 'var(--gold2)', fontWeight: 700, fontSize: '.85rem' } });
  var inp = h('input', { type: 'range', min: min, max: max, step: st, value: BR.S[k] });
  inp.addEventListener('input', function () { commit(k, +inp.value); out.textContent = fmt(+inp.value); });
  return h('div', { style: { display: 'flex', alignItems: 'center', gap: '.4rem' } }, inp, out);
}
function pct(v) { return v + '%'; }
function sec(v) { return v + ' sn'; }
function px(v) { return v + ' px'; }

function previewCards() {
  var box = h('div', { style: { display: 'flex', gap: '.4rem', justifyContent: 'center', margin: '.5rem 0 .2rem', '--cw': '3.6rem' } });
  [BR.make(1, 1), BR.make(0, 11), BR.make(2, 10), BR.make(3, 6)].forEach(function (c) { var e = BR.cards.el(c); e.classList.add('static'); box.appendChild(e); });
  var b = BR.cards.el(-1); b.classList.add('static', 'down'); box.appendChild(b);
  return box;
}

BR.settingsSheet = function (tab) {
  var S = BR.S;
  var tabs = [
    { n: 'Görünüm', f: function () {
      var d = h('div');
      d.appendChild(previewCards());
      d.appendChild(h('div', { class: 'grp', text: 'Masa' }));
      var sw1 = h('div', { class: 'swatches' });
      BR.TABLES.forEach(function (t) {
        var b = h('button', { class: 'swatch' + (S.table === t.id ? ' on' : ''), onclick: function () { BR.sfx('click'); commit('table', t.id); BR.$$('.swatch', sw1).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); } },
          h('i', { style: { background: 'radial-gradient(ellipse at 50% 40%, ' + t.a + ', ' + t.b + ')', boxShadow: 'inset 0 0 0 2px ' + t.rim } }), t.n);
        sw1.appendChild(b);
      });
      d.appendChild(sw1);
      d.appendChild(h('div', { class: 'grp', text: 'Kart arkası' }));
      var sw2 = h('div', { class: 'backs' });
      BR.BACKS.forEach(function (bk) {
        var hold = h('div', { class: 'holder', style: { '--cw': '2.5rem' } });
        var prev = BR.cards.el(-1); prev.classList.add('static', 'down'); prev.setAttribute('data-backid', bk.id);
        hold.appendChild(prev);
        var b = h('button', { class: 'swatch' + (S.back === bk.id ? ' on' : ''), onclick: function () { BR.sfx('click'); commit('back', bk.id); BR.$$('.swatch', sw2).forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); } }, hold, bk.n);
        sw2.appendChild(b);
      });
      d.appendChild(sw2);
      d.appendChild(h('div', { class: 'note', text: 'Seçtiğin desen masadaki tüm kartlara uygulanır.' }));
      d.appendChild(h('div', { class: 'grp', text: 'Kart yüzü' }));
      d.appendChild(seg('face', [['krem', 'Krem'], ['beyaz', 'Beyaz'], ['koyu', 'Koyu']]));
      d.appendChild(row('Dört renkli takımlar', 'Karo mavi, sinek yeşil; karışmaz', sw('fourc')));
      d.appendChild(row('Büyük kart yazısı', 'Köşe sayıları daha okunaklı', sw('bigidx')));
      d.appendChild(row('Kart boyutu', null, seg('cardsize', [['s', 'Küçük'], ['m', 'Orta'], ['l', 'Büyük']], function () { if (BR.onLayout) BR.onLayout(); })));
      d.appendChild(row('Elimi diz', 'Kartlarını otomatik sıralar', seg('sort', [['suit', 'Renge göre'], ['rank', 'Sayıya göre'], ['none', 'Elle']])));
      d.appendChild(row('Oynanabilir kartları parlat', null, sw('glow')));
      d.appendChild(row('Düğme sütunu yeri', 'Yatay ekranda', seg('railpos', [['left', 'Sol'], ['right', 'Sağ']], function () { if (BR.onLayout) BR.onLayout(); })));
      return d;
    } },
    { n: 'Oyun', f: function () {
      var d = h('div');
      d.appendChild(h('div', { class: 'grp', text: 'Oynayış' }));
      d.appendChild(row('Tek dokunuşla oyna', 'Kapalıyken: önce seç, sonra tekrar dokun ya da yukarı sürükle', sw('tap1')));
      d.appendChild(row('Çıkarken sor', 'Yanlışlıkla çıkmayı önler', sw('confirmExit')));
      d.appendChild(row('İpucu düğmesi', 'Sıran gelince ampul önerir', sw('hints', function () { if (BR.onLayout) BR.onLayout(); })));
      d.appendChild(row('Puanımı göster', 'İhale sırasında elindeki puan yazılır', sw('showBidHelp')));
      d.appendChild(row('Tek kartı kendisi oynasın', 'Başka seçeneğin yoksa otomatik', sw('autoSingle')));
      d.appendChild(row('Hızlı löve', 'Alınan löve daha kısa bekler', sw('fastTrick')));
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
      d.appendChild(row('Titreşim', 'Sıran gelince', sw('vibrate')));
      d.appendChild(h('div', { class: 'grp', text: 'Dene' }));
      var t = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '.4rem' } });
      [['Kart dağıt', 'deal'], ['Kart koy', 'place'], ['İhale', 'bid'], ['Löve', 'trick'], ['Sözleşme', 'contract'], ['Sıra', 'turn'], ['Kazan', 'win']].forEach(function (x) {
        t.appendChild(h('button', { class: 'btn sm', text: x[0], onclick: function () { BR.sfx(x[1]); } }));
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
      d.appendChild(row('Ekran açık kalsın', 'Oyun sırasında ekran kendiliğinden kapanmaz', sw('wake', function () { BR.keepAwake(!!BR.S.wake); })));
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
      inp.addEventListener('change', function () { commit('customBroker', BR.clean(inp.value, 120)); });
      d.appendChild(inp);
      d.appendChild(h('p', { class: 'note', text: 'Bağlantı ayarını değiştirdikten sonra çevrimiçi ekrandan yeniden bağlan.' }));
      d.appendChild(h('div', { class: 'grp', text: 'Arkadaş kodum' }));
      d.appendChild(h('div', { class: 'code', text: S.id }));
      d.appendChild(h('div', { style: { display: 'flex', gap: '.5rem' } },
        h('button', { class: 'btn sm block', onclick: function () { BR.copy(S.id); BR.toast('Kod kopyalandı'); } }, BR.ic('copy'), 'Kopyala'),
        h('button', { class: 'btn sm block', onclick: function () { BR.share('Briç', 'Beni Briç\'nda arkadaş ekle: ' + S.id, location.href.split('#')[0] + '#f=' + S.id); } }, BR.ic('share'), 'Paylaş')));
      return d;
    } },
    { n: 'Hakkında', f: function () {
      var d = h('div');
      d.appendChild(h('div', { class: 'sign', style: { fontSize: '2.2rem', margin: '.6rem 0' }, text: 'by uozdil' }));
      d.appendChild(h('p', { class: 'note', style: { textAlign: 'center' }, text: 'Briç · Chicago usulü, 4 kişilik klasik briç. Kurulum gerekmez; görseller ve sesler cihazda üretilir.' }));
      d.appendChild(h('div', { class: 'grp', text: 'Veri' }));
      d.appendChild(row('Ayarları sıfırla', 'Ad ve arkadaşların kalır', h('button', { class: 'btn sm', text: 'Sıfırla', onclick: function () { BR.resetSettings(); BR.toast('Ayarlar sıfırlandı'); BR.closeTop(); } })));
      d.appendChild(row('Kayıtlı oyunu sil', 'Devam et kartını kaldırır', h('button', { class: 'btn sm red', text: 'Sil', onclick: function () { BR.lsDel('save'); BR.lsDel('hostroom'); BR.toast('Silindi'); if (BR.App) BR.App.home(); } })));
      return d;
    } }
  ];
  return BR.sheet('Ayarlar', null, { tabs: tabs, wide: true, tab: tab || 0 });
};

/* ---------- Kullanım kılavuzu ---------- */
function crow(cards, cap) {
  var r = h('div', { class: 'cr' });
  cards.forEach(function (c) {
    if (c === '→') { r.appendChild(h('span', { class: 'arrow', text: '→' })); return; }
    var e = BR.cards.el(c < 0 ? -1 : c); e.classList.add('static'); if (c < 0) e.classList.add('down'); r.appendChild(e);
  });
  var w = h('div'); w.appendChild(r); if (cap) w.appendChild(h('div', { class: 'cap', text: cap }));
  return w;
}
function html(s) { var d = h('div', { class: 'help' }); d.innerHTML = s; return d; }
var M = BR.make;

var HELP = {
  basics: function () {
    var d = html(
      '<h3>Briç nedir?</h3><p>4 kişi, 2 takım: <b>sen + ortağın</b> (Güney–Kuzey) karşı <b>Batı + Doğu</b>. Herkese 13 kart dağıtılır. Önce <b>ihale</b> yapılır: takım, “şu kadar löve alırız” diye iddiaya girer. Sonra 13 löve oynanır. İddiasını tutturan puan alır.</p>' +
      '<div class="hb"><b>Löve</b> = dört oyuncunun birer kart attığı tur. En yüksek kartı atan (ya da koz atan) löveyi alır.</div>' +
      '<h3>Hızlı başlangıç</h3><ol><li>Ana sayfada adını yaz, simgeni seç, <b>Briç</b>’e dokun.</li><li>El sayısını seç (4 el kısa bir maçtır), <b>Başla</b>.</li><li>İhale sırası sende gelince alttaki kutudan seç; zorlanırsan üstteki <b>ampul</b> (ipucu) ne yapacağını söyler.</li><li>Oynarken kartına bir kez dokun (yükselir), bir daha dokun ya da yukarı sürükle.</li></ol>' +
      '<h3>Düğmeler</h3><ul><li><b>Ev</b>: ana menü. <b>Geri</b>: önceki ekran.</li><li><b>Ampul</b>: ipucu. <b>Robot</b>: oyun sahibiyken oyunu bilgisayara bırakır.</li><li><b>Kupa</b>: puan tablosu. <b>?</b>: bu kılavuz. <b>Dişli</b>: ayarlar.</li><li><b>Hoparlör</b>: ses. <b>Köşe okları</b>: tam ekran.</li></ul>' +
      '<h3>Kesilme ve devam</h3><p>Bilgisayara karşı oyun her hamlede kaydedilir; ana sayfadaki <b>Devam et</b> ile sürdürürsün.</p>' +
      '<h3>Telefona kur</h3><p>Tarayıcı menüsünden <b>Ana ekrana ekle</b> de; uygulama gibi tam ekran açılır.</p>');
    return d;
  },
  bid: function () {
    var d = html(
      '<h3>İhale: iddiaya girmek</h3><p>Dağıtıcıdan başlayarak sırayla bir <b>ihale</b> söylenir. Her ihale “<b>6 + sayı</b> löve alırız” demektir. <b>3♠</b> = 9 löve alıp koz olarak maçayı seçmek. Bir sonraki ihale öncekinden <b>yüksek</b> olmalı.</p>' +
      '<table><tr><th>Sıra (düşükten yükseğe)</th></tr><tr><td>♣ Sinek &lt; ♦ Karo &lt; ♥ Kupa &lt; ♠ Maça &lt; SA (kozsuz)</td></tr></table>' +
      '<p>Aynı sayıda <b>1♥</b>, <b>1♦</b>’dan yüksektir; <b>1SA</b> hepsinden yüksek; <b>2♣</b> ise 1SA’dan yüksektir.</p>' +
      '<h3>Kutuyu kullanmak</h3><ol><li>Önce <b>sayıyı</b> (1–7) seç; en düşük geçerli sayı hazır seçili gelir.</li><li>Sonra <b>takıma</b> dokun: ♠ ♥ ♦ ♣ ya da SA.</li><li>Söylemek istemiyorsan <b>Pas</b>. Rakibin ihalesine itiraz için <b>Kontra</b> (puanı katlar), onun kontrasına karşı <b>Rekontra</b>.</li></ol>' +
      '<p>Üç kişi arka arkaya pas derse ihale biter. <b>Son verilen ihale sözleşme</b> olur; o takımın ilk söyleyeni <b>oyun sahibi</b> (deklaratör) olur.</p>' +
      '<h3>Kaç puanla ne söylenir?</h3><p>Elindeki yüksek kartları say: <b>As 4, Papaz 3, Kız 2, Vale 1</b>. Oyun içinde “puan” olarak hep bunu görürsün; ihale sırasında ismin yanında da yazar.</p>' +
      '<table><tr><th>Puan</th><th>Ne yapmalı?</th></tr><tr><td>0–5</td><td>Pas</td></tr><tr><td>6–11</td><td>Genelde pas; uzun renk varsa az yükselt</td></tr><tr><td>12–14</td><td>Açılış: 5’li uzun rengini söyle (1♠, 1♥…)</td></tr><tr><td>15–17</td><td>1SA açılışı (dengeli el)</td></tr><tr><td>ortakla toplam 25+</td><td>Manche (oyun) hedefle: 3SA, 4♠, 4♥</td></tr><tr><td>ortakla toplam 33+</td><td>Küçük slam: 6. seviye</td></tr></table>' +
      '<p>Şüphedeysen <b>ampule</b> bas; bilgisayar senin için en iyi ihaleyi önerir.</p>');
    return d;
  },
  play: function () {
    var d = html(
      '<h3>Oyun nasıl akar?</h3><p>İhale bitince <b>oyun sahibinin solundaki</b> oyuncu ilk kartı atar (açılış). Ardından <b>oyun sahibinin ortağı elini masaya açar</b>: bu <b>açık el</b>’dir (dummy). Oyun sahibi, hem kendi elini hem açık eli oynar; açık elin sahibi sadece izler.</p>' +
      '<h3>Löve almak</h3><ul><li>Açılan renge <b>uymak zorundasın</b>. Uyan kartın yoksa istediğini atarsın.</li><li>En yüksek kart löveyi alır (As en yüksek, 2 en düşük).</li><li><b>Koz</b> varsa, açılan renkte kartı olmayan koz atıp löveyi alabilir (kesme). Daha yüksek koz daha üstündür.</li><li>Löveyi alan bir sonraki löveyi açar.</li></ul>');
    d.appendChild(crow([M(0, 9), M(0, 12), M(0, 2), M(0, 1)], 'Maça açıldı: en yüksek kart (As) löveyi alır.'));
    d.appendChild(html(
      '<h3>Ekranda ne var?</h3><ul><li>Altta senin elin, üstte ortağın ya da rakipler. Açık el açılınca renkler halinde görünür.</li><li>Parlayan kartlar oynayabileceğin kartlardır; açılan renge uymayan kartlar kararır.</li><li>Tek geçerli kartın varsa oyun onu kendiliğinden oynar (Ayarlar → Oyun’dan kapatılır).</li><li>Sol üstte <b>sözleşme</b>, sağ üstte <b>puanlar</b> ve alınan löveler.</li></ul>' +
      '<h3>Oyun sahibiysen</h3><p>Sıra açık elde gelince açık elin kartlarına dokun. Yorulursan robot düğmesiyle oyunu bilgisayara bırakabilirsin.</p>' +
      '<h3>Açık elsen</h3><p>Karar vermezsin; ortağın senin elini oynar. İstersen izle, istersen sonraki dağıtıma geç.</p>'));
    return d;
  },
  score: function () {
    return html(
      '<h3>Chicago puanlaması</h3><p>Bu oyun dört (ya da 8, 12, 16) dağıtımlık <b>Chicago</b> maçıdır. Her dağıtım ayrı puanlanır, sonunda toplamı yüksek takım kazanır.</p>' +
      '<h3>Risk (vulnerability)</h3><p>Dağıtımlara göre sırayla: 1. hiç kimse riskte değil, 2. ve 3. dağıtıcının takımı riskte, 4. herkes riskte. Riskteki takım yaparsa daha çok prim alır, düşerse daha çok kaybeder. Masada riskteki oyuncunun rozeti kırmızımsı çerçeveyle gösterilir.</p>' +
      '<h3>Sözleşmeyi yaparsan</h3><table><tr><th>Takım</th><th>Löve başına</th></tr><tr><td>♣ ♦ (minör)</td><td>20</td></tr><tr><td>♥ ♠ (major)</td><td>30</td></tr><tr><td>SA</td><td>İlk 40, sonrakiler 30</td></tr></table>' +
      '<table><tr><th>Prim</th><th>Risk yok</th><th>Riskte</th></tr><tr><td>Parça (100 altı)</td><td>50</td><td>50</td></tr><tr><td>Manche (100 ve üstü)</td><td>300</td><td>500</td></tr><tr><td>Küçük slam (12 löve)</td><td>+500</td><td>+750</td></tr><tr><td>Büyük slam (13 löve)</td><td>+1000</td><td>+1500</td></tr></table>' +
      '<p>İhaleden fazla alınan lövelere de puan yazılır.</p>' +
      '<h3>Düşersen</h3><p>Her eksik löve için rakiplere ceza: riskte değilken 50, riskteyken 100. Kontra yenmişse ceza hızla büyür.</p>' +
      '<h3>Kontra</h3><p>Kontralı sözleşme tutarsa puanı katlanır ve ek prim gelir; düşerse ceza büyük olur. Kontra ancak kendinden eminken atılır.</p>');
  },
  tips: function () {
    return html(
      '<h3>Acemi için 8 ipucu</h3><ol>' +
      '<li><b>Puanını say.</b> As 4, Papaz 3, Kız 2, Vale 1. 12’nin altında genelde pas de.</li>' +
      '<li><b>Uzun rengini söyle.</b> 5 ya da daha uzun kupa/maça varsa açılışta onu söyle.</li>' +
      '<li><b>Ortağını dinle.</b> Ortağın bir renk söylediyse o rengi 3–4 kartla desteklemek iyidir.</li>' +
      '<li><b>Koz seç.</b> Takımın 8+ kartlık bir rengi varsa (özellikle ♥ ♠) onu koz yap.</li>' +
      '<li><b>İkinci elde alçak, üçüncü elde yüksek.</b> Kural: ikinci oynayan genelde küçük kartını atar, üçüncü oynayan en yüksek kartıyla löveyi almaya çalışır.</li>' +
      '<li><b>Ortağının aldığı löveye yüksek kart atma.</b> Ortağın kazanıyorsa en küçük kartını at.</li>' +
      '<li><b>Önce kozu çek.</b> Oyun sahibiysen ve kozun uzunsa, rakiplerin kozlarını erken bitir.</li>' +
      '<li><b>Açılışta ortağın rengini aç.</b> Savunmadaysan ortağın ihale ettiği renk iyi bir açılıştır; yoksa en uzun renginin dördüncü kartı.</li></ol>' +
      '<h3>Mini sözlük</h3><table><tr><td>Löve</td><td>Dört kartlık bir tur</td></tr><tr><td>Sözleşme</td><td>İhalenin son hali: kaç löve, hangi koz</td></tr><tr><td>Oyun sahibi</td><td>Sözleşmeyi oynayan oyuncu (deklaratör)</td></tr><tr><td>Açık el</td><td>Masaya açılan ortağın eli (dummy)</td></tr><tr><td>Koz</td><td>Her rengi kesebilen renk</td></tr><tr><td>SA</td><td>Kozsuz (sans atu)</td></tr><tr><td>Manche</td><td>100+ puanlık sözleşme (ör. 3SA, 4♠, 5♣)</td></tr><tr><td>Slam</td><td>12 (küçük) ya da 13 (büyük) löve ihalesi</td></tr><tr><td>Kesme</td><td>Renge uyamayınca koz atarak löveyi almak</td></tr></table>' +
      '<h3>Ayarlar önerisi</h3><ul><li>İlk oyunlarda <b>Kolay</b> zorluk ve <b>ipucu</b> açık kalsın.</li><li>Rakiplerin kartlarını takip etmek için <b>Hareketler → Tam</b> seçili olsun.</li></ul>');
  },
  online: function () {
    return html('<h3>Arkadaşla oyna</h3><ol><li>Kurulumda <b>Çevrimiçi oda kur</b>’a bas.</li><li>Çıkan <b>5 harfli oda kodunu</b> ya da bağlantıyı arkadaşına gönder; ya da <b>Arkadaşlar</b>’dan davet et.</li><li>İlk gelen arkadaşın <b>ortağın (Kuzey)</b> olur, sonrakiler rakip. Herkes gelince <b>Başlat</b>; boş yerleri bilgisayar doldurur.</li></ol>' +
      '<h3>Arkadaş eklemek</h3><p>Her oyuncunun 8 harflik bir arkadaş kodu vardır (Ayarlar → Çevrimiçi). Kodu yazıp istek gönder; karşı taraf kabul edince listende gerçek adıyla görünür. Çevrimiçi olanlar yeşil ışıkla gösterilir.</p>' +
      '<h3>Bağlantı kopsa</h3><p>Telefon uykuya geçse ya da internet gitse bile oyun senin için durmaz: yerine bilgisayar oynar. Geri dönünce koltuğunu geri alırsın. Oda sahibinin cihazı kapanırsa oyun onun cihazı dönene kadar bekler.</p>' +
      '<h3>Mesaj</h3><p>Çevrimiçi oyunda balon düğmesiyle hızlı mesaj gönderebilirsin.</p>');
  }
};

BR.helpSheet = function (game) {
  var tabs = [
    { id: 'basics', n: 'Başlangıç' }, { id: 'bid', n: 'İhale' }, { id: 'play', n: 'Oyun' }, { id: 'score', n: 'Puanlama' }, { id: 'tips', n: 'İpuçları' }, { id: 'online', n: 'Çevrimiçi' }
  ];
  tabs.forEach(function (t) { t.f = function () { return HELP[t.id](); }; });
  var start = 0, i;
  for (i = 0; i < tabs.length; i++) if (tabs[i].id === game) start = i;
  return BR.sheet('Kılavuz', null, { tabs: tabs, wide: true, tab: start });
};

if (typeof module !== 'undefined' && module.exports) module.exports = BR;
})(typeof window !== 'undefined' ? window : globalThis);
