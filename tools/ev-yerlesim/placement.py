"""Deterministic polygon/beam furniture solver. The assistant supplies no coordinates."""
import math,json,hashlib
from pathlib import Path
from collections import Counter
from shapely.geometry import Polygon,Point,LineString
from shapely.ops import unary_union

RULES=json.loads(Path(__file__).with_name('rules.json').read_text(encoding='utf8'))
VALUES={r['id']:r.get('value_mm') for r in RULES['rules']}
BY_ID={r['id']:r for r in RULES['rules']}
def digest(v):return hashlib.sha256(json.dumps(v,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
def direction(deg):t=math.radians(deg);return (math.sin(t),-math.cos(t))
def footprint(item):
    x,y=item['xy'];w,d=item['size']['width'],item['size']['depth'];t=math.radians(item['rot']);c,s=math.cos(t),math.sin(t)
    return Polygon([(x+c*w*i/2+s*d*j/2,y+s*w*i/2-c*d*j/2) for i,j in [(-1,-1),(1,-1),(1,1),(-1,1)]])
def local_rect(item,x0,y0,x1,y1):
    x,y=item['xy'];t=math.radians(item['rot']);c,s=math.cos(t),math.sin(t)
    return Polygon([(x+c*a+s*b,y+s*a-c*b) for a,b in [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]])
def use_zones(item,route):
    w,d=item['size']['width'],item['size']['depth'];role=item['role']
    front=max(route,{'sofa':VALUES['sofa-front'],'wardrobe':VALUES['wardrobe-front'],'tv':VALUES['route'],'desk':VALUES['desk-front'],'kitchen':VALUES['kitchen-front'],'basin':VALUES['basin-front'],'bookcase':VALUES['route']}.get(role,VALUES['route']))
    if role=='dining':return [footprint(item).buffer(VALUES['dining-around'],join_style=2)]
    if role=='bed':
        v=max(VALUES['bed-sides-foot'],route)
        return [local_rect(item,-w/2-v,-d/2,-w/2,d/2),local_rect(item,w/2,-d/2,w/2+v,d/2),local_rect(item,-w/2,d/2,w/2,d/2+v)]
    if role in ('coffee','nightstand'):return []
    return [local_rect(item,-w/2,d/2,w/2,d/2+front)]
def opening_zones(room):
    polygon=Polygon(room['boundary']);zones=[];entries=[]
    for opening in room.get('openings',[]):
        a,b=opening['a'],opening['b'];line=LineString([a,b]);length=line.length
        if length<=0:raise ValueError('Zero opening')
        ux,uy=(b[0]-a[0])/length,(b[1]-a[1])/length;nx,ny=-uy,ux
        mid=line.interpolate(.5,normalized=True)
        if not polygon.covers(Point(mid.x+nx*10,mid.y+ny*10)):nx,ny=-nx,-ny
        if opening['kind']=='door':
            if opening.get('hinge') not in ('start','end') or opening.get('swing')!='in':raise ValueError('Clarify door hinge/swing')
            hinge=a if opening['hinge']=='start' else b;sgn=1 if opening['hinge']=='start' else -1
            points=[hinge]+[(hinge[0]+sgn*ux*length*math.cos(t)+nx*length*math.sin(t),hinge[1]+sgn*uy*length*math.cos(t)+ny*length*math.sin(t)) for t in [i*math.pi/64 for i in range(33)]]
            zones.append(('door',Polygon(points)))
            # Preserve a landing inside the leaf sweep as well as a route seed.
            entries.append(Point(mid.x+nx*(length+150),mid.y+ny*(length+150)))
        else:
            depth=VALUES['window-service'];zones.append(('window',Polygon([a,b,(b[0]+nx*depth,b[1]+ny*depth),(a[0]+nx*depth,a[1]+ny*depth)])))
    for radiator in room.get('radiators',[]):zones.append(('radiator',Polygon(radiator)))
    return zones,entries
def relations(items,room,intent):
    errors=[];metrics={};byrole={it['role']:it for it in items}
    if 'sofa' in byrole and 'tv' in byrole:
        sofa,tv=byrole['sofa'],byrole['tv'];sx,sy=direction(sofa['rot']);tx,ty=direction(tv['rot'])
        delta=(tv['xy'][0]-sofa['xy'][0],tv['xy'][1]-sofa['xy'][1]);distance=math.hypot(*delta)
        if not distance:errors.append('focus');return errors,metrics
        angle=math.degrees(math.acos(max(-1,min(1,(sx*delta[0]+sy*delta[1])/distance))))
        opposite=math.degrees(math.acos(max(-1,min(1,(-tx*delta[0]-ty*delta[1])/distance))))
        metrics['sofa_tv_angle_deg']=round(angle,2);metrics['screen_faces_sofa_deg']=round(opposite,2)
        if max(angle,opposite)>BY_ID['conversation-angle']['value_deg']:errors.append('sofa_tv_focus')
        # Screen at TV centre; eye projected to front half of sofa, not body centre.
        eye=(sofa['xy'][0]+sx*sofa['size']['depth']*BY_ID['eye-proxy']['front_depth_fraction'],sofa['xy'][1]+sy*sofa['size']['depth']*BY_ID['eye-proxy']['front_depth_fraction'])
        viewing=math.dist(eye,tv['xy']);minimum=intent.get('screen_height_mm',700)*BY_ID['tv-minimum']['value_4k_height_factor' if intent.get('screen_resolution','4k')=='4k' else 'value_hd_height_factor']
        metrics['viewing_distance_mm']=round(viewing);metrics['tv_minimum_mm']=minimum
        if viewing<minimum:errors.append('tv_distance')
        if intent.get('sofa_not_back_to_window'):
            for op in room.get('openings',[]):
                if op['kind']=='window':
                    mid=LineString([op['a'],op['b']]).centroid;vx,vy=mid.x-sofa['xy'][0],mid.y-sofa['xy'][1]
                    if (sx*vx+sy*vy)<-abs(sx*vy-sy*vx):errors.append('sofa_back_to_window')
    if 'desk' in byrole:
        desk=byrole['desk'];dx,dy=direction(desk['rot']);windows=[LineString([o['a'],o['b']]).centroid for o in room.get('openings',[]) if o['kind']=='window']
        if windows:
            win=min(windows,key=lambda p:p.distance(Point(desk['xy'])));vx,vy=win.x-desk['xy'][0],win.y-desk['xy'][1];n=math.hypot(vx,vy)
            side=abs(dx*vx+dy*vy)/n if n else 1;metrics['desk_window_axial_cosine']=round(side,3)
            if intent.get('desk_side_light') and side>BY_ID['desk-window']['axial_cosine_max_proposal']:errors.append('desk_window_relation')
    return errors,metrics
def validate(room,items,intent=None,complete=True):
    intent=intent or {};route=intent.get('route_mm',600);polygon=Polygon(room['boundary']);errors=[]
    if not polygon.is_valid or polygon.area<=0:return dict(valid=False,errors=['invalid_room_polygon'])
    zones,entries=opening_zones(room);bodies=[footprint(i) for i in items];uses=[use_zones(i,route) for i in items]
    for n,body in enumerate(bodies):
        if room.get('ceiling_height_mm') is not None and items[n]['size']['height']>room['ceiling_height_mm']:errors.append('ceiling_collision:'+items[n]['id'])
        if not polygon.buffer(.01).covers(body):errors.append('outside_room:'+items[n]['id'])
        for name,z in zones:
            if body.intersection(z).area>1:errors.append(name+':'+items[n]['id'])
        for z in uses[n]:
            if not polygon.buffer(.01).covers(z):errors.append('use_clearance_wall:'+items[n]['id'])
        for j in range(n):
            if body.intersection(bodies[j]).area>1:errors.append('collision')
            if any(z.intersection(bodies[j]).area>1 for z in uses[n]) or any(z.intersection(body).area>1 for z in uses[j]):errors.append('use_clearance_product')
    metrics={}
    if complete and not errors:
        rel,metrics=relations(items,room,intent);errors+=rel
        free=polygon.buffer(-route/2+.1).difference(unary_union([p.buffer(route/2-.1,join_style=2) for p in bodies]))
        components=list(free.geoms) if free.geom_type=='MultiPolygon' else [free]
        seed=entries[0] if entries else polygon.representative_point()
        component=next((p for p in components if p.buffer(.2).covers(seed)),None)
        if component is None:errors.append('entry_route_blocked')
        else:
            # Check connection back to each actual doorway, not just an interior seed.
            for op in room.get('openings',[]):
                if op['kind']!='door':continue
                line=LineString([op['a'],op['b']]);mid=line.centroid;nx,ny=-(op['b'][1]-op['a'][1])/line.length,(op['b'][0]-op['a'][0])/line.length
                if not polygon.covers(Point(mid.x+nx*10,mid.y+ny*10)):nx,ny=-nx,-ny
                if line.length<route or not component.buffer(.2).covers(Point(mid.x+nx*(route/2+5),mid.y+ny*(route/2+5))):errors.append('door_route_disconnected')
            for item in items:
                if item['role'] in ('coffee','nightstand'):continue
                w,d=item['size']['width'],item['size']['depth'];f=direction(item['rot'])
                offset= max(route/2+5,450)
                target=Point(item['xy'][0]+f[0]*(d/2+offset),item['xy'][1]+f[1]*(d/2+offset))
                if not component.buffer(.2).covers(target):errors.append('disconnected_access:'+item['id'])
                if item['role']=='bed':
                    t=math.radians(item['rot']);ax,ay=math.cos(t),math.sin(t)
                    for side in (-1,1):
                        point=Point(item['xy'][0]+side*ax*(w/2+route/2+5),item['xy'][1]+side*ay*(w/2+route/2+5))
                        if not component.buffer(.2).covers(point):errors.append('bed_side_disconnected:'+item['id'])
            metrics['route_width_mm']=route;metrics['free_route_component_m2']=round(component.area/1e6,3)
    return dict(valid=not errors,errors=errors,metrics=metrics,certified=False)
def candidates(room,item,intent):
    p=Polygon(room['boundary']);x0,y0,x1,y1=p.bounds;out=[]
    for rot in (0,90,180,270):
        # Include exact near-wall anchors plus an interior 350 mm lattice.
        w,d=item['size']['width'],item['size']['depth'];hw,hd=(w/2,d/2) if rot%180==0 else (d/2,w/2)
        xs=sorted({x0+hw+30,x1-hw-30,*range(math.ceil(x0+hw+30),math.floor(x1-hw),350)})
        ys=sorted({y0+hd+30,y1-hd-30,*range(math.ceil(y0+hd+30),math.floor(y1-hd),350)})
        for x in xs:
            for y in ys:
                c=dict(item,xy=[round(x,2),round(y,2)],rot=rot)
                if validate(room,[c],intent,complete=False)['valid']:
                    back=direction(rot);distance=p.boundary.distance(Point(x-back[0]*d/2,y-back[1]*d/2))
                    if relations([c],room,intent)[0]:continue
                    c['_cost']=distance/1000;c['_body']=footprint(c);c['_use']=use_zones(c,intent.get('route_mm',600));out.append(c)
    return sorted(out,key=lambda c:(c['_cost'],c['rot'],c['xy']))
def solve(room,products,intent=None,count=3):
    intent=intent or {};route=intent.get('route_mm',600)
    allowed={'route_mm','sofa_not_back_to_window','desk_side_light','screen_height_mm','screen_resolution','intent_only','requires_designer_review'}
    if set(intent)-allowed:raise ValueError('Intent cannot contain coordinates or unknown fields')
    if type(route) not in (int,float) or route<=0 or not math.isfinite(route):raise ValueError('Invalid route')
    if not products:return dict(status='clarify',options=[],reason='No selected furniture')
    for item in products:
        if any(type(item['size'].get(k)) not in (int,float) or not math.isfinite(item['size'][k]) or item['size'][k]<=0 for k in ('width','depth','height')):raise ValueError('Invalid product size')
    opening_zones(room) # Unknown hinge/swing must not be silently guessed.
    ordered=sorted(products,key=lambda i:-(i['size']['width']*i['size']['depth']))
    if len({i['id'] for i in products})!=len(products):raise ValueError('Duplicate item id')
    pools={i['id']:candidates(room,i,intent) for i in ordered};beam=[([],0)];rejected=Counter()
    for item in ordered:
        nexts=[]
        for previous,cost in beam:
            for candidate in pools[item['id']]:
                group=previous+[candidate]
                if any(candidate['_body'].intersection(p['_body']).area>1 or any(z.intersection(p['_body']).area>1 for z in candidate['_use']) or any(z.intersection(candidate['_body']).area>1 for z in p['_use']) for p in previous):
                    rejected['collision_or_use_clearance']+=1;continue
                # Early focus pruning when a relation pair has been placed.
                errs,_=relations(group,room,intent)
                if errs:rejected.update(errs);continue
                nexts.append((group,cost+candidate['_cost']))
        nexts.sort(key=lambda g:g[1]);beam=nexts[:100]
        if not beam:break
    options=[]
    for group,cost in beam:
        checked=validate(room,group,intent)
        if not checked['valid']:rejected.update(checked['errors']);continue
        signature=[(i['id'],i['xy'],i['rot']) for i in group]
        if options and any(max(math.dist(a['xy'],next(b for b in o['items'] if b['id']==a['id'])['xy']) for a in group)<500 for o in options):continue
        clean=[{k:v for k,v in i.items() if not k.startswith('_')} for i in group]
        options.append(dict(items=clean,score=round(max(0,100-cost),3),score_kind='AURA soft wall anchoring; not learned aesthetics',validation=checked,signature=digest(signature)))
        if len(options)==count:break
    return dict(status='options' if len(options)>=count else 'clarify',options=options if len(options)>=count else [],
        reason=None if len(options)>=count else 'No three verified arrangements found; reduce items or obtain clearer measurements; do not relax constraints silently',
        diagnostics=dict(candidate_counts={k:len(v) for k,v in pools.items()},rejected=dict(rejected)),rules_version=RULES['version'])
