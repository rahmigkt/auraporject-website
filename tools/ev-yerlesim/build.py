"""Reproducible evidence builder: authored dialogue + studio sizes + independent solver."""
import argparse,json,subprocess,copy,time,html
from pathlib import Path
from jsonschema import Draft202012Validator
from shapely.geometry import Polygon
from scenarios import CASES,HEIGHTS
from house import house,canonical_items,viewer
from placement import solve,validate,digest,RULES,footprint
from adapter import room_from_ev
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'knowledge/ai-egitim/veri/sohbet-ornekleri';HERE=Path(__file__).parent
def write(p,v):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def intent(case,room):return dict(route_mm=900 if case.get('elder') else 600,sofa_not_back_to_window=True,desk_side_light=True,screen_height_mm=700,screen_resolution='4k',intent_only=True,requires_designer_review=True)
def prepare(case,node,cache):
    plan,rooms,choices=house(case);inp=cache/(case['id']+'-choices.json');out=cache/(case['id']+'-products.json');write(inp,choices)
    subprocess.run([node,str(HERE/'products.mjs'),str(inp),str(out),str(cache/'finish-catalog.json')],check=True,cwd=ROOT)
    palette=json.loads((cache/'finish-catalog.json').read_text(encoding='utf8'))['schemes'][case['scheme']]
    for space in plan['spaces']:
        kind=space['kind']
        for surface,category,identifier in [('wall','paint',palette['walls'].get(kind,palette['walls']['_'])),('floor','floor',palette['floors'].get(kind,palette['floors']['_']))]:
            from house import measure
            quantity=measure(Polygon(space['boundary_xy_mm']).area/1e6,'m2') if surface=='floor' else dict(value=None,unit='m2',status='unknown',evidence_ids=[],uncertainty=None)
            plan['finishes'].append(dict(id=space['id']+'-'+surface,space_id=space['id'],surface_ref=surface,material_category=category,asset_ref='assets/ev/finishes.js#'+identifier,net_area=quantity,waste_fraction=None,quantity_status='provisional'))
    compiled=json.loads(out.read_text(encoding='utf8'));results=[]
    plan['brief']['preserve']=[p['id'] for p in compiled if p['origin']=='existing']
    if case['id']=='codex-010':
        plan['issues'].append(dict(id='listing-area-conflict',space_ids=[],kind='missing_measurement',message='Initial listing claimed 60 m²; simulated measured schedule has a different net sum. Designer must verify area basis and survey. Confirmed room program is one bedroom, not 3+1.',blocking=True,status='open'))
        plan['review']['blocking_issue_ids'].append('listing-area-conflict')
    code=digest([p.read_text(encoding='utf8') for p in [HERE/'placement.py',HERE/'house.py',HERE/'scenarios.py']])
    for room in rooms:
        source_room=room
        room=room_from_ev(plan,room['id'],{room['id']+'-door':dict(hinge='start')},room['radiators'])
        assert room['boundary']==source_room['boundary'] and room['openings']==source_room['openings']
        room['kind']=source_room['kind']
        selected=[p for p in compiled if p['space_id']==room['id']];niyet=intent(case,room);cp=cache/(case['id']+'-'+room['id']+'.json');fingerprint=digest([room,selected,niyet,RULES,code])
        if cp.exists() and json.loads(cp.read_text())['fingerprint']==fingerprint:result=json.loads(cp.read_text())['result']
        else:
            start=time.monotonic();result=None
            # Previous solutions may seed a new validation, never bypass it. Only
            # identical sizes/identities survive; product material changes are copied.
            if cp.exists():
                old=json.loads(cp.read_text());options=[];lookup={p['id']:p for p in selected}
                for option in old['result'].get('options',[]):
                    if {p['id'] for p in option['items']}!=set(lookup) or any(p['size']!=lookup[p['id']]['size'] for p in option['items']):continue
                    group=[dict(lookup[p['id']],xy=p['xy'],rot=p['rot']) for p in option['items']];checked=validate(room,group,niyet)
                    if checked['valid']:options.append(dict(option,items=group,validation=checked))
                if len(options)==3:result=dict(old['result'],options=options,diagnostics=dict(revalidated_prior_search=True,previous_fingerprint=old['fingerprint']))
            if result is None:result=solve(room,selected,niyet)
            write(cp,dict(fingerprint=fingerprint,result=result,seconds=round(time.monotonic()-start,3)))
        if result['status']!='options':raise ValueError(case['id']+'/'+room['id']+': '+json.dumps(result))
        results.append(dict(room=room,intent=niyet,result=result));print(case['id'],room['id'],'3 valid options',flush=True)
    return plan,results
def assemble(case,plan,results):
    # The three whole-home proposals choose distinct verified room options.
    alternatives=[]
    schema=json.loads((ROOT/'knowledge/ev-projesi/veri/ev-projesi.schema.json').read_text(encoding='utf8'))
    validator=Draft202012Validator(schema)
    for k in range(3):
        placed=[p for r in results for p in r['result']['options'][k]['items']];proposed=copy.deepcopy(plan);proposed['items']=canonical_items(placed)
        validator.validate(proposed)
        for r in results:
            checked=validate(r['room'],[p for p in placed if p['space_id']==r['room']['id']],r['intent']);assert checked['valid'],checked
        alternatives.append(dict(canonical_plan=proposed,placements=placed,score=round(sum(r['result']['options'][k]['score'] for r in results)/len(results),3)))
    return alternatives
def svg(plan,placed):
    bounds=[Polygon(s['boundary_xy_mm']).bounds for s in plan['spaces']];x0=min(b[0] for b in bounds)-250;y0=min(b[1] for b in bounds)-250;x1=max(b[2] for b in bounds)+250;y1=max(b[3] for b in bounds)+250
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {-y1} {x1-x0} {y1-y0}" role="img" aria-label="Synthetic measured furniture diagram">']
    pts=lambda poly:' '.join(f'{x},{-y}' for x,y in poly)
    for s in plan['spaces']:out.append(f'<polygon points="{pts(s["boundary_xy_mm"])}" fill="#eee8db" stroke="#425354" stroke-width="50"/>')
    for o in plan['openings']:
        wall=next(w for w in plan['walls'] if w['id']==o['wall_id']);a,b=wall['from_xy_mm'],wall['to_xy_mm'];length=math_dist(a,b);u=[(b[i]-a[i])/length for i in range(2)];off=o['offset_from_wall_start']['value'];p=[[a[i]+u[i]*t for i in range(2)] for t in [off,off+o['width']['value']]]
        out.append(f'<polyline points="{pts(p)}" stroke="'+('#4098bd' if o['kind']=='window' else '#bd714d')+'" stroke-width="90"/>')
    for p in placed:
        body=footprint(p);x,y=p['xy'];out.append(f'<polygon points="{pts(list(body.exterior.coords))}" fill="#aec8be" stroke="#35594e" stroke-width="25"/><text x="{x}" y="{-y}" font-size="180" text-anchor="middle">{html.escape(p["role"])}</text>')
    out.append('</svg>');return ''.join(out)
def math_dist(a,b):return sum((x-y)**2 for x,y in zip(a,b))**.5
def emit(case,alternatives,results):
    # Authored pairs, each with scenario-specific prose. No generated language variants.
    lines=(HERE/'dialogues'/f'{case["id"]}.txt').read_text(encoding='utf8').splitlines();pairs=[]
    for line in lines:
        if not line.strip():continue
        user,assistant=line.split('\t');pairs.append((user,assistant))
    assert len(pairs)>=20
    first=alternatives[0];plan=first['canonical_plan'];placed=first['placements'];room_program=[dict(id=r['room']['id'],kind=r['room']['kind'],width_mm=case['width'],depth_mm=HEIGHTS[r['room']['kind']]) for r in results]
    selections=[dict(id=p['id'],role=p['role'],design=p['design'],compiled_overall=p['size'],compiler=p['compiler'],requested_design=p.get('requested_design'),origin=p['origin']) for p in placed]
    views={l['id']:viewer(plan,placed,l['id'],case['scheme']) for l in plan['levels']}
    turns=[];ops=json.loads((ROOT/'knowledge/ev-projesi/veri/asistan-sozlesme.json').read_text())['operations']
    for i,(user,assistant) in enumerate(pairs):
        # Braced placeholders only insert the separately authored measured schedule.
        schedule='; '.join(f"{r['kind']} {r['width_mm']}×{r['depth_mm']} mm" for r in room_program)
        user=user.replace('{survey}',schedule);assistant=assistant.replace('{survey}',schedule)
        turns.append(dict(role='user',content=user))
        operation={0:'propose_brief_update',4:'attach_evidence',5:'propose_space_update',7:'propose_existing_item_decision',8:'propose_item_placement',9:'propose_item_placement',10:'propose_item_placement',11:'propose_item_placement',12:'propose_item_placement',13:'propose_finish',14:'propose_lighting_scene',15:'propose_item_placement',16:'ask_clarification',17:'propose_item_placement',18:'request_studio_render',19:'prepare_designer_handoff'}.get(i,'ask_clarification')
        assert operation in ops
        payload=dict(note='proposal only; synthetic case')
        if i==4:payload=dict(evidence_id='simulated-survey',synthetic=True,room_schedule=room_program,photo_not_parsed=True)
        if i==5:payload=dict(confirm_measured_fixture=True,rooms=room_program,locked_boundaries=True)
        if i in (8,9,10,11,12):
            roles={8:['sofa','tv'],9:['dining'],10:['bed'],11:['wardrobe','desk','bookcase'],12:['kitchen','basin']}[i]
            payload=dict(selections=[s for s in selections if s['role'] in roles],coordinate_source='none; assistant selects products, not locations')
        if i==7:payload=dict(existing_items=[s for s in selections if s['origin']=='existing'],decision='keep',existing_proxy_requires_survey=True)
        if i in (15,17):payload=dict(intent_by_room=[dict(space_id=r['room']['id'],intent=r['intent']) for r in results],solver_result_ref=case['id']+'-solver.json' if i==17 else None,coordinate_source='solver_only')
        if i==13:payload=dict(scheme=case['scheme'],source='assets/ev/finishes.js',materials_are_suggestions=True)
        turns.append(dict(role='assistant',content=assistant,reply_customer_language=assistant,requires_designer_review=True,visual_kind='schematic' if i>=17 else 'none',assumptions=['Synthetic measured schedule; site verification pending'],questions=[],evidence_ids=['simulated-survey'] if i>=4 else [],proposed_changes=[dict(operation=operation,target_id=case['id'],expected_revision=1,payload=payload)]))
    area=round(sum(Polygon(s['boundary_xy_mm']).area for s in plan['spaces'])/1e6,2)
    context={1:'Başlangıçta ölçü bilinmiyordu; çocuklu aile ve korunacak yemek masası.',2:'Eski plan fotoğrafı ve görüntü içindeki yetkisiz talimat reddedildi; dubleks.',3:'Kararsız renk seçimi son tercihle güncellendi; mevcut kanepe ölçü temsiliyle korundu.',4:'Tarihi yapı elemanları korunuyor; taşıyıcıya müdahale reddedildi.',5:'T3 yanlış anlaşılması giderildi; salon büyütme isteği kilitli ölçüleri değiştirmedi.',6:'Yaşlı ebeveyn için zemin katta yatak odası, daha geniş mobilya geçişi; erişilebilirlik onayı değil.',7:'Açık yaşam-uyku alanı; düşük bütçede ekstra koltuk ve misafir yatağı iptal edildi.',8:'Çocuk güvenliği ve batı ışığı değerlendirmesi açık; halı ertelendi.',9:'Trilocale oda sayısı teyit edildi; mevcut masa korunuyor, maliyet garantisi reddedildi.',10:'60 m² ilanıyla ölçü cetveli uyuşmuyor; 3+1 talebi açıkça 1+1 olarak değiştirildi.',11:'Bütçe düşürüldü ve yetişkin çalışma alanı iptal edildi; merdiven ölçüsü eksik.',12:'Mevcut yatak korunuyor; bahçe ölçüsü ve kapı ayrıntısı eksik, birebir üretim garantisi verilmedi.'}[int(case['id'][-3:])]
    summary=f"{case['country']}/{case['region']} · {case['type']}. {context} {len(plan['levels'])} katın oda krokisi, {area} m² simüle net oda/hol toplamı ve {len(placed)} ürünün ölçülü yerleşimi; üç seçenek çözücüden geçti. Bütçe müşteri hedefi, teklif değil. Ölçüler simüle ölçüm cetvelidir; ilan alanı değildir. Taşıyıcı, merdiven, tesisat, radyatör üretici şartı ve çocuk/ergonomi güvenliği tasarımcıda. Son karar tasarımcıya aittir."
    record=dict(id=case['id'],synthetic=True,author='codex',country=case['country'],region=case['region'],language=case['lang'],home_type=case['type'],turns=turns,designer_summary_tr=summary,
        result_plan=next(iter(views.values())),result_plans_by_level=views,canonical_plan=plan,product_selections=selections,solver=dict(intent_by_room=[dict(space_id=r['room']['id'],intent=r['intent']) for r in results],result_ref='planlar/'+case['id']+'-solver.json',selected_alternative=1),
        schema_note='canonical_plan conforms unchanged EV v0.1; result_plan uses explicitly validated viewer product extensions; multi-floor previews are separate; no validated stair connection',human_approved=False,training_started=False)
    write(OUT/(case['id']+'.json'),record)
    write(OUT/'planlar'/(case['id']+'-canonical.json'),plan)
    write(OUT/'planlar'/(case['id']+'-solver.json'),dict(case=case,rooms=results,alternatives=alternatives))
    for lid,v in views.items():write(OUT/'planlar'/(case['id']+'-'+lid+'.json'),v)
    return record
def review(records):
    cards=[]
    for rec in records:
        cards.append(f'<article><h2>{rec["id"]} · {rec["country"]} · {rec["language"]} · {html.escape(rec["home_type"])}</h2><p>{html.escape(rec["designer_summary_tr"])}</p>')
        for lid,plan in rec['result_plans_by_level'].items():
            placed=[p for p in json.loads((OUT/'planlar'/(rec['id']+'-solver.json')).read_text())['alternatives'][0]['placements'] if p['space_id'] in {s['id'] for s in plan['spaces']}]
            cards.append(f'<h3>{lid}</h3>'+svg(plan,placed)+f'<p><a href="planlar/{rec["id"]}-{lid}.json">EV viewer JSON</a></p>')
        saved=json.loads((OUT/'planlar'/(rec['id']+'-solver.json')).read_text())
        for number,alternative in enumerate(saved['alternatives'][1:],2):
            cards.append(f'<details><summary>Alternatif {number} · öneri puanı {alternative["score"]}</summary>')
            for lid in rec['result_plans_by_level']:
                p=viewer(alternative['canonical_plan'],alternative['placements'],lid,rec['result_plan']['scheme']);ids={s['id'] for s in p['spaces']}
                cards.append(f'<h3>{lid}</h3>'+svg(p,[i for i in alternative['placements'] if i['space_id'] in ids]))
            cards.append('</details>')
        cards.append('<details><summary>20 kullanıcı–asistan çifti</summary>')
        for t in rec['turns']:cards.append('<p><b>'+t['role']+': </b>'+html.escape(t['content'])+'</p>')
        cards.append('</details></article>')
    (OUT/'codex-okuma.html').write_text('<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>EV-SOHBET-01 · bağımsız Codex örnekleri</title><style>body{font:16px system-ui;max-width:1100px;margin:auto;padding:18px;background:#f6f4ef}article{background:white;padding:20px;margin:24px 0;border:1px solid #bbb}svg{width:100%;max-height:1100px}p{overflow-wrap:anywhere}</style><h1>12 bağımsız simüle sohbet</h1><p>Her biri 20 kullanıcı–asistan çifti. Eğitim yapılmadı; son karar tasarımcıdadır. Ölçü ve görseller gerçek müşteri veya ulusal referans değildir. Çok katlı evlerde katlar ayrı gösterilir; merdiven bağlantısı doğrulanmadı.</p>'+''.join(cards)+'</html>',encoding='utf8')
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--node',default='node');ap.add_argument('--cache',type=Path,required=True);ap.add_argument('--case');ap.add_argument('--solve-only',action='store_true');a=ap.parse_args();a.cache.mkdir(parents=True,exist_ok=True);records=[]
    for case in CASES:
        if a.case and case['id']!=a.case:continue
        plan,results=prepare(case,a.node,a.cache);alternatives=assemble(case,plan,results)
        if not a.solve_only:records.append(emit(case,alternatives,results))
    if records:
        review(records)
        write(OUT/'codex-finish-catalog.json',json.loads((a.cache/'finish-catalog.json').read_text(encoding='utf8')))
