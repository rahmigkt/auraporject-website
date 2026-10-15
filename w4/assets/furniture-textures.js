import {MOTIFS} from './nakis/motifs.js';
import {weaveTile} from './nakis/weave.js';
export function woodCanvas(base){
 const c=document.createElement('canvas');c.width=256;c.height=512;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,256,512);
 for(let i=0;i<145;i++){g.beginPath();const x=i*1.9;g.moveTo(x,0);for(let y=0;y<=512;y+=8)g.lineTo(x+Math.sin(y*.018+i*.6)*2+Math.sin(y*.042+i)*.6,y);g.strokeStyle=i%3?'#231b120c':'#f5e5c91c';g.lineWidth=i%4===0?1.4:.6;g.stroke();}return c;
}
export function fabricCanvas(palette,motif='none'){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle=palette.ground;g.fillRect(0,0,512,512);
 if(motif!=='none'){
  const ss=MOTIFS[motif].build(3),pts=ss.flatMap(s=>s.pts),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,sc=82/Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  for(let col=-1;col<5;col++)for(let row=-1;row<5;row++){g.save();g.translate(col*128+64,row*128+64+(Math.abs(col%2)?64:0));g.scale(sc,-sc);g.translate(-cx,-cy);for(const s of ss){g.beginPath();s.pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(s.closed)g.closePath();g.fillStyle=palette[s.tone]||palette.ink;g.strokeStyle=palette[s.tone]||palette.ink;g.lineWidth=1/sc;if(s.fill)g.fill();else g.stroke();}g.restore();}
 }
 g.globalCompositeOperation='overlay';g.globalAlpha=.3;g.fillStyle=g.createPattern(weaveTile('twill22',3),'repeat');g.fillRect(0,0,512,512);return c;
}
