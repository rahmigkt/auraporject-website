import {L}from'./languages.mjs';
import {P}from'./phrases-v2.mjs';
const normal=s=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/\{\w+\}/g,' value ').replace(/\p{N}+/gu,' number ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const internal=/duvar çalışma alanı|wall study area|wandstudie|zone réservée aux murs|zone d’étude|studiegebied voor muren|området til vægstudiet|zona de estudio de paredes|area di studio delle pareti|مساحة (?:دراسة|تجربة) الجدران|pos_xy_mm|wall_id|source exception|çözücü|\bsolver\b/iu;
export function quality(rows){
 const byLanguage={};
 for(const language of Object.keys(L)){
  const rs=rows.filter(r=>r.language===language),counts=new Map();
  for(const r of rs){const key=normal(r.source.reply_template);counts.set(key,(counts.get(key)||0)+1);}
  const constrained=rs.filter(r=>r.assistant.actions.some(a=>a.kisitlar?.length));
  const multiple=rs.filter(r=>r.category==='multiple');
  const constrainedMultiple=multiple.filter(r=>r.assistant.actions.some(a=>a.kisitlar?.length));
  byLanguage[language]={rows:rs.length,authored_user_patterns:new Set(rs.map(r=>normal(r.source.user_template))).size,reply_patterns:counts.size,max_repeated_reply_pattern:Math.max(...counts.values()),constrained_rows:constrained.length,constrained_ratio:constrained.length/rs.length,constrained_multiple:constrainedMultiple.length,multiple_rows:multiple.length,constrained_multiple_ratio:constrainedMultiple.length/multiple.length,constraint_types:[...new Set(constrained.flatMap(r=>r.assistant.actions.flatMap(a=>(a.kisitlar||[]).map(c=>c.tur))))].sort(),internal_term_rows:rs.filter(r=>internal.test(r.user+' '+r.assistant.reply)).map(r=>r.id),semicolon_multiple:multiple.filter(r=>/[;؛]/u.test(r.user)).map(r=>r.id),new_remote_rooms:rs.filter(r=>r.assistant.actions.some(a=>a.type==='oda_tanimla'&&a.kose)).map(r=>r.id),clarify_topics:[...new Set(rs.filter(r=>r.category==='clarify').map(r=>r.source.group))],provenance:'Counts measure authored surface sentence patterns with placeholders, numbers, punctuation and diacritics normalized; not independent intentions or native-speaker approval.'};
 }
 return {version:'C1-quality/2',by_language:byLanguage,old_review:'hacim-1-istek:* duzelt',self_approved:false,review_status:'resubmit_to_Claude'};
}
