// Explicit reviewed compatibility profile. Never changes historical FREEZE or
// approves data. Unknown source trees, dirty sources and changed artifacts fail.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
export const lfHash=f=>sha(fs.readFileSync(new URL(f,new URL('../../',import.meta.url)),'utf8').replaceAll('\r\n','\n'));
let cached;
export function validateCurrentEvidence(p){
 assert.equal(p.version,'aura-mechanical-revalidation/2026-10-23');assert.equal(p.training_approved,false);
 assert.equal(p.reviewer,'Codex');assert.equal(p.review_mode,'user_authorized_self_review');
 assert(Date.parse(p.at)>=Date.parse('2026-10-21T20:00:00Z')&&Date.parse(p.at)<Date.parse('2026-10-26T20:00:00Z'),'Outside authorized review period');
 const required=['tests/ai-eval/aura-sinav-01/FREEZE.json','tests/ai-eval/aura-sinav-01/gorevler.jsonl',
  'knowledge/ai-egitim/veri/hacim-1-istek/sayim-raporu.json',
  ...['sayim-raporu.json','adaylar.jsonl','train.jsonl','dev.jsonl','test.jsonl'].map(f=>'knowledge/ai-egitim/veri/birlesik/'+f)];
 assert(required.every(f=>Object.hasOwn(p.artifacts,f)),'Missing artifact bindings');
 assert.equal(p.current_source_tree,sha(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:root})));
 execFileSync('git',['diff','--exit-code','HEAD','--','assets','tools/studyo-motoru'],{cwd:root,stdio:'pipe'});
 for(const [f,h] of Object.entries(p.artifacts))assert.equal(lfHash(f),h,'Changed evidence input: '+f);
 assert.equal(p.exam.length,100);assert(p.exam.every(r=>r.gold_points===2&&r.observations_match&&r.changes.length===0&&r.old_state_sha256===r.current_state_sha256));
 const tasks=fs.readFileSync(new URL('../../tests/ai-eval/aura-sinav-01/gorevler.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
 assert.deepEqual(p.exam.map(r=>r.id).sort(),tasks.filter(t=>t.expected.actions.length).map(t=>t.id).sort());
 assert.equal(p.combined.length,52);assert(p.combined.every(r=>r.historical_report_identical&&r.current_previous_state_identical));
 const combined=JSON.parse(fs.readFileSync(new URL('../../knowledge/ai-egitim/veri/birlesik/sayim-raporu.json',import.meta.url),'utf8'));
 assert.deepEqual(p.combined.map(r=>r.id).sort(),combined.engine_evidence.map(r=>r.id).sort());
 assert.equal(p.h1_exact_replay_rows,1800);assert.equal(p.arabic_exact_solver_rows,12);
 assert.equal(p.h1_training_approved,0);assert.equal(p.arabic_compiled_footprints,24);
 assert.equal(new Set(p.arabic.map(r=>r.id)).size,12);
 assert(p.arabic.every(r=>Object.hasOwn(p.artifacts,r.file)&&r.solver_result_identical&&r.requested_sizes_preserved));
 return p;
}
export function currentEvidence(){
 if(!cached)cached=validateCurrentEvidence(JSON.parse(fs.readFileSync(new URL('../../knowledge/ai-egitim/inceleme/motor-20261023.json',import.meta.url),'utf8')));
 return cached;
}
export function assertH1Source(previous){
 const p=currentEvidence();assert.equal(previous,p.h1_previous_source_tree);
 return p.current_source_tree;
}
export function assertArabicSource(record,sourceDigest){
 const p=currentEvidence(),r=p.arabic.find(r=>r.id===record.id);assert(r,'Unreviewed Arabic record');
 assert.equal(record.solver.sha256,r.previous_solver_source_digest);assert.equal(sourceDigest,r.current_solver_source_digest);
 // Whole record content is bound separately by artifact bytes; input must still
 // name the exact same historic source record and unchanged measured request.
 assert.equal(record.product_request.sofa_width_mm,r.sofa_width_mm);
}
export function assertExamRevalidation(freeze){
 const p=currentEvidence();assert.equal(freeze.source_tree_sha256,p.previous_source_tree);
 assert.equal(freeze.files['gorevler.jsonl'].sha256,p.exam_task_bytes_sha256);
 return p;
}
