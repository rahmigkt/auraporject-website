// AURA studio — design actions as a pure function, shared by the browser studio (studio.js) and the headless studio
// engine used for training and evaluation (tools/studyo-motoru). Same input → same design: what the site applies and
// what training validates is one code path. UI effects (views, undo, panels) are returned, not performed.
import {sample, normalizeDesign} from './generate.js';
import {FAMILIES, familyOf} from './families.js';

export const SPECIES_TO_STAIN = {oak: 'oak', ash: 'lightOak', beech: 'natural', walnut: 'walnut', cherry: 'cherry', teak: 'teak', smoked: 'darkWalnut', ebonized: 'black'};
const sameFront = m => JSON.stringify(m.front) === JSON.stringify(m.case);
function seatsToSize(d, n) {
  // Grow the top until the capacity rule (600 mm per person, 650 mm on curved perimeters) seats n people.
  const p = {...d.params, kind: 'dining'}, round = p.topShape === 'round', mod = FAMILIES.table.mod;
  if (n >= 6 && round) p.topShape = 'oval';
  if (!round || n >= 6) { p.width = Math.max(p.width, n >= 6 ? 900 : 800); p.length = Math.max(800, Math.ceil(n / 2) * 600 - 200); }
  else p.length = p.width = 800;
  for (let i = 0; i < 40; i++) {
    const c = mod.compile({...normalizeDesign({...d, params: p}).params, kind: 'dining'});
    if (c.meta.seats >= n) break;
    if (p.topShape === 'round') { p.length += 50; p.width = p.length; } else p.length += 50;
  }
  return p;
}
const PIECE_OF = {headType: 'bed', headShape: 'bed', bedBase: 'bed', footboard: 'bed', storage: 'bed', bedding: 'bed', wdDoorType: 'wardrobe', wdDoorStyle: 'wardrobe', wdHandle: 'wardrobe', wdNiche: 'wardrobe', wdBase: 'wardrobe', mirror: 'dresser', drLayout: 'dresser', drBase: 'dresser', drRows: 'dresser', drColumns: 'dresser', nsLayout: 'nightstand', nsBase: 'nightstand', nsRows: 'nightstand', frontStyle: 'case', pull: 'case'};
function setKey(d, key, a, actions, env) {
  const k = actions.find(x => x.type === 'kind' && ['bed', 'wardrobe', 'dresser', 'nightstand'].includes(x.value))?.value || d.kind;
  const pre = k === 'nightstand' ? 'ns' : 'dr';
  if (k === 'wardrobe') { if (key === 'frontStyle') return 'wdDoorStyle'; if (key === 'pull') { a.value = {bar: 'bar', edge: 'edge', knob: 'knob', leather: 'leather', none: 'push', ring: 'knob'}[a.value] || 'bar'; return 'wdHandle'; } if (key === 'caseBase') { a.value = a.value === 'legs' ? 'legs' : 'recessed'; return 'wdBase'; } }
  const map = {bed: {width: 'mattressWidth', length: 'mattressLength', height: 'headHeight'}, wardrobe: {width: 'wdWidth', height: 'wdHeight', depth: 'wdDepth'}, dresser: {width: 'drWidth', height: 'drHeight', depth: 'drDepth', rows: 'drRows', columns: 'drColumns', caseBase: 'drBase', caseLayout: 'drLayout', baseHeight: 'caseBaseHeight'}, nightstand: {width: 'nsWidth', depth: 'nsDepth', rows: 'nsRows', caseBase: 'nsBase', caseLayout: 'nsLayout', baseHeight: 'caseBaseHeight'}}[k] || {};
  if (k === 'nightstand' && key === 'height') { if (a.type === 'set') a.value -= env.mattressTop(); return 'nsHeightOffset'; }
  if (k !== 'nightstand' && key === 'caseBase' && a.value === 'wall') a.value = 'recessed';
  void pre;
  return map[key] || key;
}

/** Default environment for headless use: English labels, fresh starts by sample(). The studio passes its own. */
export const headlessEnv = (over = {}) => ({
  L: k => k, part: (g, k) => k, material: a => `${a.slot}.${a.key}=${a.value}`, style: v => v,
  startFamily: (family, kind) => sample({family, kind: FAMILIES[family].kinds[kind] ? kind : FAMILIES[family].defaultKind, style: 'aura', seed: 1}),
  forKind: (d, kind) => sample({family: d.family, style: d.style, kind, seed: d.seed, locks: {materials: d.materials}}),
  selCell: () => ({b: 0, c: 0}), mattressTop: () => 0, ...over});

/** Apply design actions (set, delta, enum, material, style, kind, family, seats, drawers, mattress) to a design.
 *  Returns {design, changed, notes, effects}; 'command' actions come back in effects for the caller to perform. */
export function applyDesignActions(design, actions, env = headlessEnv()) {
  let d = structuredClone(design), changed = false, fam = familyOf(d); const notes = [], effects = [], fx = new Set();
  for (const a of actions) {
    if (a.type === 'command') { effects.push(a); continue; }
    if (a.type === 'family') {
      if (a.value !== d.family && FAMILIES[a.value]) { const k = actions.find(x => x.type === 'kind' && FAMILIES[a.value].kinds[x.value])?.value; d = env.startFamily(a.value, k); fam = familyOf(d); changed = true;
        notes.push(env.L({table: 'famTable', bedroom: 'famBedroom', seating: 'famSeating', storage: 'famStorage', kitchen: 'famKitchen'}[a.value])); }
      continue;
    }
    changed = true;
    let key = a.key;
    if (d.family === 'seating' && key === 'length') key = 'width';
    if (d.family === 'bedroom') key = setKey(d, key, a, actions, env);
    if (a.type === 'drawers' && d.family === 'storage') {
      // "3 drawers": the selected drawer cell, else the first one, else the selected cell becomes drawers.
      const {b, c} = env.selCell(), all = d.params.bays.flatMap((bay, i) => bay.cells.map((cell, j) => ({cell, i, j}))), sel = d.params.bays[b]?.cells[c];
      const target = sel?.type === 'drawers' ? sel : all.find(x => x.cell.type === 'drawers')?.cell || sel;
      if (target) { target.type = 'drawers'; target.n = Math.max(1, Math.min(6, a.value)); notes.push(`${a.value} ${env.L('drawersN')}`); }
      continue;
    }
    if (a.type === 'mattress') { if (d.family === 'bedroom') { d.kind = 'bed'; [d.params.mattressWidth, d.params.mattressLength] = a.value; notes.push(`${env.L('mattress')} ${a.value[0] / 10}×${a.value[1] / 10}`); } continue; }
    if (d.family === 'bedroom' && a.type === 'kind') { if (fam.kinds[a.value]) { d.kind = a.value; notes.push(env.L(a.value)); } else { const owner = Object.values(FAMILIES).find(f => f.kinds[a.value]); if (owner) { d = env.startFamily(owner.id, a.value); fam = familyOf(d); notes.push(env.L(a.value)); } } continue; }
    if (d.family === 'table' && key === 'leaves' && a.value > 0) {
      if (['pedestal', 'drum', 'tripod'].includes(d.params.baseType)) d.params.baseType = 'doublePedestal';
      if (['round', 'boat'].includes(d.params.topShape)) d.params.topShape = 'oval';
    }
    if (a.type === 'set') { d.params[key] = a.value; notes.push(`${env.part('params', key)} ${Math.round(a.value)}`); }
    else if (a.type === 'delta') { const before = d.params[key]; d.params[key] = before + a.value; notes.push(`${env.part('params', key)} ${Math.round(before)} → ${Math.round(before + a.value)}`); }
    else if (a.type === 'enum') {
      // Bed-only and chest-only choices move the design to the right piece first.
      // Bedroom set: the edited piece becomes the one in focus, so the others follow it.
      if (d.family === 'bedroom' && !actions.some(x => x.type === 'kind')) { const owner = PIECE_OF[key]; if (owner && owner !== d.kind && !(owner === 'case' && ['dresser', 'nightstand'].includes(d.kind))) d.kind = owner === 'case' ? 'dresser' : owner; }
      d.params[key] = a.value; notes.push(env.part(d.family === 'storage' ? ({base: 'sBase', legType: 'sLegType'}[key] || key) : d.family === 'table' && key === 'baseType' ? 'tBaseType' : d.family === 'table' && key === 'legType' ? 'legTypeT' : d.family === 'bedroom' && key === 'legType' ? 'bLegType' : ({nsBase: 'caseBase', drBase: 'caseBase', nsLayout: 'caseLayout', drLayout: 'caseLayout'}[key] || key), a.value)); }
    else if (a.type === 'seats') { if (d.family === 'table') { d.params = FAMILIES.table.repair({...seatsToSize(d, a.value), kind: 'dining'}, d.materials); d.kind = 'dining'; notes.push(`${a.value} ${env.L('persons')}`); } }
    else if (a.type === 'style') { d = sample({family: d.family, style: a.value, kind: d.kind, seed: d.seed}); notes.push(env.style(a.value)); }
    else if (a.type === 'kind') {
      if (!fam.kinds[a.value]) { const owner = Object.values(FAMILIES).find(f => f.kinds[a.value]); if (owner) { d = env.startFamily(owner.id, a.value); fam = familyOf(d); notes.push(env.L(a.value)); } continue; }
      if (a.value !== d.kind) { d = env.forKind(d, a.value); notes.push(env.L(a.value)); }
    }
    else if (a.type === 'material') {
      let {slot, key: mk, value} = a;
      if (d.family === 'seating' && slot === 'wood' && mk === 'species' && value !== 'gurgen') { mk = 'stain'; value = SPECIES_TO_STAIN[value] || 'natural'; }
      if (d.family === 'seating' && (slot === 'top' || slot === 'base')) continue;
      if (d.family === 'table' && (slot === 'wood' || slot === 'fabric')) slot = 'top';
      if (['storage', 'kitchen', 'bath'].includes(d.family)) {
        // Case goods: wood words go to the carcass (and to the fronts when they match it); a colour means lacquer.
        if ((d.family === 'kitchen' || d.family === 'bath') && slot === 'top') { const patch = {[mk]: value}; if (mk === 'stone') patch.surface = 'stone'; if (mk === 'species') patch.surface = 'wood'; d.materials.top = {...d.materials.top, ...patch}; notes.push(env.material({slot, key: mk, value})); fx.add('colour'); continue; }
        if (['top', 'base', 'fabric'].includes(slot) || (slot === 'wood' && mk !== 'finish')) slot = 'case';
        if (slot === 'case' || slot === 'front') {
          const same = sameFront(d.materials), patch = {[mk]: value};
          if (mk === 'species' && d.materials[slot].surface === 'lacquer') patch.surface = 'veneer';
          if (mk === 'color') patch.surface = 'lacquer';
          d.materials[slot] = {...d.materials[slot], ...patch}; if (slot === 'case' && same) d.materials.front = {...d.materials.case};
        } else d.materials[slot] = {...d.materials[slot], [mk]: value};
        notes.push(env.material({slot, key: mk, value})); fx.add('colour');
        continue;
      }
      if (d.family === 'bedroom') {
        if (slot === 'top' || slot === 'base') slot = 'case';
        // A wood species applies to the case (unless lacquered) and to the solid parts.
        if (mk === 'species') { d.materials.wood = {...d.materials.wood, species: value}; if (slot === 'wood') slot = 'case'; if (d.materials.case.surface === 'lacquer') d.materials.case.surface = 'veneer'; }
        if (slot === 'case' && mk === 'color') d.materials.case.surface = 'lacquer';
      }
      d.materials[slot] = {...d.materials[slot], [mk]: value};
      if (d.family === 'table' && mk === 'species' && !['wood', 'veneer'].includes(d.materials[slot].surface)) d.materials[slot].surface = 'wood';
      if (d.family === 'table' && mk === 'color' && !['lacquer'].includes(d.materials[slot].surface)) d.materials[slot].surface = 'lacquer';
      notes.push(env.material({slot, key: mk, value}));
      fx.add('colour');
    }
    }
  for (const f of fx) effects.push({type: 'command', name: f});
  return {design: changed ? normalizeDesign(d) : d, changed, notes, effects};
}
