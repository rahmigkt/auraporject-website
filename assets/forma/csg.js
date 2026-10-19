// Machining cuts on a part (holes, pockets, slots, grooves, flutes) with Manifold (Apache-2.0, WASM).
// Loaded on demand; until it is ready the uncut part is shown and callers are told to rebuild.
import {boxUV} from './mesh.js';

let W = null, loading = null; const ready = new Set();
export const csgReady = () => !!W;
export function loadCsg() {
  if (!loading) loading = import('../vendor/manifold/manifold.js').then(m => m.default()).then(w => { w.setup(); W = w; for (const f of ready) f(); }).catch(() => { loading = null; });
  return loading;
}
export const onCsgReady = f => { ready.add(f); if (W) f(); return () => ready.delete(f); };

export const CUT_TYPES = ['hole', 'pocket', 'slot', 'groove', 'flutes'];
const EPS = 2;

// Rotate a cutter built along +z so that +z points along axis `ax` (0 x, 1 y, 2 z) with sign `sg`.
function orient(m, ax, sg) {
  if (ax === 2) return sg > 0 ? m : m.rotate([180, 0, 0]);
  if (ax === 1) return m.rotate([sg > 0 ? -90 : 90, 0, 0]);
  return m.rotate([0, sg > 0 ? 90 : -90, 0]);
}
// A cutter whose top sits EPS above the surface and that goes `depth` into the part along -normal.
function cutterSolid(op) {
  const {Manifold} = W, d = op.depth > 0 ? op.depth : 4000, ax = op.axis, sg = op.sign;
  let m;
  if (op.type === 'hole') m = Manifold.cylinder(d + EPS, op.dia / 2, op.dia / 2, 40, false).translate([0, 0, -d]);
  else if (op.type === 'pocket') m = Manifold.cube([op.a, op.b, d + EPS], false).translate([-op.a / 2, -op.b / 2, -d]);
  else if (op.type === 'slot') { const L = Math.max(op.a - op.b, 0.1), r = op.b / 2; m = Manifold.union([Manifold.cube([L, op.b, d + EPS], false).translate([-L / 2, -r, -d]), Manifold.cylinder(d + EPS, r, r, 32).translate([-L / 2, 0, -d]), Manifold.cylinder(d + EPS, r, r, 32).translate([L / 2, 0, -d])]); }
  else { // groove / flutes: round-bottomed channels of width b, length a, depth d (≤ b/2 gives a true half-round)
    const n = op.type === 'flutes' ? Math.max(1, Math.min(60, Math.round(op.count || 1))) : 1, gap = op.pitch || op.b * 2, r = op.b / 2, list = [];
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * gap, rod = Manifold.cylinder(op.a, r, r, 24, true).rotate([0, 90, 0]).scale([1, 1, Math.min(1, op.depth / r || 1)]);
      list.push(rod.translate([0, off, 0]));
      if (op.depth > r) list.push(Manifold.cube([op.a, op.b, op.depth - r + EPS], false).translate([-op.a / 2, off - r, -(op.depth - r)]));
    }
    m = Manifold.union(list);
    if (op.dir) m = m.rotate([0, 0, op.dir]);
  }
  return orient(m, ax, sg).translate(op.at);
}

/** Weld by position for Manifold input. */
function toManifold(mesh) {
  const {Mesh, Manifold} = W, P = mesh.positions, map = new Map(), verts = [], remap = new Uint32Array(P.length / 3);
  for (let v = 0; v < P.length / 3; v++) { const k = `${Math.round(P[v * 3] * 100)},${Math.round(P[v * 3 + 1] * 100)},${Math.round(P[v * 3 + 2] * 100)}`; let id = map.get(k); if (id === undefined) { id = verts.length / 3; map.set(k, id); verts.push(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]); } remap[v] = id; }
  const tri = []; for (let i = 0; i < mesh.indices.length; i += 3) { const a = remap[mesh.indices[i]], b = remap[mesh.indices[i + 1]], c = remap[mesh.indices[i + 2]]; if (a !== b && b !== c && a !== c) tri.push(a, b, c); }
  const m = new Mesh({numProp: 3, vertProperties: new Float32Array(verts), triVerts: new Uint32Array(tri)}); m.merge();
  return new Manifold(m);
}

/** Crease-aware normals: faces meeting at more than ~35° keep a hard edge (hole walls, pocket floors). */
function creaseMesh(vp, tv) {
  const nT = tv.length / 3, fn = new Float32Array(nT * 3);
  for (let t = 0; t < nT; t++) {
    const [a, b, c] = [tv[t * 3], tv[t * 3 + 1], tv[t * 3 + 2]].map(i => [vp[i * 3], vp[i * 3 + 1], vp[i * 3 + 2]]);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(...n) || 1;
    fn.set([n[0] / l, n[1] / l, n[2] / l], t * 3);
  }
  const around = new Map(); for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) { const v = tv[t * 3 + k]; if (!around.has(v)) around.set(v, []); around.get(v).push(t); }
  const pos = new Float32Array(nT * 9), nor = new Float32Array(nT * 9), idx = new Uint32Array(nT * 3), cos = Math.cos(35 * Math.PI / 180);
  for (let t = 0; t < nT; t++) for (let k = 0; k < 3; k++) {
    const v = tv[t * 3 + k], o = (t * 3 + k) * 3; pos.set([vp[v * 3], vp[v * 3 + 1], vp[v * 3 + 2]], o);
    let s = [0, 0, 0]; for (const f of around.get(v)) { const d = fn[f * 3] * fn[t * 3] + fn[f * 3 + 1] * fn[t * 3 + 1] + fn[f * 3 + 2] * fn[t * 3 + 2]; if (d >= cos) { s[0] += fn[f * 3]; s[1] += fn[f * 3 + 1]; s[2] += fn[f * 3 + 2]; } }
    const l = Math.hypot(...s) || 1; nor.set([s[0] / l, s[1] / l, s[2] / l], o); idx[t * 3 + k] = t * 3 + k;
  }
  return {positions: pos, normals: nor, uvs: boxUV(pos, nor), indices: idx};
}

/** Apply machining ops to a built mesh; null if CSG is not loaded yet or the input is not a closed solid. */
export function cutMesh(mesh, ops) {
  if (!W) { loadCsg(); return null; }
  let base, out;
  try {
    base = toManifold(mesh); if (base.status() !== 'NoError') return {failed: true};
    const tools = ops.map(cutterSolid), all = W.Manifold.union(tools); out = base.subtract(all);
    const m = out.getMesh(); tools.forEach(t => t.delete()); all.delete();
    return creaseMesh(m.vertProperties, m.triVerts);
  } catch { return {failed: true}; }
  finally { base?.delete?.(); out?.delete?.(); }
}
