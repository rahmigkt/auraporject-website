// Explicit, pinned compatibility expectations. Never rewrites old evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const manifest=JSON.parse(fs.readFileSync(new URL('../fixtures/legacy-design-migrations.json',import.meta.url),'utf8'));
export function assertKnownMigration(id,original,current){
 const expected=manifest.records[id];assert(expected,'Unreviewed legacy fixture: '+id);
 assert.equal(sha(original),expected.original_sha256,id+': historical fixture changed');
 assert.equal(sha(current),expected.current_sha256,id+': unreviewed runtime change');
 assert.equal(expected.training_approved,false);return expected;
}
