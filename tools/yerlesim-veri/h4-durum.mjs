// Read a consistent prefix of the running journal. Never promote unplayed rows.
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {sha} from './h4.mjs';
const journal=process.argv[2]||'work/h4-full.jsonl';
const text=readFileSync(journal,'utf8'),lines=text.slice(0,text.lastIndexOf('\n')).split('\n').map(JSON.parse),header=lines.shift();
const src=readFileSync('knowledge/ai-egitim/veri/yerlesim/procthor-aura-cozucu.jsonl.gz');
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
const files=[...walk('assets').filter(p=>p.endsWith('.js')),...walk('tools/studyo-motoru').filter(p=>p.endsWith('.mjs')),'tools/yerlesim-veri/h4.mjs','tools/yerlesim-veri/h4-diller.mjs','tools/yerlesim-veri/h4-donustur.mjs','tools/yerlesim-veri/h4-worker.mjs','tools/yerlesim-veri/cozucu_ornekleri.mjs','tools/hacim-istek/leakage.mjs'];
const fingerprint=sha(JSON.stringify({source:sha(src),exam:sha(readFileSync('tests/ai-eval/aura-sinav-01/gorevler.jsonl')),code:files.sort().map(p=>[p.replaceAll('\\','/'),sha(readFileSync(p))])}));
if(header.fingerprint!==fingerprint)throw Error('Source/engine/converter/exam changed: do not reuse the journal');
const done=lines.sort((a,b)=>a.index-b.index),accepted=done.filter(r=>r.status==='accepted'),sample=new Map();
for(const {row}of accepted){const key=row.dil+':'+row.expected.classification;if(!sample.has(key))sample.set(key,row);}
const report={version:'H4-progress/1',complete:done.length===header.source_rows,source_rows:header.source_rows,replayed:done.length,pending:header.source_rows-done.length,
 mechanically_accepted:accepted.length,excluded:done.length-accepted.length,journal_fingerprint:fingerprint,source_sha256:header.source_sha256,
 languages:accepted.reduce((a,r)=>(a[r.row.dil]=(a[r.row.dil]||0)+1,a),{}),
 note:'Checkpoint only. C5 stays open until the full replay/report is delivered. Samples require Claude cross-review; no training approval or export.',
 samples:[...sample.values()]};
mkdirSync('knowledge/ai-egitim/veri/yerlesim-kisit/denetim',{recursive:true});
writeFileSync('knowledge/ai-egitim/veri/yerlesim-kisit/denetim/ilk-kisim.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,samples:report.samples.length}));
