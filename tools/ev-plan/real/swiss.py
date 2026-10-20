"""Swiss Dwellings 3 CSV -> faithful net polygons + EV-01 v0.2 compatibility view.

Source wall/opening polygons remain in a mandatory sidecar. EV's single-line wall
representation cannot losslessly encode thick irregular polygons. Never mistake
the compatibility axes for surveyed wall axes, nor infer bedrooms from ROOM.
"""
import argparse
import csv
import hashlib
import io
import json
import math
import sqlite3
import time
import zipfile
import fastjsonschema
from collections import Counter,defaultdict,deque
from pathlib import Path
from shapely import from_wkt
from shapely.geometry import Polygon,LineString,Point,box
from shapely.affinity import translate,scale
from shapely.ops import unary_union
from common import compact,digest,write,read,ROOT,DATA
from generator import generate
from validate import fast_validator
from real.fetch import SWISS_FILE,SWISS_MD5

DOI='10.5281/zenodo.7788422'
ATTRIBUTION='Standfest et al., Swiss Dwellings v3.0.0, 2023, doi:10.5281/zenodo.7788422, CC BY 4.0. AURA: privacy minimization, unit conversion, semantic mapping, graph inference and compatibility export.'
LABELS={'LIVING_ROOM':'living','LIVING_DINING':'living','KITCHEN':'kitchen','BATHROOM':'bath',
        'ROOM':'other','CORRIDOR':'hall','BALCONY':'balcony','LOGGIA':'balcony',
        'TERRACE':'terrace','STOREROOM':'utility','BASEMENT_COMPARTMENT':'utility',
        'DINING':'other','STAIRCASE':'stair','ENTRANCE':'hall','BEDROOM':'bedroom',
        'WC':'wc','TOILET':'wc','LAUNDRY':'utility','KITCHEN_DINING':'kitchen',
        'WINTERGARTEN':'other','TECHNICAL_AREA':'utility','STUDIO':'other','PATIO':'terrace'}
EXCLUDED={'SHAFT','VOID','ELEVATOR','LIGHTWELL','OUTDOOR_VOID'}
NAMES={'living':'Salon / yaşam','kitchen':'Mutfak','bath':'Banyo','wc':'WC','other':'Oda (işlevi doğrulanmadı)',
       'hall':'Antre / hol','balcony':'Balkon','terrace':'Teras','utility':'Kiler / servis','stair':'Merdiven alanı','bedroom':'Yatak odası'}


class Rejected(ValueError):pass


def mm(value,unknown=False):
    return dict(value=None if unknown else round(float(value),4),unit='mm',status='unknown' if unknown else 'plan_import',evidence_ids=['licensed-source'],uncertainty=None)


def coords(poly):return [[round(float(x),4),round(float(y),4)] for x,y,*_ in list(poly.exterior.coords)[:-1]]


def short_id(value):return hashlib.sha256(('swiss-v3|'+value).encode()).hexdigest()[:24]


def sha_file(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        while chunk:=f.read(8*1024*1024):h.update(chunk)
    return h.hexdigest()


def stage(source,database):
    source=Path(source);manifest=read(source/'download-manifest.json')
    archive=source/SWISS_FILE
    if manifest['license']!='CC-BY-4.0' or manifest['publisher_md5']!=SWISS_MD5:raise ValueError('Unapproved source')
    if sha_file(archive)!=manifest['sha256']:raise ValueError('Archive changed')
    database=Path(database)
    if database.exists():raise ValueError('Stage DB must be new')
    database.parent.mkdir(parents=True,exist_ok=True)
    db=sqlite3.connect(database)
    db.execute('create table raw (unit text, building text, plan_group text, payload text)')
    db.execute('create table metadata (value text)')
    counts=Counter();labels=Counter();batch=[];started=time.monotonic()
    with zipfile.ZipFile(archive) as z:
        member='swiss-dwellings-v3.0.0/geometries.csv'
        # Deliberately do not extract/read location or simulation files.
        with io.TextIOWrapper(z.open(member),encoding='utf8',newline='') as stream:
            for row in csv.DictReader(stream):
                counts['csv_rows']+=1
                if row['unit_usage']!='RESIDENTIAL' or not row['unit_id']:
                    counts['non_residential_or_unowned_rows']+=1;continue
                key='|'.join(row[k] for k in ('site_id','building_id','floor_id','unit_id'))
                building=short_id(row['site_id']+'|'+row['building_id'])
                plan_group=short_id(row['site_id']+'|'+row['building_id']+'|'+row['plan_id'])
                # Only geometry, labels, vertical dimensions and within-unit feature relations.
                safe={k:row[k] for k in ('entity_type','entity_subtype','geometry','elevation','height','area_id')}
                batch.append((short_id(key),building,plan_group,compact(safe)))
                labels[row['entity_type']+':'+row['entity_subtype']]+=1
                if len(batch)>=10000:
                    db.executemany('insert into raw values (?,?,?,?)',batch);db.commit();batch=[]
                if counts['csv_rows']%500000==0:print(dict(counts),flush=True)
    if batch:db.executemany('insert into raw values (?,?,?,?)',batch)
    db.execute('create index unit_idx on raw(unit)');db.commit()
    counts['candidate_units']=db.execute('select count(distinct unit) from raw').fetchone()[0]
    report=dict(source=manifest,rows=dict(counts),labels=dict(labels),stage_seconds=round(time.monotonic()-started,3),
                privacy='no addresses, coordinates of geographic location, apartment/site/building/floor ids or location/simulation tables retained; public source ids pseudonymized; source area ids remain only in local staging DB for fixture mapping')
    db.execute('insert into metadata values (?)',(compact(report),));db.commit();db.close()
    return report


def axis(poly):
    """Minimum-rectangle long axis proxy; exact source polygon is retained separately."""
    rect=list(poly.minimum_rotated_rectangle.exterior.coords)[:-1]
    lengths=[math.dist(rect[i],rect[(i+1)%4]) for i in range(4)]
    i=min(range(4),key=lambda j:lengths[j]);j=(i+2)%4
    a=[(rect[i][k]+rect[(i+1)%4][k])/2 for k in (0,1)]
    b=[(rect[j][k]+rect[(j+1)%4][k])/2 for k in (0,1)]
    return LineString([a,b]),min(lengths)


def opening_members(poly,rooms,max_probe_mm=1000):
    """First room hit on each normal ray, not arbitrary nearest centroids.

    Some openings lie inside thick separator polygons >50 mm from net rooms.
    Bounded normal probes bridge that separator without jumping over another room.
    The inference and measured distances are retained for audit, never ground truth.
    """
    line,_=axis(poly);a,b=list(line.coords);cx,cy=poly.centroid.coords[0]
    dx=(b[0]-a[0])/line.length;dy=(b[1]-a[1])/line.length;hits=[];rays=[]
    for sign in (-1,1):
        ray=LineString([(cx,cy),(cx-sign*dy*max_probe_mm,cy+sign*dx*max_probe_mm)])
        rays.append([list(x) for x in ray.coords]);candidates=[]
        for sid,room in rooms.items():
            intersection=room.intersection(ray)
            if not intersection.is_empty:candidates.append((Point(cx,cy).distance(intersection),sid))
        if candidates:
            candidates.sort()
            if len(candidates)>1 and abs(candidates[0][0]-candidates[1][0])<1:
                continue  # ambiguous boundary/corner contact; do not guess
            hits.append(candidates[0][1])
    members=list(dict.fromkeys(hits))
    if not members:
        near=[sid for sid,p in rooms.items() if p.distance(poly)<=50 and p.boundary.intersection(poly.buffer(50)).length>=100]
        if 1<=len(near)<=2:members=near
    return members,dict(method='bounded_first_hit_normal_rays_v1',max_probe_mm=max_probe_mm,rays_xy_mm=rays,
                        distances_mm={sid:rooms[sid].distance(poly) for sid in members})


def convert_unit(rows,unit_id,building,source_plan):
    parsed=[]
    for r in rows:
        try:g=from_wkt(r['geometry'])
        except Exception as exc:raise Rejected('invalid_wkt') from exc
        if not g.is_valid or g.is_empty or g.geom_type!='Polygon':raise Rejected('invalid_or_nonpolygon_geometry')
        if g.interiors:raise Rejected('polygon_holes_not_representable_in_v02')
        if not all(math.isfinite(x) and math.isfinite(y) for x,y,*_ in g.exterior.coords):raise Rejected('nonfinite_geometry')
        parsed.append((r,g))
    source_areas=[(r,g) for r,g in parsed if r['entity_type']=='area' and r['entity_subtype'] not in EXCLUDED]
    if not source_areas:raise Rejected('no_usable_rooms')
    if any(g.interiors for r,g in source_areas):raise Rejected('room_holes_not_representable_in_v02')
    if any(g.area<.3 for r,g in source_areas):raise Rejected('usable_room_below_0_3_m2')
    if any(r['entity_subtype'] not in LABELS for r,g in source_areas):raise Rejected('unmapped_room_label')
    levels={round(float(r['elevation']),2) for r,g in source_areas}
    # A floor unit is not silently claimed to be a complete multi-storey dwelling.
    if len(levels)!=1:raise Rejected('mixed_room_elevations')
    base_z=next(iter(levels));minx=min(g.bounds[0] for r,g in source_areas);miny=min(g.bounds[1] for r,g in source_areas)
    normalized=[(r,scale(translate(g,xoff=-minx,yoff=-miny),xfact=1000,yfact=1000,origin=(0,0))) for r,g in parsed]
    template=generate('single_room',1,0)
    for key in ('spaces','walls','nodes','openings','connections','stairs','columns','kitchens','issues','notes','evidence'):template[key]=[]
    plan=template;plan['project_id']='sd-'+unit_id;plan['example_only']=False;plan['site']=None
    # whole_home is the existing schema's project-intent constant, not source coverage.
    # Actual source scope is explicitly one floor in the mandatory notes/sidecar.
    plan['brief']['goals']=['Whole-home project intent; this licensed reference contains only one source floor unit. Final decisions belong to the designer.']
    plan['levels']=[dict(id='level-0',name='Kaynak katı',elevation=mm(0),floor_height=mm(0,unknown=True))]
    side=dict(source='Swiss Dwellings',version='3.0.0',doi=DOI,license='CC-BY-4.0',license_url='https://creativecommons.org/licenses/by/4.0/',
              attribution=ATTRIBUTION,country='CH',unit_ref=unit_id,building_group=building,source_plan_group=source_plan,
              source_unit='metre',output_unit='mm',coordinate_transform='per-unit translation only, followed by exact x1000; no rotation, snapping, buffer or layout repair',
              rooms={},walls={},openings={},features=[],voids=[],warnings=[],
              axis_convention='Room axis_boundary copies the source net polygon as an explicit compatibility proxy. Wall axes are minimum-rectangle proxies. Sidecar polygons are authoritative; synthetic axis-closure validator is not applicable.')
    rooms={};raw_to_id={};ceiling={};source_labels={}
    features=defaultdict(set)
    for r,g in normalized:
        if r['entity_type']=='feature':features[r['area_id']].add(r['entity_subtype'])
    for r,g in normalized:
        if r['entity_type']!='area':continue
        label=r['entity_subtype']
        if label in EXCLUDED:side['voids'].append(dict(kind=label,polygon_xy_mm=coords(g)));continue
        kind=LABELS[label];mapping='source_label'
        if label=='BATHROOM' and 'TOILET' in features[r['area_id']] and not features[r['area_id']] & {'BATHTUB','SHOWER'}:
            kind='wc';mapping='fixture_inferred_toilet_without_recorded_bath_or_shower'
        sid='room-'+str(len(rooms));rooms[sid]=g;raw_to_id[r['area_id']]=sid;source_labels[sid]=label
        h=float(r['height'])*1000
        if not math.isfinite(h) or h<=0:raise Rejected('missing_room_height')
        ceiling[sid]=h
        plan['spaces'].append(dict(id=sid,level_id='level-0',name=NAMES[kind]+' '+str(len(rooms)),kind=kind,
             boundary_xy_mm=coords(g),axis_boundary_xy_mm=coords(g),wall_ids=[],ceiling_height=mm(h),geometry_status='estimated',locked_boundary=True))
        side['rooms'][sid]=dict(source_label=label,mapped_kind=kind,mapping=mapping,polygon_xy_mm=coords(g),source_area_m2=g.area/1e6)
    indoor=[sid for sid in rooms if side['rooms'][sid]['mapped_kind'] not in ('balcony','terrace')]
    net=sum(rooms[sid].area for sid in indoor)/1e6
    if not 10<=net<=1000:raise Rejected('unit_net_area_outside_ingest_range')
    for i,a in enumerate(rooms):
        for b in list(rooms)[i+1:]:
            if rooms[a].intersection(rooms[b]).area>100:raise Rejected('overlapping_net_rooms')
    node_ids={};wallmap={}
    def node(pt):
        key=tuple(round(float(v),4) for v in pt)
        if key not in node_ids:
            nid='node-'+str(len(node_ids));node_ids[key]=nid;plan['nodes'].append(dict(id=nid,level_id='level-0',xy_mm=list(key)))
        return node_ids[key]
    def wall(line,thickness,sids,height,role,polygon=None):
        a,b=[list(c) for c in line.coords];wid='wall-'+str(len(plan['walls']))
        na,nb=node(a),node(b);a=next(n['xy_mm'] for n in plan['nodes'] if n['id']==na);b=next(n['xy_mm'] for n in plan['nodes'] if n['id']==nb)
        w=dict(id=wid,level_id='level-0',from_xy_mm=a,to_xy_mm=b,from_node_id=na,to_node_id=nb,
               thickness=mm(max(.1,thickness)),height=mm(height),space_ids=sids,structural_status='unknown',exterior=len(sids)==1)
        plan['walls'].append(w);wallmap[wid]=w
        for s in plan['spaces']:
            if s['id'] in sids:s['wall_ids'].append(wid)
        side['walls'][wid]=dict(role=role,polygon_xy_mm=coords(polygon) if polygon is not None else None)
        return w
    wall_polys=[];duplicate=set()
    for r,g in normalized:
        if r['entity_type']!='separator':continue
        label=r['entity_subtype']
        if label=='COLUMN':
            contained=next((sid for sid,p in rooms.items() if p.covers(g)),None)
            if contained:plan['columns'].append(dict(id='column-'+str(len(plan['columns'])),level_id='level-0',space_id=contained,footprint_xy_mm=coords(g)))
            side['features'].append(dict(kind='COLUMN',room_id=contained,polygon_xy_mm=coords(g)));continue
        if label not in ('WALL','RAILING'):side['warnings'].append('unmapped_separator:'+label);continue
        token=g.normalize().wkb
        if token in duplicate:continue
        duplicate.add(token)
        sids=[sid for sid,p in rooms.items() if p.distance(g)<=50]
        if not sids:continue
        line,thickness=axis(g)
        if line.length<1:continue
        wall(line,thickness,sids,float(r['height'])*1000,'source_'+label.lower()+'_axis_proxy',g)
        if label=='WALL':wall_polys.append(g)
    entries=set();graph=defaultdict(set)
    def opening(g,sids,kind,height,sill,entry=False,inferred=False,association=None):
        line,thickness=axis(g)
        if line.length<100:raise Rejected('degenerate_opening')
        a,b=list(line.coords);dx=(b[0]-a[0])/line.length;dy=(b[1]-a[1])/line.length
        support=LineString([(a[0]-20*dx,a[1]-20*dy),(b[0]+20*dx,b[1]+20*dy)])
        w=wall(support,max(thickness,1),sids,max([ceiling[s] for s in sids]+[sill+height]),'opening_support_not_source_wall',None)
        oid='opening-'+str(len(plan['openings']))
        plan['openings'].append(dict(id=oid,level_id='level-0',wall_id=w['id'],kind=kind,space_ids=sids,
             offset_from_wall_start=mm(20),width=mm(line.length),height=mm(height),sill_height=mm(max(0,sill)),
             swing='fixed' if kind!='door' else 'unknown',hinge='none' if kind!='door' else 'unknown',opens_to_space_id=None,entry=entry))
        side['openings'][oid]=dict(polygon_xy_mm=coords(g),inferred=inferred,source_subtype='inferred_passage' if inferred else label,association=association)
        if entry:entries.update(sids)
        if kind in ('door','passage') and len(sids)==2:
            a,b=sids;graph[a].add(b);graph[b].add(a)
            plan['connections'].append(dict(id='route-'+oid,from_space_id=a,to_space_id=b,opening_id=oid,status='unverified'))
    for r,g in normalized:
        if r['entity_type']=='feature':
            side['features'].append(dict(kind=r['entity_subtype'],room_id=raw_to_id.get(r['area_id']),polygon_xy_mm=coords(g)))
        if r['entity_type']!='opening':continue
        label=r['entity_subtype']
        if label not in ('DOOR','ENTRANCE_DOOR','WINDOW'):side['warnings'].append('unmapped_opening:'+label);continue
        sids,association=opening_members(g,rooms)
        if not 1<=len(sids)<=2:raise Rejected('unresolved_opening_room_membership')
        if label=='ENTRANCE_DOOR' and len(sids)!=1:raise Rejected('ambiguous_interior_entrance')
        height=float(r['height'])*1000;sill=(float(r['elevation'])-base_z)*1000
        if not math.isfinite(height+sill) or height<=0 or sill< -20:raise Rejected('invalid_opening_vertical_dimensions')
        opening(g,sids,'window' if label=='WINDOW' else 'door',height,sill,label=='ENTRANCE_DOOR',association=association)
    # Algorithmic open adjacency: MSD-style 40 mm contact, at least 600 mm usable span,
    # with a positive source-wall obstruction check. Never turn every adjacency into a door.
    walls_union=unary_union(wall_polys) if wall_polys else Polygon()
    ids=list(rooms)
    for i,a in enumerate(ids):
        for b in ids[i+1:]:
            if b in graph[a] or rooms[a].distance(rooms[b])>40:continue
            contact=rooms[a].boundary.intersection(rooms[b].buffer(40,join_style=2))
            segments=list(contact.geoms) if hasattr(contact,'geoms') else [contact]
            lines=[q for q in segments if q.geom_type=='LineString' and q.length>=600]
            if not lines:continue
            line=max(lines,key=lambda q:q.length)
            if walls_union.intersection(line.buffer(10)).area>1:continue
            label='inferred_passage';opening(line.buffer(5,cap_style=2),[a,b],'passage',min(ceiling[a],ceiling[b]),0,inferred=True)
    if not entries:raise Rejected('no_source_entrance')
    seen=set(entries);queue=deque(entries)
    while queue:
        for nxt in graph[queue.popleft()]-seen:seen.add(nxt);queue.append(nxt)
    if set(rooms)-seen:raise Rejected('disconnected_access_graph')
    unknown=sum(label=='ROOM' for label in source_labels.values())
    bedrooms=sum(s['kind']=='bedroom' for s in plan['spaces'])
    if bedrooms>5:raise Rejected('confirmed_bedrooms_exceed_v02_schema')
    plan['dwelling']=dict(kind='apartment',bedroom_count=bedrooms,family='real_reference',north_deg=0)
    if unknown:
        plan['issues'].append(dict(id='unknown-room-use',space_ids=[sid for sid,l in source_labels.items() if l=='ROOM'],kind='design',message='Generic source ROOM is not a confirmed bedroom; bedroom_count counts confirmed labels only. Ask the user/designer.',status='open',blocking=True))
    plan['notes']=[dict(id='attribution',original=ATTRIBUTION,original_language='en',turkish_translation=None,translation_status='not_requested'),
                   dict(id='axis-compatibility',original=side['axis_convention'],original_language='en',turkish_translation=None,translation_status='not_requested'),
                   dict(id='floor-scope',original='One source floor unit, not a complete multi-floor home. Floor height, door hinge and structural status remain unknown. Do not remove or scale existing structural elements using this record.',original_language='en',turkish_translation=None,translation_status='not_requested')]
    plan['evidence']=[dict(id='licensed-source',kind='plan',space_ids=list(rooms),private_object_id=None,caption=ATTRIBUTION+' Public dataset license permits reuse; this is not customer consent.',language='en',training_consent=False,synthetic=False)]
    plan['review']=dict(id='review',state='awaiting_designer',revision=1,designer_id=None,designer_approval_revision=None,blocking_issue_ids=[x['id'] for x in plan['issues']])
    try:fast_validator()(plan)
    except fastjsonschema.JsonSchemaValueException as exc:raise Rejected('schema_v02_constraints') from exc
    signature=digest(sorted(Polygon(side['rooms'][sid]['polygon_xy_mm']).normalize().wkt for sid in rooms))
    split_num=int(building[:8],16)%100;split='train' if split_num<70 else 'validation' if split_num<85 else 'test'
    result=dict(id=plan['project_id'],country='CH',plan_type='single_floor_residential_unit',building_group=building,source_plan_group=source_plan,
                split=split,signature=signature,net_area_m2=net,room_count=len(rooms),generic_room_count=unknown,
                source_confirmed_bedrooms=bedrooms,bedroom_count_known=unknown==0,plan=plan,geometry=side,
                import_validation=dict(valid=True,schema='EV-01 v0.2',net_geometry_preserved=True,source_graph_connected=True,
                    axis_closure_verified=False,construction_approved=False))
    from real.geometry import validate_record
    validation=validate_record(result,verify_association=False)
    if not validation['valid']:raise Rejected('source_geometry_validation:'+','.join(validation['errors']))
    result['import_validation']=validation
    return result


def convert(database,output,limit=None):
    output=Path(output)
    if output.exists():raise ValueError('Use a new output directory')
    output.mkdir(parents=True);source=sqlite3.connect(database);meta=json.loads(source.execute('select value from metadata').fetchone()[0])
    code_paths=['tools/ev-plan/real/swiss.py','tools/ev-plan/real/geometry.py','tools/ev-plan/common.py','tools/ev-plan/generator.py','tools/ev-plan/validate.py','knowledge/ev-projesi/veri/ev-projesi.schema.v0.2.json']
    code_hashes={f:sha_file(ROOT/f) for f in code_paths}
    units=source.execute('select unit,building,plan_group from raw group by unit order by unit').fetchall()
    index=sqlite3.connect(output/'index.sqlite')
    index.execute('create table plans (id text primary key,country text,plan_type text,building_group text,split text,net_area real,room_count integer,generic_rooms integer,signature text unique,offset integer,length integer)')
    reasons=Counter();labels=Counter();seen={};written=0;started=time.monotonic();schema_errors=Counter();rejections=[]
    with (output/'plans.jsonl').open('wb') as out:
        for n,(unit,building,group) in enumerate(units):
            if limit is not None and n>=limit:break
            raw=[json.loads(r[0]) for r in source.execute('select payload from raw where unit=?',(unit,))]
            for r in raw:
                if r['entity_type']=='area' and r['entity_subtype'] not in LABELS and r['entity_subtype'] not in EXCLUDED:labels[r['entity_subtype']]+=1
            try:
                record=convert_unit(raw,unit,building,group)
                if record['signature'] in seen:
                    reasons['duplicate_net_geometry']+=1;continue
                seen[record['signature']]=record['id']
                data=(compact(record)+'\n').encode();offset=out.tell();out.write(data)
                index.execute('insert into plans values (?,?,?,?,?,?,?,?,?,?,?)',(record['id'],'CH',record['plan_type'],building,record['split'],record['net_area_m2'],record['room_count'],record['generic_room_count'],record['signature'],offset,len(data)))
                written+=1
            except Rejected as exc:
                reason=str(exc);reasons[reason]+=1
                if len(rejections)<200:rejections.append(dict(unit_ref=unit,reason=reason))
            except Exception as exc:
                # Unexpected failures abort, never hide programming errors as bad source data.
                raise RuntimeError('Conversion failed unexpectedly for '+unit) from exc
            if (n+1)%500==0:index.commit();print(dict(processed=n+1,accepted=written,rejected=dict(reasons)),flush=True)
    index.commit();index.close();source.close()
    processed=min(len(units),limit) if limit is not None else len(units)
    if code_hashes!={f:sha_file(ROOT/f) for f in code_paths}:raise ValueError('Conversion code changed during run; no success manifest')
    report=dict(source=meta,code_hashes=code_hashes,processed_units=processed,total_candidate_units=len(units),complete_source_scan=limit is None or limit>=len(units),
                accepted_unique=written,rejected=dict(reasons),rejection_rate=(processed-written)/processed if processed else 0,
                unknown_labels=dict(labels),rejection_samples=rejections,elapsed_seconds=round(time.monotonic()-started,3),
                files={'plans.jsonl':sha_file(output/'plans.jsonl'),'index.sqlite':sha_file(output/'index.sqlite')},
                fields_not_invented=['bedrooms from generic ROOM','floor slab heights','door hinges','load-bearing classification','multi-storey connectivity'],
                schema_axis_limitation='EV v0.2 is a compatibility projection, not a verified centerline model. Mandatory source polygon sidecar remains authoritative.',
                training_started=False,gpu_gate='closed')
    write(output/'conversion-manifest.json',report);return report


if __name__=='__main__':
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='command',required=True)
    s=sub.add_parser('stage');s.add_argument('--source',required=True);s.add_argument('--database',required=True)
    c=sub.add_parser('convert');c.add_argument('--database',required=True);c.add_argument('--output',required=True);c.add_argument('--limit',type=int)
    a=p.parse_args();print(compact(stage(a.source,a.database) if a.command=='stage' else convert(a.database,a.output,a.limit)))
