import {SHELF_SUPPORT_PROFILE as H} from '../hardware.js';
export function addShelfOperations(compiled,records){
 const map=new Map(records.map(p=>[p.id,p])),result=[];
 for(const pin of compiled.parts.filter(p=>p.role==='shelf-pin'&&p.hardware?.profile===H.id)){
  const m=pin.shelfMount,shelfId=pin.id.replace(/-pin-(-1|1)-\d+$/,''),row={pin:pin.id,shelf:shelfId,product:H.product,issues:[],production_approved:false,scope:H.geometryScope};result.push(row);
  if(!m?.face_world_mm?.every(Number.isFinite)||pin.hardware.proxy_only!==true){row.issues.push('missing_source_datum');continue;}
  // Recompute after kitchen/bath placement; stored unit-local world caches are not assembly evidence.
  const at=[pin.pos[0]+m.hand*H.insertion,pin.pos[1],pin.pos[2]];
  const supports=compiled.parts.filter(p=>p.mat==='case'&&['side','divider'].includes(p.role)&&!p.rot?.some(v=>Math.abs(v)>1e-8)).map(p=>({p,xyz:[p.geom.w,p.geom.h,p.geom.d]})).filter(({xyz})=>xyz.every(Number.isFinite)).map(o=>({...o,min:o.xyz.map((v,k)=>o.p.pos[k]-v/2),max:o.xyz.map((v,k)=>o.p.pos[k]+v/2)})).filter(b=>Math.abs((m.hand>0?b.max[0]:b.min[0])-at[0])<.01&&at[1]>=b.min[1]&&at[1]<=b.max[1]&&at[2]>=b.min[2]&&at[2]<=b.max[2]);
  if(supports.length!==1||!map.get(supports[0].p.id)?.blank){row.issues.push('unique_stock_support_not_found');continue;}
  const side=supports[0],shelf=compiled.parts.find(p=>p.id===shelfId);
  if(!shelf||Math.abs(shelf.pos[1]-shelf.geom.h/2-at[1]-H.axisBelowShelf)>.11){row.issues.push('shelf_bearing_axis_mismatch');continue;}
  map.get(side.p.id).operations.push({kind:'shelf_support_bore',mate:pin.id,entry_axis:0,entry_sign:m.hand,center_finished_local_mm:at.map((v,k)=>Math.round((v-side.min[k])*1000)/1000),world_center_mm:at,diameter_mm:H.boreDiameter,depth_mm:H.trialHoleDepth,source:H.source,datum:'Finished stock face;axis3.75mm below shelf underside',status:'source5mm_diameter_8mm_insertion_plus_trial0.5mm_hole_depth_not_CNC_released'});
  row.support=side.p.id;row.axis_world_mm=at;row.nominal_insertion_mm=8;row.trial_depth_mm=8.5;row.issues.push('drill_tip_tolerance_and_load_require_validation');
 }
 return result;
}
