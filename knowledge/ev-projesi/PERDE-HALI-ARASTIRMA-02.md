# Perde ve halı: malzeme, biçim ve görünüm araştırması

21 Ekim 2026 · Codex → Claude uygulama devri. İncelenen main: `47457ed` (#141). Bu teslim araştırma ve öneridir; uygulama kodu, `assets/`, eğitim ve canlı site değiştirilmedi.

**Karar:** Daha fazla renk düğmesi eklemek yeterli değil. Perdeyi gerçek bir tekstil sistemi, halıyı da dokunmuş/havlı bir nesne olarak modellemek gerekiyor. Mevcut Three.js altyapısı yeterli başlangıç; yeni bir arayüz çatısı veya sürekli kumaş fiziği motoru gerekmiyor. Önce üç karşılaştırılabilir kaliteli sahne, sonra seçeneklerin çoğaltılması önerilir.

Claude için uygulanacak sıra ve kabul ölçütleri: [CLAUDE-IS-EMRI-TEKSTIL-02.md](CLAUDE-IS-EMRI-TEKSTIL-02.md). Makine okunur kaynaklar ve öneri kartları: [tekstil-02-kaynaklar.json](veri/tekstil-02-kaynaklar.json), [tekstil-02-oneriler.json](veri/tekstil-02-oneriler.json).

## 1. Mevcut uygulamada somut eksikler

Bu bölüm statik kod incelemesidir; canlı sitedeki son görüntü için yeni ekran ölçümü yapılmadı. Kullanıcının gördüğü kalite sorununun tamamını performans veya ışıklandırmaya bağlamıyoruz.

| Yer | Gözlenen durum | Sonuç / önerilen düzeltme |
|---|---|---|
| `assets/ev/tekstil.js`, `FABRICS` | “Keten” bir hex renk; lif ve dokuma bilgisi yok | Keten kumaş ile keten rengi ayrılmalı; renk seçmek dokumayı değiştirmemeli |
| Aynı dosya, `MODELS` | Tül/fon/karartma birleşimleri `wave` başlığına bağlı | Katman işlevi ile başlık ayrı seçilmeli; tek/çift/üçlü pile ve wave aynı görünmemeli |
| `assets/forma/studio.js`, `textilePreview()` | Sabit SVG dikdörtgenler, çizgi kıvrımları; 3D görüntüleyici kapatılıyor | Şema olarak yararlı, ana ürün önizlemesi olarak yetersiz; ortak 3D malzeme ve geometri önizlemesi önerilir |
| `assets/ev/perde.js`, `mat()` | Sabit opacity; bütün kumaşlarda aynı roughness; dokuma/normal haritası yok | Tül, keten görünümlü dokuma ve kadife aynı renkli yüzeye dönüşüyor |
| `panel()` | Yalnız yatay kıvrım, düşeyde tek segment | Başlık ve etek biçimi ayrılamıyor; aşağıya doğru döküm ve küçük asimetriler yok |
| `curtains()` | Katmanlar sabit 100 mm ayrılıyor; tül her durumda kapalı | Park derinliği ve gerçek donanım dikkate alınmalı; katmanlar bağımsız açılmalı |
| `assets/ev/plan.js`, `rugMat()` | Tek canvas desen + rastgele benek; yapı/hav haritası yok | Kilim yalnız baklava deseni oluyor; hav yönü ve kenar bitişi kayboluyor |
| `rugMat()` / halı kutusu | Bütün türler aynı 8 mm kutu | Düz dokuma, bukle ve uzun hav siluetleri ayrışmıyor |
| `rugMat()` | `Math.random()` ile doku | Aynı kayıt farklı açılışta değişebilir; projeye bağlı seed önerilir |

### Kıvrımda kumaş boyu gerçekten korunmuyor

Kod yorumunun aksine açık panelde sabit kumaş boyu korunmuyor. İncelenen formülün sekiz segment/dalga hesabını Python standart kütüphanesiyle tekrar hesapladım: 1800 mm pencere + iki yanda 150 mm taşma → 2100 mm ray; yarım panel düz kumaşı `1050 × 2.3 = 2415 mm`.

| Durum | Görünen en | Mesh'in yatay kırık çizgi boyu | Kumaş boyuna göre fark |
|---|---:|---:|---:|
| Kapalı | 1050 mm | 2258.2 mm | −%6.5 |
| Açık park | 189 mm | 497.4 mm | −%79.4 |

Bu bir ekran görüntüsü yorumu değil, mevcut `panel()` formülünün sayısal incelemesidir. Genlik `0.6 × dalga adımı` ile sınırlandığında kumaşın büyük bölümü park durumunda kayboluyor. Kumaş “lastik gibi sıkışmış” görünebilir. Öneri: sabit yay uzunluğuna sahip kıvrım merkez hattı; açıldıkça derinliği ve park genişliği birlikte değişen, donanım profiliyle sınırlanan panel. Kendi kendine kesişen çok derin sinüs de çözüm değildir. Çözülemeyen ray/katman aralığında görünüşü zorlamak yerine uyumsuzluk bildirilmelidir.

Sayısal bulgunun standart Python ile tekrarı (metre):

```python
import math
flat = 2.415
for w in (1.05, 0.189):
    n = max(2, round(flat * 1000 / 240))
    pitch, ratio = w / n, flat / w
    amplitude = min(pitch * .6, pitch / math.pi * math.sqrt((ratio**2 - 1) / 2))
    points = [(w * i / (n*8), amplitude * math.sin(2*math.pi*i/8))
              for i in range(n*8 + 1)]
    arc = sum(math.dist(a, b) for a, b in zip(points, points[1:]))
    print(round(arc * 1000, 1), round(100 * (1-arc/flat), 1))
```

## 2. Perdeyi tanımlayan bağımsız eksenler

“Keten / stor / karartma / yeşil / çift kat” aynı sınıflama seviyesinde değildir. Şunlar ayrı saklanmalı:

1. **Ürün ve hareket:** askılı panel, rulo stor, katlanır Roman stor, akordeon plise. Roman stor yatay plise çizgileri eklenmiş rulo değildir. Dikey katlanan askılı perde ile yatay katlanan pencere plisesi ayrılır.
2. **Lif bileşimi:** keten, pamuk, yün, polyester, ipek, lyocell/viskon ve karışımları; oranlar yalnız ürün föyünden. “Keten görünümü” %100 keten demek değildir.
3. **Yüzey/yapı:** düz dokuma, açık leno, jakar, saten, kadife havı, melanj, baskı. Kadife lif adı değildir; pamuklu kadife de olabilir.
4. **Işık işlevi:** tül/şeffaf, yarı geçirgen, yoğun fon, dimout, blackout. Lif adı geçirgenlik sınıfını belirlemez; dimout ve blackout birleştirilmemeli.
5. **Başlık:** wave/S, büzgü (pencil), tek/çift/üçlü dikilmiş pile, kuşgözü veya uygun çubuk cebi. Her başlık farklı üst geometri ve donanım ister.
6. **Katman ve donanım:** cam tarafı, oda tarafı, astar, ayrı ray veya birlikte dikilmiş astar. İki bağımsız ray ile tek astarlı panel aynı nesne değildir.
7. **Renk/desen:** temel renk, ikinci iplik rengi, melanj oranı, tekrar ve yön; gerçek ürün renk kodu varsa ayrıca.

### İncelenen gerçek kumaş örnekleri

Aşağıdakiler malzeme ayrımını göstermek içindir; AURA tedarik listesi veya lisanslı doku paketi değildir. Üretici fotoğrafları izinsiz uygulamaya alınmaz.

| Kaynak örnek | Kaynağın desteklediği ayrım | Görsel uygulama çıkarımı (AURA önerisi) |
|---|---|---|
| [Kvadrat Senja](https://www.kvadrat.dk/en/products/curtains/600141-senja) | Dokulu, ışık geçiren keten örneği | İplik düzensizliği ve yumuşak kontur; “keten daima opak” varsayımı kaldırılır |
| [Kvadrat Tetra](https://www.kvadrat.dk/en/products/curtains/5566-tetra) | Yün ipliği ile keten çözgünün farklı karakteri | Kalın iplik ile açıklık bir arada; ağırlık tek başına karartma değildir |
| [Kvadrat Value](https://www.kvadrat.dk/en/products/curtains/5512-value) | %59 lyocell / %41 organik pamuk; yoğun ve parlak karakter | Mat fonla aynı shader/pürüzlülükte görünmemeli; renk numunesi gerekir |
| [Kvadrat Site / Watercolour](https://www.kvadrat.dk/en/made-in-asia/curtains) | Keten benzeri görünüm polyester yapıda da üretilebiliyor | Etikette görünüm ve gerçek bileşim ayrı |
| [Dedar A Forest](https://dedar.com/products/a-forest/) | %69 ipek / %31 keten, perde kullanımı; 295 g/lineer metre, 195 cm en | Gramaj birimi korunmalı; 295 g/m² diye aktarılmamalı. İstenirse yaklaşık 151.3 g/m² hesap değeri, ayrı türetilmiş alan olarak |
| [Dedar Adamo & Eva](https://dedar.com/adamo-eva/) | Pamuk kadife; perde uygulaması üretici tarafından belirtiliyor | Hav yönü ve bakış açısına göre açıklık farkı; metalik cilalı görünüş değil |

Dedar kadife sayfasının bulgusu resmî arama indeksinden; tam ürün sayfası erişimi başarısız. A Forest tam sayfası ve diğer kaynaklar kayıt defterinde erişim ayrımıyla tutulur. Bazı Kvadrat alanları şablon değişkeni döndürüyor; görünmeyen bileşim/test değeri tahmin edilmedi.

### Başlık, pile oranı ve park alanı

[Kvadrat dikim rehberi](https://www.kvadrat.dk/en/kvadrat-curtains/kvadrat-curtain-confectionery-recommendations) wave, tek pile ve büzgü başlığı ayırır; kullandığı **%100 fullness = iki kat kumaş eni** demektir. Veri girişinde “100” ile “1.0×” karıştırılmamalı. Uygulamada tek ortak oran tanımı önerilir: `flat_width / covered_track_width`; üreticinin özgün gösterimi ve kaynağı da korunur.

[Silent Gliss Wave Workroom Guide, Ağustos 2019](https://www.silentgliss.co.uk/fileadmin/redaktion/used/Images/Web%20Partner%20Downloads/SGGB/Various%20Documents/Wave%20-%20Curtain%20Workroom%20Guide.pdf), PDF'nin 3. sayfası (basılı 4–5): 60/80 mm kaydırıcı aralığı, yaklaşık 2.1/2.3 dolgunluk seçenekleri ve donanıma bağlı farklı park tabloları vardır. 80 mm için bazı profiller 180 mm/metre, diğer profil 210 mm/metre + uç parça verir. Dolayısıyla mevcut 180 sabiti bütün raylara uygulanamaz; 120 mm görsel dalga adımı da donanım adımı diye gösterilmez. Bu eski rehber güncel sipariş föyünün yerine geçmez.

Wave'in düzenli S ritmi, pinch pile'nin tepede bağlanan demeti ve pencil başlığın sık büzgüsü gözle ayrılmalı. Fon kapandığında sadece yandaki iki dikdörtgen büyümemeli; merkez birleşimi, başlık ve alt etek birlikte değişmeli. `heading`, `fullness`, `glider_spacing`, `park_width`, `park_depth`, `endpiece` tek donanım profiline bağlanır; bilinmeyenler `null` kalır.

## 3. Katmanlar ve gerçek kullanım

İlk kaliteli sunum için önerilen beş sistem:

| Sistem | Cam → oda sırası | Bağımsız kontrol | Sınır |
|---|---|---|---|
| Tek tül | Hafif geçirgen askılı panel | Tül açık/yarım/kapalı | Gece içerisi aydınlıkken mahremiyet sözü verilmez |
| Tül + fon | Tül rayı → yoğun fon rayı | İki ayrı açılma oranı | Her iki panelin park hacmi ve çarpışması görünür |
| Tül + karartma | Tül → blackout panel veya ayrıca tanımlı astarlı fon | Katman bazlı | Kumaşın karartması, odanın kenar kaçaklarıyla aynı şey değil |
| Roman stor | Cam önünde yukarı katlanan kumaş | Katlı paket / yarım / tam iniş | Üstte kumaş paketi ve pencere açılımı gerekir |
| Stor / plise | Her biri kendi mekanizması | İniş oranı; varsa gerçek alt/üst hareket | Çocuk güvenliği ve donanım kontrolü önceki PERDE-01 sınırlarıyla korunur |

“Tül ve fon aynı renge boyansın” varsayılanı yapılmasın. Her katmanın kendi malzemesi ve rengi olsun. Duvar ile perdenin aynı tonda istenmesi de geçerli bir kullanıcı kararıdır. Ray tavana monte mi, pencere üstünde mi, nişte mi açıkça gösterilmeli. Radyatör, pencere kolu, kapı kanadı, süpürgelik ve robot süpürge ihtiyacı kayıtlı olmalı; bunlara evrensel sabit mesafe atamayın.

Mevcut PERDE-01 ölçü/ön metraj hesaplayıcısı korunmalı. Yeni görsel preset, dikime hazır metraj onayı üretmemeli. Işık, ses emilimi, yangın ve ısı tasarrufu iddiaları yalnız ilgili ürünün test/föyüyle kullanılabilir.

## 4. Halı: desenin ötesinde yapı

[nanimarquina teknikler dizini](https://nanimarquina.com/en/blogs/tecnicas) el dokuma kilim, dhurrie, düğümlü ve tufted teknikleri ayrı gösterir. Bu ayrım, “düz / çizgili / geometrik / kilim” model listesinden bağımsız bir yapı alanını gerektirir. **Kilim bir baklava motifi değildir:** düz renk veya çizgili kilim de olabilir. Aynı geometrik desen havlı halıda da bulunabilir.

| Görsel aile (AURA sınıflaması) | Lif ayrı alan | Uzakta / yakın planda beklenen ayrım |
|---|---|---|
| Düz dokuma kilim/dhurrie | Yün, pamuk veya doğrulanmış karışım | İnce kenar; atkı/çözgü ritmi; zorunlu olmayan püskül |
| Jüt düz dokuma | Jüt veya ürün karışımı | Kalın doğal iplik ve düğümlü görünüm; uzun yumuşak hav gibi gösterilmez |
| Kısa kesik hav | Yün veya sentetik seçenek | Sık lif yüzeyi, yumuşak kenar, yönle değişebilen açıklık |
| Bukle/ilmek | Ürüne göre | Kapalı ilmek dokusu; kesik uçlu kadife yüzeyle karıştırılmaz |
| Kesik + ilmek / rölyef | Ürüne göre | Yüzey yüksekliği desenle birlikte değişir |
| Uzun hav | Ürüne göre | Siluet ve kenarda hacim; yalnız normal map ile tam taklit edildiği iddia edilmez |

[Vegetal üretici örneği](https://professionals-us.nanimarquina.com/products/vegetal) jüt el dokumasına somut referanstır. Markanın motifini kopyalamadan yapı araştırılabilir. [CRI bakım rehberi](https://carpet-rug.org/wp-content/uploads/2024/09/Carpet-and-Rug-Care-Guide.pdf) hav yönünün renk değişmiş gibi algılanabileceğini açıklar. [WoolSafe](https://www.woolsafe.org/cleaning-maintenance-fine-fibres/) karışımlarda hassas lifin bakım sınırını esas alır; “yün/viskon = kolay silinir” varsayımı doğru değildir. Bakım önerisi ürün etiketiyle doğrulanmalı; bu çalışma temizlik reçetesi vermez.

Önce yapı, sonra desen, sonra renk seçtirin. Desen alanları: desensiz, melanj/abrash benzeri ton farkı, çizgi, bordür, özgün geometrik kompozisyon; desen tekrarı mm ve yön ile tanımlansın. Belirli tasarımcının tanınan desenini veya kültürel motifi rastgele “kilim” diye kopyalamayın. Püskül, biyeli kenar, overlock ve düz dokuma kenarı ayrı bitişlerdir; her halıya çift bordür eklenmesin.

Halı ölçüsü gerçek oda ve mobilya yerleşiminden seçilmeli; çizimi kare dokuyu dikdörtgene esneterek yapmayın. Kalınlık, hav boyu ve desen boyu ayrı parametrelerdir. Kapı açılımı, sandalye çekme, geçiş, kaydırmaz altlık ve kullanıcının erişim ihtiyaçları tasarımcıyla değerlendirilir. Önceki `aksesuar.js` yerleşim doğrulamaları korunur; sırf görsel iyi dursun diye halı duvar dışına taşırılmaz.

## 5. Renk: seçilebilir palet ve kumaş karakteri

**AURA tasarım önerisi; üretici renk eşlemesi değildir.** Başlangıç paleti: kırık beyaz, sıcak taş, yulaf, kum, mantar/grej, soğuk taş, adaçayı, zeytin, kil/terrakota, soluk gül, mürekkep mavisi, kömür. JSON'daki hex değerler yalnız arayüz başlangıç renkleridir; RAL, NCS, Pantone veya satın alma kodu değildir.

Her kumaş kartında yakın dokuma görünümü + 1 metre civarı düşüş kesiti + oda görünümü olsun. Sadece düz renk çemberi yeterli değil. Melanjda ikinci iplik rengi, saten/kadifede yön etkisi renk örneğinin parçasıdır. Bir kumaşın rengini değiştirmek fiziksel lif yapısını değiştirmemeli.

Önerilen üç karşılaştırma: (1) kırık beyaz tül / sıcak taş keten görünümlü fon / yulaf kısa hav; (2) nötr tül / adaçayı yoğun fon / doğal jüt; (3) mürekkep kadife fon / açık kısa havlı halı. Bunlar uyum reçetesi veya herkes için öneri değil, geometri ve malzeme farkını değerlendiren başlangıç sahneleridir.

Renkleri aynı kamera, aynı ışık ve aynı pozlamada karşılaştırın; ayrıca gün/gece ayrı görünüş verin. [Three.js renk yönetimi](https://threejs.org/manual/pages/color-management.html): renk haritaları sRGB, normal/roughness gibi veri haritaları renk dönüşümünden ayrı ele alınır. Ton eşlemesi veya ışık değiştirilerek renk uyuşmazlığı saklanmamalı. Kvadrat Value föyü dijital renklerin gerçek numuneden farklı olabileceğini belirtir; satın alma için fiziksel numune gerekir.

## 6. GitHub: ne alınabilir, ne alınmamalı?

Bu adaylar bu çalışmada indirilip siteye eklenmedi, tablet üzerinde benchmark yapılmadı. “Çalışır”, “bakımlı” veya “hızlı” iddiası yalnız yıldız sayısına dayanmaz. Entegrasyon öncesi kesin commit, bağımlılık listesi ve dağıtım lisansları sabitlenmeli.

| Aday / birincil kaynak | Lisans / durum | Fayda ve karar |
|---|---|---|
| [Three.js](https://github.com/mrdoob/three.js), [MIT](https://threejs.org/license/) | Depoda r186 var; yeni doküman her özelliğin mevcut sürümde bulunduğunu kanıtlamaz | **İlk tercih:** mevcut BufferGeometry, fiziksel kumaş malzemesi, doku yükleme ve ortak önizleme. Sırf perde için sürüm güncellemesi yapmayın |
| [pmndrs/drei-vanilla](https://github.com/pmndrs/drei-vanilla), [MIT](https://github.com/pmndrs/drei-vanilla/blob/main/LICENSE) | Vanilla Three yardımcıları; mevcut r186 uyumu burada test edilmedi | Kod örneği incelemesi; `MeshTransmissionMaterial` refraktif malzeme içindir, perdeyi camlaştırmak için kullanılmasın. React geçişi gerekmez |
| [codedgar/three-fenestra](https://github.com/codedgar/three-fenestra), [MIT](https://github.com/codedgar/three-fenestra/blob/master/LICENSE) | README v0.3.0 / pre-1.0 | Dışarıdan bakılan sahte iç mekân ve ön katman yaklaşımı. **İçeriden perde tasarlama geometrisinin yerine uygun değil**; temel çözüm olarak almayın |
| [dmitrykurash/holocloth](https://github.com/dmitrykurash/holocloth) | GitHub MIT etiketi görüldü; lisans metni ayrı dosya olarak bu erişimde okunamadı | Kumaş etkileşimi için araştırma referansı. Holografik folyo estetiği perdeye taşınmasın; bağımlılık/lisans incelemesi olmadan kod alınmasın |
| [princeton-vl/infinigen](https://github.com/princeton-vl/infinigen), [BSD-3-Clause](https://github.com/princeton-vl/infinigen/blob/main/LICENSE) | Yerel eski envanter `indoors-stable` / `b11700e…`; güncel main ile eşdeğer sayılmadı; o envanterde perde yolu yok | Çevrimdışı malzeme/halı referansı ve bake adayları; Blender/Python üretimini tarayıcıya yüklemeyin. Lisans başlıkları ve üçüncü taraf varlıklar ayrıca korunmalı |
| [kripken/ammo.js](https://github.com/kripken/ammo.js), [lisans metni](https://github.com/kripken/ammo.js/blob/main/LICENSE) | Bullet/Emscripten fizik altyapısı; zlib tarzı kullanım/değişiklik bildirim koşulları, dağıtım bağımlılıkları ayrıca incelenmeli | Soft-body araştırması mümkün; **ilk aşama için önerilmez**. Boyut, çarpışma ve CPU maliyeti ölçülmeden eklenmesin |
| [martinlaxenaire/curtainsjs](https://github.com/martinlaxenaire/curtainsjs) | GitHub MIT etiketi | Adı yanıltmasın: DOM elemanlarını WebGL düzlemlerine dönüştürür, perde dikim/geometri kütüphanesi değil. Bu ihtiyaç için elenir |

**Mimari öneri:** Tarayıcıda deterministik parametrik geometri + fiziksel ölçekli dokular. Gerekirse birkaç ağır drape preset'i Blender'da çevrimdışı oluşturulup glTF ve harita olarak bake edilir. Sürekli fizik, GPU sunucusu, AI görsel API'si veya eğitim bu kalite iyileştirmesinin önkoşulu değil.

### Lisanslı doku kaynakları ve gerçek ölçek

[ambientCG lisansı](https://docs.ambientcg.com/license/) varlıkları CC0 olarak belirtir; ticari kullanım mümkün. [Fabric061](https://ambientcg.com/view?id=Fabric061) sayfasında yaklaşık **40 × 40 cm** fiziksel alan var. Bu, dokuma ölçeği için iyi başlangıçtır; ürünün gerçek keten olduğunu veya tül transmisyonunu kanıtlamaz. [Carpet004](https://ambientcg.com/view?id=Carpet004) halı yüzeyi adayıdır; fiziksel ölçek bu sayfada bulunamadı, uygulanmadan kalibre edilmelidir. [Fabric004](https://ambientcg.com/view?id=Fabric004) karbon/sci-fi etiketlidir; adında Fabric geçtiği için tül dokusu seçilmemeli.

[Poly Haven](https://polyhaven.com/license) varlıkları CC0'dır; sitedeki metin/kod/logoları aynı hakla yeniden dağıtma sonucu çıkarılmaz. Belirli bir perde varlığı bu çalışmada seçilmedi. Üretici kataloglarının tileable fotoğraf sunması CC0 lisans verildiği anlamına gelmez.

Fabric061 kaynak zip'i sayfada 1K JPG için 9 MB görünüyor; bu tarayıcıya aktarılacak bütçe değildir. Haritalar seçilip sıkıştırılmalı; indirme boyutu, açılmış GPU belleği ve draw call ayrı ölçülmeli. Sayfa her malzemede 4K/8K yüklememeli. Yakın planda 1K/2K aday, oda görünüşünde daha küçük LOD denenebilir; bunlar performans sonucu değil öneridir.

## 7. Görüntü kalitesi için uygulanacak teknik kararlar

Bu bölüm **AURA mühendislik önerisidir**, ölçülmüş malzeme parametreleri değildir:

- Kıvrımı geometri, iplik ölçeğini normal/roughness, renk/deseni albedo ile ayırın. Milimetrelik ipliği santimetrelik kabartmaya dönüştürmeyin. Bir dokuyu her panelde bir kez esnetmek yerine gerçek UV ölçeği kullanın; kıvrım açılınca desen gerilmesin.
- Panel üstü başlık geometrisini, gövde düşüşünü ve etek ağırlığını ayrı tarif edin. Tam simetrik her dalgaya aynı gürültüyü vermek yerine küçük, seed'li ve kumaş tipine bağlı düzensizlik kullanın. Üst kenar raya bağlı kalır; zemin kesişmesi yok.
- [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) sheen özelliğini kumaş için sunar; ek özellikler piksel başına maliyetlidir. Tülü refraktif cam gibi kurmayın. Şeffaflık sıralaması, çift yüz, gölge ve katman geçişleri önden/arkadan test edilmeli. Blackout kumaşta opaklık ile kapalı odanın ışık seviyesi ayrı hesap/iddiadır.
- Halı için kenar dönüşü ve hav yönü ekleyin; uzun hav yalnız rengi değişen bir kutu olmasın. Genel görünüşte kabuk/normal yaklaşımı, yakın planda sınırlı geometri adaydır. Çok sayıda fiber instancing'i ölçmeden varsayılan yapmayın.
- Mevcut r186 sürümünde kullanılan özellikleri yerel API'den doğrulayın. Shader kopyalarını başka sürümden doğrudan eklemeyin. Doku/malzeme cache anahtarı seed, lif, yapı, renkler ve ölçeği içersin; sahne kapanırken GPU kaynakları temizlensin.
- Tablet için önce standart malzeme ve düşük geometri yolu; fiziksel sheen gibi pahalı özellikler ölçüme göre açılır. Fiziksel opacity/transmittance veya g/m² değeri bilinmiyorsa rastgele shader sayısı ürün ölçümü diye kaydedilmez.

## 8. Veri ve kullanıcı akışı

Önerilen sözleşme (çalışan şema migrasyonu değildir): `textiles.version=2`; pencere/oda bazında `treatment_type`, `mount`, `heading`, `hardware_profile_id`, bağımsız `layers[]`; her katmanda `fabric_id`, `color_id`, `open_fraction`, `flat_width_mm`, `drop_mm`, `lining`; kumaşta `fiber_composition`, `construction`, `light_control`, `weight` + açık birim, desen tekrarı ve harita lisansları. Halıda `construction`, `fiber`, `pile_height_mm`, `thickness_mm`, `pattern`, `pattern_repeat_mm`, `edge`, ölçüler ve yön.

Her ölçüde `value`, `unit`, `status` (`measured`, `manufacturer`, `derived`, `visual_proposal`, `unknown`), `source_id` ayrımı önerilir. Önceki `aura-tekstil` `{curtain:{model,color},rug:{model,color}}` kaydı sessizce bozulmasın. “keten” eski anahtarı **eski keten tonu** olarak taşınmalı; gerçek lif bileşimi unknown kalmalı. Yeni tercihler ev JSON'unda kalmalı, yalnız localStorage'a bağlı olmamalı. Pencere bazlı seçim, oda ve ev varsayılanlarını kullanıcı tercihini ezmeden devralmalı.

Kullanıcı önce ihtiyaç seçer: ışık/mahremiyet, mevcut panjur, görünüm ve bakım. Ardından sistem → kumaş → başlık → renk → ölçü/katman ince ayarı. Kullanıcıya shader terimleri veya araştırma statüleri gösterilmez; fiziksel numune ve tasarımcı onayı gerektiği anlaşılır dilde belirtilir. Kumaş katmanlarını ayrı seçmek, her ayrıntıyı bir anda ekrana yığmak anlamına gelmez.

## 9. Teslim sınırı

Bu paket Claude'a uygulama için hazırlanmıştır; uygulandı veya canlıya çıktı denmiyor. Mevcut PERDE-01 ülke araştırması tekrar üretilmedi; burada eksik olan görsel malzeme ayrımları ve uygulanabilir kalite ölçütleri tamamlandı. Kaynak sayfalarının görünür içeriği/lisansları incelendi; bütün depolar derlenmedi, kumaş numunesi veya laboratuvar optik ölçümü yapılmadı. Doğrulanmayan fiziksel değerler `null` kalır. Önceki eğitim ve sohbet görevlerine müdahale edilmedi.
