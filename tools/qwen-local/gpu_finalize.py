"""Package the completed pilot and hash all retained results; no model execution."""
from pathlib import Path
import hashlib
import json
import math
import shutil
import struct
import tarfile

root=Path('/workspace/aura-runs/first')
weights=root/'pilot-eager/adapter/adapter_model.safetensors'
assert weights.is_file() and (root/'control-score.json').is_file()
with weights.open('rb') as f:
    length=struct.unpack('<Q',f.read(8))[0]
    assert length<16*1024*1024
    header=json.loads(f.read(length))
tensors={k:v for k,v in header.items() if k!='__metadata__'}
assert tensors and all('lora_' in k for k in tensors)
parameters=sum(math.prod(v['shape']) for v in tensors.values())
assert parameters==43278336
for name in ['train_gpu.py','infer.py','studio_evaluate.py']:
    shutil.copyfile(Path('/workspace/aura/tools/qwen-local')/name,root/(name+'.executed'))
for name in ['gpu_prepare.sh','gpu_resume.sh']:
    shutil.copyfile(Path('/workspace')/name,root/(name+'.executed'))
files=[p for p in root.rglob('*') if p.is_file() and 'checkpoints' not in p.parts and p.name!='artifact-manifest.json']
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):
            h.update(chunk)
    return h.hexdigest()
manifest={'status':'completed_experimental_pilot','trainable_parameters':parameters,
          'base_model':'Qwen/Qwen3.5-9B','base_revision':json.loads(Path('/workspace/model-revision.json').read_text())['revision'],
          'files':{p.relative_to(root).as_posix():{'bytes':p.stat().st_size,'sha256':sha(p)} for p in files}}
(root/'artifact-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
archive=Path('/workspace/aura-results.tar.gz')
with tarfile.open(archive,'w:gz',compresslevel=1) as tf:
    for p in sorted(root.rglob('*')):
        if p.is_file() and 'checkpoints' not in p.parts:
            tf.add(p,arcname='first/'+p.relative_to(root).as_posix(),recursive=False)
    for name in ['model-revision.json','aura-packages.txt']:
        tf.add(Path('/workspace')/name,arcname=name)
Path('/workspace/aura-results.sha256').write_text(sha(archive)+'  aura-results.tar.gz\n')
print(json.dumps({'archive_bytes':archive.stat().st_size,'sha256':sha(archive),'adapter_parameters':parameters},indent=2))
