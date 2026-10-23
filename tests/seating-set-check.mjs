import assert from 'node:assert/strict';
import {sample,normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {footprint} from '../assets/forma/room.js';
import {SET_KINDS,createSeatingSet,setCounts,saveSeatingSet,seatingSetPlan} from '../assets/forma/seating-set.js';
import {dimensionProjectFiles} from '../assets/forma/dimension-package.js';
let cases=0;
for(const kind of SET_KINDS)for(const seed of [1,2,7,99]){
 const source=sample({family:'seating',kind,seed}),before=structuredClone(source);
 const entries=createSeatingSet(source,{sofa:2,loveseat:1,armchair:3});
 assert.deepEqual(source,before);
 for(const [i,e]of entries.entries()){
  assert.equal(e.design.params.seatCount,3-i);assert.equal(e.design.kind,e.kind);
  assert.deepEqual(e.design.materials,source.materials);assert.equal(e.design.style,source.style);
  for(const key of ['armType','backType','legType','depth','seatHeight'])assert.equal(e.design.params[key],source.params[key]);
 }
 const prepared=entries.map(e=>({...e,fp:footprint(compileDesign(e.design))}));
 for(const layout of [0,1]){
  const plan=seatingSetPlan(prepared,layout);assert.equal(plan.total,6);assert.equal(plan.shown,6);
  const boxes=plan.placed.map(p=>{const c=Math.cos(p.rot),s=Math.sin(p.rot),points=[[p.fp.x0,p.fp.z0],[p.fp.x0,p.fp.z1],[p.fp.x1,p.fp.z0],[p.fp.x1,p.fp.z1]].map(([x,z])=>[p.x+x*c+z*s,p.z-x*s+z*c]);return {x0:Math.min(...points.map(p=>p[0])),x1:Math.max(...points.map(p=>p[0])),z0:Math.min(...points.map(p=>p[1])),z1:Math.max(...points.map(p=>p[1]))};});
  for(const b of boxes){assert(b.x0>=-plan.W/2 && b.x1<=plan.W/2);assert(b.z0>=-plan.D/2 && b.z1<=plan.D/2);}
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(a.x1<=b.x0||b.x1<=a.x0||a.z1<=b.z0||b.z1<=a.z0,'no product overlap');}
 }
 cases++;
}
for(const v of [-1,1.5,1000,NaN,Infinity,'',true,{},' '])assert.throws(()=>setCounts({sofa:v}));
const source=sample({family:'seating',kind:'sofa',seed:2}),entries=createSeatingSet(source,{sofa:2,loveseat:1,armchair:3});
const original={items:[{id:'U1',qty:1,design:sample({family:'table',seed:1})}]},copy=structuredClone(original);
const saved=saveSeatingSet(original,entries,'demo');assert.deepEqual(original,copy);assert.equal(saved.items.length,4);
const updated=saveSeatingSet(JSON.parse(JSON.stringify(saved)),createSeatingSet(source,{sofa:1,armchair:2}),'demo');assert.equal(updated.items.length,3);assert.deepEqual(updated.items[0],original.items[0]);assert.equal(new Set(updated.items.map(i=>i.id)).size,3);
const measured=JSON.parse(dimensionProjectFiles(saved.items,compileDesign)[0].data);assert.deepEqual(measured.items.map(i=>i.quantity),[1,2,1,3]);assert(measured.items.every(i=>i.dimensions));
assert.equal(seatingSetPlan([]).shown,0);
const big=seatingSetPlan(entries.map(e=>({...e,qty:999,fp:footprint(compileDesign(e.design))})));assert.equal(big.total,2997);assert.equal(big.shown,12);assert.equal(new Set(big.placed.map(p=>p.kind)).size,3);
assert.throws(()=>createSeatingSet(sample({family:'table'}),{}));
console.log(JSON.stringify({design_cases:cases,counts_project_export_layout_checks:'PASS'}));
