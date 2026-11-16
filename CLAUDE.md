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

## Pergel (pergel/) — devam notu
- Tek dosya: `pergel/index.html` (three.js r128; DWG için `pergel/dwg/`). Kaynak ile yayın aynı dosyadır; düzenleme doğrudan bu dosyada yapılır.
- Her değişiklikten sonra: `python3 damga.py`, commit, push. Kullanıcıya kısa, Türkçe, teknik olmayan özet.
- Büyük işlerde önce plan sun, onay al. Küçük adımlarla ilerle; her adımı tarayıcıda dene.
- Yapılanlar: 2B çizim ve ölçülendirme, ölçü stili, birimler, katmanlar, DXF/DWG açma, DXF kaydetme,
  katılarda yüz çekme + pah/yuvarlatma (kutu, silindir, koni, küre, yükseltilmiş şekil), birleştir/çıkar/kesiştir,
  yüze dikdörtgen/daire ile oyuk-çıkıntı, metraj (CSV), pafta ve Yazdır/PDF, görüntü kalitesi ayarı.
- Sıradaki öneriler (sırayla): döndürerek katı ve yol boyunca süpürme; blok/bileşen; kesit görünümü;
  eksik düzenleme araçları (yayda kırpma, dairesel çoğaltma, germe); ön/yan görünüş çıktısı.
