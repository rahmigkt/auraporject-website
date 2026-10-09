/** Mizan deterministic mathematical core. Angles in radians, time in cycles. */
export const TAU = Math.PI * 2;
export const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export const mod=(x,n)=>((x%n)+n)%n;
export function dft(points) {
 const n=points.length, out=[];
 for(let k=0;k<n;k++) {let re=0,im=0;for(let j=0;j<n;j++){const a=TAU*k*j/n,c=Math.cos(a),s=Math.sin(a);re+=points[j].x*c+points[j].y*s;im+=points[j].y*c-points[j].x*s;}
 re/=n;im/=n;out.push({freq:k<=n/2?k:k-n,re,im,amp:Math.hypot(re,im),phase:Math.atan2(im,re)});}
 return out.sort((a,b)=>b.amp-a.amp);
}
export function chain(coeff,t,n=coeff.length,origin={x:0,y:0}) {
 let x=origin.x,y=origin.y;const nodes=[];
 for(const c of coeff.slice(0,n)){const a=TAU*c.freq*t+c.phase;const nx=x+c.amp*Math.cos(a),ny=y+c.amp*Math.sin(a);nodes.push({x,y,nx,ny,r:c.amp,freq:c.freq});x=nx;y=ny;}
 return {x,y,nodes};
}
export function reconstruct(coeff,n,count=512){return Array.from({length:count},(_,i)=>chain(coeff,i/count,n));}
export function relativeError(points,coeff,n){let e=0,p=0;const mx=points.reduce((s,v)=>s+v.x,0)/points.length,my=points.reduce((s,v)=>s+v.y,0)/points.length;points.forEach((v,i)=>{const q=chain(coeff,i/points.length,n);e+=(v.x-q.x)**2+(v.y-q.y)**2;p+=(v.x-mx)**2+(v.y-my)**2;});return p?Math.sqrt(e/p)*100:0;}
export function normalize(points){const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));const s=2/Math.max(maxX-minX,maxY-minY,1e-8);return points.map(p=>({x:(p.x-(minX+maxX)/2)*s,y:(p.y-(minY+maxY)/2)*s}));}
export function resample(points,count=256){if(points.length<2)throw Error('En az iki nokta gerekli.');const p=[...points,points[0]],ds=[0];for(let i=1;i<p.length;i++)ds.push(ds[i-1]+Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y));if(ds.at(-1)<1e-8)throw Error('Çizim çok küçük.');let j=1;return Array.from({length:count},(_,i)=>{const d=i/count*ds.at(-1);while(j<ds.length-1&&ds[j]<d)j++;const a=(d-ds[j-1])/(ds[j]-ds[j-1]||1);return {x:p[j-1].x+(p[j].x-p[j-1].x)*a,y:p[j-1].y+(p[j].y-p[j-1].y)*a};});}
export function correlation(points){const n=points.length,mx=points.reduce((s,p)=>s+p.x,0)/n,my=points.reduce((s,p)=>s+p.y,0)/n;let xx=0,yy=0,xy=0;for(const p of points){xx+=(p.x-mx)**2;yy+=(p.y-my)**2;xy+=(p.x-mx)*(p.y-my);}return {r:xx&&yy?xy/Math.sqrt(xx*yy):null,mx,my,slope:xx?xy/xx:0,intercept:xx?my-xy/xx*mx:my};}
export function integral(n){let s=0;const h=Math.PI/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++)s+=Math.sin((i+.5)*h)**3*Math.sin((j+.5)*h)**3*h*h;return s;}
export function field(x,y,a=1,w=1){const r2=x*x+y*y;return {x:-w*y-a*x*r2,y:w*x-a*y*r2};}
export function fieldPosition(x,y,t,a=1,w=1){const r=Math.hypot(x,y)/Math.sqrt(1+2*a*(x*x+y*y)*t),q=Math.atan2(y,x)+w*t;return {x:r*Math.cos(q),y:r*Math.sin(q)};}
export function tusi(t,r=1){const a=t*TAU;return {center:{x:r*Math.cos(a),y:r*Math.sin(a)},point:{x:2*r*Math.cos(a),y:0}};}
export function squarePoint(t){const q=mod(t,1)*4,i=Math.floor(q),v=q-i;const pts=[{x:1,y:-1},{x:1,y:1},{x:-1,y:1},{x:-1,y:-1},{x:1,y:-1}];return {x:pts[i].x+(pts[i+1].x-pts[i].x)*v,y:pts[i].y+(pts[i+1].y-pts[i].y)*v};}
export function squareChain(t,n,p=2){let x=0,y=0;const nodes=[];for(let k=0;k<n;k++){const f=2*k+1,r=1/f**p,q=squarePoint(t*f);nodes.push({x,y,r,nx:x+r*q.x,ny:y+r*q.y});x+=r*q.x;y+=r*q.y;}return {x,y,nodes};}
export function music(x){const s=Math.floor(x)+.5,d=Math.floor(2.27+1.2*Math.sin(Math.PI*(s+1)/8)-Math.cos(Math.PI*s/4));const semitone=Math.floor((12*d+5)/7);return {d,semitone,freq:261.63*2**(semitone/12)};}
export function validateScene(o){
 if(!o||o.version!==1||!['pi','clef','horse','music','correlation','square','field','surface','tusi','motors'].includes(o.scene))throw Error('Geçerli bir Mizan sahne dosyası değil.');
 const defaults={n:32,speed:1,zoom:1,phase:0,power:2,attraction:1,swirl:1,blend:.7,grid:true,rings:true,trace:true,target:true,mode:'both',duration:16,ratio:'wide'};
 const ranges={n:[1,256],speed:[.1,3],zoom:[.4,2.5],phase:[0,360],power:[.5,3],attraction:[0,2],swirl:[-3,3],blend:[-1,1],duration:[4,120]};
 for(const [k,v] of Object.entries(o.settings||{})){if(k in ranges){if(typeof v!=='number'||!Number.isFinite(v))throw Error('Sayısal ayar geçersiz.');defaults[k]=clamp(v,...ranges[k]);}else if(['grid','rings','trace','target'].includes(k))defaults[k]=Boolean(v);else if(k==='mode'&&['both','surface','bars'].includes(v))defaults[k]=v;else if(k==='ratio'&&['wide','square','portrait'].includes(v))defaults[k]=v;}
 defaults.n=Math.round(defaults.n);
 const motors=(o.motors||[]).slice(0,32).map(m=>{if(!['amp','freq','phase'].every(k=>Number.isFinite(m[k])))throw Error('Motor değeri geçersiz.');return {amp:clamp(m.amp,0,2),freq:Math.round(clamp(m.freq,-30,30)),phase:clamp(m.phase,-360,360),shape:["circle","square","triangle"].includes(m.shape)?m.shape:"circle"};});
 if(o.scene==='motors'&&Array.isArray(o.motors)&&!motors.length)throw Error('En az bir motor gerekli.');
 let custom=null;if(o.custom){if(!Array.isArray(o.custom)||o.custom.length<2||o.custom.length>2048||!o.custom.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<1e5&&Math.abs(p.y)<1e5))throw Error('Çizim verisi geçersiz.');custom=o.custom.length===256?o.custom.map(p=>({x:p.x,y:p.y})):normalize(resample(o.custom));}
 return {version:1,scene:o.scene,settings:defaults,motors,custom,title:String(o.title||'Yeni sahne').slice(0,120),note:String(o.note||'').slice(0,1200)};
}

// Regular polygons use circumradius 1 and constant speed along each edge.
export function orbitPoint(shape,t){
 if(!shape||shape==='circle')return {x:Math.cos(TAU*t),y:Math.sin(TAU*t)};
 const n=shape==='triangle'?3:4,q=mod(t,1)*n,k=Math.floor(q),u=q-k;
 const a=TAU*k/n,b=TAU*(k+1)/n;
 return {x:(1-u)*Math.cos(a)+u*Math.cos(b),y:(1-u)*Math.sin(a)+u*Math.sin(b)};
}
export function motorChain(motors,t,n=motors.length){
 let x=0,y=0;const nodes=[];
 for(const m of motors.slice(0,n)){const q=orbitPoint(m.shape,m.freq*t+m.phase/360),nx=x+m.amp*q.x,ny=y+m.amp*q.y;
 nodes.push({x,y,nx,ny,r:m.amp,shape:m.shape||'circle'});x=nx;y=ny;}
 return {x,y,nodes};
}
