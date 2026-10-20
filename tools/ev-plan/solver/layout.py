"""Bounded zone slicing search, not an architectural/general CAD solver.

Hard unsupported requests fail explicitly. Area is a soft target; all returned
candidates pass the existing v0.2 geometric validator and explicit program edges.
"""
import copy
import math
import random
from shapely.geometry import Polygon, LineString, box
from shapely.ops import unary_union
from shapely.affinity import scale
from common import measure as m, points, digest
from generator import generate
from validate import validate
from solver.program import check


class Unsupported(ValueError):pass


def solve(program, seed=0, limit=3, attempts=24):
    check(program)
    if program['fixed']:raise Unsupported('Existing wall/shaft/column constraints require measured geometry; not implemented')
    if program['stair'] not in ('none','u'):raise Unsupported('Only U stair is geometrically implemented; other stair types remain pending')
    if program['envelope']=='u':raise Unsupported('U courtyard and internal lightwell routing not implemented')
    if program['circulation']=='foyer' and (program['floors']!=1 or program['bedrooms']!=2):
        raise Unsupported('Compact foyer prototype currently supports one floor and two bedrooms')
    if program['entry']!= 'west' or program['living_face']!='south':
        raise Unsupported('This prototype requires west entry and south living facade; directions are never silently ignored')
    rng=random.Random(seed);out=[];signatures=set();rejected=[]
    for attempt in range(attempts):
        try:
            plan=_candidate(program,rng,attempt)
            result=validate(plan)
            if not result['valid']:
                rejected.extend(e['code'] for e in result['errors']);continue
            actual={frozenset([c['from_space_id'],c['to_space_id']]) for c in plan['connections']}
            actual|={frozenset([s['from_space_id'],s['to_space_id']]) for s in plan['stairs']}
            if not {frozenset(e) for e in program['adjacency']}<=actual:
                rejected.append('required_adjacency');continue
            if actual & {frozenset(e) for e in program['forbidden']}:
                rejected.append('forbidden_adjacency');continue
            if not _faces_match(program,plan):rejected.append('requested_facade');continue
            sig=digest([(s['id'],s['axis_boundary_xy_mm']) for s in plan['spaces']])
            if sig in signatures:continue
            signatures.add(sig);out.append(plan)
            if len(out)>=limit:break
        except (ValueError,IndexError) as exc:rejected.append(str(exc))
    if not out:raise Unsupported('No valid layout in bounded search: '+','.join(sorted(set(rejected))))
    return out


def _faces_match(program,plan):
    for room in program['rooms']:
        if room['face']=='any':continue
        poly=Polygon(next(s for s in plan['spaces'] if s['id']==room['id'])['axis_boundary_xy_mm'])
        found=set()
        for w in plan['walls']:
            if w['exterior'] and room['id'] in w['space_ids']:
                line=LineString([w['from_xy_mm'],w['to_xy_mm']]);mid=line.interpolate(.5,normalized=True)
                # Axis-aligned slicing, facade normal determined by interior point.
                if abs(line.coords[0][0]-line.coords[-1][0])<.1:
                    found.add('east' if mid.x>poly.centroid.x else 'west')
                else:found.add('north' if mid.y>poly.centroid.y else 'south')
        if room['face'] not in found:return False
    return True


def _candidate(p,rng,attempt):
    # Reuse only the schema-complete empty document shell; no v1 room geometry.
    plan=generate('single_room',1,0)
    for k in ('levels','spaces','walls','nodes','openings','connections','stairs','columns','kitchens'):plan[k]=[]
    plan['site']=None;plan['project_id']='v2-'+digest([p,attempt,rng.getstate()[1][:3]])[:16]
    plan['dwelling']=dict(kind=p['dwelling'],bedroom_count=p['bedrooms'],family=p['typology'],north_deg=0,open_kitchen=p['kitchen']=='open')
    polys={};sp={};halls={};bounds=[]
    # Global envelope width from the most populated floor; floor wet/stair positions stay fixed.
    rows={}
    for lev in range(p['floors']):
        rooms=[r for r in p['rooms'] if r['level']==lev and r['kind'] not in ('hall','balcony','terrace')]
        wet=[r for r in rooms if r['kind'] in ('kitchen','bath','wc')]
        stair=[r for r in rooms if r['kind']=='stair']
        others=[r for r in rooms if r not in wet+stair]
        day=[r for r in others if r['zone']=='day'];night=[r for r in others if r['zone']!='day']
        rng.shuffle(night)
        # Stable wet core at west end; opposite sides of the same service spine.
        bottom=wet[:1]+day
        top=wet[1:]+stair
        for r in night:
            target=top if sum(x['target_m2'] for x in top)<=sum(x['target_m2'] for x in bottom) else bottom
            target.append(r)
        if not bottom or not top:raise Unsupported('Need rooms on both sides of spine')
        rows[lev]=[bottom,top]
    depth=4400;hall_depth=1600
    width=max(sum(max(2800,round((r['target_m2']*1e6/4200+200)/100)*100) for r in row) for pair in rows.values() for row in pair)
    # Do not produce below-minimum area by squeezing a requested program.
    width=max(11000,width)
    def add(r,poly):
        inner=poly.buffer(-100,join_style=2)
        if inner.is_empty or inner.geom_type!='Polygon':raise Unsupported('Collapsed slice')
        sid=r['id'];lid='level-'+str(r['level'])
        s=dict(id=sid,level_id=lid,name=NAMES.get(r['kind'],r['kind'])+' · '+sid,
               kind=r['kind'],axis_boundary_xy_mm=points(poly),boundary_xy_mm=points(inner),wall_ids=[],
               ceiling_height=m(2800),geometry_status='synthetic_fixture',locked_boundary=True)
        plan['spaces'].append(s);polys[sid]=poly;sp[sid]=s
    for lev in range(p['floors']):
        lid='level-'+str(lev);plan['levels'].append(dict(id=lid,name='Zemin kat' if lev==0 else f'{lev}. kat',elevation=m(3000*lev),floor_height=m(3000)))
        if p['circulation']=='foyer':
            hs=[r for r in p['rooms'] if r['kind']=='hall'];halls[lev]=hs
            expected={'wet-0','bath-0','living','bed-0','bed-1',hs[0]['id']}
            if len(hs)!=1 or {r['id'] for r in p['rooms'] if r['kind']!='balcony'}!=expected:
                raise Unsupported('Compact foyer room program is not supported')
            dims={'wet-0':box(0,0,3600,4400),'bath-0':box(3600,0,5800,4000),
                  'living':box(5800,0,9200,6000),'bed-0':box(0,6000,4600,10000),
                  'bed-1':box(4600,6000,9200,10000),
                  hs[0]['id']:box(3600,4000,5800,6000).union(box(0,4400,3600,6000))}
            for r in p['rooms']:
                if r['id'] in dims:
                    factor=math.sqrt(next(r for r in p['rooms'] if r['id']=='living')['target_m2']/19.72)
                    add(r,scale(dims[r['id']],xfact=factor,yfact=factor,origin=(0,0)))
        for ri,row in ([] if p['circulation']=='foyer' else enumerate(rows[lev])):
            widths=[max(2800,round((r['target_m2']*1e6/4200+200)/100)*100) for r in row]
            # Anchor wet core and stair across floors; distribute surplus to last living/bed/study.
            widths[-1]+=width-sum(widths);x=0;y=0 if ri==0 else depth+hall_depth
            for j,(r,w) in enumerate(zip(row,widths)):
                poly=box(x,y,x+w,y+depth)
                if p['envelope'] in ('l','notched') and j==len(row)-1 and ri==1:
                    poly=poly.difference(box(x+w-800,y+depth-1200,x+w,y+depth))
                add(r,poly);x+=w
        hs=[r for r in p['rooms'] if r['level']==lev and r['kind']=='hall']
        if not hs:raise Unsupported('An entrance/distribution hall is required')
        halls[lev]=hs
        # Distinct entrance and sleeping wing; additional vestibule / intermediate halls allowed.
        cuts=[round(width*i/len(hs)) for i in range(len(hs)+1)]
        if p['circulation']!='foyer':
            for i,h in enumerate(hs):add(h,box(cuts[i],depth,cuts[i+1],depth+hall_depth))
        for r in [r for r in p['rooms'] if r['level']==lev and r['kind'] in ('balcony','terrace')]:
            relations=[e for e in p['adjacency'] if r['id'] in e]
            if not relations:raise Unsupported('Balcony host required')
            host=next(x for x in relations[0] if x!=r['id']);poly=polys[host];x,y,X,Y=poly.bounds
            # Leave a distinct facade segment for glazing; balcony is an exterior space.
            end=x+min(2200,(X-x)/2)
            if y==0:add(r,box(x, -2200, end, 0))
            elif Y==depth*2+hall_depth:add(r,box(x,Y,end,Y+2200))
            else:raise Unsupported('Balcony host lacks supported outer edge')
        bounds.append(unary_union([poly for sid,poly in polys.items() if sp[sid]['level_id']==lid]))
    # Split every intersection into an explicit shared node/edge.
    for lev in range(p['floors']):
        lid='level-'+str(lev);ss=[s for s in plan['spaces'] if s['level_id']==lid]
        lines=unary_union([polys[s['id']].boundary for s in ss]);nodes={}
        def node(pt):
            key=tuple(pt)
            if key not in nodes:
                nid=f'{lid}-n{len(nodes)}';nodes[key]=nid;plan['nodes'].append(dict(id=nid,level_id=lid,xy_mm=list(pt)))
            return nodes[key]
        for line in lines.geoms:
            for a,b in zip(list(line.coords),list(line.coords)[1:]):
                edge=LineString([a,b]);adj=[s['id'] for s in ss if polys[s['id']].boundary.buffer(.01).covers(edge)]
                wid=f'{lid}-w{len(plan["walls"])}'
                plan['walls'].append(dict(id=wid,level_id=lid,from_xy_mm=list(a),to_xy_mm=list(b),from_node_id=node(a),to_node_id=node(b),thickness=m(200),height=m(2800),space_ids=adj,structural_status='synthetic_fixture',exterior=len(adj)==1))
                for sid in adj:sp[sid]['wall_ids'].append(wid)
        ws=[w for w in plan['walls'] if w['level_id']==lid]
        def opening(w,kind,width,height,sill=0,entry=False):
            length=LineString([w['from_xy_mm'],w['to_xy_mm']]).length
            if width+200>length:raise Unsupported('Opening does not fit slice')
            oid=f'{lid}-o{len(plan["openings"])}'
            plan['openings'].append(dict(id=oid,level_id=lid,wall_id=w['id'],kind=kind,space_ids=w['space_ids'],offset_from_wall_start=m((length-width)/2),width=m(width),height=m(height),sill_height=m(sill),swing='in' if kind=='door' else 'fixed',hinge='start' if kind=='door' else 'none',opens_to_space_id=w['space_ids'][0] if kind=='door' else None,entry=entry))
            if kind in ('door','passage') and len(w['space_ids'])==2:plan['connections'].append(dict(id='route-'+oid,from_space_id=w['space_ids'][0],to_space_id=w['space_ids'][1],opening_id=oid,status='synthetic_fixture'))
        required={frozenset(e) for e in p['adjacency']};forbidden={frozenset(e) for e in p['forbidden']}
        for w in ws:
            ids=w['space_ids'];edge=frozenset(ids)
            if len(ids)==2 and edge not in forbidden:
                kinds=[sp[x]['kind'] for x in ids]
                if 'hall' in kinds or edge in required:
                    length=LineString([w['from_xy_mm'],w['to_xy_mm']]).length
                    if length>=1100:
                        kitchen_link='living' in kinds and 'kitchen' in kinds
                        is_open=kitchen_link and p['kitchen']=='open'
                        opening(w,'passage' if is_open else 'door',min(2600,length-400) if kitchen_link and p['kitchen']!='closed' else 900,2100)
                        if kitchen_link and p['kitchen']=='semi_open':plan['openings'][-1]['swing']='sliding'
        if lev==0:
            h=halls[lev][0]['id']
            w=next(w for w in ws if w['space_ids']==[h] and w['from_xy_mm'][0]==0 and w['to_xy_mm'][0]==0)
            opening(w,'door',1000,2100,entry=True)
        for s in ss:
            if s['kind'] in ('hall','stair','balcony','terrace'):continue
            remaining=Polygon(s['boundary_xy_mm']).area*.11
            for w in sorted((w for w in ws if w['space_ids']==[s['id']]),key=lambda w:-LineString([w['from_xy_mm'],w['to_xy_mm']]).length):
                length=LineString([w['from_xy_mm'],w['to_xy_mm']]).length
                if remaining<=0 or length<1000:continue
                widthw=min(length-400,max(600,math.ceil(remaining/1800/10)*10));opening(w,'window',widthw,1800,700);remaining-=widthw*1800
    for lev in range(p['floors']-1):
        a=next(s for s in plan['spaces'] if s['level_id']==f'level-{lev}' and s['kind']=='stair');b=next(s for s in plan['spaces'] if s['level_id']==f'level-{lev+1}' and s['kind']=='stair')
        if not polys[a['id']].equals(polys[b['id']]):raise Unsupported('Stair slices do not stack')
        x,y,_,_=Polygon(a['boundary_xy_mm']).bounds;foot=points(box(x+50,y+50,x+2450,y+3500))
        plan['stairs'].append(dict(id=f'stair-{lev}',kind='u',from_level_id=a['level_id'],to_level_id=b['level_id'],from_space_id=a['id'],to_space_id=b['id'],riser_count=18,rise_mm=3000/18,going_mm=280,flight_risers=[9,9],width_mm=1100,landing_mm=1100,footprint_xy_mm=foot,slab_opening_xy_mm=foot,headroom_mm=2100))
    for s in plan['spaces']:
        if s['kind']=='kitchen':
            x,y,_,_=Polygon(s['boundary_xy_mm']).bounds
            plan['kitchens'].append(dict(space_id=s['id'],sink_xy_mm=[x+500,y+500],cooktop_xy_mm=[x+2300,y+500],fridge_xy_mm=[x+500,y+2300]))
    if p['dwelling']=='detached':
        ground=bounds[0];x,y,X,Y=ground.bounds;margin=p['setback_m']*1000
        if margin<1000:raise Unsupported('Synthetic garden requires at least 1 m setback; not a legal threshold')
        plan['site']=dict(parcel_boundary_xy_mm=points(box(x-margin,y-margin,X+margin,Y+margin)),building_boundary_xy_mm=points(ground),garden_zones=[dict(id='garden',boundary_xy_mm=points(box(x-margin+100,y-margin+100,x-100,Y+margin-100)))])
    plan['evidence'][0]['space_ids']=list(sp)
    plan['evidence'][0]['caption']='Original synthetic zone-slicing research plan; not measured or approved.'
    return plan


NAMES=dict(living='Salon',bedroom='Yatak odası',kitchen='Mutfak',bath='Banyo',wc='WC',hall='Antre / hol',study='Çalışma',utility='Kiler / servis',balcony='Balkon',terrace='Teras',stair='Merdiven')
