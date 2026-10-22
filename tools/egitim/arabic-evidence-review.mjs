import fs from 'node:fs';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {solveRoom} from '../../assets/ev/yerlesim.js';
import {compileItem,footprint} from '../../assets/ev/items.js';
import {environment,sourceDigest} from '../ev-arap/olculu/place.mjs';
const dir='knowledge/ai-egitim/veri/ev-sohbet-arap-olculu';
const files=fs.readdirSync(dir).filter(f=>/^ev-sohbet-arap-olculu-\d+\.json$/.test(f));assert.equal(files.length,12);
const proof=[];let compiled=0;
for(const file of files){
 const r=JSON.parse(fs.readFileSync(dir+'/'+file,'utf8')),room=r.plan.spaces.find(s=>s.id===r.layout_scope.room_id);
 assert.equal(r.layout_requests.length,1);const req=r.layout_requests[0],a=req.attempts[0];
 assert.equal(req.attempts.length,1);assert.equal(req.requires_user_acceptance_of_reduced_set,false);
 assert.deepEqual(solveRoom(room,a.items,environment(r.plan,room),r.solver.options),a.result);assert(a.result.ok);
 for(const item of r.plan.items){
  const selected=a.result.alternatives[req.selected_alternative].placements.find(p=>p.id===item.id);
  assert.deepEqual(item.pos_xy_mm,selected.pos_xy_mm);assert.equal(item.rot_deg,selected.rot_deg);
  assert.deepEqual(item.compiled_size_mm,compileItem(item).size);assert.deepEqual(item.footprint_xy_mm,footprint(item));compiled++;
 }
 const source=fs.readFileSync(r.solver.module,'utf8');
 proof.push({id:r.id,file:dir+'/'+file,previous_solver_source_digest:r.solver.sha256,current_solver_source_digest:sourceDigest(source),
  sofa_width_mm:r.product_request.sofa_width_mm,solver_result_identical:true,requested_sizes_preserved:true});
}
assert.equal(compiled,24);fs.mkdirSync('work/evidence-review',{recursive:true});
fs.writeFileSync('work/evidence-review/arabic.json',JSON.stringify({records:proof,compiled_footprints:compiled},null,2)+'\n');
console.log('PASS 12 exact solver replays /24 compiled footprints; historical records retained, no approval');
