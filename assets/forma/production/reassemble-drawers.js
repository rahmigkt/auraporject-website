// Rebuild a box from cut blanks and declared joint insertion. No stored position
// is used to derive its dimensions/relative placement; translation is unconstrained.
export function reassembleDrawers(records){
 const map=new Map(records.map(p=>[p.id,p])),result=[],near=(a,b)=>Math.abs(a-b)<.11;
 const size=p=>{if(!p?.blank)throw Error('Missing box blank');return p.blank.blank_xyz_mm.map((v,k)=>v+p.blank.edges.filter(e=>e.axis===k).reduce((s,e)=>s+e.build_up_mm,0));};
 for(const bottom of records.filter(p=>p.role==='box-bottom'&&p.construction?.id==='aura-grooved-18-trial')){
  const id=bottom.id.replace(/-box-bottom$/,''),row={id,scope:'Five cut blanks and relative box geometry;translation into cabinet,fastener strength and front attachment not proved',complete:false,production_approved:false,checks:[]};result.push(row);
  try{
   const ids=['-box-sideL','-box-sideR','-box-endB','-box-endF','-box-bottom'],parts=ids.map(s=>map.get(id+s)),[l,r,b,f,bot]=parts.map(size),W=l[0]+f[0]+r[0],H=l[1],D=l[2],ins=bottom.construction.insertion_mm;
   if(!Number.isFinite(ins)||ins<=0)throw Error('Unverified insertion');
   row.checks.push({test:'end_widths',pass:near(b[0],f[0])},{test:'sides_same_height_depth',pass:near(r[1],H)&&near(r[2],D)},{test:'end_heights',pass:near(b[1],H)&&near(f[1],H)},{test:'bottom_insertion_width_depth',pass:near(bot[0],W-l[0]-r[0]+2*ins)&&near(bot[2],D-b[2]-f[2]+2*ins)});
   const expected=[[-W/2+l[0]/2,H/2,0],[W/2-r[0]/2,H/2,0],[0,H/2,-D/2+b[2]/2],[0,H/2,D/2-f[2]/2],[0,6+bot[1]/2,(b[2]-f[2])/2]];
   for(let i=0;i<parts.length;i++){const actual=parts[i].placement.position_mm.map((v,k)=>v-parts[0].placement.position_mm[k]),relative=expected[i].map((v,k)=>v-expected[0][k]);row.checks.push({test:parts[i].id,expected_relative_mm:relative,pass:actual.every((v,k)=>near(v,relative[k]))&&parts[i].placement.rotation_rad.every(v=>near(v,0))});}
   row.rebuilt_outer_xyz_mm=[W,H,D];row.complete=row.checks.every(c=>c.pass);
  }catch(e){row.error=e.message;}
 }
 return result;
}
