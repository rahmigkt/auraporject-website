"""Empirical real-plan plausibility, calibrated ONLY on the training buildings.

No fixed 00B area thresholds and no automatic architectural/construction approval.
Worst-room evidence prevents a single enormous WC being averaged away.
"""
import argparse
import bisect
import json
import math
from collections import defaultdict,Counter
from pathlib import Path
from shapely.geometry import Polygon
from common import read,write,compact,digest


def percentile(values,p):
    values=sorted(values)
    if not values:return None
    f=(len(values)-1)*p/100;i=int(f);j=min(i+1,len(values)-1)
    return values[i]+(values[j]-values[i])*(f-i)


def features(plan):
    rooms=[];net=0;hall=0
    for s in plan['spaces']:
        poly=Polygon(s['boundary_xy_mm']);rect=list(poly.minimum_rotated_rectangle.exterior.coords)
        sides=[math.dist(rect[i],rect[i+1])/1000 for i in range(4)]
        area=poly.area/1e6;kind=s['kind']
        rooms.append(dict(id=s['id'],kind=kind,area_m2=area,width_m=min(sides)))
        if kind not in ('balcony','terrace'):net+=area
        if kind=='hall':hall+=area
    kinds={s['id']:s['kind'] for s in plan['spaces']}
    edges=Counter(tuple(sorted((kinds[c['from_space_id']],kinds[c['to_space_id']]))) for c in plan['connections'])
    return dict(rooms=rooms,net_area_m2=net,room_count=len(rooms),circulation_ratio=hall/net if net else 0,edge_type_counts={'|'.join(k):v for k,v in edges.items()})


def summary(values):
    return dict(n=len(values),min=min(values),p01=percentile(values,1),p05=percentile(values,5),p25=percentile(values,25),p50=percentile(values,50),p75=percentile(values,75),p95=percentile(values,95),p99=percentile(values,99),max=max(values))


def fit(data,output):
    from real.swiss import sha_file
    values=defaultdict(list);edges=Counter();groups=set();plans=0;type_counts=Counter()
    with (Path(data)/'plans.jsonl').open(encoding='utf8') as f:
        for line in f:
            r=json.loads(line)
            if r['split']!='train':continue
            groups.add(r['building_group']);plans+=1;ft=features(r['plan']);country=r['country'];typ=r['plan_type'];type_counts[country+'|'+typ]+=1
            prefix=country+'|'+typ+'|'
            for room in ft['rooms']:
                values[prefix+room['kind']+'|area_m2'].append(room['area_m2']);values[prefix+room['kind']+'|width_m'].append(room['width_m'])
            values[prefix+'plan|circulation_ratio'].append(ft['circulation_ratio'])
            values[prefix+'plan|net_area_m2'].append(ft['net_area_m2'])
            values[prefix+'rooms_'+str(ft['room_count'])+'|net_area_m2'].append(ft['net_area_m2'])
            edges.update(ft['edge_type_counts'])
    if plans<100:raise ValueError('Insufficient real training buildings for calibration')
    profile=dict(version='empirical/1',fit_split='train',fit_plans=plans,fit_buildings=len(groups),source_conversion_hash=sha_file(Path(data)/'conversion-manifest.json'),
                 country_plan_type_counts=dict(type_counts),distributions={k:summary(v) for k,v in values.items()},typical_adjacency_counts=dict(edges),
                 scoring='p01..p99 plateau; empirical tail decay outside using p05/p95 spread (or 20% boundary fallback); 65% worst room + 35% average evidence. These weights and minimum n=30 are proposals, not learned or legal thresholds.',
                 limitations=['CH single-floor references only','ROOM is not BEDROOM','WC fixture classification is inferred','bounding-rectangle width is a proxy','no causal measure of aesthetics, structure or safety'])
    write(output,profile);return profile


def plausibility(x,distribution):
    if distribution is None or distribution['n']<30:return None
    lo=distribution['p01'];hi=distribution['p99'];innerlo=distribution['p05'];innerhi=distribution['p95']
    if lo<=x<=hi:return 1.0
    if x<lo:return max(0,1-(lo-x)/max(innerlo-lo,.20*max(abs(lo),.1)))
    return max(0,1-(x-hi)/max(hi-innerhi,.20*max(abs(hi),.1)))


def measure_real(plan,profile,country='CH',plan_type='single_floor_residential_unit'):
    ft=features(plan);d=profile['distributions'];prefix=country+'|'+plan_type+'|';room_scores=[];evidence=[]
    for room in ft['rooms']:
        scores=[]
        for field in ('area_m2','width_m'):
            key=prefix+room['kind']+'|'+field;v=plausibility(room[field],d.get(key))
            evidence.append(dict(room=room['id'],kind=room['kind'],metric=field,value=round(room[field],4),score=v,distribution_key=key,supported=v is not None))
            if v is not None:scores.append(v)
        if scores:room_scores.append(min(scores))
    extras=[]
    for key,x in [('plan|circulation_ratio',ft['circulation_ratio']),('rooms_'+str(ft['room_count'])+'|net_area_m2',ft['net_area_m2'])]:
        v=plausibility(x,d.get(prefix+key))
        if v is not None:extras.append(v)
        evidence.append(dict(metric=key,value=x,score=v,supported=v is not None))
    if not room_scores:return dict(score=None,supported=False,evidence=evidence,reason='No calibrated room classes for requested country/type')
    mean=sum(room_scores+extras)/len(room_scores+extras);score=100*(.65*min(room_scores)+.35*mean)
    return dict(score=round(score,2),supported=True,worst_room_score=min(room_scores),evidence=evidence,
                circulation_ratio=ft['circulation_ratio'],net_area_m2=ft['net_area_m2'],
                meaning='Empirical CH reference plausibility, not architectural quality or legal approval')



# Explicit compatibility for historical 00B; not approved training geometry.
from legacy_v03.metrics import graph, isomorphic, diversity, furniture_fit
from legacy_v03.metrics import measure as measure_synthetic

def measure(plan, profile=None, country='CH', plan_type='single_floor_residential_unit'):
    if profile is None or profile.get('version') == '0.3':
        return measure_synthetic(plan, profile)
    return measure_real(plan, profile, country, plan_type)

if __name__=='__main__':
    p=argparse.ArgumentParser();s=p.add_subparsers(dest='command',required=True)
    f=s.add_parser('fit');f.add_argument('--data',required=True);f.add_argument('--output',required=True)
    m=s.add_parser('score');m.add_argument('--plan',required=True);m.add_argument('--profile',required=True)
    a=p.parse_args()
    print(compact(fit(a.data,a.output) if a.command=='fit' else measure(read(a.plan),read(a.profile))))
