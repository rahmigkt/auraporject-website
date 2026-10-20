"""Extract the program from observed licensed geometry; preserve unknown labels."""
import argparse
import json
from collections import Counter
from pathlib import Path
from shapely.geometry import Polygon,LineString
from shapely.ops import unary_union
from common import compact,write,digest
from solver.program import check,CONTRACT,SYSTEM


def cardinal(dx,dy):return ('east' if dx>=0 else 'west') if abs(dx)>=abs(dy) else ('north' if dy>=0 else 'south')


def extract(record):
    plan=record['plan'];geo=record['geometry'];polys={s['id']:Polygon(s['boundary_xy_mm']) for s in plan['spaces']}
    window_directions={}
    for sid,poly in polys.items():
        windows=[o for o in plan['openings'] if o['kind']=='window' and sid in o['space_ids']]
        if windows:
            o=max(windows,key=lambda o:o['width']['value']);center=Polygon(geo['openings'][o['id']]['polygon_xy_mm']).centroid
            window_directions[sid]=cardinal(center.x-poly.centroid.x,center.y-poly.centroid.y)
    entry=None
    entrance=next((o for o in plan['openings'] if o['entry']),None)
    if entrance:
        center=Polygon(geo['openings'][entrance['id']]['polygon_xy_mm']).centroid;poly=polys[entrance['space_ids'][0]]
        entry=cardinal(center.x-poly.centroid.x,center.y-poly.centroid.y)
    zone={'living':'day','kitchen':'day','bedroom':'night','bath':'wet','wc':'wet','hall':'service','utility':'service','stair':'service','balcony':'day','terrace':'day','other':'unknown'}
    rooms=[dict(id=s['id'],kind=s['kind'],zone=zone[s['kind']],level=0,target_m2=round(polys[s['id']].area/1e6,4),face=window_directions.get(s['id'],'any')) for s in plan['spaces']]
    adjacency=sorted({tuple(sorted((c['from_space_id'],c['to_space_id']))) for c in plan['connections']})
    living=next((s for s in plan['spaces'] if s['kind']=='living'),None)
    kitchens=[s for s in plan['spaces'] if s['kind']=='kitchen']
    kind='closed' if kitchens else None
    if living:
        for k in kitchens:
            if any(o['kind']=='passage' and {living['id'],k['id']}==set(o['space_ids']) for o in plan['openings']):kind='open'
    # A merged LIVING_DINING is not proof of a merged kitchen; fixture location is retained separately.
    merged_kitchen=any(f['kind']=='KITCHEN' and f['room_id'] and next(s['kind'] for s in plan['spaces'] if s['id']==f['room_id'])=='living' for f in geo['features'])
    if merged_kitchen:kind='open'
    union=unary_union(list(polys.values()));hull=union.convex_hull
    rectangle=union.minimum_rotated_rectangle
    # Descriptor measures exterior shape only approximately; source voids remain separate.
    outline=union.buffer(300,join_style=2).buffer(-300,join_style=2)
    convexity=union.area/hull.area
    envelope='rectangle' if union.area/rectangle.area>.88 else 'notched'
    if outline.geom_type=='Polygon' and not outline.interiors and len(outline.simplify(100).exterior.coords)-1==6:envelope='l'
    p=dict(version='0.4',typology='real_reference',dwelling='apartment',bedrooms=record['source_confirmed_bedrooms'] if record['bedroom_count_known'] else None,
           floors=1,kitchen=kind,envelope=envelope,entry=entry,living_face=window_directions.get(living['id']) if living else None,
           circulation='segmented' if sum(s['kind']=='hall' for s in plan['spaces'])>1 else ('foyer' if any(s['kind']=='hall' for s in plan['spaces']) else 'unknown'),stair='none',setback_m=None,
           rooms=rooms,adjacency=[list(e) for e in adjacency],forbidden=[],fixed=[],revision=1)
    return check(p)


def request(program,language):
    counts=Counter(r['kind'] for r in program['rooms']);area=sum(r['target_m2'] for r in program['rooms'] if r['kind'] not in ('balcony','terrace'))
    if language=='tr':
        labels={'living':'salon','kitchen':'mutfak','bedroom':'yatak odası','bath':'banyo','wc':'WC','hall':'hol','other':'işlevini birlikte belirleyeceğimiz oda','utility':'kiler/servis','balcony':'balkon','terrace':'teras','stair':'merdiven alanı'}
        inventory=', '.join(f'{n} {labels[k]}' for k,n in counts.items())
        kitchen={None:'mutfak türü henüz doğrulanmadı','closed':'kapalı mutfak','open':'açık mutfak','semi_open':'yarı açık mutfak'}[program['kitchen']]
        return f"Yaklaşık {area:.1f} m² bir kat için {inventory} içeren bir ön program hazırlayalım. Odaların kullanımı net değilse yatak odası varsayma. {kitchen.capitalize()}; oda bağlantılarını gerçek plan referanslarıyla öner. Son kararı tasarımcımız verecek."
    inventory=', '.join(f'{n} {k}' for k,n in counts.items())
    return f"Prepare a preliminary program for one floor of about {area:.1f} m² with {inventory}. Generic rooms have no confirmed use; do not assume bedrooms. Kitchen: {program['kitchen'] or 'unverified'}. Suggest room connections using real plan references. Our designer makes the final decision."


def build_pairs(data,output):
    data=Path(data);output=Path(output)
    if output.exists():raise ValueError('New output directory required')
    output.mkdir(parents=True);counts=Counter();sha={};handles={}
    try:
        for split in ('train','validation','test'):handles[split]=(output/f'{split}.jsonl').open('w',encoding='utf8')
        with (output/'program-plan-pairs.jsonl').open('w',encoding='utf8') as pairs:
            with (data/'plans.jsonl').open(encoding='utf8') as f:
                for line in f:
                    r=json.loads(line);p=extract(r)
                    pairs.write(compact(dict(id=r['id'],split=r['split'],country=r['country'],source_record_sha256=digest(r),plan_program=p,plan_ref=r['id'],license='CC-BY-4.0',attribution=r['geometry']['attribution']))+'\n')
                    counts['pairs']+=1
                    for language in ('tr','en'):
                        target=dict(status='program',plan_program=p,operations=[],reply='Tasarımcı incelemesi gerekli; belirsiz oda işlevleri doğrulanmalı.' if language=='tr' else 'Designer review is required; confirm ambiguous room uses.',requires_designer_review=True)
                        row=dict(id=r['id']+'-'+language,source_plan_id=r['id'],building_group=r['building_group'],license='CC-BY-4.0',human_approved=False,
                                 target_status='one_reference_program_not_unique_solution',messages=[dict(role='system',content=SYSTEM),dict(role='user',content=request(p,language)),dict(role='assistant',content=compact(target))])
                        handles[r['split']].write(compact(row)+'\n');counts[r['split']]+=1
    finally:
        for f in handles.values():f.close()
    from real.swiss import sha_file
    for f in output.glob('*.jsonl'):sha[f.name]=sha_file(f)
    report=dict(contract=CONTRACT,counts=dict(counts),files=sha,source_conversion_manifest_sha256=sha_file(data/'conversion-manifest.json'),
                intended_use='Candidate program SFT only; exact target graph is one reference, not uniquely implied by the short request. Do not use exact-match target as the sole evaluation.',
                rooms_not_inferred_as_bedrooms=True,training_started=False,gpu_gate='closed')
    write(output/'pairs-manifest.json',report);return report


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--data',required=True);p.add_argument('--output',required=True);a=p.parse_args();print(compact(build_pairs(a.data,a.output)))
