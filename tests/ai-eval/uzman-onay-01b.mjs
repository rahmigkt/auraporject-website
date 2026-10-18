// Separate 01B workflow. Existing 01A CSV, decisions, scripts and exam files are never written.
import {readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {importDecisions} from './uzman-onay.mjs';
const here=new URL('./',import.meta.url),args=process.argv.slice(2),opt=k=>args[args.indexOf(k)+1];
const records=['dev','test'].flatMap(s=>readFileSync(new URL(`sinav-01b-${s}.jsonl`,here),'utf8').trim().split('\n').map(JSON.parse));
const words={worktopHeight:'tezgahın yerden yüksekliği',wallHeight:'üst dolap yüksekliği',wallDepth:'üst dolap derinliği',wallGap:'tezgah / üst dolap aralığı',mountHeight:'montaj yüksekliği',armHeight:'kolçak yüksekliği',armWidth:'kolçak genişliği',backRake:'sırt eğimi',seatHeight:'oturma yüksekliği',legHeight:'ayak yüksekliği',cushionThickness:'minder kalınlığı',cornerRadius:'köşe yarıçapı',solidThickness:'masif panel kalınlığı',mirrorHeight:'ayna yüksekliği',frontFit:'ön yüz oturuşu',mirror:'ayna biçimi',mirrorLight:'ayna ışığı',mirrorCabinet:'ayna dolabı',tap:'batarya',sink:'evye',sinkMount:'evye montajı',hood:'davlumbaz',backsplash:'sıçrama paneli',leather:'deri',linen:'keten',wool:'yün',cotton:'pamuk',velvet:'kadife',boucle:'bukle',stone:'taş',glass:'cam',surface:'yüzey',finish:'bitiş',metal:'metal',cream:'krem',black:'siyah',chrome:'krom',brass:'pirinç',veneer:'kaplama',lacquer:'lake / parlak cila',matte:'mat',oil:'yağlı',backType:'sırt tipi',seatType:'oturum tipi',legType:'ayak tipi',welt:'biye',stitch:'dikiş',drawers:'çekmece sayısı',pull:'kulp',frontStyle:'ön yüz biçimi',base:'taban',baseType:'kaide tipi',shelf:'alt raf',basinType:'lavabo montaj tipi',sofa:'kanepe',loveseat:'ikili',column:'boy dolabı',basin:'lavabo dolabı',desk:'çalışma masası',nightstand:'komodin',storage:'depolama',kitchen:'mutfak',bath:'banyo',vessel:'çanak',undermount:'alttan montaj',wall:'duvar',deck:'tezgah',back:'arkadan',top:'üst',inset:'içten',overlay:'bindirme',sliding:'sürgülü',hinged:'menteşeli',induction:'indüksiyon',gas:'gazlı',integrated:'entegre',chimney:'bacalı',pullout:'çekilebilir',drainer:'damlalıklı',single:'tek',double:'çift',round:'yuvarlak',oval:'oval',arch:'kemer',capsule:'kapsül',rect:'dikdörtgen',rounded:'köşeleri yuvarlatılmış',legs:'ayaklı',castor:'tekerlekli',bench:'tek uzun minder',split:'bölünmüş minder',tight:'sabit',loose:'ayrı minderli',tufted:'kapitone',square:'kare',slim:'ince',bar:'çubuk',knob:'topuz',cane:'hasır',slats:'çıtalı',slatted:'çıtalı',fluted:'ince kanallı',flat:'düz',cabinet:'dolaplı',trestle:'sehpa ayak',full:'tam',contrast:'kontrast',self:'aynı kumaş'};
const tr=v=>words[v]??v;
const summary=a=>{
 const types={set:'ayarla',delta:'göreli değiştir',enum:'seç',material:'malzeme',kind:'tür',family:'aile',style:'tarz',drawers:'çekmece sayısı'};
 return [types[a.type]??a.type,a.slot?tr(a.slot):a.type==='material'?'tüm yuvalar':null,a.key&&tr(a.key),a.value!==undefined?tr(a.value):null,
  a.sign?(a.sign==='+'?'artır':'azalt'):null,a.range?`aralık ${a.range.join(' … ')}`:null].filter(v=>v!==null&&v!==undefined&&v!==false).join(' / ');
};
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
if(args.includes('--export')){
 const rows=[['id','dil','aile','cümle','beklenen','yasaklar','soru mu','karar','not'],...records.map(r=>[r.id,r.lang,r.context.family,r.text,r.gold.expect.map(summary).join('; ')+(r.gold.unsupported?.length?' | Desteklenmeyen: '+r.gold.unsupported.join('; '):''),r.gold.forbid.map(summary).join('; '),r.gold.clarify?'evet':'hayır','',''])];
 writeFileSync(new URL('uzman-onay-01b.csv',here),'\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n')+'\r\n');
 console.log(`${records.length} ayrı 01B kaydı dışa aktarıldı.`);
}else if(args.includes('--import')){
 if(!args.includes('--reviewer')||!opt('--import')||opt('--import').startsWith('--'))throw Error('--import <csv> --reviewer <ad> gerekli');
 const target=new URL('onaylar-01b.json',here),old=existsSync(target)?JSON.parse(readFileSync(target,'utf8')):{};
 const result=importDecisions(readFileSync(resolve(opt('--import')),'utf8'),opt('--reviewer'),records,old);
 const tmp=new URL('onaylar-01b.json.tmp',here);writeFileSync(tmp,JSON.stringify(result,null,2)+'\n');renameSync(tmp,target);
 console.log(`${Object.keys(result).length} karar onaylar-01b.json içinde; sınavlar değiştirilmedi.`);
}else throw Error('--export | --import <csv> --reviewer <ad>');
