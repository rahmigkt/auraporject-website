# Ev sohbetleri: Danimarka turu

21 Ekim 2026 · Avrupa ülke sırası devamı. Önceki 20 + 8 kayıt korunur; yeni tur dört ayrı Danca sohbet ve Türkçe tasarımcı özetidir. Her sohbet sekiz kullanıcı–asistan alışverişi; toplam 64 mesaj. [İnceleme sayfası](EV-SOHBET-DK-inceleme.html).

## Kapsam

| Şehir / durum | Swiss Dwellings kaynak kimliği | Net iç alan | Yerleştirilen ürün |
|---|---|---:|---:|
| København; çocuklu kiracı | sd-00550e307e8c04a1873367f8 | 99.0 m² | 6 |
| Aarhus; sıra ev ve eksik üst kat | sd-0112efabc9a7f548826180ce | 95.9 m² | 8 |
| Odense; müstakil ev, mutfak-alrum ve bryggers isteği | sd-01a28816ab56c6b614fe5e85 | 72.1 m² | 8 |
| Vejle; yürüteç/tekerlekli sandalye ve erişim ihtiyacı | sd-01f1d98dbb589f2518bee5b3 | 70.9 m² | 6 |

Kaynak: [Swiss Dwellings 3.0.0 / Archilyse AG / CC BY 4.0](https://zenodo.org/records/7788422). Dört farklı gerçek kaynak geometrisi, önceki 28'den de farklıdır. Ancak hepsi tek katlı **İsviçre referansıdır**; Danimarka'da ölçülmüş ev, yerel parcelhus planı veya tamamlanmış sıra ev projesi sayılmaz. Kaynak lisansı ve atfı her kayıtta korunur. `fixture_sha256`, anahtarları sıralanmış JSON içeriğinin özetidir; ham dosya özeti değildir.

Kullanıcının verdiği bağlam ile kaynak geometrisi ayrıdır. Aarhus'ta üst kat çizilmez; iki katın ve merdivenin ölçülü keşfi istenir. Odense'de mutfak duvarı kaldırılmaz, ülke kodundan bryggers icat edilmez. Vejle'de sıradan yerleşim başarılı diye erişilebilirlik onayı verilmez. København'da fotoğraf veya ilan alanından ölçü uydurulmaz. Son karar tasarımcıda; sohbetlerin hiçbiri üretim veya yapı müdahalesi izni değildir.

Yataklar mevcut eski derleyiciden alınmış **boyut referanslarıdır**; kaldırılmış yatak ailesi yeniden satışa çıkarılmaz. Mutfak, zemin ve korunacak mevcut mobilyalar ölçülmüş yeni imalat gibi sunulmaz. Bu teslim bütün evin halı, perde, aydınlatma ve tesisat tasarımının tamamlandığını iddia etmez; açık proje ihtiyaçları Türkçe tasarımcı özetinde görünür.

## Danimarka kaynakları ve ölçü ayrımları

- [Danmarks Statistik: konut stoku](https://www.dst.dk/en/Statistik/emner/borgere/boligforhold/boligbestanden) farklı konut tiplerini ayırır. Bu, İsviçre geometrisini yerel konut tipine veya ulusal dekorasyon zevkine dönüştürmez.
- [Danmarks Statistik: alan tanımı](https://www.dst.dk/en/Statistik/dokumentation/documentationofstatistics/census-of-housing/statistical-presentation) dış duvar dışından ölçülen ve apartmanda merdiven ortak payını da içeren kayıtlı alanı açıklar. Bu turdaki net oda poligonu toplamına eşit sayılmaz; sabit dönüştürme katsayısı üretilmedi.
- [BR18, konut düzeni §§199–213](https://www.bygningsreglementet.dk/tekniske-bestemmelser/09/krav/199_213/): §199 kullanımın yerleşimle belgelenmesini, §205 yüksekliğin oda ve pencere koşullarıyla değerlendirilmesini içerir. §208'deki 0.77 m, erişim katındaki ilgili kapıların **serbest geçişidir**; kaynak plandaki açıklık eni değildir. Mevcut kayıtta serbest geçiş ölçülmedi.
- [BR18 günışığı rehberi](https://www.bygningsreglementet.dk/tekniske-bestemmelser/18/vejledninger/generel_vejledning/dagslys/): %10 yaklaşımı gerçek cam alanı ve düzeltmeler gerektirir. Ham pencere açıklık oranından Danimarka günışığı onayı çıkarılmaz; cam özellikleri ve engeller bilinmiyor.

Kaynaklar 21 Ekim 2026'da okundu; BR18 sayfalarında `Aktuelt` seçiliydi. Somut yapının ve müdahalenin hangi hükümlere tabi olduğu belirlenmedi. Makine okunur kaynaklar `veri/ev-sohbet-dk/ulke-kaynaklari.json` içindedir. Bu bir tam BR18 denetim motoru değildir: bütün kayıtlarda mevzuat sonucu `unknown_not_certified`; BBR alanı, gerçek serbest kapı geçişi ve düzeltilmiş cam alanı `null` kalır. Önceki iş emrindeki iç proje hedefleri ulusal yasa gibi sunulmaz.

## Kontroller ve kalanlar

| Kontrol | Sonuç |
|---|---|
| Yeni kaynak/oda/duvar/açıklık/yerleşim hatası | 0; 4/4 kayıt kaynak istisnalarıyla geçiyor |
| Bütün proje ölçü hedeflerini istisnasız geçme | **0/4** |
| Korunmuş kaynak hedef sapması | **22:** 15 kapı eni, 3 banyo alanı, 3 ham pencere/zemin oranı, 1 WC alanı |
| Değiştirilmemiş stüdyo çözücüsü | 4 kayıt / 14 deneme; birebir tekrarlandı |
| Yeni turda sığmama sonucu | 0; başarısız sonuç uydurulmadı |
| Eski 28 kayıtta tekrar | 20 kayıt / 74 deneme / 10 no-fit ve 8 kayıt / 23 deneme / 0 no-fit aynı |
| Yeni yanlış veri aşılamaları | 6/6 test geçti: BBR, serbest geçiş, cam, sahte onay, uydurma kat, elle konum |
| Önceki geometri denetimleri | 14/14 test geçti |
| Gerçek stüdyo dosya açma | 4/4; oda sayısı ve net iç alan eşleşti; plan/maket, sayfa hatası yok |
| Çevrimdışı yeniden üretim | 4/4 kayıt bayt düzeyinde aynı |

`accepted` kaynak sapmalarının giderildiği veya yasal uygunluk anlamına gelmez. Yeni geometri hataları ile değişmeden korunan kaynak ölçüleri ayrı raporlanır. Kapı menteşeleri bilinmediğinde ihtiyatlı açıklık zarfı kullanılır; gerçek pencere donanımı, mobilya mekanizmaları, transfer ve dolaşım gereksinimleri yerinde incelenmelidir.

İnceleme görselleri ve açılabilir örnekler [ev-sohbet-dk-ornekler](ev-sohbet-dk-ornekler/) klasöründe; her kaydın plan ve maket görüntüsü inceleme sayfasından açılır. Tam JSON'larda balkonlar korunur; görüntüleyici alanı net iç alanla aynı olsun diye açılabilir dosyalar yalnız iç mekân izdüşümüdür. Görüntüleyicideki tavan yüksekliği, pusula ve ışık şehri varsayılanları gerçek keşif verisi değildir.

Görsel incelemede København planında aynı kaynak girişinin iki eksen parçasına bölünmesi nedeniyle main görüntüleyicisinin iki “GİRİŞ” etiketi çizdiği görüldü. Bunlar iki bağımsız dış kapı değildir: ikisinin de `source_opening_id` değeri `opening-5`. Tam açıklık denetimde tek grup olarak kontrol edilir; etiket birleştirme görüntüleyici düzeltmesi bu `assets/` dışı teslimin kapsamında yapılmadı. Oda/alan testi bu görsel kusurun giderildiği anlamına gelmez.

Tarayıcı testi main `47457ed` içerikli çalışma kopyası üzerinden çalıştırıldı; önceki dalın eski arayüzüyle yetinilmedi. Çözücü modülünün Git blob'u main ve bu dalda aynı: `6ea385517ceb1bf5dc8e2c741b9884cc09ea380c`. Runtime `assets/` dosyası değiştirilmedi. Sonradan main değişirse bu kanıt otomatik yeni sürüme taşınmış sayılmaz.

## Tekrar çalıştırma

Python + Shapely 2.1.2 ve Node gerekir. Depoya alınmış dört lisanslı fixture ile kaynak arşivi olmadan:

```text
python tools/ev-sohbet/dk.py
node tools/ev-sohbet/place02.mjs knowledge/ai-egitim/veri/ev-sohbet-dk
python tools/ev-sohbet/dk_dialogues.py
python tools/ev-sohbet/dk_audit.py
python tools/ev-sohbet/dk_review.py
node tools/ev-sohbet/verify02.mjs knowledge/ai-egitim/veri/ev-sohbet-dk
python -m unittest discover -s tools/ev-sohbet -p test_dk.py -v
python -m unittest discover -s tools/ev-sohbet -p test02.py -v
node tools/ev-sohbet/verify02.mjs knowledge/ai-egitim/veri/ev-sohbet-uk-ie
node tools/ev-sohbet/verify02.mjs
node tools/ev-sohbet/viewer02.cjs knowledge/ai-egitim/ev-sohbet-dk-ornekler
```

Son komut Chrome ve Playwright gerektirir. Güncel main arayüzünü sınamak için komutun çalışma dizini main içerikli ayrı kopya, araç ve örnek dizini ise bu dalın mutlak yolları olabilir. Dosya yükleme gerçek `#openFile` girdisindendir; testte plan verisi ağ yanıtıyla değiştirilmez. `viewer-results.json` sonuçları ve `yeniden-uretim-sonucu.json` ham kayıt SHA256 özetlerini içerir.

## Dal ve sıra

`codex/ev-sohbet-dk`, #142'nin `codex/ev-sohbet-uk-ie` dalı üzerine açıldı. #138 → #142 → bu PR sırasıyla inceleme bekler; öncekiler birleştikten sonra taban main'e taşınmalıdır. Önceki 28 kayıt değiştirilmedi. Eğitim, GPU, ücretli model/API, otomatik mail ve canlı dağıtım yapılmadı.

[Ülke sırası](EV-ULKE-SIRASI.md): sıradaki **İspanya**, sonra İtalya, Avusturya ve İsviçre. Danimarka'nın tüm konut tipleri veya ulusal teknik kontrolleri tamamlanmış sayılmıyor.
