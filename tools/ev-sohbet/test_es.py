import copy
import hashlib
import json
import unittest
from es_audit import records,audit
from es import OUT
from denetim import check

class SpanishTransferTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.batch=records()
    def mutate(self):return copy.deepcopy(self.batch)
    def test_net_is_not_certified_useful_area(self):
        b=self.mutate();b[0]['jurisdiction_review']['statutory_useful_area_m2']=b[0]['claimed_net_area_m2']
        self.assertTrue(any(x.startswith('unmeasured_legal_input:statutory') for x in audit(b)['suite_errors']))
    def test_opening_cannot_be_clear_passage(self):
        b=self.mutate();b[3]['jurisdiction_review']['clear_door_passage_mm']=800
        self.assertTrue(any(x.startswith('unmeasured_legal_input:clear') for x in audit(b)['suite_errors']))
    def test_window_is_not_ventilation_certificate(self):
        b=self.mutate();b[0]['jurisdiction_review']['ventilation_compliance']='passed'
        self.assertTrue(any(x.startswith('unmeasured_legal_input:ventilation') for x in audit(b)['suite_errors']))
    def test_cannot_declare_local_building_approved(self):
        b=self.mutate();b[0]['jurisdiction_review']['compliance']='passed'
        self.assertTrue(any(x.startswith('unearned_compliance') for x in audit(b)['suite_errors']))
    def test_catalan_context_cannot_be_reused_for_valencia(self):
        b=self.mutate();b[2]['jurisdiction_review']['jurisdiction']='Catalunya'
        self.assertTrue(any(x.startswith('unearned_compliance') for x in audit(b)['suite_errors']))
    def test_fake_upper_floor_detected(self):
        b=self.mutate();b[1]['plan']['levels'].append(copy.deepcopy(b[1]['plan']['levels'][0]))
        self.assertTrue(any(x.startswith('execution_scope') for x in audit(b)['suite_errors']))
    def test_manual_position_detected(self):
        r=copy.deepcopy(self.batch[0]);r['plan']['items'][0]['pos_xy_mm'][0]+=200
        self.assertTrue(any(x['code']=='manual_item_position' for x in check(r,OUT/'kaynaklar')['errors']))
    def test_raw_record_hashes_survive_git_line_endings(self):
        manifest=json.loads((OUT/'yeniden-uretim-sonucu.json').read_text(encoding='utf-8'))
        for file,digest in manifest['hashes'].items():
            raw=(OUT/file).read_bytes();self.assertNotIn(b'\r',raw)
            self.assertEqual(hashlib.sha256(raw).hexdigest(),digest)

if __name__=='__main__':unittest.main()
