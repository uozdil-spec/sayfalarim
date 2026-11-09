/* Her oyun sayfasına küçük "Tüm oyunlar" düğmesi ekler; ana oyun sayfasına (index.html) götürür.
   Dokunmadan birkaç saniye sonra solar, ekrana dokununca geri gelir. */
(function () {
  try {
    if (window.parent !== window.self) return;
    var cs = document.currentScript, base = cs && cs.src ? new URL('./', cs.src).href : '/';
    if (/\/(index\.html)?$/.test(location.pathname) && location.href.indexOf(base) === 0 && location.pathname === new URL(base).pathname) return; // ana sayfanın kendisi
    var st = document.createElement('style');
    st.textContent = '#salonBtn{position:fixed;left:calc(8px + env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:2147483000;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(10,12,18,.78);border:1px solid rgba(212,175,90,.55);color:#f1dc9c;text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.5);opacity:.75;transition:opacity .6s;-webkit-tap-highlight-color:transparent}#salonBtn.gizli{opacity:0;pointer-events:none}#salonBtn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}';
    document.head.appendChild(st);
    var a = document.createElement('a');
    a.id = 'salonBtn'; a.href = base + 'index.html'; a.title = 'Tüm oyunlar'; a.setAttribute('aria-label', 'Tüm oyunlar (ana oyun sayfası)');
    a.innerHTML = '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4"/></svg>';
    var t = null;
    function goster() { a.classList.remove('gizli'); clearTimeout(t); t = setTimeout(function () { a.classList.add('gizli'); }, 4000); }
    ['pointerdown', 'touchstart', 'mousemove', 'keydown'].forEach(function (e) { document.addEventListener(e, goster, { passive: true, capture: true }); });
    function ekle() { document.body.appendChild(a); goster(); }
    if (document.body) ekle(); else document.addEventListener('DOMContentLoaded', ekle);
  } catch (e) {}
})();
