# ATMOSFER-01 · PR 1 · 18 Ekim akşam revizyonu

Karar sahibinin güncel talimatıyla PR 1 katalog ışığına, CC0 mekân yüzeylerine, Blender CPU Cycles prototipine ve üç yakın plana genişletildi. Proje sonu akışı, indirme/tasarımcı paketi ve metin yerleştirme PR 2'de kalır. #58 hâlâ karar sahibi onayını bekler; taban `codex/aura-gorsel-01`. PR'lar birleştirilmez.

## Görsel inceleme

[Her tasarım için eski raster / yeni raster / deneysel yol izleme / Cycles](ornekler.md). Eski raster dosyaları `kareler/eski-raster/` içinde byte olarak korunur. Yeni raster 2400×1600; deneysel Vulkan önizlemeleri 800×534 / 16 örnek; CPU Cycles prototipi 1200×800 / 24 örnek + OIDN. Boyut farkları açık etiketlenir; düşük örnekli önizlemeler üretim kalitesi kabulü değildir. Estetik kararı karar sahibi verir.

## Katalog rasterı

Sert güneş kaldırıldı. Pencere konumunda büyük RectAreaLight (LTC) ana ışıktır. Rasterda Three alan ışığı gölge haritası üretmediğinden düşük enerjili ayrı bir pencere gölge vekili VSM 2048 harita, radius 8, 16 blur örneği kullanır. Bu fiziksel alan gölgesi değildir; geniş yumuşak gölge için raster yaklaşımıdır. Hemisphere ve zayıf zemin dolgu ışığı yansımayı taklit eder; GTAO 32 örnek temas gölgesini korur. ACES, pozlama 1.05, SMAA ve sRGB çıkış kullanılır.

Poly Haven Studio Small 09 1K HDR ortam ışığı; ambientCG Plaster004, WoodFloor051 ve Tiles074 duvar/zemin haritaları yereldir. Kaynak, CC0 lisans ve SHA256 [cc0/](cc0/README.md) içindedir. Süpürgelik vardır, tavan geometrisi yoktur. Fotoğraf zemini görüş alanının dışına uzar; UV’ler metre cinsindedir (WoodFloor051: 1,8 m, Tiles074: 2,1 m tekrar dönemi). 55 mm lens, dikey up ve sıfır roll; ürünün asılma yüksekliği korunur. Üründe gerçek motorun kumaş/ahşap/taş malzemeleri kullanılır; CC0 mekân haritaları ürünün tasarımını değiştirmez.

## Ayrı render API'si

`assets/forma/atmosfer.js` yalnız çağrıldığında yüklenir. Stüdyoya veya müşteri akışına bağlanmaz. `createRenderAsset` gerçek motor malzemelerini ve geometriyi kopyalar; yalnız son görüntüye özgü bölümleme artırılır. Kenar yarıçapları ve üretim ölçüleri değiştirilmez.

```js
await renderAtmosphere({compiled,materials,family,canvas,width:2400,height:1600,
  preset:'north',samples:64,mode:'raster',signal,onProgress});
```

Varsayılan `raster`; `path` başarısız olursa hata verir. `auto` isteğe bağlıdır, yol başarısızlığında gerekçeli raster döndürür. Boş/siyah/saydam kare başarı sayılmaz. İptal ve grafik bağlamı kaybı hatayla sonlanır; sahip olunan geometri, harita, VSM hedefleri, postprocess ve tracer kaynakları temizlenir. Aynı cihazda görülmesi geniş cihaz uyumluluğu veya her cihazda performans garantisi değildir.

## Yol izleme tanısı

[path-diagnostics.json](path-diagnostics.json) gerçek backend ve hata kayıtlarını içerir. Önceki D3D11 denemesinde RGBA0 hedef vardı; bu tur D3D11 süre sınırına takıldı. Chrome ANGLE Vulkan'da gerçek API'nin ilk dört örneği geçti ve ardından ayrı önizlemeler alındı. OpenGL sayfa başlatma zaman aşımına uğradı. İlk turda sistem Edge çalıştırılabilir dosyası bulunamadı. Sonrasında Microsoft imzası ve resmî paket SHA256’sı doğrulanmış Edge 155.0.4283.62, kurulum yapmadan çalışma klasöründen temiz Playwright profiliyle denendi: D3D11 aynı RGBA0 hatasını verdi; aynı Iris Xe’de Vulkan dört örnekli gerçek API karesini geçti. Ayrı [Edge tanısı](edge-diagnostics.json) paket kaynağını, GPU arka ucunu ve sonuçları kaydeder. Kişisel profil kullanılmadı. Başka bir fiziksel cihaza erişim yoktur; test edilmiş gibi gösterilmez.

İki tarayıcıda da D3D11 başarısızlığı ve Vulkan başarısı, backend bağımlı bir sürücü/legacy WebGL tracer etkileşimini işaret eder; kesin kaynak düzeyi kök neden kanıtı değildir. Vulkan sonucu D3D11'i düzeltmez. Bu nedenle yol izleme deneysel/isteğe bağlı kalır; varsayılan yapılmaz. Tarayıcı backend'i uygulama kodundan değiştirilemez. Deneme için temiz test tarayıcısında `--use-angle=vulkan` kullanılır. Fiziksel alan ışığı ve HDRI bu yolda doğrudan örneklenir; raster gölge vekili kapatılır. Deneysel path görüntülerinde denoiser yoktur.

Yerel legacy pathtracer 0.0.23 + BVH 0.9.5 MIT paketidir; [kaynak ve lisans](../../assets/vendor/pathtracer/README.md). Üst kaynak [785 numaralı kayıt](https://github.com/gkjohnson/three-gpu-pathtracer/issues/785), 0.0.24'te ayrı bir vertex-color regresyonunu ve legacy bakım durumunu anlatır; burada görülen RGBA0'ın aynı hata olduğunu kanıtlamaz.

## Cycles ve yakın planlar

[Çalışır çevrimdışı prototip, tekrar üretim ve sunucu süre/maliyet notu](CYCLES.md). GLTFExporter geometri, malzeme ve haritaları GLB'ye gömer; [dışa aktarım doğrulama raporu](gltf-export-report.json) dosya hash'lerini ve gömülü görüntü sayılarını içerir. Büyük ara GLB'ler depoya konmaz; betikle yeniden üretilir. Blender CPU Cycles ve OIDN kullanır; Iris Xe gerekmez. Cycles sensörü yatay 35 mm olarak sabitlenir ve gerçek GLB `yfov` değeriyle karşılaştırılır. Her Cycles kaydı girdi GLB SHA256’sını taşır; doğrulama betiği dışa aktarım raporuyla eşleştirir.

Yakın planlar gerçek parçalardan seçilir, 85 mm lens/f5.6 ile alan derinliği hesaplanır. Kumaş veya ahşap olmayan üründe olmayan malzeme uydurulmaz; gerçek yüzey alternatifi raporda belirtilir. Üretim akışı/indirme paketi bu PR'ın kapsamı değildir.

## Yerel tekrar üretim

```powershell
$env:PLAYWRIGHT_MODULE='<kurulu-playwright-dizini>'
node tests/visual/atmosfer-01/run-local.mjs tests/visual/atmosfer-01/capture.mjs --mode=raster
node tests/visual/atmosfer-01/run-local.mjs tests/visual/atmosfer-01/capture.mjs --mode=path --backend=vulkan --width=800 --height=534 --samples=16
node tests/visual/atmosfer-01/run-local.mjs tests/visual/atmosfer-01/browser-check.mjs
node tests/atmosfer-check.mjs
```

Dinamik portlu sunucu yalnız 127.0.0.1'de, temiz Playwright profiliyle çalışır. Kişisel tarayıcı veya Windows arayüzü kullanılmaz. Çekim betiği dış ağ isteklerini reddeder. CC0 indirmeleri yalnız geliştirme sırasında yapıldı; API anahtarı veya bulut render servisi yoktur. score.mjs, METİN kayıtları ve beklemedeki işler değişmez.
