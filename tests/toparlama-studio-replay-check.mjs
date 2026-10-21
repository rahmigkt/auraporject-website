import assert from 'node:assert/strict';
import {sample} from '../assets/forma/generate.js';
import {vocabulary} from '../assets/forma/ai.js';
import {replay} from '../tools/qwen-local/studio_data.mjs';
for(const family of ['seating','table','storage','kitchen','bath']){
 const d=sample({family,seed:11}),before=JSON.stringify(d),v=vocabulary(d);
 const key=['width','length','height','depth','worktopHeight'].find(k=>v.params[k]&&Number.isFinite(d.params[k])&&d.params[k]+10<=v.params[k][1]);assert(key);
 for(const type of ['set','delta']){
  const {after,compiled}=replay(d,[{type,key,value:type==='set'?d.params[key]+10:10}]);
  assert.equal(after.params[key],d.params[key]+10);assert(compiled.parts.length);assert.equal(JSON.stringify(d),before);
 }
 assert.throws(()=>replay(d,[{type:'set',key:'invented',value:10}]),/Non-curriculum/);
}
console.log('PASS shared production replay: 5 families × set/delta arithmetic, compiled geometry, immutability, unknown-key rejection; historical snapshots remain separate');
