import {componentDimensions} from './component-dimensions.js';
// AURA Ritmo 01. Reference-led construction, not recovered manufacturing data.
import {drawerFit} from './vendor/woodworkingshop/drawer-fit.js?v=20261016n';
export const FINISHES={oxblood:{name:'Oksit kırmızısı',en:'Oxide red',hex:'#9e241d'},sand:{name:'Kum',en:'Sand',hex:'#d3c7b0'},olive:{name:'Zeytin',en:'Olive',hex:'#686d51'},graphite:{name:'Grafit',en:'Graphite',hex:'#343c3c'},clay:{name:'Kil',en:'Clay',hex:'#b97959'},ivory:{name:'Kırık beyaz',en:'Ivory',hex:'#e6e2d6'}};
const clamp=(v,lo,hi,d)=>typeof v==='number'&&Number.isFinite(v)?Math.max(lo,Math.min(hi,Math.round(v))):d;
export function initialRitmo(){return {version:1,width:2400,height:2300,depth:380,thickness:22,wood:'walnut',handle:'bar',columns:[
 {id:'bay-a',weight:1,sections:[{id:'a1',weight:1.5,type:'doors',color:'oxblood'},{id:'a2',weight:1,type:'open'},{id:'a3',weight:1,type:'open'},{id:'a4',weight:1,type:'open'},{id:'a5',weight:1,type:'open'}]},
 {id:'bay-b',weight:1,sections:[1,2,3,4,5].map(n=>({id:'b'+n,weight:1,type:'open'}))},
 {id:'bay-c',weight:1,sections:[{id:'c1',weight:1.3,type:'drawers',color:'oxblood'},{id:'c2',weight:1,type:'open'},{id:'c3',weight:1,type:'open'},{id:'c4',weight:1.7,type:'doors',color:'oxblood'}]}
 ]};}
export function normalizeRitmo(raw={}){const d=initialRitmo(),r={version:1,width:clamp(raw.width,1200,3600,d.width),height:clamp(raw.height,1400,2700,d.height),depth:clamp(raw.depth,330,650,d.depth),thickness:[18,22,25].includes(raw.thickness)?raw.thickness:22,wood:['oak','walnut','dark'].includes(raw.wood)?raw.wood:d.wood,handle:['bar','knob','push'].includes(raw.handle)?raw.handle:'bar'};const ids=new Set();const safe=(id,fallback)=>{const value=typeof id==='string'&&/^[a-z0-9-]{1,40}$/.test(id)&&!ids.has(id)?id:fallback;let result=value;let suffix=1;while(ids.has(result))result=fallback+'-'+suffix++;ids.add(result);return result;};r.columns=(Array.isArray(raw.columns)&&raw.columns.length>=2&&raw.columns.length<=5?raw.columns:d.columns).map((col,i)=>({id:safe(col?.id,'bay-'+i),weight:clamp(col?.weight*100,50,170,100)/100,sections:(Array.isArray(col?.sections)&&col.sections.length>=2&&col.sections.length<=7?col.sections:d.columns[1].sections).map((s,j)=>({id:safe(s?.id,'cell-'+i+'-'+j),weight:clamp(s?.weight*100,50,200,100)/100,type:['open','doors','drawers'].includes(s?.type)?s.type:'open',color:Object.hasOwn(FINISHES,s?.color)?s.color:'oxblood'}))}));return r;}
export function compileRitmo(raw={},view={}){
 const config=normalizeRitmo(raw);config.width=Math.max(config.width,280*config.columns.length+config.thickness*(config.columns.length+1));config.height=Math.max(config.height,60+2*config.thickness+Math.max(...config.columns.map(c=>180*c.sections.length+config.thickness*(c.sections.length-1))));const {width:W,height:H,depth:D,thickness:T}=config,B=6,P=60,reveal=2,parts=[],cells=[],bays=[],warnings=[];
 const make=(uid,role,pos,size,material='wood',extra={})=>{if(size.some(n=>n<=0||!Number.isFinite(n)))throw Error('Invalid component '+uid);parts.push({uid,role,position:pos.map(n=>n/1000),size:size.map(n=>n/1000),material,shape:material==='metal'?'box':'panel',edgeRadius:.0012,...extra});};
 const overallInner=W-T*(config.columns.length+1),weights=config.columns.reduce((a,c)=>a+c.weight,0);let x=-W/2;
 make('side-left','side',[x+T/2,(P+H)/2,0],[T,H-P,D],'wood',{grain:'vertical'});x+=T;
 make('top','top',[0,H-T/2,0],[W-2*T,T,D],'wood',{grain:'horizontal'});
 make('bottom','bottom',[0,P+T/2,0],[W-2*T,T,D],'wood',{grain:'horizontal'});
 make('plinth-front','plinth',[0,P/2,D/2-65],[W-80,P,18]);
 make('plinth-rear','plinth',[0,P/2,-D/2+45],[W-80,P,18]);
 const availH=H-P-2*T;
 for(let ci=0;ci<config.columns.length;ci++){
  const col=config.columns[ci],cw=280+(overallInner-280*config.columns.length)*col.weight/weights,cx=x+cw/2,usableH=availH-T*(col.sections.length-1),total=col.sections.reduce((a,c)=>a+c.weight,0);let y=P+T;
  bays.push({id:col.id,index:ci,widthMm:Math.round(cw),xMm:cx});
  make(col.id+'-back','back',[cx,(P+T+H-T)/2,-D/2+B/2],[cw,availH,B],'wood',{grain:'vertical',bayId:col.id});
  if(cw>700)warnings.push({id:'span-'+col.id,message:'Raf açıklığı '+Math.round(cw)+' mm: taşıyıcı takviye ve sehim hesabı gerekli.'});
  for(let si=0;si<col.sections.length;si++){
   const section=col.sections[si],ch=180+(usableH-180*col.sections.length)*section.weight/total,cy=y+ch/2,cell={id:section.id,bayId:col.id,column:ci,index:si,x:cx/1000,y:cy/1000,width:cw/1000,height:ch/1000,bottom:y/1000,top:(y+ch)/1000,type:section.type,color:section.color};cells.push(cell);
   const attrs={cellId:section.id,bayId:col.id},color=FINISHES[section.color].hex;
   if(section.type==='doors'){
    const count=cw>550?2:1,lw=(cw-reveal*(count+1))/count,lh=ch-2*reveal,z=D/2-9;
    for(let n=0;n<count;n++){
     const sign=n===0?-1:1,centre=cx-cw/2+reveal+lw/2+n*(lw+reveal),hinge=centre+sign*lw/2,angle=view.open?sign*1.16:0,px=hinge-sign*lw/2*Math.cos(angle),pz=z+sign*lw/2*Math.sin(angle);
     const transform=(dx,dz)=>[px+dx*Math.cos(angle)+dz*Math.sin(angle),cy,pz-dx*Math.sin(angle)+dz*Math.cos(angle)];
     make(section.id+'-door-'+n,'door',[px,cy,pz],[lw,lh,18],'lacquer',{...attrs,color,finishName:FINISHES[section.color].name,finishEn:FINISHES[section.color].en,rotation:[0,angle,0]});
     if(config.handle!=='push'){const hp=transform(-sign*(lw/2-35),15);hp[1]=cy-lh/2+55;make(section.id+'-handle-'+n,'handle',hp,config.handle==='bar'?[110,8,14]:[18,18,18],'metal',{...attrs,rotation:[0,angle,0],color:'#b9b6ac'});}
     for(const hy of [y+65,y+ch-65])make(section.id+'-hinge-'+n+'-'+Math.round(hy),'hinge',[hinge,hy,D/2-15],[28,36,4],'metal',{...attrs,internal:true});
    }
   }
   if(section.type==='drawers'){
    if(ch<300)warnings.push({id:'drawer-'+section.id,message:'Çekmece bölmesi '+Math.round(ch)+' mm: iki çekmece için yükseklik gözden geçirilmeli.'});
    const dh=(ch-3*reveal)/2,fit=drawerFit({openingWidthMm:cw,openingHeightMm:dh,openingDepthMm:D-B-22}),bw=fit.widthMm,bh=fit.heightMm,bd=fit.depthMm;
    for(let n=0;n<2;n++){
     const dy=y+reveal+dh/2+n*(dh+reveal),ext=view.open?D*.48:0,z=D/2-9+ext,cz=D/2-25-bd/2+ext;
     make(section.id+'-front-'+n,'drawer-front',[cx,dy,z],[cw-2*reveal,dh,18],'lacquer',{...attrs,color,finishName:FINISHES[section.color].name,finishEn:FINISHES[section.color].en});
     if(config.handle!=='push')make(section.id+'-pull-'+n,'handle',[cx,dy+dh/2-45,z+15],config.handle==='bar'?[110,8,14]:[18,18,18],'metal',attrs);
     for(const side of [-1,1]){make(section.id+'-box-side-'+n+'-'+side,'drawer-box-side',[cx+side*(bw-12)/2,dy,cz],[12,bh,bd],'wood',{...attrs,internal:!view.open});make(section.id+'-box-end-'+n+'-'+side,'drawer-box-end',[cx,dy,cz+side*(bd-12)/2],[bw-24,bh,12],'wood',{...attrs,internal:!view.open});}
     make(section.id+'-box-bottom-'+n,'drawer-box-bottom',[cx,dy-bh/2+3,cz],[bw-24,6,bd-24],'wood',{...attrs,internal:!view.open});
    }
   }
   y+=ch;if(si<col.sections.length-1){make(section.id+'-shelf','shelf',[cx,y+T/2,(B+2)/2],[cw,T,D-B-2],'wood',{...attrs,grain:'horizontal'});y+=T;}
  }
  x+=cw;if(ci<config.columns.length-1){make(col.id+'-divider','divider',[x+T/2,(P+T+H-T)/2,0],[T,availH,D],'wood',{grain:'vertical',bayId:col.id});x+=T;}
 }
 make('side-right','side',[W/2-T/2,(P+H)/2,0],[T,H-P,D],'wood',{grain:'vertical'});
 warnings.unshift({id:'anchor',message:'Yüksek mobilya için duvar sabitlemesi, bağlantı elemanları ve yük/sehim hesabı tasarımcı tarafından doğrulanmalı.'});
 const minZ=Math.min(...parts.map(p=>p.position[2]-p.size[2]/2)),maxZ=Math.max(...parts.map(p=>p.position[2]+p.size[2]/2)),centreZ=(minZ+maxZ)/2;for(const p of parts)p.position[2]-=centreZ;const depth=maxZ-minZ;
 return {engine:'aura-ritmo-v1',state:{family:'shelf',width:W/10,height:H/10,depth:Math.round(depth*1000)/10,wood:config.wood,fabric:'linen',pattern:'none',weave:'plain'},config,width:W/1000,height:H/1000,depth,parts,cells,bays,warnings,classification:{name:'AURA Ritmo 01',style:'Çağdaş modüler',category:'Kitaplık ve depolama',referenceDimensions:'assumed-not-measured'}};
}
export function ritmoProject(config){const m=compileRitmo(config);return {format:'aura-guided-design',version:1,engine:'aura-ritmo-v1',createdAt:new Date().toISOString(),language:'tr',design:m.config,parts:m.parts,units:{design_dimensions:'mm',part_size:'m',part_position:'m'},component_dimensions:componentDimensions(m),stage:'concept',dimensionsStatus:'customer-entered-or-assumed-unverified',materialsRepresentative:true,designerReviewRequired:true,paymentStatus:'not_collected',submitted:false};}
