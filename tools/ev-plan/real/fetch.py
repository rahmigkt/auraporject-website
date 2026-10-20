"""Download only a pinned, commercial-compatible source after metadata verification."""
import argparse
import hashlib
import json
import time
import urllib.request
from pathlib import Path

SWISS_RECORD='7788422'
SWISS_FILE='swiss-dwellings-v3.0.0.zip'
SWISS_MD5='3b7915ecd5bf8e492a3e78c598b74123'


def fetch(destination):
    dest=Path(destination);dest.mkdir(parents=True,exist_ok=True)
    url=f'https://zenodo.org/api/records/{SWISS_RECORD}'
    with urllib.request.urlopen(url,timeout=60) as res:meta=json.load(res)
    if meta['metadata'].get('license',{}).get('id')!='cc-by-4.0':
        raise ValueError('License changed/unclear: refusing data download')
    entry=next(f for f in meta['files'] if f['key']==SWISS_FILE)
    if entry['checksum']!='md5:'+SWISS_MD5:raise ValueError('Pinned publisher checksum changed')
    (dest/'swiss-metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
    target=dest/SWISS_FILE;part=dest/(SWISS_FILE+'.part');started=time.monotonic()
    if not target.exists():
        size=0;last=0
        with urllib.request.urlopen(entry['links']['self'],timeout=60) as response,part.open('wb') as out:
            while True:
                chunk=response.read(4*1024*1024)
                if not chunk:break
                out.write(chunk);size+=len(chunk)
                if size-last>=64*1024*1024:print(f'downloaded {size}/{entry["size"]} bytes',flush=True);last=size
        if size!=entry['size']:raise ValueError('Incomplete archive; no success manifest written')
        part.replace(target)
    md5=hashlib.md5();sha=hashlib.sha256()
    with target.open('rb') as source:
        while chunk:=source.read(8*1024*1024):md5.update(chunk);sha.update(chunk)
    if md5.hexdigest()!=SWISS_MD5 or target.stat().st_size!=entry['size']:
        raise ValueError('Archive checksum/size mismatch')
    manifest=dict(source='Swiss Dwellings',version='3.0.0',record=SWISS_RECORD,doi='10.5281/zenodo.7788422',
                  license='CC-BY-4.0',license_url='https://creativecommons.org/licenses/by/4.0/legalcode',
                  url=entry['links']['self'],file=SWISS_FILE,size=entry['size'],publisher_md5=md5.hexdigest(),sha256=sha.hexdigest(),
                  download_seconds=round(time.monotonic()-started,3),
                  privacy_policy='Only geometry fields consumed; never extract locations.csv, location_ratings.csv or address/geolocation metadata. Rebase local geometry per dwelling and pseudonymize source ids.')
    (dest/'download-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
    print(json.dumps(manifest),flush=True)


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--destination',required=True);a=p.parse_args();fetch(a.destination)
