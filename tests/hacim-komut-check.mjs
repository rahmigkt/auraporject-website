import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{execFileSync}from'node:child_process';
import{make,checkTarget,dest,langs,hash,root}from'../tools/hacim-01/build.mjs';
import{audit,similarity,loadExam}from'../tools/hacim-01/leakage.mjs';
const rows=langs.flatMap(l=>readFileSync(new URL(l+'.jsonl',dest),'utf8').trim().split('\n').map(JSON.parse));
assert.equal(rows.length,1800);assert.equal(new Set(rows.map(r=>r.id)).size,1800);
assert.deepEqual(rows,make(),'Deterministic generation or engine replay changed');
for(const l of langs){const list=rows.filter(r=>r.language===l);assert.equal(list.length,200);assert.equal(new Set(list.map(r=>r.user)).size,200);for(const [c,n]of Object.entries({single:120,multiple:50,clarify:20,unsupported:10}))assert.equal(list.filter(r=>r.category===c).length,n);}
assert.equal(rows.filter(r=>r.user_dialect==='gulf').length,40);
const forbidden=/solver|çözücü|source exception|kaynak istisnası|reference plan|referans plan|circulation envelope|dolaşım zarfı|licensed source|lisanslı kaynak|proje hedefi|backRake|armHeight|seatHeight|topThickness|pos_xy_mm|"type"\s*:/iu;
for(const r of rows){
 assert(!forbidden.test(r.user+' '+r.assistant.reply));
 if(r.language==='ar')assert(!/[a-z]/i.test(r.user+r.assistant.reply),'Latin text in Arabic prose');
 assert.equal(r.review.status,'quarantine');assert(!r.review.designer_approved&&!r.review.native_language_approved);
 assert(r.motor.report.gecti);assert.deepEqual(r.motor.report.red,[]);assert.deepEqual(r.motor.report.uyari,[]);assert.deepEqual(r.motor.target_mismatches,[]);
 assert.equal(r.assistant.actions.length,{single:1,multiple:2,clarify:0,unsupported:0}[r.category]);
}
const ex=loadExam(),report=audit(rows,ex.tasks);assert.deepEqual(report.hits,[]);assert.deepEqual(report.intent_hits,[]);
const stored=JSON.parse(readFileSync(new URL('sizma-denetimi.json',dest),'utf8'));assert.deepEqual(stored,{...report,exam_sha256:ex.sha256});
// Exam number substitutions, spelling/punctuation changes, or appending another
// clause cannot hide copied text from the leakage check.
for(const t of ex.tasks.filter(t=>t.group==='mobilya')){
 assert(similarity(t.input.text,t.input.text.replace(/[0-9٠-٩]+/g,'399'))>=.85);
 const bad={...rows[0],language:t.lang,user:t.input.text+'; '+rows[0].user};
 assert(audit([bad],ex.tasks).hits.length);
 const semantic={...structuredClone(rows[0]),language:'da',user:'Et helt andet ordvalg',state:t.input.state,assistant:{reply:'ok',actions:t.expected.actions}};
 assert(audit([semantic],ex.tasks).intent_hits.length,'Changing prose/language must not hide a complete target copy');
}
const invalid=structuredClone(rows[0]);invalid.assistant.actions[0].key='inventedParameter';assert.throws(()=>checkTarget(invalid));
const clamped=structuredClone(rows[0]);clamped.assistant.actions[0].value=9000;assert(checkTarget(clamped).target_mismatches.length);
const wrongMaterial=structuredClone(rows[78]);wrongMaterial.assistant.actions[0].value='unlisted-color';assert.throws(()=>checkTarget(wrongMaterial));
const manifest=JSON.parse(readFileSync(new URL('sayim-raporu.json',dest),'utf8'));
assert.equal(manifest.source_lock.git_tree_sha256,hash(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:root})));
for(const f of manifest.files)assert.equal(f.sha256,hash(readFileSync(new URL(f.path,dest))));
console.log('PASS 1800 exact motor replays and reached targets, 9x200 mix, Gulf 40, no approvals, lexical held-out screening, invalid/clamped/material/copy mutations');
