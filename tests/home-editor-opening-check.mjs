import assert from 'node:assert/strict';
import {install} from '../assets/ev/edit.js';
const original={document:globalThis.document,addEventListener:globalThis.addEventListener,localStorage:globalThis.localStorage};
const val=q=>typeof q==='object'?q.value:q;
function setup(scalar){
 const m=value=>scalar?value:{value,unit:'mm'};
 let D={walls:[{id:'W1',from_xy_mm:[0,0],to_xy_mm:[3000,0],thickness:m(120)}],openings:[{id:'O1',wall_id:'W1',kind:'window',width:m(900),height:m(1400),sill_height:m(900),offset_from_wall_start:m(500)}],spaces:[]};
 const hooks={},S={view:'plan',name:'local.json'},stored=new Map();
 globalThis.document={createElement:()=>({}),head:{appendChild(){}},body:{classList:{toggle(){}}}};globalThis.addEventListener=()=>{};
 globalThis.localStorage={setItem:(k,v)=>stored.set(k,v)};
 const ev={S,hooks,get D(){return D;},get walls(){return D.walls.map(w=>({...w,x0:0,y0:0,L:w.to_xy_mm[0],ux:1,uy:0,t:val(w.thickness)}));},
  get ops(){return D.openings.map(o=>({...o,a:val(o.offset_from_wall_start),w:val(o.width)}));},pxMM:()=>1,toPlan:e=>[e.x||0,0],side(){},drawPlan(){},refresh(){},load(d){D=d;}};
 const click=action=>hooks.click({target:{closest:()=>({dataset:{e:action}})}});
 install(ev);click('toggle');
 const select=()=>hooks.down({button:0,target:{closest:s=>s==='[data-op]'?{dataset:{op:'O1'}}:null}});
 select();hooks.up();
 return {ev,hooks,stored,click,select,snapshot:()=>JSON.stringify(D),change:value=>hooks.change({target:{dataset:{f:'ow'},value}})};
}
let failed=0;const run=(name,fn)=>{try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+': '+e.message);}};
try{
 for(const scalar of [false,true]){
  const label=scalar?'scalar':'measured';
  for(const width of ['4000','2981'])run(label+' oversized '+width,()=>{
   const e=setup(scalar),before=e.snapshot(),saved=e.stored.get('aura-ev-taslak');e.change(width);
   assert.equal(e.snapshot(),before,'oversize removed or changed opening');assert.equal(e.stored.get('aura-ev-taslak'),saved);
   assert(e.hooks.panel().includes('data-e="undo" disabled'),'invalid edit changed history');
  });
  run(label+' valid boundary and undo/redo',()=>{
   const e=setup(scalar),before=e.snapshot();assert(e.hooks.panel().includes('data-f="ow" type="number" value="900"'),'wrong displayed opening size');
   e.change('2980');assert.equal(e.ev.D.openings.length,1);assert.equal(val(e.ev.D.openings[0].width),2980);assert.equal(val(e.ev.D.openings[0].offset_from_wall_start),10);
   assert(Number.isFinite(val(e.ev.D.openings[0].offset_from_wall_start)));e.click('undo');assert.equal(e.snapshot(),before);e.click('redo');assert.equal(val(e.ev.D.openings[0].width),2980);
  });
  run(label+' opening drag',()=>{
   const e=setup(scalar);e.select();e.hooks.move({x:700},true);e.hooks.move({x:900},true);e.hooks.up();
   assert.equal(val(e.ev.D.openings[0].offset_from_wall_start),700);assert(Number.isFinite(val(e.ev.D.openings[0].width)));
   e.click('undo');assert.equal(val(e.ev.D.openings[0].offset_from_wall_start),500);
  });
 }
}finally{Object.assign(globalThis,original);}
assert.equal(failed,0,`${failed}/8 opening regressions`);
