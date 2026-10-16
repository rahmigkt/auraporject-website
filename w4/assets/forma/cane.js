// Vienna cane (rattan) mesh map: horizontal, vertical and two diagonal strands leave the familiar octagonal holes.
// One tile = one hole pitch (≈ 22 mm). Holes are dark so the backing shadow reads through.
export function caneMaps({size = 256, tileMm = 22} = {}) {
  const albedo = new Uint8ClampedArray(size * size * 4), normal = new Uint8ClampedArray(size * size * 4), rough = new Uint8ClampedArray(size * size * 4);
  const straw = [214, 184, 128], hole = [52, 40, 28], ws = 0.16, wd = 0.11;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size, k = (y * size + x) * 4;
    const dh = Math.min(v, 1 - v), dv = Math.min(u, 1 - u);
    const d1 = Math.abs(((u - v + 1.5) % 1) - 0.5) * Math.SQRT1_2, d2 = Math.abs(((u + v) % 1) - 0.5) * Math.SQRT1_2;
    // Strand profile: 1 at the centre line, 0 at the edge; the uppermost strand wins.
    const s = [[dh, ws, 0.92], [dv, ws, 1], [d1, wd, 0.86], [d2, wd, 0.8]].map(([d, w, tone]) => d < w / 2 ? [1 - d / (w / 2), tone] : null).filter(Boolean);
    let c = hole, nz = 1, nx = 0, ny = 0, r = 0.9;
    if (s.length) {
      const [t, tone] = s.reduce((a, b) => (b[1] > a[1] ? b : a));
      const shade = 0.72 + 0.28 * Math.sqrt(t);
      c = straw.map(ch => ch * tone * shade); r = 0.55;
      nx = (dv < ws / 2 ? (u < 0.5 ? 1 : -1) * (1 - t) * 0.6 : 0); ny = (dh < ws / 2 ? (v < 0.5 ? 1 : -1) * (1 - t) * 0.6 : 0);
    }
    const l = Math.hypot(nx, ny, nz);
    albedo.set([c[0], c[1], c[2], 255], k);
    normal.set([(nx / l * 0.5 + 0.5) * 255, (ny / l * 0.5 + 0.5) * 255, (nz / l * 0.5 + 0.5) * 255, 255], k);
    rough.set([r * 255, r * 255, r * 255, 255], k);
  }
  return {w: size, h: size, size, tileMm, albedo, normal, rough};
}
