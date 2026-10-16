// Multilingual command parser (TR, EN, DE, FR, NL, DA, ES, IT) for typed and spoken design edits.
// Deterministic: works offline on static hosting. Anything it cannot parse can be handed to the AI service.
// Output actions: {type:'set'|'delta', key, value} · {type:'enum', key, value} · {type:'material', slot, key, value}
//                 {type:'style'|'kind', value} · {type:'command', name}
import {RANGES} from './sofa.js';

export function fold(text) {
  return String(text).toLowerCase().replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/œ/g, 'oe')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’`]/g, ' ').replace(/[^a-z0-9.,°\-\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

const L = s => s.trim().split(/\s*\|\s*/);

// ---- Vocabulary (folded forms). Stems ≤3 letters must match a whole word; longer stems match word prefixes.
const SLOTS = {
  arm: L('kolcak|kollar|kolu|kolun|kol|arm|arms|armrest|armlehne|accoudoir|armleuning|armlaen|brazo|bracciol'),
  back: L('sirt|arkalik|back|backrest|rucken|lehne|dossier|rugleuning|rug|ryg|ryglaen|respaldo|schienal'),
  seat: L('oturum|oturma|oturak|seat|sitz|assise|zitting|zit|saede|sae|asiento|sedut'),
  cushion: L('minder|cushion|kissen|coussin|kussen|hynde|cojin|cuscin'),
  leg: L('ayak|ayaklar|leg|legs|bein|beine|fuss|fusse|pied|pieds|poot|poten|benene|pata|patas|gamba|gambe|piedi'),
  base: L('kaide|taban|base|sockel|socle|plint|sokkel|zocalo|zoccolo'),
  wood: L('ahsap|agac|wood|wooden|holz|bois|hout|houten|trae|madera|legno'),
  fabric: L('kumas|doku|fabric|stoff|tissu|stof|bekladning|tela|tessut|tejido'),
  metal: L('metal|metall|metaal|metallo')
};

const TARGETS = [
  ['seatHeight', L('oturma yuksekli|oturum yuksekli|seat height|sitzhohe|hauteur d assise|hauteur de l assise|zithoogte|siddehojde|altura del asiento|altezza della seduta|altezza seduta')],
  ['armHeight', L('kol yuksekli|kolcak yuksekli|arm height|armlehnenhohe|hauteur des accoudoirs|hauteur d accoudoir|armleuninghoogte|armlaenshojde|altura del brazo|altura de los brazos|altezza bracciol')],
  ['armWidth', L('kol genisli|kolcak genisli|arm width|armlehnenbreite|largeur des accoudoirs|armleuningbreedte|armlaensbredde|ancho del brazo|larghezza bracciol')],
  ['legHeight', L('ayak yuksekli|leg height|beinhohe|fusshohe|hauteur des pieds|pootHoogte|poothoogte|benhojde|altura de las patas|altezza delle gambe|altezza gambe')],
  ['legSize', L('ayak kalinli|leg thickness|beinstarke|epaisseur des pieds|pootdikte|bentykkelse|grosor de las patas|spessore gambe')],
  ['backRake', L('sirt egimi|egim|egimi|back angle|rake|recline|ruckenneigung|neigung|inclinaison|hoek|vinkel|inclinacion|inclinazione')],
  ['cushionThickness', L('minder kalinli|cushion thickness|kissendicke|polsterstarke|epaisseur du coussin|kussendikte|hyndetykkelse|grosor del cojin|spessore del cuscino|spessore cuscino')],
  ['cushionCrown', L('kabarik|dolgun|crown|plump|fuller|bauschig|bombe|bol|fyldig|abombad|bombat')],
  ['width', L('genislik|genisli|boyu|uzunluk|width|wide|breite|largeur|breedte|bredde|ancho|anchura|larghezza')],
  ['depth', L('derinlik|derinli|depth|deep|tiefe|profondeur|diepte|dybde|profundidad|profondita')],
  ['height', L('yukseklik|yuksekli|height|tall|hohe|hauteur|hoogte|hojde|altura|altezza')]
];

// Comparative words carry both a direction and a default target.
const COMPARATIVES = [
  [+1, 'width', L('genislet|genis|wider|widen|longer|lengthen|uzat|breiter|verbreiter|langer|elargi|plus large|plus long|breder|langer|bredere|laengere|mas ancho|mas largo|ensancha|alarga|piu largo|piu lungo|allarga|allunga')],
  [-1, 'width', L('daralt|kisalt|dar|narrower|shorter|shorten|schmaler|kurzer|verkurz|plus etroit|plus court|retreci|smaller maken|korter|smallere|kortere|mas estrecho|mas corto|estrecha|acorta|piu stretto|piu corto|restringi|accorcia')],
  [+1, 'depth', L('derinlestir|deeper|tiefer|plus profond|dieper|dybere|mas profundo|piu profondo')],
  [-1, 'depth', L('sig|sigla|shallower|flacher|moins profond|ondieper|mindre dyb|menos profundo|meno profondo')],
  [+1, 'height', L('yukselt|yuksek|taller|higher|raise|hoher|erhoh|plus haut|rehausse|hoger|verhoog|hojere|haev|mas alto|sube|eleva|piu alto|piu alt|alza')],
  [-1, 'height', L('alcalt|alcak|indir|lower|lower it|niedriger|senk|tiefer setzen|plus bas|abaisse|baisse|lager|verlaag|lavere|saenk|mas bajo|baja|bajar|piu basso|piu bass|abbassa')],
  [+1, 'cushionThickness', L('kalinlastir|kalin|thicker|dicker|plus epais|dikker|tykkere|mas grueso|piu spesso')],
  [-1, 'cushionThickness', L('incelt|thinner|dunner|plus fin|plus mince|dunner|tyndere|mas fino|mas delgado|piu sottile')],
  [+1, 'backRake', L('egimli|daha yatik|yatik|reclined|recline more|more reclined|mehr neigung|zuruckgelehnt|plus incline|meer schuin|achterover|mere tilbagelaenet|mas reclinado|piu reclinato')],
  [-1, 'backRake', L('dik|dikles|upright|more upright|aufrechter|aufrecht|plus droit|rechtop|rechter|oprejst|mas recto|piu dritto')],
  [+1, null, L('artir|arttir|buyut|fazla|cok daha|daha cok|increase|more|bigger|larger|mehr|grosser|vergross|augmente|plus grand|agrandi|meer|groter|vergroot|mere|storre|forog|aumenta|mas grande|piu grande|aumentare|aumenta')],
  [-1, null, L('azalt|kucult|eksilt|decrease|less|reduce|smaller|weniger|kleiner|reduzier|verringer|diminue|reduis|moins|minder|kleiner|verklein|mindre|reducer|disminuye|reduce|menos|mas pequeno|diminuisci|riduci|meno|piu piccolo')]
];

const SIZE = {small: L('biraz|azicik|hafif|a bit|a little|slightly|bit|etwas|ein bisschen|leicht|un peu|legerement|een beetje|iets|beetje|lidt|en smule|un poco|ligeramente|un po|leggermente|po'), big: L('cok|epey|baya|much|a lot|lot|way|viel|deutlich|beaucoup|nettement|veel|flink|meget|mucho|bastante|molto|parecchio')};

const ENUM_WORDS = {
  armType: {
    none: L('kolcaksiz|kolsuz|kollari kaldir|armless|no arms|without arms|ohne armlehnen|ohne armlehne|sans accoudoirs|sans accoudoir|zonder armleuningen|uden armlaen|sin brazos|senza braccioli'),
    slim: L('ince kol|ince kolcak|slim arm|thin arm|schmale armlehne|schmal|accoudoirs fins|fin accoudoir|smalle armleuning|smalle armlaen|brazos finos|brazo fino|braccioli sottili|bracciolo sottile|slim'),
    rolled: L('rulo|yuvarlak kol|rolled|roll arm|gerollt|rollarmlehne|roule|gerold|rullede|rullet|enrollad|arrotolat'),
    scroll: L('ingiliz|scroll|english arm|englische|anglais|engelse|engelske|ingles|inglese'),
    square: L('kare kol|kose kol|square arm|eckige armlehne|eckig|accoudoirs carres|carre|vierkante armleuning|vierkant|firkantede|brazos cuadrados|cuadrado|braccioli squadrati|squadrat'),
    track: L('track|yuvarlak kenarli kol|track arm'),
    flare: L('acili kol|flare|ausgestellt|evase|uitlopend|udsvejfede|abocinad|svasat'),
    slope: L('egimli kol|sloped|sloping|schrage armlehne|schrag|incline|schuine|skra|inclinad|inclinat'),
    panel: L('blok kol|panel kol|block arm|panel arm|blockarmlehne|accoudoir bloc|blok armleuning|blokarmlaen|brazo de bloque|bracciolo a blocco'),
    wood: L('ahsap kol|wood arm|wooden arm|holzarmlehne|accoudoirs en bois|accoudoir en bois|houten armleuning|trae armlaen|brazos de madera|braccioli in legno')
  },
  backType: {
    tight: L('sabit sirt|tight back|fester rucken|dossier fixe|vaste rug|fast ryg|respaldo fijo|schienale fisso'),
    loose: L('minderli sirt|ayri sirt|sirt minderi|loose back|back cushions|ruckenkissen|lose kissen|coussins de dossier|losse rugkussens|lose ryghynder|cojines de respaldo|cojines sueltos|cuscini dello schienale|cuscini schienale'),
    channel: L('kanalli|kanal|channel|cannele|canal|kanaal|canales|canali|kanaler'),
    tufted: L('kapitone|chester|tufted|button|capitonne|gesteppt|gecapitonneerd|knappet|capitone|trapuntat'),
    camel: L('kambur|deve|camel|kamel|chameau|kameel|camello|cammello'),
    low: L('alcak sirt|low back|niedrige lehne|niedriger rucken|dossier bas|lage rug|lav ryg|respaldo bajo|schienale basso')
  },
  seatType: {
    bench: L('tek minder|tek parca|bench seat|single cushion|bench|durchgehend|assise unique|banquette|doorlopend|gennemgaende|asiento corrido|seduta unica'),
    split: L('ayri minder|parcali|separate cushions|split|einzelne kissen|getrennt|coussins separes|losse kussens|separate hynder|cojines separados|cuscini separati'),
    tight: L('sabit oturum|tight seat|feste sitz|fester sitz|assise fixe|vaste zitting|fast saede|asiento fijo|seduta fissa')
  },
  baseType: {
    plinth: L('baza|plinth|sockel|socle|plint|sokkel|zocalo|zoccolo'),
    floating: L('havada|yuzen|floating|schwebend|flottant|zwevend|svaevende|flotante|sospes'),
    skirt: L('etek|volan|skirt|volant|jupe|rok|skort|faldon|balza'),
    sled: L('kizak|sled|kufe|traineau|slee|mede|patin|slitta'),
    frame: L('ahsap iskelet|ahsap cerceve|cerceve|wood frame|timber frame|holzgestell|gestell|cadre en bois|structure en bois|houten frame|traestel|estructura de madera|telaio in legno|telaio')
  },
  legType: {
    tapered: L('konik|tapered|konisch|fusele|fuselee|taps|konisk|conic|affusolat'),
    turned: L('torna|turned|gedrechselt|tourne|gedraaid|drejed|torneado|tornit'),
    bun: L('top ayak|bun|kugelfuss|pied boule|bolpoot|kuglefod|pata de bola|piede a cipolla'),
    cylinder: L('silindir|cylinder|zylinder|cylindre|cilinder|cilindro|cylindrisk'),
    block: L('blok ayak|block leg|blockfuss|pied bloc|blokpoot|blokben|pata de bloque|piede a blocco'),
    castor: L('tekerlek|castor|caster|wheels|rollen|roulettes|wieltjes|hjul|ruedas|ruote'),
    cone: L('mid century ayak|cone|kegel|cone|kegelpoot|kegle|conica|cono')
  },
  cushionEdge: {
    knife: L('bicak kenar|knife edge|messerkante|bord lame|mesrand|knivkant|canto vivo|bordo a coltello'),
    boxed: L('kutu kenar|boxed|kastenkante|bord droit|boxrand|kassekant|cantoneado|bordo a cassetta'),
    bullnose: L('yuvarlak burun|bullnose|runde vorderkante|bord arrondi|ronde voorkant|afrundet|canto redondeado|bordo arrotondato'),
    soft: L('yumusak minder|soft cushion|weiche kissen|coussins moelleux|zachte kussens|bloede hynder|cojines suaves|cuscini morbidi')
  },
  welt: {
    contrast: L('kontrast biye|contrast piping|contrast welt|kontrastkeder|passepoil contrastant|contrastbies|kontrastkant|vivo en contraste|profilo a contrasto'),
    none: L('biyesiz|biye yok|no piping|without piping|ohne keder|sans passepoil|zonder bies|uden kantband|sin vivo|senza profilo'),
    self: L('biye|piping|welt|keder|passepoil|bies|kantband|vivo|profilo')
  }
};

const FABRIC_WORDS = {
  fiber: {linen: L('keten|linen|leinen|lin|linnen|hor|lino'), cotton: L('pamuk|cotton|baumwolle|coton|katoen|bomuld|algodon|cotone'), wool: L('yun|wool|wolle|laine|wol|uld|lana'), velvet: L('kadife|velvet|samt|velours|fluweel|flojl|terciopelo|velluto'), boucle: L('bukle|boucle|bouclette'), chenille: L('sonil|chenille|ciniglia|chenilla'), leather: L('deri|leather|leder|cuir|leer|laeder|cuero|pelle')},
  weave: {plain: L('bezayagi|plain weave|leinwandbindung|toile|linnenbinding|laerredsbinding|tafetan'), twill22: L('dimi|twill|koper|serge|keper|kipper|sarga|saia'), satin: L('saten|satin|atlas|satijn|raso'), basket: L('panama|basket|natte'), herringbone: L('baliksirti|herringbone|fischgrat|chevron|visgraat|sildeben|espiga|spina di pesce'), diamond: L('elmas|diamond|raute|losange|ruit|rude|rombo')},
  pattern: {none: L('duz kumas|desensiz|solid|plain fabric|unifarben|uni|effen|ensfarvet|liso|tinta unita'), stripe: L('cizgili|stripe|striped|gestreift|streifen|raye|rayure|streep|gestreept|stribet|rayas|a rayas|righe|a righe|rigato'), check: L('kareli|potikare|gingham|check|checked|karo|kariert|vichy|carreaux|geruit|ruit|ternet|cuadros|quadri|quadretti'), plaid: L('ekose|plaid|tartan|schottenkaro|ecossais|schotse ruit|skotskternet|escoces|scozzese'), damask: L('damask|damast|damasse|damasco')}
};

const COLOR_WORDS = [
  ['cochineal', L('bordo|burgundy|bordeaux|wine|sarap|weinrot|lie de vin|wijnrood|vinrod|burdeos|vino|crimson|kirmiz')],
  ['turkeyRed', L('kirmizi|red|rot|rouge|rood|rod|rojo|rosso')],
  ['tyrian', L('mor|purple|lila|violett|violet|paars|lilla|morado|viola')],
  ['mauve', L('leylak|mauve|altrosa|malve|lavendel|malva')],
  ['blush', L('pembe|pudra|pink|rosa|rose|roze|lyserod|rosado')],
  ['rust', L('turuncu|pas|kiremit|orange|rust|terracotta|terrakotta|rost|rouille|oranje|roest|naranja|oxido|terracota|arancione|ruggine')],
  ['ochre', L('hardal|mustard|senf|moutarde|mosterd|sennep|mostaza|senape|ochre|oker|ocre|ocra')],
  ['weld', L('sari|yellow|gelb|jaune|geel|gul|amarillo|giallo')],
  ['sage', L('adacayi|sage|salbei|sauge|salie|salvie|salvia')],
  ['olive', L('zeytin|haki|olive|khaki|oliv|olijf|oliven|oliva|kaki|cachi')],
  ['verdigris', L('camgobegi|petrol|teal|turkis|turquoise|turkoois|turkis|turquesa|turchese|verdigris')],
  ['bottle', L('yesil|zumrut|green|emerald|grun|smaragd|vert|emeraude|groen|gron|verde|smeraldo|esmeralda')],
  ['indigo', L('lacivert|navy|marine|marineblau|bleu marine|marineblauw|marinebla|azul marino|blu navy|indigo|civit')],
  ['woad', L('acik mavi|light blue|hellblau|bleu clair|lichtblauw|lysebla|azul claro|azzurro|celeste')],
  ['turkishBlue', L('mavi|blue|blau|bleu|blauw|bla|azul|blu')],
  ['cognac', L('konyak|taba|cognac|caramel|karamel|cuoio')],
  ['kakishibu', L('kahve|kahverengi|brown|braun|marron|brun|bruin|marrone|chocolate|cikolata')],
  ['taupe', L('vizon|taupe|grege|tortora')],
  ['charcoal', L('antrasit|koyu gri|charcoal|anthracite|dark grey|dark gray|anthrazit|dunkelgrau|gris fonce|antraciet|donkergrijs|antracit|morkegra|antracita|gris oscuro|antracite|grigio scuro')],
  ['stone', L('gri|grey|gray|grau|gris|grijs|gra|grigio|tas|stone|stein|pierre|steen|sten|piedra|pietra')],
  ['bogolan', L('siyah|black|schwarz|noir|zwart|sort|negro|nero')],
  ['naturalLinen', L('ekru|naturel|ecru|natural|natur|naturale|natuur')],
  ['oat', L('bej|krem|beige|cream|creme|crema|oat|yulaf|haver|havre|avena')],
  ['chalk', L('beyaz|white|weiss|blanc|wit|hvid|blanco|bianco|chalk|kirik beyaz|off white|ivory|fildisi|elfenbein|ivoire|ivoor|marfil|avorio')]
];

const WOOD_WORDS = {oak: L('mese|oak|eiche|chene|eiken|eg|roble|rovere'), walnut: L('ceviz|walnut|nussbaum|nuss|noyer|noten|notenhout|valnod|nogal|noce'), ash: L('acik ahsap|acik renk ahsap|light wood|helles holz|bois clair|licht hout|lyst trae|madera clara|legno chiaro|disbudak|ash|esche|frene|essen|ask|fresno|frassino'), beech: L('kayin|beech|buche|hetre|beuken|bog|haya|faggio'), cherry: L('kiraz|cherry|kirsch|kirschbaum|merisier|kersen|kirsebaer|cerezo|ciliegio'), teak: L('tik|teak|teck|teca'), smoked: L('koyu ahsap|dark wood|dunkles holz|bois fonce|donker hout|morkt trae|madera oscura|legno scuro|fume|smoked|rauch|raucher|fumee|gerookt|roget|ahumado|affumicato'), ebonized: L('siyah ahsap|siyah mese|ebon|black wood|schwarze eiche|chene noir|zwart eiken|sort eg|roble negro|rovere nero')};
const FINISH_WORDS = {matte: L('mat|matte|matt|opaco|mate'), oil: L('yag|yagli|oil|oiled|geolt|ol|huile|geolied|olie|olieret|aceite|aceitado|olio|oliato'), satin: L('ipek mat|satin finish|seidenmatt|satine|zijdemat|silkemat|satinado|satinato'), lacquer: L('parlak|lake|gloss|glossy|lacquer|hochglanz|lack|laque|brillant|hoogglans|lak|hojglans|brillo|laca|lucido|laccato')};
const METAL_WORDS = {brass: L('pirinc|brass|messing|laiton|laton|ottone'), bronze: L('bronz|bronze|brons|bronce|bronzo'), chrome: L('krom|chrome|chrom|chroom|cromo'), nickel: L('nikel|nickel|nikkel|niquel|nichel'), black: L('siyah metal|siyah celik|black steel|black metal|schwarzstahl|acier noir|zwart staal|sort stal|acero negro|acciaio nero')};

const STYLE_WORDS = [
  ['japandi', L('japandi')], ['bauhaus', L('bauhaus')], ['brutalism', L('brutal|brutalist|brutalizm|brutalismus|brutalisme|brutalismo')],
  ['art_deco', L('art deco|artdeco|deco')], ['gothic_minimalism', L('gotik minimal|gothic minimal|gotischer minimal|gothique minimal|gotisch minimal|gotico minimal')],
  ['neo_gothic', L('neo gotik|neogotik|neo gothic|neogotisch|neogothique|neogotico|gothic|gotik|gotisch|gothique|gotico')],
  ['wabi_sabi_rustic', L('rustik|rustic|rustikal|rustique|rustiek|rustico')], ['wabi_sabi', L('wabi sabi|wabi')],
  ['de_stijl', L('de stijl|mondrian')], ['memphis', L('memphis')], ['high_tech', L('high tech|hightech|hi tech')],
  ['scandinavian_pastel', L('pastel|pastell|pastello')], ['scandinavian_modern', L('iskandinav|scandinavian|skandinavisch|scandinave|scandinavisch|skandinavisk|escandinavo|scandinavo|nordic|nordik|nordisch')],
  ['dark_academia', L('dark academia|akademi|academia|bibliotek|kutuphane|library')], ['industrial', L('endustriyel|industrial|industriell|industriel|industrieel|industriale|loft')],
  ['mid_century_modern', L('mid century|midcentury|60 lar|sixties|50er|annees 50|jaren 50|anos 50|anni 50')], ['minimalism', L('minimal|minimalist|minimalizm|minimalistisch|minimaliste|minimalista')],
  ['streamline_moderne', L('streamline')], ['streamliner', L('streamliner')], ['rococo_revival', L('rokoko|rococo')],
  ['tropical_resort', L('tropikal|tropical|tropisch|tropique|tropisk|tropicale|resort')], ['hollywood_regency', L('hollywood|regency')],
  ['neo_classical_restrained', L('neoklasik|neo klasik|neoclassical|neo classical|klassizismus|neoclassique|neoklassiek|neoklassisk|neoclasico|neoclassico|klasik|classic|klassisch|classique|klassiek|klassisk|clasico|classico')],
  ['high_gloss_contemporary', L('parlak cagdas|high gloss|hochglanz modern|contemporain brillant|hoogglans modern|moderno brillante|lucido contemporaneo')],
  ['muji_modern', L('sade dogal|muji|natural simple')], ['craft_modern', L('zanaat|craft|handwerk|artisanal|ambacht|handvaerk|artesanal|artigianale')]
];

const KIND_WORDS = {
  armchair: L('berjer|tekli|tek kisilik|armchair|lounge chair|sessel|fauteuil|laenestol|lenestol|sillon|butaca|poltrona'),
  loveseat: L('ikili|iki kisilik|loveseat|2 seater|two seater|zweisitzer|2 sitzer|canape 2 places|2 places|2 zits|tweezits|2 personers|to personers|2 plazas|dos plazas|2 posti|due posti'),
  sofa: L('uclu|uc kisilik|dortlu|kanepe|koltuk takimi|sofa|couch|canape|bank|sofaen|divano')
};

const COMMANDS = {
  undo: L('geri al|undo|ruckgangig|zuruck|annuler|ongedaan|fortryd|deshacer|annulla'),
  redo: L('yinele|ileri al|redo|wiederholen|retablir|opnieuw|gendan|rehacer|ripeti|ripristina'),
  similar: L('benzer|buna benzer|similar|more like this|like this|ahnlich|aehnlich|similaire|vergelijkbaar|soortgelijk|lignende|simil|parecid'),
  variants: L('oneri|yeni oneri|oneriler|baska oneri|secenek|alternatif|farkli oneri|secenek goster|yeni secenek|new ideas|new options|suggestions|proposals|variations|show me options|neue vorschlage|vorschlage|varianten|nouvelles propositions|propositions|idees|nieuwe voorstellen|voorstellen|nye forslag|forslag|nuevas propuestas|propuestas|opciones|nuove proposte|proposte|alternative'),
  viewFront: L('onden|on gorunus|front view|from the front|von vorne|vorderansicht|vue de face|de face|vooraanzicht|forfra|vista frontal|de frente|vista frontale|di fronte'),
  viewSide: L('yandan|yan gorunus|side view|from the side|seitenansicht|von der seite|vue de cote|de cote|zijaanzicht|fra siden|vista lateral|de lado|vista laterale|di lato'),
  viewTop: L('ustten|ust gorunus|top view|from above|draufsicht|von oben|vue de dessus|bovenaanzicht|oppefra|vista superior|desde arriba|vista dall alto|dall alto'),
  viewAngle: L('perspektif|perspective|perspektive|perspectief|perspektiv|perspectiva|prospettiva|3d'),
  structure: L('iskelet|ic yapi|structure|internal frame|innenleben|struktur|structuur|estructura|struttura'),
  photo: L('fotograf|foto|photo|render|picture|bild'),
  drawings: L('cizim|teknik cizim|drawing|drawings|technical|zeichnung|technische zeichnung|plan|dessin technique|dessin|tekening|technische tekening|tegning|dibujo|plano|disegno'),
  send: L('tasarimciya gonder|gonder|send to designer|send|an designer|senden|envoyer|envoyez|versturen|sturen|send til|enviar|envia|inviare|invia'),
  package: L('paket|indir|download|package|herunterladen|paket|telecharger|downloaden|hent|descargar|scaricare')
};

/** Relative step sizes [small, normal, large] for "a bit", plain and "a lot" (mm or degrees). */
const STEPS = {width: [50, 100, 200], depth: [20, 40, 80], height: [20, 40, 80], seatHeight: [10, 20, 40], armHeight: [15, 30, 60], armWidth: [10, 25, 50], legHeight: [10, 25, 50], legSize: [2, 4, 8], backRake: [1, 3, 5], cushionThickness: [10, 20, 40], cushionCrown: [3, 6, 12]};
const DELTA_WORDS = L('daha|ilave|more|extra|another|mehr|noch|weitere|plus|encore|meer|nog|mere|endnu|mas|otro|piu|ancora|altri');
const WORD_NUMS = {1: L('bir|tek|one|single|ein|eine|un|une|een|en|et|uno|una'), 2: L('iki|two|zwei|deux|twee|to|dos|due'), 3: L('uc|three|drei|trois|drie|tre|tres'), 4: L('dort|four|vier|quatre|fire|cuatro|quattro'), 5: L('bes|five|funf|cinq|vijf|fem|cinco|cinque')};
const SEAT_UNITS = L('kisilik|kisi|oturumlu|oturum|seater|seats|seat|sitzer|sitze|sitzplatze|places|place|zits|zitter|zitplaatsen|personers|pladser|plazas|asientos|posti|sedute');

function has(text, stem) {
  if (stem.includes(' ')) return (' ' + text + ' ').includes(' ' + stem + ' ') || (stem.length > 6 && text.includes(stem));
  const words = text.split(' ');
  return stem.length <= 3 ? words.includes(stem) : words.some(w => w.startsWith(stem));
}
const any = (text, list) => list.find(s => has(text, s));
const pickMap = (text, map) => { let best = null, len = 0; for (const [k, list] of Object.entries(map)) for (const s of list) if (s.length > len && has(text, s)) { best = k; len = s.length; } return best; };

/** Parse one utterance. Returns {actions, understood}. */
export function parse(raw, current = {}) {
  const text = fold(raw), actions = [];
  if (!text) return {actions, understood: false};
  for (const [name, list] of Object.entries(COMMANDS)) if (any(text, list)) { actions.push({type: 'command', name}); }
  if (actions.some(a => a.name === 'similar')) for (let i = actions.length - 1; i >= 0; i--) if (actions[i].name === 'variants') actions.splice(i, 1);
  // Commands like "show similar" stand alone; keep parsing for compound edits ("similar but in velvet").
  const slot = Object.fromEntries(Object.entries(SLOTS).map(([k, list]) => [k, !!any(text, list)]));

  // Style and kind.
  for (const [id, list] of STYLE_WORDS) if (any(text, list)) { actions.push({type: 'style', value: id}); break; }
  const kind = pickMap(text, KIND_WORDS);

  // Seat count: "3 kişilik", "three-seater", "üçlü".
  const countMatch = text.match(/(\d)\s*-?\s*(\w+)/g)?.map(m => m.match(/(\d)\s*-?\s*(\w+)/)).find(m => SEAT_UNITS.some(u => m[2].startsWith(u)));
  let seats = countMatch ? +countMatch[1] : null;
  if (seats === null) for (const [n, list] of Object.entries(WORD_NUMS)) for (const w of list) for (const u of SEAT_UNITS) if (has(text, `${w} ${u}`)) seats = +n;
  if (kind) actions.push({type: 'kind', value: kind});
  if (seats) { actions.push({type: 'set', key: 'seatCount', value: Math.min(4, seats)}); if (!kind) actions.push({type: 'kind', value: seats === 1 ? 'armchair' : seats === 2 ? 'loveseat' : 'sofa'}); }

  // Part types; slot words disambiguate shared words (e.g. "square" arms vs legs).
  for (const [key, map] of Object.entries(ENUM_WORDS)) {
    const v = pickMap(text, map); if (!v) continue;
    if (key === 'legType' && !slot.leg && !['castor'].includes(v)) continue;
    if (key === 'seatType' && v === 'tight' && !slot.seat) continue;
    actions.push({type: 'enum', key, value: v});
  }
  if (actions.some(a => a.key === 'legType')) actions.push({type: 'enum', key: 'baseType', value: 'legs'});

  // Materials. Wood words switch colour words to wood species; metal words to metal finish.
  const species = pickMap(text, WOOD_WORDS), finish = pickMap(text, FINISH_WORDS), metal = pickMap(text, METAL_WORDS);
  if (species && (slot.wood || species !== 'ebonized')) actions.push({type: 'material', slot: 'wood', key: 'species', value: species});
  if (finish && (slot.wood || ['lacquer', 'oil'].includes(finish))) actions.push({type: 'material', slot: 'wood', key: 'finish', value: finish});
  if (metal) actions.push({type: 'material', slot: 'metal', key: 'finish', value: metal});
  for (const key of ['fiber', 'weave', 'pattern']) { const v = pickMap(text, FABRIC_WORDS[key]); if (v) actions.push({type: 'material', slot: 'fabric', key, value: v}); }
  if (!(slot.wood && species) && !metal) {
    let colour = null, len = 0;
    const words = text.split(' ');
    for (const [id, list] of COLOR_WORDS) for (const s of list) if (s.length > len && (has(text, s) || (s.length >= 4 && !s.includes(' ') && words.some(w => w.length > s.length + 2 && (w.endsWith(s) || w.endsWith(s + 'e') || w.endsWith(s + 'en')))))) { colour = id; len = s.length; }
    if (colour) {
      const isWelt = actions.some(a => a.key === 'welt') || /\b(biye|piping|keder|passepoil|bies|vivo|profilo)\b/.test(text);
      actions.push(isWelt ? {type: 'material', slot: 'welt', key: 'color', value: colour} : {type: 'material', slot: 'fabric', key: 'color', value: colour});
    }
  }

  // Dimensions: explicit target words, comparatives and numbers with units.
  const num = text.match(/(-?\d+(?:[.,]\d+)?)\s*(mm|cm|m|°|derece|degrees?|grad\w*|degres?|graden|grader|grados|gradi)?(?![a-z0-9])/);
  let target = null, targetStem = '';
  for (const [key, list] of TARGETS) { const m = any(text, list); if (m) { target = key; targetStem = m; break; } }
  let dir = 0, compTarget = null, compStem = '';
  for (const [d, key, list] of COMPARATIVES) { const m = any(text, list); if (m) { dir = d; compStem = m; if (key && !compTarget) compTarget = key; if (key) break; } }
  // "genişliği 220 yap" / "width 220": an explicit target with a number is a set, unless a delta word is present.
  const comparativeForm = compStem && compStem.length > targetStem.length && compStem.startsWith(targetStem.trim().slice(0, 3));
  const deltaWord = any(text, DELTA_WORDS) || COMPARATIVES.filter(c => !c[1]).some(c => any(text, c[2])) || comparativeForm;
  if (target && num && !deltaWord) dir = 0;
  if (target === 'backRake' && slot.arm && !slot.back) { target = null; if (compTarget === 'backRake') { dir = 0; compTarget = null; } }
  if (compTarget === 'backRake' && slot.arm && !slot.back) { dir = 0; compTarget = null; }
  // Slot-aware defaults: "kolları alçalt" → arm height, "ayakları incelt" → leg size.
  if (!target && (dir || num)) {
    if (slot.arm && (compTarget === 'height' || !compTarget)) target = 'armHeight';
    else if (slot.arm && compTarget === 'width') target = 'armWidth';
    else if (slot.leg && compTarget === 'cushionThickness') target = 'legSize';
    else if (slot.leg) target = 'legHeight';
    else if (slot.back && (compTarget === 'height' || !compTarget) && !num) target = 'height';
    else if ((slot.seat || slot.cushion) && compTarget === 'height') target = 'seatHeight';
    else if (slot.cushion) target = 'cushionThickness';
    else target = compTarget;
  }
  const countLike = num && seats && +num[1] === seats && !num[2];
  if (target && !countLike) {
    const [lo, hi] = RANGES[target];
    let value = null;
    if (num) {
      let v = parseFloat(num[1].replace(',', '.')); const unit = num[2] || '';
      if (target === 'backRake') value = v;
      else if (target === 'legSize') value = unit === 'cm' ? v * 5 : unit === 'mm' ? v / 2 : v > 10 ? v / 2 : v * 5; // stated as leg diameter → radius
      else if (['armTop', 'armFlare', 'armSlope', 'legTaper'].includes(target)) value = v;
      else value = unit === 'mm' ? v : unit === 'm' ? v * 1000 : unit === 'cm' ? v * 10 : (dir ? (v < 50 ? v * 10 : v) : v <= 4 ? v * 1000 : v < 300 ? v * 10 : v);
    }
    if (dir && value !== null) actions.push({type: 'delta', key: target, value: dir * Math.abs(value)});
    else if (value !== null) actions.push({type: 'set', key: target, value});
    else if (dir) {
      const steps = STEPS[target] || [RANGES[target][2], RANGES[target][2] * 2, RANGES[target][2] * 4];
      const step = any(text, SIZE.big) ? steps[2] : any(text, SIZE.small) ? steps[0] : steps[1];
      actions.push({type: 'delta', key: target, value: dir * step});
    }
  }
  return {actions: dedupe(actions), understood: actions.length > 0};
}

function dedupe(list) { const seen = new Set(); return list.filter(a => { const k = JSON.stringify(a); if (seen.has(k)) return false; seen.add(k); return true; }); }

/** Speech-recognition language codes for the UI languages. */
export const SPEECH_LANG = {tr: 'tr-TR', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', da: 'da-DK', es: 'es-ES', it: 'it-IT'};
