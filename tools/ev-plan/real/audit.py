"""Held-out empirical scoring and reference-retrieval audit; never a model score."""
import argparse
import copy
import json
from pathlib import Path
from collections import Counter,defaultdict
from common import read,write,digest,ROOT
from metrics import measure,percentile
from real.geometry import validate_record
from real.swiss import sha_file


def audit(data,profile,review,output):
    data=Path(data);p=read(profile);m=read(data/'conversion-manifest.json')
    for name,h in m['files'].items():
        if sha_file(data/name)!=h:raise ValueError('Dataset hash mismatch')
    for name,h in m['code_hashes'].items():
        if sha_file(ROOT/name)!=h:raise ValueError('Converter changed')
    groups=defaultdict(set);signatures=set();counts=Counter();labels=Counter();scores=[];wc_samples=[];metadata_private=[]
    with (data/'plans.jsonl').open(encoding='utf8') as f:
        for line in f:
            r=json.loads(line);groups[r['split']].add(r['building_group']);counts[r['split']]+=1
            if r['signature'] in signatures:raise ValueError('Duplicate geometry in corpus')
            signatures.add(r['signature'])
            labels.update(x['source_label'] for x in r['geometry']['rooms'].values())
            if r['split']=='test':
                score=measure(r['plan'],p)['score']
                if score is not None:scores.append(score)
                if len(wc_samples)<3 and any(s['kind']=='wc' for s in r['plan']['spaces']):wc_samples.append(r['id'])
    overlap=set()
    for a in groups:
        for b in groups:
            if a<b:overlap|=groups[a]&groups[b]
    if overlap:raise ValueError('Building split leakage')
    if counts['train']!=p['fit_plans'] or len(groups['train'])!=p['fit_buildings']:raise ValueError('Calibration fit population mismatch')
    fixture=read(ROOT/'knowledge/ai-egitim/veri/ev-plan-reel-00d/fixture-00b-wc.json')
    bad=fixture['plan'];bad_score=measure(bad,p)
    wc=[e for e in bad_score['evidence'] if e.get('kind')=='wc' and e['metric']=='area_m2']
    flag_changed=copy.deepcopy(bad);flag_changed['example_only']=not bad['example_only']
    if measure(flag_changed,p)['score']!=bad_score['score']:raise ValueError('Score must not depend on source/synthetic flag')
    cases=read(Path(review)/'review-data.json');review_manifest=read(Path(review)/'review-manifest.json')
    alternatives=0
    for c in cases:
        if len(c['options'])<3:raise ValueError('Fewer than three alternatives')
        if len({op['source_id'] for op in c['options']})!=len(c['options']):raise ValueError('Repeated alternative')
        for op in c['options']:
            if op['source_building_group'] not in groups['train'] or op['source_building_group']==c['target_building_group']:raise ValueError('Review building leakage')
            alternatives+=1
        original=read(Path(review)/'records'/f'{c["id"]}-source.json');adapted=read(Path(review)/'records'/f'{c["id"]}-adapted.json')
        if not validate_record(adapted,original)['valid']:raise ValueError('Invalid delivered adaptation')
        if digest(original)!=c['options'][0]['source_record_sha256'] or digest(adapted)!=c['options'][0]['adapted_record_sha256']:raise ValueError('Stale review records')
    actual_review=read(Path(review)/'review.json')
    if any(x['rating'] is not None for x in actual_review):raise ValueError('Human approval unexpectedly pre-filled')
    result=dict(source_units_scanned=m['processed_units'],accepted_unique=m['accepted_unique'],complete_scan=m['complete_source_scan'],counts=dict(counts),
                split_buildings={k:len(v) for k,v in groups.items()},cross_split_building_overlap=len(overlap),duplicate_net_geometry=0,
                source_room_labels=dict(labels),heldout_real_score=dict(n=len(scores),p05=percentile(scores,5),p25=percentile(scores,25),p50=percentile(scores,50),p75=percentile(scores,75),p95=percentile(scores,95),mean=sum(scores)/len(scores)),
                old_00b_wc=dict(score=bad_score['score'],wc_area_evidence=wc,source='AURA synthetic 00B commit 41923a3, kapali-01'),
                real_vs_bad_separation=(percentile(scores,50)-bad_score['score']),
                checks=dict(wc_counterexample_low=bad_score['score'] is not None and bad_score['score']<50,
                            heldout_median_high=percentile(scores,50)>=70,
                            complete_scan=m['complete_source_scan'],sixty_cases=len(cases)>=60,three_each=alternatives>=180),
                review_cases=len(cases),review_alternatives=alternatives,human_approved=0,
                interpreted_as='Source-aware data/retrieval audit, not Qwen accuracy, aesthetics, construction or structural approval',
                gpu_gate='closed',training_started=False)
    write(output,result);return result


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--data',required=True);p.add_argument('--profile',required=True);p.add_argument('--review',required=True);p.add_argument('--output',required=True);a=p.parse_args()
    print(json.dumps(audit(a.data,a.profile,a.review,a.output),ensure_ascii=False))
