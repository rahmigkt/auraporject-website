"""Four manually written Italian conversations; internal provenance stays outside."""
import json
from it import OUT,dump
from build02 import area
from denetim import check

CASES=[
[
('Siamo in affitto a Milano, con una bambina. Vorremmo sistemare tutta casa senza farla sembrare uno showroom.', 'Partiamo da come la vivete: cosa volete tenere e dove vi manca spazio? Se mi mandi una pianta con le misure e qualche foto dei mobili, possiamo cercare una soluzione che vi somigli.'),
('Ecco la pianta quotata. Avevo segnato 88 metri quadrati; il parquet e la cucina restano.', 'Dalle misure delle stanze risultano {net} m² interni, senza i balconi. Gli 88 metri potrebbero comprendere altro: prima di scegliere i mobili terrei distinti i due conteggi.'),
('Lascia il soggiorno dov’è e usa le due stanze senza nome per noi e per nostra figlia. Nessuna parete da spostare.', 'Va bene: il soggiorno ha {living} m² e rimane separato dalla cucina. Teniamo le due camere e lavoriamo sullo spazio che avete, senza complicare la casa con nuovi lavori.'),
('Sul tappeto giochiamo tutti e tre; vorrei un divano piccolo e un tavolino facile da raggiungere, niente mobile TV.', 'Proverei un divano da {sofa} mm e un tavolino da 900 × 550 mm, lasciando il centro della stanza il più libero possibile. Il tappeto lo sceglieremo dopo, pensando anche a come lo usate quando giocate.'),
('Per noi un materasso da 140, per lei da 90. Bastano armadi larghi 120 centimetri.', 'Tengo queste misure e considero anche l’ingombro delle strutture dei letti. Per vostra figlia eviterei altri mobili finché non mi dite cosa vuole conservare nella sua camera.'),
('Un amico dice che con il Salva Casa basta un soffitto di due metri e quaranta, sempre. È così?', 'Non lo darei per scontato: vanno verificate le condizioni dell’intervento con un tecnico. Per proseguire, intanto, mi serve l’altezza reale delle stanze.'),
('La misureremo. Riesci a tenere libero il passaggio dalla porta al soggiorno?', 'Nel disegno i mobili lasciano libera la zona davanti alla porta. Non conosco ancora il verso esatto di apertura: controlliamolo prima di confermare il divano.'),
('Mi piace partire dal gioco, non dalla televisione. Mandiamo questa proposta al designer.', 'Gli preparo un riepilogo con il vostro modo di usare il soggiorno e ciò che volete tenere. Con lui potrete scegliere la disposizione definitiva dopo aver controllato le misure mancanti, senza perdere questa idea di casa vissuta.')],
[
('A Roma mio padre viene spesso da noi e usa il deambulatore. Vorrei una casa comoda, non piena di cose.', 'Quali percorsi gli risultano più faticosi: dall’ingresso al soggiorno o verso il bagno? Mandami la pianta misurata e dimmi anche se ci sono gradini, così partiamo dalle sue abitudini.'),
('Ho allegato la pianta. Pensavo fossero 90 metri utili; l’ingresso esterno e i gradini non li ho misurati.', 'La somma delle stanze dà {net} m² interni; non posso equipararla automaticamente ai 90 dell’annuncio. Segniamo a parte l’accesso esterno, che per tuo padre conta quanto lo spazio dentro casa.'),
('Il soggiorno resta quello segnato, le due stanze libere diventano camere. La cucina non si tocca.', 'Mantengo quella divisione: il soggiorno misura {living} m² e le camere restano separate. Cercherei pochi arredi ben leggibili, così il percorso quotidiano non diventa una corsa a ostacoli.'),
('Mettiamo un divano compatto e un tavolino; niente poltrona aggiuntiva per ora.', 'Uso il divano da {sofa} mm con un tavolino da 900 × 550 mm. Prima di aggiungere altre sedute guarderemo come tuo padre entra, si avvicina e si alza.'),
('Un letto da 140 nella camera grande e uno da 90 nell’altra, armadi da 120 centimetri.', 'Li tengo come scelta iniziale, con il loro ingombro completo. Lo spazio per avvicinarsi al letto con un ausilio va però valutato sulle esigenze di tuo padre, non soltanto sulla possibilità di far stare il letto.'),
('La porta sul disegno è larga 80 centimetri. Possiamo scrivere che la casa è accessibile?', 'Non ancora: serve il passaggio libero effettivo, insieme alla verifica degli altri percorsi. Possiamo invece indicare con chiarezza cosa misurare, senza promettere a tuo padre una comodità che non abbiamo controllato.'),
('Allora lasciamo anche il bagno da verificare. C’è una prima disposizione da discutere?', 'Sì, possiamo confrontarci sulla posizione del divano e dei letti, mantenendo aperte le domande sul bagno e sull’ingresso. Eviterei di aggiungere tappeti sul percorso prima di capire come si muove tuo padre.'),
('Questo mi aiuta a preparare l’incontro. Per noi viene prima la sua autonomia.', 'Metto questa priorità in cima al riepilogo per il designer. Sarà lui a definire con voi la soluzione finale, dopo aver visto accessi e misure: gli arredi dovranno aiutare la vita quotidiana, non chiedere a tuo padre di adattarsi a loro.')],
[
('Stiamo guardando una villetta a schiera vicino a Bologna. Al piano terra riceviamo amici, sopra vorremmo dormire.', 'Per organizzare tutta la casa servono le piante di entrambi i piani e le misure della scala. Cosa avete già a disposizione e quali stanze volete poter usare anche per gli ospiti?'),
('Per ora ho solo la pianta di questo piano; credevo fosse di 70 metri. Quella sopra arriverà più avanti.', 'Questo piano ha {net} m² interni dalle misure che mi hai mandato. Possiamo lavorare su questi ambienti e lasciare il piano superiore aperto, senza fingere di conoscerne la forma.'),
('La stanza senza nome più grande sarà il soggiorno; le altre due possono ospitare chi si ferma a dormire.', 'Il soggiorno viene di {living} m² e teniamo le altre due stanze come camere per gli ospiti. In questo modo possiamo discutere il piano che conosciamo senza decidere già come vivrete quello superiore.'),
('Vorrei un divano piccolo e un tavolino, lasciando la cucina chiusa per ora.', 'Provo il divano da {sofa} mm e il tavolino da 900 × 550 mm. Per ricevere amici partirei da una seduta raccolta, con spazio per passare senza attraversare ogni volta il gruppo.'),
('Nella camera più grande un materasso da 140, nell’altra da 90, con armadi larghi 120.', 'Inserisco queste dimensioni per le due camere e tengo conto delle strutture dei letti. Se in futuro una stanza servirà diversamente, ne riparleremo senza trasformare automaticamente tutto il piano.'),
('Per fare prima copia questa pianta sopra e piazza una scala in un angolo.', 'Aspetterei la pianta del piano superiore: senza di essa rischiamo di occupare un punto che serve già ad altro. Per la scala ci mancano anche il dislivello e lo spazio sopra la testa.'),
('Hai ragione, non voglio un piano inventato. Mostrami almeno come stanno gli arredi qui sotto.', 'Qui possiamo discutere le posizioni di divano, tavolino e letti mantenendo le pareti esistenti. La cucina resta separata e la scala non compare finché non abbiamo le misure per studiarla davvero.'),
('Va bene. Porteremo il resto al designer, insieme a come ospitiamo gli amici.', 'Gli consegno il lavoro su questo piano e la richiesta ancora aperta per l’intera villetta. Potrà legare i due livelli in una proposta definitiva quando avrà visto entrambe le piante e il collegamento reale.')],
[
('A Palermo vogliamo sistemare una casa indipendente per noi e per i nipoti quando vengono. Ci piacerebbe anche una terrazza.', 'Mi mandi la pianta con le misure e qualche foto di ciò che volete tenere? Vorrei capire anche se la terrazza esiste già o se è una possibilità da valutare.'),
('La terrazza è soltanto un desiderio. Allego il piano della casa; avevo contato circa 85 metri.', 'Le stanze interne sommano {net} m², senza spazi esterni. La terrazza resta una domanda da approfondire: non la aggiungerei al disegno senza sapere dove e come potrebbe essere realizzata.'),
('La stanza più grande sarà il soggiorno, le altre tre camere. Teniamo tutte le pareti e la cucina.', 'Così il soggiorno misura {living} m² e conserviamo le tre camere separate. È una buona base per distinguere la vostra quotidianità dai momenti in cui la casa si riempie di nipoti.'),
('Un divano compatto e un tavolino ci bastano. Per tessuti e luci vorrei decidere con calma.', 'Parto dal divano da {sofa} mm e dal tavolino da 900 × 550 mm. Lasciamo tende, tappeti e luce tra le scelte da fare insieme, invece di riempire subito ogni spazio con una proposta.'),
('Il nostro materasso da 140, letti da 90 nelle altre camere e armadi da 120 centimetri.', 'Tengo queste larghezze nelle camere e considero anche lo spazio delle strutture. Prima di ordinare serviranno le misure complete di ciò che possedete e volete riutilizzare.'),
('Il bagno ha una finestra, quindi metti pure che è tutto a norma. Non ho voglia di altre pratiche.', 'La finestra da sola non basta per confermare che tutto sia a norma. Per ora possiamo annotare il bagno tra i punti da verificare e continuare sulle scelte degli arredi, senza aggiungere un’approvazione che non abbiamo.'),
('D’accordo. Non spostare il bagno per inseguire la terrazza e lasciaci una casa semplice.', 'Il bagno resta dov’è, e nessuna parete viene tolta per creare la terrazza. Mi terrei su pochi pezzi, lasciando al designer lo studio del rapporto con l’esterno quando avremo informazioni sufficienti.'),
('Portiamo questa idea al designer: una casa nostra, che possa accogliere anche i nipoti.', 'Nel riepilogo troverà questa distinzione e le decisioni ancora da prendere, compresa la terrazza. Definirete con lui il progetto finale dopo il sopralluogo, scegliendo ciò che vi serve davvero anche quando siete soltanto in due.')]
]

SUMMARIES=[
 'Milano: çocuklu kiracı aile; evin showroom gibi olmaması, çocukla oyun ve TV yerine birlikte yaşam öncelikli. Mutfak/parke korunur. İki oda, ana yatak 140 ve çocuk yatağı 90; gerçek tavan ve kapı yönü eksik. Salva Casa otomatik uygunluk sayılmadı.',
 'Roma: yürüteç kullanan baba sık ziyaret ediyor; özerklik ve az eşya öncelikli. Giriş basamakları, dış güzergâh, serbest kapı geçişi ve banyo incelenecek. Sıradan mobilya yerleşimi erişilebilirlik onayı değil.',
 'Bologna: sıra ev; yalnız bilinen kat incelendi, alt kattaki iki oda misafir yatak odası. Üst kat ve merdiven uydurulmadı; iki katın gerçek bağlantısı, kot ve baş mesafesi gerekiyor.',
 'Palermo: müstakil ev ve torun ziyaretleri; üç ayrı yatak odası, çift kişilik ana yatak ve diğerlerinde tek kişilikler. Teras yalnız istek, geometri eklenmedi. Banyo yerinde; perde/halı/ışık kararı açık.'
]

def write():
    for i,pairs in enumerate(CASES,1):
        file=OUT/f'ev-sohbet-it-{i:02}.json';r=json.loads(file.read_text(encoding='utf-8'));a=check(r,OUT/'kaynaklar');r['source_exceptions']=a['source_exceptions']
        sofa=next(it for it in r['plan']['items'] if it['design']['kind']=='sofa')
        slots=dict(net=f'{r["claimed_net_area_m2"]:.1f}'.replace('.',','),living=f'{sum(area(s) for s in r["plan"]["spaces"] if s["kind"]=="living"):.1f}'.replace('.',','),sofa=sofa['design']['params']['width'])
        r['dialogue']=[dict(role=role,content=text.format(**slots)) for pair in pairs for role,text in zip(('user','assistant'),pair)];r['designer_summary_tr']=SUMMARIES[i-1];dump(file,r)

if __name__=='__main__':write()
