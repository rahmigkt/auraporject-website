import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {skeleton,audit} from './iskelet.mjs';
import {parseCSV,importDecisions} from './uzman-onay.mjs';
const here=new URL('./',import.meta.url);
const files=['dev','test'].map(s=>new URL(`sinav-01b-${s}.jsonl`,here));
const records=files.flatMap(p=>readFileSync(p,'utf8').trim().split('\n').map(JSON.parse));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
test('numeric and courtesy variants share a skeleton',()=>{
 assert.equal(skeleton('Lütfen genişlik 180 cm olsun.'),skeleton('Genislik 210 cm olsun!'));
 assert.equal(skeleton('Can you set the height to 42.5 cm?'),skeleton('Please set the height to 51 cm.'));
 assert.equal(skeleton('genişlik bir seksen cm olsun'),skeleton('genişlik 180 cm olsun'));
});
test('audit exposes duplicate count and split leakage',()=>{
 const rs=[{id:'a',lang:'tr',split:'dev',category:'size',text:'Lütfen eni 120 cm yap'},{id:'b',lang:'tr',split:'test',category:'size',text:'Eni 135 cm yap'}];
 const a=audit(rs);assert.equal(a.ratio,0.5);assert.equal(a.maxCopies,2);assert.equal(a.leakage.length,1);
 rs.push({...rs[0],id:'c',text:'Eni 150 cm yap'});assert.equal(audit(rs).maxCopies,3);
});
test('actual CSV has 400 unique, blank decisions with exact source text',()=>{
 const rows=parseCSV(readFileSync(new URL('uzman-onay-01b.csv',here),'utf8'));
 assert.equal(rows.length,401);assert.equal(new Set(rows.slice(1).map(r=>r[0])).size,400);
 const map=new Map(records.map(r=>[r.id,r]));
 for(const row of rows.slice(1)){assert.equal(row.length,9);assert.equal(row[3],map.get(row[0]).text);assert.equal(row[7],'');assert.equal(row[8],'');}
});
test('01B decisions can be staged in memory without changing either frozen file',()=>{
 const before=files.map(hash),r=records[0];
 const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
 const csv=[['id','dil','aile','cümle','beklenen','yasaklar','soru mu','karar','not'],[r.id,r.lang,r.context.family,r.text,'','',r.gold.clarify?'evet':'hayır','onay','deneme, yalnız bellek']].map(row=>row.map(quote).join(',')).join('\r\n');
 const out=importDecisions(csv,'Test denetçisi',records);
 assert.equal(out[r.id].review,'approved');assert.equal(out[r.id].note,'deneme, yalnız bellek');
 assert.deepEqual(files.map(hash),before);assert.ok(records.every(r=>r.label.review==='unreviewed'));
});
test('01B manifest pins the actual test bytes and only the POSIX repository path',()=>{
 const manifest=JSON.parse(readFileSync(new URL('sinav-01b/FREEZE.json',here),'utf8'));
 assert.deepEqual(Object.keys(manifest),['tests/ai-eval/sinav-01b-test.jsonl']);
 assert.equal(manifest['tests/ai-eval/sinav-01b-test.jsonl'].sha256,hash(files[1]));
});
