/* "Tüm oyunlar" düğmesi: sadece oyunun KENDİ ANA MENÜSÜNDE görünür, oyun içinde görünmez.
   Kullanım: <script async src="…/salon-butonu.js" data-menu="CSS seçici"></script>
   data-menu: oyunun ana menü ekranının seçicisi. data-son: sona eklenir. data-satir: seçili öğeye satır içi (akışta) eklenir, yoksa sol üst köşeye yerleşir. */
(function () {
  try {
    if (window.parent !== window.self) return;
    var cs = document.currentScript;
    if (!cs || !cs.getAttribute('data-menu')) return;
    var sel = cs.getAttribute('data-menu'), satir = cs.hasAttribute('data-satir'), son = cs.hasAttribute('data-son');
    var base = new URL('./', cs.src).href;
    var st = document.createElement('style');
    st.textContent = '.salonBtn{display:inline-flex;align-items:center;gap:6px;z-index:5;padding:7px 12px 7px 9px;border-radius:999px;background:rgba(10,12,18,.8);border:1px solid rgba(212,175,90,.55);color:#f1dc9c;text-decoration:none;font:600 13px/1 system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.4);-webkit-tap-highlight-color:transparent}.salonBtn.abs{position:absolute;left:10px;top:calc(10px + env(safe-area-inset-top,0px))}.salonBtn.sat{margin:8px 0}.salonBtn svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}';
    document.head.appendChild(st);
    function yap() {
      var a = document.createElement('a');
      a.className = 'salonBtn ' + (satir ? 'sat' : 'abs'); a.href = base + 'index.html';
      a.setAttribute('aria-label', 'Tüm oyunlar (ana oyun sayfası)');
      a.innerHTML = '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4"/></svg>Tüm oyunlar';
      return a;
    }
    var busy = false;
    function kontrol() {
      busy = false;
      var el = document.querySelector(sel);
      if (!el) return;
      if (el.querySelector(':scope > .salonBtn')) return;
      if (son && el.lastElementChild && el.lastElementChild.classList.contains('salonBtn')) return;
      if (!satir && getComputedStyle(el).position === 'static') el.style.position = 'relative';
      if (son) el.appendChild(yap()); else el.insertBefore(yap(), el.firstChild);
    }
    function planla() { if (!busy) { busy = true; requestAnimationFrame(kontrol); } }
    function basla() { kontrol(); new MutationObserver(planla).observe(document.body, { childList: true, subtree: true }); }
    if (document.body) basla(); else document.addEventListener('DOMContentLoaded', basla);
  } catch (e) {}
})();
