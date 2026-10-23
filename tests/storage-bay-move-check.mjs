import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sample, normalizeDesign, compileDesign} from '../assets/forma/generate.js';
import {familyOf} from '../assets/forma/families.js';
const source = fs.readFileSync(new URL('../assets/forma/studio.js', import.meta.url), 'utf8');
const action = source.slice(source.indexOf('function layoutAction('), source.indexOf('// ---- Bathroom:'));
const withoutIDs = value => JSON.parse(JSON.stringify(value, (k, v) => k === 'id' ? undefined : v));
let checks = 0;
for (const [family, kind, sliding] of [
  ...['wardrobe','nightstand','dresser','vanity','tvunit','bookcase','vitrine','sideboard'].map(k => ['storage', k, false]),
  ['storage','wardrobe',true], ...['basin','column','mirror'].map(k => ['bath',k,false])
]) {
  const design = normalizeDesign({...sample({family, kind, seed: 2}), params: {
    ...sample({family, kind, seed: 2}).params, doorType: sliding ? 'sliding' : 'hinged', mirrorCabinet: 'cabinet',
    bays: [0,1,2].map((i) => ({w: 1 + i * .2, mm: 0, cells: [
      {type: kind === 'vanity' && i === 1 ? 'knee' : 'door', inside: kind === 'wardrobe' ? 'hang' : 'shelves', color: ['sage','navy','sand'][i], h: 2, k: i, lv: 2},
      {type: 'drawers', n: i + 1, h: 1, mm: 120, color: 'petrol'}
    ]}))
  }});
  const before = structuredClone(design), state = {design, sel: {b: 1, c: 1}};
  let commits = 0;
  const context = vm.createContext({state, structuredClone, familyOf, Math,
    selCell: () => state.sel, withParams: patch => ({...state.design, params: {...state.design.params, ...patch}}),
    setDesign(next) { commits++; state.design = normalizeDesign(next); }
  });
  vm.runInContext(action + ';globalThis.edit = layoutAction;', context);
  assert.equal(context.edit({bayop: 'left'}), true, `${family}/${kind}: missing move left`);
  assert.equal(commits, 1); assert.equal(state.sel.b, 0); assert.equal(state.sel.c, 1);
  assert.deepEqual(withoutIDs(state.design.params.bays), withoutIDs([before.params.bays[1],before.params.bays[0],before.params.bays[2]]));
  assert.deepEqual(design, before, 'original design must not mutate');
  assert.equal(context.edit({bayop: 'left'}), false); assert.equal(commits, 1, 'edge must not create history');
  assert.equal(context.edit({bayop: 'right'}), true);
  assert.deepEqual(state.design, before, 'reverse movement restores normalized design exactly');
  assert.equal(context.edit({bayop: 'right'}), true); assert.equal(state.sel.b, 2); assert.equal(state.sel.c, 1);
  assert.equal(context.edit({bayop: 'right'}), false); assert.equal(commits, 3);
  const saved = JSON.parse(JSON.stringify(state.design));
  assert.deepEqual(normalizeDesign(saved), state.design, 'saved layout survives reopening');
  const model = compileDesign(saved);
  assert(model.parts.length > 0);
  assert.deepEqual([saved.params.width,saved.params.height,saved.params.depth], [before.params.width,before.params.height,before.params.depth]);
  assert(model.parts.every(p => p.pos.every(Number.isFinite)), 'finite part positions after move');
  state.design = before; state.sel = {b: 0, c: 0};
  assert.equal(context.edit({bayop: 'unknown'}), false);
  state.design = normalizeDesign({...before, params: {...before.params, bays: [before.params.bays[0]]}});
  assert.equal(context.edit({bayop:'left'}), false); assert.equal(context.edit({bayop:'right'}), false);
  checks++;
}
console.log(`PASS ${checks} storage/bath layouts: move, boundary, nested settings, source immutability, reverse move and JSON reopen.`);
