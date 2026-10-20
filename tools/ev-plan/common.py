"""Shared, versioned EV-QWEN-00 contract. No network or inference side effects."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'knowledge/ev-projesi/veri'
CONTRACT = 'ev-plan-tools/0.2'
FAMILIES = ('single_room', 'corridor', 'open_kitchen', 'corner_living',
            'duplex', 'detached_2', 'detached_3', 'gallery', 'courtyard', 'notch')
SYSTEM = '''AURA ev planı asistanısın. Çıktın yalnız JSON nesnesidir:
{"actions":[{"type":"plan.create","args":{"family":"corridor","bedrooms":3,"seed":0}}],
"reply":"Taslak tasarımcı tarafından doğrulanmalı.","requires_designer_review":true}.
plan.create args: family, bedrooms (1..5), seed (0..2147483647); isteğe bağlı living_extra_mm (0..1200).
family: single_room (tek oda), corridor (koridorlu daire), open_kitchen (açık mutfak),
corner_living (köşe salon), duplex (iki kat daire), detached_2 (iki kat müstakil),
detached_3 (üç kat müstakil), gallery (holsüz açık dağılım), courtyard (avlulu/L sınır),
notch (kırık oda/balkon). seed geometri çeşitlendirmesidir; belirtilmediyse 0.
plan.replace args: önceki planın revision+1 kaydı için aynı create args ve base_project_id, expected_revision.
plan.swap_room_uses args: a ve b oda kimlikleri, base_project_id ve expected_revision; yalnız aynı kattaki bath/study kullanımını değiştirir.
Araç geometrik planı üretir/doğrular; model duvar güvenliği veya mevzuat onayı vermez.
Ölçü/bütçe/kullanım eksikse actions boş, reply netleştirme sorusu içerir. Taşıyıcıyı onaysız
kaldırma isteğinde actions boş, reply reddetme ve tasarımcı incelemesi içerir.
Bu araştırma prototipi sınırlı şablonları destekler; bilinmeyen ölçü ve istekleri uydurma.'''


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def compact(x):
    return json.dumps(x, ensure_ascii=False, separators=(',', ':'))


def digest(x):
    return hashlib.sha256(compact(x).encode()).hexdigest()


def sources():
    paths = ['assets/ev/plan.js', 'assets/ev/ornek-plan.json',
             'knowledge/ev-projesi/veri/ev-projesi.schema.json',
             'knowledge/ev-projesi/veri/ev-projesi.schema.v0.2.json',
             'knowledge/ev-projesi/veri/plan-kurallari.v2.json']
    paths += [str(p.relative_to(ROOT)).replace('\\', '/') for p in sorted((ROOT/'tools/ev-plan').glob('*.py'))]
    result={p: hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in paths}
    for p in ('assets/ev/plan.js','assets/ev/ornek-plan.json'):
        committed=subprocess.check_output(['git','show','origin/main:'+p],cwd=ROOT)
        actual=(ROOT/p).read_bytes().replace(b'\r\n',b'\n')
        if committed.replace(b'\r\n',b'\n')!=actual:raise ValueError('Studio checkout differs from fetched origin/main: '+p)
        result['origin/main:'+p]=hashlib.sha256(committed).hexdigest()
    return result


def measure(value, unit='mm'):
    return dict(value=value, unit=unit, status='synthetic_fixture',
                evidence_ids=['synthetic'], uncertainty=None)


def points(poly):
    return [[round(x, 4), round(y, 4)] for x, y in list(poly.exterior.coords)[:-1]]
