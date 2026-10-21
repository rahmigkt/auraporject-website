# HACİM-01 H1 — doğrulama

Başlangıç main: `a724690`. Doğrulanan dal: `hacim-1-komut`; kaynak dosyaları commit `bbd8ccb` içinde. Tarih: 21 Ekim 2026.

`node tests/hepsi.mjs`: **67/67 geçti**, çıkış 0. Son ham koşu yerelde `work/hacim-1-tests-verified/results.json` içinde; aşağıdaki tablo bu dosyadan çıkarılmıştır. Model çalıştırma/eğitim/dağıtım yok.

| Kontrol | Sonuç | Süre (ms) |
|---|---:|---:|
| `tests/ai-workspace-check.mjs` | geçti | 91 |
| `tests/assistant-contract-check.mjs` | geçti | 88 |
| `tests/brief-pdf-check.mjs` | geçti | 89 |
| `tests/camera-framing-check.mjs` | geçti | 75 |
| `tests/catalogue-check.mjs` | geçti | 99 |
| `tests/catalogue-graph-check.mjs` | geçti | 321 |
| `tests/choice-flow-check.mjs` | geçti | 200 |
| `tests/codesign-check.mjs` | geçti | 187 |
| `tests/csg-check.mjs` | geçti | 294 |
| `tests/ev-arap-olculu-check.mjs` | geçti | 7971 |
| `tests/ev-arap-olculu-geometry-check.py` | geçti | 2321 |
| `tests/forma-check.mjs` | geçti | 96090 |
| `tests/hacim-komut-check.mjs` | geçti | 8121 |
| `tests/hacim-komut-schema-check.py` | geçti | 1992 |
| `tests/kitchen-studies-check.mjs` | geçti | 131 |
| `tests/model-check.mjs` | geçti | 104 |
| `tests/panel-engine-check.mjs` | geçti | 210 |
| `tests/preference-evidence-check.mjs` | geçti | 101 |
| `tests/qwen-atolye-data.mjs` | geçti | 1614 |
| `tests/qwen-current-contract-check.mjs` | geçti | 375 |
| `tests/qwen-geometry-data-check.py` | geçti | 823 |
| `tests/qwen-large-gate-check.py` | geçti | 75 |
| `tests/qwen-local-check.mjs` | geçti | 14367 |
| `tests/qwen-response-loss-check.py` | geçti | 105 |
| `tests/qwen-studio-data-check.mjs` | geçti | 576 |
| `tests/qwen-training-plan-check.py` | geçti | 996 |
| `tests/reference-studies-check.mjs` | geçti | 706 |
| `tests/ritmo-check.mjs` | geçti | 734 |
| `tests/room-family-check.mjs` | geçti | 110 |
| `tests/sectional-check.mjs` | geçti | 235 |
| `tests/sketch-check.mjs` | geçti | 4488 |
| `tests/space-check.mjs` | geçti | 96 |
| `tests/studio-agent-check.mjs` | geçti | 94 |
| `tests/studio-tools-check.mjs` | geçti | 111 |
| `tests/table-geometry.mjs` | geçti | 152 |
| `tests/toparlama-arap-check.py` | geçti | 132 |
| `tests/toparlama-bicim-check.py` | geçti | 1813 |
| `tests/toparlama-hijyen-check.py` | geçti | 119 |
| `tests/toparlama-katalog-check.py` | geçti | 2657 |
| `tests/toparlama-sinav-check.mjs` | geçti | 28909 |
| `tests/toparlama-sinav-prompt-check.mjs` | geçti | 465 |
| `tests/toparlama-split-ledger-check.py` | geçti | 104 |
| `tests/toparlama-studio-replay-check.mjs` | geçti | 577 |
| `tests/toparlama-uslup-check.py` | geçti | 1535 |
| `tests/upholstery-engine-check.mjs` | geçti | 257 |
| `tests/yerlesim-adversarial-check.mjs` | geçti | 144 |
| `tests/ai-eval/test-01b.mjs` | geçti | 126 |
| `tests/ai-eval/test-uzman-onay.mjs` | geçti | 104 |
| `tests/ai-eval/verify-01b.mjs` | geçti | 110 |
| `tests/text-eval/verify-stage1.mjs` | geçti | 336 |
| `tools/ev-plan/test_eu.py` | geçti | 776 |
| `tools/ev-plan/test_pipeline.py` | geçti | 3271 |
| `tools/ev-plan/test_real.py` | geçti | 1002 |
| `tools/ev-plan/test_v2.py` | geçti | 741 |
| `tools/ev-sohbet/test02.py` | geçti | 1451 |
| `tools/ev-sohbet/test_dk.py` | geçti | 5038 |
| `tools/ev-sohbet/test_es.py` | geçti | 3658 |
| `tools/ev-sohbet/test_it.py` | geçti | 7426 |
| `tools/ev-sohbet/test_uk_ie.py` | geçti | 8621 |
| `tools/perde/test_hesap.py` | geçti | 306 |
| `replay-02` | geçti | 3884 |
| `replay-uk-ie` | geçti | 2020 |
| `replay-dk` | geçti | 957 |
| `replay-es` | geçti | 937 |
| `replay-it` | geçti | 907 |
| `tools/studyo-motoru/test.mjs` | geçti | 2421 |
| `tools/ev-sohbet/uslup_denetim.py` | geçti | 367 |

H1: 1.800 gerçek motor tekrarı, sıfır hedef farkı/uyarı/ret. Dokuz dilde 200 kayıt, her dilde 120/50/20/10 dağılımı; 40 Körfez kullanıcı satırı. Yakın metin ve diller arası eşit tam hedef eşleşmesi 0. Geçersiz parametre, sınırlanan değer, geçersiz malzeme, sınav kopyası ve farklı dilde hedef kopyası negatif testleri geçti.

Playwright/Chrome: 1440 px ve 390 px; dokuz dil filtresi, Arapça RTL, boş işlem hedefleri, 55 SVG/seviye kartı; taşma ve sayfa hatası 0. Makine sayım kanıtı [gorsel-denetim.json](veri/hacim-1-komut/gorsel-denetim.json).

Başlangıç main ile karşılaştırmada `assets/`, `api/`, kök HTML, `.htaccess`, iki puanlayıcı ve kapalı sınavın görev baytları değişmedi. Kaynak manifesti revalidasyonu ve mevcut yerleşim kayıtlarının yenilenmesi [ana raporda](HACIM-01-H1-RAPOR.md). Bütün yeni adaylar karantinada; insan/ana dil onayı yok, eğitim dışa aktarımları boş. Paralel main değişiklikleri birleştirmeden önce ayrı kaynak revalidasyonu gerektirir.
