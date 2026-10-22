// Exact user-text screening uses the real compiler normalization; no training export runs.
import fs from 'node:fs';import {createGunzip} from 'node:zlib';import {createInterface} from 'node:readline';import vm from 'node:vm';import assert from 'node:assert/strict';
import {build} from './build.mjs';import {sha} from './contract.mjs';
const compiler='tools/egitim/derle.mjs',definition=fs.readFileSync(compiler,'utf8').match(/^const norm = [^\n]+/m)?.[0];assert(definition);
const norm=vm.runInNewContext(definition+';norm'),exam=build(),by=new Map(exam.map(r=>[norm(r.input.text),r.id]));
assert.equal(by.size,40);assert.equal(norm('Ölçü220!'),norm('Olcu180'));assert(by.has(norm(exam[0].input.text)));assert(!by.has(norm('An unrelated positive-free control sentence.')));
const files=[];
for(const file of ['knowledge/ai-egitim/veri/yerlesim/procthor-denetimli.jsonl.gz','knowledge/ai-egitim/veri/yerlesim/procthor-aura-cozucu.jsonl.gz','knowledge/ai-egitim/veri/birlesik/adaylar.jsonl']){
 const input=fs.createReadStream(file),lines=createInterface({input:file.endsWith('.gz')?input.pipe(createGunzip()):input,crlfDelay:Infinity});let rows=0,users=0;const matches=[];
 function visit(x){if(!x||typeof x!=='object')return;const content=(x.role==='user'?x.content:x.rol==='user'?x.metin:null);if(typeof content==='string'){users++;if(by.has(norm(content)))matches.push({line:rows,task:by.get(norm(content))});}if(typeof x.user==='string'){users++;if(by.has(norm(x.user)))matches.push({line:rows,task:by.get(norm(x.user))});}for(const v of Object.values(x))if(v&&typeof v==='object')visit(v);}
 for await(const line of lines){if(!line.trim())continue;rows++;visit(JSON.parse(line));}
 files.push({file,sha256:sha(fs.readFileSync(file)),rows,user_texts_checked:users,matches});
}
assert.equal(files[0].rows+files[1].rows,17167);assert(files.every(f=>f.user_texts_checked>0));assert(files.every(f=>f.matches.length===0),'Exact normalized training-source text overlap');
const out={scope:'new40 user text exact normalized equality only;not paraphrase/semantic/solution leakage clearance',exam_tasks:40,compiler_normalizer_sha256:sha(definition),files,controls:'numeric/accent normalization;known exam hit;unrelated negative',training_export_run:false};
fs.mkdirSync('work',{recursive:true});fs.writeFileSync('work/h5-exact-text.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({new_tasks:40,rows:files.reduce((n,f)=>n+f.rows,0),user_texts:files.reduce((n,f)=>n+f.user_texts_checked,0),exact_matches:0}));
