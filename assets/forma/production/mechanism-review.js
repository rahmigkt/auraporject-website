import {runnerProfile} from '../hardware.js';

// Independent face datums below are an explicit workshop trial, not supplier tolerances.
const DEFAULT_TRIAL=Object.freeze({support_datum_mm:.2,box_datum_mm:.2});
const box=q=>{
 if(!q||q.rot?.some(v=>Math.abs(v)>1e-8)||!['box','cushion'].includes(q.geom?.fn))return null;
 const xyz=[q.geom.w,q.geom.h,q.geom.d];
 if(!xyz.every(v=>Number.isFinite(v)&&v>0)||q.pos?.length!==3||!q.pos.every(Number.isFinite))return null;
 return {xyz,min:xyz.map((v,k)=>q.pos[k]-v/2),max:xyz.map((v,k)=>q.pos[k]+v/2)};
};
const round=v=>Math.round(v*1e6)/1e6;
const contradictions=new Set(['actual_gap_differs_from_selected_profile','nonpositive_actual_side_clearance','actual_gap_outside_source_interval']);
export function assertMechanismDatums(compiled,report){
 const review=mechanismReview(compiled,report),invalid=review.runner_faces.filter(r=>r.issues.some(i=>contradictions.has(i)));
 if(invalid.length)throw Error('Actual runner/box face datum mismatch: '+invalid.map(r=>r.runner).join(', '));
 return review; // Unknown CAD/tolerance is still unqualified; this is only a nominal contradiction gate.
}
function faceUncertainty(record,datum,role){
 if(!record?.blank)return null;
 const b=record.blank,axis=0,dimension=.2,edges=(b.edges||[]).filter(e=>e.axis===axis).length;
 return [{term:role+'_datum',half_range_mm:datum,basis:'AURA independent placement trial'},
  {term:role+'_half_finished_dimension',half_range_mm:(dimension+edges*.1)/2,basis:'Half of cut/stock Â±0.2 and selected axis band Â±0.1 per edge; trial only'}];
}
export function mechanismReview(compiled,report,trial=DEFAULT_TRIAL){
 for(const k of Object.keys(DEFAULT_TRIAL))if(!Number.isFinite(trial[k])||trial[k]<0)throw Error('Invalid mechanism trial datum budget');
 const parts=new Map(compiled.parts.map(p=>[p.id,p])),records=new Map(report.parts.map(p=>[p.id,p])),rows=[];
 for(const q of compiled.parts.filter(p=>p.role==='runner')){
  const row={runner:q.id,profile:q.hardware?.profile||null,status:'datum_not_verified',issues:[],production_approved:false,mechanism_qualified:false};rows.push(row);
  const hand=q.id.endsWith('L')?1:q.id.endsWith('R')?-1:0,id=q.id.replace(/-runner[LR]$/,''),side=parts.get(id+'-box-side'+(hand>0?'L':'R')),rb=box(q),sb=box(side);
  row.drawer=id;row.box_side=side?.id||null;
  if(!hand||!rb||!sb||!q.hardware){row.issues.push('unsupported_runner_or_box_transform');continue;}
  const profile=runnerProfile(q.hardware.profile),nominal=profile.sideSpace,receiving=hand>0?rb.min[0]:rb.max[0],cy=(rb.min[1]+rb.max[1])/2;
  const supports=compiled.parts.filter(p=>p.mat==='case'&&['side','divider','spacer'].includes(p.role)).map(p=>({p,b:box(p)})).filter(s=>s.b&&Math.abs((hand>0?s.b.max[0]:s.b.min[0])-receiving)<.11&&cy>s.b.min[1]&&cy<s.b.max[1]&&Math.min(sb.max[2],s.b.max[2])-Math.max(sb.min[2],s.b.min[2])>0);
  if(supports.length!==1){row.issues.push('unique_actual_receiving_face_not_found');continue;}
  const support=supports[0],face=hand>0?support.b.max[0]:support.b.min[0],boxFace=hand>0?sb.min[0]:sb.max[0],gap=hand*(boxFace-face);
  row.support=support.p.id;row.source=profile.source;row.source_side_interval_mm=profile.sideSpaceRange||null;
  row.actual_side_clearance_mm=round(gap);row.profile_side_clearance_mm=nominal;
  row.axial_overlap_mm=round(Math.min(sb.max[2],support.b.max[2])-Math.max(sb.min[2],support.b.min[2]));
  row.parallelism={status:'axis_aligned_nominal_faces_only',physical_parallelism_verified:false,required:'Measure both sides at front, middle and rear under service load'};
  if(Math.abs(gap-nominal)>.01)row.issues.push('actual_gap_differs_from_selected_profile');
  if(gap<=0)row.issues.push('nonpositive_actual_side_clearance');
  const a=faceUncertainty(records.get(support.p.id),trial.support_datum_mm,'support'),b=faceUncertainty(records.get(side.id),trial.box_datum_mm,'box');
  row.trial_terms=a&&b?[...a,...b]:null;
  if(!row.trial_terms)row.issues.push('finished_stock_budget_unavailable');
  const half=row.trial_terms?.reduce((s,t)=>s+t.half_range_mm,0);
  row.trial_side_interval_mm=half==null?null:[round(gap-half),round(gap+half)];
  const source=profile.sideSpaceRange;
  if(source&&(gap<source[0]-1e-8||gap>source[1]+1e-8))row.issues.push('actual_gap_outside_source_interval');
  if(source&&row.trial_side_interval_mm&&(row.trial_side_interval_mm[0]<source[0]-1e-8||row.trial_side_interval_mm[1]>source[1]+1e-8))row.issues.push('trial_interval_outside_source_interval');
  row.closed_datums={cabinet_proxy_front_z_mm:rb.max[2],box_stock_front_z_mm:sb.max[2],difference_mm:round(sb.max[2]-rb.max[2]),physical_closed_stop_verified:false};
  row.status=row.issues.length?'nominal_or_trial_mismatch':'nominal_faces_consistent_not_qualified';
 }
 const drawers=[];
 for(const q of compiled.parts.filter(p=>p.role==='box-bottom')){
  const id=q.id.replace(/-box-bottom$/,''),h=q.hardware,profile=h?.profile?runnerProfile(h.profile):null;
  drawers.push({drawer:id,profile:h?.profile||null,source:profile?.source||null,nominal_length_mm:h?.nominal_length_mm??null,documented_travel_mm:profile?.documentedTravel?.[h?.nominal_length_mm]??null,status:'real_member_geometry_and_stop_not_verified',kinematic_model:'source_travel_with_assumed_linear_translation_only',production_approved:false});
 }
 return {schema:'aura.mechanism-datum-review/1',status:rows.length?'actual_face_datums_checked_mechanism_unqualified':'no_runner_datums_to_check',nominal_contradictions:rows.filter(r=>r.issues.some(i=>contradictions.has(i))).map(r=>r.runner),runner_faces:rows,drawers,
  hinges:(report.hinge_hardware||[]).map(h=>({hinge:h.hinge,product:h.product,plate:h.plate,status:'multi_link_trajectory_and_solid_CAD_not_verified',production_approved:false})),
  trial_basis:'Worst-case independent support and box placement Â±0.2mm each plus half of their cut/stock/band dimension variation. No automatic centering or shared-datum cancellation; no measured process capability. Axis-aligned model faces only, not full product elastic tolerance chain.',
  missing:['Actual manufacturer hinge multi-link trajectory and selected plate/door configuration','Real runner members, closed stop, clearances and load deformation','Wall substrate, anchor, anti-tip load and physical installation'],production_approved:false};
}
