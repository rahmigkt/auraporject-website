const num=x=>Number(x.toFixed(6)).toString();
export function constructionFormula(state,n){
 const intro='t ∈ [0, 1]: bir tam sahne döngüsü; genel başlangıç açısı t değerine eklenir (açı/360). Katsayılar 6 ondalığa yuvarlanır. Ekranda +y aşağı yönlüdür.\n';
 if(state.scene==='motors'){
 const ms=state.motors.slice(0,n),terms=ms.map(m=>`${num(m.amp)}·${m.shape==='square'?'P₄':m.shape==='triangle'?'P₃':'C'}(${m.freq}t + ${num(m.phase/360)})`);
 return intro+'r(t) = '+(terms.join(' + ')||'(0, 0)')+'\nC(u) = (cos(2πu), sin(2πu))'+(ms.some(m=>['square','triangle'].includes(m.shape))?'\nPₘ(u) = (1−α)vⱼ + αvⱼ₊₁; m = 3 veya 4\nq = m·(u − floor(u)), j = floor(q), α = q − j\nvⱼ = (cos(2πj/m), sin(2πj/m)); vₘ = v₀.\nGenlik, çokgenin çevrel çember yarıçapıdır; açı başlangıç konumunu belirler.':'');
 }
 const terms=(cs,fn)=>cs.slice(0,n).map(c=>`${num(c.amp)}·${fn}(2π·${c.freq}t + ${num(c.phase)})`).join(' + ');
 if(state.scene==='horse')return intro+'x(t) = '+terms(state.coeffX,'cos')+'\ny(t) = '+terms(state.coeffY,'cos')+'\nKatsayılar 6 ondalığa yuvarlanmıştır; hesap tam hassasiyetle yapılır.';
 return intro+'x(t) = '+terms(state.coeff,'cos')+'\ny(t) = '+terms(state.coeff,'sin')+'\nKatsayılar 6 ondalığa yuvarlanmıştır; hesap tam hassasiyetle yapılır.';
}
