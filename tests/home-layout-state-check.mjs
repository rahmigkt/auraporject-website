import assert from 'node:assert/strict';
import {applyRoomLayout,placedItems} from '../assets/ev/layout-state.js';
import {compileItem,footprint} from '../assets/ev/items.js';
import {solveRoom} from '../assets/ev/yerlesim.js';
import {buildMesh} from '../assets/forma/build.js';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
const room={id:'R1',boundary_xy_mm:[[0,0],[4000,0],[4000,4000],[0,4000]]};
const make=(layout='U')=>({id:'M1',name:'Meclis',space_id:'R1',design:{kind:'majlis',params:{depth:800,layout}},size:{w:0,d:800,h:450}});
const other={id:'outside',space_id:'R2',design:{kind:'desk'},pos_xy_mm:[10,20],rot_deg:0};
for(const layout of ['U','L']){
 const item=make(layout),items=[item,other],before=JSON.stringify(items);
 const result=solveRoom(room,[item],{walls:[],ops:[]},{count:2,beam:2});assert(result.ok);
 const positions=result.alternatives[0].placements;
 assert(positions.length>=2);assert(positions.every(p=>p.source_id==='M1'));
 const next=applyRoomLayout(items,positions,'R1');assert.equal(JSON.stringify(items),before,'input mutated');
 assert.equal(next.length,2);assert.equal(next[0].id,'M1');assert.equal(next[1],other);
 const visible=placedItems(next).filter(i=>i.space_id==='R1');assert.equal(visible.length,positions.length);
 for(const part of visible){
  const {compiled,size}=compileItem(part);assert.deepEqual(size,part.size_mm);
  assert.deepEqual(compiled.parts[0].geom,{fn:'box',w:size.w,h:size.h,d:size.d});
  const poly=footprint(part);assert(Math.abs(Math.hypot(poly[1][0]-poly[0][0],poly[1][1]-poly[0][1])-size.w)<1e-6);
  const mesh=buildMesh(compiled.parts[0]);assert(mesh.positions.length>0);assert([...mesh.positions].every(Number.isFinite));
 }
 const alternative=applyRoomLayout(next,result.alternatives.at(-1).placements,'R1');
 assert.equal(alternative[0].layout_segments.length,result.alternatives.at(-1).placements.length,'alternatives appended old segments');
 assert.deepEqual(JSON.parse(JSON.stringify(alternative)),alternative,'JSON roundtrip');
 assert(solveRoom(room,[alternative[0]],{walls:[],ops:[]},{count:1,beam:2}).ok,'repeat solve lost parent request');
 console.log('PASS '+layout+' parent, segments, true dimensions, mesh, alternative replacement, re-solve');
}
const item=make(),valid=solveRoom(room,[item],{walls:[],ops:[]},{count:1,beam:2}).alternatives[0].placements;
for(const [name,mutate]of [
 ['unknown parent',p=>p[0].source_id='missing'],['duplicate segment',p=>p.push({...p[0]})],
 ['invalid dimension',p=>p[0].size_mm.w=NaN],['missing group',p=>p.splice(0)],
 ['invalid coordinate',p=>p[0].pos_xy_mm=[Infinity,0]],['ordinary ID mismatch',p=>p.push({id:'unknown',pos_xy_mm:[0,0],rot_deg:0})]
]){
 const items=[item,other],snapshot=JSON.stringify(items),p=structuredClone(valid);mutate(p);
 assert.throws(()=>applyRoomLayout(items,p,'R1'));assert.equal(JSON.stringify(items),snapshot,'partial write: '+name);console.log('PASS atomic rejection '+name);
}
const regular={id:'desk',space_id:'R1',design:{kind:'desk'},pos_xy_mm:[1,2],rot_deg:0};
const result=applyRoomLayout([regular,other],[{id:'desk',pos_xy_mm:[100,200],rot_deg:90}],'R1');
assert.deepEqual(result[0].pos_xy_mm,[100,200]);assert.equal(result[0].rot_deg,90);assert.equal(result[1],other);
const snapshot=JSON.stringify(regular);
assert.throws(()=>applyRoomLayout([regular],[{id:'desk',pos_xy_mm:[100,200],rot_deg:90},{id:'unknown',pos_xy_mm:[1,2],rot_deg:0}],'R1'));
assert.equal(JSON.stringify(regular),snapshot,'later invalid placement partially changed earlier item');
const actualApply=readFileSync('assets/ev/plan.js','utf8').match(/^  if \(LAY\.res\?\.ok\) .*$/m)?.[0];
const D={items:[item,other]},LAY={room:'R1',res:{ok:true,alternatives:[{placements:valid}]},pick:0};
assert(actualApply);runInNewContext(actualApply,{D,LAY,applyRoomLayout});
assert.equal(D.items[0].layout_segments.length,valid.length,'actual UI did not apply solved segments');
assert.deepEqual(placedItems([item]),[],'unplaced majlis must not masquerade as a sofa');
const ordinary=normalizeDesign({family:'seating',kind:'sofa'});
assert.deepEqual(compileItem({design:ordinary}).compiled,compileDesign(ordinary),'ordinary compilation changed');
const changed=structuredClone(placedItems(D.items)[0]);changed.size_mm.w-=100;
assert.equal(compileItem(changed).size.w,changed.size_mm.w,'dimension change reused old mesh cache');
console.log('PASS ordinary placement and unsolved majlis handling');
