// Final-image staging only. Product geometry/materials remain the engine's exact output.
export const LIGHT_PRESETS = Object.freeze({
  north: {name:'Kuzey stüdyosu',window:'#e9f2ff',sun:'#e7efff',power:3.6,environment:0.55,area:7,pitch:0.20},
  morning: {name:'Sabah yan ışığı',window:'#fff0d8',sun:'#ffe0ac',power:4.5,environment:0.42,area:6,pitch:0.20},
  noon: {name:'Öğle dolaylı ışık',window:'#f5f7ff',sun:'#fff7e8',power:2.6,environment:0.72,area:8,pitch:0.23},
  evening: {name:'Akşam ışığı',window:'#e1eaff',sun:'#ffd4a0',power:1.4,environment:0.18,area:12,pitch:0.18}
});

// Synchronous staging placeholders for geometry checks. Catalog rendering replaces
// these with the local CC0 HDRI and maps in loadCatalogEnvironment.
function sky(THREE,preset){
  const w=256,h=128,data=new Float32Array(w*h*4),top=new THREE.Color(preset.window),bottom=new THREE.Color('#bdafa0');
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const t=y/(h-1),c=top.clone().lerp(bottom,Math.min(1,t*1.25)),intensity=t<0.5?0.85:0.32;
    const i=(y*w+x)*4;data[i]=c.r*intensity;data[i+1]=c.g*intensity;data[i+2]=c.b*intensity;data[i+3]=1;
  }
  const map=new THREE.DataTexture(data,w,h,THREE.RGBAFormat,THREE.FloatType);
  map.mapping=THREE.EquirectangularReflectionMapping;map.needsUpdate=true;return map;
}
function surfaceMaps(THREE,stone){
  const size=256,albedo=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,noise=Math.sin(x*12.9898+y*78.233)*43758.5453%1;
    const seam=stone?(x<1||y<1):(x<2||((y<2)&&((x>>6)%2===0)));
    const grain=stone?Math.sin(x*0.047+y*0.031)*1.5:Math.sin(y*.6+Math.sin(x*.04)*3)*3;
    const base=stone?[174,168,155]:[162,130,95],i=(y*size+x)*4;
    for(let k=0;k<3;k++){albedo[i+k]=Math.max(0,base[k]+noise*2+grain-(seam?20:0));rough[i+k]=stone?190:176;}
    albedo[i+3]=rough[i+3]=255;
  }
  const make=(data,srgb)=>{const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(stone?30:70,stone?30:12);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;};
  return {map:make(albedo,true),roughnessMap:make(rough,false)};
}

export function createAtmosphereStage(THREE,product,{family='seating',preset='north',aspect=1.5}={}){
  if(!LIGHT_PRESETS[preset])throw new Error(`Unknown light preset: ${preset}`);
  if(!(aspect>0&&Number.isFinite(aspect)))throw new Error('Positive aspect required');
  const light=LIGHT_PRESETS[preset],scene=new THREE.Scene(),owned=[],textures=[];
  product.updateMatrixWorld(true);
  const initial=new THREE.Box3().setFromObject(product),center=initial.getCenter(new THREE.Vector3());
  const before=initial.getSize(new THREE.Vector3());
  if(![...before].every(Number.isFinite)||before.length()===0)throw new Error('Empty product bounds');
  product.position.x-=center.x;product.position.z-=center.z;
  // Wall-mounted objects retain their actual mounting height. Only a below-floor origin is corrected.
  product.position.y-=Math.min(0,initial.min.y);product.updateMatrixWorld(true);scene.add(product);
  const bounds=new THREE.Box3().setFromObject(product),size=bounds.getSize(new THREE.Vector3()),target=bounds.getCenter(new THREE.Vector3());
  const stone=['bath','kitchen'].includes(family),width=Math.max(3.2,size.x+2.2),height=Math.max(3,bounds.max.y+.65);
  const depth=Math.max(3,size.z+2.2);
  const wallGap=['bath','kitchen','storage'].includes(family)?0.035:0.65;
  const rear=bounds.min.z-wallGap,left=-width/2;
  const maps=surfaceMaps(THREE,stone);textures.push(maps.map,maps.roughnessMap);
  const floor=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:0.84,...maps});
  const plaster=new THREE.MeshStandardMaterial({color:'#f4f1e9',roughness:0.94,side:THREE.DoubleSide});
  const trim=new THREE.MeshStandardMaterial({color:stone?'#c5c2b7':'#ddd4c4',roughness:0.72});
  owned.push(floor,plaster,trim);
  function box(w,h,d,x,y,z,material){const geometry=new THREE.BoxGeometry(w,h,d),mesh=new THREE.Mesh(geometry,material);
    mesh.userData.roomSurface=material===floor?'floor':material===plaster?'plaster':null;mesh.name=mesh.userData.roomSurface||'skirting';mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=true;scene.add(mesh);owned.push(geometry);return mesh;}
  // The photographic floor must cover every long-lens frustum, not end in view.
  const ground=box(80,0.12,80,0,-0.065,0,floor);
  const groundPosition=ground.geometry.getAttribute('position'),groundUv=ground.geometry.getAttribute('uv');
  for(let i=0;i<groundPosition.count;i++)groundUv.setXY(i,groundPosition.getX(i),groundPosition.getZ(i));
  groundUv.needsUpdate=true;
  box(width,height,.12,0,height/2,rear-.06,plaster);
  box(width,.09,.018,0,.045,rear+.009,trim);
  box(.018,.09,12,left+.009,.045,rear+6,trim);
  // A real opening in the side wall, not an image composited over a closed wall.
  const windowZ=rear+2.0,windowW=2.2,sill=1.0,openingH=Math.min(2.2,height-1.25),front=rear+12;
  box(.12,sill,12,left,sill/2,rear+6,plaster);
  box(.12,height-sill-openingH,12,left,(height+sill+openingH)/2,rear+6,plaster);
  const backWidth=windowZ-windowW/2-rear,frontWidth=front-windowZ-windowW/2;
  if(backWidth>0)box(.12,openingH,backWidth,left,sill+openingH/2,rear+backWidth/2,plaster);
  if(frontWidth>0)box(.12,openingH,frontWidth,left,sill+openingH/2,windowZ+windowW/2+frontWidth/2,plaster);
  // Narrow window reveal and sill; no decor or invented product parts.
  box(.24,.04,windowW+.16,left,sill,windowZ,trim);
  // Open photographic set: no ceiling geometry can enter any frame.
  const environment=sky(THREE,light);textures.push(environment);scene.environment=environment;
  scene.environmentIntensity=light.environment;scene.background=new THREE.Color('#dcd8ce');
  const area=new THREE.RectAreaLight(light.window,5,windowW*1.5,openingH*1.3);
  area.position.set(left-.1,sill+openingH/2,windowZ);area.lookAt(target);scene.add(area);
  // A low-energy broad shadow proxy, not direct sunlight. VSM blurs its moments.
  const shadow=new THREE.DirectionalLight(light.window,0.65);shadow.name='window-shadow-proxy';
  shadow.position.copy(area.position);shadow.target.position.copy(target);shadow.castShadow=true;
  shadow.shadow.mapSize.set(2048,2048);shadow.shadow.bias=-.0001;shadow.shadow.normalBias=.002;
  const shadowExtent=Math.max(3,size.x,size.z)*1.1;
  Object.assign(shadow.shadow.camera,{left:-shadowExtent,right:shadowExtent,top:shadowExtent,bottom:-shadowExtent,near:.1,far:40});
  shadow.shadow.radius=8;shadow.shadow.blurSamples=16;scene.add(shadow,shadow.target);
  const fill=new THREE.HemisphereLight('#f1f0eb','#bda98b',.35);fill.name='bounce-fill';scene.add(fill);
  const bounce=new THREE.RectAreaLight('#e8d7bd',.18,3,3);bounce.position.set(2,1.3,3);bounce.lookAt(target);bounce.name='floor-bounce';scene.add(bounce);
  const camera=new THREE.PerspectiveCamera(35,aspect,.03,100);camera.setFocalLength(55);
  // A complete bedroom set is much wider than one piece. Keep its long-lens
  // camera below the ceiling instead of lifting the viewpoint above the room.
  // An upright camera: level horizon alone does not prevent converging verticals.
  const yaw=.38,direction=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
  const tanV=Math.tan(camera.fov*Math.PI/360),tanH=tanV*aspect;
  let distance=0;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    const v=new THREE.Vector3(x,y,z).sub(target);
    distance=Math.max(distance,v.dot(direction)+Math.max(Math.abs(v.dot(right))/(tanH*.82),Math.abs(v.dot(up))/(tanV*.82)));
  }
  let cameraDistance=Math.max(distance,.8),shiftY;
  const lift=.65,aim=target.clone().add(new THREE.Vector3(0,lift,0));
  // Architectural lens shift keeps verticals parallel while exposing the table top.
  for(let attempt=0;attempt<40;attempt++){
   camera.position.copy(aim).addScaledVector(direction,cameraDistance);camera.lookAt(aim);camera.up.set(0,1,0);
   shiftY=-lift/(cameraDistance*2*tanH);
   camera.setViewOffset(1500,1500/aspect,0,-shiftY*1500,1500,1500/aspect);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
   let fits=true;
   for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
    const p=new THREE.Vector3(x,y,z).project(camera);if(Math.abs(p.x)>.82||Math.abs(p.y)>.82)fits=false;
   }
   if(fits)break;cameraDistance*=1.08;
  }
  camera.userData={focalLengthMm:55,target:aim.toArray(),productCentre:target.toArray(),shiftY,family,preset};
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const stagedSize=bounds.getSize(new THREE.Vector3());
  if(stagedSize.distanceTo(before)>1e-8)throw new Error('Staging changed product dimensions');
  return {scene,camera,bounds,preset,room:{width,height,depth,rear,floor:'wood',window:{position:area.position.toArray(),width:windowW,height:openingH}},
    dispose(){scene.remove(product);shadow.shadow.map?.dispose();shadow.shadow.mapPass?.dispose();for(const asset of owned)asset.dispose();for(const texture of textures)texture.dispose();}};
}
