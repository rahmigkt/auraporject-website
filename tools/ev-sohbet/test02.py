"""Mutation tests: don't just check that our own fixtures parse."""
import copy
import json
import unittest
from denetim import DIR,check,sentences

class AuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base=json.loads((DIR/'ev-sohbet-02-01.json').read_text(encoding='utf-8'))
        cls.duplex=json.loads((DIR/'ev-sohbet-02-03.json').read_text(encoding='utf-8'))

    def codes(self,r):return {e['code'] for e in check(r)['errors']}

    def test_source_exceptions_are_not_strict_pass(self):
        result=check(self.base)
        self.assertFalse(result['strict_pass'])
        self.assertTrue(result['accepted_with_documented_source_exceptions'])
        self.assertTrue(result['source_exceptions'])

    def test_false_area_claim_fails(self):
        r=copy.deepcopy(self.base);r['claimed_net_area_m2']=116
        self.assertIn('net_area_delta_percent',self.codes(r))

    def test_room_overlap_and_geometry_edit_fail(self):
        r=copy.deepcopy(self.base);r['plan']['spaces'][0]['boundary_xy_mm']=copy.deepcopy(r['plan']['spaces'][1]['boundary_xy_mm'])
        self.assertTrue({'room_overlap','unrecorded_room_geometry_change'}<=self.codes(r))

    def test_manual_item_position_fails(self):
        r=copy.deepcopy(self.base);r['plan']['items'][0]['pos_xy_mm'][0]+=200
        self.assertIn('manual_item_position',self.codes(r))

    def test_body_outside_room_fails(self):
        r=copy.deepcopy(self.base);it=r['plan']['items'][0];it['footprint_xy_mm']=[[x+50000,y] for x,y in it['footprint_xy_mm']]
        self.assertIn('item_outside_room',self.codes(r))

    def test_crossing_wall_fails(self):
        r=copy.deepcopy(self.base);w=r['plan']['walls'][0];a,b=w['from_xy_mm'],w['to_xy_mm'];mx,my=(a[0]+b[0])/2,(a[1]+b[1])/2
        new=copy.deepcopy(w);new.update(id='mutant-wall',from_xy_mm=[mx-(b[1]-a[1]),my+(b[0]-a[0])],to_xy_mm=[mx+(b[1]-a[1]),my-(b[0]-a[0])]);r['plan']['walls'].append(new)
        self.assertIn('wall_crossing_without_node',self.codes(r))

    def test_bad_stair_width_and_rise_fail(self):
        r=copy.deepcopy(self.duplex);r['plan']['stairs'][0]['width_mm']=700;r['plan']['stairs'][0]['riser_mm']=230
        self.assertTrue({'stair_width','stair_step_formula','stair_rise'}<=self.codes(r))

    def test_unrecorded_added_floor_fails(self):
        r=copy.deepcopy(self.duplex);r['operations']=[op for op in r['operations'] if op['kind']!='propose_second_floor_and_stair']
        self.assertIn('unrecorded_level_count',self.codes(r))

    def test_source_hash_tampering_fails(self):
        r=copy.deepcopy(self.base);r['source']['fixture_sha256']='0'*64
        self.assertIn('source_hash',self.codes(r))

    def test_deleted_window_or_door_cannot_disappear(self):
        r=copy.deepcopy(self.base);oid=r['plan']['openings'][0]['source_opening_id']
        r['plan']['openings']=[o for o in r['plan']['openings'] if o['source_opening_id']!=oid]
        self.assertIn('missing_source_opening',self.codes(r))

    def test_widening_a_source_door_is_not_a_source_exception(self):
        r=copy.deepcopy(self.base);r['plan']['openings'][0]['full_opening_width_mm']+=200
        self.assertIn('unrecorded_opening_geometry_change',self.codes(r))

    def test_missing_wall_cannot_be_hidden(self):
        r=copy.deepcopy(self.base)
        used={o['wall_id'] for o in r['plan']['openings']}
        r['plan']['walls']=[w for i,w in enumerate(r['plan']['walls']) if i!=next(i for i,w in enumerate(r['plan']['walls']) if w['id'] not in used)]
        self.assertIn('source_wall_inventory',self.codes(r))

    def test_self_crossing_room_fails_cleanly(self):
        r=copy.deepcopy(self.base);r['plan']['spaces'][0]['boundary_xy_mm']=[[0,0],[3000,3000],[0,3000],[3000,0]]
        self.assertIn('invalid_polygon',self.codes(r))

    def test_sentence_counter_preserves_decimal_numbers(self):
        self.assertEqual(sentences('Alan 52.3 m². Sonraki cümle.'),['alan 52.3 m².','sonraki cümle.'])

if __name__=='__main__':unittest.main()
