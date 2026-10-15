import {compileDesign,normalizeDesign,WOODS,FABRICS} from './furniture-model.js';
export {WOODS,FABRICS};
export const LANGUAGES={tr:'Türkçe',en:'English',fr:'Français',da:'Dansk',de:'Deutsch',nl:'Nederlands',es:'Español',it:'Italiano'};
const names=(tr,en,fr,da,de,nl,es,it)=>({tr,en,fr,da,de,nl,es,it});
export const FAMILIES={
 console:{names:names('Konsol','Sideboard','Buffet','Skænk','Sideboard','Dressoir','Aparador','Credenza'),size:[160,80,42]},
 sofa:{names:names('Koltuk','Sofa','Canapé','Sofa','Sofa','Bank','Sofá','Divano'),size:[210,85,90],upholstered:true},
 armchair:{names:names('Berjer','Armchair','Fauteuil','Lænestol','Sessel','Fauteuil','Sillón','Poltrona'),size:[85,90,85],upholstered:true},
 chair:{names:names('Sandalye','Chair','Chaise','Stol','Stuhl','Stoel','Silla','Sedia'),size:[50,85,52],upholstered:true},
 bench:{names:names('Döşemeli bank','Bench','Banc','Bænk','Sitzbank','Zitbank','Banco','Panca'),size:[140,46,45],upholstered:true},
 table:{names:names('Yemek masası','Dining table','Table à manger','Spisebord','Esstisch','Eettafel','Mesa de comedor','Tavolo da pranzo'),size:[180,75,90]},
 coffee:{names:names('Orta sehpa','Coffee table','Table basse','Sofabord','Couchtisch','Salontafel','Mesa de centro','Tavolino'),size:[110,40,60]},
 desk:{names:names('Çalışma masası','Desk','Bureau','Skrivebord','Schreibtisch','Bureau','Escritorio','Scrivania'),size:[140,75,65]},
 shelf:{names:names('Kitaplık','Bookcase','Bibliothèque','Reol','Bücherregal','Boekenkast','Estantería','Libreria'),size:[120,180,32]},
 wardrobe:{names:names('Gardırop','Wardrobe','Armoire','Garderobeskab','Kleiderschrank','Kledingkast','Armario','Armadio'),size:[180,210,60]},
 dresser:{names:names('Şifonyer','Chest of drawers','Commode','Kommode','Kommode','Ladekast','Cómoda','Cassettiera'),size:[100,90,45]},
 nightstand:{names:names('Komodin','Bedside table','Table de chevet','Sengebord','Nachttisch','Nachtkastje','Mesita de noche','Comodino'),size:[50,55,40]},
 tv:{names:names('TV ünitesi','TV unit','Meuble TV','TV-bord','TV-Möbel','TV-meubel','Mueble TV','Mobile TV'),size:[180,55,40]},
 bed:{names:names('Yatak','Bed','Lit','Seng','Bett','Bed','Cama','Letto'),size:[170,100,215],upholstered:true}
};
// Owned vector illustrations and bounded procedural geometry. Not supplier products.
export const DETAILS={
 straight:{field:'legs',names:names('Düz ayak','Straight legs','Pieds droits','Lige ben','Gerade Beine','Rechte poten','Patas rectas','Gambe dritte'),sketch:'M35 15h8v63h-8zM77 15h8v63h-8z'},
 tapered:{field:'legs',names:names('Konik ayak','Tapered legs','Pieds fuselés','Koniske ben','Konische Beine','Taps toelopende poten','Patas cónicas','Gambe affusolate'),sketch:'M31 15h17l-6 63h-5zM72 15h17l-6 63h-5z'},
 sled:{field:'legs',names:names('Kızak ayak','Sled base','Piètement traîneau','Medestel','Kufengestell','Sledeframe','Base de patín','Base a slitta'),sketch:'M29 15v61h62V15M35 15v55h50V15'},
 plinth:{field:'legs',names:names('Gizli baza','Recessed plinth','Socle en retrait','Tilbagetrukket sokkel','Zurückgesetzter Sockel','Terugliggende plint','Zócalo retranqueado','Zoccolo rientrante'),sketch:'M15 27h90v30H15zM27 57h66v17H27z'},
 square:{field:'arms',names:names('Düz kolçak','Square arms','Accoudoirs droits','Lige armlæn','Gerade Armlehnen','Rechte armleuningen','Brazos rectos','Braccioli dritti'),sketch:'M15 28h18v45H15zM87 28h18v45H87zM33 52h54v21H33z'},
 rolled:{field:'arms',names:names('Yuvarlak kolçak','Rolled arms','Accoudoirs arrondis','Runde armlæn','Runde Armlehnen','Ronde armleuningen','Brazos redondeados','Braccioli arrotondati'),sketch:'M33 37a13 13 0 1 0-20 10v26h20zM87 37a13 13 0 1 1 20 10v26H87zM33 52h54v21H33z'},
 none:{field:'arms',names:names('Kolçaksız','Armless','Sans accoudoirs','Uden armlæn','Ohne Armlehnen','Zonder armleuningen','Sin brazos','Senza braccioli'),sketch:'M20 45h80v22H20zM28 67v12M92 67v12'},
 split:{field:'cushions',names:names('Ayrı minder','Separate cushions','Coussins séparés','Separate hynder','Getrennte Kissen','Losse kussens','Cojines separados','Cuscini separati'),sketch:'M15 30h43v35H15zM62 30h43v35H62z'},
 single:{field:'cushions',names:names('Tek minder','Single cushion','Coussin unique','Én hynde','Durchgehendes Kissen','Eén kussen','Cojín único','Cuscino unico'),sketch:'M15 30h90v35H15z'},
 open:{field:'front',names:names('Açık raf','Open shelves','Étagères ouvertes','Åbne hylder','Offene Fächer','Open planken','Estantes abiertos','Ripiani aperti'),sketch:'M18 15h84v65H18zM18 47h84M60 15v65'},
 closed:{field:'front',names:names('Kapaklı','With doors','Avec portes','Med låger','Mit Türen','Met deuren','Con puertas','Con ante'),sketch:'M18 15h84v65H18zM60 15v65M53 42v10M67 42v10'}
};
export const label=(obj,language)=>obj.names?.[language]||obj[language]||obj.names?.en||obj.en;
export function illustration(path){return `<svg viewBox="0 0 120 90" fill="none" aria-hidden="true"><path d="${path}" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>`;}
const has=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
export function normalizeStudio(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))raw={};
 const family=has(FAMILIES,raw.family)?raw.family:'sofa',d=FAMILIES[family].size;
 const r={version:2,family};
 for(const [i,k] of ['width','height','depth'].entries())r[k]=typeof raw[k]==='number'&&Number.isFinite(raw[k])?Math.round(Math.min(k==='height'?260:350,Math.max(k==='height'?(family==='bed'?60:30):25,raw[k]))):d[i];
 for(const [k,choices,fallback] of [['legs',['straight','tapered','sled','plinth'],'tapered'],['arms',['square','rolled','none'],'square'],['cushions',['single','split'],'split'],['front',['open','closed'],'closed'],['wood',Object.keys(WOODS),'walnut'],['fabric',Object.keys(FABRICS),'linen']])r[k]=choices.includes(raw[k])?raw[k]:fallback;
 r.columns=Number.isInteger(raw.columns)?Math.min(4,Math.max(2,raw.columns)):3;
 r.rows=Number.isInteger(raw.rows)?Math.min(6,Math.max(1,raw.rows)):family==='shelf'?4:1;
 if(['console','shelf'].includes(family)){const n=normalizeDesign({...r,model:family});for(const k of ['width','height','depth','columns','rows','front'])r[k]=n[k];}
 return r;
}
export function changeFamily(raw,family){return normalizeStudio({...raw,family,...Object.fromEntries(['width','height','depth'].map((k,i)=>[k,FAMILIES[family].size[i]]))});}
export function compileStudio(raw){
 const s=normalizeStudio(raw);
 if(['console','shelf'].includes(s.family)){const result=compileDesign({...s,model:s.family});if(s.family==='console'){
   result.parts=result.parts.filter(p=>p.role!=='leg');const w=result.width,d=result.depth,h=.16,t=.045;
   const add=(role,position,size,material='wood',shape='box')=>result.parts.push({role,position,size,material,shape});
   if(s.legs==='plinth')add('plinth',[0,h/2,0],[w*.82,h,d*.75]);
   else if(s.legs==='sled')for(const sign of [-1,1]){const x=sign*(w/2-.1);add('sled-base',[x,t/2,0],[t,t,d-.12],'metal');for(const z of [-1,1])add('sled-upright',[x,h/2,z*(d/2-.08)],[t,h,t],'metal');}
   else for(const x of [-1,1])for(const z of [-1,1])add('leg',[x*(w/2-.1),h/2,z*(d/2-.08)],[t,h,t],'wood',s.legs==='tapered'?'tapered':'box');
  }return {...result,state:{...s,width:result.state.width,height:result.state.height,depth:result.state.depth}};}
 const W=s.width/100,H=s.height/100,D=s.depth/100,parts=[];
 const box=(role,x,y,z,w,h,d,material='wood',shape='box',rotation=null)=>parts.push({role,position:[x,y,z],size:[w,h,d],material,shape,...(rotation?{rotation}:{})});
 function legs(top){const thick=Math.min(W,D)*.075,offset=thick*1.2;
  if(s.legs==='plinth')box('plinth',0,top/2,0,W*.82,top,D*.78);
  else if(s.legs==='sled'){for(const sign of [-1,1]){const x=sign*(W/2-offset);box('sled-base',x,thick/2,0,thick,thick,D*.85,'metal');for(const z of [-1,1])box('sled-upright',x,top/2,z*(D*.425-thick/2),thick,top,thick,'metal');}}
  else for(const x of [-1,1])for(const z of [-1,1])box('leg',x*(W/2-offset),top/2,z*(D/2-offset),thick,top,thick,'wood',s.legs==='tapered'?'tapered':'box');
 }
 if(['table','coffee','desk'].includes(s.family)){const t=Math.min(.045,H*.12);legs(H-t);box('top',0,H-t/2,0,W,t,D);}
 else if(['sofa','armchair','chair','bench'].includes(s.family)){
  const isBench=s.family==='bench',seatY=isBench?H*.82:Math.min(.45,H*.55),cushion=Math.min(.13,H*.15),base=.06,legTop=Math.max(.08,seatY-cushion-base);
  legs(legTop);box('seat-frame',0,legTop+base/2,0,W,base,D);
  const armW=Math.min(.16,W*.12),hasArms=!isBench&&s.family!=='chair'&&s.arms!=='none',inner=W-(hasArms?2*armW:0),backD=Math.min(.16,D*.2),usableD=D-(isBench?0:backD);
  const count=s.cushions==='split'&&s.family==='sofa'?3:1;
  for(let i=0;i<count;i++)box('seat-cushion',-inner/2+(i+.5)*inner/count,seatY-cushion/2,isBench?0:backD/2,inner/count-.008,cushion,usableD-.012,'fabric');
  if(!isBench){box('back',0,(H+seatY)/2,-D/2+backD/2,W,H-seatY,backD,'fabric');
   if(hasArms)for(const sign of [-1,1]){const armH=(H-seatY)*.55;const baseArmH=s.arms==='rolled'?Math.max(.02,armH-armW/2):armH;box('arm',sign*(W/2-armW/2),seatY+baseArmH/2,0,armW,baseArmH,D,'fabric');if(s.arms==='rolled')box('arm-roll',sign*(W/2-armW/2),seatY+armH-armW/2,0,armW,D,armW,'fabric','round',[Math.PI/2,0,0]);}}
 }else if(s.family==='bed'){
  legs(.14);box('bed-frame',0,.23,.035,W,.18,D-.07);box('mattress',0,.41,.035,W-.06,.18,D-.13,'fabric');box('headboard',0,H/2,-D/2+.035,W,H,.07,'fabric');
 }else{
  const lift=s.family==='wardrobe'?.06:.14,t=.022,body=H-lift,cols=s.family==='nightstand'?1:s.columns;
  legs(lift);box('top',0,H-t/2,0,W,t,D);box('bottom',0,lift+t/2,0,W,t,D);
  for(const sign of [-1,1])box('side',sign*(W-t)/2,lift+body/2,0,t,body-2*t,D);
  box('back',0,lift+body/2,-D/2+.004,W-2*t,body-2*t,.008);
  const rows=['dresser','nightstand'].includes(s.family)?3:1;
  for(let c=0;c<cols;c++){if(c>0)box('divider',-W/2+c*W/cols,lift+body/2,0,t,body-2*t,D-.04);
   for(let r=0;r<rows;r++)if(s.front==='closed'){box(rows>1?'drawer-front':'door',-W/2+(c+.5)*W/cols,lift+(r+.5)*body/rows,D/2-.012,W/cols-.009,body/rows-.009,.024);box('handle',-W/2+(c+.5)*W/cols,lift+(r+.62)*body/rows,D/2-.001,.09,.012,.002,'metal');}
   else if(r>0)box('shelf',-W/2+(c+.5)*W/cols,lift+r*body/rows,0,W/cols-.024,t,D-.04);
  }
 }
 return {state:s,width:W,height:H,depth:D,parts};
}

export function detailFields(family){return ['table','coffee','desk','bed','bench'].includes(family)?['legs']:['sofa','armchair','chair'].includes(family)?['legs',...(['sofa','armchair'].includes(family)?['arms']:[]),...(family==='sofa'?['cushions']:[])]:family==='console'?['legs','front']:['front'];}
