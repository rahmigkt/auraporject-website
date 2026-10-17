// Deterministic random numbers and noise. Pure: runs in browsers and Node.

/** Mulberry32 PRNG. Same seed → same sequence on every device. */
export function rng(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  const next = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    pick: list => list[Math.floor(next() * list.length)],
    /** Weighted choice from {key: weight}. */
    weighted(map) {
      const entries = Object.entries(map).filter(([, w]) => w > 0);
      const total = entries.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
      return entries.at(-1)[0];
    }
  };
}

/** Stable 32-bit hash of a string (FNV-1a). */
export function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

const lattice = (x, y, seed) => {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const smooth = t => t * t * (3 - 2 * t);

/** Tileable 2D value noise in [0,1]. period = repeat length in lattice cells. */
export function valueNoise(x, y, seed = 0, period = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = smooth(x - xi), fy = smooth(y - yi);
  const w = v => (period ? ((v % period) + period) % period : v);
  const a = lattice(w(xi), w(yi), seed), b = lattice(w(xi + 1), w(yi), seed);
  const c = lattice(w(xi), w(yi + 1), seed), d = lattice(w(xi + 1), w(yi + 1), seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Fractal (fbm) value noise, tileable when period is an integer. */
export function fbm(x, y, seed = 0, octaves = 4, period = 0) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + o * 17, period ? period * freq : 0);
    norm += amp; amp *= 0.5; freq *= 2;
  }
  return sum / norm;
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
