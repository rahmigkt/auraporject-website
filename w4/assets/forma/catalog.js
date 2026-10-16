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
  leather: {tr: 'Deri', en: 'Leather', de: 'Leder', fr: 'Cuir', nl: 'Leer', da: 'Læder', es: 'Cuero', it: 'Pelle', thread: 0, slub: 0, fuzz: 0, sheen: 0, rough: 0.5, weave: false}
};

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
  check: {tr: 'Kareli (pötikare)', en: 'Gingham check', de: 'Vichy-Karo', fr: 'Vichy', nl: 'Boerenbont ruit', da: 'Tern', es: 'Vichy', it: 'Quadretto vichy'},
  plaid: {tr: 'Ekose', en: 'Plaid', de: 'Schottenkaro', fr: 'Écossais', nl: 'Schotse ruit', da: 'Skotskternet', es: 'Escocés', it: 'Scozzese'},
  damask: {tr: 'Damask', en: 'Damask', de: 'Damast', fr: 'Damassé', nl: 'Damast', da: 'Damask', es: 'Damasco', it: 'Damasco'}
};

/** Fabric colours: heritage dye names (as in NAKIŞ) plus contemporary upholstery neutrals. */
export const COLORS = {
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

export const WOODS = {
  oak:     {tr: 'Meşe', en: 'Oak', de: 'Eiche', fr: 'Chêne', nl: 'Eiken', da: 'Eg', es: 'Roble', it: 'Rovere', base: '#c39f72', grain: '#8e6a43', rays: 0.6, figure: 0.35, ring: 5.5},
  ash:     {tr: 'Dişbudak', en: 'Ash', de: 'Esche', fr: 'Frêne', nl: 'Essen', da: 'Ask', es: 'Fresno', it: 'Frassino', base: '#d6c3a0', grain: '#a48a64', rays: 0.1, figure: 0.55, ring: 7},
  beech:   {tr: 'Kayın', en: 'Beech', de: 'Buche', fr: 'Hêtre', nl: 'Beuken', da: 'Bøg', es: 'Haya', it: 'Faggio', base: '#d4a984', grain: '#b48563', rays: 0.35, figure: 0.15, ring: 4},
  walnut:  {tr: 'Ceviz', en: 'Walnut', de: 'Nussbaum', fr: 'Noyer', nl: 'Notelaar', da: 'Valnød', es: 'Nogal', it: 'Noce', base: '#6e4a33', grain: '#3e281b', rays: 0.05, figure: 0.65, ring: 6},
  cherry:  {tr: 'Kiraz', en: 'Cherry', de: 'Kirsche', fr: 'Merisier', nl: 'Kersen', da: 'Kirsebær', es: 'Cerezo', it: 'Ciliegio', base: '#a2603f', grain: '#7a4229', rays: 0.05, figure: 0.3, ring: 4.5},
  teak:    {tr: 'Tik', en: 'Teak', de: 'Teak', fr: 'Teck', nl: 'Teak', da: 'Teak', es: 'Teca', it: 'Teak', base: '#9a6a3e', grain: '#6a4422', rays: 0.05, figure: 0.4, ring: 5},
  smoked:  {tr: 'Füme meşe', en: 'Smoked oak', de: 'Räuchereiche', fr: 'Chêne fumé', nl: 'Gerookt eiken', da: 'Røget eg', es: 'Roble ahumado', it: 'Rovere affumicato', base: '#5e4633', grain: '#35261a', rays: 0.5, figure: 0.35, ring: 5.5},
  ebonized:{tr: 'Siyah meşe', en: 'Ebonised oak', de: 'Schwarze Eiche', fr: 'Chêne noirci', nl: 'Zwart eiken', da: 'Sort eg', es: 'Roble ebonizado', it: 'Rovere ebanizzato', base: '#2b2622', grain: '#14110f', rays: 0.4, figure: 0.3, ring: 5.5}
};

export const FINISHES = {
  matte:   {tr: 'Mat', en: 'Matt', de: 'Matt', fr: 'Mat', nl: 'Mat', da: 'Mat', es: 'Mate', it: 'Opaco', rough: 0.78, clearcoat: 0},
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
  fabric: {fiber: 'linen', weave: 'plain', color: 'oat', pattern: 'none', color2: 'charcoal', scale: 1},
  welt: {color: null},
  wood: {species: 'oak', finish: 'oil'},
  metal: {finish: 'black'}
};

export function normalizeMaterials(m = {}) {
  const f = {...DEFAULT_MATERIALS.fabric, ...(m.fabric || {})};
  if (!FIBERS[f.fiber]) f.fiber = 'linen';
  if (!WEAVES[f.weave]) f.weave = 'plain';
  if (!COLORS[f.color]) f.color = 'oat';
  if (!COLORS[f.color2]) f.color2 = 'charcoal';
  if (!PATTERNS[f.pattern]) f.pattern = 'none';
  f.scale = Math.min(3, Math.max(0.5, Number(f.scale) || 1));
  const w = {...DEFAULT_MATERIALS.wood, ...(m.wood || {})};
  if (!WOODS[w.species]) w.species = 'oak';
  if (!FINISHES[w.finish]) w.finish = 'oil';
  const metal = {...DEFAULT_MATERIALS.metal, ...(m.metal || {})};
  if (!METALS[metal.finish]) metal.finish = 'black';
  const welt = {color: COLORS[m.welt?.color] ? m.welt.color : null};
  return {fabric: f, welt, wood: w, metal};
}
