// Authoring source. No parser import or predictions: gold is fixed before baseline execution.
// Refuses to overwrite a frozen exam. Numeric siblings share a templateGroup and split.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {vocab} from './vocab.mjs';
const here = new URL('./',import.meta.url);
if(existsSync(new URL('FREEZE.json',here))) throw Error('Frozen exam exists; do not regenerate.');
const families = ['seating','table','storage','kitchen','bath'];
const config = {
 seating:{kind:'sofa',key:'width',dim:'genişlik',slot:'wood',color:'fabric',values:[1800,1900,2000], part:['armType','none'],partText:'kolçakları kaldır',targetKind:'armchair',kindText:'berjere çevir',secondary:'depth',second:900},
 table:{kind:'dining',key:'length',dim:'uzunluk',slot:'top',color:'top',values:[1800,1900,2000],part:['topShape','round'],partText:'tabla yuvarlak olsun',targetKind:'coffee',kindText:'sehpa türüne geç',secondary:'width',second:900},
 storage:{kind:'sideboard',key:'width',dim:'genişlik',slot:'case',color:'front',values:[1800,1900,2000],part:['doorType','sliding'],partText:'sürgülü kapak olsun',targetKind:'wardrobe',kindText:'gardırop türüne geç',secondary:'depth',second:500},
 kitchen:{kind:'run',key:'topDepth',dim:'tezgah derinliği',slot:'case',color:'front',values:[600,650,700],part:['hob','induction'],partText:'indüksiyon ocak olsun',targetKind:'island',kindText:'mutfak adasına çevir',secondary:'topThickness',second:30},
 bath:{kind:'basin',key:'width',dim:'genişlik',slot:'case',color:'front',values:[1800,1900,2000],part:['basins','double'],partText:'çift lavabo olsun',targetKind:'column',kindText:'boy dolabına çevir',secondary:'depth',second:500}
};
const set=(key,value)=>({type:'set',key,value});
const mat=(slot,key,value)=>({type:'material',slot,key,value});
const delta=(key,sign,range)=>({type:'delta',key,sign,range});
const cats=['size','relative','material','color','part','kind','family','layout','negation','mixed','units','colloquial','ambiguous','offtopic','style','negation','negation','mixed','mixed','units','units','colloquial','relative','size'];
const devGroups = new Set([0,1,2,8,9,10,21,23]);
const intros=['','lütfen ','rica etsem '];
const records=[];
function add(f,lang,group,j,text,expect=[],forbid=[],clarify=false,unsupported=[]){
 const split=devGroups.has(group)?'dev':'test';
 const templateGroup=`g${String(group).padStart(2,'0')}`;
 records.push({id:`sinav01-${lang}-${f}-${group}-${j}`,lang,split,category:cats[group],context:{family:f,kind:config[f].kind},text,
  gold:{expect,forbid,clarify,...(unsupported.length?{unsupported}:{})},
  notes:`Sentetik; kalıp ${templateGroup}. ${!['tr','en'].includes(lang)?'anadil denetimi yok. ':''}${group===7?'Desteklenmeyen düzen isteği; eylem başarısı olarak yorumlanmaz. ':''}`,
  templateGroup,label:{by:'codex',reviewed_by:null,review:'unreviewed'}});
}
for(const f of families){
 const c=config[f], k=c.key, species=v=>mat(c.slot,'species',v), colour=mat(c.color,'color','white');
 const colorText=f==='seating'?'kumaş':f==='table'?'tabla':'kapaklar';
 const secondaryName={depth:'derinlik',width:'genişlik',topThickness:'tezgah kalınlığı'}[c.secondary];
 for(let g=0;g<24;g++)for(let j=0;j<3;j++){
  const n=c.values[j], cm=n/10, p=intros[j]; let text,ex=[],fo=[],cl=false,un=[];
  switch(g){
   case 0:text=`${p}${c.dim} ${cm} cm olsun`;ex=[set(k,n)];break;
   case 1:text=`${p}${c.dim} biraz artsın`;ex=[delta(k,'+',[5,100])];break;
   case 2:text=`${p}${f==='seating'?'ahşap':f==='table'?'tabla':'gövde'} ceviz olsun`;ex=[species('walnut')];break;
   case 3:text=`${p}${colorText} beyaz olsun`;ex=[colour];break;
   case 4:text=p+c.partText;ex=[{type:'enum',key:c.part[0],value:c.part[1]}];if(f==='seating')fo=vocab.families.seating.enums.armType.filter(v=>v!=='none').map(value=>({type:'enum',key:'armType',value}));break;
   case 5:text=p+c.kindText;ex=[{type:'kind',value:c.targetKind}];break;
   case 6:{const target=f==='seating'?'table':'seating';text=`${p}${target==='table'?'masa':'oturma'} ailesine geç`;ex=[{type:'family',value:target}];break;}
   case 7:text=`${p}iç düzeni ${j+2} eşit bölmeye ayır`;un=['eşit bölme sayısını ayarlama'];break;
   case 8:text=`${p}meşe istemiyorum`;fo=[species('oak')];cl=true;break;
   case 9:text=`${p}${c.dim} ${cm} cm olsun ama ceviz olmasın`;ex=[set(k,n)];fo=[species('walnut')];break;
   case 10:text=`${p}${c.dim} ${n/1000} metre yap`;ex=[set(k,n)];break;
   case 11:text=`${p}${c.dim} ${cm} santim yapsak ya`;ex=[set(k,n)];break;
   case 12:text=`${p}şunu ${['biraz değiştir','daha güzel yap','aynısından farklı yap'][j]}`;cl=true;break;
   case 13:text=['yarın yağmur yağar mı','akşam ne pişirsem','saat kaç oldu'][j];cl=true;break;
   case 14:text=p+['japandi tarzına geç','japandi stili istiyorum','tarz japandi olsun'][j];ex=[{type:'style',value:'japandi'}];break;
   case 15:text=`${p}${colorText} beyaz olmasın`;fo=[colour];cl=true;break;
   case 16:text=`${p}ceviz yerine meşe kullan`;ex=[species('oak')];fo=[species('walnut')];break;
   case 17:text=`${p}${c.dim} ${cm} cm ve ${secondaryName} ${c.second/10} cm`;ex=[set(k,n),set(c.secondary,c.second)];break;
   case 18:text=`${p}${f==='table'?'tabla':f==='seating'?'ahşap':'gövde'} meşe, ${colorText} beyaz olsun`;ex=[species('oak'),colour];break;
   case 19:text=`${p}${c.dim}: ${n} mm`;ex=[set(k,n)];break;
   case 20:text=`${p}${c.dim} ${String(cm).replace('.',',')} cm'ye ayarlansın`;ex=[set(k,n)];break;
   case 21:{const words=f==='kitchen'?['altmış','altmış beş','yetmiş']:['bir seksen','bir doksan','iki metre'];text=`${p}${c.dim} ${words[j]} olsun`;ex=[set(k,n)];break;}
   case 22:text=`${p}${c.dim} ${j+1} cm azalt`;ex=[delta(k,'-',[-(j+1)*10,-(j+1)*10])];break;
   case 23:text=`${p}${cm}'lık ${c.dim} istiyom`;ex=[set(k,n)];break;
  }
  add(f,'tr',g,j,text,ex,fo,cl,un);
 }
 // English: six independently worded groups, two dev, four test.
 for(const g of [0,1,15,17,19,22])for(let j=0;j<3;j++){
  const n=c.values[j], dim={width:'width',length:'length',topDepth:'worktop depth'}[k];
  const subject=f==='seating'?'fabric':f==='table'?'top':'fronts';
  let text,ex=[],fo=[],cl=false;
  if(g===0){text=`${['Please set','Set','Could you set'][j]} the ${dim} to ${n/10} cm`;ex=[set(k,n)];}
  if(g===1){text=`${['Please increase','Increase','Slightly increase'][j]} the ${dim} a little`;ex=[delta(k,'+',[5,100])];}
  if(g===15){text=`${['Please do not make','Do not make','I do not want'][j]} the ${subject} white`;fo=[colour];cl=true;}
  if(g===17){text=`${dim} ${n/10} cm and ${c.secondary==='topThickness'?'worktop thickness':c.secondary} ${c.second/10} cm please`;ex=[set(k,n),set(c.secondary,c.second)];}
  if(g===19){text=`${dim}: ${n} millimetres${[' please','',' if possible'][j]}`;ex=[set(k,n)];}
  if(g===22){text=`reduce the ${dim} by ${j+1} centimetres please`;ex=[delta(k,'-',[-(j+1)*10,-(j+1)*10])];}
  add(f,'en',g,j,text,ex,fo,cl);
 }
 // Five distinct intentions per other language. Numeric translations share their split with TR/EN.
 const packs={
 de:{dim:{width:'Breite',length:'Länge',topDepth:'Arbeitsplattentiefe'},size:n=>`Bitte auf ${n} cm einstellen`,relative:'Bitte etwas vergrößern',neg:'Bitte keine Eiche verwenden',mixed:n=>`Auf ${n} cm einstellen, aber kein Nussbaumholz`,units:n=>`Bitte auf ${n} Millimeter setzen`},
 fr:{dim:{width:'largeur',length:'longueur',topDepth:'profondeur du plan de travail'},size:n=>`Régler à ${n} cm`,relative:'Augmenter un peu',neg:'Je ne veux pas de chêne',mixed:n=>`Régler à ${n} cm, mais pas de noyer`,units:n=>`Régler à ${n} millimètres`},
 nl:{dim:{width:'breedte',length:'lengte',topDepth:'diepte van het werkblad'},size:n=>`Instellen op ${n} cm`,relative:'Een beetje vergroten graag',neg:'Geen eikenhout gebruiken graag',mixed:n=>`Instellen op ${n} cm, maar geen notenhout`,units:n=>`Instellen op ${n} millimeter`},
 da:{dim:{width:'bredde',length:'længde',topDepth:'bordpladens dybde'},size:n=>`Sæt til ${n} cm`,relative:'Gør den lidt større',neg:'Jeg vil ikke have egetræ',mixed:n=>`Sæt til ${n} cm, men ikke valnøddetræ`,units:n=>`Sæt til ${n} millimeter`},
 es:{dim:{width:'ancho',length:'largo',topDepth:'profundidad de la encimera'},size:n=>`Ajustar a ${n} cm`,relative:'Aumentar un poco',neg:'No quiero roble',mixed:n=>`Ajustar a ${n} cm, pero sin nogal`,units:n=>`Ajustar a ${n} milímetros`},
 it:{dim:{width:'larghezza',length:'lunghezza',topDepth:'profondità del piano di lavoro'},size:n=>`Imposta a ${n} cm`,relative:'Aumenta un poco',neg:'Non voglio rovere',mixed:n=>`Imposta a ${n} cm, ma senza noce`,units:n=>`Imposta a ${n} millimetri`}
 };
 // Size + relative are dev (2); remaining 3 test => 12 dev/family.
 for(const [lang,p] of Object.entries(packs)){
  const n=c.values[0], d=p.dim[k];
  add(f,lang,0,0,`${d}: ${p.size(n/10)}`,[set(k,n)]);
  add(f,lang,1,0,`${d}: ${p.relative}`,[delta(k,'+',[5,100])]);
  add(f,lang,15,0,p.neg,[],[species('oak')],true);
  add(f,lang,17,0,`${d}: ${p.mixed(n/10)}`,[set(k,n)],[species('walnut')]);
  // g17 foreign text has one numeric target; do not infer the English second dimension.
  add(f,lang,19,0,`${d}: ${p.units(n)}`,[set(k,n)]);
  records.at(-3).category='negation'; records.at(-2).category='mixed'; records.at(-1).category='units';
 }
}
// Validate gold against the grammar/catalogue, independently of the parser.
for(const r of records){
 const f=vocab.families[r.context.family];
 for(const a of [...r.gold.expect,...r.gold.forbid]){
  if(!vocab.actionTypes.includes(a.type))throw Error(`action ${r.id}`);
  if(['set','delta'].includes(a.type)&&!f.ranges[a.key])throw Error(`range ${r.id}: ${a.key}`);
  if(a.type==='set'&&(a.value<f.ranges[a.key][0]||a.value>f.ranges[a.key][1]))throw Error(`bounds ${r.id}`);
  if(a.type==='material'&&!f.materialSlots[a.slot]?.[a.key]?.includes(a.value))throw Error(`material ${r.id}: ${JSON.stringify(a)}`);
  if(a.type==='enum'&&!f.enums[a.key]?.includes(a.value))throw Error(`enum ${r.id}`);
  if(a.type==='kind'&&!f.kinds[a.value])throw Error(`kind ${r.id}`);
  if(a.type==='style'&&!f.styles.includes(a.value))throw Error(`style ${r.id}`);
 }
}
for(const split of ['dev','test']){
 const raw=records.filter(r=>r.split===split).map(r=>JSON.stringify(r)).join('\n')+'\n';
 writeFileSync(new URL(`sinav-01-${split}.jsonl`,here),raw);
 console.log(split,records.filter(r=>r.split===split).length,createHash('sha256').update(raw).digest('hex'));
}
