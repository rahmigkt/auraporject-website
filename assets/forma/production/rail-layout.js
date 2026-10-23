import {RAIL_PROFILE as H} from '../hardware.js';
export function addRailOperations(compiled,records){
 const map=new Map(records.map(p=>[p.id,p])),rows=[];
 for(const cap of compiled.parts.filter(p=>p.role==='rail-cup'&&p.hardware?.profile===H.id)){
  const row={support:cap.id,product:H.support,source:H.source,issues:[],production_approved:false};rows.push(row);
  const left=cap.id.endsWith('L'),x=cap.pos[0]+(left?-cap.geom.w/2+10.5:cap.geom.w/2-10.5),y=cap.pos[1]+cap.geom.h/2,z=cap.pos[2];
  const roofs=compiled.parts.filter(p=>p.mat==='case'&&['top','shelf-fixed'].includes(p.role)&&p.geom.fn==='cushion'&&!p.rot?.some(v=>Math.abs(v)>1e-8)).map(p=>({p,min:[p.geom.w,p.geom.h,p.geom.d].map((v,k)=>p.pos[k]-v/2),max:[p.geom.w,p.geom.h,p.geom.d].map((v,k)=>p.pos[k]+v/2)})).filter(b=>Math.abs(b.min[1]-y)<.11&&x-3.25>=b.min[0]&&x+3.25<=b.max[0]&&z-3.25>=b.min[2]&&z+3.25<=b.max[2]);
  if(roofs.length!==1||roofs[0].p.geom.h>19||!map.get(roofs[0].p.id)?.blank){row.issues.push('unique_roof_stock_up_to19mm_not_found');continue;}
  const b=roofs[0],at=[x,b.max[1],z];
  map.get(b.p.id).operations.push({kind:'rail_top_through_bore',through:true,mate:cap.id,entry_axis:1,entry_sign:1,center_finished_local_mm:at.map((v,k)=>Math.round((v-b.min[k])*1000)/1000),world_center_mm:at,diameter_mm:6.5,depth_mm:b.p.geom.h,source:H.source,fastener:H.topScrew,status:'source_diameter_position_and_max19mm_stock_nominal_fit_only',datum:'Upper stock face;hole10.5mm frominside side datum;source M6x25 roof mount'});
  row.roof=b.p.id;row.hole_world_mm=at;row.roof_thickness_mm=b.p.geom.h;row.fastener=H.topScrew;row.issues.push('thread_engagement_material_load_assembly_access_require_validation');
 }
 return rows;
}
