#!/usr/bin/env bash
set -euo pipefail
source /workspace/aura-venv/bin/activate
cd /workspace/aura
export HF_HOME=/workspace/hf-cache
export HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 HF_HUB_DISABLE_TELEMETRY=1
export UNSLOTH_DISABLE_STATISTICS=1 TOKENIZERS_PARALLELISM=false UNSLOTH_COMPILE_DISABLE=1
MODEL_DIR="$(cat /workspace/model-path.txt)"
OUT=/workspace/aura-runs/first
echo EAGER_TRAIN_START
python -u tools/qwen-local/train_gpu.py --data-dir outputs/qwen-local/studio-v1 --model-dir "$MODEL_DIR" --output "$OUT/pilot-eager" --execute pilot --experimental-unreviewed > "$OUT/train-eager.log" 2>&1
echo TRAIN_DONE
python -u tools/qwen-local/infer.py --model-dir "$MODEL_DIR" --adapter "$OUT/pilot-eager/adapter" --prompts outputs/qwen-local/studio-v1/dev-prompts.jsonl --output "$OUT/adapter-dev.jsonl" --max-new-tokens 160 > "$OUT/adapter.log" 2>&1
python tools/qwen-local/studio_evaluate.py --predictions "$OUT/adapter-dev.jsonl" > "$OUT/adapter-score.json"
python -u tools/qwen-local/infer.py --model-dir "$MODEL_DIR" --prompts outputs/qwen-local/studio-schema-control.jsonl --output "$OUT/base-schema-control.jsonl" --max-new-tokens 160 > "$OUT/control.log" 2>&1
python tools/qwen-local/studio_evaluate.py --predictions "$OUT/base-schema-control.jsonl" > "$OUT/control-score.json"
cat "$OUT/adapter-score.json" "$OUT/control-score.json"
tar --exclude='*/checkpoints' -czf /workspace/aura-results.tar.gz -C /workspace/aura-runs first -C /workspace model-revision.json aura-packages.txt
sha256sum /workspace/aura-results.tar.gz > /workspace/aura-results.sha256
echo PILOT_COMPLETE
