import assert from 'node:assert/strict';
import {compile} from '../assets/forma/bedroom.js';
import {buildMesh} from '../assets/forma/build.js';
const failures=[];let passed=0;
for(const bedBase of ['frame','upholsteredFrame','fourPoster'])for(const railHeight of [80,120,180,185,300])for(const legHeight of [35,40,80])for(const mattressWidth of [1200,1400,1800]){try{
 const c=compile({kind:'bed',bedBase,railHeight,legHeight,mattressWidth}),q=c.parts.find(p=>p.id==='centre-leg');
 assert.equal(Boolean(q),mattressWidth>=1400&&c.meta.deckTop>95,'centre leg requires positive floor clearance');
 if(q){assert(q.geom.h>0);const m=buildMesh(q);assert(m.positions.length>0&&m.positions.every(Number.isFinite));}
 assert.equal(c.params.railHeight,railHeight);assert.equal(c.params.legHeight,legHeight);assert.equal(c.params.mattressWidth,mattressWidth);passed++;
 }catch(e){failures.push({bedBase,railHeight,legHeight,mattressWidth,message:e.message});}}
console.log(JSON.stringify({passed,failed:failures.length,failures}));assert.deepEqual(failures,[]);
