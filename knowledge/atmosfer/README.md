# ATMOSFER-01 · PR 1 · 19 Ekim revizyonu

Main #61 (`49be4f8`) atmosfer dalına birleştirildi. Tabla triangülasyonu ve oda düzeni düzeltmeleri korunur. Kullanımdan kaldırılan `bedroom` takımı örneklerden çıkarıldı; `wardrobe-01/02` Dolap ailesinden (`storage/wardrobe`) gerçek tasarımlardır. #58 hâlâ görsel onay bekler; PR #60 tabanı `codex/aura-gorsel-01` olarak kalır. Hiçbir PR birleştirilmez. Bekleyen işler ve proje sonu müşteri akışı bu revizyonun dışındadır.

## Görsel inceleme

[Dört render sütunu ve ürüne göre seçilmiş 36 yakın plan](ornekler.md). Önceki 18 Ekim rasterları sabit commit bağlantısından açılır. İki yeni Dolap tasarımı, eski yatak odası takımıyla aynı ürün değildir; satırlar bunu açıkça belirtir. Yeni raster 2400×1600; deneysel Vulkan 800×534 / 16 örnek; CPU Cycles genel kareleri ve yakın planlar 2400×1600'dür. OIDN ve farklı ton eşlemeleri nedeniyle eşit piksel sonucu iddia edilmez. Karar sahibi görsel onayı beklenir.

## Işık, mekân ve kamera

Sert güneş yoktur. Pencere RectAreaLight/LTC ana ışık, düşük enerjili gölge vekili VSM 2048 / radius 8 / 16 blur örneği, zayıf dolgu ve GTAO 32 kullanır. Raster alan ışığının kendisi gölge üretmediği için vekil gölge fiziksel alan gölgesi değildir. Raster ACES / pozlama 1.05 / SMAA'dır. Yerel Poly Haven Studio Small 09 HDRI ortam ışığıdır. Cycles gerçek alan ışığı, dolaylı ışık ve OIDN kullanır.

Dama zemini kaldırıldı; bütün ailelerde ambientCG WoodFloor051 ahşap zemin vardır. Plaster004 normal/pürüz haritaları açık, nötr kireç sıva albedosuyla kullanılır. Türetme `atmosfer-surfaces.js` içindedir ve GLB'ye gömülür. Ürüne göre oda genişliği/yüksekliği/derinliği seçilir; fotoğraf zemini kadraj dışında devam eder. Süpürgelik ve gerçek pencere açıklığı vardır; tavan geometrisi yoktur. [CC0 kaynak ve dönüşüm kaydı](cc0/README.md).

55 mm genel kamera yataydır; mimari lens kaydırması, tabla üstünü gösterirken dikey yakınsamasını önler. Kaydırmadan sonra bütün ürün köşeleri tekrar kadraj sınırına karşı denetlenir. GLB standart perspektif kamerasına ek olarak yan JSON'da `shiftY` taşınır; Cycles aynı değeri uygular. 85 mm/f5.6 yakın plan kameralarında kaydırma sıfırlanır. Ahşap haritasındaki periyodik zikzak bantları, türün rengini koruyan düzensiz uzun lif ve zayıf mikro rölyefle değiştirildi; bu motor malzemesidir, ürüne AI doku eklenmez.

## Gerçek ayrıntı seçimi

`tests/visual/atmosfer-01/designs.json` her ürün için üç ayrıntının başlığını, gerçek parça rollerini, bakışını ve odak konumunu taşır. Oturmada döşeme ve varsa biye, ahşap kol/ayak ve birleşim; masada tabla yüzeyi, kenar ve taşıyıcı birleşimi; dolapta kapak/derz, kulp ve gövde kenarı; mutfakta tezgâh, kapak/çekmece derzi ve kulp; banyoda lavabo tablası, çekmece derzi ve kulp/ayak seçilir. Bir malzeme bulunmadığında uydurulmaz. Raycast istenen gerçek role isabet etmezse üretim hata verir. Her yakın planda optik merkez ve dışarıdaki kamera doğrulanır. Yalnız son asset'te yüksek bölümleme kullanılır; tasarım ölçüleri değişmez.

## Tanı ve doğrulama

[12 gömülü haritalı GLB ve kaynak hashleri](gltf-export-report.json), [render raporu](kareler/cycles-report.json), [72 dosyanın doğrulaması](artifact-verification.json) ve [19 Ekim test koşusu](test-results-20261019.json) denetim kanıtıdır. `verify-artifacts.py` 48 Cycles dosyasında 2400 px, 36 makroda doğru parça rolü/optik merkez/dış kamera, kaynak hashleri ve boş olmayan JPEG arar.

Iris Xe arka uç tanısı 18 Ekim'deki [Chrome/ANGLE](path-diagnostics.json) ve [izole Edge](edge-diagnostics.json) kayıtlarıdır: D3D11 RGBA0 başarısızlığı, aynı cihazda Vulkan başarısı. Kaynak düzeyi kesin hata çözümü yoktur; yol izleme isteğe bağlı ve deneysel, varsayılan rasterdır. Başka fiziksel cihaz test edilmedi. Yeni sahnelerin 12 Vulkan önizlemesi ayrıca yeniden çekilir. Genel cihaz uyumluluğu garanti edilmez.

## Tekrar üretim

```powershell
$env:PLAYWRIGHT_MODULE='<kurulu-playwright-dizini>'
node tests/visual/atmosfer-01/run-local.mjs tests/visual/atmosfer-01/render-suite.mjs
node tests/atmosfer-check.mjs
```

Playwright yalnız loopback sunucuya ve temiz profile erişir; dış ağ istekleri engellenir. İzole tarayıcı kapatması süre sınırına bağlıdır; zorunlu süreç temizliği rapora ayrı yazılır. [Cycles CLI ve sunucu notu](CYCLES.md). Tarayıcı modülü yalnız istenince yüklenir; lazy yükleme/iptal/gerekçeli raster yedeği kontrol edilir. API anahtarı, bulut render ve ürün için görüntü üreten AI kullanılmaz. score.mjs ve METİN kayıtlarına dokunulmaz.
