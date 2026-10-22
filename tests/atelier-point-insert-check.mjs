import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../assets/forma/atelier.js',import.meta.url),'utf8');
const from=source.slice(source.indexOf('function fromMm('),source.indexOf('function mirrorIndex('));
const insert=source.slice(source.indexOf('function insertPoint('),source.indexOf('function removePoint('));
const failures=[];let passed=0;
for(const [tool,point,sym] of [['profile',{x:60,y:-500},false],['profile',{x:-30,y:50},false],['profile',{x:9,y:-1100},false],['silhouette',{x:100,y:0},false],['silhouette',{x:100,y:0},true]]){try{
 const original=tool==='profile'?[[0,12],[1,8]]:[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],S={target:{tool},base:{height:1000,size:[200,200]},pts:structuredClone(original),sym,sel:0};let snapshots=0,writes=0,draws=0;
 const toMm=([u,v])=>[u*200,v*200];const context=vm.createContext({S,XS:3,toMm,ensurePts(){},snapshot(){snapshots++;},handlesMm:()=>tool==='profile'?S.pts.map(([t,r])=>[r*3,-t*1000]):S.pts.map(toMm),writeOverride(){writes++;},drawEditor(){draws++;},renderToolState(){}});
 vm.runInContext(from+insert+';globalThis.addTest=insertPoint;',context);context.addTest(point);
 assert.equal(S.pts.length,original.length+(sym?2:1));assert(S.pts.flat().every(Number.isFinite));assert.equal(snapshots,1);assert.equal(writes,1);assert.equal(draws,1);assert.equal(S.sel,-1);
 if(tool==='profile'){assert.deepEqual(S.pts[0],original[0]);assert.deepEqual(S.pts.at(-1),original.at(-1));assert(S.pts[1][0]>0&&S.pts[1][0]<1);assert(S.pts[1][1]>=3);if(point.y===-500){assert.equal(S.pts[1][0],.5);assert.equal(S.pts[1][1],20);}}
 passed++;
 }catch(e){failures.push({tool,point,sym,message:e.message});}}
console.log(JSON.stringify({passed,failed:failures.length,failures}));assert.deepEqual(failures,[]);
