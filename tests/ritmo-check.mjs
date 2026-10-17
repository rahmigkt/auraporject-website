import assert from 'node:assert/strict';
import {initialRitmo,normalizeRitmo,compileRitmo,ritmoProject} from '../assets/ritmo-model.js';
import {buildTechnicalPacket} from '../assets/technical-packet.js';
import {partCorners} from '../assets/reference-studies.js';
let count=0;
for(const thickness of [18,22,25])for(const n of [2,3,4,5])for(const width of [1200,2400,3600])for(const height of [1400,2300,2700])for(const depth of [330,380,650]){
 const config=initialRitmo();while(config.columns.length<n)config.columns.push({id:'bay-extra-'+config.columns.length,weight:.5,sections:[{id:'x'+config.columns.length+'a',weight:.5,type:'doors'},{id:'x'+config.columns.length+'b',weight:2,type:'drawers'}]});config.columns=config.columns.slice(0,n);Object.assign(config,{width,height,depth,thickness});
 const model=compileRitmo(config),ids=new Set();
 for(const p of model.parts){assert.ok(!ids.has(p.uid),p.uid);ids.add(p.uid);assert.ok(p.size.every(v=>Number.isFinite(v)&&v>0));for(const [x,y,z]of partCorners(p)){assert.ok(Math.abs(x)<=model.width/2+.00001,p.uid+' x');assert.ok(y>=-.00001&&y<=model.height+.00001,p.uid+' y');assert.ok(Math.abs(z)<=model.depth/2+.00001,p.uid+' z');}}
 assert.equal(model.bays.length,n);assert.ok(model.cells.every(c=>c.height>=.17999&&c.width>=.27999));
 const packet=buildTechnicalPacket(model);assert.equal(packet.groups.reduce((n,g)=>n+g.quantity,0),model.parts.length);
 const restored=compileRitmo(JSON.parse(JSON.stringify(model.config)));assert.deepEqual(restored.config,model.config);assert.equal(restored.parts.length,model.parts.length);count++;
}
const a=initialRitmo(),before=compileRitmo(a);a.columns[1].sections[2].type='drawers';const after=compileRitmo(a);
assert.equal(after.parts.filter(p=>p.role==='drawer-front').length,before.parts.filter(p=>p.role==='drawer-front').length+2);
const first=compileRitmo(initialRitmo()),open=compileRitmo(initialRitmo(),{open:true});assert.deepEqual(first.parts.map(p=>p.uid),open.parts.map(p=>p.uid));assert.ok(open.parts.some(p=>p.rotation?.[1]));
assert.equal(ritmoProject(initialRitmo()).engine,'aura-ritmo-v1');
assert.equal(normalizeRitmo({wood:'__proto__'}).wood,'walnut');
const coloured=initialRitmo();coloured.columns[1].sections[1].type='doors';coloured.columns[1].sections[2].type='doors';coloured.columns[1].sections[2].color='olive';const colourPacket=buildTechnicalPacket(compileRitmo(coloured));
assert.ok(colourPacket.groups.some(g=>g.material.includes('Zeytin')));
assert.ok(colourPacket.groups.some(g=>g.material.includes('Oksit')));
assert.ok(colourPacket.groups.filter(g=>g.role==='door').length>=3,'same dimensions with different finishes must not be merged');
console.log(`PASS ${count} cabinet assemblies: part bounds, positive dimensions, stable identities, 2–5 bays, BOM, save/restore and independent compartment changes.`);
