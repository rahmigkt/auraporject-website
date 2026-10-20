import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {messages,validate,invalidate} from '../tools/qwen-local/current_studio.mjs';
const input={design:{family:'table',params:{width:900}},lang:'tr',vocabulary:{params:{width:[500,2000]},enums:{},styles:[],kinds:[],materials:{}},text:'Genişliği 950 mm yap.'};
const prompt=messages(input);
assert.equal(prompt[1].content,'Current design: {"family":"table","params":{"width":900}}\nRequest: Genişliği 950 mm yap.');
assert(prompt[0].content.includes('"reply"'));
assert(prompt[0].content.includes('"type":"set"|"delta"'));
assert.deepEqual(messages([input,input]),[prompt,prompt]);
assert(validate({reply:'Tamam.',actions:[{key:'width',value:950,type:'set'}]},input.vocabulary));
for(const bad of [[{type:'set',key:'width',value:950}],{actions:[]},{actions:[],reply:''},
 {actions:[{type:'set',key:'width',value:'950'}],reply:'Tamam'},
 {actions:[{type:'set',key:'invented',value:950}],reply:'Tamam'},
 {actions:[{type:'set',key:'width',value:950,execute:'evil'}],reply:'Tamam'}])assert(!validate(bad,input.vocabulary));
const temp=mkdtempSync(join(tmpdir(),'qwen-stale-'));
try{mkdirSync(join(temp,'run-old'));writeFileSync(join(temp,'run-old/manifest.json'),JSON.stringify({source:{sourceSha256:'old'}}));invalidate(temp,{sourceSha256:'new'});assert.equal(JSON.parse(readFileSync(join(temp,'run-old/STALE.json'))).current,'new');}finally{rmSync(temp,{recursive:true});}
console.log('PASS live PHP prompt extraction, batch parity, strict outer JSON and action types, key order independence, stale marking.');
