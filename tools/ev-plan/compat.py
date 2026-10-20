"""Explicit viewer-only downgrade; never silently drops upper floors."""
import argparse
import copy
from shapely.ops import polygonize, unary_union
from shapely.geometry import LineString, Polygon
from common import DATA, read, write, points


def viewer_plan(plan, level_id):
    old=read(DATA/'ev-projesi.schema.json');out={k:copy.deepcopy(v) for k,v in plan.items() if k in old['properties']}
    out['schema_version']='0.1'
    ss=[s for s in plan['spaces'] if s['level_id']==level_id]
    if not ss:raise ValueError('Unknown level')
    ids={s['id'] for s in ss};wid={w for s in ss for w in s['wall_ids']}
    def fields(value,definition):return {k:copy.deepcopy(v) for k,v in value.items() if k in old['$defs'][definition]['properties']}
    out['spaces']=[fields(s,'space') for s in ss]
    for s in out['spaces']:
        if s['kind'] in ('stair','balcony','terrace'):s['kind']='other'
    out['walls']=[fields(w,'wall') for w in plan['walls'] if w['id'] in wid]
    out['openings']=[fields(o,'opening') for o in plan['openings'] if o['wall_id'] in wid]
    out['levels']=[{k:v for k,v in level.items() if k!='floor_height'} for level in plan['levels'] if level['id']==level_id]
    out['connections']=[r for r in plan['connections'] if r['from_space_id'] in ids and r['to_space_id'] in ids]
    out['evidence']=[dict(e,space_ids=[sid for sid in e['space_ids'] if sid in ids]) for e in out['evidence']]
    out['notes'].append(dict(id='viewer-loss',original='VIEWER ONLY: selected floor; stairs, site, nodes, columns and door hinge metadata removed. Not a v0.2 round-trip or construction record.',original_language='en',turkish_translation=None,translation_status='not_requested'))
    return out


def migrate_v01(plan):
    """Migrate reviewed legacy axis geometry; new safety-relevant data stays unknown."""
    if plan['schema_version']!='0.1':raise ValueError('Expected v0.1')
    from jsonschema import Draft202012Validator
    Draft202012Validator(read(DATA/'ev-projesi.schema.json')).validate(plan)
    out=copy.deepcopy(plan);out['schema_version']='0.2';out.update(nodes=[],stairs=[],columns=[],kitchens=[],site=None)
    out['dwelling']=dict(kind='apartment',bedroom_count=sum(s['kind']=='bedroom' for s in out['spaces']),family='legacy_import',north_deg=0)
    nodes={}
    for level in out['levels']:level['floor_height']=dict(value=None,unit='mm',status='unknown',evidence_ids=[],uncertainty=None)
    for w in out['walls']:
        for attr,key in [('from_node_id','from_xy_mm'),('to_node_id','to_xy_mm')]:
            nk=(w['level_id'],tuple(w[key]))
            if nk not in nodes:
                nid='node-'+str(len(nodes));nodes[nk]=nid;out['nodes'].append(dict(id=nid,level_id=w['level_id'],xy_mm=w[key]))
            w[attr]=nodes[nk]
        heights=[s['ceiling_height']['value'] for s in out['spaces'] if s['id'] in w['space_ids']]
        w['height']=dict(value=max(heights),unit='mm',status='photo_estimate',evidence_ids=[],uncertainty=None)
        w['exterior']=len(w['space_ids'])==1
    wm={w['id']:w for w in out['walls']}
    for s in out['spaces']:
        polys=list(polygonize(unary_union([LineString([wm[wid]['from_xy_mm'],wm[wid]['to_xy_mm']]) for wid in s['wall_ids']])))
        center=Polygon(s['boundary_xy_mm']).representative_point();matches=[p for p in polys if p.covers(center)]
        if len(matches)!=1:raise ValueError('Legacy axis boundary cannot be unambiguously reconstructed: '+s['id'])
        s['axis_boundary_xy_mm']=points(matches[0])
    for o in out['openings']:
        o.update(level_id=wm[o['wall_id']]['level_id'],hinge='unknown',opens_to_space_id=None,entry=False)
    out['status']='survey';out['review'].update(state='awaiting_designer',designer_id=None,designer_approval_revision=None)
    out['notes'].append(dict(id='migration-review',original='Migration requires entry-door confirmation, hinge direction, floor height and dwelling type review. No legal or geometric approval transferred.',original_language='en',turkish_translation=None,translation_status='not_requested'))
    return out


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('plan');ap.add_argument('output');ap.add_argument('--level');ap.add_argument('--migrate',action='store_true');a=ap.parse_args()
    write(a.output,migrate_v01(read(a.plan)) if a.migrate else viewer_plan(read(a.plan),a.level))
