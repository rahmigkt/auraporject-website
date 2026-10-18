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
 const plaster=await maps('Plaster004',3),floor=await maps(stage.room.floor==='stone'?'Tiles074':'WoodFloor051',stage.room.floor==='stone'?1/2.1:1/1.8);
 stage.scene.traverse(o=>{if(!o.isMesh||!o.userData.roomSurface)return;
  Object.assign(o.material,o.userData.roomSurface==='floor'?floor:plaster);
  o.material.normalScale.set(.18,.18);o.material.needsUpdate=true;
 });
}
