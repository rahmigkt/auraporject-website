// Only the requested final-render path loads these local CC0 maps.
import {HDRLoader} from '../vendor/addons/loaders/HDRLoader.js';
const root=new URL('../../knowledge/atmosfer/cc0/',import.meta.url);
export async function loadCatalogEnvironment(THREE,stage){
 const owned=[];const previousDispose=stage.dispose;
 stage.dispose=()=>{for(const t of owned)t.dispose();previousDispose();};
 const hdr=await new HDRLoader().loadAsync(new URL('studio_small_09_1k.hdr',root).href);
 hdr.mapping=THREE.EquirectangularReflectionMapping;owned.push(hdr);
 stage.scene.environment=hdr;stage.scene.environmentIntensity=.35;
 const loader=new THREE.TextureLoader();
 async function maps(id,tile){
  const result={};
  for(const [key,suffix] of [['map','Color'],['normalMap','NormalGL'],['roughnessMap','Roughness']]){
   const t=await loader.loadAsync(new URL(`${id}_${suffix}.jpg`,root).href);owned.push(t);
   t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(tile,tile);
   if(key==='map')t.colorSpace=THREE.SRGBColorSpace;result[key]=t;
  }
  return result;
 }
 const plaster=await maps('Plaster004',1),floor=await maps('WoodFloor051',1/1.8);
 // CC0 plaster relief retained; limewash albedo is pale, quiet and neutral.
 const source=plaster.map,c=document.createElement('canvas');c.width=source.image.width;c.height=source.image.height;
 const ctx=c.getContext('2d');ctx.drawImage(source.image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height);
 for(let i=0;i<pixels.data.length;i+=4){const variation=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3/255;
  pixels.data[i]=235+variation*12;pixels.data[i+1]=232+variation*12;pixels.data[i+2]=224+variation*12;}
 ctx.putImageData(pixels,0,0);const limewash=new THREE.CanvasTexture(c);limewash.colorSpace=THREE.SRGBColorSpace;
 limewash.wrapS=limewash.wrapT=THREE.RepeatWrapping;limewash.repeat.copy(source.repeat);owned.push(limewash);plaster.map=limewash;
 stage.scene.traverse(o=>{if(!o.isMesh||!o.userData.roomSurface)return;
  Object.assign(o.material,o.userData.roomSurface==='floor'?floor:plaster);
  o.material.color.set('#ffffff');o.material.normalScale.set(o.userData.roomSurface==='plaster'?.08:.18,o.userData.roomSurface==='plaster'?.08:.18);o.material.needsUpdate=true;
 });
}
