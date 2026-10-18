import {readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const here=new URL('./',import.meta.url);
const readRecords=()=>['dev','test'].flatMap(s=>readFileSync(new URL(`sinav-01-${s}.jsonl`,here),'utf8').trim().split('\n').map(JSON.parse));
const headers=['id','dil','aile','cümle','beklenen','yasaklar','soru mu','karar','not'];
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const words={set:'ayarla',delta:'göreli değiştir',enum:'seç',material:'malzeme',kind:'tür',family:'aile',style:'tarz',command:'komut',drawers:'çekmece',seats:'oturma sayısı',width:'genişlik',length:'uzunluk',depth:'derinlik',topDepth:'tezgah derinliği',topThickness:'tabla kalınlığı',species:'ağaç türü',color:'renk',wood:'ahşap',case:'gövde',front:'ön yüz',fabric:'kumaş',top:'tabla',oak:'meşe',walnut:'ceviz',white:'beyaz',armType:'kolçak tipi',none:'yok',topShape:'tabla şekli',round:'yuvarlak',doorType:'kapak tipi',sliding:'sürgülü',hob:'ocak',induction:'indüksiyon',basins:'lavabo sayısı',double:'çift',armchair:'berjer',coffee:'sehpa',wardrobe:'gardırop',island:'ada',column:'boy dolabı',seating:'oturma',table:'masa',japandi:'Japandi'};
const tr=v=>words[v]??String(v);
export const summary=a=>[tr(a.type),a.slot&&tr(a.slot),a.key&&tr(a.key),a.value!==undefined&&tr(a.value),a.sign&&`${a.sign==='+'?'artır':'azalt'} (${a.range.join(' … ')})`].filter(Boolean).join(' / ');
export function parseCSV(raw){
 raw=raw.replace(/^\uFEFF/,'');
 const rows=[];let row=[],value='',quoted=false,closed=false;
 for(let i=0;i<raw.length;i++){
  const c=raw[i];
  if(quoted){if(c==='"'){if(raw[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else value+=c;continue;}
  if(c==='"'){if(value||closed)throw Error('CSV: beklenmeyen tırnak');quoted=true;continue;}
  if(c===','||c==='\n'||c==='\r'){
   row.push(value);value='';closed=false;
   if(c!==','){if(c==='\r'&&raw[i+1]==='\n')i++;rows.push(row);row=[];}
  }else {if(closed)throw Error('CSV: kapanan tırnaktan sonra veri');value+=c;}
 }
 if(quoted)throw Error('CSV: kapanmamış tırnak');
 if(value||row.length||closed){row.push(value);rows.push(row);}
 return rows;
}
export function importDecisions(raw,reviewer,records,existing={}){
 if(!reviewer?.trim())throw Error('--reviewer boş olamaz');
 const rows=parseCSV(raw),head=rows.shift();
 if(JSON.stringify(head)!==JSON.stringify(headers))throw Error('CSV sütunları beklenen sırada değil');
 const known=new Map(records.map(r=>[r.id,r])),seen=new Set(),result={...existing};
 for(const row of rows){
  if(row.length!==headers.length)throw Error('CSV sütun sayısı yanlış');
  const [id,lang,family,text,,,,decision,note]=row,r=known.get(id);
  if(!r||seen.has(id))throw Error(`Bilinmeyen/tekrarlanan id: ${id}`);seen.add(id);
  if(lang!==r.lang||family!==r.context.family||text!==r.text)throw Error(`Kayıt kimliği/içeriği değişmiş: ${id}`);
  const d=decision.trim().toLocaleLowerCase('tr');
  if(!d)continue;
  if(!['onay','ret','düzelt'].includes(d))throw Error(`Geçersiz karar: ${decision}`);
  if(d==='düzelt'&&!note.trim())throw Error(`Düzeltme notu gerekli: ${id}`);
  result[id]={review:d==='onay'?'approved':'rejected',reviewed_by:reviewer.trim(),date:new Date().toISOString(),note,...(d==='düzelt'?{decision:'düzelt'}:{})};
 }
 return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),opt=k=>args[args.indexOf(k)+1],records=readRecords();
 if(args.includes('--export')){
  const rows=records.map(r=>[r.id,r.lang,r.context.family,r.text,r.gold.expect.map(summary).join('; ')+(r.gold.unsupported?.length?` | Desteklenmeyen: ${r.gold.unsupported.join('; ')}`:''),r.gold.forbid.map(summary).join('; '),r.gold.clarify?'evet':'hayır','','']);
  writeFileSync(new URL('uzman-onay-01.csv',here),'\uFEFF'+[headers,...rows].map(r=>r.map(quote).join(',')).join('\r\n')+'\r\n');
  console.log(`${rows.length} kayıt dışa aktarıldı`);
 }else if(args.includes('--import')){
  if(!args.includes('--reviewer')||!opt('--import')||opt('--import').startsWith('--'))throw Error('--import <csv> --reviewer <ad> gerekli');
  const path=new URL('onaylar-01.json',here),existing=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{};
  const result=importDecisions(readFileSync(resolve(opt('--import')),'utf8'),opt('--reviewer'),records,existing);
  const temp=new URL('onaylar-01.json.tmp',here);writeFileSync(temp,JSON.stringify(result,null,2)+'\n');renameSync(temp,path);
  console.log(`${Object.keys(result).length} karar ayrı dosyaya yazıldı; sınav dosyaları değişmedi.`);
 }else throw Error('--export | --import <csv> --reviewer <ad>');
}
