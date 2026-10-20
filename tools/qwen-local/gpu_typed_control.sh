#!/usr/bin/env bash
set -euo pipefail
source /workspace/aura-venv/bin/activate
cd /workspace/aura
export HF_HOME=/workspace/hf-cache HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 TOKENIZERS_PARALLELISM=false
MODEL_DIR="$(cat /workspace/model-path.txt)"
OUT=/workspace/aura-typed-control
mkdir -p "$OUT"
python -u tools/qwen-local/infer.py --model-dir "$MODEL_DIR" --prompts outputs/qwen-local/studio-typed-control.jsonl --output "$OUT/base.jsonl" --max-new-tokens 160 > "$OUT/base.log" 2>&1
python tools/qwen-local/studio_evaluate.py --predictions "$OUT/base.jsonl" > "$OUT/base-score.json"
python -u tools/qwen-local/infer.py --model-dir "$MODEL_DIR" --adapter /workspace/aura-runs/first/pilot-eager/adapter --prompts outputs/qwen-local/studio-typed-control.jsonl --output "$OUT/adapter.jsonl" --max-new-tokens 160 > "$OUT/adapter.log" 2>&1
python tools/qwen-local/studio_evaluate.py --predictions "$OUT/adapter.jsonl" > "$OUT/adapter-score.json"
sha256sum "$OUT"/* > /workspace/aura-typed-control.sha256
tar -czf /workspace/aura-typed-control.tar.gz -C /workspace aura-typed-control
echo TYPED_CONTROL_COMPLETE
