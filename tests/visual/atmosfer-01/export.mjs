const origin=process.env.ATMOSFER_ORIGIN||'http://127.0.0.1:8772';
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {launchIsolated,closeIsolated} from './isolated-browser.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {browser,server}=await launchIsolated(chromium,{channel:'chrome',headless:true,args:['--no-proxy-server']});
let passed=false;
try{
 const page=await browser.newPage();await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||u.protocol==='data:'?r.continue():r.abort();});await page.goto(origin+'/tests/visual/atmosfer-01/review.html');await page.waitForFunction(()=>window.reviewReady);
 const fixtures=JSON.parse(await fs.readFile(new URL('./designs.json',import.meta.url)));
 const output=process.env.ATMOSFER_EXPORT_DIR;if(!output)throw Error('ATMOSFER_EXPORT_DIR required');await fs.mkdir(output,{recursive:true});
 for(const f of fixtures.filter(f=>!process.env.ATMOSFER_IDS||process.env.ATMOSFER_IDS.split(',').includes(f.id))){console.log('export '+f.id);const result=await page.evaluate(id=>window.exportFinal(id),f.id);await fs.writeFile(`${output}/${f.id}.glb`,Buffer.from(result.base64,'base64'));await fs.writeFile(`${output}/${f.id}.json`,JSON.stringify(result.metadata,null,2));}
 passed=true;
}catch(error){console.error(error);throw error;}
finally{console.log('Isolated browser cleanup:',JSON.stringify(await closeIsolated(browser,server)));process.exit(passed?0:1);}
