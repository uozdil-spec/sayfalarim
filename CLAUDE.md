# sayfalarim — Oyun Salonu

Bu depo GitHub Pages ile yayınlanır: https://uozdil-spec.github.io/sayfalarim/
Ana sayfa (`index.html`) tüm oyunların menüsüdür; liste `oyunlar.js` içindedir.

## Yeni oyun eklendiğinde (her seferinde, istenmeden)
1. Oyunun simgesi yoksa oluştur (SVG + 32/180 PNG, mevcut `*-ikon.*` düzeniyle).
2. `oyunlar.js` içine tek satır ekle (ad, yol, ikon, not, k, on).
3. Oyun sayfasının `</head>` öncesine `<script async src="sayac.js"></script>` ekle
   (klasördeki sayfalarda `../sayac.js`).
4. `python3 damga.py` çalıştır, sonra commit + push.
5. Kullanıcıya kısaca bildir: oyun menüye eklendi.

## Notlar
- Sayaç: GoatCounter, kod `odegil` (`sayac.js`). Panel: https://odegil.goatcounter.com
- Menü simgeleri: `salon-ikon*`, ana ekrana ekleme: `salon.webmanifest`.
- `spider/` ve `kelime-oyunu/` eski adreslerden yönlendirmedir; menüye eklenmez.
- Kullanıcı teknik olmayan, sade çözümleri tercih eder; komut satırı istemeyin.
