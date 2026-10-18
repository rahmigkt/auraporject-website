# Codex iş emri önerisi — ARAŞTIRMA-01: önceki çalışmaları topla, AURA'ya göre derle

Hazırlayan: denetçi (Claude), 2026-10-18. Karar sahibinin yönü: sıfırdan başlamayalım; bu alanda yapılmış her şeyi
toplayıp AURA'ya bağlayalım; çok sınırlayarak gitmeyelim. **TASARIM-01'den önce ya da onunla paralel yürür;
TASARIM-01'in yöntemi bu derlemeye göre güncellenebilir.** İş emirlerindeki eşikler başlangıç değerleridir,
derleme daha iyisini gösterirse değiştirilir.

## Taranacak alanlar (GitHub, Hugging Face, arXiv/Papers with Code, Kaggle, açık veri depoları, üretici belgeleri)

1. **Metinden 3D / CAD / parametrik tasarım:** text-to-CAD, LLM ile CadQuery/OpenSCAD/JSON üretimi, program
   sentezi ile şekil üretimi, metinden mobilya ve iç mekân üretimi (yerleşim + parça), görselden CAD.
2. **Mobilya veri setleri:** 3D-FRONT / 3D-FUTURE, PartNet, ShapeNet mobilya sınıfları, ABO, IKEA montaj/parça
   veri setleri, ölçülü mobilya katalogları, oda yerleşim veri setleri.
3. **Prosedürel ve parametrik mobilya üreticileri:** Infinigen ve benzerleri, OpenSCAD/FreeCAD mobilya
   kütüphaneleri, açık kaynak dolap/mutfak planlayıcıları, ebatlama ve kesim optimizasyonu, montaj talimatı üretimi.
4. **LLM ile tasarım ajanları:** araç çağıran tasarım ajanları, kısıt çözücü + LLM melezleri, tercih eğitimi (DPO)
   ile estetik öğrenme, tasarım değerlendirme (LLM-as-judge) çalışmaları.
5. **Bilgi:** ergonomi ve standart ölçüler (oturma, masa, dolap, mutfak, banyo), marangozluk/panel kuralları,
   malzeme bilgisi, mobilya tarzları ve terminoloji (çok dilli, Türkçe dahil).
6. **Yerel model pratiği:** Qwen ailesi ile JSON/şema kısıtlı ince ayar, LoRA tarifleri, küçük modelde yapılandırılmış
   çıktı başarısı ölçümleri.

## Her kaynak için kayıt (`knowledge/arastirma/katalog.jsonl`)

`{ad, bağlantı, tür (kod/veri/makale/model/belge), lisans, tarih, ne yapıyor, AURA'da nereye oturur
(dinleme / tasarım üretimi / özgünlük / motor / ölçü bilgisi / üretim), kullanılabilirlik (doğrudan / uyarlanır /
yalnız fikir), risk}`. Okunmadan kayıt açılmaz; "ne yapıyor" kaynaktan doğrulanmış olur.

## Kurallar

- **Lisans:** kod/veri yalnız izin veren lisansla (MIT, Apache, BSD, CC-BY vb.) depoya alınır; ticari kullanımı
  yasaklayan (CC-BY-NC, araştırma-yalnız) kaynaklar yalnız fikir/yöntem olarak kaydedilir, verisi alınmaz.
- Büyük veri setleri depoya konmaz; bağlantı, boyut, lisans ve indirme yolu yazılır.
- Marka ürünlerinin tasarımı kopyalanmaz; ölçü ve yöntem bilgisi kullanılır (sitenin mevcut ilkesi).
- Müşteri verisi yok.

## Teslim

1. `katalog.jsonl` (hedef: en az 80 doğrulanmış kaynak, her alandan).
2. `knowledge/arastirma/DERLEME.md`: alan alan en önemli 5–10 kaynak; her biri için AURA'da ne işe yarar.
3. `knowledge/arastirma/ONERI.md`: bu derlemeye göre TASARIM-01'de neyi değiştirmek gerektiği (veri kaynağı, model,
   yöntem, ölçüt), hazır alınabilecek bileşenler ve tahmini kazanç; motora eklenmesi gereken parça türleri.
4. Doğrudan kullanılabilir küçük bileşenler (lisansı uygunsa) ayrı klasörde, kaynağı ve lisansı belirtilerek.

PR açılır, birleştirilmez; denetim D3.
