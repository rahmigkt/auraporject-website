import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../mizan/app.js',import.meta.url),'utf8');
const functions=source.slice(source.indexOf('function lockRecord('),source.indexOf('async function toggleExhibit('));
let passed=0;const failures=[];
for(const fail of ['capture','constructor','start','none']){try{
 const tracks=[{stops:0,stop(){this.stops++;}}],audioTracks=[];let downloaded=0;
 const els=new Map();const $=id=>{if(!els.has(id))els.set(id,{});return els.get(id);};
 $('canvas').captureStream=()=>{};
 const stream={getTracks:()=>[...tracks,...audioTracks],addTrack:t=>audioTracks.push(t)};
 class Recorder{static isTypeSupported(){return true;}constructor(){if(fail==='constructor')throw Error('constructor failure');this.state='inactive';}start(){if(fail==='start')throw Error('start failure');this.state='recording';}stop(){this.state='inactive';this.ondataavailable({data:new Blob(['test'])});this.onstop();}}
 const context=vm.createContext({MediaRecorder:Recorder,Blob,$,document:{querySelectorAll:()=>[],createElement:()=>({getContext:()=>({}),captureStream:()=>{if(fail==='capture')throw Error('capture failure');return stream;}})},compose(){},toast(){},download(){downloaded++;},updateFormula(){},syncPlay(){},state:{scene:'motors'},sound:true,audioDest:{stream:{getAudioTracks:()=>[{clone:()=>({stops:0,stop(){this.stops++;}})}]}}});
 vm.runInContext('let recorder=null,recordCanvas=null,recordCtx=null,lastNote=-1,guide=false,recordElapsed=0;'+functions+';globalThis.recordTest=record;globalThis.stopTest=()=>recorder.stop();globalThis.readTest=()=>({recorder,recordCanvas,recordCtx});',context);
 await context.recordTest();
 if(fail==='none'){assert.equal(context.readTest().recorder.state,'recording');assert.equal(tracks[0].stops,0);context.stopTest();assert.equal(downloaded,1);}else assert.equal(downloaded,0);
 if(fail!=='capture'){assert.equal(tracks[0].stops,1,`${fail}: canvas track released`);assert.equal(audioTracks[0].stops,1,`${fail}: cloned audio track released`);}
 assert.equal(context.readTest().recorder,null);assert.equal(context.readTest().recordCanvas,null,`${fail}: canvas reference released`);assert.equal(context.readTest().recordCtx,null,`${fail}: context reference released`);assert.equal($('playBtn').disabled,false);passed++;}catch(e){failures.push(fail+': '+e.message);}
}
assert.deepEqual(failures,[]);
console.log(`PASS ${passed} recording lifecycle cases: capture/constructor/start failures and successful stop; tracks, references, UI and download checked with local mocks.`);

