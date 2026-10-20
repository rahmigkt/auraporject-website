"""Original procedural synthetic fixtures. Does not read external floorplan datasets."""
import math
import random
from shapely.geometry import Polygon, box, LineString
from shapely.ops import unary_union
from common import FAMILIES, measure as m, points, digest


def generate(family='corridor', bedrooms=3, seed=0, living_extra_mm=0):
    if family not in FAMILIES or not 1 <= bedrooms <= 5 or not 0 <= living_extra_mm <= 1200:
        raise ValueError('Unsupported family, bedroom count or living expansion')
    rng = random.Random(seed)
    levels = 3 if family == 'detached_3' else 2 if family in ('duplex', 'detached_2') else 1
    kind = 'single_room' if family == 'single_room' else 'detached' if family.startswith('detached') else 'duplex' if levels > 1 else 'apartment'
    if family == 'single_room': bedrooms = 0
    plan = dict(schema_version='0.2', project_id='ev-'+digest([family, bedrooms, seed, living_extra_mm])[:16],
                revision=1, status='survey', coordinate_system='mm; right-handed; x/y floor plane, z up; local origin; glTF adapter converts units and up-axis',
                language=dict(customer='tr', designer='tr'),
                brief=dict(whole_home=True, goals=['Tamamen sentetik; tasarımcı doğrulaması gerekli'],
                           budget=dict(amount=None, currency='TRY', includes=[], estimate_status='unknown'), household_needs=[], style=[], preserve=[]),
                levels=[], spaces=[], walls=[], nodes=[], openings=[], connections=[], stairs=[], columns=[],
                items=[], finishes=[], notes=[], issues=[], evidence=[], kitchens=[], example_only=True,
                site=None, dwelling=dict(kind=kind, bedroom_count=bedrooms, family=family, north_deg=0))
    all_polys = {}
    def add_space(lid, name, typ, poly):
        sid=f'{lid}-s{sum(s["level_id"]==lid for s in plan["spaces"])}'
        inner=poly.buffer(-100, join_style=2)
        if inner.geom_type != 'Polygon' or inner.is_empty: raise ValueError('Room collapsed')
        plan['spaces'].append(dict(id=sid,level_id=lid,name=name,kind=typ,axis_boundary_xy_mm=points(poly),
                                   boundary_xy_mm=points(inner),wall_ids=[],ceiling_height=m(2800),geometry_status='synthetic_fixture',locked_boundary=True))
        all_polys[sid]=poly
        return sid
    depth=4400+rng.randrange(0,9)*100
    if family in ('courtyard','notch'): depth=max(depth,5200)
    hall_depth=3400 if family=='gallery' else 1600
    nbed=[sum(i%levels==level for i in range(bedrooms)) for level in range(levels)]
    # Same footprint per level; spare cells are study/utility, not invented bedrooms.
    capacity=max(4+n for n in nbed)
    cols=math.ceil(capacity/2)
    widths=[3500+rng.randrange(0,12)*100 for _ in range(cols)]
    widths[0]+=living_extra_mm
    W=sum(widths);H=depth*2+hall_depth
    stair_spaces=[];entry_spaces=[]
    for level in range(levels):
        lid=f'level-{level}'
        plan['levels'].append(dict(id=lid,name=f'Kat {level}',elevation=m(level*3000),floor_height=m(3000)))
        if family=='single_room':
            sid=add_space(lid,'Tek oda','living',box(0,0,widths[0],depth))
            entry_spaces.append(sid)
            continue
        hall=add_space(lid,'Açık dağılım' if family=='gallery' else 'Hol','living' if family=='gallery' else 'hall',box(0,depth,W,depth+hall_depth))
        entry_spaces.append(hall)
        slots=[('Yaşam alanı','other' if family=='gallery' else 'living'),('Mutfak','kitchen'),('Banyo','bath')]
        slots += [('Yatak odası '+str(i+1),'bedroom') for i in range(nbed[level])]
        if levels>1:slots.insert(0,('Merdiven','stair'))
        if level>0:
            slots=[('Çalışma / yardımcı alan','study') if typ in ('living','kitchen') else (name,typ) for name,typ in slots]
        while len(slots)<2*cols:slots.append(('Çalışma / yardımcı alan','study'))
        # Keep wet zone stable, vary bedroom positions and row arrangement.
        if seed%2 and levels==1:slots[2:]=list(reversed(slots[2:]))
        for cell,(name,typ) in enumerate(slots):
            col=cell//2;row=cell%2;x=sum(widths[:col]);y=0 if row==0 else depth+hall_depth
            poly=box(x,y,x+widths[col],y+depth)
            if family in ('courtyard','notch') and cell==0:
                cutw=800+rng.randrange(0,4)*100;cuth=1100+rng.randrange(0,4)*100
                cut=box(x,y,x+cutw,y+cuth)
                poly=poly.difference(cut)
                if family=='notch':add_space(lid,'Balkon','balcony',cut)
            if family=='detached_3' and level==2 and cell==len(slots)-1:
                cut=box(x+widths[col]-1200,y+depth-1500,x+widths[col],y+depth)
                poly=poly.difference(cut)
                add_space(lid,'Teras','terrace',cut)
            if family=='open_kitchen' and cell==0:
                name='Açık mutfaklı salon'
            if family=='gallery' and cell==0:
                merged=all_polys[hall].union(poly)
                all_polys[hall]=merged
                target=next(s for s in plan['spaces'] if s['id']==hall)
                target['axis_boundary_xy_mm']=points(merged)
                target['boundary_xy_mm']=points(merged.buffer(-100,join_style=2))
                target['name']='Holsüz açık yaşam ve dağılım'
                continue
            sid=add_space(lid,name,typ,poly)
            if typ=='stair':stair_spaces.append(sid)
        # Columns are explicit obstacles, not wall/room footprint mutations.
        if family in ('corner_living','notch'):
            s=next(s for s in plan['spaces'] if s['level_id']==lid and s['kind'] in ('living','other'))
            poly=all_polys[s['id']];pt=poly.representative_point()
            plan['columns'].append(dict(id=lid+'-column',level_id=lid,space_id=s['id'],footprint_xy_mm=points(box(pt.x-120,pt.y-120,pt.x+120,pt.y+120))))
    # Open kitchen is one living space plus dining (not an enclosed second kitchen).
    if family=='open_kitchen':
        for s in plan['spaces']:
            if s['kind']=='kitchen':s['kind']='other';s['name']='Yemek alanı'
        plan['dwelling']['open_kitchen']=True
    for level in range(levels):
        lid=f'level-{level}';ss=[s for s in plan['spaces'] if s['level_id']==lid]
        lines=unary_union([all_polys[s['id']].boundary for s in ss])
        segments=list(lines.geoms) if hasattr(lines,'geoms') else [lines]
        node_map={}
        def node(pt):
            key=tuple(pt)
            if key not in node_map:
                nid=f'{lid}-n{len(node_map)}';node_map[key]=nid;plan['nodes'].append(dict(id=nid,level_id=lid,xy_mm=list(pt)))
            return node_map[key]
        # unary_union splits intersections; split polylines at every vertex too.
        for line in segments:
            coords=list(line.coords)
            for a,b in zip(coords,coords[1:]):
                edge=LineString([a,b]);adj=[s['id'] for s in ss if all_polys[s['id']].boundary.buffer(.01).covers(edge)]
                wid=f'{lid}-w{sum(w["level_id"]==lid for w in plan["walls"])}'
                plan['walls'].append(dict(id=wid,level_id=lid,from_xy_mm=list(a),to_xy_mm=list(b),from_node_id=node(a),to_node_id=node(b),
                                          thickness=m(200),height=m(2800),space_ids=adj,structural_status='synthetic_fixture',exterior=len(adj)==1))
                for s in ss:
                    if s['id'] in adj:s['wall_ids'].append(wid)
        ws=[w for w in plan['walls'] if w['level_id']==lid]
        def opening(w,typ,width,height,sill=0,entry=False):
            length=LineString([w['from_xy_mm'],w['to_xy_mm']]).length
            oid=f'{lid}-o{sum(o["level_id"]==lid for o in plan["openings"])}'
            op=dict(id=oid,level_id=lid,wall_id=w['id'],kind=typ,space_ids=w['space_ids'],offset_from_wall_start=m(round((length-width)/2,4)),width=m(width),height=m(height),sill_height=m(sill),swing='in' if typ=='door' else 'fixed',hinge='start' if typ=='door' else 'none',opens_to_space_id=w['space_ids'][0] if typ=='door' else None,entry=entry)
            plan['openings'].append(op)
            if typ=='door' and len(w['space_ids'])==2:
                plan['connections'].append(dict(id='route-'+oid,from_space_id=w['space_ids'][0],to_space_id=w['space_ids'][1],opening_id=oid,status='synthetic_fixture'))
        hub=entry_spaces[level]
        for s in ss:
            if s['id']==hub:continue
            candidates=[w for w in ws if hub in w['space_ids'] and s['id'] in w['space_ids']]
            # Balcony connects to its host room instead of the hub.
            if not candidates:candidates=[w for w in ws if len(w['space_ids'])==2 and s['id'] in w['space_ids']]
            wall=max(candidates,key=lambda w:LineString([w['from_xy_mm'],w['to_xy_mm']]).length)
            opening(wall,'door',900,2100)
        if level==0:
            wall=max((w for w in ws if w['space_ids']==[hub]),key=lambda w:LineString([w['from_xy_mm'],w['to_xy_mm']]).length)
            opening(wall,'door',1000,2100,entry=True)
        for s in ss:
            if s['kind'] in ('hall','stair','balcony','terrace'):continue
            candidates=[w for w in ws if w['space_ids']==[s['id']] and not any(o['wall_id']==w['id'] for o in plan['openings'])]
            if not candidates:continue
            area=Polygon(s['boundary_xy_mm']).area
            remaining=area*.11
            for wall in sorted(candidates,key=lambda w:-LineString([w['from_xy_mm'],w['to_xy_mm']]).length):
                if remaining<=0:break
                length=LineString([wall['from_xy_mm'],wall['to_xy_mm']]).length
                if length<1000:continue
                width=max(600,min(length-400,math.ceil(remaining/1800/10)*10))
                opening(wall,'window',width,1800,700)
                remaining-=width*1800
    for k in range(levels-1):
        a=next(s for s in plan['spaces'] if s['level_id']==f'level-{k}' and s['kind']=='stair')
        b=next(s for s in plan['spaces'] if s['level_id']==f'level-{k+1}' and s['kind']=='stair')
        # Stair placement must align: generator uses a dedicated room in each level.
        pa=Polygon(a['boundary_xy_mm']);pb=Polygon(b['boundary_xy_mm'])
        if not pa.equals(pb):
            raise ValueError('Stair rooms do not align; use stable room ordering on multi-level plans')
        x,y,_,_=pa.bounds
        plan['stairs'].append(dict(id=f'stair-{k}',kind='u',from_level_id=a['level_id'],to_level_id=b['level_id'],from_space_id=a['id'],to_space_id=b['id'],riser_count=18,rise_mm=3000/18,going_mm=280,flight_risers=[9,9],width_mm=1100,landing_mm=1100,footprint_xy_mm=points(box(x+50,y+50,x+2450,y+3500)),slab_opening_xy_mm=points(box(x+50,y+50,x+2450,y+3500)),headroom_mm=2100))
    for s in plan['spaces']:
        if s['kind']=='kitchen' or s['name']=='Açık mutfaklı salon':
            poly=Polygon(s['boundary_xy_mm']);x,y,_,_=poly.bounds
            plan['kitchens'].append(dict(space_id=s['id'],sink_xy_mm=[x+500,y+500],cooktop_xy_mm=[x+2300,y+500],fridge_xy_mm=[x+500,y+2300]))
    if kind=='detached':
        footprint=unary_union([all_polys[s['id']] for s in plan['spaces'] if s['level_id']=='level-0'])
        plan['site']=dict(parcel_boundary_xy_mm=points(box(-4000,-4000,W+4000,H+4000)),building_boundary_xy_mm=points(footprint),garden_zones=[dict(id='garden',boundary_xy_mm=points(box(-3500,-3500,-500,H+3500)))])
    plan['evidence']=[dict(id='synthetic',kind='note',space_ids=[s['id'] for s in plan['spaces']],private_object_id=None,caption='Original seeded synthetic geometry. Not a real home or construction approval.',language='en',training_consent=False,synthetic=True)]
    plan['review']=dict(id='review',state='awaiting_designer',revision=1,designer_id=None,designer_approval_revision=None,blocking_issue_ids=[])
    return plan
