import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync}from'node:child_process';
import{dest,langs,hash,root,make,checkTarget}from'../tools/hacim-istek/build.mjs';
import{load}from'../tools/hacim-istek/audit.mjs';
import{audit,loadExam,similarity}from'../tools/hacim-istek/leakage.mjs';
const rows=load();assert.equal(rows.length,1800);assert.equal(new Set(rows.map(r=>r.id)).size,1800);
assert.deepEqual(rows,make(),'Inputs, labels or exact motor replay changed');
for(const l of langs){const rs=rows.filter(r=>r.language===l);assert.equal(rs.length,200);assert.equal(new Set(rs.map(r=>r.user)).size,200);for(const [k,n]of Object.entries({single:120,multiple:50,clarify:20,unsupported:10}))assert.equal(rs.filter(r=>r.category===k).length,n);}
assert.equal(rows.filter(r=>r.user_dialect==='gulf').length,40);
for(const r of rows){assert(!/solver|çözücü|pos_xy_mm|wall_id|katman|backRake|armHeight|source exception|referans plan/iu.test(r.user+' '+r.assistant.reply));if(r.language==='ar')assert(!/[a-z]/i.test(r.user+r.assistant.reply));
 assert(r.review.status==='quarantine'&&!r.review.designer_approved&&!r.review.native_language_approved&&!r.training_started);
 assert.equal(r.assistant.actions.length,{single:1,multiple:2,clarify:0,unsupported:0}[r.category]);assert(r.motor.report.gecti);assert.deepEqual(r.motor.report.red,[]);assert.deepEqual(r.motor.report.uyari,[]);assert.deepEqual(r.motor.target_mismatches,[]);
 assert(r.assistant.actions.every(a=>['ev','yerlesim','tekstil','proje'].includes(a.katman)));
}
const ex=loadExam(),report={...audit(rows,ex.tasks),exam_sha256:ex.sha256};assert.equal(report.hits.length,0);assert.deepEqual(JSON.parse(fs.readFileSync(new URL('sizma-denetimi.json',dest))),report);
for(const t of ex.tasks){assert(similarity(t.input.text,t.input.text.replace(/[0-9٠-٩]+/g,'987'))>=.85);assert(audit([{...rows[0],language:t.lang,user:t.input.text+'; '+rows[0].user}],ex.tasks).hits.length);}
const furniture=structuredClone(rows[0]);furniture.assistant.actions=[{katman:'mobilya',type:'set',key:'armHeight',value:500}];assert.throws(()=>checkTarget(furniture));
const wrong=structuredClone(rows[0]);wrong.assistant.actions[0].kose[1][0]+=100;assert(checkTarget(wrong).target_mismatches.length,'Incorrect room boundary must fail target check');
const fallback=structuredClone(rows.find(r=>r.assistant.actions[0]?.type==='perde'));fallback.assistant.actions[0].drape.color='unlisted';assert(checkTarget(fallback).target_mismatches.length,'Accepted textile merge cannot hide wrong target');
const manifest=JSON.parse(fs.readFileSync(new URL('sayim-raporu.json',dest)));assert.equal(manifest.source_lock.git_tree_sha256,hash(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:root})));
for(const f of manifest.files)assert.equal(f.sha256,hash(fs.readFileSync(new URL(f.path,dest))));
assert.equal(manifest.qualified_training_rows,0);assert.equal(manifest.common_contract.rows,1800);
console.log('PASS 1800 deterministic targets, exact motor results, scope rejection, wrong geometry/textile mutations, nine-language mix, Gulf40, lexical held-out exclusion; native review pending');
