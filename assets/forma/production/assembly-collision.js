import {buildMesh} from '../build.js';
import {transformPositions} from '../mesh.js';
import {loadCsg,csgReady,cutMesh,meshIntersectionVolume} from '../csg.js';
import {manufacturingReport} from './manufacturing.js';
import {machiningCutter} from './machined-geometry.js';

function envelope(P){
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 if(!P?.length||P.length%3)throw Error('Empty/invalid collision geometry');
 for(let i=0;i<P.length;i+=3)for(let k=0;k<3;k++){const x=P[i+k];if(!Number.isFinite(x))throw Error('Nonfinite collision vertex');min[k]=Math.min(min[k],x);max[k]=Math.max(max[k],x);}
 return {min,max};
}
const broad=(a,b)=>a.min.every((x,k)=>Math.min(a.max[k],b.max[k])-Math.max(x,b.min[k])>0);
function world(q,local){const mesh={...local,positions:transformPositions(local.positions,q.pos,q.rot)};return {id:q.id,mesh,box:envelope(mesh.positions)};}
function moved(s,plan,t){
 const p=new Float32Array(s.mesh.positions);
 for(let i=0;i<p.length;i+=3){
  if(plan.type==='drawer'){p[i+2]+=t;continue;}
  const a=t*Math.PI/180,c=Math.cos(a),sn=Math.sin(a),x=p[i]-plan.pivot_x_mm,z=p[i+2]-plan.pivot_z_mm;
  p[i]=plan.pivot_x_mm+x*c+z*sn;p[i+2]=plan.pivot_z_mm-x*sn+z*c;
 }
 return {id:s.id,mesh:{...s.mesh,positions:p},box:envelope(p)};
}
export function assemblyMotionPlans(compiled){
 const parts=compiled.parts,plans=[];
 for(const q of parts.filter(q=>q.role==='door'||q.role==='glass-door')){
  const hinges=parts.filter(h=>h.role==='hinge'&&h.id.startsWith(q.id+'-hinge'));
  if(!hinges.length)continue;
  const members=parts.filter(p=>p.id===q.id||p.id.startsWith(q.id+'-'));
  const stock=members.filter(p=>['door','front-frame','glass-door'].includes(p.role));
  if(stock.some(p=>p.rot?.some(v=>Math.abs(v)>1e-8)))continue;
  const ext=stock.map(p=>({min:p.pos[0]-p.geom.w/2,max:p.pos[0]+p.geom.w/2}));if(!ext.every(b=>Number.isFinite(b.min)&&Number.isFinite(b.max)))continue;
  const hand=hinges[0].hingeMount?.hand??(hinges[0].pos[0]<q.pos[0]?1:-1);
  plans.push({id:q.id,type:'door',member_ids:members.map(p=>p.id),pivot_x_mm:hand>0?Math.min(...ext.map(b=>b.min)):Math.max(...ext.map(b=>b.max)),pivot_z_mm:q.pos[2]+q.geom.d/2,limit:-hand*100,
   verified_mechanism:false,scope:'AURA preview single-pivot100degree stress sweep;not measured Blum4bar kinematics'});
 }
 for(const q of parts.filter(q=>q.role==='box-bottom')){
  const id=q.id.replace(/-box-bottom$/,''),prefix=id.replace(/-i?drawer\d+$/,'');
  plans.push({id,type:'drawer',member_ids:parts.filter(p=>(p.id===id||p.id.startsWith(id+'-'))&&p.role!=='runner').map(p=>p.id),limit:q.hardware?.nominal_length_mm||compiled.meta.runner||0,
   prerequisite_doors:plans.filter(p=>p.type==='door'&&p.id.startsWith(prefix+'-door')).map(p=>p.id),verified_mechanism:false,scope:'Nominal-length translation stress sweep;real runner stroke/stop requires source-specific confirmation'});
 }
 return plans;
}

export async function assemblyCollisionAudit(compiled,design,{angleStep=5,distanceStep=25,volumeTolerance=.05,motion=true}={}){
 if(!Number.isFinite(angleStep)||angleStep<=0||angleStep>10||!Number.isFinite(distanceStep)||distanceStep<=0||distanceStep>50||!Number.isFinite(volumeTolerance)||volumeTolerance<0||volumeTolerance>1)throw Error('Invalid collision audit sampling/tolerance');
 await loadCsg();if(!csgReady())throw Error('Collision engine unavailable;no pass recorded');
 const report=manufacturingReport(compiled,design),records=new Map(report.parts.map(p=>[p.id,p])),solids=[],unverified=[];
 if(report.invalid_operations.length||report.joint_mating.invalid.length||report.blockers.some(b=>['selected_hinge_has_no_complete_stock_mounting_recipe','selected_shelf_support_recipe_incomplete','selected_runner_fixing_recipe_incomplete','selected_drawer_joinery_incomplete','selected_rail_support_recipe_incomplete','drawer_blank_reconstruction_mismatch'].includes(b)))throw Error('Invalid manufacturing inputs;no assembly pass');
 for(const q of compiled.parts){
  const r=records.get(q.id);
  if(q.line||q.decor||q.planOnly)continue;
  if(r.category!=='wood_component'){unverified.push({id:q.id,reason:'Hardware,upholstery or specialist geometry not qualified as manufactured stock'});continue;}
  if(!r.blank||r.blank.requires_outline||q.geom.fn==='cut'){unverified.push({id:q.id,reason:'Unsupported stock/outline or designer cut'});continue;}
  let mesh=buildMesh(q);
  if(r.operations.length){mesh=cutMesh(mesh,r.operations.map(o=>machiningCutter(r,o)));if(!mesh||mesh.failed)throw Error('Collision machining failed:'+q.id);}
  solids.push(world(q,mesh));
 }
 const collisions=[],errors=[],stats={pairs:0,narrow_phase:0,motion_samples:0},plans=assemblyMotionPlans(compiled);
 const compare=(a,b,phase,at)=>{
  stats.pairs++;if(!broad(a.box,b.box))return;
  stats.narrow_phase++;
  try{const v=meshIntersectionVolume(a.mesh,b.mesh);if(v>volumeTolerance)collisions.push({part_a:a.id,part_b:b.id,phase,at,intersection_mm3:v});}
  catch(e){errors.push({part_a:a.id,part_b:b.id,phase,at,error:e.message});}
 };
 for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++)compare(solids[i],solids[j],'closed',0);
 if(motion)for(const plan of plans){
  if(!Number.isFinite(plan.limit)||!plan.limit){errors.push({plan:plan.id,error:'Unverified or invalid motion extent'});continue;}
  const ids=new Set(plan.member_ids),moving=solids.filter(s=>ids.has(s.id));let stationary=solids.filter(s=>!ids.has(s.id));
  plan.audited_stock_members=moving.length;if(!moving.length){plan.audit_status='no_qualified_stock_members';continue;}
  for(const prereqId of plan.prerequisite_doors||[]){const pre=plans.find(p=>p.id===prereqId),preIds=new Set(pre.member_ids);stationary=stationary.map(s=>preIds.has(s.id)?moved(s,pre,pre.limit):s);}
  const n=Math.ceil(Math.abs(plan.limit)/(plan.type==='door'?angleStep:distanceStep));
  for(let k=1;k<=n;k++){const at=plan.limit*k/n;stats.motion_samples++;for(const a of moving)for(const b of stationary)compare(moved(a,plan,at),b,plan.id,at);}
 }
 return {schema:'aura.assembly-collision-review/1',status:!solids.length?'no_qualified_stock_geometry':errors.length?'incomplete':collisions.length?'interference_found':unverified.length?'no_stock_interference_at_samples_product_incomplete':'no_interference_at_tested_samples',production_approved:false,
  scope:'Actual machined-stock solid intersections at closed pose and discrete preview/stress samples. Not continuous collision detection,hardware mechanism validation,manufacturing reconstruction,strength or physical assembly approval.',
  numerical_precision:'Input vertices welded at0.01mm in Manifold;AABB broad phase only rejects non-positive overlap',angle_step_max_degrees:angleStep,distance_step_max_mm:distanceStep,volume_tolerance_mm3:volumeTolerance,
  stock_parts:solids.length,unverified_parts:unverified,plans,stats,collisions,errors};
}
