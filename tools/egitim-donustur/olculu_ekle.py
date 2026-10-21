"""Append measured-reference Arabic candidates; preserve all prior rows and splits."""
from pathlib import Path
import collections,importlib.util,json
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('convert',ROOT/'tools/egitim-donustur/donustur.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def run():
 out=ROOT/'knowledge/ai-egitim/veri/birlesik';report=json.loads((out/'sayim-raporu.json').read_text(encoding='utf-8'));assert report['source_lock']==m.source_lock()
 dataset={'id':'ev-sohbet-arap-olculu','layer':'yerlesim','license':'CC BY 4.0 geometry; AURA authored dialogue'}
 old=[json.loads(s) for s in (out/'adaylar.jsonl').read_text(encoding='utf-8').splitlines() if json.loads(s)['kaynak']['veri_seti']!=dataset['id']];assert len(old)==2578
 before={r['id']:m.canonical(r) for r in old};contents=m.CAT.blobs()
 for r in old:assert r['kaynak']['sha256']==m.sha(contents[r['kaynak']['dosya']])
 ledger=json.loads((out/'split-ledger.json').read_text(encoding='utf-8'))['keys'];new=[];evidence=[]
 for f in sorted(p for p in contents if p.startswith('knowledge/ai-egitim/veri/ev-sohbet-arap-olculu/ev-sohbet-arap-olculu-')):
  row,e=m.convert(dataset,json.loads(contents[f].decode('utf-8')),f,m.sha(contents[f]));assert e['report']['gecti'];new.append(row);evidence.append({'id':row['id'],**e})
 assert len(new)==12;rows=old+new;groups=m.assign(rows,ledger);assert not m.leakage(rows)
 assert all(m.canonical(r)==before[r['id']] for r in old),'Prior rows or assignments changed'
 from jsonschema import Draft202012Validator
 validator=Draft202012Validator(json.loads((ROOT/'knowledge/ai-egitim/AURA-EGITIM-1.schema.json').read_text(encoding='utf-8')))
 for r in rows:validator.validate(r);assert not r['denetim']['gecti']
 report.update(candidate_rows=len(rows),qualified_training_rows=0,quarantined_rows=len(rows),source_clusters=groups,candidate_split_rows=dict(collections.Counter(r['bolum'] for r in rows)),candidate_split_groups=dict(collections.Counter({r['denetim']['grup']:r['bolum'] for r in rows}.values())),warning_counts=dict(collections.Counter(w for r in rows for w in r['denetim']['uyarilar'])),leakage=[])
 report['engine_evidence']=[e for e in report['engine_evidence'] if not e['id'].startswith(dataset['id']+':')]+evidence
 report['datasets']=[d for d in report['datasets'] if d['dataset']!=dataset['id']]+[{'dataset':dataset['id'],'status':'quarantined_measured_family_room_only','records_converted':12}]
 report['measured_arabic_append']={'new_rows':12,'new_motor_contract_checks':12,'unchanged_prior_rows_and_splits':2578,'qualified_rows':0,'selected_geometry_not_native_turn_label':True}
 (out/'adaylar.jsonl').write_text(''.join(m.canonical(r)+'\n' for r in rows),encoding='utf-8',newline='\n')
 (out/'sayim-raporu.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 (out/'split-ledger.json').write_text(json.dumps({'version':'aura-split-ledger/1','keys':ledger},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 for s in ['train','dev','test']:assert (out/(s+'.jsonl')).read_bytes()==b''
 print(json.dumps({'candidates':len(rows),'motor_contract_reports':len(report['engine_evidence']),'prior_rows_unchanged':2578,'qualified':0,'leakage':[],'source_clusters':groups}))
if __name__=='__main__':run()
