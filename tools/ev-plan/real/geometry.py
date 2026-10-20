"""Source-aware verification and conservative affine template adaptation.

The old synthetic validator assumes a common centerline enclosure. That is not
evidence available in the real CSV. Check exact net/source polygons and source
opening membership instead; never claim axis closure or structural approval.
"""
import copy
import math
from collections import defaultdict,deque
from shapely.geometry import Polygon,LineString
from common import digest
from validate import fast_validator


def validate_record(record,original=None,verify_association=True):
    errors=[]
    def fail(code):errors.append(code)
    plan=record['plan'];geo=record['geometry']
    if geo.get('license')!='CC-BY-4.0' or geo.get('source')!='Swiss Dwellings':fail('unapproved_source')
    try:fast_validator()(plan)
    except Exception:fail('schema')
    def finite(v):
        if isinstance(v,dict):return all(finite(x) for x in v.values())
        if isinstance(v,list):return all(finite(x) for x in v)
        return not isinstance(v,float) or math.isfinite(v)
    if not finite(record):fail('nonfinite')
    rooms={s['id']:s for s in plan['spaces']};polys={sid:Polygon(s['boundary_xy_mm']) for sid,s in rooms.items()}
    if set(rooms)!=set(geo['rooms']):fail('source_room_set')
    for sid,poly in polys.items():
        if not poly.is_valid or poly.area<=0:fail('room_polygon');continue
        source=Polygon(geo['rooms'][sid]['polygon_xy_mm'])
        if poly.symmetric_difference(source).area>2:fail('net_geometry_changed')
        if rooms[sid]['kind']!=geo['rooms'][sid]['mapped_kind']:fail('room_semantics_changed')
    ids=list(rooms)
    for i,a in enumerate(ids):
        for b in ids[i+1:]:
            if polys[a].intersection(polys[b]).area>100:fail('room_overlap')
    nodes={n['id']:n for n in plan['nodes']};walls={w['id']:w for w in plan['walls']}
    for w in walls.values():
        if w['id'] not in geo['walls']:fail('missing_source_wall_record')
        for node,point in [(w['from_node_id'],w['from_xy_mm']),(w['to_node_id'],w['to_xy_mm'])]:
            if node not in nodes or nodes[node]['xy_mm']!=point:fail('node_reference')
        if w['height']['value'] is None or w['height']['value']<=0 or w['thickness']['value']<=0:fail('wall_dimensions')
        if any(sid not in rooms for sid in w['space_ids']):fail('wall_room_reference')
    adjacency=defaultdict(set);entries=set();openings={o['id']:o for o in plan['openings']}
    tolerance=50*max(record.get('adaptation',{}).get('scale_x',1),record.get('adaptation',{}).get('scale_y',1))+.1
    for o in openings.values():
        if o['id'] not in geo['openings'] or o['wall_id'] not in walls:fail('opening_reference');continue
        w=walls[o['wall_id']];line=LineString([w['from_xy_mm'],w['to_xy_mm']])
        width=o['width']['value'];off=o['offset_from_wall_start']['value']
        if off<0 or width<=0 or off+width>line.length+.2:fail('opening_out_of_support')
        if o['sill_height']['value']<0 or o['height']['value']<=0 or o['sill_height']['value']+o['height']['value']>w['height']['value']+.1:fail('opening_vertical_bounds')
        source=Polygon(geo['openings'][o['id']]['polygon_xy_mm'])
        if not source.is_valid or source.area<=0:fail('source_opening_polygon')
        if not set(o['space_ids'])<=set(rooms) or not o['space_ids']:fail('opening_room_reference');continue
        association=geo['openings'][o['id']].get('association')
        if association:
            from real.swiss import opening_members
            if original is None and verify_association:
                members,_=opening_members(source,polys,association['max_probe_mm'])
                if set(members)!=set(o['space_ids']):fail('opening_normal_ray_membership')
            elif original is not None:
                original_opening=original['geometry']['openings'][o['id']]
                distances=original_opening['association']['distances_mm']
                factor=max(record['adaptation']['scale_x'],record['adaptation']['scale_y'])
                if any(polys[sid].distance(source)>distances[sid]*factor+.2 for sid in o['space_ids']):fail('adapted_opening_room_distance')
        elif any(polys[sid].distance(source)>tolerance for sid in o['space_ids']):fail('opening_room_distance')
        if o['entry']:entries.update(o['space_ids'])
        if o['kind'] in ('door','passage') and len(o['space_ids'])==2:
            a,b=o['space_ids'];adjacency[a].add(b);adjacency[b].add(a)
    for c in plan['connections']:
        o=openings.get(c['opening_id'])
        if not o or o['kind'] not in ('door','passage') or set(o['space_ids'])!={c['from_space_id'],c['to_space_id']}:fail('route_reference')
    expected={frozenset(o['space_ids']) for o in openings.values() if o['kind'] in ('door','passage') and len(o['space_ids'])==2}
    actual={frozenset([c['from_space_id'],c['to_space_id']]) for c in plan['connections']}
    if expected!=actual:fail('route_graph_mismatch')
    seen=set(entries);queue=deque(entries)
    while queue:
        for nxt in adjacency[queue.popleft()]-seen:seen.add(nxt);queue.append(nxt)
    if not entries or set(rooms)-seen:fail('unreachable')
    if original is not None:
        src=original['plan'];sx=record['adaptation']['scale_x'];sy=record['adaptation']['scale_y']
        if {s['id'] for s in src['spaces']}!=set(rooms):fail('adaptation_room_set')
        for s in src['spaces']:
            expected_poly=Polygon([[x*sx,y*sy] for x,y in s['boundary_xy_mm']])
            if polys[s['id']].symmetric_difference(expected_poly).area>10:fail('adaptation_not_declared_affine')
        if digest(src['connections'])!=digest(plan['connections']):fail('adaptation_topology_changed')
        if record['adaptation']['source_record_sha256']!=digest(original):fail('adaptation_source_hash')
    return dict(valid=not errors,errors=sorted(set(errors)),schema='EV-01 v0.2',
                verified=['source net polygons','source opening membership','opening support and vertical bounds','door/passage connectivity','node references'],
                unverified=['true shared wall axes','wall centerline closure','structural safety','door swing','slab heights','complete multi-storey dwelling'])


def adapt(record,scale_x=1,scale_y=1):
    if not (.85<=scale_x<=1.15 and .85<=scale_y<=1.15):
        raise ValueError('Requested scaling exceeds proposed ±15% template limit; designer must revise program')
    if not validate_record(record)['valid']:raise ValueError('Invalid source reference')
    out=copy.deepcopy(record);p=out['plan'];g=out['geometry']
    def xy(pt):return [round(pt[0]*scale_x,4),round(pt[1]*scale_y,4)]
    def polygon(pts):return [xy(pt) for pt in pts]
    for s in p['spaces']:
        for key in ('boundary_xy_mm','axis_boundary_xy_mm'):s[key]=polygon(s[key])
    for n in p['nodes']:n['xy_mm']=xy(n['xy_mm'])
    line_scale={}
    for w in p['walls']:
        a,b=w['from_xy_mm'],w['to_xy_mm'];old=math.dist(a,b)
        new=math.dist(xy(a),xy(b));ratio=new/old;line_scale[w['id']]=ratio
        w['from_xy_mm']=xy(a);w['to_xy_mm']=xy(b)
        w['thickness']['value']=round(w['thickness']['value']*scale_x*scale_y/ratio,4)
    for o in p['openings']:
        ratio=line_scale[o['wall_id']]
        for key in ('offset_from_wall_start','width'):o[key]['value']=round(o[key]['value']*ratio,4)
    for c in p['columns']:c['footprint_xy_mm']=polygon(c['footprint_xy_mm'])
    for category in ('rooms','walls','openings'):
        for item in g[category].values():
            if item.get('polygon_xy_mm') is not None:item['polygon_xy_mm']=polygon(item['polygon_xy_mm'])
            if item.get('association'):
                item['association']['rays_xy_mm']=[polygon(ray) for ray in item['association']['rays_xy_mm']]
    for item in g['features']+g['voids']:item['polygon_xy_mm']=polygon(item['polygon_xy_mm'])
    p['revision']+=1;p['review']['revision']=p['revision'];p['project_id']+='-adapt-'+digest([scale_x,scale_y])[:8]
    p['notes'].append(dict(id='template-adaptation',original=f'Proposed template affine adaptation: sx={scale_x}, sy={scale_y}. Not a change authorization for an existing building. Original source/attribution retained; all structural decisions require designer/engineer review.',original_language='en',turkish_translation=None,translation_status='not_requested'))
    out['adaptation']=dict(source_id=record['id'],source_record_sha256=digest(record),scale_x=scale_x,scale_y=scale_y,
                           method='global affine template adaptation, no room or door rearrangement',limit_status='±15% is a proposed conservative engineering gate, not learned or legal',approval='pending_designer')
    out['id']=p['project_id'];out['net_area_m2']*=scale_x*scale_y
    out['import_validation']=validate_record(out,record)
    if not out['import_validation']['valid']:raise ValueError('Adaptation failed source-aware validation: '+','.join(out['import_validation']['errors']))
    return out
