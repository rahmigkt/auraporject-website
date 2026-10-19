// Designer touches ("atölye" layer): free-form silhouettes for flat parts and turned profiles for legs, stored on the
// design as `overrides` and applied after the parametric compile. Shapes are kept relative to the original part
// (silhouette in its bounding box, profile along its height), so a later size change keeps the designer's form.

/** Closed or open Catmull-Rom curve through control points, `per` samples per segment. */
export function sampleCurve(pts, {closed = true, per = 10} = {}) {
  const n = pts.length, out = [];
  if (n < 2) return pts.map(p => p.slice());
  const P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  if (!closed) out.push(pts[n - 1].slice());
  return out;
}

/** Symmetric silhouettes are stored as the right half (x ≥ 0), from the top centre round to the bottom centre. */
export function fullSilhouette(o) {
  if (!o.symmetric) return o.points;
  const half = o.points, mirror = half.slice(1, -1).reverse().map(([u, v]) => [-u, v]);
  return [...half, ...mirror];
}

export const bbox = pts => { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return {x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2}; };

/** Parts a designer can shape: flat slabs (by id) and turned parts (by role, so all legs change together). */
export function editableParts(compiled) {
  const out = [], seen = new Set();
  for (const q of compiled.parts) {
    if (q.line || q.internal) continue;
    if (q.geom.fn === 'slab' && q.geom.outline?.length >= 3 && !q.nocut) out.push({key: `id:${q.id}`, tool: 'silhouette', id: q.id, role: q.role, label: q.role});
    const lathe = q.geom.fn === 'lathe' ? q.geom : q.geom.fn === 'clipped' && q.geom.inner?.fn === 'lathe' ? q.geom.inner : null;
    if (lathe && !seen.has(q.role) && !['pull', 'drain', 'basin', 'hob', 'grommet'].includes(q.role)) { seen.add(q.role); out.push({key: `role:${q.role}`, tool: 'profile', role: q.role, label: q.role}); }
  }
  return out;
}

const latheOf = q => q.geom.fn === 'lathe' ? q.geom : q.geom.fn === 'clipped' && q.geom.inner?.fn === 'lathe' ? q.geom.inner : null;

/** Current shape of an editable part as editor control points (silhouette: normalised in its box; profile: [t, r mm]). */
export function currentShape(compiled, target, n = 14) {
  const q = target.tool === 'silhouette' ? compiled.parts.find(p => p.id === target.id) : compiled.parts.find(p => p.role === target.role && latheOf(p));
  if (!q) return null;
  if (target.tool === 'silhouette') {
    const pts = q.geom.outline, b = bbox(pts);
    const norm = resample(pts, n * 2, true).map(([x, y]) => [round3((x - b.cx) / b.w), round3((y - b.cy) / b.h)]);
    return {size: [b.w, b.h], points: norm, outline: pts};
  }
  const prof = latheOf(q).profile, H = Math.max(...prof.map(p => p[0])) || 1;
  const pts = resample(prof.map(([y, r]) => [y, r]), Math.min(n, prof.length > 12 ? n : prof.length), false).map(([y, r]) => [round3(y / H), Math.round(r * 10) / 10]);
  return {height: H, points: pts};
}
const round3 = v => Math.round(v * 1000) / 1000;
/** Evenly spaced points along a polyline (closed or open), keeping the ends of an open one. */
export function resample(pts, n, closed) {
  if (pts.length <= n) return pts.map(p => p.slice());
  const seg = [], P = closed ? [...pts, pts[0]] : pts; let L = 0;
  for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(d); L += d; }
  const out = [], count = closed ? n : n - 1;
  for (let k = 0; k < count; k++) {
    let s = L * k / count, i = 0; while (i < seg.length - 1 && s > seg[i]) { s -= seg[i]; i++; }
    const f = seg[i] ? s / seg[i] : 0; out.push([P[i][0] + (P[i + 1][0] - P[i][0]) * f, P[i][1] + (P[i + 1][1] - P[i][1]) * f]);
  }
  if (!closed) out.push(pts[pts.length - 1].slice());
  return out;
}

/** Shapes a designer can add: box (sharp), soft box (radius), round bar, square bar, panel. Sizes in mm (w, h, d). */
export const EDGE_TYPES = ['square', 'eased', 'chamfer', 'underbevel', 'bullnose', 'ogee'];
export const ADD_SHAPES = ['box', 'softbox', 'round', 'square', 'panel'];
const v3 = (a, lim, def = 0) => [0, 1, 2].map(i => { const v = Array.isArray(a) && Number.isFinite(+a[i]) ? +a[i] : def; return Math.max(-lim, Math.min(lim, v)); });

/** Geometry for an added part. Bars stand on their base (y from 0 to h); boxes and panels are centred. */
export function addedGeom(o) {
  const [w, h, d] = o.size;
  if (o.shape === 'round') return {fn: 'lathe', profile: [[0, w / 2], [h, w / 2]]};
  if (o.shape === 'square') return {fn: 'lathe', profile: [[0, w / 2], [h, w / 2]], square: true};
  if (o.shape === 'softbox') return {fn: 'cushion', w, h, d, r: Math.min(o.radius || 20, w / 2 - 1, h / 2 - 1, d / 2 - 1)};
  return {fn: 'cushion', w, h, d, r: Math.min(o.shape === 'panel' ? 1.5 : Math.max(1, o.radius || 2), w / 2 - 0.5, h / 2 - 0.5, d / 2 - 0.5)};
}


/** Size of a part in its own axes and where its origin sits (base of a turned part, centre of a box). */
function partFrame(q) {
  const g = q.geom;
  if (g.fn === 'lathe') { const H = Math.max(...g.profile.map(p => p[0])), R = Math.max(...g.profile.map(p => p[1])); return {axis: 1, L: H, start: 0, w: 2 * R, d: 2 * R}; }
  if (g.fn === 'cushion' || g.fn === 'box') { const dims = [g.w, g.h, g.d], axis = dims.indexOf(Math.max(...dims)), o = [0, 1, 2].filter(i => i !== axis); return {axis, L: dims[axis], start: -dims[axis] / 2, w: dims[o[0]], d: dims[o[1]], o}; }
  return null;
}
function sweepGeom(q, s) {
  const f = partFrame(q); if (!f) return null;
  const A = [0, 0, 0]; A[f.axis] = 1;
  // bend direction ⟂ axis: outward from the piece's centre along the dominant horizontal axis, or a fixed one
  let B;
  if (s.dir === 'out' || s.dir === 'in') { const sg = s.dir === 'out' ? 1 : -1, cand = f.axis === 1 ? (Math.abs(q.pos[0]) >= Math.abs(q.pos[2]) ? [Math.sign(q.pos[0]) || 1, 0, 0] : [0, 0, Math.sign(q.pos[2]) || 1]) : (f.axis === 0 ? [0, 0, Math.sign(q.pos[2]) || 1] : [Math.sign(q.pos[0]) || 1, 0, 0]); B = cand.map(v => v * sg); }
  else { B = [0, 0, 0]; B[s.dir[1] === 'x' ? 0 : 2] = s.dir[0] === '+' ? 1 : -1; }
  if (B[f.axis]) B = f.axis === 0 ? [0, 0, 1] : [1, 0, 0];
  const bendAxis = B.findIndex(v => v !== 0), w = f.o ? (bendAxis === f.o[0] ? f.w : f.d) : f.w, d = f.o ? (bendAxis === f.o[0] ? f.d : f.w) : f.d;
  return {fn: 'sweep', axis: f.axis, bend: B, L: f.L, start: f.start, w, d, shape: s.shape, bow: s.mode === 'straight' ? 0 : s.bow, mode: s.mode === 'sabre' ? 'sabre' : 'arc', taper0: s.taper0, taper1: s.taper1};
}

/** Clean an overrides list from a link, file or editor. */
export function normalizeOverrides(list) {
  if (!Array.isArray(list)) return [];
  const num = v => Number.isFinite(+v) ? +v : 0, out = [];
  for (const o of list.slice(0, 120)) {
    if (!o || typeof o !== 'object') continue;
    if (o.tool === 'silhouette' && typeof o.id === 'string' && Array.isArray(o.points) && o.points.length >= 3)
      out.push({tool: 'silhouette', id: o.id.slice(0, 60), symmetric: !!o.symmetric, points: o.points.slice(0, 80).map(p => [Math.max(-1, Math.min(1, num(p[0]))), Math.max(-1, Math.min(1, num(p[1])))])});
    else if (o.tool === 'profile' && typeof o.role === 'string' && Array.isArray(o.points) && o.points.length >= 2)
      out.push({tool: 'profile', role: o.role.slice(0, 40), points: o.points.slice(0, 40).map(p => [Math.max(0, Math.min(1, num(p[0]))), Math.max(0.5, Math.min(400, num(p[1])))]).sort((a, b) => a[0] - b[0])});
    else if (o.tool === 'remove' && typeof o.id === 'string') out.push({tool: 'remove', id: o.id.slice(0, 60)});
    else if (o.tool === 'duplicate' && typeof o.id === 'string' && typeof o.as === 'string') out.push({tool: 'duplicate', id: o.id.slice(0, 60), as: o.as.slice(0, 60), mirror: !!o.mirror});
    else if (o.tool === 'add' && typeof o.id === 'string' && ADD_SHAPES.includes(o.shape)) {
      const sz = (o.size || []).slice(0, 3).map(v => Math.max(2, Math.min(4000, num(v))));
      out.push({tool: 'add', id: o.id.slice(0, 60), shape: o.shape, size: [sz[0] || 400, sz[1] || 40, sz[2] || 400], mat: typeof o.mat === 'string' ? o.mat.slice(0, 30) : 'wood', pos: v3(o.pos, 5000), radius: Math.max(0, Math.min(200, num(o.radius ?? 3)))});
    }
    else if (o.tool === 'sweep' && (typeof o.id === 'string' || typeof o.role === 'string')) {
      out.push({tool: 'sweep', ...(typeof o.id === 'string' ? {id: o.id.slice(0, 60)} : {role: o.role.slice(0, 40)}), mode: ['straight', 'arc', 'sabre'].includes(o.mode) ? o.mode : 'arc',
        shape: o.shape === 'round' ? 'round' : 'square', bow: Math.max(-400, Math.min(400, num(o.bow))), dir: ['out', 'in', '+x', '-x', '+z', '-z'].includes(o.dir) ? o.dir : 'out',
        taper0: Math.max(0.2, Math.min(2, num(o.taper0) || 1)), taper1: Math.max(0.2, Math.min(2, num(o.taper1) || 1))});
    }
    else if (o.tool === 'edge' && typeof o.id === 'string' && o.sides && typeof o.sides === 'object') {
      const sides = {}; for (const k of ['front', 'back', 'left', 'right']) { const e = o.sides[k]; if (Array.isArray(e) && EDGE_TYPES.includes(e[0])) sides[k] = [e[0], Math.max(1, Math.min(80, num(e[1]) || 6))]; }
      if (Object.keys(sides).length) out.push({tool: 'edge', id: o.id.slice(0, 60), sides});
    }
    else if (o.tool === 'transform' && typeof o.id === 'string') {
      const sc = v3(o.scale, 10, 1).map(v => Math.max(0.05, Math.min(10, v || 1)));
      out.push({tool: 'transform', id: o.id.slice(0, 60), move: v3(o.move, 5000), rot: v3(o.rot, Math.PI * 2), scale: sc});
    }
  }
  return out;
}

/** Apply the designer layer to a compiled design (returns a new compiled object; the input is not changed). */
export function applyOverrides(compiled, overrides) {
  const list = normalizeOverrides(overrides);
  if (!list.length) return compiled;
  const parts = compiled.parts.map(q => {
    let p = q;
    for (const o of list) {
      if (o.tool === 'silhouette' && q.id === o.id && q.geom.fn === 'slab') {
        const b = bbox(q.geom.outline), curve = sampleCurve(fullSilhouette(o), {closed: true, per: 8});
        const outline = curve.map(([u, v]) => [b.cx + u * b.w, b.cy + v * b.h]), nb = bbox(outline);
        p = {...p, geom: {...p.geom, outline}, shaped: true};
        if (Array.isArray(q.cut)) p.cut = [Math.round(nb.w), Math.round(nb.h), q.cut[2]];
      }
      if (o.tool === 'profile' && q.role === o.role) {
        const L = latheOf(q); if (!L) continue;
        const H = Math.max(...L.profile.map(r => r[0])) || 1;
        const prof = sampleCurve(o.points.map(([t, r]) => [t * H, r]), {closed: false, per: 6}).map(([y, r]) => [Math.max(0, Math.min(H, y)), Math.max(0.5, r)]);
        prof.sort((a, b) => a[0] - b[0]);
        const inner = {...L, profile: prof};
        p = {...p, geom: q.geom.fn === 'lathe' ? inner : {...q.geom, inner}, shaped: true};
      }
    }
    return p;
  });
  // Structure: remove, duplicate (optionally mirrored across the centre), add; then move / rotate / scale.
  const removed = new Set(list.filter(o => o.tool === 'remove').map(o => o.id));
  let out = parts.filter(q => !removed.has(q.id));
  for (const o of list) {
    if (o.tool === 'duplicate') { const q = out.find(x => x.id === o.id); if (q && !out.some(x => x.id === o.as)) out.push({...q, id: o.as, pos: o.mirror ? [-q.pos[0], q.pos[1], q.pos[2]] : [q.pos[0] + 60, q.pos[1], q.pos[2] + 60], rot: o.mirror ? [q.rot[0], -q.rot[1], -q.rot[2]] : q.rot.slice(), added: true}); }
    if (o.tool === 'add' && !out.some(x => x.id === o.id)) { const [w, h, d] = o.size; out.push({id: o.id, role: 'added-' + o.shape, mat: o.mat, geom: addedGeom(o), pos: o.pos.slice(), rot: [0, 0, 0], added: true, cut: ['round', 'square'].includes(o.shape) ? [Math.round(h), Math.round(w), Math.round(w)] : [Math.round(w), Math.round(d), Math.round(h)].sort((a, b) => b - a)}); }
  }
  // Swept members: by id, or every part of a role (all legs at once).
  out = out.map(q => {
    const sw = list.filter(o => o.tool === 'sweep' && (o.id === q.id || (o.role && o.role === q.role))).at(-1); if (!sw) return q;
    if (q.geom.fn === 'clipped' && q.geom.inner) { const gi = sweepGeom({...q, geom: q.geom.inner}, sw); return gi ? {...q, geom: {...q.geom, inner: gi}, shaped: true} : q; } // splayed: bend inside the tilt
    const g = sweepGeom(q, sw); return g ? {...q, geom: g, shaped: true} : q;
  });
  // Edge profiles per side. Box-like parts become slabs (plan outline × thickness) so every side can take a profile.
  out = out.map(q => {
    const e = list.filter(o => o.tool === 'edge' && o.id === q.id).at(-1); if (!e) return q;
    if (q.geom.fn === 'slab') return {...q, geom: {...q.geom, edges: {...(q.geom.edges || {}), ...e.sides}}, shaped: true};
    if (q.geom.fn === 'cushion' && !q.geom.crownTop && !q.geom.crownFront) {
      const {w, h, d} = q.geom, hw = w / 2, hd = d / 2;
      return {...q, geom: {fn: 'slab', outline: [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]], t: h, profile: ['square', h, 0], edges: e.sides}, pos: [q.pos[0], q.pos[1] - h / 2, q.pos[2]], shaped: true};
    }
    return q;
  });
  out = out.map(q => {
    const t = list.filter(o => o.tool === 'transform' && o.id === q.id).at(-1); if (!t) return q;
    const s3 = t.scale, scaled = s3.some(v => Math.abs(v - 1) > 1e-6);
    return {...q, pos: q.pos.map((v, i) => v + t.move[i]), rot: q.rot.map((v, i) => v + t.rot[i]), geom: scaled ? {fn: 'scaled', s: s3, inner: q.geom} : q.geom, cut: scaled && Array.isArray(q.cut) ? q.cut.map(v => Math.round(v * Math.max(...s3))) : q.cut, shaped: q.shaped || scaled};
  });
  return {...compiled, parts: out, meta: {...compiled.meta, shaped: list.length}};
}

/** DXF (R12 polylines, mm) of every shaped silhouette, for CNC: one closed outline per part, named by part id. */
export function silhouetteDxf(compiled) {
  const out = ['0', 'SECTION', '2', 'ENTITIES'];
  for (const q of compiled.parts) {
    if (!q.shaped || q.geom.fn !== 'slab') continue;
    out.push('0', 'POLYLINE', '8', `AURA_${q.id}`, '66', '1', '70', '1');
    for (const [x, y] of q.geom.outline) out.push('0', 'VERTEX', '8', `AURA_${q.id}`, '10', x.toFixed(2), '20', y.toFixed(2));
    out.push('0', 'SEQEND');
  }
  out.push('0', 'ENDSEC', '0', 'EOF');
  return out.join('\n');
}
