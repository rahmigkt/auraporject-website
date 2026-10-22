"""Pipeline controls with fabricated predictions; no model call or training."""
import importlib.util,json,pathlib,types,hashlib,contextlib,io,subprocess,sys
root=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('ornekle',root/'tools/egitim/ornekle.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
out=root/'work/e2-unit';out.mkdir(parents=True,exist_ok=True)
tasks=[];pred=[]
for i in range(20):
 state={'plan':{'walls':[],'openings':[],'spaces':[{'id':'unit-room','kind':'living','boundary_xy_mm':[[0,0],[5000,0],[5000,4000],[0,4000]]}],'items':[]}}
 op={'type':'isik','oda':'unit-room','renk_k':3111+i}
 tasks.append({'id':f'unit-{i}','state':state,'language':'tr','user':f'Birim deneme {i} ışığını ayarla.',
 'expected':{'intent':'apply','actions':[op]},'source':{'synthetic':True}})
 for n in range(4):
  good=(i<10 and n in [1,2])
  pred.append({'id':f'unit-{i}','sample':n,'output':json.dumps({'reply':'Işık sıcaklığını değiştirdim.','actions':[op] if good else []},ensure_ascii=False),'status':'ok','truncated':False})
def lines(f,a):f.write_text(''.join(json.dumps(x,ensure_ascii=False)+'\n' for x in a),encoding='utf-8')
lines(out/'tasks.jsonl',tasks);lines(out/'predictions.jsonl',pred)
m.save(out/'PROTOCOL.json',{'model_identity':'fabricated unit test','data_checks':{}})
m.save(out/'RUN-COMPLETE.json',{'journal_sha256':m.sha(out/'predictions.jsonl')})
# Bypass heavyweight file verification only for this isolated test double. The
# production CLI has no bypass switch; the real run must verify every pin.
original=m.verify;m.verify=lambda *args:None
args=types.SimpleNamespace(output=out,protocol_sha=m.sha(out/'PROTOCOL.json'))
with contextlib.redirect_stdout(io.StringIO()):m.score(args)
report=json.loads((out/'SCORES.json').read_text(encoding='utf-8'))
assert report['mechanical_candidates']==10 and report['hard_requests']==10 and report['training_approved']==0
candidates=m.rows(out/'candidates.jsonl');assert all(r['sample']==1 for r in candidates)
assert all(r['review']['status']=='quarantine' and not r['review']['training_approved'] for r in candidates)
assert all(r['producer']=='Qwen3.5-0.8B-untrained-CPU' for r in candidates)
assert len(m.rows(out/'scores.jsonl'))==80
try:m.score(types.SimpleNamespace(output=out,protocol_sha='0'*64))
except AssertionError:pass
else:raise AssertionError('Protocol tamper accepted')
(out/'predictions.jsonl').write_text((out/'predictions.jsonl').read_text(encoding='utf-8')+'\n',encoding='utf-8')
try:m.score(args)
except AssertionError:pass
else:raise AssertionError('Journal mutation accepted')
m.verify=original
assert m.SETTINGS['temperature']==0.8 and m.THRESHOLD==4/6
print('PASS E2 fabricated 80-attempt selection:10 candidates/10 hard;stable tie,empty-action rejection,quarantine,actual producer,protocol/journal mutation rejection;no model inference')
