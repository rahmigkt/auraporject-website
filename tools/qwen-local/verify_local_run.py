"""Verify a returned pilot without loading the model or importing torch."""
import ast
import hashlib
import json
from pathlib import Path
import tarfile
import struct
import math
from studio_evaluate import score

session=Path('../qwen-gpu-session').resolve()
archive=session/'aura-results.tar.gz'
expected=(session/'aura-results.sha256').read_text().split()[0]
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):
            h.update(chunk)
    return h.hexdigest()
assert sha(archive)==expected
dest=session/'results'
dest.mkdir(exist_ok=True)
with tarfile.open(archive) as tf:
    members=tf.getmembers()
    assert len(members)<1000 and sum(m.size for m in members)<1024**3
    assert all((dest/m.name).resolve().is_relative_to(dest) for m in members)
    tf.extractall(dest,filter='data')
root=dest/'first'
manifest=json.loads((root/'artifact-manifest.json').read_text())
for name,meta in manifest['files'].items():
    p=(root/name).resolve()
    assert p.is_relative_to(root) and p.stat().st_size==meta['bytes'] and sha(p)==meta['sha256'],name
load=lambda p:[json.loads(line) for line in p.read_text(encoding='utf-8').splitlines() if line.strip()]
rows=load(Path('outputs/qwen-local/studio-v1/dev.jsonl'))
scores={}
for label,pred,report in [('base','base-dev.jsonl','base-score.json'),('adapter','adapter-dev.jsonl','adapter-score.json'),('explicit_schema_control','base-schema-control.jsonl','control-score.json')]:
    scores[label]=score(rows,load(root/pred))
    assert scores[label]==json.loads((root/report).read_text()),label
weights=root/'pilot-eager/adapter/adapter_model.safetensors'
with weights.open('rb') as f:
    header=json.loads(f.read(struct.unpack('<Q',f.read(8))[0]))
count=sum(math.prod(v['shape']) for k,v in header.items() if k!='__metadata__')
assert count==43278336
environment=json.loads((root/'pilot-eager/environment.json').read_text())
assert environment['data_manifest']==json.loads(Path('outputs/qwen-local/studio-v1/manifest.json').read_text())
logs=[]
for line in (root/'train-eager.log').read_text(encoding='utf-8').splitlines():
    if line.startswith('{') and line.endswith('}'):
        try: logs.append(ast.literal_eval(line))
        except (ValueError,SyntaxError): pass
runtime=next(float(r['train_runtime']) for r in logs if 'train_runtime' in r)
summary={'status':'completed_local_artifacts_verified','archive_sha256':expected,'archive_bytes':archive.stat().st_size,
         'model':'Qwen/Qwen3.5-9B','model_revision':manifest['base_revision'],
         'adapter_parameters':count,'adapter_bytes':weights.stat().st_size,'adapter_sha256':sha(weights),
         'train_rows':196,'dev_rows':40,'test_evaluated':False,'optimizer_steps':50,'training_seconds':runtime,
         'timing':json.loads((root/'pilot-eager/timing.json').read_text()),'token_lengths':environment['token_lengths'],
         'scores':scores,'limitations':['unreviewed deterministic numeric action examples','no aesthetic, physical-safety or other-skill regression claim',
             'original pilot prompt omitted exact action field names; explicit-schema control is exploratory dev analysis',
             'not a live-site integration or deployment; base weights are separately required for local inference']}
extra=session/'aura-control-extra.tar.gz'
if extra.exists() and (session/'aura-control-extra.sha256').exists():
    with tarfile.open(extra) as tf:
        members=tf.getmembers()
        assert sum(m.size for m in members)<10*1024**2
        assert all((dest/m.name).resolve().is_relative_to(dest) for m in members)
        tf.extractall(dest,filter='data')
    extra_root=dest/'aura-control-extra'
    for line in (session/'aura-control-extra.sha256').read_text().splitlines():
        expected_hash,name=line.split(maxsplit=1)
        assert sha(extra_root/Path(name).name)==expected_hash
    extra_score=score(rows,load(extra_root/'adapter-schema-control.jsonl'))
    assert extra_score==json.loads((extra_root/'score.json').read_text())
    summary['scores']['adapter_explicit_schema_control']=extra_score
    summary['extra_archive_sha256']=sha(extra)
typed=session/'aura-typed-control.tar.gz'
if typed.exists():
    with tarfile.open(typed) as tf:
        members=tf.getmembers()
        assert sum(m.size for m in members)<10*1024**2
        assert all((dest/m.name).resolve().is_relative_to(dest) for m in members)
        tf.extractall(dest,filter='data')
    typed_root=dest/'aura-typed-control'
    for line in (session/'aura-typed-control.sha256').read_text().splitlines():
        expected_hash,name=line.split(maxsplit=1)
        assert sha(typed_root/Path(name).name)==expected_hash
    for label in ['base','adapter']:
        result=score(rows,load(typed_root/(label+'.jsonl')))
        assert result==json.loads((typed_root/(label+'-score.json')).read_text())
        summary['scores'][label+'_typed_schema_control']=result
    summary['typed_archive_sha256']=sha(typed)
out=Path('outputs/qwen-local/run-01')
out.mkdir(exist_ok=True)
(out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:summary[k] for k in ['status','training_seconds','adapter_parameters','archive_sha256']},indent=2))
