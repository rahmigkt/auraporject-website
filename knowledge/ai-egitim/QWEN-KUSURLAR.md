# QWEN kusurları — EV-QWEN-00

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
