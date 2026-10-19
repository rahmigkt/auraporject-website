// Material catalogue: fibres, weaves, patterns, fabric colours, wood species, finishes and metals.
// Colour hex values are representative screen tones, not measured colour standards.
import {WEAVES} from '../nakis/weave.js?v=20261016b';
export {WEAVES};

export const LANGS = ['tr', 'en', 'de', 'fr', 'nl', 'da', 'es', 'it'];
/** n({tr,en,...}, lang) with English fallback. */
export const name = (entry, lang) => entry?.[lang] ?? entry?.en ?? '';

export const FIBERS = {
  linen:   {tr: 'Keten', en: 'Linen', de: 'Leinen', fr: 'Lin', nl: 'Linnen', da: 'Hør', es: 'Lino', it: 'Lino', thread: 0.55, slub: 0.55, fuzz: 0.12, sheen: 0.15, rough: 0.92, weave: true},
  cotton:  {tr: 'Pamuk', en: 'Cotton', de: 'Baumwolle', fr: 'Coton', nl: 'Katoen', da: 'Bomuld', es: 'Algodón', it: 'Cotone', thread: 0.42, slub: 0.12, fuzz: 0.1, sheen: 0.2, rough: 0.88, weave: true},
  wool:    {tr: 'Yün', en: 'Wool', de: 'Wolle', fr: 'Laine', nl: 'Wol', da: 'Uld', es: 'Lana', it: 'Lana', thread: 0.8, slub: 0.25, fuzz: 0.45, sheen: 0.35, rough: 0.95, weave: true},
  velvet:  {tr: 'Kadife', en: 'Velvet', de: 'Samt', fr: 'Velours', nl: 'Fluweel', da: 'Fløjl', es: 'Terciopelo', it: 'Velluto', thread: 0.3, slub: 0, fuzz: 0.08, sheen: 1, rough: 0.75, weave: false},
  boucle:  {tr: 'Bukle', en: 'Bouclé', de: 'Bouclé', fr: 'Bouclette', nl: 'Bouclé', da: 'Bouclé', es: 'Bouclé', it: 'Bouclé', thread: 1.3, slub: 0.3, fuzz: 0.3, sheen: 0.25, rough: 0.97, weave: false},
  chenille:{tr: 'Şönil', en: 'Chenille', de: 'Chenille', fr: 'Chenille', nl: 'Chenille', da: 'Chenille', es: 'Chenilla', it: 'Ciniglia', thread: 1.0, slub: 0.1, fuzz: 0.5, sheen: 0.7, rough: 0.85, weave: true},
  leather: {tr: 'Deri', en: 'Leather', de: 'Leder', fr: 'Cuir', nl: 'Leer', da: 'Læder', es: 'Cuero', it: 'Pelle', thread: 0, slub: 0, fuzz: 0, sheen: 0, rough: 0.5, weave: false},
  // Suede: the split, napped inner side of the hide — matte, soft, shows finger marks. Nubuck: the grain side sanded
  // to a very fine, velvety nap — tighter and more even than suede.
  suede:   {tr: 'Süet', en: 'Suede', de: 'Veloursleder', fr: 'Daim', nl: 'Suède', da: 'Ruskind', es: 'Ante', it: 'Scamosciato', thread: 0, slub: 0, fuzz: 0, sheen: 0.55, rough: 0.98, weave: false},
  nubuck:  {tr: 'Nubuk', en: 'Nubuck', de: 'Nubukleder', fr: 'Nubuck', nl: 'Nubuck', da: 'Nubuck', es: 'Nobuk', it: 'Nabuk', thread: 0, slub: 0, fuzz: 0, sheen: 0.4, rough: 0.92, weave: false}
};
/** Hides: no weave and no printed pattern. */
export const HIDES = ['leather', 'suede', 'nubuck'];

export const WEAVE_NAMES = {
  plain: {tr: 'Bezayağı', en: 'Plain weave', de: 'Leinwandbindung', fr: 'Toile', nl: 'Linnenbinding', da: 'Lærredsbinding', es: 'Tafetán', it: 'Tela'},
  twill22: {tr: '2/2 Dimi', en: '2/2 Twill', de: '2/2 Köper', fr: 'Sergé 2/2', nl: '2/2 Keper', da: '2/2 Kipper', es: 'Sarga 2/2', it: 'Saia 2/2'},
  twill31: {tr: '3/1 Dimi', en: '3/1 Twill', de: '3/1 Köper', fr: 'Sergé 3/1', nl: '3/1 Keper', da: '3/1 Kipper', es: 'Sarga 3/1', it: 'Saia 3/1'},
  satin: {tr: '5\'li Saten', en: '5-end Satin', de: '5-bindiger Atlas', fr: 'Satin 5', nl: '5-schaft satijn', da: '5-skafts satin', es: 'Raso de 5', it: 'Raso a 5'},
  basket: {tr: 'Panama', en: 'Basket weave', de: 'Panamabindung', fr: 'Natté', nl: 'Panamabinding', da: 'Panamavævning', es: 'Panamá', it: 'Panama'},
  herringbone: {tr: 'Balıksırtı', en: 'Herringbone', de: 'Fischgrat', fr: 'Chevron', nl: 'Visgraat', da: 'Sildeben', es: 'Espiga', it: 'Spina di pesce'},
  diamond: {tr: 'Elmas dimi', en: 'Diamond twill', de: 'Rautenköper', fr: 'Sergé losange', nl: 'Ruitkeper', da: 'Rudekipper', es: 'Sarga de rombos', it: 'Saia a rombi'}
};

export const PATTERNS = {
  none: {tr: 'Düz', en: 'Solid', de: 'Uni', fr: 'Uni', nl: 'Effen', da: 'Ensfarvet', es: 'Liso', it: 'Tinta unita'},
  stripe: {tr: 'Çizgili', en: 'Stripe', de: 'Streifen', fr: 'Rayé', nl: 'Streep', da: 'Stribet', es: 'Rayas', it: 'Righe'},
  pinstripe: {tr: 'İnce çizgi (pinstripe)', en: 'Pinstripe', de: 'Nadelstreifen', fr: 'Rayure tennis', nl: 'Krijtstreep', da: 'Nålestribe', es: 'Raya diplomática', it: 'Gessato'},
  check: {tr: 'Pötikare', en: 'Gingham check', de: 'Vichy-Karo', fr: 'Vichy', nl: 'Boerenbont ruit', da: 'Tern', es: 'Vichy', it: 'Quadretto vichy'},
  buffalo: {tr: 'Büyük kare (oduncu)', en: 'Buffalo check', de: 'Büffelkaro', fr: 'Carreaux bûcheron', nl: 'Buffalo-ruit', da: 'Buffalo-tern', es: 'Cuadro búfalo', it: 'Quadro buffalo'},
  windowpane: {tr: 'Pencere kare', en: 'Windowpane check', de: 'Fensterkaro', fr: 'Carreau fenêtre', nl: 'Windowpane-ruit', da: 'Vinduestern', es: 'Cuadro ventana', it: 'Quadro finestra'},
  plaid: {tr: 'Ekose', en: 'Plaid', de: 'Schottenkaro', fr: 'Écossais', nl: 'Schotse ruit', da: 'Skotskternet', es: 'Escocés', it: 'Scozzese'},
  houndstooth: {tr: 'Kazayağı', en: 'Houndstooth', de: 'Hahnentritt', fr: 'Pied-de-poule', nl: 'Pied-de-poule', da: 'Hanefod', es: 'Pata de gallo', it: 'Pied de poule'},
  chevron: {tr: 'Zikzak', en: 'Chevron', de: 'Zickzack', fr: 'Zigzag', nl: 'Zigzag', da: 'Zigzag', es: 'Zigzag', it: 'Zigzag'},
  argyle: {tr: 'Baklava (argyle)', en: 'Argyle', de: 'Argyle-Raute', fr: 'Losanges argyle', nl: 'Argyle', da: 'Argyle', es: 'Rombos argyle', it: 'Argyle'},
  trellis: {tr: 'Kafes (trellis)', en: 'Trellis', de: 'Gitter', fr: 'Treillage', nl: 'Latwerk', da: 'Espalier', es: 'Celosía', it: 'Traliccio'},
  polka: {tr: 'Puantiyeli', en: 'Polka dot', de: 'Punkte', fr: 'Pois', nl: 'Stippen', da: 'Prikket', es: 'Lunares', it: 'Pois'},
  geometric: {tr: 'Geometrik', en: 'Geometric', de: 'Geometrisch', fr: 'Géométrique', nl: 'Geometrisch', da: 'Geometrisk', es: 'Geométrico', it: 'Geometrico'},
  tweed: {tr: 'Tüvit (benekli)', en: 'Tweed fleck', de: 'Tweed', fr: 'Tweed moucheté', nl: 'Tweed', da: 'Tweed', es: 'Tweed', it: 'Tweed'}
};
/** Old pattern ids (project-specific ornament motifs, withdrawn) open as the nearest market pattern. */
const PATTERN_ALIASES = {floral: 'trellis', leaf: 'trellis', damask: 'trellis'};

/** Ornament motifs for floral / leaf / damask patterns, taken from the NAKIŞ motif library. */
export const MOTIF_CHOICES = {
  floral: ['cancicegi', 'suzani', 'iris', 'asma'],
  leaf: ['kalpyaprak', 'asma', 'palmet'],
  damask: ['damask', 'palmet']
};
export const MOTIF_NAMES = {
  cancicegi: {tr: 'Çan çiçeği', en: 'Bellflower', de: 'Glockenblume', fr: 'Campanule', nl: 'Klokje', da: 'Klokkeblomst', es: 'Campanilla', it: 'Campanula'},
  nilufer: {tr: 'Nilüfer', en: 'Water lily', de: 'Seerose', fr: 'Nénuphar', nl: 'Waterlelie', da: 'Åkande', es: 'Nenúfar', it: 'Ninfea'},
  lotus: {tr: 'Lotus', en: 'Lotus', de: 'Lotus', fr: 'Lotus', nl: 'Lotus', da: 'Lotus', es: 'Loto', it: 'Loto'},
  iris: {tr: 'Süsen', en: 'Iris', de: 'Iris', fr: 'Iris', nl: 'Iris', da: 'Iris', es: 'Lirio', it: 'Iris'},
  suzani: {tr: 'Suzani', en: 'Suzani', de: 'Suzani', fr: 'Suzani', nl: 'Suzani', da: 'Suzani', es: 'Suzani', it: 'Suzani'},
  kalpyaprak: {tr: 'Kalp yaprak', en: 'Heart leaf', de: 'Herzblatt', fr: 'Feuille cœur', nl: 'Hartblad', da: 'Hjerteblad', es: 'Hoja corazón', it: 'Foglia a cuore'},
  asma: {tr: 'Asma', en: 'Vine', de: 'Weinranke', fr: 'Vigne', nl: 'Wijnrank', da: 'Vinranke', es: 'Vid', it: 'Vite'},
  palmet: {tr: 'Palmet', en: 'Palmette', de: 'Palmette', fr: 'Palmette', nl: 'Palmet', da: 'Palmet', es: 'Palmeta', it: 'Palmetta'},
  damask: {tr: 'Damask madalyon', en: 'Damask medallion', de: 'Damastmedaillon', fr: 'Médaillon damassé', nl: 'Damastmedaillon', da: 'Damaskmedaljon', es: 'Medallón damasco', it: 'Medaglione damascato'},
  yildiz: {tr: 'Yıldız', en: 'Star', de: 'Stern', fr: 'Étoile', nl: 'Ster', da: 'Stjerne', es: 'Estrella', it: 'Stella'}
};

/** Fabric colours: heritage dye names (as in NAKIŞ) plus contemporary upholstery neutrals. */
export const COLORS = {
  // Market upholstery colours (common trade names)
  white:      {hex: '#f1efe9', group: 'market', tr: 'Kırık beyaz', en: 'Off-white', de: 'Altweiß', fr: 'Blanc cassé', nl: 'Gebroken wit', da: 'Råhvid', es: 'Blanco roto', it: 'Bianco panna'},
  cream:      {hex: '#e6dcc6', group: 'market', tr: 'Krem', en: 'Cream', de: 'Creme', fr: 'Crème', nl: 'Crème', da: 'Creme', es: 'Crema', it: 'Crema'},
  sand:       {hex: '#cdbb9b', group: 'market', tr: 'Kum beji', en: 'Sand', de: 'Sand', fr: 'Sable', nl: 'Zand', da: 'Sand', es: 'Arena', it: 'Sabbia'},
  mink:       {hex: '#9b8b7a', group: 'market', tr: 'Vizon', en: 'Mink', de: 'Nerz', fr: 'Vison', nl: 'Nerts', da: 'Mink', es: 'Visón', it: 'Visone'},
  silver:     {hex: '#bdbcb7', group: 'market', tr: 'Açık gri', en: 'Light grey', de: 'Hellgrau', fr: 'Gris clair', nl: 'Lichtgrijs', da: 'Lysegrå', es: 'Gris claro', it: 'Grigio chiaro'},
  smoke:      {hex: '#76736d', group: 'market', tr: 'Füme', en: 'Smoke grey', de: 'Rauchgrau', fr: 'Gris fumé', nl: 'Rookgrijs', da: 'Røggrå', es: 'Gris humo', it: 'Grigio fumo'},
  anthracite: {hex: '#45464a', group: 'market', tr: 'Antrasit', en: 'Anthracite', de: 'Anthrazit', fr: 'Anthracite', nl: 'Antraciet', da: 'Antracit', es: 'Antracita', it: 'Antracite'},
  camel:      {hex: '#b18456', group: 'market', tr: 'Taba', en: 'Camel', de: 'Camel', fr: 'Camel', nl: 'Camel', da: 'Kamel', es: 'Camel', it: 'Cammello'},
  chocolate:  {hex: '#5a3e30', group: 'market', tr: 'Çikolata', en: 'Chocolate', de: 'Schokolade', fr: 'Chocolat', nl: 'Chocolade', da: 'Chokolade', es: 'Chocolate', it: 'Cioccolato'},
  mustard:    {hex: '#c9a032', group: 'market', tr: 'Hardal', en: 'Mustard', de: 'Senfgelb', fr: 'Moutarde', nl: 'Mosterd', da: 'Sennep', es: 'Mostaza', it: 'Senape'},
  coral:      {hex: '#e08e74', group: 'market', tr: 'Yavruağzı', en: 'Coral', de: 'Koralle', fr: 'Corail', nl: 'Koraal', da: 'Koral', es: 'Coral', it: 'Corallo'},
  dustyRose:  {hex: '#c49a95', group: 'market', tr: 'Gül kurusu', en: 'Dusty rose', de: 'Altrosa', fr: 'Vieux rose', nl: 'Oudroze', da: 'Gammelrosa', es: 'Rosa palo', it: 'Rosa antico'},
  cherryRed:  {hex: '#8f2430', group: 'market', tr: 'Vişne', en: 'Cherry red', de: 'Kirschrot', fr: 'Rouge cerise', nl: 'Kersenrood', da: 'Kirsebærrød', es: 'Rojo cereza', it: 'Rosso ciliegia'},
  lilac:      {hex: '#a99ab8', group: 'market', tr: 'Lila', en: 'Lilac', de: 'Flieder', fr: 'Lilas', nl: 'Lila', da: 'Syren', es: 'Lila', it: 'Lilla'},
  mint:       {hex: '#a9c9b4', group: 'market', tr: 'Mint', en: 'Mint', de: 'Mint', fr: 'Menthe', nl: 'Mint', da: 'Mint', es: 'Menta', it: 'Menta'},
  pistachio:  {hex: '#a8b36e', group: 'market', tr: 'Çağla yeşili', en: 'Pistachio', de: 'Pistazie', fr: 'Pistache', nl: 'Pistache', da: 'Pistacie', es: 'Pistacho', it: 'Pistacchio'},
  khaki:      {hex: '#7d7650', group: 'market', tr: 'Haki', en: 'Khaki', de: 'Khaki', fr: 'Kaki', nl: 'Kaki', da: 'Khaki', es: 'Caqui', it: 'Cachi'},
  emerald:    {hex: '#1f5b48', group: 'market', tr: 'Zümrüt', en: 'Emerald', de: 'Smaragd', fr: 'Émeraude', nl: 'Smaragd', da: 'Smaragd', es: 'Esmeralda', it: 'Smeraldo'},
  petrol:     {hex: '#2d5865', group: 'market', tr: 'Petrol mavisi', en: 'Petrol blue', de: 'Petrol', fr: 'Bleu pétrole', nl: 'Petrol', da: 'Petrolblå', es: 'Azul petróleo', it: 'Blu petrolio'},
  turquoise:  {hex: '#3e9ea2', group: 'market', tr: 'Turkuaz', en: 'Turquoise', de: 'Türkis', fr: 'Turquoise', nl: 'Turquoise', da: 'Turkis', es: 'Turquesa', it: 'Turchese'},
  iceBlue:    {hex: '#b8cad3', group: 'market', tr: 'Buz mavisi', en: 'Ice blue', de: 'Eisblau', fr: 'Bleu glacier', nl: 'IJsblauw', da: 'Isblå', es: 'Azul hielo', it: 'Azzurro ghiaccio'},
  navy:       {hex: '#1f2a44', group: 'market', tr: 'Lacivert', en: 'Navy', de: 'Marineblau', fr: 'Bleu marine', nl: 'Marineblauw', da: 'Marineblå', es: 'Azul marino', it: 'Blu navy'},
  greige:     {hex: '#b7ad9e', group: 'market', tr: 'Grej', en: 'Greige', de: 'Greige', fr: 'Grège', nl: 'Greige', da: 'Greige', es: 'Greige', it: 'Greige'},
  black:      {hex: '#1d1d1d', group: 'market', tr: 'Siyah', en: 'Black', de: 'Schwarz', fr: 'Noir', nl: 'Zwart', da: 'Sort', es: 'Negro', it: 'Nero'},
  // Heritage dye names (NAKIŞ palette)
  chalk:      {hex: '#e9e4d8', tr: 'Tebeşir', en: 'Chalk'},
  oat:        {hex: '#d8ccb4', tr: 'Yulaf', en: 'Oat'},
  naturalLinen:{hex: '#cbbb9c', tr: 'Doğal keten', en: 'Natural Linen'},
  stone:      {hex: '#a9a294', tr: 'Taş', en: 'Stone'},
  taupe:      {hex: '#8a7a68', tr: 'Vizon', en: 'Taupe'},
  ochre:      {hex: '#c08a3e', tr: 'Aşı boyası', en: 'Yellow Ochre'},
  weld:       {hex: '#d2b24c', tr: 'Muhabbet çiçeği sarısı', en: 'Weld Yellow'},
  rust:       {hex: '#9c4f2e', tr: 'Pas', en: 'Rust'},
  turkeyRed:  {hex: '#a3302a', tr: 'Türk kırmızısı', en: 'Turkey Red'},
  cochineal:  {hex: '#8e1f3b', tr: 'Kırmız', en: 'Cochineal Crimson'},
  tyrian:     {hex: '#5b2245', tr: 'Sur moru', en: 'Tyrian Purple'},
  mauve:      {hex: '#9a7f86', tr: 'Leylak külü', en: 'Mauve'},
  blush:      {hex: '#d6b0a4', tr: 'Pudra', en: 'Blush'},
  sage:       {hex: '#8f9a83', tr: 'Adaçayı', en: 'Sage'},
  olive:      {hex: '#6b6a3f', tr: 'Zeytin', en: 'Olive'},
  verdigris:  {hex: '#4f8a7b', tr: 'Bakır pası', en: 'Verdigris'},
  bottle:     {hex: '#2f4a3a', tr: 'Şişe yeşili', en: 'Bottle Green'},
  turkishBlue:{hex: '#2f7f98', tr: 'İznik mavisi', en: 'Turkish Blue'},
  woad:       {hex: '#5e7894', tr: 'Çivitotu mavisi', en: 'Woad Blue'},
  indigo:     {hex: '#263a5c', tr: 'Çivit', en: 'Indigo'},
  kakishibu:  {hex: '#7a5235', tr: 'Kakishibu kahvesi', en: 'Kakishibu Brown'},
  cognac:     {hex: '#8c5129', tr: 'Konyak', en: 'Cognac'},
  charcoal:   {hex: '#3b3b38', tr: 'Antrasit', en: 'Charcoal'},
  bogolan:    {hex: '#262320', tr: 'Bogolan siyahı', en: 'Bogolan Mud Black'}
};

export const colorGroup = k => COLORS[k]?.group || 'heritage';

export const WOODS = {
  gurgen:  {tr: 'Gürgen', en: 'Beech (gürgen)', de: 'Buche (Gürgen)', fr: 'Hêtre (gürgen)', nl: 'Beuken (gürgen)', da: 'Bøg (gürgen)', es: 'Haya (gürgen)', it: 'Faggio (gürgen)', base: '#d9b48f', grain: '#bc9472', rays: 0.3, figure: 0.12, ring: 3.6, density: 720},
  oak:     {tr: 'Meşe', en: 'Oak', de: 'Eiche', fr: 'Chêne', nl: 'Eiken', da: 'Eg', es: 'Roble', it: 'Rovere', base: '#c39f72', grain: '#8e6a43', rays: 0.6, figure: 0.35, ring: 5.5, density: 720},
  ash:     {tr: 'Dişbudak', en: 'Ash', de: 'Esche', fr: 'Frêne', nl: 'Essen', da: 'Ask', es: 'Fresno', it: 'Frassino', base: '#d6c3a0', grain: '#a48a64', rays: 0.1, figure: 0.55, ring: 7, density: 690},
  beech:   {tr: 'Kayın', en: 'Beech', de: 'Buche', fr: 'Hêtre', nl: 'Beuken', da: 'Bøg', es: 'Haya', it: 'Faggio', base: '#d4a984', grain: '#b48563', rays: 0.35, figure: 0.15, ring: 4, density: 720},
  walnut:  {tr: 'Ceviz', en: 'Walnut', de: 'Nussbaum', fr: 'Noyer', nl: 'Notelaar', da: 'Valnød', es: 'Nogal', it: 'Noce', base: '#6e4a33', grain: '#3e281b', rays: 0.05, figure: 0.65, ring: 6, density: 640},
  cherry:  {tr: 'Kiraz', en: 'Cherry', de: 'Kirsche', fr: 'Merisier', nl: 'Kersen', da: 'Kirsebær', es: 'Cerezo', it: 'Ciliegio', base: '#a2603f', grain: '#7a4229', rays: 0.05, figure: 0.3, ring: 4.5, density: 600},
  teak:    {tr: 'Tik', en: 'Teak', de: 'Teak', fr: 'Teck', nl: 'Teak', da: 'Teak', es: 'Teca', it: 'Teak', base: '#9a6a3e', grain: '#6a4422', rays: 0.05, figure: 0.4, ring: 5, density: 660},
  smoked:  {tr: 'Füme meşe', en: 'Smoked oak', de: 'Räuchereiche', fr: 'Chêne fumé', nl: 'Gerookt eiken', da: 'Røget eg', es: 'Roble ahumado', it: 'Rovere affumicato', base: '#5e4633', grain: '#35261a', rays: 0.5, figure: 0.35, ring: 5.5, density: 720},
  ebonized:{tr: 'Siyah meşe', en: 'Ebonised oak', de: 'Schwarze Eiche', fr: 'Chêne noirci', nl: 'Zwart eiken', da: 'Sort eg', es: 'Roble ebonizado', it: 'Rovere ebanizzato', base: '#2b2622', grain: '#14110f', rays: 0.4, figure: 0.3, ring: 5.5}
};

/** Stain / colour tones applied over the timber (the species stays e.g. gürgen for strength). */
export const STAINS = {
  natural:   {hex: null, k: 0, tr: 'Doğal', en: 'Natural', de: 'Natur', fr: 'Naturel', nl: 'Naturel', da: 'Natur', es: 'Natural', it: 'Naturale'},
  lightOak:  {hex: '#c9a676', k: 0.45, tr: 'Açık meşe tonu', en: 'Light oak tone', de: 'Eiche hell', fr: 'Ton chêne clair', nl: 'Licht eiken', da: 'Lys eg', es: 'Tono roble claro', it: 'Tono rovere chiaro'},
  oak:       {hex: '#a77d4c', k: 0.55, tr: 'Meşe tonu', en: 'Oak tone', de: 'Eiche', fr: 'Ton chêne', nl: 'Eiken', da: 'Eg', es: 'Tono roble', it: 'Tono rovere'},
  teak:      {hex: '#8a5a32', k: 0.6, tr: 'Tik tonu', en: 'Teak tone', de: 'Teak', fr: 'Ton teck', nl: 'Teak', da: 'Teak', es: 'Tono teca', it: 'Tono teak'},
  cherry:    {hex: '#8c4a2f', k: 0.6, tr: 'Kiraz tonu', en: 'Cherry tone', de: 'Kirsche', fr: 'Ton merisier', nl: 'Kersen', da: 'Kirsebær', es: 'Tono cerezo', it: 'Tono ciliegio'},
  walnut:    {hex: '#5e3f2a', k: 0.7, tr: 'Ceviz tonu', en: 'Walnut tone', de: 'Nussbaum', fr: 'Ton noyer', nl: 'Notelaar', da: 'Valnød', es: 'Tono nogal', it: 'Tono noce'},
  darkWalnut:{hex: '#3e2a1d', k: 0.78, tr: 'Koyu ceviz tonu', en: 'Dark walnut tone', de: 'Nussbaum dunkel', fr: 'Noyer foncé', nl: 'Donker noten', da: 'Mørk valnød', es: 'Nogal oscuro', it: 'Noce scuro'},
  wenge:     {hex: '#2d2119', k: 0.85, tr: 'Wenge', en: 'Wenge', de: 'Wenge', fr: 'Wengé', nl: 'Wengé', da: 'Wenge', es: 'Wengué', it: 'Wengé'},
  black:     {hex: '#191715', k: 0.9, tr: 'Siyah', en: 'Black', de: 'Schwarz', fr: 'Noir', nl: 'Zwart', da: 'Sort', es: 'Negro', it: 'Nero'},
  white:     {hex: '#efebe3', k: 0.82, tr: 'Beyaz boya', en: 'White paint', de: 'Weiß lackiert', fr: 'Blanc', nl: 'Wit', da: 'Hvid', es: 'Blanco', it: 'Bianco'},
  greige:    {hex: '#b7ad9e', k: 0.75, tr: 'Grej', en: 'Greige', de: 'Greige', fr: 'Grège', nl: 'Greige', da: 'Greige', es: 'Greige', it: 'Greige'},
  anthracite:{hex: '#3c3d3f', k: 0.88, tr: 'Antrasit boya', en: 'Anthracite paint', de: 'Anthrazit', fr: 'Anthracite', nl: 'Antraciet', da: 'Antracit', es: 'Antracita', it: 'Antracite'}
};

/** Natural stone and engineered surfaces for table tops. density kg/m³. */
export const STONES = {
  carrara:   {tr: 'Carrara mermer', en: 'Carrara marble', de: 'Carrara-Marmor', fr: 'Marbre de Carrare', nl: 'Carrara-marmer', da: 'Carrara-marmor', es: 'Mármol Carrara', it: 'Marmo di Carrara', base: '#e9e8e4', vein: '#8d9197', style: 'fine', density: 2700},
  calacatta: {tr: 'Calacatta mermer', en: 'Calacatta marble', de: 'Calacatta-Marmor', fr: 'Marbre Calacatta', nl: 'Calacatta-marmer', da: 'Calacatta-marmor', es: 'Mármol Calacatta', it: 'Marmo Calacatta', base: '#f1eee8', vein: '#a58a62', style: 'bold', density: 2700},
  nero:      {tr: 'Nero Marquina', en: 'Nero Marquina', de: 'Nero Marquina', fr: 'Nero Marquina', nl: 'Nero Marquina', da: 'Nero Marquina', es: 'Negro Marquina', it: 'Nero Marquina', base: '#1c1c1d', vein: '#e6e3dd', style: 'fine', density: 2700},
  emperador: {tr: 'Emperador', en: 'Emperador', de: 'Emperador', fr: 'Emperador', nl: 'Emperador', da: 'Emperador', es: 'Emperador', it: 'Emperador', base: '#5b4232', vein: '#c9b39a', style: 'net', density: 2700},
  verde:     {tr: 'Yeşil mermer', en: 'Verde marble', de: 'Grüner Marmor', fr: 'Marbre vert', nl: 'Groen marmer', da: 'Grøn marmor', es: 'Mármol verde', it: 'Marmo verde', base: '#244137', vein: '#c8d4c7', style: 'net', density: 2750},
  travertine:{tr: 'Traverten', en: 'Travertine', de: 'Travertin', fr: 'Travertin', nl: 'Travertijn', da: 'Travertin', es: 'Travertino', it: 'Travertino', base: '#d6c3a3', vein: '#b49c78', style: 'bands', density: 2500},
  terrazzo:  {tr: 'Terrazzo', en: 'Terrazzo', de: 'Terrazzo', fr: 'Terrazzo', nl: 'Terrazzo', da: 'Terrazzo', es: 'Terrazo', it: 'Terrazzo', base: '#e3ddd2', vein: '#8a6f5a', style: 'chips', density: 2400},
  concrete:  {tr: 'Beton görünüm seramik', en: 'Concrete-look ceramic', de: 'Keramik Betonoptik', fr: 'Céramique effet béton', nl: 'Keramiek betonlook', da: 'Keramik betonlook', es: 'Cerámica efecto hormigón', it: 'Ceramica effetto cemento', base: '#a19d97', vein: '#7e7a74', style: 'cloud', density: 2400}
};

export const GLASS = {
  clear:  {tr: 'Şeffaf cam', en: 'Clear glass', de: 'Klarglas', fr: 'Verre clair', nl: 'Helder glas', da: 'Klart glas', es: 'Vidrio claro', it: 'Vetro trasparente', hex: '#dfeee9', opacity: 0.18},
  extra:  {tr: 'Ekstra şeffaf cam', en: 'Low-iron glass', de: 'Weißglas', fr: 'Verre extra-clair', nl: 'Extra helder glas', da: 'Ekstra klart glas', es: 'Vidrio extraclaro', it: 'Vetro extrachiaro', hex: '#f2f6f5', opacity: 0.12},
  smoked: {tr: 'Füme cam', en: 'Smoked glass', de: 'Rauchglas', fr: 'Verre fumé', nl: 'Rookglas', da: 'Røget glas', es: 'Vidrio ahumado', it: 'Vetro fumé', hex: '#4a4b4c', opacity: 0.5},
  bronze: {tr: 'Bronz cam', en: 'Bronze glass', de: 'Bronzeglas', fr: 'Verre bronze', nl: 'Bronsglas', da: 'Bronzeglas', es: 'Vidrio bronce', it: 'Vetro bronzo', hex: '#7a5d43', opacity: 0.45},
  frosted:{tr: 'Buzlu cam', en: 'Frosted glass', de: 'Satiniertes Glas', fr: 'Verre dépoli', nl: 'Mat glas', da: 'Mattet glas', es: 'Vidrio esmerilado', it: 'Vetro satinato', hex: '#e7ecea', opacity: 0.65}
};

export const SURFACES = {
  wood: {tr: 'Masif ahşap', en: 'Solid wood', de: 'Massivholz', fr: 'Bois massif', nl: 'Massief hout', da: 'Massivt træ', es: 'Madera maciza', it: 'Legno massello'},
  veneer: {tr: 'Ahşap kaplama', en: 'Wood veneer', de: 'Furnier', fr: 'Placage bois', nl: 'Houtfineer', da: 'Træfiner', es: 'Chapa de madera', it: 'Impiallacciatura'},
  stone: {tr: 'Doğal taş / seramik', en: 'Stone / ceramic', de: 'Stein / Keramik', fr: 'Pierre / céramique', nl: 'Steen / keramiek', da: 'Sten / keramik', es: 'Piedra / cerámica', it: 'Pietra / ceramica'},
  glass: {tr: 'Cam', en: 'Glass', de: 'Glas', fr: 'Verre', nl: 'Glas', da: 'Glas', es: 'Vidrio', it: 'Vetro'},
  lacquer: {tr: 'Lake', en: 'Lacquer', de: 'Lack', fr: 'Laque', nl: 'Lak', da: 'Lak', es: 'Laca', it: 'Laccato'},
  metal: {tr: 'Metal', en: 'Metal', de: 'Metall', fr: 'Métal', nl: 'Metaal', da: 'Metal', es: 'Metal', it: 'Metallo'}
};

export const FINISHES = {
  matte:   {tr: 'Mat', en: 'Matt', de: 'Matt', fr: 'Mat', nl: 'Mat', da: 'Mat', es: 'Mate', it: 'Opaco', rough: 0.78, clearcoat: 0, density: 720},
  oil:     {tr: 'Yağ', en: 'Oiled', de: 'Geölt', fr: 'Huilé', nl: 'Geolied', da: 'Olieret', es: 'Aceitado', it: 'Oliato', rough: 0.6, clearcoat: 0.08},
  satin:   {tr: 'İpek mat', en: 'Satin', de: 'Seidenmatt', fr: 'Satiné', nl: 'Zijdemat', da: 'Silkemat', es: 'Satinado', it: 'Satinato', rough: 0.45, clearcoat: 0.25},
  lacquer: {tr: 'Parlak lake', en: 'Gloss lacquer', de: 'Hochglanzlack', fr: 'Laque brillante', nl: 'Hoogglanslak', da: 'Højglanslak', es: 'Laca brillante', it: 'Laccato lucido', rough: 0.18, clearcoat: 0.9}
};

export const METALS = {
  brass:  {tr: 'Pirinç', en: 'Brass', de: 'Messing', fr: 'Laiton', nl: 'Messing', da: 'Messing', es: 'Latón', it: 'Ottone', hex: '#b38b4a', rough: 0.32},
  bronze: {tr: 'Bronz', en: 'Bronze', de: 'Bronze', fr: 'Bronze', nl: 'Brons', da: 'Bronze', es: 'Bronce', it: 'Bronzo', hex: '#6b4f33', rough: 0.4},
  black:  {tr: 'Siyah çelik', en: 'Black steel', de: 'Schwarzstahl', fr: 'Acier noir', nl: 'Zwart staal', da: 'Sort stål', es: 'Acero negro', it: 'Acciaio nero', hex: '#2a2a28', rough: 0.45},
  chrome: {tr: 'Krom', en: 'Chrome', de: 'Chrom', fr: 'Chrome', nl: 'Chroom', da: 'Krom', es: 'Cromo', it: 'Cromo', hex: '#cfd2d4', rough: 0.08},
  nickel: {tr: 'Fırçalı nikel', en: 'Brushed nickel', de: 'Nickel gebürstet', fr: 'Nickel brossé', nl: 'Geborsteld nikkel', da: 'Børstet nikkel', es: 'Níquel cepillado', it: 'Nichel spazzolato', hex: '#a5a39b', rough: 0.3}
};

export const DEFAULT_MATERIALS = {
  fabric: {fiber: 'linen', weave: 'plain', color: 'oat', pattern: 'none', color2: 'charcoal', scale: 1, motif: null, density: 3},
  welt: {color: null},
  wood: {species: 'gurgen', stain: 'natural', finish: 'matte'},
  metal: {finish: 'black'}
};

export function normalizeMaterials(m = {}) {
  const f = {...DEFAULT_MATERIALS.fabric, ...(m.fabric || {})};
  if (!FIBERS[f.fiber]) f.fiber = 'linen';
  if (!WEAVES[f.weave]) f.weave = 'plain';
  if (!COLORS[f.color]) f.color = 'cream';
  if (!COLORS[f.color2]) f.color2 = 'charcoal';
  if (PATTERN_ALIASES[f.pattern]) f.pattern = PATTERN_ALIASES[f.pattern];
  if (!PATTERNS[f.pattern] || HIDES.includes(f.fiber)) f.pattern = 'none'; // hides take no printed pattern
  f.scale = Math.min(3, Math.max(0.5, Number(f.scale) || 1));
  f.density = Math.min(12, Math.max(1, Math.round(Number(f.density) || 3))); // 1 very sparse … 12 very dense
  const motifs = MOTIF_CHOICES[f.pattern];
  f.motif = motifs ? (motifs.includes(f.motif) ? f.motif : motifs[0]) : null;
  const w = {...DEFAULT_MATERIALS.wood, ...(m.wood || {})};
  if (!WOODS[w.species]) w.species = 'gurgen';
  if (!STAINS[w.stain]) w.stain = 'natural';
  if (!FINISHES[w.finish]) w.finish = 'matte';
  const metal = {...DEFAULT_MATERIALS.metal, ...(m.metal || {})};
  if (!METALS[metal.finish]) metal.finish = 'black';
  const welt = {color: COLORS[m.welt?.color] ? m.welt.color : null};
  return {fabric: f, welt, wood: w, metal};
}

/** Nearest market colour for a heritage dye (used when proposals should read as everyday upholstery). */
export const MARKET_NEAR = {chalk: 'white', oat: 'cream', naturalLinen: 'sand', stone: 'silver', taupe: 'mink', ochre: 'mustard', weld: 'mustard', rust: 'camel', turkeyRed: 'cherryRed', cochineal: 'cherryRed', tyrian: 'lilac', mauve: 'dustyRose', blush: 'dustyRose', sage: 'mint', olive: 'khaki', verdigris: 'turquoise', bottle: 'emerald', turkishBlue: 'petrol', woad: 'iceBlue', indigo: 'navy', kakishibu: 'chocolate', cognac: 'camel', charcoal: 'anthracite', bogolan: 'black'};

/** Table materials: top and base surfaces. */
export const DEFAULT_TABLE_MATERIALS = {
  top: {surface: 'wood', species: 'oak', stain: 'natural', finish: 'oil', stone: 'carrara', glass: 'clear', color: 'white', polish: 'honed'},
  base: {surface: 'wood', species: 'oak', stain: 'natural', finish: 'oil', metal: 'black', color: 'black'},
  hardware: {metal: 'brass'}
};
export function normalizeTableMaterials(m = {}) {
  const top = {...DEFAULT_TABLE_MATERIALS.top, ...(m.top || {})}, base = {...DEFAULT_TABLE_MATERIALS.base, ...(m.base || {})}, hardware = {...DEFAULT_TABLE_MATERIALS.hardware, ...(m.hardware || {})};
  if (!['wood', 'veneer', 'stone', 'glass', 'lacquer'].includes(top.surface)) top.surface = 'wood';
  if (!['wood', 'metal', 'lacquer', 'same'].includes(base.surface)) base.surface = 'wood';
  for (const o of [top, base]) { if (!WOODS[o.species]) o.species = 'oak'; if (!STAINS[o.stain]) o.stain = 'natural'; if (!FINISHES[o.finish]) o.finish = 'oil'; if (!COLORS[o.color]) o.color = o === top ? 'white' : 'black'; }
  if (!STONES[top.stone]) top.stone = 'carrara'; if (!GLASS[top.glass]) top.glass = 'clear'; if (!['honed', 'polished'].includes(top.polish)) top.polish = 'honed';
  if (!METALS[base.metal]) base.metal = 'black'; if (!METALS[hardware.metal]) hardware.metal = 'brass';
  return {top, base, hardware};
}

/** Bedroom materials: upholstery (fabric, welt), solid wood (legs, frames), case surface (bodies, panels, platforms),
 * metal (pulls, sled), bedding colour. Beds and bedside units share one palette so a set reads as a set. */
export const LINEN_COLORS = ['white', 'cream', 'sand', 'silver', 'greige', 'dustyRose', 'iceBlue', 'khaki', 'anthracite'];
export function normalizeBedroomMaterials(m = {}) {
  const base = normalizeMaterials({...m, wood: {species: 'oak', stain: 'natural', finish: 'oil', ...(m.wood || {})}});
  const c = {surface: 'veneer', species: 'oak', stain: 'natural', finish: 'matte', color: 'cream', ...(m.case || {})};
  if (!['wood', 'veneer', 'lacquer'].includes(c.surface)) c.surface = 'veneer';
  if (!WOODS[c.species]) c.species = 'oak'; if (!STAINS[c.stain]) c.stain = 'natural'; if (!FINISHES[c.finish]) c.finish = 'matte'; if (!COLORS[c.color]) c.color = 'cream';
  const linen = {color: LINEN_COLORS.includes(m.linen?.color) ? m.linen.color : 'white'};
  return {...base, case: c, linen};
}

/** Case goods (RİTMO): carcass and fronts (solid wood, veneered MDF or lacquered MDF), leg wood, metal, glass. */
const SURF = s => { const c = {surface: 'veneer', species: 'oak', stain: 'natural', finish: 'matte', color: 'white', ...s}; if (!['wood', 'veneer', 'lacquer'].includes(c.surface)) c.surface = 'veneer'; if (!WOODS[c.species] || c.species === 'gurgen') c.species = 'oak'; if (!STAINS[c.stain]) c.stain = 'natural'; if (!FINISHES[c.finish]) c.finish = 'matte'; if (!COLORS[c.color]) c.color = 'white'; return {surface: c.surface, species: c.species, stain: c.stain, finish: c.finish, color: c.color}; };
export function normalizeStorageMaterials(m = {}) {
  const kase = SURF(m.case || {}), front = SURF(m.front || m.case || {});
  const w = {species: kase.surface === 'lacquer' ? 'oak' : kase.species, stain: kase.surface === 'lacquer' ? 'natural' : kase.stain, finish: 'oil', ...(m.wood || {})};
  const wood = {species: WOODS[w.species] ? w.species : 'oak', stain: STAINS[w.stain] ? w.stain : 'natural', finish: FINISHES[w.finish] ? w.finish : 'oil'};
  return {case: kase, front, wood, metal: {finish: METALS[m.metal?.finish] ? m.metal.finish : 'black'}, glass: {glass: GLASS[m.glass?.glass] ? m.glass.glass : 'clear'}};
}

/** Kitchen: case-goods materials plus the worktop (stone, wood or lacquered compact) and the sink finish. */
export const SINK_FINISHES = ['steel', 'black', 'grey', 'white'];
export function normalizeKitchenMaterials(m = {}) {
  const base = normalizeStorageMaterials(m), t = {surface: 'stone', stone: 'carrara', polish: 'honed', species: 'oak', stain: 'natural', finish: 'oil', color: 'white', ...(m.top || {})};
  if (!['stone', 'wood', 'lacquer'].includes(t.surface)) t.surface = 'stone';
  if (!STONES[t.stone]) t.stone = 'carrara'; if (!['honed', 'polished'].includes(t.polish)) t.polish = 'honed';
  if (!WOODS[t.species]) t.species = 'oak'; if (!STAINS[t.stain]) t.stain = 'natural'; if (!FINISHES[t.finish]) t.finish = 'oil'; if (!COLORS[t.color]) t.color = 'white';
  return {...base, top: t, sink: {finish: SINK_FINISHES.includes(m.sink?.finish) ? m.sink.finish : 'steel'}};
}

/** Whole-bedroom materials: the furniture palette plus wall paint, floor and rug. */
export const WALL_COLORS = ['white', 'cream', 'sand', 'greige', 'silver', 'mink', 'khaki', 'iceBlue', 'dustyRose', 'mint', 'anthracite', 'petrol'];
export const RUG_COLORS = ['cream', 'sand', 'greige', 'mink', 'silver', 'khaki', 'camel', 'anthracite', 'dustyRose', 'petrol'];
export function normalizeRoomMaterials(m = {}) {
  const base = normalizeBedroomMaterials(m);
  const wall = {color: WALL_COLORS.includes(m.wall?.color) ? m.wall.color : 'cream'};
  const fl = {surface: 'wood', species: 'oak', stain: 'natural', finish: 'matte', stone: 'travertine', polish: 'honed', ...(m.floor || {})};
  if (!['wood', 'stone'].includes(fl.surface)) fl.surface = 'wood';
  if (!WOODS[fl.species]) fl.species = 'oak'; if (!STAINS[fl.stain]) fl.stain = 'natural'; if (!FINISHES[fl.finish]) fl.finish = 'matte'; if (!STONES[fl.stone]) fl.stone = 'travertine';
  const rug = {color: RUG_COLORS.includes(m.rug?.color) ? m.rug.color : 'cream'};
  return {...base, wall, floor: fl, rug};
}
