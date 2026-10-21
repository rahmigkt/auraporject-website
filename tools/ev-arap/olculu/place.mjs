// Only the production solver writes positions. No shrinking or hidden fallback.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {solveRoom,RULES} from '../../../assets/ev/yerlesim.js';
import {normalizeDesign} from '../../../assets/forma/generate.js';
import {compileItem,footprint} from '../../../assets/ev/items.js';
// Retain the original Windows evidence digest while making it independent of checkout EOLs.
export const sourceDigest=text=>createHash('sha256').update(text.replaceAll('\r\n','\n').replaceAll('\n','\r\n')).digest('hex');
export function environment(plan,room){
 const walls=plan.walls.filter(w=>w.level_id===room.level_id).map(w=>{const[x0,y0]=w.from_xy_mm,[x1,y1]=w.to_xy_mm,L=Math.hypot(x1-x0,y1-y0);return {...w,x0,y0,L,ux:(x1-x0)/L,uy:(y1-y0)/L,t:w.thickness.value};}),ops=[],groups=new Map();
 for(const o of plan.openings.filter(o=>o.level_id===room.level_id))if(!groups.has(o.source_opening_id))groups.set(o.source_opening_id,o);
 for(const[id,o]of groups){const[a,b]=o.full_opening_span_xy_mm,L=Math.hypot(b[0]-a[0],b[1]-a[1]),wid='layout-'+id;walls.push({id:wid,level_id:o.level_id,x0:a[0],y0:a[1],ux:(b[0]-a[0])/L,uy:(b[1]-a[1])/L,L,t:plan.walls.find(w=>w.id===o.wall_id)?.thickness.value||120});ops.push({...o,id,wall_id:wid,a:0,w:L,h:o.height.value,sill:o.sill_height.value});}
 return {walls,ops};
}
export function place(r){
 const room=r.plan.spaces.find(s=>s.id===r.layout_scope.room_id),q=r.product_request;
 const make=(kind,params)=>({id:room.id+'-'+kind,space_id:room.id,name:kind==='sofa'?'كنبة':'طاولة وسط',decision:'new',catalog_status:'current_studio_family',design:normalizeDesign({family:kind==='sofa'?'seating':'table',kind,style:'aura',seed:1,params})});
 const items=[make('sofa',{width:q.sofa_width_mm,depth:q.sofa_depth_mm,height:800,armWidth:100}),make('coffee',{length:q.coffee_length_mm,width:q.coffee_width_mm,height:380})];
 if(items[0].design.params.width!==q.sofa_width_mm||items[0].design.params.depth!==q.sofa_depth_mm||items[1].design.params.length!==q.coffee_length_mm||items[1].design.params.width!==q.coffee_width_mm)throw Error('Product target changed during normalization');
 const options={count:4,beam:40},result=solveRoom(room,items,environment(r.plan,room),options);
 r.layout_candidates=result.ok?result.alternatives.map((alt,index)=>({index,items:items.map(it=>{const p=alt.placements.find(p=>p.id===it.id),out={...it,...p};out.compiled_size_mm=compileItem(out).size;out.footprint_xy_mm=footprint(out);return out;})})):[];
 r.plan.items=structuredClone(r.layout_candidates[0]?.items||[]);
 r.layout_requests=[{space_id:room.id,attempts:[{items,result}],selected_alternative:0,requires_user_acceptance_of_reduced_set:false}];
 r.layout_results=[{space_id:room.id,ok:result.ok,failed:result.failed||null,items_placed:r.plan.items.map(i=>i.id)}];
 r.solver={module:'assets/ev/yerlesim.js',sha256:sourceDigest(fs.readFileSync(new URL('../../../assets/ev/yerlesim.js',import.meta.url),'utf8')),options,rules:RULES,manual_item_coordinates:false};return r;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){
 const dir=process.argv[2];if(!dir)throw Error('Output directory required');
 for(const f of fs.readdirSync(dir).filter(f=>/^ev-sohbet-arap-olculu-\d+\.json$/.test(f)).sort()){const p=path.join(dir,f),r=place(JSON.parse(fs.readFileSync(p,'utf8')));fs.writeFileSync(p,JSON.stringify(r,null,2)+'\n');console.log(f,r.layout_results[0].ok);}
}
