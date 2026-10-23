import assert from 'node:assert/strict';
import {DxfWriter,point3d} from '../assets/vendor/dxf/dxf.mjs';
let passed=0;
for(const method of ['addAlignedDim','addLinearDim'])for(const angle of [-135,-45,0,30,45,90,135,225])for(const rotation of [undefined,'auto',0,17,-25]){
 const writer=new DxfWriter(),r=angle*Math.PI/180;
 writer[method](point3d(10,20),point3d(10+100*Math.cos(r),20+100*Math.sin(r)),{angle,rotation,definitionPoint:point3d(50,50)});
 const lines=writer.stringify().trim().split(/\r?\n/),tags=[];
 for(let i=0;i<lines.length;i+=2)tags.push([Number(lines[i].trim()),lines[i+1]?.trim()]);
 const start=tags.findIndex(t=>t[0]===0&&t[1]==='DIMENSION');assert(start>=0,'actual DIMENSION entity');
 let end=start+1;while(end<tags.length&&tags[end][0]!==0)end++;
 const entity=tags.slice(start,end),text=entity.find(t=>t[0]===53);
 if(rotation===undefined||rotation==='auto')assert(text===undefined||Number(text[1])===0,`${method}/${angle}: automatic text must not add a relative rotation, got ${text}`);
 else assert.equal(Number(text?.[1]),rotation,'explicit relative text rotation retained');
 if(method==='addLinearDim')assert.equal(Number(entity.find(t=>t[0]===50)?.[1]),angle,'dimension line angle retained');
 passed++;
}
console.log(`PASS ${passed} actual DXF serialization cases: automatic/default relative text rotation, explicit angles and separate line angles.`);
