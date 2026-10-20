# YERLEŞİM-KAYNAKLAR-01 — Yapay zekâ ile mobilya yerleşimi: kaynaklar, lisanslar, AURA'ya alınanlar

Tarih: 21 Ekim 2026. Hazırlayan: Claude. Amaç: Qwen eğitimi için yerleşim verisi ve yöntem kaynaklarını toplamak, lisansı uygun olanı işlemek.

## Sonuç

- Ticari kullanıma açık, mobilyası olan büyük ve hazır tek kaynak **ProcTHOR-10K** çıktı (AI2, Apache-2.0). İçinde 12.000 ev ve 48.000'e yakın oda var. Bu kaynak alındı ve işlendi.
- ProcTHOR yerleşimleri bir tasarımcının elinden çıkmadı; kurallarla üretildi. Örneklere bakınca bunu görüyoruz:
  - mobilyalar duvara yaslanmış;
  - orta sehpalar kanepeden 1–5 m uzakta;
  - sandalyeler masanın üstünde.
- Bu yüzden ProcTHOR'un **yerleşimi doğrudan öğretilmedi**. İki ayrı şekilde kullanıldı:
  1. **Kural denetiminden geçen ProcTHOR odaları:** Gerçekçi alan, çakışma yok, kapı önü boş, pencere önü kapalı değil, sehpa ve TV mesafeleri doğru. 12.827 oda bu denetimi geçti. Bunlar "geçerli yerleşim" örneği; tasarım örneği değil.
  2. **ProcTHOR odası + AURA çözücüsü:** Odanın biçimi, kapıları ve pencereleri ProcTHOR'dan; yerleşimi AURA'nın kuralları (`assets/ev/yerlesim.js`) yapıyor. Eşyalar Avrupa ölçülerinde. Çözücü sığdıramadığında örnek, asistanın bunu dürüstçe söylediği bir cevap oluyor.
- Tasarımcı elinden çıkmış en iyi veri setleri (3D-FRONT, HSSD, Matterport) **ticari kullanıma kapalı ya da lisansı belirsiz.** Eğitime alınmadı.

## Veri setleri

| Kaynak | İçerik | Lisans | AURA kararı |
|---|---|---|---|
| [ProcTHOR-10K](https://github.com/allenai/procthor-10k) ([makale](https://arxiv.org/pdf/2206.06994)) | 10k+1k+1k ev: oda poligonu, kapı, pencere, nesne konumu ve dönüşü | Apache-2.0 (repo LICENSE) | **Alındı.** `tools/yerlesim-veri/` |
| [procthor asset-database](https://github.com/allenai/procthor) | Nesne sınır kutuları (gerçek ölçü) | Apache-2.0 | **Alındı.** Ölçüler için |
| 3D-FRONT / 3D-FUTURE (Alibaba) | ~18k oda, tasarımcı yerleşimi; ATISS, DiffuScene ve InstructScene'in temeli | [Kullanım sözleşmesi](https://terms.aliyun.com/legal-agreement/terms/suit_bu1_ali_cloud/suit_bu1_ali_cloud202004171628_60052.html); araştırma amaçlı | Ticari eğitim için **alınmadı.** Yalnızca yöntemlere referans |
| [HSSD-200](https://arxiv.org/pdf/2306.11290) ([modeller](https://huggingface.co/datasets/hssd/hssd-models)) | 211 elle tasarlanmış ev | Ticari olmayan lisans bildiriliyor; doğrulanmalı | Alınmadı |
| [M3DLayout](https://github.com/Graphic-Kiliani/M3DLayout-code) (CVPR 2026) | 3D-FRONT + Matterport3D + Infinigen; yerleşim ve metin açıklaması | Repoda lisans yazmıyor; kaynaklarının lisansları geçerli | Alınmadı. Infinigen kısmı sonra değerlendirilebilir |
| [IL3D](https://arxiv.org/pdf/2510.12095) | 27.816 yerleşim, USD biçimi; 3D-FRONT + HSSD | Belirtilmemiş, kaynakları ticari değil | Alınmadı |
| Matterport3D | 90 gerçek ev taraması | [Akademik EULA](https://matterport.com/matterport-end-user-license-agreement-academic-use-model-data) | Alınmadı |
| Swiss Dwellings / ResPlan | Gerçek kat planları (mobilya yok) | CC BY 4.0 | Ev planı için zaten kullanılıyor (EV-SOHBET-02) |

## Yöntemler (fikir kaynağı; veri değil)

- **Merrell vd. 2011, [Interactive Furniture Layout Using Interior Design Guidelines](https://graphics.stanford.edu/projects/furniture/):**
  - Kurallar: dolaşım, sohbet mesafesi, odak noktası (TV/şömine), denge, hizalama, geçiş payları.
  - AURA'nın çözücüsü aynı mantıkta.
  - Yöntem patentli ([US 9,355,470](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9355470)). Kodu kopyalanmadı; kurallar iç mimarlığın genel bilgisi. Ürünleşmeden önce patentin geçerlilik süresine bakılmalı.
- **Holodeck (CVPR 2024, [makale](https://arxiv.org/abs/2312.09067v1)):**
  - Dil modeli yalnızca **kısıt** üretiyor ("kanepe TV'ye bakar, duvara yakın"); konumu çözücü buluyor.
  - Bu, AURA'da Qwen ile çözücü arasındaki iş bölümünün aynısı. Qwen'e koordinat ezberletmek yerine niyet ve kısıt yazdırmak daha sağlam.
- **ATISS, DiffuScene, InstructScene, LayoutGPT, LLplace, LayoutVLM:** Hepsi 3D-FRONT üzerinde eğitilmiş üretici modeller. Listeler: [Awesome-3D-Scene-Generation](https://github.com/hzxie/Awesome-3D-Scene-Generation), [Awesome-Indoor-Scene-Synthesis](https://github.com/YandanYang/Awesome-Indoor-Scene-Synthesis). [InstructScene](https://github.com/chenguolin/InstructScene) "talimattan sahne grafiği" fikri için iyi bir referans.

## Üretilen dosyalar

- `tools/yerlesim-veri/procthor_incele.py`: Yön kuralını veriden ölçer. Nesnenin önü, yerel +z ekseninin rotation.y açısı kadar döndürülmüş hâli.
- `tools/yerlesim-veri/procthor_donustur.py`: ProcTHOR'u AURA kaydına çevirir, AURA denetimini çalıştırır ve geçen odalarla Türkçe eğitim JSONL'i yazar.
- `tools/yerlesim-veri/cozucu_ornekleri.mjs`: ProcTHOR odalarını AURA çözücüsüyle döşer.
- `knowledge/ai-egitim/veri/yerlesim/`: Rapor, örnekler ve sıkıştırılmış eğitim dosyaları. Büyük ham dosya repoya konmadı; betikle yeniden üretilir.

## Kalan işler

- Çözücünün kendi hataları, ProcTHOR odalarında görüldü ve düzeltilecek:
  - pencere ile kapının bölünmüş duvar kenarında eşleşmesi düzeltildi;
  - büyük salonlarda eşyalar bir köşede toplanıyor;
  - yemek masası kanepenin arkasına yapışıyor.
- Qwen için hedef biçim kısıt dili olmalı (Holodeck yaklaşımı): koordinat çözücüden, gerekçe ve kısıt modelden.
