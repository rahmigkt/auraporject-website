import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {loadTasks,HERE,ROOT} from '../tools/h5-exam/load.mjs';
import {loadTasks as historicalTasks} from './ai-eval/aura-sinav-01/score.mjs';
const rows=loadTasks(),f=JSON.parse(fs.readFileSync(path.join(HERE,'FREEZE.json'),'utf8'));
assert.equal(rows.length,120);assert.equal(rows.filter(r=>r.group==='ev-projesi').length,40);assert.equal(rows.filter(r=>r.group==='mobilya').length,0);
assert.equal(f.training_forbidden,true);assert.equal(f.official_acceptance,false);assert.equal(f.model_run,false);
assert.throws(()=>historicalTasks(),/Studio source changed/,'historical engine gate was weakened');
const base=path.join(ROOT,'work');fs.mkdirSync(base,{recursive:true});const dir=fs.mkdtempSync(path.join(base,'h5-freeze-test-'));
try{
 for(const n of [...Object.keys(f.files),'FREEZE.json'])fs.copyFileSync(path.join(HERE,n),path.join(dir,n));
 assert.equal(loadTasks(dir).length,120);
 const task=path.join(dir,'gorevler.jsonl'),original=fs.readFileSync(task);fs.appendFileSync(task,' ');
 assert.throws(()=>loadTasks(dir),/Frozen H5 file changed/);fs.writeFileSync(task,original);
 const freeze=path.join(dir,'FREEZE.json'),originalManifest=fs.readFileSync(freeze),bad=structuredClone(f);bad.engine_tree_sha256='changed';fs.writeFileSync(freeze,JSON.stringify(bad));
 assert.throws(()=>loadTasks(dir),/engine source changed/);fs.writeFileSync(freeze,originalManifest);
 const badTool=structuredClone(f);badTool.source_files_sha256_lf['tools/h5-exam/tasks.mjs']='changed';fs.writeFileSync(freeze,JSON.stringify(badTool));assert.throws(()=>loadTasks(dir),/H5 tool changed/);
}finally{
 const resolved=path.resolve(dir);assert(resolved.startsWith(path.resolve(base)+path.sep));fs.rmSync(resolved,{recursive:true});
}
console.log(JSON.stringify({frozen_tasks:120,new_home:40,new_furniture_tasks:0,modified_task_rejected:true,changed_engine_rejected:true,changed_authoring_tool_rejected:true,historical_gate_preserved:true,model_run:false}));
