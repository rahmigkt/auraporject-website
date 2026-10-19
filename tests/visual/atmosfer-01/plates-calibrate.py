"""Independent Blender projection reference for the browser's camera matching test."""
import bpy,json,sys,math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
root=Path(sys.argv[sys.argv.index('--')+1]).resolve();rows=[]
for file in sorted(root.glob('*-medium-*.json')):
 row=json.loads(file.read_text());
 for name,c in row['cameras'].items():
  bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.resolution_x=c['width'];s.render.resolution_y=c['height'];s.render.resolution_percentage=100
  def vec(p):return Vector((p[0],-p[2],p[1]))
  bpy.ops.object.camera_add(location=vec(c['position']));cam=bpy.context.object;cam.rotation_euler=(vec(c['target'])-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=c['lensMM'];cam.data.sensor_fit='HORIZONTAL';cam.data.sensor_width=c['sensorWidthMM'];cam.data.shift_y=c['shiftY'];bpy.context.view_layer.update()
  probes=[]
  for point in [[0,0,0],[0,1,0],[.5,0,0],[0,0,.5]]:
   uv=world_to_camera_view(s,cam,vec(point));probes.append({'point':point,'uv':[uv.x,uv.y]})
  rows.append({'id':row['id'],'camera':name,'probes':probes})
(root/'camera-calibration.json').write_text(json.dumps({'source':'Blender bpy_extras.world_to_camera_view','rows':rows},indent=2))
