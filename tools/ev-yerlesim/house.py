"""Authored synthetic measured-survey fixtures. Never inferred from a photograph."""
import copy
from scenarios import HEIGHTS,ROOM_NAMES,products
COORD='mm; right-handed; x/y floor plane, z up; local origin; glTF adapter converts units and up-axis'
def measure(v,unit='mm'):return dict(value=v,unit=unit,status='synthetic_fixture',evidence_ids=['simulated-survey'],uncertainty=None)
def house(case):
    plan=dict(schema_version='0.1',project_id=case['id'],revision=1,status='designer_review',coordinate_system=COORD,language=dict(customer=case['lang'],designer='tr'),
        brief=dict(whole_home=True,goals=['Simulated measured survey; furniture concept only'],budget=dict(amount=case['budget'],currency='TRY' if case['country']=='TR' else 'GBP' if case['country']=='GB' else 'EUR',includes=['furniture concept; quotation pending'],estimate_status='customer_target'),household_needs=[case['behavior']],style=['japandi',case['scheme']],preserve=[]),
        levels=[],spaces=[],walls=[],openings=[],evidence=[dict(id='simulated-survey',kind='measurement',space_ids=[],private_object_id=None,caption='Authored simulated room/door survey, not a real customer photo or measured national reference',language='en',training_consent=False,synthetic=True)],
        items=[],finishes=[],connections=[],notes=[],issues=[dict(id='designer-final',space_ids=[],kind='design',message='Designer must verify survey, services, stairs, safety, installation and final project. Synthetic furniture screening is not construction approval.',blocking=True,status='open')],review=dict(id='review',state='awaiting_designer',revision=1,designer_id=None,designer_approval_revision=None,blocking_issue_ids=['designer-final']),example_only=True)
    rooms=[];choices=[]
    for floor,kinds in enumerate(case['floors']):
        level=f'level-{floor}';plan['levels'].append(dict(id=level,name=f'Level {floor}',elevation=measure(floor*3000)))
        y=100;hallwidth=1400;hallx=case['width']+300;hallid=level+'-hall';room_ids=[]
        for number,kind in enumerate(kinds):
            sid=f'{level}-{kind}-{number}';w=case['width'];h=HEIGHTS[kind];x=100
            boundary=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]
            wallids=[]
            axes=[[x-100,y-100],[x+w+100,y-100],[x+w+100,y+h+100],[x-100,y+h+100]]
            for j,(aa,bb) in enumerate(zip(axes,axes[1:]+axes[:1])):
                wid=sid+'-wall-'+str(j);wallids.append(wid)
                plan['walls'].append(dict(id=wid,level_id=level,from_xy_mm=aa,to_xy_mm=bb,thickness=measure(200),space_ids=[sid]+([hallid] if j==1 else []),structural_status='synthetic_fixture'))
            door_a=[x+w,y+450];door_b=[x+w,y+1450];window_a=[x,y+h/2+700];window_b=[x,y+h/2-700]
            openings=[dict(kind='door',a=door_a,b=door_b,hinge='start',swing='in'),dict(kind='window',a=window_a,b=window_b)]
            room=dict(id=sid,kind=kind,level_id=level,name=ROOM_NAMES[case['lang']][kind],boundary=boundary,openings=openings,radiators=[])
            # A measured mock radiator below window, 500 mm designer service envelope.
            room['radiators']=[[[x,y+h/2-650],[x+500,y+h/2-650],[x+500,y+h/2+650],[x,y+h/2+650]]]
            rooms.append(room);room_ids.append(sid)
            plan['spaces'].append(dict(id=sid,level_id=level,name=room['name'],kind='living' if kind=='studio' else kind,boundary_xy_mm=boundary,wall_ids=wallids,ceiling_height=measure(2700),geometry_status='synthetic_fixture',locked_boundary=True))
            for tag,wallno,offset,width,sill,height,swing in [('door',1,550,1000,0,2100,'in'),('window',3,h/2-600,1400,900,1400,'fixed')]:
                oid=sid+'-'+tag;plan['openings'].append(dict(id=oid,wall_id=wallids[wallno],kind=tag,space_ids=[sid,hallid] if tag=='door' else [sid],offset_from_wall_start=measure(offset),width=measure(width),height=measure(height),sill_height=measure(sill),swing=swing))
                if tag=='door':plan['connections'].append(dict(id=sid+'-connect',from_space_id=hallid,to_space_id=sid,opening_id=oid,status='synthetic_fixture'))
            choices+=products(case,kind,sid);y+=h+200
        hallboundary=[[hallx,100],[hallx+hallwidth,100],[hallx+hallwidth,y-200],[hallx,y-200]]
        hwall=[]
        # Right exterior and both hall ends; room-side wall pieces already exist.
        for j in (0,1,2):
            aa,bb=hallboundary[j],hallboundary[j+1];wid=hallid+'-wall-'+str(j);hwall.append(wid)
            plan['walls'].append(dict(id=wid,level_id=level,from_xy_mm=aa,to_xy_mm=bb,thickness=measure(100),space_ids=[hallid],structural_status='synthetic_fixture'))
        plan['spaces'].append(dict(id=hallid,level_id=level,name=ROOM_NAMES[case['lang']]['hall'],kind='hall',boundary_xy_mm=hallboundary,wall_ids=hwall,ceiling_height=measure(2700),geometry_status='synthetic_fixture',locked_boundary=True))
        plan['openings'].append(dict(id=hallid+'-entry',wall_id=hwall[0],kind='door',space_ids=[hallid],offset_from_wall_start=measure(200),width=measure(1000),height=measure(2100),sill_height=measure(0),swing='out'))
    if len(case['floors'])>1:plan['notes'].append(dict(id='stairs-pending',original='Both surveyed floor room layouts are supplied separately. Stairwell dimensions and inter-floor passage are NOT validated; reserve designer review, do not infer a staircase from a photo.',original_language='en',turkish_translation='Her iki katın oda krokisi ayrı verildi; merdiven bağlantısı doğrulanmadı.',translation_status='machine_unverified'))
    return plan,rooms,choices

def canonical_items(placed):
    return [dict(id=p['id'],space_id=p['space_id'],category='furniture',label=p['role'],origin=p['origin'],decision='keep' if p['origin']=='existing' else 'proposed',evidence_ids=['simulated-survey'],dimensions={k:measure(v) for k,v in p['size'].items()},position_xyz_mm=p['xy']+[int(p['space_id'].split('-')[1])*3000],rotation_z_deg=p['rot'],placement_status='synthetic_fixture',studio_ref=p['id']) for p in placed]
def viewer(plan,placed,level,scheme):
    out=copy.deepcopy(plan);ids={s['id'] for s in out['spaces'] if s['level_id']==level};out['spaces']=[s for s in out['spaces'] if s['id'] in ids];out['levels']=[l for l in out['levels'] if l['id']==level]
    out['walls']=[w for w in out['walls'] if w['level_id']==level];wid={w['id'] for w in out['walls']};out['openings']=[o for o in out['openings'] if o['wall_id'] in wid];out['connections']=[c for c in out['connections'] if c['from_space_id'] in ids and c['to_space_id'] in ids];out['items']=[i for i in out['items'] if i['space_id'] in ids]
    out['finishes']=[f for f in out['finishes'] if f['space_id'] in ids]
    for space in out['spaces']:space['finish']={f['surface_ref']:f['asset_ref'].split('#')[-1] for f in out['finishes'] if f['space_id']==space['id']}
    lookup={p['id']:p for p in placed}
    for item in out['items']:
        p=lookup[item['id']];item.update(name=item['label'],design=p['design'],pos_xy_mm=p['xy'],rot_deg=p['rot'])
    out['scheme']=scheme;return out
