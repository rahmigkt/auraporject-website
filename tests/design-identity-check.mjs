import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {FAMILIES,familyOf} from '../assets/forma/families.js';
import {normalizeDesign,sample,similar} from '../assets/forma/generate.js';
const controls=[];let valid=0;
for(const [family,fam] of Object.entries(FAMILIES))for(const kind of Object.keys(fam.kinds))for(const style of Object.keys(fam.byId)) {
 const d=normalizeDesign({family,kind,style,seed:7});assert.equal(d.family,family);assert.equal(d.kind,kind);assert.equal(d.style,style);
 const again=normalizeDesign(d);for(const key of ['family','kind','style'])assert.equal(again[key],d[key],'catalogue identity changed on reload');
 const s=sample({family,kind,style,seed:7});assert.deepEqual(sample({family,kind,style,seed:7}),s,'sampling must be deterministic');
 controls.push({d,s});valid++;
}
if(process.env.DESIGN_CONTROL_FILE)writeFileSync(process.env.DESIGN_CONTROL_FILE,JSON.stringify(controls));
let passed=0;const failures=[];
const check=(label,fn)=>{try{fn();passed++;}catch(e){failures.push({label,error:e.message.slice(0,250)});}};
for(const bad of ['constructor','__proto__','toString']) {
 check(`familyOf/${bad}`,()=>assert.equal(familyOf({family:bad}),FAMILIES.seating));
 check(`normalize-family/${bad}`,()=>assert.equal(normalizeDesign({family:bad}).family,'seating'));
 check(`sample-family/${bad}`,()=>assert.equal(sample({family:bad}).family,'seating'));
 for(const [family,fam] of Object.entries(FAMILIES))for(const field of ['kind','style'])for(const fn of [normalizeDesign,sample]) {
  check(`${fn.name}/${family}/${field}/${bad}`,()=>{
   const result=fn({family,[field]:bad,seed:7}),allowed=field==='kind'?fam.kinds:fam.byId;
   assert(Object.hasOwn(allowed,result[field]),'non-catalogue identity escaped validation');
  });
 }
}
for(const input of [null,[],0,'bad'])check(`non-object/${JSON.stringify(input)}`,()=>assert.deepEqual(normalizeDesign(input),normalizeDesign({})));
for(const kind of ['wardrobe','dresser','nightstand'])assert.equal(normalizeDesign({family:'bedroom',kind}).kind,kind,'legacy bedroom migration changed');
for(const bad of ['constructor','__proto__','toString']) {
 assert.equal(normalizeDesign({family:'bedroom',kind:bad}).kind,'wardrobe');
 for(const family of Object.keys(FAMILIES)) {
  const d=sample({family,seed:7});d.style=bad;
  const near=similar(d,{count:2});assert.equal(near.length,2);
  assert(near.every(n=>Object.hasOwn(FAMILIES[family].byId,n.style)));
 }
}
console.log(JSON.stringify({validConfigurations:valid,invalidPassed:passed,invalidFailed:failures.length,examples:failures.slice(0,4)}));
assert.equal(failures.length,0);
