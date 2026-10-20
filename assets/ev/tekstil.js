// AURA — home textiles (curtains and rugs): models and colours shared by the studio (tasarla.html) and the home plan
// (ev.html). Plain fabrics only for now; colours are widely sold market tones, not trend forecasts. Curtain layers:
// one layer (sheer or drape), two layers (sheer + drape / sheer + blackout), or a fabric blind (roller, pleated).
export const MODELS = {'tul-fon': ['Tül + fon', {sheer: true, drape: 'dimout', heading: 'wave'}], 'tul': ['Yalnız tül', {sheer: true, heading: 'wave'}],
  'fon': ['Yalnız fon', {drape: 'dimout', heading: 'wave'}], 'karartma': ['Tül + karartma', {sheer: true, drape: 'blackout', heading: 'wave'}],
  'stor': ['Stor', {shade: 'roller'}], 'plise': ['Plise', {shade: 'pleated'}]};
export const FABRICS = [['keten', 'Keten', '#d8cdbb'], ['kirik-beyaz', 'Kırık beyaz', '#efe9de'], ['kum', 'Kum', '#cdb99a'], ['adacayi', 'Adaçayı', '#a8b09a'],
  ['terrakota', 'Terrakota', '#b9775c'], ['hardal', 'Hardal', '#c49a45'], ['gece-mavisi', 'Gece mavisi', '#4c5a66'], ['antrasit', 'Antrasit', '#55534f']];
export const RUG_MODELS = {duz: 'Düz · bordürlü', cizgili: 'Çizgili', geometrik: 'Geometrik', kilim: 'Kilim', yok: 'Halısız'};
export const RUG_COLORS = [['yulaf', 'Yulaf', '#cdbb9c'], ['kum', 'Kum', '#b8a184'], ['krem', 'Krem', '#e3d9c6'], ['gri', 'Taş gri', '#a9a59c'],
  ['adacayi', 'Adaçayı', '#9ea58e'], ['terrakota', 'Terrakota', '#b06f55'], ['lacivert', 'Lacivert', '#3f4b5c'], ['bordo', 'Bordo', '#7a3b3b']];
export const TEXTILE_KEY = 'aura-tekstil'; // the customer's choice, read by ev.html when a plan has none
