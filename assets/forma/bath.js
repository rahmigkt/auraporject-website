// AURA bathroom: special pieces, not market units — a vanity unit with its top and basin(s), a tall column and a
// mirror (or mirror cabinet) — on the RİTMO panel engine (18 mm carcass, 8 mm back in a groove, 2 mm reveals,
// drawerFit drawers). Bathroom rules: basin rim 850–900 mm from the floor, wall-hung units leave the floor free
// (or stand on slim legs), drawers under a basin need a U-cut for the trap, splash zone surfaces are sealed.
import * as S from './storage.js';
import {clamp} from './rng.js';

export const FAMILY = 'bath';
export const KINDS = {basin: {}, column: {}, mirror: {}};
export const RANGES = {
  width: [300, 2400, 10], height: [200, 1900, 10], depth: [120, 600, 5], mountHeight: [100, 1700, 10], topThickness: [12, 60, 1],
  mirrorWidth: [300, 2000, 10], mirrorHeight: [300, 1600, 10], solidThickness: [20, 30, 1], fluteWidth: [12, 60, 1], legHeight: [100, 400, 5]
};
const SIZE = {
  basin: {width: [500, 2400], height: [200, 700], depth: [380, 600], mountHeight: [780, 950]},
  column: {width: [300, 700], height: [900, 1900], depth: [250, 450], mountHeight: [100, 500]},
  mirror: {width: [300, 1400], height: [300, 1400], depth: [120, 200], mountHeight: [1000, 1500]}
};
export const rangeFor = (key, p) => { const s = SIZE[p.kind]?.[key]; return s ? [s[0], s[1], RANGES[key][2]] : RANGES[key]; };
export const ENUMS = {
  assemblySystem:S.ENUMS.assemblySystem,
  railSystem:S.ENUMS.railSystem,
  runnerFixingSystem:S.ENUMS.runnerFixingSystem,
  shelfSupportSystem:S.ENUMS.shelfSupportSystem,
  runnerSystem: S.ENUMS.runnerSystem, hingeSystem:S.ENUMS.hingeSystem, connectorSystem:S.ENUMS.connectorSystem, backConstruction: S.ENUMS.backConstruction,
  frontStyle: S.ENUMS.frontStyle.filter(x => !['grooved', 'fluted', 'slats'].includes(x)), // no channelled/striped fronts in wet rooms
  pull: S.ENUMS.pull, frontFit: S.ENUMS.frontFit, caseEdge: S.ENUMS.caseEdge, caseLine: S.ENUMS.caseLine,
  base: ['wall', 'legs'], legType: S.ENUMS.legType,
  basinType: ['vessel', 'integrated', 'undermount'], basinShape: ['round', 'rect'], basins: ['single', 'double'], tap: ['wall', 'deck'],
  mirror: S.ENUMS.mirror.filter(m => m !== 'none'), mirrorLight: ['none', 'back', 'top'], mirrorCabinet: ['none', 'cabinet'],
  board: ['mdf', 'solid'], frontBoard: ['mdf', 'solid']
};
const C = (type, o = {}) => ({type, h: 1, mm: 0, n: 1, inside: 'shelves', k: 0, ...o});
export const LAYOUTS = {
  basin: () => [{w: 1, cells: [C('drawers', {n: 2})]}],
  column: () => [{w: 1, cells: [C('door', {k: 3}), C('open', {k: 0, mm: 300})]}],
  mirror: () => [{w: 1, cells: [C('mirror', {k: 2})]}]
};
const BASE = {assemblySystem:'legacy-unspecified',railSystem:'legacy-round24',runnerFixingSystem:'legacy-unspecified',shelfSupportSystem:'legacy-generic',runnerSystem: 'legacy-side-12.7', hingeSystem:'legacy-unspecified', connectorSystem:'legacy-unspecified', backConstruction:'legacy-bay', frontStyle: 'flat', pull: 'cutout', frontFit: 'overlay', caseEdge: 'eased', caseLine: 'none', base: 'wall', legType: 'taper', legHeight: 250, basinType: 'vessel', basinShape: 'round', basins: 'single', tap: 'wall',
  mirror: 'rounded', mirrorLight: 'back', mirrorCabinet: 'none', topThickness: 20, solidThickness: 22, fluteWidth: 30, board: 'mdf', frontBoard: 'mdf'};
const KIND_DEFAULTS = {
  basin: {width: 1000, height: 450, depth: 480, mountHeight: 860, mirrorWidth: 800, mirrorHeight: 800},
  column: {width: 400, height: 1500, depth: 330, mountHeight: 300, mirrorWidth: 800, mirrorHeight: 800},
  mirror: {width: 800, height: 700, depth: 150, mountHeight: 1150, mirrorWidth: 800, mirrorHeight: 800}
};
export const defaultsFor = kind => { const k = KINDS[kind] ? kind : 'basin'; return {...BASE, ...KIND_DEFAULTS[k], bays: LAYOUTS[k](), kind: k}; };
export const DEFAULTS = defaultsFor('basin');

export function normalize(input = {}) {
  const kind = KINDS[input.kind] ? input.kind : 'basin', p = defaultsFor(kind);
  for (const key of Object.keys(RANGES)) if (input[key] !== undefined && Number.isFinite(+input[key])) { const [lo, hi, st] = rangeFor(key, {kind}); p[key] = Math.round(clamp(+input[key], lo, hi) / st) * st; }
  for (const [key, list] of Object.entries(ENUMS)) if (list.includes(input[key])) p[key] = input[key];
  p.bays = S.normalizeBays(input.bays ?? p.bays, 'unit');
  if (p.basinType === 'integrated' && p.topThickness < 30) p.topThickness = 30; // a stone trough needs a thick top
  if (kind === 'basin' && p.width < 1100) p.basins = 'single';
  if (kind === 'mirror') { p.mirrorWidth = p.width; p.mirrorHeight = p.height; if (p.mirrorCabinet === 'cabinet') { p.mirror = 'rect'; p.height = Math.min(p.height, 1000); } }
  if (kind !== 'basin' && p.base === 'legs' && kind !== 'column') p.base = 'wall';
  return p;
}

// ---- helpers ------------------------------------------------------------------------------------------------
const r1 = v => Math.round(v * 10) / 10;
const part = (id, role, mat, geom, pos, rot = [0, 0, 0], extra = {}) => ({id, role, mat, geom, pos: pos.map(r1), rot, ...extra});
function box(parts, id, role, mat, [x0, x1], [y0, y1], [z0, z1], extra = {}, r = 1) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0; if (!(w > 0.5 && h > 0.5 && d > 0.5)) return;
  parts.push(part(id, role, mat, {fn: 'cushion', w: r1(w), h: r1(h), d: r1(d), r: Math.min(r, w / 3, h / 3, d / 3)}, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [0, 0, 0], extra));
}
const UNIT_KEYS = ['assemblySystem','railSystem','runnerFixingSystem','shelfSupportSystem','hingeSystem','connectorSystem','backConstruction','runnerSystem', 'frontStyle', 'pull', 'frontFit', 'caseEdge', 'caseLine', 'solidThickness', 'fluteWidth', 'board', 'frontBoard', 'legType'];
/** A wall-hung (or leg-mounted) carcass from the panel engine whose top is at yTop and body is h tall. */
function unitAt(p, {width, h, depth, yTop, legs, open}) {
  const common = Object.fromEntries(UNIT_KEYS.map(k => [k, p[k]]));
  if (legs) {
    const lh = clamp(yTop - h, 60, 450);
    return {unit: S.compile({...common, kind: 'unit', width, height: yTop, depth, base: 'legs', legHeight: lh, legSize: 30, topType: 'flush', bays: p.bays, openFronts: open}), dy: 0};
  }
  return {unit: S.compile({...common, kind: 'unit', width, height: h + 60, depth, base: 'wall', legHeight: 60, topType: 'flush', bays: p.bays, openFronts: open}), dy: yTop - (h + 60)};
}
function placeUnit(parts, unit, dx, dy, dz) {
  for (const q of unit.parts) {
    const p2 = {...q};
    if (q.geom.points && !q.pos.some(Boolean)) p2.geom = {...q.geom, points: q.geom.points.map(([x, y, z]) => [r1(x + dx), r1(y + dy), r1(z + dz)])};
    else p2.pos = [r1(q.pos[0] + dx), r1(q.pos[1] + dy), r1(q.pos[2] + dz)];
    parts.push(p2);
  }
}

// ---- compile ---------------------------------------------------------------------------------------------------
export function compile(raw) {
  const p = normalize(raw), parts = [], open = !!raw.openFronts, k = p.kind;
  let unit = null, overallH = 0, top = 0, extras = [];
  if (k === 'basin') {
    top = p.mountHeight - (p.basinType === 'vessel' ? 130 : 0); // mountHeight = basin rim height
    const T = p.topThickness, body = top - T, u = unitAt(p, {width: p.width, h: p.height, depth: p.depth, yTop: body, legs: p.base === 'legs', open});
    unit = u.unit; placeUnit(parts, unit, 0, u.dy, 0);
    // Top with an overhang of 10 mm at the front; cut-outs for integrated / undermount basins.
    const zB = -p.depth / 2, zF = p.depth / 2 + 10, xs = p.basins === 'double' ? [-p.width / 4, p.width / 4] : [0];
    const bw = p.basinShape === 'round' ? Math.min(420, p.width / xs.length - 140) : Math.min(p.basinType === 'integrated' ? p.width / xs.length - 160 : 520, p.width / xs.length - 140), bd = Math.min(p.depth - 120, p.basinShape === 'round' ? bw : 360), zc = (zB + zF) / 2 + 20;
    if (p.basinType === 'vessel') box(parts, 'top', 'vanity-top', 'top', [-p.width / 2, p.width / 2], [body, top], [zB, zF], {cut: [p.width, p.depth + 10, T]}, 2);
    else {
      let a = -p.width / 2;
      xs.forEach((x, i) => {
        const h0 = x - bw / 2, h1 = x + bw / 2;
        box(parts, `top-${i}a`, 'vanity-top', 'top', [a, h0], [body, top], [zB, zF], {}, 2);
        box(parts, `top-${i}f`, 'vanity-top', 'top', [h0, h1], [body, top], [zc + bd / 2, zF], {}, 2);
        box(parts, `top-${i}b`, 'vanity-top', 'top', [h0, h1], [body, top], [zB, zc - bd / 2], {}, 2);
        a = h1;
      });
      box(parts, 'top-end', 'vanity-top', 'top', [a, p.width / 2], [body, top], [zB, zF], {}, 2);
    }
    xs.forEach((x, i) => basin(parts, `basin${i + 1}`, p, x, zc, bw, bd, body, top));
    // Undermount / integrated bowls go through the cabinet's own top: open it with the same cut-outs as the vanity top
    // (a solid case top showed as wood inside the basin opening).
    if (p.basinType !== 'vessel') for (let k = parts.length - 1; k >= 0; k--) {
      const q = parts[k]; if (q.role !== 'top' || q.geom.fn !== 'cushion' || !/-top$/.test(q.id)) continue;
      const {w, h, d} = q.geom, [cx, cy, cz] = q.pos, x0 = cx - w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y = [cy - h / 2, cy + h / 2], pieces = []; let a = x0;
      xs.forEach((x, i) => { const h0 = x - bw / 2 - 4, h1 = x + bw / 2 + 4;
        if (h0 > a + 1) pieces.push([`${q.id}-${i}a`, [a, h0], [z0, z1]]);
        pieces.push([`${q.id}-${i}f`, [h0, h1], [zc + bd / 2 + 4, z1]], [`${q.id}-${i}b`, [h0, h1], [z0, zc - bd / 2 - 4]]); a = h1; });
      if (cx + w / 2 > a + 1) pieces.push([`${q.id}-end`, [a, cx + w / 2], [z0, z1]]);
      parts.splice(k, 1, ...pieces.filter(([, , zz]) => zz[1] - zz[0] > 2).map(([id, xx, zz]) => ({...q, id, geom: {...q.geom, w: xx[1] - xx[0], d: zz[1] - zz[0]}, pos: [(xx[0] + xx[1]) / 2, cy, (zz[0] + zz[1]) / 2], cut: undefined})));
    }
    extras.push({kind: 'basin', n: xs.length, type: p.basinType, shape: p.basinShape});
    overallH = top + (p.basinType === 'vessel' ? 140 : 0) + (p.tap === 'deck' ? 260 : 0);
  } else if (k === 'column') {
    const yTop = p.mountHeight + p.height, u = unitAt(p, {width: p.width, h: p.height, depth: p.depth, yTop, legs: p.base === 'legs', open});
    unit = u.unit; placeUnit(parts, unit, 0, u.dy, 0); overallH = yTop;
  } else {
    // Mirror: a shaped mirror on a 12 mm backing (light behind or above), or a mirror cabinet with mirrored doors.
    const y0 = p.mountHeight, zB = -p.depth / 2;
    if (p.mirrorCabinet === 'cabinet') {
      const bays = p.bays.map(b => ({...b, cells: b.cells.map(c => ({...c, type: c.type === 'drawers' ? 'mirror' : c.type}))}));
      const u = unitAt({...p, bays}, {width: p.width, h: p.height, depth: p.depth, yTop: y0 + p.height, legs: false, open});
      unit = u.unit; placeUnit(parts, unit, 0, u.dy, 0); overallH = y0 + p.height;
    } else {
      const w = p.mirrorWidth, h = p.mirrorHeight, round = p.mirror === 'round', ow = round ? Math.min(w, h) : w, oh = round ? ow : h;
      parts.push(part('mirror-back', 'mirror-frame', 'front', {fn: 'slab', outline: S.mirrorOutline(p.mirror, ow, oh, y0), t: 12, profile: ['square', 12, 0]}, [0, 0, zB + 30 + 12], [-Math.PI / 2, 0, 0], {cut: [ow, oh, 12]}));
      parts.push(part('mirror-glass', 'mirror', 'mirror', {fn: 'slab', outline: S.mirrorOutline(p.mirror, ow - 4, oh - 4, y0 + 2), t: 5, profile: ['square', 5, 0]}, [0, 0, zB + 30 + 12 + 5], [-Math.PI / 2, 0, 0], {cut: [ow - 4, oh - 4, 5], glass: true}));
      if (p.mirrorLight === 'back') parts.push(part('mirror-glow', 'led', 'led', {fn: 'slab', outline: S.mirrorOutline(p.mirror, ow - 60, oh - 60, y0 + 30), t: 2, profile: ['square', 2, 0]}, [0, 0, zB + 30 - 2], [-Math.PI / 2, 0, 0], {nocut: true}));
      if (p.mirrorLight === 'top') box(parts, 'mirror-lamp', 'led', 'led', [-ow * 0.3, ow * 0.3], [y0 + oh + 20, y0 + oh + 40], [zB + 30, zB + 140], {nocut: true}, 6);
      overallH = y0 + oh + (p.mirrorLight === 'top' ? 40 : 0);
      extras.push({kind: 'mirror', light: p.mirrorLight});
    }
  }
  const meta = unit ? {...unit.meta} : {kind: k, board: 18, front: 18, back: 8, modules: 0, moduleWidths: [], bays: 0, leaves: 0, drawers: 0, hinges: 0, counts: {runners: {}}, innerDepth: 0, runner: 0, maxSpan: 0, smallestFront: 9999, maxLeafH: 0, widestDrawer: 0, hang: [], inset: false, sliding: false};
  if (unit && meta.grid) meta.grid = {...meta.grid};
  const width = k === 'mirror' && p.mirrorCabinet !== 'cabinet' ? (p.mirror === 'round' ? Math.min(p.mirrorWidth, p.mirrorHeight) : p.mirrorWidth) : p.width;
  meta.kind = k; meta.overall = {width: Math.round(width + (k === 'basin' ? 0 : 0)), depth: Math.round(k === 'basin' ? p.depth + 10 : k === 'mirror' && p.mirrorCabinet !== 'cabinet' ? 60 : p.depth), height: Math.round(overallH)};
  meta.extras = extras; meta.basinRim = k === 'basin' ? p.mountHeight : 0;
  const dims = [
    {view: 'front', a: [-width / 2, 0], b: [width / 2, 0], off: 70, text: `${Math.round(width)}`, orient: 'h'},
    {view: 'front', a: [width / 2, 0], b: [width / 2, overallH], off: 80, text: `${Math.round(overallH)}`, orient: 'v'},
    ...(k === 'basin' ? [{view: 'side', a: [-p.depth / 2, 0], b: [-p.depth / 2, p.mountHeight], off: -60, text: `${p.mountHeight}`, orient: 'v'}] : []),
    {view: 'side', a: [-meta.overall.depth / 2, 0], b: [meta.overall.depth / 2, 0], off: 70, text: `${meta.overall.depth}`, orient: 'h'}
  ];
  return {family: FAMILY, params: p, parts, meta, dims, sectionX: 0, detail: null};
}

/** Basin: vessel on the top (round turned bowl or a thin-walled rectangle), stone trough, or undermount bowl; tap. */
function basin(parts, id, p, x, zc, w, d, body, top) {
  const mat = p.basinType === 'integrated' ? 'top' : 'sink';
  if (p.basinType === 'vessel' && p.basinShape === 'round') {
    const r = w / 2, h = 130;
    parts.push(part(id, 'basin', mat, {fn: 'lathe', profile: [[0, 0.5], [0, r * 0.55], [h * 0.35, r * 0.9], [h, r], [h, r - 7], [h * 0.4, r * 0.84], [10, r * 0.5], [10, 0.5]], segments: 48}, [x, top, zc], [0, 0, 0], {nocut: true}));
  } else {
    const h = p.basinType === 'vessel' ? 130 : p.basinType === 'integrated' ? 120 : 170, y1 = p.basinType === 'vessel' ? top + h : top - (p.basinType === 'undermount' ? p.topThickness : 0), y0 = y1 - h, t = p.basinType === 'integrated' ? 12 : 6;
    box(parts, `${id}-floor`, 'basin', mat, [x - w / 2, x + w / 2], [y0, y0 + t], [zc - d / 2, zc + d / 2], {nocut: true}, 2);
    for (const s of [-1, 1]) {
      box(parts, `${id}-wx${s}`, 'basin', mat, s < 0 ? [x - w / 2, x - w / 2 + t] : [x + w / 2 - t, x + w / 2], [y0, y1], [zc - d / 2, zc + d / 2], {nocut: true}, 2);
      box(parts, `${id}-wz${s}`, 'basin', mat, [x - w / 2, x + w / 2], [y0, y1], s < 0 ? [zc - d / 2, zc - d / 2 + t] : [zc + d / 2 - t, zc + d / 2], {nocut: true}, 2);
    }
  }
  const floorY = p.basinType === 'vessel' ? top + 10 : top - (p.basinType === 'undermount' ? p.topThickness : 0) - (p.basinType === 'integrated' ? 108 : 164);
  parts.push(part(`${id}-drain`, 'basin', 'steel', {fn: 'lathe', profile: [[0, 22], [3, 22], [3, 0.5]]}, [x, floorY, zc], [0, 0, 0], {nocut: true}));
  // Tap: from the wall above the basin, or a mixer on the top behind it.
  const zW = -p.depth / 2, rim = p.basinType === 'vessel' ? top + 130 : top;
  if (p.tap === 'wall') {
    const y = rim + 170, reach = Math.max(120, zc - zW - 40);
    parts.push(part(`${id}-tap`, 'tap', 'steel', {fn: 'tube', points: [[x, y, zW + 2], [x, y, zW + reach]], r: 11}, [0, 0, 0], [0, 0, 0], {nocut: true}));
    box(parts, `${id}-tap-plate`, 'tap', 'steel', [x - 35, x + 35], [y - 60, y + 30], [zW, zW + 6], {nocut: true}, 6);
  } else {
    const tz = zc - d / 2 - 40, th = p.basinType === 'vessel' ? 300 : 180;
    parts.push(part(`${id}-tap`, 'tap', 'steel', {fn: 'tube', points: [[x, top, tz], [x, top + th, tz], [x, top + th, tz + 140]], r: 12}, [0, 0, 0], [0, 0, 0], {nocut: true}));
  }
}

export const weights = (compiled, materials, buildMesh) => S.weights(compiled, materials, buildMesh);
export function validate(design) {
  const {params: p, meta: m} = design, issues = [], add = (level, code, value) => issues.push({level, code, value});
  if (p.kind === 'basin') {
    if (m.basinRim > 930) add('warn', 'rimHigh', m.basinRim); else if (m.basinRim < 780) add('warn', 'rimLow', m.basinRim);
    if (m.drawers) add('info', 'trapCut', 0);
  }
  if (m.drawers && m.smallestFront < 100) add('warn', 'drawerLow', m.smallestFront);
  if (m.maxSpan > 900) add('warn', 'shelfSpan', m.maxSpan);
  return issues;
}
export const ROLE_BATH = {
  'vanity-top': ['Lavabo tezgahı', 'Vanity top', 'Su yalıtımlı kenarlar; lavabo kesimi', 'Sealed edges; basin cut-out'],
  basin: ['Lavabo', 'Basin', '', '']
};
Object.assign(S.ROLE, ROLE_BATH);

/** Bathroom bill: panel cut list and hardware, plus basin, tap and mirror rows. */
export function bathBom(compiled, materials, lang, buildMesh, text) {
  const tr = lang === 'tr', b = S.storageBom(compiled, materials, lang, buildMesh, text), p = compiled.params;
  const add = (nameTr, nameEn, qty, specTr, specEn) => b.rows.push({code: `A${String(b.rows.filter(r => r.code[0] === 'A').length + 1).padStart(2, '0')}`, nameTr, nameEn, qty, size: [0, 0, 0], material: tr ? 'Sıhhi tesisat' : 'Sanitary', specTr, specEn, internal: false});
  if (p.kind === 'basin') {
    const n = p.basins === 'double' ? 2 : 1, kind = {vessel: ['Tezgah üstü çanak lavabo', 'Vessel basin'], integrated: ['Taş gövdeli entegre lavabo', 'Integrated stone trough'], undermount: ['Tezgah altı lavabo', 'Undermount basin']}[p.basinType];
    add(kind[0], kind[1], n, `${text('sink')}; ${p.basinShape === 'round' ? 'yuvarlak' : 'dikdörtgen'}`, `${text('sink')}; ${p.basinShape}`);
    add(p.tap === 'wall' ? 'Ankastre duvar bataryası' : 'Lavabo bataryası', p.tap === 'wall' ? 'Concealed wall mixer' : 'Basin mixer', n, p.tap === 'wall' ? 'Gömme ankastre gövde, duvar kaplamasından önce' : 'Tezgah delikli', p.tap === 'wall' ? 'Concealed body, fitted before tiling' : 'Through the top');
    add('Sifon ve süzgeç', 'Trap and waste', n, 'Çekmecede U kesimi ile', 'With a U-cut in the drawer');
    if (p.base === 'wall') add('Asma dolap taşıyıcısı', 'Wall-hung bracket', 2, 'Yük sınıfı, bağlantı ve duvar yapısı seçilen donanımla doğrulanmalı', 'Verify load rating, fixings and wall construction for the selected hardware');
  }
  if (p.kind === 'mirror' && p.mirrorLight !== 'none') add('Ayna aydınlatması', 'Mirror light', 1, 'IP44, 3000 K, trafo duvar içinde', 'IP44, 3000 K, driver in the wall');
  return b;
}

/** Special starting models per style (not catalogue units). */
export function bathStarts(styles) {
  const look = {
    aura: {basin: {frontStyle: 'fluted', pull: 'cutout', basinType: 'vessel', basinShape: 'round', tap: 'wall', base: 'wall', width: 1000}, mirror: {mirror: 'organic', mirrorLight: 'back'}, top: {surface: 'stone', stone: 'travertine', polish: 'honed'}},
    japandi: {basin: {frontStyle: 'slats', pull: 'none', basinType: 'vessel', basinShape: 'rect', tap: 'wall', base: 'legs', legType: 'block', legHeight: 300, width: 900, height: 360}, mirror: {mirror: 'round', mirrorLight: 'back'}, top: {surface: 'wood', species: 'oak', stain: 'natural', finish: 'oil'}},
    scandinavian_modern: {basin: {frontStyle: 'flat', pull: 'knob', basinType: 'vessel', basinShape: 'round', tap: 'deck', base: 'legs', legType: 'taper', legHeight: 300, width: 800, height: 380}, mirror: {mirror: 'capsule', mirrorLight: 'top'}, top: {surface: 'stone', stone: 'carrara', polish: 'honed'}},
    mid_century_modern: {basin: {frontStyle: 'grooved', pull: 'edge', basinType: 'undermount', basinShape: 'rect', tap: 'deck', base: 'legs', legType: 'taper', legHeight: 280, width: 1200, basins: 'double'}, mirror: {mirror: 'round', mirrorLight: 'none'}, top: {surface: 'stone', stone: 'terrazzo', polish: 'honed'}},
    minimalism: {basin: {frontStyle: 'flat', pull: 'none', basinType: 'integrated', basinShape: 'rect', tap: 'wall', base: 'wall', width: 1200, height: 300}, mirror: {mirror: 'rect', mirrorLight: 'back'}, top: {surface: 'stone', stone: 'carrara', polish: 'honed'}},
    wabi_sabi: {basin: {frontStyle: 'slats', pull: 'leather', basinType: 'vessel', basinShape: 'round', tap: 'wall', base: 'wall', width: 900}, mirror: {mirror: 'organic', mirrorLight: 'none'}, top: {surface: 'stone', stone: 'travertine', polish: 'honed'}},
    industrial: {basin: {frontStyle: 'flat', pull: 'bar', basinType: 'integrated', basinShape: 'rect', tap: 'wall', base: 'legs', legType: 'metal', legHeight: 320, width: 1000, height: 300}, mirror: {mirror: 'rect', mirrorLight: 'top'}, top: {surface: 'stone', stone: 'concrete', polish: 'honed'}},
    bauhaus: {basin: {frontStyle: 'flat', pull: 'bar', basinType: 'vessel', basinShape: 'round', tap: 'deck', base: 'wall', width: 800}, mirror: {mirror: 'round', mirrorLight: 'none'}, top: {surface: 'stone', stone: 'nero', polish: 'polished'}},
    art_deco: {basin: {frontStyle: 'fluted', pull: 'knob', basinType: 'undermount', basinShape: 'rect', tap: 'deck', base: 'legs', legType: 'taper', legHeight: 260, width: 1000}, mirror: {mirror: 'arch', mirrorLight: 'back'}, top: {surface: 'stone', stone: 'calacatta', polish: 'polished'}},
    brutalism: {basin: {frontStyle: 'grooved', pull: 'cutout', basinType: 'integrated', basinShape: 'rect', tap: 'wall', base: 'wall', width: 1100, height: 320}, mirror: {mirror: 'stepped', mirrorLight: 'back'}, top: {surface: 'stone', stone: 'concrete', polish: 'honed'}}
  };
  const out = {basin: [], column: [], mirror: []};
  for (const st of styles) {
    const L = look[st.id]; if (!L) continue;
    const mats = {...(st.starts.dresser?.[0]?.[2] || {}), top: L.top, sink: {finish: ['industrial', 'brutalism', 'bauhaus'].includes(st.id) ? 'black' : 'white'}};
    const fronts = Object.fromEntries(['frontStyle', 'pull', 'caseEdge', 'fluteWidth'].filter(k => L.basin[k] !== undefined).map(k => [k, L.basin[k]]));
    const bays = L.basin.basins === 'double' ? [{cells: [C('drawers', {n: 2})]}, {cells: [C('drawers', {n: 2})]}] : L.basin.height < 340 ? [{cells: [C('drawers')]}] : st.id === 'wabi_sabi' ? [{cells: [C('open', {k: 0}), C('drawers', {mm: 160})]}] : [{cells: [C('drawers', {n: 2})]}];
    out.basin.push({style: st.id, seed: 1, p: {...defaultsFor('basin'), ...L.basin, bays, kind: 'basin', ...(L.basin.basinType === 'integrated' ? {topThickness: 40} : {})}, m: mats});
    out.column.push({style: st.id, seed: 1, p: {...defaultsFor('column'), ...fronts, base: L.basin.base === 'legs' ? 'legs' : 'wall', legType: L.basin.legType || 'taper', bays: [{cells: [C('door', {k: 3}), C('open', {mm: 280})]}], kind: 'column'}, m: mats});
    out.mirror.push({style: st.id, seed: 1, p: {...defaultsFor('mirror'), ...L.mirror, kind: 'mirror'}, m: mats});
    if (['minimalism', 'aura', 'mid_century_modern'].includes(st.id)) out.mirror.push({style: st.id, seed: 2, p: {...defaultsFor('mirror'), ...fronts, mirrorCabinet: 'cabinet', width: 800, height: 700, depth: 150, bays: [{cells: [C('mirror', {k: 2})]}, {cells: [C('mirror', {k: 2})]}], kind: 'mirror'}, m: mats});
  }
  return out;
}
