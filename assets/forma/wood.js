// Procedural wood maps: species colour, growth rings, rays and figure; finish sets gloss.
// Grain runs along v (texture height). Tile represents 300 × 600 mm of board.
import {WOODS, FINISHES, STAINS} from './catalog.js';
import {fbm, valueNoise, clamp} from './rng.js';
import {normalFromHeight} from './textile.js';

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export function woodMaps(species, finish, {w = 512, h = 1024, stain = 'natural'} = {}) {
  const S = WOODS[species] || WOODS.gurgen, Fi = FINISHES[finish] || FINISHES.matte, St = STAINS[stain] || STAINS.natural;
  const stainRgb = St.hex ? hex(St.hex) : null, baseLum = (hex(S.base)[0] + hex(S.base)[1] + hex(S.base)[2]) / 3;
  const base = hex(S.base), grain = hex(S.grain);
  const albedo = new Uint8ClampedArray(w * h * 4), rough = new Uint8ClampedArray(w * h * 4), height = new Float32Array(w * h);
  // Height field must be square for normalFromHeight; we compute the normal on a w×h grid with our own loop below.
  const seed = species.length * 13;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h;
    // Board seen on the face: distorted ring position across u, long slow wander along v.
    // Continuous anisotropic fibres, without a repeated sine-ring / zigzag pattern.
    // The species palette remains authoritative; relief is microscopic, not fluting.
    const warp = (fbm(u * 2, v * 1.2, seed, 3) - .5) * S.figure * 2;
    const late = fbm(u * 48 + warp, v * 2.4, seed + 9, 4);
    const fibre = fbm(u * 210 + warp * 2, v * 9, seed + 13, 2);
    const pores = Math.max(0,valueNoise(x * .7,y * .09,seed+4)-.78)*.12;
    let ray = 0;
    if (S.rays > .2) ray=Math.max(0,fbm(u*8,v*90,seed+2,2)-.68)*S.rays*.15;
    const t = clamp(.12 + late * .38 + fibre * .12 + pores, 0, 1);
    const k = (y * w + x) * 4;
    for (let c = 0; c < 3; c++) albedo[k + c] = clamp(base[c] + (grain[c] - base[c]) * t + ray * 40, 0, 255);
    if (stainRgb) { // stain or paint over the timber: colour changes, grain still reads through
      const lum = (albedo[k] + albedo[k + 1] + albedo[k + 2]) / 3 / baseLum, g = clamp(0.62 + 0.4 * lum, 0.55, 1.25);
      for (let c = 0; c < 3; c++) albedo[k + c] = clamp(albedo[k + c] + (stainRgb[c] * g - albedo[k + c]) * St.k, 0, 255);
    }
    albedo[k + 3] = 255;
    height[y * w + x] = 1 - late * .035 - fibre * .018 - pores * .15;
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
