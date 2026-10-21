// CPU only. Journal one complete source result at a time; refuse stale/partial journals.
import {readFileSync,writeFileSync,appendFileSync,mkdirSync,existsSync,readdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Worker} from 'node:worker_threads';
import {convert,sha,LANGS} from './h4.mjs';
import {audit,loadExam} from '../hacim-istek/leakage.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));process.chdir(root);
const args=process.argv.slice(2),arg=(key,def)=>{const i=args.indexOf(key);return i<0?def:args[i+1];};
const src=arg('--source','knowledge/ai-egitim/veri/yerlesim/procthor-aura-cozucu.jsonl.gz');
const journal=arg('--journal','work/h4-replay.jsonl'),out=arg('--out','knowledge/ai-egitim/veri/yerlesim-kisit');
const limit=Number(arg('--limit',String(Number.MAX_SAFE_INTEGER)));
const workers=Number(arg('--workers','4'));
if(!Number.isSafeInteger(limit)||limit<1)throw Error('Positive integer --limit required');
if(!Number.isSafeInteger(workers)||workers<1||workers>8)throw Error('--workers must be 1..8');
const raw=readFileSync(src),sources=gunzipSync(raw).toString('utf8').trim().split('\n').map(JSON.parse);
if(new Set(sources.map(r=>r.id)).size!==sources.length)throw Error('Duplicate source IDs');
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const codeFiles=[...walk('assets').filter(p=>p.endsWith('.js')),...walk('tools/studyo-motoru').filter(p=>p.endsWith('.mjs')),
 'tools/yerlesim-veri/h4.mjs','tools/yerlesim-veri/h4-diller.mjs','tools/yerlesim-veri/h4-donustur.mjs','tools/yerlesim-veri/h4-worker.mjs','tools/yerlesim-veri/cozucu_ornekleri.mjs','tools/hacim-istek/leakage.mjs'];
const {tasks,sha256:examHash}=loadExam(),fingerprint=sha(JSON.stringify({source:sha(raw),exam:examHash,code:codeFiles.sort().map(p=>[p.replaceAll('\\','/'),sha(readFileSync(p))])}));
const header={kind:'H4-replay/1',fingerprint,source_sha256:sha(raw),source_rows:sources.length,exam_sha256:examHash};
mkdirSync(path.dirname(journal),{recursive:true});
let results=[];
if(existsSync(journal)){
 const text=readFileSync(journal,'utf8');if(!text.endsWith('\n'))throw Error('Incomplete journal; preserve it and use a fresh --journal');
 const rows=text.trim().split('\n').map(JSON.parse),old=rows.shift();
 if(JSON.stringify(old)!==JSON.stringify(header))throw Error('Stale journal; inputs/engine/converter/exam changed; use a fresh --journal');
 results=rows;
 if(results.length>sources.length||new Set(results.map(r=>r.index)).size!==results.length||results.some(r=>r.id!==sources[r.index]?.id))throw Error('Journal ordering/identity mismatch');
}else writeFileSync(journal,JSON.stringify(header)+'\n');
const screens=new Map();
const completed=new Set(results.map(r=>r.index));
const queue=sources.map((source,index)=>({source,index})).filter(r=>!completed.has(r.index)).slice(0,limit);
const finish=({index,result:r})=>{
 if(r.status==='accepted'){
  const input=JSON.parse(r.row.mesajlar[0].metin),key=r.row.dil+'|'+input.istek;
  if(!screens.has(key))screens.set(key,audit([{id:'template',language:r.row.dil,user:input.istek}],tasks).hits);
  if(screens.get(key).length){r.status='excluded';r.reason='exam_near_duplicate';delete r.row;}
 }
 r.index=index;appendFileSync(journal,JSON.stringify(r)+'\n');results.push(r);
 if(results.length%10===0)console.log(JSON.stringify({processed:results.length,total:sources.length,accepted:results.filter(r=>r.status==='accepted').length}));
};
await new Promise((resolve,reject)=>{
 if(!queue.length){resolve();return;}
 const pool=[];let cursor=0,received=0,stopped=false;
 const stop=()=>{stopped=true;for(const worker of pool)worker.terminate();};
 const error=e=>{if(!stopped){stop();reject(e);}};
 for(let i=0;i<Math.min(workers,queue.length);i++){
  const worker=new Worker(new URL('./h4-worker.mjs',import.meta.url));pool.push(worker);
  worker.on('error',error);worker.on('exit',code=>{if(!stopped)error(Error('Replay worker exited early: '+code));});
  worker.on('message',message=>{try{finish(message);received++;if(received===queue.length){stop();resolve();}else if(cursor<queue.length)worker.postMessage(queue[cursor++]);}catch(e){error(e);}});
  worker.postMessage(queue[cursor++]);
 }
});
results.sort((a,b)=>a.index-b.index);
const accepted=results.filter(r=>r.status==='accepted').map(r=>r.row),excluded=results.filter(r=>r.status==='excluded');
const count=(rows,key)=>rows.reduce((a,r)=>{const k=key(r);a[k]=(a[k]||0)+1;return a;},{});
const report={version:'H4/1',...header,complete:results.length===sources.length,processed:results.length,accepted:accepted.length,excluded:excluded.length,
 source_outcomes:count(sources,r=>String(r.ok)),outcomes:count(accepted,r=>r.expected.classification),languages:count(accepted,r=>r.dil),
 source_houses:new Set(sources.map(r=>`${r.source.split}:${r.source.house}`)).size,accepted_houses:new Set(accepted.map(r=>r.grup)).size,
 constraints:count(accepted.flatMap(r=>r.expected.constraints),r=>r.tur),without_constraints:accepted.filter(r=>!r.expected.constraints.length&&r.expected.fit).length,
 excluded_reasons:count(excluded,r=>r.reason),exam_leakage_hits:excluded.filter(r=>r.reason==='exam_near_duplicate').length,
 requested_languages:LANGS,training_exported:0,cross_review:'Codex transformations require Claude; original Claude placement review remains separate (C7)',
 provenance_policy:'ProcTHOR procedural geometry, Apache-2.0; AURA solver furniture sizes; heights recovered from tracked generator constants. Opening heights absent in source remain absent (engine fallback). Duplicate furniture names never assigned invented source placement IDs.',
 no_fit_policy:'Current bounded engine search finds no solution; target has no actions and asks about removing a piece. Not a geometric impossibility proof.',
 motor_policy:'Fresh full-size solve; all derived constraints checked independently; outcome/size/item/constraint mismatch excluded. No target coordinates.',
 limitations:['One language per source room, distributed deterministically over nine languages; no extra unique rooms claimed for translations','Cross-review/native style and designer quality are not inferred from mechanical checks','Lexical exam screening does not prove absence of semantic or cross-language paraphrases','No GPU, model, training, paid API or deployment']};
mkdirSync(out,{recursive:true});mkdirSync(path.join(out,'denetim'),{recursive:true});
writeFileSync(path.join(out,'adaylar.jsonl'),accepted.map(r=>JSON.stringify(r)).join('\n')+(accepted.length?'\n':''));
writeFileSync(path.join(out,'denetim','dislanan.jsonl'),excluded.map(r=>JSON.stringify(r)).join('\n')+(excluded.length?'\n':''));
report.candidates_sha256=sha(readFileSync(path.join(out,'adaylar.jsonl')));
writeFileSync(path.join(out,'rapor.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
