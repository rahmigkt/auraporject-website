# FDE — Furniture Design Engine · MVP Yol Haritası

> Sürüm 1.0.0 · 2026-10-16
> Bu dosya **canlı çizim modülünü değiştirmez**. Onun çıktısını tüketen bir "mobilya tasarım beyni" katmanının yol haritasıdır.

---

## 0. Net hüküm: tek hazır GitHub repo var mı?

**Hayır. Yok.**

İstediğin şey — *parça taksonomisi + stil ontolojisi (gotik minimalizm dahil) + görselden geriye doğru çözüm + canlı çizim entegrasyonu + üretim kalite kontrolü + sanatsal üretim* — bu altı katmanın **hepsini** tek pakette veren bir açık kaynak proje bulunmuyor. Sebepleri somut:

| Katman | Mevcut açık kaynak durumu | Neden tek repo yok |
|---|---|---|
| Parça taksonomisi (mobilya anatomisi) | PartNet / PartNet-Mobility / 3DCoMPaT200 | Hepsi **araştırma lisanslı** (ShapeNet türevi = yalnızca ticari olmayan kullanım). Ürün sistemine doğrudan gömülemez. |
| Görselden parça segmentasyonu | Grounded-SAM 2, MontageNet | MontageNet bir **veri seti**, çalışan bir servis değil. SAM genel amaçlı; mobilya parça sözlüğü yok. |
| Görselden parçalı 3D | PartCrafter | NeurIPS 2025 araştırma kodu; stil bilgisi yok, CAD çıktısı yok, web servisi yok. |
| Stil ontolojisi (gotik minimalizm vb.) | **Hiçbir şey yok** | "Gothic minimalism" bir mimari/moda estetik etiketi olarak geçiyor; makine-okunur mobilya stil profili olarak hiçbir yerde tanımlı değil. |
| Foto → parametrik CAD | ShopPrentice, Img2CAD, FamFab | Hepsi tek bir CAD ekosistemine kilitli (Fusion 360 / Revit) ve stil katmanı yok. |
| Canlı çizim geri bildirimi | ControlNet scribble, T2I-Adapter, Sketch-a-Sketch | Bunlar **görsel üretir**, tasarım bilgisi üretmez. "Bu çizim hangi parçaya dönüşüyor / hangi kuralı ihlal ediyor" diyen bir şey yok. |

**Sonuç:** Bu paketin kendisi o eksik katmandır. Aşağıdaki dosyalar sıfırdan yazıldı; hiçbir repodan kopyalanmadı.

---

## 1. En yakın açık kaynak kombinasyonu (katman katman)

```
┌─ KATMAN 1 · ÇİZİM GİRDİSİ ─────────────────────────────────────────────┐
│  SENİN MEVCUT MODÜLÜN (dokunulmaz)                                     │
│  → stroke events + raster export                                       │
│  Yardımcı: paper.js / svg.js pathops, potrace, shapely, OpenCV         │
└────────────────────────────────────────────────────────────────────────┘
┌─ KATMAN 2 · PARÇA ÇÖZÜMLEME ───────────────────────────────────────────┐
│  Sketch modu: deterministik bölge kümeleme + kural tabanlı rol atama   │
│               (VLM yalnızca belirsiz durumda)         ← en hızlı yol   │
│  Raster modu: Grounded-SAM 2 (Apache-2.0) — metin prompt'u             │
│               furniture_parts.json'daki name_en + aliases'tan gelir    │
│  Taksonomi:   SENİN furniture_parts.json'un (bu paket)                 │
│  Referans (yalnızca kavram): PartNet hiyerarşisi, 3DCoMPaT200 parça-   │
│               malzeme-dil eşlemesi, MontageNet bileşen seviyeleri      │
│  ⚠ PartNet/ShapeNet = NON-COMMERCIAL. Ürününde veri olarak dağıtma;    │
│    yalnızca kendi etiket kümeni kurmak için kavramsal referans al.     │
└────────────────────────────────────────────────────────────────────────┘
┌─ KATMAN 3 · ANLAM ÇIKARIMI (VLM) ──────────────────────────────────────┐
│  Yapılandırılmış JSON döndüren herhangi bir VLM:                       │
│  kapalı: GPT-4o / Claude / Gemini   ·   açık: Qwen2.5-VL, InternVL,    │
│  LLaVA-OneVision (kendi sunucunda)                                     │
│  Prompt'lar: prompts/image_to_parts_prompt.txt (4 görev bloğu)         │
│             prompts/part_explanation_prompt.txt (3 mod)                │
└────────────────────────────────────────────────────────────────────────┘
┌─ KATMAN 4 · STİL MOTORU ───────────────────────────────────────────────┐
│  TAMAMI SENİN — açık kaynak eşdeğeri YOK                               │
│  styles/*.yaml  +  rules/style_scoring_rules.json                      │
│  Tarihsel doğrulama (yalnızca metadata + public domain görseller):     │
│  Met Open Access · Smithsonian Open Access (CC0) · Rijksmuseum ·       │
│  Europeana · Wikidata SPARQL                                           │
│  Stil retrieval fikri (opsiyonel): TIRG-BonnFurniture yaklaşımı        │
└────────────────────────────────────────────────────────────────────────┘
┌─ KATMAN 5 · KURAL / KALİTE KONTROL ────────────────────────────────────┐
│  TAMAMI SENİN — model yok, saf deterministik kod                       │
│  rules/manufacturing_constraints.json  (STR / ERG / MFG / DL kuralları)│
│  rules/negative_prompts.json                                           │
└────────────────────────────────────────────────────────────────────────┘
┌─ KATMAN 6 · GÖRSEL ÜRETİM ─────────────────────────────────────────────┐
│  ComfyUI + SDXL/Flux-dev                                               │
│  ControlNet: scribble (ağırlık 0.55-0.75) + canny (0.30-0.45)          │
│              + depth (0.40) + segmentation (0.60, parça maskeleriyle)  │
│  Alternatif: T2I-Adapter (daha hafif) · IP-Adapter (doku referansı)    │
│  Regional prompting / inpaint ile parça bazlı malzeme kontrolü         │
└────────────────────────────────────────────────────────────────────────┘
┌─ KATMAN 7 · 3D / CAD (Faz 5) ──────────────────────────────────────────┐
│  cad_json → CadQuery / FreeCAD headless → STEP · IGES · DXF cutlist    │
│  Alternatif: ShopPrentice (Fusion 360 MCP) · build123d · OpenSCAD      │
│  Görselden parçalı 3D mesh: PartCrafter · TripoSR · TRELLIS            │
│  Foto → parametrik BIM: FamFab (Revit yaklaşımı, kavramsal)            │
│  Montaj ilişkisi eğitimi: IKEA ASM / IKEA 3D Assembly / Assembly in    │
│  the Wild  ⚠ kendi lisansları var, yeniden dağıtma                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Kaynak → katman → lisans tablosu

| Kaynak | Katman | Ne verir | Lisans / risk | MVP'de |
|---|---|---|---|---|
| **PartCrafter** (`wgsxm/PartCrafter`) | 7 | Tek RGB → parçalı 3D mesh | Araştırma kodu; GPU ağır; doğrulanmamış kalite | ❌ Faz 5 |
| **MontageNet** | 2 | Gerçek fotoğraflarda mobilya bileşen etiketleri | Makale veri seti; erişim isteği gerekir | ❌ (Faz 3'te sınıflandırıcı eğitmek için) |
| **3DCoMPaT200** | 2 | Parça-malzeme-dil eşlemesi (30M render) | HuggingFace; çok büyük | ❌ (kavramsal referans) |
| **PartNet / PartNet-Mobility** | 2 | Hiyerarşik parça taksonomisi + eklem semantiği | ⚠ **ShapeNet türevi = yalnızca ticari olmayan** | ❌ sadece kavram |
| **IKEA ASM / 3D Assembly / in the Wild** | 7 | Montaj sırası, parça rolü, segmentasyon | Karışık akademik lisanslar | ❌ sadece kavram |
| **ShopPrentice** | 7 | Dil/foto → Fusion 360 parametrik model (MCP) | Açık kaynak; Fusion 360'a kilitli | ❌ Faz 5 alternatifi |
| **Img2CAD** | 7 | Görselden CAD tersine mühendisliği | Araştırma | ❌ Faz 5 |
| **FamFab** (`ArchSmarterFamFab`) | 7 | Foto → parametrik Revit family | Revit'e kilitli | ❌ Faz 5 |
| **Grounded-SAM 2 / SAM 2** | 2 | Metin prompt'lu maske çıkarımı | Apache-2.0 ✅ | ✅ Faz 1 (raster modu) |
| **ControlNet / T2I-Adapter** | 6 | Çizimden kontrollü görsel üretimi | Açık ✅ | ✅ Faz 2 |
| **Sketch-a-Sketch / ScribbleArchitect** | 6 | Karalama → mimari görsel | Açık ✅ | ⚪ referans |
| **Met Open Access** | 4 | 470k+ eser metadata + görsel | CC0 ✅ | ✅ Faz 2 (stil doğrulama) |
| **Smithsonian Open Access** | 4 | 11M+ kayıt, 3D modeller dahil | CC0 ✅ | ✅ Faz 2 |
| **Rijksmuseum API** | 4 | Hollanda koleksiyonu, CC0 filtreli | CC0 ✅ | ✅ Faz 2 |
| **Europeana API** | 4 | 50M+ kültürel miras kaydı | Kayıt başına değişir ⚠ filtrele | ✅ Faz 2 |
| **Wikidata SPARQL** | 4 | Stil–dönem–malzeme ilişkileri | CC0 ✅ | ✅ Faz 2 |
| **awesome-interior-design** | 4 | Küratörlü tasarım prensip listesi | Liste (kendi kaynak lisansları) | ⚪ editoryal |
| **furniture-style-classifier** | 4 | Stil sınıflandırma baseline | Ders projesi | ⚪ referans |
| **TIRG-BonnFurniture** | 4 | Metin+görsel stil retrieval | Araştırma | ⚪ Faz 3 fikri |

---

## 2. Önerilen mimari

```
                          ┌──────────────────────────────────────┐
                          │   MEVCUT CANLI ÇİZİM MODÜLÜN          │
                          │   (dokunulmaz — yalnızca yayınlar)    │
                          └───────────────┬──────────────────────┘
                                          │ sketch.stroke_committed
                                          │ (points, view, attrs)
                                          ▼
        ┌──────────────────────────────────────────────────────────────┐
        │                    FDE GATEWAY  (FastAPI)                     │
        │   /v1/sketch/stream (WS)  /v1/image/upload  /v1/brief/text    │
        └───────────────┬──────────────────────────────┬────────────────┘
                        │                              │
                        ▼                              ▼
        ┌───────────────────────────┐   ┌──────────────────────────────┐
        │  REALTIME WORKER (async)  │   │   ON-DEMAND WORKER (queue)   │
        │  hedef: < 350 ms          │   │   hedef: < 6 s               │
        └───────────────┬───────────┘   └──────────────┬───────────────┘
                        │                              │
   ┌────────────────────┴──────────────────────────────┴────────────────────┐
   │                        PIPELINE ORCHESTRATOR                           │
   │   pipelines/live_sketch_to_design_brief.pipeline.yaml (10 aşama)       │
   │                                                                        │
   │  S0 ingest_normalize ── deterministik (shapely/opencv/potrace)         │
   │  S1 type_detection ──── VLM + enum constraint                          │
   │  S2 part_segmentation ─ kural (sketch) / Grounded-SAM 2 (raster)       │
   │  S3 per_part_extract ── geometri deterministik + VLM malzeme/işlev     │
   │  S4 style_scoring ───── feature vektörü + weighted cosine + hard gates │
   │  S5 rule_validation ─── STR/ERG/MFG/DL kural motoru                    │
   │  S6 design_dna ──────── preserve / forbid / variation_axes             │
   │  S7 brief_generation ── stil part_directives + DNA birleşimi           │
   │  S8 prompt_generation ─ pozitif/negatif assembly + ControlNet          │
   │  S9 cad_json_export ─── primitif + parametre + constraint + BOM        │
   └───────┬──────────────────┬───────────────────┬─────────────────┬───────┘
           │                  │                   │                 │
           ▼                  ▼                   ▼                 ▼
   ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐
   │  KNOWLEDGE   │  │  RULE ENGINE   │  │  VLM ADAPTER   │  │  GENERATION  │
   │  BASE        │  │  (saf Python)  │  │  (JSON mode)   │  │  ADAPTERS    │
   │              │  │                │  │                │  │              │
   │ furniture_   │  │ manufacturing_ │  │ image_to_parts │  │ ComfyUI      │
   │  parts.json  │  │  constraints   │  │  _prompt.txt   │  │ CadQuery     │
   │ styles/*.yaml│  │ style_scoring_ │  │ part_explain.. │  │ Grounded-SAM │
   │ negative_    │  │  rules.json    │  │                │  │              │
   │  prompts.json│  │                │  │                │  │              │
   └──────────────┘  └────────────────┘  └────────────────┘  └──────────────┘
           ▲
           │  (gece işleri, insan onaylı)
   ┌───────┴──────────────────────────────────────────────────────────────┐
   │  REFERENCE HARVESTER — yalnızca public domain / CC0                  │
   │  Met Open Access · Smithsonian CC0 · Rijksmuseum · Europeana ·       │
   │  Wikidata SPARQL                                                     │
   │  → stil profillerini doğrular, tarihsel referansları zenginleştirir  │
   │  ⚠ çıktı: yalnızca metadata + oran + ilke. Mesh/görsel kopyası yok. │
   └──────────────────────────────────────────────────────────────────────┘

   ── GERİ DÖNÜŞ YOLU ──────────────────────────────────────────────────
   fde.part.detected · fde.type.detected · fde.style.signal ·
   fde.rule.violation · fde.proportion.hint · fde.suggestion.next ·
   fde.brief.ready · fde.prompt.ready · fde.cad.ready · fde.scores.ready
                          │
                          ▼ (WebSocket)
                  MEVCUT ÇİZİM ARAYÜZÜN
```

### Mimari kararları

| Karar | Seçim | Gerekçe |
|---|---|---|
| Çizim motoruna bağımlılık | **Tek yönlü, event tabanlı** | Modülünü değiştirmiyoruz; yalnızca yayın yapması yeterli. Yayın yapamıyorsa raster fallback çalışır. |
| Sketch parça tespiti | **Deterministik kural önce, VLM sonra** | Çizimde çizgi/arc/bölge geometrisi zaten kesin bilgi verir. VLM çağrısı 300-900 ms; çizim akışını bozar. |
| Bilgi tabanı formatı | **Dosya tabanlı YAML/JSON** | Sürüm kontrolü, diff, insan okuması ve hot-reload kolay. DB'ye Faz 3'te taşınır. |
| Kural motoru | **Model yok, saf kod** | Fizik ve üretim kuralları tahmin edilemez olmalı. %100 deterministik, %100 test edilebilir. |
| Skorlama | **Ağırlıklı kosinüs + hard gate** | Tek bir skora indirgemek yerine "neden bu skor" açıklanabilir olmalı. Gate'ler saçma tasarımı kesin olarak bloklar. |
| Telif stratejisi | **İlke çıkar, siluet kopyalama** | `design_dna.novelty_guard` + `originality_check` gate'i + kaynak lisans alanı. |

---

## 3. İlk sürüm dosya listesi

Bu pakette **üretilmiş** dosyalar (hepsi kopyalanabilir, hepsi doğrulanmış):

```
furniture_design_engine/
├── README.md                                     ← paket özeti + hızlı başlangıç
├── furniture_parts.json                          ← PARÇA TAKSONOMİSİ (7 tür, tam hiyerarşi)
├── schemas/
│   ├── furniture_parts.schema.json               ← taksonomi + instance şeması (JSON Schema 2020-12)
│   └── style_ontology.schema.json                ← stil profili şeması
├── styles/
│   ├── gothic_minimalism.yaml                    ★ en detaylı profil (hibrit stil)
│   ├── bauhaus.yaml
│   ├── japandi.yaml
│   ├── art_deco.yaml
│   └── brutalism.yaml
├── pipelines/
│   └── live_sketch_to_design_brief.pipeline.yaml ← 10 aşama + girdi/çıktı sözleşmeleri + örnek akış
├── prompts/
│   ├── image_to_parts_prompt.txt                 ← 4 görev bloğu (tür / parça / stil / DNA) + few-shot
│   └── part_explanation_prompt.txt               ← 3 mod (brief / full / teaching) + 3 örnek çıktı
├── rules/
│   ├── style_scoring_rules.json                  ← 42 feature + formül + gate + kalibrasyon döngüsü
│   ├── manufacturing_constraints.json            ← 14 STR + 11 ERG + 10 MFG + 10 DL kuralı + 27 malzeme tablosu
│   └── negative_prompts.json                     ← global + kategori + stil + render modu assembly motoru
├── docs/
│   └── mvp_roadmap.md                            ← bu dosya
└── tools/
    ├── validate_engine.py                        ← tüm dosyaları doğrulayan self-check (44 kontrol)
    ├── reference_scorer.py                       ← skor formülünün çalışır referans implementasyonu
    └── rewrite_styles.py                         ← stil YAML'larını yeniden biçimlendiren bakım aracı
```

**Doğrulama durumu:**

```
$ python3 tools/validate_engine.py
ÖZET: 44 geçen · 1 uyarı · 0 hata
```

Kontrol edilenler: JSON/YAML sözdizimi · iki şemanın meta-doğrulaması ·
`furniture_parts.json` ve 5 stil dosyasının şema uyumu · 43 feature'ın tamamının
hem `style_scoring_rules.json`'da hem `image_to_parts_prompt.txt` TASK_C'de tanımlı
olması · stil hedef vektörlerindeki her `feature_id`'nin kayıtlı olması · hard
gate'lerin geçerli feature'a bağlanması · `part_directives` rollerinin şema
enum'unda olması · 65 malzeme kaydının `valid_processes` değerlerinin şema
`processId` enum'u ile uyumu · taksonomideki 42 `material_id`'nin malzeme
tablosunda tanımlı olması · 45 kuralın `check_id` benzersizliği ve zorunlu
alanları · pipeline'daki `prompt_ref`/`config_ref` dosyalarının diskte varlığı ·
`region_metadata_schema`'da istenen 7 alanın tamamı · hybrid_recipe oran
toplamlarının 1.0 olması · stil kayıt defteri ile dosyaların birebir eşleşmesi.

Tek uyarı bilinçli: 16 mobilya türü enum'da tanımlı ama tam taksonomisi yazılmadı
(Faz 3'te doldurulacak).

**Skor formülü kalibrasyonu (ölçülmüş):**

İlk formül saf ağırlıklı kosinüstü ve **ayırt edici değildi** — bariz kötü bir
tasarım bile her stile 0.85-0.92 benzerlik veriyordu. Formül, yön benzerliği ile
büyüklük sapmasını harmanlayacak şekilde değiştirildi:

```
weighted_mad     = Σ(W·|M−T|) / ΣW
deviation_score  = max(0, 100 − 200·weighted_mad)
similarity       = 0.25·(100·weighted_cosine) + 0.75·deviation_score
final            = clamp(similarity − gate_penalty, 0, 100)
```

`tools/reference_scorer.py --demo` ile yeniden üretilebilir ölçümler:

| Test | gothic_min | brutalism | art_deco | bauhaus | japandi | Sonuç |
|---|---|---|---|---|---|---|
| İyi gotik-minimal sandalye | **94 (A) ✓** | 16 (gate) | 0 (gate) | 5 (gate) | 0 (gate) | doğru birincil |
| Parlak/pastel/oymalı sandalye | 0 (gate) | 0 (gate) | 0 (gate) | 0 (gate) | 0 (gate) | **unclassified** ✓ |

Gate'ler olmasaydı kötü örnek `art_deco 67.1` ile yanlış bir birincil seçecekti —
bu, `hard_gates` katmanının neden zorunlu olduğunu gösteriyor.

**Kod olarak senin yazman gereken minimum (Faz 1):**

```
server/
├── main.py                    FastAPI app, WS endpoint
├── geometry/
│   ├── normalize.py           S0: RDP basitleştirme, ölçek çözümü
│   ├── primitives.py          line/arc/circle/ellipse fit, R²
│   └── regions.py             kapalı bölge çıkarma, simetri IoU
├── knowledge/
│   ├── loader.py              YAML/JSON hot-reload + cache
│   └── taxonomy.py            parça/tür/rol enum doğrulama
├── rules/
│   ├── engine.py              STR/ERG/MFG/DL kural motoru
│   ├── scorer.py              weighted cosine + hard gates
│   └── prompts.py             negatif/pozitif assembly
├── vlm/
│   └── adapter.py             JSON mode çağrı + retry + fallback
└── contracts/
    └── events.py              feedback_contract olay modelleri (pydantic)
```

Tahmini: ~1.800-2.500 satır Python. Bilgi dosyaları zaten hazır.

---

## 4. Faz planı

### Faz 1 — Görselden parça ve tarz analizi
> Kullanıcı bir görsel yükler → sistem türü, parçaları, malzemeleri, oranları ve stil skorunu söyler.

| | |
|---|---|
| **Dosyalar** | `furniture_parts.json`, `schemas/*`, `styles/*.yaml` (5 stil), `rules/style_scoring_rules.json`, `prompts/image_to_parts_prompt.txt` (TASK_A + TASK_C) |
| **API** | `POST /v1/image/upload` → `{instance}` · `POST /v1/analyze/style` → `{style_scores}` |
| **Modeller** | 1 VLM (JSON mode) · Grounded-SAM 2 (raster parça maskeleri, opsiyonel ama önerilir) · pixel-stats (OpenCV/PIL ile L\*/C\* hesaplama) |
| **Kod** | `knowledge/loader.py`, `vlm/adapter.py`, `rules/scorer.py`, `geometry/` (maskeden bbox/void/simetri) |
| **Zorluk** | ★★☆☆☆ (2/5) — bilgi dosyaları hazır; iş yalnızca VLM çıktısını şemaya doğrulamak ve skorlayıcıyı yazmak |
| **Süre** | 4-6 gün (tek geliştirici) |
| **Kabul kriteri** | 20 görsellik bir test setinde tür tespiti ≥ %85 doğru; stil sıralaması insan etiketiyle Spearman ρ ≥ 0.6 |
| **Risk** | VLM'in enum dışı değer üretmesi → pydantic doğrulama + 1 retry + kural fallback |

### Faz 2 — Stil seçip yeni mobilya brief'i üretme
> Kullanıcı bir stil seçer (+ opsiyonel referans) → sistem brief + pozitif/negatif prompt üretir → görsel üretilir → kalite kontrolünden geçer.

| | |
|---|---|
| **Dosyalar** | `prompts/image_to_parts_prompt.txt` (TASK_D), `rules/negative_prompts.json`, `rules/manufacturing_constraints.json` (DL + STR), stil YAML'larının `part_directives` ve `positive/negative_prompt_tokens` alanları |
| **API** | `POST /v1/brief/generate` → `{design_brief}` · `POST /v1/prompt/build` → `{prompt_bundle}` · `POST /v1/qc/evaluate` → `{scores, violations, release_decision}` |
| **Modeller** | VLM (DNA + brief) · ComfyUI (SDXL/Flux + ControlNet) · kural motoru (model yok) |
| **Kod** | `rules/engine.py`, `rules/prompts.py`, ComfyUI workflow şablonları, `qc_pipeline` orkestrasyonu |
| **Zorluk** | ★★★☆☆ (3/5) — kural motoru kolay, ComfyUI entegrasyonu ve QC döngüsü orta |
| **Süre** | 5-7 gün |
| **Kabul kriteri** | Üretilen 30 tasarımın ≥ %80'i `hard_fail` olmadan geçiyor; insan değerlendirmesinde ≥ %70 "stil tutarlı" |
| **Risk** | Görsel üretim kural motorunu kandırabilir (anatomi hataları) → `qc_pipeline` stage 2 (anatomy_gate) başarısızsa aynı brief ile max 3 kez yeniden üret |

### Faz 3 — Canlı çizimden yapısal tasarım JSON'ı üretme
> Mevcut çizim modülün stroke yayınlamaya başlar → sistem gerçek zamanlı parça/tarz/oran geri bildirimi verir ve `instance` JSON'ı üretir.

| | |
|---|---|
| **Dosyalar** | `pipelines/live_sketch_to_design_brief.pipeline.yaml` (S0-S5), `feedback_contract`, `furniture_parts.json` (taksonomi lookup) |
| **API** | `WS /v1/sketch/stream` (girdi: `sketch.stroke_committed`, çıktı: 10 olay tipi) · `POST /v1/sketch/raster` |
| **Modeller** | Deterministik geometri (shapely, OpenCV, RDP) · VLM (yalnızca on-demand ve belirsiz bölgelerde) · Grounded-SAM **gerekmez** (stroke bölgeleri zaten maske) |
| **Kod** | `geometry/normalize.py`, `geometry/primitives.py`, `geometry/regions.py`, `contracts/events.py`, realtime worker, incremental cache |
| **Zorluk** | ★★★★☆ (4/5) — **en zor faz.** Gerçek zamanlılık, debounce, incremental cache ve kural tabanlı rol ataması ciddi mühendislik |
| **Süre** | 8-12 gün |
| **Kabul kriteri** | 20 çizimlik golden set'te parça rolü ataması ≥ %75 doğru; geri bildirim gecikmesi p95 < 350 ms; çizim akışında hissedilir takılma yok |
| **Risk** | VLM gecikmesi çizimi bozar → realtime modda VLM'i throttle et (her 3. stroke) ve cache'le; belirsiz bölgelerde kullanıcıya tek tık doğrulama sor |
| **Not** | Bu fazı ikiye böl: **3a** yalnızca tür+oran+stil geri bildirimi (kolay, 4 gün), **3b** tam parça rolü ataması ve instance JSON (zor, 6 gün). |

### Faz 4 — Parça parça açıklama arayüzü
> Kullanıcı bir parçaya tıklar → sistem o parçayı işlev / malzeme / stil katkısı / üretim / sağlık / tasarım kolları açısından anlatır.

| | |
|---|---|
| **Dosyalar** | `prompts/part_explanation_prompt.txt` (3 mod), `furniture_parts.json` (function, style_contribution, manufacturing alanları), stil YAML `part_directives` |
| **API** | `POST /v1/part/explain` → `{mode: brief\|full\|teaching}` · hover için `brief` (cache'li), panel için `full` |
| **Modeller** | VLM (LLM yeterli — görsel şart değil, çünkü parça kaydı zaten yapısal) |
| **Kod** | `part/explain.py` (context assembler), cache katmanı, UI bileşenleri (tooltip, panel, öğretim modu) |
| **Zorluk** | ★★☆☆☆ (2/5) — prompt hazır, örnek çıktılar hazır; iş context birleştirmek ve cache'lemek |
| **Süre** | 3-5 gün |
| **Kabul kriteri** | `brief` modu p95 < 600 ms (cache hit < 50 ms); açıklamalarda uydurma ölçü yok (null discipline) |
| **Risk** | VLM'in uydurma ölçü üretmesi → tüm sayısal alanlar girdi JSON'ından gelir, VLM yalnızca yorum yazar; şema doğrulaması sayıları reddeder |

### Faz 5 — 3D / CAD / parametrik modele geçiş
> `cad_json` → STEP / IGES / DXF cutlist / GLB. Parametrik sürücülerle kullanıcı ölçü değiştirebilir.

| | |
|---|---|
| **Dosyalar** | `pipelines/...pipeline.yaml` (S9), `cad_json_schema`, `manufacturing_constraints.json` (`bom_template`) |
| **API** | `POST /v1/cad/export` → `{cad_json, files[]}` · `POST /v1/cad/parametrize` |
| **Modeller/Araçlar** | CadQuery veya FreeCAD headless (STEP/IGES/DXF) · trimesh (STL/GLB) · opsiyonel: PartCrafter (görselden parçalı mesh) · opsiyonel: ShopPrentice (Fusion 360 MCP) |
| **Kod** | `cad/builder.py` (primitif → solid), `cad/params.py` (sürücü grafiği), `cad/export.py`, `bom/cutlist.py` |
| **Zorluk** | ★★★★★ (5/5) — **en yüksek risk.** 2D çizimden derinlik (z) çıkarımı belirsiz; organik formlar CAD primitiflerine indirgenemez; STEP doğrulaması gerekir |
| **Süre** | 12-20 gün (yalnızca box/cylinder/extrusion primitifleriyle sınırlı bir ilk sürüm: 8 gün) |
| **Kabul kriteri** | Düzlemsel/ekstrüzyon tabanlı tasarımların ≥ %90'ı geçerli bir STEP dosyası üretiyor; FreeCAD'de açılıyor; BOM ve cutlist eksiksiz |
| **Risk** | Derinlik belirsizliği → tüm z değerlerini `inferred` işaretle ve kullanıcıya bir derinlik ön ayarı seçtir (tipolojik varsayılanlar: kapak 18, tabla 25, raf 20, ayak kesiti = çizim genişliği) |
| **Kapsam daraltma önerisi** | İlk sürümde yalnızca **prizmatik mobilya** (dolap, raf, masa, bank) destekle. Eğri formlu oturma mobilyasını (bükümlü kuşak, eyer formu oturak) Faz 5b'ye bırak. |

---

## 5. İki haftalık uygulama planı

**Varsayımlar:** 1 tam zamanlı geliştirici (+ yarı zamanlı bir tasarımcı/mobilyacı doğrulama için). Mevcut çizim modülü çalışıyor ve bir backend'in var. Günde ~6 saat verimli kod.

### Hafta 1 — Bilgi motoru çekirdeği

| Gün | İş | Çıktı | Doğrulama |
|---|---|---|---|
| **1** | Bilgi tabanını yükle. `knowledge/loader.py` (YAML/JSON hot-reload, pydantic modelleri, enum doğrulama). `tools/validate_engine.py` çalıştır. | Yüklenen 5 stil + taksonomi + 3 kural dosyası; self-check yeşil | `python tools/validate_engine.py` → 0 hata |
| **2** | Skorlayıcı. `rules/scorer.py`: normalize → weighted cosine → hard gates → rankings → verdict üretimi. | `style_scoring_rules.json` formülünün birebir kodu | Elle hesaplanmış 5 vektörle birim test |
| **3** | Kural motoru (yarı). `rules/engine.py`: STR + ERG kontrolleri. | 14 STR + 11 ERG kuralı çalışıyor | Her kural için 1 geçen + 1 başarısız birim test |
| **4** | Kural motoru (tamamı) + rubrik skorları. MFG + DL kontrolleri, 6 skor bloğu, `release_decision`. | Tam QC motoru | Kasıtlı bozuk 10 tasarımla test |
| **5** | VLM adaptörü. `vlm/adapter.py`: JSON mode, şema doğrulama, 1 retry, kural fallback. TASK_A (tür) + TASK_C (feature) entegrasyonu. | `POST /v1/analyze/style` uçtan uca | 10 görselle tür ≥ %80 doğru |
| **6-7** | Faz 1 tamamlama + TASK_B (parça çıkarımı) + Grounded-SAM 2 (opsiyonel). 20 görsellik golden set. | **Faz 1 teslim** | Tür ≥ %85, stil ρ ≥ 0.6 |

**Hafta 1 sonu demo:** Bir mobilya görseli yükle → sistem "bu bir sandalye, 7 parça, %74 gotik minimal, şu kuralları ihlal ediyor, üretilebilirlik 68/100" desin.

### Hafta 2 — Üretim + çizim entegrasyonu

| Gün | İş | Çıktı | Doğrulama |
|---|---|---|---|
| **8** | TASK_D (design DNA) + brief üretici (S6-S7). Stil `part_directives` birleşimi, variation_axes örnekleyici, telif guard'ı. | `POST /v1/brief/generate` | 10 brief'te `novelty_guard` her zaman dolu; hiçbirinde tasarımcı adı yok |
| **9** | Prompt assembly (S8). `rules/prompts.py`: pozitif şablon + negatif birleştirme + dedupe + token kırpma + ControlNet koşul listesi. ComfyUI workflow şablonu. | `POST /v1/prompt/build` + ilk üretilen görseller | Snapshot testi: aynı brief → aynı prompt |
| **10** | QC döngüsünü görsel üretime bağla. Üretilen görseli yeniden TASK_B/C'den geçir → skorla → `hard_fail` varsa max 3 kez yeniden üret. | Kapalı üretim döngüsü | 30 tasarımda ≥ %80 hard_fail'siz geçiş |
| **11** | **Faz 2 teslim.** Ardından Faz 3a başlangıcı: `geometry/normalize.py` + `primitives.py` (RDP, line/arc fit, ölçek çözümü). | Çizim stroke'larından normalize geometri | 10 çizimde primitif fit R² ≥ 0.95 |
| **12** | `geometry/regions.py`: kapalı bölge çıkarma, simetri IoU, kural tabanlı rol ataması (pipeline S2 sketch modu). | Bölgeler → `region_metadata` (7 alan) | 10 çizimde parça rolü ≥ %70 doğru |
| **13** | Realtime worker + WS olayları. Debounce 220 ms, incremental cache, 6 olay tipi (`part.detected`, `type.detected`, `style.signal`, `rule.violation`, `proportion.hint`, `suggestion.next`). | `WS /v1/sketch/stream` | p95 gecikme < 350 ms |
| **14** | Faz 4 hızlı geçiş: `POST /v1/part/explain` (brief + full modları, cache). Golden set koşusu. **Sprint değerlendirmesi + Faz 3b/5 planı.** | **Faz 3a + Faz 4 (kısmi) teslim** | Hover açıklaması cache hit < 50 ms |

**Hafta 2 sonu demo:** Kullanıcı çiziyor → sistem anında "bu bir sandalye, bu bölge sırtlık, gotik minimal %71, STR-009 ihlali: sırtlığı arka bacaklara bağla" diyor → kullanıcı düzeltiyor → brief + prompt + görsel üretiliyor → parçaya tıklayınca tam açıklama çıkıyor.

### İki haftada **yapılmayanlar** (bilinçli kapsam dışı)

- ❌ Faz 3b tam instance JSON üretimi ve çoklu tür desteği
- ❌ Faz 5 (CAD/STEP export) — en yüksek risk, ayrı sprint
- ❌ Stil sayısının 5'in üzerine çıkarılması (wabi-sabi, de Stijl, Memphis, high-tech, neo-gotik, dark academia)
- ❌ Kalibrasyon döngüsü (30-50 insan etiketli örnek gerekir)
- ❌ Reference harvester (Met/Europeana/Wikidata gece işleri)
- ❌ Kullanıcı arayüzü tasarımı (bu paket yalnızca veri sözleşmesi ve backend verir)

### Sonraki 4 hafta (önerilen sıra)

| Hafta | Odak | Neden bu sıra |
|---|---|---|
| 3 | Faz 3b (tam instance JSON) + 4 stil daha (scandinavian_modern, minimalism, mid_century_modern, wabi_sabi) | Çizim entegrasyonu ürünün asıl değeri; stil kapsamı kullanıcı seçimini anlamlı kılar |
| 4 | Kalibrasyon döngüsü + golden set'i 100 örneğe büyütme | Skorlar kalibre edilmeden kullanıcıya göstermek güven kaybettirir |
| 5 | Reference harvester + stil profillerini tarihsel veriyle zenginleştirme | `historical_references` alanları gerçek müze kayıtlarıyla doğrulanır |
| 6 | Faz 5 ilk dilim: prizmatik mobilya → CadQuery → STEP + DXF cutlist + BOM | Üretilebilirlik iddiasını gerçek dosyayla kanıtlar |

---

## 6. 10 kalite sorusuna cevap haritası

| Soru | Cevabı veren dosya | Alan |
|---|---|---|
| 1. Bu mobilya hangi tür? | `image_to_parts_prompt.txt` TASK_A + `furniture_parts.json` | `furniture_type`, `category` |
| 2. Hangi parçalardan oluşuyor? | TASK_B + `furniture_parts.json` `types[].parts` | `parts[]`, `part_tree`, `assembly_relations` |
| 3. Her parçanın işlevi ne? | `furniture_parts.json` → `function.primary/primary_tr` + TASK_B | `parts[].function` |
| 4. Her parça hangi malzemeden yapılabilir? | `furniture_parts.json` → `material_options[]` + `manufacturing_constraints.json` → `materials.entries[]` | `suitability`, `structural_grade`, `valid_processes`, `cost_tier` |
| 5. Her parça hangi stil kuralına hizmet ediyor? | `styles/*.yaml` → `part_directives[]` + `furniture_parts.json` → `style_contribution.signals` | `serves_rules`, `signals`, `ornament_level` |
| 6. Bu tasarım gotik minimal mi, değil mi? Neden? | `styles/gothic_minimalism.yaml` → `scoring_signature` + `style_scoring_rules.json` → `verdict_generation` | `style_scores.rankings[]`, `verdict_tr`, `gate_failures` |
| 7. Kullanıcı çizim yaparken hangi geri bildirim verilir? | `live_sketch_to_design_brief.pipeline.yaml` → `feedback_contract` + stil YAML → `sketch_feedback` | 10 olay tipi + `on_violation_tr` cümleleri |
| 8. Hangi pozitif/negatif prompt'lar? | `styles/*.yaml` → `positive/negative_prompt_tokens` + `negative_prompts.json` → `assembly` | `prompt_bundle` |
| 9. Üretilen mobilya üretilebilir ve tutarlı mı? | `manufacturing_constraints.json` → `scoring_rubrics` + `qc_pipeline` | `manufacturability`, `style_consistency`, `release_decision` |
| 10. Hangi açık kaynak hangi katmanda? | Bu dosya §1 + `pipeline.yaml` → `model_stack` | katman/kaynak/lisans tablosu |

---

## 7. Yasal ve etik çerçeve (uygulanan)

| İlke | Nerede uygulanıyor |
|---|---|
| Kaynak lisansı her yerde taşınır | `instance.source.license` + `usage_mode` (extract_principles_only / style_reference / geometry_reference) |
| Varsayılan güvenli mod | `usage_mode` verilmezse `extract_principles_only` |
| Siluet kopyası yasak | `design_dna.novelty_guard.forbid_direct_silhouette_copy = true`, `max_silhouette_iou_vs_reference = 0.8` |
| Özgünlük gate'i | `originality_check` feature'ı; < 0.6 = hard fail, < 0.3 = çıktı yayımlanmaz (DL-009) |
| Prompt'ta tasarımcı/marka adı yok | `image_to_parts_prompt.txt` ve `part_explanation_prompt.txt` içinde açık yasak + son kontrol listesi maddesi |
| Negatif prompt telif koruması | `negative_prompts.json` → `global.copyright` (priority 1, asla kırpılmaz) |
| Pozitif promptta özgünlük ifadesi | Her pozitif prompt `original design, not a replica of any existing product` ile biter |
| Yasal malzeme yasağı | `manufacturing_constraints.json` → `prohibited_materials.legal_bans` + `material_legality` gate (DL-010, ceza 60) |
| Kültürel hassasiyet | Her stil YAML'ında `compliance.cultural_sensitivity_notes` + `religious_symbol_policy` + `do_not_replicate` |
| Araştırma lisanslı veri setleri ürününde dağıtılmaz | PartNet/ShapeNet, IKEA ASM, MontageNet yalnızca **kavramsal referans** olarak işaretli |
| Referans toplama yalnızca public domain | Reference harvester CC0/public domain filtresiyle çalışır; çıktı yalnızca metadata + oran + ilke |

**Üretim mantığı her yerde aynı:** *extract design principles and generate original furniture* — asla *copy exact design*.

---

## 8. Bilinen sınırlar ve açık varsayımlar

| # | Varsayım / sınır | Etki | Nasıl çözülür |
|---|---|---|---|
| A1 | Çizim modülün stroke verisi yayınlayabilir | Yayınlayamıyorsa Faz 3 çalışmaz, yalnızca raster mod | `input_contract.raster_export` fallback'i |
| A2 | Çizim 2D; derinlik (z) yok | CAD export'ta z değerleri tahmindir | `inferred` bayrağı + tipolojik ön ayarlar + kullanıcı seçimi |
| A3 | Birim mm, ölçek çoğu zaman verilmez | Ölçek ergonomik zarftan geri çözülür | `scale_inferred = true`, tüm ölçülerde `~` |
| A4 | Stil hedef vektörleri **editoryal** olarak atandı | Skorlar başlangıçta kalibre değil | `style_scoring_rules.json` → `calibration.calibration_loop` (30-50 etiketli örnek) |
| A5 | VLM feature tahminleri gürültülü | Stil skorunda ±%10 sapma beklenir | Deterministik feature'lar öncelikli (`source_priority`), VLM confidence 0.85 ile çarpılır |
| A6 | "Gothic minimalism" kurulu bir tarihsel akım değil | Profil `confidence: 0.72` | Kullanıcı onayı + A/B görsel testi ile kalibre et |
| A7 | 27 malzeme tablosu tüm gerçek malzemeleri kapsamaz | Nadir malzemeler kural motorunda `unknown` düşer | `materials.entries[]` genişletilebilir; şema sabit |
| A8 | Kural motoru gerçek mühendislik hesabı **yapmaz** | Span/slenderness limitleri pratik tablolardır, FEA değil | Üretim öncesi gerçek yapısal hesap + fiziksel test (EN 1728, EN 12520, EN 16121) zorunlu |
| A9 | ComfyUI workflow'ları bu pakette yok | Faz 2'de yazılmalı | `prompt_bundle.controlnet_conditions` sözleşmesi hazır |
| A10 | Taksonomi 7 türü tam, 20 türü yalnızca enum düzeyinde tanımlar | `stool`, `nightstand`, `tv_unit` vb. için `parts[]` şablonu eksik | Faz 3'te en çok kullanılan 6 türü daha doldur |

---

## 9. Hemen yapılacak üç iş (bugün)

1. **`tools/validate_engine.py` çalıştır.** Tüm bilgi dosyalarının tutarlı olduğunu doğrula (stil hedef vektörlerindeki feature id'leri `style_scoring_rules.json`'da var mı, `part_directives` rolleri şema enum'unda mı, JSON'lar geçerli mi).
2. **Bir VLM seç ve TASK_A + TASK_C'yi test et.** 5 mobilya görseli yükle, tür ve feature çıktısını elle kontrol et. Bu, tüm sistemin en kırılgan halkası — önce bunu gör.
3. **`gothic_minimalism.yaml` içindeki `scoring_signature.target_vector` değerlerini kendi gözünle gözden geçir.** Bu değerler editoryal. Senin estetik yargınla düzeltilmeden sistem "senin" gotik minimalizmini değil, benim varsayımımı üretir. Değiştirdikten sonra `python3 tools/reference_scorer.py --demo` ile skorların hâlâ ayrıştığını doğrula (iyi örnek ≥ 85, kötü örnek tüm stillerde 0 olmalı).
