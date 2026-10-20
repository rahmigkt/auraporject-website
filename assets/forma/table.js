// Table family: dining table, coffee table, side table, console and desk from one parametric grammar.
// Units: mm and degrees. Origin: floor centre; length along x, width along z (front = +z), y up.
// Includes the checks a furniture designer would run first: ergonomics, knee room, capacity, top deflection,
// tipping safety, wood movement and weight. Results are guidance for the designer, not certification.
import {cushion, lathe, tube, topOutline, clipX, offsetOutline, profiledSlab, transformPositions, bounds} from './mesh.js';
import {legProfile} from './profiles.js';
import {linePart, ccw, rows} from './lines.js';
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
  extended: ['closed', 'open'],
  inlay: ['none', 'single', 'double', 'groove']
};

export const DEFAULTS = {
  length: 1800, width: 900, height: 750, topThickness: 30, cornerRadius: 20, shapeN: 4, boatBow: 0.08, edgeSize: 10, overhang: 120, sideOverhang: 60,
  legSize: 60, legTaper: 0.7, legSplay: 0, apronHeight: 90, apronThickness: 22, apronSetback: 8, stretcherHeight: 150,
  columnSize: 160, footSpread: 0.6, panelThickness: 40, tubeSize: 30, shelfHeight: 150, shelfThickness: 20, drawers: 0, leaves: 0, leafLength: 450,
  topShape: 'rounded', edge: 'eased', baseType: 'legsApron', legType: 'squareTaper', pedestalType: 'column', stretcher: 'none', shelf: 'none', drawerPull: 'none', backPanel: 'none', extended: 'closed', inlay: 'none', kind: 'dining'
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
  if (p.baseType === 'tripod' && (!['round', 'oval', 'superellipse'].includes(p.topShape) || p.width < 600)) p.baseType = 'pedestal';
  // Legs need room under narrow tops: no splay where the top is too narrow to keep feet inside.
  if (p.width - 2 * p.sideOverhang < 4 * p.legSize) p.legSplay = 0;
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

// ---- Support fitting -----------------------------------------------------------------------
// Every support must stand inside the underside of the top (the top outline minus the edge-profile
// inset) with a visible margin, whatever the top shape. Footprints are shrunk towards the centre until
// they fit, so round, oval, racetrack, boat and soft-cornered tops never have legs outside or the top
// floating past its supports.
function insidePoly(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}
function edgeDist(poly, x, z) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [ax, az] = poly[i], [bx, bz] = poly[(i + 1) % poly.length], ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / l2));
    d = Math.min(d, Math.hypot(x - ax - t * ex, z - az - t * ez));
  }
  return d;
}
/** True when every point lies inside the outline at least m from its edge. */
export const fitsInside = (poly, pts, m) => pts.every(([x, z]) => insidePoly(poly, x, z) && edgeDist(poly, x, z) >= m);
/** Largest t ≤ 1 for which footprint(t) fits (binary search; footprint grows with t). */
function fitScale(poly, footprint, m) {
  if (fitsInside(poly, footprint(1), m)) return 1;
  let lo = 0, hi = 1;
  for (let k = 0; k < 22; k++) { const t = (lo + hi) / 2; if (fitsInside(poly, footprint(t), m)) lo = t; else hi = t; }
  return lo;
}
const mirror4 = (x, z) => [[x, z], [-x, z], [-x, -z], [x, -z]];
const circlePts = (cx, cz, r, n = 24) => Array.from({length: n}, (_, k) => [cx + Math.cos(k / n * 2 * Math.PI) * r, cz + Math.sin(k / n * 2 * Math.PI) * r]);
/** Largest radius of a circle at (cx, cz) that fits. */
function fitRadius(poly, cx, cz, m, rMax) { const t = fitScale(poly, t => circlePts(cx, cz, rMax * t), m); return rMax * t; }

/** Leg anchored at its top (x, yTop, z), splayed so the foot moves outward; length solved so the foot is on the floor. */
function splayRot(sx, sz, splay) { return [sz * -splay * 0.8, 0, sx * splay]; }
function legAxis(rot) { const [rx, , rz] = rot; return [-Math.sin(rz), Math.cos(rx) * Math.cos(rz), Math.sin(rx) * Math.cos(rz)]; }

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
  // Line details: a metal inlay band on the top face, or a shadow groove round the edge.
  if (p.inlay === 'groove') {
    const loop = offsetOutline(ccw(outline), (prof(0.5) || 0) + 0.7);
    parts.push(linePart('edge-groove', 'groove', loop.map(([x, z]) => [x, T / 2, z]), [0, yu, 0]));
  } else for (const [k, inset] of rows(p.inlay, (prof(0) || 0) + Math.min(40, W * 0.06), 10).entries()) {
    const loop = offsetOutline(ccw(outline), inset);
    parts.push(linePart(`inlay-${k + 1}`, 'inlay', loop.map(([x, z]) => [x, T - 0.7, z]), [0, yu, 0]));
  }
  if (p.kind === 'desk') parts.push(part('grommet', 'grommet', 'dark', {fn: 'lathe', profile: [[0, 30], [2, 30]], square: false}, [L / 2 - 220, H - 0.5, -W / 2 + 90]));

  // ---- Base -------------------------------------------------------------------------
  const LB = p.length; // the base never extends with the leaves
  const baseOutline = open ? topOutline(p.topShape, LB, W, {r: p.topShape === 'rect' ? 2 : p.cornerRadius, n: p.shapeN, bow: p.topShape === 'boat' ? p.boatBow : 0}) : outline;
  const under = prof(1) || 0, M = under + 15; // supports stay ≥ 15 mm inside the visible underside
  const legMat = 'base', ls = p.legSize, bt = p.baseType;
  const lathed = !['blade', 'square'].includes(p.legType);
  const splayDeg = lathed ? (p.legType === 'cone' ? Math.max(p.legSplay, 6) : p.legSplay) : 0, splay = splayDeg * Math.PI / 180;
  // Horizontal outward travel of a splayed leg from top to floor.
  const splayOut = Math.tan(splay) * yu;
  const legProfileFor = len => p.legType === 'turned' ? legProfile('turned', len, ls / 2) : p.legType === 'squareTaper' ? legProfile('squareTaper', len, ls / 2, p.legTaper) : p.legType === 'round' ? legProfile('cylinder', len, ls / 2) : legProfile(p.legType === 'cone' ? 'cone' : 'tapered', len, ls / 2, p.legTaper);
  // A tilted lathe leg whose top centre is at (x, yTop, z), cut flat at the floor and under the top.
  const tiltedLeg = (id, x, z, yTop, rot, profileFor, square = false) => {
    const v = legAxis(rot), tilt = Math.acos(Math.min(1, v[1])), extra = ls / 2 * Math.tan(tilt) + 2;
    const len = yTop / v[1] + 2 * extra, top = [0, yTop + extra * v[1], 0];
    const inner = {fn: 'lathe', profile: profileFor(len), square};
    if (tilt < 1e-4) return part(id, 'leg', legMat, inner, [x, 0, z]);
    return part(id, 'leg', legMat, {fn: 'clipped', inner, rot, offset: [top[0] - v[0] * len, top[1] - v[1] * len, top[2] - v[2] * len], y0: 0, y1: yTop}, [x, 0, z]);
  };
  const legPart = (id, x, z, yTop, sx = 0, sz = 0) => {
    const type = p.legType;
    if (type === 'blade') return box(id, 'leg', legMat, ls * 0.32, yTop, ls, [x, yTop / 2, z]);
    if (type === 'square') return box(id, 'leg', legMat, ls, yTop, ls, [x, yTop / 2, z]);
    const rot = splay && (sx || sz) ? splayRot(sx, sz, splay) : [0, 0, 0];
    return tiltedLeg(id, x, z, yTop, rot, legProfileFor, type === 'squareTaper');
  };
  // Centre of a splayed leg at height y, given its top centre (x, z) at yu.
  const legAt = (x, z, y) => { if (!splay || !lathed) return [x, z]; const v = legAxis(splayRot(Math.sign(x), Math.sign(z), splay)), k = (yu - y) / v[1]; return [x - v[0] * k, z - v[2] * k]; };
  const apronLen = (a) => Math.max(40, a);
  const shelfAt = (lenX, depZ, y) => {
    if (p.shelf === 'none' || lenX < 120 || depZ < 120) return;
    if (p.shelf === 'solid') parts.push(part('shelf', 'shelf', 'top', {fn: 'slab', outline: topOutline('rect', lenX, depZ, {r: 2}), t: p.shelfThickness, profile: ['eased', p.shelfThickness, 2]}, [0, y, 0]));
    else {
      const n = Math.max(4, Math.round(depZ / 60)), sw = depZ / n - 8, rw = Math.max(30, ls * 0.6);
      // Slats rest on two cross rails that run between the legs.
      for (const sx of [-1, 1]) parts.push(box(`shelf-rail-${sx}`, 'shelf-rail', 'base', rw, 24, depZ, [sx * (lenX / 2 - rw / 2), y - 12, 0]));
      for (let i = 0; i < n; i++) parts.push(box(`slat-${i + 1}`, 'shelf-slat', 'base', lenX, p.shelfThickness, sw, [0, y + p.shelfThickness / 2, -depZ / 2 + (i + 0.5) * depZ / n]));
    }
  };
  let spots = [];
  if (bt === 'legsApron' || bt === 'legsOnly' || bt === 'hairpin') {
    const a0 = LB / 2 - p.overhang - ls / 2, b0 = W / 2 - p.sideOverhang - ls / 2;
    const reach = bt === 'hairpin' ? 60 : ls / 2 + 2;
    // Both the top (attachment) and the splayed foot must sit under the top.
    const t = fitScale(baseOutline, t => mirror4(a0 * t + reach + splayOut, b0 * t + reach + splayOut * 0.8).concat(mirror4(a0 * t + reach, b0 * t + reach)), M);
    const ax = Math.max(ls * 0.75, a0 * t), az = Math.max(ls * 0.75, b0 * t);
    spots = mirror4(ax, az);
  }
  if (bt === 'legsApron' || bt === 'legsOnly') {
    spots.forEach(([x, z], i) => parts.push(legPart(`leg-${i + 1}`, x, z, yu, Math.sign(x), Math.sign(z))));
    const [ax, az] = spots[0];
    if (bt === 'legsApron' && p.apronHeight > 0) {
      const ah = p.apronHeight, at = p.apronThickness, sb = Math.min(p.apronSetback, ls / 2 - 2), y = yu - ah / 2;
      const zFace = az + ls / 2 - sb - at / 2, xFace = ax + ls / 2 - sb - at / 2;
      // Aprons run between leg faces (tenons go into the legs; the BOM adds the tenon length).
      const lenX = apronLen(2 * ax - ls + 2), lenZ = apronLen(2 * az - ls + 2);
      if (p.drawers > 0) {
        const n = p.drawers, gap = 3, fw = (lenX - gap * (n + 1)) / n, fh = ah - 2 * gap;
        for (let i = 0; i < n; i++) {
          const x = -lenX / 2 + gap + fw / 2 + i * (fw + gap);
          parts.push(box(`drawer-front-${i + 1}`, 'drawer-front', legMat, fw, fh, at, [x, y, zFace]));
          const depth = Math.max(200, Math.floor((2 * az - ls - 40) / 50) * 50);
          parts.push(box(`drawer-box-${i + 1}`, 'drawer-box', 'frame', fw - 26, fh - 25, Math.min(depth, 2 * zFace - 40), [x, y - 5, zFace - at / 2 - Math.min(depth, 2 * zFace - 40) / 2], [0, 0, 0], {internal: true}));
          if (p.drawerPull === 'knob') parts.push(part(`pull-${i + 1}`, 'pull', 'metal', {fn: 'lathe', profile: [[0, 6], [14, 6], [16, 13], [24, 13], [26, 9]]}, [x, y, zFace + at / 2], [Math.PI / 2, 0, 0]));
          if (p.drawerPull === 'bar') parts.push(part(`pull-${i + 1}`, 'pull', 'metal', {fn: 'tube', points: [[x - fw * 0.22, y, zFace + at / 2], [x - fw * 0.22, y, zFace + at / 2 + 28], [x + fw * 0.22, y, zFace + at / 2 + 28], [x + fw * 0.22, y, zFace + at / 2]], r: 5}, [0, 0, 0]));
          if (p.drawerPull === 'recess') parts.push(box(`pull-${i + 1}`, 'pull', 'dark', fw * 0.4, 6, 2, [x, y - fh / 2 + 8, zFace + at / 2 + 0.6]));
        }
        // Rail above the drawers ties the front legs.
        parts.push(box('drawer-rail', 'apron', legMat, lenX, 18, at, [0, yu - 9, zFace]));
      } else parts.push(box('apron-front', 'apron', legMat, lenX, ah, at, [0, y, zFace]));
      parts.push(box('apron-back', 'apron', legMat, lenX, ah, at, [0, y, -zFace]));
      for (const s of [-1, 1]) parts.push(box(`apron-side-${s < 0 ? 'l' : 'r'}`, 'apron', legMat, at, ah, lenZ, [s * xFace, y, 0]));
      for (const [x, z] of spots) parts.push(box(`corner-block-${Math.sign(x)}${Math.sign(z)}`, 'corner-block', 'frame', 60, Math.max(40, ah - 10), 60, [x - Math.sign(x) * (ls / 2 + 25), y, z - Math.sign(z) * (ls / 2 + 25)], [0, Math.PI / 4, 0], {internal: true}));
    }
    if (p.stretcher !== 'none') {
      const sy = p.stretcherHeight, st = Math.max(18, ls * 0.45), [sxL, szL] = legAt(ax, az, sy);
      // Rails end inside the legs at the rail height (legs lean out when splayed).
      const lenX = 2 * sxL, lenZ = 2 * szL;
      for (const s of [-1, 1]) parts.push(box(`stretcher-side-${s < 0 ? 'l' : 'r'}`, 'stretcher', legMat, st, st, lenZ, [s * sxL, sy, 0]));
      if (p.stretcher === 'H') parts.push(box('stretcher-long', 'stretcher', legMat, lenX, st, st, [0, sy, 0]));
      else for (const s of [-1, 1]) parts.push(box(`stretcher-${s < 0 ? 'b' : 'f'}`, 'stretcher', legMat, lenX, st, st, [0, sy, s * szL]));
    }
    { const [sxL, szL] = legAt(ax, az, p.shelfHeight); shelfAt(2 * sxL + ls * 0.4, 2 * szL + ls * 0.4, p.shelfHeight); }
    if (p.backPanel === 'panel') parts.push(box('back-panel', 'back-panel', legMat, 2 * ax, /* ends run into the legs (housed), no gap at tapered legs */ Math.min(380, yu * 0.5), 16, [0, yu - Math.min(380, yu * 0.5) / 2, -az]));
  } else if (bt === 'trestle') {
    const x0 = LB / 2 - p.overhang - ls / 2, z0 = W / 2 - p.sideOverhang - ls / 2, rail = Math.max(50, p.apronHeight || 70);
    const t = fitScale(baseOutline, t => mirror4(x0 * t + ls * 0.55, z0 * t + ls / 2 + 30), M);
    const xs = x0 * t, zs = Math.max(ls, z0 * t);
    for (const sx of [-1, 1]) {
      // One wide post per end, foot below and bearer above (classic trestle).
      const postD = Math.min(2 * zs, Math.max(ls * 2.4, 160));
      parts.push(box(`trestle-post-${sx}`, 'trestle-post', legMat, ls, yu - rail - 60 + 2, postD, [sx * xs, 60 + (yu - rail - 60) / 2, 0]));
      parts.push(box(`trestle-top-${sx}`, 'trestle-bearer', legMat, ls, rail, 2 * zs + ls + 40, [sx * xs, yu - rail / 2, 0]));
      parts.push(box(`trestle-foot-${sx}`, 'trestle-foot', legMat, ls * 1.1, 60, 2 * zs + ls + 60, [sx * xs, 30, 0]));
    }
    parts.push(box('trestle-stretcher', 'stretcher', legMat, 2 * xs, Math.max(60, ls * 1.1), Math.max(30, ls * 0.5), [0, Math.max(120, Math.min(p.stretcherHeight, yu - rail - 80)), 0]));
  } else if (bt === 'pedestal' || bt === 'doublePedestal') {
    const xs = bt === 'doublePedestal' ? [-(LB * 0.27), LB * 0.27] : [0];
    const type = p.pedestalType, y0 = (type === 'tulip' ? 44 : 34) - 2, h = yu - y0;
    // Profile radii relative to the column radius c: widest point and top flare.
    const shape = type === 'tulip' ? [[0, 1.9], [0.06, 1.3], [0.35, 0.75], [0.65, 0.75], [0.92, 1.2], [1, 1.6]] : type === 'tapered' ? [[0, 1.25], [1, 0.7]] : [[0, 1], [1, 1]];
    const widest = Math.max(...shape.map(s => s[1]));
    xs.forEach((x, i) => {
      // The column (and its top plate, 1.6 c) must sit inside the top; the foot must too.
      const room = fitRadius(baseOutline, x, 0, M, Math.max(LB, W));
      const c = Math.max(30, Math.min(p.columnSize / 2, room * 0.85 / Math.max(widest, 1.6)));
      let reach = Math.min(p.footSpread * Math.min(LB, W) / 2, room);
      if (bt === 'doublePedestal') reach = Math.min(reach, LB * 0.27 - 20);
      reach = Math.max(reach, c * widest + 20);
      parts.push(part(`column-${i + 1}`, 'column', legMat, {fn: 'lathe', profile: shape.map(([f, r]) => [y0 + f * h, c * r]), faceted: type === 'faceted', segments: type === 'faceted' ? 8 : 40}, [x, 0, 0]));
      parts.push(part(`spider-${i + 1}`, 'top-plate', 'frame', {fn: 'lathe', profile: [[0, Math.min(c * 1.6, room - 5)], [18, Math.min(c * 1.6, room - 5)]]}, [x, yu - 18, 0], [0, 0, 0], {internal: true}));
      if (type === 'cross' || type === 'star') {
        const n = type === 'cross' ? 4 : bt === 'doublePedestal' ? 2 : 3;
        for (let k = 0; k < n; k++) {
          const a = (bt === 'doublePedestal' ? Math.PI / 2 : 0) + k / n * Math.PI * 2 + (type === 'cross' ? Math.PI / 4 : Math.PI / 2);
          parts.push(box(`foot-${i + 1}-${k + 1}`, 'foot', legMat, reach, 50, Math.max(40, c * 0.7), [x + Math.cos(a) * reach / 2, 25, Math.sin(a) * reach / 2], [0, -a, 0]));
        }
      } else parts.push(part(`base-disc-${i + 1}`, 'foot', legMat, {fn: 'lathe', profile: [[0, reach - 6], [6, reach], [type === 'tulip' ? 40 : 30, reach - (type === 'tulip' ? 10 : 2)], [type === 'tulip' ? 44 : 34, Math.min(reach - 12, c * widest)]]}, [x, 0, 0]));
    });
    if (bt === 'doublePedestal') parts.push(box('pedestal-stretcher', 'stretcher', legMat, LB * 0.54, 60, 40, [0, yu - 30, 0]));
  } else if (bt === 'slabEnds') {
    const pt = p.panelThickness, waterfall = p.overhang < 10 && p.topShape === 'rect';
    let xs, d;
    if (waterfall) { xs = L / 2 - pt / 2; d = W - 2 * Math.max(0, p.sideOverhang); }
    else {
      const x0 = LB / 2 - Math.max(p.overhang, 40) - pt / 2, d0 = W - 2 * p.sideOverhang;
      // Panels are wide in z: shrink the depth first, then move them inward if still outside.
      const tz = fitScale(baseOutline, t => mirror4(x0 + pt / 2, d0 / 2 * t), M);
      d = Math.max(200, d0 * tz);
      const tx = fitScale(baseOutline, t => mirror4(x0 * t + pt / 2, d / 2), M);
      xs = x0 * tx;
    }
    for (const s of [-1, 1]) parts.push(part(`end-panel-${s < 0 ? 'l' : 'r'}`, 'end-panel', waterfall ? 'top' : legMat, {fn: 'cushion', w: pt, h: yu + (waterfall ? 0 : 1), d, r: Math.min(3, pt / 3)}, [s * xs, yu / 2, 0]));
    if (p.kind === 'console' || p.kind === 'desk' || p.length > 1600) parts.push(box('slab-stretcher', 'stretcher', legMat, 2 * xs - pt + 2, 60, 30, [0, yu - 30, -d / 2 + 40]));
    shelfAt(2 * xs - pt + 2, d - 10, p.shelfHeight);
  } else if (bt === 'sled' || bt === 'xBase') {
    const ts = bt === 'sled' ? p.tubeSize : Math.max(p.tubeSize, p.legSize * 0.6);
    const x0 = LB / 2 - p.overhang - ts / 2, z0 = W / 2 - p.sideOverhang - ts / 2;
    const t = fitScale(baseOutline, t => mirror4(x0 * t + ts / 2, z0 * t + ts * (bt === 'xBase' ? 1.4 : 0.5)), M);
    const xs = x0 * t, zs = Math.max(ts * 2, z0 * t);
    if (bt === 'sled') {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) parts.push(box(`post-${sx}${sz}`, 'frame-post', 'metal', ts, yu - ts, ts, [sx * xs, (yu - ts) / 2 + ts / 2, sz * zs]));
        parts.push(box(`runner-${sx}`, 'frame-runner', 'metal', ts, ts, 2 * zs + ts, [sx * xs, ts / 2, 0]));
      }
      for (const sz of [-1, 1]) parts.push(box(`rail-${sz}`, 'frame-rail', 'metal', 2 * xs + ts, ts, ts, [0, yu - ts / 2, sz * zs]));
      shelfAt(2 * xs - ts + 2, 2 * zs - ts + 2, p.shelfHeight);
    } else {
      // Two X frames: each bar runs corner to corner from the floor to the underside.
      const zx = zs, len = Math.hypot(yu, 2 * zx), ang = Math.atan2(yu, 2 * zx);
      for (const sx of [-1, 1]) {
        for (const k of [-1, 1]) parts.push(part(`x-bar-${sx}${k}`, 'x-leg', legMat, {fn: 'clipped', inner: {fn: 'cushion', w: ts, h: len + ts * 2, d: ts * 0.8, r: 2}, rot: [k * (Math.PI / 2 - ang), 0, 0], offset: [0, yu / 2, 0], y0: ts * 0.8, y1: yu - ts * 0.8}, [sx * xs, 0, 0]));
        parts.push(box(`x-cap-${sx}`, 'trestle-bearer', legMat, ts, ts * 0.8, 2 * zx + ts, [sx * xs, yu - ts * 0.4, 0]));
        parts.push(box(`x-foot-${sx}`, 'trestle-foot', legMat, ts, ts * 0.8, 2 * zx + ts, [sx * xs, ts * 0.4, 0]));
      }
      parts.push(box('x-stretcher', 'stretcher', legMat, 2 * xs, ts, ts, [0, yu / 2, 0]));
    }
  } else if (bt === 'tripod') {
    const so = Math.tan(Math.max(6, p.legSplay) * Math.PI / 180) * yu;
    // Legs at 90°, 210°, 330°; top ends on a ring, feet outward, everything under the top.
    const dirs = [0, 1, 2].map(k => k / 3 * Math.PI * 2 + Math.PI / 2);
    const R = fitScale(baseOutline, t => dirs.flatMap(a => [[Math.cos(a) * (t * 600 + so + ls / 2), Math.sin(a) * (t * 600 + so + ls / 2)], [Math.cos(a) * (t * 600 + ls / 2), Math.sin(a) * (t * 600 + ls / 2)]]), M) * 600;
    const Rt = Math.max(ls * 1.5, R);
    const sp = Math.max(6, p.legSplay) * Math.PI / 180;
    for (const [k, a] of dirs.entries()) {
      const rot = [Math.sin(a) * -sp, 0, Math.cos(a) * sp];
      parts.push(tiltedLeg(`leg-${k + 1}`, Math.cos(a) * Rt, Math.sin(a) * Rt, yu, rot, len => legProfile(p.legType === 'turned' ? 'turned' : 'tapered', len, ls / 2, p.legTaper)));
    }
    parts.push(part('tripod-ring', 'top-plate', 'frame', {fn: 'lathe', profile: [[0, Rt + ls / 2], [20, Rt + ls / 2]]}, [0, yu - 20, 0], [0, 0, 0], {internal: true}));
    spots = dirs.map(a => [Math.cos(a) * (Rt + so), Math.sin(a) * (Rt + so)]);
  } else if (bt === 'drum') {
    const inset = Math.max(30, p.overhang * 0.5, M);
    const shrunk = d => topOutline(p.topShape, LB - 2 * d, W - 2 * d, {r: p.topShape === 'rect' ? 2 : Math.max(2, p.cornerRadius - d), n: p.shapeN, bow: p.topShape === 'boat' ? p.boatBow : 0});
    // The shrunk shape is checked against the underside and shrunk further if a curved outline needs it.
    let dIn = inset; while (dIn < W / 3 && !fitsInside(baseOutline, shrunk(dIn), M - 1)) dIn += 5;
    parts.push(part('drum', 'drum', legMat, {fn: 'slab', outline: shrunk(dIn), t: yu - 30, profile: ['eased', yu - 30, 3]}, [0, 30, 0]));
    parts.push(part('drum-plinth', 'plinth', 'dark', {fn: 'slab', outline: shrunk(dIn + 25), t: 30.5, profile: ['square', 30, 0]}, [0, 0, 0]));
  }
  if (bt === 'hairpin') {
    const r = Math.max(5, p.tubeSize / 4);
    for (const [x, z] of spots) {
      const sx = Math.sign(x), sz = Math.sign(z), foot = [x - sx * 10, 0, z - sz * 10];
      for (const dx of [-55, 55]) parts.push(part(`hairpin-${sx}${sz}${dx}`, 'hairpin', 'metal', {fn: 'clipped', inner: {fn: 'tube', points: [[x - sx * 40, yu, z + dx * (sx * sz > 0 ? 0.7 : -0.7)], [foot[0], -r, foot[2]]], r}, rot: [0, 0, 0], offset: [0, 0, 0], y0: 0, y1: yu - 4}, [0, 0, 0]));
      parts.push(box(`plate-${sx}${sz}`, 'mount-plate', 'metal', 110, 4, 110, [x - sx * 40, yu - 2, z], [0, 0, 0]));
    }
  }
  if (!spots.length) spots = supportSpots(parts, yu);
  parts.push(...glides(parts));

  const meta = derive(p, {L, W, H, T, yu, spots, open, outline});
  dims.push(...tableDims(p, meta));
  return {family: FAMILY, params: p, parts, meta, dims, sectionX: bt === 'doublePedestal' ? -(LB * 0.27) : 0, detail: {kind: 'edge', title: 'edge', T, profile: [p.edge, T, p.edgeSize]}};
}

/** Floor contact corners for tipping checks when the base is not four legs. */
function supportSpots(parts, yu) { return []; }

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
    // Worst edge of the real floor footprint: load at the top's furthest point beyond that edge.
    const sf = tippingFactor(design, buildMesh, Wn, load);
    // Consoles stand against a wall and are fixed to it (anti-tip bracket): a warning, not an error.
    if (sf < 1 && p.kind !== 'console') add('error', 'tipping', +sf.toFixed(2)); else if (sf < 1.3) add('warn', 'tipping', +sf.toFixed(2));
    if (wt.total > 120) add('warn', 'heavy', wt.total);
  }
  if (surface === 'wood' && p.width > 450) add('info', 'woodMovement', +(p.width * 0.0025 * 3).toFixed(1));
  if (p.drawers && p.width - 2 * p.sideOverhang < 280) add('warn', 'drawerShallow', p.width);
  if (p.overhang > p.length * 0.28 && ['legsApron', 'legsOnly', 'trestle'].includes(p.baseType)) add('warn', 'overhang', p.overhang);
  return issues;
}

/** Convex hull (x, z) of every point where the base touches the floor. */
export function floorHull(compiled, buildMesh) {
  const pts = [];
  for (const q of compiled.parts) {
    if (q.internal || q.role === 'top' || q.role === 'leaf') continue;
    const w = transformPositions(buildMesh(q).positions, q.pos, q.rot);
    for (let i = 0; i < w.length; i += 3) if (w[i + 1] < 6) pts.push([w[i], w[i + 2]]);
  }
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (const p of pts.slice().reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
/** Safety factor against tipping: self weight × lever inside the footprint / edge load × lever outside it. */
export function tippingFactor(compiled, buildMesh, weightN, load) {
  const hull = floorHull(compiled, buildMesh);
  if (hull.length < 3) return 0;
  const top = compiled.parts.filter(q => q.role === 'top' || q.role === 'leaf').flatMap(q => q.geom.outline.map(([x, z]) => [x + q.pos[0], z + q.pos[2]]));
  let worst = 99;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i], b = hull[(i + 1) % hull.length], ex = b[0] - a[0], ez = b[1] - a[1], l = Math.hypot(ex, ez) || 1;
    const n = [ez / l, -ex / l], d = a[0] * n[0] + a[1] * n[1]; // hull is CCW → outward normal
    const nn = d < 0 ? [-n[0], -n[1]] : n, dd = Math.abs(d);
    const ext = Math.max(...top.map(([x, z]) => x * nn[0] + z * nn[1]));
    if (ext - dd > 0) worst = Math.min(worst, weightN * dd / (load * (ext - dd)));
  }
  return worst;
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
  const NAME = {inlay: ['Metal kakma', 'Metal inlay', '3 mm pirinç/metal şerit, yüzeye frezelenmiş kanala yapıştırılır, zımparalanır', '3 mm brass/metal strip glued into a routed channel, flushed'], groove: ['Gölge kanal', 'Shadow groove', '3 × 3 mm freze kanal, kanal içi mat siyah', '3 × 3 mm routed groove, matt black inside'], leg: ['Ayak', 'Leg', 'Masif blok, ham kesit +6 mm; zıvana-lamba ile kuşağa', 'Solid blank, +6 mm rough section; mortise & tenon to apron'], apron: ['Kuşak', 'Apron', 'Masif, iki uçta 25 mm zıvana dili', 'Solid, 25 mm tenon each end'], 'corner-block': ['Köşe takozu', 'Corner block', 'Vida + tutkal, M8 askı cıvatası', 'Glue + screws, M8 hanger bolt'], stretcher: ['Alt kuşak', 'Stretcher', 'Masif, kavelalı', 'Solid, dowelled'],
    'drawer-front': ['Çekmece önü', 'Drawer front', 'Kuşakla aynı malzeme, 3 mm derz', 'Same as apron, 3 mm reveal'], 'drawer-box': ['Çekmece kutusu', 'Drawer box', '12 mm huş kontrplak, 6 mm taban; tam çekilir ray', '12 mm birch ply, 6 mm bottom; full-extension runners'], pull: ['Kulp', 'Pull', 'Metal', 'Metal'],
    shelf: ['Alt raf', 'Lower shelf', 'Ayaklara gizli kavela', 'Concealed dowels to legs'], 'shelf-slat': ['Raf çıtası', 'Shelf slat', 'Masif çıta, 8 mm boşluk', 'Solid slat, 8 mm gap'], 'shelf-rail': ['Raf taşıyıcı kayıt', 'Shelf rail', 'Masif, ayaklara zıvana', 'Solid, tenoned into the legs'], 'trestle-post': ['Köprü ayak dikmesi', 'Trestle post', 'Masif, alt ve üst kayıta zıvana', 'Solid, tenoned into foot and bearer'], 'back-panel': ['Arka panel', 'Modesty panel', 'Kuşağa vida', 'Screwed to apron'],
    'trestle-bearer': ['Köprü ayak üst kayıtı', 'Trestle bearer', 'Masif, tablaya Z-klips', 'Solid, Z-clips to top'], 'trestle-foot': ['Köprü ayak tabanı', 'Trestle foot', 'Masif, alt kenar 3 mm boşaltma', 'Solid, 3 mm relief underneath'],
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
