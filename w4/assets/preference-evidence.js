import {STYLE_DIRECTIONS} from './style-directions.js?v=20261016s';
const norm=s=>String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').replaceAll('ı','i').toLowerCase();
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// Exact style names + explicit neighbouring preference verbs. This is a guard,
// not semantic style classification and never controls category/geometry.
export function explicitStyleEvidence(input){
 const text=norm(input),matches=[];
 for(const p of STYLE_DIRECTIONS){const aliases=[p.id.replaceAll('_',' '),p.name.split('(')[0].trim(),p.en.split('/')[0].trim()];for(const alias of new Set(aliases.map(norm))){const pattern=alias.split(/[\s_-]+/).map(escape).join('[\\s_-]*'),re=new RegExp('(?<![a-z])'+pattern+'(?![a-z])','g');for(const m of text.matchAll(re))matches.push({id:p.id,start:m.index,end:m.index+m[0].length});}}
 const used=[];for(const m of matches.sort((a,b)=>(b.end-b.start)-(a.end-a.start)))if(!used.some(x=>m.start<x.end&&m.end>x.start))used.push(m);used.sort((a,b)=>a.start-b.start);
 const cuts=[-1,...[...text.matchAll(/[.!?;,\n]|\b(?:ama|fakat|ancak|but|mais|men)\b/g)].map(m=>m.index),text.length],positive=new Set(),negative=new Set();
 used.forEach((m,i)=>{const prev=used[i-1]?.end??0,next=used[i+1]?.start??text.length,start=Math.max(prev,...cuts.filter(c=>c<m.start).map(c=>c+1)),end=Math.min(next,...cuts.filter(c=>c>=m.end)),before=text.slice(start,m.start),after=text.slice(m.end,end);
  const negBefore=/(?:do\s*not|don't|dont|not|dislike|avoid|ikke|pas|sans)\b/.test(before),negAfter=/\b(?:istemiyorum|istemem|sevmiyorum|begenmiyorum|olmasin|haric|istememek|istemiy[oa]rum|not|ikke|pas)\b/.test(after);
  if(negBefore||negAfter)negative.add(m.id);else if(/\b(?:seviyorum|istiyorum|begeniyorum|olsun)\b/.test(after)||/\b(?:prefer|prefere|like|love|want|aime|veux|souhaite|kan lide|onsker)\b/.test(before))positive.add(m.id);
 });
 for(const id of negative)positive.delete(id);return {positive:[...positive],negative:[...negative]};
}
