"""Authored typology hypotheses. Dimensions are proposals, never stock statistics."""
from common import DATA,write

DATE='2026-10-20'
GROUPS=[['BE'],['NL'],['DE'],['FR'],['GB','IE'],['DK'],['ES'],['IT'],['AT','CH']]
COUNTRIES={
 'BE':('Belçika',['nl','fr','de'],['BE-VLG','BE-BRU','BE-WAL']),
 'NL':('Hollanda',['nl'],[]),'DE':('Almanya',['de'],['DE-BY','DE-BE']),
 'FR':('Fransa',['fr'],[]),'GB':('Birleşik Krallık',['en'],['GB-ENG','GB-SCT','GB-WLS','GB-NIR']),
 'IE':('İrlanda',['en'],[]),'DK':('Danimarka',['da'],[]),'ES':('İspanya',['es'],[]),
 'IT':('İtalya',['it'],[]),'AT':('Avusturya',['de'],[]),'CH':('İsviçre',['de','fr','it'],[])}

# local name, geometry class, bedrooms, floors, defining feature; not a ranked frequency list.
TYPES={
'BE':[('rijwoning / maison mitoyenne','row',3,2,'rear_garden'),('halfopen bebouwing','semi',3,2,'side_access'),('vrijstaande woning','detached',3,2,'garden'),('appartement / appartement','flat',2,1,'shared_stair'),('appartement met veranda','flat',2,1,'wintergarden'),('rijwoning met achterbouw','row',3,2,'rear_extension')],
'NL':[('eengezinswoning / doorzon','row',3,2,'front_rear_living'),('portiekflat','flat',2,1,'shared_stair'),('galerijflat','flat',2,1,'access_gallery'),('bovenwoning','flat',2,1,'upper_entrance'),('benedenwoning','flat',2,1,'garden_access'),('woning met zolder','row',3,3,'attic')],
'DE':[('Altbauwohnung','flat',2,1,'enfilade'),('Neubauwohnung','flat',2,1,'compact_hall'),('Reihenhaus','row',3,2,'rear_garden'),('Doppelhaushälfte','semi',3,2,'side_access'),('Einfamilienhaus','detached',3,2,'garden'),('Dachgeschosswohnung','flat',2,1,'attic')],
'FR':[('appartement T2','flat',1,1,'compact_hall'),('appartement T3','flat',2,1,'separate_wc_preference'),('appartement T4','flat',3,1,'cellier'),('appartement ancien / enfilade','flat',2,1,'enfilade'),('maison de plain-pied','detached',3,1,'garden'),('maison à étage','detached',3,2,'garage')],
'GB':[('Victorian terrace','row',2,2,'rear_extension'),('semi-detached','semi',3,2,'side_access'),('detached house','detached',3,2,'garden'),('purpose-built flat','flat',2,1,'shared_stair'),('maisonette','duplex',2,2,'own_entrance'),('loft conversion','row',3,3,'attic')],
'IE':[('terraced house','row',3,2,'rear_garden'),('semi-detached house','semi',3,2,'side_access'),('detached house','detached',3,2,'garden'),('apartment','flat',2,1,'shared_stair'),('duplex apartment','duplex',3,2,'own_entrance'),('bungalow','detached',3,1,'garden')],
'DK':[('etagebolig','flat',2,1,'shared_stair'),('rækkehus','row',3,2,'rear_garden'),('parcelhus','detached',3,1,'bryggers'),('dobbelthus','semi',3,2,'side_access'),('gårdhavehus','detached',2,1,'courtyard'),('taglejlighed','flat',2,1,'attic')],
'ES':[('piso compacto','flat',2,1,'salon_comedor'),('piso con lavadero','flat',3,1,'laundry'),('piso con terraza','flat',2,1,'terrace'),('adosado','row',3,2,'rear_garden'),('chalet','detached',3,2,'garden'),('dúplex','duplex',3,2,'internal_stair')],
'IT':[('bilocale','flat',1,1,'angolo_cottura'),('trilocale','flat',2,1,'cucina_abitabile'),('quadrilocale','flat',3,1,'ripostiglio'),('appartamento con balcone','flat',2,1,'balcony'),('villetta a schiera','row',3,2,'rear_garden'),('casa indipendente','detached',3,2,'garden')],
'AT':[('Altbauwohnung','flat',2,1,'enfilade'),('Neubauwohnung','flat',2,1,'compact_hall'),('Reihenhaus','row',3,2,'rear_garden'),('Doppelhaus','semi',3,2,'side_access'),('Einfamilienhaus','detached',3,2,'basement'),('Dachgeschosswohnung','flat',2,1,'attic')],
'CH':[('Geschosswohnung / appartement','flat',2,1,'shared_stair'),('Attikawohnung','flat',2,1,'terrace'),('Maisonette','duplex',3,2,'internal_stair'),('Reihenhaus','row',3,2,'rear_garden'),('Einfamilienhaus','detached',3,2,'basement'),('Wohnung mit Wintergarten','flat',2,1,'wintergarden')]}

STATISTICS={
'BE':'https://statbel.fgov.be/en/themes/housing/building-stock',
'NL':'https://www.cbs.nl/en-gb/figures/detail/81955ENG',
'DE':'https://www.destatis.de/EN/Themes/Society-Environment/Housing/_node.html',
'FR':'https://www.insee.fr/fr/statistiques/2412780',
'GB':'https://www.gov.uk/government/collections/english-housing-survey',
'IE':'https://www.cso.ie/en/releasesandpublications/ep/p-cpp2/censusofpopulation2022profile2-housinginireland/occupieddwellings/',
'DK':'https://www.dst.dk/en/Statistik/emner/borgere/boligforhold/boligbestanden',
'ES':'https://www.ine.es/prensa/censo_2021_jun.pdf',
'IT':'https://www.istat.it/comunicato-stampa/censimento-permanente-2021-caratteristiche-delle-abitazioni/',
'AT':'https://www.statistik.at/en/statistics/population-and-society/housing',
'CH':'https://dam-api.bfs.admin.ch/hub/api/dam/assets/36141952/master'}

def build():
    profiles={}
    for country,(name,languages,regions) in COUNTRIES.items():
        types=[]
        for i,(local,kind,beds,floors,feature) in enumerate(TYPES[country]):
            flat=kind=='flat';row=kind=='row'
            rooms=['hall','living','kitchen','bath','wc']+['bedroom']*beds
            if feature in ('cellier','ripostiglio','bryggers','laundry','basement','attic'):rooms+=['utility']
            if feature in ('terrace','balcony','wintergarden'):rooms+=['terrace' if feature=='terrace' else ('balcony' if feature=='balcony' else 'other')]
            if floors>1:rooms+=['stair']
            types.append(dict(id=country.lower()+'-'+str(i+1),local_name=local,geometry_class=kind,bedrooms_proposal=beds,
                floors_proposal=floors,feature=feature,program=rooms,
                net_area_m2_range_proposal=[35+beds*18,65+beds*30] if flat else [75,180],
                facade_width_m_proposal=[5,7] if row else ([7,14] if flat else [8,16]),
                depth_m_proposal=[10,17] if row else [7,13],
                dimension_evidence='AURA design prior, not a measured national distribution or legal minimum',
                exterior_proposal='rectangle',stair_proposal='side-hall U or straight; headroom/slab requires measured design' if floors>1 else 'shared building stair outside the imported unit, if applicable',
                entrance_sequence=['entrance','hall','living'],wet_layout='bath + separate WC is a preference, not a universal national mandate',
                service_spaces=[x for x in (feature,'storage')],
                adjacency_proposal=[['hall','living'],['hall','bath'],['hall','wc'],['living','kitchen']]+[['hall','bedroom-'+str(k+1)] for k in range(beds)],
                graph_status='own schematic intent, not a copied source plan',
                research_sources=[STATISTICS[country]]+([] if country=='CH' else ['https://episcope.eu/building-typology/country/'+country.lower()+'/']),
                evidence_scope='building-class research; precise subtype prevalence, dimensions and internal arrangement not statistically established',
                held_out_from_training=i==next(j for j,t in enumerate(TYPES[country]) if t[1]=='flat'),
                geometry_support='licensed_single_floor_reference_proposal' if flat and feature not in ('attic','wintergarden') else 'requires_matching_reference_or_designer'))
        profiles[country]=dict(country=country,name_tr=name,languages=languages,regions=regions,typologies=types,
            region_required_before_rules=country in ('BE','DE','GB','AT','CH','ES','IT'),
            research_license='sources consulted for facts; no source drawings/images copied; unclear data grants are not corpus licenses',
            synthesis_attribution='IEE Projects TABULA + EPISCOPE (www.episcope.eu); national statistical publishers; AURA authored program hypotheses')
    write(DATA/'ulke-profilleri.eu.json',dict(version='eu-context/1',date=DATE,groups=GROUPS,countries=profiles,
        provenance_policy='source country and target jurisdiction are separate; synthetic adaptation is never measured local evidence'))
    return profiles

if __name__=='__main__':build()
