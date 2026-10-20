"""Catalogue integrity and negative checks; no training or external access."""
import copy
import importlib.util
import json
from pathlib import Path
import hashlib

spec=importlib.util.spec_from_file_location('catalogue','tools/toparlama/katalog.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
contents=module.blobs()
doc=json.loads(Path('knowledge/ai-egitim/KATALOG.json').read_text(encoding='utf-8'))

def verify(value):
    ids=[r['id'] for r in value['datasets']]
    assert len(ids)==len(set(ids))
    assigned=set()
    for row in value['datasets']:
        assert row['status'] in ['egitim-adayi','inceleme-bekliyor','superseded','yalnizca-arastirma']
        for f in row['files']:
            assert f['path'] not in assigned
            assigned.add(f['path'])
            assert hashlib.sha256(contents[f['path']]).hexdigest()==f['sha256']
        if row['files']:
            assert hashlib.sha256(module.canonical(row['files'])).hexdigest()==row['sha256']
        count=0
        for f in row['primary_files']:
            text=contents[f].decode('utf-8-sig')
            if f.endswith('.jsonl'):count+=sum(bool(line.strip()) for line in text.splitlines())
            else:
                obj=json.loads(text);count+=len(obj) if isinstance(obj,list) else 1
        assert row['record_count']==(count if row['primary_files'] else None)
    assert assigned==set(contents)
    assert not value['coverage']['unassigned']

verify(doc)
for field in ['sha256','record_count']:
    mutated=copy.deepcopy(doc)
    if field=='sha256':mutated['datasets'][0]['files'][0]['sha256']='0'*64
    else:mutated['datasets'][0]['record_count']+=1
    try:verify(mutated)
    except AssertionError:pass
    else:raise AssertionError('Mutation was not detected: '+field)
counts={r['id']:r['record_count'] for r in doc['datasets']}
assert [counts['ev-sohbet-'+x] for x in ['02','uk-ie','dk','es','it']]==[20,8,4,4,4]
assert counts['yerlesim-veri-procthor'] is None
assert next(r for r in doc['datasets'] if r['id']=='tests-ai-eval')['status']=='yalnizca-arastirma'
print(f"PASS {len(doc['datasets'])} groups; {len(contents)} Git-blob hashes; counts, completeness, tamper/count mutations, frozen-exam exclusion")
