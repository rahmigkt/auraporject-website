# EV-QWEN-00 — plan üretimi ve yerel veri hattı provası

Tarih: 2026-10-20 · Temel: `main@3332aa1` · Dal: `codex/ev-qwen-00`
İş emri: [CODEX-IS-EMRI-EV-QWEN-00](CODEX-IS-EMRI-EV-QWEN-00.md)

## Sonuç neyi kanıtlıyor?

Bu teslim, Qwen'in araç olarak kullanabileceği **ölçülü sentetik plan üretici,
doğrulayıcı ve eğitim verisi hattını** kurar. Qwen ağırlıkları güncellenmedi;
modelin ev tasarlamayı öğrendiği veya mimari uygunluk sağladığı iddia edilmez.
Üretici başarısı, gerçek model başarısı ve insan onayı ayrı sonuçlardır.

`assets/` değiştirilmedi. EV-QWEN-01'e başlanmadı. Ücretli API, GPU veya sunucu
kiralanmadı; gerçek müşteri verisi ve haricî plan veri seti kullanılmadı.

## A — şema v0.2 ve geriye uyumluluk

[ev-projesi.schema.v0.2.json](../ev-projesi/veri/ev-projesi.schema.v0.2.json):
kat kotu/yüksekliği, ortak köşe düğümü, duvarın düğüm referansları, eksen/net oda
poligonu ayrımı, kapı menteşesi ve açıldığı oda, kolon, mutfak çalışma noktaları,
U merdiven, rıht/sahanlık/döşeme boşluğu, balkon/teras türü ve müstakil arsa,
bina ve bahçe sınırı eklendi. Tek oda kabul edilir. v0.1 zaten çokgen oda taşıyordu;
yeni sürümün bunu ilk kez getirdiği söylenmez.

Bu sürüm, v0.1'in sürüm etiketini değiştirerek okunmaz. `compat.py --migrate`
mevcut duvarlardan eksen poligonunu ve düğümleri yeniden kurar; belirsiz kat yüksekliği,
menteşe, giriş ve ev tipini onaylı bilgi gibi tamamlamaz. Göç sonrası tasarımcı kontrolü
zorunludur. `compat.py --level` kayıplı, kat başına eski viewer biçimi verir; merdiven,
arsa, düğüm ve kolon metadatasını kaldırdığını nota yazar. Bu bir round-trip değildir.
Tek odalı payload mevcut renderer tarafından okunabilir ama v0.1'in en az iki mekân
şartını sağlamaz; ana kayıt her zaman v0.2'dir.

## B — kural profili

[plan-kurallari.v2.json](../ev-projesi/veri/plan-kurallari.v2.json) her kuralı kaynaklı
referans, öneri veya kaynak açığı olarak ayırır. Sayısal profil eşikleri **araştırma
kabul koşuludur**, yürürlükteki yapı mevzuatı sertifikası değildir.

- Alan/en: arşiv yönetmelik referansı ve açıkça işaretlenmiş AURA önerileri.
- Koridor ve kapı: önerilen eşikler; tüm projelerde geçerli yasal minimum diye sunulmaz.
- Islak hacim: yakın/üst üste çözüm önerisi; şaft ve tesisat güzergâhı modellenmediği
  için uyarıdır, geçti sonucu verilmez.
- Yatak odası mahremiyeti: başka yatak odasından geçmek zorunda kalmadan erişim grafı.
- Mutfak üçgeni: NKBA rehberinden kaynaklı, seçilen araştırma profilinde uygulanan
  mesafe kontrolü; gerçek mutfak cihazı/üretim projesi değildir.
- Merdiven: rıht toplamı, kat kot farkı, 2 rıht + 1 basamak, iki kol ve sahanlığın
  alanı, döşeme boşluğu ve beyan edilmiş baş mesafesi.
- Gün ışığı: cam/net alan oranı önerisi. Bu oran, gün ışığı simülasyonu veya yasal
  doğal aydınlatma onayı değildir.

[Bakanlığın arşiv metni](https://webdosya.csb.gov.tr/db/tabiat/icerikler/planli-20210811131259.pdf)
güncel konsolide metin sayılmadı. [2026-07-01 değişikliği](https://meslekihizmetler.csb.gov.tr/haberler/planli-alanlar-imar-yonetmeliginde-degisiklik-yapildi-305960)
bulundu; kapsam ve yürürlük uzman doğrulaması gerektirir.
[NKBA](https://media.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf)
Türkiye yapı mevzuatının yerine geçmez.

## C — üretici, doğrulayıcı ve düzeltmeler

Araçlar: [tools/ev-plan README](../../tools/ev-plan/README.md).
Özgün prosedürel geometri; dış plan veri seti, NC lisanslı veri veya hazır müşteri
projesi yok. 10 aile: tek oda, koridorlu daire, açık mutfak, köşe salon, dubleks,
iki/üç kat müstakil, holsüz açık dağılım, avlulu/L sınır ve kırık oda/balkon.
Dairelerde 1+1..5+1; müstakilde bahçe/parsel; üç kat örneğinde üst teras bulunur.
Boyut ve yerleşim tohumla değişir. Bunlar sınırlı şablon aileleridir; rastgele bir
mimari ihtiyacı çözen genel optimizasyon sistemi değildir.

Doğrulayıcı JSON şemasının yanında gerçek kesişim, oda kapanması, çakışma, ortak
düğüm, açıklık sınırı, girişten kapı/merdiven erişimi, kat kotu, araştırma ölçü
profili ve parsel/bahçe sınırını denetler. Kanonik şema Draft 2020-12'dir; toplu
koşu kullanılan ortak altkümenin derlenmiş kontrolünü kullanır. Aile/boyut testlerinde
kanonik doğrulayıcıyla da kontrol yapılır. Geçmeyen plan üretimi durdurur;
hatalı kayıtlar hazır veri olarak kabul edilmez.

Düzeltme kayıtları önceki tam plan, kullanıcı isteği, araç çağrısı ve sonraki tam
planı taşır: salon genişletme, banyo/çalışma yeri değiştirme ve ikinci kat ekleme.
`expected_revision` ve proje kimliği kontrol edilir. Büyük değişiklik tüm planın
yeniden önerilmesidir; komşu odalarda değişiklik olmadığı iddia edilmez. Kullanıcı
onayı almadan canlı projeye uygulanacak entegrasyon bu teslimde yoktur.

## D — veri sözleşmesi ve kapalı ayrım

`common.py` içindeki aynı sistem istemi ve sürümlü `ev-plan-tools/0.2` sözleşmesi
üretim, oracle ve model provasına girer. Model hedefi `actions` JSON nesnesidir;
plan.create/replace/swap çağrıları deterministik geometri aracına gider. Tam plan
kayıtları ayrıca saklanır. Bu, binlerce koordinatı modele ezberletmek yerine modeli
stüdyoyu araç olarak kullanmaya yöneltir; şu an canlı API'ye bağlı değildir.

Her plan için Türkçe/İngilizce sade ve ayrıntılı cümleler var. Eksik bilgiye soru,
onaysız taşıyıcı müdahalesine reddetme örnekleri eklenir. Komutların makine üretimi ve
varyasyon kimliği içermesi açıkça işaretlidir: gerçek doğal dil çeşitliliği ve insan
onayı yerine geçmez. Kullanıcının keyfî m²/yön/cephe ölçülerini karşılayan serbest
planlama bu ilk araçta tamamlanmış değildir.

Ayrım plan ailesine bağlıdır: eğitimde ilk yedi aile; doğrulamada holsüz gallery;
kapalı testte courtyard/notch. Aynı planın dil ve düzeltme türevleri aynı ayrımda
kalır. Test ailelerinin isimleri araç sözlüğünde vardır; test, bilinmeyen algoritma
icat etme ölçümü değildir. `convert.mjs` yalnız messages alanlarını dışa aktarır,
ayrımları ve kaynak/dosya hashlerini kontrol eder; proje kimliği/tohumu değil geometri imzasıyla tekrarları ve bunlara bağlı tüm dil/düzenleme türevlerini ayıklar. Eğitim başlatmaz.

Üretim başında ve sonunda stüdyo/şema/kurallar/araç kaynakları hash'lenir. Çalışma
kopyasındaki viewer, fetch edilmiş origin/main ile farklıysa üretim durur. Koşu
sırasında kaynak değişirse manifest yazılmaz; sonraki ölçümde değişiklik varsa
STALE_DATASET olur. Uzak main'in son durumu için önce fetch gereklidir.

## Mevcut viewer ile prova

Kurulu Chrome, yerel sunucu ve Playwright ile JSON isteği fixture'a yönlendirilerek
14 kat örneği açıldı: oda sayıları eşleşti, 2B→maket geçişinde sayfa hatası yoktu.
Sabit site dosyası değiştirilmedi. Bu, otomatik kullanıcı dosya yüklemesi değildir.
Viewer'ın tanıtım metni hâlâ sabit 3+1 ifadesi taşıyor; ev tipi/kat seçimi, merdiven,
döşeme boşluğu, arsa/bahçe ve kolon gösterimi Claude'un entegrasyon işi olarak açık.
Tek katın görünmesi, çok katlı projenin tam 3B kanıtı sayılmadı.

## Yerel Qwen ve eğitim durumu

Ollama'da `qwen3.5:9b` bulundu. Aynı kapalı testten iki plan, bir netleştirme ve bir
reddetme örneği için CPU-only deneme başlatıldı (`num_gpu=0`, sıcaklık 0, context 8192,
768 çıktı tokenı). Tamamlanmış sonuç raporu alınamadı; istemci durduruldu. Ollama ps
modeli CPU ve Stopping durumunda gösterdi. Başarı oranı **ölçülemedi**, sıfır veya
başarılı diye yazılmadı. İstek başına 180 saniye socket sınırı toplam koşu için kesin
zaman sınırı değildir; daha güçlü timeout/checkpoint koşucusu geliştirilmelidir.

Büyük genel model karşılaştırması yapılmadı: mevcut yerelde büyük model yok;
ücretli dış servis kullanılmadı. Qwen2.5 7B kurulu olsa da “büyük genel model” diye
raporlanmadı. Qwen3.5:9b için LoRA veya başka ağırlık güncellemesi yapılmadı.

40 yeni örnek **insan onayı bekliyor**. Önceki görev onayları bunlara uygulanmadı.
[QWEN-KUSURLAR](QWEN-KUSURLAR.md) açıkları takip eder; kiralık GPU kapısı kapalıdır.
Biçim %98, kapalı test %95, doğal Türkçe %90, netleştirme/reddetme %95 ve gerileme
koşulları geçildi denemez. Gerçek Qwen tabanı ve bağımsız karşılaştırma tamamlanmadan
bu verinin eğitim kazancı hakkında sonuç yoktur.

## Sınırlar ve sonraki denetim

- Geçerli sentetik plan, güzel/ekonomik/üretilebilir ev demek değildir. Özellikle
  yardımcı oda ve ıslak hacim boyutları insan incelemesi ister.
- Kapı kanadı süpürme çarpışması, gerçek 3B merdiven baş mesafesi ve taşıyıcılık
  çözülmedi. Minimum en denetimi oda çekirdeğine bakar; her dar boğazı ispatlamaz.
- Tüm boş/bozuk referans kombinasyonlarını içeren fuzz çalışması henüz yok.
- Alan metriği, referans üretilen planla tutarlılıktır; kullanıcının keyfî alan
  talebini başarıyla çözdüğü anlamına gelmez. Açık alan/teras ayrı bütçelenmeli.
- Tüm testler ve örnekler bu yeni ev katmanına aittir; önceki mobilya komutlarının
  model düzeyinde gerileme ölçümü henüz tamamlanmadı.

Bu nedenle PR veri/araç prototipi olarak incelenmelidir; Qwen ev tasarım eğitimi
bitmiş veya yayına hazır teslim olarak sunulmaz.

## Son ölçüm tablosu

| Ölçüm | Sonuç |
|---|---|
| Ham sentetik kayıt | 2.200 / 2.200 araştırma profilinden geçti |
| Farklı geometri | 2.068; 132 tekrar SFT'den türevleriyle birlikte çıkarıldı |
| Ham plan ayrımı | 1.540 eğitim / 220 doğrulama / 440 test |
| Ham sohbet kaydı | 6.300 / 904 / 1.807 |
| Tekrarları ayıklanmış SFT sohbeti | 5.772 / 904 / 1.807 |
| Oracle hedef geri oynatma | 1.807 / 1.807; biçim, oda/tür, kat, referans alan tutarlı; hata 0 |
| Açık uyarı | 2.200 sertifika değil; 1.760 ıslak hacim/tesisat incelemesi |
| Veri ayrımı sızıntısı | Plan kimliği, aile grubu ve tam kullanıcı bağlamı kesişimi 0 |
| Geometri/araç testleri | 19 test; aile/boyut alt örnekleri kanonik şemayla da kontrol edildi |
| ev.html smoke | 14 / 14 kat örneği; 2B→maket, oda sayısı, sayfa hatası |
| İnceleme sayfası | 40 örnek / 56 kat çizimi; mobil yatay taşma yok |
| Qwen / büyük genel model / LoRA | Tamamlanmış model ölçümü yok / yapılmadı / yapılmadı |

İlk 2.000 plan üretimi 1.003 saniye sürdü. Ek plan ve son geri oynatmada, yalnız
kaynak parmak izi ve tam içerik hash'i aynı olan önceki doğrulama/puanlar önbellekten
kullanıldı; yeni kayıtlar ayrıca denetlendi. Önbellek yöntemi manifestlerde açık.
1647 eski hedef satırı tam içerik ve ham yanıt eşitliğiyle yeniden kullanıldı; yeni
160 hedef normal yürütücüyle ölçüldü. Bu süre veya başarı model eğitimi ölçümü değil.

İngilizce sentetik hazır yanıtlar SFT dönüştürücüde İngilizceye eşlenir; araç argümanları
değişmez. Bu, gerçek müşteri notlarının çevirisi veya genel çeviri servisi değildir.

Kanıtlar: [audit.json](veri/ev-plan-veriseti/audit.json),
[oracle-summary.json](veri/ev-plan-veriseti/oracle-summary.json),
[sft-manifest.json](veri/ev-plan-veriseti/sft-manifest.json).
[40 örneklik çevrimdışı okuma sayfası](veri/ev-plan-veriseti/okuma.html) henüz insan
onaylı değildir; sayfayı açmak onay sayılmaz.
