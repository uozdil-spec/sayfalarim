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

## Pergel (pergel/) — kısa not
Ayrıntılı geçmiş (yapılan her iş, doğrulama sayıları, dersler) **YAPILANLAR.md** içinde. Tamamını OKUMA (çok büyük); gerekirse `grep -n "anahtar kelime" YAPILANLAR.md` ile yalnız ilgili satırı bul.
BAĞIMSIZLIK (kullanıcı 23.11.2026): Pergel ve Oyun Salonu birbirinden tamamen bağımsız; Pergel oyunlar.js menüsünde YOK, Pergel'de 'Tüm oyunlar' düğmesi/meta salon YOK. Yeni oyun kuralları Pergel'e uygulanmaz; ikisi arasına bağlantı ekleme.

### Kurallar
Kurallar: kısa, Türkçe, teknik olmayan rapor; büyük işte önce kısa plan + onay ("Devam/Evet" = onay); adım adım; her adımda tarayıcıda dene (bilgisayar + telefon 390px), benzer hataları sorulmadan bul ve düzelt; kılavuzu TR+EN güncelle; her özellik SpaceClaim/SolidWorks (hangisi kolay/iyiyse) gibi; adlar rakiplerle uyumlu; tüm geometri kesin (OCCT B-rep), hacim/ölçü formülle doğrulanır; her değişiklikten sonra damga.py + commit + push + Claude artifact (slug 09b60b75-f288-47c3-afa2-fbb897322523) güncelle.
OTOMATİK HATA AVI (kullanıcı: "bu tip hataları sen söylemeden de düzeltebilirsin", "bu tarz hataları öngör ve otomatik düzelt"): her işten sonra sorulmadan şunları dene, bulduğunu düzelt ve raporda kısaca söyle:
 - Benzer durumlar: köşe/kenar birleşimleri, işlem sırası, taşı/döndür/aynala/ölçekle sonrası, eğik yüz, çoklu seçim, geri al/yinele, kaydet-aç.
 - Ekranlar: bilgisayar (1360px) + telefon (390px, dokunma), açık/koyu tema, EN dil (metin taşması), WebGL kapalı tarayıcı, ilk açılış (başlangıç penceresi + tur).
 - Pencere/panel çakışması: küçük pencereler, seçim şeridi, sağ tık menüsü, ipucu kartı üst üste binmesin; her pencerede × ve Esc çalışsın; düğmeler tıklanabilsin.
 - Kod: aynı adlı iki fonksiyon kontrolü (`grep -o '^function [A-Za-z0-9_]*' | sort | uniq -d`), node --check, tarayıcı hata kaydı boş olmalı.
 - Hesap: hacim/alan/debi gibi sayıları formülle karşılaştır; tutmuyorsa düzelt.
 - Ayarlar: yeni eklenen her ayar "Varsayılana dön"e ve kılavuza eklensin.

- Tek dosya: `pergel/index.html` (three.js r128; DWG için `pergel/dwg/`). Kaynak ile yayın aynı dosyadır; düzenleme doğrudan bu dosyada yapılır.
- Her değişiklikten sonra: `python3 damga.py`, commit, push. Kullanıcıya kısa, Türkçe, teknik olmayan özet.
- Büyük işlerde önce plan sun, onay al. Küçük adımlarla ilerle; her adımı tarayıcıda dene.
- DİKKAT: damga.py '<meta name="surum"...>' metnini her yerde değiştirir; JS içinde bu metni düz yazma ('<'+'meta' gibi böl).
- Sürüm/dağıtım: damga.py + commit + push, sonra Claude artifact (slug 09b60b75-f288-47c3-afa2-fbb897322523) güncelle (önce get_artifact ile base_version al).
- Test: /home/claude/work (t3.py: setup/ev/clickW; Playwright + yerel three/occt-wasm; sunucu 8765). Eklenti: pergel/claude/ (tfAI değişince help.js yeniden üret + build.py).
- Haftalık kullanım sınırı kısıtlı: tek oturumda tek iş; büyük işte önce kısa plan.

### BEKLEYEN İŞLER (sırayla; yeni oturum BURADAN başlar, 28.11.2026)
1. YAKINLAŞTIRMA HIZI — KISMEN YAPILDI (28.11.2026, 89d6519): gezinirken gölge haritası yeniden çizilmez (NAVT, 230 ms sonra tam kalite), yavaş karede 1x çözünürlük, sıfır noktası kayması (checkOrigin) eşik 4000×V.d + 900 ms + gezinirken ertelenir, Alana yakınlaştır (araç zoomwin, Alt+sürükle, S.zwNext). KALAN: kullanıcının gerçek ağır dosyasıyla ölçüm (rebuildAll maliyeti, ghost/fat çizgi geçişi); yeterli değilse sıfır noktası kaymasını rebuildAll'suz yap. Claude artifact henüz güncellenmedi.
2. BİSİKLET/TARİF YETENEKLERİ (plan sunuldu, "Devam" bekliyor): iki nokta arası boru/çubuk, döndür A açı 90 eksen y, silindir/simit için eksen x|y|z, yapay zekâ talimatına bölüm + tam bisiklet örneği; pergel-tarif becerisi ve eklenti help.js/mcpb güncelle; πr²L hacim testi.
3. REFERANS DÜZLEM + HİZALAMA (plan sunuldu, onay bekliyor): yüzden öteleme/3 nokta/iki yüz ortası/kenar etrafında açılı düzlem + eksen; Hizala aracı (yüz yüze, paralel, dik, eşmerkezli, mesafe, açı); tarif komutları düzlem/hizala.
4. Kısadan uzuna: salt okunur paylaşma bağlantısı; işlem geçmişi/nesne ağacı; hakediş (önce araştır); inşaat ayrı çalışma alanı (+donatı metrajı, sonra FEM) — kullanıcı "sonra ayrıca değerlendirelim" dedi.
5. Kullanıcıda: Claude masaüstü eklentisi ilk denemesi (Diğer › Claude ile çiz).

### Biten büyük başlıklar (ayrıntı YAPILANLAR.md): sulama, kot/eğim/tesviye/şev, proje seti PDF+antet, sunum/tur, tariften çiz (A-L: yapı taşları, katı/2B komutlar, düzenleme, kısıtlar), OCCT kesin motor, kenar/yüz seçimi (N), bölge it/çek, çalışma dosyası, kayıt koruma, Claude eklentisi + #tz= bağlantı.
