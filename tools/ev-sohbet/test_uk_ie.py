"""Mutation tests of the new transfer boundary, not just JSON parsing."""
import copy
import unittest
from uk_ie import OUT
from uk_ie_audit import records,audit
from denetim import check

class TransferTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.batch=records()
    def mutated(self):return copy.deepcopy(self.batch)
    def test_no_unearned_compliance(self):
        b=self.mutated();b[4]['jurisdiction_review']['compliance']='passed'
        self.assertTrue(any(x.startswith('unearned_compliance') for x in audit(b)['suite_errors']))
    def test_net_cannot_be_gia(self):
        b=self.mutated();b[0]['jurisdiction_review']['gross_internal_area_m2']=b[0]['claimed_net_area_m2']
        self.assertTrue(any(x.startswith('net_as_gia') for x in audit(b)['suite_errors']))
    def test_scotland_is_not_england(self):
        b=self.mutated();b[1]['jurisdiction_review']['jurisdiction']='England'
        self.assertTrue(any(x.startswith('wrong_jurisdiction') for x in audit(b)['suite_errors']))
    def test_no_invented_floor(self):
        b=self.mutated();b[3]['plan']['levels'].append(copy.deepcopy(b[3]['plan']['levels'][0]))
        self.assertTrue(any(x.startswith('invented_floor') for x in audit(b)['suite_errors']))
    def test_reference_does_not_become_local_survey(self):
        b=self.mutated();b[0]['plan']['dwelling']['existing_house_claim']=True
        self.assertTrue(any(x.startswith('geographic_claim') for x in audit(b)['suite_errors']))
    def test_manual_coordinates_detected(self):
        r=copy.deepcopy(self.batch[0]);r['plan']['items'][0]['pos_xy_mm'][0]+=500
        self.assertTrue(any(x['code']=='manual_item_position' for x in check(r,OUT/'kaynaklar')['errors']))
    def test_mismatched_bed_width_detected(self):
        b=self.mutated();it=next(it for it in b[0]['plan']['items'] if it['design']['kind']=='bed');it['design']['params']['mattressWidth']=700
        self.assertTrue(any(x.startswith('bed_request_mismatch') for x in audit(b)['suite_errors']))
    def test_repeated_sentence_detected(self):
        b=self.mutated();b[1]['dialogue'][1]['content']=b[0]['dialogue'][1]['content']
        self.assertTrue(any(x.startswith('duplicate_sentence') for x in audit(b)['suite_errors']))

if __name__=='__main__':unittest.main()
