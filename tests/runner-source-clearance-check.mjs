import assert from 'node:assert/strict';
import {runnerAssessment,RUNNER_PROFILES} from '../assets/forma/hardware.js';
import {inspectionSvgPages} from '../assets/forma/production/inspection-pdf.js';
import {normalizeDesign} from '../assets/forma/generate.js';
import fs from 'node:fs';
import {engineeringReview,runnerClearanceReview} from '../assets/forma/production/engineering-checks.js';
import {assemblyMotionPlans} from '../assets/forma/production/assembly-collision.js';
const source=RUNNER_PROFILES['accuride-3832ec'];let count=0;
for(const[nominal,travel]of [[300,305],[350,307],[400,406],[450,457],[500,508],[550,559],[600,610]]){
 const hw=runnerAssessment(source.id,{openingWidth:300,boxHeight:150,length:nominal,availableDepth:nominal+4});assert.equal(hw.documented_travel_mm,travel);assert.equal(hw.production_approved,false);assert.equal(hw.drilling_verified,false);
 const plans=assemblyMotionPlans({parts:[{id:'b1-idrawer1-box-bottom',role:'box-bottom',hardware:hw}],meta:{runner:nominal}}).filter(p=>p.type==='drawer');assert(plans.length);assert(plans.every(p=>p.limit===travel&&p.extent_basis==='manufacturer_documented_travel'&&!p.verified_mechanism));count++;
}
const upper=runnerClearanceReview(source.id,13.5);assert.deepEqual(upper.source_side_clearance_interval_mm,[12.7,13.5]);assert.deepEqual(upper.trial_side_clearance_interval_mm,[12.9,14.1]);assert.equal(upper.status,'trial_interval_outside_source_clearance');assert.equal(upper.production_approved,false);
assert.equal(runnerClearanceReview(source.id,13.1,.4).status,'trial_interval_within_source_clearance_not_qualified');assert.equal(runnerClearanceReview(source.id,13.1,.40001).status,'trial_interval_outside_source_clearance');assert.equal(runnerClearanceReview(source.id,13.1,.401).status,'trial_interval_outside_source_clearance');assert.equal(runnerClearanceReview(source.id,12.7,0).status,'trial_interval_within_source_clearance_not_qualified');
assert.equal(runnerClearanceReview('hettich-ka5632-ss-2025',12.7).status,'manufacturer_clearance_tolerance_not_provided');assert.equal(runnerClearanceReview('legacy-side-12.7',12.7).source,null);
for(const v of [NaN,Infinity,0,-1])assert.throws(()=>runnerClearanceReview(source.id,v));assert.throws(()=>runnerClearanceReview(source.id,13,-.1));assert.throws(()=>runnerClearanceReview('invented',13));
console.log('PASS7exact3832ECsource travels;actual motion bound;source-specific clearance endpoints/overflow;unknown Hettich/legacy;invalid input rejection;no mechanism/load approval.');

const design=normalizeDesign({...JSON.parse(fs.readFileSync('assets/forma/production/review-sample.json')),params:{...JSON.parse(fs.readFileSync('assets/forma/production/review-sample.json')).params,runnerSystem:source.id}}),review=engineeringReview(design),svg=inspectionSvgPages([review]).join('');assert(review.tolerances.runner_stacks.length);assert(review.tolerances.runner_stacks.every(x=>x.status==='trial_interval_outside_source_clearance'));assert(svg.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').includes('DENEME ARALIĞI KAYNAK SINIRINI AŞIYOR'));console.log('PASS source interval overflow visible in current-design PDF table;not automatic stock resizing.');
