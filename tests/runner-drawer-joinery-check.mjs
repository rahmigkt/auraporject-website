import assert from 'node:assert/strict';import fs from 'node:fs';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {defaultsFor} from '../assets/forma/storage.js';
import {manufacturingReport} from '../assets/forma/production/manufacturing.js';
import {machiningGeometryFiles} from '../assets/forma/production/machined-geometry.js';
import {reassembleDrawers} from '../assets/forma/production/reassemble-drawers.js';
const d=normalizeDesign({family:'storage',kind:'wardrobe',style:'japandi',seed:2,params:{...defaultsFor('wardrobe'),hingeSystem:'blum-110-inserta-expando',runnerSystem:'hettich-ka5632-ss-2025',runnerFixingSystem:'hettich-6x14-trial',connectorSystem:'rastex15-18-du232t',backConstruction:'module-grooved',shelfSupportSystem:'hettich-16181'}}),c=compileDesign(d),r=manufacturingReport(c,d);
assert.deepEqual(r.invalid_operations,[]);assert.deepEqual(r.joint_mating.invalid,[]);assert.equal(r.joint_mating.connections.length,54);assert.equal(r.runner_drilling.length,4);assert(r.runner_drilling.every(p=>p.support&&p.pilot_recipe_qualified===false));assert.equal(r.drawer_joinery.length,2);assert(r.drawer_joinery.every(p=>p.fixings.length===8&&p.grooves.length===4&&!p.issues.length));
assert.equal(r.drawer_reconstruction.length,2);assert(r.drawer_reconstruction.every(d=>d.complete));
for(const mutate of [p=>p.blank.blank_xyz_mm[0]+=4,p=>p.placement.position_mm[1]-=3]){const rows=structuredClone(r.parts);mutate(rows.find(p=>p.role==='box-bottom'));assert(reassembleDrawers(rows).some(d=>!d.complete));}
const ops=r.parts.flatMap(p=>p.operations);assert.equal(ops.length,313);assert.equal(ops.filter(o=>o.kind==='runner_cabinet_pilot').length,20);assert.equal(ops.filter(o=>o.kind==='runner_drawer_pilot').length,16);assert.equal(ops.filter(o=>o.kind==='drawer_bottom_groove').length,8);
const left=r.parts.find(p=>p.id==='b3c1-spacerL'),caseHoles=left.operations.filter(o=>o.kind==='runner_cabinet_pilot');assert.equal(left.blank.finished_xyz_mm[2],520);assert.equal(Math.min(...caseHoles.map(o=>o.center_finished_local_mm[2])),5.7);assert(caseHoles.every(o=>o.center_finished_local_mm[0]===25));
const last=caseHoles[4];assert.equal(last.world_center_mm[2],-253.8);assert.equal(last.world_center_mm[1],122.5);
const wrong=structuredClone(c);const short=wrong.parts.find(p=>p.id===left.id);short.geom.d=500;short.pos[2]+=10;assert(manufacturingReport(wrong,d).invalid_operations.length,'short spacer must not silently omit rear screw');
const noConnector=normalizeDesign({...d,params:{...d.params,connectorSystem:'legacy-unspecified'}});await assert.rejects(()=>machiningGeometryFiles(compileDesign(noConnector),noConnector),/çekmece/);
const otherRunner=normalizeDesign({...d,params:{...d.params,runnerSystem:'accuride-3832ec'}});await assert.rejects(()=>machiningGeometryFiles(compileDesign(otherRunner),otherRunner),/Ray/);
const exportResult=await machiningGeometryFiles(c,d);assert.equal(exportResult.manifest.machined.reduce((n,p)=>n+p.operations,0),313);assert(exportResult.manifest.machined.every(p=>p.after_volume_mm3<p.before_volume_mm3));
for(const [family,kind]of [['kitchen','run'],['bath','basin']]){const x=normalizeDesign({family,kind,style:'japandi',seed:2,params:{runnerSystem:d.params.runnerSystem,runnerFixingSystem:d.params.runnerFixingSystem,connectorSystem:d.params.connectorSystem}}),a=manufacturingReport(compileDesign(x),x);assert(a.runner_drilling.length);assert(a.runner_drilling.every(p=>p.support));assert.equal(a.production_approved,false);}
console.log('PASS313trial operations;54source-section mates;20cabinet/16drawer pilots;8bottom grooves;extended520mm spacer;3negative recipes;actualCSG;kitchen/bath propagation.No stock/material/load/pilot qualification.');
