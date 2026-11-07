/* Ziyaretçi / oynanma sayacı — GoatCounter (çerezsiz, kişisel veri tutmaz).
   KURULUM: goatcounter.com'da ücretsiz hesap açıp seçtiğin adı aşağıdaki KOD'a yaz.
   Örn. adresin https://ugur.goatcounter.com ise KOD = 'ugur'.
   KOD boşken hiçbir şey çalışmaz ve hiçbir yere veri gitmez. */
(function () {
  var KOD = 'odegil';

  if (!KOD) return;
  window.SAYAC_KOD = KOD;
  if (window.goatcounter && window.goatcounter.no_onload) return;   // menü sayfası kendi isteğini yönetir
  if (location.hostname === 'localhost' || location.protocol === 'file:') return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + KOD + '.goatcounter.com/count');
  (document.head || document.documentElement).appendChild(s);
})();
