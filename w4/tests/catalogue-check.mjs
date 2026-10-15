import assert from 'node:assert/strict';
import {SPACES,GROUPS,PRODUCTS,groupsForSpace,productsFor} from '../assets/furniture-taxonomy.js';
import {catalogueSteps,catalogueSelect,catalogueChoices,catalogueSelected,restoreCatalogue,catalogueProject} from '../assets/catalogue-flow.js';
import {normalizeStudio,compileStudio,FAMILIES} from '../assets/design-library.js';
let count=0;for(const room of Object.keys(SPACES)){assert(groupsForSpace(room).length);for(const group of groupsForSpace(room)){assert(Object.hasOwn(GROUPS,group));for(const p of productsFor(room,group)){
 let state=normalizeStudio(),brief={accepted:[]};({state,brief}=catalogueSelect(state,brief,'room',room));({state,brief}=catalogueSelect(state,brief,'group',group));({state,brief}=catalogueSelect(state,brief,'family',p.id));assert.equal(catalogueSelected('family',state,brief),p.id);assert(catalogueChoices('family',state,brief).every(p=>p.spaces.includes(room)&&p.group===group));
 const record=catalogueProject(state,brief,'tr');if(p.family){assert(Object.hasOwn(FAMILIES,p.family));assert(compileStudio(state).parts.length);assert.equal(record.design.family,p.family);assert(record.parts.length);}else{assert.equal(record.design,null);assert.equal(record.parts.length,0);assert.equal(record.stage,'brief');assert.deepEqual(catalogueSteps(state,brief),['room','group','family','request','review']);}
 assert.equal(restoreCatalogue(state,brief).brief.product,p.id);count++;
 }}}
assert(!productsFor('living').some(p=>['bed','wardrobe','crib'].includes(p.id)));assert(productsFor('living').some(p=>p.id==='pouf'));assert(productsFor('living').some(p=>p.id==='nestingTables'));assert(productsFor('bedroom').some(p=>p.id==='vanity'));assert(productsFor('entry').some(p=>p.id==='shoeCabinet'));
let s=normalizeStudio({family:'bed'}),b=restoreCatalogue(s,{room:'bedroom',familyChosen:true}).brief;assert.equal(b.product,'bed');const changed=catalogueSelect(s,b,'room','living');assert.equal(changed.brief.product,null);assert.equal(changed.brief.familyChosen,false);assert.throws(()=>catalogueSelect(s,{room:'living',group:'seating'},'family','crib'));
console.log(`PASS ${Object.keys(SPACES).length} spaces, ${Object.keys(GROUPS).length} groups, ${Object.keys(PRODUCTS).length} product types, ${count} valid paths; no misleading drawing for unsupported products; saved-state migration and invalid cross-room choices.`);
