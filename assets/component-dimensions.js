// Earlier guided-design/Ritmo engines use metres for primitive geometry.
import {partCorners} from './reference-studies.js';
const valid=a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite);
const mm=v=>Math.round(v*1000000)/1000;
export function componentDimensions(model){
 const parts=model.parts.map((p,i)=>{
  const out={id:p.id||'C'+String(i+1).padStart(4,'0'),group_id:p.partId||null,role:p.role,material:p.material,internal:!!p.internal,status:'declared_model_dimensions'};
  if(!valid(p.size)||!valid(p.position)){out.status='unavailable';out.local_xyz_mm=null;return out;}
  const corners=partCorners(p);if(!corners.every(valid)){out.status='unavailable';out.local_xyz_mm=null;return out;}
  out.local_xyz_mm=p.size.map(mm);out.position_mm=p.position.map(mm);out.placed_xyz_mm=[0,1,2].map(k=>mm(Math.max(...corners.map(v=>v[k]))-Math.min(...corners.map(v=>v[k]))));return out;
 });
 return {schema:'aura.component-dimensions/1',units:'mm',axes:['X: left/right','Y: vertical','Z: back/front'],basis:'Declared primitive boxes converted from metres; placed extents include rotation. Curved upholstery geometry, cut patterns, tolerances and joint allowances require separate review.',production_approved:false,part_count:parts.length,parts};
}
