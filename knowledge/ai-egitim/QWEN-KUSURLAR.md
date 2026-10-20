# QWEN kusurları — EV-QWEN-00

## EV-QWEN-00B — 20 Ekim 2026 ek denetim

Önceki kusurlar kendiliğinden kapanmadı. Bu tur kısmi prototiptir; eğitim ve
kiralık GPU kapısı kapalı. Kanıt: `EV-QWEN-00B-RAPOR.md`.

| Kimlik | Durum | Kanıt / kapanış koşulu |
|---|---|---|
| EV00B-001 — aynı programda mimari çeşitlilik | Açık | 60 planda toplam 20 gerçekleşmiş graf sınıfı; tip başına 2–6. Ek oda sayısı çeşitliliği de sayıyı artırıyor. Aynı programda onlarca kurgu kanıtlanmadı. |
| EV00B-002 — genel çözücü kapsamı | Açık | U/gerçek avlu, şaftlı derin plan, tek/çift sağır cephe, farklı yönler, tek kol/L/galeri merdiven, ölçülmüş sabitler ve ızgara henüz yok. Desteklenmeyen açık kısıtlar reddedilir; bazı katalog tip isimleri yalnız araştırma yer tutucusudur. |
| EV00B-003 — program alan uyumu | Açık | Son dilim büyümesi, geniş banyo/WC ve yardımcı alanlar; sapmalar ölçülüyor. Hedef dışı planlar eğitim için kabul edilmez. |
| EV00B-004 — mimari ilişkiler | Açık | Ebeveyn banyosu, mutfak-kiler/balkon, sundurma/rüzgârlık/bahçe kapısı, bodrum/çatı kuralları genel olarak sağlanmış değil. |
| EV00B-005 — insan ve altın test | Açık | 60 yeni taslak bekliyor. Hash bağlı karar ithali var; insan onayı 0, altın set boş. |
| EV00B-006 — doğal dil | Açık | 1500 üretim isteği 60 programın bileşimsel ihtiyaç listesi çeşitleri; gerçek serbest diyalog yeterliği değil. 120 düzenlemenin tüm yeniden yerleşimleri topluca doğrulanmadı. |
| EV00B-007 — tamamlanmış model tabanı | Açık | Küçük Qwen CPU denemesinde 65,454 saniyede 3 süre aşımı, tamamlanan yanıt 0. Ham istek ve süre kayıtları PR'da; başarı oranı çıkarılamaz. |
| EV00B-008 — kalite ölçülerinin kapsamı | Açık | Ortak öneri puanı 100 olabilen planlarda bile tipoloji/alan kusurları var. Gerçek şaft, kapı süpürmesi, kolon/ürün yerleşimi ve gün ışığı simülasyonu gerekli. |
| EV00B-F1 — koordinat hedefinden program hedefine geçiş | Prototipte uygulandı | Ortak 0.3 istem/şema; sürüm denetimli düzenleme ve gerçek mutfak açıklığı testleri geçti. Model başarısı/üretim onayı değildir. |
| EV00B-F2 — bölümler arası graf tekrarı | Bu veri üretiminde önlendi | İd/ölçüden bağımsız tam tür etiketli izomorfizm grupları ve türevleri birlikte bölündü. Yeni turda yeniden kontrol edilir. |

---

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
