import assert from 'node:assert/strict';
import * as C from '../assets/forma/catalog.js';
import {draft} from '../assets/forma/textile.js';
const cases=[
 ['normalizeMaterials',{fabric:{fiber:'FIBERS',weave:'WEAVES',color:'COLORS',color2:'COLORS',pattern:'PATTERNS'},wood:{species:'WOODS',stain:'STAINS',finish:'FINISHES'},metal:{finish:'METALS'}}],
 ['normalizeTableMaterials',{top:{species:'WOODS',stain:'STAINS',finish:'FINISHES',stone:'STONES',glass:'GLASS',color:'COLORS'},base:{species:'WOODS',stain:'STAINS',finish:'FINISHES',metal:'METALS',color:'COLORS'},hardware:{metal:'METALS'}}],
 ['normalizeBedroomMaterials',{case:{species:'WOODS',stain:'STAINS',finish:'FINISHES',color:'COLORS'}}],
 ['normalizeStorageMaterials',{case:{species:'WOODS',stain:'STAINS',finish:'FINISHES',color:'COLORS'},front:{species:'WOODS',stain:'STAINS',finish:'FINISHES',color:'COLORS'},wood:{species:'WOODS',stain:'STAINS',finish:'FINISHES'},metal:{finish:'METALS'},glass:{glass:'GLASS'}}],
 ['normalizeKitchenMaterials',{top:{stone:'STONES',species:'WOODS',stain:'STAINS',finish:'FINISHES',color:'COLORS'}}],
 ['normalizeRoomMaterials',{floor:{species:'WOODS',stain:'STAINS',finish:'FINISHES',stone:'STONES'}}]
];
let invalid=0,valid=0;const failures=[];
for(const [fn,slots] of cases) {
 for(const bad of ['constructor','__proto__','toString'])for(const [slot,fields] of Object.entries(slots))for(const [key,dict] of Object.entries(fields)) {
  const input={[slot]:{[key]:bad}},before=JSON.stringify(input);
  try{const out=C[fn](input);assert.equal(typeof out[slot][key],'string');assert(Object.hasOwn(C[dict],out[slot][key]),`${fn}/${slot}.${key} accepted ${bad}`);assert.equal(JSON.stringify(input),before);}
  catch(e){failures.push(e.message);}invalid++;
 }
 for(const [slot,fields] of Object.entries(slots))for(const [key,dict] of Object.entries(fields))for(const value of Object.keys(C[dict])) {
  // Existing product rules intentionally restrict gürgen in case goods and hides/pattern combinations.
  if(value==='gurgen'&&fn==='normalizeStorageMaterials'&&['case','front'].includes(slot))continue;
  const out=C[fn]({[slot]:{[key]:value}});assert.equal(out[slot][key],value,`${fn} altered valid ${slot}.${key}`);valid++;
 }
}
for(const color of ['constructor','__proto__','toString']) {try{assert.equal(C.normalizeMaterials({welt:{color}}).welt.color,null,'invalid welt must be absent');}catch(e){failures.push(e.message);}invalid++;}
for(const bad of ['constructor','__proto__','toString']) {
 const f=C.normalizeMaterials({fabric:{weave:bad}}).fabric;
 draft(f.weave,8).forEach(row=>row.forEach(up=>assert.equal(typeof up,'boolean')));
}
for(const pattern of ['floral','leaf','damask'])assert.equal(C.normalizeMaterials({fabric:{pattern}}).fabric.pattern,'trellis','legacy pattern alias changed');
console.log(JSON.stringify({invalidChecks:invalid,validChecks:valid,failures:failures.length,examples:failures.slice(0,4)}));
assert.equal(failures.length,0);
