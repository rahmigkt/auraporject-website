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

/** Clean an overrides list from a link, file or editor. */
export function normalizeOverrides(list) {
  if (!Array.isArray(list)) return [];
  const num = v => Number.isFinite(+v) ? +v : 0, out = [];
  for (const o of list.slice(0, 40)) {
    if (!o || typeof o !== 'object') continue;
    if (o.tool === 'silhouette' && typeof o.id === 'string' && Array.isArray(o.points) && o.points.length >= 3)
      out.push({tool: 'silhouette', id: o.id.slice(0, 60), symmetric: !!o.symmetric, points: o.points.slice(0, 80).map(p => [Math.max(-1, Math.min(1, num(p[0]))), Math.max(-1, Math.min(1, num(p[1])))])});
    else if (o.tool === 'profile' && typeof o.role === 'string' && Array.isArray(o.points) && o.points.length >= 2)
      out.push({tool: 'profile', role: o.role.slice(0, 40), points: o.points.slice(0, 40).map(p => [Math.max(0, Math.min(1, num(p[0]))), Math.max(0.5, Math.min(400, num(p[1])))]).sort((a, b) => a[0] - b[0])});
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
  return {...compiled, parts, meta: {...compiled.meta, shaped: list.length}};
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
