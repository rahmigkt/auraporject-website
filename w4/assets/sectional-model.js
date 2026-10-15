// Parametric corner sofa: continuous back on both branches, supported modules.
export function compileSectional(s){
 const W=s.width/100,H=s.height/100,D=s.depth/100,parts=[],side=s.configuration==='cornerLeft'?-1:1;
 const A=s.arms==='none'?0:s.arms==='slim'?.075:.25,B=.18,M=Math.min(.98,D*.44,W*.36),seatY=.45,legH=.17,frame=.09,seatT=.16;
 const box=(role,x,y,z,w,h,d,material='fabric',shape='rounded')=>parts.push({role,position:[x*side,y,z],size:[w,h,d],material,shape});
 const foot=(x,z)=>box('leg',x,legH/2,z,.075,legH,.075,'wood',s.legs==='cylindrical'?'round':s.legs==='tapered'?'tapered':'box');
 function base(x,z,w,d){box('seat-frame',x,legH+frame/2,z,w,frame,d,'wood');box('seat-apron',x,(legH+frame+seatY-seatT)/2,z,w,Math.max(.025,seatY-seatT-legH-frame),d);for(const dx of [-1,1])for(const dz of [-1,1])foot(x+dx*(w/2-.09),z+dz*(d/2-.09));}
 const mainZ=-D/2+M/2,cornerX=W/2-M/2,service=s.service==='none'?0:Math.min(.34,(W-M-A)*.22),run=W-M-A-service,mainN=s.cushions==='split'?s.seats:1;
 const backH=H-seatY;
 function rearBack(x,z,w){box('back-support',x,(legH+H-.04)/2,z,w,H-.04-legH,.085);const n=s.back==='channelBack'?Math.max(2,Math.round(w/.17)):1;for(let i=0;i<n;i++)box(s.back==='fixedBack'?'fixed-back':s.back==='channelBack'?'back-channel':'back-cushion',x-w/2+(i+.5)*w/n,seatY+backH/2,z+B/2,w/n-.012,backH,B);}
 for(let i=0;i<mainN;i++){const w=run/mainN,x=-W/2+A+(i+.5)*w;base(x,mainZ,w-.005,M);box(s.cushions==='fixed'?'fixed-seat':'seat-cushion',x,seatY-seatT/2,mainZ+B/2,w-.018,seatT,M-B-.02);rearBack(x,-D/2+.045,w-.01);}
 // Actual corner seat, with backs on both exterior edges.
 base(cornerX,mainZ,M,M);box('corner-seat',cornerX-B/2,seatY-seatT/2,mainZ+B/2,M-B-.025,seatT,M-B-.025);rearBack(cornerX,-D/2+.045,M);
 box('corner-side-back',W/2-.045,(legH+H-.04)/2,mainZ+B/2,.09,H-.04-legH,M-B);
 box('corner-side-cushion',W/2-B/2-.04,seatY+backH/2,mainZ+B/2,B,backH,M-B-.02);
 const wingRun=D-M-A,n=s.cushions==='split'?s.returnSeats:1;
 for(let i=0;i<n;i++){const d=wingRun/n,z=-D/2+M+(i+.5)*d;base(cornerX,z,M,d-.005);box(s.cushions==='fixed'?'fixed-return-seat':'return-seat-cushion',cornerX-B/2,seatY-seatT/2,z,M-B-.02,seatT,d-.018);box('return-back-support',W/2-.045,(legH+H-.04)/2,z,.09,H-.04-legH,d-.01);const bands=s.back==='channelBack'?Math.max(2,Math.round(d/.17)):1;for(let j=0;j<bands;j++)box(s.back==='fixedBack'?'fixed-return-back':s.back==='channelBack'?'return-back-channel':'return-back-cushion',W/2-B/2-.04,seatY+backH/2,z-d/2+(j+.5)*d/bands,B,backH,d/bands-.02);}
 if(A){function arm(x,z,w,d){box('arm-base',x,(legH+.56)/2,z,w,.56-legH,d);if(s.arms==='paddedWood'){box('arm-wood-tray',x,.565,z,w-.01,.045,d-.01,'wood');box('arm-pad',x,.64,z,w-.01,.11,d-.01);}else box('arm-pad',x,.59,z,w,.12,d);}
 arm(-W/2+A/2,mainZ,A,M);arm(cornerX,D/2-A/2,M,A);}
 if(service){const x=W/2-M-service/2;base(x,mainZ,service,M);box('service-body',x,.32,mainZ,service,.30,M,'wood');box('service-top',x,.49,mainZ,service+.01,.045,M,'wood');if(s.service==='cupholders')for(const z of [-.20,.20])box('cupholder',x,.516,mainZ+z,.085,.009,.085,'metal','round');}
 if(s.pillows==='yes'){box('throw-pillow',-W/2+A+.24,.65,mainZ+.04,.33,.34,.12);box('return-throw-pillow',cornerX-.05,.65,D/2-A-.28,.12,.34,.33);}
 return {state:s,width:W,height:H,depth:D,parts};
}
