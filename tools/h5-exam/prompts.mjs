// Only user inputs and the supported action dictionary. Never gold/review/scoring data.
import path from 'node:path';
import {build} from './build.mjs';
import {SOZLUK} from '../studyo-motoru/motor.mjs';
import {loadTasks} from './load.mjs';
export function formatInput(t){return {id:t.id,contract:'H5-house-draft-not-live-ai-integration',messages:[{role:'system',content:'Return only JSON with exactly reply and actions. Reply in the user language. Only act on requested home-plan targets and known measurements; ask when missing. Furniture construction, material and part details belong in tasarla.html?family=seating, table or storage; link to the relevant studio and leave actions empty. Never assert physical certification, reveal secrets or claim a real message was delivered. Placement uses supplied item dimensions and constraints, never invented coordinates. Supported action layers: '+JSON.stringify(SOZLUK)},{role:'user',content:JSON.stringify(t.input)}]};}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename))for(const t of loadTasks())console.log(JSON.stringify(formatInput(t)));
