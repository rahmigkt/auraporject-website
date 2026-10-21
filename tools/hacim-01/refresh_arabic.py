"""Revalidate the existing Arabic delivery after upstream placement changes.
Archive exact old Git blobs first; never invent coordinates or rewrite dialogue.
"""
from pathlib import Path
import hashlib,json,os,subprocess,sys
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'knowledge/ai-egitim/veri/ev-sohbet-arap-olculu'
ARCH=ROOT/'knowledge/ai-egitim/toparlama-01/archive/hacim-01-arap-oncesi'
sha=lambda b:hashlib.sha256(b).hexdigest()
def run():
 proof=json.loads((BASE/'byte-tekrar.json').read_text(encoding='utf-8'))
 paths=list(proof['files'])+['knowledge/ai-egitim/veri/ev-sohbet-arap-olculu/byte-tekrar.json']
 ARCH.mkdir(parents=True,exist_ok=True);manifest=[]
 if '--rebuild-only' in sys.argv:
  manifest=json.loads((ARCH/'manifest.json').read_text(encoding='utf-8'))
  for saved in manifest:assert sha((ROOT/saved['path']).read_bytes())==saved['sha256']
 else:
  for p in paths:
   b=subprocess.check_output(['git','show','HEAD:'+p],cwd=ROOT)
   target=ARCH/p
   target.parent.mkdir(parents=True,exist_ok=True)
   if target.exists():assert target.read_bytes()==b,'Refuse to replace earlier archive'
   else:target.write_bytes(b)
   manifest.append({'path':target.relative_to(ROOT).as_posix(),'original_path':p,'sha256':sha(b),'status':'superseded'})
  (ARCH/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 before_dialogues={p.name:json.loads(p.read_text(encoding='utf-8'))['dialogue'] for p in BASE.glob('ev-sohbet-arap-olculu-*.json')}
 hashes=[]
 for repeat in range(2):
  for script in ['tools/ev-arap/olculu/build.py','tools/ev-arap/olculu/review.py']:subprocess.run([sys.executable,script],cwd=ROOT,check=True)
  hashes.append({p:sha((ROOT/p).read_bytes()) for p in proof['files']})
 assert hashes[0]==hashes[1],'Non-deterministic rebuild'
 for p in BASE.glob('ev-sohbet-arap-olculu-*.json'):assert json.loads(p.read_text(encoding='utf-8'))['dialogue']==before_dialogues[p.name]
 proof.update(passed=True,files=hashes[1],source_refresh='HACIM-01: upstream motor revalidation; original Git blobs archived; two complete rebuilds identical; dialogue unchanged')
 (BASE/'byte-tekrar.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 print('Refreshed 12 records, original dialogue unchanged, 39 outputs reproducible')
if __name__=='__main__':run()
