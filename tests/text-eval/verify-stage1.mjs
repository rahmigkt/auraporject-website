// Editorial artifact integrity only. Semantic claim checking and voice scoring belong to PR 2.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {FAMILIES} from '../../assets/forma/families.js';
import {normalizeDesign} from '../../assets/forma/generate.js';
import {buildMesh} from '../../assets/forma/build.js';
import * as legacyBedroom from '../../assets/forma/bedroom.js';
import {assertKnownMigration} from '../helpers/legacy-design.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=path.join(root,'knowledge/aura-ses');
const read=p=>fs.readFileSync(path.join(dir,p),'utf8');
const json=p=>JSON.parse(read(p));
const at=(value,pointer)=>{
  assert.ok(pointer.startsWith('/'),`Invalid pointer ${pointer}`);
  return pointer.slice(1).split('/').reduce((o,k)=>{
    const key=k.replaceAll('~1','/').replaceAll('~0','~');
    assert.ok(o!==null && typeof o==='object' && Object.hasOwn(o,key),`Missing ${pointer}`);
    return o[key];
  },value);
};
const unique=(items,label)=>assert.equal(new Set(items).size,items.length,`${label}: duplicate`);
const vocab=JSON.parse(fs.readFileSync(path.join(root,'tests/ai-eval/vocab.json'),'utf8'));
const cards=json('kartlar/malzeme-kartlari.json');
const designs=json('denemeler/tasarimlar.json');
const trials=read('denemeler/metinler.jsonl').trim().split('\n').map(JSON.parse);
const sources=new Set([...read('arastirma/MALZEME.md').matchAll(/^## (M\d{2}) —/gm)].map(x=>x[1]));
const philosophy=[...read('arastirma/FENOMENOLOJI.md').matchAll(/^## (F\d{2}) —/gm)].map(x=>x[1]);
assert.equal(sources.size,17); assert.equal(philosophy.length,15); unique(philosophy,'sources');
assert.match(read('KURUCU-YAKLASIM.md'),/Yaklaşımı onaylıyorum; 30 denemeye geç/);
assert.equal(cards.length,67); unique(cards.map(x=>x.id),'cards');
const cardIds=new Set(cards.map(x=>x.id));
for(const c of cards){
  const value=at(vocab,c.vocab.pointer);
  if(c.vocab.mode==='member')assert.ok(Array.isArray(value)&&value.includes(c.vocab.value),c.id);
  else assert.ok(value && typeof value==='object',c.id);
  for(const field of ['ad','anlam','iliski_sorusu','iddia_siniri','ortak_not'])assert.ok(c[field]?.trim(),`${c.id}/${field}`);
  for(const s of c.kaynaklar)assert.ok(sources.has(s),`${c.id}/${s}`);
  assert.ok(read('kartlar/MALZEME-KARTLARI.md').includes(`### ${c.id} —`),c.id);
}
const expected={WOODS:9,STAINS:12,FINISHES:4,STONES:8,METALS:5,GLASS:5,FIBERS:9,WEAVES:7,SURFACES:6,SPECIAL:2};
for(const [g,n] of Object.entries(expected)){
  const group=cards.filter(c=>c.group===g);
  assert.equal(group.length,n,g);
  if(vocab.catalogs[g])assert.deepEqual(group.map(c=>c.key).sort(),Object.keys(vocab.catalogs[g]).sort(),g);
}
const catalogCount=Object.values(vocab.catalogs).reduce((sum,c)=>sum+Object.keys(c).length,0);
const weaves=new Set(),surfaces=new Set();
for(const f of Object.values(vocab.families))for(const slot of Object.values(f.materialSlots)){
  for(const s of slot.surface||[])if(s!=='same')surfaces.add(s);
  for(const w of slot.weave||[])weaves.add(w);
}
assert.equal(catalogCount+weaves.size+surfaces.size+2,130,'material inventory changed; review scope');
assert.ok(cards.length>=Math.ceil(130/2));

assert.equal(designs.length,10); unique(designs.map(x=>x.id),'designs');
assert.equal(new Set(designs.map(x=>x.design.family)).size,6);
assert.equal(new Set(designs.map(x=>x.design.style)).size,10);
const byId=new Map(designs.map(x=>[x.id,x.design]));
for(const {id,design:d} of designs){
  assert.ok(Object.hasOwn(vocab.families[d.family].kinds,d.kind),id+': invalid historical kind');
  const migration=assertKnownMigration('text:'+id,d,normalizeDesign(d));
  assert.equal(migration.semantic_change,['M02','M09'].includes(id));
  assert.throws(()=>assertKnownMigration('text:'+id,{...d,seed:-999},normalizeDesign(d)));
  const mod=d.family==='bedroom'?legacyBedroom:FAMILIES[d.family].mod;
  const issues=mod.validate(mod.compile(d.params),d.materials,buildMesh);
  assert.deepEqual(issues.filter(x=>x.level==='error'),[],`${id}: engine errors`);
}
assert.equal(trials.length,30); unique(trials.map(x=>x.id),'trials'); unique(trials.map(x=>x.tanik),'passages');
const counts=[];
for(const r of trials){
  const d=byId.get(r.tasarim); assert.ok(d,r.id);
  assert.ok(['tr','en'].includes(r.dil),r.id);
  for(const field of ['ad','tanik','iz','yorum_siniri'])assert.ok(r[field]?.trim(),`${r.id}/${field}`);
  const words=r.tanik.trim().split(/\s+/u).length;
  assert.ok(words>=50 && words<=120,`${r.id}: ${words} words`); counts.push(words);
  assert.equal((r.iz.match(/[.!?](?:\s|$)/gu)||[]).length,1,`${r.id}: iz sentence count`);
  assert.ok(r.kartlar.length && r.ilkeler.length && r.dayanak.length,r.id);
  for(const card of r.kartlar)assert.ok(cardIds.has(card),`${r.id}: ${card}`);
  for(const k of r.ilkeler)assert.match(k,/^K(?:0[1-9]|10)$/);
  for(const claim of r.dayanak)assert.deepEqual(at(d,claim.tasarim_yolu),claim.deger,`${r.id}: stale evidence`);
  assert.ok(r.etkinlik_kosullari.length,`${r.id}: missing activation context`);
  for(const condition of r.etkinlik_kosullari)assert.deepEqual(at(d,condition.tasarim_yolu),condition.deger,`${r.id}: stale activation context`);
  assert.equal(r.durum,'denetim_bekliyor'); assert.equal(r.onaylayan_model,null); assert.equal(r.insan_secimi,null);
  assert.ok(read('denemeler/DENEMELER.md').includes(r.tanik),`${r.id}: review copy stale`);
}
for(const id of byId.keys()){
  const group=trials.filter(r=>r.tasarim===id);
  assert.equal(group.length,3,id); assert.deepEqual(group.map(x=>x.dil),['tr','tr','en'],id);
}
// Check local Markdown links; external links were verified during the research read, not fetched here.
for(const file of fs.readdirSync(dir,{recursive:true}).filter(f=>f.endsWith('.md'))){
  const text=fs.readFileSync(path.join(dir,file),'utf8');
  for(const [,target] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
    if(/^(https?:|#)/.test(target))continue;
    assert.ok(fs.existsSync(path.resolve(dir,path.dirname(file),target.split('#')[0])),`${file}: ${target}`);
  }
}
console.log(JSON.stringify({status:'artifact_integrity_passed',founder_gate:'owner_approved_for_30_trials',philosophy_sources:15,material_sources:17,material_cards:67,material_inventory:130,designs:10,families:6,styles:10,trials:30,languages:{tr:20,en:10},word_range:[Math.min(...counts),Math.max(...counts)],semantic_claim_checker:'PR2_pending',voice_review:'pending',blind_owner_selection:'pending',training:'not_started'},null,2));
