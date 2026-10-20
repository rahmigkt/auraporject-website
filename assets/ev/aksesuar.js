// AURA ev planı — the hidden project layer: rugs and lighting derived from the furniture that is already placed.
// The customer never picks these from a menu; they follow from the room. Rules (common interior guidance, to be
// checked against Codex research): living rug holds the sofa's front legs (≈250 mm on the rug) and reaches past the
// coffee table; bedroom rug starts a third of the way down the bed and shows ≥350 mm each side; dining rug runs
// ≥600 mm past the table so pulled-out chairs stay on it. Rugs come in retail sizes, never cut to fit, keep ≥150 mm
// off the walls and never run under a kitchen, wardrobe or TV unit. Pendant over the dining table at ~1550 mm
// (≈750–800 above the top), a floor lamp at the sofa end, a desk lamp on the desk, one ceiling light per room.
import {compileItem} from './items.js?v=20261020u';

export const RUG_SIZES = [[1200, 1800], [1400, 2000], [1600, 2300], [1700, 2400], [2000, 2000], [2000, 2500], [2000, 3000], [2400, 3400], [800, 2500]];
const frame = it => { const t = (it.rot_deg || 0) * Math.PI / 180, {size} = compileItem(it);
  return {c: it.pos_xy_mm, X: [Math.cos(t), Math.sin(t)], F: [Math.sin(t), -Math.cos(t)], w: size.w, d: size.d, h: size.h}; };
const at = (c, X, F, x, f) => [c[0] + X[0] * x + F[0] * f, c[1] + X[1] * x + F[1] * f];
const rect = (c, X, F, w, d) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => at(c, X, F, i * w / 2, j * d / 2));
const inside = ([x, y], b) => { let r = false; for (let i = 0, j = b.length - 1; i < b.length; j = i++) { const [xi, yi] = b[i], [xj, yj] = b[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) r = !r; } return r; };
const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
const edgeDist = (p, b) => Math.min(...b.map((q, i) => segDist(p, q, b[(i + 1) % b.length])));
const overlap = (P, Q) => { for (const poly of [P, Q]) for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], n = [b[1] - a[1], a[0] - b[0]];
  const pr = R => R.map(p => p[0] * n[0] + p[1] * n[1]), p1 = pr(P), p2 = pr(Q); if (Math.max(...p1) <= Math.min(...p2) + 1 || Math.max(...p2) <= Math.min(...p1) + 1) return false; } return true; };
const fits = (poly, room, block) => poly.every(p => inside(p, room) && edgeDist(p, room) >= 150) && !block.some(b => overlap(poly, b));

// pick the smallest retail rug (either way round) with across ≥ needA and along ≥ needF, place it via place(a, f)
function rug(needA, needF, place, room, block, maxA = Infinity) {
  const opts = RUG_SIZES.flatMap(([a, b]) => [[a, b], [b, a]]).filter(([a, f]) => a >= needA && f >= needF && a <= maxA).sort((p, q) => p[0] * p[1] - q[0] * q[1]);
  for (const [a, f] of opts) for (const sl of [0, 200, -200, 400, -400, 600, -600]) { if (Math.abs(sl) > (a - needA) / 2 + 1) continue; // slide along the piece, never off it
    const poly = place(a, f, sl); if (fits(poly, room, block)) return {poly, size: [Math.min(a, f), Math.max(a, f)]}; }
  return null;
}

export function accessories(D) {
  const rugs = [], lights = [], items = (D.items || []).filter(i => i.design);
  for (const s of D.spaces) {
    const room = s.boundary_xy_mm, mine = items.filter(i => i.space_id === s.id), k = i => i.design.kind;
    const block = mine.filter(i => ['run', 'island', 'wardrobe', 'tvunit', 'basin', 'bookcase', 'sideboard'].includes(k(i))).map(i => { const f = frame(i); return rect(f.c, f.X, f.F, f.w + 100, f.d + 100); });
    const sofa = mine.find(i => k(i) === 'sofa'), coffee = mine.find(i => k(i) === 'coffee');
    if (sofa) { const S = frame(sofa); let reach = 900; // sofa front → far side of the coffee table + 300
      if (coffee) { const C = frame(coffee), dist = (C.c[0] - S.c[0]) * S.F[0] + (C.c[1] - S.c[1]) * S.F[1]; reach = dist - S.d / 2 + C.d / 2 + 300; }
      const r = rug(S.w + 200, 250 + reach, (a, f, sl) => rect(at(S.c, S.X, S.F, sl, S.d / 2 - 250 + f / 2), S.X, S.F, a, f), room, block) || rug(S.w, 250 + reach - 300, (a, f, sl) => rect(at(S.c, S.X, S.F, sl, S.d / 2 - 250 + f / 2), S.X, S.F, a, f), room, block);
      if (r) rugs.push({...r, space: s.id, use: 'oturma', color: '#b8a184'});
      // floor lamp beside the sofa: the end with more free floor
      for (const side of [1, -1]) { const p = at(S.c, S.X, S.F, side * (S.w / 2 + 230), -S.d / 2 + 230);
        if (inside(p, room) && edgeDist(p, room) >= 180 && !block.some(b => inside(p, b))) { lights.push({kind: 'floor', pos: p, h: 1550, space: s.id}); break; } }
    }
    const bed = mine.find(i => k(i) === 'bed');
    if (bed) { const B = frame(bed), single = B.w <= 1400;
      const r = rug(B.w + (single ? 500 : 700), B.d * 0.55, (a, f, sl) => rect(at(B.c, B.X, B.F, sl, -B.d / 2 + B.d / 3 + f / 2), B.X, B.F, a, f), room, block);
      if (r) rugs.push({...r, space: s.id, use: 'yatak', color: '#d8ccbb'}); }
    const dining = mine.find(i => k(i) === 'dining');
    if (dining) { const T = frame(dining);
      const r = rug(T.w + 1200, T.d + 1200, (a, f) => rect(T.c, T.X, T.F, a, f), room, block);
      if (r) rugs.push({...r, space: s.id, use: 'yemek', color: '#a79783'});
      lights.push({kind: 'pendant', pos: T.c, h: 1550, space: s.id}); }
    const desk = mine.find(i => k(i) === 'desk');
    if (desk) { const K = frame(desk); lights.push({kind: 'desk', pos: at(K.c, K.X, K.F, K.w / 2 - 180, -K.d / 2 + 160), h: K.h || 750, space: s.id}); }
    // one ceiling light per room at the centre of its floor (not where the pendant already lights)
    let cx = 0, cy = 0, A = 0; room.forEach(([x0, y0], i) => { const [x1, y1] = room[(i + 1) % room.length], c = x0 * y1 - x1 * y0; A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c; });
    const c = A ? [cx / (3 * A), cy / (3 * A)] : room[0], liv = rugs.find(r => r.space === s.id && r.use === 'oturma');
    const ceil = liv ? liv.poly.reduce((m, p) => [m[0] + p[0] / 4, m[1] + p[1] / 4], [0, 0]) : c;
    if (s.kind !== 'balcony' && !lights.some(l => l.kind === 'pendant' && l.space === s.id && Math.hypot(l.pos[0] - ceil[0], l.pos[1] - ceil[1]) < 1500)) lights.push({kind: 'ceiling', pos: ceil, space: s.id});
  }
  return {rugs, lights};
}
