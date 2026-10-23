import assert from 'node:assert/strict';
import {DxfWriter,point3d} from '../assets/vendor/dxf/dxf.mjs';
const tests=[];
for(const degreeCurve of [1,2,3])for(const fit of [false,true])for(const rational of [false,true]){
 const w=new DxfWriter(),points=Array.from({length:degreeCurve+2},(_,i)=>point3d(i*10,(i%2)*5,0));
 const args={degreeCurve,controlPoints:points,fitPoints:fit?[points[0],points.at(-1)]:[],flags:rational?12:8,...(rational?{weights:points.map((_,i)=>1+i*.1)}:{})};
 w.addSpline(args);const lines=w.stringify().trim().split(/\r?\n/),tags=[];for(let i=0;i<lines.length;i+=2)tags.push([Number(lines[i]),lines[i+1]]);
 const start=tags.findIndex(([k,v])=>k===0&&v==='SPLINE'),end=tags.findIndex(([k],i)=>i>start&&k===0);const entity=tags.slice(start,end);
 const values=k=>entity.filter(t=>t[0]===k).map(t=>Number(t[1]));
 assert.deepEqual(values(42),[1e-7],'exactly one knot tolerance');assert.deepEqual(values(43),[1e-7]);assert.deepEqual(values(44),[1e-10],'fit tolerance has its own group44');
 assert.deepEqual(values(71),[degreeCurve]);assert.deepEqual(values(73),[points.length]);assert.deepEqual(values(74),[fit?2:0]);
 assert.equal(values(40).length,points.length+degreeCurve+1);assert.equal(values(41).length,rational?points.length:0);
 tests.push({degreeCurve,fit,rational});
}
assert.throws(()=>new DxfWriter().addSpline({degreeCurve:3,controlPoints:[point3d(0,0,0)]}));
assert.throws(()=>new DxfWriter().addSpline({degreeCurve:1,controlPoints:[point3d(0,0,0),point3d(1,1,0)],knots:[0]}));
console.log(JSON.stringify({serialized_cases:tests.length,invalid_shapes_rejected:2,status:'PASS'}));
