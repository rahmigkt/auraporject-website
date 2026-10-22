# H5 küçük model CPU temel ölçümü

Bu ölçüm AURA için eğitim/adaptör çalışması değildir. Küçük model
`Qwen/Qwen3.5-0.8B`, kaynak revizyonu
`2fc06364715b967f1860aea9cf38778875588b17` ile sabittir.
GGUF maintainer kaynağı `ggml-org/Qwen3.5-0.8B-GGUF`, revizyonu
`807dfd9a6fadbf703207aac3bfb0b2b3040d077c`; Q8_0 dosyası SHA256
`37ae482d336108d23516fa35e8e0c4126688d81018b87178a18d752a1357814f`.
Bu küçük kuantize modelin sonucu AURA9B başarısı değildir.

Önceki yerel Ollama etiketinin SHA'sı bu GGUF ile aynı değildi. `base_model`
metadatası ata modeli de belirtebildiği için tek başına Base/Instruct kimliğinin
kanıtı değildir. Yeni ölçümde model kartı zinciri ve dosya SHA'sı kullanılır.
GGUF dönüşümü için bağımsız tensor-tensor eşdeğerliği iddiası yoktur.

## Koşu

Yerel gerçek tokenizer dosyaları, model ağırlığı ve CPU binaryleri gerekir.
`tokenizers==0.22.2`, `Jinja2==3.1.6` kullanılır. Runtime kurulu Ollama0.40.7 ile
gelen llama-server0.7.0-dev/f174553e1 ikilisidir. Yalnız üst düzey CPU DLL'leri
ayrı dizine kopyalanır; CUDA/ROCm/Vulkan backend dizinleri kopyalanmaz.

```powershell
python tools/h5-exam/cpu-baseline.py prepare --pin-dir PATH_TO_PINNED_MODEL --output work/FRESH_BASELINE
python tools/h5-exam/cpu-baseline.py calibrate --output work/FRESH_BASELINE
python tools/h5-exam/cpu-baseline.py run --output work/FRESH_BASELINE
node tools/h5-exam/baseline-score.mjs work/FRESH_BASELINE/predictions.jsonl
```

`prepare`, değişmeyen frozen120görevden yalnız istem üretir. Kaynak/motor
kapıları korunur. Hedef/gold/rubrik model girdisine konulmaz. Şablon thinking
kapalı olarak uygulanır; eğitim öneki, payload/EOS maskesi ile karşılaştırılır.
120 istem 780 veya daha az prefix tokenı içerir; çıkış bütçesi ayrı512tokendır.
Runtime `/tokenize` ID'leriyle HF tokenizer ID'leri her görevde bire bir
karşılaştırılmadan sınav üretimi başlamaz.

6CPUthread, bağlam8192, tek istek slotu, seed42 ve temperature0 sabittir.
`--device none`, `-ngl0`, `--no-op-offload`, `--offline` kullanılır. Yerel
loopback portu geçici açılır, iş sonunda yalnız bu işin çocuk süreci kapatılır.
Bir dosya kilidi ikinci koşuyu engeller. Mevcut model/servis süreçlerine dokunulmaz.

Kalibrasyon iki sentetik soruyla hız ölçer; sınav cevabına bakarak istem veya
ayar seçimi yapılmaz. Ardından aynı120girdi önce ham, sonra ayrı JSON şeması
koşulunda çalışır. Şema yalnız `reply`/`actions` biçimini sınırlar; hedef çözümü
vermez. JSON onarımı, kod çiti temizleme ve tekrar durdurma yoktur. Her istek
için özgün yanıt, runtime cevabı, süre, SHA ve kesilme bilgisi günlükte saklanır.
Transport hatası kayıt olarak korunur; hatayı gizleyen otomatik tekrar yoktur.

## Puan sınırı

`baseline-score.mjs` biçim, motor ve isteğin mekanik karşılanmasını ayrı sayar.
Kesilme, tekrar ve transport başarısı da ayrı raporlanır. Yinelenen JSON
anahtarları ve sessiz sayı taşması reddedilir. Açık doğru `katman` alanı araç
sözlüğüyle doğrulanır; tarihsel gold katman alanını dışarıda tuttuğu için
dispatch metadata'sı puanlama öncesi ayrı tutulur. JSON metni onarılmaz.

Yeni30işlemde frozen gözlem/kısıtlar ve ilgili durum karşılaştırılır. Tarihsel
60işlem mevcut ön puanlayıcıyla değerlendirilir. Önkoşulda bu90referans işlem
cevabının90'ı geçti. Bu, model cevabı veya anadil incelemesi değildir.
Soru/ret dil işaretleri ve stüdyo URL'si yalnız mekanik sinyallerdir; doğal dil,
dürüstlük ve anlamsal doğruluk resmi onay sayılmaz. Eksik çıktı başarı sayılmaz.
Tarihsel sınav veya motor fingerprint kapısı bu araçta gevşetilmez.
