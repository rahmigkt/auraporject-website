// Geometric primitives for motif construction. Mathematical coordinates: y points UP.
export const TAU=Math.PI*2;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const bez=(a,b,c,d,n=24)=>Array.from({length:n+1},(_,i)=>{const t=i/n,s=1-t;return [s*s*s*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t*t*t*d[0],s*s*s*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t*t*t*d[1]];});
export const arc=(cx,cy,r,a0,a1,n=32)=>Array.from({length:n+1},(_,i)=>{const a=lerp(a0,a1,i/n);return [cx+r*Math.cos(a),cy+r*Math.sin(a)];});
export const circle=(cx,cy,r,n=20)=>arc(cx,cy,r,0,TAU,n).slice(0,-1);
export const rot=(p,th,ox=0,oy=0)=>{const c=Math.cos(th),s=Math.sin(th);return p.map(([x,y])=>[ox+(x-ox)*c-(y-oy)*s,oy+(x-ox)*s+(y-oy)*c]);};
export const mov=(p,dx,dy)=>p.map(([x,y])=>[x+dx,y+dy]);
export const scl=(p,sx,sy=sx)=>p.map(([x,y])=>[x*sx,y*sy]);
export const flipX=p=>p.map(([x,y])=>[-x,y]).reverse();
export const flipY=p=>p.map(([x,y])=>[x,-y]).reverse();
/** teardrop/leaf pointing +x from the origin; p<1 puts the widest point near the base, p=1 is a symmetric lens */
export function leaf(len,wid,p=.75,n=22){const up=[],dn=[];for(let i=0;i<=n;i++){const t=i/n,h=wid*Math.sin(Math.PI*Math.pow(t,p));up.push([len*t,h]);dn.push([len*t,-h]);}return [...up,...dn.reverse().slice(1,-1)];}
export const place=(p,x,y,ang)=>mov(rot(p,ang),x,y);
/** variable-width ribbon around a centre line; wf(t) is the full width at normalised position t */
export function strip(c,wf){const n=c.length,L=[],R=[];for(let i=0;i<n;i++){const a=c[Math.max(0,i-1)],b=c[Math.min(n-1,i+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const m=Math.hypot(tx,ty)||1;tx/=m;ty/=m;const w=wf(i/(n-1))/2;L.push([c[i][0]-ty*w,c[i][1]+tx*w]);R.push([c[i][0]+ty*w,c[i][1]-tx*w]);}return [...L,...R.reverse()];}
export const spiral=(cx,cy,r0,r1,a0,turns,dir=1,n=96)=>Array.from({length:n+1},(_,i)=>{const t=i/n,r=lerp(r0,r1,t),a=a0+dir*turns*TAU*t;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];});
export const pathLen=p=>{let s=0;for(let i=1;i<p.length;i++)s+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return s;};
/** point and heading at normalised arc length s along a polyline */
export function at(p,s){const L=pathLen(p);let d=s*L,i=1;for(;i<p.length-1;i++){const l=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(d<=l)break;d-=l;}const a=p[i-1],b=p[i],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,u=clampN(d/l,0,1);return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,ang:Math.atan2(b[1]-a[1],b[0]-a[0])};}
const clampN=(x,a,b)=>Math.min(b,Math.max(a,x));
export const S=(id,pts,tone,o={})=>({id,pts,tone,fill:true,closed:true,...o});
export const L=(id,pts,tone,o={})=>({id,pts,tone,fill:false,closed:false,...o});
