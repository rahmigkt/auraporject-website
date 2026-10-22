import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../assets/forma/studio.js',import.meta.url),'utf8');
const start=src.indexOf("panel.addEventListener('submit',"),end=src.indexOf('\n  });',start)+6;
let handler,opened=0,sends=0,rendered=0;const state={canSend:true,project:{items:[{id:'U1',design:{params:{width:2100}}}]},lang:'tr'};
const status={textContent:''};
class FormDataMock{append(){} get(){return 'local fake';}}
const context={panel:{addEventListener:(type,fn)=>handler=fn},state,FormData:FormDataMock,Blob,
 $:()=>status,L:k=>k,openAssessment:()=>opened++,assessmentKey:()=>JSON.stringify(state.project.items),projectKey:()=>JSON.stringify(state.project.items),
 projectPackage:async()=>({files:[{name:'drawings.pdf',data:new Uint8Array()}],summary:'local'}),zip:()=>new Uint8Array(),projectLink:async()=> 'https://example.invalid',
 fetch:async()=>{sends++;return {json:async()=>({ok:true,id:'mock-only'})};},store:{set(){}},renderPanel:()=>rendered++};
vm.createContext(context);vm.runInContext(src.slice(start,end),context);
const event=()=>({target:{id:'sendForm'},preventDefault(){}});
await handler(event());assert.equal(opened,1);assert.equal(sends,0,'First click must show notes before any network');
state.reviewPermit=context.assessmentKey();await handler(event());assert.equal(sends,1);assert.equal(rendered,1);assert.equal(state.reviewPermit,null);
state.reviewPermit=context.assessmentKey();state.project.items[0].design.params.width++;
await handler(event());assert.equal(opened,2);assert.equal(sends,1,'A stale review confirmation must never send changed designs');
state.canSend=false;state.reviewPermit=context.assessmentKey();await handler(event());assert.equal(sends,1);assert.equal(status.textContent,'sendOff');
console.log('PASS actual submit handler with mocks: first click no send; current confirmed assessment sends once; edited design requires new assessment; backend unavailable blocks network');
