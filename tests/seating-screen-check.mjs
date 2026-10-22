import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile} from '../assets/forma/sofa.js';
import {STARTS} from '../assets/forma/starts.js';
import {seatingScreen,seatingErgoReference} from '../assets/forma/seating-screen.js';
import {SEATING_SCREEN as data} from '../assets/forma/seating-screen-data.js';
import {normalizeMaterials} from '../assets/forma/catalog.js';
import {t,UI_LANGS} from '../assets/forma/i18n.js';
const entry=STARTS.seating.sofa.find(x=>x.style==='scandinavian_modern'),video=compile(entry.p),r=seatingScreen(video);
assert.equal(r.members[0].min_radius_mm,8.55);assert.equal(r.members[0].height_mm,292);
assert.deepEqual(r.eligible,[],'Original video leg retains no screened class');
const shape=size=>compile({width:2400,baseType:'frame',legType:'squareTaper',legSize:size,legTaper:.9,legHeight:210});
const thin=seatingScreen(shape(19)),wide=seatingScreen(shape(25));
assert(!thin.eligible.includes('D24')&&thin.eligible.includes('D30'));
assert(wide.eligible.includes('D24'));assert.equal(wide.certified,false);
for(let size=10;size<48;size++){
 const a=seatingScreen(shape(size)),b=seatingScreen(shape(size+1));
 assert(a.eligible.every(g=>b.eligible.includes(g)),'Thickening must not lose grades');
}
for(const mutate of [
 c=>c.parts.find(p=>p.role==='leg').cuts=[{type:'hole'}],
 c=>c.parts.find(p=>p.role==='leg').geom.profile[0][1]=NaN,
 c=>c.parts.find(p=>p.role==='leg').geom={fn:'cut'},
 c=>c.parts.find(p=>p.role==='leg').rot=[1,0,0],
 c=>c.parts.find(p=>p.role==='leg').geom.profile.push([1000,30])
]){const c=structuredClone(video);mutate(c);assert.equal(seatingScreen(c).status,'unsupported');}
assert.equal(seatingScreen(compile({baseType:'plinth'})).status,'unsupported');
for(const g of data.grades)for(let i=0;i<121;i++){
 assert(data.required_radius_mm.round[g][i]>=data.required_radius_mm.square[g][i]);
 if(i)assert(data.required_radius_mm.square[g][i]>=data.required_radius_mm.square[g][i-1]);
}
const before=normalizeMaterials({wood:{species:'walnut',stain:'oak'}});
assert.equal(before.wood.structuralGrade,undefined);
for(const lang of Object.keys(UI_LANGS))for(const key of ['technicalTitle','technicalErgo','technicalPending']) assert.notEqual(t(key,lang),key);
const er=seatingErgoReference(video);assert.equal(er.usable_depth_mm,video.meta.seatDepth);assert.equal(er.certified,false);
const cases=Object.entries(STARTS.seating).flatMap(([kind,es])=>es.map(e=>{
 const c=compile({...e.p,kind});return {kind,style:e.style,seed:e.seed,meta:c.meta,screen:seatingScreen(c)};
}));
fs.mkdirSync('work',{recursive:true});fs.writeFileSync('work/seating-real-model-screen.json',JSON.stringify({scope:'Member scenario only, not product certification',cases},null,2));
console.log(`PASS actual video geometry; material narrowing;38monotonic changes;5invalid geometry paths;968envelope monotonic bounds;grade normalization;9language fallback;real ${cases.length} curated models screened`);
