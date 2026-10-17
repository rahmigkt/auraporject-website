// Pure CPU mesh generation, used in the design worker and renderer fallback.
const sp=(x,e)=>Math.sign(x)*Math.pow(Math.abs(x),e);
export function upholsteryMesh(p,quality=1){
 const [w,h,d]=p.size,rows=quality===1?36:20,cols=quality===1?72:40,positions=[],indices=[];
 if(p.shape==='turned'){
  const profile=[[0,.52],[.07,.58],[.14,.49],[.22,.78],[.35,1],[.52,.75],[.70,.51],[.78,.83],[.87,.89],[1,.65]];
  for(const [y,r]of profile)for(let i=0;i<=cols;i++){const a=i*2*Math.PI/cols;positions.push(Math.cos(a)*w*.5*r,(y-.5)*h,Math.sin(a)*d*.5*r);}for(let j=0;j<profile.length-1;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
 }else if(p.shape==='roll'){
  for(let j=0;j<=rows;j++){const a=-Math.PI/2+j*Math.PI/rows;for(let i=0;i<=cols;i++){const b=i*2*Math.PI/cols,r=Math.pow(Math.max(0,Math.cos(a)),.2);positions.push(w*.5*r*Math.cos(b),h*.5*sp(Math.sin(a),.2),d*.5*r*Math.sin(b));}}for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
 }else{
  const nx=p.shape==='quilted'?(quality===1?80:40):(quality===1?36:20),ny=p.shape==='quilted'?(quality===1?48:24):(quality===1?24:14),half=[w/2,h/2,d/2],radius=Math.min(w,h,d)*.38,inner=half.map(v=>v-radius);
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){const axes=[0,1,2].filter(a=>a!==axis),start=positions.length/3;
   for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const v=[0,0,0],u=i/nx*2-1,t=j/ny*2-1;v[axis]=sign*half[axis];v[axes[0]]=u*half[axes[0]];v[axes[1]]=t*half[axes[1]];const center=v.map((q,a)=>Math.max(-inner[a],Math.min(inner[a],q))),delta=v.map((q,a)=>q-center[a]),length=Math.hypot(...delta);for(let a=0;a<3;a++)v[a]=center[a]+delta[a]/length*radius;
    const crown=Math.min(.008,Math.min(w,h,d)*.04)*(u*u+t*t)*.5;for(let a=0;a<3;a++)v[a]-=delta[a]/length*crown;
    if(p.shape==='quilted'){const qa=p.quiltAxis==='x'?0:2,qs=p.quiltSign||1;if(v[qa]*qs>half[qa]*.55){const a=((qa===0?v[2]/d:v[0]/w)+.5)*(p.quiltColumns||6),b=(v[1]/h+.5)*(p.quiltRows||3),row=Math.round(b),nearest=Math.round(a-(row%2)*.5)+(row%2)*.5,du=a-nearest,dv=b-row,point=Math.exp(-(du*du+dv*dv)/.045);v[qa]-=qs*(p.quiltDepth||.035)*point;}}
    positions.push(...v);
   }
   // axis x/z grids have reversed orientation relative to y.
   const flip=(axis===1?1:-1)*sign;
   for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=start+j*(nx+1)+i,b=a+nx+1;if(flip>0)indices.push(a,b,a+1,b,b+1,a+1);else indices.push(a,a+1,b,b,a+1,b+1);}
  }
 }

 return {positions:new Float32Array(positions),indices:new Uint32Array(indices)};
}
