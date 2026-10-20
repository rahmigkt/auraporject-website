import {mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {VERSION, SYSTEM, hash, json, records} from './core.mjs';

const out = resolve(process.argv[2] || 'outputs/qwen-local/pilot-v1');
const {result, rejected} = records();
if (!result.length || ['train','dev','test'].some(s => !result.some(r => r.split === s))) throw Error('Empty split');
const files = {};
for (const split of ['train','dev','test']) files[`${split}.jsonl`] = result.filter(r => r.split === split).map(r => JSON.stringify(r)).join('\n') + '\n';
// Only training rows are exported to the trainer format. Evaluation targets stay separate.
files['sft-unreviewed.jsonl'] = result.filter(r => r.split === 'train').map(r => JSON.stringify({id:r.id, review:r.review, messages:[
  {role:'system',content:SYSTEM}, {role:'user',content:JSON.stringify(r.input)}, {role:'assistant',content:JSON.stringify(r.expected)}
]})).join('\n') + '\n';
files['dev-prompts.jsonl'] = result.filter(r => r.split === 'dev').map(r => JSON.stringify({id:r.id, messages:[{role:'system',content:SYSTEM},{role:'user',content:JSON.stringify(r.input)}]})).join('\n')+'\n';
files['rejected.json'] = json(rejected);
const sourceFiles = execFileSync('git',['ls-files','assets/forma'],{encoding:'utf8'}).trim().split(/\r?\n/).sort();
files['manifest.json'] = json({schema:VERSION, model:'Qwen/Qwen3.5-9B', trainingStarted:false,
  sources:Object.fromEntries(sourceFiles.map(p => [p,hash(readFileSync(p))])),
  files:Object.fromEntries(Object.entries(files).map(([name,content]) => [name,{sha256:hash(content)}])),
  counts:Object.fromEntries(['train','dev','test'].map(s => [s,result.filter(r => r.split===s).length])), rejected:rejected.length,
  splitPolicy:'first/second/third style per family held in train/dev/test; all seeds of group stay together; not a topology-generalisation benchmark',
  approval:'unreviewed; no official gold or aesthetic labels'});
// Never replace an existing frozen artifact with different bytes.
for (const [name, content] of Object.entries(files)) if (existsSync(join(out,name)) && readFileSync(join(out,name),'utf8') !== content) throw Error(`Refusing to overwrite ${name}; use a new version directory`);
mkdirSync(out,{recursive:true});
for (const [name,content] of Object.entries(files)) writeFileSync(join(out,name),content);
console.log(json({out,counts:JSON.parse(files['manifest.json']).counts,rejected:rejected.length}));
