// Recompute entries from local bores + placed stock. Do not trust cached world coordinates
// or the generator's nominal_axes_coincident label.
export function verifyRastexMates(records,profile){
  const groups=new Map(),result=[],tol=.011;
  const world=(p,o)=>o.center_finished_local_mm.map((v,k)=>v+p.placement.position_mm[k]-p.blank.finished_xyz_mm[k]/2);
  for(const p of records)for(const op of p.operations)if(op.connection_id){const list=groups.get(op.connection_id)||[];list.push({p,op});groups.set(op.connection_id,list);}
  for(const [id,entries]of groups){
    const row={id,status:'nominal_mating_only',issues:[],production_approved:false};result.push(row);
    const get=kind=>entries.filter(e=>e.op.kind===kind),es=get('rastex_edge_bore'),cs=get('rastex_cam_bore'),ps=get('rastex_dowel_pilot');
    if(es.length!==1||cs.length!==1||ps.length!==1){row.status='invalid';row.issues.push('missing_or_duplicate_connection_member');continue;}
    const e=es[0],c=cs[0],p=ps[0];
    if(!profile?.camSetback||[e,c,p].some(({p,op})=>!p.placement?.position_mm?.every(Number.isFinite)||!p.placement?.rotation_rad?.every(Number.isFinite)||!p.blank?.finished_xyz_mm?.every(v=>Number.isFinite(v)&&v>0)||!op.center_finished_local_mm||op.center_finished_local_mm.length!==3||!op.center_finished_local_mm.every(Number.isFinite)||![0,1,2].includes(op.entry_axis)||![-1,1].includes(op.entry_sign)||!Number.isFinite(op.depth_mm)||op.depth_mm<=0)){row.status='invalid';row.issues.push('invalid_joint_data');continue;}
    if([e,c,p].some(({p})=>!p.blank||p.placement.rotation_rad.some(v=>Math.abs(v)>1e-9))){row.status='invalid';row.issues.push('unsupported_stock_transform');continue;}
    const ew=world(e.p,e.op),pw=world(p.p,p.op),cw=world(c.p,c.op),axis=e.op.entry_axis,ca=c.op.entry_axis,sign=e.op.entry_sign;
    if(e.p.id!==c.p.id||e.op.mate!==p.p.id||p.op.mate!==e.p.id)row.issues.push('wrong_mating_part');
    if(ew.some((v,k)=>Math.abs(v-pw[k])>tol))row.issues.push('entry_points_do_not_coincide');
    if(axis!==p.op.entry_axis||sign!==-p.op.entry_sign||ca===axis)row.issues.push('axes_or_entry_normals_mismatch');
    if(Math.abs(cw[axis]-ew[axis]+sign*profile.camSetback)>tol)row.issues.push('cam_setback_mismatch');
    const third=[0,1,2].find(k=>k!==axis&&k!==ca);if(third===undefined||Math.abs(cw[third]-ew[third])>tol)row.issues.push('cam_and_rod_not_coplanar');
    const end=cw[ca]-c.op.entry_sign*c.op.depth_mm;if(ew[ca]<Math.min(cw[ca],end)-tol||ew[ca]>Math.max(cw[ca],end)+tol)row.issues.push('rod_axis_misses_cam_depth');
    if(e.op.diameter_mm!==profile.edgeDiameter||c.op.diameter_mm!==profile.camDiameter||p.op.diameter_mm!==profile.sidePilotDiameter)row.issues.push('wrong_product_bore');
    row.recomputed_edge_entry_world_mm=ew;row.recomputed_side_entry_world_mm=pw;if(row.issues.length)row.status='invalid';
  }
  return {scope:'Nominal local-bore/stock placement and Rastex cross-section; not joint strength or full-product reconstruction',connections:result,invalid:result.filter(r=>r.status==='invalid').map(r=>r.id),production_approved:false};
}

