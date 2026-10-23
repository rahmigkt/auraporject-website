import assert from 'node:assert/strict';
import {Face,point3d} from '../assets/vendor/dxf/dxf.mjs';
const methods=['setFirstEdgeVisible','setSecondEdgeVisible','setThirdEdgeVisible','setFourthEdgeVisible'];
let passed=0;
for(let initial=0;initial<16;initial++)for(let i=0;i<4;i++)for(const visible of [false,true]){
 const face=new Face(point3d(0,0,0),point3d(1,0,0),point3d(1,1,0),point3d(0,1,0),{invisibleEdges:initial});
 face[methods[i]](visible);
 const expected=visible?initial&~(1<<i):initial|(1<<i);
 assert.equal(face.invisibleEdges,expected,`${methods[i]}(${visible}), initial=${initial}`);
 face[methods[i]](visible);assert.equal(face.invisibleEdges,expected,'idempotent');
 const tags=[];face.dxfyChild({push:(...tag)=>tags.push(tag),point3d:()=>{}});
 assert.equal(tags.find(t=>t[0]===70)[1],expected,'serialized DXF invisibility flags');passed++;
}
console.log(`PASS ${passed} edge visibility transitions, idempotence and serialized flags.`);
