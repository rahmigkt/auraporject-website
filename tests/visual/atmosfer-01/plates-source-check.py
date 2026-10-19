"""Resolve every actual plate bake source hash to its committed generator snapshot."""
import hashlib,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[3];folder=root/'knowledge/atmosfer/sahneler';manifest=json.loads((folder/'manifest.json').read_text());source='tests/visual/atmosfer-01/plates.py'
required={manifest['generatorSHA256'],*[r.get('renderGeneratorSHA256',manifest['generatorSHA256']) for r in manifest['rooms']]};found={}
commits=subprocess.check_output(['git','log','--format=%H','--',source],cwd=root,text=True).splitlines()
for commit in commits:
 raw=subprocess.check_output(['git','show',commit+':'+source],cwd=root);lf=raw.replace(b'\r\n',b'\n')
 for body in [raw,lf,lf.replace(b'\n',b'\r\n')]:
  digest=hashlib.sha256(body).hexdigest()
  if digest in required:found[digest]={'sha256':digest,'commit':commit,'path':source}
 if required<=found.keys():break
assert required<=found.keys(),'Commit the exact bake generator before producing review assets'
report={'passed':True,'generatorSHA256':manifest['generatorSHA256'],'sources':list(found.values()),'note':'Per-room pixel bake sources; annotation-only corrections are made by plates-calibrate.py'}
(folder/'render-source-check.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
