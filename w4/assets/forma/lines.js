// Line details shared by every family: the simple lines a designer adds to a form — topstitching on
// upholstery, a metal inlay or a shadow groove on solid surfaces. Each is a thin tube along a 3D polyline.
// Units: mm. Lines never change the structure; they are drawn in the sketch and named in the parts list.

export const LINE = {
  stitch: {r: 1.2, dash: [6, 4], mat: 'stitch'},
  inlay: {r: 1.5, dash: null, mat: 'inlay'},
  groove: {r: 1.5, dash: null, mat: 'dark'}
};

const r1 = v => Math.round(v * 10) / 10;

/** Split long segments so a line can follow a curved (crowned) surface. Input: closed [u, v] loop. */
export function densify(loop, maxLen = 40) {
  const out = [];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i], b = loop[(i + 1) % loop.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / maxLen));
    for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return out;
}

/** Counter-clockwise copy of an [x, z] outline (same test as the slab builder). */
export function ccw(outline) {
  let area = 0; for (let i = 0; i < outline.length; i++) { const p = outline[i], q = outline[(i + 1) % outline.length]; area += p[0] * q[1] - q[0] * p[1]; }
  return area > 0 ? outline : [...outline].reverse();
}

/** A line part. kind: 'stitch' | 'inlay' | 'groove'. points: closed loop of [x, y, z] in the part frame. */
export function linePart(id, kind, points, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const L = LINE[kind];
  return {id, role: kind, mat: L.mat, geom: {fn: 'line', points: points.map(p => p.map(r1)), r: L.r, dash: L.dash}, pos, rot, line: true, noShadow: true, ...(L.dash ? {render3d: true} : {})};
}

/** Insets for single / double rows. */
export const rows = (mode, first, pitch = 9) => mode === 'double' ? [first, first + pitch] : mode === 'none' ? [] : [first];
