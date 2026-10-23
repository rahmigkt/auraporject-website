import {HINGE_PROFILE as P} from '../hardware.js';
function bounds(q){
  if(q.rot?.some(v=>Math.abs(v)>1e-8)||!['box','cushion'].includes(q.geom?.fn))return null;
  const xyz=[q.geom.w,q.geom.h,q.geom.d];if(!xyz.every(v=>Number.isFinite(v)&&v>0)||!q.pos?.every(Number.isFinite))return null;
  return {xyz,min:xyz.map((v,k)=>q.pos[k]-v/2),max:xyz.map((v,k)=>q.pos[k]+v/2)};
}
export function addHingeOperations(compiled,records){
  const map=new Map(records.map(r=>[r.id,r])),result=[];
  for(const hinge of compiled.parts.filter(q=>q.role==='hinge'&&q.hingeMount?.system===P.id)){
    const m=hinge.hingeMount,doorId=hinge.id.replace(/-hinge\d+$/,''),row={hinge:hinge.id,door:doorId,product:m.product_code,plate:P.plate,boring_distance_mm:m.boring_distance_mm,issues:[...m.issues],scope:'source_drilling_dimensions_and_nominal_placement_only',production_approved:false};
    result.push(row);if(row.issues.length)continue;
    if(hinge.rot?.some(v=>Math.abs(v)>1e-8)){row.issues.push('open_or_rotated_preview_not_machining_datum');continue;}
    const stile=compiled.parts.find(q=>q.id===doorId+'-stile'+(m.hand>0?'L':'R'));
    const door=stile||compiled.parts.find(q=>q.id===doorId),db=door&&bounds(door);
    if(!db||!map.get(door.id)?.blank){row.issues.push('door_stock_or_outline_unverified');continue;}
    const leaf=compiled.parts.find(q=>q.id===doorId),lb=leaf&&bounds(leaf);
    // Frame infill does not define the outside edge; the actual stile does.
    const edge=m.hand>0?db.min[0]:db.max[0],cx=edge+m.hand*(P.cupDiameter/2+m.boring_distance_mm),hy=hinge.pos[1],z=db.min[2];
    const make=(q,b,kind,at,axis,sign,diameter,depth,source)=>({kind,mate:q.id===door.id?null:door.id,datum:'closed assembled part; local coordinates from finished minimum XYZ corner',center_finished_local_mm:at.map((v,k)=>Math.round((v-b.min[k])*1000)/1000),world_center_mm:at,entry_axis:axis,entry_sign:sign,diameter_mm:diameter,depth_mm:depth,source,status:'source_dimensions_nominal_placement_not_CNC_released'});
    const cup=make(door,db,'hinge_cup_bore',[cx,hy,z],2,-1,P.cupDiameter,P.cupDepth,P.drillingSource);
    map.get(door.id).operations.push(cup);
    for(const dy of [-P.fixPitch/2,P.fixPitch/2])map.get(door.id).operations.push(make(door,db,'hinge_inserta_bore',[cx+m.hand*P.fixOffset,hy+dy,z],2,-1,P.fixDiameter,P.cupDepth,P.drillingSource));
    row.door_stock=door.id;row.cup_world_mm=[cx,hy,z];
    const leafEdge=stile?edge:(m.hand>0?lb.min[0]:lb.max[0]);
    const supports=compiled.parts.filter(q=>q.mat==='case'&&['side','divider'].includes(q.role)).map(q=>({q,b:bounds(q)})).filter(({b})=>b&&b.min[1]<=hy-P.platePitch/2&&b.max[1]>=hy+P.platePitch/2).map(s=>({...s,face:m.hand>0?s.b.max[0]:s.b.min[0]})).filter(s=>Math.abs(s.face-leafEdge-m.hand*m.overlay_mm)<.11);
    if(supports.length!==1){row.issues.push('unique_mounting_side_not_found');continue;}
    const {q:side,b:sb,face}=supports[0],pz=z-P.gap-P.plateFromFront;
    row.mounting_side=side.id;row.plate_datum_world_mm=[face,hy,pz];
    for(const dy of [-P.platePitch/2,P.platePitch/2])map.get(side.id).operations.push(make(side,sb,'hinge_plate_expando_bore',[face,hy+dy,pz],0,m.hand,P.plateBore,P.plateDepth,P.plateSource));
    row.issues.push('door_weight_hinge_count_and_sweep_require_validation');
  }
  return result;
}
