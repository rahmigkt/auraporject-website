"""EV v0.1/v0.2 room to placement input. Missing survey facts are never inferred."""
from shapely.geometry import Polygon,LineString
from shapely.ops import nearest_points
def room_from_ev(plan,space_id,opening_details=None,radiators=None):
    space=next(s for s in plan['spaces'] if s['id']==space_id)
    if space['geometry_status'] not in ('user_measured','designer_verified','synthetic_fixture'):raise ValueError('Measured room outline required')
    polygon=Polygon(space['boundary_xy_mm']);walls={w['id']:w for w in plan['walls']};openings=[]
    for op in plan['openings']:
        if space_id not in op['space_ids']:continue
        wall=walls[op['wall_id']];a,b=wall['from_xy_mm'],wall['to_xy_mm'];line=LineString([a,b]);length=line.length
        if not length:raise ValueError('Invalid wall')
        width,offset=op['width']['value'],op['offset_from_wall_start']['value']
        if width is None or offset is None:raise ValueError('Measured opening required')
        u=[(b[i]-a[i])/length for i in range(2)];points=[[a[i]+u[i]*t for i in range(2)] for t in (offset,offset+width)]
        mid=LineString(points).centroid;nearest=nearest_points(polygon.boundary,mid)[0];shift=[nearest.x-mid.x,nearest.y-mid.y];points=[[p[i]+shift[i] for i in range(2)] for p in points]
        if op['kind']=='door':
            detail=(opening_details or {}).get(op['id'],{});hinge=op.get('hinge',detail.get('hinge'))
            if hinge not in ('start','end') or op['swing']!='in':raise ValueError('Known inward door hinge required for this room adapter')
            openings.append(dict(kind='door',a=points[0],b=points[1],hinge=hinge,swing='in'))
        elif op['kind']=='window':openings.append(dict(kind='window',a=points[0],b=points[1]))
    return dict(id=space_id,kind=space['kind'],name=space['name'],level_id=space['level_id'],boundary=space['boundary_xy_mm'],ceiling_height_mm=space['ceiling_height']['value'],openings=openings,radiators=radiators or [])
