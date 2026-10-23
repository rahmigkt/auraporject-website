"""Offline, opt-in CadQuery/FCL second opinion. Never issues production approval.
Use --input produced by export-input.mjs and the frozen AURA mesh ZIP as --baseline.
Manufacturing stock represented as intended smooth rounded solids, not relabelled STL.
"""
import argparse,hashlib,json,math,time,zipfile,struct,platform,importlib.metadata,itertools
from pathlib import Path
import numpy as np
import cadquery as cq
import fcl

def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def rotation(v):
 x,y,z=v;cx,sx,cy,sy,cz,sz=math.cos(x),math.sin(x),math.cos(y),math.sin(y),math.cos(z),math.sin(z)
 return np.array([[cy*cz,-cy*sz,sy],[cx*sz+sx*sy*cz,cx*cz-sx*sy*sz,-sx*cy],[sx*sz-cx*sy*cz,sx*cz+cx*sy*sz,cx*cy]])
def mesh_stl(data):
 if len(data)<84:raise ValueError('Incomplete STL')
 n=struct.unpack_from('<I',data,80)[0]
 if len(data)!=84+50*n:raise ValueError('STL size mismatch')
 rows=np.ndarray((n,),dtype=np.dtype([('normal','<f4',(3,)),('points','<f4',(3,3)),('attr','<u2')]),buffer=data,offset=84)
 vertices=np.array(rows['points'].reshape(-1,3),dtype=np.float64)
 if not np.isfinite(vertices).all():raise ValueError('Nonfinite STL')
 faces=np.arange(n*3,dtype=np.int32).reshape(-1,3)
 v=np.abs(np.einsum('ij,ij->i',vertices[0::3],np.cross(vertices[1::3],vertices[2::3])).sum()/6)
 return vertices,faces,float(v)
def fcl_mesh(vertices,faces):
 m=fcl.BVHModel();m.beginModel(len(faces),len(vertices));m.addSubModel(vertices,faces);m.endModel();return m
def stock(q):
 g=q['geom'];allowed={'fn','w','h','d','r'}
 if g['fn'] not in ('box','cushion') or set(g)-allowed:raise ValueError('Unsupported stock/crown/outline:'+q['id'])
 w,h,d=[g[k] for k in ('w','h','d')]
 if not all(math.isfinite(v) and v>0 for v in (w,h,d)):raise ValueError('Invalid stock')
 r=min(g.get('r',1.5 if g['fn']=='box' else 20),w/2-.5,h/2-.5,d/2-.5)
 shape=cq.Workplane('XY').box(w,h,d)
 if r>0:shape=shape.edges().fillet(r)
 return shape.val()
def cutter(p,o):
 if o.get('stock_bounds',{}).get('status')!='nominal_containment_only':raise ValueError('Unverified operation')
 dims=p['blank']['finished_xyz_mm'];a=o['entry_axis'];sg=o['entry_sign'];depth=o['depth_mm'];at=np.array(o['center_finished_local_mm'])-np.array(dims)/2
 if a not in (0,1,2) or sg not in (-1,1) or not math.isfinite(depth) or depth<=0:raise ValueError('Invalid operation datum')
 direction=np.zeros(3);direction[a]=-sg;eps=1e-5;start=at-direction*eps;length=depth+eps*(2 if o.get('through') else 1)
 if o['kind'] in ('hinge_spacer_relief','back_groove_candidate','drawer_bottom_groove'):
  la=o['length_axis'];wa=next(k for k in range(3) if k not in (a,la));size=[0.,0.,0.];size[a]=length;size[la]=o['length_mm'];size[wa]=o['width_mm'];center=start+direction*length/2
  return cq.Solid.makeBox(*size,cq.Vector(*(center-np.array(size)/2)))
 radius=o['diameter_mm']/2
 if radius<=0 or not math.isfinite(radius):raise ValueError('Invalid bore')
 if o['kind']=='assembly_countersink':return cq.Solid.makeCone(radius,o['pilot_diameter_mm']/2,length,cq.Vector(*start),cq.Vector(*direction))
 return cq.Solid.makeCylinder(radius,length,cq.Vector(*start),cq.Vector(*direction))
def located(shape,q):
 for k in (2,1,0):
  if q.get('rot',[0,0,0])[k]:
   axis=[0,0,0];axis[k]=1;shape=shape.rotate((0,0,0),tuple(axis),math.degrees(q['rot'][k]))
 return shape.translate(tuple(q['pos']))
def bounds(s):
 b=s.BoundingBox();return {'min':[b.xmin,b.ymin,b.zmin],'max':[b.xmax,b.ymax,b.zmax]}
def validate_inventory(parts,entries):
 ids=[p['id'] for p in parts]
 if len(set(ids))!=len(ids) or set(ids)!={e['id'] for e in entries}:raise ValueError('Missing/duplicate source component')
def validate_module_mates(records):
 groups={}
 for p in records.values():
  for o in p['operations']:
   if o['kind']!='module_joining_bore':continue
   if o['diameter_mm']!=5 or not o.get('through') or o['entry_axis']!=0:raise ValueError('89316 source bore mismatch')
   if any(abs(v)>1e-8 for v in p['placement']['rotation_rad']):raise ValueError('Unsupported module bore transform')
   world=np.array(o['center_finished_local_mm'])-np.array(p['blank']['finished_xyz_mm'])/2+np.array(p['placement']['position_mm'])
   groups.setdefault(o['module_connection_id'],[]).append((p,o,world))
 for g in groups.values():
  if len(g)!=2 or {e[1]['entry_sign'] for e in g}!={-1,1}:raise ValueError('Incomplete module bore pair')
  if np.max(np.abs(g[0][2][1:]-g[1][2][1:]))>.003:raise ValueError('Module bore axes mismatch')
  if not 28<=abs(g[0][2][0]-g[1][2][0])<=38:raise ValueError('Module clamp outside source28-38mm')
 return len(groups)
def analytic():
 s=cq.Workplane('XY').box(20,30,40).val();b=cq.Solid.makeCylinder(2,10,cq.Vector(0,0,20),cq.Vector(0,0,-1));g=cq.Workplane('XY').box(4,5,30).val()
 values=[('box',s.Volume(),24000),('blind_bore_removed',s.Volume()-s.cut(b).Volume(),40*math.pi),('groove_removed',s.Volume()-s.cut(g).Volume(),600)]
 for _,actual,expected in values:assert abs(actual-expected)<1e-5
 return [{'case':n,'actual':a,'expected':e,'pass':True} for n,a,e in values]
def ccd_boxes(start=(-2.,0,0),end=(2.,0,0)):
 request=fcl.ContinuousCollisionRequest(num_max_iterations=100,toc_err=1e-6,ccd_motion_type=fcl.CCDMotionType.CCDM_TRANS,gjk_solver_type=fcl.GJKSolverType.GST_INDEP,ccd_solver_type=fcl.CCDSolverType.CCDC_CONSERVATIVE_ADVANCEMENT)
 a=fcl.CollisionObject(fcl.Box(1,1,1),fcl.Transform(np.array(start)));b=fcl.CollisionObject(fcl.Box(1,1,1),fcl.Transform(np.zeros(3)));result=fcl.ContinuousCollisionResult()
 value=fcl.continuousCollide(a,fcl.Transform(np.array(end)),b,fcl.Transform(np.zeros(3)),request,result)
 if not math.isfinite(value) or value<0:raise ValueError('Unsupported/error CCD;no collision-free claim')
 if not result.is_collide or abs(result.time_of_contact-.25)>1e-4:raise ValueError('CCD tunneling regression failed')
 return {'case':'between_sample_box_collision','is_collide':bool(result.is_collide),'first_contact':float(result.time_of_contact),'expected_contact':.25,'scope':'Synthetic translation;not actual manufacturer motion','solver':'conservative_advancement_GST_INDEP','pass':True}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--input',required=True);ap.add_argument('--baseline',required=True);ap.add_argument('--out',required=True);args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True);started=time.perf_counter()
 x=json.loads(Path(args.input).read_text(encoding='utf-8'));parts=x['compiled']['parts'];records={r['id']:r for r in x['manufacturing']['parts']};ids={q['id'] for q in parts}
 assert len(parts)==len(ids)==92
 base={};manifest=None
 with zipfile.ZipFile(args.baseline) as z:
  assert z.testzip() is None
  assert json.loads(z.read('design.json'))==x['design'],'Different frozen wardrobe design'
  manifest=json.loads(z.read('assembly.json'));validate_inventory(parts,manifest['assembly']);validate_module_mates(records)
  for p in manifest['assembly']:base[p['id']]={'entry':p,'mesh':mesh_stl(z.read(p['file']))}
 source_shapes={q['id']:q for q in parts};envelopes={q['id']:q for q in x['source_envelopes']}
 for id,b in base.items():
  q=source_shapes[id];e=b['entry'];assert e['position_mm']==q['pos'] and e['rotation_rad']==q.get('rot',[0,0,0])
  assert all(abs(e['source_world_envelope'][k][j]-envelopes[id][k][j])<.003 for k in ('min','max') for j in range(3))
 report={'schema':'aura.cad-fcl-pilot/1','input_sha256':x['input_sha256'],'source_input_file_sha256':digest(args.input),'baseline_zip_sha256':digest(args.baseline),'packages':{n:importlib.metadata.version(n) for n in ('cadquery','cadquery-ocp','python-fcl','numpy')},'python':platform.python_version(),'source_parts':len(parts),'production_approved':False,'analytic':analytic(),'ccd':ccd_boxes(),'parts':[],'excluded':[],'failed':[],'mesh_contacts':[],'brep_intersections':[],'geometry_basis':'CadQuery intended smooth rounded stock plus source operations;AURA frozen tessellated stock is an independent approximation. Envelope/volume differences reported,not silently treated as identical surfaces.','real_hardware_motion_verified':False}
 (out/'preflight.json').write_text(json.dumps(report,indent=2),encoding='utf-8');solids={};objects={};aabbs={};ops=0
 for q in parts:
  r=records[q['id']]
  if r['category']!='wood_component' or not r.get('blank') or r['blank'].get('requires_outline'):
   report['excluded'].append({'id':q['id'],'reason':'Purchased/specialist hardware proxy or unsupported stock;not native manufacturer CAD'});continue
  try:
   s=stock(q);before=s.Volume()
   for o in r['operations']:s=s.cut(cutter(r,o));ops+=1
   if not s.isValid() or len(s.Solids())!=1 or s.Volume()<=0:raise ValueError('Invalid/disconnected stock after source operations')
   world=located(s,q);bb=bounds(world);v,faces,meshvol=base[q['id']]['mesh'];R=rotation(q.get('rot',[0,0,0]));worldv=v@R.T+np.array(q['pos'])
   assert max(abs(worldv.min(axis=0)[j]-envelopes[q['id']]['min'][j]) for j in range(3))<.003
   assert max(abs(worldv.max(axis=0)[j]-envelopes[q['id']]['max'][j]) for j in range(3))<.003
   fclshape=fcl_mesh(worldv,faces);objects[q['id']]=fcl.CollisionObject(fclshape);aabbs[q['id']]={'min':worldv.min(axis=0),'max':worldv.max(axis=0)};solids[q['id']]=world
   report['parts'].append({'id':q['id'],'operations':len(r['operations']),'cad_valid':True,'cad_volume_mm3':world.Volume(),'aura_mesh_volume_mm3':meshvol,'delta_volume_mm3':world.Volume()-meshvol,'relative_delta_volume':(world.Volume()-meshvol)/world.Volume(),'cad_envelope':bb,'envelope_max_delta_mm':max(abs(bb[k][j]-envelopes[q['id']][k][j]) for k in ('min','max') for j in range(3))})
   print('CAD_OK '+q['id'],flush=True)
  except Exception as error:report['failed'].append({'id':q['id'],'error':str(error)});print('CAD_FAIL '+q['id']+':'+str(error),flush=True)
  (out/'progress.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 report['operations_attempted']=ops;report['stock_parts']=len(solids);checked=0
 # Independent CAD face extraction on the same rigid-shift counterexample.
 shifts=[]
 for r in x['mechanism']['runner_faces'][:2]:
  if r.get('box_side') not in solids or r.get('support') not in solids:continue
  a,b=bounds(solids[r['box_side']]),bounds(solids[r['support']]);left=r['runner'].endswith('L')
  gap=a['min'][0]-b['max'][0] if left else b['min'][0]-a['max'][0]
  shifts.append({'runner':r['runner'],'cad_gap_mm':gap,'after_rigid_shift_1mm':gap+(1 if left else -1),'aura_gap_mm':r['actual_side_clearance_mm']})
 assert len(shifts)==2 and all(abs(s['cad_gap_mm']-12.7)<1e-5 for s in shifts)
 report['datum_crosscheck']=shifts
 negative=[]
 try:validate_inventory(parts[1:],manifest['assembly'])
 except ValueError:negative.append('missing_component_rejected')
 changed=json.loads(json.dumps(records));target=next(o for p in changed.values() for o in p['operations'] if o['kind']=='module_joining_bore');target['diameter_mm']=6
 try:validate_module_mates(changed)
 except ValueError:negative.append('changed_source_module_bore_rejected')
 assert len(negative)==2;report['negative_checks']=negative
 for a,b in itertools.combinations(solids,2):
  ab,bb=aabbs[a],aabbs[b]
  source_overlap=all(min(ab['max'][k],bb['max'][k])-max(ab['min'][k],bb['min'][k])>0 for k in range(3))
  ca,cb=bounds(solids[a]),bounds(solids[b]);cad_overlap=all(min(ca['max'][k],cb['max'][k])-max(ca['min'][k],cb['min'][k])>0 for k in range(3))
  if not (source_overlap or cad_overlap):continue
  checked+=1;result=fcl.CollisionResult();n=fcl.collide(objects[a],objects[b],fcl.CollisionRequest(num_max_contacts=2,enable_contact=True),result) if source_overlap else 0
  if n:report['mesh_contacts'].append({'a':a,'b':b,'contact_count':int(n),'scope':'Triangle contact may be touching;not positive-volume proof'})
  inter=solids[a].intersect(solids[b]) if cad_overlap else None;volume=inter.Volume() if inter is not None and len(inter.Solids()) else 0
  if volume>.05:report['brep_intersections'].append({'a':a,'b':b,'volume_mm3':volume})
 report['broadphase_overlapping_pairs']=checked;report['elapsed_seconds']=time.perf_counter()-started
 report['status']='incomplete' if report['failed'] else 'limited_stock_pilot_complete_not_product_approval';report['step_file']=str(out/'wardrobe-stock.step')
 if solids:
  assembly=cq.Assembly(name='AURA-wardrobe-stock-pilot')
  for id,s in solids.items():assembly.add(s,name=id)
  assembly.export(report['step_file'],'STEP')
  back=cq.importers.importStep(report['step_file']).val();v=sum(s.Volume() for s in solids.values())
  total=sum(s.Volume() for s in back.Solids())
  report['step_roundtrip']={'solids':len(back.Solids()),'expected_solids':len(solids),'volume_delta_mm3':total-v,'compound_volume_delta_mm3':back.Volume()-v,'scope':'Solid count and sum of individual solid volumes;compound aggregate integration differs and is not used as this additive inventory measure. Not PMI/native feature tree preservation'}
  (out/'before-roundtrip-gate.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
  assert len(back.Solids())==len(solids) and abs(total-v)<max(.01,v*1e-9)
 report['limits']=['52hardware/special parts excluded from CadQuery native stock. Source AURA meshes reused after CRC/design/ID/pose/envelope matching;no previous manufacturing approval imported.','Smooth BRep and tessellated AURA surfaces differ;part envelope/volume comparisons are evidence,not native-model fidelity certification.','CCD positive fixture only uses known synthetic translation;actual hinge linkage and selected500mm Hettich stop remain unverified.','Tolerances,wall fixing,load,fastener/pilot/torque and physical assembly remain unqualified.']
 (out/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({k:report[k] for k in ('status','source_parts','stock_parts','operations_attempted','elapsed_seconds')}),flush=True)
 if report['failed']:raise SystemExit(2)
if __name__=='__main__':main()
