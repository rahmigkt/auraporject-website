#!/usr/bin/env python3
"""
FDE referans stil skorlayıcı — rules/style_scoring_rules.json formülünün birebir uygulaması.

Kullanım:
    python3 tools/reference_scorer.py --demo
    python3 tools/reference_scorer.py --features path/to/features.json
    python3 tools/reference_scorer.py --demo --style gothic_minimalism --explain

features.json biçimi:
    { "feature_id": 0.0..1.0, ... }            (yalnızca ölçebildiklerini ver; kalanı varsayılır)
  veya
    { "features": {...}, "evidence_coverage": 0.8 }

Bu dosya bir ÜRÜN bileşeni değil, referans implementasyondur: kural motorunu
yazarken formülün tam olarak ne yaptığını gösterir ve birim test olarak kullanılır.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from typing import Any

try:
    import yaml
except ImportError:
    print("HATA: pyyaml gerekli -> pip install pyyaml", file=sys.stderr)
    sys.exit(2)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

GRADES = [("A", 85), ("B", 70), ("C", 55), ("D", 40), ("F", 0)]

STYLE_REGISTRY: dict = {}


# --------------------------------------------------------------------------- #
# yükleme
# --------------------------------------------------------------------------- #
def load_scoring_rules(root: str) -> dict:
    with open(os.path.join(root, "rules/style_scoring_rules.json"), encoding="utf-8") as fh:
        return json.load(fh)


def load_style(root: str, style_id: str) -> dict:
    registry = STYLE_REGISTRY
    entry = next((s for s in registry.get("styles", []) if s["style_id"] == style_id), None)
    rel = entry["file"] if entry else f"styles/{style_id}.yaml"
    with open(os.path.join(root, rel), encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def feature_registry(rules: dict) -> dict[str, dict]:
    return {f["feature_id"]: f for f in rules.get("features", [])}


# --------------------------------------------------------------------------- #
# türetilmiş feature'lar
# --------------------------------------------------------------------------- #
def apply_derivations(measured: dict[str, float], registry: dict[str, dict]) -> dict[str, float]:
    """derived_from işaretli feature'ları hesaplar (ornament_restraint = 1 - ornament_density vb.)."""
    out = dict(measured)
    # basit complement türetmeleri (normalizer alanı '1 - X' biçiminde olanlar)
    complements = {
        "ornament_restraint": "ornament_density",
        "reflectance_profile": "gloss_absence",
        "ornament_is_structural": "ornament_is_applied",
    }
    for target, source in complements.items():
        if target not in out and source in out:
            out[target] = round(1.0 - float(out[source]), 4)
    return out


def fill_defaults(measured: dict[str, float], registry: dict[str, dict]) -> tuple[dict[str, float], float]:
    """
    Ölçülmeyen feature'ları varsayılan değerle doldurur.
    Döndürür: (tam vektör, evidence_coverage)
    """
    full: dict[str, float] = {}
    filled = 0
    total = 0
    for fid, spec in registry.items():
        total += 1
        if fid in measured and measured[fid] is not None:
            full[fid] = max(0.0, min(1.0, float(measured[fid])))
        else:
            full[fid] = float(spec.get("default_value", 0.5))
            filled += 1
    coverage = 1.0 if total == 0 else (total - filled) / total
    return full, coverage


# --------------------------------------------------------------------------- #
# çekirdek formül
# --------------------------------------------------------------------------- #
def clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def weighted_cosine(m: dict[str, float], t: dict[str, float], w: dict[str, float], default_w: float = 0.5) -> float:
    num = den_m = den_t = 0.0
    for fid, tv in t.items():
        wi = float(w.get(fid, default_w))
        mv = float(m.get(fid, 0.5))
        num += wi * mv * tv
        den_m += wi * mv * mv
        den_t += wi * tv * tv
    if den_m <= 0 or den_t <= 0:
        return 0.0
    return num / (math.sqrt(den_m) * math.sqrt(den_t))


def weighted_mad(m: dict[str, float], t: dict[str, float], w: dict[str, float], default_w: float = 0.5) -> float:
    """Agirlikli ortalama mutlak sapma (weighted mean absolute deviation)."""
    tot = wsum = 0.0
    for fid, tv in t.items():
        wi = float(w.get(fid, default_w))
        tot += wi * abs(float(m.get(fid, 0.5)) - float(tv))
        wsum += wi
    return tot / wsum if wsum else 1.0


# rules/style_scoring_rules.json -> score_formula ile birebir ayni sabitler
COSINE_WEIGHT = 0.25
DEVIATION_WEIGHT = 0.75
MAD_SCALE = 200.0


def similarity_score(m: dict[str, float], t: dict[str, float], w: dict[str, float]) -> tuple[float, float, float]:
    """(cosine, weighted_mad, similarity 0..100) dondurur."""
    cos = weighted_cosine(m, t, w)
    mad = weighted_mad(m, t, w)
    dev = max(0.0, 100.0 - MAD_SCALE * mad)
    return cos, mad, COSINE_WEIGHT * (cos * 100.0) + DEVIATION_WEIGHT * dev


def check_gate(gate: dict, m: dict[str, float]) -> bool:
    """Gate geçildiyse True, ihlal edildiyse False."""
    fid = gate["feature_id"]
    op = gate["op"]
    want = gate["value"]
    got = float(m.get(fid, 0.5))
    if op == ">=":
        return got >= want
    if op == "<=":
        return got <= want
    if op == "==":
        return abs(got - float(want)) < 1e-9
    if op == "!=":
        return abs(got - float(want)) >= 1e-9
    if op == "in":
        return got in (want if isinstance(want, list) else [want])
    if op == "not_in":
        return got not in (want if isinstance(want, list) else [want])
    raise ValueError(f"bilinmeyen gate operatörü: {op}")


def grade(score: float) -> str:
    for g, lo in GRADES:
        if score >= lo:
            return g
    return "F"


def score_style(measured: dict[str, float], style: dict) -> dict[str, Any]:
    sig = style.get("scoring_signature", {})
    target = sig.get("target_vector", {}) or {}
    weights = sig.get("weights", {}) or {}
    gates = sig.get("hard_gates", []) or []

    cos, mad, sim = similarity_score(measured, target, weights)
    raw = sim

    failed: list[dict] = []
    penalty = 0.0
    for gate in gates:
        if not check_gate(gate, measured):
            p = float(gate.get("penalty", 25))
            penalty += p
            failed.append({
                "feature_id": gate["feature_id"],
                "op": gate["op"],
                "required": gate["value"],
                "actual": round(float(measured.get(gate["feature_id"], 0.5)), 3),
                "penalty": p,
            })

    final = clamp(round(raw - penalty))
    matched = final >= sig.get("match_threshold", 0.6) * 100 and not failed

    # stil skorunu en çok etkileyen feature'lar (ağırlıklı sapma)
    deltas = []
    for fid, tv in target.items():
        wi = float(weights.get(fid, 0.5))
        mv = float(measured.get(fid, 0.5))
        deltas.append({
            "feature_id": fid,
            "measured": round(mv, 3),
            "target": round(tv, 3),
            "delta": round(mv - tv, 3),
            "weighted_abs_delta": round(wi * abs(mv - tv), 4),
        })
    deltas.sort(key=lambda d: -d["weighted_abs_delta"])

    return {
        "style_id": style["style_id"],
        "style_tr": style.get("name_tr", style.get("name")),
        "cosine": round(cos, 4),
        "weighted_mad": round(mad, 4),
        "raw_score": round(raw, 1),
        "gate_penalty": penalty,
        "score": final,
        "grade": grade(final),
        "matched": bool(matched),
        "match_threshold": sig.get("match_threshold", 0.6),
        "failed_gates": failed,
        "top_deviations": deltas[:6],
    }


# --------------------------------------------------------------------------- #
# verdict
# --------------------------------------------------------------------------- #
def make_verdict(result: dict, all_results: list[dict]) -> dict[str, str]:
    s = result["score"]
    sid = result["style_id"]
    str_tr = result["style_tr"]
    others = [r for r in all_results if r["style_id"] != sid]
    others.sort(key=lambda r: -r["score"])
    second = others[0] if others else None

    if result["failed_gates"]:
        gates = ", ".join(f"{g['feature_id']} ({g['actual']} {g['op']} {g['required']} değil)" for g in result["failed_gates"][:3])
        tr = (f"{str_tr} DEĞİL. Sert engeller ihlal edildi: {gates}. "
              f"Ham benzerlik {result['raw_score']}/100 olsa da {int(result['gate_penalty'])} puan ceza uygulandı.")
        en = (f"NOT {sid}. Hard gates violated: {gates}. "
              f"Raw similarity was {result['raw_score']}/100 but {int(result['gate_penalty'])} points were penalised.")
    elif s >= 85:
        tr = f"Kesin {str_tr}. Tasarım stilin çekirdek kurallarını tam karşılıyor ({s}/100)."
        en = f"Definitively {sid}. The design fully satisfies the style's core rules ({s}/100)."
    elif s >= 70:
        dev = result["top_deviations"][0] if result["top_deviations"] else None
        extra = f" En büyük sapma: {dev['feature_id']} ({dev['measured']} ölçüldü, hedef {dev['target']})." if dev else ""
        tr = f"Güçlü {str_tr} ({s}/100).{extra}"
        en = f"Strongly {sid} ({s}/100).{extra}"
    elif s >= 55:
        sec = f" {second['style_tr']} etkisi belirgin ({second['score']}/100)." if second else ""
        sec_en = f" Strong {second['style_id']} influence ({second['score']}/100)." if second else ""
        tr = f"Kısmen {str_tr} ({s}/100). Stil hibrit okunuyor.{sec}"
        en = f"Partially {sid} ({s}/100). Reads as a hybrid.{sec_en}"
    else:
        closest = all_results[0] if all_results else None
        tr = (f"{str_tr} DEĞİL (yalnızca {s}/100)."
              + (f" En yakın stil: {closest['style_tr']} ({closest['score']}/100)." if closest else ""))
        en = (f"NOT {sid} (only {s}/100)."
              + (f" Closest style: {closest['style_id']} ({closest['score']}/100)." if closest else ""))

    return {"verdict_tr": tr, "verdict_en": en}


# --------------------------------------------------------------------------- #
# demo ölçüm vektörü
# --------------------------------------------------------------------------- #
DEMO_FEATURES: dict[str, float] = {
    # ölçülmüş (deterministik + pixel + VLM) değerler
    "verticality": 0.84,
    "height_width_bias": 0.80,
    "pointed_arch_presence": 0.55,
    "ornament_density": 0.08,
    "ornament_is_applied": 0.10,
    "figurative_ornament": 0.00,
    "minimalism_index": 0.88,
    "part_count_leanness": 0.86,
    "gesture_count": 0.80,
    "material_honesty": 0.90,
    "faux_finish_absence": 0.95,
    "dark_materiality": 0.86,
    "low_key_palette": 0.88,
    "chroma_restraint": 0.93,
    "contrast_ratio": 0.78,
    "gloss_absence": 0.94,
    "structural_expression": 0.82,
    "void_ratio": 0.58,
    "geometric_strictness": 0.88,
    "edge_softness": 0.15,
    "symmetry_strictness": 0.82,
    "curvature_organic": 0.08,
    "warmth_index": 0.24,
    "shadow_as_design_element": 0.80,
    "handcraft_index": 0.48,
    "industrial_index": 0.50,
    "sacred_geometry": 0.50,
    "ritual_stillness": 0.84,
    "sculptural_index": 0.60,
    "massiveness": 0.52,
    "lightness_visual": 0.38,
    "modular_grid_index": 0.72,
    "modularity_index": 0.40,
    "historical_reference_index": 0.42,
    "futuristic_index": 0.10,
    "leg_verticality": 0.95,
    # kural motorundan gelen gate feature'ları
    "material_legality": 1.00,
    "ergonomic_compliance": 0.84,
    "structural_plausibility": 0.88,
    "originality_check": 0.86,
}

# Bilinçli olarak "bozuk" bir örnek: parlak, pastel, oymalı bir sandalye
DEMO_FEATURES_BAD: dict[str, float] = {
    **DEMO_FEATURES,
    "gloss_absence": 0.10,
    "chroma_restraint": 0.35,
    "figurative_ornament": 0.55,
    "ornament_density": 0.45,
    "ornament_is_applied": 0.90,
    "verticality": 0.40,
    "warmth_index": 0.75,
    "dark_materiality": 0.20,
    "ritual_stillness": 0.25,
}


# --------------------------------------------------------------------------- #
def run(measured_raw: dict[str, float], rules: dict, style_ids: list[str], explain: bool, label: str) -> dict:
    registry = feature_registry(rules)
    measured = apply_derivations(measured_raw, registry)
    full, coverage = fill_defaults(measured, registry)

    confidence = 0.85 * coverage  # VLM guven katsayisi (ASSUMPTION A3) x kanit kapsamsi

    results = []
    for sid in style_ids:
        try:
            style = load_style(ROOT, sid)
        except FileNotFoundError:
            print(f"  atlandı: stil dosyası bulunamadı ({sid})", file=sys.stderr)
            continue
        r = score_style(full, style)
        r["confidence_floor"] = style.get("scoring_signature", {}).get("confidence_floor", 0.4)
        results.append(r)

    results.sort(key=lambda r: -r["score"])
    matched_results = [r for r in results if r["matched"]]
    # primary: matched olanlar arasindan en yuksek; matched yoksa confidence_floor kontroluyle en yuksek
    # primary yalnizca kendi esigini VE sert engellerini gecen bir stil olabilir.
    # Hicbiri gecmiyorsa sonuc "unclassified"tir - en yuksek skorlu basarisiz stil
    # primary olarak atanmaz (yanlis pozitif riski).
    primary = matched_results[0] if matched_results else None

    confidence = 0.85 * coverage  # VLM güven katsayısı (ASSUMPTION A3) x kanıt kapsaması

    out = {
        "label": label,
        "evidence_coverage": round(coverage, 3),
        "confidence": round(confidence, 3),
        "primary_style": primary["style_id"] if primary else "unclassified",
        "primary_style_tr": primary["style_tr"] if primary else "stil belirlenemedi",
        "primary_score": primary["score"] if primary else 0,
        "rankings": [
            {
                "style_id": r["style_id"],
                "style_tr": r["style_tr"],
                "score": r["score"],
                "grade": r["grade"],
                "raw_score": r["raw_score"],
                "gate_penalty": r["gate_penalty"],
                "matched": r["matched"],
                "failed_gates": r["failed_gates"],
            }
            for r in results
        ],
    }
    if primary:
        out["verdict"] = make_verdict(primary, results)
    else:
        tops = ", ".join(f"{r['style_id']} {r['score']}/100" for r in results[:3])
        gates = {r["style_id"]: [g["feature_id"] for g in r["failed_gates"]] for r in results if r["failed_gates"]}
        out["verdict"] = {
            "verdict_tr": (f"Stil belirlenemedi. Hiçbir stil kendi eşik ve sert engellerini geçmedi "
                           f"(en yakın: {tops}). İhlal edilen engeller: "
                           + "; ".join(f"{k} -> {', '.join(v)}" for k, v in gates.items())
                           + ". Tasarım ya stiller arası ya da kural ihlali içeriyor."),
            "verdict_en": (f"Style could not be determined. No style passed its own threshold and hard gates "
                           f"(closest: {tops})."),
        }

    # ---- yazdır ----
    print(f"\n=== {label} ===")
    print(f"kanıt kapsaması: {coverage:.0%}   güven: {confidence:.2f}")
    print(f"{'stil':<22}{'ham':>7}{'ceza':>7}{'skor':>7}  {'not':<3}  eşleşme")
    print("-" * 66)
    for r in results:
        print(f"{r['style_id']:<22}{r['raw_score']:>7.1f}{int(r['gate_penalty']):>7}"
              f"{r['score']:>7}  {r['grade']:<3}  {'✓' if r['matched'] else '✗'}")
    if primary:
        v = out["verdict"]
        print(f"\nBİRİNCİL: {primary['style_id']} ({primary['style_tr']}) — {primary['score']}/100 [{primary['grade']}]")
        print(f"KARAR (tr): {v['verdict_tr']}")
        print(f"KARAR (en): {v['verdict_en']}")
        if explain:
            print("\nen etkili sapmalar:")
            for d in primary["top_deviations"]:
                arrow = "↑" if d["delta"] > 0 else ("↓" if d["delta"] < 0 else "=")
                print(f"  {d['feature_id']:<28} ölçülen {d['measured']:.2f} {arrow} hedef {d['target']:.2f}"
                      f"   (ağırlıklı sapma {d['weighted_abs_delta']:.3f})")
            if primary["failed_gates"]:
                print("\nihlal edilen sert engeller:")
                for g in primary["failed_gates"]:
                    print(f"  {g['feature_id']:<28} {g['actual']:.2f}  ({g['op']} {g['required']} gerekir)  ceza -{int(g['penalty'])}")
    else:
        v = out["verdict"]
        print("\nBİRİNCİL: unclassified (stil belirlenemedi)")
        print(f"KARAR (tr): {v['verdict_tr']}")
        if explain:
            for r in results:
                if r["failed_gates"]:
                    print(f"\n{r['style_id']} ihlalleri:")
                    for g in r["failed_gates"]:
                        print(f"  {g['feature_id']:<28} {g['actual']:.2f}  ({g['op']} {g['required']} gerekir)  ceza -{int(g['penalty'])}")
    return out


def main() -> int:
    global STYLE_REGISTRY, ROOT
    ap = argparse.ArgumentParser(description="FDE referans stil skorlayıcı")
    ap.add_argument("--root", default=ROOT)
    ap.add_argument("--demo", action="store_true", help="örnek feature vektörleriyle çalıştır")
    ap.add_argument("--features", help="JSON dosyasından feature vektörü oku")
    ap.add_argument("--style", help="yalnızca bu stil için detaylı verdict üret (demo ile)")
    ap.add_argument("--explain", action="store_true", help="en etkili sapmaları ve gate ihlallerini yazdır")
    ap.add_argument("--json", action="store_true", help="çıktıyı JSON olarak da yazdır")
    args = ap.parse_args()

    ROOT = os.path.abspath(args.root)
    rules = load_scoring_rules(ROOT)
    STYLE_REGISTRY = rules.get("style_registry", {})
    style_ids = [s["style_id"] for s in STYLE_REGISTRY.get("styles", [])]
    if not style_ids:
        print("HATA: style_registry boş", file=sys.stderr)
        return 2

    outputs = []
    if args.features:
        with open(args.features, encoding="utf-8") as fh:
            data = json.load(fh)
        feats = data.get("features", data)
        outputs.append(run(feats, rules, style_ids, args.explain, os.path.basename(args.features)))
    if args.demo or not args.features:
        outputs.append(run(DEMO_FEATURES, rules, style_ids, args.explain,
                           "DEMO · gotik minimal bir sandalye (iyi örnek)"))
        outputs.append(run(DEMO_FEATURES_BAD, rules, style_ids, args.explain,
                           "DEMO · parlak/pastel/oymalı bir sandalye (kötü örnek, gate'ler devreye girer)"))

    if args.json:
        print("\n--- JSON ---")
        print(json.dumps(outputs, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
