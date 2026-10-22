import assert from 'node:assert/strict';import fs from 'node:fs';
import {partDimensions,partDimensionsCsv} from '../assets/forma/part-dimensions.js';
import {projectWithDimensions} from '../assets/ev/project-dimensions.js';
import {FAMILIES} from '../assets/forma/families.js';
import {STARTS} from '../assets/forma/starts.js';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {applyOverrides} from '../assets/forma/overrides.js';
const box={id:'test',role:'leg',mat:'wood',geom:{fn:'box',w:100,h:20,d:40},pos:[50,10,0],rot:[0,0,Math.PI/2],cut:[100,40,20]},base={parts:[box],meta:{overall:{width:100,height:20,depth:40}}};
let m=partDimensions(base);assert.deepEqual(m.parts[0].local.xyz_mm,[100,20,40]);assert.deepEqual(m.parts[0].product.xyz_mm,[20,100,40]);assert.deepEqual(m.parts[0].declared_cut_mm,[100,40,20]);
const scaled=partDimensions(applyOverrides(base,[{tool:'transform',id:'test',scale:[2,1,1]}]));assert.equal(scaled.parts[0].local.xyz_mm[0],200);assert.equal(scaled.parts[0].cut_status,'review_after_override');
assert.equal(partDimensions(applyOverrides(base,[{tool:'remove',id:'test'}])).parts.length,0);
const bad=partDimensions({parts:[{...box,geom:{fn:'unhandled'}}]});assert.equal(bad.status,'incomplete');assert.equal(bad.parts[0].local,null);assert(!partDimensionsCsv(bad).includes('Infinity'));assert(!partDimensionsCsv(bad).includes('NaN'));
const buttons=partDimensions({parts:[{id:'button',role:'tuft-button',mat:'fabric',qty:2,geom:{fn:'buttons',points:[[0,0,0],[100,0,0]],r:5},pos:[0,0,0],rot:[0,0,0]}]});assert.equal(buttons.parts[0].members.length,2);assert.equal(buttons.parts[0].members[0].status,'measured');
const summary={models:{},parts:0,unavailable:[]};
for(const family of ['seating','table','storage','kitchen','bath']){
 const starts=FAMILIES[family].starts||STARTS[family];summary.models[family]=0;
 for(const[kind,entries]of Object.entries(starts))for(const e of entries){
  const d=normalizeDesign({family,kind,style:e.style,seed:e.seed,params:e.p,materials:e.m}),original=JSON.stringify(d),c=compileDesign(d),r=partDimensions(c);assert.equal(r.parts.length,c.parts.length);assert.equal(r.production_approved,false);assert.equal(JSON.stringify(d),original);assert.equal(new Set(r.parts.map(p=>p.id)).size,r.parts.length,'Unique generated IDs');
  for(const p of r.parts)if(p.status!=='measured')summary.unavailable.push({family,kind,id:p.id,reason:p.reason});
  summary.models[family]++;summary.parts+=r.parts.length;
 }
}
assert.equal(summary.unavailable.length,0,JSON.stringify(summary.unavailable.slice(0,5)));
const plan=JSON.parse(fs.readFileSync('assets/ev/ornekler/sohbet-1.json','utf8')),before=JSON.stringify(plan),project=projectWithDimensions(plan);assert.equal(JSON.stringify(plan),before);assert.equal(project.component_dimensions.products.length,plan.items.length);assert.equal(project.component_dimensions.products.find(i=>i.id==='mutfak').dimensions.nominal_overall.width,3900);
assert.equal(project.measurement_summary.walls.length,plan.walls.length);assert.equal(project.measurement_summary.rooms.length,plan.spaces.length);assert.equal(project.measurement_summary.openings.length,plan.openings.length);
assert(project.measurement_summary.rooms.find(r=>r.id==='salon').net_polygon_area_m2>26);
assert.equal(projectWithDimensions({items:[{id:'bad',design:{family:'missing'}}]}).component_dimensions.products[0].status,'unavailable');
assert.equal(projectWithDimensions(project).component_dimensions.products.length,project.component_dimensions.products.length,'Re-export refreshes rather than nesting');
console.log(JSON.stringify({status:'PASS',...summary,controls:['rotated axes','designer scaling/removal','explicit missing geometry','button members','source preservation','10home products with bedroom compatibility','room/wall/opening measures','unsupported design','re-export refresh']}));
const malformed=partDimensions({parts:[{...box,pos:[NaN,0,0]}]});assert.equal(malformed.parts[0].position_mm,null);assert.equal(malformed.status,'incomplete');assert(!partDimensionsCsv(malformed).includes('NaN'));
const formula=partDimensions({parts:[{...box,id:'=1+1'}]});assert(partDimensionsCsv(formula).includes("'=1+1"));assert(partDimensionsCsv(buttons).includes('button#1'));
const machining=partDimensions({parts:[{...box,geom:{fn:'cut',inner:box.geom,ops:[]}}]});assert.equal(machining.parts[0].status,'machining_envelope_unverified');assert.equal(machining.status,'incomplete');assert.equal(machining.requires_machining_review[0],'test');
