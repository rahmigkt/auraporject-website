import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {audit} from './iskelet.mjs';
const here=new URL('./',import.meta.url);
const records=['dev','test'].flatMap(s=>readFileSync(new URL(`sinav-01b-${s}.jsonl`,here),'utf8').trim().split('\n').map(JSON.parse));
const vocab=JSON.parse(readFileSync(new URL('vocab.json',here),'utf8'));
const count=fn=>records.filter(fn).length;
assert.equal(records.length,400);assert.equal(new Set(records.map(r=>r.id)).size,400);
for(const [l,n] of Object.entries({tr:240,en:60,de:20,fr:16,nl:16,da:16,es:16,it:16}))assert.equal(count(r=>r.lang===l),n,l);
assert.equal(count(r=>r.split==='dev'),140);assert.equal(count(r=>r.split==='test'),260);
const kinds={seating:['sofa','loveseat','armchair'],table:['dining','coffee','side','console','desk'],storage:['wardrobe','nightstand','dresser','vanity','tvunit','bookcase','vitrine','sideboard'],kitchen:['run','island'],bath:['basin','column','mirror']};
const categories=['size','relative','material','color','part','kind','family','layout','negation','mixed','units','colloquial','ambiguous','offtopic','style'];
for(const [family,ks] of Object.entries(kinds)){
 assert.equal(count(r=>r.context.family===family),80,family);
 for(const k of ks)assert.ok(count(r=>r.context.family===family&&r.context.kind===k)>=8,`${family}/${k}`);
 for(const c of categories)assert.ok(count(r=>r.context.family===family&&r.category===c)>0,`${family}/${c}`);
}
for(const c of ['negation','mixed','units'])assert.ok(count(r=>r.category===c)>=32,c);
for(const r of records){
 const f=vocab.families[r.context.family];assert.ok(f?.kinds[r.context.kind],r.id);
 assert.ok(categories.includes(r.category));assert.ok(r.text.trim());assert.equal(r.label.by,'codex');assert.equal(r.label.review,'unreviewed');assert.equal(r.label.reviewed_by,null);
 assert.ok(Array.isArray(r.gold.expect));assert.ok(Array.isArray(r.gold.forbid));assert.equal(typeof r.gold.clarify,'boolean');
 if(r.gold.clarify)assert.equal(r.gold.expect.length,0,r.id);
 if(r.gold.unsupported?.length)assert.equal(r.gold.clarify,true,r.id);
 if(r.category==='layout')assert.equal(r.gold.clarify,true,r.id);
 if(r.category==='negation')assert.ok(r.gold.forbid.length,r.id);
 if(!['tr','en'].includes(r.lang))assert.ok(r.notes.includes('anadil denetimi yok'),r.id);
 // Exact requests and relative bounds must be valid grammar parameters. No predictor is imported.
 for(const a of r.gold.expect){
  assert.ok(vocab.actionTypes.includes(a.type),r.id);
  if(['set','delta'].includes(a.type)){
   assert.ok(f.ranges[a.key],`${r.id}: ${a.key}`);
   if(a.type==='set')assert.ok(a.value>=f.ranges[a.key][0]&&a.value<=f.ranges[a.key][1],r.id);
   if(a.range){assert.ok(a.range.length===2&&a.range[0]<=a.range[1]);assert.ok(a.sign==='+'?a.range[0]>0:a.range[1]<0);}
  }
  if(a.type==='material')assert.ok(f.materialSlots[a.slot]?.[a.key]?.includes(a.value),r.id);
  if(a.type==='enum')assert.ok(f.enums[a.key]?.includes(a.value),r.id);
  if(a.type==='kind')assert.ok(Object.values(vocab.families).some(g=>g.kinds[a.value]),r.id);
  if(a.type==='family')assert.ok(vocab.families[a.value],r.id);
  if(a.type==='style')assert.ok(f.styles.includes(a.value),r.id);
 }
 for(const a of r.gold.forbid){
  assert.ok(vocab.actionTypes.includes(a.type),r.id);
  // A forbidden action is allowed to be a partial matcher (no value/slot).
  if(a.type==='material'&&a.value!==undefined)assert.ok(Object.values(vocab.families).some(g=>Object.values(g.materialSlots).some(s=>s[a.key]?.includes?.(a.value))),r.id);
 }
}
const result=audit(records);assert.ok(result.ratio>=0.9);assert.ok(result.maxCopies<=2);assert.equal(result.leakage.length,0);
for(const [l,v] of Object.entries(result.byLang))if(!['tr','en'].includes(l))assert.ok(v.categories.length>=10,l);
const freezeURL=new URL('sinav-01b/FREEZE.json',here);
if(existsSync(freezeURL)){
 const freeze=JSON.parse(readFileSync(freezeURL,'utf8')),path='tests/ai-eval/sinav-01b-test.jsonl';
 assert.deepEqual(Object.keys(freeze),[path]);
 assert.equal(freeze[path].sha256,createHash('sha256').update(readFileSync(new URL('sinav-01b-test.jsonl',here))).digest('hex'));
 console.log('01B frozen hash matches (separate manifest; only Linux path).');
}
console.log(`PASS: ${records.length} manually authored records; all composition/context/gold checks; ${result.different} skeletons; no split leakage.`);
