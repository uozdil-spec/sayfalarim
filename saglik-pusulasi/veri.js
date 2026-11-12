/* Sağlık Pusulası · veriler: yemek listesi, hareketler, sağlıklı yaşam bilgileri, kılavuz  (by uozdil)
   Yemek satırı: ad|porsiyon|kcal|protein g|yağ g|karbonhidrat g  — değerler ortalama, yaklaşık değerlerdir. */
var SP = window.SP = window.SP || {};
SP.YEMEK_KAT = [
['Kahvaltılık', `Beyaz ekmek|1 dilim (25 g)|66|2|0.8|12.5
Tam buğday ekmeği|1 dilim (25 g)|62|2.7|0.9|11
Simit|1 adet (100 g)|290|9|8|46
Poğaça (sade)|1 adet (70 g)|260|5|14|28
Açma|1 adet (80 g)|300|6|14|37
Peynirli börek|1 dilim (120 g)|330|11|18|30
Su böreği|1 dilim (150 g)|360|14|18|35
Gözleme (peynirli)|1 adet (200 g)|450|16|18|55
Menemen|1 porsiyon (200 g)|220|11|16|8
Haşlanmış yumurta|1 adet|78|6.3|5.3|0.6
Sahanda yumurta|1 adet|110|6.5|9|0.6
Omlet (2 yumurtalı)|1 porsiyon|220|13|18|1.5
Sucuklu yumurta|1 porsiyon|330|17|28|2
Beyaz peynir|1 dilim (30 g)|80|5|6.5|0.5
Kaşar peyniri|1 dilim (25 g)|88|6.5|6.8|0.4
Lor peyniri|2 yemek kaşığı (50 g)|45|6.5|1.5|1.5
Zeytin|5 adet (20 g)|35|0.2|3.6|0.6
Tereyağı|1 tatlı kaşığı (5 g)|37|0|4.1|0
Kaymak|1 yemek kaşığı (20 g)|110|0.6|12|0.6
Bal|1 tatlı kaşığı (10 g)|30|0|0|8.2
Reçel|1 tatlı kaşığı (10 g)|26|0|0|6.5
Tahin-pekmez|1 yemek kaşığı (20 g)|95|2|5.5|9.5
Fıstık ezmesi|1 yemek kaşığı (16 g)|95|4|8|3
Sucuk|3 dilim (30 g)|135|6|12|0.5
Yulaf ezmesi (sütlü)|1 kase|250|10|7|36
Kahvaltılık gevrek (sütlü)|1 kase|220|7|4|38
Domates-salatalık söğüş|1 porsiyon|25|1|0.2|5
Tost (kaşarlı)|1 adet|300|13|13|32
Karışık tost|1 adet|380|17|19|33`],
['Çorba', `Mercimek çorbası|1 kase (250 ml)|150|8|4|21
Ezogelin çorbası|1 kase (250 ml)|140|6|4|21
Yayla çorbası|1 kase (250 ml)|130|5|5|16
Tarhana çorbası|1 kase (250 ml)|120|4|3.5|18
Domates çorbası|1 kase (250 ml)|110|3|4.5|15
Şehriyeli tavuk çorbası|1 kase (250 ml)|110|7|3|13
Sebze çorbası|1 kase (250 ml)|90|3|3|13
İşkembe çorbası|1 kase (250 ml)|170|14|9|7
Kelle paça|1 kase (250 ml)|230|18|16|3`],
['Et, tavuk, balık', `Izgara köfte|1 porsiyon (4 adet)|300|22|21|6
Izgara tavuk göğsü|1 porsiyon (150 g)|250|46|5.5|0
Fırında tavuk but|1 adet (150 g)|300|32|18|0
Tavuk sote|1 porsiyon (200 g)|280|30|14|8
Tavuk şiş|1 porsiyon (150 g)|255|38|10|2
Kuzu şiş|1 porsiyon (150 g)|370|32|26|1
Adana / Urfa kebap|1 porsiyon (150 g)|420|28|33|2
İskender|1 porsiyon|750|38|45|45
Et döner (porsiyon)|100 g et|280|22|21|1
Tavuk döner (porsiyon)|100 g et|215|25|12|2
Et sote / güveç|1 porsiyon (200 g)|340|28|22|7
İzmir köfte (patatesli)|1 porsiyon|380|20|22|24
Karnıyarık|1 adet|320|12|24|14
Musakka|1 porsiyon|260|11|18|13
Etli dolma|2 adet|260|12|12|26
Mantı (yoğurtlu)|1 porsiyon|480|19|18|60
İçli köfte|1 adet|200|8|10|20
Izgara levrek / çipura|1 porsiyon (200 g)|260|40|10|0
Izgara somon|1 porsiyon (150 g)|310|33|19|0
Hamsi tava|1 porsiyon (150 g)|330|26|19|12
Ton balığı (yağda, süzülmüş)|1 küçük kutu (80 g)|150|20|7.5|0
Ton balığı (suda, light)|1 küçük kutu (80 g)|90|20|1|0`],
['Hamur işi ve hazır yemek', `Lahmacun|1 adet|270|11|9|36
Kıymalı pide|1 porsiyon|620|28|24|72
Kaşarlı pide|1 porsiyon|650|26|28|72
Tavuk döner dürüm|1 adet|480|30|17|50
Et döner dürüm|1 adet|560|28|26|50
Çiğ köfte (etsiz)|1 porsiyon (100 g)|190|5|4|34
Çiğ köfte dürüm|1 adet|380|9|8|68
Balık ekmek|1 adet|420|24|16|44
Sandviç (peynirli)|1 adet|320|13|12|40
Ton balıklı sandviç|1 adet|350|20|13|38
Hamburger|1 adet|500|25|25|42
Tavuk burger|1 adet|450|22|20|45
Pizza|1 dilim|270|11|10|33
Patates kızartması|1 porsiyon (120 g)|370|4|18|46
Kumpir|1 adet|650|16|30|78`],
['Sebze ve baklagil', `Kuru fasulye|1 porsiyon (200 g)|280|15|9|36
Etli nohut|1 porsiyon (200 g)|300|16|10|36
Yeşil mercimek yemeği|1 porsiyon (200 g)|250|14|6|34
Barbunya pilaki|1 porsiyon|220|9|8|28
Zeytinyağlı taze fasulye|1 porsiyon|140|3|9|12
Bamya|1 porsiyon|130|3|8|11
Ispanak yemeği|1 porsiyon|130|5|7|11
Kabak yemeği|1 porsiyon|120|3|7|11
Türlü (etsiz)|1 porsiyon|180|5|10|18
İmam bayıldı|1 adet|220|3|17|14
Zeytinyağlı biber dolması|2 adet|220|4|9|31
Zeytinyağlı yaprak sarma|5 adet|190|3|8|26
Mücver|2 adet|200|6|13|15
Haşlanmış sebze|1 porsiyon|70|3|0.5|13`],
['Pilav ve makarna', `Pirinç pilavı|1 porsiyon (150 g)|260|4.5|7|44
Bulgur pilavı|1 porsiyon (150 g)|200|5.5|5|33
Makarna (sade)|1 porsiyon (200 g)|280|9|4|52
Makarna (domates soslu)|1 porsiyon|330|10|8|54
Erişte|1 porsiyon|300|9|7|50
Kısır|1 porsiyon (150 g)|230|5|8|35
Patates püresi|1 porsiyon|180|4|7|26
Haşlanmış patates|1 orta boy (150 g)|130|3|0.2|30`],
['Salata, yoğurt, süt', `Çoban salata (yağlı)|1 porsiyon|110|2|8|8
Mevsim salata (yağlı)|1 porsiyon|90|2|6|8
Tavuklu sezar salata|1 porsiyon|350|25|20|15
Yeşil salata (yağsız)|1 porsiyon|25|1.5|0.3|4.5
Roka salatası (yağlı)|1 porsiyon|90|2|8|3
Gavurdağı salatası|1 porsiyon|190|3|16|9
Ton balıklı salata|1 porsiyon|250|22|14|9
Izgara tavuklu salata|1 porsiyon|280|30|13|10
Hellimli salata|1 porsiyon|300|14|23|9
Beyaz peynirli Akdeniz salatası|1 porsiyon|220|8|17|9
Piyaz (fasulye salatası)|1 porsiyon|230|9|11|24
Mercimek salatası|1 porsiyon|220|11|8|27
Nohutlu salata|1 porsiyon|240|9|11|27
Kinoalı salata|1 porsiyon|260|8|11|32
Makarna salatası|1 porsiyon|290|7|14|34
Patates salatası|1 porsiyon|210|3.5|10|27
Yoğurtlu semizotu|1 porsiyon|110|5|6|9
Havuç-lahana salatası|1 porsiyon|80|1.5|5|8
Rus (Amerikan) salatası|2 yemek kaşığı (60 g)|130|1.5|11|6
Cacık|1 kase|90|5|4.5|7
Yoğurt (tam yağlı)|1 kase (200 g)|130|7.5|7|10
Yoğurt (yarım yağlı)|1 kase (200 g)|100|8|3.5|10
Süzme yoğurt|3 yemek kaşığı (100 g)|100|9|5|4
Haydari|2 yemek kaşığı|90|4|7|3
Humus|2 yemek kaşığı (60 g)|150|5|10|10
Ayran|1 bardak (200 ml)|75|3.5|4|5.5
Süt (tam yağlı)|1 bardak (200 ml)|125|6.5|7|9.5
Süt (yarım yağlı)|1 bardak (200 ml)|95|6.5|3.2|9.6
Kefir|1 bardak (200 ml)|110|6.5|6|8
Meyveli yoğurt|1 kap (125 g)|120|4|3|19
Zeytinyağı|1 yemek kaşığı (10 g)|90|0|10|0`],
['Meyve', `Elma|1 orta boy|80|0.4|0.3|21
Muz|1 orta boy|105|1.3|0.4|27
Portakal|1 orta boy|65|1.2|0.2|16
Mandalina|1 adet|40|0.6|0.2|10
Armut|1 orta boy|95|0.6|0.2|25
Şeftali|1 orta boy|60|1.4|0.4|14
Kayısı|3 adet|50|1.5|0.4|11.5
Üzüm|1 küçük salkım (100 g)|70|0.7|0.2|18
Çilek|1 kase (150 g)|50|1|0.5|11.5
Kiraz|1 kase (120 g)|75|1.3|0.2|19
Karpuz|1 dilim (300 g)|90|1.8|0.5|22
Kavun|1 dilim (200 g)|70|1.6|0.4|16
Taze incir|2 adet|75|0.8|0.3|19
Nar|yarım|80|1.5|1|18
Kuru kayısı|4 adet (30 g)|72|1|0.2|19
Hurma|3 adet (24 g)|68|0.6|0.1|18
Kuru üzüm|1 avuç (30 g)|90|0.9|0.1|24
Kuru incir|2 adet (30 g)|75|1|0.3|19
Kuru erik|4 adet (30 g)|72|0.7|0.1|19`],
['Kuruyemiş', `Ceviz|3 tam (15 g)|98|2.3|9.8|2
Badem|10 adet (12 g)|70|2.5|6|2.6
Fındık|10 adet (12 g)|75|1.8|7.3|2
Antep fıstığı (iç)|1 avuç (25 g)|140|5|11|7
Ay çekirdeği (iç)|1 avuç (30 g)|175|6|15|6
Leblebi|1 avuç (30 g)|110|6|2|18
Kabak çekirdeği (iç)|1 avuç (25 g)|145|7.5|12|2.5
Kaju|1 avuç (25 g)|145|4.5|11|7.5
Yer fıstığı|1 avuç (25 g)|150|6.5|12.5|4`],
['Tatlı ve atıştırmalık', `Baklava|1 dilim (40 g)|170|2.5|10|18
Künefe|1 porsiyon|420|9|22|48
Sütlaç|1 kase|240|6|6|40
Kazandibi|1 porsiyon|250|6|6|43
Revani|1 dilim|300|4|10|48
Aşure|1 kase|280|5|4|58
Tahin helvası|1 dilim (40 g)|210|5|12|21
Lokum|2 adet|80|0|0|20
Dondurma|1 top (50 g)|105|2|5.5|12
Kek|1 dilim (60 g)|230|3.5|10|32
Bisküvi / kurabiye|3 adet (30 g)|140|2|6|20
Sütlü çikolata|4 kare (25 g)|135|2|8|14.5
Bitter çikolata|4 kare (25 g)|140|2|10.5|11
Gofret|1 adet (35 g)|180|2.5|10|21
Cips|1 küçük paket (40 g)|215|2.5|14|21
Patlamış mısır|1 kase (30 g)|130|3|6|17
Kraker|1 küçük paket (40 g)|190|4|8|26
Galeta|2 adet (20 g)|80|2.5|1.5|14
Grissini|4 adet (20 g)|85|2.5|2|14
Protein bar|1 adet (45 g)|180|15|6|17
Puding|1 kase|160|4|4.5|26
Muhallebi|1 kase|200|5|5|34
Profiterol|1 porsiyon|330|6|18|36`],
['İçecek', `Çay (şekersiz)|1 bardak|1|0|0|0
Çay (1 şekerli)|1 bardak|12|0|0|3
Yeşil çay (şekersiz)|1 fincan|2|0|0|0.3
Ihlamur (şekersiz)|1 fincan|2|0|0|0.4
Adaçayı (şekersiz)|1 fincan|2|0|0|0.4
Papatya çayı (şekersiz)|1 fincan|2|0|0|0.4
Kuşburnu çayı (şekersiz)|1 fincan|3|0|0|0.7
Nane-limon (şekersiz)|1 fincan|3|0|0|0.7
Rezene çayı (şekersiz)|1 fincan|2|0|0|0.4
Zencefilli bitki çayı (şekersiz)|1 fincan|3|0|0|0.6
Bitki çayı (1 tatlı kaşığı ballı)|1 fincan|32|0|0|8.6
Türk kahvesi (sade)|1 fincan|5|0.2|0.2|0.5
Türk kahvesi (orta)|1 fincan|25|0.2|0.2|5.5
Türk kahvesi (şekerli)|1 fincan|40|0.2|0.2|9.5
Filtre kahve (sade)|1 fincan|3|0.3|0|0
Sütlü kahve (latte)|1 orta boy|140|8|7|11
Cappuccino|1 orta boy|110|6|6|8
Americano (sade)|1 orta boy|5|0.3|0|0.5
Sıcak çikolata|1 fincan (200 ml)|190|7|7|25
Hazır kahve (3'ü 1 arada)|1 paket|75|0.5|2|13
Kesme şeker|1 adet|12|0|0|3
Taze portakal suyu|1 bardak (200 ml)|90|1.4|0.4|21
Hazır meyve suyu|1 bardak (200 ml)|95|0.5|0|23
Gazlı içecek (şekerli)|1 kutu (330 ml)|140|0|0|35
Gazlı içecek (şekersiz)|1 kutu (330 ml)|1|0|0|0
Limonata|1 bardak (200 ml)|100|0|0|25
Soğuk çay (şekerli)|1 kutu (330 ml)|100|0|0|25
Enerji içeceği|1 kutu (250 ml)|115|0|0|28
Şalgam suyu|1 bardak (200 ml)|15|0.5|0|3
Maden suyu (sade)|1 şişe|0|0|0|0
Salep|1 fincan|190|6|5|30
Boza|1 bardak|240|2|0.5|55
Bira|1 şişe (330 ml)|140|1|0|11
Şarap|1 kadeh (150 ml)|125|0|0|4
Rakı|1 tek (35 ml)|87|0|0|0`]
];
SP.YEMEKLER = [];
SP.YEMEK_KAT.forEach(function (k) {
  k[1].split('\n').forEach(function (s) {
    var a = s.split('|');
    SP.YEMEKLER.push({ n: a[0], por: a[1], kcal: +a[2], p: +a[3], f: +a[4], c: +a[5], kat: k[0] });
  });
});

/* Hareketler: ad, MET değeri (1 kg için saatte yakılan kcal) */
SP.HAREKET = [
['Yürüyüş (normal tempo)', 3.5], ['Tempolu yürüyüş', 4.3], ['Hafif koşu', 7], ['Koşu', 9.8],
['Bisiklet (gezinti)', 4], ['Bisiklet (tempolu)', 6.8], ['Yüzme', 6], ['Ağırlık / fitness', 3.5],
['Pilates / yoga', 2.8], ['Evde egzersiz', 3.8], ['Futbol / basketbol', 7], ['Tenis', 7.3],
['Dans / halk oyunları', 5], ['Merdiven çıkma', 8], ['İp atlama', 11], ['Ev işi', 3.3], ['Bahçe işi', 3.8]
];

SP.BILGI_KAT = ['Beslenme', 'Su', 'Hareket', 'Uyku', 'Kilo', 'Zihin', 'Alışkanlık', 'Kontrol'];
SP.BILGI = [
['Beslenme', 'Tabağın yarısı sebze', 'Tabağınızın yarısını sebze ve salataya, çeyreğini proteine (et, tavuk, balık, yumurta, baklagil), kalan çeyreğini tam tahıla ayırın. Hesap yapmadan dengeli yemenin en kolay yolu budur.'],
['Beslenme', 'Günde beş porsiyon', 'Dünya Sağlık Örgütü günde en az 400 gram, yani yaklaşık beş porsiyon sebze ve meyve önerir. Patates gibi nişastalı kökler bu hesaba girmez.'],
['Beslenme', 'Tuz: günde bir çay kaşığı', 'Günlük tuz 5 gramın altında kalmalı. Tuzun çoğu sofradaki tuzluktan değil; ekmek, peynir, zeytin, turşu, salam-sucuk ve hazır yemeklerden gelir.'],
['Beslenme', 'Eklenmiş şekeri azaltın', 'Eklenmiş şeker günlük enerjinin %10’unu geçmemeli; 2000 kcal için bu yaklaşık 50 gramdır. Tek kutu şekerli gazlı içecekte 35 gram kadar şeker vardır.'],
['Beslenme', 'Lif tok tutar', 'Yetişkinler için günde 25–30 gram lif önerilir. Kuru baklagiller, bulgur, yulaf, tam buğday ekmeği, sebze ve kabuğuyla yenen meyveler en iyi kaynaklardır.'],
['Beslenme', 'Her öğünde protein', 'Yumurta, yoğurt, peynir, baklagil, et, tavuk veya balık gibi bir protein kaynağı öğünü daha doyurucu yapar ve kilo verirken kasın korunmasına yardım eder.'],
['Beslenme', 'Yağın türü önemli', 'Zeytinyağı, fındık, ceviz ve balıktaki yağlar kalp dostudur. Doymuş yağı (tereyağı, yağlı et, kaymak) sınırlı tutun; trans yağ içeren paketli ürünlerden uzak durun.'],
['Beslenme', 'Haftada iki kez balık', 'Haftada iki öğün balık, biri hamsi, sardalya, somon gibi yağlı balık olmak üzere, kalp ve damar sağlığı için yaygın bir öneridir. Izgara ve fırın, kızartmaya tercih edilir.'],
['Beslenme', 'Baklagil haftada üç kez', 'Kuru fasulye, nohut ve mercimek hem protein hem lif içerir, ucuzdur ve uzun süre tok tutar. Bulgur pilavıyla birlikte tam bir öğündür.'],
['Beslenme', 'Tam tahılı seçin', 'Beyaz ekmek ve pirinç yerine tam buğday, çavdar, bulgur ve yulafı tercih edin. Kan şekerini daha yavaş yükseltir, tokluk süresini uzatır.'],
['Beslenme', 'Yavaş yiyin', 'Tokluk sinyalinin beyne ulaşması yaklaşık 20 dakika sürer. Lokmaları iyi çiğneyin, çatalı ara ara bırakın; daha az yiyerek doyarsınız.'],
['Beslenme', 'İçtiğiniz kaloriyi unutmayın', 'Meyve suyu, şekerli kahve ve gazlı içecekler doyurmadan kalori verir. Meyveyi sıkmak yerine bütün olarak yemek hem lif kazandırır hem daha tok tutar.'],
['Beslenme', 'Etiket okuma', '100 gramında 5 gram ve altı şeker olan ürün düşük, 22,5 gramdan fazlası yüksek şekerli sayılır. İçindekiler listesi çoktan aza doğru sıralanır; ilk üç maddeye bakın.'],
['Beslenme', 'İşlenmiş eti seyrek tüketin', 'Sucuk, salam, sosis ve pastırma gibi işlenmiş etleri her güne değil, ara sıra tüketilecek yiyecekler olarak düşünün.'],
['Su', 'Ne kadar su?', 'İhtiyaç kiloya, havaya ve harekete göre değişir. Pratik bir ölçü, kilogram başına yaklaşık 30 ml’dir. Program hedefinizi buna göre hesaplar.'],
['Su', 'En basit gösterge', 'İdrar renginiz açık saman sarısıysa yeterince su içiyorsunuz. Koyu sarı renk daha fazla sıvıya ihtiyacınız olduğunu gösterir.'],
['Su', 'Susamayı beklemeyin', 'Susuzluk hissi geldiğinde vücut çoktan su kaybetmiştir. Sıcak havada, sporda ve ateşli hastalıkta su ihtiyacı belirgin biçimde artar.'],
['Su', 'Açlık mı, susuzluk mu?', 'Susuzluk bazen açlık gibi hissedilir. Ara öğünden önce bir bardak su içip on dakika bekleyin; istek geçebilir.'],
['Su', 'Güne suyla başlayın', 'Uyanınca bir bardak, her öğünden önce bir bardak su içmek günlük hedefin yarısını kendiliğinden tamamlar. Masanızda görünür bir şişe bulundurun.'],
['Su', 'Çay ve kahve', 'Çay ve kahve de sıvı alımına katkı sağlar, ama temel içeceğiniz su olsun. Sağlıklı yetişkinler için günde 400 mg’a kadar kafein (3–4 fincan filtre kahve) genellikle güvenli kabul edilir; hamilelikte sınır 200 mg’dır.'],
['Su', 'Özel durumlar', 'Kalp yetmezliği veya böbrek hastalığı olanlar günlük sıvı miktarını doktorlarının önerisine göre ayarlamalıdır.'],
['Hareket', 'Haftalık hedef', 'Dünya Sağlık Örgütü yetişkinlere haftada 150–300 dakika orta tempolu (tempolu yürüyüş, bisiklet) ya da 75–150 dakika yüksek tempolu hareket önerir.'],
['Hareket', 'Haftada iki gün kuvvet', 'Kol, bacak, sırt ve karın kaslarını çalıştıran egzersizleri haftada en az iki gün yapın. Kas kütlesi, dinlenirken harcanan kaloriyi ve ileri yaşta bağımsızlığı korur.'],
['Hareket', 'Konuşma testi', 'Orta tempoda konuşabilir ama şarkı söyleyemezsiniz. Yüksek tempoda birkaç kelimeden sonra nefes almak gerekir. Temponuzu böyle ayarlayın.'],
['Hareket', 'Oturmayı bölün', 'Uzun süre kesintisiz oturmak, spor yapsanız bile sağlığa zarar verir. Her 30–60 dakikada kalkıp birkaç dakika yürüyün veya esneyin.'],
['Hareket', 'On bin şart değil', 'Günde 7.000–8.000 adım bile belirgin sağlık yararı sağlar. Önemli olan bugünkü sayınızı biraz artırmaktır; her ek adım kazançtır.'],
['Hareket', 'On dakikayla başlayın', 'Yeni başlıyorsanız günde 10 dakikalık yürüyüşle başlayıp her hafta birkaç dakika ekleyin. Düzenli az hareket, ara sıra yapılan yoğun spordan daha değerlidir.'],
['Hareket', 'Günlük fırsatlar', 'Merdiveni kullanın, bir durak önce inin, telefonla konuşurken yürüyün, kısa mesafelere bisikletle gidin. Bunlar gün sonunda ciddi bir toplam eder.'],
['Hareket', 'Isınma ve soğuma', 'Egzersize 5–10 dakika hafif tempoyla başlayın ve aynı şekilde bitirin. Sakatlanma riskini azaltır, toparlanmayı kolaylaştırır.'],
['Hareket', 'Denge çalışması', '65 yaş üstünde haftada üç gün denge ve kuvvet egzersizi düşme riskini azaltır. Tek ayak üstünde durmak, topuk-parmak yürüyüşü basit başlangıçlardır.'],
['Hareket', 'Doktora danışın', 'Kalp hastalığı, yüksek tansiyon, diyabet veya eklem sorununuz varsa ya da uzun süredir hareketsizseniz yoğun egzersize başlamadan önce doktorunuza danışın.'],
['Uyku', 'Yedi ile dokuz saat', 'Yetişkinlerin çoğu gecede 7–9 saat uykuya ihtiyaç duyar. Düzenli olarak 6 saatin altında uyumak kilo alımı, yüksek tansiyon ve diyabet riskini artırır.'],
['Uyku', 'Aynı saat', 'Hafta sonu dahil her gün benzer saatlerde yatıp kalkmak, uyku kalitesini en çok iyileştiren alışkanlıktır.'],
['Uyku', 'Az uyku, çok iştah', 'Uykusuz geçen gecenin ertesinde açlık hormonu artar, tokluk hormonu azalır; tatlı ve yağlı yiyeceklere istek yükselir.'],
['Uyku', 'Ekranı erken kapatın', 'Yatmadan bir saat önce telefon ve televizyonu bırakın. Parlak ekran ışığı uyku hormonunun salgısını geciktirir.'],
['Uyku', 'Kafein saati', 'Kafeinin etkisi 5–6 saat sürer. Uykuya dalmakta zorlanıyorsanız öğleden sonra çay ve kahveyi azaltın.'],
['Uyku', 'Serin ve karanlık oda', 'Yatak odasının serin, sessiz ve karanlık olması uykuya dalmayı kolaylaştırır. Yatmadan 2–3 saat önce ağır yemek yememeye çalışın.'],
['Uyku', 'Horlama ve yorgunluk', 'Yüksek sesli horlama, uykuda nefes durması ve gündüz aşırı uyku hali varsa uyku apnesi açısından doktora başvurun.'],
['Kilo', 'Güvenli hız', 'Haftada 0,5–1 kilo vermek sağlıklı ve kalıcı kabul edilir. Daha hızlı kayıplar çoğunlukla su ve kas kaybıdır ve geri alınır.'],
['Kilo', 'Basit hesap', 'Yaklaşık 7.700 kcal bir kilo vücut yağına karşılık gelir. Günde 500 kcal açık, haftada yarım kilo civarında kayıp demektir.'],
['Kilo', 'Yüzde beş bile yeter', 'Kilonuzun %5–10’unu vermek bile tansiyon, kan şekeri ve kolesterol değerlerinde anlamlı iyileşme sağlar.'],
['Kilo', 'Doğru tartılma', 'Haftada bir iki kez, sabah aç karnına ve aynı tartıda tartılın. Gün içinde 1–2 kiloluk oynama su kaynaklıdır, normaldir. Tek ölçüme değil, eğilime bakın.'],
['Kilo', 'Bel çevresi', 'Bel çevresi karın yağını gösterir. Erkeklerde 94 cm, kadınlarda 80 cm üzeri artmış; 102 cm ve 88 cm üzeri yüksek risk sayılır.'],
['Kilo', 'Vücut kitle indeksi', '18,5–24,9 arası normal, 25–29,9 fazla kilolu, 30 ve üzeri obezite olarak sınıflanır. Çok kaslı kişilerde ve ileri yaşta yanıltıcı olabilir.'],
['Kilo', 'Şok diyetlerden uzak durun', 'Kadınlarda günde 1.200, erkeklerde 1.500 kcal altındaki diyetler doktor ve diyetisyen gözetimi olmadan önerilmez. Program hedefinizi bu sınırların altına düşürmez.'],
['Kilo', 'Duraklama normaldir', 'Kilo verirken birkaç hafta süren duraklamalar olağandır. Kayıtlarınızı gözden geçirin, hareketi biraz artırın ve sabırlı olun.'],
['Kilo', 'Öğün atlamayın', 'Öğün atlamak bir sonraki öğünde fazla yemeye yol açar. Öğünü atlamak yerine porsiyonu küçültmek daha sürdürülebilirdir.'],
['Zihin', 'Açlık mı, duygu mu?', 'Fiziksel açlık yavaş gelir ve her yemekle geçer. Duygusal açlık aniden gelir ve belirli bir yiyeceği ister. Yemeden önce kendinize “gerçekten aç mıyım?” diye sorun.'],
['Zihin', 'Dört-altı nefesi', 'Dört saniyede burundan nefes alın, altı saniyede yavaşça verin. Birkaç dakika boyunca tekrarlamak kalp atışını yavaşlatır ve gerginliği azaltır.'],
['Zihin', 'Doğada vakit', 'Haftada toplam iki saat kadar park, orman veya deniz kenarında vakit geçirmek ruh halini iyileştirir. Yürüyüşünüzü yeşil bir alanda yapın.'],
['Zihin', 'İnsanlarla bağ', 'Aile ve arkadaşlarla düzenli görüşmek sağlığı en az beslenme ve hareket kadar etkiler. Yürüyüşe birini davet edin; ikisini birden kazanırsınız.'],
['Zihin', 'Kendinize sert davranmayın', 'Bir günlük fazla yemek haftanızı bozmaz. Suçluluk duymak yerine bir sonraki öğünde normal düzeninize dönün.'],
['Zihin', 'Sigarayı bırakmak', 'Sigarayı bırakmak her yaşta fayda sağlar; ilk yıl içinde kalp krizi riski belirgin biçimde düşer. ALO 171 Sigara Bırakma Danışma Hattı ücretsiz destek verir.'],
['Zihin', 'Alkol', 'Dünya Sağlık Örgütü’ne göre alkolün sağlık açısından güvenli bir miktarı yoktur; ne kadar az, o kadar iyi. Alkol ayrıca kalorisi yüksek bir içecektir.'],
['Zihin', 'Yardım istemek', 'İki haftadan uzun süren mutsuzluk, isteksizlik, uyku ve iştah değişikliği varsa bir hekime veya ruh sağlığı uzmanına başvurmak güçlü bir adımdır.'],
['Alışkanlık', 'Küçük başlayın', 'Büyük hedefler yerine her gün yapabileceğiniz küçük bir adım seçin: yemekten sonra on dakika yürümek gibi. Küçük adımlar kalıcı olur.'],
['Alışkanlık', 'Mevcut alışkanlığa ekleyin', 'Yeni davranışı zaten yaptığınız bir şeye bağlayın: “Sabah çayını koyunca bir bardak su içerim.”'],
['Alışkanlık', 'Ortamı düzenleyin', 'Meyveyi tezgâhta, abur cuburu gözden uzak tutun. Görünen yenir; irade yerine düzen kurun.'],
['Alışkanlık', 'Tok karnına alışveriş', 'Markete listeyle ve tok gidin. Aç yapılan alışverişte sepete giren paketli ürünler belirgin biçimde artar.'],
['Alışkanlık', 'Küçük tabak', 'Daha küçük tabak ve kase kullanmak porsiyonu fark ettirmeden küçültür. Yemeği tencereden değil, tabağa alarak yiyin.'],
['Alışkanlık', 'Kayıt tutmak işe yarar', 'Yediklerini düzenli kaydeden kişiler daha fazla kilo verir ve daha iyi korur. Yedikten hemen sonra kaydedin; akşama bırakınca unutulur.'],
['Alışkanlık', 'Ev yemeği', 'Evde pişen yemekte yağı, tuzu ve porsiyonu siz belirlersiniz. Hafta sonu çorba ve baklagil pişirip porsiyonlamak hafta içini kolaylaştırır.'],
['Alışkanlık', 'Ekran başında yemeyin', 'Televizyon veya telefon karşısında yerken ne kadar yediğinizi fark etmezsiniz. Yemeği sofrada, dikkatinizi vererek yiyin.'],
['Kontrol', 'Tansiyonunuzu bilin', '120/80 mmHg ve altı ideal kabul edilir. Tekrarlanan ölçümlerde 140/90 ve üzeri çıkıyorsa doktora başvurun. Ölçümden önce beş dakika oturarak dinlenin.'],
['Kontrol', 'Düzenli kontrol', 'Şikâyetiniz olmasa da aile hekiminizle yılda bir kez kan şekeri, kolesterol ve tansiyon kontrolünü konuşun. Yaşa göre önerilen taramaları sorun.'],
['Kontrol', 'Ağız ve diş', 'Dişlerinizi günde iki kez, iki dakika florürlü macunla fırçalayın ve diş ipi kullanın. Diş eti hastalığı kalp sağlığıyla da ilişkilidir.'],
['Kontrol', 'Güneşten korunma', 'Yazın 11.00–16.00 arasında gölgede kalın, en az 30 faktörlü güneş kremi kullanın. Değişen veya yeni çıkan benleri doktora gösterin.'],
['Kontrol', 'Acil belirtiler', 'Göğüs ağrısı, ani nefes darlığı, yüzde kayma, kolda güçsüzlük veya konuşma bozukluğu olursa beklemeyin, hemen 112’yi arayın.'],
['Kontrol', 'Bu program doktor değildir', 'Buradaki hesaplar sağlıklı yetişkinler için genel bilgidir. Hamilelik, emzirme, diyabet, böbrek hastalığı gibi durumlarda beslenme planınızı hekim ve diyetisyenle belirleyin.']
];

SP.KILAVUZ = [
['Başlarken', 'Profilinizi açın, boy, kilo, yaş, cinsiyet ve hareket düzeyinizi girin. Program günlük kalori ihtiyacınızı ve hedefinizi kendisi hesaplar.'],
['Öğün eklemek', 'Bugün ekranında öğünün yanındaki Ekle düğmesine dokunun. Yemeği arayın ya da listeden seçin, porsiyonu artı-eksi ile ayarlayın. Listede yoksa “Kendi yemeğim” ile adını ve kalorisini yazın.'],
['Halka ne gösterir?', 'Ortadaki sayı bugün yiyebileceğiniz kalan kaloridir. Halka yeşilken yoldasınız, sarı hedefi biraz aştığınızı, kırmızı belirgin fazlalığı gösterir.'],
['Uyarılar', 'Hedefin çok üstüne çıktığınızda ya da gün sonunda çok az yediğinizde program sizi uyarır ve seçenek sunar. Çok az yemek de fazla yemek kadar zararlıdır.'],
['Su ve hareket', 'Her bardak su için bardak simgesine dokunun. Yaptığınız hareketi süresiyle ekleyin; yakılan kalori günlük hakkınıza eklenir.'],
['Kilo takibi', 'İlerleme ekranından haftada bir iki kez kilonuzu girin. Grafik eğilimi gösterir, hedefleriniz yeni kilonuza göre güncellenir.'],
['Geçmiş günler', 'Üstteki tarihin yanındaki oklarla önceki günlere gidip kayıt ekleyebilir veya düzeltebilirsiniz.'],
['Gizlilik', 'Bilgileriniz yalnızca bu cihazda saklanır, internete gönderilmez. Profiliniz PIN ile açılır; aynı cihazı kullanan başkası sizin kayıtlarınızı göremez.'],
['Yedek almak', 'Profil ekranından ayda bir Yedek al’a dokunun ve dosyayı saklayın. Telefon değiştirirseniz ya da tarayıcı verileri silinirse Yedek yükle ile her şey geri gelir.'],
['Düğmeler', 'Sol üstteki ok bir önceki ekrana döner. Sağ üstte ipucu, müzik ve tam ekran düğmeleri bulunur. Oyun Salonu’na dönüş giriş ekranında ve Profil’in altındadır.'],
['Ekran koruması', 'OLED ekranı korumak için görüntü dakikada bir birkaç piksel kayar ve ekrana dokunmadığınızda kararır. Profil ekranından kapatabilirsiniz.']
];
SP.IPUCU = {
bugun: ['Yemeği yedikten hemen sonra kaydedin; akşama kalınca unutulur.', 'Sık yedikleriniz Ekle ekranının en üstünde çıkar.', 'Bir kayda dokunarak porsiyonunu değiştirebilir veya silebilirsiniz.', 'Bardaklara dokunarak su ekleyebilirsiniz.', 'Her öğünün ve her yemek başlığının kendi rengi vardır.', 'Üstteki oklarla dünü açıp unuttuğunuz öğünü ekleyebilirsiniz.'],
ilerleme: ['Haftada bir iki kez, sabah aç karnına tartılın.', 'Tek ölçüme değil, grafiğin gidişine bakın.', 'Yeşil kesik çizgi hedef kilonuzu gösterir.'],
bilgi: ['Üstteki başlıklara dokunarak konuyu değiştirin.', 'Her gün Bugün ekranında yeni bir bilgi çıkar.'],
profil: ['Ayda bir yedek alın; dosya telefonunuzun İndirilenler klasörüne iner.', 'Kilonuz değişince hedefler kendiliğinden güncellenir.', 'Kamera adası düğmeleri kapatıyorsa Üst boşluk ayarını artırın.']
};

/* Renk ve simge: her başlığın kendi rengi vardır */
SP.KAT_STIL = { 'Sık': ['⭐', '#6fe3b4'], 'Benim': ['📝', '#9fd0ff'], 'Kahvaltılık': ['🥐', '#f6c453'], 'Çorba': ['🍲', '#ff9d6b'], 'Et, tavuk, balık': ['🍗', '#ff7b6b'],
  'Hamur işi ve hazır yemek': ['🍕', '#f58fc0'], 'Sebze ve baklagil': ['🥦', '#7ee08a'], 'Pilav ve makarna': ['🍚', '#e8d9a8'], 'Salata, yoğurt, süt': ['🥗', '#5cc8ff'],
  'Meyve': ['🍎', '#ff8a8a'], 'Kuruyemiş': ['🥜', '#d9a86c'], 'Tatlı ve atıştırmalık': ['🍰', '#c79bff'], 'İçecek': ['☕', '#6fd6d0'] };
SP.KAT_KISA = { 'Sık': 'Sık yediklerim', 'Benim': 'Benim yemeklerim', 'Et, tavuk, balık': 'Et, tavuk, balık', 'Hamur işi ve hazır yemek': 'Hamur işi, hazır', 'Sebze ve baklagil': 'Sebze, baklagil', 'Pilav ve makarna': 'Pilav, makarna', 'Salata, yoğurt, süt': 'Salata, süt', 'Tatlı ve atıştırmalık': 'Tatlı, atıştırma' };
SP.BILGI_STIL = { 'Beslenme': ['🥗', '#7ee08a'], 'Su': ['💧', '#5cc8ff'], 'Hareket': ['🚶', '#ff9d6b'], 'Uyku': ['🌙', '#a99bff'], 'Kilo': ['⚖️', '#6fe3b4'], 'Zihin': ['🧠', '#f58fc0'], 'Alışkanlık': ['🌱', '#f6c453'], 'Kontrol': ['🩺', '#ff7b6b'] };
