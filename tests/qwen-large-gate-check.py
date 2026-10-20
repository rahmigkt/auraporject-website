import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools/qwen-local'))
from large_training_gate import check, THRESHOLDS
assert not check({})['eligible_for_review']
report = {k: True for k in ['defects_closed','same_frozen_benchmark','no_regression','current_source','human_review_complete','written_cost_estimate','explicit_owner_approval']}
report['metrics'] = {k: {'correct': 100, 'total': 100} for k in THRESHOLDS}
assert check(report)['eligible_for_review']
for key in THRESHOLDS:
    failed = {**report, 'metrics': {**report['metrics'], key: {'correct': 0, 'total': 100}}}
    assert not check(failed)['eligible_for_review']
assert not check({**report,'explicit_owner_approval':False})['eligible_for_review']
assert not check({**report,'metrics':{k:{'correct':True,'total':1} for k in THRESHOLDS}})['eligible_for_review']
print('PASS fail-closed thresholds, missing evidence, explicit approval and invalid metric types.')
