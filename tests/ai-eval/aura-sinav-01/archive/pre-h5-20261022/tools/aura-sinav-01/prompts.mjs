// Preparation only. stdout contains held-out INPUTS, never gold answers.
import {loadTasks} from '../../tests/ai-eval/aura-sinav-01/score.mjs';
import {messages} from '../qwen-local/current_studio.mjs';
import {vocabulary} from '../../assets/forma/ai.js';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const dictionary=JSON.parse(readFileSync(new URL('../../knowledge/ai-egitim/ISLEM-SOZLUGU-1.json',import.meta.url),'utf8'));
export function formatInput(t){
 if(t.group==='mobilya')return {id:t.id,contract:'production-php-furniture',messages:messages({text:t.input.text,design:t.input.state.design,vocabulary:vocabulary(t.input.state.design),lang:t.input.lang})};
 return {id:t.id,contract:'draft-multilayer-not-live-integrated',messages:[{role:'system',content:'Return only JSON {"reply": "user-language explanation", "actions": []}. Use supported studio actions from the supplied dictionary. Ask for missing measurements; refuse unsafe or unsupported actions. Never invent coordinates or claim designer approval. Furniture placement uses yerlestir intents and constraints, not coordinates. Dictionary: '+JSON.stringify(dictionary)},{role:'user',content:JSON.stringify(t.input)}]};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename))for(const t of loadTasks())console.log(JSON.stringify(formatInput(t)));
