"""Fail-closed intake for manufacturer CAD. No conversion of proxy geometry to hardware."""
import hashlib
import json
from pathlib import Path


def qualify(row, expected_product):
    errors = []
    if row.get('product') != expected_product:
        errors.append('product_code_mismatch')
    path = Path(row.get('path', ''))
    if not path.is_file():
        errors.append('cad_file_missing')
    else:
        if hashlib.sha256(path.read_bytes()).hexdigest() != row.get('sha256'):
            errors.append('cad_hash_mismatch')
        if path.suffix.lower() not in ('.step', '.stp'):
            errors.append('unsupported_cad_format_requires_qualified_conversion')
    for name in ('units_mm_verified', 'local_use_permitted', 'sku_identity_verified',
                 'mounting_datums_verified', 'rigid_members_verified',
                 'closed_stop_verified', 'motion_law_verified'):
        if row.get(name) is not True:
            errors.append(name + '_missing')
    return errors


def load_member(row, expected_product):
    errors = qualify(row, expected_product)
    if errors:
        return {'status': 'blocked', 'reasons': errors, 'motion_verified': False}
    import cadquery as cq
    import fcl
    import numpy as np
    solids = cq.importers.importStep(row['path']).solids().vals()
    if not solids or any(not s.isValid() or s.Volume() <= 0 for s in solids):
        raise ValueError('Invalid or empty manufacturer STEP')
    # Static tessellation only. Motion approval additionally needs the separately
    # sourced member transform law; importing a solid never proves its trajectory.
    meshes = []
    for s in solids:
        vertices, triangles = s.tessellate(.05)
        mesh = fcl.BVHModel()
        mesh.beginModel(len(vertices), len(triangles))
        mesh.addSubModel(np.array([v.toTuple() for v in vertices]), np.array(triangles))
        mesh.endModel()
        meshes.append(mesh)
    return {'status': 'static_import_only', 'solids': len(solids),
            'fcl_meshes': len(meshes), 'motion_verified': False}


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('manifest')
    p.add_argument('output')
    args = p.parse_args()
    manifest = json.loads(Path(args.manifest).read_text(encoding='utf-8'))
    report = {'schema': 'aura.hardware-cad-intake/1', 'production_approved': False,
              'real_hardware_motion_verified': False, 'members': []}
    for row in manifest['members']:
        report['members'].append({'expected_product': row['expected_product'],
                                  **load_member(row, row['expected_product'])})
    Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
