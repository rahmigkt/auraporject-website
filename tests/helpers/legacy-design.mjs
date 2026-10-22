// Explicit, pinned compatibility expectations. Never rewrites old evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=x=>createHash('sha256').update(typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest('hex');
const manifest=JSON.parse(fs.readFileSync(new URL('../fixtures/legacy-design-migrations.json',import.meta.url),'utf8'));
const leafFile=new URL('../fixtures/legacy-leaf-default-migrations.json',import.meta.url);
const leaf=fs.existsSync(leafFile)?JSON.parse(fs.readFileSync(leafFile,'utf8')):null;
if(leaf){
 assert.equal(leaf.version,2);assert.equal(leaf.review_mode,'user_authorized_self_review');
 assert(Date.parse(leaf.reviewed_at)>=Date.parse('2026-10-21T20:00:00Z')&&Date.parse(leaf.reviewed_at)<Date.parse('2026-10-26T20:00:00Z'));
 assert.equal(leaf.previous_manifest_sha256,sha(fs.readFileSync(new URL('../fixtures/legacy-design-migrations.json',import.meta.url),'utf8').replaceAll('\r\n','\n')));
 const root=new URL('../../',import.meta.url);
 assert.equal(leaf.engine_tree_sha256,sha(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:root})));
 execFileSync('git',['diff','--exit-code','HEAD','--','assets','tools/studyo-motoru'],{cwd:root,stdio:'pipe'});
 for(const [id,r] of Object.entries(leaf.records)){
  const prior=manifest.records[id];assert(prior,'No previous review for '+id);
  assert.equal(r.original_sha256,prior.original_sha256);assert.equal(r.previous_current_sha256,prior.current_sha256);
  assert.equal(r.semantic_change,prior.semantic_change);assert.deepEqual(r.changes,prior.changes);
  assert.equal(r.training_approved,false);
  assert(r.previous_review_preserved&&r.additional_changes.length);
  assert(r.additional_changes.every(c=>/^\/params\/bays\/\d+\/cells\/\d+\/lv$/.test(c.path)&&!c.old_present&&c.new_present&&c.after===0));
 }
}
export function assertKnownMigration(id,original,current){
 const expected=leaf?.records[id]||manifest.records[id];assert(expected,'Unreviewed legacy fixture: '+id);
 assert.equal(sha(original),expected.original_sha256,id+': historical fixture changed');
 assert.equal(sha(current),expected.current_sha256,id+': unreviewed runtime change');
 assert.equal(expected.training_approved,false);return expected;
}
