"""Native independent solver check of isolated REAL generated member scenarios.
Not a whole assembled frame solution or certification.
"""
import argparse,json,sys,math
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--research-root',type=Path,required=True);a=p.parse_args()
r=a.research_root.resolve();sys.path[:0]=[str(r/'solver-deps'),str(r/'kaynaklar/pynite-current')]
from Pynite import FEModel3D
data=json.loads(Path('work/construction-model-audit.json').read_text())
rows=[]
for family in ['seating','table']:
 cases=[c for c in data['cases'] if c['family']==family and c['bending_scenarios']]
 for c in cases[::max(1,len(cases)//12)][:12]:
  b=c['bending_scenarios'][0];L=b['span_mm'];w=b['b_mm'];h=b['h_mm'];E=b['E_MPa'];P=b['point_load_N'];I=w*h**3/12
  m=FEModel3D();m.add_node('A',0,0,0);m.add_node('B',L,0,0);m.add_material('assumed',E,E/2.6,.3,0)
  m.add_section('section',w*h,h*w**3/12,I,min(w,h)**3*max(w,h)/3)
  m.add_member('member','A','B','assumed','section')
  m.def_support('A',True,True,True,True,False,False);m.def_support('B',False,True,True,False,False,False)
  m.add_member_pt_load('member','Fy',-P,L/2);m.analyze_linear()
  delta=abs(m.members['member'].deflection('dy',L/2))
  assert math.isclose(delta,b['deflection_mm'],rel_tol=1e-8),(c,b,delta)
  reactions=m.nodes['A'].RxnFY['Combo 1']+m.nodes['B'].RxnFY['Combo 1']
  assert math.isclose(reactions,P,rel_tol=1e-8)
  rows.append({'family':family,'kind':c['kind'],'style':c['style'],'member':b['id'],'deflection_mm':delta,'reaction_sum_N':reactions})
assert len(rows)==24
out={'scope':'24 isolated generated rectangular member checks, not full frame FEA','production_approved':False,'checks':rows}
Path('work/frame-native-check.json').write_text(json.dumps(out,indent=2));print('PASS24 real isolated frame member displacement/reaction checks against native PyNite; no assembly certification')
