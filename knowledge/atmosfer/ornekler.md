# ATMOSFER-01 · dört yolun karşılaştırması

Eski raster byte olarak korunmuştur. Yeni raster **2400×1600**; yol izleme **deneysel Vulkan, 800×534 / 16 örnek**, denoiser yok; Cycles **CPU + OIDN, 1200×800 / 24 örnek** prototipidir. Aynı satır aynı tasarım JSON/seed kullanır. Çözünürlük, gürültü giderme ve ton eşleme farkları nedeniyle eşit piksel kalitesi iddia edilmez. Karar sahibi görsel onayı beklenir.

| Tasarım | Eski raster | Yeni raster | Yol izleme · deneysel | Cycles · CPU/OIDN |
|---|---|---|---|---|
| seating-01 | ![Eski](kareler/eski-raster/seating-01-final.jpg) | ![Yeni raster](kareler/seating-01-final.jpg) | ![Deneysel path](kareler/seating-01-path.jpg) | ![Cycles](kareler/seating-01-cycles.jpg) |
| seating-02 | ![Eski](kareler/eski-raster/seating-02-final.jpg) | ![Yeni raster](kareler/seating-02-final.jpg) | ![Deneysel path](kareler/seating-02-path.jpg) | ![Cycles](kareler/seating-02-cycles.jpg) |
| table-01 | ![Eski](kareler/eski-raster/table-01-final.jpg) | ![Yeni raster](kareler/table-01-final.jpg) | ![Deneysel path](kareler/table-01-path.jpg) | ![Cycles](kareler/table-01-cycles.jpg) |
| table-02 | ![Eski](kareler/eski-raster/table-02-final.jpg) | ![Yeni raster](kareler/table-02-final.jpg) | ![Deneysel path](kareler/table-02-path.jpg) | ![Cycles](kareler/table-02-cycles.jpg) |
| storage-01 | ![Eski](kareler/eski-raster/storage-01-final.jpg) | ![Yeni raster](kareler/storage-01-final.jpg) | ![Deneysel path](kareler/storage-01-path.jpg) | ![Cycles](kareler/storage-01-cycles.jpg) |
| storage-02 | ![Eski](kareler/eski-raster/storage-02-final.jpg) | ![Yeni raster](kareler/storage-02-final.jpg) | ![Deneysel path](kareler/storage-02-path.jpg) | ![Cycles](kareler/storage-02-cycles.jpg) |
| kitchen-01 | ![Eski](kareler/eski-raster/kitchen-01-final.jpg) | ![Yeni raster](kareler/kitchen-01-final.jpg) | ![Deneysel path](kareler/kitchen-01-path.jpg) | ![Cycles](kareler/kitchen-01-cycles.jpg) |
| kitchen-02 | ![Eski](kareler/eski-raster/kitchen-02-final.jpg) | ![Yeni raster](kareler/kitchen-02-final.jpg) | ![Deneysel path](kareler/kitchen-02-path.jpg) | ![Cycles](kareler/kitchen-02-cycles.jpg) |
| bath-01 | ![Eski](kareler/eski-raster/bath-01-final.jpg) | ![Yeni raster](kareler/bath-01-final.jpg) | ![Deneysel path](kareler/bath-01-path.jpg) | ![Cycles](kareler/bath-01-cycles.jpg) |
| bath-02 | ![Eski](kareler/eski-raster/bath-02-final.jpg) | ![Yeni raster](kareler/bath-02-final.jpg) | ![Deneysel path](kareler/bath-02-path.jpg) | ![Cycles](kareler/bath-02-cycles.jpg) |
| bedroom-01 | ![Eski](kareler/eski-raster/bedroom-01-final.jpg) | ![Yeni raster](kareler/bedroom-01-final.jpg) | ![Deneysel path](kareler/bedroom-01-path.jpg) | ![Cycles](kareler/bedroom-01-cycles.jpg) |
| bedroom-02 | ![Eski](kareler/eski-raster/bedroom-02-final.jpg) | ![Yeni raster](kareler/bedroom-02-final.jpg) | ![Deneysel path](kareler/bedroom-02-path.jpg) | ![Cycles](kareler/bedroom-02-cycles.jpg) |

## Gerçek parçalardan yakın planlar

85 mm, f/5.6; CPU Cycles/OIDN. Üründe bulunmayan kumaş/dikiş veya ahşap eklenmez. Böyle bir sütunda ürünün gerçek yüzey alternatifi gösterilir ve raporda malzeme anahtarı belirtilir. Dosya adı istenen ayrıntı sınıfını taşır; gerçek malzemeyi rapordan okuyun.

| Tasarım | Yüzey / varsa kumaş ve dikiş | Lif / varsa ahşap ve kesit | Kenar / birleşim |
|---|---|---|---|
| seating-01 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| seating-02 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| table-01 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| table-02 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| storage-01 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| storage-02 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| kitchen-01 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| kitchen-02 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| bath-01 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| bath-02 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| bedroom-01 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |
| bedroom-02 | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi | Makro kamera yenilemesi sürüyor — henüz teslim edilmedi |

[Render mimarisi ve tekrar üretim](README.md) · [Cycles prototipi ve sunucu notu](CYCLES.md) · [CC0 kaynakları](cc0/README.md) · [Backend tanısı](path-diagnostics.json)
