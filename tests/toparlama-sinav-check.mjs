import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadTasks,grade,score} from './ai-eval/aura-sinav-01/score.mjs';
assert.throws(()=>loadTasks(),/reviewed revalidation/,'Default historical source gate must stay closed');
assert.throws(()=>loadTasks({revalidation:'unknown'}),/reviewed revalidation/);
const tasks=loadTasks({revalidation:'motor-20261023'}),positive=tasks.filter(t=>t.expected.actions.length);
assert.equal(tasks.length,120);assert.equal(positive.length,100);
for(const [group,n] of Object.entries({mobilya:40,'ev-yerlesim':40,tekstil:20,zor:20}))assert.equal(tasks.filter(t=>t.group===group).length,n);
assert.equal(new Set(tasks.filter(t=>t.group==='mobilya').map(t=>t.lang)).size,9);
assert.equal(tasks.filter(t=>t.group==='mobilya'&&t.lang==='ar').length,5);
const candidates=fs.readFileSync(new URL('../knowledge/ai-egitim/veri/birlesik/adaylar.jsonl',import.meta.url),'utf8').trim().split('\n').map(JSON.parse);
const serialized=JSON.stringify(candidates);
for(const t of tasks){assert(t.source.training_forbidden);assert.equal(t.review,'unreviewed');assert(!serialized.includes(t.id));assert(!Object.hasOwn(t.input.context,'reason'));}
let checks=0;
const pred=t=>({reply:t.lang==='ar'?'تم ضبط الخيارات المطلوبة.':'Updated the requested settings.',actions:structuredClone(t.expected.actions)});
for(const t of positive){assert.equal(grade(t,pred(t)).points,2,t.id);checks++;}
const first=tasks[0];
for(const bad of [{reply:'ok',actions:[],status:'done'},[],{reply:'ok',actions:[{type:'shell',command:'rm'}]},JSON.parse('{"reply":"ok","actions":[],"__proto__":{}}')]){assert.equal(grade(first,bad).points,0);checks++;}
const numeric=tasks.find(t=>t.group==='mobilya'&&t.expected.actions[0].type==='set');
for(const value of ['2400',999999,NaN]){const p=pred(numeric);p.actions[0].value=value;assert.equal(grade(numeric,p).points,0);checks++;}
const multi=tasks.find(t=>t.group==='mobilya'&&t.expected.actions.length>1);
assert.equal(grade(multi,{reply:pred(multi).reply,actions:[multi.expected.actions[0]]}).points,1);checks++;
const textile=tasks.find(t=>t.group==='tekstil'&&t.expected.actions[0].type==='perde');
assert.equal(grade(textile,{reply:'ok',actions:[{type:'perde',sheer:{family:'invented'}}]}).points,0);checks++;
const layout=tasks.find(t=>t.expected.actions[0]?.type==='yerlestir');
const wrong=pred(layout);wrong.actions[0].esyalar[0].en+=1;assert.equal(grade(layout,wrong).points,0);checks++;
const coords=pred(layout);coords.actions[0].esyalar[0].x=100;assert.equal(grade(layout,coords).points,0);checks++;
const partial=pred(layout);partial.actions[0].kisitlar=[];assert.equal(grade(layout,partial).points,1);checks++;
const hard=tasks.find(t=>t.group==='zor');assert.equal(grade(hard,{reply:'Which measurement?',actions:[{type:'set',key:'width',value:1000}]}).points,0);checks++;
const change=tasks.find(t=>t.expected.reason==='language-switch');assert.equal(change.input.lang,'en');assert.equal(grade(change,{reply:'Which size do you need?',actions:[]}).points,0);assert.equal(grade(change,{reply:'Hangi ölçüyü değiştirelim?',actions:[]}).points,2);checks+=2;
const ar=tasks.find(t=>t.group==='zor'&&t.lang==='ar');assert.equal(grade(ar,{reply:'Which measurement?',actions:[]}).points,0);checks++;
const empty=score(tasks,[]);assert.equal(empty.missing,120);assert.equal(empty.maximum_machine_points,240);assert.equal(empty.official,false);assert.equal(empty.model_run_claimed,false);checks++;
assert.throws(()=>score(tasks,[{id:'unknown',output:{}}]));assert.throws(()=>score(tasks,[{id:first.id},{id:first.id}]));checks+=2;
console.log(JSON.stringify({tasks:120,gold_engine_unit_cases:100,assertion_groups:checks,model_run:false,expert_review:'pending'}));
