"""Publish only fully written, nonblank 2400px CPU frames from this render log."""
import argparse,json,re,hashlib
from pathlib import Path
from PIL import Image,ImageStat
p=argparse.ArgumentParser();p.add_argument('--log',required=True);args=p.parse_args()
root=Path(__file__).resolve().parents[3];frames=root/'knowledge/atmosfer/kareler'
fixtures=json.loads((root/'tests/visual/atmosfer-01/designs.json').read_text(encoding='utf-8'))
allowed={f['id']+s+'.jpg' for f in fixtures for s in ['-cycles','-detail-1','-detail-2','-detail-3']}
log=Path(args.log).read_text(encoding='utf-8',errors='replace');assert 'Traceback' not in log and 'Error: script failed' not in log
names={Path(name.replace('\\','/')).name for name in re.findall(r"Saved: ['\"]([^'\"]+\.jpg)['\"]",log)}
assert names<=allowed,names-allowed
images=[]
for name in sorted(names):
 file=frames/name
 with Image.open(file) as photo:
  assert photo.size==(2400,1600),(name,photo.size)
  assert max(ImageStat.Stat(photo.convert('RGB').resize((64,64))).stddev)>2,(name,'blank')
 images.append({'file':name,'width':2400,'height':1600,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
script=root/'tests/visual/atmosfer-01/cycles.py'
result={'status':'COMPLETE' if len(images)==48 else 'IN_PROGRESS','verifiedFrames':len(images),'expectedFrames':48,'renderScriptSha256':hashlib.sha256(script.read_bytes()).hexdigest(),'note':'Completed JPEGs only; full geometry/role acceptance remains in verify-artifacts.py after all twelve designs finish.','images':images}
(frames/'cycles-progress.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(f'Verified CPU frames {len(images)}/48 at 2400 px; complete batch not implied.')
