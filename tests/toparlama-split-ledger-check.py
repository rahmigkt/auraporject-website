"""New countries/languages may not reshuffle frozen source partitions."""
from pathlib import Path
import copy,importlib.util
spec=importlib.util.spec_from_file_location('convert','tools/egitim-donustur/donustur.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def row(id,plan):return {'id':id,'kaynak':{'gruplar':['row:'+id,'plan:'+plan]},'denetim':{'grup':''},'bolum':'train'}
rs=[row('a','source-a'),row('b','source-b')];ledger={};m.assign(rs,ledger);before={r['id']:(r['bolum'],r['denetim']['grup']) for r in rs}
rs+=[row('a-new-language','source-a'),row('new-country','source-c')];m.assign(rs,ledger)
assert all((r['bolum'],r['denetim']['grup'])==before[r['id']] for r in rs[:2])
assert rs[0]['bolum']==rs[2]['bolum'] and rs[0]['denetim']['grup']==rs[2]['denetim']['grup']
conflict={'plan:a':{'bolum':'train','grup':'a'},'plan:b':{'bolum':'test','grup':'b'}}
r=row('bridge','a');r['kaynak']['gruplar'].append('plan:b')
try:m.assign([r],conflict)
except ValueError as e:assert 'bridge' in str(e).lower()
else:raise AssertionError('Frozen train/test source bridge accepted')
print('PASS immutable prior splits under new language/country; shared-source clustering; train/test bridge rejected')
