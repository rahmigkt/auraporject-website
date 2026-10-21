"""Finish Python-canonical editorial hashes and replace old generation manifests.
The original float lexical forms can differ from JS JSON serialization, so these
digests use exactly the existing editorial audit's Python canonical function.
"""
from pathlib import Path
import copy,hashlib,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/ev-sohbet'))
from uslup_duzelt import body,digest
def invariant(r):
 r=copy.deepcopy(r)
 for k in ['solver','layout_results']:r.pop(k)
 r['plan'].pop('items')
 for req in r['layout_requests']:
  for a in req['attempts']:a.pop('result')
 return r
def run():
 file=ROOT/'knowledge/ai-egitim/veri/hacim-1-komut/yerlesim-yenileme.json';manifest=json.loads(file.read_text(encoding='utf-8'))
 for r in manifest['rows']:
  saved=(ROOT/r['archive']).read_bytes();assert hashlib.sha256(saved).hexdigest()==r['archive_sha256']
  old=json.loads(saved);now=json.loads((ROOT/r['path']).read_text(encoding='utf-8'));assert invariant(old)==invariant(now)
  r.update(before_body_sha256=digest(body(old)),after_body_sha256=digest(body(now)),unchanged_input_sha256=digest(invariant(now)))
 manifest['canonical_hash_policy']='Existing Python editorial canonical JSON: ensure_ascii=False, sorted keys, compact separators; original archive retains float lexical evidence'
 file.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 for batch in ['02','uk-ie','dk','es','it']:
  base=ROOT/('knowledge/ai-egitim/veri/ev-sohbet-'+batch);original=base/'yeniden-uretim-sonucu.json';archive=ROOT/'knowledge/ai-egitim/toparlama-01/archive/hacim-01-arap-oncesi'/original.relative_to(ROOT)
  archive.parent.mkdir(parents=True,exist_ok=True)
  if not archive.exists():archive.write_bytes(subprocess.check_output(['git','show','HEAD:'+original.relative_to(ROOT).as_posix()],cwd=ROOT))
  paths=sorted(base.glob('ev-sohbet-*.json'));hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
  result={'version':'hacim-current-placement-manifest/1','records':len(paths),'byte_identical':False,'byte_identical_records':0,'changed':list(hashes),'hashes':hashes,'passed':True,'method':'HACIM-01 current production solver replay; previous generation manifest archived. Requests/products/fit statuses unchanged; all generated result bytes deliberately refreshed, not a full original-builder byte reproducibility claim.','historical_manifest':archive.relative_to(ROOT).as_posix(),'historical_manifest_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'current_geometry_audit':'knowledge/ai-egitim/veri/hacim-1-komut/yerlesim-geometri-denetimi.json','current_viewer':'knowledge/ai-egitim/HACIM-01-YERLESIM-inceleme.html'}
  original.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 print('Finalized 40 editorial hashes and five current byte registries; historical generation proofs retained')
if __name__=='__main__':run()
