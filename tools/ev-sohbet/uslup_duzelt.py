"""Apply authored text edits; preserve every non-dialogue field byte-semantically."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[2]
ARCHIVE=ROOT/'knowledge/ai-egitim/toparlama-01/archive/uslup-oncesi.json'
EDIT=ROOT/'tools/ev-sohbet/uslup-01-degisiklikler.json'
def digest(value):return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def records():
    for batch in ['02','uk-ie','dk','es','it']:
        yield from sorted((ROOT/'knowledge/ai-egitim/veri'/('ev-sohbet-'+batch)).glob('ev-sohbet-*.json'))
def body(r):return {k:v for k,v in r.items() if k not in ['dialogue','style_revision']}
def run():
    edits=json.loads(EDIT.read_text(encoding='utf8'));paths=list(records());assert len(paths)==40
    if ARCHIVE.exists():old=json.loads(ARCHIVE.read_text(encoding='utf8'))
    else:
        old={}
        for p in paths:
            r=json.loads(p.read_text(encoding='utf8'));old[r['id']]={'path':p.relative_to(ROOT).as_posix(),'dialogue':r['dialogue'],'dialogue_sha256':digest(r['dialogue']),'body_sha256':digest(body(r)),'status':'superseded'}
        ARCHIVE.parent.mkdir(parents=True,exist_ok=True);ARCHIVE.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
    changed=0
    for p in paths:
        r=json.loads(p.read_text(encoding='utf8'));before=old[r['id']];assert digest(body(r))==before['body_sha256'],r['id']+' non-dialogue drift'
        if 'style_revision' not in r:assert digest(r['dialogue'])==before['dialogue_sha256'],r['id']+' unexpected text'
        dialogue=json.loads(json.dumps(before['dialogue']))
        for index,text in edits.get(r['id'],{}).items():dialogue[int(index)]['content']=text
        changed+=dialogue!=before['dialogue'];r['dialogue']=dialogue
        r['style_revision']={'version':'toparlama-4/1','old_dialogue_sha256':before['dialogue_sha256'],'new_dialogue_sha256':digest(dialogue),'body_sha256':before['body_sha256'],'native_review':'pending','authorship':'Codex individually authored editorial corrections; no external model/API call'}
        p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
    print('Reviewed 40 conversations;',changed,'changed; all non-dialogue hashes unchanged')
if __name__=='__main__':run()
