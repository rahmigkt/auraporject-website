// Narrow compatibility evidence: reconstruct the previously reviewed result,
// permit ONLY absent-to-zero automatic leaf defaults, retain original decisions.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {normalizeDesign} from '../../assets/forma/generate.js';
import {replay} from '../qwen-local/studio_data.mjs';
const sha = b => createHash('sha256').update(typeof b === 'string' || Buffer.isBuffer(b) ? b : JSON.stringify(b)).digest('hex');
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
function diff(a,b,p='') {
 if (same(a,b)) return [];
 if (a && b && typeof a === 'object' && typeof b === 'object')
  return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k => diff(a[k],b[k],p+'/'+k));
 return [{path:p,before:a??null,after:b??null,old_present:a!==undefined,new_present:b!==undefined}];
}
function previous(original,changes) {
 const out=structuredClone(original);
 for(const c of changes) {
  const keys=c.path.slice(1).split('/'),key=keys.pop();let node=out;
  for(const k of keys) {assert(node && typeof node === 'object');node=node[k];}
  if(c.new_present) node[key]=structuredClone(c.after);else delete node[key];
 }
 return out;
}
export function leafDefaultsOnly(changes) {
 return changes.length>0 && changes.every(c=>/^\/params\/bays\/\d+\/cells\/\d+\/lv$/.test(c.path)
  && !c.old_present && c.new_present && c.after===0);
}
const oldPath='tests/fixtures/legacy-design-migrations.json',oldBytes=fs.readFileSync(oldPath),old=JSON.parse(oldBytes);
const rows=['train','dev','test'].flatMap(s=>fs.readFileSync(`knowledge/ai-egitim/qwen-pilot-01/studio-v1/${s}.jsonl`,'utf8').trim().split('\n').map(JSON.parse));
const inputs=[];
for(const family of ['seating','table','storage','kitchen','bath'])for(const type of ['set','delta']) {
 const r=rows.find(r=>r.input.design.family===family&&r.expected.actions[0].type===type);
 inputs.push({id:'pilot:'+r.id,original:r.evidence.afterDesign,current:replay(r.input.design,r.expected.actions).after});
}
for(const r of JSON.parse(fs.readFileSync('knowledge/aura-ses/denemeler/tasarimlar.json','utf8')))
 inputs.push({id:'text:'+r.id,original:r.design,current:normalizeDesign(r.design)});
const records={};let unchanged=0;
for(const r of inputs) {
 const prior=old.records[r.id];assert.equal(sha(r.original),prior.original_sha256);
 if(sha(r.current)===prior.current_sha256){unchanged++;continue;}
 const reviewed=previous(r.original,prior.changes),delta=diff(reviewed,r.current);
 assert(leafDefaultsOnly(delta),r.id+' change outside absent automatic leaf defaults: '+JSON.stringify(delta));
 records[r.id]={...prior,current_sha256:sha(r.current),previous_current_sha256:prior.current_sha256,
  previous_review_preserved:true,additional_changes:delta,training_approved:false};
}
assert.equal(inputs.length,20);assert.equal(unchanged,11);assert.equal(Object.keys(records).length,9);
const output={version:2,reviewer:'Codex',review_mode:'user_authorized_self_review',
 reviewed_at:new Date().toISOString(),review_tool_sha256:sha(fs.readFileSync(import.meta.filename,'utf8').replaceAll('\r\n','\n')),
 policy:'Only absent-to-zero /params/bays/N/cells/N/lv additions; previous semantic decisions and original records retained. No training approval.',
 source_code_sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 engine_tree_sha256:sha(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'])),
 previous_manifest_sha256:sha(oldBytes.toString('utf8').replaceAll('\r\n','\n')),previous_manifest_hash_scope:'UTF8 with LF checkout normalization',exam_or_model_run:false,reviewed_cases:20,unchanged_cases:unchanged,records};
fs.writeFileSync('tests/fixtures/legacy-leaf-default-migrations.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({reviewed:20,unchanged,leaf_default_only:9,original_manifest_unchanged:sha(fs.readFileSync(oldPath))===sha(oldBytes),training_approved:false}));
