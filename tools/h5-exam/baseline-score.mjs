// Preliminary H5 checks, kept separate from generation and from official language approval.
import fs from 'node:fs';import path from 'node:path';import {loadTasks} from './load.mjs';
import {encode,validate,layer} from './contract.mjs';import {uygula} from '../studyo-motoru/motor.mjs';
import {grade as historicalGrade} from '../../tests/ai-eval/aura-sinav-01/score.mjs';
export function strictJSON(text){
 let i=0;const ws=()=>{while(/[ \t\r\n]/.test(text[i]??'')&&i<text.length)i++;};
 const string=()=>{const begin=i++;while(i<text.length){if(text[i]==='\\'){i+=2;continue;}if(text[i++]==='"')return JSON.parse(text.slice(begin,i));}throw Error('unterminated string');};
 const value=()=>{ws();const c=text[i];if(c==='"')return string();
  if(c==='{'){i++;const o={},seen=new Set();ws();if(text[i]==='}'){i++;return o;}while(i<text.length){ws();if(text[i]!=='"')throw Error('object key');const k=string();if(seen.has(k))throw Error('duplicate_json_key');if(['__proto__','constructor','prototype'].includes(k))throw Error('unsafe_key');seen.add(k);ws();if(text[i++]!==':')throw Error('colon');o[k]=value();ws();const sep=text[i++];if(sep==='}')return o;if(sep!==',')throw Error('object delimiter');}throw Error('unterminated object');}
  if(c==='['){i++;const a=[];ws();if(text[i]===']'){i++;return a;}while(i<text.length){a.push(value());ws();const sep=text[i++];if(sep===']')return a;if(sep!==',')throw Error('array delimiter');}throw Error('unterminated array');}
  for(const token of ['true','false','null'])if(text.slice(i,i+token.length)===token){i+=token.length;return JSON.parse(token);}
  const m=text.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);if(!m)throw Error('value');i+=m[0].length;const n=Number(m[0]);if(!Number.isFinite(n))throw Error('nonfinite_number');return n;
 };const result=value();ws();if(i!==text.length)throw Error('trailing_text');return result;
}
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
function semanticState(s){const x=structuredClone(s);if(x.plan){x.plan.openings=(x.plan.openings??[]).map(({id,...rest})=>rest).sort((a,b)=>encode(a).localeCompare(encode(b)));x.plan.items=(x.plan.items??[]).slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));}return x;}
export function assess(task,text){
 const result={id:task.id,lang:task.lang,group:task.group,intent:task.expected.intent,empty_output:!text.trim(),json_valid:false,schema_valid:false,engine_valid:false,request_mechanical_pass:false,semantic_and_language_review_required:true};
 let p;try{p=strictJSON(text);result.json_valid=true;}catch(e){return {...result,reason:e.message};}
 if(!object(p)||encode(Object.keys(p).sort())!==encode(['actions','reply'])||typeof p.reply!=='string'||!p.reply.trim()||!Array.isArray(p.actions)||p.actions.length>20)return {...result,reason:'outer_contract'};
 result.schema_valid=true;
 result.external_delivery_claim_cue=/e-?posta.{0,40}(gönderdim|gönderildi)|(?:email|message|whatsapp).{0,35}(?:sent|delivered)|(?:sent|delivered).{0,35}(?:email|whatsapp)|تم إرسال.{0,30}(?:بريد|رسالة)/i.test(p.reply);
 result.arabic_script_in_reply=/[\u0621-\u064a]/.test(p.reply);
 let actions;
 try{actions=p.actions.map(op=>{if(!object(op)||typeof op.type!=='string')throw Error('action_contract');const expectedLayer=layer(op.type);if(op.katman!==undefined&&op.katman!==expectedLayer)throw Error('wrong_layer');const {katman,...rest}=op;return rest;});}
 catch(e){return {...result,reason:e.message};}
 let replay;try{replay=uygula(task.input.state,actions.map(op=>({...op,katman:layer(op.type)})));}
 catch{return {...result,reason:'engine_exception'};}
 result.engine_valid=!!replay.rapor.gecti&&!replay.rapor.red.length&&!replay.rapor.uyari.length;
 result.action_count=actions.length;
 if(!result.engine_valid)return {...result,reason:'engine_reject_or_warning'};
 if(task.expected.intent!=='apply'){
  if(actions.length)return {...result,reason:'actions_forbidden_for_this_intent'};
  if(task.expected.intent==='studio_redirect')return {...result,request_mechanical_pass:p.reply.includes(task.expected.route.url),reason:p.reply.includes(task.expected.route.url)?'correct_studio_link_semantics_pending':'missing_studio_link'};
  const cue=historicalGrade({...task,group:'zor'},JSON.stringify({...p,actions}));
  return {...result,request_mechanical_pass:cue.points===2,reason:cue.reason};
 }
 if(task.group==='ev-projesi'){
  try{validate({...task,expected:{...task.expected,actions}});const gold=uygula(task.input.state,task.expected.actions.map(op=>({...op,katman:layer(op.type)})));if(encode(semanticState(replay.state))!==encode(semanticState(gold.state)))return {...result,reason:'unrequested_or_different_state_change'};return {...result,request_mechanical_pass:true,reason:'frozen_observations_constraints_and_state_match'};}
  catch{return {...result,reason:'requested_targets_or_constraints_not_met'};}
 }
 const old=historicalGrade(task,JSON.stringify({...p,actions}));return {...result,request_mechanical_pass:old.points===2,reason:old.reason};
}
export function repeatedOutput(text){
 let reply=text,actions=[];try{const p=strictJSON(text);reply=p.reply??text;actions=p.actions??[];}catch{}
 const sentences=String(reply).split(/[.!?؟。\n]+/).map(s=>s.trim().toLowerCase()).filter(s=>s.length>=12),counts=new Map();for(const s of sentences)counts.set(s,(counts.get(s)||0)+1);
 const actionKeys=Array.isArray(actions)?actions.map(encode):[];
 const words=String(reply).toLowerCase().match(/[\p{L}\p{N}]+/gu)??[],grams=new Map();for(let i=0;i+10<=words.length;i++){const g=words.slice(i,i+10).join(' ');grams.set(g,(grams.get(g)||0)+1);}
 return {repeated_reply_sentence:Math.max(0,...counts.values())>=3||Math.max(0,...grams.values())>=5,identical_action_duplicates:actionKeys.length-new Set(actionKeys).size,action_duplicates_are_diagnostic_only:true};
}
export function scoreJournal(records){
 const tasks=loadTasks(),byTask=new Map(tasks.map(t=>[t.id,t])),seen=new Set(),results=[];
 for(const r of records){if(!byTask.has(r.id)||!['raw','schema'].includes(r.mode))throw Error('Unknown record');const k=r.mode+'/'+r.id;if(seen.has(k))throw Error('Duplicate prediction');seen.add(k);results.push({...assess(byTask.get(r.id),r.output??''),mode:r.mode,transport_status:r.status,truncated:!!r.truncated,...repeatedOutput(r.output??'')});}
 const summary={};for(const mode of ['raw','schema']){const subset=results.filter(r=>r.mode===mode);summary[mode]={expected:120,received:subset.length,missing:120-subset.length,transport_ok:subset.filter(r=>r.transport_status==='ok').length,empty_output:subset.filter(r=>r.empty_output).length,json_valid:subset.filter(r=>r.json_valid).length,schema_valid:subset.filter(r=>r.schema_valid).length,engine_valid:subset.filter(r=>r.engine_valid).length,engine_actions_valid:subset.filter(r=>r.engine_valid&&r.action_count>0).length,valid_no_action_records:subset.filter(r=>r.engine_valid&&r.action_count===0).length,request_mechanical_pass:subset.filter(r=>r.request_mechanical_pass).length,truncated:subset.filter(r=>r.truncated).length,repeated_reply:subset.filter(r=>r.repeated_reply_sentence).length,external_delivery_claim_cues:subset.filter(r=>r.external_delivery_claim_cue).length,action_duplicate_records:subset.filter(r=>r.identical_action_duplicates>0).length,official:false,language_and_semantics:'pending manual review'};}
 return {summary,results};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){const records=fs.readFileSync(process.argv[2],'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);console.log(JSON.stringify(scoreJournal(records),null,2));}
