import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sample,normalizeDesign} from '../../assets/forma/generate.js';
import {vocabulary,sanitizeActions} from '../../assets/forma/ai.js';
import {uygula} from '../studyo-motoru/motor.mjs';
import {packs} from './languages.mjs';
export const root=fileURLToPath(new URL('../../',import.meta.url));
export const dest=new URL('../../knowledge/ai-egitim/veri/hacim-1-komut/',import.meta.url);
export const langs=['tr','en','de','fr','nl','da','es','it','ar'];
export const hash=b=>createHash('sha256').update(b).digest('hex');
export const canonical=x=>JSON.stringify(x);
const dim=(family,key,values,scale=10)=>({family,key,values,scale});
const mat=(family,slot,key,lex,values)=>({family,slot,key,lex,values});
export const specs=[
 dim('seating','width',[201,213,226,239,252,267]),dim('seating','depth',[86,89,93,97,101,105]),
 dim('seating','seatHeight',[40,42,43,46,48,50]),dim('seating','armHeight',[57,59,61,65,69,73]),
 dim('seating','cushionThickness',[11,12,14,15,17,18]),dim('seating','armWidth',[7,9,12,14,16,18]),
 dim('table','length',[171,183,197,211,227,243]),dim('table','width',[82,86,91,96,101,108]),
 dim('table','height',[71,73,76,77,78,79]),dim('table','topThickness',[24,28,32,38,42,46],1),
 dim('storage','width',[181,193,207,221,237,253]),dim('storage','depth',[54,56,58,62,64,66]),
 dim('storage','height',[201,211,221,231,249,259]),
 mat('seating','fabric','color','colors',['cream','navy','sage','anthracite','sand','rust']),
 mat('seating','fabric','fiber','fibers',['linen','cotton','wool','velvet','boucle','chenille']),
 mat('seating','wood','stain','stains',['lightOak','cherry','darkWalnut','black','white','teak']),
 mat('table','top','species','woods',['oak','walnut','ash','beech','cherry','teak']),
 mat('table','top','stain','stains',['lightOak','cherry','darkWalnut','black','white','teak']),
 mat('storage','front','color','colors',['cream','navy','sage','anthracite','sand','rust']),
 mat('storage','case','species','woods',['oak','walnut','ash','beech','cherry','teak'])
];
// Independent source intents; never derived from held-out exam text/targets.
const pairs=[[0,13],[1,14],[2,15],[3,13],[4,14],[5,15],[0,1],[2,3],[4,5],[13,14],
 [6,16],[7,17],[8,16],[9,17],[6,7],[8,9],[16,17],
 [10,18],[11,19],[12,18],[10,11],[11,12],[10,19],[12,19],[18,19]];
function design(family){
 let d=sample({family,kind:{seating:'sofa',table:'dining',storage:'wardrobe'}[family],style:'aura',seed:31});
 if(family==='seating')Object.assign(d.params,{width:2300,depth:950,seatHeight:450,armHeight:620,cushionThickness:160,armWidth:100,armType:'square',seatType:'bench',backType:'tight',legHeight:140,legSize:40});
 if(family==='table')Object.assign(d.params,{length:2000,width:1000,height:750,topThickness:35,topShape:'rect',baseType:'legsApron',legSize:65});
 if(family==='storage')Object.assign(d.params,{width:2400,depth:600,height:2400});
 if(d.materials.fabric)Object.assign(d.materials.fabric,{fiber:'leather',pattern:'none',color:'white'});
 if(d.materials.wood)Object.assign(d.materials.wood,{species:'gurgen',stain:'natural'});
 if(d.materials.top)Object.assign(d.materials.top,{surface:'wood',species:'gurgen',stain:'natural'});
 if(d.materials.case)Object.assign(d.materials.case,{surface:'wood',species:'gurgen'});
 if(d.materials.front)Object.assign(d.materials.front,{surface:'lacquer',color:'white'});
 return normalizeDesign(d);
}
const action=(i,j)=>{const s=specs[i];return s.slot?{type:'material',slot:s.slot,key:s.key,value:s.values[j]}:{type:'set',key:s.key,value:s.values[j]*s.scale};};
function phrase(p,i,j,gulf=false){const s=specs[i];return (gulf?p.gulf[i]:p.frames[i]).replace('{v}',s.lex?p[s.lex][j]:s.values[j]);}
export function checkTarget(row){
 const actions=row.assistant.actions,v=vocabulary(row.state.design);
 if(JSON.stringify(sanitizeActions(actions,v))!==JSON.stringify(actions))throw Error('Invalid vocabulary: '+row.id);
 const output=uygula(row.state,actions.map(a=>({katman:'mobilya',...a})));
 const mismatches=actions.flatMap(a=>{
  const got=a.type==='material'?output.state.design.materials[a.slot]?.[a.key]:output.state.design.params[a.key];
  return got!==a.value?[{action:a,got}]:[];
 });
 if(!actions.length&&JSON.stringify(output.state)!==JSON.stringify(row.state))throw Error('No-action state mutation');
 return {report:output.rapor,target_mismatches:mismatches,after_sha256:hash(JSON.stringify(output.state)),vocabulary_sha256:hash(JSON.stringify(v))};
}
export function make(){
 const rows=[];
 for(const language of langs){
  const p=packs[language];if(p.frames.length!==20||p.ask.length!==20||p.unsupported.length!==10)throw Error(language);
  const add=(category,text,reply,actions,family,group,dialect='standard')=>{
   const row={id:`h1-${language}-${String(rows.filter(r=>r.language===language).length+1).padStart(3,'0')}`,language,country:null,category,user_dialect:dialect,semantic_group:group,state:{design:design(family)},user:text,assistant:{reply,actions},source:{author:'AURA Codex authored candidate phrase families',license:'AURA original authored text',synthetic:true,human_authored:false},review:{status:'quarantine',designer_approved:false,native_language_approved:false}};
   row.motor=checkTarget(row);rows.push(row);
  };
  for(let i=0;i<20;i++)for(let j=0;j<6;j++){
   const gulf=language==='ar'&&i*6+j<40;
   add('single',phrase(p,i,j,gulf),p.done,[action(i,j)],specs[i].family,`single-${i}`,gulf?'gulf':'standard');
  }
  for(let n=0;n<pairs.length;n++)for(let j=0;j<2;j++){
   const [a,b]=pairs[n];if(specs[a].family!==specs[b].family)throw Error('Cross-family pair');
   add('multiple',phrase(p,a,j+2)+p.join+phrase(p,b,j+4),p.done,[action(a,j+2),action(b,j+4)],specs[a].family,`multiple-${a}-${b}`);
  }
  p.ask.forEach(([u,r],i)=>add('clarify',u,r,[],'seating',`clarify-${i}`));
  p.unsupported.forEach(([u,r],i)=>add('unsupported',u,r,[],'seating',`unsupported-${i}`));
 }
 return rows;
}
export function write(){
 const rows=make();mkdirSync(dest,{recursive:true});
 for(const lang of langs)writeFileSync(new URL(lang+'.jsonl',dest),rows.filter(r=>r.language===lang).map(r=>JSON.stringify(r)).join('\n')+'\n');
 const tree=execFileSync('git',['ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],{cwd:root});
 const manifest={version:'hacim-1-komut/1',rows:rows.length,qualified:0,quarantined:rows.length,source_lock:{git_tree_sha256:hash(tree),scope:['assets/','tools/studyo-motoru/']},language_counts:Object.fromEntries(langs.map(l=>[l,rows.filter(r=>r.language===l).length])),category_counts:Object.fromEntries(['single','multiple','clarify','unsupported'].map(c=>[c,rows.filter(r=>r.category===c).length])),gulf_user_rows:rows.filter(r=>r.user_dialect==='gulf').length,motor_accepted:rows.filter(r=>r.motor.report.gecti).length,target_mismatches:rows.filter(r=>r.motor.target_mismatches.length).map(r=>r.id),motor_rejected:rows.filter(r=>r.motor.report.red.length).map(r=>r.id),warning_codes:Object.fromEntries([...new Set(rows.flatMap(r=>r.motor.report.uyari.map(w=>w.kod)))].sort().map(k=>[k,rows.filter(r=>r.motor.report.uyari.some(w=>w.kod===k)).length])),files:langs.map(l=>({path:l+'.jsonl',sha256:hash(readFileSync(new URL(l+'.jsonl',dest)))})),limitations:['Template families with six grounded values, not 1800 independently collected human utterances','Designer and native-language reviews pending; heuristic language checks are not approval','Three furniture families; kitchen/bath and enum/delta changes are not covered in H1 v1','Existing combined count/splits preserved; its old conversation evidence is revalidated separately; H1 remains a separate quarantine']};
 writeFileSync(new URL('sayim-raporu.json',dest),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({rows:rows.length,motor_accepted:manifest.motor_accepted,mismatches:manifest.target_mismatches,rejected:manifest.motor_rejected,warnings:manifest.warning_codes}));
}
if(process.argv[1]===fileURLToPath(import.meta.url))write();
