import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../assets/vendor/three.module.js?v=20261016b';
import {buildMesh} from '../assets/forma/build.js';
import {familyOf} from '../assets/forma/families.js';
import {createAtmosphereStage,LIGHT_PRESETS} from '../assets/forma/atmosfer-room.js';
import {renderAtmosphere} from '../assets/forma/atmosfer.js';
const fixtures=JSON.parse(fs.readFileSync(new URL('./visual/atmosfer-01/designs.json',import.meta.url)));
assert.equal(fixtures.length,12);assert.equal(new Set(fixtures.map(f=>f.design.family)).size,5);
for(const {id,design:d} of fixtures){
  const compiled=familyOf(d).mod.compile(d.params),snapshot=JSON.stringify(compiled),group=new THREE.Group();group.scale.setScalar(.001);
  const mat=new THREE.MeshStandardMaterial();
  for(const part of compiled.parts){
    if(part.internal||part.planOnly)continue;
    const data=buildMesh(part),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(data.positions,3));
    g.setIndex(new THREE.BufferAttribute(data.indices,1));const mesh=new THREE.Mesh(g,mat);mesh.position.set(...part.pos);mesh.rotation.set(...part.rot);group.add(mesh);
  }
  const before=new THREE.Box3().setFromObject(group),size=before.getSize(new THREE.Vector3());
  const stage=createAtmosphereStage(THREE,group,{family:d.family,preset:'north',aspect:1.5});
  assert(stage.bounds.getSize(new THREE.Vector3()).distanceTo(size)<1e-8,id);
  assert(Math.abs(stage.bounds.min.y-Math.max(0,before.min.y))<1e-8,`${id}: mounting height`);
  assert.equal(stage.camera.userData.focalLengthMm,55);assert(stage.scene.environment.isTexture);
  assert(Math.abs(stage.camera.position.y-stage.camera.userData.target[1])<1e-8,'Upright camera prevents converging verticals');
  assert.equal(stage.room.floor,'wood');
  assert(stage.camera.position.y<stage.room.height,`${id}: camera above ceiling`);
  let area=0,directional=0;stage.scene.traverse(o=>{if(o.isRectAreaLight)area++;if(o.isDirectionalLight&&o.castShadow)directional++;});
  assert.equal(area,2);assert.equal(directional,1);
  for(const x of [stage.bounds.min.x,stage.bounds.max.x])for(const y of [stage.bounds.min.y,stage.bounds.max.y])for(const z of [stage.bounds.min.z,stage.bounds.max.z]){
    const ndc=new THREE.Vector3(x,y,z).project(stage.camera);
    assert(Math.abs(ndc.x)<=.821&&Math.abs(ndc.y)<=.821&&ndc.z<1&&ndc.z>-1,`${id}: clipped product ${ndc.toArray()}`);
  }
  assert.equal(JSON.stringify(compiled),snapshot,`${id}: product mutated`);
  stage.dispose();group.traverse(o=>o.geometry?.dispose());mat.dispose();
}
assert.deepEqual(Object.keys(LIGHT_PRESETS),['north','morning','noon','evening']);
assert.throws(()=>createAtmosphereStage(THREE,new THREE.Group(),{preset:'unknown'}),/Unknown/);
await assert.rejects(renderAtmosphere({compiled:{parts:[{}]},materials:{},canvas:{},signal:AbortSignal.abort()}),e=>e.name==='AbortError');
await assert.rejects(renderAtmosphere({compiled:{parts:[{}]},materials:{},canvas:{},width:0}),/dimensions/);
const html=fs.readFileSync(new URL('../assets/forma/studio.js',import.meta.url),'utf8');
assert(!html.includes('atmosfer.js'),'Final renderer must not load with studio');
console.log('PASS atmosphere: 12 real designs, five active families, preserved dimensions/mount heights, 55 mm framing, room/window/lights, pre-abort, input validation, lazy studio boundary.');
