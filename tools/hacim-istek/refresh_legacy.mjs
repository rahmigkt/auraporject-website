import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';
import{solveRoom}from'../../assets/ev/yerlesim.js';import{compileItem,footprint}from'../../assets/ev/items.js';import{environment}from'../ev-arap/olculu/place.mjs';import{root,hash}from'./build.mjs';
const archive='knowledge/ai-egitim/toparlama-01/archive/hacim-01-arap-oncesi',report=[];
const encode=x=>JSON.stringify(x,Object.keys(x));
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>hash(JSON.stringify(canonical(x)));
function invariant(r){r=structuredClone(r);delete r.solver;delete r.layout_results;delete r.plan.items;for(const req of r.layout_requests)for(const a of req.attempts)delete a.result;return r;}
for(const batch of ['02','uk-ie','dk','es','it']){
 const dir=`knowledge/ai-egitim/veri/ev-sohbet-${batch}`;
 for(const f of fs.readdirSync(dir).filter(f=>new RegExp(`^ev-sohbet-${batch}-\\d+\\.json$`).test(f)).sort()){
  const file=dir+'/'+f,bytes=execFileSync('git',['show','HEAD:'+file],{cwd:root}),original=JSON.parse(bytes),r=structuredClone(original),oldItems=new Map(r.plan.items.map(it=>[it.id,it]));
  const saved=archive+'/'+file;fs.mkdirSync(path.dirname(saved),{recursive:true});if(fs.existsSync(saved))assert.deepEqual(fs.readFileSync(saved),bytes);else fs.writeFileSync(saved,bytes);
  r.plan.items=[];let attempts=0;
  for(let n=0;n<r.layout_requests.length;n++){
   const req=r.layout_requests[n],room=r.plan.spaces.find(s=>s.id===req.space_id);
   for(const a of req.attempts){const result=solveRoom(room,a.items,environment(r.plan,room),r.solver.options);assert.equal(result.ok,a.result.ok,r.id+' fit status changed; needs separate dialogue review');a.result=result;attempts++;}
   const last=req.attempts.at(-1),result=last.result;
   if(result.ok)for(const it of last.items){const p=result.alternatives[req.selected_alternative||0].placements.find(p=>p.id===it.id),out={...oldItems.get(it.id),...it,...p};out.compiled_size_mm=compileItem(out).size;out.footprint_xy_mm=footprint(out);r.plan.items.push(out);}
   r.layout_results[n]={...r.layout_results[n],ok:result.ok,failed:result.failed||null,items_placed:result.ok?last.items.map(i=>i.id):[],score:result.ok?result.alternatives[0].score:null};
  }
  r.solver.sha256=hash(fs.readFileSync(r.solver.module,'utf8').replaceAll('\r\n','\n'));r.solver.hash_policy='utf8-lf';
  assert.deepEqual(invariant(r),invariant(original),'Only generated placement outputs may change');
  fs.writeFileSync(file,JSON.stringify(r,null,2)+'\n');
  const body=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!['dialogue','style_revision'].includes(k)));
  report.push({id:r.id,path:file,archive:saved,archive_sha256:hash(bytes),before_body_sha256:digest(body(original)),after_body_sha256:digest(body(r)),unchanged_input_sha256:digest(invariant(r)),attempts,fit_status_unchanged:true});console.log(r.id,attempts);
 }
}
assert.equal(report.length,40);fs.writeFileSync('knowledge/ai-egitim/veri/hacim-1-istek/yerlesim-yenileme.json',JSON.stringify({version:'hacim-placement-refresh/1',rows:report,coordinates:'Production solveRoom only; no manual positions, new attempts, resizing or product removal',human_approval:false},null,2)+'\n');
