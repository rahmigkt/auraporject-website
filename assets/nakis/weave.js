// Procedural woven-cloth overlays: grayscale shading (white highlights, black shadows) that sits on top of any colour.
// top(i,j)=true: the vertical (warp) thread passes OVER the weft at crossing (i,j).
import {makeRng} from './chladni-core.js';
const m=(a,n)=>((a%n)+n)%n, tri=(i,n)=>i<n/2?i:n-1-i;
export const WEAVES={
 plain:{name:'Plain Weave (Tabby)',spec:'1/1 · over 1, under 1',P:2,top:(i,j)=>(i+j)%2===0},
 twill22:{name:'2/2 Twill (Z)',spec:'2/2 · over 2, under 2, step +1',P:4,top:(i,j)=>m(i-j,4)<2},
 twill31:{name:'3/1 Twill (S)',spec:'3/1 · over 3, under 1, step +1',P:4,top:(i,j)=>m(i+j,4)<3},
 satin:{name:'5-End Satin',spec:'1/4 · float 4, step +2',P:5,top:(i,j)=>m(i*2-j,5)===0},
 basket:{name:'Basket Weave (Hopsack)',spec:'2/2 · paired threads',P:4,top:(i,j)=>(Math.floor(i/2)+Math.floor(j/2))%2===0},
 herringbone:{name:'Herringbone Twill',spec:'2/2 · twill direction reverses every 8 ends',P:16,top:(i,j)=>Math.floor(i/8)%2?m(i+j,4)<2:m(i-j,4)<2},
 diamond:{name:'Diamond Twill',spec:'2/2 · twill reverses on warp and weft',P:16,top:(i,j)=>m(tri(i,16)+tri(j,16),4)<2}
};
export const WEAVE_ORDER=['plain','twill22','twill31','satin','basket','herringbone','diamond'];
/** damask principle: the figure is woven in a contrasting structure to the ground */
export const MOTIF_WEAVE={plain:'satin',twill22:'satin',twill31:'satin',satin:'twill22',basket:'satin',herringbone:'satin',diamond:'satin'};
export const weaveFor=i=>WEAVE_ORDER[i%WEAVE_ORDER.length];
export function weaveTile(type,cell=7,repeats=1){
 const W=WEAVES[type],n=W.P*repeats*(W.P<8?Math.ceil(16/W.P):1),size=n*cell,cv=document.createElement('canvas');cv.width=cv.height=size;
 const g=cv.getContext('2d'),rng=makeRng(W.P*131+7+type.length);
 g.fillStyle='rgb(88,88,88)';g.fillRect(0,0,size,size);
 const L=v=>`rgb(${Math.round(v)},${Math.round(v)},${Math.round(v)})`;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const warp=W.top(i%W.P,j%W.P),x=i*cell,y=j*cell,v=(rng()-.5)*22,gap=1;
  const gr=warp?g.createLinearGradient(x,0,x+cell,0):g.createLinearGradient(0,y,0,y+cell);
  gr.addColorStop(0,L(104+v));gr.addColorStop(.3,L(150+v));gr.addColorStop(.5,L(196+v));gr.addColorStop(.7,L(150+v));gr.addColorStop(1,L(104+v));
  g.fillStyle=gr;
  if(warp)g.fillRect(x+gap*.5,y,cell-gap,cell);else g.fillRect(x,y+gap*.5,cell,cell-gap);
 }
 return cv;
}
