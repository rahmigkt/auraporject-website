// 2D profiles for arm sections and leg turnings. Units: mm.
// Arm sections are drawn for the RIGHT arm: +x is the outside, -x faces the seat; y=0 is the arm bottom.

const arc = (cx, cy, r, a0, a1, n = 10) => {
  const pts = [];
  for (let k = 0; k <= n; k++) { const a = (a0 + (a1 - a0) * k / n) * Math.PI / 180; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
};

/** Rounded rectangle section; rTop/rBottom corner radii, lean = outward lean of the outer side at the top (mm). */
function roundedSection(w, h, rTop, rBottom, lean = 0) {
  rTop = Math.min(rTop, (w - lean) / 2 - 1, h / 2 - 1); rBottom = Math.min(rBottom, (w - lean) / 2 - 1, h / 2 - 1);
  // The outer face leans outward by `lean`; the top outer corner stays inside the overall width.
  const x0 = -w / 2, x1 = w / 2 - lean;
  return [
    ...arc(x1 - rBottom, rBottom, rBottom, -90, 0, 5),
    ...arc(x1 + lean - rTop, h - rTop, rTop, 0, 90, 10),
    ...arc(x0 + rTop, h - rTop, rTop, 90, 180, 10),
    ...arc(x0 + rBottom, rBottom, rBottom, 180, 270, 5)
  ];
}

/** Arm with a rolled top that overhangs outward. roll = radius of the roll (mm). */
function rolledSection(w, h, roll, inwardLean = 0) {
  const R = Math.min(roll, w * 0.62, h * 0.45), cx = w / 2 - R, cy = h - R;
  const body = w / 2 - R * 0.55, inner = -w / 2;
  return [
    [inner + inwardLean * 0.2, 0], [body, 0], [body, cy - R * 0.92],
    ...arc(cx, cy, R, -62, 0, 6).slice(1),
    ...arc(cx, cy, R, 0, 180, 16).slice(1),
    [cx - R, cy - R * 0.25], [inner + inwardLean, cy - R * 0.5], [inner + inwardLean * 0.5, h * 0.3]
  ];
}

export const ARM_TYPES = ['track', 'square', 'slim', 'rolled', 'scroll', 'flare', 'slope', 'panel', 'wood', 'none'];

/** Section polygon for an arm type at width w (mm) and height h (mm). p carries continuous parameters. */
export function armSection(type, w, h, p = {}) {
  const top = p.topRadius ?? 0.3;
  switch (type) {
    case 'track': return roundedSection(w, h, w * (0.25 + 0.25 * top), 12);
    case 'square': return roundedSection(w, h, Math.max(6, w * 0.12 * top + 6), 6);
    case 'slim': return roundedSection(w, h, w * 0.45, 8);
    case 'panel': return roundedSection(w, h, 4 + 8 * top, 3);
    case 'slope': return roundedSection(w, h, w * (0.2 + 0.3 * top), 10);
    case 'flare': return roundedSection(w, h, w * (0.3 + 0.2 * top), 10, (p.flare ?? 0.4) * w * 0.55);
    case 'rolled': return rolledSection(w, h, w * (0.42 + 0.18 * top));
    case 'scroll': return rolledSection(w, h, w * (0.36 + 0.14 * top), w * 0.18);
    default: return roundedSection(w, h, 10, 10);
  }
}

/** How far the arm's widest point overhangs its base on the outside (mm): the body below is narrower. */
export function armOverhang(type, w, h, p = {}) {
  const top = p.topRadius ?? 0.3;
  if (type === 'rolled') return Math.min(w * (0.42 + 0.18 * top), w * 0.62, h * 0.45) * 0.55;
  if (type === 'scroll') return Math.min(w * (0.36 + 0.14 * top), w * 0.62, h * 0.45) * 0.55;
  if (type === 'flare') return (p.flare ?? 0.4) * w * 0.55;
  return 0;
}

export const LEG_TYPES = ['tapered', 'cone', 'turned', 'bun', 'cylinder', 'block', 'squareTaper', 'spindle', 'castor'];

/** Leg turning profile [[y, r]] for a leg of height h and top radius r (mm). taper = bottom/top ratio. */
export function legProfile(type, h, r, taper = 0.6) {
  const P = rows => rows.map(([y, k]) => [y * h, Math.max(1.5, k * r)]);
  switch (type) {
    case 'cone': return P([[0, taper * 0.75], [0.04, taper * 0.75], [0.05, taper * 0.8], [1, 1]]);
    case 'turned': return P([[0, 0.55], [0.06, 0.62], [0.12, 0.5], [0.24, 0.92], [0.36, 0.55], [0.52, 1.0], [0.68, 0.62], [0.8, 0.82], [0.9, 0.72], [1, 0.95]]);
    case 'bun': return P([[0, 0.62], [0.12, 0.88], [0.35, 1.0], [0.62, 0.95], [0.82, 0.78], [1, 0.7]]);
    case 'cylinder': return P([[0, 1], [1, 1]]);
    case 'spindle': return P([[0, taper], [0.08, taper], [0.1, taper * 1.15], [0.12, taper], [0.86, 0.9], [0.88, 1.05], [0.9, 0.95], [1, 0.95]]);
    case 'castor': return P([[0, 0.9], [0.18, 0.9], [0.22, 0.55], [0.3, 0.55], [0.34, 1], [1, 1]]);
    case 'block': return P([[0, 1], [1, 1]]);
    case 'squareTaper': return P([[0, taper], [1, 1]]);
    default: return P([[0, taper], [0.02, taper], [1, 1]]);
  }
}

export const isSquareLeg = type => type === 'block' || type === 'squareTaper';
