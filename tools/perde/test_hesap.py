import copy
import json
import os
import subprocess
import sys
import unittest
from decimal import Decimal

from hesap import DATA, calculate, load


class CurtainTests(unittest.TestCase):
    def setUp(self):
        self.examples = load('perde-ornekler.json')['examples']
        self.base = copy.deepcopy(self.examples[1]['input'])

    def test_five_independent_worked_results(self):
        for example in self.examples:
            with self.subTest(example=example['id']):
                result = calculate(example['input'])
                for key,value in example['expected'].items():
                    self.assertEqual(result[key], value)
                self.assertFalse(result['production_ready'])

    def test_daybreak_2700_height_does_not_fit_3000_roll(self):
        request=copy.deepcopy(self.examples[0]['input'])
        request['attachment_to_floor_mm']=2700
        with self.assertRaisesRegex(ValueError,'sığmıyor'):
            calculate(request)

    def test_no_silent_shrink_assumption(self):
        for field in ('shrink_warp','shrink_weft','shrink_basis','fabric_source'):
            request=copy.deepcopy(self.base)
            del request[field]
            with self.subTest(field=field), self.assertRaises(ValueError):
                calculate(request)

    def test_shrink_changes_drop_and_width_count(self):
        request=dict(self.base,pattern_repeat_mm=0,shrink_warp=0.03,shrink_weft=0.04)
        result=calculate(request)
        # 2500/.97 = 2577.319.. => 2578 mm EACH of four drops.
        self.assertEqual(result['cut_drop_mm'],'2578')
        self.assertEqual(result['purchase_linear_m'],'10.312')

    def test_seam_allowance_crosses_whole_width_boundary(self):
        request=copy.deepcopy(self.examples[3]['input'])
        result=calculate(request)
        self.assertEqual(result['strips_per_panel'],3)
        # Two 1400 widths look sufficient for 2750 flat, but not hems + join.
        self.assertGreater(Decimal('2750') + 80 + 40, Decimal('2800'))

    def test_invalid_numbers_and_units(self):
        for invalid in (0,-1,True,'NaN','Infinity',{},None):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                calculate(dict(self.base,window_width_mm=invalid))
        for update in (dict(unit='cm'),dict(country='US'),dict(geometry='bay'),dict(fullness=9),dict(panel_count=True),dict(shrink_warp=1),dict(heading='madeup'),dict(mount='recess'),dict(drop_datum='unknown')):
            with self.subTest(update=update), self.assertRaises(ValueError):
                calculate(dict(self.base,**update))

    def test_rail_estimate_uses_profile_not_country(self):
        request=copy.deepcopy(self.base)
        del request['rail_width_mm']
        self.assertEqual(calculate(request)['rail_width_mm'],'1900')
        request['country']='TR'
        self.assertEqual(calculate(request)['rail_width_mm'],'1900')
        request['mount_profile']='lutz_200'
        self.assertEqual(calculate(request)['rail_width_mm'],'2000')

    def test_wave_requires_correct_datum(self):
        request=copy.deepcopy(self.examples[0]['input'])
        request['drop_datum']='hook_bearing'
        with self.assertRaises(ValueError): calculate(request)

    def test_railroad_rejects_unconfirmed_rotation_and_pattern(self):
        request=copy.deepcopy(self.examples[0]['input'])
        for update in (dict(rotatable=False),dict(pattern_repeat_mm=100)):
            with self.subTest(update=update), self.assertRaises(ValueError):
                calculate(dict(request,**update))

    def test_blind_profiles_cannot_double_deduct(self):
        request=copy.deepcopy(self.examples[4]['input'])
        other=calculate(dict(request,blind_profile='leroy_es_recess_width'))
        self.assertEqual(other['order_width_mm'],'1184')
        for update in (dict(measurement_stage='already_deducted'),dict(mount='outside'),dict(widths_mm=[1200]),dict(blind_profile='country_default')):
            with self.subTest(update=update), self.assertRaises(ValueError):
                calculate(dict(request,**update))

    def test_outside_blind_uses_largest_opening_and_adds_allowance(self):
        request=dict(self.examples[4]['input'],mount='outside',blind_profile='jysk_outside_roller')
        result=calculate(request)
        self.assertEqual(result['order_width_mm'],'1300')
        self.assertEqual(result['order_height_mm'],'1582')

    def test_narrow_roll_and_negative_finished_height_rejected(self):
        for update in (dict(usable_fabric_width_mm=30),dict(attachment_to_floor_mm=5)):
            with self.subTest(update=update), self.assertRaises(ValueError):
                calculate(dict(self.base,**update))

    def test_windows_cli_emits_utf8_json(self):
        from hesap import ROOT
        result=subprocess.run([sys.executable,str(ROOT/'tools/perde/hesap.py'),str(ROOT/'tools/perde/ornek-girdi.json')],
                              env=dict(os.environ,PYTHONIOENCODING='cp1252'),capture_output=True)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(json.loads(result.stdout.decode('utf-8'))['purchase_linear_m'],'4.908')


class DataTests(unittest.TestCase):
    def test_cross_references(self):
        sources=load('perde-kaynaklar.json')['sources']
        def walk(value):
            if isinstance(value,dict):
                for key,v in value.items():
                    if key=='source_ids':
                        self.assertTrue(v)
                        for s in v: self.assertIn(s,sources)
                    else: walk(v)
            elif isinstance(value,list):
                for v in value: walk(v)
        for name in ('perde-kulturu.json','perde-hesap.json','perde-gorunum.json'):
            walk(load(name))
        for line in (DATA/'perde-diyaloglar.jsonl').read_text(encoding='utf-8').splitlines(): walk(json.loads(line))

    def test_coverage_and_no_invented_national_dimensions(self):
        data=load('perde-kulturu.json')
        self.assertEqual(set(data['countries']),set('BE NL DE AT CH FR GB IE DK SE NO ES PT IT TR'.split()))
        self.assertGreaterEqual(len(data['names']),9)
        self.assertEqual(set(data['countries']['BE']['regions']),{'VLG','BRU','WAL'})
        sources=load('perde-kaynaklar.json')['sources']
        for country in data['countries'].values():
            self.assertIsNone(country['windows']['national_standard_sill_height_mm'])
            self.assertIsNone(country['culture']['quantified_prevalence'])
            self.assertGreaterEqual(len({sources[s]['publisher'] for s in country['source_ids']}),2)

    def test_individually_authored_dialogues_cover_all_locales(self):
        rows=[json.loads(line) for line in (DATA/'perde-diyaloglar.jsonl').read_text(encoding='utf-8').splitlines()]
        self.assertGreaterEqual(len(rows),30)
        self.assertEqual(len(set(r['id'] for r in rows)),len(rows))
        self.assertEqual(set(r['country'] for r in rows),set(load('perde-kulturu.json')['countries']))
        self.assertEqual(set(r['language'] for r in rows),set(load('perde-kulturu.json')['names']))
        for role in ('user','assistant'):
            texts=[next(m['content'] for m in row['messages'] if m['role']==role) for row in rows]
            self.assertEqual(len(set(texts)),len(texts))

    def test_daybreak_weight_unit_conversion(self):
        fabric=load('perde-hesap.json')['fabric_samples'][0]
        self.assertEqual(fabric['weight']['unit'],'g/linear_m')
        self.assertEqual(fabric['weight']['value']/(fabric['width_mm']/1000),fabric['derived_weight']['value'])

    def test_example_cli_input_matches_review_example(self):
        from hesap import ROOT
        self.assertEqual(json.loads((ROOT/'tools/perde/ornek-girdi.json').read_text(encoding='utf-8')),
                         load('perde-ornekler.json')['examples'][0]['input'])


if __name__ == '__main__':
    unittest.main()
