# EV-QWEN-00 — yerel plan veri hattı

Bu araçlar araştırma prototipidir. Yalnız özgün, sentetik plan üretir; müşteri fotoğrafı,
plan veri seti, API anahtarı veya ücretli servis kullanmaz. `assets/` değiştirmez.
`tools/`, `outputs/` ve `knowledge/` mevcut deploy hariç listesinde bulunur.

## Kurulum ve tekrarlama

Python 3.12 veya uyumlu sürümde, tercihen ayrı bir sanal ortamda:

```powershell
python -m pip install -r tools/ev-plan/requirements.txt
python -m unittest discover -s tools/ev-plan -p test_pipeline.py -v
# Önce main'i fetch edin ve çalışma dalının stüdyo dosyalarını main ile eşitleyin.
python tools/ev-plan/dataset.py --count 2200 --out outputs/ev-qwen-00
python tools/ev-plan/evaluate.py --dataset outputs/ev-qwen-00 --mode oracle --output outputs/ev-qwen-00/oracle.json
# Yalnız mevcut yerel Ollama. Bu komut model indirmez, ücretli servise bağlanmaz.
python tools/ev-plan/evaluate.py --dataset outputs/ev-qwen-00 --mode ollama --model qwen3.5:9b --limit 4 --output outputs/ev-qwen-00/qwen-baseline.json
python tools/ev-plan/validate.py outputs/ev-qwen-00/examples/detached_3.json
```

Buradaki çalışmada bağımlılıklar depo dışında `C:/Users/User/Documents/Codex/ev-plan-deps`
klasörüne kuruldu ve bu yol `PYTHONPATH` ile kullanıldı. Bu makineye özel yol araç
koduna gömülü değildir. `jsonschema` kanonik Draft 2020-12 kontrolü, Shapely geometri
kontrolü içindir. Toplu koşuda aynı şemanın yalnız kullanılan ortak draft-07 altkümesi
`fastjsonschema` ile derlenir; `$defs` yerel referansları `definitions` olarak çevrilir.
Kanonik şema değişmez. Şema hata verirse ayrıntı için kanonik doğrulayıcı çalışır;
örnekler ayrıca kanonik doğrulayıcıyla diferansiyel test edilir. Yeni şema anahtarları
bu altkümenin dışına çıkarsa derlenen yol tekrar değerlendirilmelidir.

## Mimari ve sınırlar

- `common.py`: eğitim/test/prova için aynı istem ve JSON araç sözleşmesi.
- `generator.py`: bağımsız sentetik geometri. 10 aile; 1+1..5+1, tek oda, dubleks,
  iki/üç kat müstakil, açık mutfak, holsüz açık dağılım, kırık/L sınır, balkon,
  üst kat terası ve kolon örnekleri. Boyut, yatak odası sayısı ve tohum değişir.
  Bu, serbest mimari tasarım veya kısıt çözücü değildir; şablon çeşitliliği sınırlıdır.
- `validate.py`: şema, duvar uç/düğüm ilişkisi, gerçek kesişim, oda kapanması,
  çakışma, açıklık sınırı, kapı/merdiven erişimi, yatak odası mahremiyeti,
  araştırma alan/en eşikleri, mutfak üçgeni, merdiven ve parsel kontrolleri.
- `dataset.py`: geçmeyen örnekte koşu başarısız olur; kusurlu kayıt eğitim kümesine
  sessizce girmez. İstekler dört dil/ayrıntı varyantı; eksik bilgi ve reddetme ayrı.
  Düzeltmeler: önceki plan + istek + araç hedefi + sonraki plan; salon genişletme,
  banyo/çalışma kullanımı değiştirme ve ikinci kat ekleme. Büyük değişiklikler tüm
  planın yeniden önerilmesidir; yerel bir odanın izinsiz değişmediği garantisi yoktur.
- `evaluate.py`: aynı araç yürütücüsünü geri oynatır. Model duvar koordinatlarının
  binlerce tokenlık listesini ezberlemek yerine `plan.create` çağırır; doğrulanan tam
  plan `plans.jsonl` içinde saklanır. Bu tercih, asistanın stüdyoyu araç olarak
  kullanması yönündeki kararla uyumludur. Tam planı bağımsız çizen model eğitilmedi.
- `compat.py`: v0.1 göçü ve **kat başına**, kayıplı görüntüleyici çıktısı. Göç eksik
  giriş, kat yüksekliği ve menteşe bilgisini uydurmaz; tasarımcı incelemesi gerekir.

Şema v0.2 bir öneridir; v0.1 dosyasının sürüm etiketini değiştirmek yeterli değildir.
v0.1 zaten çokgen odalar içeriyordu. v0.2 düğüm ağı, eksen/net sınır ayrımı,
kat yüksekliği, U merdiven/döşeme boşluğu, kapı menteşesi, kolon, mutfak noktaları,
balkon/teras türleri ve müstakil parsel/bahçe kaydını açıklar. U merdiven dışındaki
merdiven biçimleri henüz uygulanmadı. v0.1'deki `spaces >= 2` koşulu nedeniyle
tek oda görüntüleyici payloadı eski şemadan geçmez; mevcut renderer alanları okuyabilir.

Mevcut `ev.html`, sabit `assets/ev/ornek-plan.json` dosyasını fetch ediyor; dosya
seçici, kat seçici ve merdiven renderı henüz yok. `viewer/` çıktıları Claude'un
bağlaması içindir. Bunları üretmiş olmak, siteye yüklenmiş veya çok katlı evin doğru
render edildiği anlamına gelmez. Tarayıcı smoke testi, kaynak JSON isteğini geçici
olarak fixture ile karşılayarak yapılabilir; production dosyası değiştirilmez.

## Veri ayrımı ve ölçüm

Tam çıktı Git'e eklenmez; üretme komutu, manifest, küçük sohbet dilimi ve ev tipi
örnekleri teslim edilir. Ham plan `plans.jsonl`; sohbetler `train/validation/test.jsonl`;
önce/sonra kayıtları `edits.jsonl`; insan incelemesi `review.json` içindedir.

- Eğitim: single_room, corridor, open_kitchen, corner_living, duplex, detached_2,
  detached_3. Doğrulama: gallery. Kapalı test: courtyard ve notch.
- Aynı planın Türkçe/İngilizce/ayrıntı ve düzeltme örnekleri aynı ayrımda kalır.
  Test geometri aileleri eğitimde yoktur; test aile adları araç şemasında bulunur.
  Bu nedenle test, bilinmeyen bir geometrik algoritma icat etme ölçümü değildir.
- Sözleşme, üretici, doğrulayıcı, şema, kurallar ve main'deki viewer kaynağı hash'lenir.
  Kaynak koşu sırasında değişirse manifest yazılmaz. Sonradan değişirse ölçüm
  `STALE_DATASET` ile durur. `origin/main` fetch edilmemişse uzak son değişiklikler
  bilinemez; fetch sorumluluğu açıkça kullanıcı/CI adımındadır.
- Model ölçümü: tam JSON nesnesi, doğrulayıcıdan geçme, istenen yatak odası/ev türü,
  kat sayısı, referans net alanıyla tutarlılık ve kural ihlalleri. Alan ölçütü henüz
  keyfî m² isteğine koşullanan tasarım yeteneği değildir; tohumlu referansa tutarlılıktır.
- Yerel pilot aynı kapalı testten iki plan, bir netleştirme ve bir reddetme örneği
  seçer. 768 çıktı tokenı/istek ve 180 saniye zaman sınırı, `num_gpu=0`, sıcaklık 0.
  Bu küçük pilot bütün kapalı testin veya doğal dil yeterliliğinin sonucu değildir.
  Netleştirme/reddetme metninin semantik puanı yalnız anahtar sözcük ön kontrolüdür;
  insan incelemesinin yerine geçmez.
- Oracle geri oynatma **model değildir**. Üreticideki %100, Qwen'in %100 başarısı diye
  raporlanmaz. Büyük genel model mevcut ücretsiz yerel erişim yoksa `not_run` kalır;
  7B başka bir modeli “büyük genel model” diye adlandırmayın.

## İnsan onayı ve eğitim kapısı

`review.json` içindeki 40 örnek yeni görev içindir ve **onaysızdır**; önceki kullanıcı
onayı yeni örneklere aktarılmaz. Makine geçerliliği estetik/yaşanabilirlik onayı değildir.
Eğitim veri hattı provası gerçek ağırlık güncellemesi değildir. GPU yokken 9B CPU
fine-tuning başlatılmaz; önce sözleşme, kapalı ölçüm, doğal dil ve insan incelemesi.
QWEN-YEREL-02 eşikleri ve kusur listesi kapanmadan kiralık GPU kapısı kapalıdır.

## Lisans ve kaynaklar

Yeni üretici/araç kodu bu depo için özgün yazıldı. Haricî plan verisi kullanılmadı.
Bağımlılıklar: [jsonschema MIT](https://github.com/python-jsonschema/jsonschema/blob/main/COPYING),
[fastjsonschema BSD-3-Clause](https://github.com/horejsek/python-fastjsonschema/blob/master/LICENSE),
[Shapely BSD-3-Clause](https://github.com/shapely/shapely/blob/main/LICENSE.txt);
Shapely'nin GEOS bağımlılığı LGPL-2.1 koşullarına tabidir ve tarayıcıya gömülmez.
Kesin kurulu paket bildirimleri dağıtımda korunmalıdır. Plan kurallarının kaynak ve
öneri durumları `plan-kurallari.v2.json` içindedir; güncel yapı uygunluğu belgesi değildir.

SFT dönüştürme (yalnız messages alanını dışa aktarır, eğitim başlatmaz):

    node tools/ev-plan/convert.mjs outputs/ev-qwen-00 outputs/ev-qwen-00/sft

Dönüştürücü kaynak ve JSONL hashlerini doğrular; kendi hashini de ihracat manifestine yazar.

Viewer smoke testi: Playwright kurulu bir Node ortamında ve kurulu Chrome ile

    node tools/ev-plan/viewer-smoke.cjs outputs/ev-qwen-00/viewer

Bu test localhost sunucusunu yalnız test süresince açar; kalıcı dosya yükleme ve çok kat entegrasyonu değildir.

SFT dönüştürücü proje kimliği/tohumu yok sayan geometri imzasıyla tekrarları çıkarır; aynı planın bütün dil ve düzenleme türevleri birlikte çıkarılır. Ham araştırma kayıtları denetim için korunur.

İki bilinen dildeki sentetik hazır yanıtlar SFT dönüşümünde istem diliyle eşleştirilir; araç argümanları değişmez. Bu, müşteri notlarını çeviren bir servis değildir.
