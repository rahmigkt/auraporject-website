import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {launchIsolated,closeIsolated} from './isolated-browser.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),origin=process.env.ATMOSFER_ORIGIN;
const fixtures=JSON.parse(await fs.readFile(new URL('../../../knowledge/atmosfer/sahneler/ornekler/examples.json',import.meta.url)));
const fixture=fixtures.find(f=>f.id==='seating-medium-example-1');
const {browser,server}=await launchIsolated(chromium,{channel:'chrome',headless:true,args:['--no-proxy-server']});let passed=false;
const report={checks:[],errors:[]};
try{
 const page=await browser.newPage(),requests=[];page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(r.url().includes('/sahneler/'))requests.push(r.url());});
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(u.pathname.startsWith('/api/'))return r.fulfill({status:200,contentType:'application/json',body:'{"available":false}'});return r.continue();});
 await page.addInitScript(d=>{localStorage.setItem('aura-forma-design-seating',JSON.stringify(d));localStorage.setItem('aura-forma-project',JSON.stringify({items:[{id:'U1',design:d}]}));localStorage.setItem('aura-forma-guide-seen','true');localStorage.setItem('aura-forma-account-skip','1');},fixture.design);
 await page.goto(origin+'/tasarla.html?lang=tr');await page.locator('[data-tab="deliver"]').click();await page.locator('#plateTexture').waitFor();
 assert.equal(requests.length,0);report.checks.push('No plate/HDR loaded before a scene is requested');
 await page.locator('#plateTexture').selectOption('TOPRAK');await page.waitForFunction(()=>!document.querySelector('#plateCanvas').hidden,{timeout:180000});
 assert(requests.every(url=>url.includes('seating-medium-TOPRAK-SABAH')));report.checks.push('Only selected JSON/JPEG/HDR loaded; actual product rendered');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aura-forma-project')).atmosphere);assert.equal(saved.texture,'TOPRAK');assert.equal(saved.light,'SABAH');report.checks.push('Selection persisted with project');
 // Leave and return without reloading the whole application.
 await page.locator('[data-tab="parts"]').click();await page.locator('[data-tab="deliver"]').click();await page.locator('#plateTexture').waitFor();assert.equal(await page.locator('#plateTexture').inputValue(),'TOPRAK');report.checks.push('Selection restored when returning to project');
 assert.equal(report.errors.length,0);passed=true;
}finally{report.passed=passed;report.cleanup=await closeIsolated(browser,server);await fs.writeFile(new URL('../../../knowledge/atmosfer/sahneler/ui-check.json',import.meta.url),JSON.stringify(report,null,2));}
process.exit(passed?0:1);
