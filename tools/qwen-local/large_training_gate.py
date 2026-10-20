"""Fail closed. This checker never provisions hardware or starts training."""
import argparse
import json
from pathlib import Path

THRESHOLDS = {'format_robustness': .98, 'closed_test': .95, 'natural_tr': .90,
              'clarification': .95, 'refusal': .95}


def check(report):
    reasons = []
    for key, threshold in THRESHOLDS.items():
        metric = report.get('metrics', {}).get(key)
        if not isinstance(metric, dict):
            reasons.append(key + ': missing measurement')
            continue
        correct, total = metric.get('correct'), metric.get('total')
        if type(correct) is not int or type(total) is not int or not 0 <= correct <= total or total <= 0 or correct / total < threshold:
            reasons.append(key + ': threshold not met')
    for key in ['defects_closed', 'same_frozen_benchmark', 'no_regression', 'current_source',
                'human_review_complete', 'written_cost_estimate', 'explicit_owner_approval']:
        if report.get(key) is not True:
            reasons.append(key + ': required evidence missing')
    return {'eligible_for_review': not reasons, 'reasons': reasons,
            'provisions_resources': False, 'starts_training': False,
            'note': 'Booleans are declarations; reviewer must verify linked evidence and direct owner authorization.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('report', type=Path)
    args = parser.parse_args()
    result = check(json.loads(args.report.read_text(encoding='utf-8')))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result['eligible_for_review'] else 2)
