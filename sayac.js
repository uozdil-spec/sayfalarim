/* Ziyaretçi / oynanma sayacı — GoatCounter (çerezsiz, kişisel veri tutmaz).
   Harici betik yüklemez; sayfa açılınca GoatCounter'a küçük bir "ziyaret" isteği gönderir.
   KOD = goatcounter hesabının adı (https://KOD.goatcounter.com). Boşsa hiçbir şey çalışmaz. */
(function () {
  var KOD = 'odegil';

  if (!KOD) return;
  window.SAYAC_KOD = KOD;
  try {
    if (location.hostname === 'localhost' || location.protocol === 'file:') return;
    if (window.parent !== window.self) return;                       // başka sayfanın içine gömülüyse sayma
    if (navigator.webdriver) return;                                 // otomatik tarayıcıları sayma
    if (localStorage.getItem('skipgc') === 't') return;              // "beni sayma" işareti

    var q = [
      'p=' + encodeURIComponent(location.pathname),
      't=' + encodeURIComponent(document.title || ''),
      'r=' + encodeURIComponent(document.referrer || ''),
      's=' + [screen.width, screen.height, window.devicePixelRatio || 1].join(','),
      'rnd=' + Math.random().toString(36).slice(2)
    ].join('&');
    var img = new Image(1, 1);
    img.referrerPolicy = 'no-referrer-when-downgrade';
    img.src = 'https://' + KOD + '.goatcounter.com/count?' + q;
  } catch (e) { /* sayaç hata verse de oyun etkilenmesin */ }
})();
