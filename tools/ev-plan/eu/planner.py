"""Target-country context, source-country provenance and legal scope stay separate."""
import copy
from common import DATA,read
from eu.contract import strip,extend
from eu.rules import screen
from solver.program import apply_edits
from real.geometry import validate_record

def revise(program,operations,expected_revision):
    return extend(apply_edits(strip(program),operations,expected_revision),program['country'],program['region'],program['housing_type'])

def plan(index,program,language='en',location_confirmed=False,allow_cross_country_reference=False,rule_context=None,rule_facts=None,count=3):
    base=strip(program);country=program['country'];region=program['region']
    def clarify(reason):return dict(status='clarify',reason=reason,options=[],requires_designer_review=True)
    if not country or not location_confirmed:return clarify('confirm_project_country_from_user_not_language')
    profiles=read(DATA/'ulke-profilleri.eu.json')['countries']
    if country not in profiles:return clarify('country_profile_not_available')
    profile=profiles[country]
    if profile['region_required_before_rules'] and not region:return clarify('confirm_project_region')
    if country in ('BE','GB') and region not in profile['regions']:return clarify('unsupported_or_inconsistent_region')
    if region and not region.startswith(country+'-'):return clarify('region_must_match_country_ISO_prefix')
    if program['housing_type'] is not None:
        typ=next((t for t in profile['typologies'] if t['id']==program['housing_type']),None)
        if typ is None:return clarify('unknown_country_typology')
        if typ['geometry_class']!='flat' or typ['feature'] in ('attic','wintergarden'):
            return clarify('no_verified_reference_for_requested_house_floors_or_special_geometry')
        # Building age, gallery, period details and circulation style are still unverified.
    if country!='CH' and not allow_cross_country_reference:return clarify('confirm_use_of_explicitly_foreign_reference_proposal')
    # Never tell the CH-only index it contains measured Belgian/French/etc. plans.
    result=index.retrieve(base,country='CH',count=count)
    result['target_country']=country;result['target_region']=region;result['source_country']='CH'
    result['rule_screen']=screen(country,region,rule_context,rule_facts)
    for option in result['options']:
        record=copy.deepcopy(option['adapted']);p=record['plan']
        record['target_context']=dict(country=country,region=region,requested_housing_type=program['housing_type'],
            source_country='CH',synthetic_proposal=True,local_typology_features_verified=False,local_legal_compliance_verified=False)
        for evidence in p['evidence']:evidence['synthetic']=True
        p['language']['customer']=language
        p['notes'].append(dict(id='eu-target-context',original=f'Synthetic reference-derived proposal for {country}/{region}; geometry source remains Switzerland. Requested local building type and legal compliance are unverified. Final decision belongs to the designer.',original_language='en',turkish_translation=None,translation_status='not_requested'))
        validation=validate_record(record,option['source'])
        if not validation['valid']:raise ValueError('Country annotation broke geometry: '+str(validation['errors']))
        option['adapted']=record
    result['warnings']+=['target country is not source provenance','local building-type features not verified','rule screen is incomplete and is not a legal certificate']
    return result
