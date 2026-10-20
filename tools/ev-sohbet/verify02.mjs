// Replay stored requests without modifying records or using the network.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {solveRoom} from '../../assets/ev/yerlesim.js';
import {compileItem,footprint} from '../../assets/ev/items.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=path.join(root,'knowledge/ai-egitim/veri/ev-sohbet-02');
let tested=0,failed=0;
for(const file of fs.readdirSync(dir).filter(f=>/^ev-sohbet-02-\d+\.json$/.test(f)).sort()){
 const r=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8')),p=r.plan;
 const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,r.solver.module))).digest('hex');
 if(hash!==r.solver.sha256)throw Error('Studio solver changed: regenerate data');
 for(const request of r.layout_requests){
  const room=p.spaces.find(s=>s.id===request.space_id),walls=p.walls.map(w=>{let[x0,y0]=w.from_xy_mm,[x1,y1]=w.to_xy_mm,L=Math.hypot(x1-x0,y1-y0);return{...w,x0,y0,L,ux:(x1-x0)/L,uy:(y1-y0)/L,t:w.thickness.value};}).filter(w=>w.level_id===room.level_id),ops=[];
  const groups=new Map();for(const o of p.openings.filter(o=>o.level_id===room.level_id))if(!groups.has(o.source_opening_id))groups.set(o.source_opening_id,o);
  for(const[id,o]of groups){let[a,b]=o.full_opening_span_xy_mm,L=Math.hypot(b[0]-a[0],b[1]-a[1]),wid='layout-'+id;walls.push({id:wid,level_id:o.level_id,x0:a[0],y0:a[1],ux:(b[0]-a[0])/L,uy:(b[1]-a[1])/L,L,t:p.walls.find(w=>w.id===o.wall_id)?.thickness.value||120});ops.push({...o,id,wall_id:wid,a:0,w:L,h:o.height.value,sill:o.sill_height.value});}
  for(const attempt of request.attempts){const actual=solveRoom(room,attempt.items,{walls,ops},r.solver.options);tested++;if(JSON.stringify(actual)!==JSON.stringify(attempt.result))throw Error(file+': solver replay mismatch');if(!actual.ok)failed++;}
 }
 for(const it of p.items){if(JSON.stringify(compileItem(it).size)!==JSON.stringify(it.compiled_size_mm))throw Error('Compiled size drift');if(JSON.stringify(footprint(it))!==JSON.stringify(it.footprint_xy_mm))throw Error('Footprint drift');}
 console.log(file,'replayed');
}
const summary={attempts_replayed:tested,honest_no_fit_results:failed,records:20,passed:true};
fs.writeFileSync(path.join(dir,'solver-tekrar-sonucu.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
