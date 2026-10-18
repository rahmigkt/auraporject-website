// Audits authored records; never creates examples, labels or predictions.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export function skeleton(text){
 return text.toLocaleLowerCase('tr').replaceAll('ı','i').normalize('NFD').replace(/\p{M}/gu,'')
  .replace(/\b(?:rica etsem|rica ederim|lutf(?:en)?|lutfen|please|could you|can you|would you|bitte|gern|gerne|graag|s il vous plait|por favor|per favore|venligst)\b/gu,' ')
  .replace(/\d+(?:[.,]\d+)*(?:\s*[-–]\s*\d+(?:[.,]\d+)*)?/gu,' ')
  .replace(/\b(?:sifir|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on|yirmi|otuz|kirk|elli|altmis|yetmis|seksen|doksan|yuz|bin|bucuk|virgul|one|two|three|four|five|six|seven|eight|nine|ten|half|hundred|thousand|eins|zwei|drei|vier|funf|sechs|sieben|acht|neun|zehn|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|en|et|to|tre|fire|fem|seks|syv|otte|ni|ti|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\b/gu,' ')
  .replace(/[^\p{L}\s]/gu,' ').replace(/\s+/gu,' ').trim();
}
export function audit(records){
 const groups=new Map();
 for(const r of records){const key=skeleton(r.text),g=groups.get(key)||[];g.push(r);groups.set(key,g);}
 const duplicates=[...groups].filter(([,rs])=>rs.length>1).map(([key,rs])=>({skeleton:key,count:rs.length,ids:rs.map(r=>r.id)}));
 const leakage=[...groups].filter(([,rs])=>new Set(rs.map(r=>r.split)).size>1).map(([key,rs])=>({skeleton:key,ids:rs.map(r=>r.id)}));
 const byLang=Object.fromEntries([...new Set(records.map(r=>r.lang))].map(l=>{
  const rs=records.filter(r=>r.lang===l),different=new Set(rs.map(r=>skeleton(r.text))).size;
  return [l,{records:rs.length,different,ratio:different/rs.length,categories:[...new Set(rs.map(r=>r.category))].sort()}];
 }));
 return {records:records.length,different:groups.size,ratio:groups.size/records.length,maxCopies:Math.max(0,...[...groups.values()].map(g=>g.length)),duplicates,leakage,byLang};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),files=args.filter(a=>a.endsWith('.jsonl'));
 if(!files.length)throw Error('iskelet.mjs <dev.jsonl> <test.jsonl> [--out <json>]');
 const records=files.flatMap(p=>readFileSync(p,'utf8').trim().split('\n').map(JSON.parse));
 const result=audit(records);
 result.files=Object.fromEntries(files.map(p=>[p.replaceAll('\\','/'),{sha256:createHash('sha256').update(readFileSync(p)).digest('hex')}]));
 const out=args.indexOf('--out');if(out>=0)writeFileSync(args[out+1],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
 if(result.ratio<0.9||result.maxCopies>2||result.leakage.length)process.exitCode=1;
}
