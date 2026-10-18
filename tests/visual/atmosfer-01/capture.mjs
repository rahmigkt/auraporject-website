// Explicit user-authorized Playwright; ephemeral profile and loopback only.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const [k,v]=a.split('=');return[k.replace(/^--/,''),v];}));
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1050},deviceScaleFactor:1});
await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin==='http://127.0.0.1:8768'||u.protocol==='data:'?r.continue():r.abort();});
const output=new URL('../../../knowledge/atmosfer/kareler/',import.meta.url);await fs.mkdir(output,{recursive:true});
const report={browser:browser.version(),requestedMode:args.mode||'path',captures:[]};
const reportFile=new URL(args.id?`capture-report-${args.id.replaceAll(',','_')}.json`:'capture-report.json',output);
try{
 const all=JSON.parse(await fs.readFile(new URL('./designs.json',import.meta.url),'utf8'));
 const selected=all.filter(d=>!args.id||args.id.split(',').includes(d.id));
 if(!selected.length)throw new Error('No matching design fixtures');
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('requestfailed',r=>errors.push(`${r.url()}: ${r.failure()?.errorText}`));
 await page.goto('http://127.0.0.1:8768/tests/visual/atmosfer-01/review.html',{waitUntil:'networkidle',timeout:60000});
 try { await page.waitForFunction(()=>window.reviewReady===true,null,{timeout:60000}); }
 catch(error) { throw new Error(`Review page did not initialize: ${errors.join('; ') || error.message}`); }
 const eager=await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>/\/pathtracer\/|\/atmosfer\.js/.test(r.name)));
 if(eager)throw new Error('Final renderer loaded before explicit request');
 report.gpu=await page.evaluate(()=>{const gl=document.querySelector('#studio canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 for(const fixture of selected){
  console.log(`${fixture.id}: preparing studio materials`);
  await page.evaluate(id=>window.setReviewDesign(id),fixture.id);
  await page.locator('#studio canvas').screenshot({path:new URL(fixture.id+'-studio.png',output).pathname.replace(/^\/(.:)/,'$1')});
  console.log(`${fixture.id}: rendering final (${args.mode||'path'})`);
  let result;
  const progress=setInterval(()=>page.locator('#status').textContent({timeout:2000}).then(s=>console.log(`${fixture.id}: ${s}`),()=>{}),15000);
  try { result=await page.evaluate(async options=>window.renderFinal(options),{id:fixture.id,width:+args.width||2400,height:+args.height||1600,samples:+args.samples||64,mode:args.mode||'path',preset:args.preset||'north'}); }
  finally { clearInterval(progress); }
  await fs.writeFile(new URL(fixture.id+'-final.jpg',output),Buffer.from(result.jpeg.split(',')[1],'base64'));delete result.jpeg;
  if(errors.length)throw new Error(errors.join('\n'));
  report.captures.push({...result,family:fixture.design.family,lazyLoadVerified:true,errors});console.log(JSON.stringify(result));
  await fs.writeFile(reportFile,JSON.stringify(report,null,2)+'\n');
 }
}finally{await browser.close();}
