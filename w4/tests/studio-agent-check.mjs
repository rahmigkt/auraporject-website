import assert from 'node:assert/strict';
import {runStudioAgent} from '../../services/design/studio-agent.mjs';
const original=globalThis.fetch,call=(name,args={})=>({function:{name,arguments:args}});let count=0;
try{
 const replies=[{tool_calls:[call('update_design',{family:'table',top:'oval'})],content:''},{tool_calls:[call('set_view',{view:'angle'}),call('zoom_view',{direction:'out'}),call('save_draft')],content:''},{content:'Komutlar hazır.'}];
 globalThis.fetch=async(url,init)=>{const body=JSON.parse(init.body);if(count)assert(body.messages.some(m=>m.role==='tool'));return {ok:true,json:async()=>({message:{role:'assistant',...replies[count++]},eval_count:20,eval_duration:1e9})};};
 const result=await runStudioAgent({model:'mock-only-unit-test',messages:[{role:'user',content:'Masa çiz, göster ve kaydet'}]});assert(result.complete);assert.equal(result.state.family,'table');assert.equal(result.state.top,'oval');assert.equal(result.rounds.length,3);assert.deepEqual(result.operations.map(c=>c.function.name),['update_design','set_view','zoom_view','save_draft']);
 count=0;globalThis.fetch=async()=>({ok:true,json:async()=>({message:{role:'assistant',content:'',tool_calls:[call('set_view',{view:'front'})]}})});const bounded=await runStudioAgent({model:'mock-only-unit-test',maxRounds:1,messages:[{role:'user',content:'Önden göster'}]});assert.equal(bounded.complete,false);assert.equal(bounded.operations.length,1);
 globalThis.fetch=async()=>({ok:true,json:async()=>({message:{role:'assistant',content:'',tool_calls:[call('shell',{cmd:'bad'})]}})});await assert.rejects(()=>runStudioAgent({model:'mock-only-unit-test',messages:[{role:'user',content:'x'}]}));
 console.log('PASS agent loop incorporates tool results, preserves command order, bounds rounds and rejects unknown tools. Mock tests are not model capability evidence.');
}finally{globalThis.fetch=original;}
