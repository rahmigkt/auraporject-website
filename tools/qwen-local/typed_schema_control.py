"""Stronger dev-only control: typed production-style contract, no concrete example value.
Exploratory protocol: introduced after the first explicit-example control copied its example.
"""
import json
import hashlib
from pathlib import Path

system=('You edit an existing AURA Forma design. Units are millimetres. Return only a JSON object with the actions array. '
        'Each action object has exactly three required fields: type (string, either set or delta), '
        'key (string, one of vocabulary.params), value (number). '
        'For set, value is the requested new absolute measurement. For delta, value is the signed change, not the final total. '
        'Use type/key/value fields, never action/params aliases. Return only requested operations. No extra fields or explanations.')
source=Path('outputs/qwen-local/studio-v1/dev-prompts.jsonl')
rows=[json.loads(line) for line in source.read_text(encoding='utf-8').splitlines()]
for row in rows:
    row['messages'][0]['content']=system
out=Path('outputs/qwen-local/studio-typed-control.jsonl')
out.write_bytes((''.join(json.dumps(r,ensure_ascii=False)+'\n' for r in rows)).encode())
out.with_suffix('.protocol.json').write_text(json.dumps({'status':'exploratory_dev_control',
    'created_after_example_control_error_review':True,'contains_concrete_example_value':False,
    'test_evaluated':False,'training_changed':False,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()},indent=2)+'\n',encoding='utf-8')
print('Typed schema dev control prepared; no numeric example and no training changes.')
