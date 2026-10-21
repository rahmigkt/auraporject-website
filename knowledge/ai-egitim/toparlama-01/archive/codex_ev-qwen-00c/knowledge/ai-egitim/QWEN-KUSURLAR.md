# QWEN kusurları — EV-QWEN-00

## EV-QWEN-00C güncellemesi — 20 Ekim 2026

| Kimlik | Durum | Kanıt / kalan koşul |
|---|---|---|
| EV00C-001 — ülke ve kaynak karışması | Prototipte ayrıldı | 11 hedef ülke / 66 tip kartı; geometri kaynağı CH kalır, hedef etiket ayrı. Yerel tip özellikleri ve tam ev geometrisi doğrulanmadı. |
| EV00C-002 — referansı olmayan yeni evler | Kullanıcı kararıyla netleştirmeye bırakıldı | Sıra ev, bodrum/çatı, çok katlı ve özel geometri uydurulmaz; ölçülü plan ve tasarımcı istenir. Kaynak kapsamı genişlemiş sayılmaz. |
| EV00C-003 — kural kapsamı | Kısmen araştırıldı; açık | Bölge/kullanım/alan tanımı ve sürüm koşulları, bilinmeyene `unknown`. IE/IT genel eşikleri, yerel geçerlilik, erişilebilirlik ve mühendislik uzman teyidi bekliyor. |
| EV00C-004 — dil ve veri sızıntısı | Aday veri denetlendi; insan incelemesi açık | 8×300 bileşimli metin; bina/imza çakışması ve ayrılmış tip sızıntısı 0. Doğal müşteri dili, ana dil ve şablondan bağımsız genelleme kanıtı değil. |
| EV00C-005 — yeni görsel onay | Açık | 52 örnek / 156 alternatif kullanıcı incelemesi bekler; otomatik test onay sayılmaz. |
| EV00C-006 — gerçek CPU model tabanı | Ölçüldü; başarısızlık açık | Qwen2.5 0.5B: 0/16 katı biçim, 0/8 programdan geometri. 6 kesilmiş JSON, 10 şema hatası. Qwen3.5 9B sonucu değildir. |
| EV00C-007 — SVG tarayıcı gösterimi | Yerel testte düzeltildi | XML öneki kaldırıldı; namespace regresyon testi, masaüstü/390 px ve alternatif/hash dışa aktarım testleri. |
| EV00C-008 — eğitim/GPU | Kapı kapalı | Ağırlık güncellemesi, kiralık GPU veya ücretli API yok. Ücretsiz küçük model yerel CPU tabanı için indirildi. |

00D'nin **EV00D-007** kaydındaki 60 örneklik görsel inceleme, kullanıcının toplu
onayıyla bu kapsamda kapandı: `veri/ev-plan-eu-00c/00d-kullanici-onayi.json`.
Her alternatif tek tek seçilmedi; bütün korpusun eğitim veya mühendislik onayı değildir.
00D tablosu aşağıda tarihsel kayıt olarak korunur. Güncel sonuçlar
[EV-QWEN-00C-RAPOR.md](EV-QWEN-00C-RAPOR.md) içindedir. Main PR122'de viewer
dosya açma desteği geldi; eski EV00-006'nın dosya açma eksikliği bu yönden eskidi.
Gerçek kat bağlantısı/merdiven kapsamı hâlâ açıktır.

## EV-QWEN-00D güncellemesi — 20 Ekim 2026

00B'nin sentetik yerleşim yolu güncel veri kaynağı değildir. Gerçek veri tesliminin
ölçümleri [EV-QWEN-00D-RAPOR.md](EV-QWEN-00D-RAPOR.md) dosyasındadır.

| Kimlik | Durum | Kanıt / kalan koşul |
|---|---|---|
| EV00D-001 — lisans ve kaynak ayrımı | Uygulandı | 20 kaynak envanteri; Swiss CC BY 4.0 yayıncı doğrulaması ve hash; NC/belirsiz veri alınmadı; VERI-ATIF.md. |
| EV00D-002 — oda işlevi uydurma | Yerel testte düzeltildi | Kaynak ROOM → other/unknown, doğrulanmamış yatak sayısı/mutfak/çekme mesafesi null; sözleşme ve testler aynı sınırı koruyor. |
| EV00D-003 — büyük WC'ye yüksek puan | Yerel karşı örnekte düzeltildi | Eğitim binalarından gerçek dağılım ve en aykırı oda ağırlığı; 00B 10,92 m² WC örneği 29,17/100, WC alan bileşeni 0. Aynı planın sentetik bayrağını değiştirmek puanı etkilemiyor. Mimari kalite onayı değildir. |
| EV00D-004 — gerçek referans ve veri sızıntısı | Bu korpusta denetlendi | 8.719 gerçek benzersiz plan; bina bazında bölme çakışması 0, birebir net geometri tekrarı 0. 60 örnek / 180 alternatif yalnız eğitim binalarından getirildi; istekler ayrılmış test binalarından. Yakın tekrar temizliği ve başka korpuslar için genelleme açık. |
| EV00D-005 — gerçek ortak duvar eksenleri | Açık | EV v0.2 alanları açıkça işaretlenmiş uyumluluk izdüşümüdür; kaynak poligonlar zorunlu yan kayıtta korunuyor. Ölçülmüş eksen ve ortak kapanma kanıtı yok. |
| EV00D-006 — ülke/ev/kat kapsamı | Açık | Kanonik kaynak yalnız CH tek kat konut birimi; tüm Avrupa, müstakil ve çok katlı ev verisi doğrulanmadı. Araç bu istekleri netleştirmeye bırakır. |
| EV00D-007 — insan onayı | Açık | İnceleme sayfası karar sahibini bekler. Otomatik SVG/viewer testi, yüksek istatistik puanı ve kaynak verinin gerçek olması mimari onay değildir. |
| EV00D-008 — doğal dil / model başarısı | Açık | Gerçek programlara bağlı TR/EN adaylar kısa, bileşimli tariflerdir. Serbest müşteri dili, belirsizlik/reddetme, model dayanıklılığı ve gerileme henüz ölçülmedi. F'nin kaynak/maliyet raporu seçeneği kullanıldı. |
| EV00D-009 — yapısal kullanılabilirlik | Açık | Kapı kanadı, taşıyıcı, döşeme, merdiven, tesisat ve gün ışığı mühendislik kontrolü yapılmadı. Afin uyarlama mevcut binaya uygulama izni değildir. |
| EV00D-010 — eğitim / GPU | Kapı kapalı | Bu tur ağırlık eğitimi, model indirme, kiralık GPU veya ücretli API yok. Önce insan kararı ve açık kusurlar, sonra ayrı eğitim kararı. |

## Önceki EV-QWEN-00 kaydı

Tarih: 2026-10-20. Bu liste bu iş emrindeki yeni ev planı prototipine aittir;
önceki farklı dallarda tutulmuş onay veya kusur kapanışlarını devralmaz.

| Kimlik | Durum | Kanıt / kapanış koşulu |
|---|---|---|
| EV00-001 — CPU Qwen tabanı | Açık | Yerel Qwen3.5:9b denemesi tamamlanmış sonuç raporu vermedi; istemci durduruldu. Aynı kapalı alt kümede tamamlanmış ham yanıtlar ve sürelerle ölçüm gerekli. |
| EV00-002 — büyük genel model | Açık | Ücretsiz mevcut büyük genel model erişimi yok; ücretli istek yapılmadı. Aynı testte bağımsız karşılaştırma henüz yok. |
| EV00-003 — insan onayı | Açık | 40 yeni örnek henüz onaylanmadı; estetik/işlevsel eğitim verisi sayılmaz. |
| EV00-004 — doğal dil kapsamı | Açık | Komutlar sentetik şablon ve varyasyon kimliği içeriyor; İngilizce komutlarda müşteri yanıtı dili ayrıca gözden geçirilmeli. Keyfî m², yön, cephe, korunacak duvar, serbest kullanıcı tarifi ve doğal düzenleme örnekleri ayrıca hazırlanıp onaylanmalı. |
| EV00-005 — kuralların güncelliği | Açık | Alan/en, merdiven ve gün ışığı profili araştırma önerisi; konsolide mevzuat ve yerel kapsam uzman kontrolü eksik. |
| EV00-006 — viewer entegrasyonu | Açık | ev.html sabit JSON fetch ediyor; dosya/kat seçici yok. Merdiven, döşeme boşluğu, parsel/bahçe/kolon gösterimi ve doğru ev tipi metni eklenmeli. assets bu görevde değiştirilmedi. |
| EV00-007 — gerçek kullanılabilirlik | Açık | Kapı kanadı süpürme çarpışması, merdiven baş mesafesinin katı geometri kanıtı, gerçek gün ışığı, tesisat ve taşıyıcılık çözülmedi. |
| EV00-008 — geometri çeşitliliği | Açık | 10 sınırlı prosedürel aile var; aynı tipte yardımcı oda/banyo boyutları mimari verimlilik için insan incelemesi ister. Ham kayıtlardaki tekrarlar denetimde görünür; SFT dönüştürücü aynı geometrinin dil/düzenleme türevlerini birlikte çıkarır. Daha geniş estetik çeşitlilik hâlâ gerekli. |
| EV00-009 — sağlamlık ve gerileme | Açık | 19 geometrik/araç testi mevcut; model istem varyasyonları, gerçek doğal Türkçe, ev planı öncesi stüdyo görevlerinde gerileme ve kapsamlı bozuk girdi fuzz testi tamamlanmadı. |
| EV00-010 — eğitim | Açık | Ağırlık güncellemesi veya LoRA yapılmadı. 36 GB RAM/GPU'suz ortamda bu teslim veri ve araç provasıdır. |
| EV00-F1 — L oda daralması | Yerel testte düzeltildi | Yetersiz oda çekirdeğini doğrulayıcı yakaladı; L/kırık aile derinliği artırıldı; aile/boyut testi geçti. İnsan yerleşim onayı değildir. |
| EV00-F2 — holsüz örnekte yetersiz cam | Yerel testte düzeltildi | Yaşam alanı dolaşım bölümüyle tek poligonda birleştirildi; gerekli cam alanı uygun birden fazla dış duvara dağıtılıyor. Gerçek gün ışığı sertifikası değildir. |

**Kiralık GPU kapısı: KAPALI.** QWEN-YEREL-02'deki kusur, insan onayı,
biçim/doğal dil/kapalı test ve gerileme koşulları sağlanmış değildir. Bu görevde GPU
veya ücretli API izni yoktur. Oracle geri oynatmanın başarısı bu kapıları açmaz.
