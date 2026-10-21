import assert from 'node:assert/strict';
import {loadTasks} from './ai-eval/aura-sinav-01/score.mjs';
import {formatInput} from '../tools/aura-sinav-01/prompts.mjs';
const tasks=loadTasks();
for(const t of [tasks[0],tasks[40],tasks.at(-1)]){
 const p=formatInput(t),poison=structuredClone(t);poison.expected={secret_gold:'DO_NOT_SEND_GOLD'};poison.rubric={secret:'DO_NOT_SEND_GOLD'};
 assert.deepEqual(formatInput(poison),p);assert(!JSON.stringify(p).includes('DO_NOT_SEND_GOLD'));assert(p.messages.length>=2);
 assert.equal(p.contract,t.group==='mobilya'?'production-php-furniture':'draft-multilayer-not-live-integrated');
}
console.log('PASS 3 prompt contracts; expected/rubric mutation cannot leak to model; no inference');
