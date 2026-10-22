// Reproduce only the five G9a probes. No model weights, GPU or training mode.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const args=process.argv.slice(2),arg=(k,d)=>{const i=args.indexOf(k);return i<0?d:args[i+1];};
const data=arg('--data-dir','outputs/egitim-01'),out=arg('--output'),tokenizer=arg('--tokenizer-dir');
if(!out||!tokenizer||existsSync(out))throw Error('Fresh --output and local --tokenizer-dir required');
const ids=new Set(['ev-sohbet-dk:ev-sohbet-dk-02',...[1,2,3,4].map(i=>'ev-sohbet-it:ev-sohbet-it-0'+i)]);
const selected=[];
for(const name of ['train','dev'])for(const line of readFileSync(path.join(data,name+'.jsonl'),'utf8').split('\n').filter(Boolean)){
 const r=JSON.parse(line);if(ids.has(r.id))selected.push({id:r.id,line});
}
if(selected.length!==5||new Set(selected.map(r=>r.id)).size!==5)throw Error('Exactly the five distinct G9a source records must exist');
const input=path.join(out,'input'),result=path.join(out,'native');mkdirSync(input,{recursive:true});
writeFileSync(path.join(input,'train.jsonl'),selected.map(r=>r.line).join('\n')+'\n');writeFileSync(path.join(input,'dev.jsonl'),'');
const p=spawnSync(process.env.AURA_PYTHON||'python',['tools/qwen-local/train_gpu.py','--data-dir',input,'--dry-run','--samples','5','--tokenizer-dir',tokenizer,'--output',result],{encoding:'utf8',windowsHide:true,timeout:120000});
if(p.stdout)process.stdout.write(p.stdout);if(p.stderr)process.stderr.write(p.stderr);
process.exitCode=p.status??1;
