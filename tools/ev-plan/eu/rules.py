"""Scoped, three-valued screening. Unknown evidence never becomes compliance."""
import math
from common import DATA,read,write

SOURCES={
'be-vlg':('https://codex.vlaanderen.be/PrintDocument.ashx?geannoteerd=false&id=1038765','technical report instructions; displayed 08-01-2026 edition','rubric 241; eligible woonlokalen floor area'),
'be-bru':('https://be.brussels/fr/logement/nouvelles-normes-minimales-de-qualite-partir-de-2026','effective 01-01-2026','net area per occupant; regional official explanation'),
'be-wal':('https://logement.wallonie.be/fr/page/criteres-de-superficie-habitable','AGW 30-08-2007; official explanation accessed 2026-10-20','articles 2, 4 and 18; height/light coefficients and excluded rooms'),
'nl':('https://iplo.nl/publish/pages/191189/bbl-werkversie-21-11-2025-.pdf','working version 21-11-2025, not a consolidated 2026 legal certificate','4.163, 4.164, 4.146–4.147; new-build woonfunctie'),
'de':('https://www.gesetze-bayern.de/Content/Document/BayBO-45','BayBO displayed current edition, accessed 2026-10-20','Art.45(1): exception building classes 1/2; Art.45(2) opening, not glass area'),
'fr':('https://www.service-public.gouv.fr/particuliers/vosdroits/F35978/0_1','official explanation verified 21-03-2025','décret 2002-120 art.4: main room area AND height OR volume; stricter local rules possible'),
'gb':('https://www.gov.uk/government/publications/technical-housing-standards-nationally-described-space-standard/technical-housing-standards-nationally-described-space-standard','2015 + 19-05-2016 notes','England NDSS requirements 10(c,d,e,i), Table 1; only if adopted locally; GIA includes partitions'),
'gb-k':('https://assets.publishing.service.gov.uk/media/60d5bdcde90e07716f516cfd/Approved_Document_K.pdf','2013 edition, official publication accessed 2026-10-20','England private stairs; Table 1.1 and headroom guidance'),
'ie':('https://www.gov.ie/en/department-of-housing-local-government-and-heritage/publications/quality-housing-for-sustainable-communities/','2007 guidance; newer apartment policy must be checked','not treated as universal current law'),
'dk':('https://www.bygningsreglementet.dk/tekniske-bestemmelser/18/krav/377/','BR18 Aktuelt accessed 2026-10-20','§379–381; corrected glass alternative or daylight calculation, not raw window opening'),
'es':('https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf','DB-SUA consolidated document 14-06-2022; official portal accessed 2026-10-20','SUA1 4.1: restricted-use private stairs; regional habitability separate'),
'it':('https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3A2001%3B380~art24%21vig=','art.24 5-bis/5-ter shown in force 28-07-2024','qualified-professional certification exceptions; not blanket 2.40m minimum'),
'at':('https://www.oib.or.at/sites/default/files/oib-rl_3_ausgabe_mai_2023.pdf','OIB guideline 3, May 2023; Land adoption must be confirmed','11.2.2–11.2.5; 2.50m sufficient solution, 2.40m special dwelling/rowhouse case'),
'ch':('https://www.bwo.admin.ch/de/glossar','BWO WBS 2015, current explanatory page 2025','room count/area assessment framework, not nationwide building law'),
'din':('https://www.dinmedia.de/de/norm/din-18011/1721435','DIN18011:1967-03 WITHDRAWN','do not use as current mandatory rule')}

def atom(key,op,value):return dict(fact=key,op=op,value=value)
def build():
    rules=[]
    def add(id,country,region,category,source,when,expression,status='verified_excerpt'):
        rules.append(dict(id=id,country=country,region=region,category=category,source_id=source,when=when,expression=expression,status=status))
    add('vlg-area','BE','BE-VLG','area','be-vlg',{'scope':'existing_independent_dwelling'},atom('eligible_woonlokalen_m2','ge',18))
    for people in (1,2,3,4):add('bru-area-'+str(people),'BE','BE-BRU','area','be-bru',{'scope':'housing_quality','occupants':people},atom('brussels_eligible_net_m2','ge',18+10*(people-1)))
    add('wal-old-single','BE','BE-WAL','area','be-wal',{'scope':'individual_dwelling','created_after_2008':False,'occupants':1},dict(all=[atom('wallonia_weighted_habitable_m2','ge',15),atom('largest_weighted_room_m2','ge',10)]))
    add('wal-new-single','BE','BE-WAL','area','be-wal',{'scope':'individual_dwelling','created_after_2008':True,'occupants':1},dict(all=[atom('wallonia_weighted_habitable_m2','ge',24),atom('largest_weighted_room_m2','ge',10)]))
    add('nl-room-width','NL',None,'width','nl',{'scope':'new_build_woonfunctie'},atom('minimum_verblijfsruimte_width_m','ge',1.8))
    add('nl-habitable-height','NL',None,'height','nl',{'scope':'new_build_woonfunctie'},atom('minimum_verblijfsgebied_height_m','ge',2.6))
    add('nl-equivalent-daylight','NL',None,'daylight','nl',{'scope':'new_build_woonfunctie'},dict(all=[atom('minimum_equivalent_daylight_m2','ge',.5),atom('equivalent_daylight_area_ratio','ge',.10)]))
    add('by-height','DE','DE-BY','height','de',{'scope':'residential','building_class_1_or_2':False,'attic':False},atom('minimum_habitable_height_m','ge',2.4))
    add('by-opening','DE','DE-BY','daylight','de',{'scope':'residential','special_windowless_use':False},atom('minimum_rough_opening_to_room_ratio','ge',.125))
    add('fr-main-room','FR',None,'area','fr',{'scope':'metropolitan_rental'},dict(any=[dict(all=[atom('main_room_net_m2','ge',9),atom('main_room_height_m','ge',2.2)]),atom('main_room_volume_m3','ge',20)]))
    for code,metric,value in [('single-area','single_bedroom_min_m2',7.5),('single-width','single_bedroom_min_clear_width_m',2.15),('double-area','double_bedroom_min_m2',11.5)]:
        add('eng-'+code,'GB','GB-ENG','area' if 'area' in code else 'width','gb',{'scope':'new_dwelling','ndss_adopted_locally':True},atom(metric,'ge',value))
    add('eng-height','GB','GB-ENG','height','gb',{'scope':'new_dwelling','ndss_adopted_locally':True},atom('gia_fraction_height_at_least_2_3m','ge',.75))
    for beds,people,floors,area in [(1,1,1,39),(1,2,1,50),(2,3,1,61),(2,4,1,70),(2,4,2,79),(3,4,1,74),(3,5,2,93)]:
        add(f'eng-gia-{beds}-{people}-{floors}','GB','GB-ENG','area','gb',{'scope':'new_dwelling','ndss_adopted_locally':True,'bedrooms':beds,'occupants':people,'storeys':floors,'shower_only_exception':False},atom('gia_m2','ge',area))
    for code,metric,op,value in [('rise','stair_max_rise_mm','le',220),('going','stair_min_going_mm','ge',220),('pitch','stair_max_pitch_deg','le',42),('head','stair_min_headroom_mm','ge',2000)]:
        add('eng-stair-'+code,'GB','GB-ENG','stair','gb-k',{'scope':'private_stair','loft_headroom_exception':False},atom(metric,op,value))
    add('dk-light','DK',None,'daylight','dk',{'scope':'habitable_rooms','method':'corrected_glass_alternative'},atom('corrected_glass_to_relevant_floor_ratio','ge',.1))
    for code,metric,op,value in [('width','stair_min_clear_width_mm','ge',800),('rise','stair_max_rise_mm','le',200),('going','stair_min_going_mm','ge',220)]:
        add('es-private-'+code,'ES',None,'stair','es',{'scope':'restricted_use_private_stair'},atom(metric,op,value))
    add('at-height-general','AT',None,'height','at',{'scope':'residential','land_adopts_oib_2023':True,'small_building_or_rowhouse':False,'attic':False},atom('minimum_habitable_height_m','ge',2.5),'sufficient_solution_not_exclusive_minimum')
    add('at-height-small','AT',None,'height','at',{'scope':'residential','land_adopts_oib_2023':True,'small_building_or_rowhouse':True,'attic':False},atom('minimum_habitable_height_m','ge',2.4),'sufficient_solution_not_exclusive_minimum')
    add('ch-first-room','CH',None,'area','ch',{'scope':'wbs_assessment'},atom('largest_qualifying_room_m2','ge',14),'assessment_not_law')
    # Every uncovered category remains machine-readable unknown, not a green check.
    countries=['BE','NL','DE','FR','GB','IE','DK','ES','IT','AT','CH']
    missing=[]
    for country in countries:
        for category in ('area','width','stair','height','daylight','ventilation','accessibility','door_width'):
            if not any(r['country']==country and r['category']==category for r in rules):
                missing.append(dict(country=country,category=category,value=None,status='source_not_verified_for_general_application',reason='kaynak bulunamadı veya kapsamlı/güncel açık metin doğrulanamadı; uzman kontrolü gerekli'))
    result=dict(version='eu-screen/1',date='2026-10-20',sources={k:dict(url=v[0],version=v[1],scope_note=v[2],accessed='2026-10-20',reuse='facts paraphrased; no complete standards copied') for k,v in SOURCES.items()},rules=rules,unknown_categories=missing,
        policy='Scope AND measurements required. Never call this a building-permit or legal compliance certificate. DIN18011 withdrawn; paywalled DIN18065/18040 thresholds not copied.')
    write(DATA/'plan-kurallari.eu.json',result);return result

def evaluate(expression,facts):
    if 'all' in expression or 'any' in expression:
        mode='all' if 'all' in expression else 'any';values=[evaluate(x,facts) for x in expression[mode]]
        if mode=='all':return False if False in values else (None if None in values else True)
        return True if True in values else (None if None in values else False)
    value=facts.get(expression['fact'])
    if type(value) not in (int,float) or not math.isfinite(value):return None
    return value>=expression['value'] if expression['op']=='ge' else value<=expression['value']

def screen(country,region,context=None,facts=None):
    pack=read(DATA/'plan-kurallari.eu.json');context=context or {};facts=facts or {};rows=[]
    for r in pack['rules']:
        if r['country']!=country:continue
        if r['region'] is not None and region!=r['region']:
            if region is None:rows.append(dict(id=r['id'],category=r['category'],status='unknown',reason='region_required'))
            continue
        mismatched=any(key in context and context[key]!=value for key,value in r['when'].items())
        missing=[key for key in r['when'] if key not in context]
        if mismatched:continue
        value=None if missing else evaluate(r['expression'],facts)
        rows.append(dict(id=r['id'],category=r['category'],status='unknown' if value is None else ('meets_excerpt' if value else 'below_excerpt'),
                         missing_context=missing,source_id=r['source_id'],rule_status=r['status']))
    unknown=[r for r in pack['unknown_categories'] if r['country']==country]
    accounted={r['category'] for r in rows}|{r['category'] for r in unknown}
    for category in ('area','width','stair','height','daylight','ventilation','accessibility','door_width'):
        if category not in accounted:unknown.append(dict(country=country,category=category,value=None,status='not_verified_in_selected_region_or_scope'))
    return dict(country=country,region=region,checks=rows,unverified_categories=unknown,compliance_verified=False,designer_review_required=True)

if __name__=='__main__':build()
