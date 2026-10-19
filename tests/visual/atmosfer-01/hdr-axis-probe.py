import bpy,math,sys,numpy as np,json
bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=1;s.cycles.use_denoising=False;s.render.resolution_x=256;s.render.resolution_y=128;s.render.resolution_percentage=100
for pos,col in [((2,0,0),(1,0,0,1)),((-2,0,0),(0,1,0,1)),((0,2,0),(0,0,1,1)),((0,-2,0),(1,1,0,1)),((0,0,2),(1,0,1,1)),((0,0,-2),(0,1,1,1))]:
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.scale=[.01 if v else 4.1 for v in pos];m=bpy.data.materials.new(str(pos));m.use_nodes=True;n=m.node_tree.nodes;n.clear();e=n.new('ShaderNodeEmission');e.inputs[0].default_value=col;output=n.new('ShaderNodeOutputMaterial');m.node_tree.links.new(e.outputs[0],output.inputs[0]);o.data.materials.append(m)
bpy.ops.object.camera_add(location=(0,0,0),rotation=(math.pi/2,0,0));cam=bpy.context.object;s.camera=cam;cam.data.type='PANO';cam.data.panorama_type='EQUIRECTANGULAR';s.render.image_settings.file_format='HDR';s.render.filepath=sys.argv[sys.argv.index('--')+1];bpy.ops.render.render(write_still=True);im=bpy.data.images.load(s.render.filepath);a=np.array(im.pixels[:]).reshape(128,256,4);samples={str(x):a[64,x,:3].tolist() for x in [0,64,128,192]}
assert samples=={'0':[1,1,0],'64':[0,1,0],'128':[0,0,1],'192':[1,0,0]}
result={'passed':True,'blenderVersion':bpy.app.version_string,'samples':samples,'threeEnvironmentRotationY':math.pi/2,'mapping':'u=0 Three +Z; .25 -X; .5 -Z; .75 +X'};print('AXIS_PROBE '+json.dumps(result))
if len(sys.argv)>sys.argv.index('--')+2:
 from pathlib import Path
 Path(sys.argv[sys.argv.index('--')+2]).write_text(json.dumps(result,indent=2))
