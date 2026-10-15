// Eleven reference families rebuilt from geometry. build(n) returns shapes {id,pts,tone,fill,closed,...}; n is the count that the film raises.
import {TAU,lerp,bez,arc,circle,rot,mov,scl,flipX,leaf,place,strip,spiral,at,S,L} from './prim.js';
const PI=Math.PI,sup=n=>String(n).replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const dir=(a,r)=>[r*Math.cos(a),r*Math.sin(a)];
const mir4=(id,pts,tone,o={})=>[[1,1],[-1,1],[1,-1],[-1,-1]].map(([sx,sy],k)=>S(id+'.'+k,pts.map(([x,y])=>[x*sx,y*sy]),tone,o));
const mirX=(id,pts,tone,o={})=>[S(id+'.r',pts,tone,o),S(id+'.l',flipX(pts),tone,o)];
const fleuron=(id,cx,cy,ang,s,tone='ink')=>[S(id+'.c',place(leaf(.3*s,.07*s,.7),cx,cy,ang),tone),...[1,-1].map(k=>S(id+'.'+k,place(leaf(.2*s,.05*s,.7),cx,cy,ang+k*.62),tone))];
const dotS=(id,x,y,r,tone='ink')=>S(id,circle(x,y,r,14),tone);

// 1 ─ Çan çiçeği (bellflower): n = number of rim lobes
function bell(id,cx,cy,sc,rotA,n){
 const W=.44*sc,H=.95*sc,A=.22*sc,rim=[];
 for(let i=0;i<=n*6;i++){const u=i/(n*6),x=lerp(-W,W,u),y=A*(1-Math.pow(Math.abs(Math.sin(PI*n*u)),.8));rim.push([x,y+.16*sc*Math.pow(Math.abs(2*u-1),2)]);}
 const R=rim.at(-1),Lf=rim[0],wR=[.07*sc,-H],wL=[-.07*sc,-H];
 const body=[...rim,...bez(R,[R[0]*.9,-H*.3],[wR[0]*3,-H*.65],wR,18).slice(1),...bez(wL,[wL[0]*3,-H*.65],[Lf[0]*.9,-H*.3],Lf,18).slice(1)];
 const T=p=>mov(rot(scl(p,1),rotA),cx,cy),out=[S(id+'.b',T(body),'soft',{tone2:'accent',edge:'accent'})];
 for(let k=1;k<n;k++){const u=k/n,x=lerp(-W,W,u);out.push(L(id+'.v'+k,T(bez([x,A*.4],[x*.85,-H*.3],[x*.2,-H*.7],[0,-H*.96],16)),'accent'));}
 for(let k=0;k<n;k++){const a=PI/2+(k-(n-1)/2)*Math.min(.5,1.7/n);out.push(S(id+'.s'+k,T(place(leaf(H*.42,H*.075,.7),0,-H*.95,a)),'ink'));}
 return out;
}
function bellflower(n){
 const f1=bell('A',-.2,.5,1.1,.1,n),f2=bell('B',.58,.18,.74,-.28,Math.max(3,n-1)),st=[];
 st.push(S('st.a',strip(bez([-.2+.04,-.55],[0,-.7],[.05,-.95],[.35,-1.3],28),t=>.075-.035*t),'soft'));
 st.push(S('st.b',strip(bez([.58+.08,-.4],[.25,-.7],[.2,-.9],[.12,-1.0],28),t=>.06-.02*t),'soft'));
 return [...st,...f1,...f2];
}
// 2 ─ Nilüfer yelpazesi: n = ribs per fan
function fan(id,cx,cy,rotA,R,al,n,tone='ink'){
 const T=p=>mov(rot(p,rotA),cx,cy),out=[];
 out.push(L(id+'.o',T([[0,0],...arc(0,0,R,PI/2+al,PI/2-al,40),[0,0]]),tone));
 for(let i=1;i<=n;i++){const a=PI/2-(-al+2*al*i/(n+1));out.push(L(id+'.r'+i,T([dir(a,.2*R),dir(a,R)]),tone));}
 out.push(S(id+'.j',T([[0,0],[-.05,.08],[0,.17],[.05,.08]]),tone));
 return out;
}
function nilufer(n){
 const o=[...fan('c',0,.34,0,.55,.87,n),...fan('l',-.6,0,.95,.52,.87,n),...fan('r',.6,0,-.95,.52,.87,n)];
 o.push(L('s.c',[[0,.34],[0,-1]],'ink'));
 for(const s of [-1,1]){o.push(L('s.a'+s,bez([s*.6,0],[s*.52,-.4],[s*.2,-.62],[0,-1],26),'ink'));o.push(L('s.b'+s,bez([s*.38,.12],[s*.3,-.28],[s*.1,-.62],[0,-1],26),'ink'));}
 [[0,.08],[0,-.08],[.08,0],[-.08,0]].forEach(([x,y],i)=>o.push(dotS('d'+i,x,-1.2+y,.022)));
 return o;
}
// 3 ─ Palmet (anthemion): n = petals per side
function volute(id,s,cx,cy,tone){const c=spiral(cx,cy,.34,.05,-PI/2-s*.6,1.6,s,90);return S(id,strip(c,t=>.025+.13*(1-t)),tone);}
function palmet(n){
 const o=[],thMax=1.45;
 for(let j=0;j<=n;j++){const f=j/n,phi=thMax*f,len=lerp(.98,.42,f),dphi=thMax/n,wid=Math.min(.085,Math.max(.022,.21*len*dphi));
  for(const sd of (j?[1,-1]:[1])){const a=PI/2-sd*phi,[x0,y0]=dir(a,.1);o.push(S('p'+(sd>0?'r':'l')+j,place(leaf(len,wid,.7),x0,.02+y0,a),'ink'));}}
 o.push(S('kite',[[0,-.02],[.1,.12],[0,.3],[-.1,.12]].map(([x,y])=>[x,y*.7]),'accent'));
 for(const s of [-1,1])o.push(volute('v'+s,s,s*.5,-.32,'ink'));
 o.push(S('body',place(leaf(.62,.11,.6),0,.0,-PI/2),'ink'));
 return o;
}
// 4 ─ İris: n = petals per side in the upward fan
function iris(n){
 const o=[];
 o.push(S('c0',place(leaf(.7,.11,.7),0,.12,PI/2),'ink'));
 for(let j=1;j<=n;j++){const phi=.95*j/n,len=lerp(.62,.36,j/n),w=Math.min(.075,.2*len*(.95/n));for(const sd of [1,-1])o.push(S('f'+(sd>0?'r':'l')+j,place(leaf(len,w,.7),0,.12,PI/2-sd*phi),'ink'));}
 for(const sd of [1,-1])o.push(S('fall'+sd,place(leaf(.5,.13,.65),sd*.04,.08,PI/2-sd*2.15),'ink'));
 for(const sd of [1,-1])o.push(S('bud'+sd,place(leaf(.38,.1,.7),0,-.02,-PI/2+sd*.3),'ink'));
 o.push(dotS('gold',0,.02,.04,'accent'));
 o.push(S('stem',strip([[0,-.4],[0,-.82]],t=>.03),'ink'));
 for(const sd of [1,-1]){o.push(S('sc'+sd,strip(arc(sd*.38,-.55,.3,sd>0?PI*.95:PI*.05,sd>0?PI*1.9:-PI*.9,30),t=>.1*Math.sin(PI*t)**.7+.01),'ink'));o.push(volute('cv'+sd,sd,sd*.62,.0,'ink'));}
 o.push(...fleuron('tipT',0,.8,PI/2,.9),...fleuron('tipB',0,-.98,-PI/2,.8));
 o.push(dotS('dl',-.5,.12,.025),dotS('dr',.5,.12,.025));
 return o;
}
// 5 ─ Damask eşkenar dörtgen: n = leaves per edge garland
function damask(n){
 const o=[],Tp=[0,.95],Rt=[.85,0],ang=Math.atan2(Rt[1]-Tp[1],Rt[0]-Tp[0]);
 for(let k=0;k<4;k++)o.push(S('core'+k,place(leaf(.28,.075,.7),0,0,k*PI/2+PI/4),'ink'));
 o.push(dotS('eye',0,0,.05,'accent'));
 o.push(...mirX('earX',place(leaf(.42,.17,.65),.2,0,0),'ink'));
 o.push(S('earT',place(leaf(.45,.13,.65),0,.2,PI/2),'ink'),S('earB',place(leaf(.45,.13,.65),0,-.2,-PI/2),'ink'));
 for(let i=0;i<n;i++){const t=(i+.5)/n,sc=(.55+.45*Math.sin(PI*t))*Math.min(1,5/n),len=.26*sc,x=lerp(Tp[0],Rt[0],t)-.05,y=lerp(Tp[1],Rt[1],t)-.05;o.push(...mir4('g'+i,place(leaf(len,len*.3,.7),x,y,ang),'ink'));}
 o.push(...mir4('scr',strip(spiral(.4,.38,.15,.03,PI*.2,1.3,1,60),t=>.012+.06*(1-t)),'soft'));
 o.push(...fleuron('tT',0,.82,PI/2,.9),...fleuron('tB',0,-.82,-PI/2,.9),...fleuron('tR',.92,0,0,.8),...fleuron('tL',-.92,0,PI,.8));
 return o;
}
// 6 ─ Asma / akan çiçek: n = nodes along the vine
function vine(n){
 const o=[],cx=y=>.28*Math.sin(PI*y/.9),cl=Array.from({length:60},(_,i)=>{const y=-1.2+2.4*i/59;return [cx(y),y];}),f=Math.min(1,Math.pow(3.2/Math.max(n,1),.4));
 o.push(S('stem',strip(cl,t=>.04),'soft'));
 for(let k=0;k<n;k++){const y=-1.05+2.1*(k+.5)/n,s=k%2?-1:1,P=[cx(y),y],a=s>0?.55:PI-.55;
  o.push(S('lf'+k,place(leaf(.62*f,.16*f,.75),P[0],P[1],a),'ink'),L('rib'+k,[P,dir(a,.58*f).map((v,i)=>v+P[i])],'accent'));
  const Q=[P[0]-s*.3*f,P[1]+.12*f];o.push(L('br'+k,bez(P,[P[0]-s*.1,P[1]+.1*f],[Q[0]+s*.1,Q[1]-.03],Q,10),'soft'));
  for(let j=0;j<5;j++)o.push(S('pt'+k+'.'+j,place(leaf(.11*f,.045*f,.7),Q[0],Q[1],j*TAU/5+k),'accent'));o.push(dotS('ey'+k,Q[0],Q[1],.022*f,'ink'));}
 return o;
}
// 7 ─ Suzani nar: n = lobes of the pomegranate
function serr(id,x,y,ang,len,wid,teeth,tone){const up=[],dn=[];for(let k=0;k<=2*teeth+1;k++){const t=k/(2*teeth+1),h=wid*Math.sin(PI*Math.pow(t,.8))*(k%2?.62:1);up.push([len*t,h]);dn.push([len*t,-h]);}return S(id,place([...up,...dn.reverse()],x,y,ang),tone);}
function pomegranate(id,cx,cy,R,n){
 const o=[S(id+'.body',circle(cx,cy,R,40),'ink'),S(id+'.core',circle(cx,cy,.3*R,24),'accent')];
 for(let k=0;k<n;k++)o.push(S(id+'.p'+k,place(leaf(.62*R,Math.min(.2*R,PI*.55*R/n*.5),.7),cx+.3*R*Math.cos(k*TAU/n),cy+.3*R*Math.sin(k*TAU/n),k*TAU/n),'soft'));
 for(let k=0;k<5;k++)o.push(S(id+'.c'+k,place(leaf(.3*R,.09*R,.7),cx,cy+R*.98,PI/2+(k-2)*.5),'ink'));
 return o;
}
function suzani(n){
 const o=[...pomegranate('A',0,.4,.42,n),...pomegranate('B',-.5,-.45,.26,Math.max(3,Math.round(n*.7)))];
 o.push(S('stA',strip(bez([0,-.02],[.05,-.4],[-.1,-.8],[0,-1.2],24),t=>.035),'soft'),S('stB',strip(bez([-.5,-.7],[-.4,-.9],[-.1,-1.0],[0,-1.05],20),t=>.03),'soft'));
 o.push(serr('lf1',.04,-.5,-.2,.7,.17,7,'soft'),serr('lf2',-.02,-.25,PI+.5,.62,.15,7,'soft'),serr('lf3',.02,.0,PI/2+1.2,.55,.14,6,'soft'));
 return o;
}
// 8 ─ Kalp yaprak: n = nested arcs
function heartleaf(n){
 const R=.62,pm=1.9,pts=[[0,0]];
 for(let i=0;i<=80;i++){const p=-pm+2*pm*i/80,r=R*(.8+.26*Math.pow(Math.abs(Math.sin(p)),.9)+.42*Math.exp(-Math.pow(p/.16,2)));pts.push(dir(PI/2-p,r));}
 const o=[S('sil',mov(pts,0,.35),'ink')];
 for(let k=1;k<=n;k++){const r=R*k/(n+1);o.push(L('ar'+k,mov(arc(0,0,r,PI/2+1.85,PI/2-1.85,48),0,.35),'accent'));}
 for(const a of [-.9,-.45,0,.45,.9])o.push(L('rd'+a,mov([dir(PI/2-a,.1*R),dir(PI/2-a,R*(a===0?1.45:.98))],0,.35),'accent'));
 o.push(S('stem',strip([[0,.33],[0,-1.2]],t=>.028),'ink'));
 return o;
}
// 9 ─ Mısır lotus ikonları: n = icons shown (3×3 grid)
const ICONS=[
 (s)=>[L('o',[[0,.05],...arc(0,.05,.4,PI/2+1.0,PI/2-1.0,24),[0,.05]],'accent'),...[-.3,0,.3].map((a,i)=>L('r'+i,[dir(PI/2-a*1.5,.1),dir(PI/2-a*1.5,.4)].map(p=>[p[0],p[1]+.05]),'accent')),L('s',[[0,.05],[0,-.45]],'accent')],
 (s)=>[L('b',[[-.22,.0],...bez([-.22,0],[-.3,.3],[-.1,.35],[0,.38],12),...bez([0,.38],[.1,.35],[.3,.3],[.22,0],12),[.22,0],[-.22,0]],'accent'),...[1,-1].map(k=>L('v'+k,spiral(k*.32,.33,.14,.03,PI/2,1.4,k,30),'accent')),L('s',[[0,0],[0,-.45]],'accent')],
 (s)=>[...[0,1,-1].map((k,i)=>L('p'+i,place(leaf(.42,.1,.7),0,-.05,PI/2+k*.55),'accent')),...[-.22,0,.22].map((x,i)=>L('d'+i,circle(x,.43-(i===1?.03:0),.02,8),'accent')),L('s',[[0,-.05],[0,-.45]],'accent')],
 (s)=>[L('t',[[-.4,.38],[.4,.38],[0,-.1],[-.4,.38]],'accent'),L('c1',[[-.25,.3],[0,.12],[.25,.3]],'accent'),L('c2',[[-.12,.3],[0,.2],[.12,.3]],'accent'),L('m',[[0,.38],[0,-.1]],'accent'),L('s',[[0,-.1],[0,-.45]],'accent')],
 (s)=>[L('l',place(leaf(.5,.14,.7),0,-.05,PI/2-.5),'accent'),L('r',place(leaf(.5,.14,.7),0,-.05,PI/2+.5),'accent'),L('m',place(leaf(.55,.1,.7),0,-.05,PI/2),'accent'),L('mid',[[0,-.05],[0,.45]],'accent'),L('s',[[0,-.05],[0,-.45]],'accent')],
 (s)=>[L('o',[[-.4,.35],...bez([-.4,.35],[-.4,.05],[-.15,-.1],[0,-.1],10),...bez([0,-.1],[.15,-.1],[.4,.05],[.4,.35],10),[.4,.35],[-.4,.35]],'accent'),...[-.2,0,.2].map((x,i)=>L('f'+i,[[x,.35],[x*.4,-.08]],'accent')),L('s',[[0,-.1],[0,-.45]],'accent')],
 (s)=>[L('a',[...arc(0,0,.38,PI*.05,PI*.95,22)],'accent'),L('b',[[-.36,.1],[.36,.1]],'accent'),...[-.2,0,.2].map((x,i)=>L('c'+i,circle(x,.46,.035,10),'accent')),L('m',[[0,.1],[0,-.1],[-.12,-.1],[.12,-.1]],'accent'),L('s',[[0,-.1],[0,-.45]],'accent')],
 (s)=>[L('l',place(leaf(.55,.15,.7),0,-.1,PI/2-.45),'accent'),L('r',place(leaf(.55,.15,.7),0,-.1,PI/2+.45),'accent'),L('v',[[0,-.1],[0,.45]],'accent'),L('s',[[0,-.1],[0,-.45]],'accent')],
 (s)=>[L('o',[[0,.0],...arc(0,0,.44,PI/2+1.1,PI/2-1.1,24),[0,0]],'accent'),...[1,-1].map(k=>L('v'+k,spiral(k*.4,-.05,.12,.03,0,1.3,-k,30),'accent')),L('r',[[0,0],[0,.44]],'accent'),L('s',[[0,-.05],[0,-.46]],'accent')]
];
function lotus9(n){const o=[];for(let i=0;i<Math.min(n,9);i++){const cx=(i%3-1)*.82,cy=(1-Math.floor(i/3))*.82;for(const sh of ICONS[i](1))o.push({...sh,id:'i'+i+'.'+sh.id,pts:mov(scl(sh.pts,.78),cx,cy)});}return o;}
// 10 ─ İslami yıldız döşeme (kagome + yıldız): n = rings of hexagons
export const hexCount=n=>3*n*(n+1)+1,HEX_A=.1;
export function hexCells(n){const c=[];for(let q=-n;q<=n;q++)for(let r=-n;r<=n;r++)if(Math.abs(q+r)<=n)c.push({q,r,x:2*HEX_A*(q+r/2),y:2*HEX_A*r*Math.sqrt(3)/2,star:((q-r)%3+3)%3===0});return c;}
function starfield(n){
 const a=HEX_A,cells=hexCells(n),key=(q,r)=>q+','+r,has=new Set(cells.map(c=>key(c.q,c.r))),o=[];
 const tri=(c,k)=>[[c.x,c.y],[c.x+2*a*Math.cos(k*PI/3),c.y+2*a*Math.sin(k*PI/3)],[c.x+2*a*Math.cos((k+1)*PI/3),c.y+2*a*Math.sin((k+1)*PI/3)]];
 const dq=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
 for(const c of cells){for(let k=0;k<6;k++){const [q1,r1]=dq[k],[q2,r2]=dq[(k+1)%6];if(!has.has(key(c.q+q1,c.r+r1))||!has.has(key(c.q+q2,c.r+r2)))continue;
   const T=tri(c,k).map(p=>p),m=[[(T[0][0]+T[1][0])/2,(T[0][1]+T[1][1])/2],[(T[1][0]+T[2][0])/2,(T[1][1]+T[2][1])/2],[(T[2][0]+T[0][0])/2,(T[2][1]+T[0][1])/2]];
   const sid=[key(c.q,c.r),key(c.q+q1,c.r+r1),key(c.q+q2,c.r+r2)].sort().join('|');
   if(!o.find(s=>s.id==='t'+sid))o.push(S('t'+sid,m,'soft',{edge:'ground'}));}}
 for(const c of cells){const hex=Array.from({length:6},(_,k)=>[c.x+a*Math.cos(k*PI/3),c.y+a*Math.sin(k*PI/3)]);
  if(!c.star)o.push(S('h'+c.q+','+c.r,hex,'ink',{edge:'ground'}));
  else{const st=[];for(let k=0;k<6;k++){st.push([c.x+a*Math.cos(k*PI/3),c.y+a*Math.sin(k*PI/3)],[c.x+Math.sqrt(3)*a*Math.cos(k*PI/3+PI/6),c.y+Math.sqrt(3)*a*Math.sin(k*PI/3+PI/6)]);}o.push(S('s'+c.q+','+c.r,st,'paper',{edge:'ground'}));}}
 return o;
}
// 11 ─ Çini köşesi / kuş: n = leaves per garland edge and feathers per wing
function bird(n){
 const o=[],len=Math.min(.3,1.9/n*.85);
 o.push(L('stT',[[-.85,.8],[.85,.8]],'ink'),L('stL',[[-.8,.85],[-.8,-.85]],'ink'));
 for(let i=0;i<n;i++){const t=(i+.5)/n,sz=len*(.6+.5*t);o.push(S('tT'+i,place(leaf(sz,sz*.32,.45),lerp(-.78,.78,t),.8,-PI/2),'ink'),S('tL'+i,place(leaf(sz,sz*.32,.45),-.8,lerp(.78,-.78,t),0),'soft'));}
 [[.9,.9],[.82,.78],[-.9,-.9],[-.78,-.82],[.9,-.9],[.78,-.82]].forEach(([x,y],i)=>o.push(dotS('dot'+i,x,y,.04)));
 o.push(S('body',place(leaf(.62,.14,.6),.12,.0,PI+PI/4+.1),'ink'),dotS('head',.17,.08,.075,'ink'),S('beak',place(leaf(.16,.035,.9),.1,.1,2.3),'ink'));
 for(let i=0;i<n;i++){const f=n>1?i/(n-1):.5,a=lerp(.2,1.25,f),l=lerp(.72,.34,f);o.push(S('w'+i,place(leaf(l,.07,.7),.18,.0,a),'ink'),S('tl'+i,place(leaf(.34,.05,.7),-.12,-.3,PI+PI/4+lerp(-.3,.3,f)),'soft'));}
 return o;
}
// E ─ Apollonian gasket: every gap between three mutually tangent circles receives the one circle that touches all three.
// Descartes: k₄ = k₁+k₂+k₃ ± 2√(k₁k₂+k₂k₃+k₃k₁); with z = k·centre the same holds for centres, so the second root is
// the reflection k₄' = 2(k₁+k₂+k₃) − k₄, z₄' = 2(z₁+z₂+z₃) − z₄. Fractal (similarity-free) dimension ≈ 1.3057.
export function apollonian(depth){
 const C0={k:-1,x:0,y:0},C1={k:2,x:-.5,y:0},C2={k:2,x:.5,y:0},out=[{...C0,d:0,id:'o',par:[]},{...C1,d:0,id:'a',par:[]},{...C2,d:0,id:'b',par:[]}];
 const mk=(a,b,c,old,id,d)=>{const k=2*(a.k+b.k+c.k)-old.k,zx=2*(a.k*a.x+b.k*b.x+c.k*c.x)-old.k*old.x,zy=2*(a.k*a.y+b.k*b.y+c.k*c.y)-old.k*old.y;return {k,x:zx/k,y:zy/k,d,id,par:[a,b,c]};};
 // the two circles of the first level: solutions of Descartes for (C0,C1,C2): curvature 3 above and below
 const top={k:3,x:0,y:2/3,d:1,id:'t',par:[C0,C1,C2]},bot={k:3,x:0,y:-2/3,d:1,id:'u',par:[C0,C1,C2]};
 const rec=(a,b,c,old,id,d)=>{if(d>depth)return;const e=mk(a,b,c,old,id,d);out.push(e);rec(a,b,e,c,id+'0',d+1);rec(a,c,e,b,id+'1',d+1);rec(b,c,e,a,id+'2',d+1);};
 if(depth>=1){out.push(top,bot);for(const [e,old,base] of [[top,bot,'t'],[bot,top,'u']]){rec(C0,C1,e,C2,base+'0',2);rec(C0,C2,e,C1,base+'1',2);rec(C1,C2,e,C0,base+'2',2);}}
 return out;
}
function apollon(n){
 const cs=apollonian(n),o=[];
 for(const c of cs){const r=Math.abs(1/c.k);if(c.id==='o'){o.push(L('rim',arc(0,0,.97,0,TAU,96),'accent'));continue;}
  if(r<.004)continue;const R=r*.97;o.push(S('g'+c.id,circle(c.x*.97,c.y*.97,R,Math.max(16,Math.min(56,Math.round(R*160)))),c.d%2?'ink':'soft',{edge:'accent'}));}
 return o;
}
export const MOTIFS={
 cancicegi:{title:'Bellflower',tag:'REF 1',build:bellflower,counts:[2,3,4,5,6],blurb:'Bell: rim wave |sin(πnu)|, veins follow the leaf profile',f:n=>[`rim: y(u) = A·(1 − |sin(π·n·u)|)`,`n = ${n}`,`${n} lobes · ${n-1} veins`]},
 nilufer:{title:'Water-Lily Fan',tag:'REF 2',build:nilufer,counts:[1,2,3,5,7,9,11],blurb:'Circular sector with equally spaced ribs',f:n=>[`φᵢ = −α + 2α·i/(n+1),  i = 1…n`,`n = ${n}`,`ribs: 3·${n} = ${3*n}`]},
 palmet:{title:'Palmette',tag:'REF 3',build:palmet,counts:[1,2,3,4,6,8,10],blurb:'Fan leaves and Archimedean-spiral volutes',f:n=>[`r(θ) = r₀ + k·θ   (volute)`,`n = ${n}`,`leaves: 2·${n}+1 = ${2*n+1}`]},
 iris:{title:'Iris',tag:'REF 4',build:iris,counts:[1,2,3,4,5],blurb:'Mirror symmetry: half a motif and its reflection',f:n=>[`p(x,y) ↔ p(−x,y)`,`n = ${n}`,`upper fan: 2·${n}+1 = ${2*n+1} petals`]},
 damask:{title:'Damask',tag:'REF 5',build:damask,counts:[0,1,2,3,4,6,8],blurb:'Fourfold mirror: one quarter, reflected four times',f:n=>[`(x,y) → (±x, ±y)`,`n = ${n}`,`border garland: 4·${n} = ${4*n} leaves`]},
 asma:{title:'Flowing Vine',tag:'REF 6',build:vine,counts:[1,2,3,4,6,8],blurb:'Leaves and flowers alternate along a sine axis',f:n=>[`x(y) = a·sin(πy/b)`,`n = ${n}`,`nodes: ${n} · leaves ${n} · flowers ${n}`]},
 suzani:{title:'Suzani Pomegranate',tag:'REF 7',build:suzani,counts:[3,4,5,6,8,10],blurb:'Equally spaced segments inside a circle',f:n=>[`αₖ = 2πk/n,  k = 0…n−1`,`n = ${n}`,`segments: ${n}`]},
 kalpyaprak:{title:'Heart Leaf',tag:'REF 8',build:heartleaf,counts:[1,2,3,4,5,6,8],blurb:'Concentric arcs: ρₖ = R·k/(n+1)',f:n=>[`ρₖ = R·k/(n+1)`,`n = ${n}`,`arcs: ${n}`]},
 lotus:{title:'Lotus Catalogue',tag:'REF 9',build:lotus9,counts:[1,2,3,4,5,6,7,8,9],blurb:'Nine lotus icons: fan, volute, trefoil, triangle…',f:n=>[`3 × 3 grid`,`n = ${n}`,`icons: ${n} / 9`]},
 yildiz:{title:'Star Tiling',tag:'REF 10',build:starfield,counts:[0,1,2,3,5,8,12,16],blurb:'Kagome pattern: hexagon plus six triangles = six-pointed star',f:n=>[`H(n) = 3n(n+1) + 1`,`n = ${n}`,`hexagons: ${hexCount(n)}`],fit:'auto',noRepeat:true,p0:{ink:'#4a74c0',ground:'#161d33'}},
 apollon:{title:'Apollonian Circles',tag:'REF E',build:apollon,counts:[0,1,2,3,4,5,6],blurb:'Each gap between three tangent circles receives the one circle that touches all three',f:n=>[`k₄ = k₁+k₂+k₃ ± 2√(k₁k₂+k₂k₃+k₃k₁)`,`depth = ${n}`,`circles: ${n?2+Math.pow(3,n):3} · d ≈ 1.3057`]},
 kus:{title:'Tile Corner',tag:'REF 11',build:bird,counts:[2,3,4,5,6,8],blurb:'Drop leaves along the corner curl, feathers on the wing',f:n=>[`leaves: 2·${n}   ·   feathers: 2·${n}`,`n = ${n}`,`total ${4*n}`]}
};
