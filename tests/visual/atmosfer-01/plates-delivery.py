"""Validate the completed approval cohort and build its gallery. Never labels partial output complete."""
import json,hashlib,re,shutil
from pathlib import Path
from PIL import Image,ImageStat,ImageChops
root=Path(__file__).resolve().parents[3];folder=root/'knowledge/atmosfer/sahneler';examples=folder/'ornekler'
manifest=json.loads((folder/'manifest.json').read_text());assert len(manifest['rooms'])==30
report=json.loads((examples/'capture.json').read_text());assert report['passed'] and not report['errors'];assert len(report['frames'])==120
assert len({r['file'] for r in report['frames']})==120
for file,digest in report['sources'].items():
 raw=(root/file).read_bytes();lf=raw.replace(b'\r\n',b'\n');assert digest in {hashlib.sha256(v).hexdigest() for v in [raw,lf,lf.replace(b'\n',b'\r\n')]},file
rows={r['id']:r for r in manifest['rooms']};proof=[];package=0
for row in rows.values():
 assert row['size']=='medium'
 data=folder/(row['id']+'.json');assert json.loads(data.read_text())==row
 hdr=folder/row['environment'];assert b'-Y 128 +X 256' in hdr.read_bytes()[:500]
 for c in row['cameras'].values():
  file=folder/c['plate'];im=Image.open(file);assert im.size==(2400,1600);assert max(ImageStat.Stat(im.resize((96,64))).stddev)>3
  proof.append({'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
 for file in [data,hdr,*[folder/c['plate'] for c in row['cameras'].values()]]:package+=file.stat().st_size
assert package<=120_000_000
for stale in ['capture-seating.json','capture-bath.json']:(examples/stale).unlink(missing_ok=True)
for frame in report['frames']:
 file=examples/frame['file'];im=Image.open(file);assert im.size==(2400,1600)
 plate=Image.open(folder/rows[frame['key']]['cameras'][frame['camera']]['plate']);diff=ImageChops.difference(im,plate).convert('L');assert ImageStat.Stat(diff).mean[0]>1,frame['file']
 assert .6<=frame['projectedWidth']<=.75;assert all(abs(v)<.99 for v in frame['frameBounds'].values())
 proof.append({'file':'ornekler/'+file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
names={'seating':'Oturma','table':'Masa','storage':'Dolap / kitaplık','kitchen':'Mutfak','bath':'Banyo'};textures={'KIREC':'Kireç','TAS':'Taş','TOPRAK':'Toprak'};lights={'SABAH':'Sabah','AKSAM':'Akşam'}
lines=['# AURA · Hazır sahneler: orta oda onayı','', 'Beş aile; her ailede **3 doku × 2 ışık**, iki gerçek orta boy örnek ürün. Her görüntü 2400 px; tablo A kamerasını gösterir, **B** bağlantısı aynı ürünün cephe kamerasını açar. Görsel onaydan önce küçük/büyük odalar üretilmemiştir.','', '[Mimari ve sınırlar](HAZIR-SAHNE-MIMARISI.md) · [Sahne tanımı](SAHNELER.md) · [Ürün parametreleri](sahneler/ornekler/examples.json) · [Tarayıcı raporu](sahneler/ornekler/capture.json) · [Doğrulama](sahneler/verification.json)','',f'**Teslim:** 30 seçenek, 60 Blender plaka, 30 HDR, 120 ürünlü tarayıcı görüntüsü. Plaka + HDR + JSON toplamı **{package/1e6:.2f} MB**. Plaka motoru EEVEE Next; ışık haritası Cycles CPU/OIDN.','']
for family,title in names.items():
 lines += ['## '+title,'','| Doku | Işık | Ürün 1 · A / B | Ürün 2 · A / B |','|---|---|---|---|']
 for texture,tn in textures.items():
  for light,ln in lights.items():
   cells=[]
   for i in (1,2):
    stem=f'{family}-medium-example-{i}-{texture}-{light}';cells.append(f'![{title} {tn} {ln} ürün {i} A](sahneler/ornekler/{stem}-A.jpg) [B — cephe](sahneler/ornekler/{stem}-B.jpg)')
   lines.append('| '+' | '.join([tn,ln,*cells])+' |')
 lines.append('')
gallery=root/'knowledge/atmosfer/ornekler.md';archive=gallery.with_name('ornekler-urun-render-arsivi.md')
if not archive.exists():archive.write_text('> Arşiv: önceki ürün başına tam oda denemeleri. Güncel hazır sahne teslimi [ornekler.md](ornekler.md) içindedir.\n\n'+gallery.read_text(encoding='utf-8'),encoding='utf-8')
gallery.write_text('\n'.join(lines)+'\n',encoding='utf-8')
verification={'status':'PASS','scope':'medium-approval-cohort','rooms':30,'plates':60,'hdr':30,'productFrames':120,'packageBytes':package,'smallLargeProduced':False,'visualApproval':'PENDING','files':proof}
(folder/'verification.json').write_text(json.dumps(verification,indent=2));print(json.dumps({k:v for k,v in verification.items() if k!='files'}))
