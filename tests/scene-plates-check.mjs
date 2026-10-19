import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../assets/vendor/three.module.js?v=20261016b';
import {roomSize,defaultTexture,renderPlate} from '../assets/forma/scene-plates.js';
const root=new URL('../knowledge/atmosfer/sahneler/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root)));
assert.deepEqual(manifest.sizesProduced,['medium']);assert.equal(manifest.rooms.length,30);
const keys=new Set();let bytes=0;
for(const row of manifest.rooms){
 assert(!keys.has(row.id));keys.add(row.id);assert.equal(row.size,'medium');assert.equal(row.roomMetres[1],2.8);
 for(const name of [row.environment,row.id+'.json',...Object.values(row.cameras).map(c=>c.plate)]){const b=fs.readFileSync(new URL(name,root));bytes+=b.length;assert(b.length>200);}
 assert(Math.abs(row.environmentRotationY-Math.PI/2)<1e-10);
 for(const [name,c] of Object.entries(row.cameras)){assert.equal(c.lensMM,name==='A'?50:70);assert.equal(c.width,2400);assert.equal(c.position[1],c.target[1]);assert(Math.abs(Math.hypot(...c.shadowDirection)-1)<1e-6);}
}
const expected=['seating','table','storage','kitchen','bath'].flatMap(f=>['KIREC','TAS','TOPRAK'].flatMap(t=>['SABAH','AKSAM'].map(l=>`${f}-medium-${t}-${l}`)));assert.deepEqual([...keys].sort(),expected.sort());
assert.equal(JSON.parse(fs.readFileSync(new URL('environment-axis-check.json',root))).passed,true);
assert.equal(JSON.parse(fs.readFileSync(new URL('render-source-check.json',root))).generatorSHA256,manifest.generatorSHA256);
assert(bytes<=120e6);assert.equal(roomSize(900),'small');assert.equal(roomSize(901),'medium');assert.equal(roomSize(2000),'medium');assert.equal(roomSize(2001),'large');
assert.equal(defaultTexture('wabi_sabi'),'TOPRAK');assert.equal(defaultTexture('bauhaus'),'TAS');assert.equal(defaultTexture('japandi'),'KIREC');
const originalFetch=globalThis.fetch;let requests=0;globalThis.fetch=async()=>{requests++;throw Error('Unexpected asset request');};
try{
 for(const width of [900,2001])await assert.rejects(renderPlate({compiled:{meta:{overall:{width}}},materials:{},family:'seating'}),/onaylanmadı/);
 const controller=new AbortController();controller.abort();await assert.rejects(renderPlate({compiled:{meta:{overall:{width:1700}}},materials:{},family:'seating',signal:controller.signal}),{name:'AbortError'});
 assert.equal(requests,0,'Unapproved rooms and pre-cancelled jobs must load no scene assets');
}finally{globalThis.fetch=originalFetch;}
const calibration=JSON.parse(fs.readFileSync(new URL('camera-calibration.json',root)));assert.equal(calibration.rows.length,60);let maxError=0;
for(const row of calibration.rows){const room=manifest.rooms.find(r=>r.id===row.id),c=room.cameras[row.camera];const cam=new THREE.PerspectiveCamera(2*Math.atan(36/(2*c.lensMM)/1.5)*180/Math.PI,1.5,.01,100);cam.position.fromArray(c.position);cam.lookAt(new THREE.Vector3().fromArray(c.target));cam.setViewOffset(2400,1600,0,-c.shiftY*2400,2400,1600);cam.updateMatrixWorld(true);
 for(const {point,uv} of row.probes){const p=new THREE.Vector3().fromArray(point).project(cam);maxError=Math.max(maxError,Math.abs((p.x+1)/2-uv[0]),Math.abs((p.y+1)/2-uv[1]));}}
assert(maxError<1e-5,`Blender/browser projection mismatch: ${maxError}`);
console.log(JSON.stringify({passed:true,rooms:keys.size,plates:60,hdr:30,bytes,maxCameraUVError:maxError}));
