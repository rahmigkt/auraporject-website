// Fit a perspective camera to the actual 3D envelope, including dimension labels.
export function perspectiveDistance({width,height,depth,aspect,yaw,pitch,fov=35,zoom=1}){
 const tanV=Math.tan(fov*Math.PI/360),tanH=tanV*Math.max(.1,aspect),sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),target=height*.49;let distance=0;
 for(const x of [-(width+.6)/2,(width+.6)/2])for(const y of [-.2,height+.16])for(const z of [-(depth+.6)/2,(depth+.6)/2]){
  const dy=y-target,right=x*cy-z*sy,up=-x*sy*sp+dy*cp-z*cy*sp,towards=x*sy*cp+dy*sp+z*cy*cp;
  distance=Math.max(distance,towards+Math.abs(right)/tanH,towards+Math.abs(up)/tanV);
 }
 return Math.max(1,distance*1.06/zoom);
}

// Minimum orbit distance for every corner of the actual world-space model bounds.
export function boxFitDistance({min,max,target,aspect,yaw,pitch,fov}) {
 const tanV=Math.tan(fov*Math.PI/360),tanH=tanV*Math.max(.2,aspect),sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);let distance=0;
 for(const x of [min[0],max[0]])for(const y of [min[1],max[1]])for(const z of [min[2],max[2]]) {
  const dx=x-target[0],dy=y-target[1],dz=z-target[2],right=dx*cy-dz*sy,up=-dx*sy*sp+dy*cp-dz*cy*sp,towards=dx*sy*cp+dy*sp+dz*cy*cp;
  distance=Math.max(distance,towards+Math.abs(right)/tanH,towards+Math.abs(up)/tanV);
 }
 return Math.max(.1,distance*1.03);
}
