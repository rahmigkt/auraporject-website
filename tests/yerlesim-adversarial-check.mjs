// Ideas recovered from #132; execute only the site's authoritative solver.
import assert from 'node:assert/strict';
import {solveRoom} from '../assets/ev/yerlesim.js';
import {normalizeDesign} from '../assets/forma/generate.js';
const item={id:'wardrobe',name:'Dolap',design:normalizeDesign({family:'storage',kind:'wardrobe',params:{width:1200,depth:580,height:2000}})};
const room={id:'room',boundary_xy_mm:[[0,0],[500,0],[500,500],[0,500]]};
const ev={walls:[],ops:[]},snapshot=JSON.stringify({room,item,ev});
const result=solveRoom(room,[item],ev,{count:1,beam:2});
assert.equal(result.ok,false);assert.deepEqual(result.alternatives,[]);
assert.equal(result.failed,item.id);
assert.equal(JSON.stringify({room,item,ev}),snapshot,'solver must not mutate inputs');
assert.deepEqual(solveRoom(room,[item],ev,{count:1,beam:2}),result,'deterministic no-fit');
const empty=solveRoom(room,[],ev,{count:1,beam:2});
assert.equal(empty.ok,true);assert.deepEqual(empty.alternatives[0].placements,[]);
console.log('PASS authoritative solver: impossible placement, empty room, immutability, deterministic rejection. No second solver imported.');
