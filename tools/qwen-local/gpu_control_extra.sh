#!/usr/bin/env bash
set -euo pipefail
source /workspace/aura-venv/bin/activate
cd /workspace/aura
export HF_HOME=/workspace/hf-cache HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 TOKENIZERS_PARALLELISM=false
MODEL_DIR="$(cat /workspace/model-path.txt)"
OUT=/workspace/aura-control-extra
mkdir -p "$OUT"
python -u tools/qwen-local/infer.py --model-dir "$MODEL_DIR" --adapter /workspace/aura-runs/first/pilot-eager/adapter --prompts outputs/qwen-local/studio-schema-control.jsonl --output "$OUT/adapter-schema-control.jsonl" --max-new-tokens 160 > "$OUT/control.log" 2>&1
python tools/qwen-local/studio_evaluate.py --predictions "$OUT/adapter-schema-control.jsonl" > "$OUT/score.json"
sha256sum "$OUT"/* > /workspace/aura-control-extra.sha256
tar -czf /workspace/aura-control-extra.tar.gz -C /workspace aura-control-extra
echo EXTRA_CONTROL_COMPLETE
