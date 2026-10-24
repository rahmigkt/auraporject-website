// Visual story inputs only: no image inference, construction order or engineering approval.
export const STAGES=['Planı çiziyoruz','Odayı oluşturuyoruz','Mobilyayı şekillendiriyoruz','Tasarım tamamlanıyor','Odada yerini alıyor','Son dokunuş'];
export function rectangleRoom(width,depth,height,name='Temsili oda'){
  const a=[width,depth,height].map(Number);
  if(a.some(v=>!Number.isFinite(v))||a[0]<1||a[0]>20||a[1]<1||a[1]>20||a[2]<2||a[2]>6)throw Error('Oda genişliği/derinliği 1–20 m, yüksekliği 2–6 m olmalı.');
  return validateRoom({name,boundary:[[0,0],[a[0]*1000,0],[a[0]*1000,a[1]*1000],[0,a[1]*1000]],height:a[2]*1000,representative:true});
}
export function validateRoom(room){
  if(!room||!Array.isArray(room.boundary)||room.boundary.length<3||room.boundary.length>100)throw Error('Oda sınırı 3–100 nokta içermeli.');
  if(!room.boundary.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<=1e7)))throw Error('Oda noktaları geçersiz.');
  const xs=room.boundary.map(p=>p[0]),zs=room.boundary.map(p=>p[1]);
  const w=Math.max(...xs)-Math.min(...xs),d=Math.max(...zs)-Math.min(...zs);
  const area=Math.abs(room.boundary.reduce((v,p,i)=>{const q=room.boundary[(i+1)%room.boundary.length];return v+p[0]*q[1]-q[0]*p[1]},0))/2;
  if(w<500||d<500||w>20000||d>20000||area<250000||!Number.isFinite(room.height)||room.height<2000||room.height>6000)throw Error('Oda ölçüleri bu görsel anlatımın sınırları dışında.');
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  for(let i=0;i<room.boundary.length;i++)for(let j=i+2;j<room.boundary.length;j++){
    if(i===0&&j===room.boundary.length-1)continue;
    const a=room.boundary[i],b=room.boundary[(i+1)%room.boundary.length],c=room.boundary[j],e=room.boundary[(j+1)%room.boundary.length];
    if(cross(a,b,c)*cross(a,b,e)<0&&cross(c,e,a)*cross(c,e,b)<0)throw Error('Oda sınırı kendi üzerinden geçiyor.');
  }
  return {...room,name:String(room.name||'Oda').slice(0,80),boundary:room.boundary.map(p=>p.slice()),width:w,depth:d,center:[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2]};
}
export function insideRoom(room,x,z){let inside=false;const p=room.boundary;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function visualPlacement(room,sizes){
  validateRoom(room);
  if(!sizes.length||sizes.length>4||sizes.some(s=>[s.width,s.depth,s.height].some(v=>!Number.isFinite(v)||v<=0)))throw Error('1–4 geçerli mobilya seçin.');
  const total=sizes.reduce((v,s)=>v+s.width,0)+Math.max(0,sizes.length-1)*300;
  let x=room.center[0]-total/2;
  return sizes.map(s=>{const pos={x:x+s.width/2,z:room.center[1]};x+=s.width+300;
    if(s.height>room.height-50)throw Error('Mobilya oda yüksekliğine sığmıyor. Modeli veya odayı değiştirin.');
    // Sample the whole footprint, including concave-room notches. This is a visual placement guard.
    for(let u=0;u<=10;u++)for(let v=0;v<=10;v++)if(!insideRoom(room,pos.x+(u/10-.5)*s.width,pos.z+(v/10-.5)*s.depth))throw Error('Seçilen mobilyalar bu odaya yan yana sığmıyor. Daha az mobilya veya başka oda seçin.');
    return pos;
  });
}
export function frameAt(progress,count){return Math.min(count-1,Math.floor(Math.max(0,Math.min(1,progress))*count));}
export function assertStoryOrder(shots){const finals=shots.filter(s=>s.role==='result');if(finals.length>1||(finals.length&&shots.at(-1)!==finals[0]))throw Error('Sonuç görseli yalnız son sahnede kalmalı.');return shots;}
