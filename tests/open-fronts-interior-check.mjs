import assert from 'node:assert/strict';
import {sample,normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {defaultsFor} from '../assets/forma/storage.js';
const insideRoles=new Set(['shelf-adj','shelf-pin','rail','rail-cup','spacer','inner-front','box-side','box-end','box-bottom','runner']);
let cases=0;
for(const inside of ['hang','shelves','hangDrawers','double','empty','glassShelves'])for(const type of ['door','open']){
 const d=normalizeDesign({...sample({family:'storage',kind:'wardrobe',seed:2}),params:{...defaultsFor('wardrobe'),width:900,bays:[{w:1,cells:[{type,inside,k:3}]}]}}),source=structuredClone(d);
 const closed=compileDesign(d),opened=compileDesign(d,{openFronts:true}),interior=opened.parts.filter(p=>insideRoles.has(p.role));
 assert.deepEqual(d,source);assert.deepEqual(opened.meta,closed.meta);
 for(const p of interior){assert.equal(!!p.internal,false,'interior visible when doors open: '+p.id);const prev=closed.parts.find(q=>q.id===p.id);assert(prev);assert.deepEqual({...p,internal:undefined},{...prev,internal:undefined},'interior geometry and metadata retained');}
 if(type==='door')assert(closed.parts.filter(p=>insideRoles.has(p.role)&&!['shelf-pin'].includes(p.role)).every(p=>p.internal));
 assert.deepEqual(compileDesign(d),closed,'closed repeat does not retain opened flags');cases++;
}
const sliding=normalizeDesign({...sample({family:'storage',kind:'wardrobe',seed:2}),params:{...defaultsFor('wardrobe'),doorType:'sliding'}});
const a=compileDesign(sliding),b=compileDesign(sliding,{openFronts:true});assert.deepEqual(b,a,'unsupported sliding opening does not reveal hidden parts');
console.log(JSON.stringify({hinged_open_interior_cases:cases,sliding_negative:1,status:'PASS'}));
