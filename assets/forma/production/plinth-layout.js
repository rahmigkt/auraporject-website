// Same Rastex cross-section as the carcass, rotated into a plinth brace/end.
// Fixing count/spacing are AURA trial values, not a manufacturer's strength prescription.
export function addPlinthConnections(compiled,records,profile){
 if(!profile?.cam)return [];
 const map=new Map(records.map(p=>[p.id,p])),result=[];
 const box=q=>{if(q.rot?.some(v=>Math.abs(v)>1e-9)||!['box','cushion'].includes(q.geom?.fn))return null;const xyz=[q.geom.w,q.geom.h,q.geom.d];return xyz.every(v=>Number.isFinite(v)&&v>0)?{xyz,min:xyz.map((v,k)=>q.pos[k]-v/2),max:xyz.map((v,k)=>q.pos[k]+v/2)}:null;};
 for(const a of compiled.parts.filter(p=>p.role==='plinth-end')){
  const ab=box(a);if(!ab||Math.abs(ab.xyz[0]-profile.panelThickness)>.01)continue;
  for(const b of compiled.parts.filter(p=>p.role==='plinth')){
   const bb=box(b);if(!bb||bb.xyz[2]<profile.sidePilotDepth+2||ab.min[0]<bb.min[0]-.01||ab.max[0]>bb.max[0]+.01)continue;
   for(const sign of [-1,1]){
    const face=sign<0?ab.min[2]:ab.max[2],mate=sign<0?bb.max[2]:bb.min[2];if(Math.abs(face-mate)>.01)continue;
    const lo=Math.max(ab.min[1],bb.min[1]),hi=Math.min(ab.max[1],bb.max[1]);if(hi-lo<30||ab.xyz[2]<2*profile.camSetback+profile.camDiameter)continue;
    const y=(lo+hi)/2,entry=[ab.min[0]+profile.dowelAxis,y,face],cam=[ab.min[0],y,face-sign*profile.camSetback],id=a.id+'|'+b.id;
    const make=(part,bounds,kind,at,axis,sg,dia,depth)=>({kind,connection_id:id,mate:part.id===a.id?b.id:a.id,center_finished_local_mm:at.map((v,k)=>Math.round((v-bounds.min[k])*1000)/1000),world_center_mm:at,entry_axis:axis,entry_sign:sg,diameter_mm:dia,depth_mm:depth,source:profile.source,status:'source_dimensions_trial_placement_not_CNC_released'});
    map.get(a.id).operations.push(make(a,ab,'rastex_edge_bore',entry,2,sign,profile.edgeDiameter,profile.camSetback),make(a,ab,'rastex_cam_bore',cam,0,-1,profile.camDiameter,profile.camDepth));
    map.get(b.id).operations.push(make(b,bb,'rastex_dowel_pilot',entry,2,-sign,profile.sidePilotDiameter,profile.sidePilotDepth));
    result.push({part_a:a.id,part_b:b.id,member_axis:2,status:'nominal_mating_only',source:profile.source,placement_basis:'AURA trial one midheight fixing per brace/rail end; strength and anti-racking unvalidated',fixings:[{connection_id:id,cam_product:profile.cam,dowel_product:profile.dowel,edge_entry_world_mm:entry,side_entry_world_mm:entry,cam_center_world_mm:cam,nominal_axes_coincident:true}]});
   }
  }
 }
 return result;
}
