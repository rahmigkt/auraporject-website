import fs from'node:fs';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
import{load}from'./audit.mjs';import{dest,langs,hash}from'./build.mjs';import{quality}from'./quality.mjs';
const baseline=process.argv[2]||'6b1464d',before=[],source_files=[];
for(const l of langs){const path=`knowledge/ai-egitim/veri/hacim-1-istek/${l}.jsonl`,b=execFileSync('git',['show',baseline+':'+path],{maxBuffer:32*1024*1024});before.push(...b.toString('utf8').trim().split('\n').map(JSON.parse));source_files.push({path,baseline_sha256:hash(b),current_sha256:hash(fs.readFileSync(path))});}
const after=load(),old=new Map(before.map(r=>[r.id,r])),expected=[];
for(const l of ['en','fr','es','it'])for(const n of [123,128,133,138,143,148,153,158,163,168])expected.push(`hacim-istek-${l}-${n}`);
expected.push('hacim-istek-da-186','hacim-istek-da-199');
const changed=after.filter(r=>r.user!==old.get(r.id).user),changedReplies=after.filter(r=>r.assistant.reply!==old.get(r.id).assistant.reply);
assert.deepEqual(changed.map(r=>r.id).sort(),expected.sort());assert.equal(after.length,1800);assert.equal(changedReplies.length,1530);
for(const r of after){const b=old.get(r.id);assert(b);assert.deepEqual([r.state,r.assistant.actions,r.expected,r.motor],[b.state,b.assistant.actions,b.expected,b.motor],r.id+' non-prose data changed');}
const q=quality(after),prior=quality(before);
for(const [l,v]of Object.entries(q.by_language)){assert(v.max_repeated_opening<=10,l);assert(v.authored_user_patterns>=150);assert.deepEqual(v.reviewed_connector_rows,[]);}
fs.writeFileSync(new URL('C1-kalite-raporu.json',dest),JSON.stringify(q,null,2)+'\n');
const report={version:'C1b-change-proof/1',baseline_commit:baseline,rows:after.length,changed_user_rows:changed.length,changed_reply_rows:changedReplies.length,native_inputs_actions_observations_and_motor_evidence_unchanged:after.length,source_files,changed_users:changed.map(r=>({id:r.id,before:old.get(r.id).user,after:r.user})),openings:Object.fromEntries(langs.map(l=>[l,{before:prior.by_language[l].max_repeated_opening,after:q.by_language[l].max_repeated_opening,definition:'First five normalized tokens; placeholders, numbers, punctuation and accents normalized'}])),textile_operations_preserved:true,self_approved:false,training_started:false};
fs.writeFileSync(new URL('C1b-degisiklik-kaniti.json',dest),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({changed_users:changed.length,changed_replies:changedReplies.length,native_evidence_unchanged:after.length,openings:report.openings}));
