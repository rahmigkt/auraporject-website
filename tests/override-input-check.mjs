import assert from 'node:assert/strict';
import {normalizeOverrides,applyOverrides} from '../assets/forma/overrides.js';
import {normalizeDesign} from '../assets/forma/generate.js';
const invalid=[
 {tool:'silhouette',id:'top',points:[[0,0],null,[1,1]]},
 {tool:'silhouette',id:'top',points:[[0,0],42,[1,1]]},
 {tool:'silhouette',id:'top',points:[[0,0],[],[1,1]]},
 {tool:'profile',role:'leg',points:[null,[1,10]]},
 {tool:'profile',role:'leg',points:[[0,10],'bad']},
 {tool:'add',id:'new',shape:'box',size:{w:100,h:20,d:100}},
 {tool:'add',id:'new',shape:'box',size:'100,20,100'}
];
let failed=0;
for(const [i,value]of invalid.entries())try{
 assert.deepEqual(normalizeOverrides([value]),[],'malformed shape accepted');
 assert.doesNotThrow(()=>normalizeDesign({overrides:[value]}));console.log('PASS reject malformed override '+i);
}catch(e){failed++;console.error('FAIL malformed override '+i+': '+e.message);}
try{
 const valid=[{tool:'silhouette',id:'top',symmetric:false,points:[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]]},{tool:'profile',role:'leg',points:[[0,10],[1,8]]}];
 assert.deepEqual(normalizeOverrides(valid),valid);
 assert.deepEqual(normalizeOverrides(normalizeOverrides(valid)),valid);
 // Defaults remain supported when the added-part size was omitted.
 assert.deepEqual(normalizeOverrides([{tool:'add',id:'new',shape:'box'}])[0].size,[400,40,400]);
 const compiled={parts:[{id:'top',role:'top',geom:{fn:'slab',outline:[[-50,-50],[50,-50],[50,50],[-50,50]],t:20},pos:[0,0,0],rot:[0,0,0]}],meta:{}};
 const before=JSON.stringify(compiled),out=applyOverrides(compiled,[...invalid,{tool:'transform',id:'top',move:[10,0,0]}]);
 assert.equal(out.parts[0].pos[0],10);assert.equal(JSON.stringify(compiled),before);
 console.log('PASS valid shapes/idempotence/default size/mixed valid edit/input preservation');
}catch(e){failed++;console.error('FAIL valid controls: '+e.message);}
assert.equal(failed,0,`${failed} override input regressions`);
