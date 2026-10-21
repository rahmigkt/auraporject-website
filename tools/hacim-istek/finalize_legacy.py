"""Keep historical proofs, then describe new generated placement bytes honestly."""
from pathlib import Path
import copy,hashlib,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/ev-sohbet'))
from uslup_duzelt import body,digest,ARCHIVE
ARCH=ROOT/'knowledge/ai-egitim/toparlama-01/archive/hacim-01-arap-oncesi'
reportfile=ROOT/'knowledge/ai-egitim/veri/hacim-1-istek/yerlesim-yenileme.json'
report=json.loads(reportfile.read_text(encoding='utf8'))
original_style=json.loads(ARCHIVE.read_text(encoding='utf8'))
def invariant(r):
 r=copy.deepcopy(r)
 for k in ['solver','layout_results']:r.pop(k)
 r['plan'].pop('items')
 for req in r['layout_requests']:
  for a in req['attempts']:a.pop('result')
 return r
for change in report['rows']:
 before=json.loads((ROOT/change['archive']).read_text(encoding='utf8'))
 after=json.loads((ROOT/change['path']).read_text(encoding='utf8'))
 assert invariant(before)==invariant(after)
 assert digest(body(before))==original_style[before['id']]['body_sha256']
 # Python's original JSON numbers can retain .0; do not compare a JS re-encoding
 # of those old bytes with the historical Python digest.
 change.update(before_body_sha256=digest(body(before)),after_body_sha256=digest(body(after)),unchanged_input_sha256=digest(invariant(after)))
reportfile.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
for batch in ['dk','es','it']:
 f=ROOT/f'knowledge/ai-egitim/veri/ev-sohbet-{batch}/yeniden-uretim-sonucu.json'
 relative=f.relative_to(ROOT).as_posix();b=subprocess.check_output(['git','show','HEAD:'+relative],cwd=ROOT)
 target=ARCH/relative;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists():assert target.read_bytes()==b
 else:target.write_bytes(b)
 data=json.loads(b)
 for file in data['hashes']:data['hashes'][file]=hashlib.sha256((f.parent/file).read_bytes()).hexdigest()
 # No false claim that the original generator still produces the new overlay.
 data['byte_identical']=False
 data['method']='HACIM-01 current-motor placement overlay; original editorial proof archived; dialogue, dimensions, fit decisions and request inputs invariant. No full historical-generator byte reproducibility claim.'
 data['historical_manifest']=target.relative_to(ROOT).as_posix()
 f.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
print('40 original Python style hashes and semantic invariants preserved; 3 historical byte proofs archived and current file hashes refreshed')
