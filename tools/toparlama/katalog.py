"""Catalogue tracked candidate sources, never local weights or generated work files.
Hashes describe Git blob bytes, not platform-specific CRLF checkout bytes.
"""
from pathlib import Path
import collections, hashlib, html, json, re, subprocess
ROOT=Path(__file__).resolve().parents[2]
DEST=ROOT/'knowledge/ai-egitim'
def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
def blobs():
    names=subprocess.check_output(['git','ls-files'],cwd=ROOT,text=True).splitlines()
    names=[n for n in names if n.endswith(('.json','.jsonl')) and n.startswith(('knowledge/','tests/ai-eval/','tools/yerlesim-veri/')) and n not in ['knowledge/ai-egitim/KATALOG.json']]
    raw=subprocess.check_output(['git','cat-file','--batch'],cwd=ROOT,input=''.join('HEAD:'+n+'\n' for n in names).encode());offset=0;out={}
    for name in names:
        end=raw.index(b'\n',offset);header=raw[offset:end].split();assert header[1]==b'blob',(name,header)
        size=int(header[2]);out[name]=raw[end+1:end+1+size];offset=end+size+2
    return out

def build():
    contents=blobs();entries=[];used=set()
    def take(id,paths,primary,layer,status,summary,license=None,source=None,defects=None):
        paths=sorted(paths);primary=sorted(primary);assert set(primary)<=set(paths)
        records=[]
        for f in primary:
            b=contents[f].decode('utf-8-sig')
            if f.endswith('.jsonl'):records.extend(json.loads(l) for l in b.splitlines() if l.strip())
            else:
                obj=json.loads(b);records.extend(obj if isinstance(obj,list) else [obj])
        langs=collections.Counter();countries=collections.Counter();matrix=collections.Counter()
        for r in records:
            if not isinstance(r,dict):continue
            lang=r.get('language',r.get('lang',r.get('customer_language')));country=r.get('country')
            if lang:langs[str(lang)]+=1
            if country:countries[str(country)]+=1
            matrix[(str(lang) if lang else None,str(country) if country else None,layer)]+=1
        files=[dict(path=f,sha256=hashlib.sha256(contents[f]).hexdigest(),bytes=len(contents[f]),role='primary' if f in primary else 'support') for f in paths]
        obj=dict(id=id,path=paths[0] if len(paths)==1 else (str(Path(paths[0]).parent).replace('\\','/') if paths else None),summary=summary,sha256=hashlib.sha256(canonical(files)).hexdigest() if files else None,hash_scope='SHA256(canonical JSON of Git-blob file manifests)',sources=source or [],license=license,record_count=len(records) if primary else None,record_count_scope='primary files only; derivatives excluded' if primary else 'research/support material; no candidate records asserted',languages=dict(langs),countries=dict(countries),layer=layer,status=status,known_defects=defects or [],primary_files=primary,files=files,coverage=[dict(language=k[0],country=k[1],layer=k[2],records=v) for k,v in sorted(matrix.items(),key=lambda x:str(x[0]))])
        entries.append(obj);used.update(paths)
    base='knowledge/ai-egitim/veri/'
    for batch in ['02','uk-ie','dk','es','it','arap','arap-olculu']:
        prefix=base+'ev-sohbet-'+batch+'/'
        paths=[p for p in contents if p.startswith(prefix)]
        primary=[p for p in paths if re.search(r'/ev-sohbet-[^/]+-\d+\.json$',p)]
        if batch=='arap':
            take('ev-sohbet-arap',paths,primary,'ev-plani','inceleme-bekliyor','Arabic intake drafts only; no measured plan or solver placement delivered.','AURA original authored text',['AURA fictional intake; no customer images'],['Missing measured geometry and verified two-storey source','Majlis support pending','Not the completed 12-layout EV-ARAP-01 delivery','Native/designer review pending'])
        else:
            take('ev-sohbet-'+batch,paths,primary,'yerlesim','inceleme-bekliyor','Hand-authored home conversations; adapted CH reference geometry, not local building certification.','CC-BY-4.0 geometry; AURA-authored dialogue',['Swiss Dwellings 3.0.0; doi:10.5281/zenodo.7788422','AURA authored dialogue'],['Designer/native-language approval pending','Source exceptions retained; strict geometry varies','Motor acceptance does not certify source geometry or turn-by-turn targets','Native style review pending'])
    for id,status in [('ev-plan-eu-00c','inceleme-bekliyor'),('ev-plan-reel-00d','inceleme-bekliyor'),('ev-plan-veriseti','superseded'),('ev-plan-veriseti-v2','superseded')]:
        paths=[p for p in contents if p.startswith(base+id+'/')]
        primary=[p for p in paths if '/data/' in p and p.endswith('.jsonl')] if id.endswith('00c') else [p for p in paths if p.endswith('/program-sample.jsonl')] if id.endswith('00d') else [p for p in paths if p.endswith('/sample-chat.jsonl')] if id=='ev-plan-veriseti' else [p for p in paths if p.endswith('/review-data.json')]
        real=id.endswith(('00c','00d'))
        take(id,paths,primary,'ev-plani',status,'Tracked sample only; manifest declarations for larger external corpora are not counted as tracked rows.','CC-BY-4.0 geometry; AURA transformation' if real else 'AURA original synthetic research',['Swiss Dwellings 3.0.0'] if real else ['AURA synthetic prototype'],['Incomplete/raw external corpus not present in Git','Human approval limited to named review packet; not blanket training approval','No multi-storey source proof'] if real else ['Superseded by licensed real references','Synthetic slicing geometry not accepted training target'])
    paths=[p for p in contents if p.startswith(base+'sohbet-ornekleri/')]
    take('sohbet-ornekleri',paths,[p for p in paths if p.endswith('/sohbet-001.json')],'yerlesim','inceleme-bekliyor','Claude authored example; distinct from Codex conversation batches.','AURA original',['AURA'],['Independent motor and style audit pending'])
    for batch in ['pilot-v1','geometry-v1','studio-v1','yerel-02']:
        prefix='knowledge/ai-egitim/qwen-pilot-01/'+batch+'/'
        paths=[p for p in contents if p.startswith(prefix)]
        primary=[p for p in paths if re.search(r'/(train|dev|test|reviewed-40)\.jsonl$',p)]
        take('qwen-local-'+batch,paths,primary,'mobilya','superseded','Recovered #69 historical evidence; source-bound approval is not current engine approval.','AURA original',['#69; RECOVERY.json'],['Stale engine/prompt contract','Pilot schema robustness 0/40 under changed format; not deployment ready','Geometry exercise DSL is not the AURA studio' if batch=='geometry-v1' else 'Current motor replay required'])
    f='knowledge/ev-projesi/veri/perde-diyaloglar.jsonl'
    take('perde-diyaloglar',[f],[f],'tekstil','inceleme-bekliyor','Hand-authored fictional curtain review snippets.','AURA authored text; references keep own rights',['perde-kaynaklar.json'],['No machine operation targets','Native-language and designer review pending'])
    f='knowledge/style-training/candidates.jsonl'
    take('style-training',[f],[f],'genel-sohbet','inceleme-bekliyor','Editorial style preference candidates.',None,['sourceType and referenceGuide per row'],['52 is historical expectation, actual count measured here','Third-party guide attribution/rights need item review'])
    paths=[p for p in contents if p.startswith('knowledge/aura-ses/')]
    take('metin-denemeleri',paths,[p for p in paths if p.endswith('/metinler.jsonl')],'genel-sohbet','inceleme-bekliyor','Founder-voice text trials and supporting design cards.','AURA authored',['AURA'],['Old design normalization fails current text-eval M01; rebase/review required'])
    paths=[p for p in contents if p.startswith('tests/ai-eval/') and not p.startswith('tests/ai-eval/aura-sinav-01/')]
    primary=[p for p in paths if re.search(r'/sinav-01(?:b)?-(?:dev|test)\.jsonl$',p)]
    take('tests-ai-eval',paths,primary,'mobilya','yalnizca-arastirma','Frozen assessment only; never export to train/dev/test training partitions.','AURA authored',['SINAV-01 and SINAV-01B freeze manifests'],['Expert approval scope is per record','Must stay isolated from all training exports'])
    paths=[p for p in contents if p.startswith('tests/ai-eval/aura-sinav-01/')]
    take('aura-sinav-01',paths,[p for p in paths if p=='tests/ai-eval/aura-sinav-01/gorevler.jsonl'],'genel-sohbet','yalnizca-arastirma','120 held-out tasks; archived pre-model drafts are support, never additional task counts.','AURA original authored tasks',['Independent AURA original exam fixtures'],['Expert/native review pending','No model run','Non-furniture live chat bridge pending','Never export to training partitions'])
    for group,prefixes in [('perde-arastirma',('perde',)),('tekstil-02',('tekstil-02',)),('hali-arastirma',('hali',))]:
        paths=[p for p in contents if p not in used and p.startswith('knowledge/ev-projesi/veri/') and Path(p).name.startswith(prefixes)]
        take(group,paths,[],'tekstil','yalnizca-arastirma','Source-backed material/measurement research; not executable dialogue labels.',None,['Attribution and source IDs inside each research file'],['Source text/image rights differ from AURA-authored summaries','No designer-approved operation targets counted'])
    # All remaining structured knowledge is inventoried, not silently treated as training examples.
    groups=collections.defaultdict(list)
    for p in contents:
        if p not in used:
            if '/archive/' in p:group='archive-superseded'
            elif '/qwen-pilot-01/' in p:group='qwen-pilot-support'
            elif re.search(r'/ev-sohbet-[^/]+-ornekler/',p):group='conversation-viewer-derivatives'
            else:group='/'.join(p.split('/')[:3])
            groups[group].append(p)
    for group,paths in sorted(groups.items()):
        if group=='archive-superseded':status='superseded'
        else:status='yalnizca-arastirma'
        layer='tekstil' if all(any(x in p for x in ['perde','tekstil','hali']) for p in paths) else 'ev-plani' if 'ev-projesi' in group else 'genel-sohbet'
        take('support-'+re.sub(r'[^a-z0-9]+','-',group.lower()).strip('-'),paths,[],layer,status,'Structured research/support/derived artifacts; primary candidate counts not inferred.',None,[],['Per-file reuse rights/semantic role must be verified before training'])
    take('yerlesim-veri-procthor',[],[],'yerlesim','inceleme-bekliyor','Expected claude/yerlesim-veri source absent from this tracked tree.',None,['ProcTHOR; Apache-2.0 requested in work order, actual release and attribution not verified'],['Missing source files; record count null','Do not count 12827/~5000 planning figures as delivered records'])
    assert used==set(contents)
    status=collections.defaultdict(lambda:dict(datasets=0,records=0,unknown_count_datasets=0));licenses=collections.Counter();matrix=collections.Counter()
    for key in ['egitim-adayi','inceleme-bekliyor','superseded','yalnizca-arastirma']:status[key]
    for e in entries:
        status[e['status']]['datasets']+=1
        if e['record_count'] is None:status[e['status']]['unknown_count_datasets']+=1
        else:status[e['status']]['records']+=e['record_count']
        licenses[e['license'] or 'unknown']+=1
        for row in e['coverage']:matrix[(row['language'],row['country'],row['layer'])]+=row['records']
    return dict(version='aura-catalog/1',date='2026-10-21',snapshot_base=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),hash_policy='Exact tracked Git blob bytes; checkout CRLF does not change catalogue hashes. Aggregate hash includes file paths, sizes and primary/support roles.',counts_policy='Counts cover tracked primary rows only; sets may overlap, so totals are NOT unique projects. Null is unknown/not applicable, never zero.',datasets=entries,summary=dict(status=dict(status),licenses=dict(licenses),language_country_layer=[dict(language=k[0],country=k[1],layer=k[2],records=v) for k,v in sorted(matrix.items(),key=lambda x:str(x[0]))]),coverage=dict(structured_files=len(contents),inventoried_files=len(used),unassigned=[]))

def render(doc):
    esc=lambda x:html.escape(str(x if x is not None else 'bilinmiyor'))
    def table(head,rows):return '<table><thead><tr>'+''.join('<th>'+esc(h)+'</th>' for h in head)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+str(c)+'</td>' for c in row)+'</tr>' for row in rows)+'</tbody></table>'
    body='<h1>AURA veri kataloğu</h1><p>21 Ekim 2026 · Eğitim başlamadı. Sayılar Git’teki birincil kayıtlardır; türevler tekrar sayılmaz. Veri setleri arası tekrarlar olabilir; toplam benzersiz proje sayısı değildir. Bilinmeyen lisans/ölçü kabul edilmiş sayılmaz.</p>'
    body+='<h2>Durum</h2>'+table(['Durum','Küme','Birincil kayıt','Sayısı bilinmeyen küme'],[[esc(k),v['datasets'],v['records'],v['unknown_count_datasets']] for k,v in doc['summary']['status'].items()])
    body+='<h2>Dil × ülke × katman</h2>'+table(['Dil','Ülke','Katman','Kayıt'],[[esc(r[k]) for k in ['language','country','layer','records']] for r in doc['summary']['language_country_layer']])
    body+='<h2>Lisans dağılımı (küme sayısı)</h2>'+table(['Lisans','Küme'],[[esc(k),v] for k,v in doc['summary']['licenses'].items()])
    body+='<h2>Kümeler ve açık kusurlar</h2>'
    for e in doc['datasets']:
        body+='<details><summary>'+esc(e['id'])+' · '+esc(e['status'])+' · '+esc(e['record_count'])+' kayıt</summary><p>'+esc(e['summary'])+'</p><p>Lisans: '+esc(e['license'])+'</p><p>SHA256: <code>'+esc(e['sha256'])+'</code></p><ul>'+''.join('<li>'+esc(d)+'</li>' for d in e['known_defects'])+'</ul>'+table(['Dosya','Rol','SHA256'],[['<a href="../../'+esc(f['path'])+'">'+esc(f['path'])+'</a>',esc(f['role']),'<code>'+f['sha256']+'</code>'] for f in e['files']])+'</details>'
    return '<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AURA veri kataloğu</title><style>body{font:16px/1.55 system-ui;max-width:1200px;margin:32px auto;padding:0 18px;color:#24302b}table{border-collapse:collapse;display:block;overflow:auto;margin:16px 0}td,th{padding:8px;border:1px solid #c8d1cb;text-align:left}th{background:#edf1eb}details{padding:12px 0;border-bottom:1px solid #bbc5bd}summary{cursor:pointer;font-weight:bold}code{font-size:12px;overflow-wrap:anywhere}h2{margin-top:32px}</style>'+body+'</html>'

if __name__=='__main__':
    doc=build();(DEST/'KATALOG.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n');(DEST/'KATALOG.html').write_text(render(doc),encoding='utf8',newline='\n');print(json.dumps({'datasets':len(doc['datasets']),'coverage':doc['coverage'],'summary':doc['summary']['status']},ensure_ascii=False))
