from pathlib import Path
import json,hashlib
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
 assert file_hashes[r['kaynak']['dosya']]==r['kaynak']['sha256']
 raw=originals[r['id']]
 assert [{'type':o['tur'],'katman':o['katman'],**o['arguments']} for o in r['islemler']]==raw['assistant']['actions']
assert len({r['denetim']['grup'] for r in rows})==1
assert len({r['bolum'] for r in rows})==1
sys.path.insert(0,str(Path('tools/ev-sohbet').resolve()))
from uslup_denetim import inspect
style=inspect([{'id':r['id'],'language':r['language'],'dialogue':[{'role':'user','content':r['user']},{'role':'assistant','content':r['assistant']['reply']}]} for r in originals.values()])
assert style['passed'],'Existing forbidden-term, language-mix and length heuristics must pass'
print('PASS 1800 unapproved AURA-EGITIM-1 projections, source hashes, one plan cluster and split; no furniture-detail actions')
