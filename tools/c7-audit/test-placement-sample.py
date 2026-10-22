import gzip
import importlib.util
import json
import math
from pathlib import Path

spec = importlib.util.spec_from_file_location('placement_sample', Path(__file__).with_name('placement-sample.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)

square = [[0, 0], [2000, 0], [2000, 2000], [0, 2000]]
assert all(audit.inside(p, square) for p in audit.footprint([1000, 1000], 0, [500, 800]))
assert not all(audit.inside(p, square) for p in audit.footprint([1900, 1000], 90, [500, 800]))
rotated = audit.footprint([0, 0], 90, [400, 800])
assert math.isclose(max(p[0] for p in rotated)-min(p[0] for p in rotated), 800)
for bad in ([0, 400], [-10, 400], [float('nan'), 400]):
    try:
        audit.footprint([0, 0], 0, bad)
        raise AssertionError('Invalid size accepted')
    except ValueError:
        pass

root = Path('knowledge/ai-egitim/veri/yerlesim')
with gzip.open(root/'procthor-denetimli.jsonl.gz', 'rt', encoding='utf8') as f:
    first, second = [json.loads(next(f)) for _ in range(2)]
before = audit.canonical(first)
checks = audit.inspect(first)
assert audit.canonical(first) == before
assert checks['input_items'] == checks['output_placements'] == 2
assert all(c['all_corners_strictly_inside'] for x in checks['footprint_corner_checks'] for c in x['corner_checks'])
assert all(c['all_corners_strictly_inside'] for x in audit.inspect(second)['footprint_corner_checks'] for c in x['corner_checks'])
altered = json.loads(json.dumps(first))
target = json.loads(altered['messages'][-1]['content'])
target[0]['merkez_mm'] = [0, 0]
altered['messages'][-1]['content'] = json.dumps(target)
assert not audit.inspect(altered)['footprint_corner_checks'][0]['corner_checks'][0]['all_corners_strictly_inside']
with gzip.open(root/'procthor-aura-cozucu.jsonl.gz', 'rt', encoding='utf8') as f:
    refusal, success = [json.loads(next(f)) for _ in range(2)]
assert audit.inspect(refusal)['output_placements'] is None
assert 'null_placement_is_not_success_or_proof_of_infeasibility' in audit.inspect(refusal)['findings']
assert audit.inspect(success)['ambiguous_dimension_names'] == ['yan sehpa']
for row in [first, second, refusal, success]:
    assert audit.inspect(row)['training_approved'] is False
print('PASS independent rotated footprint;inside/outside controls;invalid dimensions;original preservation;four real rows;null refusal not success;duplicate-name dimensions unresolved;zero approvals')
