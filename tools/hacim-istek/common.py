"""Separate, unapproved H1 projection; not added to existing training exports."""
from pathlib import Path
import json,hashlib,collections,importlib.util
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'knowledge/ai-egitim/veri/hacim-1-istek'
spec=importlib.util.spec_from_file_location('converter',ROOT/'tools/egitim-donustur/donustur.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rows=[]
for lang in ['tr','en','de','fr','nl','da','es','it','ar']:
 file=BASE/(lang+'.jsonl');raw=file.read_bytes()
 for r in map(json.loads,raw.decode('utf8').splitlines()):
  # All variants share the same synthetic five-room plan. Keep every translation,
  # value and intent on that plan in a single cluster. No fake independent splits.
  layer=r['assistant']['actions'][0]['katman'] if r['assistant']['actions'] else 'genel-sohbet'
  rows.append(dict(id=r['id'],dil=lang,ulke=None,katman='ev-plani' if layer=='ev' else layer,kaynak=dict(veri_seti='hacim-1-istek',kayit=r['id'],lisans='AURA original authored text and synthetic room studies',dosya=file.relative_to(ROOT).as_posix(),sha256=m.sha(raw),gruplar=['plan:hacim-istek-synthetic-room-studies-v1']),durum_once=r['state'],mesajlar=[dict(rol='user',metin=r['user']),dict(rol='assistant',metin=r['assistant']['reply'])],islemler=[{'tur':op['type'],'katman':op['katman'],'arguments':{k:v for k,v in op.items() if k not in ['type','katman']}} for op in r['assistant']['actions']],denetim=dict(gecti=False,uyarilar=['human_review_pending','language_review_pending','combined_corpus_dedup_review_pending'],yasakli_terim=0,dil_tutarli=None,motor_gecti=r['motor']['report']['gecti'] and not r['motor']['target_mismatches'],insan_onayi=False,grup=''),bolum='train'))
groups=m.assign(rows,{})
assert not m.leakage(rows)
from jsonschema import Draft202012Validator
v=Draft202012Validator(json.loads((ROOT/'knowledge/ai-egitim/AURA-EGITIM-1.schema.json').read_text(encoding='utf8')))
for r in rows:v.validate(r)
(BASE/'karantina.jsonl').write_text(''.join(m.canonical(r)+'\n' for r in rows),encoding='utf8',newline='\n')
manifest=json.loads((BASE/'sayim-raporu.json').read_text(encoding='utf8'))
manifest['common_contract']={'schema':'AURA-EGITIM-1','rows':len(rows),'primary':False,'source_clusters':groups,'split_rows':dict(collections.Counter(r['bolum'] for r in rows)),'training_exported':0,'policy':'All cases share a synthetic plan: one cluster, no independent dev/test set claimed. Projection is not extra data.'}
manifest['common_contract']['operation_encoding']='tur is the operation name; arguments preserves native room/opening tur without key collision. tools/egitim-donustur/operations.mjs decodes both this nested form and legacy flat operations. Independent quarantine, not exported to training.'
(BASE/'sayim-raporu.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps(manifest['common_contract']))
