// Capture the actual first allocation before running any potentially oversized pixel loop.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {WEAVES,FIBERS,COLORS,HIDES,normalizeMaterials} from '../assets/forma/catalog.js';
import * as rng from '../assets/forma/rng.js';
import {fabricMaps} from '../assets/forma/textile.js';
const source=readFileSync(process.env.TEXTILE_SOURCE||new URL('../assets/forma/textile.js',import.meta.url),'utf8');
const code=source.replace(/^import .*;\r?$/gm,'').replace(/export /g,'');
const stop=new Error('allocation probe stop');let firstLength;
const ctx={WEAVES,FIBERS,COLORS,HIDES,...rng,MOTIF_WEAVE:{},MOTIFS:{},Uint8ClampedArray:class {constructor(n){firstLength=n;throw stop;}}};
vm.createContext(ctx);vm.runInContext(code+'\nthis.maps=fabricMaps;',ctx);
const rows=[];
for(const fiber of ['linen','cotton','wool','chenille'])for(const weave of ['plain','satin'])for(const pattern of ['none','stripe','check','plaid'])for(const density of [1,3,12])for(const scale of [1,3]) {
 const spec=normalizeMaterials({fabric:{fiber,weave,pattern,density,scale}}).fabric;
 try{ctx.maps(spec,{maxPx:720});assert.fail('expected allocation stop');}catch(e){if(e!==stop)throw e;}
 rows.push({spec,size:Math.sqrt(firstLength/4)});
}
const oversized=rows.filter(r=>r.size>720);
console.log(JSON.stringify({allocationCases:rows.length,oversized:oversized.length,largest:Math.max(...rows.map(r=>r.size))}));
assert.equal(oversized.length,0,'valid fabrics exceed requested pixel budget');
const spec=normalizeMaterials({fabric:{fiber:'cotton',weave:'satin',pattern:'plaid',density:1,scale:3}}).fabric;
const before=JSON.stringify(spec);
for(const maxPx of [32,64,127,720]) {
 const a=fabricMaps(spec,{maxPx}),b=fabricMaps(spec,{maxPx});
 assert.equal(a.size,maxPx);assert(Math.abs(a.tileMm-1673.7)<1e-9);
 for(const key of ['albedo','normal','rough']) {
  assert.equal(a[key].length,maxPx*maxPx*4);assert.deepEqual(a[key],b[key]);
  for(let i=3;i<a[key].length;i+=4)assert.equal(a[key][i],255);
 }
 assert(new Set(a.albedo).size>10,'undersampled fabric must retain colour variation');
 assert(new Set(a.normal).size>10,'normal map must retain relief variation');
}
assert.equal(JSON.stringify(spec),before,'rendering mutated material');
console.log('PASS 192 allocation cases;4 actual reduced images, unchanged repeat mm, variation/determinism/alpha/immutability');
