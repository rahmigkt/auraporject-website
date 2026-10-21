import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync}from'node:child_process';
import{dest,langs,hash,root,make,checkTarget}from'../tools/hacim-istek/build.mjs';
import{load}from'../tools/hacim-istek/audit.mjs';
import{audit,loadExam,similarity}from'../tools/hacim-istek/leakage.mjs';
import{decodeOperations}from'../tools/egitim-donustur/operations.mjs';
import{quality}from'../tools/hacim-istek/quality.mjs';
import{uygula}from'../tools/studyo-motoru/motor.mjs';
const rows=load();assert.equal(rows.length,1800);assert.equal(new Set(rows.map(r=>r.id)).size,1800);
assert.deepEqual(rows,make(),'Inputs, labels or exact motor replay changed');
for(const l of langs){const rs=rows.filter(r=>r.language===l);assert.equal(rs.length,200);assert.equal(new Set(rs.map(r=>r.user)).size,200);for(const [k,n]of Object.entries({single:120,multiple:50,clarify:20,unsupported:10}))assert.equal(rs.filter(r=>r.category===k).length,n);}
assert.equal(rows.filter(r=>r.user_dialect==='gulf').length,40);
assert.equal(rows.filter(r=>r.assistant.actions.some(a=>a.type==='isik')).length,45);
assert.equal(rows.filter(r=>r.assistant.actions.some(a=>a.type==='tasarimciya_gonder')).length,45);
for(const r of rows){assert(!/solver|çözücü|pos_xy_mm|wall_id|katman|backRake|armHeight|source exception|referans plan/iu.test(r.user+' '+r.assistant.reply));if(r.language==='ar')assert(!/[a-z]/i.test(r.user+r.assistant.reply));
 assert(r.review.status==='quarantine'&&!r.review.designer_approved&&!r.review.native_language_approved&&!r.training_started);
 assert.equal(r.review.producer,'Codex');assert.equal(r.review.required_reviewer,'Claude');assert.equal(r.review.cross_review_status,'pending');assert.equal(r.review.human_review_required,false);
 assert.equal(r.assistant.actions.length,{single:1,multiple:2,clarify:0,unsupported:0}[r.category]);assert(r.motor.report.gecti);assert.deepEqual(r.motor.report.red,[]);assert.deepEqual(r.motor.report.uyari,[]);assert.deepEqual(r.motor.target_mismatches,[]);
 assert(r.assistant.actions.every(a=>['ev','yerlesim','tekstil','aydinlatma','proje'].includes(a.katman)));
}
const ex=loadExam(),report={...audit(rows,ex.tasks),exam_sha256:ex.sha256};assert.equal(report.hits.length,0);assert.deepEqual(JSON.parse(fs.readFileSync(new URL('sizma-denetimi.json',dest))),report);
for(const t of ex.tasks){assert(similarity(t.input.text,t.input.text.replace(/[0-9٠-٩]+/g,'987'))>=.85);assert(audit([{...rows[0],language:t.lang,user:t.input.text+'; '+rows[0].user}],ex.tasks).hits.length);}
const furniture=structuredClone(rows[0]);furniture.assistant.actions=[{katman:'mobilya',type:'set',key:'armHeight',value:500}];assert.throws(()=>checkTarget(furniture));
const wrong=structuredClone(rows.find(r=>r.assistant.actions[0]?.type==='aciklik_ekle'));wrong.assistant.actions[0].en+=100;assert(checkTarget(wrong).target_mismatches.length,'Incorrect opening width must fail target check');
const q=quality(rows);assert.deepEqual(q,JSON.parse(fs.readFileSync(new URL('C1-kalite-raporu.json',dest))));
for(const v of Object.values(q.by_language)){
 assert(v.authored_user_patterns>=150);assert(v.reply_patterns>=50);assert(v.max_repeated_reply_pattern<=5);assert(v.max_repeated_opening<=10);assert.deepEqual(v.reviewed_connector_rows,[]);
 assert(v.constrained_ratio>=.2);assert(v.constrained_multiple_ratio>=.2);assert.deepEqual(v.constraint_types,['bakar','uzak','yakin']);
 assert.deepEqual(v.internal_term_rows,[]);assert.deepEqual(v.semicolon_multiple,[]);assert.deepEqual(v.new_remote_rooms,[]);assert.equal(v.clarify_topics.length,10);
}
const fallback=structuredClone(rows.find(r=>r.assistant.actions[0]?.type==='perde'));fallback.assistant.actions[0].drape.color='unlisted';assert(checkTarget(fallback).target_mismatches.length,'Accepted textile merge cannot hide wrong target');
const invalidLight=structuredClone(rows.find(r=>r.assistant.actions[0]?.type==='isik'));invalidLight.assistant.actions[0].renk_k=9000;assert.throws(()=>checkTarget(invalidLight),'Invalid temperature must not be accepted');
const impossible=structuredClone(rows.find(r=>r.assistant.actions[0]?.kisitlar?.some(k=>k.tur==='yakin')));
impossible.assistant.actions[0].kisitlar.forEach(k=>k.mm=1);
const impossibleResult=uygula(impossible.state,impossible.assistant.actions);
assert(!impossibleResult.rapor.gecti||impossibleResult.rapor.uyari.length||impossibleResult.rapor.red.length,'Impossible proximity must not silently succeed');
const manifest=JSON.parse(fs.readFileSync(new URL('sayim-raporu.json',dest)));assert.equal(manifest.source_lock.git_tree_sha256,hash(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:root})));
for(const f of manifest.files)assert.equal(f.sha256,hash(fs.readFileSync(new URL(f.path,dest))));
const c1b=JSON.parse(fs.readFileSync(new URL('C1b-degisiklik-kaniti.json',dest)));assert.equal(c1b.changed_user_rows,42);assert.equal(c1b.changed_reply_rows,1530);assert.equal(c1b.native_inputs_actions_observations_and_motor_evidence_unchanged,1800);
for(const f of c1b.source_files)assert.equal(f.current_sha256,hash(fs.readFileSync(new URL('../'+f.path,import.meta.url))));
assert.equal(manifest.qualified_training_rows,0);assert.equal(manifest.common_contract.rows,1800);
const projected=fs.readFileSync(new URL('karantina.jsonl',dest),'utf8').trim().split('\n').map(JSON.parse);
for(let i=0;i<rows.length;i++)assert.deepEqual(decodeOperations(projected[i].islemler),rows[i].assistant.actions,'Lossless common operation round trip');
assert.deepEqual(decodeOperations([{tur:'yerlestir',katman:'yerlesim',oda:'living',esyalar:[]}]),[{type:'yerlestir',katman:'yerlesim',oda:'living',esyalar:[]}]);
assert.throws(()=>decodeOperations([{tur:'oda_tanimla',katman:'ev',arguments:{type:'set'}}]));
console.log('PASS 1800 deterministic targets, exact motor results, scope rejection, wrong geometry/textile mutations, nine-language mix, Gulf40, lexical held-out exclusion; native review pending');
