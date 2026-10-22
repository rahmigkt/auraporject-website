import {createHash} from 'node:crypto';
import {uygula} from '../studyo-motoru/motor.mjs';
import {diller} from './h4-diller.mjs';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export const LANGS=Object.keys(diller);
// Heights and stable kind IDs come from the tracked source generator, not guessed room measurements.
const ITEMS={'TV ünitesi':['tvunit',500],'kanepe':['sofa',820],'orta sehpa':['coffee',420],'ikili koltuk':['loveseat',820],'tekli koltuk (berjer)':['armchair',850],'yan sehpa':['side',550],'kahve köşesi berjeri':['reading',950],'büfe':['sideboard',800],'yemek masası':['dining',750],'yatak':['bed',1000],'komodin':['nightstand',520],'gardırop':['wardrobe',2300],'şifonyer':['dresser',850],'çalışma masası':['desk',750]};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
const fail=s=>{throw new Error(s);};
export function parseSource(row) {
 if(typeof row.id!=='string'||row.source?.dataset!=='ProcTHOR-10K'||row.source.license!=='Apache-2.0'||typeof row.ok!=='boolean')fail('source_contract');
 if(!Number.isInteger(row.source.house)||row.source.house<0||typeof row.source.split!=='string'||typeof row.source.room!=='string')fail('source_identity');
 if(row.id!==`aura-cozucu-${row.source.split}-${row.source.house}-${row.source.room}`)fail('source_identity');
 if(row.messages?.length!==2||row.messages[0].role!=='user'||row.messages[1].role!=='assistant')fail('source_messages');
 const m=/^(Oturma odası|Yatak odası), ([\d.]+) m²\. Köşeler \(mm\): (\[.*\])\. Açıklıklar: (.*?)\. Yerleştir: (.*?)\.$/u.exec(row.messages[0].content);
 if(!m)fail('source_grammar');
 const boundary=JSON.parse(m[3]);
 if(!Array.isArray(boundary)||boundary.length<3||boundary.length>8||!boundary.every(point))fail('source_boundary');
 const room={id:'room',kind:m[1]==='Oturma odası'?'living':'bedroom',boundary_xy_mm:boundary};
 const measuredArea=Math.abs(boundary.reduce((a,p,i)=>{const q=boundary[(i+1)%boundary.length];return a+p[0]*q[1]-q[0]*p[1];},0))/2e6;
 if(!finite(Number(m[2]))||measuredArea<=0||Math.abs(measuredArea-Number(m[2]))>.06)fail('source_area');
 const names=[],items=m[5].split('; ').map((text,i)=>{
  const a=/^(.*?) (\d+)×(\d+)$/u.exec(text);if(!a||!ITEMS[a[1]])fail('source_item');
  const [tur,yukseklik]=ITEMS[a[1]], en=Number(a[2]),derinlik=Number(a[3]);
  if(en<=0||derinlik<=0)fail('source_dimensions');names.push(a[1]);
  return {id:'e'+i,tur,en,derinlik,yukseklik};
 });
 const walls=boundary.map((p,i)=>({id:'w'+i,from_xy_mm:p,to_xy_mm:boundary[(i+1)%boundary.length],thickness:100}));
 const openings=[];
 if(m[4]!=='yok')for(const [i,text]of m[4].split('; ').entries()){
  const a=/^(kapı|pencere) (\d+) mm (\[.*?\])–(\[.*?\])(?:, denizlik (\d+))?$/u.exec(text);if(!a)fail('source_opening');
  const p=JSON.parse(a[3]),q=JSON.parse(a[4]),width=Number(a[2]);if(!point(p)||!point(q)||width<=0||Math.abs(Math.hypot(q[0]-p[0],q[1]-p[1])-width)>2)fail('source_opening_dimensions');
  if(a[1]==='pencere'&&a[5]===undefined)fail('source_sill');
  let mapped=false;
  // Same mapping as cozucu_ornekleri.mjs. The engine clips spans to each room edge.
  for(const w of walls){const [x,y]=w.from_xy_mm,[u,v]=w.to_xy_mm,L=Math.hypot(u-x,v-y);if(!L)fail('source_zero_wall');
   const ux=(u-x)/L,uy=(v-y)/L,d=z=>Math.abs((z[0]-x)*-uy+(z[1]-y)*ux),s=z=>(z[0]-x)*ux+(z[1]-y)*uy;
   const offset=Math.min(s(p),s(q)),mid=offset+width/2;
   if(d(p)<60&&d(q)<60&&mid>0&&mid<L){openings.push({id:'o'+i,wall_id:w.id,kind:a[1]==='kapı'?'door':'window',offset_from_wall_start:offset,width,sill_height:a[1]==='kapı'?0:Number(a[5])});mapped=true;break;}
  }
  if(!mapped)fail('source_unmapped_opening');
 }
 const solution=JSON.parse(row.messages[1].content);
 if(row.ok!==Array.isArray(solution.yerlesim)||(!row.ok&&solution.yerlesim!==null))fail('source_outcome');
 const positions={};
 if(row.ok){
  const counts=a=>a.reduce((r,k)=>(r[k]=(r[k]||0)+1,r),{});
  if(JSON.stringify(Object.entries(counts(names)).sort())!==JSON.stringify(Object.entries(counts(solution.yerlesim.map(p=>p.parca))).sort()))fail('source_piece_count');
  for(const p of solution.yerlesim){if(!point(p.merkez_mm)||!finite(p.on_derece))fail('source_placement');
   // Duplicate names (two nightstands/side tables) have lost their IDs. Do not invent a mapping.
   if(names.filter(n=>n===p.parca).length===1)positions[items[names.indexOf(p.parca)].id]={pos_xy_mm:p.merkez_mm,rot_deg:p.on_derece};
  }
 }
 return {room,items,state:{plan:{walls,openings,spaces:[room],items:[]}},positions,ambiguous_names:[...new Set(names.filter(n=>names.filter(x=>x===n).length>1))]};
}
export function holds(c,P){const a=P[c.a],b=P[c.b];if(!a||!b)return false;
 const dx=b.pos_xy_mm[0]-a.pos_xy_mm[0],dy=b.pos_xy_mm[1]-a.pos_xy_mm[1],distance=Math.hypot(dx,dy);
 if(c.tur==='yakin')return distance<=c.mm;
 if(c.tur==='uzak')return distance>=c.mm;
 if(c.tur==='bakar'){const t=a.rot_deg*Math.PI/180;return distance>0&&(Math.sin(t)*dx-Math.cos(t)*dy)/distance>Math.cos(Math.PI/6);}
 return false;
}
export function derive(parsed){
 const out=[],{items,positions:P}=parsed,ids=items.filter(e=>P[e.id]);
 for(const a of ids)for(const b of ids){if(a.id===b.id)continue;
  if(['sofa','loveseat','armchair','reading'].includes(a.tur)&&['tvunit','coffee'].includes(b.tur)){
   const c={tur:'bakar',a:a.id,b:b.id};if(holds(c,P))out.push(c);
  }
 }
 // Quantize the observed centre distance outward; never invent a relation the source does not satisfy.
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const a=ids[i],b=ids[j],distance=Math.hypot(...P[a.id].pos_xy_mm.map((v,k)=>v-P[b.id].pos_xy_mm[k]));
  if(distance>0&&distance<=2500)out.push({tur:'yakin',a:a.id,b:b.id,mm:Math.ceil(distance/100)*100});
  else if(distance>=3000)out.push({tur:'uzak',a:a.id,b:b.id,mm:Math.floor(distance/100)*100});
 }
 return out.slice(0,4);
}
export function checkReplay(parsed,constraints,positive,result){
 const {state,rapor}=result,fit=rapor.olcum?.yerlesim?.sigdi;
 if(rapor.red.length)return 'motor_rejected';
 if(fit!==positive)return 'outcome_changed';
 if(positive){
  if(rapor.uyari.length)return 'motor_warning';
  const placements=state.plan.items.filter(e=>e.space_id==='room'),P=Object.fromEntries(placements.map(p=>[p.id,p]));
  if(placements.length!==parsed.items.length||new Set(placements.map(p=>p.id)).size!==parsed.items.length)return 'piece_count';
  for(const e of parsed.items){const p=P[e.id];if(!p||p.size_mm.w!==e.en||p.size_mm.d!==e.derinlik||p.size_mm.h!==e.yukseklik)return 'dimensions_changed';}
  if(!constraints.every(c=>holds(c,P)))return 'constraint_mismatch';
 } else if(!rapor.uyari.length||rapor.uyari.some(w=>w.kod!=='sigmiyor'))return 'unexpected_failure';
 return null;
}
export function convert(source,engine=uygula){
 let parsed;try{parsed=parseSource(source);}catch(e){return {id:source.id,status:'excluded',reason:e.message};}
 const constraints=source.ok?derive(parsed):[];
 const attempt={katman:'yerlesim',type:'yerlestir',oda:'room',esyalar:parsed.items,kisitlar:constraints};
 const result=engine(parsed.state,[attempt]),reason=checkReplay(parsed,constraints,source.ok,result);
 if(reason)return {id:source.id,status:'excluded',reason};
 const seed=parseInt(sha(source.id).slice(0,8),16),lang=LANGS[seed%LANGS.length],D=diller[lang];
 const text=D.istek[Math.floor(seed/LANGS.length)%D.istek.length],reply=source.ok?D.evet:D.hayir;
 const input={oda:parsed.room,duvarlar:parsed.state.plan.walls,acikliklar:parsed.state.plan.openings,esyalar:parsed.items,istek:text,kisitlar:constraints};
 const row={id:'h4-'+source.id,dil:lang,grup:`ProcTHOR-10K:${source.source.split}:house:${source.source.house}`,
  kaynak:{...source.source,kayit:source.id,source_row_sha256:sha(JSON.stringify(source)),original_producer:'Claude',transformation_producer:'Codex',procedural_geometry:true},
  durum:parsed.state,mesajlar:[{rol:'user',metin:JSON.stringify(input)},{rol:'assistant',metin:reply}],islemler:source.ok?[attempt]:[],
  expected:{fit:source.ok,classification:source.ok?'placement':'bounded_search_no_solution',constraints,automatic_resize:false},
  review:{producer:'Codex',required_reviewer:'Claude',status:'quarantine',native_language_approved:false,training_eligible:false},
  motor:{report:result.rapor,attempt,source_constraints_hold:constraints.every(c=>holds(c,parsed.positions)),
   unique_source_positions:Object.keys(parsed.positions).length,ambiguous_source_names:parsed.ambiguous_names,
   claim:source.ok?'Fresh engine result satisfies every derived relation and exact size':'Current bounded solver found no layout; not a proof of physical impossibility'}};
 return {id:source.id,status:'accepted',row};
}
