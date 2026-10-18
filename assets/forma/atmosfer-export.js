// Export the identical final stage, including embedded product/room texture maps.
import * as THREE from '../vendor/three.module.js?v=20261016b';
import {GLTFExporter} from '../vendor/addons/exporters/GLTFExporter.js';
import {createRenderAsset} from './scene.js';
import {createAtmosphereStage} from './atmosfer-room.js';
import {loadCatalogEnvironment} from './atmosfer-surfaces.js';
export async function exportAtmosphere({compiled,materials,family,preset='north'}){
 const asset=await createRenderAsset(compiled,materials);let stage;const converted=[];
 try{
  stage=createAtmosphereStage(THREE,asset.group,{family,preset,aspect:1.5});
  await loadCatalogEnvironment(THREE,stage);
  stage.camera.name='CatalogCamera';stage.scene.add(stage.camera);
  const lights=[];stage.scene.traverse(o=>{if(o.isLight)lights.push({name:o.name,type:o.type,color:o.color.toArray(),intensity:o.intensity,position:o.position.toArray(),quaternion:o.quaternion.toArray(),width:o.width,height:o.height});});
  // The Cycles script reconstructs area/HDRI lights; glTF has no area/HDRI extension.
  const scene=stage.scene;scene.environment=null;
  for(const light of [...scene.children].filter(o=>o.isLight))scene.remove(light);
  // GLTFExporter packs metal/roughness with Canvas2D, so data maps must become
  // canvas-backed textures. Preserve wrap, transform and color space explicitly.
  const cache=new Map();
  scene.traverse(o=>{if(!o.isMesh)return;const original=o.material;o.material=original.clone();converted.push(o.material);
   for(const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap','bumpMap','emissiveMap']){
    const t=original[key];if(!t?.isDataTexture)continue;
    if(!cache.has(t)){
     const {width,height,data}=t.image,c=document.createElement('canvas');c.width=width;c.height=height;
     const context=c.getContext('2d'),image=context.createImageData(width,height),channels=data.length/(width*height);
     for(let i=0;i<width*height;i++)for(let k=0;k<4;k++)image.data[i*4+k]=k===3?255:data[i*channels+Math.min(k,channels-1)];
     context.putImageData(image,0,0);const copy=new THREE.CanvasTexture(c);copy.wrapS=t.wrapS;copy.wrapT=t.wrapT;copy.repeat.copy(t.repeat);copy.offset.copy(t.offset);copy.center.copy(t.center);copy.rotation=t.rotation;copy.colorSpace=t.colorSpace;copy.flipY=t.flipY;cache.set(t,copy);converted.push(copy);
    }o.material[key]=cache.get(t);
   }
  });
  const glb=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true,maxTextureSize:2048});
  return {glb,metadata:{family,preset,lights,camera:{position:stage.camera.position.toArray(),quaternion:stage.camera.quaternion.toArray(),focalLength:55},room:stage.room,productBounds:{min:stage.bounds.min.toArray(),max:stage.bounds.max.toArray()}}};
 }finally{for(const resource of converted)resource.dispose();stage?.dispose();asset.dispose();}
}
