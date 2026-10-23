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
try {
 for(const width of [1440,390]){
  const design=sample({family:'seating',kind:'sofa',seed:2});
  const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390});
  await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
  await context.addInitScript(({design})=>{if(!sessionStorage.getItem('seeded')){
   localStorage.setItem('aura-forma-design-seating',JSON.stringify(design));localStorage.setItem('aura-forma-family',JSON.stringify('seating'));localStorage.setItem('aura-forma-lang',JSON.stringify('tr'));
   localStorage.setItem('aura-forma-guide-seen','1');localStorage.setItem('aura-forma-account-skip','1');sessionStorage.setItem('seeded','1');
  }},{design});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/tasarla.html');await page.waitForFunction(()=>window.formaDebug?.viewer);
  assert.equal(await page.evaluate(()=>innerWidth),width);
  const source=await page.evaluate(()=>formaDebug.state.design);
  await page.locator('[data-tab="team"]').click();
  await page.waitForFunction(()=>formaDebug.state.seatingPreview);
  assert.equal(await page.locator('#panel h2').innerText(),'Takım yap');
  const setQty=async(kind,n)=>{const input=page.locator(`[data-set-qty="${kind}"]`);await input.fill(String(n));await input.press('Tab');};
  await setQty('sofa',2);await setQty('loveseat',1);await setQty('armchair',2);
  assert.equal(await page.evaluate(()=>formaDebug.state.teamCache.plan.shown),5);
  await page.locator('[data-act="set-layout-1"]').click();
  assert(await page.locator('[data-act="set-layout-1"]').getAttribute('aria-pressed')==='true');
  await page.locator('[data-act="set-save"]').click();
  assert.deepEqual(await page.evaluate(()=>formaDebug.state.project.items.map(i=>i.qty)),[2,1,2]);
  await setQty('armchair',3);await page.locator('[data-act="set-save"]').click();
  assert.equal(await page.evaluate(()=>formaDebug.state.project.items.length),3);
  assert.deepEqual(await page.evaluate(()=>formaDebug.state.design),source);
  await page.screenshot({path:resolve(out,`set-${width}.png`),fullPage:true});
  await page.reload();await page.waitForFunction(()=>window.formaDebug?.viewer);
  await page.locator('[data-tab="team"]').click();
  assert.equal(await page.locator('[data-set-qty="armchair"]').inputValue(),'3');
  assert.deepEqual(await page.evaluate(()=>formaDebug.state.project.items.map(i=>i.qty)),[2,1,3]);
  await setQty('sofa',0);await setQty('loveseat',0);await setQty('armchair',0);
  assert(await page.locator('[data-act="set-save"]').isDisabled());
  await setQty('sofa',-1);assert.equal(await page.locator('[data-set-qty="sofa"]').inputValue(),'0');
  await page.locator('[data-act="set-back"]').click();assert.deepEqual(await page.evaluate(()=>formaDebug.state.design),source);
  assert.equal(await page.evaluate(()=>document.body.dataset.room),undefined);
  assert.deepEqual(errors,[]);results.push({width,create_update_reload_empty_invalid_return:true,page_errors:0});
  writeFileSync(resolve(out,'results.json'),JSON.stringify({passed:results.length,results},null,2));console.log('PASS '+width);await context.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
