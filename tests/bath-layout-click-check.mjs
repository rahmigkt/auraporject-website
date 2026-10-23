import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../assets/forma/studio.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const click=source.slice(source.indexOf("  panel.addEventListener('click', e => {"),source.indexOf('  // Dragging a bay'));
const edits=[{baycount:'2'},{cellcolor:'sage'},{celltype:'drawers'},{cellset:'inside',value:'shelves'},{cellop:'split'},{bayop:'add'},{bayop:'left'},{bayop:'right'},{cellauto:'1'},{bayauto:'1'}];
const failures=[];let passed=0;
for(const family of ['bath','storage','kitchen','seating'])for(const dataset of edits){
 try{
  let handler;const received=[];
  vm.runInNewContext(click,{panel:{addEventListener(type,fn){assert.equal(type,'click');handler=fn;}},
   isStorage:()=>family==='storage',isBath:()=>family==='bath',isKitchen:()=>family==='kitchen',isPanel:()=>['bath','storage','kitchen'].includes(family),
   layoutAction:d=>received.push(d)});
  const element={dataset};handler({target:{closest:selector=>selector==='button, [data-load]'?element:null}});
  assert.equal(received.length,['bath','storage'].includes(family)?1:0,`${family} layout route`);
  if(received.length)assert.equal(received[0],dataset);passed++;
 }catch(error){failures.push({family,dataset,message:error.message});}
}
console.log(JSON.stringify({passed,failed:failures.length,failures}));if(failures.length)process.exitCode=1;
