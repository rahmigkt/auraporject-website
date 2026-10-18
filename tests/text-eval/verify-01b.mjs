import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {hedgeMatches,words,sentenceLengths,mean} from './text-01b-metrics.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const base=path.join(root,'knowledge/aura-ses/denemeler');
const out=path.join(base,'01b');
const read=(dir,file)=>fs.readFileSync(path.join(dir,file),'utf8');
const lines=(dir,file)=>read(dir,file).trim().split('\n').map(JSON.parse);
// Canonical LF bytes survive normal Windows Git checkout conversion.
const canonicalHash=file=>createHash('sha256').update(read(base,file).replaceAll('\r\n','\n')).digest('hex');
assert.equal(canonicalHash('metinler.jsonl'),'5d2857bbc9c215d984fcb7100257ea96aae202f5a1ecf7750d356bc00a154532','Stage 1 passages changed');
assert.equal(canonicalHash('tasarimlar.json'),'df391efdb4ddb9e46c0fd57bca767c6451e99599fc58cd82b4667ea68ed281c3','Stage 1 designs changed');
const old=lines(base,'metinler.jsonl'),rows=lines(out,'metinler.jsonl');
const hand=JSON.parse(read(out,'yeniden-yazimlar.json'));
const key=JSON.parse(read(out,'inceleme-anahtari.json'));
const designs=new Map(JSON.parse(read(base,'tasarimlar.json')).map(x=>[x.id,x.design]));
assert.equal(rows.length,30); assert.equal(new Set(rows.map(r=>r.id)).size,30);
assert.deepEqual(rows.map(x=>x.id),old.map(x=>x.id));
assert.equal(key.baseline_sha256,canonicalHash('metinler.jsonl'));
assert.equal(key.pairs.length,30);assert.equal(new Set(key.pairs.map(x=>x.pair)).size,30);
assert.equal(key.pairs.filter(p=>p.new_side==='A').length,15);
assert.equal(key.pairs.filter(p=>p.new_side==='B').length,15);
assert.deepEqual(Object.keys(hand).sort(),rows.map(x=>x.id).sort());
const at=(obj,p)=>p.slice(1).split('/').reduce((o,k)=>o[k],obj);
const html=read(out,'okuma.html'),md=read(out,'KOR-OKUMA.md');
for(let i=0;i<rows.length;i++){
  const r=rows[i],before=old[i],k=key.pairs[i];
  assert.equal(r.tasarim,before.tasarim); assert.equal(k.record,r.id); assert.equal(k.design,r.tasarim);
  assert.equal(r.tanik,hand[r.id]);assert.notEqual(r.tanik,before.tanik);
  assert.ok(words(r.tanik)>=50 && words(r.tanik)<=120,r.id);
  assert.ok(hedgeMatches(r.tanik).length<=1,`${r.id}: hedge budget`);
  assert.ok(Math.max(...sentenceLengths(r.tanik))<=18,`${r.id}: long sentence`);
  for(const field of ['ad','iz','dil','kartlar','dayanak','etkinlik_kosullari'])assert.deepEqual(r[field],before[field],`${r.id}: factual context changed`);
  assert.ok(r.ilkeler.includes('K11'));assert.equal(r.onaylayan_model,null);assert.equal(r.insan_secimi,null);
  for(const claim of [...r.dayanak,...r.etkinlik_kosullari])assert.deepEqual(at(designs.get(r.tasarim),claim.tasarim_yolu),claim.deger,r.id);
  assert.ok(html.includes(r.tanik) && html.includes(before.tanik),`${r.id}: missing HTML text`);
  assert.ok(md.includes(r.tanik) && md.includes(before.tanik),`${r.id}: missing Markdown text`);
  const block=html.split(`data-pair="${k.pair}"`)[1].split('</section>')[0];
  const a=block.split(`<h3 id="${k.pair}-A">A</h3><p>`)[1].split('</p>')[0];
  const b=block.split(`<h3 id="${k.pair}-B">B</h3><p>`)[1].split('</p>')[0];
  assert.equal(k.new_side==='A'?a:b,r.tanik);assert.equal(k.new_side==='A'?b:a,before.tanik);
}
// No embedded identity/key, fetch, preselected answers or remote requests in the standalone reading page.
assert.doesNotMatch(html,/Codex|Claude|METİN-01|01b|new_side|inceleme-anahtari|yeniden-yazimlar|metinler\.jsonl|tasarimlar\.json|\bfetch\s*\(|XMLHttpRequest|https?:\/\//u);
assert.doesNotMatch(md,/Codex|Claude|METİN-01|01b|inceleme-anahtari/u);
assert.doesNotMatch(html,/<input[^>]*\bchecked\b/u);
assert.equal((html.match(/class="pair"/g)||[]).length,30);
assert.equal((html.match(/<textarea /g)||[]).length,30);
assert.equal((html.match(/type="radio"/g)||[]).length,150);
// Check that the budget catches repetition and both languages rather than counting only distinct forms.
assert.equal(hedgeMatches('Olabilir. Olabilir.').length,2);
assert.equal(hedgeMatches('Belki düşünelim.').length,2);
assert.equal(hedgeMatches('Dönebilir. Kurulabilir.').length,2);
assert.equal(hedgeMatches('It may stay. It could return.').length,2);
assert.equal(hedgeMatches('The mirror returns the glance.').length,0);
assert.equal(hedgeMatches('Arka panel yok; bakış sürer.').length,0);
const report={records:rows.length,designs:designs.size,word_range:[Math.min(...rows.map(r=>words(r.tanik))),Math.max(...rows.map(r=>words(r.tanik)))],hedge_uses:rows.reduce((n,r)=>n+hedgeMatches(r.tanik).length,0),pairs:30,new_on_A:15,new_on_B:15,independent_voice_review:'pending',blind_choices:'not_collected'};
for(const lang of ['tr','en']){
  const before=old.filter(x=>x.dil===lang).flatMap(x=>sentenceLengths(x.tanik));
  const after=rows.filter(x=>x.dil===lang).flatMap(x=>sentenceLengths(x.tanik));
  assert.ok(mean(after)<mean(before),`${lang}: sentences did not shorten`);
  report[lang]={records:rows.filter(x=>x.dil===lang).length,mean_sentence_before:+mean(before).toFixed(2),mean_sentence_after:+mean(after).toFixed(2),max_sentence_after:Math.max(...after)};
}
console.log(JSON.stringify(report,null,2));
