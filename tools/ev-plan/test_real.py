import copy
import json
import math
import unittest
import tempfile
import sqlite3
from pathlib import Path
from shapely.geometry import box,Polygon
from common import ROOT,read,digest,write,compact
from real.geometry import validate_record,adapt
from real.programs import extract
from real.retrieve import match_rooms,ReferenceIndex
from real.swiss import sha_file
from metrics import measure
from real.swiss import opening_members
from solver.program import response,apply_edits

FIXTURES=ROOT/'knowledge/ai-egitim/veri/ev-plan-reel-00d'


class EmpiricalCalibrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.profile=read(FIXTURES/'calibration.json')
        cls.bad=read(FIXTURES/'fixture-00b-wc.json')['plan']

    def test_00b_oversized_wc_is_low(self):
        result=measure(self.bad,self.profile)
        self.assertLess(result['score'],50)
        wc=[e for e in result['evidence'] if e.get('kind')=='wc' and e['metric']=='area_m2']
        self.assertTrue(any(e['value']>10.9 and e['score']<.1 for e in wc))

    def test_no_synthetic_flag_shortcut(self):
        changed=copy.deepcopy(self.bad);changed['example_only']=not changed['example_only']
        self.assertEqual(measure(self.bad,self.profile)['score'],measure(changed,self.profile)['score'])

    def test_no_country_fallback(self):
        self.assertIsNone(measure(self.bad,self.profile,country='BE')['score'])


class RetrievalIntegrationTests(unittest.TestCase):
    """Small repeated fixture tests plumbing, never source diversity or quality."""
    def test_index_hashes_three_options_and_unsupported_scope(self):
        with tempfile.TemporaryDirectory(prefix='ev-real-test-',dir=ROOT) as temp:
            directory=Path(temp);source=read(FIXTURES/'fixture-reference.json')
            db=sqlite3.connect(directory/'index.sqlite')
            db.execute('create table plans (id text,country text,split text,room_count integer,net_area real,building_group text,offset integer,length integer)')
            with (directory/'plans.jsonl').open('wb') as stream:
                for i in range(3):
                    record=copy.deepcopy(source);record['id']='test-fixture-'+str(i);record['building_group']='test-building-'+str(i);record['split']='train'
                    data=(compact(record)+'\n').encode();offset=stream.tell();stream.write(data)
                    db.execute('insert into plans values (?,?,?,?,?,?,?,?)',(record['id'],'CH','train',record['room_count'],record['net_area_m2'],record['building_group'],offset,len(data)))
            db.commit();db.close()
            write(directory/'conversion-manifest.json',dict(test_fixture_only=True,files={name:sha_file(directory/name) for name in ('plans.jsonl','index.sqlite')},code_hashes={}))
            from metrics import features
            distributions={}
            for room in features(source['plan'])['rooms']:
                for field in ('area_m2','width_m'):
                    distributions['CH|single_floor_residential_unit|'+room['kind']+'|'+field]=dict(n=100,p01=0,p05=0,p95=1000,p99=1000)
            profile=dict(source_conversion_hash=sha_file(directory/'conversion-manifest.json'),distributions=distributions)
            index=ReferenceIndex(directory,profile)
            try:
                query=extract(source);query['adjacency']=[];query['entry']=None;query['living_face']=None
                for room in query['rooms']:room['face']='any'
                result=index.retrieve(query,count=3)
                self.assertEqual(result['status'],'options')
                self.assertEqual(len(result['options']),3)
                for option in result['options']:
                    self.assertTrue(validate_record(option['adapted'],option['source'])['valid'])
                self.assertNotEqual(index.retrieve(query,country='BE',count=3)['status'],'options')
                query['dwelling']='detached'
                self.assertEqual(index.retrieve(query,count=3)['status'],'clarify')
            finally:index.close()
            with (directory/'plans.jsonl').open('ab') as stream:stream.write(b'changed')
            with self.assertRaisesRegex(ValueError,'Dataset file changed'):
                ReferenceIndex(directory,profile)

    def test_malformed_model_edit_has_no_executable_action(self):
        for operation in ({'op':'delete_wall','wall_id':'w0'},
                          {'op':'resize','room_id':'r0','target_m2':float('nan')},
                          {'op':'resize','room_id':'r0','target_m2':True},
                          {'op':'kitchen','value':'structural_demolition'},
                          {'op':'resize','room_id':'r0','target_m2':10,'execute':'arbitrary'}):
            with self.subTest(operation=operation),self.assertRaises(ValueError):
                response(dict(status='edit',plan_program=None,operations=[operation],reply='test',requires_designer_review=True))


class RealGeometryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.reference=read(FIXTURES/'fixture-reference.json')

    def test_real_source_valid_and_not_synthetic(self):
        self.assertTrue(validate_record(self.reference)['valid'])
        self.assertFalse(self.reference['plan']['evidence'][0]['synthetic'])
        self.assertEqual(self.reference['geometry']['license'],'CC-BY-4.0')

    def test_unobserved_kitchen_circulation_and_setback_stay_unknown(self):
        reference=copy.deepcopy(self.reference)
        reference['geometry']['features']=[]
        for room in reference['plan']['spaces']:
            if room['kind'] in ('kitchen','hall'):room['kind']='other'
        program=extract(reference)
        self.assertIsNone(program['kitchen'])
        self.assertEqual(program['circulation'],'unknown')
        self.assertIsNone(program['setback_m'])

    def test_metric_scale_and_source_area(self):
        for sid,room in self.reference['geometry']['rooms'].items():
            poly=Polygon(room['polygon_xy_mm'])
            self.assertAlmostEqual(poly.area/1e6,room['source_area_m2'],places=5)

    def test_wrong_units_rejected(self):
        bad=copy.deepcopy(self.reference)
        bad['plan']['spaces'][0]['boundary_xy_mm']=[[x/1000,y/1000] for x,y in bad['plan']['spaces'][0]['boundary_xy_mm']]
        self.assertIn('net_geometry_changed',validate_record(bad)['errors'])

    def test_generic_room_not_a_bedroom(self):
        p=extract(self.reference)
        generic=[sid for sid,r in self.reference['geometry']['rooms'].items() if r['source_label']=='ROOM']
        self.assertTrue(generic)
        self.assertIsNone(p['bedrooms'])
        self.assertTrue(all(next(r for r in p['rooms'] if r['id']==sid)['kind']=='other' for sid in generic))

    def test_no_private_source_fields(self):
        forbidden={'address','apartment_id','site_id','building_id','floor_id','unit_id','area_id','latitude','longitude'}
        def visit(value):
            if isinstance(value,dict):
                self.assertFalse(forbidden & set(value))
                for v in value.values():visit(v)
            elif isinstance(value,list):
                for v in value:visit(v)
        visit(self.reference)

    def test_affine_preserves_topology_and_exact_area_ratio(self):
        r=adapt(self.reference,1.03,.98)
        self.assertTrue(validate_record(r,self.reference)['valid'])
        self.assertEqual(r['plan']['connections'],self.reference['plan']['connections'])
        self.assertAlmostEqual(r['net_area_m2']/self.reference['net_area_m2'],1.03*.98)
        self.assertNotEqual(r['plan']['project_id'],self.reference['plan']['project_id'])

    def test_affine_does_not_mutate_source(self):
        before=digest(self.reference);adapt(self.reference,1.01,1.01)
        self.assertEqual(before,digest(self.reference))

    def test_extreme_scaling_does_not_silently_succeed(self):
        for x,y in ((2,1),(.5,1),(0,1),(float('nan'),1)):
            with self.assertRaises(ValueError):adapt(self.reference,x,y)

    def test_unlicensed_source_rejected(self):
        bad=copy.deepcopy(self.reference);bad['geometry']['license']='CC-BY-NC-4.0'
        self.assertFalse(validate_record(bad)['valid'])
        with self.assertRaises(ValueError):adapt(bad)

    def test_broken_node_reference(self):
        bad=copy.deepcopy(self.reference);bad['plan']['walls'][0]['from_xy_mm']=[123,456]
        self.assertIn('node_reference',validate_record(bad)['errors'])

    def test_fake_opening_membership(self):
        bad=copy.deepcopy(self.reference);o=bad['plan']['openings'][0]
        o['space_ids']=[s['id'] for s in bad['plan']['spaces'] if s['id'] not in o['space_ids']][:1]
        self.assertFalse(validate_record(bad)['valid'])

    def test_thick_wall_normal_probe_finds_first_room(self):
        op=box(-450,-100,450,100)
        rooms={'a':box(-1000,350,1000,2000),'b':box(-1000,-2000,1000,-350),'far':box(-1000,2500,1000,4000)}
        members,evidence=opening_members(op,rooms)
        self.assertEqual(set(members),{'a','b'})
        self.assertGreater(evidence['distances_mm']['a'],50)


class ProgramConstraintTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.program=extract(read(FIXTURES/'fixture-reference.json'))

    def test_required_graph_mapping(self):
        mapping,reason=match_rooms(self.program,self.program)
        self.assertIsNotNone(mapping);self.assertIsNone(reason)

    def test_forbidden_edge_respected(self):
        p=copy.deepcopy(self.program);p['forbidden']=[p['adjacency'][0]]
        # The same relationship cannot simultaneously be required and forbidden.
        self.assertIsNone(match_rooms(p,self.program)[0])

    def test_source_reference_ids_do_not_define_topology(self):
        other=copy.deepcopy(self.program);rename={r['id']:'x-'+r['id'] for r in other['rooms']}
        for r in other['rooms']:r['id']=rename[r['id']]
        other['adjacency']=[[rename[a],rename[b]] for a,b in other['adjacency']]
        self.assertIsNotNone(match_rooms(self.program,other)[0])

    def test_shared_response_accepts_unknown_semantics(self):
        response(dict(status='program',plan_program=self.program,operations=[],reply='Tasarımcı incelemeli.',requires_designer_review=True))

    def test_stale_edit_rejected(self):
        with self.assertRaises(ValueError):apply_edits(self.program,[],0)


if __name__=='__main__':unittest.main()
