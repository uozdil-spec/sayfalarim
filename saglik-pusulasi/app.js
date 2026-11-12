/* Sağlık Pusulası · uygulama  (by uozdil)
   Veriler yalnızca bu cihazda (localStorage) tutulur; her profil PIN ile açılır. */
(function () {
'use strict';
var SP = window.SP;
var $ = function (s, r) { return (r || document).querySelector(s); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function say(n) { return Math.round(n).toLocaleString('tr-TR'); }
function ond(n) { return (Math.round(n * 10) / 10).toLocaleString('tr-TR'); }
function sayi(v) { var n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : NaN; }
function duz(s) { return String(s).toLocaleLowerCase('tr').replace(/[çğıöşüâî]/g, function (c) { return { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i' }[c]; }); }

var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
var GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
function gunKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function gunTarih(k) { var a = k.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
function gunKaydir(k, n) { var d = gunTarih(k); d.setDate(d.getDate() + n); return gunKey(d); }
function bugun() { return gunKey(new Date()); }
function gunAd(k) {
  var d = gunTarih(k), t = bugun();
  var on = k === t ? 'Bugün' : k === gunKaydir(t, -1) ? 'Dün' : GUNLER[d.getDay()];
  return on + ' · ' + d.getDate() + ' ' + AYLAR[d.getMonth()];
}

/* ---------- kayıt ---------- */
var LSK = 'saglik.v1';
var DB = (function () {
  try { var v = JSON.parse(localStorage.getItem(LSK)); if (v && v.users) return v; } catch (e) {}
  return { users: {}, set: {} };
})();
var AY = DB.set; ['ses', 'oled'].forEach(function (k) { if (AY[k] === undefined) AY[k] = true; });
if (AY.muzik === undefined) AY.muzik = false; if (AY.top === undefined) AY.top = 0;
function kaydet() {
  try { localStorage.setItem(LSK, JSON.stringify(DB)); return true; }
  catch (e) { toast('Kayıt yapılamadı. Cihazda yer kalmamış olabilir.'); return false; }
}
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

function cyrb(str, seed) {
  var h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (var i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
function pinOzet(pin, tuz) { var h = pin + ':' + tuz; for (var i = 0; i < 1500; i++) h = cyrb(h + tuz, i); return h; }
function rasgele() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

/* ---------- durum ---------- */
var U = null, sekme = 'bugun', sGun = bugun(), bilgiKat = 'Beslenme';
var OGUN = [['k', 'Kahvaltı', '☀️', '#f6c453'], ['o', 'Öğle', '🍽️', '#7ee08a'], ['a', 'Akşam', '🌙', '#a99bff'], ['r', 'Ara öğün', '🍎', '#f58fc0']];
var RK = { su: '#5cc8ff', har: '#ff9d6b', karb: '#f6b05c', pro: '#7fb4ff', yag: '#c79bff', mint: '#6fe3b4' };
function h2(t, c, sag) { return '<h2 style="--c:' + c + '"><i class="nk"></i>' + t + (sag ? '<span>' + sag + '</span>' : '') + '</h2>'; }
function stil(kat) { return SP.KAT_STIL[kat] || SP.KAT_STIL.Benim; }
var ETKIN = [[1.2, 'Hareketsiz', 'Masa başı iş, çok az yürüyüş'], [1.375, 'Az hareketli', 'Haftada 1–3 gün hafif egzersiz ya da günlük yürüyüş'], [1.55, 'Orta hareketli', 'Haftada 3–5 gün egzersiz'], [1.725, 'Çok hareketli', 'Haftada 6–7 gün yoğun egzersiz ya da ayakta çalışılan iş'], [1.9, 'Aşırı hareketli', 'Ağır bedensel iş ya da günde iki antrenman']];

function gun(k) {
  var d = U.days[k];
  if (!d) d = { m: { k: [], o: [], a: [], r: [] }, su: 0, ex: [] };
  return d;
}
function gunYaz(k, d) {
  var bos = !d.su && !d.ex.length && !OGUN.some(function (o) { return d.m[o[0]].length; });
  if (bos) delete U.days[k]; else U.days[k] = d;
  kaydet();
}

/* ---------- hesaplar ---------- */
function vki(w, h) { return w / Math.pow(h / 100, 2); }
function vkiAd(v) { return v < 18.5 ? 'Zayıf' : v < 25 ? 'Normal' : v < 30 ? 'Fazla kilolu' : 'Obezite'; }
function hesap(p) {
  p = p || U.prof;
  var yas = new Date().getFullYear() - p.by;
  var bmr = 10 * p.w + 6.25 * p.h - 5 * yas + (p.sex === 'e' ? 5 : -161);
  var tdee = bmr * ETKIN[p.act][0];
  var taban = p.sex === 'e' ? 1500 : 1200, hedef = tdee, kisit = false;
  var amac = yas < 18 ? 'koru' : p.goal;
  if (amac === 'ver') { hedef = tdee - 7700 * p.pace / 7; if (hedef < taban) { hedef = Math.min(taban, tdee); kisit = true; } }
  if (amac === 'al') hedef = tdee + 7700 * p.pace / 7;
  hedef = Math.round(hedef / 10) * 10;
  var suMl = Math.min(3600, Math.max(1600, p.w * 30));
  var hm = Math.pow(p.h / 100, 2);
  return { yas: yas, bmr: bmr, tdee: tdee, hedef: hedef, kisit: kisit, amac: amac, vki: vki(p.w, p.h),
    su: Math.round(suMl / 200), saglikMin: 18.5 * hm, saglikMax: 24.9 * hm };
}
function ozet(d) {
  var o = { kcal: 0, p: 0, f: 0, c: 0, yak: 0, su: d.su || 0, ogun: {} };
  OGUN.forEach(function (g) {
    var t = 0;
    d.m[g[0]].forEach(function (y) { t += y.kcal * y.q; o.p += y.p * y.q; o.f += y.f * y.q; o.c += y.c * y.q; });
    o.ogun[g[0]] = t; o.kcal += t;
  });
  d.ex.forEach(function (e) { o.yak += e.kcal; });
  return o;
}
/* Günün değerlendirmesi: durum, başlık, açıklama ve seçenekler */
function degerlendir(o, H, k) {
  var hedef = H.hedef + o.yak, fark = o.kcal - hedef, t = bugun();
  var bitti = k < t || (k === t && new Date().getHours() >= 21);
  var r = { hedef: hedef, fark: fark, sec: [] };
  if (!o.kcal) {
    r.d = 'sade'; r.rozet = 'Kayıt yok';
    r.b = k === t ? 'Güne başlayalım' : 'Bu gün için kayıt yok';
    r.t = k === t ? 'İlk öğününüzü ekleyin, gerisini program hesaplar.' : 'Unuttuğunuz öğünleri şimdi ekleyebilirsiniz.';
  } else if (fark > Math.max(0.25 * H.hedef, 500)) {
    r.d = 'kizil'; r.rozet = 'Aşırı'; r.b = 'Belirgin bir fazlalık var';
    r.t = 'Günlük ihtiyacınızın ' + say(fark) + ' kcal üzerindesiniz.';
    r.sec = ['Yarın öğün atlayarak telafi etmeye çalışmayın, normal düzeninize dönün.', 'Yemekten sonra 20–30 dakika yürümek kan şekerinin dengelenmesine yardım eder.', 'Bol su için. Tuzlu ve şekerli yiyecekler vücutta su tutar.'];
  } else if (fark > 0.1 * H.hedef) {
    r.d = 'sari'; r.rozet = 'Fazla'; r.b = 'Hedefi biraz aştınız';
    r.t = say(fark) + ' kcal fazladasınız.';
    var dk = Math.round(fark / (4.3 * U.prof.w / 60) / 5) * 5;
    if (dk <= 90) r.sec.push('Yaklaşık ' + dk + ' dakika tempolu yürüyüş bu farkı kapatır.');
    r.sec.push('Günün kalanında su, şekersiz çay ve sebze ağırlıklı seçimler yapın.');
  } else if (bitti && o.kcal < 0.6 * H.hedef) {
    r.d = 'kizil'; r.rozet = 'Çok az'; r.b = 'Çok az kalori aldınız';
    r.t = 'İhtiyacınızın ' + say(-fark) + ' kcal altındasınız. Bu kadar az yemek halsizliğe, kas kaybına ve sonraki günlerde aşırı yemeye yol açar.';
    r.sec = ['Dengeli bir öğün ekleyin: mercimek çorbası, ızgara tavuk ve salata yaklaşık 510 kcal eder.', 'İştahsızlık sık tekrarlıyorsa bir hekime ya da diyetisyene danışın.'];
  } else if (bitti && o.kcal < 0.85 * H.hedef) {
    r.d = 'sari'; r.rozet = 'Az'; r.b = 'Bugün az yediniz';
    r.t = 'Hedefinizin ' + say(-fark) + ' kcal altındasınız.';
    r.sec = ['Bir kase yoğurt ve bir muz yaklaşık 235 kcal eder.', 'Bir avuç fındık ve bir bardak süt yaklaşık 200 kcal eder.'];
  } else if (Math.abs(fark) <= 0.1 * H.hedef) {
    r.d = ''; r.rozet = 'Dengeli'; r.b = 'Tam hedefinizdesiniz';
    r.t = 'Bugünkü kaloriniz ihtiyacınıza çok yakın. Böyle devam edin.';
  } else {
    r.d = ''; r.rozet = 'Yolunda'; r.b = 'Yoldasınız';
    r.t = 'Bugün için ' + say(-fark) + ' kcal hakkınız var.' + (new Date().getHours() >= 17 && -fark > 0.5 * H.hedef ? ' Akşam yemeğini atlamayın.' : '');
  }
  return r;
}
function seri() {
  var k = bugun(), n = 0;
  if (!U.days[k]) k = gunKaydir(k, -1);
  while (U.days[k] && ozet(U.days[k]).kcal > 0) { n++; k = gunKaydir(k, -1); }
  return n;
}

/* ---------- simgeler ---------- */
var IK = {
  geri: '<path d="M15 5l-7 7 7 7"/>', ileri: '<path d="M9 5l7 7-7 7"/>', ipucu: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  muzik: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  tam: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', kapat: '<path d="M6 6l12 12M18 6L6 18"/>',
  bugun: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>', ilerleme: '<path d="M4 19h16M6 15l4-4 3 3 5-7"/>',
  bilgi: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM9 9h6M9 13h4"/>', profil: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>',
  yedek: '<path d="M12 4v11M8 11l4 4 4-4M5 20h14"/>', yukle: '<path d="M12 15V4M8 8l4-4 4 4M5 20h14"/>', kilit: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  kitap: '<path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v13c-3-1-5-1-8 1-3-2-5-2-8-1zM12 6v13"/>', salon: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4"/>',
  kalem: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3"/>', cop: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>', cikis: '<path d="M14 5h5v14h-5M10 8l-4 4 4 4M6 12h9"/>'
};
function ic(n) { return '<svg class="i" viewBox="0 0 24 24">' + IK[n] + '</svg>'; }

/* ---------- ses ve müzik ---------- */
var AC = null, muzikG = null, muzikT = null;
function ses() {
  if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { AC = new C(); } catch (e) { return null; } }
  if (AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
  return AC;
}
function ton(f, sure, vol, gecik) {
  if (!AY.ses) return; var a = ses(); if (!a) return;
  try {
    var t = a.currentTime + (gecik || 0), o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + sure);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + sure + 0.05);
  } catch (e) {}
}
var SES = { tik: function () { ton(660, 0.18, 0.08); }, ekle: function () { ton(523, 0.25, 0.1); ton(784, 0.4, 0.1, 0.1); }, su: function () { ton(880, 0.2, 0.07); ton(1175, 0.3, 0.06, 0.07); }, kutla: function () { [523, 659, 784, 1047].forEach(function (f, i) { ton(f, 0.5, 0.1, i * 0.13); }); } };
/* Sakin ortam müziği: yavaş açılıp kapanan akorlar ve seyrek çan sesleri */
var AKOR = [[130.8, 196, 246.9, 329.6], [110, 164.8, 261.6, 329.6], [87.3, 174.6, 220, 329.6], [98, 196, 246.9, 293.7]];
var CAN = [523.3, 587.3, 659.3, 784, 880, 1046.5];
function muzikCal(i) {
  var a = AC; if (!a || !muzikG) return;
  var t = a.currentTime;
  AKOR[i % 4].forEach(function (f, j) {
    var o = a.createOscillator(), g = a.createGain();
    o.type = j ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (j % 2 ? 4 : -4);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(j ? 0.05 : 0.035, t + 4); g.gain.linearRampToValueAtTime(0.0001, t + 11.5);
    o.connect(g); g.connect(muzikG); o.start(t); o.stop(t + 12);
  });
  [2.5, 6.5].forEach(function (dt) {
    if (Math.random() < 0.3) return;
    var o = a.createOscillator(), g = a.createGain(), s = t + dt + Math.random() * 1.5;
    o.type = 'sine'; o.frequency.value = CAN[Math.floor(Math.random() * CAN.length)];
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.03, s + 0.05); g.gain.exponentialRampToValueAtTime(0.0002, s + 3.5);
    o.connect(g); g.connect(muzikG); o.start(s); o.stop(s + 3.6);
  });
}
function muzikBasla() {
  var a = ses(); if (!a || muzikT) return;
  muzikG = a.createGain(); muzikG.gain.value = 0.0001; muzikG.gain.linearRampToValueAtTime(1, a.currentTime + 2);
  var lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
  muzikG.connect(lp); lp.connect(a.destination);
  var i = 0; muzikCal(i++); muzikT = setInterval(function () { muzikCal(i++); }, 8000);
}
function muzikDur() {
  if (muzikT) { clearInterval(muzikT); muzikT = null; }
  if (muzikG && AC) { try { muzikG.gain.cancelScheduledValues(AC.currentTime); muzikG.gain.linearRampToValueAtTime(0.0001, AC.currentTime + 1.2); } catch (e) {} }
  muzikG = null;
}
function muzikGoster() { [].forEach.call(document.querySelectorAll('[data-act="muzik"]'), function (b) { b.className = 'ib' + (AY.muzik ? ' on' : ''); }); }

/* ---------- OLED koruması, tam ekran ---------- */
var bosT = null, kayT = null;
function dokundu() {
  if (document.body.classList.contains('idle')) document.body.classList.remove('idle');
  clearTimeout(bosT);
  if (AY.oled) bosT = setTimeout(function () { document.body.classList.add('idle'); }, 90000);
}
function oledUygula() {
  dokundu(); clearInterval(kayT); kayT = null;
  var app = $('#app');
  if (AY.oled) kayT = setInterval(function () { app.style.transform = 'translate(' + (Math.floor(Math.random() * 7) - 3) + 'px,' + (Math.floor(Math.random() * 7) - 3) + 'px)'; }, 60000);
  else app.style.transform = 'none';
  document.documentElement.style.setProperty('--top', (AY.top || 0) + 'px');
}
function tamEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
function tamEkran() {
  var d = document.documentElement;
  try {
    if (tamEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { var rq = d.requestFullscreen || d.webkitRequestFullscreen; if (rq) { var p = rq.call(d); if (p && p.catch) p.catch(function () {}); } else toast('Bu tarayıcı tam ekranı desteklemiyor. Sayfayı ana ekrana ekleyebilirsiniz.'); }
  } catch (e) {}
}

/* ---------- bildirim ve panel ---------- */
var toastT = null;
function toast(m, ms) { var t = $('#toast'); t.textContent = m; t.className = 'on'; clearTimeout(toastT); toastT = setTimeout(function () { t.className = ''; }, ms || 2600); }
var panelGeri = null;
function panel(html, geri) { panelGeri = geri || null; var s = $('#sheet'); s.innerHTML = html; $('#ov').className = 'on'; s.scrollTop = 0; }
function panelKapat() { $('#ov').className = ''; $('#sheet').innerHTML = ''; panelGeri = null; }
function panelAcik() { return $('#ov').className === 'on'; }
function bas(t) { return '<div class="sbas"><h3>' + t + '</h3><button class="ib" data-act="kapat" aria-label="Kapat">' + ic('kapat') + '</button></div>'; }
function seg(ad, sec, deger) { return '<div class="seg" data-seg="' + ad + '">' + sec.map(function (o) { return '<button data-v="' + o[0] + '"' + (String(o[0]) === String(deger) ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('') + '</div>'; }
function onay(baslik, metin, dugme, act, kirmizi) {
  panel(bas(baslik) + '<p>' + metin + '</p><button class="btn tam' + (kirmizi ? ' kirmizi' : '') + '" data-act="' + act + '">' + dugme + '</button><button class="btn ik tam" data-act="kapat">Vazgeç</button>');
}

/* ---------- giriş ekranı ---------- */
function ekran(ad) { $('#giris').className = 'screen' + (ad === 'giris' ? ' on' : ''); $('#ana').className = 'screen' + (ad === 'ana' ? ' on' : ''); }
function girisCiz() {
  var ids = Object.keys(DB.users);
  $('#profiller').innerHTML = ids.map(function (id) {
    var u = DB.users[id];
    return '<button class="pkart" data-act="profilSec" data-id="' + id + '"><span class="av">' + esc(u.name.charAt(0).toLocaleUpperCase('tr')) + '</span><span><b>' + esc(u.name) + '</b><small>PIN ile aç</small></span>' + ic('kilit') + '</button>';
  }).join('');
  muzikGoster();
}
/* PIN tuş takımı */
var PIN = { v: '', cb: null, baslik: '', alt: '' };
function pinSor(baslik, alt, cb) { PIN = { v: '', cb: cb, baslik: baslik, alt: alt || '', hata: '' }; pinCiz(); }
function pinCiz() {
  var n = '';
  for (var i = 0; i < 4; i++) n += '<i' + (i < PIN.v.length ? ' class="d"' : '') + '></i>';
  var t = '';
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (k) { t += '<button data-act="pinTus" data-v="' + k + '">' + k + '</button>'; });
  t += '<span></span><button data-act="pinTus" data-v="0">0</button><button data-act="pinTus" data-v="sil" aria-label="Sil">⌫</button>';
  panel(bas(PIN.baslik) + (PIN.alt ? '<p>' + PIN.alt + '</p>' : '') + '<div class="pin">' + n + '</div><div class="hata" style="text-align:center">' + (PIN.hata || '') + '</div><div class="tus">' + t + '</div>');
}

/* ---------- profil sihirbazı ---------- */
var W = null;
function sihirbaz(duzenle) {
  var p = duzenle ? U.prof : null;
  W = { duzenle: !!duzenle, adim: duzenle ? 1 : 0, name: '', pin: '', pin2: '', sex: p ? p.sex : '', yas: p ? new Date().getFullYear() - p.by : '', h: p ? p.h : '', w: p ? p.w : '', act: p ? p.act : 1, goal: p ? p.goal : 'koru', pace: p ? p.pace : 0.5, tw: p && p.tw ? p.tw : '', hata: '' };
  sihirCiz();
}
function sihirOku() {
  ['name', 'pin', 'pin2', 'yas', 'h', 'w', 'tw'].forEach(function (k) { var e = $('#w_' + k); if (e) W[k] = e.value.trim(); });
}
function sihirProf() { return { sex: W.sex, by: new Date().getFullYear() - Math.round(sayi(W.yas)), h: sayi(W.h), w: sayi(W.w), act: +W.act, goal: W.goal, pace: +W.pace, tw: sayi(W.tw) || 0 }; }
function sihirCiz() {
  var a = W.adim, h = '', ilk = W.duzenle ? 1 : 0, cub = '<div class="adim">';
  for (var i = ilk; i <= 4; i++) cub += '<i' + (i <= a ? ' class="on"' : '') + '></i>';
  cub += '</div>';
  if (a === 0) {
    h = bas('Yeni profil') + cub + '<div class="alan"><label for="w_name">Kullanıcı adınız</label><input id="w_name" maxlength="16" autocomplete="off" value="' + esc(W.name) + '"></div>' +
      '<div class="iki"><div class="alan"><label for="w_pin">4 haneli PIN</label><input id="w_pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" value="' + esc(W.pin) + '"></div><div class="alan"><label for="w_pin2">PIN tekrar</label><input id="w_pin2" type="password" inputmode="numeric" maxlength="4" autocomplete="off" value="' + esc(W.pin2) + '"></div></div>' +
      '<p class="not" style="text-align:left;max-width:none">PIN, bu cihazı kullanan başkalarının kayıtlarınızı görmesini engeller. Unutursanız geri getirilemez; bir yere not edin.</p>';
  } else if (a === 1) {
    h = bas('Sizi tanıyalım') + cub + '<div class="alan"><label>Cinsiyet</label>' + seg('sex', [['k', 'Kadın'], ['e', 'Erkek']], W.sex) + '</div>' +
      '<div class="uc"><div class="alan"><label for="w_yas">Yaş</label><input id="w_yas" inputmode="numeric" maxlength="3" value="' + esc(W.yas) + '"></div><div class="alan"><label for="w_h">Boy (cm)</label><input id="w_h" inputmode="numeric" maxlength="3" value="' + esc(W.h) + '"></div><div class="alan"><label for="w_w">Kilo (kg)</label><input id="w_w" inputmode="decimal" maxlength="5" value="' + esc(W.w) + '"></div></div>' +
      '<p class="not" style="text-align:left;max-width:none">Kalori ihtiyacı cinsiyete, yaşa, boya ve kiloya göre hesaplanır.</p>';
  } else if (a === 2) {
    h = bas('Gününüz nasıl geçiyor?') + cub + '<div class="sec" data-seg="act">' + ETKIN.map(function (e, i) { return '<button data-v="' + i + '"' + (i === +W.act ? ' class="on"' : '') + '><b>' + e[1] + '</b><small>' + e[2] + '</small></button>'; }).join('') + '</div>' +
      '<p class="not" style="text-align:left;max-width:none">Sporlarınızı ayrıca Hareket bölümüne girecekseniz burada bir alt düzeyi seçin; aynı hareket iki kez sayılmasın.</p>';
  } else if (a === 3) {
    var p = sihirProf(), v = vki(p.w, p.h), hm = Math.pow(p.h / 100, 2), kucuk = sayi(W.yas) < 18, zayif = v < 18.5;
    if ((kucuk || zayif) && W.goal === 'ver') W.goal = 'koru';
    h = bas('Hedefiniz') + cub + '<p>Vücut kitle indeksiniz <b>' + ond(v) + '</b> (' + vkiAd(v) + '). Boyunuz için sağlıklı aralık ' + say(18.5 * hm) + '–' + say(24.9 * hm) + ' kg.</p>' +
      (kucuk ? '<p class="uyari">18 yaşın altında kilo hedefi konmaz; program yalnızca dengeyi izler. Büyüme çağında beslenme için hekime danışın.</p>' : '<div class="alan"><label>Ne yapmak istiyorsunuz?</label>' + seg('goal', [['ver', 'Kilo vermek'], ['koru', 'Korumak'], ['al', 'Kilo almak']], W.goal) + '</div>' +
      (zayif ? '<p class="uyari">Kilonuz sağlıklı aralığın altında olduğu için kilo verme hedefi seçilemez.</p>' : '') +
      (W.goal !== 'koru' ? '<div class="alan"><label>Haftalık hız</label>' + seg('pace', [[0.25, 'Yavaş · 250 g'], [0.5, 'Orta · 500 g']], W.pace) + '</div><div class="alan"><label for="w_tw">Hedef kilo (kg) · isterseniz boş bırakın</label><input id="w_tw" inputmode="decimal" maxlength="5" value="' + esc(W.tw) + '"></div>' : ''));
  } else {
    var H = hesap(sihirProf());
    h = bas('Planınız hazır') + cub + '<div class="buyuk"><span class="num">' + say(H.hedef) + '</span><small>kcal · günlük hedefiniz</small></div>' +
      '<div class="dort"><div><span class="num">' + say(H.tdee) + '</span><small>kcal günlük harcama</small></div><div><span class="num">' + say(H.bmr) + '</span><small>kcal dinlenirken</small></div><div><span class="num">' + H.su + '</span><small>bardak su (' + ond(H.su * 0.2) + ' L)</small></div><div><span class="num">' + ond(H.vki) + '</span><small>vücut kitle indeksi</small></div></div>' +
      (H.kisit ? '<p class="uyari">Seçtiğiniz hız güvenli alt sınırın altına iniyordu; hedefiniz ' + say(H.hedef) + ' kcal olarak sınırlandı.</p>' : '') +
      '<p class="not" style="text-align:left;max-width:none">Hesap Mifflin-St Jeor formülüne dayanır ve yaklaşık değer verir. Hamilelik, emzirme ve kronik hastalıklarda geçerli değildir.</p>';
  }
  h += '<div class="hata">' + (W.hata || '') + '</div><div class="iki">' + (a > ilk ? '<button class="btn ik" data-act="sihirGeri">Geri</button>' : '<button class="btn ik" data-act="kapat">Vazgeç</button>') + '<button class="btn" data-act="sihirIleri">' + (a === 4 ? (W.duzenle ? 'Kaydet' : 'Başla') : 'Devam') + '</button></div>';
  panel(h);
}
function sihirKontrol() {
  var a = W.adim;
  if (a === 0) {
    if (W.name.length < 2) return 'Kullanıcı adı en az 2 harf olmalı.';
    if (Object.keys(DB.users).some(function (id) { return duz(DB.users[id].name) === duz(W.name); })) return 'Bu adla bir profil zaten var.';
    if (!/^\d{4}$/.test(W.pin)) return 'PIN 4 rakamdan oluşmalı.';
    if (W.pin !== W.pin2) return 'İki PIN birbirini tutmuyor.';
  }
  if (a === 1) {
    var y = sayi(W.yas), h = sayi(W.h), w = sayi(W.w);
    if (!W.sex) return 'Cinsiyet seçin.';
    if (!(y >= 10 && y <= 100)) return 'Yaş 10 ile 100 arasında olmalı.';
    if (!(h >= 120 && h <= 220)) return 'Boyu santimetre olarak girin (120–220).';
    if (!(w >= 30 && w <= 250)) return 'Kiloyu kilogram olarak girin (30–250).';
  }
  if (a === 3 && W.goal !== 'koru' && W.tw) {
    var p = sihirProf(), hm = Math.pow(p.h / 100, 2);
    if (!(p.tw >= 30 && p.tw <= 250)) return 'Hedef kiloyu kilogram olarak girin.';
    if (W.goal === 'ver' && p.tw >= p.w) return 'Hedef kilo şimdiki kilonuzdan düşük olmalı.';
    if (W.goal === 'al' && p.tw <= p.w) return 'Hedef kilo şimdiki kilonuzdan yüksek olmalı.';
    if (W.goal === 'ver' && p.tw < 18.5 * hm) return 'Bu hedef sağlıklı aralığın altında. En az ' + Math.ceil(18.5 * hm) + ' kg girin.';
  }
  return '';
}
function sihirBitir() {
  var p = sihirProf();
  if (W.goal === 'koru') p.tw = 0;
  if (W.duzenle) {
    var eski = U.prof.w; U.prof = p;
    if (eski !== p.w) kiloYaz(bugun(), p.w);
    kaydet(); panelKapat(); ciz(); toast('Bilgileriniz güncellendi.');
  } else {
    var tuz = rasgele(), id = 'u' + rasgele();
    DB.users[id] = { id: id, name: W.name, salt: tuz, pin: pinOzet(W.pin, tuz), prof: p, days: {}, wl: [{ d: bugun(), w: p.w }], own: [], freq: {}, seen: {}, bk: '', created: bugun() };
    kaydet(); panelKapat(); girisCiz(); ac(id);
  }
}

/* ---------- oturum ---------- */
function ac(id) {
  U = DB.users[id]; sekme = 'bugun'; sGun = bugun();
  ekran('ana'); ciz();
  try { history.pushState({ sp: 1 }, ''); } catch (e) {}
  if (!U.seen.tur) { U.seen.tur = 1; kaydet(); tur(0); }
}
function kilitle() { U = null; panelKapat(); ekran('giris'); girisCiz(); }

/* ---------- ana çizim ---------- */
function ciz() {
  if (!U) return;
  var orta;
  if (sekme === 'bugun') orta = '<button class="ok" data-act="gunGeri" aria-label="Önceki gün">' + ic('geri') + '</button><b>' + gunAd(sGun) + '</b><button class="ok" data-act="gunIleri" aria-label="Sonraki gün"' + (sGun >= bugun() ? ' disabled' : '') + '>' + ic('ileri') + '</button>';
  else orta = '<b>' + { ilerleme: 'İlerleme', bilgi: 'Sağlıklı yaşam', profil: 'Profil' }[sekme] + '</b>';
  $('#ust').innerHTML = '<button class="ib" data-act="geri" aria-label="Geri">' + ic('geri') + '</button><div class="orta">' + orta + '</div>' +
    '<button class="ib" data-act="ipucu" aria-label="İpucu">' + ic('ipucu') + '</button><button class="ib' + (AY.muzik ? ' on' : '') + '" data-act="muzik" aria-label="Müzik">' + ic('muzik') + '</button><button class="ib" data-act="tamekran" aria-label="Tam ekran">' + ic('tam') + '</button>';
  $('#alt').innerHTML = [['bugun', 'Bugün'], ['ilerleme', 'İlerleme'], ['bilgi', 'Bilgi'], ['profil', 'Profil']].map(function (s) { return '<button data-act="sekme" data-v="' + s[0] + '"' + (s[0] === sekme ? ' class="on"' : '') + '>' + ic(s[0]) + s[1] + '</button>'; }).join('');
  var ic2 = $('#icerik'), y = ic2.scrollTop, ayni = ic2.getAttribute('data-s') === sekme;
  ic2.innerHTML = { bugun: vBugun, ilerleme: vIlerleme, bilgi: vBilgi, profil: vProfil }[sekme]();
  ic2.setAttribute('data-s', sekme); ic2.scrollTop = ayni ? y : 0;
}
var IMZA = '<div class="sig"><i></i><span>by <b>uozdil</b></span><i></i></div>';

function vBugun() {
  var d = gun(sGun), H = hesap(), o = ozet(d), D = degerlendir(o, H, sGun);
  var oran = Math.min(1, o.kcal / D.hedef), cev = 2 * Math.PI * 88, renk = D.d === 'kizil' ? 'var(--red)' : D.d === 'sari' ? 'var(--amber)' : 'var(--mint)';
  var kalan = D.hedef - o.kcal;
  var h = '<div class="kart halka"><div style="position:relative"><svg viewBox="0 0 200 200" role="img" aria-label="Kalori halkası"><circle cx="100" cy="100" r="88" fill="none" stroke="#12201c" stroke-width="12"/>' + (oran > 0 ? '<circle cx="100" cy="100" r="88" fill="none" stroke="' + renk + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + (cev * oran).toFixed(1) + ' ' + cev.toFixed(1) + '" transform="rotate(-90 100 100)"/>' : '') + '</svg>' +
    '<div class="ic"><span class="num" style="color:' + (kalan < 0 ? renk : 'var(--ink)') + '">' + say(Math.abs(kalan)) + '</span><small>kcal ' + (kalan < 0 ? 'fazla' : 'kalan') + '</small></div></div>' +
    '<div class="uclu"><div><span class="num">' + say(o.kcal) + '</span><small>alınan</small></div><div><span class="num" style="--c:' + RK.mint + '">' + say(H.hedef) + '</span><small>hedef</small></div><div><span class="num" style="--c:' + RK.har + '">' + say(o.yak) + '</span><small>hareket</small></div></div></div>';
  h += '<div class="durum ' + (D.d || '') + '"><b>' + D.b + '<span class="rozet">' + D.rozet + '</span></b><p>' + D.t + '</p>' + (D.sec.length ? '<ul>' + D.sec.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' : '') + '</div>';
  /* besin dağılımı: karbonhidrat %50, protein %20, yağ %30 */
  var mk = [['Karbonhidrat', o.c, 0.5 * D.hedef / 4, RK.karb], ['Protein', o.p, 0.2 * D.hedef / 4, RK.pro], ['Yağ', o.f, 0.3 * D.hedef / 9, RK.yag]];
  h += '<div class="kart">' + h2('Besin dağılımı', RK.pro) + '<div class="makro">' + mk.map(function (m) {
    var y = Math.min(100, 100 * m[1] / m[2]);
    return '<div class="s"><span style="display:flex;align-items:center;gap:7px"><i class="nk" style="--c:' + m[3] + '"></i>' + m[0] + '</span><div class="cub"><i style="--c:' + m[3] + ';width:' + y.toFixed(0) + '%"></i></div><span>' + say(m[1]) + ' / ' + say(m[2]) + ' g</span></div>';
  }).join('') + '</div></div>';
  h += '<div class="kart">' + h2('Öğünler', RK.mint, o.kcal ? say(o.kcal) + ' kcal' : '') + OGUN.map(function (g) {
    var l = d.m[g[0]], t = o.ogun[g[0]];
    return '<div class="ogun" style="--c:' + g[3] + '"><div class="bas"><span class="em">' + g[2] + '</span><b>' + g[1] + '</b><span class="num">' + (t ? say(t) + ' kcal' : '') + '</span><button class="ekle" data-act="yemekAc" data-v="' + g[0] + '">+ Ekle</button></div>' +
      (l.length ? l.map(function (y, i) { return '<button class="satir" data-act="yemekDuz" data-m="' + g[0] + '" data-i="' + i + '"><span>' + stil(y.kat)[0] + ' ' + esc(y.n) + ' <small>' + ond(y.q) + ' × ' + esc(y.por) + '</small></span><span class="k">' + say(y.kcal * y.q) + '</span></button>'; }).join('') : '<div class="bos">Henüz kayıt yok.</div>') +
      (t > 0.5 * H.hedef ? '<div class="uyari">Bu öğün tek başına günlük hedefinizin yarısını geçti.</div>' : '') + '</div>';
  }).join('') + '</div>';
  var bard = '', nb = Math.max(H.su, o.su);
  for (var i = 0; i < nb; i++) bard += '<i' + (i < o.su ? ' class="d"' : '') + '></i>';
  h += '<div class="kart">' + h2('Su', RK.su, o.su + ' / ' + H.su + ' bardak · ' + ond(o.su * 0.2) + ' L') + '<div class="su"><button class="yuv" data-act="suEksi" aria-label="Bir bardak azalt">−</button><div class="bard" data-act="suArti">' + bard + '</div><button class="yuv" data-act="suArti" aria-label="Bir bardak su ekle">+</button></div></div>';
  h += '<div class="kart" style="--c:' + RK.har + '">' + h2('Hareket', RK.har, o.yak ? say(o.yak) + ' kcal' : '') +
    (d.ex.length ? d.ex.map(function (e, i) { return '<button class="satir" data-act="hareketSil" data-i="' + i + '"><span>' + esc(e.n) + ' <small>' + e.dk + ' dk</small></span><span class="k">' + say(e.kcal) + '</span></button>'; }).join('') : '<div class="bos">Bugün yaptığınız yürüyüş ya da sporu ekleyin.</div>') +
    '<div style="margin-top:12px"><button class="ekle" data-act="hareketAc">+ Hareket ekle</button></div></div>';
  var gt = gunTarih(sGun), bi = SP.BILGI[Math.floor((gt - new Date(gt.getFullYear(), 0, 0)) / 864e5) % SP.BILGI.length];
  var bs = SP.BILGI_STIL[bi[0]];
  h += '<div class="kart bilgi rk" style="--c:' + bs[1] + '">' + h2('Günün bilgisi', bs[1], bs[0] + ' ' + bi[0]) + '<b>' + bi[1] + '</b><p>' + bi[2] + '</p></div>';
  if (yedekGerek()) h += '<div class="durum sade"><b>Yedek alma zamanı</b><p>Kayıtlarınız yalnızca bu cihazda. Bir dosyaya yedekleyin ki kaybolmasın.</p><div style="margin-top:10px"><button class="ekle" data-act="yedekAl">Yedek al</button></div></div>';
  return h + IMZA;
}
function yedekGerek() {
  var n = Object.keys(U.days).length; if (n < 5) return false;
  return !U.bk || gunKaydir(U.bk, 30) < bugun();
}

function cizgiGrafik(l, hedef) {
  if (l.length < 2) return '<div class="bos">Grafik için en az iki ölçüm gerekir. Haftada bir iki kez kilonuzu girin.</div>';
  var W = 320, Hh = 150, sol = 34, alt = 22, ust = 10, sag = 10;
  var v = l.map(function (e) { return e.w; }); if (hedef) v.push(hedef);
  var mn = Math.floor(Math.min.apply(0, v) - 1), mx = Math.ceil(Math.max.apply(0, v) + 1);
  var t0 = +gunTarih(l[0].d), t1 = +gunTarih(l[l.length - 1].d) || t0 + 1; if (t1 === t0) t1 = t0 + 864e5;
  function X(d) { return sol + (W - sol - sag) * (+gunTarih(d) - t0) / (t1 - t0); }
  function Y(w) { return ust + (Hh - ust - alt) * (mx - w) / (mx - mn); }
  var pts = l.map(function (e) { return X(e.d).toFixed(1) + ',' + Y(e.w).toFixed(1); });
  var s = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" style="width:100%;height:auto;display:block" role="img" aria-label="Kilo grafiği">';
  [mn, (mn + mx) / 2, mx].forEach(function (g) { s += '<line x1="' + sol + '" x2="' + (W - sag) + '" y1="' + Y(g) + '" y2="' + Y(g) + '" stroke="rgba(140,235,200,.12)"/><text x="' + (sol - 6) + '" y="' + (Y(g) + 4) + '" text-anchor="end" font-size="10" fill="#86a096">' + ond(g) + '</text>'; });
  if (hedef) s += '<line x1="' + sol + '" x2="' + (W - sag) + '" y1="' + Y(hedef) + '" y2="' + Y(hedef) + '" stroke="#6fe3b4" stroke-dasharray="4 4"/>';
  s += '<polygon points="' + sol + ',' + (Hh - alt) + ' ' + pts.join(' ') + ' ' + (W - sag) + ',' + (Hh - alt) + '" fill="rgba(111,227,180,.10)"/><polyline points="' + pts.join(' ') + '" fill="none" stroke="#6fe3b4" stroke-width="2" stroke-linejoin="round"/>';
  var son = l[l.length - 1]; s += '<circle cx="' + X(son.d) + '" cy="' + Y(son.w) + '" r="4.5" fill="#000" stroke="#b9f6dc" stroke-width="2"/>';
  var a = gunTarih(l[0].d), b = gunTarih(son.d);
  s += '<text x="' + sol + '" y="' + (Hh - 5) + '" font-size="10" fill="#86a096">' + a.getDate() + ' ' + AYLAR[a.getMonth()] + '</text><text x="' + (W - sag) + '" y="' + (Hh - 5) + '" text-anchor="end" font-size="10" fill="#86a096">' + b.getDate() + ' ' + AYLAR[b.getMonth()] + '</text></svg>';
  return s;
}
function haftaGrafik(H) {
  var W = 320, Hh = 140, alt = 22, ust = 16, g = [], mx = H.hedef * 1.2, t = bugun();
  for (var i = 6; i >= 0; i--) { var k = gunKaydir(t, -i), o = ozet(gun(k)); g.push({ k: k, v: o.kcal, h: H.hedef + o.yak }); mx = Math.max(mx, o.kcal * 1.05); }
  function Y(v) { return ust + (Hh - ust - alt) * (1 - v / mx); }
  var s = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" style="width:100%;height:auto;display:block" role="img" aria-label="Son yedi günün kalorisi">', bw = 26, ar = (W - 7 * bw) / 7;
  g.forEach(function (e, i) {
    var x = ar / 2 + i * (bw + ar), fazla = e.v > e.h * 1.1, cok = e.v > e.h + Math.max(0.25 * H.hedef, 500);
    s += '<rect x="' + x + '" y="' + ust + '" width="' + bw + '" height="' + (Hh - ust - alt) + '" rx="6" fill="#0d1815"/>';
    if (e.v) s += '<rect x="' + x + '" y="' + Y(e.v) + '" width="' + bw + '" height="' + (Hh - alt - Y(e.v)) + '" rx="6" fill="' + (cok ? '#ff7b6b' : fazla ? '#f2c66d' : '#6fe3b4') + '"/><text x="' + (x + bw / 2) + '" y="' + (Y(e.v) - 4) + '" text-anchor="middle" font-size="9" fill="#86a096">' + Math.round(e.v) + '</text>';
    s += '<text x="' + (x + bw / 2) + '" y="' + (Hh - 6) + '" text-anchor="middle" font-size="10" fill="' + (e.k === t ? '#e8f4ee' : '#86a096') + '">' + GUNLER[gunTarih(e.k).getDay()].slice(0, 3) + '</text>';
  });
  s += '<line x1="0" x2="' + W + '" y1="' + Y(H.hedef) + '" y2="' + Y(H.hedef) + '" stroke="#e8f4ee" stroke-dasharray="3 4" stroke-opacity=".55"/></svg>';
  return s;
}
function vIlerleme() {
  var H = hesap(), p = U.prof, v = H.vki, yer = Math.max(0, Math.min(100, (v - 15) / 20 * 100));
  var h = '<div class="kart">' + h2('Vücut kitle indeksi', v < 18.5 ? RK.su : v < 25 ? RK.mint : v < 30 ? '#f2c66d' : '#ff7b6b', vkiAd(v)) + '<div class="buyuk"><span class="num">' + ond(v) + '</span><small>' + ond(p.w) + ' kg · ' + say(p.h) + ' cm</small></div>' +
    '<div class="olcek"><i style="left:' + yer.toFixed(1) + '%"></i></div><div class="olcekyazi"><span>15</span><span>18,5</span><span>25</span><span>30</span><span>35</span></div>' +
    '<p style="margin:10px 0 0;color:var(--mut);font-size:13.5px">Boyunuz için sağlıklı aralık ' + say(H.saglikMin) + '–' + say(H.saglikMax) + ' kg.</p></div>';
  var wl = U.wl, ilk = wl[0], fark = p.w - ilk.w;
  h += '<div class="kart">' + h2('Kilo', RK.mint, p.tw ? 'hedef ' + ond(p.tw) + ' kg' : '') + '<div class="buyuk"><span class="num">' + ond(p.w) + '</span><small>kg' + (wl.length > 1 ? ' · başlangıca göre ' + (fark > 0 ? '+' : '') + ond(fark) + ' kg' : '') + '</small></div>' +
    (p.tw ? '<p style="margin:4px 0 10px;color:var(--mut);font-size:13.5px">' + (Math.abs(p.w - p.tw) < 0.3 ? 'Hedef kilonuza ulaştınız. Tebrikler.' : 'Hedefe ' + ond(Math.abs(p.w - p.tw)) + ' kg kaldı; bu hızla yaklaşık ' + Math.ceil(Math.abs(p.w - p.tw) / p.pace) + ' hafta.') + '</p>' : '<div style="height:8px"></div>') +
    cizgiGrafik(wl, p.tw) + '<div style="margin-top:12px"><button class="ekle" data-act="kiloAc">+ Kilo gir</button></div></div>';
  var t = bugun(), top = 0, n = 0, su = 0, ha = 0;
  for (var i = 0; i < 7; i++) { var d = U.days[gunKaydir(t, -i)]; if (d) { var o = ozet(d); if (o.kcal) { top += o.kcal; n++; } su += o.su; ha += o.yak; } }
  h += '<div class="kart">' + h2('Son yedi gün', RK.yag, 'kesik çizgi: hedef') + haftaGrafik(H) + '<div class="dort" style="margin-top:12px"><div><span class="num" style="--c:' + RK.mint + '">' + (n ? say(top / n) : '–') + '</span><small>kcal günlük ortalama</small></div><div><span class="num" style="--c:#f6c453">' + seri() + '</span><small>gün üst üste kayıt</small></div><div><span class="num" style="--c:' + RK.su + '">' + ond(su / 7) + '</span><small>bardak su ortalaması</small></div><div><span class="num" style="--c:' + RK.har + '">' + say(ha) + '</span><small>kcal hareketle</small></div></div></div>';
  return h + IMZA;
}
function vBilgi() {
  var h = '<div class="cip">' + SP.BILGI_KAT.map(function (k) { return '<button style="--c:' + SP.BILGI_STIL[k][1] + '" data-act="bilgiKat" data-v="' + k + '"' + (k === bilgiKat ? ' class="on"' : '') + '>' + SP.BILGI_STIL[k][0] + ' ' + k + '</button>'; }).join('') + '</div>';
  var st = SP.BILGI_STIL[bilgiKat];
  SP.BILGI.forEach(function (b) { if (b[0] === bilgiKat) h += '<div class="kart bilgi rk" style="--c:' + st[1] + '"><span class="et">' + st[0] + ' ' + b[0] + '</span><b>' + b[1] + '</b><p>' + b[2] + '</p></div>'; });
  h += '<p class="not" style="margin:4px auto">Bilgiler Dünya Sağlık Örgütü ve genel kabul görmüş halk sağlığı önerilerine dayanır; kişisel tıbbi tavsiye yerine geçmez.</p>';
  return h + IMZA;
}
function vProfil() {
  var H = hesap(), p = U.prof;
  var amac = { ver: 'Kilo vermek', koru: 'Kiloyu korumak', al: 'Kilo almak' }[H.amac];
  var h = '<div class="kart"><h2>' + esc(U.name) + '<span>' + H.yas + ' yaş · ' + (p.sex === 'e' ? 'Erkek' : 'Kadın') + '</span></h2><div class="dort"><div><span class="num">' + say(H.hedef) + '</span><small>kcal günlük hedef</small></div><div><span class="num">' + say(H.tdee) + '</span><small>kcal günlük harcama</small></div><div><span class="num">' + say(H.bmr) + '</span><small>kcal dinlenirken</small></div><div><span class="num">' + H.su + '</span><small>bardak su hedefi</small></div></div>' +
    '<p style="margin:12px 0;color:var(--mut);font-size:13.5px">' + amac + (H.amac !== 'koru' ? ' · haftada ' + say(p.pace * 1000) + ' g' : '') + ' · ' + ETKIN[p.act][1].toLocaleLowerCase('tr') + (H.kisit ? '. Hedef, güvenli alt sınırda tutuluyor.' : '') + '</p><button class="btn ik tam" data-act="profilDuz">' + ic('kalem') + 'Bilgilerimi ve hedefimi düzenle</button></div>';
  function an(ad, acik, k, alt) { return '<button data-act="ayar" data-v="' + k + '">' + '<span>' + ad + '<small>' + alt + '</small></span><span class="anahtar' + (acik ? ' on' : '') + '"></span></button>'; }
  h += '<div class="kart">' + h2('Ayarlar', RK.yag) + '<div class="liste">' + an('Müzik', AY.muzik, 'muzik', 'Sakin ortam müziği') + an('Sesler', AY.ses, 'ses', 'Kayıt eklerken kısa sesler') + an('OLED ekran koruması', AY.oled, 'oled', 'Görüntü hafifçe kayar, beklerken kararır') +
    '<div style="padding:13px 2px"><span>Üst boşluk<small>Kamera adası düğmeleri kapatıyorsa artırın</small></span><div style="margin-top:8px">' + seg('top', [[0, 'Yok'], [14, 'Az'], [28, 'Orta'], [42, 'Çok']], AY.top) + '</div></div></div></div>';
  h += '<div class="kart">' + h2('Kayıtlarım', RK.su) + '<div class="liste"><button data-act="yedekAl">' + ic('yedek') + '<span>Yedek al<small>' + (U.bk ? 'Son yedek: ' + gunAd(U.bk).replace(/^.*· /, '') : 'Henüz yedek alınmadı') + '</small></span></button><button data-act="yedekYukle">' + ic('yukle') + '<span>Yedek yükle<small>Daha önce aldığınız dosyadan geri getirir</small></span></button><button data-act="pinDegis">' + ic('kilit') + '<span>PIN değiştir</span></button></div></div>';
  h += '<div class="kart"><div class="liste"><button data-act="kilavuz">' + ic('kitap') + '<span>Kılavuz<small>Program nasıl kullanılır?</small></span></button><a href="../index.html">' + ic('salon') + '<span>Oyun Salonu’na dön<small>Tüm oyunlar ve programlar</small></span></a><button data-act="kilitle">' + ic('cikis') + '<span>Çıkış yap<small>Profili kilitler, kayıtlar durur</small></span></button><button data-act="profilSilSor" style="color:var(--red)">' + ic('cop') + '<span>Profili sil</span></button></div></div>';
  h += '<p class="not" style="margin:4px auto">Sağlık Pusulası genel bilgilendirme amaçlıdır; teşhis koymaz, tedavi önermez. Sağlık sorunlarınız için hekiminize danışın.</p>';
  return h + IMZA;
}

/* ---------- yemek ekleme ---------- */
var Y = { ogun: 'k', kat: 'Sık', ara: '', sec: null, q: 1, duz: null };
function tumYemek() { return U.own.concat(SP.YEMEKLER); }
function yemekSatir(y) {
  var st = stil(y.kat);
  return '<button data-act="yemekSec" data-n="' + esc(y.n) + '" style="--c:' + st[1] + '"><span class="em">' + st[0] + '</span><span>' + esc(y.n) + '<small>' + esc(y.por) + '</small></span><span class="k">' + say(y.kcal) + ' kcal</span></button>';
}
function sikListe(n) { var f = U.freq; return tumYemek().filter(function (y) { return f[y.n]; }).sort(function (x, y) { return f[y.n] - f[x.n]; }).slice(0, n); }
function yemekGovde() {
  var a = duz(Y.ara.trim()), l;
  if (a) {
    l = tumYemek().filter(function (y) { return duz(y.n).indexOf(a) >= 0; });
    return '<div class="ylist">' + (l.length ? l.slice(0, 60).map(yemekSatir).join('') : '<div class="bos">Bulunamadı. Aşağıdaki düğmeyle adını ve kalorisini kendiniz yazabilirsiniz.</div>') + '</div>';
  }
  if (!Y.kat) {
    var sik = sikListe(4), h = '';
    if (sik.length) h += '<div class="altbas">Sık yedikleriniz</div><div class="ylist">' + sik.map(yemekSatir).join('') + '</div>';
    var kats = (sik.length ? ['Sık'] : []).concat(U.own.length ? ['Benim'] : [], SP.YEMEK_KAT.map(function (k) { return k[0]; }));
    return h + '<div class="altbas">Başlık seçin</div><div class="kgrid">' + kats.map(function (k) { var st = stil(k); return '<button data-act="yemekKat" data-v="' + k + '" style="--c:' + st[1] + '"><span>' + st[0] + '</span>' + (SP.KAT_KISA[k] || k) + '</button>'; }).join('') + '</div>';
  }
  l = Y.kat === 'Sık' ? sikListe(20) : Y.kat === 'Benim' ? U.own : SP.YEMEKLER.filter(function (y) { return y.kat === Y.kat; });
  var st = stil(Y.kat);
  return '<div class="katbas" style="--c:' + st[1] + '"><span class="em">' + st[0] + '</span>' + (SP.KAT_KISA[Y.kat] || Y.kat) + '<button class="ekle" style="--c:#86a096" data-act="yemekKat" data-v="">‹ Tüm başlıklar</button></div><div class="ylist">' + l.map(yemekSatir).join('') + '</div>';
}
function yemekAc(ogun) { Y.ogun = ogun; Y.ara = ''; Y.duz = null; Y.kat = ''; yemekCiz(); }
function yemekCiz() {
  var g = OGUN.filter(function (x) { return x[0] === Y.ogun; })[0];
  panel(bas(g[2] + ' ' + g[1] + ' için ekle') + '<div class="alan"><input id="ara" type="search" placeholder="🔍  Yemek ara: mercimek, simit, elma…" autocomplete="off" aria-label="Yemek ara" value="' + esc(Y.ara) + '"></div>' +
    '<div id="ygovde" style="display:flex;flex-direction:column;gap:14px">' + yemekGovde() + '</div><button class="btn ik tam" data-act="kendiAc">Listede yok, kendim yazayım</button>', Y.kat ? function () { Y.kat = ''; yemekCiz(); } : null);
}
function porsiyonCiz() {
  var y = Y.sec, q = Y.q;
  panel(bas(stil(y.kat)[0] + ' ' + esc(y.n)) + '<p>' + esc(y.por) + ' · ' + say(y.kcal) + ' kcal</p><div class="sayac"><button class="yuv" data-act="porEksi" aria-label="Azalt" style="color:var(--mint)">−</button><span class="num">' + ond(q) + '</span><button class="yuv" data-act="porArti" aria-label="Artır" style="color:var(--mint)">+</button></div><p style="text-align:center;color:var(--mut)">porsiyon</p>' +
    '<div class="buyuk" style="justify-content:center"><span class="num">' + say(y.kcal * q) + '</span><small>kcal</small></div><p style="text-align:center;color:var(--mut);font-size:13.5px">Protein ' + ond(y.p * q) + ' g · Yağ ' + ond(y.f * q) + ' g · Karbonhidrat ' + ond(y.c * q) + ' g</p>' +
    '<div class="alan"><label>Öğün</label>' + seg('ogun', OGUN, Y.ogun) + '</div>' +
    '<button class="btn tam" data-act="porKaydet">' + (Y.duz ? 'Kaydet' : 'Ekle') + '</button>' + (Y.duz ? '<button class="btn kirmizi tam" data-act="porSil">Bu kaydı sil</button>' : ''), Y.duz ? null : yemekCiz);
}
function kendiCiz(hata) {
  panel(bas('Kendi yemeğim') + '<div class="alan"><label for="k_n">Yemeğin adı</label><input id="k_n" maxlength="40" autocomplete="off"></div><div class="iki"><div class="alan"><label for="k_por">Porsiyon tarifi</label><input id="k_por" maxlength="24" placeholder="1 porsiyon" autocomplete="off"></div><div class="alan"><label for="k_kcal">Kalori (kcal)</label><input id="k_kcal" inputmode="numeric" maxlength="4"></div></div>' +
    '<div class="uc"><div class="alan"><label for="k_p">Protein g</label><input id="k_p" inputmode="decimal" maxlength="5"></div><div class="alan"><label for="k_f">Yağ g</label><input id="k_f" inputmode="decimal" maxlength="5"></div><div class="alan"><label for="k_c">Karbonhidrat g</label><input id="k_c" inputmode="decimal" maxlength="5"></div></div>' +
    '<p class="not" style="text-align:left;max-width:none">Kalori paketin üzerindeki besin değerleri tablosunda yazar. Protein, yağ ve karbonhidratı boş bırakabilirsiniz.</p><div class="hata">' + (hata || '') + '</div><button class="btn tam" data-act="kendiKaydet">Devam</button>', yemekCiz);
}

/* ---------- hareket, kilo ---------- */
var HR = { i: 0, dk: 30 };
function hareketCiz() {
  var kcal = SP.HAREKET[HR.i][1] * U.prof.w * HR.dk / 60;
  panel(bas('Hareket ekle') + '<div class="alan"><label for="h_tur">Ne yaptınız?</label><select id="h_tur" style="height:50px;border-radius:14px;border:1px solid var(--ln);background:#050a09;padding:0 12px;font-size:16px">' + SP.HAREKET.map(function (x, i) { return '<option value="' + i + '"' + (i === HR.i ? ' selected' : '') + '>' + x[0] + '</option>'; }).join('') + '</select></div>' +
    '<div class="alan"><label>Süre</label>' + seg('dk', [[15, '15 dk'], [30, '30 dk'], [45, '45 dk'], [60, '1 saat'], [90, '1,5 saat']], HR.dk) + '</div>' +
    '<div class="buyuk" style="justify-content:center"><span class="num">' + say(kcal) + '</span><small>kcal · yaklaşık</small></div><button class="btn tam" data-act="hareketKaydet">Ekle</button>');
}
function kiloYaz(k, w) {
  var l = U.wl.filter(function (e) { return e.d !== k; }); l.push({ d: k, w: w });
  l.sort(function (a, b) { return a.d < b.d ? -1 : 1; }); U.wl = l; U.prof.w = l[l.length - 1].w;
}

/* ---------- yedek ---------- */
function yedekAl() {
  try {
    var b = new Blob([JSON.stringify({ app: 'saglik-pusulasi', v: 1, tarih: bugun(), user: U })], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'saglik-pusulasi-' + duz(U.name).replace(/[^a-z0-9]+/g, '-') + '-' + bugun() + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    U.bk = bugun(); kaydet(); ciz(); toast('Yedek dosyası indirildi. Güvenli bir yerde saklayın.', 3600);
  } catch (e) { toast('Yedek alınamadı.'); }
}
var bekleyen = null;
function yedekOku(file) {
  var r = new FileReader();
  r.onload = function () {
    try {
      var j = JSON.parse(r.result), u = j.user;
      if (j.app !== 'saglik-pusulasi' || !u || !u.id || !u.name || !u.pin || !u.salt || !u.prof || !u.days) throw 0;
      u.wl = u.wl || []; u.own = u.own || []; u.freq = u.freq || {}; u.seen = u.seen || {};
      bekleyen = u;
      if (DB.users[u.id]) onay('Profil zaten var', '“' + esc(u.name) + '” bu cihazda kayıtlı. Yedekteki kayıtlar şimdikilerin yerine geçecek.', 'Yedeği yükle', 'yedekOnay');
      else yedekOnay();
    } catch (e) { toast('Bu dosya bir Sağlık Pusulası yedeği değil.', 3400); }
  };
  r.readAsText(file);
}
function yedekOnay() {
  var u = bekleyen; bekleyen = null; if (!u) return;
  DB.users[u.id] = u; kaydet(); panelKapat();
  if (U && U.id === u.id) { U = u; ciz(); } else girisCiz();
  toast('“' + u.name + '” profili yüklendi. PIN ile açabilirsiniz.', 3600);
}

/* ---------- kılavuz, tur, ipucu ---------- */
var TUR = [
  ['Hoş geldiniz', 'Sağlık Pusulası her gün ne kadar yediğinizi, içtiğinizi ve hareket ettiğinizi izler; ihtiyacınıza göre sizi yönlendirir.'],
  ['Yedikçe ekleyin', 'Öğünün yanındaki Ekle düğmesine dokunun, yemeği seçin, porsiyonu ayarlayın. Kalori ve besin değerleri kendiliğinden hesaplanır.'],
  ['Halkayı izleyin', 'Ortadaki sayı bugün kalan kalorinizdir. Yeşil yolunda, sarı biraz fazla, kırmızı belirgin fazla ya da çok az demektir.'],
  ['Kayıtlarınız sizde', 'Bilgileriniz yalnızca bu cihazda durur ve PIN ile açılır. Ayda bir Profil ekranından yedek almayı unutmayın.']
];
function tur(i) {
  var c = '<div class="adim">' + TUR.map(function (_, j) { return '<i' + (j <= i ? ' class="on"' : '') + '></i>'; }).join('') + '</div>';
  panel('<h3>' + TUR[i][0] + '</h3>' + c + '<p>' + TUR[i][1] + '</p><div class="iki"><button class="btn ik" data-act="kapat">Atla</button><button class="btn" data-act="tur" data-v="' + (i + 1) + '">' + (i === TUR.length - 1 ? 'Başlayalım' : 'Devam') + '</button></div>');
}
function kilavuz() {
  panel(bas('Kılavuz') + SP.KILAVUZ.map(function (k) { return '<div class="bilgi"><b style="font-size:17px">' + k[0] + '</b><p>' + k[1] + '</p></div>'; }).join('') + '<button class="btn tam" data-act="kapat">Anladım</button>');
}
function ipucu() {
  var l = SP.IPUCU[sekme] || [];
  panel(bas('İpuçları') + '<ul style="margin:0;padding-left:20px;display:grid;gap:8px">' + l.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul><button class="btn ik tam" data-act="kilavuz">' + ic('kitap') + 'Tüm kılavuzu aç</button>');
}

/* ---------- geri ---------- */
function geri() {
  if (panelAcik()) { if (panelGeri) { var f = panelGeri; panelGeri = null; f(); } else panelKapat(); return; }
  if (!U) return;
  if (sekme !== 'bugun') { sekme = 'bugun'; ciz(); return; }
  if (sGun !== bugun()) { sGun = bugun(); ciz(); return; }
  kilitle();
}

/* ---------- olaylar ---------- */
var ACT = {
  kapat: panelKapat, geri: geri, tamekran: tamEkran, kilavuz: kilavuz, ipucu: ipucu, kilitle: kilitle, yedekAl: yedekAl, yedekOnay: yedekOnay,
  muzik: function () { AY.muzik = !AY.muzik; kaydet(); if (AY.muzik) { muzikBasla(); toast('Müzik açık'); } else { muzikDur(); toast('Müzik kapalı'); } muzikGoster(); if (U && sekme === 'profil') ciz(); },
  yeniProfil: function () { sihirbaz(false); },
  profilDuz: function () { sihirbaz(true); },
  sihirIleri: function () { sihirOku(); W.hata = sihirKontrol(); if (W.hata) return sihirCiz(); if (W.adim === 4) return sihirBitir(); W.adim++; sihirCiz(); },
  sihirGeri: function () { sihirOku(); W.hata = ''; W.adim--; sihirCiz(); },
  profilSec: function (el) {
    var u = DB.users[el.getAttribute('data-id')];
    pinSor(esc(u.name), 'PIN’inizi girin.', function (pin) {
      if (pinOzet(pin, u.salt) === u.pin) { panelKapat(); SES.ekle(); ac(u.id); return true; }
      return false;
    });
  },
  pinTus: function (el) {
    var v = el.getAttribute('data-v');
    if (v === 'sil') PIN.v = PIN.v.slice(0, -1); else if (PIN.v.length < 4) PIN.v += v;
    PIN.hata = ''; SES.tik();
    if (PIN.v.length === 4) { var p = PIN.v, cb = PIN.cb; PIN.v = ''; if (cb(p) === false) { PIN.hata = 'PIN yanlış. Yeniden deneyin.'; pinCiz(); } return; }
    pinCiz();
  },
  pinDegis: function () {
    pinSor('Yeni PIN', 'Yeni 4 haneli PIN’inizi girin.', function (p1) {
      pinSor('Yeni PIN tekrar', 'Aynı PIN’i bir kez daha girin.', function (p2) {
        if (p1 !== p2) { panelKapat(); toast('İki PIN birbirini tutmadı. PIN değişmedi.', 3200); return true; }
        U.salt = rasgele(); U.pin = pinOzet(p1, U.salt); kaydet(); panelKapat(); toast('PIN değiştirildi.'); return true;
      });
      return true;
    });
  },
  profilSilSor: function () { onay('Profili sil', '“' + esc(U.name) + '” profili ve tüm kayıtları bu cihazdan kalıcı olarak silinecek. Önce yedek almanız önerilir.', 'PIN ile onayla ve sil', 'profilSil', true); },
  profilSil: function () {
    pinSor('Silmeyi onaylayın', 'PIN’inizi girin.', function (pin) {
      if (pinOzet(pin, U.salt) !== U.pin) return false;
      delete DB.users[U.id]; kaydet(); kilitle(); toast('Profil silindi.'); return true;
    });
  },
  sekme: function (el) { sekme = el.getAttribute('data-v'); ciz(); },
  gunGeri: function () { sGun = gunKaydir(sGun, -1); ciz(); },
  gunIleri: function () { if (sGun < bugun()) { sGun = gunKaydir(sGun, 1); ciz(); } },
  bilgiKat: function (el) { bilgiKat = el.getAttribute('data-v'); ciz(); $('#icerik').scrollTop = 0; },
  ayar: function (el) {
    var k = el.getAttribute('data-v');
    if (k === 'muzik') return ACT.muzik();
    AY[k] = !AY[k]; kaydet(); if (k === 'oled') oledUygula(); ciz();
  },
  yemekAc: function (el) { yemekAc(el.getAttribute('data-v')); },
  yemekKat: function (el) { Y.kat = el.getAttribute('data-v'); Y.ara = ''; yemekCiz(); },
  yemekSec: function (el) {
    var n = el.getAttribute('data-n'), y = tumYemek().filter(function (x) { return x.n === n; })[0];
    if (!y) return; Y.sec = y; Y.q = 1; Y.duz = null; porsiyonCiz();
  },
  yemekDuz: function (el) {
    var m = el.getAttribute('data-m'), i = +el.getAttribute('data-i'), y = gun(sGun).m[m][i];
    Y.sec = y; Y.q = y.q; Y.ogun = m; Y.duz = { m: m, i: i }; porsiyonCiz();
  },
  porArti: function () { if (Y.q < 10) Y.q += 0.5; porsiyonCiz(); },
  porEksi: function () { if (Y.q > 0.5) Y.q -= 0.5; porsiyonCiz(); },
  porKaydet: function () {
    var d = gun(sGun), y = Y.sec, once = degerlendir(ozet(d), hesap(), sGun).d;
    if (Y.duz) d.m[Y.duz.m].splice(Y.duz.i, 1); else U.freq[y.n] = (U.freq[y.n] || 0) + 1;
    d.m[Y.ogun].push({ n: y.n, por: y.por, kcal: y.kcal, p: y.p, f: y.f, c: y.c, q: Y.q, kat: y.kat || 'Benim' });
    gunYaz(sGun, d); panelKapat(); ciz(); SES.ekle();
    var D = degerlendir(ozet(d), hesap(), sGun);
    if (D.d === 'kizil' && once !== 'kizil') toast(D.b + '. ' + D.t, 4200); else toast(say(y.kcal * Y.q) + ' kcal eklendi.');
  },
  porSil: function () { var d = gun(sGun); d.m[Y.duz.m].splice(Y.duz.i, 1); gunYaz(sGun, d); panelKapat(); ciz(); toast('Kayıt silindi.'); },
  kendiAc: function () { kendiCiz(); },
  kendiKaydet: function () {
    var n = $('#k_n').value.trim(), kcal = sayi($('#k_kcal').value), por = $('#k_por').value.trim() || '1 porsiyon';
    if (n.length < 2) return kendiCiz('Yemeğin adını yazın.');
    if (!(kcal >= 0 && kcal <= 5000)) return kendiCiz('Kaloriyi sayı olarak girin (0–5000).');
    var y = { n: n, por: por, kcal: kcal, p: sayi($('#k_p').value) || 0, f: sayi($('#k_f').value) || 0, c: sayi($('#k_c').value) || 0, kat: 'Benim' };
    U.own = U.own.filter(function (x) { return x.n !== n; }); U.own.unshift(y); kaydet();
    Y.sec = y; Y.q = 1; Y.duz = null; porsiyonCiz();
  },
  suArti: function () { var d = gun(sGun); if (d.su >= 30) return; d.su++; gunYaz(sGun, d); ciz(); if (d.su === hesap().su) { SES.kutla(); toast('Bugünkü su hedefinize ulaştınız.'); } else SES.su(); },
  suEksi: function () { var d = gun(sGun); if (d.su > 0) { d.su--; gunYaz(sGun, d); ciz(); } },
  hareketAc: function () { HR = { i: 1, dk: 30 }; hareketCiz(); },
  hareketKaydet: function () {
    var d = gun(sGun), x = SP.HAREKET[HR.i], kcal = Math.round(x[1] * U.prof.w * HR.dk / 60);
    d.ex.push({ n: x[0], dk: HR.dk, kcal: kcal }); gunYaz(sGun, d); panelKapat(); ciz(); SES.ekle(); toast(kcal + ' kcal hareket eklendi.');
  },
  hareketSil: function (el) { var i = +el.getAttribute('data-i'), e = gun(sGun).ex[i]; HR.sil = i; onay(esc(e.n), e.dk + ' dakika · ' + say(e.kcal) + ' kcal. Bu kaydı silmek istiyor musunuz?', 'Kaydı sil', 'hareketSilOnay', true); },
  hareketSilOnay: function () { var d = gun(sGun); d.ex.splice(HR.sil, 1); gunYaz(sGun, d); panelKapat(); ciz(); },
  kiloAc: function () { panel(bas('Kilonuzu girin') + '<div class="alan"><label for="kilo">Bugünkü kilo (kg)</label><input id="kilo" inputmode="decimal" maxlength="5" value="' + ond(U.prof.w) + '"></div><p class="not" style="text-align:left;max-width:none">En doğru ölçüm sabah aç karnına, aynı tartıyla yapılır.</p><div class="hata" id="kiloHata"></div><button class="btn tam" data-act="kiloKaydet">Kaydet</button>'); },
  kiloKaydet: function () {
    var w = sayi($('#kilo').value); if (!(w >= 30 && w <= 250)) { $('#kiloHata').textContent = 'Kiloyu kilogram olarak girin (30–250).'; return; }
    var p = U.prof, onceki = p.w; kiloYaz(bugun(), Math.round(w * 10) / 10); kaydet(); panelKapat(); ciz();
    if (p.tw && Math.abs(p.w - p.tw) < 0.3) { SES.kutla(); toast('Hedef kilonuza ulaştınız. Tebrikler!', 4000); }
    else toast(p.w === onceki ? 'Kilo kaydedildi.' : 'Kilo kaydedildi, hedefleriniz güncellendi.');
  },
  yedekYukle: function () { var f = $('#dosya'); f.value = ''; f.click(); },
  tur: function (el) { var i = +el.getAttribute('data-v'); if (i >= TUR.length) panelKapat(); else tur(i); }
};
document.addEventListener('click', function (e) {
  dokundu();
  if (AY.muzik && !muzikT) muzikBasla();
  var t = e.target, s = t.closest('[data-seg] [data-v]');
  if (s) {
    var ad = s.parentNode.getAttribute('data-seg'), v = s.getAttribute('data-v');
    if (ad === 'top') { AY.top = +v; kaydet(); oledUygula(); ciz(); }
    else if (ad === 'ogun') { Y.ogun = v; porsiyonCiz(); }
    else if (ad === 'dk') { HR.dk = +v; HR.i = +$('#h_tur').value; hareketCiz(); }
    else if (W) { sihirOku(); W[ad] = v; W.hata = ''; sihirCiz(); }
    return;
  }
  var a = t.closest('[data-act]');
  if (a && ACT[a.getAttribute('data-act')]) { ACT[a.getAttribute('data-act')](a); return; }
  if (t.id === 'ov') geri();
});
document.addEventListener('input', function (e) {
  if (e.target.id === 'ara') { Y.ara = e.target.value; $('#ygovde').innerHTML = yemekGovde(); }
});
document.addEventListener('change', function (e) {
  if (e.target.id === 'h_tur') { HR.i = +e.target.value; hareketCiz(); }
  if (e.target.id === 'dosya' && e.target.files[0]) yedekOku(e.target.files[0]);
});
['touchstart', 'keydown', 'scroll'].forEach(function (n) { document.addEventListener(n, dokundu, { passive: true, capture: true }); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') geri(); });
window.addEventListener('popstate', function () {
  if (!U) return;
  geri();
  if (U) { try { history.pushState({ sp: 1 }, ''); } catch (e) {} }
});
document.addEventListener('visibilitychange', function () { if (document.hidden) { if (muzikT) muzikDur(); } else if (U && sekme === 'bugun') ciz(); });

girisCiz(); oledUygula();
SP._t = { hesap: hesap, degerlendir: degerlendir, ozet: ozet, pinOzet: pinOzet };
})();
