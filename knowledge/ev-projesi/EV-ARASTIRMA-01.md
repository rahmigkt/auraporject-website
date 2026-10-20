# EV-ARAŞTIRMA-01 — Bütün ev için tasarım asistanı

Tarih: 2026-10-20 · Temel: `main@cbabe4f` (PR #107) · İş emri: [EV-CODEX-01](EV-CODEX-01.md)

## Karar ve teslim sınırı

AURA'nın yeni proje birimi **bütün ev** olmalı. Odalar, evin ortak bütçesine, malzeme diline ve dolaşımına bağlı alt parçalardır. Kullanıcı mevcut evini ve eşyalarını gösterir; asistan ihtiyaçları toparlar, eksikleri sorar, seçenekleri stüdyoda önerir ve tasarımcıya aktarır. Ölçü, uygulanabilirlik, ürün ve son proje kararı tasarımcıdadır. Mobilya ailelerini yeniden geliştirmek bu işin ön koşulu değildir.

Bu teslim araştırma, kaynaklı kategori verileri, şema ve entegrasyon önerisidir. İş emri gereği uygulama kodu ve `assets/` değiştirilmedi. Yeni özellikler sitede çalışıyor diye sunulmamalı. Gerçek müşteri fotoğrafı kullanılmadı; model eğitimi, GPU kiralama veya ücretli servis başlatılmadı. Claude'un entegrasyonuna hazır bir başlangıç sözleşmesi var; ticari katalog ve mevzuat denetimi henüz tamamlanmış değildir.

## Mevcut stüdyo: işe yarayanlar ve temel boşluklar

İnceleme temel committeki dosyalar üzerinden yapıldı; canlı sitede bütün ev kabul testi yapılmadı.

| Yer | Mevcut davranış | Bütün ev için sonuç |
|---|---|---|
| `assets/forma/room.js`, `arrangeRaw`, `arrange`, `shell` | Oda türüne göre otomatik yerleşim ve dekoratif oda kabuğu; eşyalar sığsın diye oda büyüyebiliyor | Gerçek ev ölçüsü kilitli kalmalı. Mevcut algoritma ancak öneri üreticisi olarak, sabit sınır doğrulamasından geçirilerek kullanılmalı |
| `assets/forma/room.js`, `footprint`, `misfits` | Mesh sınırlarından boyut ve oda/ürün türü uyumu | Kapı açılımı, dolaşım, duvar açıklıkları ve kullanım boşluğu doğrulaması yerine geçmez |
| `assets/forma/ai.js`, `interpret`, `designFromImage`; `api/forma-ai.php` | Tek ürün komutları; fotoğraf yolu oturma ürünü sözlüğüne bağlı | Çok odalı fotoğraf envanteri, mevcut eşyayı koruma ve ev belleği yok. `interpret`, yalnız temizlenmiş actions döndürüyor; sunucudaki reply kullanıcıya taşınmalı |
| `assets/forma/scene.js`, `photo`, `capture`, `exportGLB` | Mevcut geometriyi görüntüleme, fotoğraf ve GLB çıktısı | Görsel üretmek için temel var; export şu anda bütün ev katmanının eksiksiz aktarımı olarak kabul edilemez |
| `assets/forma/studio.js`, proje paketi ve `forma-submit.php` çağrısı | Ürünleri paketleyip tasarımcıya gönderme | Sürüm, fotoğraf delilleri, tüm ev planı, odalara göre listeler ve tasarımcı cevap akışı ayrıca eklenmeli |
| `assets/vendor/infinigen` | Lisans ve tek `sofa-parameters.js` uyarlaması | Bütün Infinigen motoru veya perde/ışık üreticileri tarayıcıda hazır değil |

Buradaki mevcut yerleşim sabitleri, yapı standardı veya kullanıcı evinin ölçüsü olarak yeni veriye taşınmamalı.

## Kaynak ve lisans seçimi

Makine okunur kaynak dizini: [kaynaklar.json](veri/kaynaklar.json). Sayılar kategori dosyalarında `source_ids`, birim ve doğrulama durumu taşır. `null` bilinmeyen değerdir; sıfır veya varsayılan piyasa ölçüsü anlamına gelmez. Şema sürümleri ve sentetik test ölçüleri kaynak iddiası değildir. Üretici ürün bilgisinin okunması, ürünün mesh veya fotoğrafını çoğaltma izni sağlamaz.

| Kaynak | Ticari değerlendirme | Önerilen kullanım |
|---|---|---|
| [Infinigen / lisans](https://raw.githubusercontent.com/princeton-vl/infinigen/indoors-stable/LICENSE) | BSD-3-Clause; bildirimler korunmalı, bağımlılıklar ayrıca incelenmeli | Parametrik üretim mantığı ve çevrimdışı geometri adayları |
| [Poly Haven](https://polyhaven.com/license) | İndirilebilir varlıklar CC0; site içeriği ve API erişimi ayrı | HDRI ve PBR dokular; tekil dosya kaydı tut |
| [ambientCG](https://docs.ambientcg.com/license/) | CC0 | Kaplama PBR haritaları; fiziksel tekrar ölçüsü ve renk uzayı kaydı |
| [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | CC0 | Düşük ayrıntılı yardımcı varlık adayları; gerçek dosya ölçeği kontrol edilecek |
| [The Base Mesh](https://www.thebasemesh.com/) | Site CC0 beyanı | Tekil dosya ve ölçü doğrulanınca aksesuar adayı |
| [Sweet Home 3D modelleri](https://www.sweethome3d.com/free-3d-models/) | Tekil model lisansı: Free Art / CC BY; topluca CC0 değil | Atıf ve yeniden dağıtım şartı doğrulanmadan pakete girmez |
| [Sweet Home 3D uygulaması](https://www.sweethome3d.com/license/) | GPL-2.0-or-later; ticari kullanım mümkün, dağıtım yükümlülükleri var | Kapalı kaynak stüdyoya doğrudan gömme kararı verilmedi; veri alışverişi ayrı değerlendirilir |
| [CubiCasa5k](https://raw.githubusercontent.com/CubiCasa/CubiCasa5k/master/LICENSE) | **CC BY-NC 4.0: bu ticari kullanım için kullanılamaz** | Eğitim/katalog paketine alınmayacak |
| RPLAN, 3D-FRONT ve diğer plan/model kümeleri | Bu teslimde ticari izin ve yeniden dağıtım hakkı doğrulanmadı: **kullanılamaz** | İsimlerinin açık kaynak araştırmada geçmesi izin sayılmaz |

Hiçbir büyük varlık paketi indirilmedi. Lisansın uygun olması, dosya boyutu, tablet performansı, üretilebilirlik veya ölçünün doğrulandığı anlamına gelmez. Her kabul edilen dosyada kaynak URL, lisans kopyası, sürüm/hash, birim, bounding box ve yapılan dönüşümler tutulmalı. Poligon ve doku bütçesi hedef tablette ölçülerek belirlenmeli; bu teslimde performans ölçümü yapılmadı.

## Yedi kategori: bulgu ve açıklar

Her kategori için [kategori.schema.json](veri/kategori.schema.json) içindeki ayrı kategori varyantı ve bir örnek veri dosyası var. Bunlar çalıştırılabilir stüdyo komutları veya üretim siparişi değildir.

### Aydınlatma

[aydinlatma.json](veri/aydinlatma.json) avize, sarkıt, aplik, lambader, masa lambası, spot, ray spot, gizli LED ve tablo ışığını ayırır. Ampul lümeni ile armatür çıkışı aynı alan değildir. [Hue ürünleri](https://www.philips-hue.com/content/hue/gb/en/products/smart-light-bulbs/how-bright-are-hue-bulbs.html) ve [Philips spot föyü](https://www.assets.lighting.philips.com/is/content/PhilipsLighting/comf4800-pss-en_ae) yalnız ürün örnekleridir; bütün türler için piyasa sınırı oluşturmaz.

[BS EN 12464-1:2021](https://knowledge.bsigroup.com/products/light-and-lighting-lighting-of-work-places-indoor-work-places-2) kapalı iş yerlerine yöneliktir; bütün konut odalarına zorunlu lüks tablosu diye uygulanmamalı. [Licht evden çalışma rehberi](https://www.licht.de/de/service/aktuelles/news/news-details/damit-im-homeoffice-das-richtige-licht-aufgeht) çalışma yüzeyini çevresinden ayırır. Salon/yatak/banyo lüksleri ve tüm montaj yükseklikleri için yeterli kaynak bulunamadı; boş bırakıldı. Elektrik güvenliği, ıslak hacim koruma bölgeleri ve montaj taşıyıcısı uzman kontrolüdür. Görselde güzel aydınlatma, fotometrik uygunluk kanıtı değildir; IES/LDT ve bakım/kullanım katsayıları gerekir.

### Perde ve jaluzi

[perde.json](veri/perde.json) fon, tül, stor, zebra, jaluzi ve Roma türlerini ayırır. [IKEA pencere rehberindeki](https://www.ikea.com/ca/en/files/pdf/cc/2c/cc2c5baa/window_solutions_hfg_fy25_l1_en.pdf) büzgü çubuk/ray boyuna bağlıdır; pencere camı enine doğrudan çarpılmaz. Stor ve jaluziye kumaş perde büzgüsü uygulanmaz. İş emrindeki 3× üst sınır bu kaynakla doğrulanmadı.

Kumaş hesabı: mekanizma ve montaj yeri → ray/çubuk boyu → büzgü/başlık → panel sayısı → bitmiş boy → dikiş, desen ve çekme payı. İçten takılan storun üretim toleransı ürün föyüne bağlıdır. [STENFRÖ](https://www.ikea.com/ee/en/p/stenfroe-sheer-curtains-1-pair-grey-with-heading-tape-00594888/) panel ölçüsü mevcut; çiftin ağırlığından g/m² türetilmedi. Loa stor kumaşının arama dizinindeki en/gramaj bilgisi, dinamik sayfada doğrulanamadığı için teyit bekliyor. Diğer türlerin piyasa kumaş eni/gramajı ve mekanizma toleransları kaynak açığıdır.

### Halı

[hali.json](veri/hali.json) kaynaklı hazır ölçü örnekleri ve yerleşim önerilerini ayırır. [IKEA rehberi](https://www.ikea.com/ca/en/product-guides/how-to-choose-the-right-rug-size-pub2e7f9fb0/) ile [Türkiye ürün örneği](https://www.ikea.com.tr/urun/virklund-bej-koyu-gri-160x230-cm-buyuk-hali-50517944) bütün pazarın alt/üst sınırları değildir. Ön ayakları veya bütün oturma grubunu halıya alma alternatifleri vardır. Malzeme, dokuma, hav kalınlığı, bakım, kaymazlık ve kapı altı boşluğu seçilecek ürüne bağlanmalı. Türlere bağlı doğrulanmış ürün föyleri henüz yok.

### Duvar ve zemin

[kaplama.json](veri/kaplama.json): boya, duvar kâğıdı, lambiri, taş, parke ve seramik. [Dulux](https://www.dulux.co.uk/en/expert-help/how-much-paint-do-you-need) hesabı ürünün kat ve sarfiyatına bağlar. Bütün boyalara tek m²/L yazılmadı. [Quick-Step](https://www.quick-step.co.uk/en-gb/room-types) kesim kaybı tavsiyesi seramik, taş veya desenli duvar kâğıdına ortak sabit yapılamaz. Rulo/parça ölçüsü ve desen yönü bilinmeden yalnız alan hesabı sipariş miktarı değildir. Net alan, satın alınacak miktar ve fire ayrı gösterilmeli. Islak hacim, yangın ve zemin hazırlığı uygunluğu doku dosyasından çıkarılamaz.

### Aksesuar

[aksesuar.json](veri/aksesuar.json): ayna, tablo, çerçeve, saksı, bitki, vazo, kitap, yastık, örtü ve sepet. Düşük ayrıntılı parametrik geometri önerileri var; hiçbir dosya gerçek boyutu bilinen hazır ticari modelmiş gibi sunulmadı. Kenney/Base Mesh veya Infinigen'den seçilecek her nesnenin dosyası, ölçeği ve lisansı ayrı doğrulanmalı. Bugün ölçülü aksesuar varlığı teslim edilmiş değildir. Kullanıcı tablosunun görseli ve marka sanat eserleri CC0 katalog sayılmaz.

### Mimari unsurlar

[mimari.json](veri/mimari.json): kapı, pencere, pervaz, süpürgelik, kartonpiyer ve tavan tipleri. [JELD-WEN UK föyü](https://www.jeld-wen.co.uk/getmedia/f683f0e3-297e-4f9c-8b7e-eea7587c5231/Simplicity_Data_Sheet.aspx) kanat ölçüsüdür; Türkiye/AB ortak kapı standardı veya net geçiş değildir. [VELUX](https://www.velux.co.uk/products/sizes) örnekleri çatı penceresi dış kasa ölçüleridir. TR/EU için tek evrensel ebat tablosu bulunamadı. Kullanıcı evinin gerçek kaba boşluğu, kasa, kanat ve net geçişi ayrı kaydedilmeli. Taşıyıcı duvarı kaldırma, tesisat değiştirme veya tavan alçaltma onayı asistan tarafından verilemez.

### Konut planı

[plan-kurallari.json](veri/plan-kurallari.json) kaynak türünü özellikle ayırır. Bakanlığın arşiv kopyası ve ilk yayımlanmış yönetmelikteki ölçüler, güncel yürürlükteki konsolide metin diye kullanılamaz. [2025 değişikliği](https://www.tbb.gov.tr/tr/mevzuat-duyurulari/planli-alanlar-imar-yonetmeliginde-degisiklik-yapilmasina-dair-yonetmelik-15) bulundu; güncel tüm değişikliklerle uzman doğrulaması eksik. Bu nedenle arşiv değerleri otomatik yasal doğrulayıcıda devre dışı kalmalı.

[NKBA rehberinin](https://media.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf) mutfak çalışma aralığı, geçiş ve üçgen önerileri sayfa numarasıyla veri dosyasında var; bunlar ABD rehberi olup Türkiye yasal minimumu değildir. Üçgen ölçüsü cihazların merkez-ön noktaları arasındadır. Çok kullanıcılı veya doğrusal mutfakta çalışma bölgeleri de değerlendirilir. Yatak çevresindeki evrensel minimum için doğrulanmış kaynak bulunamadı; halı taşma mesafesi geçiş genişliği yerine kullanılmadı.

## Infinigen: ne alınabilir, ne hazır değil?

[Infinigen Indoors makalesi](https://arxiv.org/abs/2406.11824) çevrimdışı prosedürel varlıklar ve kısıtlı yerleşim için uygun araştırma temelidir. Sabit commit ve gerçek dosya yolları [infinigen-envanter.json](veri/infinigen-envanter.json) içinde tutulur; dal adı tek başına kalıcı sürüm değildir. Lamba, halı, kapı, pencere, vazo, kitap ve küçük bitki dosyaları yol düzeyinde doğrulandı. Perde üreticisi var varsayımı doğrulanmadı; yokluğu bütün kodda içerik taramasıyla ispatlanmış da değildir.

Önerilen taşıma sınırı:

| Bölüm | İlk yol | Tarayıcıya taşıma değerlendirmesi |
|---|---|---|
| Halı, basit çerçeve/kitap, dönel vazo/saksı | Ölçülü basit geometriyi mevcut Three tabanıyla oluştur | Parametre/geometri mantığı JS ile yeniden uygulanabilir; aynı rastgelelik ve ölçek testleri gerekir |
| Kapı/pencere ve profil | Proje açıklığına uyan parametrik geometri | Başlı başına yeniden uygulama; Blender Python dosyasını doğrudan import etmek mümkün değil |
| Lamba gövdesi | Çevrimdışı üret, sadeleştir, glTF | Mesh ile gerçek ışık/fotometri ayrı bileşenler olmalı |
| Bitki, karmaşık kumaş ve materyal düğümleri | Çevrimdışı üretim ve ayrıntı azaltma | Blender/bpy, geometry node, shader ve diğer bağımlılıkların doğrudan JS portu ilk aşama için gereksiz |
| Oda yerleştirme çözücüsü | Önce AURA'nın sabit ölçülü ev sözleşmesi | Tüm fizik/çözücü motorunu tarayıcıya taşıma taahhüdü verilmedi |

Önce ölçülü yer tutucu ve basit geometri; sonra yalnız gerekli varlıklar. glTF dosyası şekil/malzeme taşır; onay, fiyat, metre, müşteri notu veya evin bütün semantiğinin ana kaydı olmaz.

## Bütün ev sözleşmesi ve görsel yolu

[ev-projesi.schema.json](veri/ev-projesi.schema.json) ve [ornek-ev-projesi.json](veri/ornek-ev-projesi.json) önerilen başlangıçtır. Örnek iki bağlantılı mekân, ortak duvar, açıklık, korunacak koltuk, önerilen tekstil/ışık/aksesuar, not ve tasarımcı incelemesi içerir. Ölçüleri tamamen sentetiktir. Eksik giriş/diğer odalar/tesisat nedeniyle gerçek veya tamamlanmış ev projesi değildir; kullanıcı evi geldiğinde bütün mekânların kaydı zorunludur.

- Proje → katlar → mekânlar; ortak koordinat sistemi, tek kimlikli duvarlar ve açıklıklar. Bir duvarı iki oda ayrı ayrı değiştirip çelişki üretmemeli. Tam duvar birden fazla odaya uzanıyorsa net yüzey/metraj için oda sınırında parçalama veya kırpma gerekir.
- Ölçüde değer, birim, dayanak ve belirsizlik ayrı. Fotoğraf tahmini ile tasarımcının doğruladığı ölçü eşit değildir. Fotoğrafta bilinmeyen uzunluk `null` kalır; görselden uydurulan santimetre kesin ölçü olarak kaydedilmez. Konum ve oda poligonları da `geometry_status` doğrulanmadan üretime gidemez.
- Mevcut eşya için koru/yenile/değiştir/kararsız kararı; fotoğraf ilişkisi ve yeniden kullanılan tek nesne kimliği. Kullanıcının koruma kararı sessizce ezilmez. Birden fazla fotoğraftaki aynı koltuk tekrar sipariş edilmez.
- Fotoğraflar özel depoda; JSON yalnız nesne kimliği ve oda bağlantısı taşır. Gerekli dosya türü/içerik/ebat sınırı, erişim denetimi, EXIF temizliği, silme ve saklama süresi entegrasyonda tanımlanır. Proje kullanımı, model eğitimi izni değildir. Bu teslim hiçbir fotoğrafı haricî modele göndermedi.
- JSON Schema biçimi denetler; kimlik ilişkileri, ortak duvar geometrisi, self-intersection, çarpışma, dönen kapı, açık çekmece, dolaşım, eşya taşıma yolu, seviye ve tesisat için ayrıca semantik doğrulayıcı gerekir. Şema geçmesi uygulanabilirlik onayı değildir.
- Asistan yalnız sürümlü öneri üretir. Beklenen revizyon tutmazsa değişiklik reddedilir. Önizleme → kullanıcı kabulü → doğrulama → tasarımcı incelemesi. Son onay tasarımcının kimliği ve revizyonuna bağlıdır; geometri/malzeme değişince önceki onay düşer.
- Bütçe bütün eve aittir; oda ve kalem toplamlarıyla izlenir. Para birimi, fiyat tarihi, vergi/nakliye/montaj kapsamı ve yaklaşık/kesin durumu olmadan toplam fiyat vaat edilmez. Kaynaklı boyut verisi fiyat teklifi değildir.

[asistan-sozlesme.json](veri/asistan-sozlesme.json) eğitim/test/canlı kullanımda ortaklaştırılacak işlem ve yanıt biçimi önerisidir; mevcut ürün komut API'sine uygulanmış değildir. Metin yanıtı, sorular, varsayımlar, deliller ve önerilen değişiklikler birlikte korunur. Kullanıcı dili ile tasarımcıya Türkçe özet ayrı tutulur; orijinal not silinmez. Tasarımcının Türkçe cevabının müşteriye çevrilmesi aynı proje konuşmasına bağlanabilir; bu teslim çeviri servisi kurmaz.

Qwen'e piksel ürettirmek şart değil: **konuşma → yapılandırılmış öneri → doğrulanan sahne → stüdyo renderı**. Fotoğrafı anlamak için görüntü destekli bir model/runtime ayrıca gerçek örneklerle sınanmalıdır; yerel kurulumun bu yeteneği var diye kabul edilmez. İşlemci ve RAM bilgisi tek başına hız veya kalite kanıtı değildir.

İlk teslimde ölçülü plan, etiketli yerleşim ve mevcut renderer yeterlidir. Sonra aynı sahne çevrimdışı Blender görüntüsüne dönüşebilir; yeni sürekli render sunucusu zorunlu değil. Üretken görsel istenirse yalnız isteğe bağlı fikir görseli olmalı, ölçülü planın yerini almamalı ve model/servis seçimi ayrıca yapılmalı. Görüntü üretimi mevcut eşyayı, pencereyi veya malzemeyi değiştirebilir; görsel ile plan arasındaki fark tasarımcıya görünmeli.

## IFC, Sweet Home 3D ve veri alışverişi

Başlangıç ana kayıt formatı AURA'nın sürümlü JSON'u olsun. [IFC resmî belgelerine](https://ifc43-docs.standards.buildingsmart.org/) erişim bu oturumda başarısızdı; standart düzeyinde alan eşlemesi veya uyumlu IFC export doğrulandı denemez. IFC bina/kat/mekân/eleman alışverişi için sonraki adaptör adayıdır. Sweet Home 3D içe aktarma da uygulama/model lisanslarından bağımsız değerlendirilip kayıplı dönüşümler açık gösterilmelidir. Plan görseli veya bir araştırma veri seti, semantik ve ölçülü ev sözleşmesinin yerine geçmez.

Şema ileride tesisat, merdiven, balkon, niş/eğim, çokgen odalar, farklı kotlar, radyatör, priz/anahtar, ısıtma ve erişilebilirlik bilgileriyle büyütülmeli. Mevcut örnek bunları kapsıyor diye kabul edilmemeli. Bütün eve kabul geçidi, tüm gerçek mekânların envanteri ve bilinmeyenlerin açık listesi olmalı.

## Claude için uygulama sırası ve kabul koşulları

1. **Bütün ev dosyası ve keşif görüşmesi:** mekân listesi, katlar, mevcut fotoğraflar, korunacaklar, ihtiyaçlar ve bütçe. Kayıt/yeniden açmada hiçbir oda veya not kaybolmasın. Ölçüsüz fotoğrafa kesin ölçü atamasın. Tasarımcı son kararı açıklaması görüşme başında ve devirde görülsün; her cümleyi tekrar eden uyarıya dönüşmesin.
2. **Sabit geometri ve deliller:** ortak duvar/açıklık ilişkileri, fotoğraf eşleştirme, belirsizlik ve soru sorma. Dikdörtgen olmayan oda, iki odalı ortak duvar, birden fazla kat ve çelişen ölçü senaryoları kabul testinde bulunsun. Odalar eşya için büyümesin; kullanıcının ölçüsü izinsiz değişmesin.
3. **Proje katmanı:** mobilya yanında halı, perde, ışık, kaplama ve aksesuar için yer tutucu/ölçülü basit geometri. Bunlar site ürün kataloğu değil. Aynı mevcut eşya farklı fotoğraflarda tek kayıt olsun. Kapıyı kapatan halı/koltuk ve açılamayan dolap örneği yakalansın. Lisansı/ölçeği doğrulanmamış mesh yer tutucuyu sessizce değiştirmesin.
4. **Asistan araçları ve güvenilirlik:** bütün ev bağlamı → sorular → önerilen işlemler → kullanıcı kabulü. Türkçe/İngilizce istek, belirsiz ölçü, korunacak eşya, yanlış araç, eski revizyon ve fotoğraf içindeki talimat senaryoları sınansın. Mevcut ürün `reply` alanının kaybolması düzeltilsin. Asistan tasarımcı onayı veya yapı güvenliği belgesi uyduramasın.
5. **Tasarımcıya devir:** sürümlü ev planı ve oda görünüşleri, fotoğraf/delil listesi, mevcut/yeni eşya ayrımı, mobilya çizimleri, kaplama/tekstil/ışık listeleri, belirsiz metraj, bütçe kapsamı ve açık sorular tek pakette. Kesim listesi yalnız tasarımcının üretim doğrulamasından geçen mobilyalar için. Müşteri orijinal notu ve Türkçe karşılığı birlikte. Yetkisiz başka kullanıcı paketi açamasın.
6. **Görseller ve sonraki ölçüm:** önce stüdyo sahnesi-plan tutarlılığı, ardından isteğe bağlı çevrimdışı kaliteli render. Gerçek ev örneklerinde başarısız araç kararları toplanmadan ve sözleşme sabitlenmeden Qwen eğitimi veya kiralık GPU başlamasın. Üslup eğitimi ile araç kullanımı başarısızlığı ayrı ölçülsün.

İlk çalışan sürümün kabul örneği tek oda olmamalı: bağlantılı farklı mekânlar, ortak malzeme/bütçe, korunacak mevcut eşya, tekstil/aydınlatma ve tasarımcı devir paketi aynı proje üzerinden tamamlanmalı. İlk sürüm bütün evi kapsarken görsel ayrıntı ve otomasyon kademeli artabilir.

## Açık araştırma işleri ve doğrulama durumu

Ölçülü tekil aksesuar dosyaları, bütün ışık türlerinde montaj/ürün ölçüsü aralıkları, tüm perde mekanizmalarının föyleri, halı malzeme/dokuma föyleri, kaplama parça ölçüleri, TR/AB mimari ürün referansları, yatak çevresi ve güncel konsolide mevzuat eksik. Bunlar `kaynak bulunamadı` veya teyit bekliyor olarak veri dosyalarında görünür. Bilgi açığı kullanıcıya kesin uygulama kararı olarak taşınamaz; ilgili tasarımcı/tedarikçi incelemesini engeller.

Bu teslimin kontrolü: JSON biçimi ve şemalar, kategori örneklerinin şemaya uyması, sentetik ev örneğinin şemaya uyması, kaynak kimlikleri ve örnekteki proje referansları. Site davranışı veya görsel performans değişmediği için uygulama testi çalıştırılması bu teslimin doğrulaması sayılmadı. Ayrıntılı kontrol sonucu PR açıklamasında verilir.
