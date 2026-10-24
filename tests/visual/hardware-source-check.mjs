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

const results=[],errors=[],downloads=[];
try{
 const context=await browser.newContext({viewport:{width:390,height:1000},hasTouch:true});await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
 await context.addInitScript(()=>{localStorage.setItem('aura-forma-lang',JSON.stringify('tr'));localStorage.setItem('aura-forma-guide-seen','1');localStorage.setItem('aura-forma-account-skip','1');});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));
 await page.goto(base+'/tasarla.html?ornek-uretim=gardirop');await page.waitForFunction(()=>window.formaDebug?.state?.design?.params?.assemblySystem==='hettich-71833-assembly-trial');await page.locator('[data-tab="deliver"]').click();
 const saved=await page.evaluate(()=>JSON.stringify(formaDebug.state.design)),storage=await page.evaluate(()=>localStorage.getItem('aura-forma-project'));
 await page.locator('[data-act="modelInspection"]').click();const modal=page.locator('[data-model-inspection]');await page.waitForFunction(()=>document.querySelector('[data-model-inspection]')?.inspectionSceneStats?.shown>0);assert.equal(await page.evaluate(()=>innerWidth),390);
 const d=await modal.evaluate(h=>({parts:h.inspectionData.dimensions.part_count,ops:h.inspectionData.review.manufacturing.parts.reduce((s,p)=>s+p.operations.length,0),scene:h.inspectionSceneStats}));assert.equal(d.parts,92);assert.equal(d.ops,392);assert.equal(d.scene.errors.length,0);
 await modal.locator('[data-iv-inside]').click();await modal.locator('[data-iv-parts] button').first().click();assert.equal((await modal.evaluate(h=>h.inspectionSceneStats)).shown,1);await modal.locator('[data-iv-all]').click();
 await modal.locator('[data-iv-tab="parts"]').click();assert.equal(await modal.locator('tbody tr').count(),92);await modal.locator('[data-iv-filter]').fill('m1-side-L');assert.equal(await modal.locator('tbody tr').count(),1);
 await modal.locator('[data-iv-tab="ops"]').click();assert.equal(await modal.locator('tbody tr').count(),392);await modal.locator('[data-iv-tab="assembly"]').click();assert((await modal.textContent()).includes('Gerçek alet erişimi'));assert((await modal.textContent()).includes('71B3590'));assert((await modal.textContent()).includes('016181'));assert((await modal.textContent()).includes('89316'));
 await modal.locator('[data-iv-tab="hardware"]').click();await page.waitForFunction(()=>document.querySelector('[data-iv-hardware]')?.textContent.includes('9221544'));assert((await modal.textContent()).includes('Gerçek donanım hareketi doğrulanmadı'));assert((await modal.textContent()).includes('361231'));assert((await modal.textContent()).includes('Démos'));assert((await modal.textContent()).includes('hesap girişi'));await page.screenshot({path:resolve(out,'hardware-sources-390.png')});await modal.locator('[data-iv-tab="external"]').click();await page.waitForFunction(()=>document.querySelector('[data-iv-external]')?.textContent.includes('Eşleşen pilot girdisi'));assert((await modal.textContent()).includes('92 / 40 / 52'));assert((await modal.textContent()).includes('392'));await page.screenshot({path:resolve(out,'external-studio-390.png')});await modal.locator('[data-iv-tab="checks"]').click();assert((await modal.textContent()).includes('henüz çalıştırılmadı'));
 if(!process.env.AURA_FAST_UI){await modal.locator('[data-iv-run]').click();await page.waitForFunction(()=>document.querySelector('[data-iv-check-result]')?.textContent.includes('154'),null,{timeout:180000});
 await page.screenshot({path:resolve(out,'studio-checks-390.png')});}
 await modal.locator('[data-iv-tab="drawing"]').click();await modal.locator('img.iv-drawing').waitFor();await page.waitForFunction(()=>document.querySelector('img.iv-drawing')?.naturalWidth>0);
 await modal.locator('[data-iv-tab="model"]').click();if(!process.env.AURA_FAST_UI){await modal.locator('[data-iv-advanced] summary').click();await modal.locator('[data-iv-machined]').click();await page.waitForFunction(()=>document.querySelector('[data-iv-status]')?.textContent.startsWith('30 işlenmiş'),null,{timeout:180000});await page.screenshot({path:resolve(out,'studio-machined-390.png')});}
 if(!process.env.AURA_FAST_UI)await modal.locator('[data-iv-original]').click();await modal.locator('[data-iv-close]').click();assert.equal(await page.evaluate(()=>JSON.stringify(formaDebug.state.design)),saved);assert.equal(await page.evaluate(()=>localStorage.getItem('aura-forma-project')),storage);
 const designs=await page.evaluate(async()=>{const {normalizeDesign}=await import('/assets/forma/generate.js');return ['storage'].map((family,i)=>({id:'T'+i,qty:i+1,design:normalizeDesign({family,seed:2})}));});
 await page.evaluate(items=>localStorage.setItem('aura-forma-project',JSON.stringify({items})),designs);await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/tasarimci.html');await page.waitForFunction(()=>window.__atelier?.S?.items?.length===1);
 const before=await page.evaluate(()=>JSON.stringify(__atelier.S.items));await page.locator('[data-inspection-viewer]').click();
 for(let i=0;i<designs.length;i++){
  if(i)await page.locator('[data-iv-model]').selectOption(String(i));await page.waitForFunction(i=>document.querySelector('[data-model-inspection]')?.inspectionData?.id==='T'+i,i);await page.waitForFunction(()=>document.querySelector('[data-model-inspection]')?.inspectionSceneStats?.shown>0);
  const e=await page.locator('[data-model-inspection]').evaluate(h=>({family:h.inspectionData.design.family,count:h.inspectionData.dimensions.part_count,envelope:h.inspectionData.dimensions.model_envelope,scene:h.inspectionSceneStats}));assert.equal(e.family,designs[i].design.family);assert.deepEqual(e.scene.errors,[]);for(const [a,b]of[['min','min_mm'],['max','max_mm']])for(let k=0;k<3;k++)assert(Math.abs(e.scene.bounds[a][k]-e.envelope[b][k])<.003,'viewer envelope '+e.family+' '+JSON.stringify({view:e.scene.bounds,source:e.envelope}));
  await page.locator('[data-iv-tab="hardware"]').click();await page.waitForFunction(()=>document.querySelector('[data-iv-hardware]')?.textContent.includes('bu modele uygulanmaz'));await page.locator('[data-iv-tab="external"]').click();await page.waitForFunction(()=>document.querySelector('[data-iv-external]')?.textContent.includes('dondurulmuş pilot girdisinden farklı'));await page.screenshot({path:resolve(out,'external-mismatch-1440.png')});await page.locator('[data-iv-tab="parts"]').click();assert.equal(await page.locator('[data-model-inspection] tbody tr').count(),e.count);await page.locator('[data-iv-tab="model"]').click();results.push(e);console.log('PASS designer '+e.family);
 }
 await page.screenshot({path:resolve(out,'designer-bath-1440.png')});await page.locator('[data-iv-close]').click();assert.equal(await page.evaluate(()=>JSON.stringify(__atelier.S.items)),before);
 // Reopen after a changed source design: no stale snapshot reused.
 await page.evaluate(()=>{__atelier.S.items[0].design.params.width+=100;});await page.locator('[data-inspection-viewer]').click();await page.waitForFunction(()=>document.querySelector('[data-model-inspection]')?.inspectionData);assert.equal(await page.locator('[data-model-inspection]').evaluate(h=>h.inspectionData.design.params.width),designs[0].design.params.width+100);await page.locator('[data-iv-close]').click();
 await page.evaluate(async()=>{const {openInspectionViewer}=await import('/assets/forma/production/inspection-viewer.js');openInspectionViewer([{id:'bad<img>',name:'<img src=x onerror=window.unsafe=true>',qty:1,design:__atelier.S.items[0].design}]);});await page.waitForFunction(()=>document.querySelector('[data-model-inspection]')?.inspectionData?.id==='bad<img>');assert.equal(await page.locator('[data-model-inspection] img').count(),0);assert.equal(await page.evaluate(()=>window.unsafe),undefined);await page.locator('[data-iv-close]').click();assert.deepEqual(errors,[]);assert.deepEqual(downloads,[]);writeFileSync(resolve(out,'browser-external.json'),JSON.stringify({pass:true,widths:[390,1440],studio:{parts:92,ops:392,access:process.env.AURA_FAST_UI?null:154,machined:process.env.AURA_FAST_UI?null:30},designer:results,page_errors:errors,downloads,source_preserved:true},null,2));
}finally{await browser.close();server.close();}
