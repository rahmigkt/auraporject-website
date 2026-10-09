export const TAU=Math.PI*2;
export const palettes={madder:{name:['Kökboya','Madder'],ground:'#692e37',ink:'#ead5b1',accent:'#c59558',soft:'#ba7270'},indigo:{name:['Çivit','Indigo'],ground:'#203e4a',ink:'#e7debd',accent:'#ba8555',soft:'#70958c'},linen:{name:['Keten','Linen'],ground:'#e7dcc5',ink:'#794136',accent:'#ab7c38',soft:'#879379'},night:{name:['Gece','Midnight'],ground:'#282b36',ink:'#dfd1bb',accent:'#b59666',soft:'#829084'}};
const poly=(pts,closed=true,tone='ink',fill=true)=>({pts,closed,tone,fill});
const cubic=(a,b,c,d,n=32)=>Array.from({length:n+1},(_,i)=>{const t=i/n,s=1-t;return {x:s**3*a[0]+3*s*s*t*b[0]+3*s*t*t*c[0]+t**3*d[0],y:s**3*a[1]+3*s*s*t*b[1]+3*s*t*t*c[1]+t**3*d[1]};});
function curves(segments,tone='ink',fill=true,closed=true){return poly(segments.flatMap((s,i)=>cubic(...s).slice(i?1:0)),closed,tone,fill);}
function leaf(sign){return curves([[[0,.6],[sign*.18,.18],[sign*.64,.16],[sign*.51,.04]],[[sign*.51,.04],[sign*.66,.57],[sign*.2,.68],[0,.6]]],'soft');}
export function motif(kind,k=8,custom=null){
 if(kind==='custom'&&custom)return custom;
 if(kind==='star'){
 const pts=Array.from({length:k*2},(_,j)=>{const r=j%2?.36:.88,a=j*Math.PI/k-Math.PI/2;return {x:r*Math.cos(a),y:r*Math.sin(a)};});
 const inner=Array.from({length:241},(_,j)=>{const t=j/240*TAU,r=.22*(1+.25*Math.cos(k*t));return {x:r*Math.cos(t),y:r*Math.sin(t)};});
 return [poly(pts,true,'ink'),poly(pts.map(p=>({x:p.x*.72,y:p.y*.72})),true,'accent',false),poly(inner,true,'ground'),...Array.from({length:k},(_,j)=>{const a=j*TAU/k;return poly([{x:.29*Math.cos(a),y:.29*Math.sin(a)},{x:.55*Math.cos(a),y:.55*Math.sin(a)}],false,'ground',false)})];
 }
 const stem=curves([[[0,.1],[.08,.42],[-.04,.64],[0,.91]]],'accent',false,false);
 if(kind==='tulip')return [stem,leaf(-1),leaf(1),curves([[[0,.22],[-.52,.17],[-.56,-.27],[-.5,-.73]],[[-.5,-.73],[-.35,-.48],[-.2,-.48],[0,-.92]],[[0,-.92],[.2,-.48],[.35,-.48],[.5,-.73]],[[.5,-.73],[.56,-.27],[.52,.17],[0,.22]]]),curves([[[0,.15],[-.13,-.12],[-.1,-.44],[0,-.75]],[[0,-.75],[.1,-.44],[.13,-.12],[0,.15]]],'accent'),curves([[[-.38,-.51],[-.25,-.12],[-.23,.06],[0,.22]]],'ground',false,false),curves([[[.38,-.51],[.25,-.12],[.23,.06],[0,.22]]],'ground',false,false)];
 const fan=Array.from({length:181},(_,i)=>{const a=-Math.PI+i/180*Math.PI,r=.65*(1+.09*Math.cos(2*k*a));return {x:r*Math.cos(a),y:r*Math.sin(a)-.16};});fan.push({x:0,y:.22});
 const veins=Array.from({length:k+1},(_,j)=>{const a=-Math.PI+(j+.5)/(k+1)*Math.PI;return curves([[[0,.16],[.22*Math.cos(a),-.14],[.42*Math.cos(a),.42*Math.sin(a)-.14],[.56*Math.cos(a),.56*Math.sin(a)-.16]]],'ground',false,false)});
 return [stem,leaf(-1),leaf(1),poly(fan),...veins,poly([{x:-.19,y:.1},{x:0,y:.29},{x:.19,y:.1}],true,'accent')];
}
export function pathD(path){return path.pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(5)},${p.y.toFixed(5)}`).join(' ')+(path.closed?'Z':'');}
export function transform(m,n,w,h,mode){return {x:(m+.5)*w,y:(n+.5)*h+(mode==='halfdrop'&&Math.abs(m%2)===1?h/2:0),sx:mode==='mirror'&&Math.abs(m%2)===1?-1:1};}
export function repeatSize(mode,w=100,h=125){return {w:mode==='straight'?w:2*w,h};}
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function svgMotif(paths,pal,style='print') {return paths.map(p=>`<path d="${pathD(p)}" fill="${style==='print'&&p.fill?pal[p.tone]:'none'}" stroke="${pal[p.tone]}" stroke-width="${style==='stitch'?.014:.012}" stroke-linecap="round" stroke-linejoin="round" ${style==='stitch'?'stroke-dasharray=".023 .018"':''}/>`).join('');}
export function exportSVG(state,onlyMotif=false){const pal=palettes[state.palette],paths=motif(state.kind,state.petals,state.custom),w=100,h=125,period=onlyMotif?{w:100,h:100}:repeatSize(state.repeat,w,h),scale=onlyMotif?44:42*state.scale;
 let body='';if(onlyMotif)body=`<g transform="translate(50 50) scale(${scale})">${svgMotif(paths,pal,state.style)}</g>`;else for(let m=-1;m<=2;m++)for(let n=-1;n<=1;n++){const t=transform(m,n,w,h,state.repeat);body+=`<g transform="translate(${t.x} ${t.y}) scale(${scale*t.sx} ${scale})">${svgMotif(paths,pal,state.style)}</g>`;}
 const mm=state.mm||100;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${period.w/100*mm}mm" height="${period.h/100*mm}mm" viewBox="0 0 ${period.w} ${period.h}"><title>${xml('NAKIŞ — '+state.kind+' / '+state.repeat)}</title><desc>${xml('Contemporary mathematical textile study. Decorative stitch preview, not a machine embroidery file. '+formula(state,'en').repeat)}</desc><defs><clipPath id="tile"><rect width="${period.w}" height="${period.h}"/></clipPath></defs><g clip-path="url(#tile)"><rect width="${period.w}" height="${period.h}" fill="${pal.ground}"/>${body}</g></svg>`;
}
export function formula(s,lang='en'){
 const tr=lang==='tr',w=s.mm,h=+(w*1.25).toFixed(2),scale=+(w*.42*s.scale).toFixed(2);
 const base=s.kind==='star'?`vⱼ = rⱼ(cos θⱼ, sin θⱼ)\nθⱼ = jπ/${s.petals} − π/2; j = 0…${2*s.petals-1}\nrⱼ = 0.88 (j ${tr?'çift':'even'}), 0.36 (j ${tr?'tek':'odd'})`:s.kind==='carnation'?`r(θ) = 0.65[1 + 0.09 cos(${2*s.petals}θ)]\nq(θ) = (r cos θ, r sin θ − 0.16)\n−π ≤ θ ≤ 0`:s.kind==='tulip'?`B(t) = (1−t)³P₀ + 3(1−t)²tP₁\n           + 3(1−t)t²P₂ + t³P₃\nP₀=(0,0.22), P₁=(−0.52,0.17)\nP₂=(−0.56,−0.27), P₃=(−0.5,−0.73)`: `qᵢ(t) = (1−t)Pᵢ + tPᵢ₊₁\n0 ≤ t ≤ 1; i = 0…L−2`;
 const repeat=s.repeat==='halfdrop'?`pₘₙ = ${scale}q + (${w}(m+½), ${h}(n+½) + ${h/2}(m mod 2))`:s.repeat==='mirror'?`pₘₙ = ${scale}diag((−1)ᵐ, 1)q + (${w}(m+½), ${h}(n+½))`:`pₘₙ = ${scale}q + (${w}(m+½), ${h}(n+½))`;
 return {base,repeat,note:tr?'m,n ∈ ℤ · koordinatlar mm; ekranda y aşağı doğru.':'m,n ∈ ℤ · coordinates in mm; screen y points down.',detail:s.kind==='tulip'?(tr?'İlk dış Bézier parçası gösteriliyor. Motif 4 dış parça, sap, yapraklar ve iç çizgilerden oluşur.':'The first outer Bézier segment is shown. Four outer segments, a stem, leaves and inner lines form the motif.'):s.kind==='carnation'?(tr?'Formül çiçek tacını tanımlar. Sap ve yapraklar kübik Bézier eğrileridir; tam geometri SVG içindedir.':'The equation describes the flower crown. Stem and leaves are cubic Bézier curves; the SVG contains the complete geometry.'):s.kind==='custom'?(tr?'İçe alınan SVG, çizgi parçalarıyla örneklendi. Formül bu örneklenmiş çizgiyi tanımlar.':'The imported SVG is sampled into line segments. The equation describes that sampled outline.'):(tr?'Dış yıldızın köşeleri. İç rozet ve çizgiler aynı dönüş düzeniyle oluşturulur.':'Vertices of the outer star. The inner rosette and lines follow the same rotational order.')};
}
