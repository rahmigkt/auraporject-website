"""Optional offline baseline. Requires a separately installed compatible torch/transformers.
No API, download, training, or generated Python/CAD execution. Model directory must already exist.
"""
import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', required=True)
    parser.add_argument('--prompts', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--max-new-tokens', type=int, default=1024)
    parser.add_argument('--adapter')
    args = parser.parse_args()
    if not Path(args.model_dir).is_dir():
        parser.error('Model must already exist in a local directory')
    if Path(args.output).exists():
        parser.error('Output already exists; choose a new baseline file')
    import torch
    from transformers import AutoProcessor, AutoModelForImageTextToText
    processor = AutoProcessor.from_pretrained(args.model_dir, local_files_only=True)
    model = AutoModelForImageTextToText.from_pretrained(
        args.model_dir, local_files_only=True, torch_dtype='auto', device_map='auto')
    if args.adapter:
        from peft import PeftModel
        model = PeftModel.from_pretrained(model, args.adapter, local_files_only=True)
    model.eval()
    rows = [json.loads(line) for line in Path(args.prompts).read_text(encoding='utf-8').splitlines() if line.strip()]
    with Path(args.output).open('x', encoding='utf-8') as output:
        for row in rows:
            inputs = processor.apply_chat_template(row['messages'], tokenize=True,
                add_generation_prompt=True, return_dict=True, return_tensors='pt', enable_thinking=False)
            inputs = inputs.to(model.device)
            with torch.inference_mode():
                tokens = model.generate(**inputs, do_sample=False, max_new_tokens=args.max_new_tokens)
            text = processor.decode(tokens[0][inputs['input_ids'].shape[-1]:], skip_special_tokens=True)
            try:
                answer = json.loads(text)
            except json.JSONDecodeError:
                answer = None  # Invalid/truncated answers count as failures, never as passes.
            output.write(json.dumps({'id': row['id'], 'output': answer, 'raw': text}, ensure_ascii=False) + '\n')
            output.flush()
            print(f"completed {row['id']}", flush=True)


if __name__ == '__main__':
    main()
