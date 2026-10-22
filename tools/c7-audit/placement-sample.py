"""Narrow C7 review receipt for four explicitly read original rows, never an approver.

Independent footprint checks use dimensions in the prompt, not guessed catalog sizes.
Duplicate names with different sizes are deliberately unresolved. No solver rerun,
door/clearance certification, physical certification or training approval occurs here.
"""
import gzip
import hashlib
import json
import math
import re
import subprocess
from collections import Counter
from pathlib import Path


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def footprint(center, rotation, size):
    values = [*center, rotation, *size]
    if len(center) != 2 or len(size) != 2 or not all(math.isfinite(v) for v in values) or min(size) <= 0:
        raise ValueError('Invalid footprint dimensions/pose')
    t = math.radians(rotation)
    return [[center[0] + math.cos(t)*size[0]*x/2 + math.sin(t)*size[1]*y/2,
             center[1] + math.sin(t)*size[0]*x/2 - math.cos(t)*size[1]*y/2]
            for x, y in [(-1, -1), (1, -1), (1, 1), (-1, 1)]]


def inside(point, polygon):
    result = False
    for a, b in zip(polygon, polygon[1:] + polygon[:1]):
        if (a[1] > point[1]) != (b[1] > point[1]) and point[0] < (b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0]:
            result = not result
    return result


def inside_or_boundary(point, polygon, eps_mm=1e-6):
    # Numerical edge classification only, never a clearance/design tolerance.
    if inside(point, polygon):
        return True
    for a, b in zip(polygon, polygon[1:] + polygon[:1]):
        dx, dy = b[0]-a[0], b[1]-a[1]
        t = max(0, min(1, ((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(dx*dx+dy*dy or 1)))
        if math.hypot(point[0]-a[0]-t*dx, point[1]-a[1]-t*dy) <= eps_mm:
            return True
    return False


def inspect(row):
    prompt = row['messages'][0]['content']
    answer = json.loads(row['messages'][-1]['content'])
    match = re.search(r'Köşeler \(mm(?:, plan)?\): (\[\[.*?\]\])', prompt)
    if not match:
        raise ValueError('Unrecognized prompt geometry; manual review required')
    polygon = json.loads(match[1])
    tail = re.split(r'Yerleştirilecekler \(en×derinlik mm\): |Yerleştir: ', prompt)[1].split('. Her biri')[0].rstrip('.')
    sizes = []
    for part in tail.split('; '):
        m = re.fullmatch(r'(.+) (\d+)×(\d+)', part)
        if not m:
            raise ValueError('Unrecognized requested item; manual review required')
        sizes.append((m[1], [int(m[2]), int(m[3])]))
    placements = answer if isinstance(answer, list) else answer.get('yerlesim')
    counts = Counter(name for name, _ in sizes)
    ambiguous = [name for name, n in counts.items() if n > 1 and len({tuple(s) for key, s in sizes if key == name}) > 1]
    checks = []
    for item in placements or []:
        name = item['parca']
        options = [size for key, size in sizes if key == name]
        if not options:
            raise ValueError('Target item absent from input')
        checks.append({'part': name, 'center_mm': item['merkez_mm'], 'rotation_deg': item['on_derece'],
                       'size_association': 'ambiguous' if name in ambiguous else 'unique',
                       'candidate_sizes_mm': options,
                       'corner_checks': [{'size_mm': size, 'corners_mm': footprint(item['merkez_mm'], item['on_derece'], size),
                                          'all_corners_strictly_inside': all(inside(p, polygon) for p in footprint(item['merkez_mm'], item['on_derece'], size)),
                                          'all_corners_inside_or_boundary': all(inside_or_boundary(p, polygon) for p in footprint(item['merkez_mm'], item['on_derece'], size)),
                                          'numerical_boundary_epsilon_mm': 1e-6}
                                         for size in options]})
    findings = ['legacy_coordinate_target_requires_reviewed_constraint_conversion']
    if ambiguous:
        findings.append('duplicate_part_names_do_not_bind_distinct_requested_dimensions')
    if placements is None:
        findings.append('null_placement_is_not_success_or_proof_of_infeasibility')
    return {'id': row['id'], 'row_sha256': digest(canonical(row)), 'source': row['source'],
            'input_items': len(sizes), 'output_placements': len(placements) if placements is not None else None,
            'source_ok': row.get('ok'), 'ambiguous_dimension_names': ambiguous,
            'footprint_corner_checks': checks, 'findings': findings,
            'decision': 'duzelt', 'training_approved': False,
            'limits': ['Corner-only check is not whole-polygon containment in a concave room.',
                       'Doors, windows, front clearance, pairwise collision and semantic leakage remain pending.',
                       'Source refusal is not an exhaustive infeasibility proof.',
                       'Original coordinate targets are distinct from already-delivered Codex H4 constraint targets.']}


def run():
    records = []
    for name in ['procthor-denetimli.jsonl.gz', 'procthor-aura-cozucu.jsonl.gz']:
        path = Path('knowledge/ai-egitim/veri/yerlesim') / name
        with gzip.open(path, 'rt', encoding='utf8') as stream:
            for line_no, line in zip(range(1, 3), stream):
                result = inspect(json.loads(line))
                result.update(file=path.as_posix(), line=line_no, compressed_source_sha256=digest(path.read_bytes()))
                records.append(result)
    evidence = {'scope': 'Exactly first two records from each original gzip; four rows read, not a representative approval sample.',
                'source_code_sha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
                'reviewer': 'Codex', 'producer': 'Claude (conversion scripts); underlying dataset procedural ProcTHOR',
                'review_mode': 'cross_review', 'training_approved': False,
                'audit_tool_sha256_lf': digest(Path(__file__).read_bytes().replace(b'\r\n', b'\n')), 'records': records}
    out = Path('work/c7-placement-four-rows.json')
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(evidence, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
    print(json.dumps({'rows': len(records), 'approvals': 0, 'out': out.as_posix(),
                      'ambiguous_rows': [r['id'] for r in records if r['ambiguous_dimension_names']]}))


if __name__ == '__main__':
    run()
