import {mechanismReview,assertMechanismDatums} from './mechanism-review.js';
import {runnerProfile} from '../hardware.js';
import {manufacturingReport} from './manufacturing.js';
import {compileDesign,normalizeDesign} from '../generate.js';
import {assemblyCollisionAudit} from './assembly-collision.js';
import {buildMesh} from '../build.js';import {transformPositions} from '../mesh.js';
import {loadCsg,csgReady,cutMesh,meshIntersectionVolume} from '../csg.js';import {machiningCutter,machiningGeometryFiles,solidVolume} from './machined-geometry.js';
export const INSPECTION_VERSION='aura-engineering-review/5';
export const inspectionKey=design=>JSON.stringify(normalizeDesign(design));
const box=P=>{const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<P.length;i+=3)for(let k=0;k<3;k++){if(!Number.isFinite(P[i+k]))throw Error('Nonfinite access geometry');min[k]=Math.min(min[k],P[i+k]);max[k]=Math.max(max[k],P[i+k]);}return{min,max};};
const overlap=(a,b)=>a.min.every((x,k)=>Math.min(a.max[k],b.max[k])-Math.max(x,b.min[k])>0);
export function runnerClearanceReview(profileId,nominal,halfRange=.6){
 if(!Number.isFinite(nominal)||nominal<=0||!Number.isFinite(halfRange)||halfRange<0)throw Error('Invalid runner trial clearance');
 const p=profileId?runnerProfile(profileId):null,source=p?.sideSpaceRange||null,interval=[nominal-halfRange,nominal+halfRange],outside=source&&(interval[0]<source[0]-1e-8||interval[1]>source[1]+1e-8);
 return {profile:profileId||null,nominal_side_clearance_mm:nominal,trial_side_clearance_interval_mm:interval,source_side_clearance_interval_mm:source,source:source?p.source:null,status:source?(outside?'trial_interval_outside_source_clearance':'trial_interval_within_source_clearance_not_qualified'):'manufacturer_clearance_tolerance_not_provided',budget_scope:'Illustrative independent carcass/spacer/box cut and stock stack±1.2mm overall;actual measured stock and process capability unknown',production_approved:false};
}
export function toleranceReview(report){
 const blind=[];for(const p of report.parts)for(const o of p.operations){if(o.through||!p.blank)continue;const axis=o.entry_axis,tol=.2+(p.blank.edges||[]).filter(e=>e.axis===axis).length*.1,remaining=p.blank.finished_xyz_mm[axis]-tol-o.depth_mm-.1;blind.push({part:p.id,kind:o.kind,trial_min_remaining_mm:Math.round(remaining*1000)/1000,status:remaining>0?'positive_web_in_trial_budget':'trial_budget_breakthrough_risk'});}
 const runner=[];for(const part of report.parts){if(part.role!=='runner'||!part.hardware)continue;const hw=part.hardware,clearance=runnerClearanceReview(hw.profile,hw.side_space_mm??12.7),opening=(hw.outer_width_mm||0)+2*(hw.side_space_mm||12.7);runner.push({part:part.id,...clearance,opening_reference_mm:opening});}
 return {status:'workshop_trial_intervals_not_manufacturer_qualification',blind_operations:blind,runner_stacks:runner,module_stacks:report.module_joining||[],limits:'Trial cut/stock±0.2mm,band±0.1mm/depth±0.1mm;not measured production capability,fastener tolerances or a full elastic assembly analysis',production_approved:false};
}
const component=id=>id.replace(/-box-.*$/,'');
function stageFor(p,o){if(o.module_connection_id)return'modules_before_spacers';if(p.role==='spacer'||o.kind==='runner_cabinet_pilot')return'spacers_before_drawers';if(p.role==='plinth'||p.role==='plinth-end')return'base_before_case';if(p.id.includes('-box-'))return'drawer_before_installation';return'case_before_fittings';}
function included(q,p,stage){if(stage==='drawer_before_installation')return q.id.startsWith(component(p.id)+'-box-')||q.id===component(p.id)+'-front';if(stage==='base_before_case')return['plinth','plinth-end'].includes(q.role);if(stage==='modules_before_spacers')return['side','top','bottom','divider','back','shelf-fixed','plinth','plinth-end'].includes(q.role);return['side','top','bottom','divider','back','shelf-fixed','plinth','plinth-end','spacer'].includes(q.role);}
export async function assemblyAccessAudit(compiled,design,{diameter=10,reach=80}={}){
 if(!Number.isFinite(diameter)||diameter<3||diameter>30||!Number.isFinite(reach)||reach<20||reach>300)throw Error('Invalid trial tool gauge');
 const r=manufacturingReport(compiled,design);assertMechanismDatums(compiled,r);if(r.invalid_operations.length||r.joint_mating.invalid.length||r.assembly_mating?.invalid.length||r.module_mating?.invalid.length||r.blockers.some(b=>b.startsWith('selected_')||b==='module_joining_incomplete'||b==='drawer_blank_reconstruction_mismatch'))throw Error('Invalid manufacturing data;no access pass');await loadCsg();if(!csgReady())throw Error('Solid engine unavailable');const parts=new Map(compiled.parts.map(p=>[p.id,p])),solids=[];
 for(const p of r.parts){const q=parts.get(p.id);if(p.category!=='wood_component'||!p.blank||p.blank.requires_outline||!['box','cushion'].includes(q.geom.fn)||q.rot?.some(v=>Math.abs(v)>1e-8))continue;let mesh=buildMesh(q);if(p.operations.length)mesh=cutMesh(mesh,p.operations.map(o=>machiningCutter(p,o)));if(!mesh||mesh.failed)throw Error('Access machining failed:'+p.id);const world={...mesh,positions:transformPositions(mesh.positions,q.pos,q.rot)};solids.push({q,mesh:world,bounds:box(world.positions)});}
 const rows=[];
 for(const p of r.parts)for(const o of p.operations){if(!['assembly_countersink','rastex_cam_bore','runner_cabinet_pilot','runner_drawer_pilot','hinge_plate_expando_bore','rail_top_through_bore','module_joining_bore'].includes(o.kind))continue;if(!p.blank||p.placement.rotation_rad.some(v=>Math.abs(v)>1e-8))continue;
 const entry=o.center_finished_local_mm.map((v,k)=>v+p.placement.position_mm[k]-p.blank.finished_xyz_mm[k]/2),start=entry.map((v,k)=>v+(k===o.entry_axis?o.entry_sign*.1:0)),end=start.map((v,k)=>v+(k===o.entry_axis?o.entry_sign*reach:0)),tool=buildMesh({geom:{fn:'tube',points:[start,end],r:diameter/2}}),bounds=box(tool.positions),stage=stageFor(p,o),closed=[],planned=[];
 for(const s of solids){if(s.q.id===p.id||!overlap(bounds,s.bounds))continue;const volume=meshIntersectionVolume(tool,s.mesh);if(volume<=.05)continue;const hit={part:s.q.id,intersection_mm3:volume};closed.push(hit);if(included(s.q,p,stage))planned.push(hit);}
 rows.push({part:p.id,operation:o.kind,connection:o.fastening_id||o.connection_id||o.module_connection_id||null,stage,entry_world_mm:entry,closed_obstructions:closed,planned_stage_obstructions:planned,status:planned.length?'trial_tool_obstructed':closed.length?'requires_recorded_assembly_sequence':'no_stock_obstruction_in_trial_gauge'});
 }
 return {status:!rows.length?'no_applicable_recipes':rows.some(r=>r.planned_stage_obstructions.length)?'trial_access_obstructions':'no_stock_obstruction_in_planned_trial_stages',tool_gauge:{diameter_mm:diameter,reach_mm:reach},rows,unverified:'Straight trial screwdriver envelope only;not hands,tool manufacturer CAD,fastener insertion sweeps,room ceiling/site access or physical assembly approval',production_approved:false};
}
export function engineeringReview(design,compiled=compileDesign(design)){
 const d=normalizeDesign(design),r=manufacturingReport(compiled,d),mechanism=mechanismReview(compiled,r),nominalErrors=[...r.invalid_operations,...r.joint_mating.invalid,...(r.assembly_mating?.invalid||[]),...(r.module_mating?.invalid||[])];
 return {schema:INSPECTION_VERSION,input:inspectionKey(d),created_at:new Date().toISOString(),design:d,production_approved:false,status:nominalErrors.length||mechanism.nominal_contradictions.length?'nominal_input_rejected':'engineering_review_required',manufacturing:r,mechanism_datums:mechanism,tolerances:toleranceReview(r),wall_fixing:{status:'site_data_required',required:['Wall substrate and strength','Actual product/load/centre-of-gravity and use case','Skirting/wall gap and floor levelling','Anchor/bracket product and ETA/manufacturer limits','Hidden services and competent installation check'],approval:false},hardware_motion:{status:'mechanism_not_qualified',known:['Blum selected110degree opening specification is not its4bar trajectory','Accuride3832EC has source-listed travel305/307/406/457/508/559/610 for300/350/400/450/500/550/600nominal;not real member CAD','HettichKA5632 nominal300mm has documented255mm travel;other lengths have no confirmed stop dimension here'],missing:['Actual hinge multi-link pivots and solid hardware envelopes','Runner member CAD/closed stop/clearances and physical stroke'],approval:false},collision:{status:'not_run_for_this_input'},access:{status:'not_run_for_this_input'}};
}
export async function inspectEngineering(design,{runGeometry=true}={}){
 const d=normalizeDesign(structuredClone(design)),c=compileDesign(d),result=engineeringReview(d,c);
 if(runGeometry){try{result.collision=await assemblyCollisionAudit(c,d);}catch(error){result.geometry_error=String(error.message||error);result.collision={status:'not_verified',error:result.geometry_error};result.access={status:'not_verified',error:result.geometry_error};}try{result.access=await assemblyAccessAudit(c,d);}catch(error){result.access={status:'not_verified',error:String(error.message||error)};}}
 return result;
}

export async function verifiedMachiningPreview(design){
 const d=normalizeDesign(structuredClone(design)),compiled=compileDesign(d),report=manufacturingReport(compiled,d),{manifest}=await machiningGeometryFiles(compiled,d),shown=structuredClone(compiled),map=new Map(report.parts.map(p=>[p.id,p]));
 for(const q of shown.parts){const p=map.get(q.id);if(!p?.operations.length)continue;const checked=manifest.machined.find(p=>p.id===q.id);q.geom={fn:'cut',inner:q.geom,ops:p.operations.map(o=>machiningCutter(p,o))};const volume=solidVolume(buildMesh(q));if(!checked||Math.abs(volume-checked.after_volume_mm3)>.1)throw Error('Machining preview differs from verified cut:'+q.id);}
 return {compiled:shown,input:inspectionKey(d),machined_parts:manifest.machined.length,production_approved:false};
}
