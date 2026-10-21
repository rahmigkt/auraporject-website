# Arapça ölçülü yerleşim — ilk takip

21 Ekim 2026. Önce [PR #175](https://github.com/rahmigkt/auraporject-website/pull/175) ile beş test düzeltildi ve 63/63 kontrol geçti. Ardından bu çalışma [PR #176](https://github.com/rahmigkt/auraporject-website/pull/176) olarak ayrı dalda yapıldı. Eğitim, model yükleme, GPU, ücretli API, canlı dağıtım veya PR birleştirme yapılmadı.

## Teslim

12 yeni ve bağımsız kurmaca görüşme var: BAE 3, Suudi Arabistan 3, Katar 2, Kuveyt 2, Mısır 1, Fas 1. Her görüşme sekiz kullanıcı/asistan turu; toplam 192 mesaj. Önceki 12 ölçüsüz ön görüşme değiştirilmedi ve metinleri yeni kayıtlara kopyalanmadı. Asistan MSA kullanır; kullanıcıların yerel söyleyişleri ve Doğu Arap rakamları korunur. Ana dil ve tasarımcı onayı bekliyor.

Önceki çalışmalardan 12 farklı Swiss Dwellings 3.0.0 tek seviye planı, kaynak/atıf/CC BY 4.0 bilgisi ve fixture hash'i korunarak kullanıldı. [Birincil kaynak](https://zenodo.org/records/7788422). Bunlar Arap ülkesinde ölçülmüş gerçek konut veya villa olarak sunulmaz. Yeni müşteri fotoğrafı veya planı kullanılmadı; yerel bina mevzuatı onayı verilmez.

12 aile salonunda 24 parça gerçek solveRoom ile yerleştirildi. Konuşmada seçilen kanepe genişlikleri 1700–2400 mm, derinlik 820 mm; sehpa 900 × 550 mm. Normalize edilmiş parametreler, derlenmiş boyutlar ve ayak izleri saklı. Elle koordinat veya gizli küçültme yok. [İnceleme sayfası](../EV-ARAP-OLCULU-01-inceleme.html) 12 SVG planı, ölçüleri, seçilen alternatifi, Arapça görüşmeleri ve kaynak istisnalarını birlikte gösterir.

**Tamamlanan bütün ev, iki katlı geometri ve meclis sayısı sıfır.** İki senaryoda üst kat/merdiven, dört senaryoda meclis bekler. Diğer odalar bu turda döşenmedi.

## Bağımsız geometri ve alternatif seçimi

Shapely denetimi 12 planı belgeli kaynak istisnalarıyla kabul ediyor; sıkı geçiş 1/12. Kaynaktan gelen 36 boyutsal istisna korunuyor. Bunlar önceki iş emrinin hedefleridir; yerel yasal sınırlar gibi gösterilmez. Duvar ve oda geometrisi kaynağa karşı, parça konumları gerçek çözücü sonucuna karşı denetlenir. Oda dışına taşma, çakışma ve kapı açılımı ayrıca kontrol edilir.

04 numaralı kayıtta ilk iki çözücü seçeneği sehpayı kapı açılımına taşıdı. Ham seçenekler ve ret nedenleri korunarak üçüncü gerçek seçenek kullanıldı. Sonuç yeniden sıralanmadı. selected_alternative indeksi açıkça saklıdır. Eski denetleyici yalnız ilk seçeneği okuyordu; artık seçilen indeksi doğrular ve olmayan indeksi reddeder. Eski kayıtlarda varsayılan ilk seçenek davranışı korunur. Kapıyı engelleyen ilk önerinin tekrar reddedildiği ayrıca sınanır.

Ortak motor 12 isteği sözleşme bakımından kabul etti. **Bu, seçilen çizim alternatifinin tur başına native eylem karşılığı veya koordinat eşitliği kanıtı değildir.** Canlı seçim köprüsü ve secenek_sec fiziksel durum eşlemesi ayrı inceleme ister. Bu eksik uyarı olarak adaylarda kalır; eğitim hedefi sayılmaz.

## Yakalanan ilk taslak hatası

İlk donor listesi eski EV-SOHBET-02 çalışmasındaki öneri üst katları da taşıyordu. Kat sayısı testi bunu yakaladı. Taslak silinmedi; archive/arap-olculu-draft-00 altında SHA manifestiyle superseded olarak saklandı. Güncel liste 8 UK/IE ve 4 IT tek seviye kaydıdır. Oluşturucu çok katlı donor veya öneri merdiven görürse hata verir. Sonraki bağımsız denetim kapı sorununu da yakaladı; elenen seçenekler kayıtta kalır.

## Doğrulama

- ev-arap-olculu-check.mjs: 12 ham çözücü sonucuyla tam eşitlik, 24 ayak izi, istek ölçüleri, seçilen alternatif ve kapsam kontrolleri geçti.
- ev-arap-olculu-geometry-check.py: kaynak geometrisi, ülke/dil/sekiz tur ve manuel konum/kaynak hash'i/duvar/yanlış seçenek mutasyonları geçti. Güvensiz kapı seçeneği yeniden reddedildi.
- İkinci oluşturma: 39 veri/çizim/inceleme dosyasının SHA değeri aynı. Kanıt: byte-tekrar.json.
- Playwright Chrome: masaüstü 1440 px ve mobil 390 px; her ikisinde 12 kart, 12 yüklenmiş SVG, doğru RTL, yatay taşma ve sayfa hatası yok. PNG ve ham QA raporu bu klasörde. Masaüstü görüntüsü görsel olarak da incelendi.
- Üslup taraması: yasaklı terim, 60 kelimeyi aşan cevap, dil karışması sezgisi ve tekrar sıfır. Bu sonuç ana dil onayı değildir.
- Ortak dönüşüm: 12 yeni aday eklendi; önceki 2.578 kayıt ve bölmeleri aynen kaldı. Toplam 2.590 kayıt karantinada, 52 motor sözleşme raporu var. Kaynak grubu sızıntısı yok; 242 kaynak kümesi korundu. train/dev/test exportları boş. Aynı fiziksel CH planı ülke uyarlamalarında aynı bölümde kalır; kapalı 120 görev ayrı tutulur.

Son toplu koşu: `node tests/hepsi.mjs` **65/65 PASS**, çıkış 0. Ham kayıt: ARAP-OLCULU-01-test-sonuc.json. Kapı açılımı negatif kontrolü ve satır sonu taşınabilirliği eklendikten sonra etkilenen iki Arapça denetim ayrıca tekrar geçti. Yerleştirme kaynağının özeti LF/CRLF checkoutlarda aynı hesaplanır; mevcut veri baytları ve 39 dosyalık tekrar kanıtı değişmedi. Assets, api, kök HTML, .htaccess ve eski score.mjs değiştirilmedi.
