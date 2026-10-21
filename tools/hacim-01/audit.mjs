import{readFileSync,writeFileSync}from'node:fs';
import{dest,langs}from'./build.mjs';
import{audit,loadExam}from'./leakage.mjs';
const rows=langs.flatMap(l=>readFileSync(new URL(l+'.jsonl',dest),'utf8').trim().split('\n').map(JSON.parse));
const exam=loadExam(),r={...audit(rows,exam.tasks),exam_sha256:exam.sha256};
writeFileSync(new URL('sizma-denetimi.json',dest),JSON.stringify(r,null,2)+'\n');
console.log(JSON.stringify({hits:r.hits,nearest:r.nearest.slice(0,4)}));
if(r.hits.length)process.exitCode=1;
