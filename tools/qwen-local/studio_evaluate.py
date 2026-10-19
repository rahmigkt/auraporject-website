"""Exact action comparison for the narrow numeric studio pilot; no official gold score."""
import argparse
import hashlib
import json
from pathlib import Path


def score(rows, predictions):
    ids = {r['id'] for r in rows}
    answers = {}
    for p in predictions:
        if p.get('id') not in ids or p['id'] in answers:
            raise ValueError('Unknown or duplicate prediction')
        answers[p['id']] = p.get('output')
    exact = sum(answers.get(r['id']) == r['expected'] for r in rows)
    per_family = {}
    for r in rows:
        bucket = per_family.setdefault(r['input']['design']['family'], {'total': 0, 'exact': 0})
        bucket['total'] += 1
        bucket['exact'] += int(answers.get(r['id']) == r['expected'])
    return {'status': 'provisional_unreviewed', 'total': len(rows), 'received': len(answers),
            'missing': len(rows) - len(answers), 'exact': exact, 'exact_rate': exact / len(rows),
            'per_family': per_family, 'scope': 'Exact numeric action syntax only; no runtime safety or aesthetic result'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-dir', type=Path, default=Path('outputs/qwen-local/studio-v1'))
    parser.add_argument('--predictions', type=Path, required=True)
    args = parser.parse_args()
    manifest = json.loads((args.data_dir / 'manifest.json').read_text(encoding='utf-8'))
    for name, value in manifest['files'].items():
        if hashlib.sha256((args.data_dir / name).read_bytes()).hexdigest() != value:
            raise ValueError('Hash mismatch: ' + name)
    load = lambda p: [json.loads(line) for line in p.read_text(encoding='utf-8').splitlines() if line.strip()]
    print(json.dumps(score(load(args.data_dir / 'dev.jsonl'), load(args.predictions)), ensure_ascii=False, indent=2))
