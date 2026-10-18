// Run with a local `playwright` install, or PLAYWRIGHT_MODULE pointing to its installed package.
// Only the loopback review server is reachable. Playwright owns an ephemeral browser profile.
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,locale:'tr-TR',reducedMotion:'reduce'});
await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:8766'?route.continue():route.abort());
const base=new URL('./screenshots/',import.meta.url);await mkdir(base,{recursive:true});
const report={viewport:{width:1440,height:1000},deviceScaleFactor:1,browser:browser.version(),captures:[]};
try{
  for(const family of ['seating','table','storage','kitchen','bath','bedroom']){
    for(const version of ['before','after']){
      const page=await context.newPage(), errors=[];
      page.on('pageerror',error=>errors.push(String(error)));
      page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
      const url=`http://127.0.0.1:8766/tests/visual/gorsel-01/capture.html?family=${family}&version=${version}`;
      const started=Date.now();
      await page.goto(url,{waitUntil:'networkidle',timeout:60000});
      await page.waitForFunction(()=>window.reviewReady===true,null,{timeout:60000});
      await page.evaluate(()=>document.fonts.ready);
      const info=await page.evaluate(()=>window.reviewInfo);
      if(errors.length)throw new Error(`${family}/${version}: ${errors.join('\n')}`);
      const path=fileURLToPath(new URL(`${family}-${version}.png`,base));
      await page.screenshot({path,fullPage:true});
      report.captures.push({family,version,file:`screenshots/${family}-${version}.png`,url,elapsedMs:Date.now()-started,...info,errors});
      console.log(`CAPTURE ${family}/${version} ${report.captures.at(-1).elapsedMs}ms`);
      await page.close();
    }
  }
  await writeFile(new URL('./capture-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
}finally{await context.close();await browser.close();}
