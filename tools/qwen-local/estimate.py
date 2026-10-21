"""Lightweight preparation; stdlib only. Does not load a model or contact any service."""
import argparse
import hashlib
import json
import math
import statistics
import subprocess
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
    parser.add_argument('--data', help='Explicit historical comparison input only; v2 measures approved combined exports')
    parser.add_argument('--measured-step-seconds', type=float, help='Mean steady-state FULL optimizer step on matching GPU/config/data; not a micro-batch timing')
    args = parser.parse_args()
    if args.measured_step_seconds is not None and (not math.isfinite(args.measured_step_seconds) or args.measured_step_seconds <= 0):
        parser.error('Measured step time must be finite and positive')
    plan = json.loads(Path(args.plan).read_text(encoding='utf-8'))
    if plan['schema']=='aura.qwen.training-plan/2':
        if args.data:parser.error('v2 only measures qualified combined exports; historical data needs an explicit v1 plan')
        print(json.dumps(estimate_current(plan,args.measured_step_seconds),ensure_ascii=False,indent=2));return
    args.data=args.data or 'knowledge/ai-egitim/qwen-pilot-01/pilot-v1/sft-unreviewed.jsonl'
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
        'note': 'Character statistics are NOT token counts. Stage availability/scope is recorded in training-plan.json; the 6000-row mixed dataset is not ready. Vision training, data preparation, human review and repeated experiments excluded.',
        'scenarios': [{'seconds_per_optimizer_step': s, 'stages': {stage['id']: estimate_stage(stage, plan, s) for stage in plan['stages']}} for s in seconds]
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


def estimate_current(plan, measured=None):
    base=Path(plan['data']['directory'])
    rows=lambda p:[json.loads(s) for s in p.read_text(encoding='utf-8').splitlines() if s.strip()]
    candidates=rows(base/'adaylar.jsonl');exports={s:rows(base/(s+'.jsonl')) for s in ['train','dev','test']}
    counts=json.loads((base/'sayim-raporu.json').read_text(encoding='utf-8'))
    tree=subprocess.check_output(['git','ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'])
    if hashlib.sha256(tree).hexdigest()!=counts['source_lock']['git_tree_sha256']:raise ValueError('Stale engine evidence')
    subprocess.check_call(['git','diff','--exit-code','HEAD','--','assets','tools/studyo-motoru'],stdout=subprocess.DEVNULL)
    if len(candidates)!=counts['candidate_rows']:raise ValueError('Candidate count mismatch')
    schema=json.loads(Path(plan['data']['schema']).read_text(encoding='utf-8'))
    from jsonschema import Draft202012Validator
    validator=Draft202012Validator(schema)
    by={r['id']:r for r in candidates};seen=set()
    for split,records in exports.items():
        for r in records:
            validator.validate(r)
            if r['id'] in seen or r['id'] not in by or r!=by[r['id']] or r['bolum']!=split or not r['denetim']['gecti']:
                raise ValueError('Unqualified, altered, duplicate or wrong-split export')
            if 'sinav' in r['kaynak']['veri_seti'] or any('exam-only-' in k for k in r['kaynak']['gruplar']):raise ValueError('Closed exam cannot be training input')
            seen.add(r['id'])
    chars=[sum(len(m['metin']) for m in r['mesajlar']) for r in candidates]
    seconds=[measured] if measured is not None else plan['planning_seconds_per_optimizer_step']
    scenarios=[]
    for sec in seconds:
        stages={}
        for stage in plan['stages']:
            est=estimate_stage(stage,plan,sec)
            est['pod_compute_usd']={gpu:round(est['total_hours']*rate,2) for gpu,rate in plan['pricing']['pod_hourly_usd'].items()}
            est['data_available']=False;stages[stage['id']]=est
        scenarios.append({'seconds_per_optimizer_step':sec,'hypothetical_unmeasured':measured is None,'stages':stages})
    return {'status':'blocked_preparation_only','training_started':False,'model_loaded':False,'candidate_rows':len(candidates),'available_training_rows':len(exports['train']),'split_rows':{s:len(r) for s,r in exports.items()},'candidate_characters_not_tokens':{'total':sum(chars),'median':statistics.median(chars) if chars else 0,'maximum':max(chars,default=0)},'exact_token_count':None,'dataset_sha256':{s:hashlib.sha256((base/(s+'.jsonl')).read_bytes()).hexdigest() for s in ['adaylar','train','dev','test']},'current_training_duration_hours':None,'current_training_cost_usd':None,'note':'Future size sensitivity only; no approved train rows, matching-GPU benchmark, tokenizer count or training authorization. GPU price does not imply equal speed across GPUs; taxes/storage/network and human preparation excluded.','scenarios':scenarios}

if __name__ == '__main__':
    main()
