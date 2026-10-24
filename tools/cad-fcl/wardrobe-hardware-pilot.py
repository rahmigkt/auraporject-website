"""Real manufacturer STEP placement diagnostics; never asserts a hardware motion law.

Uses frozen stock meshes. No original design/recipe or native392-cut regeneration.
Output preview geometry is LOCAL ONLY; do not commit/distribute manufacturer meshes.
"""
import argparse
import importlib.util
import json
import math
from pathlib import Path
import zipfile
import cadquery as cq
import numpy as np
import fcl
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.GeomAbs import GeomAbs_Cylinder

spec = importlib.util.spec_from_file_location('stock_pilot', Path(__file__).with_name('pilot.py'))
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)


def tessellate(s):
    v, t = s.tessellate(.12)
    return np.array([x.toTuple() for x in v]), np.array(t, dtype=np.int32)


def matrix(r, pos):
    m = np.eye(4); m[:3, :3] = r; m[:3, 3] = pos
    return m.tolist()


def transformed(v, r, pos):
    return v @ r.T + pos


def overlap(a, b):
    return bool(np.all(a[1] >= b[0]) and np.all(b[1] >= a[0]))


def cylinders(s):
    rows=[]
    for face in s.Faces():
        a=BRepAdaptor_Surface(face.wrapped)
        if a.GetType()!=GeomAbs_Cylinder:continue
        c=a.Cylinder();v=c.Axis().Direction();at=c.Location()
        rows.append({'r':c.Radius(),'at':np.array([at.X(),at.Y(),at.Z()]),'axis':np.array([v.X(),v.Y(),v.Z()])})
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('workspace')
    args = parser.parse_args()
    root = Path(args.workspace).resolve(); out = root / 'outputs/hardware-cad-assembly'
    data = json.loads((root / 'outputs/cad-fcl-pilot/input.json').read_text(encoding='utf-8'))
    baseline = json.loads((root / 'outputs/cad-fcl-pilot/run/report.json').read_text(encoding='utf-8'))
    stock_ids = {x['id'] for x in baseline['parts']}
    assert len(stock_ids) == 40 and baseline['input_sha256'] == data['input_sha256']
    parts = {x['id']: x for x in data['compiled']['parts']}
    records = {x['id']: x for x in data['manufacturing']['parts']}
    z = zipfile.ZipFile(root / 'outputs/yerel-inceleme/GARDIROP-v5-3B.zip')
    assert z.testzip() is None and p.digest(root / 'outputs/yerel-inceleme/GARDIROP-v5-3B.zip') == baseline['baseline_zip_sha256']
    assembly = json.loads(z.read('assembly.json'))['assembly']
    assert json.loads(z.read('design.json')) == data['design']
    mesh_data = {}; instances = []; stock_objects = []
    def mesh(key, vertices, faces):
        mesh_data[key] = {'positions': vertices.reshape(-1).round(5).tolist(), 'indices': faces.reshape(-1).tolist()}
    for q in assembly:
        if q['id'] not in stock_ids: continue
        source = parts[q['id']]
        assert q['position_mm'] == source['pos'] and q['rotation_rad'] == source['rot']
        v, f, _ = p.mesh_stl(z.read(q['file'])); r = p.rotation(q['rotation_rad']); pos = np.array(q['position_mm'])
        world = transformed(v, r, pos); geometry = p.fcl_mesh(world, f)
        stock_objects.append((q['id'], world.min(0), world.max(0), fcl.CollisionObject(geometry)))
        mesh(q['id'], world, f)
        instances.append({'id': q['id'], 'mesh': q['id'], 'matrix': np.eye(4).tolist(), 'color': '#c2ad8b', 'group': 'wood', 'motion': 0})
    sources = {'9221544': root / 'outputs/hardware-cad-bulk/9221544.stp',
               '9071205': out / '9071205.stp', '9071575': out / '9071575.stp'}
    native = {}; source_summary = []
    for sku, path in sources.items():
        assert 'MILLI' in path.read_text(errors='replace').upper()
        solids = cq.importers.importStep(str(path)).solids().vals()
        assert solids and all(s.isValid() and s.Volume() > 0 for s in solids)
        native[sku] = []
        for i, solid in enumerate(solids):
            v, f = tessellate(solid); key = sku + '-' + str(i); mesh(key, v, f); native[sku].append((solid, v, f, key))
        source_summary.append({'sku': sku, 'sha256': p.digest(path), 'solids': len(solids), 'valid': True})
    assert len(native['9221544']) == 6 and len(native['9071205']) == len(native['9071575']) == 1
    features=cylinders(native['9221544'][0][0])
    major=sorted({round(c['at'][1],4) for c in features if abs(c['axis'][0])>.99 and abs(c['r']-3.2)<.001})
    selected=[v for v in major if v==min(major) or v>100]
    rear=max(c['at'][1] for c in features if abs(c['axis'][0])>.99 and abs(c['r']-2.2)<.001)
    assert len(selected)==4
    hinge_features=cylinders(native['9071205'][0][0])
    fixing=sorted({round(c['at'][2],4) for c in hinge_features if abs(c['axis'][1])>.99 and abs(c['r']-2.6)<.001})
    assert len(fixing)==2 and abs(fixing[1]-fixing[0]-52)<.001
    assert any(abs(c['r']-17.5)<.001 for c in hinge_features)
    r = np.array([[1., 0, 0], [0, 0, 1], [0, -1, 0]])
    hardware = []; runner_rows = []
    for runner in [x for x in parts.values() if x['role'] == 'runner']:
        left = runner['id'].endswith('L'); side = -1 if left else 1
        rec = next(x for x in data['manufacturing']['runner_drilling'] if x['runner'] == runner['id'])
        support=parts[rec['support']]
        face=support['pos'][0]-side*support['geom']['w']/2
        proxy_face=runner['pos'][0]+side*6.35
        pilots = [o for o in records[rec['support']]['operations'] if o['kind'] == 'runner_cabinet_pilot' and o['mate'] == runner['id']]
        assert pilots and all(abs(o['world_center_mm'][0]-face)<1e-8 for o in pilots)
        base_x = 0 if left else 562
        translation = np.array([face - base_x, pilots[0]['world_center_mm'][1], rec['reference_world_z_mm']-10])
        # Native outer front Y=-8 -> source proxy front Z=pos.z+250.
        for member, motion in [(0, 0), (1, 1), (2, .5)]:
            s, v, f, key = native['9221544'][member + (0 if left else 3)]
            ident = runner['id'] + ['-fixed', '-inner', '-carrier'][member]
            world = transformed(v, r, translation)
            hardware.append({'id': ident, 'vertices': world, 'faces': f, 'motion': motion})
            instances.append({'id': ident, 'mesh': key, 'matrix': matrix(r, translation), 'color': '#417f97' if not motion else '#dc873c', 'group': 'runner', 'motion': motion})
        actual = sorted(rec['reference_world_z_mm'] - o['world_center_mm'][2] for o in pilots)
        offset=rec['reference_world_z_mm']-translation[2]
        cad = [round(y+offset,4) for y in selected+[rear]]
        runner_rows.append({'runner': runner['id'], 'current_sku': '9221528', 'candidate_sku': '9221544',
                            'actual_support_face_x_mm':face,'rounded_proxy_face_x_mm':proxy_face,
                            'corrected_proxy_datum_delta_mm':round(face-proxy_face,6),
                            'current_pilot_offsets_mm': actual, 'cad_selected_hole_offsets_mm': cad,
                            'delta_mm': [round(b-a, 4) for a,b in zip(actual,cad)],
                            'scope': 'Native circular mounting axes mapped with nominal cabinet datum; not closed stop qualification',
                            'drop_in_compatible': False})
    # Nominal alternative pose only: cup depth and axis orient into the existing door.
    # The manufacturer STEP is one fused solid, no rigid member kinematics supplied.
    hinge_rows = []
    for h in data['manufacturing']['hinge_hardware']:
        cup = np.array(h['cup_world_mm'], dtype=float); plate = np.array(h['plate_datum_world_mm'], dtype=float)
        left = cup[0] > plate[0]; sign = 1 if left else -1
        cup[0] -= sign * 1.5  # C6 -> C4.5, D0, B12.5, same overlay17.
        hr = np.array([[-sign, 0., 0.], [0., 0., -sign], [0., -1., 0.]])
        pr = np.array([[sign, 0., 0.], [0., 0., sign], [0., -1., 0.]])
        assert abs(np.linalg.det(hr)-1)<1e-9 and abs(np.linalg.det(pr)-1)<1e-9
        for sku, rot, at, suffix in [('9071205',hr,cup,'-sensys'),('9071575',pr,plate,'-plate')]:
            s,v,f,key = native[sku][0]; ident=h['hinge']+suffix;world=transformed(v,rot,at)
            hardware.append({'id':ident,'vertices':world,'faces':f,'motion':0})
            instances.append({'id':ident,'mesh':key,'matrix':matrix(rot,at),'color':'#b877a2','group':'hinge','motion':0})
        hinge_rows.append({'hinge':h['hinge'],'candidate':'9071205 + 9071575','cup_world_mm':cup.tolist(),
                           'trial_cup_edge_mm':4.5,'trial_overlay_mm':17,'trial_plate_distance_mm':0,
                           'old_fixing_pitch_mm':45,'new_fixing_pitch_mm':52,
                           'old_mounting_holes_mm':5,'new_plate_screw_mm':4.5,
                           'drop_in_compatible':False,'motion_verified':False,
                           'reason':'Different cup/pilot/plate machining; original stock has old holes. Source pose and four-bar law not qualified.'})
    collisions = []; queries = 0
    for travel in (0, 50, 100, 200, 300, 400, 500):
        state=[]
        for q in hardware:
            if travel and '-sensys' in q['id'] or travel and '-plate' in q['id']: continue
            v=q['vertices']+np.array([0.,0.,travel*q['motion']]); geom=p.fcl_mesh(v,q['faces']);obj=fcl.CollisionObject(geom)
            for ident, lo, hi, stock_obj in stock_objects:
                shift = travel if ident.startswith(('b3c1-idrawer1','b3c1-idrawer2')) else 0
                delta=np.array([0.,0.,shift])
                if not overlap((v.min(0),v.max(0)),(lo+delta,hi+delta)): continue
                stock_obj.setTransform(fcl.Transform(delta));queries+=1
                result=fcl.CollisionResult();fcl.collide(obj,stock_obj,fcl.CollisionRequest(),result)
                if result.is_collision:state.append({'hardware':q['id'],'stock':ident})
                stock_obj.setTransform(fcl.Transform())
        collisions.append({'assumed_translation_mm':travel,'contacts':state,'contact_count':len(state)})
    # Positive control: actual CAD fixed rail shifted2mm into a solid receiving coupon.
    q=hardware[0];v=q['vertices']+[-2.,0.,0.];lo=q['vertices'].min(0);hi=q['vertices'].max(0)
    coupon=fcl.CollisionObject(fcl.Box(10,20,20),fcl.Transform(np.array([lo[0]-5, (lo[1]+hi[1])/2, (lo[2]+hi[2])/2])))
    result=fcl.CollisionResult();fcl.collide(fcl.CollisionObject(p.fcl_mesh(v,q['faces'])),coupon,fcl.CollisionRequest(),result)
    assert result.is_collision,'Actual hardware mesh positive control failed'
    report={'schema':'aura.hardware-assembly-trial/1','input_sha256':data['input_sha256'],'production_approved':False,
            'real_hardware_motion_verified':False,'status':'candidate_diagnostic_not_drop_in_compatible',
            'sources':source_summary,'stock_parts':40,'cad_instances':len(hardware),'queries':queries,
            'native_feature_checks':{'runner_selected_circular_axes_y_mm':selected+[rear],
                                     'hinge_fixing_axis_z_mm':fixing,'hinge_fixing_pitch_mm':fixing[1]-fixing[0]},
            'runner_fit':runner_rows,'hinge_fit':hinge_rows,'sampled_linear_stress':collisions,
            'actual_mesh_positive_control':True,'continuous_collision_verified':False,
            'limits':['9221544 is an alternative SKU, not automatically9221528.',
                      'Ray member translation0..500 and carrier half-travel are diagnostic assumptions, not manufacturer kinematics.',
                      'Hinge STEP is a single fused solid; pose/source datums and real four-bar trajectory remain unqualified.',
                      'Contacts are mesh surface contacts, not measured penetration volume or certified defects.',
                      'Original40stock meshes retain old machining; different hardware requires a new qualified recipe.',
                      'No load, fastener torque, physical prototype, continuous collision or production approval.']}
    (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    for q in instances:
        if q['id'].startswith(('b3c1-idrawer1','b3c1-idrawer2')) and q['group']=='wood':q['motion']=1
    preview={'schema':'aura.local-hardware-preview/1','input_sha256':data['input_sha256'],'production_approved':False,
             'meshes':mesh_data,'instances':instances,'source':'Manufacturer CAD for internal local inspection only; do not redistribute.'}
    (out/'preview.local.json').write_text(json.dumps(preview,separators=(',',':')),encoding='utf-8')
    print(json.dumps({'cad_instances':len(hardware),'stock_parts':40,'queries':queries,
                      'contacts_by_trial':[(x['assumed_translation_mm'],x['contact_count']) for x in collisions],
                      'motion_verified':False,'report':str(out/'report.json')}),flush=True)


if __name__=='__main__':main()
