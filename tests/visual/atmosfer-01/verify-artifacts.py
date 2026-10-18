"""Verify real PR image artifacts; requires Pillow and completed captures."""
import hashlib,json,subprocess
from pathlib import Path
from PIL import Image,ImageStat
root=Path(__file__).resolve().parents[3];frames=root/'knowledge/atmosfer/kareler';fixtures=json.loads((root/'tests/visual/atmosfer-01/designs.json').read_text(encoding='utf-8'));ids={f['id'] for f in fixtures}
assert len(ids)==12
exports={r['id']:r['sha256'] for r in json.loads((root/'knowledge/atmosfer/gltf-export-report.json').read_text())['fixtures']}
cycles=json.loads((frames/'cycles-report.json').read_text(encoding='utf-8'));assert {r['id'] for r in cycles}==ids,'Cycles batch incomplete'
for row in cycles:
 assert not row.get('probeOnly');assert row['cameraFovMatchesGltf'];assert row['engine']=='Cycles' and row['device']=='CPU' and row['denoiser']=='OPENIMAGEDENOISE'
 assert len(row['closeups'])==3 and {d['detail'] for d in row['closeups']}=={'fabric','wood','joint'}
 assert row['sourceGlbSha256']==exports[row['id']]
 for detail in row['closeups']:assert detail['focusDistanceM']>0 and detail['focusHitMesh'] and detail['focusHitMaterial'] and detail['fstop']==5.6
raster=json.loads((frames/'capture-report.json').read_text());path=json.loads((frames/'path-capture-report.json').read_text());assert {r['id'] for r in raster['captures']}==ids;assert {r['id'] for r in path['captures']}==ids
for report,mode in [(raster,'raster'),(path,'path')]:
 for r in report['captures']:assert r['mode']==mode and not r['errors'] and r['lazyLoadVerified']
verified=[]
for id in sorted(ids):
 old=frames/f'eski-raster/{id}-final.jpg';original=subprocess.check_output(['git','show',f'cb127ea:knowledge/atmosfer/kareler/{id}-final.jpg'],cwd=root);assert old.read_bytes()==original
 for suffix,dimensions in [('final',(2400,1600)),('path',(800,534)),('cycles',(1200,800)),('detail-fabric',(1000,667)),('detail-wood',(1000,667)),('detail-joint',(1000,667))]:
  p=frames/f'{id}-{suffix}.jpg'
  with Image.open(p) as image:
   assert image.size==dimensions,(p,image.size)
   std=ImageStat.Stat(image.convert('RGB').resize((64,64))).stddev;assert max(std)>2,(p,'blank/uniform frame')
  verified.append({'file':p.name,'width':dimensions[0],'height':dimensions[1],'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(root/'knowledge/atmosfer/artifact-verification.json').write_text(json.dumps({'status':'PASS','newFrames':len(verified),'oldRasterFramesPreserved':12,'images':verified},indent=2),encoding='utf-8')
print('PASS: 12 old frames unchanged; 12 raster + 12 experimental path + 12 CPU Cycles + 36 actual-focus closeups; dimensions/nonblank/hashes verified.')
