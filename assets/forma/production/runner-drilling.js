import {RUNNER_FIXING_TRIAL as F} from '../hardware.js';
import {runnerMountPattern} from './runner-layout.js';
const box=q=>{if(!q||!['box','cushion'].includes(q.geom?.fn)||q.rot?.some(v=>Math.abs(v)>1e-8))return null;const xyz=[q.geom.w,q.geom.h,q.geom.d];return xyz.every(v=>Number.isFinite(v)&&v>0)?{xyz,min:xyz.map((v,k)=>q.pos[k]-v/2),max:xyz.map((v,k)=>q.pos[k]+v/2)}:null;};
export function addRunnerOperations(compiled,records){
 const map=new Map(records.map(p=>[p.id,p])),rows=[];
 for(const runner of compiled.parts.filter(q=>q.role==='runner'&&q.hardware?.fixing_system===F.id)){
  const h=runner.hardware,b=box(runner),pattern=runnerMountPattern(h.profile,h.nominal_length_mm),row={runner:runner.id,issues:[],source:pattern.source,pilot_recipe_qualified:false,production_approved:false};rows.push(row);
  if(!b||pattern.status!=='source_fixing_centers_only'){row.issues.push('unsupported_runner_pattern');continue;}
  const hand=runner.id.endsWith('L')?1:-1,id=runner.id.replace(/-runner[LR]$/,''),side=compiled.parts.find(p=>p.id===id+'-box-side'+(hand>0?'L':'R')),sb=box(side),x=hand>0?b.min[0]:b.max[0],ref=b.max[2]+F.memberFrontInset,cy=b.min[1]+23;
  const supports=compiled.parts.filter(p=>p.mat==='case'&&['side','divider','spacer'].includes(p.role)).map(p=>({p,b:box(p)})).filter(s=>s.b&&Math.abs((hand>0?s.b.max[0]:s.b.min[0])-x)<.11&&cy>s.b.min[1]&&cy<s.b.max[1]);
  if(supports.length!==1||!sb||Math.abs(sb.xyz[0]-18)>.01){row.issues.push('runner_support_or_18mm_box_stock_unverified');continue;}
  const support=supports[0];if(support.b.xyz[0]<16){row.issues.push('case_support_below_installation16mm');continue;}
  const receivingX=hand>0?support.b.max[0]:support.b.min[0];
  const op=(q,bb,kind,at,sg,dia,depth,screw)=>({kind,mate:runner.id,datum:'Closed member reference=actual box front+2mm;actual receiving stock face;not a physical stop verification',entry_axis:0,entry_sign:sg,center_finished_local_mm:at.map((v,k)=>Math.round((v-bb.min[k])*1000)/1000),world_center_mm:at,diameter_mm:dia,depth_mm:depth,source:F.installation,fastener:screw,trial_qualification:F.trial,status:'nominal_trial_pilot_not_CNC_released'});
  for(const [i,offset]of pattern.cabinet_from_front_mm.entries())map.get(support.p.id).operations.push(op(support.p,support.b,'runner_cabinet_pilot',[receivingX,cy-(i===pattern.cabinet_from_front_mm.length-1?14.5:0),ref-offset],hand,F.cabinetBore,F.cabinetBoreDepth,F.cabinetScrew));
  const dx=hand>0?sb.min[0]:sb.max[0];
  for(const offset of pattern.drawer_from_front_mm)map.get(side.id).operations.push(op(side,sb,'runner_drawer_pilot',[dx,cy,ref-offset],-hand,F.drawerBore,F.drawerBoreDepth,F.drawerScrew));
  row.support=support.p.id;row.drawer_side=side.id;row.reference_world_z_mm=ref;row.cabinet_pilots=pattern.cabinet_from_front_mm.length;row.drawer_pilots=pattern.drawer_from_front_mm.length;row.issues.push('drawer_fastener_SKU_and_material_pullout_tip_torque_physical_stop_not_validated');
 }
 return rows;
}
