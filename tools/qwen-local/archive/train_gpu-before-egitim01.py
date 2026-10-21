"""GPU-only experimental text pilot. Preparation mode is stdlib-only and the default.
Unsloth/TRL integration is a candidate: real CUDA execution has not been verified yet.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import statistics
import time
import math


def response_features(processor, tokenizer, rows, max_length):
    result = []
    for row in rows:
        if row['messages'][-1]['role'] != 'assistant':
            raise ValueError('Training example must end with the target assistant answer')
        prompt = processor.apply_chat_template(row['messages'][:-1], tokenize=False,
            add_generation_prompt=True, enable_thinking=False)
        prompt_ids = tokenizer(prompt, add_special_tokens=False)['input_ids']
        target_ids = tokenizer(row['messages'][-1]['content'] + tokenizer.eos_token, add_special_tokens=False)['input_ids']
        ids = prompt_ids + target_ids
        if len(ids) > max_length:
            raise ValueError('Context exceeded; split/review long examples instead of silently truncating')
        result.append({'input_ids': ids, 'attention_mask': [1] * len(ids),
                       'labels': [-100] * len(prompt_ids) + target_ids})
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-dir', type=Path, default=Path('outputs/qwen-local/geometry-v1'))
    parser.add_argument('--model-dir', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--execute', choices=['benchmark', 'pilot'])
    parser.add_argument('--experimental-unreviewed', action='store_true')
    args = parser.parse_args()
    plan = json.loads(Path('tools/qwen-local/training-plan.json').read_text(encoding='utf-8'))
    manifest = json.loads((args.data_dir / 'manifest.json').read_text(encoding='utf-8'))
    for name, expected_hash in manifest['files'].items():
        if hashlib.sha256((args.data_dir / name).read_bytes()).hexdigest() != expected_hash:
            parser.error(f'Frozen data hash mismatch: {name}')
    rows = [json.loads(line) for line in (args.data_dir / 'sft-unreviewed.jsonl').read_text(encoding='utf-8').splitlines() if line.strip()]
    training_ids = {json.loads(line)['id'] for line in (args.data_dir / 'train.jsonl').read_text(encoding='utf-8').splitlines() if line.strip()}
    expected_count = manifest['counts']['train']
    if not rows or len(rows) != expected_count or len({r['id'] for r in rows}) != expected_count or any(r['id'] not in training_ids for r in rows):
        parser.error('Expected unique training-only rows matching the frozen manifest')
    pilot_steps = min(250, math.ceil(len(rows) / 8) * 2)
    if not args.execute:
        print(json.dumps({'status': 'prepared_not_executed', 'rows': len(rows), 'model': plan['model'],
                          'benchmark_steps': 30, 'pilot_max_steps': pilot_steps, 'epochs': 2,
                          'method': plan['method'], 'gpu_required': True, 'preparation_does_not_test_cuda': True}, indent=2))
        return
    if not args.experimental_unreviewed:
        parser.error('Exercise labels are unreviewed; experimental execution requires --experimental-unreviewed')
    if not args.model_dir or not args.model_dir.is_dir() or not args.output:
        parser.error('Existing local GPU-machine model directory and --output are required')
    if args.output.exists():
        parser.error('Output exists: choose a fresh experiment directory')
    # Never download weights or publish adapters as a side effect of this runner.
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    os.environ['WANDB_DISABLED'] = 'true'
    os.environ['UNSLOTH_DISABLE_STATISTICS'] = '1'
    # Avoid the initial region-compile cost for short numeric pilots; caller can opt back in.
    os.environ.setdefault('UNSLOTH_COMPILE_DISABLE', '1')
    from unsloth import FastVisionModel
    import torch
    from datasets import Dataset
    from transformers import TrainerCallback, Trainer, TrainingArguments, DataCollatorForSeq2Seq
    if not torch.cuda.is_available() or not torch.cuda.is_bf16_supported():
        parser.error('A BF16-capable CUDA GPU is required; CPU execution is refused')
    if torch.cuda.device_count() != 1 or torch.cuda.get_device_properties(0).total_memory < 40 * 1024**3:
        parser.error('This experiment requires one visible GPU with at least 40 GiB VRAM')
    model, processor = FastVisionModel.from_pretrained(str(args.model_dir), dtype=torch.bfloat16,
        load_in_4bit=False, max_seq_length=plan['max_sequence_length'], use_gradient_checkpointing='unsloth', local_files_only=True)
    model = FastVisionModel.get_peft_model(model, finetune_vision_layers=False,
        finetune_language_layers=True, finetune_attention_modules=True, finetune_mlp_modules=True,
        r=16, lora_alpha=16, lora_dropout=0, bias='none', random_state=3407)
    FastVisionModel.for_training(model)
    tokenizer = processor.tokenizer if hasattr(processor, 'tokenizer') else processor
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token
    features = response_features(processor, tokenizer, rows, plan['max_sequence_length'])
    lengths = [len(f['input_ids']) for f in features]
    if max(lengths) > plan['max_sequence_length']:
        parser.error('Context exceeded; split/review long examples instead of silently truncating')
    args.output.mkdir(parents=True)
    from importlib.metadata import version
    (args.output / 'environment.json').write_text(json.dumps({
        'model_dir': str(args.model_dir), 'model_config_sha256': hashlib.sha256((args.model_dir / 'config.json').read_bytes()).hexdigest(),
        'packages': {p: version(p) for p in ['torch', 'transformers', 'trl', 'peft', 'unsloth']},
        'gpu': torch.cuda.get_device_name(0), 'data_manifest': manifest,
        'token_lengths': {'min': min(lengths), 'max': max(lengths), 'median': statistics.median(lengths)},
        'labels': 'unreviewed experimental', 'plan': plan}, ensure_ascii=False, indent=2), encoding='utf-8')
    timings = []

    class Timing(TrainerCallback):
        def on_train_begin(self, args_, state, control, **kwargs):
            self.started = time.perf_counter()
            torch.cuda.reset_peak_memory_stats()

        def on_step_begin(self, args_, state, control, **kwargs):
            torch.cuda.synchronize()
            self.step_started = time.perf_counter()

        def on_step_end(self, args_, state, control, **kwargs):
            torch.cuda.synchronize()
            timings.append({'optimizer_step': state.global_step, 'seconds': time.perf_counter() - self.step_started})
            steady = [r['seconds'] for r in timings if r['optimizer_step'] > 10]
            (args.output / 'timing.json').write_text(json.dumps({'steps': timings,
                'steady_state_mean_seconds': statistics.mean(steady) if steady else None,
                'peak_allocated_gib': torch.cuda.max_memory_allocated() / 1024**3,
                'peak_reserved_gib': torch.cuda.max_memory_reserved() / 1024**3}, indent=2), encoding='utf-8')
            # Soft training-loop bound only; NOT a provider billing/shutdown mechanism.
            if time.perf_counter() - self.started > 4 * 3600:
                control.should_training_stop = True
            return control

    config = dict(output_dir=str(args.output / 'checkpoints'), per_device_train_batch_size=1,
        gradient_accumulation_steps=8, num_train_epochs=2, max_steps=30 if args.execute == 'benchmark' else pilot_steps,
        learning_rate=1e-4, warmup_steps=10, logging_steps=1, save_steps=50, save_total_limit=2,
        bf16=True, fp16=False, optim='adamw_8bit', seed=3407, report_to='none')
    # Plain Trainer avoids treating text-only records as image batches; only assistant tokens carry loss.
    trainer = Trainer(model=model, processing_class=tokenizer, train_dataset=Dataset.from_list(features),
        data_collator=DataCollatorForSeq2Seq(tokenizer=tokenizer, padding=True, label_pad_token_id=-100, pad_to_multiple_of=8),
        args=TrainingArguments(**config), callbacks=[Timing()])
    trainer.train()
    model.save_pretrained(str(args.output / 'adapter'))
    processor.save_pretrained(str(args.output / 'adapter'))
    print('Experimental adapter saved. Benchmark adapter is not a release. Compare base/adapted dev results before proceeding.')


if __name__ == '__main__':
    main()
