// Room view for a project: every product the customer added, placed in a lit room (floor, two walls, a window,
// an LED cove, a rug). Layouts are rule-based: furniture against walls with walkways and the usual distances
// (coffee table 450 mm in front of the sofa, 900 mm walkways). Units: mm. Room frame: floor y = 0, back wall
// at z = -D/2, left wall at x = -W/2, the open corner (front-right) is where the camera looks in from.
import {worldPositions} from './build.js';

/** What belongs in which room. Anything else gets a warning, and is placed if the customer insists. */
export const ROOM_TYPES = {
  living: {fits: ['sofa', 'loveseat', 'armchair', 'coffee', 'side', 'console', 'dresser']},
  dining: {fits: ['dining', 'console', 'side', 'armchair', 'dresser']},
  bedroom: {fits: ['set', 'wardrobe', 'nightstand', 'dresser', 'vanity', 'side', 'console', 'armchair', 'desk']},
  study: {fits: ['desk', 'armchair', 'side', 'console', 'loveseat']}
};
/** Item kind as used for room rules: the old bedroom family is one set; case goods are their own kind. */
export const itemKind = d => d.family === 'bedroom' ? 'set' : d.kind;
const BEDROOM_KINDS = ['wardrobe', 'nightstand', 'vanity'];

/** Room type suggested by the items: a bedroom set makes a bedroom, seating a living room, a dining table a dining room. */
export function suggestRoom(items) {
  const k = items.map(i => itemKind(i.design));
  if (k.includes('set') || k.some(x => BEDROOM_KINDS.includes(x)) || (k.includes('dresser') && !k.some(x => ['sofa', 'loveseat', 'dining'].includes(x)))) return 'bedroom';
  if (k.some(x => ['sofa', 'loveseat', 'armchair', 'coffee'].includes(x))) return 'living';
  if (k.includes('dining')) return 'dining';
  if (k.includes('desk')) return 'study';
  return 'living';
}
export const misfits = (items, type) => items.filter(i => !ROOM_TYPES[type].fits.includes(itemKind(i.design)));

/** Footprint of a compiled piece in its own frame (mm): x0..x1, z0..z1, height. */
export function footprint(compiled) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, y1 = 0;
  for (const q of compiled.parts) {
    if (q.internal || q.planOnly || q.decor || q.line) continue;
    const p = worldPositions(q);
    for (let v = 0; v < p.length; v += 3) { x0 = Math.min(x0, p[v]); x1 = Math.max(x1, p[v]); y1 = Math.max(y1, p[v + 1]); z0 = Math.min(z0, p[v + 2]); z1 = Math.max(z1, p[v + 2]); }
  }
  return {x0, x1, z0, z1, w: x1 - x0, d: z1 - z0, h: y1};
}

/**
 * Place items. items: [{id, kind, fp}] (fp from footprint). layout: 0, 1, 2 (different arrangements).
 * Returns {W, D, placed: [{id, x, z, rot}]} — x, z: where the piece's own origin goes; rot: about y (radians);
 * a piece's front (+z) faces into the room.
 */
function arrangeRaw(items, type, layout = 0) {
  const by = k => items.filter(i => i.kind === k), placed = [], gap = 450, walk = 900;
  // Position so the footprint's back edge touches a line: rot 0 → back at zBack; rot ±π/2 → against a side wall.
  const put = (it, cx, backZ, rot = 0) => {
    const f = it.fp;
    if (rot === 0) placed.push({id: it.id, x: cx - (f.x0 + f.x1) / 2, z: backZ - f.z0, rot});
    else if (rot === Math.PI) placed.push({id: it.id, x: cx + (f.x0 + f.x1) / 2, z: backZ + f.z0, rot});
    else placed.push({id: it.id, x: backZ - (rot > 0 ? f.z0 : -f.z0), z: cx + (rot > 0 ? (f.x0 + f.x1) / 2 : -(f.x0 + f.x1) / 2), rot});
  };
  let W = 4200, D = 3800;
  if (type === 'bedroom' && !by('set').length) {
    // Case goods along the back wall around a plain bed (the bed is only context: 160 × 200 on a simple frame).
    // Layout 0: wardrobe | bedside · bed · bedside | chest / vanity. Layout 1: mirrored. Layout 2: chest / vanity on the window wall.
    const wds = by('wardrobe'), ns = by('nightstand').slice(0, 2), drs = [...by('dresser'), ...by('vanity')];
    const others = items.filter(i => !wds.includes(i) && !ns.includes(i) && !drs.includes(i));
    const bed = {w: 1700, l: 2120}, gapB = 60, gapG = 500;
    const groupBed = (ns[0]?.fp.w || 0) + (ns[0] ? gapB : 0) + bed.w + (ns[1] ? gapB + ns[1].fp.w : 0);
    const side = layout === 2 ? [] : drs, rowItems = layout === 1 ? [...side, 'bed', ...wds] : [...wds, 'bed', ...side];
    const total = rowItems.reduce((s, it, i) => s + (it === 'bed' ? groupBed : it.fp.w) + (i ? gapG : 0), 0) + others.reduce((s, it) => s + it.fp.w + gapG, 0);
    rowItems.push(...others);
    W = Math.max(4200, total + 900); D = Math.max(4200, bed.l + 1500 + (layout === 2 ? 0 : 0));
    const back = -D / 2 + 20, left = -W / 2 + 20; let x = -total / 2, bedAt = null;
    rowItems.forEach((it, i) => {
      if (i) x += gapG;
      if (it !== 'bed') { put(it, x + it.fp.w / 2, back); x += it.fp.w; return; }
      if (ns[0]) { put(ns[0], x + ns[0].fp.w / 2, back); x += ns[0].fp.w + gapB; }
      bedAt = {x: x + bed.w / 2, z: back + bed.l / 2, w: bed.w, l: bed.l}; x += bed.w;
      if (ns[1]) { x += gapB; put(ns[1], x + ns[1].fp.w / 2, back); x += ns[1].fp.w; }
    });
    if (layout === 2) { let z = D / 2 - 300; drs.forEach(it => { z -= it.fp.w / 2; put(it, z, left, Math.PI / 2); z -= it.fp.w / 2 + 400; }); }
    return {W, D, placed, bed: bedAt};
  }
  if (type === 'bedroom') {
    const set = by('set')[0], others = items.filter(i => i !== set);
    W = Math.max(4200, (set?.fp.w || 0) + 1200); D = Math.max(4000, (set?.fp.d || 0) + 2200);
    if (set) put(set, layout === 1 ? -W / 2 + 300 + set.fp.w / 2 : 0, -D / 2 + 20);
    others.forEach((it, i) => { const s = i % 2 ? 1 : -1; put(it, D / 2 - 900 - it.fp.w / 2, s * (W / 2 - 20), s > 0 ? -Math.PI / 2 : Math.PI / 2); });
    return {W, D, placed};
  }
  const seats = [...by('sofa'), ...by('loveseat')], chairs = by('armchair'), coffee = by('coffee'), sides = by('side'), consoles = by('console'), dining = by('dining'), desks = by('desk');
  const main = seats[0], rest = seats.slice(1), r0 = rest[0];
  W = Math.max(4200, (main?.fp.w || 2000) + 2 * walk + (layout === 1 && r0 ? r0.fp.d + 300 : 0), dining[0] ? dining[0].fp.w + 2 * 1100 : 0);
  D = Math.max(3800, (main?.fp.d || 900) + gap + (coffee[0]?.fp.d || 600) + gap + (r0 || chairs[0] ? 1000 : 0) + walk);
  if (layout === 2) W = Math.max(W, (main?.fp.d || 900) + gap + (coffee[0]?.fp.d || 600) + gap + (r0?.fp.d || 0) + walk + 600);
  const back = -D / 2 + 20, left = -W / 2 + 20;
  // Layout 0: sofa on the back wall, second sofa facing it, armchairs beside it turned in.
  // Layout 1: an L — second sofa on the window wall, main sofa along the back wall next to it, armchairs opposite.
  // Layout 2: the main sofa under the window facing into the room, second sofa opposite, armchairs at the table ends.
  const mainX = layout === 1 && r0 ? left + r0.fp.d + 150 + (main?.fp.w || 0) / 2 : 0;
  let front = back + (main?.fp.d || 0) + gap;
  if (type === 'dining' && dining[0]) { put(dining[0], 0, -dining[0].fp.d / 2); front = dining[0].fp.d / 2 + walk; }
  else if (main) { if (layout === 2) put(main, 0, left, Math.PI / 2); else put(main, mainX, back); }
  if (layout === 2) {
    const tx = left + (main?.fp.d || 0) + gap, cw = coffee[0]?.fp.w || 1000, cd = coffee[0]?.fp.d || 600;
    if (coffee[0]) put(coffee[0], 0, tx, Math.PI / 2);
    rest.forEach((it, i) => put(it, i * (it.fp.w + 300), tx + cd + gap + it.fp.d, -Math.PI / 2));
    chairs.forEach((it, i) => { const s = i % 2 ? 1 : -1, x = tx + cd / 2 - (it.fp.x0 + it.fp.x1) / 2; if (s < 0) put(it, tx + cd / 2, -cw / 2 - 350 - it.fp.d, 0); else put(it, tx + cd / 2, cw / 2 + 350 + it.fp.d, Math.PI); void x; });
  } else {
    if (coffee[0]) { put(coffee[0], mainX, front); front += coffee[0].fp.d; }
    rest.forEach((it, i) => {
      if (layout === 1) put(it, back + 150 + it.fp.w / 2 + i * (it.fp.w + 300), left, Math.PI / 2);
      else put(it, mainX + i * (it.fp.w + 300), front + gap + it.fp.d, Math.PI);
    });
    chairs.forEach((it, i) => {
      const s = chairs.length === 1 ? 1 : i % 2 ? 1 : -1, row = Math.floor(i / 2);
      const beside = r0 && layout === 0, x = beside ? mainX + s * (r0.fp.w / 2 + it.fp.w / 2 + 420) : mainX + s * (it.fp.w / 2 + 180) + (chairs.length === 1 ? 300 : 0);
      put(it, x, front + gap + it.fp.d + row * 900, Math.PI);
      placed.at(-1).rot = Math.PI - s * (beside ? 0.45 : 0.3);
    });
  }
  // Side tables at the ends of the main sofa; consoles and desks on the walls.
  sides.forEach((it, i) => {
    const s = i % 2 ? 1 : -1;
    if (main && layout === 1 && r0) { if (i === 0) put(it, mainX + main.fp.w / 2 + it.fp.w / 2 + 60, back + 40); else put(it, back + 150 + r0.fp.w + 60 + it.fp.w / 2 + (i - 1) * 700, left + 40, Math.PI / 2); }
    else if (main && layout !== 2) put(it, mainX + s * (main.fp.w / 2 + it.fp.w / 2 + 60), back + 40);
    else if (main) put(it, s * (main.fp.w / 2 + it.fp.w / 2 + 60), left + 40, Math.PI / 2);
    else put(it, left + 300 + it.fp.w / 2 + i * 700, back + 40);
  });
  // Consoles: on the window wall (layout 0), else on the back wall beyond the sofa and its side table.
  let cx = main && layout === 1 ? mainX + main.fp.w / 2 + (sides.length ? sides[r0 ? 0 : Math.min(1, sides.length - 1)].fp.w + 60 : 0) + 350 : W / 2 - 300;
  consoles.forEach((it, i) => { if (layout === 0) put(it, -D / 2 + 900 + it.fp.w / 2 + i * 1300, left, Math.PI / 2); else if (layout === 1) { put(it, cx + it.fp.w / 2, back); cx += it.fp.w + 300; } else put(it, W / 2 - 300 - it.fp.w / 2 - i * 1300, back); });
  desks.forEach((it, i) => put(it, W / 2 - 400 - it.fp.w / 2 - i * 1600, back));
  // Anything without a rule here (a piece the customer wanted in this room anyway) goes to the free front corner.
  // The room grows to the right for them, and everything is re-centred.
  const extra = items.filter(it => !placed.some(p => p.id === it.id));
  if (extra.length) {
    const add = extra.reduce((m, it) => Math.max(m, it.fp.w), 0) + 1100;
    let z = -D / 2 + 700;
    for (const it of extra) { put(it, W / 2 + add / 2, z); z += it.fp.d + 800; }
    for (const p of placed) p.x -= add / 2;
    W += add;
  }
  return {W, D, placed};
}

export function arrange(items, type, layout = 0) {
  const plan = arrangeRaw(items, type, layout);
  // Grow the room on its open sides (right, front) until every piece sits inside with a walkway, then re-centre.
  let x1 = -Infinity, z1 = -Infinity;
  for (const pl of plan.placed) {
    const f = items.find(i => i.id === pl.id).fp, c = Math.cos(pl.rot), s = Math.sin(pl.rot);
    for (const [x, z] of [[f.x0, f.z0], [f.x1, f.z0], [f.x0, f.z1], [f.x1, f.z1]]) { x1 = Math.max(x1, pl.x + x * c + z * s); z1 = Math.max(z1, pl.z - x * s + z * c); }
  }
  const gx = Math.max(0, x1 + 600 - plan.W / 2), gz = Math.max(0, z1 + 600 - plan.D / 2);
  for (const pl of plan.placed) { pl.x -= gx / 2; pl.z -= gz / 2; }
  const bed = plan.bed ? {...plan.bed, x: plan.bed.x - gx / 2, z: plan.bed.z - gz / 2} : null;
  return {...plan, bed, W: plan.W + gx, D: plan.D + gz};
}

/** World position of a placed piece's footprint centre (for the rug). */
export function worldCenter(fp, pl) {
  const cx = (fp.x0 + fp.x1) / 2, cz = (fp.z0 + fp.z1) / 2, c = Math.cos(pl.rot), s = Math.sin(pl.rot);
  return {x: pl.x + cx * c + cz * s, z: pl.z - cx * s + cz * c, turned: Math.abs(s) > 0.7};
}

/** Room shell parts (decor: 'room'): floor, back and left walls with skirting, window opening, LED cove, rug. */
export function shell(W, D, {H = 2800, rug = null, bed = null} = {}) {
  const parts = [], box = (id, mat, w, h, d, pos) => parts.push({id, role: 'room', mat, geom: {fn: 'box', w, h, d}, pos, rot: [0, 0, 0], decor: 'room', noShadow: true});
  const t = 120;
  box('floor', 'floor', W + 2 * t, 40, D + 2 * t, [0, -17, 0]); // top 3 mm above the stage's shadow plane (no z-fighting)
  box('wall-back', 'wall', W + 2 * t, H, t, [0, H / 2, -D / 2 - t / 2]);
  // Left wall with a tall window: two piers and a lintel/sill around the glazed opening.
  const win = Math.min(2400, D * 0.5), wz = -D / 2 + D * 0.55, sill = 450, head = 2350;
  box('wall-left-a', 'wall', t, H, wz - win / 2 + D / 2, [-W / 2 - t / 2, H / 2, (-D / 2 + wz - win / 2) / 2]);
  box('wall-left-b', 'wall', t, H, D / 2 - (wz + win / 2), [-W / 2 - t / 2, H / 2, (wz + win / 2 + D / 2) / 2]);
  box('wall-left-sill', 'wall', t, sill, win, [-W / 2 - t / 2, sill / 2, wz]);
  box('wall-left-head', 'wall', t, H - head, win, [-W / 2 - t / 2, (H + head) / 2, wz]);
  box('window', 'glass', 30, head - sill, win, [-W / 2 - t * 0.6, (head + sill) / 2, wz]);
  // Skirting boards.
  box('skirt-back', 'wallcut', W, 70, 14, [0, 35, -D / 2 + 7]);
  box('skirt-left', 'wallcut', 14, 70, D, [-W / 2 + 7, 35, 0]);
  // LED cove: a dropped soffit along the back wall with a light line under it.
  box('cove', 'wall', W, 120, 260, [0, H - 60, -D / 2 + 130]);
  box('led', 'led', W - 40, 10, 20, [0, H - 125, -D / 2 + 245]);
  if (rug) box('rug', 'rug', rug.w, 12, rug.d, [rug.x, 6, rug.z]);
  if (bed) {
    // Plain bed for context (not designed here): low frame, mattress, duvet, two pillows, a simple headboard panel.
    const {x, z, w, l} = bed, head = z - l / 2;
    box('bed-rug', 'rug', w + 1300, 12, 2300, [x, 6, z + 250]);
    box('bed-frame', 'wallcut', w, 260, l - 40, [x, 150, z + 20]);
    box('bed-head', 'wallcut', w, 1050, 60, [x, 525, head + 30]);
    box('bed-mattress', 'wall', w - 100, 220, l - 160, [x, 390, z + 40]);
    box('bed-duvet', 'rug', w - 60, 40, l * 0.62, [x, 515, z + l * 0.17]);
    for (const s of [-1, 1]) box(`bed-pillow-${s}`, 'wall', w / 2 - 140, 120, 360, [x + s * (w / 4 - 20), 560, head + 320]);
  }
  return {parts, meta: {room: true, cameraYaw: 0.72, overall: {width: W, depth: D, height: H}}};
}
