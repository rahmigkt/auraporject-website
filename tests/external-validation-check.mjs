import assert from 'node:assert/strict';import fs from 'node:fs';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {engineeringReview} from '../assets/forma/production/engineering-checks.js';
import {externalFingerprint,matchExternalReport,canonical} from '../assets/forma/production/external-validation.js';
const design=normalizeDesign(JSON.parse(fs.readFileSync('assets/forma/production/review-sample.json'))),compiled=compileDesign(design),review=engineeringReview(design,compiled),data={design,compiled,review};
const input=JSON.stringify(data),report={schema:'aura.cad-fcl-pilot/1',production_approved:false,input_sha256:await externalFingerprint(data)};
assert.equal((await matchExternalReport(data,report)).status,'matching_frozen_input_not_production_approval');
for(const mutate of [x=>x.design.params.width++,x=>x.compiled.parts[0].pos[0]++,x=>x.compiled.parts[0].geom.d++,x=>x.review.manufacturing.parts[0].operations[0].diameter_mm++]){
 const changed=structuredClone(data);mutate(changed);assert.equal((await matchExternalReport(changed,report)).report,null);
}
await assert.rejects(()=>matchExternalReport(data,{...report,production_approved:true}));await assert.rejects(()=>matchExternalReport(data,{...report,schema:'unknown'}));await assert.rejects(()=>matchExternalReport(data,{...report,input_sha256:'bad'}));
assert.equal(canonical({a:1,b:{x:2,y:3}}),canonical({b:{y:3,x:2},a:1}));assert.throws(()=>canonical({bad:Infinity}));assert.equal(JSON.stringify(data),input);
console.log('PASS external report bound to identical design,part geometry/placement AND manufacturing recipe;changed/malformed/approval-upgrade rejection;canonical order and source preservation.');

const actual=JSON.parse(fs.readFileSync('assets/forma/production/cad-fcl-pilot-report.json'));assert.equal((await matchExternalReport(data,actual)).report.stock_parts,40);assert.equal(actual.operations_attempted,392);assert.equal(actual.excluded.length,52);assert.equal(actual.real_hardware_motion_verified,false);
