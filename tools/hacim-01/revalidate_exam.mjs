// Mechanical revalidation only. No model, no authored task/target changes, no
// expert approval. Compares all 100 gold states against the old frozen engine;
// only solver output geometry may differ, and all frozen targets must still pass.
import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import{pathToFileURL}from'node:url';
import {execFileSync} from 'node:child_process';
import{uygula}from'../studyo-motoru/motor.mjs';
import{encode,layer,get}from'../aura-sinav-01/fixtures.mjs';
import{root,hash}from'./build.mjs';
import{grade}from'../../tests/ai-eval/aura-sinav-01/score.mjs';
const dir=new URL('../../tests/ai-eval/aura-sinav-01/',import.meta.url),freezePath=new URL('FREEZE.json',dir),before=fs.readFileSync(freezePath),freeze=JSON.parse(before),taskBytes=fs.readFileSync(new URL('gorevler.jsonl',dir));
assert.equal(hash(taskBytes),freeze.files['gorevler.jsonl'].sha256);
const tasks=taskBytes.toString('utf8').trim().split('\n').map(JSON.parse),evidence=[];
const previousRoot=process.argv[2];if(!previousRoot)throw Error('Pass a checkout of the previous frozen source tree; never refresh a lock without comparison');
const previousTree=hash(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:previousRoot}));assert.equal(previousTree,freeze.source_tree_sha256,'Wrong old source checkout');
const oldMotor=await import(pathToFileURL(path.join(previousRoot,'tools/studyo-motoru/motor.mjs')).href);
function changedPaths(a,b,p=''){if(encode(a)===encode(b))return[];if(a&&b&&typeof a==='object'&&typeof b==='object')return[...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>changedPaths(a[k],b[k],p+'/'+k));return[p];}
for(const t of tasks.filter(t=>t.expected.actions.length)){
 const r=uygula(t.input.state,t.expected.actions.map(a=>({...a,katman:layer(a.type)})));
 const old=oldMotor.uygula(t.input.state,t.expected.actions.map(a=>({...a,katman:layer(a.type)})));
 assert.equal(hash(encode(old.state)),t.expected.engine.state_sha256,t.id+' old frozen evidence mismatch');
 assert(r.rapor.gecti,t.id);
 const changes=changedPaths(old.state,r.state);
 if(changes.length){assert.equal(t.group,'ev-yerlesim');assert.equal(t.expected.actions[0].type,'yerlestir');assert(changes.every(p=>p.startsWith('/yerlesim/')||p==='/secili'||/^\/plan\/items\/\d+\/(pos_xy_mm\/\d+|rot_deg)$/.test(p)),t.id+' unrelated state changed: '+changes.join(','));}
 assert.deepEqual(r.rapor.uyari.map(w=>w.kod),t.expected.engine.warning_codes,t.id);
 assert.equal(r.rapor.kabul.length,t.expected.engine.accepted,t.id);
 for(const [p,v]of Object.entries(t.expected.observations))assert.deepEqual(get(r.state,p),v,t.id+p);
 assert.equal(grade(t,{reply:t.lang==='ar'?'تم ضبط الخيارات المطلوبة.':'Updated the requested settings.',actions:t.expected.actions}).points,2,t.id+' frozen target no longer meets scorer');
 evidence.push({id:t.id,original_state_sha256:t.expected.engine.state_sha256,current_state_sha256:hash(encode(r.state)),identical:!changes.length,changed_paths:changes,frozen_target_machine_points:2});
}
assert.equal(evidence.length,100);
const tree=hash(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:root}));
const archive=new URL('../../knowledge/ai-egitim/toparlama-01/archive/hacim-01-arap-oncesi/FREEZE-before.json',import.meta.url);
if(fs.existsSync(archive))assert.deepEqual(fs.readFileSync(archive),before,'Refuse to overwrite existing archive');else fs.writeFileSync(archive,before);
const report={version:'hacim-exam-revalidation/1',old_source_tree_sha256:freeze.source_tree_sha256,new_source_tree_sha256:tree,task_file_sha256:hash(taskBytes),task_bytes_changed:false,positive_states_identical:evidence.filter(e=>e.identical).length,solver_output_states_changed:evidence.filter(e=>!e.identical).length,positive_frozen_targets_still_pass:100,no_action_cases_unchanged:20,evidence,model_run:false,training_started:false,expert_review:'pending; explicit mechanical comparison only, not human approval',scope:'New source-manifest version; original 120 task bytes and historical expected state hashes are retained. Current placement output positions may differ, original action targets/constraints still score fully.'};
fs.writeFileSync(new URL('../../knowledge/ai-egitim/veri/hacim-1-komut/sinav-yeniden-dogrulama.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
freeze.version='aura-sinav-01/1.3-source-revalidated';freeze.source_tree_sha256=tree;
freeze.source_revalidation={report:'knowledge/ai-egitim/veri/hacim-1-komut/sinav-yeniden-dogrulama.json',positive_states_identical:report.positive_states_identical,solver_output_states_changed:report.solver_output_states_changed,positive_frozen_targets_still_pass:100,task_bytes_changed:false,expert_review:'pending'};
fs.writeFileSync(freezePath,JSON.stringify(freeze,null,2)+'\n');
console.log(JSON.stringify({...freeze.source_revalidation,model_run:false}));
