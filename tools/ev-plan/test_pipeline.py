"""Adversarial geometric/contract tests; run with unittest discover."""
import copy
import unittest
from common import FAMILIES
from generator import generate
from validate import validate, validator, fast_validator
from evaluate import execute, score
from compat import viewer_plan, migrate_v01


class PlanTests(unittest.TestCase):
    def assertCode(self,plan,code):
        result=validate(plan)
        self.assertFalse(result['valid'])
        self.assertIn(code,[e['code'] for e in result['errors']])

    def test_families_and_sizes(self):
        for family in FAMILIES:
            for beds in (1,5):
                with self.subTest(family=family,beds=beds):
                    result=validate(generate(family,beds,10002))
                    self.assertTrue(result['valid'],result['errors'])
                    self.assertTrue(validator().is_valid(generate(family,beds,10002)))

    def test_outside_opening(self):
        p=generate();p['openings'][0]['offset_from_wall_start']['value']=999999
        self.assertCode(p,'opening_bounds')

    def test_duplicated_wall(self):
        p=generate();w=copy.deepcopy(p['walls'][0]);w['id']='duplicate';p['walls'].append(w)
        self.assertCode(p,'wall_duplicate')

    def test_open_room(self):
        p=generate();p['spaces'][0]['wall_ids'].pop()
        self.assertCode(p,'room_open')

    def test_self_intersecting_room(self):
        p=generate();p['spaces'][0]['boundary_xy_mm']=[[0,0],[1000,1000],[1000,0],[0,1000]]
        self.assertCode(p,'polygon')

    def test_crossing_wall(self):
        p=generate();w=copy.deepcopy(p['walls'][0]);w.update(id='cross',from_xy_mm=[100,-100],to_xy_mm=[100,100]);p['walls'].append(w)
        self.assertCode(p,'wall_crossing')

    def test_entry_missing(self):
        p=generate()
        for o in p['openings']:o['entry']=False
        self.assertCode(p,'unreachable')

    def test_false_route(self):
        p=generate();p['connections'][0]['opening_id']='nonexistent'
        self.assertCode(p,'route_ref')

    def test_stair_wrong_rise(self):
        p=generate('duplex');p['stairs'][0]['riser_count']=12
        self.assertCode(p,'stair_rise')

    def test_stair_wrong_floor(self):
        p=generate('duplex');p['stairs'][0]['to_level_id']='missing'
        self.assertCode(p,'stair_level')

    def test_stair_void_small(self):
        p=generate('detached_3');p['stairs'][0]['slab_opening_xy_mm']=[[0,0],[10,0],[10,10],[0,10]]
        self.assertCode(p,'stair_void')

    def test_bedroom_count(self):
        p=generate();p['dwelling']['bedroom_count']=1
        self.assertCode(p,'bedrooms')

    def test_dark_habitable_room(self):
        p=generate();p['openings']=[o for o in p['openings'] if o['kind']!='window']
        self.assertCode(p,'daylight_proxy')

    def test_invalid_parcel(self):
        p=generate('detached_2');p['site']['parcel_boundary_xy_mm']=[[0,0],[10,0],[10,10],[0,10]]
        self.assertCode(p,'site_bounds')

    def test_unknown_measure(self):
        p=generate();p['walls'][0]['height']['value']=None
        self.assertCode(p,'unknown_measure')

    def test_nonfinite(self):
        p=generate();p['spaces'][0]['boundary_xy_mm'][0][0]=float('nan')
        self.assertCode(p,'nonfinite')

    def test_bad_model_format(self):
        self.assertFalse(score({'expected':{}},'[]')['format_valid'])

    def test_stale_edit(self):
        p=generate()
        with self.assertRaises(ValueError):execute(dict(actions=[dict(type='plan.replace',args=dict(family='corridor',bedrooms=3,seed=0,base_project_id=p['project_id'],expected_revision=99))],reply='Review',requires_designer_review=True),p)

    def test_viewer_and_legacy_migration(self):
        p=generate('duplex');v=viewer_plan(p,'level-0');self.assertEqual(len(v['levels']),1)
        upgraded=migrate_v01(v);self.assertEqual(upgraded['schema_version'],'0.2')
        self.assertFalse(validate(upgraded)['valid']) # migration cannot invent a confirmed entry/height/hinge


if __name__=='__main__':unittest.main()
