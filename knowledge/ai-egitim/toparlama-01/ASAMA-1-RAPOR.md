# TOPARLAMA-01 · Aşama 1: depo hijyeni

Başlangıç `a8c0106`; dal `toparlama-1-hijyen`. Eğitim, GPU, ücretli API ve canlı dağıtım yapılmadı. assets/, api/, kök HTML ve .htaccess değiştirilmedi.

## Yapılanlar

- Eski 00B, 00C ve #69 dalları ile main'in 24 çakışma sürümü ve üç eski rehber arşivlendi; 27 dosyanın SHA-256 manifesti var. Kaybolan bilgi yok; arşiv durumları `superseded`.
- Gerçek 0.4 program şeması ana sözleşme kaldı. 0.3 şeması ve ölçüm/istem modülleri `legacy_v03` olarak ayrıldı; sürüm denetimli uyumluluk sayesinde eski 19 test ve gerçek planın 23 testi birlikte geçiyor. 00B ölçümü gerçek kalibrasyonun yerine geçmez. solver/__init__.py iki dalda yalnız açıklama taşıyor; eski açıklamalar arşivde korundu, ana açıklama gerçek kaynak yolunu belirtir.
- QWEN-KUSURLAR'a kayıp 00B ve QWEN-YEREL-02 kusur geçmişleri eklendi. Hiçbir eski insan onayı yeni bir model sonucuna dönüştürülmedi.
- `.gitattributes` ve `.gitignore` kuralları toplandı; 00C ve pilot kanıtlarının byte koruması eklendi. Hafif pilot kurtarma dosyaları tam byte ile tutulur.
- #69'dan 45 JSON/JSONL/HTML dosyası `qwen-pilot-01/` altına alındı; RECOVERY.json her kaynak yolunu, commit'i, byte sayısını ve hash'i içeriyor. Ağırlık/anahtar dosyası alınmadı. Eski ham bayat işaretler ve insan onayları tarihsel kanıttır. #69 commit'inin çalışma kopyasındaki çıktıları silinmedi; main'e yeni outputs dosyası eklenmedi.
- README tek sayfalık rehbere, iş ve ülke sırası gerçek main durumuna çevrildi. Arap grubu DK önüne geldi; mevcut DK/ES/IT teslimleri de yok sayılmadı.
- #132'nin test fikirleri değerlendirildi; mevcut çözücüye karşı dört davranış kontrolü eklendi. İkinci yerleşim çözücüsü alınmadı. [Ayrıntılar](PR132-DEGERLENDIRME.md).
- `node tests/hepsi.mjs`: kök testler, sınav ve metin kontrolleri, Python plan/sohbet/perde mutasyon testleri ve beş sohbet kümesinin gerçek çözücü tekrarını tek komutta çalıştırır. Hata/süre aşımı sıfır olmayan çıkıştır. Görsel yakalama ve veri üretim/scoring yardımcıları ayrıca `not_run` listesine alınır; model/GPU başlatılmaz.
- Atölye testinin argümansız hali önceden hiçbir denetim çalıştırmıyordu. Artık 238 bellek içi örnek üzerinde 210 düzenleme ve 28 ret sınanır; dosyaya eğitim verisi üretmez. İsteğe bağlı dışa aktarım da outputs yerine work kullanır.

## Doğrulama ve gerçek sonuçlar

PowerShell: `$env:AURA_PYTHON='<Python yolu>'; $env:PYTHONPATH='<ev-plan-deps>'; $env:AURA_TEST_TIMEOUT_MS='60000'; node tests/hepsi.mjs`.

52 işlik taramada **46 geçti, 5 başarısız, 1 süre aşımı**. Bütün sonuç/çıkış/süre/çıktılar [test-results.json](test-results.json) içinde. Bu tur yeşil değildir. İlk taramada Atölye kontrolü argümansız no-op olduğu için ardından düzeltildi ve `node tests/qwen-atolye-data.mjs` tekrar çalıştırıldı: **238 bellek içi test geçti**. Sonradan eklenen `python tests/toparlama-hijyen-check.py` de geçti: **27 arşiv + 45 pilot byte hash'i**. Bu iki ayrı tekrar ilk 52 işin sayısına eklenmedi.

Ek komutlar: `python tools/ev-plan/test_v2.py` → 19/19; `python tools/ev-plan/test_real.py` → 23/23. Beş `verify02.mjs` kümesi geçti. `git diff --check` ve `node --check tests/hepsi.mjs` geçti. Python bağımlılıkları `tools/ev-plan/requirements.txt` ve `tools/ev-sohbet/requirements-02.txt` içinde; makineye model kurulmadı.

## Açık kusurlar

| Kimlik | Kontrol / sonuç | Neden ve sonraki iş |
|---|---|---|
| TOP01-001 | assistant-contract, codesign, studio-agent: FAIL | Testler depo dışındaki `../../services/design/` modüllerini bekliyor; modüller bu depoda yok. Önceki #58 test raporunda aynı eksik kayıtlı. Sahte servis veya skip eklenmedi. Ayrı servis sahipliği/entegrasyon kararı gerekir. |
| TOP01-002 | qwen-studio-data: FAIL | Kurtarılan tarihsel pilot tasarımı bugünkü normalizasyonda yeni gövde alanları alıyor; eski hedef ile birebir tekrar uyuşmuyor. Veriyi sessizce değiştirmek tarihsel kanıtı bozardı. Katalogda bayat/superseded; güncel motorla yeni sürüm gerekir. |
| TOP01-003 | text-eval/verify-stage1: FAIL | Eski M01 tasarımı güncel ek alanlar nedeniyle noncanonical. Metin denemelerini veya stüdyo kodunu bu hijyen turunda değiştirmedik; ayrı yeniden temellendirme/inceleme gerekli. |
| TOP01-004 | forma-check: TIMEOUT | Bu tur 60 saniye sınırı doldu; işlevsel başarısızlık veya geçti iddiası yok. Varsayılan toplu komut 180 saniye tanır; bu makinede uzun tam geometri turu ayrıca gerekli. |
| TOP01-005 | Tam yeşil kabul | Yukarıdaki nedenlerle sağlanmadı. İş emrinin “düzelt veya nedenle raporla; takılırsan sonraki aşamaya geç” hükmüyle katalog aşaması ilerleyebilir; engel kaybolmaz. |

Sohbet verisinin/inceleme kararlarının kapsamı büyütülmedi. Hatalı/bayat örnekler ileride birleşik train dosyasına otomatik alınmamalı. Bir sonraki aşama katalogdur; bu rapor diğer yedi aşamanın tamamlandığını iddia etmez.
