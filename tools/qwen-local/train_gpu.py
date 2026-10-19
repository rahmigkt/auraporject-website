"""GPU-only experimental text pilot. Preparation mode is stdlib-only and the default.
Unsloth/TRL integration is a candidate: real CUDA execution has not been verified yet.
"""
import argparse
import hashlib
import inspect
import json
import os
from pathlib import Path
import statistics
import time


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
    if len(rows) != 1000 or len({r['id'] for r in rows}) != 1000 or any(r['id'] not in training_ids for r in rows):
        parser.error('Expected exactly 1000 unique training-only exercise rows')
    if not args.execute:
        print(json.dumps({'status': 'prepared_not_executed', 'rows': len(rows), 'model': plan['model'],
                          'benchmark_steps': 30, 'pilot_max_steps': 250, 'epochs': 2,
                          'method': plan['method'], 'gpu_required': True, 'cuda_integration_verified': False}, indent=2))
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
    from unsloth import FastVisionModel
    import torch
    from datasets import Dataset
    from transformers import TrainerCallback
    from trl import SFTTrainer, SFTConfig
    if not torch.cuda.is_available() or not torch.cuda.is_bf16_supported():
        parser.error('A BF16-capable CUDA GPU is required; CPU execution is refused')
    if torch.cuda.device_count() != 1 or torch.cuda.get_device_properties(0).total_memory < 40 * 1024**3:
        parser.error('This experiment requires one visible GPU with at least 40 GiB VRAM')
    model, processor = FastVisionModel.from_pretrained(str(args.model_dir), dtype=torch.bfloat16,
        load_in_4bit=False, use_gradient_checkpointing='unsloth', local_files_only=True)
    model = FastVisionModel.get_peft_model(model, finetune_vision_layers=False,
        finetune_language_layers=True, finetune_attention_modules=True, finetune_mlp_modules=True,
        r=16, lora_alpha=16, lora_dropout=0, bias='none', random_state=3407)
    FastVisionModel.for_training(model)
    tokenizer = processor.tokenizer if hasattr(processor, 'tokenizer') else processor
    texts = [processor.apply_chat_template(r['messages'], tokenize=False, add_generation_prompt=False,
                                          enable_thinking=False) for r in rows]
    lengths = [len(tokenizer(t, add_special_tokens=False)['input_ids']) for t in texts]
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
        gradient_accumulation_steps=8, num_train_epochs=2, max_steps=30 if args.execute == 'benchmark' else 250,
        learning_rate=1e-4, warmup_steps=10, logging_steps=1, save_steps=50, save_total_limit=2,
        bf16=True, fp16=False, optim='adamw_8bit', seed=3407, packing=False,
        dataset_text_field='text', dataset_num_proc=1, report_to='none')
    # TRL versions differ in the name of this argument. Fail rather than drop the cap.
    fields = inspect.signature(SFTConfig).parameters
    length_key = 'max_length' if 'max_length' in fields else 'max_seq_length' if 'max_seq_length' in fields else None
    if length_key is None:
        parser.error('Unsupported TRL sequence-length API; verify GPU environment')
    config[length_key] = plan['max_sequence_length']
    trainer = SFTTrainer(model=model, processing_class=tokenizer, train_dataset=Dataset.from_dict({'text': texts}),
        args=SFTConfig(**config), callbacks=[Timing()])
    trainer.train()
    model.save_pretrained(str(args.output / 'adapter'))
    processor.save_pretrained(str(args.output / 'adapter'))
    print('Experimental adapter saved. Benchmark adapter is not a release. Compare base/adapted dev results before proceeding.')


if __name__ == '__main__':
    main()
