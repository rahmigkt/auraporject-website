import {weaveTile} from './nakis/weave.js?v=20261015d';
export function woodCanvas(base){
 const c=document.createElement('canvas');c.width=256;c.height=512;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,256,512);
 for(let i=0;i<145;i++){g.beginPath();const x=i*1.9;g.moveTo(x,0);for(let y=0;y<=512;y+=8)g.lineTo(x+Math.sin(y*.018+i*.6)*2+Math.sin(y*.042+i)*.6,y);g.strokeStyle=i%3?'#231b120c':'#f5e5c91c';g.lineWidth=i%4===0?1.4:.6;g.stroke();}return c;
}
export function fabricCanvas(palette,_legacy='none',weave='twill22'){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle=palette.ground;g.fillRect(0,0,512,512);
 g.globalCompositeOperation='overlay';g.globalAlpha=.3;g.fillStyle=g.createPattern(weaveTile(['plain','twill22','basket'].includes(weave)?weave:'plain',3),'repeat');g.fillRect(0,0,512,512);return c;
}
