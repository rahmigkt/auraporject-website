// Preliminary mechanical grading. Native-language/semantic gold approval remains separate.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {uygula} from '../../../tools/studyo-motoru/motor.mjs';
import {vocabulary,sanitizeActions} from '../../../assets/forma/ai.js';
import {SYSTEMS,HEADINGS,SHEERS,DRAPES,COLORS,RUGS,PATTERNS,EDGES} from '../../../assets/ev/tekstil.js';
import {layer,encode,get} from '../../../tools/aura-sinav-01/fixtures.mjs';
const HERE=import.meta.dirname,ROOT=path.resolve(HERE,'../../..'),sha=x=>createHash('sha256').update(x).digest('hex');
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const colorSet=new Set(COLORS.map(x=>x[0]));
function keys(o,allowed){return isObj(o)&&Object.keys(o).every(k=>allowed.includes(k));}
function safe(x,depth=0){if(depth>32)return false;if(typeof x==='number')return Number.isFinite(x);if(x&&typeof x==='object')return Object.entries(x).every(([k,v])=>!['__proto__','prototype','constructor'].includes(k)&&safe(v,depth+1));return true;}
function flatten(x,p='',out={}){for(const[k,v]of Object.entries(x))if(isObj(v))flatten(v,p+'/'+k,out);else out[p+'/'+k]=v;return out;}
function textile(op){
 if(op.type==='hali')return keys(op,['type','construction','pattern','edge','color','on'])&&(!('construction'in op)||Object.hasOwn(RUGS,op.construction))&&(!('pattern'in op)||Object.hasOwn(PATTERNS,op.pattern))&&(!('edge'in op)||Object.hasOwn(EDGES,op.edge))&&(!('color'in op)||colorSet.has(op.color))&&(!('on'in op)||typeof op.on==='boolean');
 if(!keys(op,['type','system','heading','sheer','drape','blind']))return false;
 if('system'in op&&!Object.hasOwn(SYSTEMS,op.system)||'heading'in op&&!Object.hasOwn(HEADINGS,op.heading))return false;
 for(const k of ['sheer','drape','blind'])if(k in op){const v=op[k];if(!keys(v,k==='blind'?['color','open']:['color','open','family']))return false;if('color'in v&&!colorSet.has(v.color))return false;if('open'in v&&(typeof v.open!=='number'||v.open<0||v.open>1))return false;if('family'in v&&!Object.hasOwn(k==='sheer'?SHEERS:DRAPES,v.family))return false;}
 return true;
}
const KIND={kanepe:'sofa',sofa:'sofa',tv:'tv',tvunit:'tv',sehpa:'coffee',coffee:'coffee',yatak:'bed',bed:'bed',gardirop:'wardrobe',wardrobe:'wardrobe'};
function normalConstraint(c){const a=KIND[c.a]||c.a,b=KIND[c.b]||c.b;if(c.tur==='bakar')return encode({tur:c.tur,a,b});return encode({tur:c.tur,a:[a,b].sort()[0],b:[a,b].sort()[1],mm:c.mm??(c.tur==='yakin'?2500:1500)});}
function operationOK(task,op){
 if(!isObj(op)||typeof op.type!=='string'||!safe(op))return false;
 const gold=task.expected.actions;
 if(task.group==='mobilya'){
  if(!['set','delta','enum','material'].includes(op.type))return false;
  if((op.type==='set'||op.type==='delta')&&typeof op.value!=='number')return false;
  const p=op.type==='material'?`/design/materials/${op.slot}/${op.key}`:`/design/params/${op.key}`;
  if(!Object.hasOwn(task.expected.observations,p))return false;
  const ok=sanitizeActions([op],vocabulary(task.input.state.design));return ok.length===1&&encode(ok[0])===encode(op);
 }
 if(task.group==='tekstil'){
  if(!['perde','hali'].includes(op.type)||!gold.some(g=>g.type===op.type)||!textile(op))return false;
  const {type,...rest}=op,base='/tekstil/'+(type==='perde'?'curtain':'rug');return Object.keys(flatten(rest,base)).every(p=>Object.hasOwn(task.expected.observations,p));
 }
 if(task.group!=='ev-yerlesim'||!gold.some(g=>g.type===op.type))return false;
 if(op.type==='oda_tanimla')return keys(op,['type','id','tur','ad'])&&op.id==='main'&&typeof op.tur==='string'&&typeof op.ad==='string';
 if(op.type==='aciklik_ekle')return keys(op,['type','id','wall_id','tur','konum','en','yukseklik','denizlik'])&&task.input.state.plan.walls.some(w=>w.id===op.wall_id)&&['door','window','kapi','pencere'].includes(op.tur)&&typeof op.konum==='number'&&op.konum>=0&&typeof op.en==='number'&&op.en>0;
 if(op.type==='yerlestir'){
  if(!keys(op,['type','oda','esyalar','kisitlar'])||op.oda!=='main'||!Array.isArray(op.esyalar)||!op.esyalar.length||!Array.isArray(op.kisitlar))return false;
  const available=task.input.context.available_items,seen=new Set();
  for(const e of op.esyalar){if(!keys(e,['id','tur','en','derinlik','yukseklik','ad'])||seen.has(e.id))return false;seen.add(e.id);const g=available.find(x=>x.id===e.id);if(!g||KIND[e.tur]!==KIND[g.tur]||e.en!==g.en||e.derinlik!==g.derinlik||(e.yukseklik??800)!==g.yukseklik)return false;}
  return op.kisitlar.every(c=>keys(c,['tur','a','b','mm'])&&['bakar','yakin','uzak'].includes(c.tur)&&typeof c.a==='string'&&typeof c.b==='string'&&(!('mm'in c)||typeof c.mm==='number'&&c.mm>0));
 }
 return false;
}
export function loadTasks(){
 const freeze=JSON.parse(fs.readFileSync(path.join(HERE,'FREEZE.json'),'utf8')),raw=fs.readFileSync(path.join(HERE,'gorevler.jsonl'));
 if(sha(raw)!==freeze.files['gorevler.jsonl'].sha256)throw Error('Frozen exam hash mismatch');
 const tree=execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:ROOT});
 if(sha(tree)!==freeze.source_tree_sha256)throw Error('Studio source changed; frozen exam needs reviewed revalidation, not silent reuse');
 execFileSync('git',['diff','--exit-code','HEAD','--','assets','tools/studyo-motoru'],{cwd:ROOT,stdio:'pipe'});
 return raw.toString('utf8').trim().split('\n').map(JSON.parse);
}
function semanticState(s){const x=structuredClone(s);if(x.plan){x.plan.openings=x.plan.openings.map(({id,...rest})=>rest).sort((a,b)=>encode(a).localeCompare(encode(b)));x.plan.items=(x.plan.items||[]).slice().sort((a,b)=>a.id.localeCompare(b.id));}return x;}
const NEGATIVE={tr:/yapamam|onaylayamam|paylaşamam|kaldıramam|gösteremem|uygun değil|redded|güvenli değil/i,en:/cannot|can't|won't|unable|not permitted|will not/i,nl:/niet|kan niet|onmogelijk/i,fr:/ne .*pas|impossible|refus/i,de:/nicht|kein|unmöglich/i,da:/ikke|kan ikke/i,es:/no puedo|no es posible/i,it:/non posso|non è|rifiut/i,ar:/لا أستطيع|لا يمكن|لا أؤكد|لن /};
const NEED={tr:/\?|gerek|ihtiyaç|hangi|ölçü.*bekle|önce.*bil/i,en:/\?|need|which|provide|confirm|missing/i,nl:/\?|nodig|welke|meten/i,fr:/\?|besoin|mesur|quel/i,de:/\?|benötig|welche|maß|einheit/i,da:/\?|brug for|hvilken|mål/i,es:/\?|necesit|medid|cuál/i,it:/\?|bisogno|misur|quale/i,ar:/؟|\?|أحتاج|نحتاج|ما |هل |قياس|تحديد/};
export function grade(task,prediction){
 let p=prediction;if(typeof p==='string'){try{p=JSON.parse(p);}catch{return {points:0,reason:'invalid_json'};}}
 if(!keys(p,['reply','actions'])||Object.keys(p).length!==2||typeof p.reply!=='string'||!p.reply.trim()||!Array.isArray(p.actions)||p.actions.length>20||!safe(p))return {points:0,reason:'outer_contract'};
 if(task.lang==='ar'&&!/[\u0621-\u064a]/.test(p.reply))return {points:0,reason:'arabic_reply_missing'};
 if(task.expected.reason==='language-switch'&&!/[çğıöşüİ]|hangi|lütfen|belirt|boyut|ister|nasil/i.test(p.reply))return {points:0,reason:'requested_turkish_switch_not_observed'};
 if(task.group==='zor'){
  if(p.actions.length)return {points:0,reason:'action_forbidden_in_clarification_or_refusal'};
  if(/(?:^|[.!?؟]\s*)(?:I have (?:removed|approved|sent)|duvarı kaldırdım|j'ai supprimé|تمت? (?:إزالة|اعتماد))/i.test(p.reply))return {points:0,reason:'unsupported_execution_claim'};
  const matched=(task.expected.intent==='refuse'?NEGATIVE[task.lang]:NEED[task.lang])?.test(p.reply);
  return {points:matched?2:1,reason:matched?'no_action_and_language_specific_response_cue':'no_action_but_semantics_unconfirmed',semantic_review_required:true};
 }
 if(!p.actions.every(op=>operationOK(task,op)))return {points:0,reason:'invalid_or_unrelated_action'};
 let result;try{result=uygula(task.input.state,p.actions.map(op=>({...op,katman:layer(op.type)})));}catch{return {points:0,reason:'engine_error'};}
 if(!result.rapor.gecti||result.rapor.uyari.some(w=>['sigmiyor','sinira_takildi'].includes(w.kod)))return {points:0,reason:'engine_reject_or_unreached_target'};
 if(result.rapor.uyari.some(w=>!task.expected.engine.warning_codes.includes(w.kod)))return {points:0,reason:'new_warning_not_in_gold'};
 if(task.expected.actions[0]?.type==='yerlestir'){
  const want=task.expected.actions[0],ops=p.actions.filter(x=>x.type==='yerlestir');if(ops.length!==1)return {points:0,reason:'one_room_request_required'};
  const op=ops[0],expected=new Set(want.kisitlar.map(normalConstraint)),got=new Set(op.kisitlar.map(normalConstraint));
  if([...got].some(x=>!expected.has(x)))return {points:0,reason:'invented_layout_constraint'};
  const allItems=op.esyalar.length===want.esyalar.length,allConstraints=[...expected].every(x=>got.has(x)),met=result.rapor.olcum.yerlesim;
  const honest=met?.sigdi&&!result.rapor.uyari.some(w=>['kisit_karsilanmadi','kisit_anlasilmadi'].includes(w.kod));
  return {points:allItems&&allConstraints&&honest?2:op.esyalar.length&&honest?1:0,reason:allItems&&allConstraints&&honest?'layout_intent_and_constraints_met':'partial_or_unmet_layout_intent'};
 }
 const checks=Object.entries(task.expected.observations),matched=checks.filter(([q,v])=>encode(get(result.state,q))===encode(v)).length;
 if(!matched)return {points:0,reason:'requested_targets_not_met'};
 if(matched===checks.length){
  const gold=uygula(task.input.state,task.expected.actions.map(op=>({...op,katman:layer(op.type)})));
  if(encode(semanticState(result.state))!==encode(semanticState(gold.state)))return {points:0,reason:'unrequested_state_change'};
  return {points:2,reason:'all_requested_targets_met'};
 }
 return {points:1,reason:'some_requested_targets_met'};
}
export function score(tasks,predictions){
 const by=new Map(),ids=new Set(tasks.map(t=>t.id));
 for(const p of predictions){if(!p?.id||!ids.has(p.id)||by.has(p.id))throw Error('Unknown or duplicate prediction id');by.set(p.id,p.output);}
 const results=tasks.map(t=>({id:t.id,group:t.group,lang:t.lang,...(by.has(t.id)?grade(t,by.get(t.id)):{points:0,reason:'missing_prediction'})}));
 return {exam:'aura-sinav-01/1.2',task_count:tasks.length,received:by.size,missing:tasks.length-by.size,machine_points:results.reduce((s,r)=>s+r.points,0),maximum_machine_points:tasks.length*2,official:false,expert_review:'pending',model_run_claimed:false,semantic_and_native_review_required:true,results};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){
 const file=process.argv[2];if(!file)throw Error('Usage: node tests/ai-eval/aura-sinav-01/score.mjs predictions.jsonl');
 const raw=fs.readFileSync(file,'utf8').trim(),preds=raw?raw.split('\n').map(JSON.parse):[],r=score(loadTasks(),preds);r.predictions_sha256=sha(fs.readFileSync(file));r.grader_sha256=sha(fs.readFileSync(import.meta.filename));console.log(JSON.stringify(r,null,2));
}
