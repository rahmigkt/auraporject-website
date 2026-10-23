// Cut/finished correspondence in part-local axes; never infer edge direction from sorted size.
const r=v=>Math.round(v*1000)/1000;
export function panelBlank(q,band=0){
  if(!Number.isFinite(band)||band<0)throw Error('Invalid band thickness');
  const g=q.geom, slab=g?.fn==='slab'&&Array.isArray(q.cut)&&q.cut.length===3;
  const xyz=slab?[q.cut[0],q.cut[2],q.cut[1]]:[g?.w,g?.h,g?.d];
  if((!slab&&!['box','cushion'].includes(g?.fn))||q.shaped||!xyz.every(v=>Number.isFinite(v)&&v>0))return null;
  const thicknessAxis=xyz.indexOf(Math.min(...xyz)), axes=[0,1,2].filter(k=>k!==thicknessAxis), edges=[];
  if(band&&q.band){
    if(q.band==='four')for(const axis of axes)for(const sign of [-1,1])edges.push({axis,sign,build_up_mm:band});
    else if(q.band==='three'&&slab){edges.push({axis:2,sign:1,build_up_mm:band},{axis:0,sign:-1,build_up_mm:band},{axis:0,sign:1,build_up_mm:band});}
    else if(q.band==='front'&&axes.includes(2))edges.push({axis:2,sign:1,build_up_mm:band});
    else if(q.band==='long'&&q.role==='plinth'&&axes.includes(1))edges.push({axis:1,sign:1,build_up_mm:band});
    else return null; // nonrectangular/ambiguous edge needs a dedicated recipe
  }
  const blank=xyz.map((v,k)=>r(v-edges.filter(e=>e.axis===k).length*band));
  if(blank.some(v=>v<=0))throw Error('Band exceeds finished part');
  const order=axes.sort((a,b)=>xyz[b]-xyz[a]), [la,wa]=order;
  return {requires_outline:slab,finished_xyz_mm:xyz.slice(),blank_xyz_mm:blank,thickness_axis:thicknessAxis,plane_axes:order,edges,
    l:blank[la],w:blank[wa],t:xyz[thicknessAxis],net:[xyz[la],xyz[wa]],bandLong:edges.filter(e=>e.axis===wa).length,bandShort:edges.filter(e=>e.axis===la).length,
    reconstructed_xyz_mm:blank.map((v,k)=>r(v+edges.filter(e=>e.axis===k).length*band))};
}
