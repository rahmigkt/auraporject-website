// Manufacturer-authored89316 instruction mirrored by distributor;placement is AURA trial.
export const MODULE_JOIN_SOURCE='https://www.schwarzstahl.ch/media/upload/Montageanleitung_Verbindungsschraube-Set_vernickelt.pdf';
const rect=q=>{if(!q||q.rot?.some(v=>Math.abs(v)>1e-8)||!['box','cushion'].includes(q.geom?.fn))return null;const xyz=[q.geom.w,q.geom.h,q.geom.d];if(!xyz.every(v=>Number.isFinite(v)&&v>0))return null;return{xyz,min:xyz.map((v,k)=>q.pos[k]-v/2),max:xyz.map((v,k)=>q.pos[k]+v/2)};};
export function addModuleJoining(compiled,records,design){
 if(design.params?.assemblySystem!=='hettich-71833-assembly-trial')return[];
 const parts=compiled.parts,map=new Map(records.map(p=>[p.id,p])),rows=[],sides=parts.filter(q=>q.role==='side'&&q.mat==='case');
 for(const a of sides.filter(q=>q.id.endsWith('-R')))for(const b of sides.filter(q=>q.id.endsWith('-L'))){
  const x=rect(a),z=rect(b);if(!x||!z||Math.abs(x.max[0]-z.min[0])>.011)continue;
  const lo=[0,1,2].map(k=>Math.max(x.min[k],z.min[k])),hi=[0,1,2].map(k=>Math.min(x.max[k],z.max[k]));if(hi[1]-lo[1]<250||hi[2]-lo[2]<160)continue;
  const total=x.xyz[0]+z.xyz[0],range=[total-.4,total+.4],row={parts:[a.id,b.id],product:'89316',source:MODULE_JOIN_SOURCE,total_nominal_mm:total,trial_total_range_mm:range,source_clamp_range_mm:[28,38],source_sleeve_mm:27.3,source_screw_mm:14.75,nominal_geometric_overlap_mm:42.05-total,fixings:[],issues:[],production_approved:false};rows.push(row);
  if(range[0]<28||range[1]>38){row.issues.push('trial_stack_outside_source_clamp');continue;}
  // Reserve10mm-diameter head/driver footprint with2mm additional AURA trial clearance.
  const clear=(y,d)=>!parts.some(q=>{if([a.id,b.id].includes(q.id)||q.nocut||q.decor||q.line)return false;const t=rect(q);if(!t)return false;const faceContact=Math.abs(t.min[0]-z.max[0])<7||Math.abs(t.max[0]-x.min[0])<7;return faceContact&&y>t.min[1]-7&&y<t.max[1]+7&&d>t.min[2]-7&&d<t.max[2]+7;});
  for(const depth of [lo[2]+60,hi[2]-60]){
   const candidates=[];for(let y=lo[1]+100;y<=hi[1]-100;y+=25)if(clear(y,depth))candidates.push(y);
   if(candidates.length<2||candidates.at(-1)-candidates[0]<100){row.issues.push('module_head_or_driver_footprint_not_clear');continue;}
   for(const y of [candidates[0],candidates.at(-1)]){const id=a.id+'|'+b.id+'|'+y+'|'+depth;
    for(const[q,bb,sign]of[[a,x,-1],[b,z,1]]){const at=[sign<0?bb.min[0]:bb.max[0],y,depth];map.get(q.id).operations.push({kind:'module_joining_bore',module_connection_id:id,mate:q.id===a.id?b.id:a.id,entry_axis:0,entry_sign:sign,center_finished_local_mm:at.map((v,k)=>Math.round((v-bb.min[k])*1000)/1000),world_center_mm:at,diameter_mm:5,depth_mm:bb.xyz[0],through:true,source:MODULE_JOIN_SOURCE,status:'source_diameter_clamp_trial_positions_not_CNC_released'});}
    row.fixings.push({id,position_world_mm:[x.max[0],y,depth]});
   }
  }
  row.status=row.issues.length?'incomplete':'source_clamp_nominal_holes_trial_position';
 }
 return rows;
}
export function verifyModuleMates(records){
 const groups=new Map(),rows=[];for(const p of records)for(const o of p.operations)if(o.module_connection_id){const g=groups.get(o.module_connection_id)||[];g.push({p,o});groups.set(o.module_connection_id,g);}
 for(const[id,g]of groups){const row={id,issues:[],production_approved:false};rows.push(row);if(g.length!==2){row.issues.push('missing_or_duplicate_module_board');continue;}
  const[a,b]=g,world=e=>e.o.center_finished_local_mm.map((v,k)=>v+e.p.placement.position_mm[k]-e.p.blank.finished_xyz_mm[k]/2-(k===e.o.entry_axis?e.o.entry_sign*e.o.depth_mm:0)),aw=world(a),bw=world(b);
  if(a.p.id===b.p.id||[a,b].some(e=>e.p.placement.rotation_rad.some(v=>Math.abs(v)>1e-8)||e.o.entry_axis!==0||e.o.diameter_mm!==5||!e.o.through||Math.abs(e.o.depth_mm-e.p.blank.finished_xyz_mm[0])>.001)||a.o.entry_sign!==-b.o.entry_sign||aw.some((v,k)=>!Number.isFinite(v)||Math.abs(v-bw[k])>.011)||a.o.mate!==b.p.id||b.o.mate!==a.p.id)row.issues.push('module_holes_do_not_meet');
  row.status=row.issues.length?'invalid':'nominal_mating_only';row.recomputed_interface_world_mm=aw;
 }
 return {connections:rows,invalid:rows.filter(r=>r.issues.length).map(r=>r.id),production_approved:false};
}
