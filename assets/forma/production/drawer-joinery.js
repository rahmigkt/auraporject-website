//18mm source cam section; groove and fixing spacing are explicit AURA trials.
export function addDrawerConnections(compiled,records,profile){
 if(!profile?.cam)return [];
 const map=new Map(records.map(p=>[p.id,p])),result=[],bounds=q=>{if(!q||q.rot?.some(v=>Math.abs(v)>1e-8)||q.geom.fn!=='cushion')return null;const xyz=[q.geom.w,q.geom.h,q.geom.d];return {xyz,min:xyz.map((v,k)=>q.pos[k]-v/2),max:xyz.map((v,k)=>q.pos[k]+v/2)};};
 for(const bottom of compiled.parts.filter(q=>q.drawerConstruction?.id==='aura-grooved-18-trial')){
  const id=bottom.id.replace(/-box-bottom$/,''),bb=bounds(bottom),row={bottom:bottom.id,issues:[],fixings:[],grooves:[],status:'nominal_trial_only',production_approved:false};result.push(row);
  for(const end of compiled.parts.filter(q=>q.id===id+'-box-endB'||q.id===id+'-box-endF')){
   const eb=bounds(end),isFront=end.id.endsWith('F');if(!eb||Math.abs(eb.xyz[2]-18)>.01){row.issues.push('unverified_end_stock');continue;}
   for(const side of compiled.parts.filter(q=>q.id===id+'-box-sideL'||q.id===id+'-box-sideR')){
    const sb=bounds(side),sign=side.id.endsWith('L')?-1:1,face=sign<0?eb.min[0]:eb.max[0];
    if(!sb||Math.abs(sb.xyz[0]-18)>.01||Math.abs(face-(sign<0?sb.max[0]:sb.min[0]))>.01){row.issues.push('end_side_contact_mismatch');continue;}
    const ys=eb.xyz[1]>=90?[eb.min[1]+25,eb.max[1]-25]:[(eb.min[1]+eb.max[1])/2];
    for(const y of ys){const cid=end.id+'|'+side.id+'|'+y,z=(eb.min[2]+eb.max[2])/2,entry=[face,y,z],cam=[face-sign*34,y,isFront?eb.min[2]:eb.max[2]];
     const op=(part,b,kind,at,axis,sg,dia,depth,mate)=>({kind,connection_id:cid,mate,entry_axis:axis,entry_sign:sg,center_finished_local_mm:at.map((v,k)=>Math.round((v-b.min[k])*1000)/1000),world_center_mm:at,diameter_mm:dia,depth_mm:depth,source:profile.source,status:'18mm_source_section_trial_spacing_not_CNC_released'});
     map.get(end.id).operations.push(op(end,eb,'rastex_edge_bore',entry,0,sign,8,34,side.id),op(end,eb,'rastex_cam_bore',cam,2,isFront?-1:1,15,13.4,side.id));
     map.get(side.id).operations.push(op(side,sb,'rastex_dowel_pilot',entry,0,-sign,5,11.5,end.id));row.fixings.push({connection_id:cid,end:end.id,side:side.id});
    }
   }
  }
  for(const panel of compiled.parts.filter(q=>q.id.startsWith(id+'-box-')&&['box-side','box-end'].includes(q.role))){
   const pb=bounds(panel);if(!pb)continue;const axis=panel.role==='box-side'?0:2,along=axis===0?2:0,over=[0,1,2].map(k=>Math.min(pb.max[k],bb.max[k])-Math.max(pb.min[k],bb.min[k]));
   if(!over.every(v=>v>0)){row.issues.push('missing_bottom_retaining_edge');continue;}
   const sign=bottom.pos[axis]>panel.pos[axis]?1:-1,at=bb.min.map((v,k)=>(Math.max(v,pb.min[k])+Math.min(bb.max[k],pb.max[k]))/2);at[axis]=sign>0?pb.max[axis]:pb.min[axis];
   map.get(panel.id).operations.push({kind:'drawer_bottom_groove',mate:bottom.id,entry_axis:axis,entry_sign:sign,center_finished_local_mm:at.map((v,k)=>Math.round((v-pb.min[k])*1000)/1000),length_axis:along,length_mm:over[along],width_mm:bb.xyz[1]+.4,depth_mm:over[axis]+.5,nominal_insertion_mm:over[axis],status:'AURA4mm_insertion6.4mm_groove_workshop_trial_not_CNC_released'});row.grooves.push(panel.id);
  }
  if(row.grooves.length!==4)row.issues.push('bottom_not_retained_on_four_edges');
 }
 return result;
}
