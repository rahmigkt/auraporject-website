import assert from 'node:assert/strict';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {defaultsFor} from '../assets/forma/storage.js';
import {FAMILIES} from '../assets/forma/families.js';import {STARTS} from '../assets/forma/starts.js';
import {machiningGeometryFiles,solidVolume} from '../assets/forma/production/machined-geometry.js';
import {buildMesh} from '../assets/forma/build.js';
import {loadCsg,cutMesh,csgReady} from '../assets/forma/csg.js';
const design=normalizeDesign({family:'storage',kind:'wardrobe',style:'japandi',seed:2,params:{...defaultsFor('wardrobe'),hingeSystem:'blum-110-inserta-expando',runnerSystem:'hettich-ka5632-ss-2025',connectorSystem:'rastex15-18-du232t',backConstruction:'module-grooved'}});
const c=compileDesign(design),saved=JSON.stringify(c),{files,manifest:m}=await machiningGeometryFiles(c,design);
assert.equal(JSON.stringify(c),saved,'export preserves source');assert.equal(m.assembly.length,92);assert.equal(m.machined.length,18);assert.equal(m.machined.reduce((s,p)=>s+p.operations,0),197);assert.equal(m.production_approved,false);
const map=new Map(files.map(f=>[f.name,f.data]));let vertices=0;
for(const p of m.assembly){
 const bytes=map.get(p.file),dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),n=dv.getUint32(80,true);assert.equal(bytes.byteLength,84+50*n);assert(n>0);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<n;i++)for(let j=0;j<3;j++){
  let [x,y,z]=[0,1,2].map(k=>dv.getFloat32(84+50*i+12+j*12+k*4,true));assert([x,y,z].every(Number.isFinite));
  const [rx,ry,rz]=p.rotation_rad;
  [x,y]=[x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz)];
  [x,z]=[x*Math.cos(ry)+z*Math.sin(ry),-x*Math.sin(ry)+z*Math.cos(ry)];
  [y,z]=[y*Math.cos(rx)-z*Math.sin(rx),y*Math.sin(rx)+z*Math.cos(rx)];
  [x,y,z].forEach((v,k)=>{const w=v+p.position_mm[k];min[k]=Math.min(min[k],w);max[k]=Math.max(max[k],w);});vertices++;
 }
 for(let k=0;k<3;k++){assert(Math.abs(min[k]-p.source_world_envelope.min[k])<.002,p.id+' min');assert(Math.abs(max[k]-p.source_world_envelope.max[k])<.002,p.id+' max');}
}
await loadCsg();assert(csgReady());const before=buildMesh({geom:{fn:'box',w:100,h:100,d:18}}),after=cutMesh(before,[{type:'hole',at:[0,0,9],axis:2,sign:1,depth:10,dia:10}]);
const removed=solidVolume(before)-solidVolume(after),expected=Math.PI*25*10;assert(Math.abs(removed-expected)/expected<.01,'actual bore removes analytic cylinder volume within tessellation tolerance');
await assert.rejects(()=>machiningGeometryFiles({parts:[{id:'unsupported',geom:{fn:'cut',inner:{fn:'box',w:100,h:100,d:18}},pos:[0,0,0]}]},design));
// A real solid-case start needs an overlay outside this zero-height-plate recipe.
// Merely changing params.board would be normalized back to MDF by its material slot.
const start=(FAMILIES.storage.starts||STARTS.storage).wardrobe.find(e=>e.style==='wabi_sabi'&&e.seed===1);
const incompatible=normalizeDesign({family:'storage',kind:'wardrobe',style:start.style,seed:start.seed,params:{...start.p,hingeSystem:'blum-110-inserta-expando'},materials:start.m});
await assert.rejects(()=>machiningGeometryFiles(compileDesign(incompatible),incompatible),/menteşe/,'unresolved selected hinge cannot silently export an undrilled success');
console.log(JSON.stringify({pass:true,parts:m.assembly.length,machined_parts:m.machined.length,operations:197,vertices,analytic_bore_removed_mm3:removed,scope:'Independent binary STL parser/transform and envelope roundtrip, not full physical assembly or complete joinery'}));

