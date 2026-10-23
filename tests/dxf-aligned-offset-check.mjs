import assert from 'node:assert/strict';
import {AlignedDimension,point3d} from '../assets/vendor/dxf/dxf.mjs';
const near=(a,b,label)=>assert(Math.abs(a-b)<1e-7,`${label}: ${a} != ${b}`);
let passed=0;
for(const [dx,dy] of [[100,0],[0,100],[0,-100],[100,100],[-100,100],[100,-100],[1e-10,100],[-1e-10,100]])for(const [x,y] of [[0,0],[10,20],[-130,45]])for(const offset of [-10,0,10]){
 const a=point3d(x,y,7),b=point3d(x+dx,y+dy,7),dim=new AlignedDimension(a,b,{offset}),p=dim.definitionPoint,px=p.x-x,py=p.y-y;
 near(Math.hypot(px,py),Math.abs(offset),'offset distance');near((px*dx+py*dy)/Math.hypot(dx,dy),0,'perpendicular');assert.equal(p.z,7);
 const translated=new AlignedDimension(point3d(x+17,y-23,7),point3d(x+dx+17,y+dy-23,7),{offset}).definitionPoint;
 near(translated.x-p.x,17,'translation x');near(translated.y-p.y,-23,'translation y');
 assert.deepEqual(dim.fisrtPoint,a);assert.deepEqual(dim.secondPoint,b);passed++;
}
// Keep the existing intended sign: positive offsets lie below a nonvertical reference line.
for(const [a,b] of [[point3d(10,20),point3d(110,20)],[point3d(110,20),point3d(10,20)]])near(new AlignedDimension(a,b,{offset:10}).definitionPoint.y,10,'legacy below-line side');
const same=point3d(10,20,7);assert.deepEqual(new AlignedDimension(same,same,{offset:0}).definitionPoint,same);
assert.throws(()=>new AlignedDimension(same,same,{offset:10}),RangeError);
for(const offset of [NaN,Infinity,-Infinity])assert.throws(()=>new AlignedDimension(point3d(0,0),point3d(1,0),{offset}),RangeError);
console.log(`PASS ${passed} aligned dimension distance/perpendicular/translation/endpoint controls; sign, Z and degenerate inputs checked.`);
