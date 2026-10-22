import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {sha} from './contract.mjs';
export const ROOT=path.resolve(import.meta.dirname,'../..'),HERE=path.join(ROOT,'tests/ai-eval/h5-ev-01');
export const engineTree=()=>sha(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:ROOT}));
export const sourceHash=f=>sha(fs.readFileSync(path.join(ROOT,f),'utf8').replace(/\r\n/g,'\n'));
export function loadTasks(dir=HERE){
 const f=JSON.parse(fs.readFileSync(path.join(dir,'FREEZE.json'),'utf8'));
 for(const[name,v]of Object.entries(f.files))assert.equal(sha(fs.readFileSync(path.join(dir,name))),v.sha256,`Frozen H5 file changed: ${name}`);
 assert.equal(engineTree(),f.engine_tree_sha256,'H5 engine source changed; reviewed new version required');
 execFileSync('git',['diff','--exit-code','HEAD','--','assets','tools/studyo-motoru'],{cwd:ROOT,stdio:'pipe'});
 for(const[file,hash]of Object.entries(f.source_files_sha256_lf))assert.equal(sourceHash(file),hash,`H5 tool changed: ${file}`);
 const rows=fs.readFileSync(path.join(dir,'gorevler.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(rows.length,120);assert.equal(new Set(rows.map(r=>r.id)).size,120);assert(rows.every(r=>r.source.training_forbidden));return rows;
}
