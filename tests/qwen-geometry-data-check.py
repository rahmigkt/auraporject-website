import importlib.util
import json
import tempfile
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location('geometry', 'tools/qwen-local/geometry_data.py')
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)
sys.path.insert(0, str(Path('tools/qwen-local').resolve()))
from geometry_evaluate import score
# Hand-derived rectangular and curved-boundary cases, independent of the generator.
shape = {'units': 'mm', 'width': 100, 'depth': 100, 'height': 3, 'cornerRadius': 0,
         'hole': {'x': 37, 'y': 0, 'radius': 10}}
assert g.validate(shape) == []  # 50 - 37 - 10 = 3
shape['hole']['x'] = 37.01
assert g.validate(shape) == ['hole-clearance']
shape['hole'] = {'x': 35, 'y': 35, 'radius': 5}
shape['cornerRadius'] = 50  # Circle: 50 - sqrt(35²+35²) - 5 < 3
assert g.validate(shape) == ['hole-clearance']
shape['hole'] = {'x': 0, 'y': 0, 'radius': 47}
assert g.validate(shape) == []
shape['width'] = float('nan')
assert g.validate(shape) == ['nonfinite']
shape['width'] = True
assert g.validate(shape) == ['nonfinite']
rows = g.make_rows()
sample = rows[:2]
assert score(sample, [])['missing'] == 2
assert score(sample, [{'id': r['id'], 'output': r['expected']} for r in sample])['exact'] == 2
assert score(sample, [{'id': r['id'], 'output': r['input']['geometry']} for r in sample])['exact'] == 0
assert score(sample, [{'id': r['id'], 'output': None} for r in sample])['constraint_valid'] == 0
for bad in [[{'id': 'foreign', 'output': {}}], [{'id': sample[0]['id']}, {'id': sample[0]['id']}]]:
    try:
        score(sample, bad)
        raise AssertionError('Accepted unknown/duplicate predictions')
    except ValueError:
        pass
assert {s: sum(r['split'] == s for r in rows) for s in ['train', 'dev', 'test']} == {'train': 1000, 'dev': 200, 'test': 200}
assert len({r['id'] for r in rows}) == 1400
for r in rows:
    assert g.validate(r['expected']) == []
    assert r['review'] == 'unreviewed'
    if r['task'] == 'constraint_repair':
        assert g.validate(r['input']['geometry'])
    else:
        before, after = r['input']['geometry'], r['expected']
        assert sum(before[k] != after[k] for k in before) == 1
for group in {r['group'] for r in rows}:
    assert len({r['split'] for r in rows if r['group'] == group}) == 1
with tempfile.TemporaryDirectory(prefix='.test-', dir=Path('tools/qwen-local').resolve()) as tmp:
    out = Path(tmp)
    first = g.build(out)
    assert first == g.build(out)
    sft = [json.loads(line) for line in (out / 'sft-unreviewed.jsonl').read_text(encoding='utf-8').splitlines()]
    train_ids = {r['id'] for r in rows if r['split'] == 'train'}
    assert len(sft) == 1000 and all(r['id'] in train_ids for r in sft)
    (out / 'test.jsonl').write_bytes(b'tampered')
    try:
        g.build(out)
        raise AssertionError('Overwritten frozen file')
    except ValueError as error:
        assert 'Refusing to overwrite' in str(error)
print('PASS 1400 geometry examples; exact boundary/curved-corner checks; all repair targets; one-field edits; group isolation; training-only SFT; deterministic frozen artifacts.')
