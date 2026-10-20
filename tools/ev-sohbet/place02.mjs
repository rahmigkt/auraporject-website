// Calls the UNMODIFIED browser solver. All positions come from its result.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {solveRoom, RULES} from '../../assets/ev/yerlesim.js';
import {compileItem,footprint} from '../../assets/ev/items.js';
import {normalizeDesign} from '../../assets/forma/generate.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'knowledge/ai-egitim/veri/ev-sohbet-02');
const solverHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/ev/yerlesim.js'))).digest('hex');
const names={tr:{sofa:'Kanepe',coffee:'Sehpa',bed:'Yatak',wardrobe:'Dolap',run:'Mutfak',basin:'Lavabo dolabı',desk:'Çalışma masası',dining:'Yemek masası'},nl:{sofa:'Bank',coffee:'Salontafel',bed:'Bed',wardrobe:'Kast',run:'Keukenblok',basin:'Wastafelmeubel',desk:'Bureau',dining:'Eettafel'},fr:{sofa:'Canapé',coffee:'Table basse',bed:'Lit',wardrobe:'Armoire',run:'Meuble de cuisine',basin:'Meuble vasque',desk:'Bureau',dining:'Table à manger'},de:{sofa:'Sofa',coffee:'Couchtisch',bed:'Bett',wardrobe:'Schrank',run:'Küchenzeile',basin:'Waschtisch',desk:'Schreibtisch',dining:'Esstisch'}};
names.en={sofa:'Sofa',coffee:'Coffee table',bed:'Bed',wardrobe:'Wardrobe',run:'Kitchen run',basin:'Vanity',desk:'Desk',dining:'Dining table'};
names.da={sofa:'Sofa',coffee:'Sofabord',bed:'Seng',wardrobe:'Garderobeskab',run:'Køkkenelement',basin:'Vaskeskab',desk:'Skrivebord',dining:'Spisebord'};
names.es={sofa:'Sofá',coffee:'Mesa de centro',bed:'Cama',wardrobe:'Armario',run:'Mueble de cocina',basin:'Mueble de lavabo',desk:'Escritorio',dining:'Mesa de comedor'};
names.it={sofa:'Divano',coffee:'Tavolino',bed:'Letto',wardrobe:'Armadio',run:'Mobile cucina',basin:'Mobile lavabo',desk:'Scrivania',dining:'Tavolo da pranzo'};
function product(kind,room,index,lang){
 let family=['sofa'].includes(kind)?'seating':['bed'].includes(kind)?'bedroom':['wardrobe'].includes(kind)?'storage':kind==='run'?'kitchen':kind==='basin'?'bath':'table';
 let params=kind==='sofa'?{width:1800+(index%3)*100,depth:820,height:800,armWidth:100}:kind==='coffee'?{length:900,width:550,height:380}:kind==='desk'?{length:1000,width:550,height:740}:kind==='dining'?{length:1200,width:800,height:750}:kind==='wardrobe'?{width:1200,depth:580,height:2000}:kind==='run'?{modules:[{type:'sink',w:600},{type:'hob',w:600}],topDepth:600}:kind==='basin'?{width:600,depth:450,height:850}:{mattressWidth:index%2?1400:900,mattressLength:2000,headboardHeight:1000};
 let design=kind==='bed'?{schema:'aura.forma.design/1',family,kind,style:'japandi',seed:index+1,params,materials:{}}:normalizeDesign({family,kind,style:'japandi',seed:index+1,params});
 return {id:room+'-'+kind,space_id:room,name:names[lang][kind],decision:kind==='bed'?'reference':'new',catalog_status:kind==='bed'?'legacy_bed_compiler_size_reference_not_current_AURA_offer':'current_studio_family',design};
}
function adapter(plan){
 const walls=plan.walls.map(w=>{const [x0,y0]=w.from_xy_mm,[x1,y1]=w.to_xy_mm,L=Math.hypot(x1-x0,y1-y0);return {...w,x0,y0,ux:(x1-x0)/L,uy:(y1-y0)/L,L,t:w.thickness.value};});
 // Preserve a full aperture for swing tests when the display axes are noded.
 const groups=new Map();for(const o of plan.openings)if(!groups.has(o.source_opening_id))groups.set(o.source_opening_id,o);
 const ops=[];for(const [id,o] of groups){const [a,b]=o.full_opening_span_xy_mm,L=Math.hypot(b[0]-a[0],b[1]-a[1]),wid='layout-'+id,t=plan.walls.find(w=>w.id===o.wall_id)?.thickness.value||120;walls.push({id:wid,level_id:o.level_id,x0:a[0],y0:a[1],ux:(b[0]-a[0])/L,uy:(b[1]-a[1])/L,L,t});ops.push({...o,id,wall_id:wid,a:0,w:L,h:o.height.value,sill:o.sill_height.value});}
 return {walls,ops};
}
for(const name of fs.readdirSync(dir).filter(n=>/^ev-sohbet-(?:02|uk-ie|dk|es|it)-\d+\.json$/.test(n)).sort()){
 const file=path.join(dir,name),rec=JSON.parse(fs.readFileSync(file,'utf8')),plan=rec.plan;plan.items=[];rec.layout_requests=[];rec.layout_results=[];
 let bedIndex=0;
 for(const space of plan.spaces){
  const caseNo=Number(rec.id.slice(-2));
  let kinds=space.kind==='living'?['sofa','coffee']:space.kind==='bedroom'?['bed','wardrobe']:space.kind==='kitchen'&&[11,15,16,19].includes(caseNo)?['run']:space.kind==='bath'&&caseNo===15?['basin']:space.kind==='study'?['desk']:[];
  if(!kinds.length)continue;
  const index=space.kind==='bedroom'?++bedIndex:Number(rec.id.slice(-2));
  const items=kinds.map(k=>product(k,space.id,index,rec.language));
  for(const it of items)if(it.design.kind==='bed'&&[900,1400].includes(space.requested_mattress_width_mm))it.design.params.mattressWidth=space.requested_mattress_width_mm;
  const ev=adapter(plan);ev.walls=ev.walls.filter(w=>w.level_id===space.level_id);ev.ops=ev.ops.filter(o=>o.level_id===space.level_id);
  let result=solveRoom(space,items,ev,{count:1,beam:6});
  const attempts=[{items:structuredClone(items),result}];
  if(!result.ok && items.length>1){items.pop();result=solveRoom(space,items,ev,{count:1,beam:6});attempts.push({items:structuredClone(items),result});}
  rec.layout_requests.push({space_id:space.id,attempts,requires_user_acceptance_of_reduced_set:attempts.length>1});
  if(result.ok){
   for(const it of items){const placed=result.alternatives[0].placements.find(p=>p.id===it.id);const out={...it,...placed};out.compiled_size_mm=compileItem(out).size;out.footprint_xy_mm=footprint(out);plan.items.push(out);}
  }
  rec.layout_results.push({space_id:space.id,ok:result.ok,failed:result.failed||null,items_placed:result.ok?items.map(i=>i.id):[],score:result.ok?result.alternatives[0].score:null});
 }
 rec.solver={module:'assets/ev/yerlesim.js',sha256:solverHash,options:{count:1,beam:6},rules: RULES,manual_item_coordinates:false};
 fs.writeFileSync(file,JSON.stringify(rec,null,2)+'\n');
 console.log(name,plan.items.length,'placed;',rec.layout_requests.filter(r=>r.attempts.some(a=>!a.result.ok)).length,'rooms with no-fit attempts');
}
