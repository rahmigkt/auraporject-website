// Bedroom as a SET (takım). AURA delivers bedroom furniture as a set, never a single piece: the customer designs
// one piece — bed, wardrobe, chest or bedside unit — and the other pieces are proposed in the same style and
// features (headboard ↔ door fronts ↔ drawer fronts, handles, legs, edges, materials). The set is shown together.
// The whole-room AI project (live room design) is a separate future flow and not part of this module.
// Units: mm. Each piece is built in its own frame (front = +z); the set view lines them up like a showroom.
import * as B from './bedroom.js';
import {clamp} from './rng.js';
import {bounds, transformPositions, roundedRectLoop} from './mesh.js';
import {linePart} from './lines.js';

export const FAMILY = 'bedroom';
/** Kinds are the piece in focus; the design always carries the whole set. */
export const KINDS = {bed: {}, wardrobe: {}, dresser: {}, nightstand: {}};

const BED_RANGE_KEYS = ['mattressWidth', 'mattressLength', 'mattressThickness', 'legHeight', 'railHeight', 'border', 'plinthInset', 'headHeight', 'headThickness', 'headExtend', 'headRadius', 'scallops', 'channelCount', 'tuftSpacing', 'slatWidth', 'slatGap', 'wingDepth', 'frameWidth', 'footHeight', 'postSize', 'postHeight', 'legSize', 'legTaper'];
const BED_ENUM_KEYS = ['headType', 'headShape', 'bedBase', 'legType', 'footboard', 'storage', 'bedding', 'stitch'];
const pick = (o, keys) => Object.fromEntries(keys.map(k => [k, o[k]]));

export const RANGES = {
  ...pick(B.RANGES, BED_RANGE_KEYS),
  nsWidth: [380, 650, 10], nsDepth: [320, 460, 5], nsRows: [1, 3, 1], nsHeightOffset: [-40, 120, 5],
  wdWidth: [800, 3600, 10], wdHeight: [1900, 2600, 10], wdDepth: [520, 680, 5], wdNicheWidth: [700, 1400, 10], battenWidth: [15, 90, 1], battenGap: [8, 50, 1],
  drWidth: [800, 1800, 10], drDepth: [400, 520, 5], drHeight: [720, 1250, 5], drRows: [2, 6, 1], drColumns: [1, 3, 1],
  topThickness: [12, 45, 1], topOverhang: [0, 30, 1], cornerRadius: [0, 200, 5], graduation: [0, 1, 0.05], fluteWidth: [12, 60, 1], caseBaseHeight: [0, 260, 5],
  mirrorHeight: [500, 1200, 10], mirrorWidth: [0.3, 1, 0.05]
};
export const ENUMS = {
  ...pick(B.ENUMS, BED_ENUM_KEYS),
  wdDoorType: ['hinged', 'sliding'], wdDoorStyle: ['flat', 'grooved', 'slats', 'fluted', 'framed', 'cane', 'mirror'], wdHandle: ['bar', 'edge', 'knob', 'leather', 'push'], wdNiche: ['none', 'vanity', 'desk', 'shelves'], wdBase: ['plinth', 'recessed', 'legs'],
  nsBase: ['wall', 'legs', 'plinth', 'recessed'], nsLayout: ['stack', 'niche'],
  drLayout: ['stack', 'split', 'topSplit'], drBase: ['legs', 'plinth', 'recessed'], mirror: ['none', 'rect', 'arch', 'round', 'capsule'],
  frontStyle: B.ENUMS.frontStyle, pull: B.ENUMS.pull, caseEdge: B.ENUMS.caseEdge, caseLine: B.ENUMS.caseLine,
  view: ['set', 'piece'], setMatch: ['on', 'off']
};
export const DEFAULTS = {
  ...pick(B.DEFAULTS, [...BED_RANGE_KEYS, ...BED_ENUM_KEYS]), headExtend: 0, railHeight: 260, legHeight: 60,
  nsWidth: 500, nsDepth: 400, nsRows: 1, nsHeightOffset: 30, nsBase: 'legs', nsLayout: 'stack',
  wdWidth: 2000, wdHeight: 2300, wdDepth: 600, wdNicheWidth: 900, battenWidth: 40, battenGap: 18, wdDoorType: 'hinged', wdDoorStyle: 'flat', wdHandle: 'edge', wdNiche: 'none', wdBase: 'plinth',
  drWidth: 1200, drDepth: 450, drHeight: 800, drRows: 3, drColumns: 2, drLayout: 'stack', drBase: 'plinth', mirror: 'none',
  frontStyle: 'flat', pull: 'edge', caseEdge: 'eased', caseLine: 'none', topThickness: 22, topOverhang: 0, cornerRadius: 0, graduation: 0.3, fluteWidth: 24, caseBaseHeight: 120,
  mirrorHeight: 800, mirrorWidth: 0.6, view: 'set', setMatch: 'on', kind: 'bed'
};

export function normalize(input = {}) {
  const p = {...DEFAULTS};
  for (const [k, [lo, hi, step]] of Object.entries(RANGES)) { const v = Number(input[k]); if (Number.isFinite(v)) p[k] = +(Math.round(clamp(v, lo, hi) / step) * step).toFixed(3); }
  for (const [k, list] of Object.entries(ENUMS)) if (list.includes(input[k])) p[k] = input[k];
  p.kind = KINDS[input.kind] ? input.kind : 'bed';
  const bed = B.normalize({...pick(p, [...BED_RANGE_KEYS, ...BED_ENUM_KEYS]), kind: 'bed', integratedNight: 'none'});
  Object.assign(p, pick(bed, [...BED_RANGE_KEYS, ...BED_ENUM_KEYS]));
  if (p.wdNiche !== 'none' && p.wdWidth < p.wdNicheWidth + 900) p.wdNiche = 'none';
  return p;
}

// ---- Set language: the piece in focus proposes the others ---------------------------------------------
// One vocabulary maps across pieces: headboard type ↔ wardrobe door face ↔ drawer front, handles, legs, base.
const HEAD_TO_FRONT = {slats: 'grooved', channel: 'fluted', hChannel: 'grooved', cane: 'cane', tufted: 'framed', panels: 'framed', framed: 'framed', boiserie: 'framed', panel: 'flat', upholstered: 'flat', wingback: 'flat', split: 'flat'};
const HEAD_TO_DOOR = {slats: 'slats', channel: 'fluted', hChannel: 'grooved', cane: 'cane', tufted: 'framed', panels: 'framed', framed: 'framed', boiserie: 'framed', panel: 'flat', upholstered: 'flat', wingback: 'flat', split: 'flat'};
const DOOR_TO_HEAD = {slats: 'slats', fluted: 'channel', grooved: 'hChannel', cane: 'cane', framed: 'framed', flat: 'upholstered', mirror: 'upholstered'};
const DOOR_TO_FRONT = {slats: 'grooved', fluted: 'fluted', grooved: 'grooved', cane: 'cane', framed: 'framed', flat: 'flat', mirror: 'flat'};
const FRONT_TO_DOOR = {flat: 'flat', framed: 'framed', fluted: 'fluted', cane: 'cane', grooved: 'grooved'};
const FRONT_TO_HEAD = {flat: 'upholstered', framed: 'framed', fluted: 'channel', cane: 'cane', grooved: 'slats'};
const HANDLE_TO_PULL = {bar: 'bar', edge: 'edge', knob: 'knob', leather: 'leather', push: 'none'};
const PULL_TO_HANDLE = {bar: 'bar', edge: 'edge', knob: 'knob', leather: 'leather', none: 'push', ring: 'knob'};
const LEGGY = ['round', 'roundTaper', 'squareTaper', 'square', 'cone', 'block'];

/** Propose the other pieces from the one in focus (only when set matching is on). Returns new params. */
export function harmonize(params, focus = params.kind) {
  const p = {...params}, before = params.bedBase;
  if (p.setMatch === 'off') return p;
  const legsFromBed = () => {
    const legs = LEGGY.includes(p.legType) && p.bedBase !== 'floating';
    p.nsBase = p.bedBase === 'floating' ? 'wall' : legs ? 'legs' : p.legType === 'hidden' ? 'recessed' : 'plinth';
    p.drBase = legs ? 'legs' : p.legType === 'hidden' ? 'recessed' : 'plinth';
    p.wdBase = legs ? 'legs' : 'recessed';
  };
  if (focus === 'bed') {
    p.frontStyle = HEAD_TO_FRONT[p.headType] || p.frontStyle; p.wdDoorStyle = HEAD_TO_DOOR[p.headType] || p.wdDoorStyle;
    if (p.headType === 'slats') { p.battenWidth = clamp(p.slatWidth, 20, 80); p.battenGap = clamp(p.slatGap, 10, 40); }
    if (['rounded', 'capsule', 'arch'].includes(p.headShape)) { p.cornerRadius = Math.max(p.cornerRadius, 40); p.caseEdge = p.caseEdge === 'square' ? 'eased' : p.caseEdge; if (p.mirror !== 'none') p.mirror = p.headShape === 'arch' ? 'arch' : p.headShape === 'capsule' ? 'capsule' : 'round'; }
    if (p.headShape === 'rect' || p.headShape === 'stepped') { p.cornerRadius = Math.min(p.cornerRadius, 10); if (p.mirror !== 'none') p.mirror = 'rect'; }
    legsFromBed();
  } else if (focus === 'wardrobe') {
    p.headType = DOOR_TO_HEAD[p.wdDoorStyle] || p.headType; p.frontStyle = DOOR_TO_FRONT[p.wdDoorStyle] || p.frontStyle; p.pull = HANDLE_TO_PULL[p.wdHandle] || p.pull;
    if (p.wdDoorStyle === 'slats') { p.slatWidth = clamp(p.battenWidth, 25, 140); p.slatGap = clamp(p.battenGap, 6, 80); }
    if (p.wdBase === 'legs') { p.nsBase = 'legs'; p.drBase = 'legs'; if (!LEGGY.includes(p.legType)) p.legType = 'roundTaper'; if (p.bedBase === 'baza' || p.bedBase === 'floating') p.bedBase = 'frame'; }
    else { p.drBase = p.wdBase; p.nsBase = p.wdBase === 'recessed' ? 'wall' : 'plinth'; }
  } else {
    p.wdDoorStyle = FRONT_TO_DOOR[p.frontStyle] || p.wdDoorStyle; p.headType = FRONT_TO_HEAD[p.frontStyle] || p.headType; p.wdHandle = PULL_TO_HANDLE[p.pull] || p.wdHandle;
    const base = focus === 'dresser' ? p.drBase : p.nsBase;
    if (base === 'legs') { p.wdBase = 'legs'; if (!LEGGY.includes(p.legType)) p.legType = 'roundTaper'; if (focus === 'dresser') p.nsBase = 'legs'; else p.drBase = 'legs'; }
    else if (base !== 'wall') { p.wdBase = base; if (focus === 'dresser') p.nsBase = base; else p.drBase = base; }
  }
  // If the proposal changed the bed base, keep the mattress top in the comfortable band (≤ 600 mm).
  if (p.bedBase !== before) for (let i = 0; i < 20; i++) {
    const top = B.compileBed(B.normalize({...pick(p, [...BED_RANGE_KEYS, ...BED_ENUM_KEYS]), kind: 'bed'})).meta.mattressTop;
    if (top <= 600) break; if (p.railHeight > 160) p.railHeight -= 20; else p.legHeight = Math.max(0, p.legHeight - 20);
  }
  return p;
}

// ---- Transforms ---------------------------------------------------------------------------------------
function place(parts, {x = 0, z = 0, prefix = '', unit}) {
  return parts.map(q => ({...q, id: prefix + q.id, pos: [q.pos[0] + x, q.pos[1], q.pos[2] + z], unit: q.unit || unit}));
}
const part = (id, role, mat, geom, pos, rot = [0, 0, 0], extra = {}) => ({id, role, mat, geom, pos, rot, ...extra});
const box = (id, role, mat, w, h, d, pos, extra = {}, r = 2) => part(id, role, mat, {fn: 'cushion', w, h, d, r: Math.min(r, w / 3, h / 3, d / 3)}, pos, [0, 0, 0], extra);

// ---- Wardrobe (freestanding or fitted; local frame: width along x, front = +z) -------------------------
export function wardrobe(p, L) {
  const parts = [], d = p.wdDepth, H = p.wdHeight, plinth = p.wdBase === 'legs' ? Math.max(100, p.caseBaseHeight) : 80, fill = 0, topT = 25;
  const body = H - plinth - topT, front = 19, zf = d / 2 - front / 2, gap = 3;
  // Sections: optional open niche (vanity / desk / shelves) in the middle of the run.
  const niche = p.wdNiche !== 'none' && L > p.wdNicheWidth + 1200 ? p.wdNicheWidth : 0;
  const nx0 = -niche / 2, nx1 = niche / 2;

  // Top (crown) with the shared edge; base on a recessed plinth or on legs.
  parts.push(box('top', 'case-top', 'case', L + 2 * p.topOverhang, topT, d + p.topOverhang, [0, H - topT / 2, p.topOverhang / 2], {}, p.caseEdge === 'bullnose' ? 10 : p.caseEdge === 'square' ? 1 : 4));
  if (p.wdBase === 'legs') {
    const xs = L / 2 - 60, zs = d / 2 - 70, legs = [-xs, ...(L > 1600 ? [-L / 6, L / 6] : []), xs];
    for (const x of legs) for (const z of [-zs, zs]) parts.push(part(`leg-${x}-${z}`, 'leg', 'wood', {fn: 'lathe', profile: [[0, Math.min(18, p.legSize * 0.4)], [plinth, Math.min(24, p.legSize * 0.5)]]}, [x, 0, z]));
  } else parts.push(box('plinth', 'plinth', p.wdBase === 'recessed' ? 'dark' : 'case', L - (p.wdBase === 'recessed' ? 60 : 0), plinth, d - front - (p.wdBase === 'recessed' ? 60 : 0), [0, plinth / 2, -front / 2 - (p.wdBase === 'recessed' ? 30 : 0)], {}, 1));
  const runs = niche ? [[-L / 2, nx0], [nx1, L / 2]] : [[-L / 2, L / 2]];
  const doorH = body - 2 * gap, y = plinth + gap + doorH / 2;
  let doorCount = 0;
  for (const [a, b] of runs) {
    const len = b - a;
    // One carcass per door run; the open niche between runs has its own back, sides and top.
    parts.push(box(`carcass-${a}`, 'wardrobe-carcass', 'case', len, body, d - front, [(a + b) / 2, plinth + body / 2, -front / 2], {}, 1));
    if (p.wdDoorType === 'sliding') {
      // Two-track sliding: panels alternate front/back track, overlapping by 40 mm.
      const n = Math.max(2, Math.round(len / 1000)), w = (len + (n - 1) * 40) / n;
      for (let i = 0; i < n; i++) { const x = a + w / 2 + i * (w - 40), zt = zf + (i % 2 ? 0 : 24); doorFace(parts, p, `door-${doorCount++}`, x, y, zt, w, doorH, i % 2 ? 1 : -1); }
      parts.push(box(`track-${a}`, 'track', 'metal', len, 12, 50, [(a + b) / 2, plinth + body - 6, zf + 12], {}, 1));
    } else {
      const n = Math.max(1, Math.ceil(len / 600)), w = len / n;
      for (let i = 0; i < n; i++) doorFace(parts, p, `door-${doorCount++}`, a + w * (i + 0.5), y, zf, w - gap, doorH, i % 2 ? -1 : 1);
    }
    // Interior (visible in structure mode): hanging rail, hat shelf, a drawer stack in the first section.
    parts.push(box(`shelf-top-${a}`, 'wardrobe-shelf', 'frame', len - 40, 18, d - 80, [(a + b) / 2, plinth + body - 330, -front / 2], {internal: true}, 1));
    parts.push(part(`rail-${a}`, 'hanging-rail', 'metal', {fn: 'tube', points: [[a + 20, plinth + body - 380, -front / 2], [b - 20, plinth + body - 380, -front / 2]], r: 12}, [0, 0, 0], [0, 0, 0], {internal: true}));
    for (let k = 0; k < 3; k++) parts.push(box(`drawer-${a}-${k}`, 'wardrobe-drawer', 'frame', Math.min(560, len) - 60, 180, d - 120, [a + Math.min(560, len) / 2, plinth + 120 + k * 200, -front / 2], {internal: true}, 1));
  }
  if (niche) {
    // Open niche: back panel, worktop at vanity/desk height, floating shelves, LED under each shelf.
    parts.push(box('niche-back', 'niche-back', 'case', niche, body, 12, [0, plinth + body / 2, -d / 2 + 6], {}, 1));
    parts.push(box('niche-bottom', 'niche-shelf', 'case', niche, 19, d - 20, [0, plinth + 9.5, -10], {}, 1));
    for (const sx of [nx0, nx1]) parts.push(box(`niche-side-${sx}`, 'niche-side', 'case', 19, body, d - 30, [sx + (sx < 0 ? 9.5 : -9.5), plinth + body / 2, -15], {}, 1));
    const top = p.wdNiche === 'shelves' ? 0 : p.wdNiche === 'vanity' ? 760 : 740;
    if (top) {
      parts.push(box('niche-top', 'niche-top', 'case', niche - 38, 30, d - 40, [0, top - 15, -10], {}, 2));
      parts.push(box('niche-drawer', 'drawer-front', 'case', niche - 44, 120, 19, [0, top - 95, d / 2 - 40], {}, 2));
      if (p.wdNiche === 'vanity') { parts.push(box('niche-mirror', 'mirror', 'mirror', niche * 0.6, 700, 6, [0, top + 600, -d / 2 + 40], {}, 1)); }
    }
    const shelves = p.wdNiche === 'shelves' ? [500, 900, 1300, 1700] : [top + 900, top + 1250];
    for (const ys of shelves) if (ys < plinth + body - 100) {
      parts.push(box(`niche-shelf-${ys}`, 'niche-shelf', 'case', niche - 38, 28, d - 80, [0, ys, -30], {}, 2));
      if (p.ledCove === 'on') parts.push(box(`niche-led-${ys}`, 'led', 'led', niche - 60, 4, 10, [0, ys - 16, d / 2 - 90], {}, 1));
    }
  }
  return {parts, height: H, doors: doorCount, niche};
}
/** One door leaf with its face style and handle (handle side: +1 right edge, −1 left edge). */
function doorFace(parts, p, id, x, y, z, w, h, side) {
  const t = 19, st = p.wdDoorStyle;
  if (st === 'fluted') { parts.push(box(id, 'wardrobe-door', 'case', w, h, t - 6, [x, y, z - 3], {}, 1)); parts.push(part(`${id}-reeds`, 'reeds', 'case', {fn: 'ribbed', w: w - 2, h: h - 2, pitch: p.fluteWidth * 1.4, depth: 7}, [x, y, z + t / 2 - 6])); }
  else if (st === 'slats') { parts.push(box(id, 'wardrobe-door', 'case', w, h, t - 8, [x, y, z - 4], {}, 1)); const pitch = p.battenWidth + p.battenGap * 0.6, n = Math.max(2, Math.floor(w / pitch)); for (let i = 0; i < n; i++) parts.push(box(`${id}-s${i}`, 'batten', 'case', p.battenWidth * 0.8, h - 4, 10, [x - w / 2 + (i + 0.5) * w / n, y, z + t / 2 - 3], {}, 1)); }
  else {
    parts.push(box(id, 'wardrobe-door', 'case', w, h, t, [x, y, z], {}, 1));
    if (st === 'grooved') for (let k = 1; k < Math.max(2, Math.round(w / 110)); k++) parts.push(box(`${id}-g${k}`, 'seam', 'dark', 3, h - 2, 1, [x - w / 2 + k * w / Math.max(2, Math.round(w / 110)), y, z + t / 2 + 0.2], {}, 0.4));
    if (st === 'framed') { const m = Math.min(90, w * 0.16); parts.push(box(`${id}-p`, 'front-panel', 'case', w - 2 * m, h - 2 * m, 5, [x, y, z + t / 2 + 1.5], {}, 1)); }
    if (st === 'cane') parts.push(box(`${id}-c`, 'cane', 'cane', w - 140, h - 260, 3, [x, y + 20, z + t / 2 + 0.8], {}, 0.5));
    if (st === 'mirror') parts.push(box(`${id}-m`, 'mirror', 'mirror', w - 60, h - 200, 4, [x, y, z + t / 2 + 1.5], {}, 0.5));
    if (st === 'flat' && p.caseLine !== 'none') parts.push(linePart(`${id}-line`, p.caseLine, roundedRectLoop(w - 80, h - 80, 2, x, y, 2).map(([u, v]) => [u, v, z + t / 2 - (p.caseLine === 'groove' ? 0.7 : 1.0)])));
  }
  const zf = z + t / 2 + (st === 'fluted' ? 6 : st === 'slats' ? 5 : 0), hx = x + side * (w / 2 - 50);
  if (p.wdHandle === 'bar') parts.push(part(`${id}-h`, 'pull', 'metal', {fn: 'tube', points: [[hx, y - 350, zf], [hx, y - 350, zf + 30], [hx, y + 350, zf + 30], [hx, y + 350, zf]], r: 7}, [0, 0, 0]));
  if (p.wdHandle === 'knob') parts.push(part(`${id}-h`, 'pull', 'metal', {fn: 'lathe', profile: [[0, 7], [16, 7], [19, 16], [28, 17], [30, 11]]}, [hx, y, zf], [Math.PI / 2, 0, 0]));
  if (p.wdHandle === 'leather') parts.push(box(`${id}-h`, 'pull', 'leather', 40, 160, 5, [hx, y + 80, zf + 2.5], {}, 1));
  if (p.wdHandle === 'edge') parts.push(box(`${id}-h`, 'pull', 'dark', 16, Math.min(900, h * 0.45), 2, [x + side * (w / 2 - 9), y, zf + 0.5], {}, 1));
}


// ---- Pieces ----------------------------------------------------------------------------------------------
function caseCommon(p) {
  return {frontStyle: p.frontStyle, pull: p.pull, caseEdge: p.caseEdge, caseLine: p.caseLine, topThickness: p.topThickness, topOverhang: p.topOverhang, cornerRadius: p.cornerRadius, graduation: p.graduation, fluteWidth: p.fluteWidth, legType: LEGGY.includes(p.legType) ? p.legType : 'roundTaper', legSize: Math.min(45, p.legSize)};
}
function pieces(p) {
  const bedP = B.normalize({...pick(p, [...BED_RANGE_KEYS, ...BED_ENUM_KEYS]), kind: 'bed', integratedNight: 'none'});
  const bed = B.compileBed(bedP);
  const nsH = bed.meta.mattressTop + p.nsHeightOffset; // research: bedside top level with the mattress, at most ~10 cm higher
  const ns = B.compileCase(B.normalize({...caseCommon(p), kind: 'nightstand', width: p.nsWidth, depth: p.nsDepth, height: nsH, rows: p.nsRows, caseLayout: p.nsLayout, caseBase: p.nsBase, baseHeight: p.nsBase === 'legs' ? Math.max(120, Math.min(p.caseBaseHeight, nsH - 250)) : p.nsBase === 'wall' ? 0 : 70, columns: 1}));
  const dr = B.compileCase(B.normalize({...caseCommon(p), kind: 'dresser', width: p.drWidth, depth: p.drDepth, height: p.drHeight, rows: p.drRows, columns: p.drColumns, caseLayout: p.drLayout, caseBase: p.drBase, baseHeight: p.drBase === 'legs' ? Math.max(120, p.caseBaseHeight) : 70, mirror: p.mirror, mirrorHeight: p.mirrorHeight, mirrorWidth: p.mirrorWidth}));
  const wd = wardrobe(p, p.wdWidth);
  return {bedP, bed, ns, dr, wd, nsH};
}

export function compile(raw) {
  const p = normalize(raw), {bedP, bed, ns, dr, wd, nsH} = pieces(p), parts = [], bm = bed.meta;
  const BW = bm.baseWidth, BL = bm.baseLength, ht = bedP.headThickness;
  const headBack = -BL / 2 - ht;
  let meta, dims, sectionX = 0;
  if (p.view === 'piece') {
    const one = {bed: [bed.parts, 'bed'], nightstand: [ns.parts, 'nightstand'], dresser: [dr.parts, 'dresser'], wardrobe: [wd.parts, 'wardrobe']}[p.kind];
    parts.push(...place(one[0], {unit: one[1]}));
    const src = {bed, nightstand: ns, dresser: dr}[p.kind];
    meta = {...(src?.meta || {kind: 'wardrobe', overall: {width: Math.round(p.wdWidth + 2 * p.topOverhang), depth: Math.round(p.wdDepth + p.topOverhang), height: p.wdHeight}, doors: wd.doors}), kind: p.kind, piece: true};
    dims = src?.dims || wardrobeDims(p);
  } else {
    // Showroom line-up: wardrobe | nightstand · bed · nightstand | chest. Backs on one line, 450 mm between pieces.
    const back = 0, gap = 450, nsGap = 60;
    const bedZ = back - headBack;
    parts.push(...place(bed.parts, {z: bedZ, prefix: 'bed-', unit: 'bed'}));
    const nsX = BW / 2 + nsGap + p.nsWidth / 2, nsZ = back + p.nsDepth / 2;
    for (const side of [-1, 1]) parts.push(...place(ns.parts, {x: side * nsX, z: nsZ, prefix: `ns${side < 0 ? 'L' : 'R'}-`, unit: 'nightstand'}));
    const leftEdge = -(nsX + p.nsWidth / 2), rightEdge = nsX + p.nsWidth / 2;
    const wdX = leftEdge - gap - p.wdWidth / 2, drX = rightEdge + gap + p.drWidth / 2;
    parts.push(...place(wd.parts, {x: wdX, z: back + p.wdDepth / 2, prefix: 'wd-', unit: 'wardrobe'}));
    parts.push(...place(dr.parts, {x: drX, z: back + p.drDepth / 2, prefix: 'dr-', unit: 'dresser'}));
    const x0 = wdX - p.wdWidth / 2, x1 = drX + p.drWidth / 2;
    // Centre the composition.
    const cx = (x0 + x1) / 2;
    for (const q of parts) q.pos = [q.pos[0] - cx, q.pos[1], q.pos[2]];
    meta = {kind: p.kind, set: true, overall: {width: Math.round(x1 - x0), depth: Math.round(Math.max(bedZ + BL / 2 + 40, p.wdDepth)), height: Math.round(Math.max(p.wdHeight, bedP.headHeight, p.drHeight + (p.mirror !== 'none' ? p.mirrorHeight : 0)))},
      pieces: {wardrobe: [Math.round(p.wdWidth), p.wdDepth, p.wdHeight], bed: [bm.overall.width, bm.overall.depth, bm.overall.height], nightstand: [p.nsWidth, p.nsDepth, Math.round(nsH)], dresser: [p.drWidth, p.drDepth, p.drHeight]}};
    sectionX = Math.round(-cx);
    dims = setDims(meta, {wdX: wdX - cx, drX: drX - cx, bedX: -cx, p, nsH, nsX});
  }
  Object.assign(meta, {mattress: bm.mattress, mattressTop: bm.mattressTop, headAbove: bm.headAbove, nsHeight: Math.round(nsH), wardrobeDoors: wd.doors, drawers: dr.meta.drawers, bedWidth: BW});
  return {family: FAMILY, params: p, parts, meta, dims, sectionX, detail: null};
}

function wardrobeDims(p) {
  const W = p.wdWidth, H = p.wdHeight, D = p.wdDepth, out = [];
  out.push({view: 'front', a: [-W / 2, 0], b: [W / 2, 0], off: 70, text: `${W}`, orient: 'h'});
  out.push({view: 'front', a: [W / 2, 0], b: [W / 2, H], off: 80, text: `${H}`, orient: 'v'});
  out.push({view: 'side', a: [-D / 2, 0], b: [D / 2, 0], off: 70, text: `${D}`, orient: 'h'});
  out.push({view: 'top', a: [-W / 2, -D / 2], b: [W / 2, -D / 2], off: -60, text: `${W}`, orient: 'h'});
  return out;
}
function setDims(m, {wdX, drX, bedX, p, nsH, nsX}) {
  const out = [], [ww, , wh] = m.pieces.wardrobe, [bw, , bh] = m.pieces.bed, [dw] = m.pieces.dresser;
  out.push({view: 'front', a: [wdX - ww / 2, 0], b: [wdX + ww / 2, 0], off: 70, text: `${ww}`, orient: 'h'});
  out.push({view: 'front', a: [wdX - ww / 2, 0], b: [wdX - ww / 2, wh], off: -70, text: `${wh}`, orient: 'v'});
  out.push({view: 'front', a: [bedX - bw / 2, 0], b: [bedX + bw / 2, 0], off: 70, text: `${bw}`, orient: 'h'});
  out.push({view: 'front', a: [bedX + bw / 2, 0], b: [bedX + bw / 2, bh], off: 40, text: `${bh}`, orient: 'v'});
  out.push({view: 'front', a: [bedX + nsX + p.nsWidth / 2, 0], b: [bedX + nsX + p.nsWidth / 2, nsH], off: 30, text: `${Math.round(nsH)}`, orient: 'v'});
  out.push({view: 'front', a: [drX - dw / 2, 0], b: [drX + dw / 2, 0], off: 70, text: `${dw}`, orient: 'h'});
  out.push({view: 'front', a: [drX + dw / 2, 0], b: [drX + dw / 2, p.drHeight], off: 40, text: `${p.drHeight}`, orient: 'v'});
  out.push({view: 'top', a: [-m.overall.width / 2, 0], b: [m.overall.width / 2, 0], off: -60, text: `${m.overall.width}`, orient: 'h'});
  out.push({view: 'section', a: [0, 0], b: [0, bh], off: -120, text: `${bh}`, orient: 'v'});
  return out;
}

// ---- Checks and parts list -----------------------------------------------------------------------------
export function weights(compiled, materials, buildMesh) { return B.weights(compiled, materials, buildMesh); }
export function validate(design, materials = null, buildMesh = null) {
  const {params: p, meta: m} = design, issues = [], add = (level, code, value) => issues.push({level, code, value});
  if (m.mattressTop < 400) add('warn', 'bedLow', m.mattressTop); else if (m.mattressTop > 650) add('warn', 'bedHigh', m.mattressTop);
  if (m.headAbove < 250) add('warn', 'headLow', m.headAbove);
  if (p.nsHeightOffset > 100) add('warn', 'nightHeight', m.nsHeight);
  if (p.wdHeight > 2200 || p.drHeight > 750) add('info', 'antiTip', 0);
  if (p.wdDepth < 560) add('warn', 'wardrobeShallow', p.wdDepth);
  if (p.mattressWidth >= 1400) add('info', 'centreSupport', p.mattressWidth);
  return issues;
}
const UNIT_NAMES = {wardrobe: ['Gardırop', 'Wardrobe'], bed: ['Karyola', 'Bed'], nightstand: ['Komodin', 'Bedside unit'], dresser: ['Şifonyer', 'Chest of drawers']};
const UNIT_ORDER = ['wardrobe', 'bed', 'nightstand', 'dresser'];
const EXTRA_ROLE = {
  'wardrobe-carcass': ['Gövde', 'Carcass', '18 mm kontrplak/MDF modüller (≤ 1200 mm), 8 mm arkalık; duvara sabitleme (EN 14749)', '18 mm ply/MDF modules (≤ 1200 mm), 8 mm back; wall fixing (EN 14749)'],
  'wardrobe-door': ['Kapak', 'Door', '19 mm, 3 mm derz; frenli menteşe (4–5 adet) veya sürgü rayı', '19 mm, 3 mm reveal; soft-close hinges (4–5) or sliding gear'], track: ['Sürgü rayı', 'Sliding track', 'Alüminyum, çift ray', 'Aluminium, double track'],
  'wardrobe-shelf': ['İç raf (iç)', 'Shelf (internal)', '18 mm, kenar bantlı', '18 mm, edge-banded'], 'hanging-rail': ['Askı borusu (iç)', 'Hanging rail (internal)', 'Oval çelik boru', 'Oval steel tube'], 'wardrobe-drawer': ['İç çekmece (iç)', 'Internal drawer', 'Tam çekilir frenli ray', 'Soft-close full-extension runners'],
  'niche-back': ['Niş arkalığı', 'Niche back', 'Kaplama / lake', 'Veneer / lacquer'], 'niche-side': ['Niş yanı', 'Niche side', '19 mm', '19 mm'], 'niche-top': ['Makyaj / çalışma tablası', 'Vanity / desk top', '30 mm, kablo geçişli', '30 mm, cable outlet'], 'niche-shelf': ['Niş rafı', 'Niche shelf', '28 mm, gizli konsol', '28 mm, concealed brackets'],
  led: ['LED şerit', 'LED strip', '2700 K, profil + difüzör', '2700 K, profile + diffuser'], batten: ['Çıta', 'Batten', 'Masif / kaplamalı MDF', 'Solid / veneered MDF']
};
export function setBom(compiled, materials, lang, buildMesh, materialText) {
  const groups = new Map(), tr = lang === 'tr';
  let fabricArea = 0;
  // A set is ordered as a set: in the piece view the parts list still covers every piece.
  const full = compiled.params.view === 'set' ? compiled : compile({...compiled.params, view: 'set'});
  for (const q of full.parts) {
    if (q.decor || q.role === 'seam' || q.role === 'niche-floor') continue;
    const unit = q.unit || 'bed', m = buildMesh(q), b = bounds(transformPositions(m.positions, [0, 0, 0], q.rot)), size = b.size.map(v => Math.round(v)).sort((a, c) => c - a);
    if (q.mat === 'fabric') fabricArea += B.meshArea(m) * (['baza', 'rail'].includes(q.role) ? 0.75 : 1);
    const key = `${unit}|${q.role}|${q.mat}|${size.join('x')}`, g = groups.get(key) || {unit, role: q.role, mat: q.mat, size, qty: 0, internal: !!q.internal};
    g.qty += q.qty || 1; groups.set(key, g);
  }
  const rows = [];
  for (const unit of UNIT_ORDER) for (const g of [...groups.values()].filter(x => x.unit === unit)) {
    const n = EXTRA_ROLE[g.role] || B.ROLE[g.role] || [g.role, g.role, '', ''], u = UNIT_NAMES[unit];
    rows.push({code: `S${String(rows.length + 1).padStart(2, '0')}`, nameTr: `${u[0]} — ${n[0]}`, nameEn: `${u[1]} — ${n[1]}`, qty: g.qty, size: g.size, material: materialText(g.mat), specTr: n[2], specEn: n[3], internal: g.internal});
  }
  rows.push({code: `S${String(rows.length + 1).padStart(2, '0')}`, nameTr: 'Bağlantı ve sabitleme seti', nameEn: 'Fittings and fixings', qty: 1, size: [0, 0, 0], material: tr ? 'Çelik' : 'Steel', specTr: 'Karyola köşebent + M8; başlık askı kayıtı; gardırop ve şifonyer için devrilme önleyici (EN 14749)', specEn: 'Bed corner brackets + M8; headboard cleat; anti-tip for wardrobe and chest (EN 14749)', internal: false});
  return {rows, totals: {weightKg: B.weights(full, materials, buildMesh), fabricMetres: fabricArea > 0 ? +(fabricArea / 1e6 / 1.4 * 1.15).toFixed(1) : undefined, fabricAreaM2: fabricArea > 0 ? +(fabricArea / 1e6).toFixed(2) : undefined, mattress: compiled.meta.mattress, wardrobeDoors: compiled.meta.wardrobeDoors, drawers: compiled.meta.drawers}};
}
