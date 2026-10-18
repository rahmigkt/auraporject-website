// Drawing-only simplification. Coordinates are world millimetres; no product geometry is changed.
// Collinear touching/overlapping strokes become one interval, even across neighbouring parts.
export function mergeSketchSegments(segments, tolerance = 0.01) {
  const lines = new Map(), snap = n => Math.round(n / tolerance);
  for (const [a, b] of segments) {
    let d = b.map((v, i) => v - a[i]), length = Math.hypot(...d);
    if (length < tolerance) continue;
    d = d.map(v => v / length);
    if (d.find(v => Math.abs(v) > 1e-8) < 0) d = d.map(v => -v);
    const dot = p => p.reduce((s, v, i) => s + v * d[i], 0), ta = dot(a), tb = dot(b);
    const origin = a.map((v, i) => v - ta * d[i]);
    // Direction is dimensionless and needs a tighter quantisation than mm positions.
    const key = d.map(v => Math.round(v * 1e6)).join(',') + ':' + origin.map(snap).join(',');
    if (!lines.has(key)) lines.set(key, {d, origin, intervals: []});
    lines.get(key).intervals.push([Math.min(ta, tb), Math.max(ta, tb)]);
  }
  const out = [];
  for (const {d, origin, intervals} of lines.values()) {
    intervals.sort((a, b) => a[0] - b[0]);
    let [lo, hi] = intervals[0];
    const emit = () => out.push([origin.map((v, i) => v + lo * d[i]), origin.map((v, i) => v + hi * d[i])]);
    for (const [a, b] of intervals.slice(1)) {
      if (a <= hi + tolerance) hi = Math.max(hi, b);
      else { emit(); lo = a; hi = b; }
    }
    emit();
  }
  return out;
}

// Close-spaced decorative geometry is retained as a volume, with quieter internal strokes.
export const sketchDetail = part => ['tuft-button', 'reeds', 'seam', 'welt', 'pull', 'cane'].includes(part.role) || !!part.line;
