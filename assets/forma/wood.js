// Procedural wood maps: species colour, growth rings, rays and figure; finish sets gloss.
// Grain runs along v (texture height). Tile represents 300 × 600 mm of board.
import {WOODS, FINISHES, STAINS} from './catalog.js';
import {fbm, valueNoise, clamp} from './rng.js';
import {normalFromHeight} from './textile.js';

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// Periodic anisotropic value noise: repeats every px cells across and py cells along, so the tile has no seams.
const lat = (x, y, s) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function pn(x, y, s, px, py) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const X0 = ((xi % px) + px) % px, X1 = (X0 + 1) % px, Y0 = ((yi % py) + py) % py, Y1 = (Y0 + 1) % py;
  const a = lat(X0, Y0, s), b = lat(X1, Y0, s), c = lat(X0, Y1, s), d = lat(X1, Y1, s);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
const pfbm = (u, v, s, px, py, oct) => { let t = 0, a = 0.5, n = 0; for (let o = 0; o < oct; o++) { t += a * pn(u * px, v * py, s + o * 31, px, py); n += a; a *= 0.5; px *= 2; py *= 2; } return t / n; };

/**
 * Flat-sawn board face, 300 × 600 mm per tile (grain along v), seamless in both directions:
 * growth rings cut by the board plane give cathedral arches; earlywood/latewood with a sharp latewood edge;
 * long pores (ring-porous species in the earlywood), fine fibre streaks, ray flecks, slow colour drift.
 */
export function woodMaps(species, finish, {w = 1024, h = 2048, stain = 'natural'} = {}) {
  const S = WOODS[species] || WOODS.gurgen, Fi = FINISHES[finish] || FINISHES.matte, St = STAINS[stain] || STAINS.natural;
  const stainRgb = St.hex ? hex(St.hex) : null, base = hex(S.base), grain = hex(S.grain), baseLum = (base[0] + base[1] + base[2]) / 3;
  const ringPorous = ['oak', 'ash', 'smoked', 'ebonized', 'teak'].includes(species), seed = species.length * 13 + 5;
  const albedo = new Uint8ClampedArray(w * h * 4), rough = new Uint8ClampedArray(w * h * 4), height = new Float32Array(w * h);
  const rings = 300 / S.ring; // rings across the tile width at the board's flattest point
  for (let y = 0; y < h; y++) {
    const v = y / h;
    // where along the log this slice sits: the pith line wanders and the arches rise and fall (period = tile)
    const c0 = 0.5 + 0.16 * Math.sin(2 * Math.PI * v + seed) + 0.06 * Math.sin(4 * Math.PI * v + 1.7);
    const arch = Math.pow(0.5 - 0.5 * Math.cos(2 * Math.PI * (v + 0.1 * Math.sin(2 * Math.PI * v))), 2.2);
    for (let x = 0; x < w; x++) {
      const u = x / w, k = (y * w + x) * 4;
      const warp = (pfbm(u, v, seed, 1, 2, 4) - 0.5) * (0.35 + S.figure * 0.9) + (pfbm(u, v, seed + 7, 5, 2, 3) - 0.5) * 0.35;
      // periodic distance from the pith across the face plus the arch gives the year number at this point
      const across = Math.abs(Math.sin(Math.PI * (u - c0)));
      let R = (across * 0.85 + 0.15) * rings * 0.38 + arch * rings * 0.22 * (0.5 + S.figure) + warp * 1.4;
      R += 0.35 * Math.sin(R * 0.9 + seed) + (pn(R * 0.6, 0.5, seed + 13, 997, 1) - 0.5) * 0.5; // uneven years
      const f = R - Math.floor(R);
      // growth year: earlywood eases into latewood, a soft-but-clear edge into next year's earlywood
      const late = Math.pow(f, 2.2), edge = f > 0.9 ? Math.pow((1 - f) / 0.1, 0.7) : 1;
      const tone = late * edge * (0.55 + 0.45 * pfbm(u, v, seed + 17, 3, 6, 2));
      const fib = (pn(u * 340, v * 9, seed + 3, 340, 9) - 0.5) * 0.26 + (pn(u * 900, v * 22, seed + 4, 900, 22) - 0.5) * 0.16 + (pn(u * 60, v * 3, seed + 9, 60, 3) - 0.5) * 0.18;
      const sub = Math.pow(Math.abs(Math.sin(Math.PI * R * 3)), 18) * 0.18 * (1 - late);
      const poreN = pn(u * 420, v * 18, seed + 11, 420, 18), pore = poreN > (ringPorous ? 0.8 - (1 - late) * 0.12 : 0.9) ? (ringPorous ? 1 : 0.5) : 0;
      let ray = 0; if (S.rays > 0.2) { const rn = pn(u * 160, v * 30, seed + 2, 160, 30); if (rn > 1 - S.rays * 0.1) ray = (rn - (1 - S.rays * 0.1)) / (S.rays * 0.1); }
      const drift = (pfbm(u, v, seed + 21, 2, 1, 3) - 0.5) * 0.16;
      const t = Math.max(0, Math.min(1, tone * 0.62 + sub + fib * 0.5 + pore * 0.3));
      for (let c = 0; c < 3; c++) albedo[k + c] = clamp((base[c] + (grain[c] - base[c]) * t) * (1 + drift) + ray * 26 * (1 - t), 0, 255);
      if (stainRgb) {
        const lum = (albedo[k] + albedo[k + 1] + albedo[k + 2]) / 3 / baseLum, g = clamp(0.62 + 0.4 * lum, 0.55, 1.25);
        for (let c = 0; c < 3; c++) albedo[k + c] = clamp(albedo[k + c] + (stainRgb[c] * g - albedo[k + c]) * St.k, 0, 255);
      }
      albedo[k + 3] = 255;
      height[y * w + x] = tone * 0.35 - pore * 0.9 + fib * 0.25 + ray * 0.15;
      rough[k] = rough[k + 1] = rough[k + 2] = clamp(Fi.rough + pore * 0.25 - ray * 0.08 + late * 0.03, 0.04, 1) * 255; rough[k + 3] = 255;
    }
  }
  const normal = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const l = height[y * w + (x + w - 1) % w], r = height[y * w + (x + 1) % w], d = height[((y + h - 1) % h) * w + x], u = height[((y + 1) % h) * w + x];
    const nx = (l - r) * 0.6, ny = (d - u) * 0.6, len = Math.hypot(nx, ny, 1), k = (y * w + x) * 4;
    normal[k] = (nx / len * 0.5 + 0.5) * 255; normal[k + 1] = (ny / len * 0.5 + 0.5) * 255; normal[k + 2] = (1 / len * 0.5 + 0.5) * 255; normal[k + 3] = 255;
  }
  return {w, h, tileMm: [300, 600], albedo, normal, rough, clearcoat: Fi.clearcoat};
}
