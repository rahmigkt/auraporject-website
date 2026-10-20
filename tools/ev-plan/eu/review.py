"""Country-labelled *target proposals*, never a fabricated national floorplan corpus."""
import argparse,copy,json,html,time
from pathlib import Path
from collections import Counter
from common import ROOT,DATA,read,write,digest
from real.retrieve import ReferenceIndex
from real.review import svg,bounds,NAMES
from real.geometry import validate_record
from real.swiss import ATTRIBUTION,sha_file
from eu.contract import extend
from eu.planner import plan
from eu.data import REGION
from eu.language import ROOMS
from compat import viewer_plan

def localized_svg(record,frame,language):
    import xml.etree.ElementTree as ET
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    element=ET.fromstring(svg(record,frame))
    kinds=['living','kitchen','bedroom','bath','wc','hall','utility','other','balcony','terrace','stair']
    translations=dict(zip(kinds,ROOMS[language]));mapping={NAMES[k]:translations[k] for k in kinds}
    for text in element.iter():
        if text.text in mapping:text.text=mapping[text.text]
        if text.text=='K ↑':text.text='N ↑'
        if text.text=='GİRİŞ':text.text={'en':'ENTRY','tr':'GİRİŞ','de':'EINGANG','fr':'ENTRÉE','nl':'INGANG','da':'INDGANG','es':'ENTRADA','it':'INGRESSO'}[language]
    return ET.tostring(element,encoding='unicode')

def build(data,profile,output):
    out=Path(output)
    if out.exists():raise ValueError('New review directory required')
    out.mkdir(parents=True);(out/'records').mkdir();(out/'viewer').mkdir()
    profiles=read(DATA/'ulke-profilleri.eu.json')['countries'];old=read(ROOT/'knowledge/ai-egitim/veri/ev-plan-reel-00d/review/review-data.json')
    index=ReferenceIndex(data,profile);cases=[];used=set();started=time.monotonic();failures=Counter()
    try:
        for country,cp in profiles.items():
            regions=REGION[country] if country=='BE' else [REGION[country][0]]
            language=cp['languages'][0]
            for region in regions:
                if region in ('BE-BRU','BE-WAL'):language='fr'
                supported=[t for t in cp['typologies'] if t['geometry_support']=='licensed_single_floor_reference_proposal']
                for k in range(4):
                    typ=supported[k%len(supported)]
                    # Prefer independent held-out source briefs and enforce literal T/bilocale counts.
                    pool=[c for c in old if c['id'] not in used]
                    if country in ('FR','IT'):
                        exact=[c for c in pool if c['query']['bedrooms']==typ['bedrooms_proposal']]
                        if not exact:exact=[c for c in old if c['query']['bedrooms']==typ['bedrooms_proposal']]
                        pool=exact
                    found=None
                    for target in pool:
                        program=extend(target['query'],country,region,typ['id'])
                        answer=plan(index,program,language,location_confirmed=True,allow_cross_country_reference=True)
                        if answer['status']=='options':found=(target,program,answer);break
                        failures[answer.get('reason',answer['status'])]+=1
                    if found is None:raise ValueError('No four real-reference proposals for '+country+'/'+str(region))
                    target,program,answer=found;used.add(target['id']);case_id='eu-'+str(len(cases)+1).zfill(3);options=[]
                    for j,option in enumerate(answer['options']):
                        source=option['source'];proposal=option['adapted'];a=bounds(source);b=bounds(proposal)
                        frame=(min(a[0],b[0]),min(a[1],b[1]),max(a[2],b[2]),max(a[3],b[3]))
                        if not validate_record(proposal,source)['valid']:raise ValueError('Invalid country proposal')
                        options.append(dict(source_id=source['id'],source_hash=digest(source),proposal_hash=digest(proposal),
                            source_svg=localized_svg(source,frame,language),proposal_svg=localized_svg(proposal,frame,language),
                            source_area_m2=source['net_area_m2'],proposal_area_m2=proposal['net_area_m2'],score=option['quality']['score']))
                        if j==0:
                            write(out/'records'/f'{case_id}-source.json',source);write(out/'records'/f'{case_id}-proposal.json',proposal)
                            write(out/'records'/f'{case_id}-program.json',program)
                            write(out/'viewer'/f'{case_id}-source-level-0.json',viewer_plan(source['plan'],'level-0'))
                            write(out/'viewer'/f'{case_id}-proposal-level-0.json',viewer_plan(proposal['plan'],'level-0'))
                    cases.append(dict(id=case_id,target_country=country,target_region=region,language=language,requested_type=typ['local_name'],
                        requested_type_features_verified=False,source_country='CH',original_heldout_query=target['id'],program=program,options=options,
                        rule_screen=answer['rule_screen'],attribution=ATTRIBUTION,human_approved=False))
                    print(case_id,country,region,'three proposals',flush=True)
    finally:index.close()
    render(out,cases)
    write(out/'cases.json',[dict(c,options=[{k:v for k,v in o.items() if not k.endswith('_svg')} for o in c['options']]) for c in cases])
    write(out/'review.json',[dict(id=c['id'],option=None,rating=None,why='',reviewer=None) for c in cases])
    report=dict(cases=len(cases),countries=dict(Counter(c['target_country'] for c in cases)),target_regions=dict(Counter(c['target_region'] or c['target_country'] for c in cases)),
        source_countries={'CH':len(cases)},alternatives=sum(len(c['options']) for c in cases),distinct_heldout_briefs=len({c['original_heldout_query'] for c in cases}),
        failures=dict(failures),elapsed_seconds=round(time.monotonic()-started,3),source_conversion_hash=sha_file(Path(data)/'conversion-manifest.json'),
        human_approved=0,training_started=False,gpu_gate='closed',limitations=['target-country examples, not measured national corpus','local type features unverified','multi-storey and special geometry require a verified reference; no fabricated output'])
    write(out/'manifest.json',report);return report

def render(out,cases):
    cards=[]
    for c in cases:
        cards.append(f'<article data-id="{c["id"]}" data-country="{c["target_country"]}"><h2>{c["id"]} · Hedef {c["target_country"]} / {html.escape(c["target_region"] or "bölge teyidi gerekli")}</h2><p>Dil: {c["language"]} · İstenen tip: {html.escape(c["requested_type"])}</p><p><b>Kaynak ülke CH. Bu sentetik uyarlama başka ülkede ölçülmüş plan değildir. Yerel tip özellikleri ve mevzuat uygunluğu doğrulanmadı.</b></p><label>Alternatif <select class="option"><option value="0">1</option><option value="1">2</option><option value="2">3</option></select></label><p class="summary"></p><div class="pair"><section><h3>Lisanslı gerçek referans (CH)</h3><div class="source"></div></section><section><h3>Hedef ülke için ön öneri</h3><div class="proposal"></div></section></div><p><a href="records/{c["id"]}-proposal.json" download>Tam öneri JSON</a> · <a href="records/{c["id"]}-program.json" download>Ülke programı</a> · <a href="viewer/{c["id"]}-proposal-level-0.json" download>Kat JSON</a> (ilk seçenek)</p><details><summary>Kural kapsamı ve kaynak</summary><pre>{html.escape(json.dumps(c["rule_screen"],ensure_ascii=False,indent=2))}</pre><p>{html.escape(ATTRIBUTION)}</p></details><label>Karar <select class="rating"><option value="">İncelenmedi</option><option value="good">İyi</option><option value="weak">Zayıf</option></select></label><label>Neden <textarea></textarea></label></article>')
    data=json.dumps(cases,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    options=''.join(f'<option>{country}</option>' for country in sorted({c['target_country'] for c in cases}))
    page='''<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>EV-QWEN-00C · ülke bağlamı</title><style>body{font:16px system-ui;background:#f6f4ef;color:#26343a;max-width:1380px;margin:auto;padding:20px}article{background:white;border:1px solid #bbb;border-radius:8px;margin:24px 0;padding:20px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}.pair section{min-width:0}svg{width:100%;height:auto}label{display:block;margin:12px 0}textarea{display:block;width:100%;box-sizing:border-box}select,input,button{padding:9px}pre{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:700px){.pair{grid-template-columns:1fr}body{padding:10px}article{padding:12px}}</style><h1>Avrupa ülke bağlamları — gerçek referanstan ön öneri</h1><p>Her hedef ülke için en az dört örnek. Belçika'nın üç bölgesi ayrı. Son karar tasarımcıda; kural taraması bir ruhsat veya uygunluk belgesi değildir. Çok katlı, sıra ev, bodrum/çatı/veranda geometrisi için desteklenmeyen durumda araç netleştirme ister.</p><label>Hedef ülke <select id="country"><option value="">Tümü</option>'''+options+'''</select></label><label>İnceleyen <input id="reviewer"></label><button id="export">Kararları indir</button><p id="message" role="status"></p>'''+''.join(cards)+f'<script id="data" type="application/json">{data}</script>'+'''
<script>
const cases=JSON.parse(document.querySelector('#data').textContent), byId=Object.fromEntries(cases.map(c=>[c.id,c]));
const key='aura-eu-review-'''+digest([(c['id'],[o['proposal_hash'] for o in c['options']]) for c in cases])+'''',articles=[...document.querySelectorAll('article')];let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
function draw(a){const c=byId[a.dataset.id],o=c.options[+a.querySelector('.option').value];a.querySelector('.source').innerHTML=o.source_svg;a.querySelector('.proposal').innerHTML=o.proposal_svg;a.querySelector('.summary').textContent=`${o.source_area_m2.toFixed(1)} → ${o.proposal_area_m2.toFixed(1)} m² · CH istatistik puanı ${o.score}; hedef ülke uygunluk puanı değildir`;a.dataset.drawn='yes'}
function rows(){return articles.map(a=>{const c=byId[a.dataset.id],i=+a.querySelector('.option').value,o=c.options[i];return {id:c.id,target_country:c.target_country,option:i+1,source_hash:o.source_hash,proposal_hash:o.proposal_hash,rating:a.querySelector('.rating').value||null,why:a.querySelector('textarea').value,reviewer:document.querySelector('#reviewer').value||null}})}
for(const a of articles){const old=saved[a.dataset.id];if(old){a.querySelector('.option').value=String((old.option||1)-1);a.querySelector('.rating').value=old.rating||'';a.querySelector('textarea').value=old.why||'';if(old.reviewer)document.querySelector('#reviewer').value=old.reviewer}a.addEventListener('change',e=>{if(e.target.classList.contains('option')){a.querySelector('.rating').value='';a.querySelector('textarea').value=''}if(a.dataset.drawn)draw(a);localStorage.setItem(key,JSON.stringify(Object.fromEntries(rows().map(r=>[r.id,r]))))})}
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){draw(e.target);observer.unobserve(e.target)}},{rootMargin:'500px'});articles.forEach(a=>observer.observe(a));
document.querySelector('#country').onchange=e=>{for(const a of articles)a.hidden=Boolean(e.target.value&&a.dataset.country!==e.target.value)};
document.querySelector('#export').onclick=()=>{if(rows().some(r=>r.rating&&!r.reviewer)){document.querySelector('#message').textContent='İnceleyen adını yazın.';return}const u=URL.createObjectURL(new Blob([JSON.stringify(rows(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='eu-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
</script></html>'''
    (Path(out)/'okuma.html').write_text(page,encoding='utf8')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--data');p.add_argument('--profile');p.add_argument('--output',required=True);p.add_argument('--refresh-html',action='store_true');a=p.parse_args()
    if a.refresh_html:
        import re,xml.etree.ElementTree as ET
        ET.register_namespace('', 'http://www.w3.org/2000/svg')
        page=(Path(a.output)/'okuma.html').read_text(encoding='utf8')
        cases=json.loads(re.search(r'<script id="data" type="application/json">(.*?)</script>',page,re.S).group(1))
        for case in cases:
            for option in case['options']:
                for key in ('source_svg','proposal_svg'):option[key]=ET.tostring(ET.fromstring(option[key]),encoding='unicode')
        render(Path(a.output),cases)
    else:
        if not a.data or not a.profile:p.error('--data and --profile required for generation')
        print(json.dumps(build(a.data,a.profile,a.output)))
