import assert from 'node:assert/strict';
import {ROOM_FAMILIES,choicesFor,reconcileRoomSelection,roomForFamily} from '../assets/choice-flow.js';
import {normalizeStudio} from '../assets/design-library.js';
for(const [room,expected]of Object.entries(ROOM_FAMILIES)){const ids=choicesFor('family',normalizeStudio(),{room}).map(c=>c.id);assert.deepEqual(ids,expected);assert(ids.length);}
assert(!choicesFor('family',normalizeStudio(),{room:'living'}).some(c=>['bed','nightstand','wardrobe','dresser'].includes(c.id)));
assert.equal(roomForFamily('bed'),'bedroom');assert.equal(roomForFamily('desk'),'office');assert.equal(roomForFamily('table'),'dining');
const bed=normalizeStudio({family:'bed'}),brief={room:'bedroom',familyChosen:true,dimensionsEntered:true,sizePreset:'generous',accepted:['room','family','size']};
const switched=reconcileRoomSelection(bed,brief,'living');assert.equal(switched.state.family,'sofa');assert.equal(switched.brief.familyChosen,false);assert.equal(switched.brief.dimensionsEntered,false);assert.deepEqual(switched.brief.accepted,['room']);
const sofa=normalizeStudio({family:'sofa'});assert.equal(reconcileRoomSelection(sofa,{familyChosen:true},'living').brief.familyChosen,true);
assert.throws(()=>reconcileRoomSelection(sofa,{},'__proto__'));
console.log('PASS room-specific family lists, incompatible restored/changed selection reset, compatible selection and direct product room inference.');
