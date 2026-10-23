import {loadCsg,csgReady,cutMesh} from '../csg.js';
import {buildMesh,worldPositions} from '../build.js';
import {manufacturingReport} from './manufacturing.js';
export function solidVolume(mesh){
  let sum=0;const p=mesh.positions,t=mesh.indices;
  for(let i=0;i<t.length;i+=3){const a=t[i]*3,b=t[i+1]*3,c=t[i+2]*3;sum+=p[a]*(p[b+1]*p[c+2]-p[b+2]*p[c+1])+p[a+1]*(p[b+2]*p[c]-p[b]*p[c+2])+p[a+2]*(p[b]*p[c+1]-p[b+1]*p[c]);}
  return Math.abs(sum/6);
}
export function machiningCutter(part,op){
  if(op.stock_bounds?.status!=='nominal_containment_only')throw Error('Unvalidated machining operation: '+part.id);
  const at=op.center_finished_local_mm.map((v,k)=>v-part.blank.finished_xyz_mm[k]/2),common={at,axis:op.entry_axis,sign:op.entry_sign,depth:op.depth_mm};
  if(op.kind==='assembly_countersink')return {...common,type:'countersink',dia:op.diameter_mm,innerDia:op.pilot_diameter_mm};
  if(['hinge_spacer_relief','back_groove_candidate','drawer_bottom_groove'].includes(op.kind)){
    // csg pocket base X maps to globalZ for an X-entry, otherwise globalX.
    const baseX=common.axis===0?2:0,a=op.length_axis===baseX?op.length_mm:op.width_mm,b=op.length_axis===baseX?op.width_mm:op.length_mm;
    return {...common,type:'pocket',a,b};
  }
  return {...common,type:'hole',dia:op.diameter_mm};
}
function stl(mesh){
  const n=mesh.indices.length/3,buffer=new ArrayBuffer(84+n*50),dv=new DataView(buffer);dv.setUint32(80,n,true);
  const p=mesh.positions;
  for(let i=0;i<n;i++){
    const at=84+i*50,v=[0,1,2].map(k=>mesh.indices[i*3+k]*3),a=v[0],b=v[1],c=v[2],u=[0,1,2].map(k=>p[b+k]-p[a+k]),w=[0,1,2].map(k=>p[c+k]-p[a+k]),normal=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],len=Math.hypot(...normal)||1;
    normal.forEach((v,k)=>dv.setFloat32(at+k*4,v/len,true));
    for(let k=0;k<3;k++)for(let j=0;j<3;j++)dv.setFloat32(at+12+k*12+j*4,p[v[k]+j],true);
  }
  return new Uint8Array(buffer);
}
function extent(P){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<P.length;i+=3)for(let k=0;k<3;k++){if(!Number.isFinite(P[i+k]))throw Error('Nonfinite mesh');min[k]=Math.min(min[k],P[i+k]);max[k]=Math.max(max[k],P[i+k]);}return {min,max};}
export async function machiningGeometryFiles(compiled,design){
  const containsCut=g=>!!g&&(g.fn==='cut'||containsCut(g.inner));
  if(compiled.parts.some(q=>containsCut(q.geom)))throw Error('Tasarımcı işleme geometrisinin bağımsız doğrulaması gerekli; önizleme yedeği imalat geometrisi olarak aktarılmayacak.');
  const report=manufacturingReport(compiled,design);
  if(report.blockers.some(b=>['module_joining_incomplete','selected_assembly_connection_incomplete','drawer_blank_reconstruction_mismatch','selected_rail_support_recipe_incomplete','selected_drawer_joinery_incomplete','selected_runner_fixing_recipe_incomplete'].includes(b)))throw Error('Ray/çekmece deneme reçetesinin donanım veya bağlantı eşleşmesi eksik.');
  if(report.invalid_operations.length)throw Error('İşleme geometrisi hazırlanamadı: parça sınırı dışında veya doğrulanmamış operasyon var.');
  if(report.blockers.includes('selected_shelf_support_recipe_incomplete'))throw Error('Seçilen raf desteği ile gövde/raf eşleştirilemedi; eksik işleme paketi aktarılmayacak.');
  if(report.joint_mating.invalid.length)throw Error('Karşılıklı bağlantı delikleri eşleşmiyor; işleme paketi hazırlanmadı.');
  if(report.blockers.includes('selected_hinge_has_no_complete_stock_mounting_recipe'))throw Error('Seçilen menteşe için kapak/yan panel delik yerleşimi tamamlanamadı; işleme paketi hazırlanmadı.');
  if(report.parts.some(p=>p.operations.length)){await loadCsg();if(!csgReady())throw Error('İşleme motoru yüklenemedi. Kesilmemiş model başarılı gösterilmeyecek.');}
  const records=new Map(report.parts.map(p=>[p.id,p])),files=[],assembly=[],machined=[];
  for(const [index,q]of compiled.parts.entries()){
    if(q.line||q.decor||q.planOnly)continue;
    const r=records.get(q.id),before=buildMesh(q);let mesh=before;
    if(r.operations.length){
      if(!['box','cushion'].includes(q.geom.fn)||q.rot?.some(v=>Math.abs(v)>1e-8))throw Error('Unsupported machining frame: '+q.id);
      mesh=cutMesh(before,r.operations.map(o=>machiningCutter(r,o)));
      if(!mesh||mesh.failed||!mesh.indices.length)throw Error('CSG failed: '+q.id);
      const v0=solidVolume(before),v1=solidVolume(mesh);
      if(!(v1>0&&v1<v0-1e-3))throw Error('Machining did not remove material: '+q.id);
      machined.push({id:q.id,operations:r.operations.length,before_volume_mm3:v0,after_volume_mm3:v1,removed_volume_mm3:v0-v1});
    }
    const filename='parts/'+String(index+1).padStart(3,'0')+'.stl';extent(mesh.positions);files.push({name:filename,data:stl(mesh)});
    assembly.push({id:q.id,role:q.role,material_slot:q.mat,file:filename,position_mm:q.pos||[0,0,0],rotation_rad:q.rot||[0,0,0],status:r.operations.length?'supported_operations_subtracted':'source_geometry_no_machining_recipe_implied',source_world_envelope:extent(worldPositions(q))});
  }
  const manifest={schema:'aura.machining-geometry-review/1',units:'mm',stl_coordinates:'part-local;column vectors,R=Rx*Ry*Rz;radians;apply Z then Y then X rotation then translation',geometry_basis:'Actual compiled surface with supported CSG voids. Edge band/board composite is not separately modelled.',production_approved:false,status:'geometry_review_only',scope:'Mesh export/placement and supported void geometry; not a proof that all joints/recipes, material tolerances or physical assembly are complete.',source_part_count:compiled.parts.length,excluded_parts:compiled.parts.filter(q=>q.line||q.decor||q.planOnly).map(q=>({id:q.id,reason:'line/decorative/plan-only surface; not fabrication solid'})),assembly,machined,open_gates:report.blockers};
  files.push({name:'assembly.json',data:JSON.stringify(manifest,null,2)},{name:'design.json',data:JSON.stringify(design,null,2)});
  return {files,manifest};
}
