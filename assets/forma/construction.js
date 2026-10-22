// Original AURA assembly grammar. Dimensions below are concept member sizes,
// not normative minima. See knowledge/engineering/frame-sources.txt.
import {transformPositions} from './mesh.js';
import {worldPositions} from './build.js';
const box=(id,role,w,h,d,pos,rot=[0,0,0],internal=true)=>({id,role,mat:'frame',geom:{fn:'box',w,h,d},pos,rot,internal});
const point=(q,p)=>Array.from(transformPositions(new Float32Array(p),q.pos,q.rot));
function beam(id,a,b,width=30,depth=30,internal=true){
 const v=b.map((x,i)=>x-a[i]),h=Math.hypot(...v),rx=Math.atan2(v[2],v[1]),rz=-Math.asin(v[0]/h);
 return box(id,'frame-back-post',width,h,depth,a.map((x,i)=>(x+b[i])/2),[rx,0,rz],internal);
}
export function backFrame(p,parts,deckTop){
 const back=parts.find(q=>q.role==='back-cushion')||parts.find(q=>['back-frame','back-tight'].includes(q.role));
 if(!back)return [];
 const g=back.geom,a=back.rot[0],post=30,rail=60,span=p.width-2*p.armWidth-40;
 const n=Math.max(2,Math.ceil(span/600)+1),out=[],visible=p.baseType==='frame';
 // The rear face of the real raked cushion/shell defines the support plane.
 const low=point(back,[0,-g.h/2,-g.d/2-post/2]);
 const top=point(back,[0,g.h/2-rail/2,-g.d/2-post/2]);
 const lowY=deckTop-25,zLow=low[2]+Math.tan(a)*(lowY-low[1]);
 const yTop=Math.max(lowY+80,top[1]),zTop=low[2]+Math.tan(a)*(yTop-low[1]);
 for(let i=0;i<n;i++){
  const x=-span/2+span*i/(n-1);
  out.push(beam('frame-back-post-'+i,[x,lowY,zLow],[x,yTop,zTop],post,post,!visible));
  // Ties reach the existing seat rear rail, rather than floating behind it.
  const seatZ=p.baseType==='frame'?-p.depth/2+14:-p.depth/2+40;
  out.push(box('frame-back-tie-'+i,'frame-back-tie',post,50,Math.abs(zLow-seatZ)+post,[x,lowY,(zLow+seatZ)/2]));
 }
 const midY=(lowY+yTop)/2,midZ=(zLow+zTop)/2;
 for(const [id,y,z] of [['lower',lowY,zLow],['mid',midY,midZ],['upper',yTop,zTop]])
  out.push(box('frame-back-'+id,'frame-back-rail',span+post,rail,post,[0,y,z],[a,0,0],!visible));
 return out;
}
export function seatMounts(p,parts,deckTop){
 const out=[],roots=parts.filter(q=>['leg','arm-post','plinth','sled'].includes(q.role));
 if(!roots.length){
  // Skirts are fabric, not feet. Concealed timber glides supply a floor contact.
  for(const x of [-p.width/2+60,p.width/2-60])for(const z of [-p.depth/2+60,p.depth/2-60])
   roots.push(box('frame-glide-'+roots.length,'frame-foot',40,20,40,[x,10,z]));
  out.push(...roots);
 }
 for(const [i,q] of roots.entries()){
  const g=q.geom;let anchors=[];
  if(g.fn==='lathe'){
   const h=Math.max(...g.profile.map(v=>v[0])),a=point(q,[0,0,0]),b=point(q,[0,h,0]);
   const t=Math.max(0,Math.min(1,(deckTop-20-a[1])/(b[1]-a[1])));
   anchors=[a.map((v,k)=>v+t*(b[k]-v))];
  }else if(g.fn==='tube'){
   const points=g.points.map(v=>point(q,v)),top=Math.max(...points.map(v=>v[1]));
   anchors=points.filter(v=>v[1]>=top-.01);
  }else{const b=aabb(q);anchors=[[(b.lo[0]+b.hi[0])/2,b.hi[1],(b.lo[2]+b.hi[2])/2]];}
  for(const [j,start] of anchors.entries()){
   const [x,,z]=start,targetZ=(z<0?-1:1)*(p.depth/2-(p.baseType==='frame'?14:40));
   const end=[x,deckTop-25,targetZ];
   if(Math.hypot(...end.map((v,k)=>v-start[k]))>1)
    out.push({...beam('frame-mount-'+i+'-'+j,start,end,40,40),role:'frame-mount'});
  }
 }
 return out;
}
const structural=q=>!q.line&&!q.decor&&!['fabric','welt','foam','linen','leather'].includes(q.mat)&&!['pull','inlay','groove','button'].includes(q.role);
function aabb(q){
 const p=worldPositions(q),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<p.length;i+=3)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p[i+k]);hi[k]=Math.max(hi[k],p[i+k]);}
 return {lo,hi};
}
const touching=(a,b)=>a.lo.every((v,k)=>v<=b.hi[k]+2&&a.hi[k]>=b.lo[k]-2);
export function constructionReview(c,materials={}){
 if(!['seating','table'].includes(c.family))return {status:'not_applicable',findings:[],members:[],contacts:[]};
 const members=[],findings=[],contacts=[],floor=[];
 for(const q of c.parts.filter(structural))try{
  const b=aabb(q);if(![...b.lo,...b.hi].every(Number.isFinite))throw Error('invalid bounds');
  members.push({id:q.id,role:q.role,box:b});
 }catch{findings.push({code:'frameInvalidGeometry',level:'review',parts:[q.id]});}
 const adj=members.map(()=>[]);
 members.forEach((m,i)=>{if(m.box.lo[1]<=2&&m.box.hi[1]>=-2)floor.push(i);for(let j=0;j<i;j++)if(touching(m.box,members[j].box)){contacts.push([m.id,members[j].id]);adj[i].push(j);adj[j].push(i);}});
 const reached=new Set(floor),queue=[...floor];for(const i of queue)for(const j of adj[i])if(!reached.has(j)){reached.add(j);queue.push(j);}
 if(!floor.length)findings.push({code:'frameNoFloor',level:'review'});
 const back=members.filter(m=>m.role==='frame-back-post');
 if(c.family==='seating'&&!back.length)findings.push({code:'backSupportMissing',level:'review',fixable:true});
 const disconnected=members.filter((m,i)=>!reached.has(i)&&/frame|rail|apron|leg|post|column|foot|top/.test(m.role));
 if(disconnected.length)findings.push({code:'frameDisconnected',level:'review',parts:disconnected.map(m=>m.id)});
 if(c.family==='table'&&c.params.baseType==='legsOnly')findings.push({code:'tableBracing',level:'review',fixable:true});
 findings.push({code:'jointCapacityReview',level:'review'},{code:'wholeProductReview',level:'review'});
 const base=materials.base?.surface==='same'?materials.top:materials.base;
 const bending_scenarios=c.parts.filter(q=>structural(q)&&(['frame','wood'].includes(q.mat)||(q.mat==='base'&&base?.surface==='wood'))&&/rail|stretcher|apron|bearer|mount/.test(q.role)&&['box','cushion'].includes(q.geom.fn)).flatMap(q=>{
  const g=q.geom,span=Math.max(g.w,g.d);if(span<2*g.h||span<150)return [];
  const b=g.w>=g.d?g.d:g.w,h=g.h,I=b*h**3/12,E=9000,P=1000;
  if(![span,b,h,I].every(v=>Number.isFinite(v)&&v>0))return [];
  return [{id:q.id,span_mm:span,b_mm:b,h_mm:h,E_MPa:E,point_load_N:P,
   deflection_mm:P*span**3/(48*E*I),bending_stress_MPa:(P*span/4)*(h/2)/I,
   model:'isolated simply supported rectangular member; central point load, unverified E, no joint stiffness, no assembly or normative load claim'}];
 });
 return {status:'designer_review_required',production_approved:false,findings,members,contacts,bending_scenarios,
  method:'World mesh AABB broad-phase contact graph, tolerance2mm. Possible contacts only; not joint stiffness or proof of load transfer.',
  floor_members:floor.map(i=>members[i].id),unconnected:disconnected.map(m=>m.id)};
}
