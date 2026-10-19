# Qwen'in asıl eğitim ortamı: mevcut AURA stüdyosu

Karar sahibi hatırlatması, 2026-10-19: sitedeki gelişmiş stüdyo eğitimin merkezidir.
`geometry-v1` yalnız yardımcı geometri/öğrenme alıştırmasıdır; tek başına AURA
eğitimine hazır olunduğunu göstermez. Ayrı bir çizim motoru kurulmayacak.

## Gerçek bağlantılar

- `assets/forma/studio.js`: tarayıcı stüdyosu, `applyActions` ve `setDesign` akışı.
  `applyActions` modül dışına açılmış saf bir işlev değildir; mevcut pilot onu
  çalıştırmıyor. Tarayıcıda aynı uygulama yolu üzerinden geri oynatma kurulmalı.
- `assets/forma/ai.js`: `vocabulary(design)` ve `sanitizeActions`. Model, o anda
  açık aile/türün gerçek seçeneklerinden `set`, `delta`, `enum`, `material`,
  `style`, `kind` önerileri üretir. Kelime listesi filtresi tek başına fizik veya
  sayısal aralık güvenliği sağlamaz.
- `assets/forma/generate.js`: `normalizeDesign` ve `compileDesign`; tasarımın
  gerçekte aldığı son biçim eğitim kanıtına dahil edilir. Sessiz düzeltme/yuvarlama,
  modelin hedefi tam tutturduğu şeklinde sayılmaz.
- `tasarimci.html` → `assets/forma/atelier.js` → `overrides.js`: mevcut parça
  silueti ve torna profili düzenleme katmanı. Desteklenmeyen yeni parça/işlem
  uydurmak yerine mevcut araçlarla uyumlu öneri gerekir.
- `assets/forma/physics.js`: mevcut yaklaşık ön denetimler. Uyarıları model
  susturamaz; müşteri/tasarımcı onayı ve üretim denetimi ayrıca korunur.

Depoda `assets/design-tools.js` ile ayrı bir eski stüdyo araç sözleşmesi de var:
ölçüleri dıştan **cm**. Forma şeması **mm**. İkisini tek örnekte karıştırmak eğitim
hatası yaratır; birincil sözleşme Forma, eski sözleşme gerekirse ayrı adaptördür.

## İlk gerçek stüdyo eğitim örneğinin biçimi

Girdi: açık tasarımın family/kind/style/params/materials/overrides durumu + gerçek
`vocabulary(design)` + kullanıcının isteği. Hedef: yalnız izinli işlem dizisi.
Kanıt: işlem öncesi/sonrası tasarım, gerçekten derlenen parçalar, gerçekleşen ölçü
değişimi, aralık/enum ve fizik uyarıları. Her varyant aynı bölümde kalır. Örneğin
"genişliği 10 cm artır" için `delta/width/100`; fakat sonuç motorun sınırına
takılırsa hedefin tam uygulanmadığı ayrıca kaydedilir. Otomatik etiketler
insan onayına kadar `unreviewed` kalır.

Sonraki görsel çiftler başka programın rastgele renderlarıyla başlamaz: önce
stüdyonun kendi tasarımı ve çoklu görünümü kullanılır. Açık CAD araçları daha sonra
bu sözleşmeye çevrilebildiği ölçüde genel geometrik bilgi ekler. Estetik tercihler
aynı kamera/ışık altında ve teknik açıdan geçerli seçenekler arasında değerlendirilir.

## Bu güncellemede yapılan / sıradaki iş

`studio_contract.mjs`, mevcut `vocabulary`, `sample`, `sanitizeActions` ihracatını
doğrudan kullanarak beş aile için çalışma sözleşmesini ve kaynak hash'lerini
çıkarır. Ailede gerçekten var olan sayısal alan işleminin korunmasını ve yabancı işlem/alanların
reddedilmesini sınar. Bu dosya yeni bir elle yazılmış mobilya sözlüğü değildir.

Bu yalnız sözleşme bağlantısıdır: tarayıcıdaki gerçek `applyActions` geri oynatması,
stüdyo temelli eğitim seti, görüntü çiftleri ve yerel model bağlantısı henüz yapılmadı.
GPU pilotundan önce gerçek stüdyo düzenleme örneklerinin geri oynatılması ve
doğrulanması tamamlanacak. Önceki 1000 basit şekil kaydı ana veri olarak sunulmaz.
`assets/` bu PR'da değişmez; sonraki entegrasyon için gerekirse ayrıca kapsamı
açık bir stüdyo PR'ı hazırlanır.
