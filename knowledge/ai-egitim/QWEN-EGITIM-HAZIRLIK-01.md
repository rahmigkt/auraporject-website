# Qwen eğitim hazırlığı ve süre hesabı

2026-10-19 karar sahibi açıklaması: **sanal GPU yalnız eğitim içindir.** Eğitim
sonrası model yerelde kullanılacak. Sürekli sunucu ya da uzaktan servis planlanmıyor.
Bu hazırlık yerel işlemciye model yüklemez, GPU kiralamaz ve eğitim başlatmaz.

**Öncelik düzeltmesi:** [QWEN-STUDYO-BAGLANTISI](QWEN-STUDYO-BAGLANTISI.md).
Asıl veri mevcut stüdyonun şema/işlem/derleme akışından gelecek. geometry-v1
yardımcı alıştırmadır; gerçek stüdyo geri oynatma denetimi GPU pilotundan önce gelir.

## Eğitim seçimi

Qwen/Qwen3.5-9B üzerinde BF16 LoRA, rank 16, alpha 16. İlk metin pilotunda görsel
kodlayıcı dondurulur; daha sonraki çok görevli görsel deneme ayrıca ölçülür.
Başlangıç bağlamı 4096, mikro parti 1, biriktirme 8, tek GPU: etkin parti 8.
Paketleme kapalı. Öğrenme oranı 1e-4 yalnız başlangıç adayıdır; dev sonucuna göre
ayarlanır. İlk örnekler gerçek tokenizer ile sayılır; uzun örnekler sessizce kesilmez.

[Unsloth Qwen3.5 kılavuzu](https://unsloth.ai/docs/models/qwen3.5/fine-tune)
9B BF16 LoRA için yaklaşık 22 GB VRAM bildiriyor, Qwen3.5'te 4-bit QLoRA'yı
önermiyor ve Transformers v5 gerektiriyor. Bu yüzden önceki genel QLoRA fikri
yerine BF16 LoRA hazırlığı seçildi. Eğitimden sonra yerel kullanım için
kuantizasyon ayrı işlemdir; eğitim sırasında BF16 seçmek yerelde BF16 zorunluluğu yaratmaz.

Hedef makine: Linux, tek NVIDIA **48 GB VRAM**, 64 GB RAM ve 100 GB disk.
L40S/A6000 sınıfı kapasite adayıdır; bunlar arasında hız eşitliği varsayılmıyor.
Bu bir kapasite planıdır; gerçek bellek gereksinimi bağlam, görüntü ve çekirdeklere
göre ilk denemede doğrulanır. Sağlayıcı seçilmedi ve rezervasyon yapılmadı.
GPU'da ortam test edildikten sonra paket sürümleri, model revision'u ve kernel
seçimi kaydedilir. `train_gpu.py` aday çalıştırıcıdır; gerçek CUDA ortamında henüz
doğrulanmadı. Varsayılan hazırlık modu modeli veya CUDA kütüphanelerini yüklemez.

## Elde olan ile planlanan veri

- Mevcut dosyalarda 45 örnek var; yalnız 15'i train. Bu motor-denetimi pilotudur,
  yeterli tasarım/estetik eğitimi değildir. Train içerikleri toplam 21.833 karakter,
  medyan 1.447, en uzun 1.891 karakter. Bunlar token sayısı değildir.
- İlk dar geometri seti hazır: **1.000 train + 200 dev + 200 test**.
  `geometry-v1` ayrı alıştırma şemasıdır: merkezli, yuvarlatılmış dikdörtgen
  ekstrüzyon ve bir delik. 500/100/100 farklı temel geometri; her birinde boyut
  düzenleme ve kısıt düzeltme örneği. Boyut, köşe yarıçapı, delik açıklığı ve
  alıştırmaya özgü 3 mm minimum yükseklik/duvar koşulu sayısal doğrulanır.
  Bu değer bir malzemenin mühendislik standardı değildir. Ağ oluşturma, AURA
  parçasına dönüştürme, estetik veya fizik dayanımı denetimi iddia edilmez.
  Bu küçük set, öğrenme/onarım hattını ucuzca doğrulamak içindir.
- İkinci hedef: **6.000 eğitim örnekli ilk karma metin koşusu**. Komut, geometrik
  işlem, kısıt açıklama ve hata düzeltme; yeterli denetimli kısa anlatım örneği varsa
  unutmayı azaltacak karışım. Bu karma veri henüz üretilmedi. Çok dilli örnekler ve
  grup dışı dev/test kayıtları bu sayılara eklenir.
- Görsel ve estetik tercih eğitimi ayrı veri/etiket hazırlığıdır; aşağıdaki
  metin hesabı bütün çok görevli modelin tamamlanma süresi değildir.

## Koşullu süre hesabı

`steps = ceil(eğitim örneği / 8) × epoch`. Her iki aşama için ilk varsayım 2 epoch.
Optimizasyon adımı, biriktirilen **8 mikro partinin tamamını** kapsar. 10/20/40
saniye değerleri gerçek GPU ölçümü değildir; maliyetli işe başlamadan hassasiyet
hesabını görünür kılmak için seçilmiş senaryolardır. Daha yavaş/hızlı sonuç mümkündür.

| Aşama | Adım | 10 sn/adım | 20 sn/adım | 40 sn/adım |
|---|---:|---:|---:|---:|
| 1.000 örnek, 2 epoch | 250 | 1,37 saat | 2,24 saat | 3,97 saat |
| 6.000 örnek, 2 epoch | 1.500 | 6,21 saat | 11,42 saat | 21,83 saat |

Tabloya eğitim süresinin %25'i kadar çalışma payı ve sırasıyla 0,5/1 saat
kurulum-değerlendirme-dışa aktarma payı eklenmiştir. Bu paylar da varsayımdır.
İlk model indirmesi, uyumsuz CUDA paketleri veya derleme sorunları bunları aşabilir.
Veri hazırlama, insan denetimi, görsel eğitim ve tekrarlanan denemeler dahil değildir.
**Bu tablo GPU modeli adına göre verilmiş hız garantisi değildir.**

İlk GPU oturumunda önce 10 ısınma, sonra 20 zamanlanan optimizasyon adımı alınır.
Aynı veri uzunluğu ve ayarlarla ölçülen süre, tepe VRAM, dolgu/gerçek token sayısı
kaydedilir. 10–40 saniye senaryosunda bu 30 adım 5–20 dakika sürer; model/ortam
kurulumu ayrıca sürer. İlk derleme ısınmaya karıştırılmaz. Görsel aşamada bu ölçüm
aynı görüntü sayısı ve çözünürlüğüyle yeniden yapılır.

```sh
python tools/qwen-local/estimate.py
# Örnek: gerçek oturumda ortalama tam adım 18 saniye ölçülmüşse:
python tools/qwen-local/estimate.py --measured-step-seconds 18
python tests/qwen-training-plan-check.py
```

`tools/qwen-local/training-plan.json` ayar ve geçiş kontrollerini,
`outputs/qwen-local/training-estimate.json` eski motor pilotunun,
`outputs/qwen-local/geometry-training-estimate.json` yeni geometri setinin
istatistiklerini ve koşullu süre hesabını taşır. Tahmin
betiği yalnız standart Python kullanır, modeli/tokenizer'ı indirmez. Kesin token
sayısı veya ölçülmüş hız varmış gibi sonuç üretmez.

## GPU kiralamadan önce tamamlanacaklar

1. Geometri üreticisi/adaptör pilotu; kaynak/lisans/sürüm kaydı. Açık kaynak veriler
   önce küçük örnek üzerinde gerçekten yeniden oluşturulur, sonra ölçeklenir.
2. Geçerli ve hatalı işlemler ile doğrulanmış düzeltmeler; aynı geometrinin
   varyasyonları tek bölümde; dev/test eğitimden ayrı tutulur. İnsan denetimi
   olmayan etiketler `unreviewed` kalır, altın cevap diye gösterilmez.
3. GPU aday çalıştırıcısı `train_gpu.py`: veri hash kontrolü, yalnız train kimlikleri,
   gerçek token uzunlukları, sessiz kesmeyi reddetme, yerel ağırlık yükleme,
   adaptör kaydı ve adım/bellek günlükleri. Hazırlık modu çalıştırıldı; CUDA/Unsloth
   entegrasyonu henüz doğrulanmadı. Benchmark 30, pilot en çok 250 optimizasyon adımı.
4. Oturumda önce uyumluluk ve 30-adım ölçümü; sonra güncellenmiş süreyle küçük pilot.
   Yerel işlemci üzerinde model/eğitim başlamaz. Taban ve adaptör sonuçları aynı
   dev setinde karşılaştırılır; donmuş test istem ayarlamak için kullanılmaz.

Eğitim sonunda adaptör, temel model revision'u, işlemci/chat şablonu ve günlükler
yerel diske alınır. Adaptör birleştirme ve GGUF çıktısı yerelde kullanılacak
çalıştırıcıya göre doğrulanır; görüntü yeteneği için gerekli görsel bileşenler de
korunur. Kuantize çıktının komut/görsel becerileri tekrar sınanır. Kalıcı GPU
hizmeti bu teslimin parçası değildir.

## Kısa deneme uygulaması

```sh
python tools/qwen-local/geometry_data.py
python tests/qwen-geometry-data-check.py
python tools/qwen-local/train_gpu.py
# Aşağıdakiler yalnız seçilmiş GPU makinesinde, ortam/model kurulduktan sonra:
python tools/qwen-local/train_gpu.py --execute benchmark --experimental-unreviewed --model-dir /work/Qwen3.5-9B --output /work/benchmark-01
python tools/qwen-local/train_gpu.py --execute pilot --experimental-unreviewed --model-dir /work/Qwen3.5-9B --output /work/pilot-01
python tools/qwen-local/geometry_evaluate.py --predictions /work/base-dev.jsonl
```

Model dizini önceden kurulmuş olmalıdır; çalıştırıcı HF çevrimdışı modunu zorlar,
model indirmez, adaptör yayımlamaz, CPU'da eğitim yapmaz. Bir görünür BF16 CUDA GPU
ve en az 40 GiB VRAM kontrolü bulunur. Pilot döngüsü için 4 saatlik yumuşak durma
kontrolü vardır; yalnız tamamlanan adımlarda çalışır, makineyi kapatmaz ve sağlayıcı
faturasına sert sınır getirmez. Sağlayıcının süre/harcama sınırı ayrıca kurulmalıdır.

Büyük karma koşuya otomatik geçiş yok. Dev'de geometrik geçerlilik bozulursa veya
başlangıca göre düzenleme/düzeltme başarısı artmazsa veri/biçim incelenir; en fazla
bir düzeltilmiş pilot, sonra yeniden karar. Bu dar alıştırma başarısı estetik veya
ürün kalitesi kazanımı sayılmaz. Resmî eşikler ve insan denetimli sınav, model
sonuçları görülmeden sabitlenmelidir.
