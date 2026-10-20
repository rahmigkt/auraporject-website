// Main-synchronised preparation; no model loading, network inference or training.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {sample} from '../../assets/forma/generate.js';
import {FAMILIES} from '../../assets/forma/families.js';
import {vocabulary,sanitizeActions} from '../../assets/forma/ai.js';
export const ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const sha=x=>createHash('sha256').update(x).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).trim();
export function snapshot(){
  // Include every tracked asset, not just the modules imported by this generator.
  const tree=git('ls-tree','-r','origin/main','--','assets','api');
  git('diff','--exit-code','origin/main','--','assets','api');
  if(git('ls-files','--others','--exclude-standard','--','assets','api'))throw Error('Untracked studio sources; review first');
  return {main:git('rev-parse','origin/main'),sourceSha256:sha(tree),tree};
}
export function messages(input){
  const php=process.env.PHP_BIN||'php';
  const result=JSON.parse(execFileSync(php,[resolve(ROOT,'tools/qwen-local/live_contract.php')],{input:JSON.stringify(input),encoding:'utf8',maxBuffer:100*1024*1024}));
  return Array.isArray(input)?result.map(r=>r.messages):result.messages;
}
export function validate(answer,v){
  if(!answer||Array.isArray(answer)||typeof answer!=='object'||!Array.isArray(answer.actions)||typeof answer.reply!=='string'||!answer.reply.trim())return false;
  if(Object.keys(answer).some(k=>!['actions','reply'].includes(k))||answer.actions.length>20)return false;
  const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
  const filtered=sanitizeActions(answer.actions,v);
  return JSON.stringify(canonical(filtered))===JSON.stringify(canonical(answer.actions));
}
const labels={width:['genişliği','width'],height:['yüksekliği','height'],depth:['derinliği','depth'],length:['uzunluğu','length'],seatHeight:['oturma yüksekliğini','seat height'],topThickness:['tabla kalınlığını','top thickness']};
export function candidates(){
  const rows=[],coverage=[];
  for(const family of Object.keys(FAMILIES))for(const seed of [11,22,33]){
    const design=sample({family,seed}),v=vocabulary(design),group=`${family}/${seed}`;
    const add=(tag,text,actions,reply,lang='tr',decision='edit',natural=true)=>{
      const input={text,design,vocabulary:v,lang};
      const expected={actions,reply};if(!validate(expected,v))throw Error('Invalid target '+tag);
      rows.push({id:sha(`${group}/${tag}`).slice(0,24),group,split:seed===11?'train':seed===22?'dev':'test',review:'unreviewed',decision,natural,
        input,expected,replay:'pending_browser',targetOrigin:'deterministic_template_not_expert_gold'});
    };
    for(const[key,range]of Object.entries(v.params)){
      if(!Number.isFinite(design.params[key])){coverage.push({family,key,status:'unsupported_non_numeric'});continue;}
      const step=FAMILIES[family].mod.RANGES[key]?.[2]||1;
      const value=design.params[key]+step<=range[1]?design.params[key]+step:design.params[key]-step;
      if(value<range[0]){coverage.push({family,key,status:'no_valid_step'});continue;}
      const natural=!!labels[key],tr=labels[key]?.[0]||key,en=labels[key]?.[1]||key;
      add(`set/${key}/tr`,`${tr} ${value} milimetre yapar mısın?`,[{type:'set',key,value}],'Ölçüyü güncelledim.','tr','edit',natural);
      add(`set/${key}/en`,`Please set the ${en} to ${value} millimetres.`,[{type:'set',key,value}],'Updated the measurement.','en','edit',natural);
      const delta=value-design.params[key];
      add(`delta/${key}`,`${tr} ${Math.abs(delta)} mm ${delta>0?'artır':'azalt'}.`,[{type:'delta',key,value:delta}],'Ölçüyü değiştirdim.','tr','edit',natural);
      coverage.push({family,key,status:natural?'natural_numeric':'needs_human_label'});
    }
    for(const[key,options]of Object.entries(v.enums))if(options.length)add(`enum/${key}`,`${key} için ${options[0]} seç.`,[{type:'enum',key,value:options[0]}],'Seçimi değiştirdim.','tr','edit',false);
    for(const[slot,spec]of Object.entries(v.materials))for(const[key,options]of Object.entries(spec))if(options.length)add(`material/${slot}/${key}`,`${slot} malzemesinin ${key} seçimi ${options[0]} olsun.`,[{type:'material',slot,key,value:options[0]}],'Malzeme seçimini değiştirdim.','tr','edit',false);
    for(const type of ['style','kind'])for(const value of v[type==='style'?'styles':'kinds'])add(`${type}/${value}`,`${type} olarak ${value} seç.`,[{type,value}],'Seçimi değiştirdim.','tr','edit',false);
    add('clarify/tr','Bunu değiştir.',[],'Hangi ölçüyü veya malzemeyi değiştireyim?','tr','clarify');
    add('clarify/en','Change it.',[],'Which measurement or material should I change?','en','clarify');
    add('refuse/tr','Ahşap olmasın. Başka bir şey seçmedim.',[],'Ahşap yerine hangi malzemeyi tercih edersiniz?','tr','refuse');
    add('refuse/en','Do not change anything.',[],'What would you like to change instead?','en','refuse');
    const keys=['width','height','depth','length'].filter(k=>v.params[k]&&Number.isFinite(design.params[k])).slice(0,2);
    if(keys.length===2){const actions=keys.map(key=>({type:'set',key,value:design.params[key]}));add('multi/tr',keys.map(key=>`${labels[key]?.[0]||key} ${design.params[key]} mm yap`).join(', ')+'.',actions,'İki ölçüyü ayarladım.','tr','edit',keys.every(k=>labels[k]));}
  }
  const prompts=messages(rows.map(r=>r.input));
  rows.forEach((r,i)=>{r.messages=prompts[i];});
  return {rows,coverage};
}
export function invalidate(out,current){
  mkdirSync(out,{recursive:true});
  for(const name of readdirSync(out))if(name.startsWith('run-')){
    const path=resolve(out,name,'manifest.json');let old;try{old=JSON.parse(readFileSync(path,'utf8'));}catch{continue;}
    if(old.source.sourceSha256!==current.sourceSha256)writeFileSync(resolve(out,name,'STALE.json'),JSON.stringify({reason:'main studio sources changed',previous:old.source.sourceSha256,current:current.sourceSha256},null,2)+'\n');
  }
}
function markLegacy(current){
  const lock=JSON.parse(readFileSync(resolve(ROOT,'outputs/qwen-local/studio-source-lock.json'),'utf8'));
  const changed=Object.entries(lock.files).filter(([name,hash])=>sha(readFileSync(resolve(ROOT,name),'utf8').replaceAll('\r\n','\n'))!==hash).map(([name])=>name);
  if(changed.length)writeFileSync(resolve(ROOT,'outputs/qwen-local/studio-v1/STALE.json'),JSON.stringify({status:'stale_not_for_new_training',currentMain:current.main,previous:lock.source_commit,changed},null,2)+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  git('fetch','origin','main');
  const source=snapshot(),out=resolve(ROOT,'outputs/qwen-local/yerel-02');invalidate(out,source);markLegacy(source);
  const {rows,coverage}=candidates(),run=resolve(out,`run-${source.sourceSha256.slice(0,12)}`);mkdirSync(run,{recursive:true});
  const files={'candidates.jsonl':rows.map(JSON.stringify).join('\n')+'\n','coverage.json':JSON.stringify(coverage,null,2)+'\n'};
  // This is a review candidate pool, deliberately not training-ready or a frozen benchmark.
  for(const[name,contents]of Object.entries(files))writeFileSync(resolve(run,name),contents);
  writeFileSync(resolve(run,'manifest.json'),JSON.stringify({schema:'aura.studio.review/2',source,files:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,sha(v)])),count:rows.length,trainingReady:false,closedBenchmarkFrozen:false,requires:['browser replay','human review','freeze benchmark','local CUDA readiness']},null,2)+'\n');
  console.log(JSON.stringify({output:relative(ROOT,run),count:rows.length,trainingReady:false}));
}
