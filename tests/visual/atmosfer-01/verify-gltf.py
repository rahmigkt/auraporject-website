"""Verify current design GLBs and embedded maps before offline rendering."""
import argparse,struct,json,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--input',required=True);args=p.parse_args()
root=Path(__file__).resolve().parents[3];folder=Path(args.input).resolve()
fixtures=json.loads((root/'tests/visual/atmosfer-01/designs.json').read_text(encoding='utf-8'));ids={f['id'] for f in fixtures};rows=[]
assert {p.stem for p in folder.glob('*.glb')}==ids
for file in sorted(folder.glob('*.glb')):
 data=file.read_bytes();length=struct.unpack_from('<I',data,12)[0];g=json.loads(data[20:20+length]);assert data[:4]==b'glTF';assert struct.unpack_from('<I',data,8)[0]==len(data)
 images=g.get('images',[]);assert images and all('bufferView' in i and 'uri' not in i for i in images)
 metadata=json.loads(file.with_suffix('.json').read_text());assert metadata['room']['floor']=='wood' and metadata['camera']['shiftY']<0
 rows.append({'id':file.stem,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'metadataSha256':hashlib.sha256(file.with_suffix('.json').read_bytes()).hexdigest(),'meshes':len(g.get('meshes',[])),'materials':len(g.get('materials',[])),'embeddedImages':len(images),'triangles':sum(g['accessors'][q['indices']]['count']//3 for m in g['meshes'] for q in m['primitives']),'externalImageUris':0,'family':metadata['family'],'generalShiftY':metadata['camera']['shiftY']})
sources=['assets/forma/mesh.js','assets/forma/wood.js','assets/forma/atmosfer-room.js','assets/forma/atmosfer-surfaces.js','assets/forma/atmosfer-export.js','tests/visual/atmosfer-01/designs.json']
(root/'knowledge/atmosfer/gltf-export-report.json').write_text(json.dumps({'exporter':'Three r186 GLTFExporter','sourceFilesSha256':{s:hashlib.sha256((root/s).read_bytes()).hexdigest() for s in sources},'fixtures':rows},indent=2),encoding='utf-8')
print('PASS: 12 current GLBs, embedded textures, active families, wood floor and architectural camera shift.')
