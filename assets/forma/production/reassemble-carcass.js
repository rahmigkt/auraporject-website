// Independent limited reconstruction: use cut blanks + edge build-up + construction datums,
// never stored part positions to derive the result. Stored positions are comparison targets only.
const near=(a,b)=>Math.abs(a-b)<=.11;
export function reassembleCarcass(report,design){
  const p=design.params,parts=new Map(report.parts.map(q=>[q.id,q])),checks=[],reconstructed=[];
  if(design.family!=='storage'||p.topType!=='flush'||p.base!=='plinth'||p.backConstruction!=='module-grooved')return {status:'unsupported_construction',complete:false,checks:[],scope:'carcass_and_module_backs_only'};
  const ids=report.parts.filter(q=>/^m\d+-side-L$/.test(q.id)).map(q=>Number(q.id.match(/^m(\d+)/)[1])).sort((a,b)=>a-b);
  const finished=id=>{
    const b=parts.get(id)?.blank;if(!b)throw Error('Missing blank: '+id);
    return b.blank_xyz_mm.map((n,k)=>n+b.edges.filter(e=>e.axis===k).reduce((s,e)=>s+e.build_up_mm,0));
  };
  const place=(id,min,xyz)=>{
    const q=parts.get(id);if(!q)throw Error('Missing part: '+id);
    const expected=q.placement.position_mm.map((v,k)=>v-xyz[k]/2);
    checks.push({id,dimensions:xyz,placement_matches:min.every((v,k)=>near(v,expected[k])),unrotated:q.placement.rotation_rad.every(v=>near(v,0))});
    reconstructed.push({id,min_mm:min,max_mm:min.map((v,k)=>v+xyz[k])});
  };
  try{
    if(!ids.length)throw Error('No transport modules');
    let x=-p.width/2;
    for(const n of ids){
      const stem='m'+n,sl=finished(stem+'-side-L'),sr=finished(stem+'-side-R'),top=finished(stem+'-top'),bottom=finished(stem+'-bottom'),back=finished(stem+'-back');
      const width=sl[0]+top[0]+sr[0],z=-p.depth/2;
      place(stem+'-side-L',[x,p.plinthHeight,z],sl);
      place(stem+'-side-R',[x+sl[0]+top[0],p.plinthHeight,z],sr);
      place(stem+'-top',[x+sl[0],p.height-top[1],z],top);
      place(stem+'-bottom',[x+sl[0],p.plinthHeight,z],bottom);
      place(stem+'-back',[x+sl[0]-7,p.plinthHeight+bottom[1]-7,z+10],back);
      checks.push({id:stem+'-construction',width_matches_bottom:near(top[0],bottom[0]),side_heights:near(sl[1]+p.plinthHeight,p.height)&&near(sr[1],sl[1]),depth_matches:near(top[2],sl[2])&&near(bottom[2],sl[2]),back_width:near(back[0],top[0]+14),back_height:near(back[1],p.height-top[1]-p.plinthHeight-bottom[1]+14)});
      x+=width;
    }
    checks.push({id:'nominal-width',matches:near(x,p.width/2)});
    const passed=checks.every(c=>Object.entries(c).every(([k,v])=>typeof v!=='boolean'||v));
    return {status:passed?'limited_reconstruction_pass':'mismatch',complete:passed,scope:'carcass_and_module_backs_only',production_approved:false,not_verified:['interior_and_front_assembly','all_fastener_holes','tolerance_stack_for_entire_product','load_or_physical_test'],checks,reconstructed};
  }catch(error){return {status:'incomplete',complete:false,reason:error.message,checks,reconstructed,scope:'carcass_and_module_backs_only',production_approved:false};}
}
