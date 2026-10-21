"""Text-only change invariant and adversarial editorial checks."""
from pathlib import Path
import copy, importlib.util, json, sys, subprocess, tempfile
sys.path.insert(0,str(Path('tools/ev-sohbet').resolve()))
from uslup_duzelt import records,body,digest,ARCHIVE
from uslup_denetim import inspect

old=json.loads(ARCHIVE.read_text(encoding='utf8'));rs=[]
for p in records():
    r=json.loads(p.read_text(encoding='utf8'));rs.append(r);o=old[r['id']]
    assert digest(body(r))==o['body_sha256']
    assert digest(o['dialogue'])==r['style_revision']['old_dialogue_sha256']
    assert digest(r['dialogue'])==r['style_revision']['new_dialogue_sha256']
    assert r['style_revision']['native_review']=='pending'
assert len(rs)==40
report=inspect(rs);assert report['passed'];assert not report['repeated_assistant_sentences']
for lang,phrase in {'tr':'çözücü','en':'source exception','nl':'bronafwijking','fr':'plan de référence','de':'Quellenabweichung','da':'kildeafvigelse','es':'solucionador','it':'solutore','ar':'استثناء المصدر'}.items():
    row={'id':'unit-'+lang,'language':lang,'dialogue':[{'role':'assistant','content':phrase}]}
    assert inspect([row])['forbidden'],lang
long={'id':'long','language':'en','dialogue':[{'role':'assistant','content':' '.join(['word']*61)}]}
assert inspect([long])['over_60_words']
mix={'id':'mix','language':'en','dialogue':[{'role':'assistant','content':'Votre projet avec vous et nous.'}]}
assert inspect([mix])['language_mix_heuristic']
repeat=copy.deepcopy(rs[0]);repeat['dialogue'][3]['content']=repeat['dialogue'][1]['content']
assert inspect([repeat])['repeated_assistant_sentences']
# --compare-current still rejects any changed recorded result; it is not a skip.
tampered=copy.deepcopy(rs[0]);tampered['layout_requests'][0]['attempts'][0]['result']={'tampered':True}
tempbase=Path('work/tests').resolve();tempbase.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory(prefix='aura-replay-negative-',dir=tempbase) as directory:
    assert Path(directory).resolve().is_relative_to(tempbase)
    (Path(directory)/(tampered['id']+'.json')).write_text(json.dumps(tampered),encoding='utf8')
    result=subprocess.run(['node','tools/ev-sohbet/verify02.mjs',directory,'--compare-current'],capture_output=True,text=True,encoding='utf8',timeout=60)
    assert result.returncode!=0 and 'solver replay mismatch' in result.stderr
print('PASS 40 non-dialogue invariants and old/new hashes; 640 messages; 9-language forbidden, mixed-language, repetition and length mutations')
