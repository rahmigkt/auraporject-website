import {HINGE_PROFILE as P} from '../hardware.js';
export function addHingeSpacerReliefs(compiled,records,hinges,design){
 if(design.params?.assemblySystem!=='hettich-71833-assembly-trial')return[];const rows=[],map=new Map(records.map(p=>[p.id,p]));
 for(const h of hinges){if(!h.plate_datum_world_mm||!h.mounting_side)continue;const [x,y,z]=h.plate_datum_world_mm;
  for(const q of compiled.parts.filter(p=>p.role==='spacer')){if(q.rot?.some(v=>Math.abs(v)>1e-8)||!['box','cushion'].includes(q.geom.fn))continue;const size=[q.geom.w,q.geom.h,q.geom.d],min=size.map((v,k)=>q.pos[k]-v/2),max=size.map((v,k)=>q.pos[k]+v/2),sign=Math.abs(min[0]-x)<.011?1:Math.abs(max[0]-x)<.011?-1:0;if(!sign)continue;
   const loY=Math.max(min[1],y-32),hiY=Math.min(max[1],y+32),loZ=Math.max(min[2],z+P.plateFromFront-72);if(hiY<=loY||max[2]<=loZ)continue;
   const at=[sign>0?max[0]:min[0],(loY+hiY)/2,(loZ+max[2])/2],op={kind:'hinge_spacer_relief',mate:h.hinge,entry_axis:0,entry_sign:sign,center_finished_local_mm:at.map((v,k)=>Math.round((v-min[k])*1000)/1000),world_center_mm:at,length_axis:1,length_mm:hiY-loY,width_mm:max[2]-loZ,depth_mm:size[0],through:true,source:'AURA trial relief from catalogue56x68mm plate footprint plus4mm clearance;not manufacturer solidCAD or structural approval',status:'trial_access_relief_not_CNC_released'};map.get(q.id).operations.push(op);rows.push({spacer:q.id,hinge:h.hinge,plate_source:P.plateSource,nominal_catalogue_envelope_mm:[56,68],trial_allowance_mm:4,operation:op,production_approved:false});
  }
 }return rows;
}
