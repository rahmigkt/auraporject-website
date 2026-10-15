// Chladni figures of an ideal square plate: u = cos(nπx)cos(mπy) ± cos(mπx)cos(nπy) on [0,1]², f = F0·(n²+m²).
export const PI=Math.PI,F0=27;
export const MODES=[[1,2,1],[1,3,-1],[1,3,1],[2,3,1],[1,4,-1],[2,4,1],[3,4,1],[2,5,-1],[3,5,1]];
export const freq=(n,m)=>F0*(n*n+m*m);
export const u=(n,m,s,x,y)=>Math.cos(n*PI*x)*Math.cos(m*PI*y)+s*Math.cos(m*PI*x)*Math.cos(n*PI*y);
export const grad=(n,m,s,x,y)=>[-n*PI*Math.sin(n*PI*x)*Math.cos(m*PI*y)-s*m*PI*Math.sin(m*PI*x)*Math.cos(n*PI*y),-m*PI*Math.cos(n*PI*x)*Math.sin(m*PI*y)-s*n*PI*Math.cos(m*PI*x)*Math.sin(n*PI*y)];
export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const INTRO=3,SEG=6,BUILD=8,GROUND=5,SWATCH=3.5,OUTRO=3;
export function timeline(nSwatch=4){const a=INTRO,ae=a+MODES.length*SEG,m=ae,me=m+BUILD,g=me,ge=g+GROUND,c=ge,ce=c+nSwatch*SWATCH;return {a,ae,m,me,g,ge,c,ce,total:ce+OUTRO};}
export const modeIndex=(tl,t)=>clamp(Math.floor((t-tl.a)/SEG),0,MODES.length-1);
const fk=k=>freq(MODES[k][0],MODES[k][1]);
/** instantaneous tone frequency (Hz) of the film: glides between modes, then rests on the last one */
export function freqAt(tl,t){
 const k=modeIndex(tl,t),f=fk(k);if(t<tl.a||t>=tl.ae)return fk(MODES.length-1);
 const b=tl.a+(k+1)*SEG-.3;if(k<MODES.length-1&&t>b){const u2=smooth((t-b)/.6);return Math.exp(Math.log(f)+(Math.log(fk(k+1))-Math.log(f))*u2);}
 const b0=tl.a+k*SEG;if(k>0&&t<b0+.3){const u2=smooth((t-(b0-.3))/.6);return Math.exp(Math.log(fk(k-1))+(Math.log(f)-Math.log(fk(k-1)))*u2);}
 return f;
}
export function gainAt(tl,t){if(t<tl.a)return 0;if(t<tl.ae)return smooth((t-tl.a)/.5)*.8;return .2*(1-smooth((t-tl.ce)/2.5));}
export function makeRng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/** grains: random walk whose step length is proportional to the local plate amplitude |u| */
export class Sand{
 constructor(N=30000,seed=7){this.N=N;this.rng=makeRng(seed);this.x=new Float32Array(N);this.y=new Float32Array(N);for(let i=0;i<N;i++){this.x[i]=this.rng();this.y[i]=this.rng();}}
 step(n,m,s,s0=.022){const {x,y,rng,N}=this;for(let i=0;i<N;i++){const a=Math.min(1,Math.abs(u(n,m,s,x[i],y[i]))),r=s0*a;let nx=x[i]+(rng()-.5)*2*r,ny=y[i]+(rng()-.5)*2*r;if(nx<0)nx=-nx;if(nx>1)nx=2-nx;if(ny<0)ny=-ny;if(ny>1)ny=2-ny;x[i]=nx;y[i]=ny;}}
 meanAbs(n,m,s){let t=0;for(let i=0;i<this.N;i++)t+=Math.abs(u(n,m,s,this.x[i],this.y[i]));return t/this.N;}
}
/** class map of the plate: 0 positive, 1 negative, 2 nodal line (|u|/|∇u| below w pixels) */
export function tileMask(n,m,s,size=600,w=2.4){const M=new Uint8Array(size*size);for(let j=0;j<size;j++)for(let i=0;i<size;i++){const x=(i+.5)/size,y=(j+.5)/size,v=u(n,m,s,x,y),g=grad(n,m,s,x,y),d=Math.abs(v)/(Math.hypot(g[0],g[1])||1);M[j*size+i]=d*size<w?2:v>0?0:1;}return M;}
/** nodal set u=0 as line segments (marching squares) in unit coordinates */
export function nodalSegments(n,m,s,res=120){
 const V=[];for(let j=0;j<=res;j++){const r=[];for(let i=0;i<=res;i++)r.push(u(n,m,s,i/res,j/res));V.push(r);}
 const segs=[],ip=(a,b,fa,fb)=>a+(b-a)*(fa/(fa-fb));
 for(let j=0;j<res;j++)for(let i=0;i<res;i++){
  const a=V[j][i],b=V[j][i+1],c=V[j+1][i+1],d=V[j+1][i],x0=i/res,x1=(i+1)/res,y0=j/res,y1=(j+1)/res,p=[];
  if(a*b<0)p.push([ip(x0,x1,a,b),y0]);if(b*c<0)p.push([x1,ip(y0,y1,b,c)]);if(d*c<0)p.push([ip(x0,x1,d,c),y1]);if(a*d<0)p.push([x0,ip(y0,y1,a,d)]);
  if(p.length===2)segs.push([p[0],p[1]]);else if(p.length===4){segs.push([p[0],p[1]],[p[2],p[3]]);}
 }
 return segs;
}
/** mono 16-bit PCM of the film's sound: sine at freqAt with soft overtones and a short sand hiss after each change */
export function synth(tl,sr=44100){
 const N=Math.ceil(tl.total*sr),out=new Int16Array(N),rng=makeRng(99);let ph=0,lp=0;
 for(let i=0;i<N;i++){const t=i/sr,f=freqAt(tl,t),g=gainAt(tl,t);ph+=2*PI*f/sr;
  let s=Math.sin(ph)+.28*Math.sin(2*ph)+.12*Math.sin(3*ph);
  let hiss=0;if(t>=tl.a&&t<tl.ae){const k=modeIndex(tl,t),tt=t-(tl.a+k*SEG);hiss=Math.exp(-tt/1.6)*.5;}
  const nz=(rng()*2-1);lp+=.45*(nz-lp);s+=hiss*(nz-lp)*.6;
  out[i]=Math.max(-32767,Math.min(32767,Math.round(s*g*.42*32767)));}
 return out;
}
export function wav(samples,sr=44100){const b=Buffer.alloc(44+samples.length*2);b.write('RIFF',0);b.writeUInt32LE(36+samples.length*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples.length*2,40);for(let i=0;i<samples.length;i++)b.writeInt16LE(samples[i],44+i*2);return b;}
