import assert from 'node:assert/strict';
import {parseSource,derive,holds,checkReplay,convert,LANGS} from '../tools/yerlesim-veri/h4.mjs';
import {h4Kaynak} from '../tools/egitim/h4-kaynak.mjs';
const fixture=(ok=true)=>({id:'aura-cozucu-train-0-room|0',source:{dataset:'ProcTHOR-10K',license:'Apache-2.0',house:0,room:'room|0',split:'train'},ok,
 messages:[{role:'user',content:ok?'Yatak odası, 20 m². Köşeler (mm): [[0,0],[5000,0],[5000,4000],[0,4000]]. Açıklıklar: yok. Yerleştir: yatak 1700×2100.':'Yatak odası, 0.25 m². Köşeler (mm): [[0,0],[500,0],[500,500],[0,500]]. Açıklıklar: yok. Yerleştir: yatak 1700×2100.'},
 {role:'assistant',content:JSON.stringify({yerlesim:ok?[{parca:'yatak',merkez_mm:[2500,1500],on_derece:0}]:null})}]});
const original=fixture(),snapshot=JSON.stringify(original),parsed=parseSource(original);
assert.equal(JSON.stringify(original),snapshot);assert.equal(parsed.items[0].yukseklik,1000);assert.deepEqual(derive(parsed),[]);
for(const mutate of [r=>r.id='wrong',r=>r.source.license='unknown',r=>r.messages[0].content=r.messages[0].content.replace('1700×2100','0×2100'),r=>r.messages[0].content=r.messages[0].content.replace('20 m²','99 m²'),r=>r.messages[1].content='{"yerlesim":[]}',r=>r.ok=false]){
 const r=structuredClone(original);mutate(r);assert.throws(()=>parseSource(r));assert.equal(convert(r).status,'excluded');
}
const duplicates=fixture();duplicates.messages[0].content=duplicates.messages[0].content.replace('yatak 1700×2100','yatak 1700×2100; komodin 500×420; komodin 500×420');
duplicates.messages[1].content=JSON.stringify({yerlesim:[{parca:'yatak',merkez_mm:[2500,1500],on_derece:0},{parca:'komodin',merkez_mm:[1300,1500],on_derece:0},{parca:'komodin',merkez_mm:[3700,1500],on_derece:0}]});
const dp=parseSource(duplicates);assert.deepEqual(Object.keys(dp.positions),['e0']);assert.deepEqual(dp.ambiguous_names,['komodin']);assert.deepEqual(derive(dp),[],'Lost duplicate-name placement identities must not be invented');
const P={a:{pos_xy_mm:[0,0],rot_deg:180},b:{pos_xy_mm:[0,2000],rot_deg:0}};
assert(holds({tur:'bakar',a:'a',b:'b'},P));assert(!holds({tur:'bakar',a:'b',b:'a'},{...P,b:{...P.b,rot_deg:180}}));
assert(holds({tur:'yakin',a:'a',b:'b',mm:2000},P));assert(!holds({tur:'yakin',a:'a',b:'b',mm:1999},P));
assert(holds({tur:'uzak',a:'a',b:'b',mm:2000},P));assert(!holds({tur:'uzak',a:'a',b:'b',mm:2001},P));assert(!holds({tur:'unknown',a:'a',b:'b'},P));
const live=convert(original);assert.equal(live.status,'accepted');assert.equal(live.row.islemler.length,1);assert.equal(live.row.review.producer,'Codex');
assert.equal(live.row.review.required_reviewer,'Claude');assert(!live.row.review.training_eligible);
assert(!/merkez_mm|on_derece|pos_xy_mm|rot_deg/.test(JSON.stringify(live.row.islemler)));
assert.equal(h4Kaynak(live.row).ureten,'Codex');assert.equal(h4Kaynak({...live.row,review:undefined}).ureten,'Claude');assert.throws(()=>h4Kaynak({...live.row,review:{producer:'unknown'}}));
const negative=convert(fixture(false));assert.equal(negative.status,'accepted');assert.deepEqual(negative.row.islemler,[]);assert.equal(negative.row.expected.classification,'bounded_search_no_solution');assert(negative.row.motor.report.uyari.some(w=>w.kod==='sigmiyor'));
// Independent result checks must reject silent shrinkage, missing pieces, warnings and changed outcomes.
const good={state:{plan:{items:[{id:'e0',space_id:'room',size_mm:{w:1700,d:2100,h:1000},pos_xy_mm:[0,0],rot_deg:0}]}},rapor:{red:[],uyari:[],olcum:{yerlesim:{sigdi:true}}}};
assert.equal(checkReplay(parsed,[],true,good),null);
for(const [mutate,expected]of [[r=>r.state.plan.items[0].size_mm.w=1600,'dimensions_changed'],[r=>r.state.plan.items=[],'piece_count'],[r=>r.rapor.uyari.push({kod:'x'}),'motor_warning'],[r=>r.rapor.olcum.yerlesim.sigdi=false,'outcome_changed'],[r=>r.rapor.red.push({}),'motor_rejected']]){
 const r=structuredClone(good);mutate(r);assert.equal(checkReplay(parsed,[],true,r),expected);
}
assert.equal(checkReplay(parsed,[{tur:'yakin',a:'e0',b:'missing',mm:2000}],true,good),'constraint_mismatch');
assert.equal(LANGS.length,9);
console.log('PASS H4 source/identity/size/outcome mutations, duplicate-name ambiguity, direction/distance boundaries, live positive/no-fit, no coordinate targets and independent review ownership');
