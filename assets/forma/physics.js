// Live physical and production checks for designer touches (and any compiled design): stability under a load,
// deflection of tops and shelves, minimum sections, CNC inner radii and slender legs. Plain arithmetic, no AI.
// Values (N, mm, MPa): E-moduli along the grain from common timber tables (oak ~11 GPa, beech ~14, ash ~12,
// walnut ~11, pine ~9), MDF ~3.5 GPa, glass ~70, marble ~50; densities in kg/m³.
import {buildMesh, worldPositions} from './build.js';
import {WOODS} from './catalog.js';

const DENSITY = {wood: 680, mdf: 750, metal: 7850, stone: 2700, glass: 2500, foam: 45, fabric: 300, light: 200};
const E_MOD = {wood: 11000, mdf: 3500, stone: 50000, glass: 70000, metal: 200000, lacquer: 3500};
const G = 9.81;

/** Material class of a part from its slot and the design's materials. */
function matClass(q, materials = {}) {
  const m = q.mat || '';
  if (/^lac:/.test(m)) return 'mdf';
  if (['metal', 'steel', 'hardware', 'appliance'].includes(m)) return 'metal';
  if (['glass', 'mirror'].includes(m)) return 'glass';
  if (['fabric', 'welt', 'leather', 'linen'].includes(m)) return 'fabric';
  if (['cushion', 'foam'].includes(q.role)) return 'foam';
  if (['led', 'line'].includes(m)) return 'light';
  const spec = materials[m] || (m === 'base' ? (materials.base?.surface === 'same' ? materials.top : materials.base) : null);
  if (spec?.surface === 'stone' || m === 'sink') return 'stone';
  if (spec?.surface === 'glass') return 'glass';
  if (spec?.surface === 'metal') return 'metal';
  if (spec?.surface === 'lacquer' || spec?.surface === 'veneer' || ['case', 'front', 'back'].includes(m)) return spec?.surface === 'wood' ? 'wood' : 'mdf';
  return 'wood';
}
const meshVolume = mesh => { const P = mesh.positions, I = mesh.indices; let v = 0; if (!I) return 0; for (let k = 0; k < I.length; k += 3) { const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3; v += P[a] * (P[b + 1] * P[c + 2] - P[b + 2] * P[c + 1]) - P[a + 1] * (P[b] * P[c + 2] - P[b + 2] * P[c]) + P[a + 2] * (P[b] * P[c + 1] - P[b + 1] * P[c]); } return Math.abs(v / 6); };
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo.at(-2), lo.at(-1), q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up.at(-2), up.at(-1), q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/** Signed distance of a point inside a convex polygon to its nearest edge (negative = outside). */
function inset(poly, [x, y]) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ex = b[0] - a[0], ey = b[1] - a[1], L = Math.hypot(ex, ey) || 1; d = Math.min(d, ((x - a[0]) * ey - (y - a[1]) * ex) / L * -1); }
  return d;
}

/**
 * Analyse a compiled design. Returns {mass, checks:[{level:'ok'|'warn'|'error', code, tr, en, value}]}.
 * family: 'seating' | 'table' | 'storage' | 'kitchen' | 'bath'.
 */
export function analyse(compiled, materials = {}, family = compiled.family) {
  const checks = [], add = (level, code, tr, en, value) => checks.push({level, code, tr, en, value});
  const solids = [];
  let mass = 0, mx = 0, mz = 0, minY = Infinity;
  for (const q of compiled.parts) {
    if (q.line || q.planOnly || q.decor) continue;
    const mesh = buildMesh(q), w = worldPositions(q), cls = matClass(q, materials), vol = meshVolume(mesh) / 1e9; // m³
    let sx = 0, sz = 0, y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; const n = w.length / 3;
    for (let i = 0; i < w.length; i += 3) { sx += w[i]; sz += w[i + 2]; y0 = Math.min(y0, w[i + 1]); y1 = Math.max(y1, w[i + 1]); x0 = Math.min(x0, w[i]); x1 = Math.max(x1, w[i]); z0 = Math.min(z0, w[i + 2]); z1 = Math.max(z1, w[i + 2]); }
    const kg = vol * DENSITY[cls]; mass += kg; mx += kg * sx / n; mz += kg * sz / n; minY = Math.min(minY, y0);
    solids.push({q, w, cls, kg, y0, y1, x0, x1, z0, z1});
  }
  const com = mass ? [mx / mass, mz / mass] : [0, 0];
  // Support: everything within 4 mm of the floor (wall-hung pieces are carried by the wall: no tipping test).
  const floor = []; for (const s of solids) if (s.y0 < minY + 4) for (let i = 0; i < s.w.length; i += 3) if (s.w[i + 1] < minY + 4) floor.push([s.w[i], s.w[i + 2]]);
  const wallHung = minY > 50 || compiled.params?.base === 'wall';
  if (!wallHung && floor.length >= 3) {
    const poly = hull(floor);
    const top = solids.filter(s => s.q.geom.fn === 'slab' || ['top', 'case-top', 'seat', 'vanity-top'].includes(s.q.role)).sort((a, b) => b.y1 - a.y1)[0] || solids.sort((a, b) => b.y1 - a.y1)[0];
    const load = {table: 30, seating: 100, storage: 20, kitchen: 30, bath: 20}[family] ?? 25;
    const loadPts = top ? [[top.x0, top.cz ?? (top.z0 + top.z1) / 2], [top.x1, (top.z0 + top.z1) / 2], [(top.x0 + top.x1) / 2, top.z0], [(top.x0 + top.x1) / 2, top.z1], [top.x0, top.z0], [top.x1, top.z1], [top.x0, top.z1], [top.x1, top.z0]] : [];
    if (family === 'seating') { const seat = solids.filter(s => /seat|cushion/.test(s.q.role)).sort((a, b) => b.z1 - a.z1)[0]; if (seat) loadPts.splice(0, loadPts.length, [(seat.x0 + seat.x1) / 2, seat.z1], [seat.x0, (seat.z0 + seat.z1) / 2], [seat.x1, (seat.z0 + seat.z1) / 2]); }
    let worst = inset(poly, com);
    for (const p of loadPts) { const c = [(com[0] * mass + p[0] * load) / (mass + load), (com[1] * mass + p[1] * load) / (mass + load)]; worst = Math.min(worst, inset(poly, c)); }
    const lv = worst < 0 ? 'error' : worst < 25 ? 'warn' : 'ok';
    add(lv, 'tip', lv === 'error' ? `Devrilir: kenara ${load} kg yükte ağırlık merkezi taban dışına çıkıyor (${Math.round(-worst)} mm)` : lv === 'warn' ? `Devrilmeye yakın: kenar yükünde pay ${Math.round(worst)} mm` : `Devrilme yok (kenarda ${load} kg, pay ${Math.round(worst)} mm)`,
      lv === 'error' ? `Tips over: with ${load} kg at the edge the centre of mass leaves the base (${Math.round(-worst)} mm)` : lv === 'warn' ? `Close to tipping: margin ${Math.round(worst)} mm under edge load` : `Stable (${load} kg at the edge, margin ${Math.round(worst)} mm)`, worst);
  }
  // Deflection of flat tops and shelves: simply supported over the widest gap between supports beneath, 50 kg at mid-span.
  for (const s of solids) {
    if (s.q.geom.fn !== 'slab' || !['top', 'shelf', 'case-top', 'vanity-top', 'worktop'].includes(s.q.role)) continue;
    const t = s.q.geom.t || 20, under = solids.filter(o => o !== s && o.y1 <= s.y0 + 2 && o.y1 > s.y0 - 60 && o.x1 > s.x0 && o.x0 < s.x1);
    const xs = under.flatMap(o => [o.x0, o.x1]).sort((a, b) => a - b);
    let span = 0; for (let i = 1; i < xs.length; i++) span = Math.max(span, xs[i] - xs[i - 1]);
    if (!under.length) continue;
    const overhang = Math.max(0, Math.min(...under.map(o => o.x0)) - s.x0, s.x1 - Math.max(...under.map(o => o.x1)));
    const b = s.z1 - s.z0, E = E_MOD[s.cls] || 10000, I = b * t ** 3 / 12, P = 50 * G;
    const d = span > 0 ? P * span ** 3 / (48 * E * I) : 0, limit = span / 300;
    const lv = d > limit * 2 ? 'error' : d > limit ? 'warn' : 'ok';
    add(lv, 'sag', `${/top/.test(s.q.role) ? 'Tabla' : 'Raf'} sehimi ${d.toFixed(1)} mm (${Math.round(span)} mm açıklık, sınır ${limit.toFixed(1)})`, `${/top/.test(s.q.role) ? 'Top' : 'Shelf'} deflection ${d.toFixed(1)} mm (${Math.round(span)} mm span, limit ${limit.toFixed(1)})`, d);
    if (overhang > 0) { const dc = 30 * G * overhang ** 3 / (3 * E * I), lc = overhang / 150; if (dc > lc) add(dc > 2 * lc ? 'error' : 'warn', 'overhang', `Çıkma ucu ${dc.toFixed(1)} mm eğiliyor (${Math.round(overhang)} mm çıkma)`, `Overhang tip deflects ${dc.toFixed(1)} mm (${Math.round(overhang)} mm)`, dc); }
    const minT = {wood: 18, mdf: 18, stone: 20, glass: 10, metal: 4}[s.cls] || 18;
    if (t < minT) add('warn', 'thin', `${s.q.role} kalınlığı ${t} mm (${s.cls} için en az ${minT})`, `${s.q.role} thickness ${t} mm (min ${minT} for ${s.cls})`, t);
  }
  // Silhouettes: CNC inner corners (tool radius), very narrow necks.
  for (const s of solids) {
    if (!s.q.shaped || s.q.geom.fn !== 'slab') continue;
    const o = s.q.geom.outline, n = o.length; let area = 0; for (let i = 0; i < n; i++) area += o[i][0] * o[(i + 1) % n][1] - o[(i + 1) % n][0] * o[i][1];
    const sg = Math.sign(area) || 1; let rMin = Infinity;
    for (let i = 0; i < n; i++) {
      const a = o[(i - 1 + n) % n], b = o[i], c = o[(i + 1) % n], cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (cr * sg >= 0) continue; // convex here
      const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), bc = Math.hypot(c[0] - b[0], c[1] - b[1]), ca = Math.hypot(a[0] - c[0], a[1] - c[1]), A = Math.abs(cr) / 2;
      if (A > 1e-6) rMin = Math.min(rMin, ab * bc * ca / (4 * A));
    }
    // Narrow slots and necks: two points of the outline closer than a 6 mm cutter while far apart along the edge.
    const cum = [0]; for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + Math.hypot(o[i % n][0] - o[i - 1][0], o[i % n][1] - o[i - 1][1]));
    const per = cum[n]; let gap = Infinity;
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) { const along = Math.min(cum[j] - cum[i], per - (cum[j] - cum[i])); if (along < 30) continue; gap = Math.min(gap, Math.hypot(o[i][0] - o[j][0], o[i][1] - o[j][1])); }
    if (gap < 6) add('error', 'cnc', `${s.q.id}: ${gap.toFixed(1)} mm dar yarık ya da boğaz — 6 mm freze geçemez, parça kırılgan`, `${s.q.id}: ${gap.toFixed(1)} mm narrow slot or neck — a 6 mm cutter cannot pass`, gap);
    if (rMin < 3) add('error', 'cnc', `${s.q.id}: iç köşe yarıçapı ${rMin.toFixed(1)} mm — CNC freze en az 3 mm ister`, `${s.q.id}: inner corner radius ${rMin.toFixed(1)} mm — CNC needs at least 3 mm`, rMin);
    else if (rMin < Infinity) add('ok', 'cnc', `${s.q.id}: CNC ile kesilebilir (en dar iç yarıçap ${rMin.toFixed(0)} mm)`, `${s.q.id}: CNC-cuttable (tightest inner radius ${rMin.toFixed(0)} mm)`, rMin);
    if (s.cls === 'wood') add('ok', 'grain', `${s.q.id}: masif siluette lif boyuna; dar boğazlarda kısa lif kırılabilir, gerekirse parçalı yapıştırma`, `${s.q.id}: solid outline — grain runs lengthwise; narrow necks may need glued sections`, 0);
  }
  // Turned and shaped legs: smallest section and slenderness (reported once per part role).
  const seenRole = new Set();
  for (const s of solids) {
    const L = s.q.geom.fn === 'lathe' ? s.q.geom : s.q.geom.inner?.fn === 'lathe' ? s.q.geom.inner : null;
    if (!L || !['leg', 'column', 'arm-post', 'foot'].includes(s.q.role) || seenRole.has(s.q.role)) continue;
    seenRole.add(s.q.role);
    const prof = L.profile.filter(([, r]) => r > 0.6), rMin = Math.min(...prof.map(p => p[1])), H = Math.max(...L.profile.map(p => p[0]));
    if (!prof.length) continue;
    const minR = s.cls === 'metal' ? 6 : 9;
    if (rMin < minR - 0.3) add(rMin < minR * 0.8 ? 'error' : 'warn', 'section', `${s.q.role}: en ince kesit Ø${(rMin * 2).toFixed(0)} mm (${s.cls === 'metal' ? 'metal' : 'ahşap'} için en az Ø${minR * 2})`, `${s.q.role}: thinnest section Ø${(rMin * 2).toFixed(0)} mm (min Ø${minR * 2})`, rMin);
    const slender = H / (2 * rMin); if (slender > 40) add('warn', 'slender', `${s.q.role}: narinlik ${slender.toFixed(0)} (boy/çap) — titreşim ve burkulma riski`, `${s.q.role}: slenderness ${slender.toFixed(0)} — risk of wobble`, slender);
  }
  if (!checks.some(c => c.level !== 'ok')) add('ok', 'all', 'Fizik ve üretim denetimleri geçti', 'Physical and production checks passed', 0);
  return {mass: Math.round(mass * 10) / 10, com, checks};
}
