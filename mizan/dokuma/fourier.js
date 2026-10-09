// Arc-length sampling and complex DFT. Screen coordinates: positive y points down.
export const TAU=2*Math.PI;
export const COUNTS=[1,2,3,5,10,20,50,100,255];
export function samplePath(path,n=256){
 const pts=path.pts.filter((p,i,a)=>!i||Math.hypot(p.x-a[i-1].x,p.y-a[i-1].y)>1e-10);
 if(pts.length<2)return Array.from({length:n},()=>({...pts[0]||{x:0,y:0}}));
 const route=path.closed?[...pts,pts[0]]:[...pts,...pts.slice(0,-1).reverse()];
 const lens=[0];for(let i=1;i<route.length;i++)lens.push(lens.at(-1)+Math.hypot(route[i].x-route[i-1].x,route[i].y-route[i-1].y));
 let j=1;return Array.from({length:n},(_,i)=>{const d=lens.at(-1)*i/n;while(j<lens.length-1&&lens[j]<d)j++;const u=(d-lens[j-1])/(lens[j]-lens[j-1]||1);return {x:route[j-1].x+(route[j].x-route[j-1].x)*u,y:route[j-1].y+(route[j].y-route[j-1].y)*u}});
}
export function analyze(path,n=256){const samples=samplePath(path,n),terms=[];for(let j=0;j<n;j++){let re=0,im=0;const k=j>n/2?j-n:j;for(let t=0;t<n;t++){const a=TAU*k*t/n,c=Math.cos(a),s=Math.sin(a);re+=samples[t].x*c+samples[t].y*s;im+=samples[t].y*c-samples[t].x*s;}re/=n;im/=n;terms.push({k,re,im,amp:Math.hypot(re,im),angle:Math.atan2(im,re)});}const dc=terms.shift();terms.sort((a,b)=>b.amp-a.amp||Math.abs(a.k)-Math.abs(b.k)||a.k-b.k);return {samples,dc,terms,closed:path.closed};}
export function chain(model,count,t){let x=model.dc.re,y=model.dc.im;const links=[];for(const c of model.terms.slice(0,count)){const a=TAU*c.k*t+c.angle,nx=x+c.amp*Math.cos(a),ny=y+c.amp*Math.sin(a);links.push({x,y,nx,ny,r:c.amp,k:c.k});x=nx;y=ny;}return {x,y,links};}
export function trace(model,count,n=256){const end=model.closed?1:.5;return Array.from({length:n+1},(_,j)=>{const p=chain(model,count,end*j/n);return {x:p.x,y:p.y}});}
export function relativeError(model,count){const all=model.terms.reduce((a,c)=>a+c.amp*c.amp,0),tail=model.terms.slice(count).reduce((a,c)=>a+c.amp*c.amp,0);return all?100*Math.sqrt(tail/all):0;}
