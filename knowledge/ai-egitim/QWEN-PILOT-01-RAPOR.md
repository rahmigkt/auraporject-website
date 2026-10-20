# Qwen stüdyo pilotu — 19 Ekim 2026

İlk gerçek GPU eğitimi tamamlandı. Bu deney yalnız sayısal stüdyo komutlarının
eylem JSON'una dönüşmesini ölçer; estetik, genel CAD veya fizik güvenliği eğitimi değildir.
Canlı siteye müdahale edilmedi. Sonraki büyük eğitim otomatik başlatılmayacak.

## Veri ve eğitim

- Kaynak: `95b1ec05a748737eaa9f340f475454ce9a2abdd9` anındaki stüdyo.
  Gerçek `applyActions` kaynak kodu Node VM içinde, DOM etkileri taklit edilerek
  çalıştırıldı; tarayıcı etkileşim testi değildir. Normalizasyon ve mesh üretimi denetlendi.
- Beş ailede 196 eğitim, 40 geliştirme, 40 kapalı test örneği.
  Test modeli çalıştırılmadı. Etiketler deterministik üretilmiş, insan onaysızdır.
  Komut çeşitliliği sınırlıdır; iç parametre adları kullanılır.
- Qwen/Qwen3.5-9B, revision `c202236235762e1c871ad0ccb60c8ee5ba337b9a`.
  A40 üzerinde BF16 LoRA: rank/alpha 16, 43.278.336 eğitilebilir parametre,
  batch 1 × accumulation 8, iki tur / 50 adım; yalnız yanıt tokenlarında loss.
  Görsel katmanlar donduruldu.
- Hesaplama: **227,4 saniye**; tepe ayrılan bellek yaklaşık **19,09 GiB**.
  Token uzunlukları 511–776. Adaptör 173.188.512 bayt.
- İlk kurulumda uyumsuz isteğe bağlı torchao kaldırıldı. İlk derleme denemesi
  sıfır eğitim adımında durduruldu; derleme kapatılarak eğitim tamamlandı.
  Paket sürümleri, çalıştırılan betikler ve ham kayıtlar yerel sonuç arşivinde saklandı.

## Sonuçları nasıl okumalı

Tüm ölçümler aynı 40 geliştirme örneğindedir. Son iki kontrol sonuçlar görüldükten
sonra hazırlanmıştır; bağımsız sınav değildir. Ölçüt beklenen JSON ile tam eşitliktir.

| İstem | Temel model | Adaptör |
|---|---:|---:|
| İlk pilot, alan adlarını açıkça belirtmeyen istem | 0/40 | 40/40 |
| Açık şema ve sayısal örnek içeren kontrol | 27/40 | 39/40 |
| Sayısal örneksiz, türleri açıklayan kontrol | 0/40 | 0/40 |

Son kontrolde her iki model de `{"actions":[...]}` yerine doğrudan `[...]`
döndürdü. Doğru sayısal işlemler bulunması dış JSON sözleşmesini sağlamaz;
puanlar bu nedenle sıfırdır. Sayısal örnekli kontrolde adaptör bir istekte örnekteki
`delta width 100` eylemini kopyaladı. Bu hatalar saklandı, puanlardan çıkarılmadı.

İlk 0→40 sonucu genel tasarım kazanımı olarak sunulamaz: ilk istem eksik şemalıdır.
Üstelik mevcut `api/forma-ai.php` üretim istemi alan biçimlerini zaten açıklar;
bu deney canlı stüdyoda aynı kusurun bulunduğunu göstermez.
Şemaya duyarlılık nedeniyle adaptör henüz üretime hazır kabul edilmemelidir.

## Saklama, maliyet ve sonraki kapı

Adaptör, tokenizer ve ham ölçümler `work/qwen-gpu-session/results/` altında yerelde
doğrulandı. Arşiv SHA-256 ve tüm ölçümler `outputs/qwen-local/run-01/summary.json`
içindedir. Ağırlıklar Git'e eklenmedi. Bu bir LoRA adaptörüdür; eşleşen temel model
gerektirir, tek başına GGUF değildir. Yerel Qwen'e henüz bağlanmadı.

Pod `2pao8yifsvbrim` ve 60 GB disk `so66zdujd8`, indirme ve hash doğrulamasından
sonra silindi; iki kaynak için de API 404 ile yokluk doğrulandı (16:11 UTC).
Pod 15:22:56 UTC'de açıldı; toplam oturum yaklaşık 48 dakika sürdü.
Saatlik 0,59 dolar GPU ve aylık 8,40 dolar diskin saatlik payıyla tahmini toplam
yaklaşık **0,49 dolar**; kesinleşmiş fatura değildir. 4 saat / 3 dolar sınırı aşılmadı.

Sonraki denemeden önce gerçek üretim sözleşmesi tek kaynak haline getirilmeli;
Türkçe doğal komutlar, belirsizlik, çok adımlı düzenleme, reddetme ve şema sağlamlığı
denetlenmelidir. Geometri koruma ve diğer becerilerde gerileme ayrıca ölçülmelidir.
Estetik için insan denetimli örnekler gerekir. Bu kapılar geçilmeden büyük eğitim,
canlı bağlantı veya modelin tasarım kararlarını otomatik uygulaması açılmayacak.
