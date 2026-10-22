// Exact-text evidence only. Never imports/runs derle.mjs or changes training gates.
import fs from 'node:fs';
import {createGunzip} from 'node:zlib';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as EXAM from '../aura-sinav-01/tasks.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const compilerPath='tools/egitim/derle.mjs',compiler=fs.readFileSync(compilerPath,'utf8');
const definition=compiler.match(/^const norm = [^\n]+/m)?.[0];
if(!definition)throw Error('Compiler normalization changed; review required');
const sandbox={};vm.createContext(sandbox);vm.runInContext(definition+';globalThis.norm=norm;',sandbox);
const normalize=sandbox.norm;
const tasks=Object.entries(EXAM).filter(([,v])=>Array.isArray(v)).flatMap(([group,v])=>v.map((t,i)=>({group,index:i,text:Array.isArray(t)?t[1]:t?.user||t?.metin||''}))).filter(t=>typeof t.text==='string'&&t.text.length);
const byText=new Map();for(const t of tasks){const text=normalize(t.text);if(!byText.has(text))byText.set(text,[]);byText.get(text).push({group:t.group,index:t.index});}
assert.equal(normalize('Genişliği 220 santimetre yap.'),normalize('Genişliği 180 santimetre yap!'));
assert.equal(normalize('Café 220'),normalize('Cafe 180'));
assert.notEqual(normalize('Başka bir oda istiyorum.'),normalize('Genişliği 180 santimetre yap!'));
assert(byText.has(normalize(tasks[0].text)),'Known exam sentence must be detected');
assert(!byText.has(normalize('C7 negatif kontrol: güneş doğmadan özgün bir bahçe tasarlayalım.')));
const files=[];
for(const name of ['procthor-denetimli.jsonl.gz','procthor-aura-cozucu.jsonl.gz']){
 const file='knowledge/ai-egitim/veri/yerlesim/'+name,lines=createInterface({input:fs.createReadStream(file).pipe(createGunzip()),crlfDelay:Infinity});
 let rows=0,userTurns=0;const overlaps=[];
 for await(const line of lines){if(!line.trim())continue;rows++;const r=JSON.parse(line);
  for(const [i,m]of r.messages.entries())if(m.role==='user'){userTurns++;const text=normalize(m.content);if(byText.has(text))overlaps.push({id:r.id,line:rows,message_index:i,normalized_text_sha256:hash(text),tasks:byText.get(text)});}
 }
 files.push({file,compressed_source_sha256:hash(fs.readFileSync(file)),rows,user_turns:userTurns,exact_normalized_overlaps:overlaps});
}
assert.equal(files.reduce((n,f)=>n+f.rows,0),17167);
const evidence={at:new Date().toISOString(),scope:'All17167 original placement rows compared to current exam using the actual compiler normalization. Exact user-text equality only; not semantic/paraphrase leakage clearance.',
 source_code_sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),reviewer:'Codex',review_mode:'user_authorized_self_review',training_approved:false,
 exam_tasks:tasks.length,unique_normalized_exam_texts:byText.size,files,
 sources_sha256_lf:Object.fromEntries([compilerPath,'tools/aura-sinav-01/tasks.mjs','tools/c7-audit/placement-exact-leakage.mjs'].map(f=>[f,hash(fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n'))])),
 controls:'PASS numeric/accent-compatible compiler normalization;known-exam positive;unrelated-sentence negative;17167 source row count',
 limits:['No approval or decision is written for unread rows.','No semantic, paraphrase, plan-group or target-solution leakage clearance.','H5 changes the exam; this receipt is bound to the current exam hash and must not be reused as evidence for another version.']};
const i=process.argv.indexOf('--out'),out=i<0?'work/c7-placement-exact-leakage.json':process.argv[i+1];
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({out,exam_tasks:tasks.length,rows:files.reduce((n,f)=>n+f.rows,0),exact_matches:files.reduce((n,f)=>n+f.exact_normalized_overlaps.length,0),training_approved:false}));
