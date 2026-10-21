"""Existing nine-language prose heuristics; no native-speaker approval inferred."""
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/ev-sohbet'))
from uslup_denetim import inspect
BASE=ROOT/'knowledge/ai-egitim/veri/hacim-1-istek'
rows=[json.loads(s) for l in ['tr','en','de','fr','nl','da','es','it','ar'] for s in (BASE/(l+'.jsonl')).read_text(encoding='utf8').splitlines()]
records=[{'id':r['id'],'language':r['language'],'dialogue':[{'role':'user','content':r['user']},{'role':'assistant','content':r['assistant']['reply']}]} for r in rows]
result=inspect(records)
result['repeated_assistant_sentence_families']=len(result.pop('repeated_assistant_sentences'))
result['repetition_policy']='Template and short acknowledgment repetition is disclosed, not counted as independent intent coverage.'
(BASE/'uslup-denetimi.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
assert result['passed']
print(json.dumps({k:result[k] for k in ['conversations','messages','forbidden','language_mix_heuristic','over_60_words','native_review']}))
