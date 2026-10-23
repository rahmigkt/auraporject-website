// RİTMO in the studio: case goods built the way panel furniture is made — wardrobe, bedside table, chest of
// drawers and vanity (more door / drawer pieces use the same engine). The construction rules come from the Ritmo
// configurator and Morti's panel defaults and are kept exactly:
//   carcass and fronts 18 mm MDF (solid-wood panels may be thicker: 20–30 mm),
//   back 8 mm, set in a groove 10 mm in from the back edge (7 mm into the groove on every side),
//   2 mm joint clearance and 2 mm reveals between fronts,
//   side-mounted runners with 12.7 mm clearance per side (drawer box size from drawerFit),
//   12 mm drawer-box sides with a 6 mm bottom, hinged leaves no wider than 600 mm,
//   wardrobe carcasses split into transportable modules of at most 1200 mm (adjacent modules: two sides).
// A piece is a row of bays (Ritmo columns); each bay is a stack of cells, bottom → top, separated by fixed shelves.
// Cell types: door, drawers, open, glass (glazed door), knee (leg room under a vanity). Units: mm; front = +z.
import {clamp} from './rng.js';
import {ASSEMBLY_SYSTEMS,RAIL_SYSTEMS,RAIL_PROFILE,RUNNER_FIXING_SYSTEMS,RUNNER_FIXING_TRIAL,SHELF_SUPPORT_SYSTEMS,SHELF_SUPPORT_PROFILE,HINGE_SYSTEMS, HINGE_PROFILE, hingeForOverlay, CONNECTOR_SYSTEMS, RUNNER_SYSTEMS, runnerProfile, runnerLength, runnerAssessment} from './hardware.js';
import {drawerFit} from '../vendor/woodworkingshop/drawer-fit.js';
import {topOutline, roundedRectLoop} from './mesh.js';
import {legProfile} from './profiles.js';
import {linePart} from './lines.js';
import {headOutline, meshVolume} from './bedroom.js';
import {WOODS, COLORS} from './catalog.js';
const COLOR_KEYS = Object.keys(COLORS);

export const FAMILY = 'storage';
export const KINDS = {wardrobe: {}, nightstand: {}, dresser: {}, vanity: {}, tvunit: {}, bookcase: {}, vitrine: {}, sideboard: {}};

export const RULES = {mdf: 18, back: 8, backInset: 10, groove: 7, joint: 2, reveal: 2, kick: 50, moduleMax: 1200, leafMax: 600, boxSide: 12, boxBottom: 6, runnerClear: 12.7, setback: 20, slideDepth: 100, railDrop: 60, bumper: 1};
export const RUNNERS = [250, 300, 350, 400, 450, 500, 550, 600];
const BAR_PITCH = [96, 128, 160, 192, 256, 320, 480, 640];

/** Outer size limits per piece. */
export const SIZE = {
  wardrobe: {width: [600, 6000], height: [1800, 2700], depth: [520, 700]},
  nightstand: {width: [350, 800], height: [350, 750], depth: [300, 500]},
  dresser: {width: [600, 2000], height: [650, 1300], depth: [380, 560]},
  vanity: {width: [800, 1600], height: [720, 790], depth: [380, 560]},
  tvunit: {width: [900, 3600], height: [300, 700], depth: [300, 600]},
  bookcase: {width: [400, 4800], height: [700, 2700], depth: [250, 450]},
  vitrine: {width: [450, 2400], height: [800, 2200], depth: [300, 500]},
  sideboard: {width: [900, 3000], height: [600, 950], depth: [380, 550]},
  unit: {width: [150, 1300], height: [200, 2700], depth: [200, 700]} // kitchen modules (set by the kitchen, not edited alone)
};
export const RANGES = {
  width: [350, 6000, 10], height: [350, 2700, 10], depth: [300, 700, 5],
  solidThickness: [20, 30, 1], plinthHeight: [40, 150, 5], legHeight: [60, 450, 5], legSize: [20, 60, 1],
  topThickness: [18, 40, 1], topOverhang: [0, 30, 1], fluteWidth: [12, 60, 1], mirrorHeight: [400, 1200, 10], mirrorWidth: [0.3, 1, 0.05]
};
/** Slider range of a parameter for the piece in hand. */
export function rangeFor(key, p) { const s = SIZE[p.kind]?.[key]; return s ? [s[0], s[1], RANGES[key][2]] : RANGES[key]; }

export const ENUMS = {
  assemblySystem:ASSEMBLY_SYSTEMS,
  railSystem:RAIL_SYSTEMS,
  runnerFixingSystem:RUNNER_FIXING_SYSTEMS,
  shelfSupportSystem:SHELF_SUPPORT_SYSTEMS,
  runnerSystem: RUNNER_SYSTEMS, connectorSystem: CONNECTOR_SYSTEMS, hingeSystem:HINGE_SYSTEMS,
  backConstruction: ['legacy-bay','module-grooved'],
  frontFit: ['overlay', 'inset'],
  doorType: ['hinged', 'sliding'],
  frontStyle: ['flat', 'shaker', 'grooved', 'fluted', 'slats', 'cane'],
  pull: ['none', 'bar', 'knob', 'edge', 'cutout', 'leather'],
  base: ['plinth', 'legs', 'wall'],
  legType: ['round', 'taper', 'square', 'block', 'metal'],
  topType: ['flush', 'slab'],
  caseEdge: ['square', 'eased', 'bullnose', 'chamfer'],
  caseLine: ['none', 'groove', 'inlay'],
  backPanel: ['on', 'off'], led: ['off', 'on'],
  mirror: ['none', 'rect', 'rounded', 'arch', 'round', 'oval', 'capsule', 'scallop', 'stepped', 'organic'],
  // Set from the chosen material (solid wood → solid panels), not by hand.
  board: ['mdf', 'solid'], frontBoard: ['mdf', 'solid']
};
export const CELL_TYPES = ['door', 'drawers', 'open', 'glass', 'mirror', 'knee', 'niche'];
/** Cell types offered in the case-goods editor ('niche' holds a kitchen appliance and is set by the kitchen). */
export const EDIT_TYPES = ['door', 'drawers', 'open', 'glass', 'mirror', 'knee'];
export const INSIDE = ['shelves', 'glassShelves', 'hang', 'double', 'hangDrawers', 'empty'];

// ---- Layouts --------------------------------------------------------------------------------------------
const C = (type, o = {}) => ({type, h: 1, mm: 0, n: 1, inside: 'shelves', k: 0, ...o});
const B = (cells, w = 1, mm = 0) => ({w, mm, cells});
/** Default bay layouts per piece. */
export const LAYOUTS = {
  wardrobe: () => [B([C('door', {inside: 'hang'})]), B([C('door', {k: 5})]), B([C('door', {inside: 'hangDrawers'})])],
  nightstand: () => [B([C('drawers', {n: 2})])],
  dresser: () => [B([C('drawers', {n: 3})]), B([C('drawers', {n: 3})])],
  vanity: () => [B([C('knee'), C('drawers', {mm: 110})], 2.2), B([C('drawers', {n: 3})])],
  unit: () => [B([C('door', {k: 1})])],
  tvunit: () => [B([C('drawers', {n: 2})]), B([C('open', {k: 0})], 1.6), B([C('drawers', {n: 2})])],
  bookcase: () => [B([C('door', {k: 1, mm: 700}), C('open', {k: 3})]), B([C('door', {k: 1, mm: 700}), C('open', {k: 3})]), B([C('door', {k: 1, mm: 700}), C('open', {k: 3})])],
  vitrine: () => [B([C('door', {k: 1, mm: 620}), C('glass', {inside: 'glassShelves', k: 3})]), B([C('door', {k: 1, mm: 620}), C('glass', {inside: 'glassShelves', k: 3})])],
  sideboard: () => [B([C('door', {k: 1})]), B([C('drawers', {n: 3})]), B([C('door', {k: 1})])]
};
const BASE = {
  assemblySystem:'legacy-unspecified',
  railSystem:'legacy-round24',
  runnerFixingSystem:'legacy-unspecified',
  shelfSupportSystem:'legacy-generic',
  runnerSystem: 'legacy-side-12.7', connectorSystem:'legacy-unspecified', hingeSystem:'legacy-unspecified', backConstruction: 'legacy-bay',
  solidThickness: 22, plinthHeight: 80, legHeight: 150, legSize: 40, topThickness: 22, topOverhang: 0, fluteWidth: 30, mirrorHeight: 800, mirrorWidth: 0.7,
  frontFit: 'overlay', doorType: 'hinged', frontStyle: 'flat', pull: 'bar', base: 'plinth', legType: 'taper', topType: 'flush', caseEdge: 'eased', caseLine: 'none', mirror: 'none', backPanel: 'on', led: 'off', board: 'mdf', frontBoard: 'mdf'
};
const KIND_DEFAULTS = {
  tvunit: {width: 1800, height: 600, depth: 420, base: 'wall', legHeight: 250, topType: 'flush', pull: 'cutout'},
  bookcase: {width: 1800, height: 2100, depth: 350, base: 'plinth', plinthHeight: 60, topType: 'flush'},
  vitrine: {width: 900, height: 1900, depth: 420, base: 'plinth', plinthHeight: 80, topType: 'flush', led: 'on'},
  sideboard: {width: 1800, height: 800, depth: 460, base: 'legs', legHeight: 160, topType: 'slab', topThickness: 26},
  unit: {width: 600, height: 760, depth: 580, base: 'legs', legType: 'metal', legHeight: 120, topType: 'flush'},
  wardrobe: {width: 1800, height: 2400, depth: 600, base: 'plinth', plinthHeight: 80, topType: 'flush'},
  nightstand: {width: 500, height: 520, depth: 400, base: 'legs', legHeight: 160, topType: 'slab', pull: 'knob'},
  dresser: {width: 1200, height: 860, depth: 470, base: 'plinth', plinthHeight: 80, topType: 'slab'},
  vanity: {width: 1100, height: 760, depth: 450, base: 'legs', legHeight: 160, topType: 'slab', mirror: 'rect', mirrorHeight: 700, mirrorWidth: 0.6, pull: 'knob'}
};
const known = kind => KINDS[kind] || kind === 'unit' ? kind : 'wardrobe';
export const defaultsFor = kind => ({...BASE, ...KIND_DEFAULTS[known(kind)], bays: LAYOUTS[known(kind)](), kind: known(kind)});
export const DEFAULTS = defaultsFor('wardrobe');

const num = (v, lo, hi, d, step = 0) => { const n = Number(v); if (!Number.isFinite(n)) return d; const c = clamp(n, lo, hi); return step ? Math.round(c / step) * step : c; };
/** Clean a bay list (Ritmo: 1–8 bays, 1–8 cells per bay). Ids follow position, so they are stable for a layout. */
export function normalizeBays(raw, kind) {
  const list = Array.isArray(raw) && raw.length ? raw.slice(0, 12) : LAYOUTS[kind]();
  return list.map((b, i) => {
    const cells = (Array.isArray(b?.cells) && b.cells.length ? b.cells.slice(0, 8) : [C(kind === 'wardrobe' ? 'door' : 'drawers')]).map((c, j) => {
      let type = CELL_TYPES.includes(c?.type) ? c.type : 'open';
      if (type === 'knee' && (kind !== 'vanity' || j !== 0)) type = 'open';
      let inside = INSIDE.includes(c?.inside) ? c.inside : 'shelves';
      if (kind !== 'wardrobe' && ['hang', 'double', 'hangDrawers'].includes(inside)) inside = 'shelves';
      if (inside === 'glassShelves' && !['glass', 'open', 'mirror'].includes(type)) inside = 'shelves';
      return {id: `b${i + 1}c${j + 1}`, joined: !!c?.joined && j > 0, color: COLOR_KEYS.includes(c?.color) ? c.color : null, type, h: num(c?.h, 0.2, 8, 1), mm: c?.mm ? num(c.mm, 60, 2600, 0, 1) : 0, n: Math.round(num(c?.n, 1, 6, 1)), lv: Math.round(num(c?.lv, 0, 3, 0)), inside, k: Math.round(num(c?.k, 0, 8, 0))};
    });
    return {id: `b${i + 1}`, w: num(b?.w, 0.3, 4, 1), mm: b?.mm ? num(b.mm, 150, 2000, 0, 1) : 0, cells};
  });
}

export function normalize(input = {}) {
  const kind = known(input.kind), p = defaultsFor(kind);
  for (const key of Object.keys(RANGES)) if (input[key] !== undefined) { const [lo, hi, step] = rangeFor(key, p); p[key] = +num(input[key], lo, hi, p[key], step).toFixed(3); }
  for (const [key, list] of Object.entries(ENUMS)) if (list.includes(input[key])) p[key] = input[key];
  p.bays = normalizeBays(input.bays ?? p.bays, kind);
  if (kind !== 'wardrobe') p.doorType = 'hinged';
  if (kind === 'wardrobe' && p.base === 'wall') p.base = 'plinth';
  if (!['dresser', 'vanity', 'sideboard'].includes(kind)) p.mirror = 'none';
  if (p.doorType === 'sliding') { p.frontFit = 'overlay'; p.topType = 'flush'; }
  return p;
}

// ---- Geometry helpers -------------------------------------------------------------------------------------
const r1 = v => Math.round(v * 10) / 10;
const EDGE_R = {square: 0.8, eased: 2, bullnose: 4, chamfer: 2.5};
const part = (id, role, mat, geom, pos, rot = [0, 0, 0], extra = {}) => ({id, role, mat, geom, pos: pos.map(r1), rot, ...extra});
/** Axis-aligned panel from its extents. */
function pnl(parts, id, role, mat, [x0, x1], [y0, y1], [z0, z1], extra = {}, r = 0.8) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  if (!(w > 0.5 && h > 0.5 && d > 0.5)) return null;
  const q = part(id, role, mat, {fn: 'cushion', w: r1(w), h: r1(h), d: r1(d), r: Math.min(r, w / 3, h / 3, d / 3)}, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [0, 0, 0], extra);
  parts.push(q); return q;
}
/** Hinged leaves for a front width: leaves stay at about 600 mm (up to 620 before a second leaf is added). */
export const leafCount = w => Math.max(1, Math.ceil((w - 1) / (RULES.leafMax + 20)));
/** Leaves the customer asked for (lv: 0 = automatic, 1 = single, 2 = double, 3 = triple), kept within a hinged leaf's
 *  limits: no leaf wider than ~620 mm, none narrower than 250 mm. */
export const leafMin = 250;
export const leafFor = (w, lv) => { const auto = leafCount(w); if (!lv) return auto; return Math.max(auto, Math.min(lv, Math.max(1, Math.floor(w / leafMin)))); };
const pickBar = len => BAR_PITCH.filter(v => v <= len).at(-1) || 96;

// ---- Layout across the width: bays, dividers and transport modules ------------------------------------------
/** Bay widths so that fronts come out equal: each bay's pitch (inner width + its share of the panels around it —
 * an outer or module side counts whole, a divider half) follows the bay weights; fixed bays keep their inner width. */
export function xLayout(p, T) {
  const bays = p.bays, n = bays.length, W = p.width, maxM = p.kind === 'wardrobe' ? RULES.moduleMax : Infinity;
  const pitchOf = shares => {
    const fixed = bays.reduce((s, b, i) => s + (b.mm ? b.mm + shares[i] : 0), 0), flexW = bays.reduce((s, b) => s + (b.mm ? 0 : b.w), 0);
    if (!flexW || fixed > W - 200 * bays.filter(b => !b.mm).length) { const tot = bays.reduce((s, b, i) => s + (b.mm ? b.mm + shares[i] : b.w * 600), 0); return bays.map((b, i) => W * (b.mm ? b.mm + shares[i] : b.w * 600) / tot); }
    return bays.map((b, i) => b.mm ? b.mm + shares[i] : (W - fixed) * b.w / flexW);
  };
  const sharesFor = groups => bays.map((_, i) => { const g = groups.find(x => x.includes(i)), j = g.indexOf(i); return (j === 0 ? T : T / 2) + (j === g.length - 1 ? T : T / 2); });
  let groups = [bays.map((_, i) => i)];
  if (Number.isFinite(maxM) && n > 1) {
    // Transport modules: consecutive bays while the module stays within 1200 mm (estimate from the pitches).
    const est = pitchOf(sharesFor(groups)); groups = []; let cur = [], cw = 0;
    for (let i = 0; i < n; i++) { if (cur.length && cw + est[i] > maxM + 30) { groups.push(cur); cur = []; cw = 0; } cur.push(i); cw += est[i]; }
    groups.push(cur);
  }
  const shares = sharesFor(groups), pitch = pitchOf(shares), wd = pitch.map((v, i) => v - shares[i]);
  let x = -W / 2; const mods = [], bx = [];
  for (const g of groups) {
    const m = {x0: x, bays: g}; x += T;
    g.forEach((i, j) => { bx[i] = {x0: x, x1: x + wd[i], left: j === 0 ? 'side' : 'div', right: j === g.length - 1 ? 'side' : 'div', mod: mods.length}; x += wd[i]; if (j < g.length - 1) x += T; });
    x += T; m.x1 = x; mods.push(m);
  }
  return {mods, bx};
}
/** Cells of one bay between y0 and y1 (fixed shelves of thickness T between them). */
function yLayout(bay, y0, y1, T) {
  const cells = bay.cells, avail = y1 - y0 - (cells.length - 1) * T;
  const fixed = cells.reduce((s, c) => s + (c.mm || 0), 0), flex = cells.reduce((s, c) => s + (c.mm ? 0 : c.h), 0);
  let hs;
  if (!flex || fixed > avail - 120 * cells.filter(c => !c.mm).length) { const tot = cells.reduce((s, c) => s + (c.mm || c.h * 300), 0); hs = cells.map(c => avail * (c.mm || c.h * 300) / tot); }
  else hs = cells.map(c => c.mm || (avail - fixed) * c.h / flex);
  let y = y0; return cells.map((c, j) => { const out = {y0: y, y1: y + hs[j]}; y += hs[j] + (j < cells.length - 1 ? T : 0); return out; });
}

// ---- Compile --------------------------------------------------------------------------------------------
export function compile(raw) {
  const p = normalize(raw), parts = [], k = p.kind;
  const T = p.board === 'solid' ? p.solidThickness : RULES.mdf, TF = p.frontBoard === 'solid' ? p.solidThickness : RULES.mdf;
  const W = p.width, H = p.height, D = p.depth, rv = RULES.reveal, bumper=p.hingeSystem==='blum-110-inserta-expando'?HINGE_PROFILE.gap:RULES.bumper;
  const sliding = k === 'wardrobe' && p.doorType === 'sliding', inset = !sliding && p.frontFit === 'inset';
  const Dc = sliding ? D - RULES.slideDepth : inset ? D : D - TF - bumper;
  const zB = -D / 2, zF = zB + Dc, zBackFace = zB + RULES.backInset + RULES.back;
  const zFace = sliding ? D / 2 : inset ? zF : zF + bumper + TF; // front face of the piece
  const slab = p.topType === 'slab', topT = slab ? p.topThickness : T;
  const yB = p.base === 'plinth' ? p.plinthHeight : p.legHeight;
  const yCarcTop = slab ? H - topT : H; // sides end here
  const yIn1 = slab ? H - topT : H - T; // interior top
  const {mods, bx} = xLayout(p, T);
  const hasKnee = b => b.cells[0].type === 'knee';
  const kneeBays = p.bays.map(hasKnee);
  const counts = {leaves: 0, drawers: 0, hinges: 0, shelves: 0, fixedShelves: 0, rails: 0, railLen: 0, runners: {}, pulls: 0, push: 0, inner: 0, spacers: 0, connectors: 0, feet: 0, legs: 0};
  const info = {spans: [], leafH: [], leafW: [], drawerFronts: [], drawerWidths: [], hang: [], knee: null, runner: 0, innerDepth: Math.round(Dc - RULES.backInset - RULES.back - (inset ? TF : 0))};
  const conn = depth => depth > 400 ? 3 : 2; // cam connectors / dowels per joint

  // Carcass: per module two full-height sides, top between the sides (flush) or a slab on top, bottom between the sides.
  mods.forEach((m, mi) => {
    const anyKnee = m.bays.some(i => kneeBays[i]);
    for (const side of ['L', 'R']) {
      const x0 = side === 'L' ? m.x0 : m.x1 - T, bi = side === 'L' ? m.bays[0] : m.bays.at(-1);
      const toFloor = kneeBays[bi] && p.base === 'plinth';
      pnl(parts, `m${mi + 1}-side-${side}`, 'side', 'case', [x0, x0 + T], [toFloor ? 0 : yB, yCarcTop], [zB, zF], {band: 'front'});
    }
    if (!slab) { pnl(parts, `m${mi + 1}-top`, 'top', 'case', [m.x0 + T, m.x1 - T], [H - T, H], [zB, zF], {band: 'front'}); counts.connectors += 2 * conn(Dc); }
    if (!anyKnee) { pnl(parts, `m${mi + 1}-bottom`, 'bottom', 'case', [m.x0 + T, m.x1 - T], [yB, yB + T], [zB, zF], {band: 'front'}); counts.connectors += 2 * conn(Dc); }
    else m.bays.forEach(i => { if (!kneeBays[i]) { pnl(parts, `b${i + 1}-bottom`, 'bottom', 'case', [bx[i].x0, bx[i].x1], [yB, yB + T], [zB, zF], {band: 'front'}); counts.connectors += 2 * conn(Dc); } });
    // Dividers between bays: they stop at the back panel; with a knee they run down to the bottom line (or the floor).
    m.bays.slice(0, -1).forEach(i => {
      const x0 = bx[i].x1, toFloor = (kneeBays[i] || kneeBays[i + 1]) && p.base === 'plinth';
      pnl(parts, `b${i + 1}-divider`, 'divider', 'case', [x0, x0 + T], [anyKnee ? (toFloor ? 0 : yB) : yB + T, yIn1], [zBackFace, zF], {band: 'front'});
      counts.connectors += 2 * conn(Dc);
    });
  });
  if (slab) {
    const ov = p.topOverhang, zf = (inset ? zF : zFace) + ov, w = W + 2 * ov, d = zf - zB;
    const prof = [p.caseEdge, topT, Math.min(8, topT * 0.4)];
    parts.push(part('top', 'case-top', 'case', {fn: 'slab', outline: topOutline('rect', w, d, {}), t: r1(topT), profile: prof}, [0, H - topT, (zB + zf) / 2], [0, 0, 0], {cut: [w, d, topT], band: 'three'}));
    counts.connectors += 2 * mods.length * conn(Dc);
  }

  // Opt-in production trial: one back per transport module, retained by its four outside boards.
  // Knee/slab layouts keep their existing bay backs and remain review-required.
  if(p.backConstruction==='module-grooved' && p.backPanel!=='off' && !slab)mods.forEach((m,mi)=>{
    if(m.bays.some(i=>kneeBays[i]))return;
    pnl(parts,`m${mi+1}-back`,'back','back',[m.x0+T-RULES.groove,m.x1-T+RULES.groove],[yB+T-RULES.groove,yIn1+RULES.groove],[zB+RULES.backInset,zBackFace]);
  });
  // Bays: back panel, cells, fixed shelves, fronts and interior.
  const frontsOf = [], grid = [], opens = []; // fronts for line details; grid for the layout editor
  p.bays.forEach((bay, i) => {
    const b = bx[i], knee = kneeBays[i];
    const yStart = knee ? 0 : yB + T, cells = yLayout(bay, yStart, yIn1, T);
    grid.push({x0: r1(b.x0), x1: r1(b.x1), cells: cells.map(({y0, y1}) => ({y0: r1(y0), y1: r1(y1)}))});
    const backY0 = knee ? cells[0].y1 + T : yB + T;
    if (p.backPanel !== 'off' && (p.backConstruction !== 'module-grooved' || mods[b.mod].bays.some(j=>kneeBays[j]) || slab)) pnl(parts, `b${i + 1}-back`, 'back', 'back', [b.x0 - RULES.groove, b.x1 + RULES.groove], [backY0 - RULES.groove, yIn1 + RULES.groove], [zB + RULES.backInset, zBackFace]);
    // Horizontal edges of fronts (overlay: to the panel centre line, exterior: to the outer face).
    const extL = Math.abs(b.x0 - T - (-W / 2)) < 0.5, extR = Math.abs(b.x1 + T - W / 2) < 0.5;
    const xl = extL ? -W / 2 : b.left === 'side' ? b.x0 - T : b.x0 - T / 2, xr = extR ? W / 2 : b.right === 'side' ? b.x1 + T : b.x1 + T / 2;
    bay.cells.forEach((c, j) => {
      const {y0, y1} = cells[j], id = `${bay.id}c${j + 1}`;
      if (j < bay.cells.length - 1 && !bay.cells[j + 1].joined) { pnl(parts, `${id}-shelf`, 'shelf-fixed', 'case', [b.x0, b.x1], [y1, y1 + T], [zBackFace, zF], {band: 'front'}); counts.fixedShelves++; counts.connectors += 2 * conn(Dc); if (c.type !== 'knee') info.spans.push(b.x1 - b.x0); }
      if (c.type === 'knee') { info.knee = {w: Math.round(b.x1 - b.x0), h: Math.round(y1)}; return; }
      const below = j === 0 ? (knee ? 'ext' : 'bottom') : bay.cells[j - 1].type === 'knee' ? 'ext' : 'shelf';
      const above = j === bay.cells.length - 1 ? 'top' : 'shelf';
      // Front rectangle.
      let f;
      if (inset) f = {x0: b.x0 + rv, x1: b.x1 - rv, y0: y0 + rv, y1: y1 - rv, z0: zF - TF, z1: zF};
      else {
        const fy0 = below === 'bottom' ? yB : below === 'ext' ? y0 - T : y0 - T / 2 + rv / 2;
        const fy1 = above === 'top' ? (slab ? H - topT - rv : H - rv / 2) : y1 + T / 2 - rv / 2;
        f = {x0: xl + rv / 2, x1: xr - rv / 2, y0: fy0, y1: fy1, z0: zF + bumper, z1: zF + bumper + TF};
      }
      const innerZ1 = inset ? zF - TF - 2 : zF; // front of the usable interior
      const tint = k0 => { if (c.color) for (const q of parts.slice(k0)) if (q.mat === 'front') q.mat = 'lac:' + c.color; };
      if (!sliding && ['door', 'glass', 'mirror'].includes(c.type)) {
        const n = leafFor(f.x1 - f.x0, c.lv), lw = (f.x1 - f.x0 - (n - 1) * rv) / n;
        for (let l = 0; l < n; l++) {
          const lx0 = f.x0 + l * (lw + rv), side = n === 1 ? (p.bays.length === 1 || i % 2 === 0 ? 1 : -1) : l % 2 === 0 ? 1 : -1; // handle side
          const leaf = {x0: lx0, x1: lx0 + lw, y0: f.y0, y1: f.y1, z0: f.z0, z1: f.z1};
          const k0 = parts.length;
          frontFace(parts, `${id}-door${l + 1}`, 'door', leaf, p, c.type === 'door' ? p.frontStyle : c.type, frontsOf); tint(k0);
          pull(parts, `${id}-door${l + 1}`, leaf, p, 'door', side, counts);
          const hh = leaf.y1 - leaf.y0, nh = hh <= 900 ? 2 : hh <= 1600 ? 3 : hh <= 2000 ? 4 : 5;
          const overlay=side>0?b.x0-leaf.x0:leaf.x1-b.x1, chosen=hingeForOverlay(overlay,inset), branded=p.hingeSystem==='blum-110-inserta-expando', cupOffset=branded&&!chosen.issues.length?17.5+chosen.tb:22, hx=side>0?leaf.x0+cupOffset:leaf.x1-cupOffset;
          const hingeMount=branded?{system:p.hingeSystem,hand:side,overlay_mm:r1(overlay),product_code:chosen.code,boring_distance_mm:chosen.tb,issues:chosen.issues}:null;
          for (let q = 0; q < nh; q++) { const hy = nh === 1 ? (leaf.y0 + leaf.y1) / 2 : leaf.y0 + 100 + q * (hh - 200) / (nh - 1); pnl(parts, `${id}-door${l + 1}-hinge${q + 1}`, 'hinge', 'metal', [hx - 17.5, hx + 17.5], [hy - 17.5, hy + 17.5], [leaf.z0 - 12, leaf.z0], {internal: true, nocut: true,...(hingeMount?{hingeMount}: {})}, 4); }
          counts.leaves++; counts.hinges += nh; info.leafH.push(hh); info.leafW.push(lw);
          // Display stress rotation about the front outside edge avoids sweeping the
          // leaf thickness through the closed neighbouring leaf. Not4bar hinge CAD.
          opens.push({door: true, parts: parts.slice(k0), px: side > 0 ? leaf.x0 : leaf.x1, pz: leaf.z1, sign: side > 0 ? -1 : 1});
        }
      }
      if (c.type === 'drawers') {
        const n = c.n, fh = (f.y1 - f.y0 - (n - 1) * rv) / n, pitch = (y1 - y0) / n;
        const depthAvail = innerZ1 - zBackFace, runner = runnerLength(p.runnerSystem, depthAvail);
        info.runner = Math.max(info.runner, runner);
        for (let m = 0; m < n; m++) {
          const dy0 = f.y0 + m * (fh + rv), df = {x0: f.x0, x1: f.x1, y0: dy0, y1: dy0 + fh, z0: f.z0, z1: f.z1}, did = `${id}-drawer${m + 1}`;
          const k0 = parts.length;
          if (!sliding) { frontFace(parts, did, 'drawer-front', df, p, p.frontStyle, frontsOf); tint(k0); pull(parts, did, df, p, 'drawer', 0, counts); info.drawerFronts.push(fh); info.drawerWidths.push(df.x1 - df.x0); }
          drawerBox(parts, did, b.x0, b.x1, y0 + m * pitch, pitch, innerZ1, runner, counts, p.runnerSystem, depthAvail,p.runnerFixingSystem,p.assemblySystem,df.z0);
          if (!sliding) opens.push({drawer: true, parts: parts.slice(k0).filter(q => q.role !== 'runner'), dz: runner * 0.6});
        }
        if (sliding) for (let m = 0; m < n; m++) pnl(parts, `${id}-ifront${m + 1}`, 'inner-front', 'case', [b.x0 + 2, b.x1 - 2], [y0 + m * pitch + 2, y0 + (m + 1) * pitch - 2], [innerZ1 - RULES.mdf, innerZ1], {internal: true, band: 'four'});
      }
      const interiorStart = parts.length;
      if (['door', 'glass', 'mirror', 'open'].includes(c.type) || (sliding && c.type !== 'drawers')) interior(parts, id, c, b.x0, b.x1, y0, y1, zBackFace, innerZ1, T, p, counts, info, ['door', 'mirror'].includes(c.type) || (sliding && c.type !== 'open'));
      // Opening hinged fronts must reveal their existing contents, without moving the interior.
      // Sliding panels have no open transform here: keep their closed visibility contract.
      if (raw.openFronts && !sliding) for (let n = interiorStart; n < parts.length; n++) parts[n].internal = false;
    });
  });

  // Sliding doors: two tracks in front of the carcass, leaves overlap 30 mm.
  if (sliding) {
    const nP = clamp(Math.round(W / 900), 2, 4), ov = 30, pw = (W + (nP - 1) * ov) / nP, yb = yB, yt = H - 40;
    pnl(parts, 'track-top', 'track', 'metal', [-W / 2, W / 2], [H - 40, H], [zF, D / 2], {nocut: true}, 1);
    pnl(parts, 'track-bottom', 'track', 'metal', [-W / 2, W / 2], [yB - 8, yB], [zF, D / 2], {nocut: true}, 1);
    for (let i = 0; i < nP; i++) {
      const x0 = -W / 2 + i * (pw - ov), zt = i % 2 ? zF + 62 : zF + 22, leaf = {x0, x1: x0 + pw, y0: yb + 4, y1: yt - 2, z0: zt, z1: zt + TF};
      frontFace(parts, `slide${i + 1}`, 'sliding-door', leaf, p, p.frontStyle, frontsOf);
      pull(parts, `slide${i + 1}`, leaf, p, 'slide', i === 0 ? 1 : i === nP - 1 ? -1 : 1, counts);
      counts.leaves++; info.leafH.push(leaf.y1 - leaf.y0); info.leafW.push(pw);
    }
  }

  // Base.
  if (p.base === 'plinth') {
    // Recessed plinth frame (Ritmo): front board set back from the front face, rear board, ends; under knee bays none.
    const runs = []; let cur = null;
    p.bays.forEach((bay, i) => {
      if (kneeBays[i]) { cur = null; return; }
      const a = bx[i].x0 - T, z = bx[i].x1 + T;
      if (cur && Math.abs(cur[1] - a) < T + 0.5) cur[1] = z; else { cur = [a, z]; runs.push(cur); }
    });
    const zf = zFace - RULES.kick;
    runs.forEach(([a, z], ri) => {
      a = Math.max(a, -W / 2); z = Math.min(z, W / 2);
      pnl(parts, `plinth${ri + 1}-front`, 'plinth', 'case', [a, z], [0, yB], [zf - T, zf], {band: 'long'});
      pnl(parts, `plinth${ri + 1}-rear`, 'plinth', 'case', [a, z], [0, yB], [zB + 20, zB + 20 + T]);
      for (const x of [a, z - T]) pnl(parts, `plinth${ri + 1}-end${x === a ? 'L' : 'R'}`, 'plinth-end', 'case', [x, x + T], [0, yB], [zB + 20 + T, zf - T]);
      const nMid = Math.floor((z - a) / 800); for (let q = 1; q <= nMid; q++) { const x = a + (z - a) * q / (nMid + 1) - T / 2; pnl(parts, `plinth${ri + 1}-mid${q}`, 'plinth-end', 'case', [x, x + T], [0, yB], [zB + 20 + T, zf - T]); }
      counts.feet += 4 + 2 * nMid;
    });
  } else if (p.base === 'legs') {
    const s = p.legType === 'metal' ? Math.min(p.legSize, 25) : p.legType === 'block' ? Math.max(p.legSize, 50) : p.legSize;
    const zs = [zB + 40 + s / 2, zF - 40 - s / 2], xs = [-W / 2 + 35 + s / 2, W / 2 - 35 - s / 2];
    if (p.bays.some((_, i) => kneeBays[i])) p.bays.forEach((_, i) => { if (!kneeBays[i]) return; if (i > 0) xs.push(bx[i].x0 - T / 2); if (i < p.bays.length - 1) xs.push(bx[i].x1 + T / 2); });
    else if (W > 1300) xs.push(0);
    const uniq = [...new Set(xs.map(x => Math.round(x)))];
    uniq.forEach((x, a) => zs.forEach((z, c) => { leg(parts, `leg${a + 1}${c ? 'F' : 'B'}`, p, x, z, yB, s); counts.legs++; }));
  } else {
    pnl(parts, 'wall-rail', 'wall-rail', 'metal', [-W / 2 + T + 30, W / 2 - T - 30], [yIn1 - 70, yIn1 - 20], [zB, zB + RULES.backInset], {internal: true, nocut: true}, 1);
  }

  // Mirror (chest, vanity): stands on the top against the wall.
  let mirrorTop = H;
  if (p.mirror !== 'none') {
    const mw = W * p.mirrorWidth, mh = p.mirrorHeight, round = p.mirror === 'round';
    const ow = round ? Math.min(mw, mh) : mw, oh = round ? ow : mh;
    parts.push(part('mirror-frame', 'mirror-frame', 'front', {fn: 'slab', outline: mirrorOutline(p.mirror, ow, oh, H), t: 25, profile: ['eased', 25, 3]}, [0, 0, zB + 30 + 25], [-Math.PI / 2, 0, 0], {cut: [ow, oh, 25]}));
    parts.push(part('mirror-glass', 'mirror', 'mirror', {fn: 'slab', outline: mirrorOutline(p.mirror, ow - 56, oh - 56, H + 28), t: 5, profile: ['square', 5, 0]}, [0, 0, zB + 30 + 25 + 2], [-Math.PI / 2, 0, 0], {cut: [ow - 56, oh - 56, 5], glass: true}));
    mirrorTop = H + oh;
  }

  // Opened view (viewer only): doors swing 100° on their hinges, drawers come out on their runners.
  if (raw.openFronts) for (const o of opens) for (const q of o.parts) {
    q.internal = false;
    if (o.drawer) { if (q.geom.points && !q.pos.some(Boolean)) q.geom = {...q.geom, points: q.geom.points.map(([x, y, z]) => [x, y, z + o.dz])}; else q.pos = [q.pos[0], q.pos[1], q.pos[2] + o.dz]; continue; }
    const th = o.sign * 100 * Math.PI / 180, c = Math.cos(th), sn = Math.sin(th);
    const rot = ([x, y, z]) => { const dx = x - o.px, dz = z - o.pz; return [r1(o.px + dx * c + dz * sn), y, r1(o.pz - dx * sn + dz * c)]; };
    if (q.geom.points && !q.pos.some(Boolean)) { q.geom = {...q.geom, points: q.geom.points.map(rot)}; continue; }
    q.pos = rot(q.pos);
    q.rot = Math.abs(q.rot[0] - Math.PI / 2) < 1e-6 ? [q.rot[0], q.rot[1], q.rot[2] - th] : [q.rot[0], q.rot[1] + th, q.rot[2]];
  }
  // Line details on plain fronts: a shadow groove or a metal inlay inset from the edge.
  if (p.caseLine !== 'none' && p.frontStyle === 'flat' && !raw.openFronts) for (const f of frontsOf) {
    const m = clamp(Math.min(f.x1 - f.x0, f.y1 - f.y0) * 0.12, 12, 40), zl = f.z1 - (p.caseLine === 'groove' ? 0.7 : 1.0);
    parts.push(linePart(`${f.id}-line`, p.caseLine, roundedRectLoop(f.x1 - f.x0 - 2 * m, f.y1 - f.y0 - 2 * m, 2, (f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2, 2).map(([x, y]) => [x, y, zl])));
  }

  const ov = slab ? p.topOverhang : 0, overall = {width: Math.round(W + 2 * ov), depth: Math.round(D + ov), height: Math.round(mirrorTop)};
  const firstBay = bx[0], sectionX = Math.round((firstBay.x0 + firstBay.x1) / 2);
  const meta = {
    kind: k, overall, board: T, front: TF, back: RULES.back, modules: mods.length, moduleWidths: mods.map(m => Math.round(m.x1 - m.x0)), bays: p.bays.length,
    bayWidths: bx.map(b => Math.round(b.x1 - b.x0)), leaves: counts.leaves, drawers: counts.drawers, hinges: counts.hinges, shelves: counts.shelves, fixedShelves: counts.fixedShelves,
    innerDepth: info.innerDepth, runner: info.runner, maxSpan: Math.round(Math.max(0, ...info.spans)), maxLeafH: Math.round(Math.max(0, ...info.leafH)), maxLeafW: Math.round(Math.max(0, ...info.leafW)),
    smallestFront: Math.round(Math.min(9999, ...info.drawerFronts)), widestDrawer: Math.round(Math.max(0, ...info.drawerWidths)), hang: info.hang.map(Math.round), knee: info.knee, sliding, inset,
    counts, carcassDepth: Math.round(Dc), grid: {W, H, yB, T, top: r1(yIn1), bays: grid}
  };
  return {family: FAMILY, params: p, parts, meta, dims: dims(p, meta, bx, {H, W, D, yB, T, topT}), sectionX, detail: slab ? {kind: 'edge', title: 'edge', T: topT, profile: [p.caseEdge, topT, Math.min(8, topT * 0.4)]} : null};
}

/** Mirror outlines (x across, y up from base): straight, soft, arched, round, oval, capsule, scalloped, stepped, organic. */
export function mirrorOutline(shape, w, h, base) {
  if (shape === 'oval' || shape === 'organic' || shape === 'round') {
    const pts = [], n = 96;
    for (let k = 0; k < n; k++) {
      const t = k / n * Math.PI * 2, wob = shape === 'organic' ? 1 + 0.07 * Math.sin(3 * t + 0.6) + 0.04 * Math.sin(5 * t + 1.9) : 1;
      pts.push([Math.cos(t) * w / 2 * wob, base + h / 2 + Math.sin(t) * h / 2 * (shape === 'organic' ? 1 + 0.05 * Math.cos(2 * t) : 1)]);
    }
    return pts;
  }
  const map = {rect: ['rect', 8], rounded: ['rounded', Math.min(w, h) * 0.18], arch: ['arch', w * 0.5], capsule: ['capsule', 0], scallop: ['scallop', 0], stepped: ['stepped', 8]}[shape] || ['rect', 8];
  return headOutline(map[0], w, h, {r: map[1], scallops: 3, base});
}

/** One front (door leaf, drawer front, sliding leaf) with its face style. Cut size is always the whole front. */
function frontFace(parts, id, role, f, p, style, list) {
  const w = f.x1 - f.x0, h = f.y1 - f.y0, d = f.z1 - f.z0, x = (f.x0 + f.x1) / 2, y = (f.y0 + f.y1) / 2, er = EDGE_R[p.caseEdge] || 2;
  const cut = {cut: [w, h, d], band: 'four'};
  list.push({id, ...f});
  const frame = (s, inner, mat, innerD) => {
    for (const sg of [-1, 1]) {
      pnl(parts, `${id}-stile${sg < 0 ? 'L' : 'R'}`, 'front-frame', 'front', [sg < 0 ? f.x0 : f.x1 - s, sg < 0 ? f.x0 + s : f.x1], [f.y0, f.y1], [f.z0, f.z1], {nocut: true}, Math.min(er, 2));
      pnl(parts, `${id}-rail${sg < 0 ? 'B' : 'T'}`, 'front-frame', 'front', [f.x0 + s, f.x1 - s], [sg < 0 ? f.y0 : f.y1 - s, sg < 0 ? f.y0 + s : f.y1], [f.z0, f.z1], {nocut: true}, Math.min(er, 2));
    }
    pnl(parts, id, role, mat, [f.x0 + s - 1, f.x1 - s + 1], [f.y0 + s - 1, f.y1 - s + 1], [f.z0 + 2, f.z0 + 2 + innerD], {...cut, inner}, 0.5);
  };
  if (style === 'mirror') { // mirrored door: the leaf with a 5 mm mirror bonded inside a 40 mm margin
    pnl(parts, id, role, 'front', [f.x0, f.x1], [f.y0, f.y1], [f.z0, f.z1], {...cut, inner: 'mirror'}, er);
    pnl(parts, `${id}-mirror`, 'mirror', 'mirror', [f.x0 + 40, f.x1 - 40], [f.y0 + 40, f.y1 - 40], [f.z1, f.z1 + 5], {cut: [w - 80, h - 80, 5]}, 0.5);
    return;
  }
  if (style === 'glass') { const s = clamp(Math.min(w, h) * 0.16, 45, 70); frame(s, 'glass', 'glass', 4); return; }
  if (style === 'shaker' && Math.min(w, h) >= 150) { const s = clamp(Math.min(w, h) * 0.16, 40, 75); frame(s, 'panel', 'front', d - 8); return; }
  if (style === 'cane' && Math.min(w, h) >= 150) { const s = clamp(Math.min(w, h) * 0.14, 40, 60); frame(s, 'cane', 'cane', 3); return; }
  if (style === 'fluted') {
    pnl(parts, id, role, 'front', [f.x0, f.x1], [f.y0, f.y1], [f.z0, f.z1 - 6], cut, 0.8);
    parts.push(part(`${id}-reeds`, 'reeds', 'front', {fn: 'ribbed', w: r1(w - 2), h: r1(h - 2), pitch: p.fluteWidth, depth: 6}, [x, y, f.z1 - 6], [0, 0, 0], {nocut: true}));
    return;
  }
  if (style === 'slats') {
    pnl(parts, id, role, 'front', [f.x0, f.x1], [f.y0, f.y1], [f.z0, f.z0 + d / 2], cut, 0.8);
    const n = Math.max(2, Math.round(w / p.fluteWidth)), sw = w / n;
    for (let i = 0; i < n; i++) pnl(parts, `${id}-slat${i + 1}`, 'front-slat', 'front', [f.x0 + i * sw + 2, f.x0 + (i + 1) * sw - 2], [f.y0, f.y1], [f.z0 + d / 2, f.z1], {nocut: true}, 1.2);
    return;
  }
  pnl(parts, id, role, 'front', [f.x0, f.x1], [f.y0, f.y1], [f.z0, f.z1], cut, er);
  if (style === 'grooved') { // CNC V-grooves across the front at the flute pitch
    const n = Math.max(2, Math.round(w / p.fluteWidth));
    for (let i = 1; i < n; i++) pnl(parts, `${id}-groove${i}`, 'seam', 'dark', [f.x0 + i * w / n - 1.5, f.x0 + i * w / n + 1.5], [f.y0 + 0.5, f.y1 - 0.5], [f.z1 - 1.5, f.z1 + 0.2], {nocut: true}, 0.4);
  }
}

/** Handle of a front. side: +1 handle at the right edge, −1 left; 0 centred (drawers). */
function pull(parts, id, f, p, kind, side, counts) {
  const w = f.x1 - f.x0, h = f.y1 - f.y0, z = f.z1 + (p.frontStyle === 'fluted' ? 6 : 0);
  let x = (f.x0 + f.x1) / 2, y = (f.y0 + f.y1) / 2;
  const vertical = kind !== 'drawer';
  if (vertical) {
    x = side > 0 ? f.x1 - 45 : f.x0 + 45;
    y = f.y1 < 1000 ? f.y1 - 70 : f.y0 > 1300 ? f.y0 + 70 : clamp(1050, f.y0 + 200, f.y1 - 200);
  } else if (h > 260) y = f.y1 - 90;
  if (p.pull === 'none') { counts.push++; return; }
  counts.pulls++;
  const fitY = len => vertical ? clamp(y, f.y0 + len / 2 + 5, Math.max(f.y0 + len / 2 + 5, f.y1 - len / 2 - 5)) : y; // a vertical pull stays on its door
  if (p.pull === 'bar') {
    const len = pickBar(vertical ? Math.min(h * 0.35, 480) : Math.min(w * 0.45, 320)), a = len / 2, sd = 30; y = fitY(len);
    const pts = vertical ? [[x, y - a, z], [x, y - a, z + sd], [x, y + a, z + sd], [x, y + a, z]] : [[x - a, y, z], [x - a, y, z + sd], [x + a, y, z + sd], [x + a, y, z]];
    parts.push(part(`${id}-pull`, 'pull', 'metal', {fn: 'tube', points: pts, r: 6}, [0, 0, 0], [0, 0, 0], {nocut: true, pitch: len}));
  } else if (p.pull === 'knob') {
    for (const off of !vertical && w > 700 ? [-w / 4, w / 4] : [0]) parts.push(part(`${id}-knob${off ? (off < 0 ? 'L' : 'R') : ''}`, 'pull', 'metal', {fn: 'lathe', profile: [[0, 7], [16, 7], [19, 15], [28, 16], [30, 10]]}, [x + off, y, z], [Math.PI / 2, 0, 0], {nocut: true}));
    if (!vertical && w > 700) counts.pulls++;
  } else if (p.pull === 'edge') {
    // Aluminium edge profile on the top edge of a drawer, on the opening edge of a door.
    if (vertical) { const L = Math.min(h * 0.45, 900); y = fitY(L); } if (vertical) pnl(parts, `${id}-pull`, 'pull', 'metal', [side > 0 ? f.x1 - 3 : f.x0 - 1, side > 0 ? f.x1 + 1 : f.x0 + 3], [y - Math.min(h * 0.45, 900) / 2, y + Math.min(h * 0.45, 900) / 2], [f.z0 - 2, z + 16], {nocut: true}, 0.8);
    else pnl(parts, `${id}-pull`, 'pull', 'metal', [x - Math.min(w * 0.5, 300) / 2, x + Math.min(w * 0.5, 300) / 2], [f.y1 - 3, f.y1 + 1], [f.z0 - 2, z + 16], {nocut: true}, 0.8);
  } else if (p.pull === 'cutout') {
    // Finger cut-out routed into the front edge.
    if (vertical) y = fitY(140); if (vertical) pnl(parts, `${id}-pull`, 'pull', 'dark', [side > 0 ? f.x1 - 22 : f.x0, side > 0 ? f.x1 : f.x0 + 22], [y - 70, y + 70], [f.z0 + 4, z + 0.3], {nocut: true}, 6);
    else pnl(parts, `${id}-pull`, 'pull', 'dark', [x - 65, x + 65], [f.y1 - 22, f.y1], [f.z0 + 4, z + 0.3], {nocut: true}, 6);
  } else if (p.pull === 'leather') {
    if (vertical) y = fitY(120); if (vertical) pnl(parts, `${id}-pull`, 'pull', 'leather', [side > 0 ? f.x1 - 6 : f.x0 - 30, side > 0 ? f.x1 + 30 : f.x0 + 6], [y - 60, y + 60], [z - 1, z + 4], {nocut: true}, 1.5);
    else pnl(parts, `${id}-pull`, 'pull', 'leather', [x - 20, x + 20], [f.y1 - 70, f.y1 - 4], [z - 1, z + 4], {nocut: true}, 1.5);
  }
}

/** Drawer box on side-mounted runners (Ritmo / drawerFit): 12 mm sides and ends, 6 mm bottom. */
function drawerBox(parts, id, x0, x1, y0, pitch, zFront, runner, counts, system, availableDepth,fixingSystem='legacy-unspecified',assemblySystem='legacy-unspecified',frontContactZ=null) {
  const profile = runnerProfile(system);
  const fit = drawerFit({openingWidthMm: x1 - x0, openingHeightMm: Math.max(40, pitch - 25), openingDepthMm: runner + 24, sideClearanceMm: profile.sideSpace});
  const trial=fixingSystem===RUNNER_FIXING_TRIAL.id&&system==='hettich-ka5632-ss-2025';
  const contact=trial&&assemblySystem==='hettich-71833-assembly-trial';
  const bw = fit.widthMm, bh = Math.max(34, fit.heightMm), bd = fit.depthMm, t = trial?18:profile.sideThickness, cx = (x0 + x1) / 2, yb = y0 + 12, z1 = contact?(frontContactZ??zFront):zFront-(trial?2:1), z0 = z1 - bd;
  const memberFront=contact?zFront-2:z1;
  const hardware = runnerAssessment(system, {openingWidth:x1-x0, boxHeight:bh, length:runner, availableDepth});
  if(contact)Object.assign(hardware,{assembly_profile:assemblySystem,datum_scope:'Separate actual box front and cabinet front references;display runner proxy is cabinet member only;actual closed stop remains unverified'});
  if(trial)Object.assign(hardware,{fixing_system:fixingSystem,side_board_mm:t,stock_choice:'AURA opt-in18mm plywood sides/ends;not manufacturer minimum',member_front_inset_mm:2,pilot_recipe_qualified:false});
  for (const s of [-1, 1]) pnl(parts, `${id}-box-side${s < 0 ? 'L' : 'R'}`, 'box-side', 'frame', s < 0 ? [cx - bw / 2, cx - bw / 2 + t] : [cx + bw / 2 - t, cx + bw / 2], [yb, yb + bh], [z0, z1], {internal: true});
  for (const e of [-1, 1]) pnl(parts, `${id}-box-end${e < 0 ? 'B' : 'F'}`, 'box-end', 'frame', [cx - bw / 2 + t, cx + bw / 2 - t], [yb, yb + bh], e < 0 ? [z0, z0 + t] : [z1 - t, z1], {internal: true});
  const insertion=trial?4:0,bottomY=yb+(trial?6:0);
  pnl(parts, `${id}-box-bottom`, 'box-bottom', 'frame', [cx - bw / 2 + t-insertion, cx + bw / 2 - t+insertion], [bottomY, bottomY + RULES.boxBottom], [z0 + t-insertion, z1 - t+insertion], {internal: true, hardware,...(trial?{drawerConstruction:{id:'aura-grooved-18-trial',insertion_mm:4,groove_clearance_mm:.4,depth_clearance_mm:.5,production_approved:false}}:{})});
  for (const s of [-1, 1]) pnl(parts, `${id}-runner${s < 0 ? 'L' : 'R'}`, 'runner', 'metal', s < 0 ? [x0, x0 + (system === 'legacy-side-12.7' ? 12 : 12.7)] : [x1 - (system === 'legacy-side-12.7' ? 12 : 12.7), x1], [yb + 4, yb + 4 + profile.height], [memberFront - runner, memberFront], {internal: true, nocut: true, hardware}, 1);
  counts.drawers++; counts.runners[runner] = (counts.runners[runner] || 0) + 1;
}

/** Shelves, hanging rails and inner drawers inside an opening. */
function interior(parts, id, c, x0, x1, y0, y1, zBack, zFront, T, p, counts, info, hidden) {
  const shelfZ1 = zFront - (c.type === 'open' ? 2 : RULES.setback), mk = {internal: hidden};
  const shelf = (sid, y) => {
    pnl(parts, sid, 'shelf-adj', 'case', [x0 + 1, x1 - 1], [y, y + T], [zBack + 2, shelfZ1], {...mk, band: 'front'});
    // Concept Ø5 support pins:8mm insertion and6mm projection. Hardware capacity
    // remains supplier-specific; geometry is not a load rating or a drilling file.
    for(const side of [-1,1])for(const [j,z] of [zBack+22,shelfZ1-20].entries()){
      const selected=p.shelfSupportSystem===SHELF_SUPPORT_PROFILE.id,h=SHELF_SUPPORT_PROFILE,axisY=y-(selected?h.axisBelowShelf:2.5),face=side<0?x0:x1;
      parts.push(part(`${sid}-pin-${side}-${j}`,'shelf-pin','metal',{fn:'lathe',profile:selected?[[0,2.5],[8,2.5],[8,3.75],[14,3.75]]:[[0,2.5],[14,2.5]]},[side<0?x0-8:x1+8,axisY,z],[0,0,side<0?-Math.PI/2:Math.PI/2],{internal:true,nocut:true,...(selected?{hardware:{profile:h.id,product_code:h.product,source:h.source,proxy_only:true,geometry_scope:h.geometryScope},shelfMount:{shelf:sid,face_world_mm:[face,axisY,z],hand:side<0?1:-1}}:{})}));
    }
    counts.shelves++; info.spans.push(x1 - x0);
  };
  const rail = (rid, y) => {
    const z = (zBack + zFront) / 2;
    if(p.railSystem===RAIL_PROFILE.id){
      const h=RAIL_PROFILE,len=x1-x0-h.lengthDeduction,axis=y1-h.axisBelowRoof,hardware={profile:h.id,product_code:h.support,source:h.source,proxy_only:true,geometry_scope:h.geometryScope};
      parts.push(part(rid,'rail','metal',{fn:'sweep',axis:0,bend:[0,1,0],L:len,start:-len/2,w:30,d:15,shape:'capsule',steps:1},[(x0+x1)/2,axis,z],[0,0,0],{...mk,nocut:true,length:len,hardware}));
      for(const side of [-1,1])pnl(parts,rid+'-cup'+(side<0?'L':'R'),'rail-cup','metal',side<0?[x0,x0+16]:[x1-16,x1],[y1-63,y1],[z-9,z+9],{...mk,nocut:true,hardware},1);
      counts.rails++;counts.railLen+=len;return;
    }
    parts.push(part(rid, 'rail', 'metal', {fn: 'tube', points: [[x0 + 8, y, z], [x1 - 8, y, z]], r: 12}, [0, 0, 0], [0, 0, 0], {...mk, nocut: true, length: x1 - x0 - 16}));
    for (const s of [-1, 1]) pnl(parts, `${rid}-cup${s < 0 ? 'L' : 'R'}`, 'rail-cup', 'metal', s < 0 ? [x0, x0 + 8] : [x1 - 8, x1], [y - 14, y + 14], [z - 14, z + 14], {...mk, nocut: true}, 2);
    counts.rails++; counts.railLen += x1 - x0 - 16;
  };
  // Display cells: LED strip under the top of the opening; TV units get a cable outlet in the back.
  if (p.led === 'on' && ['glass', 'open'].includes(c.type)) { pnl(parts, `${id}-led`, 'led', 'led', [x0 + 20, x1 - 20], [y1 - 12, y1 - 4], [zFront - 60, zFront - 50], {nocut: true}, 1); counts.ledLen = (counts.ledLen || 0) + (x1 - x0 - 40); }
  if (p.kind === 'tvunit' && c.type === 'open') { pnl(parts, `${id}-cable`, 'cable', 'dark', [(x0 + x1) / 2 - 40, (x0 + x1) / 2 + 40], [y0 + 30, y0 + 70], [zBack - 2, zBack + 1], {nocut: true}, 6); counts.grommets = (counts.grommets || 0) + 1; }
  if (c.inside === 'glassShelves') {
    // 8 mm toughened glass shelves on pins, polished edges.
    for (let s = 0; s < c.k; s++) { const y = y0 + (y1 - y0) * (s + 1) / (c.k + 1) - 4; pnl(parts, `${id}-glass${s + 1}`, 'shelf-glass', 'glass', [x0 + 2, x1 - 2], [y, y + 8], [zBack + 4, shelfZ1], {cut: [x1 - x0 - 4, shelfZ1 - zBack - 4, 8]}, 0.5); counts.glassShelves = (counts.glassShelves || 0) + 1; }
  } else if (c.inside === 'shelves' || c.inside === 'empty') {
    const k = c.inside === 'empty' ? 0 : c.k;
    for (let s = 0; s < k; s++) shelf(`${id}-shelf${s + 1}`, y0 + (y1 - y0) * (s + 1) / (k + 1) - T / 2);
  } else if (c.inside === 'hang') { rail(`${id}-rail`, y1 - RULES.railDrop); info.hang.push(y1 - RULES.railDrop - y0); }
  else if (c.inside === 'double') {
    const mid = y0 + (y1 - y0) / 2; rail(`${id}-rail-top`, y1 - RULES.railDrop); rail(`${id}-rail-low`, mid - RULES.railDrop);
    info.hang.push(y1 - RULES.railDrop - mid, mid - RULES.railDrop - y0);
  } else if (c.inside === 'hangDrawers') {
    // Inner drawers behind the doors clear the hinges on 25 mm spacers; a shelf over them, the rail above.
    const sp = 25, pitch = 200, n = 2, depthAvail = zFront - RULES.setback - RULES.mdf - zBack, runner = runnerLength(p.runnerSystem, depthAvail);
    info.runner = Math.max(info.runner, runner);
    const fixingTrial=p.runnerFixingSystem===RUNNER_FIXING_TRIAL.id&&p.runnerSystem==='hettich-ka5632-ss-2025';
    const spacerBack=fixingTrial?zFront-RULES.setback-RULES.mdf-2-runner:zFront-runner-20;
    for (const s of [-1, 1]) pnl(parts, `${id}-spacer${s < 0 ? 'L' : 'R'}`, 'spacer', 'case', s < 0 ? [x0, x0 + sp] : [x1 - sp, x1], [y0, y0 + n * pitch], [spacerBack, zFront - RULES.setback], {...mk, band: 'front'});
    counts.spacers += 2;
    for (let m = 0; m < n; m++) {
      pnl(parts, `${id}-idrawer${m + 1}-front`, 'inner-front', 'case', [x0 + sp + 2, x1 - sp - 2], [y0 + m * pitch + 3, y0 + (m + 1) * pitch - 3], [zFront - RULES.setback - RULES.mdf, zFront - RULES.setback], {...mk, band: 'four'});
      drawerBox(parts, `${id}-idrawer${m + 1}`, x0 + sp, x1 - sp, y0 + m * pitch, pitch, zFront - RULES.setback - RULES.mdf, runner, counts, p.runnerSystem, depthAvail,p.runnerFixingSystem,p.assemblySystem);
      counts.inner++;
    }
    const ys = y0 + n * pitch + 10; shelf(`${id}-shelf-over`, ys);
    rail(`${id}-rail`, y1 - RULES.railDrop); info.hang.push(y1 - RULES.railDrop - ys - T);
  }
}

function leg(parts, id, p, x, z, h, s) {
  if (h < 1) return;
  if (p.legType === 'metal') { pnl(parts, id, 'leg', 'metal', [x - s / 2, x + s / 2], [0, h], [z - s / 2, z + s / 2], {nocut: true}, 1.5); return; }
  if (p.legType === 'square' || p.legType === 'block') { pnl(parts, id, 'leg', 'wood', [x - s / 2, x + s / 2], [0, h], [z - s / 2, z + s / 2], {nocut: true}, p.legType === 'block' ? 5 : 2); return; }
  const prof = p.legType === 'round' ? legProfile('cylinder', h, s / 2) : legProfile('tapered', h, s / 2, 0.6);
  parts.push(part(id, 'leg', 'wood', {fn: 'lathe', profile: prof}, [x, 0, z], [0, 0, 0], {nocut: true}));
}

// ---- Drawing dimensions --------------------------------------------------------------------------------------
function dims(p, m, bx, {H, W, D, yB, T, topT}) {
  const o = m.overall, out = [];
  out.push({view: 'front', a: [-o.width / 2, 0], b: [o.width / 2, 0], off: 70, text: `${o.width}`, orient: 'h'});
  out.push({view: 'front', a: [o.width / 2, 0], b: [o.width / 2, H], off: 80, text: `${H}`, orient: 'v'});
  if (o.height > H) out.push({view: 'front', a: [-o.width / 2, 0], b: [-o.width / 2, o.height], off: -80, text: `${o.height}`, orient: 'v'});
  // Clear width of every bay along the top.
  if (bx.length > 1) for (const b of bx) out.push({view: 'front', a: [b.x0, H], b: [b.x1, H], off: -40, text: `${Math.round(b.x1 - b.x0)}`, orient: 'h'});
  if (yB > 0) out.push({view: 'side', a: [-D / 2, 0], b: [-D / 2, yB], off: -40, text: `${yB}`, orient: 'v'});
  out.push({view: 'side', a: [-D / 2, 0], b: [-D / 2 + o.depth, 0], off: 70, text: `${o.depth}`, orient: 'h'});
  out.push({view: 'top', a: [-o.width / 2, -D / 2], b: [o.width / 2, -D / 2], off: -60, text: `${o.width}`, orient: 'h'});
  out.push({view: 'section', a: [-D / 2, 0], b: [-D / 2, H], off: -120, text: `${H}`, orient: 'v'});
  return out;
}

// ---- Weight, checks, cut list ----------------------------------------------------------------------------------
const DENS = {mdf: 760, back: 780, frame: 680, metal: 7850, mirror: 2500, glass: 2500, cane: 300, leather: 900, dark: 0};
export function weights(compiled, materials, buildMesh) {
  const p = compiled.params, solid = WOODS[materials?.case?.species]?.density || 700, solidF = WOODS[materials?.front?.species]?.density || 700, legs = WOODS[materials?.wood?.species]?.density || 700;
  let kg = 0;
  for (const q of compiled.parts) {
    if (q.line || q.role === 'seam' || q.decor) continue;
    let vol;
    if (q.geom.fn === 'cushion' && q.role !== 'pull') vol = q.geom.w * q.geom.h * q.geom.d;
    else vol = meshVolume(buildMesh(q));
    const d = q.mat.startsWith('lac:') ? DENS.mdf : q.mat === 'case' ? (p.board === 'solid' ? solid : DENS.mdf) : q.mat === 'front' ? (p.frontBoard === 'solid' ? solidF : DENS.mdf) : q.mat === 'wood' ? legs : q.mat === 'metal' ? (['rail', 'track', 'runner', 'wall-rail'].includes(q.role) ? DENS.metal * 0.12 : DENS.metal * (q.role === 'pull' ? 0.5 : 0.25)) : DENS[q.mat] ?? 600;
    kg += vol / 1e9 * d;
  }
  return +kg.toFixed(1);
}

export function validate(design) {
  const {params: p, meta: m} = design, issues = [], add = (level, code, value) => issues.push({level, code, value});
  const span = m.board >= 22 ? 900 : 800;
  if (m.maxSpan > span) add('warn', 'shelfSpan', m.maxSpan);
  if (m.maxLeafH > (p.frontBoard === 'solid' ? 2200 : 2400)) add('warn', 'doorTall', m.maxLeafH);
  if (m.drawers && m.smallestFront < 100) add('warn', 'drawerLow', m.smallestFront);
  if (m.widestDrawer > 1000) add('warn', 'drawerWide', m.widestDrawer);
  if (m.drawers && m.runner < 300) add('warn', 'drawerShallow', m.runner);
  if (m.hang.some(h => h < 900)) add('warn', 'hangShort', Math.min(...m.hang));
  if (p.kind === 'wardrobe' && m.hang.length && p.depth < 560) add('warn', 'wardrobeShallow', p.depth);
  if (p.kind === 'wardrobe' && m.moduleWidths.some(w => w > RULES.moduleMax + 1)) add('warn', 'moduleWide', Math.max(...m.moduleWidths));
  if (m.knee) { if (m.knee.h < 600) add('warn', 'kneeLow', m.knee.h); if (m.knee.w < 550) add('warn', 'kneeNarrow', m.knee.w); }
  if (m.sliding && p.width < 1200) add('warn', 'slidingNarrow', p.width);
  if (p.height >= 1000 || ['dresser', 'wardrobe', 'bookcase', 'vitrine'].includes(p.kind)) add('info', 'antiTip', p.height);
  if (p.backPanel === 'off') add(p.height > 1200 ? 'warn' : 'info', 'backless', 0);
  return issues;
}

/** Part names, suggested build. [tr, en, specTr, specEn] */
export const ROLE = {
  side: ['Yan dikme', 'Side', 'Boydan; üst ve alt yanların arasına, kavela + minifix', 'Full height; top and bottom between the sides, dowel + cam connector'],
  top: ['Üst tabla (gövde)', 'Top panel', 'Yanların arasında', 'Between the sides'],
  'case-top': ['Üst tabla', 'Top', 'Yanların üstüne oturur, önden ve yanlardan taşar', 'Sits on the sides, overhangs front and sides'],
  bottom: ['Alt tabla', 'Bottom', 'Yanların arasında', 'Between the sides'],
  divider: ['Ara dikme', 'Divider', 'Alt ve üst tabla arasında; arkalığa kadar', 'Between bottom and top; stops at the back'],
  'shelf-fixed': ['Sabit raf (ara tabla)', 'Fixed shelf', 'Gövdeye sabit; minifix', 'Fixed; cam connectors'],
  'shelf-adj': ['Ayarlı raf', 'Adjustable shelf', 'Ø5 raf pimi üzerinde, önden 20 mm geride', 'On Ø5 shelf pins, set back 20 mm'],
  back: ['Arkalık', 'Back', '8 mm, arka kenardan 10 mm içeride, 7 mm kanala geçme', '8 mm, 10 mm in from the back edge, set 7 mm into a groove'],
  plinth: ['Baza önü / arkası', 'Plinth board', 'Ayarlı ayak üzerinde, ön yüzden 50 mm geride', 'On adjustable feet, set back 50 mm'],
  'plinth-end': ['Baza yanı / takviye', 'Plinth end / brace', '', ''],
  door: ['Kapak', 'Door', '2 mm derz; frenli menteşe 110°, Ø35 kap', '2 mm reveal; soft-close 110° hinge, Ø35 cup'],
  'sliding-door': ['Sürgü kapak', 'Sliding door', 'Çift ray, kanatlar 30 mm bindirmeli', 'Double track, leaves overlap 30 mm'],
  'drawer-front': ['Çekmece önü', 'Drawer front', '2 mm derz; kutuya ayarlı bağlantı', '2 mm reveal; adjustable fixing to the box'],
  'inner-front': ['İç çekmece önü', 'Inner drawer front', 'Kapak arkasında', 'Behind the doors'],
  'box-side': ['Çekmece kutusu yanı', 'Drawer box side', '12 mm huş kontrplak', '12 mm birch ply'],
  'box-end': ['Çekmece kutusu ön/arka', 'Drawer box end', '12 mm huş kontrplak', '12 mm birch ply'],
  'box-bottom': ['Çekmece tabanı', 'Drawer bottom', '6 mm, kanala geçme', '6 mm, in a groove'],
  spacer: ['Menteşe takozu', 'Hinge spacer', 'İç çekmeceyi menteşeden kurtarır', 'Clears the inner drawers from the hinges'],
  'shelf-glass': ['Cam raf', 'Glass shelf', '8 mm temperli cam, rodajlı, raf pimi üzerinde', '8 mm toughened glass, polished edges, on shelf pins'],
  'mirror-frame': ['Ayna çerçevesi', 'Mirror frame', 'Tablaya ve duvara sabitlenir', 'Fixed to the top and the wall'],
  mirror: ['Ayna', 'Mirror', '5 mm, rodajlı', '5 mm, polished edge']
};
const BAND = {front: ['ön kenar', 'front edge', 1], long: ['bir uzun kenar', 'one long edge', 1], three: ['ön + iki yan', 'front + two ends', 3], four: ['dört kenar', 'all four edges', 4]};

/** Cut list (panels with sizes, material and edge banding) and hardware for the workshop. */
export function storageBom(compiled, materials, lang, buildMesh, text) {
  const tr = lang === 'tr', p = compiled.params, m = compiled.meta, c = m.counts, groups = new Map();
  let boardArea = 0, backArea = 0, edge = 0;
  const veneerCase = materials.case?.surface === 'veneer', veneerFront = materials.front?.surface === 'veneer';
  for (const q of compiled.parts) {
    if (q.nocut || q.line || q.decor || q.role === 'seam' || q.role === 'reeds') continue;
    const dimsRaw = q.cut || [q.geom.w, q.geom.h, q.geom.d], size = dimsRaw.map(v => Math.round(v)).sort((a, b) => b - a);
    const key = `${q.role}|${q.mat}|${q.inner || ''}|${size.join('x')}|${q.internal ? 1 : 0}`, g = groups.get(key) || {role: q.role, mat: q.mat, inner: q.inner, size, qty: 0, internal: !!q.internal, band: q.band};
    g.qty++; groups.set(key, g);
    const area = size[0] * size[1] / 1e6;
    if (q.role === 'back') backArea += area; else if (['case', 'front'].includes(q.mat)) boardArea += area;
    const b = BAND[q.band]; if (b && ((q.mat === 'case' && veneerCase) || (q.mat === 'front' && veneerFront))) edge += q.band === 'four' ? 2 * (size[0] + size[1]) / 1000 : q.band === 'three' ? (size[0] + 2 * size[1]) / 1000 : size[0] / 1000;
  }
  const order = Object.keys(ROLE), rows = [];
  for (const g of [...groups.values()].sort((a, b) => (order.indexOf(a.role) - order.indexOf(b.role)) || b.size[0] - a.size[0])) {
    const n = ROLE[g.role] || [g.role, g.role, '', ''], band = BAND[g.band];
    const name = g.inner === 'mirror' ? ['Aynalı kapak', 'Mirrored door'] : g.inner === 'glass' ? ['Kapak (cam çerçeve)', 'Door (glazed frame)'] : g.inner === 'cane' ? ['Kapak (hasır çerçeve)', 'Door (cane frame)'] : g.inner === 'panel' ? [n[0] + ' (çerçeveli)', n[1] + ' (framed)'] : [n[0], n[1]];
    const specTr = [n[2], band && g.mat !== 'frame' ? `Bant: ${band[0]}` : ''].filter(Boolean).join(' · '), specEn = [n[3], band && g.mat !== 'frame' ? `Edging: ${band[1]}` : ''].filter(Boolean).join(' · ');
    rows.push({code: `K${String(rows.length + 1).padStart(2, '0')}`, nameTr: name[0], nameEn: name[1], qty: g.qty, size: g.size, material: g.role === 'back' ? text('back') : g.inner === 'glass' && g.role !== 'door' ? text('glass') : text(g.mat), specTr, specEn, internal: g.internal});
  }
  // Hardware.
  const hw = (nameTr, nameEn, qty, specTr, specEn) => { if (qty) rows.push({code: `H${String(rows.filter(r => r.code[0] === 'H').length + 1).padStart(2, '0')}`, nameTr, nameEn, qty, size: [0, 0, 0], material: tr ? 'Donanım' : 'Hardware', specTr, specEn, internal: false}); };
  if(p.hingeSystem==='blum-110-inserta-expando'){
    const variants=new Map();for(const q of compiled.parts.filter(q=>q.role==='hinge')){const code=q.hingeMount?.product_code||'ürün eşlemesi eksik / unresolved product';variants.set(code,(variants.get(code)||0)+1);}
    for(const [code,n]of variants)hw('Menteşe + montaj plakası','Hinge + mounting plate',n,`${code} + ${HINGE_PROFILE.plate}; delik/yerleşim incelemesi, yük ve açılım onayı değil`,`${code} + ${HINGE_PROFILE.plate}; drilling/placement review, not load or sweep approval`);
  }else hw('Menteşe', 'Hinge', c.hinges, `Frenli 110°, Ø35 kap, ${m.inset ? 'gömme (iç bini)' : 'tam bini'}`, `Soft-close 110°, Ø35 cup, ${m.inset ? 'inset' : 'full overlay'}`);
  const rp=runnerProfile(p.runnerSystem);
  for (const [len, qty] of Object.entries(c.runners)) hw('Çekmece rayı (çift)', 'Drawer runners (pair)', qty, `${rp.codes?.[len]||rp.name}; ${len} mm; yan boşluk ${rp.sideSpace} mm; delik/vida reçetesi ayrıca doğrulanmalı`, `${rp.codes?.[len]||rp.name}; ${len} mm; side space ${rp.sideSpace} mm; fixing/pilot recipe needs separate validation`);
  const pullName = {bar: ['Çubuk kulp', 'Bar handle'], knob: ['Düğme kulp', 'Knob'], edge: ['Alüminyum kenar profili', 'Aluminium edge pull'], cutout: ['Freze tutamak', 'Routed finger pull'], leather: ['Deri tutamak', 'Leather tab']}[p.pull];
  const pitch = compiled.parts.find(q => q.role === 'pull' && q.pitch)?.pitch;
  if (pullName) hw(pullName[0], pullName[1], c.pulls, pitch ? `Aks ${pitch} mm` : '', pitch ? `${pitch} mm centres` : '');
  hw('Bas-aç mekanizması', 'Push-to-open', c.push, 'Kulpsuz kapak / çekmece için', 'For handle-less fronts', '');
  if(p.railSystem===RAIL_PROFILE.id)hw('Oval askı borusu + üst bağlantı','Oval rail + top supports',c.rails,`30×15 mm;uzunluk açıklık−13mm;2×SL786/70668,M6×25;üst tabla en çok19mm`,`30×15 mm;clearopening−13mm;2×SL786/70668,M6×25;roof max19mm`);
  else hw('Askı borusu', 'Hanging rail', c.rails, `Model Ø24 mm; toplam ${(c.railLen / 1000).toFixed(2)} m; uç yuvası/donanım seçimi gerekli`, `Model Ø24 mm; ${(c.railLen / 1000).toFixed(2)} m in all; end support/hardware selection required`);
  hw('Raf pimi', 'Shelf pin', (c.shelves + (c.glassShelves || 0)) * 4, 'Ø5 mm', 'Ø5 mm');
  hw('LED şerit', 'LED strip', c.ledLen ? 1 : 0, `2700 K, alüminyum profil + difüzör, toplam ${((c.ledLen || 0) / 1000).toFixed(2)} m; trafo ve anahtar`, `2700 K, aluminium profile + diffuser, ${((c.ledLen || 0) / 1000).toFixed(2)} m in all; driver and switch`);
  hw('Kablo geçiş kapağı', 'Cable grommet', c.grommets || 0, 'Arkalıkta, cihaz bölmesinde; havalandırma', 'In the back of the device bay; ventilation');
  hw('Bağlantı (minifix + kavela)', 'Connectors (cam + dowel)', c.connectors, 'Her birleşimde', 'At every joint');
  hw('Ayarlı ayak', 'Adjustable foot', c.feet, 'Baza altında, 10–25 mm ayar', 'Under the plinth, 10–25 mm adjustment');
  if (p.base === 'wall') hw('Duvar askı aparatı', 'Wall hanging bracket', 2, 'Ayarlı, gizli; duvar tipine uygun dübel', 'Adjustable, concealed; plugs to suit the wall');
  if (m.sliding) hw('Sürgü kapak sistemi', 'Sliding door gear', 1, `Çift ray ${p.width} mm, ${c.leaves} kanat, frenli`, `Double track ${p.width} mm, ${c.leaves} leaves, soft-close`);
  if (p.height >= 1000 || ['wardrobe', 'dresser', 'bookcase', 'vitrine'].includes(p.kind)) hw('Devrilme önleyici', 'Anti-tip fixing', 1, 'Duvara sabitleme (EN 14749)', 'Wall fixing (EN 14749)');
  return {rows, totals: {weightKg: weights(compiled, materials, buildMesh), drawers: m.drawers, lines: [
    [tr ? 'Gövde/ön levha alanı m²' : 'Carcass/front board m²', +boardArea.toFixed(2)], [tr ? `Arkalık (${RULES.back} mm) m²` : `Back (${RULES.back} mm) m²`, +backArea.toFixed(2)],
    ...(edge ? [[tr ? 'Kenar bandı m' : 'Edge banding m', +(edge * 1.1).toFixed(1)]] : []),
    [tr ? 'Gövde levhası' : 'Carcass board', `${m.board} mm`], [tr ? 'Kapak / ön' : 'Fronts', `${m.front} mm`], [tr ? 'Derz' : 'Reveal', `${RULES.reveal} mm`],
    [tr ? 'Kapak (kanat)' : 'Door leaves', m.leaves], [tr ? 'Menteşe' : 'Hinges', m.hinges], [tr ? 'Modül' : 'Modules', `${m.modules} (${m.moduleWidths.join(' + ')} mm)`]
  ]}};
}
