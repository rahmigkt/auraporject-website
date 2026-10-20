"""Same transparent proposed quality proxies for v1 and v2; no certification."""
import math
import itertools
from collections import defaultdict, deque, Counter
from shapely.geometry import Polygon, box, LineString
from shapely.ops import unary_union
from common import digest


def graph(plan):
    kinds={s['id']:s['kind'] for s in plan['spaces']};edges=set()
    for c in plan['connections']:edges.add(frozenset([c['from_space_id'],c['to_space_id']]))
    for s in plan['stairs']:edges.add(frozenset([s['from_space_id'],s['to_space_id']]))
    return kinds,edges


def isomorphic(a,b):
    """Exact kind-labelled graph isomorphism, ids/dimensions/family names ignored."""
    ka,ea=a;kb,eb=b
    if len(ka)!=len(kb) or len(ea)!=len(eb):return False
    def adj(k,e):return {s:{next(iter(edge-{s})) for edge in e if s in edge} for s in k}
    aa=adj(ka,ea);ab=adj(kb,eb)
    def color(k,ad,s):return (k[s],len(ad[s]),tuple(sorted(k[n] for n in ad[s])))
    ca={s:color(ka,aa,s) for s in ka};cb={s:color(kb,ab,s) for s in kb}
    if Counter(ca.values())!=Counter(cb.values()):return False
    order=sorted(ka,key=lambda s:sum(c==ca[s] for c in cb.values()));mapping={};used=set()
    def visit(i):
        if i==len(order):return True
        s=order[i]
        for t in kb:
            if t in used or ca[s]!=cb[t]:continue
            if any((u in aa[s])!=(v in ab[t]) for u,v in mapping.items()):continue
            mapping[s]=t;used.add(t)
            if visit(i+1):return True
            used.remove(t);del mapping[s]
        return False
    return visit(0)


def diversity(plans):
    classes=[];shapes=set();arrangements=set()
    for p in plans:
        g=graph(p)
        if not any(isomorphic(g,c) for c in classes):classes.append(g)
        for lid in [l['id'] for l in p['levels']]:
            ss=[s for s in p['spaces'] if s['level_id']==lid]
            envelope=unary_union([Polygon(s['axis_boundary_xy_mm']) for s in ss]);hull=envelope.convex_hull
            # Scale-independent reflex/convex footprint descriptor, not a topology class.
            shapes.add((len(envelope.exterior.coords)-1,round(envelope.area/hull.area,2)))
            x,y,X,Y=envelope.bounds
            arrangements.add(tuple(sorted((s['kind'],round((Polygon(s['axis_boundary_xy_mm']).centroid.x-x)/(X-x),1),round((Polygon(s['axis_boundary_xy_mm']).centroid.y-y)/(Y-y),1)) for s in ss)))
    return dict(plans=len(plans),topology_isomorphism_classes=len(classes),footprint_descriptors=len(shapes),normalized_arrangement_signatures=len(arrangements))


def furniture_fit(poly,kind):
    """Containment of conservative axis-aligned clearance rectangles; not final furniture design."""
    footprints={'bedroom':[(2800,2600)],'living':[(3200,2800),(2200,1800)],'kitchen':[(2400,1700)]}
    sizes=footprints.get(kind,[])
    if not sizes:return None
    x,y,X,Y=poly.bounds
    def positions(w,h):
        for W,H in {(w,h),(h,w)}:
            for a in range(math.ceil(x/200)*200,int(X-W)+1,200):
                for b in range(math.ceil(y/200)*200,int(Y-H)+1,200):
                    q=box(a,b,a+W,b+H)
                    if poly.covers(q):yield q
    if len(sizes)==1:return next(positions(*sizes[0]),None) is not None
    # Conservative two-item packing: contain a combined clearance rectangle.
    # This avoids an unbounded Cartesian product of placement candidates.
    for a in {sizes[0],tuple(reversed(sizes[0]))}:
        for b in {sizes[1],tuple(reversed(sizes[1]))}:
            for W,H in ((a[0]+b[0],max(a[1],b[1])),(max(a[0],b[0]),a[1]+b[1])):
                if next(positions(W,H),None) is not None:return True
    return False


def measure(plan,program=None):
    spaces={s['id']:s for s in plan['spaces']};polys={s['id']:Polygon(s['boundary_xy_mm']) for s in plan['spaces']}
    kinds,edges=graph(plan);ad=defaultdict(set)
    for edge in edges:
        a,b=tuple(edge);ad[a].add(b);ad[b].add(a)
    entry={sid for o in plan['openings'] if o['entry'] for sid in o['space_ids']};seen=set(entry);pending=deque(entry)
    while pending:
        for nxt in ad[pending.popleft()]-seen:
            if kinds[nxt] not in ('living','kitchen','bedroom'):seen.add(nxt);pending.append(nxt)
    bedrooms=[s for s in spaces if kinds[s]=='bedroom']
    privacy={sid:any(n in seen for n in ad[sid]) for sid in bedrooms}
    glazing=defaultdict(float);facade=defaultdict(float)
    for w in plan['walls']:
        if w['exterior']:
            for sid in w['space_ids']:facade[sid]+=LineString([w['from_xy_mm'],w['to_xy_mm']]).length/1000
    for o in plan['openings']:
        if o['kind']=='window':
            for sid in o['space_ids']:glazing[sid]+=o['width']['value']*o['height']['value']
    wet=[s for s in spaces if kinds[s] in ('bath','wc','kitchen')]
    wet_nearest={s:min((polys[s].distance(polys[t])/1000 for t in wet if t!=s and spaces[t]['level_id']==spaces[s]['level_id']),default=None) for s in wet}
    stacked=[]
    for a in wet:
        za=next(l['elevation']['value'] for l in plan['levels'] if l['id']==spaces[a]['level_id'])
        higher=[b for b in wet if next(l['elevation']['value'] for l in plan['levels'] if l['id']==spaces[b]['level_id'])==za+3000]
        if higher:stacked.append(max(polys[a].intersection(polys[b]).area/polys[a].area for b in higher))
    fits={s:furniture_fit(polys[s],kinds[s]) for s in spaces if kinds[s] in ('bedroom','living','kitchen')}
    aspects={s:max((polys[s].bounds[2]-polys[s].bounds[0])/(polys[s].bounds[3]-polys[s].bounds[1]),(polys[s].bounds[3]-polys[s].bounds[1])/(polys[s].bounds[2]-polys[s].bounds[0])) for s in spaces}
    net=sum(poly.area for s,poly in polys.items() if kinds[s] not in ('balcony','terrace'))
    circulation=sum(polys[s].area for s in spaces if kinds[s]=='hall')/net
    comp=[]
    for l in plan['levels']:
        poly=unary_union([Polygon(s['axis_boundary_xy_mm']) for s in spaces.values() if s['level_id']==l['id']]);comp.append(poly.length/(2*math.sqrt(math.pi*poly.area)))
    targets={r['id']:r['target_m2'] for r in program['rooms']} if program else {}
    deviations={sid:abs(polys[sid].area/1e6-area)/area for sid,area in targets.items() if sid in polys}
    # Every weight/threshold below is an explicit research proposal (see criteria file).
    occupied=[v for s,v in aspects.items() if kinds[s] in ('living','bedroom','kitchen','study')]
    checks=dict(circulation=circulation<=.20,room_aspect=max(occupied,default=1)<=3,
                night_access=all(privacy.values()),furniture=all(fits.values()),
                wet_core=all(v is not None and v<=2 for v in wet_nearest.values()),
                daylight=all(facade[s]>0 and glazing[s]/polys[s].area>=.10 for s in spaces if kinds[s] in ('living','bedroom')),
                wet_stack=all(v>=.7 for v in stacked),area_targets=bool(deviations) and max(deviations.values())<=.25)
    common_checks={k:v for k,v in checks.items() if k!='area_targets'}
    return dict(score_proposal=round(100*sum(checks.values())/len(checks),2),common_score_proposal=round(100*sum(common_checks.values())/len(common_checks),2),checks=checks,
                circulation_ratio=round(circulation,4),room_aspects=aspects,night_access_without_living=privacy,
                wet_nearest_m=wet_nearest,wet_stack_overlap=stacked,
                light={s:dict(exterior_m=facade[s],glazing_ratio=glazing[s]/polys[s].area) for s in spaces if kinds[s] in ('living','bedroom')},
                furniture_fit=fits,compactness=comp,program_area_relative_errors=deviations,
                program_bedroom_error=None if program is None else abs(len(bedrooms)-program['bedrooms']),
                limitations=['shaft routing absent','2D rectangular clearance proxy','door sweeps not included','legal compliance not assessed'])
