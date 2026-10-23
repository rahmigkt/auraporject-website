import assert from 'node:assert/strict';
import {Hatch,HatchPredefinedPatterns} from '../assets/vendor/dxf/dxf.mjs';
const serialize=(name,angle,scale)=>{const tags=[];new Hatch(null,{name,angle,scale}).pattern({push:(...tag)=>tags.push(tag)},{name,angle,scale});return tags;};
let passed=0;
for(const name of Object.values(HatchPredefinedPatterns).filter(n=>n!=='SOLID')){
 const original=serialize(name,0,1),scaled=serialize(name,0,3);
 const rotated=serialize(name,37,2);assert(rotated.length>3,'actual pattern definition tags');
 assert.deepEqual(serialize(name,0,1),original,`${name}: previous rotated export must not alter the default pattern`);
 assert.deepEqual(serialize(name,0,3),scaled,`${name}: repeated scale result independent of rotated exports`);
 assert.deepEqual(serialize(name,37,2),rotated,`${name}: rotated exports deterministic`);
 passed++;
}
console.log(`PASS ${passed} hatch definitions: default/scaled/rotated serialization independent of prior export order.`);
