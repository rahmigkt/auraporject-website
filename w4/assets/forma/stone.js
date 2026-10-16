// Procedural stone maps: marble veining (fine, bold, net), travertine bands and pores, terrazzo chips,
// concrete-look ceramic. Tile represents 600 × 600 mm. Representative appearance, not a slab selection.
import {STONES} from './catalog.js';
import {fbm, valueNoise, clamp} from './rng.js';

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export function stoneMaps(id, polish = 'honed', {size = 1024} = {}) {
  const S = STONES[id] || STONES.carrara, base = hex(S.base), vein = hex(S.vein), seed = id.length * 31;
  const albedo = new Uint8ClampedArray(size * size * 4), rough = new Uint8ClampedArray(size * size * 4), normal = new Uint8ClampedArray(size * size * 4), height = new Float32Array(size * size);
  const per = 4, gloss = polish === 'polished' ? 0.08 : 0.42;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * per, v = y / size * per;
    const cloud = fbm(u * 1.5, v * 1.5, seed, 5, per * 1.5);
    let t = 0, h = 0.5;
    if (S.style === 'fine' || S.style === 'bold') {
      const warp = fbm(u * 0.8, v * 0.8, seed + 3, 5, per * 0.8) * (S.style === 'bold' ? 7 : 5);
      const line = Math.abs(Math.sin((u * 0.9 + v * 0.45 + warp) * Math.PI));
      const thin = Math.abs(Math.sin((u * 2.3 - v * 1.1 + warp * 1.6) * Math.PI));
      t = (S.style === 'bold' ? Math.max(0, 1 - line / 0.13) ** 0.7 : Math.max(0, 1 - line / 0.045) * 0.85) + Math.max(0, 1 - thin / 0.018) * 0.5 + (cloud - 0.5) * 0.35;
    } else if (S.style === 'net') {
      const r = Math.abs(fbm(u * 2.2, v * 2.2, seed + 5, 5, per * 2.2) - 0.5), r2 = Math.abs(fbm(u * 5, v * 5, seed + 9, 4, per * 5) - 0.5);
      t = Math.max(0, 1 - r / 0.03) + Math.max(0, 1 - r2 / 0.015) * 0.6 + (cloud - 0.5) * 0.4;
    } else if (S.style === 'bands') {
      const band = Math.sin((v * 6 + fbm(u * 0.6, v * 0.6, seed, 4, per * 0.6) * 3) * Math.PI);
      const pore = valueNoise(x * 0.35, y * 0.9, seed + 2, 0) > 0.86 ? 1 : 0;
      t = band * 0.18 + 0.2 + (cloud - 0.5) * 0.5 + pore * 0.55; h = 0.5 - pore * 0.6;
    } else if (S.style === 'chips') {
      t = (cloud - 0.5) * 0.15;
      for (const [sc, off] of [[6, 0], [9, 0.37], [4, 0.71]]) {
        const cu = u * sc + off, cv = v * sc + off * 1.7, ci = Math.floor(cu), cj = Math.floor(cv), n = valueNoise(ci, cj, seed + sc, per * sc);
        const d = Math.hypot(cu - ci - 0.5 - (n - 0.5) * 0.7, cv - cj - 0.5 - (valueNoise(ci, cj, seed + sc + 1, per * sc) - 0.5) * 0.7);
        if (n > 0.35 && d < 0.08 + n * 0.12) t = 0.3 + n * 0.75;
      }
    } else {
      t = (cloud - 0.5) * 0.9 + (fbm(u * 12, v * 12, seed + 4, 3, per * 12) - 0.5) * 0.35;
      if (valueNoise(x * 0.5, y * 0.5, seed + 8, 0) > 0.93) { t += 0.4; h = 0.1; }
    }
    t = clamp(t, -0.4, 1);
    const k = (y * size + x) * 4;
    for (let c = 0; c < 3; c++) albedo[k + c] = clamp(t >= 0 ? base[c] + (vein[c] - base[c]) * t : base[c] * (1 + t * 0.25), 0, 255);
    albedo[k + 3] = 255;
    height[y * size + x] = h;
    rough[k] = rough[k + 1] = rough[k + 2] = clamp(gloss + (S.style === 'bands' || S.style === 'cloud' ? 0.2 : 0) + Math.max(0, t) * 0.05, 0.04, 1) * 255; rough[k + 3] = 255;
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const l = height[y * size + (x + size - 1) % size], r = height[y * size + (x + 1) % size], d = height[((y + size - 1) % size) * size + x], u = height[((y + 1) % size) * size + x];
    const nx = (l - r) * 2, ny = (d - u) * 2, len = Math.hypot(nx, ny, 1), k = (y * size + x) * 4;
    normal[k] = (nx / len * 0.5 + 0.5) * 255; normal[k + 1] = (ny / len * 0.5 + 0.5) * 255; normal[k + 2] = (1 / len * 0.5 + 0.5) * 255; normal[k + 3] = 255;
  }
  return {w: size, h: size, tileMm: [600, 600], albedo, normal, rough};
}
