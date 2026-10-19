"""Lightweight preparation; stdlib only. Does not load a model or contact any service."""
import argparse
import hashlib
import json
import math
import statistics
from pathlib import Path


def estimate_stage(stage, plan, seconds_per_step):
    effective_batch = plan['micro_batch_size'] * plan['gradient_accumulation_steps'] * plan['gpu_count']
    # ceil per epoch: conservative final partial batch handling.
    steps = math.ceil(stage['training_examples'] / effective_batch) * stage['epochs']
    train_hours = steps * seconds_per_step / 3600
    return {'optimizer_steps': steps, 'training_hours': round(train_hours, 2),
            'total_hours': round(train_hours * (1 + stage['runtime_overhead_fraction']) + stage['setup_eval_export_hours'], 2)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--plan', default='tools/qwen-local/training-plan.json')
    parser.add_argument('--data', default='outputs/qwen-local/pilot-v1/sft-unreviewed.jsonl')
    parser.add_argument('--measured-step-seconds', type=float, help='Mean steady-state FULL optimizer step on matching GPU/config/data; not a micro-batch timing')
    args = parser.parse_args()
    if args.measured_step_seconds is not None and (not math.isfinite(args.measured_step_seconds) or args.measured_step_seconds <= 0):
        parser.error('Measured step time must be finite and positive')
    plan = json.loads(Path(args.plan).read_text(encoding='utf-8'))
    raw = Path(args.data).read_bytes()
    rows = [json.loads(line) for line in raw.decode('utf-8').splitlines() if line.strip()]
    chars = [sum(len(m['content']) for m in r['messages']) for r in rows]
    if not rows:
        parser.error('Empty preparation data')
    seconds = [args.measured_step_seconds] if args.measured_step_seconds else plan['planning_seconds_per_optimizer_step']
    report = {
        'status': 'conditional_estimate_not_gpu_benchmark' if args.measured_step_seconds is None else 'projection_from_user_supplied_step_time_not_independently_verified',
        'training_started': False,
        'data_sha256': hashlib.sha256(raw).hexdigest(),
        'available_training_rows': len(rows),
        'characters': {'total': sum(chars), 'median': statistics.median(chars), 'max': max(chars)},
        'exact_token_count': None,
        'note': 'Character statistics are NOT token counts. Planned 1000/6000 row datasets do not yet exist. Vision training, data preparation, human review and repeated experiments excluded.',
        'scenarios': [{'seconds_per_optimizer_step': s, 'stages': {stage['id']: estimate_stage(stage, plan, s) for stage in plan['stages']}} for s in seconds]
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
