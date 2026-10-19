// Only the selected plate, metadata and local HDR are loaded. No render server.
import * as THREE from '../vendor/three.module.js?v=20261016b';
import {HDRLoader} from '../vendor/addons/loaders/HDRLoader.js';
import {createRenderAsset} from './scene.js';
const root=new URL('../../knowledge/atmosfer/sahneler/',import.meta.url);
export const TEXTURES={KIREC:'Kireç',TAS:'Taş',TOPRAK:'Toprak'};
export const LIGHTS={SABAH:'Sabah',AKSAM:'Akşam'};
export function defaultTexture(style=''){
 if(['brutalism','bauhaus','industrial','mid-century','mid_century_modern'].includes(style))return 'TAS';
 if(['art-deco','art_deco','wabi-sabi','wabi_sabi','wabi_sabi_rustic'].includes(style))return 'TOPRAK';
 return 'KIREC';
}
export function roomSize(widthMM){if(!Number.isFinite(widthMM)||widthMM<=0)throw new RangeError('Product width required');return widthMM<=900?'small':widthMM<=2000?'medium':'large';}
export function disposePlateSession(session){session.asset?.dispose();session.renderer?.dispose();session.renderer?.forceContextLoss();delete session.asset;delete session.renderer;delete session.key;}
export async function renderPlate({compiled,materials,family,texture='KIREC',light='SABAH',camera='A',canvas,width=2400,signal,approvalPreview=false,session}){
 if(!['seating','table','storage','kitchen','bath'].includes(family)||!TEXTURES[texture]||!LIGHTS[light]||!['A','B'].includes(camera))throw new TypeError('Unknown scene option');
 const size=roomSize(compiled?.meta?.overall?.width);
 // Other sizes deliberately stay unavailable until the first cohort is approved.
 if(size!=='medium'&&!approvalPreview)throw new Error('Bu büyüklüğün mekânı henüz onaylanmadı. Orta boy bir ürün seçin.');
 const check=()=>{if(signal?.aborted)throw new DOMException('İptal edildi','AbortError');};check();
 const key=`${family}-medium-${texture}-${light}`,response=await fetch(new URL(key+'.json',root),{signal});
 if(!response.ok)throw new Error('Seçilen mekân henüz hazır değil.');
 const metadata=await response.json(),c=metadata.cameras[camera];let asset,renderer,hdr,pmrem,env,shadow,wallShadow,lightSource;const contacts=[];
 try{
  const image=new Image();image.src=new URL(c.plate,root).href;await image.decode();check();
  const assetKey=JSON.stringify({compiled,materials});
  if(session?.key&&session.key!==assetKey)disposePlateSession(session);
  asset=session?.asset||await createRenderAsset(compiled,materials);if(session){session.asset=asset;session.key=assetKey;}check();
  const scene=new THREE.Scene(),bounds=new THREE.Box3().setFromObject(asset.group),centre=bounds.getCenter(new THREE.Vector3());
  asset.group.position.x-=centre.x;asset.group.position.z-=centre.z;
  if(family==='kitchen'||compiled.params?.base==='wall')asset.group.position.z+=-.65-(bounds.min.z-centre.z);
  asset.group.position.y-=Math.min(0,bounds.min.y);scene.add(asset.group);
  renderer=session?.renderer||new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});if(session)session.renderer=renderer;renderer.setSize(width,Math.round(width*2/3));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;
  hdr=await new HDRLoader().loadAsync(new URL(metadata.environment,root).href);check();hdr.mapping=THREE.EquirectangularReflectionMapping;pmrem=new THREE.PMREMGenerator(renderer);env=pmrem.fromEquirectangular(hdr);scene.environment=env.texture;scene.environmentIntensity=.45;scene.environmentRotation.y=metadata.environmentRotationY??Math.PI/2;
  const cam=new THREE.PerspectiveCamera(2*Math.atan(36/(2*c.lensMM)/(2400/1600))*180/Math.PI,1.5,.01,100);cam.position.fromArray(c.position);cam.lookAt(new THREE.Vector3().fromArray(c.target));cam.setViewOffset(2400,1600,0,-c.shiftY*2400,2400,1600);cam.updateProjectionMatrix();
  lightSource=new THREE.DirectionalLight(light==='SABAH'?'#e0efff':'#ffbd80',light==='SABAH'?1.1:.65);lightSource.position.fromArray(light==='SABAH'?[-metadata.roomMetres[0]/2,1.65,.7]:[1.3,1.55,1]);lightSource.castShadow=true;lightSource.shadow.mapSize.set(2048,2048);Object.assign(lightSource.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:15});lightSource.shadow.radius=48;lightSource.shadow.blurSamples=24;lightSource.shadow.bias=-.0001;lightSource.shadow.normalBias=.002;scene.add(lightSource,lightSource.target);
  if(light==='AKSAM'){const lamp=new THREE.PointLight('#ff9b42',5,8,2);lamp.position.set(1.3,1.55,1);scene.add(lamp);}
  shadow=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.ShadowMaterial({opacity:.22}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.001;shadow.receiveShadow=true;scene.add(shadow);
  wallShadow=new THREE.Mesh(new THREE.PlaneGeometry(12,2.8),new THREE.ShadowMaterial({opacity:.16}));wallShadow.position.set(0,1.4,-.64);wallShadow.receiveShadow=true;scene.add(wallShadow);
  // Small grounded contacts supplement the deliberately broad window penumbra.
  asset.group.updateMatrixWorld(true);asset.group.traverse(o=>{if(!o.isMesh)return;const b=new THREE.Box3().setFromObject(o);if(b.min.y>.025||b.max.y<.005)return;const size=b.getSize(new THREE.Vector3()),centre=b.getCenter(new THREE.Vector3());if(size.x>.5||size.z>.5)return;const tile=document.createElement('canvas');tile.width=tile.height=64;const ctx=tile.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(0,0,0,.25)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const map=new THREE.CanvasTexture(tile),contact=new THREE.Mesh(new THREE.PlaneGeometry(size.x+.12,size.z+.12),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false}));contact.rotation.x=-Math.PI/2;contact.position.set(centre.x,.002,centre.z);scene.add(contact);contacts.push(contact);});
  renderer.render(scene,cam);check();canvas.width=width;canvas.height=Math.round(width*2/3);const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);ctx.drawImage(renderer.domElement,0,0);
  const projected=new THREE.Box3().setFromObject(asset.group),points=[];for(const x of [projected.min.x,projected.max.x])for(const y of [projected.min.y,projected.max.y])for(const z of [projected.min.z,projected.max.z])points.push(new THREE.Vector3(x,y,z).project(cam));
  if(points.some(p=>Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1))throw new Error('Bu ürün sabit oda kadrajına sığmıyor; farklı bir ürün veya kamera seçin.');
  return {key,camera,size,productWidthMM:compiled.meta.overall.width,projectedWidth:(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)))/2,frameBounds:{minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))},jpeg:()=>canvas.toDataURL('image/jpeg',.88)};
 }finally{if(!session)asset?.dispose();for(const contact of contacts){contact.geometry.dispose();contact.material.map.dispose();contact.material.dispose();}shadow?.geometry.dispose();shadow?.material.dispose();wallShadow?.geometry.dispose();wallShadow?.material.dispose();lightSource?.shadow?.map?.dispose();env?.dispose();hdr?.dispose();pmrem?.dispose();if(!session){renderer?.dispose();renderer?.forceContextLoss();}}
}
export function plateControls(style){return `<section id="scenePlate"><h3>Mekân ve ışık</h3><label>Mekân <select id="plateTexture">${Object.entries(TEXTURES).map(([id,name])=>`<option value="${id}" ${id===defaultTexture(style)?'selected':''}>${name}</option>`).join('')}</select></label> <label>Işık <select id="plateLight">${Object.entries(LIGHTS).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label> <label>Kamera <select id="plateCamera"><option>A</option><option>B</option></select></label><button id="plateRender" type="button">Mekânda göster</button><p id="plateStatus" role="status">Mekânlar görsel onay aşamasında.</p><canvas id="plateCanvas" style="width:100%;height:auto" hidden></canvas></section>`;}
