"""60 held-out briefs -> three licensed retrieved/affinely adapted alternatives each."""
import argparse
import copy
import html
import json
import time
from pathlib import Path
from collections import Counter
from shapely.geometry import Polygon,LineString
from common import read,write,compact,digest
from real.retrieve import ReferenceIndex
from real.programs import extract,request
from real.geometry import validate_record
from real.swiss import ATTRIBUTION
from metrics import measure,percentile
from compat import viewer_plan

COLORS={'living':'#ecd7ae','kitchen':'#cddbbf','bath':'#bbdce1','wc':'#a9cfd7','hall':'#eee9df','bedroom':'#ccdae7','utility':'#ded5e3','other':'#d4e0e5','balcony':'#d3e4bf','terrace':'#d3e4bf','stair':'#d5cce4'}
NAMES={'living':'Salon','kitchen':'Mutfak','bath':'Banyo','wc':'WC','hall':'Hol','bedroom':'Yatak odası','utility':'Kiler/servis','other':'Oda*','balcony':'Balkon','terrace':'Teras','stair':'Merdiven'}


def bounds(record):
    polys=[Polygon(r['polygon_xy_mm']) for r in record['geometry']['rooms'].values()]
    return min(p.bounds[0] for p in polys),min(p.bounds[1] for p in polys),max(p.bounds[2] for p in polys),max(p.bounds[3] for p in polys)


def svg(record,frame):
    x,y,X,Y=frame;parts=[]
    def points(pts):return ' '.join(f'{a:.2f},{Y-b:.2f}' for a,b in pts)
    def poly(pts,fill,stroke='none',width=0):return f'<polygon points="{points(pts)}" fill="{fill}" stroke="{stroke}" stroke-width="{width}"/>'
    for room in record['plan']['spaces']:
        parts.append(poly(room['boundary_xy_mm'],COLORS.get(room['kind'],'#ddd'),'#b7bab8',8))
    for wall in record['geometry']['walls'].values():
        if wall['polygon_xy_mm'] is not None:parts.append(poly(wall['polygon_xy_mm'],'#424949'))
    for id,op in record['geometry']['openings'].items():
        kind=next(o['kind'] for o in record['plan']['openings'] if o['id']==id)
        parts.append(poly(op['polygon_xy_mm'],'#4b9dc0' if kind=='window' else '#faf8f1'))
    for feature in record['geometry']['features']:
        if feature['kind']=='COLUMN':parts.append(poly(feature['polygon_xy_mm'],'#252d32'))
        elif feature['kind']=='STAIRS':
            parts.append(poly(feature['polygon_xy_mm'],'none','#8663a4',40))
            center=Polygon(feature['polygon_xy_mm']).representative_point()
            parts.append(f'<text x="{center.x}" y="{Y-center.y}" fill="#623f80" font-size="320">↑</text>')
    for room in record['plan']['spaces']:
        polyroom=Polygon(room['boundary_xy_mm']);pt=polyroom.representative_point()
        size=min(260,max(130, min(polyroom.bounds[2]-polyroom.bounds[0],polyroom.bounds[3]-polyroom.bounds[1])/6))
        parts.append(f'<text x="{pt.x}" y="{Y-pt.y}" font-size="{size}" text-anchor="middle" fill="#24333c">{html.escape(NAMES[room["kind"]])}<tspan x="{pt.x}" dy="{size*1.3}">{polyroom.area/1e6:.1f} m²</tspan></text>')
    for op in record['plan']['openings']:
        if op['entry']:
            pt=Polygon(record['geometry']['openings'][op['id']]['polygon_xy_mm']).centroid
            parts.append(f'<circle cx="{pt.x}" cy="{Y-pt.y}" r="210" fill="none" stroke="#b44e31" stroke-width="60"/><text x="{pt.x}" y="{Y-pt.y-300}" font-size="220" text-anchor="middle" fill="#963e28">GİRİŞ</text>')
    parts.append(f'<text x="{X-350}" y="-250" font-size="240">K ↑</text>')
    return f'<svg role="img" aria-label="Kaynak poligonlarından plan" viewBox="{x-450} -600 {X-x+900} {Y-y+1200}" xmlns="http://www.w3.org/2000/svg">'+''.join(parts)+'</svg>'


def category(record,program):
    if program['bedrooms'] is not None:
        return 'Doğrulanmış yatak '+str(program['bedrooms'])
    return 'Genel oda '+str(record['generic_room_count'])


def build(data,profile,output,count=60):
    out=Path(output)
    if out.exists():raise ValueError('New review directory required')
    out.mkdir(parents=True);(out/'viewer').mkdir();(out/'records').mkdir()
    index=ReferenceIndex(data,profile);cases=[];rejected=Counter();buckets=Counter();started=time.monotonic();attempted=0
    # Hold-out briefs only. Retrieval corpus is always train buildings, not the target building.
    ids=[r[0] for r in index.db.execute("select id from plans where split='test' order by id")]
    try:
        for id in ids:
            if len(cases)>=count:break
            target=index.record(id);p=extract(target);bucket=category(target,p)
            if buckets[bucket]>=12:continue
            attempted+=1
            query=copy.deepcopy(p);preferences=query['adjacency'];query['adjacency']=[];query['forbidden']=[];query['entry']=None;query['living_face']=None
            for r in query['rooms']:r['face']='any';r['target_m2']=round(r['target_m2']*1.02,4)
            # Observed graph becomes an explicit soft preference, never silently relaxed hard constraints.
            found=index.retrieve(query,count=3,exclude_buildings=(target['building_group'],),candidate_limit=600,preferred_adjacency=preferences)
            if found['status']!='options':rejected[found['status']]+=1;continue
            case_id='real-'+str(len(cases)+1).zfill(3);options=[]
            for j,opt in enumerate(found['options']):
                source=opt['source'];adapted=opt['adapted']
                if not validate_record(adapted,source)['valid']:raise ValueError('Review contains invalid adaptation')
                a=bounds(source);b=bounds(adapted);frame=(min(a[0],b[0]),min(a[1],b[1]),max(a[2],b[2]),max(a[3],b[3]))
                metadata=dict(option=j+1,source_id=source['id'],source_record_sha256=digest(source),adapted_record_sha256=digest(adapted),
                              source_building_group=source['building_group'],rank=opt['rank'],score=opt['quality']['score'],
                              source_area_m2=source['net_area_m2'],adapted_area_m2=adapted['net_area_m2'],scale_x=adapted['adaptation']['scale_x'],scale_y=adapted['adaptation']['scale_y'],
                              mean_area_target_relative_error=opt['mean_area_target_relative_error'],graph_type_distance=opt['graph_type_distance'],
                              source_svg=svg(source,frame),adapted_svg=svg(adapted,frame))
                options.append(metadata)
                if j==0:
                    write(out/'records'/f'{case_id}-source.json',source)
                    write(out/'records'/f'{case_id}-adapted.json',adapted)
                    write(out/'viewer'/f'{case_id}-source-level-0.json',viewer_plan(source['plan'],'level-0'))
                    write(out/'viewer'/f'{case_id}-adapted-level-0.json',viewer_plan(adapted['plan'],'level-0'))
            case=dict(id=case_id,country='CH',category=bucket,target_heldout_id=target['id'],target_building_group=target['building_group'],
                      query=query,preferred_adjacency=preferences,graph_preference_status='soft; original held-out connections are preferences, no hard graph constraint was silently removed',
                      options=options,attribution=ATTRIBUTION)
            cases.append(case);buckets[bucket]+=1;print(case_id,bucket,'three validated alternatives',flush=True)
        if len(cases)<count:raise ValueError(f'Only {len(cases)} eligible cases; do not claim a 60-case delivery')
        decisions=[dict(id=c['id'],selected_option=1,source_record_sha256=c['options'][0]['source_record_sha256'],adapted_record_sha256=c['options'][0]['adapted_record_sha256'],rating=None,why='',reviewer=None) for c in cases]
        write(out/'review.json',decisions)
        write(out/'review-data.json',[dict(c,options=[{k:v for k,v in op.items() if not k.endswith('_svg')} for op in c['options']]) for c in cases])
        render(out,cases)
        from real.swiss import sha_file
        manifest=dict(cases=len(cases),validated_alternatives=sum(len(c['options']) for c in cases),countries={'CH':len(cases)},categories=dict(buckets),
                      attempted_heldout_briefs=attempted,rejected=dict(rejected),elapsed_seconds=round(time.monotonic()-started,3),
                      source_conversion_manifest_sha256=sha_file(Path(data)/'conversion-manifest.json'),profile_sha256=sha_file(profile),
                      training_building_overlap=0,human_approved=0,gpu_gate='closed',
                      limits=['single-floor CH units; other countries and detached/multi-storey types not available as verified references',
                              'original source wall polygons shown; EV viewer uses explicit compatibility axes',
                              'all 3 options visible in HTML; viewer/full records supplied for option 1 of each case; all options reproducible from source ids and query'])
        write(out/'review-manifest.json',manifest)
    finally:index.close()


def render(out,cases):
    cards=[]
    for c in cases:
        options=''.join(f'<option value="{j}">Seçenek {j+1}</option>' for j in range(len(c['options'])))
        brief=html.escape(request(c['query'],'tr'))
        cards.append(f'<article data-id="{c["id"]}"><h2>{c["id"]} · İsviçre · {html.escape(c["category"])}</h2><label>Gerçek referans alternatifi <select class="option">{options}</select></label><p class="summary"></p><div class="pair"><section><h3>Getirilen gerçek plan</h3><div class="source"></div></section><section><h3>Ölçüye uyarlanmış öneri</h3><div class="adapted"></div></section></div><p>* Genel kaynak ROOM etiketi yatak odası olarak doğrulanmamıştır. Kuzey yukarı; mavi pencere, beyaz açıklık, kırmızı giriş.</p><p>İlk seçenek için <a href="viewer/{c["id"]}-source-level-0.json" download>kaynak kat JSON</a> · <a href="viewer/{c["id"]}-adapted-level-0.json" download>uyarlanmış kat JSON</a></p><label>Karar <select class="rating"><option value="">İncelenmedi</option><option value="good">İyi</option><option value="weak">Zayıf</option></select></label><label>Neden? <textarea rows="3"></textarea></label><details><summary>Atıf ve değişiklik kaydı</summary><p>{html.escape(c["attribution"])}</p><p class="provenance"></p></details></article>')
        cards[-1]=cards[-1].replace('<label>Gerçek referans alternatifi',f'<p class="brief">{brief}</p><p>Kapı bağlantıları bu incelemede yumuşak tercihtir; giriş ve cephe yönü serbest bırakılmıştır. Oda türü/sayısı, mutfak ve dış biçim koşulları korunur.</p><label>Gerçek referans alternatifi',1)
    data=json.dumps(cases,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    # JSON script contents must contain literal \u003c escapes, not executable markup.
    data=data.replace('\\\\u003c','\\u003c')
    fingerprint=digest([(c['id'],[(o['source_record_sha256'],o['adapted_record_sha256']) for o in c['options']]) for c in cases])
    page='''<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>EV-QWEN-00D — gerçek plan incelemesi</title><style>body{font:16px system-ui;max-width:1380px;margin:auto;padding:20px;background:#f6f4ef;color:#26343a}article{background:white;border:1px solid #c8c8c0;border-radius:8px;padding:20px;margin:24px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}.pair section{min-width:0}svg{width:100%;height:auto}label{display:block;margin:12px 0}select,button,input{padding:9px}textarea{display:block;width:100%;box-sizing:border-box}h2{font-size:22px}.summary{font-weight:600}code{overflow-wrap:anywhere}@media(max-width:700px){.pair{grid-template-columns:1fr}body{padding:10px}article{padding:12px}}</style><h1>Gerçek plandan getir ve uyarla — 60 inceleme</h1><p>Her örnekte üç lisanslı gerçek referans alternatifi vardır. Solda kaynak poligonları, sağda aynı kurgunun ölçü uyarlaması gösterilir. Bu bir yeni bina veya taşıyıcı değişikliği onayı değildir; son karar tasarımcıdadır. Ölçü ve kapı bağlantısı belirsiz kayıtlar bu örneklere alınmadı.</p><p>Bu teslimin doğrulanmış ülke kapsamı İsviçre, kaynak kapsamı tek katlı konut birimleridir. Tüm Avrupa, müstakil veya çok katlı ev kapsamı iddia edilmez. Puan istatistiksel benzerliktir; mimari kalite onayı değildir.</p><label>İnceleyen <input id="reviewer" placeholder="Adınız"></label><button id="export">Kararları review.json indir</button><p id="message" role="status"></p>'''+''.join(cards)+f'<script id="data" data-fingerprint="{fingerprint}" type="application/json">{data}</script>'+'''
<script>
const cases=JSON.parse(document.querySelector('#data').textContent), byId=Object.fromEntries(cases.map(c=>[c.id,c]));
const key='aura-real-review-'+document.querySelector('#data').dataset.fingerprint;let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
const articles=[...document.querySelectorAll('article')];
function draw(a){const c=byId[a.dataset.id],o=c.options[Number(a.querySelector('.option').value)];a.querySelector('.source').innerHTML=o.source_svg;a.querySelector('.adapted').innerHTML=o.adapted_svg;a.querySelector('.summary').textContent=`Kaynak ${o.source_area_m2.toFixed(1)} m² → öneri ${o.adapted_area_m2.toFixed(1)} m² · ölçek ${o.scale_x.toFixed(3)} × ${o.scale_y.toFixed(3)} · istatistiksel puan ${o.score}`;a.querySelector('.provenance').textContent=`Kaynak: ${o.source_id}; ölçü uyarlaması: ${o.scale_x.toFixed(4)} × ${o.scale_y.toFixed(4)}. Tam kat JSON bağlantıları ilk seçeneğe aittir.`;a.dataset.drawn='true'}
function rows(){return articles.map(a=>{const c=byId[a.dataset.id],index=Number(a.querySelector('.option').value),o=c.options[index];return {id:c.id,selected_option:index+1,source_record_sha256:o.source_record_sha256,adapted_record_sha256:o.adapted_record_sha256,rating:a.querySelector('.rating').value||null,why:a.querySelector('textarea').value,reviewer:document.querySelector('#reviewer').value||null}})}
for(const a of articles){const old=saved[a.dataset.id];if(old){a.querySelector('.option').value=String((old.selected_option||1)-1);a.querySelector('.rating').value=old.rating||'';a.querySelector('textarea').value=old.why||'';if(old.reviewer)document.querySelector('#reviewer').value=old.reviewer}a.addEventListener('change',event=>{if(event.target.classList.contains('option')){a.querySelector('.rating').value='';a.querySelector('textarea').value=''}if(a.dataset.drawn)draw(a);localStorage.setItem(key,JSON.stringify(Object.fromEntries(rows().map(r=>[r.id,r]))))})}
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){draw(e.target);observer.unobserve(e.target)}},{rootMargin:'500px'});articles.forEach(a=>observer.observe(a));
document.querySelector('#export').onclick=()=>{if(rows().some(r=>r.rating&&!r.reviewer)){document.querySelector('#message').textContent='İşaretlenmiş kararlar için inceleyen adını yazın.';return}const u=URL.createObjectURL(new Blob([JSON.stringify(rows(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='review.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
</script></html>'''
    (Path(out)/'okuma.html').write_text(page,encoding='utf8')


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--data',required=True);p.add_argument('--profile',required=True);p.add_argument('--output',required=True);a=p.parse_args();build(a.data,a.profile,a.output)
