// Reference studies are simplified, editable concept geometry, never supplier CAD.
import {PRODUCTS} from './furniture-taxonomy.js?v=20261016m';
import {compileStudio} from './design-library.js?v=20261016n';
export function transformStudyPoint(p,v){const [rx,ry,rz]=p.rotation||[0,0,0],yaw=p.yaw||0;let [x,y,z]=v;[x,y]=[x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz)];[x,z]=[x*Math.cos(ry)+z*Math.sin(ry),-x*Math.sin(ry)+z*Math.cos(ry)];[y,z]=[y*Math.cos(rx)-z*Math.sin(rx),y*Math.sin(rx)+z*Math.cos(rx)];[x,z]=[x*Math.cos(yaw)+z*Math.sin(yaw),-x*Math.sin(yaw)+z*Math.cos(yaw)];return [x+p.position[0],y+p.position[1],z+p.position[2]];}
export function partCorners(p){const result=[];for(const a of [-1,1])for(const b of [-1,1])for(const c of [-1,1])result.push(transformStudyPoint(p,[a*p.size[0]/2,b*p.size[1]/2,c*p.size[2]/2]));return result;}

export function buildReferenceStudy(id,options={}){
 if(options.scale!==undefined&&(!Number.isFinite(options.scale)||options.scale<.6||options.scale>1.5))throw Error('Reference scale out of bounds');
 if(!Object.hasOwn(PRODUCTS,id))throw Error('Unknown reference type');
 let parts=[];const pose=options.pose||'open',open=pose==='open';
 const box=(role,x,y,z,w,h,d,material='wood',shape='box',rotation=null,extra={})=>{parts.push({role,position:[x,y,z],size:[w,h,d],material,shape,...(rotation?{rotation}:{}),...extra});};
 const rod=(role,a,b,r=.025,material='wood')=>{const v=b.map((n,i)=>n-a[i]),L=Math.hypot(...v);box(role,...a.map((n,i)=>(n+b[i])/2),r,L,r,material,'round',[Math.atan2(v[2],v[1]),0,-Math.asin(v[0]/L)]);};
 const legs=(w,d,h=.4,material='wood',round=false)=>{for(const x of [-1,1])for(const z of [-1,1])box('leg',x*(w/2-.06),h/2,z*(d/2-.06),.055,h,.055,material,round?'round':'box');};
 const table=(w=1.4,d=.75,h=.74,style='rect',material='wood')=>{if(style==='pedestal'){box('table-base',0,.035,0,.65,.07,.65,material,'ellipse');box('table-column',0,h/2,0,.32,h-.06,.32,material,'round');}else legs(w,d,h-.04,material);box('table-top',0,h-.02,0,w,.04,d,material,style==='round'||style==='pedestal'?'ellipse':style==='soft'?'rounded':'box');};
 const cabinet=(w=1.2,h=.9,d=.4,cols=2,rows=1,front='doors',lift=.12)=>{const t=.024,body=h-lift;box('cabinet-top',0,h-t/2,0,w,t,d);box('cabinet-bottom',0,lift+t/2,0,w,t,d);for(const sign of [-1,1])box('cabinet-side',sign*(w-t)/2,lift+body/2,0,t,body,d);box('cabinet-back',0,lift+body/2,-d/2+.01,w,body,.02);if(lift>0)legs(w,d,lift);
  for(let c=0;c<cols;c++){const x=-w/2+(c+.5)*w/cols,cw=w/cols;if(c>0)box('cabinet-divider',-w/2+c*cw,lift+body/2,0,t,body,d-.03);for(let r=1;r<rows;r++)box('cabinet-shelf',x,lift+r*body/rows,0,cw-t,t,d-.03);
   if(front==='open')continue;
   if(front==='glass'){box('glass-panel',x,lift+body/2,d/2-.012,cw-.06,body-.06,.012,'glass');for(const sign of [-1,1]){box('door-frame',x+sign*(cw/2-.02),lift+body/2,d/2,.025,body,.025);box('door-frame',x,lift+(sign<0?.02:body-.02),d/2,cw,.025,.025);}box('door-handle',x+cw*.3,lift+body/2,d/2+.025,.025,.10,.025,'metal');}
   else for(let r=0;r<(front==='drawers'?rows:1);r++){const n=front==='drawers'?rows:1,fh=body/n-.008,y=lift+(r+.5)*body/n;box(front==='drawers'?'drawer-front':'door',x,y,d/2,cw-.008,fh,.025);box('handle',x,y+fh*.24,d/2+.025,.10,.015,.025,'metal');}
  }
 };
 const seat=(w=.65,d=.7,h=.95,arms=true)=>{legs(w,d,.36,'wood',true);box('seat',0,.43,0,w,.14,d,'fabric','rounded');box('back',0,(.48+h)/2,-d/2+.06,w,h-.48,.13,'fabric','rounded',[-.12,0,0]);if(arms)for(const x of [-1,1]){box('arm-support',x*(w/2-.04),.53,0,.07,.27,d*.8);box('arm-pad',x*(w/2-.04),.68,0,.11,.09,d*.88,'fabric','rounded');}};
 const bed=(w=1.6,d=2,h=1,head=true)=>{legs(w,d,.18);box('bed-frame',0,.25,0,w,.18,d);box('mattress',0,.43,.015,w-.05,.18,d-.05,'fabric','rounded');if(head)box('headboard',0,h/2,-d/2,w,h,.06,'fabric','rounded');for(const x of [-1,1])box('bed-pillow',x*w*.24,.56,-d*.31,w*.4,.12,.42,'fabric','rounded');};
 const slats=(w,d,y,count=6,material='wood')=>{for(let i=0;i<count;i++)box('slat',0,y,-d/2+(i+.5)*d/count,w,.035,d/count-.014,material,'rounded');};
 const woodenBench=(w=1.7,d=.45,h=.45,material='wood')=>{legs(w,d,h-.04,material);slats(w,d,h-.02,5,material);};
 const add=(type,x=0,z=0,angle=0,scale=1)=>{const m=buildReferenceStudy(type,{...options,scale:1});for(const p of m.parts){const [px,py,pz]=p.position;parts.push({...p,role:type+'/'+p.role,position:[x+(px*Math.cos(angle)+pz*Math.sin(angle))*scale,py*scale,z+(-px*Math.sin(angle)+pz*Math.cos(angle))*scale],size:p.size.map(v=>v*scale),yaw:(p.yaw||0)+angle});}};
 const base=(family,patch={})=>{parts=compileStudio({family,wood:options.wood||'oak',fabric:options.fabric||'taupe',...patch}).parts.map(p=>({...p}));};
 switch(id){
 case 'sofa':base('sofa',{width:220,height:75,depth:84,arms:'slim',legs:'straight',cushions:'split',seats:2,back:'looseBack'});break;
 case 'cornerSofa':base('sofa',{configuration:'cornerRight',width:320,height:90,depth:260,arms:'paddedWood',service:'cupholders',pillows:'yes',cushions:'split',back:'looseBack',seats:2,returnSeats:2});break;
 case 'chaiseSofa':base('sofa',{configuration:'left',width:263,height:75,depth:142,arms:'slim',seats:3,back:'looseBack'});break;
 case 'modularSofa':for(let i=0;i<3;i++){const x=(i-1)*.94;box('module-base',x,.19,0,.93,.30,.95,'fabric','rounded');box('module-seat',x,.39,.06,.91,.14,.77,'fabric','rounded');box('module-back',x,.61,-.37,.93,.48,.21,'fabric','rounded');}box('chaise-module',-.94,.29,.94,.93,.42,.93,'fabric','rounded');break;
 case 'sleeperSofa':base('sofa',{width:240,height:85,depth:95,arms:'square',back:'looseBack',seats:2});if(open){box('unfolded-mattress',0,.38,1.07,1.6,.14,1.7,'fabric','rounded');for(const x of [-1,1])for(const z of [.42,1.8])rod('foldout-frame',[x*.78,.10,z],[x*.78,.30,z],.025,'metal');box('foldout-front',0,.28,1.88,1.6,.035,.035,'metal');}break;
 case 'armchair':seat(.78,.82,1.06,true);box('head-cushion',0,.99,-.32,.65,.22,.15,'fabric','rounded',[-.12,0,0]);break;
 case 'recliner':seat(.76,.85,1.07,true);parts=parts.filter(p=>p.role!=='leg');box('swivel-column',0,.20,0,.07,.36,.07,'metal','round');for(let i=0;i<4;i++){const a=i*Math.PI/2;rod('swivel-foot',[0,.07,0],[Math.cos(a)*.42,.04,Math.sin(a)*.42],.045,'metal');}if(open)box('raised-footrest',0,.37,.65,.65,.11,.5,'fabric','rounded');box('head-wing',0,1.03,-.38,.84,.24,.18,'fabric','rounded');break;
 case 'rockingChair':seat(.64,.75,1,true);parts=parts.filter(p=>p.role!=='leg');for(const x of [-.33,.33]){for(let i=0;i<10;i++){const z=-.65+i*.13,z2=z+.13;rod('curved-rocker',[x,.035+z*z*.25,z],[x,.035+z2*z2*.25,z2],.05);}rod('rocker-upright',[x,.08,.32],[x,.44,.24],.045);rod('rocker-upright',[x,.08,-.32],[x,.58,-.28],.045);}break;
 case 'chaiseLongue':legs(.9,1.5,.17,'metal');box('chaise-frame',0,.23,0,.9,.1,1.5,'fabric','rounded');box('chaise-seat',0,.37,.06,.88,.18,1.34,'fabric','rounded');box('chaise-back',0,.64,-.65,.88,.43,.15,'fabric','rounded');break;
 case 'pouf':box('five-pouf',0,.22,0,.85,.44,.78,'fabric','polygon',null,{sides:5});break;
 case 'bench':woodenBench(1.7,.34,.46);break;
 case 'bedBench':woodenBench(1.6,.48,.38);box('bench-pad',0,.43,0,1.53,.08,.43,'fabric','rounded');break;
 case 'diningChair':legs(.5,.5,.43);box('woven-seat',0,.45,0,.47,.04,.45,'fabric','rounded');for(const x of [-.22,.22])rod('back-leg',[x,.02,-.2],[x,.77,-.23],.035);for(let i=0;i<12;i++){const a=-Math.PI*.95+i*Math.PI*.9/12,b=a+Math.PI*.9/12;rod('curved-top-rail',[Math.cos(a)*.3,.77,Math.sin(a)*.17-.17],[Math.cos(b)*.3,.77,Math.sin(b)*.17-.17],.035);}for(const x of [-.1,.1])rod('wishbone-brace',[0,.48,-.21],[x,.75,-.27],.028);break;
 case 'barStool':legs(.47,.45,.73,'metal');box('bar-seat',0,.75,0,.47,.08,.42,'fabric','rounded');box('bar-back',0,.89,-.18,.45,.27,.07,'fabric','rounded');for(const z of [-.18,.18])rod('footrest',[-.19,.28,z],[.19,.28,z],.022,'metal');break;
 case 'stool':box('stool-seat',0,.44,0,.43,.04,.4,'wood','polygon',null,{sides:3});for(let i=0;i<3;i++){const a=i*2*Math.PI/3;rod('stool-leg',[Math.sin(a)*.21,.02,Math.cos(a)*.2],[Math.sin(a)*.15,.43,Math.cos(a)*.14],.04);}break;
 case 'coffee':table(.95,.95,.38,'round');for(let i=0;i<24;i++){const a=i*Math.PI/12,b=(i+1)*Math.PI/12;rod('raised-rim',[Math.cos(a)*.46,.42,Math.sin(a)*.46],[Math.cos(b)*.46,.42,Math.sin(b)*.46],.02);}break;
 case 'sideTable':case 'cTable':box('C-base',0,.018,0,.5,.035,.4,'metal','rounded');rod('C-upright',[.2,.035,0],[.2,.59,0],.04,'metal');box('C-tabletop',0,.61,0,.6,.035,.42,'wood','rounded');break;
 case 'nestingTables':for(let i=0;i<2;i++){const r=.46-i*.13,x=i*.36,h=.48-i*.10;box('nest-top',x,h,0,r*2,.035,r*1.45,'wood','kidney');for(let k=0;k<3;k++){const a=k*2*Math.PI/3;rod('nest-leg',[x+Math.sin(a)*r*.65,.025,Math.cos(a)*r*.45],[x+Math.sin(a)*r*.6,h,Math.cos(a)*r*.4],.035);}}break;
 case 'diningTable':table(1.4,1.4,.74,'pedestal');break;
 case 'extendableTable':table(open?2.2:1.6,.9,.75);if(open)for(const x of [-.3,.3])box('extension-seam',x,.752,0,.006,.002,.9,'metal');break;
 case 'kitchenTable':table(open?1.04:.74,.74,.74);box('drop-leaf-seam',.22,.742,0,.004,.003,.74,'metal');break;
 case 'barTable':table(.7,.7,1.05,'pedestal','metal');break;
 case 'console':cabinet(1.24,.73,.45,2,1,'doors',.14);for(let i=0;i<28;i++)box('ribbed-front',-.6+(i+.5)*1.2/28,.41,.246,.01,.5,.008,'metal');break;
 case 'display':cabinet(.65,1.55,.38,1,4,'glass',.15);break;
 case 'drinksCabinet':cabinet(1.6,1.05,.45,3,2,'open',.16);for(const x of [-.55,.55])box('solid-door',x,.61,.24,.5,.85,.025);for(let i=0;i<5;i++)box('bottle-slot',-.24+(i+.5)*.48/5,.28,.1,.012,.22,.3);if(open)box('fold-down-bar',0,.55,.52,.5,.025,.55);else box('bar-door',0,.77,.24,.5,.43,.025);break;
 case 'shelf':case 'custom':for(let r=0;r<3;r++)for(let c=0;c<4;c++){if((r===2&&c===0)||(r===1&&c===3))continue;const x=(c-1.5)*.42,y=.06+r*.42;box('module-bottom',x,y,0,.42,.025,.35);box('module-top',x,y+.4,0,.42,.025,.35);for(const a of [-1,1])box('module-side',x+a*.198,y+.2,0,.025,.4,.35);if((r+c)%3===0)box('module-door',x,y+.2,.17,.39,.38,.025);}break;
 case 'credenza':cabinet(1.5,.45,.35,2,1,'doors',.03);for(const x of [-.75,0,.75])for(const z of [-.175,.175])rod('chrome-frame',[x,.03,z],[x,.45,z],.018,'metal');for(const y of [.03,.45])for(const z of [-.175,.175])rod('chrome-frame',[-.75,y,z],[.75,y,z],.018,'metal');break;
 case 'partition':cabinet(1.47,1.47,.39,4,4,'open',0);parts=parts.filter(p=>p.role!=='cabinet-back');break;
 case 'tv':base('tv',{width:180,height:55,depth:40,front:'closed'});break;
 case 'mediaWall':case 'mediaShelf':add('tv',0,.04);for(const x of [-1.2,1.2]){const start=parts.length;cabinet(.55,2.05,.4,1,4,id==='mediaWall'?'glass':'open',.05);for(let i=start;i<parts.length;i++)parts[i].position[0]+=x;}if(id==='mediaWall'){box('upper-media-cabinet',0,1.86,0,1.8,.38,.35);box('screen-placeholder',0,1.16,.1,1.15,.65,.035,'metal');}break;
 case 'bed':bed(1.8,2.1,1.1);break;
 case 'storageBed':bed(1.6,2.0,.9);if(open){parts=parts.filter(p=>!['mattress','bed-pillow'].includes(p.role));box('lifted-mattress',0,.86,-.04,1.55,.18,1.95,'fabric','rounded',[-.45,0,0]);for(const x of [-.7,.7])rod('lift-support',[x,.3,.4],[x,.77,.1],.02,'metal');}break;
 case 'headboard':for(let i=0;i<15;i++)box('headboard-slat',0,.06+i*.06,0,2.4,.035,.035);for(const x of [-.9,.9])box('bedside-shelf',x,.39,.12,.4,.035,.3);break;
 case 'daybed':bed(.9,2.05,.9,false);for(const z of [-1.0,1.0])box('daybed-end',0,.52,z,.93,.75,.035);box('daybed-back',-.46,.52,0,.035,.75,2.05);for(let i=0;i<3;i++){box('daybed-drawer',.475,.22,(i-1)*.65,.025,.24,.62);box('drawer-pull',.5,.23,(i-1)*.65,.035,.025,.1,'metal');}break;
 case 'nightstand':legs(.48,.38,.54);box('nightstand-top',0,.56,0,.48,.03,.38);box('nightstand-shelf',0,.13,0,.44,.025,.34);box('drawer',0,.47,0,.42,.14,.33);box('drawer-pull',0,.47,.18,.05,.03,.035,'metal');break;
 case 'wardrobe':cabinet(1.5,2.2,.6,3,1,'doors',.06);break;
 case 'slidingWardrobe':cabinet(1.5,2.2,.6,2,4,'open',.06);for(let i=0;i<2;i++)box('sliding-door',open?-.34+i*.15:-.375+i*.75,1.13,.315+i*.022,.74,2.13,.025);break;
 case 'cornerWardrobe':{const start=parts.length;cabinet(1.4,2.2,.6,2,4,'open',.05);for(let i=start;i<parts.length;i++)parts[i].position[0]-=.7;const before=parts.length;cabinet(1.1,2.2,.6,2,4,'open',.05);for(let i=before;i<parts.length;i++){const p=parts[i],[x,y,z]=p.position;p.position=[z+.3,y,-x+.85];p.yaw=Math.PI/2;}}break;
 case 'dresser':cabinet(.9,.9,.47,1,5,'drawers',.12);break;
 case 'tallboy':cabinet(.8,1.23,.48,1,6,'drawers',.04);break;
 case 'vanity':table(1,.5,.75);box('vanity-drawer',0,.64,0,.8,.14,.42);box('mirror-frame',0,1.12,-.21,.67,.75,.045,'wood','rounded');box('mirror',0,1.12,-.18,.61,.69,.012,'mirror','rounded');break;
 case 'mirror':box('mirror-frame',0,.6,0,.45,1.2,.035,'wood','rounded');box('mirror-face',0,.6,.023,.42,1.17,.008,'mirror','rounded');break;
 case 'dressingIsland':cabinet(1.6,.86,.85,3,3,'drawers',.05);box('glass-island-top',0,.9,0,1.62,.03,.87,'glass');break;
 case 'closetSystem':cabinet(1.75,2.22,.51,3,5,'open',.05);parts=parts.filter(p=>p.role!=='cabinet-back');for(const x of [-.59,0,.59])rod('clothes-rail',[x-.25,1.8,0],[x+.25,1.8,0],.025,'metal');break;
 case 'dresuar':legs(1.1,.35,.75);box('hall-console-top',0,.78,0,1.1,.04,.35);box('hall-console-shelf',0,.22,0,1.02,.025,.3);break;
 case 'shoeCabinet':cabinet(.89,1.27,.3,1,2,'open',.12);for(const y of [.42,.98]){box('tilting-shoe-door',0,y,.17,.83,.52,.025,'wood','box',open?[.35,0,0]:null);box('shoe-rack',0,y-.1,.04,.78,.025,.23);}break;
 case 'coatStorage':add('shoeBench');for(const x of [-.4,.4])rod('hall-upright',[x,.1,-.13],[x,1.9,-.13],.035,'metal');rod('coat-top',[-.4,1.9,-.13],[.4,1.9,-.13],.035,'metal');for(let i=0;i<5;i++)rod('hook',[-.33+i*.165,1.8,-.13],[-.33+i*.165,1.8,.02],.025,'metal');break;
 case 'coatRack':rod('wall-rail',[-.3,.18,0],[.3,.18,0],.025,'metal');for(let i=0;i<5;i++)rod('coat-hook',[-.25+i*.125,.18,0],[-.25+i*.125,.08,.07],.025,'metal');break;
 case 'shoeBench':woodenBench(.8,.35,.52,'metal');for(const y of [.10,.29])box('shoe-mesh-shelf',0,y,0,.73,.02,.3,'metal');break;
 case 'desk':table(1.4,.6,.74);break;
 case 'officeChair':seat(.56,.57,1.1,true);parts=parts.filter(p=>p.role!=='leg');box('gas-column',0,.24,0,.065,.43,.065,'metal','round');for(let i=0;i<5;i++){const a=i*2*Math.PI/5,x=Math.cos(a)*.33,z=Math.sin(a)*.33;rod('five-star-base',[0,.13,0],[x,.065,z],.035,'metal');box('caster',x,.04,z,.06,.035,.06,'metal','round',[Math.PI/2,0,0]);}break;
 case 'deskPedestal':cabinet(.36,.7,.58,1,5,'drawers',.03);break;
 case 'wallDesk':box('wall-mount',0,.36,-.28,.72,.72,.04);if(open){box('folding-top',0,.38,.02,.74,.025,.6);rod('support-strut',[0,.08,-.25],[0,.35,.19],.025,'metal');}else box('folded-top',0,.38,-.24,.74,.6,.025);break;
 case 'childBed':bed(.96,2.06,.8);break;
 case 'bunk':case 'loft':{const w=1.0,d=2.1,h=1.65;for(const x of [-.48,.48])for(const z of [-1.0,1.0])box('bed-post',x,h/2,z,.06,h,.06);for(const y of id==='bunk'?[.32,1.35]:[1.35]){box('bed-deck',0,y,0,w,.06,d);box('mattress',0,y+.10,0,w-.06,.13,d-.08,'fabric','rounded');}for(const x of [-.48,.48])for(const y of [1.52,1.65])box('guardrail',x,y,0,.035,.055,d);for(let i=0;i<6;i++)box('ladder-rung',.35,.18+i*.24,1.07,.3,.035,.04);if(id==='loft'){box('desk-top',0,.74,-.2,.9,.04,1.3);box('storage-support',-.33,.35,-.5,.22,.7,.55);}}break;
 case 'trundle':bed(.96,2.06,.82);box('underbed-base',open?.65:0,.16,.05,.9,.09,1.95);box('underbed-mattress',open?.65:0,.24,.05,.87,.10,1.91,'fabric','rounded');break;
 case 'toyStorage':cabinet(.99,.94,.44,3,3,'open',.03);for(let c=0;c<3;c++)for(let r=0;r<3;r++)box('removable-bin',-.33+c*.33,.16+r*.29,.01,.29,.23,.36,'plastic','rounded',null,{color:r%2?'#c7bb92':'#748d72'});break;
 case 'childTable':table(.76,.5,.5);for(const x of [.52,.8])for(const z of [-.14,.14])box('child-chair-leg',x,.135,z,.03,.27,.03);box('child-chair-seat',.66,.285,0,.32,.03,.32);box('child-chair-back',.66,.44,-.14,.32,.22,.03);break;
 case 'crib':{const w=.75,d=1.45,h=.9;box('cot-mattress',0,.38,0,w-.06,.08,d-.07,'fabric');for(const z of [-d/2,d/2])box('cot-end',0,h/2,z,w,h,.035);for(const x of [-w/2,w/2]){box('cot-top-rail',x,.86,0,.035,.05,d);box('cot-base-rail',x,.29,0,.035,.06,d);for(let i=0;i<18;i++)box('cot-spindle',x,.58,-d/2+.05+i*(d-.1)/17,.02,.55,.02);}legs(w,d,.12);}break;
 case 'changing':cabinet(.9,.87,.52,1,3,'drawers',.05);box('changing-top',0,.91,.12,.94,.035,.78);for(const x of [-.45,.45])box('changing-side-guard',x,.96,.12,.025,.10,.78);box('changing-mat',0,.95,.12,.83,.04,.66,'fabric','rounded');break;
 case 'nurseryWardrobe':cabinet(.8,1.7,.5,2,1,'doors',.15);box('base-drawer',0,.25,.27,.74,.18,.025);break;
 case 'kitchenWorktop':cabinet(2.4,.86,.6,4,2,'drawers',.08);box('counter-left',-.88,.885,0,.64,.03,.65,'ceramic');box('counter-right',.62,.885,0,1.24,.03,.65,'ceramic');box('counter-rear',-.3,.885,-.26,.52,.03,.13,'ceramic');box('counter-front',-.3,.885,.26,.52,.03,.13,'ceramic');box('sink-bowl',-.3,.8,0,.5,.02,.36,'metal');rod('tap',[-.3,.9,-.23],[-.3,1.15,-.23],.025,'metal');rod('spout',[-.3,1.15,-.23],[-.3,1.15,-.06],.025,'metal');break;
 case 'kitchenBase':cabinet(.6,.88,.6,1,2,'open',.08);box('worktop',0,.905,0,.63,.04,.63);break;
 case 'kitchenWall':cabinet(.6,1,.37,1,3,'open',0);box('half-open-door',-.17,.5,.23,.3,.96,.025,'wood','box',null,{yaw:-.45});break;
 case 'pantry':cabinet(.6,2.2,.6,1,6,'open',.08);box('pantry-door',-.2,1.14,.36,.6,2.1,.025,'wood','box',null,{yaw:-.55});break;
 case 'island':cabinet(1.26,.88,.79,2,2,'open',.1);box('oak-worktop',0,.92,0,1.32,.055,.85);for(const x of [-.6,.6])rod('island-post',[x,.9,-.35],[x,1.93,-.35],.035,'metal');rod('hanging-rack',[-.6,1.93,-.35],[.6,1.93,-.35],.035,'metal');break;
 case 'kitchenCart':for(const x of [-.16,.16])for(const z of [-.21,.21]){rod('trolley-post',[x,.06,z],[x,.77,z],.025,'metal');box('trolley-caster',x,.04,z,.06,.035,.06,'metal','round',[Math.PI/2,0,0]);}for(const y of [.18,.44,.7]){box('trolley-tray',0,y,0,.35,.025,.45,'metal','rounded');for(const x of [-.165,.165])box('tray-rim',x,y+.04,0,.018,.08,.44,'metal');}break;
 case 'vanityUnit':cabinet(.8,.62,.48,1,2,'drawers',0);box('basin-rim',0,.65,0,.83,.05,.51,'ceramic');box('basin-inner',0,.68,0,.55,.01,.32,'plastic',null,null,{color:'#d8dfdb'});rod('tap-stem',[0,.67,-.18],[0,.87,-.18],.025,'metal');rod('tap-spout',[0,.87,-.18],[0,.87,-.03],.025,'metal');break;
 case 'bathCabinet':cabinet(.4,1.95,.35,1,5,'doors',.05);break;
 case 'mirrorCabinet':cabinet(.8,.95,.15,2,2,'open',0);for(const x of [-.2,.2])box('mirror-door',x,.49,.09,.39,.93,.018,'mirror');box('lighting-bar',0,.97,.12,.78,.025,.025,'ceramic');break;
 case 'laundryCabinet':cabinet(.6,2.1,.55,1,4,'doors',.06);box('laundry-worktop',.67,.91,0,.7,.04,.62);box('appliance-placeholder',.67,.44,0,.6,.86,.56,'plastic',null,null,{color:'#e6e7df'});box('washing-door',.67,.44,.29,.4,.04,.4,'mirror','round',[Math.PI/2,0,0]);box('upper-laundry-shelf',.67,1.7,-.05,.7,.035,.4);break;
 case 'outdoorSofa':case 'outdoorChair':{const w=id==='outdoorSofa'?1.8:.75;woodenBench(w,.76,.4);box('outdoor-cushion',0,.48,.02,w-.1,.15,.67,'fabric','rounded');for(let j=0;j<4;j++)box('back-slat',0,.52+j*.1,-.35,w,.06,.04);for(const x of [-w/2,w/2]){rod('arm-upright',[x,.05,-.3],[x,.85,-.3],.05);box('wood-arm',x,.66,0,.07,.05,.72);}box('outdoor-back-pad',0,.69,-.26,w-.1,.4,.13,'fabric','rounded');}break;
 case 'outdoorBench':woodenBench(1.7,.34,.45,'metal');break;
 case 'sunLounger':woodenBench(.65,1.9,.32);parts=parts.filter(p=>p.role!=='slat');slats(.63,1.25,.34,12);box('reclining-back',0,.62,-.77,.63,.045,.85,'wood','rounded',[-.6,0,0]);box('sunlounger-pad',0,.39,.15,.59,.07,1.15,'fabric','rounded');box('sunlounger-back-pad',0,.67,-.77,.59,.07,.82,'fabric','rounded',[-.6,0,0]);break;
 case 'outdoorTable':table(2,.75,.74,'rect','metal');box('table-centre-seam',0,.762,0,.006,.003,.75,'metal');break;
 case 'outdoorSide':table(.65,.65,.4,'rect','metal');parts=parts.filter(p=>p.role!=='table-top');slats(.65,.65,.4,9,'metal');break;
 case 'outdoorStorage':cabinet(.9,1.6,.35,2,3,'doors',.16);for(let i=0;i<18;i++)box('ventilation-line',-.42+(i+.5)*.84/18,1.22,.19,.012,.25,.004,'metal');break;
 case 'livingSet':add('sofa',0,-.6);add('armchair',-1.7,.8,Math.PI/2);add('coffee',0,.8);break;
 case 'diningSet':add('extendableTable');for(const x of [-.55,.55])for(const z of [-.85,.85])add('diningChair',x,z,z>0?0:Math.PI);break;
 case 'bedroomSet':add('bed');add('nightstand',-1.25,-.8);add('nightstand',1.25,-.8);add('dresser',2.3,.5,-Math.PI/2);break;
 case 'kidsSet':add('loft');add('toyStorage',1.25,-.5,Math.PI/2);break;
 case 'nurserySet':add('crib');add('changing',1.3,.2);add('nurseryWardrobe',-1.15,.2);break;
 case 'outdoorSet':add('outdoorSofa',0,-.6);add('outdoorChair',-1.4,.7,Math.PI/2);add('outdoorSide',0,.6);parts=parts.map(p=>p.material==='wood'?{...p,material:'metal'}:p);break;
 default:throw Error('Missing reference geometry: '+id);
 }
 if(['crib','bunk','loft','daybed','sunLounger'].includes(id))parts=parts.map(p=>({...p,position:[p.position[2],p.position[1],-p.position[0]],yaw:(p.yaw||0)+Math.PI/2}));
 // Fit measured extents, including rotated parts, then put every study on the floor.
 const vertices=parts.flatMap(partCorners),min=[0,1,2].map(a=>Math.min(...vertices.map(v=>v[a]))),max=[0,1,2].map(a=>Math.max(...vertices.map(v=>v[a]))),offset=[(min[0]+max[0])/2,min[1],(min[2]+max[2])/2];
 const scale=options.scale||1;parts=parts.map(p=>({...p,position:p.position.map((v,a)=>(v-offset[a])*scale),size:p.size.map(v=>v*scale)}));
 const [width,height,depth]=max.map((v,a)=>(v-min[a])*scale),state={family:PRODUCTS[id].family||'console',width:Math.round(width*100),height:Math.round(height*100),depth:Math.round(depth*100),wood:options.wood||'oak',fabric:options.fabric||'taupe',weave:options.weave||'plain',referenceProduct:id};
 return {state,width,height,depth,parts,referenceProduct:id,dimensionsEstimated:true,stage:'reference-study',pose};
}
