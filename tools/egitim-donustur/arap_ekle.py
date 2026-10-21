"""Append only the new Arabic intake source; retain verified old evidence explicitly."""
from pathlib import Path
import collections,copy,importlib.util,json
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('convert',ROOT/'tools/egitim-donustur/donustur.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def run():
 out=ROOT/'knowledge/ai-egitim/veri/birlesik';report=json.loads((out/'sayim-raporu.json').read_text(encoding='utf8'));assert report['source_lock']==m.source_lock()
 old=[json.loads(x) for x in (out/'adaylar.jsonl').read_text(encoding='utf8').splitlines() if json.loads(x)['kaynak']['veri_seti']!='ev-sohbet-arap'];assert len(old)==2566
 before={r['id']:m.canonical(r) for r in old};contents=m.CAT.blobs();hashes={p:m.sha(contents[p]) for p in {r['kaynak']['dosya'] for r in old}}
 assert all(hashes[r['kaynak']['dosya']]==r['kaynak']['sha256'] for r in old)
 ledgerpath=out/'split-ledger.json';ledger=json.loads(ledgerpath.read_text(encoding='utf8'))['keys'] if ledgerpath.exists() else m.seed_ledger(old)
 new=[];dataset={'id':'ev-sohbet-arap','layer':'ev-plani','license':'AURA original authored text'}
 for file in sorted(p for p in contents if p.startswith('knowledge/ai-egitim/veri/ev-sohbet-arap/ev-sohbet-arap-')):
  row,evidence=m.convert(dataset,json.loads(contents[file].decode('utf8')),file,m.sha(contents[file]));assert evidence is None;new.append(row)
 assert len(new)==12;rows=old+new;groups=m.assign(rows,ledger);assert not m.leakage(rows)
 assert all(m.canonical(r)==before[r['id']] for r in old)
 report.update(candidate_rows=len(rows),qualified_training_rows=0,quarantined_rows=len(rows),source_clusters=groups,candidate_split_rows=dict(collections.Counter(r['bolum'] for r in rows)),candidate_split_groups=dict(collections.Counter({r['denetim']['grup']:r['bolum'] for r in rows}.values())),warning_counts=dict(collections.Counter(w for r in rows for w in r['denetim']['uyarilar'])),leakage=[])
 report['datasets']=[d for d in report['datasets'] if d['dataset']!='ev-sohbet-arap']+[{'dataset':'ev-sohbet-arap','status':'quarantined_intake_no_geometry','records_converted':12}]
 report['split_policy']='Frozen existing source assignments; new source groups use stable 80/10/10 hash buckets. Cross-partition bridges fail.'
 report['arabic_append']={'new_intake_rows':12,'fresh_engine_runs':0,'retained_engine_reports':40,'unchanged_prior_rows_and_splits':2566,'method':'Exact source document hashes and unchanged complete engine source tree verified; new records have no operations or plans.'}
 (out/'adaylar.jsonl').write_text(''.join(m.canonical(r)+'\n' for r in rows),encoding='utf8',newline='\n');(out/'sayim-raporu.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n');ledgerpath.write_text(json.dumps({'version':'aura-split-ledger/1','keys':ledger},ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
 print(json.dumps({k:report[k] for k in ['candidate_rows','qualified_training_rows','source_clusters','candidate_split_rows','candidate_split_groups']},ensure_ascii=False))
if __name__=='__main__':run()
