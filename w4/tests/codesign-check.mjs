import assert from 'node:assert/strict';
import {FAMILIES,DETAILS,normalizeStudio,compileStudio,changeFamily} from '../assets/design-library.js';
import {validateModelReply} from '../../services/design/server.mjs';
let n=0;
for(const family of Object.keys(FAMILIES))for(const legs of ['straight','tapered','sled','plinth'])for(const arms of ['square','rolled','none'])for(const edge of [false,true]){
 const state=normalizeStudio({family,legs,arms,...(edge?{width:35,height:30,depth:35}:{})});const out=compileStudio(state);
 for(const part of out.parts){assert(part.size.every(x=>Number.isFinite(x)&&x>0));for(let a=0;a<3;a++){// rotated arm roll has depth along its cylinder axis
 const size=part.rotation?[part.size[0],part.size[2],part.size[1]]:part.size;
 const limit=[out.width,out.height,out.depth][a];assert(part.position[a]-size[a]/2>=(a===1?0:-limit/2)-.003,JSON.stringify({family,part,a,limit}));assert(part.position[a]+size[a]/2<=(a===1?limit:limit/2)+.003,JSON.stringify({family,part,a,limit}));}}
 assert.deepEqual(normalizeStudio(JSON.parse(JSON.stringify(state))),state);n++;
}
assert.equal(normalizeStudio({family:'__proto__'}).family,'sofa');assert.throws(()=>validateModelReply({reply:'x',patch:{legs:'evil'}}));assert.deepEqual(validateModelReply({reply:'x',patch:{exploit:'ignored'}}).patch,{});assert.equal(changeFamily({},'chair').height,85);console.log('PASS',n,'studio geometry combinations and response validation');

