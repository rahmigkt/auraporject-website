"""Verify main #61 batch, source fingerprints and real product detail targets."""
import hashlib,json,subprocess
from pathlib import Path
from PIL import Image,ImageStat
root=Path(__file__).resolve().parents[3];frames=root/'knowledge/atmosfer/kareler'
fixtures=json.loads((root/'tests/visual/atmosfer-01/designs.json').read_text(encoding='utf-8'));by_id={f['id']:f for f in fixtures};ids=set(by_id)
assert len(ids)==12 and all(f['design']['family']!='bedroom' for f in fixtures)
exports=json.loads((root/'knowledge/atmosfer/gltf-export-report.json').read_text());export_by_id={r['id']:r for r in exports['fixtures']};assert set(export_by_id)==ids
for name,digest in exports['sourceFilesSha256'].items():assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest,(name,'source changed since export')
cycles=json.loads((frames/'cycles-report.json').read_text(encoding='utf-8'));assert {r['id'] for r in cycles}==ids,'Cycles batch incomplete'
script_hash=hashlib.sha256((root/'tests/visual/atmosfer-01/cycles.py').read_bytes()).hexdigest()
for row in cycles:
 assert not row['probeOnly'] and row['generalRendered'] and row['cameraFovMatchesGltf']
 assert (row['engine'],row['device'],row['denoiser'])==('Cycles','CPU','OPENIMAGEDENOISE')
 assert (row['width'],row['height'],row['samples'])==(2400,1600,32)
 assert row['adaptiveMinSamples']==4 and row['noiseThreshold']==.035
 assert row['renderScriptSha256']==script_hash and row['maxBevelNodesPerMaterial']<=1
 assert row['generalShiftY']==export_by_id[row['id']]['generalShiftY']<0
 assert row['sourceGlbSha256']==export_by_id[row['id']]['sha256']
 assert len(row['closeups'])==3 and {d['detail'] for d in row['closeups']}=={'1','2','3'}
 for detail,plan in zip(row['closeups'],by_id[row['id']]['details']):
  assert detail['label']==plan['label'] and detail['focusHitRole'] in plan['roles']
  assert detail['focusDistanceM']>0 and detail['focusHitMesh'] and detail['focusHitMaterial'] and detail['fstop']==5.6
  assert detail['opticalCentreVerified'] and detail['cameraOutsideScene']
  assert (detail['width'],detail['height'],detail['samples'])==(2400,1600,24)
for file,mode in [('capture-report.json','raster'),('path-capture-report.json','path')]:
 report=json.loads((frames/file).read_text());assert {r['id'] for r in report['captures']}==ids
 for r in report['captures']:assert r['mode']==mode and not r['errors'] and r['lazyLoadVerified']
verified=[]
for id in sorted(ids):
 for suffix,dimensions in [('final',(2400,1600)),('path',(800,534)),('cycles',(2400,1600)),('detail-1',(2400,1600)),('detail-2',(2400,1600)),('detail-3',(2400,1600))]:
  p=frames/f'{id}-{suffix}.jpg'
  with Image.open(p) as image:
   assert image.size==dimensions,(p,image.size)
   assert max(ImageStat.Stat(image.convert('RGB').resize((64,64))).stddev)>2,(p,'blank/uniform frame')
  verified.append({'file':p.name,'width':dimensions[0],'height':dimensions[1],'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
general={'renderSourceCommit':subprocess.check_output(['git','log','-1','--format=%H','--','tests/visual/atmosfer-01/cycles.py'],cwd=root).decode().strip(),'renderScriptSha256':script_hash,'note':'All 48 CPU frames regenerated in one source pass at 2400 px; general lens shift retained, macro shift reset.','frames':[]}
for row in cycles:
 general['frames'].append({k:row[k] for k in ['id','sourceGlbSha256','engine','device','denoiser','samples','width','height','generalLensMm','generalShiftY','generalSeconds']})
 general['frames'][-1]['jpegSha256']=next(r['sha256'] for r in verified if r['file']==row['id']+'-cycles.jpg')
(frames/'cycles-general-report.json').write_text(json.dumps(general,indent=2),encoding='utf-8')
(frames/'cycles-detail-run.json').write_text(json.dumps({'renderScriptSha256':script_hash,'note':'Details from the same complete source pass.','frames':[{'id':r['id'],'closeups':r['closeups']} for r in cycles]},indent=2),encoding='utf-8')
(root/'knowledge/atmosfer/artifact-verification.json').write_text(json.dumps({'status':'PASS','mainMerged':'49be4f839508bab1d9791f0816e31a4bf450ece5','newFrames':len(verified),'cyclesFrames2400':48,'realProductRoleCloseups':36,'images':verified},indent=2),encoding='utf-8')
print('PASS: 72 regenerated frames; 48 CPU Cycles at 2400 px; 36 real role / exterior-focus / optical-centre checks; export provenance and hashes.')
