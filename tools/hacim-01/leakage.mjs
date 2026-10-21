// Read-only audit: held-out tasks never supply command generation or target labels.
import {readFileSync} from 'node:fs';
import {hash} from './build.mjs';
export const normalize=s=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/\p{N}+/gu,' NUMBER ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const grams=s=>new Set(Array.from({length:Math.max(0,s.length-2)},(_,i)=>s.slice(i,i+3)));
export function similarity(a,b){
 a=normalize(a);b=normalize(b);if(a===b)return 1;
 const A=grams(a),B=grams(b),common=[...A].filter(x=>B.has(x)).length;
 const dice=2*common/(A.size+B.size||1);
 const x=new Set(a.split(' ')),y=new Set(b.split(' ')),n=[...x].filter(t=>y.has(t)).length;
 const tokenContainment=Math.min(x.size,y.size)>=4?n/Math.min(x.size,y.size):0;
 // Both textual similarity and containment are independently checked. Split clauses
 // are audited too, so appending another operation cannot hide an exam command.
 return Math.max(dice,tokenContainment>=.9?tokenContainment:0);
}
export function audit(rows,exam){
 const hits=[],nearest=[],intent_hits=[];
 const sorted=x=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sorted(x[k])])):x;
 const signature=actions=>actions.map(a=>JSON.stringify(sorted(a))).sort().join('|');
 for(const row of rows){let best={score:0};
  // No-action examples intentionally have no executable target. For action rows,
  // exclude identical complete targets across ALL languages in the same product.
  if(row.assistant.actions.length)for(const task of exam){
   if(task.group==='mobilya'&&task.input.state.design.family===row.state.design.family&&task.input.state.design.kind===row.state.design.kind&&signature(task.expected.actions)===signature(row.assistant.actions))intent_hits.push({row:row.id,exam_id:task.id,scope:'identical_complete_action_target_same_family_kind_any_language'});
  }
  for(const task of exam.filter(t=>t.lang===row.language)){
   const score=Math.max(...row.user.split(/[;؛]/u).map(s=>similarity(s,task.input.text)));
   if(score>best.score)best={score,exam_id:task.id};
   if(score>=.85)hits.push({row:row.id,exam_id:task.id,score});
  }nearest.push({row:row.id,...best});
 }
 return {algorithm:'NFKD, diacritics/punctuation/number masking; char-trigram Dice >= .85 or token containment >= .90 (at least 4 tokens); each semicolon clause audited; identical complete action targets excluded across languages for the same family/kind',compared_rows:rows.length,held_out_tasks:exam.length,hits,intent_hits,nearest:nearest.sort((a,b)=>b.score-a.score).slice(0,20),limitations:['Lexical screening plus exact executable-target matching does not prove absence of every semantic paraphrase','Exam text/targets are read for exclusion only, never copied into generated model inputs/labels; generator does not read the exam']};
}
export function loadExam(){const b=readFileSync(new URL('../../tests/ai-eval/aura-sinav-01/gorevler.jsonl',import.meta.url));return {tasks:b.toString('utf8').trim().split('\n').map(JSON.parse),sha256:hash(b)};}
