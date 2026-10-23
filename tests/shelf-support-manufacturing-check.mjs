import assert from 'node:assert/strict';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {defaultsFor} from '../assets/forma/storage.js';
import {manufacturingReport} from '../assets/forma/production/manufacturing.js';
for(const [family,kind]of [['storage','wardrobe'],['kitchen','run'],['bath','column']]){
 const d=normalizeDesign({family,kind,style:'japandi',seed:2,params:{...(family==='storage'?defaultsFor(kind):{}),shelfSupportSystem:'hettich-16181'}}),c=compileDesign(d),r=manufacturingReport(c,d),ops=r.parts.flatMap(p=>p.operations).filter(o=>o.kind==='shelf_support_bore');
 assert.equal(d.params.shelfSupportSystem,'hettich-16181');assert(ops.length>0);assert.equal(ops.length,r.shelf_hardware.length);assert(r.shelf_hardware.every(s=>s.support));assert.equal(r.invalid_operations.length,0);
 for(const op of ops){assert.equal(op.diameter_mm,5);assert.equal(op.depth_mm,8.5);assert.equal(op.stock_bounds.status,'nominal_containment_only');}
 for(const pin of c.parts.filter(p=>p.role==='shelf-pin')){assert.equal(pin.hardware.proxy_only,true);assert.equal(pin.geom.profile.at(-1)[1],3.75);}
 const bad=structuredClone(c);bad.parts.find(p=>p.role==='shelf-pin').pos[1]+=5;assert(manufacturingReport(bad,d).blockers.includes('selected_shelf_support_recipe_incomplete'));
 const legacy=normalizeDesign({...d,params:{...d.params,shelfSupportSystem:'legacy-generic'}}),old=compileDesign(legacy);assert(old.parts.filter(p=>p.role==='shelf-pin').every(p=>p.geom.profile.at(-1)[1]===2.5));assert.equal(manufacturingReport(old,legacy).shelf_hardware.length,0);
 console.log('PASS '+family+' source5mm/8mm/3.75mm dimensions,trial8.5mm bores,placement remapping,proxy disclosure,negative bearing datum and legacy geometry');
}
