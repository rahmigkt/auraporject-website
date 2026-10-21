import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {dest,langs,hash} from './build.mjs';
import {audit,loadExam} from './leakage.mjs';
export const load=()=>langs.flatMap(l=>fs.readFileSync(new URL(l+'.jsonl',dest),'utf8').trim().split('\n').map(JSON.parse));
export function run(){const rows=load(),ex=loadExam(),report={...audit(rows,ex.tasks),exam_sha256:ex.sha256};
 fs.writeFileSync(new URL('sizma-denetimi.json',dest),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({rows:rows.length,hits:report.hits.length,nearest:report.nearest.slice(0,4)}));assert.equal(report.hits.length,0,'Held-out lexical overlap; quarantine and revise candidate intent families');return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url))run();
