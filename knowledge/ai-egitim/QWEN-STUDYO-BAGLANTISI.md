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

## Stüdyo da gelişecek — sabit bir araç listesine kilitlenmeyecek

Karar sahibi ek kararı: Qwen mevcut stüdyoyu öğrenirken stüdyo da yeni geometri,
düzenleme araçları ve ürün aileleriyle geliştirilecek. Bugünkü yapı buna kısmen
uygun: `FAMILIES` aile modüllerini bir araya getiriyor; geometri tanımları,
malzemeler ve `overrides` ayrı katmanlar. Fakat yeni geometri türleri `build.js`,
yeni düzenleme araçları `overrides.js` içinde açık dallar gerektiriyor; tarayıcı
işlem uygulaması da `studio.js` içinde bağlı. Dolayısıyla modüler bir temel var,
tam bir eklenti sistemi veya her yeni aracı otomatik öğrenen model henüz yok.

Geliştirme sözleşmesi:

1. **Ortak araç tanımı:** her aracın sabit kimliği, sürümü, desteklenen parça/aile,
   parametreleri, birimi, kısıtları, uygulama ve doğrulama işlevleri tanımlanır.
   Arayüz, Qwen'e verilen yetenek listesi ve veri üreticisi aynı tanımdan beslenir.
   İlk öncelik, tarayıcı işlem uygulamasını test edilebilir ortak çekirdeğe ayırmaktır.
2. **Sürümlü belgeler ve yetenekler:** kayıtlı tasarım şeması, işlem sözleşmesi ve
   model uyumluluğu ayrı sürümlenir. Eski projeler için açık göç işlemleri ve
   yeniden açma testleri gerekir. Bilinmeyen işlem sessizce başka işleme dönüşmez.
3. **Yeni araç önce stüdyoda:** yeni eğri, kenar profili, sweep, birleşim veya ürün
   ailesi önce motor, önizleme, geri al/yinele ve kaydet/aç ile çalışır; yalnız
   planlanan araç modelin kullanılabilir sözlüğüne eklenmez. Üretim çıktısını
   etkiliyorsa çizim, DXF/BOM ve parça kimliği bağlantıları da sınanır.
4. **Birlikte güncellenen eğitim:** çalışan yeni aracın doğru/hatalı/düzeltilmiş
   örnekleri ve görüntüleri üretilir; veri kaydı motor/araç sürümünü taşır. Önce
   mevcut Qwen'in güncel sözlükle aracı kullanması ölçülür. Yetmiyorsa yalnız bu
   beceri için kısa adaptasyon ve eski becerileri koruyan karışım yapılır.
   Her stüdyo değişikliği yeniden eğitim gerektirmez; renk seçeneği ile yepyeni
   geometri işlemi aynı büyüklükte iş sayılmaz.
5. **Model önerir, kodu onaylı geliştirme süreci değiştirir:** Qwen'in çalışma
   anında sitenin JavaScript'ini değiştirmesi veya serbest kod çalıştırması yoktur.
   Desteklenmeyen istekler kişisel veri içermeyen yetenek açığı örnekleri olarak
   incelenebilir; gerçek müşteri/tasarımcı kayıtları ancak ayrıca açık rızayla alınır.

İlk uygulama sırası: ortak işlem çekirdeği ve tarayıcı geri oynatma → sürümlü araç
tanımları/uyumluluk testi → mevcut stüdyodan veri → küçük Qwen pilotu. Yeni araçlar
ihtiyaca göre ayrı, denetlenebilir PR'larla eklenir. Stüdyo geliştirme işi veri
üretiminin tamamlanmasını veya uzun bir model eğitimini beklemek zorunda değildir.
Bu bölüm mimari plandır; eklenti sistemi, sürüm göçleri ve yeni araçlar bu hazırlık
PR'ında uygulanmış değildir. `assets/` değişmedi.
