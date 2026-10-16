import assert from 'node:assert/strict';
import {SPACES,GROUPS,PRODUCTS,PUBLIC_TREE,productsFor,groupsForSpace,allowedProduct,MAIN_PRODUCT_IDS} from '../assets/furniture-taxonomy.js';
import {catalogueSelect,currentProduct,restoreCatalogue} from '../assets/catalogue-flow.js';
import {normalizeStudio} from '../assets/design-library.js';
let rejected=0,valid=0;
for(const room of Object.keys(SPACES))for(const group of Object.keys(GROUPS))for(const id of Object.keys(PRODUCTS)){
 const brief={room,group,product:id},allowed=allowedProduct(room,group,id);
 if(allowed){assert(currentProduct(brief));assert.equal(catalogueSelect(normalizeStudio(),brief,'family',id).brief.product,id);valid++;}
 else {assert.equal(currentProduct(brief),null);assert.throws(()=>catalogueSelect(normalizeStudio(),brief,'family',id));rejected++;}
}
assert.deepEqual(groupsForSpace('kitchen'),['kitchenCabinets','kitchenWorktops','kitchenIslands','bespoke']);
assert.deepEqual(productsFor('kitchen').map(p=>p.id),['kitchenBase','kitchenWall','pantry','kitchenWorktop','island','custom']);
assert(!productsFor('bedroom').some(p=>['tv','desk','sideTable','armchair'].includes(p.id)));
for(const [room,id]of [['entry','coatStorage'],['office','officeChair'],['nursery','nurseryWardrobe'],['bathroom','bathCabinet'],['outdoor','outdoorChair']])assert(productsFor(room).some(p=>p.id===id));
const migrated=restoreCatalogue(normalizeStudio(),{room:'kitchen',group:'fitted',product:'kitchenBase'});assert.equal(migrated.brief.group,'kitchenCabinets');
assert.equal(restoreCatalogue(normalizeStudio(),{room:'kitchen',group:'storage',product:'wardrobe'}).brief.product,null);
let changed=catalogueSelect(normalizeStudio(),{room:'bedroom',group:'storage',product:'wardrobe',request:'bedroom request'},'room','kitchen');assert.equal(changed.brief.product,null);assert.equal(changed.brief.group,null);assert.equal(changed.brief.request,'');
assert.equal(Object.keys(PRODUCTS).length,88);assert(MAIN_PRODUCT_IDS.length<45);
console.log(`PASS ${valid} allowed and ${rejected} rejected space/group/product triples, migrations and context resets.`);
