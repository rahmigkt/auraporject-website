// One customer's design language, three seat counts. The original design stays independent.
import {normalizeDesign} from './generate.js';
export const SET_KINDS = ['sofa', 'loveseat', 'armchair'];
export const PREVIEW_LIMIT = 12;
const SEATS = {sofa: 3, loveseat: 2, armchair: 1};
export function setCounts(input) {
  const counts = {};
  for (const kind of SET_KINDS) {
    const value = input?.[kind] ?? 0;
    if ((typeof value !== 'string' && typeof value !== 'number') || (typeof value === 'string' && !value.trim()) || !Number.isSafeInteger(Number(value)) || Number(value) < 0 || Number(value) > 999) throw new RangeError('Set quantities must be whole numbers from 0 to 999');
    counts[kind] = Number(value);
  }
  return counts;
}
export function createSeatingSet(source, input) {
  if (source?.family !== 'seating') throw new TypeError('A seating design is required');
  const counts = setCounts(input), base = normalizeDesign(structuredClone(source)), p = base.params;
  const seatWidth = Math.max(500, (p.width - 2 * p.armWidth) / p.seatCount);
  return SET_KINDS.filter(kind => counts[kind]).map(kind => {
    const seats = SEATS[kind];
    let design;
    if (base.kind === kind && p.seatCount === seats) design = structuredClone(base);
    else {
      design = {...structuredClone(base), kind, params: {...p, seatCount: seats, width: 2 * p.armWidth + seats * seatWidth, pillows: Math.min(p.pillows, seats)}};
      // Part-specific free-form edits cannot safely be transferred to a differently sized assembly.
      delete design.overrides;
      design = normalizeDesign(design);
    }
    if (design.params.seatCount !== seats) throw new RangeError('The selected seat count does not fit this design');
    return {kind, qty: counts[kind], design};
  });
}
export function saveSeatingSet(project, entries, groupId) {
  if (typeof groupId !== 'string' || !groupId) throw new TypeError('A set identity is required');
  const original = structuredClone(project), remaining = original.items.filter(i => i.seatingSet !== groupId);
  let next = 1 + Math.max(0, ...original.items.map(i => Number(String(i.id).slice(1)) || 0));
  const added = entries.map(entry => {
    const previous = original.items.find(i => i.seatingSet === groupId && i.design.kind === entry.kind);
    return {id: previous?.id || 'U' + next++, seatingSet: groupId, qty: entry.qty, design: structuredClone(entry.design)};
  });
  return {...original, items: [...remaining, ...added]};
}
// A bounded 3D preview keeps large orders responsive; project quantities always retain the full count.
export function seatingSetPlan(prepared, layout = 0) {
  const instances = [], total = prepared.reduce((sum, p) => sum + p.qty, 0);
  // Round robin ensures each selected kind appears even in a large order.
  for (let n = 0; instances.length < Math.min(total, PREVIEW_LIMIT); n++) {
    for (const p of prepared) if (n < p.qty && instances.length < PREVIEW_LIMIT) instances.push({...p, id: p.kind + '-' + n});
  }
  if (!instances.length) return {W: 3200, D: 3000, placed: [], total, shown: 0};
  const cols = Math.ceil(Math.sqrt(instances.length)), rows = Math.ceil(instances.length / cols);
  const cw = Math.max(...instances.map(i => i.fp.w)) + 600, cd = Math.max(...instances.map(i => i.fp.d)) + 1000;
  const W = cols * cw + 600, D = rows * cd + 600;
  const placed = instances.map((it, index) => {
    const row = Math.floor(index / cols), col = index % cols, rot = !layout && row === rows - 1 && rows > 1 ? Math.PI : 0;
    const c = Math.cos(rot), s = Math.sin(rot), cx = (it.fp.x0 + it.fp.x1) / 2, cz = (it.fp.z0 + it.fp.z1) / 2;
    return {...it, x: (col - (cols - 1) / 2) * cw - cx * c - cz * s, z: (row - (rows - 1) / 2) * cd + cx * s - cz * c, rot};
  });
  return {W, D, placed, total, shown: placed.length};
}
