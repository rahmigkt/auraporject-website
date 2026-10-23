import assert from 'node:assert/strict';
import {normalizeDesign} from '../assets/forma/generate.js';
import {assemblyCollisionAudit} from '../assets/forma/production/assembly-collision.js';
const d=normalizeDesign({family:'storage',kind:'wardrobe'});
const cube=(id,x,role='side')=>({id,role,mat:'case',geom:{fn:'cushion',w:10,h:10,d:10,r:0},pos:[x,0,0],rot:[0,0,0]});
const run=parts=>assemblyCollisionAudit({parts},d,{motion:false});
let a=await run([cube('a',0),cube('b',5)]);assert.equal(a.collisions.length,1);assert(Math.abs(a.collisions[0].intersection_mm3-500)<.01);assert.equal(a.production_approved,false);
assert.equal((await run([cube('a',0),cube('b',10)])).collisions.length,0,'touching is not penetrating');
assert.equal((await run([cube('a',0),cube('b',11)])).collisions.length,0);
const rotated=cube('b',9);rotated.rot=[0,Math.PI/4,0];a=await run([cube('a',0),rotated]);assert(a.collisions.length);
const bad=cube('bad',NaN);await assert.rejects(()=>run([bad]));
await assert.rejects(()=>assemblyCollisionAudit({parts:[cube('a',0)]},d,{angleStep:0}));
const special={...cube('proxy',0),mat:'metal',nocut:true};a=await run([cube('a',0),special]);assert.equal(a.stock_parts,1);assert.equal(a.unverified_parts.length,1);
// Real solid door path with a synthetic obstacle; checks sampled motion separately from closed pose.
const door={id:'leaf',role:'door',mat:'front',geom:{fn:'cushion',w:100,h:200,d:18,r:0},pos:[50,100,9],rot:[0,0,0]};
const hinge={...special,id:'leaf-hinge1',role:'hinge',pos:[20,100,0],hingeMount:{hand:1}};
const obstacle={...cube('obstacle',50),pos:[50,100,50]};
a=await assemblyCollisionAudit({parts:[door,hinge,obstacle]},d);assert(a.collisions.some(c=>c.phase==='leaf'));assert(!a.collisions.some(c=>c.phase==='closed'));assert(a.stats.motion_samples>0);
console.log('PASS actual500mm3 intersection,touch,gap,rotation,invalid vertex/sampling,excluded hardware and sampled door obstacle. No continuous/mechanism/load approval.');
