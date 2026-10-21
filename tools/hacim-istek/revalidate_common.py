"""Refresh only existing conversation projections against the current engine.
Preserves all unrelated candidates and every existing split; no approval inferred.
Run AFTER committing refreshed source JSONs (catalogue reads Git blobs).
"""
from pathlib import Path
import collections,importlib.util,json
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('convert',ROOT/'tools/egitim-donustur/donustur.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
OUT=ROOT/'knowledge/ai-egitim/veri/birlesik'
ARCH=ROOT/'knowledge/ai-egitim/toparlama-01/archive/hacim-01-arap-oncesi'
def run():
 report=json.loads((OUT/'sayim-raporu.json').read_text(encoding='utf-8'));rows=[json.loads(s) for s in (OUT/'adaylar.jsonl').read_text(encoding='utf-8').splitlines()]
 before={r['id']:m.canonical(r) for r in rows};parts={r['id']:r['bolum'] for r in rows}
 selected=[r for r in rows if r['kaynak']['veri_seti'].startswith('ev-sohbet-')]
 target=ARCH/'combined-conversations-before.jsonl'
 b=''.join(m.canonical(r)+'\n' for r in selected).encode('utf-8')
 if target.exists():
  original=[json.loads(s) for s in target.read_text(encoding='utf8').splitlines()]
  assert {r['id'] for r in original}=={r['id'] for r in selected}
  assert all(parts[r['id']]==r['bolum'] for r in original)
  before.update({r['id']:m.canonical(r) for r in original})
 else:target.write_bytes(b)
 engine_archive=ARCH/'combined-engine-before.json'
 if not engine_archive.exists():engine_archive.write_text(json.dumps({'source_lock':report['source_lock'],'engine_evidence':report['engine_evidence']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 evidence=[];contents=m.CAT.blobs();updated=[]
 for row in rows:
  if row not in selected:updated.append(row);continue
  f=row['kaynak']['dosya'];raw=json.loads(contents[f].decode('utf-8-sig'))
  dataset={'id':row['kaynak']['veri_seti'],'layer':row['katman'],'license':row['kaynak']['lisans']}
  fresh,e=m.convert(dataset,raw,f,m.sha(contents[f]));assert fresh['id']==row['id']
  updated.append(fresh)
  if e:evidence.append({'id':fresh['id'],**e})
  print(fresh['id'],flush=True)
 ledger=json.loads((OUT/'split-ledger.json').read_text(encoding='utf-8'))['keys'];groups=m.assign(updated,ledger)
 assert all(r['bolum']==parts[r['id']] for r in updated);assert not m.leakage(updated)
 assert all(m.canonical(r)==before[r['id']] for r in updated if not r['kaynak']['veri_seti'].startswith('ev-sohbet-'))
 assert len(evidence)==52 and all(e['report']['gecti'] for e in evidence)
 from jsonschema import Draft202012Validator
 validator=Draft202012Validator(json.loads((ROOT/'knowledge/ai-egitim/AURA-EGITIM-1.schema.json').read_text(encoding='utf-8')))
 for r in updated:validator.validate(r);assert not r['denetim']['gecti']
 report.update(source_lock=m.source_lock(),engine_evidence=evidence,warning_counts=dict(collections.Counter(w for r in updated for w in r['denetim']['uyarilar'])))
 report['source_hashes']={p:m.sha((ROOT/p).read_bytes().replace(b'\r\n',b'\n')) for p in report['source_hashes']}
 report['hacim_revalidation']={'conversation_projections_revalidated':len(selected),'native_motor_reports':52,'changed_projection_rows':sum(m.canonical(r)!=before[r['id']] for r in updated),'all_existing_splits_preserved':True,'unrelated_candidate_rows_unchanged':len(rows)-len(selected),'training_started':False}
 (OUT/'adaylar.jsonl').write_text(''.join(m.canonical(r)+'\n' for r in updated),encoding='utf-8',newline='\n')
 (OUT/'sayim-raporu.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 print(json.dumps(report['hacim_revalidation']))
if __name__=='__main__':run()
