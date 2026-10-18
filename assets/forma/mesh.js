// Pure mesh builders (no three.js). Units: millimetres. Front of furniture faces +z, y is up.
// Every builder returns {positions, normals, uvs, indices}; the scene wraps them in BufferGeometry,
// drawings project the same data, so 3D view and technical drawings never disagree.
import {clamp} from './rng.js';

class Builder {
  constructor() { this.p = []; this.i = []; }
  v(x, y, z) { this.p.push(x, y, z); return this.p.length / 3 - 1; }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
}

/** Merge coincident vertices so normals are smooth across construction seams. */
function weld(pos, idx, tol = 0.01) {
  const map = new Map(), remap = new Uint32Array(pos.length / 3), out = [];
  for (let v = 0; v < pos.length / 3; v++) {
    const key = `${Math.round(pos[v * 3] / tol)},${Math.round(pos[v * 3 + 1] / tol)},${Math.round(pos[v * 3 + 2] / tol)}`;
    let id = map.get(key);
    if (id === undefined) { id = out.length / 3; map.set(key, id); out.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); }
    remap[v] = id;
  }
  const indices = [];
  for (let t = 0; t < idx.length; t += 3) {
    const a = remap[idx[t]], b = remap[idx[t + 1]], c = remap[idx[t + 2]];
    if (a !== b && b !== c && a !== c) indices.push(a, b, c);
  }
  return {positions: new Float32Array(out), indices: new Uint32Array(indices)};
}

export function computeNormals(positions, indices) {
  const n = new Float32Array(positions.length);
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3, b = indices[t + 1] * 3, c = indices[t + 2] * 3;
    const ux = positions[b] - positions[a], uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a], vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const k of [a, b, c]) { n[k] += nx; n[k + 1] += ny; n[k + 2] += nz; }
  }
  for (let k = 0; k < n.length; k += 3) {
    const l = Math.hypot(n[k], n[k + 1], n[k + 2]) || 1;
    n[k] /= l; n[k + 1] /= l; n[k + 2] /= l;
  }
  return n;
}

/** Box-projected UVs in metres so textures keep their real physical scale on every part. */
export function boxUV(positions, normals) {
  const uv = new Float32Array(positions.length / 3 * 2);
  for (let v = 0; v < positions.length / 3; v++) {
    const x = positions[v * 3] / 1000, y = positions[v * 3 + 1] / 1000, z = positions[v * 3 + 2] / 1000;
    const ax = Math.abs(normals[v * 3]), ay = Math.abs(normals[v * 3 + 1]), az = Math.abs(normals[v * 3 + 2]);
    if (ay >= ax && ay >= az) { uv[v * 2] = x; uv[v * 2 + 1] = z; }
    else if (ax >= az) { uv[v * 2] = z; uv[v * 2 + 1] = y; }
    else { uv[v * 2] = x; uv[v * 2 + 1] = y; }
  }
  return uv;
}

function finish(b, {smooth = true} = {}) {
  let positions = new Float32Array(b.p), indices = new Uint32Array(b.i);
  if (smooth) ({positions, indices} = weld(positions, indices));
  const normals = computeNormals(positions, indices);
  return {positions, normals, uvs: boxUV(positions, normals), indices};
}

const bump = u => Math.max(0, 1 - u * u);

/**
 * Upholstered block: rounded box with crowned faces, optional camel top, tufting and pleats.
 * w,h,d outer size; r edge radius; crown* in mm; tufts: [{x,y}] on the +z face; tuftDepth mm.
 */
export function cushion({w, h, d, r = 20, crownTop = 0, crownBottom = 0, crownFront = 0, camel = 0, tufts = null, tuftDepth = 0, pleats = null, finalDetail = false}) {
  r = Math.min(r, w / 2 - 0.5, h / 2 - 0.5, d / 2 - 0.5);
  const hw = w / 2, hh = h / 2, hd = d / 2, ix = hw - r, iy = hh - r, iz = hd - r;
  const density=finalDetail?2:1;
  const sx = clamp(Math.round(w / 22), 8, 72)*density, sy = clamp(Math.round(h / 22), 6, 56)*density, sz = clamp(Math.round(d / 22), 6, 56)*density;
  const b = new Builder();
  const place = (x, y, z) => {
    const cx = clamp(x, -ix, ix), cy = clamp(y, -iy, iy), cz = clamp(z, -iz, iz);
    let dx = x - cx, dy = y - cy, dz = z - cz; const l = Math.hypot(dx, dy, dz);
    if (l > 1e-9) { dx = dx / l * r; dy = dy / l * r; dz = dz / l * r; }
    let px = cx + dx, py = cy + dy, pz = cz + dz;
    const ux = px / hw, uy = py / hh, uz = pz / hd;
    py += crownTop * bump(ux) * bump(uz) * Math.max(0, uy) ** 2;
    py -= crownBottom * bump(ux) * bump(uz) * Math.max(0, -uy) ** 2;
    py += camel * bump(ux) * Math.max(0, uy) ** 3;
    const front = Math.max(0, uz) ** 3;
    pz += crownFront * bump(ux) * bump(uy) * front;
    if (tufts && front > 0) {
      const sigma = tuftDepth * 1.35;
      let dent = 0;
      for (const t of tufts) dent += Math.exp(-((px - t.x) ** 2 + (py - t.y) ** 2) / (2 * sigma * sigma));
      if (pleats) for (const [a, c] of pleats) {
        const ex = c.x - a.x, ey = c.y - a.y, L2 = ex * ex + ey * ey;
        const t = clamp(((px - a.x) * ex + (py - a.y) * ey) / L2, 0, 1);
        const qx = a.x + ex * t - px, qy = a.y + ey * t - py;
        dent += 0.32 * Math.exp(-(qx * qx + qy * qy) / (2 * (sigma * 0.45) ** 2));
      }
      pz -= tuftDepth * Math.min(1.15, dent) * front;
    }
    return b.v(px, py, pz);
  };
  // Six faces of a subdivided cube, each mapped onto the rounded/crowned surface.
  const face = (nu, nv, f) => {
    const base = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) base.push(place(...f(i / nu, j / nv)));
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base[j * (nu + 1) + i], c = base[(j + 1) * (nu + 1) + i + 1];
      b.quad(a, base[j * (nu + 1) + i + 1], c, base[(j + 1) * (nu + 1) + i]);
    }
  };
  const L = (t, a) => {
    if(!finalDetail)return -a+2*a*t;
    // Reserve samples at the existing radius; subdivision does not change it.
    const edge=Math.min(r,a*.4),band=.15;
    if(t<band)return -a+edge*t/band;
    if(t>1-band)return a-edge*(1-t)/band;
    return -a+edge+(2*a-2*edge)*(t-band)/(1-2*band);
  };
  face(sx, sy, (u, v) => [L(u, hw), L(v, hh), hd]);
  face(sx, sy, (u, v) => [-L(u, hw), L(v, hh), -hd]);
  face(sz, sy, (u, v) => [hw, L(v, hh), -L(u, hd)]);
  face(sz, sy, (u, v) => [-hw, L(v, hh), L(u, hd)]);
  face(sx, sz, (u, v) => [L(u, hw), hh, -L(v, hd)]);
  face(sx, sz, (u, v) => [L(u, hw), -hh, L(v, hd)]);
  return finish(b);
}

/** Diamond tufting grid for a w×h face; returns buttons and the pleat lines between them. */
export function tuftGrid(w, h, spacing, margin = 0.5) {
  const cols = Math.max(2, Math.round((w - 2 * spacing * margin) / spacing)), rows = Math.max(2, Math.round((h - 2 * spacing * margin) / (spacing * 0.8)));
  const dx = (w - 2 * spacing * margin) / cols, dy = (h - 2 * spacing * margin) / rows, pts = [], grid = [];
  for (let j = 0; j <= rows; j++) {
    const row = [];
    for (let i = 0; i <= cols; i++) {
      if ((i + j) % 2) { row.push(null); continue; }
      const p = {x: -w / 2 + spacing * margin + i * dx, y: -h / 2 + spacing * margin + j * dy};
      pts.push(p); row.push(p);
    }
    grid.push(row);
  }
  const pleats = [];
  for (let j = 0; j < grid.length - 1; j++) for (let i = 0; i < grid[j].length; i++) {
    const a = grid[j][i]; if (!a) continue;
    for (const di of [-1, 1]) { const c = grid[j + 1][i + di]; if (c) pleats.push([a, c]); }
  }
  return {buttons: pts, pleats};
}

/**
 * Loft a closed 2D section (x,y) along z (length L, centred). shape(t) returns {sy} height scale at t∈[0,1]
 * (t=1 is the front). noseFront/noseBack round the ends with an elliptical profile of that radius.
 */
export function loft(section, {length, noseFront = 40, noseBack = 8, shape = () => ({sy: 1})}) {
  const b = new Builder(), n = section.length;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of section) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const W = maxX - minX, cx = (minX + maxX) / 2;
  const ts = new Set([0, 1]);
  const steps = 18;
  for (let k = 0; k <= steps; k++) { ts.add(k / steps); }
  for (let k = 1; k <= 10; k++) { const e = (1 - Math.cos(k / 10 * Math.PI / 2)); ts.add(1 - e * Math.min(0.5, noseFront / length)); ts.add(e * Math.min(0.5, noseBack / length)); }
  const list = [...ts].sort((a, c) => a - c), rings = [];
  for (const t of list) {
    const z = -length / 2 + t * length, sFront = (1 - t) * length, sBack = t * length;
    let inset = 0;
    if (noseFront > 0 && sFront < noseFront) inset = noseFront * (1 - Math.sqrt(Math.max(0, 1 - (1 - sFront / noseFront) ** 2)));
    if (noseBack > 0 && sBack < noseBack) inset = Math.max(inset, noseBack * (1 - Math.sqrt(Math.max(0, 1 - (1 - sBack / noseBack) ** 2))));
    const {sy = 1} = shape(t), H = (maxY - minY) * sy, cy = minY + H / 2;
    const kx = W > 0 ? Math.max(0.02, 1 - 2 * inset / W) : 1, ky = H > 0 ? Math.max(0.02, 1 - 2 * inset / H) : 1;
    rings.push(section.map(([x, y]) => b.v(cx + (x - cx) * kx, cy + ((minY + (y - minY) * sy) - cy) * ky, z)));
  }
  for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < n; i++) {
    const j = (i + 1) % n; b.quad(rings[r][i], rings[r][j], rings[r + 1][j], rings[r + 1][i]);
  }
  for (const [ring, flip] of [[rings[0], true], [rings.at(-1), false]]) {
    let x = 0, y = 0, z = 0;
    for (const v of ring) { x += b.p[v * 3]; y += b.p[v * 3 + 1]; z += b.p[v * 3 + 2]; }
    const c = b.v(x / n, y / n, z / n);
    for (let i = 0; i < n; i++) flip ? b.tri(c, ring[(i + 1) % n], ring[i]) : b.tri(c, ring[i], ring[(i + 1) % n]);
  }
  return finish(b);
}

/** Lathe: profile [[y, radius]] bottom→top. square=true gives a four-sided (tapered) leg. */
export function lathe(profile, {segments = 28, square = false, faceted = false} = {}) {
  const b = new Builder(), seg = square ? 4 : segments, rings = [];
  for (const [y, r] of profile) {
    const ring = [];
    for (let s = 0; s < seg; s++) {
      const a = s / seg * Math.PI * 2 + (square ? Math.PI / 4 : 0), k = square ? Math.SQRT2 : 1;
      ring.push(b.v(Math.cos(a) * r * k, y, Math.sin(a) * r * k));
    }
    rings.push(ring);
  }
  for (let r = 0; r < rings.length - 1; r++) for (let s = 0; s < seg; s++) {
    const t = (s + 1) % seg; b.quad(rings[r][s], rings[r + 1][s], rings[r + 1][t], rings[r][t]);
  }
  const bottom = b.v(0, profile[0][0], 0), top = b.v(0, profile.at(-1)[0], 0);
  for (let s = 0; s < seg; s++) { const t = (s + 1) % seg; b.tri(bottom, rings[0][s], rings[0][t]); b.tri(top, rings.at(-1)[t], rings.at(-1)[s]); }
  return finish(b, {smooth: !square && !faceted});
}

/** Round tube along a polyline of [x,y,z] points. */
export function tube(points, radius, {sides = 14} = {}) {
  const b = new Builder(), rings = [];
  for (let k = 0; k < points.length; k++) {
    const p = points[k], q = points[Math.min(points.length - 1, k + 1)], o = points[Math.max(0, k - 1)];
    let tx = q[0] - o[0], ty = q[1] - o[1], tz = q[2] - o[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let ux = 0, uy = 1, uz = 0; if (Math.abs(ty) > 0.9) { ux = 1; uy = 0; }
    let ax = ty * uz - tz * uy, ay = tz * ux - tx * uz, az = tx * uy - ty * ux; const al = Math.hypot(ax, ay, az); ax /= al; ay /= al; az /= al;
    const bx = ty * az - tz * ay, by = tz * ax - tx * az, bz = tx * ay - ty * ax, ring = [];
    for (let s = 0; s < sides; s++) {
      const a = s / sides * Math.PI * 2, c = Math.cos(a) * radius, d = Math.sin(a) * radius;
      ring.push(b.v(p[0] + ax * c + bx * d, p[1] + ay * c + by * d, p[2] + az * c + bz * d));
    }
    rings.push(ring);
  }
  for (let r = 0; r < rings.length - 1; r++) for (let s = 0; s < sides; s++) {
    const t = (s + 1) % sides; b.quad(rings[r][s], rings[r][t], rings[r + 1][t], rings[r + 1][s]);
  }
  for (const [ring, k, flip] of [[rings[0], 0, true], [rings.at(-1), points.length - 1, false]]) {
    const c = b.v(...points[k]);
    for (let s = 0; s < sides; s++) flip ? b.tri(c, ring[(s + 1) % sides], ring[s]) : b.tri(c, ring[s], ring[(s + 1) % sides]);
  }
  return finish(b);
}

/**
 * Throw pillow (kırlent), standing in the x–y plane, thickness along z, centred. Units mm.
 * Knife-edge pillows are two panels sewn together and filled: the edge midpoints pull inward (pinch), the corners
 * stay pointed, the body is full in the middle and thins to the seam; an optional "chop" dents the top centre.
 * type: 'square' | 'lumbar' (knife edge, any w × h) | 'boxed' (gusset band, flatter faces) | 'bolster' (roll along x).
 */
export function pillow({w, h, t, type = 'square', pinch = 0.07, chop = 0, cord = 0, n = 30}) {
  if (type === 'bolster') {
    // Roll with gathered ends: full radius along the body, ends drawn in towards a button.
    const R = h / 2, L = w, prof = [];
    // Samples are dense near the ends so the rounded, gathered ends stay smooth.
    for (let k = 0; k <= 40; k++) {
      const y = L / 2 * Math.sin((-1 + 2 * k / 40) * Math.PI / 2), e = Math.min(1, (L / 2 - Math.abs(y)) / R);
      prof.push([y, Math.max(R * 0.08, R * Math.sqrt(Math.max(0, 1 - (1 - e) ** 2)))]);
    }
    const m = lathe(prof, {segments: 28});
    return {...m, positions: transformPositions(m.positions, [0, 0, 0], [0, 0, Math.PI / 2]), normals: transformPositions(m.normals, [0, 0, 0], [0, 0, Math.PI / 2])};
  }
  if (type === 'boxed') return cushion({w, h, d: t, r: Math.min(26, t * 0.3), crownFront: t * 0.32});
  const b = new Builder(), hw = w / 2, hh = h / 2, grid = [[], []];
  for (const [side, sz] of [[0, 1], [1, -1]]) for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const u = -1 + 2 * i / n, v = -1 + 2 * j / n;
    const x = u * hw * (1 - pinch * (1 - v * v)), y0 = v * hh * (1 - pinch * (1 - u * u));
    const dent = chop * Math.exp(-u * u / 0.04) * Math.max(0, v) ** 2;
    const y = y0 - dent * h * 0.06;
    // Domed body thinning to the seam, with soft folds running in from the pointed corners.
    const body = Math.pow(Math.max(0, (1 - u * u) * (1 - v * v)), 0.5);
    const folds = 0.08 * Math.sin(14 * (Math.abs(u) - Math.abs(v))) * (Math.abs(u * v)) ** 3;
    const z = sz * Math.max(0.8, t / 2 * (body + folds * body) * (1 - dent * 0.45));
    grid[side].push(b.v(x, y, z));
  }
  const at = (side, i, j) => grid[side][j * (n + 1) + i];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    b.quad(at(0, i, j), at(0, i + 1, j), at(0, i + 1, j + 1), at(0, i, j + 1));
    b.quad(at(1, i, j), at(1, i, j + 1), at(1, i + 1, j + 1), at(1, i + 1, j));
  }
  // Close the seam between the two panels.
  const ring = [];
  for (let i = 0; i < n; i++) ring.push([i, 0]); for (let j = 0; j < n; j++) ring.push([n, j]); for (let i = n; i > 0; i--) ring.push([i, n]); for (let j = n; j > 0; j--) ring.push([0, j]);
  for (let k = 0; k < ring.length; k++) { const [i, j] = ring[k], [i2, j2] = ring[(k + 1) % ring.length]; b.quad(at(0, i, j), at(1, i, j), at(1, i2, j2), at(0, i2, j2)); }
  const body = finish(b);
  if (!cord) return body;
  // Piping round the seam.
  const pts = ring.map(([i, j]) => { const id = at(0, i, j); return [b.p[id * 3], b.p[id * 3 + 1], 0]; }); pts.push(pts[0]);
  return mergeMeshes([body, tube(pts, cord, {sides: 8})]);
}

/** Line details (topstitch, inlay, groove): a thin tube along a 3D polyline, solid or dashed like a stitch. */
export function lineMesh({points, r = 1, closed = true, dash = null, sides = 6}) {
  // Drop repeated points (a zero-length segment has no direction).
  const clean = points.filter((q, i) => { const o = points[(i - 1 + points.length) % points.length]; return i === 0 && !closed || Math.hypot(q[0] - o[0], q[1] - o[1], q[2] - o[2]) > 0.05; });
  const pts = closed ? [...clean, clean[0]] : clean, acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const total = acc.at(-1);
  if (!dash || total <= 0) return tube(pts, r, {sides});
  let seg = 1;
  const at = s => { while (seg < acc.length - 1 && acc[seg] < s) seg++; const t = (s - acc[seg - 1]) / ((acc[seg] - acc[seg - 1]) || 1); return pts[seg - 1].map((v, k) => v + (pts[seg][k] - v) * t); };
  const [len, gap] = dash, n = Math.max(1, Math.round(total / (len + gap))), step = total / n, pieces = [];
  for (let i = 0; i < n; i++) { const a = at(i * step), b = at(i * step + len * step / (len + gap)); pieces.push(tube([a, b], r, {sides})); }
  return mergeMeshes(pieces);
}
function mergeMeshes(list) {
  const nv = list.reduce((s, m) => s + m.positions.length, 0), ni = list.reduce((s, m) => s + m.indices.length, 0), nu = list.reduce((s, m) => s + m.uvs.length, 0);
  const positions = new Float32Array(nv), normals = new Float32Array(nv), uvs = new Float32Array(nu), indices = new Uint32Array(ni);
  let ov = 0, oi = 0, ou = 0;
  for (const m of list) {
    positions.set(m.positions, ov); normals.set(m.normals, ov); uvs.set(m.uvs, ou);
    for (let i = 0; i < m.indices.length; i++) indices[oi + i] = m.indices[i] + ov / 3;
    ov += m.positions.length; oi += m.indices.length; ou += m.uvs.length;
  }
  return {positions, normals, uvs, indices};
}
/** Rounded rectangle loop (cx, cy centre; w × h; corner radius r) as [u, v] points, counter-clockwise. */
export function roundedRectLoop(w, h, r, cx = 0, cy = 0, seg = 6) {
  r = Math.max(0, Math.min(r, w / 2 - 0.1, h / 2 - 0.1));
  const hx = w / 2 - r, hy = h / 2 - r, out = [];
  for (const [ax, ay, a0] of [[hx, hy, 0], [-hx, hy, 90], [-hx, -hy, 180], [hx, -hy, 270]])
    for (let k = 0; k <= seg; k++) { const a = (a0 + k * 90 / seg) * Math.PI / 180; out.push([cx + ax + Math.cos(a) * r, cy + ay + Math.sin(a) * r]); }
  return out;
}

/** Closed tube along a rounded rectangle in the XZ plane (piping/welt cord). */
export function weltLoop(w, d, r, cord) {
  const pts = [], hw = w / 2 - r, hd = d / 2 - r;
  for (const [cx, cz, a0] of [[hw, hd, 0], [-hw, hd, 90], [-hw, -hd, 180], [hw, -hd, 270]])
    for (let k = 0; k <= 6; k++) { const a = (a0 + k * 15) * Math.PI / 180; pts.push([cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r]); }
  pts.push(pts[0]);
  return tube(pts, cord, {sides: 10});
}

export function sphere(radius, {segments = 16} = {}) {
  const profile = [];
  for (let k = 0; k <= segments / 2; k++) { const a = -Math.PI / 2 + k / (segments / 2) * Math.PI; profile.push([Math.sin(a) * radius, Math.max(0.001, Math.cos(a) * radius)]); }
  return lathe(profile, {segments});
}

/** Euler XYZ rotation (same order as three.js) then translation. Returns new positions. */
export function transformPositions(positions, [px, py, pz] = [0, 0, 0], [rx, ry, rz] = [0, 0, 0]) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  // R = Rx * Ry * Rz
  const m = [cy * cz, -cy * sz, sy,
    cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy,
    sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy];
  const out = new Float32Array(positions.length);
  for (let v = 0; v < positions.length; v += 3) {
    const x = positions[v], y = positions[v + 1], z = positions[v + 2];
    out[v] = m[0] * x + m[1] * y + m[2] * z + px;
    out[v + 1] = m[3] * x + m[4] * y + m[5] * z + py;
    out[v + 2] = m[6] * x + m[7] * y + m[8] * z + pz;
  }
  return out;
}

export function bounds(positions) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let v = 0; v < positions.length; v += 3) for (let k = 0; k < 3; k++) {
    min[k] = Math.min(min[k], positions[v + k]); max[k] = Math.max(max[k], positions[v + k]);
  }
  return {min, max, size: max.map((m, k) => m - min[k])};
}

// ---- Table-top helpers -------------------------------------------------------------

/** Closed outline (CCW in the x–z plane, viewed from above) for a table top. */
export function topOutline(shape, L, W, {r = 0, n = 4, bow = 0, segments = 96} = {}) {
  const a = L / 2, b = W / 2, pts = [];
  const sgnPow = (v, e) => Math.sign(v) * Math.abs(v) ** e;
  if (shape === 'round' || shape === 'oval' || shape === 'superellipse') {
    const e = shape === 'superellipse' ? 2 / Math.max(2, n) : 1;
    for (let k = 0; k < segments * 2; k++) { const t = k / (segments * 2) * Math.PI * 2; pts.push([a * sgnPow(Math.cos(t), e), b * sgnPow(Math.sin(t), e)]); }
    return pts;
  }
  if (shape === 'racetrack') {
    const rr = Math.min(b, a), cx = a - rr;
    for (let k = 0; k <= 24; k++) { const t = -Math.PI / 2 + k / 24 * Math.PI; pts.push([cx + Math.cos(t) * rr, Math.sin(t) * rr]); }
    for (let k = 0; k <= 24; k++) { const t = Math.PI / 2 + k / 24 * Math.PI; pts.push([-cx + Math.cos(t) * rr, Math.sin(t) * rr]); }
    return pts;
  }
  // Rectangle family (rect, rounded, boat): corner arcs; boat bows the long sides inward towards the ends.
  const rr = Math.max(0.5, Math.min(r, a - 1, b - 1));
  const corner = (cx, cz, a0) => { for (let k = 0; k <= 10; k++) { const t = (a0 + k * 9) * Math.PI / 180; pts.push([cx + Math.cos(t) * rr, cz + Math.sin(t) * rr]); } };
  const side = (x0, x1, z, steps = 24) => { for (let k = 1; k < steps; k++) { const x = x0 + (x1 - x0) * k / steps; pts.push([x, z]); } };
  corner(a - rr, -(b - rr), 270); corner(a - rr, b - rr, 0); side(a - rr, -(a - rr), b); corner(-(a - rr), b - rr, 90); corner(-(a - rr), -(b - rr), 180); side(-(a - rr), a - rr, -b);
  if (bow > 0) for (const p of pts) p[1] *= 1 - bow * (p[0] / a) ** 2;
  return pts;
}

/** Clip a convex outline to x0 ≤ x ≤ x1 (Sutherland–Hodgman). */
export function clipX(pts, x0, x1) {
  const clip = (poly, keep, cross) => { const out = []; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length], kp = keep(p), kq = keep(q); if (kp) out.push(p); if (kp !== kq) out.push(cross(p, q)); } return out; };
  const at = x => (p, q) => [x, p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0])];
  return clip(clip(pts, p => p[0] >= x0, at(x0)), p => p[0] <= x1, at(x1));
}

/** Offset a convex CCW outline by d (positive = inward) along vertex bisectors. */
export function offsetOutline(pts, d) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = pts[(i - 1 + n) % n], c = pts[i], q = pts[(i + 1) % n];
    let e1 = [c[0] - p[0], c[1] - p[1]], e2 = [q[0] - c[0], q[1] - c[1]];
    const l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1; e1 = [e1[0] / l1, e1[1] / l1]; e2 = [e2[0] / l2, e2[1] / l2];
    // Inward normal of a CCW polygon is (-ey, ex).
    const n1 = [-e1[1], e1[0]], n2 = [-e2[1], e2[0]], nb = [n1[0] + n2[0], n1[1] + n2[1]], lb = Math.hypot(...nb) || 1;
    const cos = Math.max(0.35, (nb[0] / lb) * n1[0] + (nb[1] / lb) * n1[1]);
    out.push([c[0] + nb[0] / lb * d / cos, c[1] + nb[1] / lb * d / cos]);
  }
  return out;
}

/**
 * Slab with an edge profile: outline (x,z) extruded from y=0 (bottom) to y=t (top); inset(s) gives the inward
 * offset at s ∈ [0,1] measured from the TOP face down. Used for table tops, shelves and drum bodies.
 */
export function profiledSlab(outline, t, inset = () => 0, {steps = 12} = {}) {
  const b = new Builder(), n = outline.length;
  // Ensure CCW (positive area in x–z seen from +y means z axis points to the viewer's bottom; we test signed area).
  let area = 0; for (let i = 0; i < n; i++) { const p = outline[i], q = outline[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
  const ccw = area > 0 ? outline : [...outline].reverse();
  const rings = [];
  for (let k = 0; k <= steps; k++) {
    const s = k / steps, y = t * (1 - s), ring = offsetOutline(ccw, inset(s));
    rings.push(ring.map(([x, z]) => b.v(x, y, z)));
  }
  for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < n; i++) { const j = (i + 1) % n; b.quad(rings[r][i], rings[r + 1][i], rings[r + 1][j], rings[r][j]); }
  for (const [ring, top] of [[rings[0], true], [rings.at(-1), false]]) {
    let x = 0, y = 0, z = 0; for (const v of ring) { x += b.p[v * 3]; y += b.p[v * 3 + 1]; z += b.p[v * 3 + 2]; }
    const c = b.v(x / n, y / n, z / n);
    for (let i = 0; i < n; i++) top ? b.tri(c, ring[i], ring[(i + 1) % n]) : b.tri(c, ring[(i + 1) % n], ring[i]);
  }
  // Make the winding outward (positive signed volume) whatever the outline orientation was.
  let vol = 0; const P = b.p, I = b.i;
  for (let k = 0; k < I.length; k += 3) { const a = I[k] * 3, c = I[k + 1] * 3, d = I[k + 2] * 3; vol += P[a] * (P[c + 1] * P[d + 2] - P[c + 2] * P[d + 1]) - P[a + 1] * (P[c] * P[d + 2] - P[c + 2] * P[d]) + P[a + 2] * (P[c] * P[d + 1] - P[c + 1] * P[d]); }
  if (vol < 0) for (let k = 0; k < I.length; k += 3) { const tmp = I[k + 1]; I[k + 1] = I[k + 2]; I[k + 2] = tmp; }
  return finish(b, {smooth: false});
}
