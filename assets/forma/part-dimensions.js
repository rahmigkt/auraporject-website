// Model dimensions, not manufacturing tolerances or approval. Forma geometry uses mm.
import {buildMesh,worldPositions} from './build.js';
const round=v=>Math.round(v*1000)/1000;
function envelope(positions){
 if(!positions?.length||positions.length%3)throw Error('Empty or malformed geometry');
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<positions.length;i+=3)for(let k=0;k<3;k++){const v=positions[i+k];if(!Number.isFinite(v))throw Error('Non-finite geometry');min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);}
 return {min_mm:min.map(round),max_mm:max.map(round),xyz_mm:max.map((v,k)=>round(v-min[k]))};
}
const finite3=a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite);
const machined=g=>!!g&&(g.fn==='cut'||machined(g.inner));
function measure(q,index,expandMembers=true){
 const r={id:q.id??null,index,role:q.role??null,material_slot:q.mat??null,internal:!!q.internal,decorative:!!q.decor,plan_only:!!q.planOnly,not_cut_list:!!q.nocut,geometry_type:q.geom?.fn??null,instance_count:Number.isInteger(q.qty)&&q.qty>0?q.qty:1,
  position_mm:q.pos===undefined?[0,0,0]:finite3(q.pos)?q.pos.slice():null,rotation_rad:q.rot===undefined?[0,0,0]:finite3(q.rot)?q.rot.slice():null,
  declared_cut_mm:finite3(q.cut)?q.cut.slice():null,cut_status:q.shaped?'review_after_override':finite3(q.cut)?'compiler_declared_order':'not_supplied',status:'measured'};
 try{if((q.pos&&!finite3(q.pos))||(q.rot&&!finite3(q.rot)))throw Error('Invalid transform');r.local=envelope(buildMesh(q).positions);r.product=envelope(worldPositions(q));}
 catch(error){r.status='unavailable';r.local=null;r.product=null;r.reason=String(error.message);}
 // buildMesh may deliberately show an uncut fallback while CSG is loading or
 // after a failed cut. Never label its dimensions as verified machining output.
 if(r.status==='measured'&&machined(q.geom)){r.status='machining_envelope_unverified';r.cut_status='requires_machining_review';r.reason='Machining mesh may be a preview fallback; verify cuts in the designer/CAD workflow.';}
 // Button meshes contain multiple actual members; keep their individual envelopes too.
 if(expandMembers&&q.geom?.fn==='buttons'&&Array.isArray(q.geom.points))r.members=q.geom.points.map((pt,i)=>measure({...q,id:String(q.id)+'#'+(i+1),qty:1,geom:{...q.geom,points:[pt]}},i,false));
 return r;
}
export function partDimensions(compiled){
 const parts=(compiled.parts||[]).map((q,i)=>measure(q,i)),valid=parts.filter(p=>p.product),unavailable=parts.filter(p=>p.status==='unavailable').map(p=>p.id),unverified=parts.filter(p=>p.status==='machining_envelope_unverified').map(p=>p.id);
 let product=null;if(valid.length){const min=[0,1,2].map(k=>Math.min(...valid.map(p=>p.product.min_mm[k]))),max=[0,1,2].map(k=>Math.max(...valid.map(p=>p.product.max_mm[k])));product={min_mm:min,max_mm:max,xyz_mm:max.map((v,k)=>round(v-min[k]))};}
 const overall=compiled.meta?.overall,nominal=overall?[overall.width,overall.height,overall.depth]:null;
 return {schema:'aura.part-dimensions/1',units:'mm',axes:['X: left/right','Y: vertical','Z: back/front'],serialization_rounding_mm:.001,dimension_basis:'Mesh envelope; local axes before part placement and product axes after part transform. No allowance or tolerance inferred.',cut_basis:'declared_cut_mm retains compiler order; not universally XYZ. Null means absent. Shaped parts require a fresh cut review.',production_approved:false,
  nominal_overall:structuredClone(overall||null),model_envelope:product,nominal_to_envelope_delta_xyz_mm:product&&finite3(nominal)?product.xyz_mm.map((v,k)=>round(v-nominal[k])):null,status:unavailable.length||unverified.length||!parts.length?'incomplete':'model_dimensions_only',unavailable_parts:unavailable,requires_machining_review:unverified,part_count:parts.length,parts};
}
const cell=v=>{const s=String(v??''),safe=typeof v==='string'&&/^[=+\-@\t\r]/.test(s)?"'"+s:s;return '"'+safe.replaceAll('"','""')+'"';};
export function partDimensionsCsv(manifest,quantity=1){
 const head=['ID','Row type (group/member/part)','Parent ID','Role','Material slot','Units','Product quantity','Member count','Local X mm','Local Y mm','Local Z mm','Placed X mm','Placed Y mm','Placed Z mm','Position X mm','Position Y mm','Position Z mm','Rotation X rad','Rotation Y rad','Rotation Z rad','Declared cut mm (compiler order)','Cut status','Status','Internal','Reason'];
 const rows=manifest.parts.flatMap(p=>[{...p,row_type:p.members?'group':'part',parent_id:''},...(p.members||[]).map(m=>({...m,row_type:'member',parent_id:p.id}))]).map(p=>[p.id,p.row_type,p.parent_id,p.role,p.material_slot,'mm',quantity,p.instance_count,...(p.local?.xyz_mm||['','','']),...(p.product?.xyz_mm||['','','']),...(p.position_mm||['','','']),...(p.rotation_rad||['','','']),p.declared_cut_mm?.join(' x ')||'',p.cut_status,p.status,p.internal,p.reason||'']);
 return '\uFEFF'+[head,...rows].map(r=>r.map(cell).join(';')).join('\r\n');
}
