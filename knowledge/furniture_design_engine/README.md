# FDE — Furniture Design Engine · Bilgi Katmanı

**Mobilya tasarım beyni.** Mevcut canlı çizim modülünün üzerine takılan; mobilyayı parçalarına ayıran, her parçanın işlevini/malzemesini/stil katkısını bilen, tarz bilgisini yapılandırılmış kurallar olarak taşıyan ve "güzel ama üretilemez" tasarımları reddeden bilgi motoru.

> Bu paket **çizim motoru değildir.** Çizim motorun sende zaten var. Buradaki her şey onun çıktısını tüketir.

Sürüm 1.0.0 · 2026-10-16 · Self-check: `44 geçen · 1 uyarı · 0 hata`

---

## Neden bu paket var

Araştırma hükmü net: **istediğin altı katmanın hepsini tek pakette veren bir açık kaynak repo yok.**

| Katman | Açık kaynak durumu |
|---|---|
| Parça taksonomisi | PartNet / 3DCoMPaT200 / MontageNet → hepsi **araştırma lisanslı** (ShapeNet türevi = ticari kullanım yasak) |
| Görselden parça çözümleme | Grounded-SAM 2 (genel amaçlı), PartCrafter (araştırma kodu) → mobilya parça sözlüğü yok |
| Stil ontolojisi (gotik minimalizm vb.) | **Hiçbir şey yok** |
| Çizim → yapısal geri bildirim | ControlNet scribble / T2I-Adapter → görsel üretir, tasarım bilgisi üretmez |
| Üretim kural motoru | Yok |
| Foto → parametrik CAD | ShopPrentice / Img2CAD / FamFab → tek CAD ekosistemine kilitli, stil katmanı yok |

Bu paket o boş katmanı doldurur. Detaylı karşılaştırma, lisans tablosu ve mimari diyagram: **[`docs/mvp_roadmap.md`](docs/mvp_roadmap.md)**.

---

## Dosyalar

```
furniture_design_engine/
├── furniture_parts.json                          PARÇA TAKSONOMİSİ
│     7 tür tam hiyerarşi: chair, dining_table, sideboard, bookshelf,
│     sofa, coffee_table, wardrobe, headboard, bench, desk
│     23 parçalık türler-arası kanonik indeks
│     Her parça: EN/TR ad, yapısal rol, işlev (birincil + ikincil +
│     sembolik), stil katkısı (feature sinyalleri), malzeme seçenekleri
│     (uygunluk + maliyet katmanı + süreçler), üretim notları, oran
│     kuralları, süsleme kapasitesi, alt parçalar, montaj ilişkileri
│
├── schemas/
│   ├── furniture_parts.schema.json               JSON Schema 2020-12
│   │     kind: taxonomy | taxonomy_set | instance
│   │     designDna, styleScores, qualityScores, ergonomicEnvelope,
│   │     partTemplate, partInstance, assemblyRelation tanımları
│   └── style_ontology.schema.json                stil profili şeması
│         20 zorunlu alan (core_principles … historical_references)
│         + scoring_signature + part_directives + sketch_feedback
│         + compatibility + compliance
│
├── styles/                                       STİL ONTOLOJİSİ
│   ├── gothic_minimalism.yaml     ★ en detaylı (hibrit stil, 19 part directive)
│   ├── bauhaus.yaml
│   ├── japandi.yaml
│   ├── art_deco.yaml
│   └── brutalism.yaml
│
├── pipelines/
│   └── live_sketch_to_design_brief.pipeline.yaml 10 AŞAMALI PIPELINE
│         girdi sözleşmesi (stroke event / raster / upload / text brief)
│         çıktı sözleşmesi (region metadata · design brief · prompt bundle · cad json)
│         11 geri bildirim olayı (WebSocket)
│         realtime (<350 ms) ve on-demand (<6 s) modları
│         model katmanı eşlemesi + hata yönetimi + uçtan uca örnek akış
│
├── prompts/
│   ├── image_to_parts_prompt.txt                 GÖRSEL → PARÇA (4 görev bloğu)
│   │     TASK_A tür · TASK_B parça çıkarımı · TASK_C stil feature · TASK_D DNA+brief
│   │     few-shot örnek + son kontrol listesi + telif disiplini
│   └── part_explanation_prompt.txt               PARÇA AÇIKLAMA (3 mod)
│         brief (tooltip) · full (panel) · teaching (nasıl çizerim)
│         3 tam örnek çıktı
│
├── rules/
│   ├── style_scoring_rules.json                  43 FEATURE + SKORLAMA
│   │     her feature: tanım, ölçüm yöntemi, normalizer, kaynak önceliği
│   │     ağırlıklı kosinüs + hard gate formülü · verdict şablonları
│   │     stil kayıt defteri (5 yüklü + 21 planlı) · kalibrasyon döngüsü
│   ├── manufacturing_constraints.json            45 KURAL + 65 MALZEME
│   │     14 STR (yapısal) · 11 ERG (ergonomi) · 10 MFG (üretim) · 10 DL (tasarım mantığı)
│   │     65 malzeme kaydı: yoğunluk, MOR, MOE, Janka, min kalınlık,
│   │     açıklık limitleri, narinlik sınırı, geçerli süreçler/bitiler
│   │     8 yasal malzeme yasağı (CITES dahil) · 8 aşamalı QC pipeline
│   │     7 skor rubriği + release_decision mantığı · BOM şablonu
│   └── negative_prompts.json                     PROMPT BİRLEŞTİRME
│         global kategoriler (legal/anatomy/physics/quality/scene/copyright)
│         render modu · malzeme bağlamı · mobilya türü ekleri
│         assembly sırası + dedupe + token kırpma + Flux modu notu
│         pozitif prompt şablonu + tam örnek
│
├── docs/mvp_roadmap.md                           HÜKÜM + MİMARİ + PLAN
│         tek repo var mı (hayır, neden) · kaynak→katman→lisans tablosu
│         ASCII mimari diyagram · 5 faz (dosya/API/model/zorluk/süre)
│         2 haftalık gün gün plan · 10 kalite sorusunun cevap haritası
│         yasal çerçeve · 10 açık varsayım
│
└── tools/
    ├── validate_engine.py                        SELF-CHECK (çalıştır)
    ├── reference_scorer.py                       SKORLAYICI REFERANS İMPL.
    └── rewrite_styles.py                         stil YAML bakım aracı
```

---

## Hızlı başlangıç

```bash
pip install pyyaml jsonschema

# 1. Tüm bilgi dosyalarını doğrula (şema + çapraz referans + enum tutarlılığı)
python3 tools/validate_engine.py
# → ÖZET: 43 geçen · 2 uyarı · 0 hata

# 2. Stil skorlayıcısını örnek feature vektörleriyle dene (iyi + bilerek bozuk)
python3 tools/reference_scorer.py --demo --explain
# → iyi örnek:  gothic_minimalism 94/100 [A] ✓ · brutalism 16 (gate) · diğerleri 0
# → kötü örnek: tüm stiller 0 (hard gate) → BİRİNCİL: unclassified ✓

# 3. Kendi ölçümünle skorla
python3 tools/reference_scorer.py --features my_features.json
```

Backend'e bağlarken üç dosya yeterli:

```python
from knowledge.loader import load_style, load_taxonomy, load_rules
from rules.scorer import score_design          # style_scoring_rules.json formülü
from rules.engine import run_qc                # manufacturing_constraints.json kuralları
```

---

## Veri akışı (tek bakışta)

```
çizim stroke'ları / yüklenen görsel
        │
        ▼
  S0 normalize ──► S1 tür ──► S2 parçala ──► S3 parça başına çıkar
        │                                              │
        │                                              ▼
        │                                   S4 stil skorla (43 feature)
        │                                              │
        │                                              ▼
        │                                   S5 kural doğrula (45 kural)
        │                                              │
        ▼                                              ▼
  gerçek zamanlı geri bildirim ◄──────────  S6 tasarım DNA'sı
  (part.detected, style.signal,                        │
   rule.violation, proportion.hint)                    ▼
                                            S7 brief ──► S8 prompt ──► ComfyUI
                                                           │
                                                           ▼
                                              S9 cad_json ──► STEP / DXF / BOM
```

Canlı çizim modülün yalnızca **yayın yapar** (`sketch.stroke_committed`) ve **olay alır** (`fde.*`). Aradaki her şey bu pakette tanımlı.

---

## 10 kalite sorusunun cevabı nerede

| # | Soru | Dosya → alan |
|---|---|---|
| 1 | Bu mobilya hangi tür? | `image_to_parts_prompt.txt` TASK_A → `furniture_type` |
| 2 | Hangi parçalardan oluşuyor? | TASK_B + `furniture_parts.json` → `parts[]`, `assembly_relations` |
| 3 | Her parçanın işlevi ne? | `furniture_parts.json` → `function.primary_tr`, `symbolic_tr` |
| 4 | Hangi malzemeden yapılabilir? | `material_options[]` + `manufacturing_constraints.json` → `materials.entries[]` |
| 5 | Hangi stil kuralına hizmet ediyor? | `styles/*.yaml` → `part_directives[]` + `style_contribution.signals` |
| 6 | Gotik minimal mi, değil mi? Neden? | `gothic_minimalism.yaml` → `scoring_signature` + `style_scoring_rules.json` → `score_formula` & `verdict_generation` |
| 7 | Çizerken hangi geri bildirim? | `pipeline.yaml` → `feedback_contract` + stil YAML → `sketch_feedback` |
| 8 | Hangi pozitif/negatif prompt? | stil YAML → `*_prompt_tokens` + `negative_prompts.json` → `assembly` |
| 9 | Üretilebilir ve tutarlı mı? | `manufacturing_constraints.json` → `scoring_rubrics` + `qc_pipeline` |
| 10 | Hangi açık kaynak hangi katmanda? | `docs/mvp_roadmap.md` §1 + `pipeline.yaml` → `model_stack` |

---

## Telif ve etik duruş

Bu motor **iyi tasarımlardan ilke çıkarır, tasarım kopyalamaz.**

- Kaynak lisansı her kayıtta taşınır: `source.license` + `source.usage_mode` (varsayılan `extract_principles_only`).
- `design_dna.novelty_guard`: `forbid_direct_silhouette_copy: true`, min 2 varyasyon ekseni zorunlu.
- `originality_check` bir **hard gate**'tir: < 0.6 → tasarım reddedilir, < 0.3 → çıktı yayımlanmaz.
- VLM prompt'larında tasarımcı/marka/model adı yazmak açıkça yasak (son kontrol listesi maddesi).
- Negatif prompt'ta `copyright` kategorisi priority 1'dir ve token kırpmasından **asla** etkilenmez.
- Her pozitif prompt `original design, not a replica of any existing product` ile biter.
- 8 yasal malzeme yasağı (fildişi, bağa, gergedan boynuzu, CITES ahşapları, asbest, kurşun, …) `material_legality` gate'i ile zorlanır; ceza 60 puan.
- Her stil dosyasında `compliance`: kültürel hassasiyet notu, dini sembol politikası, `do_not_replicate` listesi.
- Araştırma lisanslı veri setleri (PartNet/ShapeNet, IKEA ASM, MontageNet) **yalnızca kavramsal referans**; ürününde veri olarak dağıtılmaz.
- Müze API'lerinden (Met, Smithsonian CC0, Rijksmuseum, Europeana, Wikidata) yalnızca **public domain filtreli** metadata ve oran/ilke bilgisi toplanır.

---

## Bilinen sınırlar

1. **Stil hedef vektörleri editoryal.** `gothic_minimalism` için `confidence: 0.72`. Üretimde kalibrasyon döngüsü (`style_scoring_rules.json` → `calibration`) ile 30-50 insan etiketli örnek üzerinden ayarlanmalı.
2. **Kural motoru FEA yapmaz.** Span/slenderness limitleri pratik marangozluk/mühendislik tablolarıdır. Gerçek ürün öncesi yapısal hesap ve fiziksel test (EN 1728, EN 12520, EN 16121) zorunludur.
3. **Taksonomi 10 türü tam, 16 türü yalnızca enum düzeyinde tanımlar.** `stool`, `nightstand`, `tv_unit`, `bed` vb. için `parts[]` şablonu yazılmadı — self-check bunu uyarı olarak raporlar.
4. **Çizim 2D.** CAD export'ta tüm z değerleri `inferred` işaretlidir; tipolojik ön ayarlar ve kullanıcı seçimiyle çözülür.
5. **ComfyUI workflow dosyaları bu pakette yok.** `prompt_bundle.controlnet_conditions` sözleşmesi hazır; Faz 2'de yazılacak.
6. **"Gothic minimalism" kurulu bir tarihsel akım değil**, hibrit/kurgusal bir tanım. Gücü de burada: senin markanın stil DNA'sı olacak. Ama bu yüzden hedef vektörü kendi gözünle kalibre etmelisin.

---

## Lisans

Bu paket içindeki şemalar, taksonomi, stil profilleri, kurallar ve prompt'lar **sıfırdan yazılmış özgün içeriktir**; hiçbir açık kaynak repodan kopyalanmamıştır. Kendi ürününde serbestçe kullanabilir, değiştirebilir, ticarileştirebilirsin.

Referans verilen üçüncü taraf projelerin (PartCrafter, Grounded-SAM, ComfyUI, PartNet, 3DCoMPaT200, MontageNet, IKEA ASM, ShopPrentice, Img2CAD, FamFab, müze API'leri) kendi lisansları geçerlidir — entegre etmeden önce her birini ayrı ayrı doğrula.
