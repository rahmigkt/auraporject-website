// AURA — home textiles (curtains and rugs), one data contract for the studio (tasarla.html) and the home plan (ev.html).
// Source: Codex PERDE-HALI-ARASTIRMA-02 (knowledge/ev-projesi/veri/tekstil-02-oneriler.json). Fibre, construction,
// colour, light function, heading and layers are separate fields; family names describe a look, never a fibre claim or
// a supplier code (physical sample required). open = 0 closed … 1 open, for each layer on its own.
export const VERSION = 2;
export const COLORS = [ // editorial sRGB starting tones (Codex colour_policy); not manufacturer matches
  ['kirik-beyaz', 'Kırık beyaz', '#eee9df'], ['sicak-tas', 'Sıcak taş', '#c9bfb0'], ['yulaf', 'Yulaf', '#c6b89d'], ['kum', 'Kum', '#bda586'],
  ['grej', 'Mantar / grej', '#a99e91'], ['soguk-tas', 'Soğuk taş', '#a4a8a5'], ['adacayi', 'Adaçayı', '#a0aa96'], ['zeytin', 'Zeytin', '#737c62'],
  ['kil', 'Kil / terrakota', '#b0755c'], ['soluk-gul', 'Soluk gül', '#bd9991'], ['murekkep', 'Mürekkep mavisi', '#384857'], ['komur', 'Kömür', '#4b4c49']];
export const hex = id => (COLORS.find(c => c[0] === id) || COLORS[0])[2];
export const colorName = id => (COLORS.find(c => c[0] === id) || COLORS[0])[1];

// curtain fabric families: how they look and pass light (render proposals, not measured transmittance)
export const SHEERS = {
  'acik-keten': {name: 'Açık keten görünümü', weave: 'slub', opacity: 0.32, rough: 0.95},
  'leno-yun': {name: 'Yün / keten açık yapı', weave: 'leno', opacity: 0.48, rough: 0.95}};
export const DRAPES = {
  'mat-dokuma': {name: 'Mat yoğun dokuma', weave: 'plain', opacity: 0.88, rough: 0.92},
  'keten-gorunumlu': {name: 'Keten görünümlü', weave: 'slub', opacity: 0.85, rough: 0.94},
  'lyocell-pamuk': {name: 'Lyocell / pamuk', weave: 'taffeta', opacity: 0.86, rough: 0.7, sheen: 0.25},
  'ipek-keten': {name: 'İpek / keten görünümü', weave: 'plain', opacity: 0.84, rough: 0.6, sheen: 0.35},
  'pamuk-kadife': {name: 'Kadife görünümü', weave: 'velvet', opacity: 0.97, rough: 0.85, sheen: 1},
  'dimout': {name: 'Işık azaltan fon', weave: 'plain', opacity: 0.94, rough: 0.9},
  'blackout': {name: 'Karartma katmanlı', weave: 'plain', opacity: 1, rough: 0.9, lined: true},
  'jakar': {name: 'Jakar görünümü', weave: 'jacquard', opacity: 0.92, rough: 0.8, sheen: 0.2}};
export const BLINDS = {roller: 'Stor', pleated: 'Plise'};
// headings: fold pitch (mm along the track) and how the top is held; fullness from PERDE-01 ranges (estimation only)
export const HEADINGS = {
  wave: {name: 'Dalga (wave)', pitch: 120, full: 2.3, depth: 75},
  pencil: {name: 'Kalem pile', pitch: 55, full: 2.2, depth: 45},
  double_pinch: {name: 'Çift pile', pitch: 130, full: 2.2, depth: 70, pinch: 2},
  triple_pinch: {name: 'Üçlü pile', pitch: 150, full: 2.5, depth: 80, pinch: 3},
  eyelet: {name: 'Halka', pitch: 170, full: 1.8, depth: 85}};
export const SYSTEMS = {'tul-fon': 'Tül + fon', tul: 'Yalnız tül', fon: 'Yalnız fon', stor: 'Stor', plise: 'Plise', yok: 'Perdesiz'};

// rugs: construction, pattern, edge and colour are independent
export const RUGS = {
  'duz-dokuma': {name: 'Düz dokuma kilim', pile: 0, thick: 6},
  jut: {name: 'Jüt görünümü', pile: 0, thick: 10},
  'kisa-hav': {name: 'Kısa kesik hav', pile: 8, thick: 12},
  bukle: {name: 'Bukle / ilmek', pile: 7, thick: 13},
  rolyef: {name: 'Kesik + ilmek rölyef', pile: 10, thick: 15},
  'uzun-hav': {name: 'Uzun hav', pile: 30, thick: 35}};
export const PATTERNS = {duz: 'Desensiz', serit: 'Şerit', baklava: 'Baklava', kare: 'Kare ızgara'};
export const EDGES = {biye: 'Biye', sacak: 'Saçak', yok: 'Kenarsız'};

export const TEXTILE_KEY = 'aura-tekstil';
export const DEFAULT = () => ({v: VERSION,
  curtain: {system: 'tul-fon', heading: 'wave', sheer: {family: 'acik-keten', color: 'kirik-beyaz', open: 0}, drape: {family: 'mat-dokuma', color: 'yulaf', open: 1}, blind: {color: 'sicak-tas', open: 0.2}},
  rug: {construction: 'duz-dokuma', pattern: 'duz', edge: 'biye', color: 'yulaf', on: true}});

// version 1 ({model, color} per curtain/rug) → version 2; "keten" was only a tone, it becomes a colour, not a fibre
const OLD_COL = {keten: 'yulaf', 'kirik-beyaz': 'kirik-beyaz', kum: 'kum', adacayi: 'adacayi', terrakota: 'kil', hardal: 'kum', 'gece-mavisi': 'murekkep', antrasit: 'komur',
  yulaf: 'yulaf', krem: 'kirik-beyaz', gri: 'soguk-tas', lacivert: 'murekkep', bordo: 'kil'};
export function migrate(t) {
  const d = DEFAULT(); if (!t) return d; if (t.v === VERSION) return {...d, ...t, curtain: {...d.curtain, ...t.curtain}, rug: {...d.rug, ...t.rug}};
  const c = t.curtain || {}, r = t.rug || {}, col = OLD_COL[c.color];
  if (c.model) { d.curtain.system = {'tul-fon': 'tul-fon', tul: 'tul', fon: 'fon', karartma: 'tul-fon', stor: 'stor', plise: 'plise', yok: 'yok'}[c.model] || 'tul-fon';
    if (c.model === 'karartma') d.curtain.drape.family = 'blackout'; }
  if (col) { d.curtain.drape.color = col; d.curtain.blind.color = col; }
  if (r.model) { if (r.model === 'yok') d.rug.on = false; d.rug.pattern = {cizgili: 'serit', geometrik: 'kare', kilim: 'baklava'}[r.model] || 'duz'; if (r.model === 'kilim') d.rug.construction = 'duz-dokuma'; }
  if (OLD_COL[r.color]) d.rug.color = OLD_COL[r.color];
  d.migrated_from = t; return d;
}
// a room's choice on top of the home's (each a partial v2 record)
export function merged(home, room) {
  const h = migrate(home), r = room ? migrate(room) : null; if (!r) return h;
  return r;
}
// seeded random: same project → same texture (no Math.random)
export const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

// ---- shared chooser markup (studio panel and the home-plan overlay) -------------------------------------------------
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const chips = (path, list, cur) => `<div class="tx-chips">${Object.entries(list).map(([k, v]) => `<button type="button" data-p="${path}" data-v="${k}" aria-pressed="${cur === k}">${esc(typeof v === 'string' ? v : v.name)}</button>`).join('')}</div>`;
const dots = (path, cur) => `<div class="tx-dots">${COLORS.map(([k, n, h]) => `<button type="button" data-p="${path}" data-v="${k}" title="${esc(n)}" aria-label="${esc(n)}" aria-pressed="${cur === k}" style="background:${h}"></button>`).join('')}</div>`;
const slider = (path, v, label) => `<label class="tx-open">${label} <input type="range" min="0" max="1" step="0.05" data-p="${path}" value="${v}" aria-label="${esc(label)}"><b>${v <= 0.02 ? 'kapalı' : v >= 0.98 ? 'açık' : Math.round(v * 100) + '%'}</b></label>`;
export function chooserHTML(t, tab = 'curtain', {compact = false} = {}) {
  const c = t.curtain, r = t.rug;
  if (tab === 'rug') return `<h4>Yapı</h4>${chips('rug.construction', RUGS, r.on ? r.construction : '')}
    <div class="tx-row"><button type="button" data-p="rug.on" data-v="${r.on ? 0 : 1}" aria-pressed="${!r.on}">Halısız</button></div>
    ${r.on ? `<h4>Desen</h4>${chips('rug.pattern', PATTERNS, r.pattern)}${compact ? '' : `<h4>Kenar</h4>${chips('rug.edge', EDGES, r.edge)}`}<h4>Renk</h4>${dots('rug.color', r.color)}` : ''}`;
  const sh = ['tul-fon', 'tul'].includes(c.system), dr = ['tul-fon', 'fon'].includes(c.system), bl = ['stor', 'plise'].includes(c.system);
  return `<h4>Sistem</h4>${chips('curtain.system', SYSTEMS, c.system)}
    ${sh || dr ? `<h4>Başlık</h4>${chips('curtain.heading', HEADINGS, c.heading)}` : ''}
    ${sh ? `<h4>Tül</h4>${chips('curtain.sheer.family', SHEERS, c.sheer.family)}${compact ? '' : dots('curtain.sheer.color', c.sheer.color)}${compact ? '' : slider('curtain.sheer.open', c.sheer.open, 'Tül')}` : ''}
    ${dr ? `<h4>Fon</h4>${chips('curtain.drape.family', DRAPES, c.drape.family)}${dots('curtain.drape.color', c.drape.color)}${compact ? '' : slider('curtain.drape.open', c.drape.open, 'Fon')}` : ''}
    ${bl ? `<h4>Renk</h4>${dots('curtain.blind.color', c.blind.color)}${compact ? '' : slider('curtain.blind.open', c.blind.open, 'Açıklık')}` : ''}`;
}
// apply one chooser event (button or slider) to a record; returns true when something changed
export function applyChoice(t, el) {
  const p = el.dataset.p; if (!p) return false; let v = el.dataset.v ?? el.value;
  if (p.endsWith('.open')) v = +v; if (p === 'rug.on') v = v === '1' || v === 1;
  const keys = p.split('.'), last = keys.pop(), o = keys.reduce((a, k) => a[k] ??= {}, t); o[last] = v;
  if (p === 'rug.construction') t.rug.on = true; return true;
}
export const TEXTILE_CSS = `.tx-chips{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px}.tx-chips button,.tx-row button{font:inherit;font-size:12.5px;padding:5px 9px;border:1px solid #ddd6c6;background:#fff;cursor:pointer;color:#292722}
.tx-chips button[aria-pressed=true],.tx-row button[aria-pressed=true]{border-color:#AD503E;color:#AD503E}.tx-dots{display:grid;grid-template-columns:repeat(12,1fr);gap:5px;margin:4px 0 6px}
.tx-dots button{aspect-ratio:1;border:1px solid #cfc8ba;border-radius:50%;padding:0;cursor:pointer;min-width:0}.tx-dots button[aria-pressed=true]{outline:2px solid #AD503E;outline-offset:2px}
.tx-open{display:flex;align-items:center;gap:8px;font-size:12px;color:#746D63;margin:2px 0 8px}.tx-open input{flex:1;accent-color:#AD503E}.tx-open b{min-width:46px;font-weight:500;color:#292722}
.tx h4{font:600 10.5px system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#746D63;margin:12px 0 6px}`;
