import {partCorners} from './reference-studies.js?v=20261016i';
export const KITCHEN_STYLES={natural:{name:'Meşe & açık taş',wood:'oak',front:'#d7c8ab',stone:'#e7e1d5'},walnut:{name:'Ceviz & grafit',wood:'walnut',front:'#454b48',stone:'#656c68'},ivory:{name:'Kırık beyaz & ahşap',wood:'oak',front:'#e4e0d5',stone:'#ccc4b4'}};
export const KITCHEN_TYPES={cabinets:'Mutfak dolapları',worktop:'Tezgâh & evye',island:'Mutfak adası'};
export function buildKitchenStudy(type='cabinets',style='natural'){
 if(!Object.hasOwn(KITCHEN_TYPES,type)||!Object.hasOwn(KITCHEN_STYLES,style))throw Error('Unknown kitchen study');
 const s=KITCHEN_STYLES[style],parts=[];
 const box=(role,x,y,z,w,h,d,material='wood',color,shape='box')=>parts.push({role,position:[x,y,z],size:[w,h,d],material,shape,...(color?{color}:{})});
 const paint=(role,x,y,z,w,h,d,color=s.front,shape='box')=>box(role,x,y,z,w,h,d,'plastic',color,shape);
 const stone=(role,x,y,z,w,h,d)=>paint(role,x,y,z,w,h,d,s.stone);
 const unit=(x,w=.6,h=.86,z=0,drawers=3)=>{for(const sign of [-1,1])box('cabinet-side',x+sign*(w/2-.014),.12+(h-.12)/2,z,.02,h-.12,.58);box('cabinet-floor',x,.13,z,w-.008,.02,.58);box('cabinet-back',x,.12+(h-.12)/2,z-.28,w-.008,h-.12,.02);paint('recessed-plinth',x,.06,z-.035,w-.008,.12,.49,'#494b43');for(let i=0;i<drawers;i++){const fh=(h-.12)/drawers;const y=.12+(i+.5)*fh;const mat=style==='natural'?'wood':'plastic';box('cabinet-front',x,y,z+.305,w-.009,fh-.009,.024,mat,mat==='plastic'?s.front:undefined);paint('finger-recess',x,y+fh/2-.012,z+.318,w-.035,.012,.009,'#4b4b40');}};
 const sink=(x,y,z)=>{paint('sink-bottom',x,y-.12,z,.47,.014,.32,'#777f79');for(const sign of [-1,1]){paint('sink-wall',x+sign*.245,y-.06,z,.018,.12,.34,'#a6aba3');paint('sink-wall',x,y-.06,z+sign*.17,.51,.12,.018,'#a6aba3');}box('tap-upright',x,y+.14,z-.26,.025,.28,.025,'metal');box('tap-spout',x,y+.275,z-.16,.025,.025,.22,'metal');paint('drain',x,y-.108,z,.04,.004,.04,'#3b433e','round');};
 const sinkSlab=(x,y,z,w,d)=>{const hole=.53,hd=.38;stone('counter-left',x-(w+hole)/4,y,z,(w-hole)/2,.03,d);stone('counter-right',x+(w+hole)/4,y,z,(w-hole)/2,.03,d);for(const sign of [-1,1])stone('counter-bridge',x,y,z+sign*(d+hd)/4,hole,.03,(d-hd)/2);sink(x,y,z);};
 if(type==='cabinets'){
  for(let i=0;i<5;i++)unit(-1.5+i*.6,.6,.86,0,i===1?1:3);
  sinkSlab(-.9,.875,0,1.8,.65);stone('prep-worktop',.6,.875,0,1.2,.03,.65);
  paint('induction-hob',.62,.895,0,.58,.015,.5,'#252d2b','rounded');for(const x of [.47,.77])for(const z of [-.13,.13])paint('hob-zone',x,.904,z,.16,.002,.16,'#555f58','round');
  box('tall-oven-housing',1.5,1.15,-.01,.6,2.3,.6);for(const y of [.43,1.9])paint('tall-door',1.5,y,.305,.588,y<1?.6:.76,.025);paint('oven-glass',1.5,1.14,.315,.53,.57,.025,'#29322f');paint('oven-window',1.5,1.12,.334,.43,.35,.013,'#4c5854');box('oven-handle',1.5,1.33,.36,.39,.02,.025,'metal');
  for(let i=0;i<4;i++){const x=-1.5+i*.6;box('upper-cabinet',x,1.94,-.115,.594,.66,.35);paint('upper-front',x,1.94,.073,.586,.65,.025);paint('task-light',x,1.603,-.08,.52,.008,.20,'#fff3d6');}
  box('open-oak-shelf',.9,1.68,-.1,.57,.028,.37);stone('backsplash-strip',-.3,1.02,-.314,3,.26,.018);
 }
 if(type==='island'){
  for(let i=0;i<4;i++)unit(-.9+i*.6,.6,.87,0,3);
  box('island-back',0,.49,-.31,2.4,.75,.025);
  if(style==='natural'){for(let i=0;i<60;i++)box('fluted-back',-1.18+i*.04,.49,-.337,.022,.74,.026);}
  stone('island-top',0,.9,-.12,2.5,.055,1.13);
  if(style==='walnut'){for(const x of [-1.23,1.23])stone('waterfall-end',x,.46,-.12,.04,.9,1.13);}
  else for(const x of [-1.185,1.185])box('end-panel',x,.49,0,.03,.75,.64);
  for(const x of [-.65,.65]){box('stool-seat',x,.65,-.96,.4,.055,.38,'wood',undefined,'rounded');for(const a of [-1,1])for(const b of [-1,1])box('stool-leg',x+a*.14,.32,-.96+b*.13,.028,.63,.028,'metal');box('stool-footrest',x,.24,-1.09,.30,.02,.02,'metal');}
 }
 if(type==='worktop'){
  unit(-.9,.6,.86,0,3);unit(0,1.2,.86,0,1);unit(.9,.6,.86,0,3);
  sinkSlab(0,.88,0,2.4,.65);unit(.9,.6,.86,.6,3);unit(.9,.6,.86,1.2,3);stone('L-return-worktop',.9,.88,.94,.65,.03,1.23);
  stone('low-upstand',0,.97,-.317,2.4,.15,.018);stone('return-upstand',1.217,.97,.75,.018,.15,1.5);
 }
 const vertices=parts.flatMap(partCorners),lo=[0,1,2].map(a=>Math.min(...vertices.map(v=>v[a]))),hi=[0,1,2].map(a=>Math.max(...vertices.map(v=>v[a]))),offset=[(lo[0]+hi[0])/2,lo[1],(lo[2]+hi[2])/2];
 for(const p of parts)p.position=p.position.map((v,a)=>v-offset[a]);
 const [width,height,depth]=hi.map((v,a)=>v-lo[a]);return {parts,width,height,depth,state:{family:'console',width:Math.round(width*100),height:Math.round(height*100),depth:Math.round(depth*100),wood:s.wood,fabric:'linen',weave:'plain'},stage:'concept',dimensionsEstimated:true};
}


