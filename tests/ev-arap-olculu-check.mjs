import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {solveRoom} from '../assets/ev/yerlesim.js';import {compileItem,footprint} from '../assets/ev/items.js';
import {environment} from '../tools/ev-arap/olculu/place.mjs';
const dir='knowledge/ai-egitim/veri/ev-sohbet-arap-olculu',files=fs.readdirSync(dir).filter(f=>/^ev-sohbet-arap-olculu-\d+\.json$/.test(f));assert.equal(files.length,12);
let items=0;
for(const f of files){const r=JSON.parse(fs.readFileSync(dir+'/'+f,'utf8')),room=r.plan.spaces.find(s=>s.id===r.layout_scope.room_id);assert.equal(r.layout_requests.length,1);
 const req=r.layout_requests[0],attempt=req.attempts[0];assert.equal(req.attempts.length,1);assert.equal(req.requires_user_acceptance_of_reduced_set,false);
 const result=solveRoom(room,attempt.items,environment(r.plan,room),r.solver.options);assert.deepEqual(result,attempt.result);assert(result.ok);
 assert.equal(r.solver.sha256,createHash('sha256').update(fs.readFileSync(r.solver.module)).digest('hex'));
 assert.equal(attempt.items[0].design.params.width,r.product_request.sofa_width_mm);assert.equal(attempt.items[0].design.params.depth,820);assert.equal(attempt.items[1].design.params.length,900);assert.equal(attempt.items[1].design.params.width,550);
 const selected=req.selected_alternative;assert(Number.isInteger(selected)&&selected>=0&&selected<result.alternatives.length);
 for(const it of r.plan.items){const p=result.alternatives[selected].placements.find(x=>x.id===it.id);assert.deepEqual(it.pos_xy_mm,p.pos_xy_mm);assert.equal(it.rot_deg,p.rot_deg);assert.deepEqual(it.compiled_size_mm,compileItem(it).size);assert.deepEqual(it.footprint_xy_mm,footprint(it));items++;}
 assert.equal(r.native_motor.result.report.gecti,true);assert.equal(r.native_motor.operations.length,1);assert.equal(r.plan.levels.length,1);assert.equal(r.layout_scope.whole_home_completed,false);assert.equal(r.denetim.gecti,false);assert.equal(r.source.multi_floor_source,false);assert.equal(r.plan.dwelling.existing_house_claim,false);
}
assert.equal(items,24);console.log('PASS 12 exact production-solver replays / 24 compiled footprints; requested sizes unchanged, no fallback, no invented upper floor or training approval');
