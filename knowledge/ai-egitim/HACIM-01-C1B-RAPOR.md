# H1 — C1b düzeltmesi (#187)

21 Ekim 2026. Main `128dd93` (#194–201) okunup dala alındı. Öncelik C1b → C8 → H4 → C7 → H5; C2/H2/H3 sonraya bırakılmıştır. Bu teslim C1b'dir. Eğitim/GPU/ücretli API/dağıtım/merge yapılmadı.

## İçerik değişikliği

Önceki teslim `6b1464d` ile karşılaştırma: **42 kullanıcı cümlesi**, **1.530 asistan yanıtı** değişti. **1.800 başlangıç durumu, işlem dizisi, hedef gözlemi ve motor kanıtı bire bir aynı.** Kanıt: `veri/hacim-1-istek/C1b-degisiklik-kaniti.json`; üretici denetimi `tools/hacim-istek/c1b-audit.mjs`.

- EN/FR/ES/IT'de onar çoklu istek baştan yazıldı. “For the furniture” türü kategori bağlacı yok; mobilya ve tekstil tercihi aynı odayı anlatan doğal cümlede birleşir. Yalnız tekstil içeren çiftler de ayrı cümlelerle yazıldı.
- Danca iki istek kendi anlamı korunarak yeniden yazıldı. Bunlar çoklu istek değildi: biri yatak odasını yeniden düzenleme sorusu, diğeri satın alma talebidir.
- Genel “In the preview / For your room” ön ekleri kaldırıldı. İşlemli yanıtlar artık eşya, yön, renk, ölçü ya da gönderim talebiyle başlayan tam cümlelerdir. Çoklu hedefte iki doğrudan sonuç cümlesi kullanılır.
- Perde/halı seçimi kullanıcı kararı gereği korunur. Yeni üretim bu satırları silmez veya mobilya detay hedefine çevirmez.

Örnek: “I want a short pile rug, and for the furniture choose sage green for the living room’s heavier curtains.” yerine “I would like sage green drapes and a short pile rug in our living room so we can see both choices together.” Aynı iki tekstil işlemi korunur.

## Sayımların anlamı

9 dil × 200 = **1.800** aday. Her dilde 120 tek işlem, 50 çoklu, 20 netleştirme, 10 kapsam dışı istek; Körfez ağzı kullanıcı satırı 40. Kullanıcı kalıbı dil başına **200**; sayı/değişken/noktalama/aksan normalizasyonuyla ölçülür. Bağımsız gerçek müşteri niyeti iddiası yoktur.

Önceki “190 yanıt kalıbı” ölçümü genel ön ek değişimlerini de sayıyordu. C1b'de bu yüzey çoğaltması kaldırıldı: dil başına **54 içeriğe özgü yanıt ailesi**, aynı tam yanıt ailesi en fazla **5** kez kullanılır. Bu, yanıt içeriğinin kaybolması değil, aynı sonuca genel ön ek ekleyerek çeşitlilik iddia edilmesinin bırakılmasıdır. 150 kalıp gereği kullanıcı metinlerinde korunur.

Açılış, ilk beş normalize sözcükle ayrıca ölçülür: EN'de en yüksek tekrar 32'den, DE/FR/NL/DA/ES/IT'de 34'ten **10**'a iner. TR ve AR'de de genel ön ekler kaldırılmıştır; bütün dillerde üst sınır 10'dur. Yanıtların ilk sözcüğünü tek başına çeşitlilik kanıtı saymıyoruz. Ana dil onayı iddia edilmez.

Her dilde kısıtlı çoklu istek **40/50 (%80)**, toplam kısıtlı satır **80/200 (%40)**; `bakar/yakin/uzak` korunur. Yeni uzak oda poligonu, yasaklı iç terim ve incelenen yapay bağlaç eşleşmesi 0. Sayımlar: `C1-kalite-raporu.json`.

## Güncel main ve mekanik kanıtlar

1.800 hedef güncel motorla yeniden üretildi: kabul 1.800, ret/uyarı/hedef farkı 0. Sözcüksel sınav dışlama eşikleri değiştirilmedi; eşleşme 0. Ortak şema/digest'ler ve inceleme sayfası yeniden üretildi. Tüm kayıtlar Claude yeniden denetimi bekler; önceki `duzelt` kararı korunur. Kendi kendine veya koşullu nottan otomatik onay verilmez. H1 eğitime uygun satırı 0.

Main #197, dolap hücrelerine `lv: 0` (otomatik kapak sayısı) varsayılanını ekler. Donmuş sınavın 120 görev baytı ve puanlayıcısı aynı tutuldu. Eski motorla karşılaştırmada 79 olumlu durum aynı, 11'inde tarihsel yerleşim farkı, 10'unda yalnız eksik `lv` alanına sıfır eklenmesi vardır. 100 olumlu hedef yine tam makine puanı alır. Yeni politika yalnız **eksik → 0** alan eklenmesini kabul eder; mevcut/değişmiş kapak seçimini veya başka bir alanı kabul etmez. Ayrı negatif testleri vardır. Bu H5 kapsam değişikliği veya model koşusu değildir.

Eski 12 Arapça sohbetin motor kaynak zinciri yenilenir, iki üretim aynı baytları verir; diyaloglar değişmez. Birleşik korpusun bölmeleri ve ilgisiz satırları korunur. Bu mekanik işlem C2'yi kapatmaz.

Önceki C1 raporu/test sonucu tarihsel kanıttır. Güncel C1b test kapsamı `veri/hacim-1-istek/test-ozeti.json` içindedir. Görsel tarayıcı veya ana dil QA iddia edilmez. Uygulama/motor dosyaları main'den gelir; bu düzeltme `assets/`, `api/`, kök HTML dosyalarını değiştirmez.
