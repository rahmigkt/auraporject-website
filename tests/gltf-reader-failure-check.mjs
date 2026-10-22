import assert from 'node:assert/strict';
import {Scene,Mesh,BoxGeometry,MeshBasicMaterial} from '../assets/vendor/three.module.js';
import {GLTFExporter} from '../assets/vendor/addons/exporters/GLTFExporter.js';
let passed=0;
function install({failRead=0,mode='error'}={}){
 let calls=0;const eventErrors=[];
 globalThis.FileReader=class {
  readAsArrayBuffer(blob){this.start(blob,false);}
  readAsDataURL(blob){this.start(blob,true);}
  start(blob,dataURL){const id=++calls;if(id===failRead&&mode==='throw')throw Error('simulated synchronous read failure');this.read(blob,dataURL,id);}
  async read(blob,dataURL,id){await Promise.resolve();if(id===failRead){this.result=null;this.error=mode==='error'?Error('simulated read error'):null;try{if(mode==='abort')this.onabort?.();else this.onerror?.();this.onloadend?.();}catch(e){eventErrors.push(e.message);}return;}this.result=dataURL?'data:application/octet-stream;base64,'+Buffer.from(await blob.arrayBuffer()).toString('base64'):await blob.arrayBuffer();try{this.onload?.();this.onloadend?.();}catch(e){eventErrors.push(e.message);}}
 };
 return eventErrors;
}
async function settle(p){return Promise.race([p.then(value=>({status:'resolved',value}),error=>({status:'rejected',error})),new Promise(resolve=>setTimeout(()=>resolve({status:'pending'}),100))]);}
function scene(){const s=new Scene();s.add(new Mesh(new BoxGeometry(1,2,3),new MeshBasicMaterial()));return s;}
for(const binary of [false,true]){
 const errors=install(),s=scene(),r=await settle(new GLTFExporter().parseAsync(s,{binary}));assert.equal(r.status,'resolved');
 if(binary){assert(r.value instanceof ArrayBuffer);assert.equal(new DataView(r.value).getUint32(0,true),0x46546c67);}else assert(r.value.buffers[0].uri.startsWith('data:'));
 assert.deepEqual(errors,[]);s.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});passed++;
}
for(const [binary,failRead] of [[false,1],[true,1],[true,2]])for(const mode of ['error','abort','throw']){
 const errors=install({failRead,mode}),s=scene(),r=await settle(new GLTFExporter().parseAsync(s,{binary}));assert.equal(r.status,'rejected',`${binary}/${failRead}/${mode}`);assert(r.error instanceof Error);assert.match(r.error.message,/read/i);assert.deepEqual(errors,[]);s.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});passed++;
}
for(const mode of ['success','error','abort','throw']){
 install({failRead:mode==='success'?0:1,mode});let writer;const exporter=new GLTFExporter();exporter.register(w=>{writer=w;return {};});await exporter.parseAsync(new Scene());
 const r=await settle(writer.processBufferViewImage(new Blob([new Uint8Array([1,2,3])])));assert.equal(r.status,mode==='success'?'resolved':'rejected');
 if(mode==='success'){assert.equal(r.value,0);assert.equal(writer.json.bufferViews[0].byteLength,4);}passed++;
}
{
 install({failRead:1});let success=0,failure=0;await new Promise(resolve=>{new GLTFExporter().parse(scene(),()=>{success++;resolve();},()=>{failure++;resolve();},{binary:true});});assert.equal(success,0);assert.equal(failure,1);passed++;
}
delete globalThis.FileReader;
console.log(JSON.stringify({passed,scope:'Actual exporter and image buffer method;mock FileReader success/error/abort/synchronous throw;no real-browser/WebGL claim'}));
