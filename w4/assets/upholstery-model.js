import {sofaParameters} from './vendor/infinigen/sofa-parameters.js?v=20261016n';
export const UPHOLSTERY_STYLES={modern:{tr:'Modern / ince gövde',en:'Modern tailored'},chester:{tr:'Chester / kapitone',en:'Chesterfield tufted'},lounge:{tr:'Alçak modüler lounge',en:'Low modular lounge'},timber:{tr:'Açık ahşap karkas',en:'Exposed timber frame'}};
export function compileUpholstery(s){
 const p=sofaParameters(s),W=s.width/100,H=s.height/100,D=s.depth/100,parts=[],style=s.archetype;
 const box=(role,x,y,z,w,h,d,material='fabric',shape='pillow',extra={})=>parts.push({role,position:[x,y,z],size:[w,h,d],material,shape,...extra});
 const feet=(height,kind=s.legs)=>{if(kind==='plinth'){box('recessed-plinth',0,height/2,0,W*.84,height,D*.78,'wood','box');return;}if(kind==='sled'){for(const x of [-1,1]){box('sled-rail',x*(W/2-.12),.025,0,.035,.05,D*.82,'metal','box');for(const z of [-1,1])box('sled-upright',x*(W/2-.12),height/2,z*D*.39,.035,height,.035,'metal','box');}return;}for(const x of [-1,1])for(const z of [-1,1])box('leg',x*(W/2-.11),height/2,z*(D/2-.11),style==='chester'?.09:.055,height,style==='chester'?.09:.055,'wood',kind==='turned'?'turned':kind==='tapered'?'tapered':kind==='cylindrical'?'round':'box');};
 const cushions=(inner,seatY,seatT,usableD,z=0)=>{if(s.cushions==='fixed'){const bottom=style==='timber'?.33:style==='chester'?.33:.26;box('fixed-seat',0,(bottom+seatY)/2,z,inner,seatY-bottom,usableD,'fabric','rounded');return;}const n=s.cushions==='split'?(s.family==='armchair'?1:s.seats):1;for(let i=0;i<n;i++)box(s.cushions==='fixed'?'fixed-seat':'seat-cushion',-inner/2+(i+.5)*inner/n,seatY-seatT/2,z,inner/n-.018,seatT,usableD,'fabric','pillow',{seam:true});};
 const looseBack=(inner,y,h,z,thick)=>{const n=s.back==='channelBack'?Math.max(3,Math.round(inner/.18)):s.back==='looseBack'?(s.family==='armchair'?1:s.seats):1;for(let i=0;i<n;i++)box(s.back==='channelBack'?'back-channel':s.back==='looseBack'?'back-cushion':'fixed-back',-inner/2+(i+.5)*inner/n,y,z,inner/n-.014,h,s.back==='fixedBack'?Math.min(thick,.12):thick,'fabric',s.back==='fixedBack'?'rounded':'pillow',{seam:true});};
 if(style==='chester'){
  const A=Math.min(.27,W*.17),B=.23,leg=.13,seatY=.44,seatT=.17,inner=W-2*A;
  feet(leg);box('upholstered-apron',0,.235,0,W,.21,D,'fabric','pillow');
  // Structural frame is retained as independent components; hidden by upholstery in the beauty view.
  box('frame-front-rail',0,.25,D/2-.07,W-2*A,.10,.045,'wood','box',{internal:true});box('frame-rear-rail',0,.25,-D/2+.07,W-2*A,.10,.045,'wood','box',{internal:true});
  box('tufted-back',0,(.31+H)/2,-D/2+B/2,W-2*A+.05,H-.31,B,'fabric','quilted',{quiltColumns:Math.max(3,Math.round(inner/.23)),quiltRows:3,quiltDepth:.035});
  for(const sign of [-1,1]){box('tufted-arm',sign*(W/2-A/2),(.29+H-A*.5)/2,.015,A,H-A*.5-.29,D-.03,'fabric','quilted',{quiltAxis:'x',quiltSign:-sign,quiltColumns:4,quiltRows:3,quiltDepth:.028});box('rolled-arm',sign*(W/2-A/2),H-A/2,0,A,D,A,'fabric','roll',{rotation:[Math.PI/2,0,0]});}
  const backW=W-2*A+.05,cols=Math.max(3,Math.round(inner/.23));for(let row=1;row<3;row++)for(let i=row%2?0:1;i<cols;i++){const x=-backW/2+(i+(row%2)*.5)*backW/cols,y=.31+row*(H-.31)/3;box('tuft-button',x,y,-D/2+B-.041,.016,.006,.016,'fabric','ellipse',{rotation:[Math.PI/2,0,0]});}
  cushions(inner,seatY,seatT,D-B-.06,B/2+.01);
 }else if(style==='timber'){
  const leg=.24,seatY=.46,A=.075,inner=W-2*A;
  feet(leg,'straight');for(const z of [-1,1])box('timber-seat-rail',0,.28,z*(D/2-.06),W,.10,.065,'wood','box');for(const x of [-1,1]){box('timber-side-rail',x*(W/2-.04),.28,0,.075,.10,D,'wood','box');box('timber-back-post',x*(W/2-.045),(leg+H)/2,-D/2+.04,.065,H-leg,.065,'wood','box');if(s.arms!=='none'){box('timber-arm-post',x*(W/2-.04),.42,D*.30,.055,.32,.055,'wood','box');box('timber-arm-rail',x*(W/2-.04),.61,0,.075,.055,D*.92,'wood','rounded');}}
  for(let i=0;i<Math.max(4,Math.round(W/.15));i++){const n=Math.max(4,Math.round(W/.15));box('timber-back-slat',-inner/2+(i+.5)*inner/n,(.35+H)/2,-D/2+.035,.035,H-.35,.035,'wood','box');}
  cushions(inner-.03,seatY,.15,D-.19,.065);looseBack(inner-.03,(seatY+H-.025)/2,H-seatY-.025,-D/2+.13,.18);
 }else{
  const lounge=style==='lounge',leg=lounge?.055:.17,A=s.arms==='none'?0:s.arms==='slim'?.075:lounge?.27:p.armDimensions[1],inner=W-2*A,B=lounge?.24:p.backDimensions[0],seatY=lounge?.41:.46,T=lounge?.22:.16;
  feet(leg,lounge?'plinth':s.legs);box('seat-frame',0,(leg+.26)/2,0,W,.26-leg,D,'fabric','pillow');
  box('frame-front-rail',0,leg+.04,D/2-.06,W-.13,.075,.035,'wood','box',{internal:true});box('frame-back-rail',0,leg+.04,-D/2+.06,W-.13,.075,.035,'wood','box',{internal:true});
  cushions(inner,seatY,T,D-B-.025,B/2);
  box('back-frame',0,(.23+H)/2,-D/2+.045,W,.0+H-.23,.085,'fabric','pillow');looseBack(inner-.01,(seatY+H)/2,H-seatY,-D/2+B/2+.025,B-.025);
  if(A)for(const sign of [-1,1]){const armH=lounge?Math.min(H-.1,.62):s.arms==='sloped'?H*.88:Math.min(H-.07,.69);box('arm',sign*(W/2-A/2),(.23+armH)/2,.015,A,armH-.23,D-.03,'fabric',s.arms==='square'?'rounded':s.arms==='sloped'?'sloped':'pillow');if(s.arms==='rolled')box('arm-roll',sign*(W/2-A/2),armH-A/2,0,A,D-.03,A,'fabric','roll',{rotation:[Math.PI/2,0,0]});}
 }
 return {state:s,width:W,height:H,depth:D,parts,archetype:style,sourceAdapter:'infinigen-sofa-parameters',technicalStatus:'component-envelopes-not-approved-cut-patterns'};
}
