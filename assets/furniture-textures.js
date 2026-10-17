import {weaveTile} from './nakis/weave.js?v=20261016b';
export function woodCanvas(base){
 const c=document.createElement('canvas');c.width=256;c.height=512;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,256,512);
 for(let i=0;i<145;i++){g.beginPath();const x=i*1.9;g.moveTo(x,0);for(let y=0;y<=512;y+=8)g.lineTo(x+Math.sin(y*.018+i*.6)*2+Math.sin(y*.042+i)*.6,y);g.strokeStyle=i%3?'#231b120c':'#f5e5c91c';g.lineWidth=i%4===0?1.4:.6;g.stroke();}return c;
}
export function fabricCanvas(palette,_legacy='none',weave='twill22'){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle=palette.ground;g.fillRect(0,0,512,512);
 g.globalCompositeOperation='overlay';g.globalAlpha=.13;g.fillStyle=g.createPattern(weaveTile(['plain','twill22','basket'].includes(weave)?weave:'plain',3),'repeat');g.fillRect(0,0,512,512);return c;
}

export function fabricNormalCanvas(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),im=g.createImageData(256,256);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;im.data[i]=128+Math.sin(x*Math.PI/2)*16;im.data[i+1]=128+Math.sin(y*Math.PI/2)*13;im.data[i+2]=250;im.data[i+3]=255;}g.putImageData(im,0,0);return c;}
