// Woven-textile material maps generated from the weave draft (warp/weft interlacing matrix).
// The weave definitions are the NAKIŞ ones: top(i,j) = warp i passes over weft j.
// Output is pure RGBA data (albedo, normal, roughness) at real thread scale, usable in three.js DataTextures.
import {WEAVES, FIBERS, COLORS, HIDES} from './catalog.js';
import {MOTIF_WEAVE} from '../nakis/weave.js?v=20261016b';
import {MOTIFS} from '../nakis/motifs.js?v=20261016b';
import {fbm, valueNoise, clamp} from './rng.js';

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const shade = (c, k) => c.map(v => clamp(v * k, 0, 255));
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => a / gcd(a, b) * b;

/** Weave draft as a boolean matrix (true = warp up) for the "kareli" diagram in the UI. */
export function draft(weave, size = 0) {
  const W = WEAVES[weave] || WEAVES.plain, n = size || Math.max(8, W.P * 2);
  return Array.from({length: n}, (_, j) => Array.from({length: n}, (_, i) => W.top(i, j)));
}

/** Colour sequence (in threads) for warp and weft, giving stripes, gingham and plaid. */
/** Density 1 (sparse/large) … 6 (dense/small) → size factor for stripes, checks and motif repeats. */
export const densityFactor = spec => 3 / (spec.density || 3) * (spec.scale || 1);
const MOTIF_REPEAT = 150; // mm at density 3

function sequences(spec, pitch, base, second) {
  const f = densityFactor(spec), t = mm => Math.max(2, Math.round(mm * f / pitch));
  const dark = shade(base, 0.62), light = mix(base, [245, 240, 228], 0.55);
  switch (spec.pattern) {
    case 'stripe': { const a = t(22), b = t(7); return {warp: [...Array(a).fill(base), ...Array(b).fill(second)], weft: [base]}; }
    case 'check': { const a = t(6); const s = [...Array(a).fill(base), ...Array(a).fill(mix(base, second, 0.7))]; return {warp: s, weft: s}; } // gingham: ground, half-tone, full tone
    case 'plaid': {
      const s = [...Array(t(26)).fill(base), ...Array(t(3)).fill(second), ...Array(t(9)).fill(dark), ...Array(t(2)).fill(light), ...Array(t(9)).fill(dark), ...Array(t(3)).fill(second)];
      return {warp: s, weft: s};
    }
    case 'damask': return {warp: [base], weft: [mix(base, second, 0.35)]};
    default: return {warp: [base], weft: [shade(base, 0.95)]};
  }
}

/** Damask figure mask: a NAKIŞ motif rasterised in a half-drop repeat (tile coordinates). */
const maskCache = new Map();
const MOTIF_PATTERNS = {floral: 'cancicegi', leaf: 'kalpyaprak', damask: 'damask'};
function motifMask(id, size) {
  const key = id + ':' + size;
  if (maskCache.has(key)) return maskCache.get(key);
  const m = MOTIFS[id] || MOTIFS.damask, shapes = m.build(m.counts?.at?.(-1) ?? 6).filter(sh => sh.closed !== false && sh.fill !== false && sh.pts?.length > 2);
  const mask = new Uint8Array(size * size), scale = size * 0.29;
  for (const [cx, cy] of [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]]) for (const sh of shapes) {
    const pts = sh.pts.map(([x, y]) => [cx * size + x * scale, cy * size - y * scale]);
    let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(size - 1, Math.ceil(y1)); y++) {
      const xs = [], yy = y + 0.5;
      for (let k = 0; k < pts.length; k++) { const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % pts.length]; if ((ay <= yy) !== (by <= yy)) xs.push(ax + (yy - ay) / (by - ay) * (bx - ax)); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k])); x <= Math.min(size - 1, Math.floor(xs[k + 1])); x++) mask[y * size + x] ^= 1;
    }
  }
  maskCache.set(key, mask);
  return mask;
}

/** Figure masks for printed / jacquard patterns in tile coordinates u,v ∈ [0,1). */
const PATTERN_MASK = {
  polka: (u, v) => { for (const [cx, cy] of [[0.25, 0.25], [0.75, 0.75], [0.25, 1.25], [1.25, 0.25], [-0.25, 0.75], [0.75, -0.25]]) if (Math.hypot(u - cx, v - cy) < 0.085) return 1; return 0; },
  geometric: (u, v) => { const d = Math.abs(u - 0.5) + Math.abs(v - 0.5), e = Math.min(u + v, 2 - u - v, Math.abs(u - v) + 1); return (Math.abs(d - 0.5) < 0.035 || d < 0.09 || e < 0.04) ? 1 : 0; },
  chevron: (u, v) => { const w = v * 3 + Math.abs(((u * 6) % 2) - 1) * 0.5; return (w - Math.floor(w)) < 0.38 ? 1 : 0; },
  houndstooth: (u, v) => { const i = Math.floor(u * 8), j = Math.floor(v * 8), up = ((i - j) % 4 + 4) % 4 < 2; return (up ? i % 8 < 4 : j % 8 < 4) ? 1 : 0; }
};

/**
 * Build fabric maps. spec: {fiber, weave, color, pattern, color2, scale}. Returns
 * {size, tileMm, albedo, normal, rough} where maps are Uint8ClampedArray RGBA of size×size.
 */
export function fabricMaps(spec, {maxPx = 1024} = {}) {
  const F = FIBERS[spec.fiber] || FIBERS.linen;
  const base = hex(COLORS[spec.color]?.hex || '#d8ccb4'), second = hex(COLORS[spec.color2]?.hex || '#3b3b38');
  if (!F.weave) return pileMaps(spec, F, base, maxPx);
  const pitch = F.thread * (spec.fiber === 'linen' ? 1.1 : 1); // mm per thread
  const W = WEAVES[spec.weave] || WEAVES.plain, damask = spec.pattern === 'damask';
  // Damask: the figure is woven in a contrasting structure (satin, or the reversed face of a satin ground).
  const Wfig = !damask ? W : spec.weave === 'satin' ? {P: W.P, top: (i, j) => !W.top(i, j)} : WEAVES[MOTIF_WEAVE[spec.weave] || 'satin'];
  const seq = sequences(spec, pitch, base, second);
  let n = lcm(lcm(W.P, Wfig.P), lcm(seq.warp.length, seq.weft.length));
  const motifPattern = !!MOTIF_PATTERNS[spec.pattern], printed = PATTERN_MASK[spec.pattern];
  const repeatMm = (motifPattern || printed) ? MOTIF_REPEAT * densityFactor(spec) * (spec.pattern === 'houndstooth' ? 0.12 : spec.pattern === 'polka' ? 0.45 : spec.pattern === 'chevron' ? 0.7 : 1) : 0;
  const target = repeatMm ? Math.round(repeatMm / pitch) : Math.round(96 / pitch);
  n = Math.max(n, Math.ceil(target / n) * n);
  const ppt = clamp(Math.floor(maxPx / n), n > 400 ? 2 : 3, 10), size = n * ppt; // ≥3 px per thread keeps the interlacing readable
  const albedo = new Uint8ClampedArray(size * size * 4), height = new Float32Array(size * size), rough = new Uint8ClampedArray(size * size * 4);
  const mask = motifPattern ? motifMask(spec.motif || MOTIF_PATTERNS[spec.pattern], size) : null;
  const seed = (spec.color?.length || 3) * 7 + (spec.weave?.length || 1);
  const slubWarp = Array.from({length: n}, (_, i) => 1 - F.slub * 0.35 * valueNoise(i * 0.37, 0.5, seed, 0));
  for (let y = 0; y < size; y++) {
    const j = Math.floor(y / ppt), fy = (y % ppt + 0.5) / ppt;
    for (let x = 0; x < size; x++) {
      const i = Math.floor(x / ppt), fx = (x % ppt + 0.5) / ppt;
      const fig = mask ? mask[y * size + x] : printed ? printed(x / size, y / size) : 0;
      const weave = fig && damask ? Wfig : W;
      const warpUp = weave.top(i, j);
      // Float length: how many crossings the top thread spans (satin floats look glossier and flatter).
      let run = 1;
      if (warpUp) { while (run < 6 && weave.top(i, j + run)) run++; } else { while (run < 6 && !weave.top(i + run, j)) run++; }
      const slubWeft = 1 - F.slub * 0.35 * valueNoise(0.5, j * 0.41, seed + 3, 0);
      const across = warpUp ? fx : fy, along = warpUp ? fy : fx;
      const w = warpUp ? slubWarp[i] : slubWeft;
      const prof = Math.sqrt(Math.max(0, 1 - ((across - 0.5) / (0.5 * w)) ** 2));
      const arch = 0.82 + 0.18 * Math.sin(Math.PI * clamp(along, 0, 1));
      const fuzz = F.fuzz * (fbm(x / ppt * 2, y / ppt * 2, seed, 3, n * 2) - 0.5);
      const h = clamp(prof * arch * (run > 2 ? 0.8 : 1) + fuzz, 0, 1);
      height[y * size + x] = h;
      // Damask shows the figure through the weave change; other figures are jacquard/print colour.
      const c = fig && !damask ? (warpUp ? second : shade(second, 0.94)) : warpUp ? seq.warp[i % seq.warp.length] : seq.weft[j % seq.weft.length];
      const tone = 0.7 + 0.36 * h + (run > 2 ? 0.06 : 0) + fuzz * 0.35;
      const k = (y * size + x) * 4;
      albedo[k] = clamp(c[0] * tone, 0, 255); albedo[k + 1] = clamp(c[1] * tone, 0, 255); albedo[k + 2] = clamp(c[2] * tone, 0, 255); albedo[k + 3] = 255;
      const r = clamp(F.rough - (run > 2 ? 0.18 : 0) + (1 - h) * 0.05, 0.05, 1) * 255;
      rough[k] = rough[k + 1] = rough[k + 2] = r; rough[k + 3] = 255;
    }
  }
  return {size, tileMm: n * pitch, albedo, normal: normalFromHeight(height, size, 2.2), rough};
}

/** Velvet, bouclé and leather have no visible weave: pile, loops or grain instead. */
function pileMaps(spec, F, base, maxPx) {
  // Velvet, chenille and bouclé can be printed; leather stays plain.
  const pat = HIDES.includes(spec.fiber) ? 'none' : spec.pattern, second = hex(COLORS[spec.color2]?.hex || '#3b3b38');
  const motifId = MOTIF_PATTERNS[pat] ? (spec.motif || MOTIF_PATTERNS[pat]) : null, printed = PATTERN_MASK[pat];
  const df = densityFactor(spec);
  const stripeMask = pat === 'stripe' ? (u => (u % 1) < 0.24 ? 1 : 0) : null, checkMask = pat === 'check' || pat === 'plaid' ? ((u, v) => ((Math.floor(u * 2) + Math.floor(v * 2)) % 2) || (pat === 'plaid' && (Math.abs(u - 0.5) < 0.03 || Math.abs(v - 0.5) < 0.03)) ? 1 : 0) : null;
  const patterned = motifId || printed || stripeMask || checkMask;
  const size = Math.min(patterned ? 768 : 512, maxPx), tileMm = patterned ? MOTIF_REPEAT * df * (pat === 'polka' ? 0.45 : pat === 'houndstooth' ? 0.12 : pat === 'stripe' ? 0.25 : pat === 'check' ? 0.1 : 1) : spec.fiber === 'leather' ? 90 : spec.fiber === 'suede' ? 120 : spec.fiber === 'nubuck' ? 80 : spec.fiber === 'boucle' ? 40 : 60;
  const mask = motifId ? motifMask(motifId, size) : null;
  const albedo = new Uint8ClampedArray(size * size * 4), rough = new Uint8ClampedArray(size * size * 4), height = new Float32Array(size * size);
  const per = 8;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * per, v = y / size * per; let h, tone, r;
    if (spec.fiber === 'leather') {
      const pebble = fbm(u * 26, v * 26, 11, 2, per * 26), crease = Math.abs(fbm(u * 2.25, v * 2.25, 5, 3, per * 2.25) - 0.5), patina = fbm(u * 0.75, v * 0.75, 2, 3, per * 0.75);
      h = clamp(0.55 + (pebble - 0.5) * 0.7 - (crease < 0.02 ? 0.25 : 0), 0, 1); tone = 0.88 + 0.16 * (patina - 0.5) + (pebble - 0.5) * 0.08 - (crease < 0.02 ? 0.04 : 0); r = F.rough + (pebble - 0.5) * 0.2;
    } else if (spec.fiber === 'suede') {
      // Napped split leather: fibrous fine noise, soft cloudy tone, and brushed streaks where the nap was stroked.
      const fibre = fbm(u * 60, v * 60, 31, 2, per * 60), cloud = fbm(u, v, 13, 3, per);
      const stroke = fbm(u * 0.625 + v * 2.5, v * 0.625, 17, 3, per * 0.625), brushed = Math.max(0, stroke - 0.55) * 2.2;
      h = clamp(0.5 + (fibre - 0.5) * 0.16, 0, 1); tone = 0.88 + (cloud - 0.5) * 0.16 + (fibre - 0.5) * 0.05 + brushed * 0.1; r = F.rough;
    } else if (spec.fiber === 'nubuck') {
      // Sanded grain: a very fine even nap with faint pores; a little more uniform than suede.
      const nap = fbm(u * 90, v * 90, 41, 2, per * 90), pores = fbm(u * 22, v * 22, 43, 2, per * 22), cloud = fbm(u * 1.5, v * 1.5, 47, 3, per * 1.5);
      h = clamp(0.55 + (nap - 0.5) * 0.22 - (pores < 0.3 ? 0.08 : 0), 0, 1); tone = 0.9 + (cloud - 0.5) * 0.1 + (nap - 0.5) * 0.06 - (pores < 0.3 ? 0.03 : 0); r = F.rough;
    } else if (spec.fiber === 'boucle') {
      const wu = u * 4.5 + (fbm(u * 3, v * 3, 8, 2, per * 3) - 0.5) * 1.2, wv = v * 4.5 + (fbm(u * 3, v * 3, 9, 2, per * 3) - 0.5) * 1.2;
      const fx = wu - Math.floor(wu), fy = wv - Math.floor(wv), jitter = valueNoise(Math.floor(wu), Math.floor(wv), 7, per * 4.5);
      const loop = Math.abs(Math.hypot(fx - 0.5 + (jitter - 0.5) * 0.2, fy - 0.5) - (0.22 + jitter * 0.16));
      h = clamp(1 - loop * 4 + (fbm(u * 9, v * 9, 3, 3, per * 9) - 0.5) * 0.6, 0, 1); tone = 0.9 + 0.14 * h; r = F.rough;
    } else {
      const crush = fbm(u, v, 21, 3, per), fine = fbm(u * 20, v * 20, 4, 2, per * 20);
      h = clamp(crush * 0.3 + fine * 0.3, 0, 1); tone = 0.9 + 0.1 * crush + (fine - 0.5) * 0.04; r = F.rough + (crush - 0.5) * 0.12;
    }
    const k = (y * size + x) * 4; height[y * size + x] = h;
    const fig = mask ? mask[y * size + x] : printed ? printed(x / size, y / size) : stripeMask ? stripeMask(x / size * 2) : checkMask ? checkMask(x / size, y / size) : 0;
    const col = fig ? second : base;
    albedo[k] = clamp(col[0] * tone, 0, 255); albedo[k + 1] = clamp(col[1] * tone, 0, 255); albedo[k + 2] = clamp(col[2] * tone, 0, 255); albedo[k + 3] = 255;
    rough[k] = rough[k + 1] = rough[k + 2] = clamp(r, 0.05, 1) * 255; rough[k + 3] = 255;
  }
  return {size, tileMm, albedo, normal: normalFromHeight(height, size, spec.fiber === 'leather' ? 1.4 : spec.fiber === 'suede' ? 0.55 : spec.fiber === 'nubuck' ? 0.4 : 1.8), rough};
}

/** Tangent-space normal map from a wrapping height field. */
export function normalFromHeight(height, size, strength = 2) {
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const l = height[y * size + (x + size - 1) % size], r = height[y * size + (x + 1) % size];
    const d = height[((y + size - 1) % size) * size + x], u = height[((y + 1) % size) * size + x];
    let nx = (l - r) * strength, ny = (d - u) * strength, nz = 1; const len = Math.hypot(nx, ny, nz);
    const k = (y * size + x) * 4;
    out[k] = (nx / len * 0.5 + 0.5) * 255; out[k + 1] = (ny / len * 0.5 + 0.5) * 255; out[k + 2] = (nz / len * 0.5 + 0.5) * 255; out[k + 3] = 255;
  }
  return out;
}

/** Approximate fabric need (metres of 1400 mm roll) from upholstered surface area, with waste allowance. */
export function yardage(areaMm2, {rollWidth = 1400, waste = 0.35, pattern = 'none'} = {}) {
  const extra = pattern === 'none' ? 0 : pattern === 'stripe' ? 0.1 : 0.2;
  return Math.ceil(areaMm2 * (1 + waste + extra) / rollWidth / 1000 * 10) / 10;
}
