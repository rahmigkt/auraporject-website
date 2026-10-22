import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../assets/forma/studio.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const functions=source.slice(source.indexOf('async function readImage('),source.indexOf('// ---- First-visit guide:'));
const failures=[];
for(const mode of ['success','read-error','abort','decode-error','canvas-error','interpret-error','no-file','vision-off']){
 try{
  const notes=[],designs=[],calls=[],marker=new Error(mode);let reads=0;
  class Reader{readAsDataURL(){reads++;queueMicrotask(()=>{if(mode==='read-error'){this.error=marker;this.onerror?.();}else if(mode==='abort')this.onabort?.();else{this.result='data:image/png;base64,AA==';this.onload();}});}}
  class Image{naturalWidth=2800;naturalHeight=1400;set src(v){queueMicrotask(()=>mode==='decode-error'?this.onerror?.():this.onload());}}
  const ctx={state:{ai:{vision:mode!=='vision-off'},lang:'tr'},FileReader:Reader,Image,
   feedback:(...args)=>notes.push(args),L:k=>k,partName:(g,k)=>k,setDesign:d=>designs.push(d),
   document:{createElement(){return {getContext:()=>({drawImage(){if(mode==='canvas-error')throw marker;}}),toDataURL(){return 'small-jpeg';}};}},
   async designFromImage(url,lang){calls.push([url,lang]);if(mode==='interpret-error')throw marker;return {design:{id:'mock'},estimated:[],notes:''};}};
  const read=vm.runInNewContext(`${functions}\nreadImage`,ctx);
  const outcome=await Promise.race([read(mode==='no-file'?null:{}).then(()=> 'done',e=>`rejected:${e.message}`),new Promise(r=>setTimeout(()=>r('pending'),30))]);
  assert.equal(outcome,'done','readImage settles and handles errors');
  if(mode==='success'){assert.equal(designs.length,1);assert.equal(calls.length,1);assert.equal(calls[0][0],'small-jpeg');assert(notes.at(-1)[0].startsWith('applied'));}
  else{assert.equal(designs.length,0);if(mode==='no-file'){assert.equal(notes.length,0);assert.equal(reads,0);}else if(mode==='vision-off'){assert.equal(notes.at(-1)[1],'warn');assert.equal(reads,0);}else assert.equal(notes.at(-1)[1],'error');}
 }catch(error){failures.push({mode,message:error.message});}
}
console.log(JSON.stringify({passed:8-failures.length,failed:failures.length,failures}));if(failures.length)process.exitCode=1;
