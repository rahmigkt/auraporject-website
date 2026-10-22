import assert from 'node:assert/strict';
import {sanitizeActions,vocabulary} from '../assets/forma/ai.js';
const v=vocabulary(),tests=[];
for(const key of ['constructor','__proto__','toString','hasOwnProperty']){
 for(const type of ['set','delta','enum'])tests.push([`${type} rejects inherited key ${key}`,()=>assert.deepEqual(sanitizeActions([{type,key,value:type==='enum'?'x':3}],v),[])]);
 tests.push([`material rejects inherited slot ${key}`,()=>assert.deepEqual(sanitizeActions([{type:'material',slot:key,key:'constructor',value:'x'}],v),[])]);
 tests.push([`material rejects inherited field ${key}`,()=>assert.deepEqual(sanitizeActions([{type:'material',slot:'fabric',key,value:'x'}],v),[])]);
}
tests.push(['valid actions retain their values and order',()=>{
 const [key,options]=Object.entries(v.enums)[0], [slot,fields]=Object.entries(v.materials)[0], [material,values]=Object.entries(fields)[0];
 const list=[{type:'set',key:'width',value:1800},{type:'delta',key:'width',value:20},{type:'enum',key,value:options[0]},{type:'style',value:v.styles[0]},{type:'kind',value:v.kinds[0]},{type:'material',slot,key:material,value:values[0]}];
 assert.deepEqual(sanitizeActions(list,v),list);
}]);
tests.push(['malformed key objects are ignored without coercion',()=>{
 const key={toString:null};assert.deepEqual(sanitizeActions([{type:'set',key,value:3},{type:'enum',key,value:'x'},{type:'material',slot:key,key:'fiber',value:'x'},{type:'material',slot:'fabric',key,value:'x'}],v),[]);
}]);
tests.push(['unknown commands do not hide a later valid edit',()=>assert.deepEqual(sanitizeActions([{type:'enum',key:'constructor',value:'x'},{type:'set',key:'width',value:1700}],v),[{type:'set',key:'width',value:1700}])]);
let failed=0;for(const [name,run]of tests){try{run();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
assert.equal(failed,0,`${failed} AI sanitizer regressions`);
