import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../assets/vendor/three.module.js';
import {RoomEnvironment as RealRoomEnvironment} from '../assets/vendor/RoomEnvironment.js';
const source=fs.readFileSync(new URL('../assets/forma/scene.js',import.meta.url),'utf8');
const makeStageSource=source.slice(source.indexOf('function makeStage('),source.indexOf('/** Interactive viewer'));
function fixture(fail=false){
 let temporaryDisposes=0,generatorDisposes=0,targetDisposes=0;let sourceResources=0;
 const texture={identity:'environment'},environmentTarget={texture,dispose(){targetDisposes++}};
 class RoomEnvironment extends RealRoomEnvironment{
  constructor(){super();const unique=new Set();this.traverse(o=>{if(o.isMesh){unique.add(o.geometry);unique.add(o.material)}});sourceResources=unique.size;for(const r of unique)r.addEventListener('dispose',()=>temporaryDisposes++);}
 }
 class PMREMGenerator{
  fromScene(room,sigma){assert(room instanceof RoomEnvironment);assert.equal(sigma,.04);if(fail)throw new Error('fixture PMREM failure');return environmentTarget;}
  dispose(){generatorDisposes++}
 }
 const ctx=vm.createContext({THREE:{...THREE,PMREMGenerator},RoomEnvironment,PAPER:[1,1,1],document:{createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})}});
 const makeStage=vm.runInContext(makeStageSource+';makeStage',ctx);
 if(fail){assert.throws(()=>makeStage({}),/fixture PMREM failure/);assert.equal(temporaryDisposes,sourceResources);assert.equal(generatorDisposes,1);assert.equal(targetDisposes,0);return;}
 const stage=makeStage({});assert.equal(temporaryDisposes,sourceResources,'temporary RoomEnvironment resources must be freed after PMREM generation');assert.equal(generatorDisposes,1,'PMREM generator intermediates must be freed');assert.equal(targetDisposes,0,'output remains live');assert.equal(stage.scene.environment,texture);assert.equal(stage.scene.environmentIntensity,.55);
 const disposeMatch=source.match(/    dispose\(\) \{([^\n]+)\}/);assert(disposeMatch,'viewer disposal method found');
 vm.runInNewContext('(function(){'+disposeMatch[1]+'})()',{
  ro:{disconnect(){}},mats:null,roomMats:null,itemMats:new Map(),disposeGroup(){},group:null,composer:{dispose(){}},renderer:{dispose(){}},canvas:{remove(){}},disposeEnvironment:stage.disposeEnvironment,
 });
 assert.equal(targetDisposes,1,'viewer shutdown disposes environment render target');assert.equal(stage.scene.environment,null);stage.disposeEnvironment();assert.equal(targetDisposes,1,'environment cleanup is idempotent');
}
fixture();fixture(true);
console.log(JSON.stringify({temporaryRoomResourcesFreed:true,pmremIntermediatesFreed:true,environmentLiveUntilViewerShutdown:true,targetDisposedOnce:true,generationFailureCleanup:true,passed:true,realWebGLVisualCertification:false}));
