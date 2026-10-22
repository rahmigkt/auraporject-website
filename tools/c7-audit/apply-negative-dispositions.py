"""Append source-bound negative decisions; preserve every prior decision value."""
import json
from pathlib import Path

path = Path('knowledge/ai-egitim/inceleme/codex-kararlari.json')
text = path.read_text(encoding='utf8')
before = json.loads(text)
entries = json.loads(Path('work/c7-negative-entries.json').read_text(encoding='utf8'))
assert len(entries) == 17161 and len({key for key, _ in entries}) == 17161
add = []
for key, entry in entries:
    assert entry['karar'] in ['duzelt', 'ret'] and entry['training_approved'] is False and entry['semantik_onay'] is False
    assert entry['row_sha256'] and entry['source_sha256'] and entry['source_code_sha']
    if key in before['kararlar']:
        assert before['kararlar'][key] == entry, 'Existing decision cannot be silently replaced'
    else:
        add.append((key, entry))
if add:
    ending = '\n  }\n}'
    position = text.rfind(ending)
    assert position >= 0 and not text[position+len(ending):].strip()
    new_rows = ''.join(',\n    '+json.dumps(key,ensure_ascii=False)+': '+json.dumps(value,ensure_ascii=False,separators=(',',':')) for key,value in add)
    updated = text[:position]+new_rows+text[position:]
    marker = '  "kararlar": {'
    metadata = {'scope':'All17167 original placement sources dispositioned;984 source-test rows rejected for training;remaining raw coordinate records need correction. No semantic/training approval.',
                'evidence':'knowledge/ai-egitim/inceleme/C7-kaynak-sonuc.json','manual_original_rows':6,'automated_negative_original_rows':17161,'training_approvals':0}
    assert marker in updated and '"c7_source_audit"' not in before
    updated = updated.replace(marker,'  "c7_source_audit": '+json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+',\n'+marker,1)
    after = json.loads(updated)
    assert all(after['kararlar'][key] == value for key,value in before['kararlar'].items())
    assert len(after['kararlar']) == len(before['kararlar'])+len(add)
    path.write_text(updated,encoding='utf8')
print(json.dumps({'new_negative_entries':len(add),'previous_decisions_preserved':len(before['kararlar']),'training_approvals':0}))
