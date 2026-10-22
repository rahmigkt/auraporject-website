// Design generation for every family: sample a style, propose diverse variants, explore neighbours, blend.
import {rng, hash, clamp, lerp} from './rng.js';
import {FAMILIES, familyOf} from './families.js';
import {applyOverrides, normalizeOverrides} from './overrides.js';

export const SCHEMA = 'aura.forma.design/1';
const has = (catalog, key) => typeof key === 'string' && Object.prototype.hasOwnProperty.call(catalog, key);

/** Clean an incoming design object (from file, AI or storage). */
export function normalizeDesign(d = {}) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
  // The old bed-led bedroom set is no longer offered: its pieces open as RİTMO case goods.
  if (d?.family === 'bedroom') d = {family: 'storage', kind: ['wardrobe', 'dresser', 'nightstand'].includes(d.kind) ? d.kind : 'wardrobe', style: d.style, seed: d.seed};
  const fam = familyOf(d), style = has(fam.byId, d.style) ? d.style : 'japandi';
  const kind = has(fam.kinds, d.kind) ? d.kind : fam.defaultKind;
  const out = {schema: SCHEMA, family: fam.id, kind, style, seed: (d.seed >>> 0) || 1, params: fam.mod.normalize({...(d.params || {}), kind}), materials: fam.normalizeMaterials(d.materials || {})};
  const ov = normalizeOverrides(d.overrides); if (ov.length) out.overrides = ov;
  return fam.couple ? fam.couple(out) : out;
}

/** Compile a design with its designer layer (free-form silhouettes and profiles). extra: e.g. {openFronts: true}. */
export const compileDesign = (d, extra = {}) => applyOverrides(familyOf(d).mod.compile({...d.params, kind: d.kind, ...extra}), d.overrides);

/** Sample one design. locks: {params:{…}, materials:{…}} keeps customer-fixed choices. */
export function sample({family = 'seating', style = 'japandi', kind, seed = 1, locks = {}} = {}) {
  const fam = familyOf({family}), st = has(fam.byId, style) ? fam.byId[style] : fam.styles[0];
  family = fam.id;
  kind = has(fam.kinds, kind) ? kind : fam.defaultKind;
  const r = rng(seed ^ hash(st.id + kind + (family === 'seating' ? '' : family)));
  let params = fam.sampleParams(st, kind, r, locks);
  const materials = fam.sampleMaterials(st, r);
  if (locks.materials) for (const [slot, v] of Object.entries(locks.materials)) if (v) materials[slot] = {...materials[slot], ...v};
  if (fam.repair) params = fam.repair(fam.mod.normalize({...params, kind}), materials);
  return normalizeDesign({family: fam.id, kind, style: st.id, seed, params, materials});
}

/** Feature vector for diversity: continuous params scaled to [0,1], categorical one-hot (weighted). */
export function features(d) {
  const fam = familyOf(d), {RANGES, ENUMS} = fam.mod, f = [];
  for (const key of Object.keys(RANGES)) { const [lo, hi] = RANGES[key]; f.push(((d.params[key] ?? lo) - lo) / (hi - lo)); }
  for (const key of Object.keys(ENUMS)) for (const v of ENUMS[key]) f.push(d.params[key] === v ? fam.featureWeights[key] ?? 0.5 : 0);
  return f;
}

export const distance = (a, b) => { const fa = features(a), fb = features(b); let s = 0; for (let i = 0; i < fa.length; i++) s += (fa[i] - fb[i]) ** 2; return Math.sqrt(s); };

/** Farthest-point selection from a candidate pool: guarantees visibly different proposals. */
export function pickDiverse(pool, count) {
  const chosen = [0], feats = pool.map(features), min = pool.map(() => Infinity);
  const dist = (i, j) => { let s = 0; for (let k = 0; k < feats[i].length; k++) s += (feats[i][k] - feats[j][k]) ** 2; return Math.sqrt(s); };
  while (chosen.length < Math.min(count, pool.length)) {
    const last = chosen.at(-1); let best = -1, bestD = -1;
    pool.forEach((_, i) => { min[i] = Math.min(min[i], dist(i, last)); if (!chosen.includes(i) && min[i] > bestD) { bestD = min[i]; best = i; } });
    chosen.push(best);
  }
  return chosen.map(i => pool[i]);
}

/** count diverse proposals for a family/style/kind. Deterministic for a given round number. */
export function variants({family = 'seating', style, kind, count = 12, round = 1, locks = {}} = {}) {
  const pool = [];
  for (let i = 0; i < count * 5; i++) pool.push(sample({family, style, kind, seed: hash(`${family}:${style}:${kind}:${round}:${i}`), locks}));
  return pickDiverse(pool, count);
}

/** Neighbourhood of a design: same style, perturbed proportions, occasional part swaps. */
export function similar(design, {count = 12, round = 1, strength = 0.14} = {}) {
  const fam = familyOf(design), {RANGES, ENUMS} = fam.mod, st = has(fam.byId, design.style) ? fam.byId[design.style] : fam.styles[0], pool = [];
  const sizeKeys = fam.id === 'table' ? ['length', 'width', 'height'] : [];
  for (let i = 0; i < count * 4; i++) {
    const r = rng(hash(`${design.seed}:similar:${round}:${i}`)), p = {...design.params};
    for (const key of Object.keys(RANGES)) {
      if (fam.fixedKeys.includes(key)) continue;
      const [lo, hi] = RANGES[key], k = sizeKeys.includes(key) ? 0.03 : strength;
      p[key] = clamp(p[key] + (r.next() * 2 - 1) * k * (hi - lo), lo, hi);
    }
    if (r.next() < 0.45) { const key = r.pick(fam.similarEnums); p[key] = st.enums[key] ? r.weighted(st.enums[key]) : r.pick(ENUMS[key]); }
    const materials = structuredClone(design.materials);
    pool.push(normalizeDesign({...design, seed: hash(`${design.seed}:s:${round}:${i}`), params: p, materials}));
  }
  pool.sort((a, b) => distance(a, design) - distance(b, design));
  return pickDiverse(pool.slice(0, count * 2), count);
}

/** Blend two designs: continuous values interpolate, part types come from either parent. */
export function blend(a, b, t = 0.5, seed = 1) {
  const fam = familyOf(a), {RANGES, ENUMS} = fam.mod, r = rng(seed ^ hash('blend')), p = {...a.params};
  for (const key of Object.keys(RANGES)) p[key] = lerp(a.params[key], b.params[key], t);
  for (const key of Object.keys(ENUMS)) p[key] = r.next() < t ? b.params[key] : a.params[key];
  const materials = r.next() < t ? structuredClone(b.materials) : structuredClone(a.materials);
  return normalizeDesign({family: fam.id, kind: a.kind, style: t < 0.5 ? a.style : b.style, seed: hash(`${a.seed}x${b.seed}:${t}`), params: p, materials});
}
