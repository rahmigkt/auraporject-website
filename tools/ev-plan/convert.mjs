// Export plain Qwen/SFT messages, preserving the frozen design-family split.
// No training, model download or network calls.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dataset=path.resolve(process.argv[2]||'outputs/ev-qwen-00');
const destination=path.resolve(process.argv[3]||'outputs/ev-qwen-00/sft');
if(dataset===destination)throw Error('Use a separate export directory');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(fs.readFileSync(path.join(dataset,'manifest.json'),'utf8'));
for(const [name,expected] of Object.entries(manifest.sources)){
  const value=name.startsWith('origin/main:')
    ?execFileSync('git',['show',name],{cwd:root})
    :fs.readFileSync(path.resolve(root,name));
  if(hash(value)!==expected)throw Error(`STALE_DATASET: ${name}`);
}
fs.mkdirSync(destination,{recursive:true});
const result={contract:manifest.contract,source_fingerprint:manifest.source_fingerprint,converter_sha256:hash(fs.readFileSync(fileURLToPath(import.meta.url))),synthetic:true,human_reviewed:false,training_started:false,files:{}};
// Deduplicate whole designs before keeping their language/edit descendants.
// Project ids and random seeds alone must not make identical geometry "different".
const plansFile=path.join(dataset,'plans.jsonl');
if(hash(fs.readFileSync(plansFile))!==manifest.files['plans.jsonl'])throw Error('Plan records modified');
const signatures=new Set(),keepIds=new Set(),droppedIds=[];
for await(const line of readline.createInterface({input:fs.createReadStream(plansFile),crlfDelay:Infinity})){
  if(!line.trim())continue;
  const row=JSON.parse(line),p=row.plan;
  const geometry={spaces:p.spaces.map(s=>[s.level_id,s.kind,s.boundary_xy_mm]),columns:p.columns,stairs:p.stairs,site:p.site};
  const signature=hash(JSON.stringify(geometry));
  if(signatures.has(signature))droppedIds.push(row.id);
  else{signatures.add(signature);keepIds.add(row.id);}
}
result.deduplication={input_plans:keepIds.size+droppedIds.length,distinct_geometries:keepIds.size,dropped_plan_ids:droppedIds,policy:'First geometry retained; all language/edit descendants of duplicate plan ids removed from SFT. Raw research records retained for audit.'};
for(const split of ['train','validation','test']){
  const source=path.join(dataset,split+'.jsonl');
  if(hash(fs.readFileSync(source))!==manifest.files[split+'.jsonl'])throw Error(`Dataset modified: ${split}`);
  const target=path.join(destination,split+'.jsonl');
  const fd=fs.openSync(target,'w');let count=0;
  try{
    for await(const line of readline.createInterface({input:fs.createReadStream(source),crlfDelay:Infinity})){
      if(!line.trim())continue;
      const row=JSON.parse(line);
      if(row.split!==split||row.contract!==manifest.contract)throw Error('Split/contract mismatch');
      if(row.plan_id&&!keepIds.has(row.plan_id))continue;
      if(!row.messages.every(m=>['system','user','assistant'].includes(m.role)&&typeof m.content==='string'))throw Error('Bad chat message');
      // These are authored synthetic canned replies, not translations of customer data.
      // Keep the operation unchanged while matching the two known prompt languages.
      const english=row.variant.startsWith('en-')||/^(Can |I |Remove )/.test(row.messages.at(-2).content);
      if(english){
        const answer=JSON.parse(row.messages.at(-1).content);
        answer.reply=row.expected.mode==='clarification'
          ?'Is this an apartment or a detached home? How many bedrooms and floors, and what measurements?'
          :row.expected.mode==='refusal'
          ?'I cannot make an unapproved structural change; a designer and qualified specialist must review it.'
          :'This is a draft; measurements and the final project require designer approval.';
        row.messages.at(-1).content=JSON.stringify(answer);
      }
      fs.writeSync(fd,JSON.stringify({messages:row.messages})+'\n');count++;
    }
  }finally{fs.closeSync(fd);}
  result.files[split]={count,sha256:hash(fs.readFileSync(target))};
}
fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
