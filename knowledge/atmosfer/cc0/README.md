# Yerel CC0 kaynakları

18 Ekim 2026 tarihinde resmi kaynaklardan indirildi. Çalışma anında CDN yoktur.

| Varlık | Kaynak | Lisans | Kullanılan dosyalar |
|---|---|---|---|
| Studio Small 09 · 1K Radiance HDR | https://polyhaven.com/a/studio_small_09 | CC0 https://polyhaven.com/license | HDR ortam ışığı |
| Plaster004 · 1K JPG | https://ambientcg.com/view?id=Plaster004 | CC0 https://docs.ambientcg.com/license/ | Color, NormalGL, Roughness |
| WoodFloor051 · 1K JPG | https://ambientcg.com/view?id=WoodFloor051 | CC0 | Color, NormalGL, Roughness |
| Tiles074 · 1K JPG | https://ambientcg.com/view?id=Tiles074 | CC0 | Color, NormalGL, Roughness |

Kaydedilen kaynak haritaların piksel verisi değiştirilmedi; dosya adları kısaltıldı. 19 Ekim revizyonunda Plaster004 albedosu çalışma anında açık, nötr kireç sıvaya dönüştürülür; kaynak normal/pürüz haritaları korunur. Türetilmiş albedo GLB'ye gömülür. Zemin bütün ailelerde WoodFloor051'dir; dama Tiles074 dosyaları eski kaynağın kaydı olarak durur, yeni sahnede yüklenmez. Ürün malzemeleri çizim motorunun gerçek haritalarıdır; CC0 kaynakları yalnız mimari mekândadır. `manifest.json` indirilen kaynakların byte boyutu ve SHA256 değerlerini içerir.

Three r186 HDRLoader ve RectAreaLight yardımcıları resmi `mrdoob/three.js` r186 kaynaklarından alındı; yalnız import yolu mevcut yerel Three çekirdeğine uyarlandı. Depodaki Three MIT lisansı geçerlidir.
