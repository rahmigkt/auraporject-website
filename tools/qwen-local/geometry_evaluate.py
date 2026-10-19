"""Offline geometry-answer evaluator. No model, API, CAD execution, or official gold score."""
import argparse
import json
from pathlib import Path
from geometry_data import validate, digest


def score(rows, predictions):
    expected_ids = {r['id'] for r in rows}
    by_id = {}
    for pred in predictions:
        if not isinstance(pred, dict) or pred.get('id') not in expected_ids or pred['id'] in by_id:
            raise ValueError('Unknown, malformed or duplicate prediction')
        by_id[pred['id']] = pred.get('output')
    exact, valid = 0, 0
    per_task = {}
    for row in rows:
        output = by_id.get(row['id'])
        is_valid = not validate(output)
        is_exact = is_valid and output == row['expected']
        exact += int(is_exact)
        valid += int(is_valid)
        bucket = per_task.setdefault(row['task'], {'total': 0, 'exact': 0})
        bucket['total'] += 1
        bucket['exact'] += int(is_exact)
    return {'status': 'provisional_unreviewed', 'total': len(rows), 'received': len(by_id),
            'missing': len(rows) - len(by_id), 'exact': exact, 'constraint_valid': valid,
            'exact_rate': exact / len(rows) if rows else None, 'per_task': per_task,
            'limitation': 'Exercise constraints and exact instruction target only; no aesthetic or structural safety score'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-dir', type=Path, default=Path('outputs/qwen-local/geometry-v1'))
    parser.add_argument('--predictions', type=Path, required=True)
    parser.add_argument('--split', choices=['dev', 'test'], default='dev')
    args = parser.parse_args()
    manifest = json.loads((args.data_dir / 'manifest.json').read_text(encoding='utf-8'))
    for name, expected_hash in manifest['files'].items():
        if digest((args.data_dir / name).read_bytes()) != expected_hash:
            raise ValueError(f'Hash mismatch: {name}')
    load = lambda p: [json.loads(line) for line in p.read_text(encoding='utf-8').splitlines() if line.strip()]
    print(json.dumps({**score(load(args.data_dir / f'{args.split}.jsonl'), load(args.predictions)),
        'split': args.split, 'dataset_sha256': manifest['files'][f'{args.split}.jsonl'],
        'predictions_sha256': digest(args.predictions.read_bytes())}, ensure_ascii=False, indent=2))
