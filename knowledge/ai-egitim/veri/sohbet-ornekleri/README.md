# Ev asistanı sohbet örnekleri (eğitim kaydı)

Her dosya, kullanıcının evini anlattığı ve asistanın planı çizip renk-zemin ile mobilyaları önerdiği bir sohbettir.

- `turns[]`: kullanıcı ve asistan sırası.
- Asistan turlarında `proposed_changes`: asistan sözleşmesindeki işlemler (`knowledge/ev-projesi/veri/asistan-sozlesme.json`):
  - `propose_space_update`, `propose_opening`, `propose_finish`;
  - `propose_item_placement`;
  - `request_studio_render`, `prepare_designer_handoff`.
- `result_plan`: sohbetin sonunda oluşan plan. `ev.html` bunu açar ("Sohbet örneği").
- `designer_summary_tr`: tasarımcıya giden Türkçe özet.

| Dosya | Durum | Üretici |
|---|---|---|
| `sohbet-001.json` | Simüle, gerçek müşteri değil; Brüksel 2+1 | `tools/ev-sohbet/sohbet-001.mjs` |

Yeni örnekler aynı biçimle eklenir. Avrupa dillerindeki örnekler EV-QWEN-00C ile çoğaltılacak.
