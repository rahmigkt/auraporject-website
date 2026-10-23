import assert from 'node:assert/strict';import fs from 'node:fs';
import {FAMILIES} from '../assets/forma/families.js';import {STARTS} from '../assets/forma/starts.js';
import {normalizeDesign,compileDesign} from '../assets/forma/generate.js';import {manufacturingReport} from '../assets/forma/production/manufacturing.js';
const result={scope:'445 model source-profile/nominal operation audit; invalid models remain rejected, not corrected or manufacturing approved',models:0,parts:0,operations:0,hinges:0,joints:0,families:{},invalid_models:[],incomplete_recipes:[],unresolved_hinges:[],production_approved:0};
for(const family of ['seating','table','storage','kitchen','bath'])for(const[kind,entries]of Object.entries(FAMILIES[family].starts||STARTS[family]))for(const e of entries){
 const design=normalizeDesign({family,kind,style:e.style,seed:e.seed,params:{...e.p,railSystem:'hettich-sl786',shelfSupportSystem:'hettich-16181',runnerFixingSystem:'hettich-6x14-trial',hingeSystem:'blum-110-inserta-expando',runnerSystem:'hettich-ka5632-ss-2025',connectorSystem:'rastex15-18-du232t',backConstruction:'module-grooved'},materials:e.m}),saved=JSON.stringify(design),c=compileDesign(design),r=manufacturingReport(c,design),id=`${family}/${kind}/${e.style}/${e.seed}`;
 assert.equal(JSON.stringify(design),saved);assert.equal(r.production_approved,false);assert.equal(r.parts.length,c.parts.length);
 const n=r.parts.reduce((s,p)=>s+p.operations.length,0);result.operations+=n;result.hinges+=r.hinge_hardware.length;result.joints+=r.joint_mating.connections.length;
 if(r.invalid_operations.length||r.joint_mating.invalid.length){assert(r.blockers.includes('operation_outside_stock_or_unverified_shape')||r.blockers.includes('mating_bore_mismatch'));result.invalid_models.push({id,operations:r.invalid_operations,mates:r.joint_mating.invalid});}
 const recipeBlocks=r.blockers.filter(b=>b.startsWith('selected_')||b==='drawer_blank_reconstruction_mismatch');if(recipeBlocks.length)result.incomplete_recipes.push({id,blockers:recipeBlocks});
 const incomplete=r.hinge_hardware.filter(h=>!h.mounting_side||!h.cup_world_mm);if(incomplete.length)result.unresolved_hinges.push({id,hinges:incomplete});
 result.models++;result.parts+=r.part_count;result.families[family]=(result.families[family]||0)+1;
}
assert.equal(result.models,445);const arg=process.argv.indexOf('--output');if(arg>=0)fs.writeFileSync(process.argv[arg+1],JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,invalid_models:result.invalid_models.length,incomplete_recipes:result.incomplete_recipes.length,unresolved_hinges:result.unresolved_hinges.length}));
