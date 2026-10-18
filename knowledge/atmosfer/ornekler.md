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
| seating-01 | ![fabric](kareler/seating-01-detail-fabric.jpg) | ![wood](kareler/seating-01-detail-wood.jpg) | ![joint](kareler/seating-01-detail-joint.jpg) <br> Ahşap yok; gerçek fabric gösterilir. |
| seating-02 | ![fabric](kareler/seating-02-detail-fabric.jpg) | ![wood](kareler/seating-02-detail-wood.jpg) | ![joint](kareler/seating-02-detail-joint.jpg) <br> Ahşap yok; gerçek ahşap gösterilir. |
| table-01 | ![fabric](kareler/table-01-detail-fabric.jpg) <br> Kumaş yok; gerçek tabla gösterilir. | ![wood](kareler/table-01-detail-wood.jpg) | ![joint](kareler/table-01-detail-joint.jpg) |
| table-02 | ![fabric](kareler/table-02-detail-fabric.jpg) <br> Kumaş yok; gerçek tabla gösterilir. | ![wood](kareler/table-02-detail-wood.jpg) | ![joint](kareler/table-02-detail-joint.jpg) |
| storage-01 | ![fabric](kareler/storage-01-detail-fabric.jpg) <br> Kumaş yok; gerçek kapak / ön yüz gösterilir. | ![wood](kareler/storage-01-detail-wood.jpg) | ![joint](kareler/storage-01-detail-joint.jpg) |
| storage-02 | ![fabric](kareler/storage-02-detail-fabric.jpg) <br> Kumaş yok; gerçek kapak / ön yüz gösterilir. | ![wood](kareler/storage-02-detail-wood.jpg) | ![joint](kareler/storage-02-detail-joint.jpg) |
| kitchen-01 | ![fabric](kareler/kitchen-01-detail-fabric.jpg) <br> Kumaş yok; gerçek kapak / ön yüz gösterilir. | ![wood](kareler/kitchen-01-detail-wood.jpg) | ![joint](kareler/kitchen-01-detail-joint.jpg) |
| kitchen-02 | ![fabric](kareler/kitchen-02-detail-fabric.jpg) <br> Kumaş yok; gerçek kapak / ön yüz gösterilir. | ![wood](kareler/kitchen-02-detail-wood.jpg) | ![joint](kareler/kitchen-02-detail-joint.jpg) |
| bath-01 | ![fabric](kareler/bath-01-detail-fabric.jpg) <br> Kumaş yok; gerçek kapak / ön yüz gösterilir. | ![wood](kareler/bath-01-detail-wood.jpg) | ![joint](kareler/bath-01-detail-joint.jpg) |
| bath-02 | ![fabric](kareler/bath-02-detail-fabric.jpg) <br> Kumaş yok; gerçek kapak / ön yüz gösterilir. | ![wood](kareler/bath-02-detail-wood.jpg) <br> Ahşap yok; gerçek kapak / ön yüz gösterilir. | ![joint](kareler/bath-02-detail-joint.jpg) |
| bedroom-01 | ![fabric](kareler/bedroom-01-detail-fabric.jpg) | ![wood](kareler/bedroom-01-detail-wood.jpg) | ![joint](kareler/bedroom-01-detail-joint.jpg) |
| bedroom-02 | ![fabric](kareler/bedroom-02-detail-fabric.jpg) | ![wood](kareler/bedroom-02-detail-wood.jpg) | ![joint](kareler/bedroom-02-detail-joint.jpg) |

[Render mimarisi ve tekrar üretim](README.md) · [Cycles prototipi ve sunucu notu](CYCLES.md) · [CC0 kaynakları](cc0/README.md) · [Backend tanısı](path-diagnostics.json)
