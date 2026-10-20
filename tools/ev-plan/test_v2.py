import copy
import unittest
from jsonschema import ValidationError
from solver.program import check,apply_edits,response
from solver.catalog import program
from solver.layout import solve,Unsupported
from metrics import graph,isomorphic,measure,furniture_fit
from validate import validate
from shapely.geometry import box


class ProgramTests(unittest.TestCase):
    def test_contract_rejects_raw_coordinates(self):
        p=program();p['walls']=[]
        with self.assertRaises(ValidationError):check(p)

    def test_duplicate_room(self):
        p=program();p['rooms'].append(copy.deepcopy(p['rooms'][0]))
        with self.assertRaises(ValueError):check(p)

    def test_bad_adjacency(self):
        p=program();p['adjacency'].append(['living','missing'])
        with self.assertRaises(ValueError):check(p)

    def test_conflicting_edges(self):
        p=program();p['adjacency'].append(['living','bed-0'])
        with self.assertRaises(ValueError):check(p)

    def test_edit_immutable_and_stale(self):
        p=program();before=copy.deepcopy(p)
        edited=apply_edits(p,[dict(op='resize',room_id='living',target_m2=32)],1)
        self.assertEqual(p,before);self.assertEqual(edited['revision'],2)
        with self.assertRaises(ValueError):apply_edits(edited,[],1)

    def test_kitchen_edit_changes_connectivity(self):
        p=program();edited=apply_edits(p,[dict(op='kitchen',value='open')],1)
        self.assertIn(['living','wet-0'],edited['adjacency'])
        plan=solve(edited,limit=1,attempts=2)[0]
        self.assertTrue(any(o['kind']=='passage' for o in plan['openings']))

    def test_nonfinite_program(self):
        p=program();p['rooms'][0]['target_m2']=float('nan')
        with self.assertRaises(ValueError):check(p)

    def test_model_cannot_approve(self):
        with self.assertRaises(ValueError):response(dict(status='program',plan_program=program(),operations=[],reply='ok',requires_designer_review=False))

    def test_missing_info_no_geometry(self):
        response(dict(status='clarify',plan_program=None,operations=[],reply='Ölçüler nedir?',requires_designer_review=True))
        with self.assertRaises(ValueError):response(dict(status='clarify',plan_program=program(),operations=[],reply='?',requires_designer_review=True))

    def test_unsupported_not_silent(self):
        for field,value in [('envelope','u'),('entry','east'),('living_face','north')]:
            p=program();p[field]=value
            with self.assertRaises(Unsupported):solve(p)
        p=program('dubleks');p['stair']='straight'
        with self.assertRaises(Unsupported):solve(p)

    def test_real_fixed_references_not_ignored(self):
        p=program();p['fixed']=[dict(id='col-1',kind='column',evidence_id='survey-1')]
        with self.assertRaises(Unsupported):solve(p)


class GeometryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=program('acik');cls.plan=solve(cls.p,limit=1,attempts=2)[0]

    def test_open_kitchen_has_real_passage(self):
        self.assertTrue(validate(self.plan)['valid'])
        self.assertTrue(any(o['kind']=='passage' and set(o['space_ids'])=={'living','wet-0'} for o in self.plan['openings']))

    def test_forbidden_living_bedroom(self):
        self.assertFalse(any({'living','bed-0'}==set(e) for e in graph(self.plan)[1]))

    def test_isomorphism_ignores_ids_and_measures(self):
        k,e=graph(self.plan);ren={s:'renamed-'+s for s in k}
        self.assertTrue(isomorphic((k,e),({ren[s]:kind for s,kind in k.items()},{frozenset(ren[s] for s in edge) for edge in e})))

    def test_different_edges_are_not_diversity_alias(self):
        k,e=graph(self.plan);changed=set(e);changed.pop()
        self.assertFalse(isomorphic((k,e),(k,changed)))

    def test_furniture_pass_and_fail(self):
        self.assertTrue(furniture_fit(box(0,0,3000,3000),'bedroom'))
        self.assertFalse(furniture_fit(box(0,0,2400,6000),'bedroom'))
        self.assertFalse(furniture_fit(box(0,0,3300,3000),'living'))

    def test_night_access_is_separate_metric(self):
        self.assertTrue(all(measure(self.plan,self.p)['night_access_without_living'].values()))

    def test_compact_hall_is_not_long_spine(self):
        p=program('hol');plan=solve(p,limit=1,attempts=2)[0]
        self.assertTrue(validate(plan)['valid'])
        self.assertTrue(any(s['kind']=='hall' and len(s['axis_boundary_xy_mm'])>4 for s in plan['spaces']))

    def test_deterministic_solver(self):
        self.assertEqual(self.plan,solve(self.p,seed=0,limit=1,attempts=2)[0])


if __name__=='__main__':unittest.main()
