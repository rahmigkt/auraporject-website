# Atölye eylemleri — onaysız ilk veri paketi

19 Ekim 2026 · ATOLYE-CODEX-02 / iş4. Kaynak anı manifestte sabittir.
Veri: `outputs/qwen-local/atolye-v1/`; doğrulayıcı: `tests/qwen-atolye-data.mjs`.

7 işlem: add/remove/duplicate/transform/edge/sweep/cut. Her işlemde 15 TR +15 EN,
toplam **210 olumlu örnek**; ayrıca **28 ret** ve insan incelemesi için **40 aday**.
Her dilde bağımsız tam 30 değil; iş emrindeki işlem başına en az30 iki dil toplamıdır.
Örnekler şablon üretimidir; doğal dil çeşitliliği sınırlı, etiketler unreviewed.
Önceki 40 örneğe verilmiş insan onayı bu yeni pakete uygulanmadı.

Girdi seçili parça kimliğini ve tüm tasarımı içerir. Panel ve çubuk test fixture'ları
5 ailede aynı kurallarla eklenir; bunlar estetik/taşıyıcı mobilya önerisi değildir.
Pozitiflerde insan dilinde komut, negatiflerde bozuk ölçü/hedef içeren açık protokol
testleri bulunur. Çok çeşitli serbest kullanıcı dili veya kapalı sınav iddiası yoktur.
Grup/split taslakları aynı bağlamdaki dil ve eylemleri bir arada tutar; resmî sınav değildir.

## Çıktı sözleşmesi ve gerçek kontrol

Öneri biçimi `{"actions":[{"tool":"..."}],"reply":"..."}`; actions içi kayıtlar
gerçek normalizeOverrides biçimidir. **Bu canlı ai.js eylem sözlüğüne henüz eklenmedi.**
Set/delta türlerini tool tabanlı atölye kaydıyla sessizce karıştırmayın. Canlı istem,
vocabulary, sanitizer ve yürütücü birlikte sürümlenmeden eğitim/canlı bağlantı açılmamalı.
array/material kaynakta artık bulunuyor; align henüz ayrı normalizer eylemi değil.
Bu ek eylemler için henüz örnek/uyumluluk kanıtı üretildiği iddia edilmiyor.

Normalizer değerleri kırpar ve varsayılan doldurur; bu davranış tek başına doğrulama
değildir. Betik bilinmeyen parça/kimlik, yinelenen kimlik, desteklenmeyen tool ve
normalizer'ın değiştireceği ölçüyü **reddeder**; hatayı sessizce onarmaz.

Gerçek compileDesign yolu, önce/sonra parça sayısı, ek panelin ölçüsü, transform
konum/mesh kutusu ve sweep mesh'inin gerçekten eğilmesi denetlenir. Cut için önce
gerçek yerel Manifold WASM yüklenir; CSG hazır değilken kesilmemiş fallback mesh
başarılı sayılmaz. Gerçek mesh hacminin azaldığı ayrıca doğrulanır. İlk deneme bunu
kaçırabildiği için bu kontrol özellikle eklendi.

Bu Node testi tarayıcı tıklama, üretilebilirlik veya bağlantı mukavemeti sertifikası
değildir. Cut'ın her cep/yarık/kanal/fluting varyantı bu turda kapsanmaz; cut örnekleri
merkezden geçişli delik ile sınırlıdır. Transform bu turda X taşıma örnekleridir;
döndürme/ölçekleme ve ayna için ayrı varyantlar sonraki veri genişlemesidir.

## Bulunan yürütme sınırı

Override uygulaması genel zaman sıralı işlem günlüğü değildir: remove listesi, add
işlemlerinden önce değerlendirilir. Var olan add kaydının sonuna remove eklemek
eklenen parçayı silmeyebilir. Bu yüzden olumlu remove örnekleri gerçek temel parça
kimliklerini hedefler; ek parçayı silme için UI'nin add kaydını kaldırma davranışı
veya ayrı transaction semantiği gerekir. Bu teslim motoru düzeltmez; Claude'un
eylem yürütücüsünde “override ekle” ile “mevcut override'ı değiştir/kaldır” ayrımını
kurması gerekir. Bu sorunu gizleyerek model etiketi oluşturulmadı.

## Tekrarlama ve bayatlık

```sh
node tests/qwen-atolye-data.mjs --generate
node tests/qwen-atolye-data.mjs --check
```

Manifest origin/main assets ağacını ve veri dosyalarını hash'ler. Check çalışma
kopyası main varlıklarıyla farklıysa veya parmak izi/veri hash'i değişmişse durur.
Test, kaynak değişimini sahte bir ağaç kaydıyla olumsuz olarak da sınar; assets'e dokunmaz.
Çalıştırmadan önce main fetch edilmeli; bu betik kendiliğinden main'i birleştirmez.
Güncellenmiş stüdyo için yeniden üretim ve yeni insan incelemesi gerekir. Eski paket
kapalı sınav gibi ezilmemeli; sonraki tur ayrı sürüm/dizin kullanmalı.

Eğitim/model/API/GPU çalıştırılmadı. 238 örneğin derleme kontrolleri geçti;
40'lık paketin insan onayı henüz yok. Eğitim ihracı reviewed olana kadar açılmamalı.
