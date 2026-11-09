/* OYUN LİSTESİ — menüye yeni oyun eklemek için buraya bir satır ekle.
   ad: görünen ad · yol: oyunun adresi (klasörse sonu / ile biter) · ikon: simge dosyası
   not: tek cümlelik açıklama · k: kategoriler (Kart, Masa, Kelime, Bulmaca, Eğlence, Online)
   on:1 → online oynanabilir, yoksa "Tek kişilik" görünür. */
window.OYUNLAR = [
    {ad:'Okey',            yol:'okey/',                 ikon:'okey/icons/icon.svg',        not:'Bilgisayara karşı ya da 4 kişi online. Reklamsız.',         k:['Masa','Online'], on:1},
    {ad:'Kart Salonu',     yol:'kart-salonu/',          ikon:'kart-salonu/icons/ikon.svg', not:'Pişti, Dost Kazığı ve Pis Yedili tek salonda.',             k:['Kart','Online'], on:1},
    {ad:'Briç',           yol:'bric/',                 ikon:'bric/icons/ikon.svg',        not:'Ortaklı briç; ihale, kolay kılavuz, ipucu. Online oyna.',   k:['Kart','Online'], on:1},
    {ad:'Batak',           yol:'batak.html',            ikon:'batak-ikon.svg',             not:'Eşli batak; arkadaşlarınla online oyna.',                   k:['Kart','Online'], on:1},
    {ad:'Tavla',           yol:'tavla.html',            ikon:'tavla-ikon.svg',            not:'Klasik tavla; arkadaşınla online oyna.',                    k:['Masa','Online'], on:1},
    {ad:'Satranç',         yol:'satranc/',              ikon:'satranc/ikon.svg',           not:'Satranç; arkadaşınla online oyna.',                         k:['Masa','Online'], on:1},
    {ad:'Dokuz Taş',       yol:'dokuz-tas.html',        ikon:'dokuz-tas-ikon.svg',         not:'Dokuz Taş; arkadaşınla online oyna.',                       k:['Masa','Online'], on:1},
    {ad:'Harf Harmanı',    yol:'harf-harmani/',         ikon:'harf-harmani/ikon.svg',      not:'Harflerden kelime üret; arkadaşlarınla çevrimiçi.',         k:['Kelime','Online'], on:1},
    {ad:'Kafes Dövüşü',    yol:'kafes-dovusu/',         ikon:'kafes-dovusu-ikon.svg',      not:'Karakterini seç; turnuva ya da serbest maç.',               k:['Eğlence','Online'], on:1},
    {ad:'Kelime Avı & Hafıza', yol:'kelime-avi-hafiza.html', ikon:'kelime-avi-ikon.svg',   not:'Kelime avı ve hafıza oyunları.',                            k:['Kelime','Bulmaca']},
    {ad:'Çini',            yol:'cini/',                 ikon:'cini/ikon.svg',              not:'İznik çinisi ve Selçuklu motifleriyle eşleştirme.',         k:['Bulmaca']},
    {ad:'Oklar',           yol:'oklar/',                ikon:'oklar/icon-192.png',         not:'Hepsini dışarı çıkar. 400 bölümlük ok labirenti.',          k:['Bulmaca']},
    {ad:'Eksik Raylar',    yol:'eksik-raylar.html',     ikon:'eksik-raylar-ikon.svg',      not:'Eksik rayları döşe, istasyondan çıkışa hattı tamamla.',     k:['Bulmaca']},
    {ad:'Sekiz Sıra',      yol:'sekizsira/',            ikon:'sekizsira/icons/icon.svg',   not:'Sekiz sıralı kart oyunu; OLED ekranlar için yanık korumalı.', k:['Kart']},
    {ad:'Burç Yorumcusu',  yol:'burc-yorumcusu.html',   ikon:'burc-ikon.svg',              not:'Burç yorumları.',                                k:['Eğlence']},
    {ad:'Domino',          yol:'domino/',               ikon:'domino/ikon.svg',            not:'3D masa, yapay zekâ ya da arkadaşlarla online domino; sohbet, ipuçları, kılavuz.', k:['Masa','Online'], on:1}
];
