"""Schema + topology + sourced/proposed planning checks, not building certification."""
import argparse
import math
import json
import fastjsonschema
from collections import defaultdict, deque
from functools import lru_cache
from jsonschema import Draft202012Validator
from shapely.geometry import Polygon, LineString, Point
from common import DATA, read, compact


@lru_cache(maxsize=1)
def validator():
    return Draft202012Validator(read(DATA/'ev-projesi.schema.v0.2.json'))


@lru_cache(maxsize=1)
def profile():
    return read(DATA/'plan-kurallari.v2.json')['profile']


@lru_cache(maxsize=1)
def fast_validator():
    # Schema uses the common draft-07/2020-12 subset only. Rewrite local $defs to
    # definitions for the compiled checker; canonical schema remains draft 2020-12.
    schema=read(DATA/'ev-projesi.schema.v0.2.json')
    schema['definitions']=schema.pop('$defs')
    schema['$schema']='http://json-schema.org/draft-07/schema#'
    schema=json.loads(json.dumps(schema).replace('#/$defs/','#/definitions/'))
    return fastjsonschema.compile(schema)


def validate(plan):
    errors=[];warnings=[]
    def fail(code, target, message): errors.append(dict(code=code,target=target,message=message))
    try:fast_validator()(plan)
    except fastjsonschema.JsonSchemaException:
        for e in validator().iter_errors(plan):fail('schema','/'.join(map(str,e.path)),e.message)
        if not errors:fail('schema_compiler','plan','Compiled and canonical validators disagree')
    if errors:return dict(valid=False,errors=errors,warnings=warnings)
    def finite(x):
        if isinstance(x,dict):return all(finite(v) for v in x.values())
        if isinstance(x,list):return all(finite(v) for v in x)
        return not isinstance(x,float) or math.isfinite(x)
    if not finite(plan):return dict(valid=False,errors=[dict(code='nonfinite',target='plan',message='NaN/Infinity forbidden')],warnings=[])
    required_measures=[s['ceiling_height'] for s in plan['spaces']]
    required_measures += [v for w in plan['walls'] for v in (w['height'],w['thickness'])]
    required_measures += [v for o in plan['openings'] for v in (o['offset_from_wall_start'],o['width'],o['height'],o['sill_height'])]
    required_measures += [v for level in plan['levels'] for v in (level['elevation'],level['floor_height'])]
    if any(type(v['value']) not in (int,float) for v in required_measures):return dict(valid=False,errors=[dict(code='unknown_measure',target='plan',message='Unknown measure requires clarification')],warnings=[])
    if any(v['unit']!='mm' for v in required_measures):return dict(valid=False,errors=[dict(code='units',target='plan',message='Geometry requires mm')],warnings=[])
    if any(w[k]['value']<=0 for w in plan['walls'] for k in ('height','thickness')):return dict(valid=False,errors=[dict(code='wall_dimensions',target='walls',message='Positive dimensions required')],warnings=[])
    rules=profile()
    groups={}
    for key in ('levels','spaces','walls','nodes','openings','stairs','columns'):
        groups[key]={o['id']:o for o in plan[key]}
        if len(groups[key])!=len(plan[key]):fail('duplicate_id',key,'Duplicate ids')
    levels,spaces,walls,nodes=map(groups.get,('levels','spaces','walls','nodes'))
    node_coords=[(n['level_id'],tuple(n['xy_mm'])) for n in nodes.values()]
    if len(node_coords)!=len(set(node_coords)):fail('node_duplicate','nodes','Equal coordinates must share a node id on each level')
    polygons={};axes={};lines={};graph=defaultdict(set);entry=set()
    for sid,s in spaces.items():
        if s['level_id'] not in levels:fail('level_ref',sid,'Missing level')
        p=Polygon(s['boundary_xy_mm']);a=Polygon(s['axis_boundary_xy_mm'])
        if not p.is_valid or p.area<=0 or not a.is_valid or a.area<=0:
            fail('polygon',sid,'Invalid or self-intersecting closed polygon');continue
        polygons[sid]=p;axes[sid]=a
        minimum=rules['min_area_m2'].get(s['kind'],0)
        if p.area/1e6+1e-6<minimum:fail('min_area',sid,f'Below proposed profile {minimum} m2')
        width=rules['min_width_mm'].get(s['kind'],0)
        if width and p.buffer(-width/2+1,join_style=2).is_empty:fail('min_width',sid,'No room core meets proposed width')
        if not a.covers(p):fail('room_bounds',sid,'Net room extends beyond axis boundary')
        if any(wid not in walls for wid in s['wall_ids']):fail('wall_ref',sid,'Missing wall')
    for sid,p in polygons.items():
        for tid,q in polygons.items():
            if sid<tid and spaces[sid]['level_id']==spaces[tid]['level_id'] and p.intersection(q).area>1:
                fail('room_overlap',sid,tid)
    segments=set()
    for wid,w in walls.items():
        if w['level_id'] not in levels:fail('level_ref',wid,'Missing level')
        line=LineString([w['from_xy_mm'],w['to_xy_mm']]);lines[wid]=line
        key=(w['level_id'],tuple(sorted([tuple(w['from_xy_mm']),tuple(w['to_xy_mm'])])))
        if key in segments or line.length<1:fail('wall_duplicate',wid,'Duplicate/zero wall')
        segments.add(key)
        for attr,coord in [('from_node_id','from_xy_mm'),('to_node_id','to_xy_mm')]:
            n=nodes.get(w[attr])
            if not n or n['level_id']!=w['level_id'] or n['xy_mm']!=w[coord]:fail('node_ref',wid,'Node coordinate/level mismatch')
        for sid in w['space_ids']:
            if sid not in axes or spaces[sid]['level_id']!=w['level_id'] or not axes[sid].boundary.buffer(.1).covers(line):fail('wall_space',wid,sid)
            elif wid not in spaces[sid]['wall_ids']:fail('wall_backref',wid,sid)
    for wid,line in lines.items():
        for tid,other in lines.items():
            if tid<=wid or walls[wid]['level_id']!=walls[tid]['level_id']:continue
            inter=line.intersection(other)
            if inter.is_empty:continue
            endpoints=[Point(c) for c in (line.coords[0],line.coords[-1])]
            others=[Point(c) for c in (other.coords[0],other.coords[-1])]
            if inter.geom_type!='Point' or not any(p.distance(inter)<.1 for p in endpoints) or not any(p.distance(inter)<.1 for p in others):fail('wall_crossing',wid,tid)
    # Every room's axis polygon must be covered by its referenced walls: closure is geometric.
    from shapely.ops import unary_union
    for sid,a in axes.items():
        refs=[lines[w] for w in spaces[sid]['wall_ids'] if w in lines]
        if not refs or not unary_union(refs).buffer(.1).covers(a.boundary):fail('room_open',sid,'Room boundary is not enclosed by walls')
    bywall=defaultdict(list);glazing=defaultdict(float)
    for oid,o in groups['openings'].items():
        w=walls.get(o['wall_id'])
        if not w:fail('opening_ref',oid,'Missing wall');continue
        line=lines[w['id']];off=o['offset_from_wall_start']['value'];width=o['width']['value'];sill=o['sill_height']['value'];height=o['height']['value']
        if min(off,sill)<0 or width<=0 or height<=0 or off+width>line.length+.1 or sill+height>w['height']['value']+.1:fail('opening_bounds',oid,'Outside wall')
        if o['level_id']!=w['level_id'] or set(o['space_ids'])!=set(w['space_ids']):fail('opening_space',oid,'Opening/wall room or level mismatch')
        for p in bywall[w['id']]:
            if min(off+width,p[1])-max(off,p[0])>.1 and min(sill+height,p[3])-max(sill,p[2])>.1:fail('opening_overlap',oid,p[4])
        bywall[w['id']].append((off,off+width,sill,sill+height,oid))
        if o['kind'] in ('door','passage'):
            if width<rules['door_min_mm']:fail('door_width',oid,'Below proposed minimum')
            if o['entry']:entry.update(o['space_ids'])
            if len(o['space_ids'])==2:
                a,b=o['space_ids'];graph[a].add(b);graph[b].add(a)
            if o['kind']=='door' and o['opens_to_space_id'] not in o['space_ids']:fail('door_swing',oid,'Door opens into unrelated space')
        if o['kind']=='window' and w['exterior']:
            for sid in o['space_ids']:glazing[sid]+=width*height
    # Route records cannot invent doors or adjacency.
    expected_routes={frozenset(o['space_ids']) for o in plan['openings'] if o['kind'] in ('door','passage') and len(o['space_ids'])==2}
    for r in plan['connections']:
        o=groups['openings'].get(r['opening_id'])
        if not o or o['kind'] not in ('door','passage') or {r['from_space_id'],r['to_space_id']}!=set(o['space_ids']):fail('route_ref',r['id'],'Not a real door/passage connection')
    if {frozenset([r['from_space_id'],r['to_space_id']]) for r in plan['connections']}!=expected_routes:fail('route_missing','connections','Door graph and routes disagree')
    for stair in plan['stairs']:
        sid=stair['id'];lo=levels.get(stair['from_level_id']);hi=levels.get(stair['to_level_id'])
        if not lo or not hi:fail('stair_level',sid,'Missing level');continue
        dz=hi['elevation']['value']-lo['elevation']['value'];rise=stair['rise_mm'];count=stair['riser_count']
        if dz<=0 or abs(count*rise-dz)>.1 or sum(stair['flight_risers'])!=count:fail('stair_rise',sid,'Risers do not reach next floor')
        if abs(lo['floor_height']['value']-dz)>.1:fail('floor_height',sid,'Floor height differs from level elevations')
        if not rules['stair_formula_mm'][0]<=2*rise+stair['going_mm']<=rules['stair_formula_mm'][1]:fail('stair_formula',sid,'Outside proposed comfort interval')
        foot=Polygon(stair['footprint_xy_mm']);void=Polygon(stair['slab_opening_xy_mm'])
        if not foot.is_valid or not void.is_valid or not void.covers(foot):fail('stair_void',sid,'Invalid or undersized floor opening')
        for key,lid in [('from_space_id',lo['id']),('to_space_id',hi['id'])]:
            room=spaces.get(stair[key])
            if not room or room['level_id']!=lid or stair[key] not in polygons or not polygons[stair[key]].covers(foot):fail('stair_room',sid,'Stair not contained in connected floor rooms')
        if stair['width_mm']<rules['stair_width_min_mm'] or stair['headroom_mm']<rules['headroom_min_mm']:fail('stair_clearance',sid,'Proposed width/headroom not met')
        # U stairs need two flights side-by-side and landing along run; declared headroom is not a solid-intersection proof.
        bx=foot.bounds;fw=bx[2]-bx[0];fd=bx[3]-bx[1]
        run=(max(stair['flight_risers'])-1)*stair['going_mm']+stair['landing_mm']
        if fw+1<2*stair['width_mm'] or fd+1<run:fail('stair_footprint',sid,'Flights/landing do not fit')
        a,b=stair['from_space_id'],stair['to_space_id'];graph[a].add(b);graph[b].add(a)
    seen=set(entry);queue=deque(entry)
    while queue:
        for nxt in graph[queue.popleft()]-seen:seen.add(nxt);queue.append(nxt)
    for sid in spaces:
        if sid not in seen:fail('unreachable',sid,'No door/stair route from exterior entry')
    for sid,s in spaces.items():
        if s['kind']!='bedroom':continue
        reached=set(entry);pending=deque(entry)
        while pending:
            for nxt in graph[pending.popleft()]-reached:
                if nxt in spaces and (spaces[nxt]['kind']!='bedroom' or nxt==sid):reached.add(nxt);pending.append(nxt)
        if sid not in reached:fail('bedroom_privacy',sid,'Access requires passing another bedroom')
    for k in plan['kitchens']:
        sid=k['space_id'];pts=[k[name] for name in ('sink_xy_mm','cooktop_xy_mm','fridge_xy_mm')]
        if sid not in polygons or not all(polygons[sid].covers(Point(p)) for p in pts):fail('kitchen_bounds',sid,'Work centers outside kitchen')
        legs=[math.dist(pts[i],pts[(i+1)%3])/1000 for i in range(3)]
        if min(legs)<1.2 or max(legs)>2.7 or sum(legs)>7.9:fail('kitchen_triangle',sid,'Outside selected NKBA reference guideline')
    kitchen_ids={k['space_id'] for k in plan['kitchens']}
    for sid,s in spaces.items():
        if s['kind']=='kitchen' and sid not in kitchen_ids:fail('kitchen_missing',sid,'Missing work centers')
    for sid,p in polygons.items():
        if spaces[sid]['kind'] in ('bedroom','living','study') and glazing[sid]/p.area+1e-6<rules['glazing_floor_ratio']:
            fail('daylight_proxy',sid,'Below proposed glazing/floor ratio (not daylight simulation)')
    if sum(s['kind']=='bedroom' for s in spaces.values())!=plan['dwelling']['bedroom_count']:fail('bedrooms','dwelling','Declared and actual bedroom count disagree')
    for col in plan['columns']:
        foot=Polygon(col['footprint_xy_mm']);room=spaces.get(col['space_id'])
        if not room or room['level_id']!=col['level_id'] or col['space_id'] not in polygons or not polygons[col['space_id']].covers(foot):fail('column_bounds',col['id'],'Column outside room')
    site=plan['site']
    if plan['dwelling']['kind']=='detached' and site is None:fail('site_missing','site','Detached house needs parcel')
    if site:
        parcel=Polygon(site['parcel_boundary_xy_mm']);building=Polygon(site['building_boundary_xy_mm'])
        if not parcel.is_valid or not building.is_valid or not parcel.covers(building):fail('site_bounds','site','Building outside parcel')
        ground=next(iter(levels))
        for s in plan['spaces']:
            if s['level_id']==ground and s['id'] in axes and not building.buffer(.1).covers(axes[s['id']]):fail('building_bounds',s['id'],'Room outside building boundary')
        for g in site['garden_zones']:
            garden=Polygon(g['boundary_xy_mm'])
            if not garden.is_valid or not parcel.covers(garden) or garden.intersection(building).area>1:fail('garden_bounds',g['id'],'Garden outside parcel or inside building')
    # Sourced rules with unverified current legal applicability are never advertised as legal passes.
    warnings.append(dict(code='not_certified',message='Research profile only; structure, legal compliance, real daylight and door-sweep/headroom solids require designer review.'))
    wet=[s for s in spaces.values() if s['kind'] in ('bath','kitchen','wc')]
    if len(wet)>1:warnings.append(dict(code='wet_grouping_review',message='Wet-area grouping/service shaft is a design recommendation; exact plumbing routing not modelled.'))
    return dict(valid=not errors,errors=errors,warnings=warnings)


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('plan');args=ap.parse_args();result=validate(read(args.plan));print(compact(result));raise SystemExit(0 if result['valid'] else 1)
