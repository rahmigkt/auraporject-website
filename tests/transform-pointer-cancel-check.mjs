import assert from 'node:assert/strict';
import {PerspectiveCamera,Object3D} from '../assets/vendor/three.module.js?v=20261016b';
import {TransformControls} from '../assets/vendor/addons/controls/TransformControls.js';
function fixture(){
 const listeners=new Map(),captures=new Set();let releases=0,ends=0;
 const canvas={style:{},ownerDocument:{pointerLockElement:null},getBoundingClientRect:()=>({left:0,top:0,width:390,height:600}),addEventListener:(n,f)=>{if(!listeners.has(n))listeners.set(n,new Set());listeners.get(n).add(f);},removeEventListener:(n,f)=>listeners.get(n)?.delete(f),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>{assert(captures.delete(id));releases++;},setPointerCapture:id=>captures.add(id)};
 const c=new TransformControls(new PerspectiveCamera(),canvas),parent=new Object3D(),object=new Object3D();parent.add(object);c.attach(object);
 c.addEventListener('dragging-changed',e=>{if(!e.value)ends++;});
 const event=(type,button=-1)=>{for(const f of [...listeners.get(type)||[]])f({type,pointerId:7,pointerType:'touch',button,clientX:120,clientY:250});};
 const begin=()=>{c.enabled=true;c.axis='X';c.dragging=true;canvas.addEventListener('pointermove',c._onPointerMove);};
 return {c,object,canvas,listeners,captures,begin,event,stats:()=>({releases,ends})};
}
let passed=0;
for(const enabled of [true,false]){
 const f=fixture();f.begin();f.c.enabled=enabled;f.object.position.set(42,7,3);f.captures.add(7);
 f.event('pointercancel');assert.equal(f.c.dragging,false);assert.equal(f.c.axis,null);assert.deepEqual(f.object.position.toArray(),[42,7,3]);assert.deepEqual(f.stats(),{releases:1,ends:1});assert(!f.listeners.get('pointermove').has(f.c._onPointerMove));
 f.event('pointercancel');assert.deepEqual(f.stats(),{releases:1,ends:1});f.c.dispose();passed++;
}
{
 const f=fixture();f.event('pointercancel');assert.deepEqual(f.stats(),{releases:0,ends:0});assert.equal(f.c.dragging,false);f.c.dispose();passed++;
}
{
 const f=fixture();f.begin();f.captures.add(7);f.event('pointerup',0);assert.equal(f.c.dragging,false);assert.equal(f.stats().ends,1);assert.equal(f.c.axis,null);f.c.dispose();passed++;
}
{
 const f=fixture();f.begin();f.captures.add(7);f.event('pointerup',2);assert.equal(f.c.dragging,true);assert.equal(f.stats().ends,0);f.event('pointercancel');assert.equal(f.c.dragging,false);f.c.dispose();passed++;
}
{
 const f=fixture();f.c.disconnect();assert.equal(f.listeners.get('pointercancel').size,0);assert.equal(f.listeners.get('pointerup').size,0);assert.equal(f.canvas.style.touchAction,'');f.c.dispose();passed++;
}
{
 const f=fixture();f.c.disconnect();f.c.connect(f.canvas);assert.equal(f.listeners.get('pointercancel').size,1);f.begin();f.event('pointercancel');assert.equal(f.stats().ends,1);f.c.dispose();passed++;
}
console.log(JSON.stringify({passed,scope:'Actual vendor class;mock canvas and synthetic in-progress gesture;no WebGL or real-device claim'}));
