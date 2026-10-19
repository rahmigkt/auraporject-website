# Main ve eskiz dalı · gerçek test koşuları

Main: `bc12e98302fa9998ac45ee5719c59fa2792782c8`. Eskiz kodu: `2bfffc48913390aefa58ed6b2caffcef1094ba68`. Her iki ağaç aynı makinede ayrı klasörlerden çalıştırıldı. Test raporu test başına çıkış kodunu, süreyi ve çıktıyı içerir.

## Main’de zaten başarısız olanlar

| Test | Main | #58 | Neden |
|---|---|---|---|
| assistant-contract-check.mjs | FAIL | FAIL | `../../services/design/` altında eksik modül; `ERR_MODULE_NOT_FOUND` |
| codesign-check.mjs | FAIL | FAIL | `../../services/design/` altında eksik modül; `ERR_MODULE_NOT_FOUND` |
| studio-agent-check.mjs | FAIL | FAIL | `../../services/design/` altında eksik modül; `ERR_MODULE_NOT_FOUND` |

## Her iki ağaçta geçenler

| Kontrol | Main | #58 |
|---|---|---|
| ai-workspace-check.mjs | PASS | PASS |
| brief-pdf-check.mjs | PASS | PASS |
| camera-framing-check.mjs | PASS | PASS |
| catalogue-check.mjs | PASS | PASS |
| catalogue-graph-check.mjs | PASS | PASS |
| choice-flow-check.mjs | PASS | PASS |
| forma-check.mjs | PASS | PASS |
| kitchen-studies-check.mjs | PASS | PASS |
| model-check.mjs | PASS | PASS |
| panel-engine-check.mjs | PASS | PASS |
| preference-evidence-check.mjs | PASS | PASS |
| reference-studies-check.mjs | PASS | PASS |
| ritmo-check.mjs | PASS | PASS |
| room-family-check.mjs | PASS | PASS |
| sectional-check.mjs | PASS | PASS |
| space-check.mjs | PASS | PASS |
| studio-tools-check.mjs | PASS | PASS |
| table-geometry.mjs | PASS | PASS |
| upholstery-engine-check.mjs | PASS | PASS |

## Bu dalın eklediği kontrol

`sketch-check.mjs`: main’de yok, #58’de PASS. `table-geometry.mjs` bir yardımcı modüldür; doğrudan Node çıkış kodu da iki tarafta 0, fakat ayrı kabul testi sayılmaz.

**Yeni başarısızlık: 0.** Üç bilinen arşiv hatası hem main’de hem dalda aynı import aşamasında oluşur. Mevcut testlerin hiçbiri PASS’tan FAIL’e dönmedi. Bu otomatik sonuç estetik onay değildir; karar sahibi 12 gerçek önce/sonra görüntüsünü inceleyip onaylayana kadar PR birleştirilmez.

[Ham koşu sonuçları](test-comparison.json) · [Görsel karşılaştırma](README.md)
