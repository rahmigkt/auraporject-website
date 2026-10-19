# Qwen yerel mimarisi — ilk teslim

Karar sahibi yönü, 2026-10-19: sürekli kiralık sunucu ve dış API yerine tek bir
Qwen3.5-9B; açık kaynak yöntemlerle, uzun süre tasarımcı verisi beklemeden hazırlık.
Bu belge SUNUCU-01'in kiralık sunucu önerisinin yerine geçer. TASARIM-01 ve
ARAŞTIRMA-01'in eski geniş kapsamlı iş emirleri başlatılmadı. Bu dal dar bir pilot.

## Çalışma mimarisi

Yerel Qwen → şemalı tasarım/işlem önerisi → mevcut AURA çizim motoru → geometri ve
fizik denetimi → gerekiyorsa sınırlı düzeltme → kullanıcıya önizleme ve onay.
Geçersiz çıktılar uygulanmaz. Serbest Python veya kabuk komutu çalıştırılmaz.
Çalışma anında bir dil modeli bulunur; çizim ve sayısal denetim ayrı yazılım
modülleridir. Qwen görüntü üretmez: eskizi yorumlar, motor geometrisini önerir;
görüntüyü render motoru üretir. Model ağırlıkları, müşteri verisi ve anahtarlar
depoya girmez. Kişisel bilgisayar kapalıyken bu mimari sitedeki herkese AI sunmaz.

## İlk çalışan parça

`tools/qwen-local/build.mjs`, mevcut AURA örnekleyicisini kullanır. Beş aile × üç
tarz × üç tohum: 45 sentetik ön denetim kaydı. Her tasarım ham aralık/enum kontrolü,
sonlu ağ ve indeks kontrolü, aile doğrulayıcısı ve `physics.analyse` üzerinden geçer.
Motorun hata/uyarıları saklanır; kusurlu tasarımlar başarılı diye etiketlenmez.
Çöken/bozuk örnekler `rejected.json` içine alınır. Eğitim hedefi yalnız motor
denetimini taklit etmektir; bu veri henüz estetik, çizim komutu veya görsel eğitimi değildir.

Her ailede ilk tarz train, ikinci dev, üçüncü test; aynı aile/tür/tarzın bütün
tohumları aynı bölümde kalır. Bu, aynı tasarımın varyasyonlarını bölümler arasında
dağıtmayı önler; yeni topolojiye genelleme ölçtüğü iddia edilmez. İleride ayrı
işlem ağaçları ve açık kaynak üretici aileleri dışarıda tutularak daha güçlü sınav kurulur.
SFT çıktısına yalnız train girer. Bütün etiketler `unreviewed`; insan onaylı altın
cevap veya resmî sınav puanı değildir. Eski SINAV dosyaları ve score.mjs değişmez.

Manifest, motor kaynakları ve veri dosyalarının SHA-256 değerlerini taşır.
Aynı çıktılar yeniden üretilebilir; değişen dondurulmuş dosyaların üzerine yazılmaz.
Yeni motor/veri sürümü yeni çıktı klasörü gerektirir. Puanlama bütün veri
dosyalarının hash'ini doğrular. Eksik cevaplar başarısız sayılır, tekrarlı/yabancı
kimlikler reddedilir; yanlış güvenli sonucu `falsePass` olarak ayrıca raporlanır.

```sh
node tools/qwen-local/build.mjs
node tests/qwen-local-check.mjs
# Model klasörü önceden yerelde bulunmalı; betik internetten indirmez.
python tools/qwen-local/infer.py --model-dir /local/Qwen3.5-9B --prompts outputs/qwen-local/pilot-v1/dev-prompts.jsonl --output /local/qwen-base-dev.jsonl
node tools/qwen-local/evaluate.mjs outputs/qwen-local/pilot-v1 /local/qwen-base-dev.jsonl dev
```

`infer.py` isteğe bağlı başlangıç betiğidir. torch/transformers ve model ağırlıkları
bu teslimde kurulmadı; gerçek model çıkarımı ve donanım uyumluluğu doğrulanmadı.
İlk karşılaştırmalar yalnız dev ile yapılır. Test sonuçları görülerek istem ayarlanmaz.
Denetim hedefleri veri dosyalarında görünür: bu hash ile dondurma, bağımsız kör
sınav yerine geçmez. Model karşılaştırmasından önce insan denetimli sınav gerekir.

## Kaynak seçimi

| Kaynak | Kullanım kararı | Lisans / sınır |
|---|---|---|
| [Qwen3.5-9B](https://huggingface.co/Qwen/Qwen3.5-9B) | Tek metin/görüntü modelinin başlangıcı | Apache-2.0; henüz indirilmedi |
| [CadQuery](https://github.com/CadQuery/cadquery) | Sonraki pilotta parametrik CAD yürütme adayı | Apache-2.0; henüz bağımlılık değil |
| [CadQuarry](https://github.com/jacobjennings/CadQuarry) | Küçük, yeniden yürütülen dış veri denemesi adayı | Üretici Apache-2.0, korpus CC0; henüz içe alınmadı; geometrik katılık fizik güvenliği değildir |
| [Infinigen](https://github.com/princeton-vl/infinigen) | Daha sonra görüntü/parametre çiftleri | BSD-3-Clause ana kod; ek bileşenlerin bildirimleri ayrıca incelenir |
| [CAD-Recode](https://github.com/filaPro/cad-recode/blob/main/LICENSE.md) | Yöntem incelemesi | CC-BY-NC-4.0; kod/veri/ağırlık aktarımı yok |
| [Text2CAD](https://github.com/SadilKhan/Text2CAD/blob/main/LICENSE) | Yöntem incelemesi | CC-BY-NC-SA-4.0; aktarım yok |

Kontrol tarihi: 2026-10-19. Bir depoya erişilebilmesi, bütün bağlı veri ve
ağırlıkların kullanım izni olduğu anlamına gelmez. Gerçek içe alma öncesi sürüm,
dosya hash'i, kod/veri/ağırlık lisansları ve kaynak kaydı birlikte sabitlenir.
Başka CAD modelinin ağırlıkları Qwen3.5'e doğrudan birleştirilmez.

## Sonraki aşamalar ve geçiş ölçütleri

1. **Başlangıç ölçümü:** yerel model uyumluluğu, RAM/VRAM, gecikme, geçersiz JSON,
   motorla uyuşma ve yanlış güvenli sonuç. Henüz model puanı veya maliyet tahmini yok.
2. **Geometri veri pilotu:** CadQuery/CadQuarry örneklerini gerçekten yeniden
   çalıştır; birim, koordinat, işlem ağacı ve AURA sözlüğü eşlemesini doğrula.
   Tasarım üretme, düzenleme ve hata→düzeltme çiftleri ekle. Güvenilmeyen dış kod
   ana süreçte çalıştırılmaz; kaynak inceleme ve izole yürütme gerekir.
3. **Görsel ve estetik:** aynı geometri için çoklu görünüm; karşılaştırılan
   seçeneklerde sabit kamera/ışık/malzeme. İki seçenek de fizik denetiminden geçer.
   Oran/simetri/ritim ölçütleri yardımcıdır, estetik altın cevap değildir. Küçük
   kör kurucu seçimiyle kalibrasyon yapılır; uzun tasarımcı veri birikimi beklenmez.
4. **Küçük çok görevli LoRA:** komut, geometri, görsel yorum, düzeltme ve onaylı kısa
   metinleri dengeli karıştır; mevcut becerileri koruma sınavı uygula. Önce küçük
   deneme; gerçek kazanım yoksa veri büyütülmez. Eğitim betiği/donanımı bu PR'da yok.
5. **Yerel bağlama:** seçilen model + adaptör, izinli işlemler, sınırlı düzeltme,
   kullanıcı onayı. Birleştirme ve yayına alma ayrı denetimden sonra.

Mevcut fizik hesapları yaklaşık ön denetimdir; bağlantı dayanımı, bütün yük
durumları veya standartlara uygunluk sertifikası sağlamaz. Uyarılar görünür kalır.
Pilotun hedefi bu sınırı gizlemek değil, modelin mevcut denetimleri doğru
yorumladığını ölçebilmektir. Sunucu, ücretli API ve eğitim koşusu başlatılmadı.
