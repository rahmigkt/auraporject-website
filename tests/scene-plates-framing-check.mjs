import fs from 'node:fs';
import * as THREE from '../assets/vendor/three.module.js?v=20261016b';
import {familyOf} from '../assets/forma/families.js';
import {buildMesh} from '../assets/forma/build.js';
const root=new URL('../knowledge/atmosfer/sahneler/',import.meta.url),examples=JSON.parse(fs.readFileSync(new URL('ornekler/examples.json',root)));
let passed=true;const rows=[];
for(const f of examples){
 const d=f.design,c=familyOf(d).mod.compile({...d.params,kind:d.kind}),box=new THREE.Box3();
 for(const p of c.parts){if(p.internal)continue;const mesh=buildMesh({...p,geom:{...p.geom,finalDetail:true}}),matrix=new THREE.Matrix4().compose(new THREE.Vector3().fromArray(p.pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...p.rot)),new THREE.Vector3(1,1,1));for(let i=0;i<mesh.positions.length;i+=3)box.expandByPoint(new THREE.Vector3().fromArray(mesh.positions,i).applyMatrix4(matrix).multiplyScalar(.001));}
 const centre=box.getCenter(new THREE.Vector3()),offset=new THREE.Vector3(-centre.x,-Math.min(0,box.min.y),-centre.z);
 if(d.family==='kitchen'||c.params.base==='wall')offset.z+=-.65-(box.min.z-centre.z);box.translate(offset);
 const room=JSON.parse(fs.readFileSync(new URL(`${d.family}-medium-KIREC-SABAH.json`,root)));
 for(const [name,camera] of Object.entries(room.cameras)){const cam=new THREE.PerspectiveCamera(2*Math.atan(36/(2*camera.lensMM)/1.5)*180/Math.PI,1.5,.01,100);cam.position.fromArray(camera.position);cam.lookAt(new THREE.Vector3().fromArray(camera.target));cam.setViewOffset(2400,1600,0,-camera.shiftY*2400,2400,1600);cam.updateMatrixWorld(true);const points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z).project(cam));const bounds={minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};const width=(bounds.maxX-bounds.minX)/2,ok=Object.values(bounds).every(v=>Math.abs(v)<.99)&&width>=.6&&width<=.75;passed&&=ok;rows.push({id:f.id,camera:name,bounds,width,ok,worldBounds:{min:box.min.toArray(),max:box.max.toArray()}});}
}
console.log(JSON.stringify({passed,rows},null,2));process.exitCode=passed?0:1;
