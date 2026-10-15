import assert from 'node:assert/strict';
import {buildKitchenStudy,KITCHEN_TYPES,KITCHEN_STYLES} from '../assets/kitchen-studies.js';
import {referenceDrawing} from '../assets/reference-drawing.js';
for(const type of Object.keys(KITCHEN_TYPES))for(const style of Object.keys(KITCHEN_STYLES)){
 const m=buildKitchenStudy(type,style);assert(m.parts.length>40);assert(m.parts.every(p=>p.size.every(v=>Number.isFinite(v)&&v>0)&&p.position.every(Number.isFinite)));
 for(const view of ['front','side','top'])assert(!referenceDrawing(m,view).includes('NaN'));
 if(type!=='island'){assert(m.parts.some(p=>p.role==='sink-bottom'));assert(!m.parts.some(p=>p.role==='cabinet-carcass'));assert(m.parts.filter(p=>p.role==='counter-bridge').length===2);}
 if(type==='island'&&style==='natural')assert.equal(m.parts.filter(p=>p.role==='fluted-back').length,60);
 if(type==='island'&&style==='walnut')assert.equal(m.parts.filter(p=>p.role==='waterfall-end').length,2);
}
assert.throws(()=>buildKitchenStudy('invalid'));console.log('PASS 9 kitchen studies, finite parts, 27 drawings, sink openings, fluting and waterfall ends.');
