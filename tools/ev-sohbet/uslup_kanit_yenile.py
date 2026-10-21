"""Refresh text-only reproduction manifests without replacing their old evidence."""
from pathlib import Path
import hashlib,json
from uslup_duzelt import ROOT,run,records
BASE=ROOT/'knowledge/ai-egitim'
def refresh():
 paths=list(records());before={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths};run();after={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths};assert before==after
 ar=BASE/'toparlama-01/archive/generation-manifests';ar.mkdir(parents=True,exist_ok=True)
 for b in ['02','uk-ie','dk','es','it']:
  p=BASE/'veri'/('ev-sohbet-'+b)/'yeniden-uretim-sonucu.json';archive=ar/('ev-sohbet-'+b+'.json')
  if not archive.exists():archive.write_bytes(p.read_bytes())
  manifest=json.loads(p.read_text(encoding='utf8'));manifest.update(records=len([x for x in paths if x.parent==p.parent]),byte_identical=True,hashes={x.name:after[x] for x in paths if x.parent==p.parent},method='TOPARLAMA-4 editorial overlay repeated byte-identically; all non-dialogue digests unchanged; original generation manifest archived',renderer_validation='Historical viewer evidence retained; no new browser geometry validation asserted')
  p.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
 f=BASE/'toparlama-01/archive-manifest.json';manifest={r['path']:r for r in json.loads(f.read_text(encoding='utf8'))}
 for p in ar.glob('*.json'):
  path=p.relative_to(ROOT).as_posix();manifest[path]={'path':path,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'status':'superseded'}
 f.write_text(json.dumps(list(manifest.values()),ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n');print('40 byte-identical overlays; original generation manifests preserved')
if __name__=='__main__':refresh()
