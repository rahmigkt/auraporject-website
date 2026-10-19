import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../assets/vendor/three.module.js?v=20261016b';
import {roomSize,defaultTexture} from '../assets/forma/scene-plates.js';
const root=new URL('../knowledge/atmosfer/sahneler/',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root)));
assert.deepEqual(manifest.sizesProduced,['medium']);assert.equal(manifest.rooms.length,30);
const keys=new Set();let bytes=0;
for(const row of manifest.rooms){
 assert(!keys.has(row.id));keys.add(row.id);assert.equal(row.size,'medium');assert.equal(row.roomMetres[1],2.8);
 for(const name of [row.environment,row.id+'.json',...Object.values(row.cameras).map(c=>c.plate)]){const b=fs.readFileSync(new URL(name,root));bytes+=b.length;assert(b.length>200);}
 for(const [name,c] of Object.entries(row.cameras)){assert.equal(c.lensMM,name==='A'?50:70);assert.equal(c.width,2400);assert.equal(c.position[1],c.target[1]);}
}
assert(bytes<=120e6);assert.equal(roomSize(900),'small');assert.equal(roomSize(901),'medium');assert.equal(roomSize(2000),'medium');assert.equal(roomSize(2001),'large');
assert.equal(defaultTexture('wabi_sabi'),'TOPRAK');assert.equal(defaultTexture('bauhaus'),'TAS');assert.equal(defaultTexture('japandi'),'KIREC');
const calibration=JSON.parse(fs.readFileSync(new URL('camera-calibration.json',root)));assert.equal(calibration.rows.length,60);let maxError=0;
for(const row of calibration.rows){const room=manifest.rooms.find(r=>r.id===row.id),c=room.cameras[row.camera];const cam=new THREE.PerspectiveCamera(2*Math.atan(36/(2*c.lensMM)/1.5)*180/Math.PI,1.5,.01,100);cam.position.fromArray(c.position);cam.lookAt(new THREE.Vector3().fromArray(c.target));cam.setViewOffset(2400,1600,0,-c.shiftY*2400,2400,1600);cam.updateMatrixWorld(true);
 for(const {point,uv} of row.probes){const p=new THREE.Vector3().fromArray(point).project(cam);maxError=Math.max(maxError,Math.abs((p.x+1)/2-uv[0]),Math.abs((p.y+1)/2-uv[1]));}}
assert(maxError<1e-5,`Blender/browser projection mismatch: ${maxError}`);
console.log(JSON.stringify({passed:true,rooms:keys.size,plates:60,hdr:30,bytes,maxCameraUVError:maxError}));
