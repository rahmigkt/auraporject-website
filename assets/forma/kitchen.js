// AURA kitchen: a run (or an island) of modules on the RİTMO panel engine. Every module is a real carcass
// (18 mm, 8 mm back in a groove, 2 mm reveals, drawerFit drawers, hinges by height) on adjustable legs behind a
// continuous plinth; a worktop runs over the base units with cut-outs for the sink; wall units hang above with
// the usual gap; tall units line up with the wall units. Appliance niches follow the built-in standards:
//   oven 600 high × 560–568 wide (595 appliance), microwave 380–390, integrated fridge 1780 (freezer + fridge),
//   dishwasher 450 / 600 wide on 820–870 under the worktop with an integrated door,
//   worktop 900 high (850–950), 600 deep, wall units 450–600 above the worktop, ≥ 650 mm hood clearance.
// Special pieces (corner carousels, pull-out larders, accessories) come later as accessories.
import * as S from './storage.js';
import {clamp} from './rng.js';
import {STONES, COLORS} from './catalog.js';

export const FAMILY = 'kitchen';
export const KINDS = {run: {}, island: {}};
export const BASE_TYPES = ['drawers', 'doors', 'drawerDoor', 'sink', 'hob', 'oven', 'dishwasher', 'open', 'tallFridge', 'tallOven', 'pantry'];
export const WALL_TYPES = ['doors', 'glass', 'open', 'flap', 'hood', 'none'];
export const WIDTHS = [150, 300, 400, 450, 500, 600, 800, 900, 1000, 1200];
export const TALL = ['tallFridge', 'tallOven', 'pantry'];
/** Widths that make sense per module (appliance standards). */
export const WIDTHS_FOR = {dishwasher: [450, 600], oven: [600], tallFridge: [600], tallOven: [600], hob: [600, 800, 900, 1000, 1200], sink: [450, 500, 600, 800, 900, 1000, 1200]};

export const RANGES = {
  worktopHeight: [850, 950, 5], topThickness: [12, 60, 1], topDepth: [580, 1300, 5], plinthHeight: [80, 150, 5],
  wallGap: [450, 750, 10], wallHeight: [360, 960, 10], wallDepth: [280, 400, 5], solidThickness: [20, 30, 1], fluteWidth: [12, 60, 1]
};
export const ENUMS = {
  railSystem:S.ENUMS.railSystem,
  runnerFixingSystem:S.ENUMS.runnerFixingSystem,
  shelfSupportSystem:S.ENUMS.shelfSupportSystem,
  runnerSystem: S.ENUMS.runnerSystem, hingeSystem:S.ENUMS.hingeSystem, connectorSystem:S.ENUMS.connectorSystem, backConstruction: S.ENUMS.backConstruction,
  frontStyle: S.ENUMS.frontStyle.filter(x => !['grooved', 'fluted', 'slats'].includes(x)), // no channelled/striped fronts in wet rooms
  pull: S.ENUMS.pull, frontFit: S.ENUMS.frontFit, caseEdge: S.ENUMS.caseEdge, caseLine: S.ENUMS.caseLine,
  sink: ['single', 'double', 'drainer'], sinkMount: ['undermount', 'inset'], tap: ['arc', 'straight', 'pullout'],
  hob: ['induction', 'gas'], hood: ['chimney', 'integrated', 'none'], backsplash: ['none', 'low', 'full'],
  board: ['mdf', 'solid'], frontBoard: ['mdf', 'solid']
};
const M = (type, w, wall = 'doors') => ({type, w, wall});
export const LAYOUTS = {
  run: () => [M('pantry', 600, 'none'), M('drawers', 600), M('sink', 800), M('dishwasher', 600), M('hob', 900, 'hood'), M('drawerDoor', 600), M('tallOven', 600, 'none'), M('tallFridge', 600, 'none')],
  island: () => [M('drawers', 800, 'none'), M('sink', 900, 'none'), M('dishwasher', 600, 'none'), M('doors', 800, 'none')]
};
const BASE = {railSystem:'legacy-round24',runnerFixingSystem:'legacy-unspecified',shelfSupportSystem:'legacy-generic',runnerSystem: 'legacy-side-12.7', hingeSystem:'legacy-unspecified', connectorSystem:'legacy-unspecified', backConstruction:'legacy-bay', worktopHeight: 900, topThickness: 30, topDepth: 600, plinthHeight: 120, wallGap: 550, wallHeight: 720, wallDepth: 330, solidThickness: 22, fluteWidth: 30,
  frontStyle: 'flat', pull: 'edge', frontFit: 'overlay', caseEdge: 'eased', caseLine: 'none', sink: 'single', sinkMount: 'undermount', tap: 'arc', hob: 'induction', hood: 'chimney', backsplash: 'low', board: 'mdf', frontBoard: 'mdf'};
export const defaultsFor = kind => ({...BASE, ...(kind === 'island' ? {topDepth: 1000, backsplash: 'none'} : {}), modules: LAYOUTS[KINDS[kind] ? kind : 'run'](), kind: KINDS[kind] ? kind : 'run'});
export const DEFAULTS = defaultsFor('run');
export const rangeFor = (key, p) => key === 'topDepth' ? (p.kind === 'island' ? [800, 1300, 10] : [580, 700, 5]) : RANGES[key];

export function normalizeModules(raw, kind) {
  const list = Array.isArray(raw) && raw.length ? raw.slice(0, 16) : LAYOUTS[kind]();
  return list.map(m => {
    let type = BASE_TYPES.includes(m?.type) ? m.type : 'doors';
    if (kind === 'island' && TALL.includes(type)) type = 'doors';
    const allowed = WIDTHS_FOR[type], w0 = Math.round(clamp(Number(m?.w) || 600, 150, 1200) / 10) * 10;
    const w = allowed ? allowed.reduce((a, b) => Math.abs(b - w0) < Math.abs(a - w0) ? b : a) : w0;
    let wall = WALL_TYPES.includes(m?.wall) ? m.wall : 'doors';
    if (kind === 'island' || TALL.includes(type)) wall = 'none';
    return {type, w, wall};
  });
}
export function normalize(input = {}) {
  const kind = KINDS[input.kind] ? input.kind : 'run', p = defaultsFor(kind);
  for (const key of Object.keys(RANGES)) if (input[key] !== undefined && Number.isFinite(+input[key])) { const [lo, hi, st] = rangeFor(key, {kind}); p[key] = Math.round(clamp(+input[key], lo, hi) / st) * st; }
  for (const [key, list] of Object.entries(ENUMS)) if (list.includes(input[key])) p[key] = input[key];
  p.modules = normalizeModules(input.modules ?? p.modules, kind);
  if (p.sink === 'drainer') p.sinkMount = 'inset';
  return p;
}

// ---- helpers -------------------------------------------------------------------------------------------------
const r1 = v => Math.round(v * 10) / 10;
const part = (id, role, mat, geom, pos, rot = [0, 0, 0], extra = {}) => ({id, role, mat, geom, pos: pos.map(r1), rot, ...extra});
function box(parts, id, role, mat, [x0, x1], [y0, y1], [z0, z1], extra = {}, r = 1) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0; if (!(w > 0.5 && h > 0.5 && d > 0.5)) return;
  parts.push(part(id, role, mat, {fn: 'cushion', w: r1(w), h: r1(h), d: r1(d), r: Math.min(r, w / 3, h / 3, d / 3)}, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], [0, 0, 0], extra));
}
const UNIT_KEYS = ['railSystem','runnerFixingSystem','shelfSupportSystem','hingeSystem','connectorSystem','backConstruction','runnerSystem', 'frontStyle', 'pull', 'frontFit', 'caseEdge', 'caseLine', 'solidThickness', 'fluteWidth', 'board', 'frontBoard'];
const D_BASE = 580; // carcass 561 + 1 + 18 mm front
const C = (type, o = {}) => ({type, ...o});
function baseBays(m, interiorH) {
  switch (m.type) {
    case 'drawers': case 'hob': return [{cells: [C('drawers', {n: 2}), C('drawers', {mm: 160, joined: true})]}];
    case 'drawerDoor': return [{cells: [C('door', {k: 1}), C('drawers', {mm: 160, joined: true})]}];
    case 'sink': return [{cells: [C('door', {inside: 'empty'})]}];
    case 'oven': return [{cells: [C('drawers', {mm: Math.max(100, interiorH - 600 - 18)}), C('niche', {mm: 600})]}];
    case 'open': return [{cells: [C('open', {k: 1})]}];
    case 'tallFridge': return [{cells: [C('door', {inside: 'empty', mm: 700}), C('door', {inside: 'empty', mm: 1062, joined: true}), C('door', {k: 1})]}];
    case 'tallOven': return [{cells: [C('drawers', {n: 2}), C('niche', {mm: 600}), C('niche', {mm: 390}), C('door', {k: 1})]}];
    case 'pantry': return [{cells: [C('door', {k: 4}), C('door', {k: 1, mm: 420})]}];
    default: return [{cells: [C('door', {k: 1})]}];
  }
}
const wallBays = (type, h) => type === 'glass' ? [{cells: [C('glass', {k: 1})]}] : type === 'open' ? [{cells: [C('open', {k: h > 600 ? 2 : 1})]}] : [{cells: [C('door', {k: h > 600 ? 1 : 0})]}];

/** Place one compiled unit: shift its parts and fold its counts into the kitchen totals. */
function place(parts, unit, prefix, dx, dy, counts, meta, dz = 0) {
  for (const q of unit.parts) {
    const p2 = {...q, id: prefix + q.id};
    if (q.geom.points && !q.pos.some(Boolean)) p2.geom = {...q.geom, points: q.geom.points.map(([x, y, z]) => [r1(x + dx), r1(y + dy), r1(z + dz)])};
    else p2.pos = [r1(q.pos[0] + dx), r1(q.pos[1] + dy), r1(q.pos[2] + dz)];
    parts.push(p2);
  }
  const c = unit.meta.counts;
  for (const [k, v] of Object.entries(c)) if (k === 'runners') for (const [len, n] of Object.entries(v)) counts.runners[len] = (counts.runners[len] || 0) + n; else counts[k] = (counts[k] || 0) + v;
  meta.leaves += unit.meta.leaves; meta.hinges += unit.meta.hinges; meta.drawers += unit.meta.drawers; meta.units++;
  meta.runner = Math.max(meta.runner, unit.meta.runner); meta.spans.push(unit.meta.maxSpan); if (unit.meta.drawers) meta.fronts.push(unit.meta.smallestFront);
  meta.leafH.push(unit.meta.maxLeafH);
}

// ---- compile ----------------------------------------------------------------------------------------------------
export function compile(raw) {
  const p = normalize(raw), parts = [], island = p.kind === 'island';
  const common = Object.fromEntries(UNIT_KEYS.map(k => [k, p[k]]));
  const T = p.board === 'solid' ? p.solidThickness : 18, TF = p.frontBoard === 'solid' ? p.solidThickness : 18;
  const baseTop = p.worktopHeight - p.topThickness, plinth = p.plinthHeight;
  const wallY0 = p.worktopHeight + p.wallGap, tallTop = wallY0 + p.wallHeight;
  const total = p.modules.reduce((s, m) => s + m.w, 0), zB = -D_BASE / 2, zFace = D_BASE / 2;
  const counts = {runners: {}}, meta = {leaves: 0, hinges: 0, drawers: 0, units: 0, runner: 0, spans: [], fronts: [], leafH: [], appliances: []};
  const open = !!raw.openFronts;
  const grid = [];
  let x = -total / 2, hoodTop = 0;
  p.modules.forEach((m, i) => {
    const cx = x + m.w / 2, tall = TALL.includes(m.type), id = `m${i + 1}-`;
    grid.push({x0: r1(x), x1: r1(x + m.w), type: m.type, wall: m.wall});
    if (m.type === 'dishwasher') {
      // Integrated dishwasher: no carcass; a full-height door panel on the appliance, plinth continues under it.
      const f = {x0: x + 1, x1: x + m.w - 1, y0: plinth + 2, y1: baseTop - 3};
      const k0 = parts.length;
      box(parts, id + 'dw-front', 'dw-front', 'front', [f.x0, f.x1], [f.y0, f.y1], [zFace - TF, zFace], {cut: [f.x1 - f.x0, f.y1 - f.y0, TF], band: 'four'}, 2);
      if (p.pull !== 'none') {
        const len = Math.min(320, (m.w) * 0.5), y = f.y1 - 60;
        if (p.pull === 'bar') parts.push(part(id + 'dw-pull', 'pull', 'metal', {fn: 'tube', points: [[cx - len / 2, y, zFace], [cx - len / 2, y, zFace + 30], [cx + len / 2, y, zFace + 30], [cx + len / 2, y, zFace]], r: 6}, [0, 0, 0], [0, 0, 0], {nocut: true}));
        else box(parts, id + 'dw-pull', 'pull', p.pull === 'cutout' ? 'dark' : 'metal', [cx - len / 2, cx + len / 2], [f.y1 - 22, f.y1], [zFace - 14, zFace + 1], {nocut: true}, 3);
        counts.pulls = (counts.pulls || 0) + 1;
      } else counts.push = (counts.push || 0) + 1;
      box(parts, id + 'dw-body', 'appliance', 'steel', [x + 3, x + m.w - 3], [plinth, baseTop - 5], [zB + 30, zFace - TF], {internal: !open, nocut: true}, 2);
      if (open) for (const q of parts.slice(k0)) if (q.role !== 'appliance') { q.rot = [-Math.PI / 2 * 0.95, 0, 0]; const dy = q.pos[1] - (plinth + 2), dz = q.pos[2] - zFace; q.pos = [q.pos[0], r1(plinth + 2 + dz * 0.08), r1(zFace + dy * 0.99)]; }
      meta.appliances.push({kind: 'dishwasher', w: m.w, niche: [m.w, 820, 560]});
    } else {
      const H = tall ? tallTop : baseTop, interiorH = H - plinth - 2 * T;
      const unit = S.compile({...common, kind: 'unit', width: m.w, height: H, depth: D_BASE, base: 'legs', legType: 'metal', legSize: 25, legHeight: plinth, topType: 'flush', bays: baseBays(m, interiorH), openFronts: open});
      place(parts, unit, id, cx, 0, counts, meta);
      // Appliances in their niches.
      const g = unit.meta.grid.bays[0];
      unit.params.bays[0].cells.forEach((c, j) => {
        if (c.type !== 'niche') return;
        const {y0, y1} = g.cells[j], ax0 = cx - 595 / 2, ax1 = cx + 595 / 2, ah = y1 - y0 >= 590 ? 595 : 382;
        box(parts, `${id}app${j}`, 'appliance', 'appliance', [ax0, ax1], [y0 + 2, y0 + 2 + ah], [zB + 40, zFace - 1], {nocut: true}, 3);
        box(parts, `${id}app${j}-glass`, 'appliance-door', 'glass', [ax0 + 40, ax1 - 40], [y0 + 60, y0 + ah - (ah > 500 ? 110 : 40)], [zFace - 1, zFace + 1], {nocut: true}, 2);
        parts.push(part(`${id}app${j}-handle`, 'appliance-handle', 'steel', {fn: 'tube', points: [[ax0 + 60, y0 + ah - 55, zFace], [ax0 + 60, y0 + ah - 55, zFace + 30], [ax1 - 60, y0 + ah - 55, zFace + 30], [ax1 - 60, y0 + ah - 55, zFace]], r: 7}, [0, 0, 0], [0, 0, 0], {nocut: true}));
        meta.appliances.push({kind: ah > 500 ? 'oven' : 'microwave', w: 595, niche: [Math.round(Math.min(568, m.w - 2 * T)), Math.round(y1 - y0), 560]});
      });
      if (m.type === 'tallFridge') { box(parts, id + 'fridge', 'appliance', 'steel', [cx - 270, cx + 270], [plinth + T + 2, plinth + T + 1772], [zB + 40, zFace - TF - 4], {internal: !open, nocut: true}, 8); meta.appliances.push({kind: 'fridge', w: 560, niche: [560, 1780, 550]}); }
    }
    // Wall unit (run only), or the cooker hood over the hob.
    if (!island && !tall && m.wall !== 'none') {
      const hood = m.wall === 'hood' && p.hood !== 'none';
      if (hood && p.hood === 'chimney') {
        const hw = Math.min(m.w, 900), y0 = Math.max(p.worktopHeight + 650, wallY0 - 100);
        box(parts, id + 'hood', 'hood', 'steel', [cx - hw / 2, cx + hw / 2], [y0, y0 + 60], [zB, zB + 500], {nocut: true}, 3);
        box(parts, id + 'hood-chimney', 'hood', 'steel', [cx - 140, cx + 140], [y0 + 60, tallTop + 250], [zB, zB + 250], {nocut: true}, 2);
        hoodTop = Math.max(hoodTop, tallTop + 250); meta.appliances.push({kind: 'hood', w: hw});
      } else {
        const h = hood ? p.wallHeight - 260 : p.wallHeight, y0 = wallY0 + (hood ? 260 : 0);
        const unit = S.compile({...common, kind: 'unit', width: m.w, height: h + 60, depth: p.wallDepth, base: 'wall', legHeight: 60, topType: 'flush', bays: wallBays(m.wall, h), openFronts: open});
        place(parts, unit, id + 'w-', cx, y0 - 60, counts, meta, -(D_BASE - p.wallDepth) / 2);
        if (hood) { box(parts, id + 'hood', 'hood', 'steel', [cx - m.w / 2 + 2, cx + m.w / 2 - 2], [wallY0 + 200, wallY0 + 255], [zB, zB + p.wallDepth], {nocut: true}, 2); meta.appliances.push({kind: 'hoodIntegrated', w: m.w}); }
      }
    }
    x += m.w;
  });

  // Worktop over the base units (tall units interrupt it), with the sink cut-outs.
  const runs = []; let cur = null;
  grid.forEach((g, i) => { if (TALL.includes(g.type)) { cur = null; return; } if (cur) cur.x1 = g.x1; else { cur = {x0: g.x0, x1: g.x1, holes: []}; runs.push(cur); } if (g.type === 'sink') cur.holes.push(i); });
  const tz0 = island ? zFace + 20 - p.topDepth : zB, tz1 = island ? zFace + 20 : zB + p.topDepth, ty = [baseTop, p.worktopHeight];
  const bowl = m => { const w = p.modules[m].w; return p.sink === 'double' ? Math.min(w - 120, 780) : p.sink === 'drainer' ? Math.min(w - 120, 860) : Math.min(w - 120, 540); };
  runs.forEach((r, ri) => {
    let a = r.x0; const hz0 = tz1 - 60 - 420, hz1 = tz1 - 60;
    r.holes.forEach(i => {
      const g = grid[i], cx = (g.x0 + g.x1) / 2, hw = bowl(i), h0 = cx - hw / 2, h1 = cx + hw / 2;
      box(parts, `top${ri + 1}-${i}a`, 'worktop', 'top', [a, h0], ty, [tz0, tz1], {}, 2);
      box(parts, `top${ri + 1}-${i}f`, 'worktop', 'top', [h0, h1], ty, [hz1, tz1], {}, 2);
      box(parts, `top${ri + 1}-${i}b`, 'worktop', 'top', [h0, h1], ty, [tz0, hz0], {}, 2);
      sinkParts(parts, `sink${i}`, p, cx, hw, baseTop, p.worktopHeight, (hz0 + hz1) / 2, 420, tz0);
      a = h1;
    });
    box(parts, `top${ri + 1}-end`, 'worktop', 'top', [a, r.x1], ty, [tz0, tz1], {}, 2);
    if (!island && p.backsplash !== 'none') box(parts, `splash${ri + 1}`, 'backsplash', 'top', [r.x0, r.x1], [p.worktopHeight, p.backsplash === 'full' ? wallY0 : p.worktopHeight + 100], [zB, zB + 12], {}, 1);
  });
  // Hobs.
  grid.forEach((g, i) => {
    if (g.type !== 'hob') return;
    const cx = (g.x0 + g.x1) / 2, w = Math.min(g.x1 - g.x0 - 60, g.x1 - g.x0 >= 900 ? 860 : 580), zc = (tz0 + tz1) / 2 + (island ? 0 : 10), y = p.worktopHeight;
    if (p.hob === 'induction') box(parts, `hob${i}`, 'hob', 'appliance', [cx - w / 2, cx + w / 2], [y, y + 5], [zc - 260, zc + 260], {nocut: true}, 2);
    else {
      box(parts, `hob${i}`, 'hob', 'steel', [cx - w / 2, cx + w / 2], [y, y + 8], [zc - 260, zc + 260], {nocut: true}, 3);
      const n = w > 700 ? 5 : 4, pts = n === 4 ? [[-1, -1], [1, -1], [-1, 1], [1, 1]] : [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]];
      pts.forEach(([u, v], k) => parts.push(part(`hob${i}-burner${k}`, 'hob', 'appliance', {fn: 'lathe', profile: [[0, 45], [14, 45], [16, 32], [22, 30]]}, [cx + u * w * 0.28, y + 8, zc + v * 130], [0, 0, 0], {nocut: true})));
      for (const s of [-1, 1]) box(parts, `hob${i}-grate${s}`, 'hob', 'appliance', [cx - w / 2 + 20, cx + w / 2 - 20], [y + 30, y + 36], [zc + s * 130 - 4, zc + s * 130 + 4], {nocut: true}, 1);
    }
    meta.appliances.push({kind: p.hob === 'induction' ? 'induction' : 'gasHob', w: Math.round(w)});
  });
  // Continuous plinth (recessed 50 mm), end panels on an island, back panel facing the seats.
  box(parts, 'plinth-strip', 'plinth', 'case', [-total / 2, total / 2], [0, plinth], [zFace - 50 - 18, zFace - 50], {band: 'long'});
  if (island) {
    box(parts, 'island-back', 'end-panel', 'front', [-total / 2, total / 2], [0, baseTop], [zB - 18, zB], {band: 'four'}, 2);
    for (const s of [-1, 1]) box(parts, `island-end${s < 0 ? 'L' : 'R'}`, 'end-panel', 'front', s < 0 ? [-total / 2 - 18, -total / 2] : [total / 2, total / 2 + 18], [0, baseTop], [zB - 18, zFace], {band: 'four'}, 2);
  }
  const overall = {width: Math.round(total + (island ? 36 : 0)), depth: Math.round(Math.max(tz1, zFace) - Math.min(tz0, zB - (island ? 18 : 0))), height: Math.round(Math.max(p.worktopHeight + (p.tap === 'pullout' ? 420 : 360), p.modules.some(m => TALL.includes(m.type)) || (!island && p.modules.some(m => m.wall !== 'none')) ? tallTop : 0, hoodTop))};
  const fullMeta = {kind: p.kind, overall, board: T, front: TF, back: 8, modules: meta.units, moduleWidths: p.modules.map(m => m.w), bays: p.modules.length, leaves: meta.leaves, drawers: meta.drawers, hinges: meta.hinges,
    innerDepth: D_BASE - 18 - 18, runner: meta.runner, maxSpan: Math.max(0, ...meta.spans), smallestFront: Math.min(9999, ...meta.fronts), maxLeafH: Math.max(0, ...meta.leafH), counts, appliances: meta.appliances,
    inset: p.frontFit === 'inset', sliding: false, hang: [], widestDrawer: 0, moduleCount: p.modules.length, length: total, worktopHeight: p.worktopHeight, grid: {total, modules: grid, baseTop, plinth, wallY0, tallTop}};
  const dims = [
    {view: 'front', a: [-overall.width / 2, 0], b: [overall.width / 2, 0], off: 70, text: `${overall.width}`, orient: 'h'},
    {view: 'front', a: [overall.width / 2, 0], b: [overall.width / 2, p.worktopHeight], off: 60, text: `${p.worktopHeight}`, orient: 'v'},
    {view: 'side', a: [-overall.depth / 2, 0], b: [overall.depth / 2, 0], off: 70, text: `${overall.depth}`, orient: 'h'},
    {view: 'section', a: [-overall.depth / 2, 0], b: [-overall.depth / 2, overall.height], off: -120, text: `${overall.height}`, orient: 'v'},
    ...grid.map(g => ({view: 'front', a: [g.x0, overall.height], b: [g.x1, overall.height], off: -40, text: `${Math.round(g.x1 - g.x0)}`, orient: 'h'}))
  ];
  const first = grid.find(g => !TALL.includes(g.type)) || grid[0];
  return {family: FAMILY, params: p, parts, meta: fullMeta, dims, sectionX: Math.round((first.x0 + first.x1) / 2), detail: null};
}

/** Sink bowl(s), rim (inset), drain and tap. Bowls hang from the worktop; z is the bowl centre. */
function sinkParts(parts, id, p, cx, w, topY0, topY1, zc, d, zBack) {
  const mat = 'sink', depth = 190, y1 = topY1 - (p.sinkMount === 'inset' ? 0 : p.topThickness), y0 = y1 - depth;
  const bowls = p.sink === 'double' ? [[cx - w / 2, cx - 10], [cx + 10, cx + w / 2]] : p.sink === 'drainer' ? [[cx - w / 2, cx + w * 0.05]] : [[cx - w / 2, cx + w / 2]];
  bowls.forEach(([a, b], k) => {
    box(parts, `${id}-b${k}-floor`, 'sink', mat, [a, b], [y0, y0 + 2], [zc - d / 2, zc + d / 2], {nocut: true}, 1);
    for (const s of [-1, 1]) {
      box(parts, `${id}-b${k}-wx${s}`, 'sink', mat, s < 0 ? [a, a + 1.5] : [b - 1.5, b], [y0, y1], [zc - d / 2, zc + d / 2], {nocut: true}, 0.5);
      box(parts, `${id}-b${k}-wz${s}`, 'sink', mat, [a, b], [y0, y1], s < 0 ? [zc - d / 2, zc - d / 2 + 1.5] : [zc + d / 2 - 1.5, zc + d / 2], {nocut: true}, 0.5);
    }
    parts.push(part(`${id}-b${k}-drain`, 'sink', 'steel', {fn: 'lathe', profile: [[0, 30], [3, 30], [3, 0.5]]}, [(a + b) / 2, y0 + 2, zc], [0, 0, 0], {nocut: true}));
  });
  if (p.sinkMount === 'inset') {
    const pad = 25;
    box(parts, `${id}-rimF`, 'sink', mat, [cx - w / 2 - pad, cx + w / 2 + pad], [topY1, topY1 + 1.5], [zc + d / 2, zc + d / 2 + pad], {nocut: true}, 0.5);
    box(parts, `${id}-rimB`, 'sink', mat, [cx - w / 2 - pad, cx + w / 2 + pad], [topY1, topY1 + 1.5], [zc - d / 2 - pad, zc - d / 2], {nocut: true}, 0.5);
    for (const s of [-1, 1]) box(parts, `${id}-rim${s}`, 'sink', mat, s < 0 ? [cx - w / 2 - pad, cx - w / 2] : [cx + w / 2, cx + w / 2 + pad], [topY1, topY1 + 1.5], [zc - d / 2, zc + d / 2], {nocut: true}, 0.5);
    if (p.sink === 'drainer') { box(parts, `${id}-drainer`, 'sink', mat, [cx + w * 0.05 + 12, cx + w / 2], [topY1 - 6, topY1 + 1], [zc - d / 2, zc + d / 2], {nocut: true}, 0.5); for (let k = 1; k < 8; k++) box(parts, `${id}-rib${k}`, 'seam', 'dark', [cx + w * 0.05 + 20, cx + w / 2 - 10], [topY1 + 0.5, topY1 + 1.5], [zc - d / 2 + k * d / 8 - 2, zc - d / 2 + k * d / 8 + 2], {nocut: true}, 0.3); }
  }
  // Tap behind the bowl.
  const tx = p.sink === 'drainer' ? cx - w * 0.22 : cx, tz = zc - d / 2 - 45, ty = topY1;
  const pts = p.tap === 'straight' ? [[tx, ty, tz], [tx, ty + 300, tz], [tx, ty + 300, tz + 200]] : p.tap === 'pullout' ? [[tx, ty, tz], [tx, ty + 380, tz], [tx, ty + 420, tz + 60], [tx, ty + 380, tz + 170], [tx, ty + 300, tz + 200]] : [[tx, ty, tz], [tx, ty + 260, tz], [tx, ty + 330, tz + 60], [tx, ty + 330, tz + 140], [tx, ty + 260, tz + 200]];
  parts.push(part(`${id}-tap`, 'tap', 'steel', {fn: 'tube', points: pts, r: p.tap === 'pullout' ? 14 : 11}, [0, 0, 0], [0, 0, 0], {nocut: true}));
  void zBack; void topY0;
}

export const weights = (compiled, materials, buildMesh) => S.weights(compiled, materials, buildMesh);
export function validate(design) {
  const {params: p, meta: m} = design, issues = [], add = (level, code, value) => issues.push({level, code, value});
  if (m.maxSpan > (m.board >= 22 ? 1000 : 900)) add('warn', 'shelfSpan', m.maxSpan); // light kitchen shelves; 900 mm modules are standard
  if (m.fronts?.length && m.smallestFront < 100) add('warn', 'drawerLow', m.smallestFront);
  const hood = p.modules.findIndex(x => x.type === 'hob'), sink = p.modules.findIndex(x => x.type === 'sink');
  if (p.kind === 'run' && p.hood !== 'none' && hood >= 0 && p.modules[hood].wall !== 'hood') add('warn', 'hoodMissing', 0);
  if (sink < 0) add('info', 'noSink', 0);
  if (hood >= 0 && sink >= 0) { const gap = Math.abs(p.modules.slice(Math.min(hood, sink) + 1, Math.max(hood, sink)).reduce((s, x) => s + x.w, 0)); if (gap < 300 && Math.abs(hood - sink) === 1) add('warn', 'hobNearSink', gap); }
  if (p.modules[0] && ['hob'].includes(p.modules[0].type) || p.modules.at(-1)?.type === 'hob') add('warn', 'hobAtEnd', 0);
  if (p.kind === 'run' && p.worktopHeight + p.wallGap < p.worktopHeight + 450) add('warn', 'wallLow', p.wallGap);
  add('info', 'antiTip', 0);
  return issues;
}

/** Cut list and hardware (from the panel engine) plus worktop, sink, tap and appliances. */
export function kitchenBom(compiled, materials, lang, buildMesh, text) {
  const tr = lang === 'tr', b = S.storageBom(compiled, materials, lang, buildMesh, text), p = compiled.params;
  const add = (nameTr, nameEn, qty, size, material, specTr, specEn) => b.rows.push({code: `A${String(b.rows.filter(r => r.code[0] === 'A').length + 1).padStart(2, '0')}`, nameTr, nameEn, qty, size, material, specTr, specEn, internal: false});
  const sinkName = {single: ['Tek hazneli evye', 'Single-bowl sink'], double: ['Çift hazneli evye', 'Double-bowl sink'], drainer: ['Damlalıklı evye', 'Sink with drainer']}[p.sink];
  const sinks = p.modules.filter(m => m.type === 'sink').length;
  if (sinks) add(sinkName[0], sinkName[1], sinks, [0, 0, 0], text('sink'), p.sinkMount === 'inset' ? 'Tezgah üstü montaj' : 'Tezgah altı montaj, tezgahta rodajlı kesim', p.sinkMount === 'inset' ? 'Inset (top-mounted)' : 'Undermount, polished cut-out');
  if (sinks) add(tr ? 'Batarya' : 'Tap', 'Tap', sinks, [0, 0, 0], text('steel'), {arc: 'Kuğu boyun', straight: 'Düz çıkış', pullout: 'Spiralli / çekilebilir'}[p.tap], {arc: 'Swan neck', straight: 'Straight spout', pullout: 'Pull-out spring'}[p.tap]);
  const AP = {oven: ['Ankastre fırın', 'Built-in oven', 'Niş 560–568 × 600, derinlik ≥ 560; arkada havalandırma', 'Niche 560–568 × 600, depth ≥ 560; rear ventilation'], microwave: ['Ankastre mikrodalga', 'Built-in microwave', 'Niş 560–568 × 380–390', 'Niche 560–568 × 380–390'],
    fridge: ['Ankastre buzdolabı (kombi)', 'Integrated fridge-freezer', 'Niş 560 × 1780 × 550; bazada ve üstte havalandırma ızgarası', 'Niche 560 × 1780 × 550; vents in the plinth and at the top'], dishwasher: ['Tam ankastre bulaşık makinesi', 'Fully integrated dishwasher', 'Niş 820–870 yükseklik; kapak paneli makineye monte', 'Niche 820–870 high; door panel fixed to the appliance'],
    hood: ['Davlumbaz (duvar tipi)', 'Chimney hood', 'Ocaktan en az 650 mm (gazlı ocakta 750 mm)', 'At least 650 mm above the hob (750 mm over gas)'], hoodIntegrated: ['Gömme aspiratör', 'Integrated hood', 'Üst dolap altına', 'Under the wall unit'],
    induction: ['İndüksiyon ocak', 'Induction hob', 'Tezgah kesimli', 'Cut into the worktop'], gasHob: ['Gazlı ocak', 'Gas hob', 'Tezgah kesimli; arkada duvarla en az 50 mm', 'Cut into the worktop; 50 mm from the wall']};
  const tally = new Map(); for (const a of compiled.meta.appliances) { const k = a.kind + (a.niche ? a.niche.join('x') : a.w); tally.set(k, {...a, qty: (tally.get(k)?.qty || 0) + 1}); }
  for (const a of tally.values()) { const n = AP[a.kind]; if (n) add(n[0], n[1], a.qty, a.niche ? [...a.niche] : [a.w, 0, 0], tr ? 'Cihaz' : 'Appliance', n[2], n[3]); }
  b.totals.lines.push([tr ? 'Mutfak uzunluğu' : 'Kitchen length', `${compiled.meta.length} mm`], [tr ? 'Tezgah yüksekliği' : 'Worktop height', `${p.worktopHeight} mm`]);
  return b;
}
export const ROLE_KITCHEN = {
  worktop: ['Tezgah', 'Worktop', 'Ön kenar ve görünen uçlar rodajlı; evye kesimi', 'Front edge and exposed ends finished; sink cut-out'],
  backsplash: ['Tezgah arası', 'Splashback', 'Tezgah ile aynı malzeme', 'Same material as the worktop'],
  'dw-front': ['Bulaşık makinesi kapağı', 'Dishwasher door panel', 'Makineye vidalı, 2 mm derz', 'Screwed to the appliance, 2 mm reveal'],
  'end-panel': ['Kapama paneli', 'End / back panel', 'Ada arka ve yan kapaması', 'Island back and end panels']
};
Object.assign(S.ROLE, ROLE_KITCHEN);

/** Starting kitchens per style, from the case-goods style looks. */
export function kitchenStarts(styles) {
  const runs = {
    a: [M('tallFridge', 600, 'none'), M('drawers', 600), M('sink', 800), M('dishwasher', 600), M('hob', 900, 'hood'), M('drawerDoor', 600), M('tallOven', 600, 'none')],
    b: [M('drawers', 600, 'glass'), M('sink', 900), M('dishwasher', 600), M('drawers', 400), M('hob', 800, 'hood'), M('doors', 600, 'open')],
    c: [M('pantry', 600, 'none'), M('tallFridge', 600, 'none'), M('oven', 600), M('hob', 600, 'hood'), M('drawers', 800), M('sink', 800), M('dishwasher', 600, 'doors')]
  };
  const islands = {a: [M('drawers', 800, 'none'), M('hob', 900, 'none'), M('drawers', 800, 'none')], b: [M('doors', 600, 'none'), M('sink', 900, 'none'), M('dishwasher', 600, 'none'), M('drawers', 600, 'none')]};
  const pick = (look, keys) => Object.fromEntries(keys.filter(k => look[k] !== undefined).map(k => [k, look[k]]));
  const out = {run: [], island: []};
  styles.forEach((st, si) => {
    const look = pick(st.look, ['frontStyle', 'pull', 'frontFit', 'caseEdge', 'fluteWidth']), mats = st.starts.dresser?.[0]?.[2] || null;
    const top = {aura: {surface: 'stone', stone: 'travertine', polish: 'honed'}, japandi: {surface: 'wood', species: 'oak', stain: 'natural', finish: 'oil'}, scandinavian_modern: {surface: 'stone', stone: 'carrara', polish: 'honed'}, mid_century_modern: {surface: 'wood', species: 'walnut', stain: 'natural', finish: 'oil'}, minimalism: {surface: 'stone', stone: 'concrete', polish: 'honed'}, wabi_sabi: {surface: 'stone', stone: 'travertine', polish: 'honed'}, industrial: {surface: 'stone', stone: 'concrete', polish: 'honed'}, bauhaus: {surface: 'stone', stone: 'nero', polish: 'polished'}, art_deco: {surface: 'stone', stone: 'calacatta', polish: 'polished'}, brutalism: {surface: 'stone', stone: 'concrete', polish: 'honed'}}[st.id] || {surface: 'stone', stone: 'carrara', polish: 'honed'};
    const m = mats ? {...mats, top, sink: {finish: ['industrial', 'bauhaus', 'brutalism'].includes(st.id) ? 'black' : 'steel'}} : {top};
    const sinkStyle = ['mid_century_modern', 'scandinavian_modern'].includes(st.id) ? {sink: 'double'} : st.id === 'wabi_sabi' ? {sinkMount: 'inset', sink: 'drainer'} : {};
    const tap = st.id === 'industrial' ? {tap: 'pullout'} : st.id === 'bauhaus' ? {tap: 'straight'} : {};
    const keys = si % 3 === 0 ? ['a', 'c'] : si % 3 === 1 ? ['b', 'a'] : ['c', 'b'];
    keys.forEach((k, j) => out.run.push({style: st.id, seed: j + 1, p: {...defaultsFor('run'), ...look, ...sinkStyle, ...tap, modules: structuredClone(runs[k]), kind: 'run', ...(st.id === 'art_deco' ? {wallHeight: 840} : {})}, m}));
    out.island.push({style: st.id, seed: 1, p: {...defaultsFor('island'), ...look, ...sinkStyle, ...tap, modules: structuredClone(islands[si % 2 ? 'b' : 'a']), kind: 'island'}, m});
  });
  return out;
}
void COLORS; void STONES;
