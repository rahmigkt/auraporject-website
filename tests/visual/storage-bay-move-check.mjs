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
const results = [];
const clean = x => JSON.parse(JSON.stringify(x,(k,v) => k === 'id' ? undefined : v));
try {
  for (const [family,kind,width] of [['storage','wardrobe',1440],['storage','nightstand',1440],['storage','dresser',1440],['storage','vanity',1440],['storage','tvunit',1440],['storage','bookcase',1440],['storage','vitrine',1440],['storage','sideboard',1440],['bath','basin',1440],['bath','column',1440],['bath','mirror',1440],['storage','wardrobe',390],['bath','column',390],['kitchen','run',1440]]) {
    if (process.env.AURA_UI_CASES && !process.env.AURA_UI_CASES.split(',').includes(`${family}/${kind}/${width}`)) continue;
    const initial = sample({family,kind,seed:2});
    if (family !== 'kitchen') initial.params = {...initial.params,mirrorCabinet:'cabinet',bays:[0,1,2].map(i => ({w:1+i*.2,mm:0,cells:[{type:'door',h:2,k:i,color:['sage','navy','sand'][i]},{type:'drawers',h:1,mm:120,n:i+1,color:'petrol'}]}))};
    const design = normalizeDesign(initial), context = await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390});
    await context.route('**/*',route => route.request().url().startsWith(base+'/') ? route.continue() : route.abort());
    await context.addInitScript(({design}) => {
      if (!sessionStorage.getItem('bay-test-seeded')) {
        localStorage.setItem('aura-forma-design-'+design.family,JSON.stringify(design));
        localStorage.setItem('aura-forma-family',JSON.stringify(design.family));
        localStorage.setItem('aura-forma-lang',JSON.stringify('tr'));
        localStorage.setItem('aura-forma-guide-seen','1');localStorage.setItem('aura-forma-account-skip','1');
        sessionStorage.setItem('bay-test-seeded','1');
      }
    },{design});
    const page = await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/tasarla.html');
    await page.waitForFunction(() => window.formaDebug?.state?.compiled);
    assert.equal(await page.evaluate(()=>innerWidth),width,'real viewport');
    const before = await page.evaluate(()=>formaDebug.state.design);
    const kitchen = family === 'kitchen', data = kitchen ? 'mop' : 'bayop', select = kitchen ? '[data-mod="1"]' : '[data-cell="1:1"]';
    // A kitchen SVG group spans base AND wall cabinets; its bounding-box centre may be empty backsplash.
    if (kitchen) await page.locator(select).locator('rect').first().click();
    else {
      // Nested drawer lines are valid cell hit targets; clicking only the rect rejects them.
      await page.locator(select).click();
      assert.deepEqual(await page.evaluate(()=>formaDebug.state.sel),{b:1,c:1},'actual cell selected before moving');
    }
    await page.locator(`[data-${data}="left"]`).click();
    assert(await page.locator(`[data-${data}="left"]`).isDisabled());
    const after = await page.evaluate(()=>formaDebug.state.design);
    const list = kitchen ? 'modules' : 'bays', expected = [...before.params[list]];
    [expected[0],expected[1]] = [expected[1],expected[0]];
    assert.deepEqual(clean(after.params[list]),clean(expected));
    if (!kitchen) assert.deepEqual(await page.evaluate(()=>formaDebug.state.sel),{b:0,c:1});
    await page.locator('#undoBtn').click();assert.deepEqual(await page.evaluate(()=>formaDebug.state.design),before);
    await page.locator('#redoBtn').click();assert.deepEqual(await page.evaluate(()=>formaDebug.state.design),after);
    await page.reload();await page.waitForFunction(()=>window.formaDebug?.state?.compiled);
    assert.deepEqual(await page.evaluate(()=>formaDebug.state.design),after);
    if (kind === 'wardrobe' || width===390) await page.screenshot({path:resolve(out,`${family}-${kind}-${width}.png`),fullPage:true});
    assert.deepEqual(errors,[],'no browser runtime errors');
    results.push({family,kind,width,move:true,undo_redo:true,reload:true,page_errors:errors.length});
    writeFileSync(resolve(out,'results.json'),JSON.stringify({passed:results.length,results},null,2)+'\n');
    console.log(`PASS ${family}/${kind}/${width}`);
    await context.close();
  }
  writeFileSync(resolve(out,'results.json'),JSON.stringify({passed:results.length,results},null,2)+'\n');
  console.log(JSON.stringify({passed:results.length,output:out}));
} finally {await browser.close();await new Promise(r=>server.close(r));}
