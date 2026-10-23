import fs from 'node:fs';import path from 'node:path';
import {normalizeDesign,compileDesign} from '../../assets/forma/generate.js';
import {dimensionProjectFiles} from '../../assets/forma/dimension-package.js';
import {cuttingPlan,cuttingCsv} from '../../assets/forma/production/nesting.js';
import {zip} from '../../assets/forma/package.js';
const value=k=>process.argv[process.argv.indexOf(k)+1];
if(!process.argv.includes('--model')||!process.argv.includes('--out'))throw Error('--model and --out required');
const input=JSON.parse(fs.readFileSync(value('--model'),'utf8')),original=normalizeDesign(input.design||input);
const design=normalizeDesign({...original,params:{...original.params,runnerSystem:'accuride-3832ec',connectorSystem:'rastex15-18-du232t',backConstruction:'module-grooved'}});
const c=compileDesign(design),cp=cuttingPlan(c,design);if(!cp.complete)throw Error('Pilot cutting plan incomplete');
const files=dimensionProjectFiles([{id:'WARDROBE-PRODUCTION-TRIAL',qty:1,design}],compileDesign);
files.push({name:'01/cutting-review.csv',data:cuttingCsv(cp)},
 {name:'original-design.json',data:JSON.stringify(original,null,2)},
 {name:'URETIM-PILOTU.txt',data:'AURA - Gardırop üretim pilotu\nBu paket imalata/CNC işlemine verilmiş bir onay değildir.\nDış nominal ölçüler: 1800 x 2400 x 600 mm; kulplar dahil model zarfı ayrıca part-dimensions.json içindedir.\nÖzgün tasarım korunur. Yeni pilot: Accuride 3832-C20EC, 18 mm Rastex 15/DU232T, modül başına tek arkalık.\nRay seçimi değişince çekmece kutusu, levha kalınlığı ve taban gerçek modelde yeniden hesaplanır.\nKesim CSVsi bitmiş/bantlı ölçüleri ham blank ölçülerinden ayırır; bu bir teklif/inceleme listesidir.\nYuvalar ve Rastex delikleri kaynaklı aday operasyonlardır; gövdede henüz çıkarılmış CNC geometrisi değildir.\nGövde ve modül arkalıkları kesimden sınırlı bağımsız hesapla yeniden kuruldu. Bu bütün gardırobun montaj kanıtı değildir.\nAçık: menteşe ve ray deliklerinin tam ürün/yerleşim reçeteleri, orta dikme ve çekmece bağlantıları, gerçek malzeme/bant ölçümü, bütün hareket/çarpışma ve yük kontrolü.\nToleranslar atölyede doğrulanacak deneme değerleridir; uluslararası uygunluk belgesi değildir.\nKoltuk/masa gibi ailelerde ölçü zarfı döşeme kalıbı, tornalı profil veya bağlantı reçetesi yerine geçmez.\n'});
const out=path.resolve(value('--out'));fs.mkdirSync(out,{recursive:true});
for(const f of files){const p=path.join(out,f.name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,f.data);}
fs.writeFileSync(path.join(out,'GARDIROP-URETIM-PILOTU.zip'),zip(files));
console.log(JSON.stringify({out,files:files.length,cutting_complete:cp.complete,manufacturing_approved:false}));
