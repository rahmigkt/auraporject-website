import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matchHardwareTrial,validateLocalHardwarePreview} from '../assets/forma/production/hardware-trial.js';
const data=JSON.parse(readFileSync('../../outputs/cad-fcl-pilot/input.json','utf8'));
const report=JSON.parse(readFileSync('assets/forma/production/hardware-assembly-trial-report.json','utf8'));
assert.equal((await matchHardwareTrial(data,report)).cad_instances,42);
assert.equal(await matchHardwareTrial({...data,design:{...data.design,changed:true}},report),null);
await assert.rejects(()=>matchHardwareTrial(data,{...report,production_approved:true}));
await assert.rejects(()=>matchHardwareTrial(data,{...report,real_hardware_motion_verified:true}));
assert.equal(report.actual_mesh_positive_control,true);
assert.equal(report.runner_fit.length,4);
for(const row of report.runner_fit){assert.deepEqual(row.delta_mm,[0,0,0,0,-13]);assert.equal(row.drop_in_compatible,false);}
assert.equal(report.hinge_fit.length,15);
for(const row of report.hinge_fit){assert.equal(row.new_fixing_pitch_mm,52);assert.equal(row.drop_in_compatible,false);assert.equal(row.motion_verified,false);}
const preview={schema:'aura.local-hardware-preview/1',production_approved:false,input_sha256:report.input_sha256,meshes:{a:{positions:[0,0,0,1,0,0,0,1,0],indices:[0,1,2]}},instances:[{id:'a',mesh:'a',motion:0,matrix:[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}]};
assert.equal(validateLocalHardwarePreview(preview,report.input_sha256),preview);
for(const mutate of [p=>p.input_sha256='0'.repeat(64),p=>p.meshes.a.positions[0]=NaN,p=>p.meshes.a.indices[0]=5,p=>p.instances[0].matrix[0][0]=2,p=>p.instances.push({...p.instances[0]}),p=>p.instances[0].motion=2]){const bad=structuredClone(preview);mutate(bad);assert.throws(()=>validateLocalHardwarePreview(bad,report.input_sha256));}
console.log('PASS actual trial report scope and all4runner/15hinge rejection states;wrong input/approval and malformed local mesh reject');

assert.equal(report.datum_correction.corrected,true);
assert.equal(report.native_nominal_intersections.length,6);
for(const x of report.native_nominal_intersections.slice(0,3))assert.equal(x.intersection_mm3,0);
assert.ok(report.native_nominal_intersections[3].intersection_mm3>1);
