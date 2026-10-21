"""No model/GPU needed: verify duration arithmetic and preflight reporting."""
import importlib.util
import json
import math
import subprocess
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location('estimate', 'tools/qwen-local/estimate.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
plan = json.loads(Path('tools/qwen-local/training-plan.json').read_text(encoding='utf-8'))
assert plan['method'] == 'bf16-lora'
assert plan['gpu_count'] == 1
assert module.estimate_stage(plan['stages'][1], plan, 20)['optimizer_steps'] == 250
assert module.estimate_stage(plan['stages'][1], plan, 20)['total_hours'] == 2.74
partial = dict(plan['stages'][0], training_examples=9, epochs=2)
assert module.estimate_stage(partial, plan, 1)['optimizer_steps'] == 4
report = json.loads(subprocess.check_output([sys.executable, 'tools/qwen-local/estimate.py'], encoding='utf-8'))
assert report['available_training_rows'] == 0
assert report['candidate_rows'] == 2578
assert report['split_rows'] == dict(train=0,dev=0,test=0)
assert report['current_training_duration_hours'] is None
assert report['current_training_cost_usd'] is None
assert report['exact_token_count'] is None
assert report['training_started'] is False
assert len(report['scenarios']) == 3
for bad in ['0', '-2', 'nan', 'inf']:
    result = subprocess.run([sys.executable, 'tools/qwen-local/estimate.py', '--measured-step-seconds', bad], capture_output=True)
    assert result.returncode != 0
print('PASS training-plan arithmetic, partial batches, honest data availability, hypothetical timings and invalid measured values.')

assert plan['loss']['mode']=='assistant_response_only'
assert plan['large_training_gate']['enabled'] is False
assert plan['large_training_gate']['new_explicit_owner_approval_required']
assert 'first_gpu_session' not in plan
assert not any(s['available'] for s in plan['stages'])
assert plan['contract']['outer_output']==['reply','actions']
old=Path(plan['history']['superseded_plan'])
import hashlib
assert hashlib.sha256(old.read_bytes()).hexdigest()==plan['history']['sha256']
spec=importlib.util.spec_from_file_location('mask','tools/qwen-local/response_mask.py')
mask=importlib.util.module_from_spec(spec);spec.loader.exec_module(mask)
assert mask.labels_for_assistant([11,22,33,44,0],[0,0,1,1,0],[1,1,1,1,0])==[-100,-100,33,44,-100]
for ids,am,att in [([1],[0],[1]),([1],[1],[0]),([1],[2],[1]),([1],[1],[])]:
    try:mask.labels_for_assistant(ids,am,att)
    except ValueError:pass
    else:raise AssertionError('Invalid assistant mask accepted')
print('PASS response-only labels, padding/empty/invalid-mask rejection, disabled GPU gate, preserved historical plan')
