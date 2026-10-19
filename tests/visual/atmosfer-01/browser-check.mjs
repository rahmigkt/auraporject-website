const origin=process.env.ATMOSFER_ORIGIN||'http://127.0.0.1:8772';
// Integration checks against the loopback review server; no external requests.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=await chromium.launchServer({channel:'chrome',headless:true,args:['--no-proxy-server']});
const browser=await chromium.connect(server.wsEndpoint());
const context=await browser.newContext(),report={browser:browser.version(),checks:[]};
let passed=false;
await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/tests/visual/atmosfer-01/review.html');
  await page.waitForFunction(()=>window.reviewReady===true);
  assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/pathtracer/')||r.name.endsWith('/atmosfer.js'))),false);
  report.checks.push('Final renderer absent before explicit request');
  await page.evaluate(()=>window.setReviewDesign('seating-02'));
  const cancelled=await page.evaluate(async()=>{
    const pending=window.renderFinal({mode:'path',width:96,height:64,samples:2});
    document.querySelector('#cancel').click();
    try{await pending;return false;}catch(error){return error.name==='AbortError'&&!document.querySelector('#render').disabled&&document.querySelector('#cancel').disabled;}
  });
  assert(cancelled,'Cancel must reject with AbortError and restore the controls');
  report.checks.push('Cancel button rejects and restores controls');
  // Deliberate optional-module failure exercises auto fallback without relying
  // on this test machine having an unsupported GPU or waiting for a timeout.
  await page.route('**/vendor/pathtracer/index.js',route=>route.abort());
  const result=await page.evaluate(()=>window.renderFinal({mode:'auto',width:384,height:256,samples:2}));
  assert.equal(result.mode,'raster');assert(result.fallbackReason);assert(result.jpeg.startsWith('data:image/jpeg;base64,'));
  const dimensions=await page.evaluate(async jpeg=>{const image=new Image();image.src=jpeg;await image.decode();return[image.naturalWidth,image.naturalHeight];},result.jpeg);
  assert.deepEqual(dimensions,[384,256]);
  report.checks.push('Failed optional path module yields a real raster JPEG with a reason');
  report.fallbackReason=result.fallbackReason;
  assert.deepEqual(errors,[]);report.pageErrors=errors;
  await fs.writeFile(new URL('./browser-check-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  passed=true;console.log('PASS '+report.checks.join('; '));
}catch(error){report.failure=error.message;console.error(error);throw error;
}finally{
 let timer;report.cleanup={forced:false,scope:'Only the isolated Playwright browser server'};
 const bounded=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Isolated browser cleanup deadline')),ms);})]);
 try{await bounded(browser.close(),15000);clearTimeout(timer);await bounded(server.close(),10000);}
 catch(error){report.cleanup.forced=true;report.cleanup.reason=error.message;clearTimeout(timer);
  try{await bounded(server.kill(),10000);}catch{
   const child=server.process();if(child.exitCode===null&&Number.isSafeInteger(child.pid)){
    if(process.platform==='win32')spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'});else child.kill('SIGKILL');
   }
  }
 }finally{clearTimeout(timer);await fs.writeFile(new URL('./browser-check-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');}
 // This is a one-shot CLI, and a stuck transport must not retain it after the
 // isolated browser has been closed/killed and the result has been saved.
 process.exit(passed?0:1);
}
