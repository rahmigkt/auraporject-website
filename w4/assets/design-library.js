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
 closed:{field:'front',names:names('Kapaklı','With doors','Avec portes','Med låger','Mit Türen','Met deuren','Con puertas','Con ante'),sketch:'M18 15h84v65H18zM60 15v65M53 42v10M67 42v10'},
 rounded:{field:'arms',names:names('Yumuşak kenarlı','Soft rounded arms','Accoudoirs adoucis','Bløde armlæn','Weiche Armlehnen','Zachte armleuningen','Brazos suaves','Braccioli morbidi'),sketch:'M15 73V36Q15 22 29 22h5q8 0 8 10v41M78 73V32q0-10 8-10h5q14 0 14 14v37M42 52h36v21H42z'},
 slim:{field:'arms',names:names('İnce kolçak','Slim arms','Accoudoirs fins','Smalle armlæn','Schmale Armlehnen','Smalle armleuningen','Brazos finos','Braccioli sottili'),sketch:'M18 27h8v46h-8zM94 27h8v46h-8zM26 52h68v21H26z'},
 sloped:{field:'arms',names:names('Eğimli kolçak','Sloping arms','Accoudoirs inclinés','Skrå armlæn','Geneigte Armlehnen','Schuine armleuningen','Brazos inclinados','Braccioli inclinati'),sketch:'M16 73V23h13l12 50zM104 73V23H91L79 73zM41 52h38v21H41z'},
 fixed:{field:'cushions',names:names('Sabit döşemeli oturum','Fixed upholstered seat','Assise fixe','Fast polstret sæde','Fest gepolsterter Sitz','Vaste gestoffeerde zitting','Asiento tapizado fijo','Seduta imbottita fissa'),sketch:'M15 27q0-8 8-8h74q8 0 8 8v41H15zM15 68h90M26 68v12M94 68v12'},
 fixedBack:{field:'back',names:names('Sabit sırt','Fixed back','Dossier fixe','Fast ryg','Fester Rücken','Vaste rug','Respaldo fijo','Schienale fisso'),sketch:'M15 23q0-9 9-9h72q9 0 9 9v39H15zM15 62h90v13H15z'},
 looseBack:{field:'back',names:names('Ayrı sırt minderleri','Loose back cushions','Coussins de dossier','Løse ryghynder','Lose Rückenkissen','Losse rugkussens','Cojines de respaldo','Cuscini schienale'),sketch:'M13 13h94v57H13zM20 23h36v38H20zM64 23h36v38H64zM13 70h94'},
 channelBack:{field:'back',names:names('Dikey kanallı sırt','Channel back','Dossier cannelé','Ryg med lodrette kanaler','Rücken mit Längsnähten','Rug met verticale banen','Respaldo acanalado','Schienale a canali'),sketch:'M15 17h90v55H15zM33 17v55M51 17v55M69 17v55M87 17v55'},
 mixed:{field:'front',names:names('Açık ve kapaklı','Open and closed','Ouvert et fermé','Åbent og lukket','Offen und geschlossen','Open en gesloten','Abierto y cerrado','Aperto e chiuso'),sketch:'M15 16h90v64H15zM45 16v64M75 16v64M45 46h30M34 40v11M86 40v11'}
};
export const label=(obj,language)=>obj.names?.[language]||obj[language]||obj.names?.en||obj.en;
export function illustration(path){return `<svg viewBox="0 0 120 90" fill="none" aria-hidden="true"><path d="${path}" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>`;}
const has=(o,k)=>typeof k==='string'&&Object.hasOwn(o,k);
export function normalizeStudio(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))raw={};
 const family=has(FAMILIES,raw.family)?raw.family:'sofa',d=FAMILIES[family].size;
 const r={version:2,family};
 for(const [i,k] of ['width','height','depth'].entries())r[k]=typeof raw[k]==='number'&&Number.isFinite(raw[k])?Math.round(Math.min(k==='height'?260:350,Math.max(k==='height'?(family==='bed'?60:30):25,raw[k]))):d[i];
 for(const [k,choices,fallback] of [['legs',['straight','tapered','sled','plinth'],'tapered'],['arms',['square','rolled','rounded','slim','sloped','none'],'rounded'],['cushions',['single','split','fixed'],'split'],['back',['fixedBack','looseBack','channelBack'],'fixedBack'],['configuration',['straight','left','right'],'straight'],['top',['rect','soft','round','oval'],'rect'],['weave',['plain','twill22','basket'],'plain'],['front',['open','closed','mixed'],'closed'],['wood',Object.keys(WOODS),'walnut'],['fabric',Object.keys(FABRICS),'linen']])r[k]=choices.includes(raw[k])?raw[k]:fallback;
 r.seats=raw.seats===2?2:3;
 if(family!=='sofa'&&r.cushions==='split')r.cushions='single';
 r.columns=Number.isInteger(raw.columns)?Math.min(4,Math.max(2,raw.columns)):3;
 r.rows=Number.isInteger(raw.rows)?Math.min(6,Math.max(1,raw.rows)):family==='shelf'?4:['dresser','nightstand'].includes(family)?3:1;
 if(['console','shelf'].includes(family)){const n=normalizeDesign({...r,model:family});for(const k of ['width','height','depth','columns','rows'])r[k]=n[k];}
 if(r.front==='mixed')r.columns=Math.max(3,r.columns);
 if(family==='nightstand')r.columns=1;
 if(['dresser','nightstand'].includes(family))r.rows=Math.max(2,r.rows);
 const ranges=SIZE_LIMITS[family];for(const [i,k] of ['width','height','depth'].entries())r[k]=Math.min(ranges[i][1],Math.max(ranges[i][0],r[k]));
 if(family!=='sofa')r.configuration='straight';if(r.configuration!=='straight'){r.depth=Math.max(r.depth,140);if(!['straight','tapered'].includes(r.legs))r.legs='tapered';}
 if(['table','coffee'].includes(family)&&r.top==='round')r.depth=r.width=Math.min(r.width,r.depth);
 return r;
}
export function changeFamily(raw,family){return normalizeStudio({...raw,family,...Object.fromEntries(['width','height','depth'].map((k,i)=>[k,FAMILIES[family].size[i]]))});}
export function compileStudio(raw){
 const s=normalizeStudio(raw);
 if(['console','shelf'].includes(s.family)){const result=compileDesign({...s,front:s.front==='mixed'?'open':s.front,model:s.family});if(s.front==='mixed'||(s.family==='shelf'&&s.front==='closed')){if(s.front==='mixed')result.parts=result.parts.filter(p=>p.role!=='door'&&p.role!=='pull');const count=s.front==='mixed'?2:s.columns;for(let i=0;i<count;i++){const col=s.front==='mixed'?(i===0?0:s.columns-1):i,w=result.width/s.columns-.012,h=(result.height-(s.family==='console'?.16:.04))-.012;result.parts.push({role:'door',position:[-result.width/2+(col+.5)*result.width/s.columns,result.height-h/2-.006,result.depth/2-.012],size:[w,h,.024],material:'wood'});}}if(s.family==='console'){
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
 if(['table','coffee','desk'].includes(s.family)){const t=Math.min(.045,H*.12);legs(H-t);box('top',0,H-t/2,0,W,t,D,'wood',s.top==='round'||s.top==='oval'?'ellipse':s.top==='soft'?'rounded':'box');}
 else if(['sofa','armchair','chair','bench'].includes(s.family)){
  const isBench=s.family==='bench',seatY=isBench?H*.82:Math.min(.45,H*.55),cushion=Math.min(.13,H*.15),base=.06,legTop=Math.max(.08,seatY-cushion-base),L=s.configuration!=='straight',mainD=L?Math.min(.95,D*.62):D,mainZ=-D/2+mainD/2;
  legs(legTop);if(L)for(const p of parts)if(p.role==='leg'&&Math.sign(p.position[0])===(s.configuration==='left'?1:-1)&&p.position[2]>0)p.position[2]=mainZ+mainD/2-p.size[2]*1.2;box('seat-frame',0,legTop+base/2,mainZ,W,base,mainD,'fabric','rounded');
  box('seat-apron',0,(legTop+base+seatY-cushion+.018)/2,mainZ,W,Math.max(.018,seatY-cushion+.018-legTop-base),mainD,'fabric','rounded');
  const armW=s.arms==='slim'?Math.min(.075,W*.06):Math.min(.19,W*.12),hasArms=!isBench&&s.family!=='chair'&&s.arms!=='none',inner=W-(hasArms?2*armW:0),backD=Math.min(.16,mainD*.2),usableD=mainD-(isBench?0:backD),count=s.cushions==='split'&&s.family==='sofa'?s.seats:1,soft=s.arms==='rounded';
  if(s.cushions==='fixed')box('fixed-seat',0,(legTop+seatY)/2,mainZ+(isBench?0:backD/2),inner,seatY-legTop,usableD-.012,'fabric','rounded');
  else for(let i=0;i<count;i++)box('seat-cushion',-inner/2+(i+.5)*inner/count,seatY-cushion/2,mainZ+(isBench?0:backD/2),inner/count-.012,cushion,usableD-.012,'fabric','rounded');
  if(L){const chaiseW=inner/s.seats,x=(s.configuration==='left'?-1:1)*(inner/2-chaiseW/2),extension=D-mainD;box('chaise-frame',x,legTop+base/2,mainZ+mainD/2+extension/2,chaiseW,base,extension);box(s.cushions==='fixed'?'fixed-chaise':'chaise-cushion',x,seatY-cushion/2,mainZ+mainD/2+extension/2,chaiseW-.012,cushion,extension-.012,'fabric','rounded');}
  if(!isBench){
   const backH=H-seatY;
   box('back-support',0,(legTop+seatY+.035)/2,-D/2+backD/2,W,seatY+.035-legTop,backD,'fabric','rounded');
   if(s.back==='looseBack'){box('back-frame',0,(legTop+H-.025)/2,-D/2+.03,W,H-.025-legTop,.06,'fabric','rounded');const n=s.family==='sofa'?s.seats:1;for(let i=0;i<n;i++)box('back-cushion',-inner/2+(i+.5)*inner/n,seatY+backH/2,-D/2+backD/2+.018,inner/n-.012,backH,backD,'fabric','rounded');}
   else if(s.back==='channelBack'){const n=Math.max(3,Math.round(inner/.18));for(let i=0;i<n;i++)box('back-channel',-W/2+(i+.5)*W/n,seatY+backH/2,-D/2+backD/2,W/n-.006,backH,backD,'fabric','rounded');}
   else box('back',0,seatY+backH/2,-D/2+backD/2,W,backH,backD,'fabric',soft?'rounded':'box');
   if(hasArms)for(const sign of [-1,1]){const armH=(H-seatY)*.55,baseArmH=s.arms==='rolled'?Math.max(.02,armH-armW/2):armH;box('arm',sign*(W/2-armW/2),(legTop+seatY+baseArmH)/2,mainZ,armW,seatY+baseArmH-legTop,mainD,'fabric',s.arms==='sloped'?'sloped':soft?'rounded':'box');if(s.arms==='rolled')box('arm-roll',sign*(W/2-armW/2),seatY+armH-armW/2,mainZ,armW,mainD,armW,'fabric','round',[Math.PI/2,0,0]);}
  }
 }else if(s.family==='bed'){
  legs(.14);box('bed-frame',0,.23,.035,W,.18,D-.07);box('mattress',0,.41,.035,W-.06,.18,D-.13,'fabric');if(s.back==='channelBack'){const n=Math.max(4,Math.round(W/.18));for(let i=0;i<n;i++)box('headboard-channel',-W/2+(i+.5)*W/n,H/2,-D/2+.035,W/n-.005,H,.07,'fabric','rounded');}else box('headboard',0,H/2,-D/2+.035,W,H,.07,'fabric','rounded');
 }else{
  const lift=s.family==='wardrobe'?.06:.14,t=.022,body=H-lift,cols=s.family==='nightstand'?1:s.columns;
  legs(lift);box('top',0,H-t/2,0,W,t,D);box('bottom',0,lift+t/2,0,W,t,D);
  for(const sign of [-1,1])box('side',sign*(W-t)/2,lift+body/2,0,t,body-2*t,D);
  box('back',0,lift+body/2,-D/2+.004,W-2*t,body-2*t,.008);
  const rows=['dresser','nightstand'].includes(s.family)?Math.max(2,s.rows):Math.max(1,s.rows);
  for(let c=0;c<cols;c++){if(c>0)box('divider',-W/2+c*W/cols,lift+body/2,0,t,body-2*t,D-.04);
   for(let r=0;r<rows;r++)if(s.front==='closed'||(s.front==='mixed'&&(c===0||c===cols-1))){box(rows>1?'drawer-front':'door',-W/2+(c+.5)*W/cols,lift+(r+.5)*body/rows,D/2-.012,W/cols-.009,body/rows-.009,.024);box('handle',-W/2+(c+.5)*W/cols,lift+(r+.62)*body/rows,D/2-.001,.09,.012,.002,'metal');}
   else if(r>0)box('shelf',-W/2+(c+.5)*W/cols,lift+r*body/rows,0,W/cols-.024,t,D-.04);
  }
 }
 return {state:s,width:W,height:H,depth:D,parts};
}

export function detailFields(family){return ['table','coffee','desk','bed','bench'].includes(family)?['legs']:['sofa','armchair','chair'].includes(family)?['legs',...(['sofa','armchair'].includes(family)?['arms']:[]),'cushions',...(family!=='bench'?['back']:[])]:family==='console'?['legs','front']:['front'];}

export const SIZE_LIMITS={sofa:[[120,330],[65,115],[75,200]],armchair:[[65,130],[65,120],[65,120]],chair:[[40,90],[70,120],[40,85]],bench:[[70,220],[35,65],[35,80]],table:[[80,300],[65,85],[60,150]],coffee:[[45,180],[30,65],[40,120]],desk:[[80,240],[65,90],[45,100]],bed:[[100,240],[60,160],[190,240]],console:[[80,240],[55,110],[30,60]],shelf:[[60,220],[100,220],[25,45]],wardrobe:[[80,300],[160,260],[45,80]],dresser:[[60,180],[65,130],[35,65]],nightstand:[[35,90],[35,85],[30,60]],tv:[[90,300],[35,90],[30,65]]};
