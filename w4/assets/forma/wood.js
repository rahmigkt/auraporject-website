// Procedural wood maps: species colour, growth rings, rays and figure; finish sets gloss.
// Grain runs along v (texture height). Tile represents 300 × 600 mm of board.
import {WOODS, FINISHES} from './catalog.js';
import {fbm, valueNoise, clamp} from './rng.js';
import {normalFromHeight} from './textile.js';

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export function woodMaps(species, finish, {w = 512, h = 1024} = {}) {
  const S = WOODS[species] || WOODS.oak, Fi = FINISHES[finish] || FINISHES.oil;
  const base = hex(S.base), grain = hex(S.grain);
  const albedo = new Uint8ClampedArray(w * h * 4), rough = new Uint8ClampedArray(w * h * 4), height = new Float32Array(w * h);
  // Height field must be square for normalFromHeight; we compute the normal on a w×h grid with our own loop below.
  const seed = species.length * 13;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    // Board seen on the face: distorted ring position across u, long slow wander along v.
    const warp = (fbm(u * 3, v * 1.5, seed, 4, 3) - 0.5) * S.figure * 1.6 + (fbm(u * 1, v * 0.5, seed + 9, 3, 1) - 0.5) * 0.8;
    const ringPos = (u * 300 / S.ring) + warp * 12;
    const fr = ringPos - Math.floor(ringPos);
    const late = Math.pow(Math.max(0, Math.sin(fr * Math.PI)), 6);
    const pores = valueNoise(x * 0.9, y * 0.12, seed + 4, 0) > 0.82 ? 0.08 : 0;
    let ray = 0;
    if (S.rays > 0.2) { const rx = Math.floor(u * 160), rn = valueNoise(rx, Math.floor(v * 40), seed + 2, 0); if (rn > 1 - S.rays * 0.12) ray = 0.18; }
    const t = clamp(late * 0.7 + pores + (fbm(u * 8, v * 2, seed + 5, 3, 8) - 0.5) * 0.25, 0, 1);
    const k = (y * w + x) * 4;
    for (let c = 0; c < 3; c++) albedo[k + c] = clamp(base[c] + (grain[c] - base[c]) * t + ray * 40, 0, 255);
    albedo[k + 3] = 255;
    height[y * w + x] = 1 - late * 0.6 - pores * 2;
    rough[k] = rough[k + 1] = rough[k + 2] = clamp(Fi.rough + pores * 1.2 + late * 0.05, 0.04, 1) * 255; rough[k + 3] = 255;
  }
  const normal = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const l = height[y * w + (x + w - 1) % w], r = height[y * w + (x + 1) % w], d = height[((y + h - 1) % h) * w + x], u = height[((y + 1) % h) * w + x];
    const nx = (l - r) * 0.9, ny = (d - u) * 0.9, len = Math.hypot(nx, ny, 1), k = (y * w + x) * 4;
    normal[k] = (nx / len * 0.5 + 0.5) * 255; normal[k + 1] = (ny / len * 0.5 + 0.5) * 255; normal[k + 2] = (1 / len * 0.5 + 0.5) * 255; normal[k + 3] = 255;
  }
  return {w, h, tileMm: [300, 600], albedo, normal, rough, clearcoat: Fi.clearcoat};
}
