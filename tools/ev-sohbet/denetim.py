"""EV-SOHBET-02 independent geometry/data audit (Shapely, no paid service).

Threshold provenance, checked 2026-10-21:
* CODEX-IS-EMRI-EV-SOHBET-02.md B: +/-8%, bath 3.5..9 m2, WC 1.1..2.5,
  hall <=12%, bedroom >=7 m2/2400 mm, internal door 780..930/entry>=900,
  opening/floor>=10%. These are WORK-ORDER TARGETS, not universal laws.
  No inspected Neufert page establishes all these exact bands. Do not cite a
  book title as proof of unverified numbers (notably maximum bath/hall area).
* BE VLG: official housing quality technical report, glazing 1/12:
  https://codex.vlaanderen.be/PrintDocument.ashx?geannoteerd=false&id=1038765
* BE WAL: vertical glazing 1/14, post-2008 1/12; roof differs:
  https://logement.wallonie.be/fr/page/criteres-de-superficie-habitable
* BE BRU: Brussels Logement June2024 training, direct window 1/12:
  https://brulocalis.brussels/sites/default/files/2024-07/02-20240612-presentation-BL-insalubrite.pdf
* DE NRW: BauO NRW 2018 46(2), rough opening >=1/8 (exceptions require review):
  https://recht.nrw.de/lrgv/gesetz/01012024-bauordnung-fuer-das-land-nordrhein-westfalen-landesbauordnung-2018-bauo-nrw/
* NL Bbl 3.82: EQUIVALENT daylight, not raw window/floor ratio:
  https://iplo.nl/regelgeving/regels-voor-activiteiten/in-stand-houden-bestaand-bouwwerk/rijksregels/daglichttoetreding/
* FR: principal room 9 m2 or 20 m3, not every bedroom 7 m2:
  https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000217471/2022-12-29/
* Stair 2r+t: DGUV 215-112, 590..650 mm ergonomic interval (workplaces,
  not a housing permit): https://publikationen.dguv.de/widgets/pdf/download/article/2816
  800 minimum width and +/-30 around630 here remain work-order targets.
* TR current consolidated daylight/housing limits not primary-verified here.
  No national legal pass is issued. These source polygons are CH references.

Real-source dimensional exceptions are listed separately from strict passes.
Only unchanged source numbers can get an exception; new geometry cannot.
"""
import argparse
import copy
import hashlib
import json
import math
import re
import sys
from collections import Counter,defaultdict
from pathlib import Path
from shapely.geometry import Polygon,LineString,Point

ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'knowledge/ai-egitim/veri/ev-sohbet-02'

def area(s):return Polygon(s['boundary_xy_mm']).area/1e6
def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
def groups(plan):
    out={}
    for o in plan['openings']:out.setdefault(o['source_opening_id'],o)
    return out
def sentences(text):
    # Don't split decimal measurements. Count exact text after whitespace/case.
    return [re.sub(r'\s+',' ',x).strip().casefold() for x in re.split(r'(?<=[.!?])\s+',text) if x.strip()]

def check(record,fixtures=DIR/'kaynaklar'):
    plan=record['plan'];errors=[];results=[];exceptions=[]
    def fail(code,detail):errors.append(dict(code=code,detail=detail))
    def target(code,ok,actual,reference=None):
        row=dict(check=code,passed=bool(ok),actual=actual,scope='work_order_target')
        if not ok and reference is not None and abs(actual-reference)<.001:
            row.update(passed=False,source_exception=True,source_reference_value=reference,reason='Unchanged licensed source value outside project target; not repaired or claimed compliant.')
            exceptions.append(row.copy())
        elif not ok:fail(code,actual)
        results.append(row)
    path=fixtures/Path(record['source']['fixture']).name
    if not path.exists():fail('source_fixture','missing');return dict(id=record['id'],errors=errors,checks=results)
    fixture=json.loads(path.read_text(encoding='utf-8'))
    if digest(fixture)!=record['source']['fixture_sha256']:fail('source_hash','changed')
    if record['source']['id']!=fixture['id'] or fixture['geometry']['license']!='CC-BY-4.0':fail('source_provenance','mismatch')
    source_spaces={s['id']:s for s in fixture['plan']['spaces']}
    source_open={o['id']:o for o in fixture['plan']['openings']}
    from build02 import normalize
    expected,_=normalize(fixture)
    source_shapes={s['id']:Polygon(s['boundary_xy_mm']) for s in expected['spaces']}
    stair_ops=[op for op in record['operations'] if op['kind']=='propose_second_floor_and_stair']
    if len(plan['levels'])!=(2 if stair_ops else 1):fail('unrecorded_level_count',len(plan['levels']))
    for s in plan['spaces']:
        if s['kind']=='stair':continue
        sid=s['id'].removeprefix('upper-')
        if sid not in source_shapes:fail('invented_room',s['id']);continue
        expected_shape=source_shapes[sid]
        if stair_ops and sid==stair_ops[0]['original_space_id']:
            expected_shape=expected_shape.difference(Polygon(stair_ops[0]['stair']['reserved_polygon_xy_mm']))
        actual_shape=Polygon(s['boundary_xy_mm'])
        if actual_shape.is_valid and expected_shape.symmetric_difference(actual_shape).area>10:
            fail('unrecorded_room_geometry_change',s['id'])
    rooms={s['id']:s for s in plan['spaces']};polys={}
    for s in plan['spaces']:
        pts=s['boundary_xy_mm']
        if len(pts)<3 or len(set(map(tuple,pts)))<3:fail('open_polygon',s['id']);continue
        p=Polygon(pts)
        # EV JSON omits repeated final point; closure is the last->first edge.
        if not p.is_valid or p.area<=0 or p.interiors:fail('invalid_polygon',s['id'])
        polys[s['id']]=p
    if any(e['code'] in ('invalid_polygon','open_polygon') for e in errors):
        return dict(id=record['id'],source=record['source']['id'],country=record['country'],net_area_m2=None,levels=len(plan['levels']),items=len(plan['items']),checks=results,source_exceptions=exceptions,errors=errors,daylight={},strict_pass=False,accepted_with_documented_source_exceptions=False,building_law_compliance='not_certified')
    for i,a in enumerate(plan['spaces']):
        for b in plan['spaces'][i+1:]:
            if a['level_id']==b['level_id'] and polys[a['id']].intersection(polys[b['id']]).area>1:
                fail('room_overlap',[a['id'],b['id']])
    walls={w['id']:w for w in plan['walls']}
    for i,a in enumerate(plan['walls']):
        la=LineString([a['from_xy_mm'],a['to_xy_mm']])
        for b in plan['walls'][i+1:]:
            if a['level_id']!=b['level_id']:continue
            lb=LineString([b['from_xy_mm'],b['to_xy_mm']]);intersection=la.intersection(lb)
            if intersection.is_empty:continue
            if intersection.length>.1:fail('wall_overlap',[a['id'],b['id']]);continue
            pts=[intersection] if intersection.geom_type=='Point' else list(getattr(intersection,'geoms',[]))
            for p in pts:
                if p.geom_type!='Point':continue
                if min(p.distance(Point(x)) for x in la.coords)>.1 or min(p.distance(Point(x)) for x in lb.coords)>.1:
                    fail('wall_crossing_without_node',[a['id'],b['id']])
    measured=sum(p.area/1e6 for sid,p in polys.items() if rooms[sid]['kind'] not in ('balcony','terrace','void'))
    claimed=record['claimed_net_area_m2']
    target('net_area_delta_percent',claimed>0 and abs(measured-claimed)/claimed<=.08,round(100*abs(measured-claimed)/claimed,4) if claimed>0 else 999)
    hall=sum(p.area/1e6 for sid,p in polys.items() if rooms[sid]['kind']=='hall')
    target('hall_fraction',hall/measured<=.12,hall/measured)
    for s in plan['spaces']:
        a=area(s);sid=s['id'];source_id=sid.removeprefix('upper-');original=source_spaces.get(source_id)
        ref=area(original) if original else None
        if s['kind']=='bath':target('bath_area:'+sid,3.5<=a<=9,a,ref)
        if s['kind']=='wc':target('wc_area:'+sid,1.1<=a<=2.5,a,ref)
        if s['kind']=='bedroom':
            target('bedroom_area:'+sid,a>=7,a,ref)
            corners=list(polys[sid].minimum_rotated_rectangle.exterior.coords)
            short=min(Point(a).distance(Point(b)) for a,b in zip(corners,corners[1:]))
            target('bedroom_short_side:'+sid,short>=2400,short)
    for o in plan['openings']:
        if o['wall_id'] not in walls:fail('opening_reference',o['id']);continue
        w=walls[o['wall_id']];L=LineString([w['from_xy_mm'],w['to_xy_mm']]).length
        if o['offset_from_wall_start']['value']<-.2 or o['offset_from_wall_start']['value']+o['width']['value']>L+.2:fail('opening_off_wall',o['id'])
    opening_groups=groups(plan)
    expected_walls={w['id']:w for w in expected['walls']}
    expected_groups={o['id']:o for o in expected['openings']}
    infill=set(stair_ops[0].get('upper_entry_infill_source_openings',[])) if stair_ops else set()
    for level in plan['levels']:
        prefix='upper-' if level['id']=='level-1' else ''
        for source_id,base_o in expected_groups.items():
            gid=prefix+source_id
            if prefix and source_id in infill:
                if gid in opening_groups:fail('unclosed_upper_entry',gid)
                continue
            if gid not in opening_groups:fail('missing_source_opening',gid);continue
            actual=opening_groups[gid]
            base_w=expected_walls[base_o['wall_id']];line=LineString([base_w['from_xy_mm'],base_w['to_xy_mm']])
            span=LineString([line.interpolate(base_o['offset_from_wall_start']['value']),line.interpolate(base_o['offset_from_wall_start']['value']+base_o['width']['value'])])
            if span.hausdorff_distance(LineString(actual['full_opening_span_xy_mm']))>.2 or abs(actual['full_opening_width_mm']-base_o['width']['value'])>.2:
                fail('unrecorded_opening_geometry_change',gid)
            if actual['height']!=base_o['height'] or actual['sill_height']!=base_o['sill_height']:fail('unrecorded_opening_vertical_change',gid)
    for oid,o in opening_groups.items():
        src=source_open.get(oid.removeprefix('upper-'));width=o['full_opening_width_mm']
        parts=[v for v in plan['openings'] if v['source_opening_id']==oid]
        if abs(sum(v['width']['value'] for v in parts)-width)>.5:fail('opening_group_loss',oid)
        if o['kind']=='door':
            outside=any(rooms[sid]['kind'] in ('balcony','terrace') for sid in o['space_ids'])
            if not outside or o.get('entry'):
                target('door_width:'+oid,width>=900 if o.get('entry') else 780<=width<=930,width,src['width']['value'] if src else None)
    from build02 import node_walls
    baseline=copy.deepcopy(expected);node_walls(baseline)
    canonical_walls={w['id']:w for w in baseline['walls']}
    for level in plan['levels']:
        prefix='upper-' if level['id']=='level-1' else ''
        actual_walls={w['id']:w for w in plan['walls'] if w['level_id']==level['id']}
        if set(actual_walls)!={prefix+w for w in canonical_walls}:fail('source_wall_inventory',level['id'])
        for wid,w in canonical_walls.items():
            current=actual_walls.get(prefix+wid)
            if current is not None and (LineString([w['from_xy_mm'],w['to_xy_mm']]).hausdorff_distance(LineString([current['from_xy_mm'],current['to_xy_mm']]))>.1 or current['thickness']!=w['thickness']):
                fail('unrecorded_wall_geometry_change',prefix+wid)
    daylight={}
    for s in plan['spaces']:
        if s['kind'] not in ('living','bedroom','study','dining'):continue
        wins=[o for o in opening_groups.values() if o['kind']=='window' and s['id'] in o['space_ids']]
        glazed=sum(o['full_opening_width_mm']*o['height']['value']/1e6 for o in wins)
        ratio=glazed/area(s);source_sid=s['id'].removeprefix('upper-');raw_wins=[o for o in source_open.values() if o['kind']=='window' and source_sid in o['space_ids']]
        source_ratio=sum(o['width']['value']*o['height']['value']/1e6 for o in raw_wins)/area(source_spaces[source_sid])
        target('window_floor_ratio:'+s['id'],ratio>=.10,ratio,source_ratio)
        daylight[s['id']]=dict(opening_area_m2=glazed,floor_area_m2=area(s),ratio=ratio,
            country_review='NRW 1/8 raw-opening precheck' if record['country']=='DE' else 'not_a_national_legal_certificate',
            stricter_nrw_ratio_pass=ratio>=.125 if record['country']=='DE' else None,
            equivalent_daylight_m2=None,frame_glass_fraction=None,obstruction_factor=None)
    # Coordinates must correspond exactly to a returned solveRoom placement.
    approved={}
    for req in record['layout_requests']:
        if not req['attempts']:fail('missing_solver_attempt',req['space_id']);continue
        last=req['attempts'][-1]
        if last['result']['ok']:
            for p in last['result']['alternatives'][0]['placements']:approved[p['id']]=p
    for it in plan['items']:
        p=approved.get(it['id'])
        if p is None or p['pos_xy_mm']!=it['pos_xy_mm'] or p['rot_deg']!=it['rot_deg']:fail('manual_item_position',it['id'])
        body=Polygon(it['footprint_xy_mm']);room=polys[it['space_id']]
        if not room.buffer(2).covers(body):fail('item_outside_room',it['id'])
        for other in plan['items']:
            if other['id']<=it['id'] or other['space_id']!=it['space_id']:continue
            if body.intersection(Polygon(other['footprint_xy_mm'])).area>100:fail('item_overlap',[it['id'],other['id']])
        # Same conservative door-swing envelope, independently constructed.
        for o in opening_groups.values():
            if o['kind']!='door' or it['space_id'] not in o['space_ids']:continue
            a,b=o['full_opening_span_xy_mm'];v=[b[0]-a[0],b[1]-a[1]];L=math.hypot(*v);u=[v[0]/L,v[1]/L];n=[-u[1],u[0]];depth=L if L<=1000 else L/2
            for side in (-1,1):
                zone=Polygon([[a[0]-50*u[0],a[1]-50*u[1]],[b[0]+50*u[0],b[1]+50*u[1]],[b[0]+50*u[0]+side*n[0]*depth,b[1]+50*u[1]+side*n[1]*depth],[a[0]-50*u[0]+side*n[0]*depth,a[1]-50*u[1]+side*n[1]*depth]])
                # Envelope is clipped to this room; source hinge is unknown.
                if body.intersection(zone.intersection(room)).area>100:fail('door_swing_obstructed',[it['id'],o['source_opening_id']]);break
    for stair in plan.get('stairs',[]):
        target('stair_width',stair['width_mm']>=800,stair['width_mm'])
        target('stair_step_formula',abs(2*stair['riser_mm']+stair['tread_mm']-630)<=30,2*stair['riser_mm']+stair['tread_mm'])
        target('stair_landing',stair['landing_depth_mm']>=stair['width_mm'],stair['landing_depth_mm'])
        target('stair_rise',abs(stair['riser_mm']*stair['riser_count']-2800)<.1,stair['riser_mm']*stair['riser_count'])
        physical=Polygon(stair['footprint_xy_mm']);reserved=Polygon(stair['reserved_polygon_xy_mm'])
        if not reserved.buffer(.1).covers(physical):fail('stair_reservation','footprint outside')
        if abs(physical.area-(2*stair['width_mm']+100)*(7*stair['tread_mm']+stair['landing_depth_mm']))>10:fail('stair_flight_geometry','inconsistent')
        if not any(op['kind']=='propose_second_floor_and_stair' for op in record['operations']):fail('unrecorded_floor_addition','no operation')
    if record['solver']['manual_item_coordinates']:fail('manual_coordinate_flag',True)
    return dict(id=record['id'],source=record['source']['id'],country=record['country'],net_area_m2=round(measured,3),
       levels=len(plan['levels']),items=len(plan['items']),checks=results,source_exceptions=exceptions,errors=errors,daylight=daylight,
       strict_pass=not errors and not exceptions,accepted_with_documented_source_exceptions=not errors,
       building_law_compliance='not_certified',stair_structural_or_headroom_approval=False if plan.get('stairs') else None)

def audit(directory=DIR):
    records=[json.loads(p.read_text(encoding='utf-8')) for p in sorted(directory.glob('ev-sohbet-02-*.json'))]
    results=[check(r,directory/'kaynaklar') for r in records];errors=[];seen={}
    for record in records:
        messages=record['dialogue']
        if sum(m['role']=='assistant' for m in messages)<8 or sum(m['role']=='user' for m in messages)<8:errors.append('short_dialogue:'+record['id'])
        for m in messages:
            if m['role']!='assistant':continue
            for s in sentences(m['content']):
                if s in seen:errors.append('duplicate_assistant_sentence:'+record['id']+':'+seen[s]+':'+s)
                seen[s]=record['id']
    if Counter(r['country'] for r in records)!=Counter(BE=8,NL=4,DE=3,FR=2,TR=3):errors.append('country_distribution')
    if len({r['source']['id'] for r in records})!=20:errors.append('source_diversity')
    if sum(len(r['plan']['levels'])>=2 for r in records)<3:errors.append('missing_multilevel')
    return dict(records=len(records),accepted=sum(r['accepted_with_documented_source_exceptions'] for r in results),
        strict_pass=sum(r['strict_pass'] for r in results),suite_errors=errors,results=results,
        passed=not errors and all(r['accepted_with_documented_source_exceptions'] for r in results),
        legal_scope='Geometric project checks; country law, unobstructed daylight, structural changes and stair headroom require designer review.')

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=DIR/'denetim-sonucu.json');p.add_argument('--geometry-only',action='store_true');a=p.parse_args()
    result=audit()
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(records=result['records'],accepted=result['accepted'],strict_pass=result['strict_pass'],suite_errors=result['suite_errors'],errors=[dict(id=r['id'],errors=r['errors']) for r in result['results'] if r['errors']]),ensure_ascii=False,indent=2))
    sys.exit(0 if result['passed'] or a.geometry_only and all(r['accepted_with_documented_source_exceptions'] for r in result['results']) else 1)
