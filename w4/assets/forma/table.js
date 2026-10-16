// Table family: dining table, coffee table, side table, console and desk from one parametric grammar.
// Units: mm and degrees. Origin: floor centre; length along x, width along z (front = +z), y up.
// Includes the checks a furniture designer would run first: ergonomics, knee room, capacity, top deflection,
// tipping safety, wood movement and weight. Results are guidance for the designer, not certification.
import {cushion, lathe, tube, topOutline, clipX, offsetOutline, profiledSlab, transformPositions, bounds} from './mesh.js';
import {legProfile} from './profiles.js';
import {clamp} from './rng.js';
import {WOODS, STONES} from './catalog.js';

export const FAMILY = 'table';

export const KINDS = {
  dining:  {length: [1200, 2600], width: [800, 1100], height: [740, 760], round: [1000, 1500]},
  coffee:  {length: [800, 1500], width: [500, 900], height: [320, 440], round: [700, 1100]},
  side:    {length: [400, 650], width: [400, 600], height: [450, 600], round: [400, 600]},
  console: {length: [900, 1800], width: [300, 450], height: [760, 860], round: [0, 0]},
  desk:    {length: [1000, 1800], width: [550, 800], height: [730, 760], round: [0, 0]}
};

export const RANGES = {
  length: [380, 3400, 10], width: [280, 1300, 10], height: [280, 920, 5],
  topThickness: [6, 80, 1], cornerRadius: [0, 400, 5], shapeN: [2.5, 12, 0.5], boatBow: [0, 0.22, 0.01],
  edgeSize: [0, 40, 1], overhang: [0, 450, 5], sideOverhang: [0, 250, 5],
  legSize: [16, 120, 1], legTaper: [0.35, 1, 0.05], legSplay: [0, 15, 1],
  apronHeight: [0, 170, 5], apronThickness: [16, 40, 1], apronSetback: [0, 30, 1], stretcherHeight: [60, 420, 5],
  columnSize: [50, 520, 5], footSpread: [0.3, 0.95, 0.01], panelThickness: [12, 90, 1], tubeSize: [12, 60, 1],
  shelfHeight: [80, 420, 5], shelfThickness: [12, 40, 1], drawers: [0, 4, 1], leaves: [0, 2, 1], leafLength: [300, 600, 10]
};

export const ENUMS = {
  topShape: ['rect', 'rounded', 'superellipse', 'oval', 'round', 'racetrack', 'boat'],
  edge: ['square', 'eased', 'chamfer', 'underbevel', 'bullnose', 'ogee'],
  baseType: ['legsApron', 'legsOnly', 'trestle', 'pedestal', 'doublePedestal', 'slabEnds', 'sled', 'xBase', 'tripod', 'hairpin', 'drum'],
  legType: ['squareTaper', 'square', 'roundTaper', 'round', 'turned', 'blade', 'cone'],
  pedestalType: ['column', 'tulip', 'tapered', 'faceted', 'cross', 'star'],
  stretcher: ['none', 'H', 'box'],
  shelf: ['none', 'solid', 'slatted'],
  drawerPull: ['none', 'knob', 'bar', 'recess'],
  backPanel: ['none', 'panel'],
  extended: ['closed', 'open']
};

export const DEFAULTS = {
  length: 1800, width: 900, height: 750, topThickness: 30, cornerRadius: 20, shapeN: 4, boatBow: 0.08, edgeSize: 10, overhang: 120, sideOverhang: 60,
  legSize: 60, legTaper: 0.7, legSplay: 0, apronHeight: 90, apronThickness: 22, apronSetback: 8, stretcherHeight: 150,
  columnSize: 160, footSpread: 0.6, panelThickness: 40, tubeSize: 30, shelfHeight: 150, shelfThickness: 20, drawers: 0, leaves: 0, leafLength: 450,
  topShape: 'rounded', edge: 'eased', baseType: 'legsApron', legType: 'squareTaper', pedestalType: 'column', stretcher: 'none', shelf: 'none', drawerPull: 'none', backPanel: 'none', extended: 'closed', kind: 'dining'
};

/** Clamp and reconcile so every combination is buildable. */
export function normalize(input = {}) {
  const p = {...DEFAULTS};
  for (const [k, [lo, hi, step]] of Object.entries(RANGES)) { const v = Number(input[k]); if (Number.isFinite(v)) p[k] = +(Math.round(clamp(v, lo, hi) / step) * step).toFixed(3); }
  for (const [k, list] of Object.entries(ENUMS)) if (list.includes(input[k])) p[k] = input[k];
  if (KINDS[input.kind]) p.kind = input.kind;
  const round = p.topShape === 'round';
  if (round) p.width = p.length;
  if (p.width > p.length && !round) [p.length, p.width] = [p.width, p.length];
  p.cornerRadius = Math.min(p.cornerRadius, p.width / 2 - 1);
  // Supports that need a long top, or a round/oval one.
  if (p.baseType === 'tripod' && !['round', 'oval', 'superellipse'].includes(p.topShape)) p.baseType = 'pedestal';
  if (p.baseType === 'doublePedestal' && p.length < 1700) p.baseType = 'pedestal';
  if (p.baseType === 'trestle' && p.length < 1000) p.baseType = 'legsApron';
  // Drawers and leaves live where they make sense.
  if (!['console', 'desk', 'side', 'coffee'].includes(p.kind) || p.baseType !== 'legsApron') p.drawers = 0;
  if (p.drawers > 0) p.apronHeight = Math.max(p.apronHeight, 110);
  if (p.kind !== 'dining' || ['round', 'boat'].includes(p.topShape) || ['pedestal', 'drum', 'tripod'].includes(p.baseType)) p.leaves = 0;
  if (!['coffee', 'side', 'console'].includes(p.kind) || ['pedestal', 'doublePedestal', 'tripod', 'drum'].includes(p.baseType)) p.shelf = 'none';
  if (!['console', 'desk'].includes(p.kind)) p.backPanel = 'none';
  p.overhang = Math.min(p.overhang, p.length * 0.3); p.sideOverhang = Math.min(p.sideOverhang, p.width * 0.25);
  p.edgeSize = Math.min(p.edgeSize, p.topThickness * 0.9);
  p.apronHeight = Math.min(p.apronHeight, p.height - p.topThickness - 120);
  // Knee room at dining tables and desks: keep ≥ 635 mm under the apron unless drawers need the depth.
  if ((p.kind === 'dining' || p.kind === 'desk') && !p.drawers) p.apronHeight = Math.min(p.apronHeight, Math.max(40, p.height - p.topThickness - 635));
  p.shelfHeight = Math.min(p.shelfHeight, p.height - p.topThickness - p.apronHeight - 80);
  p.stretcherHeight = Math.min(p.stretcherHeight, p.height - p.topThickness - p.apronHeight - 60);
  p.columnSize = Math.min(p.columnSize, p.width * 0.7);
  return p;
}

/** Edge profile: inward offset (mm) at s ∈ [0,1] from the top face down. */
export function edgeProfile(type, T, e) {
  const ease = 2.5;
  switch (type) {
    case 'square': return s => (s < 0.03 || s > 0.97 ? 0.6 : 0);
    case 'eased': { const r = Math.min(ease + e * 0.15, T / 3); return s => { const y = s * T; if (y < r) return r - Math.sqrt(Math.max(0, r * r - (r - y) ** 2)); if (y > T - r) return r - Math.sqrt(Math.max(0, r * r - (y - (T - r)) ** 2)); return 0; }; }
    case 'chamfer': { const c = Math.max(3, Math.min(e, T * 0.6)); return s => Math.max(0, c - s * T) + (s > 0.97 ? 0.6 : 0); }
    case 'underbevel': { const keep = Math.max(4, T * 0.28); return s => { const y = s * T; return y <= keep ? (y < 1 ? 0.6 : 0) : (y - keep) / (T - keep) * Math.max(e, T * 0.8); }; }
    case 'bullnose': { const R = T / 2; return s => { const y = s * T; return R - Math.sqrt(Math.max(0, R * R - (y - R) ** 2)); }; }
    case 'ogee': { const d = Math.max(4, Math.min(e, T * 0.5)); return s => { const y = s * T, h = T * 0.6; if (y > h) return d; const u = y / h; return d * (0.5 - 0.5 * Math.cos(Math.PI * u)) * (u < 0.5 ? 0.6 : 1); }; }
    default: return () => 0;
  }
}

const part = (id, role, mat, geom, pos, rot = [0, 0, 0], extra = {}) => ({id, role, mat, geom, pos, rot, ...extra});
const box = (id, role, mat, w, h, d, pos, rot, extra) => part(id, role, mat, {fn: 'cushion', w, h, d, r: Math.min(2, w / 3, h / 3, d / 3)}, pos, rot, extra);

/** Support layout: points where the base meets the floor and the outline of the support zone. */
function legSpots(p, outline) {
  const a = p.length / 2 - p.overhang - p.legSize / 2, b = p.width / 2 - p.sideOverhang - p.legSize / 2;
  if (['round', 'oval', 'superellipse'].includes(p.topShape)) {
    const k = Math.SQRT1_2; return [[a * k, b * k], [-a * k, b * k], [-a * k, -b * k], [a * k, -b * k]];
  }
  return [[a, b], [-a, b], [-a, -b], [a, -b]];
}

export function compile(raw) {
  const p = normalize(raw), parts = [], dims = [];
  const T = p.topThickness, H = p.height, yu = H - T; // underside of the top
  const open = p.extended === 'open' && p.leaves > 0;
  const L = p.length + (open ? p.leaves * p.leafLength : 0), W = p.width;
  const outline = topOutline(p.topShape, L, W, {r: p.topShape === 'rect' ? 2 : p.cornerRadius, n: p.shapeN, bow: p.topShape === 'boat' ? p.boatBow : 0});
  const prof = edgeProfile(p.edge, T, p.edgeSize);
  // ---- Top (split into halves and leaves when the extension is open) ------------------
  if (open) {
    const half = p.length / 2, cuts = [-L / 2 - 1, -L / 2 + half, ...Array.from({length: p.leaves}, (_, i) => -L / 2 + half + (i + 1) * p.leafLength), L / 2 + 1];
    for (let i = 0; i < cuts.length - 1; i++) {
      const piece = clipX(outline, cuts[i] + (i ? 0.8 : 0), cuts[i + 1] - (i < cuts.length - 2 ? 0.8 : 0));
      parts.push(part(i === 0 || i === cuts.length - 2 ? `top-${i ? 'right' : 'left'}` : `leaf-${i}`, i === 0 || i === cuts.length - 2 ? 'top' : 'leaf', 'top', {fn: 'slab', outline: piece, t: T, profile: [p.edge, T, p.edgeSize]}, [0, yu, 0]));
    }
  } else parts.push(part('top', 'top', 'top', {fn: 'slab', outline, t: T, profile: [p.edge, T, p.edgeSize]}, [0, yu, 0]));
  if (p.kind === 'desk') parts.push(part('grommet', 'grommet', 'dark', {fn: 'lathe', profile: [[0, 30], [2, 30]], square: false}, [L / 2 - 220, H - 0.5, -W / 2 + 90]));

  // ---- Base -------------------------------------------------------------------------
  const LB = p.length; // the base never extends with the leaves
  const spots = legSpots({...p, length: LB}, outline);
  const legMat = 'base', ls = p.legSize;
  const legPart = (id, x, z, h, sx = 0, sz = 0) => {
    const type = p.legType, splay = (type === 'cone' ? Math.max(p.legSplay, 6) : p.legSplay) * Math.PI / 180;
    let q;
    if (type === 'blade') q = box(id, 'leg', legMat, ls * 0.32, h, ls, [x, h / 2, z]);
    else if (type === 'square') q = box(id, 'leg', legMat, ls, h, ls, [x, h / 2, z]);
    else {
      const prof = type === 'turned' ? legProfile('turned', h, ls / 2) : type === 'squareTaper' ? legProfile('squareTaper', h, ls / 2, p.legTaper) : type === 'round' ? legProfile('cylinder', h, ls / 2) : legProfile(type === 'cone' ? 'cone' : 'tapered', h, ls / 2, p.legTaper);
      q = part(id, 'leg', legMat, {fn: 'lathe', profile: prof, square: type === 'squareTaper'}, [x, 0, z], [sz * -splay * 0.8, 0, sx * splay]);
    }
    return q;
  };
  const apronLen = (a) => Math.max(40, a);
  const shelfAt = (lenX, depZ, y) => {
    if (p.shelf === 'none') return;
    if (p.shelf === 'solid') parts.push(part('shelf', 'shelf', 'top', {fn: 'slab', outline: topOutline('rect', lenX, depZ, {r: 2}), t: p.shelfThickness, profile: ['eased', p.shelfThickness, 2]}, [0, y, 0]));
    else { const n = Math.max(4, Math.round(depZ / 60)), sw = depZ / n - 8; for (let i = 0; i < n; i++) parts.push(box(`slat-${i + 1}`, 'shelf-slat', 'base', lenX, p.shelfThickness, sw, [0, y + p.shelfThickness / 2, -depZ / 2 + (i + 0.5) * depZ / n])); }
  };
  const bt = p.baseType;
  if (bt === 'legsApron' || bt === 'legsOnly') {
    const legH = yu;
    spots.forEach(([x, z], i) => parts.push(legPart(`leg-${i + 1}`, x, z, legH, Math.sign(x), Math.sign(z))));
    const [ax, az] = spots[0];
    if (bt === 'legsApron' && p.apronHeight > 0) {
      const ah = p.apronHeight, at = p.apronThickness, sb = p.apronSetback, y = yu - ah / 2;
      const zFace = az + ls / 2 - sb - at / 2, xFace = ax + ls / 2 - sb - at / 2;
      const lenX = apronLen(2 * ax - ls), lenZ = apronLen(2 * az - ls);
      if (p.drawers > 0) {
        const n = p.drawers, gap = 3, fw = (lenX - gap * (n + 1)) / n, fh = ah - 2 * gap;
        for (let i = 0; i < n; i++) {
          const x = -lenX / 2 + gap + fw / 2 + i * (fw + gap);
          parts.push(box(`drawer-front-${i + 1}`, 'drawer-front', legMat, fw, fh, at, [x, y, zFace]));
          const depth = Math.max(200, Math.floor((2 * az - ls - 40) / 50) * 50);
          parts.push(box(`drawer-box-${i + 1}`, 'drawer-box', 'frame', fw - 26, fh - 25, depth, [x, y - 5, zFace - at / 2 - depth / 2], [0, 0, 0], {internal: true}));
          if (p.drawerPull === 'knob') parts.push(part(`pull-${i + 1}`, 'pull', 'metal', {fn: 'lathe', profile: [[0, 6], [14, 6], [16, 13], [24, 13], [26, 9]]}, [x, y, zFace + at / 2], [Math.PI / 2, 0, 0]));
          if (p.drawerPull === 'bar') parts.push(part(`pull-${i + 1}`, 'pull', 'metal', {fn: 'tube', points: [[x - fw * 0.22, y, zFace + at / 2], [x - fw * 0.22, y, zFace + at / 2 + 28], [x + fw * 0.22, y, zFace + at / 2 + 28], [x + fw * 0.22, y, zFace + at / 2]], r: 5}, [0, 0, 0]));
          if (p.drawerPull === 'recess') parts.push(box(`pull-${i + 1}`, 'pull', 'dark', fw * 0.4, 6, 2, [x, y - fh / 2 + 8, zFace + at / 2 + 0.6]));
        }
      } else parts.push(box('apron-front', 'apron', legMat, lenX, ah, at, [0, y, zFace]));
      parts.push(box('apron-back', 'apron', legMat, lenX, ah, at, [0, y, -zFace]));
      for (const s of [-1, 1]) parts.push(box(`apron-side-${s < 0 ? 'l' : 'r'}`, 'apron', legMat, at, ah, lenZ, [s * xFace, y, 0]));
      for (const [x, z] of spots) parts.push(box(`corner-block-${Math.sign(x)}${Math.sign(z)}`, 'corner-block', 'frame', 60, Math.max(40, ah - 10), 60, [x - Math.sign(x) * (ls / 2 + 25), y, z - Math.sign(z) * (ls / 2 + 25)], [0, Math.PI / 4, 0], {internal: true}));
    }
    if (p.stretcher !== 'none') {
      const sy = p.stretcherHeight, st = Math.max(18, ls * 0.45), lenX = 2 * ax - ls, lenZ = 2 * az - ls;
      for (const s of [-1, 1]) parts.push(box(`stretcher-side-${s < 0 ? 'l' : 'r'}`, 'stretcher', legMat, st, st, lenZ, [s * ax, sy, 0]));
      if (p.stretcher === 'H') parts.push(box('stretcher-long', 'stretcher', legMat, lenX, st, st, [0, sy, 0]));
      else for (const s of [-1, 1]) parts.push(box(`stretcher-${s < 0 ? 'b' : 'f'}`, 'stretcher', legMat, lenX, st, st, [0, sy, s * az]));
    }
    shelfAt(2 * ax - ls + 2, 2 * az - ls + 2, p.shelfHeight);
    if (p.backPanel === 'panel') parts.push(box('back-panel', 'back-panel', legMat, 2 * ax - ls, Math.min(380, yu * 0.5), 16, [0, yu - Math.min(380, yu * 0.5) / 2, -az]));
  } else if (bt === 'trestle') {
    const xs = LB / 2 - p.overhang - ls / 2, zs = W / 2 - p.sideOverhang - ls / 2, rail = Math.max(50, p.apronHeight || 70);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) parts.push(legPart(`trestle-leg-${sx}${sz}`, sx * xs, sz * zs, yu - rail));
      parts.push(box(`trestle-top-${sx}`, 'trestle-bearer', legMat, ls, rail, 2 * zs + ls + 40, [sx * xs, yu - rail / 2, 0]));
      parts.push(box(`trestle-foot-${sx}`, 'trestle-foot', legMat, ls * 1.1, 60, 2 * zs + ls + 60, [sx * xs, 30, 0]));
    }
    parts.push(box('trestle-stretcher', 'stretcher', legMat, 2 * xs - ls, Math.max(60, ls * 1.1), Math.max(30, ls * 0.5), [0, p.stretcherHeight, 0]));
  } else if (bt === 'pedestal' || bt === 'doublePedestal') {
    const xs = bt === 'doublePedestal' ? [-(LB * 0.27), LB * 0.27] : [0];
    const reach = p.footSpread * Math.min(LB, W) / 2;
    xs.forEach((x, i) => {
      const c = p.columnSize / 2, h = yu - 40, type = p.pedestalType;
      const col = type === 'tulip' ? [[0, c * 1.9], [h * 0.06, c * 1.3], [h * 0.35, c * 0.75], [h * 0.65, c * 0.75], [h * 0.92, c * 1.2], [h, c * 1.6]]
        : type === 'tapered' ? [[0, c * 1.25], [h, c * 0.7]] : [[0, c], [h, c]];
      parts.push(part(`column-${i + 1}`, 'column', legMat, {fn: 'lathe', profile: col.map(([y, r]) => [y + 40, r]), faceted: type === 'faceted', segments: type === 'faceted' ? 8 : 40}, [x, 0, 0]));
      parts.push(part(`spider-${i + 1}`, 'top-plate', 'frame', {fn: 'lathe', profile: [[0, c * 1.6], [18, c * 1.6]]}, [x, yu - 18, 0], [0, 0, 0], {internal: true}));
      if (type === 'cross' || type === 'star') {
        const n = type === 'cross' ? 4 : bt === 'doublePedestal' ? 2 : 3;
        for (let k = 0; k < n; k++) {
          const a = (bt === 'doublePedestal' ? Math.PI / 2 : 0) + k / n * Math.PI * 2 + (type === 'cross' ? Math.PI / 4 : Math.PI / 2);
          parts.push(box(`foot-${i + 1}-${k + 1}`, 'foot', legMat, reach, 50, Math.max(40, c * 0.7), [x + Math.cos(a) * reach / 2, 25, Math.sin(a) * reach / 2], [0, -a, 0]));
        }
      } else parts.push(part(`base-disc-${i + 1}`, 'foot', legMat, {fn: 'lathe', profile: [[0, reach - 6], [6, reach], [type === 'tulip' ? 40 : 30, reach - (type === 'tulip' ? 10 : 2)], [type === 'tulip' ? 44 : 34, c * 1.2]]}, [x, 0, 0]));
    });
    if (bt === 'doublePedestal') parts.push(box('pedestal-stretcher', 'stretcher', legMat, LB * 0.54, 60, 40, [0, yu - 40, 0]));
  } else if (bt === 'slabEnds') {
    const pt = p.panelThickness, xs = LB / 2 - p.overhang - pt / 2, d = W - 2 * p.sideOverhang;
    const waterfall = p.overhang < 10;
    for (const s of [-1, 1]) parts.push(part(`end-panel-${s < 0 ? 'l' : 'r'}`, 'end-panel', waterfall ? 'top' : legMat, {fn: 'cushion', w: pt, h: yu, d, r: Math.min(3, pt / 3)}, [s * (waterfall ? L / 2 - pt / 2 : xs), yu / 2, 0]));
    if (p.kind === 'console' || p.kind === 'desk' || p.length > 1600) parts.push(box('slab-stretcher', 'stretcher', legMat, 2 * xs - pt, 60, 30, [0, yu - 30, -d / 2 + 40]));
    shelfAt(2 * xs - pt, d - 10, p.shelfHeight);
  } else if (bt === 'sled') {
    const ts = p.tubeSize, xs = LB / 2 - p.overhang - ts / 2, zs = W / 2 - p.sideOverhang - ts / 2;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) parts.push(box(`post-${sx}${sz}`, 'frame-post', 'metal', ts, yu - ts, ts, [sx * xs, (yu - ts) / 2 + ts / 2, sz * zs]));
      parts.push(box(`runner-${sx}`, 'frame-runner', 'metal', ts, ts, 2 * zs + ts, [sx * xs, ts / 2, 0]));
    }
    for (const sz of [-1, 1]) parts.push(box(`rail-${sz}`, 'frame-rail', 'metal', 2 * xs + ts, ts, ts, [0, yu - ts / 2, sz * zs]));
    shelfAt(2 * xs - ts, 2 * zs - ts, p.shelfHeight);
  } else if (bt === 'xBase') {
    const ts = Math.max(p.tubeSize, p.legSize * 0.6), xs = LB / 2 - p.overhang - ts / 2, zs = W / 2 - p.sideOverhang - ts;
    const len = Math.hypot(yu, 2 * zs), ang = Math.atan2(yu, 2 * zs);
    for (const sx of [-1, 1]) for (const k of [-1, 1]) parts.push(box(`x-bar-${sx}${k}`, 'x-leg', legMat, ts, len, ts * 0.8, [sx * xs, yu / 2, 0], [k * (Math.PI / 2 - ang), 0, 0]));
    parts.push(box('x-stretcher', 'stretcher', legMat, 2 * xs, ts, ts, [0, yu / 2, 0]));
  } else if (bt === 'tripod') {
    const R = Math.min(L, W) / 2 * (1 - (p.overhang / Math.max(L, 1)) * 2) - ls, splay = Math.max(6, p.legSplay) * Math.PI / 180;
    for (let k = 0; k < 3; k++) {
      const a = k / 3 * Math.PI * 2 + Math.PI / 2, x = Math.cos(a) * R * 0.75, z = Math.sin(a) * R * 0.75;
      parts.push(part(`leg-${k + 1}`, 'leg', legMat, {fn: 'lathe', profile: legProfile(p.legType === 'turned' ? 'turned' : 'tapered', yu + 10, ls / 2, p.legTaper)}, [x, 0, z], [Math.sin(a) * -splay, 0, Math.cos(a) * splay]));
    }
    parts.push(part('tripod-ring', 'top-plate', 'frame', {fn: 'lathe', profile: [[0, R * 0.8], [20, R * 0.8]]}, [0, yu - 20, 0], [0, 0, 0], {internal: true}));
  } else if (bt === 'hairpin') {
    const r = Math.max(5, p.tubeSize / 4);
    for (const [x, z] of spots) {
      const sx = Math.sign(x), sz = Math.sign(z), foot = [x - sx * 10, r, z - sz * 10];
      for (const dx of [-55, 55]) parts.push(part(`hairpin-${sx}${sz}${dx}`, 'hairpin', 'metal', {fn: 'tube', points: [[x - sx * 40 + dx * 0.0, yu - 2, z + dx * (sx * sz > 0 ? 0.7 : -0.7)], foot], r}, [0, 0, 0]));
      parts.push(box(`plate-${sx}${sz}`, 'mount-plate', 'metal', 110, 4, 110, [x - sx * 40, yu - 2, z], [0, 0, 0]));
    }
  } else if (bt === 'drum') {
    const inset = Math.max(30, p.overhang * 0.5), dOut = offsetOutline(signedCCW(outline), inset);
    parts.push(part('drum', 'drum', legMat, {fn: 'slab', outline: dOut, t: yu - 30, profile: ['eased', yu - 30, 3]}, [0, 30, 0]));
    parts.push(part('drum-plinth', 'plinth', 'dark', {fn: 'slab', outline: offsetOutline(signedCCW(outline), inset + 25), t: 30, profile: ['square', 30, 0]}, [0, 0, 0]));
  }
  parts.push(...glides(parts));

  const meta = derive(p, {L, W, H, T, yu, spots, open, outline});
  dims.push(...tableDims(p, meta));
  return {family: FAMILY, params: p, parts, meta, dims, sectionX: bt === 'doublePedestal' ? -(LB * 0.27) : 0, detail: {kind: 'edge', title: 'edge', T, profile: [p.edge, T, p.edgeSize]}};
}

function signedCCW(pts) { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a > 0 ? pts : [...pts].reverse(); }

/** Felt glides under every floor contact (BOM count only). */
function glides(parts) { return []; }

// ---- Derived values and engineering checks ---------------------------------------------
const E_MOD = {wood: 12000, veneer: 3500, lacquer: 3500, stone: 50000, glass: 70000}; // N/mm² (MDF/ply substrate for veneer and lacquer)

function derive(p, {L, W, H, T, yu, spots, open, outline}) {
  // Capacity: 600 mm per person along the edge; round/oval use perimeter (650 mm per person).
  const perim = (() => { let s = 0; for (let i = 0; i < outline.length; i++) { const a = outline[i], b = outline[(i + 1) % outline.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); } return s; })();
  let seats = 0;
  if (p.kind === 'dining') {
    if (['round', 'oval', 'superellipse', 'racetrack'].includes(p.topShape)) seats = Math.max(2, Math.floor(perim / 650));
    else seats = 2 * Math.floor(L / 600) + (W >= 800 && L >= 1400 ? 2 : 0);
    if (p.baseType === 'legsApron' && !['round', 'oval'].includes(p.topShape) && p.overhang < 250) seats = Math.min(seats, 2 * Math.floor((L - 2 * Math.max(0, 250 - p.overhang)) / 600) + (W >= 800 ? 2 : 0));
  }
  const knee = p.baseType === 'legsApron' ? yu - p.apronHeight : p.baseType === 'doublePedestal' || p.baseType === 'slabEnds' && p.kind !== 'coffee' ? yu - 60 : yu;
  const areaTop = Math.abs(outline.reduce((s, a, i) => { const b = outline[(i + 1) % outline.length]; return s + a[0] * b[1] - b[0] * a[1]; }, 0) / 2);
  return {overall: {width: Math.round(L), depth: Math.round(W), height: Math.round(H)}, closedLength: p.length, extendedLength: p.leaves ? p.length + p.leaves * p.leafLength : null, open, seats, knee: Math.round(knee), yu, areaTop, perimeter: Math.round(perim), kind: p.kind, legSpread: spots};
}

/** Approximate weights (kg) from part volumes and densities. */
export function weights(compiled, materials, buildMesh) {
  const dens = {top: surfaceDensity(materials.top), base: surfaceDensity(materials.base), metal: 7850 * 0.18, frame: 650, dark: 650};
  let total = 0, top = 0;
  for (const q of compiled.parts) {
    const m = buildMesh(q);
    // Drums are bent-ply shells (18 mm), not solid bodies.
    const v = q.role === 'drum' ? shellVolume(q) : meshVolume(m) / 1e9, kg = v * (dens[q.mat] ?? 600);
    total += kg; if (q.role === 'top' || q.role === 'leaf') top += kg;
  }
  return {total: +total.toFixed(1), top: +top.toFixed(1)};
}
function shellVolume(q) { const o = q.geom.outline; let per = 0; for (let i = 0; i < o.length; i++) { const a = o[i], b = o[(i + 1) % o.length]; per += Math.hypot(b[0] - a[0], b[1] - a[1]); } return per * q.geom.t * 18 / 1e9; }
function surfaceDensity(s = {}) { if (s.surface === 'stone') return STONES[s.stone]?.density || 2600; if (s.surface === 'glass') return 2500; if (s.surface === 'metal') return 7850 * 0.18; /* hollow sections / sheet over a frame */ if (s.surface === 'lacquer' || s.surface === 'veneer') return 750; return WOODS[s.species]?.density || 700; }
export function meshVolume(m) {
  let v = 0; const p = m.positions, idx = m.indices;
  for (let t = 0; t < idx.length; t += 3) { const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3; v += (p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])) / 6; }
  return Math.abs(v);
}

/**
 * Engineering and ergonomic checks. materials and buildMesh are optional (for weight / tipping).
 * Returns [{level, code, value}] with values rounded for display.
 */
export function validate(design, materials = null, buildMesh = null) {
  const {params: p, meta: m} = design, issues = [], add = (level, code, value) => issues.push({level, code, value});
  const ergo = {dining: [720, 770], desk: [720, 760], coffee: [300, 480], side: [450, 650], console: [750, 900]}[p.kind];
  if (p.height < ergo[0] || p.height > ergo[1]) add('warn', 'heightRange', `${ergo[0]}–${ergo[1]}`);
  if ((p.kind === 'dining' || p.kind === 'desk')) { if (m.knee < 590) add('error', 'kneeRoom', m.knee); else if (m.knee < 630) add('warn', 'kneeRoom', m.knee); }
  const surface = materials?.top?.surface || 'wood';
  const minT = {glass: p.kind === 'dining' || p.kind === 'desk' ? 12 : 8, stone: materials?.top?.stone === 'concrete' ? 12 : 20, wood: p.kind === 'dining' || p.kind === 'desk' ? 25 : 18, veneer: 18, lacquer: 18}[surface];
  if (p.topThickness < minT) add('error', 'topThin', minT);
  // Deflection of the top between supports (simply supported strip, 1.5 kN/m² + self weight ignored).
  const span = p.baseType === 'legsApron' ? Math.max(p.width - 2 * p.sideOverhang, 0) : p.baseType === 'doublePedestal' ? p.length * 0.54 : p.baseType === 'trestle' || p.baseType === 'slabEnds' || p.baseType === 'sled' || p.baseType === 'xBase' ? p.length - 2 * p.overhang : 0;
  if (span > 0) {
    const E = E_MOD[surface] || 12000, I = 1000 * p.topThickness ** 3 / 12, w = 0.0015 * 1000; // N/mm per metre strip
    const defl = 5 * w * span ** 4 / (384 * E * I);
    if (defl > span / 300) add(defl > span / 150 ? 'error' : 'warn', 'sag', +defl.toFixed(1));
  }
  // Tipping: 300 N leaning on the edge versus self weight resting on the support footprint.
  if (materials && buildMesh) {
    const wt = weights(design, materials, buildMesh), Wn = wt.total * 9.81;
    // Vertical test load on the most unfavourable edge, scaled by use (after EN 12521 practice; indicative only).
    const load = {dining: 400, desk: 400, coffee: 250, console: 150, side: 100}[p.kind] || 300;
    const reach = supportReach(p, m), edge = Math.min(p.length, p.width) / 2;
    const over = load * Math.max(0, edge - reach.minor);
    const sf = over > 0 ? Wn * reach.minor / over : 99;
    if (sf < 1) add('error', 'tipping', +sf.toFixed(2)); else if (sf < 1.3) add('warn', 'tipping', +sf.toFixed(2));
    if (wt.total > 120) add('warn', 'heavy', wt.total);
  }
  if (surface === 'wood' && p.width > 450) add('info', 'woodMovement', +(p.width * 0.0025 * 3).toFixed(1));
  if (p.drawers && p.width - 2 * p.sideOverhang < 280) add('warn', 'drawerShallow', p.width);
  if (p.overhang > p.length * 0.28 && ['legsApron', 'legsOnly', 'trestle'].includes(p.baseType)) add('warn', 'overhang', p.overhang);
  return issues;
}

/** Distance from the centre to the tipping line along the short axis (mm). */
export function supportReach(p, m) {
  const bt = p.baseType;
  if (bt === 'pedestal' || bt === 'doublePedestal') { const r = p.footSpread * Math.min(p.length, p.width) / 2; return {minor: p.pedestalType === 'star' ? r * 0.5 : p.pedestalType === 'cross' ? r * Math.SQRT1_2 : r}; }
  if (bt === 'tripod') { const R = Math.min(p.length, p.width) / 2 - p.legSize; return {minor: R * 0.75 * 0.5}; }
  if (bt === 'drum') return {minor: p.width / 2 - Math.max(30, p.overhang * 0.5) - 25};
  return {minor: p.width / 2 - p.sideOverhang - p.legSize / 2};
}

function tableDims(p, m) {
  const L = m.overall.width, W = m.overall.depth, H = m.overall.height, out = [];
  out.push({view: 'front', a: [-L / 2, 0], b: [L / 2, 0], off: 70, text: `${L}`, orient: 'h'});
  out.push({view: 'front', a: [L / 2, 0], b: [L / 2, H], off: 80, text: `${H}`, orient: 'v'});
  out.push({view: 'front', a: [L / 2, H - p.topThickness], b: [L / 2, H], off: 30, text: `${p.topThickness}`, orient: 'v'});
  if (p.kind === 'dining' || p.kind === 'desk') out.push({view: 'front', a: [-L / 2, 0], b: [-L / 2, m.knee], off: -150, text: `${m.knee}`, label: 'knee', orient: 'v'});
  if (p.overhang > 0 && !['pedestal', 'tripod', 'drum'].includes(p.baseType)) out.push({view: 'front', a: [-L / 2, H], b: [-L / 2 + p.overhang, H], off: -60, text: `${p.overhang}`, orient: 'h'});
  out.push({view: 'side', a: [-W / 2, 0], b: [W / 2, 0], off: 70, text: `${W}`, orient: 'h'});
  out.push({view: 'top', a: [-L / 2, -W / 2], b: [L / 2, -W / 2], off: 60, text: m.extendedLength && !m.open ? `${L} (→ ${m.extendedLength})` : `${L}`, orient: 'h'});
  out.push({view: 'top', a: [L / 2, -W / 2], b: [L / 2, W / 2], off: 60, text: `${W}`, orient: 'v'});
  out.push({view: 'section', a: [-W / 2, 0], b: [-W / 2, H], off: -120, text: `${H}`, orient: 'v'});
  return out;
}

/** Bill of materials with real cut sizes. materialText(slot) supplies localized material names. */
export function tableBom(compiled, materials, lang, buildMesh, materialText) {
  const p = compiled.params, rows = [], tr = lang === 'tr';
  const add = (nameTr, nameEn, qty, size, mat, specTr, specEn, internal = false) => rows.push({code: `T${String(rows.length + 1).padStart(2, '0')}`, nameTr, nameEn, qty, size: size.map(v => Math.round(v)), material: mat, specTr, specEn, internal});
  const top = materials.top, base = materials.base, L = p.length, W = p.width, T = p.topThickness;
  // Top
  if (top.surface === 'wood') {
    const stave = W > 600 ? 85 : 70, n = Math.ceil(W / stave);
    add('Tabla (masif, birleştirme)', 'Top (solid, glued-up)', 1, [L, W, T], materialText('top'), `${n} lamel × ${stave} mm, ham ${L + 30}×${stave + 5}×${T + 6}; lamel yönü uzunlamasına, büyüme halkaları ters çevrilerek; Z-klips ile bağlanır`, `${n} staves × ${stave} mm, rough ${L + 30}×${stave + 5}×${T + 6}; grain along the length, alternate growth rings; fix with Z-clips`);
  } else if (top.surface === 'veneer' || top.surface === 'lacquer') {
    add('Tabla (kompozit)', 'Top (composite)', 1, [L, W, T], materialText('top'), `${T - 2} mm MDF/kontrplak + 2×0,6 mm ${top.surface === 'veneer' ? 'kaplama' : 'astar+lake'}; kenar ${Math.max(5, p.edgeSize + 3)} mm masif bant (profil için)`, `${T - 2} mm MDF/ply + 2×0.6 mm ${top.surface === 'veneer' ? 'veneer' : 'primer+lacquer'}; ${Math.max(5, p.edgeSize + 3)} mm solid lipping for the profile`);
  } else if (top.surface === 'stone') {
    add('Tabla (taş)', 'Top (stone)', 1, [L, W, T], materialText('top'), `${T} mm plaka; kenar profili CNC; leke koruyucu emprenye; altta ${T < 20 ? '12 mm kontrplak destek' : 'kaymaz pedler'}`, `${T} mm slab; CNC edge profile; impregnating sealer; underside ${T < 20 ? '12 mm ply backer' : 'anti-slip pads'}`);
  } else if (top.surface === 'glass') {
    add('Tabla (cam)', 'Top (glass)', 1, [L, W, T], materialText('top'), `${T} mm temperli (EN 12150), kenar rodajlı/parlatılmış, şeffaf silikon tamponlar`, `${T} mm toughened (EN 12150), polished edges, clear silicone bumpers`);
  }
  if (p.leaves) add('Uzatma tablası', 'Extension leaf', p.leaves, [p.leafLength, W, T], materialText('top'), 'Tabla ile aynı malzeme; ahşap pim + kilit; teleskopik ray', 'Same material as the top; dowels + locks; telescopic runners');
  // Base
  const groups = new Map();
  for (const q of compiled.parts) {
    if (['top', 'leaf', 'grommet'].includes(q.role)) continue;
    const mm = buildMesh(q), b = bounds(mm.positions), size = b.size.map(v => Math.round(v)).sort((a, c) => c - a), key = `${q.role}|${q.mat}|${size.join('x')}`;
    const g = groups.get(key) || {role: q.role, mat: q.mat, size, qty: 0, internal: !!q.internal}; g.qty++; groups.set(key, g);
  }
  const NAME = {leg: ['Ayak', 'Leg', 'Masif blok, ham kesit +6 mm; zıvana-lamba ile kuşağa', 'Solid blank, +6 mm rough section; mortise & tenon to apron'], apron: ['Kuşak', 'Apron', 'Masif, iki uçta 25 mm zıvana dili', 'Solid, 25 mm tenon each end'], 'corner-block': ['Köşe takozu', 'Corner block', 'Vida + tutkal, M8 askı cıvatası', 'Glue + screws, M8 hanger bolt'], stretcher: ['Alt kuşak', 'Stretcher', 'Masif, kavelalı', 'Solid, dowelled'],
    'drawer-front': ['Çekmece önü', 'Drawer front', 'Kuşakla aynı malzeme, 3 mm derz', 'Same as apron, 3 mm reveal'], 'drawer-box': ['Çekmece kutusu', 'Drawer box', '12 mm huş kontrplak, 6 mm taban; tam çekilir ray', '12 mm birch ply, 6 mm bottom; full-extension runners'], pull: ['Kulp', 'Pull', 'Metal', 'Metal'],
    shelf: ['Alt raf', 'Lower shelf', 'Ayaklara gizli kavela', 'Concealed dowels to legs'], 'shelf-slat': ['Raf çıtası', 'Shelf slat', 'Masif çıta, 8 mm boşluk', 'Solid slat, 8 mm gap'], 'back-panel': ['Arka panel', 'Modesty panel', 'Kuşağa vida', 'Screwed to apron'],
    'trestle-bearer': ['Sehpa ayak üst kayıtı', 'Trestle bearer', 'Masif, tablaya Z-klips', 'Solid, Z-clips to top'], 'trestle-foot': ['Sehpa ayak tabanı', 'Trestle foot', 'Masif, alt kenar 3 mm boşaltma', 'Solid, 3 mm relief underneath'],
    column: ['Kolon', 'Column', 'Lamine masif blok, torna; veya çelik boru kaplama', 'Laminated solid, turned; or clad steel tube'], foot: ['Ayak tabanı', 'Base foot', 'Ağırlık için çelik plaka gömülü olabilir', 'May embed a steel plate for weight'], 'top-plate': ['Bağlantı plakası', 'Mounting plate', '18 mm kontrplak / çelik', '18 mm ply / steel'],
    'end-panel': ['Yan tabla', 'End panel', 'Tabla ile gönye veya kavela', 'Mitred or dowelled to the top'], 'frame-post': ['Dikme (metal)', 'Post (metal)', 'Kare profil, kaynaklı, elektrostatik boya', 'Square tube, welded, powder coat'], 'frame-runner': ['Taban kızağı', 'Runner', 'Kare profil', 'Square tube'], 'frame-rail': ['Üst lama', 'Top rail', 'Kare profil, tablaya vida', 'Square tube, screwed to top'],
    'x-leg': ['X ayak kolu', 'X leg bar', 'Ortada yarım geçme', 'Cross-halved at centre'], hairpin: ['Firkete ayak çubuğu', 'Hairpin rod', 'Ø10–12 mm çelik çubuk, bükme', 'Ø10–12 mm steel rod, bent'], 'mount-plate': ['Montaj plakası', 'Mounting plate', '4 mm çelik, 4 vida', '4 mm steel, 4 screws'], drum: ['Silindir gövde', 'Drum body', 'Bükme kontrplak / MDF, kaplama veya lake', 'Bent ply / MDF, veneered or lacquered'], plinth: ['Gizli baza', 'Recessed plinth', 'Siyah mat', 'Black matt']};
  for (const g of groups.values()) {
    const n = NAME[g.role] || [g.role, g.role, '', ''], size = [...g.size];
    // Cut sizes: tenoned rails get +2×25 mm, solid blanks +6 mm on section.
    if (g.role === 'apron' || g.role === 'stretcher') size[0] += 50;
    add(n[0], n[1], g.qty, size, materialText(g.mat), n[2] + (g.role === 'apron' || g.role === 'stretcher' ? (tr ? ' (ölçü zıvanalar dahil)' : ' (length includes tenons)') : ''), n[3], g.internal);
  }
  const legs = compiled.parts.filter(q => ['leg', 'foot', 'runner', 'frame-runner', 'trestle-foot', 'end-panel', 'hairpin', 'plinth'].includes(q.role)).length;
  add('Keçe / ayar pabucu', 'Felt glide / leveller', Math.max(3, legs), [20, 20, 5], tr ? 'Keçe + M8 ayar' : 'Felt + M8 leveller', 'Zemin koruma', 'Floor protection');
  if (top.surface === 'wood' && ['legsApron', 'trestle'].includes(p.baseType)) add('Z-klips', 'Z-clip', Math.max(6, Math.round((L + W) / 250)), [30, 20, 10], tr ? 'Çelik' : 'Steel', 'Tablanın mevsimsel hareketine izin verir', 'Allows seasonal movement of the top');
  const wt = weights(compiled, materials, buildMesh);
  return {rows, totals: {weightKg: wt.total, topKg: wt.top, seats: compiled.meta.seats, areaM2: +(compiled.meta.areaTop / 1e6).toFixed(2)}};
}
