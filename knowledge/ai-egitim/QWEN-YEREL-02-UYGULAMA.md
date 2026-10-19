# QWEN-YEREL-02 — ilk hazırlık teslimi

19 Ekim 2026. İş emri main'den alındı (`2fda700`). PR #69 güncellendi; canlıya
bağlantı veya yeni sunucu yok. Eğitim başlamadı.

## Gerçekleştirilenler

- `current_studio.mjs` her çalıştırmada main'i fetch eder; çalışma kopyasının
  `assets/` ve `api/` içeriği main ile aynı değilse durur. Kaynakları sessizce
  değiştirmez; önce güncel main'in birleştirilmesini ister.
- Bütün izlenen assets/api ağacının Git parmak izi kayda girer. Değişen kaynaklara
  bağlı önceki yeni-format turlar `STALE.json` ile işaretlenir. İlk pilotun
  kaynak kilidi de kontrol edilir; eski veriye bayat işareti eklenir.
- Hazırlık istemi, doğrudan canlı `api/forma-ai.php` komut dalının PHP atamalarından
  elde edilir. Canlı uç çalıştırılmaz, konfigürasyon/anahtar okunmaz, dış istek yoktur.
  Değişen kod sınırında durur. Ayrı istem çevirisi veya elle kopyası yoktur.
- Gerçek `vocabulary`/`sanitizeActions` kullanılır. Çıktı nesne + `actions` + dolu
  `reply` gerektirir. Dizi, bilinmeyen/ek alanlar, sayısal metinler reddedilir;
  JSON anahtar sırası önemsizdir. Bu denetim hedeflere uygulanır; model puanı değildir.
- 1.470 aday: sözlükteki sayısal parametre, enum, malzeme, tarz ve türlerden
  otomatik çoğalır. Doğal TR/EN çekirdek, netleştirme, ret ve çoklu işlem bulunur.
  Teknik ad içeren örnekler ayrıca `natural:false` işaretlidir; doğal dil sayılmaz.
- Train/dev/test grup ayrımı adaylarda vardır; bunlar henüz kapalı sınav değildir.
  40 train adayı seçildi; yerel tarayıcıda gerçek `setDesign` ve `applyActions`
  çalıştırıldı. HTTP yanıtına bellekte test kancası eklenir; assets dosyaları değişmez.
  **40/40 tekrar geçti**. Son ölçüler, parça sayısı ve fizik uyarıları kayıtta.
  Hiçbir model çalıştırılmadı; bütün havuzun tekrarı yapılmadı.
- Büyük eğitim kapısı eksik ölçüm/kanıtta kapalıdır, donanım oluşturmaz. Eşik
  sayıları ve booleler tek başına kanıt değildir; bağlantılı kayıtlar ve karar
  sahibinin gerçek onayı insan tarafından doğrulanmalıdır.

## İnceleme

`outputs/qwen-local/yerel-02/run-239e562f7354/okuma.html` içinde 40 aday,
önerilen yanıt ve gerçek tarayıcı sonucu var. Hiçbiri reviewed yapılmadı.
Onay/düzeltme örnek kimliğiyle alınacak. 17 MB aday havuzu Git'e eklenmez;
aynı kaynaklardan yeniden üretilir, manifest hash'i ve 40'lık kanıt paketi saklanır.

## Eğitim engeli ve kalanlar

Yerel donanım sorgusunda yalnız Intel Iris Xe göründü; NVIDIA/CUDA aracı yok.
Karar sahibi ayrıca doğruladı: **GPU yok, 36 GB RAM var.** İş emrindeki yaklaşık
24 GB CUDA GPU varsayımı geçersizdir. 9B LoRA'yı CPU'da birkaç saatlik tur diye
başlatmadım. Sıkıştırılmış bir modeli RAM'de kullanabilmek, aynı modelin eğitim
donanımının hazır olduğu anlamına gelmez. Kiralık GPU yasağı korunuyor.
Buradaki kapsam veri, tarayıcı tekrarı ve insan inceleme hazırlığıdır; eğitim
koşulları yeniden kararlaştırılmadan model turu veya güvenilir süre tahmini yoktur.

İnsan onaylı, sürümü dondurulmuş aynı kapalı sınav; biçim varyasyonları; TR/EN ve
ret/netleştirme başarıları; eski adaptör dahil gerileme ölçümü; bütün adayların
tarayıcı tekrarı; gözden geçirilmiş eğitim ihracı ve yerel çalıştırıcı henüz tamamlanmadı.
Yeni model başarısı iddiası yoktur. `QWEN-KUSURLAR.md` açık maddeleri izler.
Canlı `interpret` reply'sı kullanıcıya iletilmediğinden netleştirme akışı için ayrıca
kapsamı açık assets PR'ı gerekir. Yeni eylem türleri otomatik icat edilmez; sözlük
ve örnek yazarı genişletilmelidir. Estetik örnekler insan onayı olmadan eklenmez.

## Tekrarlama

```powershell
node tools/qwen-local/current_studio.mjs
# Playwright ve yerel tarayıcı önceden kurulu olmalı; yeni bağımlılık indirilmez.
$env:PLAYWRIGHT_MODULE='.../node_modules/playwright'
$env:BROWSER_EXECUTABLE='.../msedge.exe'
node tools/qwen-local/browser_review.mjs outputs/qwen-local/yerel-02/run-239e562f7354
node tests/qwen-current-contract-check.mjs
python tests/qwen-large-gate-check.py
```

Son komutlar eğitim başlatmaz. Uzun model işi için sık sorgulama yerine tek süreç,
kalıcı sonuç/hata dosyası ve iş bitişinde tek kontrol düzeni kullanılacak.
