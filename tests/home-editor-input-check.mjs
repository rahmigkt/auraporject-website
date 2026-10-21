// Real editor hooks with local EV data and a minimal DOM; no browser, GPU or network.
import assert from 'node:assert/strict';
const {install}=await import(process.env.EDITOR_MODULE||'../assets/ev/edit.js');
const original={document:globalThis.document,addEventListener:globalThis.addEventListener,localStorage:globalThis.localStorage};
const measure=value=>({value,unit:'mm'});
function setup(type='wall'){
 let D={walls:[{id:'W1',from_xy_mm:[0,0],to_xy_mm:[3000,0],thickness:measure(120)}],openings:[{id:'O1',wall_id:'W1',kind:'window',width:measure(900),height:measure(1400),sill_height:measure(900),offset_from_wall_start:measure(500)}],spaces:[]};
 const stored=new Map(),hooks={},S={view:'plan',name:'local.json'};
 globalThis.document={createElement:()=>({}),head:{appendChild(){}},body:{classList:{toggle(){}}}};
 globalThis.addEventListener=()=>{};globalThis.localStorage={setItem:(k,v)=>stored.set(k,v)};
 const ev={S,hooks,get D(){return D;},get walls(){return D.walls.map(w=>({...w,x0:w.from_xy_mm[0],y0:w.from_xy_mm[1],L:Math.hypot(w.to_xy_mm[0]-w.from_xy_mm[0],w.to_xy_mm[1]-w.from_xy_mm[1]),ux:1,uy:0,t:w.thickness.value}));},
  get ops(){return D.openings.map(o=>({...o,a:o.offset_from_wall_start.value,w:o.width.value}));},
  pxMM:()=>1,toPlan:()=>[0,0],side(){},drawPlan(){},refresh(){},load(d){D=d;}};
 install(ev);const click=action=>hooks.click({target:{closest:()=>({dataset:{e:action}})}});
 click('toggle');hooks.down({button:0,target:{closest:selector=>selector===(type==='wall'?'[data-wall]':'[data-op]')?{dataset:type==='wall'?{wall:'W1'}:{op:'O1'}}:null}});
 hooks.up(); // Finish the selection gesture; an unmoved opening drag has no undo entry.
 return {ev,stored,click,change:(f,value)=>hooks.change({target:{dataset:{f},value}}),snapshot:()=>JSON.stringify(D),canUndo:()=>!hooks.panel().includes('data-e="undo" disabled')};
}
const cases=[];
for(const value of ['', 'not-a-number', 'Infinity', '-1', '0', '99'])cases.push([`invalid wall length ${JSON.stringify(value)}`,()=>{
 const e=setup(),before=e.snapshot(),saved=e.stored.get('aura-ev-taslak');e.change('len',value);
 assert.equal(e.snapshot(),before,'invalid input mutated plan');assert.equal(e.stored.get('aura-ev-taslak'),saved,'invalid input saved draft');assert.equal(e.canUndo(),false,'invalid input polluted undo');
}]);
for(const [key,value,type]of [['thick','49','wall'],['thick','601','wall'],['ow','399','op'],['oh','299','op'],['os','-1','op'],['oa','-1','op'],['wallT','','wall']])cases.push([`invalid ${key} ${value}`,()=>{
 const e=setup(type),before=e.snapshot();e.change(key,value);assert.equal(e.snapshot(),before);assert.equal(e.canUndo(),false);
 if(key==='wallT'){e.ev.hooks.click({target:{closest:()=>({dataset:{tool:'wall'}})}});assert(e.ev.hooks.panel().includes('<option selected>120</option>'));}
}]);
cases.push(['valid wall edit saves and supports undo/redo',()=>{
 const e=setup(),before=e.snapshot();e.change('len','3200');assert.equal(e.ev.D.walls[0].to_xy_mm[0],3200);assert(e.canUndo());
 e.click('undo');assert.equal(e.snapshot(),before);e.click('redo');assert.equal(e.ev.D.walls[0].to_xy_mm[0],3200);
 assert.equal(JSON.parse(e.stored.get('aura-ev-taslak')).D.walls[0].to_xy_mm[0],3200);
}]);
cases.push(['valid opening edit and zero offset remain supported',()=>{
 const e=setup('op');e.change('ow','1000');assert.equal(e.ev.D.openings[0].width.value,1000);
 e.change('oa','0');assert.equal(e.ev.D.openings[0].offset_from_wall_start.value,10); // existing edge clearance
}]);
let failed=0;
try{for(const [name,run]of cases)try{run();console.log('PASS '+name);}catch(error){failed++;console.error('FAIL '+name+': '+error.message);}}
finally{Object.assign(globalThis,original);}
assert.equal(failed,0,`${failed}/${cases.length} editor regressions`);
