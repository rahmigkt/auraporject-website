"""blender --background --python cycles.py -- --input DIR --output DIR [--id seating-02]"""
import argparse,json,sys,time,math,struct,hashlib
from pathlib import Path
import bpy
import numpy as np
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
parser=argparse.ArgumentParser();parser.add_argument('--input',required=True);parser.add_argument('--output',required=True);parser.add_argument('--id');parser.add_argument('--width',type=int,default=2400);parser.add_argument('--samples',type=int,default=48);parser.add_argument('--probe',action='store_true');parser.add_argument('--details-only',action='store_true');parser.add_argument('--detail',default='fabric,wood,joint');parser.add_argument('--closeups',action='store_true');parser.add_argument('--detail-width',type=int,default=1200);parser.add_argument('--detail-samples',type=int,default=24)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);root=Path(__file__).resolve().parents[3];output=Path(args.output).resolve();output.mkdir(parents=True,exist_ok=True)
script_sha=hashlib.sha256(Path(__file__).resolve().read_bytes()).hexdigest()
report=[]
fixtures={f['id']:f['design'] for f in json.loads((root/'tests/visual/atmosfer-01/designs.json').read_text(encoding='utf-8'))}
def convert(p):return Vector((p[0],-p[2],p[1]))
def area(name,position,target,power,width,height,color):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='RECTANGLE';data.size=width;data.size_y=height;data.color=color
 obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.location=convert(position);obj.rotation_euler=(convert(target)-obj.location).to_track_quat('-Z','Y').to_euler();return obj
for file in sorted(Path(args.input).resolve().glob('*.glb')):
 if args.id and file.stem not in args.id.split(','):continue
 started=time.monotonic();bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(file))
 with file.open('rb') as stream:
  source_sha=hashlib.file_digest(stream,'sha256').hexdigest();stream.seek(0)
  stream.read(12);json_length,json_type=struct.unpack('<II',stream.read(8));gltf=json.loads(stream.read(json_length))
 gltf_camera=gltf['cameras'][0]['perspective']
 metadata=json.loads(file.with_suffix('.json').read_text());scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=args.samples;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.035
 scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.max_bounces=8;scene.cycles.diffuse_bounces=4
 scene.render.resolution_x=args.width;scene.render.resolution_y=round(args.width*2/3);scene.render.resolution_percentage=100;scene.render.image_settings.file_format='JPEG';scene.render.image_settings.quality=94
 scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0;scene.view_settings.gamma=1
 camera=next(o for o in scene.objects if o.type=='CAMERA');world_matrix=camera.matrix_world.copy();camera.parent=None;camera.matrix_world=world_matrix;scene.camera=camera;camera.data.clip_start=.005;camera.data.lens=55;camera.data.sensor_fit='HORIZONTAL';camera.data.sensor_width=35;camera.data.sensor_height=35*2/3;camera.data.clip_end=100
 assert abs(camera.data.angle_y-gltf_camera['yfov'])<1e-5, 'Cycles camera vertical FOV differs from exported raster camera'
 world=bpy.data.worlds.new('Poly Haven Studio Small 09 CC0');world.use_nodes=True;scene.world=world;nodes=world.node_tree.nodes;tex=nodes.new('ShaderNodeTexEnvironment');tex.image=bpy.data.images.load(str(root/'knowledge/atmosfer/cc0/studio_small_09_1k.hdr'));world.node_tree.links.new(tex.outputs['Color'],nodes['Background'].inputs['Color']);nodes['Background'].inputs['Strength'].default_value=.35
 bounds=metadata['productBounds'];target=[(a+b)/2 for a,b in zip(bounds['min'],bounds['max'])];window=next(l for l in metadata['lights'] if l['type']=='RectAreaLight')
 area('Window softbox',window['position'],target,850,window['width'],window['height'],window['color']);area('Weak reflected fill',[2,1.3,3],target,65,3,3,[1,.92,.82])
 # Only final images: bevel shading smooths real edge radii; no design dimensions change.
 beveled_materials=set()
 for obj in scene.objects:
  if obj.type=='MESH' and not obj.get('roomSurface') and obj.name!='skirting':
   for mat in obj.data.materials:
    if mat and mat.use_nodes and mat.as_pointer() not in beveled_materials:
     beveled_materials.add(mat.as_pointer())
     if obj.get('materialKey') in ['fabric','welt','stitch','mattress','bedding']:continue
     bsdf=next((n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
     if bsdf:
      bevel=mat.node_tree.nodes.new('ShaderNodeBevel');bevel.inputs['Radius'].default_value=.0007;bevel.samples=4
      # Preserve material normal-map input by feeding it into the bevel node.
      links=list(bsdf.inputs['Normal'].links)
      if links:mat.node_tree.links.new(links[0].from_socket,bevel.inputs['Normal'])
      mat.node_tree.links.new(bevel.outputs['Normal'],bsdf.inputs['Normal'])
 bevel_counts=[sum(n.type=='BEVEL' for n in m.node_tree.nodes) for m in bpy.data.materials if m.use_nodes]
 assert max(bevel_counts,default=0)<=1, 'Repeated bevel chains on a shared material'
 def render(suffix):
  if args.probe:return
  target_file=output/f'{file.stem}-{suffix}.jpg'
  scene.render.filepath=str(target_file);bpy.ops.render.render(write_still=True)
  # Read the actual written JPEG. A ray hit alone does not prove a usable photo.
  photo=bpy.data.images.load(str(target_file),check_existing=False)
  try:
   values=np.empty(len(photo.pixels),dtype=np.float32);photo.pixels.foreach_get(values);rgb=values.reshape(-1,4)[:,:3]
   if float(rgb.std(axis=0).max())<2/255 or float(rgb.max())<.01:raise RuntimeError(f'{file.stem}/{suffix}: blank or unlit frame')
  finally:bpy.data.images.remove(photo)
 if not args.details_only:render('cycles')
 general_elapsed=round(time.monotonic()-started,2)
 close=[]
 general_position=camera.location.copy()
 if args.closeups:
  scene.render.resolution_x=args.detail_width;scene.render.resolution_y=round(args.detail_width*2/3);scene.cycles.samples=args.detail_samples
  meshes=[o for o in scene.objects if o.type=='MESH' and o.get('materialKey')]
  for label,keys in [('fabric',['fabric','welt']),('wood',['wood','top','case']),('joint',['front','leg','case','top'])]:
   if label not in args.detail.split(','):continue
   actual=fixtures[file.stem]['materials']
   def isWood(o):
    key=o.get('materialKey');m=actual.get(key,{})
    return key=='wood' or m.get('surface') in ['wood','veneer']
   candidates=[o for o in meshes if (o.get('materialKey') in ['fabric','welt'] if label=='fabric' else isWood(o) if label=='wood' else o.get('materialKey') in keys)]
   requestedPresent=bool(candidates)
   if not candidates:candidates=[o for o in meshes if o.get('materialKey')=='front'] or [o for o in meshes if o.get('materialKey') in ['top','case']] or meshes
   if not candidates:raise RuntimeError('No real product surface for detail')
   priority={'fabric':{'fabric':3,'welt':1},'wood':{'front':4,'case':3,'wood':2},'joint':{'wood':4,'front':3,'case':2,'top':1}}[label]
   visible=False
   for obj in sorted(candidates,key=lambda o:(priority.get(o.get('materialKey'),0),o.dimensions.length),reverse=True):
    box=[obj.matrix_world@Vector(c) for c in obj.bound_box];mn=Vector(tuple(min(v[i] for v in box) for i in range(3)));mx=Vector(tuple(max(v[i] for v in box) for i in range(3)))
    focus=(mn+mx)/2
    if label=='joint':focus.x=mx.x-.012;focus.z=mx.z-.008
    if label=='fabric':
     focus.z=mn.z+(mx.z-mn.z)*.3
     if not requestedPresent:focus.x=mn.x+(mx.x-mn.x)*.25
    direction=(focus-general_position).normalized()
    hit,point,normal,face,hit_object,matrix=scene.ray_cast(bpy.context.evaluated_depsgraph_get(),general_position,direction,distance=100)
    if not hit or not hit_object.get('materialKey'):continue
    to_general=(general_position-point).normalized()
    if normal.dot(to_general)<.05:continue
    if label=='wood' and requestedPresent and not isWood(hit_object):continue
    if label=='fabric' and requestedPresent and hit_object.get('materialKey') not in ['fabric','welt']:continue
    # This segment is before the first scene hit: it cannot be inside the cabinet.
    camera.location=point+to_general*.65;camera.rotation_mode='QUATERNION';camera.rotation_quaternion=(point-camera.location).to_track_quat('-Z','Y')
    camera.data.lens=85;camera.data.dof.use_dof=True;camera.data.dof.aperture_fstop=5.6
    visible=True;break
   if not visible:raise RuntimeError(f'{file.stem}/{label}: no exterior visible requested surface')
   bpy.context.view_layer.update();optical=world_to_camera_view(scene,camera,point)
   assert abs(optical.x-.5)<1e-4 and abs(optical.y-.5)<1e-4, 'Selected surface is not at optical centre'
   focus_object=bpy.data.objects.new('Actual surface focus',None);bpy.context.collection.objects.link(focus_object);focus_object.location=point;camera.data.dof.focus_object=focus_object;camera.data.dof.focus_distance=(point-camera.location).length
   render('detail-'+label);close.append({'detail':label,'mesh':obj.name,'material':obj.get('materialKey'),'lensMm':85,'fstop':5.6,'cameraMethod':'first-visible-surface-from-general-view','opticalCentreVerified':True,'cameraQuaternionWXYZ':list(camera.rotation_quaternion),'width':scene.render.resolution_x,'height':scene.render.resolution_y,'samples':scene.cycles.samples,'cameraPositionM':list(camera.location),'focusPointM':list(point),'cameraOutsideScene':True,'focusHitMesh':hit_object.name,'focusHitMaterial':hit_object.get('materialKey'),'focusDistanceM':round((point-camera.location).length,5),'requestedMaterialPresent':requestedPresent,'note':None if requestedPresent else 'Requested material absent; showing actual product surface, no invented fabric/wood' })
 report.append({'id':file.stem,'renderScriptSha256':script_sha,'sourceGlbSha256':source_sha,'generalRendered':not args.details_only,'probeOnly':args.probe,'engine':'Cycles','device':'CPU','denoiser':'OPENIMAGEDENOISE','samples':args.samples,'width':args.width,'height':round(args.width*2/3),'maxBevelNodesPerMaterial':max(bevel_counts,default=0),'cameraFovMatchesGltf':True,'generalLensMm':55,'sensorFit':'HORIZONTAL','sensorWidthMm':35,'generalSeconds':general_elapsed,'totalSeconds':round(time.monotonic()-started,2),'closeups':close})
 (output/(('focus-probe-report' if args.probe else 'cycles-details-report' if args.details_only else 'cycles-report')+('-'+args.id.replace(',','_') if args.id else '')+('-'+args.detail.replace(',','_') if args.details_only else '')+'.json')).write_text(json.dumps(report,indent=2),encoding='utf-8')
