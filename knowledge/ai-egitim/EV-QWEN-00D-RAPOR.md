# EV-QWEN-00D — gerçek plan referansları

20 Ekim 2026 · `codex/ev-qwen-00d` · Başlangıç main: `35b064e`.

## Teslim yaklaşımı

00B'nin sıfırdan şerit oda üreten çözücüsü bu yola taşınmadı. Gerçek planın oda/duvar/açıklık poligonları korunuyor; istek önce ortak `plan_program` sözleşmesine, sonra doğrulanmış gerçek referanslara bağlanıyor. Sonuç bir ölçü uyarlama önerisi; son karar tasarımcıda.

Araştırma: [20 kaynak ve sekiz ülke portalı](EV-QWEN-00D-ARASTIRMA.md), [ayrıntılı envanter](../ev-projesi/veri/real-dataset-registry.json), [atıf kaydı](VERI-ATIF.md). Kanonik veri Swiss Dwellings v3, CC BY 4.0. MSD aynı kaynağın uygun lisanslı alternatifi; ayrıca indirilmedi. Diğer kaynaklar araştırma kararlarıyla ayrı tutuldu. Lisansı belirsiz veya ticari kullanıma kapalı veri korpusa alınmadı.

## Çalıştırma ve kanıtlar

Swiss v3 arşivi 931.868.205 bayt; yayıncı MD5 `3b7915ecd5bf8e492a3e78c598b74123`, SHA-256 `382e528fae3220b7747f4e6bc7d79261fee1b5d4d7902f18c548c0e6f22ef80a`. İndirme 553,391 saniye, tam dönüşüm 3.192,250 saniye sürdü; bunlar bu makinedeki gözlemlerdir, başka koşular için süre vaadi değildir.

**46.937 aday kat-birim kaydının tamamı tarandı; 8.719 benzersiz plan kabul edildi.** Yayıncının 45.176 daire sayısı ile aday kat-birim sayısı aynı birim değildir; CSV'de kat tekrarları bulunur. Eğitim kalibrasyonu 6.150 plan / 1.448 binadan hesaplandı. Dönüşüm 38.218 kaydı (%81,424) aşağıdaki nedenlerle dışarıda bıraktı:

| Neden | Kayıt |
|---|---:|
| Çıkarılan erişim grafı bağlantısız | 15.457 |
| Açıklık–oda ilişkisi çözülemedi | 9.831 |
| Birebir net geometri tekrarı | 7.988 |
| Delikli poligon v0.2'ye aktarılamıyor | 2.953 |
| Kaynak giriş açıklığı yok | 1.313 |
| Net oda 0,3 m² içe alma alt sınırının altında | 265 |
| Eşlenemeyen oda etiketi | 156 |
| Toplam alan 10–1.000 m² içe alma aralığı dışında | 133 |
| İç giriş ilişkisi belirsiz | 122 |

Bu yüksek dışlama oranı tüm veri setinin kusur oranı değildir. Özellikle graf ilişkilendirmesi ve v0.2 temsil kısıtları nedeniyle kullanılabilir kaynakların bir kısmı da bu ilk içe alıcıda dışarıda kalır. Eşlenemeyen etiket `GARDEN`: 186 kaynak alanı; 156 birimin reddiyle ilişkilidir. 0,3 m² ve toplam alan sınırları önerilen içe alma kapılarıdır, mevzuat eşiği değildir.

WC alan kalibrasyonunda 2.066 eğitim örneği var: p05 1,182; p50 1,806; p95 3,298; p99 4,673 m². 00B `kapali-01` karşı örneğindeki 10,92 m² WC'nin alan bileşeni sıfıra iner; plan puanı **29,17/100**. Puan sentetik/gerçek bayrağına göre değiştirilmez. Ayrılmış **1.364 gerçek test planında ortanca 100, ortalama 93,577, p05 47,73**. Gerçek planların hepsi yüksek puan almıyor; kuyruk kapısı geçerli ama nadir planları da dışlayabilir. Bu, insan incelemesiyle ölçülmesi gereken seçim yanlılığıdır.

Yerel birim/gerileme testleri: **42/42 geçti**. Aynı sözleşme, gerçek kaynak ölçeği, belirsiz semantik, bozuk düğüm/açıklık, afin alan/graf korunumu, katı/yasak komşuluk eşlemesi, eski revizyon, geçersiz model işlemleri, üç referans, kaynak hash'i, ülke sınırı ve büyük WC karşı örneği kontrol edildi.

**8.719 gerçek program–plan çifti** ve bunlara bağlı **17.438 TR/EN aday konuşma** çıkarıldı. Bölmeler: eğitim 6.150 plan / 12.300 konuşma / 1.448 bina; doğrulama 1.205 / 2.410 / 293 bina; test 1.364 / 2.728 / 306 bina. Üretim `aura-plan-program/0.4-real` sistem istemini ve sıkı yanıt doğrulayıcısını kullanır. Bunlar insan onayı almış veya eğitime verilmiş kayıtlar değildir.

Yeniden üretme komutları [araç kılavuzunda](../../tools/ev-plan/real/README.md). Bu teslimde indirme, aşamalama, dönüşüm ve son ölçüm adımları ayrı çalıştırıldı; birleşik `real.pipeline` komutunun yürütüldüğü iddia edilmez. Kod ve veri hash'leri faz manifestlerinde tutulur. Büyük arşiv, SQLite ve toplu JSONL'ler depo dışında `C:/Users/User/Documents/Codex/datasets/ev-qwen-00d/` altında kaldı. Git'e yalnız seçilmiş inceleme kayıtları, küçük örnekler ve kanıtlar konur.

## İnceleme teslimi ve son denetim

- [60 örneği aç — okuma.html](veri/ev-plan-reel-00d/review/okuma.html): her örnekte kaynak / uyarlama yan yana, üç alternatif, iyi–zayıf–neden ve hash'e bağlı karar indirme.
- [İlk karşılaştırmanın ekran görüntüsü](veri/ev-plan-reel-00d/review/review-first-case.png), [masaüstü](veri/ev-plan-reel-00d/review/review-desktop.png), [mobil](veri/ev-plan-reel-00d/review/review-mobile.png).
- [Denetim](veri/ev-plan-reel-00d/audit.json), [kalibrasyon](veri/ev-plan-reel-00d/calibration.json), [kaynak dönüşüm manifesti](veri/ev-plan-reel-00d/conversion-manifest.json), [program manifesti](veri/ev-plan-reel-00d/pairs-manifest.json), [küçük TR/EN örneği](veri/ev-plan-reel-00d/program-sample.jsonl), [paket hash'leri](veri/ev-plan-reel-00d/package-manifest.json).

60 örnek **180 alternatif kaydı** içerir. Seçilen ilk alternatiflerin kaynak ve uyarlaması için 120 tam kayıt ile `ev.html` uyumlu 120 kat JSON'u vardır. 80 uygun aday istek denendi; 20'sinde üç yeterli eşleşme bulunamadı ve bunlar başarılı örnek sayılmadı. Bu seçilmiş incelemedeki oran serbest müşteri isteği başarısı değildir. İnceleme üretimi 453,5 saniye sürdü. Dokuz etiket grubunda örnek var; hepsi CH tek kat birimleridir. Bina bazında bölmeler arası çakışma ve kabul edilen net geometrilerde birebir tekrar **0**. Yakın tekrarların sıfır olduğu iddia edilmez.

60 kartın tamamı tarayıcıda çizildi. Üç alternatif, değişen seçenekte eski kararın temizlenmesi, inceleyen adı kapısı, doğru hash'lerle JSON indirme ve 390 px mobil taşma kontrolü geçti; JavaScript hatası yok. Ekran görüntüleri gerçek üretilmiş kayıtlardandır. Başlangıç `review.json` dosyası tamamen beklemede; **insan onayı 0**.

Mevcut `ev.html` içinde **120/120 kat JSON'u** oda sayısı ve maket sekmesinin açılması kontrolünden geçti; hata yok. Kaynak ve uyarlama katları fixture isteği yakalanarak yüklendi; `assets/` değiştirilmedi. İlk çok sayfalı test sonuç dosyasını tamamlayamadığı için başarı sayılmadı. Sonuç veren koşu tek sayfayı yeniden kullanır, dosya başına kanıt yazar ve kendi tarayıcısının kapanışını sınırlar. Bu test, kaynak poligonların yerine kullanılan uyumluluk eksenlerinin mimari olarak doğru olduğunun kanıtı değildir.

## Temsil ve doğrulama sınırı

Metre koordinatlar yerel orijine taşınıp 1.000 ile mm'ye çevriliyor. Kaynak net oda poligonları, fiziksel duvar/açıklık poligonları ve donatı ayrı geometri kaydında tutuluyor. `ROOM` etiketi `other/unknown`; yatak odası sayısı belirsizse programdaki değer `null`. WC ayrımı, kaynağın genel BATHROOM etiketindeki kaydedilmiş donatıdan çıkarılmışsa açıkça işaretleniyor. Bilinmeyen mutfak ve çekme mesafesi de doldurulmuyor.

**EV-01 v0.2 uyumluluk sınırı:** kaynak poligon duvarlar ile mevcut tek eksenli duvar şeması eşdeğer değildir. Oda `axis_boundary` alanları net sınırın işaretlenmiş uyumluluk kopyası, fiziksel duvar eksenleri döndürülmüş dikdörtgen yaklaşımıdır. Açıklıklar için kullanılan nominal destek çizgileri kaynak duvarı gibi gösterilmez. Kaynak poligon yan kaydı zorunlu ve belirleyicidir. Gerçek kaynağa eski sentetik ortak eksen-kapanış testi uygulandığı veya gerçek merkez çizgilerinin doğrulandığı iddia edilmez. SVG kaynak poligonlarından; mevcut `ev.html` ise uyumluluk izdüşümünden çizilir.

Kapı ilişkileri, kapı dikdörtgeninin iki normal yönündeki sınırlı ışınların ilk oda kesişimlerinden çıkarılır. Mesafeler ve çıkarım yöntemi saklanır. Açık geçit çıkarımları da ayrı işaretlenir. Belirsiz bağlantı, girişsiz veya erişim grafı kopuk kayıtlar karantinaya alınır. Bu retler kaynak planın bozuk olduğunun kanıtı değildir; içe alma/temsil sınırı da olabilir. Delikli poligonlar gibi v0.2'nin temsil edemediği kayıtlar onarılarak gerçekmiş gibi sunulmaz.

Taşıyıcılık, kapı açılımı, kat döşemesi ve bütün evin katlar arası bağlantısı doğrulanmadı. Kaynak tek kat birimidir; şemadaki `whole_home` proje niyetini belirtir, verinin bütün müstakil evi kapsadığı anlamına gelmez. Adres/konum/simülasyon tabloları arşivde bulunur ancak okunmaz veya dışa aktarılmaz; sadece geometri CSV'si tüketilir. Kaynak kimlikleri takma kimliğe dönüştürülür, kesin anonimlik iddiası yoktur.

## Kalite ve eşleştirme kararı

Dağılımlar yalnız eğitim binalarından hesaplanır. Oda alanı ve kısa kenar yaklaşımının yüzdelikleri, dolaşım oranı, oda sayısı–alan ilişkisi ve türler arası komşuluk sayıları saklanır. Ayrılmış test binaları bu eşikleri kurmak için kullanılmaz. En dar kullanılabilir geçit ile minimum döndürülmüş dikdörtgenin kısa kenarı aynı şey değildir; buradaki en ikinci yaklaşımdır.

Puan, en aykırı odanın %65 ve ortalama desteklenen kanıtın %35 ağırlığıyla birleşir. Böylece tek büyük WC diğer odaların ortalamasında kaybolmaz. p01–p99 aralığı ve dışındaki kuyruk azalışı veri yüzdeliklerine dayanır; ağırlıklar, en az 30 örnek ve 50 puan kabul kapısı öneridir. Puan bir mimari estetik, güvenlik veya mevzuat onayı değildir. Ülke/tip için kalibrasyon yoksa İsviçre eşikleri gizlice uygulanmaz.

Getirme, yalnız eğitim bölmesindeki gerçek planları oda türü/sayısı, alan, zorunlu/yasak bağlantı, mutfak ve dış biçimle karşılaştırır. Oda kimlikleri eşlenir; giriş ve cephe koşulları verilmişse korunur. Graf türü benzerliği sıralamaya katılır. Dış ölçü verilirse x/y, yalnız alan verilirse eş ölçek uyarlaması yapılır. ±%15 sınırı bir öneri kapısıdır; mevcut ölçülmüş yapıyı değiştirme yetkisi değildir. Sabit yapı kısıtları, müstakil/çok katlı istekler açıklama gerektirir. Üç yeterli referans yoksa eksik eşleşme döner.

İnceleme istekleri ayrılmış test binalarının programlarından gelir. Kaynağın gözlenmiş bağlantıları bu deneyde açıkça **yumuşak tercih** yapılır; giriş/cephe serbest bırakılır, alan hedefleri %2 artırılır. Tür/sayı, mutfak ve dış biçim koşulları korunur. Bu, bütün katı isteklerin çözülme başarısı veya rastgele müşteri komutlarında %100 başarı iddiası değildir. HTML her örnekte üç referansı gösterir; tam plan ve eski görüntüleyici JSON'ları ilk seçeneğe aittir. Seçenek kimlikleri ve hash'leri diğerlerini yeniden üretmeye yeterlidir. İnsan kararları boş başlar; otomatik arayüz testleri insan onayı sayılmaz.

## Qwen ve sonraki kapı

TR/EN kısa komutlar aynı v0.4 sistem istemi ve çıktı biçimiyle gerçek programlara bağlanır. Kısa tariften ayrıntılı kaynak grafı tekil olarak çıkarılamaz; hedef **olası bir referanstır**, tek doğru mimari cevap değildir. Veri insan onayı bekleyen adaydır; yalnız bu hedefe tam eşleşme dil modeli başarısı sayılmamalıdır.

F için iş emrindeki ikinci seçenek uygulandı: [CPU donanım ve maliyet raporu](EV-QWEN-00D-DONANIM.md). Bu tur model indirilmedi, CPU model ölçümü, LoRA veya ağırlık eğitimi yapılmadı. GPU ve ücretli API kullanılmadı; GPU kapısı kapalı. HouseDiffusion/Graph2Plan/MSD tabanlarının lisans ve kaynak kapıları raporda açık; hiçbirinin eğitimi başlatılmadı.

00C/01, canlı site entegrasyonu ve öğrenilmiş yerleşim bu teslim kapsamında başlamadı. `assets/` ve `tests/ai-eval/score.mjs` değiştirilmedi. Atıf gelecekteki proje çıktılarında da taşınmalı. İnsan incelemesi ve çok ülke/müstakil/çok katlı veri kapsamı açık kalıyor.
