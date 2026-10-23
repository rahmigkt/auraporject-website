import assert from 'node:assert/strict';import fs from 'node:fs';
import {FAMILIES} from '../assets/forma/families.js';
import {STARTS} from '../assets/forma/starts.js';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';
import {manufacturingReport} from '../assets/forma/production/manufacturing.js';
const result={scope:'Generated manufacturing inventory; not full assembly, physical tests or engineering approval',models:0,parts:0,families:{},categories:{},blank_correspondence:0,recipe_required:0,production_approved:0};
for(const family of ['seating','table','storage','kitchen','bath']){
 const starts=FAMILIES[family].starts||STARTS[family];result.families[family]=0;
 for(const[kind,entries]of Object.entries(starts))for(const e of entries){
  const design=normalizeDesign({family,kind,style:e.style,seed:e.seed,params:e.p,materials:e.m}),before=JSON.stringify(design),c=compileDesign(design),r=manufacturingReport(c,design);
  assert.equal(r.part_count,c.parts.length);assert.equal(r.production_approved,false);assert.equal(JSON.stringify(design),before);assert.equal(new Set(r.parts.map(p=>p.id)).size,r.part_count);
  for(const p of r.parts){
   assert.equal(p.production_approved,false);result.categories[p.category]=(result.categories[p.category]||0)+1;
   if(p.blank){assert(p.blank.blank_xyz_mm.every(v=>Number.isFinite(v)&&v>0));assert.deepEqual(p.blank.reconstructed_xyz_mm,p.blank.finished_xyz_mm.map(v=>Math.round(v*1000)/1000));result.blank_correspondence++;}else result.recipe_required++;
  }
  result.models++;result.parts+=r.part_count;result.families[family]++;
 }
}
assert.equal(result.models,445);assert.equal(result.parts,21546);
const arg=process.argv.indexOf('--output');if(arg>=0)fs.writeFileSync(process.argv[arg+1],JSON.stringify(result,null,2));
console.log('PASS '+JSON.stringify(result));
