// Nominal stock containment only. This is not a cutter collision, joint/load or CNC release gate.
const finite3=a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite);
export function operationBounds(part,op){
  const size=part.blank?.finished_xyz_mm,c=op.center_finished_local_mm,axis=op.entry_axis,issues=[];
  const fail=reason=>({status:'invalid',issues:[reason],production_approved:false});
  if(!finite3(size)||size.some(v=>v<=0)||!finite3(c))return fail('missing_or_nonfinite_stock_or_center');
  if(![0,1,2].includes(axis)||![1,-1].includes(op.entry_sign))return fail('invalid_entry_face');
  if(!Number.isFinite(op.depth_mm)||op.depth_mm<=0)return fail('invalid_depth');
  if(part.blank.requires_outline)return fail('shaped_outline_requires_dedicated_validation');
  const expected=op.entry_sign>0?size[axis]:0;
  if(Math.abs(c[axis]-expected)>.001)issues.push('entry_not_on_named_face');
  if(op.depth_mm>size[axis]+.001)issues.push('depth_exceeds_stock');
  if(op.depth_mm>=size[axis]-.001)issues.push('blind_operation_breaks_through');
  const min=c.slice(),max=c.slice();
  if(op.entry_sign>0)min[axis]-=op.depth_mm;else max[axis]+=op.depth_mm;
  if(op.kind==='back_groove_candidate'){
    const along=op.length_axis,widthAxis=[0,1,2].find(k=>k!==axis&&k!==along);
    if(![0,1,2].includes(along)||along===axis||!Number.isFinite(op.length_mm)||op.length_mm<=0||!Number.isFinite(op.width_mm)||op.width_mm<=0)return fail('invalid_groove_extent');
    min[along]-=op.length_mm/2;max[along]+=op.length_mm/2;
    min[widthAxis]-=op.width_mm/2;max[widthAxis]+=op.width_mm/2;
  }else if(['rastex_cam_bore','rastex_edge_bore','rastex_dowel_pilot'].includes(op.kind)){
    if(!Number.isFinite(op.diameter_mm)||op.diameter_mm<=0)return fail('invalid_bore_diameter');
    for(const k of [0,1,2].filter(k=>k!==axis)){min[k]-=op.diameter_mm/2;max[k]+=op.diameter_mm/2;}
  }else return fail('unknown_operation');
  for(let k=0;k<3;k++)if(min[k]<-.001||max[k]>size[k]+.001)issues.push('tool_envelope_outside_stock_axis_'+k);
  return {status:issues.length?'invalid':'nominal_containment_only',issues,tool_envelope_finished_mm:{min,max},nominal_remaining_depth_mm:size[axis]-op.depth_mm,production_approved:false};
}
