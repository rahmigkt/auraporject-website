"""Intake truthfulness: missing geometry must never become a successful layout."""
from pathlib import Path
import json,collections,sys,copy
sys.path.insert(0,str(Path('tools/ev-sohbet').resolve()))
from uslup_denetim import inspect
out=Path('knowledge/ai-egitim/veri/ev-sohbet-arap')
rs=[json.loads(p.read_text(encoding='utf8')) for p in sorted(out.glob('ev-sohbet-arap-*.json'))]
assert len(rs)==12
assert collections.Counter(r['country'] for r in rs)==dict(AE=3,SA=3,QA=2,KW=2,EG=1,MA=1)
def check(rows):
 for r in rows:
  assert len(r['dialogue'])==16
  assert [t['role'] for t in r['dialogue']]==['user','assistant']*8
  assert r['plan'] is None and r['operations']==[] and r['layout_results']==[]
  assert not r['denetim']['gecti'] and r['source']['geometry_source'] is None
  assert not r['source']['customer_photos_used'] and not r['training_started']
check(rs)
r=inspect(rs);assert r['passed'] and not r['repeated_assistant_sentences']
assert sum(x['requested_floors']==2 for x in rs)==2
assert '٢٤٠' in rs[9]['dialogue'][4]['content'] and '٢٤٠' in rs[9]['dialogue'][5]['content']
for key,value in [('plan',{}),('operations',[{'type':'invent'}])]:
 bad=copy.deepcopy(rs);bad[0][key]=value
 try:check(bad)
 except AssertionError:pass
 else:raise AssertionError('Invented geometry/operation was accepted')
m=json.loads(Path('knowledge/ev-projesi/veri/meclis.json').read_text(encoding='utf8'))
assert not m['supported_by_current_solver'] and all(not x['can_solve'] for x in m['layout_intents'])
assert all(x['usable_seat_depth_mm'] is None for x in m['manufacturer_examples'])
print('PASS 12 Arabic intake drafts/192 messages; correct country allocation; 0 fabricated plans, 2 pending two-storey requests; numeral and fake-layout mutations')
