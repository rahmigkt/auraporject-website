"""Finish comparisons from a verified STEP checkpoint; never rebuild completed392 cuts."""
import json,sys,time,itertools,zipfile
from pathlib import Path
import pilot as p
import cadquery as cq
import fcl,numpy as np
started=time.perf_counter();folder=Path(sys.argv[1]);input_path=Path(sys.argv[2]);zip_path=Path(sys.argv[3])
r=json.loads((folder/'progress.json').read_text(encoding='utf-8'));x=json.loads(input_path.read_text(encoding='utf-8'));assert r['input_sha256']==x['input_sha256'] and r['baseline_zip_sha256']==p.digest(zip_path)
assert not r['failed'] and len(r['parts'])==40
shape=cq.importers.importStep(str(folder/'wardrobe-stock.step')).val();available=list(shape.Solids());solids={};mapping=[]
for part in r['parts']:
 choices=[]
 for i,s in enumerate(available):
  b=p.bounds(s);delta=max(abs(b[k][j]-part['cad_envelope'][k][j]) for k in ('min','max') for j in range(3))
  if delta<.003 and abs(s.Volume()-part['cad_volume_mm3'])<max(.01,s.Volume()*1e-9):choices.append((i,s,delta))
 assert len(choices)==1,'Ambiguous/missing STEP part:'+part['id']
 i,s,delta=choices[0];available.pop(i);solids[part['id']]=s;mapping.append({'id':part['id'],'envelope_delta_mm':delta,'volume_delta_mm3':s.Volume()-part['cad_volume_mm3']})
assert not available
objects={};aabbs={};parts={q['id']:q for q in x['compiled']['parts']}
with zipfile.ZipFile(zip_path) as z:
 assert z.testzip() is None and json.loads(z.read('design.json'))==x['design'];manifest=json.loads(z.read('assembly.json'));p.validate_inventory(list(parts.values()),manifest['assembly'])
 for e in manifest['assembly']:
  if e['id'] not in solids:continue
  q=parts[e['id']];v,faces,_=p.mesh_stl(z.read(e['file']));v=v@p.rotation(q['rot']).T+np.array(q['pos']);objects[e['id']]=fcl.CollisionObject(p.fcl_mesh(v,faces));aabbs[e['id']]={'min':v.min(axis=0),'max':v.max(axis=0)}
r['operations_attempted']=sum(t['operations'] for t in r['parts']);r['stock_parts']=len(solids);r['mesh_contacts']=[];r['brep_intersections']=[];checked=0
for a,b in itertools.combinations(solids,2):
 ab,bb=aabbs[a],aabbs[b]
 source_overlap=all(min(ab['max'][k],bb['max'][k])-max(ab['min'][k],bb['min'][k])>0 for k in range(3))
 ca,cb=p.bounds(solids[a]),p.bounds(solids[b]);cad_overlap=all(min(ca['max'][k],cb['max'][k])-max(ca['min'][k],cb['min'][k])>0 for k in range(3))
 if not (source_overlap or cad_overlap):continue
 checked+=1;result=fcl.CollisionResult();n=fcl.collide(objects[a],objects[b],fcl.CollisionRequest(num_max_contacts=2,enable_contact=True),result) if source_overlap else 0
 if n:r['mesh_contacts'].append({'a':a,'b':b,'contact_count':int(n),'scope':'Triangle contact;not positive-volume proof'})
 inter=solids[a].intersect(solids[b]) if cad_overlap else None;volume=inter.Volume() if inter is not None and len(inter.Solids()) else 0
 if volume>.05:r['brep_intersections'].append({'a':a,'b':b,'volume_mm3':volume})
r['datum_crosscheck']=[]
for f in x['mechanism']['runner_faces'][:2]:
 side,support=solids[f['box_side']],solids[f['support']];a,b=p.bounds(side),p.bounds(support);m=p.bounds(side.translate((1,0,0)));left=f['runner'].endswith('L')
 gap=a['min'][0]-b['max'][0] if left else b['min'][0]-a['max'][0];shift=m['min'][0]-b['max'][0] if left else b['min'][0]-m['max'][0]
 assert abs(gap-12.7)<1e-5 and abs(shift-(13.7 if left else 11.7))<1e-5
 r['datum_crosscheck'].append({'runner':f['runner'],'cad_gap_mm':gap,'translated_CAD_gap_mm':shift,'aura_gap_mm':f['actual_side_clearance_mm']})
records={t['id']:t for t in x['manufacturing']['parts']};assert p.validate_module_mates(records)==4;negative=[]
try:p.validate_inventory(list(parts.values())[1:],manifest['assembly'])
except ValueError:negative.append('missing_component_rejected')
bad=json.loads(json.dumps(records));next(o for t in bad.values() for o in t['operations'] if o['kind']=='module_joining_bore')['diameter_mm']=6
try:p.validate_module_mates(bad)
except ValueError:negative.append('changed_source_module_bore_rejected')
assert len(negative)==2
r.update(status='limited_stock_pilot_complete_not_product_approval',negative_checks=negative,broadphase_overlapping_pairs=checked,step_file=str(folder/'wardrobe-stock.step'),step_roundtrip={'solids':40,'matched_individual_solids':mapping,'sum_solid_volume_delta_mm3':sum(t.Volume() for t in solids.values())-sum(t['cad_volume_mm3'] for t in r['parts']),'scope':'Each solid mapped by unique envelope+volume. No claim of PMI or native feature tree preservation.'},resumed_from_verified_step=True,comparison_elapsed_seconds=time.perf_counter()-started)
r['limits']=['40wood stocks and392operations only;52hardware/specialpart proxies excluded from nativeCAD.','AURA triangular stock and smooth BRep are independently compared;different surfaces,not exact native-model equivalence.','Synthetic CCD uses GST_INDEP;tested defaultGST_LIBCCD returnedfalse in the positive control. Only verified algorithm/shape combinations may be used.','No real hardware kinematics,physicalassembly,FEA,load,wall fixing or manufacturing approval.']
(folder/'report.json').write_text(json.dumps(r,indent=2),encoding='utf-8');print(json.dumps({'parts':40,'ops':r['operations_attempted'],'contacts':len(r['mesh_contacts']),'brep_intersections':len(r['brep_intersections']),'negative':negative,'elapsed':r['comparison_elapsed_seconds']}))
