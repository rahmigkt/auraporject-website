import assert from 'node:assert/strict';
import {operationBounds} from '../assets/forma/production/operation-bounds.js';
import {manufacturingReport,manufacturingOperationsCsv} from '../assets/forma/production/manufacturing.js';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
const d=normalizeDesign({family:'storage',kind:'wardrobe',style:'japandi',seed:2,params:{connectorSystem:'rastex15-18-du232t',backConstruction:'module-grooved',runnerSystem:'accuride-3832ec'}});
const report=manufacturingReport(compileDesign(d),d),ops=report.parts.flatMap(p=>p.operations.map(o=>({p,o})));
assert.equal(ops.length,122);assert.deepEqual(report.invalid_operations,[]);
for(const {p,o}of ops){assert.equal(o.stock_bounds.status,'nominal_containment_only');assert.equal(o.stock_bounds.production_approved,false);assert.equal(JSON.stringify(operationBounds(p,o)),JSON.stringify(o.stock_bounds));}
const {p,o}=ops.find(x=>x.o.kind==='rastex_cam_bore');
let negatives=0;
const reject=change=>{const bad=structuredClone(o);change(bad);assert.equal(operationBounds(p,bad).status,'invalid');negatives++;};
reject(o=>o.depth_mm=1000);reject(o=>o.depth_mm=NaN);reject(o=>o.diameter_mm=0);reject(o=>o.diameter_mm=Infinity);
reject(o=>o.depth_mm=p.blank.finished_xyz_mm[o.entry_axis]);
reject(o=>o.center_finished_local_mm[2]=-2);reject(o=>o.entry_sign*=-1);reject(o=>o.entry_axis=3);reject(o=>o.kind='unknown');reject(o=>o.center_finished_local_mm[0]=NaN);
const g=ops.find(x=>x.o.kind==='back_groove_candidate');
for(const patch of [{length_mm:1e6},{width_mm:1e6},{length_axis:g.o.entry_axis}]){assert.equal(operationBounds(g.p,{...g.o,...patch}).status,'invalid');negatives++;}
assert.equal(operationBounds({...p,blank:null},o).status,'invalid');negatives++;
assert.equal(operationBounds({...p,blank:{...p.blank,requires_outline:true}},o).status,'invalid');negatives++;
assert(manufacturingOperationsCsv(report).includes('Stock bounds status'));assert.equal(report.production_approved,false);
console.log(JSON.stringify({status:'PASS',nominal_operations:ops.length,negative_cases:negatives,scope:'Nominal finished-stock/tool-envelope containment; no actual CSG, tolerance stack, CNC or load approval'}));
