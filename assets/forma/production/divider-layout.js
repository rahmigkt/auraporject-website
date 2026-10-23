// Same Rastex18mm cross-section rotated onto the vertical divider; no load approval is inferred.
export function addDividerConnections(compiled,records,profile){
  if(!profile?.cam)return [];
  const map=new Map(records.map(p=>[p.id,p])),result=[];
  const rect=q=>q.geom?.fn==='cushion'&&!q.rot?.some(v=>Math.abs(v)>1e-8)?{xyz:[q.geom.w,q.geom.h,q.geom.d],min:[q.geom.w,q.geom.h,q.geom.d].map((v,k)=>q.pos[k]-v/2),max:[q.geom.w,q.geom.h,q.geom.d].map((v,k)=>q.pos[k]+v/2)}:null;
  for(const divider of compiled.parts.filter(q=>q.role==='divider'&&q.mat==='case')){
    const db=rect(divider);if(!db)continue;
    for(const support of compiled.parts.filter(q=>['top','bottom','shelf-fixed'].includes(q.role)&&q.mat==='case')){
      const sb=rect(support);if(!sb)continue;
      for(const sign of [-1,1]){
        const y=sign<0?db.min[1]:db.max[1],sy=sign<0?sb.max[1]:sb.min[1],a=Math.max(db.min[2],sb.min[2]),b=Math.min(db.max[2],sb.max[2]);
        if(Math.abs(y-sy)>.11||db.min[0]<sb.min[0]-.11||db.max[0]>sb.max[0]+.11||b-a<100)continue;
        const row={part_a:divider.id,part_b:support.id,member_axis:1,source:profile.source,source_pages:profile.pages,status:'nominal_mating_only',placement_basis:'AURA37mm front/back and middle fixing;left accessible cam face; rotated manufacturer18mm cross-section',fixings:[]};
        result.push(row);
        if(Math.abs(db.xyz[0]-18)>.01||sb.xyz[1]<profile.sidePilotDepth+2){row.status='incompatible_stock';continue;}
        for(const z of b-a>400?[a+37,(a+b)/2,b-37]:[a+37,b-37]){
          const id=divider.id+'|'+support.id+'|'+sign+'|'+z,entry=[db.min[0]+profile.dowelAxis,y,z],cam=[db.min[0],y-sign*profile.camSetback,z];
          const op=(part,bb,kind,at,axis,sg,dia,depth)=>({kind,mate:part===divider.id?support.id:divider.id,connection_id:id,datum:'closed finished minimum XYZ corner;rotated18mm Rastex section',center_finished_local_mm:at.map((v,k)=>Math.round((v-bb.min[k])*1000)/1000),world_center_mm:at,entry_axis:axis,entry_sign:sg,diameter_mm:dia,depth_mm:depth,status:'source_dimensions_trial_placement_not_CNC_released',source:profile.source});
          map.get(divider.id).operations.push(op(divider.id,db,'rastex_edge_bore',entry,1,sign,profile.edgeDiameter,profile.camSetback),op(divider.id,db,'rastex_cam_bore',cam,0,-1,profile.camDiameter,profile.camDepth));
          map.get(support.id).operations.push(op(support.id,sb,'rastex_dowel_pilot',entry,1,-sign,profile.sidePilotDiameter,profile.sidePilotDepth));
          row.fixings.push({connection_id:id,cam_product:profile.cam,dowel_product:profile.dowel,edge_entry_world_mm:entry,side_entry_world_mm:entry,cam_center_world_mm:cam,nominal_axes_coincident:true});
        }
      }
    }
  }
  return result;
}
