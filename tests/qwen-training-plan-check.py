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
assert module.estimate_stage(plan['stages'][1], plan, 20)['optimizer_steps'] == 1500
assert module.estimate_stage(plan['stages'][1], plan, 20)['total_hours'] == 11.42
partial = dict(plan['stages'][0], training_examples=9, epochs=2)
assert module.estimate_stage(partial, plan, 1)['optimizer_steps'] == 4
report = json.loads(subprocess.check_output([sys.executable, 'tools/qwen-local/estimate.py'], encoding='utf-8'))
assert report['available_training_rows'] == 15
assert report['exact_token_count'] is None
assert report['training_started'] is False
assert len(report['scenarios']) == 3
for bad in ['0', '-2', 'nan', 'inf']:
    result = subprocess.run([sys.executable, 'tools/qwen-local/estimate.py', '--measured-step-seconds', bad], capture_output=True)
    assert result.returncode != 0
print('PASS training-plan arithmetic, partial batches, honest data availability, hypothetical timings and invalid measured values.')
