// Seating family: sofa, loveseat and armchair from one parametric assembly grammar.
// Units: millimetres and degrees. Origin: floor centre; front faces +z.
import {tuftGrid, transformPositions, bounds, roundedRectLoop} from './mesh.js';
import {linePart, densify, rows} from './lines.js';
import {buildMesh} from './build.js';
import {armSection, armOverhang, legProfile, isSquareLeg, ARM_TYPES, LEG_TYPES} from './profiles.js';
import {clamp} from './rng.js';

export const FAMILY = 'seating';

/** Continuous parameters: [min, max, step]. Ranges are concept limits, not structural approval. */
export const RANGES = {
  width: [700, 3200, 10], depth: [720, 1200, 10], height: [580, 1100, 10], seatHeight: [360, 500, 5],
  armWidth: [40, 320, 5], armHeight: [480, 780, 5], armTop: [0, 1, 0.05], armFlare: [0, 1, 0.05], armSlope: [0, 0.4, 0.02], armSet: [0, 90, 5],
  backRake: [4, 22, 1], backThickness: [120, 300, 5], camel: [0, 140, 5], channelCount: [3, 12, 1], tuftSpacing: [110, 240, 5],
  cushionThickness: [80, 230, 5], cushionCrown: [0, 45, 1], seatCount: [1, 4, 1],
  legHeight: [0, 340, 5], legSize: [10, 48, 1], legTaper: [0.3, 1, 0.05], legSplay: [0, 14, 1], legInset: [0, 140, 5], pillows: [0, 4, 1], pillowSize: [300, 600, 10]
};

export const ENUMS = {
  armType: ARM_TYPES,
  backType: ['tight', 'loose', 'channel', 'tufted', 'camel', 'low'],
  seatType: ['split', 'bench', 'tight'],
  cushionEdge: ['boxed', 'knife', 'bullnose', 'soft'],
  baseType: ['legs', 'plinth', 'floating', 'skirt', 'sled', 'frame'],
  legType: LEG_TYPES,
  welt: ['none', 'self', 'contrast'],
  stitch: ['none', 'single', 'double'],
  pillowType: ['square', 'lumbar', 'mix', 'bolster', 'boxed']
};

export const DEFAULTS = {
  width: 2100, depth: 920, height: 820, seatHeight: 430,
  armType: 'track', armWidth: 160, armHeight: 600, armTop: 0.4, armFlare: 0.3, armSlope: 0.15, armSet: 0,
  backType: 'loose', backRake: 12, backThickness: 190, camel: 60, channelCount: 6, tuftSpacing: 170,
  seatType: 'split', seatCount: 3, cushionThickness: 150, cushionCrown: 14, cushionEdge: 'boxed',
  baseType: 'legs', legType: 'tapered', legHeight: 140, legSize: 22, legTaper: 0.6, legSplay: 0, legInset: 60,
  welt: 'none', stitch: 'none', pillows: 0, pillowType: 'square', pillowSize: 450
};

const MIN_SEAT_WIDTH = 500;

/** Clamp, round and reconcile parameters so every combination is physically drawable. */
export function normalize(input = {}) {
  const p = {...DEFAULTS};
  for (const [k, [lo, hi, step]] of Object.entries(RANGES)) {
    const v = Number(input[k]);
    if (Number.isFinite(v)) p[k] = Math.round(clamp(v, lo, hi) / step) * step;
    p[k] = +p[k].toFixed(3);
  }
  for (const [k, list] of Object.entries(ENUMS)) if (list.includes(input[k])) p[k] = input[k];
  if (p.armType === 'none') p.armWidth = 0;
  else if (p.armType === 'wood') p.armWidth = clamp(p.armWidth, 40, 110);
  else if (p.armType === 'slim') p.armWidth = clamp(p.armWidth, 40, 120);
  else p.armWidth = Math.max(p.armWidth, 70);
  p.armHeight = Math.max(p.armHeight, p.seatHeight + 110);
  // Seats must fit between the arms.
  const inner = p.width - 2 * p.armWidth;
  const maxSeats = Math.max(1, Math.floor(inner / MIN_SEAT_WIDTH));
  if (p.seatCount > maxSeats) p.seatCount = maxSeats;
  if (inner < 480) p.width = 480 + 2 * p.armWidth;
  if (p.seatType === 'bench') p.seatCount = Math.max(1, p.seatCount);
  // Skirts hide short glides; plinths use the leg height as plinth height.
  if (p.baseType === 'skirt') p.legHeight = clamp(p.legHeight, 0, 30);
  if (p.baseType === 'plinth' || p.baseType === 'floating') p.legHeight = clamp(p.legHeight, 40, 140);
  if (p.baseType === 'sled' || p.baseType === 'frame') p.legHeight = Math.max(p.legHeight, 60);
  // Seat deck needs room under the cushion.
  const deckTop = p.seatHeight - p.cushionThickness * 0.88;
  if (deckTop - p.legHeight < 70) p.legHeight = Math.max(0, Math.round((deckTop - 70) / 5) * 5);
  p.height = Math.max(p.height, p.seatHeight + (p.backType === 'low' ? 200 : 260));
  if (p.backType === 'low') p.height = Math.min(p.height, p.seatHeight + 340);
  return p;
}

const part = (id, role, mat, geom, pos, rot = [0, 0, 0], extra = {}) => ({id, role, mat, geom, pos, rot, ...extra});

/** Height of a raked block so its top reaches topY from bottomY. */
const rakedHeight = (topY, bottomY, t, rakeDeg) => { const a = rakeDeg * Math.PI / 180; return Math.max(60, (topY - bottomY - t * Math.sin(a)) / Math.cos(a)); };

/** Back rake helper: position so that the rotated block's rear face touches rearZ and its bottom sits on bottomY. */
function rakedPlacement(w, h, t, rakeDeg, bottomY, rearZ) {
  const a = -rakeDeg * Math.PI / 180;
  const corners = new Float32Array([-1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1].map((s, i) => s * [w, h, t][i % 3] / 2));
  const b = bounds(transformPositions(corners, [0, 0, 0], [a, 0, 0]));
  const cy = bottomY - b.min[1], cz = rearZ - b.min[2];
  return {pos: [0, cy, cz], rot: [a, 0, 0], frontAt: y => {
    // z of the front face (local z = +t/2) at world height y. Rx(a): Y = cy + cos(a)ly - sin(a)z, Z = cz + sin(a)ly + cos(a)z.
    const ly = (y - cy + Math.sin(a) * t / 2) / Math.cos(a);
    return cz + Math.sin(a) * ly + Math.cos(a) * t / 2;
  }};
}

/** Build the part list. Meshes are created lazily by buildMesh(part). */
export function compile(raw) {
  const p = normalize(raw), parts = [];
  const W = p.width, D = p.depth, H = p.height, hw = W / 2, hd = D / 2;
  const legH = p.legHeight, y0 = legH; // bottom of the upholstered body
  const aw = p.armWidth, hasArms = p.armType !== 'none';
  const cT = p.cushionThickness, deckTop = Math.round(p.seatHeight - cT * 0.88);
  const innerW = W - 2 * aw;
  const timberArms = p.armType === 'wood';
  const overhang = hasArms && !timberArms ? Math.round(armOverhang(p.armType, aw, p.armHeight - y0, {topRadius: p.armTop, flare: p.armFlare})) : 0;
  const bodyW = W - 2 * overhang; // width of deck and back below an overhanging arm

  // ---- Base / seat deck --------------------------------------------------
  const deckH = deckTop - y0;
  if (p.baseType !== 'frame') {
    parts.push(part('base', 'seat-deck', 'fabric', {fn: 'cushion', w: timberArms ? innerW + 2 : bodyW, h: deckH, d: D - 10, r: Math.min(18, deckH / 3), crownFront: 4}, [0, y0 + deckH / 2, 5]));
  } else {
    const railH = clamp(deckH * 0.55, 50, 110), railT = 28;
    parts.push(part('rail-front', 'base-rail', 'wood', {fn: 'cushion', w: W, h: railH, d: railT, r: 3}, [0, deckTop - railH / 2, hd - railT / 2]));
    parts.push(part('rail-back', 'base-rail', 'wood', {fn: 'cushion', w: W, h: railH, d: railT, r: 3}, [0, deckTop - railH / 2, -hd + railT / 2]));
    for (const s of [-1, 1]) parts.push(part(`rail-side-${s < 0 ? 'l' : 'r'}`, 'base-rail', 'wood', {fn: 'cushion', w: railT, h: railH, d: D - 2 * railT, r: 3}, [s * (hw - railT / 2), deckTop - railH / 2, 0]));
    parts.push(part('deck-panel', 'seat-deck', 'fabric', {fn: 'cushion', w: W - 2 * railT, h: 40, d: D - 2 * railT, r: 8}, [0, deckTop - 20, 0]));
  }

  // ---- Back ---------------------------------------------------------------
  const backTop = H, backBottom = p.baseType === 'frame' ? deckTop : y0 + 10;
  let seatBackZ; // z where seat cushions end (front of back construction at seat level)
  const backW = timberArms ? innerW : bodyW - 8;
  if (p.backType === 'loose') {
    const frameTop = Math.min(backTop - 40, p.seatHeight + Math.max(170, (backTop - p.seatHeight) * 0.42));
    const frameT = Math.min(p.backThickness * 0.62, 150);
    const frH = rakedHeight(frameTop, backBottom, frameT, p.backRake * 0.6), fr = rakedPlacement(backW, frH, frameT, p.backRake * 0.6, backBottom, -hd);
    parts.push(part('back-frame', 'back-frame', 'fabric', {fn: 'cushion', w: backW, h: frH, d: frameT, r: 16, crownTop: 6}, fr.pos, fr.rot));
    const n = p.seatType === 'bench' && p.seatCount > 1 ? Math.min(p.seatCount, 3) : p.seatCount;
    const bcT = clamp(p.backThickness * 0.95, 110, 240), bcH = rakedHeight(backTop - 14, p.seatHeight - 30, bcT, p.backRake + 3), bcW = innerW / n;
    const zFrame = fr.frontAt(p.seatHeight + 60);
    const bc = rakedPlacement(bcW - 8, bcH, bcT, p.backRake + 3, p.seatHeight - 30, zFrame - 6);
    for (let i = 0; i < n; i++) parts.push(part(`back-cushion-${i + 1}`, 'back-cushion', 'fabric', {fn: 'cushion', w: bcW - 8, h: bcH, d: bcT, r: bcT * 0.32, crownFront: bcT * 0.16, crownTop: 10}, [-innerW / 2 + bcW * (i + 0.5), bc.pos[1], bc.pos[2]], bc.rot));
    seatBackZ = bc.frontAt(p.seatHeight - cT * 0.3) - 25;
  } else if (p.backType === 'channel') {
    const shellT = 70, shH = rakedHeight(backTop, backBottom, shellT, p.backRake), sh = rakedPlacement(backW, shH, shellT, p.backRake, backBottom, -hd);
    parts.push(part('back-shell', 'back-frame', 'fabric', {fn: 'cushion', w: backW, h: shH, d: shellT, r: 14}, sh.pos, sh.rot));
    const k = Math.round(p.channelCount), cw = innerW / k, chT = clamp(p.backThickness * 0.7, 90, 200), chH = rakedHeight(backTop - 18, deckTop, clamp(p.backThickness * 0.7, 90, 200), p.backRake);
    const ch = rakedPlacement(cw, chH, chT, p.backRake, deckTop, sh.frontAt(deckTop + 100) - 2);
    for (let i = 0; i < k; i++) parts.push(part(`channel-${i + 1}`, 'back-channel', 'fabric', {fn: 'cushion', w: cw - 1, h: chH, d: chT, r: Math.min(cw * 0.46, chT * 0.45), crownFront: chT * 0.12, crownTop: 6}, [-innerW / 2 + cw * (i + 0.5), ch.pos[1], ch.pos[2]], ch.rot));
    seatBackZ = ch.frontAt(p.seatHeight - cT * 0.3) - 15;
  } else {
    const t = p.backThickness, h = rakedHeight(backTop - 8 - (p.backType === 'camel' ? p.camel : 0) - 8, backBottom, t, p.backRake); // overall height is the camel peak
    const bk = rakedPlacement(backW, h, t, p.backRake, backBottom, -hd);
    const g = {fn: 'cushion', w: backW, h, d: t, r: Math.min(t * 0.3, 60), crownFront: 10, crownTop: 8};
    if (p.backType === 'camel') g.camel = p.camel;
    if (p.backType === 'tufted') {
      const faceH = h - (deckTop - backBottom) - 40, grid = tuftGrid(innerW - 40, faceH, p.tuftSpacing);
      const yShift = (deckTop - backBottom) / 2 + 10;
      g.tufts = grid.buttons.map(q => ({x: q.x, y: q.y + yShift})); g.pleats = grid.pleats.map(([a, c]) => [{x: a.x, y: a.y + yShift}, {x: c.x, y: c.y + yShift}]); g.tuftDepth = 22;
      const buttons = g.tufts.map(q => transformPositions(new Float32Array([q.x, q.y, t / 2 - 18]), bk.pos, bk.rot));
      parts.push(part('buttons', 'tuft-button', 'fabric', {fn: 'buttons', points: buttons.map(b => [...b]), r: 9}, [0, 0, 0], [0, 0, 0], {qty: buttons.length}));
    }
    parts.push(part('back', 'back-tight', 'fabric', g, bk.pos, bk.rot));
    seatBackZ = bk.frontAt(p.seatHeight - cT * 0.3) - 6;
  }

  // ---- Seat cushions ----------------------------------------------------
  const front = hd + 12;
  const seatD = Math.max(380, front - seatBackZ);
  const seatZ = front - seatD / 2;
  const edge = p.cushionEdge, crown = p.cushionCrown;
  const cg = (w) => {
    const base = {fn: 'cushion', w, h: cT, d: seatD};
    if (edge === 'knife') return {...base, r: 6, crownTop: crown + 10, crownBottom: crown * 0.6, crownFront: 6};
    if (edge === 'bullnose') return {...base, r: cT * 0.45, crownTop: crown, crownFront: 10};
    if (edge === 'soft') return {...base, r: cT * 0.32, crownTop: crown + 6, crownFront: 12};
    return {...base, r: 14, crownTop: crown, crownFront: 4};
  };
  // Topstitch on the seat tops: dashed thread loops inset from the edge, following the crowned surface.
  const bump = u => Math.max(0, 1 - u * u);
  const stitch = (id, g, pos) => rows(p.stitch, Math.max(22, g.r + 8)).forEach((inset, k) => {
    const hw = g.w / 2, hd = g.d / 2, loop = densify(roundedRectLoop(g.w - 2 * inset, g.d - 2 * inset, 14), 30);
    parts.push(linePart(`${id}-stitch-${k + 1}`, 'stitch', loop.map(([x, z]) => [x, g.h / 2 + (g.crownTop || 0) * bump(x / hw) * bump(z / hd) + 0.4, z]), pos));
  });
  if (p.seatType === 'tight') {
    const g = {...cg(innerW), r: Math.min(30, cT * 0.3)}, pos = [0, deckTop + cT / 2 - 4, seatZ];
    parts.push(part('seat', 'seat-tight', 'fabric', g, pos)); stitch('seat', g, pos);
  } else {
    const n = p.seatType === 'bench' ? 1 : p.seatCount, w = innerW / n;
    for (let i = 0; i < n; i++) {
      const x = -innerW / 2 + w * (i + 0.5);
      parts.push(part(`seat-cushion-${i + 1}`, 'seat-cushion', 'fabric', cg(w - 6), [x, deckTop + cT / 2, seatZ])); stitch(`seat-${i + 1}`, cg(w - 6), [x, deckTop + cT / 2, seatZ]);
      if (p.welt !== 'none' && edge !== 'soft') for (const s of edge === 'knife' ? [0] : [-1, 1])
        parts.push(part(`welt-${i + 1}-${s < 0 ? 'b' : s > 0 ? 't' : 'm'}`, 'welt', p.welt === 'contrast' ? 'welt' : 'fabric', {fn: 'welt', w: w - 6, d: seatD, r: 14, cord: 4}, [x, deckTop + cT / 2 + s * (cT / 2 - 2), seatZ]));
    }
  }

  // ---- Arms -------------------------------------------------------------
  if (hasArms) for (const s of [-1, 1]) {
    const side = s < 0 ? 'l' : 'r', ax = s * (hw - aw / 2);
    if (timberArms) {
      const postH = p.armHeight - legH, postW = clamp(aw * 0.55, 30, 50);
      for (const z of [hd - 40 - p.armSet, -hd + 60]) parts.push(part(`arm-post-${side}-${z > 0 ? 'f' : 'b'}`, 'arm-post', 'wood', {fn: 'lathe', profile: legProfile('squareTaper', postH, postW / 2, 0.8), square: true}, [ax, legH, z]));
      parts.push(part(`arm-top-${side}`, 'arm-top', 'wood', {fn: 'cushion', w: aw, h: 28, d: D - p.armSet + 10, r: 6}, [ax, p.armHeight + 14, -p.armSet / 2 + 5]));
      continue;
    }
    const armBottom = p.baseType === 'frame' ? deckTop : y0; // on a timber frame the arm sits on the side rail (no coplanar faces)
    const h = p.armHeight - armBottom, len = D - p.armSet;
    let sec = armSection(p.armType, aw, h, {topRadius: p.armTop, flare: p.armFlare});
    if (s < 0) sec = sec.map(([x, y]) => [-x, y]).reverse();
    const slope = p.armType === 'slope' ? p.armSlope + 0.15 : p.armSlope * 0.25;
    parts.push(part(`arm-${side}`, 'arm', 'fabric', {fn: 'loft', section: sec, length: len, noseFront: p.armType === 'panel' ? 10 : clamp(aw * 0.35, 18, 70), noseBack: 10, slope}, [ax, armBottom, -p.armSet / 2]));
  }

  // ---- Support: legs, plinth, skirt, sled, frame --------------------------
  const legGeom = (h) => ({fn: 'lathe', profile: legProfile(p.legType, h, p.legSize, p.legTaper), square: isSquareLeg(p.legType)});
  const legSpots = () => {
    const ix = bodyW / 2 - p.legInset - p.legSize, iz = hd - Math.min(p.legInset, 90) - p.legSize, spots = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) spots.push([sx * ix, sz * iz, sx, sz]);
    if (W > 1900) for (const sz of [-1, 1]) spots.push([0, sz * iz, 0, sz]);
    return spots;
  };
  if ((p.baseType === 'legs' || p.baseType === 'frame') && legH > 0) {
    const h = p.baseType === 'frame' ? deckTop : legH;
    legSpots().forEach(([x, z, sx, sz], i) => {
      const splay = p.legSplay * Math.PI / 180;
      const leg = part(`leg-${i + 1}`, 'leg', 'wood', legGeom(h), [x, 0, z], [sz * -splay * 0.7, 0, sx * splay], {mountTop: true});
      if (splay) leg.pos[1] = -bounds(transformPositions(buildMesh(leg).positions, [0, 0, 0], leg.rot)).min[1]; // keep the tilted foot on the floor
      parts.push(leg);
    });
  } else if (p.baseType === 'plinth' || p.baseType === 'floating') {
    const inset = p.baseType === 'floating' ? 150 : clamp(p.legInset, 20, 90);
    parts.push(part('plinth', 'plinth', p.baseType === 'floating' ? 'dark' : 'wood', {fn: 'cushion', w: bodyW - 2 * inset, h: legH, d: D - 2 * inset, r: 3}, [0, legH / 2, 0]));
  } else if (p.baseType === 'skirt') {
    const sh = clamp(deckTop - 10 - y0, 90, 220) + y0 - 12;
    const sx = Math.min(hw - 4, bodyW / 2 + 4); // skirt wraps the body but stays inside the overall width
    parts.push(part('skirt-front', 'skirt', 'fabric', {fn: 'cushion', w: 2 * sx + 8, h: sh, d: 8, r: 3}, [0, 12 + sh / 2, hd - 2]));
    parts.push(part('skirt-back', 'skirt', 'fabric', {fn: 'cushion', w: 2 * sx + 8, h: sh, d: 8, r: 3}, [0, 12 + sh / 2, -hd + 6]));
    for (const s of [-1, 1]) parts.push(part(`skirt-side-${s < 0 ? 'l' : 'r'}`, 'skirt', 'fabric', {fn: 'cushion', w: 8, h: sh, d: D - 4, r: 3}, [s * sx, 12 + sh / 2, 2]));
  } else if (p.baseType === 'sled' && legH > 0) {
    for (const s of [-1, 1]) {
      const x = s * (hw - Math.max(aw, 60) / 2 - 10), r = clamp(p.legSize * 0.45, 8, 14), z0 = hd - 70, z1 = -hd + 70;
      parts.push(part(`sled-${s < 0 ? 'l' : 'r'}`, 'sled', 'metal', {fn: 'tube', points: [[x, legH + 4, z0], [x, r, z0 + 10], [x, r, z1 - 10], [x, legH + 4, z1]], r}, [0, 0, 0]));
    }
  }

  // ---- Throw pillows (kırlent) --------------------------------------------
  // Real pillow shapes (mesh.js pillow): knife-edge square and lumbar, boxed, bolster; 'mix' puts squares at the back
  // and a lumbar in front. Pillows stand on the seat, lean back against the back cushions and turn slightly inward.
  const n = Math.min(p.pillows, 4), lean = 0.26;
  const shape = (type, size) => type === 'lumbar' ? {type: 'square', w: size * 1.15, h: size * 0.62, t: size * 0.34}
    : type === 'bolster' ? {type: 'bolster', w: size * 1.1, h: size * 0.46, t: size * 0.46}
    : type === 'boxed' ? {type: 'boxed', w: size, h: size, t: Math.min(110, size * 0.24)}
    : {type: 'square', w: size, h: size, t: size * 0.42};
  let backT = 0;
  for (let i = 0; i < n; i++) {
    const row = n === 1 ? 0 : Math.floor(i / 2), s = n === 1 ? 0 : i % 2 ? 1 : -1;
    const type = p.pillowType === 'mix' ? (row === 0 ? 'square' : 'lumbar') : p.pillowType;
    // Pillows never rise above the back: the leaning height (plus thickness) must fit under the overall height.
    const seatTop0 = deckTop + cT + (p.cushionCrown || 0) * 0.5, room = H - 10 - (seatTop0 - 22);
    const hk = type === 'lumbar' ? 0.62 : type === 'bolster' ? 0.46 : 1, fit = room / (hk * Math.cos(lean) + 0.22 * Math.sin(lean) * hk + (type === 'bolster' ? 0.01 : 0));
    const size = clamp(Math.min(p.pillowSize - row * 40, fit), 200, 600), g = shape(type, size);
    const geom = {fn: 'pillow', ...g, pinch: g.type === 'square' ? (type === 'lumbar' ? 0.05 : 0.09) : 0, chop: type === 'square' ? 0.55 : 0, cord: p.welt === 'none' ? 0 : 3};
    const lying = g.type === 'bolster';
    if (row === 0) backT = Math.max(backT, g.t);
    const seatTop = deckTop + cT + (p.cushionCrown || 0) * 0.5; // pillows press slightly into the seat
    const y = seatTop - 22 + (lying ? g.h / 2 : g.h / 2 * Math.cos(lean));
    const z = seatBackZ + g.t / 2 + (lying ? 20 : g.h / 2 * Math.sin(lean) + 10) + (row ? backT * 0.75 + g.h / 2 * Math.sin(lean) : 0); // front row sits in front of the back row
    const x = s * Math.max(0, innerW / 2 - g.w / 2 - 30 - row * 160);
    parts.push(part(`pillow-${i + 1}`, 'pillow', 'welt', geom, [x, y, z], lying ? [0, 0, 0] : [-lean, -s * 0.18, s * 0.04]));
  }

  // ---- Internal frame (structure view and BOM) ---------------------------
  const fy = Math.max(y0 + 20, deckTop - 100), railH = 90, railT = 30;
  if (p.baseType !== 'frame') {
    parts.push(part('frame-front-rail', 'frame-rail', 'frame', {fn: 'box', w: W - 40, h: railH, d: railT}, [0, fy + railH / 2 - 20, hd - 40], [0, 0, 0], {internal: true}));
    parts.push(part('frame-back-rail', 'frame-rail', 'frame', {fn: 'box', w: W - 40, h: railH, d: railT}, [0, fy + railH / 2 - 20, -hd + 40], [0, 0, 0], {internal: true}));
    for (const s of [-1, 1]) parts.push(part(`frame-side-${s < 0 ? 'l' : 'r'}`, 'frame-rail', 'frame', {fn: 'box', w: railT, h: railH, d: D - 80}, [s * (hw - 20 - railT / 2), fy + railH / 2 - 20, 0], [0, 0, 0], {internal: true}));
  }
  const nStretch = Math.max(1, Math.round(innerW / 600));
  for (let i = 1; i <= nStretch; i++) {
    const x = -hw + 20 + (W - 40) * i / (nStretch + 1);
    if (Math.abs(x) < hw - 60) parts.push(part(`frame-stretcher-${i}`, 'frame-stretcher', 'frame', {fn: 'box', w: 22, h: 60, d: D - 120}, [x, fy + 10, 0], [0, 0, 0], {internal: true}));
  }

  const meta = derive(p, {deckTop, seatD, seatBackZ, innerW});
  return {family: FAMILY, params: p, parts, meta};
}

/** Derived dimensions shown on drawings and checked by validate(). */
function derive(p, {deckTop, seatD, seatBackZ, innerW}) {
  const usableSeatDepth = Math.round(p.depth / 2 + 12 - Math.max(seatBackZ, -p.depth / 2));
  return {
    overall: {width: p.width, depth: p.depth, height: p.height},
    seatHeight: p.seatHeight, armHeight: p.armType === 'none' ? null : p.armHeight,
    seatDepth: usableSeatDepth, seatWidthEach: Math.round(innerW / (p.seatType === 'split' ? p.seatCount : 1)),
    innerWidth: Math.round(innerW), clearance: p.legHeight, deckTop, cushionDepth: Math.round(seatD),
    seats: p.seatCount, kind: p.seatCount === 1 && p.width < 1300 ? 'armchair' : p.width < 1700 ? 'loveseat' : 'sofa'
  };
}

/** Adjust overall depth so the usable seat depth reaches target (mm). Returns new params. */
export function fitSeatDepth(params, target) {
  let p = normalize(params);
  for (let i = 0; i < 3; i++) {
    const m = compile(p).meta, delta = target - m.seatDepth;
    if (Math.abs(delta) < 8) break;
    p = normalize({...p, depth: p.depth + delta});
  }
  return p;
}

/** Ergonomic and manufacturing checks. Returns [{level:'error'|'warn', code, value}]. */
export function validate(design) {
  const {params: p, meta: m, parts} = design, issues = [];
  const add = (level, code, value) => issues.push({level, code, value});
  if (m.seatDepth < 450) add('error', 'seatDepthShort', m.seatDepth);
  else if (m.seatDepth > 720) add('warn', 'seatDepthDeep', m.seatDepth);
  if (m.seatWidthEach < 480 && p.seatType === 'split') add('warn', 'seatNarrow', m.seatWidthEach);
  if (p.armType !== 'none' && p.armHeight - p.seatHeight > 360) add('warn', 'armHigh', p.armHeight - p.seatHeight);
  if (p.height - p.seatHeight < 230 && p.backType !== 'low') add('warn', 'backLow', p.height - p.seatHeight);
  if (p.width > 2600) add('warn', 'transportSplit', p.width);
  if (p.baseType === 'legs' && p.legHeight > 0 && p.legSize < 16 && p.width > 1500) add('warn', 'thinLegs', p.legSize);
  for (const q of parts) {
    const g = q.geom;
    for (const k of ['w', 'h', 'd']) if (g[k] !== undefined && !(g[k] > 0)) add('error', 'nonPositive', `${q.id}.${k}`);
  }
  return issues;
}

// Mesh construction is shared by all families.
export {buildMesh, worldPositions} from './build.js';
