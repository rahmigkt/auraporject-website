# Çevrimdışı Cycles · main #61 revizyonu

GLTFExporter güncel motorun geometri, PBR malzeme ve haritalarını GLB'ye gömer. Procedural DataTexture'lar CanvasTexture'a çevrilirken wrap, repeat/offset/center/rotation ve renk uzayı korunur. Kaydırmalı kamera ve alan ışığı/HDRI standard glTF'de tam temsil edilmediğinden yan JSON'dan kurulur. 55 mm, yatay 35 mm sensör ve gerçek `yfov` eşleşmesi denetlenir; `shiftY` Cycles'a uygulanır. 85 mm/f5.6 yakın planda lens kaydırması sıfırlanır. Kamera quaternion kipindedir; gerçek yüzey optik merkezde doğrulanır.

Blender 4.5.3 LTS, CPU Cycles ve OpenImageDenoise kullanılır. Genel ve yakın plan dosyaları **2400×1600**; genel en çok **32**, yakın plan en çok **24** örnek kullanır. Adaptif alt sınır açıkça **4**, gürültü eşiği **0,035** olarak sabittir. Blender'ın otomatik alt sınırı bu üst sınırların üstünde kaldığından açık değer gereklidir ([4.5.3 kaynak kodu](https://github.com/blender/blender/blob/v4.5.3/intern/cycles/scene/integrator.cpp#L377-L387)); çözünürlük ve gürültü hedefi düşürülmez. 18 Ekim'in 1200/1000 px Cycles dosyaları yeni teslim sayılmaz; güncel 48 CPU karesi tek kaynak geçişinde yeniden üretilir. Süreler ve kaynak betik SHA256'sı `kareler/cycles-report.json` içindedir. Büyük ara GLB'ler, Blender ve Python ortamı depoya eklenmez.

## Tekrar üretim

```powershell
$env:PLAYWRIGHT_MODULE='<kurulu-playwright-dizini>'
$env:ATMOSFER_EXPORT_DIR='<mutlak-glb-cikti-dizini>'
node tests/visual/atmosfer-01/run-local.mjs tests/visual/atmosfer-01/export.mjs
python tests/visual/atmosfer-01/verify-gltf.py --input '<mutlak-glb-cikti-dizini>'
blender --background --python-exit-code 1 --threads 0 --python tests/visual/atmosfer-01/cycles.py -- --input '<mutlak-glb-cikti-dizini>' --output '<depo>/knowledge/atmosfer/kareler' --width 2400 --samples 32 --detail-width 2400 --detail-samples 24 --closeups
python tests/visual/atmosfer-01/verify-artifacts.py
python tests/visual/atmosfer-01/build-gallery.py
```

Yollar Blender sahne sıfırlamasından önce mutlaklaştırılır. `--probe --closeups` görüntü üretmeden gerçek rol/odak denetimini çalıştırır; `--id` belirli tasarımı seçer. Ayrıntı kuralları tasarım fixture'ında kayıtlıdır. Yanlış role isabet, geometri içindeki kamera, boş/karanlık JPEG ve ortak malzemede yinelenen bevel düğümü hata verir. Normal haritası korunur; kumaşa bevel eklenmez. Cycles AgX, raster ACES kullanır; iki motorda aynı piksel tonu beklenmez. Işık gücü birimleri farklı olduğu için Cycles pencere 500 W ve zayıf dolgu 45 W ile kalibre edilir.

## Canlı site için sunucu notu

Canlı siteye bu PR ile dağıtım yapılmaz. Sonraki render sunucusu için iş kuyruğu, sabit Blender/CC0 sürümlü CPU worker, süre/bellek sınırları ve sonuçlar için nesne depolama gerekir. İş tasarım JSON'u, motor/malzeme sürümü, kamera/ışık ve örnek sayısı hash'iyle önbelleklenebilir. GLB'yi bir kez yükleyip dört kamerayı aynı süreçte işlemek veya aynı sahneyi tasarım JSON'undan sunucuda kurmak yükleme maliyetini azaltır. Bu PR proje sonu akışını veya tasarımcı paketini açmaz.

Maliyet formülü: **worker saat fiyatı × ölçülen saniye / 3600**, ayrıca boşta kalma, depolama ve trafik. Örneğin yalnız varsayımsal 0,50 USD/saat ve 180 sn/kare için 0,025 USD/kare çıkar; bu bir sağlayıcı fiyatı veya bu 2400 px koşunun ölçümü değildir. Gerçek güncel dizüstü süreleri render raporundadır. Sunucu süresi seçilecek makinede aynı sahnelerle ölçülmelidir; daha önceki düşük çözünürlüklü koşudan süre tahmini yapılmaz.

Kaynaklar: [resmî Blender 4.5 indirmesi](https://download.blender.org/release/Blender4.5/), [komut satırı](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html), [Cycles örnekleme/denoise](https://docs.blender.org/manual/en/latest/render/cycles/render_settings/sampling.html), [CC0 kayıtları](cc0/README.md).
