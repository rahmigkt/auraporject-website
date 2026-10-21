import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {uygula,SOZLUK} from '../studyo-motoru/motor.mjs';
import {DEFAULT,COLORS,RUGS} from '../../assets/ev/tekstil.js';
import {L} from './languages.mjs';
export const root=fileURLToPath(new URL('../../',import.meta.url));
export const dest=new URL('../../knowledge/ai-egitim/veri/hacim-1-istek/',import.meta.url);
export const langs=Object.keys(L),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export const canonical=x=>JSON.stringify(x,Object.keys(x).sort());
const colorIds=['kirik-beyaz','kum','adacayi','zeytin','kil','murekkep'];
const rugIds=['duz-dokuma','jut','kisa-hav','bukle','rolyef','uzun-hav'];
const kinds=['living','bedroom','kitchen','hall'];
const widths=[[400,420,440,460,480,500],[350,370,390,410,430,450],[300,320,340,360,380,400],[200,220,240,260,280,300],[250,270,290,310,330,350],[10,15,20,25,30,35],[105,115,125,135,145,155],[75,80,85,90,95,100],[185,195,205,215,225,235],[140,150,160,170,180,190],[80,85,90,95,100,105],[120,140,160,180,200,220],[65,75,85,95,105,115],[130,140,150,160,170,180],[],[],[5,15,35,55,75,95],[10,20,40,60,80,90],[],[]];
const pairs=[[0,14],[1,15],[2,16],[3,17],[0,18],[1,14],[2,15],[3,18],[4,14],[4,15],[5,16],[5,17],[6,14],[6,15],[7,18],[8,14],[8,15],[9,14],[9,17],[10,18],[11,15],[12,14],[13,18],[14,15],[16,17]];
export function initial(){
 const plan={walls:[],openings:[],spaces:[],items:[]};
 for(const [i,id] of ['living','bedroom','child','hall','dining'].entries()){
  const x=i*8000,w=id==='hall'?4000:6000,h=id==='hall'?3000:5000;
  const b=[[x,0],[x+w,0],[x+w,h],[x,h]];
  plan.spaces.push({id,kind:{child:'bedroom',dining:'living'}[id]||id,name:id,boundary_xy_mm:b});
  for(let j=0;j<4;j++)plan.walls.push({id:id+'-'+j,from_xy_mm:b[j],to_xy_mm:b[(j+1)%4],thickness:120});
  plan.openings.push({id:id+'-entry',wall_id:id+'-2',kind:'door',offset_from_wall_start:500,width:900,height:2100,sill_height:0,swing:'unknown'});
 }
 // Isolated wall study, separate from room walls. Moving it cannot break a room.
 plan.walls.push({id:'study-wall',from_xy_mm:[0,8000],to_xy_mm:[5000,8000],thickness:120});
 return {plan,tekstil:DEFAULT(),selection:{room:'living',wall:'study-wall',opening_wall:'living-0',new_room_origin_mm:[42000,0]}};
}
const get=(x,p)=>p.split('.').reduce((v,k)=>v?.[k],x);
export function intent(i,j,language,allowGulf=true){
 const l=L[language],n=widths[i]?.[j],cm=n*10;
 let v=i===14?l.rugs[j]:i===15||i===18?l.colors[j]:i===19?l.names[j]:'';
 let text=l.single[i];const gulf=allowGulf&&language==='ar'&&i*6+j<40;
 if(gulf)text=l.gulf[i];
 text=text.replaceAll('{n}',n).replaceAll('{v}',v);
 let op,observations=[];
 if(i<4){const h=[5000,4500,4000,3000][i],b=[[42000,0],[42000+cm,0],[42000+cm,h],[42000,h]];
  op={katman:'ev',type:'oda_tanimla',id:'new-'+kinds[i],tur:kinds[i],ad:kinds[i],kose:b};
  observations=[['plan.spaces.5.boundary_xy_mm',b],['plan.spaces.5.kind',kinds[i]]];
 }else if(i===4){op={katman:'ev',type:'duvar_ekle',id:'new-wall',from:[0,10000],to:[cm,10000]};observations=[['plan.walls.21.to_xy_mm',[cm,10000]]];}
 else if(i===5){op={katman:'ev',type:'duvar_tasi',id:'study-wall',dx:cm,dy:0};observations=[['plan.walls.20.from_xy_mm',[cm,8000]],['plan.walls.20.to_xy_mm',[5000+cm,8000]]];}
 else if(i===6||i===7){op={katman:'ev',type:'aciklik_ekle',id:'new-opening',wall_id:'living-0',tur:i===6?'window':'door',konum:i===6?1500:500,en:cm};observations=[['plan.openings.5.width',cm],['plan.openings.5.kind',op.tur],['plan.openings.5.offset_from_wall_start',op.konum]];}
 else if(i<14){
  const e=(tur,en,derinlik,id=tur)=>({tur,en,derinlik,id});
  const configs={8:['living',[e('sofa',cm,900),e('loveseat',1600,800),e('armchair',800,800)],[]],9:['bedroom',[e('bed',cm,2100),e('nightstand',450,400,'left-nightstand'),e('nightstand',450,400,'right-nightstand')],[]],10:['child',[e('bed',cm,2000),e('desk',1200,600)],[]],11:['bedroom',[e('wardrobe',cm,600)],[]],12:['hall',[e('shoe',cm,350)],[]],13:['dining',[e('dining',cm,900)],[]]};
  const [oda,esyalar,kisitlar]=configs[i];op={katman:'yerlesim',type:'yerlestir',oda,esyalar,kisitlar};
 }else if(i===14){assert(RUGS[rugIds[j]]);op={katman:'tekstil',type:'hali',construction:rugIds[j],on:true};observations=[['tekstil.rug.construction',rugIds[j]],['tekstil.rug.on',true]];}
 else if(i===15){assert(COLORS.some(c=>c[0]===colorIds[j]));op={katman:'tekstil',type:'perde',drape:{color:colorIds[j]}};observations=[['tekstil.curtain.drape.color',colorIds[j]]];}
 else if(i===16||i===17){const layer=i===16?'drape':'sheer';op={katman:'tekstil',type:'perde',[layer]:{open:n/100}};observations=[['tekstil.curtain.'+layer+'.open',n/100]];}
 else if(i===18){op={katman:'tekstil',type:'hali',color:colorIds[j]};observations=[['tekstil.rug.color',colorIds[j]]];}
 else{op={katman:'ev',type:'oda_tanimla',id:'living',ad:v};observations=[['plan.spaces.0.name',v]];}
 return {text,op,observations,gulf};
}
const motorCache=new Map();
export function checkTarget(row){
 for(const op of row.assistant.actions){assert(op.katman!=='mobilya','Furniture detail layer prohibited');assert(SOZLUK[op.katman]?.[op.type]);}
 const key=JSON.stringify([row.state,row.assistant.actions]);
 if(!motorCache.has(key))motorCache.set(key,uygula(row.state,row.assistant.actions));
 const r=structuredClone(motorCache.get(key)),mismatches=[];
 for(const [p,v] of row.expected.observations)if(JSON.stringify(get(r.state,p))!==JSON.stringify(v))mismatches.push({path:p,want:v,got:get(r.state,p)});
 for(const op of row.assistant.actions.filter(o=>o.type==='yerlestir')){
  const result=r.state.yerlesim?.[op.oda];if(!result?.ok)mismatches.push({room:op.oda,error:'does_not_fit'});
  for(const e of op.esyalar){const item=r.state.plan.items.find(x=>x.id===e.id&&x.space_id===op.oda);if(!item||item.size_mm.w!==e.en||item.size_mm.d!==e.derinlik)mismatches.push({item:e.id,error:'overall_size_or_presence'});}
 }
 if(!row.assistant.actions.length)assert.deepEqual(r.state,row.state);
 assert.equal(r.rapor.kabul.length,row.assistant.actions.length);
 return {report:r.rapor,target_mismatches:mismatches,state_sha256:hash(JSON.stringify(r.state))};
}
export function make(){
 const rows=[];
 for(const language of langs){const l=L[language];let sequence=0;
  function add(category,text,actions,observations,reply=l.done,gulf=false,group='clarification'){
   const state=initial();if(actions.some(a=>a.type==='aciklik_ekle'))state.selection.wall='living-0';
   const row={id:`hacim-istek-${language}-${String(++sequence).padStart(3,'0')}`,language,user_dialect:gulf?'gulf':language==='ar'?'msa':null,category,user:text,state,assistant:{reply,actions},expected:{observations},source:{type:'AURA original synthetic room studies',real_building:false,group},review:{status:'quarantine',producer:'Codex',required_reviewer:'Claude',cross_review_status:'pending',human_review_required:false,designer_approved:false,native_language_approved:false},training_started:false};
   row.motor=checkTarget(row);assert(row.motor.report.gecti);assert.deepEqual(row.motor.report.uyari,[],row.id);assert.deepEqual(row.motor.target_mismatches,[],row.id);rows.push(row);
  }
  for(let i=0;i<20;i++)for(let j=0;j<6;j++){const a=intent(i,j,language);add('single',a.text,[a.op],a.observations,l.done,a.gulf,'intent-'+i);}
  for(const [a,b]of pairs)for(let j=0;j<2;j++){const x=intent(a,j+2,language,false),y=intent(b,j+4,language,false);add('multiple',x.text+(language==='ar'?'؛ ':'; ')+y.text,[x.op,y.op],[...x.observations,...y.observations],l.done,false,`pair-${a}-${b}`);}
  for(const q of l.q)for(const r of l.rooms)add('clarify',q.replaceAll('{r}',r),[],[],l.ask);
  for(let i=0;i<l.out.length;i++)add('unsupported',l.out[i],[],[],i<7?l.redirect:l.unavailable,false,'out-'+i);
 }
 return rows;
}
export function write(){
 const rows=make();fs.mkdirSync(dest,{recursive:true});const files=[];
 for(const l of langs){const b=rows.filter(r=>r.language===l).map(r=>JSON.stringify(r)).join('\n')+'\n';fs.writeFileSync(new URL(l+'.jsonl',dest),b);files.push({path:l+'.jsonl',sha256:hash(b)});}
 const tree=execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:root});
 execFileSync('git',['diff','--exit-code','HEAD','--','assets','tools/studyo-motoru'],{cwd:root});
 const manifest={version:'hacim-istek/2-cross-review',source_commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),source_lock:{git_tree_sha256:hash(tree),scope:['assets/','tools/studyo-motoru/']},rows:rows.length,per_language:Object.fromEntries(langs.map(l=>[l,Object.fromEntries(['single','multiple','clarify','unsupported'].map(c=>[c,rows.filter(r=>r.language===l&&r.category===c).length]))])),gulf_rows:rows.filter(r=>r.user_dialect==='gulf').length,accepted:rows.filter(r=>r.motor.report.gecti).length,rejected:0,warnings:0,target_mismatches:0,qualified_training_rows:0,approval_policy:'Codex-authored records await Claude cross-review. Human/native review optional, not a required approval gate.',files,limitations:['Synthetic disconnected room studies; not real building plans or certified architecture','20 single-intent templates × 6 values; 25 operation pairs × 2; 10 clarification templates × 2 rooms; 10 scope refusals per language. Not 1800 independently sourced intentions.','No project dispatch or lighting action claimed: project layer only acknowledges operations; lighting absent from motor vocabulary','Claude cross-review and combined corpus semantic deduplication pending','Existing combined corpus count/splits and existing frozen exam task bytes are preserved']};
 fs.writeFileSync(new URL('sayim-raporu.json',dest),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({rows:manifest.rows,gulf:manifest.gulf_rows,accepted:manifest.accepted}));
 return rows;
}
if(process.argv[1]===fileURLToPath(import.meta.url))write();
