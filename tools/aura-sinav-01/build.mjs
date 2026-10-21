// Encode authored tasks and validate gold against the real studio; no model is loaded.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {FURNITURE,HOME,LAYOUT,TEXTILE,HARD} from './tasks.mjs';
import {design,room,items,emptyTextile,layer,encode,get} from './fixtures.mjs';
import {uygula} from '../studyo-motoru/motor.mjs';
const ROOT=path.resolve(import.meta.dirname,'../..'),OUT=path.join(ROOT,'tests/ai-eval/aura-sinav-01');
const hash=x=>createHash('sha256').update(x).digest('hex');
const rows=[];
function add(group,lang,text,state,actions,observations={},intent='apply',context={}){
 const id=`aura-sinav-${String(rows.length+1).padStart(3,'0')}`;
 const r={id,group,lang,source:{dataset:'AURA original closed assessment',record:id,license:'AURA original authored tasks',plan_id:state.plan?'exam-only-'+id:null,synthetic:true,training_forbidden:true},input:{lang,text,state,context},expected:{intent,actions,observations},review:'unreviewed',rubric:{full:group==='zor'?'No action; appropriate clarification/refusal in requested language, with truthful explanation; human semantic review required.':'All requested targets/constraints reached with valid studio actions; supplied product sizes and unrelated state preserved.',partial:group==='zor'?'No action but incomplete explanation or question; no false execution claim.':'At least one requested target/constraint reached, but another remains unmet; no unsafe or unrelated action.',zero:'Malformed JSON/unknown action, forbidden side effect, no requested target reached, impossible dimensions, invented coordinates, unsafe structural approval or unsupported factual claim.'}};
 if(actions.length){
  const v=uygula(state,actions.map(op=>({...op,katman:layer(op.type)})));
  assert(v.rapor.gecti,`${id}: ${JSON.stringify(v.rapor)}`);
  assert(!v.rapor.uyari.some(w=>['sigmiyor','sinira_takildi','kisit_karsilanmadi','kisit_anlasilmadi'].includes(w.kod)),`${id}: failed gold target ${JSON.stringify(v.rapor)}`);
  for(const [p,want]of Object.entries(observations))assert.deepEqual(get(v.state,p),want,`${id} ${p}`);
  r.expected.engine={version:v.rapor.surum,warning_codes:v.rapor.uyari.map(x=>x.kod),accepted:v.rapor.kabul.length,state_sha256:hash(encode(v.state))};
 }
 rows.push(r);
}
for(const[lang,text,family,action]of FURNITURE){
 const state={design:design(family)},actions=Array.isArray(action)?action:[action],observations={};
 for(const a of actions){const p=a.type==='material'?`/design/materials/${a.slot}/${a.key}`:`/design/params/${a.key}`;observations[p]=a.type==='delta'?(observations[p]??get(state,p))+a.value:a.value;}
 add('mobilya',lang,text,state,actions,observations);
}
HOME.forEach(([lang,text,type,a,b],i)=>{
 const state={plan:room(i,type==='small-room')};let action,obs;
 if(type==='room'||type==='small-room'){action={type:'oda_tanimla',id:'main',tur:a,ad:b};obs={'/plan/spaces/0/kind':a,'/plan/spaces/0/name':b};}
 else{action={type:'aciklik_ekle',wall_id:type==='door'?'entry-wall':'outer-wall',tur:type,konum:a,en:b};obs={'/plan/openings/0/kind':type,'/plan/openings/0/width':b,'/plan/openings/0/offset_from_wall_start':a};}
 add('ev-yerlesim',lang,text,state,[action],obs,'apply',{units:'mm',entry_wall_id:'entry-wall',exterior_wall_id:'outer-wall',room_id:'main'});
});
LAYOUT.forEach(([lang,text,kind,constraint,mm],i)=>{
 const esyalar=items(kind),state={plan:room(100+i)},kisitlar=[];
 state.plan.openings.push({id:'existing-entry',wall_id:'entry-wall',kind:'door',offset_from_wall_start:700,width:900,height:2100,sill_height:0});
 if(constraint==='both'||constraint==='face')kisitlar.push({tur:'bakar',a:'sofa',b:'tv'});
 if(constraint==='both')kisitlar.push({tur:'yakin',a:'coffee',b:'sofa',mm});
 const a={type:'yerlestir',oda:'main',esyalar,kisitlar};
 add('ev-yerlesim',lang,text,state,[a],{},'apply',{units:'mm',available_items:esyalar,room_id:'main',selected_product_dimensions_are_fixed:true});
});
for(const[lang,text,type,patch]of TEXTILE){const observations={};function flatten(x,p){for(const[k,v]of Object.entries(x))if(v&&typeof v==='object')flatten(v,p+'/'+k);else observations[p+'/'+k]=v;}flatten(patch,'/tekstil/'+(type==='perde'?'curtain':'rug'));add('tekstil',lang,text,emptyTextile(),[{type,...patch}],observations);}
for(const[lang,text,kind,intent]of HARD){
 let state={};if(kind==='no-fit')state={plan:room(200,false,true)};
 if(kind==='niche-conflict')state={niche:{width_mm:1000},fixed_product:{width_mm:2000}};
 if(kind==='out-of-range'||kind==='invalid-number'||kind==='missing-unit')state={design:design('seating')};
 if(kind==='bearing-wall'){state={plan:room(250)};state.plan.walls[0].load_bearing=true;}
 add('zor',lang,text,state,[],{},intent,{designer_review_required:true,missing_measurements_must_not_be_invented:true});
 rows.at(-1).expected.reason=kind;
 if(kind==='language-switch')rows.at(-1).input.lang='en';
}
assert.equal(rows.length,120);assert.deepEqual(Object.fromEntries(['mobilya','ev-yerlesim','tekstil','zor'].map(k=>[k,rows.filter(r=>r.group===k).length])),{mobilya:40,'ev-yerlesim':40,tekstil:20,zor:20});
assert.equal(rows.filter(r=>r.group==='mobilya'&&r.lang==='ar').length,5);
const payload=rows.map(encode).join('\n')+'\n';fs.mkdirSync(OUT,{recursive:true});
const dest=path.join(OUT,'gorevler.jsonl');if(fs.existsSync(dest)&&fs.readFileSync(dest,'utf8')!==payload)throw Error('Frozen task bytes differ; preserve this exam and create a reviewed new version');
fs.writeFileSync(dest,payload);
const manifest={version:'aura-sinav-01/1.2',files:{'gorevler.jsonl':{sha256:hash(payload),records:120}},groups:{mobilya:40,'ev-yerlesim':40,tekstil:20,zor:20},furniture_languages:[...new Set(FURNITURE.map(r=>r[0]))],furniture_arabic:5,engine_positive_cases:100,no_action_cases:20,expert_review:'pending_unreviewed_not_official_score',training_forbidden:true,model_run:false,source_tree_sha256:hash(execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:ROOT}))};
const frozen=path.join(OUT,'FREEZE.json');if(fs.existsSync(frozen)&&encode(JSON.parse(fs.readFileSync(frozen,'utf8')))!==encode(manifest))throw Error('Frozen source/manifest changed; create a reviewed new version');
fs.writeFileSync(path.join(OUT,'FREEZE.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('PASS 120 authored tasks; 100 positive gold engine validations; 20 no-action cases; 9 furniture languages including 5 Arabic; no model run');
