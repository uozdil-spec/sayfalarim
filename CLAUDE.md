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
  yüze dikdörtgen/daire ile oyuk-çıkıntı, metraj (CSV), pafta ve Yazdır/PDF, görüntü kalitesi ayarı,
  döndürerek katı ve yol boyunca süpürme, telefonda dosya adı düğmesi, katılarda taşı/döndür/aynala/yuvarlat/ötele,
  çizim sırası = doc.entities sırası (rebuildWires aşamaları, renderOrder ORD0), bloklar (oluştur, yerleştir, yerinde düzenle, patlat; doc.blocks + 'ins' nesnesi); hazır nesneler de blok (pf_<tür>);
  blok tutamaçları + küçük menü (#insHud), kesit görünümü (#secHud, yalnızca görünüm).
- Sıradaki öneriler (sırayla):
  (öneri listesi bitti: dairesel çoğalt, ger, yayda uzat, pafta görünüşleri yapıldı). Çizim sırası (öne getir/arkaya gönder, katman için de) yapıldı. Paftada gizli çizgi ayıklama (ışın testi, sheetCollect) yapıldı. Kesit paftaya basılıyor (görünüş 'sec', kalın kesim + eğik tarama). Hazır nesneler ayrı parçalı (prefabParts, eski çizimler pfSplit ile), ağaç/çam/çalı detaylı, servi eklendi. Palmiye, söğüt ve eğik dallar eklendi (pfMesh: 'br' dal, 'fr' yaprak; mesh ne:1). Eski hazır nesneler için Özellikler'de 'Yeni modele güncelle' (pfRenew). Bitki etiketi: ins.sp (tür adı), ins.lb (etiket), insLabel flatIns içinde; metraj türe göre.
- DİKKAT: damga.py '<meta name="surum"...>' metnini her yerde değiştirir; JS içinde bu metni düz yazma ('<'+'meta' gibi böl).
- Kıyas listesi (onaylı, sırayla): 1 yeni sürüm uyarısı (#verBar, meta surum) YAPILDI; 5 her eksende döndürme YAPILDI (Döndür'de X/Y ekseni, tiltEnts: katı→mesh, eğri→poly, blok patlatılır);  2 ekranda kesit yüzü dolu/taralı YAPILDI (secCaps, capGroup); 6 kabuk YAPILDI (shell aracı, shellInner + boolRun); 3 DXF'te gerçek blok YAPILDI (BLOCKS + INSERT, wEnt; okurken üst düzey düz INSERT'ler 'ins' + doc.blocks dx_<ad> olarak korunuyor); 4 birleşik katıda yüz çekme YAPILDI (pushpull aracı: meshFace + pushPull, prizma ile birleştir/çıkar; fareyle: ppDist, tıklayınca uygular); 7 yardımcı çizgi YAPILDI (xline aracı, e.cg=1 line, ayrı katman ly.cg; pafta/DXF/metraj/extents dışı; yardimsil); 8 malzeme/doku YAPILDI (e.mat, MATS cm boyları, mkTex kodla çizilen dokular, matUV kutu izdüşümü; katı + dolu tarama); 9 YAPILDI (chamfer, pjoin, brk, match araçları); 10 çoklu pafta penceresi YAPILDI (sheetMulti, LAYS, o.lay + o.cells; her hücre sheetSVG ile wh/mg). Kıyas listesi bitti.
- 2. kıyas listesi (sıra): SketchUp için DAE dışa aktarma YAPILDI (daeString, showExport; bloklar library_nodes + instance_node); 1 metrajdan keşif YAPILDI (doc.cost[katman\u0001tür]={poz,u,p}, showTakeoff); 2 bitki listesi tablosu paftada YAPILDI (plantRows, plantTable, o.pl; sağda yer ayrılır); 3 yol boyunca dizme YAPILDI (patharr aracı, S.pt); 11 yüksek kaliteli PNG YAPILDI (exportPNG/showPNG, Dışa aktar menüsünde; saveFile Uint8Array alır); Ek: 14 yeni doku (MATS'a eklendi, toplam 22) ve kılavuz/yardım arama kutusu (addFinder) YAPILDI; 4 arazi YAPILDI (terrain aracı: terrainFrom + delaunay, çim kaplı mesh; Özellikler'de Kot satırı); Kübaj YAPILDI (cubage aracı: surfH + cubage ızgara prizma, sabit kot ya da 2. yüzey, kapalı sınır; CSV; enkesit yöntemi cubageSec + cubSecDraw, yarma/dolgu haritası cubMap); 5 güneş/gölge YAPILDI (sunstudy aracı, SUNS + sunPos + #sunHud; açıkken gölge her kalitede); 6 oklu not YAPILDI ('leader' tel tipi: pts,text,h; wirePts ok+çıkış+yazı; DXF, pafta, etiket katmanı); 7 bağlı ölçü YAPILDI (dim.la/lb=[id,anahtar], dim.lc daire; charPts/linkPt, dimLink commit'te, dimSync dirty()'de); 3B ölçü YAPILDI (dim k:'l3', dim3Frame/dim3Geom yerel düzlemde dimGeom; yazı u/v yönlü; paftada düzlemine bakan görünüşte basılır); 8 hızlı seçim YAPILDI (qselect aracı showQSel, qsKind; Özellikler'de Benzerlerini seç); 9 yayda kır + çoklu çizgi köşesinde pah YAPILDI (brkArc; chamfer poly köşe tek tık); 10 OBJ/STL/GLB YAPILDI (solidTris metre Y-yukarı; exportGLB/OBJ/STL; Dışa aktar menüsü açıklamalı liste); Kenar seçimi toleransı arttı (subTol, dokunmada daha geniş) ve yüz/kenar küçük penceresi katının ekrandaki sınırının yanına yerleşiyor (drawSub). ardından 12 paftada malzeme.
