import assert from 'node:assert/strict';
const original={window:globalThis.window,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator'),Worker:globalThis.Worker,AudioContext:globalThis.AudioContext};
const deferred=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)};};
const tick=()=>new Promise(r=>setImmediate(r));
let serial=0;
async function setup({failRecorder=false}={}){
 const permission=deferred(),states=[];let stopped=0,started=0;
 const stream={getTracks:()=>[{stop(){stopped++;}}]};
 class Recorder{constructor(){if(failRecorder)throw new Error('Recorder unavailable');}start(){started++;this.state='recording';}stop(){this.state='inactive';this.onstop?.();}}
 globalThis.window={MediaRecorder:Recorder};globalThis.MediaRecorder=Recorder;
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:()=>permission.promise}}});
 globalThis.Worker=class{postMessage(data){if(data.type==='run')queueMicrotask(()=>this.onmessage?.({data:{type:'result',text:'test'}}));}};
 globalThis.AudioContext=class{async decodeAudioData(){return {getChannelData:()=>new Float32Array(1)};}close(){}};
 const {startVoice}=await import(`../assets/forma/voice.js?test=${serial++}`);
 const stop=startVoice({lang:'tr',onText(){},onState:s=>states.push(s)});
 return {permission,stream,states,stop,get stopped(){return stopped;},get started(){return started;}};
}
let failed=0;const originalRecorder=globalThis.MediaRecorder;
try{
 for(const [name,run]of [
  ['cancel while permission is pending releases the later stream without recording',async()=>{const e=await setup();e.stop();e.permission.resolve(e.stream);await tick();assert.equal(e.started,0);assert.equal(e.stopped,1);assert(!e.states.includes('recording'));assert.equal(e.states.at(-1),'done');}],
  ['recorder construction failure releases the granted microphone stream',async()=>{const e=await setup({failRecorder:true});e.permission.resolve(e.stream);await tick();assert.equal(e.started,0);assert.equal(e.stopped,1);assert.equal(e.states.at(-1),'error');}],
  ['normal recording releases the stream and completes transcription',async()=>{const e=await setup();e.permission.resolve(e.stream);await tick();assert.equal(e.started,1);assert(e.states.includes('recording'));e.stop();await tick();await tick();assert.equal(e.stopped,1);assert.equal(e.states.at(-1),'done');}]
 ]){try{await run();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
}finally{globalThis.window=original.window;globalThis.Worker=original.Worker;globalThis.AudioContext=original.AudioContext;globalThis.MediaRecorder=originalRecorder;if(original.navigator)Object.defineProperty(globalThis,'navigator',original.navigator);else delete globalThis.navigator;}
assert.equal(failed,0,`${failed} voice input regressions`);
