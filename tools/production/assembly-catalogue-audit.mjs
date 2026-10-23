import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {FAMILIES} from '../../assets/forma/families.js';import {STARTS} from '../../assets/forma/starts.js';
import {normalizeDesign,compileDesign} from '../../assets/forma/generate.js';import {assemblyCollisionAudit} from '../../assets/forma/production/assembly-collision.js';
const arg=k=>{const i=process.argv.indexOf(k);if(i<0||!process.argv[i+1])throw Error(k+' required');return process.argv[i+1];},journal=arg('--journal'),selected=process.argv.includes('--selected-profiles');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):/\.(js|wasm)$/.test(e.name)?[path.join(dir,e.name)]:[]);
const files=[...walk('assets/forma'),...walk('assets/vendor/manifold'),'tools/production/assembly-catalogue-audit.mjs'].sort();
const fingerprint=()=>{const hash=crypto.createHash('sha256');for(const p of files)hash.update(p.replaceAll('\\','/')+'\0').update(fs.readFileSync(p));return hash.digest('hex');};
const fp=fingerprint(),done=new Set(),counts={};let rows=[];
const append=o=>fs.appendFileSync(journal,JSON.stringify(o)+'\n');
if(fs.existsSync(journal)){
 const text=fs.readFileSync(journal,'utf8');if(!text.endsWith('\n'))throw Error('Incomplete journal tail;preserve and inspect before resuming');rows=text.trim().split('\n').map(s=>JSON.parse(s));
 if(rows[0].fingerprint!==fp||rows[0].selected_profiles!==selected)throw Error('Journal/runtime fingerprint mismatch;old evidence preserved');
 for(const r of rows.filter(r=>r.type==='model')){if(done.has(r.id))throw Error('Duplicate model in journal');done.add(r.id);counts[r.status]=(counts[r.status]||0)+1;}
}else append({type:'header',fingerprint:fp,selected_profiles:selected,created_at:new Date().toISOString(),scope:'Static manufactured-stock solid check for445starts;not whole-product,motion,load or manual semantic approval'});
for(const family of ['seating','table','storage','kitchen','bath'])for(const[kind,entries]of Object.entries(FAMILIES[family].starts||STARTS[family]))for(const [index,e]of entries.entries()){
 const id=`${family}/${kind}/${index}/${e.style}/${e.seed}`;if(done.has(id))continue;
 if(done.size%20===0&&fingerprint()!==fp){append({type:'abort',reason:'Runtime changed',at:new Date().toISOString()});throw Error('Runtime changed;new mixed rows cannot be used as validated evidence');}
 const params={...e.p,...(selected?{hingeSystem:'blum-110-inserta-expando',runnerSystem:'hettich-ka5632-ss-2025',runnerFixingSystem:'hettich-6x14-trial',shelfSupportSystem:'hettich-16181',railSystem:'hettich-sl786',connectorSystem:'rastex15-18-du232t',backConstruction:'module-grooved'}:{})};
 const design=normalizeDesign({family,kind,style:e.style,seed:e.seed,params,materials:e.m}),designHash=crypto.createHash('sha256').update(JSON.stringify(design)).digest('hex');let row;
 try{const result=await assemblyCollisionAudit(compileDesign(design),design,{motion:false});row={type:'model',id,design_sha256:designHash,status:result.status,result};}
 catch(error){row={type:'model',id,design_sha256:designHash,status:error.message==='Invalid manufacturing inputs;no assembly pass'?'input_rejected':'audit_error',error:error.message,production_approved:false};}
 append(row);done.add(id);counts[row.status]=(counts[row.status]||0)+1;
 if(done.size%50===0)console.log(JSON.stringify({models:done.size,counts}));
}
if(done.size!==445||fingerprint()!==fp){append({type:'abort',reason:'Final count/fingerprint failure'});throw Error('Final journal/source check failed');}
const summary={type:'end',models:done.size,counts,fingerprint:fp,source_hash_confirmed:true,production_approved:0,completed_at:new Date().toISOString()};append(summary);console.log(JSON.stringify(summary));
