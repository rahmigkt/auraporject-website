import * as THREE from '../vendor/three.module.js?v=20261016b';
import {buildMesh} from '../forma/build.js';
import {normalizeDesign,compileDesign} from '../forma/generate.js';
import {storyPartColor} from './story-material.js';
import {validateRoom,visualPlacement} from './story-model.js';

export async function renderStoryViews(input,designs){
  const room=validateRoom(input);if(!designs.length||designs.length>4)throw Error('1–4 AURA mobilyası seçin.');
  const canvas=document.createElement('canvas');let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});}catch{throw Error('Bu tarayıcı 3B süreç görünümünü oluşturamadı.');}
  renderer.setSize(960,720,false);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#eeeae1');scene.add(new THREE.HemisphereLight('#ffffff','#999a83',2.5));const light=new THREE.DirectionalLight('#fff6e8',3);light.position.set(4,7,5);scene.add(light);
  const furniture=new THREE.Group(),shell=new THREE.Group();scene.add(furniture,shell);const geometries=[],materials=[],meshes=[],groups=[],sizes=[];let triangles=0;
  const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.8,...extra});materials.push(m);return m;};
  try{
    for(const raw of designs){
      if(raw?.schema!=='aura.forma.design/1')throw Error('Geçerli AURA mobilya kaydı gerekli.');
      const design=normalizeDesign(structuredClone(raw)),compiled=compileDesign(design),group=new THREE.Group();group.scale.setScalar(.001);furniture.add(group);groups.push(group);
      if(compiled.parts.length>1800)throw Error('Bu tasarım süreç önizlemesi için fazla ayrıntılı. Daha küçük bir tasarım seçin.');
      const materialMap=new Map();
      for(const part of compiled.parts){if(part.internal||part.planOnly)continue;const m=buildMesh(part);triangles+=m.indices.length/3;if(triangles>1200000)throw Error('Seçim önizleme ayrıntı sınırını aşıyor. Daha az mobilya seçin.');
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(m.positions,3));g.setAttribute('normal',new THREE.BufferAttribute(m.normals,3));g.setIndex(new THREE.BufferAttribute(m.indices,1));geometries.push(g);
        const color=storyPartColor(design,part);if(!materialMap.has(color))materialMap.set(color,mat(color));const mesh=new THREE.Mesh(g,materialMap.get(color));mesh.position.set(...part.pos);mesh.rotation.set(...part.rot);mesh.userData.height=part.pos[1];group.add(mesh);meshes.push(mesh);
      }
      if(!group.children.length)throw Error('Tasarımda gösterilecek parça yok.');
      const b=new THREE.Box3().setFromObject(group),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());sizes.push({width:s.x*1000,depth:s.z*1000,height:s.y*1000});group.position.set(-c.x,-b.min.y,-c.z);
    }
    const placements=visualPlacement(room,sizes);
    groups.forEach((g,i)=>{g.position.x+=(placements[i].x-room.center[0])/1000;g.position.z+=(placements[i].z-room.center[1])/1000;});
    const boundary=room.boundary.map(([x,z])=>[(x-room.center[0])/1000,(z-room.center[1])/1000]);
    const shape=new THREE.Shape();boundary.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const floorGeometry=new THREE.ShapeGeometry(shape);floorGeometry.rotateX(-Math.PI/2);geometries.push(floorGeometry);shell.add(new THREE.Mesh(floorGeometry,mat('#d5c5a6',{side:THREE.DoubleSide})));
    const signed=boundary.reduce((v,p,i)=>{const q=boundary[(i+1)%boundary.length];return v+p[0]*q[1]-q[0]*p[1]},0);
    for(let i=0;i<boundary.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length],dx=b[0]-a[0],dz=b[1]-a[1],n=signed>0?[dz,-dx]:[-dz,dx];if(n[0]+n[1]>=0)continue;
      const length=Math.hypot(dx,dz),g=new THREE.BoxGeometry(length,room.height/1000,.055);geometries.push(g);const wall=new THREE.Mesh(g,mat('#e1e0d4'));wall.position.set((a[0]+b[0])/2,room.height/2000,(a[1]+b[1])/2);wall.rotation.y=-Math.atan2(dz,dx);shell.add(wall);
    }
    const camera=new THREE.PerspectiveCamera(38,4/3,.01,150);
    function fit(object){const box=new THREE.Box3().setFromObject(object),s=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),radius=s.length()/2,dist=Math.max(1.5,radius/Math.sin(THREE.MathUtils.degToRad(19))*1.12);camera.position.copy(center).add(new THREE.Vector3(.65,.48,1).normalize().multiplyScalar(dist));camera.lookAt(center);camera.updateProjectionMatrix();}
    const capture=()=>{renderer.render(scene,camera);return canvas.toDataURL('image/jpeg',.86);};
    shell.visible=false;fit(furniture);const ordered=[...meshes].sort((a,b)=>a.userData.height-b.userData.height),frames=[];
    for(let i=0;i<8;i++){ordered.forEach((m,j)=>m.visible=j<Math.max(1,Math.ceil(ordered.length*i/7)));frames.push(capture());await new Promise(r=>setTimeout(r,0));}
    meshes.forEach(m=>m.visible=true);const product=capture();shell.visible=true;fit(shell);furniture.visible=false;const empty=capture();furniture.visible=true;const placed=capture();
    return {frames,product,empty,placed,scope:{parts:meshes.length,triangles,room:room.name,models:designs.length,representation:'visual_story_not_recorded_workflow',placement:'automatic_side_by_side_not_saved_layout',roomOpenings:false,colors:'representative',sourcePreserved:true}};
  }finally{for(const g of geometries)g.dispose();for(const m of materials)m.dispose();renderer.dispose();renderer.forceContextLoss();}
}
