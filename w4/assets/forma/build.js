// Builds meshes from part geometry descriptors (shared by every family). Cached by descriptor.
import {cushion, loft, lathe, tube, weltLoop, sphere, profiledSlab, transformPositions} from './mesh.js';
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
