"""Original research programs; area targets are proposals, not legal minima."""
from solver.program import TYPES,check


def program(typology='kapali',variant=0):
    if typology not in TYPES:raise ValueError('unknown typology')
    floors=2 if typology in ('dubleks','mustakil') else 1
    beds=2 if typology=='hol' else 2+variant%3;rooms=[];edges=[]
    def add(id,kind,zone,level,area,face='any'):
        rooms.append(dict(id=id,kind=kind,zone=zone,level=level,target_m2=area,face=face))
    for level in range(floors):
        add(f'wet-{level}','kitchen' if level==0 else 'bath','wet',level,12.6)
        add(f'bath-{level}','bath' if level==0 else 'wc','wet',level,12.6)
        if floors>1:add(f'stair-{level}','stair','service',level,15)
        nh=1 if typology=='hol' else 2+((variant//3)%3)
        for j in range(nh):add(f'hall-{level}-{j}','hall','service',level,(16+2*(beds-2))/nh)
        if level==0:
            add('living','living','day',level,24+(variant%4)*2,'south')
            if floors>1:
                add('study-ground','study','day',level,16)
                add('utility-ground','study','service',level,14)
                add('work-ground','study','service',level,14)
        else:add('study-upper','study','night',level,15)
        if level==floors-1:
            for i in range(beds):add(f'bed-{i}','bedroom','night',level,12+(i%2)*2)
        if variant%2 and typology!='hol':
            add(f'pantry-{level}','utility','service',level,9)
        if variant%3==1 and typology!='hol':
            add(f'guest-wc-{level}','wc','wet',level,6)
    # Requested relation is real connectivity, not a room label.
    if variant%2==0:
        add('balcony','balcony','day',0,4);edges.append(['living','balcony'])
    if typology in ('acik','yari_acik'):
        edges.append(['living','wet-0'])
    p=dict(version='0.3',typology=typology,dwelling='detached' if typology in ('mustakil','avlulu') else 'duplex' if floors>1 else 'apartment',
           bedrooms=beds,floors=floors,kitchen='open' if typology=='acik' else 'semi_open' if typology=='yari_acik' else 'closed',
           envelope='l' if typology=='avlulu' else 'notched' if typology=='kose' else 'rectangle',entry='west',living_face='south',
           circulation='foyer' if typology=='hol' else 'segmented',stair='u' if floors>1 else 'none',setback_m=4,
           rooms=rooms,adjacency=edges,forbidden=[['living',f'bed-{i}'] for i in range(beds)],fixed=[],revision=1)
    if typology=='hol':
        targets={'wet-0':14.28,'bath-0':6.84,'hall-0-0':11.64,'living':19.72,'bed-0':16.72,'bed-1':16.72}
        targets['living']+=variant*.5
        for r in rooms:r['target_m2']=targets.get(r['id'],r['target_m2'])
    return check(p)
