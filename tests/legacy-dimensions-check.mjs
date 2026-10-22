import assert from 'node:assert/strict';
import {componentDimensions} from '../assets/component-dimensions.js';
import {projectRecord} from '../assets/choice-flow.js';
import {FAMILIES} from '../assets/design-library.js';
import {ritmoProject,initialRitmo} from '../assets/ritmo-model.js';
import {textileAssessmentFiles} from '../assets/forma/review-document.js';
for(const family of Object.keys(FAMILIES)){const r=projectRecord({family},{dimensionsEntered:true},'tr');assert.equal(r.units.design_dimensions,'cm');assert.equal(r.units.part_size,'m');assert.equal(r.component_dimensions.parts.length,r.parts.length);assert(r.component_dimensions.parts.every(p=>p.status==='declared_model_dimensions'));for(const[n,p]of r.parts.entries())assert.deepEqual(r.component_dimensions.parts[n].local_xyz_mm,p.size.map(v=>Math.round(v*1000000)/1000));}
const r=ritmoProject(initialRitmo());assert.equal(r.units.design_dimensions,'mm');assert.equal(r.component_dimensions.parts.length,r.parts.length);assert(r.component_dimensions.parts.every(p=>p.status==='declared_model_dimensions'));
const p={role:'test',material:'wood',size:[1,.2,.4],position:[0,.1,0],rotation:[0,0,Math.PI/2]},before=JSON.stringify(p),m=componentDimensions({parts:[p]});assert.deepEqual(m.parts[0].local_xyz_mm,[1000,200,400]);assert.deepEqual(m.parts[0].placed_xyz_mm,[200,1000,400]);assert.equal(JSON.stringify(p),before);assert.equal(componentDimensions({parts:[{...p,size:[NaN,1,1]}]}).parts[0].status,'unavailable');
const tx=JSON.parse(textileAssessmentFiles({curtain:{system:'stor'}},'tr')[1].data);assert.equal(tx.measurements.status,'preview_fixture_not_site_measured');assert.equal(tx.measurements.actual_site_dimensions,null);assert.equal(tx.measurements.window.w,1800);
console.log('PASS14guided families + Ritmo part-unit mapping; m-to-mm conversion; rotated extents; source preservation; invalid size; textile preview explicitly separate from real site measurements');
