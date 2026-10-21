"""EGITIM-01 format preparation, CPU tokenizer audit and opt-in GPU runner."""
import argparse
import json
import os
from pathlib import Path
import sys
import time
from egitim01_features import LocalTextTokenizer, load_splits, normalize_messages, prepare_features, sha


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', type=Path, default=Path('outputs/egitim-01'))
    parser.add_argument('--tokenizer-dir', type=Path)
    parser.add_argument('--model-dir', type=Path)
    parser.add_argument('--output', type=Path)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--dry-run', action='store_true')
    mode.add_argument('--execute', choices=['benchmark', 'pilot'])
    parser.add_argument('--approved-run', action='store_true')
    parser.add_argument('--samples', type=int, default=5)
    parser.add_argument('--max-length', type=int)
    args = parser.parse_args()
    plan = json.loads(Path('tools/qwen-local/training-plan.json').read_text(encoding='utf8'))
    limit = plan['max_sequence_length'] if args.max_length is None else args.max_length
    if limit < 1 or args.samples < 1:
        parser.error('Context and sample count must be positive')
    try:
        splits, hashes = load_splits(args.data_dir)
    except (ValueError, OSError) as error:
        parser.error(str(error))
    report = {'contract': 'egitim-01/messages/reply-actions', 'model': plan['model'],
              'train_rows': len(splits['train']), 'dev_rows': len(splits['dev']),
              'data_files_sha256': hashes, 'max_sequence_length': limit,
              'model_loaded': False, 'gpu_executed': False, 'training_started': False}
    if not args.dry_run and not args.execute:
        report['status'] = 'format_prepared_tokenization_pending'
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0
    if not args.output or args.output.exists():
        parser.error('A fresh --output directory is required')
    if args.execute and not args.approved_run:
        parser.error('GPU execution requires an explicitly approved run (--approved-run)')
    if args.execute and plan.get('large_training_gate', {}).get('enabled') is not True:
        parser.error('Training gate is disabled in the reviewed plan; GPU execution is refused')
    directory = args.tokenizer_dir if args.dry_run else args.model_dir
    if not directory or not directory.is_dir():
        parser.error('A local --tokenizer-dir (dry run) or --model-dir (GPU) is required')
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    try:
        tokenizer = LocalTextTokenizer(directory)
        if args.dry_run:
            if len(splits['train']) < args.samples:
                parser.error('Not enough unique training rows for the requested sample count')
            n = args.samples
            indices = [0] if n == 1 else [i * (len(splits['train']) - 1) // (n - 1) for i in range(n)]
            rows = [splits['train'][i] for i in indices]
            features, audits = prepare_features(tokenizer, rows, limit, allow_overflow=True)
        else:
            # No weights/frameworks are loaded before all examples pass context.
            features, audits = prepare_features(tokenizer, splits['train'], limit)
            dev_features, _ = prepare_features(tokenizer, splits['dev'], limit)
    except (ValueError, OSError, ImportError) as error:
        parser.error(str(error))
    if args.dry_run:
        args.output.mkdir(parents=True)
        raw = ''.join(json.dumps({'id': r['id'], **f}, separators=(',', ':')) + '\n'
                      for r, f in zip(rows, features)).encode()
        (args.output / 'features.jsonl').write_bytes(raw)
        over = [r['id'] for r in audits if not r['within_context']]
        report.update(status='dry_run_context_overflow' if over else 'dry_run_passed',
                      samples=len(rows), selection='Evenly spaced training rows only; no dev sampling',
                      tokenizer_files_sha256=tokenizer.file_hashes, tokenizer_packages=tokenizer.package_versions, features_sha256=sha(raw),
                      assistant_payload_and_eos_masks_passed=True, context_gate_passed=not over,
                      over_context_rows=over, full_dataset_tokenization_checked=False,
                      framework_modules_loaded={k: k in sys.modules for k in ['torch', 'transformers', 'unsloth']},
                      rows=audits)
        (args.output / 'dry-run.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 2 if over else 0
    run_gpu(args, plan, splits, features, dev_features, tokenizer, report, audits)
    return 0


def run_gpu(args, plan, splits, features, dev_features, local_tokenizer, report, audits):
    """Not exercised by the CPU audit. Provisioning/billing is external."""
    os.environ['WANDB_DISABLED'] = 'true'
    os.environ['UNSLOTH_DISABLE_STATISTICS'] = '1'
    os.environ.setdefault('UNSLOTH_COMPILE_DISABLE', '1')
    from unsloth import FastVisionModel
    import torch
    from datasets import Dataset
    from transformers import Trainer, TrainerCallback, TrainingArguments, DataCollatorForSeq2Seq
    if not torch.cuda.is_available() or not torch.cuda.is_bf16_supported():
        raise ValueError('A BF16-capable CUDA GPU is required; CPU training is refused')
    if torch.cuda.device_count() != 1 or torch.cuda.get_device_properties(0).total_memory < 40 * 1024**3:
        raise ValueError('Expected one GPU with at least 40 GiB VRAM')
    model, processor = FastVisionModel.from_pretrained(str(args.model_dir), dtype=torch.bfloat16,
        load_in_4bit=False, max_seq_length=report['max_sequence_length'],
        use_gradient_checkpointing='unsloth', local_files_only=True)
    model = FastVisionModel.get_peft_model(model, finetune_vision_layers=False,
        finetune_language_layers=True, finetune_attention_modules=True, finetune_mlp_modules=True,
        r=16, lora_alpha=16, lora_dropout=0, bias='none', random_state=3407)
    FastVisionModel.for_training(model)
    hf_tokenizer = processor.tokenizer if hasattr(processor, 'tokenizer') else processor
    if hf_tokenizer.pad_token_id is None:
        hf_tokenizer.pad_token = hf_tokenizer.eos_token
    for row, feature in zip(splits['train'] + splits['dev'], features + dev_features):
        rendered = local_tokenizer.render(normalize_messages(row))
        if hf_tokenizer(rendered, add_special_tokens=False)['input_ids'] != feature['input_ids']:
            raise ValueError('GPU processor token IDs differ from CPU-prepared local tokenizer IDs')
    args.output.mkdir(parents=True)
    report.update(model_loaded=True, gpu_executed=True, training_started=True, token_audit=audits,
                  loss='Every assistant JSON payload and EOS; prompts/headers/empty thinking/padding masked',
                  budget='User limit 6 hours / 4 USD; provider billing/shutdown enforcement remains external')
    (args.output / 'preflight.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf8')

    class TimeBound(TrainerCallback):
        def on_train_begin(self, args_, state, control, **kwargs):
            self.started = time.monotonic()

        def on_step_end(self, args_, state, control, **kwargs):
            if time.monotonic() - self.started >= 6 * 3600:
                control.should_training_stop = True
            return control

    trainer = Trainer(model=model, processing_class=hf_tokenizer,
        train_dataset=Dataset.from_list(features),
        eval_dataset=Dataset.from_list(dev_features) if dev_features else None,
        data_collator=DataCollatorForSeq2Seq(tokenizer=hf_tokenizer, padding=True, label_pad_token_id=-100, pad_to_multiple_of=8),
        args=TrainingArguments(output_dir=str(args.output / 'checkpoints'), per_device_train_batch_size=1,
            gradient_accumulation_steps=8, num_train_epochs=2,
            max_steps=30 if args.execute == 'benchmark' else -1, learning_rate=1e-4,
            warmup_steps=10, logging_steps=1, save_steps=100, save_total_limit=2,
            eval_strategy='steps' if dev_features else 'no', eval_steps=100,
            bf16=True, fp16=False, optim='adamw_8bit', seed=3407, report_to='none'),
        callbacks=[TimeBound()])
    trainer.train()
    model.save_pretrained(str(args.output / 'adapter'))
    processor.save_pretrained(str(args.output / 'adapter'))
