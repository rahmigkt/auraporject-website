import fs from 'node:fs';import path from 'node:path';
import {normalizeDesign,compileDesign} from '../../assets/forma/generate.js';
import {machiningGeometryFiles} from '../../assets/forma/production/machined-geometry.js';
import {manufacturingReport,manufacturingOperationsCsv} from '../../assets/forma/production/manufacturing.js';
import {cuttingPlan,cuttingCsv} from '../../assets/forma/production/nesting.js';
import {zip} from '../../assets/forma/package.js';
const arg=k=>{const i=process.argv.indexOf(k);if(i<0||!process.argv[i+1])throw Error(k+' required');return process.argv[i+1];};
const code=arg('--code-sha');if(!/^[0-9a-f]{40}$/.test(code))throw Error('Exact code SHA required');
const original=JSON.parse(fs.readFileSync(arg('--model'),'utf8')),design=normalizeDesign({...original.design,params:{...original.design.params,hingeSystem:'blum-110-inserta-expando',runnerSystem:'hettich-ka5632-ss-2025',connectorSystem:'rastex15-18-du232t',backConstruction:'module-grooved'}}),c=compileDesign(design),r=manufacturingReport(c,design),cut=cuttingPlan(c,design);
if(!cut.complete)throw Error('Incomplete cutting review');
const {files,manifest}=await machiningGeometryFiles(c,design);
files.push({name:'original-design.json',data:JSON.stringify(original,null,2)},{name:'machining-operations.csv',data:manufacturingOperationsCsv(r)},{name:'cutting-review.csv',data:cuttingCsv(cut)},{name:'manufacturing-review.json',data:JSON.stringify(r,null,2)},
 {name:'KANIT-VE-KAPSAM.txt',data:`AURA imalat geometrisi incelemesi\nKod: ${code}\nÖzgün tasarım saklanır. Hettich KA5632, Blum INSERTA/EXPANDO ve18mm Rastex deneme profilleri seçilmiştir.\nDesteklenen delik ve dikdörtgen arkalık yuvaları gerçek CSG ile çıkarılmıştır. assembly.json yerel STL koordinatlarını ve parça yerleşimlerini içerir.\nBu, ihracat/yerleşim ve bazı nominal delik eşleşmelerinin kanıtıdır; bütün gardırobun fiziksel olarak üretilebilir veya yük altında güvenli olduğunu göstermez.\nRay tablosu yalnız üretici delik merkezleridir; vida/pilot ve kapalı üye referansı henüz imalat reçetesi değildir.\nRaf/askılık/çekmece kutusu/cephe ve kaide-gövde bağlantıları, tam açılım çarpışmaları, gerçek levha/bant ve atölye toleransları açık.\nKoltuk ve masa gibi diğer aileler için dolap donanımı uygulanmış sayılmaz.\nİmalat/CNC onayı: YOK.\n`});
const out=path.resolve(arg('--out'));fs.mkdirSync(out,{recursive:true});
for(const f of files){const p=path.join(out,f.name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,f.data);}
fs.writeFileSync(path.join(out,'GARDIROP-ISLENMIS-GEOMETRI-INCELEME.zip'),zip(files));
console.log(JSON.stringify({code_sha:code,files:files.length,parts:manifest.assembly.length,machined:manifest.machined.length,operations:r.parts.reduce((s,p)=>s+p.operations.length,0),production_approved:false}));
