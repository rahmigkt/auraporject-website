import hashlib
import importlib.util
import tempfile
from pathlib import Path
import cadquery as cq

spec = importlib.util.spec_from_file_location('gate', Path(__file__).with_name('hardware-gate.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
test_root = Path('../../outputs/hardware-cad/native-test').resolve()
test_root.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(dir=test_root) as directory:
    path = Path(directory) / 'synthetic-control.step'
    cq.exporters.export(cq.Workplane('XY').box(2, 3, 4), str(path))
    row = {'product': 'SYNTHETIC-CONTROL', 'path': str(path),
           'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    flags = ('units_mm_verified', 'local_use_permitted', 'sku_identity_verified',
             'mounting_datums_verified', 'rigid_members_verified',
             'closed_stop_verified', 'motion_law_verified')
    row.update({key: True for key in flags})
    result = gate.load_member(row, row['product'])
    assert result['status'] == 'static_import_only'
    assert result['solids'] == result['fcl_meshes'] == 1
    assert result['motion_verified'] is False
    assert 'product_code_mismatch' in gate.qualify(row, 'OTHER-SKU')
    assert 'cad_hash_mismatch' in gate.qualify({**row, 'sha256': '0' * 64}, row['product'])
    for flag in flags:
        assert flag + '_missing' in gate.qualify({**row, flag: False}, row['product'])
    assert 'cad_file_missing' in gate.qualify({**row, 'path': str(path) + '.missing'}, row['product'])
print('PASS synthetic STEP -> CadQuery -> FCL static intake; wrong SKU/hash and seven missing qualifications reject; no motion approval')
