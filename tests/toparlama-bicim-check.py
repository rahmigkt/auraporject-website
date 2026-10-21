"""Validate quarantine, strict review gate and source-level split isolation."""
import copy
import importlib.util
import json
from pathlib import Path
from jsonschema import Draft202012Validator, ValidationError

spec=importlib.util.spec_from_file_location('convert','tools/egitim-donustur/donustur.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base=Path('knowledge/ai-egitim/veri/birlesik')
rows=[json.loads(line) for line in (base/'adaylar.jsonl').read_text(encoding='utf8').splitlines()]
report=json.loads((base/'sayim-raporu.json').read_text(encoding='utf8'))
validator=Draft202012Validator(json.loads(Path('knowledge/ai-egitim/AURA-EGITIM-1.schema.json').read_text(encoding='utf8')))
assert len(rows)==report['candidate_rows']==2590
assert len({r['id'] for r in rows})==len(rows)
for row in rows:
    validator.validate(row)
    assert not row['denetim']['gecti']
    assert row['kaynak']['veri_seti']!='tests-ai-eval'
    for op in row['islemler']:
        assert op['katman']=='yerlesim' and op['tur']=='yerlestir'
        assert not any(k in op for k in ['xy','pos_xy_mm','placements','position_xyz_mm'])
        for item in op['esyalar']:
            assert set(item)<={'id','tur','en','derinlik','yukseklik'}
assert not m.leakage(rows)
assert report['source_lock']==m.source_lock()
assert len(report['engine_evidence'])==52
assert all(e['report']['gecti'] for e in report['engine_evidence'])
for split in ['train','dev','test']:assert (base/(split+'.jsonl')).read_bytes()==b''

# Same physical source stays together even when IDs/country/language differ.
pair=copy.deepcopy(rows[:2])
for i,r in enumerate(pair):r['kaynak']['gruplar']=['row:'+str(i),'building:shared','plan:'+str(i)]
m.assign(pair);assert pair[0]['bolum']==pair[1]['bolum'];assert not m.leakage(pair)
pair[1]['bolum']='test' if pair[0]['bolum']!='test' else 'train';assert m.leakage(pair)

# A forged pass cannot bypass unresolved warnings or missing language approval.
bad=copy.deepcopy(rows[0]);bad['denetim']['gecti']=True
try:validator.validate(bad)
except ValidationError:pass
else:raise AssertionError('Unreviewed row accepted')

# Unit-only artificial approval: changing the target invalidates it.
sample=copy.deepcopy(rows[0]);sample['denetim']['uyarilar']=['human_review_pending','language_review_pending'];sample['denetim']['yasakli_terim']=0
decision={sample['id']:{'approved':True,'language_ok':True,'reviewer':'unit-fixture-not-human-approval','row_sha256':m.approval_digest(sample)}}
approved=m.qualify(copy.deepcopy(sample),decision);assert approved['denetim']['gecti'];validator.validate(approved)
sample['mesajlar'][0]['metin']+=' changed';assert not m.qualify(sample,decision)['denetim']['gecti']
print('PASS 2590 schema-valid quarantined rows, 52 motor contract reports, empty exports, source/building split mutations, review-target hash binding')
