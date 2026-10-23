import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../assets/vendor/three.module.js';
import * as framing from '../assets/camera-framing.js';
const source=fs.readFileSync(new URL('../assets/forma/scene.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('  function place() {'),source.indexOf('  const resize ='));
let passed=0;
for(const [W,H,D] of [[1.8,.75,.9],[6,2.4,.6],[.5,.52,.4],[2.2,.9,1]])for(const aspect of [390/354,390/620,1440/760])for(const yaw of [.62,1.5,-.8])for(const pitch of [.2,1.1]) {
 const persp=new THREE.PerspectiveCamera(30,aspect,.05,60),ortho=new THREE.OrthographicCamera();
 const ctx=vm.createContext({THREE,Math,host:{getBoundingClientRect:()=>({width:aspect*354,height:354})},size:[W,H,D],baseY:0,focus:null,view:'angle',persp,ortho,yaw,pitch,zoom:1,shooting:false,
  frameBounds:{min:[-W/2,0,-D/2],max:[W/2,H,D/2]},boxFitDistance:framing.boxFitDistance});
 vm.runInContext(code+';place();',ctx);persp.updateMatrixWorld();
 for(const x of [-W/2,W/2])for(const y of [0,H])for(const z of [-D/2,D/2]) {
  const p=new THREE.Vector3(x,y,z).project(persp);
  assert(Math.abs(p.x)<=1+1e-8 && Math.abs(p.y)<=1+1e-8 && p.z>=-1 && p.z<=1,`clipped aspect${aspect}: ${p.toArray()}`);
 }
 passed++;
}
// The interactive safeguard must not alter authored photographic composition or explicit zoom.
const make=(shooting,zoom)=>{const persp=new THREE.PerspectiveCamera(30,1,.05,60),ctx=vm.createContext({THREE,Math,host:{getBoundingClientRect:()=>({width:390,height:354})},size:[1.8,.75,.9],baseY:0,focus:null,view:'angle',persp,ortho:new THREE.OrthographicCamera(),yaw:.62,pitch:.2,zoom,shooting,frameBounds:{min:[-.9,0,-.45],max:[.9,.75,.45]},boxFitDistance:framing.boxFitDistance});vm.runInContext(code+';place();',ctx);return persp.position.distanceTo(new THREE.Vector3(0,.75*.45,0));};
assert(Math.abs(make(false,1)/make(false,2)-2)<1e-8);assert(make(true,1)<make(false,1));
console.log(`PASS ${passed} projected model bounds at mobile/desktop aspects and orbit angles; explicit zoom and photo composition retained.`);
