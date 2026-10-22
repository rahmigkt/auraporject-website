import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {constructionReview} from '../assets/forma/construction.js';
import {autoCorrectDesign,reviewDesign} from '../assets/forma/auto-correct.js';
import {STARTS} from '../assets/forma/starts.js';
const cases=[];
for(const family of ['seating','table'])for(const [kind,entries] of Object.entries(STARTS[family]))for(const e of entries){
 const d=normalizeDesign({family,kind,style:e.style,seed:e.seed,params:e.p}),c=compileDesign(d),r=constructionReview(c,d.materials);
 assert(r.members.length>0);assert(!r.findings.some(f=>f.code==='frameInvalidGeometry'));
 if(family==='seating'){
  assert(c.parts.filter(q=>q.role==='frame-back-post').length>=2);
  assert.equal(c.parts.filter(q=>q.role==='frame-back-rail').length,3);
 }
 cases.push({family,kind,style:e.style,parts:c.parts.length,unconnected:r.unconnected,findings:r.findings.map(f=>f.code),bending_scenarios:r.bending_scenarios});
}
for(const baseType of ['legs','frame','skirt','sled','plinth','floating']){
 const r=constructionReview(compileDesign(normalizeDesign({family:'seating',params:{baseType}})));
 assert.deepEqual(r.unconnected,[],baseType+' default should have potential load-path contacts');
 assert(r.floor_members.length>0);
}
const d=normalizeDesign({family:'seating'}),c=compileDesign(d);
const missing=structuredClone(c);missing.parts=missing.parts.filter(q=>!q.id.startsWith('frame-back-'));
assert(constructionReview(missing).findings.some(f=>f.code==='backSupportMissing'));
const moved=structuredClone(c);moved.parts.find(q=>q.id==='frame-back-upper').pos[1]+=2000;
assert(constructionReview(moved).unconnected.includes('frame-back-upper'));
const broken=structuredClone(c);broken.parts.find(q=>q.role==='leg').geom={fn:'cut'};
assert(constructionReview(broken).findings.some(f=>f.code==='frameInvalidGeometry'));
const sc=STARTS.seating.sofa.find(e=>e.style==='scandinavian_modern');
const thin=normalizeDesign({family:'seating',kind:'sofa',style:sc.style,params:sc.p}),before=structuredClone(thin);
const fix=autoCorrectDesign(thin);assert.deepEqual(thin,before);assert.deepEqual(fix.original,before);
assert(fix.changes.includes('increaseLegSection'));assert(fix.design.params.legSize>thin.params.legSize);
assert.equal(fix.production_approved,false);assert(fix.review.findings.some(f=>f.code==='materialGradeUnknown'));
assert(fix.review.findings.some(f=>f.code==='wholeProductReview'));
assert.deepEqual(autoCorrectDesign(fix.design).changes,[],'Second pass must be idempotent');
const removed=normalizeDesign({...d,overrides:[{tool:'remove',id:'frame-back-post-0'}]});
assert(autoCorrectDesign(removed).changes.includes('restoreGeneratedFrame'));
const wood=normalizeDesign({family:'table',params:{baseType:'legsOnly'},materials:{top:{surface:'wood'},base:{surface:'wood'}}});
const wf=autoCorrectDesign(wood);assert.equal(wf.design.params.baseType,'legsApron');assert(wf.changes.includes('addTableAprons'));assert.equal(wood.params.baseType,'legsOnly');
const metal=normalizeDesign({...wood,materials:{...wood.materials,base:{surface:'metal'}}});
assert.equal(autoCorrectDesign(metal).design.params.baseType,'legsOnly','No wooden apron assumption for metal');
for(const family of ['storage','kitchen','bath','textile'])assert.equal(reviewDesign(normalizeDesign({family})).production_approved,false);
fs.mkdirSync('work',{recursive:true});fs.writeFileSync('work/construction-model-audit.json',JSON.stringify({scope:'Potential mesh-AABB contacts only; never certification',cases},null,2));
console.log('PASS',cases.length,'real seating/table starts;6default bases; missing/moved/broken geometry; original preservation; reversible/idempotent proposals; wooden-only table fix; unresolved engineering notes retained');
