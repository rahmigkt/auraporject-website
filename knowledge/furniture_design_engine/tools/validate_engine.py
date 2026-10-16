#!/usr/bin/env python3
"""
FDE self-check — bilgi motorundaki tüm dosyaları doğrular.

Kullanım:
    python3 tools/validate_engine.py [--root <furniture_design_engine dizini>]

Kontrol ettikleri:
  1. Tüm JSON dosyaları geçerli JSON mu?
  2. Tüm YAML dosyaları geçerli YAML mı?
  3. İki JSON şeması geçerli JSON Schema 2020-12 mi?
  4. furniture_parts.json -> schemas/furniture_parts.schema.json'a uyuyor mu?
  5. styles/*.yaml -> schemas/style_ontology.schema.json'a uyuyor mu?
  6. Stil hedef vektörlerindeki her feature_id, style_scoring_rules.json'da tanımlı mı?
  7. Stil part_directives[].part_role değerleri şema enum'unda var mı?
  8. Stil material_id'leri manufacturing_constraints.json malzeme tablosunda var mı?
     (yoksa "bilinmeyen malzeme" uyarısı — tablo genişletilebilir olduğu için hata değil)
  9. furniture_parts.json içindeki material_id'ler aynı tabloyla karşılaştırılır.
 10. furniture_parts.json style_contribution.signals[].feature_id değerleri tanımlı mı?
 11. Pipeline YAML'ındaki config_ref / prompt_ref dosyaları diskte var mı?
 12. Stil yasak sinyallerindeki detected_by feature id'leri tanımlı mı?
 13. negative_prompts.json stil anahtarları stil kayıt defterinde var mı?

Bağımlılık: pyyaml, jsonschema   (pip install pyyaml jsonschema)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any

try:
    import yaml
except ImportError:
    print("HATA: pyyaml gerekli -> pip install pyyaml", file=sys.stderr)
    sys.exit(2)

try:
    from jsonschema import Draft202012Validator
except ImportError:
    print("HATA: jsonschema gerekli -> pip install jsonschema", file=sys.stderr)
    sys.exit(2)


ROOT_DEFAULT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ERR = "\033[31m✗\033[0m"
WARN = "\033[33m!\033[0m"
OK = "\033[32m✓\033[0m"


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []
        self.passed: list[str] = []

    def err(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)

    def ok(self, msg: str) -> None:
        self.passed.append(msg)

    def dump(self) -> int:
        for m in self.passed:
            print(f"  {OK} {m}")
        for m in self.warnings:
            print(f"  {WARN} {m}")
        for m in self.errors:
            print(f"  {ERR} {m}")
        print()
        print(
            f"ÖZET: {len(self.passed)} geçen · {len(self.warnings)} uyarı · "
            f"{len(self.errors)} hata"
        )
        return 1 if self.errors else 0


def load_json(path: str, rep: Report) -> Any | None:
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        rep.ok(f"JSON geçerli: {rel(path)}")
        return data
    except FileNotFoundError:
        rep.err(f"Dosya bulunamadı: {rel(path)}")
    except json.JSONDecodeError as exc:
        rep.err(f"JSON geçersiz: {rel(path)} -> {exc}")
    return None


def load_yaml(path: str, rep: Report) -> Any | None:
    try:
        with open(path, encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        rep.ok(f"YAML geçerli: {rel(path)}")
        return data
    except FileNotFoundError:
        rep.err(f"Dosya bulunamadı: {rel(path)}")
    except yaml.YAMLError as exc:
        rep.err(f"YAML geçersiz: {rel(path)} -> {exc}")
    return None


_REL_ROOT = ROOT_DEFAULT


def rel(path: str) -> str:
    try:
        return os.path.relpath(path, _REL_ROOT)
    except ValueError:
        return path


def validate_against_schema(instance: Any, schema: dict, label: str, rep: Report, max_errors: int = 12) -> bool:
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(instance), key=lambda e: list(e.absolute_path))
    if not errors:
        rep.ok(f"Şema uyumu: {label}")
        return True
    for exc in errors[:max_errors]:
        loc = "/".join(str(p) for p in exc.absolute_path) or "<kök>"
        rep.err(f"Şema ihlali [{label}] @ {loc}: {exc.message[:220]}")
    if len(errors) > max_errors:
        rep.err(f"... ve {len(errors) - max_errors} şema ihlali daha [{label}]")
    return False


def collect_part_roles(schema: dict) -> set[str]:
    return set(schema["$defs"]["partRoleId"]["enum"])


def collect_process_ids(schema: dict) -> set[str]:
    return set(schema["$defs"]["processId"]["enum"])


def collect_joint_types(schema: dict) -> set[str]:
    return set(schema["$defs"]["jointType"]["enum"])


def collect_furniture_types(schema: dict) -> set[str]:
    return set(schema["$defs"]["furnitureTypeId"]["enum"])


def walk(obj: Any, path: str = ""):
    """(path, key, value) üçlülerini üretir."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield f"{path}.{k}" if path else str(k), k, v
            yield from walk(v, f"{path}.{k}" if path else str(k))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from walk(v, f"{path}[{i}]")


def main() -> int:
    global _REL_ROOT
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=ROOT_DEFAULT)
    args = ap.parse_args()
    root = os.path.abspath(args.root)
    _REL_ROOT = root

    rep = Report()
    print(f"\nFDE self-check · kök: {root}\n")

    # --- 1. şemalar -------------------------------------------------------
    parts_schema = load_json(os.path.join(root, "schemas/furniture_parts.schema.json"), rep)
    style_schema = load_json(os.path.join(root, "schemas/style_ontology.schema.json"), rep)
    for name, sch in (("furniture_parts.schema.json", parts_schema), ("style_ontology.schema.json", style_schema)):
        if sch is None:
            continue
        try:
            Draft202012Validator.check_schema(sch)
            rep.ok(f"Geçerli JSON Schema 2020-12: {name}")
        except Exception as exc:  # noqa: BLE001
            rep.err(f"Şema meta-doğrulama başarısız: {name} -> {exc}")

    # --- 2. kural dosyaları ----------------------------------------------
    scoring = load_json(os.path.join(root, "rules/style_scoring_rules.json"), rep)
    mfg = load_json(os.path.join(root, "rules/manufacturing_constraints.json"), rep)
    negp = load_json(os.path.join(root, "rules/negative_prompts.json"), rep)

    feature_ids: set[str] = set()
    if scoring:
        for f in scoring.get("features", []):
            fid = f.get("feature_id")
            if not fid:
                rep.err("style_scoring_rules.json: feature_id'siz kayıt")
                continue
            if fid in feature_ids:
                rep.err(f"style_scoring_rules.json: tekrarlanan feature_id '{fid}'")
            feature_ids.add(fid)
            if "derived_from" in f and "measurement_method" not in f:
                rep.warn(f"feature '{fid}': derived_from var ama measurement_method yok")
        rep.ok(f"style_scoring_rules.json: {len(feature_ids)} feature tanımlı")

        # derived_from zinciri çözülebilir mi
        for f in scoring.get("features", []):
            for dep in f.get("derived_from", []) or []:
                if dep not in feature_ids:
                    rep.err(f"feature '{f['feature_id']}': derived_from '{dep}' tanımlı değil")

    material_ids: set[str] = set()
    family_map: dict[str, str] = {}
    if mfg:
        for entry in mfg.get("materials", {}).get("entries", []):
            mid = entry.get("material_id")
            if not mid:
                rep.err("manufacturing_constraints.json: material_id'siz kayıt")
                continue
            if mid in material_ids:
                rep.err(f"manufacturing_constraints.json: tekrarlanan material_id '{mid}'")
            material_ids.add(mid)
            family_map[mid] = entry.get("family", "?")
            for req in ("min_thickness_mm", "valid_processes", "structural_grade", "cost_tier"):
                if req not in entry:
                    rep.warn(f"malzeme '{mid}': '{req}' alanı eksik")
        for fam, members in mfg.get("materials", {}).get("families", {}).items():
            for m in members:
                if m not in material_ids:
                    rep.warn(f"malzeme ailesi '{fam}': '{m}' entries[] tablosunda tanımlı değil (kural motoru limitleri bilinmiyor)")
        rep.ok(f"manufacturing_constraints.json: {len(material_ids)} malzeme kaydı, "
               f"{len(mfg.get('structural_rules', []))} STR + {len(mfg.get('ergonomic_rules', []))} ERG + "
               f"{len(mfg.get('manufacturing_rules', []))} MFG + {len(mfg.get('design_logic_rules', []))} DL kuralı")

        # kural kimlik çakışması ve severity geçerliliği
        seen_checks: set[str] = set()
        valid_sev = set(mfg.get("severity_levels", {}).keys())
        for group in ("structural_rules", "ergonomic_rules", "manufacturing_rules", "design_logic_rules"):
            for rule in mfg.get(group, []):
                cid = rule.get("check_id")
                if cid in seen_checks:
                    rep.err(f"manufacturing_constraints.json: tekrarlanan check_id '{cid}'")
                seen_checks.add(cid)
                if rule.get("severity") not in valid_sev:
                    rep.err(f"kural '{cid}': geçersiz severity '{rule.get('severity')}'")
                for req in ("name", "statement", "statement_tr", "severity", "test"):
                    if req not in rule:
                        rep.err(f"kural '{cid}': zorunlu alan '{req}' eksik")
        rep.ok(f"manufacturing_constraints.json: {len(seen_checks)} benzersiz kural kimliği")

    # --- 3. taksonomi -----------------------------------------------------
    parts_data = load_json(os.path.join(root, "furniture_parts.json"), rep)
    if parts_data and parts_schema:
        validate_against_schema(parts_data, parts_schema, "furniture_parts.json", rep)

    known_types = collect_furniture_types(parts_schema) if parts_schema else set()
    known_roles = collect_part_roles(parts_schema) if parts_schema else set()
    known_procs = collect_process_ids(parts_schema) if parts_schema else set()
    known_joints = collect_joint_types(parts_schema) if parts_schema else set()

    taxonomy_types: list[str] = []
    if parts_data:
        kind = parts_data.get("kind")
        if kind == "taxonomy_set":
            tax_root = parts_data.get("taxonomy_set", {}) or {}
        elif kind == "taxonomy":
            tax_root = {"types": [parts_data.get("taxonomy", {})]}
        else:
            tax_root = {}
            rep.err(f"furniture_parts.json: beklenmeyen kind '{kind}'")
        if not tax_root.get("types"):
            rep.err("furniture_parts.json: hiç tür taksonomisi yok")
        for t in tax_root.get("types", []):
            ft = t.get("furniture_type")
            taxonomy_types.append(ft)
            if ft not in known_types:
                rep.err(f"taksonomi: '{ft}' şema furnitureTypeId enum'unda yok")
            for _p, key, val in walk(t.get("parts", [])):
                if key == "structural_role" and val not in known_roles:
                    rep.err(f"taksonomi [{ft}]: geçersiz structural_role '{val}'")
                if key == "material_id" and material_ids and val not in material_ids:
                    rep.warn(f"taksonomi [{ft}]: material_id '{val}' malzeme tablosunda yok")
                if key == "feature_id" and feature_ids and val not in feature_ids:
                    rep.err(f"taksonomi [{ft}]: style_contribution feature_id '{val}' tanımlı değil")
                if key in ("primary_processes", "alternative_processes"):
                    for pr in val or []:
                        if pr not in known_procs:
                            rep.err(f"taksonomi [{ft}]: geçersiz process '{pr}'")
                if key == "typical_joint_to_parent" and val not in known_joints:
                    rep.err(f"taksonomi [{ft}]: geçersiz joint '{val}'")
        rep.ok(f"furniture_parts.json: {len(taxonomy_types)} tam taksonomi "
               f"({', '.join(taxonomy_types)})")
        missing_types = sorted(known_types - set(taxonomy_types))
        if missing_types:
            rep.warn(f"enum'da olup tam taksonomisi yazılmamış {len(missing_types)} tür: {', '.join(missing_types)}")
        # cross index tutarlılığı
        for row in tax_root.get("cross_type_part_index", {}).get("parts", []):
            if row.get("structural_role") not in known_roles:
                rep.err(f"cross_type_part_index: '{row.get('part_id')}' geçersiz structural_role")

    # --- 4. stiller -------------------------------------------------------
    styles_dir = os.path.join(root, "styles")
    style_files = sorted(f for f in os.listdir(styles_dir) if f.endswith((".yaml", ".yml")))
    known_style_ids = {f.rsplit(".", 1)[0] for f in style_files}
    planned_style_ids = set()
    if scoring:
        planned_style_ids = {s["style_id"] for s in scoring.get("style_registry", {}).get("planned_styles", [])}
    loaded_styles: dict[str, dict] = {}
    for fname in style_files:
        path = os.path.join(styles_dir, fname)
        data = load_yaml(path, rep)
        if data is None:
            continue
        if style_schema:
            validate_against_schema(data, style_schema, f"styles/{fname}", rep)
        sid = data.get("style_id")
        if not sid:
            rep.err(f"styles/{fname}: style_id yok")
            continue
        if sid in loaded_styles:
            rep.err(f"styles/{fname}: tekrarlanan style_id '{sid}'")
        loaded_styles[sid] = data

        expected_stem = sid
        if not fname.startswith(expected_stem):
            rep.warn(f"styles/{fname}: dosya adı style_id '{sid}' ile başlamıyor")

        # target_vector feature kontrolü
        sig = data.get("scoring_signature", {})
        tv = sig.get("target_vector", {}) or {}
        weights = sig.get("weights", {}) or {}
        if len(tv) < 5:
            rep.err(f"stil '{sid}': target_vector en az 5 feature içermeli ({len(tv)} var)")
        for fid in tv:
            if feature_ids and fid not in feature_ids:
                rep.err(f"stil '{sid}': target_vector feature '{fid}' style_scoring_rules.json'da tanımlı değil")
        for fid in weights:
            if feature_ids and fid not in feature_ids:
                rep.err(f"stil '{sid}': weights feature '{fid}' tanımlı değil")
            if fid not in tv:
                rep.warn(f"stil '{sid}': weights '{fid}' target_vector'da yok (ağırlık etkisiz)")
        for gate in sig.get("hard_gates", []) or []:
            gid = gate.get("feature_id")
            if feature_ids and gid not in feature_ids:
                rep.err(f"stil '{sid}': hard_gate feature '{gid}' tanımlı değil")

        # part_directives rol kontrolü
        pd_roles = set()
        for pd in data.get("part_directives", []) or []:
            role = pd.get("part_role")
            pd_roles.add(role)
            if known_roles and role not in known_roles:
                rep.err(f"stil '{sid}': part_directives role '{role}' şema enum'unda yok")
            if not pd.get("directive_tr"):
                rep.warn(f"stil '{sid}': part_directives[{role}] directive_tr eksik")
        rep.ok(f"stil '{sid}': {len(tv)} hedef feature, {len(sig.get('hard_gates', []) or [])} hard gate, "
               f"{len(data.get('part_directives', []) or [])} part directive, "
               f"{len(data.get('forbidden_signals', []) or [])} yasak sinyal")

        # forbidden_signals.detected_by kontrolü
        for fs in data.get("forbidden_signals", []) or []:
            for det in fs.get("detected_by", []) or []:
                if feature_ids and det not in feature_ids:
                    rep.err(f"stil '{sid}': forbidden_signal '{fs.get('id')}' detected_by '{det}' tanımlı değil")

        # material id kontrolü
        for grp in ("primary", "secondary", "accent"):
            for m in data.get("materials", {}).get(grp, []) or []:
                mid = m.get("material_id")
                if material_ids and mid not in material_ids:
                    rep.warn(f"stil '{sid}': material_id '{mid}' malzeme tablosunda yok (fizik limitleri bilinmiyor)")

        # uyumluluk referansları
        for key in ("blends_well_with", "conflicts_with"):
            for ref in data.get("compatibility", {}).get(key, []) or []:
                if ref in known_style_ids or os.path.exists(os.path.join(styles_dir, f"{ref}.yaml")):
                    continue
                if ref in planned_style_ids:
                    continue
                rep.warn(f"stil '{sid}': compatibility.{key} '{ref}' ne yüklü ne planlı stiller arasında")

    # stil kayıt defteri <-> dosyalar
    if scoring:
        registry = {s["style_id"] for s in scoring.get("style_registry", {}).get("styles", [])}
        for sid, data in loaded_styles.items():
            if sid not in registry:
                rep.err(f"stil '{sid}' dosyada var ama style_registry'de yok")
        for sid in registry - set(loaded_styles):
            rep.err(f"stil '{sid}' style_registry'de var ama YAML dosyası yok")
        for entry in scoring.get("style_registry", {}).get("styles", []):
            fpath = os.path.join(root, entry.get("file", ""))
            if not os.path.exists(fpath):
                rep.err(f"style_registry: '{entry.get('style_id')}' dosyası yok: {entry.get('file')}")
            for sf in entry.get("signature_features", []) or []:
                if feature_ids and sf not in feature_ids:
                    rep.err(f"style_registry '{entry.get('style_id')}': signature_feature '{sf}' tanımlı değil")

        for rec in data.get("compatibility", {}).get("hybrid_recipes", []) or []:
            rid = rec.get("result_style_id")
            mix = rec.get("mix", []) or []
            if len(mix) < 2:
                rep.err(f"stil '{sid}': hybrid_recipe '{rid}' en az 2 bileşen içermeli")
            total = sum(m.get("ratio", 0) for m in mix)
            if abs(total - 1.0) > 0.01:
                rep.err(f"stil '{sid}': hybrid_recipe '{rid}' oranları toplamı {total} (1.0 olmalı)")
            for m in mix:
                if m.get("style_id") not in known_style_ids | planned_style_ids:
                    rep.warn(f"stil '{sid}': hybrid_recipe '{rid}' bilinmeyen stil '{m.get('style_id')}' içeriyor")

    # --- 4b. malzeme tablosu <-> şema enum çapraz kontrolü ---
    if mfg and known_procs:
        bad = set()
        for e in mfg.get("materials", {}).get("entries", []):
            for pr in e.get("valid_processes", []) or []:
                if pr not in known_procs:
                    bad.add(pr)
        if bad:
            rep.err(f"manufacturing_constraints.json valid_processes şema processId enum'unda yok: {sorted(bad)}")
        else:
            rep.ok("malzeme tablosundaki tüm valid_processes şema processId enum'u ile uyumlu")
    if mfg and parts_data:
        # taksonomide kullanılan tüm material_id'ler tabloda var mı
        used = {v for _p, k, v in walk(parts_data) if k == "material_id"}
        unknown = sorted(m for m in used if material_ids and m not in material_ids)
        if unknown:
            rep.err(f"taksonomide kullanılan ama malzeme tablosunda olmayan material_id: {unknown}")
        else:
            rep.ok(f"taksonomideki {len(used)} material_id'nin tamamı malzeme tablosunda tanımlı")

    # --- 5. negatif prompt ------------------------------------------------
    if negp and loaded_styles:
        ssd = negp.get("style_specific_defaults", {})
        for sid in ssd:
            if sid == "notes":
                continue
            if sid not in loaded_styles:
                rep.warn(f"negative_prompts.json: style_specific_defaults '{sid}' yüklü stiller arasında değil")
        asm = negp.get("assembly", {})
        order = asm.get("order", [])
        for cat in negp.get("global", {}):
            if cat not in order:
                rep.warn(f"negative_prompts.json: global kategori '{cat}' assembly.order içinde yok")
        rep.ok(f"negative_prompts.json: {len(negp.get('global', {}))} global kategori, "
               f"{len(ssd) - 1} stil yedeği, max_tokens={asm.get('max_tokens')}")

    # --- 6. pipeline ------------------------------------------------------
    pipe_path = os.path.join(root, "pipelines/live_sketch_to_design_brief.pipeline.yaml")
    pipe = load_yaml(pipe_path, rep)
    if pipe:
        stages = pipe.get("stages", []) or []
        rep.ok(f"pipeline: {len(stages)} aşama, "
               f"{len(pipe.get('feedback_contract', {}).get('events', []) or [])} geri bildirim olayı, "
               f"{len(pipe.get('model_stack', []) or [])} model katmanı")
        for st in stages:
            sid = st.get("id")
            for req in ("stage", "id", "name_tr", "trigger", "steps", "outputs"):
                if req not in st:
                    rep.err(f"pipeline stage '{sid}': '{req}' alanı eksik")
            for key in ("prompt_ref", "config_ref"):
                ref = st.get(key)
                if not ref:
                    continue
                base = ref.split("#")[0]
                if not os.path.exists(os.path.join(root, base)):
                    rep.err(f"pipeline stage '{sid}': {key} '{ref}' diskte yok")
            if st.get("model") is None and st.get("id") not in ("ingest_normalize",):
                rep.warn(f"pipeline stage '{sid}': model alanı yok")
        # input/output contract var mı
        for key in ("input_contract", "output_contract", "feedback_contract", "orchestration", "error_handling"):
            if key not in pipe:
                rep.err(f"pipeline: '{key}' bloğu eksik")
        oc = pipe.get("output_contract", {})
        rms = oc.get("region_metadata_schema", {}).get("fields", {})
        required_region_fields = {
            "region_type", "structural_role", "material_hint",
            "proportion_hint", "ornament_hint", "style_signal", "confidence",
        }
        missing = required_region_fields - set(rms)
        if missing:
            rep.err(f"pipeline region_metadata_schema: eksik zorunlu alanlar {sorted(missing)}")
        else:
            rep.ok("pipeline region_metadata_schema: istenen 7 alanın tamamı mevcut "
                   "(region_type, structural_role, material_hint, proportion_hint, ornament_hint, style_signal, confidence)")
        # region_type / structural_role enum uyumu
        rms_roles = set()
        sr = rms.get("structural_role", {})
        rms_roles = set(sr.get("enum", []))
        if known_roles and rms_roles and not rms_roles <= known_roles:
            rep.err(f"pipeline structural_role enum'u şemadan sapıyor: {sorted(rms_roles - known_roles)}")
        ex = pipe.get("example_flow", {})
        if not ex.get("steps"):
            rep.warn("pipeline: example_flow.steps boş")

    # --- 7. promptlar -----------------------------------------------------
    for pname in ("image_to_parts_prompt.txt", "part_explanation_prompt.txt"):
        p = os.path.join(root, "prompts", pname)
        if not os.path.exists(p):
            rep.err(f"prompts/{pname} yok")
            continue
        text = open(p, encoding="utf-8").read()
        if pname == "image_to_parts_prompt.txt":
            for task in ("TASK_A_TYPE_ONLY", "TASK_B_PART_EXTRACTION", "TASK_C_STYLE_FEATURES", "TASK_D_DESIGN_DNA"):
                if task not in text:
                    rep.err(f"prompts/{pname}: '{task}' bloğu eksik")
                else:
                    rep.ok(f"prompts/{pname}: {task} mevcut")
            # TASK_C'de tüm feature'lar soruluyor mu
            if feature_ids and scoring:
                missing = [f for f in sorted(feature_ids) if f not in text]
                if missing:
                    rep.warn(f"prompts/{pname}: {len(missing)} feature TASK_C listesinde geçmiyor: {missing[:12]}")
                else:
                    rep.ok(f"prompts/{pname}: {len(feature_ids)} feature'ın tamamı TASK_C'de listelenmiş")
        else:
            for mode in ("MODE = brief", "MODE = full", "MODE = teaching"):
                if mode not in text:
                    rep.err(f"prompts/{pname}: '{mode}' bloğu eksik")
                else:
                    rep.ok(f"prompts/{pname}: {mode} mevcut")

    # --- 8. roadmap / readme ---------------------------------------------
    for doc in ("docs/mvp_roadmap.md", "README.md"):
        p = os.path.join(root, doc)
        if not os.path.exists(p):
            rep.warn(f"{doc} yok")
        else:
            rep.ok(f"{doc} mevcut ({os.path.getsize(p)} bayt)")

    return rep.dump()


if __name__ == "__main__":
    sys.exit(main())
