import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const base=path.resolve('work');mkdirSync(base,{recursive:true});const dir=mkdtempSync(path.join(base,'h4-journal-test-'));
const fixture=(i,ok)=>({id:`aura-cozucu-train-${i}-room|0`,source:{dataset:'ProcTHOR-10K',license:'Apache-2.0',house:i,room:'room|0',split:'train'},ok,
 messages:[{role:'user',content:ok?'Yatak odası, 20 m². Köşeler (mm): [[0,0],[5000,0],[5000,4000],[0,4000]]. Açıklıklar: yok. Yerleştir: yatak 1700×2100.':'Yatak odası, 0.25 m². Köşeler (mm): [[0,0],[500,0],[500,500],[0,500]]. Açıklıklar: yok. Yerleştir: yatak 1700×2100.'},
 {role:'assistant',content:JSON.stringify({yerlesim:ok?[{parca:'yatak',merkez_mm:[2500,1500],on_derece:0}]:null})}]});
const src=path.join(dir,'source.gz'),rows=[fixture(0,true),fixture(1,false)];
writeFileSync(src,gzipSync(rows.map(r=>JSON.stringify(r)).join('\n')+'\n'));
const run=(journal,out,args=[])=>spawnSync(process.execPath,['tools/yerlesim-veri/h4-donustur.mjs','--source',src,'--journal',journal,'--out',out,...args],{encoding:'utf8',timeout:30000,windowsHide:true});
const journal=path.join(dir,'journal.jsonl'),out=path.join(dir,'resumed');
let p=run(journal,out,['--limit','1','--workers','2']);assert.equal(p.status,0,p.stderr);
assert.equal(JSON.parse(readFileSync(path.join(out,'rapor.json'))).complete,false);
p=run(journal,out,['--workers','2']);assert.equal(p.status,0,p.stderr);
const report=JSON.parse(readFileSync(path.join(out,'rapor.json')));assert(report.complete);assert.equal(report.processed,2);
const one=path.join(dir,'one-pass');p=run(path.join(dir,'one-pass.jsonl'),one,['--workers','1']);assert.equal(p.status,0,p.stderr);
assert.deepEqual(readFileSync(path.join(out,'adaylar.jsonl')),readFileSync(path.join(one,'adaylar.jsonl')),'Worker count and restart must not change candidate bytes');
assert.deepEqual(readFileSync(path.join(out,'rapor.json')),readFileSync(path.join(one,'rapor.json')));
const before=readFileSync(path.join(out,'adaylar.jsonl'));p=run(journal,out);assert.equal(p.status,0,p.stderr);assert.deepEqual(readFileSync(path.join(out,'adaylar.jsonl')),before,'Completed replay must not duplicate records');
writeFileSync(journal,readFileSync(journal,'utf8').replace(/"fingerprint":"[^"]+"/,'"fingerprint":"stale"'));
p=run(journal,out);assert.notEqual(p.status,0);assert.match(p.stderr,/Stale journal/);assert.deepEqual(readFileSync(path.join(out,'adaylar.jsonl')),before,'Stale evidence must not rewrite candidates');
writeFileSync(journal,'{"partial":');p=run(journal,out);assert.notEqual(p.status,0);assert.match(p.stderr,/Incomplete journal/);
writeFileSync(src,gzipSync([rows[0],rows[0]].map(r=>JSON.stringify(r)).join('\n')));
p=run(path.join(dir,'duplicate.jsonl'),out);assert.notEqual(p.status,0);assert.match(p.stderr,/Duplicate source IDs/);
console.log('PASS H4 worker-count determinism, resume/no duplication, complete flag, stale/partial evidence and duplicate source rejection');
