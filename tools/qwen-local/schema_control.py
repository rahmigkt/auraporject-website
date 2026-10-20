"""Dev-only prompt control after inspecting the original baseline format failures."""
import hashlib
import json
from pathlib import Path

source=Path('outputs/qwen-local/studio-v1/dev-prompts.jsonl')
rows=[json.loads(line) for line in source.read_text(encoding='utf-8').splitlines()]
example=json.dumps({'actions':[{'type':'delta','key':'width','value':100}]},ensure_ascii=False)
extra=' Yanıt şeması tam olarak: '+example+'. Her işlem type/key/value alanlarını taşır; action/params iç içe biçimini kullanma.'
for row in rows:
    row['messages'][0]['content']+=extra
out=Path('outputs/qwen-local/studio-schema-control.jsonl')
out.write_bytes((''.join(json.dumps(row,ensure_ascii=False)+'\n' for row in rows)).encode())
out.with_suffix('.protocol.json').write_text(json.dumps({'status':'exploratory_dev_prompt_control',
    'created_after_original_dev_baseline':True,'test_opened':False,'training_data_changed':False,
    'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'rows':len(rows)},indent=2)+'\n',encoding='utf-8')
print('Prepared 40 dev-only explicit-schema control prompts; frozen corpus unchanged.')
