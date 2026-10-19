"""Bake the approval cohort only: five medium rooms, 3 textures, 2 lights, 2 cameras.
Run Blender --background --python plates.py -- --output ABSOLUTE_DIR.
Coordinates in JSON are Three.js metres (Y up); Blender uses Z up.
"""
import argparse, json, math, sys, time, hashlib
from pathlib import Path
import bpy
from mathutils import Vector

p=argparse.ArgumentParser();p.add_argument('--output',required=True);p.add_argument('--family');p.add_argument('--samples',type=int,default=16);p.add_argument('--plate-engine',choices=['CYCLES','BLENDER_EEVEE_NEXT'],default='BLENDER_EEVEE_NEXT')
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True)
rooms={'seating':(3.4,3.0,1.8),'table':(3.4,3.2,1.8),'storage':(3.6,3.0,1.8),'kitchen':(3.8,3.0,1.8),'bath':(2.6,2.4,1.8)}
textures={'KIREC':('#ECE6DC','#C3A780'),'TAS':('#D8CFBD','#D3CCBA'),'TOPRAK':('#B9A08A','#655144')}
def linear(h):
    rgb=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)
def material(name,color,wood=False):
    m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;b=n.get('Principled BSDF');b.inputs['Base Color'].default_value=(*linear(color),1);b.inputs['Roughness'].default_value=.83
    coord=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(22,1.5,5) if wood else (90,90,90);l.new(coord.outputs['Generated'],mapping.inputs[0])
    noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=3;noise.inputs['Detail'].default_value=3;l.new(mapping.outputs[0],noise.inputs['Vector'])
    ramp=n.new('ShaderNodeValToRGB');base=linear(color)
    ramp.color_ramp.elements[0].color=(*(v*.88 for v in base),1);ramp.color_ramp.elements[1].color=(*(min(1,v*1.07) for v in base),1);l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],b.inputs['Base Color'])
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.0006;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],b.inputs['Normal']);return m
def cube(name,loc,scale,mat,camera=True):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(mat);o.visible_camera=camera;return o
def area(name,pos,target,power,color,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
def three(v):return [v[0],v[2],-v[1]]
manifest={'schema':'aura.scene-plates/1','cohort':'medium-approval','sizesProduced':['medium'],'rooms':[],'generatorSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
for family,(w,d,product_width) in rooms.items():
 if a.family and family!=a.family:continue
 for texture,(wallcolor,floorcolor) in textures.items():
  for light in ('SABAH','AKSAM'):
   start=time.monotonic();key=f'{family}-medium-{texture}-{light}';bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.device='CPU';s.cycles.samples=a.samples;s.cycles.use_denoising=True;s.cycles.denoiser='OPENIMAGEDENOISE';s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_min_samples=4;s.cycles.adaptive_threshold=.07;s.cycles.max_bounces=5
   s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.render.image_settings.file_format='JPEG';s.render.image_settings.quality=88;s.render.resolution_percentage=100
   wall=material('Mineral plaster '+texture,wallcolor);floor=material('Honed limestone' if texture=='TAS' else 'Matte oak',floorcolor,texture!='TAS');trim=material('Matte skirting',wallcolor)
   # Physical enclosure; front wall is invisible only to photographic camera rays.
   cube('Floor photographic overscan',(0,-d/2+.65,-.055),(w+8,d+8,.11),floor)
   cube('Back wall photographic overscan',(0,.70,1.4),(w+8,.10,2.8),wall)
   right=cube('Right photographic cutaway',(w/2,-d/2+.65,1.4),(.10,d,2.8),wall,False);right.visible_shadow=False
   front=cube('Front photographic cutaway',(0,-d+.65,1.4),(w,.10,2.8),wall,False)
   # Window aperture in the left wall, not a bright rectangle painted on plaster.
   cube('Window sill wall',(-w/2,-d/2+.65,.4),(.10,d,.8),wall)
   cube('Window header',(-w/2,-d/2+.65,2.65),(.10,d,.3),wall)
   for y in (.50,-d+.80):cube('Window pier',(-w/2,y,1.65),(.10,.3,1.7),wall)
   cube('Rear skirting',(0,.625,.03),(w+8,.025,.06 if texture!='TAS' else .04),trim)
   # Broad, matte boards/slabs with narrow joints. No alternating colour grid.
   if texture!='TAS':
    for i in range(1,math.ceil((w+8)/.20)):
     x=-(w+8)/2+i*.20
     if x<(w+8)/2:cube('Wide oak board joint',(x,-d/2+.65,.001),(.001,d+8,.0005),material('Joint '+str(i),floorcolor))
   else:
    joint=material('Fine limestone grout','#BBB4A5')
    for i in range(1,math.ceil((w+8)/.6)):
     x=-(w+8)/2+i*.6
     if x<(w+8)/2:cube('Stone joint',(x,-d/2+.65,.001),(.0015,d+8,.0005),joint)
    for i in range(-3,math.ceil((d+8)/1.2)):
     y=.65-i*1.2;cube('Stone joint',(0,y,.001),(w+8,.0015,.0005),joint)
   world=bpy.data.worlds.new('Soft sky');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.68,.78,1,1);world.node_tree.nodes['Background'].inputs[1].default_value=.30 if light=='SABAH' else .065;s.world=world
   # Bright, defocused exterior for photographic rays; preserve low ambient energy.
   wn=world.node_tree.nodes;wl=world.node_tree.links;sky=wn.new('ShaderNodeBackground');sky.inputs[0].default_value=(.82,.9,1,1);sky.inputs[1].default_value=4 if light=='SABAH' else .7;ray=wn.new('ShaderNodeLightPath');mix=wn.new('ShaderNodeMixShader');wl.new(ray.outputs['Is Camera Ray'],mix.inputs[0]);wl.new(wn['Background'].outputs[0],mix.inputs[1]);wl.new(sky.outputs[0],mix.inputs[2]);wl.new(mix.outputs[0],wn['World Output'].inputs['Surface'])
   area('Window 5600K' if light=='SABAH' else 'Dusk window 4200K',(-w/2-.15,-.7,1.65),(0,0,.65),400 if light=='SABAH' else 90,(.88,.94,1) if light=='SABAH' else (1,.79,.58),2.0)
   if light=='AKSAM':area('Off-frame lamp 2700K',(1.3,-1,1.55),(0,0,.7),150,(1,.53,.22),1.3)
   area('Weak bounced fill',(0,-2,1.7),(0,0,.5),15,(1,.91,.79),2.8)
   bpy.ops.object.camera_add(location=(0,0,.8));cam=bpy.context.object;s.camera=cam;cam.data.type='PANO';cam.data.panorama_type='EQUIRECTANGULAR';cam.rotation_euler=(math.pi/2,0,0)
   right.visible_camera=front.visible_camera=True;right.visible_shadow=True
   s.render.resolution_x=256;s.render.resolution_y=128;s.render.image_settings.file_format='HDR';s.render.filepath=str(out/(key+'.hdr'));bpy.ops.render.render(write_still=True)
   right.visible_camera=front.visible_camera=False;right.visible_shadow=False
   row={'id':key,'family':family,'size':'medium','texture':texture,'light':light,'roomMetres':[w,2.8,d],'environment':key+'.hdr','environmentPoint':[0,.8,0],'plateEngine':a.plate_engine,'environmentEngine':'CYCLES','cameras':{}}
   s.render.engine=a.plate_engine
   if a.plate_engine=='BLENDER_EEVEE_NEXT':
    s.eevee.taa_render_samples=32;s.eevee.use_raytracing=True
   cam.data.type='PERSP';cam.data.sensor_width=36;cam.data.sensor_fit='HORIZONTAL';cam.data.clip_start=.01;cam.data.clip_end=100
   for name,lens,height,angle in [('A',50,1.2,32),('B',70,1.05,5)]:
    distance=product_width/.68*lens/36;theta=math.radians(angle);cam.location=(math.sin(theta)*distance,-math.cos(theta)*distance,height);cam.rotation_euler=(Vector((0,0,height))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=lens
    centre={'seating':.45,'table':.42,'storage':.6,'kitchen':.7,'bath':.8}[family];cam.data.shift_y=(centre-height)*lens/(distance*36)
    s.render.resolution_x=2400;s.render.resolution_y=1600;s.render.image_settings.file_format='JPEG';s.render.filepath=str(out/(key+'-'+name+'.jpg'));bpy.ops.render.render(write_still=True)
    row['cameras'][name]={'plate':key+'-'+name+'.jpg','position':three(cam.location),'target':[0,height,0],'lensMM':lens,'sensorWidthMM':36,'shiftY':cam.data.shift_y,'width':2400,'height':1600,'floor':{'normal':[0,1,0],'constant':0},'productOrigin':[0,0,0],'shadowDirection':[1,0,.3]}
   row['seconds']=round(time.monotonic()-start,2);(out/(key+'.json')).write_text(json.dumps(row,indent=2));manifest['rooms'].append(row);(out/'manifest.json').write_text(json.dumps(manifest,indent=2));print('PLATE_COMPLETE '+key,flush=True)
