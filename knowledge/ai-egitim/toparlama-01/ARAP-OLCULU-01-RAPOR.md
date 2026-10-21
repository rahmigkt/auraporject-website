# Arapça ölçülü yerleşim — ilk takip

21 Ekim2026. Önce beş test düzeltmesi: PR#175,63/63PASS. Ardından bu çalışma ayrı dalda yapıldı; eğitim ve PR birleştirme yok.

## Teslim

12 yeni ve bağımsız kurmaca görüşme: AE3/SA3/QA2/KW2/EG1/MA1, her biri8kullanıcı/asistan turu,192mesaj. Önceki12ölçüsüz ön görüşme aynen korundu ve yeni kayıtlara metin olarak kopyalanmadı. MSA asistanı, yer yer yerel kullanıcı ağzı ve Doğu Arap rakamları korunur. Ana dil onayı yok.

12 farklı mevcut ölçülü Swiss Dwellings3.0.0 planı, kaynağı/atıfı/CCBY4.0 bilgisi ve fixture hash'iyle kullanıldı. [Birincil kaynak](https://zenodo.org/records/7788422). Bu dosyalarda CH birimleri Arap ülkesinde ölçülmüş konut veya villa diye sunulmaz. Doğrudan yeni müşteri fotoğrafı/planı kullanılmadı. Kayıtlar yalnız tek seviye aile salonu çalışmasıdır; tamamlanmış bütün ev0,iki katlı geometri0,meclis0. Üst kat ve merdiven isteyen iki senaryo ile meclis isteyen dört senaryonun bu bölümleri bekler.

12aile salonu / 24parça gerçek solveRoom ile yerleştirildi. Ürün ölçüleri konuşmada seçilir: kanepe1700–2400×820mm,sehpa900×550mm. Tam normalize/derlenmiş boyut ve ayak izi kaydedildi; elle koordinat veya gizli küçültme yok. Her plan için12SVG, kaynak istisnaları ve görüşmeler [inceleme sayfasında](../EV-ARAP-OLCULU-01-inceleme.html).

## Geometri ve seçilen alternatif

Bağımsız Shapely denetimi12/12planı belgeli kaynak istisnalarıyla kabul ediyor; sıkı geçiş1/12.36kaynak istisnası korunuyor. Bu hedefler önceki iş emrinin boyutsal hedefleridir; Arap ülkelerinin mevzuat onayı değildir. Yeni duvar/oda icat edilmedi; kapı açılımı,oda içi kalma,parça çakışması ve kaynak geometri farkları ayrıca denetlenir.

04numaralı kayıtta çözücünün ilk iki seçeneği sehpayı kapı açılımına taşıdı. Bu iki seçenek,ham sonuçları ve ret nedenleri kayıtta tutuldu; üçüncü gerçek seçenek kabul edildi. Çözücü tekrar sonucu değiştirilmedi veya yeniden sıralanmadı. selected_alternative indeksi açıkça kaydedilir. Eski denetim aracı yalnız0.seçeneği okuyordu; artık seçilen geçerli indeksi denetler,olmayan/bozuk indeksi reddeder. Eski veride varsayılan0davranışı aynıdır.

Ortak motorun12işlem isteği sözleşme denetiminden geçti. **Bu sayı, çizimde seçilen alternatifin tur başına native eylem karşılığı veya koordinat eşitliği kanıtı değildir.** Seçilen alternatif henüz yerleştir isteğine eklenmiş tam native hedef değildir; canlı seçim köprüsü ve secenek_sec fiziksel durum eşlemesi ayrı inceleme ister. Bu eksik adaylarda uyarı olarak durur; eğitim exportu yok.

## İlk taslakta yakalanan hata

İlk donor listesi eski EV-SOHBET-02 öneri üst katlarını da taşıyordu. Kat sayısı testi2!=1ile yakaladı. O taslak silinmedi,toparlama-01/archive/arap-olculu-draft-00 altında SHAmanifestiyle superseded kaldı. Güncel kaynak listesi8UK/IE+4ITtek seviyeli kayıttır; oluşturucu çok katlı donor veya proposed stair gördüğünde hata verir. Sonraki bağımsız denetim kapı sorununu yakaladı ve alternatifler yukarıdaki gibi elendi. Onaysız taslaklar öğrenme verisine sokulmadı.

## Doğrulama ve sınırlar

- ev-arap-olculu-check.mjs:12ham çözücü tekrarında tam eşitlik,24ayak izi,istek ölçülerinin sabitliği,seçenek/scope/doğruluk kontrolleri geçti.
- ev-arap-olculu-geometry-check.py:12kaynak geometri denetimi,ülke/dil/8tur,ellekonum/kaynakhash/duvar/yanlışseçenek mutasyonlarının reddi,SVGvebytehashleri geçti.
- İkinci oluşturma:39veri/çizim/inceleme dosyası SHAaynen aynı. byte-tekrar.json kanıtı saklı.
- Playwright Chrome:1440pxmasaüstü ve390pxmobil,12kart/12yüklenmişSVG,yataytaşma0,RTLdoğru,sayfahatası0. PNGveham QAraporu bu klasörde. SVGleri ayrıca tarayıcıda incelemek mümkün.
- Üslup:yasaklıterim0,60kelimeüstü0,dilkarışmasısezgisi0,tekrar0; ana dil/tasarımcı onayı değildir.

12yeni aday ortak biçime eklenecek; önceki2578kayıt ve bölmeleri aynen korunacak. Yeni toplam2590karantina,uygun eğitim0. Aynı CHkaynak planı ve bina önceki ülke uyarlamalarıyla aynı bölümde kalır; kapalı120görev ayrı tutulur. Tam toplu sonuç son takip bölümüne yazılacak.
