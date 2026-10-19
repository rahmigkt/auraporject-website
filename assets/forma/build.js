// Builds meshes from part geometry descriptors (shared by every family). Cached by descriptor.
import {cushion, loft, lathe, tube, lineMesh, pillow, weltLoop, sphere, profiledSlab, transformPositions, computeNormals} from './mesh.js';
import {edgeProfile} from './table.js';

const cache = new Map();
export function buildMesh(q) {
  const key = JSON.stringify(q.geom);
  if (cache.has(key)) return cache.get(key);
  const g = q.geom; let mesh;
  if (g.fn === 'cushion') mesh = cushion(g);
  else if (g.fn === 'box') mesh = cushion({w: g.w, h: g.h, d: g.d, r: 1.5});
  else if (g.fn === 'loft') mesh = loft(g.section, {length: g.length, noseFront: g.noseFront, noseBack: g.noseBack, shape: t => ({sy: 1 - g.slope * (1 - Math.min(1, (1 - t) * 3.2))})});
  else if (g.fn === 'lathe') mesh = lathe(g.profile, {square: g.square, faceted: g.faceted, segments: g.segments || 28});
  else if (g.fn === 'tube') mesh = tube(g.points, g.r);
  else if (g.fn === 'welt') mesh = weltLoop(g.w, g.d, g.r, g.cord);
  else if (g.fn === 'line') mesh = lineMesh(g);
  else if (g.fn === 'pillow') mesh = pillow(g);
  else if (g.fn === 'slab' && g.edges) {
    // Per-side edge profiles: each side's inset curve, blended by the outward normal at corners (x = sides, z = front/back).
    const f = {}; for (const k of ['front', 'back', 'left', 'right']) { const e = g.edges[k] || g.profile; f[k] = edgeProfile(e[0], g.t, e[1] ?? e[2] ?? 6); }
    const inset = (s, [ox, oz]) => ox * ox * (ox > 0 ? f.right(s) : f.left(s)) + oz * oz * (oz > 0 ? f.front(s) : f.back(s));
    mesh = profiledSlab(g.outline, g.t, inset, {steps: 14});
  }
  else if (g.fn === 'slab') mesh = profiledSlab(g.outline, g.t, edgeProfile(...g.profile), {steps: g.profile[0] === 'square' ? 2 : 14});
  else if (g.fn === 'clipped') {
    // A part tilted in place and cut flat at y0 / y1 (splayed legs, X bars): ends sit on the floor and under the top.
    const inner = buildMesh({geom: g.inner}), positions = transformPositions(inner.positions, g.offset, g.rot), normals = transformPositions(inner.normals, [0, 0, 0], g.rot);
    for (let v = 1; v < positions.length; v += 3) {
      // Normals are kept: end rings are shared with the side faces, and the cap tilt is only a few degrees.
      if (positions[v] < g.y0) positions[v] = g.y0; else if (positions[v] > g.y1) positions[v] = g.y1;
    }
    mesh = {positions, normals, uvs: inner.uvs, indices: inner.indices};
  }
  else if (g.fn === 'scaled') {
    // Designer scale: stretch the inner part along its own axes; normals take the inverse scale.
    const inner = buildMesh({geom: g.inner}), [sx, sy, sz] = g.s, positions = new Float32Array(inner.positions), normals = new Float32Array(inner.normals);
    for (let v = 0; v < positions.length; v += 3) {
      positions[v] *= sx; positions[v + 1] *= sy; positions[v + 2] *= sz;
      const nx = normals[v] / sx, ny = normals[v + 1] / sy, nz = normals[v + 2] / sz, l = Math.hypot(nx, ny, nz) || 1; normals[v] = nx / l; normals[v + 1] = ny / l; normals[v + 2] = nz / l;
    }
    mesh = {positions, normals, uvs: inner.uvs, indices: inner.indices};
  }
  else if (g.fn === 'ribbed') mesh = ribbed(g);
  else if (g.fn === 'quad') {
    // One-sided rectangle in the x–y plane facing +z (room walls seen only from inside).
    const w = g.w / 2, h = g.h / 2;
    mesh = {positions: new Float32Array([-w, -h, 0, w, -h, 0, w, h, 0, -w, h, 0]), normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), uvs: new Float32Array([0, 0, g.w / 1000, 0, g.w / 1000, g.h / 1000, 0, g.h / 1000]), indices: new Uint32Array([0, 1, 2, 0, 2, 3])};
  }
  else if (g.fn === 'buttons') {
    const one = sphere(g.r, {segments: 10}), n = g.points.length, vc = one.positions.length;
    const positions = new Float32Array(vc * n), normals = new Float32Array(vc * n), uvs = new Float32Array(one.uvs.length * n), indices = new Uint32Array(one.indices.length * n);
    g.points.forEach((pt, k) => {
      for (let v = 0; v < vc; v += 3) { positions[k * vc + v] = one.positions[v] + pt[0]; positions[k * vc + v + 1] = one.positions[v + 1] + pt[1]; positions[k * vc + v + 2] = one.positions[v + 2] * 0.6 + pt[2]; }
      normals.set(one.normals, k * vc); uvs.set(one.uvs, k * one.uvs.length);
      for (let i = 0; i < one.indices.length; i++) indices[k * one.indices.length + i] = one.indices[i] + k * vc / 3;
    });
    mesh = {positions, normals, uvs, indices};
  }
  if (cache.size > 600) cache.clear();
  cache.set(key, mesh);
  return mesh;
}

/** World-space positions of a part (mm). */
export function worldPositions(q) { return transformPositions(buildMesh(q).positions, q.pos, q.rot); }

/** Reeded (fluted) face: half-round vertical reeds of a given pitch and depth, with top and bottom caps.
 * Built at z = 0 (back) to z = depth (reed crowns), centred in x and y. */
function ribbed({w, h, pitch = 24, depth = 6}) {
  const n = Math.max(1, Math.round(w / pitch)), seg = 8, xs = [], zs = [];
  for (let i = 0; i <= n * seg; i++) { const x = -w / 2 + w * i / (n * seg), u = (i % seg) / seg; xs.push(x); zs.push(depth * Math.sqrt(Math.max(0, 1 - (u * 2 - 1) ** 2))); }
  const pos = [], idx = [], uv = [];
  const v = (x, y, z) => { pos.push(x, y, z); uv.push(x / 1000 + 0.5, y / 1000 + 0.5); return pos.length / 3 - 1; };
  // Front surface (smooth)
  const base = pos.length / 3;
  for (let i = 0; i < xs.length; i++) { v(xs[i], -h / 2, zs[i]); v(xs[i], h / 2, zs[i]); }
  for (let i = 0; i < xs.length - 1; i++) { const a = base + 2 * i, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
  // Caps (top and bottom strips between the back line and the reed profile)
  for (const [y, flip] of [[h / 2, false], [-h / 2, true]]) {
    const b0 = pos.length / 3;
    for (let i = 0; i < xs.length; i++) { v(xs[i], y, 0); v(xs[i], y, zs[i]); }
    for (let i = 0; i < xs.length - 1; i++) { const a = b0 + 2 * i, b = a + 1, c = a + 2, d = a + 3; if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
  }
  const positions = new Float32Array(pos), indices = new Uint32Array(idx);
  return {positions, normals: computeNormals(positions, indices), uvs: new Float32Array(uv), indices};
}
