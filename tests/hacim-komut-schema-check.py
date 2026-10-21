import hashlib,importlib.util,json
from pathlib import Path
from jsonschema import Draft202012Validator
base=Path('knowledge/ai-egitim/veri/hacim-1-komut')
rows=[json.loads(s) for s in (base/'karantina.jsonl').read_text(encoding='utf-8').splitlines()]
v=Draft202012Validator(json.loads(Path('knowledge/ai-egitim/AURA-EGITIM-1.schema.json').read_text(encoding='utf-8')))
spec=importlib.util.spec_from_file_location('conv','tools/egitim-donustur/donustur.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
raw={r['id']:r for l in ['tr','en','de','fr','nl','da','es','it','ar'] for r in map(json.loads,(base/(l+'.jsonl')).read_text(encoding='utf-8').splitlines())}
assert len(rows)==len(raw)==1800
for r in rows:
 v.validate(r);source=raw[r['id']]
 assert not r['denetim']['gecti'] and not r['denetim']['insan_onayi'] and r['denetim']['dil_tutarli'] is None
 assert r['denetim']['motor_gecti'] and r['denetim']['uyarilar']==['human_review_pending','language_review_pending','combined_corpus_dedup_review_pending']
 assert r['kaynak']['sha256']==hashlib.sha256(Path(r['kaynak']['dosya']).read_bytes()).hexdigest()
 assert r['durum_once']==source['state']
 assert r['mesajlar']==[{'rol':'user','metin':source['user']},{'rol':'assistant','metin':source['assistant']['reply']}]
 assert r['islemler']==[{'tur':a['type'],'katman':'mobilya',**{k:v for k,v in a.items() if k!='type'}} for a in source['assistant']['actions']]
assert not m.leakage(rows)
for family in ['seating','table','storage']:
 group=[r for r in rows if r['durum_once']['design']['family']==family]
 assert len({r['bolum'] for r in group})==1
 assert len({r['denetim']['grup'] for r in group})==1
for part in ['train','dev','test']:assert Path('knowledge/ai-egitim/veri/birlesik',part+'.jsonl').read_bytes()==b''
report=json.loads((base/'sayim-raporu.json').read_text(encoding='utf-8'));assert report['inventory']['total_candidate_rows_not_unique_projects']==4390
print('PASS H1 1800 common-schema quarantine projections, bound raw hashes/targets, three translation/state clusters, empty existing training exports')
