// Actual local studio UI, no production services; optional PLAYWRIGHT_MODULE points at an existing install.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, extname, sep} from 'node:path';
import {createRequire} from 'node:module';
import {sample, normalizeDesign} from '../../assets/forma/generate.js';
const {chromium} = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve('.'), out = resolve(process.env.AURA_TEST_OUTPUT || 'work/storage-bay-ui'); mkdirSync(out, {recursive:true});
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm'};
const server = createServer((req,res) => {
  if (req.method !== 'GET') {res.writeHead(405);return res.end();}
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if (pathname.startsWith('/api/')) {res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({available:false}));}
  const file = resolve(root,'.'+pathname);
  if (!file.startsWith(root+sep) || !existsSync(file)) {res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',mime[extname(file)] || 'application/octet-stream');res.end(readFileSync(file));
});
await new Promise(r => server.listen(0,'127.0.0.1',r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({headless:true,...(process.env.AURA_CHROME_PATH ? {executablePath:process.env.AURA_CHROME_PATH} : {}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});

const results=[];
try{
 for(const [family,kind,width] of [['storage','wardrobe',390],['kitchen','run',1440],['bath','basin',390]]){
  const design=normalizeDesign({family,kind,style:'japandi',seed:2});
  const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390,acceptDownloads:true});
  await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
  await context.addInitScript(({design})=>{if(!sessionStorage.getItem('hardware-seeded')){
   localStorage.setItem('aura-forma-design-'+design.family,JSON.stringify(design));localStorage.setItem('aura-forma-family',JSON.stringify(design.family));localStorage.setItem('aura-forma-lang',JSON.stringify('tr'));localStorage.setItem('aura-forma-guide-seen','1');localStorage.setItem('aura-forma-account-skip','1');sessionStorage.setItem('hardware-seeded','1');
  }},{design});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/tasarla.html');await page.waitForFunction(()=>window.formaDebug?.state?.compiled);
  assert.equal(await page.evaluate(()=>innerWidth),width);
  await page.locator('[data-enum="runnerSystem"][data-value="accuride-3832ec"]').click();
  await page.waitForFunction(()=>formaDebug.state.design.params.runnerSystem==='accuride-3832ec');
  const acc=await page.evaluate(()=>formaDebug.state.compiled.parts.find(q=>q.role==='box-bottom')?.hardware);
  assert.equal(acc.profile,'accuride-3832ec');
  await page.locator('[data-enum="runnerSystem"][data-value="hettich-ka5632-ss-2025"]').click();
  await page.waitForFunction(()=>formaDebug.state.compiled.parts.some(q=>q.hardware?.profile==='hettich-ka5632-ss-2025'));
  await page.locator('[data-enum="backConstruction"][data-value="module-grooved"]').click();
  await page.locator('[data-enum="connectorSystem"][data-value="rastex15-18-du232t"]').click();
  await page.locator('[data-enum="hingeSystem"][data-value="blum-110-inserta-expando"]').click();
  for(const [key,value]of [['shelfSupportSystem','hettich-16181'],['railSystem','hettich-sl786'],['runnerFixingSystem','hettich-6x14-trial']])await page.locator(`[data-enum="${key}"][data-value="${value}"]`).click();
  const chosen=await page.evaluate(()=>formaDebug.state.design);
  await page.reload();await page.waitForFunction(()=>window.formaDebug?.state?.compiled);
  assert.deepEqual(await page.evaluate(()=>formaDebug.state.design),chosen);
  const manifest=await page.evaluate(async()=>{const m=await import('/assets/forma/production/manufacturing.js');return m.manufacturingReport(formaDebug.state.compiled,formaDebug.state.design);});
  assert.equal(manifest.production_approved,false);assert(manifest.parts.length>0);
  assert.equal(chosen.params.hingeSystem,'blum-110-inserta-expando');assert.equal(chosen.params.shelfSupportSystem,'hettich-16181');assert.equal(chosen.params.runnerFixingSystem,'hettich-6x14-trial');assert.equal(chosen.params.railSystem,'hettich-sl786');assert.deepEqual(manifest.invalid_operations,[]);
  if(family==='storage'){
    await page.locator('[data-tab="deliver"]').click();
    await page.locator('[data-act="add"]').click();
    const downloading=page.waitForEvent('download',{timeout:60000});
    await page.locator('[data-act="manufacturingGeometry"]').click();
    const download=await downloading;assert.equal(download.suggestedFilename(),'AURA-manufacturing-geometry-review.zip');
    await download.saveAs(resolve(out,download.suggestedFilename()));
  }
  const filename=`hardware-${family}-${width}.png`;await page.screenshot({path:resolve(out,filename),fullPage:true});
  assert.deepEqual(errors,[]);results.push({family,kind,width,selected_and_reloaded:true,drawer_code:manifest.drawer_hardware[0]?.product_code,part_count:manifest.part_count,page_errors:errors});
  writeFileSync(resolve(out,'results.json'),JSON.stringify({passed:results.length,results},null,2));console.log('PASS '+family+'/'+width);await context.close();
 }
}finally{await browser.close();server.close();}
