import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {launchIsolated,closeIsolated} from './isolated-browser.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),origin=process.env.ATMOSFER_ORIGIN;
const {browser,server}=await launchIsolated(chromium,{channel:'chrome',headless:true,args:['--no-proxy-server']});
const output=new URL('../../../knowledge/atmosfer/sahneler/ornekler/',import.meta.url);await fs.mkdir(output,{recursive:true});let passed=false;
const report={schema:'aura.plate-capture/1',browser:browser.version(),frames:[],errors:[]};
report.sources={};for(const path of ['assets/forma/scene-plates.js','tests/visual/atmosfer-01/plates-review.html','tests/visual/atmosfer-01/plates-capture.mjs'])report.sources[path]=createHash('sha256').update(await fs.readFile(new URL('../../../'+path,import.meta.url))).digest('hex');
try{
 const page=await browser.newPage();await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(origin+'/tests/visual/atmosfer-01/plates-review.html');await page.waitForFunction(()=>window.platesReady);
 const fixtures=await page.evaluate(()=>window.plateExamples);await fs.writeFile(new URL('examples.json',output),JSON.stringify(fixtures,null,2));
 for(const fixture of fixtures){
  if(process.env.PLATE_FAMILY&&fixture.design.family!==process.env.PLATE_FAMILY)continue;
  for(const texture of ['KIREC','TAS','TOPRAK'])for(const light of ['SABAH','AKSAM'])for(const camera of ['A','B']){
   if(process.env.PLATE_SMOKE&&(texture!=='KIREC'||light!=='SABAH'))continue;
   const result=await page.evaluate(options=>window.renderPlateExample(options),{id:fixture.id,texture,light,camera});
   const file=`${fixture.id}-${texture}-${light}-${camera}.jpg`;await fs.writeFile(new URL(file,output),Buffer.from(result.jpeg.split(',')[1],'base64'));delete result.jpeg;
   if(result.size!=='medium'||result.projectedWidth<.60||result.projectedWidth>.75)throw Error('Product framing outside bounds: '+JSON.stringify(result));
   if(Object.values(result.frameBounds).some(v=>Math.abs(v)>.99))throw Error('Product cropped: '+JSON.stringify(result));
   report.frames.push({id:fixture.id,file,...result});console.log(file+' '+result.projectedWidth.toFixed(3));
  }
 }
 if(report.errors.length)throw Error(report.errors.join('\n'));passed=true;
}finally{report.passed=passed;report.cleanup=await closeIsolated(browser,server);await fs.writeFile(new URL(process.env.PLATE_FAMILY?`capture-${process.env.PLATE_FAMILY}.json`:'capture.json',output),JSON.stringify(report,null,2));}
process.exit(passed?0:1);
