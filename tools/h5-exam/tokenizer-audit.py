"""Actual local tokenizer contract check. No weights, inference or training.

Targets below are synthetic serialization probes, not new approved training data.
H5's prompt builder remains a draft; this checks that builder, not live PHP parity.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools/qwen-local'))
from egitim01_features import LocalTextTokenizer, prepare_features, normalize_messages, assistant_spans, END, EMPTY_THINK


def digest(data):
    return hashlib.sha256(data).hexdigest()


def require_serialization(prefix, payload, eos, full):
    assert full == prefix + payload + eos + '\n', 'Inference/training serialization mismatch'


def check(tokenizer, messages, target, identifier, maximum):
    payload = json.dumps(target, ensure_ascii=False, separators=(',', ':'))
    full_messages = messages + [{'role': 'assistant', 'content': payload}]
    normalized = normalize_messages({'messages': full_messages})
    prompt_messages = normalized[:-1]
    prefix = tokenizer.template.render(messages=prompt_messages, add_generation_prompt=True,
        enable_thinking=False, add_vision_id=False, tools=None,
        eos_token=tokenizer.eos_token, bos_token='')
    full = tokenizer.render(normalized)
    assert prefix.endswith('<|im_start|>assistant\n' + EMPTY_THINK)
    require_serialization(prefix, payload, END, full)
    # The same gate must reject a wrong EOS and a missing non-thinking prefix.
    rejected = 0
    for wrong_prefix, wrong_eos in [(prefix, '<|endoftext|>'), (prefix.removesuffix(EMPTY_THINK), END)]:
        try:
            require_serialization(wrong_prefix, payload, wrong_eos, full)
        except AssertionError:
            rejected += 1
    assert rejected == 2
    prefix_ids = tokenizer.backend.encode(prefix, add_special_tokens=False).ids
    full_ids = tokenizer.backend.encode(full, add_special_tokens=False).ids
    assert full_ids[:len(prefix_ids)] == prefix_ids, identifier
    features, audits = prepare_features(tokenizer, [{'id': identifier, 'messages': full_messages}],
        maximum, allow_overflow=True)
    labels = features[0]['labels']
    spans = assistant_spans(full, normalized)
    offsets = tokenizer.backend.encode(full, add_special_tokens=False).offsets
    for i,(lo,hi) in enumerate(offsets):
        if not any(start <= lo < hi <= end for start,end in spans):
            assert labels[i] == -100
    # Previous assistant targets remain supervised by the actual training path.
    assert labels[len(prefix_ids)] != -100
    supervised = [value for value in labels if value != -100]
    assert supervised[-1] == tokenizer.backend.token_to_id(END)
    assert tokenizer.backend.decode(supervised, skip_special_tokens=False).endswith(END)
    return dict(id=identifier, prefix_tokens=len(prefix_ids), total_tokens=len(full_ids),
        prefix_sha256=digest(prefix.encode()), training_prefix_equals_inference=True,
        prompt_masked=True, eos_id=supervised[-1], within_context=len(full_ids) <= maximum,
        assistant_turns=audits[0]['assistant_turns'], negative_mismatches_rejected=rejected)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tokenizer-dir', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        parser.error('Use a fresh output file; preserve earlier evidence')
    tokenizer = LocalTextTokenizer(args.tokenizer_dir)
    p = subprocess.run(['node', 'tools/h5-exam/prompts.mjs'], cwd=ROOT,
        check=True, capture_output=True, encoding='utf8')
    prompts = [json.loads(line) for line in p.stdout.splitlines() if line.strip()]
    tasks = [json.loads(line) for line in (ROOT/'tests/ai-eval/h5-ev-01/gorevler.jsonl').read_text(encoding='utf8').splitlines()]
    # Gold actions omit katman; the real motor contract supplies it by operation.
    # This is explicit probe adaptation, not inference or a changed frozen gold.
    layers = json.loads(subprocess.check_output(['node','--input-type=module','-e',
        "import {SOZLUK} from './tools/studyo-motoru/motor.mjs';console.log(JSON.stringify(Object.fromEntries(Object.entries(SOZLUK).flatMap(([layer,ops])=>Object.keys(ops).map(type=>[type,layer])))))"],cwd=ROOT,encoding='utf8'))
    assert len(tasks) == len(prompts) == 120
    rows = []
    for task, prompt in zip(tasks, prompts):
        assert prompt['id'] == task['id']
        target = {'reply': 'Tokenizer contract probe.', 'actions': [dict(action,katman=layers[action['type']]) for action in task['expected']['actions']]}
        rows.append(check(tokenizer, prompt['messages'], target, task['id'], 6144))
    # A separate synthetic multi-turn fixture exercises the real EVERY-assistant mask.
    history = [{'role': 'system', 'content': 'Return JSON.'},
        {'role': 'user', 'content': 'What size is needed?'},
        {'role': 'assistant', 'content': '{"reply":"Please provide width.","actions":[]}'},
        {'role': 'user', 'content': 'Width is 900 mm.'}]
    multi = check(tokenizer, history, {'reply':'Width recorded.','actions':[]}, 'synthetic-multiturn', 6144)
    assert multi['assistant_turns'] == 2
    source_names = ['tools/h5-exam/prompts.mjs','tools/h5-exam/tokenizer-audit.py',
        'tools/qwen-local/egitim01_features.py','tools/qwen-local/egitim01_runner.py','tools/studyo-motoru/motor.mjs',
        'tests/ai-eval/h5-ev-01/FREEZE.json']
    report = dict(status='passed' if all(r['within_context'] for r in rows) else 'context_overflow',
        schema='aura.h5.tokenizer-audit/1', model='Qwen/Qwen3.5-9B',
        tokenizer_files_sha256=tokenizer.file_hashes, packages=tokenizer.package_versions,
        source_sha256={name:digest((ROOT/name).read_bytes()) for name in source_names},
        code_sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
        prompts=120, prefix_eos_checks=len(rows), multi_turn=multi,
        target_adaptation='Synthetic reply plus expected actions with explicit SOZLUK katman mapping; no gold files changed',
        negative_eos_and_prefix_controls=sum(r['negative_mismatches_rejected'] for r in rows)+multi['negative_mismatches_rejected'],
        rows=rows, model_loaded=False, model_run=False, training_started=False,
        reviewer='Codex', review_mode='user_authorized_self_review',
        limits=['No inference, model success or training approval',
                'Synthetic reply probes are not approved targets',
                'Draft H5 builder parity only; live PHP integration equivalence unverified',
                'Existing local tokenizer files reused; upstream base revision not newly verified'])
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({k:report[k] for k in ['status','prompts','prefix_eos_checks','multi_turn','model_run']}))
    return 0 if report['status']=='passed' else 2


if __name__ == '__main__':
    raise SystemExit(main())
