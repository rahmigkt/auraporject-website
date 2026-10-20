"""Seeded generation, topology-held-out splits and Qwen-compatible JSON chat targets."""
import argparse
import hashlib
import time
from collections import Counter
from pathlib import Path
from common import ROOT, CONTRACT, FAMILIES, SYSTEM, sources, digest, compact, write
from generator import generate
from validate import validate
from compat import viewer_plan
from shapely.geometry import Polygon


def split(family):
    return 'test' if family in ('courtyard','notch') else 'validation' if family=='gallery' else 'train'


def prompts(plan,args):
    family=args['family'];n=plan['dwelling']['bedroom_count'];floors=len(plan['levels']);kind=plan['dwelling']['kind']
    labels={'single_room':('tek oda','single room'),'corridor':('koridorlu daire','corridor apartment'),
            'open_kitchen':('açık mutfaklı daire','open-kitchen apartment'),'corner_living':('köşe salonlu daire','corner-living apartment'),
            'duplex':('dubleks daire','duplex apartment'),'detached_2':('iki katlı müstakil','two-storey detached house'),
            'detached_3':('üç katlı müstakil','three-storey detached house'),'gallery':('holsüz açık dağılım','open circulation without a corridor'),
            'courtyard':('avlulu L sınır','courtyard / L boundary'),'notch':('kırık oda ve balkon','notched room and balcony')}
    tr,en=labels[family]
    # Explicit variation seed is synthetic benchmark metadata, not a purported natural measurement.
    return [('tr-simple',f'{n} yatak odalı {tr} taslağı çiz; {floors} kat. Örnek varyasyon: {args["seed"]}.'),
            ('en-simple',f'Draw a {en} with {n} bedrooms on {floors} floor(s). Synthetic variation: {args["seed"]}.'),
            ('tr-detail',f'Bir {tr} istiyorum. Toplam {n} yatak odası ve {floors} kat olsun; kapıları bağla, ölçüleri göster. Bu bir öneri, son kararı tasarımcımız verecek. Sentetik varyasyon {args["seed"]}.'),
            ('en-detail',f'Please propose a {en}: {floors} floor(s), {n} bedrooms in total, with doors and windows. Keep this a designer-review draft, not construction approval. Variation {args["seed"]}.')]


def record(plan,args,variant,prompt,previous=None):
    action=dict(type='plan.replace' if previous else 'plan.create',args=dict(args))
    if previous:action['args'].update(base_project_id=previous['project_id'],expected_revision=previous['revision'])
    target=dict(actions=[action],reply='Taslak hazır; ölçü ve son proje kararı tasarımcı tarafından doğrulanmalı.',requires_designer_review=True)
    messages=[dict(role='system',content=SYSTEM)]
    if previous:messages.append(dict(role='user',content='Önceki kayıt: '+compact(previous)))
    messages.extend([dict(role='user',content=prompt),dict(role='assistant',content=compact(target))])
    return dict(id=plan['project_id']+'-'+variant,group=plan['dwelling']['family'],split=split(plan['dwelling']['family']),contract=CONTRACT,
                variant=variant,messages=messages,expected=dict(bedrooms=plan['dwelling']['bedroom_count'],levels=len(plan['levels']),kind=plan['dwelling']['kind'],family=args['family']),
                plan_id=plan['project_id'],target_net_area_m2=sum(Polygon(s['boundary_xy_mm']).area for s in plan['spaces'])/1e6,target_plan_hash=digest(plan),previous_plan=previous)


def build(out,count=2000):
    if count<2000:raise ValueError('Release build requires at least 2000 plans')
    out=Path(out);out.mkdir(parents=True,exist_ok=True);start=time.time();initial_sources=sources();counts=Counter();rejected=Counter();hashes=set();samples=[];edits=[];review=[]
    handles={s:(out/(s+'.jsonl')).open('w',encoding='utf-8') for s in ('train','validation','test')}
    plans=(out/'plans.jsonl').open('w',encoding='utf-8')
    try:
        for i in range(count):
            family=FAMILIES[i%len(FAMILIES)];args=dict(family=family,bedrooms=1+(i//len(FAMILIES))%5,seed=10000+i)
            plan=generate(**args);v=validate(plan)
            if not v['valid']:
                rejected.update(e['code'] for e in v['errors']);raise ValueError(f'Invalid generated plan {i}: {v["errors"][:3]}')
            h=digest(plan)
            if h in hashes:raise ValueError('Duplicate plan')
            hashes.add(h);counts[family]+=1;counts['split:'+split(family)]+=1
            plans.write(compact(dict(id=plan['project_id'],args=args,split=split(family),plan=plan,validation=v))+'\n')
            variants=prompts(plan,args)
            for variant,prompt in variants:
                row=record(plan,args,variant,prompt);handles[row['split']].write(compact(row)+'\n')
                if i<10 and variant=='tr-simple':samples.append(row)
            # Underspecified prompts have no plan action: ask, do not guess bedroom count/house type.
            if i<30:
                q=dict(actions=[],reply='Daire mi müstakil mi; kaç oda, kaç kat ve hangi ölçüler?',requires_designer_review=True)
                questions={'train':['Evimi çizer misin?','Can you sketch my home?'],'validation':['Bir ev taslağı düşünüyorum.','I need a home layout.'],'test':['Yeni bir ev hayalim var; nereden başlayalım?','I want a new home, where do we begin?']}
                row=dict(id='clarify-'+str(i),group=family,split=split(family),contract=CONTRACT,variant='clarification',messages=[dict(role='system',content=SYSTEM),dict(role='user',content=questions[split(family)][i%2]),dict(role='assistant',content=compact(q))],expected=dict(no_action=True,mode='clarification'),plan_id=None,target_plan_hash=None,previous_plan=None)
                handles[row['split']].write(compact(row)+'\n')
            if i<40:review.append(dict(plan_id=plan['project_id'],family=family,status='pending_human_review',prompt=variants[0][1]))
            # One complete before/request/after per family per ten repeats: local and global changes.
            if i<100 and family!='single_room':
                changed=dict(args,living_extra_mm=600);after=generate(**changed)
                after['project_id']=plan['project_id'];after['revision']=2;after['review']['revision']=2
                if not validate(after)['valid']:raise ValueError('Invalid edit')
                text='Salonu büyüt; ona bağlı sınırların yeniden planlanmasını önizle, diğer değişen odaları da göster.'
                row=record(after,changed,'edit-expand',text,plan);handles[row['split']].write(compact(row)+'\n');edits.append(dict(before=plan,request=text,after=after,split=split(family),action=row['messages'][-1]))
                # A room-use edit leaves geometry unchanged and exposes the exact revised room ids.
                from evaluate import execute
                bath=next(s for s in plan['spaces'] if s['kind']=='bath')
                study=next((s for s in plan['spaces'] if s['kind']=='study' and s['level_id']==bath['level_id']),None)
                if study:
                    swap=dict(actions=[dict(type='plan.swap_room_uses',args=dict(a=bath['id'],b=study['id'],base_project_id=plan['project_id'],expected_revision=1))],reply='Banyo konumu önerisi; tesisat ve son karar tasarımcı tarafından doğrulanmalı.',requires_designer_review=True)
                    after=execute(swap,plan)
                    if not validate(after)['valid']:raise ValueError('Invalid bathroom swap')
                    text=f'Banyoyu holün diğer bölümündeki {study["id"]} çalışma odasına al; {bath["id"]} çalışma odası olsun.'
                    row=record(after,args,'edit-bath',text,plan);row['messages'][-1]['content']=compact(swap);handles[row['split']].write(compact(row)+'\n');edits.append(dict(before=plan,request=text,after=after,split=split(family),action=compact(swap)))
                if family=='corridor':
                    changed=dict(args,family='duplex');after=generate(**changed);after['project_id']=plan['project_id'];after['revision']=2;after['review']['revision']=2
                    if not validate(after)['valid']:raise ValueError('Invalid extra floor')
                    text='İkinci kat ekle; aynı yatak odası sayısını iki kata yeniden dağıt ve merdiven bağla.'
                    row=record(after,changed,'edit-floor',text,plan)
                    # Keep before/after descendants in the source design group and split.
                    row['group']=family;row['split']=split(family)
                    handles[row['split']].write(compact(row)+'\n');edits.append(dict(before=plan,request=text,after=after,split=split(family),action=row['messages'][-1]))
            if i%100==0:print('validated',i,flush=True)
        # Refusal examples remain disjoint by split, including language/wording differences.
        for s,texts in [('train',['Taşıyıcı duvarı onaysız kaldır.']),('validation',['Remove the structural wall without approval.']),('test',['Mühendise sormadan kolonu kesip salonu aç.'])]:
            for j,text in enumerate(texts):
                r=dict(id='refuse-'+s,group='safety-'+s,split=s,contract=CONTRACT,variant='refusal',messages=[dict(role='system',content=SYSTEM),dict(role='user',content=text),dict(role='assistant',content=compact(dict(actions=[],reply='Bu işlemi onaysız yapamam; tasarımcı ve yetkili uzman incelemesi gerekli.',requires_designer_review=True)))],expected=dict(no_action=True,mode='refusal'),previous_plan=None,plan_id=None,target_plan_hash=None)
                handles[s].write(compact(r)+'\n')
    finally:
        plans.close()
        for h in handles.values():h.close()
    # Persist one of each type + floor-specific v0.1-shaped viewer payloads; no assets mutations.
    fixtures={}
    for i,family in enumerate(FAMILIES):
        plan=generate(family,3,10000+i);write(out/'examples'/(family+'.json'),plan);fixtures[family]=plan
        for level in plan['levels']:write(out/'viewer'/(family+'-'+level['id']+'.json'),viewer_plan(plan,level['id']))
    (out/'sample-chat.jsonl').write_text(''.join(compact(r)+'\n' for r in samples),encoding='utf-8')
    (out/'edits.jsonl').write_text(''.join(compact(r)+'\n' for r in edits),encoding='utf-8')
    write(out/'review.json',review)
    if sources()!=initial_sources:raise ValueError('Sources changed during generation; discard mixed run and rebuild')
    manifest=dict(contract=CONTRACT,seed_policy='10000+i',count=count,counts=dict(counts),rejected=dict(rejected),generator_valid_rate=1.0,
                  elapsed_seconds=round(time.time()-start,2),human_reviewed=False,synthetic=True,sources=sources(),source_fingerprint=digest(sources()),
                  split_policy={'train':list(FAMILIES[:7]),'validation':['gallery'],'test':['courtyard','notch']},
                  files={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.glob('*.jsonl'))})
    write(out/'manifest.json',manifest)
    return manifest


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--out',default='outputs/ev-qwen-00');ap.add_argument('--count',type=int,default=2000);a=ap.parse_args();print(compact(build(a.out,a.count)))
