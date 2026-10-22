"""Exact shape checks only; no decisions about semantic or solution leakage."""
import collections
import gzip
import hashlib
import importlib.util
import json
import pathlib
import re

path = pathlib.Path('tools/c7-audit/source-disposition.py')
spec = importlib.util.spec_from_file_location('c7_shape_helpers', path)
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
helpers.controls()
exam = pathlib.Path('tests/ai-eval/h5-ev-01/ev-projesi-40.jsonl')
rows = [json.loads(l) for l in exam.read_text(encoding='utf-8').splitlines()]
by = collections.defaultdict(list)
for task in rows:
    for room in task['input']['state'].get('plan', {}).get('spaces', []):
        by[helpers.shape(room['boundary_xy_mm'])].append(task['id'])
assert len(rows) == 40
sources = []
for name in ['procthor-denetimli.jsonl.gz', 'procthor-aura-cozucu.jsonl.gz']:
    p = pathlib.Path('knowledge/ai-egitim/veri/yerlesim') / name
    count = 0
    matches = []
    with gzip.open(p, 'rt', encoding='utf-8') as f:
        for line in f:
            count += 1
            r = json.loads(line)
            match = re.search(r'Köşeler \(mm(?:, plan)?\): (\[\[.*?\]\])', r['messages'][0]['content'])
            assert match, (name, count)
            hit = by.get(helpers.shape(json.loads(match[1])), [])
            if hit:
                matches.append({'source': r['id'], 'line': count, 'tasks': hit})
    sources.append({'file': p.as_posix(), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'rows': count, 'matches': matches})
assert sum(s['rows'] for s in sources) == 17167
assert not any(s['matches'] for s in sources)
out = {'scope': 'exact full room polygon; translation,90degree rotation,reflection and collinear vertex invariant; not semantic/solution leakage clearance', 'new_tasks': 40, 'new_room_shapes': len(by), 'exam_sha256': hashlib.sha256(exam.read_bytes()).hexdigest(), 'sources': sources, 'controls': 'known translated/rotated/collinear shape match;1mm dimension change negative', 'training_approval': False}
pathlib.Path('work/h5-shape-screen.json').write_text(json.dumps(out, indent=2))
print(json.dumps({'new_tasks': 40, 'source_rows': 17167, 'exact_shape_matches': 0}))
