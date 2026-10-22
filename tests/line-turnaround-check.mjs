import assert from 'node:assert/strict';
import {lineMesh,tube} from '../assets/forma/mesh.js';
import {buildMesh} from '../assets/forma/build.js';
const paths=[[[0,0,0],[100,0,0],[0,0,0]],[[0,0,0],[0,100,0],[0,0,0]],[[0,0,0],[0,0,100],[0,0,0]],[[0,0,0],[100,0,0],[0,0,0],[0,100,0]],[[0,0,0],[100,0,0],[100,0,0],[0,0,0]]];
const check=m=>{
 assert(m.positions.length>0);assert(m.positions.every(Number.isFinite),'nonfinite positions');
 assert(m.normals.every(Number.isFinite),'nonfinite normals');assert(m.uvs.every(Number.isFinite),'nonfinite UVs');
 assert(m.indices.every(i=>i<m.positions.length/3));
};
let checks=0;const failures=[];
for(const points of paths)for(const closed of [false,true]) {
 const desc={fn:'line',points,r:1,closed},before=JSON.stringify(desc);
 try{check(lineMesh(desc));check(buildMesh({geom:desc}));assert.equal(JSON.stringify(desc),before);checks++;}catch(e){failures.push({points,closed,error:e.message});}
}
for(const points of paths.slice(0,4)){try{check(tube(points,2));checks++;}catch(e){failures.push({points,error:e.message});}}
// Ordinary straight/bent and dashed lines remain finite as well.
for(const points of [[[0,0,0],[100,0,0]],[[0,0,0],[100,0,0],[100,100,0]],[[0,0,0],[100,100,0],[0,100,0]]])for(const dash of [null,[5,3]]){check(lineMesh({points,closed:false,dash}));checks++;}
console.log(JSON.stringify({passed:checks,failed:failures.length,examples:failures.slice(0,3)}));
assert.equal(failures.length,0);
