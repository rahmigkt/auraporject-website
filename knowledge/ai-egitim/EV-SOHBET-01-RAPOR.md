# EV-SOHBET-01 — bağımsız sohbetler ve ölçülü yerleşim

20 Ekim 2026. Main tabanı `c845f6e`; dal `codex/ev-sohbet-01`.
Eğitim, model çağrısı, ücretli API, GPU ve site yayını yapılmadı.

## Bağımsızlık

`knowledge/ai-egitim/veri/sohbet-ornekleri/sohbet-001.json` ve `tools/ev-sohbet/`
içeriği okunmadı. Yalnız ortak kayıt README'si, asistan sözleşmesi ve EV şemaları
biçim için kullanıldı. Stüdyo derleyicileri ve viewer kodu ürün/çıktı uyumu için
okundu; Claude'un sohbeti veya yerleşim kodu alınmadı. Yeni araç
[tools/ev-yerlesim](../../tools/ev-yerlesim/README.md) içinde.

12 sohbetin her biri ayrı yazılmış **20 kullanıcı–asistan çifti / 40 mesaj** içerir:
toplam 240 çift / 480 mesaj. Kaynak metinler `tools/ev-yerlesim/dialogues/` altında
incelenebilir. Bir varyasyon/çeviri üreticisi kullanılmadı. Tek metin yer tutucusu,
senaryonun simüle ölçü cetvelidir; cetvel konuşmada kullanıcı tarafından verilir.
Hepsi `synthetic:true`, `author:"codex"`; gerçek müşteri, fotoğraf veya ölçülü ulusal
plan veri seti değildir. Yeni kayıtlar insan ve ana dil incelemesi bekler.

## Senaryolar

İş emrinin ülke listesini tam kapsamak için kısa istekteki sekizden daha geniş,
**dokuz ülke / sekiz dil** kullanıldı: Belçika iki dilde, Hollanda, Almanya, Fransa,
Birleşik Krallık, Danimarka, İspanya, İtalya ve Türkiye.

| Kayıt | Ülke / dil | Konut ve zor durum |
|---|---|---|
| codex-001 | BE-VLG / NL | İki katlı rijwoning; ölçü başlangıçta yok, çocuk, mevcut masa |
| codex-002 | BE-BRU / FR | Dubleks; eski plan fotoğrafı ve fotoğraf içindeki yetkisiz talimat |
| codex-003 | NL / NL | Köşe daire; kararsız malzeme seçimi, mevcut kanepe ölçü temsili |
| codex-004 | DE-BE / DE | Altbau; tarihi elemanlar, onaysız duvar kaldırma ve kapıyı küçültme isteği |
| codex-005 | FR-IDF / FR | Haussmann etiketi; T3 yanlış yorumu, salonu büyütme isteğinden dönüş |
| codex-006 | GB-ENG / EN | İki katlı müstakil; yaşlı ebeveyn için zeminde yatak, birim dönüşümü |
| codex-007 | DK / DA | Açık stüdyo/loft; dar bütçe, fazladan koltuk/yatak iptali |
| codex-008 | ES-MD / ES | Köşe daire; çocuk ve pencere güvenliği, batı ışığı, ertelenen halı |
| codex-009 | IT-LOM / IT | Trilocale sayımı; mevcut masa, bütçeye kesin fiyat garantisi isteği |
| codex-010 | TR-34 / TR | İlan 60 m² / 3+1 çelişkisi; program açıkça 1+1'e döner, alan farkı açık kalır |
| codex-011 | NL-UT / NL | Maisonnette; düşen bütçe, iptal edilen çalışma odası, eksik merdiven |
| codex-012 | TR-35 / TR | Tek katlı müstakil; korunacak yatak, ölçülmemiş bahçe, üretim garantisi baskısı |

Konuşmalar içinde seating, table, storage, kitchen, bath ve mevcut yatak uyumluluk
ailesinin ürünleri ölçü, kumaş/renk, malzeme ve koruma kararıyla seçilir. Rastgele
`sample()` çağrısı yoktur. Henüz seçilmeyen aydınlatma, perde ve halı ölçülü
yerleştirilmiş gibi sunulmaz; korunur veya sonraya bırakılır.

## Kurallar ve kaynaklar

[rules.json](../../tools/ev-yerlesim/rules.json) her kural için kaynak, lisans,
sayfa/bölüm, kapsam ve statü taşır. Kaynaksız sayılar AURA **önerisi** veya arama
parametresidir; ulusal yasal asgari değer değildir. Neufert'in ücretli metni
okunmuş ya da sayfaları doğrulanmış gibi gösterilmedi.

| Konu | Dayanak ve uygulama |
|---|---|
| Masa çevresi | [IKEA yemek alanı rehberi](https://www.ikea.com/sg/en/rooms/dining/dining-room-guide-pub21ad8080/), ilgili HTML bölümleri: 800 mm üretici tavsiyesi; telifli metin/görsel kopyalanmadı. |
| Mutfak önü | [IKEA planlama PDF'si](https://www.ikea.com/gb/en/files/pdf/ce/ad/ceadf09a/your-ikea-kitchen-planning-guide.pdf), basılı s.11: ada ve dolap arası 1200 mm tavsiyesi. Bu prototip düz sırada da muhafazakâr öneri olarak kullanır; tüm mutfaklara yasal zorunluluk değildir. |
| Erişilebilirlik ayrımı | [US Access Board](https://www.access-board.gov/files/ada/ADA-Standards.pdf), PDF s.116 / basılı s.90, §403.5.1: kapsamındaki rota 915 mm. Prototipteki 600/900 mm AURA hedefleri bunun yerine geçmez; Avrupa/Türkiye özel konutu için ADA onayı verilmez. |
| TV | [Sony makalesi](https://www.sony.co.uk/electronics/support/televisions-projectors-lcd-tvs/kdl-55w905a/articles/00008601), 09.09.2026: 4K için ekran düşey yüksekliğinin 1,5, HD için 3 katı asgari izleme tavsiyesi. Tercih edilen azami mesafe veya tıbbi güvenlik sınırı değildir. Oturma gövdesinden göz konumu ayrıca öneri olarak yaklaşık hesaplanır. |
| Çalışma | [CCOHS çalışma alanı](https://www.ccohs.ca/oshanswers/ergonomics/office/working_space.pdf), s.1–2; [yansıma rehberi](https://www.ccohs.ca/oshanswers/ergonomics/office/eye_discomfort.html). Kullanıcı/işe göre değerlendirme ve yan ışık; 900 mm masa önü ve sayısal ışık açısı vekili AURA önerisidir. |
| Çocuk | [CPSC rehberi](https://www.cpsc.gov/s3fs-public/252ChildproofingYourHome32123.pdf), pencere, devrilme ankrajı ve kordon bölümleri. Tasarımcı/kurulum görevi olarak saklanır; çözücü çocuk güvenliği sertifikası vermez. |
| Yatak / dolap / pencere / radyatör | Yatak üç yanda 600 mm, dolap önü 900 mm, pencere servisi 450 mm ve radyatör ön zarfı 500 mm açıkça AURA önerisi. Gerçek radyatörün üretici şartı alınmadan uygunluk iddia edilmez. |

## Çözücü

Asistan ürün parametresi ve niyet verir; oda koordinatı yazmaz. EV oda poligonu,
kapı/pencere ölçüleri ve açık menteşe yan kaydı `adapter.room_from_ev` ile alınır.
Ölçülmemiş oda veya bilinmeyen menteşe/açılımda sayı uydurulmaz. Mevcut prototip
bilinen içeri açılan kapıları destekler; diğer açılım türleri için açık destek
genişletmesi gerekir.

350 mm aday kafesi, duvar yakınları ve dört dik yön kullanılır; sınırlı ışın araması
üç ayrık geçerli oda seçeneği arar. Bu sürekli uzayda tamlık garantisi değildir.
Bulamazsa boş seçenek ve netleştirme döner. Hiçbir kural sessizce gevşetilmez.
Oda seçenekleri üç ev alternatifinde birleştirilir. Puan, AURA'nın yumuşak duvara
yakınlık tercihidir; öğrenilmiş estetik veya mimari kalite puanı değildir.

Denetimler: poligon dışına çıkma, gövde/duvar zarfı, tavan, ürün çarpışması,
kullanım paylarının başka ürünle kesişmesi, muhafazakâr kapı yayı, pencere/radyatör
şeritleri, kanepe–TV yönü ve mesafesi, masa–yan ışık vekili, kapıdan ürün önüne ve
yatak yanlarına serbest rota bağlantısı. Rota, engellerin yarı rota eni kadar
şişirildiği konfigürasyon uzayında kontrol edilir. Kapı kanadı kalınlığı, gerçek
çekmece/cihaz açılımı, sandalye antropometrisi, tesisat ve fotometri çözülmez.

Ürünlerin dış ölçüleri **güncel checkout stüdyosundan** derlenir. Genel ürünlerde
`compileDesign().meta.overall`; yatakta, genel normalleştiricinin yatak ailesini
storage'a taşıması nedeniyle mevcut viewer'ın `bedroom.normalize/compile`
uyumluluk yolu kullanılır. Bu istisna her seçimde görünür. Mevcut eşyalar yalnız
ölçü temsiliyle korunur; gerçek eşyanın formu ve ölçüsü yeniden doğrulanmalıdır.
Derleyicinin geçersiz kumaş rengini sessiz değiştirmesi kontrolle yakalandı;
İspanyol örneğinin açık seçimi katalogdaki `rust` kimliğine düzeltildi.

## Veri araştırması

[3D-FRONT lisansı](https://gw.alicdn.com/bao/uploaded/TB1ZJUfK.z1gK0jSZLeXXb9kVXa.pdf)
s.1, §3.2/3.3 bilimsel araştırma ve ticari hizmet kısıtları nedeniyle dışarıda.
[Hypersim](https://github.com/apple-aiml-research/ml-hypersim) veri lisansı CC BY-SA
3.0 ile ticari kullanıma şartlı izin verir; özgün sahne varlıkları ayrı satın alma
ve haklara tabidir. Sanatçı üretimi sentetik sahneler ölçülmüş gerçek konut
yerleşim dağılımı değildir. [ProcTHOR](https://github.com/allenai/procthor) kodu
Apache-2.0; motor/varlık/veri kapsamı ayrıca doğrulanmalıdır ve evler prosedüreldir.

Bu turda mobilyalı veri indirilmedi, gerçek yerleşim dağılımıyla kalibrasyon
yapılmadı. Ayrım ve sonraki veri mühendisliği gereksinimleri
[furnished-datasets.json](../../tools/ev-yerlesim/furnished-datasets.json) içindedir.
Sentetik kaynakları gerçek insan yerleşimi gibi göstererek başarı yazılmadı.

## Teslimi inceleme

[12 sohbet ve üçer alternatif](veri/sohbet-ornekleri/codex-okuma.html).
Kaynak metinler ayrı dosyalarda incelenebilir; üretilmiş JSON'lar `codex-001.json`
… `codex-012.json`, kanonik/kat/çözücü dosyaları `planlar/codex-*` altında.

Tam kanonik kayıt değişmemiş EV v0.1 şemasına uyar. Viewer'ın beklediği ürün
`design/pos_xy_mm/rot_deg/name`, oda `finish` ve ev `scheme` alanları **açık viewer
uzantı şemasıyla** ayrıca doğrulanır. Temel şemanın bu ek alanları kabul ettiği
iddia edilmez. Boya, zemin ve şema kimlikleri doğrudan `assets/ev/finishes.js`
exportlarından alınır; kanonik bitiş referanslarında da korunur.

Çok katlı kayıtta `result_plan` yalnız ilk kat önizlemesidir. `canonical_plan`
bütün katları, `result_plans_by_level` her katı ayrı tutar. Toplam 16 ayrı kat
dosyası vardır. Merdiven ve döşeme bağlantısı **doğrulanmadı**; kullanıcıdan ölçü
ve tasarımcı istenir. Bunlar sadeleştirilmiş sentetik koridorlu oda cetvelleridir;
yerel Altbau/Haussmann/rijwoning özelliklerinin doğrulandığı iddia edilmez.

Sonuç: **18 yeni ve 42 mevcut test geçti**. 36 kanonik alternatif şeması,
16 viewer uzantısı, 174 oda/seçenek yerleşim denetimi geçti; 110 seçilmiş ürün
kayıtlarla eşleşiyor. Playwright 16/16 dosyayı gerçek dosya açma alanından yükledi,
oda/ürün sayılarını ve maket açılışını kontrol etti. İnceleme sayfasında 12 sohbet,
48 kat diyagramı ve 390 px taşma kontrolü geçti. [Plan ekranı](veri/sohbet-ornekleri/codex-viewer.png),
[maket](veri/sohbet-ornekleri/codex-maket.png), [masaüstü](veri/sohbet-ornekleri/codex-desktop.png)
ve [telefon](veri/sohbet-ornekleri/codex-mobile.png) görüntüleri teslimde.

Doğrulama sayıları [codex-audit.json](veri/sohbet-ornekleri/codex-audit.json),
birim test kanıtları ve
[viewer sonuçları](veri/sohbet-ornekleri/codex-viewer-results.json) içindedir.
Her plan onay bekleyen taslak olarak kalır; başarı sayıları insan/estetik onayı
veya modelin konuşma başarımı değildir. Kayıtlar insan incelemesinden geçmeden
eğitim verisi olarak onaylanmış sayılmaz.

`assets/`, `score.mjs`, Claude'un kaydı ve araç klasörü değiştirilmedi.
PR inceleme içindir; birleştirme veya otomatik gönderim yapılmaz.
