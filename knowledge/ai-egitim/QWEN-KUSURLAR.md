# Qwen kusur listesi

19 Ekim 2026. Kaynak iş emri: QWEN-YEREL-02. Açık kusurlar varken büyük eğitim kapalıdır.
Altyapı düzeltmesi, modelin aynı kusuru kapattığı anlamına gelmez.

| Kimlik | Kaynak / kusur | Durum | Düzeltme / kapanış kanıtı |
|---|---|---|---|
| Q02-001 | Pilot 01: istem değişince dış JSON nesnesi yerine dizi, 0/40 | Açık | Hazırlık doğrudan üretim PHP istemini okuyor; modelin yeni ölçümü ve dayanıklılık sınavı bekleniyor |
| Q02-002 | Pilot 01: sayısal örneği kopyalayan yanlış delta | Açık | Yeni tur ve kapalı test kanıtı yok |
| Q02-003 | Eski veri, değişmiş stüdyo kaynaklarına bağlı | Açık | Yeni kaynak parmak izi ve bayat işareti var; eski adaptör yeniden kullanılabilir sayılmıyor |
| Q02-004 | İç parametre adları doğal dil sayılıyor | Açık | Yeni havuzda gerçek TR/EN etiketli çekirdek ve ayrıca açıkça işaretli teknik örnekler var; çoğu parametrenin insan dilinde karşılığı eksik |
| Q02-005 | İnsan onaylı etiket ve estetik veri yok | Açık | 40 aday inceleme paketi; onay gelmeden reviewed yapılmaz |
| Q02-006 | Gerçek tarayıcı yolu yerine VM tekrarına dayanılıyordu | Açık | Yerel HTTP yanıtına yalnız test kancası ekleyen tarayıcı tekrarı hazır; bütün havuzda kanıt bekleniyor |
| Q02-007 | İş emri ≈24 GB GPU varsayıyor; bu makinede GPU yok | Engelli | Karar sahibi doğruladı: GPU yok, 36 GB RAM var. Iris Xe görüntü bağdaştırıcısı CUDA eğitim GPU'su değildir. Yerel model eğitimi başlamadı; kiralık GPU kullanılmayacak |
| Q02-008 | Aynı kapalı sınav / dayanıklılık / TR / netleştirme / ret / gerileme ölçümü yok | Açık | Aday havuzu sınav değildir; insan denetimli sürümlü sınav dondurulmalı, önceki turlar aynı sınavda yeniden ölçülmeli |
| Q02-009 | Canlı ai.js interpret yalnız actions döndürüyor; model reply'sı netleştirme sorusu olarak gösterilmiyor | Açık | assets değişikliği gerektirir; bu eğitim PR'ında değiştirilmedi. Ayrı kapsamlı stüdyo PR'ı gerekir |
| Q02-010 | Yeni araç vocabulary dışında kalırsa otomatik eğitim kapsamı dışında kalabilir | Açık | Parametre/enum/style/kind/material sözlükten çoğalır; yeni eylem türleri için sözleşme ve örnek yazarı ayrıca genişletilmeli |

Henüz yeni model turu tamamlanmadı; hiçbir model kusuru kapalı işaretlenmedi.
