"""Four independently written Danish conversations; substitute measured values only."""
import json
from dk import OUT,dump
from build02 import area
from denetim import check

CASES=[
[
('Vi bor til leje i København med et barn. Kan du tegne hele lejligheden ud fra billederne?', 'Jeg kan bruge billederne til at forstå jeres møbler og ønsker, men ikke som en præcis opmåling. Har I en målfast plantegning med døre og vinduer, og hvilke ting skal blive?'),
('Brug den vedlagte schweiziske plan som øvelse. Jeg troede, at den var 110 kvadratmeter.', 'De indvendige rumpolygoner giver {net} m² uden altaner; det er ikke en opmåling af jeres lejlighed. Et dansk BBR-areal har en anden afgrænsning, så forskellen beviser ikke, at der mangler et rum i tegningen.'),
('Behold den markerede stue, og brug de unavngivne rum som soveværelser. Vi flytter ingen vægge.', 'Den anvendelse bliver registreret som jeres valg, mens kildens vægge og åbninger bevares. Stuen er {living} m² i denne reference, så møbleringen tager udgangspunkt i den størrelse.'),
('Vi vil have en lille sofa og et sofabord, ikke et fjernsynsmøbel. Køkken og gulv bliver.', 'Jeg vælger en sofa på {sofa} mm og et sofabord på 900 × 550 mm til placeringsforsøget. Det eksisterende køkken og gulvet er oplysninger om rammen, ikke nye opmålte leverancer.'),
('En madras på 140 i vores værelse og 90 i de andre, med skabe på 120 centimeter.', 'Sengene indgår med deres fulde rammemål, og hvert garderobeskab er 1200 mm bredt i beregningen. Sengen er her en målreference fra det eksisterende værktøj, ikke et nyt produktløfte fra AURA.'),
('Hvis vinduerne fylder ti procent, kan du så skrive, at dagslyskravet er opfyldt?', 'Ikke ud fra de rå åbninger alene: BR18-vejledningen kræver også oplysninger om det faktiske glas og forhold, som begrænser dagslyset. Vi mangler blandt andet glassets egenskaber og skygger fra omgivelserne.'),
('Vis hellere de mangler, der faktisk er. Har programmet fundet plads til møblerne?', 'Placeringsløseren har returneret {items} møbler, og en separat kontrol har undersøgt omrids, overlap og forsigtige dørzoner. De {exceptions} afvigelser fra projektets målkrav, som allerede findes i kilden, bliver stående i kontrollisten.'),
('Så sender vi vores rigtige mål senere. Barnets værelse skal ikke ændres uden at vi taler om det.', 'Designeren får referenceplanen og jeres ønske om at bevare barnets indretning som et foreløbigt oplæg. Den endelige løsning besluttes først sammen med designeren, når de faktiske mål og de møbler, I vil beholde, er kendt.')],
[
('Vi overvejer et rækkehus i Aarhus. Kan du lave stueetagen og soveværelser ovenpå?', 'Send gerne mål for begge etager samt trappens placering og frie højde. Uden dem kan jeg ikke tegne en eksisterende overetage eller love en sikker forbindelse mellem etagerne.'),
('Jeg har kun denne schweiziske plan. Den er vist 100 m²; vi kan bruge den ene etage som eksempel.', 'Referenceetagens indvendige rum giver {net} m², uden udvendige arealer. Jeg holder øvelsen på denne ene etage og markerer overetage og trappe som oplysninger, der stadig mangler.'),
('Det største unavngivne rum bliver stue, og de andre bliver soveværelser i øvelsen.', 'Jeg registrerer netop den fordeling, uden at kalde den en opmåling af rækkehuset. Stuen bliver {living} m², og ingen ny trappe eller etage bliver lagt ind bag om samtalen.'),
('Vælg en kompakt sofa og et lavt bord. Lad være med at åbne køkkenet endnu.', 'Til stuen vælger jeg sofaen på {sofa} mm sammen med bordet på 900 × 550 mm. Køkkenvæggen bliver, fordi vi ikke har undersøgt konstruktion, installationer eller tilladelser.'),
('Brug 140 til den største seng, 90 til de andre og skabe på 120 i bredden.', 'De valgte sengestørrelser og skabene sendes til den samme placeringsløser som i studiet. Den regner på møblernes omrids; et vellykket forsøg siger ikke noget om en endnu ukendt overetage.'),
('Kan du ikke bare kopiere planen opad? Vi kan rette trappen senere.', 'Jeg vil ikke fremstille en kopieret etage som jeres hus. Den øvre geometri og adgang skal måles først; indtil da får designeren et åbent spørgsmål om hele rækkehuset og et begrænset møbelstudie af referenceetagen.'),
('Okay, behold kun den dokumenterede etage. Hvad viser kontrollen?', 'På den leverede etage er {items} møbler placeret af løseren, med {exceptions} bevarede kildeafvigelser fra vores projektmål. Dørzonerne er kontrolleret geometrisk, mens den virkelige trappe og bygningens forhold stadig er uafklarede.'),
('Det er en bedre begyndelse. Jeg skaffer en måltegning af begge etager før næste runde.', 'I overdragelsen står der tydeligt, at en helhedsløsning for rækkehuset endnu ikke foreligger. Designeren vurderer den endelige disponering, når begge etager og forbindelsen imellem dem kan undersøges.')],
[
('Vi har et parcelhus ved Odense og vil gerne have et stort køkken-alrum med stue. Kan du starte?', 'Ja, med et målfast grundlag og en liste over det, I vil bevare. Jeg skal også vide, om ønsket kræver ændrede vægge, og om huset faktisk er i ét plan.'),
('Huset er i ét plan, men vores mål mangler. Prøv den schweiziske reference; jeg læste den som 80 m².', 'For referencen måler jeg {net} m² som summen af indvendige rum. Det er en schweizisk boliggeometri, ikke dokumentation for parcelhusets form, facade eller registrerede danske boligareal.'),
('Brug det største generiske rum som stue og de andre som soveværelser. Bevar det lukkede køkken foreløbig.', 'Så får stuen {living} m² i øvelsen, mens køkkenet forbliver et selvstændigt rum. Jeres ønske om køkken-alrum er et senere undersøgelsespunkt, ikke noget jeg påstår allerede at have løst.'),
('Tag en sofa og et sofabord først. Vores spisebord er gammelt, men vi mangler målene.', 'Jeg tester en sofa på {sofa} mm og et sofabord på 900 × 550 mm. Spisebordet bliver ikke tegnet med gættede mål, og derfor er spisepladsen endnu ikke færdigplanlagt.'),
('En 140-madras i hovedværelset, 90 i de øvrige og 120 brede skabe er fint som reference.', 'De konkrete senge- og skabsvalg danner placeringsanmodningerne for værelserne. Ved senere genbrug af jeres egne møbler skal deres faktiske ydre mål erstatte disse referenceobjekter.'),
('Der er jo normalt et bryggers i et dansk hus. Tegn bare et, hvor der er plads.', 'Jeg kan ikke udlede et bryggers af landet eller boligtypen. Hvis I vil undersøge et nyt, må vi kende behov, afløb og eksisterende rum; jeg opretter ikke et opdigtet rum i kildeplanen.'),
('Lad bryggers og køkken-alrum stå åbne. Hvor langt er møbelberegningen kommet?', 'Løseren har placeret {items} stykker møblement, og kildegrundlaget har {exceptions} noterede afvigelser fra projektets dimensionelle mål. Hverken den eksisterende køkkengang eller en mulig ombygning er dermed godkendt efter BR18.'),
('Send det som en første dialog, så får designeren vores rigtige husplan og bordmål.', 'Designeren får både de beregnede referenceplaceringer og de uafsluttede ønsker om spiseplads, køkken-alrum og bryggers. Beslutningen om den samlede bolig og eventuelle indgreb ligger hos designeren efter gennemgang af det virkelige hus.')],
[
('Jeg søger en lejlighed ved Vejle og bruger rollator, nogle gange kørestol. Kan denne plan godkendes?', 'Jeg kan hjælpe med at beskrive behovene, men en godkendelse kræver en faglig vurdering af den faktiske bolig. Vi skal kende adgang udefra, niveauspring, fri dørpassage og plads ved seng og badeværelse.'),
('Vi har kun den schweiziske tegning som eksempel. Mægleren nævnte 75 m².', 'Her er den beregnede indvendige rumflade {net} m². Jeg kan ikke sammenligne den direkte med et BBR-tal eller tilskrive referencen forholdene i en bestemt bolig ved Vejle.'),
('Lad det største unavngivne rum være stue og resten soveværelser. Ingen ændring af væggene nu.', 'Jeg bruger den rumfordeling og bevarer åbningerne som i kilden. Stuens {living} m² giver en ramme for et foreløbigt møbelforsøg, men ikke et bevis på, at din kørestol kan vende alle nødvendige steder.'),
('Vælg en lille sofa og et sofabord til øvelsen, ikke en færdig tilgængelig løsning.', 'Forsøget bruger sofaen på {sofa} mm og bordet på 900 × 550 mm. Almindelige passagemargener i møbelløseren erstatter ikke personlige behov for vending, forflytning eller hjælp.'),
('En 140-madras i hovedrummet, 90 i de andre og skabe på 120 kan bruges til at prøve.', 'Jeg beregner de referencevalg med de fulde møbelomrids. Plads til at komme over i sengen og betjene skabene skal fortsat vurderes i forhold til dine hjælpemidler og den faktiske indretning.'),
('Hvis en åbning er 800 mm på planen, er den vel automatisk over BR18-grænsen?', 'Tegningens åbningsmål er ikke nødvendigvis den frie passage mellem karm og dørblad. Den relevante bestemmelse om adgangsetagens døre bruger fri passage, og vi mangler netop den opmåling samt vurderingen af dit behov.'),
('Så vil jeg have ærlige resultater uden et grønt tilgængelighedsstempel.', 'Der er {items} løserplacerede møbler og {exceptions} bevarede kildeafvigelser i filen. Omridset er undersøgt separat, mens niveaufri adgang, badeværelsesbrug og dine nødvendige arbejdsarealer står som uafklarede.'),
('Det er i orden. Brug det til at fortælle designeren, hvad der skal undersøges før jeg vælger bolig.', 'Jeg sender et foreløbigt behovsgrundlag frem for et løfte om en egnet lejlighed. Designeren tager den endelige beslutning sammen med dig efter en reel opmåling og en vurdering af adgang og daglig brug.')]
]

SUMMARIES=[
 'Kopenhag: çocuklu kiracı; TV mobilyası istenmiyor, mevcut mutfak ve zemin korunacak. Gerçek aile mobilyaları ve oda ölçüleri eksik. BBR alanı ile net poligon alanı eşit sayılmıyor; günışığı hesabı doğrulanmadı.',
 'Aarhus: sıra ev isteği; yalnız tek katlı İsviçre referansı incelendi. Üst kat ve merdiven uydurulmadı. İki katın ölçülü planı, bağlantı ve baş mesafesi gelmeden bütün ev tasarımı tamamlanmış değildir.',
 'Odense: müstakil tek kat ev ve mutfak-yaşam birleşimi isteniyor. Kaynakta mevcut mutfak korunuyor; yemek masası ölçüsü, bryggers ve duvar müdahalesi açık. İsviçre planı yerel parcelhus örneği sayılmıyor.',
 'Vejle: yürüteç/tekerlekli sandalye kullanan kişi; referans yerleşim erişilebilirlik onayı değildir. Serbest kapı geçişi, kot farkları, dönüş/transfer ve banyo kullanımı gerçek yapıda incelenecek.'
]

def write():
    for i,pairs in enumerate(CASES,1):
        file=OUT/f'ev-sohbet-dk-{i:02}.json';r=json.loads(file.read_text(encoding='utf-8'));result=check(r,OUT/'kaynaklar')
        r['source_exceptions']=result['source_exceptions'];sofa=next(it for it in r['plan']['items'] if it['design']['kind']=='sofa')
        slots=dict(net=f'{r["claimed_net_area_m2"]:.1f}'.replace('.',','),living=f'{sum(area(s) for s in r["plan"]["spaces"] if s["kind"]=="living"):.1f}'.replace('.',','),items=len(r['plan']['items']),exceptions=len(result['source_exceptions']),sofa=sofa['design']['params']['width'])
        r['dialogue']=[dict(role=role,content=text.format(**slots)) for pair in pairs for role,text in zip(('user','assistant'),pair)]
        r['designer_summary_tr']=SUMMARIES[i-1];dump(file,r)

if __name__=='__main__':write()
