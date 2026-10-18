# Çevrimdışı Cycles prototipi

`export.mjs`, GLTFExporter ile gerçek ürün ve mekân geometrisini, PBR malzemelerini ve doku haritalarını GLB içinde gömer. Prosedürel DataTexture'lar CanvasTexture'a çevrilirken wrap, renk uzayı ve UV dönüşümleri korunur. Alan ışığı/HDRI glTF'de taşınmadığından yan JSON'da konum/boyut/renk kaydedilir; `cycles.py` bunları kurar. Kamera görüş açısı GLB’nin gerçek `yfov` değeriyle denetlenir; yatay 35 mm sensör kullanılır. Kamera ve mekân aynıdır: 55 mm genel, 85 mm yakın plan, sıfır roll, tavan geometrisi yok. Cycles gerçek alan ışığı ve sekiz sıçrama kullanır; raster gölge vekili Cycles'a taşınmaz. Işık güçleri render motorlarının farklı birimleri için kalibre edilmiştir; ACES (raster) ve AgX (Cycles) aynı piksel sonucunu iddia etmez.

## Tekrar üretim

Blender 4.5.3 LTS taşınabilir sürüm kullanıldı (resmi https://download.blender.org/release/Blender4.5/). Depoya Blender veya Python ortamı eklenmez.

```powershell
$env:PLAYWRIGHT_MODULE='<kurulu-playwright-dizini>'
$env:ATMOSFER_EXPORT_DIR='<mutlak-glb-cikti-dizini>'
node tests/visual/atmosfer-01/run-local.mjs tests/visual/atmosfer-01/export.mjs
blender --background --python-exit-code 1 --threads 0 --python tests/visual/atmosfer-01/cycles.py -- --input '<mutlak-glb-cikti-dizini>' --output '<mutlak-kare-dizini>' --width 1200 --samples 24 --detail-width 1000 --detail-samples 16 --closeups
```

Girdi/çıktı yolları Blender sahne sıfırlamasından önce mutlaklaştırılır. CPU Cycles ve OpenImageDenoise (OIDN) seçilir; özel GPU gerekmez. Bu tur prototip genel kareleri 1200×800, yakın planlar 1000×667; 2400 px rasterdan ayrı etiketlenir. Örnek sayıları düşük prototip bütçesidir; dokuma ayrıntısını OIDN yumuşatabilir. Üretim çözünürlüğü/örnek sayısı sonraki sunucu ölçümünde artırılır. Gerçek süreler `kareler/cycles-report.json` içindedir.

Yakın plan, gerçek parça `materialKey`/`role` bilgisinden seçilir; ürünün olmayan kumaşını veya ahşabını üretmez. Alternatif gerçek yüzey gösterilmişse rapor bunu açıkça belirtir. Alan derinliği Cycles kamerada f/5.6 ile fiziksel hesaplanır. Odak gerçek sahne raycast kesişimine bağlanır; istenen malzeme başka parça tarafından örtülüyorsa alternatif bakış denenir ve doğrulanamayan kare hata verir. Yalnız son render asset'inde eğri yüzeyler daha yüksek bölümlemeyle kurulur; stüdyo ve üretim parça boyutları aynı kalır. Cycles bevel normal düğümü mevcut normal haritasını koruyarak alt milimetrelik kenar vurgusunu yumuşatır.

## Canlı site için kısa sunucu notu

Tarayıcı dışa aktarımını alan bir iş kuyruğu, sabit Blender/CC0 paketli CPU worker, süre/bellek sınırı ve sonuçlar için nesne depolama gerekir. İş; tasarım JSON'u, motor/malzeme sürümü, kamera, ışık ve örnek sayısı hash'iyle önbelleklenebilir. İstek başına Blender başlatma ve büyük GLB yükleme yerine tasarım JSON'undan sunucuda aynı sahneyi kurmak veya GLB'yi bir kez yükleyip dört kamerayı tek süreçte işlemek daha uygundur. Bu PR sunucu dağıtmaz ve proje sonu kullanıcı akışını açmaz.

Maliyet hesabı: **kare maliyeti = worker saat fiyatı × ölçülen saniye / 3600**, buna boşta kalma, depolama ve trafik eklenir. Yalnız örnek hesap olarak saat ücreti 0,50 USD ve kare süresi 180 sn ise kare 0,025 USD, 12 genel kare 0,30 USD eder; bunlar sağlayıcı teklifi değildir. Bir worker'da süreler toplanır; 12 genel + 36 yakın plan için kuyruk gecikmesi ayrıca gösterilmelidir. Gerçek sunucu süresi bu dizüstü ölçümünden çıkarılamaz; seçilecek makinede aynı 12 sahneyle ölçülmelidir.

Kaynaklar: [Blender komut satırı](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html), [Cycles örnekleme ve denoise](https://docs.blender.org/manual/en/latest/render/cycles/render_settings/sampling.html), [CC0 kaynakları](cc0/README.md).

Makro kamera dönüşü quaternion kipinde uygulanır; seçilen gerçek yüzeyin görüntü merkezinde olduğu `world_to_camera_view` ile doğrulanır. Kamera, genel bakıştan ilk görülen yüzeyin önüne alınarak dolabın içine yerleşmesi önlenir. Her yazılmış JPEG boş/karanlık kare denetiminden geçer. Ortak malzemeye bevel normal düğümü yalnız bir kez eklenir; kumaşa eklenmez.

Genel kareler ilk geçerli CPU geçişinden korunur; kaynak commit ve dosya hashleri `kareler/cycles-general-report.json` içindedir. Makrolar ayrı kamera geçişiyle yenilenir; aynı geometri ve malzeme GLB hashleri korunur.

## Bu cihazdaki gerçek CPU süreleri

12 genel kare toplam 1080 sn (kare başına 78–115 sn); 36 yakın planın ayrı geçişi toplam 1668 sn sürdü. İki geçişin toplamı 45.8 dakika. Yakın plan süresi sahne kurulumunu da içerir. Bu ölçümler bu dizüstü ve yukarıdaki prototip çözünürlükleri içindir; sunucu kapasitesi veya üretim kalitesi için süre garantisi değildir. Ayrıntılı sahne bazlı kayıtlar `kareler/cycles-report.json` ve ham makro geçişi `kareler/cycles-detail-run.json` içindedir.
