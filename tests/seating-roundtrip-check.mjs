import assert from 'node:assert/strict';
import {normalize,compile,RANGES,ENUMS} from '../assets/forma/sofa.js';
import {normalizeDesign} from '../assets/forma/generate.js';
let passed=0;const failures=[];
const roundtrip=(label,raw)=>{
 const before=JSON.stringify(raw),p=normalize(raw),loaded=normalize(JSON.parse(JSON.stringify(p)));
 try{assert.deepEqual(loaded,p,'parameters changed on JSON reload');assert.deepEqual(normalizeDesign(normalizeDesign({family:'seating',params:raw})),normalizeDesign({family:'seating',params:raw}));assert.equal(JSON.stringify(raw),before);passed++;}
 catch(e){failures.push({label,changes:Object.keys(p).filter(k=>p[k]!==loaded[k]).map(k=>({key:k,before:p[k],after:loaded[k]}))});}
};
roundtrip('defaults',{});
roundtrip('explicit old slope',{armSlope:.15});
for(const [key,[lo,hi,step]] of Object.entries(RANGES))for(const v of [lo,hi,lo+step])roundtrip(`${key}/${v}`,{[key]:v});
for(const [key,values] of Object.entries(ENUMS))for(const v of values)roundtrip(`${key}/${v}`,{[key]:v});
for(let seatHeight=360;seatHeight<=560;seatHeight+=5)for(const backType of ENUMS.backType)roundtrip(`height/${seatHeight}/${backType}`,{seatHeight,height:580,backType});
// Values already on the slope grid remain exactly the requested value.
for(let i=0;i<=20;i++)assert.equal(normalize({armSlope:i*.02}).armSlope,+(i*.02).toFixed(3));
// Compiling the initial and reloaded design must create the same descriptors.
for(const raw of [{},{armType:'slope'},{seatHeight:435,height:580,backType:'tight'}]) {
 const first=compile(raw),next=compile(JSON.parse(JSON.stringify(first.params)));
 try{assert.deepEqual(next,first);passed++;}catch(e){failures.push({label:'compiled '+JSON.stringify(raw),error:'compiled geometry descriptors changed on reload'});}
}
console.log(JSON.stringify({passed,failed:failures.length,examples:failures.slice(0,7)}));
assert.equal(failures.length,0);
