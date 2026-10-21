from pathlib import Path
import copy,hashlib,json,collections,sys
sys.path.insert(0,str(Path('tools/ev-sohbet').resolve()))
from denetim import check
from uslup_denetim import inspect
root=Path('knowledge/ai-egitim/veri/ev-sohbet-arap-olculu')
rows=[json.loads(p.read_text(encoding='utf-8')) for p in sorted(root.glob('ev-sohbet-arap-olculu-*.json'))]
assert len(rows)==12 and len({r['source']['id'] for r in rows})==12
assert collections.Counter(r['country'] for r in rows)==dict(AE=3,SA=3,QA=2,KW=2,EG=1,MA=1)
for r in rows:
 assert len(r['dialogue'])==16 and [m['role'] for m in r['dialogue']]==['user','assistant']*8
 assert check(r,root/'kaynaklar')['accepted_with_documented_source_exceptions']
 assert r['native_motor']['result']['report']['gecti'] and not r['denetim']['gecti']
 assert not r['training_started'] and r['human_review']=='pending' and r['native_review']=='pending'
style=inspect(rows);assert style['passed'] and not style['repeated_assistant_sentences']
door=copy.deepcopy(rows[3]);door['plan']['items']=copy.deepcopy(door['layout_candidates'][0]['items']);door['layout_requests'][0]['selected_alternative']=0
assert any(e['code']=='door_swing_obstructed' for e in check(door,root/'kaynaklar')['errors']),'Unsafe raw solver option must remain rejected'
assert sum(r['requested_floors']==2 for r in rows)==2
assert sum(r['layout_scope']['majlis_pending'] for r in rows)==4
assert '٢٤٠' in rows[9]['dialogue'][0]['content']
for mutate in ['coordinate','source_hash','wall','selection_index']:
 r=copy.deepcopy(rows[0])
 if mutate=='coordinate':r['plan']['items'][0]['pos_xy_mm'][0]+=90000
 elif mutate=='source_hash':r['source']['fixture_sha256']='0'*64
 elif mutate=='wall':r['plan']['walls'][0]['from_xy_mm'][0]+=100
 else:r['layout_requests'][0]['selected_alternative']=999
 assert not check(r,root/'kaynaklar')['accepted_with_documented_source_exceptions'],mutate
for x in json.loads((root/'inceleme-manifest.json').read_text(encoding='utf-8')):
 assert hashlib.sha256((root/x['record']).read_bytes()).hexdigest()==x['record_sha256']
 assert hashlib.sha256((root/x['svg']).read_bytes()).hexdigest()==x['svg_sha256']
proof=json.loads((root/'byte-tekrar.json').read_text(encoding='utf-8'));assert proof['passed']
for p,sha in proof['files'].items():assert hashlib.sha256(Path(p).read_bytes()).hexdigest()==sha
print('PASS 12 measured-source geometry audits, country/language/8-turn truthfulness, manual-position/source/wall mutations, 12 SVG hashes; native and designer review pending')
