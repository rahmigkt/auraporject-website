// AURA ev planı — furniture layout solver. The assistant states intent (which products, which room, what matters);
// this module places them at true size with interior-design rules: walls and corners, doors and their swing,
// windows and light, focal relations (sofa ↔ TV, table ↔ kitchen, desk ↔ window), clearances. Returns several
// scored alternatives; it never bends a rule to make something fit.
import {compileItem} from './items.js?v=20261020u';

// Clearances in mm. Sources: Neufert (Architects' Data) furniture spacing tables and common manufacturer guidance;
// AURA proposals where marked. They are design targets, not building law.
export const RULES = {
  passage: 600,        // free route past furniture (AURA proposal; Neufert gives 600–900 for domestic circulation)
  bedSide: 600,        // access beside and at the foot of a double bed
  wardrobeFront: 900,  // doors and drawers open, a person stands
  kitchenFront: 1200,  // working aisle in front of a kitchen run
  diningAround: 800,   // pulling a chair out and sitting
  deskBack: 900,       // chair behind a desk
  tvMin: 1800, tvMax: 3600, // viewing distance band for a living-room TV
  coffeeGap: [350, 500],    // sofa front to coffee table
  groupGap: [350, 600],     // loveseat / armchair front to the coffee table (Ballard Designs 14–18 in; Midwest Design 16–18 in)
  groupMax: 3000,           // furthest seat of a conversation group from its centre (8–10 ft between seats, Ballard Designs)
  wall: 20             // gap to the wall finish
};
const KIND = {
  run: 'kitchen', island: 'kitchen', bed: 'bed', wardrobe: 'wardrobe', dresser: 'storage', bookcase: 'storage', sideboard: 'storage', vitrine: 'storage',
  tvunit: 'tv', sofa: 'sofa', loveseat: 'second', armchair: 'chair', reading: 'corner', shoe: 'storage', coatrack: 'storage', coffee: 'coffee', side: 'side', dining: 'dining', desk: 'desk', console: 'storage', basin: 'basin', column: 'storage', nightstand: 'night', vanity: 'desk'
};
const ORDER = ['kitchen', 'bed', 'wardrobe', 'basin', 'tv', 'sofa', 'coffee', 'second', 'chair', 'dining', 'desk', 'storage', 'corner', 'night', 'side'];
const FRONT = {kitchen: RULES.kitchenFront, bed: RULES.bedSide, wardrobe: RULES.wardrobeFront, storage: RULES.passage, basin: RULES.passage, tv: 0, sofa: RULES.passage, desk: RULES.deskBack, dining: RULES.diningAround, coffee: 300, chair: 400, second: 400, corner: 450, side: 0, night: 300};

// ---- geometry ------------------------------------------------------------------------------------------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const len = a => Math.hypot(a[0], a[1]), unit = a => mul(a, 1 / (len(a) || 1));
const inside = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
const area2 = poly => poly.reduce((s, [x, y], i) => { const [u, v] = poly[(i + 1) % poly.length]; return s + x * v - u * y; }, 0);
const cross = (a, b, c, d) => { const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
function sat(A, B) { // convex polygons overlap (separating axis), tolerance 1 mm
  for (const P of [A, B]) for (let i = 0; i < P.length; i++) { const e = sub(P[(i + 1) % P.length], P[i]), n = [-e[1], e[0]];
    const pa = A.map(p => dot(p, n)), pb = B.map(p => dot(p, n)), k = len(n);
    if (Math.max(...pa) - 1 * k <= Math.min(...pb) || Math.max(...pb) - 1 * k <= Math.min(...pa)) return false; }
  return true;
}
const rect = (c, ax, az, w, d) => [add(add(c, mul(ax, -w / 2)), mul(az, -d / 2)), add(add(c, mul(ax, w / 2)), mul(az, -d / 2)), add(add(c, mul(ax, w / 2)), mul(az, d / 2)), add(add(c, mul(ax, -w / 2)), mul(az, d / 2))];
const within = (poly, room) => poly.every(p => inside(p, room)) && !poly.some((p, i) => room.some((q, j) => cross(p, poly[(i + 1) % poly.length], q, room[(j + 1) % room.length])));

// The room as wall runs: each boundary edge with its inward normal and the openings that sit on it.
export function roomRuns(space, ev) {
  let b = space.boundary_xy_mm; if (area2(b) < 0) b = [...b].reverse(); // counter-clockwise: inward normal is the left normal
  return b.map((P, i) => {
    const Q = b[(i + 1) % b.length], u = unit(sub(Q, P)), n = [-u[1], u[0]], L = len(sub(Q, P)), openings = [];
    for (const o of ev.ops) { const w = ev.walls.find(x => x.id === o.wall_id); if (!w) continue;
      const A = [w.x0 + w.ux * o.a, w.y0 + w.uy * o.a], B = [w.x0 + w.ux * (o.a + o.w), w.y0 + w.uy * (o.a + o.w)], m = mul(add(A, B), 0.5);
      if (Math.abs(dot(sub(m, P), n)) > w.t / 2 + 150 || Math.abs(dot([w.ux, w.uy], u)) < 0.9) continue;
      let s0 = dot(sub(A, P), u), s1 = dot(sub(B, P), u); if (s0 > s1) [s0, s1] = [s1, s0]; if (s1 < 0 || s0 > L) continue;
      openings.push({kind: o.kind, s0: Math.max(0, s0), s1: Math.min(L, s1), sill: o.sill || 0, h: o.h || 2100, id: o.id}); }
    return {i, P, Q, u, n, L, openings, door: openings.some(o => o.kind === 'door'), window: openings.some(o => o.kind === 'window')};
  });
}

// ---- candidates ------------------------------------------------------------------------------------------
function placeOnRun(run, s, size, extraBack = 0) { // back to the wall, front facing into the room
  const c = add(add(run.P, mul(run.u, s)), mul(run.n, size.d / 2 + RULES.wall + extraBack)), rot = Math.atan2(run.n[0], -run.n[1]) * 180 / Math.PI;
  return {c, rot, ax: run.u, az: run.n};
}
const frame = rot => { const t = rot * Math.PI / 180; return {ax: [Math.cos(t), Math.sin(t)], az: [Math.sin(t), -Math.cos(t)]}; };
function shapes(kind, p, size) { // body footprint and the clearance zone it needs (in front; beds also at the sides)
  const body = rect(p.c, p.ax, p.az, size.w, size.d), f = FRONT[kind] || 0, zones = [];
  if (f) zones.push(rect(add(p.c, mul(p.az, size.d / 2 + f / 2)), p.ax, p.az, kind === 'dining' ? size.w + 2 * f : size.w, f));
  if (kind === 'bed') for (const k of size.w <= 1400 && p.side ? [p.side] : [-1, 1]) zones.push(rect(add(p.c, mul(p.ax, k * (size.w / 2 + RULES.bedSide / 2))), p.ax, p.az, RULES.bedSide, size.d * 0.8));
  if (kind === 'dining') { zones.push(rect(add(p.c, mul(p.az, -(size.d / 2 + f / 2))), p.ax, p.az, size.w, f)); zones[0] = rect(add(p.c, mul(p.az, size.d / 2 + f / 2)), p.ax, p.az, size.w, f); for (const k of p.endWall ? [-p.endWall] : [-1, 1]) zones.push(rect(add(p.c, mul(p.ax, k * (size.w / 2 + f / 2))), p.ax, p.az, f, size.d)); }
  return {body, zones};
}
function doorSwings(runs) { const z = []; for (const r of runs) for (const o of r.openings) if (o.kind === 'door') { const w = o.s1 - o.s0, d = w > 1000 ? w / 2 : w, c = add(add(r.P, mul(r.u, (o.s0 + o.s1) / 2)), mul(r.n, d / 2)); z.push(rect(c, r.u, r.n, w + 100, d)); } return z; }

// ---- scoring ----------------------------------------------------------------------------------------------
function blocksWindow(run, s, size, h) { return run.openings.some(o => o.kind === 'window' && s + size.w / 2 > o.s0 - 50 && s - size.w / 2 < o.s1 + 50 && h > o.sill - 30); }
function scoreItem(kind, p, run, size, ctx) {
  let sc = 0; const notes = [];
  const centred = run ? 1 - Math.abs(p.s - run.L / 2) / (run.L / 2) : 0;
  const effH = kind === 'tv' ? Math.max(size.h, 1500) : size.h; // a TV screen stands above its unit: never in front of a window
  if (run && blocksWindow(run, p.s, size, effH)) { if (['wardrobe', 'storage', 'kitchen', 'tv', 'bed'].includes(kind)) return null; }
  if (kind === 'bed') { sc += run.door ? -2 : 3; sc += run.window ? -2 : 1; sc += 2 * centred; notes.push('yatak başı dolu duvarda'); }
  if (kind === 'wardrobe' || kind === 'storage') { const toEnd = Math.min(p.s - size.w / 2, run.L - p.s - size.w / 2); sc += toEnd < 150 ? 2 : 0; sc += run.window ? -1 : 1; }
  if (kind === 'kitchen') { sc += run.window ? 2 : 0; sc += size.w / run.L; }
  if (kind === 'basin') { sc += run.door ? -1 : 1; sc += centred; }
  if (kind === 'tv') { const opp = ctx.runs.find(r => dot(r.n, run.n) < -0.9); sc += run.window ? -3 : 2; sc += opp?.window ? -1 : 1; sc += 2 * centred; notes.push('TV pencereye karşı değil'); }
  if (kind === 'sofa' && ctx.tv) { const v = sub(ctx.tv.c, p.c), d = len(v), facing = dot(unit(v), p.az);
    if (facing < 0.92 || d < RULES.tvMin || d > RULES.tvMax) return null; sc += 4 - Math.abs(d - 2600) / 600 + facing - Math.abs(dot(v, p.ax)) / 800; notes.push(`TV'ye ${(d / 1000).toFixed(1)} m`); 
    // balance: in a large room the sitting group takes the middle (or the side away from the kitchen), not one end
    if (ctx.roomA > 20) { const mid = mul(add(p.c, ctx.tv.c), 0.5); sc += ctx.kitchen ? Math.min(2, len(sub(mid, ctx.kitchen.c)) / 2000) : 1.5 * (1 - len(sub(mid, ctx.roomC)) / ctx.roomR); } }
  if (kind === 'sofa' && !ctx.tv) { sc += run ? 1 + centred : 0; if (ctx.windowRuns.some(r => dot(r.n, p.az) > 0.9)) sc += 1; }
  if (kind === 'sofa' && run && run.window && blocksWindow(run, p.s, size, size.h)) sc -= 1.5; // back to the window: glare and draught
  if (kind === 'coffee') { const so = ctx.sofa; if (!so) return null; const ext = Math.abs(dot(p.az, so.az)) > 0.7 ? size.d : size.w, gap = dot(sub(p.c, so.c), so.az) - so.size.d / 2 - ext / 2, lat = Math.abs(dot(sub(p.c, so.c), so.ax));
    if (gap < RULES.coffeeGap[0] - 5 || gap > RULES.coffeeGap[1] + 5 || lat > 150) return null; sc += 3 + (Math.abs(dot(p.az, so.az)) > 0.7 ? 1.5 : 0); }
  if (kind === 'second' || kind === 'chair') { const co = ctx.coffee, so = ctx.sofa;
    if (co && so && p.group) { const gap = len(sub(p.c, co.c)); if (gap > RULES.groupMax) return null; sc += (kind === 'second' ? 4 : 3) - gap / 2000; if (ctx.tv && dot(sub(ctx.tv.c, p.c), p.az) > 0 && Math.abs(dot(unit(sub(ctx.tv.c, p.c)), p.az)) > 0.95) sc -= 2; notes.push(kind === 'second' ? 'ikili sehpaya bakar' : 'tekli sehpaya bakar'); }
    else if (co && so) return null; else sc += run ? 1 : 0; }
  if (kind === 'corner') { const wd = ctx.windowDist(p.c); if (wd > 1800) return null; sc += 3 - wd / 900; if (ctx.coffee && len(sub(p.c, ctx.coffee.c)) < 1500) sc -= 2; notes.push('kahve köşesi pencere yanında'); }
  if (kind === 'side') { if (!p.by) return null; sc += p.by === 'corner' ? 3 : p.by === 'sofa' ? 2 : 1.5; }
  if (kind === 'dining') { if (p.endWall) { if (inside(add(p.c, mul(p.ax, p.endWall * (size.w / 2 + 60))), ctx.room)) return null; sc -= 0.8; } if (ctx.kitchen) { const d = len(sub(p.c, ctx.kitchen.c)); sc += 3 - d / 1500; } sc += ctx.windowDist(p.c) < 2500 ? 1 : 0; }
  if (kind === 'desk') { const wd = ctx.windowDist(p.c); sc += 3 - wd / 1200; sc += run && run.window ? 1 : 0; notes.push('masa gün ışığında'); }
  if (kind === 'night') { const b = ctx.bed; if (!b) return null; const lat = Math.abs(dot(sub(p.c, b.c), b.ax)) - b.size.w / 2 - size.w / 2, back = dot(sub(p.c, b.c), b.az) + b.size.d / 2 - size.d / 2; if (lat < 0 || lat > 80 || Math.abs(back) > 80) return null; sc += 2; }
  return {sc, notes};
}

// ---- search ------------------------------------------------------------------------------------------------
export function solveRoom(space, roomItems, ev, {count = 3, beam = 60} = {}) {
  const runs = roomRuns(space, ev), room = space.boundary_xy_mm, swings = doorSwings(runs);
  const roomA = Math.abs(area2(room)) / 2e6, roomR = Math.sqrt(roomA) * 1000 / 2, roomC = room.reduce((m, q) => [m[0] + q[0] / room.length, m[1] + q[1] / room.length], [0, 0]);
  const winCentres = runs.flatMap(r => r.openings.filter(o => o.kind === 'window').map(o => add(add(r.P, mul(r.u, (o.s0 + o.s1) / 2)), mul(r.n, 50))));
  const windowDist = c => winCentres.length ? Math.min(...winCentres.map(w => len(sub(c, w)))) : 9e9;
  const list = roomItems.map(it => ({it, kind: KIND[it.design.kind] || 'storage', size: it.size || compileItem(it).size}))
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || b.size.w * b.size.d - a.size.w * a.size.d);
  let states = [{placed: [], score: 0, notes: []}];
  for (const L of list) {
    const next = [];
    for (const st of states) {
      const ctx = {runs, windowDist, windowRuns: runs.filter(r => r.window), roomA, roomC, roomR, room}; for (const q of st.placed) { if (q.kind === 'tv') ctx.tv = q; if (q.kind === 'sofa') ctx.sofa = q; if (q.kind === 'kitchen') ctx.kitchen = q; if (q.kind === 'bed') ctx.bed = q; if (q.kind === 'coffee') ctx.coffee = q; if (q.kind === 'second') ctx.second = q; if (q.kind === 'corner') ctx.corner = q; if (q.kind === 'chair') ctx.chair = q; }
      const cands = [];
      const floating = ['sofa', 'coffee', 'dining', 'chair', 'side', 'night'].includes(L.kind) || (L.kind === 'desk');
      for (const run of runs) { if (run.L < L.size.w + 2 * RULES.wall) continue;
        for (let s = L.size.w / 2 + RULES.wall; s <= run.L - L.size.w / 2 - RULES.wall + 1; s += 100) cands.push({...placeOnRun(run, s, L.size), s, run}); }
      if (floating) { const bb = room.reduce((m, [x, y]) => [Math.min(m[0], x), Math.min(m[1], y), Math.max(m[2], x), Math.max(m[3], y)], [1e9, 1e9, -1e9, -1e9]);
        for (let x = bb[0] + 300; x < bb[2]; x += 150) for (let y = bb[1] + 300; y < bb[3]; y += 150) for (const rot of [0, 90, 180, 270]) cands.push({c: [x, y], rot, ...frame(rot), run: null}); }
      if (L.kind === 'coffee' && ctx.sofa) { const so = ctx.sofa; for (const g of [380, 430, 480]) for (const turn of [0, 90]) { const rot = so.rot + turn, f = frame(rot); cands.push({c: add(so.c, mul(so.az, so.size.d / 2 + g + (turn ? L.size.w : L.size.d) / 2)), rot, ...f, run: null}); } }
      if ((L.kind === 'second' || L.kind === 'chair') && ctx.coffee && ctx.sofa) { // conversation group: around the coffee table, facing it
        const co = ctx.coffee, so = ctx.sofa, ext = v => Math.abs(dot(v, co.ax)) * co.size.w / 2 + Math.abs(dot(v, co.az)) * co.size.d / 2;
        for (const dir of [so.ax, mul(so.ax, -1), so.az]) for (const g of [400, 480, 560]) { const az = mul(dir, -1), rot = Math.atan2(az[0], -az[1]) * 180 / Math.PI;
          cands.push({c: add(co.c, mul(dir, ext(dir) + g + L.size.d / 2)), rot, ...frame(rot), run: null, group: true}); } }
      if (L.kind === 'corner') for (const run of runs.filter(r => r.window)) for (const o of run.openings.filter(o => o.kind === 'window')) for (const s0 of [o.s0 - L.size.w / 2 - 100, o.s1 + L.size.w / 2 + 100, (o.s0 + o.s1) / 2]) {
        if (s0 < L.size.w / 2 || s0 > run.L - L.size.w / 2) continue; for (const turn of [0, 30, -30]) { const base = placeOnRun(run, s0, L.size, 80), rot = base.rot + turn; cands.push({...base, ...frame(rot), rot, run: turn ? null : run, s: s0}); } }
      if (L.kind === 'side') for (const q of [ctx.sofa, ctx.second, ctx.corner, ctx.chair].filter(Boolean)) for (const k of [-1, 1]) cands.push({c: add(add(q.c, mul(q.ax, k * (q.size.w / 2 + 40 + L.size.w / 2))), mul(q.az, -(q.size.d - L.size.d) / 2 + 60)), rot: q.rot, ax: q.ax, az: q.az, run: null, by: q.kind});
      if (L.kind === 'night' && ctx.bed) { const b = ctx.bed; for (const k of [-1, 1]) cands.push({c: add(add(b.c, mul(b.ax, k * (b.size.w / 2 + L.size.w / 2 + 30))), mul(b.az, -(b.size.d / 2 - L.size.d / 2))), rot: b.rot, ax: b.ax, az: b.az, run: null}); }
      if (L.kind === 'bed' && L.size.w <= 1400) for (const c of [...cands]) for (const side of [-1, 1]) cands.push({...c, side});
      if (L.kind === 'dining') for (const c of [...cands]) for (const endWall of [-1, 1]) cands.push({...c, endWall}); // small homes: one end of the table may touch a wall
      for (const c of cands) {
        const sh = shapes(L.kind, c, L.size); if (!within(sh.body, room)) continue;
        if (L.kind !== 'coffee' && L.kind !== 'night' && sh.zones.some(z => !within(z, room) && z.some(p => !inside(p, room)))) continue;
        if (swings.some(z => sat(z, sh.body))) continue;
        const GROUP = ['sofa', 'coffee', 'second', 'chair'], friends = q => (L.kind === 'coffee' && q.kind === 'sofa') || (L.kind === 'night' && q.kind === 'bed') || (GROUP.includes(L.kind) && GROUP.includes(q.kind)) || (L.kind === 'side' && ['sofa', 'second', 'chair', 'corner'].includes(q.kind)); // pieces that belong inside another's zone
        if (st.placed.some(q => sat(q.body, sh.body) || (!friends(q) && (q.zones.some(z => sat(z, sh.body)) || sh.zones.some(z => sat(z, q.body)))))) continue;
        const r = scoreItem(L.kind, c, c.run, L.size, ctx); if (!r) continue;
        next.push({placed: [...st.placed, {id: L.it.id, kind: L.kind, c: c.c, ax: c.ax, az: c.az, rot: c.rot, size: L.size, body: sh.body, zones: sh.zones, run: c.run?.i ?? null}], score: st.score + r.sc, notes: [...st.notes, ...r.notes]});
      }
    }
    if (!next.length) return {ok: false, failed: L.it.id, reason: `${L.it.name || L.it.design.kind} bu odaya kurallara uyarak sığmıyor`, alternatives: []};
    next.sort((a, b) => b.score - a.score); states = [];
    for (const n of next) { const key = n.placed.map(q => `${q.run}:${Math.round(q.c[0] / 400)}:${Math.round(q.c[1] / 400)}:${q.rot}`).join('|'); if (!states.some(s => s.key === key)) states.push({...n, key}); if (states.length >= beam) break; }
  }
  // distinct alternatives: differ in where the main pieces stand
  const out = []; for (const s of states) { const sig = s.placed.map(q => `${q.run}:${Math.round(q.rot)}:${Math.round(q.c[0] / 900)}:${Math.round(q.c[1] / 900)}`).join('|'); if (!out.some(o => o.sig === sig)) out.push({...s, sig}); if (out.length >= count) break; }
  return {ok: true, alternatives: out.map(s => ({score: +s.score.toFixed(2), notes: [...new Set(s.notes)], placements: s.placed.map(q => ({id: q.id, pos_xy_mm: q.c.map(Math.round), rot_deg: ((Math.round(q.rot) % 360) + 360) % 360}))}))};
}
