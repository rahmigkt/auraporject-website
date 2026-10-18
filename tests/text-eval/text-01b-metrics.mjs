// Mechanical editing aids; neither semantic truth nor voice quality is inferred from these counts.
const hedges=[
  /(?<!\p{L})\p{L}+(?:abilir|ebilir)(?:im|iz|sin|siniz|ler|di|miş|se|ken)?(?!\p{L})/gu,
  /(?<!\p{L})(?:belki|düşünelim|hayal edelim|zorunda değil(?:dir)?|mümkün(?:dür)?|olasılıkla|muhtemelen|sanki)(?!\p{L})/gu,
  /(?<!\p{L})yalnız[^.!?]*?başlangıcıdır(?!\p{L})/gu,
  /\b(?:may|might|could|can|perhaps|maybe|possibly|imagine|potentially|seems? to|appears? to|need not|does not need to|do not need to|does not have to|do not have to)\b/gu
];
export function hedgeMatches(text){
  const tr=text.toLocaleLowerCase('tr'),en=text.toLowerCase();
  return hedges.flatMap((re,i)=>[...(i===hedges.length-1?en:tr).matchAll(re)].map(m=>({text:m[0],index:m.index}))).sort((a,b)=>a.index-b.index);
}
export const words=text=>text.trim().split(/\s+/u).filter(Boolean).length;
export const sentenceLengths=text=>text.split(/[.!?]+/u).filter(s=>s.trim()).map(words);
export const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
