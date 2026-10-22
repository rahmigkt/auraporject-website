import assert from 'node:assert/strict';
import {FAMILIES} from '../assets/forma/families.js';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {caseReview,textileReview} from '../assets/forma/case-review.js';
import {reviewDesign,autoCorrectDesign} from '../assets/forma/auto-correct.js';
import {reviewMatches} from '../assets/forma/technical-review.js';
import {findingText} from '../assets/forma/review-document.js';
import {bathBom} from '../assets/forma/bath.js';
import {buildMesh} from '../assets/forma/build.js';
const counts={},totals={shelves:0,pins:0};let example;
for(const family of ['storage','kitchen','bath']){
 counts[family]=0;
 for(const [kind,entries] of Object.entries(FAMILIES[family].starts))for(const e of entries){
  const d=normalizeDesign({family,kind,style:e.style,seed:e.seed,params:e.p,materials:e.m}),before=structuredClone(d),c=compileDesign(d),r=caseReview(c);
  assert.deepEqual(d,before);assert.equal(r.production_approved,false);
  assert(!r.findings.some(f=>f.code==='shelfSupportReview'),`${family}/${kind}/${e.style}`);
  for(const s of r.shelves){assert.equal(s.supports,4);assert.equal(s.potential_contacts,4);assert.equal(s.potential_side_contacts,4);totals.shelves++;}
  totals.pins+=c.parts.filter(p=>p.role==='shelf-pin').length;
  assert(r.findings.some(f=>f.code==='cabinetFixingReview'));
  if(family==='kitchen')assert(r.findings.some(f=>f.code==='applianceInstallationReview'));
  if(family!=='storage')assert(r.findings.some(f=>f.code==='wetRoomReview'));
  if(c.parts.some(p=>p.role==='shelf-glass'))assert(r.findings.some(f=>f.code==='glassShelfReview'));
  if(c.parts.some(p=>p.role==='shelf-pin'))example=d;
  counts[family]++;
 }
}
const pin=compileDesign(example).parts.find(p=>p.role==='shelf-pin'),missing=normalizeDesign({...example,overrides:[{tool:'remove',id:pin.id}]});
assert(reviewDesign(missing).findings.some(f=>f.code==='shelfSupportReview'));
const backup=structuredClone(missing),fixed=autoCorrectDesign(missing);
assert.deepEqual(missing,backup);assert(fixed.changes.includes('restoreShelfSupports'));
assert(!fixed.review.findings.some(f=>f.code==='shelfSupportReview'));assert.equal(fixed.production_approved,false);
assert(!autoCorrectDesign(fixed.design).changes.includes('restoreShelfSupports'));
const moved=normalizeDesign({...example,overrides:[{tool:'transform',id:pin.id,move:[0,-100,0]}]});
assert(reviewDesign(moved).findings.some(f=>f.code==='shelfSupportReview'));
assert.deepEqual(autoCorrectDesign(moved).design.overrides,moved.overrides,'Do not erase designer transforms to fake a passing result');
const fake=normalizeDesign({...example,overrides:[{tool:'remove',id:'custom-pin-1'}]});
assert.deepEqual(autoCorrectDesign(fake).design.overrides,fake.overrides);assert(!autoCorrectDesign(fake).changes.includes('restoreShelfSupports'));
const c=compileDesign(example),side=c.parts.find(p=>p.role==='side');
const unanchored={...c,parts:c.parts.filter(p=>p.id!==side.id)};
assert(caseReview(unanchored).findings.some(f=>f.code==='shelfSupportReview'),'Pin to side panel contact matters');
const report=reviewDesign(example);assert(reviewMatches(report,example));assert(!reviewMatches({...report,schema:'aura.technical-review/2'},example));
const bath=normalizeDesign({family:'bath',kind:'basin',params:{base:'wall'}}),bom=bathBom(compileDesign(bath),bath.materials,'tr',buildMesh,k=>k);
assert(bom.rows.some(r=>r.nameEn==='Wall-hung bracket'));assert(!JSON.stringify(bom).includes('100 kg'));
assert.equal(textileReview({curtain:{system:'yok'},rug:{on:false}}).findings.length,0);
for(const system of ['stor','plise'])assert(textileReview({curtain:{system}}).findings.some(f=>f.code==='blindCordReview'));
assert(!textileReview({curtain:{system:'fon'}}).findings.some(f=>f.code==='blindCordReview'));
const textile=textileReview({curtain:{system:'stor'},rug:{on:true}});assert.equal(textile.production_approved,false);
for(const f of [...report.findings,...textile.findings])for(const lang of ['tr','en','de','fr','nl','da','es','it','ar'])assert(findingText(f,lang).length>0);
console.log(JSON.stringify({status:'PASS',models:counts,...totals,negative_checks:['removed pin','moved pin','missing side','custom override preserved','idempotence','stale report','unverified bath capacity removed','textile configuration separation'],production_approved:false}));
