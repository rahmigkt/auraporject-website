import assert from 'node:assert/strict';
import {templateProject,placement,safeStudioSave} from '../assets/studio-templates.js';
import {FAMILIES,changeFamily} from '../assets/design-library.js';
import {normaliseProject,validateRoom} from '../assets/space-model.js';
for(let i=0;i<3;i++){
 const p=templateProject('home',i);assert(p.rooms.length>=8);assert.equal(new Set(p.rooms.map(r=>r.id)).size,p.rooms.length);assert.equal(p.source.license,'Apache-2.0');assert(p.rooms.some(r=>r.sourceZone));
 const r=templateProject('room',i).rooms[0];assert.equal(r.items.length,0);assert.equal(r.type,'living');
 for(const family of Object.keys(FAMILIES)){
  const d=changeFamily({},family),count=r.items.length;
  const proposal=placement(r,d,{x:r.width/2,z:r.depth/2});
  assert.equal(r.items.length,count,'A proposal must not create an item before confirmation');
  assert(!proposal.issues.some(v=>v.type==='outside'));
  const rejected=placement(r,d,{x:-100,z:-100});assert(rejected.issues.some(v=>v.type==='outside'));
  r.items.push({...proposal.item,id:'approved'});assert(placement(r,d,{x:r.width/2,z:r.depth/2}).issues.some(v=>v.type==='overlap'));
  assert(!placement(r,d,{x:r.width/2,z:r.depth/2},0,'approved').issues.some(v=>v.type==='overlap'));r.items=[];
 }
 const saved=safeStudioSave({version:1,scope:'home',templateIndex:i,project:p,design:changeFamily({},'sofa'),lights:{mode:'warm',intensity:9}});assert.equal(saved.lights.intensity,1.8);assert(saved.project.rooms[0].sourceZone);
}
const r=templateProject('room').rooms[0],sofa=changeFamily({},'sofa');assert.equal(r.openings[0].motion,'sliding');assert.equal(placement(r,sofa,{x:225,z:150}).issues.length,0);const p=templateProject('room');assert.equal(normaliseProject(p).rooms[0].openings[0].motion,'sliding');assert.throws(()=>safeStudioSave({version:99}));
console.log('PASS 3 imported home templates × 14 furniture families: proposals do not mutate rooms, bounds, occupancy, edit exclusion, sliding-door clearance and sanitised restore.');

const bedroom=templateProject('room',1,'bedroom');assert.equal(bedroom.rooms[0].type,'bedroom');assert(safeStudioSave({version:1,scope:'room',templateIndex:1,project:bedroom,design:sofa,lights:{mode:'day',intensity:1}}).project.rooms[0].sourceZone);

const tall=changeFamily({},'wardrobe'),lowRoom=templateProject('room').rooms[0];lowRoom.height=200;assert(placement(lowRoom,tall,{x:200,z:150}).issues.some(i=>i.type==='height'));
