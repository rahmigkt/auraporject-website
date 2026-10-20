import copy,unittest
from common import DATA,ROOT,read,digest
from eu.contract import extend,strip,response
from eu.language import analyze
from eu.rules import evaluate,screen
from eu.planner import plan,revise
from real.programs import extract
from real.geometry import adapt,validate_record

FIXTURE=ROOT/'knowledge/ai-egitim/veri/ev-plan-reel-00d/fixture-reference.json'

class LocaleTests(unittest.TestCase):
    def test_localized_svg_remains_browser_svg(self):
        from eu.review import localized_svg
        from real.review import bounds
        source=read(FIXTURE)
        result=localized_svg(source,bounds(source),'fr')
        self.assertTrue(result.startswith('<svg '))
        self.assertNotIn('ns0:',result)

    def test_main_room_conventions_are_not_bedroom_counts(self):
        for text,lang,n,estimate in [('T3','fr',3,2),('F4','fr',4,3),('3-Zimmer-Wohnung','de',3,2),('4-kamerwoning','nl',4,3),('trilocale','it',3,2),('3-værelses','da',3,2)]:
            with self.subTest(text=text):
                r=analyze(text,lang);self.assertEqual(r['main_rooms'],n);self.assertEqual(r['bedrooms_estimate'],estimate)
                self.assertIsNone(r['bedrooms']);self.assertFalse(r['bedrooms_confirmed']);self.assertTrue(r['needs_confirmation'])

    def test_direct_bedroom_notations(self):
        for text,lang in [('3+1','tr'),('3-bed flat','en'),('3 slaapkamers','nl'),('3 dormitorios','es')]:
            with self.subTest(text=text):self.assertEqual(analyze(text,lang)['bedrooms'],3)

    def test_language_does_not_confirm_country(self):
        for lang in ('fr','nl','de','en','da','es','it','tr'):
            r=analyze('T3',lang);self.assertIsNone(r['country']);self.assertFalse(r['country_confirmed'])

    def test_multilingual_explicit_locations(self):
        for text in ('Belçika Flaman','Belgium Flanders','Belgien Flandern','Belgique Flandre','België Vlaanderen','Bélgica Flandes','Belgio Fiandre'):
            with self.subTest(text=text):
                r=analyze(text,'en');self.assertEqual(r['country'],'BE');self.assertEqual(r['region'],'BE-VLG')

    def test_swiss_half_room_not_rounded(self):
        for text in ('3.5-Zimmer','3,5-Zimmer'):
            r=analyze(text,'de');self.assertEqual(r['main_rooms'],3.5);self.assertIsNone(r['bedrooms_estimate'])

    def test_region_conflict_and_northern_ireland(self):
        self.assertTrue(analyze('France or Belgium','en')['country_conflict'])
        r=analyze('Northern Ireland','en');self.assertEqual(r['country'],'GB');self.assertEqual(r['region'],'GB-NIR')
        self.assertEqual(analyze('Switzerland CH-ZH','en')['region'],'CH-ZH')

    def test_units_are_numeric_conversion_not_area_basis_conversion(self):
        self.assertAlmostEqual(analyze('800 sq ft','en')['areas'][0]['m2'],74.322432)
        self.assertEqual(analyze('80,5 m²','fr')['areas'][0]['m2'],80.5)

    def test_conflicting_and_unsupported_counts(self):
        self.assertTrue(analyze('T3, 3-bed and one living room','en')['room_count_conflict'])
        self.assertTrue(analyze('20 bedrooms','en')['room_count_conflict'])

class RuleTests(unittest.TestCase):
    def test_three_valued_conjunction_and_alternative(self):
        a={'fact':'area','op':'ge','value':9};h={'fact':'height','op':'ge','value':2.2};v={'fact':'volume','op':'ge','value':20}
        e={'any':[{'all':[a,h]},v]}
        self.assertTrue(evaluate(e,dict(volume=21)))
        self.assertIsNone(evaluate(e,dict(area=10)))
        self.assertFalse(evaluate(e,dict(area=8,height=2,volume=19)))
        self.assertIsNone(evaluate(a,dict(area=float('nan'))))

    def test_english_standard_not_uk_law_or_net_area(self):
        report=screen('GB','GB-SCT',{'scope':'new_dwelling','ndss_adopted_locally':True},{'gia_m2':20})
        self.assertFalse(any(r['status']=='below_excerpt' for r in report['checks']))
        self.assertFalse(report['compliance_verified'])
        report=screen('GB','GB-ENG',{'scope':'new_dwelling','ndss_adopted_locally':True,'bedrooms':2,'occupants':4,'storeys':1,'shower_only_exception':False},{'net_area_m2':100})
        self.assertEqual(next(r for r in report['checks'] if r['id']=='eng-gia-2-4-1')['status'],'unknown')

    def test_france_alternative_volume_and_main_room_scope(self):
        report=screen('FR',None,{'scope':'metropolitan_rental'},{'main_room_net_m2':8,'main_room_height_m':2.1,'main_room_volume_m3':21})
        self.assertEqual(next(r for r in report['checks'] if r['id']=='fr-main-room')['status'],'meets_excerpt')
        self.assertFalse(report['compliance_verified'])

    def test_belgian_regions_not_interchangeable(self):
        report=screen('BE','BE-BRU',{'scope':'housing_quality','occupants':2},{'brussels_eligible_net_m2':25})
        self.assertEqual(next(r for r in report['checks'] if r['id']=='bru-area-2')['status'],'below_excerpt')
        self.assertFalse(any(r['id'].startswith('vlg') for r in report['checks']))

    def test_unknown_din_and_regional_scopes_remain_unknown(self):
        report=screen('DE','DE-BE',{'scope':'residential'},{'minimum_habitable_height_m':2})
        self.assertFalse(any(r['id']=='by-height' for r in report['checks']))
        self.assertIn('height',{r['category'] for r in report['unverified_categories']})
        self.assertTrue(any(r['category']=='accessibility' for r in report['unverified_categories']))

class ContractAndProvenanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.source=read(FIXTURE);cls.base=extract(cls.source)

    def test_eu_roundtrip_does_not_redefine_frozen_v04(self):
        eu=extend(self.base,'BE','BE-VLG','be-4');self.assertEqual(strip(eu),self.base)
        self.assertEqual(eu['version'],'0.5');self.assertEqual(self.base['version'],'0.4')
        self.assertEqual(response(dict(status='program',plan_program=eu,operations=[],reply='review',requires_designer_review=True))['plan_program']['country'],'BE')

    def test_region_and_language_do_not_authorize_retrieval(self):
        class NoIndex:
            def retrieve(self,*args,**kwargs):raise AssertionError('Should abstain before retrieving')
        eu=extend(self.base,'BE',None,'be-4')
        self.assertEqual(plan(NoIndex(),eu,location_confirmed=False)['reason'],'confirm_project_country_from_user_not_language')
        self.assertEqual(plan(NoIndex(),eu,location_confirmed=True)['reason'],'confirm_project_region')
        eu['region']='GB-ENG'
        self.assertEqual(plan(NoIndex(),eu,location_confirmed=True)['status'],'clarify')

    def test_unsupported_multistorey_no_synthetic_fallback(self):
        eu=extend(self.base,'BE','BE-VLG','be-1')
        self.assertEqual(plan(None,eu,location_confirmed=True,allow_cross_country_reference=True)['reason'],'no_verified_reference_for_requested_house_floors_or_special_geometry')

    def test_country_annotation_preserves_source_and_geometry(self):
        source=copy.deepcopy(self.source);before=digest(source);template=adapt(source,1.01,1.01)
        class Index:
            def retrieve(self,program,country,count):
                self.country=country
                return dict(status='options',warnings=[],options=[dict(source=source,adapted=template)])
        index=Index();eu=extend(self.base,'BE','BE-VLG','be-4')
        result=plan(index,eu,language='nl',location_confirmed=True,allow_cross_country_reference=True)
        r=result['options'][0]['adapted']
        self.assertEqual(index.country,'CH');self.assertEqual(r['country'],'CH');self.assertEqual(r['target_context']['country'],'BE')
        self.assertTrue(r['plan']['evidence'][0]['synthetic']);self.assertEqual(digest(source),before)
        self.assertTrue(validate_record(r,source)['valid']);self.assertFalse(result['rule_screen']['compliance_verified'])

    def test_foreign_reference_requires_explicit_context(self):
        eu=extend(self.base,'BE','BE-VLG','be-4')
        self.assertEqual(plan(None,eu,location_confirmed=True)['reason'],'confirm_use_of_explicitly_foreign_reference_proposal')

    def test_revision_guard_preserves_country(self):
        eu=extend(self.base,'BE','BE-VLG','be-4')
        with self.assertRaises(ValueError):revise(eu,[],eu['revision']-1)
        nextp=revise(eu,[],eu['revision']);self.assertEqual(nextp['country'],'BE');self.assertEqual(nextp['revision'],eu['revision']+1)

if __name__=='__main__':unittest.main()
