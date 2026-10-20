# EV-PLAN-ARAŞTIRMA-02 — Ölçülü bütün ev krokisi

Tarih: 2026-10-20 · Temel: `main@658f13a` · İş emri: [EV-CODEX-02](EV-CODEX-02.md)

## Sonuç ve kapsam

Öneri: mevcut Three.js motorunu koru; önüne bağımsız bir 2B plan editörü ve tek geometrik kayıt koy. Başlangıç akışı **plan/kroki yükle → bilinen uzunlukla ölçeklendir → duvar ve açıklıkları doğrula → aynı veriden 3B üret** olsun. Görselden otomatik çıkarım yardımcı taslaktır; ölçü ve topoloji doğrulamasının yerine geçmez. Bütün ev oda oda ilerlese de ortak duvar, kat ve dolaşım tek projede kalır. Son karar tasarımcıdadır.

Bu teslim yalnız araştırma, görsel referans bağlantıları ve örnek veridir. Kod, `assets/` veya ekran görüntüsü eklenmedi. Projeler kurulup tablet üzerinde çalıştırılmadı; belge beyanı, kaynak incelemesi ve AURA önerisi birbirinden ayrılmıştır. Lisansı uygun görünen parça bile mevcut bağımlılıklar ve seçilen dosyanın bildirimi kontrol edilmeden alınmamalı.

**Bağımlılık:** Temel main'de EV-01 şeması henüz yok; [PR #108](https://github.com/rahmigkt/auraporject-website/pull/108), `be5ec226aa8827e71a133ea233a12eaab9806488` içindeki `ev-projesi.schema.json` v0.1 kullanıldı. Şema bu PR'a kopyalanmadı. #108 veya eşdeğer şema birleşince örnek tekrar doğrulanmalı. Bu belge uygulanmış editör veya çalışan tarama özelliği değildir.

## Açık kaynak editörler: sekiz proje

Son etkinlik aşağıda varsayılan dalın **son commit tarihi (UTC)** olarak verilir; yıldız/issue etkinliğiyle karıştırılmaz. Tam SHA, lisans adresi ve kontrol yöntemi [plan-kaynak-inceleme.json](veri/plan-kaynak-inceleme.json) içindedir. Sweet Home 3D için commit doğrulanamadığından resmî sayfa güncellemesi ayrı belirtilmiştir. Blueprint-js, blueprint3d'nin türevidir; iki bağımsız algoritma kanıtı sayılmaz.

| Proje / lisans / etkinlik | Teknoloji ve geometri | 2B → 3B; telefon/tablet | AURA'ya alınabilecek parça ve sınırı |
|---|---|---|---|
| [react-planner](https://github.com/cvdlab/react-planner), [MIT](https://github.com/cvdlab/react-planner/blob/master/LICENSE); 2019-11-03 | React, Redux, Immutable, SVG ve Three. Layer içinde vertex/line; açıklık line'a bağlı hole ve offset | Katalog elemanı 2B/3B temsili üretir. Dokunmatik doğrulama bulunamadı; masaüstü demo yeterli kanıt değil | `src/utils/snap*.js` yakalama yaklaşımı; `src/class/hole.js` bağlantı modeli. Duvar üreticisinde kutu boşluklarla CSG çıkarımı var. Eski Three/CSG ve tüm React yapısı kopyalanmamalı |
| [blueprint3d](https://github.com/furnishup/blueprint3d), [MIT](https://github.com/furnishup/blueprint3d/blob/master/LICENSE.txt); 2016-07-10 | TypeScript, jQuery, eski Three; Corner–Wall–Room grafı; duvara bağlı in-wall item | Duvar yüzeylerinde Shape/holes, oda zemini ve 3B görünüm. Tablet desteği doğrulanmadı | `src/model/corner.ts`: köşe birleştirme, eksene yakalama ve bağlı duvarı birlikte taşıma; `src/three/edge.ts`: yerel duvar düzleminde açıklık. Eski Geometry/Face3 API'si taşınmaz |
| [FloorspaceJS](https://github.com/NatLabRockies/floorspace.js), [özel BSD-3 koşullu metin](https://github.com/NatLabRockies/floorspace.js/blob/develop/LICENSE.md); 2026-02-09 | Vue tabanlı JS editör; vertex/edge/face, kat ve bileşen ilişkileri; enerji modelleme odaklı | JSON geometri ve ayrı 3DViewer/OpenStudio yolu; mobilyalı iç tasarım çözümü değil. Dokunmatik saha testi yok | `src/store/modules/geometry/mergeEdges.js`, `createFaceFromPoints.js`, `src/utilities/checkGeometry.js`, `Grid/snapping.js`: ortak kenar/topoloji ve yakalama inceleme adayları. Dosya yolları doğrulandı; tüm algoritmalar çalıştırılmadı |
| [Arcada — mehanix](https://github.com/mehanix/arcada), [Apache-2.0](https://github.com/mehanix/arcada/blob/master/LICENSE); 2026-10-14 | React, Pixi, Zustand, Mantine; özel Wall/WallNode/WallNodeSequence; kapı/pencere ekleme | 2B editör. Hazır Three 3B üretimi doğrulanmadı. Cross-platform beyanı var; gerçek tablet jestleri kanıtlanmadı | `src/editor/editor/actions/` ve `objects/Walls/WallNode.ts`: işlem/geri alma ve bağlı düğüm yaklaşımı. Apache bildirim ve varsa NOTICE yükümlülükleri korunmalı |
| [Arcada Planner — fedepaj](https://github.com/fedepaj/arcada-planner), [MIT](https://github.com/fedepaj/arcada-planner/blob/main/LICENSE); 2026-03-22 | React, Konva, Zustand; node/edge duvar; kapı/pencere katalog sembolleri ve bağımsız katlar | Esasen 2B; açıklığın duvarı geometrik olarak delmesi ve 3B yok/doğrulanmadı. Sağ tıkla pan gibi masaüstü kontroller var | `ARCHITECTURE.md`: hafif kayıt ve kat/nesne düzenleme akışı. Sağ tık etkileşimi telefona aynen alınmaz; resmî olmayan yeniden yazım, özgün Arcada ile aynı proje sayılmaz |
| [homeRoughEditor](https://github.com/ekymo/homeRoughEditor), [MIT](https://github.com/ekymo/homeRoughEditor/blob/master/LICENSE); 2023-07-01 | Vanilla JS, SVG, jQuery/Bootstrap; duvar ve inWall nesneleri | 2B; belgelenmiş 3B yol yok. README'de TouchScreen hâlâ TODO | `engine.js`, `editor.js`, `qSVG.js`: duvara izdüşüm, açıklık sınırı ve ölçü etiketi. Global/mouse odaklı uygulama taşınmaz; geometrik yaklaşım seçilerek uyarlanır |
| [blueprint-js](https://github.com/aalavandhaann/blueprint-js), [MIT](https://github.com/aalavandhaann/blueprint-js/blob/master/LICENSE); 2024-11-20 | Blueprint3D türevi ES6; Pixi/Three, corner/wall/item modeli | 2B/3B ve glTF/VR yolu belgeli. Dokunmatik kabul testi yok; README VR'da çakışan yüzey titreşimini bildiriyor | `src/scripts/model/cornergroups.js`, `viewer2d/CornerGroupTransform2D.js`: bağlı köşeyi grup olarak düzenleme adayı. README ticari uygulama için iletişim notu içeriyor; tüm bağımlılık/model lisansları ayrıca incelenmeli, paketi topluca alma |
| [Sweet Home 3D](https://sourceforge.net/projects/sweethome3d/), [GPL-2.0-or-later](https://www.sweethome3d.com/license/); [indirme sayfası](https://www.sweethome3d.com/download/) son güncelleme 2025-05-05 | Java masaüstü ve JS/WebGL çevrimi; bağlı duvarlar, duvara takılan kapı/pencere, odalar ve katlar | 2B değişikliği eşzamanlı 3B; üstten ve sanal ziyaretçi. Mobil sürümleri resmî belgede var; AURA tablet performansı ölçülmedi | **Yalnız fikir referansı; iş emri gereği kod alınmaz.** Ölçekli arka plan, açıklık yerleştirme ve kat akışı incelenebilir |

Floorspace'in GitHub SPDX cevabı `NOASSERTION`; metin okunduğunda telif/bildirim, ikili dağıtım bildirimi ve onaysız destek beyanı yasağı içeren ticari yeniden dağıtım izni görülüyor. “Lisans yok” veya standart SPDX tespiti kesinmiş gibi yazılmadı. İzinli projeler için de seçilecek committe dosya/alt paket lisansı ve bağımlılık analizi şart. GPL/AGPL/NC kodu bu iş emri kapsamında alınmayacak. Bu teslimde hiçbir üçüncü taraf uygulama kodu kopyalanmadı.

**Seçim:** Çekirdeği AURA'nın mevcut JS/Three yapısında tut. Blueprint3D'nin düğüm grafı, Floorspace'in ortak kenar/topoloji yaklaşımı ve homeRoughEditor'ün SVG ölçü/izdüşüm mantığı dar inceleme adaylarıdır. Bütün bir React/Vue/Pixi editörünü eklemek, mevcut stüdyonun üstüne ikinci kayıt ve render sistemi getirir. Yeniden kullanılacak parçanın doğruluğu ayrıca sınanır; kaynak projenin yıldızı veya yakın commit tarihi doğruluk garantisi değildir.

## Görsel yön: mimari sunum sadeliği

Kaynaklar burada **bağlantılı referanstır**; ekran görüntüsü, sembol veya ücretli uygulama varlığı kopyalanmadı. Kesin AURA renkleri, çizgi değerleri ve yazı boyutları normdan aktarılmadı; [plan-stili.json](veri/plan-stili.json) içinde özgün tasarım hedefi olarak işaretlidir.

| Öğe | AURA önerisi | Görsel/kaynak ve neye bakılacağı |
|---|---|---|
| Duvar ve poşe | Fiziksel kalınlık gerçek geometriye bağlı; kesilen duvar koyu dolgu, mobilyadan daha güçlü kontur. Mimari plan ile dekoratif illüstrasyonu ayır | [RoomSketcher 2B örnekleri](https://www.roomsketcher.com/features/2D-floor-plans/): siyah-beyaz dairede dolu duvar ve sade eşyalar |
| Çizgi ağırlığı | Kesilen yapı → açıklık → eşya → ölçü/tarama hiyerarşisi. Editörde CSS px, çıktıda kâğıt mm ayrı | [RoomSketcher özelleştirme](https://www.roomsketcher.com/blog/customize-your-2d-floor-plans/): boş, sabit donatılı ve mobilyalı plan ayrımı |
| Kapı/pencere | Boşlukta kasa; menteşeden kanat ve açılma yayı. Menteşe yönü bilinmiyorsa belirsiz göster; yay uydurma | [Floorplanner resmî kılavuzu](https://cdn.floorplanner.com/static/brochures/FloorplannerManualEN.pdf): açıklık ve ölçülü plan örnekleri; [Sweet Home 3D kullanıcı rehberi](https://www.sweethome3d.com/users-guide/): duvara yönlenen açıklık |
| Oda adı ve m² | Oda içinde ad + küçük net alan. Alan bitmiş iç yüzlerden hesaplanır; brüt veya ilan alanı diye sunulmaz | [RoomSketcher 2B sayfası](https://www.roomsketcher.com/features/2D-floor-plans/): oda adı, alan ve ölçülerin ayrı katmanları |
| Ölçü zinciri | Açıklık/parça, net oda ve dış toplam ölçüler ayrı; eksen/bitmiş yüz etiketi zorunlu. Metin çakışınca geometri değil etiket yerleşimi değişir | [Floorplanner kılavuzu](https://cdn.floorplanner.com/static/brochures/FloorplannerManualEN.pdf), Dimension Settings: otomatik ölçü ve görünüm ayarları |
| Mobilya | Aynı 3B ürünün gerçek footprintinden sade üst görünüş; gölgeli katalog ikonu değil | [RoomSketcher sabit donatı/mobilya seçenekleri](https://www.roomsketcher.com/blog/customize-your-2d-floor-plans/) |
| Zemin | Soluk düz ton ve seyrek yönlü tarama; render dokusunu planın altına yüksek ayrıntıyla basma | Aynı RoomSketcher sayfasındaki malzemeli/renkli plan karşılaştırmaları; marka taraması kopyalanmaz |
| Renk | İş emrinin krem kâğıt, koyu mürekkep, kiremit vurgu yönü. Vurgu seçim/inceleme için; her oda rengârenk değil | Marka kaynağı: EV-CODEX-02. [RoomSketcher renk seçenekleri](https://help.roomsketcher.com/hc/en-us/articles/360014145197-2D-Floor-Plans-Choose-Colors-for-Your-Floor-Plans) katman bazında özelleştirmeye referans |
| Sade 2B/3B | Tek plan, görünüm değiştirici; ayrı ve çelişen odalar üretme | [Planner 5D 2B akışı](https://planner5d.com/use/2d-floor-plan): oda şablonu, açıklık/eşya ve 3B geçiş görselleri; [Apple RoomPlan](https://developer.apple.com/documentation/roomplan/providing-custom-models-for-captured-rooms-and-structure-exports): sade mimari ve nesne hacimleri |

Belirsizlik yalnız renkle anlatılmamalı: kesikli çizgi ve “ölçü bekleniyor” etiketi birlikte olsun. Küçük ekranda tüm ölçüler aynı anda gösterilmesin; seçili duvarın ölçüsü ve alt panel öncelikli olsun. Ekran yakınlaştırması fiziksel duvar kalınlığını veya kaydedilmiş ölçüyü değiştirmesin. Baskıda çizgi kalınlığı kâğıt uzayında kalırken geometri seçilen ölçekte çizilsin.

## Telefonda ve tablette etkileşim

Aşağıdaki akışlar kaynak davranışlarından türetilmiş **AURA önerileridir**; kaynak uygulamalarda aynen test edildiği iddia edilmez. Kalem/fare desteği ek olabilir; hiçbir zorunlu adım hover, sağ tık, çift tık veya klavye kısayoluna bağlı kalmasın.

### Önce planı yükleyerek başlama

Referans: [magicplan Import and Draw](https://help.magicplan.app/import-and-digitalize-an-existing-floor-plan), [Sweet Home 3D arka plan rehberi](https://www.sweethome3d.com/users-guide/).

1. Kullanıcı katı seçer, planın fotoğrafını veya çizimini yükler. Perspektifli kâğıt fotoğrafında önce kırpma/düzeltme yapılır; okunamayan ölçü soru olarak kalır.
2. Bilinen bir duvarın iki ucu işaretlenir, gerçek uzunluk girilir. Mümkünse farklı yöndeki ikinci ölçüyle ölçek/tarama bozulması kontrol edilir. Serbest elle oransız çizimde tek uzunluk bütün planı güvenilir kılmaz.
3. Arka plan soluk ve kilitli görünür; duvarlar üstüne çizilir. Yapay zekâ varsa çizgi/oda önerisi üretir, kullanıcı kabul etmeden gerçek geometriye yazmaz.
4. Duvarın eksen mi iç yüz mü olduğu belirtilir; açıklıklar ve oda bağlantıları tek tek doğrulanır. Oda fotoğrafları bu planın dayanaklarına eklenir; görünmeyen oda uydurulmaz.
5. Ölçek değişirse etkilenen ölçü ve onaylar önizlenir, yeni revizyon oluşur. Kullanıcıya farkları göstermeden bütün ev esnetilmez.

### Duvar çizme ve şablon

Referans: [Planner 5D](https://planner5d.com/use/2d-floor-plan), [Sweet Home 3D çizim rehberi](https://www.sweethome3d.com/users-guide/), blueprint3d Corner kaynağı.

- “Duvar çiz” aracı → başlangıca dokun → uç konumunu göster → sayısal uzunluk/açı → onay. Sürükleme ikincil yöntem olsun; parmak noktanın üstünü örtmesin diye büyüteç/ayrı ölçü etiketi önerilir.
- Yakalama önceliği mevcut köşe, duvar izdüşümü, diklik, ızgara. Tolerans ekran pikseline bağlıdır; yakınlaştırınca metrelerce yapışma olmasın. Sayısal giriş ızgarayı geçersiz kılar. Diklik kapatılabilir; eğri/sapmış eski ev zorla dikdörtgene çevrilmez.
- Dikdörtgen şablonda iki iç ölçü; L şablonda dış kollar ve girinti ölçüleri girilir. Şablonlar aynı duvar grafını üretir. Birbirine eklenen iki şablon ortak duvarı çoğaltmaz; birleşim ve çelişen ölçüler gösterilir.

### Köşe, açıklık ve kat

Referans: blueprint3d `Corner.move/mergeWithIntersected`, [Arcada akışı](https://github.com/mehanix/arcada), [homeRoughEditor engine](https://github.com/ekymo/homeRoughEditor/blob/master/engine.js), [Sweet Home 3D rehberi](https://www.sweethome3d.com/users-guide/).

- Köşeyi seç → açık kilidi düzenleme izniyle kaldır → bağlı duvarları birlikte önizle → açıklıkların yeni konumunu ve komşu odaları doğrula → tek işlemde onayla. Çakışma varsa geri al; oda poligonu eski haliyle kalmasın.
- Kapı/pencere seç → duvara dokun veya sürükle → duvar doğrultusuna oturt → başlangıca mesafe/genişlik/yükseklik/denizlik gir → menteşe ve yön seç → onay. Açıklık sınır dışına taşıyor veya başka açıklıkla çakışıyorsa engelle. Sadece sembolü duvar üstüne koymak 3B boşluk açıldığı anlamına gelmez.
- Kat ekle → adı ve kotu gir → mevcut katı görünür referans olarak seç → bağımsız duvar/oda kimlikleri oluştur. Kat kopyalama yeni kimlikler üretir; ortak binanın iki katı aynı duvar nesnesini yanlışlıkla paylaşmaz. Merdiven ve döşeme boşlukları sonraki şema genişlemesidir.
- Çizimde tek parmak araç eylemi; iki parmak pan/pinch. Seçim modunda istemsiz çizme engellenir. Görünür iptal, geri al/ileri al, yakınlaştır ve sayısal düzenleme düğmeleri bulunur. `plan-stili.json` hedefleri uygulanırken erişilebilirlik ve cihaz testi yapılır.

## Tek geometri: 2B'den 3B'ye

Önerilen kaynak veri: kat ve duvar grafı; 2B SVG/Canvas ve Three geometrisi bunun türevidir. 3B mesh, JSON'dan bağımsız ikinci ölçü deposu olmasın.

1. Duvar eksenlerini kalınlığın yarısı kadar iki yana offsetle; köşe birleşimini üret. T ve çapraz birleşimde tek düğüm/ayrılmış segmentler kullan. Sivri açıda sınırsız miter yerine sınırlama/bevel gerekir. Duvar yükseklikleri ve kotlar kat verisinden gelir. Oda poligonu döşemeyi, duvar kalınlık poligonu duvarı tanımlar; oda poligonunu extrude etmek içi dolu bina üretir.
2. [Three ExtrudeGeometry](https://threejs.org/docs/pages/ExtrudeGeometry.html) ile duvar plan kesitini yükselt. [Shape](https://threejs.org/docs/pages/Shape.html) dış/boşluk winding yönünü tanımlar. Penceredeki düşey boşluk, planın üstten poligonuna delik eklemekle doğru oluşmaz; açıklığın duvarın yerel uzunluk–yükseklik düzleminde işlenmesi gerekir.
3. **İlk yol: parçalı duvar.** Açıklıkların yatay/düşey sınırlarından duvarı dolu dikdörtgen hücrelere ayır; boş hücreyi üretme. Pencere altında parapet, üstünde lento; kapı altında eşik/boşluk ürün tanımına göre. Yan yüzler ve iç söveler kapatılır. Bu yöntem dikdörtgen açıklıklarda CSG maliyetini ve bozuk üçgenleri azaltan tasarım önerisidir; mevcut uygulama değildir.
4. Alternatif: duvar yüzeyini delikli Shape olarak triangulate edip iki yüz ve söveleri üret. [Blueprint3D edge kaynağı](https://github.com/furnishup/blueprint3d/blob/master/src/three/edge.ts) bunun eski API örneğidir. CSG, kemerli/karmaşık boşluklarda ayrıca değerlendirilebilir; [react-planner üreticisi](https://github.com/cvdlab/react-planner/blob/master/src/catalog/factories/wall-factory-3d.js) CSG yaklaşımını gösterir. İlk dikdörtgen kapı için tüm CSG motorunu şart koşma.
5. Süpürgelik iç bitmiş duvar yüzünde ilerler; kapı aralıkları çıkarılır, köşelerde birleşir. Pervaz açıklık çevresine bağlanır; duvar değişince tekrar türetilir. Pencere altındaki süpürgelik ancak açıklık yere inmiyorsa sürer. Profil ve kaplama ayrı nesneler; her renderda yeni proje öğesi eklenmez.
6. Tavan oda poligonundan üretilir, kat yüksekliğine yerleştirilir. Üstten makette görünüm için gizlenir; oda kamerasında görünür. Gizleme bina geometrisini silmez. Asma tavan, değişen kot ve merdiven boşluğu EV-01 v0.1'de eksik olup ayrıca tasarlanmalıdır.

### Kameralar ve performans

- **Oda kamerası:** oda seç → geçerli bir iç konum ve bakış hedefi → yön değiştir. “Köşe” seçimi duvar içine kamera sokmamalı. Dar/geniş odada görüş açısı seçimi kullanıcı kontrolünde olsun.
- **Yürüme:** giriş kapısından veya seçili odadan başla; çarpışma hacmi, zemin/kot ve açıklık denetimiyle ilerle. Telefonda sol hareket/sağ bakış, dokun-git ve görünür durdurma seçenekleri değerlendirilsin. Merdiven/kot çözülmeden katlar arası yürüme vaat edilmez.
- **Kuşbakışı kesit:** tavanı ve gerekirse kameraya yakın duvar üstlerini görsel olarak kes; kesit poşesi göster. Seçili katın üstündekileri gizle; modelin kaydını değiştirme. Kesit kontrolü ve oda görünümüne dön düğmesi görünür olsun.
- Başlangıç bütçesi **150 bin görünür üçgen, 150 draw call, etkileşimde 30 fps**: bunlar önerilen test hedefleri, kaynaklardan alınmış evrensel sınır veya ölçülmüş sonuç değildir. Doku belleği, ekran çözünürlüğü, saydamlık ve ışık/gölge bütçesi de ayrıca ölçülmeli. Yapı ile dekoru ayrı ölç; görünmeyen kat/odaları ayıkla, tekrar eden nesneleri instance et, yalnız değişen duvarı yeniden üret. Plan çizmek için sürekli ağır 3B render çalıştırma.
- Kabul cihazları: gerçek orta sınıf Android telefon ve iPad/tablet, ayrıca mevcut Iris Xe bilgisayar. Soğuk açılış, duvar sürükleme, açıklık ekleme, görünüm değiştirme ve uzun düzenleme ölçülsün. Donanım ölçümü yapılmadan “tablet destekli/hızlı” sonucu verilmez.

## Fotoğraf, tarama ve plan çıkarımı — sonraki aşama

| Yol | Biçim/yetenek | Lisans ve sınırlama |
|---|---|---|
| [Apple RoomPlan export](https://developer.apple.com/documentation/roomplan/capturedroom/export(to:metadataurl:modelprovider:exportoptions:)), [örnek](https://developer.apple.com/documentation/roomplan/providing-custom-models-for-captured-rooms-and-structure-exports) | CapturedRoom/çok odalı yapı JSON olarak encode edilebilir; USD/USDZ ve metadata export var. JSON semantiği, mesh görseli ayrı | Apple cihaz/SDK uyumluluğu gerekir; webde her telefonda çalışan tarayıcı taraması değildir. Koordinat, birim, transform ve confidence AURA'ya uyarlanır; doğrulanmış plan sayılmaz |
| [ARCore Depth](https://developers.google.com/ar/develop/java/depth/developer-guide) | Destekli Android cihazda derinlik; ayrı native/AR entegrasyonu gerekir | Her cihaz desteklemez; derinlik karesi doğrudan ortak duvarlı ev planı değildir |
| [WebXR hit-test](https://immersive-web.github.io/hit-test/) | Destekli XR oturumunda yüzey noktasını bulma | Tarayıcı/cihaz desteği kontrol edilir; ölçülü bütün ev taraması standardı değildir. Desteksiz cihazda manuel plan yolu çalışır |
| [HorizonNet](https://github.com/sunset1995/HorizonNet), [MIT](https://github.com/sunset1995/HorizonNet/blob/master/LICENSE) | PyTorch, özellikle panoramik görüntüden oda kabuğu; Manhattan doğrultusu ve genel oda varyantları | Kod MIT; README ağırlık indirmeyi eğitim veri seti şartlarına bağlar. Ağırlık/veri ticari izinleri doğrulanmadan kullanılamaz. Normal telefon fotoğrafından bütün evi kesin ölçüyle çıkarmaz |
| [LayoutNet](https://github.com/zouchuhang/LayoutNet), [MIT](https://github.com/zouchuhang/LayoutNet/blob/master/License.txt) | Torch/Lua, tek görüntüden kısıtlı oda yerleşimi; perspektif/panorama yolları | Kod izni, ağırlık ve eğitim verisi izinlerinin yerine geçmez. Ölçek ve görünmeyen odalar yine kullanıcı ölçüsü/plan gerektirir |

İlk teslimde modele veya tarama SDK'sına bağımlı kalmadan plan yükleme ve ölçülü çizim tamamlanmalı. Oda fotoğrafından eksik kroki tahmini, kullanıcıya belirsizlik ve sorularla döner. Bir referans uzunluk, kamera perspektifi ve elle çizilmiş oransız krokide bütün ölçüleri otomatik doğrulamaz.

## EV-01 uyumu ve eksik alanlar

[ornek-plan-3oda.json](veri/ornek-plan-3oda.json): **3+1 sentetik daire**, sekiz mekân, ortak duvar segmentleri, holden odalara kapılar, dış giriş kapısı ve pencereler. Tüm ölçülerin dayanağı `synthetic-plan`; müşteri verisi yok. Duvar uçları eksen, oda sınırları bitmiş iç yüzdür. Kesişen sınırlar segmentlere ayrıldığı için aynı ortak duvar iki defa kaydedilmez. Açıklık offseti duvar başlangıcından boşluğun ilk kenarına kadardır; react-planner'ın normalize/merkez offseti gibi yabancı biçimler adaptörde açıkça dönüştürülmelidir.

Şema v0.1 ile uyum için bilinmeyen menteşe/yön `swing: unknown` bırakıldı. Güzel kapı yayı çizmek adına veri uydurulmadı. Kalıcı editör için sürümlü genişleme önerileri:

- Ortak köşe kimlikleri; duvar başlangıç/bitiş düğümü referansları. v0.1 yalnız uç koordinat taşıyor; aynı koordinat eşitliği düzenlemede kalıcı kimlik yerine geçmez.
- Duvarın iki bitmiş yüzü/malzeme katmanları, yükseklik ve kot; açıkça tanımlanmış eksen/iç yüz ölçüsü.
- Kapıda hinge_start/end, açılımın duvarın hangi tarafına olduğu ve açı; pencere kanadı/çalışma hacmi. Geçişten farklı net kasa/kanat/boşluk ölçüleri.
- Arka plan delili, piksel→mm dönüşümü, kalibrasyon uçları, perspektif düzeltmesi ve bilinmeyen ölçüler.
- L oda ve delikli poligon desteği, kolon/şaft ve kat döşemesi/merdiven boşluğu; 2B/3B görünüm ayarları proje geometrisinden ayrı.

Bu genişlemeler örneğe şema dışı alan olarak eklenmedi; yeni sürüm ve migrasyon gerektirir. AI ve kullanıcı aynı doğrulanan düzenleme işlemlerini kullanmalı. Yapay zekâya doğrudan mesh yazdırmak veya fotoğraftaki talimatı araç komutuna çevirmek yerine, revizyonlu plan önerisi kabul edilir. Tasarımcı onayı geometri değişince yenilenir.

## Claude için ilk uygulama ve kabul sırası

1. Plan yükleme, kalibrasyon ve arka plan kilidi; kullanıcı ölçüsüyle çelişen ikinci uzunluk uyarısı. Uygulama bütün ölçüleri sessizce ölçekleyip onaylı saymamalı.
2. Ortak düğüm/duvar grafı, dikdörtgen ve L oda, sayısal ölçü, köşe ve duvar bölme; ölçü kilidi, geri al ve katlar. T birleşimi, sivri köşe, aynı duvarı tekrar çizme ve eğik duvar örnekleri sınansın.
3. Kapı/pencere bağlantıları; duvar uçlarını aşan ve birbiriyle çakışan açıklıklar reddedilsin. Duvarın yönü ters çevrilince açıklık fiziksel konumunu korusun. Bölünen duvardaki açıklık yeni segmente taşınsın veya işlem engellensin; kaybolmasın.
4. Aynı veriyle 2B ve 3B; kapı altında görünmez duvar, pencere altında kayıp parapet, çift ortak duvar, kopuk T birleşimi ve ters yüz bulunmasın. Tavan görünümü sadece görünüm durumunu değiştirsin.
5. Sentetik dairede girişten tüm odalara bağlantı grafı; net alan, ölçü zinciri ve duvar kalınlığı tutarlılığı. Buradaki kapı yönleri bilinmediğinden çarpışmasız yürüme onaylı sayılmaz. Merdiven/kot desteği gelene kadar kat değiştirme düğmeyle yapılır.
6. Telefon/tablette çizim–pan ayrımı, sayısal giriş, açıklık seçme, undo ve yeniden açma; düşük performansta kalite düşürülmesi geometriyi değiştirmesin. Tasarımcıya aktarılan planın revizyonu ve belirsizlik listesi görünür olsun.

## Doğrulama ve araştırma sınırı

Lisanslar ve son commitler GitHub metadata ile; seçili geometri parçaları kaynak metniyle incelendi. GitHub API kota sınırına ulaşınca ek dosya okumaları raw kaynak/belgelere yönlendirildi. Bazı projelerde yalnız dosya yolları doğrulandı; çalıştırılmış algoritma/cihaz testi iddia edilmedi. Resmî Sweet Home 3D sayfalarının tarihleri tutarsız olduğu için güncel son kaynak commitine tarih uydurulmadı.

Teslim verilerinde JSON ayrıştırma, EV-01 v0.1 şema uyumu ve geometrik ilişki kontrolleri yapılır: tek duvar kimliği/segmenti, pozitif ölçüler, açıklıkların duvar içinde kalması, mekân referansları, iç yüz sınırları ve tüm odaların holden erişim grafı. Bu kontroller gerçek konut mevzuatı, taşıyıcılık veya kapı yönleri bilinmeyen örnekte güvenli dolaşım onayı değildir. Uygulama kodu değişmediği için mevcut site testleri bu araştırmanın kanıtı olarak gösterilmez.

Son kontrol sonucu: üç JSON ayrıştırıldı; EV-01 şemasına uyum geçti. Sekiz mekân, 25 tekil duvar segmenti ve 15 açıklık için pozitif ölçü, duvar sınırı, açıklıkların çakışmaması, oda poligonlarının çakışmaması ve holden tüm odalara grafik bağlantısı kontrolleri geçti. Bu, kapı kanadı çarpışma testi değildir. `git diff --check` temiz.
