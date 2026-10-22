import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {parseSource,derive,holds,sha,LANGS} from '../tools/yerlesim-veri/h4.mjs';
const raw=readFileSync('knowledge/ai-egitim/veri/yerlesim/procthor-aura-cozucu.jsonl.gz');
const sources=gunzipSync(raw).toString().trim().split('\n').map(JSON.parse),byID=new Map(sources.map(r=>[r.id,r]));
assert.equal(sources.length,4340);assert.equal(byID.size,sources.length);
for(const source of sources){const parsed=parseSource(source);assert(derive(parsed).every(c=>holds(c,parsed.positions)));}
const checkpoint=JSON.parse(readFileSync('knowledge/ai-egitim/veri/yerlesim-kisit/denetim/ilk-kisim.json'));
assert.equal(checkpoint.source_sha256,sha(raw));assert.equal(checkpoint.source_rows,sources.length);
assert.equal(checkpoint.pending+checkpoint.replayed,sources.length);assert.equal(checkpoint.mechanically_accepted+checkpoint.excluded,checkpoint.replayed);
assert.equal(checkpoint.complete,checkpoint.pending===0);
function check(row){
 const source=byID.get(row.kaynak.kayit);assert(source);const parsed=parseSource(source),constraints=source.ok?derive(parsed):[];
 assert.equal(row.kaynak.source_row_sha256,sha(JSON.stringify(source)));assert.equal(row.id,'h4-'+source.id);
 assert.equal(row.grup,`ProcTHOR-10K:${source.source.split}:house:${source.source.house}`);
 assert(LANGS.includes(row.dil));assert.deepEqual(row.durum,parsed.state);
 assert.equal(row.review.producer,'Codex');assert.equal(row.review.required_reviewer,'Claude');assert.equal(row.review.status,'quarantine');assert.equal(row.review.training_eligible,false);
 const input=JSON.parse(row.mesajlar[0].metin);assert.deepEqual(input.esyalar,parsed.items);assert.deepEqual(input.oda,parsed.room);assert.deepEqual(input.kisitlar,constraints);
 assert.deepEqual(row.expected.constraints,constraints);assert.equal(row.expected.fit,source.ok);assert.equal(row.expected.automatic_resize,false);
 assert.deepEqual(row.motor.attempt.esyalar,parsed.items);assert.deepEqual(row.motor.attempt.kisitlar,constraints);
 assert(!/pos_xy_mm|rot_deg|merkez_mm|on_derece/.test(row.mesajlar[0].metin+JSON.stringify(row.islemler)));
 assert.deepEqual(row.motor.report.red,[]);assert.equal(row.motor.report.olcum.yerlesim.sigdi,source.ok);
 if(source.ok){assert.deepEqual(row.islemler,[row.motor.attempt]);assert.deepEqual(row.motor.report.uyari,[]);}else{assert.deepEqual(row.islemler,[]);assert(row.motor.report.uyari.every(w=>w.kod==='sigmiyor'));}
 assert.equal(row.motor.source_constraints_hold,true);
}
for(const row of checkpoint.samples)check(row);
const positive=checkpoint.samples.find(r=>r.expected.fit);assert(positive);
for(const mutate of [r=>r.islemler[0].esyalar[0].en--,r=>r.review.producer='Claude',r=>r.grup+='wrong',r=>r.islemler[0].pos_xy_mm=[0,0],r=>r.kaynak.source_row_sha256='wrong']){
 const row=structuredClone(positive);mutate(row);assert.throws(()=>check(row));
}
console.log(`PASS all 4340 source structures/derived relations; ${checkpoint.samples.length} replayed checkpoint samples, size/identity/provenance/producer mutations. Full replay ${checkpoint.complete?'complete':'STILL PENDING'} (${checkpoint.replayed}/${sources.length}); no full-corpus engine or training approval claimed.`);
