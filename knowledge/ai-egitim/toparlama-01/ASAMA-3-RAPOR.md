# TOPARLAMA-01 · Aşama 3: birleşik biçim ve muhafazakâr dönüşüm

Aşama 2 / PR #159 üzerine `toparlama-3-bicim`. Başvuru: `AURA-EGITIM-1.schema.json`; motor sözlüğü `ISLEM-SOZLUGU-1.json`; kod ve kullanım `tools/egitim-donustur/README.md`.

## Yapılanlar ve sayılar

Katalogda inceleme bekleyen 12 kümenin 11'inde mevcut **2.566** birincil kayıt ortak biçime çevrildi: 40 ev sohbeti, 2.400 00C, 9 00D program örneği, sohbet-001, 34 perde, 52 tarz, 30 metin denemesi. Eksik yerleşim/ProcTHOR kaynağında sayı 0 üretilen kayıttır; kaynak korpus büyüklüğü bilinmiyor. Superseded pilotlar ve donmuş sınavlar alınmadı. Karar kayıtları `sayim-raporu.json` içinde.

40 ev sohbetinin son kabul edilmiş oda talepleri, güncel **studyo-motoru/1** üzerinden denetlendi: 40 motor raporunda gecti=true; motor uyarısı/ret yok. Bu sonuç önceki 39 kaydın kaynak geometri istisnalarını kapatmaz; o kayıtlar ayrı uyarı taşır. Girdi planı + derlenmiş ürün ölçüsü kullanıldı; hedefte yerleşim koordinatı veya başka çözücü yok. Asistanın kısıtı varsa bunun dili/etiketi ayrıca onaylanmalı; mevcut kayıtlara yeni kısıt icat edilmedi. Kayıt bütün konuşmanın son talepleridir; tur bazında bütün plan değişikliklerinin yeniden oynatıldığı iddia edilmiyor.

230 kaynak/bina/imza bileşeni: **184 train, 23 dev, 23 test** (%80/%10/%10 grup). Satırlar 2.182/190/194; çok sayıda dil türevi aynı fiziksel kaynakla birlikte kaldığı için satır oranı farklı. Kaynak anahtarları üzerinde bölüm çakışması **0**, bütün 2.566 aday üzerinde kontrol edildi. Boş eğitim dosyalarının sıfır çakışması tek başına kanıt diye kullanılmadı.

## Eğitim dosyaları ve dürüst kabul sınırı

**Eğitime hazır kayıt: 0.** Bütün kayıtlar `adaylar.jsonl` içindedir; `train.jsonl`, `dev.jsonl`, `test.jsonl` sıfır byte'tır. Hiçbir insan/dil onayı çıkarılmadı. Bu dosyaları dolu göstermek için eski veya kusurlu kayıt kabul edilmedi. Yeni şemada bilinmeyen dil/ülke null olabilir, fakat gecti=true için dil, sıfır uyarı, sıfır iç terim ve hash'e bağlı insan/dil onayı gerekir; işlemi olan kayıtta motor kabulü de zorunludur.

## Doğrulama

`python tools/egitim-donustur/donustur.py` → 2.566 aday, 0 yeterli, 230 bileşen, kaynak sızıntısı [].

`python tests/toparlama-bicim-check.py` → **PASS 2566 schema-valid quarantined rows, 40 motor reports, empty exports, source/building split mutations, review-target hash binding**. Şemadan onaysız gecti=true geçirmek reddedildi; farklı kimlikli aynı bina zorla ayrılınca sızıntı yakalandı; inceleme sonrası mesaj değişince onay geçersizleşti. Testteki yapay onay yalnız bellek içi birim fikstürüdür; veri veya gerçek insan kararı değildir. `node --check tools/egitim-donustur/motor.mjs` ve `git diff --check` geçti. Katalog yeni şema/sözlük ve türev kanıt dosyalarıyla güncellendi: 35 küme / 1.002 yapılandırılmış dosya. Yeni türevler destek olarak tutuldu; birincil 2.566 aday yeniden sayılmadı. Katalog bütünlük/mutasyon testi de geçti.

## Açık kusurlar / yapılamayanlar

- 2.409 eski mimari program hedefi için güncel ev motoruna uygun kullanıcı niyetinden işlem etiketleri henüz yok. Programdan duvar koordinatı üretip doğru cevap diye sunulmadı.
- 34 perde tavsiyesinde ölçülü tekstil işlem hedefi; sohbet-001'de özgün işlem dizisi yok. 52 tarz örneğinde kaynak bazlı lisans; 30 metin denemesinde konuşma bağlamı eksik. Bu kayıtlar denetim uyarısıyla tutulur.
- İnsan/dil incelemesi bütün adaylarda açık. Ön taramada 11 kayıtta iç terim bulundu; çok dilli kapsamlı üslup taraması Aşama 4 işidir. Dil tutarlılığı ölçülmeden true yapılmadı.
- 40 son yerleşim isteği motorda kabul edilse de konuşmanın her turuna işlem hizalama, gerçek kaynak istisnaları ve tasarımcı kararı açık. Canlı asistanın birleşik cevap/istem bağlantısı assets sorumlusunun işi; bu veri biçimi tek başına onu tamamlamadı.
- Motorun kat/merdiven/oda birleştirme işlemleri henüz desteklenmiyor. Sözlükteki taslak adlar çalışan yetenekmiş gibi kabul edilmez.
- Aşama 1'deki kırık/bayat testler sürüyor. Toplu komutun yeşil kabulü hâlâ yok; bu PR için yalnız ilgili yeni şema/grup/motor kanıtları kullanıldı.

Eğitim, GPU, ücretli API ve site dağıtımı yapılmadı. Aşama 3'ün biçim ve karantina altyapısı hazırdır; dolu ve onaylı eğitim verisi teslim edilmiş değildir. Sonraki üslup/etiket/kaynak aşamaları bu açıkları kapatmadan eğitim yapılamaz.
