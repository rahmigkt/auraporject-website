import assert from 'node:assert/strict';
import {technicalReview,reviewMatches} from '../assets/forma/technical-review.js';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {STARTS} from '../assets/forma/starts.js';
const e=STARTS.seating.sofa.find(x=>x.style==='scandinavian_modern');
const d=normalizeDesign({family:'seating',kind:'sofa',style:e.style,seed:e.seed,params:e.p});
const snapshot=structuredClone(d),c=compileDesign(d),issues=[{code:'thinLegs',level:'warn',value:8.55}],before=structuredClone(issues);
const r=technicalReview(d,c,issues,'2026-10-22T13:00:00Z');
assert.deepEqual(d,snapshot,'Preparing hand-off must preserve customer design');assert.deepEqual(issues,before);
assert.equal(r.automatic_changes,false);assert.equal(r.production_approved,false);assert.equal(r.status,'designer_review_required');
assert(r.findings.some(f=>f.code==='memberScreenReview'));assert(r.findings.some(f=>f.code==='olderAdultSeatDepth'));
assert(reviewMatches(JSON.parse(JSON.stringify(r)),d),'Saved/reloaded report remains attached');
for(const change of [x=>x.params.legSize++,x=>x.materials.wood.stain='black',x=>x.overrides=[{id:'test',op:'move',pos:[1,0,0]}]]){
 const next=structuredClone(d);change(next);assert(!reviewMatches(r,next),'Changed model cannot reuse old result');
}
assert(!reviewMatches({...r,schema:'old'},d));
assert(!reviewMatches({...r,findings:null},d));assert(!reviewMatches({...r,findings:[null]},d));
const unsupported=structuredClone(c);unsupported.parts.find(p=>p.role==='leg').geom={fn:'cut'};
assert(technicalReview(d,unsupported).findings.some(f=>f.code==='memberScreenUnknown'));
console.log('PASS no geometry/material mutation; no automatic approval; thin-leg+ergonomic notes; persistence; stale geometry/material/override invalidation; unsupported geometry remains reviewable');
