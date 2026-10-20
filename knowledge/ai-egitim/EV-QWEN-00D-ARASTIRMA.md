# EV-QWEN-00D — veri ve yöntem araştırması

20 Ekim 2026. Bu inceleme veri lisansını, kod lisansını ve makale lisansını ayrı değerlendirir. Belirsiz izin eğitim, uyarlama ve ürün çıktısı için yeterli değildir. Aşağıdaki sayılar yayıncı beyanıdır; bu teslimin işlediği kayıt sayıları dönüşüm manifestindedir.

Makine tarafından okunabilen ayrıntılı envanter: [real-dataset-registry.json](../ev-projesi/veri/real-dataset-registry.json). Her kayıtta ölçek, biçim, oda/açıklık/kat bilgisi, kalite, ticari kullanım ve türev model dağıtımı kararı bulunur.

| Kaynak / birincil bağlantı | Kapsam ve temsil | Kullanım kararı |
|---|---|---|
| [Swiss Dwellings v3](https://zenodo.org/records/7788422) | İsviçre; 45.176 daire beyanı; metre cinsinden WKT oda, duvar, açıklık ve donatı poligonları, kat kimlikleri | Veri CC BY 4.0. Bu teslimin kanonik kaynağı. Atıfla ticari uyarlama ve lisanslı veri üzerinden model geliştirme mümkün. Kaynak işleme yazılımının AGPL lisansı veri lisansından ayrıdır; o kod kopyalanmadı. |
| [Modified Swiss Dwellings v2](https://data.4tu.nl/datasets/e1d89cb5-6872-48fc-be63-aadd687ee6f9/2) | İsviçre; 5.372 kat planı, 18,9 binin üzerinde birim; raster, vektör ve erişim grafı | Yayıncı JSON-LD lisansı CC BY 4.0. Uygun alternatif; aynı Swiss kaynağının 5,5 GB türevi ayrıca indirilmedi. Veri izni taban model kodunu/ağırlığını kapsamaz. |
| [ResPlan](https://github.com/m-agour/ResPlan) | 17.000 metrik vektör planı; 17 etiket, kapı/pencere, graf; ülke güvenilir biçimde belirlenemedi | [Lisans](https://github.com/m-agour/ResPlan/blob/main/LICENSE): yazarların katkıları CC BY 4.0, kod MIT. Orijinal ilan görselleri lisans kapsamı dışında. Kapsam ve kaynak hakları nedeniyle bu turda korpusa alınmadı. Yayıncı yakın tekrar ve eski bölmelerde veri sızıntısı bildiriyor. |
| [O-ESD](https://doi.org/10.4121/d8a5eb90-0269-4a4b-b672-f1dd9b351836.v1) | İsviçre çevre/yön bilgileriyle zenginleştirilmiş planlar | Birincil sürüm lisansı doğrulanamadı; kullanılmadı. |
| [ModRes](https://arxiv.org/abs/2610.17178) | ResPlan'den temizlenen 8.431 plan; 12 Ekim 2026 tarihli makale | Makale lisansı veri izni yerine geçmez; sürümün ticari veri izni doğrulanmadı, kullanılmadı. |
| [PUBLICPLAN](https://dataverse.csuc.cat/dataset.xhtml?persistentId=doi:10.34810/data1633) | İspanya; mimari yarışmalardan 2.446 plan, çok kanallı raster | Ölçek ve ticari/türev model izni doğrulanamadı. Yayıncı erişiminde insan doğrulama sayfası çıktı; aşılmadı, kullanılmadı. |
| [CABE dwelling size](https://www.data.gov.uk/dataset/7a9918d4-ffe9-4123-a669-925830668273/cabe-dwelling-size-study) | İngiltere; 200 ev/daire; oda alanı tabloları ve plan PDF'leri | Katalog OGL diyor. Arşiv dosyalarındaki üçüncü taraf plan hakları ve dosya kapsamı ayrıca doğrulanmadığından ürün planı olarak alınmadı. Alan istatistikleri için sonraki aday. |
| [RCA affordable housing](https://researchonline.rca.ac.uk/6547/) | Altı Avrupa ülkesinde karşılaştırmalı konut tabloları | CC BY-NC; ticari korpusa ve uyarlamaya alınmadı. |
| [CubiCasa5k](https://github.com/CubiCasa/CubiCasa5k) | 5.000 raster plan, oda ve açıklık etiketleri; plan başına ülke/ölçek belirsiz | Veri [CC BY-NC 4.0](https://github.com/CubiCasa/CubiCasa5k/blob/master/LICENSE); kullanılmadı. |
| [RPLAN](https://staff.ustc.edu.cn/~fuxm/projects/DeepLayout/index.html) | 80.788 plan; raster etiket/komşuluk; ülke ve metrik ölçek kesinleştirilmedi | Açık ticari/türev model dağıtım izni doğrulanmadı, başvuru gerektiriyor; kullanılmadı. |
| [LIFULL HOME'S](https://www.nii.ac.jp/dsc/idr/en/lifull/) | Japonya ilan/plan verisi | [Politika](https://www.nii.ac.jp/dsc/idr/en/lifull/documents/lifull_homes-policy.html) kurumsal araştırmayla sınırlı; ticari korpusa alınmadı. |
| [Structured3D](https://structured3d-dataset.org/) | 3.500 sentetik tasarım; 3B geometri ve anotasyon | Özel veri sözleşmesinin ticari/türev dağıtım hakkı doğrulanmadı. Görüntüleyici kodunun MIT olması yeterli değil; kullanılmadı. |
| [3D-FRONT](https://github.com/3D-FRONT-FUTURE/3D-FRONT-ToolBox) | Sentetik döşenmiş iç mekânlar; semantik 3B | [Veri sözleşmesi](https://gw.alicdn.com/bao/uploaded/TB1ZJUfK.z1gK0jSZLeXXb9kVXa.pdf) ticari kullanım ve alt lisans kısıtlıyor; kullanılmadı. |
| [FloorPlanCAD](https://floorplancad.github.io/) | On binin üzerinde CAD planı beyanı; oda/nesne anotasyonları | Asıl proje kapalı; aynadaki lisans asıl hak sahibinin izni sayılmadı. Ticari izin doğrulanmadı, kullanılmadı. |
| [ZInD](https://github.com/zillow/zind) | ABD; 1.575 ev, 2.737 plan; panorama, oda/açıklık/kat geometrisi | Veri akademik ve ticari olmayan araştırmaya açık; kodun Apache 2.0 olması ayrı. Kullanılmadı. |
| [HouseExpo](https://github.com/TeaganLi/HouseExpo) | 35.126 SUNCG türevi sentetik 2B yerleşim | MIT kod temel SUNCG verisinin haklarını çözmüyor; kullanılmadı. |
| [FloorNet](https://github.com/art-programmer/FloorNet) | 155 tarama; raster/vektör plan ve açıklıklar | MIT kod doğrulandı; ham verinin açık ticari/türev dağıtım kapsamı doğrulanmadı, kullanılmadı. |
| [Rent3D](https://www.cs.toronto.edu/~fidler/projects/rent3D.html) | 215 daire; ölçülü planlar ve fotoğraf eşlemeleri | Açık ticari veri izni bulunamadı; kullanılmadı. |
| [MagicPlan / PuzzleFusion](https://sepidsh.github.io/puzzlefusion/) | AR uygulamasından 98.780 ev; oda/kat ilişkileri | Araştırma topluluğuyla paylaşım beyanı ticari izin değil; kullanılmadı. |
| [CVC-FP](https://dag.cvc.uab.es/resources/floorplans/) | 122 raster plan; küçük ayrıştırma kümesi | Birincil indirme/lisans doğrulanamadı; kullanılmadı. |

## Ülke portalları ve müstakil / çok katlı kapsamı

| Ülke | İncelenen birincil kaynak | Sonuç |
|---|---|---|
| Belçika | [Kadastro açık verisi](https://financien.belgium.be/nl/experten-partners/open-patrimoniumdata/datasets/kadastraal-plan) | Parsel/bina kadastrosu iç oda planı değildir. Portal insan doğrulama istedi; aşılmadı. İç mekân ticari plan arşivi doğrulanamadı. |
| Hollanda | [PDOK BAG](https://www.pdok.nl/introductie/-/article/basisregistratie-adressen-en-gebouwen-ba-1) | Bina ve adreslenebilir birim kaydı; oda, kapı, pencere planı yok. Adresler de alınmadı. |
| Almanya | [Berlin LoD2](https://daten.berlin.de/datensaetze/3d-gebaudemodelle-im-level-of-detail-2-lod-2-3c7c49af) | Dış bina kabuğu/çatı; iç mekân planı yerine kullanılamaz. |
| Fransa | [Etalab kadastro](https://cadastre.data.gouv.fr/datasets/cadastre-etalab) | Parsel ve bina dış izi; iç duvar/oda/açıklık içermez. |
| Birleşik Krallık | [CABE](https://www.data.gov.uk/dataset/7a9918d4-ffe9-4123-a669-925830668273/cabe-dwelling-size-study) | Ev ve daire örnekleri var; dosya düzeyi çizim hakları kontrol edilmeden korpusa girmedi. |
| Danimarka | [BBR](https://bbr.dk/bbr-oplysninger-i-bbr) | Yapı/birim özellik kaydı; açık toplu iç plan veri seti değil. Belediye yapı arşivine erişim, yeniden dağıtım izni sayılmaz. |
| İspanya | [PUBLICPLAN](https://dataverse.csuc.cat/dataset.xhtml?persistentId=doi:10.34810/data1633) | İç plan adayı; ticari lisans, ölçek ve erişim henüz doğrulanamadı. |
| İtalya | [Resmî plan görüntüleme kılavuzu](https://assistenzaipocat.agenziaentrate.gov.it/Knowledgebases/New_Sister_TP/attach/Manuale_VisuraPlanimtericaTelematica.pdf) | Malik/yetkili erişimi isteyen kadastro planları açık ticari eğitim arşivi değildir. Kullanılmadı. |

Bu tarama “başka kaynak yok” iddiası değildir. Şu anda doğrulanmış ve içe alınmış kapsam İsviçre'deki tek kat konut birimleridir. Swiss kat kimliklerinden bütün müstakil ev veya katlar arası merdiven bağlantısı uydurulmaz. Çok katlı ZInD/MagicPlan kaynaklarında kullanım izni kapısı açılamadı. Bu istekler araçtan `clarify` döndürür; kullanıcıya doğrulanmış müstakil/çok katlı plan üretilmiş gibi gösterilmez.

## Yöntem kararı

İlk yol: lisanslı gerçek planı getir, oda eşlemesini ve zorunlu graf koşullarını denetle, sınırlı ölçü uyarlaması yap. Döşeme/taşıyıcı veya mevcut ölçülmüş duvar değiştirme izni değildir. Üç yeterli referans bulunmazsa sonuç eksik olarak bildirilir; sentetik şerit planla doldurulmaz.

[HouseDiffusion lisansı](https://github.com/aminshabani/house_diffusion/blob/main/LICENSE) kod ve ağırlıkların ticari kullanımını açıkça yasaklıyor. Depodaki GPL metni bu özel kısıtı kaldırmıyor. [Graph2Plan](https://github.com/HanHan55/Graph2plan) için açık ticari kod izni doğrulanmadı; RPLAN kaynak izni de ayrıca kapalı. [MSD yöntemleri](https://arxiv.org/abs/2407.10121) gerçek karmaşık planlarda MHD ve graf bilgili UNet'i karşılaştırıyor; veri CC BY olsa da bu, uygulama ve ağırlık izni değildir. Bu üçünün hiçbiri mevcut ürün yoluna sokulmadı veya eğitilmedi.

Qwen'in rolü doğal dilden ortak `plan_program` ve revizyon denetimli düzenleme işlemleri çıkarmaktır. Gerçek geometrinin yerine oda poligonu hayal etmesi beklenmez. Küçük CPU modeli için ölçüm ve donanım planı [EV-QWEN-00D-DONANIM.md](EV-QWEN-00D-DONANIM.md) dosyasındadır. Bu tur F'nin kaynak/maliyet raporu seçeneğini kullanır; dil modeli doğruluğu veya eğitim sonucu iddia etmez.
