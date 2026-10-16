# AURA tasarım sistemi — değerlendirme ve yol haritası

Tarih: 2026-10-16
Dal: `codex/aura-parametric-components` (PR #23 sonrası)

Bu belge kod okunarak ve stüdyolar tarayıcıda çalıştırılarak hazırlandı. Ekran görüntüleri `knowledge/degerlendirme/` klasöründedir. Codex için uygulama emri niteliğindedir.

---

## 1. Hedef

Sistem tek bir tasarım platformudur ve iki giriş kapısı vardır:

1. **Seçmeli ürün stüdyosu.** Müşteri tek bir mobilyayı adım adım tasarlar.
2. **AI oda projesi.** Sohbetle önce tarz anlaşılır, sonra bir odanın tamamı proje olarak tasarlanır.

İki kapı aynı yetenekleri paylaşır:

- canlı 3D ve teknik çizim
- **görselden teknik çizim:** fotoğraf ya da eskiz → parametrik model → ölçüler → düzenleme
- sesli ve yazılı komutla düzenleme
- kumaş, ahşap ve metal malzemelerin gerçekçi gösterimi; ileride perde, halı ve yastık da aynı tekstil sistemini kullanacak

Çıktı her durumda aynıdır: **tasarımcı paketi.** Ölçüler, çizimler, parça listesi, malzemeler ve 3D modelden oluşur. Gerçek tasarımcı paketi inceler, düzeltir ve üretime geçirir.

## 2. Bugünkü durum (doğrulanmış)

### 2.1 Neler var ve iyi

- **Stüdyo ortamı ve kamera.** Perspektif çalışmasından sonraki hal iyi. Kamera çerçeveleme, ölçü etiketleri, ön/yan/üst teknik görünüşler, CSV ve DXF çıktısı ile parça detay paftaları çalışıyor. 243 kamera çerçeveleme testi geçiyor.
- **Ürün motorları.** Döşeme (72 montaj), sectional/köşe (216), panel/dolap (48), Ritmo modüler depolama (324), mutfak çalışmaları (9) ve referans çalışmaları (528 varyant) mevcut. Hepsi testli.
- **Bilgi katmanı (FDE).** `knowledge/furniture_design_engine` altında şunlar var:
  - 10 tür için parça taksonomisi ve oran kuralları
  - ergonomi zarfları
  - 5 tam stil ontolojisi ve 21 taslak stil
  - üretim kısıtları
  - görsel → parça VLM prompt'ları (`image_to_parts_prompt.txt`)
- **Tekstil çekirdeği.** NAKIŞ'tan gelen `w4/assets/nakis/weave.js` dosyasında 7 gerçek örgü tanımı var: bezayağı, 2/2 dimi, 3/1 dimi, 5'li saten, panama, balıksırtı, elmas dimi. Her örgü bir çözgü/atkı kesişim matrisi ile tanımlı: `top(i,j)`, yani karelli örgü raporu. Damask ilkesi de tanımlı: figür ve zemin farklı örgüyle dokunuyor.
- **Oda planlayıcı.** `space-model`, `space-planner`, `room-scene`, `space-pdf`, `ai-workspace` ve `vendor/room-studio` (Apache-2.0) dosyalarında şunlar mevcut: oda, kapı, pencere, kapı açılımı, çakışma kontrolü, 3 hazır ev şablonu, 14 aile yerleşimi.
- **Açık kaynak dayanaklar.** Infinigen kanepe parametreleri (BSD-3), WoodworkingShop çekmece hesabı (MIT), room-studio (Apache-2.0).

### 2.2 Asıl sorun: neden hep aynı ürün çıkıyor

Kanepe akışı tarayıcıda baştan sona yürütüldü. Seçenek uzayı şöyle:

| Adım | Seçenek sayısı |
|---|---|
| Gövde tipi | 4 (modern, chester, lounge, açık ahşap) |
| Kolçak | 6 |
| Oturum | 3 |
| Sırt | 3 |
| Ayak/baza | 4 |
| Ahşap | 3 |
| Kumaş rengi | 6 |
| Örgü | 3 |

Kâğıt üstünde birkaç bin kombinasyon çıkıyor. Ama bunlar görsel olarak neredeyse aynı ürün. Nedenleri:

1. **Geometri kutu tabanlı.** Her ürün, `shape` etiketli eksen hizalı kutuların listesi (`upholstery-model.js`). "Yuvarlak kolçak" bir silindir, "minder" yuvarlatılmış bir kutu. Kesit profili, eğri, oran ya da detay parametresi yok.
2. **Tarz, geometriyi sürmüyor.** 4 gövde tipi koda gömülü `if` dallarıyla tanımlı. Oranlar her tipte sabit. FDE'deki 26 tarz yönü ve oran kuralları geometriye hiç bağlanmamış. Tarz yalnızca sohbetteki tercih çıkarımında kullanılıyor.
3. **Sürekli parametre yok.** Kolçak yüksekliği, sırt eğimi, minder kabarıklığı, ayak inceliği/eğimi ve kol genişliği tasarımı gerçekten değiştiren değerler. Bunlar ya sabit ya da ölçüye bağlı tek bir formül.
4. **Detay katmanı yok.** Biye, kapitone düzeni, etek (pile, düz, yok), dikiş tipi, çivi başlı süs, kontrast kenar, ayak başlığı, arka yükseklik profili gibi ürünü karakterize eden ögeler yok.
5. **Kumaş bir renkten ibaret.** `furniture-textures.js` 7 örgünün yalnızca 3'ünü kullanıyor ve bunu %13 opaklıkta bir bindirme olarak yapıyor. Normal haritası düz bir sinüs. İplik ölçeği, lif türü (keten, yün, kadife, bukle, deri), parlaklık ve desen yok. Örgü önizleme kartları birbirinin aynısı görünüyor.
6. **Ahşap çizgili bir kanvas.** Ağaç türü, damar yönü, kaplama yönü, uç kesit ve pürüzlülük haritası yok.
7. **Motorlar parçalı.** Altı ayrı veri modeli var: Ritmo, upholstery/sectional, panel, mutfak, referans ve `design-library` (14 aile, SVG çizimli). Yetenekler birinden ötekine taşınamıyor.

Sonuç: müşteri "binlerce tarz" vaadine karşılık pratikte 4 gövdenin renk varyasyonlarını görüyor.

### 2.3 Diğer eksikler

- **AI.** Canlıda yalnızca tarz çıkarımı var. Geometriyi araçla düzenleyen agent döngüsü yalnızca mock ile test edilmiş. Natro FTP hosting Node çalıştırmıyor. Yerel Qwen CPU'da tek yanıt için yaklaşık 53 saniye sürüyor. Görsel okuyabilen (vision) bir model hiç bağlı değil.
- **Görselden çizim.** Site içinde dosya yükleme yalnızca `.json` kabul ediyor. Ritmo 01 bir görselden yorumlanmış, ama bu iş site dışında yapılmış.
- **Ses.** Yok.
- **Oda akışı.** Yukarıdaki modüller hiçbir sayfaya bağlı değil.
- **Tasarımcıya teslim.** Kapalı: `project-config.php` içinde `enabled=false`, alıcı alanı boş.
- **Sahne.** Ortam haritası ve tone mapping var. Eksikler:
  - yumuşak gölge kaldırılmış (three.js sürümü PCFSoft'u desteklemiyor)
  - ambient occlusion yok
  - temas gölgesi zayıf
  - Ritmo'da gölge ürüne göre kaymış görünüyor

## 3. Hedef mimari

### 3.1 Tek veri modeli: `AuraProject`

```
AuraProject
├─ meta            (sürüm, dil, durum: draft→submitted→designer_review→revised→approved→production)
├─ tasteBrief      (pozitif/negatif tarzlar, kanıtlar, onay)
├─ room?           (ölçüler, açıklıklar, engeller)
├─ items[]         (her biri bir Design)
│   └─ Design
│       ├─ family          (sofa, armchair, chair, table, cabinet, bed, curtain…)
│       ├─ style           (stil kimliği + tohum/seed)
│       ├─ slots{}         (arm: {type:'scroll', params:{…}}, leg: {...}, back: {...}…)
│       ├─ params{}        (genel ölçü ve oranlar)
│       ├─ materials{}     (slot → malzeme referansı)
│       └─ placement?      (oda içindeki konum/dönüş)
├─ revisions[]     (kim, ne zaman, hangi alan, not)
└─ derived (hesaplanır, saklanmaz): parts[], bom[], drawings[], glb
```

Ritmo, eski stüdyo, oda planlayıcı, AI ve tasarımcı paneli aynı nesneyi okur ve yazar. Şema JSON Schema ile doğrulanır. Eski kayıtlar için göç fonksiyonları yazılır.

### 3.2 Parametrik parça kütüphanesi (çeşitliliğin kaynağı)

Her parça tipi bir **üreteçtir**. Bir parametre kümesi alır, şunları üretir:

- 3D mesh
- 2D çizim ögeleri: kontur, kesit, ölçü zinciri
- BOM satırları
- üretim meta verisi (FDE `furniture_parts.json` ile eşlenir)

Kutu yerine profil tabanlı geometri kullanılır:

| Parça | Yöntem | Örnek tipler |
|---|---|---|
| Kolçak | 2D kesit profili, yol boyunca sweep | düz, track, scroll/İngiliz, rulo, eğimli, flared, kanatlı, ince, ahşap tablalı |
| Ayak | lathe (torna) profili veya ekstrüzyon | konik, torna, bun, kare, açılı/splayed, kızak, saç-firkete, gizli baza, tekerlekli |
| Minder | crown'lu alt bölümlü kutu (subdivision) | boxed, knife-edge, bullnose, biyeli, tek/çok parça |
| Sırt | eğri yüzey + rake açısı | sabit, ayrı minderli, kanallı, kapitone (elmas/bisküvi), kamelback, kanat |
| Etek | panel + pile sayısı | düz, kutu pile, köşe pileli, yok |
| Karkas | gerçek birleşim | açık ahşap, metal çerçeve, panel |
| Gövde paneli | Ritmo ve panel motoru | kapak, çekmece, raf, baza |

Her tip, sürekli parametreleri min, max ve varsayılan değerleriyle tanımlar. Örnek: kol yüksekliği, kol üst yarıçapı, flare açısı, ayak taper oranı, ayak açısı, minder crown'u, sırt rake'i, kapitone grid aralığı.

Kaynak: Infinigen'in oturma, masa ve raf üreteçleri (BSD-3). Kanepe parametreleri zaten alınmış. Kalan üreteçler port edilmeden önce lisans notu ve kaynak commit'i korunur.

### 3.3 Montaj grameri

Her aile bir **slot şeması** tanımlar. Örnek (kanepe):

```
base + seat_deck + arm×2 + back + seat_cushions[n] + back_cushions[m] + support(legs|plinth|skirt) + pillows?
```

Kurallar:

- bağlantı noktaları
- ergonomi zarfı (FDE `ergonomic_envelope`)
- üretim kısıtları (`manufacturing_constraints.json`)
- uyumsuzluklar (ör. etek + açık ayak birlikte olmaz)

Aynı gramer sandalye, berjer, yatak başlığı, masa ve dolap için de yazılır.

### 3.4 Tarz → parametre dağılımı (binlerce gerçek seçenek)

Her tarz (26 yön) bir **öncül dağılım** dosyasıdır: hangi parça tiplerini hangi olasılıkla kullandığı ve sürekli parametrelerin hangi aralıkta durduğu. Örnek, Japandi:

- alçak oturum
- ince konik ahşap ayak
- düz veya ince kol
- düşük crown
- keten/yün dokular
- kontrast detay yok

Üretim adımları:

1. `generate(style, constraints, seed)` deterministik bir tasarım üretir.
2. Aynı tarzdan 12 farklı tohum, 12 gerçekten farklı ürün verir.
3. **"Buna benzer daha fazla"** seçilen tasarımın parametre komşuluğundan örnekler.
4. **"İki tasarımı karıştır"** iki parametre kümesi arasında ara değer üretir.
5. Kısıtlar (ölçü, bütçe kademesi, malzeme) örneklemeyi sınırlar.

Seçmeli akış sabit kalır (ölçü → gövde → parçalar → detay → malzeme → özet). Fark şu: her adımda kart ızgarası artık 3-6 sabit seçenek değil. Seçili tarzdan üretilmiş, birbirinden belirgin biçimde farklı önizlemeler gösterilir. Her kartta canlı küçük 3D render bulunur. Her adımın altında "Ayrıntı" panelinde sürekli kaydırıcılar yer alır.

### 3.5 Malzeme sistemi (NAKIŞ tekstil çekirdeğiyle)

**Tekstil.** Tek ortak sistemdir; döşeme, perde, yastık ve halı aynı sistemi kullanır.

Katmanlar:

1. **Örgü raporu (karelli matris):** `weave.js`'teki 7 tanım ve genişletilebilir yeni örgüler.
2. **İplik:** lif türü (keten, pamuk, yün, kadife, bukle, şönil, deri, suni deri), iplik kalınlığı (mm), büküm, tüylülük.
3. **Desen:** düz, çizgili, ekose/karelli, damask/jakar (NAKIŞ motifleri + figür/zemin örgü farkı), baskı. Rapor tipleri NAKIŞ'taki gibi düz, yarım kaydırma ve ayna.
4. **Renk:** NAKIŞ'taki tarihî boya paleti dahil.

Bu katmanlardan **gerçek ölçekte** (mm/rapor) prosedürel haritalar üretilir:

- albedo
- normal (iplik geçişlerinden türetilir, sinüsten değil)
- roughness
- sheen (kadife ve saten için)
- anisotropi (saten için)

Malzeme kartında örgü raporu kareli diyagramla gösterilir, NAKIŞ'ta olduğu gibi. Tasarımcı paketine kumaş tanımı ve tahmini metraj eklenir; metraj "yaklaşık" etiketiyle verilir.

**Ahşap.** Tür kartları (meşe, ceviz, dişbudak, kayın, iroko…) prosedürel damar, kaplama yönü ve uç kesit ile tanımlanır. Yüzey işlemleri: mat, ipek mat, yağ, lake. Her biri pürüzlülük farkıyla gösterilir.

**Metal.** Pirinç, siyah çelik, krom, bronz; fırçalı veya parlak.

### 3.6 Görsel kalite

Gerçek zamanlı görünüm için:

- PMREM HDRI
- ambient occlusion (N8AO veya SSAO pass; lisansı kontrol edilecek)
- temas gölgesi
- VSM veya yumuşatılmış gölge
- doğru ACES pozlama
- pah ve yuvarlatma için mesh bevel'i

**"Fotoğraf" düğmesi.** `three-gpu-pathtracer` ile birkaç saniyelik yol izlemeli (path-traced) render alınır. Sunum, tasarımcı paketi ve kart önizlemesi bu render'ı kullanır.

### 3.7 AI katmanı

**Araç API'si.** UI'nin yaptığı her şey bir araçtır:

- `select_family`
- `set_slot(slot, type)`
- `set_param(path, value)`
- `apply_style(id)`
- `generate_variants(n)`
- `pick_variant`
- `set_material(slot, spec)`
- `add_item` / `move_item` / `remove_item`
- `set_room`
- `undo`
- `ask_user`

Her çağrı şema ve gramer ile doğrulanır. Geçersiz çağrı gerekçesiyle modele geri döner. Değişiklikler önce "öneri" olarak görünür; kullanıcı onaylayınca uygulanır. Bu, mevcut "kullanıcı kabul etmeden değişmez" ilkesinin devamıdır.

**Görselden teknik çizim.** Akış:

1. Fotoğraf veya eskiz yüklenir.
2. VLM ile FDE'deki A→D prompt'ları çalıştırılır: tür → parçalar → tarz özellikleri → tasarım DNA'sı.
3. Her bulunan parça, kütüphanedeki en yakın parça tipine ve parametrelerine eşlenir.
4. Ölçü, ergonomi zarfından tahmin edilir ve "tahmini" etiketi taşır. Müşteri bir ölçü girerse diğer ölçüler orantılanır.
5. Ortaya düzenlenebilir bir parametrik tasarım çıkar. Bu, gerçek bir ölçüm değildir ve kullanıcıya böyle gösterilir.

**Canlı çizim.** Eskiz alanından VLM'e geçen akış da aynı yolu kullanır.

**Ses.** Tarayıcıda Web Speech API (`tr-TR`, Chrome/Edge) kullanılır; desteklenmeyen tarayıcıda sunucu tarafında Whisper devreye girer. Sesli komut yazılı komutla aynı agent'a gider. Her komuttan sonra kısa bir teyit verilir. Örnek: "Kol yüksekliği 62 → 58 cm."

**Model ve barındırma.** Vision ve araç çağırma için yerel CPU-Qwen yeterli değil. İki seçenek var:

- (a) Natro PHP üzerinde ince bir proxy ile barındırılan bir API (vision + tool calling destekli)
- (b) GPU'lu bir sunucuda Qwen2.5-VL veya muadili

Model çıktısı hiçbir zaman doğrudan ürün iddiası olarak gösterilmez. Mevcut kanıt bekçileri korunur.

### 3.8 Oda akışı

1. Sohbetle tarz brifi çıkarılır (mevcut).
2. Oda ölçüsü, kapı ve pencereler girilir (`space-model`). Hazır şablonlar ve "fotoğraftan oda" seçeneği sonraya bırakılır.
3. **Yerleşim çözücü** öneri üretir: duvar, odak noktası, geçiş mesafesi, kapı açılımı ve ergonomi kurallarına dayalıdır. Mevcut çakışma kontrolleri kullanılır.
4. Her ürün tarz dağılımından üretilir. Oda bütünlüğü için malzeme ve ahşap tonu ortak paletten seçilir.
5. Sürükle-bırak, sesli komut ve ürün başına kendi aile editörü ile düzenlenir.
6. Oda paketi çıkar: plan, görünüşler, her ürünün paftası ve toplam BOM.

### 3.9 Tasarımcı paketi ve iş akışı

**Paket içeriği:**

- PDF: kapak, tarz brifi, oda planı, her ürün için ölçülü ön/yan/üst/kesit görünüşler, detay paftaları, malzeme ve kumaş kartları, BOM, path-traced görsel
- DXF
- CSV (kesim ve parça listesi)
- GLB
- `project.json`

**Teslim:**

- `project.php` yapılandırılıp açılır; depolama ve e-posta bildirimi kurulur.
- **Tasarımcı paneli:** paketi açar, aynı stüdyoyu "kilitsiz" modda kullanır (sınırların dışına çıkabilir, uyarı görür), revizyon notu yazar, durumu ilerletir.
- Müşteri revizyonları ve farkları görür.
- KVKK onay akışı korunur.

## 4. Uygulama sırası

Her faz bağımsız teslim edilebilir. Testler her fazda yeşil kalmalıdır.

**Faz 0 — Omurga**
- `AuraProject` şeması ve göçler
- tek render çekirdeği (Ritmo + eski stüdyo sahnesi birleşir)
- mevcut testlerin yeni modele bağlanması

**Faz 1 — Kanepe ailesini gerçek parametrik hale getirme** (vitrin ürünü)
- profil tabanlı kol, ayak, minder ve sırt üreteçleri
- montaj grameri
- 5 tam tarz dağılımı (mevcut 5 tam ontoloji)
- 12'li varyant ızgarası
- detay katmanı: biye, kapitone, etek
- teknik çizim ve BOM'un yeni parçalardan üretilmesi

**Faz 2 — Malzeme**
- NAKIŞ tekstil çekirdeğinin tam bağlanması (örgü, iplik, desen → PBR haritalar)
- ahşap türleri
- AO, gölge ve path-traced "fotoğraf"

**Faz 3 — Teslim**
- tasarımcı paketi
- teslim hattı
- tasarımcı paneli (revizyon döngüsü)

**Faz 4 — AI**
- barındırma kararı
- araç API'si
- görselden parametrik tasarım
- ses

**Faz 5 — Oda**
- oda sayfası
- yerleşim çözücü
- oda paketi

**Faz 6 — Diğer aileler**
- berjer/koltuk, sandalye, masa, yatak başlığı, dolap (Ritmo yeni modele taşınır)
- ardından perde (tekstil sistemi hazır olduğu için)

## 5. Kabul ölçütleri

- **Çeşitlilik:** Aynı tarzdan 12 tohum üretilir. Siluet ve parça-tipi farkı ölçülür. Parametre uzayında, asgari bir uzaklık eşiğinin altında kalan çiftlerin oranı %10'u geçmemeli. Görsel olarak birbirinin kopyası kart çıkmaz.
- **Tarz sadakati:** Her tarz için, FDE skorlama kurallarıyla (`style_scoring_rules.json`) üretilen tasarımın kendi tarzında en yüksek puanı alması gerekir.
- **Üretilebilirlik:** Her aile için 1000 rastgele tohumda şunlar sağlanmalı:
  - pozitif ölçüler
  - parça çakışması yok
  - ergonomi zarfı içinde
  - BOM toplamları tutarlı
  - DXF açılabilir
- **Malzeme:** Örgü raporu ile normal haritası birebir tutarlı olmalı (test edilebilir). Kumaş ölçeği mm cinsinden doğru olmalı.
- **AI:** 30 Türkçe komutluk senaryo seti (yazılı + sesli) ile doğru araç ve doğru sonuç ölçülür. 10 fotoğraflık set ile tür, parça ve tarz eşlemesi ölçülür. Tahmini ölçüler etiketli olmalı.
- **Uçtan uca:** sohbet → oda → 3 ürün → paket → tasarımcı panelinde açılış → revizyon → müşteri görünümü.
- Mevcut `w4/tests/*.mjs` testlerinin tamamı geçmeye devam etmeli.

## 6. Karar bekleyen noktalar (proje sahibi)

1. AI barındırma: (a) barındırılan API + PHP proxy, ya da (b) GPU sunucu.
2. Faz 1 vitrin ürünü kanepe olsun mu, yoksa başka bir aile mi?
3. Tasarımcı teslim biçimi: e-posta, site içi panel ya da ikisi.
4. Tekstil kataloğu: gerçek tedarikçi kumaşları mı, yoksa temsilî prosedürel kumaşlar mı (ilk aşama)?

---

## 7. Uygulama durumu (2026-10-16 akşam, Claude) — Forma oturma stüdyosu

Yayındaki sayfa: `w4/tasarla.html`. Kod: `w4/assets/forma/` (ayrıntı: `w4/assets/forma/README.md`). Test: `node w4/tests/forma-check.mjs`.

**Yapıldı**
- Parametrik parça kütüphanesi: profil tabanlı kolçaklar (8 kesit + ahşap + kolçaksız), torna ayaklar (9), crown'lu/kapitone/kanallı minderler, biye, etek, baza, kızak, ahşap çatkı, iç iskelet.
- Oturma grameri (kanepe, ikili, berjer); ergonomi ve üretim kontrolleri; oturum derinliği otomatik oturtma.
- 26 tarz dağılımı (kimlikler AI tarz brifiyle aynı); 12'li farklı öneri, "buna benzer", "iki tasarımı karıştır". Testte her tarzın 12 önerisi en az 7 farklı parça kombinasyonu taşır.
- NAKIŞ örgü çekirdeğinden gerçek ölçekli kumaş: 7 örgü, kareli örgü şeması arayüzde; çizgili, pötikare, ekose, damask (figür farklı örgüyle); kadife, bukle, deri. Ahşap türleri ve yüzeyler.
- Render: PBR, yumuşak gölge, AO, kenar yumuşatma, sayfa tonunda zemin, "Fotoğraf", GLB.
- Teknik çizim: A3, gerçek ölçek, ön/yan/üst/kesit, ölçü zincirleri, özellik tablosu; DXF; parça listesi (TR/EN) ve kumaş metrajı; tasarımcı paketi ZIP (PDF, SVG, DXF, CSV, GLB, JSON).
- 8 dilde yazılı ve sesli komut (tarayıcı konuşma tanıma); çevrimdışı çalışır.
- AI altyapısı: `api/forma-ai.php` (serbest komut + görselden parametrik tasarım), çıktılar sözlükle doğrulanır. Anahtar girilene kadar kapalı.
- Tasarımcıya gönderim: `api/forma-submit.php`, yapılandırılana kadar kapalı; kapalıyken paket indirilir.
- Ana sayfa ve sohbet (oturma kategorisi) stüdyoya bağlandı.

**Codex'e kalanlar (öncelik sırasıyla)**
1. AI anahtarını sunucuya koyup (`forma-secrets.php`) görselden tasarımı 10 fotoğraflık bir setle ölçmek; serbest komutlar için 30 cümlelik senaryo testi.
2. Tasarımcı paneli: gelen paketleri listeleme, `project.json`'u stüdyoda "kilitsiz" açma, revizyon notu, durum akışı.
3. Köşe ve uzanma modülleri (eski `sectional-model.js` mantığı) Forma gramerine; ardından sandalye, sehpa/masa, yatak başlığı; Ritmo'nun aynı `AuraProject` modeline taşınması.
4. Oda akışı: `space-model`/`space-planner` sayfaya bağlanacak, yerleşim çözücü ve oda paketi.
5. Perde ailesi (tekstil sistemi hazır).
6. Renk adlarının ve parça listesinin DE/FR/NL/DA/ES/IT çevirileri (şu an renkler TR/EN).
7. İsteğe bağlı: path-traced fotoğraf (three-gpu-pathtracer), ahşap haritalarının hızlandırılması.

## 8. Uygulama durumu (2026-10-16 gece, Claude) — Masa ve sehpa ailesi, kumaş deseni, ses

**Yapıldı**
- Stüdyo iki aileli: üst çubukta "Oturma grubu | Masa ve sehpa"; `tasarla.html?family=table&kind=dining`. Sohbetteki "masa" kategorisi masa stüdyosuna bağlandı.
- Masa grameri (`table.js`): yemek, orta sehpa, yan sehpa, konsol, çalışma masası; 7 tabla şekli, 6 kenar profili, 11 ayak sistemi, uzatma tablası, çekmece, raf, arka panel. Kontroller: diz boşluğu, sehim, devrilme, ağırlık, ahşap hareketi; kişi kapasitesi. Parça listesinde gerçek kesim ölçüleri. 26 tarz × 5 tür × 4 tohum = 520 tasarım hatasız (test).
- Malzeme: masif/kaplama ahşap + vernik tonu, 8 doğal taş/seramik (honlu/parlak), 5 cam, lake (piyasa renkleri), metal ayak; "tabla ile aynı".
- Komutlar: "6 kişilik oval ceviz yemek masası", "mermer tabla", "füme cam", "pirinç ayak", "uzatmalı", "20 cm daha uzun" (8 dil). Oturma grubundayken masa sözcüğü aileyi değiştirir.
- Kumaş sırası: lif → örgü → renk (24 piyasa rengi + tarihî boyalar) → desen (çiçekli, puantiye, yaprak, geometrik, çizgili, pötikare, ekose, kazayağı, zikzak, damask) → motif → sıklık (1–6) → ikinci renk.
- "Kanepe" yerine "Üçlü koltuk / İkili koltuk / Berjer". İskelet ve ayaklar gürgen; renk ayrı vernik tonu.
- Ses: `.htaccess` mikrofonu tüm sayfalarda kapatıyordu (`microphone=()`), açıldı (`self`). Tarayıcıda konuşma tanıma yoksa Whisper tarayıcıda çalışır (sunucusuz, ücretsiz).

**Codex'e kalanlar**
1. Masa ailesi için AI sözlüğü (`ai.js` şu an yalnız oturma); görselden masa.
2. Sunucusuz görsel okuma: transformers.js ile tarayıcıda CLIP/SigLIP sıfır-atış sınıflandırma (her parça özelliği için aday metinler) + ölçü oranları; isteğe bağlı WebGPU'da küçük VLM (SmolVLM/Florence-2).
3. Sandalye ailesi (masa ile takım), köşe koltuk modülleri, yatak başlığı.
4. Tasarımcı paneli, oda akışı, perde ailesi (önceki listeden).

## 9. Karar (2026-10-16 gece): hazır öneri yok, paket yalnız tasarımcıya
- "Öneriler" sekmesi kaldırıldı (iki ailede). Tarz seçimi yalnız temel formu açar; kişi tasarımı parça, ölçü ve malzemeyle kendisi kurar. "Daha fazla öneri / buna benzer" komutları devre dışı.
- "Teslim" sekmesi "Gönder" oldu: ekranda yalnız özet (tür, tarz, genel ölçü, ana malzeme) ve gönderim formu. Teknik çizim, parça listesi, DXF/SVG/CSV/GLB/JSON indirme ve "Kaydet/Dosya aç" kaldırıldı. Yalnız "Fotoğraf" indirilebilir.
- Gönderimden sonra müşteri, gönderdiği tasarımın PDF'ini (görsel + ölçülü çizim) indirebilir; kayıt tarayıcıda proje numarasıyla tutulur.
- Gönderim kapalıyken (sunucu ayarı yok) form pasif, indirme yok. Açmak için sunucuda `api/forma-secrets.php`: `submit_enabled`, `submit_recipient`, `submit_sender`, `submit_store_dir` (public_html dışı klasör).
- Not: çizim tarayıcıda üretildiği için teknik bilgisi olan biri geliştirici araçlarıyla yine erişebilir. Kesin koruma için çizim/PDF üretimi sunucuya taşınmalı (Codex işi).
