from pathlib import Path
import cadquery as cq,json,numpy as np
from OCP.gp import gp_Trsf
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve();out=root/'outputs/hardware-cad-assembly';data=json.loads((root/'outputs/cad-fcl-pilot/input.json').read_text(encoding='utf-8'));baseline=json.loads((root/'outputs/cad-fcl-pilot/run/report.json').read_text(encoding='utf-8'));preview=json.loads((out/'preview.local.json').read_text(encoding='utf-8'));ss=cq.importers.importStep(str(root/'outputs/cad-fcl-pilot/run/wardrobe-stock.step')).solids().vals();env={x['id']:x for x in data['source_envelopes']}
def b(s):
 a=s.BoundingBox();return np.array([a.xmin,a.ymin,a.zmin,a.xmax,a.ymax,a.zmax])
stock={}
for p in baseline['parts']:
 e=env[p['id']];target=np.array(e['min']+e['max']);c=[s for s in ss if np.max(np.abs(b(s)-target))<.02 and abs(s.Volume()-p['cad_volume_mm3'])<.05];assert len(c)==1,p['id'];stock[p['id']]=c[0]
native={'9221544':cq.importers.importStep(str(root/'outputs/hardware-cad-bulk/9221544.stp')).solids().vals(),'9071205':cq.importers.importStep(str(out/'9071205.stp')).solids().vals(),'9071575':cq.importers.importStep(str(out/'9071575.stp')).solids().vals()}
checks=[('b3c1-idrawer1-runnerL-fixed','b3c1-spacerL'),('b3c1-idrawer1-runnerL-inner','b3c1-idrawer1-box-sideL'),('b3c1-idrawer1-runnerR-fixed','b3c1-spacerR'),('b1c1-door1-hinge1-sensys','b1c1-door1'),('b1c1-door1-hinge1-sensys','m1-side-L'),('b1c1-door1-hinge1-plate','m1-side-L')];rows=[]
for ident,wood in checks:
 q=next(x for x in preview['instances'] if x['id']==ident);sku,index=q['mesh'].split('-');t=gp_Trsf();t.SetValues(*np.array(q['matrix'])[:3].reshape(-1).tolist());s=native[sku][int(index)].moved(cq.Location(t));expected=preview['meshes'][q['mesh']]['positions'];expected=np.array(expected).reshape(-1,3);expected=expected@np.array(q['matrix'])[:3,:3].T+np.array(q['matrix'])[:3,3];actual=b(s);print('DATUM',ident,actual.tolist(),expected.min(0).tolist()+expected.max(0).tolist(),flush=True);assert np.max(np.abs(actual-np.concatenate((expected.min(0),expected.max(0)))))<.2,'Native solid identity/transform mismatch';inter=s.intersect(stock[wood]);vol=sum(abs(x.Volume()) for x in inter.Solids());rows.append({'hardware':ident,'stock':wood,'intersection_mm3':vol,'cad_world_bbox':b(s).tolist(),'stock_world_bbox':b(stock[wood]).tolist(),'scope':'One nominal trial pose versus unchanged original machining;not a qualified installation or motion defect'});print(ident,wood,vol,flush=True)
(out/'native-intersections.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
