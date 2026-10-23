import fs from 'node:fs';
import {normalizeDesign,compileDesign} from '../../assets/forma/generate.js';
import {assemblyCollisionAudit} from '../../assets/forma/production/assembly-collision.js';
const arg=k=>{const i=process.argv.indexOf(k);if(i<0||!process.argv[i+1])throw Error(k+' required');return process.argv[i+1];};
const input=JSON.parse(fs.readFileSync(arg('--model'),'utf8')),d=normalizeDesign(input.design||input);
const result=await assemblyCollisionAudit(compileDesign(d),d,{motion:!process.argv.includes('--static-only')});
fs.writeFileSync(arg('--out'),JSON.stringify(result,null,2));
console.log(JSON.stringify({status:result.status,stock_parts:result.stock_parts,unverified_parts:result.unverified_parts.length,collisions:result.collisions.length,errors:result.errors.length,stats:result.stats,production_approved:false}));
