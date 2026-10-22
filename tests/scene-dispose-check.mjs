import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../assets/forma/scene.js',import.meta.url),'utf8'),csg=fs.readFileSync(new URL('../assets/forma/csg.js',import.meta.url),'utf8');
const init=src.split('\n').find(s=>s.includes('let raf = 0')),draw=src.slice(src.indexOf('  const draw ='),src.indexOf('  function sketchResolution()'));
const rebuild=src.slice(src.indexOf('  function rebuild()'),src.indexOf('  /** Catalogue photograph'));
const off=src.split('\n').find(s=>s.includes('const offCsg ='));
const start=src.indexOf('    dispose() {'),dispose=src.slice(start,src.indexOf('\n  };',start));
function harness(){const scheduled=new Map(),ready=new Set(),calls={render:0,add:0,dispose:0};let next=0;const noop=()=>{};
 const ctx=vm.createContext({W:null,ready,shooting:false,pendingRebuild:false,compiled:{parts:[{geom:{fn:'cut'}}],meta:{}},room:null,group:null,mats:{dispose:noop},structure:false,sketch:false,dims:null,materials:{},size:[],baseY:0,userMoved:true,focus:null,gizmo:null,camera:{},itemMats:new Map(),roomMats:null,
 requestAnimationFrame:f=>{scheduled.set(++next,f);return next;},cancelAnimationFrame:id=>scheduled.delete(id),place:noop,sketchResolution:noop,renderPass:{},ao:{},disposeEnvironment:noop,composer:{passes:[],render(){calls.render++;},dispose:noop},renderer:{dispose(){calls.dispose++;}},canvas:{remove:noop},ro:{disconnect:noop},scene:{add(){calls.add++;},remove:noop},buildGroup:()=>({}),disposeGroup:noop,dimensionGroup:()=>({}),reattach:noop,cove:{position:{set:noop}},contact:{scale:{set:noop}},sun:{position:{set:noop},shadow:{camera:{updateProjectionMatrix:noop}}},THREE:{Vector3:class{},Box3:class{max={y:1};setFromObject(){return this;}getSize(){return{x:1,y:1,z:1};}}}});
 const on=csg.split('\n').find(s=>s.startsWith('export const onCsgReady')).replace('export ','');vm.runInContext(on+init+draw+rebuild+off+`;globalThis.api={draw,rebuild,${dispose}};`,ctx);return{api:ctx.api,scheduled,ready,calls,tick(){const list=[...scheduled.values()];scheduled.clear();for(const f of list)f();}};
}
const cases={
 'active draw and rebuild remain functional'(h){h.api.draw();h.tick();assert.equal(h.calls.render,1);h.api.rebuild();assert.equal(h.calls.add,1);h.tick();assert.equal(h.calls.render,2);},
 'dispose releases CSG subscription'(h){assert.equal(h.ready.size,1);h.api.dispose();assert.equal(h.ready.size,0);},
 'dispose cancels queued frame'(h){h.api.draw();assert.equal(h.scheduled.size,1);h.api.dispose();h.tick();assert.equal(h.calls.render,0);},
 'draw after disposal stays idle'(h){h.api.dispose();h.api.draw();assert.equal(h.scheduled.size,0);},
 'late rebuild after disposal stays idle'(h){h.api.dispose();h.api.rebuild();assert.equal(h.calls.add,0);assert.equal(h.scheduled.size,0);},
 'already captured CSG callback stays idle'(h){const cb=[...h.ready][0];h.api.dispose();cb();assert.equal(h.calls.add,0);assert.equal(h.scheduled.size,0);},
 'dispose is idempotent'(h){h.api.dispose();h.api.dispose();assert.equal(h.calls.dispose,1);}
};let passed=0;const failures=[];for(const[name,test]of Object.entries(cases)){try{test(harness());passed++;}catch(e){failures.push({name,message:e.message});}}console.log(JSON.stringify({passed,failed:failures.length,failures}));assert.deepEqual(failures,[]);
