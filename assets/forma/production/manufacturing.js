import {reassembleCarcass} from './reassemble-carcass.js';
import {panelBlank} from './panel-blank.js';
import {CONNECTOR_PROFILES} from '../hardware.js';
import {operationBounds} from './operation-bounds.js';
// Workshop trial values, not an ISO/EN certification or a substitute for measured stock.
export const TRIAL_TOLERANCES=Object.freeze({id:'aura-workshop-trial-1',approved:false,cut_length_plus_minus_mm:.2,stock_thickness_plus_minus_mm:.2,band_build_up_plus_minus_mm:.1,groove_width_plus_minus_mm:.1,groove_depth_plus_minus_mm:.1,groove_width_clearance_mm:.4,groove_depth_clearance_mm:.5});
const round=v=>Math.round(v*1000)/1000;
const aligned=q=>!q.rot?.some(v=>Math.abs(v)>1e-9);
function bounds(q){
  if(!aligned(q)||!['box','cushion'].includes(q.geom?.fn))return null;
  const xyz=[q.geom.w,q.geom.h,q.geom.d],p=q.pos||[0,0,0];
  if(!xyz.every(v=>Number.isFinite(v)&&v>0)||!p.every(Number.isFinite))return null;
  return {min:xyz.map((v,k)=>p[k]-v/2),max:xyz.map((v,k)=>p[k]+v/2),xyz};
}
function classify(q){
  if(q.line||q.decor)return 'decorative';
  if(['fabric','leather','foam','cushion'].includes(q.mat)||/cushion|pillow|upholster|seat-pad/.test(q.role))return 'upholstery_pattern_required';
  if(q.nocut)return 'purchased_or_specialist_part';
  if(['case','front','frame','back'].includes(q.mat)||q.mat?.startsWith('lac:'))return 'wood_component';
  return 'specialist_recipe_required';
}
export function manufacturingReport(compiled,design,{band=1}={}){
  const records=compiled.parts.map(q=>{
    const category=classify(q),surface=design.materials?.[q.mat]?.surface;
    const blank=category==='wood_component'?panelBlank(q,surface==='veneer'?band:0):null;
    return {id:q.id,role:q.role,material_slot:q.mat,category,quantity:q.qty||1,blank,placement:{position_mm:q.pos||[0,0,0],rotation_rad:q.rot||[0,0,0]},
      hardware:q.hardware?structuredClone(q.hardware):null,operations:[],status:blank?'blank_correspondence_only':'recipe_required',production_approved:false};
  });
  const byId=new Map(records.map(r=>[r.id,r])),backFits=[];
  const joints=[],connector=CONNECTOR_PROFILES[design.params?.connectorSystem];
  if(connector?.cam)for(const h of compiled.parts.filter(q=>q.mat==='case'&&['top','bottom','shelf-fixed'].includes(q.role))){
    const hb=bounds(h);if(!hb)continue;
    for(const v of compiled.parts.filter(q=>q.mat==='case'&&['side','divider'].includes(q.role))){
      const vb=bounds(v);if(!vb)continue;
      for(const sign of [-1,1]){
        const face=sign<0?hb.min[0]:hb.max[0],vf=sign<0?vb.max[0]:vb.min[0];
        if(Math.abs(face-vf)>.11||hb.min[1]<vb.min[1]-.11||hb.max[1]>vb.max[1]+.11)continue;
        const a=Math.max(hb.min[2],vb.min[2]),b=Math.min(hb.max[2],vb.max[2]);if(b-a<100)continue;
        const joint={horizontal:h.id,vertical:v.id,system:design.params.connectorSystem,source:connector.source,source_pages:connector.pages,placement_basis:'AURA trial: 37 mm from front/back, middle fixing for depths over 400 mm; product drawing does not prescribe this spacing.',status:'nominal_mating_only',fixings:[]};
        if(Math.abs(hb.xyz[1]-connector.panelThickness)>.01||vb.xyz[0]<connector.sidePilotDepth+2||hb.xyz[0]<2*connector.camSetback+connector.camDiameter){joint.status='incompatible_stock_or_span';joints.push(joint);continue;}
        const zs=b-a>400?[a+37,(a+b)/2,b-37]:[a+37,b-37];
        for(const z of zs){
          const center=[face,hb.min[1]+connector.dowelAxis,z],cam=[face-sign*connector.camSetback,h.role==='top'?hb.min[1]:hb.max[1],z];
          const op=(part,kind,world,axis,entrySign,diameter,depth)=>({kind,mate:part===h.id?v.id:h.id,datum:'finished part minimum XYZ corner; blank origin shifts by negative-edge band build-up',center_finished_local_mm:world.map((x,k)=>round(x-(part===h.id?hb:vb).min[k])),world_center_mm:world.map(round),entry_axis:axis,entry_sign:entrySign,diameter_mm:diameter,depth_mm:depth,status:'source_dimensions_trial_placement_not_CNC_released',source:connector.source});
          const edge=op(h.id,'rastex_edge_bore',center,0,sign,connector.edgeDiameter,connector.camSetback);
          const boss=op(h.id,'rastex_cam_bore',cam,1,h.role==='top'?-1:1,connector.camDiameter,connector.camDepth);
          const pilot=op(v.id,'rastex_dowel_pilot',center,0,-sign,connector.sidePilotDiameter,connector.sidePilotDepth);
          byId.get(h.id).operations.push(edge,boss);byId.get(v.id).operations.push(pilot);
          joint.fixings.push({cam_product:connector.cam,dowel_product:connector.dowel,edge_entry_world_mm:edge.world_center_mm,side_entry_world_mm:pilot.world_center_mm,cam_center_world_mm:boss.world_center_mm,nominal_axes_coincident:true});
        }
        joints.push(joint);
      }
    }
  }
  // Only intersections actually present in the closed, axis-aligned model become groove candidates.
  // A missing retaining edge is recorded, never filled in with a fabricated drilling success.
  const panels=compiled.parts.filter(q=>q.mat==='case'&&['side','divider','top','bottom'].includes(q.role));
  for(const back of compiled.parts.filter(q=>q.role==='back')){
    const bb=bounds(back),support=[];
    if(!bb){backFits.push({back:back.id,status:'unsupported_transform',retaining_edges:[]});continue;}
    for(const panel of panels){
      const pb=bounds(panel);if(!pb)continue;
      const axis=panel.role==='side'||panel.role==='divider'?0:1,along=1-axis;
      const overlap=[0,1,2].map(k=>Math.min(bb.max[k],pb.max[k])-Math.max(bb.min[k],pb.min[k]));
      if(!overlap.every(v=>v>1e-5))continue;
      const sign=(bb.min[axis]+bb.max[axis])>(pb.min[axis]+pb.max[axis])?1:-1;
      const insertion=overlap[axis],depth=insertion+TRIAL_TOLERANCES.groove_depth_clearance_mm,width=bb.xyz[2]+TRIAL_TOLERANCES.groove_width_clearance_mm;
      const center=[0,1,2].map(k=>(Math.max(bb.min[k],pb.min[k])+Math.min(bb.max[k],pb.max[k]))/2-pb.min[k]);
      center[axis]=sign>0?pb.xyz[axis]:0;center[2]=(bb.min[2]+bb.max[2])/2-pb.min[2];
      const op={kind:'back_groove_candidate',mate:back.id,datum:'part-local minimum XYZ corner before banding; coordinates below refer to FINISHED part',entry_axis:axis,entry_sign:sign,center_finished_local_mm:center.map(round),length_axis:along,length_mm:round(overlap[along]),width_mm:round(width),depth_mm:round(depth),nominal_insertion_mm:round(insertion),remaining_web_mm:round(pb.xyz[axis]-depth),clearance_budget_mm:{groove_minus_max_back:round(width-.1-(bb.xyz[2]+.2)),depth_minus_max_insertion:round(depth-.1-(insertion+.2))},status:'trial_requires_process_validation'};
      byId.get(panel.id).operations.push(op);support.push({panel:panel.id,edge:['X','Y'][axis]+(sign>0?'-':'+'),insertion_mm:round(insertion)});
    }
    const edges=new Set(support.map(s=>s.edge));backFits.push({back:back.id,retaining_edges:support,missing_edges:['X-','X+','Y-','Y+'].filter(e=>!edges.has(e)),status:edges.size===4?'four_nominal_edges_trial':'retention_incomplete'});
  }
  const hardware=records.filter(r=>r.hardware&&r.role==='box-bottom').map(r=>({part:r.id,...r.hardware}));
  const invalidOperations=[];
  for(const part of records)for(const [index,op]of part.operations.entries()){
    op.stock_bounds=operationBounds(part,op);
    if(op.stock_bounds.status==='invalid')invalidOperations.push({part:part.id,index,issues:op.stock_bounds.issues});
  }
  const reconstruction=reassembleCarcass({parts:records},design);
  return {schema:'aura.manufacturing-review/1',units:'mm',production_approved:false,status:'engineering_review_required',tolerances:{...TRIAL_TOLERANCES},
    scope:'Blank/finished correspondence and nominal back-retention analysis. Not a complete joinery recipe, collision proof, CNC program or physical assembly test.',
    reconstruction,invalid_operations:invalidOperations,part_count:records.length,parts:records,back_fits:backFits,drawer_hardware:hardware,carcass_joints:joints,selected_connector:connector?structuredClone(connector):null,
    blockers:['material_and_band_measurement','connector_and_hinge_drilling_recipes','joint_strength_and_product_testing','independent_full_assembly_reconstruction',...(invalidOperations.length?['operation_outside_stock_or_unverified_shape']:[]),...(backFits.some(b=>b.status!=='four_nominal_edges_trial')?['back_retention_incomplete']:[]),...(hardware.some(h=>!h.geometry_fit)?['runner_geometry_or_legacy_profile']:[])]};
}
const cell=v=>{let s=String(v??'');if(typeof v==='string'&&/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
export function manufacturingCsv(report,orderQuantity=1){
  if(!Number.isInteger(orderQuantity)||orderQuantity<1)throw Error('Invalid order quantity');
  const header=['ID','Role','Category','Status','Component quantity','Order quantity','Total component quantity','Blank X mm','Blank Y mm','Blank Z mm','Finished X mm','Finished Y mm','Finished Z mm','Thickness axis','Production approved'];
  return '\uFEFF'+[header,...report.parts.map(r=>[r.id,r.role,r.category,r.status,r.quantity,orderQuantity,r.quantity*orderQuantity,...(r.blank?.blank_xyz_mm||['','','']),...(r.blank?.finished_xyz_mm||['','','']),r.blank?.thickness_axis??'',false])].map(row=>row.map(cell).join(';')).join('\r\n');
}
export function manufacturingOperationsCsv(report,orderQuantity=1){
  if(!Number.isInteger(orderQuantity)||orderQuantity<1)throw Error('Invalid order quantity');
  const header=['Part ID','Operation','Mate','Order quantity','Status','Datum','Entry axis','Entry sign','Finished local X mm','Finished local Y mm','Finished local Z mm','Diameter mm','Groove width mm','Length mm','Depth mm','Source','Stock bounds status','Stock bounds issues'];
  const rows=report.parts.flatMap(p=>p.operations.map(o=>[p.id,o.kind,o.mate,orderQuantity,o.status,o.datum,o.entry_axis,o.entry_sign,...o.center_finished_local_mm,o.diameter_mm??'',o.width_mm??'',o.length_mm??'',o.depth_mm,o.source??'AURA workshop trial - not CNC released',o.stock_bounds?.status??'not_checked',o.stock_bounds?.issues?.join('|')??'']));
  return '\uFEFF'+[header,...rows].map(r=>r.map(cell).join(';')).join('\r\n');
}
