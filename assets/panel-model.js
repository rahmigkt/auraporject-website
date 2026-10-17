import {drawerFit} from './vendor/woodworkingshop/drawer-fit.js?v=20261016n';
export const FRONT_STYLES={plain:{tr:'Düz panel',en:'Plain slab'},shaker:{tr:'Çerçeveli Shaker',en:'Shaker frame'},slatted:{tr:'Dikey çıtalı',en:'Vertical slats'},glass:{tr:'Camlı çerçeve',en:'Glazed frame'}};
export function enrichPanelModel(model){const s=model.state,parts=[];const make=(role,position,size,material='wood',extra={})=>parts.push({role,position,size,material,shape:'box',...extra});
 for(const p of model.parts){if(!['door','drawer-front'].includes(p.role)){parts.push(p);continue;}const [x,y,z]=p.position,[w,h,d]=p.size,style=s.frontStyle||'plain';
  if(style==='plain')parts.push(p);
  else if(style==='slatted'){make(p.role+'-backing',[x,y,z-d/4],[w,h,d/2]);const n=Math.max(3,Math.round(w/.035));for(let i=0;i<n;i++)make('front-slat',[x-w/2+(i+.5)*w/n,y,z+d/4],[w/n-.005,h,d/2]);}
  else{const t=Math.min(.055,w*.15,h*.15);for(const sign of [-1,1]){make('front-stile',[x+sign*(w-t)/2,y,z],[t,h,d]);make('front-rail',[x,y+sign*(h-t)/2,z],[w-2*t,t,d]);}make(style==='glass'?'front-glass':'recessed-panel',[x,y,z-.005],[w-2*t-.002,h-2*t-.002,.008],style==='glass'?'glass':'wood');}
  if(p.role==='drawer-front'){const fit=drawerFit({openingWidthMm:(w-.035)*1000,openingHeightMm:(h-.025)*1000,openingDepthMm:(model.depth-.025)*1000}),bw=fit.widthMm/1000,bh=fit.heightMm/1000,bd=fit.depthMm/1000,t=.012,bottom=.006,cz=model.depth/2-.035-bd/2;
   for(const sign of [-1,1]){make('drawer-box-side',[x+sign*(bw-t)/2,y,cz],[t,bh,bd],'wood',{internal:true});make('drawer-box-end',[x,y,cz+sign*(bd-t)/2],[bw-2*t,bh,t],'wood',{internal:true});}make('drawer-box-bottom',[x,y-bh/2+bottom/2,cz],[bw-2*t,bottom,bd-2*t],'wood',{internal:true});
  }
 }
 return {...model,parts,hardwareStatus:'example-runner-profile-unverified'};
}
