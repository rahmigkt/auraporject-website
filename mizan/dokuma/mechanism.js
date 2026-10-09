// Exact planar vector sum; mathematical coordinates have y pointing upwards.
export const TAU=2*Math.PI;
export const ROTORS=Object.freeze([{r:1,k:1,phi:0},{r:.5,k:-2,phi:0},{r:.25,k:3,phi:0}].map(Object.freeze));
export function configuration(count,theta){if(!Number.isInteger(count)||count<1||count>3||!Number.isFinite(theta))throw new RangeError('Invalid mechanism parameters');let x=0,y=0;const links=ROTORS.slice(0,count).map(({r,k,phi})=>{const a=k*theta+phi,cx=x,cy=y;x+=r*Math.cos(a);y+=r*Math.sin(a);return {cx,cy,x,y,r,k,angle:a};});return {x,y,links};}
export function locus(count,theta=TAU,steps=1440){const n=Math.max(1,Math.ceil(steps*Math.abs(theta)/TAU));return Array.from({length:n+1},(_,i)=>{const p=configuration(count,theta*i/n);return {x:p.x,y:p.y}});}
export function equations(count){const rs=['1','½','¼'],ks=['θ','−2θ','3θ'];return {x:'x(θ) = '+rs.slice(0,count).map((r,i)=>`${r} cos(${ks[i]})`).join(' + '),y:'y(θ) = '+rs.slice(0,count).map((r,i)=>`${r} sin(${ks[i]})`).join(' + ')};}
