// Fit a perspective camera to the actual 3D envelope, including dimension labels.
export function perspectiveDistance({width,height,depth,aspect,yaw,pitch,fov=35,zoom=1}){
 const tanV=Math.tan(fov*Math.PI/360),tanH=tanV*Math.max(.1,aspect),sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),target=height*.49;let distance=0;
 for(const x of [-(width+.6)/2,(width+.6)/2])for(const y of [-.2,height+.16])for(const z of [-(depth+.6)/2,(depth+.6)/2]){
  const dy=y-target,right=x*cy-z*sy,up=-x*sy*sp+dy*cp-z*cy*sp,towards=x*sy*cp+dy*sp+z*cy*cp;
  distance=Math.max(distance,towards+Math.abs(right)/tanH,towards+Math.abs(up)/tanV);
 }
 return Math.max(1,distance*1.06/zoom);
}
