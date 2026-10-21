# Kalan beş testin düzeltilmesi

21 Ekim 2026. Yeni görev: beş hatayı düzelt, ardından Arapça ölçülü yerleşime devam et; eğitim ve birleştirme yok.

## Kök neden ve düzeltme

Üç servis testi depo dışındaki ../../services yoluna bakıyordu. Gerçek modüller archive/site-v1/services/design içinde korunuyordu. Testler bu gerçek modüllere bağlandı; modüllerdeki eski w4/assets importları depo kökündeki assets'e taşındı. Yeni servis/stub kurulmadı, sunucu veya model açılmadı. Ajan testi fetch'i taklit eder; gerçek model yeteneği ölçümü değildir.

Tarihsel pilot ve metin testleri sürümsüz normalize eşitliği bekliyordu. Bugünkü normalizasyon yeni alanlar ekliyor; mutfak/banyo malzemelerinde ve M02 kumaş deseninde anlam değiştiriyor; M09 eski yatak family/kind'ını dolaba dönüştürüyor. Bu semantik değişimler sessizce kabul edilmedi.20 açık fixture için eski nesne hash'i, bugünkü beklenen nesne hash'i, her alanın önce/sonra farkı ve training_approved:false kaydedildi. Runtime çıktısında veya orijinalde başka bir değişim testi bozar. Bozuk seed/orijinal mutasyonları reddedilir. Manifest kaynak ağacı tanıtım içindir; bağımsız CSS değişimi testi bozmaz, nesne sonucu değişirse açık uyumluluk incelemesi gerekir.

Pilot:276 tarihsel kayıt ve manifest hash'leri sabit.5 aile×set/delta gerçek tekrarında aritmetik,girdi değişmezliği ve tam sürümlü çıktı denetlenir. Mutfak/banyo uyarlaması eğitim onayı değildir.

Metin:10 eski tasarım ve30 metnin dayanakları orijinalde kalır. Türler eski donmuş vocabulary ile doğrulanır; eski yatak geometrisi mevcut bedroom modülünde kendi parametreleriyle denetlenir. M02/M09 güncel üretime uyumlu sayılmaz. Yeni kanepe/masa alanları açık fark olarak saklanır. Malzeme kartı,kaynak,iddia/etkinleşme dayanağı,sözcük aralığı ve link kontrolleri korunur. Eski tasarım/metin/kanıt dosyası değiştirilmedi.

## Hedefli doğrulama

assistant-contract-check: PASS26stil/6kategori/52onaysız aday/yalnız onaylı export.
codesign-check: PASS336geometri birleşimi ve cevap şeması.
studio-agent-check: PASSmocktoolsonuçları,komutsırası,tursınırı,yasaktoolreddi.
qwen-studio-data-check: PASS276tarihsel kaydın bütünlüğü,10tekrar,katı uyumluluk ve mutasyonreddi.
text-eval/verify-stage1: PASS67kart/10tasarım/30metin/68–84kelime; anlam/üslup onayı bekliyor.

İlk metin kontrolünde eski vocabulary kinds alanı dizi varsayıldı; gerçek nesne allowlist'i kullanılarak düzeltildi. Test zayıflatılmadı. Eğitim başlamadı; model/GPU/ücretli API/deploy yok. PR birleştirilmedi. Tam koşu: `node tests/hepsi.mjs` **63/63 PASS**, çıkış0. Ham kayıt `test-duzeltme-sonuc.json`. Assets/api/kökHTML/.htaccess/eski score.mjs değişmedi. Katalog son rapor eklendikten sonra ayrıca yenilenip denetlenir.
