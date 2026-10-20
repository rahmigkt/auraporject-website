"""Auditable notation extraction; an estimate is not a confirmed bedroom count."""
import re,unicodedata
from common import DATA,write

ALIASES={
'BE':['belgium','belgië','belgie','belgique','belgien','belçika'],
'NL':['netherlands','nederland','pays-bas','niederlande','hollanda'],
'DE':['germany','deutschland','allemagne','almanya','alemania','germania'],
'FR':['france','frankreich','fransa','francia'],
'GB':['united kingdom','great britain','england','scotland','wales','birleşik krallık','royaume-uni'],
'IE':['ireland','éire','irlande','irlanda'],
'DK':['denmark','danmark','dänemark','danemark','danimarka','dinamarca'],
'ES':['spain','españa','espagne','spanien','ispanya','spagna'],
'IT':['italy','italia','italie','italien','italya'],
'AT':['austria','österreich','autriche','avusturya'],
'CH':['switzerland','schweiz','suisse','svizzera','isviçre'],'TR':['türkiye','turkey','turquie','türkei']}
REGIONS={'BE-VLG':['vlaanderen','flanders','flandre','flaman'],'BE-BRU':['brussels','bruxelles','brussel','brüksel'],
'BE-WAL':['wallonia','wallonie','wallonië','valon'],'DE-BY':['bayern','bavaria','bavyera'],'DE-BE':['berlin'],
'GB-ENG':['england','ingiltere','angleterre'],'GB-SCT':['scotland','écosse','iskoçya'],
'GB-WLS':['wales','galler'],'GB-NIR':['northern ireland','kuzey irlanda']}
for country,terms in {'BE':['bélgica','belgio','belgien'],'NL':['países bajos','paesi bassi','nederlandene'],
 'DE':['duitsland','tyskland'],'FR':['frankrig'],'GB':['vereinigtes königreich','regno unito','reino unido','storbritannien','verenigd koninkrijk'],
 'IE':['ierland','irland'],'AT':['oostenrijk','østrig'],'CH':['zwitserland','suiza'],'TR':['turkiet','turchia','turquía']}.items():ALIASES[country]+=terms
REGIONS['BE-VLG']+=['flandes','fiandre','flandern']
HINTS={'tr':['TR'],'en':['GB','IE'],'de':['DE','AT','CH'],'fr':['BE','FR','CH'],'nl':['BE','NL'],'da':['DK'],'es':['ES'],'it':['IT']}
ROOMS={
'tr':['Salon','Mutfak','Yatak odası','Banyo','WC','Hol','Kiler','Oda','Balkon','Teras','Merdiven'],
'en':['Living room','Kitchen','Bedroom','Bathroom','WC','Hall','Utility','Room','Balcony','Terrace','Stair'],
'de':['Wohnzimmer','Küche','Schlafzimmer','Bad','WC','Flur','Abstellraum','Zimmer','Balkon','Terrasse','Treppe'],
'fr':['Séjour','Cuisine','Chambre','Salle de bains','WC','Entrée','Cellier','Pièce','Balcon','Terrasse','Escalier'],
'nl':['Woonkamer','Keuken','Slaapkamer','Badkamer','WC','Hal','Berging','Kamer','Balkon','Terras','Trap'],
'da':['Stue','Køkken','Soveværelse','Badeværelse','WC','Entré','Bryggers','Værelse','Altan','Terrasse','Trappe'],
'es':['Salón','Cocina','Dormitorio','Baño','WC','Recibidor','Lavadero','Habitación','Balcón','Terraza','Escalera'],
'it':['Soggiorno','Cucina','Camera','Bagno','WC','Ingresso','Ripostiglio','Locale','Balcone','Terrazza','Scala']}

def fold(text):return ''.join(x for x in unicodedata.normalize('NFKD',text.casefold()) if not unicodedata.combining(x))
def has(text,term):return re.search(r'(?<!\w)'+re.escape(fold(term))+r'(?!\w)',text) is not None

def analyze(text,language):
    text=fold(text);countries={c for c,terms in ALIASES.items() if any(has(text,t) for t in terms)}
    regions={r for r,terms in REGIONS.items() if any(has(text,t) for t in terms)}
    regions.update(m.group(0).upper() for m in re.finditer(r'\b(?:be|nl|de|fr|gb|ie|dk|es|it|at|ch|tr)-[a-z0-9]{1,8}\b',text))
    # Northern Ireland is GB, not the Republic of Ireland.
    if 'GB-NIR' in regions:countries.discard('IE')
    for region in regions:countries.add(region[:2])
    country=next(iter(countries)) if len(countries)==1 else None
    region=next(iter(regions)) if len(regions)==1 and country and next(iter(regions)).startswith(country+'-') else None
    mentions=[]
    for pattern in (r'\b(\d+)\s*[- ]?\s*(?:bed(?:room)?s?|slaapkamers?|dormitorios?|yatak odas[ıi])\b',):
        mentions += [('bedrooms',int(m.group(1)),True) for m in re.finditer(pattern,text)]
    mentions += [('bedrooms',int(m.group(1)),True) for m in re.finditer(r'\b(\d+)\s*\+\s*1\b',text)]
    mentions += [('main_rooms',float(m.group(1).replace(',','.')),False) for m in re.finditer(r'\b(?:t|f)\s*(\d+(?:[.,]\d+)?)\b',text)]
    mentions += [('main_rooms',float(m.group(1).replace(',','.')),False) for m in re.finditer(r'\b(\d+(?:[.,]\d+)?)\s*[- ]?\s*(?:zimmer(?:wohnung)?|kamer(?:woning)?s?|vaerelses|værelses)\b',text)]
    for term,n in [('monolocale',1),('bilocale',2),('trilocale',3),('quadrilocale',4)]:
        if has(text,term):mentions.append(('main_rooms',float(n),False))
    bedrooms={n for kind,n,_ in mentions if kind=='bedrooms'};main={n for kind,n,_ in mentions if kind=='main_rooms'}
    conflict=len(bedrooms)>1 or len(main)>1
    count=next(iter(bedrooms)) if len(bedrooms)==1 else None
    if count is not None and not 0<=count<=5:conflict=True
    main_count=next(iter(main)) if len(main)==1 else None
    estimate=int(main_count)-1 if main_count is not None and main_count.is_integer() and main_count>=2 else None
    if count is not None and estimate is not None and count!=estimate:conflict=True
    area=[]
    for match in re.finditer(r'\b(\d+(?:[.,]\d+)?)\s*(m2|m²|sq\s*ft|sqft|ft2|ft²)\b',text):
        value=float(match.group(1).replace(',','.'));unit=match.group(2)
        area.append(dict(value=value,unit=unit,m2=value*.09290304 if unit not in ('m2','m²') else value))
    return dict(language=language,country=country,region=region,country_candidates=sorted(countries) if countries else HINTS.get(language,[]),
        country_confirmed=country is not None,country_conflict=len(countries)>1,bedrooms=count,bedrooms_confirmed=count is not None and not conflict,
        main_rooms=main_count,bedrooms_estimate=estimate,room_count_conflict=conflict,areas=area,
        needs_confirmation=(country is None or conflict or (count is None and bool(mentions))),
        notes=['main-room estimates assume exactly one living room; confirm layout','language does not establish project country','fractional Swiss room counts do not map to integer bedrooms'])

def build():
    result=dict(version='locale-notation/1',language_country_hints=HINTS,country_aliases=ALIASES,region_aliases=REGIONS,
        terms={lang:dict(zip(['living','kitchen','bedroom','bath','wc','hall','utility','other','balcony','terrace','stair'],names)) for lang,names in ROOMS.items()},
        notation=[dict(term=t,meaning=m,bedroom_confirmation=c) for t,m,c in [
            ('3+1','3 bedrooms + 1 living room',True),('3-bed','3 bedrooms; living excluded',True),('3 slaapkamers','3 bedrooms',True),('3 dormitorios','3 bedrooms',True),
            ('T3 / F3','3 main rooms; 2 bedrooms only under one-living-room assumption',False),('3-Zimmer','3 main rooms; not 3 bedrooms',False),('4-kamerwoning','4 main rooms; confirm included spaces',False),('trilocale','3 main rooms; confirm kitchen/living configuration',False),('3-værelses','3 main rooms including living',False),('3.5-Zimmer','fractional room convention; ask, never round to bedrooms',False)]],
        units=dict(sq_ft_to_m2=.09290304,area_basis='m² is not an area definition: GIA, usable net, Carrez, habitable area and Bbl GO are not interchangeable'),
        floors=dict(GB='ground=0, first=1; confirm listing convention',IE='ground=0, first=1; confirm',US='first may mean ground; do not apply to GB',EU='country/listing convention must be confirmed; basement negative, attic is not a height guarantee'),
        directions={'tr':['kuzey','güney','doğu','batı'],'en':['north','south','east','west'],'de':['Nord','Süd','Ost','West'],'fr':['nord','sud','est','ouest'],'nl':['noord','zuid','oost','west'],'da':['nord','syd','øst','vest'],'es':['norte','sur','este','oeste'],'it':['nord','sud','est','ovest']},
        evidence='language conventions are explanatory mappings; ambiguous bedroom inference always confirmed with user')
    write(DATA/'dil-ulke-sozlugu.json',result);return result

if __name__=='__main__':build()
