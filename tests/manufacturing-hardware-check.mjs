import assert from 'node:assert/strict';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {defaultsFor} from '../assets/forma/storage.js';
import {runnerProfile,runnerAssessment} from '../assets/forma/hardware.js';
import {panelBlank} from '../assets/forma/production/panel-blank.js';
import {manufacturingReport,manufacturingCsv} from '../assets/forma/production/manufacturing.js';
import {reassembleCarcass} from '../assets/forma/production/reassemble-carcass.js';
import {cuttingList,cuttingPlan} from '../assets/forma/production/nesting.js';
const make=(params={})=>normalizeDesign({family:'storage',kind:'wardrobe',style:'japandi',seed:2,params:{...defaultsFor('wardrobe'),...params}});
const old=make(), oldC=compileDesign(old),before=JSON.stringify(old);
const base=manufacturingReport(oldC,old);
assert.equal(base.back_fits.filter(b=>b.status==='retention_incomplete').length,2);
assert.equal(base.drawer_hardware[0].outer_width_mm,488.6);
const acc=make({runnerSystem:'accuride-3832ec',backConstruction:'module-grooved',connectorSystem:'rastex15-18-du232t'}),c=compileDesign(acc),report=manufacturingReport(c,acc);
assert.deepEqual(c.meta.overall,oldC.meta.overall);
assert.equal(report.back_fits.length,2);assert(report.back_fits.every(b=>b.missing_edges.length===0));
assert.equal(report.drawer_hardware[0].outer_width_mm,487);
assert.equal(report.drawer_hardware[0].product_code,'3832-C20EC');
assert(report.reconstruction.complete);assert.equal(report.reconstruction.scope,'carcass_and_module_backs_only');
assert.equal(report.carcass_joints.length,10);assert.equal(report.carcass_joints.reduce((s,j)=>s+j.fixings.length,0),30);
for(const j of report.carcass_joints)for(const f of j.fixings)assert.deepEqual(f.edge_entry_world_mm,f.side_entry_world_mm);
for(const op of report.parts.flatMap(q=>q.operations).filter(op=>op.kind==='back_groove_candidate')){
 assert.equal(op.width_mm,8.4);assert.equal(op.depth_mm,7.5);assert(op.clearance_budget_mm.groove_minus_max_back>0);assert(op.clearance_budget_mm.depth_minus_max_insertion>0);
}
const bad=structuredClone(report);bad.parts.find(q=>q.id==='m1-top').blank.blank_xyz_mm[0]+=5;
assert.equal(reassembleCarcass(bad,acc).complete,false,'altered cut fails independent reconstruction');
const missing=structuredClone(report);missing.parts=missing.parts.filter(q=>q.id!=='m1-back');assert.equal(reassembleCarcass(missing,acc).complete,false);
const moved=structuredClone(report);moved.parts.find(q=>q.id==='m1-top').placement.position_mm[0]+=5;assert.equal(reassembleCarcass(moved,acc).complete,false,'placement is comparison only');
const hettich=compileDesign(make({runnerSystem:'hettich-ka5632-ss-2025'}));
assert.equal(hettich.parts.find(q=>q.role==='box-side').geom.w,14);
assert.equal(hettich.parts.find(q=>q.role==='box-bottom').geom.w,460.6);
assert.equal(hettich.parts.find(q=>q.role==='box-bottom').hardware.product_code,'9221528');
assert.throws(()=>runnerProfile('imaginary'));
assert(runnerAssessment('accuride-3832ec',{openingWidth:700,boxHeight:100,length:500,availableDepth:550}).issues.includes('box_wider_than_slide_length'));
assert(runnerAssessment('accuride-3832ec',{openingWidth:500,boxHeight:40,length:500,availableDepth:500}).issues.includes('insufficient_depth'));
for(const [w,d]of [[571,541],[300,541]]){
 const b=panelBlank({role:'shelf-adj',band:'front',geom:{fn:'cushion',w,h:18,d}},1);
 assert.equal(b.blank_xyz_mm[2],d-1);assert.equal(b.blank_xyz_mm[0],w);assert.deepEqual(b.reconstructed_xyz_mm,b.finished_xyz_mm);
}
const oversize={parts:[{id:'whole-plinth',role:'plinth',mat:'case',band:'long',geom:{fn:'cushion',w:4000,h:120,d:18},pos:[0,60,0],rot:[0,0,0]}]};
const cut=cuttingList(oversize,old);assert.equal(cut.rows[0].l,4000);assert.equal(cut.rows[0].qty,1);assert.equal(cut.rows[0].split,undefined);
assert.equal(cuttingPlan(oversize,old).complete,false);assert.equal(cuttingPlan(oversize,old).unplaced.length,1);
assert.equal(JSON.stringify(old),before);assert.equal(report.production_approved,false);
const csv=structuredClone(report);csv.parts[0].id='=1+1';assert(manufacturingCsv(csv).includes("'=1+1"));
for(const family of ['kitchen','bath']){
 const d=normalizeDesign({family,kind:family==='kitchen'?'run':'basin',style:'japandi',seed:2,params:{runnerSystem:'hettich-ka5632-ss-2025',connectorSystem:'rastex15-18-du232t',backConstruction:'module-grooved'}});
 const compiled=compileDesign(d);assert.equal(d.params.runnerSystem,'hettich-ka5632-ss-2025');assert(compiled.parts.some(q=>q.hardware?.profile==='hettich-ka5632-ss-2025'));
}
console.log('PASS hardware-dependent box geometry, legacy dimensions, module backs, 30 nominal mating fixings, limited independent reconstruction and three perturbations, edge axes, oversize rejection, kitchen/bath propagation, source preservation and CSV safety. Not production certification.');
