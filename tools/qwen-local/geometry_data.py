"""Small deterministic geometry curriculum; standard library, no model or renderer.
The rounded plate is an exercise DSL, not an AURA runtime part or engineering certificate.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import random

VERSION = 'aura.geometry.curriculum/1'
SYSTEM = ('Geometri alıştırması. Birim mm; merkez (0,0). Yalnız sonuç geometrisinin JSON nesnesini döndür. '
          'Şema: units,width,depth,height,cornerRadius,hole:{x,y,radius}. '
          'Tüm boyutlar pozitif; height en az 3; 0 <= cornerRadius <= min(width,depth)/2. '
          'Dairesel delik ile yuvarlatılmış dış sınır arasında en az 3 mm duvar kalır. '
          'Bunlar alıştırma kısıtlarıdır, dayanıklılık veya üretim onayı değildir.')


def encoded(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def validate(g):
    if not isinstance(g, dict) or set(g) != {'units', 'width', 'depth', 'height', 'cornerRadius', 'hole'}:
        return ['schema']
    hole = g['hole']
    if g['units'] != 'mm' or not isinstance(hole, dict) or set(hole) != {'x', 'y', 'radius'}:
        return ['schema']
    values = [g[k] for k in ['width', 'depth', 'height', 'cornerRadius']] + list(hole.values())
    if not all(type(v) in (int, float) and math.isfinite(v) for v in values):
        return ['nonfinite']
    if min(g['width'], g['depth'], g['height'], hole['radius']) <= 0:
        return ['positive-dimension']
    issues = []
    if g['height'] < 3:
        issues.append('exercise-min-height')
    radius = g['cornerRadius']
    if radius < 0 or radius > min(g['width'], g['depth']) / 2:
        issues.append('corner-radius')
        return issues
    # Signed distance from the hole centre to a centred rounded rectangle.
    qx = abs(hole['x']) - (g['width'] / 2 - radius)
    qy = abs(hole['y']) - (g['depth'] / 2 - radius)
    sdf = math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - radius
    if -sdf - hole['radius'] < 3 - 1e-8:
        issues.append('hole-clearance')
    return issues


def make_rows():
    rng = random.Random(20261019)
    rows, groups = [], set()
    for index in range(700):
        # Unique base geometries, not random paraphrases of a shared split-crossing object.
        while True:
            base = {'units': 'mm', 'width': rng.randint(120, 600), 'depth': rng.randint(100, 450),
                    'height': rng.randint(8, 50), 'cornerRadius': rng.randint(0, 30),
                    'hole': {'x': 0, 'y': 0, 'radius': rng.randint(4, 15)}}
            group = digest(encoded(base).encode())
            if group not in groups:
                groups.add(group)
                break
        split = 'train' if index < 500 else 'dev' if index < 600 else 'test'
        key = ['width', 'depth', 'height'][index % 3]
        delta = rng.randint(1, 30)
        edited = json.loads(encoded(base))
        edited[key] += delta
        labels = {'width': 'genişliği', 'depth': 'derinliği', 'height': 'yüksekliği'}
        edit_prompt = f"{labels[key]} {delta} mm artır. Diğer bütün değerler sabit kalsın."
        invalid, repaired = json.loads(encoded(base)), json.loads(encoded(base))
        if index % 3 == 0:
            invalid['cornerRadius'] = min(base['width'], base['depth']) / 2 + 10
            repaired['cornerRadius'] = min(base['width'], base['depth']) / 2
            repair_prompt = 'Yalnız köşe yarıçapını izin verilen en büyük değere getir.'
        elif index % 3 == 1:
            invalid['hole']['x'] = base['width'] / 2 - base['hole']['radius'] + 5
            repaired['hole']['x'] = base['width'] / 2 - base['hole']['radius'] - 3
            repair_prompt = 'Yalnız deliğin x konumunu değiştir; sağ dış sınırdan tam 3 mm duvar bırak. y sabit kalsın.'
        else:
            invalid['height'] = 1
            repaired['height'] = 3
            repair_prompt = 'Yalnız yüksekliği alıştırmada izin verilen en küçük değere getir.'
        for task, before, after, instruction in [('dimension_edit', base, edited, edit_prompt), ('constraint_repair', invalid, repaired, repair_prompt)]:
            if validate(after) or (task == 'constraint_repair' and not validate(before)):
                raise ValueError('Generator emitted an invalid target or a non-negative repair input')
            rows.append({'schema': VERSION, 'id': digest(f'{group}/{task}'.encode())[:24], 'group': group,
                         'split': split, 'task': task, 'lang': 'tr', 'review': 'unreviewed',
                         'provenance': {'generator': 'AURA exercise geometry', 'external_data': False, 'seed': 20261019},
                         'input': {'geometry': before, 'instruction': instruction}, 'expected': after,
                         'evidence': {'input_issues': validate(before), 'target_issues': []}})
    # No identical input/target geometries may cross split boundaries, even under different tasks.
    owners = {}
    for row in rows:
        for geom in [row['input']['geometry'], row['expected']]:
            key = encoded(geom)
            if key in owners and owners[key] != row['split']:
                raise ValueError('Geometry leakage between splits')
            owners[key] = row['split']
    return rows


def build(out):
    rows = make_rows()
    files = {}
    for split in ['train', 'dev', 'test']:
        selected = [r for r in rows if r['split'] == split]
        files[f'{split}.jsonl'] = ''.join(encoded(r) + '\n' for r in selected)
        if split != 'test':
            prompts = [{'id': r['id'], 'review': r['review'], 'messages': [
                {'role': 'system', 'content': SYSTEM}, {'role': 'user', 'content': encoded(r['input'])}]
                + ([{'role': 'assistant', 'content': encoded(r['expected'])}] if split == 'train' else [])} for r in selected]
            files['sft-unreviewed.jsonl' if split == 'train' else 'dev-prompts.jsonl'] = ''.join(encoded(r) + '\n' for r in prompts)
    files['manifest.json'] = json.dumps({'schema': VERSION, 'training_started': False,
        'generator_sha256_lf': digest(Path(__file__).read_text(encoding='utf-8').replace('\r\n', '\n').encode()),
        'counts': {s: sum(r['split'] == s for r in rows) for s in ['train', 'dev', 'test']},
        'files': {n: digest(v.encode()) for n, v in files.items()},
        'limitations': ['unreviewed deterministic exercise labels', 'one rounded-plate topology',
                         'no aesthetic or structural-strength labels', 'no external CAD dataset imported',
                         'parameter-held-out only; not topology-generalisation evaluation']}, ensure_ascii=False, indent=2) + '\n'
    for name, content in files.items():
        path = out / name
        if path.exists() and path.read_bytes() != content.encode():
            raise ValueError(f'Refusing to overwrite frozen artifact {path}')
    out.mkdir(parents=True, exist_ok=True)
    for name, content in files.items():
        (out / name).write_bytes(content.encode())
    return json.loads(files['manifest.json'])


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', type=Path, default=Path('outputs/qwen-local/geometry-v1'))
    print(json.dumps(build(parser.parse_args().out), ensure_ascii=False, indent=2))
