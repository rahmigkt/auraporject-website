import assert from 'node:assert/strict';
import {MODELS,normalizeDesign,compileDesign,decodeDesign} from '../assets/furniture-model.js';
let cases=0;
for(const [model,m] of Object.entries(MODELS))for(const width of m.limits.width)for(const height of m.limits.height)for(const depth of m.limits.depth)for(const columns of m.limits.columns)for(const rows of m.limits.rows)for(const front of ['open','closed']){
 const out=compileDesign({model,width,height,depth,columns,rows,front});
 for(const part of out.parts){assert(part.size.every(v=>Number.isFinite(v)&&v>0));for(let a=0;a<3;a++){const low=part.position[a]-part.size[a]/2,high=part.position[a]+part.size[a]/2,ext=[out.width,out.height,out.depth][a];assert(low>=(a===1?0:-ext/2)-.002,JSON.stringify({model,part,a,low}));assert(high<=(a===1?ext:ext/2)+.002,JSON.stringify({model,part,a,high}));}}
 const encoded=JSON.stringify(out.state);assert.deepEqual(decodeDesign(encoded),out.state);cases++;
}
assert.equal(decodeDesign('{"version":1,"palette":"linen"}'),null);assert.equal(decodeDesign('{bad'),null);assert.equal(decodeDesign('{"version":2}'),null);
const bad=normalizeDesign({model:'__proto__',wood:'<script>',width:1e8,height:NaN,depth:-1,columns:999});assert.equal(bad.model,'console');assert.equal(bad.wood,'walnut');assert.equal(bad.width,240);assert.equal(bad.height,80);assert.equal(bad.depth,30);
console.log(`PASS: ${cases} boundary configurations, positive geometry, overall bounds, share/JSON round trips and invalid inputs.`);
