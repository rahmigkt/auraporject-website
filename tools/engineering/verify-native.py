import argparse,json,math,sys,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--research-root',type=Path,required=True);a=p.parse_args();r=a.research_root.resolve()
sys.path[:0]=[str(r/'solver-deps'),str(r/'kaynaklar/pynite-current'),str(r/'kaynaklar/eurocodepy/src')]
from Pynite import FEModel3D
from eurocodepy.ec5.materials import SolidTimber,ServiceClass,LoadDuration
from eurocodepy.utils import RectangularCrossSection
from eurocodepy.ec5.uls.cross_section import TimberSectionInput,TimberForces,eurocode5_section_check

# Independent textbook cantilever check: units N/mm/MPa, no gravity load.
def solve(h,b,E,P):
 m=FEModel3D();m.add_node('fixed',0,0,0);m.add_node('end',0,h,0)
 m.add_material('mat',E,E/2.6,.3,0);I=b**4/12
 m.add_section('section',b*b,I,I,.1406*b**4)
 m.add_member('leg','fixed','end','mat','section')
 m.def_support('fixed',True,True,True,True,True,True)
 m.add_node_load('end','FX',P);m.analyze_linear()
 return m.nodes['end'].DX['Combo 1'],m.nodes['fixed'].RxnFX['Combo 1']
delta,reaction=solve(300,40,11000,100)
expected=100*300**3/(3*11000*(40**4/12))
assert math.isclose(delta,expected,rel_tol=1e-8)
assert math.isclose(reaction,-100,rel_tol=1e-8)

# Re-evaluate generated real model decisions directly with upstream EC5 functions,
# not the generated lookup. Numerical screen is only a sufficient condition.
cases=json.loads(Path('work/seating-real-model-screen.json').read_text())['cases']
checks=0;scenario_lateral=100+1000*math.sin(math.radians(20))
for case in cases:
 s=case['screen']
 if s['status']!='scenario_only':continue
 for member in s['members']:
  radius=member['min_radius_mm'];h=member['height_mm'];b=radius*(2 if member['shape']=='square' else math.sqrt(2))/1000
  for grade in member['eligible']:
   t=SolidTimber(grade,edition='2004');sec=RectangularCrossSection(b,b)
   inp=TimberSectionInput(sec,t,ServiceClass.SC1,LoadDuration.MediumDuration,l_0y=2*h,l_0z=2*h,l_0m=2*h)
   res=eurocode5_section_check(inp,TimberForces(n_ed=-1,my_ed=scenario_lateral*h/1e6,vy_ed=scenario_lateral/1000))
   assert res.passed,(case,member,grade,res.utilization)
   checks+=1
out={'pynite_repo':'https://github.com/JWock82/Pynite','pynite_sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=r/'kaynaklar/pynite-current',text=True).strip(),
 'cantilever':{'computed_mm':delta,'textbook_mm':expected,'reaction_N':reaction,'status':'PASS'},'native_accepted_member_grade_checks':checks,'curated_models':len(cases),'product_certified':False,
 'limitations':['minimum-section prism screening','ideal rigid upper joint','scenario loads not furniture standard test','supplier grade not verified','full product/joints/fatigue/impact not assessed']}
Path('work/native-screen-verification.json').write_text(json.dumps(out,indent=2))
print('PASS PyNite textbook cantilever displacement/reaction; native EC5 rechecks',checks,'on',len(cases),'real compiled curated models')
