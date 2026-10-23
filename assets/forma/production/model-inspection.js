import {normalizeDesign,compileDesign} from '../generate.js';
import {partDimensions} from '../part-dimensions.js';
import {engineeringReview,inspectionKey} from './engineering-checks.js';
export function modelInspection(item){
 const design=normalizeDesign(structuredClone(item.design)),compiled=compileDesign(design),dimensions=partDimensions(compiled);
 let review=null,error=null;try{review=engineeringReview(design,compiled);}catch(e){error=String(e.message||e);}
 return {id:item.id,name:item.name||design.kind,quantity:item.qty??1,design,compiled,dimensions,review,error,input:inspectionKey(design),production_approved:false};
}
export function inspectionItems(items){
 if(!Array.isArray(items)||!items.length)throw Error('İncelenecek tasarım bulunamadı.');
 return items.map((item,i)=>{if(!item?.design||!Number.isInteger(item.qty??1)||(item.qty??1)<1)throw Error('Tasarım veya ürün adedi geçersiz.');return {...structuredClone(item),id:item.id??'MODEL-'+i};});
}
export const ROLE_NAMES={side:'Yan panel',top:'Üst tabla',bottom:'Alt tabla',divider:'Dikme',back:'Arkalık',door:'Kapak','glass-door':'Cam kapak',front:'Cephe','inner-front':'İç çekmece cephesi','drawer-front':'Çekmece cephesi','box-bottom':'Çekmece tabanı','box-side':'Çekmece yanı','box-end':'Çekmece kutu önü/arkası',runner:'Ray',hinge:'Menteşe',pull:'Kulp',spacer:'Takoz',shelf:'Raf','shelf-fixed':'Sabit raf','shelf-pin':'Raf pimi','seat-cushion':'Oturma minderi','back-cushion':'Sırt minderi','seat-deck':'Oturma gövdesi','base-rail':'İskelet kaydı','arm-top':'Kolçak üstü','tuft-button':'Kapitoneli düğme grubu','tuft-seam':'Kapitoneli dikiş','glass':'Cam','front-frame':'Kapak çerçevesi','headboard':'Başlık','slat':'Lata','worktop':'Tezgah','column':'Sütun','foot':'Taban','mirror':'Ayna','anti_tip_wall_and_module_interface':'Duvar / modül sabitleme arayüzü',rail:'Askılık',plinth:'Kaide','plinth-end':'Kaide ucu',leg:'Ayak',seat:'Oturma',cushion:'Minder',arm:'Kolçak',frame:'İskelet',apron:'Kuşak',stretcher:'Kayıt',slat:'Lata'};
export const OP_NAMES={rastex_cam_bore:'Rastex eksantrik yuvası',rastex_edge_bore:'Rastex kenar deliği',rastex_dowel_pilot:'Rastex bağlantı pilotu',back_groove_candidate:'Arkalık kanalı · deneme',hinge_cup_bore:'Menteşe tas yuvası',hinge_inserta_bore:'Menteşe sabitleme deliği',hinge_plate_expando_bore:'Menteşe taban deliği',hinge_spacer_relief:'Menteşe erişim boşaltması · deneme',runner_cabinet_pilot:'Ray gövde pilotu',runner_drawer_pilot:'Ray çekmece pilotu',shelf_support_bore:'Raf desteği deliği',rail_top_through_bore:'Askılık geçiş deliği',assembly_countersink:'Bağlantı havşası · deneme',module_joining_bore:'Modül bağlantı deliği'};
export const roleName=s=>ROLE_NAMES[s]||s||'Belirlenmedi';
export const operationName=s=>OP_NAMES[s]||s||'Belirlenmedi';
export function displayParts(compiled,{inside=false,only=null,separation=0}={}){
 if(!Number.isFinite(separation)||separation<0||separation>1)throw Error('Geçersiz ayırma değeri.');
 const rows=compiled.parts.filter(q=>!q.planOnly),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const q of rows)for(let k=0;k<3;k++){const v=q.pos?.[k]??0;lo[k]=Math.min(lo[k],v);hi[k]=Math.max(hi[k],v);}
 const center=lo.map((v,k)=>Number.isFinite(v)?(v+hi[k])/2:0);
 return rows.filter(q=>(!only||q.id===only)&&(!inside||!['front','fabric','welt'].includes(q.mat)&&!['hinge','pull'].includes(q.role))).map(q=>({...q,pos:(q.pos||[0,0,0]).map((v,k)=>v+(v-center[k])*separation)}));
}
