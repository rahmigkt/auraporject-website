#!/usr/bin/env bash
set -euo pipefail
cd /workspace/aura
export HF_HOME=/workspace/hf-cache
export HF_HUB_DISABLE_TELEMETRY=1
export TOKENIZERS_PARALLELISM=false
python -m venv --system-site-packages /workspace/aura-venv
source /workspace/aura-venv/bin/activate
python -m pip install --no-cache-dir 'torch==2.8.0' 'torchvision==0.23.0' 'unsloth' 'transformers>=5.2,<6' datasets trl peft accelerate pillow
# BF16 LoRA does not use torchao; current torchao imports operators absent in template torch 2.8.
python -m pip uninstall -y torchao
python -m pip freeze > /workspace/aura-packages.txt
python - <<'PY'
from huggingface_hub import HfApi, snapshot_download
from pathlib import Path
import json
info=HfApi().model_info('Qwen/Qwen3.5-9B')
path=snapshot_download('Qwen/Qwen3.5-9B',revision=info.sha)
Path('/workspace/model-path.txt').write_text(path)
Path('/workspace/model-revision.json').write_text(json.dumps({'model':'Qwen/Qwen3.5-9B','revision':info.sha,'path':path},indent=2))
print('MODEL_READY', info.sha, flush=True)
PY
echo PREPARATION_DONE
