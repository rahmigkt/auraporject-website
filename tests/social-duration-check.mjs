import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
// Minimal EBML metadata container, not a playable-media fixture. Optional argument checks a real local recording too.
const original=process.argv[2]?readFileSync(process.argv[2]):Buffer.from('1a45dfa380185380678c1549a966872ad7b1830f4240','hex');
class Reader{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend()})}}
const context={window:{},FileReader:Reader,Blob,console};vm.runInNewContext(readFileSync(new URL('../assets/vendor/fix-webm-duration/fix-webm-duration.js',import.meta.url),'utf8'),context);
const before=new Blob([original],{type:'video/webm'}),fixed=await context.window.ysFixWebmDuration(before,18000,{logger:false}),bytes=Buffer.from(await fixed.arrayBuffer()),durationTag=Buffer.from([0x44,0x89,0x88]);const idx=bytes.indexOf(durationTag);assert.ok(idx>=0);assert.equal(bytes.readDoubleBE(idx+3),18000);assert.ok(fixed.size>before.size);
const same=await context.window.ysFixWebmDuration(fixed,9999,{logger:false});assert.deepEqual(Buffer.from(await same.arrayBuffer()),bytes);
const bad=new Blob(['not webm']);assert.equal(await context.window.ysFixWebmDuration(bad,1000,{logger:false}),bad);
console.log(JSON.stringify({sourceBytes:before.size,fixedBytes:fixed.size,durationMs:18000,preservesExistingDuration:true,malformedNotClaimedFixed:true}));
