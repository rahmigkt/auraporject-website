import {ASSEMBLY_PROFILE as P} from '../hardware.js';
const near=(a,b)=>Math.abs(a-b)<.011;
const rect=q=>{if(!q||q.rot?.some(v=>Math.abs(v)>1e-9)||!['box','cushion'].includes(q.geom?.fn))return null;const xyz=[q.geom.w,q.geom.h,q.geom.d];return xyz.every(v=>Number.isFinite(v)&&v>0)?{xyz,min:xyz.map((v,k)=>q.pos[k]-v/2),max:xyz.map((v,k)=>q.pos[k]+v/2)}:null;};
export function addAssemblyConnections(compiled,records,design,connector){
 const rows=[],map=new Map(records.map(p=>[p.id,p]));if(design.params?.assemblySystem!==P.id)return rows;
 const op=(q,b,kind,at,axis,sign,dia,depth,id,role,extra={})=>{const o={kind,fastening_id:id,fastening_role:role,center_finished_local_mm:at.map((v,k)=>Math.round((v-b.min[k])*1000)/1000),world_center_mm:at,entry_axis:axis,entry_sign:sign,diameter_mm:dia,depth_mm:depth,source:P.source,trial:P.trial,status:'nominal_trial_not_CNC_released',...extra};map.get(q.id).operations.push(o);return o;};
 const seat=(q,b,at,axis,sign,hole,id)=>op(q,b,'assembly_countersink',at,axis,sign,P.headEnvelope,(P.headEnvelope-hole)/2,id,'seat',{pilot_diameter_mm:hole});
 for(const front of compiled.parts.filter(q=>['inner-front','drawer-front'].includes(q.role))){
  const row={part:front.id,role:front.role,source:P.source,product:P.frontProduct,issues:[],fixings:[],production_approved:false};rows.push(row);
  const box=compiled.parts.find(q=>q.id===front.id.replace(/-front$/,'')+'-box-endF'),f=rect(front),b=rect(box);
  if(!f||!b||!near(f.min[2],b.max[2])||b.xyz[0]<120||b.xyz[1]<100||f.xyz[2]<P.frontPocketDepth+3||!near(b.xyz[2],18)){row.issues.push('front_box_contact_or_stock_incompatible');continue;}
  // These are AURA trial positions, not manufacturer's edge-distance/load prescriptions.
  const y=(b.min[1]+b.max[1])/2,z=b.max[2];
  for(const x of [b.min[0]+40,b.max[0]-40]){
   const id=front.id+'|adjuster|'+x,entry=[x,y,z],back=[x,y,b.min[2]],screwLength=b.xyz[2]+P.frontPocketDepth;
   op(front,f,'front_adjuster_pocket',entry,2,-1,20,10,id,'receiver',{mate:box.id,fastener:'4x'+screwLength+' countersunk;exactSKU/head fit unqualified',fastener_length_mm:screwLength});
   op(box,b,'front_box_clearance_bore',back,2,-1,5,b.xyz[2],id,'clearance',{through:true,mate:front.id,fastener_length_mm:screwLength});seat(box,b,back,2,-1,5,id);
   row.fixings.push({id,type:'71833',screw_diameter_mm:4,screw_length_mm:screwLength,source_formula:'box end thickness+10mm housing depth'});
  }
  const id=front.id+'|lock',x=(b.min[0]+b.max[0])/2,ly=y+30;
  op(box,b,'front_box_clearance_bore',[x,ly,b.min[2]],2,-1,4.5,b.xyz[2],id,'clearance',{through:true,mate:front.id,fastener_length_mm:b.xyz[2]+10});seat(box,b,[x,ly,b.min[2]],2,-1,4.5,id);
  op(front,f,'assembly_locking_pilot',[x,ly,z],2,-1,2.5,10,id,'receiver',{mate:box.id,fastener_length_mm:b.xyz[2]+10});row.fixings.push({id,type:'additional_locking_screw_trial'});
  row.status='nominal_connection_trial_not_strength_qualified';
 }
 for(const spacer of compiled.parts.filter(q=>q.role==='spacer')){
  const row={part:spacer.id,role:'spacer',issues:[],fixings:[],source:P.screwSource,production_approved:false};rows.push(row);const b=rect(spacer),sign=spacer.id.endsWith('L')?1:-1;
  if(!b||!near(b.xyz[0],25)||b.xyz[1]<120||b.xyz[2]<120){row.issues.push('spacer_trial_requires25mm_stock_and120mm_spans');continue;}
  const face=sign>0?b.min[0]:b.max[0],supports=compiled.parts.filter(q=>q.mat==='case'&&['side','divider'].includes(q.role)).map(q=>({q,b:rect(q)})).filter(s=>s.b&&near(sign>0?s.b.max[0]:s.b.min[0],face)&&s.b.min[1]<=b.min[1]+.011&&s.b.max[1]>=b.max[1]-.011&&s.b.min[2]<=b.min[2]+.011&&s.b.max[2]>=b.max[2]-.011);
  if(supports.length!==1||supports[0].b.xyz[0]<17){row.issues.push('spacer_support_not_unique_or_too_thin');continue;}
  const s=supports[0],embed=P.spacerScrewLength-b.xyz[0];
  for(const y of [b.min[1]+45,b.max[1]-45])for(const z of [b.min[2]+45,b.max[2]-45]){
   const id=spacer.id+'|support|'+y+'|'+z,entry=[sign>0?b.max[0]:b.min[0],y,z],at=[face,y,z];
   op(spacer,b,'spacer_clearance_bore',entry,0,sign,4.5,b.xyz[0],id,'clearance',{through:true,mate:s.q.id,fastener_length_mm:40,source:P.screwSource});seat(spacer,b,entry,0,sign,4.5,id);
   op(s.q,s.b,'spacer_receiving_pilot',at,0,sign,2.5,embed,id,'receiver',{mate:spacer.id,fastener_length_mm:40,source:P.screwSource});row.fixings.push({id,fastener:'SPAX WIROX full-thread4x40 catalogue size;exactSKU unselected',nominal_embedding_mm:embed});
  }
  row.support=s.q.id;row.status='nominal_connection_trial_not_strength_qualified';
 }
 // Rotate the existing18mm Rastex section into each base rail/top-to-floor joint.
 for(const rail of compiled.parts.filter(q=>q.role==='plinth')){
  const row={part:rail.id,role:'plinth',issues:[],fixings:[],source:connector?.source,production_approved:false};rows.push(row);const b=rect(rail);
  if(!connector?.cam||!b||!near(b.xyz[2],18)||b.xyz[1]<connector.camSetback+connector.camDiameter/2+5){row.issues.push('plinth_source_connector_or_stock_incompatible');continue;}
  const floors=compiled.parts.filter(q=>q.role==='bottom'&&q.mat==='case').map(q=>({q,b:rect(q)})).filter(s=>s.b&&Math.min(s.b.max[0],b.max[0])-Math.max(s.b.min[0],b.min[0])>100&&s.b.min[2]<=b.min[2]+.011&&s.b.max[2]>=b.max[2]-.011&&compiled.parts.some(q=>[s.q.id.replace(/-bottom$/,'-side-L'),s.q.id.replace(/-bottom$/,'-side-R')].includes(q.id)&&rect(q)&&near(rect(q).min[1],b.max[1])));
  const expectedFloors=new Set(compiled.parts.filter(q=>q.role==='side'&&q.mat==='case'&&/-side-[LR]$/.test(q.id)).filter(q=>{const s=rect(q);return s&&near(s.min[1],b.max[1])&&Math.min(s.max[0],b.max[0])-Math.max(s.min[0],b.min[0])>.01&&s.min[2]<=b.min[2]+.011&&s.max[2]>=b.max[2]-.011;}).map(q=>q.id.replace(/-side-[LR]$/,'-bottom')));
  for(const id of expectedFloors)if(!floors.some(s=>s.q.id===id))row.issues.push('missing_expected_floor:'+id);
  if(!floors.length){row.issues.push('plinth_has_no_contacting_floor');continue;}
  for(const s of floors){if(!near(s.b.min[1],b.max[1])){row.issues.push('plinth_floor_not_contacting');continue;}const lo=Math.max(b.min[0],s.b.min[0]),hi=Math.min(b.max[0],s.b.max[0]);if(hi-lo<100||s.b.xyz[1]<connector.sidePilotDepth+2){row.issues.push('plinth_floor_span_or_thickness_incompatible');continue;}
   for(const x of [lo+37,hi-37]){
    const faceSign=rail.id.endsWith('-front')?-1:1,z=b.min[2]+9,at=[x,b.max[1],z],cam=[x,b.max[1]-connector.camSetback,faceSign>0?b.max[2]:b.min[2]],id=rail.id+'|floor|'+s.q.id+'|'+x;
    const make=(q,bb,kind,c,axis,sg,dia,depth)=>{const o={kind,connection_id:id,mate:q.id===rail.id?s.q.id:rail.id,center_finished_local_mm:c.map((v,k)=>Math.round((v-bb.min[k])*1000)/1000),world_center_mm:c,entry_axis:axis,entry_sign:sg,diameter_mm:dia,depth_mm:depth,source:connector.source,status:'source_dimensions_trial_placement_not_CNC_released'};map.get(q.id).operations.push(o);};
    make(rail,b,'rastex_edge_bore',at,1,1,connector.edgeDiameter,connector.camSetback);make(rail,b,'rastex_cam_bore',cam,2,faceSign,connector.camDiameter,connector.camDepth);make(s.q,s.b,'rastex_dowel_pilot',at,1,-1,connector.sidePilotDiameter,connector.sidePilotDepth);row.fixings.push({id,type:'rotated_Rastex18mm',cam_product:connector.cam,dowel_product:connector.dowel});
   }
  }
  row.status=row.issues.length?'incomplete':'nominal_connection_trial_not_strength_qualified';
 }
 return rows;
}
// Recompute the clearance exit/receiver entry from placed local stock, not cached world centers.
export function verifyAssemblyMates(records){
 const groups=new Map(),rows=[];for(const p of records)for(const o of p.operations)if(o.fastening_id){const a=groups.get(o.fastening_id)||[];a.push({p,o});groups.set(o.fastening_id,a);}
 const world=(p,o)=>o.center_finished_local_mm.map((v,k)=>v+p.placement.position_mm[k]-p.blank.finished_xyz_mm[k]/2);
 for(const [id,all]of groups){const row={id,issues:[],production_approved:false};rows.push(row);const c=all.filter(e=>e.o.fastening_role==='clearance'),r=all.filter(e=>e.o.fastening_role==='receiver'),seats=all.filter(e=>e.o.fastening_role==='seat');
  if(c.length!==1||r.length!==1||seats.length!==1){row.issues.push('missing_or_duplicate_member');continue;}
  const a=c[0],b=r[0],ax=a.o.entry_axis;
  if(!a.p.blank||!b.p.blank||[a.p,b.p].some(p=>p.placement.rotation_rad.some(v=>Math.abs(v)>1e-9))){row.issues.push('unsupported_mount_transform');continue;}
  const aw=world(a.p,a.o),bw=world(b.p,b.o),exit=aw.map((v,k)=>k===ax?v-a.o.entry_sign*a.o.depth_mm:v);
  if(exit.some((v,k)=>!Number.isFinite(v)||!near(v,bw[k]))||ax!==b.o.entry_axis||a.o.entry_sign!==b.o.entry_sign)row.issues.push('clearance_exit_receiver_entry_mismatch');
  if(a.o.mate!==b.p.id||b.o.mate!==a.p.id)row.issues.push('wrong_mating_part');
  if(!near(a.o.depth_mm+b.o.depth_mm,a.o.fastener_length_mm)||a.o.fastener_length_mm!==b.o.fastener_length_mm)row.issues.push('fastener_length_mismatch');
  const sw=world(seats[0].p,seats[0].o);if(seats[0].p.id!==a.p.id||sw.some((v,k)=>!near(v,aw[k])))row.issues.push('countersink_entry_mismatch');
  if(b.o.kind==='front_adjuster_pocket'&&(b.o.diameter_mm!==20||b.o.depth_mm!==10||a.o.diameter_mm!==5))row.issues.push('wrong71833_bore');
  if(b.o.kind==='spacer_receiving_pilot'&&(b.o.diameter_mm!==2.5||a.o.diameter_mm!==4.5||a.o.fastener_length_mm!==40))row.issues.push('wrong_spacer_trial_bore');
  if(b.o.kind==='assembly_locking_pilot'&&(b.o.diameter_mm!==2.5||b.o.depth_mm!==10||a.o.diameter_mm!==4.5))row.issues.push('wrong_locking_trial_bore');
  row.status=row.issues.length?'invalid':'nominal_mating_only';row.recomputed_clearance_exit_world_mm=exit;row.recomputed_receiver_entry_world_mm=bw;
 }
 return {connections:rows,invalid:rows.filter(r=>r.issues.length).map(r=>r.id),scope:'Nominal fastener center/contact/length correspondence only;no head/material/strength or complete assembly approval',production_approved:false};
}
