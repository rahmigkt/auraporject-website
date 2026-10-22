// Compare current execution with an EXACT prior frozen source checkout. No
// original data, FREEZE, negative decision or training approval is rewritten.
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {uygula} from '../studyo-motoru/motor.mjs';
import {grade} from '../../tests/ai-eval/aura-sinav-01/score.mjs';
import {encode,layer,get} from '../aura-sinav-01/fixtures.mjs';
import {decodeOperations} from '../egitim-donustur/operations.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=f=>fs.readFileSync(f,'utf8'),json=f=>JSON.parse(read(f));
const load=f=>read(f).trim().split('\n').map(JSON.parse);
const oldRoot=path.resolve(process.argv[2]||'');assert(process.argv[2],'Pass exact previous frozen checkout');
const freeze=json('tests/ai-eval/aura-sinav-01/FREEZE.json');
const tree=cwd=>sha(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd}));
assert.equal(tree(oldRoot),freeze.source_tree_sha256);
execFileSync('git',['diff','--exit-code','HEAD','--','assets','tools/studyo-motoru'],{cwd:oldRoot,stdio:'pipe'});
const previous=await import(pathToFileURL(path.join(oldRoot,'tools/studyo-motoru/motor.mjs')).href);
function diff(a,b,p=''){
 if(encode(a)===encode(b))return[];
 if(a&&b&&typeof a==='object'&&typeof b==='object')return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diff(a[k],b[k],p+'/'+k));
 return [{path:p,before:a??null,after:b??null,old_present:a!==undefined,new_present:b!==undefined}];
}
const onlyDefaults=changes=>changes.every(c=>/^\/design\/params\/bays\/\d+\/cells\/\d+\/lv$/.test(c.path)&&!c.old_present&&c.new_present&&c.after===0);
const tasks=load('tests/ai-eval/aura-sinav-01/gorevler.jsonl'),exam=[];
for(const t of tasks.filter(t=>t.expected.actions.length)){
 const ops=t.expected.actions.map(a=>({...a,katman:layer(a.type)}));
 const old=previous.uygula(t.input.state,ops),current=uygula(t.input.state,ops),changes=diff(old.state,current.state);
 const points=grade(t,{reply:t.lang==='ar'?'تم ضبط الخيارات المطلوبة.':'Updated the requested settings.',actions:t.expected.actions}).points;
 exam.push({id:t.id,old_state_sha256:sha(encode(old.state)),current_state_sha256:sha(encode(current.state)),changes,
  previous_report:old.rapor,current_report:current.rapor,gold_points:points,default_changes_only:onlyDefaults(changes),
  observations_match:Object.entries(t.expected.observations).every(([p,v])=>encode(get(current.state,p))===encode(v))});
}
const report=json('knowledge/ai-egitim/veri/birlesik/sayim-raporu.json'),by=new Map(load('knowledge/ai-egitim/veri/birlesik/adaylar.jsonl').map(r=>[r.id,r]));
const combined=[];
for(const e of report.engine_evidence){
 const r=by.get(e.id);assert(r);const ops=decodeOperations(r.islemler);
 const old=previous.uygula(r.durum_once,ops),current=uygula(r.durum_once,ops);
 combined.push({id:r.id,current_report:current.rapor,historical_report_identical:encode(e.report)===encode(current.rapor),
  current_previous_state_identical:encode(old.state)===encode(current.state),changes:diff(old.state,current.state),
  row_sha256:sha(encode(r)),training_approved:false});
}
fs.mkdirSync('work/evidence-review',{recursive:true});
fs.writeFileSync('work/evidence-review/diagnostic.json',JSON.stringify({previous_source_tree:tree(oldRoot),current_source_tree:tree(process.cwd()),exam,combined},null,2)+'\n');
console.log(JSON.stringify({exam:exam.length,gold_2:exam.filter(r=>r.gold_points===2).length,observations:exam.filter(r=>r.observations_match).length,
 default_or_no_change:exam.filter(r=>r.default_changes_only).length,changed:exam.filter(r=>r.changes.length).map(r=>({id:r.id,changes:r.changes})),
 combined:combined.length,combined_same_report:combined.filter(r=>r.historical_report_identical).length,
 combined_same_state:combined.filter(r=>r.current_previous_state_identical).length},null,2));
