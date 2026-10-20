// Offline checks only. Builders, screenshot capture and model/scoring runs are not tests.
import {spawn} from 'node:child_process';
import {readdirSync, mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const python=process.env.AURA_PYTHON||'python';
const out=path.resolve(root,process.env.AURA_TEST_OUTPUT||'work/toparlama-tests');
mkdirSync(out,{recursive:true});
const jobs=readdirSync(path.join(root,'tests')).filter(f=>/\.(mjs|py)$/.test(f)&&f!=='hepsi.mjs').sort().map(f=>({file:`tests/${f}`,args:[]}));
for(const f of ['test-01b.mjs','test-uzman-onay.mjs','verify-01b.mjs'])jobs.push({file:`tests/ai-eval/${f}`,args:[]});
jobs.push({file:'tests/text-eval/verify-stage1.mjs',args:[]});
for(const dir of ['tools/ev-plan','tools/ev-sohbet','tools/perde'])for(const f of readdirSync(path.join(root,dir)).filter(f=>/^test.*\.py$/.test(f)).sort())jobs.push({file:`${dir}/${f}`,args:[]});
for(const batch of ['02','uk-ie','dk','es','it'])jobs.push({file:'tools/ev-sohbet/verify02.mjs',args:[`knowledge/ai-egitim/veri/ev-sohbet-${batch}`],id:`replay-${batch}`});
const results=[];
function inventory(dir){return readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?inventory(`${dir}/${e.name}`):[/\.(mjs|py|cjs)$/.test(e.name)?`${dir}/${e.name}`:null]).filter(Boolean);}
const selected=new Set(jobs.map(j=>j.file));
const notRun=inventory('tests').filter(f=>f!=='tests/hepsi.mjs'&&!selected.has(f)).map(file=>({file,reason:file.startsWith('tests/visual/')?'Interactive capture/render utility; needs browser/server, not an offline assertion suite.':'Scorer, report builder, approval importer or shared utility; not an executable assertion suite.'}));
for(const job of jobs){
 const id=job.id||job.file,begin=Date.now(),exe=job.file.endsWith('.py')?python:process.execPath;
 const result=await new Promise(resolve=>{
  let stdout='',stderr='',timedOut=false;
  const child=spawn(exe,[job.file,...job.args],{cwd:root,env:{...process.env,PYTHONIOENCODING:'utf-8'},windowsHide:true});
  const timer=setTimeout(()=>{timedOut=true;child.kill();resolve({code:null,timedOut,stdout,stderr});},Number(process.env.AURA_TEST_TIMEOUT_MS||180000));
  child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
  child.on('error',e=>{clearTimeout(timer);resolve({code:null,error:e.message,stdout,stderr});});
  child.on('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal,timedOut,stdout,stderr});});
 });
 const row={id,...job,...result,milliseconds:Date.now()-begin};results.push(row);
 console.log(`${result.code===0?'PASS':'FAIL'} ${id}`);
 writeFileSync(path.join(out,'results.json'),JSON.stringify({scope:'offline-unit-and-replay',not_run:notRun,results},null,2)+'\n');
}
const failed=results.filter(r=>r.code!==0);
console.log(`${results.length-failed.length}/${results.length} passed; report ${out}`);
process.exitCode=failed.length?1:0;
