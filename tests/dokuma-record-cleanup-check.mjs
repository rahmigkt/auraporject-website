import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../mizan/dokuma/app.js',import.meta.url),'utf8');
const functions=source.slice(source.indexOf('function lock('),source.indexOf('async function importSVG('));
const failures=[];let passed=0;
for(const fail of ['capture','constructor','start','none']){try{
 const tracks=[{stops:0,stop(){this.stops++;}}];let downloaded=0;
 const elements=new Map();const $=id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);};
 const stream={getTracks:()=>tracks};
 class Recorder{static isTypeSupported(){return true;}constructor(){if(fail==='constructor')throw Error('constructor failure');this.state='inactive';}start(){if(fail==='start')throw Error('start failure');this.state='recording';}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['test'])});this.onstop();}}
 const context=vm.createContext({MediaRecorder:Recorder,window:{MediaRecorder:Recorder},Blob,$,canvas:{captureStream(){}},document:{querySelector:()=>({}),createElement:()=>({getContext:()=>({}),captureStream:()=>{if(fail==='capture')throw Error('capture failure');return stream;}})},performance:{now:()=>0},render(){},toast(){},say:a=>a,download(){downloaded++;},syncPlay(){},updatePhase(){},DURATION:74});
 vm.runInContext('let recording=null,recordCanvas=null,playing=false,time=44,last=0;'+functions+';globalThis.recordTest=record;globalThis.stopTest=()=>recording.stop();globalThis.readTest=()=>({recording,recordCanvas});',context);
 context.recordTest();
 if(fail==='none'){assert.equal(context.readTest().recording.state,'recording');assert.equal(tracks[0].stops,0);context.stopTest();assert.equal(downloaded,1);}else assert.equal(downloaded,0);
 if(fail!=='capture')assert.equal(tracks[0].stops,1,`${fail}: canvas track released`);
 assert.equal(context.readTest().recording,null);assert.equal(context.readTest().recordCanvas,null,`${fail}: canvas released`);assert.equal($('play').disabled,false);passed++;
 }catch(e){failures.push(fail+': '+e.message);}
}
assert.deepEqual(failures,[]);
console.log(`PASS ${passed} textile recording lifecycle cases: capture/constructor/start failures and successful stop; tracks, references, UI and download checked with local mocks.`);
