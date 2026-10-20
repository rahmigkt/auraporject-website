"""EV-SOHBET-02: derive real-plan fixtures; never invent furniture coordinates.

Usage: python tools/ev-sohbet/build02.py --source <converted-v1 directory>
Source is the pinned Swiss Dwellings EV-QWEN-00D conversion. Shapely required.
"""
import argparse
import copy
import hashlib
import json
import math
import sqlite3
from pathlib import Path
from shapely import affinity
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'knowledge/ai-egitim/veri/ev-sohbet-02'
FIX=OUT/'kaynaklar'

# Explicitly selected distinct licensed units, not generated room templates.
IDS=['0013645ec5acd14206b83a42','0032b1d21240e93d716e494f','00759c3d3495e673b0acf285',
 '007d429629bdcf55ee29f7a6','00b7bf4a7c6719207780f9c0','00d5a4d68cf23debb37539da',
 '02ae25bc70c5ae0042b85942','00f2ab305575d56d66525c40','01012e138f103d05637be592',
 '01632b0f194a98bce4b20859','017fd3e8a6fe6bfded9db447','01868faaa1fb3dc9cba82beb',
 '018a420ab07f11540d713d0b','01b8e84dd18c8bfbab353c51','01daabba7a440b3ad1994555',
 '01f4dcf53cf99ff75abd5081','022156046d08cc0646fe83e7','023a6880ea49d2ebbb8cb77f',
 '026c693f92b2cc2eb38a80cc','00e8ebd51a43ed41a326e1cb']
CITIES=[('BE','Bruxelles','fr'),('BE','Gent','nl'),('BE','Antwerpen','nl'),('BE','Liège','fr'),
 ('BE','Brussel','nl'),('BE','Gent','nl'),('BE','Antwerpen','nl'),('BE','Liège','fr'),
 ('NL','Utrecht','nl'),('NL','Rotterdam','nl'),('NL','Leiden','nl'),('NL','Eindhoven','nl'),
 ('DE','Köln','de'),('DE','Bonn','de'),('DE','Düsseldorf','de'),('FR','Lille','fr'),('FR','Lyon','fr'),
 ('TR','İstanbul','tr'),('TR','Ankara','tr'),('TR','İzmir','tr')]
DUPLEX={3,7,11}
NAMES={
 'tr':dict(living='Salon',bedroom='Yatak odası',kitchen='Mutfak',bath='Banyo',wc='Tuvalet',hall='Antre',utility='Kiler',other='Oda',study='Çalışma odası',balcony='Balkon',terrace='Teras',stair='Merdiven'),
 'nl':dict(living='Woonkamer',bedroom='Slaapkamer',kitchen='Keuken',bath='Badkamer',wc='Toilet',hall='Hal',utility='Berging',other='Kamer',study='Werkkamer',balcony='Balkon',terrace='Terras',stair='Trap'),
 'fr':dict(living='Séjour',bedroom='Chambre',kitchen='Cuisine',bath='Salle de bains',wc='Toilettes',hall='Entrée',utility='Rangement',other='Pièce',study='Bureau',balcony='Balcon',terrace='Terrasse',stair='Escalier'),
 'de':dict(living='Wohnzimmer',bedroom='Schlafzimmer',kitchen='Küche',bath='Bad',wc='Toilette',hall='Flur',utility='Abstellraum',other='Zimmer',study='Arbeitszimmer',balcony='Balkon',terrace='Terrasse',stair='Treppe')}

def dump(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def sha(value):return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
def q(value,status='estimated'):return dict(value=value,unit='mm',status=status,evidence_ids=['source-or-proposal'],uncertainty=None)
def area(s):return Polygon(s['boundary_xy_mm']).area/1e6
def net(p):return sum(area(s) for s in p['spaces'] if s['kind'] not in ('balcony','terrace','void'))

def normalize(source):
    """Rigid coordinate change only: preserve areas and real irregular boundaries."""
    plan=copy.deepcopy(source['plan'])
    longest=max(plan['walls'],key=lambda w:LineString([w['from_xy_mm'],w['to_xy_mm']]).length)
    a,b=longest['from_xy_mm'],longest['to_xy_mm'];ang=-math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))
    def rot(xy):
        p=affinity.rotate(Point(xy),ang,origin=(0,0));return [p.x,p.y]
    coords=[rot(p) for s in plan['spaces'] for p in s['boundary_xy_mm']]
    x0,y0=min(p[0] for p in coords),min(p[1] for p in coords)
    def tr(p):
        x,y=rot(p);return [round(x-x0,4),round(y-y0,4)]
    for s in plan['spaces']:
        s['boundary_xy_mm']=[tr(p) for p in s['boundary_xy_mm']]
        s.pop('axis_boundary_xy_mm',None)
    for w in plan['walls']:
        w['from_xy_mm']=tr(w['from_xy_mm']);w['to_xy_mm']=tr(w['to_xy_mm'])
    plan['items']=[];plan['nodes']=[]
    return plan,dict(kind='rigid_transform',rotation_degrees=ang,translation_mm=[-x0,-y0],area_change=0)

def node_walls(plan):
    """Node real compatibility axes at intersections; no wall/room layout repair."""
    old=plan['walls'];lines=[LineString([w['from_xy_mm'],w['to_xy_mm']]) for w in old]
    network=unary_union(lines);parts=list(network.geoms) if hasattr(network,'geoms') else [network]
    new=[]
    for line in parts:
        if line.length<0.01:continue
        parent=[w for w,l in zip(old,lines) if l.distance(line.interpolate(.5,normalized=True))<.01 and l.buffer(.02).covers(line)]
        if not parent:raise ValueError('Untraceable noded wall')
        w=copy.deepcopy(max(parent,key=lambda w:w['thickness']['value']))
        w.update(id=f"wall-n{len(new)}",from_xy_mm=list(line.coords[0]),to_xy_mm=list(line.coords[-1]),source_wall_ids=[v['id'] for v in parent])
        w['space_ids']=sorted({sid for v in parent for sid in v['space_ids']})
        new.append(w)
    openings=[]
    for o in plan['openings']:
        w=next(w for w in old if w['id']==o['wall_id']);l=LineString([w['from_xy_mm'],w['to_xy_mm']])
        start=l.interpolate(o['offset_from_wall_start']['value']);end=l.interpolate(o['offset_from_wall_start']['value']+o['width']['value'])
        span=LineString([start,end]);mid=span.interpolate(.5,normalized=True)
        candidates=[(w,LineString([w['from_xy_mm'],w['to_xy_mm']])) for w in new if o['wall_id'] in w['source_wall_ids']]
        segments=[]
        for w,line in candidates:
            a,b=sorted((span.project(Point(line.coords[0])),span.project(Point(line.coords[-1]))))
            if b-a>.001:segments.append((a,b,w,line))
        breaks=sorted({0,span.length,*[v for a,b,_,_ in segments for v in (a,b)]})
        covered=0
        for aa,bb in zip(breaks,breaks[1:]):
            if bb-aa<.001:continue
            active=[(w,line) for a,b,w,line in segments if a-.001<=(aa+bb)/2<=b+.001]
            if not active:continue
            w,line=min(active,key=lambda wl:wl[1].distance(span.interpolate((aa+bb)/2)))
            # A noded wall may split an aperture; preserve the COMPLETE group.
            a,b=sorted((line.project(span.interpolate(aa)),line.project(span.interpolate(bb))))
            v=copy.deepcopy(o);v.update(id=o['id']+'-part'+str(len(openings)),source_opening_id=o['id'],source_wall_id=o['wall_id'],wall_id=w['id'],
                full_opening_span_xy_mm=[list(start.coords[0]),list(end.coords[0])],full_opening_width_mm=o['width']['value'])
            v['offset_from_wall_start']['value']=round(a,4);v['width']['value']=round(b-a,4)
            openings.append(v);covered+=b-a
        if abs(covered-o['width']['value'])>.2:raise ValueError(f'Aperture lost during noding: {o["id"]} {covered} vs {o["width"]["value"]}')
    for s in plan['spaces']:
        s['wall_ids']=[w['id'] for w in new if s['id'] in w['space_ids']]
    plan['walls']=new;plan['openings']=openings

def add_duplex(plan,lang):
    """User-proposed floor repeat, NOT an existing multi-storey Swiss dwelling."""
    living=next(s for s in plan['spaces'] if s['kind']=='living')
    original_poly=Polygon(living['boundary_xy_mm'])
    corners=list(original_poly.minimum_rotated_rectangle.exterior.coords)
    a,b=max(zip(corners,corners[1:]),key=lambda ab:Point(ab[0]).distance(Point(ab[1])))
    angle=math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))
    poly=affinity.rotate(original_poly,-angle,origin=(0,0));x0,y0,x1,y1=poly.bounds
    chosen=None
    for x,y in [(x0+100,y0+100),(x1-2000,y0+100),(x0+100,y1-2960),(x1-2000,y1-2960)]:
        rect=box(x,y,x+1900,y+2860)
        # Touch boundary so the residual room is a simple polygon, not a hole.
        clipped=rect.intersection(poly)
        if clipped.area<rect.area-.1:continue
        nearest=poly.boundary.distance(rect)
        if nearest>250:continue
        # Extend to boundary by a fraction of a millimetre before differencing.
        cut=rect.buffer(250,join_style=2);remaining=poly.difference(cut)
        if remaining.geom_type=='Polygon' and not remaining.interiors and remaining.area>10e6:
            chosen=(rect,remaining,poly.intersection(cut));break
    if chosen is None:raise ValueError('No verified stair reservation in selected living room')
    local_rect,remaining,reservation=chosen
    rect=affinity.rotate(local_rect,angle,origin=(0,0))
    remaining=affinity.rotate(remaining,angle,origin=(0,0))
    reservation=affinity.rotate(reservation,angle,origin=(0,0))
    original_boundary=copy.deepcopy(living['boundary_xy_mm'])
    living['boundary_xy_mm']=[list(p) for p in list(remaining.exterior.coords)[:-1]]
    lower=copy.deepcopy(plan)
    for group in ('spaces','walls','openings'):
        upper=[]
        for obj in lower[group]:
            v=copy.deepcopy(obj);v['id']='upper-'+v['id'];v['level_id']='level-1'
            if 'space_ids' in v:v['space_ids']=['upper-'+x for x in v['space_ids']]
            if 'wall_ids' in v:v['wall_ids']=['upper-'+x for x in v['wall_ids']]
            if 'wall_id' in v:v['wall_id']='upper-'+v['wall_id']
            if 'source_opening_id' in v:v['source_opening_id']='upper-'+v['source_opening_id']
            if v.get('kind')=='living':v['kind']='study'
            if group=='openings' and v.get('entry'):
                # No unguarded duplicated external entrance on the new level.
                continue
            upper.append(v)
        plan[group].extend(upper)
    # Both floors retain the same footprint; upper void is not net floor area.
    x,y,xx,yy=local_rect.bounds;landing=affinity.rotate(box(x,yy-900,xx,yy),angle,origin=(0,0))
    for level,shape in [('level-0',reservation),('level-1',landing)]:
        plan['spaces'].append(dict(id='stairs-'+level,level_id=level,kind='stair',name=NAMES[lang]['stair'],boundary_xy_mm=[list(p) for p in list(shape.exterior.coords)[:-1]],wall_ids=[],ceiling_height=q(2600),geometry_status='estimated',locked_boundary=False))
    # The old enclosing walls remain; no structural demolition is asserted.
    plan['levels']=[dict(id='level-0',name={'tr':'Alt kat','nl':'Beneden','fr':'Rez-de-chaussée','de':'Erdgeschoss'}[lang],elevation=q(0)),dict(id='level-1',name={'tr':'Üst kat','nl':'Boven','fr':'Étage','de':'Obergeschoss'}[lang],elevation=q(2800))]
    stair=dict(id='stair-connection',from_level_id='level-0',to_level_id='level-1',
      width_mm=900,riser_mm=175,tread_mm=280,riser_count=16,flights=[dict(risers=8,goings=7),dict(risers=8,goings=7)],
      landing_depth_mm=900,landing_width_mm=1900,footprint_xy_mm=[list(p) for p in list(rect.exterior.coords)[:-1]],
      upper_landing_xy_mm=[list(p) for p in list(landing.exterior.coords)[:-1]],
      reserved_polygon_xy_mm=[list(p) for p in list(reservation.exterior.coords)[:-1]],
      upper_void_xy_mm=[list(p) for p in list(reservation.difference(landing).exterior.coords)[:-1]],orientation_deg=angle,
      access_space_ids=[living['id'],'upper-'+living['id']],status='user_requested_concept_requires_structural_and_headroom_survey',headroom_mm=None)
    plan['stairs']=[stair]
    return dict(kind='propose_second_floor_and_stair',source_is_multistorey=False,repeat_of_level='level-0',floor_rise_mm=2800,stair=stair,
      original_space_id=living['id'],original_boundary=original_boundary,
      upper_entry_infill_source_openings=sorted({o['source_opening_id'] for o in lower['openings'] if o.get('entry')}),
      approval='concept_only_no_structural_permission',reason='Fictional user requests two levels; real source provides one floor only.')

def build(source_dir):
    idx=sqlite3.connect(source_dir/'index.sqlite') if source_dir else None
    stream=(source_dir/'plans.jsonl').open('rb') if source_dir else None
    FIX.mkdir(parents=True,exist_ok=True)
    for i,(unit,(country,city,lang)) in enumerate(zip(IDS,CITIES),1):
        if source_dir:
            off,length=idx.execute('select offset,length from plans where id=?',('sd-'+unit,)).fetchone();stream.seek(off);raw=json.loads(stream.read(length))
        else:raw=json.loads((FIX/('sd-'+unit+'.json')).read_text(encoding='utf-8'))
        fixture=dict(id=raw['id'],plan=raw['plan'],geometry=raw['geometry'])
        dump(FIX/(raw['id']+'.json'),fixture)
        plan,transform=normalize(raw);node_walls(plan)
        original=copy.deepcopy(plan)
        operations=[transform,dict(kind='node_compatibility_wall_axes',meaning='Intersections become shared endpoints; source room polygons unchanged.')]
        if not any(s['kind']=='living' for s in plan['spaces']):
            room=max((s for s in plan['spaces'] if s['kind']=='other'),key=area)
            operations.append(dict(kind='confirm_room_use',space_id=room['id'],before='other',after='living',basis='fictional_user_confirms_use_in_conversation'))
            room['kind']='living'
        for s in plan['spaces']:
            if s['kind']=='other':
                operations.append(dict(kind='confirm_room_use',space_id=s['id'],before='other',after='bedroom',basis='fictional_user_confirms_use_in_conversation'));s['kind']='bedroom'
        if i in DUPLEX:operations.append(add_duplex(plan,lang))
        for s in plan['spaces']:s['name']=NAMES[lang][s['kind']]+(' '+s['id'].split('-')[-1] if s['kind']=='bedroom' else '')
        plan.update(schema_version='0.1',project_id=f'ev-sohbet-02-{i:02}',revision=2,example_only=True,language=dict(customer=lang,designer='tr'))
        plan['brief']['goals']=[];plan['notes']=[];plan['issues']=[];plan['connections']=[];plan['finishes']=[]
        plan['dwelling']=dict(kind='terraced_house_concept' if i in DUPLEX else 'apartment',source_country='CH',scenario_country=country,existing_house_claim=False)
        record=dict(id=f'ev-sohbet-02-{i:02}',country=country,city=city,language=lang,
           source=dict(dataset='Swiss Dwellings',version='3.0.0',id=raw['id'],license='CC BY 4.0',doi='10.5281/zenodo.7788422',
             attribution=raw['geometry']['attribution'],fixture='kaynaklar/'+raw['id']+'.json',fixture_sha256=sha(fixture),
             geographic_transfer='Swiss reference geometry; fictional local scenario, not a measured home in this city',multi_floor_source=False),
           source_plan=original,operations=operations,plan=plan,dialogue=[],claimed_net_area_m2=round(net(plan),1),
           area_definition='Sum of net interior room polygons incl. lower stair and upper landing; excludes balconies/terraces and upper stair void.',
           source_exceptions=[],layout_requests=[],layout_results=[],training_started=False)
        dump(OUT/(record['id']+'.json'),record)
        print(record['id'],round(net(plan),1),len(plan['spaces']),flush=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source',type=Path,help='Omit to replay the 20 committed licensed fixtures');build(p.parse_args().source)
