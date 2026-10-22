import assert from 'node:assert/strict';
import {compile} from '../assets/forma/bedroom.js';
import {buildMesh} from '../assets/forma/build.js';
const failures=[];let passed=0;
const configs=[...['frame','upholsteredFrame'].map(bedBase=>({kind:'bed',bedBase,legType:'sled'})),...['nightstand','dresser'].map(kind=>({kind,caseBase:'sled'}))];
for(const config of configs)for(const height of [0,5,10,15,20,25,50,80]){try{
 const bed=config.kind==='bed',key=bed?'legHeight':'baseHeight',c=compile({...config,[key]:height}),bar=bed?25:18;
 assert(c.params[key]>=bar,'sled clearance covers bar thickness');assert.equal(compile(JSON.parse(JSON.stringify(c.params))).params[key],c.params[key]);
 const posts=c.parts.filter(q=>q.role==='post');assert.equal(posts.length,4);
 for(const q of posts){assert(q.geom.w>0&&q.geom.h>0&&q.geom.d>0);const m=buildMesh(q);assert(m.positions.length>0&&m.positions.every(Number.isFinite));}
 passed++;
 }catch(e){failures.push(`${JSON.stringify(config)}/${height}: ${e.message}`);}}
console.log(JSON.stringify({passed,failed:failures.length,failures}));assert.deepEqual(failures,[]);

