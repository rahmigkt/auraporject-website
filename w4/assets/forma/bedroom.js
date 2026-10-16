// Bedroom family: bed (karyola), bedside table (komodin) and chest of drawers (şifonyer) from one grammar.
// Units: mm. Origin: floor centre. Bed: width along x, length along z (headboard at −z, foot at +z).
// Case pieces: width along x, depth along z (front = +z).
// Design rules from research (see knowledge/AURA-YATAK-ODASI-ARASTIRMA.md): the headboard is the bedroom's
// dominant plane and carries most of the originality; mattress top 450–600 mm; headboard 300–700 mm above the
// mattress for back support; bedside tops level with the mattress (±100 mm); drawers graduated bottom-heavy;
// chests anchored to the wall. Checks are guidance for the designer, not certification.
import {topOutline, clipX, offsetOutline, transformPositions, bounds} from './mesh.js';
import {legProfile} from './profiles.js';
import {clamp} from './rng.js';
import {WOODS} from './catalog.js';

export const FAMILY = 'bedroom';

/** Mattress sizes sold in Turkey and the EU (width × length, mm). */
export const MATTRESS = {
  '90x190': [900, 1900], '90x200': [900, 2000], '100x200': [1000, 2000], '120x200': [1200, 2000], '140x190': [1400, 1900], '140x200': [1400, 2000],
  '150x200': [1500, 2000], '160x200': [1600, 2000], '180x200': [1800, 2000], '200x200': [2000, 2000]
};

export const KINDS = {
  bed:        {width: [900, 2000], height: [900, 1500]},
  nightstand: {width: [400, 650], depth: [340, 450], height: [450, 650]},
  dresser:    {width: [800, 1800], depth: [400, 520], height: [720, 1250]}
};

export const RANGES = {
  // Bed
  mattressWidth: [800, 2000, 10], mattressLength: [1900, 2200, 10], mattressThickness: [160, 340, 5],
  legHeight: [0, 260, 5], railHeight: [80, 420, 5], border: [0, 320, 5], plinthInset: [0, 300, 5],
  headHeight: [700, 1800, 10], headThickness: [30, 220, 5], headExtend: [0, 900, 10], headRadius: [0, 700, 5],
  scallops: [2, 7, 1], channelCount: [4, 24, 1], tuftSpacing: [120, 280, 5], slatWidth: [25, 140, 5], slatGap: [6, 80, 1],
  wingDepth: [80, 400, 5], frameWidth: [30, 140, 5], footHeight: [150, 1100, 10], postSize: [35, 120, 1], postHeight: [1200, 2400, 10],
  legSize: [25, 100, 1], legTaper: [0.4, 1, 0.05], nightWidth: [350, 650, 10],
  // Case pieces
  width: [350, 2000, 10], depth: [300, 600, 5], height: [380, 1400, 5], topThickness: [0, 50, 1], topOverhang: [0, 40, 1],
  cornerRadius: [0, 260, 5], baseHeight: [0, 320, 5], rows: [1, 6, 1], columns: [1, 3, 1], graduation: [0, 1, 0.05],
  fluteWidth: [12, 60, 1], mirrorHeight: [400, 1300, 10], mirrorWidth: [0.3, 1, 0.05]
};

export const ENUMS = {
  headType: ['upholstered', 'channel', 'hChannel', 'tufted', 'panels', 'framed', 'wingback', 'split', 'panel', 'slats', 'cane', 'boiserie'],
  headShape: ['rect', 'rounded', 'arch', 'scallop', 'capsule', 'stepped'],
  bedBase: ['baza', 'platform', 'floating', 'frame', 'upholsteredFrame', 'fourPoster'],
  legType: ['hidden', 'block', 'round', 'roundTaper', 'squareTaper', 'square', 'cone', 'sled'],
  footboard: ['none', 'low', 'high'],
  storage: ['none', 'lift', 'drawers'],
  bedding: ['made', 'mattress'],
  integratedNight: ['none', 'shelf', 'drawer'],
  frontStyle: ['flat', 'framed', 'fluted', 'cane', 'grooved'],
  pull: ['none', 'knob', 'bar', 'edge', 'leather', 'ring'],
  caseBase: ['legs', 'plinth', 'recessed', 'sled', 'wall'],
  caseLayout: ['stack', 'split', 'topSplit', 'niche'],
  caseEdge: ['square', 'eased', 'bullnose', 'chamfer'],
  mirror: ['none', 'rect', 'arch', 'round', 'capsule']
};

export const DEFAULTS = {
  mattressWidth: 1600, mattressLength: 2000, mattressThickness: 260, legHeight: 80, railHeight: 300, border: 60, plinthInset: 120,
  headHeight: 1150, headThickness: 100, headExtend: 0, headRadius: 120, scallops: 3, channelCount: 10, tuftSpacing: 180, slatWidth: 60, slatGap: 20,
  wingDepth: 220, frameWidth: 60, footHeight: 450, postSize: 60, postHeight: 2000, legSize: 50, legTaper: 0.7, nightWidth: 480,
  width: 520, depth: 400, height: 560, topThickness: 25, topOverhang: 10, cornerRadius: 0, baseHeight: 120, rows: 2, columns: 1, graduation: 0.4,
  fluteWidth: 24, mirrorHeight: 800, mirrorWidth: 0.7,
  headType: 'upholstered', headShape: 'rect', bedBase: 'baza', legType: 'block', footboard: 'none', storage: 'none', bedding: 'made', integratedNight: 'none',
  frontStyle: 'flat', pull: 'knob', caseBase: 'legs', caseLayout: 'stack', caseEdge: 'eased', mirror: 'none', kind: 'bed'
};

const UPHOLSTERED_HEADS = ['upholstered', 'channel', 'hChannel', 'tufted', 'panels', 'framed', 'wingback', 'split'];

/** Clamp and reconcile so every combination is buildable. */
export function normalize(input = {}) {
  const p = {...DEFAULTS};
  for (const [k, [lo, hi, step]] of Object.entries(RANGES)) { const v = Number(input[k]); if (Number.isFinite(v)) p[k] = +(Math.round(clamp(v, lo, hi) / step) * step).toFixed(3); }
  for (const [k, list] of Object.entries(ENUMS)) if (list.includes(input[k])) p[k] = input[k];
  if (KINDS[input.kind]) p.kind = input.kind;
  if (p.kind === 'bed') {
    if (['baza'].includes(p.bedBase)) { p.border = 0; if (p.legType === 'sled') p.legType = 'block'; }
    if (p.bedBase === 'floating') { p.legType = 'hidden'; p.plinthInset = Math.max(p.plinthInset, 150); p.legHeight = Math.max(p.legHeight, 90); }
    if (p.bedBase === 'platform' && p.legType === 'sled') p.legType = 'hidden';
    if (['frame', 'fourPoster'].includes(p.bedBase) && p.legType === 'hidden') p.legType = 'square';
    if (p.bedBase === 'fourPoster') { p.legType = p.legType === 'sled' ? 'square' : p.legType; p.headExtend = 0; }
    if (p.storage === 'lift' && !['baza', 'upholsteredFrame', 'platform'].includes(p.bedBase)) p.storage = 'drawers';
    if (p.storage === 'drawers' && ['baza'].includes(p.bedBase)) p.storage = 'lift';
    if (p.storage !== 'none') p.railHeight = Math.max(p.railHeight, 260);
    if (p.headType === 'tufted' && !['rect', 'rounded'].includes(p.headShape)) p.headShape = 'rounded';
    if (p.headType === 'boiserie') p.headExtend = Math.max(p.headExtend, 450);
    if (p.headType === 'wingback') p.headShape = ['rect', 'rounded', 'capsule'].includes(p.headShape) ? p.headShape : 'rounded';
    if (p.integratedNight !== 'none') p.headExtend = Math.max(p.headExtend, p.nightWidth + 40);
    const mattressTop = p.legHeight + p.railHeight + p.mattressThickness - (['frame', 'upholsteredFrame', 'fourPoster'].includes(p.bedBase) ? Math.min(p.railHeight - 60, 120) : 0);
    p.headHeight = Math.max(p.headHeight, mattressTop + 150);
    p.headRadius = Math.min(p.headRadius, (p.headHeight - mattressTop) * 0.9);
    p.footHeight = p.footboard === 'low' ? clamp(p.footHeight, 150, mattressTop + 60) : clamp(p.footHeight, mattressTop + 100, p.headHeight - 150);
    p.postHeight = Math.max(p.postHeight, p.headHeight + 100);
  } else {
    const k = KINDS[p.kind];
    if (p.kind === 'nightstand') { p.columns = 1; if (p.caseLayout === 'split' || p.caseLayout === 'topSplit') p.caseLayout = 'stack'; p.rows = Math.min(p.rows, 3); p.mirror = 'none'; }
    if (p.kind === 'dresser' && p.caseLayout === 'niche') p.caseLayout = 'stack';
    if (p.caseLayout === 'split') p.columns = Math.max(2, p.columns);
    if (p.caseBase === 'wall' && p.kind !== 'nightstand') p.caseBase = 'plinth';
    if (p.caseBase === 'wall') p.baseHeight = 0;
    if (p.caseBase === 'legs' && ['hidden', 'sled'].includes(p.legType)) p.legType = 'roundTaper';
    if (p.caseBase === 'legs' && p.baseHeight < 60) p.baseHeight = 60;
    p.cornerRadius = Math.min(p.cornerRadius, p.depth / 2 - 2, p.width / 2 - 2);
    p.rows = Math.max(p.caseLayout === 'niche' ? 1 : 1, Math.min(p.rows, Math.floor((p.height - p.baseHeight - p.topThickness) / 110)));
    if (p.height > 1000 && p.mirror !== 'none') p.mirror = 'none';
    p.width = clamp(p.width, k.width[0] * 0.8, k.width[1] * 1.1);
  }
  return p;
}

// ---- Shapes -------------------------------------------------------------------------------------
/** Headboard outline in (x, y), y from 0 (bottom) to H; CCW. */
export function headOutline(shape, W, H, {r = 100, scallops = 3, base = 0} = {}) {
  const a = W / 2, pts = [];
  const rr = Math.min(r, a - 1, H - 1);
  const corner = (cx, cy, a0, a1, rad, n = 10) => { for (let k = 0; k <= n; k++) { const t = (a0 + (a1 - a0) * k / n) * Math.PI / 180; pts.push([cx + Math.cos(t) * rad, cy + Math.sin(t) * rad]); } };
  pts.push([-a, 0], [a, 0]);
  if (shape === 'rect' || shape === 'stepped') {
    const rs = Math.max(2, Math.min(rr, 8));
    if (shape === 'stepped') {
      // Centre stands taller than the shoulders (Art Deco step): shoulders at 82 % height.
      const hs = H * 0.82, c = a * 0.42;
      pts.push([a, hs - rs]); corner(a - rs, hs - rs, 0, 90, rs, 4); pts.push([c + rs, hs]); pts.push([c, hs]); pts.push([c, H - rs]); corner(c - rs, H - rs, 0, 90, rs, 4);
      pts.push([-c + rs, H]); corner(-c + rs, H - rs, 90, 180, rs, 4); pts.push([-c, hs]); pts.push([-a + rs, hs]); corner(-a + rs, hs - rs, 90, 180, rs, 4);
    } else { corner(a - rs, H - rs, 0, 90, rs, 4); corner(-a + rs, H - rs, 90, 180, rs, 4); }
  } else if (shape === 'rounded') { corner(a - rr, H - rr, 0, 90, rr); corner(-a + rr, H - rr, 90, 180, rr); }
  else if (shape === 'capsule') { const rc = Math.min(a, H * 0.5); corner(a - rc, H - rc, 0, 90, rc, 16); corner(-a + rc, H - rc, 90, 180, rc, 16); }
  else if (shape === 'arch') {
    // Segmental arch: shoulders at H − rise, crown at H.
    const rise = Math.min(Math.max(rr, a * 0.25), H * 0.6), R = (a * a + rise * rise) / (2 * rise), cy = H - R;
    const th = Math.asin(Math.min(1, a / R));
    for (let k = 0; k <= 32; k++) { const t = Math.PI / 2 - th + (2 * th) * k / 32; pts.push([Math.cos(t) * R, cy + Math.sin(t) * R]); }
  } else if (shape === 'scallop') {
    // n lobes ("deniz kabuğu"): circular bumps across the top.
    const n = Math.max(2, Math.round(scallops)), lw = W / n, dip = Math.min(lw * 0.32, H * 0.25);
    for (let i = n - 1; i >= 0; i--) {
      const cx = -a + lw * (i + 0.5);
      for (let k = 0; k <= 12; k++) { const t = k / 12 * Math.PI; pts.push([cx + Math.cos(t) * lw / 2, H - dip + Math.sin(t) * dip]); }
    }
  }
  // Drop duplicates and keep CCW.
  const out = []; for (const q of pts) { const l = out.at(-1); if (!l || Math.hypot(l[0] - q[0], l[1] - q[1]) > 0.5) out.push(q); }
  if (Math.hypot(out[0][0] - out.at(-1)[0], out[0][1] - out.at(-1)[1]) < 0.5) out.pop();
  return out.map(([x, y]) => [x, y + base]);
}
/** Clip a polygon to y0 ≤ y ≤ y1. */
function clipY(poly, y0, y1) { return clipX(poly.map(([x, y]) => [y, x]), y0, y1).map(([y, x]) => [x, y]); }
/** Outline top y at x (max y of polygon crossing). */
function topAt(poly, x) { let best = 0; for (let i = 0; i < poly.length; i++) { const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length]; if ((ax - x) * (bx - x) <= 0 && ax !== bx) best = Math.max(best, ay + (by - ay) * (x - ax) / (bx - ax)); } return best; }

const part = (id, role, mat, geom, pos, rot = [0, 0, 0], extra = {}) => ({id, role, mat, geom, pos, rot, ...extra});
const box = (id, role, mat, w, h, d, pos, extra = {}, r = 2) => part(id, role, mat, {fn: 'cushion', w, h, d, r: Math.min(r, w / 3, h / 3, d / 3)}, pos, [0, 0, 0], extra);
/** Vertical panel from an (x, y) outline: stands in the x–y plane, front face at z = zFront, thickness t towards −z.
 * The slab is built in (x, z) and extruded along y; a −90° turn about x maps outline z → world y and the extrusion → −z. */
const panel = (id, role, mat, outline, t, zFront, profile, extra = {}) => part(id, role, mat, {fn: 'slab', outline, t, profile: profile || ['square', t, 0]}, [0, 0, zFront], [-Math.PI / 2, 0, 0], extra);

function legFor(p, id, x, z, h, mat) {
  const s = p.legSize;
  if (p.legType === 'hidden' || h <= 1) return null;
  if (p.legType === 'block' || p.legType === 'square') return box(id, 'leg', mat, s, h, s, [x, h / 2, z], {}, p.legType === 'block' ? 6 : 2);
  const prof = p.legType === 'cone' ? legProfile('cone', h, s / 2) : p.legType === 'round' ? legProfile('cylinder', h, s / 2) : legProfile(p.legType === 'squareTaper' ? 'squareTaper' : 'tapered', h, s / 2, p.legTaper);
  return part(id, 'leg', mat, {fn: 'lathe', profile: prof, square: p.legType === 'squareTaper'}, [x, 0, z]);
}

// ---- Bed ----------------------------------------------------------------------------------------
function compileBed(p) {
  const parts = [], W0 = p.mattressWidth, L0 = p.mattressLength;
  const framed = ['frame', 'upholsteredFrame', 'fourPoster'].includes(p.bedBase);
  const railT = p.bedBase === 'upholsteredFrame' ? 90 : framed ? 40 : 0;
  const side = p.bedBase === 'platform' || p.bedBase === 'floating' ? p.border : framed ? railT + 10 : 0;
  const BW = W0 + 2 * side, BL = L0 + side + (framed ? railT + 10 : p.border > 0 && p.bedBase !== 'baza' ? p.border : 0);
  const zHead = -BL / 2, zFoot = BL / 2;
  const legH = p.legType === 'hidden' ? p.legHeight : p.legHeight;
  const railTop = legH + p.railHeight;
  const inset = framed ? Math.min(p.railHeight - 60, 120) : 0; // mattress sits this far down into a frame
  const deckTop = railTop - inset, mattressTop = deckTop + p.mattressThickness;
  const woodMat = p.bedBase === 'upholsteredFrame' || p.bedBase === 'baza' ? 'wood' : 'case';

  // Base ------------------------------------------------------------------------------------------
  if (p.bedBase === 'baza') {
    parts.push(part('baza', 'baza', 'fabric', {fn: 'cushion', w: BW, h: p.railHeight, d: BL, r: 14, crownTop: 0}, [0, legH + p.railHeight / 2, 0]));
    if (p.storage === 'lift') parts.push(box('lid-seam', 'seam', 'dark', BW + 1, 4, BL + 1, [0, railTop - 45, 0], {}, 1));
  } else if (p.bedBase === 'platform' || p.bedBase === 'floating') {
    const deck = topOutline('rounded', BL, BW, {r: 12});
    parts.push(part('platform', 'platform', 'case', {fn: 'slab', outline: deck.map(([x, z]) => [z, x]), t: p.railHeight, profile: ['eased', p.railHeight, 3]}, [0, legH, 0]));
    if (p.storage === 'drawers') for (const s of [-1, 1]) for (let i = 0; i < 2; i++) parts.push(box(`bed-drawer-${s}-${i}`, 'drawer-front', 'case', 2, p.railHeight - 30, L0 * 0.4, [s * (BW / 2 + 1), legH + p.railHeight / 2, -L0 * 0.22 + i * L0 * 0.44]));
    if (p.storage === 'lift') parts.push(box('lid-seam', 'seam', 'dark', BW + 1, 4, BL + 1, [0, railTop - 40, 0], {}, 1));
  } else {
    // Frame beds: side rails, foot rail, corner legs/posts, centre rail and slats (internal).
    const rm = p.bedBase === 'upholsteredFrame' ? 'fabric' : 'case', rr = p.bedBase === 'upholsteredFrame' ? 30 : 3;
    for (const s of [-1, 1]) parts.push(part(`rail-${s < 0 ? 'l' : 'r'}`, 'rail', rm, {fn: 'cushion', w: railT, h: p.railHeight, d: BL - (p.bedBase === 'upholsteredFrame' ? 0 : 0), r: rr, crownFront: 0}, [s * (BW / 2 - railT / 2), legH + p.railHeight / 2, 0]));
    parts.push(part('rail-foot', 'rail', rm, {fn: 'cushion', w: BW, h: p.railHeight, d: railT, r: rr}, [0, legH + p.railHeight / 2, zFoot - railT / 2]));
    parts.push(box('slat-deck', 'slat-deck', 'frame', W0, 25, L0, [0, deckTop - 12.5, zHead + railT / 2 + 5 + L0 / 2], {internal: true}, 2));
    parts.push(box('centre-rail', 'centre-rail', 'frame', 50, 70, L0, [0, deckTop - 60, zHead + L0 / 2], {internal: true}, 2));
    if (W0 >= 1400 && legH > 30) parts.push(box('centre-leg', 'centre-leg', 'dark', 40, deckTop - 95, 40, [0, (deckTop - 95) / 2, 0], {internal: true}));
    if (p.storage === 'drawers') for (const s of [-1, 1]) for (let i = 0; i < 2; i++) parts.push(box(`bed-drawer-${s}-${i}`, 'drawer-front', rm, 3, p.railHeight - 40, L0 * 0.4, [s * (BW / 2 + 1.5), legH + p.railHeight / 2, -L0 * 0.22 + i * L0 * 0.44]));
  }
  // Legs / plinth
  if (p.legType === 'hidden' && legH > 0) {
    const pi = p.bedBase === 'floating' ? Math.max(p.plinthInset, 150) : Math.min(p.plinthInset, 80);
    parts.push(box('plinth', 'plinth', 'dark', Math.max(200, BW - 2 * pi), legH, Math.max(400, BL - 2 * pi), [0, legH / 2, 0], {}, 1));
  } else if (p.legType === 'sled') {
    const ts = 25, xs = BW / 2 - 60;
    for (const s of [-1, 1]) {
      parts.push(box(`runner-${s}`, 'runner', 'metal', ts, ts, BL - 200, [s * xs, ts / 2, 0], {}, 3));
      for (const zz of [-1, 1]) parts.push(box(`post-${s}${zz}`, 'post', 'metal', ts, legH - ts + 1, ts, [s * xs, ts + (legH - ts) / 2, zz * (BL / 2 - 140)], {}, 3));
    }
  } else if (legH > 0) {
    const legs = [], li = framed ? p.legSize / 2 : Math.max(60, p.legSize);
    const lh = framed ? railTop : legH; // frame legs run up to the rail top (corner posts)
    const xs = BW / 2 - (framed ? p.legSize / 2 : li), zs = BL / 2 - (framed ? p.legSize / 2 : li);
    for (const [x, z] of [[xs, zs], [-xs, zs], [xs, -zs], [-xs, -zs]]) legs.push([x, z]);
    if (BW >= 1400 && !framed) legs.push([0, 0]);
    legs.forEach(([x, z], i) => { const q = legFor(p, `leg-${i + 1}`, x, z, lh, framed ? woodMat : 'wood'); if (q) parts.push(q); });
  }
  if (p.bedBase === 'fourPoster') {
    const s = p.postSize, xs = BW / 2 - s / 2, zs = BL / 2 - s / 2;
    for (const [x, z, k] of [[xs, zs, 1], [-xs, zs, 2], [xs, -zs, 3], [-xs, -zs, 4]]) parts.push(box(`post-${k}`, 'post', 'case', s, p.postHeight, s, [x, p.postHeight / 2, z]));
    if (p.postHeight >= 1800) {
      for (const sx of [-1, 1]) parts.push(box(`canopy-${sx}`, 'canopy-rail', 'case', s * 0.7, s * 0.7, BL - s, [sx * xs, p.postHeight - s * 0.35, 0]));
      for (const sz of [-1, 1]) parts.push(box(`canopy-e${sz}`, 'canopy-rail', 'case', BW - s, s * 0.7, s * 0.7, [0, p.postHeight - s * 0.35, sz * zs]));
    }
  }

  // Headboard ---------------------------------------------------------------------------------------
  const HW = (p.bedBase === 'fourPoster' ? BW - 2 * p.postSize : BW) + 2 * p.headExtend;
  const hb0 = p.bedBase === 'floating' ? legH : 0, HH = p.headHeight - hb0, ht = p.headThickness;
  const outline = headOutline(p.headShape, HW, HH, {r: p.headRadius, scallops: p.scallops, base: hb0});
  const zF = zHead; // front face of the headboard touches the base
  const soft = ['bullnose', ht, 0], fab = 'fabric';
  const headBack = () => panel('head-back', 'head-back', 'case', outline, 18, zF - ht + 18, ['square', 18, 0], {internal: true});
  switch (p.headType) {
    case 'upholstered': parts.push(panel('head', 'headboard', fab, outline, ht, zF, soft)); break;
    case 'panel': parts.push(panel('head', 'headboard', 'case', outline, Math.min(ht, 50), zF, ['eased', Math.min(ht, 50), 3])); break;
    case 'boiserie': {
      // Wall-width panel with vertical joints; the bed and bedside units read as one composition.
      const t = Math.min(ht, 40);
      parts.push(panel('head', 'headboard', 'case', outline, t, zF, ['eased', t, 2]));
      const n = Math.max(3, Math.round(HW / 420));
      for (let i = 1; i < n; i++) { const x = -HW / 2 + HW * i / n; parts.push(box(`joint-${i}`, 'seam', 'dark', 4, topAt(outline, x) - hb0 - 4, 2, [x, hb0 + (topAt(outline, x) - hb0) / 2, zF + 0.5], {}, 0.5)); }
      break;
    }
    case 'channel': case 'hChannel': {
      parts.push(headBack());
      const n = Math.max(2, Math.round(p.channelCount)), t = ht - 18;
      for (let i = 0; i < n; i++) {
        const piece = p.headType === 'channel' ? clipX(outline, -HW / 2 + HW * i / n + 0.6, -HW / 2 + HW * (i + 1) / n - 0.6)
          : clipY(outline, hb0 + HH * i / n + 0.6, hb0 + HH * (i + 1) / n - 0.6);
        if (piece.length >= 3) parts.push(panel(`channel-${i + 1}`, 'head-channel', fab, piece, t, zF, ['bullnose', t, 0]));
      }
      break;
    }
    case 'panels': {
      parts.push(headBack());
      const cols = Math.max(2, Math.round(HW / 520)), rows = Math.max(2, Math.round(HH / 480)), t = ht - 18;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const piece = clipY(clipX(outline, -HW / 2 + HW * i / cols + 1, -HW / 2 + HW * (i + 1) / cols - 1), hb0 + HH * j / rows + 1, hb0 + HH * (j + 1) / rows - 1);
        if (piece.length >= 3) parts.push(panel(`pad-${i + 1}-${j + 1}`, 'head-pad', fab, piece, t, zF, ['bullnose', t, 0]));
      }
      break;
    }
    case 'tufted': {
      // Capitonné face: diamond tufts with pleats, buttons; rectangle or rounded outline only.
      const g = {fn: 'cushion', w: HW, h: HH, d: ht, r: p.headShape === 'rounded' ? Math.min(p.headRadius, ht * 0.5) : 12, crownFront: 6};
      const step = p.tuftSpacing, tufts = [], pleats = [];
      for (let y = -HH / 2 + step * 0.9, row = 0; y < HH / 2 - step * 0.5; y += step * 0.75, row++)
        for (let x = -HW / 2 + step * (row % 2 ? 1 : 0.5); x < HW / 2 - step * 0.4; x += step) tufts.push({x, y});
      for (const a of tufts) for (const b of tufts) if (b !== a && Math.abs(b.y - a.y - step * 0.75) < 1 && Math.abs(Math.abs(b.x - a.x) - step / 2) < 1) pleats.push([a, b]);
      Object.assign(g, {tufts, pleats, tuftDepth: Math.min(22, ht * 0.25)});
      parts.push(part('head', 'headboard', fab, g, [0, hb0 + HH / 2, zF - ht / 2]));
      const pts = tufts.map(q => [q.x, hb0 + HH / 2 + q.y, zF - Math.min(22, ht * 0.25) * 0.9]);
      parts.push(part('buttons', 'tuft-button', fab, {fn: 'buttons', points: pts, r: 8}, [0, 0, 0], [0, 0, 0], {qty: pts.length}));
      break;
    }
    case 'framed': case 'cane': {
      // Solid frame with an upholstered (framed) or Vienna-cane (cane) infill.
      const fw = p.frameWidth, t = Math.min(ht, 45);
      parts.push(panel('head-frame', 'head-frame', 'wood', outline, t, zF, ['eased', t, 3]));
      // Infill: the same shape drawn smaller (offsetting concave outlines such as steps or scallops would self-cross).
      const inner = headOutline(p.headShape, HW - 2 * fw, HH - 2 * fw, {r: Math.max(4, p.headRadius - fw), scallops: p.scallops, base: hb0 + fw});
      if (p.headType === 'framed') parts.push(panel('head-infill', 'head-infill', fab, inner, 55, zF + 35, ['bullnose', 55, 0]));
      else parts.push(panel('head-cane', 'cane', 'cane', inner, 4, zF + 1, ['square', 4, 0]));
      break;
    }
    case 'wingback': {
      parts.push(panel('head', 'headboard', fab, outline, ht, zF, soft));
      const wh = topAt(outline, HW / 2 - ht / 2) - hb0;
      for (const s of [-1, 1]) parts.push(part(`wing-${s}`, 'head-wing', fab, {fn: 'cushion', w: ht * 0.8, h: Math.max(200, wh * 0.92), d: p.wingDepth, r: Math.min(30, ht * 0.35), crownFront: 4}, [s * (HW / 2 - ht * 0.4), hb0 + Math.max(200, wh * 0.92) / 2, zF + p.wingDepth / 2]));
      break;
    }
    case 'split': {
      // Hanging cushions on a rail in front of a timber back.
      parts.push(panel('head-back', 'headboard', 'case', outline, 25, zF - 90, ['eased', 25, 2]));
      const n = W0 >= 1350 ? 2 : 1, gap = 20, cw = (Math.min(HW, BW) - gap * (n + 1)) / n, ch = clamp(HH * 0.42, 380, 620), yRail = hb0 + HH - 110;
      parts.push(part('rail', 'head-rail', 'metal', {fn: 'tube', points: [[-Math.min(HW, BW) / 2 + 30, yRail, zF - 72], [Math.min(HW, BW) / 2 - 30, yRail, zF - 72]], r: 12}, [0, 0, 0]));
      for (let i = 0; i < n; i++) {
        const x = -Math.min(HW, BW) / 2 + gap + cw / 2 + i * (cw + gap);
        parts.push(part(`pillow-${i + 1}`, 'head-cushion', fab, {fn: 'cushion', w: cw, h: ch, d: 120, r: 45, crownFront: 18}, [x, yRail - ch / 2 - 25, zF - 30], [-0.06, 0, 0]));
        for (const s of [-1, 1]) parts.push(box(`strap-${i}-${s}`, 'strap', 'leather', 40, 90, 4, [x + s * cw * 0.3, yRail - 15, zF - 52], {}, 1));
      }
      break;
    }
    case 'slats': {
      // Vertical slats on two rails; slats follow the outline.
      const sw = p.slatWidth, g = p.slatGap, n = Math.max(3, Math.floor((HW + g) / (sw + g))), x0 = -(n * sw + (n - 1) * g) / 2;
      for (const yy of [hb0 + HH * 0.18, hb0 + Math.min(HH * 0.78, topAt(outline, 0) - hb0 - 120)]) parts.push(box(`slat-rail-${Math.round(yy)}`, 'head-rail', 'wood', HW - 40, 60, 22, [0, yy, zF - 30 - 11]));
      for (let i = 0; i < n; i++) { const piece = clipX(outline, x0 + i * (sw + g), x0 + i * (sw + g) + sw); if (piece.length >= 3) parts.push(panel(`slat-${i + 1}`, 'head-slat', 'wood', piece, 28, zF, ['eased', 28, 2])); }
      break;
    }
  }
  // Integrated bedside units on a wide headboard.
  if (p.integratedNight !== 'none') {
    const nw = p.nightWidth, nd = 380, y = mattressTop - 20;
    for (const s of [-1, 1]) {
      const x = s * (BW / 2 + 30 + nw / 2);
      if (p.integratedNight === 'shelf') parts.push(box(`night-${s}`, 'night-shelf', 'case', nw, 30, nd, [x, y - 15, zF + nd / 2], {}, 3));
      else { parts.push(box(`night-${s}`, 'night-box', 'case', nw, 160, nd, [x, y - 80, zF + nd / 2], {}, 4)); parts.push(box(`night-gap-${s}`, 'seam', 'dark', nw - 20, 3, 1, [x, y - 30, zF + nd + 0.5], {}, 0.5)); }
    }
  }
  // Footboard
  if (p.footboard !== 'none') {
    const fh = p.footHeight, fo = headOutline(p.headShape === 'scallop' || p.headShape === 'stepped' ? 'rounded' : p.headShape, BW, fh, {r: Math.min(p.headRadius, fh * 0.4), base: 0});
    const fm = UPHOLSTERED_HEADS.includes(p.headType) ? 'fabric' : 'case', ft = fm === 'fabric' ? Math.min(ht, 90) : 40;
    parts.push(panel('foot', 'footboard', fm, fo, ft, zFoot + ft, fm === 'fabric' ? ['bullnose', ft, 0] : ['eased', ft, 3]));
  }
  // Mattress and bedding (shown, not part of the furniture order).
  const mz = framed ? zHead + railT + 10 + L0 / 2 : zHead + (p.bedBase === 'baza' ? 0 : 0) + L0 / 2 + (p.bedBase === 'baza' ? 0 : 0);
  parts.push(part('mattress', 'mattress', 'mattress', {fn: 'cushion', w: W0 - 10, h: p.mattressThickness, d: L0 - 10, r: 45, crownTop: 6}, [0, deckTop + p.mattressThickness / 2, mz], [0, 0, 0], {decor: 'mattress'}));
  if (p.bedding === 'made') {
    const duvetL = L0 * 0.74, dz = mz + L0 / 2 - duvetL / 2 + 40, top = mattressTop;
    parts.push(part('duvet', 'duvet', 'linen', {fn: 'cushion', w: W0 + 70, h: 70, d: duvetL, r: 30, crownTop: 18}, [0, top + 28, dz], [0, 0, 0], {decor: 'bedding'}));
    for (const s of [-1, 1]) parts.push(part(`duvet-drop-${s}`, 'duvet', 'linen', {fn: 'cushion', w: 30, h: Math.min(260, p.mattressThickness + 60), d: duvetL - 10, r: 12}, [s * (W0 / 2 + 22), top - Math.min(260, p.mattressThickness + 60) / 2 + 40, dz], [0, 0, s * 0.03], {decor: 'bedding'}));
    const n = W0 >= 1200 ? 2 : 1, pw = Math.min(650, (W0 - 60) / n);
    for (let i = 0; i < n; i++) parts.push(part(`pillow-${i + 1}`, 'pillow', 'linen', {fn: 'cushion', w: pw - 20, h: 150, d: 420, r: 60, crownTop: 30}, [-(n - 1) * pw / 2 + i * pw, top + 70, mz - L0 / 2 + 260], [-0.35, 0, 0], {decor: 'bedding'}));
    parts.push(part('throw', 'throw', 'fabric', {fn: 'cushion', w: W0 + 90, h: 26, d: 420, r: 10}, [0, top + 76, mz + L0 / 2 - 330], [0, 0, 0], {decor: 'bedding'}));
  }
  const overallH = Math.max(p.headHeight, p.bedBase === 'fourPoster' ? p.postHeight : 0);
  const meta = {kind: 'bed', overall: {width: Math.round(Math.max(HW, BW, p.integratedNight !== 'none' ? BW + 2 * (30 + p.nightWidth) : 0)), depth: Math.round(BL + ht + (p.footboard !== 'none' ? (UPHOLSTERED_HEADS.includes(p.headType) ? Math.min(ht, 90) : 40) : 0)), height: Math.round(overallH)},
    mattress: `${W0 / 10}×${L0 / 10}`, mattressTop: Math.round(mattressTop), headAbove: Math.round(p.headHeight - mattressTop), baseWidth: Math.round(BW), baseLength: Math.round(BL), under: legH, deckTop: Math.round(deckTop)};
  return {parts, meta, dims: bedDims(p, meta, zHead - ht)};
}

function bedDims(p, m, zBack) {
  const W = m.overall.width, H = m.overall.height, BL = m.baseLength, out = [];
  out.push({view: 'front', a: [-W / 2, 0], b: [W / 2, 0], off: 70, text: `${W}`, orient: 'h'});
  out.push({view: 'front', a: [W / 2, 0], b: [W / 2, p.headHeight], off: 80, text: `${p.headHeight}`, orient: 'v'});
  out.push({view: 'front', a: [-W / 2, 0], b: [-W / 2, m.mattressTop], off: -80, text: `${m.mattressTop}`, label: 'mattressTop', orient: 'v'});
  out.push({view: 'side', a: [zBack, 0], b: [zBack + m.overall.depth, 0], off: 70, text: `${m.overall.depth}`, orient: 'h'});
  out.push({view: 'top', a: [-m.baseWidth / 2, -BL / 2], b: [m.baseWidth / 2, -BL / 2], off: -60, text: `${m.baseWidth}`, orient: 'h'});
  out.push({view: 'section', a: [-BL / 2, 0], b: [-BL / 2, p.headHeight], off: -120, text: `${p.headHeight}`, orient: 'v'});
  return out;
}

// ---- Case pieces (nightstand, dresser) -----------------------------------------------------------
function compileCase(p) {
  const parts = [], W = p.width, D = p.depth, H = p.height, T = p.topThickness, fr = 18;
  const wall = p.caseBase === 'wall';
  const yb = wall ? Math.max(0, H - Math.max(200, H * 0.45)) : p.caseBase === 'legs' || p.caseBase === 'sled' ? p.baseHeight : p.baseHeight;
  const bodyTop = H - T, bodyH = bodyTop - yb;
  const r = p.cornerRadius, bodyD = D - fr - 1;
  // Body (rounded corners in plan when cornerRadius > 0).
  const plan = topOutline(r > 4 ? 'rounded' : 'rect', W, bodyD, {r: Math.max(2, r)});
  parts.push(part('carcass', 'carcass', 'case', {fn: 'slab', outline: plan, t: bodyH, profile: ['square', bodyH, 0]}, [0, yb, -(fr + 1) / 2]));
  // Top
  if (T > 0) {
    const tp = topOutline(r > 4 ? 'rounded' : 'rect', W + 2 * p.topOverhang, D + p.topOverhang, {r: Math.max(2, r + p.topOverhang * 0.6)});
    parts.push(part('top', 'case-top', 'case', {fn: 'slab', outline: tp, t: T, profile: [p.caseEdge === 'chamfer' ? 'chamfer' : p.caseEdge, T, Math.min(8, T * 0.4)]}, [0, bodyTop, p.topOverhang / 2]));
  }
  // Base
  if (p.caseBase === 'plinth' || p.caseBase === 'recessed') {
    const inset = p.caseBase === 'recessed' ? 40 : 0;
    parts.push(box('plinth', 'plinth', p.caseBase === 'recessed' ? 'dark' : 'case', W - 2 * inset - (r > 4 ? r : 0), yb + 1, D - 2 * inset - 10, [0, (yb + 1) / 2, -inset / 2], {}, 1));
  } else if (p.caseBase === 'legs' && yb > 0) {
    const xs = W / 2 - Math.max(p.legSize, r * 0.6) - 10, zs = D / 2 - p.legSize - 20;
    [[xs, zs], [-xs, zs], [xs, -zs], [-xs, -zs]].forEach(([x, z], i) => { const q = legFor(p, `leg-${i + 1}`, x, z, yb + 1, 'wood'); if (q) parts.push(q); });
  } else if (p.caseBase === 'sled' && yb > 0) {
    const ts = 18, xs = W / 2 - 50;
    for (const s of [-1, 1]) {
      parts.push(box(`runner-${s}`, 'runner', 'metal', ts, ts, D - 60, [s * xs, ts / 2, 0], {}, 3));
      for (const zz of [-1, 1]) parts.push(box(`post-${s}${zz}`, 'post', 'metal', ts, yb - ts + 1, ts, [s * xs, ts + (yb - ts) / 2, zz * (D / 2 - 70)], {}, 3));
    }
  } else if (wall) parts.push(box('wall-cleat', 'wall-cleat', 'frame', W - 80, 60, 18, [0, bodyTop - 60, -D / 2 + 9], {internal: true}));
  // Fronts
  const flatW = W - 2 * Math.max(r, 0) - (r > 4 ? 0 : 0), fx0 = -flatW / 2, zFace = D / 2 - fr / 2;
  const gap = 3, rowsAvail = bodyH - 2 * gap;
  const n = Math.max(1, Math.round(p.rows)), niche = p.caseLayout === 'niche';
  // Graduated heights (bottom-heavy): weights 1 + g·(n−1−i)·0.35 (research: graduated drawers, ~10 % per step).
  const slots = niche ? n + 1 : n;
  const weights = Array.from({length: slots}, (_, i) => 1 + p.graduation * (slots - 1 - i) * 0.35);
  const sum = weights.reduce((s, v) => s + v, 0);
  let y = yb + gap; const rows = [];
  for (let i = 0; i < slots; i++) { const h = rowsAvail * weights[i] / sum; rows.push([y, h - gap]); y += h; }
  const nicheRow = niche ? slots - 1 : -1; // open niche at the top for nightstands
  const drawers = [];
  rows.forEach(([y0, h], i) => {
    if (i === nicheRow) {
      // Open niche: the dark opening sits in the front plane, its floor lip slightly proud.
      parts.push(box('niche', 'niche', 'shadow', flatW - 30, h - 6, 2, [0, y0 + h / 2, zFace - fr / 2 + 1]));
      parts.push(box('niche-shelf', 'niche-floor', 'case', flatW - 30, 14, 30, [0, y0 + 7, zFace - fr / 2 + 2]));
      return;
    }
    const cols = p.caseLayout === 'split' ? Math.max(2, p.columns) : p.caseLayout === 'topSplit' && i === slots - 1 ? Math.max(2, p.columns) : 1;
    // 2:3:2 rhythm for a three-way top row.
    const ratios = cols === 3 ? [2, 3, 2] : Array(cols).fill(1), rs = ratios.reduce((s, v) => s + v, 0);
    let x = fx0;
    ratios.forEach((k, j) => { const w = flatW * k / rs; drawers.push({x: x + w / 2, y: y0 + h / 2, w: w - gap, h, id: `${i + 1}-${j + 1}`}); x += w; });
  });
  for (const d of drawers) {
    const style = p.frontStyle;
    if (style === 'fluted') {
      parts.push(box(`front-${d.id}`, 'drawer-front', 'case', d.w, d.h, fr - 6, [d.x, d.y, zFace - 3]));
      parts.push(part(`reeds-${d.id}`, 'reeds', 'case', {fn: 'ribbed', w: d.w - 2, h: d.h - 2, pitch: p.fluteWidth, depth: 6}, [d.x, d.y, zFace + fr / 2 - 6]));
    } else if (style === 'cane') {
      parts.push(box(`front-${d.id}`, 'drawer-front', 'case', d.w, d.h, fr, [d.x, d.y, zFace]));
      parts.push(box(`cane-${d.id}`, 'cane', 'cane', d.w - 70, d.h - 60, 2, [d.x, d.y, zFace + fr / 2 + 0.6], {}, 0.5));
    } else if (style === 'framed') {
      parts.push(box(`front-${d.id}`, 'drawer-front', 'case', d.w, d.h, fr, [d.x, d.y, zFace]));
      const m = Math.min(55, d.h * 0.22);
      parts.push(box(`panel-${d.id}`, 'front-panel', 'case', d.w - 2 * m, d.h - 2 * m, 4, [d.x, d.y, zFace + fr / 2 + 1], {}, 1));
    } else if (style === 'grooved') {
      parts.push(box(`front-${d.id}`, 'drawer-front', 'case', d.w, d.h, fr, [d.x, d.y, zFace]));
      for (let k = 1; k < Math.max(2, Math.round(d.h / 45)); k++) parts.push(box(`groove-${d.id}-${k}`, 'seam', 'dark', d.w - 1, 3, 1, [d.x, d.y - d.h / 2 + k * d.h / Math.max(2, Math.round(d.h / 45)), zFace + fr / 2 + 0.2], {}, 0.4));
    } else parts.push(box(`front-${d.id}`, 'drawer-front', 'case', d.w, d.h, fr, [d.x, d.y, zFace]));
    parts.push(box(`box-${d.id}`, 'drawer-box', 'frame', d.w - 30, Math.max(60, d.h - 40), D - fr - 40, [d.x, d.y - 8, zFace - fr / 2 - (D - fr - 40) / 2], {internal: true}));
    const zp = zFace + fr / 2 + (style === 'fluted' ? 6 : 0);
    if (p.pull === 'knob') for (const off of d.w > 700 ? [-d.w / 4, d.w / 4] : [0]) parts.push(part(`knob-${d.id}-${off}`, 'pull', 'metal', {fn: 'lathe', profile: [[0, 6], [14, 6], [17, 14], [26, 15], [28, 10]]}, [d.x + off, d.y, zp], [Math.PI / 2, 0, 0]));
    if (p.pull === 'ring') parts.push(part(`ring-${d.id}`, 'pull', 'metal', {fn: 'lathe', profile: [[0, 8], [6, 8], [8, 20], [11, 20], [11, 4], [4, 4]]}, [d.x, d.y, zp], [Math.PI / 2, 0, 0]));
    if (p.pull === 'bar') { const bw = Math.min(320, d.w * 0.4); parts.push(part(`bar-${d.id}`, 'pull', 'metal', {fn: 'tube', points: [[d.x - bw / 2, d.y + d.h * 0.18, zp], [d.x - bw / 2, d.y + d.h * 0.18, zp + 28], [d.x + bw / 2, d.y + d.h * 0.18, zp + 28], [d.x + bw / 2, d.y + d.h * 0.18, zp]], r: 6}, [0, 0, 0])); }
    if (p.pull === 'leather') parts.push(box(`tab-${d.id}`, 'pull', 'leather', 36, 70, 5, [d.x, d.y + d.h / 2 - 30, zp + 2.5], {}, 1));
    if (p.pull === 'edge') parts.push(box(`edge-${d.id}`, 'pull', 'dark', Math.min(d.w * 0.5, 260), 10, 2, [d.x, d.y + d.h / 2 - 6, zp + 0.5], {}, 1));
  }
  // Mirror (dresser): stands on the top against the wall.
  if (p.kind === 'dresser' && p.mirror !== 'none') {
    const mw = W * p.mirrorWidth, mh = p.mirrorHeight, shape = {rect: 'rect', arch: 'arch', round: 'capsule', capsule: 'capsule'}[p.mirror];
    const ow = p.mirror === 'round' ? Math.min(mw, mh) : mw, oh = p.mirror === 'round' ? ow : mh;
    const outline = headOutline(shape, ow, oh, {r: p.mirror === 'arch' ? ow * 0.5 : 20, base: H});
    parts.push(panel('mirror-frame', 'mirror-frame', 'case', outline, 25, -D / 2 + 60, ['eased', 25, 3]));
    parts.push(panel('mirror-glass', 'mirror', 'mirror', headOutline(shape, ow - 56, oh - 56, {r: p.mirror === 'arch' ? (ow - 56) * 0.5 : 8, base: H + 28}), 5, -D / 2 + 62, ['square', 5, 0]));
  }
  const meta = {kind: p.kind, overall: {width: Math.round(W + 2 * p.topOverhang), depth: Math.round(D + p.topOverhang), height: Math.round(p.kind === 'dresser' && p.mirror !== 'none' ? H + p.mirrorHeight : H)}, drawers: drawers.length, bodyHeight: Math.round(bodyH), smallestFront: Math.round(Math.min(...drawers.map(d => d.h), 9999)), deepest: Math.round(D - fr - 40)};
  return {parts, meta, dims: caseDims(p, meta)};
}

function caseDims(p, m) {
  const W = m.overall.width, H = p.height, D = m.overall.depth, out = [];
  out.push({view: 'front', a: [-W / 2, 0], b: [W / 2, 0], off: 70, text: `${W}`, orient: 'h'});
  out.push({view: 'front', a: [W / 2, 0], b: [W / 2, H], off: 80, text: `${H}`, orient: 'v'});
  if (m.overall.height > H) out.push({view: 'front', a: [-W / 2, 0], b: [-W / 2, m.overall.height], off: -80, text: `${m.overall.height}`, orient: 'v'});
  out.push({view: 'side', a: [-p.depth / 2, 0], b: [-p.depth / 2 + D, 0], off: 70, text: `${D}`, orient: 'h'});
  out.push({view: 'top', a: [-W / 2, -D / 2], b: [W / 2, -D / 2], off: -60, text: `${W}`, orient: 'h'});
  out.push({view: 'section', a: [-D / 2, 0], b: [-D / 2, H], off: -120, text: `${H}`, orient: 'v'});
  return out;
}

export function compile(raw) {
  const p = normalize(raw);
  const c = p.kind === 'bed' ? compileBed(p) : compileCase(p);
  return {family: FAMILY, params: p, parts: c.parts, meta: c.meta, dims: c.dims, sectionX: 0, detail: p.kind === 'bed' ? null : (p.topThickness > 0 ? {kind: 'edge', title: 'edge', T: p.topThickness, profile: [p.caseEdge, p.topThickness, Math.min(8, p.topThickness * 0.4)]} : null)};
}

// ---- Weight, checks, parts list ----------------------------------------------------------------
export function meshVolume(m) {
  let v = 0; const p = m.positions, idx = m.indices;
  for (let t = 0; t < idx.length; t += 3) {
    const i = idx[t] * 3, j = idx[t + 1] * 3, k = idx[t + 2] * 3;
    v += (p[i] * (p[j + 1] * p[k + 2] - p[j + 2] * p[k + 1]) - p[i + 1] * (p[j] * p[k + 2] - p[j + 2] * p[k]) + p[i + 2] * (p[j] * p[k + 1] - p[j + 1] * p[k])) / 6;
  }
  return Math.abs(v);
}
// Share of a part's envelope that is material (boxes and bases are hollow constructions).
const HOLLOW = {carcass: 0.12, baza: 0.22, platform: 0.15, plinth: 0.1, 'drawer-box': 0.12, 'slat-deck': 0.3, 'night-box': 0.2, 'centre-rail': 0.3, headboard: 0.8, 'head-pad': 0.8, 'head-channel': 0.8};
export function weights(compiled, materials, buildMesh) {
  const caseD = materials.case?.surface === 'wood' ? (WOODS[materials.case.species]?.density || 700) : 750;
  // Upholstered bodies are ply/MDF frames with foam: ~230 kg/m³ overall; carcasses are hollow (≈ 35 % solid).
  const dens = {fabric: 150, case: caseD, wood: WOODS[materials.wood?.species]?.density || 700, metal: 7850 * 0.18, frame: 600, dark: 650, cane: 300, mirror: 2500, leather: 900, shadow: 0};
  let total = 0;
  for (const q of compiled.parts) {
    if (q.decor || ['fluted', 'reeds'].includes(q.role)) continue;
    let kg = meshVolume(buildMesh(q)) / 1e9 * (dens[q.mat] ?? 600);
    kg *= HOLLOW[q.role] ?? 1;
    total += kg;
  }
  return +total.toFixed(1);
}

export function validate(design, materials = null, buildMesh = null) {
  const {params: p, meta: m} = design, issues = [], add = (level, code, value) => issues.push({level, code, value});
  if (p.kind === 'bed') {
    if (m.mattressTop < 400) add('warn', 'bedLow', m.mattressTop); else if (m.mattressTop > 650) add('warn', 'bedHigh', m.mattressTop);
    if (m.headAbove < 250) add('warn', 'headLow', m.headAbove);
    if (p.mattressWidth >= 1400) add('info', 'centreSupport', p.mattressWidth);
    if (m.under >= 90 && p.legType !== 'hidden') add('info', 'underClear', m.under);
    if (p.storage === 'lift') add('info', 'liftStorage', 0);
    if (p.headExtend > 0 || p.headHeight > 1400) add('info', 'wallFixHead', p.headHeight);
  } else {
    if (m.smallestFront < 95) add('warn', 'drawerLow', m.smallestFront);
    if (p.kind === 'dresser' || p.height > 700) add('warn', 'antiTip', p.height);
    if (p.kind === 'nightstand' && (p.height < 450 || p.height > 680)) add('warn', 'nightHeight', p.height);
    if (p.caseBase === 'wall') add('info', 'wallHung', 0);
  }
  if (materials && buildMesh) { const kg = weights(design, materials, buildMesh); if (kg > (p.kind === 'bed' ? 160 : 120)) add('warn', 'heavy', kg); }
  return issues;
}

const ROLE = {
  baza: ['Baza gövdesi', 'Box base', '18 mm kontrplak/MDF kasa, 30 mm sünger, kumaş kaplama; 4 köşe taşıyıcı', '18 mm ply/MDF box, 30 mm foam, fabric cover; four corner supports'],
  platform: ['Platform', 'Platform base', 'Kasa + kapak, kenar profilli; çıtalı taban', 'Box with profiled edges; slatted deck'],
  rail: ['Kasa kayıtı', 'Bed rail', 'Masif / kontrplak; köşe bağlantısı çelik karyola köşebendi', 'Solid / ply; steel bed-rail fittings at the corners'],
  'slat-deck': ['Çıtalı taban (iç)', 'Slatted deck (internal)', 'Kayın lamel 68×8 mm, aralık ≤ 60 mm, kauçuk yuvalar', 'Beech slats 68×8 mm, gaps ≤ 60 mm, rubber sockets'],
  'centre-rail': ['Orta kayıt (iç)', 'Centre rail (internal)', 'Çelik profil 40×20; ayar ayağı', 'Steel 40×20; adjustable leg'], 'centre-leg': ['Orta ayak (iç)', 'Centre leg (internal)', 'Ayarlı', 'Adjustable'],
  leg: ['Ayak', 'Leg', 'Masif gürgen, renk ayrı tonla; M8 dişli pim', 'Solid beech, separate stain; M8 insert'], plinth: ['Gizli baza / süpürgelik', 'Plinth', 'Siyah mat, geri çekik', 'Black matt, recessed'],
  runner: ['Kızak', 'Runner', 'Çelik profil, toz boya', 'Steel section, powder coat'], post: ['Dikme', 'Post', 'Masif / çelik', 'Solid / steel'], 'canopy-rail': ['Cibinlik kayıtı', 'Canopy rail', 'Masif, dikmeye pim', 'Solid, pinned to posts'],
  headboard: ['Yatak başlığı', 'Headboard', 'Kontrplak gövde, 30–50 mm sünger, elyaf, kumaş; duvara/karyolaya bağlantı', 'Ply core, 30–50 mm foam, wadding, fabric; fixed to wall/bed'],
  'head-back': ['Başlık arkalığı', 'Headboard back', '18 mm kontrplak', '18 mm ply'], 'head-channel': ['Başlık kanalı', 'Headboard channel', 'Dikişli kanal, 40 mm sünger', 'Stitched channel, 40 mm foam'],
  'head-pad': ['Başlık paneli (döşemeli)', 'Headboard pad', 'Ayrı döşenmiş panel, arka plakaya cırt/vida', 'Separately upholstered pad, hook-and-loop/screws to back'],
  'tuft-button': ['Kapitone düğmesi', 'Tufting button', 'Kumaş kaplı Ø16 mm', 'Fabric-covered Ø16 mm'], 'head-frame': ['Başlık çerçevesi', 'Headboard frame', 'Masif, köşeler kavela/domino', 'Solid, dowel/domino corners'],
  'head-infill': ['Başlık dolgusu (döşemeli)', 'Headboard infill', 'Döşemeli panel, çerçeveye vida', 'Upholstered panel screwed into the frame'], cane: ['Hasır (Viyana örgüsü)', 'Vienna cane', 'Rattan örgü, kanala kama ile', 'Rattan mesh, splined into a groove'],
  'head-wing': ['Başlık kanadı', 'Headboard wing', 'Kontrplak + sünger, gövdeye cıvata', 'Ply + foam, bolted to the board'], 'head-rail': ['Başlık rayı', 'Headboard rail', 'Masif / metal boru', 'Solid / metal tube'],
  'head-cushion': ['Asma yastık', 'Hanging cushion', 'Elyaf + sünger, deri kayışlı', 'Fibre + foam, leather straps'], strap: ['Kayış', 'Strap', 'Deri', 'Leather'], 'head-slat': ['Başlık çıtası', 'Headboard slat', 'Masif, raylara vida', 'Solid, screwed to rails'],
  footboard: ['Ayak tahtası', 'Footboard', 'Başlıkla aynı yapım', 'Built like the headboard'], 'night-shelf': ['Asma komodin rafı', 'Floating bedside shelf', 'Başlığa gizli konsol', 'Concealed brackets to the headboard'], 'night-box': ['Asma komodin', 'Floating bedside drawer', 'Başlığa gizli konsol, tam çekilir ray', 'Concealed brackets, full-extension runners'],
  seam: ['Derz / dikiş çizgisi', 'Reveal line', '—', '—'], carcass: ['Gövde', 'Carcass', '18 mm MDF / kontrplak, arka 8 mm; köşeler kavela + eksantrik', '18 mm MDF/ply, 8 mm back; dowels + cam fittings'],
  'case-top': ['Üst tabla', 'Top', 'Gövdeye vida, kenar profilli', 'Screwed to the carcass, profiled edge'], 'drawer-front': ['Çekmece önü', 'Drawer front', '18 mm, 3 mm derz', '18 mm, 3 mm reveal'], 'drawer-box': ['Çekmece kutusu (iç)', 'Drawer box (internal)', '12 mm huş kontrplak, tam çekilir frenli ray', '12 mm birch ply, soft-close full-extension runners'],
  reeds: ['Çıtalı (oluklu) yüzey', 'Reeded face', 'CNC frezeli MDF veya masif çıta', 'CNC-milled MDF or solid reeds'], 'front-panel': ['Ön panel bordürü', 'Front panel', 'Uygulama panel', 'Applied panel'],
  pull: ['Kulp', 'Pull', 'Metal / deri', 'Metal / leather'], niche: ['Açık bölme', 'Open niche', 'Gövde içi', 'Inside the carcass'], 'niche-floor': ['Bölme tabanı', 'Niche floor', '—', '—'],
  'mirror-frame': ['Ayna çerçevesi', 'Mirror frame', 'Masif / MDF, duvara güvenlik bağlantısı', 'Solid / MDF, safety-fixed to the wall'], mirror: ['Ayna', 'Mirror', '5 mm, arkası güvenlik filmli', '5 mm, safety-backed'],
  'wall-cleat': ['Duvar askı kayıtı', 'Wall cleat', 'Fransız askı + dübel', 'French cleat + anchors']
};

/** Grouped parts list with sizes, materials and suggested build (TR/EN). */
export function bedroomBom(compiled, materials, lang, buildMesh, materialText) {
  const rows = [], groups = new Map(), tr = lang === 'tr';
  let fabricArea = 0;
  for (const q of compiled.parts) {
    if (q.decor) continue;
    const m = buildMesh(q), b = bounds(transformPositions(m.positions, [0, 0, 0], q.rot)), size = b.size.map(v => Math.round(v)).sort((a, c) => c - a);
    if (q.mat === 'fabric') fabricArea += meshArea(m) * (['baza', 'rail'].includes(q.role) ? 0.75 : 1);
    const key = `${q.role}|${q.mat}|${size.join('x')}`, g = groups.get(key) || {role: q.role, mat: q.mat, size, qty: 0, internal: !!q.internal};
    g.qty += q.qty || 1; groups.set(key, g);
  }
  for (const g of groups.values()) {
    const n = ROLE[g.role] || [g.role, g.role, '', ''];
    if (g.role === 'seam' || g.role === 'niche-floor') continue;
    rows.push({code: `B${String(rows.length + 1).padStart(2, '0')}`, nameTr: n[0], nameEn: n[1], qty: g.qty, size: g.size, material: materialText(g.mat), specTr: n[2], specEn: n[3], internal: g.internal});
  }
  const p = compiled.params;
  if (p.kind === 'bed') rows.push({code: `B${String(rows.length + 1).padStart(2, '0')}`, nameTr: 'Karyola bağlantı seti', nameEn: 'Bed fittings', qty: 1, size: [0, 0, 0], material: tr ? 'Çelik' : 'Steel', specTr: 'Köşebent, M8 cıvata, başlık askı kayıtı' + (p.storage === 'lift' ? '; amortisörlü kaldırma mekanizması' : ''), specEn: 'Corner brackets, M8 bolts, headboard cleat' + (p.storage === 'lift' ? '; gas-lift mechanism' : ''), internal: false});
  if (p.kind !== 'bed' && (p.kind === 'dresser' || p.height > 700)) rows.push({code: `B${String(rows.length + 1).padStart(2, '0')}`, nameTr: 'Devrilme önleyici', nameEn: 'Anti-tip kit', qty: 1, size: [0, 0, 0], material: tr ? 'Çelik + dübel' : 'Steel + anchors', specTr: 'Duvara sabitleme zorunlu (EN 14749)', specEn: 'Wall fixing required (EN 14749)', internal: false});
  const metres = +(fabricArea / 1e6 / 1.4 * 1.15).toFixed(1);
  return {rows, totals: {weightKg: weights(compiled, materials, buildMesh), fabricMetres: fabricArea > 0 ? metres : undefined, fabricAreaM2: fabricArea > 0 ? +(fabricArea / 1e6).toFixed(2) : undefined, mattress: compiled.meta.mattress, drawers: compiled.meta.drawers}};
}
function meshArea(m) {
  let a = 0; const p = m.positions, idx = m.indices;
  for (let t = 0; t < idx.length; t += 3) {
    const i = idx[t] * 3, j = idx[t + 1] * 3, k = idx[t + 2] * 3;
    const ux = p[j] - p[i], uy = p[j + 1] - p[i + 1], uz = p[j + 2] - p[i + 2], vx = p[k] - p[i], vy = p[k + 1] - p[i + 1], vz = p[k + 2] - p[i + 2];
    a += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
  }
  return a;
}
