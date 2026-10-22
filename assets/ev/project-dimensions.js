import {compileItem} from './items.js';
import {FAMILIES} from '../forma/families.js';
import {partDimensions} from '../forma/part-dimensions.js';
const val=v=>typeof v==='number'?v:v?.value;
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const rnd=v=>Number.isFinite(v)?Math.round(v*1000)/1000:null;
export function projectWithDimensions(plan){
 const result=structuredClone(plan);
 const products=(plan.items||[]).map(i=>{
  const record={id:i.id,quantity:i.qty||1,position_xy_mm:i.pos_xy_mm||null,rotation_deg:i.rot_deg??0};
  try{if(!i.design||!FAMILIES[i.design.family])throw Error('No supported parametric design');record.dimensions=partDimensions(compileItem(i).compiled);}
  catch(error){record.status='unavailable';record.reason=String(error.message);record.dimensions=null;}
  return record;
 });
 result.component_dimensions={schema:'aura.ev-component-dimensions/1',units:'mm',product_axes:'X left/right, Y vertical, Z back/front; product placement is separate plan XY and rot_deg',products,production_approved:false};
 result.measurement_summary={schema:'aura.ev-measurement-summary/1',units:'mm',area_units:'m2',status:'model_derived_not_site_verified',
  walls:(plan.walls||[]).map(w=>({id:w.id,length_mm:point(w.from_xy_mm)&&point(w.to_xy_mm)?rnd(Math.hypot(w.to_xy_mm[0]-w.from_xy_mm[0],w.to_xy_mm[1]-w.from_xy_mm[1])):null,thickness_mm:val(w.thickness)??null,thickness_source_status:w.thickness?.status??'unspecified'})),
  openings:(plan.openings||[]).map(o=>({id:o.id,wall_id:o.wall_id,kind:o.kind,width_mm:val(o.width)??null,height_mm:val(o.height)??null,sill_mm:val(o.sill_height)??null,offset_mm:val(o.offset_from_wall_start)??null})),
  rooms:(plan.spaces||[]).map(s=>{const pts=s.boundary_xy_mm;let b=null,area=null;if(Array.isArray(pts)&&pts.length>=3&&pts.every(point)){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);b=[rnd(Math.max(...xs)-Math.min(...xs)),rnd(Math.max(...ys)-Math.min(...ys))];area=rnd(Math.abs(pts.reduce((n,p,i)=>{const q=pts[(i+1)%pts.length];return n+p[0]*q[1]-q[0]*p[1];},0))/2e6);}return {id:s.id,bounding_xy_mm:b,bounding_note:'Envelope, not guaranteed usable rectangular room dimensions',net_polygon_area_m2:area,ceiling_height_mm:val(s.ceiling_height)??null,ceiling_source_status:s.ceiling_height?.status??'unspecified'};})};
 const rooms=result.measurement_summary.rooms;
 const sum=ids=>rnd(rooms.filter(r=>ids.has(r.id)&&r.net_polygon_area_m2!==null).reduce((n,r)=>n+r.net_polygon_area_m2,0));
 const balconyIds=new Set((plan.spaces||[]).filter(s=>s.kind==='balcony').map(s=>s.id)),insideIds=new Set((plan.spaces||[]).filter(s=>s.kind!=='balcony').map(s=>s.id));
 result.measurement_summary.areas_m2={interior_polygon_sum:sum(insideIds),balcony_polygon_sum:sum(balconyIds),overlap_checked:false,basis:'Sum of source room polygons; not gross floor area or a certified usable-area calculation. Balcony separated.'};
 return result;
}
