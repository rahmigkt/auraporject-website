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
 const context=await browser.newContext({viewport:{width:390,height:1000},acceptDownloads:true});
 await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
 await context.addInitScript(()=>{localStorage.setItem('aura-forma-lang',JSON.stringify('tr'));localStorage.setItem('aura-forma-guide-seen','1');localStorage.setItem('aura-forma-account-skip','1');});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/tasarla.html');await page.waitForFunction(()=>window.formaDebug?.state?.compiled);
 await page.locator('[data-tab="deliver"]').click();assert.equal(await page.locator('[data-temporary-inspection]').count(),0);
 await page.goto(base+'/tasarla.html?uretim-inceleme=1&ornek-uretim=gardirop');
 await page.waitForFunction(()=>window.formaDebug?.state?.design?.params?.assemblySystem==='hettich-71833-assembly-trial');
 await page.locator('[data-tab="deliver"]').click();assert.equal(await page.evaluate(()=>innerWidth),390);
 await page.locator('[data-act="currentInspectionPdf"]').click();
 await page.locator('[data-inspection-download]').waitFor({timeout:240000});
 const evidence=await page.locator('[data-inspection-dialog]').evaluate(d=>({pages:d.inspectionPageCount,report:d.inspectionReports[0]}));
 assert.equal(evidence.report.manufacturing.parts.reduce((s,p)=>s+p.operations.length,0),392);assert.equal(evidence.report.access.rows.length,154);assert(evidence.report.access.rows.every(r=>!r.planned_stage_obstructions.length));assert.equal(evidence.report.production_approved,false);
 const downloading=page.waitForEvent('download');await page.locator('[data-inspection-download]').click();const dl=await downloading;await dl.saveAs(resolve(out,'AURA-montaj-inceleme.pdf'));
 writeFileSync(resolve(out,'inspection-report.json'),JSON.stringify(evidence,null,2));await page.screenshot({path:resolve(out,'project-pdf-390.png')});
 await page.locator('[data-inspection-close]').click();assert.equal(await page.locator('[data-inspection-dialog]').count(),0);
 await page.goto(base+'/tasarimci.html?ornek-uretim=gardirop');
 await page.waitForFunction(()=>window.__atelier?.S?.compiled);await page.waitForTimeout(2500);
 const original=await page.evaluate(()=>JSON.stringify(__atelier.S.compiled));
 await page.locator('[data-machined-preview]').click();await page.waitForFunction(()=>window.__atelier?.S?.machinedPreview,null,{timeout:180000});
 const preview=await page.evaluate(()=>({count:__atelier.S.machinedPreview.machined_parts,same:JSON.stringify(__atelier.S.compiled)}));assert(preview.count>=28);assert.equal(preview.same,original);
 await page.screenshot({path:resolve(out,'designer-machined-390.png')});
 await page.locator('[data-machined-reset]').click();await page.waitForFunction(()=>!__atelier.S.machinedPreview);
 assert.deepEqual(errors,[]);writeFileSync(resolve(out,'results.json'),JSON.stringify({passed:true,width:390,pages:evidence.pages,ops:392,access:154,machined_parts:preview.count,page_errors:errors},null,2));console.log('PASS local390 PDF and immutable machined preview',evidence.pages,preview.count);
 await context.close();
}finally{await browser.close();server.close();}
