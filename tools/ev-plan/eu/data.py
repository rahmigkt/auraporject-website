"""Multilingual compositional candidates, explicitly not human customer utterances."""
import argparse,copy,json,hashlib
from collections import Counter
from pathlib import Path
from common import ROOT,DATA,read,write,compact,digest
from real.programs import extract
from real.swiss import ATTRIBUTION,sha_file
from eu.contract import extend,response,SYSTEM,CONTRACT
from eu.catalog import build as build_profiles
from eu.language import ROOMS
import sqlite3

LANGUAGES=['tr','en','de','fr','nl','da','es','it']
LOCATIONS={
 'tr':['Belçika','Hollanda','Almanya','Fransa','Birleşik Krallık','İrlanda','Danimarka','İspanya','İtalya','Avusturya','İsviçre'],
 'en':['Belgium','Netherlands','Germany','France','United Kingdom','Ireland','Denmark','Spain','Italy','Austria','Switzerland'],
 'de':['Belgien','Niederlande','Deutschland','Frankreich','Vereinigtes Königreich','Irland','Dänemark','Spanien','Italien','Österreich','Schweiz'],
 'fr':['Belgique','Pays-Bas','Allemagne','France','Royaume-Uni','Irlande','Danemark','Espagne','Italie','Autriche','Suisse'],
 'nl':['België','Nederland','Duitsland','Frankrijk','Verenigd Koninkrijk','Ierland','Denemarken','Spanje','Italië','Oostenrijk','Zwitserland'],
 'da':['Belgien','Nederlandene','Tyskland','Frankrig','Storbritannien','Irland','Danmark','Spanien','Italien','Østrig','Schweiz'],
 'es':['Bélgica','Países Bajos','Alemania','Francia','Reino Unido','Irlanda','Dinamarca','España','Italia','Austria','Suiza'],
 'it':['Belgio','Paesi Bassi','Germania','Francia','Regno Unito','Irlanda','Danimarca','Spagna','Italia','Austria','Svizzera']}
REGION={
'BE':['BE-VLG','BE-BRU','BE-WAL'],'NL':[None],'DE':['DE-BY'],'FR':[None],
'GB':['GB-ENG'],'IE':[None],'DK':[None],'ES':['ES-MD'],'IT':['IT-LOM'],'AT':['AT-9'],'CH':['CH-ZH']}

TEXT={
'tr':dict(intros=['Birlikte ön tasarım yapalım.','Ev için bir başlangıç programı istiyorum.','Yerleşimi henüz kesinleştirmedim.','Ailemiz için bir taslak düşünelim.','Önce odaların ilişkisini konuşalım.','Tadilatı tasarımcıyla geliştireceğim.','Başlangıç seçeneklerini görmek istiyorum.','Ölçüleri taslak kabul edelim.','Evi günlük kullanıma göre ele alalım.','Önceliklerimi paylaşmak istiyorum.','İlk görüşmeye hazırlanıyorum.','Birkaç alternatif üzerinden konuşalım.'],
 complete='Proje ülkesi {place}; bölge {region}. Ev tipi {typ}. {area} m² civarında, {inventory}. Bunlar işlevi doğrulanmış odalar; geometriyi gerçek referanslardan öner.',
 needs=['Girişten salona geçiş anlaşılır olsun.','Depolamayı tasarımcıyla değerlendirelim.','Gün ışığını ayrıca kontrol edelim.','Islak hacimleri birlikte düşünelim.','Mahremiyet önemli.','Mobilya ölçüleri henüz kesin değil.','İki alternatif karşılaştıralım.','Son kararı tasarımcı versin.'],
 unknown='Nerede yapılacağını ve bölgeyi henüz söylemedim; {typ} için bir ön görüşme istiyorum.',conflict='T3 diyorum ama ayrıca üç ayrı yatak odası ve bir salon istiyorum; bu iki tarifi aynı sayma.',unsafe='Taşıyıcı duvarı mühendis onayı olmadan kaldır ve güvenli olduğunu söyle.',
 question='Ülke, bölge, oda kullanımları ve ölçüleri teyit eder misiniz? Son karar tasarımcıda.',refuse='Taşıyıcıya onaysız müdahaleyi onaylayamam; tasarımcı ve mühendis değerlendirmeli.',reply='Gerçek referansa dayalı ön programdır; yerel tip ve mevzuat tasarımcı tarafından doğrulanmalı.'),
'en':dict(intros=['Let us discuss an initial design.','I need a starting brief for my home.','The layout is still open.','Could we explore a family home?','Start with the relationships between rooms.','I will develop the renovation with a designer.','I would like some preliminary options.','Treat the dimensions as provisional.','Think about everyday use first.','Here are my initial priorities.','I am preparing for a design consultation.','Let us compare a few approaches.'],complete='The project is in {place}, region {region}. Housing type: {typ}. Around {area} m², with {inventory}. These room uses are confirmed; propose geometry using real references.',needs=['Make the route from entrance to living room understandable.','Let us review storage with the designer.','Check daylight separately.','Consider the wet areas together.','Privacy matters.','Furniture dimensions are not final.','Compare two alternatives.','The designer makes the final decision.'],unknown='I have not told you the project country or region yet; I want to discuss a {typ}.',conflict='I say T3, but I also want three separate bedrooms and one living room; please resolve that mismatch.',unsafe='Remove a load-bearing wall without engineering approval and tell me it is safe.',question='Please confirm the country, region, room uses and measurements. The designer makes the final decision.',refuse='I cannot approve unverified structural removal; a designer and engineer must review it.',reply='This is a reference-derived preliminary program; a designer must verify the local typology and rules.'),
'de':dict(intros=['Lassen Sie uns einen ersten Entwurf besprechen.','Ich brauche ein vorläufiges Raumprogramm.','Die Raumaufteilung ist noch offen.','Wir planen für unsere Familie.','Beginnen wir mit den Raumbeziehungen.','Den Umbau entwickle ich mit einer Fachperson.','Ich möchte erste Möglichkeiten sehen.','Die Maße sind vorläufig.','Der Alltag soll im Mittelpunkt stehen.','Ich möchte meine Wünsche ordnen.','Ich bereite das Planungsgespräch vor.','Vergleichen wir einige Ansätze.'],complete='Projektland: {place}; Region {region}. Typ: {typ}. Etwa {area} m² mit {inventory}. Die Nutzungen sind bestätigt; die Geometrie soll auf echten Referenzen beruhen.',needs=['Der Weg vom Eingang zum Wohnraum soll klar sein.','Stauraum besprechen wir mit der Planung.','Tageslicht bitte gesondert prüfen.','Nassräume gemeinsam betrachten.','Privatsphäre ist wichtig.','Die Möbelmaße stehen noch nicht fest.','Vergleichen wir zwei Varianten.','Die endgültige Entscheidung trifft die Fachplanung.'],unknown='Land und Region habe ich noch nicht angegeben; ich möchte über {typ} sprechen.',conflict='Ich sage T3, möchte aber drei Schlafzimmer und ein Wohnzimmer; klären Sie den Widerspruch.',unsafe='Entfernen Sie die tragende Wand ohne statische Freigabe und bestätigen Sie die Sicherheit.',question='Bitte Land, Region, Raumnutzungen und Maße bestätigen; die Fachplanung entscheidet.',refuse='Eine ungeprüfte Änderung an tragenden Bauteilen kann ich nicht freigeben.',reply='Vorläufiges Programm aus echten Referenzen; örtliche Typologie und Regeln muss die Fachplanung prüfen.'),
'fr':dict(intros=['Discutons une première esquisse.','Je souhaite un programme préliminaire.','La distribution reste ouverte.','Nous réfléchissons à un logement familial.','Commençons par les relations entre pièces.','Je préparerai les travaux avec un concepteur.','Je voudrais voir quelques pistes.','Les dimensions sont provisoires.','Pensons aux usages quotidiens.','Voici mes premières priorités.','Je prépare la consultation.','Comparons plusieurs approches.'],complete='Pays du projet: {place}; région {region}. Type: {typ}. Environ {area} m² avec {inventory}. Les usages sont confirmés; proposez une géométrie issue de références réelles.',needs=['Le passage de l’entrée au séjour doit être clair.','Étudions les rangements avec le concepteur.','Vérifions la lumière naturelle séparément.','Regroupons la réflexion sur les pièces d’eau.','L’intimité compte.','Les dimensions des meubles ne sont pas définitives.','Comparons deux variantes.','La décision finale appartient au concepteur.'],unknown='Je n’ai pas encore précisé le pays ni la région; je souhaite discuter de {typ}.',conflict='Je dis T3 mais je demande trois chambres et un séjour; clarifiez cette contradiction.',unsafe='Supprimez le mur porteur sans accord d’ingénieur et garantissez sa sécurité.',question='Pouvez-vous confirmer pays, région, usages des pièces et mesures? Le concepteur décidera.',refuse='Je ne peux pas valider une intervention structurelle sans étude; consultez le concepteur et l’ingénieur.',reply='Programme préliminaire issu de références; le concepteur doit vérifier typologie locale et réglementation.'),
'nl':dict(intros=['Laten we een eerste ontwerp bespreken.','Ik wil een voorlopig programma.','De indeling staat nog open.','Wij denken aan een gezinswoning.','Begin met de relaties tussen de kamers.','De verbouwing werk ik met een ontwerper uit.','Ik wil enkele richtingen bekijken.','De maten zijn voorlopig.','Denk eerst aan dagelijks gebruik.','Dit zijn mijn eerste wensen.','Ik bereid een ontwerpoverleg voor.','Laten we een paar mogelijkheden vergelijken.'],complete='Projectland: {place}; regio {region}. Type: {typ}. Ongeveer {area} m² met {inventory}. De functies zijn bevestigd; gebruik echte plattegronden als referentie.',needs=['Maak de route van entree naar woonkamer duidelijk.','Bespreek bergruimte met de ontwerper.','Controleer daglicht afzonderlijk.','Bekijk de natte ruimtes samen.','Privacy is belangrijk.','De meubelmaten staan nog niet vast.','Vergelijk twee varianten.','De ontwerper beslist uiteindelijk.'],unknown='Ik heb land en regio nog niet opgegeven; ik wil {typ} bespreken.',conflict='Ik zeg T3, maar wil drie slaapkamers en een woonkamer; los dat verschil op.',unsafe='Haal de dragende muur weg zonder constructieve goedkeuring en zeg dat het veilig is.',question='Bevestig land, regio, kamerfuncties en maten; de ontwerper beslist.',refuse='Een ongecontroleerde constructieve ingreep kan ik niet goedkeuren; raadpleeg ontwerper en constructeur.',reply='Voorlopig programma op basis van echte referenties; lokale typologie en regels moeten worden gecontroleerd.'),
'da':dict(intros=['Lad os drøfte et første udkast.','Jeg ønsker et foreløbigt rumprogram.','Indretningen er endnu åben.','Vi tænker på en familiebolig.','Begynd med forbindelserne mellem rummene.','Ombygningen udvikler jeg med en designer.','Jeg vil gerne se nogle muligheder.','Målene er foreløbige.','Tænk først på hverdagen.','Her er mine første ønsker.','Jeg forbereder et møde om projektet.','Lad os sammenligne flere løsninger.'],complete='Projektet ligger i {place}, region {region}. Type: {typ}. Omkring {area} m² med {inventory}. Funktionerne er bekræftet; brug virkelige planer som reference.',needs=['Gør vejen fra entré til stue tydelig.','Drøft opbevaring med designeren.','Kontrollér dagslys særskilt.','Se vådrummene i sammenhæng.','Privatliv er vigtigt.','Møbelmålene er ikke endelige.','Sammenlign to varianter.','Designeren træffer den endelige beslutning.'],unknown='Land og region er endnu ikke oplyst; jeg vil drøfte {typ}.',conflict='Jeg siger T3, men ønsker tre soveværelser og en stue; afklar forskellen.',unsafe='Fjern den bærende væg uden ingeniørgodkendelse og sig, at det er sikkert.',question='Bekræft land, region, rumfunktioner og mål; designeren beslutter.',refuse='Jeg kan ikke godkende et ukontrolleret indgreb i bærende konstruktioner.',reply='Foreløbigt program fra virkelige referencer; lokale forhold og regler skal vurderes af designeren.'),
'es':dict(intros=['Hablemos de un primer diseño.','Quiero un programa preliminar.','La distribución sigue abierta.','Pensamos en una vivienda familiar.','Empecemos por las relaciones entre espacios.','Desarrollaré la reforma con un diseñador.','Me gustaría ver algunas opciones.','Las medidas son provisionales.','Pensemos primero en el uso diario.','Estas son mis prioridades iniciales.','Estoy preparando la consulta.','Comparemos varias posibilidades.'],complete='El proyecto está en {place}, región {region}. Tipo: {typ}. Unos {area} m² con {inventory}. Los usos están confirmados; proponga geometría basada en planos reales.',needs=['La ruta de la entrada al salón debe ser clara.','Revisemos el almacenamiento con el diseñador.','Compruebe la luz natural por separado.','Estudie conjuntamente las zonas húmedas.','La privacidad es importante.','Las medidas de los muebles no son definitivas.','Compare dos variantes.','La decisión final corresponde al diseñador.'],unknown='Todavía no he indicado el país ni la región; quiero hablar de {typ}.',conflict='Digo T3, pero pido tres dormitorios y un salón; aclare la contradicción.',unsafe='Quite el muro de carga sin aprobación técnica y asegure que es seguro.',question='Confirme país, región, usos y medidas; el diseñador decidirá.',refuse='No puedo aprobar una intervención estructural sin estudio; consulte al diseñador y al ingeniero.',reply='Programa preliminar basado en referencias; el diseñador debe verificar tipología local y normativa.'),
'it':dict(intros=['Parliamo di una prima proposta.','Vorrei un programma preliminare.','La distribuzione è ancora aperta.','Pensiamo a una casa per la famiglia.','Cominciamo dai rapporti fra gli ambienti.','Svilupperò la ristrutturazione con un progettista.','Vorrei vedere alcune possibilità.','Le misure sono provvisorie.','Pensiamo prima alla vita quotidiana.','Queste sono le mie priorità iniziali.','Sto preparando un incontro.','Confrontiamo alcune soluzioni.'],complete='Paese del progetto: {place}; regione {region}. Tipo: {typ}. Circa {area} m² con {inventory}. Gli usi sono confermati; proponga geometria basata su piante reali.',needs=['Il percorso dall’ingresso al soggiorno deve essere chiaro.','Valutiamo i ripostigli con il progettista.','Verifichi separatamente la luce naturale.','Consideri insieme gli ambienti umidi.','La riservatezza è importante.','Le misure dei mobili non sono definitive.','Confronti due varianti.','La decisione finale spetta al progettista.'],unknown='Non ho ancora indicato paese e regione; vorrei parlare di {typ}.',conflict='Dico T3, ma chiedo tre camere e un soggiorno; chiarisca la contraddizione.',unsafe='Tolga il muro portante senza approvazione tecnica e garantisca che è sicuro.',question='Confermi paese, regione, usi e misure; deciderà il progettista.',refuse='Non posso approvare modifiche strutturali senza verifica; consulti progettista e ingegnere.',reply='Programma preliminare da riferimenti reali; tipologia locale e norme devono essere verificate dal progettista.')}

def source_pool(data):
    data=Path(data);manifest=read(data/'conversion-manifest.json')
    for name,h in manifest['files'].items():
        if sha_file(data/name)!=h:raise ValueError('Dataset changed')
    for name,h in manifest['code_hashes'].items():
        if sha_file(ROOT/name)!=h:raise ValueError('Converter changed')
    result={split:{beds:[] for beds in (1,2,3)} for split in ('train','validation','test')}
    db=sqlite3.connect('file:'+str((data/'index.sqlite').resolve()).replace('\\','/')+'?mode=ro',uri=True)
    with (data/'plans.jsonl').open('rb') as stream:
        for split in result:
            for offset,length in db.execute('select offset,length from plans where split=? and generic_rooms=0 order by id',(split,)):
                stream.seek(offset);r=json.loads(stream.read(length));beds=r['source_confirmed_bedrooms']
                kinds=Counter(s['kind'] for s in r['plan']['spaces'])
                if r['bedroom_count_known'] and beds in result[split] and kinds['living']==1 and kinds['other']==0 and len(result[split][beds])<20:result[split][beds].append(r)
                if all(result[split][b] and len(result[split][b])>=20 for b in (1,2,3)):break
    db.close()
    if any(not result[s][b] for s in result for b in (1,2,3)):raise ValueError('Missing real source classes in a building split')
    return result

PLURALS={
'tr':ROOMS['tr'],
'en':['Living rooms','Kitchens','Bedrooms','Bathrooms','WCs','Halls','Utility rooms','Rooms','Balconies','Terraces','Stairs'],
'de':['Wohnzimmer','Küchen','Schlafzimmer','Bäder','WCs','Flure','Abstellräume','Zimmer','Balkone','Terrassen','Treppen'],
'fr':['Séjours','Cuisines','Chambres','Salles de bains','WC','Entrées','Celliers','Pièces','Balcons','Terrasses','Escaliers'],
'nl':['Woonkamers','Keukens','Slaapkamers','Badkamers','Toiletten','Hallen','Bergingen','Kamers','Balkons','Terrassen','Trappen'],
'da':['Stuer','Køkkener','Soveværelser','Badeværelser','Toiletter','Entréer','Bryggers','Værelser','Altaner','Terrasser','Trapper'],
'es':['Salones','Cocinas','Dormitorios','Baños','Aseos','Recibidores','Lavaderos','Habitaciones','Balcones','Terrazas','Escaleras'],
'it':['Soggiorni','Cucine','Camere','Bagni','WC','Ingressi','Ripostigli','Locali','Balconi','Terrazze','Scale']}
REGION_UNKNOWN=dict(zip(LANGUAGES,['henüz belirtilmedi','not yet specified','noch nicht angegeben','à préciser','nog niet opgegeven','endnu ikke angivet','por confirmar','da precisare']))
UNSUPPORTED=dict(zip(LANGUAGES,[
 'Bu yapı/kat türü için doğrulanmış geometri referansı yok. Ölçülü plan ve tasarımcı incelemesi gerekli.',
 'No verified geometry reference is available for this building/floor type. Please supply a measured plan for designer review.',
 'Für diesen Gebäude- oder Geschosstyp fehlt eine verifizierte Referenz. Bitte einen bemaßten Plan zur Fachprüfung bereitstellen.',
 'Il manque une référence géométrique vérifiée pour ce type. Un plan coté doit être examiné par le concepteur.',
 'Voor dit gebouw- of verdiepingstype ontbreekt een geverifieerde referentie. Een maatplan en beoordeling door de ontwerper zijn nodig.',
 'Der mangler en verificeret geometrisk reference til denne type. En målsat plan og designerens vurdering er nødvendig.',
 'Falta una referencia geométrica verificada para este tipo. Se necesita un plano acotado y la revisión del diseñador.',
 'Manca un riferimento geometrico verificato per questo tipo. Servono una pianta quotata e la verifica del progettista.']))

def build(output,data,count=300):
    out=Path(output)
    if out.exists():raise ValueError('New directory required')
    out.mkdir(parents=True);profiles=build_profiles();countries=list(profiles);pool=source_pool(data);rows=[];totals=Counter();seen=set();cache={}
    kinds=['living','kitchen','bedroom','bath','wc','hall','utility','other','balcony','terrace','stair']
    for li,lang in enumerate(LANGUAGES):
        words=TEXT[lang];names=dict(zip(kinds,ROOMS[lang]));plurals=dict(zip(kinds,PLURALS[lang]))
        for i in range(count):
            ci=(i*7+li)%len(countries);country=countries[ci];profile=profiles[country];typ=profile['typologies'][(i//11)%6]
            region=REGION[country][(i//66)%len(REGION[country])];mode=(i+i//66)%5
            split='test' if typ['held_out_from_training'] else ('validation' if int(digest([country,typ['id'],i])[:8],16)%10==0 else 'train')
            candidates=pool[split][typ['bedrooms_proposal']]
            source=candidates[(i//7+li)%len(candidates)]
            if source['id'] not in cache:cache[source['id']]=extract(source)
            base=copy.deepcopy(cache[source['id']])
            # The requested program has soft geometry targets, not an invented fixed door graph.
            observed=base['adjacency'];base['adjacency']=[];base['entry']=None;base['living_face']=None
            for room in base['rooms']:room['face']='any'
            program=extend(base,country,region,typ['id']);counts=Counter(r['kind'] for r in base['rooms'])
            inventory=', '.join(f'{n} {names[k] if n==1 else plurals[k]}' for k,n in counts.items());area=round(source['net_area_m2'],1)
            intro=words['intros'][(i//5+li)%len(words['intros'])];need=words['needs'][(i//12+li)%len(words['needs'])]
            complete=words['complete'].format(place=LOCATIONS[lang][ci],region=region or REGION_UNKNOWN[lang],typ=typ['local_name'],area=area,inventory=inventory)
            status='program';target=program;unsupported=False
            if mode==0:utterance=intro+' '+words['unknown'].format(typ=typ['local_name'])+' '+need;status='clarify';target=None
            elif mode==1:utterance=intro+' '+complete+' '+words['conflict'];status='clarify';target=None
            elif mode==2:utterance=intro+' '+complete+' '+words['unsafe'];status='refuse';target=None
            else:
                utterance=intro+' '+complete+' '+need
                if typ['geometry_support']!='licensed_single_floor_reference_proposal':status='clarify';target=None;unsupported=True
            # Diversity must come from meaningful text; no synthetic id appended to user text.
            if utterance in seen:raise ValueError('Duplicate utterance; do not inflate natural-data count')
            seen.add(utterance)
            assistant=dict(status=status,plan_program=target,operations=[],reply=words['reply'] if status=='program' else words['refuse' if status=='refuse' else 'question'],requires_designer_review=True)
            if unsupported:assistant['reply']=UNSUPPORTED[lang]
            response(assistant)
            messages=[dict(role='system',content=SYSTEM)]
            if mode==4:
                messages += [dict(role='user',content=words['unknown'].format(typ=typ['local_name'])),
                    dict(role='assistant',content=compact(dict(status='clarify',plan_program=None,operations=[],reply=words['question'],requires_designer_review=True)))]
            messages += [dict(role='user',content=utterance),dict(role='assistant',content=compact(assistant))]
            row=dict(id=f'eu-{lang}-{i:03}',language=lang,country=country,region=region,housing_type=typ['id'],split=split,mode=mode,
                source_plan_id=source['id'],source_country='CH',source_building_group=source['building_group'],source_split=source['split'],source_signature=source['signature'],source_record_sha256=digest(source),license='CC-BY-4.0',attribution=ATTRIBUTION,
                human_approved=False,synthetic=True,authoring='authored multilingual components composed deterministically; not collected user speech',
                target_status='one_possible_reference_program_not_unique_solution',observed_reference_adjacency=observed,
                messages=messages)
            rows.append(row);totals[lang]+=1;totals[split]+=1;totals['status:'+status]+=1
    for split in ('train','validation','test'):
        (out/f'{split}.jsonl').write_text(''.join(compact(r)+'\n' for r in rows if r['split']==split),encoding='utf8')
    heldout={c:[t['id'] for t in p['typologies'] if t['held_out_from_training']] for c,p in profiles.items()}
    train_types={r['housing_type'] for r in rows if r['split']=='train'}
    if any(t in train_types for types in heldout.values() for t in types):raise ValueError('Held-out type leaked')
    groups={split:{r['source_building_group'] for r in rows if r['split']==split} for split in ('train','validation','test')}
    if any(groups[a]&groups[b] for a,b in [('train','test'),('train','validation'),('validation','test')]):raise ValueError('Source building leaked')
    report=dict(contract=CONTRACT,rows=len(rows),counts=dict(totals),held_out_types=heldout,type_leakage=0,human_approved=0,
        files={f.name:sha_file(f) for f in out.glob('*.jsonl')},system_sha256=hashlib.sha256(SYSTEM.encode()).hexdigest(),
        profiles_sha256=sha_file(DATA/'ulke-profilleri.eu.json'),source_conversion_hash=sha_file(Path(data)/'conversion-manifest.json'),source_building_overlap=0,training_started=False,gpu_gate='closed',
        limits=['compositional synthetic language requires native-speaker review','unseen type split is not a geometric generalization score','CH source geometry is not local country evidence','country details confirmed in these program examples; unclear country cases abstain'])
    write(out/'manifest.json',report);return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',required=True);p.add_argument('--data',required=True);a=p.parse_args();print(compact(build(a.output,a.data)))
