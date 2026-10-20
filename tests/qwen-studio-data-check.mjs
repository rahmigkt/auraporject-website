import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {replay} from '../tools/qwen-local/studio_data.mjs';
const dir='knowledge/ai-egitim/qwen-pilot-01/studio-v1';
const manifest=JSON.parse(readFileSync(`${dir}/manifest.json`,'utf8'));
for(const[name,hash]of Object.entries(manifest.files))assert.equal(createHash('sha256').update(readFileSync(`${dir}/${name}`)).digest('hex'),hash);
const rows=['train','dev','test'].flatMap(s=>readFileSync(`${dir}/${s}.jsonl`,'utf8').trim().split('\n').map(JSON.parse));
assert.equal(rows.length,276);assert.equal(new Set(rows.map(r=>r.id)).size,276);
const groups=new Map();for(const row of rows){assert.equal(row.review,'unreviewed');if(groups.has(row.group))assert.equal(groups.get(row.group),row.split);groups.set(row.group,row.split);}
// Replay one set and delta case for every real family; targets are hand-checkable arithmetic.
for(const family of ['seating','table','storage','kitchen','bath'])for(const type of ['set','delta']){
 const row=rows.find(r=>r.input.design.family===family&&r.expected.actions[0].type===type);
 const action=row.expected.actions[0],before=structuredClone(row.input.design),snapshot=JSON.stringify(before);
 const {after}=replay(before,row.expected.actions);
 assert.equal(after.params[action.key],type==='set'?action.value:before.params[action.key]+action.value);
 assert.equal(JSON.stringify(before),snapshot,'replay mutated original');
 assert.deepEqual(after,row.evidence.afterDesign);
}
assert.throws(()=>replay(rows[0].input.design,[{type:'execute_shell',value:'x'}]),/Non-curriculum/);
assert.throws(()=>replay(rows[0].input.design,[{type:'set',key:'invented',value:10}]),/Non-curriculum/);
const sft=readFileSync(`${dir}/sft-unreviewed.jsonl`,'utf8').trim().split('\n').map(JSON.parse);
assert.equal(sft.length,196);assert(sft.every(r=>rows.find(x=>x.id===r.id)?.split==='train'));
console.log('PASS frozen studio corpus: 276 rows, group separation, actual action-source replay for 5 families × set/delta, arithmetic, input immutability, unknown actions and train-only export.');
