#!/usr/bin/env python3
"""
styles/*.yaml dosyalarını okunabilir, yorumlu, blok-stilli olarak yeniden yazar.
safe_dump'ın bozduğu biçimi onarır; schema_version'ı tekrar string yapar.
Tek seferlik bakım aracıdır (build-time), ürün çalışma zamanında kullanılmaz.
"""
import datetime
import io
import json
import os
import re
import sys

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
STYLES = os.path.join(os.path.dirname(HERE), "styles")

# YAML 1.1 tuzagi: "1.0.0" sexagesimal sayiya donusur -> surum alanlari hep tirnaklanir.
ALWAYS_QUOTE_KEYS = {"schema_version", "version"}

NEEDS_QUOTE = re.compile(r"^[#&*!|>%@`{}\[\],'\"]|: |:$|^\s|\s$|^-$|^$|"
                         r"^(true|false|null|yes|no|on|off|~)$|"
                         r"^-?\d+(\.\d+)?([eE][-+]?\d+)?$|"
                         r"^-?\d+:\d", re.I)


def q(s) -> str:
    s = "" if s is None else str(s)
    s = s.rstrip("\n") if s.endswith("\n") else s
    if s == "":
        return "''"
    if "\n" in s:
        # çok satırlı -> katlanmış blok skaler yerine tırnaklı tek satır (round-trip güvenli)
        return "'" + s.replace("\n", " ").replace("'", "''") + "'"
    if NEEDS_QUOTE.search(s) or DATE_LIKE.match(s) or VERSION_LIKE.match(s):
        return "'" + s.replace("'", "''") + "'"
    return s


def is_short_flow_dict(d) -> bool:
    """palette / ratio_presets gibi satır içi yazılacak küçük sözlükler."""
    if not isinstance(d, dict) or not d:
        return False
    if any(isinstance(v, (dict, list)) for v in d.values()):
        return False
    return all(isinstance(k, str) for k in d)


def flow_dict(d) -> str:
    parts = []
    for k, v in d.items():
        if isinstance(v, bool):
            vs = "true" if v else "false"
        elif v is None:
            vs = "null"
        elif isinstance(v, (int, float)):
            vs = repr(v)
        else:
            vs = q(v)
        parts.append(f"{k}: {vs}")
    return "{ " + ", ".join(parts) + " }"


VERSION_LIKE = re.compile(r"^-?\d+(\.\d+){1,}$")
# ISO tarih/saat dizeleri tirnaklanmazsa PyYAML bunlari datetime.date'e cevirir
DATE_LIKE = re.compile(r"^-?\d{4}-\d{2}-\d{2}([Tt ].*)?$")


def scalar(v) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, float):
        return repr(v)
    if isinstance(v, (datetime.date, datetime.datetime)):
        return "'" + v.isoformat() + "'"
    # "1.0.0" gibi surum dizeleri YAML 1.1'de sexagesimal sayiya donusur -> zorla tirnakla
    if isinstance(v, str) and (VERSION_LIKE.match(v.strip()) or DATE_LIKE.match(v.strip())):
        return "'" + v.strip() + "'"
    return q(v)


def emit(node, out: io.StringIO, ind: int, in_list: bool = False) -> None:
    pad = " " * ind
    if isinstance(node, dict):
        if not node:
            out.write(pad + "{}\n")
            return
        first = True
        for k, v in node.items():
            prefix = pad if not (in_list and first) else pad
            if isinstance(v, dict) and v:
                out.write(f"{prefix}{k}:\n")
                emit(v, out, ind + 2, False)
            elif isinstance(v, list) and v:
                # kısa ve tümü skaler -> satır içi akış
                if all(not isinstance(x, (dict, list)) for x in v) and sum(len(str(x)) for x in v) < 60:
                    items = ", ".join(scalar(x) for x in v)
                    out.write(f"{prefix}{k}: [{items}]\n")
                else:
                    out.write(f"{prefix}{k}:\n")
                    emit(v, out, ind + 2, False)
            elif isinstance(v, dict) and not v:
                out.write(f"{prefix}{k}: " + "{}\n")
            elif isinstance(v, list) and not v:
                out.write(f"{prefix}{k}: []\n")
            else:
                out.write(f"{prefix}{k}: {q(v) if k in ALWAYS_QUOTE_KEYS and isinstance(v, str) else scalar(v)}\n")
            first = False
    elif isinstance(node, list):
        for item in node:
            if isinstance(item, dict) and item:
                if is_short_flow_dict(item) and len(flow_dict(item)) <= 108 and ind <= 8:
                    out.write(f"{pad}- {flow_dict(item)}\n")
                    continue
                # ilk anahtar "- " ile, kalanlar girintili
                keys = list(item.items())
                k0, v0 = keys[0]
                if isinstance(v0, (dict, list)) and v0:
                    out.write(f"{pad}- {k0}:\n")
                    emit(v0, out, ind + 4, False)
                else:
                    out.write(f"{pad}- {k0}: {scalar(v0)}\n")
                for k, v in keys[1:]:
                    sub = " " * (ind + 2)
                    if isinstance(v, dict) and v:
                        out.write(f"{sub}{k}:\n")
                        emit(v, out, ind + 4, False)
                    elif isinstance(v, list) and v:
                        if all(not isinstance(x, (dict, list)) for x in v) and sum(len(str(x)) for x in v) < 58:
                            items = ", ".join(scalar(x) for x in v)
                            out.write(f"{sub}{k}: [{items}]\n")
                        else:
                            out.write(f"{sub}{k}:\n")
                            emit(v, out, ind + 4, False)
                    elif isinstance(v, list) and not v:
                        out.write(f"{sub}{k}: []\n")
                    elif isinstance(v, dict) and not v:
                        out.write(f"{sub}{k}: " + "{}\n")
                    else:
                        out.write(f"{sub}{k}: {scalar(v)}\n")
            elif isinstance(item, list):
                out.write(f"{pad}-\n")
                emit(item, out, ind + 2, True)
            else:
                out.write(f"{pad}- {scalar(item)}\n")
    else:
        out.write(pad + scalar(node) + "\n")


BANNERS = {
    "gothic_minimalism": """\
# =============================================================================
# FDE / styles / gothic_minimalism.yaml
# Gotik Minimalizm — hibrit sanat stili profili
# Şema: ../schemas/style_ontology.schema.json (v1.0.0)
#
# TEMEL FİKİR:
#   Gotik dikeylik + sivri kemer + gölge + taş/ahşap/metin sertliği + ritüel sessizlik
#   MINIMALİZM azaltma + boşluk + malzeme dürüstlüğü + süsleme disiplini
#   => "Katedrali oyma, katedrali azalt."
#
# scoring_signature.match_threshold = 0.60 (blend formülüyle kalibre edildi;
# referans ölçüm: tools/reference_scorer.py --demo -> 93.6/100 iyi örnek)
# =============================================================================
""",
    "bauhaus": """\
# =============================================================================
# FDE / styles / bauhaus.yaml   (schema: ../schemas/style_ontology.schema.json v1.0.0)
# Form follows function · geometric primitives · machine reproducibility
# match_threshold = 0.58
# =============================================================================
""",
    "japandi": """\
# =============================================================================
# FDE / styles / japandi.yaml   (schema: ../schemas/style_ontology.schema.json v1.0.0)
# İskandinav işlevsel sıcaklığı + Japon birleşim disiplini + wabi-sabi
# match_threshold = 0.60
# =============================================================================
""",
    "art_deco": """\
# =============================================================================
# FDE / styles / art_deco.yaml   (schema: ../schemas/style_ontology.schema.json v1.0.0)
# Kompozisyonel lüks · katı simetri · basamaklı kütle · geometrik süsleme
# match_threshold = 0.56
# =============================================================================
""",
    "brutalism": """\
# =============================================================================
# FDE / styles / brutalism.yaml   (schema: ../schemas/style_ontology.schema.json v1.0.0)
# Malzeme olduğu gibi · kütle mesajdır · yük yolu kompozisyondur
# match_threshold = 0.62
# =============================================================================
""",
}

SECTION_COMMENTS = [
    ("core_principles:", "# -----------------------------------------------------------------------------\n# ÇEKİRDEK İLKELER (ağırlıklı, test_edilebilir)\n"),
    ("forms:", "# -----------------------------------------------------------------------------\n# FORM DİLİ\n"),
    ("materials:", "# -----------------------------------------------------------------------------\n# MALZEMELER (primary / secondary / accent / forbidden / combination_rules)\n"),
    ("colors:", "# -----------------------------------------------------------------------------\n# RENK\n"),
    ("textures:", "# -----------------------------------------------------------------------------\n# DOKU\n"),
    ("ornament_rules:", "# -----------------------------------------------------------------------------\n# SÜSLEME KURALLARI\n"),
    ("proportions:", "# -----------------------------------------------------------------------------\n# ORANLAR\n"),
    ("lighting_and_shadow:", "# -----------------------------------------------------------------------------\n# IŞIK VE GÖLGE (render direktifleri dahil)\n"),
    ("emotional_keywords:", "# -----------------------------------------------------------------------------\n# DUYGUSAL ANAHTAR KELİMELER\n"),
    ("forbidden_signals:", "# -----------------------------------------------------------------------------\n# YASAK SİNYALLER (hard = tasarım reddedilir, soft = skor düşer)\n"),
    ("positive_prompt_tokens:", "# -----------------------------------------------------------------------------\n# POZİTİF PROMPT TOKEN'LARI\n"),
    ("negative_prompt_tokens:", "# -----------------------------------------------------------------------------\n# NEGATİF PROMPT TOKEN'LARI\n"),
    ("manufacturing_notes:", "# -----------------------------------------------------------------------------\n# ÜRETİM NOTLARI\n"),
    ("historical_references:", "# -----------------------------------------------------------------------------\n# TARİHSEL REFERANSLAR (yalnızca ilke/oran çıkarımı; birebir kopya YOK)\n"),
    ("scoring_signature:", "# -----------------------------------------------------------------------------\n# SKORLAMA İMZASI — rules/style_scoring_rules.json feature_id'leri ile eşleşir\n"),
    ("part_directives:", "# -----------------------------------------------------------------------------\n# PARÇA DİREKTİFLERİ — her parça bu stilde nasıl davranır?\n# part_role değerleri schemas/furniture_parts.schema.json -> $defs.partRoleId\n"),
    ("sketch_feedback:", "# -----------------------------------------------------------------------------\n# CANLI ÇİZİM GERİ BİLDİRİM CÜMLELERİ\n"),
    ("compatibility:", "# -----------------------------------------------------------------------------\n# STİL UYUMLULUĞU VE HİBRİT TARİFLERİ\n"),
    ("compliance:", "# -----------------------------------------------------------------------------\n# YASAL / ETİK UYUM\n"),
    ("meta:", "# -----------------------------------------------------------------------------\n# META\n"),
]


def strip_trailing_newlines(node):
    if isinstance(node, (datetime.date, datetime.datetime)):
        return node.isoformat()
    if isinstance(node, str):
        return node.rstrip("\n")
    if isinstance(node, dict):
        return {k: strip_trailing_newlines(v) for k, v in node.items()}
    if isinstance(node, list):
        return [strip_trailing_newlines(v) for v in node]
    return node


def main() -> int:
    for fname in sorted(os.listdir(STYLES)):
        if not fname.endswith(".yaml"):
            continue
        stem = fname[:-5]
        path = os.path.join(STYLES, fname)
        with open(path, encoding="utf-8") as fh:
            data = yaml.safe_load(fh)

        # onarım: schema_version tekrar string olmalı
        sv = data.get("schema_version")
        if isinstance(sv, float):
            data["schema_version"] = f"{sv:.1f}.0"
        data["schema_version"] = str(data["schema_version"])

        # anahtar sırası: şemanın zorunlu alan sırasını koru
        order = ["schema_version", "style_id", "name", "name_tr", "family", "era",
                 "origin_regions", "description", "description_tr", "core_principles",
                 "forms", "materials", "colors", "textures", "ornament_rules",
                 "proportions", "lighting_and_shadow", "emotional_keywords",
                 "emotional_keywords_tr", "forbidden_signals", "positive_prompt_tokens",
                 "negative_prompt_tokens", "manufacturing_notes", "historical_references",
                 "scoring_signature", "part_directives", "sketch_feedback",
                 "compatibility", "compliance", "meta"]
        ordered = {k: data[k] for k in order if k in data}
        for k in data:
            ordered.setdefault(k, data[k])

        ordered = strip_trailing_newlines(ordered)
        buf = io.StringIO()
        emit(ordered, buf, 0, False)
        body = buf.getvalue()

        # bölüm yorumlarını geri ekle
        for key, comment in SECTION_COMMENTS:
            body = re.sub(rf"(?m)^({re.escape(key)})", comment + r"\1", body, count=1)

        out_text = BANNERS.get(stem, "") + "\n" + body
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(out_text)
        print(f"  yeniden yazıldı: {fname} ({len(out_text)} bayt, {out_text.count(chr(10))} satır)")

    # doğrulama: yeniden yüklenip şema alanları duruyor mu
    print("\ndoğrulama:")
    for fname in sorted(os.listdir(STYLES)):
        if not fname.endswith(".yaml"):
            continue
        with open(os.path.join(STYLES, fname), encoding="utf-8") as fh:
            d = yaml.safe_load(fh)
        required = ["schema_version", "style_id", "name", "name_tr", "description",
                    "core_principles", "forms", "materials", "colors", "textures",
                    "ornament_rules", "proportions", "emotional_keywords",
                    "forbidden_signals", "positive_prompt_tokens", "negative_prompt_tokens",
                    "manufacturing_notes", "historical_references", "scoring_signature",
                    "part_directives"]
        missing = [k for k in required if k not in d]
        sv = d.get("schema_version")
        print(f"  {fname:<28} schema_version={sv!r} eksik={missing or 'yok'} "
              f"part_directives={len(d.get('part_directives', []))} "
              f"target_vector={len(d.get('scoring_signature', {}).get('target_vector', {}))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
