import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {encode,sha} from './contract.mjs';import {HERE,ROOT,engineTree,sourceHash,loadTasks} from './load.mjs';
const write=process.argv.includes('--write');
if(write){
 assert(!fs.existsSync(path.join(HERE,'FREEZE.json')),'Do not overwrite a frozen H5; make a new reviewed version');
 const rows=fs.readFileSync(path.join(HERE,'ev-projesi-40.jsonl'),'utf8').trim().split('\n').map(JSON.parse),review=JSON.parse(fs.readFileSync(path.join(HERE,'kayit-denetimi.json'),'utf8'));
 assert.equal(review.reviews.length,40);
 for(const row of rows){const r=review.reviews.find(x=>x.id===row.id);assert(r);assert.equal(r.input_sha256,sha(encode(row.input)));assert.equal(r.expected_sha256,sha(encode(row.expected)));assert.equal(r.record_sha256,sha(encode(row)));assert.equal(r.training_approval,false);}
 const files=Object.fromEntries(['gorevler.jsonl','ev-projesi-40.jsonl','kayit-denetimi.json','motor-denetimi.json','tam-metin-kontrolu.json','oda-geometrisi-kontrolu.json'].map(n=>[n,{sha256:sha(fs.readFileSync(path.join(HERE,n)))}]));
 const tools=['tasks.mjs','contract.mjs','build.mjs','prompts.mjs','review.mjs','leakage.mjs','shape-screen.py','load.mjs','freeze.mjs'].map(f=>'tools/h5-exam/'+f).concat(['tools/aura-sinav-01/fixtures.mjs','tools/c7-audit/source-disposition.py','tools/egitim/derle.mjs']);
 const manifest={version:'h5-ev-01/1.0',source_commit:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),files,source_files_sha256_lf:Object.fromEntries(tools.map(f=>[f,sourceHash(f)])),engine_tree_sha256:engineTree(),groups:{'ev-projesi':40,'ev-yerlesim':40,tekstil:20,zor:20},new_home:{tasks:40,apply:30,clarify:3,refuse:2,studio_redirect:5,languages:[...new Set(rows.map(r=>r.lang))]},review:{reviewer:'Codex',review_mode:'user_authorized_self_review',new40:'record_specific_second_pass',retained80:'historical;60 gold replays and20 no-action records;no new semantic approval',native_language_review:'pending external native specialists'},training_forbidden:true,official_acceptance:false,model_run:false,scope:'Frozen assessment bytes and code for CPU baseline;not model success,training approval or physical conformity'};
 fs.writeFileSync(path.join(HERE,'FREEZE.json'),JSON.stringify(manifest,null,2)+'\n');
}
console.log(JSON.stringify({frozen_tasks:loadTasks().length,model_run:false,training_approved:false}));
