import assert from 'node:assert/strict';
import {compileStudio,normalizeStudio} from '../assets/design-library.js';
import {partCorners} from '../assets/reference-studies.js';
import {upholsteryMesh} from '../assets/upholstery-mesh.js';
import {buildTechnicalPacket,technicalCsv,technicalDxf} from '../assets/technical-packet.js';
import {catalogueSelect,catalogueSteps,catalogueChoices} from '../assets/catalogue-flow.js';
let count=0;const fingerprints=[];
for(const family of ['sofa','armchair'])for(const archetype of ['modern','chester','lounge','timber'])for(const width of family==='sofa'?[120,210,330]:[65,85,130])for(const height of [65,85,115]){
 const m=compileStudio({family,archetype,width,height,depth:95});assert(m.parts.length);for(const p of m.parts){assert(p.size.every(v=>Number.isFinite(v)&&v>0));for(const v of partCorners(p)){assert(v[0]>=-m.width/2-1e-6&&v[0]<=m.width/2+1e-6,p.role);assert(v[1]>=-1e-6&&v[1]<=m.height+1e-6,p.role);assert(v[2]>=-m.depth/2-1e-6&&v[2]<=m.depth/2+1e-6,p.role);}}
 const packet=buildTechnicalPacket(m);assert.equal(packet.groups.reduce((v,g)=>v+g.quantity,0),m.parts.length);assert(packet.views.every(v=>!v.includes('NaN')));assert(technicalCsv(packet).includes('X_mm'));assert(technicalDxf(packet).includes('$INSUNITS'));count++;
 if(width===210&&height===85)fingerprints.push(JSON.stringify(m.parts.map(p=>[p.role,p.shape,p.size])));
}
assert.equal(new Set(fingerprints).size,4);
const chester=compileStudio({family:'sofa',archetype:'chester',legs:'turned'}),quilt=chester.parts.find(p=>p.shape==='quilted'),mesh=upholsteryMesh(quilt);assert(mesh.positions.every(Number.isFinite));assert(mesh.indices.every(i=>i<mesh.positions.length/3));assert(chester.parts.some(p=>p.role==='tuft-button'));assert(chester.parts.some(p=>p.shape==='turned'));
assert(mesh.positions.some((v,i)=>i%3===2&&v>0&&v<quilt.size[2]/2-.02),'real tuft depth required');
let state=normalizeStudio(),brief={room:'living',group:'seating'};({state,brief}=catalogueSelect(state,brief,'family','sofa'));assert.equal(state.archetype,'modern');assert(catalogueSteps(state,brief).includes('archetype'));({state,brief}=catalogueSelect(state,brief,'archetype','chester'));assert(!catalogueSteps(state,brief).includes('back'));assert(!catalogueSteps(state,brief).includes('arms'));assert.equal(catalogueChoices('archetype',state,brief).length,4);assert.throws(()=>catalogueSelect(state,brief,'archetype','unknown'));
console.log(`PASS ${count} independent upholstery assemblies, part bounds, BOM totals, distinct topology, actual tuft mesh and style constraints.`);
