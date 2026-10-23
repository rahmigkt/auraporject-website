import assert from 'node:assert/strict';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {defaultsFor} from '../assets/forma/storage.js';
import {manufacturingReport} from '../assets/forma/production/manufacturing.js';
import {verifyRastexMates} from '../assets/forma/production/joint-mating.js';
import {hingeForOverlay} from '../assets/forma/hardware.js';
const d=normalizeDesign({family:'storage',kind:'wardrobe',style:'japandi',seed:2,params:{...defaultsFor('wardrobe'),hingeSystem:'blum-110-inserta-expando',runnerSystem:'hettich-ka5632-ss-2025',connectorSystem:'rastex15-18-du232t',backConstruction:'module-grooved'}});
const c=compileDesign(d),r=manufacturingReport(c,d),ops=r.parts.flatMap(p=>p.operations);
assert.equal(r.hinge_hardware.length,15);assert.equal(ops.filter(o=>o.kind==='hinge_cup_bore').length,15);assert.equal(ops.filter(o=>o.kind==='hinge_inserta_bore').length,30);assert.equal(ops.filter(o=>o.kind==='hinge_plate_expando_bore').length,30);
assert.deepEqual(r.hinge_hardware[0].cup_world_mm,[-875.5,180,282]);assert.deepEqual(r.hinge_hardware[0].plate_datum_world_mm,[-882,180,243.5]);
assert.equal(r.invalid_operations.length,0);assert.equal(r.joint_mating.connections.length,38);assert.deepEqual(r.joint_mating.invalid,[]);assert.equal(r.plinth_joints.length,8);
assert.equal(r.production_approved,false);assert(r.hinge_hardware.every(h=>h.issues.includes('door_weight_hinge_count_and_sweep_require_validation')));
assert.equal(hingeForOverlay(17).code,'71B3590');assert.equal(hingeForOverlay(17).tb,6);assert.equal(hingeForOverlay(7.5).code,'71B3690');assert.equal(hingeForOverlay(-1,true).tb,6);assert(hingeForOverlay(50).issues.length);assert(hingeForOverlay(NaN).issues.length);
const clone=()=>structuredClone(r.parts),check=p=>verifyRastexMates(p,r.selected_connector);
const cached=clone();for(const p of cached)for(const o of p.operations)if(o.world_center_mm)o.world_center_mm=[999,999,999];assert.deepEqual(check(cached).invalid,[],'cached generator coordinates are not evidence');
for(const change of [
 p=>p.operations.find(o=>o.connection_id).center_finished_local_mm[2]+=3,
 p=>p.placement.position_mm[2]+=3,
 p=>p.operations.find(o=>o.connection_id).center_finished_local_mm[0]=NaN,
 p=>p.operations.find(o=>o.connection_id).diameter_mm=99,
 p=>p.operations.splice(p.operations.findIndex(o=>o.connection_id),1)
]){const parts=clone(),p=parts.find(p=>p.operations.some(o=>o.kind==='rastex_edge_bore'));change(p);assert(check(parts).invalid.length,'perturbed joint rejected');}
for(const [family,kind]of [['kitchen','run'],['bath','column']]){const x=normalizeDesign({family,kind,style:'japandi',seed:2,params:{hingeSystem:'blum-110-inserta-expando'}});assert.equal(x.params.hingeSystem,d.params.hingeSystem);const a=manufacturingReport(compileDesign(x),x);assert(a.hinge_hardware.length);assert.equal(a.production_approved,false);}
console.log('PASS 15 source-profile hinges/75 bores;38 independently recomputed Rastex mates (30 carcass +8 plinth);5 negative mutations;cached-world independence;kitchen/bath propagation. Not assembly/load approval.');


