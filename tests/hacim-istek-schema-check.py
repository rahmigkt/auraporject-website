from pathlib import Path
import json,hashlib,copy,importlib.util
import sys
from jsonschema import Draft202012Validator
base=Path('knowledge/ai-egitim/veri/hacim-1-istek')
v=Draft202012Validator(json.loads(Path('knowledge/ai-egitim/AURA-EGITIM-1.schema.json').read_text(encoding='utf8')))
rows=[json.loads(s) for s in (base/'karantina.jsonl').read_text(encoding='utf8').splitlines()]
assert len(rows)==1800
source_files={r['kaynak']['dosya'] for r in rows}
file_hashes={f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in source_files}
originals={x['id']:x for f in source_files for x in map(json.loads,Path(f).read_text(encoding='utf8').splitlines())}
for r in rows:
 v.validate(r)
 assert not r['denetim']['gecti'] and not r['denetim']['insan_onayi'] and r['denetim']['dil_tutarli'] is None
 assert all(op['katman']!='mobilya' for op in r['islemler'])
 assert 'claude_cross_review_pending' in r['denetim']['uyarilar']
 assert not any(w in r['denetim']['uyarilar'] for w in ['human_review_pending','language_review_pending'])
 assert file_hashes[r['kaynak']['dosya']]==r['kaynak']['sha256']
 raw=originals[r['id']]
 assert [{'type':o['tur'],'katman':o['katman'],**o['arguments']} for o in r['islemler']]==raw['assistant']['actions']
assert len({r['denetim']['grup'] for r in rows})==1
assert len({r['bolum'] for r in rows})==1
sys.path.insert(0,str(Path('tools/ev-sohbet').resolve()))
from uslup_denetim import inspect
style=inspect([{'id':r['id'],'language':r['language'],'dialogue':[{'role':'user','content':r['user']},{'role':'assistant','content':r['assistant']['reply']}]} for r in originals.values()])
assert style['passed'],'Existing forbidden-term, language-mix and length heuristics must pass'
spec=importlib.util.spec_from_file_location('converter','tools/egitim-donustur/donustur.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
# Unit-only approval fixtures. Never persist these synthetic decisions or exports.
sample=copy.deepcopy(rows[0]);sample['denetim']['uyarilar']=['claude_cross_review_pending']
decision={'karar':'uygun','denetci':'Claude','zaman':'2026-10-21T00:00:00Z','row_sha256':m.approval_digest(sample)}
accepted=m.qualify(copy.deepcopy(sample),{sample['id']:decision})
assert accepted['denetim']['gecti'] and not accepted['denetim']['insan_onayi'];v.validate(accepted)
self_review={**decision,'denetci':'Codex'}
assert not m.qualify(copy.deepcopy(sample),{sample['id']:self_review})['denetim']['gecti']
changed=copy.deepcopy(accepted);changed['mesajlar'][0]['metin']+=' changed'
assert not m.qualify(changed,{sample['id']:decision})['denetim']['gecti'],'Target edit must revoke cross-review'
rejected={**decision,'karar':'düzeltilmeli'}
assert not m.qualify(copy.deepcopy(sample),{sample['id']:rejected})['denetim']['gecti']
print('PASS 1800 unapproved AURA-EGITIM-1 projections, source hashes, one plan cluster and split; no furniture-detail actions')
