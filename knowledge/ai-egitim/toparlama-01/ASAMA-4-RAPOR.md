# TOPARLAMA-01 · Aşama 4: sohbet üslubu

Dal `toparlama-4-uslup`; bağımlılık Aşama 3 / PR #162. [Tek sayfalık eski/yeni okuma](../TOPARLAMA-4-inceleme.html). Beş özgün ülke inceleme HTML'i de yeni konuşmaları gösterecek şekilde yenilendi.

## Yapılanlar

Sekiz dilde 40 sohbetin 640 mesajı okundu/tarandı. 38 sohbette **178 mesaj** tek tek düzeltildi; İtalya'da zaten uygun olan iki sohbetin metni korunup denetlendi. Kullanıcı kendi evini anlatıyor; İsviçre veri kaynağı, genel oda etiketleri, çözücü ve ölçüm protokolü konuşmanın içinden çıkarıldı. Kaynak ve lisans metadata'da kaldı. Son karar tasarımcıda; belirsizlik kısa ve anlaşılır cümlelerle ifade edildi.

Düzeltmeler `tools/ev-sohbet/uslup-01-degisiklikler.json` içinde Codex tarafından ayrı ayrı yazılmıştır. Dış model/API çağrısı veya ortak konuşma şablonunu çoğaltma yapılmadı. 40 kaydın her birinde önceki ve yeni konuşmanın SHA-256'sı, değişmeyen gövdenin hash'i ve ana dil incelemesinin beklediği bilgisi `style_revision` içinde var. Eski 40 konuşma `archive/uslup-oncesi.json` içinde superseded olarak korunuyor.

**Plan, operations, layout_requests, layout_results, ürünler, kaynak istisnaları, insan onay durumu ve diğer bütün önceki alanlar değişmedi.** `dialogue` dışındaki gövde eski hash'le birebir eşleşiyor; yalnız yeni `style_revision` metadata'sı eklendi. Geometriyi bu işte tamir edilmiş gibi anlatmadık. Eksik iki kat kaynağı, yasal/erişilebilirlik sorunları ve mevcut istisnalar duruyor.

`uslup_denetim.py`: TR/EN/NL/FR/DE/DA/ES/IT/AR iç terim listesi, dil karışması için işaret sözcüğü sezgiseli, birebir asistan cümle tekrarı ve 60 kelime üstü cevap kontrolü. 40 sohbetin tamamında listelenen terim, uzun cevap, birebir tekrar ve sezgisel dil karışması uyarısı **0**. Bu, ana dil uzmanı onayı veya eksiksiz dil tanıma başarısı değildir; native_review beklemede tutuldu.

## Geri oynatma ve kanıtlar

- `python tests/toparlama-uslup-check.py` geçti: 40 gövde/önceki-yeni metin hash'i, dokuz dilde bozuk terim, dil karışması, tekrar ve uzunluk mutasyonları. Güncel kaynak karşılaştırma moduna bozuk yerleşim sonucu verildiğinde kontrolün reddettiği de sınandı.
- `node tools/ev-sohbet/verify02.mjs <küme> --compare-current` beş kümede geçti: **137 kayıtlı istek**, bunların **10 dürüst sığmıyor sonucu**, 40 kayıt. #156 çözücü hash'ini değiştirmişti; bu mod hash değişimini başarı diye saymak yerine **her kayıtlı sonuçla güncel cevabı birebir karşılaştırır**. Varsayılan katı hash kapısı korunur. Kanıt: `uslup-replay.json`.
- Beş Python mutasyon paketi son durumda **47/47** geçti: test02 14, UK/IE 8, DK 7, ES 8, IT 10. İlk denemede üç eski hash manifesti yeni metin nedeniyle hata verdi; geçmiş manifestler arşivlenip metin üstüne eklenen yeni hash kanıtıyla güncellendi, sonra testler yeniden geçti. İlk hata çıktıları silinmedi: `uslup-testler.json`.
- `uslup_kanit_yenile.py`: yeni metin üst katmanı tekrar uygulandı, **40/40 dosya byte-identical**. Bu, bütün eski geometri üreticisinin yeni motorda baştan çalıştırılması iddiası değildir. Eski üretim manifestlerinin beşi arşivde korunuyor; viewer/screenshot kanıtlarının tarihsel olduğu ayrıca yazıldı.
- Hijyen hash kontrolü geçti. 33 arşiv dosyası ve 45 hafif pilot kanıtı korunuyor. `node --check tests/hepsi.mjs`, HTML yapı kontrolleri ve `git diff --check` geçti.
- Toplu komut artık ortak motorun testini ve üslup denetimini de kapsıyor. Beş kaynak karşılaştırması aynı komuta bağlı. Bu turda değişmeyen bütün ağır testler yeniden çalıştırılmadı; Aşama 1'in raporlanmış başarısızlıkları kendiliğinden kapanmış sayılmadı.

## Yeniden üretim ve inceleme

`python tools/ev-sohbet/uslup_duzelt.py` → metin düzeltmeleri; `python tools/ev-sohbet/uslup_kanit_yenile.py` → byte/hash kanıtı; `python tools/ev-sohbet/uslup_denetim.py` → dil/üslup taraması; `python tools/ev-sohbet/uslup_inceleme.py` → tek okuma sayfası. Özgün geometri üreticileri çalıştırılırsa bu metin üst katmanı son adımda yeniden uygulanmalı; değişen geometriyi eski onaya bağlamamak için gövde hash uyuşmazlığında araç durur.

Birleşik adayların metin/kaynak hash'leri `tools/egitim-donustur/metin_yenile.py` ile yenilenir. Araç motor kaynak ağacının ve bütün geometri/işlem girdilerinin değişmediğini doğrulamadan önceki 40 motor kanıtını kullanmaz; yeni motor koşusu yaptığını iddia etmez. İnsan/dil onayı devralmaz ve yeterli eğitim satırı sayısını artırmaz. Kaynak veya işlem değişirse tam dönüştürme gerekir.

## Açık kusurlar / kalan iş

Ana dil ve tasarımcı incelemeleri bekliyor. Dil karışması taraması sezgiseldir. Tam kelime/parafraz kapsamı ve estetik kalite otomatik bir kelime listesiyle kanıtlanamaz. 39 kaynak geometri istisnası ve gerçek çok katlı kaynak eksikliği değişmedi. Tarihsel pilot/metin normalizasyonu ve depo dışı services/design test sorunları Aşama 1 raporunda açık. Genel test komutu hâlâ tamamen yeşil kabul edilmiş değil.

Aşama 5 Arap dünyası, Aşama 6 kapalı 120 görev, Aşama 7 ülke hacmi ve Aşama 8 eğitim hazırlığı bu teslimde yapılmış sayılmıyor. Arapça arayüze dokunulmadı. Eğitim/GPU/ücretli API ve canlı site dağıtımı yok; bu PR birleştirilmez.
