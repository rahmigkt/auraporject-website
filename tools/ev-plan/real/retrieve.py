"""Retrieve licensed real references, map hard program constraints, adapt and verify.

No learned layout generator or synthetic strip-room fallback. Insufficient matches
are returned as such; a user must clarify unsupported or contradictory requests.
"""
import argparse
import json
import math
import sqlite3
from collections import Counter,defaultdict
from pathlib import Path
from shapely.geometry import Polygon
from common import read,write,compact,digest,ROOT
from solver.program import check
from real.swiss import sha_file
from real.programs import extract
from real.geometry import adapt,validate_record
from metrics import measure


def graph_histogram(program):
    kinds={r['id']:r['kind'] for r in program['rooms']}
    return Counter('|'.join(sorted((kinds[a],kinds[b]))) for a,b in program['adjacency'])


def match_rooms(query,candidate,budget=10000):
    """Bounded kind-preserving mapping satisfying exact required/forbidden links."""
    qs=query['rooms'];cs=candidate['rooms']
    if Counter(r['kind'] for r in qs)!=Counter(r['kind'] for r in cs):return None,'room_kind_counts'
    edges={frozenset(e) for e in candidate['adjacency']};required={frozenset(e) for e in query['adjacency']};forbidden={frozenset(e) for e in query['forbidden']}
    options={r['id']:sorted((s for s in cs if s['kind']==r['kind'] and (r['face']=='any' or r['face']==s['face'])),key=lambda s:abs(s['target_m2']-r['target_m2'])) for r in qs}
    if any(not opt for opt in options.values()):return None,'requested_room_facade'
    degree=Counter(x for edge in query['adjacency'] for x in edge)
    order=sorted(qs,key=lambda r:(len(options[r['id']]),-degree[r['id']]))
    mapping={};used=set();steps=0
    def search(i):
        nonlocal steps
        steps+=1
        if steps>budget:return False
        if i==len(order):return True
        sid=order[i]['id']
        for room in options[sid]:
            tid=room['id']
            if tid in used:continue
            if any((frozenset([sid,a]) in required and frozenset([tid,b]) not in edges) or
                   (frozenset([sid,a]) in forbidden and frozenset([tid,b]) in edges) for a,b in mapping.items()):continue
            mapping[sid]=tid;used.add(tid)
            if search(i+1):return True
            used.remove(tid);del mapping[sid]
        return False
    if search(0):return dict(mapping),None
    return None,'mapping_search_budget' if steps>budget else 'required_or_forbidden_adjacency'


class ReferenceIndex:
    def __init__(self,directory,profile,verify=True):
        self.directory=Path(directory);self.profile=read(profile) if isinstance(profile,(str,Path)) else profile
        manifest=read(self.directory/'conversion-manifest.json')
        if self.profile['source_conversion_hash']!=sha_file(self.directory/'conversion-manifest.json'):raise ValueError('Calibration belongs to a different dataset')
        if verify:
            for name,h in manifest['files'].items():
                if sha_file(self.directory/name)!=h:raise ValueError('Dataset file changed: '+name)
            for name,h in manifest['code_hashes'].items():
                if sha_file(ROOT/name)!=h:raise ValueError('Conversion source changed: '+name)
        self.db=sqlite3.connect('file:'+str((self.directory/'index.sqlite').resolve()).replace('\\','/')+'?mode=ro',uri=True)
        self.stream=(self.directory/'plans.jsonl').open('rb')
        self._program_cache={}

    def close(self):self.stream.close();self.db.close()

    def record(self,id):
        row=self.db.execute('select offset,length from plans where id=?',(id,)).fetchone()
        if row is None:raise ValueError('Unknown source id')
        self.stream.seek(row[0]);return json.loads(self.stream.read(row[1]))

    def retrieve(self,program,country='CH',count=5,width_mm=None,depth_mm=None,exclude_buildings=(),candidate_limit=300,minimum_score=50,preferred_adjacency=None):
        check(program)
        if not 3<=count<=5:raise ValueError('Offer count must be 3..5')
        if program['floors']!=1 or program['stair']!='none':return dict(status='clarify',options=[],reason='No verified multi-storey references in this index; do not synthesize missing floors')
        if program['dwelling']!='apartment':return dict(status='clarify',options=[],reason='Source confirms floor units, not detached-building typology')
        if program['fixed']:return dict(status='clarify',options=[],reason='Measured existing fixed elements require designer alignment; global template scaling cannot authorize their alteration')
        if (width_mm is None)!=(depth_mm is None):raise ValueError('Provide both external dimensions or neither')
        if width_mm is not None and (width_mm<=0 or depth_mm<=0):raise ValueError('Positive dimensions required')
        target_area=sum(r['target_m2'] for r in program['rooms'] if r['kind'] not in ('balcony','terrace'))
        candidates=self.db.execute('select id,building_group,net_area from plans where country=? and split=? and room_count=? order by abs(net_area-?) limit ?',
                                   (country,'train',len(program['rooms']),target_area,candidate_limit)).fetchall()
        preference=dict(program)
        if preferred_adjacency is not None:
            preference['adjacency']=preferred_adjacency;check(preference)
        ranked=[];rejections=Counter();hist=graph_histogram(preference)
        for id,building,area in candidates:
            if building in exclude_buildings:rejections['excluded_building']+=1;continue
            source=self.record(id)
            if id not in self._program_cache:self._program_cache[id]=extract(source)
            cp=self._program_cache[id]
            if program['bedrooms'] is not None and cp['bedrooms']!=program['bedrooms']:
                rejections['unconfirmed_or_different_bedrooms']+=1;continue
            if program['kitchen'] is not None and program['kitchen']!=cp['kitchen']:rejections['kitchen_mode']+=1;continue
            if program['envelope']!=cp['envelope']:rejections['envelope_descriptor']+=1;continue
            if program['entry'] is not None and cp['entry']!=program['entry']:rejections['entry_direction']+=1;continue
            if program['living_face'] is not None and cp['living_face']!=program['living_face']:rejections['living_direction']+=1;continue
            mapping,reason=match_rooms(program,cp)
            if mapping is None:rejections[reason]+=1;continue
            if width_mm is not None:
                polys=[Polygon(s['boundary_xy_mm']) for s in source['plan']['spaces']]
                x=min(p.bounds[0] for p in polys);y=min(p.bounds[1] for p in polys);X=max(p.bounds[2] for p in polys);Y=max(p.bounds[3] for p in polys)
                sx=width_mm/(X-x);sy=depth_mm/(Y-y)
            else:sx=sy=math.sqrt(target_area/area)
            if not (.85<=sx<=1.15 and .85<=sy<=1.15):rejections['scale_limit']+=1;continue
            ch=graph_histogram(cp);graph_distance=sum(abs(hist[k]-ch[k]) for k in set(hist)|set(ch))/max(1,sum(hist.values())+sum(ch.values()))
            room_error=sum(abs(next(r['target_m2'] for r in cp['rooms'] if r['id']==mapping[q['id']])*sx*sy-q['target_m2'])/q['target_m2'] for q in program['rooms'])/len(program['rooms'])
            rank=room_error+.3*graph_distance+.3*(abs(math.log(sx))+abs(math.log(sy)))
            ranked.append((rank,source,sx,sy,mapping,graph_distance,room_error))
        result=[]
        for rank,source,sx,sy,mapping,gd,re in sorted(ranked,key=lambda x:x[0]):
            try:adapted=adapt(source,sx,sy)
            except ValueError:rejections['source_or_adaptation_validation']+=1;continue
            quality=measure(adapted['plan'],self.profile,country=country)
            if quality['score'] is None or quality['score']<minimum_score:rejections['empirical_plausibility']+=1;continue
            result.append(dict(source_id=source['id'],rank=round(rank,5),room_mapping=mapping,graph_type_distance=gd,
                               mean_area_target_relative_error=re,quality=quality,source=source,adapted=adapted))
            if len(result)>=count:break
        return dict(status='options' if len(result)>=3 else 'insufficient_matches',options=result,candidate_count=len(candidates),rejections=dict(rejections),
                    warnings=['CH floor-unit references only','nominal wall axes are compatibility proxies; exact polygons retained','source hinges/slabs/structural status unknown','designer decides','minimum plausibility score and ±15% scale limit are proposal gates'],
                    training_started=False,gpu_gate='closed')


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--data',required=True);p.add_argument('--profile',required=True);p.add_argument('--program',required=True);p.add_argument('--output',required=True);p.add_argument('--country',default='CH');p.add_argument('--width-mm',type=float);p.add_argument('--depth-mm',type=float);a=p.parse_args()
    index=ReferenceIndex(a.data,a.profile)
    try:write(a.output,index.retrieve(read(a.program),a.country,width_mm=a.width_mm,depth_mm=a.depth_mm))
    finally:index.close()
