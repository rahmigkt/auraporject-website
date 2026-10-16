// Design generation: sample a style, propose diverse variants, explore neighbours, blend two designs.
import {rng, hash, clamp, lerp} from './rng.js';
import {RANGES, ENUMS, normalize, fitSeatDepth} from './sofa.js';
import {STYLE_BY_ID, STYLES, KINDS} from './styles.js';
import {normalizeMaterials} from './catalog.js';

export const SCHEMA = 'aura.forma.design/1';

const continuousKeys = Object.keys(RANGES);
const enumKeys = Object.keys(ENUMS);

/** Clean an incoming design object (from file, AI or storage). */
export function normalizeDesign(d = {}) {
  const style = STYLE_BY_ID[d.style] ? d.style : 'japandi';
  const kind = KINDS[d.kind] ? d.kind : 'sofa';
  return {schema: SCHEMA, family: 'seating', kind, style, seed: (d.seed >>> 0) || 1, params: normalize(d.params || {}), materials: normalizeMaterials(d.materials || {})};
}

function sampleMaterials(style, r) {
  const m = style.mats;
  const fiber = r.weighted(m.fiber);
  const pattern = r.weighted(m.pattern);
  const color = r.weighted(m.color);
  let color2 = r.weighted(m.color);
  if (color2 === color) color2 = r.pick(['chalk', 'charcoal', 'oat', 'indigo']);
  return normalizeMaterials({
    fabric: {fiber, weave: r.weighted(m.weave), color, pattern: fiber === 'leather' || fiber === 'velvet' && pattern !== 'damask' ? 'none' : pattern, color2, scale: 1},
    welt: {color: r.next() < 0.6 ? color2 : null},
    wood: {species: r.weighted(m.wood), finish: r.weighted(m.finish)},
    metal: {finish: r.weighted(m.metal)}
  });
}

/**
 * Sample one design. locks: {params:{…}, materials:{…}} keeps customer-fixed choices.
 */
export function sample({style = 'japandi', kind = 'sofa', seed = 1, locks = {}} = {}) {
  const st = STYLE_BY_ID[style] || STYLES[0], k = KINDS[kind] || KINDS.sofa, r = rng(seed ^ hash(st.id + kind));
  const p = {};
  for (const key of enumKeys) p[key] = st.enums[key] ? r.weighted(st.enums[key]) : r.pick(ENUMS[key]);
  for (const key of continuousKeys) {
    const [lo, hi] = st.ranges[key] || RANGES[key];
    p[key] = r.range(lo, hi);
  }
  p.width = r.range(...k.width);
  p.depth += k.depthAdd;
  p.seatCount = r.int(...k.seats);
  if (kind !== 'armchair' && p.seatType === 'split' && p.width > 2300 && r.next() < 0.5) p.seatCount = 3;
  // Coupling rules between part types (keep combinations coherent).
  if (p.armType === 'wood' && !['frame', 'legs'].includes(p.baseType)) p.baseType = 'frame';
  if (p.baseType === 'sled' && ['rolled', 'scroll'].includes(p.armType)) p.armType = 'square';
  if (p.backType === 'tufted' && p.seatType === 'split' && kind === 'armchair') p.seatType = 'tight';
  if (kind === 'armchair') { p.pillows = Math.min(1, Math.round(p.pillows)); p.armWidth = Math.min(p.armWidth, 170); }
  p.pillows = Math.round(p.pillows);
  Object.assign(p, locks.params || {});
  if (!locks.params?.depth) {
    const [lo, hi] = st.ranges.seatDepth || [510, 600];
    Object.assign(p, fitSeatDepth(p, r.range(lo, hi)));
  }
  const materials = sampleMaterials(st, r);
  if (locks.materials) for (const [slot, v] of Object.entries(locks.materials)) materials[slot] = {...materials[slot], ...v};
  return normalizeDesign({kind, style: st.id, seed, params: p, materials});
}

/** Feature vector for diversity: continuous params scaled to [0,1], categorical one-hot (weighted). */
export function features(d) {
  const f = [];
  for (const key of continuousKeys) { const [lo, hi] = RANGES[key]; f.push((d.params[key] - lo) / (hi - lo)); }
  const weights = {armType: 1.4, backType: 1.4, baseType: 1.1, seatType: 0.8, legType: 0.7, cushionEdge: 0.6, welt: 0.3};
  for (const key of enumKeys) for (const v of ENUMS[key]) f.push(d.params[key] === v ? weights[key] ?? 0.5 : 0);
  f.push(d.materials.fabric.color === 'oat' ? 0 : 0.2);
  return f;
}

export const distance = (a, b) => { const fa = features(a), fb = features(b); let s = 0; for (let i = 0; i < fa.length; i++) s += (fa[i] - fb[i]) ** 2; return Math.sqrt(s); };

/** Farthest-point selection from a candidate pool: guarantees visibly different proposals. */
export function pickDiverse(pool, count, seedDesign = null) {
  const chosen = [], feats = pool.map(features);
  const dist = (i, j) => { let s = 0; for (let k = 0; k < feats[i].length; k++) s += (feats[i][k] - feats[j][k]) ** 2; return Math.sqrt(s); };
  const min = pool.map(() => Infinity);
  let first = 0;
  if (seedDesign) { const fs = features(seedDesign); pool.forEach((_, i) => { let s = 0; for (let k = 0; k < fs.length; k++) s += (fs[k] - feats[i][k]) ** 2; min[i] = Math.sqrt(s); }); first = min.indexOf(Math.max(...min)); }
  chosen.push(first);
  while (chosen.length < Math.min(count, pool.length)) {
    const last = chosen.at(-1);
    pool.forEach((_, i) => { min[i] = Math.min(min[i], dist(i, last)); });
    let best = -1, bestD = -1;
    pool.forEach((_, i) => { if (!chosen.includes(i) && min[i] > bestD) { bestD = min[i]; best = i; } });
    chosen.push(best);
  }
  return chosen.map(i => pool[i]);
}

/** count diverse proposals for a style/kind. Deterministic for a given round number. */
export function variants({style, kind = 'sofa', count = 12, round = 1, locks = {}} = {}) {
  const pool = [];
  for (let i = 0; i < count * 5; i++) pool.push(sample({style, kind, seed: hash(`${style}:${kind}:${round}:${i}`), locks}));
  return pickDiverse(pool, count);
}

/** Neighbourhood of a design: same style, perturbed proportions, occasional part swaps. */
export function similar(design, {count = 12, round = 1, strength = 0.14} = {}) {
  const st = STYLE_BY_ID[design.style] || STYLES[0], pool = [];
  for (let i = 0; i < count * 4; i++) {
    const r = rng(hash(`${design.seed}:similar:${round}:${i}`)), p = {...design.params};
    for (const key of continuousKeys) {
      if (key === 'seatCount' || key === 'pillows' || key === 'channelCount') continue;
      const [lo, hi] = RANGES[key]; p[key] = clamp(p[key] + (r.next() * 2 - 1) * strength * (hi - lo), lo, hi);
    }
    if (r.next() < 0.45) { const key = r.pick(['armType', 'backType', 'baseType', 'legType', 'cushionEdge', 'seatType']); p[key] = st.enums[key] ? r.weighted(st.enums[key]) : r.pick(ENUMS[key]); }
    const materials = structuredClone(design.materials);
    if (r.next() < 0.3) materials.fabric.color = r.weighted(st.mats.color);
    pool.push(normalizeDesign({...design, seed: hash(`${design.seed}:s:${round}:${i}`), params: p, materials}));
  }
  // Keep them near the original but different from each other.
  pool.sort((a, b) => distance(a, design) - distance(b, design));
  return pickDiverse(pool.slice(0, count * 2), count);
}

/** Blend two designs: continuous values interpolate, part types come from either parent. */
export function blend(a, b, t = 0.5, seed = 1) {
  const r = rng(seed ^ hash('blend')), p = {};
  for (const key of continuousKeys) p[key] = lerp(a.params[key], b.params[key], t);
  for (const key of enumKeys) p[key] = r.next() < t ? b.params[key] : a.params[key];
  const materials = r.next() < t ? structuredClone(b.materials) : structuredClone(a.materials);
  return normalizeDesign({kind: a.kind, style: t < 0.5 ? a.style : b.style, seed: hash(`${a.seed}x${b.seed}:${t}`), params: p, materials});
}
